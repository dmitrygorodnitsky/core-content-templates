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
const scratchDir = await fs.mkdtemp(path.join(landingRoot, "dist/.parameter-sync-check-"));
const parametersFile = path.join(scratchDir, "parameters.json");
const templateId = "22222222-2222-4222-8222-222222222222";
const existingImageId = "33333333-3333-4333-8333-333333333333";
let saveRequests = 0;
let savedEntity;

await fs.writeFile(parametersFile, JSON.stringify([
  {
    code: "HERO_TITLE",
    type: "LOCALIZED_STRING_SS",
    value: { en: "New title" },
    nls: { en: { NAME: "Hero title" } },
  },
  {
    code: "HERO_IMAGE",
    type: "IMAGE",
    value: "77084eeb-daa5-47ee-8dd7-fad0fbbd0806",
    nls: { en: { NAME: "Hero image" } },
  },
  {
    code: "HERO_IMAGE_NAME",
    type: "STRING",
    value: "/",
    nls: { en: { NAME: "Hero image name" } },
  },
]));

const existingTemplate = {
  id: templateId,
  code: "FIELD_SERVICE_LANDING_HERO",
  nls: { en: { NAME: "Field Service Landing | Hero" } },
  organization: { id: 42, code: "SYSTEM" },
  templateLanguage: "JTE",
  advanced: false,
  head: "<meta charset=\"utf-8\">",
  html: "<h1>${HERO_TITLE@LOCALIZED_STRING_SS}</h1><img src=\"/core/image/${HERO_IMAGE@IMAGE}/get/${HERO_IMAGE_NAME@STRING}\"><article>${POST@BLOG_POST_CONTENT_SS}</article>",
  javascript: "document.body.dataset.ready = 'true';",
  css: ".hero { display: block; }",
  optimistic: 7,
  parent: { id: "11111111-1111-4111-8111-111111111111", code: "FIELD_SERVICE_LANDING" },
  parameters: [
    {
      code: "HERO_TITLE",
      type: "LOCALIZED_STRING_SS",
      value: { en: "Old title" },
      nls: { en: { NAME: "Hero title" } },
    },
    {
      code: "HERO_IMAGE",
      type: "IMAGE",
      value: existingImageId,
      nls: { en: { NAME: "Hero image" } },
    },
    {
      code: "HERO_IMAGE_NAME",
      type: "STRING",
      value: "real-image.webp",
      nls: { en: { NAME: "Hero image name" } },
    },
  ],
};

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
    const codeFilter = body.filters?.find((filter) => filter.property === "code");
    assert.equal(codeFilter?.type, "STRING");
    return send(response, 200, { result: [existingTemplate] });
  }
  if (request.url === "/core-cms/api/block-template/save.json") {
    saveRequests += 1;
    const body = JSON.parse(await readBody(request));
    savedEntity = body.entities?.[0];
    return send(response, 200, [templateId]);
  }
  return send(response, 404, { error: "not found" });
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const args = [
  path.join(scriptsDir, "sync-block-template-parameters.mjs"),
  "--template-code", "FIELD_SERVICE_LANDING_HERO",
  "--parameters-json", parametersFile,
  "--base-url", `http://127.0.0.1:${server.address().port}/core`,
  "--org", "SYSTEM",
  "--mode", "merge",
];
const env = { ...process.env, SERVICEWAND_API_KEY: "local-check-key", SERVICEWAND_BEARER: "" };

try {
  const dryRun = await execFileAsync(process.execPath, [...args, "--dry-run"], { env });
  assert.match(dryRun.stdout, /Content:\s+unchanged/);
  assert.match(dryRun.stdout, /Updated: 1\s+- HERO_TITLE/);
  assert.match(dryRun.stdout, /Unchanged incoming: 2/);
  assert.equal(saveRequests, 0, "dry-run must not save");

  await execFileAsync(process.execPath, [...args, "--live"], { env });
  assert.equal(saveRequests, 1, "live mode saves once");
  assert.equal(savedEntity.head, existingTemplate.head);
  assert.equal(savedEntity.html, existingTemplate.html);
  assert.equal(savedEntity.javascript, existingTemplate.javascript);
  assert.equal(savedEntity.css, existingTemplate.css);
  assert.equal(Object.hasOwn(savedEntity, "parent"), false, "parameter sync must not write parent");
  assert.deepEqual(savedEntity.organization, { id: 42 });
  assert.equal(savedEntity.parameters.find((parameter) => parameter.code === "HERO_TITLE").value.en, "New title");
  assert.equal(savedEntity.parameters.find((parameter) => parameter.code === "HERO_IMAGE").value, existingImageId);
  assert.equal(savedEntity.parameters.find((parameter) => parameter.code === "HERO_IMAGE_NAME").value, "real-image.webp");
  console.log("sync-block-template-parameters-check ok: content preserved, typed lookup used, existing media id/name retained over sentinel defaults");
} finally {
  await new Promise((resolve) => server.close(resolve));
  await fs.rm(scratchDir, { recursive: true, force: true });
}
