import { createRequire } from "node:module";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  if (process.argv[i].startsWith("--")) {
    const key = process.argv[i].slice(2);
    const next = process.argv[i + 1];
    if (!next || next.startsWith("--")) args.set(key, "true");
    else {
      args.set(key, next);
      i += 1;
    }
  }
}

const root = path.resolve(args.get("root") || "app-templates/customer-portal/runtime");
const entry = "/" + (args.get("entry") || "source.html").replace(/^\/+/, "");
const profileContracts = {
  onDemand: {
    verticals: ["hvac"],
    nav: [
      { key: "orders.list", label: "Orders" },
      { key: "care", label: null },
      { key: "proposals.list", label: "Proposals" },
      { key: "services", label: "Services" },
      { key: "pricing", label: "Pricing" },
      { key: "products", label: "Products" },
      { key: "support", label: "Support" },
    ],
    modules: ["orders", "calendar", "activity", "proposals", "care", "services", "pricing", "products", "checkout", "profile", "support"],
    primary: { label: "+ Book", action: "booking.open" },
    weatherCalendar: false,
    calendarVariant: "month",
    showCart: true,
    drawerTitle: "Book a service",
  },
  stormOps: {
    verticals: ["snow", "lawn", "pool", "roofing", "pest"],
    nav: [
      { key: "orders.list", label: "Home" },
      { key: "calendar", label: "Calendar" },
      { key: "care", label: null },
      { key: "proposals.list", label: "Contracts" },
      { key: "services", label: "Services" },
      { key: "activity", label: "Activity" },
      { key: "support", label: "Support" },
    ],
    modules: ["orders", "calendar", "activity", "proposals", "care", "services", "profile", "support"],
    primary: { label: "Request service", action: "service.request" },
    weatherCalendar: true,
    calendarVariant: "storm",
    showCart: false,
    drawerTitle: "Request service",
  },
  appointments: {
    verticals: ["health", "beauty"],
    nav: [
      { key: "orders.list", label: "Appointments" },
      { key: "calendar", label: "Calendar" },
      { key: "care", label: null },
      { key: "services", label: "Services" },
      { key: "pricing", label: "Pricing" },
      { key: "products", label: "Products" },
      { key: "support", label: "Support" },
    ],
    modules: ["orders", "calendar", "care", "services", "pricing", "products", "checkout", "profile", "support"],
    primary: { label: "+ Book", action: "booking.open" },
    weatherCalendar: false,
    calendarVariant: "month",
    showCart: true,
    drawerTitle: "Book an appointment",
  },
};
const verticalContracts = [
  { slug: "hvac", displayName: "HVAC", profile: "onDemand", theme: "hvac", careLabel: "Equipment" },
  { slug: "snow", displayName: "Snow Removal", profile: "stormOps", theme: "snow", careLabel: "Season log" },
  { slug: "lawn", displayName: "Lawn & Garden", profile: "stormOps", theme: "lawn", careLabel: "Program" },
  { slug: "pool", displayName: "Pool & Spa", profile: "stormOps", theme: "pool", careLabel: "Water" },
  { slug: "roofing", displayName: "Roofing", profile: "stormOps", theme: "roofing", careLabel: "Roof report" },
  { slug: "pest", displayName: "Pest Control", profile: "stormOps", theme: "pest", careLabel: "Monitoring" },
  { slug: "health", displayName: "Health", profile: "appointments", theme: "health", careLabel: "Care plan" },
  { slug: "beauty", displayName: "Beauty", profile: "appointments", theme: "beauty", careLabel: "My routine" },
];
const playwrightNodeModules = process.env.PLAYWRIGHT_NODE_MODULES;
const requireFrom = playwrightNodeModules
  ? createRequire(path.join(playwrightNodeModules, "package.json"))
  : createRequire(import.meta.url);
const { chromium } = requireFrom("playwright");

await validateStaticContracts();

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  return "application/octet-stream";
}

async function startServer() {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    const relative = url.pathname === "/" ? entry : url.pathname;
    const filePath = path.resolve(root, `.${decodeURIComponent(relative)}`);
    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }
    try {
      const body = await fs.readFile(filePath);
      res.writeHead(200, { "content-type": contentType(filePath) });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end("Not found");
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  return { server, url: `http://127.0.0.1:${address.port}${entry}` };
}

async function withConfig(page, config) {
  await page.addInitScript((dataset) => {
    document.addEventListener("DOMContentLoaded", () => {
      const mount = document.getElementById("app");
      for (const [key, value] of Object.entries(dataset)) {
        if (value === null) delete mount.dataset[key];
        else mount.dataset[key] = value;
      }
    }, { once: true });
  }, config);
}

const { server, url } = await startServer();
const launchOptions = { headless: true };
if (process.env.PLAYWRIGHT_EXECUTABLE_PATH) {
  launchOptions.executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH;
}
const browser = await chromium.launch(launchOptions);

try {
  const guarded = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await withConfig(guarded, {
    portalAuthMode: "required",
    portalDefaultRoute: "support",
    portalEnabledModules: "orders,support",
    portalErrorMode: "fallback",
    portalVertical: "hvac",
  });
  await guarded.goto(url, { waitUntil: "networkidle" });
  await guarded.waitForFunction(() => window.AircovePortal && window.AircovePortal.go);
  await guarded.waitForSelector('[data-route="auth.phone"]', { timeout: 2000 });
  await guarded.evaluate(() => {
    const config = window.AircovePortal.state.config;
    if (window.AircovePortal.state.session.authenticated !== false) {
      throw new Error("portal_auth_mode=required did not start unauthenticated");
    }
    if (config.defaultRoute !== "support") throw new Error(`defaultRoute is ${config.defaultRoute}`);
    if (config.errorMode !== "fallback") throw new Error(`errorMode is ${config.errorMode}`);
    if (config.enabledModules.join(",") !== "orders,support") {
      throw new Error(`enabledModules are ${config.enabledModules.join(",")}`);
    }
    window.AircovePortal.state.session.authenticated = true;
    window.AircovePortal.go("products");
  });
  await guarded.waitForSelector('[data-route="support"]', { timeout: 2000 });
  const navLabels = await guarded.locator(".nav-links .nav-link").allTextContents();
  if (navLabels.join(",") !== "Orders,Support") {
    throw new Error(`disabled modules leaked into navigation: ${navLabels.join(",")}`);
  }
  await guarded.evaluate(() => {
    window.AircovePortal.go("__missing__");
  });
  await guarded.waitForSelector('[data-route="support"]', { timeout: 2000 });
  await guarded.close();

  const disabledDefault = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await withConfig(disabledDefault, {
    portalDefaultRoute: "pricing",
    portalEnabledModules: "support",
    portalVertical: "hvac",
  });
  await disabledDefault.goto(url, { waitUntil: "networkidle" });
  await disabledDefault.waitForFunction(() => window.AircovePortal && window.AircovePortal.go);
  await disabledDefault.evaluate(() => {
    window.AircovePortal.state.session.authenticated = true;
    window.AircovePortal.go("products");
  });
  await disabledDefault.waitForSelector('[data-route="support"]', { timeout: 2000 });
  const disabledDefaultRoute = await disabledDefault.locator("[data-route]").first().getAttribute("data-route");
  if (disabledDefaultRoute === "pricing" || disabledDefaultRoute === "products") {
    throw new Error(`disabled default route rendered ${disabledDefaultRoute}`);
  }
  await disabledDefault.close();

  const themeOverride = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await withConfig(themeOverride, {
    portalVertical: "hvac",
    portalTheme: "snow",
  });
  await themeOverride.goto(url, { waitUntil: "networkidle" });
  await themeOverride.waitForFunction(() => window.AircovePortal && window.AircovePortal.go);
  const appliedTheme = await themeOverride.evaluate(() => ({
    configVertical: window.AircovePortal.state.config.vertical,
    configTheme: window.AircovePortal.state.config.theme,
    stateTheme: window.AircovePortal.state.theme,
    documentTheme: document.documentElement.dataset.theme,
    firstOrder: window.AircovePortal.state.orders[0]?.name,
  }));
  if (appliedTheme.configVertical !== "hvac" || appliedTheme.configTheme !== "snow" || appliedTheme.stateTheme !== "HVAC" || appliedTheme.documentTheme !== "snow" || appliedTheme.firstOrder !== "Filter replacement") {
    throw new Error(`portal_theme override was not applied: ${JSON.stringify(appliedTheme)}`);
  }
  await themeOverride.close();

  const visualThemeOverrides = [
    { vertical: "health", displayName: "Health", firstOrder: "Home care visit", firstService: "Home Care Visit", careLabel: "Care plan" },
    { vertical: "beauty", displayName: "Beauty", firstOrder: "Blowout & style", firstService: "Hair Styling", careLabel: "My routine" },
  ];
  for (const expected of visualThemeOverrides) {
    const visualOverride = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await withConfig(visualOverride, {
      portalVertical: expected.vertical,
      portalTheme: "snow",
      portalProfile: null,
    });
    await visualOverride.goto(url, { waitUntil: "networkidle" });
    await visualOverride.waitForFunction(() => window.AircovePortal && window.AircovePortal.go);
    const result = await visualOverride.evaluate(() => {
      const fixture = window.AircoveFixtures.themes[window.AircovePortal.state.theme];
      const feedText = window.AircoveFixtures.buildFeed(fixture)
        .flatMap((group) => group.items)
        .map((item) => `${item.title} ${item.desc}`)
        .join(" ");
      return {
        configVertical: window.AircovePortal.state.config.vertical,
        configTheme: window.AircovePortal.state.config.theme,
        profile: window.AircovePortal.state.config.profile,
        stateTheme: window.AircovePortal.state.theme,
        documentTheme: document.documentElement.dataset.theme,
        firstOrder: window.AircovePortal.state.orders[0]?.name,
        firstService: fixture.svc[0]?.name,
        weatherOrders: window.AircovePortal.state.orders.filter((order) => order.wt).length,
        weatherFeed: /weather trigger/i.test(feedText),
        weatherDom: document.querySelectorAll('[data-visual-id="weather-banner"], [data-visual-id="weather-card"]').length,
        nav: Array.from(document.querySelectorAll(".nav-links .nav-link"), (node) => node.textContent),
      };
    });
    assert.equal(result.configVertical, expected.vertical, `${expected.vertical} business vertical`);
    assert.equal(result.configTheme, "snow", `${expected.vertical} visual config theme`);
    assert.equal(result.documentTheme, "snow", `${expected.vertical} document theme`);
    assert.equal(result.profile, "appointments", `${expected.vertical} profile under visual override`);
    assert.equal(result.stateTheme, expected.displayName, `${expected.vertical} content state`);
    assert.equal(result.firstOrder, expected.firstOrder, `${expected.vertical} fixture orders`);
    assert.equal(result.firstService, expected.firstService, `${expected.vertical} fixture services`);
    assert.equal(result.weatherOrders, 0, `${expected.vertical} weather orders`);
    assert.equal(result.weatherFeed, false, `${expected.vertical} weather feed`);
    assert.equal(result.weatherDom, 0, `${expected.vertical} weather DOM`);
    assert.deepEqual(result.nav, visibleNav(profileContracts.appointments, expected.careLabel), `${expected.vertical} nav under visual override`);
    await visualOverride.evaluate(() => window.AircovePortal.go("calendar"));
    await visualOverride.waitForSelector('[data-route="calendar"][data-visual-id="calendar"]', { timeout: 2000 });
    if (await visualOverride.locator('[data-visual-id="storm-calendar"], [data-visual-id="weather-card"], [data-visual-id="weather-banner"]').count()) {
      throw new Error(`${expected.vertical} visual Snow theme enabled weather UI`);
    }
    await visualOverride.close();
  }

  const profileOverride = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await withConfig(profileOverride, {
    portalVertical: "hvac",
    portalProfile: "stormOps",
  });
  await profileOverride.goto(url, { waitUntil: "networkidle" });
  await profileOverride.waitForFunction(() => window.AircovePortal && window.AircovePortal.go);
  const overrideContract = await profileOverride.evaluate(() => {
    const primary = document.querySelector('[data-visual-id="primary-cta"]');
    return {
      profile: window.AircovePortal.state.config.profile,
      enabledModules: window.AircovePortal.state.config.enabledModules,
      nav: Array.from(document.querySelectorAll(".nav-links .nav-link"), (node) => node.textContent),
      primary: { label: primary?.textContent.trim() || "", action: primary?.getAttribute("data-action") || "" },
      cart: Boolean(document.querySelector('[title="Cart"]')),
    };
  });
  assert.equal(overrideContract.profile, "stormOps", "explicit HVAC + stormOps profile");
  assert.deepEqual(overrideContract.enabledModules, profileContracts.stormOps.modules, "explicit profile modules");
  assert.deepEqual(overrideContract.nav, visibleNav(profileContracts.stormOps, "Equipment"), "explicit profile nav");
  assert.deepEqual(overrideContract.primary, profileContracts.stormOps.primary, "explicit profile primary");
  assert.equal(overrideContract.cart, false, "explicit stormOps cart");
  await profileOverride.waitForSelector('[data-route="orders.list"][data-visual-id="storm-home"]', { timeout: 2000 });
  await profileOverride.evaluate(() => window.AircovePortal.go("calendar"));
  await profileOverride.waitForSelector('[data-route="calendar"][data-visual-id="storm-calendar"]', { timeout: 2000 });
  await profileOverride.close();

  for (const vertical of verticalContracts) {
    const expectedProfile = profileContracts[vertical.profile];
    const matrixPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await withConfig(matrixPage, {
      portalVertical: vertical.slug,
      portalTheme: null,
      portalProfile: null,
    });
    await matrixPage.goto(url, { waitUntil: "networkidle" });
    await matrixPage.waitForFunction(() => window.AircovePortal && window.AircovePortal.go);
    const result = await matrixPage.evaluate(() => {
      const primary = document.querySelector('[data-visual-id="primary-cta"]');
      return {
        profile: window.AircovePortal.state.config.profile,
        theme: document.documentElement.dataset.theme,
        nav: Array.from(document.querySelectorAll(".nav-links .nav-link"), (node) => node.textContent),
        enabledModules: window.AircovePortal.state.config.enabledModules,
        primary: { label: primary?.textContent.trim() || "", action: primary?.getAttribute("data-action") || "" },
        cart: Boolean(document.querySelector('[title="Cart"]')),
        hasCmsEntitlementDefault: Object.keys(window.AircovePortal.state.config).some((key) => /care.*(access|entitlement)|entitlement.*care/i.test(key)),
      };
    });
    assert.equal(result.profile, vertical.profile, `${vertical.slug} profile`);
    assert.equal(result.theme, vertical.theme, `${vertical.slug} theme`);
    assert.deepEqual(result.nav, visibleNav(expectedProfile, vertical.careLabel), `${vertical.slug} visible nav`);
    assert.deepEqual(result.enabledModules, expectedProfile.modules, `${vertical.slug} enabled modules`);
    assert.deepEqual(result.primary, expectedProfile.primary, `${vertical.slug} primary`);
    assert.equal(result.cart, expectedProfile.showCart, `${vertical.slug} cart visibility`);
    assert.equal(result.hasCmsEntitlementDefault, false, `${vertical.slug} CMS Care entitlement default`);

    await matrixPage.evaluate(() => window.AircovePortal.go("calendar"));
    const expectedCalendar = expectedProfile.calendarVariant === "storm" ? "storm-calendar" : "calendar";
    await matrixPage.waitForSelector(`[data-route="calendar"][data-visual-id="${expectedCalendar}"]`, { timeout: 2000 });
    const wrongCalendar = expectedCalendar === "storm-calendar" ? "calendar" : "storm-calendar";
    if (await matrixPage.locator(`[data-route="calendar"][data-visual-id="${wrongCalendar}"]`).count()) {
      throw new Error(`${vertical.slug} rendered wrong calendar variant`);
    }
    if (vertical.profile === "appointments") {
      const body = await matrixPage.locator("body").innerText();
      if (/weather trigger|undefined/i.test(body)) throw new Error(`${vertical.slug} rendered weather/undefined content`);
      if (await matrixPage.locator('[data-visual-id="storm-calendar"], [data-visual-id="weather-card"], [data-visual-id="weather-banner"]').count()) {
        throw new Error(`${vertical.slug} rendered weather-only UI`);
      }
      await matrixPage.evaluate(() => window.AircovePortal.go("activity"));
      await matrixPage.waitForSelector('[data-route="orders.list"]', { timeout: 2000 });
      const disabledActivity = await matrixPage.evaluate(() => ({
        route: window.AircovePortal.state.route,
        enabled: window.AircovePortal.state.config.enabledModules.includes("activity"),
      }));
      if (disabledActivity.route !== "orders.list" || disabledActivity.enabled) {
        throw new Error(`appointments activity guard failed: ${JSON.stringify(disabledActivity)}`);
      }
    }
    await matrixPage.close();
  }

  for (const vertical of ["health", "beauty"]) {
    const invalidWeatherProfile = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await withConfig(invalidWeatherProfile, { portalVertical: vertical, portalTheme: "snow", portalProfile: "stormOps" });
    await invalidWeatherProfile.goto(url, { waitUntil: "networkidle" });
    await invalidWeatherProfile.waitForFunction(() => window.AircovePortal && window.AircovePortal.go);
    const safeProfile = await invalidWeatherProfile.evaluate(() => ({
      profile: window.AircovePortal.state.config.profile,
      content: window.AircovePortal.state.theme,
      documentTheme: document.documentElement.dataset.theme,
      weatherOrders: window.AircovePortal.state.orders.filter((order) => order.wt).length,
    }));
    assert.deepEqual(safeProfile, {
      profile: "appointments",
      content: vertical === "health" ? "Health" : "Beauty",
      documentTheme: "snow",
      weatherOrders: 0,
    }, `${vertical} rejects stormOps under weather-capable visual theme`);
    await invalidWeatherProfile.close();
  }

  const careGuards = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await withConfig(careGuards, { portalVertical: "hvac", portalTheme: null, portalProfile: null });
  await careGuards.goto(url, { waitUntil: "networkidle" });
  await careGuards.waitForFunction(() => window.AircovePortal && window.AircovePortal.go);
  await careGuards.evaluate(() => window.AircovePortal.go("care"));
  await careGuards.waitForSelector('[data-route="care"][data-access="granted"][data-state="ready"]', { timeout: 2000 });
  await careGuards.evaluate(() => {
    window.AircovePortal.state.access.care = { status: "not-entitled", reasonCode: "plan" };
    window.AircovePortal.go("care");
  });
  await careGuards.waitForSelector('[data-route="care"][data-state="unauthorized"][data-access="not-entitled"][data-reason-code="plan"]', { timeout: 2000 });
  await careGuards.evaluate(() => {
    window.AircovePortal.state.access.care = { status: "forbidden", reasonCode: "permission" };
    window.AircovePortal.go("care");
  });
  await careGuards.waitForSelector('[data-route="care"][data-state="unauthorized"][data-access="forbidden"][data-reason-code="permission"]', { timeout: 2000 });
  await careGuards.evaluate(() => {
    window.AircovePortal.state.config.enabledModules = window.AircovePortal.state.config.enabledModules.filter((id) => id !== "care");
    window.AircovePortal.go("care");
  });
  await careGuards.waitForSelector('[data-route="care"][data-state="disabled"][data-access="disabled"][data-reason-code="module-disabled"]', { timeout: 2000 });
  await careGuards.evaluate(() => {
    window.AircovePortal.state.config.enabledModules.push("care");
    window.AircovePortal.state.session.authenticated = false;
    window.AircovePortal.go("care");
  });
  await careGuards.waitForSelector('[data-route="auth.phone"]', { timeout: 2000 });
  await careGuards.evaluate(() => window.AircovePortal.go("seo.landing"));
  await careGuards.waitForSelector('[data-route="seo.landing"][data-state="ready"] [data-module="seo-hero"]', { timeout: 2000 });
  const careIsolation = await careGuards.evaluate(() => ({
    intended: window.AircovePortal.state.session.intendedRoute,
    status: window.AircovePortal.state.moduleStatus.care,
    data: window.AircovePortal.state.moduleData.care,
  }));
  if (careIsolation.intended !== "care"
    || careIsolation.status !== "unauthorized"
    || !careIsolation.data
    || careIsolation.data.phase !== "preflight"
    || careIsolation.data.access.status !== "unauthenticated"
    || careIsolation.data.content !== null
    || careIsolation.data.kind !== null
    || careIsolation.data.allowedActions.length !== 0) {
    throw new Error(`Care control-plane isolation failed: ${JSON.stringify(careIsolation)}`);
  }
  await careGuards.close();

  const historyRouter = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await withConfig(historyRouter, { portalVertical: "hvac", portalRouterMode: "history" });
  await historyRouter.goto(url, { waitUntil: "networkidle" });
  await historyRouter.waitForFunction(() => window.AircovePortal && window.AircovePortal.go);
  const historyResult = await historyRouter.evaluate(() => {
    window.AircovePortal.ACTIONS["order.open"]("#SV-2381");
    const orderPath = window.location.pathname;
    window.history.pushState({}, "", "/proposals/s4?view=map");
    window.dispatchEvent(new PopStateEvent("popstate"));
    const proposal = { route: window.AircovePortal.state.route, id: window.AircovePortal.state.currentSiteId };
    window.AircovePortal.go("proposals.list");
    const proposalListUrl = window.location.pathname + window.location.search;
    window.AircovePortal.go("support");
    const unrelatedUrl = window.location.pathname + window.location.search;
    window.AircovePortal.ACTIONS["order.open"]("#SV-2402");
    const nextOrderUrl = window.location.pathname + window.location.search;
    window.history.pushState({}, "", "/orders/%E0%A4%A?bad=1");
    window.dispatchEvent(new PopStateEvent("popstate"));
    const malformedRoute = window.AircovePortal.state.route;
    window.AircovePortal.go("support");
    const afterMalformedUrl = window.location.pathname + window.location.search;
    return { orderPath, proposal, proposalListUrl, unrelatedUrl, nextOrderUrl, malformedRoute, afterMalformedUrl };
  });
  if (historyResult.orderPath !== "/orders/%23SV-2381" || historyResult.proposal.route !== "proposal.detail" || historyResult.proposal.id !== "s4" || historyResult.proposalListUrl !== "/proposals?view=map" || historyResult.unrelatedUrl !== "/support" || historyResult.nextOrderUrl !== "/orders/%23SV-2402" || historyResult.malformedRoute !== "orders.list" || historyResult.afterMalformedUrl !== "/support") {
    throw new Error(`history detail/query round trip failed: ${JSON.stringify(historyResult)}`);
  }
  await historyRouter.close();

  const memoryRouter = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await withConfig(memoryRouter, { portalVertical: "hvac", portalRouterMode: "memory" });
  await memoryRouter.goto(url, { waitUntil: "networkidle" });
  await memoryRouter.waitForFunction(() => window.AircovePortal && window.AircovePortal.go);
  const memoryResult = await memoryRouter.evaluate(() => {
    const before = window.location.href;
    window.AircovePortal.state.routeQuery = "?tab=invoice";
    window.AircovePortal.state.routeQueryOwner = "orders";
    window.AircovePortal.ACTIONS["order.open"]("#SV-2381");
    window.AircovePortal.go("support");
    return { before, after: window.location.href, route: window.AircovePortal.state.route, id: window.AircovePortal.state.currentOrderId, query: window.AircovePortal.state.routeQuery, owner: window.AircovePortal.state.routeQueryOwner };
  });
  if (memoryResult.before !== memoryResult.after || memoryResult.route !== "support" || memoryResult.id !== "#SV-2381" || memoryResult.query !== "" || memoryResult.owner !== null) {
    throw new Error(`memory detail route failed: ${JSON.stringify(memoryResult)}`);
  }
  await memoryRouter.close();

  const modePersistence = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await withConfig(modePersistence, { portalVertical: "health", portalTheme: null, portalProfile: null, portalDefaultMode: "dark" });
  await modePersistence.goto(url, { waitUntil: "networkidle" });
  await modePersistence.waitForFunction(() => window.AircovePortal && window.AircovePortal.go);
  const persistedMode = await modePersistence.evaluate(() => {
    window.AircovePortal.ACTIONS["ui.toggleMode"]();
    window.AircovePortal.ACTIONS["theme.pick"]("Beauty");
    window.AircovePortal.go("calendar");
    return document.documentElement.dataset.mode;
  });
  if (persistedMode !== "light") throw new Error(`user mode was clobbered by rerender/theme switch: ${persistedMode}`);
  await modePersistence.close();

  const fallback = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await withConfig(fallback, {
    portalDataMode: "live",
    portalErrorMode: "fallback",
    portalPimFixtureUrl: "/missing-core-pim-fixture.json",
    portalVertical: "hvac",
  });
  await fallback.goto(url, { waitUntil: "networkidle" });
  await fallback.waitForFunction(() => window.AircovePortal && window.AircovePortal.go);
  await fallback.waitForSelector('[data-visual-id="route-fallback"][data-state="fallback"]', { timeout: 3000 });
  await fallback.close();

  const retry = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  let retryRequests = 0;
  retry.on("request", (request) => {
    if (request.url().includes("missing-core-pim-fixture.json")) retryRequests += 1;
  });
  await withConfig(retry, {
    portalDataMode: "live",
    portalErrorMode: "error",
    portalPimFixtureUrl: "/missing-core-pim-fixture.json",
    portalVertical: "hvac",
  });
  await retry.goto(url, { waitUntil: "networkidle" });
  await retry.waitForSelector('[data-visual-id="error-state"][data-state="error"]', { timeout: 3000 });
  const requestsBeforeRetry = retryRequests;
  const retryResult = await retry.evaluate(async () => {
    const first = window.AircovePortal.ACTIONS["ui.retry"]();
    const second = window.AircovePortal.ACTIONS["ui.retry"]();
    if (first !== second) throw new Error("ui.retry started duplicate live loads");
    const loading = window.AircovePortal.state.view === "loading";
    await first;
    return { loading, view: window.AircovePortal.state.view };
  });
  if (!retryResult.loading) throw new Error("ui.retry did not expose loading state");
  if (retryResult.view !== "error") throw new Error(`ui.retry ended in ${retryResult.view}`);
  if (retryRequests <= requestsBeforeRetry) throw new Error("ui.retry did not issue a new PIM request");
  await retry.waitForSelector('[data-visual-id="error-state"][data-state="error"]', { timeout: 3000 });
  await retry.close();
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

console.log(`config-behavior-check ok: ${root}`);

function visibleNav(profile, careLabel) {
  return profile.nav.map((item) => item.key === "care" ? careLabel : item.label);
}

async function validateStaticContracts() {
  const manifest = JSON.parse(await fs.readFile(path.join(root, "manifest.json"), "utf8"));
  const config = await import(pathToFileURL(path.join(root, "src/config.js")).href);

  assert.deepEqual(Object.keys(config.portalProfiles).sort(), Object.keys(profileContracts).sort(), "runtime profile ids");
  assert.deepEqual(Object.keys(manifest.portalProfiles.profiles).sort(), Object.keys(profileContracts).sort(), "manifest profile ids");
  assert.match(manifest.themingContract.note, /config\.theme.*CSS tokens only/, "manifest visual theme axis");
  assert.match(manifest.themingContract.note, /config\.vertical.*fixture\/content\/business behavior/, "manifest business vertical axis");
  assert.equal(config.resolveProfile("health", "stormOps"), "appointments", "Health rejects stormOps by business capability");
  assert.equal(config.resolveProfile("beauty", "stormOps"), "appointments", "Beauty rejects stormOps by business capability");
  assert.equal(config.resolveProfile("hvac", "stormOps"), "stormOps", "HVAC accepts explicit stormOps");
  assert.deepEqual(
    pick(config.readPortalConfig({ dataset: { portalTheme: "snow" } }), ["vertical", "theme", "profile"]),
    { vertical: "hvac", theme: "snow", profile: "onDemand" },
    "visual theme alone does not select business vertical",
  );

  for (const [profileId, expected] of Object.entries(profileContracts)) {
    const runtimeProfile = config.portalProfiles[profileId];
    assert.equal(runtimeProfile.id, profileId, `${profileId} runtime id`);
    assert.deepEqual(runtimeProfile.nav.map((item) => ({ key: item.key, label: item.label || null })), expected.nav, `${profileId} runtime nav`);
    assert.deepEqual(runtimeProfile.modules, expected.modules, `${profileId} runtime modules`);
    assert.deepEqual(runtimeProfile.primary, expected.primary, `${profileId} runtime primary`);
    assert.equal(runtimeProfile.weatherCalendar, expected.weatherCalendar, `${profileId} runtime weatherCalendar`);
    assert.equal(runtimeProfile.showCart, expected.showCart, `${profileId} runtime showCart`);
    assert.equal(runtimeProfile.drawerTitle, expected.drawerTitle, `${profileId} runtime drawerTitle`);

    const manifestProfile = manifest.portalProfiles.profiles[profileId];
    const expectedVerticalNames = expected.verticals.map((slug) => config.verticalProfiles[slug].displayName);
    const expectedManifestNav = expected.nav.map((item) => item.key === "care"
      ? { key: "care", labelSource: "verticalProfiles.careNavLabel" }
      : { key: item.key, label: item.label });
    assert.deepEqual(manifestProfile.verticals, expectedVerticalNames, `${profileId} manifest verticals`);
    assert.deepEqual(manifestProfile.nav, expectedManifestNav, `${profileId} manifest nav`);
    assert.deepEqual(manifestProfile.enabledModules, expected.modules, `${profileId} manifest modules`);
    assert.deepEqual(manifestProfile.primary, expected.primary, `${profileId} manifest primary`);
    assert.equal(manifestProfile.weatherCalendar, expected.weatherCalendar, `${profileId} manifest weatherCalendar`);
    assert.equal(manifestProfile.calendarVariant, expected.calendarVariant, `${profileId} manifest calendarVariant`);
    assert.equal(manifestProfile.showCart, expected.showCart, `${profileId} manifest showCart`);
    assert.equal(manifestProfile.drawerTitle, expected.drawerTitle, `${profileId} manifest drawerTitle`);
  }

  for (const expected of verticalContracts) {
    const runtimeVertical = config.verticalProfiles[expected.slug];
    assert.equal(runtimeVertical.displayName, expected.displayName, `${expected.slug} displayName`);
    assert.equal(runtimeVertical.profile, expected.profile, `${expected.slug} default profile`);
    assert.equal(runtimeVertical.careNavLabel, expected.careLabel, `${expected.slug} Care label`);
    assert.deepEqual(runtimeVertical.modules, profileContracts[expected.profile].modules, `${expected.slug} default modules`);
  }

  const srcJs = await countFiles(path.join(root, "src"), (name) => name.endsWith(".js"));
  const runtimeJs = await countFiles(root, (name) => name.endsWith(".js"));
  const stylesheets = await countFiles(path.join(root, "styles"), (name) => name.endsWith(".css"));
  assert.deepEqual(manifest.fileInventory, { stylesheets, srcJavaScript: srcJs, runtimeJavaScript: runtimeJs }, "manifest file inventory");
  assert.deepEqual(manifest.fileInventory, { stylesheets: 7, srcJavaScript: 70, runtimeJavaScript: 73 }, "accepted S3 file inventory");

  const stateGrammar = manifest.dataAttributes["data-state"];
  for (const stateName of ["ready", "loading", "empty", "error", "fallback", "disabled", "unauthorized", "validation-error", "pending-action", "success-toast", "drawer-open", "mobile-navigation-open", "active"]) {
    assert.match(stateGrammar, new RegExp(`(?:^|[^a-z-])${stateName}(?:$|[^a-z-])`), `manifest data-state grammar: ${stateName}`);
  }
}

async function countFiles(directory, predicate) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  let count = 0;
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) count += await countFiles(entryPath, predicate);
    else if (predicate(entry.name)) count += 1;
  }
  return count;
}

function pick(value, keys) {
  return Object.fromEntries(keys.map((key) => [key, value[key]]));
}
