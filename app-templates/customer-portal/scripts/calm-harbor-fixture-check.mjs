import assert from "node:assert/strict";

globalThis.window = globalThis;

const runtimeRoot = new URL("../runtime/", import.meta.url);
const { calmHarborSpaFixture } = await import(new URL("data/cases/calm-harbor-spa.js", runtimeRoot));
const { readPortalConfig } = await import(new URL("src/config.js", runtimeRoot));
const { fixtureAdapter } = await import(new URL("src/adapters/fixture-adapter.js", runtimeRoot));
const { createCareFixtureAdapter } = await import(new URL("src/adapters/care-fixture-adapter.js", runtimeRoot));
const { normalizeCare } = await import(new URL("src/normalizers/care.js", runtimeRoot));
const { applyPortalConfig, currentFixture, currentTheme, findProduct, state } = await import(new URL("src/state.js", runtimeRoot));

function root(dataset) { return { dataset }; }

const config = readPortalConfig(root({
  portalVertical: "beauty",
  portalProfile: "appointments",
  portalTheme: "beauty",
  portalDataMode: "fixture",
  portalAuthMode: "fixture",
  portalCase: "calm-harbor-spa",
}));

assert.equal(config.caseId, "calm-harbor-spa");
assert.equal(config.vertical, "beauty");
assert.equal(config.profile, "appointments");
applyPortalConfig(config);

assert.equal(currentFixture().organization.name, "Calm Harbor Spa");
assert.equal(currentTheme().plan.name, "Harbor Membership");
assert.equal(state.orders.length, 4);
assert.equal(state.orders.filter((order) => order.status === "scheduled").length, 1);
assert.equal(findProduct("Harbor body oil").sku, "CHS-BODY-001");

const context = { config, state };
const services = fixtureAdapter.load("services", context);
const pricing = fixtureAdapter.load("pricing", context);
const products = fixtureAdapter.load("products", context);
const orders = fixtureAdapter.load("orders", context);
const profile = fixtureAdapter.load("profile", context);
const checkout = fixtureAdapter.load("checkout", context);
const support = fixtureAdapter.load("support", context);
const activity = fixtureAdapter.load("activity", context);

assert.deepEqual(services.services.map((service) => service.id), calmHarborSpaFixture.theme.svc.map((service) => service.id));
assert.equal(pricing.plan.monthlyPrice, "$18");
assert.equal(products.products.length, 5);
assert.equal(orders.orders[0].id, "#CHS-1042");
assert.equal(profile.customer.fullName, "Elena Rios");
assert.equal(checkout.addresses.find((address) => address.id === "studio").label, "Calm Harbor Spa");
assert.equal(support.customer.firstName, "Elena");
assert.equal(activity.groups[0].items[0].act, "orders");

const careRaw = await createCareFixtureAdapter().load("care", context);
const care = normalizeCare(careRaw);
assert.equal(care.kind, "beautyCare");
assert.equal(care.content.appointment.orderId, "#CHS-1050");
assert.equal(care.content.tasks.length, 3);
assert.deepEqual(care.allowedActions, ["care.selectSpecialist", "care.completeTask"]);
assert.deepEqual(care.content.productRecs.items.map((product) => product.sku), ["CHS-BODY-001", "CHS-SKIN-001", "CHS-SKIN-002"]);

const liveConfig = readPortalConfig(root({ portalVertical: "beauty", portalDataMode: "live", portalCase: "calm-harbor-spa" }));
assert.equal(liveConfig.caseId, "", "live mode must not select a fixture case");
const wrongVerticalConfig = readPortalConfig(root({ portalVertical: "hvac", portalDataMode: "fixture", portalCase: "calm-harbor-spa" }));
assert.equal(wrongVerticalConfig.caseId, "", "a beauty fixture case must not cross verticals");

console.log("calm-harbor-fixture-check ok: coherent fixture organization across products, pricing, appointments, orders, account, support, activity, and care");
