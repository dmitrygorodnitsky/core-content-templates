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
  const page = await browser.newPage({ viewport: { width: 1180, height: 1000 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  const base = `http://127.0.0.1:${server.address().port}/calm-harbor-spa-target.html`;
  await page.goto(base + "#/orders", { waitUntil: "networkidle" });
  await page.waitForFunction(() => window.AircovePortal && window.AircoveFixtures);

  const refs = await page.evaluate(() => ({
    appointment: Object.keys(window.AircoveFixtures.spaCommerce.appointmentDetails)[0],
    service: window.AircoveFixtures.spa.pim.services[0].code,
    planOffers: window.AircoveFixtures.spaCommerce.planOffers.map((offer) => offer.ref),
  }));
  assert.ok(refs.appointment);
  assert.ok(refs.planOffers.length >= 2);

  await page.evaluate(({ appointment }) => window.AircovePortal.ACTIONS["appointment.open"](appointment), refs);
  await page.waitForSelector('[data-route="appointment.detail"][data-module="appointment-detail"]');
  assert.match(page.url(), /#\/appointments\//);
  assert.ok(await page.locator('[data-action="appointment.reschedule"], [data-action="appointment.bookAgain"]').count());

  await page.evaluate(({ service }) => window.AircovePortal.ACTIONS["booking.open"](service), refs);
  await page.waitForSelector('[data-module="booking-flow"][data-state="context"]');
  await page.locator('[data-action="booking.selectService"]').first().click();
  await page.waitForSelector('[data-module="booking-flow"][data-state="specialist"], [data-module="booking-flow"][data-state="slots"]');
  if (await page.locator('[data-action="booking.selectSpecialist"]').count()) {
    await page.locator('[data-action="booking.selectSpecialist"]').last().click();
  }
  await page.waitForSelector('[data-module="booking-flow"][data-state="slots"]');
  await page.locator('[data-action="booking.selectSlot"]:not([data-id^="day:"])').first().click();
  await page.locator('[data-action="booking.hold"]').click();
  await page.waitForSelector('[data-module="booking-flow"][data-state="review"]');
  await page.locator('[data-action="booking.ackPolicy"]').click();
  await page.locator('[data-action="booking.confirm"]').click();
  await page.waitForSelector('[data-route="checkout"][data-state="confirmed"]');
  assert.match(await page.locator('[data-route="checkout"]').innerText(), /Booking confirmed|no charge/i);

  await page.evaluate(() => window.AircovePortal.go("pricing"));
  await page.waitForSelector('[data-route="pricing"] [data-module="plan-offer-card"]');
  await page.locator('[data-action="plan.purchase"]:not([disabled])').first().click();
  await page.waitForSelector('[data-route="checkout"] [data-module="simulation-notice"]');
  await page.locator('[data-action="checkout.ackPolicy"]').click();
  await page.locator('[data-action="checkout.confirm"]').click();
  await page.waitForSelector('[data-route="checkout"][data-state="confirmed"]');
  const planText = await page.locator('[data-route="checkout"]').innerText();
  assert.match(planText, /Demo checkout completed|Plan|Membership/i);
  assert.doesNotMatch(planText, /\bPaid\b|Charged|Payment successful|card number/i);

  await page.evaluate(() => window.AircovePortal.go("profile"));
  await page.waitForSelector('[data-route="profile"][data-module="spa-profile"]');
  const profileText = await page.locator('[data-route="profile"]').innerText();
  assert.match(profileText, /Phone[\s\S]*Email[\s\S]*Preferences/);
  assert.doesNotMatch(profileText, /Spent this year|Plan savings|saved card|Payment method/i);
  await page.locator('[data-action="profile.edit"]').click();
  await page.evaluate(() => window.AircovePortal.ACTIONS["profile.changeField"]("email|updated@example.test"));
  await page.locator('[data-action="profile.save"]').click();
  await page.waitForFunction(() => window.AircovePortal.state.spaProfile?.email === "updated@example.test");
  assert.equal(await page.locator('[data-bind="profile.email"]').first().innerText(), "updated@example.test");

  await page.evaluate(() => {
    window.AircovePortal.state.spaCurrentAppointment = "unknown-ref";
    window.AircovePortal.state.view = "ready";
    window.AircovePortal.go("appointment.detail");
  });
  await page.waitForSelector('[data-route="appointment.detail"] [data-module="not-found-state"]');
  assert.deepEqual(errors, []);
  console.log(`calm-harbor-wave16-runtime-check ok: booking, appointment detail, ${refs.planOffers.length} plan offers, simulated checkout, least-data profile, non-enumerating not-found`);
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
