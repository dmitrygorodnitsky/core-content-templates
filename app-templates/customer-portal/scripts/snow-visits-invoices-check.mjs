import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

process.env.TZ = "America/Vancouver";

const dom = createDom();
globalThis.window = globalThis;
globalThis.document = dom.document;
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
globalThis.location = { href: "https://portal.example.test/pages/SNOWLIMITLESS/portal", origin: "https://portal.example.test", pathname: "/pages/SNOWLIMITLESS/portal", search: "", hash: "" };

const portalRoot = path.resolve("app-templates/customer-portal");
const runtimeRoot = pathToFileURL(path.join(portalRoot, "runtime") + "/");
const load = (file) => import(new URL(file, runtimeRoot));
const { readPortalConfig, portalProfiles } = await load("src/config.js");
const { applyPortalConfig, state } = await load("src/state.js");
const { PortalRuntime } = await load("src/portal-runtime.js");
const { createCoreSnowInvoicesAdapter, createCoreSnowVisitsAdapter } = await load("src/adapters/core-snow-adapter.js");
const { normalizeVisits, visitDay, visitWhen, visitWindow } = await load("src/normalizers/visits.js");
const { invoiceStatusLine, normalizeInvoices, openInvoices } = await load("src/normalizers/invoices.js");
const { TopNav } = await load("src/components/shell/TopNav.js");
const { renderRoute } = await load("src/router.js");
const { Overview } = await load("src/routes/OverviewPage.js");
const { PropertyDetail } = await load("src/routes/PropertyDetailPage.js");

const all = (root, selector) => root.querySelectorAll(selector);
const one = (root, selector) => root.querySelector(selector);
const ids = (root, selector) => all(root, selector).map((node) => node.getAttribute("data-id"));
const json = (value, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => structuredClone(value) });

const REF = [{ name: "id" }, { name: "code" }, { name: "nls" }];
const VISIT_BODY = {
  filters: [{ operator: "=", property: "type.code", value: "SNOW_SERVICE_VISIT" }],
  mappings: [
    { name: "id" }, { name: "code" }, { name: "nls" },
    { name: "start" }, { name: "end" }, { name: "attributes" },
    { name: "type", type: "identifier", mappings: REF },
    { name: "states", type: "collection", mappings: REF },
  ],
  offset: 0, pageSize: 50,
  sorting: [{ field: "start", direction: "DESC" }],
};
const INVOICE_BODY = {
  mappings: [
    { name: "id" }, { name: "created" }, { name: "dueDate" }, { name: "notes" },
    { name: "amountDue" }, { name: "totalPaidAmount" }, { name: "attributes" },
    { name: "type", type: "identifier", mappings: REF },
    { name: "states", type: "collection", mappings: REF },
    { name: "order", type: "reference", mappings: [{ name: "id" }, { name: "currency", type: "identifier", mappings: [{ name: "id" }, { name: "code" }] }] },
    { name: "items", type: "collection", mappings: [
      { name: "id" }, { name: "amount" }, { name: "itemCount" }, { name: "notes" },
      { name: "itemPrice", type: "reference", mappings: [{ name: "id" },
        { name: "product", type: "reference", mappings: REF }] },
    ] },
  ],
  offset: 0, pageSize: 50,
  sorting: [{ field: "dueDate", direction: "DESC" }],
};

const ACCOUNT = 732;
const USER = 42;
const PRE = "cde4f537-7ad4-4c85-8f43-d71b84038de1";
const POST = "473582bc-82ac-4613-b005-64b9e38a9c30";
const CREW = "dev-1 test crew: gate code 4417";
const visitType = { id: 2, code: "SNOW_SERVICE_VISIT", nls: { en: { NAME: "Service Visit" } } };
const visit = (id, start, end, stateCode, property, extra = {}) => ({
  id, code: "APPT-DEV1TEST-" + id, nls: { en: { NAME: "dev-1 test visit, property " + property } }, start, end,
  attributes: { 2: Object.assign({ RESOURCE: { value: property } }, extra) }, type: visitType,
  states: [{ id: 100 + id, code: stateCode, nls: { en: { NAME: stateCode } } }],
});
const VISITS_732 = [
  visit(79, 1793430000000, 1793433000000, "SCHEDULED", 983),
  visit(78, 1793169000000, 1793172600000, "IN_PROGRESS", 983),
  visit(77, 1792910700000, 1792913700000, "COMPLETED", 983, {
    COMPLETION_NOTES: { value: "dev-1 test: 8 cm cleared, parkade ramp and loading bay de-iced." },
    CREW_NOTES: { value: CREW },
    PRE_SERVICE_MEDIA: { value: [{ id: PRE, type: "image" }] },
    POST_SERVICE_MEDIA: { value: [{ id: POST, type: "image" }] },
  }),
  visit(76, 1792567800000, 1792570800000, "COMPLETED", 983, { COMPLETION_NOTES: { value: "dev-1 test: lot plowed, rock salt spread." } }),
  visit(75, 1792400000000, 1792403600000, "CANCELED", 983),
  visit(74, 1793500000000, 1793503600000, "DRAFT", 983),
  Object.assign(visit(73, 1793300000000, 1793303600000, "SCHEDULED", 983), { type: { id: 9, code: "OTHER_APPOINTMENT" } }),
];
const line = (id, amount, product) => ({ id, amount, itemCount: 1, notes: "Monthly " + product, itemPrice: { id: id + 100, product: { id: id + 200, code: "CODE_" + id, nls: { en: { NAME: product } } } } });
const invoice = (id, stateCode, dueDate, period, date, amountDue, lines = [line(140, 747.99, "Snow Removal"), line(141, 3469.95, "Rock Salt De-Icing")]) => ({
  id, created: 1793190283996, dueDate, notes: "dev-1 test invoice", amountDue, totalPaidAmount: 0,
  attributes: period ? { 6: { DATE: { value: date }, SERVICE_PERIOD: { value: period }, PAYMENT_NET_TERMS: { value: 15 } } } : {},
  type: { id: 6, code: "FIXED_RATE" }, states: [{ id: 120, code: stateCode, nls: { en: { NAME: stateCode } } }],
  order: { id: 114, currency: { id: 21, code: "CAD" } }, items: lines,
});
const INVOICES_732 = [
  invoice(47, "SENT", [2026, 11, 12], "November 2026", "2026-10-28", 4217.94),
  invoice(46, "PAID", [2026, 10, 16], "October 2026", "2026-10-01", 4217.94),
  invoice(8, "DRAFT", [2026, 9, 25], "", "", 100, [line(9, 100, "Draft line")]),
];
const property = (id, address) => ({
  id, code: "RES-" + id, nls: { en: { NAME: "dev-1 test property " + id } }, type: { id: 154, code: "SNOW_REMOVAL_PROPERTY" },
  states: [{ id: 1, code: "ACTIVE" }], attributes: { 153: { ACCOUNT: { value: ACCOUNT }, ADDRESS: { value: address } } },
});
const ADDRESSES = {
  610: { id: 610, address1: "12 Frost Lane", city: "Surrey", postalCode: "V3W 1J8", state: { id: 2, code: "BC" }, country: { id: "CA" } },
  611: { id: 611, address1: "88 Harbour Road", city: "Richmond", postalCode: "V6X 2A1", state: { id: 2, code: "BC" }, country: { id: "CA" } },
};

const context = { config: { vertical: "snow", origin: "https://portal.example.test", organization: "SNOWLIMITLESS" }, state: { session: { accessToken: "test-token", tokenType: "Bearer", userId: USER }, customerAccount: { id: ACCOUNT } } };

{
  const calls = [];
  const fetch = async (url, options) => { calls.push({ path: new URL(url).pathname, options }); return json({ resultSize: VISITS_732.length, result: VISITS_732 }); };
  const raw = await createCoreSnowVisitsAdapter({ fetch }).load("appointmentsTimeline", context);
  assert.deepEqual(calls.map((call) => call.path), ["/core-svc/api/tagged/appointment/list.json"], "visits come from the tagged appointment list only");
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[0].options.headers.Authorization, "Bearer test-token");
  assert.equal(calls[0].options.headers["X-Organization-Code"], "SNOWLIMITLESS");
  assert.deepEqual(JSON.parse(calls[0].options.body), VISIT_BODY, "the visit request body is the one read on dev-1, and maps no task");
  assert.deepEqual(raw.items.map((row) => row.id), [79, 78, 77, 76, 75, 74], "a row of another appointment type is dropped by the adapter");

  const invoiceCalls = [];
  const invoices = await createCoreSnowInvoicesAdapter({ fetch: async (url, options) => { invoiceCalls.push({ path: new URL(url).pathname, options }); return json({ resultSize: 3, result: INVOICES_732 }); } }).load("invoices", context);
  assert.deepEqual(invoiceCalls.map((call) => call.path), ["/core-bill/api/tagged/invoice/list.json"], "invoices come from the tagged invoice list only");
  assert.deepEqual(JSON.parse(invoiceCalls[0].options.body), INVOICE_BODY, "the invoice request body is the one read on dev-1");
  assert.equal(invoices.items.length, 3);

  for (const [status, code] of [[401, "session-expired"], [403, "customer-forbidden"], [500, "core-request-failed"]]) {
    const failed = [];
    await assert.rejects(createCoreSnowVisitsAdapter({ fetch: async (url) => { failed.push(new URL(url).pathname); return json({}, status); } }).load("appointmentsTimeline", context), { code });
    await assert.rejects(createCoreSnowInvoicesAdapter({ fetch: async (url) => { failed.push(new URL(url).pathname); return json({}, status); } }).load("invoices", context), { code });
    assert.deepEqual(failed, ["/core-svc/api/tagged/appointment/list.json", "/core-bill/api/tagged/invoice/list.json"], "HTTP " + status + " never falls back to an untagged list");
  }
}

{
  assert.equal(new Date(1792567800000).getHours(), 0, "this check runs in a zone where a shifted 07:30 visit would read 00:30");
  const visits = normalizeVisits({ items: VISITS_732 });
  assert.deepEqual(visits.upcoming.map((item) => item.backendId), [78, 79], "upcoming runs soonest first, in progress included");
  assert.deepEqual(visits.past.map((item) => item.backendId), [77, 76], "past runs newest first");
  assert.ok(![...visits.upcoming, ...visits.past].some((item) => item.backendId === 75 || item.backendId === 74 || item.backendId === 73), "canceled, draft and foreign-type visits are hidden");
  const byId = Object.fromEntries([...visits.upcoming, ...visits.past].map((item) => [item.backendId, item]));
  assert.equal(visitWhen(byId[76], "2026-10-28"), "Wed, Oct 21, 7:30 – 8:20 AM", "a wall-clock visit time renders exactly as stored, with no timezone shift");
  assert.equal(visitWhen(byId[78], "2026-10-28"), "Today, 6:30 – 7:30 AM", "today's visit keeps its own date rather than the evening before");
  assert.equal(visitDay(byId[79], "2025-12-30"), "Sat, Oct 31, 2026", "a visit in another year names its year");
  const noon = normalizeVisits({ items: [visit(90, Date.UTC(2026, 10, 3, 11, 30), Date.UTC(2026, 10, 3, 13), "SCHEDULED", 983)] }).upcoming[0];
  assert.equal(visitWindow(noon), "11:30 AM – 1:00 PM");
  assert.deepEqual(byId[77].before, [PRE]);
  assert.deepEqual(byId[77].after, [POST]);
  assert.equal(byId[77].completionNotes, "dev-1 test: 8 cm cleared, parkade ramp and loading bay de-iced.");
  assert.equal(JSON.stringify(visits).includes(CREW), false, "crew notes are internal and never reach the portal model");
  assert.equal(JSON.stringify(visits).includes("dev-1 test visit, property"), false, "the visit's internal name is not shown");

  const invoices = normalizeInvoices({ items: INVOICES_732 });
  assert.deepEqual(invoices.items.map((item) => item.backendId), [47, 46], "a DRAFT invoice is hidden");
  assert.equal(invoiceStatusLine(invoices.items[0]), "Due on Nov 12, 2026");
  assert.equal(invoiceStatusLine(invoices.items[1]), "Paid", "Paid comes from the state even when no payment amount is recorded");
  assert.deepEqual(openInvoices(invoices).map((item) => item.backendId), [47]);
  const overdue = normalizeInvoices({ items: [invoice(60, "OVERDUE", [2026, 9, 1], "September 2026", "2026-09-01", 10), invoice(61, "SENT", [2026, 8, 1], "August 2026", "2026-08-01", 10)] });
  assert.equal(invoiceStatusLine(overdue.items[0]), "Overdue");
  assert.deepEqual(openInvoices(overdue).map((item) => item.backendId), [60, 61], "an overdue invoice leads the open ones");
  assert.deepEqual(invoices.items[0].lines.map((item) => [item.name, item.amount]), [["Snow Removal", "CA$747.99"], ["Rock Salt De-Icing", "CA$3,469.95"]]);
}

function configure(enabled, extra = {}) {
  applyPortalConfig(readPortalConfig({
    dataset: Object.assign({
      portalVertical: "snow", portalProfile: "stormRetail", portalTheme: "snow", portalDataMode: "live", portalAuthMode: "required",
      portalOrganization: "SNOWLIMITLESS", portalAccountTypeCode: "CUSTOMER", portalDefaultRoute: "overview",
      portalNavAppointmentsLabel: "Visits", portalNavInvoicesLabel: "Invoices", portalNavProposalsLabel: "Contracts",
      portalEnabledModules: enabled,
    }, extra),
  }));
  state.config.origin = "https://portal.example.test";
  Object.assign(state.session, { authenticated: true, accessToken: "test-token", tokenType: "Bearer", userId: USER });
  state.customerAccount = { id: ACCOUNT };
  state.account = "ready";
  state.mobileNav = false;
  for (const id of Object.keys(state.moduleData)) delete state.moduleData[id];
  for (const id of Object.keys(state.moduleStatus)) delete state.moduleStatus[id];
}

async function liveLoad(replies, enabled = "overview,properties,appointmentsTimeline,invoices,proposals") {
  configure(enabled);
  const calls = [];
  globalThis.fetch = async (url) => {
    const target = new URL(String(url)).pathname;
    calls.push(target);
    if (target === "/core-rm/api/tagged/resource/list.json") return json({ resultSize: replies.properties.length, result: replies.properties });
    if (target === "/core-acct/api/tagged/account/get.json") return json({ id: ACCOUNT, user: { id: USER }, addresses: Object.values(ADDRESSES).map((address) => ({ address })) });
    if (target === "/core-svc/api/tagged/appointment/list.json") return replies.visits === "fail" ? json({}, 500) : json({ resultSize: replies.visits.length, result: replies.visits });
    if (target === "/core-bill/api/tagged/invoice/list.json") return replies.invoices === "fail" ? json({}, 500) : json({ resultSize: replies.invoices.length, result: replies.invoices });
    throw new Error("unexpected request " + target);
  };
  const runtime = new PortalRuntime({ state });
  const failure = await runtime.loadAllAsync(["overview", "properties", "appointmentsTimeline", "invoices"]).then(() => null, (error) => error);
  await runtime.settled();
  return { calls, failure };
}

const navLabels = () => all(one(TopNav(false), ".nav-links"), ".nav-link").map((node) => node.textContent);
const page = (route, params = {}) => { Object.assign(state, params); state.route = route; return renderRoute(); };

{
  const { failure, calls } = await liveLoad({ properties: [property(983, 610)], visits: VISITS_732, invoices: INVOICES_732 });
  assert.equal(failure, null);
  assert.ok(calls.includes("/core-svc/api/tagged/appointment/list.json") && calls.includes("/core-bill/api/tagged/invoice/list.json"));
  assert.deepEqual(navLabels(), ["Home", "Visits", "Invoices", "Contracts"], "the snow nav reads Home, Visits, Invoices, Contracts");

  const home = Overview();
  const next = one(home, "[data-module=\"next-visit\"]");
  assert.ok(next, "the home shows the next visit");
  assert.deepEqual(ids(next, "[data-module=\"visit-row\"]"), ["visit-core-78"], "the next visit is the one in progress before the scheduled one");
  assert.match(next.textContent, /6:30 – 7:30 AM/);
  assert.match(next.textContent, /In progress/);
  assert.doesNotMatch(next.textContent, /Frost Lane/, "a customer with one property is not told its address");
  const due = one(home, "[data-module=\"invoice-due\"]");
  assert.ok(due, "the home shows the invoice due");
  assert.deepEqual(ids(due, "[data-module=\"invoice-row\"]"), ["invoice-core-47"], "only the unpaid invoice is due");
  assert.match(due.textContent, /November 2026/);
  assert.match(due.textContent, /CA\$4,217\.94/);
  assert.match(due.textContent, /Due on Nov 12, 2026/);

  const visits = page("appointments");
  assert.equal(visits.getAttribute("data-route"), "appointments");
  assert.equal(one(visits, ".page-header__title").textContent, "Visits");
  assert.deepEqual(ids(one(visits, "[data-module=\"visits-upcoming\"]"), "[data-module=\"visit-row\"]"), ["visit-core-78", "visit-core-79"]);
  assert.deepEqual(ids(one(visits, "[data-module=\"visits-past\"]"), "[data-module=\"visit-row\"]"), ["visit-core-77", "visit-core-76"]);
  const visit76 = all(visits, "[data-module=\"visit-row\"]").find((row) => row.getAttribute("data-id") === "visit-core-76");
  assert.match(visit76.textContent, /^Wed, Oct 21, 7:30 – 8:20 AMCompleted›$/, "a row shows date, window and status, and no address for a single property");
  assert.doesNotMatch(visits.textContent, /Frost Lane|Canceled|CANCELED|Draft/);

  const detail = page("visit.detail", { visitId: "visit-core-77" });
  assert.equal(one(detail, ".prop-head__title").textContent, "Sun, Oct 25");
  assert.equal(one(detail, "[data-module=\"visit-when\"]").textContent, "6:45 – 7:35 AM");
  assert.equal(one(detail, ".record-notes").textContent, "dev-1 test: 8 cm cleared, parkade ramp and loading bay de-iced.");
  assert.deepEqual(all(detail, "img").map((img) => img.getAttribute("src")), ["/core/image/" + PRE + "/get", "/core/image/" + POST + "/get"], "before and after photos come from the unauthenticated image route");
  assert.deepEqual(all(detail, ".record-photos__label").map((node) => node.textContent), ["Before", "After"]);
  assert.equal(detail.textContent.includes(CREW), false, "crew notes are not shown");
  const bare = page("visit.detail", { visitId: "visit-core-79" });
  assert.equal(all(bare, "[data-module=\"visit-notes\"]").length + all(bare, "[data-module=\"visit-photos\"]").length, 0, "a visit without notes or photos shows neither section");

  const invoices = page("invoices");
  assert.deepEqual(ids(invoices, "[data-module=\"invoice-row\"]"), ["invoice-core-47", "invoice-core-46"], "the DRAFT invoice is not listed");
  assert.deepEqual(all(invoices, "[data-module=\"invoice-row\"]").map((row) => row.textContent), ["November 2026CA$4,217.94Due on Nov 12, 2026›", "October 2026CA$4,217.94Paid›"]);
  assert.doesNotMatch(invoices.textContent, /CA\$100\.00|Draft line/);

  const bill = page("invoice.detail", { invoiceId: "invoice-core-47" });
  assert.equal(one(bill, ".prop-head__title").textContent, "November 2026");
  assert.deepEqual(all(bill, "[data-module=\"invoice-line\"]").map((row) => row.textContent), ["Snow RemovalCA$747.99", "Rock Salt De-IcingCA$3,469.95"]);
  assert.equal(one(bill, "[data-module=\"invoice-total\"]").textContent, "TotalCA$4,217.94");
  assert.deepEqual(all(bill, ".prop-fact").map((row) => row.textContent), ["Due dateNov 12, 2026", "Payment termsNet 15", "Invoice dateOct 28, 2026"]);
  assert.equal(page("invoice.detail", { invoiceId: "invoice-core-8" }).getAttribute("data-state"), "not-found", "a DRAFT invoice cannot be opened by its address either");

  state.propertyId = "prop-core-983";
  const detailPage = PropertyDetail();
  const section = one(detailPage, "[data-module=\"property-live-visits\"]");
  assert.ok(section, "the property page lists its visits");
  assert.deepEqual(ids(section, "[data-module=\"visit-row\"]"), ["visit-core-78", "visit-core-77"], "the next upcoming and the last completed visit");
  assert.deepEqual(all(section, ".record-row__eyebrow").map((node) => node.textContent), ["Next visit", "Last visit"]);
  assert.equal(one(section, "[data-visual-id=\"property-all-visits\"]").getAttribute("data-id"), "appointments");
}

{
  const visits = [
    visit(81, 1793604600000, 1793608800000, "SCHEDULED", 1033),
    visit(79, 1793430000000, 1793433000000, "SCHEDULED", 983),
    visit(80, 1792828800000, 1792833300000, "COMPLETED", 1033),
  ];
  await liveLoad({ properties: [property(983, 610), property(1033, 611)], visits, invoices: [] });
  const list = page("appointments");
  const rows = Object.fromEntries(all(list, "[data-module=\"visit-row\"]").map((row) => [row.getAttribute("data-id"), row.textContent]));
  assert.match(rows["visit-core-79"], /12 Frost Lane, Surrey, BC V3W 1J8, Canada/, "with two properties each visit names its address");
  assert.match(rows["visit-core-81"], /88 Harbour Road/);
  for (const text of Object.values(rows)) assert.equal(text.split("Frost Lane").length + text.split("Harbour Road").length, 3, "the address appears once per row");
  assert.match(one(Overview(), "[data-module=\"next-visit\"]").textContent, /12 Frost Lane/, "the home names the property of the next visit when there are several");
  state.propertyId = "prop-core-1033";
  const section = one(PropertyDetail(), "[data-module=\"property-live-visits\"]");
  assert.deepEqual(ids(section, "[data-module=\"visit-row\"]"), ["visit-core-81", "visit-core-80"], "a property lists only its own visits");
  assert.doesNotMatch(section.textContent, /Harbour Road/, "the property page does not repeat its own address on each visit");
  assert.deepEqual(navLabels(), ["Home", "Visits", "Contracts"], "with no invoices the Invoices item is hidden");
}

{
  await liveLoad({ properties: [property(983, 610)], visits: [visit(75, 1792400000000, 1792403600000, "CANCELED", 983)], invoices: [invoice(8, "DRAFT", [2026, 9, 25], "", "", 100)] });
  assert.deepEqual(navLabels(), ["Home", "Contracts"], "lists with nothing to show hide their nav items");
  const home = Overview();
  assert.equal(all(home, "[data-module=\"next-visit\"]").length + all(home, "[data-module=\"invoice-due\"]").length, 0, "no home card without a visit or an invoice due");
  assert.deepEqual(one(home, ".ov-grid").children.map((card) => card.getAttribute("data-module")), ["active-contracts"], "the home grid keeps only the cards that have something to show");
  assert.doesNotMatch(home.textContent, /No visits|No invoices|not available/i);
  state.propertyId = "prop-core-983";
  assert.equal(all(PropertyDetail(), "[data-module=\"property-live-visits\"]").length, 0, "a property with no visits has no Visits section");

  await liveLoad({ properties: [property(983, 610)], visits: [VISITS_732[2]], invoices: [INVOICES_732[1]] });
  const paidOnly = Overview();
  assert.equal(all(paidOnly, "[data-module=\"invoice-due\"]").length, 0, "a paid invoice is not due");
  assert.equal(all(paidOnly, "[data-module=\"next-visit\"]").length, 0, "a completed visit is not next");
  assert.deepEqual(navLabels(), ["Home", "Visits", "Invoices", "Contracts"]);

  const { failure } = await liveLoad({ properties: [property(983, 610)], visits: "fail", invoices: "fail" });
  assert.equal(failure, null, "a failed visit or invoice read does not fail the portal");
  assert.equal(state.moduleData.properties.state, "ready");
  assert.deepEqual(navLabels(), ["Home", "Visits", "Invoices", "Contracts"], "a failed read keeps its nav item so the page can say what went wrong");
  assert.match(page("appointments").textContent, /Couldn’t load your visits/);
  assert.equal(all(Overview(), "[data-module=\"next-visit\"]").length, 0);

  configure("overview,properties,appointmentsTimeline,invoices");
  assert.deepEqual(navLabels(), ["Home"], "nothing is offered while the lists are still loading");
}

{
  applyPortalConfig(readPortalConfig({ dataset: { portalVertical: "snow", portalProfile: "stormRetail", portalTheme: "snow", portalDataMode: "fixture", portalAuthMode: "fixture", portalCase: "granite-ridge-snow", portalNavAppointmentsLabel: "Appointments" } }));
  const runtime = new PortalRuntime({ state });
  runtime.loadAll();
  assert.ok(navLabels().includes("Appointments"), "fixture mode keeps its appointments timeline");
  assert.equal(navLabels().includes("Invoices"), false, "fixture mode has no invoice list, so no Invoices item");
  const timeline = page("appointments");
  assert.ok(one(timeline, "[data-module=\"appointments-table\"]"), "fixture mode still renders the demonstration timeline");
}

{
  const source = JSON.parse(await fs.readFile(path.join(portalRoot, "cms/granite-ridge-snow.customer-portal-staging.json"), "utf8"));
  for (const id of ["appointmentsTimeline", "invoices"]) assert.ok(source.runtime.enabledModules.includes(id), id + " is enabled in the Snow staging package");
  assert.equal(source.shell.navigation.appointments, "Visits");
  assert.equal(source.shell.navigation.invoices, "Invoices");
  assert.equal(source.account.serviceApiBase, "/core-svc");
  const order = portalProfiles.stormRetail.nav.map((item) => item.key).filter((key) => ["overview", "appointments", "invoices", "proposals.list"].includes(key));
  assert.deepEqual(order, ["overview", "appointments", "invoices", "proposals.list"]);
}

console.log("snow visits and invoices check ok: tagged visit and invoice reads with the dev-1 bodies, wall-clock visit times, DRAFT invoices and canceled visits hidden, single-property address omission, home next-visit and invoice-due cards, property visits, and empty lists hidden from the nav and the screens");

function createDom() {
  class Text {
    constructor(value) { this.textContent = String(value); this.parentNode = null; this.listeners = {}; }
  }

  class Element {
    constructor(tag) {
      this.tagName = String(tag).toUpperCase();
      this.attributes = new Map();
      this.childNodes = [];
      this.parentNode = null;
      this.listeners = {};
      this.style = {};
      this.offsetWidth = 0;
      this.offsetHeight = 0;
      this.classList = { add: () => {}, remove: () => {}, contains: () => false };
    }
    get className() { return this.getAttribute("class") || ""; }
    set className(value) { this.setAttribute("class", value); }
    get children() { return this.childNodes.filter((node) => node instanceof Element); }
    get textContent() { return this.childNodes.map((node) => node.textContent).join(""); }
    set textContent(value) { this.replaceChildren(new Text(value)); }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
    hasAttribute(name) { return this.attributes.has(name); }
    removeAttribute(name) { this.attributes.delete(name); }
    appendChild(child) {
      if (child.parentNode) child.parentNode.removeChild(child);
      child.parentNode = this;
      this.childNodes.push(child);
      return child;
    }
    removeChild(child) {
      this.childNodes = this.childNodes.filter((node) => node !== child);
      child.parentNode = null;
      return child;
    }
    remove() { if (this.parentNode) this.parentNode.removeChild(this); }
    replaceChildren(...nodes) {
      this.childNodes.forEach((node) => { node.parentNode = null; });
      this.childNodes = [];
      nodes.forEach((node) => this.appendChild(node));
    }
    addEventListener(type, listener) { (this.listeners[type] = this.listeners[type] || []).push(listener); }
    contains(node) {
      for (let current = node; current; current = current.parentNode) if (current === this) return true;
      return false;
    }
    closest(selector) {
      for (let current = this; current instanceof Element; current = current.parentNode) if (matches(current, selector)) return current;
      return null;
    }
    querySelectorAll(selector) {
      const found = [];
      const walk = (node) => node.children.forEach((child) => { if (matches(child, selector)) found.push(child); walk(child); });
      walk(this);
      return found;
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    focus() {}
    scrollIntoView() {}
  }

  function matches(node, selector) {
    const parts = selector.match(/^[a-zA-Z0-9-]+|\.[\w-]+|\[[^\]]+\]/g) || [];
    return parts.every((part) => {
      if (part[0] === ".") return node.className.split(/\s+/).includes(part.slice(1));
      if (part[0] === "[") {
        const attribute = /^\[([\w-]+)(?:="([^"]*)")?\]$/.exec(part);
        return attribute[2] === undefined ? node.hasAttribute(attribute[1]) : node.getAttribute(attribute[1]) === attribute[2];
      }
      return node.tagName === part.toUpperCase();
    });
  }

  const documentNode = new Element("#document");
  documentNode.head = new Element("head");
  documentNode.createElement = (tag) => new Element(tag);
  documentNode.createElementNS = (_, tag) => new Element(tag);
  documentNode.createTextNode = (value) => new Text(value);
  return { document: documentNode };
}
