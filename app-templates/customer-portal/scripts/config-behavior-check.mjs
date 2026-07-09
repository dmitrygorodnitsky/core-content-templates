import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

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
      Object.assign(mount.dataset, dataset);
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

  const profileOverride = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await withConfig(profileOverride, {
    portalVertical: "hvac",
    portalProfile: "stormOps",
  });
  await profileOverride.goto(url, { waitUntil: "networkidle" });
  await profileOverride.waitForFunction(() => window.AircovePortal && window.AircovePortal.go);
  const effectiveProfile = await profileOverride.evaluate(() => window.AircovePortal.state.config.profile);
  if (effectiveProfile !== "stormOps") throw new Error(`portal_profile override resolved to ${effectiveProfile}`);
  await profileOverride.waitForSelector('[data-route="orders.list"][data-visual-id="storm-home"]', { timeout: 2000 });
  await profileOverride.close();

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
