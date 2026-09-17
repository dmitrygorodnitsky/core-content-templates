import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const TYPE_GROUPS = [
  { service: "core-acct", endpoint: "account-type" },
  { service: "core-svc", endpoint: "project-type" },
  { service: "core-svc", endpoint: "task-type" },
  { service: "core-svc", endpoint: "appointment-type" },
  { service: "core-rm", endpoint: "resource-type" },
  { service: "core", endpoint: "document-type" },
  { service: "core-bill", endpoint: "order-type" },
  { service: "core-bill", endpoint: "order-item-type" },
  { service: "core-bill", endpoint: "invoice-type" },
];

const IDENTIFIER = (name) => ({ name, type: "identifier", mappings: [{ name: "id" }, { name: "code" }] });

const TYPE_DETAIL_MAPPINGS = [
  { name: "id" },
  { name: "code" },
  { name: "nls" },
  { name: "isAbstract" },
  IDENTIFIER("workflow"),
  IDENTIFIER("organization"),
  IDENTIFIER("parent"),
  { name: "attributes" },
  { name: "attributeGroups" },
  { name: "attributeOrder" },
];

const WORKFLOW_MAPPINGS = [
  { name: "id" },
  { name: "code" },
  { name: "nls" },
  { name: "entityType" },
  IDENTIFIER("organization"),
  IDENTIFIER("initialState"),
  {
    name: "states",
    type: "collection",
    mappings: [
      { name: "id" },
      { name: "code" },
      { name: "nls" },
      { name: "style" },
      {
        name: "events",
        type: "collection",
        mappings: [
          { name: "id" },
          { name: "code" },
          { name: "nls" },
          { name: "orderIndex" },
          { name: "targets", type: "collection", mappings: [{ name: "id" }, { name: "code" }] },
        ],
      },
    ],
  },
];

function option(name, fallback) {
  const prefix = `--${name}=`;
  const match = process.argv.slice(2).find((value) => value.startsWith(prefix));
  return match ? match.slice(prefix.length) : fallback;
}

const baseUrl = option("base-url", process.env.SERVICEWAND_BASE_URL || "https://dev-1.servicewand.com/core").replace(/\/$/, "");
const organization = option("org", process.env.SERVICEWAND_ORG || "SNOWLIMITLESS");
const outDir = path.resolve(option("out", new URL("../content/core-types", import.meta.url).pathname));

function serviceBaseUrl(service) {
  if (service === "core") return baseUrl;
  return baseUrl.replace(/\/core$/, `/${service}`);
}

async function resolveAccessToken() {
  const bearer = process.env.SERVICEWAND_BEARER
    || (process.env.SERVICEWAND_BEARER_FILE && (await fs.readFile(process.env.SERVICEWAND_BEARER_FILE, "utf8")).trim());
  if (bearer) return bearer;

  const apiKey = process.env.SERVICEWAND_API_KEY
    || (process.env.SERVICEWAND_API_KEY_FILE && (await fs.readFile(process.env.SERVICEWAND_API_KEY_FILE, "utf8")).trim());
  if (!apiKey) throw new Error("Set SERVICEWAND_BEARER, SERVICEWAND_BEARER_FILE, SERVICEWAND_API_KEY or SERVICEWAND_API_KEY_FILE");

  const resource = await fetch(`${baseUrl}/.well-known/oauth-protected-resource`).then((r) => r.json());
  const issuer = resource.authorization_servers?.[0];
  if (!issuer) throw new Error("OAuth issuer missing from protected-resource metadata");
  const openid = await fetch(`${issuer}/.well-known/openid-configuration`).then((r) => r.json());
  if (!openid.token_endpoint) throw new Error("token_endpoint missing from OpenID metadata");

  const response = await fetch(openid.token_endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "X-API-Key": apiKey },
    body: new URLSearchParams({ grant_type: "api_key", scope: "openid" }),
  });
  if (!response.ok) throw new Error(`Token request failed with ${response.status}`);
  const token = await response.json();
  if (!token.access_token) throw new Error("Token response carried no access_token");
  return token.access_token;
}

async function readList(accessToken, service, endpoint, body, attempt = 0) {
  const url = `${serviceBaseUrl(service)}/api/${endpoint}/list.json`;
  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Organization-Code": organization,
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    if (attempt >= 3) throw error;
    await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
    return readList(accessToken, service, endpoint, body, attempt + 1);
  }
  const text = await response.text();
  if (!response.ok) return { status: response.status, result: [], resultSize: 0, unavailable: true };
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    /* An object-valued mapping without a nested projection answers with a
       multi-megabyte non-JSON body. Report it instead of storing it. */
    return { status: response.status, result: [], resultSize: 0, unprojectable: text.length };
  }
  return { status: response.status, result: parsed.result ?? [], resultSize: parsed.resultSize ?? 0 };
}

const accessToken = await resolveAccessToken();

const organizations = await readList(accessToken, "core", "organization", {
  mappings: [{ name: "id" }, { name: "code" }],
  offset: 0,
  pageSize: 50,
});

const workflowIndex = await readList(accessToken, "core", "workflow", {
  mappings: [{ name: "id" }, { name: "code" }],
  offset: 0,
  pageSize: 200,
});

const summary = {
  readAt: new Date().toISOString().slice(0, 10),
  baseUrl,
  organization,
  organizations: organizations.result.map((row) => ({ id: row.id, code: row.code })),
  workflows: workflowIndex.result.map((row) => ({ id: row.id, code: row.code })),
  types: [],
};

await fs.mkdir(outDir, { recursive: true });

for (const group of TYPE_GROUPS) {
  const index = await readList(accessToken, group.service, group.endpoint, {
    mappings: [{ name: "id" }, { name: "code" }],
    offset: 0,
    pageSize: 200,
  });
  const entry = {
    service: group.service,
    endpoint: group.endpoint,
    path: `${serviceBaseUrl(group.service)}/api/${group.endpoint}/list.json`,
    status: index.status,
    resultSize: index.resultSize,
    codes: [],
  };
  if (index.unavailable) {
    entry.codes = null;
    summary.types.push(entry);
    continue;
  }

  const detail = await readList(accessToken, group.service, group.endpoint, {
    mappings: TYPE_DETAIL_MAPPINGS,
    offset: 0,
    pageSize: 200,
  });
  const records = detail.result.length ? detail.result : index.result;
  const groupDir = path.join(outDir, group.endpoint);
  await fs.mkdir(groupDir, { recursive: true });

  for (const record of records) {
    entry.codes.push({
      id: record.id ?? null,
      code: record.code,
      workflow: record.workflow?.code ?? null,
      owner: record.organization?.code ?? null,
      attributeCount: Array.isArray(record.attributes) ? record.attributes.length : 0,
    });
    const file = path.join(groupDir, `${record.code}.${record.id ?? "unknown"}.json`);
    await fs.writeFile(file, `${JSON.stringify(record, null, 1)}\n`, "utf8");
  }
  summary.types.push(entry);
}

const workflowDir = path.join(outDir, "workflow");
await fs.mkdir(workflowDir, { recursive: true });
const referenced = new Set(summary.types.flatMap((entry) => (entry.codes ?? []).map((row) => row.workflow)).filter(Boolean));
for (const code of [...referenced].sort()) {
  const workflow = await readList(accessToken, "core", "workflow", {
    filters: [{ operator: "=", property: "code", value: code }],
    mappings: WORKFLOW_MAPPINGS,
    offset: 0,
    pageSize: 10,
  });
  for (const record of workflow.result) {
    await fs.writeFile(path.join(workflowDir, `${record.code}.${record.id}.json`), `${JSON.stringify(record, null, 1)}\n`, "utf8");
  }
}

await fs.writeFile(path.join(outDir, "index.json"), `${JSON.stringify(summary, null, 1)}\n`, "utf8");

console.log(`snow-core-inventory: ${organization} on ${baseUrl}`);
console.log(`  organizations: ${summary.organizations.map((row) => row.code).join(", ")}`);
console.log(`  workflows: ${summary.workflows.length}`);
for (const entry of summary.types) {
  if (entry.codes === null) {
    console.log(`  ${entry.service}/${entry.endpoint}: HTTP ${entry.status}`);
    continue;
  }
  console.log(`  ${entry.service}/${entry.endpoint}: ${entry.codes.length}`);
  for (const row of entry.codes) {
    console.log(`      ${String(row.id).padStart(4)}  ${row.code.padEnd(30)} wf=${row.workflow ?? "-"} owner=${row.owner ?? "-"} attrs=${row.attributeCount}`);
  }
}
console.log(`  written to ${path.relative(process.cwd(), outDir)}`);
