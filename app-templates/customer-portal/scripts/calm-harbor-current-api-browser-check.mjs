import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";

const runtimeRoot = path.resolve("app-templates/customer-portal/runtime");
const requireFrom = process.env.PLAYWRIGHT_NODE_MODULES
  ? createRequire(path.join(process.env.PLAYWRIGHT_NODE_MODULES, "package.json"))
  : createRequire(import.meta.url);
const { chromium } = requireFrom("playwright");

const appointmentTemplate = {
  id: 1050, optimistic: 3, code: "CHS_STG_APPOINTMENT_1050", nls: { en: { NAME: "Custom facial" } },
  start: "2026-07-28T14:00:00.000Z", end: "2026-07-28T15:00:00.000Z", organization: { id: 11 },
  task: { id: 22, code: "CHS_STG_FACIAL_CHECKIN" }, type: { id: 33, code: "SPA_VISIT" },
  workflow: { id: 44, code: "SPA_APPOINTMENT_LIFECYCLE" }, states: [{ id: 55, code: "SCHEDULED" }],
};
const orderTemplate = {
  id: 7001, optimistic: 1, account: { id: 1042 }, currency: { id: 1, code: "USD", nls: { en: { NAME: "US Dollar" } } },
  organization: { id: 11 }, type: { id: 77, code: "SPA_SERVICE_ORDER", nls: { en: { NAME: "Spa service order" } } },
  workflow: { id: 88, code: "SPA_ORDER_LIFECYCLE" }, notes: "CHS_STG_ORDER_1042", grandTotal: 145,
  totalCharges: 145, totalTaxes: 0, created: "2026-07-17T12:00:00.000Z", states: [{ code: "OPEN" }],
};
const appointments = [appointmentTemplate];
const orders = [orderTemplate];
let appointmentSaves = 0;
let orderSaves = 0;
let profileSaves = 0;
let profileUser = { id: 42, optimistic: 1, name: "elena", fullname: "Elena Rios", email: "elena@example.test", enabled: true, language: { id: 1 }, workflow: { id: 2 } };

const server = http.createServer(async (request, response) => {
  const pathname = new URL(request.url || "/", "http://127.0.0.1").pathname;
  const relative = pathname === "/" ? "calm-harbor-spa-live-demo.html" : decodeURIComponent(pathname).replace(/^\/+/, "");
  const target = path.resolve(runtimeRoot, relative);
  if (!target.startsWith(runtimeRoot + path.sep)) return send(response, 403, "Forbidden", "text/plain");
  try { return send(response, 200, await fs.readFile(target), contentType(target)); }
  catch (error) { return send(response, error.code === "ENOENT" ? 404 : 500, error.message, "text/plain"); }
});

let browser;
try {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined });
  const page = await browser.newPage({ viewport: { width: 1180, height: 1000 } });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.addInitScript(() => {
    class UserManager {
      async getUser() { return { access_token: "browser-test-token", token_type: "Bearer", expired: false, profile: { name: "Elena Rios" } }; }
      async removeUser() {}
      async signinRedirect() {}
      async signoutRedirect() {}
    }
    window.oidc = { UserManager, WebStorageStateStore: class { constructor(options) { this.options = options; } } };
    document.addEventListener("DOMContentLoaded", () => {
      const root = document.getElementById("app");
      root.dataset.portalEnabledModules = "appointments,orders,account,cart,checkout,purchases,plan,pricing,products,profile";
      root.dataset.portalPimPricingProductTypeCodes = "SPA_SERVICE,SPA_MEMBERSHIP,SPA_PACKAGE";
      root.dataset.portalPimProductsProductTypeCodes = "SPA_RETAIL";
    }, { once: true });
  });
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (!url.pathname.startsWith("/core")) return route.continue();
    const body = request.postDataJSON?.() || {};
    if (url.pathname.includes("/catalog/price-comparison.json")) {
      const catalog = {
        SPA_SERVICE: { code: "CHS_CUSTOM_FACIAL", name: "Custom facial", amount: 130, interval: "ONE_TIME" },
        SPA_MEMBERSHIP: { code: "CHS_HARBOR_MEMBERSHIP", name: "Harbor membership", amount: 18, interval: "MONTH" },
        SPA_PACKAGE: { code: "CHS_HARBOR_RESET_SERIES", name: "Harbor reset series", amount: 510, interval: "ONE_TIME" },
        SPA_RETAIL: { code: "CHS_BODY_001", name: "Harbor body oil", amount: 42, interval: "ONE_TIME" },
      }[body.productTypeCode];
      return fulfill(route, { prices: catalog ? [{ product: { code: catalog.code, nls: { en: { NAME: catalog.name, DESCRIPTION: "Published by Calm Harbor" } } }, price: { display: { amount: catalog.amount, currency: "USD", intervalLabel: catalog.interval } } }] : [] });
    }
    if (url.pathname === "/core/.well-known/oauth-protected-resource/") return fulfill(route, {
      authorization_servers: ["/core"], resource: "/core", x_client_id: "browser-test",
      x_redirect_uri: "/core/oauth2-callback.html", x_post_logout_redirect_uri: "/core/oauth2-callback.html",
    });
    if (url.pathname === "/core/api/user/basic-info.json") return fulfill(route, {
      authenticatedUserId: 42, authenticatedUserName: "Elena Rios", organizationCode: "CALM_HARBOR_SPA_STAGING",
      authorizedOrganizations: [{ code: "CALM_HARBOR_SPA_STAGING" }],
    });
    if (url.pathname === "/core/api/user/get.json") return fulfill(route, profileUser);
    if (url.pathname === "/core/api/user/save.json") {
      profileSaves += 1;
      profileUser = { ...profileUser, ...body.entities[0], optimistic: profileUser.optimistic + 1 };
      return fulfill(route, [profileUser.id]);
    }
    if (url.pathname === "/core-acct/api/account/list.json") return fulfill(route, {
      resultSize: 1, result: [{ id: 1042, optimistic: 3, code: "CHS_STG_ELENA_RIOS", nls: { en: { NAME: "Elena Rios" } }, user: { id: 42 } }],
    });
    if (url.pathname === "/core-svc/api/appointment/list.json") {
      const code = filterValue(body, "code");
      const result = code ? appointments.filter((item) => item.code === code) : appointments;
      return fulfill(route, { resultSize: result.length, result });
    }
    if (url.pathname === "/core-svc/api/appointment/save.json") {
      appointmentSaves += 1;
      const entity = body.entities[0];
      if (entity.id) {
        const index = appointments.findIndex((item) => item.id === entity.id);
        appointments[index] = { ...appointments[index], ...entity, optimistic: Number(appointments[index].optimistic || 0) + 1 };
        return fulfill(route, [entity.id]);
      }
      const saved = { ...entity, id: 2000 + appointmentSaves, optimistic: 0, states: [{ code: "SCHEDULED" }],
        organization: appointmentTemplate.organization, task: appointmentTemplate.task, type: appointmentTemplate.type, workflow: appointmentTemplate.workflow };
      appointments.push(saved);
      return fulfill(route, [saved.id]);
    }
    if (url.pathname === "/core-svc/api/appointment/get.json") {
      return fulfill(route, appointments.find((item) => item.id === Number(url.searchParams.get("id"))));
    }
    if (url.pathname === "/core-bill/api/order/list.json") {
      const marker = filterValue(body, "notes");
      const result = marker ? orders.filter((item) => item.notes === marker) : orders;
      return fulfill(route, { resultSize: result.length, result });
    }
    if (url.pathname === "/core-bill/api/order/save.json") {
      orderSaves += 1;
      const entity = body.entities[0];
      const saved = { ...entity, id: 8000 + orderSaves, optimistic: 0, states: [{ code: "OPEN" }], created: "2026-07-17T13:00:00.000Z",
        account: orderTemplate.account, currency: orderTemplate.currency, organization: orderTemplate.organization, type: orderTemplate.type, workflow: orderTemplate.workflow };
      orders.unshift(saved);
      return fulfill(route, [saved.id]);
    }
    if (url.pathname === "/core-bill/api/order/get.json") {
      return fulfill(route, orders.find((item) => item.id === Number(url.searchParams.get("id"))));
    }
    return fulfill(route, {}, 404);
  });

  const base = `http://127.0.0.1:${server.address().port}/calm-harbor-spa-live-demo.html`;
  await page.goto(base + "#/orders", { waitUntil: "networkidle" });
  await page.waitForSelector('[data-visual-id="next-appointment"]');
  assert.equal(await page.locator('[data-action="appointment.cancel"]').count(), 0, "live workflow must not invent a cancel command");

  await page.locator('[data-action="booking.open"]').first().click();
  await page.locator('[data-action="booking.selectService"]').first().click();
  if (await page.locator('[data-action="booking.selectSpecialist"]').count()) await page.locator('[data-action="booking.selectSpecialist"]').first().click();
  await page.locator('[data-action="booking.selectSlot"][data-id^="sl-"]').first().click();
  await page.locator('[data-action="booking.hold"]').click();
  await page.locator('[data-action="booking.ackPolicy"]').click();
  await Promise.all([
    page.waitForSelector('[data-visual-id="spa-confirmation"]'),
    page.locator('[data-action="booking.confirm"]').click(),
  ]);
  assert.equal(appointmentSaves, 1, "booking must execute one Appointment save");
  assert.match(await page.locator('[data-visual-id="spa-confirmation"]').innerText(), /recorded in Core/i);

  await page.locator('[data-action="purchase.openAppointment"]').click();
  await page.waitForSelector('[data-visual-id="next-appointment"]');
  await page.locator('[data-action="appointment.reschedule"]').first().click();
  await page.locator('[data-action="booking.selectSlot"][data-id^="sl-"]').nth(1).click();
  await page.locator('[data-action="booking.hold"]').click();
  await page.locator('[data-action="booking.ackPolicy"]').click();
  await Promise.all([
    page.waitForFunction(() => document.querySelector('[data-visual-id="spa-confirmation"]')?.textContent.includes("Booking updated")),
    page.locator('[data-action="booking.confirm"]').click(),
  ]);
  assert.equal(appointmentSaves, 2, "reschedule must execute one optimistic Appointment update");

  await page.evaluate(() => {
    window.AircovePortal.ACTIONS["cart.addItem"]("CHS_BODY_001");
    window.AircovePortal.ACTIONS["cart.open"]();
  });
  await page.waitForSelector('[data-visual-id="cart-checkout"]');
  await page.locator('[data-visual-id="cart-checkout"]').click();
  await page.locator('[data-action="checkout.ackPolicy"]').click();
  await Promise.all([
    page.waitForFunction(() => document.querySelector('[data-visual-id="spa-confirmation"]')?.textContent.includes("Order confirmed")),
    page.locator('[data-visual-id="checkout-confirm"]').click(),
  ]);
  assert.equal(orderSaves, 1, "checkout must execute one Order save");
  await page.locator('[data-action="account.openPurchases"]').click();
  await page.waitForSelector('[data-purchase-ref^="order-core-"]');
  assert.match(await page.locator('[data-module="purchase-list"]').innerText(), /Demo order recorded through the customer portal/);
  await page.evaluate(() => window.AircovePortal.ACTIONS["account.openProfile"]());
  await page.waitForSelector('[data-visual-id="profile-edit"]');
  await page.locator('[data-visual-id="profile-edit"]').click();
  await page.locator('input[data-field="email"]').fill("updated@example.test");
  await page.locator('[data-visual-id="profile-save"]').click();
  await page.waitForFunction(() => document.querySelector('[data-bind="profile.email"]')?.textContent === "updated@example.test");
  assert.equal(profileSaves, 1, "profile must execute one self User save");

  await page.evaluate(() => window.AircovePortal.ACTIONS["nav.go"]("pricing"));
  await page.waitForSelector('[data-visual-id="offer-buy-package"]:not([disabled])');
  await page.locator('[data-visual-id="offer-buy-package"]').click();
  await page.locator('[data-action="checkout.ackPolicy"]').click();
  await Promise.all([
    page.waitForFunction(() => document.querySelector('[data-visual-id="spa-confirmation"]')?.textContent.includes("Order confirmed")),
    page.locator('[data-visual-id="checkout-confirm"]').click(),
  ]);
  assert.equal(orderSaves, 2, "package purchase must execute one additional Core Order save");
  const planOrderConfirmation = await page.locator('[data-visual-id="spa-confirmation"]').innerText();
  assert.match(planOrderConfirmation, /recorded in Core/i);
  assert.doesNotMatch(planOrderConfirmation, /plan.*active|membership.*active/i, "an Order readback must not invent an active entitlement");
  assert.deepEqual(errors, []);
  console.log("calm-harbor-current-api-browser-check ok: booking, reschedule, retail/package checkout and profile email write to Core mocks and render readback");
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

function filterValue(body, property) {
  const filter = Array.isArray(body.filters) && body.filters.find((item) => item.property === property);
  return filter && String(filter.value);
}
function fulfill(route, json, status = 200) { return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(json) }); }
function send(response, status, body, type) { response.writeHead(status, { "content-type": type }); response.end(body); }
function contentType(file) { return file.endsWith(".html") ? "text/html; charset=utf-8" : file.endsWith(".js") ? "text/javascript; charset=utf-8" : file.endsWith(".css") ? "text/css; charset=utf-8" : "application/octet-stream"; }
