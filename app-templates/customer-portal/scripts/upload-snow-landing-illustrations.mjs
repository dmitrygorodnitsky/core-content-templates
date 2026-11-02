import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import https from "node:https";
import path from "node:path";
import process from "node:process";

import { illustrationMediaPath, illustrationSlots, illustrationsRoot } from "./landing-illustrations.mjs";

const LIBRARY_CODE = "SNOWLIMITLESS_LANDING";
const PARENT_LIBRARY_CODE = "SNOWLIMITLESS";
const ORGANIZATION_CODE = "SNOWLIMITLESS";

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};
const live = args.includes("--live");
const baseUrl = String(option("--base-url", "https://dev-1.servicewand.com")).replace(/\/+$/, "");
if (!/^https:\/\/[a-z0-9.-]+$/.test(baseUrl)) throw new Error("--base-url must be an https origin");
if (new URL(baseUrl).hostname === "servicewand.com" && !args.includes("--allow-production")) throw new Error("Refusing to target production without --allow-production");

function send(url, { method = "GET", headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const request = https.request(new URL(url), { method, agent: false, timeout: 60000, headers: { ...headers, Connection: "close", ...(body ? { "Content-Length": body.length } : {}) } }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => resolve({ status: response.statusCode, text: Buffer.concat(chunks).toString() }));
    });
    request.on("timeout", () => request.destroy(new Error("timeout " + url)));
    request.on("error", reject);
    request.end(body);
  });
}

async function json(url, options, attempts = 6) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const response = await send(url, options);
      if (response.status < 200 || response.status >= 300) throw new Error((options?.method || "GET") + " " + url + " -> " + response.status + ": " + response.text.slice(0, 400));
      return response.text ? JSON.parse(response.text) : null;
    } catch (error) {
      if (attempt >= attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 800));
    }
  }
}

async function accessToken() {
  const apiKey = String(process.env.SERVICEWAND_API_KEY || "").trim();
  if (!apiKey) throw new Error("Missing SERVICEWAND_API_KEY");
  const metadata = await json(baseUrl + "/core/.well-known/oauth-protected-resource");
  const openid = await json(metadata.authorization_servers[0] + "/.well-known/openid-configuration");
  const form = Buffer.from(new URLSearchParams({ grant_type: "api_key", scope: "openid" }).toString());
  const token = await json(openid.token_endpoint, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "X-API-Key": apiKey }, body: form });
  return token.access_token;
}

const token = await accessToken();
const authorization = { Authorization: "Bearer " + token, Accept: "application/json", "X-Organization-Code": "SYSTEM" };
const call = (apiPath, body, attempts) => json(baseUrl + "/core/api/" + apiPath, { method: "POST", headers: { ...authorization, "Content-Type": "application/json" }, body: Buffer.from(JSON.stringify(body)) }, attempts);
const names = (...fields) => fields.map((name) => ({ name }));
const byCode = (code) => [{ property: "code", operator: "=", type: "STRING", value: code }];
const first = async (entity, code, mappings) => (await call(entity + "/list.json", { filters: byCode(code), mappings, offset: 0, pageSize: 2 })).result?.[0];

async function ensureLibrary() {
  const mappings = names("id", "code");
  const existing = await first("media-library", LIBRARY_CODE, mappings);
  if (existing) return existing.id;
  if (!live) return null;
  const parent = await first("media-library", PARENT_LIBRARY_CODE, mappings);
  const organization = await first("organization", ORGANIZATION_CODE, mappings);
  if (!parent || !organization) throw new Error("The parent library or the organization is missing");
  await call("media-library/save.json", {
    entities: [{ code: LIBRARY_CODE, nls: { en: { NAME: "Landing illustrations" } }, organization: { id: organization.id }, parent: { id: parent.id } }],
    mappings: [...names("code", "nls"), { name: "organization", type: "identifier", mappings: names("id") }, { name: "parent", type: "identifier", mappings: names("id") }],
  }, 1);
  const created = await first("media-library", LIBRARY_CODE, mappings);
  if (!created) throw new Error("The library was not created");
  return created.id;
}

async function uploaded(library, name) {
  const filters = [{ property: "mediaLibrary.id", operator: "=", type: "LONG", value: library }, { property: "name", operator: "=", type: "STRING", value: name }];
  const rows = (await call("image/list.json", { filters, mappings: names("id", "name", "created"), offset: 0, pageSize: 20 })).result || [];
  return rows.sort((a, b) => String(b.created).localeCompare(String(a.created)))[0];
}

async function upload(library, item, bytes) {
  const boundary = "----snow-landing-" + createHash("sha256").update(bytes).digest("hex").slice(0, 24);
  const body = Buffer.concat([
    Buffer.from("--" + boundary + '\r\nContent-Disposition: form-data; name="files"; filename="' + item.file + '"\r\nContent-Type: image/webp\r\n\r\n'),
    bytes,
    Buffer.from("\r\n--" + boundary + '\r\nContent-Disposition: form-data; name="library"\r\n\r\n' + library + "\r\n--" + boundary + "--\r\n"),
  ]);
  const response = await send(baseUrl + "/core/api/media/save.json?library=" + library, { method: "POST", headers: { ...authorization, "Content-Type": "multipart/form-data; boundary=" + boundary }, body });
  if (response.status !== 200) throw new Error("Upload of " + item.file + " -> " + response.status + ": " + response.text.slice(0, 400));
}

async function servedPublicly(id, name, bytes) {
  const response = await new Promise((resolve, reject) => {
    const request = https.request(new URL(baseUrl + "/core/image/" + id + "/get/" + name), { agent: false, timeout: 60000, headers: { Connection: "close" } }, (reply) => {
      const chunks = [];
      reply.on("data", (chunk) => chunks.push(chunk));
      reply.on("end", () => resolve({ status: reply.statusCode, type: reply.headers["content-type"], cache: reply.headers["cache-control"], bytes: Buffer.concat(chunks) }));
    });
    request.on("timeout", () => request.destroy(new Error("timeout")));
    request.on("error", reject);
    request.end();
  });
  return { status: response.status, type: response.type, cache: response.cache, identical: response.bytes.equals(bytes), size: response.bytes.length };
}

let media = {};
try {
  media = JSON.parse(await fs.readFile(illustrationMediaPath(), "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const library = await ensureLibrary();
const next = {};
for (const item of illustrationSlots) {
  const bytes = await fs.readFile(path.join(illustrationsRoot, item.file)).catch((error) => {
    if (error.code === "ENOENT") return null;
    throw error;
  });
  if (!bytes) {
    console.log(item.name + ": no file, keeps its placeholder");
    continue;
  }
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const current = media[item.name];
  if (current && current.sha256 === sha256) {
    next[item.name] = current;
    console.log(item.name + ": already uploaded " + current.id);
    continue;
  }
  if (!live) {
    console.log(item.name + ": would upload " + bytes.length + " bytes");
    continue;
  }
  let row;
  let served;
  for (let attempt = 1; !row; attempt += 1) {
    const listed = await uploaded(library, item.file);
    served = listed && (await servedPublicly(listed.id, item.file, bytes).catch(() => null));
    if (served?.identical) {
      row = listed;
      break;
    }
    if (attempt > 6) throw new Error(item.file + " could not be uploaded to library " + library);
    await upload(library, item, bytes).catch((error) => console.log(item.name + ": attempt " + attempt + " failed, " + error.message));
    await new Promise((resolve) => setTimeout(resolve, attempt * 800));
  }
  next[item.name] = { id: row.id, name: item.file, sha256 };
  console.log(item.name + ": " + row.id + " " + JSON.stringify(served));
}
if (live) await fs.writeFile(illustrationMediaPath(), JSON.stringify(next, null, 2) + "\n");
console.log((live ? "LIVE " : "DRY RUN ") + baseUrl + " library " + LIBRARY_CODE + " " + library);
