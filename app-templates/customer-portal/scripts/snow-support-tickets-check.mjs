import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

process.env.TZ ??= "America/Vancouver";

const ACCOUNT = 732;
const USER = 55;
const dom = createDom();
globalThis.window = globalThis;
globalThis.document = dom.document;
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
globalThis.location = { href: "https://portal.example.test/pages/SNOWLIMITLESS/portal", origin: "https://portal.example.test", pathname: "/pages/SNOWLIMITLESS/portal", search: "", hash: "" };
globalThis.history = { pushState(_, __, url) { globalThis.location.hash = url; }, replaceState(_, __, url) { globalThis.location.hash = url; } };
globalThis.addEventListener = () => {};

const runtimeRoot = pathToFileURL(path.resolve("app-templates/customer-portal/runtime") + "/");
const load = (file) => import(new URL(file, runtimeRoot));
const { readPortalConfig, routeRegistry } = await load("src/config.js");
const { applyPortalConfig, isPublic, isSessionFree, state } = await load("src/state.js");
const { PortalRuntime } = await load("src/portal-runtime.js");
const { coreSnowContract, createCoreSnowTicketsAdapter } = await load("src/adapters/core-snow-adapter.js");
const { SUPPORT_TICKET_FORM, createCoreProfileFormAdapter } = await load("src/adapters/core-profile-form-adapter.js");
const { TICKET_STATUS, normalizeTickets, openTicketForProperty, openTicketForVisit, supportRequests } = await load("src/normalizers/support.js");
const { SUPPORT_TICKET_COPY, changeSupportTicketDraft, loadSupportTicketSchema, startSupportTicket, submitSupportTicket, supportTicketSchema, supportTicketState, supportTicketValues, validateSupportTicket } = await load("src/support-tickets.js");
const { PASSWORD_MIN_LENGTH, SET_PASSWORD_COPY, captureSetPassword, changeSetPasswordEntry, submitSetPassword, validateSetPassword } = await load("src/set-password.js");
const { TopNav } = await load("src/components/shell/TopNav.js");
const { PublicNav } = await load("src/components/shell/PublicNav.js");
const { renderRoute, resolveRoute, routeFromLocation } = await load("src/router.js");
const { Overview } = await load("src/routes/OverviewPage.js");
const { PropertyDetail } = await load("src/routes/PropertyDetailPage.js");
const { ACTIONS } = await load("src/actions.js");
const { visitProgress } = await load("src/visit-progress.js");

const all = (root, selector) => root.querySelectorAll(selector);
const one = (root, selector) => root.querySelector(selector);
const json = (value, status = 200) => ({ ok: status >= 200 && status < 300, status, json: async () => structuredClone(value) });
const settle = () => new Promise((resolve) => setImmediate(resolve));

const REF = [{ name: "id" }, { name: "code" }, { name: "nls" }];
const TICKET_BODY = {
  filters: [{ operator: "=", property: "type.code", value: "SUPPORT_TICKET" }],
  mappings: [
    { name: "id" }, { name: "code" }, { name: "nls" }, { name: "created" }, { name: "attributes" },
    { name: "type", type: "identifier", mappings: REF },
    { name: "states", type: "collection", mappings: REF },
  ],
  offset: 0,
  pageSize: 50,
  sorting: [{ field: "created", direction: "DESC" }],
};
const ticketType = { id: 29, code: "SUPPORT_TICKET", nls: { en: { NAME: "Support Ticket" } } };
const ticket = (id, stateCode, created, property, extra = {}, names = {}) => ({
  id, code: "TICKET-" + (700 + id), created, type: ticketType,
  nls: { en: Object.assign({ NAME: "Driveway was not cleared", DESCRIPTION: "The crew skipped the driveway on the last visit." }, names) },
  attributes: { 29: Object.assign({ ACCOUNT: { value: ACCOUNT }, PROPERTY: { value: property }, CONTACT_REASON: { value: "MISSED_SERVICE" }, PRIORITY: { value: "NORMAL" } }, extra) },
  states: [{ id: 300 + id, code: stateCode, nls: { en: { NAME: stateCode } } }],
});
const TICKETS = [
  ticket(75, "NEW", Date.UTC(2026, 10, 12, 18, 0), 983, { RELATED_SERVICE_VISIT: { value: 79 } }),
  ticket(76, "WAITING", Date.UTC(2026, 10, 11, 18, 0), 1033, { CONTACT_REASON: { value: "BILLING_INQUIRY" } }, { NAME: "Question about my invoice", DESCRIPTION: "Is the November invoice final?" }),
  ticket(74, "RESOLVED", Date.UTC(2026, 10, 9, 18, 0), 983, { RELATED_SERVICE_VISIT: { value: 77 } }, { NAME: "Salt on the ramp" }),
  ticket(73, "CLOSED", Date.UTC(2026, 10, 8, 18, 0), 983, {}, { NAME: "Gate code changed" }),
  ticket(72, "ARCHIVED", Date.UTC(2026, 10, 7, 18, 0), 983),
  Object.assign(ticket(71, "NEW", Date.UTC(2026, 10, 6, 18, 0), 983), { type: { id: 10, code: "SNOW_ROUTE" } }),
];
const FORM_TYPE = {
  id: 15, code: "CUSTOMER_SUPPORT_TICKET", attributes: [
    { code: "PROPERTY_ID" }, { code: "VISIT_ID" }, { code: "SUBJECT" }, { code: "MESSAGE" },
    { code: "CONTACT_REASON", options: [
      { value: "MISSED_SERVICE", nls: { en: { NAME: "Missed service" } } },
      { value: "BILLING_INQUIRY", nls: { en: { NAME: "Billing inquiry" } } },
      { value: "GENERAL_INQUIRY", nls: { en: { NAME: "General inquiry" } } },
    ] },
  ],
};
const visitType = { id: 2, code: "SNOW_SERVICE_VISIT", nls: { en: { NAME: "Service visit" } } };
const visit = (id, start, end, stateCode, property) => ({
  id, code: "APPT-" + id, nls: { en: { NAME: "visit" } }, start, end, attributes: { 2: { RESOURCE: { value: property } } }, type: visitType,
  states: [{ id: 100 + id, code: stateCode, nls: { en: { NAME: stateCode } } }],
});
const VISITS = [
  visit(79, Date.UTC(2026, 9, 31, 6, 30), Date.UTC(2026, 9, 31, 7, 30), "SCHEDULED", 983),
  visit(77, Date.UTC(2026, 9, 25, 6, 45), Date.UTC(2026, 9, 25, 7, 35), "COMPLETED", 983),
  visit(81, Date.UTC(2026, 10, 2, 7, 30), Date.UTC(2026, 10, 2, 8, 40), "SCHEDULED", 1033),
];
const property = (id, address) => ({
  id, code: "RES-" + id, nls: { en: { NAME: "dev-1 test property " + id } }, type: { id: 154, code: "SNOW_REMOVAL_PROPERTY" },
  states: [{ id: 1, code: "ACTIVE" }], attributes: { 153: { ACCOUNT: { value: ACCOUNT }, ADDRESS: { value: address } } },
});
const ADDRESSES = {
  610: { id: 610, address1: "12 Frost Lane", city: "Surrey", postalCode: "V3W 1J8", state: { id: 2, code: "BC" }, country: { id: "CA" } },
  611: { id: 611, address1: "88 Harbour Road", city: "Richmond", postalCode: "V6X 2A1", state: { id: 2, code: "BC" }, country: { id: "CA" } },
};
const context = { config: { vertical: "snow", origin: "https://portal.example.test", organization: "SNOWLIMITLESS" }, state: { session: { accessToken: "test-token", tokenType: "Bearer", userId: USER, organizationId: 43 }, customerAccount: { id: ACCOUNT } } };

{
  const calls = [];
  const raw = await createCoreSnowTicketsAdapter({ fetch: async (url, options) => { calls.push({ path: new URL(url).pathname, options }); return json({ resultSize: TICKETS.length, result: TICKETS }); } }).load("support", context);
  assert.deepEqual(calls.map((call) => call.path), ["/core-svc/api/tagged/task/list.json"], "tickets come from the tagged task list only");
  assert.equal(calls[0].options.headers.Authorization, "Bearer test-token");
  assert.equal(calls[0].options.headers["X-Organization-Code"], "SNOWLIMITLESS");
  assert.deepEqual(JSON.parse(calls[0].options.body), TICKET_BODY, "the body is the documented one with the type mapped, and maps no project");
  assert.deepEqual(coreSnowContract.ticketListBody, TICKET_BODY);
  assert.deepEqual(raw.items.map((row) => row.id), [75, 76, 74, 73, 72], "a task of another type is dropped by the adapter");
  for (const [status, code] of [[401, "session-expired"], [403, "customer-forbidden"], [500, "core-request-failed"]]) {
    await assert.rejects(createCoreSnowTicketsAdapter({ fetch: async () => json({}, status) }).load("support", context), { code });
  }

  const tickets = normalizeTickets(raw);
  assert.deepEqual(tickets.open.map((item) => [item.backendId, item.status.label, item.status.tone]), [[75, "Open", "info"], [76, "In review", "progress"]], "NEW is Open, WAITING is In review, newest first");
  assert.deepEqual(tickets.closed.map((item) => [item.backendId, item.status.label]), [[74, "Resolved"], [73, "Closed"]], "a state the contract does not name is not shown");
  assert.deepEqual(Object.entries(TICKET_STATUS).map(([code, status]) => [code, status.label, status.open]), [["NEW", "Open", true], ["IN_PROGRESS", "In review", true], ["WAITING", "In review", true], ["RESOLVED", "Resolved", false], ["CLOSED", "Closed", false]]);
  assert.deepEqual([tickets.open[0].code, tickets.open[0].subject, tickets.open[0].message, tickets.open[0].propertyBackendId, tickets.open[0].visitBackendId, tickets.open[0].reason], ["TICKET-775", "Driveway was not cleared", "The crew skipped the driveway on the last visit.", 983, 79, "MISSED_SERVICE"]);
  assert.equal(JSON.stringify(tickets).includes("NORMAL"), false, "the priority staff set is not carried to the page");
  assert.equal(openTicketForProperty(tickets, 983).backendId, 75);
  assert.equal(openTicketForVisit(tickets, 79).backendId, 75);
  assert.equal(openTicketForVisit(tickets, 77), null, "a resolved ticket marks nothing");
  assert.equal(openTicketForProperty(tickets, 1035), null);
  assert.deepEqual(supportRequests(tickets, "America/Vancouver"), [
    { id: "ticket-core-75", title: "Driveway was not cleared", status: "Open", tone: "info", when: "Nov 12, 2026" },
    { id: "ticket-core-76", title: "Question about my invoice", status: "In review", tone: "progress", when: "Nov 11, 2026" },
  ]);
}

function configure(enabled, extra = {}) {
  applyPortalConfig(readPortalConfig({
    dataset: Object.assign({
      portalVertical: "snow", portalProfile: "stormRetail", portalTheme: "snow", portalDataMode: "live", portalAuthMode: "required",
      portalOrganization: "SNOWLIMITLESS", portalAccountTypeCode: "CUSTOMER", portalDefaultRoute: "overview", portalTimeZone: "America/Vancouver",
      portalNavAppointmentsLabel: "Visits", portalNavInvoicesLabel: "Invoices", portalNavProposalsLabel: "Orders", portalNavContractsLabel: "Contracts", portalNavSupportLabel: "Support",
      portalBrandName: "Limitless Snow Removal", portalEnabledModules: enabled,
    }, extra),
  }));
  state.config.origin = "https://portal.example.test";
  Object.assign(state.session, { authenticated: true, accessToken: "test-token", tokenType: "Bearer", userId: USER, organizationId: 43 });
  state.customerAccount = { id: ACCOUNT };
  state.account = "ready";
  state.mobileNav = false;
  state.supportTicket = null;
  state.supportTicketSchema = null;
  for (const id of Object.keys(state.moduleData)) delete state.moduleData[id];
  for (const id of Object.keys(state.moduleStatus)) delete state.moduleStatus[id];
}

async function liveLoad(tickets, enabled = "overview,properties,appointmentsTimeline,invoices,proposals,support") {
  configure(enabled);
  const calls = [];
  globalThis.fetch = async (url) => {
    const target = new URL(String(url)).pathname;
    calls.push(target);
    if (target === "/core-rm/api/tagged/resource/list.json") return json({ resultSize: 2, result: [property(983, 610), property(1033, 611)] });
    if (target === "/core-acct/api/tagged/account/get.json") return json({ id: ACCOUNT, user: { id: USER }, addresses: Object.values(ADDRESSES).map((address) => ({ address })) });
    if (target === "/core-svc/api/tagged/appointment/list.json") return json({ resultSize: VISITS.length, result: VISITS });
    if (target === "/core-bill/api/tagged/invoice/list.json") return json({ resultSize: 0, result: [] });
    if (target === "/core-svc/api/tagged/task/list.json") return tickets === "fail" ? json({}, 500) : json({ resultSize: tickets.length, result: tickets });
    if (target === "/en/core-cms/api/form-type/CUSTOMER_SUPPORT_TICKET/get.json") return json(FORM_TYPE);
    throw new Error("unexpected request " + target);
  };
  const runtime = new PortalRuntime({ state });
  const loaded = ["overview", "properties", "appointmentsTimeline", "invoices"].concat(enabled.split(",").includes("support") ? ["support"] : []);
  const failure = await runtime.loadAllAsync(loaded).then(() => null, (error) => error);
  await runtime.settled();
  const visits = state.moduleData.appointmentsTimeline;
  for (const item of [...visits.upcoming, ...visits.past]) visitProgress(item, () => {}, async () => json({ resultSize: 0, result: [] }));
  await settle();
  state.supportTicketSchema = null;
  await loadSupportTicketSchema({ forms: { type: async (form) => { calls.push("form-type " + form.typeCode); return FORM_TYPE; } } });
  return { calls, failure };
}

const navLabels = () => all(one(TopNav(false), ".nav-links"), ".nav-link").map((node) => node.textContent);
const page = (route, params = {}) => { Object.assign(state, params); state.route = route; return renderRoute(); };
const fieldError = (root, code) => { const control = one(root, "[name=\"" + code + "\"]"); const id = control && control.getAttribute("aria-describedby"); return id ? all(root, ".field-error").find((node) => node.getAttribute("id") === id).textContent : null; };

{
  const { calls, failure } = await liveLoad(TICKETS);
  assert.equal(failure, null);
  assert.ok(calls.includes("/core-svc/api/tagged/task/list.json") && calls.includes("form-type CUSTOMER_SUPPORT_TICKET"));
  assert.deepEqual(navLabels(), ["Home", "Visits", "Orders", "Contracts", "Invoices", "Support"], "Support is in the nav once its module is open");

  const home = Overview();
  const card = one(home, "[data-module=\"support-requests\"]");
  assert.ok(card, "the home shows the Support requests card");
  assert.match(card.textContent, /2open requests/);
  assert.deepEqual(all(card, "[data-module=\"support-row\"]").map((row) => row.textContent), ["Driveway was not clearedOpen · Nov 12, 2026›", "Question about my invoiceIn review · Nov 11, 2026›"]);
  const rows = Object.fromEntries(all(home, "[data-module=\"property-row\"]").map((row) => [row.getAttribute("data-id"), row.getAttribute("data-state")]));
  assert.deepEqual(rows, { "prop-core-983": "issue", "prop-core-1033": "issue" }, "a property an open ticket names is marked");
  assert.match(one(home, "[data-module=\"property-row\"]").textContent, /Issue Opened/);

  const visits = page("appointments");
  const issues = Object.fromEntries(all(visits, "[data-module=\"visit-row\"]").map((row) => [row.getAttribute("data-id"), all(row, "[data-module=\"visit-issue\"]").map((node) => node.textContent)]));
  assert.deepEqual(issues, { "visit-core-79": ["Issue Opened"], "visit-core-81": [], "visit-core-77": [] }, "only the visit an open ticket names carries the chip; a resolved ticket leaves none");
  const detail = page("visit.detail", { visitId: "visit-core-79" });
  assert.equal(all(detail, "[data-module=\"visit-issue\"]").length, 1);
  const entry = one(detail, "[data-visual-id=\"visit-open-ticket\"]");
  assert.deepEqual([entry.textContent, entry.getAttribute("data-action"), entry.getAttribute("data-id")], ["Open support ticket", "support.newTicket", "983:79"], "a visit opens a ticket about itself and its property");
  state.propertyId = "prop-core-1033";
  const propertyEntry = one(PropertyDetail(), "[data-visual-id=\"property-open-ticket\"]");
  assert.deepEqual([propertyEntry.getAttribute("data-action"), propertyEntry.getAttribute("data-id")], ["support.newTicket", "1033:"]);
  assert.match(one(PropertyDetail(), ".prop-head").textContent, /Issue Opened/);

  const support = page("support");
  assert.equal(support.getAttribute("data-state"), "ready");
  assert.equal(one(support, "[data-visual-id=\"support-new-ticket\"]").textContent, "Open support ticket");
  await settle();
  const list = page("support");
  assert.deepEqual(all(one(list, "[data-module=\"tickets-open\"]"), "[data-module=\"ticket-row\"]").map((row) => row.getAttribute("data-id")), ["ticket-core-75", "ticket-core-76"]);
  assert.deepEqual(all(one(list, "[data-module=\"tickets-closed\"]"), "[data-module=\"ticket-row\"]").map((row) => row.getAttribute("data-id")), ["ticket-core-74", "ticket-core-73"]);
  const first = one(list, "[data-module=\"ticket-row\"]");
  assert.equal(one(first, "[data-module=\"ticket-meta\"]").textContent, "TICKET-775 · Missed service · Opened Nov 12, 2026", "the reason reads as the form type names it");
  assert.equal(one(first, "[data-module=\"ticket-about\"]").textContent, "12 Frost Lane, Surrey, BC V3W 1J8, Canada · Visit Sat, Oct 31, 6:30 – 7:30 AM");
  assert.equal(one(first, ".status-badge").textContent, "Open");
  assert.match(first.textContent, /The crew skipped the driveway/);
}

{
  await liveLoad([TICKETS[2], TICKETS[3]]);
  const home = Overview();
  assert.match(one(home, "[data-module=\"support-requests\"]").textContent, /No open requests/);
  assert.equal(all(home, "[data-module=\"property-row\"]").some((row) => row.getAttribute("data-state") === "issue"), false, "resolved and closed tickets mark no property");

  await liveLoad([]);
  const empty = page("support");
  assert.equal(empty.getAttribute("data-state"), "empty");
  assert.equal(one(empty, ".state-block__title").textContent, "No support tickets yet");
  assert.equal(all(empty, "[data-visual-id=\"support-new-ticket\"]").length, 1, "an empty list still offers a ticket");

  await liveLoad("fail");
  assert.equal(page("support").getAttribute("data-state"), "error");
  assert.equal(all(Overview(), "[data-module=\"support-requests\"]").length, 0, "the home shows no support card it cannot back");

  await liveLoad(TICKETS, "overview,properties,appointmentsTimeline,invoices,proposals");
  assert.deepEqual(navLabels(), ["Home", "Visits", "Orders", "Contracts", "Invoices"], "without the module there is no Support item");
  assert.equal(all(Overview(), "[data-module=\"support-requests\"]").length, 0);
  assert.equal(all(page("visit.detail", { visitId: "visit-core-79" }), "[data-visual-id=\"visit-open-ticket\"]").length, 0);
}

{
  await liveLoad(TICKETS);
  assert.equal(startSupportTicket("983", "79"), true);
  assert.deepEqual(supportTicketState().draft, { propertyId: 983, visitId: 79, reason: "", subject: "", message: "" }, "a ticket opened from a visit names the visit and its property");
  await settle();
  let form = page("support.new");
  assert.deepEqual(all(form, "select").map((select) => select.getAttribute("name")), ["PROPERTY_ID", "VISIT_ID", "CONTACT_REASON"]);
  assert.deepEqual(all(one(form, "[name=\"VISIT_ID\"]"), "option").map((option) => option.textContent), ["Not about one visit", "Sat, Oct 31, 6:30 – 7:30 AM · Scheduled", "Sun, Oct 25, 6:45 – 7:35 AM · Completed"], "only the visits of the chosen property are offered");
  assert.deepEqual(all(one(form, "[name=\"CONTACT_REASON\"]"), "option").map((option) => option.textContent), ["General question", "Missed service", "Billing inquiry"]);

  changeSupportTicketDraft("propertyId", "1033");
  assert.deepEqual([supportTicketState().draft.propertyId, supportTicketState().draft.visitId], [1033, null], "another property drops the visit of the first");
  assert.equal(changeSupportTicketDraft("visitId", "79"), true);
  assert.equal(supportTicketState().draft.visitId, null, "a visit of another property is not accepted");
  changeSupportTicketDraft("propertyId", "983");
  changeSupportTicketDraft("visitId", "79");
  changeSupportTicketDraft("reason", "MISSED_SERVICE");
  for (const action of ["support.newTicket", "support.chooseProperty", "support.chooseVisit", "support.chooseReason", "support.submitTicket", "support.checkTicket", "setPassword.submit"]) assert.equal(typeof ACTIONS[action], "function", action + " is connected");

  assert.deepEqual(validateSupportTicket(supportTicketState().draft), { SUBJECT: SUPPORT_TICKET_COPY.subjectMissing, MESSAGE: SUPPORT_TICKET_COPY.messageMissing });
  await submitSupportTicket({ forms: { submit() { throw new Error("an invalid draft must not be sent"); } } });
  form = page("support.new");
  assert.deepEqual([fieldError(form, "SUBJECT"), fieldError(form, "MESSAGE")], ["Add a short subject.", "Tell us what happened."], "each missing field says so beside itself");

  changeSupportTicketDraft("subject", " Driveway was not cleared ");
  changeSupportTicketDraft("message", "The crew skipped the driveway on the last visit.");
  assert.deepEqual(supportTicketValues(supportTicketState().draft), { PROPERTY_ID: 983, SUBJECT: "Driveway was not cleared", MESSAGE: "The crew skipped the driveway on the last visit.", VISIT_ID: 79, CONTACT_REASON: "MISSED_SERVICE" });

  const sent = [];
  const forms = createCoreProfileFormAdapter({
    wait: async () => {},
    fetch: async (url, options) => {
      const target = new URL(String(url)).pathname;
      sent.push({ target, options });
      if (target === "/en/core-cms/api/form-type/CUSTOMER_SUPPORT_TICKET/get.json") return json(FORM_TYPE);
      if (target === "/core-cms/api/form/submit.json") return json(727);
      if (target === "/core/api/user/preferences.json") return json({ SNOW_CUSTOMER_SUPPORT_TICKET: JSON.stringify({ form: 727, outcome: "REFUSED", field: "VISIT_ID", message: "This visit is not at the chosen property.", ticketId: null, ticketCode: null }) });
      throw new Error("unexpected request " + target);
    },
  });
  const phases = [];
  assert.equal(await submitSupportTicket({ forms, onChange: (phase) => phases.push(phase) }), false);
  assert.deepEqual(phases, ["sending", "waiting", "refused"]);
  const body = JSON.parse(sent.find((call) => call.target === "/core-cms/api/form/submit.json").options.body);
  assert.deepEqual([body.type, body.organization, body.attributes], [{ id: 15 }, { id: 43 }, { 15: { PROPERTY_ID: { value: 983 }, SUBJECT: { value: "Driveway was not cleared" }, MESSAGE: { value: "The crew skipped the driveway on the last visit." }, VISIT_ID: { value: 79 }, CONTACT_REASON: { value: "MISSED_SERVICE" } } }], "the form is the documented one");
  assert.deepEqual(SUPPORT_TICKET_FORM, { typeCode: "CUSTOMER_SUPPORT_TICKET", preference: "SNOW_CUSTOMER_SUPPORT_TICKET" });
  form = page("support.new");
  assert.equal(form.getAttribute("data-state"), "editing");
  assert.equal(fieldError(form, "VISIT_ID"), "This visit is not at the chosen property.", "a refusal shows beside the field Core names, in Core's words");
  assert.equal(one(form, "[name=\"SUBJECT\"]").getAttribute("value"), " Driveway was not cleared ", "a refusal keeps what the client typed");

  const outcome = (report) => ({ submit: async () => 728, report: async () => Object.assign({ form: 728 }, report) });
  await submitSupportTicket({ forms: outcome({ outcome: "REFUSED", field: null, message: "Sign in to open a ticket." }) });
  assert.equal(one(page("support.new"), "[data-module=\"support-ticket-message\"]").textContent, "!Sign in to open a ticket.", "a refusal without a field shows above the button");
  await submitSupportTicket({ forms: outcome({ outcome: "FAILED", field: null, message: "internal" }) });
  assert.equal(one(page("support.new"), "[data-module=\"support-ticket-message\"]").textContent, "!" + SUPPORT_TICKET_COPY.failed);

  const refusedBy = (status) => ({ submit: async () => { const error = new Error("HTTP " + status); error.code = "profile-submit-failed"; error.status = status; throw error; } });
  await submitSupportTicket({ forms: refusedBy(500) });
  assert.equal(one(page("support.new"), "[data-module=\"support-ticket-message\"]").textContent, "!" + SUPPORT_TICKET_COPY.serverError, "a 500 from the form endpoint is named as a system error, never left blank");
  assert.match(SUPPORT_TICKET_COPY.serverError, /our system answered with an error/);
  await submitSupportTicket({ forms: { submit: async () => { throw new TypeError("Failed to fetch"); } } });
  assert.equal(one(page("support.new"), "[data-module=\"support-ticket-message\"]").textContent, "!" + SUPPORT_TICKET_COPY.notSent);

  const reloaded = [];
  assert.equal(await submitSupportTicket({ forms: outcome({ outcome: "CREATED", field: null, message: "Thank you. We received your ticket and will get back to you.", ticketId: 75, ticketCode: "TICKET-728" }), reload: (id) => reloaded.push(id) }), true);
  await settle();
  assert.deepEqual(reloaded, ["support"], "a created ticket re-reads the list");
  const done = page("support.new");
  assert.equal(done.getAttribute("data-state"), "created");
  assert.equal(one(done, ".state-block__title").textContent, "Ticket TICKET-728 is open");
  assert.match(done.textContent, /Thank you\. We received your ticket/);
  assert.equal(await submitSupportTicket({ forms: { submit() { throw new Error("a created ticket must not be sent twice"); } } }), false);

  assert.equal(startSupportTicket("", ""), true);
  assert.deepEqual(supportTicketState().draft, { propertyId: null, visitId: null, reason: "", subject: "", message: "" }, "with several properties none is chosen for the client");
  assert.deepEqual(supportTicketSchema(FORM_TYPE).reasons.map((reason) => reason.value), ["MISSED_SERVICE", "BILLING_INQUIRY", "GENERAL_INQUIRY"]);
}

{
  configure("overview,properties,appointmentsTimeline,invoices,proposals,support", { portalProviderName: "Limitless Snow Removal Corp.", portalBrandLogoId: "3fecdfcd-2c9e-49c2-8873-92e4378930fc" });
  Object.assign(state.session, { authenticated: false, accessToken: "", userId: null });
  state.account = "session-required";
  assert.deepEqual([routeRegistry["auth.setPassword"].path, isPublic("auth.setPassword"), isSessionFree("auth.setPassword")], ["/set-password", true, true]);
  globalThis.location.hash = "#/set-password?login=client%2Bone%40example.invalid&key=0123456789abcdef0123456789abcdef";
  assert.equal(routeFromLocation(), "auth.setPassword");
  assert.equal(resolveRoute("auth.setPassword").id, "auth.setPassword", "the page needs no session");
  assert.deepEqual([state.setPassword.login, state.setPassword.key, state.setPassword.phase], ["client+one@example.invalid", "0123456789abcdef0123456789abcdef", "prompt"]);

  let card = page("auth.setPassword");
  assert.equal(card.getAttribute("data-state"), "prompt");
  assert.deepEqual(all(card, "input").map((input) => [input.getAttribute("name"), input.getAttribute("type"), input.getAttribute("autocomplete")]), [["username", "email", "username"], ["new-password", "password", "new-password"], ["confirm-password", "password", "new-password"]], "the browser can keep the sign-in email with the new password");
  assert.equal(one(card, "[name=\"username\"]").getAttribute("value"), "client+one@example.invalid");
  assert.match(card.textContent, /At least 6 characters\./);
  assert.equal(PASSWORD_MIN_LENGTH, 6);

  const brand = one(PublicNav(), ".top-nav__brand");
  assert.deepEqual([one(brand, ".brand-name").textContent, one(brand, "img").getAttribute("src")], ["Limitless Snow Removal Corp.", "/core/image/3fecdfcd-2c9e-49c2-8873-92e4378930fc/get"], "a page without a session shows the name and logo the server put on the root element");

  assert.deepEqual(validateSetPassword({ password: "", confirm: "" }), { password: SET_PASSWORD_COPY.missing });
  assert.deepEqual(validateSetPassword({ password: "abcde", confirm: "abcde" }), { password: SET_PASSWORD_COPY.short });
  assert.deepEqual(validateSetPassword({ password: "abcdef", confirm: "abcdeg" }), { confirm: SET_PASSWORD_COPY.mismatch });
  assert.deepEqual(validateSetPassword({ password: "abcdef", confirm: "abcdef" }), {});

  const posts = [];
  const answer = (status, body) => async (url, options) => { posts.push({ url, options }); return { ok: status === 200, status, json: async () => { if (body === undefined) throw new Error("empty body"); return body; } }; };
  changeSetPasswordEntry("password", "abc");
  changeSetPasswordEntry("confirm", "abc");
  assert.equal(await submitSetPassword({ fetch: answer(200) }), false);
  assert.equal(posts.length, 0, "a password Core would refuse is not sent");
  assert.match(page("auth.setPassword").textContent, /Use at least 6 characters\./);

  changeSetPasswordEntry("password", "correct horse");
  changeSetPasswordEntry("confirm", "correct horse");
  assert.equal(await submitSetPassword({ fetch: answer(500, { message: "Password must be at least 6 characters long", status: 500 }) }), false);
  assert.deepEqual([posts[0].url, posts[0].options.method, posts[0].options.credentials, JSON.parse(posts[0].options.body)], ["/core/api/user/reset-password.json", "POST", "omit", { user: "client+one@example.invalid", key: "0123456789abcdef0123456789abcdef", password: "correct horse" }]);
  assert.equal(posts[0].options.headers.Authorization, undefined, "the request carries no session");
  card = page("auth.setPassword");
  assert.deepEqual([card.getAttribute("data-state"), one(card, ".field-error").textContent], ["prompt", "Password must be at least 6 characters long"], "a rule Core enforces shows beside the password, in Core's words");

  assert.equal(await submitSetPassword({ fetch: async () => { throw new TypeError("Failed to fetch"); } }), false);
  assert.equal(one(page("auth.setPassword"), "[data-module=\"set-password-message\"]").textContent, "!" + SET_PASSWORD_COPY.unreachable);
  assert.equal(state.setPassword.key.length, 32, "a failed request keeps the link usable");

  assert.equal(await submitSetPassword({ fetch: answer(200) }), true);
  card = page("auth.setPassword");
  assert.equal(card.getAttribute("data-state"), "done");
  assert.equal(one(card, "[data-module=\"set-password-login\"]").textContent, "client+one@example.invalid");
  assert.deepEqual([one(card, "[data-visual-id=\"set-password-sign-in\"]").textContent, one(card, "[data-visual-id=\"set-password-sign-in\"]").getAttribute("data-action")], ["Sign in", "auth.gotoSignin"]);
  assert.equal(state.setPassword.key, "", "a used key is forgotten");
  assert.equal(JSON.stringify(state).includes("correct horse"), false, "the password never enters the portal state");

  state.setPassword = null;
  captureSetPassword("auth.setPassword", "/set-password?login=client%2Bone%40example.invalid&key=0123456789abcdef0123456789abcdef");
  changeSetPasswordEntry("password", "correct horse");
  changeSetPasswordEntry("confirm", "correct horse");
  assert.equal(await submitSetPassword({ fetch: answer(500, { message: "Invalid credentials specified", status: 500 }) }), false);
  card = page("auth.setPassword");
  assert.deepEqual([card.getAttribute("data-state"), one(card, ".oidc-title").textContent], ["expired", "This link has expired"]);
  assert.match(card.textContent, /contact Limitless Snow Removal Corp\. and ask for a new link/);
  assert.equal(all(card, "input").length, 0);

  state.setPassword = null;
  captureSetPassword("auth.setPassword", "/set-password?login=client%2Bone%40example.invalid");
  assert.equal(page("auth.setPassword").getAttribute("data-state"), "invalid", "a link without its key asks for nothing");
  assert.equal(one(page("auth.setPassword"), ".oidc-title").textContent, "This link is incomplete");
}

console.log("snow-support-tickets-check ok: tagged ticket read with the documented body, the five states as Open, In review, Resolved and Closed, the Support page and nav item, the home Support requests card, Issue Opened on the property and visit an open ticket names, a ticket form prefilled from a visit or property that sends the documented form, refusals beside their fields, a 500 named as a system error, and a session-free set-password page with Core's length rule, the used-key state and the server-rendered provider name and logo");

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
