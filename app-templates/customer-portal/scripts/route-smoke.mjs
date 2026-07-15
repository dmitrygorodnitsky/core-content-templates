import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const defaultRoutes = [
  "landing",
  "seo.landing",
  "auth.phone",
  "auth.code",
  "orders.list",
  "order.detail",
  "calendar",
  "activity",
  "services",
  "pricing",
  "products",
  "checkout",
  "proposals.list",
  "proposal.detail",
  "profile",
  "support",
  "care",
];

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
const routes = args.get("routes") ? args.get("routes").split(",").map((route) => route.trim()).filter(Boolean) : defaultRoutes;
const pimFixturePath = path.resolve("docs/cms-components/lab-ui/14-pricing/_fixtures/saas.json");
const allowDevToolbar = args.get("allow-dev-toolbar") === "true";
const playwrightNodeModules = process.env.PLAYWRIGHT_NODE_MODULES;
const requireFrom = playwrightNodeModules
  ? createRequire(path.join(playwrightNodeModules, "package.json"))
  : createRequire(import.meta.url);
const { chromium } = requireFrom("playwright");

function contentType(filePath) {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".png")) return "image/png";
  return "application/octet-stream";
}

async function startServer() {
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    if (url.pathname === "/__fixtures__/core-pim-saas.json") {
      try {
        const body = await fs.readFile(pimFixturePath);
        res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
        res.end(body);
      } catch {
        res.writeHead(404);
        res.end("Not found");
      }
      return;
    }
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

const { server, url } = await startServer();
const launchOptions = { headless: true };
if (process.env.PLAYWRIGHT_EXECUTABLE_PATH) {
  launchOptions.executablePath = process.env.PLAYWRIGHT_EXECUTABLE_PATH;
}
const browser = await chromium.launch(launchOptions);
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const failures = [];

page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
page.on("console", (message) => {
  if (message.type() === "error") failures.push(`console error: ${message.text()}`);
});

try {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.AircovePortal && window.AircovePortal.go);

  if (!allowDevToolbar && await page.locator("[data-dev-toolbar]").count()) {
    failures.push("runtime contains data-dev-toolbar");
  }

  for (const route of routes) {
    await page.evaluate((routeId) => {
      window.AircovePortal.go(routeId);
    }, route);
    await page.waitForSelector(`[data-route="${route}"]`, { timeout: 2000 });
  }

  await page.evaluate(() => {
    window.AircovePortal.go("__missing__");
  });
  await page.waitForSelector('[data-route="orders.list"]', { timeout: 2000 });

  await page.evaluate(() => {
    window.AircovePortal.state.session.authenticated = false;
    window.AircovePortal.go("products");
  });
  await page.waitForSelector('[data-route="auth.phone"]', { timeout: 2000 });
  const intendedRoute = await page.evaluate(() => window.AircovePortal.state.session.intendedRoute);
  if (intendedRoute !== "products") {
    throw new Error(`Expected intendedRoute products, got ${intendedRoute}`);
  }
  await page.evaluate(() => {
    window.AircovePortal.state.session.authenticated = true;
    window.AircovePortal.state.session.intendedRoute = null;
  });

  await page.evaluate(() => {
    window.AircovePortal.ACTIONS["ui.toggleMode"]();
    window.AircovePortal.go("orders.list");
  });
  const modeAfterToggle = await page.locator("html").evaluate((html) => html.getAttribute("data-mode"));
  if (modeAfterToggle !== "dark") {
    throw new Error(`Expected data-mode dark after user toggle, got ${modeAfterToggle}`);
  }

  const openedOrderId = await page.evaluate(() => {
    const order = window.AircovePortal.state.orders[0];
    window.AircovePortal.ACTIONS["order.open"](order.id);
    return order.id;
  });
  await page.waitForSelector('[data-route="order.detail"]', { timeout: 2000 });
  const orderDetailHash = await page.evaluate(() => window.location.hash);
  if (orderDetailHash !== "#/orders/" + encodeURIComponent(openedOrderId)) {
    throw new Error(`order.open did not write detail route: ${orderDetailHash}`);
  }
  if (routes.includes("proposal.detail")) {
    await page.evaluate(() => {
      window.AircovePortal.ACTIONS["order.back"]();
      window.AircovePortal.ACTIONS["proposal.open"]("s2");
    });
    await page.waitForSelector('[data-route="proposal.detail"]', { timeout: 2000 });
    const proposalDetailHash = await page.evaluate(() => window.location.hash);
    if (proposalDetailHash !== "#/proposals/s2") {
      throw new Error(`proposal.open did not write detail route: ${proposalDetailHash}`);
    }
  } else {
    await page.evaluate(() => { window.AircovePortal.ACTIONS["order.back"](); });
  }

  await page.evaluate(() => {
    window.AircovePortal.ACTIONS["theme.pick"]("Snow Removal");
    window.AircovePortal.go("orders.list");
  });
  const themeAfterPick = await page.locator("html").evaluate((html) => html.getAttribute("data-theme"));
  if (themeAfterPick !== "snow") {
    throw new Error(`Expected data-theme snow after Snow Removal pick, got ${themeAfterPick}`);
  }
  await page.waitForSelector('[data-route="orders.list"][data-visual-id="storm-home"]', { timeout: 2000 });

  await page.evaluate(() => {
    window.AircovePortal.go("products");
  });
  await page.waitForSelector('[data-route="orders.list"][data-visual-id="storm-home"]', { timeout: 2000 });

  await page.evaluate(() => {
    window.AircovePortal.go("calendar");
  });
  await page.waitForSelector('[data-route="calendar"][data-visual-id="storm-calendar"]', { timeout: 2000 });

  await page.evaluate(() => {
    const weatherOrder = window.AircovePortal.state.orders.find((order) => order.wt);
    if (!weatherOrder) throw new Error("No weather-triggered order in stormOps fixture");
    window.AircovePortal.state.currentOrderId = weatherOrder.id;
    window.AircovePortal.go("order.detail");
  });
  await page.waitForSelector('[data-visual-id="weather-card"]', { timeout: 2000 });

  await page.evaluate(() => {
    window.AircovePortal.ACTIONS["theme.pick"]("Lawn & Garden");
    window.AircovePortal.go("orders.list");
  });
  await page.waitForSelector('[data-route="orders.list"][data-visual-id="storm-home"]', { timeout: 2000 });
  const lawnHomeText = await page.locator('[data-visual-id="storm-home"]').innerText();
  assertNoSharedSnowCopy(lawnHomeText, "lawn storm home");
  await page.evaluate(() => {
    window.AircovePortal.go("calendar");
  });
  await page.waitForSelector('[data-route="calendar"][data-visual-id="storm-calendar"]', { timeout: 2000 });
  const lawnCalendarText = await page.locator('[data-visual-id="storm-calendar"]').innerText();
  assertNoSharedSnowCopy(lawnCalendarText, "lawn storm calendar");

  const verticalMatrix = [
    ["HVAC", "hvac", "onDemand", "Equipment"],
    ["Snow Removal", "snow", "stormOps", "Season log"],
    ["Lawn & Garden", "lawn", "stormOps", "Program"],
    ["Pool & Spa", "pool", "stormOps", "Water"],
    ["Roofing", "roofing", "stormOps", "Roof report"],
    ["Pest Control", "pest", "stormOps", "Monitoring"],
    ["Health", "health", "appointments", "Care plan"],
    ["Beauty", "beauty", "appointments", "My routine"],
  ];
  for (const [displayName, slug, profile, careLabel] of verticalMatrix) {
    const result = await page.evaluate(([name, expectedCareLabel]) => {
      window.AircovePortal.ACTIONS["theme.pick"](name);
      window.AircovePortal.go("orders.list");
      return {
        profile: window.AircovePortal.state.config.profile,
        theme: document.documentElement.dataset.theme,
        nav: Array.from(document.querySelectorAll(".nav-links .nav-link"), (item) => item.textContent),
        careLabelPresent: Array.from(document.querySelectorAll(".nav-links .nav-link"), (item) => item.textContent).includes(expectedCareLabel),
        body: document.body.innerText,
        weatherOrderCount: window.AircovePortal.state.orders.filter((order) => order.wt).length,
      };
    }, [displayName, careLabel]);
    if (result.profile !== profile || result.theme !== slug || !result.careLabelPresent) {
      throw new Error(`vertical registry mismatch for ${displayName}: ${JSON.stringify(result)}`);
    }
    if ((slug === "health" || slug === "beauty") && (result.weatherOrderCount !== 0 || /weather trigger|undefined/i.test(result.body))) {
      throw new Error(`${displayName} leaked weather/undefined content: ${JSON.stringify(result)}`);
    }
  }

  await page.evaluate(() => {
    window.AircovePortal.ACTIONS["theme.pick"]("Health");
    window.AircovePortal.go("calendar");
  });
  await page.waitForSelector('[data-route="calendar"][data-visual-id="calendar"]', { timeout: 2000 });
  if (await page.locator('[data-visual-id="storm-calendar"], [data-visual-id="weather-card"], [data-visual-id="weather-banner"]').count()) {
    throw new Error("Health rendered weather-only UI");
  }
  await page.evaluate(() => window.AircovePortal.go("activity"));
  await page.waitForSelector('[data-route="orders.list"]', { timeout: 2000 });
  const healthActivityGuard = await page.evaluate(() => ({
    route: window.AircovePortal.state.route,
    enabled: window.AircovePortal.state.config.enabledModules.includes("activity"),
  }));
  if (healthActivityGuard.route !== "orders.list" || healthActivityGuard.enabled) {
    throw new Error(`Health activity guard failed: ${JSON.stringify(healthActivityGuard)}`);
  }

  await page.evaluate(() => {
    window.AircovePortal.ACTIONS["ui.toggleMode"]();
    window.AircovePortal.ACTIONS["theme.pick"]("Beauty");
  });
  if (await page.locator("html").getAttribute("data-mode") !== "light") {
    throw new Error("user-selected mode did not survive theme/config refresh");
  }

  await page.evaluate(() => {
    window.AircovePortal.ACTIONS["theme.pick"]("HVAC");
    window.AircovePortal.state.access.care = { status: "granted", reasonCode: null };
    window.AircovePortal.go("care");
  });
  await page.waitForSelector('[data-route="care"][data-access="granted"][data-state="ready"][data-visual-id="care-equipment"]', { timeout: 2000 });
  await page.evaluate(() => {
    window.AircovePortal.state.access.care = { status: "not-entitled", reasonCode: "plan" };
    window.AircovePortal.go("care");
  });
  await page.waitForSelector('[data-route="care"][data-state="unauthorized"][data-access="not-entitled"][data-reason-code="plan"]', { timeout: 2000 });
  await page.evaluate(() => {
    window.AircovePortal.state.access.care = { status: "forbidden", reasonCode: "permission" };
    window.AircovePortal.go("care");
  });
  await page.waitForSelector('[data-route="care"][data-state="unauthorized"][data-access="forbidden"][data-reason-code="permission"]', { timeout: 2000 });
  await page.evaluate(() => {
    window.AircovePortal.state.access.care = { status: "checking", reasonCode: null };
    window.AircovePortal.go("care");
  });
  await page.waitForSelector('[data-route="care"][data-state="loading"][data-access="checking"]', { timeout: 2000 });
  await page.evaluate(() => {
    window.AircovePortal.state.access.care = { status: "error", reasonCode: "unavailable" };
    window.AircovePortal.go("care");
  });
  await page.waitForSelector('[data-route="care"][data-state="error"][data-access="error"][data-reason-code="unavailable"]', { timeout: 2000 });
  await page.evaluate(() => {
    window.AircovePortal.state.access.care = { status: "granted", reasonCode: null };
    window.AircovePortal.state.config.enabledModules = window.AircovePortal.state.config.enabledModules.filter((item) => item !== "care");
    window.AircovePortal.go("care");
  });
  await page.waitForSelector('[data-route="care"][data-state="disabled"][data-access="disabled"][data-reason-code="module-disabled"]', { timeout: 2000 });
  if ((await page.locator(".nav-links .nav-link").allTextContents()).includes("Equipment")) {
    throw new Error("disabled Care module leaked into navigation");
  }
  await page.evaluate(() => {
    window.AircovePortal.state.config.enabledModules.push("care");
    window.AircovePortal.state.session.authenticated = false;
    window.AircovePortal.go("care");
  });
  await page.waitForSelector('[data-route="auth.phone"]', { timeout: 2000 });
  if (await page.evaluate(() => window.AircovePortal.state.session.intendedRoute) !== "care") {
    throw new Error("Care auth guard did not retain intended route");
  }
  await page.evaluate(() => window.AircovePortal.go("seo.landing"));
  await page.waitForSelector('[data-route="seo.landing"][data-state="ready"] [data-module="seo-hero"]', { timeout: 2000 });
  if (!await page.locator('[data-route="seo.landing"] [data-module="seo-meta-preview"]').count()) throw new Error("SEO parity metadata preview missing");
  if (!await page.locator('[data-module="public-nav"]').count()) throw new Error("SEO parity route depends on authenticated shell");
  await page.evaluate(() => {
    const care = window.AircovePortal.state.moduleData.care;
    if (!care || care.phase !== "preflight" || care.content !== null || care.kind !== null || care.allowedActions.length !== 0) {
      throw new Error("unauthenticated Care state is not a safe preflight envelope");
    }
    window.AircovePortal.state.session.authenticated = true;
    window.AircovePortal.state.session.intendedRoute = null;
  });

  await page.evaluate(() => {
    window.history.pushState({}, "", "#/orders/%23SV-2381?tab=invoice");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
  await page.waitForFunction(() => window.AircovePortal.state.route === "order.detail" && window.AircovePortal.state.currentOrderId === "#SV-2381");
  await page.evaluate(() => window.AircovePortal.ACTIONS["order.back"]());
  if (await page.evaluate(() => window.location.hash) !== "#/orders?tab=invoice") {
    throw new Error("hash route query was not preserved");
  }
  await page.evaluate(() => window.AircovePortal.go("support"));
  if (await page.evaluate(() => window.location.hash) !== "#/support") {
    throw new Error("order query leaked into unrelated hash route");
  }
  await page.evaluate(() => {
    window.history.pushState({}, "", "#/proposals/s4?view=map");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
  await page.waitForFunction(() => window.AircovePortal.state.route === "proposal.detail" && window.AircovePortal.state.currentSiteId === "s4");
  await page.evaluate(() => window.AircovePortal.ACTIONS["proposal.review"]());
  if (await page.evaluate(() => window.location.hash) !== "#/proposals?view=map") {
    throw new Error("proposal family query was not preserved");
  }
  await page.evaluate(() => window.AircovePortal.go("orders.list"));
  if (await page.evaluate(() => window.location.hash) !== "#/orders") {
    throw new Error("proposal query leaked into order route family");
  }
  await page.evaluate(() => {
    window.history.pushState({}, "", "#/orders/%E0%A4%A?bad=1");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
  await page.waitForFunction(() => window.AircovePortal.state.route === "orders.list");
  await page.evaluate(() => window.AircovePortal.go("support"));
  if (await page.evaluate(() => window.location.hash) !== "#/support") {
    throw new Error("malformed detail query leaked after unknown-route handling");
  }

  await page.evaluate(() => {
    const expectedModules = [
      "auth",
      "orders",
      "proposals",
      "services",
      "pricing",
      "products",
      "checkout",
      "calendar",
      "activity",
      "profile",
      "support",
    ];
    for (const moduleId of expectedModules) {
      if (window.AircovePortal.state.moduleStatus[moduleId] !== "ready") {
        throw new Error(`${moduleId} status is ${window.AircovePortal.state.moduleStatus[moduleId]}`);
      }
      if (!window.AircovePortal.state.moduleData[moduleId]) {
        throw new Error(`${moduleId} normalized data missing`);
      }
    }
  });

  await page.evaluate(() => {
    const weatherOrder = window.AircovePortal.state.orders.find((order) => order.wt);
    window.AircovePortal.ACTIONS["weather.confirm"](weatherOrder.id);
    const updated = window.AircovePortal.state.orders.find((order) => order.id === weatherOrder.id);
    if (updated.wt.status !== "confirmed") throw new Error("weather.confirm did not update fixture state");
    window.AircovePortal.ACTIONS["weather.confirm"]("__missing__");
    if (!window.AircovePortal.state.commandErrors["weather.confirm:__missing__"]) throw new Error("weather.confirm invalid-id error missing");

    window.AircovePortal.ACTIONS["order.cancel"]("__missing__");
    if (!window.AircovePortal.state.commandErrors["order.cancel:__missing__"]) throw new Error("order.cancel invalid-id error missing");

    const accessDay = window.AircoveFixtures.stormCalendar(window.AircovePortal.state.theme).days.find((day) => day.needsAccess);
    if (!accessDay) throw new Error("No access-confirmation fixture day");
    window.AircovePortal.ACTIONS["access.confirm"](accessDay.dateSub);
    if (!window.AircovePortal.state.accessConfirmations[accessDay.dateSub]) throw new Error("access.confirm did not update fixture state");
    window.AircovePortal.ACTIONS["access.confirm"]("__missing__");
    if (!window.AircovePortal.state.commandErrors["access.confirm:__missing__"]) throw new Error("access.confirm invalid-id error missing");

    window.AircovePortal.ACTIONS["service.requestExtra"]("extra-service");
    if (!window.AircovePortal.state.serviceRequests.length) throw new Error("service.requestExtra did not update fixture state");
    window.AircovePortal.state.drawer = null;

    window.AircovePortal.state.chatInput = "";
    window.AircovePortal.ACTIONS["support.sendMessage"]();
    if (!window.AircovePortal.state.commandErrors["support.sendMessage:_"]) throw new Error("support empty-message error missing");
    window.AircovePortal.state.chatInput = "Need help with my visit";
    window.AircovePortal.ACTIONS["support.sendMessage"]();
    if (!window.AircovePortal.state.messages.some((message) => message.text === "Need help with my visit")) {
      throw new Error("support.sendMessage did not queue fixture message");
    }

    window.AircovePortal.state.cartItems = [];
    window.AircovePortal.ACTIONS["checkout.placeOrder"]();
    if (!window.AircovePortal.state.commandErrors["checkout.placeOrder:_"]) throw new Error("empty checkout error missing");
    window.AircovePortal.ACTIONS["theme.pick"]("HVAC");
    window.AircovePortal.ACTIONS["checkout.pickAddress"]("__missing__");
    if (!window.AircovePortal.state.commandErrors["checkout.pickAddress:__missing__"]) throw new Error("checkout.pickAddress invalid-id error missing");
    window.AircovePortal.ACTIONS["checkout.pickPayment"]("__missing__");
    if (!window.AircovePortal.state.commandErrors["checkout.pickPayment:__missing__"]) throw new Error("checkout.pickPayment invalid-id error missing");
    window.AircovePortal.ACTIONS["profile.setDefaultAddress"]("__missing__");
    if (!window.AircovePortal.state.commandErrors["profile.setDefaultAddress:__missing__"]) throw new Error("profile.setDefaultAddress invalid-id error missing");
    window.AircovePortal.ACTIONS["profile.setDefaultPayment"]("__missing__");
    if (!window.AircovePortal.state.commandErrors["profile.setDefaultPayment:__missing__"]) throw new Error("profile.setDefaultPayment invalid-id error missing");
    window.AircovePortal.ACTIONS["profile.togglePref"]("__missing__");
    if (!window.AircovePortal.state.commandErrors["profile.togglePref:__missing__"]) throw new Error("profile.togglePref invalid-id error missing");

    const product = window.AircovePortal.state.moduleData.products.items[0];
    window.AircovePortal.ACTIONS["cart.addItem"](product.name);
    window.AircovePortal.ACTIONS["cart.removeItem"]("__missing__");
    if (!window.AircovePortal.state.commandErrors["cart.removeItem:__missing__"]) throw new Error("cart.removeItem invalid-id error missing");
    window.AircovePortal.ACTIONS["checkout.placeOrder"]();
    if (!window.AircovePortal.state.orders.some((order) => order.id === "FX-001")) {
      throw new Error("checkout.placeOrder did not create fixture order");
    }
    const renderedOrder = document.querySelector('[data-visual-id="order-list"] .order-card');
    if (!renderedOrder || !renderedOrder.textContent.includes("FX-001") || renderedOrder.textContent.includes("undefined")) {
      throw new Error(`checkout.placeOrder rendered invalid order card: ${renderedOrder ? renderedOrder.textContent : "missing"}`);
    }

    window.AircovePortal.state.currentSiteId = "s2";
    window.AircovePortal.ACTIONS["proposal.selectPlan"]("__missing__");
    if (!window.AircovePortal.state.commandErrors["proposal.selectPlan:__missing__"]) throw new Error("proposal.selectPlan invalid-id error missing");
    window.AircovePortal.ACTIONS["proposal.selectPlan"]("899");
    const selectedSite = window.AircovePortal.state.psites.find((item) => item.id === "s2");
    if (selectedSite.selected !== "899") throw new Error("proposal.selectPlan did not update fixture state");
    window.AircovePortal.ACTIONS["proposal.requestRevision"]();
    const site = window.AircovePortal.state.psites.find((item) => item.id === "s2");
    if (site.status !== "revision") throw new Error("proposal.requestRevision did not update fixture state");
  });

  const liveCatalogNames = await page.evaluate(async () => {
    window.AircovePortal.ACTIONS["theme.pick"]("HVAC");
    window.AircovePortal.state.config.dataMode = "live";
    window.AircovePortal.state.config.pimFixtureUrl = "/__fixtures__/core-pim-saas.json";
    const runtime = window.AircovePortal.runtime();
    await runtime.loadAsync("pricing");
    await runtime.loadAsync("products");
    if (window.AircovePortal.state.moduleData.pricing.source !== "core-pim") throw new Error("pricing did not load from Core PIM adapter");
    if (window.AircovePortal.state.moduleData.products.source !== "core-pim") throw new Error("products did not load from Core PIM adapter");
    const planName = window.AircovePortal.state.moduleData.pricing.plans[0].name;
    const productName = window.AircovePortal.state.moduleData.products.items[0].name;
    window.AircovePortal.go("pricing");
    return { planName, productName };
  });
  await page.waitForFunction((name) => document.body.innerText.includes(name), liveCatalogNames.planName, { timeout: 2000 });
  await page.evaluate(() => {
    window.AircovePortal.go("products");
  });
  await page.waitForFunction((name) => document.body.innerText.includes(name), liveCatalogNames.productName, { timeout: 2000 });
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`route-smoke ok: ${root}`);

function assertNoSharedSnowCopy(text, label) {
  const normalized = text.toLowerCase();
  const blocked = ["snow", "winter", "snowfall", "accumulation", "after 2"];
  for (const term of blocked) {
    if (normalized.includes(term)) {
      throw new Error(`${label} leaked shared snow copy: ${term}`);
    }
  }
}
