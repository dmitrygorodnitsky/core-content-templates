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
let missingCode = null;
let saveRequests = 0;
const savedEntities = [];

await fs.writeFile(path.join(outDir, "cms-family.payload.json"), JSON.stringify({
  schemaVersion: 1,
  root: {
    code: "FIELD_SERVICE_LANDING",
    parameters: [],
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
    code: "SECTION_01_HEADER_CORPORATE_REFERENCE",
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
  if (request.url === "/core-cms/api/block-template/list.json") {
    const body = JSON.parse(await readBody(request));
    const code = body.filters?.find((filter) => filter.property === "code")?.value;
    if (code === missingCode) return send(response, 200, { result: [] });
    const id = code === "FIELD_SERVICE_LANDING" ? rootId : childId;
    return send(response, 200, { result: [{ id, code }] });
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
  assert.match(success.stdout, new RegExp(`would update: SECTION_01_HEADER_CORPORATE_REFERENCE -> ${childId}`));

  await assert.rejects(
    execFileAsync(process.execPath, [...baseArgs, "--expected-root-id", "33333333-3333-4333-8333-333333333333"], { env }),
    /Root id mismatch/,
  );

  missingCode = "SECTION_01_HEADER_CORPORATE_REFERENCE";
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
  console.log("upload-cms-family-check ok: IDs printed, root pin enforced, missing template rejected, relationship fields stripped");
} finally {
  await new Promise((resolve) => server.close(resolve));
  await fs.rm(outDir, { recursive: true, force: true });
}
