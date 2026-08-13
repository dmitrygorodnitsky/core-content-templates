/* Upload generated CMS BlockTemplates into ServiceWand CMS.
 *
 * This uploader is intentionally flat: every local template is independently
 * created or updated by `code`. It never changes parent links, include lists,
 * enabled templates, or PageContext records. Those relationships are edited
 * manually in CMS, where their resulting composition can be reviewed.
 *
 *   node app-templates/landing-page/scripts/upload-cms-family.mjs \
 *     --out app-templates/landing-page/dist/<slug> [--dry-run | --live]
 */

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

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
    else if (arg === "--require-existing") out.requireExisting = true;
    else if (arg === "--require-missing") out.requireMissing = true;
    else if (arg === "--expected-root-id") out.expectedRootId = args[++index];
    else if (arg === "--help" || arg === "-h") out.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return out;
};

const usage = () => `Usage:
  node app-templates/landing-page/scripts/upload-cms-family.mjs \\
    --out app-templates/landing-page/dist/<slug> \\
    [--dry-run | --live] [--base-url https://lsrc.pixelnation.com/core] [--org SYSTEM] \
    [--require-existing | --require-missing] [--expected-root-id <uuid>]

The uploader creates or updates each BlockTemplate by code. It never manages
template parents, root include markup, enabled templates, or PageContext.

With --require-existing, every template code is resolved before any write and
the command fails if one is missing. --expected-root-id additionally confirms
the existing root BlockTemplate UUID. In dry-run mode these flags perform
authenticated reads only and print the resolved codes and IDs.

With --require-missing, every template code is resolved before any write and
the command fails if one already exists. Use it for create-only uploads with new
suffixed codes.

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

const requestText = async (url, options = {}) => {
  let lastError;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(url, options);
      const text = await response.text();
      if (!response.ok) {
        const requestId = response.headers.get("x-request-id") || response.headers.get("x-correlation-id");
        const detail = text.trim() ? text.slice(0, 800) : "<empty response body>";
        throw new Error(`${options.method ?? "GET"} ${url} -> ${response.status}${requestId ? ` [request-id: ${requestId}]` : ""}: ${detail}`);
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
  { name: "organization", type: "identifier", key: "id" },
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
      filters: [{ property: "code", operator: "=", type: "STRING", value: code }],
      mappings: blockMappings,
      offset: 0,
      pageSize: 10,
    }),
  });
  const matches = (response?.result || []).filter((item) => item.code === code);
  if (matches.length > 1) throw new Error(`Template code is ambiguous: ${code} matched ${matches.length} records`);
  return matches[0] || null;
};

const resolveOrganization = async ({ baseUrl, headers, code }) => {
  const response = await requestJson(`${baseUrl}/api/organization/list.json`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      filters: [{ property: "code", operator: "=", type: "STRING", value: code }],
      mappings: [{ name: "id" }, { name: "code" }, { name: "name" }],
      offset: 0,
      pageSize: 10,
    }),
  });
  const matches = (response?.result || []).filter((item) => item.code === code);
  if (matches.length > 1) throw new Error(`Organization code is ambiguous: ${code} matched ${matches.length} records`);
  if (!matches[0]?.id) throw new Error(`Organization was not found by code: ${code}`);
  return { id: matches[0].id, code: matches[0].code };
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

const TEMPLATE_PARAMETER_RE = /\$\{([A-Z][A-Z0-9_]*)(?:>([A-Z][A-Z0-9_]*))?(?:@([A-Z][A-Z0-9_]*)(?::[^}]*)?)?\}/g;
const SERVER_RUNTIME_PARAMETER_TYPES = new Map([
  ["POST", "BLOG_POST_CONTENT_SS"],
]);

const validateTemplateParameterTypes = (templates) => {
  const errors = [];
  for (const template of templates) {
    const typesByCode = new Map((template.parameters || []).map((parameter) => [parameter.code, parameter.type]));
    const source = [template.head, template.html, template.javascript, template.css].join("\n");
    for (const match of source.matchAll(TEMPLATE_PARAMETER_RE)) {
      const [, code, parentCode, markerType] = match;
      const parameterType = typesByCode.get(code);
      if (!parameterType) {
        if (markerType && SERVER_RUNTIME_PARAMETER_TYPES.get(code) === markerType) continue;
        errors.push(`${template.code}: ${code} is referenced but not declared`);
        continue;
      }
      if (parentCode && !markerType) continue;
      const expectedType = markerType || "STRING";
      if (parameterType !== expectedType) {
        errors.push(`${template.code}: ${code} marker is ${expectedType}, parameter is ${parameterType}`);
      }
    }
  }
  if (errors.length) {
    throw new Error(`Template parameter contract mismatch:\n${[...new Set(errors)].map((error) => `  - ${error}`).join("\n")}`);
  }
};

const parameterCount = (templates) => templates.reduce((sum, template) => sum + (template.parameters?.length || 0), 0);

// Keep the wire payload aligned with core-ui's createMutationMapping helper.
// In particular, core-ui omits nulls, empty strings, and empty objects before
// posting instead of sending explicit empty parameter values on create.
const isCmsEmptyValue = (value) =>
  value === null
  || value === undefined
  || value === ""
  || (typeof value === "object" && Object.keys(value).length === 0);

const removeCmsEmptyValues = (value) => {
  if (Array.isArray(value)) {
    return value
      .map(removeCmsEmptyValues)
      .filter((item) => !isCmsEmptyValue(item));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, item]) => [key, removeCmsEmptyValues(item)])
        .filter(([, item]) => !isCmsEmptyValue(item)),
    );
  }
  return value;
};

const normalizeTemplateForSave = (template, existing, organization) => {
  const {
    children: _children,
    parent: _parent,
    slotMarker: _slotMarker,
    includes: _includes,
    includeTemplates: _includeTemplates,
    includedTemplates: _includedTemplates,
    enabledTemplates: _enabledTemplates,
    pageContext: _pageContext,
    pageContexts: _pageContexts,
    ...entity
  } = template;
  const result = {
    ...entity,
    id: existing?.id,
    optimistic: existing?.optimistic,
    organization: existing?.organization?.id
      ? { id: existing.organization.id }
      : { id: organization.id },
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
  return removeCmsEmptyValues(result);
};

const saveEntitySummary = (entity) => ({
  id: entity.id || null,
  code: entity.code,
  fields: Object.keys(entity).sort(),
  contentLengths: {
    head: String(entity.head || "").length,
    html: String(entity.html || "").length,
    javascript: String(entity.javascript || "").length,
    css: String(entity.css || "").length,
  },
  parameterCount: entity.parameters?.length || 0,
  parameterTypes: Object.fromEntries(Object.entries((entity.parameters || []).reduce((counts, parameter) => {
    counts[parameter.type] = (counts[parameter.type] || 0) + 1;
    return counts;
  }, {})).sort()),
  unsetValueCodes: (entity.parameters || [])
    .filter((parameter) => !Object.hasOwn(parameter, "value"))
    .map((parameter) => parameter.code),
});

const saveBlockTemplate = async ({ cmsBaseUrl, headers, template, existing, organization }) => {
  const entity = normalizeTemplateForSave(template, existing, organization);
  let response;
  try {
    response = await requestText(`${cmsBaseUrl}/api/block-template/save.json`, {
      method: "POST",
      headers,
      body: JSON.stringify({ entities: [entity], mappings: blockMappings }),
    });
  } catch (error) {
    throw new Error(`BlockTemplate save failed for ${template.code} (${existing?.id ? `update ${existing.id}` : "create"}).\nSafe entity summary: ${JSON.stringify(saveEntitySummary(entity), null, 2)}\n${error.message}`);
  }
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

const resolvePlan = async (env, templates) => {
  const token = await getAccessToken(env);
  const headers = cmsHeaders(token, env.org);
  const organization = await resolveOrganization({ baseUrl: env.baseUrl, headers, code: env.org });
  const rows = [];
  for (const template of templates) {
    const existing = await listByCode({ cmsBaseUrl: env.cmsBaseUrl, headers, code: template.code });
    rows.push({ template, existing });
  }
  return { headers, organization, rows };
};

const verifyPlan = (plan, options) => {
  const missing = plan.rows.filter((row) => !row.existing?.id).map((row) => row.template.code);
  const existing = plan.rows.filter((row) => row.existing?.id).map((row) => row.template.code);
  if (options.requireExisting && missing.length) {
    throw new Error(`Required existing templates were not found: ${missing.join(", ")}`);
  }
  if (options.requireMissing && existing.length) {
    throw new Error(`Create-only upload refused because template codes already exist: ${existing.join(", ")}`);
  }
  if (options.expectedRootId) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(options.expectedRootId)) {
      throw new Error(`--expected-root-id must be a UUID: ${options.expectedRootId}`);
    }
    const actual = plan.rows[0]?.existing?.id;
    if (!actual) throw new Error(`Expected root ${options.expectedRootId}, but ${plan.rows[0]?.template.code} does not exist`);
    if (String(actual).toLowerCase() !== options.expectedRootId.toLowerCase()) {
      throw new Error(`Root id mismatch for ${plan.rows[0].template.code}: expected ${options.expectedRootId}, found ${actual}`);
    }
  }
};

const printResolvedDryRun = (env, plan) => {
  console.log("\n=== upload-cms-family · RESOLVED DRY RUN ===\n");
  console.log(`Target: ${env.cmsBaseUrl} (${env.org})`);
  console.log(`Organization: ${plan.organization.code} -> ${plan.organization.id}`);
  for (const row of plan.rows) {
    console.log(`  ${row.existing?.id ? "would update" : "would create"}: ${row.template.code} -> ${row.existing?.id || "(new)"}`);
  }
  console.log("\nNo network writes were made. Pass --live with the same safety flags to upload.\n");
};

const uploadLive = async (env, plan) => {
  const { headers, organization, rows } = plan;
  console.log(`Uploading ${rows.length} independent BlockTemplates to ${env.cmsBaseUrl} (${env.org})`);
  console.log(`Resolved organization: ${organization.code} -> ${organization.id}`);

  const results = [];
  for (const { template, existing } of rows) {
    console.log(`  saving ${existing?.id ? "update" : "create"}: ${template.code} -> ${existing?.id || "(new)"}`);
    const id = await saveBlockTemplate({
      cmsBaseUrl: env.cmsBaseUrl,
      headers,
      template,
      existing,
      organization,
    });
    const action = existing?.id ? "updated" : "created";
    results.push({ action, code: template.code, id });
    console.log(`  ${action}: ${template.code} -> ${id}`);
  }
  console.log("Upload complete. Parent links, include lists, and PageContext were not changed.");
  return results;
};

export const main = async () => {
  const args = parseArgs();
  if (args.help || !args.out) {
    console.log(usage());
    process.exit(args.help ? 0 : 1);
  }
  if (args.requireExisting && args.requireMissing) {
    fail("--require-existing and --require-missing are mutually exclusive.");
  }
  if (args.expectedRootId && args.requireMissing) {
    fail("--expected-root-id cannot be combined with --require-missing.");
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
  validateTemplateParameterTypes(templates);

  const needsResolvedPlan = args.mode === "live" || args.requireExisting || args.requireMissing || args.expectedRootId;
  if (!needsResolvedPlan) {
    printDryRun(env, templates);
    return;
  }
  const plan = await resolvePlan(env, templates);
  verifyPlan(plan, args);
  if (args.mode === "dry-run") printResolvedDryRun(env, plan);
  else await uploadLive(env, plan);
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => fail(error.stack || error.message || String(error)));
}
