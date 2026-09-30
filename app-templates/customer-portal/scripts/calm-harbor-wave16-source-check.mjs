import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";

const root = path.resolve("app-templates/customer-portal/design-inbox");
const requireFrom = process.env.PLAYWRIGHT_NODE_MODULES
  ? createRequire(path.join(process.env.PLAYWRIGHT_NODE_MODULES, "package.json"))
  : createRequire(import.meta.url);
const { chromium } = requireFrom("playwright");
const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || "/", "http://127.0.0.1");
  const relative = url.pathname === "/"
    ? "source.html"
    : decodeURIComponent(url.pathname).replace(/^\/+/, "");
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
  browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined,
  });
  const page = await browser.newPage({ viewport: { width: 1180, height: 1000 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console: ${message.text()}`);
  });
  await page.goto(`http://127.0.0.1:${server.address().port}/source.html`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.AircovePortal && window.AircoveFixtures);
  await page.addStyleTag({ content: "[data-dev-toolbar]{display:none!important}" });

  const refs = await page.evaluate(() => ({
    appointment: Object.keys(window.AircoveFixtures.spaCommerce.appointmentDetails)[0],
    planOffers: window.AircoveFixtures.spaCommerce.planOffers.map((offer) => offer.ref),
    service: window.AircoveFixtures.spa.pim.services[0].code,
  }));
  assert.ok(refs.appointment, "Wave 16 appointment detail fixture is absent");
  assert.ok(refs.planOffers.length >= 2, "Wave 16 plan offer fixtures are incomplete");

  await page.evaluate(({ appointment }) => {
    Object.assign(window.AircovePortal.state, {
      theme: "Beauty",
      capability: "target-appointments",
      spaBooking: "open",
      spaRetail: "retail-commerce-open",
      spaPlanCommerce: "open",
      account: "ready",
      view: "ready",
      spaCurrentAppointment: appointment,
    });
    window.AircovePortal.go("appointment.detail");
  }, refs);
  await page.waitForSelector('[data-route="appointment.detail"][data-module="appointment-detail"]');
  assert.ok(
    await page.locator('[data-route="appointment.detail"] [data-action="appointment.reschedule"], [data-route="appointment.detail"] [data-action="appointment.bookAgain"]').count(),
    "Appointment detail exposes no capability-driven appointment action",
  );

  await page.evaluate(({ service }) => window.AircovePortal.ACTIONS["booking.open"](service), refs);
  await page.waitForSelector('[data-module="booking-flow"][data-state="context"]');
  assert.ok(await page.locator('[data-module="booking-flow"] [data-action="booking.selectService"]').count());
  await page.evaluate(() => {
    window.AircovePortal.ACTIONS["booking.close"]();
    window.AircovePortal.go("pricing");
  });

  await page.waitForSelector('[data-route="pricing"] [data-module="plan-offer-card"]');
  assert.ok(await page.locator('[data-module="plan-offer-card"][data-state="sellable"]').count());
  const buyPlan = page.locator('[data-action="plan.purchase"]:not([disabled])').first();
  assert.equal(await buyPlan.count(), 1, "No sellable plan entry reaches checkout");
  await buyPlan.click();
  await page.waitForSelector('[data-route="checkout"] [data-module="simulation-notice"]');
  const checkoutText = await page.locator('[data-route="checkout"]').innerText();
  assert.match(checkoutText, /no charge/i);
  assert.doesNotMatch(checkoutText, /\bPaid\b|Charged|Payment successful|Refunded/i);

  await page.evaluate(() => window.AircovePortal.go("profile"));
  await page.waitForSelector('[data-route="profile"][data-module="spa-profile"]');
  const profileText = await page.locator('[data-route="profile"]').innerText();
  assert.match(profileText, /Phone[\s\S]*Email[\s\S]*Preferences/);
  assert.doesNotMatch(profileText, /Spent this year|Plan savings|saved card|Payment method/i);
  await page.locator('[data-action="profile.edit"]').click();
  await page.evaluate(() => window.AircovePortal.ACTIONS["profile.changeField"]("email|broken"));
  await page.locator('[data-action="profile.save"]').click();
  await page.waitForSelector('[data-module="spa-profile-contact"][data-state="invalid"]');

  await page.evaluate(() => {
    window.AircovePortal.state.spaCurrentAppointment = "unknown-ref";
    window.AircovePortal.state.view = "ready";
    window.AircovePortal.go("appointment.detail");
  });
  await page.waitForSelector('[data-route="appointment.detail"] [data-module="not-found-state"]');
  assert.deepEqual(errors, []);
  console.log(
    `calm-harbor-wave16-source-check ok: appointment detail, booking entry, ${refs.planOffers.length} plan offers, simulated checkout, least-data profile, non-enumerating not-found`,
  );
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
  return "application/octet-stream";
}
