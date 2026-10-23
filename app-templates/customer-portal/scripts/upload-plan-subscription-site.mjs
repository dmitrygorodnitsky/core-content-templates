import fs from "node:fs/promises";
import https from "node:https";
import path from "node:path";
import process from "node:process";

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};

const usage = `Usage:
  SERVICEWAND_API_KEY_FILE=<file> node app-templates/customer-portal/scripts/upload-plan-subscription-site.mjs \\
    --base-url https://dev-1.servicewand.com [--package <package.json>] [--live] [--allow-production]

Adds the plan-subscription sections under the site root template, their include
lines, and their PageContexts. Without --live nothing is written.`;

if (flag("--help")) {
  console.log(usage);
  process.exit(0);
}

const baseUrl = String(option("--base-url", "")).replace(/\/+$/, "");
const packagePath = path.resolve(option("--package", "app-templates/customer-portal/dist/manual-upload/plan-subscription-site/package.json"));
const live = flag("--live");
if (!/^https:\/\/[a-z0-9.-]+$/.test(baseUrl)) throw new Error("--base-url must be an https origin\n" + usage);
if (new URL(baseUrl).hostname === "servicewand.com" && !flag("--allow-production")) throw new Error("Refusing to target production without --allow-production");

const pkg = JSON.parse(await fs.readFile(packagePath, "utf8"));

async function secret(name) {
  if (process.env[name] && process.env[name].trim()) return process.env[name].trim();
  const file = process.env[name + "_FILE"];
  return file ? (await fs.readFile(file, "utf8")).trim() : "";
}

function send(url, options = {}) {
  return new Promise((resolve, reject) => {
    const body = options.body === undefined ? null : Buffer.from(String(options.body));
    const headers = { ...(options.headers || {}), Connection: "close", ...(body ? { "Content-Length": body.length } : {}) };
    const request = https.request(new URL(url), { method: options.method || "GET", agent: false, headers }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () => resolve({ status: response.statusCode, node: response.headers["x-node-id"] || "", text: Buffer.concat(chunks).toString() }));
    });
    request.on("error", reject);
    request.end(body);
  });
}

async function json(url, options = {}, attempts = 1) {
  for (let attempt = 1; ; attempt++) {
    let response;
    try {
      response = await send(url, options);
    } catch (error) {
      if (attempt >= attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 800));
      continue;
    }
    if (response.status < 200 || response.status >= 300) throw new Error(`${options.method || "GET"} ${url} -> ${response.status}: ${response.text.slice(0, 500)}`);
    return response.text ? JSON.parse(response.text) : null;
  }
}

async function accessToken() {
  const bearer = await secret("SERVICEWAND_BEARER");
  if (bearer) return bearer;
  const apiKey = await secret("SERVICEWAND_API_KEY");
  if (!apiKey) throw new Error("Missing SERVICEWAND_API_KEY(_FILE) or SERVICEWAND_BEARER(_FILE)");
  const metadata = await json(`${baseUrl}/core/.well-known/oauth-protected-resource`, {}, 4);
  const openid = await json(`${metadata.authorization_servers[0]}/.well-known/openid-configuration`, {}, 4);
  const token = await json(openid.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "X-API-Key": apiKey },
    body: new URLSearchParams({ grant_type: "api_key", scope: "openid" }),
  }, 4);
  return token.access_token;
}

const token = await accessToken();
const call = (service, apiPath, body) => json(`${baseUrl}/${service}/api/${apiPath}`, {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json", "X-Organization-Code": "SYSTEM" },
  body: JSON.stringify(body),
}, /\/(list|get)\.json/.test(apiPath) ? 4 : 1);
const names = (fields) => fields.map((name) => ({ name }));
const list = async (service, entity, filters, mappings) => (await call(service, `${entity}/list.json`, { filters, mappings, offset: 0, pageSize: 200 })).result || [];
const byCode = (code) => [{ property: "code", operator: "=", type: "STRING", value: code }];

const TEMPLATE_FIELDS = ["id", "code", "nls", "templateLanguage", "advanced", "head", "html", "javascript", "css", "optimistic", "parameters"];
const templateRead = [...names(TEMPLATE_FIELDS), { name: "organization", type: "identifier", mappings: names(["id"]) }];
const templateSave = [...names(TEMPLATE_FIELDS), { name: "organization", type: "identifier", mappings: names(["id"]) }, { name: "parent", type: "identifier", mappings: names(["id"]) }];
const PAGE_FIELDS = ["id", "optimistic", "url", "site", "excludeFromSeo", "values", "enabledTemplates", "permissions"];
const pageRead = [...names(PAGE_FIELDS), { name: "organization", type: "identifier", mappings: names(["id", "code"]) }, { name: "template", type: "identifier", mappings: names(["id", "code"]) }];
const pageSave = [...names(PAGE_FIELDS), { name: "organization", type: "identifier", mappings: names(["id"]) }, { name: "template", type: "identifier", mappings: names(["id"]) }];

const roots = (await list("core-cms", "block-template", byCode(pkg.rootCode), [...names(["id", "code"]), { name: "parent", type: "identifier", mappings: names(["id"]) }])).filter((row) => !row.parent);
if (roots.length !== 1) throw new Error(`Expected exactly one root ${pkg.rootCode}, found ${roots.length}`);
const root = await call("core-cms", `block-template/get.json?id=${roots[0].id}`, [...templateRead, { name: "children", type: "collection", mappings: names(["id", "code"]) }]);
const [pageOrganization] = await list("core", "organization", byCode(pkg.pageOrganizationCode), names(["id", "code"]));
if (!pageOrganization) throw new Error(`Organization ${pkg.pageOrganizationCode} not found`);

const plan = [];
const sectionIds = {};

for (const section of pkg.sections) {
  const existingRef = (root.children || []).find((child) => child.code === section.code);
  const existing = existingRef ? await call("core-cms", `block-template/get.json?id=${existingRef.id}`, templateRead) : null;
  const parameters = section.parameters.map((parameter) => {
    const current = existing && (existing.parameters || []).find((item) => item.code === parameter.code);
    const kept = current && current.value !== undefined && current.value !== null && current.value !== "";
    return kept ? { ...parameter, value: current.value } : parameter;
  });
  const entity = {
    ...section,
    parameters,
    organization: { id: existing ? existing.organization.id : root.organization.id },
    parent: { id: root.id },
    ...(existing ? { id: existing.id, optimistic: existing.optimistic } : {}),
  };
  plan.push(`${existing ? "update" : "create"} section ${section.code}${existing ? " " + existing.id : ""}`);
  if (live) {
    const saved = await call("core-cms", "block-template/save.json", { entities: [entity], mappings: templateSave });
    sectionIds[section.code] = String(Array.isArray(saved) ? saved[0] : saved).replace(/^"|"$/g, "");
  } else {
    sectionIds[section.code] = existing ? existing.id : `<new ${section.code}>`;
  }
}

const includeLine = (id, code) => `@* include id="${id}" code="${code}" suffix="" *@`;
const footer = (root.children || []).find((child) => child.code === "FOOTER");
if (!footer) throw new Error("Root has no FOOTER child to anchor body includes");
let head = root.head || "";
let html = root.html || "";
for (const section of pkg.sections) {
  const id = sectionIds[section.code];
  const line = includeLine(id, section.code);
  const stale = new RegExp(`@\\* include id="[^"]*" code="${section.code}" suffix="" \\*@`);
  for (const [field, value] of [["head", head], ["html", html]]) {
    let next = value;
    if (next.includes(line)) continue;
    if (stale.test(next)) next = next.replace(stale, line);
    else if (field === "head") {
      const lines = next.split("\n");
      const last = lines.reduce((at, text, index) => (/^@\* include /.test(text.trim()) ? index : at), -1);
      lines.splice(last + 1, 0, line);
      next = lines.join("\n");
    } else {
      const anchor = new RegExp(`^([ \\t]*)@\\* include id="${footer.id}" code="FOOTER" suffix="" \\*@`, "m");
      const match = next.match(anchor);
      if (!match) throw new Error("Root html has no FOOTER include line");
      next = next.replace(anchor, `${match[1]}${line}\n${match[0]}`);
    }
    plan.push(`root ${field}: include ${section.code}`);
    if (field === "head") head = next;
    else html = next;
  }
}
if (head !== root.head || html !== root.html) {
  if (live) {
    const { children: _children, ...rest } = root;
    await call("core-cms", "block-template/save.json", { entities: [{ ...rest, head, html, organization: { id: root.organization.id } }], mappings: [...names(TEMPLATE_FIELDS), { name: "organization", type: "identifier", mappings: names(["id"]) }] });
  }
}

const pages = await list("core-cms", "page-context", [], [...names(["id", "url"]), { name: "template", type: "identifier", mappings: names(["id", "code"]) }]);
const pageByUrl = (url) => pages.filter((page) => page.url === url && page.template && page.template.id === root.id);
for (const spec of pkg.pages) {
  const [referenceRef] = pageByUrl(spec.reference);
  if (!referenceRef) throw new Error(`Reference page ${spec.reference} not found under ${pkg.rootCode}`);
  const reference = await call("core-cms", `page-context/get.json?id=${referenceRef.id}`, pageRead);
  const referenceSection = (root.children || []).find((child) => child.code === "REQUEST_DEMO");
  const sectionId = sectionIds[spec.section];
  const values = {};
  for (const [templateId, params] of Object.entries(reference.values || {})) if (templateId !== referenceSection.id) values[templateId] = params;
  if (spec.organizationIdParameter) values[sectionId] = { [spec.organizationIdParameter]: pageOrganization.id };
  const existingRefs = pageByUrl(spec.url);
  if (existingRefs.length > 1) throw new Error(`Page ${spec.url} is ambiguous`);
  const existing = existingRefs[0] ? await call("core-cms", `page-context/get.json?id=${existingRefs[0].id}`, pageRead) : null;
  const entity = {
    url: spec.url,
    site: reference.site ?? null,
    excludeFromSeo: spec.excludeFromSeo ?? reference.excludeFromSeo ?? false,
    values,
    enabledTemplates: (reference.enabledTemplates || []).filter((id) => id !== referenceSection.id).concat(sectionId),
    permissions: existing ? existing.permissions : reference.permissions || [],
    organization: { id: pageOrganization.id },
    template: { id: root.id },
    ...(existing ? { id: existing.id, optimistic: existing.optimistic } : {}),
  };
  plan.push(`${existing ? "update" : "create"} page ${spec.url} (${entity.enabledTemplates.length} enabled templates, organization ${pkg.pageOrganizationCode})`);
  if (live) await call("core-cms", "page-context/save.json", { entities: [entity], mappings: pageSave });
}

if (live) {
  const cleared = new Set();
  for (let attempt = 0; attempt < 8 && cleared.size < 2; attempt++) {
    const response = await send(`${baseUrl}/core-cms/api/block-template/clear-cache.json?id=${root.id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json", "X-Organization-Code": "SYSTEM" },
      body: "{}",
    }).catch(() => null);
    if (response && response.status === 200) cleared.add(response.node);
  }
  plan.push(`cleared root render cache on ${[...cleared].join(", ") || "no node"}`);
}

console.log(`${live ? "LIVE" : "DRY RUN"} ${baseUrl} root ${pkg.rootCode} ${root.id}`);
for (const step of plan) console.log("  " + step);
if (!live) console.log("No writes were made. Pass --live to apply.");
