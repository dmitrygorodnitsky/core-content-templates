import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";

const portalRoot = path.resolve("app-templates/customer-portal");
const evidenceDir = path.resolve("docs/stream-tasks/calm-harbor-customer-portal-wave15/evidence/screenshots");
const widths = [390, 1180];
const surfaces = [
  { id: "account", route: "account", selectors: ["spa-account", "account-entry-list", "account-entry-purchases"] },
  { id: "purchases", route: "purchases.list", selectors: ["spa-purchases", "purchase-list", "purchase-row"] },
  { id: "purchase", route: "purchase.detail", selectors: ["spa-purchase-detail", "purchase-summary", "purchase-items"] },
  { id: "plan", route: "plan", selectors: ["spa-plan", "plan-list", "plan-card"] },
  { id: "cart", route: "cart", selectors: ["spa-cart", "cart-list", "cart-line"] },
  { id: "checkout", route: "checkout", selectors: ["spa-checkout", "checkout-contact", "checkout-payment"] },
];
const requireFrom = process.env.PLAYWRIGHT_NODE_MODULES
  ? createRequire(path.join(process.env.PLAYWRIGHT_NODE_MODULES, "package.json"))
  : createRequire(import.meta.url);
const { chromium } = requireFrom("playwright");
let browser;
let server;

try {
  await fs.mkdir(evidenceDir, { recursive: true });
  server = http.createServer((request, response) => serve(request, response));
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const report = [];
  for (const width of widths) {
    browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined });
    for (const surface of surfaces) {
      const reference = await browser.newPage({ viewport: { width, height: 1000 } });
      const implementation = await browser.newPage({ viewport: { width, height: 1000 } });
      await reference.goto(base + "/design/source.html", { waitUntil: "networkidle" });
      await implementation.goto(base + "/runtime/calm-harbor-spa-target.html", { waitUntil: "networkidle" });
      await Promise.all([prepare(reference, surface.route, true), prepare(implementation, surface.route, false)]);
      await reference.addStyleTag({ content: "[data-dev-toolbar]{display:none!important}.viewport-frame{max-width:none!important;margin:0!important;box-shadow:none!important;border-radius:0!important}" });
      await Promise.all([reference.evaluate(() => document.fonts && document.fonts.ready), implementation.evaluate(() => document.fonts && document.fonts.ready)]);
      await Promise.all(surface.selectors.map((id) => reference.locator(`[data-visual-id="${id}"]`).first().waitFor()));
      await Promise.all(surface.selectors.map((id) => implementation.locator(`[data-visual-id="${id}"]`).first().waitFor()));
      const referenceShot = path.join(evidenceDir, `reference-${surface.id}-${width}.png`);
      const implementationShot = path.join(evidenceDir, `implementation-${surface.id}-${width}.png`);
      await reference.locator(`[data-visual-id="${surface.selectors[0]}"]`).screenshot({ path: referenceShot, animations: "disabled" });
      await implementation.locator(`[data-visual-id="${surface.selectors[0]}"]`).screenshot({ path: implementationShot, animations: "disabled" });
      const left = await metrics(reference, surface.selectors);
      const right = await metrics(implementation, surface.selectors);
      const deltas = surface.selectors.map((id) => ({ id, x: delta(left[id].x, right[id].x), width: delta(left[id].width, right[id].width) }));
      for (const item of deltas) {
        assert.ok(item.x <= 2, `${surface.id}@${width} ${item.id} x drift ${item.x}px`);
        assert.ok(item.width <= 2, `${surface.id}@${width} ${item.id} width drift ${item.width}px`);
      }
      report.push({ width, surface: surface.id, deltas, reference: path.relative(process.cwd(), referenceShot), implementation: path.relative(process.cwd(), implementationShot) });
      await reference.close();
      await implementation.close();
    }
    await browser.close();
    browser = null;
  }
  await fs.writeFile(path.join(evidenceDir, "..", "visual-report.json"), JSON.stringify({ schemaVersion: 1, tolerance: { x: 2, width: 2 }, rows: report }, null, 2) + "\n");
  console.log(`calm-harbor-wave15-visual-check ok: ${report.length} paired surfaces, x/width drift <= 2px`);
} finally {
  if (browser) await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
}

async function prepare(page, route, design) {
  await page.waitForFunction(() => window.AircovePortal && window.AircovePortal.state);
  await page.evaluate(({ route, design }) => {
    const F = window.AircoveFixtures;
    const lines = [
      { ref: "cln-01", code: "rtl-beauty-01", variantRef: null, title: "Silk Repair Set", variant: null, qty: 1, cents: 6400 },
      { ref: "cln-04", code: "rtl-beauty-04", variantRef: null, title: "Gel Removal Kit", variant: null, qty: 2, cents: 1800 },
    ];
    Object.assign(window.AircovePortal.state, {
      theme: "Beauty", capability: "target-appointments", spaBooking: "open", spaRetail: "retail-commerce-open",
      account: "ready", accountMenu: false, mobileNav: false, spaLongName: false, view: "ready",
      spaCurrentPurchase: "pur-9f27a1", spaPlanScenario: "active", spaPurchMore: "idle",
      spaCart: F.spaServerCart(lines), spaCartDemo: "as-added", spaCheckoutSource: "cart",
      spaCheckoutDemo: "ready", spaPolicyAck: false, spaResult: null,
    });
    if (design) window.AircovePortal.state.vw = "full";
    window.AircovePortal.go(route);
  }, { route, design });
}

async function metrics(page, ids) {
  return page.evaluate((visualIds) => Object.fromEntries(visualIds.map((id) => {
    const rect = document.querySelector(`[data-visual-id="${id}"]`).getBoundingClientRect();
    return [id, { x: Math.round(rect.x * 10) / 10, width: Math.round(rect.width * 10) / 10 }];
  })), ids);
}

function delta(left, right) { return Math.round(Math.abs(left - right) * 10) / 10; }

async function serve(request, response) {
  const url = new URL(request.url || "/", "http://127.0.0.1");
  const root = url.pathname.startsWith("/design/") ? path.join(portalRoot, "design-inbox") : path.join(portalRoot, "runtime");
  const prefix = url.pathname.startsWith("/design/") ? "/design/" : "/runtime/";
  const target = path.resolve(root, decodeURIComponent(url.pathname.slice(prefix.length)));
  if (!target.startsWith(root + path.sep)) return send(response, 403, "Forbidden", "text/plain");
  try { return send(response, 200, await fs.readFile(target), contentType(target)); }
  catch (error) { if (error.code === "ENOENT") return send(response, 404, "Not found", "text/plain"); throw error; }
}

function send(response, status, body, type) { response.writeHead(status, { "content-type": type }); response.end(body); }
function contentType(file) { if (file.endsWith(".html")) return "text/html; charset=utf-8"; if (file.endsWith(".js")) return "text/javascript; charset=utf-8"; if (file.endsWith(".css")) return "text/css; charset=utf-8"; if (file.endsWith(".json")) return "application/json; charset=utf-8"; return "application/octet-stream"; }
