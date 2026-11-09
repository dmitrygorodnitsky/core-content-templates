import { spawnSync } from "node:child_process";
import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { exportSnowRemovalLanding } from "./export-snow-removal-landing-manual.mjs";
import { requireEnvironmentOrigin, snowEnvironmentArgument } from "./snow-removal-landing-environments.mjs";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const landingRoot = path.resolve(scriptsDir, "..");

export const MAIN_URL = "/industries/field-service/snow-removal-software";
export const NEW_URL = "/industries/field-service/snow-removal-software-new";
export const LEGACY_URL = "/internal/legacy/snow-removal-software-vertical-landing";
export const RETIRED_REDIRECT_URL = "/internal/retired/snow-removal-software-new-redirect";
export const NEW_ROOT_CODE = "SNOW_REMOVAL_LANDING";
export const OLD_ROOT_CODE = "VERTICAL_LANDING_JTE";
export const REDIRECT_CODE = "SNOW_REMOVAL_LANDING_NEW_REDIRECT";

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
};
const usage = `Usage:
  SERVICEWAND_API_KEY=... node app-templates/landing-page/scripts/switch-snow-removal-landing-url.mjs \\
    --env servicewand --base-url https://servicewand.com --allow-production \\
    [--expect-new-page 86] [--expect-old-page 72] [--email <call-center email html>] \\
    [--snapshot <file>] [--apply | --rollback --apply]

Moves the Snow Removal landing from ${NEW_URL} to ${MAIN_URL}:
  1. uploads the family exported for ${MAIN_URL} (JSON-LD, canonical, hreflang) and rewires it;
  2. moves the ${OLD_ROOT_CODE} page from ${MAIN_URL} to ${LEGACY_URL}, excluded from SEO;
  3. moves the ${NEW_ROOT_CODE} page to ${MAIN_URL} and includes it in SEO (sitemap);
  4. creates the ${REDIRECT_CODE} root template and a page at ${NEW_URL} that forwards to ${MAIN_URL}, keeping the /<lang> prefix, query and hash;
  5. clears the render cache of both Snow roots, rewrites the call-center email links;
  6. reads the result back.
--rollback reverses steps 4..1: the redirect page moves to ${RETIRED_REDIRECT_URL}, the Snow page returns to ${NEW_URL}
excluded from SEO, the old page returns to ${MAIN_URL} included in SEO, and the committed --env package is uploaded again.
Every step reads the live record first and skips work already done, so a rerun never duplicates a record.
Nothing is deleted. Without --apply nothing is written.`;

if (args.includes("--help")) {
  console.log(usage);
  process.exit(0);
}
const apply = args.includes("--apply");
const rollback = args.includes("--rollback");
const environment = snowEnvironmentArgument(args);
const baseUrl = String(option("--base-url", "")).replace(/\/+$/, "");
if (!/^https:\/\/[a-z0-9.-]+$/.test(baseUrl)) throw new Error("--base-url must be an https origin\n" + usage);
if (new URL(baseUrl).hostname === "servicewand.com" && !args.includes("--allow-production")) throw new Error("Refusing to target production without --allow-production");
requireEnvironmentOrigin(environment, baseUrl);
const expectNewPage = option("--expect-new-page") ? Number(option("--expect-new-page")) : null;
const expectOldPage = option("--expect-old-page") ? Number(option("--expect-old-page")) : null;
const emailFile = option("--email");
const snapshotFile = option("--snapshot");

const send = (url, options = {}) => new Promise((resolve, reject) => {
  const body = options.body === undefined ? null : Buffer.from(String(options.body));
  const headers = { ...(options.headers || {}), Connection: "close", ...(body ? { "Content-Length": body.length } : {}) };
  const request = https.request(new URL(url), { method: options.method || "GET", agent: false, timeout: 300000, headers }, (response) => {
    const chunks = [];
    response.on("data", (chunk) => chunks.push(chunk));
    response.on("error", reject);
    response.on("close", () => {
      if (response.complete) resolve({ status: response.statusCode, node: response.headers["x-node-id"] || "", location: response.headers.location || "", text: Buffer.concat(chunks).toString() });
      else reject(new Error("connection closed early " + url));
    });
  });
  request.on("timeout", () => request.destroy(new Error("timeout " + url)));
  request.on("error", reject);
  request.end(body);
});

const json = async (url, options = {}, attempts = 1) => {
  for (let attempt = 1; ; attempt += 1) {
    try {
      const response = await send(url, options);
      if (response.status < 200 || response.status >= 300) throw new Error(`${options.method || "GET"} ${url} -> ${response.status}: ${response.text.slice(0, 400)}`);
      return response.text ? JSON.parse(response.text) : null;
    } catch (error) {
      if (attempt >= attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }
};

const accessToken = async () => {
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
};

const headers = { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json", Accept: "application/json", "X-Organization-Code": "SYSTEM" };
const call = (service, apiPath, body) => json(`${baseUrl}/${service}/api/${apiPath}`, { method: "POST", headers, body: JSON.stringify(body) }, /(list|get)\.json/.test(apiPath) ? 5 : 1);
const names = (fields) => fields.map((name) => ({ name }));
const identifier = (name, fields = ["id"]) => ({ name, type: "identifier", mappings: names(fields) });
const byCode = (code) => [{ property: "code", operator: "=", type: "STRING", value: code }];

const PAGE_FIELDS = ["id", "optimistic", "url", "excludeFromSeo", "values", "enabledTemplates", "permissions"];
const pageRead = [...names(PAGE_FIELDS), identifier("organization", ["id", "code"]), identifier("template", ["id", "code"])];
const pageSave = [...names(PAGE_FIELDS), identifier("organization"), identifier("template")];
const TEMPLATE_FIELDS = ["id", "code", "nls", "templateLanguage", "advanced", "head", "html", "javascript", "css", "optimistic", "parameters"];
const templateSave = [...names(TEMPLATE_FIELDS), identifier("organization"), identifier("parent")];

const listPages = async () => (await call("core-cms", "page-context/list.json", { filters: [], mappings: [...names(["id", "url", "excludeFromSeo"]), identifier("template", ["id", "code"])], offset: 0, pageSize: 1000 })).result || [];
const readPage = (id) => call("core-cms", `page-context/get.json?id=${id}`, pageRead);
const findTemplate = async (code) => {
  const rows = ((await call("core-cms", "block-template/list.json", { filters: byCode(code), mappings: [...names(["id", "code"]), identifier("parent", ["id", "code"])], offset: 0, pageSize: 5 })).result || []).filter((row) => row.code === code);
  if (rows.length > 1) throw new Error(`Template ${code} is ambiguous (${rows.length} records)`);
  return rows[0] || null;
};
const organizationId = async (code) => {
  const [organization] = (await call("core", "organization/list.json", { filters: byCode(code), mappings: names(["id", "code"]), offset: 0, pageSize: 2 })).result || [];
  if (!organization) throw new Error(`Organization ${code} not found`);
  return organization.id;
};

const plan = [];
const step = (text) => {
  plan.push(text);
  console.log(`${apply ? "APPLY" : "PLAN "} ${text}`);
};

const savePage = async (page, changes) => {
  const entity = { ...page, ...changes, organization: { id: page.organization.id }, template: { id: page.template.id } };
  if (apply) await call("core-cms", "page-context/save.json", { entities: [entity], mappings: pageSave });
};

const movePage = async ({ pages, rootCode, from, to, excludeFromSeo, expectId }) => {
  const candidates = pages.filter((page) => page.template?.code === rootCode && [from, to].includes(page.url));
  if (candidates.length !== 1) throw new Error(`Expected one ${rootCode} page at ${from} or ${to}, found ${candidates.map((page) => `${page.id} ${page.url}`).join(", ") || "none"}`);
  const [summary] = candidates;
  if (expectId !== null && summary.id !== expectId) throw new Error(`${rootCode} page is ${summary.id}, expected ${expectId}`);
  if (summary.url === to && summary.excludeFromSeo === excludeFromSeo) return step(`keep ${rootCode} page ${summary.id} at ${to} (excludeFromSeo ${excludeFromSeo})`);
  if (summary.url !== to) {
    const occupant = pages.find((page) => page.url === to && page.id !== summary.id);
    if (occupant) throw new Error(`${to} is still taken by page ${occupant.id} (${occupant.template?.code})`);
  }
  const page = await readPage(summary.id);
  step(`move ${rootCode} page ${page.id}: ${page.url} -> ${to}, excludeFromSeo ${page.excludeFromSeo} -> ${excludeFromSeo}`);
  await savePage(page, { url: to, excludeFromSeo });
};

const redirectTemplate = () => {
  const target = `${environment.origin}${MAIN_URL}`;
  return {
    code: REDIRECT_CODE,
    nls: { en: { NAME: "Snow Removal Landing | Redirect from -new" } },
    templateLanguage: "JTE",
    head: `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, follow">
<title>Snow Removal Software | ServiceWand</title>
<link rel="canonical" href="${target}">
<meta http-equiv="refresh" content="0; url=${target}">
<script>
  (function () {
    var language = window.location.pathname.match(/^\\/([a-z]{2})\\//);
    window.location.replace((language ? "/" + language[1] : "") + "${MAIN_URL}" + window.location.search + window.location.hash);
  })();
</script>`,
    html: `<main><p><a href="${MAIN_URL}">Snow Removal Software</a></p></main>`,
    css: "",
    javascript: "",
    parameters: [],
  };
};

const runNode = (script, scriptArgs) => {
  const command = [path.join(scriptsDir, script), ...scriptArgs];
  step(`run ${script} ${scriptArgs.join(" ")}`);
  if (!apply) return;
  const result = spawnSync(process.execPath, command, { stdio: "inherit", env: process.env });
  if (result.status !== 0) throw new Error(`${script} failed with ${result.status}`);
};

const uploadFamily = async (outDir) => {
  const root = await findTemplate(NEW_ROOT_CODE);
  if (!root) throw new Error(`${NEW_ROOT_CODE} is missing on ${baseUrl}`);
  runNode("upload-cms-family.mjs", ["--out", outDir, "--base-url", `${baseUrl}/core`, "--org", "SYSTEM", "--require-existing", "--expected-root-id", root.id, "--live"]);
};

const wireFamily = (pageUrl) => runNode("wire-snow-removal-landing-page.mjs", ["--env", environment.name, "--base-url", baseUrl, "--page-url", pageUrl, ...(args.includes("--allow-production") ? ["--allow-production"] : []), "--live"]);

const clearCache = async (code) => {
  const template = await findTemplate(code);
  if (!template) return step(`no ${code} cache to clear`);
  step(`clear render cache of ${code} ${template.id}`);
  if (!apply) return;
  const nodes = new Map();
  for (let attempt = 0; attempt < 12 && nodes.size < 3; attempt += 1) {
    const response = await send(`${baseUrl}/core-cms/api/block-template/clear-cache.json?id=${template.id}`, { method: "POST", headers, body: "{}" }).catch(() => null);
    if (response?.status === 200) nodes.set(response.node, true);
  }
  console.log(`      cleared on ${[...nodes.keys()].join(", ") || "no node"}`);
};

const ensureRedirect = async (pages) => {
  const occupant = pages.find((page) => page.url === NEW_URL);
  let template = await findTemplate(REDIRECT_CODE);
  if (occupant && occupant.template?.code !== REDIRECT_CODE) throw new Error(`${NEW_URL} is still taken by page ${occupant.id} (${occupant.template?.code})`);
  const wanted = redirectTemplate();
  if (!template) {
    step(`create root template ${REDIRECT_CODE} (organization SYSTEM, no parent, noindex + canonical + forward to ${MAIN_URL})`);
    if (apply) {
      await call("core-cms", "block-template/save.json", { entities: [{ ...wanted, organization: { id: await organizationId("SYSTEM") } }], mappings: templateSave });
      template = await findTemplate(REDIRECT_CODE);
    }
  } else {
    if (template.parent?.id) throw new Error(`${REDIRECT_CODE} has a parent; refusing to use it`);
    step(`keep root template ${REDIRECT_CODE} ${template.id}`);
  }
  const retired = pages.find((page) => page.url === RETIRED_REDIRECT_URL && page.template?.code === REDIRECT_CODE);
  if (occupant) return step(`keep redirect page ${occupant.id} at ${NEW_URL}`);
  if (retired) {
    const page = await readPage(retired.id);
    step(`move retired redirect page ${page.id} back to ${NEW_URL}`);
    return savePage(page, { url: NEW_URL, excludeFromSeo: true });
  }
  step(`create page ${NEW_URL} (organization SERVICEWAND, root ${REDIRECT_CODE}, excluded from SEO)`);
  if (apply) await call("core-cms", "page-context/save.json", {
    entities: [{ url: NEW_URL, excludeFromSeo: true, values: {}, enabledTemplates: [template.id], permissions: [], organization: { id: await organizationId("SERVICEWAND") }, template: { id: template.id } }],
    mappings: pageSave,
  });
};

const retireRedirect = async (pages) => {
  const page = pages.find((candidate) => candidate.url === NEW_URL && candidate.template?.code === REDIRECT_CODE);
  if (!page) return step(`no redirect page at ${NEW_URL}`);
  step(`move redirect page ${page.id}: ${NEW_URL} -> ${RETIRED_REDIRECT_URL}`);
  await savePage(await readPage(page.id), { url: RETIRED_REDIRECT_URL, excludeFromSeo: true });
};

const rewriteEmail = (from, to) => {
  if (!emailFile) return step("no --email given; call-center email unchanged");
  const source = fs.readFileSync(emailFile, "utf8");
  const pattern = new RegExp(`${environment.origin.replace(/\./g, "\\.")}${from.replace(/[-/]/g, "\\$&")}(?=["?#])`, "g");
  const count = (source.match(pattern) || []).length;
  step(`rewrite ${count} link(s) in ${path.basename(emailFile)}: ${from} -> ${to}`);
  if (apply && count) fs.writeFileSync(emailFile, source.replace(pattern, `${environment.origin}${to}`));
};

const snapshot = async (pages) => {
  const ids = pages.filter((page) => [MAIN_URL, NEW_URL, LEGACY_URL, RETIRED_REDIRECT_URL].includes(page.url)).map((page) => page.id);
  const records = [];
  for (const id of ids) records.push(await readPage(id));
  if (snapshotFile) {
    fs.mkdirSync(path.dirname(snapshotFile), { recursive: true });
    fs.writeFileSync(snapshotFile, JSON.stringify({ baseUrl, read: "before", pages: records }, null, 1));
    console.log(`snapshot of pages ${ids.join(", ")} written to ${snapshotFile}`);
  }
};

const readBack = async () => {
  const get = async (url) => {
    for (let attempt = 1; ; attempt += 1) {
      try {
        return await send(`${baseUrl}${url}`, { headers: { "Accept-Encoding": "identity", "User-Agent": "snow-removal-url-switch" } });
      } catch (error) {
        if (attempt >= 5) throw error;
        await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
      }
    }
  };
  const describe = (response) => `${response.status} ${response.location ? `-> ${response.location} ` : ""}${/class="[^"]*\bsnow-landing\b/.test(response.text) ? "snow-landing" : ""}${/http-equiv="refresh"/.test(response.text) ? "redirect-page" : ""}${(response.text.match(/<html[^>]*lang="([a-z]+)"/) || [])[1] ? ` lang=${response.text.match(/<html[^>]*lang="([a-z]+)"/)[1]}` : ""} canonical=${(response.text.match(/<link rel="canonical" href="([^"]*)"/) || [])[1] || "-"} robots=${(response.text.match(/<meta name="robots" content="([^"]*)"/) || [])[1] || "-"}`;
  for (const url of [MAIN_URL, `/ru${MAIN_URL}`, NEW_URL, `/ru${NEW_URL}`, LEGACY_URL]) console.log(`  GET ${url}: ${describe(await get(url))}`);
  const sitemap = (await get("/sitemap.xml")).text;
  console.log(`  sitemap.xml: main ${sitemap.includes(`${environment.origin}${MAIN_URL}<`)}, -new ${sitemap.includes(NEW_URL)}, legacy ${sitemap.includes(LEGACY_URL)}`);
};

const switchPackage = () => {
  const outDir = path.join(landingRoot, "dist", `.snow-removal-switch-${environment.name}`);
  exportSnowRemovalLanding({ environment: { ...environment, pageUrl: MAIN_URL }, outputDir: outDir, quiet: true });
  const payload = JSON.parse(fs.readFileSync(path.join(outDir, "cms-family.payload.json"), "utf8"));
  const canonical = payload.root.parameters.find((parameter) => parameter.code === "ROOT_CANONICAL_URL")?.value?.en;
  if (payload.pageContext.url !== MAIN_URL || canonical !== `${environment.origin}${MAIN_URL}`) throw new Error("The switch package does not point at the main URL");
  return outDir;
};

console.log(`${apply ? "APPLY" : "DRY RUN"} ${rollback ? "rollback" : "switch"} on ${baseUrl} (${environment.name})`);
let pages = await listPages();
await snapshot(pages);

if (!rollback) {
  const outDir = switchPackage();
  try {
    await uploadFamily(outDir);
    wireFamily(pages.find((page) => page.template?.code === NEW_ROOT_CODE)?.url || NEW_URL);
  } finally {
    fs.rmSync(outDir, { recursive: true, force: true });
  }
  pages = await listPages();
  await movePage({ pages, rootCode: OLD_ROOT_CODE, from: MAIN_URL, to: LEGACY_URL, excludeFromSeo: true, expectId: expectOldPage });
  pages = apply ? await listPages() : pages.map((page) => (page.url === MAIN_URL && page.template?.code === OLD_ROOT_CODE ? { ...page, url: LEGACY_URL } : page));
  await movePage({ pages, rootCode: NEW_ROOT_CODE, from: NEW_URL, to: MAIN_URL, excludeFromSeo: false, expectId: expectNewPage });
  pages = apply ? await listPages() : pages.map((page) => (page.url === NEW_URL && page.template?.code === NEW_ROOT_CODE ? { ...page, url: MAIN_URL } : page));
  await ensureRedirect(pages);
  await clearCache(NEW_ROOT_CODE);
  await clearCache(REDIRECT_CODE);
  rewriteEmail(NEW_URL, MAIN_URL);
} else {
  await retireRedirect(pages);
  pages = apply ? await listPages() : pages.map((page) => (page.url === NEW_URL && page.template?.code === REDIRECT_CODE ? { ...page, url: RETIRED_REDIRECT_URL } : page));
  await movePage({ pages, rootCode: NEW_ROOT_CODE, from: MAIN_URL, to: NEW_URL, excludeFromSeo: true, expectId: expectNewPage });
  pages = apply ? await listPages() : pages.map((page) => (page.url === MAIN_URL && page.template?.code === NEW_ROOT_CODE ? { ...page, url: NEW_URL } : page));
  await movePage({ pages, rootCode: OLD_ROOT_CODE, from: LEGACY_URL, to: MAIN_URL, excludeFromSeo: false, expectId: expectOldPage });
  await uploadFamily(environment.outputDir);
  wireFamily(NEW_URL);
  await clearCache(NEW_ROOT_CODE);
  rewriteEmail(MAIN_URL, NEW_URL);
}

if (apply) await readBack();
else console.log(`No writes were made (${plan.length} steps). Pass --apply to run them.`);
