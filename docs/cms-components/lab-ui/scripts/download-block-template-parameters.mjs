/* Download parameters from one CMS BlockTemplate.
 *
 * Output is intentionally compatible with sync-block-template-parameters.mjs
 * --parameters-json: a plain normalized parameters array by default.
 *
 * Read-only script: it never writes to CMS.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const DEFAULT_CORE_BASE_URL = "https://lsrc.pixelnation.com/core";
const DEFAULT_ORG = "SYSTEM";

const parseArgs = () => {
  const args = process.argv.slice(2);
  const out = { format: "parameters" };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--template-id") out.templateId = args[++i];
    else if (arg === "--template-code") out.templateCode = args[++i];
    else if (arg === "--out") out.out = args[++i];
    else if (arg === "--format") out.format = args[++i];
    else if (arg === "--base-url") out.baseUrl = args[++i];
    else if (arg === "--cms-base-url" || arg === "--api-base-url") out.cmsBaseUrl = args[++i];
    else if (arg === "--org") out.org = args[++i];
    else if (arg === "--raw") out.raw = true;
    else if (arg === "--help" || arg === "-h") out.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return out;
};

const usage = () => `Usage:
  node docs/cms-components/lab-ui/scripts/download-block-template-parameters.mjs \\
    --template-id <cmsBlockTemplateId> \\
    --out tmp/stage-parameters.json \\
    [--base-url https://lsrc.pixelnation.com/core] [--org SYSTEM]
    [--cms-base-url https://lsrc.pixelnation.com/core-cms]

Alternative target:
  --template-code SECTION_01_HEADER_CORPORATE_REFERENCE

Output:
  --format parameters  Plain parameters array, compatible with sync-block-template-parameters.mjs --parameters-json. Default.
  --format template    Full downloaded block template object with normalized parameters.
  --raw                Keep parameters exactly as CMS returns them instead of normalizing for sync.

If --out is omitted, JSON is printed to stdout.

Env credentials:
  SERVICEWAND_API_KEY or LANDING_API_KEY
  SERVICEWAND_BEARER  or LANDING_BEARER

Optional env:
  SERVICEWAND_BASE_URL or LANDING_BASE_URL
  SERVICEWAND_CMS_BASE_URL or LANDING_CMS_BASE_URL
  SERVICEWAND_ORG          or LANDING_ORG`;

const fail = (message, code = 1) => {
  console.error(`download-block-template-parameters: ${message}`);
  process.exit(code);
};

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
  } catch {
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

const buildOutput = ({ template, raw, format }) => {
  const parameters = raw
    ? (template.parameters || [])
    : (template.parameters || []).map(normalizeParameter);

  if (format === "parameters") return parameters;
  if (format === "template") return { ...template, parameters };
  throw new Error(`Unknown --format: ${format}. Use parameters or template.`);
};

const writeJson = (file, json) => {
  const target = resolve(file);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, `${JSON.stringify(json, null, 2)}\n`, "utf8");
  return target;
};

const main = async () => {
  const args = parseArgs();
  if (args.help) {
    console.log(usage());
    return;
  }
  if (!args.templateId && !args.templateCode) throw new Error("Pass --template-id or --template-code.");
  if (args.templateId && args.templateCode) throw new Error("Pass only one of --template-id or --template-code.");

  const baseUrl = args.baseUrl || envFirst("SERVICEWAND_BASE_URL", "LANDING_BASE_URL") || DEFAULT_CORE_BASE_URL;
  const cmsBaseUrl = (
    args.cmsBaseUrl ||
    envFirst("SERVICEWAND_CMS_BASE_URL", "LANDING_CMS_BASE_URL") ||
    cmsServiceUrl(baseUrl)
  ).replace(/\/+$/, "");
  const org = args.org || envFirst("SERVICEWAND_ORG", "LANDING_ORG") || DEFAULT_ORG;
  const apiKey = envFirst("SERVICEWAND_API_KEY", "LANDING_API_KEY");
  const bearer = envFirst("SERVICEWAND_BEARER", "LANDING_BEARER");

  const token = await getAccessToken({ baseUrl, apiKey, bearer });
  const headers = cmsHeaders(token, org);
  const template = await listBlockTemplate({
    cmsBaseUrl,
    headers,
    templateId: args.templateId,
    templateCode: args.templateCode,
  });
  if (!template?.id) throw new Error(`BlockTemplate was not found: ${args.templateId || args.templateCode}`);

  const output = buildOutput({
    template,
    raw: Boolean(args.raw),
    format: args.format,
  });
  const json = `${JSON.stringify(output, null, 2)}\n`;

  if (!args.out) {
    process.stdout.write(json);
    return;
  }

  const target = writeJson(args.out, output);
  const count = Array.isArray(output) ? output.length : output.parameters?.length || 0;
  console.log(`Downloaded BlockTemplate parameters: ${template.code} (${template.id})`);
  console.log(`CMS:        ${cmsBaseUrl}`);
  console.log(`Org:        ${org}`);
  console.log(`Format:     ${args.format}${args.raw ? " raw" : " normalized"}`);
  console.log(`Parameters: ${count}`);
  console.log(`Output:     ${target}`);
};

main().catch((error) => fail(error.stack || error.message || String(error)));
