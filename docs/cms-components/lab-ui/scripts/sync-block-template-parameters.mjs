/* Sync parameters for one CMS BlockTemplate.
 *
 * This intentionally updates only the BlockTemplate.parameters field. It first
 * reads the existing template from CMS, then saves the same entity with merged
 * or replaced parameters, preserving html/css/javascript/head/parent/etc.
 *
 * Dry-run is the default.
 */

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const DEFAULT_CORE_BASE_URL = "https://lsrc.pixelnation.com/core";
const DEFAULT_ORG = "SYSTEM";

const parseArgs = () => {
  const args = process.argv.slice(2);
  const out = { mode: "dry-run", syncMode: "merge" };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--template-id") out.templateId = args[++i];
    else if (arg === "--template-code") out.templateCode = args[++i];
    else if (arg === "--template-json") out.templateJson = args[++i];
    else if (arg === "--parameters-json") out.parametersJson = args[++i];
    else if (arg === "--base-url") out.baseUrl = args[++i];
    else if (arg === "--cms-base-url" || arg === "--api-base-url") out.cmsBaseUrl = args[++i];
    else if (arg === "--org") out.org = args[++i];
    else if (arg === "--mode") out.syncMode = args[++i];
    else if (arg === "--with-content") out.withContent = true;
    else if (arg === "--live") out.mode = "live";
    else if (arg === "--dry-run") out.mode = "dry-run";
    else if (arg === "--help" || arg === "-h") out.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return out;
};

const usage = () => `Usage:
  node docs/cms-components/lab-ui/scripts/sync-block-template-parameters.mjs \\
    --template-id <cmsBlockTemplateId> \\
    --template-json docs/cms-components/lab-ui/dist/manual-upload/section-01-header-corporate-reference/template.json \\
    [--mode merge|replace] [--with-content] [--dry-run | --live] [--base-url https://lsrc.pixelnation.com/core] [--org SYSTEM]
    [--cms-base-url https://lsrc.pixelnation.com/core-cms]

Note:
  --live requires an explicit --base-url or SERVICEWAND_BASE_URL/LANDING_BASE_URL.
  --with-content also syncs head/html/javascript/css from --template-json.

Alternative input:
  --parameters-json path/to/parameters.json

Alternative target:
  --template-code SECTION_01_HEADER_CORPORATE_REFERENCE

Env credentials:
  SERVICEWAND_API_KEY or LANDING_API_KEY
  SERVICEWAND_BEARER  or LANDING_BEARER

Optional env:
  SERVICEWAND_BASE_URL or LANDING_BASE_URL
  SERVICEWAND_CMS_BASE_URL or LANDING_CMS_BASE_URL
  SERVICEWAND_ORG          or LANDING_ORG`;

const fail = (message, code = 1) => {
  console.error(`sync-block-template-parameters: ${message}`);
  process.exit(code);
};

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

const envFirst = (...names) => {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim()) return value.trim();
  }
  return "";
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
      await new Promise((resolveDelay) => setTimeout(resolveDelay, attempt * 1000));
    }
  }
  throw lastError;
};

const requestJson = async (url, options = {}) => {
  const text = await requestText(url, options);
  try {
    return text ? JSON.parse(text) : undefined;
  } catch (error) {
    const preview = text.replace(/\s+/g, " ").slice(0, 180);
    throw new Error(`Invalid JSON from ${url}: ${preview}`);
  }
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
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-API-Key": apiKey,
    },
    body: new URLSearchParams({
      grant_type: "api_key",
      scope: "openid",
    }),
  });

  if (!token.access_token) throw new Error("Token response did not include access_token.");
  return token.access_token;
};

const cmsHeaders = (token, org) => ({
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  "X-Organization-Code": org,
});

const cmsServiceUrl = (baseUrl) => {
  const clean = baseUrl.replace(/\/+$/, "");
  if (clean.endsWith("/core")) return clean.replace(/\/core$/, "/core-cms");
  if (clean.endsWith("/core-cms")) return clean;
  return `${clean}/core-cms`;
};

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
  { name: "parent", type: "identifier", mappings: [{ name: "id" }, { name: "code" }] },
  { name: "parameters" },
];

const contentFields = ["head", "html", "javascript", "css"];

const listBlockTemplate = async ({ cmsBaseUrl, headers, templateId, templateCode }) => {
  const filter = templateId
    ? { property: "id", operator: "=", value: templateId }
    : { property: "code", operator: "=", value: templateCode };
  const response = await requestJson(`${cmsBaseUrl}/api/block-template/list.json`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      filters: [filter],
      mappings: blockMappings,
      offset: 0,
      pageSize: templateId ? 1 : 10,
    }),
  });
  const result = response?.result || [];
  if (templateId) return result[0] || null;
  return result.find((item) => item.code === templateCode) || null;
};

const normalizeParameter = (parameter) => {
  const { options: _options, ...rest } = parameter || {};
  return rest;
};

const canonicalize = (value) => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, nested]) => [key, canonicalize(nested)]),
  );
};

const parameterSignature = (parameter) =>
  JSON.stringify(canonicalize(normalizeParameter(parameter)));

const extractTemplateParameterRefs = (template) => {
  const refs = new Map();
  const fields = ["head", "html", "javascript", "css"];
  const pattern = /\$\{([A-Z0-9_]+)@([A-Z0-9_]+)\}/g;
  for (const field of fields) {
    const value = String(template?.[field] || "");
    for (const match of value.matchAll(pattern)) {
      refs.set(match[1], match[2]);
    }
  }
  return refs;
};

const missingTemplateParameterRefs = ({ template, parameters }) => {
  const refs = extractTemplateParameterRefs(template);
  const codes = new Set((parameters || []).map((parameter) => parameter.code));
  return [...refs.entries()]
    .filter(([code]) => !codes.has(code))
    .map(([code, type]) => `${code}@${type}`)
    .sort();
};

const loadSourceParameters = ({ templateJson, parametersJson }) => {
  const file = resolve(templateJson || parametersJson);
  if (!existsSync(file)) throw new Error(`Input JSON not found: ${file}`);
  const json = readJson(file);
  const parameters = Array.isArray(json) ? json : json.parameters;
  if (!Array.isArray(parameters)) throw new Error(`Input JSON has no parameters array: ${file}`);
  return {
    file,
    parameters: parameters.map(normalizeParameter),
    template: Array.isArray(json) ? null : json,
  };
};

const sourceContent = (template) =>
  Object.fromEntries(
    contentFields
      .filter((field) => typeof template?.[field] === "string")
      .map((field) => [field, template[field]]),
  );

const mergeParameters = ({ existing, incoming, mode }) => {
  if (mode === "replace") return incoming;
  if (mode !== "merge") throw new Error(`Unknown --mode: ${mode}. Use merge or replace.`);

  const byCode = new Map((existing || []).map((parameter) => [parameter.code, normalizeParameter(parameter)]));
  for (const parameter of incoming) byCode.set(parameter.code, normalizeParameter(parameter));
  return [...byCode.values()];
};

const diffParameters = ({ existing, incoming, next }) => {
  const existingByCode = new Map((existing || []).map((parameter) => [parameter.code, normalizeParameter(parameter)]));
  const incomingByCode = new Map((incoming || []).map((parameter) => [parameter.code, normalizeParameter(parameter)]));
  const nextCodes = new Set((next || []).map((parameter) => parameter.code));
  const added = [];
  const updated = [];
  const removed = [];
  const unchanged = [];

  for (const parameter of incomingByCode.values()) {
    const current = existingByCode.get(parameter.code);
    if (!current) added.push(parameter.code);
    else if (parameterSignature(current) !== parameterSignature(parameter)) updated.push(parameter.code);
    else unchanged.push(parameter.code);
  }
  for (const parameter of existingByCode.values()) {
    if (!nextCodes.has(parameter.code)) removed.push(parameter.code);
  }

  return {
    added: added.sort(),
    updated: updated.sort(),
    removed: removed.sort(),
    unchanged: unchanged.sort(),
  };
};

const saveParameters = async ({ cmsBaseUrl, headers, template, parameters, content }) => {
  const {
    parent: _parent,
    children: _children,
    slotMarker: _slotMarker,
    ...writableTemplate
  } = template;
  const entity = {
    ...writableTemplate,
    ...content,
    organization: template.organization?.id
      ? { id: template.organization.id, code: template.organization.code }
      : template.organization,
    parameters,
  };
  const text = await requestText(`${cmsBaseUrl}/api/block-template/save.json`, {
    method: "POST",
    headers,
    body: JSON.stringify({ entities: [entity], mappings: blockMappings }),
  });
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed[0] : parsed;
  } catch {
    return text.replace(/^"|"$/g, "");
  }
};

const printList = (title, values, limit = 40) => {
  console.log(`${title}: ${values.length}`);
  for (const value of values.slice(0, limit)) console.log(`  - ${value}`);
  if (values.length > limit) console.log(`  ... ${values.length - limit} more`);
};

const main = async () => {
  const args = parseArgs();
  if (args.help) {
    console.log(usage());
    return;
  }
  if (!args.templateId && !args.templateCode) throw new Error("Pass --template-id or --template-code.");
  if (!args.templateJson && !args.parametersJson) throw new Error("Pass --template-json or --parameters-json.");
  if (args.templateJson && args.parametersJson) throw new Error("Pass only one of --template-json or --parameters-json.");

  const baseUrl = args.baseUrl || envFirst("SERVICEWAND_BASE_URL", "LANDING_BASE_URL") || DEFAULT_CORE_BASE_URL;
  const hasExplicitBaseUrl = Boolean(
    args.baseUrl || envFirst("SERVICEWAND_BASE_URL", "LANDING_BASE_URL")
  );
  if (args.mode === "live" && !hasExplicitBaseUrl) {
    throw new Error(
      "Live mode requires an explicit --base-url or SERVICEWAND_BASE_URL/LANDING_BASE_URL."
    );
  }
  const cmsBaseUrl = (
    args.cmsBaseUrl ||
    envFirst("SERVICEWAND_CMS_BASE_URL", "LANDING_CMS_BASE_URL") ||
    cmsServiceUrl(baseUrl)
  ).replace(/\/+$/, "");
  const org = args.org || envFirst("SERVICEWAND_ORG", "LANDING_ORG") || DEFAULT_ORG;
  const apiKey = envFirst("SERVICEWAND_API_KEY", "LANDING_API_KEY");
  const bearer = envFirst("SERVICEWAND_BEARER", "LANDING_BEARER");
  const source = loadSourceParameters(args);
  if (args.withContent && !source.template) {
    throw new Error("--with-content requires --template-json with a full template object.");
  }

  const token = await getAccessToken({ baseUrl, apiKey, bearer });
  const headers = cmsHeaders(token, org);
  const existing = await listBlockTemplate({
    cmsBaseUrl,
    headers,
    templateId: args.templateId,
    templateCode: args.templateCode,
  });
  if (!existing?.id) throw new Error(`BlockTemplate was not found: ${args.templateId || args.templateCode}`);

  const existingParams = (existing.parameters || []).map(normalizeParameter);
  const nextParams = mergeParameters({
    existing: existingParams,
    incoming: source.parameters,
    mode: args.syncMode,
  });
  const nextContent = args.withContent ? sourceContent(source.template) : {};
  const contentChanges = args.withContent
    ? Object.keys(nextContent).filter(
        (field) => String(existing[field] || "") !== String(nextContent[field] || ""),
      )
    : [];
  const missingRefs = missingTemplateParameterRefs({
    template: { ...existing, ...nextContent },
    parameters: nextParams,
  });
  if (missingRefs.length) {
    throw new Error(
      [
        "Next parameter set does not define every placeholder used by the current BlockTemplate markup.",
        "This save would make the template fail at render time.",
        `Missing: ${missingRefs.join(", ")}`,
      ].join(" ")
    );
  }
  const diff = diffParameters({
    existing: existingParams,
    incoming: source.parameters,
    next: nextParams,
  });

  console.log(`\n=== sync-block-template-parameters · ${args.mode === "live" ? "LIVE" : "DRY RUN"} ===\n`);
  console.log(`CMS:      ${cmsBaseUrl}`);
  console.log(`Org:      ${org}`);
  console.log(`Target:   ${existing.code} (${existing.id})`);
  console.log(`Source:   ${source.file}`);
  console.log(`Mode:     ${args.syncMode}`);
  console.log(`Content:  ${args.withContent ? "head/html/javascript/css" : "unchanged"}`);
  console.log(`Existing: ${existingParams.length}`);
  console.log(`Incoming: ${source.parameters.length}`);
  console.log(`Next:     ${nextParams.length}`);
  console.log("");
  printList("Added", diff.added);
  printList("Updated", diff.updated);
  printList("Removed", diff.removed);
  printList("Content fields changed", contentChanges);
  console.log(`Unchanged incoming: ${diff.unchanged.length}`);

  const hasChanges =
    diff.added.length || diff.updated.length || diff.removed.length || contentChanges.length;
  if (!hasChanges) {
    console.log("\nParameters are already in sync. No network write is needed.\n");
    return;
  }

  if (args.mode !== "live") {
    console.log("\nNo network writes were made. Pass --live to save parameters.\n");
    return;
  }

  const id = await saveParameters({
    cmsBaseUrl,
    headers,
    template: existing,
    parameters: nextParams,
    content: nextContent,
  });
  console.log(`\nSaved BlockTemplate parameters: ${existing.code} -> ${id}\n`);
};

main().catch((error) => fail(error.stack || error.message || String(error)));
