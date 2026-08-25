import assert from "node:assert/strict";

globalThis.window = globalThis;

const runtimeRoot = new URL("../runtime/", import.meta.url);
const { graniteRidgeSnowFixture } = await import(new URL("data/cases/granite-ridge-snow.js", runtimeRoot));
const { portalProfiles, readPortalConfig } = await import(new URL("src/config.js", runtimeRoot));
const { fixtureAdapter } = await import(new URL("src/adapters/fixture-adapter.js", runtimeRoot));
const { createCareFixtureAdapter } = await import(new URL("src/adapters/care-fixture-adapter.js", runtimeRoot));
const { normalizeCare } = await import(new URL("src/normalizers/care.js", runtimeRoot));
const {
  applyPortalConfig,
  computeSite,
  currentFixture,
  currentProposal,
  currentStormCalendar,
  currentTheme,
  proposalPlanName,
  proposalSites,
  proposalStatusMeta,
  state,
} = await import(new URL("src/state.js", runtimeRoot));
const { clampFrameIndex, invoiceBuckets, money, propertyStatus, propertyWeather, serviceDayCount } = await import(new URL("src/normalizers/overview.js", runtimeRoot));

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
assert.equal(profileDefinition.nav.length, portalProfiles.stormOps.nav.length, "nav must not grow past the accepted stormOps item count");
assert.ok(profileDefinition.modules.includes("pricing") && profileDefinition.modules.includes("products"));
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

assert.equal(proposals.proposal.id, "GR-2049");
assert.equal(currentProposal().mapLabel, "portfolio map · Lakewood · Golden · Arvada · Littleton");
assert.equal(proposalSites().length, 4);
assert.deepEqual(proposalSites().map((site) => site.status), ["approved", "revision", "declined", "unseen"]);
assert.equal(proposalStatusMeta().approved.badge, "status-badge--ok");
assert.equal(proposalPlanName("898"), "Seasonal Unlimited");
assert.equal(proposals.statusMeta, graniteRidgeSnowFixture.proposals.statusMeta);

const foothill = computeSite(proposalSites()[0]);
assert.equal(foothill.rows.length, 5);
assert.deepEqual(foothill.rows.map((row) => row.name), graniteRidgeSnowFixture.theme.prop.surfaces);
assert.equal(foothill.total, 5460);
assert.ok(foothill.monthly > 0 && foothill.seasonLock > 0);

const overview = fixtureAdapter.load("overview", context).overview;
assert.ok(overview, "the snow tenant must carry overview data");
assert.equal(overview.properties.length, 24, "the map is only worth designing at portfolio density");
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
const serviceDays = overview.weather.timeline.map((item) => serviceDayCount(overview.properties, item));
assert.deepEqual(plainValue(serviceDays), [1, 5, 2, 2, 0, 0, 1], "the timeline must mark the days a visit actually happens");
assert.ok(serviceDays.some((count) => count === 0), "a day without service must stay unmarked");
for (const property of overview.properties) {
  if (!property.appointment) continue;
  assert.ok(
    overview.weather.timeline.some((item) => item.date === property.appointment.date),
    `${property.name} is booked for ${property.appointment.date}, which no timeline day names`,
  );
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

console.log("granite-ridge-fixture-check ok: coherent snow fixture organization across overview, storm home, calendar, season log, contracts, services, pricing, shop, orders, support, and activity");
