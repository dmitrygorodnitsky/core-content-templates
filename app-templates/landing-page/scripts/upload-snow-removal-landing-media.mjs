import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import https from "node:https";
import path from "node:path";
import process from "node:process";
import { snowEnvironmentArgument, requireEnvironmentOrigin, SNOW_CONTENT_DIR } from "./snow-removal-landing-environments.mjs";

const LIBRARY_CODE = "SERVICEWAND_SNOW_REMOVAL_LANDING";
const ORGANIZATION_CODE = "SERVICEWAND";
const CONTENT_TYPES = { ".webp": "image/webp", ".svg": "image/svg+xml", ".mp4": "video/mp4", ".woff2": "font/woff2" };
const KINDS = { ".mp4": "video", ".woff2": "font" };
const kindOf = (file) => KINDS[path.extname(file)] || "image";
const LIST_ENDPOINTS = { image: "image/list.json", video: "video/list.json", font: "media-asset/list.json" };
const publicMediaPath = (file, id) => ({
  image: `/core/image/${id}/get/${file}`,
  video: `/core/api/video/${id}/stream/${file}`,
  font: `/core/api/media-asset/${id}/get`,
})[kindOf(file)];

const mediaDir = path.join(SNOW_CONTENT_DIR, "media");

const args = process.argv.slice(2);
const environment = snowEnvironmentArgument(args);
const mediaJson = environment.mediaFile;
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};
const live = args.includes("--live");
const baseUrl = String(option("--base-url", environment.origin)).replace(/\/+$/, "");
if (!/^https:\/\/[a-z0-9.-]+$/.test(baseUrl)) throw new Error("--base-url must be an https origin");
requireEnvironmentOrigin(environment, baseUrl);
if (new URL(baseUrl).hostname === "servicewand.com" && !args.includes("--allow-production")) throw new Error("Refusing to target production without --allow-production");

function send(url, { method = "GET", headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const request = https.request(new URL(url), { method, agent: false, timeout: 120000, headers: { ...headers, Connection: "close", ...(body ? { "Content-Length": body.length } : {}) } }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("aborted", () => reject(new Error("aborted " + url)));
      response.on("end", () => resolve({ status: response.statusCode, headers: response.headers, bytes: Buffer.concat(chunks) }));
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
      const text = response.bytes.toString();
      if (response.status < 200 || response.status >= 300) throw new Error((options?.method || "GET") + " " + url + " -> " + response.status + ": " + text.slice(0, 300));
      return text ? JSON.parse(text) : null;
    } catch (error) {
      if (attempt >= attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
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
  const parent = environment.mediaLibraryParent && (await first("media-library", environment.mediaLibraryParent, mappings));
  const organization = await first("organization", ORGANIZATION_CODE, mappings);
  if ((environment.mediaLibraryParent && !parent) || !organization) throw new Error("The parent library or the organization is missing");
  await call("media-library/save.json", {
    entities: [{ code: LIBRARY_CODE, nls: { en: { NAME: "Snow Removal landing" } }, organization: { id: organization.id }, ...(parent ? { parent: { id: parent.id } } : {}) }],
    mappings: [...names("code", "nls"), { name: "organization", type: "identifier", mappings: names("id") }, { name: "parent", type: "identifier", mappings: names("id") }],
  }, 1);
  const created = await first("media-library", LIBRARY_CODE, mappings);
  if (!created) throw new Error("The library was not created");
  return created.id;
}

async function listed(library, name) {
  const filters = [{ property: "mediaLibrary.id", operator: "=", type: "LONG", value: library }, { property: "name", operator: "=", type: "STRING", value: name }];
  const rows = (await call(LIST_ENDPOINTS[kindOf(name)], { filters, mappings: names("id", "name", "created"), offset: 0, pageSize: 20 })).result || [];
  return rows.sort((a, b) => String(b.created).localeCompare(String(a.created)))[0];
}

async function upload(library, file, bytes) {
  const boundary = "----snow-removal-landing-" + createHash("sha256").update(bytes).digest("hex").slice(0, 24);
  const body = Buffer.concat([
    Buffer.from("--" + boundary + '\r\nContent-Disposition: form-data; name="files"; filename="' + file + '"\r\nContent-Type: ' + CONTENT_TYPES[path.extname(file)] + "\r\n\r\n"),
    bytes,
    Buffer.from("\r\n--" + boundary + '\r\nContent-Disposition: form-data; name="library"\r\n\r\n' + library + "\r\n--" + boundary + "--\r\n"),
  ]);
  const response = await send(baseUrl + "/core/api/media/save.json?library=" + library, { method: "POST", headers: { ...authorization, "Content-Type": "multipart/form-data; boundary=" + boundary }, body });
  if (response.status !== 200) throw new Error("Upload of " + file + " -> " + response.status + ": " + response.bytes.toString().slice(0, 300));
}

async function served(id, name, bytes) {
  const response = await send(baseUrl + publicMediaPath(name, id));
  return { status: response.status, type: response.headers["content-type"], identical: response.bytes.equals(bytes), size: response.bytes.length };
}

let media = {};
try {
  media = JSON.parse(await fs.readFile(mediaJson, "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const files = (await fs.readdir(mediaDir)).filter((file) => CONTENT_TYPES[path.extname(file)]).sort();
const library = await ensureLibrary();
const next = {};
for (const file of files) {
  const bytes = await fs.readFile(path.join(mediaDir, file));
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const current = media[file];
  if (current && current.sha256 === sha256) {
    next[file] = current;
    console.log(file + ": already uploaded " + current.id);
    continue;
  }
  if (!live) {
    console.log(file + ": would upload " + bytes.length + " bytes");
    continue;
  }
  let row;
  let check;
  for (let attempt = 1; !row; attempt += 1) {
    const candidate = await listed(library, file);
    check = candidate && (await served(candidate.id, file, bytes).catch(() => null));
    if (check?.identical) {
      row = candidate;
      break;
    }
    if (attempt > 6) throw new Error(file + " could not be uploaded to library " + library);
    await upload(library, file, bytes).catch((error) => console.log(file + ": attempt " + attempt + " failed, " + error.message));
    await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
  }
  next[file] = { id: row.id, name: file, kind: kindOf(file), sha256 };
  console.log(file + ": " + row.id + " " + JSON.stringify(check));
}
if (live) await fs.writeFile(mediaJson, JSON.stringify(next, null, 2) + "\n");
console.log((live ? "LIVE " : "DRY RUN ") + baseUrl + " library " + LIBRARY_CODE + " " + (library ?? "(new, parent " + (environment.mediaLibraryParent ?? "none") + ")") + " -> " + environment.mediaName);
