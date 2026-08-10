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
const scratch = await fs.mkdtemp(path.join(landingRoot, "dist/.production-chrome-values-check-"));
const output = path.join(scratch, "parameter-values.json");
let listRequests = 0;
let saveRequests = 0;

const templates = {
  FIELD_SERVICE_LANDING_HEADER: {
    id: "11111111-1111-4111-8111-111111111111",
    code: "FIELD_SERVICE_LANDING_HEADER",
    parameters: [
      { code: "SECTION_01_HEADER_CORPORATE_REFERENCE_LOGO_ARIA_LABEL", type: "LOCALIZED_STRING_SS", value: { fr: "ServiceWand", en: "ServiceWand" } },
      { code: "SECTION_01_HEADER_CORPORATE_REFERENCE_MENU_PLATFORM", type: "LOCALIZED_STRING_SS", value: { en: "Platform" } },
      { code: "SECTION_01_HEADER_CORPORATE_REFERENCE_MENU_ITEM_SHADOW", type: "IMAGE", value: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" },
      { code: "SECTION_01_HEADER_CORPORATE_REFERENCE_MENU_PANEL_TEXT", type: "LOCALIZED_STRING_SS", value: { en: "" } },
      { code: "SECTION_01_HEADER_CORPORATE_REFERENCE_LEGACY_ONLY", type: "STRING", value: "preserved" },
    ],
  },
  FIELD_SERVICE_LANDING_FOOTER: {
    id: "22222222-2222-4222-8222-222222222222",
    code: "FIELD_SERVICE_LANDING_FOOTER",
    parameters: [
      { code: "SECTION_14_FOOTER_CORPORATE_REFERENCE_TAGLINE", type: "LOCALIZED_STRING_SS", value: { en: "One connected field service platform." } },
      { code: "SECTION_14_FOOTER_CORPORATE_REFERENCE_BG_PIC", type: "IMAGE", value: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" },
      { code: "SECTION_14_FOOTER_CORPORATE_REFERENCE_ADDRESS", type: "LOCALIZED_STRING_SS", value: null },
    ],
  },
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
  if (request.url === "/auth/token") return send(response, 200, { access_token: "read-only-token" });
  if (request.url === "/core-cms/api/block-template/list.json") {
    listRequests += 1;
    const body = JSON.parse(await readBody(request));
    const filter = body.filters?.find((item) => item.property === "code");
    assert.equal(filter?.type, "STRING");
    return send(response, 200, { result: templates[filter.value] ? [templates[filter.value]] : [] });
  }
  if (request.url?.includes("/save.json")) {
    saveRequests += 1;
    return send(response, 500, { error: "read-only check forbids writes" });
  }
  return send(response, 404, { error: "not found" });
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const baseUrl = `http://127.0.0.1:${server.address().port}/core`;

try {
  await assert.rejects(
    execFileAsync(process.execPath, [
      path.join(scriptsDir, "download-production-chrome-values.mjs"),
      "--base-url", baseUrl,
      "--out", output,
    ], {
      env: { ...process.env, SERVICEWAND_API_KEY: "check-key", SERVICEWAND_BEARER: "" },
    }),
    (error) => /Refusing to label a non-production source as production/.test(error.stderr),
  );
  await assert.rejects(
    execFileAsync(process.execPath, [
      path.join(scriptsDir, "download-production-chrome-values.mjs"),
      "--live",
    ]),
    (error) => /Unknown argument: --live/.test(error.stderr),
  );
  assert.equal(listRequests, 0, "source guard and rejected --live must fail before CMS reads");

  const result = await execFileAsync(process.execPath, [
    path.join(scriptsDir, "download-production-chrome-values.mjs"),
    "--base-url", baseUrl,
    "--org", "SYSTEM",
    "--allow-non-production",
    "--out", output,
  ], {
    env: { ...process.env, SERVICEWAND_API_KEY: "check-key", SERVICEWAND_BEARER: "" },
  });
  assert.match(result.stdout, /CMS READ ONLY/);
  assert.match(result.stdout, /CMS writes: 0/);
  assert.equal(listRequests, 2);
  assert.equal(saveRequests, 0);

  const snapshot = JSON.parse(await fs.readFile(output, "utf8"));
  assert.equal(snapshot.source.readOnly, true);
  assert.equal(snapshot.templates.header.parameterPrefix, "SECTION_01_HEADER_CORPORATE_REFERENCE");
  assert.deepEqual(snapshot.templates.header.values.logo_aria_label, { en: "ServiceWand", fr: "ServiceWand" });
  assert.deepEqual(snapshot.templates.header.values.menu_platform, { en: "Platform" });
  assert.equal(snapshot.templates.header.values.menu_item_shadow, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  assert.equal(Object.hasOwn(snapshot.templates.header.values, "menu_panel_text"), false);
  assert.deepEqual(snapshot.templates.header.unmappedParameters, [
    { code: "SECTION_01_HEADER_CORPORATE_REFERENCE_LEGACY_ONLY", type: "STRING", value: "preserved" },
  ]);
  assert.equal(snapshot.templates.footer.values.bg_pic, "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
  assert.deepEqual(snapshot.templates.footer.values.tagline, { en: "One connected field service platform." });
  assert.equal(Object.hasOwn(snapshot.templates.footer.values, "address"), false);
  assert.equal(Object.hasOwn(snapshot, "downloadedAt"), false, "snapshot must remain deterministic");
  console.log("download-production-chrome-values-check ok: two typed reads, zero CMS writes, deterministic mapped snapshot");
} finally {
  await new Promise((resolve) => server.close(resolve));
  await fs.rm(scratch, { recursive: true, force: true });
}
