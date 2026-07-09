import { createRequire } from "node:module";
import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const routes = [
  "landing",
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
    const relative = url.pathname === "/" ? "/source.html" : url.pathname;
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
  return { server, url: `http://127.0.0.1:${address.port}/source.html` };
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
    window.AircovePortal.ACTIONS["theme.pick"]("Snow Removal");
    window.AircovePortal.go("orders.list");
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
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`route-smoke ok: ${root}`);
