import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const landingRoot = path.resolve(scriptsDir, "..");
const outDir = await fs.mkdtemp(path.join(landingRoot, "dist/.upload-check-"));
const rootId = "11111111-1111-4111-8111-111111111111";
const childId = "22222222-2222-4222-8222-222222222222";
const organizationId = 42;
let missingCode = null;
let saveRequests = 0;
let untypedCodeFilters = 0;
let existingParameters = [];
const savedEntities = [];

await fs.writeFile(path.join(outDir, "cms-family.payload.json"), JSON.stringify({
  schemaVersion: 1,
  root: {
    code: "FIELD_SERVICE_LANDING",
    parameters: [
      { code: "FAVICON_IMG", type: "IMAGE", value: null, nls: { en: { NAME: "Favicon", DESCRIPTION: "Favicon" } } },
      { code: "FAVICON_IMG_NAME", type: "STRING", value: "", nls: { en: { NAME: "Favicon name", DESCRIPTION: "Favicon name" } } },
    ],
    children: [{ code: "MUST_NOT_BE_SAVED" }],
    parent: { code: "MUST_NOT_BE_SAVED" },
    includes: ["MUST_NOT_BE_SAVED"],
    includeTemplates: ["MUST_NOT_BE_SAVED"],
    includedTemplates: ["MUST_NOT_BE_SAVED"],
    enabledTemplates: ["MUST_NOT_BE_SAVED"],
    pageContext: { code: "MUST_NOT_BE_SAVED" },
    pageContexts: [{ code: "MUST_NOT_BE_SAVED" }],
  },
  children: [{
    code: "FIELD_SERVICE_LANDING_HEADER",
    html: "<article>${POST@BLOG_POST_CONTENT_SS}</article>",
    parameters: [],
    parent: { code: "FIELD_SERVICE_LANDING" },
    slotMarker: "MUST_NOT_BE_SAVED",
  }],
}, null, 2));

const readBody = async (request) => {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
};

const send = (response, status, value) => {
  response.writeHead(status, { "content-type": "application/json" });
  response.end(JSON.stringify(value));
};

const server = http.createServer(async (request, response) => {
  const origin = `http://127.0.0.1:${server.address().port}`;
  if (request.url === "/core/.well-known/oauth-protected-resource") {
    return send(response, 200, { authorization_servers: [`${origin}/auth`] });
  }
  if (request.url === "/auth/.well-known/openid-configuration") {
    return send(response, 200, { token_endpoint: `${origin}/auth/token` });
  }
  if (request.url === "/auth/token") return send(response, 200, { access_token: "local-check-token" });
  if (request.url === "/core/api/organization/list.json") {
    const body = JSON.parse(await readBody(request));
    const code = body.filters?.find((filter) => filter.property === "code")?.value;
    return send(response, 200, { result: code === "SYSTEM" ? [{ id: organizationId, code: "SYSTEM", name: "System" }] : [] });
  }
  if (request.url === "/core-cms/api/block-template/list.json") {
    const body = JSON.parse(await readBody(request));
    const codeFilter = body.filters?.find((filter) => filter.property === "code");
    if (codeFilter?.type !== "STRING") untypedCodeFilters += 1;
    const code = codeFilter?.value;
    if (missingCode === "*" || code === missingCode) return send(response, 200, { result: [] });
    const id = code === "FIELD_SERVICE_LANDING" ? rootId : childId;
    return send(response, 200, { result: [{ id, code, parameters: existingParameters }] });
  }
  if (request.url === "/core-cms/api/block-template/save.json") {
    saveRequests += 1;
    const body = JSON.parse(await readBody(request));
    savedEntities.push(...(body.entities || []));
    return send(response, 200, (body.entities || []).map((entity) => entity.id));
  }
  return send(response, 404, { error: "not found" });
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const baseArgs = [
  path.join(scriptsDir, "upload-cms-family.mjs"),
  "--out", outDir,
  "--base-url", `http://127.0.0.1:${server.address().port}/core`,
  "--org", "SYSTEM",
  "--require-existing",
  "--dry-run",
];
const env = { ...process.env, SERVICEWAND_API_KEY: "local-check-key", SERVICEWAND_BEARER: "" };

try {
  const success = await execFileAsync(process.execPath, [...baseArgs, "--expected-root-id", rootId], { env });
  assert.match(success.stdout, new RegExp(`would update: FIELD_SERVICE_LANDING -> ${rootId}`));
  assert.match(success.stdout, new RegExp(`would update: FIELD_SERVICE_LANDING_HEADER -> ${childId}`));
  assert.match(success.stdout, new RegExp(`Organization: SYSTEM -> ${organizationId}`));
  assert.equal(untypedCodeFilters, 0, "code lookups use the STRING filter type expected by core-ui");
  // the resolved dry run names a parameter neither side fills, before any write
  assert.match(success.stdout, /no value in the package or in CMS: FIELD_SERVICE_LANDING\.FAVICON_IMG\b/);

  const createOnlyArgs = baseArgs
    .filter((arg) => arg !== "--require-existing")
    .concat("--require-missing");
  await assert.rejects(
    execFileAsync(process.execPath, createOnlyArgs, { env }),
    /Create-only upload refused because template codes already exist/,
  );
  missingCode = "*";
  const createOnly = await execFileAsync(process.execPath, createOnlyArgs, { env });
  assert.match(createOnly.stdout, /would create: FIELD_SERVICE_LANDING -> \(new\)/);
  assert.match(createOnly.stdout, /would create: FIELD_SERVICE_LANDING_HEADER -> \(new\)/);
  assert.equal(saveRequests, 0, "create-only dry-run must make no save requests");
  missingCode = null;

  await assert.rejects(
    execFileAsync(process.execPath, [...baseArgs, "--expected-root-id", "33333333-3333-4333-8333-333333333333"], { env }),
    /Root id mismatch/,
  );

  missingCode = "FIELD_SERVICE_LANDING_HEADER";
  await assert.rejects(execFileAsync(process.execPath, baseArgs, { env }), /Required existing templates were not found/);
  assert.equal(saveRequests, 0, "resolved dry-run must make no save requests");

  missingCode = null;
  const liveArgs = baseArgs.map((arg) => arg === "--dry-run" ? "--live" : arg);
  await execFileAsync(process.execPath, liveArgs, { env });
  assert.equal(saveRequests, 2, "live check saves exactly the root and child BlockTemplates");
  assert.equal(savedEntities.length, 2);
  const relationshipFields = [
    "children", "parent", "slotMarker", "includes", "includeTemplates",
    "includedTemplates", "enabledTemplates", "pageContext", "pageContexts",
  ];
  for (const entity of savedEntities) {
    for (const field of relationshipFields) {
      assert.equal(Object.hasOwn(entity, field), false, `${field} must never enter a BlockTemplate save request`);
    }
  }
  const savedRoot = savedEntities.find((entity) => entity.code === "FIELD_SERVICE_LANDING");
  assert.equal(Object.hasOwn(savedRoot.parameters.find((parameter) => parameter.code === "FAVICON_IMG"), "value"), false, "null IMAGE values are omitted like core-ui");
  assert.equal(Object.hasOwn(savedRoot.parameters.find((parameter) => parameter.code === "FAVICON_IMG_NAME"), "value"), false, "blank STRING values are omitted like core-ui");
  assert.deepEqual(savedRoot.organization, { id: organizationId }, "save payload uses the organization identifier shape emitted by core-ui");

  saveRequests = 0;
  savedEntities.length = 0;
  existingParameters = [
    { code: "FORM_API_BASE_URL", type: "STRING", value: "https://dev-1.servicewand.com", options: [] },
    { code: "FORM_TYPE_CODE", type: "STRING", value: "GET_QUOTE_" },
    { code: "FORM_THEME", type: "STRING", value: "hvac" },
    { code: "NOTE", type: "LOCALIZED_STRING_SS", value: { en: "Operator note" } },
    { code: "FORM_MAPS_API_KEY", type: "STRING", value: "" },
  ];
  await fs.writeFile(path.join(outDir, "cms-family.payload.json"), JSON.stringify({
    schemaVersion: 1,
    root: {
      code: "FIELD_SERVICE_LANDING",
      parameters: [
        { code: "FORM_API_BASE_URL", type: "STRING", value: "" },
        { code: "FORM_TYPE_CODE", type: "STRING", value: "" },
        { code: "FORM_ORGANIZATION_ID", type: "STRING", value: "" },
        { code: "FORM_MAPS_API_KEY", type: "STRING", value: "" },
        { code: "FORM_THEME", type: "STRING", value: "snow" },
        { code: "NOTE", type: "LOCALIZED_STRING_SS", value: { en: "" } },
      ],
    },
    children: [],
  }));
  const preserving = await execFileAsync(process.execPath, liveArgs, { env });
  assert.equal(saveRequests, 1);
  const updatedRoot = savedEntities.find((entity) => entity.code === "FIELD_SERVICE_LANDING");
  const updated = (code) => updatedRoot.parameters.find((parameter) => parameter.code === code);
  assert.equal(updated("FORM_API_BASE_URL").value, "https://dev-1.servicewand.com", "a deployment value CMS holds survives an update that ships the parameter empty");
  assert.equal(updated("FORM_TYPE_CODE").value, "GET_QUOTE_", "every parameter the package ships empty keeps its CMS value, not just the first");
  assert.deepEqual(updated("NOTE").value, { en: "Operator note" }, "an empty localized bag does not overwrite the localized value CMS holds");
  assert.equal(updated("FORM_THEME").value, "snow", "a value the package actually ships is written over the CMS value");
  assert.equal(Object.hasOwn(updated("FORM_ORGANIZATION_ID"), "value"), false, "empty in the package and absent from CMS stays unset");
  assert.equal(Object.hasOwn(updated("FORM_MAPS_API_KEY"), "value"), false, "an empty CMS value is not a value to preserve");
  assert.match(preserving.stdout, /CMS value kept: FIELD_SERVICE_LANDING\.FORM_API_BASE_URL/);
  assert.match(preserving.stdout, /CMS value kept: FIELD_SERVICE_LANDING\.FORM_TYPE_CODE/);
  assert.match(preserving.stdout, /CMS value kept: FIELD_SERVICE_LANDING\.NOTE/);
  assert.doesNotMatch(preserving.stdout, /CMS value kept: FIELD_SERVICE_LANDING\.FORM_THEME/);
  assert.match(preserving.stdout, /no value in the package or in CMS: FIELD_SERVICE_LANDING\.FORM_ORGANIZATION_ID/);
  assert.match(preserving.stdout, /no value in the package or in CMS: FIELD_SERVICE_LANDING\.FORM_MAPS_API_KEY/);
  assert.equal(preserving.stdout.includes("dev-1.servicewand.com"), false, "the report names parameters, never the values behind them");
  assert.equal(preserving.stdout.includes("GET_QUOTE_"), false, "the report names parameters, never the values behind them");
  assert.equal(preserving.stdout.includes("Operator note"), false, "the report names parameters, never the values behind them");
  existingParameters = [];

  await fs.writeFile(path.join(outDir, "cms-family.payload.json"), JSON.stringify({
    schemaVersion: 1,
    root: {
      code: "INVALID_PARAMETER_CONTRACT",
      head: "<title>${ROOT_META_TITLE}</title>",
      parameters: [{ code: "ROOT_META_TITLE", type: "LOCALIZED_STRING_SS", value: { en: "Title" } }],
    },
    children: [],
  }));
  await assert.rejects(
    execFileAsync(process.execPath, [path.join(scriptsDir, "upload-cms-family.mjs"), "--out", outDir, "--dry-run"], { env }),
    /ROOT_META_TITLE marker is STRING, parameter is LOCALIZED_STRING_SS/,
  );

  await fs.writeFile(path.join(outDir, "cms-family.payload.json"), JSON.stringify({
    schemaVersion: 1,
    root: {
      code: "INVALID_SERVER_RUNTIME_PARAMETER",
      html: "<article>${POST@STRING}</article>",
      parameters: [],
    },
    children: [],
  }));
  await assert.rejects(
    execFileAsync(process.execPath, [path.join(scriptsDir, "upload-cms-family.mjs"), "--out", outDir, "--dry-run"], { env }),
    /POST is referenced but not declared/,
  );
  console.log("upload-cms-family-check ok: IDs and organization resolved, typed lookups used, parameter contracts checked, relationships stripped, empty values omitted like core-ui, CMS values preserved on update and reported by name");
} finally {
  await new Promise((resolve) => server.close(resolve));
  await fs.rm(outDir, { recursive: true, force: true });
}
