import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";

const portalRoot = path.resolve("app-templates/customer-portal");
const evidenceDir = path.resolve("docs/stream-tasks/calm-harbor-customer-portal-full-activation-program/evidence/W2-wave17-visual");
const widths = [390, 768, 1180, 1440];
const surfaces = [
  { id: "shop", route: "products", visualId: "product-model-list", metrics: ["product-model-list", "product-model-section", "spa-shop-card"] },
  { id: "product", route: "product.detail", productRef: "prd-7f3a91", visualId: "product-detail", metrics: ["product-detail", "product-gallery", "product-review-list"] },
  { id: "product-no-media", route: "product.detail", productRef: "prd-b41f07", visualId: "product-detail", metrics: ["product-detail", "product-gallery-primary", "product-review-list"] },
  { id: "orders", route: "orders.list", visualId: "spa-orders", metrics: ["spa-orders", "spa-order-list", "order-thumb"] },
];
const requireFrom = process.env.PLAYWRIGHT_NODE_MODULES
  ? createRequire(path.join(process.env.PLAYWRIGHT_NODE_MODULES, "package.json"))
  : createRequire(import.meta.url);
const { chromium } = requireFrom("playwright");
const { PNG } = requireFrom("pngjs");

let browser;
let server;
try {
  await fs.mkdir(evidenceDir, { recursive: true });
  server = http.createServer((request, response) => serve(request, response));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined, args: ["--disable-gpu"] });
  const base = `http://127.0.0.1:${server.address().port}`;
  const rows = [];

  for (const width of widths) {
    for (const surface of surfaces) {
      const page = await browser.newPage({ viewport: { width, height: 1200 }, deviceScaleFactor: 1 });
      const selector = `[data-visual-id="${surface.visualId}"]`;
      const referencePath = path.join(evidenceDir, `reference-${surface.id}-${width}.png`);
      const implementationPath = path.join(evidenceDir, `implementation-${surface.id}-${width}.png`);
      const diffPath = path.join(evidenceDir, `diff-${surface.id}-${width}.png`);

      await page.goto(base + "/design/source.html", { waitUntil: "networkidle" });
      await prepare(page, surface, true);
      await page.addStyleTag({ content: "[data-dev-toolbar]{display:none!important}.viewport-frame{max-width:none!important;margin:0!important;box-shadow:none!important;border-radius:0!important}.top-nav-wrap{visibility:hidden!important}" });
      await page.evaluate(() => document.fonts?.ready);
      await page.locator(selector).first().waitFor();
      await page.locator(selector).first().screenshot({ path: referencePath, animations: "disabled" });
      const referenceMetrics = await collectMetrics(page, surface.metrics);

      await page.goto(base + "/runtime/calm-harbor-spa-target.html", { waitUntil: "networkidle" });
      await prepare(page, surface, false);
      await page.addStyleTag({ content: ".top-nav-wrap{visibility:hidden!important}" });
      await page.evaluate(() => document.fonts?.ready);
      await page.locator(selector).first().waitFor();
      await page.locator(selector).first().screenshot({ path: implementationPath, animations: "disabled" });
      const implementationMetrics = await collectMetrics(page, surface.metrics);
      const comparison = await strictDiff(referencePath, implementationPath, diffPath);
      rows.push({ width, surface: surface.id, ...comparison, dom: { reference: referenceMetrics, implementation: implementationMetrics }, reference: path.relative(process.cwd(), referencePath), implementation: path.relative(process.cwd(), implementationPath), diff: path.relative(process.cwd(), diffPath) });
      await page.close();
    }
  }

  const report = { schemaVersion: 1, comparisonMode: "strict", threshold: 0, rows };
  await fs.writeFile(path.join(evidenceDir, "visual-report.json"), JSON.stringify(report, null, 2) + "\n");
  const changedRows = rows.filter((row) => row.changed !== 0);
  assert.equal(changedRows.length, 0, `${changedRows.length} Wave 17 visual pairs differ; inspect ${path.relative(process.cwd(), evidenceDir)}/visual-report.json`);
  console.log(`calm-harbor-wave17-visual-check ok: ${rows.length} strict pairs, changed=0`);
} finally {
  if (browser) await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
}

async function prepare(page, surface, design) {
  await page.waitForFunction(() => window.AircovePortal && window.AircoveFixtures);
  if (!design) await page.waitForFunction(() => window.AircovePortal.state.moduleStatus.products === "ready");
  await page.evaluate(({ surface, design }) => {
    const portal = window.AircovePortal;
    const fixtures = window.AircoveFixtures;
    Object.assign(portal.state, {
      theme: "Beauty", capability: surface.route === "orders.list" ? "current-staging" : "target-appointments",
      spaBooking: "open", spaRetail: "retail-commerce-open", spaPlanCommerce: "open",
      account: "ready", accountMenu: false, mobileNav: false, view: "ready",
      spaModels: "ready", spaReviews: "ready", spaOrderMedia: "missing",
      spaCurrentProduct: surface.productRef || null, spaGallery: 0,
    });
    if (!design) {
      portal.state.config.caseId = "";
      portal.state.moduleData.products = { items: fixtures.themes.Beauty.products };
      portal.state.moduleStatus.products = "ready";
    } else {
      portal.state.vw = "full";
    }
    portal.go(surface.route);
  }, { surface, design });
}

async function collectMetrics(page, ids) {
  return page.evaluate((visualIds) => Object.fromEntries(visualIds.map((id) => {
    const element = document.querySelector(`[data-visual-id="${id}"]`);
    if (!element) return [id, null];
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return [id, { x: rect.x, y: rect.y, width: rect.width, height: rect.height, fontSize: style.fontSize, lineHeight: style.lineHeight, color: style.color, background: style.backgroundColor, border: style.border, borderRadius: style.borderRadius }];
  })), ids);
}

async function strictDiff(leftPath, rightPath, diffPath) {
  const left = PNG.sync.read(await fs.readFile(leftPath));
  const right = PNG.sync.read(await fs.readFile(rightPath));
  const width = Math.max(left.width, right.width);
  const height = Math.max(left.height, right.height);
  const diff = new PNG({ width, height });
  let changed = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const leftPixel = pixel(left, x, y);
      const rightPixel = pixel(right, x, y);
      const same = leftPixel.every((value, channel) => value === rightPixel[channel]);
      if (!same) changed += 1;
      diff.data[index] = same ? leftPixel[0] : 255;
      diff.data[index + 1] = same ? leftPixel[1] : 0;
      diff.data[index + 2] = same ? leftPixel[2] : 255;
      diff.data[index + 3] = 255;
    }
  }
  await fs.writeFile(diffPath, PNG.sync.write(diff));
  return { changed, pixels: width * height, ratio: changed / (width * height), dimensions: { reference: [left.width, left.height], implementation: [right.width, right.height] } };
}

function pixel(image, x, y) {
  if (x >= image.width || y >= image.height) return [0, 0, 0, 0];
  const index = (y * image.width + x) * 4;
  return [image.data[index], image.data[index + 1], image.data[index + 2], image.data[index + 3]];
}

async function serve(request, response) {
  const url = new URL(request.url || "/", "http://127.0.0.1");
  const design = url.pathname.startsWith("/design/");
  const root = design ? path.join(portalRoot, "design-inbox") : path.join(portalRoot, "runtime");
  const prefix = design ? "/design/" : "/runtime/";
  const target = path.resolve(root, decodeURIComponent(url.pathname.slice(prefix.length)));
  if (!target.startsWith(root + path.sep)) return send(response, 403, "Forbidden", "text/plain");
  try { return send(response, 200, await fs.readFile(target), contentType(target)); }
  catch (error) { if (error.code === "ENOENT") return send(response, 404, "Not found", "text/plain"); throw error; }
}

function send(response, status, body, type) { response.writeHead(status, { "content-type": type }); response.end(body); }
function contentType(file) { if (file.endsWith(".html")) return "text/html; charset=utf-8"; if (file.endsWith(".js")) return "text/javascript; charset=utf-8"; if (file.endsWith(".css")) return "text/css; charset=utf-8"; if (file.endsWith(".json")) return "application/json; charset=utf-8"; return "application/octet-stream"; }
