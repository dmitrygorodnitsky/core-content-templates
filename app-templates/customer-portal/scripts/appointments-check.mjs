import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import path from "node:path";

const runtimeRoot = pathToFileURL(path.resolve("app-templates/customer-portal/runtime") + "/");
const { appointmentRows, clockMinutes, filterRows, minutesOf, resourceNames, sortRows, stateMeta } =
  await import(new URL("src/normalizers/appointments.js", runtimeRoot));
const { portalProfiles, readPortalConfig, routeRegistry } = await import(new URL("src/config.js", runtimeRoot));
const { graniteRidgeSnowFixture } = await import(new URL("data/cases/granite-ridge-snow.js", runtimeRoot));

const overview = graniteRidgeSnowFixture.overview;
const timeline = overview.weather.timeline;
const rows = appointmentRows(overview.properties, timeline);

assert.equal(rows.length, 14, "every booked property becomes exactly one row");
for (const row of rows) {
  assert.ok(row.resource, `${row.name} has no resource, and the table sorts by it`);
  assert.ok(row.address, `${row.name} has no address`);
  assert.ok(row.est, `${row.name} has no estimated window`);
  assert.ok(row.day, `${row.name} resolves to no day, so the date filter could never reach it`);
  assert.notEqual(stateMeta(row.state).label, row.state, `state ${row.state} renders as its raw code`);
}

assert.deepEqual(
  resourceNames(rows),
  ["Kyle B.", "Marcus H.", "Priya N.", "Team 4 · Plow"],
  "the resource list is de-duplicated and alphabetical",
);

const completed = rows.filter((row) => row.state === "COMPLETED");
assert.ok(completed.length >= 2, "the actual-time column needs finished visits to show anything");
for (const row of completed) assert.ok(row.actual, `${row.name} is complete but carries no actual time`);
for (const row of rows.filter((r) => r.state === "SCHEDULED")) {
  assert.equal(row.actual, "", "a scheduled visit has not happened yet, so it has no actual time");
}
const running = rows.find((row) => row.state === "IN_PROGRESS");
assert.ok(running, "an in-progress visit is what makes the two time columns differ");
assert.match(running.actual, /–\s*…$/, "a visit that started but has not finished shows an open-ended actual window");

const asc = sortRows(rows, "asc");
const desc = sortRows(rows, "desc");
assert.equal(asc[0].resource, "Kyle B.");
assert.equal(desc[0].resource, "Team 4 · Plow");
assert.deepEqual(
  asc.map((row) => row.resource),
  desc.map((row) => row.resource).slice().reverse().sort((a, b) => a.localeCompare(b)),
  "both directions carry the same rows",
);
const kyle = asc.filter((row) => row.resource === "Kyle B.");
assert.deepEqual(
  kyle.map((row) => row.dayIndex),
  kyle.map((row) => row.dayIndex).slice().sort((a, b) => a - b),
  "within one resource the rows stay in chronological order whichever way the name sorts",
);
assert.notEqual(sortRows(rows, "asc"), rows, "sorting must not mutate the caller's array");

assert.equal(filterRows(rows, null).length, rows.length, "no date filter shows the whole week");
assert.equal(filterRows(rows, "").length, rows.length);
assert.equal(filterRows(rows, undefined).length, rows.length);
assert.equal(filterRows(rows, 0).length, 4, "today carries four visits");
assert.equal(filterRows(rows, 1).length, 5);
assert.equal(filterRows(rows, 4).length, 0, "a quiet day filters down to nothing rather than falling back to all");

assert.equal(clockMinutes("12:00 AM"), 0, "midnight is zero, not noon");
assert.equal(clockMinutes("12:30 PM"), 750);
assert.equal(clockMinutes("5:40 AM"), 340);
assert.equal(clockMinutes("nonsense"), Number.MAX_SAFE_INTEGER);
assert.equal(minutesOf(null), Number.MAX_SAFE_INTEGER, "a missing window sorts last instead of first");

const storm = portalProfiles.stormRetail;
const navKeys = storm.nav.map((item) => item.key);
assert.ok(navKeys.includes("appointments"), "the timeline needs a way in");
assert.ok(!navKeys.includes("products"), "Shop is retired; every service is ordered through the quote form");
assert.ok(!navKeys.includes("services"), "Services is retired for the same reason");
assert.ok(!storm.modules.includes("products") && !storm.modules.includes("checkout"),
  "leaving checkout enabled without Shop would render an add-to-cart flow with nothing to add");
assert.ok(!storm.modules.includes("services"));
assert.equal(storm.showCart, false, "no Shop means no cart to open");
assert.equal(storm.primary.action, "service.requestForm");
assert.equal(routeRegistry.appointments.module, "appointmentsTimeline",
  "the spa already owns the module id 'appointments'");

const contracts = new Set(overview.contracts.map((contract) => contract.number));
for (const property of overview.properties) {
  assert.ok(property.contract, `${property.name} belongs to no contract, so its property page has nothing to link to`);
  assert.ok(contracts.has(property.contract), `${property.name} points at contract ${property.contract}, which does not exist`);
}
const quoteSiteIds = new Set(graniteRidgeSnowFixture.proposals.sites.map((site) => site.id));
for (const property of overview.properties.filter((item) => item.quoteSiteId)) {
  assert.ok(quoteSiteIds.has(property.quoteSiteId), `${property.name} points at quote site ${property.quoteSiteId}, which does not exist`);
}
assert.equal(
  overview.properties.filter((item) => item.quoteSiteId).length,
  quoteSiteIds.size,
  "every quoted site must be reachable from exactly one property page",
);

assert.equal(routeRegistry["property.detail"].module, "properties");
assert.equal(routeRegistry["visit.detail"].module, "appointmentsTimeline");
assert.equal(routeRegistry["visit.detail"].path, "/visits/:id",
  "the spa already answers /appointments/:id, so the storm visit takes its own path");
assert.notEqual(routeRegistry["visit.detail"].path, routeRegistry["appointment.detail"].path);
assert.ok(storm.modules.includes("properties"), "a property link that lands on the default route is worse than no link");

for (const row of rows) {
  const property = overview.properties.find((item) => item.id === row.id);
  assert.ok(property, `row ${row.id} does not resolve back to a property, so both its links would dead-end`);
}

const formUrl = (value) => readPortalConfig({ dataset: { portalVertical: "snow", portalRequestFormUrl: value } }).requestFormUrl;
assert.equal(formUrl("https://dev-1.servicewand.com/form"), "https://dev-1.servicewand.com/form");
assert.equal(formUrl("http://dev-1.servicewand.com/form"), "", "plain http is discarded rather than opened");
assert.equal(formUrl("javascript:alert(1)"), "", "a script scheme must never reach location.assign");
assert.equal(formUrl("${PORTAL_REQUEST_FORM_URL@STRING}"), "", "an unset CMS parameter renders as its own marker, which is not a URL");
assert.equal(formUrl(""), "");
assert.equal(formUrl(undefined), "");

console.log("appointments-check ok: " + rows.length + " rows across " + resourceNames(rows).length
  + " resources, resource sort stable by time, date filter clears to the whole week, Shop, Services, checkout and the cart gone from stormRetail, a form address that only opens over https, and every row linking to a property and a visit that exist");
