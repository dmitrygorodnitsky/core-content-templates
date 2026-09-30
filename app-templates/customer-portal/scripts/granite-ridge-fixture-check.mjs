import assert from "node:assert/strict";

globalThis.window = globalThis;

const runtimeRoot = new URL("../runtime/", import.meta.url);
const { graniteRidgeSnowFixture } = await import(new URL("data/cases/granite-ridge-snow.js", runtimeRoot));
const { portalProfiles, readPortalConfig } = await import(new URL("src/config.js", runtimeRoot));
const { fixtureAdapter } = await import(new URL("src/adapters/fixture-adapter.js", runtimeRoot));
const { createCareFixtureAdapter } = await import(new URL("src/adapters/care-fixture-adapter.js", runtimeRoot));
const { normalizeCare } = await import(new URL("src/normalizers/care.js", runtimeRoot));
const { normalizeProposals } = await import(new URL("src/normalizers/index.js", runtimeRoot));
const {
  applyPortalConfig,
  currentFixture,
  currentProposal,
  currentStormCalendar,
  currentTheme,
  proposalSites,
  quotePackage,
  state,
} = await import(new URL("src/state.js", runtimeRoot));
const { clampFrameIndex, invoiceBuckets, money, propertyStatus, propertyWeather, serviceDayCount } = await import(new URL("src/normalizers/overview.js", runtimeRoot));
const { propertyPoint } = await import(new URL("src/normalizers/property-map.js", runtimeRoot));

function root(dataset) { return { dataset }; }

const plainValue = (value) => JSON.parse(JSON.stringify(value));

const config = readPortalConfig(root({
  portalVertical: "snow",
  portalProfile: "stormRetail",
  portalTheme: "snow",
  portalDataMode: "fixture",
  portalAuthMode: "fixture",
  portalCase: "granite-ridge-snow",
  portalBrandName: "Granite Ridge",
}));

assert.equal(config.caseId, "granite-ridge-snow");
assert.equal(config.vertical, "snow");
assert.equal(config.profile, "stormRetail");
applyPortalConfig(config);

const profileDefinition = portalProfiles.stormRetail;
assert.equal(profileDefinition.weatherCalendar, true, "snow retail keeps the weather-operational calendar");
assert.ok(profileDefinition.nav.length <= portalProfiles.stormOps.nav.length, "nav must not grow past the accepted stormOps item count");
assert.ok(profileDefinition.modules.includes("pricing"));
assert.ok(!profileDefinition.nav.some((item) => item.key === "pricing"), "pricing stays reachable through the accepted Manage plan action, not an eighth nav item");

assert.equal(currentFixture().organization.name, "Granite Ridge Snow Removal");
assert.equal(currentTheme().plan.name, "Winter Plan");
assert.equal(currentTheme().wt.trigger, "Snowfall ≥ 2 cm forecast overnight");
assert.equal(state.orders.length, 6);
assert.equal(state.orders.filter((order) => order.wt && order.wt.status === "pending").length, 1);
assert.equal(state.orders.filter((order) => order.status === "completed").length, 3);

const context = { config, state };
const services = fixtureAdapter.load("services", context);
const pricing = fixtureAdapter.load("pricing", context);
const products = fixtureAdapter.load("products", context);
const orders = fixtureAdapter.load("orders", context);
const calendar = fixtureAdapter.load("calendar", context);
const proposals = fixtureAdapter.load("proposals", context);
const profile = fixtureAdapter.load("profile", context);
const checkout = fixtureAdapter.load("checkout", context);
const support = fixtureAdapter.load("support", context);
const activity = fixtureAdapter.load("activity", context);

assert.deepEqual(services.services.map((service) => service.id), graniteRidgeSnowFixture.theme.svc.map((service) => service.id));
assert.equal(pricing.plan.plusMonthlyPrice, "$268");
assert.equal(products.products.length, 7);
assert.equal(orders.orders[0].id, "#GR-3182");
assert.equal(orders.technician.name, "Marcus Hale");
assert.equal(profile.customer.fullName, "Dana Whitlock");
assert.equal(checkout.addresses.find((address) => address.id === "tabor").city, "Golden, CO 80401");
assert.equal(support.customer.firstName, "Dana");
assert.equal(activity.groups[0].items[0].act, "weather");

assert.equal(calendar.stormCalendar, graniteRidgeSnowFixture.stormCalendar, "the calendar module must serve the tenant storm calendar");
assert.equal(calendar.stormCalendar.days.filter((day) => day.today).length, 1);
assert.equal(calendar.stormCalendar.days.find((day) => day.today).events[0].tech, "Marcus H.");
assert.equal(currentStormCalendar().accessNotes[2].value, "Do not service Yarrow Ridge");

assert.equal(proposals.proposal, null, "the package model has no proposal number, sent date or validity, because Core holds none of them");
assert.equal(currentProposal(), null);
assert.equal(proposalSites().length, 4);
assert.ok(proposalSites().every((site) => site.status === undefined && site.x === undefined && site.areas === undefined && site.selected === undefined), "a site carries no decision, map position, measured area or plan; its Orders and their lines do");
assert.equal(graniteRidgeSnowFixture.proposals.planPricingModels, undefined, "the retired plan ids have no mapping to pricing models any more");
assert.equal(graniteRidgeSnowFixture.proposals.planNames, undefined);

const fixtureProposals = graniteRidgeSnowFixture.proposals;
const normalizedProposals = normalizeProposals(proposals);
const quotes = normalizedProposals.quotes;
assert.deepEqual(plainValue(quotes.agreements.map((agreement) => [agreement.backendId, agreement.stateCode])), [
  [9101, "QUOTATION_SENT"], [9102, "SENT_TO_CLIENT"], [9103, "AWAITING_CLIENT_DETAILS"], [9104, "PENDING_MANAGEMENT_APPROVAL"], [9100, "ACTIVE"], [9099, "EXPIRED"],
  [9098, "SUSPENDED"], [9097, "ARCHIVED"], [9096, "CANCELED"], [9095, "CLIENT_APPROVED"],
], "the customer holds one agreement in every stage the Contracts screens show");
assert.equal(quotes.orders.length, 31, "every sent Order is a row");
assert.equal(quotes.preparing, true, "the Order still being prepared is withheld and only switches the preparing notice on");
assert.equal(fixtureProposals.orders.length, 32);
assert.deepEqual(quotes.withheldBackendIds, [8113]);
const listedBy = new Map();
for (const agreement of quotes.agreements) {
  for (const id of agreement.orderBackendIds) {
    assert.ok(!listedBy.has(id), `order ${id} is listed by two agreements`);
    listedBy.set(id, agreement.backendId);
  }
}
assert.deepEqual(plainValue([...listedBy.keys()].sort()), plainValue(quotes.orders.map((order) => order.backendId).sort()), "every sent Order belongs to exactly one agreement, and the withheld one to none");
const propertiesByBackendId = new Map(graniteRidgeSnowFixture.overview.properties.map((property) => [property.backendId, property]));
for (const order of quotes.orders) {
  assert.ok(propertiesByBackendId.has(order.propertyBackendId), `order ${order.backendId} points at a property the fixture does not have`);
  assert.ok(order.pricingModel, `order ${order.backendId} has no pricing model label`);
  assert.equal(order.linesState, "ready", `order ${order.backendId} has unreadable lines`);
  assert.equal(order.lines.length, 2);
  assert.ok(order.lines.every((line) => line.product && line.quantity && line.unitPrice && line.total), `order ${order.backendId} has a line without product, quantity, unit price or total`);
}
for (const row of fixtureProposals.orders) {
  const lines = fixtureProposals.orderItems.filter((line) => line.order.id === row.id);
  assert.deepEqual(plainValue(row.items.map((item) => item.id)), plainValue(lines.map((line) => line.id)), `order ${row.id} lists exactly its own lines`);
  lines.forEach((line) => assert.equal(line.grandTotal, Math.round(line.amount * line.itemCount * 100) / 100, `line ${line.id} total is its quantity times its unit price`));
  assert.equal(row.totalCharges, Math.round(lines.reduce((sum, line) => sum + line.grandTotal, 0) * 100) / 100, `order ${row.id} charges are its lines`);
  assert.equal(row.grandTotal, Math.round((row.totalCharges + row.totalTaxes) * 100) / 100, `order ${row.id} total is its charges plus taxes`);
}
const withheld = fixtureProposals.orders.find((order) => order.id === 8113);
assert.ok(graniteRidgeSnowFixture.overview.properties.some((property) => property.backendId === withheld.attributes[5].SERVICE_PROPERTY.value), "the withheld Order belongs to a property of this customer");
assert.ok(fixtureProposals.orderItems.some((line) => line.order.id === 8113), "the withheld Order has lines, so the normalizer's refusal to show them is exercised");

state.moduleData.proposals = normalizedProposals;
const pack = quotePackage();
assert.deepEqual(plainValue(pack.agreements.map((row) => row.agreement.stage)), ["approval", "review", "details", "drafting", "approved", "active", "suspended", "expired", "archived", "canceled"]);
assert.deepEqual(plainValue(pack.groups.map((group) => group.id)), ["quote-9101-7101", "quote-9101-7102", "quote-9101-7103", "quote-9101-7104"]);
assert.deepEqual(plainValue(pack.groups.map((group) => group.decision)), ["approved", "revision", "declined", "open"], "every property decision the page shows is exercised");
assert.deepEqual(plainValue(pack.groups.map((group) => group.status)), ["approved", "revision", "declined", "viewed"]);
assert.deepEqual(plainValue(pack.groups[3].orders.map((order) => order.status)), ["viewed", "unseen", "unseen"], "an open property mixes a viewed option with unseen ones, so both the decisions and the view event are exercised");
for (const group of pack.groups) {
  assert.deepEqual(plainValue(group.orders.map((order) => order.pricingModel.code)), ["PER_SERVICE", "MONTHLY", "SEASONAL"], group.id + " is quoted once per pricing model");
}
assert.deepEqual(plainValue(pack.counts), { orders: 12, properties: 4, decided: 2, approved: 1, revision: 3, declined: 5, open: 3 });
assert.equal(pack.counts.approved + pack.counts.revision + pack.counts.declined + pack.counts.open, pack.counts.orders, "the rollup counts every row exactly once");
assert.deepEqual(plainValue(pack.servicePeriod), { start: "2026-11-01", end: "2027-03-31" });
assert.deepEqual(
  plainValue(pack.groups.map((group) => group.orders.map((order) => order.total && order.total.amount))),
  [[266.51, 9322.74, 8875.13], [328.25, 11483.64, 10933.13], [236.67, 8268.02, 7871.85], [992.99, 33766.64, 32156.25]],
  "each option carries Core's grand total; nothing is derived from an area",
);
const approval = pack.agreements[0];
assert.deepEqual(plainValue(approval.properties.map((entry) => [entry.title, entry.orders.map((order) => order.status)])), [["Alkire Street", ["approved"]], ["Braun Court", ["approved"]]], "past review an agreement's services are its approved options");
assert.ok(approval.agreement.terms.some((block) => block.kind === "numbered" && block.marker === "1)"), "the terms exercise every numbered marker style");
assert.ok(approval.agreement.terms.some((block) => block.kind === "item"));
assert.ok(approval.agreement.terms.some((block) => block.kind === "heading"));
assert.deepEqual(plainValue(pack.agreements.filter((row) => row.agreement.allowedActions.includes("approve")).map((row) => row.id)), ["agreement-core-9102"], "exactly one agreement is waiting for the customer's approval");

const overview = fixtureAdapter.load("overview", context).overview;
assert.ok(overview, "the snow tenant must carry overview data");
assert.equal(overview.properties.length, 24, "the map is only worth designing at portfolio density");
assert.ok(overview.properties.every((property) => Number.isInteger(property.backendId)), "every property carries the Core id its Orders reference");
assert.equal(new Set(overview.properties.map((property) => property.backendId)).size, overview.properties.length);
assert.deepEqual(
  plainValue(overview.properties.slice(0, 4).map((property) => propertyStatus(property))),
  ["enroute", "scheduled", "issue", "monitoring"],
  "every derived property status must be exercised by the fixture",
);
assert.deepEqual(
  plainValue([...new Set(overview.properties.map((property) => propertyStatus(property)))].sort()),
  ["enroute", "issue", "monitoring", "scheduled"],
);
const yarrow = overview.properties.find((property) => property.id === "prop-yarrow");
assert.equal(yarrow.appointment.state, "SCHEDULED");
assert.equal(propertyStatus(yarrow), "issue", "an open ticket outranks a scheduled appointment");
assert.ok(overview.banner && overview.banner.title && overview.banner.copy && overview.banner.action);
const buckets = invoiceBuckets(overview.invoices);
assert.equal(buckets.outstanding.count, 12);
assert.equal(buckets.overdue.count, 7, "the overdue block is the point of the widget and must be exercised");
assert.ok(buckets.paidThisMonth.count, "the paid-this-month column needs its own rows");
assert.equal(
  buckets.overdue.amount + buckets.dueThisMonth.amount
    + overview.invoices.outstanding.filter((invoice) => invoice.state === "DUE_LATER").reduce((running, invoice) => running + invoice.amount, 0),
  buckets.outstanding.amount,
  "every outstanding invoice must fall into exactly one bucket",
);
assert.equal(money(buckets.overdue.amount), "$24,850.00");
assert.equal(money(buckets.outstanding.amount), "$32,150.00");
for (const invoice of overview.invoices.outstanding) {
  assert.equal(typeof invoice.amount, "number", "amounts are summed, so they cannot be pre-formatted strings");
  assert.ok(["OVERDUE", "DUE_THIS_MONTH", "DUE_LATER"].includes(invoice.state), `unknown invoice state ${invoice.state}`);
}
assert.equal(overview.support.length, 4, "more than two requests proves the overflow line");
assert.equal(overview.weather.timeline.length, 7, "the timeline spans a week of days, not a day of hours");
assert.ok(overview.weather.timeline[overview.weather.nowIndex], "nowIndex must point at a real frame");
assert.deepEqual(
  plainValue([...new Set(overview.weather.timeline.map((frame) => frame.kind))].sort()),
  ["clear", "freezing", "snow", "storm"],
  "the timeline must exercise every weather kind in the legend",
);
assert.equal(overview.weather.timeline[0].day, "Today");
for (const frame of overview.weather.timeline) {
  assert.ok(frame.day && frame.date, "every frame names a day and a date");
  assert.equal(frame.at, undefined, "hourly frames must not survive alongside the day timeline");
  assert.equal(frame.stats.length, 4, "the header panel reads four measures per day");
  assert.ok(frame.zones && Object.keys(frame.zones).length, "pins take their colour from the zone forecast");
}
const zones = new Set(overview.properties.map((property) => property.zone));
for (const frame of overview.weather.timeline) {
  for (const zone of zones) assert.ok(frame.zones[zone], `frame ${frame.date} must forecast zone ${zone}`);
}
assert.deepEqual(
  plainValue(overview.weather.legend.map((item) => item.key)),
  ["clear", "snow", "freezing", "storm", "issue"],
  "the legend must name every colour a pin can take",
);
const stormFrame = overview.weather.timeline[0];
assert.equal(propertyWeather(yarrow, stormFrame), "issue", "an open ticket outranks the zone forecast on the map");
assert.equal(
  propertyWeather(overview.properties.find((property) => property.id === "prop-cinnamon"), stormFrame),
  stormFrame.zones.south,
);
assert.equal(clampFrameIndex(overview.weather.timeline, 99), 6);
assert.equal(clampFrameIndex(overview.weather.timeline, -3), 0);
const serviceDays = overview.weather.timeline.map((_, index) => serviceDayCount(overview.properties, index));
assert.deepEqual(plainValue(serviceDays), [4, 5, 2, 2, 0, 0, 1], "the timeline must mark the days a visit actually happens");
assert.ok(serviceDays.some((count) => count === 0), "a day without service must stay unmarked");
for (const property of overview.properties) {
  if (!property.appointment) continue;
  const index = property.appointment.dayIndex;
  assert.ok(
    Number.isInteger(index) && overview.weather.timeline[index],
    `${property.name} is booked for day ${index}, which the timeline does not have`,
  );
  assert.equal(property.appointment.date, undefined, "a booked day is an index, so a live timeline can re-date it");
}
assert.ok(
  overview.weather.zoneCentroids && Object.keys(overview.weather.zoneCentroids).length,
  "every zone needs a centroid before a forecast can be asked for it",
);

const geo = overview.map;
assert.deepEqual(Object.keys(geo).sort(), ["center", "zoom"], "the map carries an initial viewport only; image size and layers retired with the Xweather map image");
assert.ok(Number.isFinite(geo.center.lat) && Number.isFinite(geo.center.lon) && Number.isFinite(geo.zoom));
for (const property of overview.properties) {
  assert.ok(propertyPoint(property), `${property.name} has no coordinate, so the fixture map would list it without a pin`);
  assert.equal(property.x, undefined, "a pin is placed at its coordinate, not by an authored percentage");
}
for (const zone of zones) {
  const point = overview.weather.zoneCentroids[zone];
  assert.ok(point && Number.isFinite(point.lat) && Number.isFinite(point.lon), `zone ${zone} has no forecastable point`);
}

const careRaw = await createCareFixtureAdapter().load("care", context);
const care = normalizeCare(careRaw);
assert.equal(care.kind, "seasonLog");
assert.equal(care.navLabel, "Season log");
assert.equal(care.content.events.length, 5);
assert.equal(care.content.events.filter((event) => !event.sla).length, 1);
assert.equal(care.content.sla.pct, 95);
assert.equal(care.content.docs.length, 3);
const orderIds = new Set(state.orders.map((order) => order.id));
for (const event of care.content.events) {
  assert.ok(!event.orderId || orderIds.has(event.orderId), "season log rows must reference a real tenant order");
}

const copy = currentTheme().copy;
assert.ok(copy.servicesSub && !/ritual/i.test(copy.servicesSub), "snow services copy must not inherit the spa wording");
assert.equal(copy.servicesSteps.length, 3);
assert.equal(copy.payAsYouGo.name, "Pay per storm");
assert.equal(currentFixture().support.intro.startsWith("Reach the Granite Ridge storm desk"), true);

const liveConfig = readPortalConfig(root({ portalVertical: "snow", portalDataMode: "live", portalCase: "granite-ridge-snow" }));
assert.equal(liveConfig.caseId, "", "live mode must not select a fixture case");
const wrongVerticalConfig = readPortalConfig(root({ portalVertical: "beauty", portalDataMode: "fixture", portalCase: "granite-ridge-snow" }));
assert.equal(wrongVerticalConfig.caseId, "", "a snow fixture case must not cross verticals");
const spaCrossConfig = readPortalConfig(root({ portalVertical: "snow", portalDataMode: "fixture", portalCase: "calm-harbor-spa" }));
assert.equal(spaCrossConfig.caseId, "", "a beauty fixture case must not load under snow");

applyPortalConfig(config);

console.log("granite-ridge-fixture-check ok: coherent snow fixture organization across overview, storm home, calendar, season log, service agreements in every stage the Contracts screens reach with Orders, lines and server totals that add up, services, pricing, shop, orders, support, and activity");
