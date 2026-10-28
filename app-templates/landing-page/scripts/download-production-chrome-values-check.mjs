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
const offlineOutput = path.join(scratch, "parameter-values.offline.json");
const pageDumpOutput = path.join(scratch, "page-context.json");
let pageListRequests = 0;
let pageGetRequests = 0;
let templateListRequests = 0;
let saveRequests = 0;

const ids = {
  pageRoot: "00000000-0000-4000-8000-000000000000",
  header: "11111111-1111-4111-8111-111111111111",
  headerMenu: "12121212-1212-4121-8121-121212121212",
  footer: "22222222-2222-4222-8222-222222222222",
};

const templates = {
  HEADER: {
    id: ids.header,
    code: "PRODUCTION_PAGE_HEADER",
    parameters: [
      { code: "HEADER_LOGO_ARIA_LABEL", type: "LOCALIZED_STRING_SS", value: { en: "Template logo" } },
      { code: "HEADER_DEMO_REQUEST_LABEL", type: "LOCALIZED_STRING_SS", value: { en: "Request Demo" } },
    ],
    children: [{
      id: ids.headerMenu,
      code: "HEADER_MENU",
      parameters: [
        { code: "HEADER_MENU_PLATFORM", type: "LOCALIZED_STRING_SS", value: { en: "Template platform" } },
        { code: "HEADER_MENU_ITEM_SHADOW", type: "IMAGE", value: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" },
      ],
      children: [],
    }],
  },
  FOOTER: {
    id: ids.footer,
    code: "PRODUCTION_PAGE_FOOTER",
    parameters: [
      { code: "FOOTER_TAGLINE", type: "LOCALIZED_STRING_SS", value: { en: "Template tagline" } },
      { code: "FOOTER_ADDRESS", type: "LOCALIZED_STRING_SS", value: { en: "Template address" } },
      { code: "FOOTER_BG_PIC", type: "IMAGE", value: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb" },
    ],
    children: [],
  },
};

const pageContext = {
  id: 42,
  url: "/source-page",
  site: "servicewand.com",
  template: {
    id: ids.pageRoot,
    code: "PRODUCTION_PAGE",
    parameters: [],
    children: [templates.HEADER, templates.FOOTER],
  },
  enabledTemplates: [ids.header, ids.headerMenu, ids.footer],
  values: {
    [ids.header]: {
      HEADER_LOGO_ARIA_LABEL: { en: "Page logo", fr: "Logo de la page" },
      HEADER_DEMO_REQUEST_LABEL: "",
      HEADER_REMOVED_PARAMETER: "stale nested override",
    },
    [ids.footer]: {
      FOOTER_TAGLINE: { en: "Page tagline" },
    },
    HEADER_MENU_PLATFORM: { en: "Legacy page platform" },
    REMOVED_PARAMETER: "ignored",
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
  if (request.url === "/core-cms/api/page-context/list.json") {
    pageListRequests += 1;
    const body = JSON.parse(await readBody(request));
    const filter = body.filters?.find((item) => item.property === "url");
    assert.equal(filter?.type, "STRING");
    return send(response, 200, { result: filter.value === pageContext.url ? [{ id: 42, url: pageContext.url }] : [] });
  }
  if (request.url === "/core-cms/api/page-context/get.json?id=42") {
    pageGetRequests += 1;
    const mappings = JSON.parse(await readBody(request));
    assert.ok(mappings.some((mapping) => mapping.name === "values"));
    assert.ok(mappings.some((mapping) => mapping.name === "enabledTemplates"));
    const templateMapping = mappings.find((mapping) => mapping.name === "template");
    assert.ok(templateMapping?.mappings?.some((mapping) => mapping.name === "children"));
    return send(response, 200, pageContext);
  }
  if (request.url === "/core-cms/api/block-template/list.json") {
    templateListRequests += 1;
    return send(response, 500, { error: "template list must not be used; resolve from PageContext tree" });
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
      "--page-url", "/source-page",
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
      "--page-url", "/source-page",
      "--live",
    ]),
    (error) => /Unknown argument: --live/.test(error.stderr),
  );
  await assert.rejects(
    execFileAsync(process.execPath, [
      path.join(scriptsDir, "download-production-chrome-values.mjs"),
    ]),
    (error) => /Specify exactly one page selector/.test(error.stderr),
  );
  assert.equal(pageListRequests, 0, "argument and source guards must fail before CMS reads");

  const dumpResult = await execFileAsync(process.execPath, [
    path.join(scriptsDir, "download-production-chrome-values.mjs"),
    "--page-context-id", "42",
    "--base-url", baseUrl,
    "--allow-non-production",
    "--dump-page", pageDumpOutput,
  ], {
    env: { ...process.env, SERVICEWAND_API_KEY: "check-key", SERVICEWAND_BEARER: "" },
  });
  assert.match(dumpResult.stdout, /complete production PageContext/);
  assert.match(dumpResult.stdout, /Attached templates: 4/);
  const pageDump = JSON.parse(await fs.readFile(pageDumpOutput, "utf8"));
  assert.equal(pageDump.$schema, "lab-ui/production-page-context-dump@1");
  assert.equal(pageDump.pageContext.template.children[0].id, ids.header);
  assert.equal(templateListRequests, 0);
  assert.equal(saveRequests, 0);

  const countsBeforeOffline = {
    pageListRequests,
    pageGetRequests,
    templateListRequests,
    saveRequests,
  };
  const offlineResult = await execFileAsync(process.execPath, [
    path.join(scriptsDir, "download-production-chrome-values.mjs"),
    "--from-page-dump", pageDumpOutput,
    "--allow-non-production",
    "--out", offlineOutput,
  ]);
  assert.match(offlineResult.stdout, /effective production page chrome values/);
  assert.deepEqual(
    { pageListRequests, pageGetRequests, templateListRequests, saveRequests },
    countsBeforeOffline,
    "offline dump processing must not access CMS",
  );
  const offlineSnapshot = JSON.parse(await fs.readFile(offlineOutput, "utf8"));
  assert.equal(offlineSnapshot.templates.header.rootTemplateCode, "PRODUCTION_PAGE_HEADER");
  assert.deepEqual(offlineSnapshot.templates.footer.values.tagline, { en: "Page tagline" });

  const result = await execFileAsync(process.execPath, [
    path.join(scriptsDir, "download-production-chrome-values.mjs"),
    "--page-url", "https://servicewand.com/source-page",
    "--base-url", baseUrl,
    "--org", "SYSTEM",
    "--allow-non-production",
    "--out", output,
  ], {
    env: { ...process.env, SERVICEWAND_API_KEY: "check-key", SERVICEWAND_BEARER: "" },
  });
  assert.match(result.stdout, /CMS READ ONLY/);
  assert.match(result.stdout, /PageContext: 42 \/source-page/);
  assert.match(result.stdout, /CMS writes: 0/);
  assert.equal(pageListRequests, 1);
  assert.equal(pageGetRequests, 2);
  assert.equal(templateListRequests, 0);
  assert.equal(saveRequests, 0);

  const snapshot = JSON.parse(await fs.readFile(output, "utf8"));
  assert.equal(snapshot.$schema, "lab-ui/production-page-chrome-values@2");
  assert.equal(snapshot.source.readOnly, true);
  assert.deepEqual(snapshot.source.pageContext, {
    id: 42,
    url: "/source-page",
    site: "servicewand.com",
    template: { id: ids.pageRoot, code: "PRODUCTION_PAGE" },
  });
  assert.deepEqual(snapshot.templates.header.values.logo_aria_label, {
    en: "Page logo",
    fr: "Logo de la page",
  });
  assert.equal(snapshot.templates.header.rootTemplateId, ids.header, "must select the family HEADER from the page tree");
  assert.equal(snapshot.templates.header.rootTemplateCode, "PRODUCTION_PAGE_HEADER");
  assert.equal(snapshot.templates.footer.rootTemplateCode, "PRODUCTION_PAGE_FOOTER");
  assert.equal(snapshot.templates.header.valueSources.logo_aria_label, "pageContext");
  assert.equal(snapshot.templates.header.values.demo_request_label, "", "explicit page clear must be retained");
  assert.equal(snapshot.templates.header.valueSources.demo_request_label, "pageContext");
  assert.deepEqual(snapshot.templates.header.values.menu_platform, { en: "Legacy page platform" });
  assert.equal(snapshot.templates.header.valueSources.menu_platform, "legacyPageContext");
  assert.equal(snapshot.templates.header.values.menu_item_shadow, "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa");
  assert.equal(snapshot.templates.header.valueSources.menu_item_shadow, "templateDefault");
  assert.deepEqual(snapshot.templates.footer.values.tagline, { en: "Page tagline" });
  assert.deepEqual(snapshot.templates.footer.values.address, { en: "Template address" });
  assert.equal(snapshot.templates.footer.valueSources.address, "templateDefault");
  assert.equal(snapshot.templates.footer.sourceTemplates[0].enabledOnPage, true);
  assert.deepEqual(snapshot.unresolvedPageValueKeys, [
    `${ids.header}.HEADER_REMOVED_PARAMETER`,
    "REMOVED_PARAMETER",
  ]);
  assert.equal(Object.hasOwn(snapshot, "downloadedAt"), false, "snapshot must remain deterministic");

  await execFileAsync(process.execPath, [
    path.join(scriptsDir, "download-production-chrome-values.mjs"),
    "--page-context-id", "42",
    "--base-url", baseUrl,
    "--allow-non-production",
    "--stdout",
  ], {
    env: { ...process.env, SERVICEWAND_API_KEY: "check-key", SERVICEWAND_BEARER: "" },
  });
  assert.equal(pageListRequests, 1, "id selector must not perform PageContext list lookup");
  assert.equal(pageGetRequests, 3);
  assert.equal(templateListRequests, 0);
  assert.equal(saveRequests, 0);
  console.log("download-production-chrome-values-check ok: effective PageContext values, explicit clears, zero CMS writes");
} finally {
  await new Promise((resolve) => server.close(resolve));
  await fs.rm(scratch, { recursive: true, force: true });
}
