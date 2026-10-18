/* Add the typed-entity attributes bag to the snow client-review grant profiles.
 *
 * Dry-run is the default. A live update requires the exact id@optimistic
 * acknowledgement printed by the latest plan. Existing grants retain their
 * original mapping snapshots and must be reissued after this change.
 *
 *   node app-templates/customer-portal/scripts/snow-magic-link-mappings.mjs \
 *     --base-url https://dev-1.servicewand.com/core
 *
 *   node app-templates/customer-portal/scripts/snow-magic-link-mappings.mjs \
 *     --base-url https://dev-1.servicewand.com/core --live \
 *     --ack 11@343,102@97,114@49
 */

import process from "node:process";
import { pathToFileURL } from "node:url";

const TARGETS = ["Account", "Order", "Document"];
const DEFINITION_KEY = "DEFAULT";
const REQUIRED_MAPPING = Object.freeze({ name: "attributes", type: "primitive" });

const definitionReadMappings = [
  { name: "id" },
  { name: "definitionKey" },
  { name: "targetEntityType" },
  { name: "readMappings" },
  { name: "writeMappings" },
  { name: "enabled" },
  { name: "optimistic" },
  {
    name: "organization",
    type: "reference",
    mappings: [{ name: "id" }, { name: "code" }, { name: "nls" }],
  },
];

const definitionUpdateMappings = [
  { name: "readMappings" },
  { name: "writeMappings" },
  { name: "enabled" },
  { name: "optimistic" },
];

function firstEnv(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim()) return value.trim();
  }
  return "";
}

export function parseArgs(argv) {
  const options = {
    mode: "dry-run",
    issueOrg: "SNOWLIMITLESS",
    managementOrg: "SYSTEM",
    service: "core-bill",
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--live") options.mode = "live";
    else if (arg === "--dry-run") options.mode = "dry-run";
    else if (arg === "--base-url") options.baseUrl = argv[++index];
    else if (arg === "--issue-org") options.issueOrg = argv[++index];
    else if (arg === "--management-org") options.managementOrg = argv[++index];
    else if (arg === "--service") options.service = argv[++index];
    else if (arg === "--ack") options.ack = argv[++index];
    else if (arg === "--help" || arg === "-h") options.help = true;
    else throw new Error("Unknown argument: " + arg);
  }
  options.baseUrl = (options.baseUrl || firstEnv("SERVICEWAND_BASE_URL", "VITE_API_URL")).replace(/\/+$/, "");
  if (!options.help && !options.baseUrl) throw new Error("Pass --base-url or set SERVICEWAND_BASE_URL/VITE_API_URL");
  if (options.mode === "live" && !options.ack) throw new Error("--live requires the exact --ack value printed by dry-run");
  return options;
}

const usage = () => `Usage:
  node app-templates/customer-portal/scripts/snow-magic-link-mappings.mjs \\
    [--dry-run | --live --ack <id@optimistic,...>] \\
    [--base-url https://dev-1.servicewand.com/core] \\
    [--issue-org SNOWLIMITLESS] [--management-org SYSTEM] [--service core-bill]

Adds only {"name":"attributes","type":"primitive"} to the enabled SYSTEM
DEFAULT profiles for Account, Order and Document. Existing mapping nodes and
write mappings are preserved byte-for-byte as JSON values. The live operation
uses optimistic versions from the acknowledged plan, then verifies the effective
READ mappings in the issue organization.

Existing grants do not expand. Issue a new magic link after a successful update.

Credentials are read from SERVICEWAND_BEARER, SERVICEWAND_API_KEY, or
DEPLOY_API_KEY and are never printed.`;

function simpleTarget(targetEntityType) {
  return String(targetEntityType || "").split(".").pop();
}

function isMapping(value) {
  return value && typeof value === "object" && !Array.isArray(value) && typeof value.name === "string";
}

export function withRequiredMapping(mappings) {
  if (!Array.isArray(mappings) || !mappings.every(isMapping)) {
    throw new Error("A SYSTEM read mapping tree is missing or malformed");
  }
  const present = mappings.find((mapping) => mapping.name === REQUIRED_MAPPING.name);
  if (present) {
    const type = present.type == null ? "primitive" : present.type;
    if (type !== "primitive") throw new Error("attributes exists with incompatible type " + type);
    return mappings;
  }
  return [...mappings, { ...REQUIRED_MAPPING }].sort((left, right) => left.name.localeCompare(right.name));
}

function headers(token, organization) {
  return {
    Accept: "application/json",
    Authorization: "Bearer " + token,
    "Content-Type": "application/json",
    "X-Organization-Code": organization,
  };
}

async function jsonResponse(response, label) {
  if (!response.ok) throw new Error(label + " answered HTTP " + response.status);
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("json")) throw new Error(label + " did not return JSON");
  return response.json();
}

async function accessToken(baseUrl) {
  const bearer = firstEnv("SERVICEWAND_BEARER");
  if (bearer) return bearer;
  const apiKey = firstEnv("SERVICEWAND_API_KEY", "DEPLOY_API_KEY");
  if (!apiKey) throw new Error("Set SERVICEWAND_BEARER, SERVICEWAND_API_KEY, or DEPLOY_API_KEY");

  const resource = await jsonResponse(
    await fetch(baseUrl + "/.well-known/oauth-protected-resource"),
    "OAuth protected-resource metadata",
  );
  const issuer = resource.authorization_servers && resource.authorization_servers[0];
  if (!issuer) throw new Error("OAuth issuer is missing from protected-resource metadata");
  const oidc = await jsonResponse(
    await fetch(String(issuer).replace(/\/+$/, "") + "/.well-known/openid-configuration"),
    "OpenID configuration",
  );
  if (!oidc.token_endpoint) throw new Error("OAuth token endpoint is missing");
  const response = await fetch(oidc.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "X-API-Key": apiKey },
    body: new URLSearchParams({ grant_type: "api_key", scope: "openid" }),
  });
  const payload = await jsonResponse(response, "API-key token exchange");
  if (!payload.access_token) throw new Error("Token response did not include access_token");
  return payload.access_token;
}

async function listDefinitions(serviceBase, token, organization) {
  return jsonResponse(
    await fetch(serviceBase + "/api/entity-mapping-definition/list.json", {
      method: "POST",
      headers: headers(token, organization),
      body: JSON.stringify({ filters: [], mappings: definitionReadMappings, offset: 0, pageSize: 1000 }),
    }),
    "EntityMappingDefinition list",
  ).then((payload) => Array.isArray(payload.result) ? payload.result : []);
}

async function effectiveMappings(serviceBase, token, organization, entityType) {
  const payload = await jsonResponse(
    await fetch(serviceBase + "/api/grant/mappings.json", {
      method: "POST",
      headers: headers(token, organization),
      body: JSON.stringify({ entityType, operations: ["READ"] }),
    }),
    entityType + " grant mapping preparation",
  );
  const read = Array.isArray(payload.sets) && payload.sets.find((set) => set.operation === "READ");
  return {
    definitionId: payload.mappingDefinitionId,
    mappings: read && Array.isArray(read.mappings) ? read.mappings : [],
  };
}

function acknowledgement(definitions) {
  return definitions
    .map((definition) => definition.id + "@" + definition.optimistic)
    .sort((left, right) => Number(left.split("@")[0]) - Number(right.split("@")[0]))
    .join(",");
}

function selectedDefinitions(rows, managementOrg) {
  const selected = TARGETS.map((target) => {
    const matches = rows.filter((row) =>
      row.organization && row.organization.code === managementOrg &&
      row.definitionKey === DEFINITION_KEY && simpleTarget(row.targetEntityType) === target);
    if (matches.length !== 1) throw new Error("Expected one " + managementOrg + " DEFAULT profile for " + target + ", found " + matches.length);
    if (!matches[0].enabled) throw new Error(target + " DEFAULT profile is disabled");
    return matches[0];
  });
  return selected;
}

async function saveDefinitions(serviceBase, token, organization, definitions) {
  const entities = definitions.map((definition) => ({
    id: definition.id,
    readMappings: withRequiredMapping(definition.readMappings),
    writeMappings: definition.writeMappings,
    enabled: definition.enabled,
    optimistic: definition.optimistic,
  }));
  const ids = await jsonResponse(
    await fetch(serviceBase + "/api/entity-mapping-definition/save.json", {
      method: "POST",
      headers: headers(token, organization),
      body: JSON.stringify({ entities, mappings: definitionUpdateMappings }),
    }),
    "EntityMappingDefinition save",
  );
  if (!Array.isArray(ids) || ids.length !== definitions.length) {
    throw new Error("Expected " + definitions.length + " saved definition ids");
  }
  return ids;
}

export async function run(options) {
  const token = await accessToken(options.baseUrl);
  const serviceBase = new URL("/" + options.service, options.baseUrl).origin + "/" + options.service;
  const rows = await listDefinitions(serviceBase, token, options.managementOrg);
  const issueRows = options.issueOrg === options.managementOrg
    ? rows
    : await listDefinitions(serviceBase, token, options.issueOrg);
  const definitions = selectedDefinitions(rows, options.managementOrg);
  const ack = acknowledgement(definitions);
  const overrides = [...rows, ...issueRows].filter((row, index, all) =>
    row.organization && row.organization.code !== options.managementOrg &&
    row.definitionKey === DEFINITION_KEY && TARGETS.includes(simpleTarget(row.targetEntityType)) &&
    all.findIndex((candidate) => candidate.id === row.id) === index);

  const plan = [];
  for (const definition of definitions) {
    const target = simpleTarget(definition.targetEntityType);
    const effective = await effectiveMappings(serviceBase, token, options.issueOrg, target);
    plan.push({
      entityType: target,
      id: definition.id,
      optimistic: definition.optimistic,
      systemHasAttributes: definition.readMappings.some((mapping) => mapping.name === REQUIRED_MAPPING.name),
      effectiveHasAttributes: effective.mappings.some((mapping) => mapping.name === REQUIRED_MAPPING.name),
      effectiveDefinitionId: effective.definitionId,
    });
  }

  console.log(JSON.stringify({ mode: options.mode, issueOrg: options.issueOrg, plan, explicitOverrides: overrides.map((row) => ({ id: row.id, organization: row.organization.code, entityType: simpleTarget(row.targetEntityType) })), acknowledgement: ack }, null, 2));

  if (options.mode !== "live") return { changed: false, acknowledgement: ack, plan };
  if (options.ack !== ack) throw new Error("Server definitions changed. Re-run dry-run and use its exact --ack value");
  const pending = definitions.filter((definition) => !definition.readMappings.some((mapping) => mapping.name === REQUIRED_MAPPING.name));
  if (pending.length === 0) return { changed: false, acknowledgement: ack, plan };

  const ids = await saveDefinitions(serviceBase, token, options.managementOrg, pending);
  for (const target of TARGETS) {
    const effective = await effectiveMappings(serviceBase, token, options.issueOrg, target);
    if (!effective.mappings.some((mapping) => mapping.name === REQUIRED_MAPPING.name)) {
      throw new Error(target + " saved, but attributes is absent from the effective " + options.issueOrg + " profile");
    }
  }
  console.log("Updated definitions: " + ids.join(", "));
  console.log("Issue new magic links; existing grants retain their old mapping snapshots.");
  return { changed: true, ids };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) console.log(usage());
  else {
    const result = await run(options);
    console.log("snow-magic-link-mappings ok: " + (result.changed ? "updated" : "no write"));
  }
}
