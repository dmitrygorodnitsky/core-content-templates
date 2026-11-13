import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";

const portalRoot = path.resolve("app-templates/customer-portal");
const evidenceDir = path.resolve("docs/stream-tasks/calm-harbor-customer-portal-full-activation-program/evidence/W1-wave16-visual");
const widths = [390, 768, 1180, 1440];
const surfaces = [
  { id: "appointment", route: "appointment.detail", visualId: "appointment-detail", metrics: ["appointment-detail", "appointment-detail-card"] },
  { id: "booking", route: "booking", visualId: "booking-drawer", metrics: ["booking-drawer", "booking-flow"] },
  { id: "plans", route: "pricing", visualId: "spa-catalog", metrics: ["spa-catalog", "plan-offer-list", "plan-offer-card"] },
  { id: "profile", route: "profile", visualId: "spa-profile", metrics: ["spa-profile", "spa-profile-contact", "spa-profile-preferences"] },
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
      const page = await browser.newPage({ viewport: { width, height: 1000 }, deviceScaleFactor: 1 });
      const selector = `[data-visual-id="${surface.visualId}"]`;
      const referencePath = path.join(evidenceDir, `reference-${surface.id}-${width}.png`);
      const implementationPath = path.join(evidenceDir, `implementation-${surface.id}-${width}.png`);
      const diffPath = path.join(evidenceDir, `diff-${surface.id}-${width}.png`);
      await page.goto(base + "/design/source.html", { waitUntil: "networkidle" });
      await prepare(page, surface.route, true);
      await page.addStyleTag({ content: "[data-dev-toolbar]{display:none!important}.viewport-frame{max-width:none!important;margin:0!important;box-shadow:none!important;border-radius:0!important}" });
      await page.evaluate(() => document.fonts?.ready);
      await page.locator(selector).first().waitFor();
      await page.locator(selector).first().screenshot({ path: referencePath, animations: "disabled" });
      const referenceMetrics = await collectMetrics(page, surface.metrics);

      await page.goto(base + "/runtime/calm-harbor-spa-target.html", { waitUntil: "networkidle" });
      await prepare(page, surface.route, false);
      await page.evaluate(() => document.fonts?.ready);
      await page.locator(selector).first().waitFor();
      await page.locator(selector).first().screenshot({ path: implementationPath, animations: "disabled" });
      const implementationMetrics = await collectMetrics(page, surface.metrics);
      const comparison = await strictDiff(referencePath, implementationPath, diffPath);
      const dom = {
        reference: referenceMetrics,
        implementation: implementationMetrics,
      };
      rows.push({ width, surface: surface.id, ...comparison, dom, reference: path.relative(process.cwd(), referencePath), implementation: path.relative(process.cwd(), implementationPath), diff: path.relative(process.cwd(), diffPath) });
      await page.close();
    }
  }

  const report = { schemaVersion: 1, comparisonMode: "strict", threshold: 0, rows };
  await fs.writeFile(path.join(evidenceDir, "visual-report.json"), JSON.stringify(report, null, 2) + "\n");
  const changedRows = rows.filter((row) => row.changed !== 0);
  assert.equal(changedRows.length, 0, `${changedRows.length} Wave 16 visual pairs differ; inspect ${path.relative(process.cwd(), evidenceDir)}/visual-report.json`);
  console.log(`calm-harbor-wave16-visual-check ok: ${rows.length} strict pairs, changed=0`);
} finally {
  if (browser) await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
}

async function prepare(page, route, design) {
  await page.waitForFunction(() => window.AircovePortal && window.AircoveFixtures);
  await page.evaluate(({ route, design }) => {
    const state = window.AircovePortal.state;
    const fixtures = window.AircoveFixtures;
    Object.assign(state, {
      theme: "Beauty",
      capability: "target-appointments",
      spaBooking: "open",
      spaRetail: "retail-commerce-open",
      spaPlanCommerce: "open",
      spaOfferDemo: "sellable",
      account: "ready",
      sessionName: fixtures.customer.fullName,
      accountMenu: false,
      mobileNav: false,
      view: "ready",
      spaCurrentAppointment: "appt-ch-10318",
      spaFlow: null,
      spaBookAck: false,
      spaSlots: "ready",
      spaCredit: "ok",
      spaProfile: null,
      spaProfileDraft: null,
      spaProfileErrors: null,
    });
    if (design) state.vw = "full";
    if (route === "booking") {
      window.AircovePortal.go("orders.list");
      window.AircovePortal.ACTIONS["booking.open"](fixtures.spa.pim.services[0].code);
    } else window.AircovePortal.go(route);
  }, { route, design });
}

async function collectMetrics(page, ids) {
  return page.evaluate((visualIds) => Object.fromEntries(visualIds.map((id) => {
    const element = document.querySelector(`[data-visual-id="${id}"]`);
    if (!element) return [id, null];
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return [id, {
      x: rect.x, y: rect.y, width: rect.width, height: rect.height,
      fontSize: style.fontSize, fontWeight: style.fontWeight, lineHeight: style.lineHeight,
      color: style.color, background: style.backgroundColor, border: style.border, borderRadius: style.borderRadius,
    }];
  })), ids);
}

async function strictDiff(leftPath, rightPath, diffPath) {
  const left = PNG.sync.read(await fs.readFile(leftPath));
  const right = PNG.sync.read(await fs.readFile(rightPath));
  if (left.width !== right.width || left.height !== right.height) {
    return { width: left.width, height: left.height, implementationWidth: right.width, implementationHeight: right.height, changed: -1, changedPct: 100, rms: null, dimensionMismatch: true };
  }
  const diff = new PNG({ width: left.width, height: left.height });
  let changed = 0;
  let sumSq = 0;
  for (let index = 0; index < left.data.length; index += 4) {
    let pixelChanged = false;
    for (let channel = 0; channel < 4; channel += 1) {
      const delta = left.data[index + channel] - right.data[index + channel];
      if (delta !== 0) pixelChanged = true;
      sumSq += delta * delta;
    }
    if (pixelChanged) changed += 1;
    diff.data[index] = pixelChanged ? 255 : left.data[index];
    diff.data[index + 1] = pixelChanged ? 0 : left.data[index + 1];
    diff.data[index + 2] = pixelChanged ? 120 : left.data[index + 2];
    diff.data[index + 3] = pixelChanged ? 255 : 70;
  }
  await fs.writeFile(diffPath, PNG.sync.write(diff));
  const pixels = left.width * left.height;
  return { width: left.width, height: left.height, changed, changedPct: changed / pixels * 100, rms: Math.sqrt(sumSq / (pixels * 4)), dimensionMismatch: false };
}

async function serve(request, response) {
  const url = new URL(request.url || "/", "http://127.0.0.1");
  const design = url.pathname.startsWith("/design/");
  const root = path.join(portalRoot, design ? "design-inbox" : "runtime");
  const prefix = design ? "/design/" : "/runtime/";
  const target = path.resolve(root, decodeURIComponent(url.pathname.slice(prefix.length)));
  if (!target.startsWith(root + path.sep)) return send(response, 403, "Forbidden", "text/plain");
  try { return send(response, 200, await fs.readFile(target), contentType(target)); }
  catch (error) { if (error.code === "ENOENT") return send(response, 404, "Not found", "text/plain"); throw error; }
}

function send(response, status, body, type) { response.writeHead(status, { "content-type": type }); response.end(body); }
function contentType(file) { if (file.endsWith(".html")) return "text/html; charset=utf-8"; if (file.endsWith(".js")) return "text/javascript; charset=utf-8"; if (file.endsWith(".css")) return "text/css; charset=utf-8"; if (file.endsWith(".json")) return "application/json; charset=utf-8"; return "application/octet-stream"; }
