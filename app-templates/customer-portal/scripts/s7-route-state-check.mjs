import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import process from "node:process";
import { createRequire } from "node:module";
import { portalProfiles, routeRegistry } from "../runtime/src/config.js";

const args = parseArgs(process.argv.slice(2));
const root = path.resolve(args.root || "app-templates/customer-portal/runtime");
const output = path.resolve(args.output || "docs/stream-tasks/customer-portal-wave9-runtime-program/evidence/artifacts/S7/route-state-coverage.json");
assertInsideS7(output);

const requireFrom = process.env.PLAYWRIGHT_NODE_MODULES
  ? createRequire(path.join(process.env.PLAYWRIGHT_NODE_MODULES, "package.json"))
  : createRequire(import.meta.url);
const { chromium } = requireFrom("playwright");
const scenarios = JSON.parse(await fs.readFile(path.join(root, "data/scenarios.json"), "utf8"));
const routeDeclaredStateIds = scenarios.routes.flatMap((route) => route.states.map((state) => `${route.id}:${state}`)).sort();
const implementedStateIds = Object.entries(scenarios.implementedStates).flatMap(([route, states]) => states.map((state) => `${route}:${state}`)).sort();
assert.deepEqual(routeDeclaredStateIds.filter((id) => !implementedStateIds.includes(id)), [], "every routes[].states contract is represented in implementedStates");
const source = await fs.readFile(path.join(root, "source.html"), "utf8");
const profiles = [
  { id: "onDemand", vertical: "hvac" },
  { id: "stormOps", vertical: "snow" },
  { id: "appointments", vertical: "health" },
];
const publicRoutes = Object.values(routeRegistry).filter((route) => route.public).map((route) => route.id);
const privateRoutes = Object.values(routeRegistry).filter((route) => !route.public).map((route) => route.id);
const browserFailures = [];
const networkFailures = [];
const coverage = {
  routeAttempts: 0,
  enabledRouteProfileCombinations: 0,
  disabledRouteProfileCombinations: 0,
  unauthenticatedPrivateRouteCombinations: 0,
  unknownRoutes: 0,
  parameterizedDetailRoutes: 0,
  shellProfiles: 0,
};
const routeResults = [];

const server = await startServer();
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined,
});

try {
  for (const profile of profiles) {
    const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });
    monitorPage(page, profile.id);
    await page.goto(`${server.url}?profile=${profile.id}&vertical=${profile.vertical}`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => window.AircovePortal && window.AircovePortal.go);

    const shell = await page.evaluate(() => ({
      shell: document.querySelectorAll('[data-module="app-shell"]').length,
      nav: document.querySelectorAll(".nav-links .nav-link").length,
      outlet: document.querySelectorAll('[data-module="app-shell"] > [data-route]').length,
      profile: window.AircovePortal.state.config.profile,
      modules: window.AircovePortal.state.config.enabledModules,
    }));
    assert.equal(shell.profile, profile.id, `${profile.id} config profile`);
    assert.equal(shell.shell, 1, `${profile.id} has one app shell`);
    assert.equal(shell.outlet, 1, `${profile.id} has one route outlet`);
    assert(shell.nav > 0, `${profile.id} has visible navigation`);
    assert.deepEqual(shell.modules, portalProfiles[profile.id].modules, `${profile.id} module resolution`);
    coverage.shellProfiles += 1;

    for (const route of Object.values(routeRegistry)) {
      const enabled = route.public || portalProfiles[profile.id].modules.includes(route.module);
      await prepareDetail(page, route.id);
      await page.evaluate((routeId) => window.AircovePortal.go(routeId), route.id);
      const expected = enabled ? route.id : "orders.list";
      await page.waitForFunction((routeId) => window.AircovePortal.state.route === routeId, expected);
      await page.waitForSelector(`[data-route="${expected}"]`);
      coverage.routeAttempts += 1;
      if (enabled) coverage.enabledRouteProfileCombinations += 1;
      else coverage.disabledRouteProfileCombinations += 1;
      routeResults.push({ profile: profile.id, route: route.id, module: route.module, enabled, rendered: expected });
    }

    for (const routeId of privateRoutes.filter((id) => portalProfiles[profile.id].modules.includes(routeRegistry[id].module))) {
      await page.evaluate(() => { window.AircovePortal.state.session.authenticated = false; });
      await page.evaluate((id) => window.AircovePortal.go(id), routeId);
      await page.waitForSelector('[data-route="auth.phone"]');
      assert.equal(await page.evaluate(() => window.AircovePortal.state.session.intendedRoute), routeId, `${profile.id} ${routeId} intended route`);
      await page.evaluate(() => {
        window.AircovePortal.state.session.authenticated = true;
        window.AircovePortal.state.session.intendedRoute = null;
      });
      coverage.unauthenticatedPrivateRouteCombinations += 1;
    }

    await page.evaluate(() => window.AircovePortal.go("__s7_unknown__"));
    await page.waitForSelector('[data-route="orders.list"]');
    coverage.unknownRoutes += 1;

    for (const detail of [
      { hash: "#/orders/%23SV-2402", route: "order.detail", module: "orders", field: "currentOrderId", value: "#SV-2402" },
      { hash: "#/proposals/s2", route: "proposal.detail", module: "proposals", field: "currentSiteId", value: "s2" },
    ]) {
      if (!portalProfiles[profile.id].modules.includes(detail.module)) continue;
      await page.evaluate((hash) => { window.location.hash = hash; }, detail.hash);
      await page.waitForFunction((routeId) => window.AircovePortal.state.route === routeId, detail.route);
      await page.waitForSelector(`[data-route="${detail.route}"]`);
      assert.equal(await page.evaluate((field) => window.AircovePortal.state[field], detail.field), detail.value, `${profile.id} direct ${detail.route} parameter`);
      coverage.parameterizedDetailRoutes += 1;
    }
    await page.close();
  }

  const stateCoverage = await executeStateProbes(browser, server.url, scenarios.implementedStates);
  assert.equal(coverage.routeAttempts, Object.keys(routeRegistry).length * profiles.length, "all 17 routes attempted for all three profiles");
  assert.equal(coverage.enabledRouteProfileCombinations + coverage.disabledRouteProfileCombinations, coverage.routeAttempts);
  assert.equal(coverage.unauthenticatedPrivateRouteCombinations, 33, "all enabled private route/profile combinations are auth-guarded");
  assert.deepEqual(browserFailures, [], browserFailures.join("\n"));
  assert.deepEqual(networkFailures, [], networkFailures.join("\n"));

  const result = {
    schemaVersion: 1,
    routes: Object.keys(routeRegistry).length,
    profiles: profiles.map((profile) => profile.id),
    publicRoutes,
    privateRoutes,
    coverage,
    routeResults,
    stateCoverage,
    consoleErrors: browserFailures,
    networkFailures,
  };
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, JSON.stringify(result, null, 2) + "\n", "utf8");
  console.log(`s7-route-state-check ok: ${coverage.routeAttempts} route/profile attempts, ${coverage.enabledRouteProfileCombinations} enabled, ${coverage.disabledRouteProfileCombinations} disabled, ${coverage.unauthenticatedPrivateRouteCombinations} auth guards, ${stateCoverage.passedTotal} executable state probes passed`);
} finally {
  await browser.close();
  await new Promise((resolve) => server.server.close(resolve));
}

async function executeStateProbes(browser, baseUrl, implementedStates) {
  const expected = Object.entries(implementedStates).flatMap(([route, states]) => states.map((state) => `${route}:${state}`)).sort();
  assert.equal(new Set(expected).size, expected.length, "implemented state ids are unique");
  const rows = [];
  const passed = new Set();
  const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });
  monitorPage(page, "state-probes");
  await page.goto(`${baseUrl}?profile=onDemand&vertical=hvac`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.AircovePortal && window.AircovePortal.go);

  async function record(id, checkId, method, assertion) {
    assert(expected.includes(id), `probe ${id} belongs to implementedStates`);
    assert.equal(passed.has(id), false, `duplicate state probe: ${id}`);
    const detail = await assertion();
    passed.add(id);
    const [route, ...stateParts] = id.split(":");
    rows.push({ id, route, state: stateParts.join(":"), checkId, method, passed: true, detail: detail || null });
  }

  async function ready(route, selector = `[data-route="${route}"]`) {
    return record(`${route}:ready`, `${route}.ready.dom`, "production-route-render", async () => {
      await page.evaluate((id) => { window.AircovePortal.state.view = "ready"; window.AircovePortal.go(id); }, route);
      await page.waitForSelector(selector);
      return { selector, route: await page.evaluate(() => window.AircovePortal.state.route) };
    });
  }

  await ready("landing");
  await ready("auth.phone", '[data-route="auth.phone"] [data-state="auth-phone"]');
  await record("auth.phone:validation-error", "auth.phone.invalid-submit", "production-action-and-dom", async () => {
    const result = await page.evaluate(() => {
      const portal = window.AircovePortal;
      portal.state.phone = "";
      portal.ACTIONS["auth.sendCode"]();
      return { error: portal.state.authError, route: portal.state.route };
    });
    await page.waitForSelector('[data-route="auth.phone"] [data-state="validation-error"]');
    assert(result.error, "phone validation writes an error");
    return result;
  });
  await ready("auth.code", '[data-route="auth.code"] [data-state="auth-code"]');
  await record("auth.code:validation-error", "auth.code.invalid-submit", "production-action-and-dom", async () => {
    const result = await page.evaluate(() => {
      const portal = window.AircovePortal;
      portal.state.code = "1";
      portal.ACTIONS["auth.verifyCode"]();
      return { error: portal.state.authError, route: portal.state.route };
    });
    await page.waitForSelector('[data-route="auth.code"] [data-state="validation-error"]');
    assert(result.error, "code validation writes an error");
    return result;
  });

  await ready("orders.list", '[data-route="orders.list"] [data-module="order-list"]');
  for (const state of ["loading", "empty", "error"]) {
    await record(`orders.list:${state}`, `orders.list.${state}.renderer`, "production-view-render", async () => {
      await page.evaluate((value) => { window.AircovePortal.state.view = value; window.AircovePortal.go("orders.list"); }, state);
      const selector = state === "loading" ? '[data-route="orders.list"] .skeleton' : `[data-route="orders.list"] [data-state="${state}"]`;
      await page.waitForSelector(selector);
      return { selector, view: await page.evaluate(() => window.AircovePortal.state.view) };
    });
  }
  await record("orders.list:mobile-navigation-open", "orders.mobile-nav.action", "production-action-and-dom", async () => {
    await page.evaluate(() => { const p = window.AircovePortal; p.state.view = "ready"; p.go("orders.list"); p.ACTIONS["ui.toggleMobileNav"](); });
    await page.waitForSelector('[data-route="orders.list"] ~ * [data-state="mobile-navigation-open"], [data-module="app-shell"] [data-state="mobile-navigation-open"]');
    return { mobileNav: await page.evaluate(() => window.AircovePortal.state.mobileNav) };
  });
  await record("orders.list:drawer-open", "orders.booking-open.action", "production-action-and-dom", async () => {
    await page.evaluate(() => { const p = window.AircovePortal; p.go("orders.list"); p.ACTIONS["booking.open"](); });
    await page.waitForSelector('[data-module="drawer"][data-state="drawer-open"]');
    return { drawer: await page.evaluate(() => window.AircovePortal.state.drawer) };
  });
  await record("orders.list:pending-action", "orders.weather-pending.business-state", "production-fixture-and-dom", async () => {
    await page.evaluate(async () => { const p = window.AircovePortal; p.state.drawer = null; p.state.view = "ready"; await p.ACTIONS["theme.pick"]("HVAC"); p.go("orders.list"); });
    await page.waitForSelector('[data-route="orders.list"] [data-state="pending-action"]');
    return { weatherPending: await page.evaluate(() => window.AircovePortal.state.orders.some((order) => order.wt && order.wt.status === "pending")) };
  });
  await record("orders.list:success-toast", "orders.cancel.success-readback", "production-action-dom-and-readback", async () => {
    const result = await page.evaluate(async () => {
      const p = window.AircovePortal;
      await p.ACTIONS["theme.pick"]("HVAC");
      p.go("orders.list");
      const order = p.state.orders.find((item) => !["completed", "cancelled"].includes(item.status));
      p.ACTIONS["order.cancel"](order.id);
      return { id: order.id, status: p.state.orders.find((item) => item.id === order.id).status, toast: p.state.toast };
    });
    await page.waitForSelector('[data-module="toast"]');
    assert.equal(result.status, "cancelled");
    return result;
  });

  for (const [contractState, runtimeState] of [["scheduled", "scheduled"], ["inProgress", "inprogress"], ["completed", "completed"], ["cancelled", "cancelled"]]) {
    await record(`order.detail:${contractState}`, `order.detail.${contractState}.business-render`, "production-detail-render", async () => {
      const result = await page.evaluate(({ runtimeState }) => {
        const p = window.AircovePortal;
        const source = p.state.orders[0];
        const order = { ...source, id: `S7-${runtimeState}`, status: runtimeState };
        p.state.orders = [order, ...p.state.orders.slice(1)];
        if (p.state.moduleData.orders) p.state.moduleData.orders = { ...p.state.moduleData.orders, items: p.state.orders };
        p.state.currentOrderId = order.id;
        p.state.view = "ready";
        p.go("order.detail");
        return { id: order.id, status: runtimeState };
      }, { runtimeState });
      await page.waitForSelector(`[data-route="order.detail"][data-state="${runtimeState}"]`);
      return result;
    });
  }
  for (const state of ["loading", "error"]) {
    await record(`order.detail:${state}`, `order.detail.${state}.renderer`, "production-view-render", async () => {
      await page.evaluate((value) => { const p = window.AircovePortal; p.state.view = value; p.go("order.detail"); }, state);
      const selector = state === "loading" ? '[data-route="order.detail"] .skeleton' : '[data-route="order.detail"] [data-state="error"]';
      await page.waitForSelector(selector);
      return { selector, view: await page.evaluate(() => window.AircovePortal.state.view) };
    });
  }
  await record("order.detail:pending-action", "order.detail.weather-pending.business-state", "production-fixture-and-dom", async () => {
    const result = await page.evaluate(async () => {
      const p = window.AircovePortal;
      await p.ACTIONS["theme.pick"]("HVAC");
      const order = p.state.orders.find((item) => item.wt && item.wt.status === "pending");
      p.state.currentOrderId = order.id;
      p.state.view = "ready";
      p.go("order.detail");
      return { id: order.id, weatherStatus: order.wt.status };
    });
    await page.waitForSelector('[data-route="order.detail"] [data-state="pending-action"]');
    return result;
  });

  await page.evaluate(async () => window.AircovePortal.ACTIONS["theme.pick"]("HVAC"));
  await ready("services");
  await record("services:loading", "services.loading.renderer", "production-view-render", async () => {
    await page.evaluate(() => { const p = window.AircovePortal; p.state.view = "loading"; p.go("services"); });
    await page.waitForSelector('[data-route="services"] .skeleton');
    return { view: "loading" };
  });
  await ready("pricing", '[data-route="pricing"] [data-module="pricing-card"]');
  await ready("products", '[data-route="products"] [data-module="product-list"]');
  await record("products:empty", "products.empty.renderer", "production-view-render", async () => {
    await page.evaluate(() => { const p = window.AircovePortal; p.state.view = "empty"; p.go("products"); });
    await page.waitForSelector('[data-route="products"] [data-state="empty"]');
    return { view: "empty" };
  });
  await record("products:loading", "products.loading.renderer", "production-view-render", async () => {
    await page.evaluate(() => { const p = window.AircovePortal; p.state.view = "loading"; p.go("products"); });
    await page.waitForSelector('[data-route="products"] [data-state="loading"] .skeleton');
    return { view: "loading" };
  });

  await record("checkout:ready", "checkout.ready.with-cart", "production-action-and-render", async () => {
    const result = await page.evaluate(() => {
      const p = window.AircovePortal;
      p.state.view = "ready";
      const product = p.state.moduleData.products.items[0];
      p.ACTIONS["cart.addItem"](product.name);
      p.go("checkout");
      return { cartCount: p.state.cartItems.length };
    });
    await page.waitForSelector('[data-route="checkout"] [data-visual-id="checkout-summary"]');
    return result;
  });
  await record("checkout:empty", "checkout.empty.renderer", "production-state-render", async () => {
    await page.evaluate(() => { const p = window.AircovePortal; p.state.cartItems = []; p.state.view = "empty"; p.go("checkout"); });
    await page.waitForSelector('[data-route="checkout"] [data-state="empty"]');
    return { cartCount: 0 };
  });
  await record("checkout:success-toast", "checkout.place-order.success-readback", "production-command-dom-and-readback", async () => {
    await page.evaluate(() => {
      const p = window.AircovePortal;
      p.state.view = "ready";
      const product = p.state.moduleData.products.items[0];
      p.ACTIONS["cart.addItem"](product.name);
      p.go("checkout");
    });
    const before = await page.evaluate(() => window.AircovePortal.state.orders.filter((order) => order.id.startsWith("FX-")).length);
    await page.evaluate(() => {
      const button = document.querySelector('[data-route="checkout"] [data-action="checkout.placeOrder"]');
      button.click();
      button.click();
    });
    await page.waitForSelector('[data-module="toast"]');
    const result = await page.evaluate(async () => {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const p = window.AircovePortal;
      return {
        route: p.state.route,
        toast: p.state.toast,
        fixtureOrders: p.state.orders.filter((order) => order.id.startsWith("FX-")).length,
        pendingAcrossAnimationFrame: document.querySelector('[data-action="checkout.placeOrder"][data-state="pending-action"]') !== null || p.state.pending["checkout.placeOrder:_"] === true,
      };
    });
    assert.equal(result.fixtureOrders, before + 1, "rapid checkout clicks create exactly one fixture order");
    assert.equal(result.route, "orders.list");
    assert.equal(result.pendingAcrossAnimationFrame, false, "synchronous checkout does not render pending across an animation frame");
    return result;
  });

  await ready("proposals.list", '[data-route="proposals.list"] [data-module="proposal-list"]');
  await record("proposals.list:empty", "proposals.list.empty.renderer", "production-view-render", async () => {
    await page.evaluate(() => { const p = window.AircovePortal; p.state.view = "empty"; p.go("proposals.list"); });
    await page.waitForSelector('[data-route="proposals.list"] [data-state="empty"]');
    return { view: "empty" };
  });
  for (const state of ["unseen", "viewed", "approved", "revision", "declined"]) {
    await record(`proposal.detail:${state}`, `proposal.detail.${state}.business-render`, "production-detail-render", async () => {
      const result = await page.evaluate((value) => {
        const p = window.AircovePortal;
        const site = { ...p.state.psites[0], id: `s7-${value}`, status: value };
        p.state.psites = [site, ...p.state.psites.slice(1)];
        if (p.state.moduleData.proposals) p.state.moduleData.proposals = { ...p.state.moduleData.proposals, sites: p.state.psites };
        p.state.currentSiteId = site.id;
        p.state.view = "ready";
        p.go("proposal.detail");
        return { id: site.id, status: value };
      }, state);
      await page.waitForSelector(`[data-route="proposal.detail"][data-state="${state}"]`);
      return result;
    });
  }

  await ready("profile");
  await record("profile:success-toast", "profile.preference.success-readback", "production-action-dom-and-readback", async () => {
    const result = await page.evaluate(() => {
      const p = window.AircovePortal;
      p.go("profile");
      const before = p.state.prefs.marketing;
      p.ACTIONS["profile.togglePref"]("marketing");
      return { before, after: p.state.prefs.marketing, toast: p.state.toast };
    });
    await page.waitForSelector('[data-module="toast"]');
    assert.notEqual(result.before, result.after);
    return result;
  });
  await ready("activity", '[data-route="activity"] [data-module="activity-feed"]');
  await record("activity:empty", "activity.empty.filter", "production-filter-and-dom", async () => {
    await page.evaluate(() => { const p = window.AircovePortal; p.state.feedFilter = "__none__"; p.go("activity"); });
    await page.waitForSelector('[data-route="activity"] [data-state="empty"]');
    return { filter: "__none__" };
  });
  await ready("calendar", '[data-route="calendar"] [data-module="calendar-grid"]');
  await record("calendar:empty", "calendar.empty.renderer", "production-view-render", async () => {
    await page.evaluate(() => { const p = window.AircovePortal; p.state.view = "empty"; p.go("calendar"); });
    await page.waitForSelector('[data-route="calendar"][data-state="empty"] [data-state="empty"]');
    return { view: "empty" };
  });
  await ready("support", '[data-route="support"] [data-module="chat-composer"]');
  await record("support:validation-error", "support.composer.production-interactions", "production-dom-events-and-readback", async () => {
    const messageCount = async (text) => page.evaluate((value) => window.AircovePortal.state.messages.filter((message) => message.text === value).length, text);

    const buttonMessage = "S7 button submission";
    await page.locator('[data-route="support"] .composer__input').fill(buttonMessage);
    await page.evaluate(() => {
      const button = document.querySelector('[data-route="support"] [data-action="support.sendMessage"]');
      button.click();
      button.click();
    });
    assert.equal(await messageCount(buttonMessage), 1, "rapid button clicks append one message");

    const enterMessage = "S7 Enter submission";
    await page.locator('[data-route="support"] .composer__input').fill(enterMessage);
    await page.evaluate(() => {
      const input = document.querySelector('[data-route="support"] .composer__input');
      const event = () => new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true });
      input.dispatchEvent(event());
      input.dispatchEvent(event());
    });
    assert.equal(await messageCount(enterMessage), 1, "rapid Enter attempts append one message through the send control");

    const failuresBefore = browserFailures.length;
    await page.locator('[data-route="support"] .composer__input').fill("");
    await page.locator('[data-route="support"] .composer__input').press("Enter");
    const error = page.locator('[data-route="support"] [data-state="validation-error"][role="alert"]');
    await error.waitFor();
    const result = await page.evaluate(async () => {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const p = window.AircovePortal;
      return {
        buttonReadback: p.state.messages.filter((message) => message.text === "S7 button submission").length,
        enterReadback: p.state.messages.filter((message) => message.text === "S7 Enter submission").length,
        commandError: p.state.commandErrors["support.sendMessage:_"],
        pendingAcrossAnimationFrame: document.querySelector('[data-action="support.sendMessage"][data-state="pending-action"]') !== null || p.state.pending["support.sendMessage:_"] === true,
      };
    });
    assert.equal(browserFailures.length, failuresBefore, "empty Enter does not emit pageerror or console error");
    assert.equal(result.commandError, "Message is empty");
    assert.equal(await error.textContent(), result.commandError);
    assert.equal(result.pendingAcrossAnimationFrame, false, "synchronous support does not render pending across an animation frame");
    return result;
  });

  await record("care:ready", "care.ready.fixture-load", "production-adapter-and-dom", async () => {
    const result = await page.evaluate(async () => {
      const p = window.AircovePortal;
      await p.ACTIONS["theme.pick"]("HVAC");
      p.state.view = "ready";
      p.state.access.care = { status: "granted", reasonCode: null };
      p.state.carePayloadState = "ready";
      await p.runtime().reloadAsync("care");
      p.go("care");
      return { state: p.state.moduleData.care.state, phase: p.state.moduleData.care.phase };
    });
    await page.waitForSelector('[data-route="care"][data-state="ready"]');
    return result;
  });
  for (const state of ["loading", "empty", "error"]) {
    await record(`care:${state}`, `care.${state}.adapter-render`, "production-adapter-and-dom", async () => {
      const result = await page.evaluate(async (value) => {
        const p = window.AircovePortal;
        p.state.access.care = { status: "granted", reasonCode: null };
        p.state.carePayloadState = value;
        await p.runtime().reloadAsync("care").catch(() => null);
        p.go("care");
        return { state: p.state.moduleData.care.state, content: p.state.moduleData.care.content };
      }, state);
      await page.waitForSelector(`[data-route="care"][data-state="${state}"]`);
      assert.equal(result.state, state);
      return result;
    });
  }
  await record("care:disabled", "care.disabled.module-guard", "production-guard-and-dom", async () => {
    const result = await page.evaluate(() => {
      const p = window.AircovePortal;
      p.state.config.enabledModules = p.state.config.enabledModules.filter((module) => module !== "care");
      p.go("care");
      return { route: p.state.route, state: p.state.moduleData.care.state, access: p.state.moduleData.care.access.status };
    });
    await page.waitForSelector('[data-route="care"][data-state="disabled"]');
    return result;
  });
  await record("care:unauthorized", "care.unauthorized.entitlement-guard", "production-guard-and-dom", async () => {
    const result = await page.evaluate(() => {
      const p = window.AircovePortal;
      if (!p.state.config.enabledModules.includes("care")) p.state.config.enabledModules.push("care");
      p.state.access.care = { status: "not-entitled", reasonCode: "s7" };
      p.go("care");
      return { state: p.state.moduleData.care.state, access: p.state.moduleData.care.access.status };
    });
    await page.waitForSelector('[data-route="care"][data-state="unauthorized"] [data-state="unauthorized"]');
    return result;
  });

  await page.evaluate(async () => window.AircovePortal.ACTIONS["theme.pick"]("HVAC"));
  await ready("seo.landing", '[data-route="seo.landing"][data-state="ready"]');
  for (const state of ["loading", "empty"]) {
    await record(`seo.landing:${state}`, `seo.${state}.renderer`, "production-view-render", async () => {
      await page.evaluate((value) => { const p = window.AircovePortal; p.state.view = value; p.go("seo.landing"); }, state);
      await page.waitForSelector(`[data-route="seo.landing"][data-state="${state}"]`);
      const child = state === "loading" ? ".seo-skel" : '[data-state="empty"], [data-state="no-data"]';
      await page.waitForSelector(`[data-route="seo.landing"] ${child}`);
      return { view: state, child };
    });
  }
  for (const state of ["idle", "pending", "success", "error"]) {
    await record(`seo.landing:cta-${state}`, `seo.cta.${state}.renderer`, "production-lifecycle-render", async () => {
      await page.evaluate((value) => {
        const p = window.AircovePortal;
        p.state.view = "ready";
        p.state.seoCtaStates = { "seo.cta.book": value, "seo.cta.quote": value, "seo.cta.call": value, "seo.cta.services": value };
        p.go("seo.landing");
      }, state);
      await page.waitForSelector(`[data-route="seo.landing"] [data-module="seo-cta"][data-state="${state}"]`);
      return { ctaState: state };
    });
  }
  await record("seo.landing:service-selected", "seo.service-select.action-readback", "production-action-dom-and-readback", async () => {
    const result = await page.evaluate(() => {
      const p = window.AircovePortal;
      p.state.seoCtaStates = {};
      p.go("seo.landing");
      const control = document.querySelector('[data-action="seo.service.select"]');
      p.ACTIONS["seo.service.select"](control.dataset.id);
      return { id: control.dataset.id, selected: p.state.seoSelectedServiceId };
    });
    await page.waitForSelector('[data-route="seo.landing"] .seo-svc.is-selected');
    assert.equal(result.selected, result.id);
    return result;
  });
  await record("seo.landing:faq-open", "seo.faq-toggle.action-readback", "production-action-dom-and-readback", async () => {
    const result = await page.evaluate(() => {
      const p = window.AircovePortal;
      p.go("seo.landing");
      const control = document.querySelector('[data-action="seo.faq.toggle"]');
      p.ACTIONS["seo.faq.toggle"](control.dataset.id, control, null);
      return { id: control.dataset.id, open: p.state.seoFaqOpenId };
    });
    await page.waitForSelector('[data-route="seo.landing"] .seo-faq__item.is-open');
    assert.equal(result.open, result.id);
    return result;
  });

  const actual = [...passed].sort();
  const missing = expected.filter((id) => !passed.has(id));
  const unexpected = actual.filter((id) => !expected.includes(id));
  assert.deepEqual(missing, [], `missing executable state probes: ${missing.join(", ")}`);
  assert.deepEqual(unexpected, [], `unexpected state probes: ${unexpected.join(", ")}`);
  assert.equal(rows.every((row) => row.passed === true && row.checkId && row.method), true, "every state row has concrete passed proof");
  await page.close();
  return {
    expectedTotal: expected.length,
    passedTotal: actual.length,
    routes: Object.keys(implementedStates).length,
    routeDeclaredTotal: routeDeclaredStateIds.length,
    implementedStateIds: expected,
    routeDeclaredStateIds,
    rows,
    missing,
    unexpected,
    duplicates: [],
  };
}

async function prepareDetail(page, routeId) {
  if (routeId === "order.detail") await page.evaluate(() => { window.AircovePortal.state.currentOrderId = window.AircovePortal.state.orders[0].id; });
  if (routeId === "proposal.detail") await page.evaluate(() => { window.AircovePortal.state.currentSiteId = "s2"; });
}

function monitorPage(page, label) {
  page.on("pageerror", (error) => browserFailures.push(`${label} pageerror: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") browserFailures.push(`${label} console: ${message.text()}`); });
  page.on("requestfailed", (request) => networkFailures.push(`${label} requestfailed: ${request.url()} ${request.failure()?.errorText || "unknown"}`));
  page.on("response", (response) => {
    if (response.status() >= 400) networkFailures.push(`${label} response ${response.status()}: ${response.url()}`);
  });
}

async function startServer() {
  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url || "/", "http://127.0.0.1");
    const relative = url.pathname === "/" ? "/source.html" : url.pathname;
    const filePath = path.resolve(root, `.${decodeURIComponent(relative)}`);
    if (!filePath.startsWith(root)) { response.writeHead(403); response.end("Forbidden"); return; }
    try {
      let body = relative === "/source.html" ? Buffer.from(configuredSource(url.searchParams)) : await fs.readFile(filePath);
      response.writeHead(200, { "content-type": contentType(filePath) });
      response.end(body);
    } catch {
      response.writeHead(404); response.end("Not found");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return { server, url: `http://127.0.0.1:${server.address().port}/source.html` };
}

function configuredSource(search) {
  const values = { profile: search.get("profile"), vertical: search.get("vertical") };
  let html = source;
  for (const [name, value] of Object.entries(values)) {
    assert(value, `missing ${name} test config`);
    html = html.replace(new RegExp(`data-portal-${name}="[^"]*"`), `data-portal-${name}="${value}"`);
  }
  html = html.replace(/data-portal-theme="[^"]*"/, `data-portal-theme="${values.vertical}"`);
  return html;
}

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  return "application/octet-stream";
}

function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (!argv[index].startsWith("--")) throw new Error(`Unexpected argument: ${argv[index]}`);
    const key = argv[index].slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for --${key}`);
    values[key] = value;
    index += 1;
  }
  return values;
}

function assertInsideS7(filePath) {
  const s7Root = path.resolve("docs/stream-tasks/customer-portal-wave9-runtime-program/evidence/artifacts/S7");
  const relative = path.relative(s7Root, filePath);
  assert(relative && !relative.startsWith("..") && !path.isAbsolute(relative), "S7 output must be inside artifacts/S7");
}
