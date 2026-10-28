import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const ORIGIN = "https://portal.example.test";
const ACCOUNT = 732;
const USER = 55;
const ORGANIZATION = 43;

const dom = createDom();
const windowListeners = {};
const assigned = [];
globalThis.window = globalThis;
globalThis.document = dom.document;
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
globalThis.getComputedStyle = () => ({ display: "flex", getPropertyValue: () => "" });
globalThis.addEventListener = (type, listener) => { windowListeners[type] = listener; };
globalThis.location = {
  href: ORIGIN + "/pages/SNOWLIMITLESS/portal", origin: ORIGIN, pathname: "/pages/SNOWLIMITLESS/portal", search: "", hash: "",
  assign(url) { assigned.push(url); },
  replace(url) { assigned.push(url); },
  reload() {},
};
globalThis.history = {
  pushState(_, __, url) { globalThis.location.hash = url; },
  replaceState(_, __, url) { globalThis.location.hash = url; },
};
const warnings = [];
console.warn = (...parts) => { warnings.push(parts.map(String).join(" ")); };

const runtimeRoot = pathToFileURL(path.resolve("app-templates/customer-portal/runtime") + "/");
const load = (file) => import(new URL(file, runtimeRoot));
const { readPortalConfig, routeRegistry } = await load("src/config.js");
const { applyPortalConfig, state } = await load("src/state.js");
const { isRouteReachable, resolveRoute } = await load("src/router.js");
const { TopNav } = await load("src/components/shell/TopNav.js");
const { QUOTE_STATUS } = await load("src/components/proposals/QuotePackage.js");
const { AGREEMENT_STAGES, CLIENT_TYPES, CONTRACT_CLIENT_TYPES, normalizeContracts, normalizeQuoteOrders, normalizeServiceAgreement } = await load("src/normalizers/contracts.js");
const { CONTRACT_EVENTS, createContractCommands } = await load("src/contract-commands.js");
const { QUOTE_REQUEST_COPY, QUOTE_REQUEST_OUTCOME_TIMEOUT_MS, acceptQuoteAddress, addTypedQuoteAddress, changeQuoteRequestDraft, quoteRequestSchema, quoteRequestState, quoteRequestValues, resetQuoteRequest, submitQuoteRequest, toggleQuoteProperty, validateQuoteRequest } = await load("src/quote-request.js");
const { CONTRACT_DETAILS_FIELDS, contractDetailsRequest } = await load("src/contract-details.js");
const { contractDetailsPrefill } = await load("src/normalizers/account-profile.js");
const { coreAccountProfileContract } = await load("src/adapters/core-account-profile-adapter.js");

const all = (root, selector) => root.querySelectorAll(selector);
const one = (root, selector) => root.querySelector(selector);
const texts = (root, selector) => all(root, selector).map((node) => node.textContent);
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const plain = (value) => JSON.parse(JSON.stringify(value));

const FORM_TYPE = {
  id: 11,
  code: "PORTAL_QUOTE_REQUEST",
  nls: { en: { NAME: "Portal Quote Request" } },
  parents: [],
  attributes: [
    { code: "PROPERTY_IDS", className: "java.lang.String", multiselect: true, nls: { en: { NAME: "Properties" } }, options: [] },
    { code: "RISK_FACTORS", className: "java.lang.String", inputFormat: "expanded", multiselect: true, nls: { en: { NAME: "Winter risk factors" }, ru: { NAME: "Факторы риска" } }, options: [
      { value: "SLOPED_DRIVEWAYS", nls: { en: { NAME: "Sloped Driveways or Internal Roads" } } },
      { value: "STAIR_HEAVY_ACCESS", nls: { en: { NAME: "Stair-Heavy Access" } } },
      { value: "DRAINAGE_WATER_FLOW_ISSUES", nls: { en: { NAME: "Drainage / Water Flow Issues" } } },
      { value: "PARKADE_RAMPS", nls: { en: { NAME: "Parkade Ramps" } } },
      { value: "SENIOR_RESIDENCE", nls: { en: { NAME: "Senior Residence" } } },
      { value: "LOADING_ZONES", nls: { en: { NAME: "Loading Zones" } } },
    ] },
    { code: "PROPERTY_ADDRESSES", className: "java.lang.String", inputFormat: "address within:49,-123.33,49.42,-121.77", multiselect: true, nls: { en: { NAME: "Property Addresses" } }, options: [] },
    { code: "ADDITIONAL_NOTES", className: "java.lang.String", inputFormat: "textarea rows:5", nls: { en: { NAME: "Additional Notes" } }, options: [] },
    { code: "PROPERTY_COORDINATES", className: "java.lang.String", inputFormat: "coordinates-of:PROPERTY_ADDRESSES", nls: { en: { NAME: "Property coordinates" } }, options: [] },
  ],
};

const DOCUMENTED_ADDRESS = "1055 Canada Pl, Vancouver, BC V6C 0C3, Canada";
const DOCUMENTED_BODY = {
  type: { id: 11 },
  organization: { id: 43 },
  attributes: {
    11: {
      PROPERTY_IDS: { value: ["983"] },
      PROPERTY_ADDRESSES: { value: [DOCUMENTED_ADDRESS] },
      PROPERTY_COORDINATES: { value: "[{\"address\":\"1055 Canada Pl, Vancouver, BC V6C 0C3, Canada\",\"lat\":49.2888,\"lng\":-123.1111}]" },
      RISK_FACTORS: { value: ["PARKADE_RAMPS"] },
      ADDITIONAL_NOTES: { value: "Gate code at the loading bay" },
    },
  },
  metadata: { language: "en" },
};

function property(id, name, addressId, area) {
  return {
    id, code: "WINTER_QUOTE_PROPERTY-" + id,
    nls: { en: { NAME: name } },
    type: { id: 41, code: "SNOW_REMOVAL_PROPERTY" },
    states: [{ id: 1, code: "INITIAL" }],
    attributes: { 41: { ACCOUNT: { value: ACCOUNT }, ADDRESS: { value: addressId }, SERVICE_AREA_SQFT: { value: area } } },
  };
}

function order(id, stateCode, propertyId, model, total) {
  return {
    id,
    account: { id: ACCOUNT },
    type: { id: 6, code: "WINTER_SERVICES_ORDER" },
    currency: { id: 21, code: "CAD" },
    totalCharges: total, totalTaxes: 0, grandTotal: total,
    states: [{ id: 200 + id, code: stateCode }],
    attributes: { 5: { SERVICE_PROPERTY: { value: propertyId }, PRICING_MODEL: { value: model } } },
    items: [],
  };
}

function agreement(id, stateCode, orders, attributes = {}) {
  return {
    id,
    type: { id: 17, code: "SERVICE_AGREEMENT" },
    organization: { id: ORGANIZATION, code: "SNOWLIMITLESS", nls: { en: { NAME: "Limitless Snow Removal" } } },
    states: [{ id: 300 + id, code: stateCode }],
    attributes: { 17: Object.assign({ CLIENT: { value: ACCOUNT }, ORDERS: { value: orders } }, attributes) },
  };
}

function accountRow() {
  return {
    id: ACCOUNT,
    nls: { en: { NAME: "Harbour View Strata" } },
    user: { id: USER },
    attributes: { 35: { LEGAL_ENTITY_TYPE: { value: null } } },
    contacts: [
      { id: 12, firstName: "Sam", lastName: "Other", title: "Accountant", type: { id: 2, code: "BILLING" }, contactEntries: [{ id: 30, value: "sam@example.test", type: { id: 1, code: "EMAIL" } }] },
      { id: 11, firstName: "Avery", lastName: "Flow", title: "Strata President", type: { id: 1, code: "LEGAL" }, contactEntries: [
        { id: 22, value: "avery.second@example.test", type: { id: 1, code: "EMAIL" } },
        { id: 21, value: "avery@example.test", type: { id: 1, code: "EMAIL" } },
        { id: 23, value: "+16045550100", type: { id: 2, code: "PHONE" } },
      ] },
    ],
    addresses: [
      { id: 902, types: [{ id: 1, code: "BILLING" }], address: { id: 702, address1: "1 Later Billing Road, Vancouver" } },
      { id: 901, types: [{ id: 1, code: "BILLING" }, { id: 2, code: "LEGAL" }], address: { id: 701, address1: "100 Harbour Way, Vancouver, BC V6B 1A1" } },
      { id: 903, types: [{ id: 3, code: "SERVICE" }], address: { id: 703, address1: "999 Canada Pl", city: "Vancouver", postalCode: "V6C 3E1", state: { id: 2, code: "BC" } } },
    ],
  };
}

function coreTable() {
  return {
    properties: [property(983, "Harbour View Tower", 703, 75000), property(984, "Coal Harbour Lot", 704, 12000)],
    account: accountRow(),
    agreements: [
      agreement(5601, "QUOTATION_SENT", [4101, 4102, 4103]),
      agreement(5602, "SENT_TO_CLIENT", [4001], { LEGAL_NAME: { value: "Harbour View Strata" }, CLIENT_TYPE: { value: "ORGANIZATION" } }),
      agreement(5603, "AWAITING_CLIENT_DETAILS", [4201], { CLIENT_TYPE: { value: "ORGANIZATION" } }),
    ],
    orders: [
      order(4001, "CLIENT_APPROVED", 983, "SEASONAL", 26751.6),
      order(4101, "QUOTE_VIEWED", 984, "PER_SERVICE", 992.99),
      order(4102, "QUOTE_VIEWED", 984, "MONTHLY", 3376.64),
      order(4103, "QUOTE_VIEWED", 984, "SEASONAL", 32156.25),
      order(4201, "CLIENT_APPROVED", 983, "MONTHLY", 6687.9),
    ],
    preferences: {},
    submissions: [],
    events: [],
    reads: [],
    afterDetails: "PENDING_MANAGEMENT_APPROVAL",
    fail: {},
  };
}

let table = coreTable();

function json(value) {
  return { ok: true, status: 200, async json() { return structuredClone(value); } };
}

async function coreFetch(url, options = {}) {
  const target = new URL(url, ORIGIN);
  const route = target.pathname;
  const body = options.body ? JSON.parse(options.body) : null;
  table.reads.push({ route, method: options.method || "GET", headers: options.headers || {} });
  const failure = Object.keys(table.fail).find((fragment) => url.includes(fragment));
  if (failure) return { ok: false, status: table.fail[failure], async json() { return {}; } };
  const filter = (name) => ((body && body.filters) || []).find((entry) => entry.property === name);
  if (route === "/en/core-cms/api/form-type/PORTAL_QUOTE_REQUEST/get.json") return json(FORM_TYPE);
  if (route === "/core-cms/api/form/submit.json") {
    table.submissions.push({ body, headers: options.headers });
    return json(912);
  }
  if (route === "/core/api/user/preferences.json") return json(typeof table.preferences === "function" ? table.preferences() : table.preferences);
  if (route === "/core-rm/api/tagged/resource/list.json") return json({ resultSize: table.properties.length, result: table.properties });
  if (route === "/core-acct/api/tagged/account/get.json") return json(table.account);
  if (route === "/core-acct/api/tagged/account/list.json") {
    table.accountMappings = body.mappings;
    return json({ resultSize: 1, result: [table.account] });
  }
  if (route === "/core/api/document-type/list.json") return json({ resultSize: 1, result: [{ id: 17, code: "SERVICE_AGREEMENT" }] });
  if (route === "/core/api/tagged/document/list.json") {
    const client = filter("attributes.17.CLIENT.value").value;
    return json({ resultSize: table.agreements.length, result: table.agreements.filter((row) => String(row.attributes[17].CLIENT.value) === client) });
  }
  if (route === "/core-bill/api/tagged/order/list.json") return json({ resultSize: table.orders.length, result: table.orders });
  if (route === "/core-bill/api/tagged/order-item/list.json") return json({ resultSize: 0, result: [] });
  if (route === "/core-bill/api/tagged/order/get.json") {
    const row = table.orders.find((candidate) => candidate.id === Number(target.searchParams.get("id")));
    return row ? json(row) : { ok: false, status: 404, async json() { throw new Error("empty"); } };
  }
  if (route === "/core/api/tagged/document/get.json") {
    const row = table.agreements.find((candidate) => candidate.id === Number(target.searchParams.get("id")));
    if (row && row.states[0].code === "CLIENT_DETAILS_RECEIVED") {
      const answer = structuredClone(row);
      row.states = [{ id: row.states[0].id + 1, code: table.afterDetails }];
      if (table.afterDetails === "AWAITING_CLIENT_DETAILS") row.attributes[17].CLIENT_DETAILS_ERRORS = { value: table.returnedErrors };
      return json(answer);
    }
    return row ? json(row) : { ok: false, status: 404, async json() { throw new Error("empty"); } };
  }
  const event = /^\/(core-bill|core)\/api\/tagged\/(order|document)\/(\d+)\/send-event\.json$/.exec(route);
  if (event) {
    table.events.push({ entity: event[2], id: Number(event[3]), code: target.searchParams.get("event"), body });
    const [source, next] = target.searchParams.get("event").split("-");
    const rows = event[2] === "order" ? table.orders : table.agreements;
    const row = rows.find((candidate) => candidate.id === Number(event[3]));
    if (row && row.states[0].code === source) row.states = [{ id: row.states[0].id + 1000, code: next }];
    if (row && next === "CLIENT_APPROVED" && event[2] === "order") {
      table.orders.forEach((other) => {
        const same = other.attributes[5].SERVICE_PROPERTY.value === row.attributes[5].SERVICE_PROPERTY.value;
        if (other !== row && same && other.states[0].code === "QUOTE_VIEWED") other.states = [{ id: other.states[0].id + 1000, code: "DECLINED" }];
      });
    }
    return { ok: true, status: 200, async json() { throw new Error("empty body"); } };
  }
  throw new Error("unexpected request " + url);
}
globalThis.fetch = coreFetch;

const mount = dom.document.createElement("div");
mount.setAttribute("id", "app");
mount.dataset = { portalVertical: "snow", portalProfile: "stormRetail", portalTheme: "snow", portalDataMode: "fixture", portalAuthMode: "fixture", portalCase: "granite-ridge-snow", portalDefaultRoute: "overview" };
dom.document.body.appendChild(mount);
await load("src/app.js");
dom.fire("DOMContentLoaded");
await settle();
const portal = globalThis.AircovePortal;
const { ACTIONS } = await load("src/actions.js");

const LIVE = {
  portalVertical: "snow", portalProfile: "stormRetail", portalTheme: "snow", portalDataMode: "live", portalAuthMode: "required",
  portalOrganization: "SNOWLIMITLESS", portalAccountTypeCode: "CUSTOMER", portalDefaultRoute: "overview",
  portalEnabledModules: "overview,properties,proposals,profile", portalRequestFormUrl: "https://dev-1.example.test/pages/SNOWLIMITLESS/request-quote",
  portalAllowedNavOrigins: "https://dev-1.example.test",
};

async function goLive(extra = {}) {
  table = coreTable();
  applyPortalConfig(readPortalConfig({ dataset: Object.assign({}, LIVE, extra) }));
  state.config.origin = ORIGIN;
  Object.assign(state.session, { authenticated: true, accessToken: "test-token", tokenType: "Bearer", userId: USER, organizationId: ORGANIZATION, login: "avery@example.test" });
  state.customerAccount = { id: ACCOUNT, displayName: "Harbour View Strata" };
  state.session.account = state.customerAccount;
  state.account = "ready";
  state.oidc = "ready-signed-in";
  for (const id of ["properties", "proposals", "profile"]) {
    delete state.moduleData[id];
    delete state.moduleStatus[id];
  }
  await portal.runtime().reloadAsync("properties");
  if (state.config.enabledModules.includes("proposals")) await portal.runtime().reloadAsync("proposals");
}

async function until(condition) {
  for (let turn = 0; turn < 50 && !condition(); turn += 1) await settle();
  return condition();
}

function page() {
  return one(mount, "[data-route]");
}

function fire(node, type, extra = {}) {
  (node.listeners[type] || []).forEach((listener) => listener(Object.assign({ type, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; } }, extra)));
}

{
  await goLive();
  assert.equal(routeRegistry["quote.new"].path, "/quote/new");
  assert.equal(isRouteReachable("quote.new"), true, "a live portal with Contracts reaches the in-portal request page");
  const nav = TopNav(false);
  const cta = one(nav, "[data-visual-id=\"primary-cta\"]");
  assert.equal(cta.textContent, "Request a quote");
  ACTIONS[cta.getAttribute("data-action")]();
  assert.equal(state.route, "quote.new", "the header button opens the in-portal page");
  assert.equal(globalThis.location.hash, "#/quote/new");
  assert.deepEqual(assigned, [], "the public form is not opened");
  assert.equal(page().getAttribute("data-route"), "quote.new");

  await goLive({ portalRequestFormUrl: "" });
  assert.equal(one(TopNav(false), "[data-visual-id=\"primary-cta\"]").textContent, "Request a quote", "the button needs no public form address once the portal has its own page");

  await goLive({ portalEnabledModules: "overview,properties,profile" });
  assert.equal(isRouteReachable("quote.new"), false, "without Contracts there is nowhere for the quotes to arrive");
  ACTIONS["service.requestForm"]();
  assert.deepEqual(assigned, ["https://dev-1.example.test/pages/SNOWLIMITLESS/request-quote"], "without the in-portal page the button keeps the public form");
  assigned.length = 0;

  applyPortalConfig(readPortalConfig({ dataset: mount.dataset }));
  assert.equal(isRouteReachable("quote.new"), false, "a fixture portal never reaches the live request page");
  assert.deepEqual(resolveRoute("quote.new"), { id: "overview", reason: "live-only" });
}

{
  await goLive();
  resetQuoteRequest();
  state.quoteRequestSchema = null;
  portal.go("quote.new");
  assert.equal(one(page(), "[data-module=\"quote-request-loading\"]").getAttribute("aria-busy"), "true", "the page waits for the form type it submits");
  await settle();
  await settle();
  const view = page();
  assert.equal(view.getAttribute("data-state"), "editing");
  assert.equal(one(view, "h1").textContent, "Request a quote");
  const cards = all(view, "[data-module=\"quote-request-property\"]");
  assert.deepEqual(cards.map((card) => [card.getAttribute("data-id"), card.getAttribute("role"), card.getAttribute("aria-checked")]), [["983", "checkbox", "false"], ["984", "checkbox", "false"]], "every property of the client is a selectable card");
  assert.deepEqual(cards.map((card) => texts(card, ".quote-request__property-name").concat(texts(card, ".quote-request__property-meta"))), [
    ["Harbour View Tower", "999 Canada Pl, Vancouver, BC V6C 3E1 · 75,000 ft²"],
    ["Coal Harbour Lot", "12,000 ft²"],
  ], "a card shows the address and area it has, and nothing for what it lacks");
  assert.equal(one(view, "label[for=\"quote-request-address\"]").textContent, "Add another address");
  assert.deepEqual(texts(view, ".choice-chip__label"), ["Sloped Driveways or Internal Roads", "Stair-Heavy Access", "Drainage / Water Flow Issues", "Parkade Ramps", "Senior Residence", "Loading Zones"], "the risk factors are the form type's own options and labels");
  assert.equal(one(view, "[data-module=\"quote-request-risks\"] legend").textContent, "Winter risk factors");
  assert.equal(one(view, "label[for=\"quote-request-notes\"]").textContent, "Additional Notes (optional)");
  assert.equal(one(view, "#quote-request-notes").getAttribute("rows"), "5", "the notes field keeps the textarea rows of the form type");
  assert.equal(all(view, "input[type=\"email\"]").length + all(view, "input[type=\"tel\"]").length, 0, "the request asks for no contact field");
  assert.equal(all(view, "[data-module=\"quote-request-map\"]").length, 0, "no map until something is chosen");
  assert.deepEqual(plain(quoteRequestSchema(FORM_TYPE).within), { south: 49, west: -123.33, north: 49.42, east: -121.77 }, "new addresses are bounded by the within box of PROPERTY_ADDRESSES, as on the public form");

  ACTIONS["quoteRequest.toggleProperty"]("983");
  assert.equal(one(page(), "[data-id=\"983\"][data-module=\"quote-request-property\"]").getAttribute("aria-checked"), "true");
  assert.equal(one(page(), ".quote-request__summary").textContent, "1 property");
  assert.equal(toggleQuoteProperty(5555), false, "a property that is not the client's cannot be chosen");

  assert.equal(acceptQuoteAddress("Pike Place Market, Seattle, WA", { lat: 47.6097, lon: -122.3422 }), false);
  portal.go("quote.new");
  assert.equal(one(page(), "#quote-request-address-error").textContent, QUOTE_REQUEST_COPY.addressOutside, "an address outside the service area is refused next to the address input");
  assert.equal(one(page(), "#quote-request-address").getAttribute("aria-invalid"), "true");

  const finder = { load: async () => ({}), geocode: async () => { const error = new Error("Geocoder answered ZERO_RESULTS"); error.status = "ZERO_RESULTS"; throw error; } };
  changeQuoteRequestDraft("pendingAddress", "Nowhere Lane 0");
  assert.equal(await addTypedQuoteAddress({ finder }), false);
  assert.equal(quoteRequestState().errors.PROPERTY_ADDRESSES, QUOTE_REQUEST_COPY.addressUnknown, "an address Google cannot find is refused");
  changeQuoteRequestDraft("pendingAddress", DOCUMENTED_ADDRESS);
  assert.equal(await addTypedQuoteAddress({ finder: { load: async () => ({}), geocode: async () => ({ lat: 49.2888, lon: -123.1111 }) } }), true);
  assert.equal(quoteRequestState().draft.pendingAddress, "");
  portal.go("quote.new");
  const added = page();
  assert.deepEqual(texts(added, "[data-module=\"quote-request-address\"] .quote-request__address-text"), [DOCUMENTED_ADDRESS], "a new address is listed with its own Remove");
  assert.equal(one(added, "[data-module=\"quote-request-address\"] [data-action=\"quoteRequest.removeAddress\"]").getAttribute("aria-label"), "Remove " + DOCUMENTED_ADDRESS);
  assert.equal(all(added, "#quote-request-address-error").length, 0);
  assert.equal(one(added, ".quote-request__summary").textContent, "1 property and 1 new address");

  const risk = one(added, "[data-quote-request-risk=\"PARKADE_RAMPS\"]");
  fire(risk, "change");
  const notes = one(added, "#quote-request-notes");
  notes.value = "  Gate code at the loading bay  ";
  fire(notes, "input");
  assert.deepEqual(quoteRequestValues(quoteRequestState().draft), {
    PROPERTY_IDS: ["983"],
    PROPERTY_ADDRESSES: [DOCUMENTED_ADDRESS],
    PROPERTY_COORDINATES: DOCUMENTED_BODY.attributes[11].PROPERTY_COORDINATES.value,
    RISK_FACTORS: ["PARKADE_RAMPS"],
    ADDITIONAL_NOTES: "Gate code at the loading bay",
  });

  table.preferences = { SNOW_PORTAL_QUOTE_REQUEST: JSON.stringify({ form: 912, outcome: "ACCEPTED", field: null, message: "Thank you. We're preparing your quotes and will email you when they're ready to review.", propertyIds: [983, 2000], newPropertyIds: [2000], orderIds: [5000, 5001, 5002, 5003, 5004, 5005] }) };
  assert.equal(await ACTIONS["quoteRequest.submit"](), true);
  assert.equal(table.submissions.length, 1);
  assert.deepEqual(table.submissions[0].body, DOCUMENTED_BODY, "the submission is exactly the documented body");
  assert.equal(table.submissions[0].headers.Authorization, "Bearer test-token", "it is sent with the session's Bearer");
  assert.equal(table.submissions[0].headers["X-Organization-Code"], "SNOWLIMITLESS");
  const done = page();
  assert.equal(done.getAttribute("data-state"), "accepted");
  assert.equal(one(done, "h1").textContent, "Request received");
  assert.equal(one(done, ".state-block__desc").textContent, "A manager prepares your quotes. When they’re ready, they arrive by email and appear in Contracts, where you can approve them, decline them or ask for changes.");
  const link = one(done, "[data-visual-id=\"quote-request-contracts\"]");
  assert.deepEqual([link.textContent, link.getAttribute("data-action"), link.getAttribute("data-id")], ["Go to Contracts", "nav.go", "proposals.list"]);
  assert.equal(await until(() => !!(state.moduleData.proposals && state.moduleData.proposals.quotes && state.moduleData.proposals.quotes.preparing)), true, "Contracts shows the accepted request as being prepared until its quotes are sent");
  ACTIONS["service.requestForm"]();
  assert.equal(page().getAttribute("data-state"), "editing", "Request a quote after a received request starts a new one");
}

{
  await goLive();
  resetQuoteRequest();
  portal.go("quote.new");
  await until(() => state.quoteRequestSchema && state.quoteRequestSchema.state === "ready");
  table.submissions.length = 0;
  assert.equal(await ACTIONS["quoteRequest.submit"](), false);
  assert.equal(table.submissions.length, 0, "nothing chosen sends nothing");
  assert.equal(one(page(), "#quote-request-properties-error").textContent, "Choose a property or add an address to quote.");
  const draft = { propertyIds: Array.from({ length: 21 }, (_, index) => index + 1), addresses: Array.from({ length: 21 }, (_, index) => ({ address: index + " Main St", point: null })) };
  assert.deepEqual(validateQuoteRequest(draft), { PROPERTY_IDS: "Choose at most 20 properties in one request.", PROPERTY_ADDRESSES: "Add at most 20 new addresses in one request." });
}

for (const [report, field, rendered] of [
  [{ outcome: "REFUSED", field: "PROPERTY_ADDRESSES", message: "The following addresses are not in the supported service regions: 10 Downing St, London." }, "#quote-request-address-error", "The following addresses are not in the supported service regions: 10 Downing St, London."],
  [{ outcome: "REFUSED", field: "PROPERTY_IDS", message: "One of the chosen properties isn't on your account. Reload the page and choose again." }, "#quote-request-properties-error", "One of the chosen properties isn't on your account. Reload the page and choose again."],
  [{ outcome: "REFUSED", field: null, message: "We couldn't find the account for this sign-in. Contact us to request a quote." }, "[data-module=\"quote-request-message\"]", "!We couldn't find the account for this sign-in. Contact us to request a quote."],
  [{ outcome: "FAILED", field: null, message: "We couldn't take your quote request right now. Please try again in a few minutes." }, "[data-module=\"quote-request-message\"]", "!We couldn't take your quote request right now. Please try again in a few minutes."],
]) {
  await goLive();
  resetQuoteRequest();
  portal.go("quote.new");
  await until(() => state.quoteRequestSchema && state.quoteRequestSchema.state === "ready");
  toggleQuoteProperty(983);
  table.preferences = { SNOW_PORTAL_QUOTE_REQUEST: JSON.stringify(Object.assign({ form: 912 }, report)) };
  assert.equal(await ACTIONS["quoteRequest.submit"](), false);
  const refused = page();
  assert.equal(refused.getAttribute("data-state"), "editing", report.outcome + " leaves the form to fix and send again");
  assert.equal(one(refused, field).textContent, rendered, "the server's message is shown where it belongs: " + (report.field || "the page"));
  assert.deepEqual(quoteRequestState().draft.propertyIds, [983], "the choices are kept");
}

{
  await goLive();
  resetQuoteRequest();
  portal.go("quote.new");
  await until(() => state.quoteRequestSchema && state.quoteRequestSchema.state === "ready");
  toggleQuoteProperty(984);
  let clock = 0;
  const marks = [];
  table.preferences = () => ({ SNOW_PORTAL_QUOTE_REQUEST: JSON.stringify(clock < 2000 ? { form: 911, outcome: "ACCEPTED" } : { form: 912, outcome: "PROCESSING", message: "We're preparing your quote request." }) });
  const result = await submitQuoteRequest({
    now: () => clock,
    wait: async (ms) => {
      clock += ms;
      if (clock === 45000 || clock === 48000) marks.push([clock, quoteRequestState().phase]);
    },
    onChange: (phase) => { marks.push([clock, phase]); portal.go("quote.new"); },
  });
  assert.equal(result, false);
  assert.equal(QUOTE_REQUEST_OUTCOME_TIMEOUT_MS, 300000, "the request waits five minutes for an outcome, not the profile form's 45 s");
  assert.deepEqual(marks.slice(0, 3), [[0, "sending"], [0, "waiting"], [3000, "processing"]], "an earlier request's outcome is ignored and PROCESSING of this form is shown as it is reported");
  assert.deepEqual(marks.filter(([at]) => at === 45000 || at === 48000), [[45000, "processing"], [48000, "processing"]], "it is still waiting after 45 s");
  assert.deepEqual(marks[marks.length - 1], [QUOTE_REQUEST_OUTCOME_TIMEOUT_MS, "slow"]);
  const slow = page();
  assert.equal(slow.getAttribute("data-state"), "slow");
  assert.equal(one(slow, "h1").textContent, "We’re still working on your request");
  assert.equal(one(slow, ".state-block__desc").textContent, "It’s taking longer than usual. You don’t need to send it again: a manager prepares your quotes, and they arrive by email and appear in Contracts.");
  assert.deepEqual(all(slow, ".quote-request__outcome-actions [data-action]").map((button) => [button.textContent, button.getAttribute("data-action")]), [["Go to Contracts", "nav.go"], ["Check again", "quoteRequest.checkAgain"]]);
  assert.equal(all(slow, "[data-module=\"command-failure\"]").length + all(slow, "[data-module=\"error-state\"]").length, 0, "a slow request is not shown as an error");

  await portal.runtime().reloadAsync("proposals");
  assert.equal(state.moduleData.proposals.quotes.preparing, true, "Contracts shows a request still PROCESSING as being prepared");

  table.preferences = { SNOW_PORTAL_QUOTE_REQUEST: JSON.stringify({ form: 912, outcome: "ACCEPTED", orderIds: [4101, 4102, 4103] }) };
  assert.equal(await ACTIONS["quoteRequest.checkAgain"](), true);
  assert.equal(page().getAttribute("data-state"), "accepted");
}

{
  await goLive();
  state.quoteRequest = null;
  quoteRequestState().phase = "processing";
  portal.go("quote.new");
  await until(() => state.quoteRequestSchema && state.quoteRequestSchema.state === "ready");
  portal.go("quote.new");
  const waiting = one(page(), "[data-module=\"quote-request-progress\"]");
  assert.deepEqual([one(waiting, "[data-module=\"command-pending\"]").textContent, one(waiting, ".contract-form__note").textContent], [
    "We’re checking your properties and preparing quote drafts…",
    "This can take a few minutes, especially for new addresses. You can leave this page: your quotes will appear in Contracts and we’ll email you when they’re ready.",
  ], "the wait says what is happening, how long it can take and where the quotes arrive");
  assert.equal(all(page(), "[data-visual-id=\"quote-request-submit\"]").length, 0, "a request in flight cannot be sent twice");
  assert.ok(all(page(), "[data-module=\"quote-request-property\"]").every((card) => card.hasAttribute("disabled")));
}

{
  const preparing = (report) => normalizeContracts({ quoteOrders: { result: [order(4101, "QUOTE_SENT", 984, "PER_SERVICE", 1)] }, agreements: [], quoteRequest: report }).preparing;
  assert.equal(preparing(JSON.stringify({ form: 1, outcome: "PROCESSING" })), true);
  assert.equal(preparing(JSON.stringify({ form: 1, outcome: "ACCEPTED", orderIds: [4101, 4102] })), true, "a quote of the request that the client cannot read yet is being prepared by the manager");
  assert.equal(preparing(JSON.stringify({ form: 1, outcome: "ACCEPTED", orderIds: [4101] })), false, "once every quote of the request is sent, nothing is preparing");
  assert.equal(preparing(JSON.stringify({ form: 1, outcome: "REFUSED", orderIds: [] })), false);
  assert.equal(preparing("{not json"), false);
  assert.equal(preparing(null), false);
}

{
  await goLive();
  state.currentSiteId = "quote-5601-984";
  portal.go("proposal.detail");
  await settle();
  const cards = all(page(), "[data-module=\"quote-option\"]");
  assert.deepEqual(cards.map((card) => all(card, "[data-action]").map((button) => button.textContent)), [["Approve", "Request changes", "Decline"], ["Approve", "Request changes", "Decline"], ["Approve", "Request changes", "Decline"]], "Request changes sits next to Approve and Decline on every viewed quote");

  assert.equal(ACTIONS["quote.requestChanges"]("4102"), true);
  const box = one(page(), "[data-module=\"change-request\"]");
  assert.equal(one(box, "label").textContent, "What should change?");
  assert.equal(one(box, "textarea").getAttribute("data-quote-changes"), "4102");
  assert.equal(await ACTIONS["quote.sendChanges"]("4102"), false);
  assert.equal(table.events.length, 0, "an empty comment sends nothing");
  const invalid = one(page(), "[data-module=\"change-request\"]");
  assert.equal(one(invalid, ".field-error").textContent, "Write what you would like changed before sending.");
  assert.equal(one(invalid, "textarea").getAttribute("aria-invalid"), "true");
  const input = one(invalid, "textarea");
  input.value = "   ";
  fire(input, "input");
  assert.equal(await ACTIONS["quote.sendChanges"]("4102"), false, "whitespace is not a comment");
  assert.equal(table.events.length, 0);
  const typed = one(page(), "[data-module=\"change-request\"] textarea");
  typed.value = "  Quote weekly visits instead, and add sidewalk de-icing.  ";
  fire(typed, "input");
  assert.equal(await ACTIONS["quote.sendChanges"]("4102"), true);
  assert.deepEqual(table.events, [{ entity: "order", id: 4102, code: "QUOTE_VIEWED-CUSTOMER_CHANGES_REQUESTED", body: { MESSAGE: { value: "Quote weekly visits instead, and add sidewalk de-icing." } } }], "the documented tagged event carries the comment as MESSAGE");
  const after = page();
  const changed = all(after, "[data-module=\"quote-option\"]").find((card) => card.getAttribute("data-state") === "revision");
  assert.equal(one(changed, "[data-module=\"status-badge\"]").textContent, "⟳ Changes requested", "after the re-read the quote shows Changes requested");
  assert.equal(all(after, "[data-module=\"change-request\"]").length, 0);
  assert.equal(state.toast, "Change request sent");

  ACTIONS["quote.approve"]("4101");
  assert.equal(await ACTIONS["quote.confirm"]("4101"), true, "approve still works beside a change request");
  assert.deepEqual(table.events.slice(1).map((event) => [event.id, event.code, event.body]), [[4101, "QUOTE_VIEWED-CLIENT_APPROVED", {}]]);
  assert.deepEqual(table.orders.filter((row) => row.attributes[5].SERVICE_PROPERTY.value === 984).map((row) => row.states[0].code), ["CLIENT_APPROVED", "CUSTOMER_CHANGES_REQUESTED", "DECLINED"]);
}

{
  await goLive();
  state.currentSiteId = "quote-5601-984";
  portal.go("proposal.detail");
  ACTIONS["quote.decline"]("4103");
  assert.equal(await ACTIONS["quote.confirm"]("4103"), true);
  assert.deepEqual(table.events.map((event) => [event.id, event.code, event.body]), [[4103, "QUOTE_VIEWED-DECLINED", {}]], "decline still sends its empty-bodied event");
  assert.equal(one(page(), "[data-module=\"quote-option\"][data-state=\"declined\"] [data-module=\"status-badge\"]").textContent, "✕ Declined");

  state.agreementId = "agreement-core-5602";
  portal.go("agreement.detail");
  assert.equal(one(page(), "[data-module=\"agreement-detail-head\"] [data-module=\"status-badge\"]").textContent, "Sent for your approval");
  ACTIONS["agreement.approve"]("5602");
  assert.equal(await ACTIONS["agreement.confirm"]("5602"), true);
  assert.deepEqual(table.events.slice(1).map((event) => [event.entity, event.id, event.code, event.body]), [["document", 5602, "SENT_TO_CLIENT-CLIENT_APPROVED", {}]], "agreement approval is unchanged");
  assert.equal(one(page(), "[data-module=\"agreement-detail-head\"] [data-module=\"status-badge\"]").textContent, "Approved");
}

{
  await goLive();
  state.contractDetails = null;
  state.agreementId = "agreement-core-5603";
  portal.go("agreement.detail");
  assert.equal(one(page(), "[data-module=\"agreement-details\"]").getAttribute("data-state"), "loading");
  await until(() => state.contractDetails && state.contractDetails.prefill === "ready");
  const names = (mappings) => mappings.map((mapping) => mapping.name);
  assert.deepEqual(names(table.accountMappings), ["id", "nls", "user", "contacts", "addresses", "attributes"], "the pre-fill reads the profile mappings plus attributes");
  assert.deepEqual(plain(coreAccountProfileContract.contractDetailsMappings), plain(coreAccountProfileContract.mappings.concat([{ name: "attributes" }])));
  const view = page();
  assert.equal(one(view, "[data-module=\"agreement-detail-head\"] [data-module=\"status-badge\"]").textContent, "Awaiting your details");
  assert.equal(all(view, "[data-module=\"agreement-notice\"]").length, 0, "the details step replaces the notice");
  const form = one(view, "[data-module=\"agreement-details\"]");
  const value = (code) => one(form, "[data-contract-detail=\"" + code + "\"]").getAttribute("value");
  assert.deepEqual(["LEGAL_NAME", "BILLING_ADDRESS", "REPRESENTATIVE_FIRST_NAME", "REPRESENTATIVE_LAST_NAME", "REPRESENTATIVE_JOB_TITLE", "REPRESENTATIVE_EMAIL", "REPRESENTATIVE_PHONE"].map(value), [
    "Harbour View Strata", "100 Harbour Way, Vancouver, BC V6B 1A1", "Avery", "Flow", "Strata President", "avery@example.test", "+16045550100",
  ], "pre-filled from the Account name, the lowest BILLING address's address1 and the LEGAL contact with its first EMAIL and PHONE entries");
  assert.equal(one(form, "[data-module=\"agreement-details-prefill\"]").textContent, "Filled in from your account. Check every field before sending.");
  assert.deepEqual(all(form, "[data-client-type]").map((radio) => [radio.getAttribute("value"), radio.hasAttribute("checked")]), [
    ["INDIVIDUAL", false], ["UNINCORPORATED_BUSINESS", false], ["CORPORATE", false], ["ASSOCIATION", false], ["GOVERNMENT", false],
  ], "client type is a required choice of the five values the processor accepts; the old agreement's ORGANIZATION is neither offered nor chosen");
  assert.deepEqual(texts(form, ".choice-chip__label"), ["Individual", "Unincorporated business", "Corporation", "Association", "Government"]);
  assert.deepEqual(all(form, "input[type=\"checkbox\"]").map((box) => [box.getAttribute("data-contract-detail"), box.hasAttribute("checked")]), [["INFORMATION_CONFIRMED", false], ["AUTHORITY_CONFIRMED", false]], "the confirmations are never pre-filled");
  assert.equal(one(form, "label[for=\"contract-detail-representative-job-title\"]").textContent, "Job title (optional)");

  assert.equal(await ACTIONS["agreement.sendDetails"]("5603"), false);
  assert.equal(table.events.length, 0, "nothing is sent while a required detail is missing");
  const refused = one(page(), "[data-module=\"agreement-details\"]");
  assert.deepEqual(all(refused, ".field-error").map((error) => error.textContent), ["Choose the client type.", "Confirm this to send your details.", "Confirm this to send your details."]);

  const legal = one(refused, "[data-contract-detail=\"LEGAL_NAME\"]");
  legal.value = "  ";
  fire(legal, "input");
  const email = one(refused, "[data-contract-detail=\"REPRESENTATIVE_EMAIL\"]");
  email.value = "avery@";
  fire(email, "input");
  assert.equal(await ACTIONS["agreement.sendDetails"]("5603"), false);
  assert.deepEqual(all(page(), "[data-module=\"agreement-details\"] .field-error").map((error) => error.textContent).slice(0, 3), ["Enter the client’s legal name.", "Choose the client type.", "Enter a valid email address, like name@example.com."]);

  const again = one(page(), "[data-module=\"agreement-details\"]");
  const legalAgain = one(again, "[data-contract-detail=\"LEGAL_NAME\"]");
  legalAgain.value = "Harbour View Strata Corp.";
  fire(legalAgain, "input");
  const emailAgain = one(again, "[data-contract-detail=\"REPRESENTATIVE_EMAIL\"]");
  emailAgain.value = "Avery@Example.test";
  fire(emailAgain, "input");
  const corporate = one(again, "[data-client-type=\"CORPORATE\"]");
  corporate.checked = true;
  fire(corporate, "change");
  for (const code of ["INFORMATION_CONFIRMED", "AUTHORITY_CONFIRMED"]) {
    const box = one(again, "[data-contract-detail=\"" + code + "\"]");
    box.checked = true;
    fire(box, "change");
  }
  assert.equal(await ACTIONS["agreement.sendDetails"]("5603"), true);
  assert.deepEqual(table.events, [{
    entity: "document", id: 5603, code: "AWAITING_CLIENT_DETAILS-CLIENT_DETAILS_RECEIVED",
    body: {
      LEGAL_NAME: { value: "Harbour View Strata Corp." },
      CLIENT_TYPE: { value: "CORPORATE" },
      BILLING_ADDRESS: { value: "100 Harbour Way, Vancouver, BC V6B 1A1" },
      REPRESENTATIVE_FIRST_NAME: { value: "Avery" },
      REPRESENTATIVE_LAST_NAME: { value: "Flow" },
      REPRESENTATIVE_JOB_TITLE: { value: "Strata President" },
      REPRESENTATIVE_EMAIL: { value: "avery@example.test" },
      REPRESENTATIVE_PHONE: { value: "+16045550100" },
      INFORMATION_CONFIRMED: { value: true },
      AUTHORITY_CONFIRMED: { value: true },
    },
  }], "the documented event carries every attribute as { value }, the confirmations included");
  const sent = page();
  assert.equal(one(sent, "[data-module=\"agreement-detail-head\"] [data-module=\"status-badge\"]").textContent, "Pending management approval", "after the processor accepts the details the agreement awaits management");
  assert.equal(one(sent, "[data-module=\"agreement-notice\"]").textContent, "Thank you, we have your details. A manager prepares and approves your service agreement next; it appears here for your approval and we email you when it’s ready.");
  assert.equal(all(sent, "[data-module=\"agreement-details\"]").length, 0);
  assert.equal(state.contractDetails, null);
}

{
  await goLive();
  state.contractDetails = null;
  table.afterDetails = "AWAITING_CLIENT_DETAILS";
  table.returnedErrors = "CLIENT_TYPE_INVALID,REPRESENTATIVE_PHONE";
  state.agreementId = "agreement-core-5603";
  portal.go("agreement.detail");
  await until(() => state.contractDetails && state.contractDetails.prefill === "ready");
  const values = { LEGAL_NAME: "Harbour View Strata", CLIENT_TYPE: "INDIVIDUAL", BILLING_ADDRESS: "100 Harbour Way, Vancouver", REPRESENTATIVE_FIRST_NAME: "Avery", REPRESENTATIVE_LAST_NAME: "Flow", REPRESENTATIVE_JOB_TITLE: "", REPRESENTATIVE_EMAIL: "avery@example.test", REPRESENTATIVE_PHONE: "604 555 0100", INFORMATION_CONFIRMED: true, AUTHORITY_CONFIRMED: true };
  Object.assign(state.contractDetails.draft, values);
  assert.equal(await ACTIONS["agreement.sendDetails"]("5603"), false);
  const back = one(page(), "[data-module=\"agreement-details\"]");
  assert.equal(one(back, "[data-module=\"contracts-partial\"]").textContent, "!Your details came back. Our system could not accept them. Fix the marked fields and send your details again.");
  assert.deepEqual(all(back, ".field-error").map((error) => error.textContent), ["Choose one of the client types.", "This was missing from the details you sent."], "the processor's CLIENT_DETAILS_ERRORS are marked on their fields");
  assert.equal(one(back, "[data-contract-detail=\"REPRESENTATIVE_PHONE\"]").getAttribute("value"), "604 555 0100", "what the client typed is kept");
}

{
  const pkg = (stateCode, errors) => {
    const row = normalizeServiceAgreement(agreement(5603, stateCode, [], errors ? { CLIENT_DETAILS_ERRORS: { value: errors } } : {}));
    return { agreements: [{ id: row.id, agreement: row, orders: [] }], groups: [], sources: { orders: "ready" } };
  };
  const reads = [];
  let current = pkg("AWAITING_CLIENT_DETAILS");
  let clock = 0;
  const commands = createContractCommands({
    state: { contractCommand: null, contractConfirm: null },
    render() {},
    current: () => current,
    context: () => ({}),
    wait: async (ms) => { clock += ms; },
    now: () => clock,
    reload: async () => current,
    gateway: () => ({
      readAgreement: async () => { reads.push(clock); return agreement(5603, "AWAITING_CLIENT_DETAILS", []); },
      sendAgreementEvent: async () => true,
    }),
  });
  const filled = contractDetailsRequest({ LEGAL_NAME: "A", CLIENT_TYPE: "GOVERNMENT", BILLING_ADDRESS: "1 Main St, Vancouver", REPRESENTATIVE_FIRST_NAME: "A", REPRESENTATIVE_LAST_NAME: "B", REPRESENTATIVE_JOB_TITLE: "", REPRESENTATIVE_EMAIL: "a@b.test", REPRESENTATIVE_PHONE: "6045550100", INFORMATION_CONFIRMED: true, AUTHORITY_CONFIRMED: true });
  assert.deepEqual(filled.errors, {});
  assert.deepEqual(Object.keys(filled.values), CONTRACT_DETAILS_FIELDS.map((field) => field.code));
  assert.equal(await commands.sendDetails(5603, filled.values), false);
  assert.ok(clock >= 45000 && clock < 47000, "a details event Core never applies is waited for about 45 s, then reported as unconfirmed rather than sent");
}

{
  const quoteSteps = {
    QUOTE_SENT: "◔ Sent", QUOTE_VIEWED: "• Viewed",
    CUSTOMER_CHANGES_REQUESTED: "⟳ Changes requested", CHANGES_NOTIFICATION_FAILED: "⟳ Changes requested", CHANGES_NOTIFICATION_CONFIRMED: "⟳ Changes requested",
    CLIENT_APPROVED: "✓ Approved", APPROVAL_PROCESSING_FAILED: "✓ Approved",
    DECLINED: "✕ Declined", DECLINE_PROCESSING_FAILED: "✕ Declined",
  };
  const quotes = normalizeQuoteOrders({ result: Object.keys(quoteSteps).map((code, index) => order(6000 + index, code, 983, "MONTHLY", 1)) }).orders;
  assert.deepEqual(quotes.map((row) => [row.stateCode, QUOTE_STATUS[row.status].label]), Object.entries(quoteSteps), "each documented quote state shows its portal step");
  const prepared = normalizeQuoteOrders({ result: ["INITIAL", "QUOTE_PREPARED", "WAITING_FOR_AREA", "PRICING_FAILED", "CHANGES_REQUESTED", "QUOTE_APPROVED_INTERNALLY"].map((code, index) => order(7000 + index, code, 983, "MONTHLY", 1)) });
  assert.deepEqual([prepared.orders.length, prepared.preparing, prepared.withheldBackendIds.length], [0, true, 6], "a quote with the manager is never listed as a decision and keeps Contracts in preparing");

  const agreementSteps = {
    QUOTATION_SENT: "Awaiting your decisions", QUOTATION_UPDATE: "Awaiting your decisions", QUOTATION_SEND_FAILED: "Awaiting your decisions",
    AWAITING_CLIENT_DETAILS: "Awaiting your details",
    CLIENT_DETAILS_RECEIVED: "Checking your details",
    DRAFT: "Pending management approval", PENDING_MANAGEMENT_APPROVAL: "Pending management approval", INTERNALLY_APPROVED: "Pending management approval", CLIENT_CHANGES_REQUESTED: "Pending management approval",
    SENT_TO_CLIENT: "Sent for your approval", AGREEMENT_SEND_FAILED: "Being sent to you",
    CLIENT_APPROVED: "Approved", ACTIVATION_FAILED: "Approved",
    ACTIVE: "Active",
  };
  assert.deepEqual(Object.keys(agreementSteps).map((code) => [code, AGREEMENT_STAGES[code].label]), Object.entries(agreementSteps), "each documented agreement state shows its portal step");
  assert.deepEqual(Object.keys(agreementSteps).filter((code) => normalizeServiceAgreement(agreement(1, code, [])).allowedActions.length).map((code) => [code, normalizeServiceAgreement(agreement(1, code, [])).allowedActions]), [["AWAITING_CLIENT_DETAILS", ["details"]], ["SENT_TO_CLIENT", ["approve"]]], "only these two states take a client action");
  assert.equal(CLIENT_TYPES.ORGANIZATION, "Organization", "an old agreement's ORGANIZATION is still named on its parties card");
  assert.deepEqual(CONTRACT_CLIENT_TYPES.map((type) => type.code), ["INDIVIDUAL", "UNINCORPORATED_BUSINESS", "CORPORATE", "ASSOCIATION", "GOVERNMENT"]);
  assert.deepEqual(contractDetailsPrefill({ attributes: { 35: { LEGAL_ENTITY_TYPE: { value: "organization" } } } }, CONTRACT_CLIENT_TYPES.map((type) => type.code)).CLIENT_TYPE, "", "a legal entity type the processor refuses is not pre-filled");
  assert.deepEqual(contractDetailsPrefill({ attributes: { 35: { LEGAL_ENTITY_TYPE: { value: "corporate" } } } }, CONTRACT_CLIENT_TYPES.map((type) => type.code)).CLIENT_TYPE, "CORPORATE");
  assert.deepEqual(CONTRACT_EVENTS.changes, { entity: "order", source: "QUOTE_VIEWED", code: "QUOTE_VIEWED-CUSTOMER_CHANGES_REQUESTED" });
  assert.deepEqual(CONTRACT_EVENTS.details, { entity: "document", source: "AWAITING_CLIENT_DETAILS", code: "AWAITING_CLIENT_DETAILS-CLIENT_DETAILS_RECEIVED" });
}

assert.ok(warnings.every((line) => !/command unavailable/.test(line)), "every action the new screens use is connected: " + warnings.join(" | "));
console.log("snow-portal-quote-flow-check ok: the header's Request a quote opens the in-portal page in a live portal and the public form otherwise; the page offers the client's own properties as cards with address and area, new addresses with suggestions bounded by the form type's within box and refused outside it or when not found, the form type's risk factors and notes and no contact field; it submits PORTAL_QUOTE_REQUEST exactly as documented with the session, shows sending, waiting and processing honestly, keeps waiting past 45 s for up to five minutes, then says the request is still being processed and quotes will arrive in Contracts and by email, and places each refusal next to its input; Contracts shows a running or accepted request as preparing; a viewed quote offers Request changes beside Approve and Decline, refuses an empty comment in the browser and sends MESSAGE with the documented event, then shows Changes requested; an agreement awaiting details shows a details step pre-filled from the Account, LEGAL contact and BILLING address, requires a client type from the five accepted values and both confirmations, sends every attribute as { value }, then shows Pending management approval or marks returned errors; quote and agreement states carry the documented labels; and approve, decline and agreement approval still send their empty-bodied events");

function createDom() {
  class Text {
    constructor(value) { this.textContent = String(value); this.parentNode = null; }
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
      this.offsetLeft = 0;
      this.scrollTop = 0;
      this.scrollHeight = 0;
    }
    get className() { return this.getAttribute("class") || ""; }
    set className(value) { this.setAttribute("class", value); }
    get id() { return this.getAttribute("id") || ""; }
    get children() { return this.childNodes.filter((node) => node instanceof Element); }
    get firstChild() { return this.childNodes[0] || null; }
    get textContent() { return this.childNodes.map((node) => node.textContent).join(""); }
    set textContent(value) { this.replaceChildren(new Text(value)); }
    get isConnected() {
      for (let current = this; current; current = current.parentNode) if (current === documentNode) return true;
      return false;
    }
    get classList() {
      const element = this;
      return {
        add(...names) { element.className = element.className.split(/\s+/).filter(Boolean).filter((name) => !names.includes(name)).concat(names).join(" "); },
        remove(...names) { element.className = element.className.split(/\s+/).filter((name) => name && !names.includes(name)).join(" "); },
        contains(name) { return element.className.split(/\s+/).includes(name); },
      };
    }
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
    removeEventListener() {}
    contains(node) {
      for (let current = node; current; current = current.parentNode) if (current === this) return true;
      return false;
    }
    closest(selector) {
      for (let current = this; current instanceof Element; current = current.parentNode) if (matches(current, selector)) return current;
      return null;
    }
    querySelectorAll(selector) {
      const alternatives = selector.split(",").map((part) => part.trim());
      if (alternatives.length > 1) {
        const found = [];
        alternatives.forEach((alternative) => this.querySelectorAll(alternative).forEach((node) => { if (!found.includes(node)) found.push(node); }));
        return found;
      }
      let scope = [this];
      selector.split(" ").forEach((step) => {
        const found = [];
        scope.forEach((root) => {
          const walk = (node) => node.children.forEach((child) => { if (matches(child, step) && !found.includes(child)) found.push(child); walk(child); });
          walk(root);
        });
        scope = found;
      });
      return scope;
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    getBoundingClientRect() { return { width: 1200, height: 800, left: 0, top: 0, right: 1200, bottom: 800 }; }
    focus() { documentNode.activeElement = this; }
    scrollIntoView() {}
  }
  function matches(node, selector) {
    const parts = selector.match(/^[a-zA-Z0-9-]+|#[\w-]+|\.[\w-]+|\[[^\]]+\]/g) || [];
    return parts.every((part) => {
      if (part[0] === ".") return node.className.split(/\s+/).includes(part.slice(1));
      if (part[0] === "#") return node.getAttribute("id") === part.slice(1);
      if (part[0] === "[") {
        const attribute = /^\[([\w-]+)(?:="([^"]*)")?\]$/.exec(part);
        return attribute[2] === undefined ? node.hasAttribute(attribute[1]) : node.getAttribute(attribute[1]) === attribute[2];
      }
      return node.tagName === part.toUpperCase();
    });
  }
  const listeners = {};
  const documentNode = new Element("#document");
  documentNode.documentElement = new Element("html");
  documentNode.head = new Element("head");
  documentNode.body = new Element("body");
  documentNode.appendChild(documentNode.documentElement);
  documentNode.documentElement.appendChild(documentNode.head);
  documentNode.documentElement.appendChild(documentNode.body);
  documentNode.activeElement = null;
  documentNode.createElement = (tag) => new Element(tag);
  documentNode.createElementNS = (_, tag) => new Element(tag);
  documentNode.createTextNode = (value) => new Text(value);
  documentNode.getElementById = (id) => documentNode.querySelector("#" + id);
  documentNode.addEventListener = (type, listener) => { (listeners[type] = listeners[type] || []).push(listener); };
  return {
    document: documentNode,
    fire(type) { (listeners[type] || []).forEach((listener) => listener({ type })); },
  };
}
