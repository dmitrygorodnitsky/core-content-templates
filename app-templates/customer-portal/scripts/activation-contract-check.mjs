import assert from "node:assert/strict";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { generateSeoPublicTest } from "./generate-seo-public.mjs";
import { CARE_SURFACE_CLOSED_IDS, HEALTH_CONTROL_SET, HEALTH_SENSITIVE_IDS } from "../runtime/src/activation-policy.js";

const portalRoot = path.resolve("app-templates/customer-portal");
const runtimeRoot = path.join(portalRoot, "runtime");
const inventoryPath = path.join(runtimeRoot, "data/activation-contracts.json");
const outputArgument = process.argv.find((value) => value.startsWith("--output-dir="));
const evidenceOutput = outputArgument ? path.resolve(outputArgument.slice("--output-dir=".length)) : null;
const requireFrom = process.env.PLAYWRIGHT_NODE_MODULES
  ? createRequire(path.join(process.env.PLAYWRIGHT_NODE_MODULES, "package.json"))
  : createRequire(import.meta.url);
const { chromium } = requireFrom("playwright");

const inventory = await readJson(inventoryPath);
const inventorySchema = await readJson(path.join(runtimeRoot, "data/activation-contracts.schema.json"));
const jsonSchemaValidation = validateWithAvailableJsonSchema(inventorySchema, inventory);
const manifest = await readJson(path.join(runtimeRoot, "manifest.json"));
const scenarios = await readJson(path.join(runtimeRoot, "data/scenarios.json"));
const actionsSource = await fs.readFile(path.join(runtimeRoot, "src/actions.js"), "utf8");
const modulesSource = await fs.readFile(path.join(runtimeRoot, "src/modules/index.js"), "utf8");
const seoModuleSource = await fs.readFile(path.join(runtimeRoot, "src/modules/seo.js"), "utf8");
const publicSource = await fs.readFile(path.join(portalRoot, "public/src/seo-public.js"), "utf8");
const careAdapterSource = await fs.readFile(path.join(runtimeRoot, "src/adapters/care-fixture-adapter.js"), "utf8");

const careActions = scenarios.activationContract.acceptedCareActions;
const seoActions = scenarios.activationContract.acceptedSeoActions;
const acceptedActions = [...careActions, ...seoActions].sort();
const acceptedDataSources = scenarios.activationContract.acceptedDataSources.slice().sort();
const dispositions = new Set(inventory.allowedDispositions);
const allEntries = [...inventory.dataSources, ...inventory.actions];
const allInventoryEntries = [...allEntries, ...inventory.surfaceControls];

assert.equal(inventory.version, 1, "activation inventory schema version");
assert.deepEqual([...dispositions], ["local", "fixture", "opened_live", "unavailable", "not_opened"], "only accepted S5 dispositions exist");
assert.equal(new Set(allInventoryEntries.map((entry) => entry.id)).size, allInventoryEntries.length, "every inventory id appears exactly once across data, action, and surface rows");
assert.deepEqual(inventory.dataSources.map((entry) => entry.id).sort(), acceptedDataSources, "accepted data sources have an exact inventory bijection");
assert.deepEqual(inventory.actions.map((entry) => entry.id).sort(), acceptedActions, "accepted actions have an exact inventory bijection");
validateCodeOwnedPolicy(inventory);
runInventoryMutationTests(inventory);

const runtimeActionIds = [...actionsSource.matchAll(/^\s*"((?:care|seo)\.[^"]+)"\s*:/gm)].map((match) => match[1]).sort();
assert.deepEqual(runtimeActionIds, acceptedActions, "runtime action registry exactly matches accepted Care/SEO actions");
assert.deepEqual(manifest.actions.filter((id) => /^(?:care|seo)\./.test(id)).sort(), acceptedActions, "manifest action registry matches inventory");
assert.deepEqual(manifest.activationContract.careActions.slice().sort(), careActions.slice().sort(), "manifest Care activation registry");
assert.deepEqual(manifest.activationContract.seoActions.slice().sort(), seoActions.slice().sort(), "manifest SEO activation registry");
assert.deepEqual(manifest.activationContract.dataSources.slice().sort(), acceptedDataSources, "manifest data-source registry");
assert.deepEqual(extractArray(modulesSource, "dataSources"), ["care.fixture", "care.live"], "Care module owns both declared data-source dispositions");
assert.deepEqual(extractArray(seoModuleSource, "dataSources"), ["seo.reference", "seo.publicAuthored"], "SEO module owns both declared data-source dispositions");
assert.deepEqual(extractArray(modulesSource, "commands").sort(), careActions.slice().sort(), "Care module command registry matches inventory");
assert.deepEqual(extractArray(seoModuleSource, "actions").sort(), seoActions.slice().sort(), "SEO module action registry matches inventory");

for (const entry of allEntries) {
  for (const field of ["id", "kind", "owner", "surfaces", "fixtureShape", "normalizer", "endpoint", "auth", "healthSecurity", "concurrency", "successReadback", "errorFallback", "disposition", "networkPolicy", "trace"]) {
    assert.equal(Object.prototype.hasOwnProperty.call(entry, field), true, `${entry.id} declares ${field}`);
  }
  assert.equal(dispositions.has(entry.disposition), true, `${entry.id} has an accepted disposition`);
  assert.equal(Array.isArray(entry.trace) && entry.trace.length > 0, true, `${entry.id} has source/effect trace evidence`);
  assert.equal(Array.isArray(entry.auth) && entry.auth.length > 0, true, `${entry.id} declares auth requirements or explicit absence`);
  if (entry.disposition === "opened_live") {
    assert.equal(entry.endpoint.status, "repository-proven", `${entry.id} opened_live endpoint is explicitly repository-proven`);
    assert.notEqual(entry.endpoint.url, null, `${entry.id} opened_live has a proven endpoint`);
    assert.doesNotMatch(entry.endpoint.evidence, /absent|none|search/i, `${entry.id} opened_live has concrete endpoint evidence`);
    assert.doesNotMatch(entry.auth.join(" "), /unknown|absent/i, `${entry.id} opened_live has concrete auth/permission evidence`);
    assert.doesNotMatch(entry.successReadback, /^(?:absent|none)$/i, `${entry.id} opened_live has authoritative readback`);
    assert.notEqual(entry.networkPolicy, "none", `${entry.id} opened_live declares transport policy`);
  }
  if (["unavailable", "not_opened"].includes(entry.disposition)) {
    assert.equal(entry.networkPolicy, "none", `${entry.id} closed disposition cannot issue network`);
    assert.match(entry.successReadback, /^(?:none|absent)$/i, `${entry.id} closed disposition cannot claim success`);
  }
  if (entry.healthSecurity.sensitive) {
    const required = inventory.healthControlSet;
    assert.deepEqual(entry.healthSecurity.required.slice().sort(), required.slice().sort(), `${entry.id} sensitive path declares all five Health controls`);
    if (entry.healthSecurity.missing.length) assert.equal(["unavailable", "not_opened"].includes(entry.disposition), true, `${entry.id} remains closed while Health controls are missing`);
  }
}

assert.deepEqual(allEntries.filter((entry) => entry.disposition === "opened_live"), [], "S5 opens no unproven live Care/SEO path");
assert.deepEqual(inventory.dataSources.filter((entry) => entry.disposition === "not_opened").map((entry) => entry.id), ["care.live"], "Care live source is explicitly not_opened");
assert.doesNotMatch(actionsSource, /fetch\s*\(|XMLHttpRequest|axios\b/, "Care/SEO action owner has no hidden network transport");
assert.doesNotMatch(modulesSource, /care[^\n]*(?:fetch\s*\(|https?:\/\/|\/api\/)/i, "Care module has no invented endpoint");
assert.doesNotMatch(seoModuleSource, /fetch\s*\(|XMLHttpRequest|axios\b/, "SEO parity module has no network transport");
assert.doesNotMatch(publicSource, /AircovePortal|ACTIONS|setCtaState|fetch\s*\(|XMLHttpRequest|axios\b/, "public SEO has no portal command bus, synthetic success, or hidden network");
assert.match(careAdapterSource, /await import\(["']\.\.\/\.\.\/data\/care-fixtures\.js["']\)/, "Care fixture remains protected async input");
assert.doesNotMatch(careAdapterSource, /fetch\s*\(|https?:\/\//, "Care fixture adapter has no live transport");
assert.match(actionsSource, /downloadCareDocument[\s\S]*?runUnavailableCareCommand\("care\.download"/, "Care download is hard-closed independently of fixture fields");
assert.doesNotMatch(actionsSource, /link\.click\(\)|document\.createElement\("a"\)/, "closed Care actions cannot synthesize a download/navigation success");

const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "customer-portal-s5-"));
const strictOutput = path.join(tempRoot, "seo-public-authored-test.html");
const quoteInput = path.join(tempRoot, "seo-public-quote-test.json");
const quoteOutput = path.join(tempRoot, "seo-public-quote-test.html");
const authoredPayload = await readJson(path.join(portalRoot, "scripts/fixtures/seo-public-authored.test.json"));
await generateSeoPublicTest({
  inputPath: path.join(portalRoot, "scripts/fixtures/seo-public-authored.test.json"),
  outputPath: strictOutput,
});
authoredPayload.content.ctas.primaryAction = "seo.cta.quote";
authoredPayload.content.ctas.primary.label = "Request test quote";
await fs.writeFile(quoteInput, JSON.stringify(authoredPayload), "utf8");
await generateSeoPublicTest({ inputPath: quoteInput, outputPath: quoteOutput });

const { server, requests, url } = await startServer(strictOutput, quoteOutput);
const launchOptions = { headless: true };
if (process.env.PLAYWRIGHT_EXECUTABLE_PATH) launchOptions.executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH;
const browser = await chromium.launch(launchOptions);
const failures = [];
const coverage = { care: {}, seoParity: {}, seoPublic: {} };

try {
  const portal = await browser.newPage({ viewport: { width: 1180, height: 900 } });
  portal.on("pageerror", (error) => failures.push(`portal pageerror: ${error.message}`));
  portal.on("console", (message) => { if (message.type() === "error") failures.push(`portal console: ${message.text()}`); });
  await portal.goto(`${url}/runtime/source.html#/care`, { waitUntil: "networkidle" });
  await portal.waitForFunction(() => window.AircovePortal && window.AircovePortal.runtime());
  await portal.waitForSelector('[data-route="care"][data-state="ready"]');

  if (evidenceOutput) await captureActivationEvidence(portal, evidenceOutput);
  await exerciseAllCareControls(portal, requests, coverage.care);
  await exerciseSeoParity(portal, requests, coverage.seoParity);
  await portal.close();

  const publicPage = await browser.newPage({ viewport: { width: 1180, height: 900 } });
  publicPage.on("pageerror", (error) => failures.push(`public pageerror: ${error.message}`));
  publicPage.on("console", (message) => { if (message.type() === "error") failures.push(`public console: ${message.text()}`); });
  await publicPage.goto(`${url}/__strict.html`, { waitUntil: "networkidle" });
  await exerciseSeoPublic(publicPage, requests, coverage.seoPublic);
  await publicPage.close();

  const quotePage = await browser.newPage({ viewport: { width: 1180, height: 900 } });
  quotePage.on("pageerror", (error) => failures.push(`quote pageerror: ${error.message}`));
  await quotePage.goto(`${url}/__quote.html`, { waitUntil: "networkidle" });
  await exerciseSeoPublic(quotePage, requests, coverage.seoPublic);
  await quotePage.close();
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  await fs.rm(tempRoot, { recursive: true, force: true });
}

assert.deepEqual(failures, [], failures.join("\n"));
assert.deepEqual(Object.keys(coverage.care).sort(), [...new Set(inventory.surfaceControls.map((entry) => entry.action))].sort(), "browser/source checks cover every visible Care-surface action regardless of prefix");
assert.deepEqual(Object.keys(coverage.seoParity).sort(), seoActions.slice().sort(), "parity browser checks cover every SEO action");
assert.deepEqual(Object.keys(coverage.seoPublic).sort(), seoActions.slice().sort(), "public browser/source checks cover every SEO action");

const dispositionCounts = Object.fromEntries([...dispositions].map((name) => [name, allEntries.filter((entry) => entry.disposition === name).length]));
console.log(`activation-contract-check ok: ${inventory.dataSources.length} sources, ${inventory.actions.length} actions, dispositions ${JSON.stringify(dispositionCounts)}, opened_live 0, Care/SEO controls clicked/traced`);
console.log(`activation-schema-validator: ${jsonSchemaValidation}`);
console.log(`activation-control-coverage: ${JSON.stringify({ care: sortObject(coverage.care), seoParity: sortObject(coverage.seoParity), seoPublic: sortObject(coverage.seoPublic) })}`);

async function captureActivationEvidence(page, outputRoot) {
  await fs.mkdir(outputRoot, { recursive: true });
  const captures = [];
  for (const [vertical, slug] of [["HVAC", "hvac"], ["Lawn & Garden", "lawn"], ["Pool & Spa", "pool"], ["Health", "health"], ["Beauty", "beauty"]]) {
    await showVertical(page, vertical, "care");
    await page.addStyleTag({ content: "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}" });
    await page.evaluate(async () => { await document.fonts.ready; window.scrollTo(0, 0); });
    const fileName = `care-${slug}-unavailable-1180.png`;
    const filePath = path.join(outputRoot, fileName);
    const image = await page.screenshot({ fullPage: true, type: "png" });
    await fs.writeFile(filePath, image);
    const controls = await page.locator('[data-route="care"] [data-action]').evaluateAll((nodes) => nodes.map((node) => ({ action: node.dataset.action, entity: node.dataset.id || "_", state: node.dataset.state || null, disabled: node.hasAttribute("disabled") || node.getAttribute("aria-disabled") === "true" })));
    captures.push({ vertical, width: 1180, file: fileName, sha256: crypto.createHash("sha256").update(image).digest("hex"), controls });
  }
  await fs.writeFile(path.join(outputRoot, "activation-visual-metrics.json"), JSON.stringify({ schemaVersion: 1, stage: "S5 remediation cycle 1", captures }, null, 2) + "\n");
}

async function exerciseAllCareControls(page, requests, result) {
  const observed = await collectCareSurfaceControls(page);
  validateSurfaceDomBijection(inventory.surfaceControls, observed);
  runSurfaceInventoryMutationTests(inventory.surfaceControls, observed);
  for (const item of observed) {
    const row = inventory.surfaceControls.find((candidate) => candidate.surface === item.surface && candidate.action === item.action && candidate.entities.includes(item.entity));
    item.id = row.id;
    item.disposition = row.disposition;
  }

  for (const item of observed) {
    await showVertical(page, item.vertical, "care");
    const control = page.locator('[data-route="care"] [data-action]').nth(item.domIndex);
    const current = await control.evaluate((node) => ({ action: node.dataset.action, entity: node.dataset.id || "_" }));
    assert.deepEqual(current, { action: item.action, entity: item.entity }, `${item.surface} control ordinal remains stable`);
    result[item.action] = (result[item.action] || 0) + 1;
    const beforeRequests = requests.length;

    if (item.disposition === "unavailable") {
      const before = await careSurfaceState(page);
      await control.dispatchEvent("click");
      assert.deepEqual(await careSurfaceState(page), before, `${item.id} is visibly unavailable and inert before effort`);
    } else if (item.action === "care.selectUnit") {
      await control.click();
      assert.equal(await page.evaluate(() => window.AircovePortal.state.careSelectedUnitId), item.entity, `${item.id} unit readback`);
      assert.equal(await page.locator(`[data-action="care.selectUnit"][data-id="${item.entity}"]`).getAttribute("data-state"), "active", `${item.id} active DOM readback`);
    } else if (item.action === "care.selectSpecialist") {
      await control.click();
      assert.equal(await page.evaluate(() => window.AircovePortal.state.careSelectedSpecialistId), item.entity, `${item.id} specialist readback`);
    } else if (item.action === "care.completeTask") {
      const before = await control.getAttribute("aria-pressed");
      await control.click();
      assert.notEqual(await page.locator(`[data-action="care.completeTask"][data-id="${item.entity}"]`).getAttribute("aria-pressed"), before, `${item.id} task readback`);
    } else if (item.action === "care.requestRetreat") {
      await exerciseRetreatControl(page, control);
    } else if (item.action === "order.open") {
      await control.click();
      await page.waitForSelector('[data-route="order.detail"]');
      assert.deepEqual(await page.evaluate(() => ({ route: window.AircovePortal.state.route, id: window.AircovePortal.state.currentOrderId })), { route: "order.detail", id: item.entity }, `${item.id} opens the exact fixture order`);
    } else if (item.action === "profile.managePlan") {
      await control.click();
      await page.waitForSelector('[data-route="pricing"]');
      assert.equal(await page.evaluate(() => window.AircovePortal.state.route), "pricing", `${item.id} opens pricing`);
    } else if (item.action === "cart.addItem") {
      const before = await page.evaluate((name) => window.AircovePortal.state.cartItems.find((entry) => entry.name === name)?.qty || 0, item.entity);
      await control.click();
      assert.equal(await page.evaluate((name) => window.AircovePortal.state.cartItems.find((entry) => entry.name === name)?.qty || 0, item.entity), before + 1, `${item.id} has cart entity readback`);
    } else {
      assert.fail(`${JSON.stringify(item)} has no truth-effect assertion`);
    }
    assert.equal(requests.length, beforeRequests, `${item.id} emits no command network request`);
  }

  await showVertical(page, "HVAC", "care");
  const injected = await page.evaluate(async () => {
    const [{ normalizeCare }, { careFixtures }, { F }, { DocRow }] = await Promise.all([
      import("/runtime/src/normalizers/care.js"),
      import("/runtime/data/care-fixtures.js"),
      import("/runtime/data/fixtures.js"),
      import("/runtime/src/components/care/shared.js"),
    ]);
    const fixture = structuredClone(careFixtures.HVAC);
    fixture.docs[0].url = "https://malformed.invalid/fake-success.pdf";
    fixture.docs[0].href = "javascript:alert(1)";
    fixture.docs[0].downloadUrl = "/api/fake-download";
    fixture.docs[0].filename = "fake.pdf";
    const normalized = normalizeCare({ vertical: "hvac", state: "ready", fixture, products: F.themes.HVAC.products });
    const row = DocRow(normalized.content.docs[0]);
    return {
      document: normalized.content.docs[0],
      state: row.querySelector('[data-action="care.download"]').dataset.state,
      disabled: row.querySelector('[data-action="care.download"]').getAttribute("aria-disabled"),
      title: row.querySelector('[data-action="care.download"]').title,
    };
  });
  assert.equal("url" in injected.document || "href" in injected.document || "downloadUrl" in injected.document || "filename" in injected.document, false, "normalizer strips injected document destinations");
  assert.deepEqual({ state: injected.state, disabled: injected.disabled }, { state: "unavailable", disabled: "true" }, "injected fixture URL still renders unavailable");
  assert.match(injected.title, /unavailable/i, "injected fixture URL retains visible unavailable reason");
  const beforeInjectedDispatchRequests = requests.length;
  await page.evaluate(() => {
    window.AircovePortal.state.moduleData.care.content.docs[0].url = "https://malformed.invalid/fake-success.pdf";
    window.AircovePortal.setState({});
  });
  const injectedControl = page.locator('[data-action="care.download"]').first();
  assert.deepEqual(await injectedControl.evaluate((node) => ({ state: node.dataset.state, disabled: node.getAttribute("aria-disabled") })), { state: "unavailable", disabled: "true" }, "component ignores a malformed destination injected after normalization");
  const beforeInjectedDispatch = await careSurfaceState(page);
  await injectedControl.dispatchEvent("click");
  assert.deepEqual(await careSurfaceState(page), beforeInjectedDispatch, "malformed destination control remains inert in the delegated runtime");
  assert.equal(requests.length, beforeInjectedDispatchRequests, "malformed destination cannot emit network");

  await showVertical(page, "Pest Control", "care");
  const raced = await page.evaluate(async () => {
    const portal = window.AircovePortal;
    const node = document.querySelector('[data-action="care.requestRetreat"]');
    const promise = portal.ACTIONS["care.requestRetreat"](node.dataset.id, node);
    portal.state.access.care = { status: "not-entitled", reasonCode: "s5-race" };
    portal.runtime().invalidate("care");
    await promise;
    return {
      request: portal.state.careRetreatRequests[node.dataset.id],
      pending: portal.state.pending[`care.requestRetreat:${node.dataset.id}`],
      content: portal.state.moduleData.care && portal.state.moduleData.care.content,
    };
  });
  assert.equal(raced.request, undefined, "auth revoke race cannot restore fixture mutation readback");
  assert.equal(raced.pending, undefined, "auth revoke race clears pending state");
  assert.equal(raced.content, null, "auth revoke clears protected content");
}

async function collectCareSurfaceControls(page) {
  const verticals = [
    ["HVAC", "hvac"], ["Snow Removal", "snow"], ["Lawn & Garden", "lawn"], ["Pool & Spa", "pool"],
    ["Roofing", "roofing"], ["Pest Control", "pest"], ["Health", "health"], ["Beauty", "beauty"],
  ];
  const observed = [];
  for (const [vertical, slug] of verticals) {
    await showVertical(page, vertical, "care");
    const nodes = await page.locator('[data-route="care"] [data-action]').evaluateAll((controls) => controls.map((node, domIndex) => ({
      action: node.dataset.action,
      entity: node.dataset.id || "_",
      disabled: node.hasAttribute("disabled") || node.getAttribute("aria-disabled") === "true",
      domIndex,
    })));
    const occurrences = new Map();
    for (const node of nodes) {
      const key = `${node.action}|${node.entity}`;
      const occurrence = occurrences.get(key) || 0;
      occurrences.set(key, occurrence + 1);
      observed.push({ ...node, occurrence, vertical, surface: `care:${slug}` });
    }
  }
  return observed;
}

function validateSurfaceDomBijection(surfaceRows, observed) {
  const expected = [];
  const occurrences = new Map();
  for (const row of surfaceRows) {
    for (const entity of row.entities) {
      const key = `${row.surface}|${row.action}|${entity}`;
      const occurrence = occurrences.get(key) || 0;
      occurrences.set(key, occurrence + 1);
      expected.push({ surface: row.surface, action: row.action, entity, occurrence, disabled: row.disposition === "unavailable" });
    }
  }
  const normalize = (items) => items.map((item) => `${item.surface}|${item.action}|${item.entity}|${item.occurrence}|${item.disabled}`).sort();
  assert.deepEqual(normalize(observed), normalize(expected), "surfaceControls inventory is an exact DOM action/entity/disposition bijection");
}

function runSurfaceInventoryMutationTests(surfaceRows, observed) {
  const reject = (change, label) => {
    const candidate = structuredClone(surfaceRows);
    change(candidate);
    assert.throws(() => validateSurfaceDomBijection(candidate, observed), /exact DOM/, label);
  };
  reject((rows) => rows.pop(), "removed surface-control row is rejected");
  reject((rows) => rows[0].entities.pop(), "removed surface entity is rejected");
  reject((rows) => { rows[0].action = "booking.open"; }, "relabelled surface action is rejected");
  reject((rows) => { rows.find((row) => row.disposition === "unavailable").disposition = "local"; }, "changed surface disposition is rejected");
}

async function exerciseRetreatControl(page, control) {
  const failedFlight = await control.evaluate(async (node) => {
    const portal = window.AircovePortal;
    const id = node.dataset.id;
    const promise = portal.ACTIONS["care.requestRetreat"](id, node);
    node.dataset.serviceId = "stale-service-scope";
    await promise;
    return { error: portal.state.commandErrors[`care.requestRetreat:${id}`], pending: portal.state.pending[`care.requestRetreat:${id}`], readback: portal.state.careRetreatRequests[id] };
  });
  assert.match(failedFlight.error, /invalid|current/i, "retreat mismatch exposes entity error");
  assert.equal(failedFlight.pending, undefined, "retreat failure clears pending");
  assert.equal(failedFlight.readback, undefined, "retreat failure has no success readback");
  assert.match(await page.locator('[data-module="retreat-card"] [data-state="error"]').innerText(), /invalid|current/i, "retreat error is visible");
  const duplicate = await page.locator('[data-action="care.requestRetreat"]').evaluate(async (node) => {
    const portal = window.AircovePortal;
    const p1 = portal.ACTIONS["care.requestRetreat"](node.dataset.id, node);
    const p2 = portal.ACTIONS["care.requestRetreat"](node.dataset.id, node);
    const pending = portal.state.pending[`care.requestRetreat:${node.dataset.id}`];
    await p1;
    return { same: p1 === p2, pending, readback: portal.state.careRetreatRequests[node.dataset.id] };
  });
  assert.equal(duplicate.same, true, "retreat duplicate callers share one flight");
  assert.equal(duplicate.pending, true, "retreat pending is entity-scoped");
  assert.equal(duplicate.readback.status, "submitted", "retreat fixture readback is authoritative");
  await page.evaluate(() => { window.AircovePortal.state.careRetreatRequests = {}; window.AircovePortal.setState({}); });
  await page.locator('[data-action="care.requestRetreat"]').click();
  await page.waitForSelector('[data-module="retreat-card"][data-state="used"]');
}

async function careSurfaceState(page) {
  return page.evaluate(() => ({
    route: window.AircovePortal.state.route,
    drawer: window.AircovePortal.state.drawer,
    currentOrderId: window.AircovePortal.state.currentOrderId,
    cartItems: structuredClone(window.AircovePortal.state.cartItems),
    serviceRequests: structuredClone(window.AircovePortal.state.serviceRequests),
    selectedUnit: window.AircovePortal.state.careSelectedUnitId,
    selectedSpecialist: window.AircovePortal.state.careSelectedSpecialistId,
    tasks: structuredClone(window.AircovePortal.state.careTasksDone),
    requests: structuredClone(window.AircovePortal.state.careRetreatRequests),
    toast: window.AircovePortal.state.toast,
  }));
}

async function exerciseSeoParity(page, requests, result) {
  const verticals = ["HVAC", "Snow Removal", "Lawn & Garden", "Pool & Spa", "Roofing", "Pest Control", "Health", "Beauty"];
  for (const vertical of verticals) {
    await showVertical(page, vertical, "seo.landing");
    const controls = page.locator('[data-route="seo.landing"] [data-action^="seo."]');
    const count = await controls.count();
    for (let index = 0; index < count; index += 1) {
      const control = controls.nth(index);
      const meta = await control.evaluate((node) => ({ action: node.dataset.action, id: node.dataset.id || "_", disabled: node.hasAttribute("disabled") || node.getAttribute("aria-disabled") === "true" }));
      result[meta.action] = (result[meta.action] || 0) + 1;
      const beforeRequests = requests.length;
      if (meta.disabled) {
        const before = await page.evaluate(() => structuredClone(window.AircovePortal.state.seoCtaStates));
        await control.dispatchEvent("click");
        assert.deepEqual(await page.evaluate(() => window.AircovePortal.state.seoCtaStates), before, `${vertical} ${meta.action} unavailable parity CTA is inert`);
      } else if (meta.action === "seo.service.select") {
        await control.click();
        assert.equal(await page.evaluate(() => window.AircovePortal.state.seoSelectedServiceId), meta.id, "SEO service selection state readback");
        assert.match(await page.locator("[data-seo-selection]").innerText(), /Selected service:/, "SEO service selection visible readback");
      } else if (meta.action === "seo.faq.toggle") {
        await control.click();
        const current = page.locator(`[data-action="seo.faq.toggle"][data-id="${meta.id}"]`);
        assert.equal(await current.getAttribute("aria-expanded"), "true", "SEO FAQ opens with DOM readback");
        await current.click();
        assert.equal(await page.locator(`[data-action="seo.faq.toggle"][data-id="${meta.id}"]`).getAttribute("aria-expanded"), "false", "SEO FAQ closes with DOM readback");
      } else if (meta.action === "seo.cta.services") {
        await control.click();
        assert.equal(await page.evaluate(() => window.AircovePortal.state.route), "seo.landing", "SEO services CTA remains local to parity route");
        assert.equal(await page.locator("#seo-services").count(), 1, "SEO services anchor target exists");
      }
      assert.equal(requests.length, beforeRequests, `${vertical} ${meta.action}:${meta.id} emits no command network request`);
    }
  }
}

async function exerciseSeoPublic(page, requests, result) {
  assert.equal(await page.evaluate(() => "AircovePortal" in window), false, "public SEO has no portal command bus");
  await page.evaluate(() => {
    window.__s5Destinations = [];
    document.addEventListener("click", (event) => {
      const link = event.target.closest('a[data-action^="seo."]');
      if (!link) return;
      window.__s5Destinations.push({ action: link.dataset.action, href: link.getAttribute("href") });
      event.preventDefault();
    }, true);
  });
  const controls = page.locator('[data-action^="seo."]');
  const count = await controls.count();
  for (let index = 0; index < count; index += 1) {
    const control = controls.nth(index);
    const meta = await control.evaluate((node) => ({ action: node.dataset.action, id: node.dataset.id || "_", tag: node.tagName, disabled: node.hasAttribute("disabled") || node.getAttribute("aria-disabled") === "true", href: node.getAttribute("href") }));
    result[meta.action] = (result[meta.action] || 0) + 1;
    const beforeRequests = requests.length;
    if (meta.action === "seo.faq.toggle") {
      const details = control.locator("xpath=ancestor::details");
      const before = await details.getAttribute("open");
      await control.click();
      assert.notEqual(await details.getAttribute("open"), before, "public native FAQ click changes details.open");
    } else if (meta.disabled) {
      await control.dispatchEvent("click");
      assert.equal(await control.isDisabled(), true, `${meta.action}:${meta.id} remains disabled before effort`);
    } else {
      assert.equal(meta.tag, "A", `${meta.action}:${meta.id} public action is native navigation`);
      assert.equal(!!meta.href, true, `${meta.action}:${meta.id} has an inspectable destination`);
      await control.click();
    }
    assert.equal(requests.length, beforeRequests, `public ${meta.action}:${meta.id} emits no hidden command request`);
  }
  const destinations = await page.evaluate(() => window.__s5Destinations);
  assert.equal(destinations.length > 0, true, "public native destinations were click-traced");
  for (const target of destinations) assert.match(target.href, /^(?:https:\/\/|tel:|#)/, `${target.action} uses an explicit supported destination`);
}

async function showVertical(page, vertical, route) {
  await page.evaluate(async ({ vertical, route }) => {
    const portal = window.AircovePortal;
    portal.state.session.authenticated = true;
    portal.state.session.hasCustomerScope = true;
    portal.state.session.hasTenantScope = true;
    portal.state.access.care = { status: "granted", reasonCode: null };
    await portal.ACTIONS["theme.pick"](vertical);
    if (route === "care" && !portal.state.config.enabledModules.includes("care")) {
      portal.state.config.enabledModules.push("care");
      await portal.runtime().reloadAsync("care");
    }
    portal.go(route);
  }, { vertical, route });
  await page.waitForSelector(`[data-route="${route}"][data-state="ready"]`);
}

function extractArray(source, key) {
  const match = source.match(new RegExp(`${key}: \\[([^\\]]*)\\]`));
  assert.ok(match, `${key} registry is present`);
  return [...match[1].matchAll(/"([^"]+)"/g)].map((item) => item[1]);
}

function sortObject(value) {
  return Object.fromEntries(Object.entries(value).sort(([left], [right]) => left.localeCompare(right)));
}

function validateWithAvailableJsonSchema(schema, value) {
  try {
    const Ajv2020 = requireFrom("ajv/dist/2020").default;
    const validator = new Ajv2020({ allErrors: true, strict: true }).compile(schema);
    assert.equal(validator(value), true, `JSON Schema validation failed: ${JSON.stringify(validator.errors)}`);
    return "Ajv 2020-12 passed";
  } catch (error) {
    if (error && error.code === "MODULE_NOT_FOUND") return "not available in bundled/system runtime; code-owned fail-closed validation passed";
    throw error;
  }
}

function validateCodeOwnedPolicy(candidate) {
  assert.deepEqual(candidate.healthControlSet, [...HEALTH_CONTROL_SET], "inventory healthControlSet matches literal code-owned policy");
  const entries = [...candidate.dataSources, ...candidate.actions, ...candidate.surfaceControls];
  const byId = new Map(entries.map((entry) => [entry.id, entry]));
  for (const id of HEALTH_SENSITIVE_IDS) {
    const entry = byId.get(id);
    assert.ok(entry, `fixed sensitive policy id ${id} exists`);
    assert.equal(entry.healthSecurity.sensitive, true, `${id} cannot self-declassify as non-sensitive`);
    assert.deepEqual(entry.healthSecurity.required.slice().sort(), [...HEALTH_CONTROL_SET].sort(), `${id} requires the literal five-control set`);
    assert.deepEqual(entry.healthSecurity.missing.slice().sort(), [...HEALTH_CONTROL_SET].sort(), `${id} records every missing control`);
    assert.equal(["unavailable", "not_opened"].includes(entry.disposition), true, `${id} remains fail-closed while controls are missing`);
  }
  for (const id of CARE_SURFACE_CLOSED_IDS) {
    const entry = byId.get(id);
    assert.ok(entry, `fixed closed Care surface id ${id} exists`);
    assert.equal(entry.disposition, "unavailable", `${id} cannot open without a new code contract`);
    assert.equal(entry.networkPolicy, "none", `${id} closed surface emits no network`);
    assert.equal(entry.readback, "none", `${id} closed surface emits no success readback`);
  }
  for (const entry of candidate.surfaceControls.filter((item) => item.healthSecurity.sensitive)) {
    assert.deepEqual(entry.healthSecurity.required.slice().sort(), [...HEALTH_CONTROL_SET].sort(), `${entry.id} sensitive Care surface requires all five controls`);
    assert.deepEqual(entry.healthSecurity.missing.slice().sort(), [...HEALTH_CONTROL_SET].sort(), `${entry.id} sensitive Care surface records all missing controls`);
    assert.equal(entry.disposition, "unavailable", `${entry.id} sensitive Care surface stays unavailable`);
  }
  return true;
}

function runInventoryMutationTests(source) {
  const mutate = (change, pattern, label) => {
    const candidate = structuredClone(source);
    change(candidate);
    assert.throws(() => validateCodeOwnedPolicy(candidate), pattern, label);
  };
  mutate((candidate) => { candidate.dataSources.find((entry) => entry.id === "care.live").healthSecurity.sensitive = false; }, /cannot self-declassify/, "sensitive false mutation is rejected");
  mutate((candidate) => { candidate.healthControlSet[0] = "role"; }, /literal code-owned policy/, "modified top-level Health set is rejected");
  mutate((candidate) => { candidate.actions.find((entry) => entry.id === "care.contactProvider").healthSecurity.required.pop(); }, /literal five-control set/, "removed required Health control is rejected");
  mutate((candidate) => { candidate.actions.find((entry) => entry.id === "care.openSecureDoc").healthSecurity.missing[0] = "role"; }, /records every missing control/, "relabeled missing Health control is rejected");
  mutate((candidate) => { candidate.dataSources.find((entry) => entry.id === "care.live").disposition = "opened_live"; }, /remains fail-closed/, "opened_live mutation is rejected");
  mutate((candidate) => { candidate.surfaceControls.find((entry) => entry.id === "care.health.support.call").disposition = "local"; }, /remains fail-closed|stays unavailable/, "sensitive surface disposition mutation is rejected");
}

async function readJson(filePath) {
  return JSON.parse(await fs.readFile(filePath, "utf8"));
}

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  return "application/octet-stream";
}

async function startServer(strictOutput, quoteOutput) {
  const requests = [];
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    requests.push(url.pathname);
    let filePath;
    if (url.pathname === "/__strict.html") filePath = strictOutput;
    else if (url.pathname === "/__quote.html") filePath = quoteOutput;
    else filePath = path.resolve(portalRoot, `.${decodeURIComponent(url.pathname)}`);
    if (filePath !== strictOutput && filePath !== quoteOutput && !filePath.startsWith(portalRoot)) { res.writeHead(403); res.end("Forbidden"); return; }
    try {
      const body = await fs.readFile(filePath);
      res.writeHead(200, { "content-type": contentType(filePath) });
      res.end(body);
    } catch {
      res.writeHead(404); res.end("Not found");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return { server, requests, url: `http://127.0.0.1:${server.address().port}` };
}
