import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const landingRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGE = path.join(landingRoot, "dist", "manual-upload", "snow-removal-software", "cms-family.payload.json");
const SLOT = "<!-- cms-child-slot:ROOT_SECTIONS -->";

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};
const usage = `Usage:
  SERVICEWAND_API_KEY=... node app-templates/landing-page/scripts/wire-snow-removal-landing-page.mjs \\
    --base-url https://dev-1.servicewand.com --page-url /industries/field-service/snow-removal-software-new [--live]

Run after upload-cms-family.mjs has created the four SNOW_REMOVAL_LANDING*
templates. Links the three children to the new root through reparent.json
(save.json refuses a parent change), writes the root include
lines, creates the PageContext (organization SERVICEWAND) at --page-url if it
does not exist, and clears the root render cache on every CMS node. It refuses
to touch a template outside the package or a page that uses another root.
Without --live nothing is written.`;

if (args.includes("--help")) {
  console.log(usage);
  process.exit(0);
}
const live = args.includes("--live");
const baseUrl = String(option("--base-url", "")).replace(/\/+$/, "");
const pageUrl = String(option("--page-url", ""));
const pageOrganizationCode = option("--page-org", "SERVICEWAND");
if (!/^https:\/\/[a-z0-9.-]+$/.test(baseUrl)) throw new Error("--base-url must be an https origin\n" + usage);
if (!/^\/[a-z0-9/_-]+$/.test(pageUrl)) throw new Error("--page-url must be a site path\n" + usage);
if (new URL(baseUrl).hostname === "servicewand.com" && !args.includes("--allow-production")) throw new Error("Refusing to target production without --allow-production");

const pkg = JSON.parse(fs.readFileSync(PACKAGE, "utf8"));

function send(url, options = {}) {
  return new Promise((resolve, reject) => {
    const body = options.body === undefined ? null : Buffer.from(String(options.body));
    const headers = { ...(options.headers || {}), Connection: "close", ...(body ? { "Content-Length": body.length } : {}) };
    const request = https.request(new URL(url), { method: options.method || "GET", agent: false, timeout: 120000, headers }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("aborted", () => reject(new Error("aborted " + url)));
      response.on("end", () => resolve({ status: response.statusCode, node: response.headers["x-node-id"] || "", text: Buffer.concat(chunks).toString() }));
    });
    request.on("timeout", () => request.destroy(new Error("timeout " + url)));
    request.on("error", reject);
    request.end(body);
  });
}

async function json(url, options = {}, attempts = 1) {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const response = await send(url, options);
      if (response.status < 200 || response.status >= 300) throw new Error(`${options.method || "GET"} ${url} -> ${response.status}: ${response.text.slice(0, 400)}`);
      return response.text ? JSON.parse(response.text) : null;
    } catch (error) {
      if (attempt >= attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
}

async function accessToken() {
  const apiKey = String(process.env.SERVICEWAND_API_KEY || "").trim();
  if (!apiKey) throw new Error("Missing SERVICEWAND_API_KEY");
  const metadata = await json(`${baseUrl}/core/.well-known/oauth-protected-resource`, {}, 5);
  const openid = await json(`${metadata.authorization_servers[0]}/.well-known/openid-configuration`, {}, 5);
  const token = await json(openid.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "X-API-Key": apiKey },
    body: new URLSearchParams({ grant_type: "api_key", scope: "openid" }),
  }, 5);
  return token.access_token;
}

const token = await accessToken();
const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json", "X-Organization-Code": "SYSTEM" };
const call = (service, apiPath, body, attempts) => json(`${baseUrl}/${service}/api/${apiPath}`, { method: "POST", headers, body: JSON.stringify(body) }, attempts ?? (/(list|get)\.json/.test(apiPath) ? 5 : 1));
const names = (fields) => fields.map((name) => ({ name }));
const identifier = (name, fields = ["id"]) => ({ name, type: "identifier", mappings: names(fields) });
const byCode = (code) => [{ property: "code", operator: "=", type: "STRING", value: code }];

const TEMPLATE_FIELDS = ["id", "code", "nls", "templateLanguage", "advanced", "head", "html", "javascript", "css", "optimistic", "parameters"];
const templateRead = [...names(TEMPLATE_FIELDS), identifier("organization", ["id", "code"]), identifier("parent", ["id", "code"])];
const templateSave = [...names(TEMPLATE_FIELDS), identifier("organization"), identifier("parent")];
const PAGE_FIELDS = ["id", "optimistic", "url", "excludeFromSeo", "values", "enabledTemplates", "permissions"];
const pageRead = [...names(PAGE_FIELDS), identifier("organization", ["id", "code"]), identifier("template", ["id", "code"])];
const pageSave = [...names(PAGE_FIELDS), identifier("organization"), identifier("template")];

const readTemplate = async (code) => {
  const rows = (await call("core-cms", "block-template/list.json", { filters: byCode(code), mappings: names(["id", "code"]), offset: 0, pageSize: 5 })).result || [];
  const matches = rows.filter((row) => row.code === code);
  if (matches.length !== 1) throw new Error(`Expected exactly one template ${code}, found ${matches.length}. Upload the package with upload-cms-family.mjs first.`);
  return call("core-cms", `block-template/get.json?id=${matches[0].id}`, templateRead);
};

const root = await readTemplate(pkg.root.code);
if (root.parent?.id) throw new Error(`${root.code} must be a root template, but it has parent ${root.parent.code}`);
const children = [];
for (const child of pkg.children) {
  const record = await readTemplate(child.code);
  if (record.parent?.id && record.parent.id !== root.id) throw new Error(`${child.code} already belongs to ${record.parent.code}; refusing to move it`);
  children.push(record);
}

const isEmpty = (value) => value === null || value === undefined || value === "" || (typeof value === "object" && Object.keys(value).length === 0);
const withoutEmpty = (value) => {
  if (Array.isArray(value)) return value.map(withoutEmpty).filter((item) => !isEmpty(item));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, withoutEmpty(item)]).filter(([, item]) => !isEmpty(item)));
  return value;
};

const plan = [];
const saveTemplate = async (record, changes) => {
  const { parent, organization, ...rest } = record;
  const entity = { ...rest, ...changes, organization: { id: organization.id } };
  if (parent?.id) entity.parent = { id: parent.id };
  if (live) await call("core-cms", "block-template/save.json", { entities: [withoutEmpty(entity)], mappings: templateSave });
};

for (const [order, child] of children.entries()) {
  if (child.parent?.id === root.id) {
    plan.push(`keep ${child.code} ${child.id} under ${root.code}`);
    continue;
  }
  plan.push(`link ${child.code} ${child.id} under ${root.code} ${root.id} at position ${order}`);
  if (live) await json(`${baseUrl}/core-cms/api/block-template/reparent.json`, { method: "PUT", headers, body: JSON.stringify({ id: child.id, parentId: root.id, order }) });
}

const includes = children.map((child) => `@* include id="${child.id}" code="${child.code}" suffix="" *@`).join("\n");
const baseHead = String(root.head || "").replace(/\n@\* include [^\n]*\*@/g, "");
const head = `${baseHead}\n${includes}`;
const html = String(pkg.root.html).replace(SLOT, includes.replace(/\n/g, "\n  "));
if (html === pkg.root.html) throw new Error("The packaged root html has no child slot");
if (head !== root.head || html !== root.html) {
  plan.push(`write ${root.code} include lines for ${children.map((child) => child.code).join(", ")}`);
  await saveTemplate(root, { head, html });
} else {
  plan.push(`keep ${root.code} include lines`);
}

const [organization] = (await call("core", "organization/list.json", { filters: byCode(pageOrganizationCode), mappings: names(["id", "code"]), offset: 0, pageSize: 2 })).result || [];
if (!organization) throw new Error(`Organization ${pageOrganizationCode} not found`);
const pages = ((await call("core-cms", "page-context/list.json", { filters: [], mappings: [...names(["id", "url"]), identifier("template", ["id", "code"])], offset: 0, pageSize: 1000 })).result || []).filter((page) => page.url === pageUrl);
if (pages.length > 1) throw new Error(`Page ${pageUrl} is ambiguous`);
const enabledTemplates = children.map((child) => child.id);
if (pages[0] && pages[0].template?.id !== root.id) throw new Error(`Page ${pageUrl} already exists with template ${pages[0].template?.code}; refusing to change it`);
if (pages[0]) {
  const page = await call("core-cms", `page-context/get.json?id=${pages[0].id}`, pageRead);
  const same = JSON.stringify([...page.enabledTemplates || []].sort()) === JSON.stringify([...enabledTemplates].sort()) && page.organization?.id === organization.id;
  if (same) plan.push(`keep page ${pageUrl} ${page.id}`);
  else {
    plan.push(`update page ${pageUrl} ${page.id}: enabled templates and organization`);
    if (live) await call("core-cms", "page-context/save.json", { entities: [{ ...page, enabledTemplates, organization: { id: organization.id }, template: { id: root.id } }], mappings: pageSave });
  }
} else {
  plan.push(`create page ${pageUrl} (organization ${organization.code}, root ${root.code}, ${enabledTemplates.length} enabled templates, excluded from SEO)`);
  if (live) await call("core-cms", "page-context/save.json", {
    entities: [{ url: pageUrl, excludeFromSeo: true, values: {}, enabledTemplates, permissions: [], organization: { id: organization.id }, template: { id: root.id } }],
    mappings: pageSave,
  });
}

if (live) {
  const cleared = new Map();
  for (let attempt = 0; attempt < 12 && cleared.size < 2; attempt += 1) {
    const response = await send(`${baseUrl}/core-cms/api/block-template/clear-cache.json?id=${root.id}`, { method: "POST", headers, body: "{}" }).catch(() => null);
    if (response && response.status === 200) cleared.set(response.node, (cleared.get(response.node) || 0) + 1);
  }
  plan.push(`cleared root render cache on ${[...cleared.keys()].join(", ") || "no node"}`);
}

console.log(`${live ? "LIVE" : "DRY RUN"} ${baseUrl} root ${root.code} ${root.id}`);
for (const child of children) console.log(`  template ${child.code} ${child.id}`);
for (const step of plan) console.log("  " + step);
if (!live) console.log("No writes were made. Pass --live to apply.");
