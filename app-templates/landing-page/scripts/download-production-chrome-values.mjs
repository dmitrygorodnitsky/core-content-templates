/* Download effective reusable header/footer values from a production PageContext.
 *
 * This command is CMS read-only. It reads a PageContext and the selected
 * BlockTemplate trees, then overlays page-specific values over template
 * defaults. It never calls a save endpoint and has no --live mode.
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
const DEFAULT_HEADER_CODE = "HEADER";
const DEFAULT_FOOTER_CODE = "FOOTER";
const DEFAULT_OUTPUT = join(
  landingRoot,
  "content",
  "servicewand-production-chrome",
  "parameter-values.json",
);
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    if (arg === "--page-url") out.pageUrl = args[++index];
    else if (arg === "--page-context-id") out.pageContextId = args[++index];
    else if (arg === "--header-code") out.headerCode = args[++index];
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
    --page-url /the-production-page \\
    --base-url https://servicewand.com/core \\
    --org SYSTEM

Page selector (exactly one is required):
  --page-url <path>          Exact PageContext URL, for example / or /industries/field-service.
  --page-context-id <id>    Numeric PageContext id from Core CMS.

Defaults:
  --header-code ${DEFAULT_HEADER_CODE}
  --footer-code ${DEFAULT_FOOTER_CODE}
  --out app-templates/landing-page/content/servicewand-production-chrome/parameter-values.json

Options:
  --stdout                Print JSON instead of writing the snapshot.
  --cms-base-url <url>    Override the derived Core CMS URL.
  --allow-non-production  Required when the source host is not servicewand.com.

The snapshot contains effective page values: saved PageContext overrides take
precedence over BlockTemplate defaults. The command performs only PageContext
get/list and BlockTemplate list requests. It has no --live mode and never calls
a save endpoint.

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

const normalizePageUrl = (value) => {
  const input = String(value || "").trim();
  if (!input) throw new Error("--page-url must not be empty.");
  if (/^https?:\/\//i.test(input)) {
    const parsed = new URL(input);
    return `${parsed.pathname}${parsed.search}` || "/";
  }
  return input.startsWith("/") ? input : `/${input}`;
};

const pageContextMappings = [
  { name: "id" },
  { name: "url" },
  { name: "site" },
  { name: "values" },
  { name: "enabledTemplates" },
  {
    name: "template",
    type: "identifier",
    mappings: [{ name: "id" }, { name: "code" }],
  },
];

const resolvePageContextId = async ({ cmsBaseUrl, headers, pageUrl }) => {
  const response = await requestJson(`${cmsBaseUrl}/api/page-context/list.json`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      filters: [{ property: "url", operator: "=", type: "STRING", value: pageUrl }],
      mappings: [{ name: "id" }, { name: "url" }],
      offset: 0,
      pageSize: 10,
    }),
  });
  const matches = (response?.result || []).filter((page) => page.url === pageUrl);
  if (matches.length > 1) {
    throw new Error(`PageContext URL is ambiguous: ${pageUrl} matched ${matches.length} records. Use --page-context-id.`);
  }
  if (matches.length !== 1 || matches[0].id === undefined || matches[0].id === null) {
    throw new Error(`Production PageContext was not found by exact URL: ${pageUrl}`);
  }
  return matches[0].id;
};

const getPageContext = async ({ cmsBaseUrl, headers, id }) => {
  const page = await requestJson(
    `${cmsBaseUrl}/api/page-context/get.json?id=${encodeURIComponent(id)}`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(pageContextMappings),
    },
  );
  if (!page || page.id === undefined || page.id === null) {
    throw new Error(`Production PageContext was not found by id: ${id}`);
  }
  return page;
};

const templateFields = [{ name: "id" }, { name: "code" }, { name: "parameters" }];

const childrenMapping = (depth) => ({
  name: "children",
  type: "collection",
  mappings: [
    ...templateFields,
    ...(depth > 1 ? [childrenMapping(depth - 1)] : []),
  ],
});

const listTemplateTreeByCode = async ({ cmsBaseUrl, headers, code, enabledTemplateIds }) => {
  const response = await requestJson(`${cmsBaseUrl}/api/block-template/list.json`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      filters: [{ property: "code", operator: "=", type: "STRING", value: code }],
      mappings: [...templateFields, childrenMapping(8)],
      offset: 0,
      pageSize: 10,
    }),
  });
  const matches = (response?.result || []).filter((template) => template.code === code);
  if (!matches.length) throw new Error(`Production BlockTemplate was not found by code: ${code}`);
  const enabled = new Set(enabledTemplateIds || []);
  const pageMatches = matches.filter((template) => enabled.has(template.id));
  if (pageMatches.length === 1) return pageMatches[0];
  const candidateIds = matches.map((template) => template.id).filter(Boolean).sort().join(", ");
  if (pageMatches.length > 1) {
    throw new Error(
      `Template code is ambiguous inside this PageContext: ${code} matched ${pageMatches.length} enabled records ` +
      `(${pageMatches.map((template) => template.id).sort().join(", ")}).`,
    );
  }
  if (matches.length === 1) return matches[0];
  throw new Error(
    `Template code ${code} matched ${matches.length} records, but none is enabled on this PageContext. ` +
    `Candidates: ${candidateIds}`,
  );
};

const flattenTemplateTree = (root) => {
  const result = [];
  const visit = (template) => {
    result.push(template);
    for (const child of template.children || []) visit(child);
  };
  visit(root);
  return result;
};

const localCodeToken = (code) => String(code || "").trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_");
const sortedObject = (entries) => Object.fromEntries(
  entries.sort(([left], [right]) => left.localeCompare(right)),
);

const pageValueIndex = (values, templates) => {
  const source = values && typeof values === "object" && !Array.isArray(values) ? values : {};
  const parameterOwners = new Map();
  for (const template of templates) {
    for (const parameter of template.parameters || []) {
      const owners = parameterOwners.get(parameter.code) || [];
      owners.push(template.id);
      parameterOwners.set(parameter.code, owners);
    }
  }

  const legacy = new Map();
  const unresolvedKeys = [];
  for (const [key, value] of Object.entries(source)) {
    if (UUID_RE.test(key) && value && typeof value === "object" && !Array.isArray(value)) continue;
    const owners = parameterOwners.get(key) || [];
    if (owners.length === 1) legacy.set(`${owners[0]}.${key}`, value);
    else unresolvedKeys.push(key);
  }

  const lookup = (templateId, parameterCode) => {
    const bucket = source[templateId];
    if (bucket && typeof bucket === "object" && !Array.isArray(bucket) && Object.hasOwn(bucket, parameterCode)) {
      return { found: true, value: bucket[parameterCode], source: "pageContext" };
    }
    const legacyKey = `${templateId}.${parameterCode}`;
    if (legacy.has(legacyKey)) return { found: true, value: legacy.get(legacyKey), source: "legacyPageContext" };
    return { found: false };
  };

  return { lookup, unresolvedKeys: unresolvedKeys.sort() };
};

const effectiveTemplates = ({ root, valueIndex, enabledTemplates }) => {
  const templates = flattenTemplateTree(root);
  const enabled = new Set(enabledTemplates || []);
  const effective = templates.map((template) => {
    const valueEntries = [];
    const typeEntries = [];
    const sourceEntries = [];
    for (const parameter of template.parameters || []) {
      const override = valueIndex.lookup(template.id, parameter.code);
      const value = override.found ? override.value : parameter.value;
      if (value === undefined || (!override.found && value === null)) continue;
      valueEntries.push([parameter.code, value]);
      typeEntries.push([parameter.code, parameter.type || "STRING"]);
      sourceEntries.push([parameter.code, override.found ? override.source : "templateDefault"]);
    }
    return {
      code: template.code,
      id: template.id,
      enabledOnPage: enabled.has(template.id),
      values: sortedObject(valueEntries),
      parameterTypes: sortedObject(typeEntries),
      valueSources: sortedObject(sourceEntries),
    };
  });
  return { templates: effective };
};

const mapToAuthoredBlock = ({ target, root, effective }) => {
  const block = readJson(target.blockJson);
  const localParams = block.params || [];
  const candidates = [];
  for (const template of effective.templates) {
    for (const [code, value] of Object.entries(template.values)) {
      candidates.push({
        templateCode: template.code,
        templateId: template.id,
        code,
        value,
        type: template.parameterTypes[code],
        source: template.valueSources[code],
      });
    }
  }

  const matched = new Set();
  const values = [];
  const types = [];
  const sources = [];
  const missingLocalCodes = [];
  const ambiguousLocalCodes = [];
  for (const local of localParams) {
    const token = localCodeToken(local.code);
    const matches = candidates.filter((candidate) => (
      candidate.code === token || candidate.code.endsWith(`_${token}`)
    ));
    if (matches.length === 0) {
      missingLocalCodes.push(local.code);
      continue;
    }
    if (matches.length > 1) {
      ambiguousLocalCodes.push({
        code: local.code,
        candidates: matches.map((candidate) => `${candidate.templateCode}.${candidate.code}`).sort(),
      });
      continue;
    }
    const candidate = matches[0];
    matched.add(`${candidate.templateId}.${candidate.code}`);
    values.push([local.code, candidate.value]);
    types.push([local.code, candidate.type || local.type || "STRING"]);
    sources.push([local.code, candidate.source]);
  }

  const unmappedParameters = candidates
    .filter((candidate) => !matched.has(`${candidate.templateId}.${candidate.code}`))
    .sort((left, right) => (
      left.templateCode.localeCompare(right.templateCode) || left.code.localeCompare(right.code)
    ));

  return {
    block: target.block,
    rootTemplateCode: root.code,
    rootTemplateId: root.id,
    values: sortedObject(values),
    parameterTypes: sortedObject(types),
    valueSources: sortedObject(sources),
    missingLocalCodes: missingLocalCodes.sort(),
    ambiguousLocalCodes,
    sourceTemplates: effective.templates,
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
  if (Boolean(args.pageUrl) === Boolean(args.pageContextId)) {
    throw new Error("Specify exactly one page selector: --page-url or --page-context-id.");
  }
  if (args.pageContextId !== undefined && !/^\d+$/.test(String(args.pageContextId))) {
    throw new Error("--page-context-id must be a numeric Core CMS PageContext id.");
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
  const requestedPageUrl = args.pageUrl ? normalizePageUrl(args.pageUrl) : undefined;
  const pageContextId = requestedPageUrl
    ? await resolvePageContextId({ cmsBaseUrl, headers, pageUrl: requestedPageUrl })
    : Number(args.pageContextId);
  const pageContext = await getPageContext({ cmsBaseUrl, headers, id: pageContextId });
  const [header, footer] = await Promise.all([
    listTemplateTreeByCode({
      cmsBaseUrl,
      headers,
      code: headerCode,
      enabledTemplateIds: pageContext.enabledTemplates,
    }),
    listTemplateTreeByCode({
      cmsBaseUrl,
      headers,
      code: footerCode,
      enabledTemplateIds: pageContext.enabledTemplates,
    }),
  ]);

  const roots = { header, footer };
  const valueIndex = pageValueIndex(
    pageContext.values,
    [header, footer].flatMap((root) => flattenTemplateTree(root)),
  );
  const templates = Object.fromEntries(targets.map((target) => {
    const root = roots[target.key];
    const effective = effectiveTemplates({
      root,
      valueIndex,
      enabledTemplates: pageContext.enabledTemplates,
    });
    return [target.key, mapToAuthoredBlock({ target, root, effective })];
  }));

  const snapshot = {
    $schema: "lab-ui/production-page-chrome-values@2",
    source: {
      environment: "production",
      baseUrl,
      cmsBaseUrl,
      organization: org,
      readOnly: true,
      pageContext: {
        id: pageContext.id,
        url: pageContext.url,
        site: pageContext.site,
        template: pageContext.template
          ? { id: pageContext.template.id, code: pageContext.template.code }
          : null,
      },
    },
    templates,
    unresolvedPageValueKeys: valueIndex.unresolvedKeys,
  };

  if (args.stdout) {
    process.stdout.write(`${JSON.stringify(snapshot, null, 2)}\n`);
    return;
  }
  const output = writeJsonAtomic(args.out || DEFAULT_OUTPUT, snapshot);
  console.log("Downloaded effective production page chrome values (CMS READ ONLY).");
  console.log(`PageContext: ${pageContext.id} ${pageContext.url || "<no url>"}`);
  console.log(`Header: ${header.code} (${header.id}) -> ${Object.keys(templates.header.values).length} mapped values`);
  console.log(`Footer: ${footer.code} (${footer.id}) -> ${Object.keys(templates.footer.values).length} mapped values`);
  console.log(`Output: ${output}`);
  console.log("CMS writes: 0");
};

main().catch((error) => fail(error.stack || error.message || String(error)));
