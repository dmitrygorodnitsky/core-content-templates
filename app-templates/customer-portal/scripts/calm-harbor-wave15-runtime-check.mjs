import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";

const root = path.resolve("app-templates/customer-portal/runtime");
const requireFrom = process.env.PLAYWRIGHT_NODE_MODULES
  ? createRequire(path.join(process.env.PLAYWRIGHT_NODE_MODULES, "package.json"))
  : createRequire(import.meta.url);
const { chromium } = requireFrom("playwright");
const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || "/", "http://127.0.0.1");
  const relative = url.pathname === "/" ? "calm-harbor-spa-target.html" : decodeURIComponent(url.pathname).replace(/^\/+/, "");
  const target = path.resolve(root, relative);
  if (!target.startsWith(root + path.sep)) return send(response, 403, "Forbidden", "text/plain");
  try {
    const body = await fs.readFile(target);
    return send(response, 200, body, contentType(target));
  } catch (error) {
    if (error.code === "ENOENT") return send(response, 404, "Not found", "text/plain");
    throw error;
  }
});

let browser;
try {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined });
  const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const base = `http://127.0.0.1:${server.address().port}/calm-harbor-spa-target.html`;
  await page.goto(base + "#/account", { waitUntil: "networkidle" });
  await page.waitForSelector('[data-route="account"][data-capability="target-appointments"]');
  assert.match(await page.locator("body").innerText(), /Purchases[\s\S]*My plan[\s\S]*Profile/);

  await page.evaluate(() => window.AircovePortal.go("purchases.list"));
  await page.waitForSelector('[data-route="purchases.list"] [data-module="purchase-row"]');
  await page.locator('[data-module="purchase-row"]').first().click();
  await page.waitForSelector('[data-route="purchase.detail"]');
  assert.ok(await page.locator('[data-purchase-ref]').count(), "purchase refs are absent");

  await page.evaluate(() => window.AircovePortal.go("plan"));
  await page.waitForSelector('[data-route="plan"] [data-module="plan-card"]');

  await page.evaluate(() => window.AircovePortal.go("products"));
  await page.waitForSelector('[data-route="products"][data-retail="retail-commerce-open"]');
  const add = page.locator('[data-action="cart.addItem"]:not([disabled])').first();
  assert.ok(await add.count(), "sellable product action is absent");
  await add.click();
  await page.waitForFunction(() => window.AircovePortal.state.spaCart && window.AircovePortal.state.spaCart.lines.length > 0);

  await page.evaluate(() => window.AircovePortal.go("cart"));
  await page.waitForSelector('[data-route="cart"] [data-module="cart-line"]');
  await page.locator('[data-action="checkout.start"]').click();
  await page.waitForSelector('[data-route="checkout"] [data-module="simulation-notice"]');
  await page.locator('[data-action="checkout.ackPolicy"]').click();
  await page.locator('[data-action="checkout.confirm"]').click();
  await page.waitForSelector('[data-route="checkout"][data-state="confirmed"]');

  const checkoutText = await page.locator('[data-route="checkout"]').innerText();
  assert.match(checkoutText, /no charge/i);
  assert.doesNotMatch(checkoutText, /\bPaid\b|Charged|Payment successful|card number|refund issued/i);
  assert.deepEqual(errors, []);
  console.log("calm-harbor-wave15-runtime-check ok: account, purchases, plan, sellable shop, server cart, and simulated checkout");
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

function send(response, status, body, contentTypeValue) {
  response.writeHead(status, { "content-type": contentTypeValue });
  response.end(body);
}

function contentType(file) {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
  if (file.endsWith(".json")) return "application/json; charset=utf-8";
  return "application/octet-stream";
}
