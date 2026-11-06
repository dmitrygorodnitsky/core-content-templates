import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { createRequire } from "node:module";
import { exportCalmHarborPortalManual } from "./export-calm-harbor-portal-manual.mjs";

const portalRoot = path.resolve("app-templates/customer-portal");
const inputPath = path.join(portalRoot, "content/cases/calm-harbor-spa.customer-portal-staging.json");
const outputDir = path.join(portalRoot, ".calm-harbor-portal-manual-wave14-visual-check");
const evidenceDir = path.resolve("docs/stream-tasks/calm-harbor-customer-portal-wave14-wave/evidence/screenshots");
const widths = [390, 768, 1180, 1440];
const surfaces = [
  { id: "orders", referenceRoute: "orders.list", selectors: ["top-nav", "spa-orders", "spa-order-list", "spa-order-row"] },
  { id: "services", referenceRoute: "services", selectors: ["top-nav", "spa-catalog", "spa-service-list", "spa-service-card"] },
  { id: "products", referenceRoute: "products", selectors: ["top-nav", "spa-shop", "spa-shop-list", "spa-shop-card"] },
];

let browser;
let server;

try {
  await fs.rm(outputDir, { recursive: true, force: true });
  await fs.mkdir(evidenceDir, { recursive: true });
  await exportCalmHarborPortalManual({ inputPath, outputDir });
  let preview = await fs.readFile(path.join(outputDir, "preview.html"), "utf8");
  preview = preview.replace(/<script src="https:\/\/cdnjs\.cloudflare\.com[^>]+><\/script>/, `<script>
    window.oidc = {
      WebStorageStateStore: function () {},
      UserManager: function () {
        this.getUser = async function () { return { access_token: "visual-test-token", token_type: "Bearer", expired: false, profile: { name: "Mara Lindqvist" } }; };
        this.removeUser = async function () {};
        this.signinRedirect = async function () {};
        this.signoutRedirect = async function () {};
      }
    };
  </script>`);

  server = http.createServer(async (request, response) => {
    const url = new URL(request.url || "/", "http://127.0.0.1");
    if (url.pathname === "/manual") return send(response, 200, preview, "text/html; charset=utf-8");
    if (url.pathname.startsWith("/design/")) return staticFile(response, path.join(portalRoot, "design-inbox", url.pathname.slice("/design/".length)));
    if (url.pathname === "/core/.well-known/oauth-protected-resource/") {
      const origin = `http://${request.headers.host}`;
      return json(response, { authorization_servers: [origin + "/core"], resource: origin + "/core", x_client_id: "visual-check", x_redirect_uri: origin + "/core/oauth2-callback.html", x_post_logout_redirect_uri: origin + "/core/oauth2-callback.html" });
    }
    if (url.pathname === "/core/api/user/basic-info.json") return json(response, { authenticatedUserId: 42, authenticatedUserName: "Mara Lindqvist", authorizedOrganizations: [{ id: 25, code: "CALM_HARBOR_SPA_STAGING" }] });
    if (url.pathname === "/core-acct/api/account/list.json") return json(response, { resultSize: 1, result: [{ id: 501, code: "CHS_STG_MARA", user: { id: 42 }, nls: { en: { NAME: "Mara Lindqvist" } } }] });
    if (url.pathname === "/core-bill/api/order/list.json") { const rows = getOrderRows(); return json(response, { resultSize: rows.length, result: rows }); }
    if (url.pathname.startsWith("/core-pim/public/")) {
      const body = JSON.parse(await readBody(request));
      return json(response, { prices: getPimRows()[body.productTypeCode] || [] });
    }
    return send(response, 404, "Not found", "text/plain; charset=utf-8");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const requireFrom = process.env.PLAYWRIGHT_NODE_MODULES ? createRequire(path.join(process.env.PLAYWRIGHT_NODE_MODULES, "package.json")) : createRequire(import.meta.url);
  const { chromium } = requireFrom("playwright");
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined });

  const report = [];
  for (const width of widths) {
    for (const surface of surfaces) {
      const viewport = { width, height: 1000 };
      const reference = await browser.newPage({ viewport });
      await reference.goto(baseUrl + "/design/source.html", { waitUntil: "networkidle" });
      await reference.waitForFunction(() => window.AircovePortal && window.AircovePortal.state);
      await reference.evaluate((route) => {
        Object.assign(window.AircovePortal.state, { theme: "Beauty", capability: "current-staging", spaBooking: "closed", account: "ready", accountMenu: false, mobileNav: false, spaRows: "many", spaLongName: false, view: "ready", vw: "full" });
        window.AircovePortal.setState({ route });
      }, surface.referenceRoute);
      await reference.addStyleTag({ content: "[data-dev-toolbar]{display:none!important}.viewport-frame{max-width:none!important;margin:0!important;box-shadow:none!important;border-radius:0!important}" });
      await reference.evaluate(() => document.fonts && document.fonts.ready);
      await reference.locator(`[data-visual-id="${surface.selectors[1]}"]`).waitFor();

      const implementation = await browser.newPage({ viewport });
      await implementation.goto(baseUrl + "/manual#/" + surface.id, { waitUntil: "networkidle" });
      await implementation.evaluate(() => document.fonts && document.fonts.ready);
      await implementation.locator(`[data-visual-id="${surface.selectors[1]}"]`).waitFor();

      const referenceShot = path.join(evidenceDir, `reference-${surface.id}-${width}.png`);
      const implementationShot = path.join(evidenceDir, `implementation-${surface.id}-${width}.png`);
      await reference.locator(".app-shell").screenshot({ path: referenceShot, animations: "disabled" });
      await implementation.locator(".app-shell").screenshot({ path: implementationShot, animations: "disabled" });

      const referenceMetrics = await metrics(reference, surface.selectors);
      const implementationMetrics = await metrics(implementation, surface.selectors);
      const deltas = compareMetrics(referenceMetrics, implementationMetrics);
      report.push({ width, surface: surface.id, deltas, reference: path.relative(process.cwd(), referenceShot), implementation: path.relative(process.cwd(), implementationShot) });
      for (const delta of deltas) {
        assert.ok(delta.width <= 2, `${surface.id}@${width} ${delta.id} width drift ${delta.width}px`);
        assert.ok(delta.x <= 2, `${surface.id}@${width} ${delta.id} x drift ${delta.x}px`);
      }
      await reference.close();
      await implementation.close();
    }
  }
  await fs.writeFile(path.resolve("docs/stream-tasks/calm-harbor-customer-portal-wave14-wave/evidence/visual-report.json"), JSON.stringify({ schemaVersion: 1, tolerance: { x: 2, width: 2 }, rows: report }, null, 2) + "\n");
  console.log(`calm-harbor-wave14-visual-check ok: ${report.length} paired rows, x/width drift <= 2px`);
} finally {
  if (browser) await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
  await fs.rm(outputDir, { recursive: true, force: true });
}

async function metrics(page, ids) {
  return page.evaluate((visualIds) => Object.fromEntries(visualIds.map((id) => {
    const element = document.querySelector(`[data-visual-id="${id}"]`);
    if (!element) return [id, null];
    const rect = element.getBoundingClientRect();
    return [id, { x: Math.round(rect.x * 10) / 10, y: Math.round(rect.y * 10) / 10, width: Math.round(rect.width * 10) / 10, height: Math.round(rect.height * 10) / 10 }];
  })), ids);
}

function compareMetrics(reference, implementation) {
  return Object.keys(reference).map((id) => {
    assert.ok(reference[id], `reference is missing ${id}`);
    assert.ok(implementation[id], `implementation is missing ${id}`);
    return { id, x: distance(reference[id].x, implementation[id].x), y: distance(reference[id].y, implementation[id].y), width: distance(reference[id].width, implementation[id].width), height: distance(reference[id].height, implementation[id].height) };
  });
}

function distance(left, right) { return Math.round(Math.abs(left - right) * 10) / 10; }
function json(response, value) { return send(response, 200, JSON.stringify(value), "application/json; charset=utf-8"); }
function send(response, status, body, contentType) { response.writeHead(status, { "content-type": contentType }); response.end(body); }
function readBody(request) { return new Promise((resolve, reject) => { let body = ""; request.setEncoding("utf8"); request.on("data", (chunk) => { body += chunk; }); request.on("end", () => resolve(body)); request.on("error", reject); }); }
async function staticFile(response, target) { try { const body = await fs.readFile(target); return send(response, 200, body, contentType(target)); } catch (error) { if (error.code === "ENOENT") return send(response, 404, "Not found", "text/plain"); throw error; } }
function contentType(target) { if (target.endsWith(".html")) return "text/html; charset=utf-8"; if (target.endsWith(".css")) return "text/css; charset=utf-8"; if (target.endsWith(".js")) return "text/javascript; charset=utf-8"; if (target.endsWith(".json")) return "application/json; charset=utf-8"; return "application/octet-stream"; }
function identifier(code, name) { return { code, nls: { en: { NAME: name } } }; }
function pimRow(code, name, description, amount, interval) { return { product: { product: { code, nls: { en: { NAME: name, DESCRIPTION: description } } } }, price: { display: { amount, currency: "USD", intervalLabel: interval } } }; }

function getOrderRows() { return [
  { id: 10318, grandTotal: 85, account: { id: 501 }, currency: identifier("USD", "US dollar"), type: identifier("SPA_SERVICE", "Service order"), states: [identifier("OPEN", "Open")] },
  { id: 10292, grandTotal: 64, account: { id: 501 }, currency: identifier("USD", "US dollar"), type: identifier("SPA_RETAIL", "Retail order"), states: [identifier("OPEN", "Open")] },
  { id: 10241, grandTotal: 510, account: { id: 501 }, currency: identifier("USD", "US dollar"), type: identifier("SPA_SERVICE_PACKAGE_PREPAID", "Prepaid treatment package — six-session series transfer"), states: [identifier("AWAITING_SETTLEMENT_REVIEW", "Awaiting settlement review")] },
  { id: 10186, grandTotal: 45, account: { id: 501 }, currency: identifier("USD", "US dollar"), type: identifier("SPA_SERVICE", "Service order"), states: [identifier("CLOSED", "Closed")] },
]; }

function getPimRows() { return {
  SPA_SERVICE: [
    pimRow("svc-spa-01", "Manicure & nails", "Classic to gel — sanitised, sealed kit", 45, "visit"),
    pimRow("svc-spa-02", "Hair styling", "Cut, color & blowout — formulas saved", 65, "visit"),
    pimRow("svc-spa-03", "Facial treatment", "A routine that carries over visit to visit", 85, "visit"),
    pimRow("svc-spa-04", "Event & bridal package", "Trials, timeline and a day-of team", 0, ""),
  ],
  SPA_MEMBERSHIP: [pimRow("mem-spa-01", "Harbor membership", "Member pricing on every treatment", 129, "month")],
  SPA_RETAIL: [
    pimRow("rtl-beauty-01", "Silk Repair Set", "Post-color bond care", 64, ""),
    pimRow("rtl-beauty-02", "Heat Shield Spray", "Before every hot tool", 28, ""),
    pimRow("rtl-beauty-03", "Cuticle Care Kit", "Between-visit upkeep", 22, ""),
    pimRow("rtl-beauty-04", "Gel Removal Kit", "Damage-free at home", 18, ""),
    pimRow("rtl-beauty-05", "Hydration Serum", "Your specialist's pick", 46, ""),
    pimRow("rtl-beauty-06", "Overnight Mask", "Twice-a-week routine", 34, ""),
  ],
}; }
