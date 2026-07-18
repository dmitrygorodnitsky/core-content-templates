import assert from "node:assert/strict";
import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { createRequire } from "node:module";
import { exportCalmHarborPortalManual } from "./export-calm-harbor-portal-manual.mjs";

const root = path.resolve("app-templates/customer-portal");
const inputPath = path.join(root, "content/cases/calm-harbor-spa.customer-portal-staging.json");
const outputDir = path.join(root, ".calm-harbor-portal-manual-customer-check");
const requests = [];
const backend = { accountMode: "ready", orderAccountId: 501 };
let server;
let browser;

try {
  await fs.rm(outputDir, { recursive: true, force: true });
  await exportCalmHarborPortalManual({ inputPath, outputDir });
  const template = JSON.parse(await fs.readFile(path.join(outputDir, "root/template.json"), "utf8"));
  const familyPayload = JSON.parse(await fs.readFile(path.join(outputDir, "cms-family.payload.json"), "utf8"));
  const manifest = JSON.parse(await fs.readFile(path.join(outputDir, "manual-export-manifest.json"), "utf8"));
  let preview = await fs.readFile(path.join(outputDir, "preview.html"), "utf8");

  assert.equal(template.code, "CUSTOMER_PORTAL_CALM_HARBOR_STAGING");
  assert.equal(familyPayload.schemaVersion, 1);
  assert.equal(familyPayload.root.code, template.code);
  assert.deepEqual(familyPayload.children, []);
  assert.match(template.html, /data-portal-enabled-modules="appointments,orders,services,pricing,products,account,cart,checkout,purchases,plan,profile"/);
  assert.match(template.html, /data-portal-profile="spaTarget"/);
  assert.match(template.html, /data-portal-capability="target-appointments"/);
  assert.match(template.html, /data-portal-booking="open"/);
  assert.match(template.html, /data-portal-retail="retail-commerce-open"/);
  assert.match(template.html, /data-portal-plan-commerce="open"/);
  assert.match(template.html, /data-portal-demo-commands="current-api"/);
  assert.match(template.html, /data-portal-organization="CALM_HARBOR_SPA_STAGING"/);
  assert.match(template.html, /data-portal-account-api-base="\/core-acct"/);
  assert.match(template.html, /data-portal-service-api-base="\/core-svc"/);
  assert.match(template.html, /data-portal-bill-api-base="\/core-bill"/);
  assert.match(template.html, /data-portal-account-type-code="SPA_CUSTOMER"/);
  assert.doesNotMatch(template.html, /account-id|user-id|access-token/i);
  assert.deepEqual(manifest.runtime.openedModules, ["appointments", "orders", "services", "pricing", "products", "account", "cart", "checkout", "purchases", "plan", "profile"]);
  assert.equal(manifest.runtime.account.accountTypeCode, "SPA_CUSTOMER");
  assert.match(template.javascript, /property: "user\.id"/);
  assert.match(template.javascript, /property: "type\.code"/);
  assert.match(template.javascript, /property: "account\.id"/);
  assert.match(template.javascript, /order-scope-mismatch/);
  assert.match(template.javascript, /tenant-demo-unscoped/);
  assert.match(template.javascript, /checkout\.confirm/);
  assert.doesNotMatch(template.javascript, /^\s*import\s/m);

  const fakeOidc = `<script>
    window.oidc = {
      WebStorageStateStore: function () {},
      UserManager: function () {
        this.getUser = async function () { return { access_token: "browser-test-token", token_type: "Bearer", expired: false, profile: { name: "Elena Rios" } }; };
        this.removeUser = async function () {};
        this.signinRedirect = async function () {};
        this.signoutRedirect = async function () {};
      }
    };
  </script>`;
  preview = preview.replace(/<script src="https:\/\/cdnjs\.cloudflare\.com[^>]+><\/script>/, fakeOidc);
  server = http.createServer(async (request, response) => {
    const url = new URL(request.url || "/", "http://127.0.0.1");
    if (url.pathname === "/preview.html") return send(response, 200, preview, "text/html; charset=utf-8");
    if (url.pathname === "/core/.well-known/oauth-protected-resource/") {
      const origin = `http://${request.headers.host}`;
      return json(response, {
        authorization_servers: [origin + "/core"], resource: origin + "/core", x_client_id: "customer-portal-test",
        x_redirect_uri: origin + "/core/oauth2-callback.html", x_post_logout_redirect_uri: origin + "/core/oauth2-callback.html",
      });
    }
    const body = await readBody(request);
    requests.push({ path: url.pathname, headers: request.headers, body: body ? JSON.parse(body) : null });
    if (url.pathname.startsWith("/core-pim/public/")) return json(response, { prices: pimReply(requests.at(-1).body.productTypeCode) });
    if (url.pathname === "/core/api/user/basic-info.json") return json(response, {
      authenticatedUserId: 42, authenticatedUserName: "Elena Rios",
      authorizedOrganizations: [{ id: 25, code: "CALM_HARBOR_SPA_STAGING" }],
    });
    if (url.pathname === "/core/api/user/get.json") return json(response, {
      id: 42, optimistic: 1, name: "elena", fullname: "Elena Rios", email: "elena@example.test", enabled: true,
      language: { id: 1 }, workflow: { id: 2 },
    });
    if (url.pathname === "/core-acct/api/account/list.json") {
      if (backend.accountMode === "missing") return json(response, { resultSize: 0, result: [] });
      return json(response, { resultSize: 1, result: [{ id: 501, code: "CHS_STG_ELENA_RIOS", user: { id: 42 }, nls: { en: { NAME: "Elena Rios" } } }] });
    }
    if (url.pathname === "/core-bill/api/order/list.json") return json(response, { resultSize: 1, result: [{
      id: 2, grandTotal: 145, account: { id: backend.orderAccountId }, currency: { code: "USD" },
      type: { code: "SPA_SERVICE_ORDER", nls: { en: { NAME: "Spa service order" } } },
      states: [{ id: 9, code: "OPEN", nls: { en: { NAME: "Open" } } }],
    }] });
    if (url.pathname === "/core-bill/api/order/save.json") return json(response, [3]);
    if (url.pathname === "/core-bill/api/order/get.json") return json(response, {
      id: 3, optimistic: 0, grandTotal: 48, totalCharges: 48, totalTaxes: 0, notes: "CP_DEMO_TEST",
      created: "2026-07-17T12:00:00.000Z", account: { id: 501 }, currency: { code: "USD" },
      organization: { id: 25 }, type: { id: 7, code: "SPA_SERVICE_ORDER" }, workflow: { id: 8, code: "SPA_ORDER_LIFECYCLE" }, states: [{ code: "OPEN" }],
    });
    if (url.pathname === "/core-svc/api/appointment/list.json") return json(response, { resultSize: 0, result: [] });
    return send(response, 404, "Not found", "text/plain");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const requireFrom = process.env.PLAYWRIGHT_NODE_MODULES ? createRequire(path.join(process.env.PLAYWRIGHT_NODE_MODULES, "package.json")) : createRequire(import.meta.url);
  const { chromium } = requireFrom("playwright");
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH || undefined });
  const page = await browser.newPage({ viewport: { width: 1180, height: 900 } });
  const url = `http://127.0.0.1:${address.port}/preview.html#/orders`;
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-route="orders.list"][data-state="ready"]');
  assert.equal(await page.locator('[data-module="spa-order-row"]').count(), 1);
  assert.match(await page.locator('[data-module="spa-order-row"]').innerText(), /Spa service order[\s\S]*Reference 2[\s\S]*SPA_SERVICE_ORDER[\s\S]*OPEN[\s\S]*\$145\.00[\s\S]*USD/);
  assert.doesNotMatch(await page.locator("body").innerText(), /501|CHS_STG_ELENA_RIOS|browser-test-token/);

  const basic = requests.find((item) => item.path === "/core/api/user/basic-info.json");
  const account = requests.find((item) => item.path === "/core-acct/api/account/list.json");
  const orders = requests.find((item) => item.path === "/core-bill/api/order/list.json");
  assert.equal(basic.headers.authorization, "Bearer browser-test-token");
  assert.equal(basic.headers["x-organization-code"], undefined, "basic-info deliberately has no organization header");
  assert.equal(account.headers["x-organization-code"], "CALM_HARBOR_SPA_STAGING");
  assert.deepEqual(account.body.filters, [
    { type: "INTEGER", operator: "=", property: "user.id", value: "42" },
    { type: "STRING", operator: "=", property: "type.code", value: "SPA_CUSTOMER" },
  ]);
  assert.equal(orders.headers["x-organization-code"], "CALM_HARBOR_SPA_STAGING");
  assert.deepEqual(orders.body.filters, [{ type: "INTEGER", operator: "=", property: "account.id", value: "501" }]);

  await page.goto(`http://127.0.0.1:${address.port}/preview.html#/services`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-module="spa-service-card"]');
  assert.match(await page.locator('[data-module="spa-service-card"]').innerText(), /Grounding massage[\s\S]*\$145[\s\S]*CHS_GROUNDING_MASSAGE/);
  assert.ok(await page.locator('[data-action="booking.open"]').count() > 0, "booking is open on the current API demo");
  await page.goto(`http://127.0.0.1:${address.port}/preview.html#/pricing`, { waitUntil: "networkidle" });
  const membershipLinkStyle = await page.locator('[data-module="membership-options"] button.link-action').evaluate((node) => {
    const style = getComputedStyle(node);
    return { borderWidth: style.borderWidth, backgroundColor: style.backgroundColor, padding: style.padding };
  });
  assert.deepEqual(membershipLinkStyle, { borderWidth: "0px", backgroundColor: "rgba(0, 0, 0, 0)", padding: "0px" }, "membership link button has no native browser chrome");
  await page.goto(`http://127.0.0.1:${address.port}/preview.html#/products`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-module="spa-shop-card"]');
  assert.match(await page.locator('[data-module="spa-shop-card"]').innerText(), /Harbor body oil[\s\S]*\$48[\s\S]*CHS_HARBOR_BODY_OIL/);
  assert.doesNotMatch(await page.locator('[data-route="products"]').innerText(), /Browse-only/i);
  const buy = page.locator('[data-action="cart.addItem"]').first();
  assert.equal(await buy.innerText(), "Add to bag");
  await buy.click();
  await page.locator('[data-action="cart.open"]').first().click();
  await page.locator('[data-visual-id="cart-checkout"]').click();
  await page.waitForSelector('[data-route="checkout"][data-state="ready"] [data-module="simulation-notice"]');
  assert.equal(await page.locator('[data-action="checkout.confirm"]').isDisabled(), true, "confirmation waits for simulation acknowledgement");
  await page.locator('[data-action="checkout.ackPolicy"]').click();
  assert.equal(await page.locator('[data-action="checkout.confirm"]').isEnabled(), true);
  await page.locator('[data-action="checkout.confirm"]').click();
  await page.waitForSelector('[data-route="checkout"][data-state="confirmed"] [data-module="spa-confirmation"]');
  const confirmation = await page.locator('[data-route="checkout"]').innerText();
  assert.match(confirmation, /Order confirmed[\s\S]*did not take a payment/i);
  assert.doesNotMatch(confirmation, /\bPaid\b|Charged|Payment successful|receipt created/i);

  await page.goto(`http://127.0.0.1:${address.port}/preview.html#/account`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-route="account"][data-capability="target-appointments"]');
  assert.equal(await page.locator('[data-module="account-entry"][data-state="unavailable"]').count(), 2);
  assert.match(await page.locator('[data-route="account"]').innerText(), /Purchases[\s\S]*My plan[\s\S]*Membership options[\s\S]*Profile[\s\S]*Support/);
  assert.ok(await page.locator('[data-route="account"] [data-action="account.openPurchases"]').count() > 0, "purchases are live");

  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-route="orders.list"][data-state="ready"]');
  await page.locator('[data-module="account-control"]').click();
  await page.locator('[data-module="account-menu"] button', { hasText: "Support" }).click();
  await page.waitForSelector('[data-module="support-unavailable"]');
  assert.match(await page.locator('[data-module="support-unavailable"]').innerText(), /nothing was opened, sent or recorded/i);
  await page.locator('[data-visual-id="support-dismiss"]').click();
  await page.locator('[data-module="account-control"]').click();
  await page.locator('[data-module="account-menu"] button', { hasText: "Switch to dark mode" }).click();
  assert.equal(await page.locator("html").getAttribute("data-mode"), "dark");

  backend.orderAccountId = 999;
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector('[data-route="orders.list"][data-state="order-scope-mismatch"]');
  assert.equal(await page.locator('[data-module="spa-order-row"]').count(), 0, "foreign Order fails closed");

  backend.orderAccountId = 501;
  backend.accountMode = "missing";
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector('[data-route="orders.list"][data-state="customer-not-linked"]');
  assert.equal(await page.locator('[data-module="spa-order-row"]').count(), 0, "missing Account has no private fallback");

  console.log("calm-harbor-customer-portal-manual-check ok: OIDC User -> Account -> scoped Orders, foreign and missing scope fail closed");
} finally {
  if (browser) await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
  await fs.rm(outputDir, { recursive: true, force: true });
}

function json(response, value) { return send(response, 200, JSON.stringify(value), "application/json; charset=utf-8"); }
function send(response, status, body, contentType) { response.writeHead(status, { "content-type": contentType }); response.end(body); }
function readBody(request) { return new Promise((resolve, reject) => { let body = ""; request.setEncoding("utf8"); request.on("data", (chunk) => { body += chunk; }); request.on("end", () => resolve(body)); request.on("error", reject); }); }
function pimReply(type) {
  const values = {
    SPA_SERVICE: [pimRow("CHS_GROUNDING_MASSAGE", "Grounding massage", "A calm 75-minute treatment", 145, "ONE_TIME")],
    SPA_MEMBERSHIP: [pimRow("CHS_HARBOR_MEMBERSHIP", "Harbor membership", "A public membership offer", 18, "MONTH")],
    SPA_PACKAGE: [pimRow("CHS_HARBOR_RESET_SERIES", "Harbor reset series", "A public package offer", 510, "ONE_TIME")],
    SPA_RETAIL: [pimRow("CHS_HARBOR_BODY_OIL", "Harbor body oil", "Aromatic body care", 48, "ONE_TIME")],
  };
  return values[type] || [];
}
function pimRow(code, name, description, amount, interval) {
  return { product: { product: { code, nls: { en: { NAME: name, DESCRIPTION: description } } } }, price: { display: { amount, currency: "USD", intervalLabel: interval } } };
}
