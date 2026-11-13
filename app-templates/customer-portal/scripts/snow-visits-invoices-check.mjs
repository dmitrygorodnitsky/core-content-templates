import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

process.env.TZ ??= "America/Vancouver";

const dom = createDom();
globalThis.window = globalThis;
globalThis.document = dom.document;
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
globalThis.location = { href: "https://portal.example.test/pages/SNOWLIMITLESS/portal", origin: "https://portal.example.test", pathname: "/pages/SNOWLIMITLESS/portal", search: "", hash: "" };

const portalRoot = path.resolve("app-templates/customer-portal");
const runtimeRoot = pathToFileURL(path.join(portalRoot, "runtime") + "/");
const load = (file) => import(new URL(file, runtimeRoot));
const { matchRoutePath, readPortalConfig, readTimeZone, portalProfiles } = await load("src/config.js");
const { applyPortalConfig, state } = await load("src/state.js");
const { PortalRuntime } = await load("src/portal-runtime.js");
const { coreSnowContract, createCoreSnowInvoicesAdapter, createCoreSnowVisitsAdapter, readVisitTransitions } = await load("src/adapters/core-snow-adapter.js");
const { crewLine, titleCaseName, visitCrew } = await load("src/normalizers/visits.js");
const { localDateKey, normalizeVisitProgress, onSiteDuration, normalizeVisits, progressWhen, visitDay, visitWhen, visitWindow } = await load("src/normalizers/visits.js");
const { normalizeProposals } = await load("src/normalizers/index.js");
const { visitProgress } = await load("src/visit-progress.js");
const { propertyPlan } = await load("src/property-plan.js");
const { invoiceStatusLine, normalizeInvoices, openInvoices } = await load("src/normalizers/invoices.js");
const { TopNav } = await load("src/components/shell/TopNav.js");
const { renderRoute } = await load("src/router.js");
const { Overview } = await load("src/routes/OverviewPage.js");
const { ACTIONS } = await load("src/actions.js");
const { invoiceParties } = await load("src/components/storm/InvoiceSheet.js");
const { liveInvoices } = await load("src/state.js");
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
    { name: "start" }, { name: "end" }, { name: "attributes" }, { name: "metadata" },
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
    { name: "order", type: "reference", mappings: [{ name: "id" }, { name: "currency", type: "identifier", mappings: [{ name: "id" }, { name: "code" }] }, { name: "states", type: "collection", mappings: REF }] },
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
const PRE_78 = "5b0c7a1e-2f4d-4e8a-9c61-0d3f2a7b9e14";
const PLAN = "c08d28dc-0f70-4fb9-9d6e-1b881975d923";
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
  visit(78, 1793169000000, 1793172600000, "IN_PROGRESS", 983, { PRE_SERVICE_MEDIA: { value: [{ id: PRE_78, type: "image" }] } }),
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
const property = (id, address, extra = {}) => ({
  id, code: "RES-" + id, nls: { en: { NAME: "dev-1 test property " + id } }, type: { id: 154, code: "SNOW_REMOVAL_PROPERTY" },
  states: [{ id: 1, code: "ACTIVE" }], attributes: { 153: Object.assign({ ACCOUNT: { value: ACCOUNT }, ADDRESS: { value: address } }, extra) },
});
const transition = (id, code, observed) => ({ metadata: {}, id, state: { id: 100 + id, code, nls: { en: { NAME: code } } }, user: { optimistic: 591, id: 1 }, observed });
const TRANSITIONS = {
  76: [transition(209, "IN_PROGRESS", 1793190046589), transition(210, "COMPLETED", 1793190058938)],
  77: [transition(300, "DRAFT", Date.UTC(2026, 9, 21, 16, 0)), transition(301, "SCHEDULED", Date.UTC(2026, 9, 22, 17, 5)), transition(303, "COMPLETED", Date.UTC(2026, 9, 25, 14, 33)), transition(302, "IN_PROGRESS", Date.UTC(2026, 9, 25, 13, 47))],
  78: [transition(213, "IN_PROGRESS", 1793190076446)],
  79: [],
  80: [], 81: [],
};
const transitionsFetch = async (url) => {
  const id = Number(/\/appointment\/(\d+)\/list-transitions\.json$/.exec(new URL(url).pathname)[1]);
  return TRANSITIONS[id] === "forbidden" ? json({ message: "Entity is not accessible", status: 403 }, 403) : json({ resultSize: TRANSITIONS[id].length, result: TRANSITIONS[id], sequence: 519 });
};
const settle = () => new Promise((resolve) => setImmediate(resolve));
async function preloadProgress() {
  const envelope = state.moduleData.appointmentsTimeline;
  for (const item of [...envelope.upcoming, ...envelope.past, ...envelope.cancelled]) visitProgress(item, () => {}, transitionsFetch);
  await settle();
}
const SENT = ["DRAFT", "QUOTE_PREPARED", "QUOTE_APPROVED", "QUOTE_SENT"];
const ready = { state: "ready", scopeMode: "server-scoped", truncated: false };
const quoteOrder = (id, final, items) => ({ id, type: { id: 5, code: "FIELD_SERVICE_ORDER" }, states: SENT.concat(final).map((code, index) => ({ id: index + 1, code })), attributes: { 5: { SERVICE_PROPERTY: { value: 983 } } }, grandTotal: 4217.94, totalCharges: 4217.94, totalTaxes: 0, currency: { id: 2, code: "CAD" }, items: items.map((item) => ({ id: item })) });
const orderItem = (id, order, price, total) => ({ id, order: { id: order }, itemPrice: { id: price }, grandTotal: total, sortOrder: id, metadata: { INTERVAL_UNIT: "MONTH", INTERVAL_COUNT: 1 } });
const agreement169 = (codes, accepted = ["ACCEPTED"]) => normalizeProposals({
  accountId: ACCOUNT, scopeMode: "server-scoped",
  reads: { agreements: ready, orders: ready, orderItems: ready, productPrices: ready, products: ready },
  client: { displayName: "Bilbo Baggins" },
  agreements: [{ id: 169, type: { id: 17, code: "SERVICE_AGREEMENT" }, states: codes.map((code, index) => ({ id: index + 1, code })), attributes: { 17: { CLIENT: { value: ACCOUNT }, ORDERS: { value: [113, 114] } } } }],
  quoteOrders: [quoteOrder(113, "DECLINED", [142]), quoteOrder(114, accepted, [140, 141])],
  orderItems: [orderItem(140, 114, 52, 747.99), orderItem(141, 114, 58, 3469.95), orderItem(142, 113, 27, 934.99)],
  productPrices: [{ id: 52, product: { id: 25 }, type: { id: 2, code: "TIERED_RECURRENT" } }, { id: 58, product: { id: 28 }, type: { id: 2, code: "TIERED_RECURRENT" } }, { id: 27, product: { id: 30 }, type: { id: 1, code: "TIERED" } }],
  products: [{ id: 25, nls: { en: { NAME: "Snow Removal" } } }, { id: 28, nls: { en: { NAME: "Rock Salt De-Icing" } } }, { id: 30, nls: { en: { NAME: "Sidewalk Sanding" } } }],
});
const SIGNED_169 = ["QUOTATION", "QUOTATION_SENT", "AWAITING_CLIENT_DETAILS", "DRAFT", "SENT_TO_CLIENT", "CLIENT_APPROVED"];
const ACTIVE_ORDER = ["ACCEPTED", "ACTIVE"];
const PLAN_JSON = {
  type: "PropertyPlan", schemaVersion: 1,
  elements: [{ label: "Parkade ramp", elementTypeDictionaryId: 1, overlays: [{ map: "GOOGLE_MAPS", geometry: { type: "Polygon", coordinates: [[[-123.1141, 49.2608], [-123.1139, 49.2608], [-123.1139, 49.2609], [-123.1141, 49.2609], [-123.1141, 49.2608]]] } }] }],
};
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
  assert.notEqual(new Date(1792567800000).getHours(), 7, "this check runs in a zone where a shifted 07:30 visit would not read 07:30");
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

  const SNAPSHOT = { version: 1, visitState: "COMPLETED", capturedAt: "2026-11-12T20:45:14Z", crew: [{ name: "Jordan W.", role: "Driver" }], vehicle: { name: "FORD F-350", type: "Pickup Truck" }, equipment: [{ name: "WESTERN 8.5 MVP PLUS SNOWPLOW", type: "Plow" }, { name: "Tailgate salter", type: "Salt Spreader (Salter)" }] };
  const withCrew = (snapshot) => normalizeVisits({ items: [Object.assign(visit(91, Date.UTC(2026, 10, 3, 7), Date.UTC(2026, 10, 3, 8), "COMPLETED", 983), { metadata: { DEV1_TEST_DATA: "x", CLIENT_VISIT_CREW: snapshot } })] }).past[0].crew;
  assert.deepEqual(withCrew(SNAPSHOT), {
    people: [{ name: "Jordan W.", kind: "Driver" }],
    vehicle: { name: "Ford F-350", kind: "Pickup Truck" },
    equipment: [{ name: "Western 8.5 MVP Plus Snowplow", kind: "Plow" }, { name: "Tailgate Salter", kind: "Salt Spreader (Salter)" }],
  }, "the crew snapshot reads in title case, with each one's role or type");
  assert.deepEqual(withCrew(JSON.stringify(SNAPSHOT)), withCrew(SNAPSHOT), "a snapshot stored as text reads the same");
  assert.deepEqual(withCrew({ version: 1, visitState: "COMPLETED", crew: [], vehicle: { name: "Chevrolet Silverado", type: "Pickup Truck" }, equipment: [] }), { people: [], vehicle: { name: "Chevrolet Silverado", kind: "Pickup Truck" }, equipment: [] }, "a route that names only a vehicle");
  assert.equal(withCrew({ version: 1, crew: [], equipment: [] }), null, "an empty snapshot shows nothing");
  assert.equal(withCrew(undefined), null, "a visit that has not started has none");
  assert.equal(withCrew("not json"), null);
  assert.equal(byId[77].crew, null);
  assert.deepEqual(["FORD F-350", "BOBCAT S185", "WESTERN 7'6\" ENFORCER V-PLOW", "GMC SIERRA", "jordan w.", "Ford F350", ""].map(titleCaseName), ["Ford F-350", "Bobcat S185", "Western 7'6\" Enforcer V-Plow", "GMC Sierra", "Jordan W.", "Ford F350", ""], "shouted words are lowered, model numbers and short acronyms kept");
  assert.equal(crewLine(visitCrew(SNAPSHOT)), "Jordan W. · Ford F-350 · Western 8.5 MVP Plus Snowplow, Tailgate Salter");
  assert.equal(crewLine(null), "");
  assert.equal(JSON.stringify(visits).includes("dev-1 test visit, property"), false, "the visit's internal name is not shown");

  const invoices = normalizeInvoices({ items: INVOICES_732 });
  assert.deepEqual(invoices.items.map((item) => item.backendId), [47, 46], "a DRAFT invoice is hidden");
  assert.equal(invoiceStatusLine(invoices.items[0]), "Due on Nov 12, 2026");
  assert.equal(invoiceStatusLine(invoices.items[1]), "Paid", "Paid comes from the state even when no payment amount is recorded");
  assert.deepEqual(openInvoices(invoices).map((item) => item.backendId), [47]);
  const overdue = normalizeInvoices({ items: [invoice(60, "OVERDUE", [2026, 9, 1], "September 2026", "2026-09-01", 10), invoice(61, "SENT", [2026, 8, 1], "August 2026", "2026-08-01", 10)] });
  assert.equal(invoiceStatusLine(overdue.items[0]), "Overdue");
  assert.deepEqual(openInvoices(overdue).map((item) => item.backendId), [60, 61], "an overdue invoice leads the open ones");
  const orphaned = invoice(62, "SENT", [2026, 11, 12], "November 2026", "2026-10-28", 15);
  orphaned.order = { ...orphaned.order, states: [{ id: 460, code: "CANCELED" }] };
  const running = invoice(63, "SENT", [2026, 11, 12], "November 2026", "2026-10-28", 15);
  running.order = { ...running.order, states: [{ id: 457, code: "ACTIVE" }] };
  const canceled = normalizeInvoices({ items: [orphaned, running] });
  assert.deepEqual(canceled.items.map((item) => item.orderCanceled), [true, false], "an invoice knows whether its order was cancelled");
  assert.equal(invoiceStatusLine(canceled.items[0]), "Order cancelled · contact us about this invoice", "an open invoice of a cancelled order says so instead of asking for payment");
  assert.equal(invoiceStatusLine(canceled.items[1]), "Due on Nov 12, 2026");
  assert.deepEqual(openInvoices(canceled).map((item) => item.backendId), [62, 63], "it stays among the open invoices: voiding it is the company's decision");
  assert.deepEqual(invoices.items[0].lines.map((item) => [item.name, item.amount]), [["Snow Removal", "CA$747.99"], ["Rock Salt De-Icing", "CA$3,469.95"]]);
}

function configure(enabled, extra = {}) {
  applyPortalConfig(readPortalConfig({
    dataset: Object.assign({
      portalVertical: "snow", portalProfile: "stormRetail", portalTheme: "snow", portalDataMode: "live", portalAuthMode: "required",
      portalOrganization: "SNOWLIMITLESS", portalAccountTypeCode: "CUSTOMER", portalDefaultRoute: "overview", portalTimeZone: "America/Vancouver",
      portalNavAppointmentsLabel: "Visits", portalNavInvoicesLabel: "Invoices", portalNavProposalsLabel: "Orders", portalNavContractsLabel: "Contracts",
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
  await preloadProgress();
  assert.ok(calls.includes("/core-svc/api/tagged/appointment/list.json") && calls.includes("/core-bill/api/tagged/invoice/list.json"));
  assert.deepEqual(navLabels(), ["Home", "Visits", "Orders", "Contracts", "Invoices"], "the snow nav reads Home, Visits, Orders, Contracts, Invoices");
  const activeNav = (route) => { const previous = state.route; state.route = route; const labels = all(one(TopNav(false), ".nav-links"), ".nav-link--active").map((node) => node.textContent); state.route = previous; return labels; };
  assert.deepEqual(["proposals.list", "proposal.detail", "proposal.approve", "quote.new", "contracts.list", "agreement.detail"].map(activeNav), [["Orders"], ["Orders"], ["Orders"], ["Orders"], ["Contracts"], ["Contracts"]], "a quote or order lights Orders and an agreement lights Contracts, never both");
  assert.deepEqual(["/proposals", "/contracts", "/proposals/quote-169-983", "/agreements/agreement-core-169"].map((address) => matchRoutePath(address).id), ["proposals.list", "contracts.list", "proposal.detail", "agreement.detail"], "the old Contracts address, which the quote and agreement emails link to, now opens Orders; Contracts has its own address and the detail links are unchanged");

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
  assert.match(visit76.textContent, /^Wed, Oct 21, 7:30 – 8:20 AMArrived Oct 28, 5:20 AM · Departed Oct 28, 5:20 AM · Under 1 min on siteCompleted›$/, "a row shows date, window, the arrival and departure Core recorded with the time between them, and status, and no address for a single property");
  const visit77 = all(visits, "[data-module=\"visit-row\"]").find((row) => row.getAttribute("data-id") === "visit-core-77");
  assert.equal(one(visit77, "[data-module=\"visit-on-site\"]").textContent, "Arrived 6:47 AM · Departed 7:33 AM · 46 min on site", "times on the visit's own day name no date, and the time on site is the span from arrival to departure");
  assert.equal(one(visit77, "[data-module=\"visit-photo-count\"]").textContent, "2 photos", "a row says how many before and after photos the visit has");
  const visit79 = all(visits, "[data-module=\"visit-row\"]").find((row) => row.getAttribute("data-id") === "visit-core-79");
  assert.equal(all(visit79, "[data-module=\"visit-on-site\"]").length + all(visit79, "[data-module=\"visit-photo-count\"]").length, 0, "a scheduled visit has no arrival, departure or photos yet");
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
  assert.equal(all(page("invoice.detail", { invoiceId: "invoice-core-8" }), "[data-action=\"invoice.print\"]").length, 0, "nothing to print without an invoice");
  const print = one(bill, "[data-action=\"invoice.print\"]");
  assert.deepEqual([print.tagName, print.textContent, print.getAttribute("data-visual-id")], ["BUTTON", "Print invoice", "invoice-print"]);
  const printed = [];
  globalThis.print = () => printed.push("print");
  ACTIONS["invoice.print"]();
  assert.deepEqual(printed, ["print"], "the button opens the browser's print dialog");
  delete globalThis.print;
  const sheet = one(bill, "[data-module=\"invoice-sheet\"]");
  assert.equal(one(sheet, ".invoice-sheet__number").textContent, "#47");
  assert.equal(one(sheet, ".invoice-sheet__status").textContent, "Due");
  assert.deepEqual(all(sheet, ".invoice-sheet__fact").map((row) => row.textContent), ["Service periodNovember 2026", "Invoice dateOct 28, 2026", "Due dateNov 12, 2026", "Payment termsNet 15"]);
  assert.deepEqual(all(sheet, "[data-module=\"invoice-sheet-line\"]").map((row) => row.textContent), ["Snow Removal1CA$747.99", "Rock Salt De-Icing1CA$3,469.95"]);
  assert.equal(one(sheet, "[data-module=\"invoice-sheet-total\"]").textContent, "TotalCA$4,217.94");
  assert.equal(one(sheet, "[data-module=\"invoice-sheet-from\"]").textContent, "From" + state.config.brandName, "without an agreement the sheet names only the configured brand");
  assert.equal(all(sheet, "[data-module=\"invoice-sheet-to\"]").length, 0, "no bill-to is invented");
  assert.equal(all(sheet, "img").length, 0);
  const savedProposals = state.moduleData.proposals;
  state.moduleData.proposals = agreement169(["CLIENT_APPROVED"], ACTIVE_ORDER);
  assert.equal(invoiceParties(liveInvoices().items[0]).client.legalName, "Bilbo Baggins", "the agreement that lists the invoice's order names the parties");
  state.moduleData.proposals = savedProposals;
  const printCss = await fs.readFile(path.join(portalRoot, "runtime/styles/routes.css"), "utf8");
  const printRules = printCss.slice(printCss.indexOf("@media print {"));
  assert.match(printRules, /\.top-nav-wrap[^{]*\{ display: none !important; \}/, "printing drops the app shell");
  assert.match(printRules, /\[data-route="invoice\.detail"\] > :not\(\.invoice-sheet\) \{ display: none !important; \}/, "printing shows only the sheet");
  assert.match(printCss, /^\.invoice-sheet \{ display: none; \}/m, "the sheet stays out of the screen");

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
  await preloadProgress();
  const list = page("appointments");
  const rows = Object.fromEntries(all(list, "[data-module=\"visit-row\"]").map((row) => [row.getAttribute("data-id"), row.textContent]));
  assert.match(rows["visit-core-79"], /12 Frost Lane, Surrey, BC V3W 1J8, Canada/, "with two properties each visit names its address");
  assert.match(rows["visit-core-81"], /88 Harbour Road/);
  for (const text of Object.values(rows)) assert.equal(text.split("Frost Lane").length + text.split("Harbour Road").length, 3, "the address appears once per row");
  assert.match(one(Overview(), "[data-module=\"next-visit\"]").textContent, /12 Frost Lane/, "the home names the property of the next visit when there are several");
  await preloadProgress();
  const other = page("visit.detail", { visitId: "visit-core-81" });
  assert.equal(one(other, "[data-module=\"visit-when\"]").textContent, "7:30 – 8:40 AM", "the header keeps the window; the property block names the address");
  assert.equal(other.textContent.split("88 Harbour Road").length, 2, "with several properties the visit names its own address once");
  assert.equal(one(other, "[data-visual-id=\"visit-property-link\"]").getAttribute("href"), "#/properties/prop-core-1033");
  state.propertyId = "prop-core-1033";
  const section = one(PropertyDetail(), "[data-module=\"property-live-visits\"]");
  assert.deepEqual(ids(section, "[data-module=\"visit-row\"]"), ["visit-core-81", "visit-core-80"], "a property lists only its own visits");
  assert.doesNotMatch(section.textContent, /Harbour Road/, "the property page does not repeat its own address on each visit");
  assert.deepEqual(navLabels(), ["Home", "Visits", "Orders", "Contracts", "Invoices"], "with no invoices the Invoices item stays in the nav");
  const profileBefore = state.moduleData.profile;
  assert.deepEqual([one(TopNav(false), ".brand-name").textContent, all(TopNav(false), "img").length], [state.config.brandName, 0], "without the provider's Organization the header keeps the configured brand and mark");
  state.moduleData.profile = Object.assign({}, profileBefore, { provider: { name: "Limitless Snow Removal Corp.", logoImageId: "3fecdfcd-2c9e-49c2-8873-92e4378930fc", regions: [] } });
  const branded = TopNav(false);
  assert.deepEqual([one(branded, ".brand-name").textContent, one(branded, "img").getAttribute("src"), one(branded, "img").getAttribute("alt")], ["Limitless Snow Removal Corp.", "/core/image/3fecdfcd-2c9e-49c2-8873-92e4378930fc/get", ""], "the header names the provider and shows its logo from the Organization record");
  const logoNode = one(branded, "img");
  assert.equal(one(TopNav(false), "img"), logoNode, "one image element serves every render, so the logo is fetched once");
  Object.assign(logoNode, { naturalWidth: 2170, naturalHeight: 589 });
  (logoNode.listeners.load || []).forEach((listener) => listener({ type: "load" }));
  assert.equal(one(TopNav(false), ".top-nav__brand").getAttribute("data-brand"), "wordmark", "a wide logo is the provider's wordmark, so the stylesheet leaves the name to it");
  const mounted = TopNav(false);
  const fail = (node) => (node.listeners.error || []).forEach((listener) => listener({ type: "error" }));
  fail(logoNode);
  assert.deepEqual([all(mounted, "img").length, one(mounted, ".top-nav__brand").getAttribute("data-brand"), one(mounted, ".brand-name").textContent], [0, null, "Limitless Snow Removal Corp."], "a logo that fails to load gives way to the drawn mark and the name");
  const second = one(TopNav(false), "img");
  assert.notEqual(second, logoNode, "the next render asks for the logo again, so one dropped request does not cost the session its logo");
  fail(second);
  fail(one(TopNav(false), "img"));
  assert.equal(all(TopNav(false), "img").length, 0, "after three failures the header stops asking");
  state.moduleData.profile = profileBefore;
  const noInvoices = page("invoices");
  assert.deepEqual([noInvoices.getAttribute("data-state"), one(noInvoices, ".state-block__title").textContent], ["empty", "No invoices yet"], "and its page says there are none yet");
}

{
  const todayKey = localDateKey(new Date(), "America/Vancouver");
  const [year, month, day] = todayKey.split("-").map(Number);
  const at = (offset, hour) => Date.UTC(year, month - 1, day + offset, hour, 0);
  const visits = [
    visit(91, at(0, 9), at(0, 11), "IN_PROGRESS", 983),
    visit(92, at(0, 14), at(0, 15), "SCHEDULED", 1033),
    visit(93, at(2, 8), at(2, 9), "SCHEDULED", 983),
    visit(94, at(-3, 8), at(-3, 9), "COMPLETED", 1034),
    visit(95, at(1, 8), at(1, 9), "CANCELED", 1034),
    visit(96, at(1, 10), at(1, 11), "DRAFT", 1034),
  ];
  await liveLoad({ properties: [property(983, 610), property(1033, 611), property(1034, 612), property(1035, 613)], visits, invoices: [] });
  const home = Overview();
  const strip = one(home, "[data-module=\"visit-days\"]");
  const cells = all(strip, ".ov-day");
  assert.equal(cells.length, 7, "without a forecast the home still shows the next seven days under the map");
  assert.deepEqual(cells.map((cell) => [one(cell, ".ov-day__name").textContent, cell.getAttribute("data-service") || "0", cell.tagName]).slice(0, 3), [["Today", "2", "BUTTON"], [cells[1].children[0].textContent, "0", "DIV"], [cells[2].children[0].textContent, "1", "BUTTON"]], "each day counts the visits Core holds for it: a cancelled or draft visit is not a visit of the day");
  assert.deepEqual([cells[0].getAttribute("data-action"), cells[0].getAttribute("data-id"), cells[0].getAttribute("aria-label").endsWith("2 visits")], ["nav.go", "appointments", true], "a day with visits opens Visits");
  assert.equal(all(home, "[data-module=\"weather-timeline\"]").length, 0);
  const rowsOf = (root) => Object.fromEntries(all(root, "[data-module=\"property-row\"]").map((row) => [row.getAttribute("data-id"), [row.getAttribute("data-state"), (one(row, ".ov-tip__tag") || { textContent: null }).textContent, (one(row, "[data-module=\"property-visit-line\"]") || { textContent: null }).textContent]]));
  const rows = rowsOf(home);
  assert.deepEqual(rows["prop-core-983"], ["onsite", "In progress", "Visit in progress · Today, 9:00 – 11:00 AM"], "a property whose visit is IN_PROGRESS reads In progress: Core has no en-route state");
  assert.deepEqual(rows["prop-core-1033"], ["scheduled", "Scheduled", "Next visit · Today, 2:00 – 3:00 PM"], "a property with a SCHEDULED visit reads Scheduled with its next visit");
  assert.deepEqual([rows["prop-core-1034"][0], rows["prop-core-1034"][1], /^Last visit · /.test(rows["prop-core-1034"][2])], [null, null, true], "a property with only a completed visit carries no chip, only its last visit: a cancelled or draft visit sets no status");
  assert.deepEqual(rows["prop-core-1035"], [null, null, null], "a property without visits claims nothing: no Active Monitoring and no Issue Opened without a source behind them");
  assert.doesNotMatch(home.textContent, /En Route|Issue Opened|Active Monitoring|Support/, "no status the live data cannot back");
  await preloadProgress();
  const list = page("appointments");
  assert.deepEqual(all(list, ".record-section").map((section) => [section.getAttribute("data-module"), all(section, "[data-module=\"visit-row\"]").map((row) => [row.getAttribute("data-id"), one(row, ".status-badge").textContent, one(row, ".status-badge").className])]), [
    ["visits-upcoming", [["visit-core-91", "In progress", "status-badge status-badge--progress"], ["visit-core-92", "Scheduled", "status-badge status-badge--info"], ["visit-core-93", "Scheduled", "status-badge status-badge--info"]]],
    ["visits-past", [["visit-core-94", "Completed", "status-badge status-badge--ok"]]],
    ["visits-cancelled", [["visit-core-95", "Cancelled", "status-badge status-badge--scheduled"]]],
  ], "every APPOINTMENT state the client may see has its label and colour: SCHEDULED, IN_PROGRESS, COMPLETED and CANCELED; a DRAFT visit is the provider's and stays out");
  await preloadProgress();
  const cancelled = page("visit.detail", { visitId: "visit-core-95" });
  assert.deepEqual([cancelled.getAttribute("data-state"), all(cancelled, ".status-badge")[0].textContent], ["canceled", "Cancelled"], "a cancelled visit opens with its state");
  assert.equal(all(one(Overview(), "[data-module=\"next-visit\"]"), "[data-id=\"visit-core-91\"]").length, 1, "the next visit is never a cancelled one");
}

{
  await liveLoad({ properties: [property(983, 610)], visits: [visit(75, 1792400000000, 1792403600000, "CANCELED", 983)], invoices: [invoice(8, "DRAFT", [2026, 9, 25], "", "", 100)] });
  assert.deepEqual(navLabels(), ["Home", "Visits", "Orders", "Contracts", "Invoices"], "the nav keeps Visits and Invoices whatever the lists hold");
  await preloadProgress();
  assert.deepEqual([page("invoices").getAttribute("data-state"), all(one(page("appointments"), "[data-module=\"visits-cancelled\"]"), "[data-module=\"visit-row\"]").length], ["empty", 1], "a draft invoice is not the client's yet, and a cancelled visit is listed as cancelled");
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
  assert.deepEqual(navLabels(), ["Home", "Visits", "Orders", "Contracts", "Invoices"]);

  const { failure } = await liveLoad({ properties: [property(983, 610)], visits: "fail", invoices: "fail" });
  assert.equal(failure, null, "a failed visit or invoice read does not fail the portal");
  assert.equal(state.moduleData.properties.state, "ready");
  assert.deepEqual(navLabels(), ["Home", "Visits", "Orders", "Contracts", "Invoices"], "a failed read keeps its nav item so the page can say what went wrong");
  assert.match(page("appointments").textContent, /Couldn’t load your visits/);
  assert.equal(all(Overview(), "[data-module=\"next-visit\"]").length, 0);

  configure("overview,properties,appointmentsTimeline,invoices");
  assert.deepEqual(navLabels(), ["Home", "Visits", "Invoices"], "the nav is the enabled modules from the first render, before any list has loaded");
  assert.equal(page("invoices").getAttribute("data-state"), "loading");
}

{
  const calls = [];
  const rows = await readVisitTransitions(context, 78, async (url, options) => { calls.push({ path: new URL(url).pathname, options }); return transitionsFetch(url); });
  assert.deepEqual(calls.map((call) => call.path), ["/core-svc/api/tagged/appointment/78/list-transitions.json"], "progress comes from the tagged transition list of the visit");
  assert.equal(calls[0].options.headers.Authorization, "Bearer test-token");
  assert.equal(calls[0].options.headers["X-Organization-Code"], "SNOWLIMITLESS");
  const body = JSON.parse(calls[0].options.body);
  assert.deepEqual(body, coreSnowContract.visitTransitionsBody);
  assert.deepEqual(body.mappings.map((mapping) => mapping.name), ["id", "observed", "state"], "the crew member who moved the visit is not requested");
  assert.deepEqual(body.sorting, [{ field: "observed", direction: "ASC" }]);
  assert.equal(rows[0].observed, 1793190076446);
  await assert.rejects(readVisitTransitions(context, 78, async () => json({}, 403)), { code: "customer-forbidden" });

  const steps = normalizeVisitProgress(TRANSITIONS[77]);
  assert.deepEqual(steps.map((step) => step.code), ["SCHEDULED", "IN_PROGRESS", "COMPLETED"], "steps run in time order and a state the customer never sees is dropped");

  const started = normalizeVisitProgress(TRANSITIONS[78])[0];
  const visit78 = normalizeVisits({ items: [VISITS_732[1]] }).upcoming[0];
  assert.equal(progressWhen(started, visit78, "America/Vancouver"), "5:21 AM", "12:21:16 UTC reads 5:21 AM in the organization's zone, in a " + process.env.TZ + " process");
  assert.equal(progressWhen(started, visit78, "Europe/Moscow"), "3:21 PM");
  assert.equal(progressWhen(started, visit78, "Pacific/Kiritimati"), "Oct 29, 2:21 AM", "a recorded moment on another local day than the visit names that day");
  const lateEvening = new Date(Date.UTC(2026, 9, 29, 4, 30));
  assert.equal(localDateKey(lateEvening, "America/Vancouver"), "2026-10-28", "04:30 UTC on Oct 29 is still Oct 28 in Vancouver");
  assert.equal(visitDay(visit78, localDateKey(lateEvening, "America/Vancouver")), "Today", "the day label follows the organization's zone");
  assert.equal(visitDay(visit78, localDateKey(lateEvening, "Europe/Moscow")), "Wed, Oct 28");
  assert.deepEqual(["America/Vancouver", " UTC", "#", "", "Mars/Olympus", undefined].map(readTimeZone), ["America/Vancouver", "UTC", null, null, null, null], "PORTAL_TIME_ZONE accepts an IANA zone and treats the # placeholder as not set");
}

{
  await liveLoad({ properties: [property(983, 610, { SERVICE_AREA_SQFT: { value: 50000 }, PROPERTY_PLAN: { value: PLAN } })], visits: VISITS_732, invoices: INVOICES_732 });
  state.moduleData.proposals = agreement169(SIGNED_169, ACTIVE_ORDER);
  await preloadProgress();
  const planEntry = propertyPlan(PLAN, () => {}, async () => ({ ok: true, json: async () => structuredClone(PLAN_JSON) }));
  await settle();
  assert.equal(planEntry.status, "ready");
  const sections = (root) => root.children.map((node) => node.getAttribute("data-module")).filter(Boolean);
  const steps = (root) => all(root, "[data-module=\"visit-progress-step\"]").map((node) => node.textContent);

  const done = page("visit.detail", { visitId: "visit-core-77" });
  const showAll = one(one(done, "[data-module=\"visit-detail-bar\"]"), "button");
  assert.deepEqual([showAll.textContent, showAll.getAttribute("data-action"), showAll.getAttribute("data-id"), showAll.getAttribute("data-visual-id")], ["Show all visits", "nav.go", "appointments", "visit-show-all"], "a visit has an explicit button back to every visit");
  assert.equal(all(done, ".detail-back").length, 0, "the small back link gave way to the button");
  for (const status of ["loading", "error", "empty"]) {
    const saved = state.moduleData.appointmentsTimeline;
    state.moduleData.appointmentsTimeline = status === "loading" ? { state: "loading" } : status === "error" ? { state: "error" } : Object.assign({}, saved, { upcoming: [], past: [] });
    assert.equal(all(page("visit.detail", { visitId: "visit-core-77" }), "[data-visual-id=\"visit-show-all\"]").length, 1, "the " + status + " visit page keeps the way back");
    state.moduleData.appointmentsTimeline = saved;
  }
  assert.deepEqual(sections(done), ["visit-detail-bar", "visit-property", "property-plan", "visit-services", "visit-progress", "visit-notes", "visit-photos"]);
  const facts = one(done, "[data-module=\"visit-property\"]");
  assert.deepEqual(all(facts, "[data-fact]").map((fact) => [fact.getAttribute("data-fact"), one(fact, ".prop-fact__value").textContent]), [["property", "12 Frost Lane, Surrey, BC V3W 1J8, Canada ›"], ["area", "50,000 ft²"]], "a single-property customer still sees which property the visit is at, and its area");
  assert.equal(one(facts, "a").getAttribute("href"), "#/properties/prop-core-983");
  assert.equal(done.textContent.split("12 Frost Lane").length, 2, "the address appears once on the visit page");
  assert.equal(all(one(done, "[data-module=\"property-plan\"]"), ".prop-plan__shape").length, 1, "the approved plan is drawn");
  assert.deepEqual(all(one(done, "[data-module=\"visit-services\"]"), ".prop-service__line").map((node) => node.textContent), ["Snow Removal", "Rock Salt De-Icing"], "the services are the chosen option of the active agreement, not the declined one");
  assert.doesNotMatch(one(done, "[data-module=\"visit-services\"]").textContent, /\$|747|Monthly/, "the visit page shows no prices");
  assert.deepEqual(steps(done), ["Scheduled · Oct 22", "Arrived · 6:47 AM", "Departed · 7:33 AM"], "transition instants read in the organization's zone, beside the wall-clock window 6:45 – 7:35 AM");
  assert.doesNotMatch(one(done, "[data-module=\"visit-progress\"]").textContent, /1:47 PM|2:33 PM/, "observed is a real instant, not a wall-clock value read as UTC");
  assert.deepEqual([one(one(done, "[data-module=\"visit-duration\"]"), ".prop-fact__label").textContent, one(one(done, "[data-module=\"visit-duration\"]"), ".prop-fact__value").textContent], ["Time on site", "46 min"], "a completed visit says how long the crew was on site");
  assert.equal(one(one(done, "[data-module=\"visit-notes\"]"), "h2").textContent, "Work done", "the crew's completion note is the work done");
  assert.deepEqual([onSiteDuration([{ code: "IN_PROGRESS", ms: 0 }, { code: "COMPLETED", ms: 85 * 60000 }]), onSiteDuration([{ code: "IN_PROGRESS", ms: 0 }, { code: "COMPLETED", ms: 120 * 60000 }]), onSiteDuration([{ code: "COMPLETED", ms: 5 }]), onSiteDuration([{ code: "IN_PROGRESS", ms: 9 }, { code: "COMPLETED", ms: 5 }])], ["1 h 25 min", "2 h", "", ""], "hours and minutes; nothing without both instants or when they are out of order");

  const live = page("visit.detail", { visitId: "visit-core-78" });
  assert.equal(one(live, "[data-module=\"visit-when\"]").textContent, "6:30 – 7:30 AM", "the planned window renders without a zone shift");
  assert.deepEqual(steps(live), ["Arrived · 5:21 AM"], "the dev-1 transition of visit 78, observed 12:21 UTC, is 5:21 AM in Vancouver");
  assert.equal(all(live, "[data-module=\"visit-duration\"]").length, 0, "a visit still in progress has no time on site yet");
  assert.deepEqual(sections(live), ["visit-detail-bar", "visit-property", "property-plan", "visit-services", "visit-progress", "visit-photos"]);
  assert.deepEqual(all(live, ".record-photos__label").map((node) => node.textContent), ["Before"], "before photos show while the visit is in progress");
  assert.deepEqual(all(live, "img").map((img) => img.getAttribute("src")), ["/core/image/" + PRE_78 + "/get"]);

  const old = page("visit.detail", { visitId: "visit-core-76" });
  assert.deepEqual(steps(old), ["Arrived · Oct 28, 5:20 AM", "Departed · Oct 28, 5:20 AM"], "a transition on another day than the visit names its date");

  const upcoming = page("visit.detail", { visitId: "visit-core-79" });
  assert.deepEqual(sections(upcoming), ["visit-detail-bar", "visit-property", "property-plan", "visit-services"], "an upcoming visit shows the property and the services and no empty section");
  assert.doesNotMatch(upcoming.textContent, /Progress|Photos|Work done|Time on site|No |not available/);

  state.moduleData.proposals = agreement169(SIGNED_169.slice(0, 5));
  assert.equal(all(page("visit.detail", { visitId: "visit-core-79" }), "[data-module=\"visit-services\"]").length, 0, "an agreement awaiting approval lists no services on a visit");
  delete state.moduleData.proposals;
  assert.equal(all(page("visit.detail", { visitId: "visit-core-79" }), "[data-module=\"visit-services\"]").length, 0, "without an agreement there is no Services block");

  const forbidden = visit(92, 1793430000000, 1793433000000, "IN_PROGRESS", 983);
  TRANSITIONS[92] = "forbidden";
  await liveLoad({ properties: [property(983, 610)], visits: [forbidden], invoices: [] });
  await preloadProgress();
  const unread = page("visit.detail", { visitId: "visit-core-92" });
  assert.deepEqual(sections(unread), ["visit-detail-bar", "visit-property"], "a transition list the customer cannot read leaves no Progress block, and a property without area or plan shows only its address");
  assert.deepEqual(all(unread, "[data-fact]").map((fact) => fact.getAttribute("data-fact")), ["property"]);
}

{
  const AFTER_2 = "9d1e6b2c-4a7f-4c3e-8b5d-2f6a1c9e7b30";
  const photographed = visit(80, 1792400000000, 1792403600000, "COMPLETED", 983, {
    PRE_SERVICE_MEDIA: { value: [{ id: PRE, type: "image" }, { id: PRE_78, type: "image" }] },
    POST_SERVICE_MEDIA: { value: [{ id: POST, type: "image" }, { id: AFTER_2, type: "image" }] },
  });
  await liveLoad({ properties: [property(983, 610)], visits: [photographed], invoices: [] });
  await preloadProgress();
  const { PHOTOSWIPE, VISIT_PHOTO_ACTION, loadPhotoSwipe } = await load("src/visit-photo-viewer.js");
  const { bindActions } = await load("src/actions.js");
  const image = (id) => "/core/image/" + id + "/get";

  const detail = page("visit.detail", { visitId: "visit-core-80" });
  const thumbs = all(one(detail, "[data-module=\"visit-photos\"]"), "a.record-photos__item");
  assert.deepEqual(thumbs.map((thumb) => [thumb.getAttribute("data-action"), thumb.getAttribute("data-id"), thumb.getAttribute("href"), thumb.getAttribute("data-caption")]), [
    [VISIT_PHOTO_ACTION, "0", image(PRE), "Before"],
    [VISIT_PHOTO_ACTION, "1", image(PRE_78), "Before"],
    [VISIT_PHOTO_ACTION, "2", image(POST), "After"],
    [VISIT_PHOTO_ACTION, "3", image(AFTER_2), "After"],
  ], "every thumbnail is a link to its image that opens the viewer, numbered across one gallery with the before photos first");
  assert.ok(thumbs.every((thumb) => thumb.getAttribute("target") === null), "a thumbnail no longer opens the raw image in a new tab");
  assert.deepEqual(thumbs.map((thumb) => one(thumb, "img").getAttribute("alt")), ["Before service photo 1", "Before service photo 2", "After service photo 1", "After service photo 2"]);
  assert.ok(thumbs.every((thumb) => one(thumb, "img").getAttribute("loading") === "lazy"));
  assert.deepEqual(all(detail, ".record-photos__label").map((node) => node.textContent), ["Before", "After"]);

  Object.assign(one(thumbs[0], "img"), { complete: true, naturalWidth: 4032, naturalHeight: 3024 });
  Object.assign(one(thumbs[1], "img"), { complete: true, naturalWidth: 3024, naturalHeight: 4032 });
  const probes = [];
  globalThis.Image = class {
    set src(value) { probes.push(value); setImmediate(() => { Object.assign(this, { naturalWidth: 1200, naturalHeight: 900 }); this.onload(); }); }
  };
  const opened = [];
  globalThis.PhotoSwipe = class {
    constructor(options) { this.options = options; this.handlers = {}; this.filters = {}; this.ui = { registerElement: (element) => { this.caption = element; } }; opened.push(this); }
    addFilter(name, filter) { this.filters[name] = filter; }
    on(name, handler) { (this.handlers[name] = this.handlers[name] || []).push(handler); }
    fire(name) { (this.handlers[name] || []).forEach((handler) => handler()); }
    init() { this.initialized = true; }
  };
  const app = dom.document.createElement("div");
  bindActions(app);
  app.appendChild(detail);
  dom.document.replaceChildren(app);
  const click = (target, extra = {}) => {
    const event = Object.assign({ target, button: 0, prevented: false, preventDefault() { this.prevented = true; } }, extra);
    app.listeners.click.forEach((listener) => listener(event));
    return event;
  };

  assert.equal(dom.document.head.children.length, 0, "the viewer library is not on the page before a photo is opened");
  const modified = click(one(thumbs[2], "img"), { metaKey: true });
  assert.equal(modified.prevented, false, "a modified click keeps the browser's open-in-new-tab behaviour");
  assert.equal(dom.document.head.children.length, 0, "and loads nothing");

  const first = click(one(thumbs[2], "img"));
  assert.equal(first.prevented, true, "a click on a thumbnail never follows the link away from the portal");
  assert.equal(globalThis.location.href, "https://portal.example.test/pages/SNOWLIMITLESS/portal");
  const [style, script] = dom.document.head.children;
  assert.deepEqual([style.tagName, style.getAttribute("rel"), style.getAttribute("href"), style.getAttribute("integrity"), style.getAttribute("crossorigin")],
    ["LINK", "stylesheet", "https://cdnjs.cloudflare.com/ajax/libs/photoswipe/5.4.4/photoswipe.css", "sha384-s2AldnnzPSlbjXKTGuicXrolvAtPwQBv9ndvaRLccssYIi3A2bjWOv3p+poD8LUk", "anonymous"], "the PhotoSwipe stylesheet comes from its pinned cdnjs address with SRI");
  assert.deepEqual([script.tagName, script.getAttribute("src"), script.getAttribute("integrity"), script.getAttribute("crossorigin")],
    ["SCRIPT", "https://cdnjs.cloudflare.com/ajax/libs/photoswipe/5.4.4/umd/photoswipe.umd.min.js", "sha384-k8EKyYcONphQ7zH4cQ0888JapXwrLTXQl/Ue1/jYgjVYahln1NWpnt2S4IC56LNh", "anonymous"], "the PhotoSwipe script comes from its pinned cdnjs address with SRI");
  assert.deepEqual([PHOTOSWIPE.style.href, PHOTOSWIPE.script.src], [style.getAttribute("href"), script.getAttribute("src")]);
  style.listeners.load.forEach((listener) => listener());
  script.listeners.load.forEach((listener) => listener());
  await settle();
  await settle();

  assert.equal(opened.length, 1, "the viewer opens once the library has loaded");
  const viewer = opened[0];
  assert.equal(viewer.initialized, true);
  assert.equal(viewer.options.index, 2, "the viewer opens on the clicked photo");
  assert.deepEqual(viewer.options.dataSource.map((slide) => [slide.src, slide.caption, slide.alt, slide.width, slide.height]), [
    [image(PRE), "Before", "Before service photo 1", 4032, 3024],
    [image(PRE_78), "Before", "Before service photo 2", 3024, 4032],
    [image(POST), "After", "After service photo 1", 1200, 900],
    [image(AFTER_2), "After", "After service photo 2", 1200, 900],
  ], "the gallery runs before photos then after photos, captioned, sized from the loaded thumbnail or a preload");
  assert.deepEqual(probes, [image(POST), image(AFTER_2)], "only photos whose thumbnail has not loaded are preloaded");
  assert.equal(viewer.options.returnFocus, false);

  viewer.fire("uiRegister");
  const caption = dom.document.createElement("div");
  viewer.caption.onInit(caption, viewer);
  viewer.currSlide = { data: viewer.options.dataSource[2] };
  viewer.fire("change");
  assert.equal(caption.textContent, "After", "the viewer caption names the photo's group");
  assert.equal(viewer.filters.thumbEl(null, viewer.options.dataSource[1], 1), one(thumbs[1], "img"), "the zoom animation starts from the thumbnail on the page");

  let focused = null;
  thumbs[2].focus = () => { focused = thumbs[2]; };
  viewer.fire("destroy");
  assert.equal(focused, thumbs[2], "closing the viewer returns focus to the thumbnail that opened it");

  click(one(thumbs[0], "img"));
  await settle();
  await settle();
  assert.equal(dom.document.head.children.length, 2, "the library is loaded once, not on every open");
  assert.equal(opened.length, 2);
  assert.equal(opened[1].options.index, 0);

  const failing = { document: dom.document.createElement("#document") };
  failing.document.head = dom.document.createElement("head");
  failing.document.createElement = (tag) => dom.document.createElement(tag);
  const attempt = loadPhotoSwipe(failing);
  failing.document.head.children[1].listeners.error.forEach((listener) => listener());
  failing.document.head.children[0].listeners.load.forEach((listener) => listener());
  await assert.rejects(attempt, /PhotoSwipe script could not be loaded/);
  assert.deepEqual(failing.document.head.children.map((node) => node.tagName), ["LINK"], "a script that fails to load is removed");
  loadPhotoSwipe(failing).catch(() => {});
  assert.equal(failing.document.head.children.length, 3, "a later open retries the load");

  delete globalThis.Image;
  delete globalThis.PhotoSwipe;
  dom.document.replaceChildren();
  dom.document.head.replaceChildren();
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
  assert.deepEqual([source.shell.navigation.proposals, source.shell.navigation.contracts], ["Orders", "Contracts"], "quotes and orders are Orders, service agreements are Contracts");
  const order = portalProfiles.stormRetail.nav.map((item) => item.key).filter((key) => ["overview", "appointments", "invoices", "proposals.list", "contracts.list"].includes(key));
  assert.deepEqual(order, ["overview", "appointments", "proposals.list", "contracts.list", "invoices"]);
}

{
  const snapshot = { version: 1, visitState: "COMPLETED", capturedAt: "2026-11-12T20:45:14Z", crew: [{ name: "Jordan W.", role: "Driver" }], vehicle: { name: "FORD F-350", type: "Pickup Truck" }, equipment: [{ name: "WESTERN 8.5 MVP PLUS SNOWPLOW", type: "Plow" }, { name: "Tailgate salter", type: "Salt Spreader (Salter)" }] };
  const full = Object.assign(visit(92, Date.UTC(2026, 9, 26, 7), Date.UTC(2026, 9, 26, 8), "COMPLETED", 983), { metadata: { CLIENT_VISIT_CREW: snapshot } });
  const truckOnly = Object.assign(visit(93, Date.UTC(2026, 9, 24, 7), Date.UTC(2026, 9, 24, 8), "COMPLETED", 983), { metadata: { CLIENT_VISIT_CREW: { version: 1, visitState: "COMPLETED", crew: [], vehicle: { name: "Chevrolet Silverado", type: "Pickup Truck" }, equipment: [] } } });
  const upcoming = visit(94, Date.UTC(2026, 10, 20, 7), Date.UTC(2026, 10, 20, 8), "SCHEDULED", 983);
  Object.assign(TRANSITIONS, { 92: [], 93: [], 94: [] });
  await liveLoad({ properties: [property(983, 610)], visits: [full, truckOnly, upcoming], invoices: [] });
  await preloadProgress();
  const crewFacts = (root) => all(one(root, "[data-module=\"visit-crew\"]"), "[data-fact]").map((fact) => [fact.getAttribute("data-fact"), one(fact, ".prop-fact__label").textContent, all(fact, ".visit-crew__item").map((item) => item.textContent)]);
  const detail = page("visit.detail", { visitId: "visit-core-92" });
  assert.deepEqual(crewFacts(detail), [
    ["crew", "Who came", ["Jordan W.Driver"]],
    ["vehicle", "Vehicle", ["Ford F-350Pickup Truck"]],
    ["equipment", "Equipment", ["Western 8.5 MVP Plus SnowplowPlow", "Tailgate SalterSalt Spreader (Salter)"]],
  ], "the visit page names who came, the vehicle and the equipment");
  const order = all(detail, "[data-module]").map((node) => node.getAttribute("data-module")).filter((module) => ["visit-property", "visit-crew", "visit-progress", "visit-photos"].includes(module));
  assert.deepEqual(order.slice(0, 2), ["visit-property", "visit-crew"], "the crew follows the property");
  assert.deepEqual(crewFacts(page("visit.detail", { visitId: "visit-core-93" })), [["vehicle", "Vehicle", ["Chevrolet SilveradoPickup Truck"]]], "an empty section is left out");
  assert.equal(all(page("visit.detail", { visitId: "visit-core-94" }), "[data-module=\"visit-crew\"]").length, 0, "a visit that has not started shows no crew card");
  const lines = Object.fromEntries(all(page("appointments"), "[data-module=\"visit-row\"]").map((row) => [row.getAttribute("data-id"), all(row, "[data-module=\"visit-crew-line\"]").map((node) => node.textContent)]));
  assert.deepEqual(lines, { "visit-core-94": [], "visit-core-92": ["Jordan W. · Ford F-350 · Western 8.5 MVP Plus Snowplow, Tailgate Salter"], "visit-core-93": ["Chevrolet Silverado"] }, "a visit row carries the same names on one line");
}

console.log("snow visits and invoices check ok: tagged visit and invoice reads with the dev-1 bodies, wall-clock visit times, the visit page's property, plan, active-agreement services and progress from tagged transitions read as real instants, DRAFT invoices and DRAFT visits hidden, cancelled visits listed as cancelled, single-property address omission, home next-visit and invoice-due cards, property visits, visit photos opened in-page in one before-then-after PhotoSwipe gallery loaded lazily from its pinned SRI address, and Visits and Invoices always in the live nav with their empty states, the home day strip and property status from visits alone");

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
    replaceChild(next, previous) {
      if (next.parentNode) next.parentNode.removeChild(next);
      this.childNodes = this.childNodes.map((node) => (node === previous ? next : node));
      next.parentNode = this;
      previous.parentNode = null;
      return previous;
    }
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
