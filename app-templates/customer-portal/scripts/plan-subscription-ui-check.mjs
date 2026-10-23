import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve("app-templates/customer-portal");
const runtimeDir = path.join(root, "runtime/plan-subscription");
const RUNTIME = ["core.js", "copy.js", "ui.js", "catalog.js", "selection.js", "purchase.js", "confirm.js", "order.js"];
const context = vm.createContext({ console, URL, URLSearchParams, Intl, setTimeout, clearTimeout, Promise });
context.window = context;
for (const name of RUNTIME.concat(["fixtures.js"])) {
  vm.runInContext(await fs.readFile(path.join(runtimeDir, name), "utf8"), context, { filename: name });
}
const PS = context.PlanSubscription;
const fixtures = context.PlanSubscriptionFixtures;
const plain = (value) => JSON.parse(JSON.stringify(value));

const entitlements = JSON.parse(await fs.readFile(path.join(root, "scripts/plan-subscription/entitlements/config.json"), "utf8"));
assert.deepEqual(plain(fixtures.rules), {
  planCodes: entitlements.plans.productCodes,
  siteExpansionCodes: entitlements.addons.siteExpansion.productCodes,
  weatherCode: entitlements.addons.weather.productCode,
  maximumByPlanCode: entitlements.propertyCapacity.overallPlanMaximum.byPlanCode,
}, "harness rules must equal the backend entitlement configuration");

const formType = JSON.parse(await fs.readFile(path.join(root, "content/form-types/PLAN_SUBSCRIPTION.json"), "utf8"));

const respond = await fixtures.fetchFor("ok")("https://dev-1.servicewand.com/core-pim/public/SERVICEWAND/catalog/price-comparison.json");
const catalog = PS.catalog.normalize(JSON.parse(await respond.text()), fixtures.rules, "en");
assert.equal(catalog.currency, "USD");
assert.deepEqual(plain(catalog.plans.map((plan) => [plan.code, plan.selfService])), [
  ["SERVICEWAND_FOUNDATION", true],
  ["SERVICEWAND_GROWTH", true],
  ["SERVICEWAND_PROFESSIONAL", true],
  ["SERVICEWAND_ENTERPRISE", false],
]);
assert.deepEqual(plain(Object.values(catalog.addons).map((addon) => [addon.id, addon.role, addon.packSize]).sort((a, b) => a[0] - b[0])), [
  [40, "SITE_EXPANSION", 50],
  [41, "WEATHER", 1],
  [46, "SITE_EXPANSION", 100],
  [47, "SITE_EXPANSION", 100],
]);
assert.equal(catalog.addons[42], undefined, "metered routing credits with a fixed fee are never offered");

const plan = (code) => catalog.plans.find((entry) => entry.code === code);
const optionsFor = (code, extra = {}) => PS.selection.options(catalog, { planId: plan(code).id, period: "MONTHLY", packs: 0, weatherOn: false, weather: 0, ...extra });
assert.deepEqual([optionsFor("SERVICEWAND_FOUNDATION").maxPacks, optionsFor("SERVICEWAND_GROWTH").maxPacks, optionsFor("SERVICEWAND_PROFESSIONAL").maxPacks], [9, 8, 15]);
assert.equal(optionsFor("SERVICEWAND_GROWTH").expansion.id, 47);
assert.equal(optionsFor("SERVICEWAND_GROWTH", { packs: 3 }).capacity, 500);

assert.equal(PS.selection.initial(catalog, {}).planId, null, "no plan is preselected without a landing preset");
assert.equal(PS.selection.initial(catalog, { plan: "SERVICEWAND_ENTERPRISE" }).planId, null, "a sales-only preset is not preselected");
assert.equal(PS.selection.initial(catalog, { plan: "SERVICEWAND_GROWTH" }).planId, plan("SERVICEWAND_GROWTH").id);
let selection = PS.selection.initial(catalog, { plan: "SERVICEWAND_PROFESSIONAL", period: "YEARLY" });
selection = PS.selection.normalize(catalog, { ...selection, packs: 15 });
assert.equal(selection.packs, 15);
selection = PS.selection.normalize(catalog, { ...selection, planId: plan("SERVICEWAND_FOUNDATION").id });
assert.equal(selection.packs, 9, "changing plan clamps packs to the new plan limit");

const weatherError = (raw, packs = 0) => PS.selection.validateAddons(catalog, { planId: plan("SERVICEWAND_GROWTH").id, period: "MONTHLY", packs, weatherOn: true, weather: Number(raw) || 0 }, raw).weather;
assert.equal(weatherError(""), "required");
assert.equal(weatherError("0"), "positive");
assert.equal(weatherError("1.5"), "positive");
assert.equal(weatherError("201"), "capacity");
assert.equal(weatherError("201", 1), undefined);

assert.deepEqual(plain(PS.selection.validateContact({ COMPANY_NAME: "Acme", COMPANY_ADDRESS: "1 Main St", EMAIL: "ops@acme.ca" })), {});
assert.deepEqual(plain(PS.selection.validateContact({})), { COMPANY_NAME: "required", COMPANY_ADDRESS: "required", EMAIL: "required" });
for (const email of ["a..b@x.ca", ".a@x.ca", "a.@x.ca", "a(b)@x.ca", "a@x", "a b@x.ca"]) {
  assert.equal(PS.selection.validateContact({ COMPANY_NAME: "A", COMPANY_ADDRESS: "B", EMAIL: email }).EMAIL, "email", email);
}
assert.equal(PS.selection.validateContact({ COMPANY_NAME: "A", COMPANY_ADDRESS: "1 Main\nSt", EMAIL: "a@x.ca" }).COMPANY_ADDRESS, "invalid");
assert.equal(PS.selection.validateContact({ COMPANY_NAME: "x".repeat(4097), COMPANY_ADDRESS: "B", EMAIL: "a@x.ca" }).COMPANY_NAME, "invalid");

const contact = { COMPANY_NAME: " Acme ", COMPANY_ADDRESS: "1 Main St, Vancouver, BC", EMAIL: "ops@acme.ca", FIRST_NAME: "", PHONE: " " };
const growth = { planId: plan("SERVICEWAND_GROWTH").id, period: "YEARLY", packs: 0, weatherOn: false, weather: 0 };
assert.deepEqual(plain(PS.selection.attributes(catalog, growth, contact)), {
  PLAN_PRODUCT: 43, BILLING_PERIOD: "YEARLY", ADDON_PRODUCTS: [], COMPANY_NAME: "Acme", COMPANY_ADDRESS: "1 Main St, Vancouver, BC", EMAIL: "ops@acme.ca",
});
assert.deepEqual(plain(PS.selection.attributes(catalog, { ...growth, packs: 2, weatherOn: true, weather: 150 }, contact)), {
  PLAN_PRODUCT: 43, BILLING_PERIOD: "YEARLY", ADDON_PRODUCTS: [47, 41], SITE_EXPANSION_PACKS: 2, WEATHER_PROPERTY_COUNT: 150,
  COMPANY_NAME: "Acme", COMPANY_ADDRESS: "1 Main St, Vancouver, BC", EMAIL: "ops@acme.ca",
});
assert.deepEqual(plain(PS.selection.attributes(catalog, { ...growth, weatherOn: true, weather: 0 }, contact)).ADDON_PRODUCTS, [], "an unfinished Weather selection is never submitted");
const everything = PS.selection.attributes(catalog, { ...growth, packs: 1, weatherOn: true, weather: 10 }, { COMPANY_NAME: "A", COMPANY_ADDRESS: "B", FIRST_NAME: "C", LAST_NAME: "D", EMAIL: "e@f.ca", PHONE: "1" });
assert.deepEqual(Object.keys(everything).sort(), formType.attributes.map((attribute) => attribute.code).sort(), "the form submits exactly the FormType attributes");
assert.deepEqual(plain(PS.selection.submitBody(6, 7, { PLAN_PRODUCT: 43, ADDON_PRODUCTS: [] })), {
  type: { id: 6 }, organization: { id: 7 }, attributes: { 6: { PLAN_PRODUCT: { value: 43 }, ADDON_PRODUCTS: { value: [] } } },
});

assert.deepEqual(plain([200, 410, 404, 400, 500, 0].map((status) => PS.confirm.outcome(status))), ["received", "used", "unknown", "failed", "failed", "failed"]);

const order = { id: 9001, currency: { code: "USD" }, states: [{ code: "DRAFT", nls: { en: { NAME: "Draft" } } }], totalCharges: 1334, totalTaxes: null, grandTotal: 1334 };
const items = [{ id: 1, itemCount: 300, amount: 1.95, itemPrice: { nls: { en: { NAME: "Weather" } } }, order: { id: 9001 } }];
const view = PS.order.normalize(order, items, { expiresAt: "2026-10-24T10:00:00Z" }, "en", PS.copy.defaults.order);
assert.equal(view.lines[0].amount, 58500);
assert.equal(view.subtotal, 133400);
assert.equal(view.total, null, "no total is shown as final while taxes are not calculated");
assert.equal(PS.order.normalize({ ...order, totalTaxes: 66.7, grandTotal: 1400.7 }, items, null, "en", PS.copy.defaults.order).total, 140070);
const typed = [{ id: 1, itemCount: 1, amount: 449, itemPrice: { id: 251 }, type: { nls: { en: { NAME: "Subscription Item" } } } }];
assert.equal(PS.order.normalize(order, typed, null, "en", PS.copy.defaults.order, { 251: { id: 251, product: { nls: { en: { NAME: "Growth" } } } } }).lines[0].name, "Growth", "lines are named after the granted product");
assert.equal(PS.order.normalize(order, typed, null, "en", PS.copy.defaults.order, {}).lines[0].name, "Subscription Item", "grants without price entries fall back to the item type");
const lines = [{ id: 3, itemCount: 1, amount: 1 }, { id: 1, itemCount: 1, amount: 2 }, { id: 2, itemCount: 1, amount: 3 }];
assert.deepEqual(plain(PS.order.normalize(order, lines, null, "en", PS.copy.defaults.order).lines.map((line) => line.id)), [1, 2, 3], "lines follow creation order");
assert.equal(PS.order.normalize(order, items, { expiresAt: 1792850587259 }, "en", PS.copy.defaults.order).expiresAt, 1792850587259, "core-bill introspection returns epoch milliseconds");

for (const name of RUNTIME) {
  const source = await fs.readFile(path.join(runtimeDir, name), "utf8");
  assert.ok(!/localStorage|sessionStorage|document\.cookie/.test(source), `${name} must not persist buyer data or credentials`);
  assert.ok(!/credentials:\s*"include"/.test(source), `${name} must not send cookies`);
}

console.log("plan-subscription-ui-check: ok");
