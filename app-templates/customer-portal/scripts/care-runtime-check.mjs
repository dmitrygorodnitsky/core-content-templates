import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  if (!process.argv[i].startsWith("--")) continue;
  const key = process.argv[i].slice(2);
  const next = process.argv[i + 1];
  if (!next || next.startsWith("--")) args.set(key, "true");
  else { args.set(key, next); i += 1; }
}

const root = path.resolve(args.get("root") || "app-templates/customer-portal/runtime");
const entry = "/" + (args.get("entry") || "source.html").replace(/^\/+/, "");
const artifactRoot = path.resolve(args.get("artifacts") || "docs/stream-tasks/customer-portal-wave9-runtime-program/evidence/artifacts/S2");
const requireFrom = process.env.PLAYWRIGHT_NODE_MODULES
  ? createRequire(path.join(process.env.PLAYWRIGHT_NODE_MODULES, "package.json"))
  : createRequire(import.meta.url);
const { chromium } = requireFrom("playwright");

const verticals = [
  { name: "HVAC", slug: "hvac", kind: "equipment", nav: "Equipment", title: "Your equipment", hooks: ["unit-picker", "diagnostic-report", "equipment-passport", "document-vault"] },
  { name: "Snow Removal", slug: "snow", kind: "seasonLog", nav: "Season log", title: "Season log", hooks: ["season-stats", "storm-log", "sla-meter", "compliance-reports"] },
  { name: "Lawn & Garden", slug: "lawn", kind: "program", nav: "Program", title: "Season program", hooks: ["program-steps", "reentry-card", "soil-snapshot", "progress-photos"] },
  { name: "Pool & Spa", slug: "pool", kind: "water", nav: "Water", title: "Water quality", hooks: ["water-readings", "dose-log", "status-banner", "test-cadence"] },
  { name: "Roofing", slug: "roofing", kind: "roof", nav: "Roof report", title: "Roof condition", hooks: ["roof-zones", "project-tracker", "roof-score", "document-vault"] },
  { name: "Pest Control", slug: "pest", kind: "monitoring", nav: "Monitoring", title: "Station monitoring", hooks: ["monitoring-summary", "station-map", "station-list", "retreat-card", "alert-log"] },
  { name: "Health", slug: "health", kind: "healthCare", nav: "Care plan", title: "Your care plan", hooks: ["care-appointment", "care-plan", "follow-up-tasks", "provider-card", "secure-documents", "care-disclaimer"] },
  { name: "Beauty", slug: "beauty", kind: "beautyCare", nav: "My routine", title: "Your routine", hooks: ["care-appointment", "package-card", "treatment-history", "specialist-picker", "routine-card", "loyalty-card", "care-products"] },
];
const careActions = ["care.selectUnit", "care.download", "care.requestRetreat", "care.selectSpecialist", "care.completeTask", "care.contactProvider", "care.openSecureDoc"];

const { careFixtures } = await import(pathToFileURL(path.join(root, "data/care-fixtures.js")));
function deriveProtectedIds(rootValue) {
  const ids = new Set();
  function visit(value, key, parentKey) {
    if (typeof value === "string" && (/id$/i.test(key) || parentKey === "scope")) ids.add(value);
    else if (Array.isArray(value)) value.forEach((item) => visit(item, key, parentKey));
    else if (value && typeof value === "object") {
      for (const [childKey, child] of Object.entries(value)) visit(child, childKey, key);
    }
  }
  visit(rootValue, "", "");
  return ids;
}
const protectedIds = deriveProtectedIds(careFixtures);
assert.equal(protectedIds.size, 35, "recursively derived every Care id, *Id, and scope value");
for (const referencedId of ["#SV-3290", "#SV-2410", "#SV-3312"]) {
  assert.equal(protectedIds.has(referencedId), true, `protected id derivation includes ${referencedId}`);
}
assert.equal(deriveProtectedIds({ mixedCaseID: "case-proof" }).has("case-proof"), true, "protected id keys are case-insensitive");

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  return "application/octet-stream";
}

async function startServer() {
  const requests = [];
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    requests.push(url.pathname);
    const relative = url.pathname === "/" ? entry : url.pathname;
    const filePath = path.resolve(root, `.${decodeURIComponent(relative)}`);
    if (!filePath.startsWith(root)) { res.writeHead(403); res.end("Forbidden"); return; }
    try {
      let body = await fs.readFile(filePath);
      if (relative === entry && url.searchParams.get("auth") === "required") {
        body = Buffer.from(body.toString("utf8").replace('data-portal-auth-mode="fixture"', 'data-portal-auth-mode="required"'));
      }
      res.writeHead(200, { "content-type": contentType(filePath) });
      res.end(body);
    } catch {
      res.writeHead(404); res.end("Not found");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return { server, requests, url: `http://127.0.0.1:${server.address().port}${entry}` };
}

function assertNoProtectedIds(value, label, ids = protectedIds) {
  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  for (const id of ids) assert.equal(serialized.includes(id), false, `${label} leaked ${id}`);
}

function careStateSurface(state) {
  return {
    moduleData: state.moduleData && state.moduleData.care,
    moduleStatus: state.moduleStatus && state.moduleStatus.care,
    careStateVertical: state.careStateVertical,
    careSelectedUnitId: state.careSelectedUnitId,
    careSelectedSpecialistId: state.careSelectedSpecialistId,
    careTasksDone: state.careTasksDone,
    careRetreatRequests: state.careRetreatRequests,
    pending: Object.fromEntries(Object.entries(state.pending || {}).filter(([key]) => key.startsWith("care."))),
    commandErrors: Object.fromEntries(Object.entries(state.commandErrors || {}).filter(([key]) => key.startsWith("care."))),
  };
}

function isolatedState(input = {}) {
  const session = { authenticated: input.authenticated ?? true };
  if (!input.omitCustomerScope) session.hasCustomerScope = input.customerScope ?? true;
  if (!input.omitTenantScope) session.hasTenantScope = input.tenantScope ?? true;
  return {
    config: { vertical: input.vertical || "hvac", dataMode: input.dataMode || "fixture", enabledModules: input.enabled === false ? [] : ["care"] },
    session,
    access: { care: { status: input.access || "granted", reasonCode: input.name || null } },
    carePayloadState: input.payloadState,
    careAuthorizationEpoch: 0,
    careStateVertical: null,
    careRetreatRequests: {},
    careTasksDone: {},
    pending: {}, commandErrors: {}, moduleData: {}, moduleStatus: {},
  };
}

const runtimeManifest = JSON.parse(await fs.readFile(path.join(root, "manifest.json"), "utf8"));
const designManifest = JSON.parse(await fs.readFile(path.resolve(root, "../design-inbox/manifest.json"), "utf8"));
const careStart = designManifest.components.findIndex((item) => item.id === "care-hub");
const careEnd = designManifest.components.findIndex((item) => item.id === "care-products");
const designCareComponents = designManifest.components.slice(careStart, careEnd + 1).map((item) => item.id);
const runtimeComponentIds = new Set(runtimeManifest.components.map((item) => item.id));
for (const id of designCareComponents) assert.equal(runtimeComponentIds.has(id), true, `runtime manifest preserves ${id}`);
assert.deepEqual(designManifest.actions.filter((id) => id.startsWith("care.")).sort(), careActions.slice().sort(), "accepted Care action inventory");
assert.deepEqual(runtimeManifest.actions.filter((id) => id.startsWith("care.")).sort(), careActions.slice().sort(), "runtime Care action inventory");

const adapterSource = await fs.readFile(path.join(root, "src/adapters/care-fixture-adapter.js"), "utf8");
assert.doesNotMatch(adapterSource, /^import .*care-fixtures/m, "Care adapter has no static protected fixture import");
assert.match(adapterSource, /await import\(["']\.\.\/\.\.\/data\/care-fixtures\.js["']\)/, "Care adapter dynamically imports protected fixtures");
const moduleSource = await fs.readFile(path.join(root, "src/modules/index.js"), "utf8");
assert.doesNotMatch(moduleSource, /CARE_META|Your equipment|Station monitoring/, "Care vertical metadata is normalizer-owned");
for (const file of await fs.readdir(path.join(root, "src/components/care"))) {
  const source = await fs.readFile(path.join(root, "src/components/care", file), "utf8");
  assert.doesNotMatch(source, /design-inbox|from\s+["'][^"']*(?:fixtures|state)\.js["']/, `${file} consumes normalized props only`);
}

await fs.mkdir(artifactRoot, { recursive: true });
const { server, requests, url } = await startServer();
const launchOptions = { headless: true };
if (process.env.PLAYWRIGHT_EXECUTABLE_PATH) launchOptions.executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH;
const browser = await chromium.launch(launchOptions);

try {
  const deniedBoot = await browser.newPage({ viewport: { width: 1180, height: 900 } });
  const authPageErrors = [];
  deniedBoot.on("pageerror", (error) => authPageErrors.push(error.message));
  await deniedBoot.goto(`${url}?auth=required#/care`, { waitUntil: "networkidle" });
  await deniedBoot.waitForSelector('[data-route="auth.phone"]');
  assert.equal(requests.filter((item) => item.endsWith("/care-fixtures.js")).length, 0, "denied boot does not request protected fixture module");
  const deniedSnapshot = await deniedBoot.evaluate(() => ({ state: window.AircovePortal.state, dom: document.body.innerHTML }));
  assert.equal(deniedSnapshot.state.session.intendedRoute, "care", "direct Care route is retained through auth");
  assertNoProtectedIds({ state: careStateSurface(deniedSnapshot.state), dom: deniedSnapshot.dom }, "denied boot Care state and DOM");

  await deniedBoot.locator(".auth-phone__input").fill("5551234567");
  await deniedBoot.locator('[data-action="auth.sendCode"]').click();
  await deniedBoot.waitForSelector('[data-route="auth.code"]');
  await deniedBoot.locator(".otp__input").fill("1234");
  assert.equal(requests.filter((item) => item.endsWith("/care-fixtures.js")).length, 0, "phone/code steps do not request protected fixture module");
  await deniedBoot.evaluate(() => {
    window.__careAuthStates = [];
    window.__careAuthObserver = new MutationObserver(() => {
      const route = document.querySelector('[data-route="care"]');
      if (route) window.__careAuthStates.push(route.dataset.state);
    });
    window.__careAuthObserver.observe(document.getElementById("app"), { childList: true, subtree: true });
  });
  await deniedBoot.locator('[data-action="auth.verifyCode"]').click();
  await deniedBoot.waitForSelector('[data-route="care"][data-state="ready"]');
  const authenticatedCare = await deniedBoot.evaluate(() => {
    window.__careAuthObserver.disconnect();
    return { states: window.__careAuthStates, state: window.AircovePortal.state };
  });
  assert.equal(authenticatedCare.states.includes("loading"), true, "real sign-in transitions Care through safe loading");
  assert.equal(authenticatedCare.state.route, "care", "real sign-in returns to intended Care route");
  assert.equal(authenticatedCare.state.moduleData.care.phase, "payload", "real sign-in replaces preflight envelope");
  assert.equal(authenticatedCare.state.moduleData.care.state, "ready", "real sign-in reaches ready Care payload");
  assert.equal(authenticatedCare.state.moduleData.care.access.status, "granted", "real sign-in has granted Care access");
  assert.equal(requests.filter((item) => item.endsWith("/care-fixtures.js")).length, 1, "protected fixture requested exactly once only after real auth grant");
  assert.deepEqual(authPageErrors, [], "real auth Care transition has no page errors");
  await deniedBoot.close();

  const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });
  const browserLogs = [];
  const sinkEvents = [];
  page.on("console", (message) => browserLogs.push(`${message.type()}: ${message.text()}`));
  page.on("pageerror", (error) => browserLogs.push(`pageerror: ${error.message}`));
  await page.exposeFunction("captureCareSink", (sink, args) => sinkEvents.push({ sink, args }));
  await page.addInitScript(() => {
    window.analytics = { track: (...args) => window.captureCareSink("analytics", args) };
    window.telemetry = { record: (...args) => window.captureCareSink("telemetry", args) };
  });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.AircovePortal && window.AircovePortal.runtime());

  for (const action of careActions) {
    assert.equal(await page.evaluate((id) => typeof window.AircovePortal.ACTIONS[id], action), "function", `${action} registered`);
  }

  const deniedCases = [
    { name: "disabled", enabled: false, expectedState: "disabled", expectedAccess: "disabled" },
    { name: "unauthenticated", authenticated: false, expectedState: "unauthorized", expectedAccess: "unauthenticated" },
    { name: "not-entitled", access: "not-entitled", expectedState: "unauthorized", expectedAccess: "not-entitled" },
    { name: "forbidden", access: "forbidden", expectedState: "unauthorized", expectedAccess: "forbidden" },
    { name: "customer-scope-false", customerScope: false, expectedState: "unauthorized", expectedAccess: "forbidden" },
    { name: "customer-scope-missing", omitCustomerScope: true, expectedState: "unauthorized", expectedAccess: "forbidden" },
    { name: "tenant-scope-missing", omitTenantScope: true, expectedState: "unauthorized", expectedAccess: "forbidden" },
    { name: "checking", access: "checking", expectedState: "loading", expectedAccess: "checking" },
    { name: "error", access: "error", expectedState: "error", expectedAccess: "error" },
    { name: "live-not-opened", dataMode: "live", expectedState: "error", expectedAccess: "error" },
  ];

  for (const testCase of deniedCases) {
    const result = await page.evaluate(async (input) => {
      const [{ PortalRuntime }, { modules }] = await Promise.all([import("/src/portal-runtime.js"), import("/src/modules/index.js")]);
      const stats = { constructed: 0, loads: 0 };
      const productionCare = modules.care;
      const careWithSpy = Object.assign({}, productionCare, {
        adapter(context) {
          stats.constructed += 1;
          const adapter = productionCare.adapter(context);
          return { load(...loadArgs) { stats.loads += 1; return adapter.load(...loadArgs); } };
        },
      });
      const session = { authenticated: input.authenticated ?? true };
      if (!input.omitCustomerScope) session.hasCustomerScope = input.customerScope ?? true;
      if (!input.omitTenantScope) session.hasTenantScope = input.tenantScope ?? true;
      const state = {
        config: { vertical: "hvac", dataMode: input.dataMode || "fixture", enabledModules: input.enabled === false ? [] : ["care"] },
        session, access: { care: { status: input.access || "granted", reasonCode: input.name } },
        carePayloadState: "ready", careAuthorizationEpoch: 0, moduleData: {}, moduleStatus: {}, pending: {}, commandErrors: {},
      };
      const captured = [];
      const old = { log: console.log, warn: console.warn, error: console.error };
      for (const method of Object.keys(old)) console[method] = (...items) => captured.push([method, ...items]);
      try {
        const runtime = new PortalRuntime({ state, modules: { care: careWithSpy } });
        runtime.load("care");
        await runtime.loadAsync("care");
      } finally {
        Object.assign(console, old);
      }
      return { state, stats, captured };
    }, testCase);
    assert.deepEqual(result.stats, { constructed: 0, loads: 0 }, `${testCase.name} sync+async adapter no-call`);
    assert.equal(result.state.moduleData.care.state, testCase.expectedState, `${testCase.name} envelope state`);
    assert.equal(result.state.moduleData.care.access.status, testCase.expectedAccess, `${testCase.name} access state`);
    assert.equal(result.state.moduleData.care.content, null, `${testCase.name} content null`);
    assert.deepEqual(result.state.moduleData.care.allowedActions, [], `${testCase.name} actions empty`);
    assertNoProtectedIds(result, `${testCase.name} runtime/log sinks`);
  }

  const granted = await page.evaluate(async () => {
    const [{ PortalRuntime }, { modules }] = await Promise.all([import("/src/portal-runtime.js"), import("/src/modules/index.js")]);
    const stats = { constructed: 0, loads: 0 };
    const productionCare = modules.care;
    const careWithSpy = Object.assign({}, productionCare, {
      adapter(context) {
        stats.constructed += 1;
        const adapter = productionCare.adapter(context);
        return { load(...args) { stats.loads += 1; return adapter.load(...args); } };
      },
    });
    const state = {
      config: { vertical: "hvac", dataMode: "fixture", enabledModules: ["care"] },
      session: { authenticated: true, hasCustomerScope: true, hasTenantScope: true }, access: { care: { status: "granted" } },
      careAuthorizationEpoch: 0, moduleData: {}, moduleStatus: {}, pending: {}, commandErrors: {},
    };
    const runtime = new PortalRuntime({ state, modules: { care: careWithSpy } });
    const sync = runtime.load("care");
    const p1 = runtime.loadAsync("care");
    const p2 = runtime.loadAsync("care");
    const samePromise = p1 === p2;
    await p1;
    await runtime.loadAsync("care");
    return { state, stats, samePromise, syncState: sync.state };
  });
  assert.equal(granted.syncState, "loading", "async-only Care sync load is safe loading without IO");
  assert.equal(granted.samePromise, true, "Care payload loads are single-flight");
  assert.deepEqual(granted.stats, { constructed: 1, loads: 1 }, "granted adapter called exactly once after preflight and then cached");
  assert.equal(granted.state.moduleData.care.kind, "equipment");

  const payloadValidation = await page.evaluate(async () => {
    const [{ PortalRuntime }, { modules }] = await Promise.all([import("/src/portal-runtime.js"), import("/src/modules/index.js")]);
    const makeState = (value, present) => {
      const state = {
        config: { vertical: "hvac", dataMode: "fixture", enabledModules: ["care"] },
        session: { authenticated: true, hasCustomerScope: true, hasTenantScope: true }, access: { care: { status: "granted" } },
        careAuthorizationEpoch: 0, moduleData: {}, moduleStatus: {}, pending: {}, commandErrors: {},
      };
      if (present) state.carePayloadState = value;
      return state;
    };
    const missing = makeState(undefined, false);
    await new PortalRuntime({ state: missing, modules: { care: modules.care } }).loadAsync("care");
    const unsupported = [];
    for (const value of [null, "bogus", true, 0]) {
      const state = makeState(value, true);
      let message = null;
      try { await new PortalRuntime({ state, modules: { care: modules.care } }).loadAsync("care"); }
      catch (error) { message = error.message; }
      unsupported.push({ value, message, envelope: state.moduleData.care });
    }
    return { missing: missing.moduleData.care, unsupported };
  });
  assert.equal(payloadValidation.missing.state, "ready", "missing payload state defaults ready");
  for (const result of payloadValidation.unsupported) {
    assert.match(result.message, /Unsupported Care payload state/, `unsupported payload ${String(result.value)} throws`);
    assert.equal(result.envelope.state, "error", `unsupported payload ${String(result.value)} publishes error envelope`);
    assert.equal(result.envelope.content, null);
  }

  async function showVertical(name) {
    await page.evaluate(async (verticalName) => {
      const portal = window.AircovePortal;
      portal.state.session.authenticated = true;
      portal.state.session.hasCustomerScope = true;
      portal.state.session.hasTenantScope = true;
      portal.state.access.care = { status: "granted", reasonCode: null };
      portal.state.carePayloadState = "ready";
      await portal.ACTIONS["theme.pick"](verticalName);
      portal.go("care");
    }, name);
    await page.waitForSelector('[data-route="care"][data-state="ready"]');
  }

  const seenActions = new Set();
  for (const vertical of verticals) {
    await showVertical(vertical.name);
    const result = await page.evaluate(() => {
      const root = document.querySelector('[data-route="care"]');
      return {
        routeState: root.dataset.state, access: root.dataset.access, visualId: root.dataset.visualId,
        title: root.querySelector(".page-header__title")?.textContent,
        nav: [...document.querySelectorAll(".nav-link")].map((item) => item.textContent.trim()),
        hooks: [...root.querySelectorAll("[data-module]")].map((item) => item.dataset.module),
        actions: [...root.querySelectorAll("[data-action]")].map((item) => item.dataset.action),
        envelope: window.AircovePortal.state.moduleData.care,
      };
    });
    assert.equal(result.routeState, "ready", `${vertical.name} ready`);
    assert.equal(result.access, "granted", `${vertical.name} granted`);
    assert.equal(result.visualId, `care-${vertical.kind}`, `${vertical.name} visual id`);
    assert.equal(result.title, vertical.title, `${vertical.name} vertical-specific heading`);
    assert.equal(result.nav.includes(vertical.nav), true, `${vertical.name} Care nav label`);
    assert.equal(result.envelope.vertical, vertical.slug, `${vertical.name} normalized vertical`);
    assert.equal(result.envelope.kind, vertical.kind, `${vertical.name} normalized kind`);
    for (const hook of vertical.hooks) assert.equal(result.hooks.includes(hook), true, `${vertical.name} hook ${hook}`);
    result.actions.forEach((action) => { if (action.startsWith("care.")) seenActions.add(action); });
  }
  assert.deepEqual([...seenActions].sort(), careActions.slice().sort(), "accepted Care action hooks represented across hubs");

  for (const payloadState of ["loading", "empty", "error"]) {
    await showVertical("HVAC");
    const result = await page.evaluate(async (nextState) => {
      const portal = window.AircovePortal;
      portal.state.carePayloadState = nextState;
      await portal.runtime().reloadAsync("care");
      portal.go("care");
      return { envelope: portal.state.moduleData.care, html: document.querySelector('[data-route="care"]').outerHTML };
    }, payloadState);
    assert.equal(result.envelope.state, payloadState, `payload ${payloadState}`);
    assert.equal(result.envelope.content, null, `payload ${payloadState} content null`);
    assert.equal(result.envelope.kind, null, `payload ${payloadState} kind null`);
    assertNoProtectedIds(result.html, `payload ${payloadState} DOM`);
  }

  await showVertical("HVAC");
  const delegatedErrorLogStart = browserLogs.length;
  await page.evaluate(() => {
    const portal = window.AircovePortal;
    portal.state.carePayloadState = "unsupported-delegated-state";
    const trigger = document.createElement("button");
    trigger.dataset.action = "theme.pick";
    trigger.dataset.id = "HVAC";
    trigger.dataset.testDelegatedReload = "true";
    document.getElementById("app").appendChild(trigger);
  });
  await page.locator('[data-test-delegated-reload="true"]').click();
  await page.waitForSelector('[data-route="care"][data-state="error"]');
  await page.waitForTimeout(50);
  const delegatedFailure = await page.evaluate(() => window.AircovePortal.state.moduleData.care);
  assert.equal(delegatedFailure.state, "error", "delegated rejected reload preserves truthful Care error envelope");
  assert.equal(delegatedFailure.content, null, "delegated rejected reload exposes no protected content");
  assert.equal(browserLogs.slice(delegatedErrorLogStart).some((line) => /pageerror:|unhandled/i.test(line)), false, "delegated rejected thenable is observed without pageerror");
  await page.evaluate(async () => {
    const portal = window.AircovePortal;
    portal.state.carePayloadState = "ready";
    await portal.runtime().reloadAsync("care");
    portal.go("care");
  });

  for (const testCase of deniedCases.filter((item) => item.name !== "live-not-opened")) {
    await showVertical("HVAC");
    const denied = await page.evaluate((input) => {
      const portal = window.AircovePortal;
      portal.state.session.authenticated = input.authenticated ?? true;
      if (input.omitCustomerScope) delete portal.state.session.hasCustomerScope;
      else portal.state.session.hasCustomerScope = input.customerScope ?? true;
      if (input.omitTenantScope) delete portal.state.session.hasTenantScope;
      else portal.state.session.hasTenantScope = input.tenantScope ?? true;
      portal.state.access.care = { status: input.access || "granted", reasonCode: input.name };
      if (input.enabled === false) portal.state.config.enabledModules = portal.state.config.enabledModules.filter((id) => id !== "care");
      portal.runtime().invalidate("care");
      portal.go("care");
      return { body: document.body.innerHTML, state: portal.state };
    }, testCase);
    assertNoProtectedIds({ state: careStateSurface(denied.state), body: denied.body }, `${testCase.name} rendered Care state/DOM`);
  }
  assertNoProtectedIds(sinkEvents, "denied analytics/telemetry sinks");

  await showVertical("HVAC");
  await page.locator('[data-action="care.selectUnit"][data-id="unit-furnace-01"]').click();
  assert.equal(await page.evaluate(() => window.AircovePortal.state.careSelectedUnitId), "unit-furnace-01", "unit selection readback");
  await page.evaluate(() => window.AircovePortal.ACTIONS["care.selectUnit"]("invalid-unit"));
  assert.match(await page.evaluate(() => window.AircovePortal.state.commandErrors["care.selectUnit:invalid-unit"]), /invalid/i);

  await showVertical("Beauty");
  await page.locator('[data-action="care.selectSpecialist"][data-id="spec-beauty-02"]').click();
  assert.equal(await page.evaluate(() => window.AircovePortal.state.careSelectedSpecialistId), "spec-beauty-02", "specialist preference readback");

  await showVertical("Health");
  await page.locator('[data-action="care.completeTask"][data-id="task-health-01"]').click();
  assert.equal(await page.locator('[data-task-id="task-health-01"]').getAttribute("data-state"), "done", "task rendered readback");
  assert.equal(await page.locator('[data-action="care.contactProvider"]').getAttribute("aria-disabled"), "true", "provider contact unavailable");
  assert.equal(await page.locator('[data-action="care.openSecureDoc"]').first().getAttribute("aria-disabled"), "true", "secure document unavailable");
  const healthEnvelope = await page.evaluate(() => window.AircovePortal.state.moduleData.care);
  for (const doc of healthEnvelope.content.docs) assert.deepEqual(Object.keys(doc).sort(), ["id", "meta", "name", "secure"], "Health secure document metadata only");

  await showVertical("Pest Control");
  const retreat = await page.evaluate(async () => {
    const portal = window.AircovePortal;
    const element = document.querySelector('[data-action="care.requestRetreat"]');
    const p1 = portal.ACTIONS["care.requestRetreat"](element.dataset.id, element);
    const p2 = portal.ACTIONS["care.requestRetreat"](element.dataset.id, element);
    const pending = portal.state.pending["care.requestRetreat:plan-shield-2026"];
    const requesting = !!document.querySelector('[data-module="retreat-card"][data-state="requesting"]');
    await p1;
    return { samePromise: p1 === p2, pending, requesting, request: portal.state.careRetreatRequests["plan-shield-2026"], hasGlobal: "careRetreatStatus" in portal.state };
  });
  assert.equal(retreat.samePromise, true, "retreat duplicates share one flight");
  assert.equal(retreat.pending, true, "retreat exposes entity pending state");
  assert.equal(retreat.requesting, true, "retreat exposes requesting UI");
  assert.equal(retreat.request.status, "submitted", "retreat inspectable readback");
  assert.equal(retreat.hasGlobal, false, "retreat status has no global state");
  assert.equal(await page.locator('[data-module="retreat-card"]').getAttribute("data-state"), "used", "retreat status derives from entity request");

  await showVertical("HVAC");
  assert.equal(await page.locator('[data-action="care.download"]').first().getAttribute("aria-disabled"), "true", "download unavailable without URL");
  await page.evaluate(() => window.AircovePortal.ACTIONS["care.download"]("doc-hvac-diag-2026-01"));
  assert.match(await page.evaluate(() => window.AircovePortal.state.commandErrors["care.download:doc-hvac-diag-2026-01"]), /unavailable/i);

  const deniedCommands = await page.evaluate(async () => {
    const portal = window.AircovePortal;
    portal.state.access.care = { status: "not-entitled", reasonCode: "revoked" };
    portal.runtime().invalidate("care");
    const retreatButton = document.createElement("button");
    retreatButton.dataset.propertyId = "prop-maple-1284";
    retreatButton.dataset.serviceId = "svc-pest-retreat";
    const calls = [
      ["care.selectUnit", "unit-furnace-01", null], ["care.download", "doc-hvac-diag-2026-01", null],
      ["care.requestRetreat", "plan-shield-2026", retreatButton], ["care.selectSpecialist", "spec-beauty-01", null],
      ["care.completeTask", "task-health-01", null], ["care.contactProvider", "prov-health-pt-01", null],
      ["care.openSecureDoc", "doc-health-plan-2025-11", null],
    ];
    for (const [name, id, element] of calls) await portal.ACTIONS[name](id, element);
    return portal.state;
  });
  assertNoProtectedIds(careStateSurface(deniedCommands), "denied commands fail closed without protected Care state mutation");
  for (const action of careActions) assert.match(deniedCommands.commandErrors[`${action}:_`], /not authorized/i, `${action} denied honestly`);

  await showVertical("HVAC");
  assert.equal(await page.evaluate(() => Object.keys(window.AircovePortal.state.commandErrors).some((key) => key.startsWith("care.") && key.endsWith(":_"))), false, "successful granted Care load clears generalized denied errors");
  await page.evaluate(() => { window.AircovePortal.state.commandErrors["care.download:_"] = "stale generalized error"; });
  await page.locator('[data-action="care.selectUnit"][data-id="unit-furnace-01"]').click();
  assert.equal(await page.evaluate(() => Object.keys(window.AircovePortal.state.commandErrors).some((key) => key.startsWith("care.") && key.endsWith(":_"))), false, "successful Care action clears generalized denied errors");

  const pestIds = deriveProtectedIds(careFixtures["Pest Control"]);

  for (const transition of ["direct-revoke", "revoke", "signout", "switch", "clear"]) {
    await showVertical("HVAC");
    await showVertical("Pest Control");
    const raced = await page.evaluate(async (kind) => {
      const portal = window.AircovePortal;
      const element = document.querySelector('[data-action="care.requestRetreat"]');
      const flight = portal.ACTIONS["care.requestRetreat"](element.dataset.id, element);
      let transitionFlight = null;
      if (kind === "direct-revoke") {
        portal.state.access.care = { status: "not-entitled", reasonCode: "race-direct-revoke" };
      } else if (kind === "revoke") {
        portal.state.access.care = { status: "not-entitled", reasonCode: "race-revoke" };
        portal.runtime().invalidate("care");
      } else if (kind === "signout") {
        portal.ACTIONS["auth.signOut"]();
      } else if (kind === "switch") {
        transitionFlight = portal.ACTIONS["theme.pick"]("Beauty");
      } else {
        portal.runtime().invalidate("care");
      }
      await flight;
      if (transitionFlight) await transitionFlight;
      return { state: portal.state, dom: document.body.innerHTML };
    }, transition);
    assertNoProtectedIds({ state: careStateSurface(raced.state), dom: raced.dom }, `${transition} retreat race`, transition === "switch" ? pestIds : protectedIds);
    assert.equal(raced.state.careRetreatRequests["plan-shield-2026"], undefined, `${transition} cannot restore retreat request`);
  }

  const crossVertical = await page.evaluate(async () => {
    const [{ PortalRuntime }, { modules }, { careFixtures }, { F }] = await Promise.all([
      import("/src/portal-runtime.js"), import("/src/modules/index.js"), import("/data/care-fixtures.js"), import("/data/fixtures.js"),
    ]);
    const resolvers = [];
    const descriptor = Object.assign({}, modules.care, {
      adapter(context) {
        return { load() { return new Promise((resolve) => resolvers.push({ vertical: context.config.vertical, resolve })); } };
      },
    });
    const state = {
      config: { vertical: "hvac", dataMode: "fixture", enabledModules: ["care"] },
      session: { authenticated: true, hasCustomerScope: true, hasTenantScope: true }, access: { care: { status: "granted" } },
      carePayloadState: "ready", careAuthorizationEpoch: 0, moduleData: {}, moduleStatus: {}, pending: {}, commandErrors: {},
    };
    const raw = (vertical) => {
      const display = vertical === "beauty" ? "Beauty" : "HVAC";
      return { vertical, state: "ready", fixture: structuredClone(careFixtures[display]), products: structuredClone(F.themes[display].products || []) };
    };
    const runtime = new PortalRuntime({ state, modules: { care: descriptor } });
    const oldFlight = runtime.loadAsync("care");
    state.config.vertical = "beauty";
    const newFlight = runtime.reloadAsync("care");
    resolvers.find((item) => item.vertical === "beauty").resolve(raw("beauty"));
    await newFlight;
    resolvers.find((item) => item.vertical === "hvac").resolve(raw("hvac"));
    await oldFlight;
    return state;
  });
  assert.equal(crossVertical.moduleData.care.vertical, "beauty", "stale payload cannot replace current vertical");
  assert.equal(crossVertical.moduleData.care.kind, "beautyCare", "current vertical payload remains rendered");
  const hvacIds = deriveProtectedIds(careFixtures.HVAC);
  assertNoProtectedIds(crossVertical, "cross-vertical stale load", hvacIds);

  const retryRace = await page.evaluate(async () => {
    const [{ PortalRuntime }, { modules }] = await Promise.all([import("/src/portal-runtime.js"), import("/src/modules/index.js")]);
    const resolvers = [];
    const descriptor = Object.assign({}, modules.care, {
      adapter() { return { load() { return new Promise((resolve) => resolvers.push(resolve)); } }; },
    });
    const state = {
      config: { vertical: "hvac", dataMode: "fixture", enabledModules: ["care"] },
      session: { authenticated: true, hasCustomerScope: true, hasTenantScope: true }, access: { care: { status: "granted" } },
      carePayloadState: "ready", careAuthorizationEpoch: 0, moduleData: {}, moduleStatus: {}, pending: {}, commandErrors: {},
    };
    const runtime = new PortalRuntime({ state, modules: { care: descriptor } });
    const stale = runtime.loadAsync("care");
    const retry = runtime.reloadAsync("care");
    resolvers[1]({ vertical: "hvac", state: "empty", emptyState: { glyph: "i", title: "Current retry", desc: "Current" }, fixture: null, products: [] });
    await retry;
    resolvers[0]({ vertical: "hvac", state: "error", emptyState: null, fixture: null, products: [] });
    await stale;
    return state.moduleData.care;
  });
  assert.equal(retryRace.state, "empty", "stale pre-retry payload cannot replace current retry result");
  assert.equal(retryRace.emptyState.title, "Current retry", "retry keeps its current normalized envelope");

  const metrics = {};
  for (const width of [390, 768]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1024 });
    await showVertical("Health");
    await page.evaluate(() => { window.AircovePortal.setState({ toast: null }); window.scrollTo(0, 0); });
    await page.locator(".toast").waitFor({ state: "detached" });
    await page.waitForTimeout(100);
    const file = path.join(artifactRoot, `care-health-${width}.png`);
    await page.screenshot({ path: file, fullPage: true });
    metrics[width] = await page.evaluate(() => {
      const read = (selector) => {
        const element = document.querySelector(selector);
        if (!element) return null;
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, fontSize: style.fontSize, lineHeight: style.lineHeight };
      };
      return { page: read('[data-route="care"]'), grid: read(".care-grid"), appointment: read('[data-module="care-appointment"]') };
    });
  }
  await fs.writeFile(path.join(artifactRoot, "care-health-metrics.json"), JSON.stringify(metrics, null, 2) + "\n");

  assertNoProtectedIds(browserLogs, "console/error logs");
  assertNoProtectedIds(sinkEvents, "analytics/telemetry sinks");
  assert.equal(browserLogs.some((line) => line.startsWith("pageerror:") || line.startsWith("error:")), false, `browser errors: ${browserLogs.join("\n")}`);
  console.log(`care-runtime-check ok: 8 hubs, ${deniedCases.length} denied preflights, ${protectedIds.size} protected ids, network, commands, races, screenshots 390/768`);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
