/* Upload generated lab-ui CMS family artifacts into ServiceWand CMS.
 *
 *   node docs/cms-components/lab-ui/scripts/upload-cms-family.mjs \
 *     --out docs/cms-components/lab-ui/dist/<slug> [--dry-run | --live]
 *
 * Dry-run is the default.
 *
 * Strategies:
 * - upsert: legacy idempotent update by template/page code.
 * - revision: create a fresh template family with suffixed codes, then switch
 *   the PageContext to the new root + children after values are migrated.
 * - update-existing: update the template family already attached to --page-id
 *   by existing ids, preserving PageContext history and values.
 * - --templates-only: upload BlockTemplate records and print a preview URL
 *   without saving or switching PageContext.
 */

import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const DEFAULT_CORE_BASE_URL = "https://lsrc.pixelnation.com/core";
const DEFAULT_ORG = "SYSTEM";

const parseArgs = () => {
  const args = process.argv.slice(2);
  const out = { mode: "dry-run", strategy: "upsert" };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--out") out.out = args[++i];
    else if (arg === "--base-url") out.baseUrl = args[++i];
    else if (arg === "--org") out.org = args[++i];
    else if (arg === "--page-org") out.pageOrg = args[++i];
    else if (arg === "--root-code") out.rootCode = args[++i];
    else if (arg === "--root-name") out.rootName = args[++i];
    else if (arg === "--strategy") out.strategy = args[++i];
    else if (arg === "--revision-suffix") out.revisionSuffix = args[++i];
    else if (arg === "--page-id") out.pageId = args[++i];
    else if (arg === "--locale") out.locale = args[++i];
    else if (arg === "--templates-only" || arg === "--skip-page-context") out.templatesOnly = true;
    else if (arg === "--prune") out.prune = true;
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
    [--page-org SERVICEWAND]
    [--root-code FIELD_SERVICE_LANDING] [--root-name "Field Service Landing"]
    [--strategy upsert|revision|update-existing] [--revision-suffix 20260608_001]
    [--page-id 36] [--locale en] [--prune]
    [--templates-only]

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

const withRootName = (payload, rootName) => {
  if (!rootName) return payload;
  return {
    ...payload,
    root: {
      ...payload.root,
      nls: {
        ...(payload.root?.nls || {}),
        en: {
          ...(payload.root?.nls?.en || {}),
          NAME: rootName,
        },
      },
    },
  };
};

const codeSuffix = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");

const hashCode = (value) => {
  let hash = 0;
  for (const char of String(value)) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  return Math.abs(hash).toString(36).toUpperCase().slice(0, 5).padStart(5, "0");
};

const templateCodeWithSuffix = (code, suffix) => {
  const candidate = `${code}_${suffix}`;
  const max = 64;
  if (candidate.length <= max) return candidate;
  const hash = hashCode(code);
  const reserved = suffix.length + hash.length + 2;
  const prefix = String(code).slice(0, Math.max(8, max - reserved)).replace(/_+$/, "");
  return `${prefix}_${hash}_${suffix}`;
};

const defaultRevisionSuffix = () => {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+$/, "").replace("T", "_");
  return `REV_${stamp}`;
};

const withTemplateCodeSuffix = (payload, suffixInput) => {
  const suffix = codeSuffix(suffixInput || defaultRevisionSuffix());
  if (!suffix) throw new Error("revision suffix normalized to an empty value.");

  const mapCode = (code) => templateCodeWithSuffix(code, suffix);
  const previousRootCode = payload.root.code;
  const nextRootCode = mapCode(previousRootCode);

  const rewriteTemplate = (template, parentCode = nextRootCode) => {
    const nextCode = mapCode(template.code);
    return {
      ...template,
      code: nextCode,
      parent: template.parent ? { ...(template.parent || {}), code: parentCode } : template.parent,
      children: (template.children || []).map((child) => rewriteTemplate(child, nextCode)),
    };
  };

  return {
    ...payload,
    root: {
      ...payload.root,
      code: nextRootCode,
      html: String(payload.root.html || "").replaceAll(previousRootCode, nextRootCode),
      children: (payload.root.children || []).map((child) => ({
        ...child,
        code: mapCode(child.code),
      })),
    },
    children: (payload.children || []).map((child) => rewriteTemplate(child, nextRootCode)),
    pageContext: payload.pageContext
      ? {
          ...payload.pageContext,
          template: { ...(payload.pageContext.template || {}), code: nextRootCode },
          enabledTemplates: (payload.pageContext.enabledTemplates || []).map(mapCode),
        }
      : payload.pageContext,
    revision: {
      suffix,
      previousRootCode,
      rootCode: nextRootCode,
    },
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
  if (org && typeof org === "object") return org;
  if (String(org).toUpperCase() === "SYSTEM") return { id: 1, code: "SYSTEM" };
  return { code: org };
};

const resolveOrganizationIdentifier = async ({ baseUrl, headers, org }) => {
  if (String(org).toUpperCase() === "SYSTEM") return organizationIdentifier(org);
  const response = await requestJson(`${baseUrl}/api/organization/list.json`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      filters: [{ property: "code", operator: "=", value: org }],
      mappings: [{ name: "id" }, { name: "code" }, { name: "name" }],
      offset: 0,
      pageSize: 10,
    }),
  });
  const entity = (response?.result || []).find((item) => item.code === org);
  if (!entity?.id) throw new Error(`Organization ${org} was not found.`);
  return { id: entity.id, code: entity.code };
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

const entityId = (value) => {
  if (value && typeof value === "object") return value.id;
  return value;
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

const UUID_RE = /^[0-9a-f-]{36}$/i;
const stableValue = (value) => JSON.stringify(value ?? null);
const isRecord = (value) => Boolean(value && typeof value === "object" && !Array.isArray(value));
const isEmptySeedValue = (value) => {
  if (value === "" || value == null) return true;
  if (!isRecord(value)) return false;
  const entries = Object.values(value);
  return !entries.length || entries.every((entry) => entry === "" || entry == null);
};

const buildTemplateValueIndex = (templateRefs) => {
  const defaultsByBucket = new Map();
  const ownerByCode = new Map();
  for (const ref of templateRefs) {
    if (ref.pageValues === false) continue;
    const defaults = new Map();
    for (const param of ref.template?.parameters || []) {
      defaults.set(param.code, param.value);
      ownerByCode.set(param.code, { bucketId: ref.id, code: param.code });
    }
    defaultsByBucket.set(ref.id, defaults);
  }
  return { defaultsByBucket, ownerByCode };
};

const canonicalizePageValues = ({ existingValues = {}, payloadValues = {}, templateRefs = [] }) => {
  const { defaultsByBucket, ownerByCode } = buildTemplateValueIndex(templateRefs);
  const values = {};
  const stats = {
    kept: 0,
    droppedDefaults: 0,
    droppedFlat: 0,
    droppedUnknownFlat: 0,
    droppedEmptySeed: 0,
    migratedUuid: 0,
  };

  const put = (bucketId, code, value) => {
    const defaults = defaultsByBucket.get(bucketId);
    const defaultValue = defaults?.get(code);
    if (defaults?.has(code) && stableValue(value) === stableValue(defaultValue)) {
      if (values[bucketId]) {
        delete values[bucketId][code];
      }
      stats.droppedDefaults += 1;
      return;
    }
    if (!values[bucketId]) values[bucketId] = {};
    values[bucketId][code] = value;
    stats.kept += 1;
  };

  const absorb = (sourceValues, { dropEmptySeed = false } = {}) => {
    for (const [key, value] of Object.entries(sourceValues || {})) {
      if (UUID_RE.test(key)) {
        if (!isRecord(value)) continue;
        if (defaultsByBucket.has(key)) {
          for (const [code, fieldValue] of Object.entries(value)) {
            if (dropEmptySeed && isEmptySeedValue(fieldValue)) {
              stats.droppedEmptySeed += 1;
              continue;
            }
            put(key, code, fieldValue);
          }
          continue;
        }
        for (const [code, fieldValue] of Object.entries(value)) {
          const owner = ownerByCode.get(code);
          if (!owner) {
            stats.droppedUnknownFlat += 1;
            continue;
          }
          if (dropEmptySeed && isEmptySeedValue(fieldValue)) {
            stats.droppedEmptySeed += 1;
            continue;
          }
          stats.migratedUuid += 1;
          put(owner.bucketId, owner.code, fieldValue);
        }
        continue;
      }

      stats.droppedFlat += 1;
    }
  };

  absorb(payloadValues, { dropEmptySeed: true });
  absorb(existingValues);

  for (const [bucketId, bucketValues] of Object.entries(values)) {
    if (!Object.keys(bucketValues).length) delete values[bucketId];
  }

  return { values, stats };
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

const listPageById = async ({ cmsBaseUrl, headers, pageId }) => {
  const id = Number(pageId);
  if (!Number.isInteger(id) || id <= 0) throw new Error(`Invalid --page-id: ${pageId}`);
  const response = await requestJson(`${cmsBaseUrl}/api/page-context/list.json`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      filters: [{ property: "id", operator: "=", value: id }],
      mappings: pageMappings,
      offset: 0,
      pageSize: 1,
    }),
  });
  return response?.result?.[0] || null;
};

const resolvePageContextTarget = async ({ cmsBaseUrl, headers, payload, pageId }) => {
  if (pageId) {
    const existing = await listPageById({ cmsBaseUrl, headers, pageId });
    if (!existing?.id) throw new Error(`PageContext ${pageId} was not found.`);
    return existing;
  }
  return payload.pageContext?.url
    ? await listPageByUrl({ cmsBaseUrl, headers, url: payload.pageContext.url })
    : null;
};

const normalizeTemplateForSave = (template, existing, refs = {}) => {
  const entity = {
    ...template,
    id: existing?.id,
    optimistic: existing?.optimistic,
    organization: existing?.organization?.id
      ? { id: existing.organization.id, code: existing.organization.code }
      : organizationIdentifier(refs.org),
    advanced: template.advanced ?? existing?.advanced ?? false,
    parent: refs.parentId ? { id: refs.parentId, code: template.parent?.code } : null,
  };

  if (!entity.parent) delete entity.parent;
  if (Array.isArray(refs.children)) {
    entity.children = refs.children.map((child) => ({
      id: child.id,
      code: child.code,
      nls: child.nls,
    }));
  } else {
    delete entity.children;
  }
  delete entity.slotMarker;
  if (Array.isArray(entity.parameters)) {
    entity.parameters = entity.parameters.map((parameter) => {
      const { options: _options, ...rest } = parameter;
      return rest;
    });
  }
  if (entity.optimistic === undefined) delete entity.optimistic;
  return entity;
};

const saveBlockTemplate = async ({ cmsBaseUrl, headers, template, existing, parentId, org, children }) => {
  const entity = normalizeTemplateForSave(template, existing, { parentId, org, children });
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
  const canonical = canonicalizePageValues({
    existingValues: existing?.values || {},
    payloadValues: page.values || {},
    templateRefs,
  });
  const entity = {
    id: existing?.id,
    optimistic: existing?.optimistic,
    url: existing?.url || page.url,
    nls: page.nls,
    template: { id: rootId, code: payload.root.code },
    enabledTemplates,
    values: canonical.values,
    organization: existing?.organization?.id ? { id: existing.organization.id, code: existing.organization.code } : organizationIdentifier(org),
    excludeFromSeo: page.excludeFromSeo ?? false,
  };
  if (!entity.id) delete entity.id;
  if (entity.optimistic === undefined) delete entity.optimistic;
  if (!entity.nls) delete entity.nls;

  console.log(
    `  page-values: kept ${canonical.stats.kept}, dropped default duplicates ${canonical.stats.droppedDefaults}, dropped flat ${canonical.stats.droppedFlat}, migrated uuid ${canonical.stats.migratedUuid}, dropped unknown ${canonical.stats.droppedUnknownFlat}`,
  );

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

const includeComments = (childRefs = []) =>
  childRefs
    .map((child) => `@* include id="${child.id}" code="${child.code}" suffix="" *@`)
    .join("\n");

const htmlWithIncludes = (template, childRefs) => {
  const includes = includeComments(childRefs);
  let html = String(template.html || "");
  if (!includes) return html;
  if (html.includes("@* include id=")) return html;
  const markerRe = /<!--\s*cms-child-slot:[A-Z0-9_]+\s*-->/;
  if (markerRe.test(html)) return html.replace(markerRe, includes);
  return `${includes}\n${html}`;
};

const flattenRefs = (refs = []) => refs.flatMap((ref) => [ref, ...flattenRefs(ref.children || [])]);

const unique = (values) => [...new Set(values.filter(Boolean))];

const buildPreviewUrl = ({ cmsBaseUrl, pageContextId = 0, templateId, enabledTemplateIds = [], locale }) => {
  const url = new URL(`${cmsBaseUrl}/page-context/${pageContextId}/preview.html`);
  url.searchParams.set("templateId", String(templateId));
  for (const id of unique(enabledTemplateIds).map((value) => String(value))) {
    url.searchParams.append("enabledTemplates", id);
  }
  if (locale) url.searchParams.set("locale", String(locale));
  return url.toString();
};

const listById = async ({ cmsBaseUrl, headers, entity, id, mappings }) => {
  const response = await requestJson(`${cmsBaseUrl}/api/${entity}/list.json`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      filters: [{ property: "id", operator: "=", value: id }],
      mappings,
      offset: 0,
      pageSize: 1,
    }),
  });
  return response?.result?.[0] || null;
};

const listTemplatesByIds = async ({ cmsBaseUrl, headers, ids }) => {
  const templates = [];
  for (const id of unique(ids.map((value) => String(entityId(value) || "")))) {
    const template = await listById({
      cmsBaseUrl,
      headers,
      entity: "block-template",
      id,
      mappings: blockMappings,
    });
    if (template) templates.push(template);
  }
  return templates;
};

const valuesFieldCount = (values = {}) =>
  Object.values(values || {}).reduce((sum, bucket) => sum + Object.keys(bucket || {}).length, 0);

const enabledTemplateIds = (page) => (page?.enabledTemplates || []).map((template) => String(entityId(template))).filter(Boolean);

const templateRef = ({ id, code, nls, template, children = [] }) => ({ id, code, nls, template, children });

const makeExistingFamilyPlan = ({ page, existingTemplates, payload }) => {
  const rootId = String(entityId(page.template));
  const existingById = new Map(existingTemplates.map((template) => [String(template.id), template]));
  const existingRoot = existingById.get(rootId);
  if (!existingRoot) throw new Error(`PageContext ${page.id} root template ${rootId} was not found.`);

  const existingByCode = new Map(existingTemplates.map((template) => [template.code, template]));
  const localChildren = flattenTemplates(payload.children || []);
  const localByCode = new Map([[payload.root.code, payload.root], ...localChildren.map((template) => [template.code, template])]);
  const localChildCodes = new Set(localChildren.map((template) => template.code));
  const created = localChildren.filter((template) => !existingByCode.has(template.code));
  const updated = localChildren.filter((template) => existingByCode.has(template.code));
  const orphaned = existingTemplates
    .filter((template) => String(template.id) !== rootId && !localChildCodes.has(template.code))
    .sort((a, b) => String(a.code).localeCompare(String(b.code)));
  const rootCodeMatches = payload.root.code === existingRoot.code;
  const missingEnabled = existingTemplates
    .filter((template) => String(template.id) !== rootId && !enabledTemplateIds(page).includes(String(template.id)))
    .map((template) => template.code);

  return {
    page,
    rootId,
    existingRoot,
    existingTemplates,
    existingByCode,
    localByCode,
    rootCodeMatches,
    updated,
    created,
    orphaned,
    missingEnabled,
    summary: {
      pageId: page.id,
      pageUrl: page.url,
      rootId,
      existingRootCode: existingRoot.code,
      localRootCode: payload.root.code,
      existingTemplateCount: existingTemplates.length,
      localTemplateCount: localChildren.length + 1,
      updateExistingCount: updated.length + 1,
      createCount: created.length,
      orphanedCount: orphaned.length,
      pageValueBuckets: Object.keys(page.values || {}).length,
      pageValueFields: valuesFieldCount(page.values),
    },
  };
};

const printUpdateExistingPlan = (plan, { live, prune }) => {
  console.log(`\n=== upload-cms-family · ${live ? "UPDATE EXISTING" : "UPDATE EXISTING DRY RUN"} ===\n`);
  console.log("PageContext:");
  console.log(`  id:             ${plan.summary.pageId}`);
  console.log(`  url:            ${plan.summary.pageUrl}`);
  console.log(`  root id:        ${plan.summary.rootId}`);
  console.log(`  root code:      ${plan.summary.existingRootCode}`);
  console.log(`  local root:     ${plan.summary.localRootCode}`);
  console.log(`  root code ok:   ${plan.rootCodeMatches ? "yes" : "NO"}`);
  console.log(`  value buckets:  ${plan.summary.pageValueBuckets}`);
  console.log(`  value fields:   ${plan.summary.pageValueFields}`);

  console.log("\nTemplate plan:");
  console.log(`  update in place: ${plan.summary.updateExistingCount} templates (root included)`);
  console.log(`  create new:      ${plan.summary.createCount} templates`);
  console.log(`  orphaned in CMS: ${plan.summary.orphanedCount} templates (${prune ? "will disable" : "kept"})`);
  if (plan.missingEnabled.length) console.log(`  enabled missing: ${plan.missingEnabled.join(", ")}`);

  if (plan.updated.length) {
    console.log("\nExisting children to update:");
    for (const template of plan.updated) {
      const existing = plan.existingByCode.get(template.code);
      console.log(`  - ${template.code} -> ${existing.id}`);
    }
  }
  if (plan.created.length) {
    console.log("\nNew children to create:");
    for (const template of plan.created) console.log(`  - ${template.code}`);
  }
  if (plan.orphaned.length) {
    console.log("\nCMS children not present locally:");
    for (const template of plan.orphaned) console.log(`  - ${template.code} -> ${template.id}`);
  }

  if (!live) console.log("\nNo network writes were made. Pass --live to apply this update.\n");
};

const buildUpdateExistingContext = async (env, payload, options = {}) => {
  if (!options.pageId) throw new Error("--strategy update-existing requires --page-id.");
  const token = await getAccessToken(env);
  const templateHeaders = cmsHeaders(token, env.org);
  const pageOrg = env.pageOrg || env.org;
  const pageHeaders = cmsHeaders(token, pageOrg);
  const page = await listPageById({ cmsBaseUrl: env.cmsBaseUrl, headers: pageHeaders, pageId: options.pageId });
  if (!page?.id) throw new Error(`PageContext ${options.pageId} was not found.`);
  if (!entityId(page.template)) throw new Error(`PageContext ${options.pageId} has no root template.`);
  const pageSaveHeaders = cmsHeaders(token, page.organization?.code || pageOrg);

  const templateIds = unique([String(entityId(page.template)), ...enabledTemplateIds(page)]);
  const existingTemplates = await listTemplatesByIds({
    cmsBaseUrl: env.cmsBaseUrl,
    headers: templateHeaders,
    ids: templateIds,
  });
  if (existingTemplates.length !== templateIds.length) {
    const found = new Set(existingTemplates.map((template) => String(template.id)));
    const missing = templateIds.filter((id) => !found.has(id));
    throw new Error(`PageContext ${options.pageId} references templates not found in ${env.org}: ${missing.join(", ")}`);
  }

  return {
    token,
    templateHeaders,
    pageHeaders: pageSaveHeaders,
    pageOrgRef: page.organization?.id
      ? { id: page.organization.id, code: page.organization.code }
      : organizationIdentifier(pageOrg),
    plan: makeExistingFamilyPlan({ page, existingTemplates, payload }),
  };
};

const saveTemplateTree = async ({ cmsBaseUrl, headers, template, parentId, org, mode }) => {
  const existing = mode === "upsert"
    ? await listByCode({
        cmsBaseUrl,
        headers,
        entity: "block-template",
        code: template.code,
        mappings: blockMappings,
      })
    : null;

  let templateId = existing?.id;
  templateId = await saveBlockTemplate({
    cmsBaseUrl,
    headers,
    template: { ...template, children: [] },
    existing,
    parentId,
    org,
  });

  const childRefs = [];
  for (const child of template.children || []) {
    const childRef = await saveTemplateTree({
      cmsBaseUrl,
      headers,
      template: child,
      parentId: null,
      org,
      mode,
    });
    childRefs.push(childRef);
  }

  if (childRefs.length) {
    const latest = mode === "upsert"
      ? await listByCode({
          cmsBaseUrl,
          headers,
          entity: "block-template",
          code: template.code,
          mappings: blockMappings,
        })
      : { id: templateId };
    await saveBlockTemplate({
      cmsBaseUrl,
      headers,
      template: {
        ...template,
        html: htmlWithIncludes(template, childRefs),
        children: [],
      },
      existing: latest,
      parentId,
      org,
    });
  }

  for (let index = childRefs.length - 1; index >= 0; index -= 1) {
    await reparent({
      cmsBaseUrl,
      headers,
      id: childRefs[index].id,
      parentId: templateId,
    });
  }

  return { id: templateId, code: template.code, nls: template.nls, template, children: childRefs };
};

const saveUpdateExistingNode = async ({ cmsBaseUrl, headers, template, plan, org }) => {
  const existing = plan.existingByCode.get(template.code) || null;
  const initialParentId = existing?.parent?.id ? String(existing.parent.id) : null;
  const templateId = await saveBlockTemplate({
    cmsBaseUrl,
    headers,
    template: { ...template, children: [] },
    existing,
    parentId: initialParentId,
    org,
  });

  const childRefs = [];
  for (const child of template.children || []) {
    const childRef = await saveUpdateExistingNode({
      cmsBaseUrl,
      headers,
      template: child,
      plan,
      org,
    });
    childRefs.push(childRef);
  }

  if (childRefs.length) {
    const latest = await listById({
      cmsBaseUrl,
      headers,
      entity: "block-template",
      id: templateId,
      mappings: blockMappings,
    });
    await saveBlockTemplate({
      cmsBaseUrl,
      headers,
      template: {
        ...template,
        html: htmlWithIncludes(template, childRefs),
        children: [],
      },
      existing: latest,
      parentId: latest?.parent?.id ? String(latest.parent.id) : initialParentId,
      org,
    });
  }

  for (let index = childRefs.length - 1; index >= 0; index -= 1) {
    await reparent({
      cmsBaseUrl,
      headers,
      id: childRefs[index].id,
      parentId: templateId,
    });
  }

  return templateRef({
    id: String(templateId),
    code: template.code,
    nls: template.nls,
    template,
    children: childRefs,
  });
};

const saveExistingPageTemplateList = async ({ cmsBaseUrl, headers, page, rootId, templateRefs, pageOrgRef, prune }) => {
  const currentEnabled = enabledTemplateIds(page);
  const nextEnabled = prune
    ? templateRefs.slice(1).map((template) => template.id)
    : unique([...currentEnabled, ...templateRefs.slice(1).map((template) => template.id)]);
  const changed = currentEnabled.length !== nextEnabled.length || currentEnabled.some((id, index) => id !== nextEnabled[index]);
  if (!changed) return { saved: false, id: page.id, enabledCount: currentEnabled.length };

  const entity = {
    id: page.id,
    optimistic: page.optimistic,
    url: page.url,
    nls: page.nls,
    template: { id: rootId, code: page.template?.code },
    enabledTemplates: nextEnabled,
    values: page.values || {},
    organization: pageOrgRef,
    excludeFromSeo: page.excludeFromSeo ?? false,
  };
  if (!entity.nls) delete entity.nls;

  const text = await requestText(`${cmsBaseUrl}/api/page-context/save.json`, {
    method: "POST",
    headers,
    body: JSON.stringify({ entities: [entity], mappings: pageMappings }),
  });
  await pause();
  try {
    const parsed = JSON.parse(text);
    return { saved: true, id: Array.isArray(parsed) ? parsed[0] : parsed, enabledCount: nextEnabled.length };
  } catch {
    return { saved: true, id: Number(text), enabledCount: nextEnabled.length };
  }
};

const ensureCodeAvailable = async ({ cmsBaseUrl, headers, code }) => {
  const existing = await listByCode({
    cmsBaseUrl,
    headers,
    entity: "block-template",
    code,
    mappings: blockMappings,
  });
  if (existing?.id) throw new Error(`Revision code already exists: ${code} (${existing.id}). Use a new --revision-suffix.`);
};

const verifyPageContext = async ({ cmsBaseUrl, headers, pageId, templateRefs }) => {
  const id = entityId(pageId);
  if (!id) return null;
  const response = await requestJson(`${cmsBaseUrl}/api/page-context/list.json`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      filters: [{ property: "id", operator: "=", value: id }],
      mappings: pageMappings,
      offset: 0,
      pageSize: 1,
    }),
  });
  const page = response?.result?.[0];
  if (!page) throw new Error(`PageContext ${id} was not found after save.`);

  const allowed = new Set(templateRefs.map((template) => template.id));
  const enabled = new Set((page.enabledTemplates || []).map((template) => String(template.id || template)));
  const buckets = Object.keys(page.values || {});
  const unknownBuckets = buckets.filter((bucket) => !allowed.has(bucket));
  const rootId = String(templateRefs[0]?.id || "");
  const pageTemplateId = String(entityId(page.template) || "");
  const missingRoot = rootId && pageTemplateId !== rootId ? [templateRefs[0]?.code].filter(Boolean) : [];
  const missingEnabled = templateRefs
    .slice(1)
    .filter((template) => !enabled.has(template.id))
    .map((template) => template.code);
  if (unknownBuckets.length) throw new Error(`PageContext has values for old/unknown buckets: ${unknownBuckets.join(", ")}`);
  if (missingRoot.length) throw new Error(`PageContext root template mismatch: ${missingRoot.join(", ")}`);
  if (missingEnabled.length) throw new Error(`PageContext enabledTemplates missing: ${missingEnabled.join(", ")}`);

  return {
    pageId: page.id,
    enabledCount: enabled.size,
    bucketCount: buckets.length,
    fieldCount: buckets.reduce((sum, bucket) => sum + Object.keys(page.values?.[bucket] || {}).length, 0),
  };
};

const printDryRun = ({ baseUrl, cmsBaseUrl, apiKey, bearer, org, pageOrg }, payload, options = {}) => {
  const summary = summarizePayload(payload);
  console.log("\n=== upload-cms-family · DRY RUN ===\n");
  console.log("Payload summary:");
  for (const [key, value] of Object.entries(summary)) console.log(`  ${key.padEnd(18)} ${value}`);
  if (payload.revision) {
    console.log(`  ${"revisionSuffix".padEnd(18)} ${payload.revision.suffix}`);
    console.log(`  ${"previousRootCode".padEnd(18)} ${payload.revision.previousRootCode}`);
  }

  console.log("\nTarget:");
  console.log(`  CMS base: ${cmsBaseUrl}`);
  console.log(`  Org:      ${org}`);
  console.log(`  Page org: ${pageOrg || org}`);

  console.log("\nAuth:");
  console.log(`  baseUrl: ${baseUrl}`);
  console.log(`  apiKey:  ${apiKey ? maskSecret(apiKey) : "(none)"}`);
  console.log(`  bearer:  ${bearer ? maskSecret(bearer) : "(none)"}`);

  console.log("\nLive sequence:");
  console.log(`  1. Resolve bearer token`);
  const pageTarget = options.pageId ? `id=${options.pageId}` : summary.pageUrl;
  if (payload.revision) {
    console.log(`  2. Create new root BlockTemplate ${summary.rootCode}`);
    console.log(`  3. Create ${summary.totalTemplates - 1} child BlockTemplate records (${summary.childCount} direct, nested children included)`);
    console.log(`  4. Save include lists using the new child ids`);
    console.log(`  5. Reparent direct and nested children in payload order`);
    if (options.templatesOnly) {
      console.log(`  6. Skip PageContext save/switch (--templates-only)`);
      console.log(`  7. Print template preview URL`);
    } else {
      console.log(`  6. Switch PageContext ${pageTarget} to the new family`);
      console.log(`  7. Verify PageContext enabledTemplates and value buckets`);
    }
  } else {
    console.log(`  2. Upsert root BlockTemplate ${summary.rootCode}`);
    console.log(`  3. Upsert ${summary.totalTemplates - 1} child BlockTemplate records (${summary.childCount} direct, nested children included)`);
    console.log(`  4. Save include lists for a new root, then reparent direct and nested children in payload order`);
    if (options.templatesOnly) {
      console.log(`  5. Skip PageContext save/switch (--templates-only)`);
      console.log(`  6. Print template preview URL`);
    } else {
      console.log(`  5. Upsert PageContext ${pageTarget}`);
    }
  }
  console.log("\nNo network writes were made. Pass --live to upload.\n");
};

const uploadLive = async (env, payload, options = {}) => {
  const token = await getAccessToken(env);
  const headers = cmsHeaders(token, env.org);
  const orgRef = await resolveOrganizationIdentifier({ baseUrl: env.baseUrl, headers, org: env.org });
  const pageOrg = env.pageOrg || env.org;
  const pageHeaders = pageOrg === env.org ? headers : cmsHeaders(token, pageOrg);
  const pageOrgRef = options.templatesOnly
    ? null
    : await resolveOrganizationIdentifier({ baseUrl: env.baseUrl, headers: pageHeaders, org: pageOrg });
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
      org: orgRef,
    });
    console.log(`  root: ${payload.root.code} -> ${rootId}`);
  }

  const childRefs = [];
  for (const child of payload.children || []) {
    const childRef = await saveTemplateTree({
      cmsBaseUrl: env.cmsBaseUrl,
      headers,
      template: child,
      parentId: existingRoot?.id ? rootId : null,
      org: orgRef,
      mode: "upsert",
    });
    childRefs.push(childRef);
    console.log(`  child: ${child.code} -> ${childRef.id} (${flattenRefs(childRef.children).length} nested)`);
  }

  if (!existingRoot?.id && childRefs.length) {
    const rootAfterCreate = await listByCode({
      cmsBaseUrl: env.cmsBaseUrl,
      headers,
      entity: "block-template",
      code: payload.root.code,
      mappings: blockMappings,
    });
    await saveBlockTemplate({
      cmsBaseUrl: env.cmsBaseUrl,
      headers,
      template: {
        ...payload.root,
        html: htmlWithIncludes(payload.root, childRefs),
        children: [],
      },
      existing: rootAfterCreate,
      org: orgRef,
    });
    console.log(`  root includes: ${childRefs.length} direct children`);
  }

  for (let index = childRefs.length - 1; index >= 0; index -= 1) {
    await reparent({
      cmsBaseUrl: env.cmsBaseUrl,
      headers,
      id: childRefs[index].id,
      parentId: rootId,
    });
  }

  let pageId = null;
  if (options.templatesOnly) {
    console.log(`  page-context: skipped (--templates-only)`);
  } else {
    const existingPage = await resolvePageContextTarget({
      cmsBaseUrl: env.cmsBaseUrl,
      headers: pageHeaders,
      payload,
      pageId: options.pageId,
    });
    pageId = await savePageContext({
      cmsBaseUrl: env.cmsBaseUrl,
      headers: pageHeaders,
      payload,
      rootId,
      templateRefs: [{ id: rootId, code: payload.root.code, template: payload.root }, ...flattenRefs(childRefs)],
      org: pageOrgRef,
      existing: existingPage,
    });
    console.log(`  page-context: ${options.pageId ? `id=${options.pageId}` : payload.pageContext?.url || "(none)"} -> ${pageId ?? "(skipped)"}`);
  }

  const enabledTemplateIds = [rootId, ...flattenRefs(childRefs).map((child) => child.id)];
  const previewUrl = buildPreviewUrl({
    cmsBaseUrl: env.cmsBaseUrl,
    templateId: rootId,
    enabledTemplateIds,
    locale: options.locale,
  });
  console.log(`Upload complete. Preview: ${previewUrl}`);
  return { rootId, childCount: flattenRefs(childRefs).length, pageId };
};

const uploadRevision = async (env, payload, options = {}) => {
  const token = await getAccessToken(env);
  const headers = cmsHeaders(token, env.org);
  const orgRef = await resolveOrganizationIdentifier({ baseUrl: env.baseUrl, headers, org: env.org });
  const pageOrg = env.pageOrg || env.org;
  const pageHeaders = pageOrg === env.org ? headers : cmsHeaders(token, pageOrg);
  const pageOrgRef = options.templatesOnly
    ? null
    : await resolveOrganizationIdentifier({ baseUrl: env.baseUrl, headers: pageHeaders, org: pageOrg });
  const summary = summarizePayload(payload);

  if (!payload.revision) throw new Error("Revision upload requires a payload transformed with a revision suffix.");

  console.log(`Uploading CMS family revision ${summary.rootCode} to ${env.cmsBaseUrl} (${env.org})`);
  console.log(`  previous root code: ${payload.revision.previousRootCode}`);
  console.log(`  revision suffix:    ${payload.revision.suffix}`);

  await ensureCodeAvailable({ cmsBaseUrl: env.cmsBaseUrl, headers, code: payload.root.code });
  for (const child of flattenTemplates(payload.children || [])) {
    await ensureCodeAvailable({ cmsBaseUrl: env.cmsBaseUrl, headers, code: child.code });
  }

  const rootId = await saveBlockTemplate({
    cmsBaseUrl: env.cmsBaseUrl,
    headers,
    template: { ...payload.root, children: [] },
    org: orgRef,
  });
  console.log(`  root: ${payload.root.code} -> ${rootId}`);

  const childRefs = [];
  for (const child of payload.children || []) {
    const childRef = await saveTemplateTree({
      cmsBaseUrl: env.cmsBaseUrl,
      headers,
      template: child,
      parentId: null,
      org: orgRef,
      mode: "revision",
    });
    childRefs.push(childRef);
    console.log(`  child: ${child.code} -> ${childRef.id} (${flattenRefs(childRef.children).length} nested)`);
  }

  const templateRefs = [{ id: rootId, code: payload.root.code, template: payload.root }, ...flattenRefs(childRefs)];
  const rootAfterCreate = await listByCode({
    cmsBaseUrl: env.cmsBaseUrl,
    headers,
    entity: "block-template",
    code: payload.root.code,
    mappings: blockMappings,
  });
  await saveBlockTemplate({
    cmsBaseUrl: env.cmsBaseUrl,
    headers,
    template: {
      ...payload.root,
      html: htmlWithIncludes(payload.root, childRefs),
      children: [],
    },
    existing: rootAfterCreate,
    org: orgRef,
  });
  console.log(`  root includes: ${childRefs.length} direct children`);

  for (let index = childRefs.length - 1; index >= 0; index -= 1) {
    await reparent({
      cmsBaseUrl: env.cmsBaseUrl,
      headers,
      id: childRefs[index].id,
      parentId: rootId,
    });
  }
  console.log(`  root children: ${childRefs.length} direct children reparented`);

  let pageId = null;
  if (options.templatesOnly) {
    console.log(`  page-context: skipped (--templates-only)`);
  } else {
    const existingPage = await resolvePageContextTarget({
      cmsBaseUrl: env.cmsBaseUrl,
      headers: pageHeaders,
      payload,
      pageId: options.pageId,
    });
    if (!existingPage?.id && payload.pageContext?.url) {
      throw new Error(`Revision deploy requires an existing PageContext for ${payload.pageContext.url}.`);
    }

    pageId = await savePageContext({
      cmsBaseUrl: env.cmsBaseUrl,
      headers: pageHeaders,
      payload,
      rootId,
      templateRefs,
      org: pageOrgRef,
      existing: existingPage,
    });

    const verified = await verifyPageContext({
      cmsBaseUrl: env.cmsBaseUrl,
      headers: pageHeaders,
      pageId,
      templateRefs,
    });
    if (verified) {
      console.log(
        `  page-context verified: enabled ${verified.enabledCount}, buckets ${verified.bucketCount}, fields ${verified.fieldCount}`,
      );
    }
  }

  const enabledTemplateIds = [rootId, ...flattenRefs(childRefs).map((child) => child.id)];
  const previewUrl = buildPreviewUrl({
    cmsBaseUrl: env.cmsBaseUrl,
    templateId: rootId,
    enabledTemplateIds,
    locale: options.locale,
  });
  console.log(`Upload complete. Preview: ${previewUrl}`);
  return { rootId, childCount: flattenRefs(childRefs).length, pageId };
};

const uploadUpdateExisting = async (env, payload, options = {}) => {
  const context = await buildUpdateExistingContext(env, payload, options);
  const { templateHeaders, pageHeaders, pageOrgRef, plan } = context;
  const orgRef = await resolveOrganizationIdentifier({ baseUrl: env.baseUrl, headers: templateHeaders, org: env.org });

  printUpdateExistingPlan(plan, { live: true, prune: Boolean(options.prune) });
  if (!plan.rootCodeMatches) {
    throw new Error(
      `Local root code ${payload.root.code} does not match PageContext root ${plan.existingRoot.code}. ` +
        "Pass the matching --root-code before using --live.",
    );
  }

  const childRefs = [];
  for (const child of payload.children || []) {
    const childRef = await saveUpdateExistingNode({
      cmsBaseUrl: env.cmsBaseUrl,
      headers: templateHeaders,
      template: child,
      plan,
      org: orgRef,
    });
    childRefs.push(childRef);
    const action = plan.existingByCode.has(child.code) ? "updated" : "created";
    console.log(`  child ${action}: ${child.code} -> ${childRef.id} (${flattenRefs(childRef.children).length} nested)`);
  }

  const latestRoot = await listById({
    cmsBaseUrl: env.cmsBaseUrl,
    headers: templateHeaders,
    entity: "block-template",
    id: plan.rootId,
    mappings: blockMappings,
  });
  await saveBlockTemplate({
    cmsBaseUrl: env.cmsBaseUrl,
    headers: templateHeaders,
    template: {
      ...payload.root,
      code: plan.existingRoot.code,
      html: htmlWithIncludes({ ...payload.root, code: plan.existingRoot.code }, childRefs),
      children: [],
    },
    existing: latestRoot,
    org: orgRef,
  });
  console.log(`  root updated: ${plan.existingRoot.code} -> ${plan.rootId}`);

  for (let index = childRefs.length - 1; index >= 0; index -= 1) {
    await reparent({
      cmsBaseUrl: env.cmsBaseUrl,
      headers: templateHeaders,
      id: childRefs[index].id,
      parentId: plan.rootId,
    });
  }
  console.log(`  root children reparented: ${childRefs.length}`);

  const templateRefs = [templateRef({ id: plan.rootId, code: plan.existingRoot.code, template: payload.root }), ...flattenRefs(childRefs)];
  if (options.templatesOnly) {
    console.log("  page-context: enabledTemplates update skipped (--templates-only)");
  } else {
    const pageResult = await saveExistingPageTemplateList({
      cmsBaseUrl: env.cmsBaseUrl,
      headers: pageHeaders,
      page: plan.page,
      rootId: plan.rootId,
      templateRefs,
      pageOrgRef,
      prune: Boolean(options.prune),
    });
    console.log(
      `  page-context: ${pageResult.saved ? "saved" : "unchanged"} id=${pageResult.id}, enabled ${pageResult.enabledCount}`,
    );
  }

  const previewUrl = buildPreviewUrl({
    cmsBaseUrl: env.cmsBaseUrl,
    pageContextId: plan.page.id,
    templateId: plan.rootId,
    enabledTemplateIds: [plan.rootId, ...templateRefs.slice(1).map((template) => template.id)],
    locale: options.locale,
  });
  console.log(`Update complete. Preview: ${previewUrl}`);
  return { rootId: plan.rootId, childCount: templateRefs.length - 1, pageId: plan.page.id };
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
  const pageOrg = args.pageOrg || envFirst("SERVICEWAND_PAGE_ORG", "LANDING_PAGE_ORG") || org;
  const apiKey = envFirst("SERVICEWAND_API_KEY", "LANDING_API_KEY", "DEPLOY_API_KEY");
  const bearer = envFirst("SERVICEWAND_BEARER", "LANDING_BEARER");
  const cmsBaseUrl = serviceUrl(baseUrl, "core-cms");
  if (!["upsert", "revision", "update-existing"].includes(args.strategy)) {
    fail(`Unknown --strategy: ${args.strategy}. Use upsert, revision, or update-existing.`);
  }

  const basePayload = withRootName(withRootCode(readPayload(outAbs), args.rootCode), args.rootName);
  const payload = args.strategy === "revision" ? withTemplateCodeSuffix(basePayload, args.revisionSuffix) : basePayload;
  const env = { baseUrl, cmsBaseUrl, org, pageOrg, apiKey, bearer };
  const uploadOptions = {
    templatesOnly: Boolean(args.templatesOnly),
    pageId: args.pageId,
    locale: args.locale,
    prune: Boolean(args.prune),
  };

  if (args.mode === "dry-run") {
    if (args.strategy === "update-existing") {
      const context = await buildUpdateExistingContext(env, payload, uploadOptions);
      printUpdateExistingPlan(context.plan, { live: false, prune: uploadOptions.prune });
      return;
    }
    printDryRun(env, payload, uploadOptions);
    return;
  }

  if (args.strategy === "update-existing") await uploadUpdateExisting(env, payload, uploadOptions);
  else if (args.strategy === "revision") await uploadRevision(env, payload, uploadOptions);
  else await uploadLive(env, payload, uploadOptions);
};

main().catch((error) => fail(error.stack || error.message || String(error)));
