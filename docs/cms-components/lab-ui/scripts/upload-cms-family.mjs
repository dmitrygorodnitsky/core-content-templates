/* Upload generated lab-ui CMS family artifacts into ServiceWand CMS.
 *
 *   node docs/cms-components/lab-ui/scripts/upload-cms-family.mjs \
 *     --out docs/cms-components/lab-ui/dist/<slug> [--dry-run | --live]
 *
 * Dry-run is the default. Live mode is idempotent by template/page code:
 * it looks up existing BlockTemplate/PageContext records, saves with their
 * ids when present, then re-parents children to preserve root order.
 */

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const DEFAULT_CORE_BASE_URL = "https://lsrc.pixelnation.com/core";
const DEFAULT_ORG = "SYSTEM";

const parseArgs = () => {
  const args = process.argv.slice(2);
  const out = { mode: "dry-run" };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--out") out.out = args[++i];
    else if (arg === "--base-url") out.baseUrl = args[++i];
    else if (arg === "--org") out.org = args[++i];
    else if (arg === "--root-code") out.rootCode = args[++i];
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
    [--root-code FIELD_SERVICE_LANDING]

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
  if (!existsSync(file)) fail(`Payload not found: ${file}. Run build-landing.mjs first.`);
  return readJson(file);
};

const withRootCode = (payload, rootCode) => {
  if (!rootCode || rootCode === payload.root?.code) return payload;
  const previousCode = payload.root.code;
  return {
    ...payload,
    root: {
      ...payload.root,
      code: rootCode,
      html: String(payload.root.html || "").replaceAll(previousCode, rootCode),
    },
    children: (payload.children || []).map((child) => ({
      ...child,
      parent: { ...(child.parent || {}), code: rootCode },
    })),
    pageContext: payload.pageContext
      ? {
          ...payload.pageContext,
          template: { ...(payload.pageContext.template || {}), code: rootCode },
        }
      : payload.pageContext,
  };
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
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }
  throw lastError;
};

const pause = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

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

const summarizePayload = (payload) => ({
  generatedAt: payload.generatedAt,
  mode: payload.mode,
  rootCode: payload.root?.code,
  pageUrl: payload.pageContext?.url,
  childCount: (payload.children || []).length,
  totalTemplates: flattenTemplates(payload.children || []).length + 1,
  parameterCount: countParams(payload.root, payload.children),
});

const flattenTemplates = (templates = []) =>
  templates.flatMap((template) => [template, ...flattenTemplates(template.children || [])]);

const countParams = (root, children) => {
  const recur = (template) =>
    (template.parameters?.length || 0) + (template.children || []).reduce((sum, child) => sum + recur(child), 0);
  return (root?.parameters?.length || 0) + (children || []).reduce((sum, child) => sum + recur(child), 0);
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
  { name: "parent", type: "identifier", mappings: [{ name: "id" }, { name: "code" }] },
  { name: "parameters" },
];

const pageMappings = [
  { name: "id" },
  { name: "url" },
  { name: "excludeFromSeo" },
  { name: "optimistic" },
  { name: "nls" },
  { name: "organization", type: "identifier", mappings: [{ name: "id" }, { name: "code" }, { name: "name" }] },
  { name: "template", type: "identifier", mappings: [{ name: "id" }, { name: "code" }] },
  { name: "enabledTemplates" },
  { name: "values" },
];

const listByCode = async ({ cmsBaseUrl, headers, entity, code, mappings }) => {
  const response = await requestJson(`${cmsBaseUrl}/api/${entity}/list.json`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      filters: [{ property: "code", operator: "=", value: code }],
      mappings,
      offset: 0,
      pageSize: 10,
    }),
  });
  return (response?.result || []).find((item) => item.code === code) || null;
};

const listPageByUrl = async ({ cmsBaseUrl, headers, url }) => {
  const response = await requestJson(`${cmsBaseUrl}/api/page-context/list.json`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      filters: [{ property: "url", operator: "=", value: url }],
      mappings: pageMappings,
      offset: 0,
      pageSize: 10,
    }),
  });
  return (response?.result || []).find((item) => item.url === url) || null;
};

const normalizeTemplateForSave = (template, existing, refs = {}) => {
  const entity = {
    ...template,
    id: existing?.id,
    organization: existing?.organization?.id
      ? { id: existing.organization.id, code: existing.organization.code }
      : organizationIdentifier(refs.org),
    advanced: template.advanced ?? existing?.advanced ?? false,
    parent: refs.parentId ? { id: refs.parentId, code: template.parent?.code } : null,
  };

  if (!entity.parent) delete entity.parent;
  delete entity.children;
  if (Array.isArray(entity.parameters)) {
    entity.parameters = entity.parameters.map((parameter) => {
      const { options: _options, ...rest } = parameter;
      return rest;
    });
  }
  delete entity.optimistic;
  return entity;
};

const saveBlockTemplate = async ({ cmsBaseUrl, headers, template, existing, parentId, org }) => {
  const entity = normalizeTemplateForSave(template, existing, { parentId, org });
  const response = await requestText(`${cmsBaseUrl}/api/block-template/save.json`, {
    method: "POST",
    headers,
    body: JSON.stringify({ entities: [entity], mappings: blockMappings }),
  });
  await pause();
  try {
    const parsed = JSON.parse(response);
    if (Array.isArray(parsed)) return String(parsed[0]);
    return String(parsed);
  } catch {
    return response.replace(/^"|"$/g, "");
  }
};

const reparent = async ({ cmsBaseUrl, headers, id, parentId }) => {
  await requestText(`${cmsBaseUrl}/api/block-template/reparent.json`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ id, parentId }),
  });
  await pause();
};

const savePageContext = async ({ cmsBaseUrl, headers, payload, rootId, templateRefs, org, existing }) => {
  const page = payload.pageContext;
  if (!page?.url) return null;

  const enabledTemplates = templateRefs.map((template) => template.id);
  const entity = {
    id: existing?.id,
    optimistic: existing?.optimistic,
    url: page.url,
    nls: page.nls,
    template: { id: rootId, code: payload.root.code },
    enabledTemplates,
    values: page.values || {},
    organization: existing?.organization?.id ? { id: existing.organization.id, code: existing.organization.code } : organizationIdentifier(org),
    excludeFromSeo: page.excludeFromSeo ?? false,
  };
  if (!entity.id) delete entity.id;
  if (entity.optimistic === undefined) delete entity.optimistic;
  if (!entity.nls) delete entity.nls;

  const text = await requestText(`${cmsBaseUrl}/api/page-context/save.json`, {
    method: "POST",
    headers,
    body: JSON.stringify({ entities: [entity], mappings: pageMappings }),
  });
  await pause();
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed[0];
    return parsed;
  } catch {
    return Number(text);
  }
};

const printDryRun = ({ baseUrl, cmsBaseUrl, apiKey, bearer, org }, payload) => {
  const summary = summarizePayload(payload);
  console.log("\n=== upload-cms-family · DRY RUN ===\n");
  console.log("Payload summary:");
  for (const [key, value] of Object.entries(summary)) console.log(`  ${key.padEnd(18)} ${value}`);

  console.log("\nTarget:");
  console.log(`  CMS base: ${cmsBaseUrl}`);
  console.log(`  Org:      ${org}`);

  console.log("\nAuth:");
  console.log(`  baseUrl: ${baseUrl}`);
  console.log(`  apiKey:  ${apiKey ? maskSecret(apiKey) : "(none)"}`);
  console.log(`  bearer:  ${bearer ? maskSecret(bearer) : "(none)"}`);

  console.log("\nLive sequence:");
  console.log(`  1. Resolve bearer token`);
  console.log(`  2. Upsert root BlockTemplate ${summary.rootCode}`);
  console.log(`  3. Upsert ${summary.childCount} child BlockTemplate records`);
  console.log(`  4. Reparent children under root in payload order`);
  console.log(`  5. Upsert PageContext ${summary.pageUrl}`);
  console.log("\nNo network writes were made. Pass --live to upload.\n");
};

const uploadLive = async (env, payload) => {
  const token = await getAccessToken(env);
  const headers = cmsHeaders(token, env.org);
  const summary = summarizePayload(payload);

  console.log(`Uploading CMS family ${summary.rootCode} to ${env.cmsBaseUrl} (${env.org})`);

  const existingRoot = await listByCode({
    cmsBaseUrl: env.cmsBaseUrl,
    headers,
    entity: "block-template",
    code: payload.root.code,
    mappings: blockMappings,
  });

  let rootId = existingRoot?.id;
  if (existingRoot?.id) {
    console.log(`  root: ${payload.root.code} -> ${rootId} (existing; root body left unchanged)`);
  } else {
    rootId = await saveBlockTemplate({
      cmsBaseUrl: env.cmsBaseUrl,
      headers,
      template: { ...payload.root, children: [] },
      existing: existingRoot,
      org: env.org,
    });
    console.log(`  root: ${payload.root.code} -> ${rootId}`);
  }

  const childRefs = [];
  for (const child of payload.children || []) {
    const existingChild = await listByCode({
      cmsBaseUrl: env.cmsBaseUrl,
      headers,
      entity: "block-template",
      code: child.code,
      mappings: blockMappings,
    });
    let childId = existingChild?.id;
    try {
      childId = await saveBlockTemplate({
        cmsBaseUrl: env.cmsBaseUrl,
        headers,
        template: child,
        existing: existingChild,
        org: env.org,
      });
    } catch (error) {
      if (!existingChild?.id) throw error;
      console.log(`  child update skipped: ${child.code} (${error.message.split("\n")[0]})`);
    }
    childRefs.push({ id: childId, code: child.code, nls: child.nls });
    console.log(`  child: ${child.code} -> ${childId}`);
  }

  for (let index = childRefs.length - 1; index >= 0; index -= 1) {
    await reparent({
      cmsBaseUrl: env.cmsBaseUrl,
      headers,
      id: childRefs[index].id,
      parentId: rootId,
    });
  }

  const existingPage = payload.pageContext?.url
    ? await listPageByUrl({ cmsBaseUrl: env.cmsBaseUrl, headers, url: payload.pageContext.url })
    : null;
  const pageId = await savePageContext({
    cmsBaseUrl: env.cmsBaseUrl,
    headers,
    payload,
    rootId,
    templateRefs: [{ id: rootId, code: payload.root.code }, ...childRefs],
    org: env.org,
    existing: existingPage,
  });

  console.log(`  page-context: ${payload.pageContext?.url || "(none)"} -> ${pageId ?? "(skipped)"}`);
  const enabledTemplateIds = [rootId, ...childRefs.map((child) => child.id)].join(",");
  console.log(`Upload complete. Preview: ${env.cmsBaseUrl}/page-context/0/preview.html?templateId=${rootId}&enabledTemplates=${enabledTemplateIds}`);
  return { rootId, childCount: childRefs.length, pageId };
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
  const apiKey = envFirst("SERVICEWAND_API_KEY", "LANDING_API_KEY", "DEPLOY_API_KEY");
  const bearer = envFirst("SERVICEWAND_BEARER", "LANDING_BEARER");
  const cmsBaseUrl = serviceUrl(baseUrl, "core-cms");
  const payload = withRootCode(readPayload(outAbs), args.rootCode);
  const env = { baseUrl, cmsBaseUrl, org, apiKey, bearer };

  if (args.mode === "dry-run") {
    printDryRun(env, payload);
    return;
  }

  await uploadLive(env, payload);
};

main().catch((error) => fail(error.stack || error.message || String(error)));
