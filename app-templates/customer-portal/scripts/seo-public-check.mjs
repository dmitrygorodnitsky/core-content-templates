import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import { generateSeoPublic, generateSeoPublicTest } from "./generate-seo-public.mjs";

const portalRoot = path.resolve("app-templates/customer-portal");
const runtimeRoot = path.join(portalRoot, "runtime");
const authoredTestPath = path.join(portalRoot, "scripts/fixtures/seo-public-authored.test.json");
const referencePath = path.join(portalRoot, "public/seo-reference-preview.html");
globalThis.window = globalThis;

const requireFrom = process.env.PLAYWRIGHT_NODE_MODULES
  ? createRequire(path.join(process.env.PLAYWRIGHT_NODE_MODULES, "package.json"))
  : createRequire(import.meta.url);
const { chromium } = requireFrom("playwright");
const [{ F }, { SEO, SEO_FOOTER }, normalizer, components, runtimeManifest, scenarios] = await Promise.all([
  import(pathToFileURL(path.join(runtimeRoot, "data/fixtures.js"))),
  import(pathToFileURL(path.join(runtimeRoot, "data/seo-fixtures.js"))),
  import(pathToFileURL(path.join(runtimeRoot, "src/normalizers/seo.js"))),
  import(pathToFileURL(path.join(runtimeRoot, "src/components/seo/SeoSections.js"))),
  readJson(path.join(runtimeRoot, "manifest.json")),
  readJson(path.join(runtimeRoot, "data/scenarios.json")),
]);

const verticals = ["HVAC", "Snow Removal", "Lawn & Garden", "Pool & Spa", "Roofing", "Pest Control", "Health", "Beauty"];
const actions = ["seo.cta.book", "seo.cta.quote", "seo.cta.call", "seo.cta.services", "seo.service.select", "seo.faq.toggle"];
const sectionFactories = ["SeoHero", "SeoTrustStrip", "SeoServicesGrid", "SeoHowItWorks", "SeoProofBlock", "SeoPricing", "SeoServiceArea", "SeoReviews", "SeoFaq", "SeoFinalCta", "SeoFooter"];
const sectionSource = await fs.readFile(path.join(runtimeRoot, "src/components/seo/SeoSections.js"), "utf8");
const normalizerSource = await fs.readFile(path.join(runtimeRoot, "src/normalizers/seo.js"), "utf8");
const routeSource = await fs.readFile(path.join(runtimeRoot, "src/routes/SeoLandingPage.js"), "utf8");
const visualHarnessSource = await fs.readFile(path.join(portalRoot, "scripts/visual-acceptance.mjs"), "utf8");
for (const factory of sectionFactories) {
  assert.equal((sectionSource.match(new RegExp(`export function ${factory}\\b`, "g")) || []).length, 1, `${factory} has exactly one shared section implementation`);
}
assert.doesNotMatch(sectionSource, /function\s+(?:parity|reference)(?:Hero|Trust|Services|How|Proof|Pricing|Area|Reviews|Faq|Final|Footer)\b/i, "no second parity/reference section-function family");
assert.doesNotMatch(sectionSource, /renderParitySections|referenceVisual/, "shared renderer has no parallel parity composer or duplicate visual shape");
assert.doesNotMatch(normalizerSource, /referenceVisual/, "normalizer exposes one common SEO model instead of a duplicate visual model");
assert.doesNotMatch(routeSource, /data\/(?:fixtures|seo-fixtures)|SEO_FOOTER|\bF\b/, "SEO route consumes module/normalizer output only");
assert.doesNotMatch(visualHarnessSource, /page\.route\([^\n]*seo-fixtures|SEO\[.*\]\.meta\.h1\s*\+=/, "visual harness never intercepts or mutates immutable design SEO fixtures");
assert.deepEqual(Object.keys(SEO), verticals, "eight accepted reference fixture sets remain available only to parity/reference loading");
assert.deepEqual(components.SEO_COMPONENT_IDS, scenarios.seoContract.componentIds, "14 accepted component ids are inventoried");
assert.deepEqual(components.SEO_SECTION_ORDER, scenarios.seoContract.sectionOrder, "accepted section order is inventoried");
assert.deepEqual(runtimeManifest.actions.filter((action) => action.startsWith("seo.")), actions, "all SEO actions are registered");

for (const vertical of verticals) {
  const model = normalizer.normalizeSeoReference(SEO[vertical], F.themes[vertical], SEO_FOOTER, vertical, F.PAL);
  assert.equal(model.classification, "reference-only", `${vertical} fixture model is reference-only`);
  assert.equal(model.meta.canonicalUrl.startsWith("https://reference-seo.test/"), true, `${vertical} reference canonical is explicit .test`);
  const markup = components.renderSeoSections(model, { parity: true });
  assertSectionOrder(markup, components.SEO_SECTION_ORDER, `${vertical} parity section order`);
  for (const id of components.SEO_COMPONENT_IDS) assert.match(markup, new RegExp(`data-module=["']${id}["']`), `${vertical} parity renders ${id}`);
  for (const state of ["ready", "loading", "empty"]) assert.match(components.renderSeoSections(model, { parity: true, dataState: state }), new RegExp(`data-state=["']${state}["']`), `${vertical} parity renders ${state}`);
  for (const lifecycle of ["idle", "pending", "success", "error"]) assert.match(components.renderSeoSections(model, { parity: true, ctaStates: { [model.meta.primaryCta.action]: lifecycle } }), new RegExp(`data-state=["']${lifecycle}["']`), `${vertical} parity renders CTA ${lifecycle}`);
}
assert.match(JSON.stringify(SEO.Health), /in-home care|care team|secure documents/i, "Health reference content transferred");
assert.match(JSON.stringify(SEO.Beauty), /beauty|specialist|routine/i, "Beauty reference content transferred");

const dynamicModel = normalizer.normalizeSeoReference(SEO.HVAC, F.themes.HVAC, SEO_FOOTER, "HVAC", F.PAL);
assertDynamicSection("hero offer", (state) => components.SeoHero(dynamicModel, { parity: true, dataState: state }), [dynamicModel.hero.offer.text], /data-offer-state="loading"/, /data-offer-state="empty"/);
assertDynamicSection("trust", (state) => components.SeoTrustStrip(dynamicModel, { parity: true, dataState: state }), [dynamicModel.trust[0].value], /data-state="loading"/, /seo-trust__fallback/);
assertDynamicSection("pricing", (state) => components.SeoPricing(dynamicModel, { parity: true, dataState: state }), [dynamicModel.pricing.rows[0].name], /data-state="loading"/, /seo-price__fallback/);
assertDynamicSection("service area", (state) => components.SeoServiceArea(dynamicModel, { parity: true, dataState: state }), [dynamicModel.meta.serviceArea, dynamicModel.area.cities[0]], /data-state="loading"/, /seo-area__fallback/);
assertDynamicSection("reviews", (state) => components.SeoReviews(dynamicModel, { parity: true, dataState: state }), [dynamicModel.reviews[0].name, dynamicModel.reviews[0].text], /data-state="loading"/, /seo-reviews__fallback/);
assertDynamicSection("FAQ", (state) => components.SeoFaq(dynamicModel, { parity: true, dataState: state }), [dynamicModel.faq[0].q, dynamicModel.faq[0].a], /data-state="loading"/, /seo-faq__fallback/);

const authoredTest = await readJson(authoredTestPath);
const strictModel = normalizer.normalizeSeoPublicTest(authoredTest);
assert.equal(strictModel.mode, "public-test", "authored test payload uses strict public shape in explicit test mode");
assert.equal(strictModel.services[0].destination, "https://booking.seo-public.test/services/maintenance", "service destination is normalized and stable");
assert.equal(strictModel.services[1].destination, null, "missing service destination is unavailable before interaction");

for (const [label, mutate, pattern] of negativeCases()) {
  const payload = structuredClone(authoredTest);
  mutate(payload);
  assert.throws(() => normalizer.normalizeSeoPublicTest(payload), pattern, label);
}
const productionHostPayload = makeProductionPayload(authoredTest);
assert.doesNotThrow(() => normalizer.normalizeSeoPublic(productionHostPayload), "production mode accepts syntactically credible multi-label public DNS hosts");
for (const host of [
  "service.test", "service.example", "service.invalid", "service.localhost",
  "example.com", "www.example.net", "api.example.org", "service.onion",
  "localhost", "api.localhost", "intranet",
  "127.0.0.1", "8.8.8.8", "[::1]", "[2001:4860:4860::8888]",
  "service.local", "service.internal", "service.lan", "service.localdomain", "service.home.arpa",
]) {
  const payload = structuredClone(productionHostPayload);
  const origin = `https://${host}`;
  payload.deployment.canonicalOrigin = origin;
  payload.deployment.allowedOrigins = [origin];
  assert.throws(() => normalizer.normalizeSeoPublic(payload), /public DNS hostname|credible public DNS hostname/, `production mode rejects non-public host ${host}`);
}
assert.doesNotThrow(() => normalizer.normalizeSeoPublicTest(authoredTest), "explicit authored test mode permits allowlisted .test origins");
await assert.rejects(generateSeoPublic({}), /requires inputPath/, "strict generator has no default input");
await assert.rejects(generateSeoPublic({ inputPath: authoredTestPath }), /requires outputPath/, "strict generator has no default output");

const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "seo-public-s3-"));
const strictOutput = path.join(tempRoot, "seo-public-authored-test.html");
const first = await generateSeoPublicTest({ inputPath: authoredTestPath, outputPath: strictOutput });
const firstHtml = await fs.readFile(strictOutput, "utf8");
await generateSeoPublicTest({ inputPath: authoredTestPath, outputPath: strictOutput });
const strictHtml = await fs.readFile(strictOutput, "utf8");
assert.equal(strictHtml, firstHtml, "strict authored generation is deterministic");
assert.equal(first.model.meta.canonicalUrl, "https://seo-public.test/hvac/austin-test-district", "canonical merge tag resolves exactly");
assert.match(strictHtml, /data-content-classification="public-authored-test"/, "strict test document is explicitly classified");
assert.match(strictHtml, /<meta name="robots" content="noindex,nofollow">/, "strict authored test document is noindex");
assert.doesNotMatch(strictHtml, /reference-seo|flow\.(?:booking|quote)|\.example\b|data-dev-toolbar|seo-meta-preview|from CMS|AppShell|location\.hash|setCtaState|setDataState/, "strict document excludes reference fixtures, misleading origins, portal dependencies, and synthetic state tooling");
assert.match(strictHtml, /<title>[^<]{10,}<\/title>/, "strict raw HTML has title");
assert.match(strictHtml, /<meta name="description" content="[^"]{40,}">/, "strict raw HTML has description");
assert.match(strictHtml, /<link rel="canonical" href="https:\/\/seo-public\.test\/hvac\/austin-test-district">/, "strict raw HTML has validated canonical");
assert.equal((strictHtml.match(/<h1\b/g) || []).length, 1, "strict raw HTML has exactly one H1");
assert.equal(strictHtml.indexOf('data-module="seo-public-header"') < strictHtml.indexOf('data-module="seo-hero"'), true, "authored brand header is first-viewport content before sections");
assertSectionOrder(strictHtml, components.SEO_SECTION_ORDER, "strict public section order");
assert.match(strictHtml, /seo-hero seo-hero--no-media/, "no-media hero has explicit modifier");
assert.match(strictHtml, /seo-hero__inner seo-hero__inner--no-media/, "no-media hero inner grid has explicit modifier");

const jsonLd = JSON.parse(extractJsonLd(strictHtml));
const structuredFaq = jsonLd.mainEntity.map((item) => ({ q: item.name, a: item.acceptedAnswer.text }));
assert.deepEqual(structuredFaq, strictModel.faq.map(({ q, a }) => ({ q, a })), "FAQ JSON-LD exactly matches normalized authored FAQs");
for (const faq of strictModel.faq) {
  assert.equal(strictHtml.includes(escapeHtml(faq.q)), true, `raw HTML exposes FAQ question ${faq.id}`);
  assert.equal(strictHtml.includes(escapeHtml(faq.a)), true, `raw HTML exposes FAQ answer ${faq.id}`);
}

const productionInput = path.join(tempRoot, "seo-public-production.json");
const productionOutput = path.join(tempRoot, "seo-public-production.html");
await fs.writeFile(productionInput, JSON.stringify(productionHostPayload), "utf8");
await generateSeoPublic({ inputPath: productionInput, outputPath: productionOutput });
const productionHtml = await fs.readFile(productionOutput, "utf8");
assert.doesNotMatch(productionHtml, /<meta name="robots" content="noindex,nofollow">/, "strict production document remains indexable");
assert.match(productionHtml, /data-content-classification="public-authored"/, "strict production document retains production classification");

const referenceBefore = await fs.readFile(referencePath, "utf8");
await import(pathToFileURL(path.join(portalRoot, "scripts/generate-seo-reference-preview.mjs")) + `?check=${Date.now()}`);
const referenceHtml = await fs.readFile(referencePath, "utf8");
assert.equal(referenceHtml, referenceBefore, "checked reference preview generation is deterministic");
assert.match(referenceHtml, /data-content-(?:classification|authority)="reference-only"/, "checked preview is reference-only in HTML");
assert.match(referenceHtml, /<meta name="robots" content="noindex,nofollow">/, "checked reference preview is noindex");
assert.match(referenceHtml, /Reference fixture preview - not production content or CMS truth/, "checked reference preview has visible warning");

const { server, url } = await startServer(strictOutput);
const launchOptions = { headless: true };
if (process.env.PLAYWRIGHT_EXECUTABLE_PATH) launchOptions.executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH;
const browser = await chromium.launch(launchOptions);
const failures = [];
try {
  const noJs = await browser.newPage({ javaScriptEnabled: false, viewport: { width: 390, height: 900 } });
  noJs.on("requestfailed", (request) => failures.push(`no-js request failed: ${request.url()}`));
  await noJs.goto(`${url}/__strict.html`, { waitUntil: "networkidle" });
  assert.equal(await noJs.locator("h1").count(), 1, "no-JS browser sees one authored H1");
  assert.equal(await noJs.locator('[data-module="seo-public-header"] .seo-public-header__brand').innerText(), authoredTest.content.brand.name, "no-JS browser sees authored brand");
  assert.equal(await noJs.locator('[data-module="seo-faq"] details').count(), strictModel.faq.length, "no-JS browser sees every native FAQ disclosure");
  const secondDetails = noJs.locator('[data-module="seo-faq"] details').nth(1);
  assert.equal(await secondDetails.getAttribute("open"), null, "second no-JS FAQ starts closed");
  await secondDetails.locator("summary").click();
  assert.equal(await secondDetails.getAttribute("open"), "", "native FAQ opens without JavaScript");
  assert.match(await secondDetails.innerText(), /disabled before interaction/, "opened no-JS FAQ answer is readable");
  assert.equal(await noJs.locator('[data-action="seo.service.select"][data-id="maintenance-test"]').getAttribute("href"), "https://booking.seo-public.test/services/maintenance", "available service is an authored link");
  assert.equal(await noJs.locator('button[data-action="seo.service.select"][data-id="repair-test"]').isDisabled(), true, "unavailable service is disabled before interaction");
  assert.equal(await noJs.locator('a[data-action="seo.cta.book"]').first().getAttribute("href"), "https://booking.seo-public.test/book", "authored book CTA is a real link");
  assert.equal(await noJs.locator('a[data-action="seo.cta.call"]').first().getAttribute("href"), "tel:+15125550199", "authored call CTA is a real link");
  await noJs.close();

  const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });
  page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") failures.push(`console error: ${message.text()}`); });
  page.on("requestfailed", (request) => failures.push(`request failed: ${request.url()}`));
  await page.goto(`${url}/__strict.html`, { waitUntil: "networkidle" });
  await page.waitForSelector('html[data-seo-enhanced="true"]');
  assert.equal(await page.evaluate(() => Object.prototype.hasOwnProperty.call(window, "AircoveSeo")), false, "public runtime exposes no synthetic SEO state API");
  const dimensions = await page.locator(".seo-hero__inner--no-media").evaluate((inner) => {
    const copy = inner.querySelector(".seo-hero__copy");
    return { columns: getComputedStyle(inner).gridTemplateColumns.split(" ").filter(Boolean).length, inner: inner.getBoundingClientRect().width, copy: copy.getBoundingClientRect().width };
  });
  assert.equal(dimensions.columns, 1, "no-media hero uses one grid column");
  assert.equal(dimensions.copy >= 700 && dimensions.copy <= dimensions.inner, true, "no-media hero uses the authored-copy column without a reserved media track");
  const enhancedDetails = page.locator('[data-module="seo-faq"] details').nth(1);
  await enhancedDetails.locator("summary").click();
  await page.waitForFunction(() => { const node = document.querySelectorAll('[data-module="seo-faq"] details')[1]; return node && node.open && node.classList.contains("is-open"); });
  assert.equal(await enhancedDetails.evaluate((node) => node.open && node.classList.contains("is-open")), true, "enhanced native FAQ preserves disclosure semantics");
  await page.locator('[data-action="seo.cta.services"]').click();
  assert.equal(await page.evaluate(() => location.hash), "#seo-services", "public services CTA uses native local anchor navigation");
  await page.close();

  const portal = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  portal.on("pageerror", (error) => failures.push(`portal pageerror: ${error.message}`));
  portal.on("console", (message) => { if (message.type() === "error") failures.push(`portal console error: ${message.text()}`); });
  await portal.goto(`${url}/runtime/source.html`, { waitUntil: "networkidle" });
  await portal.waitForFunction(() => window.AircovePortal);
  for (const vertical of verticals) {
    await portal.evaluate(({ name, theme }) => { window.AircovePortal.state.theme = name; window.AircovePortal.state.config.theme = theme; window.AircovePortal.state.view = "ready"; window.AircovePortal.go("seo.landing"); }, { name: vertical, theme: F.themes[vertical].slug });
    await portal.waitForSelector('[data-route="seo.landing"] [data-module="seo-hero"]');
    const hookIds = await portal.locator('[data-route="seo.landing"] [data-module^="seo-"]').evaluateAll((nodes) => [...new Set(nodes.map((node) => node.dataset.module))]);
    for (const id of components.SEO_COMPONENT_IDS) assert.equal(hookIds.includes(id), true, `${vertical} parity route renders ${id}`);
    if (vertical === "Snow Removal") {
      await portal.locator('[data-action="seo.cta.services"]').first().click();
      assert.equal(await portal.evaluate(() => window.AircovePortal.state.route), "seo.landing", "portal services action remains local under hash routing");
    }
  }
  assert.match(await portal.locator('[data-route="seo.landing"]').innerText(), /beauty|specialist|routine/i, "Beauty parity content renders");
  await portal.close();
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  await fs.rm(tempRoot, { recursive: true, force: true });
}
assert.deepEqual(failures, [], failures.join("\n"));
console.log("SEO public check passed: strict authored fail-closed generation, reference isolation, native FAQ, truthful services, URL policy, 8 parity verticals, and 14 hooks");

function negativeCases() {
  return [
    ["missing brand name", (p) => { delete p.content.brand.name; }, /content\.brand\.name is required/],
    ["missing brand URL declaration", (p) => { delete p.content.brand.url; }, /content\.brand\.url is required/],
    ["missing title", (p) => { delete p.content.meta.title; }, /content\.meta\.title is required/],
    ["empty description", (p) => { p.content.meta.description = ""; }, /content\.meta\.description must be a nonempty string/],
    ["missing H1", (p) => { delete p.content.meta.h1; }, /content\.meta\.h1 is required/],
    ["missing locality", (p) => { delete p.content.meta.locality; }, /content\.meta\.locality is required/],
    ["empty service area", (p) => { p.content.meta.serviceArea = ""; }, /content\.meta\.serviceArea must be a nonempty string/],
    ["missing canonical", (p) => { delete p.content.meta.canonical; }, /content\.meta\.canonical is required/],
    ["missing hero service", (p) => { delete p.content.hero.service; }, /content\.hero\.service is required/],
    ["missing hero media declaration", (p) => { delete p.content.hero.media; }, /content\.hero\.media is required/],
    ["missing primary CTA destination", (p) => { delete p.content.ctas.primary.destination; }, /content\.ctas\.primary\.destination is required/],
    ["missing service destination declaration", (p) => { delete p.content.services[0].destination; }, /content\.services\[0\]\.destination is required/],
    ["unknown merge tag", (p) => { p.content.meta.title = "Service in {unknown}"; }, /unknown merge tag/],
    ["malformed merge tag", (p) => { p.content.meta.title = "Service in {locality"; }, /unresolved or malformed merge tag/],
    ["relative canonical", (p) => { p.content.meta.canonical = "/relative"; }, /absolute HTTPS URL/],
    ["HTTP canonical", (p) => { p.content.meta.canonical = "http://seo-public.test/path"; }, /must use HTTPS/],
    ["credential canonical", (p) => { p.content.meta.canonical = "https://user:pass@seo-public.test/path"; }, /must not contain credentials/],
    ["canonical query", (p) => { p.content.meta.canonical += "?campaign=x"; }, /query is not permitted/],
    ["canonical fragment", (p) => { p.content.meta.canonical += "#section"; }, /must not contain a fragment/],
    ["canonical host mismatch", (p) => { p.content.meta.canonical = "https://booking.seo-public.test/path"; }, /must match deployment\.canonicalOrigin/],
    ["CTA unapproved origin", (p) => { p.content.ctas.primary.destination = "https://unapproved.test/book"; }, /origin is not deployment-approved/],
    ["CTA credentials", (p) => { p.content.ctas.primary.destination = "https://user:pass@booking.seo-public.test/book"; }, /must not contain credentials/],
    ["CTA HTTP", (p) => { p.content.ctas.primary.destination = "http://booking.seo-public.test/book"; }, /must use HTTPS/],
    ["invalid telephone", (p) => { p.content.ctas.call.destination = "tel:555"; }, /international tel/],
    ["service unapproved destination", (p) => { p.content.services[0].destination = "https://unapproved.test/service"; }, /origin is not deployment-approved/],
    ["media credentials", (p) => { p.content.hero.media = { url: "https://user:pass@seo-public.test/image.jpg", alt: "Test" }; }, /must not contain credentials/],
    ["legal unapproved origin", (p) => { p.content.footer.legal[0].url = "https://unapproved.test/privacy"; }, /origin is not deployment-approved/],
    ["services required", (p) => { p.content.services = []; }, /content\.services must contain at least 1/],
    ["how required", (p) => { p.content.how = []; }, /content\.how must contain at least 1/],
    ["proof required", (p) => { p.content.proof.items = []; }, /content\.proof\.items must contain at least 1/],
    ["area cities required", (p) => { p.content.area.cities = []; }, /content\.area\.cities must contain at least 1/],
    ["FAQ required", (p) => { p.content.faq = []; }, /content\.faq must contain at least 1/],
    ["trust declaration required", (p) => { delete p.content.trust; }, /content\.trust is required/],
    ["reviews declaration required", (p) => { delete p.content.reviews; }, /content\.reviews is required/],
    ["pricing rows declaration required", (p) => { delete p.content.pricing.rows; }, /content\.pricing\.rows is required/],
    ["final body declaration required", (p) => { delete p.content.final.body; }, /content\.final\.body is required/],
    ["footer legal declaration required", (p) => { delete p.content.footer.legal; }, /content\.footer\.legal is required/],
  ];
}

function assertDynamicSection(label, render, readyNeedles, loadingMarker, emptyMarker) {
  const ready = render("ready");
  const loading = render("loading");
  const empty = render("empty");
  for (const needle of readyNeedles) {
    assert.equal(ready.includes(escapeHtml(needle)), true, `${label} ready state contains authored content`);
    assert.equal(loading.includes(escapeHtml(needle)), false, `${label} loading state omits ready content`);
    assert.equal(empty.includes(escapeHtml(needle)), false, `${label} empty state omits ready content`);
  }
  assert.match(loading, loadingMarker, `${label} loading state is explicit`);
  assert.match(loading, /seo-skel/, `${label} loading state renders a skeleton`);
  assert.match(empty, emptyMarker, `${label} empty state renders an explicit fallback or state`);
}

function makeProductionPayload(testPayload) {
  const payload = JSON.parse(JSON.stringify(testPayload).replaceAll("seo-public.test", "seo-public.com"));
  payload.classification = "public-authored";
  return payload;
}

async function readJson(file) { return JSON.parse(await fs.readFile(file, "utf8")); }
function assertSectionOrder(markup, ids, label) { let previous = -1; for (const id of ids) { const index = markup.indexOf(`data-module="${id}"`); assert.equal(index > previous, true, `${label}: ${id}`); previous = index; } }
function extractJsonLd(html) { const match = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/); assert.ok(match, "FAQ JSON-LD exists"); return match[1]; }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]); }
function contentType(file) { if (file.endsWith(".html")) return "text/html; charset=utf-8"; if (file.endsWith(".js") || file.endsWith(".mjs")) return "text/javascript; charset=utf-8"; if (file.endsWith(".css")) return "text/css; charset=utf-8"; if (file.endsWith(".json")) return "application/json; charset=utf-8"; return "application/octet-stream"; }
async function startServer(strictOutput) {
  const server = http.createServer(async (req, res) => {
    const pathname = new URL(req.url || "/", "http://127.0.0.1").pathname;
    if (pathname === "/__strict.html") { const body = await fs.readFile(strictOutput); res.writeHead(200, { "content-type": "text/html; charset=utf-8" }); res.end(body); return; }
    const file = path.resolve(portalRoot, `.${decodeURIComponent(pathname)}`);
    if (!file.startsWith(portalRoot)) { res.writeHead(403); res.end("Forbidden"); return; }
    try { const body = await fs.readFile(file); res.writeHead(200, { "content-type": contentType(file) }); res.end(body); }
    catch (_) { res.writeHead(404); res.end("Not found"); }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return { server, url: `http://127.0.0.1:${server.address().port}` };
}
