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
  const pathname = new URL(request.url || "/", "http://127.0.0.1").pathname;
  const relative = pathname === "/" ? "calm-harbor-spa-target.html" : decodeURIComponent(pathname).replace(/^\/+/, "");
  const target = path.resolve(root, relative);
  if (!target.startsWith(root + path.sep)) return send(response, 403, "Forbidden", "text/plain");
  try {
    return send(response, 200, await fs.readFile(target), contentType(target));
  } catch (error) {
    if (error.code === "ENOENT") return send(response, 404, "Not found", "text/plain");
    throw error;
  }
});

let browser;
try {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined });
  const page = await browser.newPage({ viewport: { width: 1180, height: 1100 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  const base = `http://127.0.0.1:${server.address().port}/calm-harbor-spa-target.html`;
  await page.goto(base + "#/products", { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.AircovePortal && window.AircoveFixtures);

  assert.equal(await page.locator('[data-module="product-model-section"]').count(), 1, "unmodeled case products stay in the honest Other products group");
  const shopCodes = await page.locator('[data-module="spa-shop-card"]').evaluateAll((nodes) => nodes.map((node) => node.dataset.productCode));
  assert.deepEqual(shopCodes, ["CHS-BODY-001", "CHS-BATH-001", "CHS-BODY-002", "CHS-SKIN-001", "CHS-SKIN-002"]);
  const firstCard = page.locator('[data-module="spa-shop-card"]').first();
  const productRef = await firstCard.getAttribute("data-product-ref");
  const productCode = await firstCard.getAttribute("data-product-code");
  assert.match(productRef || "", /^product-/);
  assert.notEqual(productRef, productCode, "route identity is opaque and separate from the PIM code");
  assert.equal(await firstCard.locator('[data-action="product.open"]').count(), 1);
  assert.equal(await firstCard.locator('[data-action="cart.addItem"]').count(), 1, "open and add remain separate controls");

  await firstCard.locator('[data-action="product.open"]').click();
  await page.waitForSelector(`[data-route="product.detail"][data-product-ref="${productRef}"]`);
  assert.match(page.url(), new RegExp(`#\\/products\\/${productRef}$`));
  assert.equal(await page.locator('[data-visual-id="product-gallery-primary"][data-state="no-media"]').count(), 1);

  await page.evaluate(() => {
    window.AircovePortal.state.spaCurrentProduct = "prd-7f3a91";
    window.AircovePortal.state.spaReviews = "ready";
    window.AircovePortal.state.spaGallery = 0;
    window.AircovePortal.go("product.detail");
  });
  await page.waitForSelector('[data-route="product.detail"][data-product-ref="prd-7f3a91"]');
  assert.equal(await page.locator('[data-module="product-gallery-thumb"]').count(), 3, "backend media order is preserved without padding");
  assert.equal(await page.locator('[data-module="product-review-card"]').count(), 3, "visible PUBLISHED review set renders");
  assert.doesNotMatch(await page.locator('[data-module="product-review-list"]').innerText(), /average rating|write a review/i);
  await page.locator('[data-module="product-gallery-thumb"]').nth(1).click();
  assert.equal(await page.locator('[data-module="product-gallery-thumb"]').nth(1).getAttribute("data-state"), "active");
  assert.equal(await page.locator('[data-visual-id="pd-add-to-bag"]').count(), 1);

  await page.evaluate(() => window.AircovePortal.setState({ spaReviews: "unavailable" }));
  await page.waitForSelector('[data-module="product-review-list"][data-state="unavailable"]');
  assert.equal(await page.locator('[data-visual-id="pd-add-to-bag"]').count(), 1, "review failure never blanks sellability");

  await page.evaluate(() => {
    window.AircovePortal.state.spaCurrentProduct = "prd-b41f07";
    window.AircovePortal.state.spaReviews = "empty";
    window.AircovePortal.state.spaGallery = 0;
    window.AircovePortal.go("product.detail");
  });
  await page.waitForSelector('[data-visual-id="product-gallery-primary"][data-state="no-media"]');

  await page.evaluate(() => {
    window.AircovePortal.state.spaCurrentProduct = "unknown-ref";
    window.AircovePortal.go("product.detail");
  });
  await page.waitForSelector('[data-route="product.detail"] [data-module="not-found-state"]');

  await page.evaluate(() => {
    window.AircovePortal.state.spaModels = "unavailable";
    window.AircovePortal.go("products");
  });
  await page.waitForSelector('[data-module="product-model-list"][data-state="unavailable"]');
  assert.equal(await page.locator('[data-module="spa-shop-card"]').count(), 5, "flat fallback keeps every product visible and sellable");

  await page.evaluate(() => {
    window.AircovePortal.state.capability = "current-staging";
    window.AircovePortal.state.spaOrderMedia = "missing";
    window.AircovePortal.go("orders.list");
  });
  await page.waitForSelector('[data-visual-id="order-thumb"]');
  assert.equal(await page.locator('[data-visual-id="order-thumb"]').count(), 4);
  await page.waitForTimeout(100);
  assert.equal(await page.locator('[data-visual-id="order-thumb"][data-state="no-media"]').count(), 4, "missing or broken order media resolves inside the fixed thumbnail footprint");

  assert.deepEqual(errors, []);
  console.log("calm-harbor-wave17-runtime-check ok: grouped shop, opaque detail routing, gallery, published reviews, regional fallbacks, order thumbnails");
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

function send(response, status, body, type) {
  response.writeHead(status, { "content-type": type });
  response.end(body);
}

function contentType(file) {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
  if (file.endsWith(".json")) return "application/json; charset=utf-8";
  if (file.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}
