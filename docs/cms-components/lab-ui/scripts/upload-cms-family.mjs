/* Upload generated CMS BlockTemplates into ServiceWand CMS.
 *
 * This uploader is intentionally flat: every local template is independently
 * created or updated by `code`. It never changes parent links, include lists,
 * enabled templates, or PageContext records. Those relationships are edited
 * manually in CMS, where their resulting composition can be reviewed.
 *
 *   node docs/cms-components/lab-ui/scripts/upload-cms-family.mjs \
 *     --out docs/cms-components/lab-ui/dist/<slug> [--dry-run | --live]
 */

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const DEFAULT_CORE_BASE_URL = "https://lsrc.pixelnation.com/core";
const DEFAULT_ORG = "SYSTEM";

const parseArgs = () => {
  const args = process.argv.slice(2);
  const out = { mode: "dry-run" };
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--out") out.out = args[++index];
    else if (arg === "--base-url") out.baseUrl = args[++index];
    else if (arg === "--org") out.org = args[++index];
    else if (arg === "--live") out.mode = "live";
    else if (arg === "--dry-run") out.mode = "dry-run";
    else if (arg === "--help" || arg === "-h") out.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return out;
};

const usage = () => `Usage:
  node docs/cms-components/lab-ui/scripts/upload-cms-family.mjs \\
    --out docs/cms-components/lab-ui/dist/<slug> \\
    [--dry-run | --live] [--base-url https://lsrc.pixelnation.com/core] [--org SYSTEM]

The uploader creates or updates each BlockTemplate by code. It never manages
template parents, root include markup, enabled templates, or PageContext.

Env credentials:
  SERVICEWAND_API_KEY or LANDING_API_KEY
  SERVICEWAND_BEARER  or LANDING_BEARER

Optional env:
  SERVICEWAND_BASE_URL or LANDING_BASE_URL
  SERVICEWAND_ORG      or LANDING_ORG`;

const fail = (message, code = 1) => {
  console.error(`upload: ${message}`);
  process.exit(code);
};

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

const readPayload = (outDir) => {
  const file = join(outDir, "cms-family.payload.json");
  if (!existsSync(file)) fail(`Payload not found: ${file}. Generate the CMS package first.`);
  return readJson(file);
};

const envFirst = (...names) => {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim()) return value.trim();
  }
  return "";
};

const serviceUrl = (baseUrl, service) => {
  const clean = baseUrl.replace(/\/+$/, "");
  if (service === "core") return clean;
  if (clean.endsWith("/core")) return clean.replace(/\/core$/, `/${service}`);
  return `${clean}/${service}`;
};

const maskSecret = (value) => {
  if (!value) return "";
  if (value.length <= 8) return "***";
  return `${value.slice(0, 4)}...${value.slice(-2)}`;
};

const organizationIdentifier = (org) => {
  if (org && typeof org === "object") return org;
  if (String(org).toUpperCase() === "SYSTEM") return { id: 1, code: "SYSTEM" };
  return { code: org };
};

const requestText = async (url, options = {}) => {
  let lastError;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(url, options);
      const text = await response.text();
      if (!response.ok) {
        throw new Error(`${options.method ?? "GET"} ${url} -> ${response.status}: ${text.slice(0, 800)}`);
      }
      return text;
    } catch (error) {
      lastError = error;
      if (attempt === 5) break;
      await new Promise((done) => setTimeout(done, attempt * 1000));
    }
  }
  throw lastError;
};

const requestJson = async (url, options = {}) => {
  const text = await requestText(url, options);
  return text ? JSON.parse(text) : undefined;
};

const getAccessToken = async ({ baseUrl, apiKey, bearer }) => {
  if (bearer) return bearer;
  if (!apiKey) fail("Missing SERVICEWAND_API_KEY/LANDING_API_KEY or SERVICEWAND_BEARER/LANDING_BEARER.");

  const metadata = await requestJson(`${baseUrl}/.well-known/oauth-protected-resource`);
  const issuer = metadata.authorization_servers?.[0];
  if (!issuer) throw new Error("OAuth issuer is missing.");

  const openid = await requestJson(`${issuer}/.well-known/openid-configuration`);
  if (!openid.token_endpoint) throw new Error("OAuth token endpoint is missing.");

  const token = await requestJson(openid.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "X-API-Key": apiKey },
    body: new URLSearchParams({ grant_type: "api_key", scope: "openid" }),
  });
  if (!token.access_token) throw new Error("Token response did not include access_token.");
  return token.access_token;
};

const cmsHeaders = (token, org) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  "X-Organization-Code": org,
});

const blockMappings = [
  { name: "id" },
  { name: "code" },
  { name: "nls" },
  { name: "organization", type: "identifier", mappings: [{ name: "id" }, { name: "code" }, { name: "name" }] },
  { name: "templateLanguage" },
  { name: "advanced" },
  { name: "head" },
  { name: "html" },
  { name: "javascript" },
  { name: "css" },
  { name: "optimistic" },
  { name: "parameters" },
];

const listByCode = async ({ cmsBaseUrl, headers, code }) => {
  const response = await requestJson(`${cmsBaseUrl}/api/block-template/list.json`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      filters: [{ property: "code", operator: "=", value: code }],
      mappings: blockMappings,
      offset: 0,
      pageSize: 10,
    }),
  });
  return (response?.result || []).find((item) => item.code === code) || null;
};

const flattenTemplates = (templates = []) =>
  templates.flatMap((template) => [template, ...flattenTemplates(template.children || [])]);

const templatesFromPayload = (payload) => {
  const templates = [payload.root, ...flattenTemplates(payload.children || [])].filter(Boolean);
  if (!templates.length) throw new Error("cms-family.payload.json has no templates.");
  const duplicateCodes = templates
    .map((template) => template.code)
    .filter((code, index, codes) => !code || codes.indexOf(code) !== index);
  if (duplicateCodes.length) throw new Error(`Template codes must be unique: ${[...new Set(duplicateCodes)].join(", ")}`);
  return templates;
};

const parameterCount = (templates) => templates.reduce((sum, template) => sum + (template.parameters?.length || 0), 0);

const normalizeTemplateForSave = (template, existing, org) => {
  const { children: _children, parent: _parent, slotMarker: _slotMarker, ...entity } = template;
  const result = {
    ...entity,
    id: existing?.id,
    optimistic: existing?.optimistic,
    organization: existing?.organization?.id
      ? { id: existing.organization.id, code: existing.organization.code }
      : organizationIdentifier(org),
    advanced: template.advanced ?? existing?.advanced ?? false,
  };
  if (result.id === undefined) delete result.id;
  if (result.optimistic === undefined) delete result.optimistic;
  if (Array.isArray(result.parameters)) {
    result.parameters = result.parameters.map((parameter) => {
      const { options: _options, ...withoutOptions } = parameter;
      return withoutOptions;
    });
  }
  return result;
};

const saveBlockTemplate = async ({ cmsBaseUrl, headers, template, existing, org }) => {
  const entity = normalizeTemplateForSave(template, existing, org);
  const response = await requestText(`${cmsBaseUrl}/api/block-template/save.json`, {
    method: "POST",
    headers,
    body: JSON.stringify({ entities: [entity], mappings: blockMappings }),
  });
  try {
    const parsed = JSON.parse(response);
    return String(Array.isArray(parsed) ? parsed[0] : parsed);
  } catch {
    return response.replace(/^"|"$/g, "");
  }
};

const printDryRun = (env, templates) => {
  console.log("\n=== upload-cms-family · FLAT DRY RUN ===\n");
  console.log("Payload summary:");
  console.log(`  root:               ${templates[0].code}`);
  console.log(`  template count:     ${templates.length}`);
  console.log(`  parameter count:    ${parameterCount(templates)}`);
  console.log("\nTarget:");
  console.log(`  CMS base: ${env.cmsBaseUrl}`);
  console.log(`  Org:      ${env.org}`);
  console.log("\nAuth:");
  console.log(`  baseUrl: ${env.baseUrl}`);
  console.log(`  apiKey:  ${env.apiKey ? maskSecret(env.apiKey) : "(none)"}`);
  console.log(`  bearer:  ${env.bearer ? maskSecret(env.bearer) : "(none)"}`);
  console.log("\nLive sequence:");
  console.log("  1. Resolve a template by code.");
  console.log("  2. Create it if absent; otherwise update that same id.");
  console.log("  3. Repeat for every payload template.");
  console.log("  4. Do not write parent, children, include markup, enabled templates, or PageContext.");
  console.log("\nNo network writes were made. Pass --live to upload.\n");
};

const uploadLive = async (env, templates) => {
  const token = await getAccessToken(env);
  const headers = cmsHeaders(token, env.org);
  console.log(`Uploading ${templates.length} independent BlockTemplates to ${env.cmsBaseUrl} (${env.org})`);

  const results = [];
  for (const template of templates) {
    const existing = await listByCode({ cmsBaseUrl: env.cmsBaseUrl, headers, code: template.code });
    const id = await saveBlockTemplate({
      cmsBaseUrl: env.cmsBaseUrl,
      headers,
      template,
      existing,
      org: env.org,
    });
    const action = existing?.id ? "updated" : "created";
    results.push({ action, code: template.code, id });
    console.log(`  ${action}: ${template.code} -> ${id}`);
  }
  console.log("Upload complete. Parent links, include lists, and PageContext were not changed.");
  return results;
};

const main = async () => {
  const args = parseArgs();
  if (args.help || !args.out) {
    console.log(usage());
    process.exit(args.help ? 0 : 1);
  }

  const outAbs = resolve(args.out);
  if (!existsSync(outAbs)) fail(`Out dir not found: ${args.out}`);
  const baseUrl = (args.baseUrl || envFirst("SERVICEWAND_BASE_URL", "LANDING_BASE_URL") || DEFAULT_CORE_BASE_URL).replace(/\/+$/, "");
  const org = args.org || envFirst("SERVICEWAND_ORG", "LANDING_ORG") || DEFAULT_ORG;
  const env = {
    baseUrl,
    cmsBaseUrl: serviceUrl(baseUrl, "core-cms"),
    org,
    apiKey: envFirst("SERVICEWAND_API_KEY", "LANDING_API_KEY", "DEPLOY_API_KEY"),
    bearer: envFirst("SERVICEWAND_BEARER", "LANDING_BEARER"),
  };
  const templates = templatesFromPayload(readPayload(outAbs));

  if (args.mode === "dry-run") printDryRun(env, templates);
  else await uploadLive(env, templates);
};

main().catch((error) => fail(error.stack || error.message || String(error)));
