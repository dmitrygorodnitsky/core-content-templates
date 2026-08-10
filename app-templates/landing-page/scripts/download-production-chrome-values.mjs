/* Download reusable header/footer values from production Core CMS.
 *
 * This command is CMS read-only: it authenticates and calls only
 * /api/block-template/list.json. It never calls a save endpoint and has no
 * --live mode. The resulting local snapshot is keyed by authored block-local
 * parameter codes so future compositions can reuse it across template prefixes.
 */

import {
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = dirname(fileURLToPath(import.meta.url));
const landingRoot = resolve(scriptsDir, "..");
const DEFAULT_CORE_BASE_URL = "https://servicewand.com/core";
const DEFAULT_ORG = "SYSTEM";
const DEFAULT_HEADER_CODE = "FIELD_SERVICE_LANDING_HEADER";
const DEFAULT_FOOTER_CODE = "FIELD_SERVICE_LANDING_FOOTER";
const DEFAULT_OUTPUT = join(
  landingRoot,
  "content",
  "servicewand-production-chrome",
  "parameter-values.json",
);

const targets = [
  {
    key: "header",
    block: "header.corporate-reference",
    blockJson: join(landingRoot, "blocks", "01-header", "header.corporate-reference", "block.json"),
  },
  {
    key: "footer",
    block: "footer.corporate-reference",
    blockJson: join(landingRoot, "blocks", "02-footer", "footer.corporate-reference", "block.json"),
  },
];

const parseArgs = () => {
  const args = process.argv.slice(2);
  const out = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--header-code") out.headerCode = args[++index];
    else if (arg === "--footer-code") out.footerCode = args[++index];
    else if (arg === "--out") out.out = args[++index];
    else if (arg === "--stdout") out.stdout = true;
    else if (arg === "--base-url") out.baseUrl = args[++index];
    else if (arg === "--cms-base-url" || arg === "--api-base-url") out.cmsBaseUrl = args[++index];
    else if (arg === "--org") out.org = args[++index];
    else if (arg === "--allow-non-production") out.allowNonProduction = true;
    else if (arg === "--help" || arg === "-h") out.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return out;
};

const usage = () => `Usage:
  SERVICEWAND_API_KEY="..." \\
  node app-templates/landing-page/scripts/download-production-chrome-values.mjs \\
    --base-url https://servicewand.com/core \\
    --org SYSTEM

Defaults:
  --header-code ${DEFAULT_HEADER_CODE}
  --footer-code ${DEFAULT_FOOTER_CODE}
  --out app-templates/landing-page/content/servicewand-production-chrome/parameter-values.json

Options:
  --stdout                Print JSON instead of writing the snapshot.
  --cms-base-url <url>    Override the derived Core CMS URL.
  --allow-non-production  Required when the source host is not servicewand.com.

This command is read-only in CMS. It performs authentication and two typed
BlockTemplate list requests. There is intentionally no --live mode and no save
request in this script.

Env credentials:
  SERVICEWAND_API_KEY or LANDING_API_KEY
  SERVICEWAND_BEARER  or LANDING_BEARER`;

const fail = (message, code = 1) => {
  console.error(`download-production-chrome-values: ${message}`);
  process.exit(code);
};

const envFirst = (...names) => {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim()) return value.trim();
  }
  return "";
};

const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));

const requestText = async (url, options = {}) => {
  let lastError;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(url, options);
      const text = await response.text();
      if (!response.ok) {
        const detail = text.trim() ? text.slice(0, 800) : "<empty response body>";
        throw new Error(`${options.method || "GET"} ${url} -> ${response.status}: ${detail}`);
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
  const issuer = metadata?.authorization_servers?.[0];
  if (!issuer) throw new Error("OAuth issuer is missing.");
  const openid = await requestJson(`${issuer}/.well-known/openid-configuration`);
  if (!openid?.token_endpoint) throw new Error("OAuth token endpoint is missing.");
  const token = await requestJson(openid.token_endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-API-Key": apiKey,
    },
    body: new URLSearchParams({ grant_type: "api_key", scope: "openid" }),
  });
  if (!token?.access_token) throw new Error("Token response did not include access_token.");
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

const assertProductionSource = ({ baseUrl, cmsBaseUrl, allowNonProduction }) => {
  if (allowNonProduction) return;
  const hosts = [new URL(baseUrl).hostname, new URL(cmsBaseUrl).hostname];
  if (hosts.some((host) => host !== "servicewand.com" && host !== "www.servicewand.com")) {
    throw new Error(
      `Refusing to label a non-production source as production: ${hosts.join(", ")}. ` +
      "Pass --allow-non-production only for a controlled test or explicit override.",
    );
  }
};

const blockMappings = [
  { name: "id" },
  { name: "code" },
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
  const matches = (response?.result || []).filter((template) => template.code === code);
  if (matches.length > 1) throw new Error(`Template code is ambiguous: ${code} matched ${matches.length} records.`);
  if (!matches[0]?.id) throw new Error(`Production BlockTemplate was not found by code: ${code}`);
  return matches[0];
};

const localCodeToken = (code) => String(code || "").trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_");

const inferPrefix = (parameters, localParams) => {
  const counts = new Map();
  for (const parameter of parameters) {
    const cmsCode = String(parameter?.code || "");
    for (const local of localParams) {
      const suffix = `_${localCodeToken(local.code)}`;
      if (!cmsCode.endsWith(suffix)) continue;
      const prefix = cmsCode.slice(0, -suffix.length);
      counts.set(prefix, (counts.get(prefix) || 0) + 1);
    }
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  if (!ranked.length) throw new Error("Could not infer the CMS parameter prefix from the authored block contract.");
  if (ranked[1] && ranked[1][1] === ranked[0][1]) {
    throw new Error(`CMS parameter prefix is ambiguous: ${ranked[0][0]}, ${ranked[1][0]}`);
  }
  return ranked[0][0];
};

const cleanValue = (value) => {
  if (value === null || value === undefined || value === "") return undefined;
  if (Array.isArray(value)) {
    const items = value.map(cleanValue).filter((item) => item !== undefined);
    return items.length ? items : undefined;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value)
      .map(([key, item]) => [key, cleanValue(item)])
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left.localeCompare(right));
    return entries.length ? Object.fromEntries(entries) : undefined;
  }
  return value;
};

const sortedObject = (entries) => Object.fromEntries(
  entries.sort(([left], [right]) => left.localeCompare(right)),
);

const snapshotTemplate = ({ target, template }) => {
  const block = readJson(target.blockJson);
  const localParams = block.params || [];
  const parameters = template.parameters || [];
  const parameterPrefix = inferPrefix(parameters, localParams);
  const byCode = new Map(parameters.map((parameter) => [parameter.code, parameter]));
  const matchedCodes = new Set();
  const values = [];
  const types = [];
  const missingLocalCodes = [];
  const unsetLocalCodes = [];

  for (const local of localParams) {
    const cmsCode = `${parameterPrefix}_${localCodeToken(local.code)}`;
    const parameter = byCode.get(cmsCode);
    if (!parameter) {
      missingLocalCodes.push(local.code);
      continue;
    }
    matchedCodes.add(cmsCode);
    const value = cleanValue(parameter.value);
    if (value === undefined) unsetLocalCodes.push(local.code);
    else values.push([local.code, value]);
    types.push([local.code, parameter.type || local.type || "STRING"]);
  }

  const unmappedParameters = parameters
    .filter((parameter) => !matchedCodes.has(parameter.code))
    .map((parameter) => ({
      code: parameter.code,
      type: parameter.type || "STRING",
      value: cleanValue(parameter.value),
    }))
    .filter((parameter) => parameter.value !== undefined)
    .sort((left, right) => left.code.localeCompare(right.code));

  return {
    block: target.block,
    templateCode: template.code,
    templateId: template.id,
    parameterPrefix,
    values: sortedObject(values),
    parameterTypes: sortedObject(types),
    missingLocalCodes: missingLocalCodes.sort(),
    unsetLocalCodes: unsetLocalCodes.sort(),
    unmappedParameters,
  };
};

const writeJsonAtomic = (file, value) => {
  const target = resolve(file);
  const temporary = `${target}.tmp-${process.pid}`;
  mkdirSync(dirname(target), { recursive: true });
  try {
    writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    renameSync(temporary, target);
  } finally {
    rmSync(temporary, { force: true });
  }
  return target;
};

const main = async () => {
  const args = parseArgs();
  if (args.help) {
    console.log(usage());
    return;
  }

  const baseUrl = (
    args.baseUrl || envFirst("SERVICEWAND_BASE_URL", "LANDING_BASE_URL") || DEFAULT_CORE_BASE_URL
  ).replace(/\/+$/, "");
  const cmsBaseUrl = (
    args.cmsBaseUrl || envFirst("SERVICEWAND_CMS_BASE_URL", "LANDING_CMS_BASE_URL") || cmsServiceUrl(baseUrl)
  ).replace(/\/+$/, "");
  const org = args.org || envFirst("SERVICEWAND_ORG", "LANDING_ORG") || DEFAULT_ORG;
  const headerCode = args.headerCode || DEFAULT_HEADER_CODE;
  const footerCode = args.footerCode || DEFAULT_FOOTER_CODE;
  assertProductionSource({ baseUrl, cmsBaseUrl, allowNonProduction: args.allowNonProduction });

  const token = await getAccessToken({
    baseUrl,
    apiKey: envFirst("SERVICEWAND_API_KEY", "LANDING_API_KEY"),
    bearer: envFirst("SERVICEWAND_BEARER", "LANDING_BEARER"),
  });
  const headers = cmsHeaders(token, org);
  const [header, footer] = await Promise.all([
    listByCode({ cmsBaseUrl, headers, code: headerCode }),
    listByCode({ cmsBaseUrl, headers, code: footerCode }),
  ]);
  const templates = Object.fromEntries(targets.map((target) => [
    target.key,
    snapshotTemplate({ target, template: target.key === "header" ? header : footer }),
  ]));
  const snapshot = {
    $schema: "lab-ui/production-chrome-values@1",
    source: {
      environment: "production",
      baseUrl,
      cmsBaseUrl,
      organization: org,
      readOnly: true,
    },
    templates,
  };

  if (args.stdout) {
    process.stdout.write(`${JSON.stringify(snapshot, null, 2)}\n`);
    return;
  }
  const output = writeJsonAtomic(args.out || DEFAULT_OUTPUT, snapshot);
  console.log("Downloaded production chrome values (CMS READ ONLY).");
  console.log(`Header: ${header.code} (${header.id}) -> ${Object.keys(templates.header.values).length} defined values`);
  console.log(`Footer: ${footer.code} (${footer.id}) -> ${Object.keys(templates.footer.values).length} defined values`);
  console.log(`Output: ${output}`);
  console.log("CMS writes: 0");
};

main().catch((error) => fail(error.stack || error.message || String(error)));
