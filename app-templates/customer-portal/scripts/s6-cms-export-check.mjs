import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";
import { exportCms, renderPortalFromValues } from "./export-cms.mjs";
import { generateSeoPublic, generateSeoPublicTest } from "./generate-seo-public.mjs";
import { assertValidCmsPayload, validateCmsPayload } from "./cms-schema-validation.mjs";
import { normalizeSeoPublic, normalizeSeoPublicTest } from "../runtime/src/normalizers/seo.js";
import { readPortalConfig } from "../runtime/src/config.js";

const root = path.resolve("app-templates/customer-portal");
const evidenceDir = process.env.S6_EVIDENCE_DIR ? path.resolve(process.env.S6_EVIDENCE_DIR) : null;
const verticals = ["hvac", "snow", "lawn", "pool", "roofing", "pest", "health", "beauty"];
const profiles = ["onDemand", "stormOps", "appointments"];
const expectedProfile = { hvac: "onDemand", snow: "stormOps", lawn: "stormOps", pool: "stormOps", roofing: "stormOps", pest: "stormOps", health: "appointments", beauty: "appointments" };
const portalStyles = ["tokens.css", "base.css", "shell.css", "components.css", "routes.css", "responsive.css", "seo.css"].map((name) => "../runtime/styles/" + name);
const publicStyles = ["tokens.css", "base.css", "components.css", "seo.css"].map((name) => "../runtime/styles/" + name);

const portalBlock = await readJson(path.join(root, "cms/block.json"));
const publicBlock = await readJson(path.join(root, "cms/seo-public-block.json"));
const publicSchema = await readJson(path.join(root, "cms/seo-public.schema.json"));
const authoredTest = await readJson(path.join(root, "scripts/fixtures/seo-public-authored.test.json"));

assert.equal(portalBlock.id, "customer-portal.runtime");
assert.deepEqual(portalBlock.runtime.styles, portalStyles, "portal owns shell/routes/Care and parity SEO styles");
assert.equal(portalBlock.runtime.modules.includes("care"), true, "portal module inventory includes Care");
assert.deepEqual(portalBlock.runtime.authorization.care.decisionStates, ["granted", "denied", "loading", "error"]);
assert.equal(portalBlock.runtime.authorization.care.cmsAuthorable, false, "Care entitlements cannot be authored in CMS");
assert.doesNotMatch(JSON.stringify(portalBlock.params), /entitlement|permission|customerScope|tenantScope/i, "CMS params contain no customer entitlement decisions");

const params = new Map(portalBlock.params.map((param) => [param.code, param]));
assert.equal(params.size, portalBlock.params.length, "portal parameter codes are unique");
assert.deepEqual([...params.keys()], [
  "portal_title", "portal_api_base", "portal_organization", "portal_vertical", "portal_profile", "portal_theme",
  "portal_default_mode", "portal_router_mode", "portal_default_route", "portal_enabled_modules", "portal_auth_mode",
  "portal_error_mode", "portal_data_mode", "portal_case", "portal_pim_fixture_url", "portal_pim_product_type_code", "portal_pim_currency",
], "portal CMS exposes only the current production parameter codes");
assert.deepEqual(params.get("portal_vertical").options, verticals);
assert.deepEqual(params.get("portal_theme").options, verticals);
assert.deepEqual(params.get("portal_profile").options, profiles);
assert.equal(params.get("portal_enabled_modules").default, "", "module override defaults empty so profile modules remain authoritative");
assert.equal(params.get("portal_enabled_modules").defaultSource, "portalProfile.modules");
assert.equal(params.get("portal_default_mode").initialDefaultOnly, true);
assert.equal(params.get("portal_case").fixtureOnly, true, "fixture case selection is not a live CMS data selector");
for (const param of portalBlock.params) {
  assert.equal(Object.prototype.hasOwnProperty.call(param, "default"), true, param.code + " has an explicit default");
  if (param.required) assert.notEqual(String(param.default), "", param.code + " required default is nonempty");
  if (param.type === "ENUM") assert.equal(param.options.includes(param.default), true, param.code + " enum default belongs to options");
}

assert.equal(publicBlock.id, "customer-portal.public-seo");
assert.deepEqual(publicBlock.verticals, verticals);
assert.deepEqual(publicBlock.runtime.styles, publicStyles, "public SEO owns only shared visual and SEO styles");
assert.equal(publicBlock.runtime.auth, "public");
assert.equal(publicBlock.runtime.router, "document");
assert.equal(publicBlock.runtime.serverVisibleBody, true);
assert.equal(publicBlock.runtime.styles.some((style) => /shell|routes|responsive/.test(style)), false, "public SEO excludes portal shell/router styles");
assert.match(publicSchema.$schema, /2020-12/);
assert.equal(publicSchema.properties.classification.const, "public-authored");
assert.equal(publicSchema.properties.content.additionalProperties, false);
assert.deepEqual(publicSchema.$defs.vertical.properties.slug.enum, verticals);
assert.deepEqual(publicSchema.properties.content.required, ["brand", "vertical", "meta", "hero", "services", "trust", "how", "proof", "pricing", "area", "reviews", "faq", "ctas", "final", "footer"]);

const refSiblingSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "s6/ref-sibling",
  $defs: { text: { type: "string" } },
  $ref: "#/$defs/text",
  minLength: 2,
};
assert.throws(() => assertValidCmsPayload(refSiblingSchema, "x"), /shorter than minLength/, "$ref sibling assertion is evaluated");
assert.equal(assertValidCmsPayload(refSiblingSchema, "xx"), "xx", "$ref sibling valid value passes without double application");
const oneOfSiblingSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "s6/oneof-sibling",
  oneOf: [{ type: "string" }, { type: "number" }],
  minLength: 2,
};
assert.throws(() => assertValidCmsPayload(oneOfSiblingSchema, "x"), /shorter than minLength/, "oneOf sibling assertion is evaluated");
assert.equal(assertValidCmsPayload(oneOfSiblingSchema, "xx"), "xx", "oneOf sibling valid value passes without double application");
assert.deepEqual(validateCmsPayload({ $schema: "https://json-schema.org/draft/2020-12/schema", type: "string", const: "expected" }, 1), ["payload must be string", "payload must equal \"expected\""], "independent sibling assertions are all evaluated after a type failure");
assert.throws(() => assertValidCmsPayload({ ...refSiblingSchema, maxLength: 5 }, "xx"), /unsupported schema keyword maxLength/, "unsupported schema keywords remain fail-closed");
const uniqueObjectSchema = { $schema: "https://json-schema.org/draft/2020-12/schema", type: "array", uniqueItems: true };
assert.throws(() => assertValidCmsPayload(uniqueObjectSchema, [{ a: 1, b: 2 }, { b: 2, a: 1 }]), /contains duplicate items/, "uniqueItems treats reordered object keys as structurally equal");
assert.deepEqual(assertValidCmsPayload(uniqueObjectSchema, [{ a: 1, b: 2 }, { a: 1, b: 3 }]), [{ a: 1, b: 2 }, { a: 1, b: 3 }], "uniqueItems permits structurally different objects");
assert.deepEqual(assertValidCmsPayload(uniqueObjectSchema, [[1, 2], [2, 1]]), [[1, 2], [2, 1]], "uniqueItems keeps array order significant");
const objectConstSchema = { $schema: "https://json-schema.org/draft/2020-12/schema", const: { a: 1, b: [2, 3] } };
assert.deepEqual(assertValidCmsPayload(objectConstSchema, { b: [2, 3], a: 1 }), { b: [2, 3], a: 1 }, "object const ignores key insertion order");
assert.throws(() => assertValidCmsPayload(objectConstSchema, { a: 1, b: [3, 2] }), /must equal/, "object const preserves nested array order");
const arrayConstSchema = { $schema: "https://json-schema.org/draft/2020-12/schema", const: [{ a: 1 }, 2] };
assert.deepEqual(assertValidCmsPayload(arrayConstSchema, [{ a: 1 }, 2]), [{ a: 1 }, 2], "array const accepts structural equality");
assert.throws(() => assertValidCmsPayload(arrayConstSchema, [2, { a: 1 }]), /must equal/, "array const rejects reordered values");
const objectEnumSchema = { $schema: "https://json-schema.org/draft/2020-12/schema", enum: [{ a: 1, b: 2 }, { mode: "other" }] };
assert.deepEqual(assertValidCmsPayload(objectEnumSchema, { b: 2, a: 1 }), { b: 2, a: 1 }, "object enum ignores key insertion order");
assert.throws(() => assertValidCmsPayload(objectEnumSchema, { a: 1, b: 3 }), /allowed enum value/, "object enum rejects a structurally different object");
assert.throws(() => assertValidCmsPayload(refSiblingSchema, Number.NaN), /valid JSON value/, "non-JSON runtime values are rejected explicitly");
assert.throws(() => assertValidCmsPayload({ $schema: "https://json-schema.org/draft/2020-12/schema", additionalProperties: { type: "string" } }, {}), /additionalProperties must be exactly false/, "additionalProperties schema form is rejected rather than ignored");
assert.throws(() => validateCmsPayload({ $schema: "https://json-schema.org/draft/2020-12/schema", type: "array", items: false }, []), /items must be an object schema/, "exported validateCmsPayload cannot bypass boolean-schema meta-scan");
assert.throws(() => assertValidCmsPayload({ $schema: "https://json-schema.org/draft/2020-12/schema", properties: { x: false } }, {}), /properties\.x must be a non-array plain object schema/, "boolean property schema is rejected rather than ignored");
assert.throws(() => assertValidCmsPayload({ $schema: "https://json-schema.org/draft/2020-12/schema", properties: [] }, {}), /properties must be a plain object schema map/, "array properties map is rejected");
assert.throws(() => assertValidCmsPayload({ $schema: "https://json-schema.org/draft/2020-12/schema", oneOf: [] }, "x"), /oneOf must be a nonempty array/, "empty oneOf is rejected");
assert.throws(() => assertValidCmsPayload({ $schema: "https://json-schema.org/draft/2020-12/schema", type: ["string", "string"] }, "x"), /type must be a supported type string/, "duplicate type declarations are rejected");
assert.throws(() => assertValidCmsPayload({ $schema: "https://json-schema.org/draft/2020-12/schema", required: "x" }, {}), /required must be an array of unique strings/, "malformed required is rejected");
assert.throws(() => assertValidCmsPayload({ $schema: "https://json-schema.org/draft/2020-12/schema", enum: [] }, "x"), /enum must be a nonempty array/, "empty enum is rejected");
assert.throws(() => assertValidCmsPayload({ $schema: "https://json-schema.org/draft/2020-12/schema", uniqueItems: "true" }, []), /uniqueItems must be boolean/, "malformed uniqueItems is rejected");
assert.throws(() => assertValidCmsPayload({ $schema: "https://json-schema.org/draft/2020-12/schema", minLength: -1 }, "x"), /minLength must be a nonnegative integer/, "malformed minLength is rejected");
assert.throws(() => assertValidCmsPayload({ $schema: "https://json-schema.org/draft/2020-12/schema", pattern: "(" }, "x"), /pattern must be a valid regular expression/, "invalid regex is rejected before execution");
const nestedRefSchema = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  required: ["name"],
  properties: { name: { $ref: "#/$defs/group/properties/name" } },
  $defs: { group: { type: "object", properties: { name: { type: "string", minLength: 2 } } } },
};
assert.deepEqual(assertValidCmsPayload(nestedRefSchema, { name: "ok" }), { name: "ok" }, "valid nested local ref resolves to a scanned schema node");
assert.throws(() => assertValidCmsPayload(nestedRefSchema, { name: "x" }), /shorter than minLength/, "nested local ref executes its target assertions");
for (const [label, reference, pattern] of [
  ["defs map", "#/$defs", /target is not a recognized schema node/],
  ["properties map", "#/properties", /target is not a recognized schema node/],
  ["dangerous prototype", "#/__proto__", /dangerous JSON Pointer segment/],
  ["missing target", "#/$defs/missing", /does not resolve through own properties/],
  ["inherited target", "#/toString", /does not resolve through own properties/],
  ["scalar target", "#/$id", /target is not a recognized schema node/],
]) {
  const schema = { ...nestedRefSchema, $id: "s6/ref-target-test", $ref: reference };
  assert.throws(() => assertValidCmsPayload(schema, { name: "ok" }), pattern, "$ref rejects " + label);
}
assert.throws(() => assertValidCmsPayload({ $schema: "https://json-schema.org/draft/2020-12/schema", type: "string", minLength: 2 }, "😀"), /shorter than minLength/, "minLength counts one emoji as one Unicode code point");
assert.equal(assertValidCmsPayload({ $schema: "https://json-schema.org/draft/2020-12/schema", type: "string", minLength: 2 }, "😀a"), "😀a", "minLength accepts two Unicode code points");

normalizeSeoPublicTest(authoredTest);
const productionShape = structuredClone(authoredTest);
productionShape.classification = "public-authored";
productionShape.deployment.canonicalOrigin = "https://servicewand.com";
productionShape.deployment.allowedOrigins = ["https://servicewand.com"];
productionShape.content.brand.url = "https://servicewand.com/";
productionShape.content.meta.canonical = "https://servicewand.com/hvac/{locality-slug}";
productionShape.content.services.forEach((service) => { service.destination = null; });
productionShape.content.ctas.primary.destination = null;
productionShape.content.footer.legal = [];
assert.deepEqual(validateCmsPayload(publicSchema, productionShape), [], "production-shaped payload satisfies the public CMS JSON Schema");
assert.equal(assertValidCmsPayload(publicSchema, productionShape), productionShape);
const schemaNegative = structuredClone(productionShape);
delete schemaNegative.content.meta.h1;
assert.equal(validateCmsPayload(publicSchema, schemaNegative).some((error) => error === "content.meta.h1 is required"), true, "schema rejects a missing authored H1");
normalizeSeoPublic(productionShape);
for (const vertical of verticals) {
  const publicVertical = structuredClone(productionShape);
  publicVertical.content.vertical.slug = vertical;
  publicVertical.content.vertical.name = vertical.toUpperCase();
  publicVertical.content.meta.canonical = "https://servicewand.com/" + vertical + "/{locality-slug}";
  assert.deepEqual(validateCmsPayload(publicSchema, publicVertical), [], vertical + " public schema round trip");
  assert.equal(normalizeSeoPublic(publicVertical).vertical.slug, vertical, vertical + " public normalizer round trip");
}

for (const vertical of verticals) {
  const profile = expectedProfile[vertical];
  const html = await renderPortalFromValues({ portal_vertical: vertical, portal_theme: vertical, portal_profile: profile });
  const dataset = datasetFromPortalHtml(html);
  const config = readPortalConfig({ dataset });
  assert.equal(config.vertical, vertical, vertical + " vertical round trip");
  assert.equal(config.theme, vertical, vertical + " theme round trip");
  assert.equal(config.profile, profile, vertical + " profile round trip");
  assert.equal(config.enabledModules.includes("care"), true, vertical + " Care module round trip");
}
for (const [profile, vertical] of [["onDemand", "hvac"], ["stormOps", "snow"], ["appointments", "health"]]) {
  const html = await renderPortalFromValues({ portal_vertical: vertical, portal_theme: vertical, portal_profile: profile });
  assert.equal(readPortalConfig({ dataset: datasetFromPortalHtml(html) }).profile, profile, profile + " profile round trip");
}
for (const authMode of ["fixture", "required"]) {
  const html = await renderPortalFromValues({ portal_auth_mode: authMode });
  assert.equal(readPortalConfig({ dataset: datasetFromPortalHtml(html) }).authMode, authMode, authMode + " auth mode round trip");
}
await assert.rejects(() => renderPortalFromValues({ portal_vertical: "unsupported" }), /enum value is unsupported: portal_vertical/);
await assert.rejects(() => renderPortalFromValues({ portal_profile: "legacyProfile" }), /enum value is unsupported: portal_profile/);
await assert.rejects(() => renderPortalFromValues({ portal_auth_mode: "optional" }), /enum value is unsupported: portal_auth_mode/);
await assert.rejects(() => renderPortalFromValues({ portal_title: "  " }), /Required portal CMS value is empty: portal_title/);
await assert.rejects(() => renderPortalFromValues({ portal_vertical: 42 }), /must be a string: portal_vertical/);
await assert.rejects(() => renderPortalFromValues({ portal_legacy_mode: "fixture" }), /Unknown portal CMS override/);
assert.match(await renderPortalFromValues({ portal_pim_fixture_url: "", portal_enabled_modules: "" }), /data-portal-pim-fixture-url=""/, "optional empty CMS strings remain valid");
const modeSource = await fs.readFile(path.join(root, "runtime/src/state.js"), "utf8");
assert.match(modeSource, /if \(!state\.userModeOverridden\)/, "runtime applies CMS mode only while it remains an initial default");

const firstDir = await fs.mkdtemp(path.join(root, ".s6-export-a-"));
const secondDir = await fs.mkdtemp(path.join(root, ".s6-export-b-"));
await generatorSchemaNegativeTests(firstDir);
await assert.rejects(() => exportCms({ outputDir: firstDir, portalValues: { portal_auth_mode: "legacy" } }), /enum value is unsupported: portal_auth_mode/, "portal export validates authored overrides before rendering or cleaning output");
await assert.rejects(() => exportCms({ outputDir: path.join(root, "runtime") }), /output must be customer-portal\/dist/, "export refuses to clean a source directory");
let server;
let browser;
let dualHashes;
try {
  let first = await exportCms({ outputDir: firstDir });
  await fs.writeFile(path.join(firstDir, "sentinel.txt"), "previous successful export must survive\n", "utf8");
  const preservedTree = await hashTree(firstDir);
  const invalidSeo = structuredClone(authoredTest);
  invalidSeo.content.meta.unexpected = "rejected";
  const invalidSeoPath = path.join(secondDir, "invalid-seo.json");
  await fs.writeFile(invalidSeoPath, JSON.stringify(invalidSeo), "utf8");
  await assert.rejects(() => exportCms({ outputDir: firstDir, seoInputPath: invalidSeoPath }), /content\.meta\.unexpected is not allowed/, "invalid SEO export fails before replacing the previous target");
  assert.deepEqual(await hashTree(firstDir), preservedTree, "failed SEO export preserves the prior full tree and sentinel byte-for-byte");
  assert.deepEqual(await transactionDebris(firstDir), [], "failed export leaves no staging or backup directories");

  first = await exportCms({ outputDir: firstDir });
  const second = await exportCms({ outputDir: secondDir });
  const firstTree = await hashTree(firstDir);
  const secondTree = await hashTree(secondDir);
  assert.deepEqual(firstTree, secondTree, "two clean exports are byte-identical");
  assert.deepEqual(first.artifactHashes, firstTree, "transaction hashes every promoted portal/public artifact");
  assert.deepEqual(second.artifactHashes, secondTree, "second transaction hashes every promoted portal/public artifact");
  assert.deepEqual(await transactionDebris(firstDir), [], "successful export leaves no first-target transaction debris");
  assert.deepEqual(await transactionDebris(secondDir), [], "successful export leaves no second-target transaction debris");
  dualHashes = firstTree;
  assert.deepEqual(Object.keys(firstTree), ["cms-export-manifest.json", "customer-portal-preview.html", "portal-cms-package.json", "public-seo-cms-package.json", "public-seo-preview.html"]);

  const portalPackage = await readJson(first.portalPackagePath);
  const publicSeoPackage = await readJson(first.publicSeoPackagePath);
  assert.equal(portalPackage.block.id, portalBlock.id);
  assert.equal(portalPackage.template.includes("data-portal-auth-mode"), true);
  assert.equal(publicSeoPackage.block.id, publicBlock.id);
  assert.equal(publicSeoPackage.inputSchema.$id, publicSchema.$id);
  assert.equal(publicSeoPackage.template.includes("seo_faq_json_ld"), true);

  const portalHtml = await fs.readFile(first.portalPath, "utf8");
  const publicHtml = await fs.readFile(first.publicSeoPath, "utf8");
  assertRootAttributes(portalHtml);
  assert.match(portalHtml, /<script type="module" src="\.\.\/runtime\/src\/app\.js"><\/script>/);
  assert.equal((portalHtml.match(/<script\b/g) || []).length, 1, "portal preview contains only its runtime entry");
  assert.match(publicHtml, /<title>[^<]+<\/title>/);
  assert.match(publicHtml, /<meta name="description" content="[^"]+">/);
  assert.match(publicHtml, /<meta name="robots" content="noindex,nofollow">/, "test preview is noindex");
  assert.match(publicHtml, /<link rel="canonical" href="https:\/\//);
  assert.match(publicHtml, /<h1\b[^>]*>[^<]/);
  assert.match(publicHtml, /<script type="application\/ld\+json">/);
  assert.match(publicHtml, /<details\b[^>]*class="seo-faq__item"/);
  assert.doesNotMatch(publicHtml, /id="app"|AircovePortal|src\/app\.js|location\.hash/);
  assert.equal((publicHtml.match(/<script type="module"/g) || []).length, 1, "public SEO contains only its progressive-enhancement entry");
  assert.equal((publicHtml.match(/<script\b/g) || []).length, 2, "public SEO contains JSON-LD plus one owned module script");

  ({ server } = await startServer(root));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const requireFrom = process.env.PLAYWRIGHT_NODE_MODULES ? createRequire(path.join(process.env.PLAYWRIGHT_NODE_MODULES, "package.json")) : createRequire(import.meta.url);
  const { chromium } = requireFrom("playwright");
  const launchOptions = { headless: true };
  if (process.env.PLAYWRIGHT_EXECUTABLE_PATH) launchOptions.executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH;
  browser = await chromium.launch(launchOptions);
  const failures = [];
  const portalPage = await browser.newPage({ viewport: { width: 1180, height: 900 } });
  collectErrors(portalPage, "portal", failures);
  await portalPage.goto(baseUrl + "/" + path.basename(firstDir) + "/customer-portal-preview.html", { waitUntil: "networkidle" });
  await portalPage.waitForFunction(() => window.AircovePortal && window.AircovePortal.state);
  assert.equal(await portalPage.locator("#app").getAttribute("data-portal-auth-mode"), "fixture");
  assert.equal(await portalPage.locator('[data-module="app-shell"]').count(), 1);

  const publicPage = await browser.newPage({ viewport: { width: 1180, height: 900 } });
  collectErrors(publicPage, "public", failures);
  await publicPage.goto(baseUrl + "/" + path.basename(firstDir) + "/public-seo-preview.html", { waitUntil: "networkidle" });
  assert.equal(await publicPage.locator("#seo-public-root").count(), 1);
  assert.equal(await publicPage.locator("#app").count(), 0);
  assert.equal(await publicPage.locator("html").getAttribute("data-seo-enhanced"), "true");

  if (evidenceDir) {
    await fs.rm(evidenceDir, { recursive: true, force: true });
    await fs.mkdir(evidenceDir, { recursive: true });
    await portalPage.screenshot({ path: path.join(evidenceDir, "portal-preview-1180.png"), fullPage: true });
    await publicPage.screenshot({ path: path.join(evidenceDir, "public-seo-preview-1180.png"), fullPage: true });
  }

  const noJs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const noJsPage = await noJs.newPage();
  await noJsPage.goto(baseUrl + "/" + path.basename(firstDir) + "/public-seo-preview.html", { waitUntil: "load" });
  assert.equal(await noJsPage.locator("h1").count(), 1, "public H1 is available before JavaScript");
  assert.equal(await noJsPage.locator("details.seo-faq__item").count() > 0, true, "native FAQ is available before JavaScript");
  await noJs.close();
  assert.deepEqual(failures, [], failures.join("\n"));
  if (evidenceDir) {
    const proof = {
      schemaVersion: 1,
      uploadPerformed: false,
      verticals,
      profiles,
      exportRuns: 2,
      byteIdentical: true,
      transactionalFailurePreservation: "pass",
      transactionDebris: "none",
      hashes: dualHashes,
      browserBoot: { portal: "pass", publicSeo: "pass", publicSeoWithoutJavaScript: "pass" },
    };
    await fs.writeFile(path.join(evidenceDir, "contract-export-proof.json"), JSON.stringify(proof, null, 2) + "\n", "utf8");
  }
} finally {
  if (browser) await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
  await Promise.all([firstDir, secondDir].map((dir) => fs.rm(dir, { recursive: true, force: true })));
}

console.log("s6-cms-export-check ok: 8 verticals, 3 profiles, strict public schema, independent browser boot, and byte-identical dual export");

function datasetFromPortalHtml(html) {
  const section = html.match(/<section\s+[^>]*id="app"[^>]*>/s);
  assert.ok(section, "portal root section exists");
  const dataset = {};
  for (const match of section[0].matchAll(/data-portal-([a-z0-9-]+)="([^"]*)"/g)) {
    const key = "portal" + match[1].split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join("");
    dataset[key] = decodeHtml(match[2]);
  }
  return dataset;
}

function assertRootAttributes(html) {
  for (const name of ["api-base", "organization", "vertical", "profile", "theme", "default-mode", "router-mode", "default-route", "enabled-modules", "auth-mode", "error-mode", "data-mode", "pim-api-base", "pim-organization", "pim-fixture-url", "pim-product-type-code", "pim-currency"]) {
    assert.match(html, new RegExp(`data-portal-${name}="[^"]*"`), "portal root emits " + name);
  }
}

async function hashTree(directory) {
  const names = (await fs.readdir(directory)).sort();
  const result = {};
  for (const name of names) {
    const value = await fs.readFile(path.join(directory, name));
    result[name] = crypto.createHash("sha256").update(value).digest("hex");
  }
  return result;
}

async function transactionDebris(outputDir) {
  const base = "." + path.basename(outputDir);
  return (await fs.readdir(path.dirname(outputDir))).filter((name) => name.startsWith(base + ".staging-") || name.startsWith(base + ".backup-")).sort();
}

function collectErrors(page, label, failures) {
  page.on("pageerror", (error) => failures.push(label + " pageerror: " + error.message));
  page.on("console", (message) => { if (message.type() === "error") failures.push(label + " console error: " + message.text()); });
}

async function startServer(directory) {
  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url || "/", "http://127.0.0.1");
    const filePath = path.resolve(directory, "." + decodeURIComponent(url.pathname));
    if (!filePath.startsWith(directory + path.sep)) { response.writeHead(403); response.end("Forbidden"); return; }
    try {
      const body = await fs.readFile(filePath);
      response.writeHead(200, { "content-type": contentType(filePath) });
      response.end(body);
    } catch (_) { response.writeHead(404); response.end("Not found"); }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return { server };
}

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  return "application/octet-stream";
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function decodeHtml(value) {
  return value.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&gt;/g, ">").replace(/&lt;/g, "<").replace(/&amp;/g, "&");
}

async function generatorSchemaNegativeTests(directory) {
  const cases = [
    ["unknown top-level property", (payload) => { payload.legacy = true; }, /legacy is not allowed/],
    ["unknown nested property", (payload) => { payload.content.meta.legacyTitle = "old"; }, /content\.meta\.legacyTitle is not allowed/],
    ["unsupported vertical enum", (payload) => { payload.content.vertical.slug = "automotive"; }, /content\.vertical\.slug must be an allowed enum value/],
    ["invalid secondary action with null CTA", (payload) => { payload.content.ctas.secondary = null; payload.content.ctas.secondaryAction = "seo.cta.legacy"; }, /content\.ctas\.secondaryAction must be an allowed enum value/],
    ["missing required field", (payload) => { delete payload.content.meta.h1; }, /content\.meta\.h1 is required/],
    ["wrong declared type", (payload) => { payload.content.faq = {}; }, /content\.faq must be array/],
  ];
  for (const [label, mutate, pattern] of cases) {
    const payload = structuredClone(productionShape);
    mutate(payload);
    const inputPath = path.join(directory, label.replace(/[^a-z0-9]+/gi, "-") + ".json");
    await fs.writeFile(inputPath, JSON.stringify(payload), "utf8");
    await assert.rejects(() => generateSeoPublic({ inputPath, outputPath: path.join(directory, "rejected.html") }), pattern, label);
  }
  await assert.rejects(() => fs.access(path.join(directory, "rejected.html")), /ENOENT/, "schema rejection happens before production output is written");
  const weakenedTest = structuredClone(authoredTest);
  weakenedTest.content.meta.legacyTitle = "not allowed";
  const testInput = path.join(directory, "test-schema-rejection.json");
  await fs.writeFile(testInput, JSON.stringify(weakenedTest), "utf8");
  await assert.rejects(() => generateSeoPublicTest({ inputPath: testInput, outputPath: path.join(directory, "rejected-test.html") }), /content\.meta\.legacyTitle is not allowed/, "test classification adapts only classification and keeps production structure strict");
  await assert.rejects(() => fs.access(path.join(directory, "rejected-test.html")), /ENOENT/, "test schema rejection happens before output is written");

  const productionInput = path.join(directory, "production-valid.json");
  const productionOutput = path.join(directory, "production-valid.html");
  await fs.writeFile(productionInput, JSON.stringify(productionShape), "utf8");
  await generateSeoPublic({ inputPath: productionInput, outputPath: productionOutput });
  assert.doesNotMatch(await fs.readFile(productionOutput, "utf8"), /name="robots"[^>]*noindex/, "production public-authored output remains indexable");
}
