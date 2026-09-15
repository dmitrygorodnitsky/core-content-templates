import assert from "node:assert/strict";
import path from "node:path";
import { pathToFileURL } from "node:url";

const dom = createDom();
globalThis.window = globalThis;
globalThis.document = dom.document;
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
const warnings = [];
console.warn = (...parts) => { warnings.push(parts.map(String).join(" ")); };

const runtimeRoot = pathToFileURL(path.resolve("app-templates/customer-portal/runtime") + "/");
const load = (file) => import(new URL(file, runtimeRoot));
const { readPortalConfig } = await load("src/config.js");
const {
  AGREEMENT_STAGES,
  contractsPackage,
  formatDatePeriod,
  formatIsoDate,
  formatOrderTotal,
  groupStatus,
  normalizeQuoteOrders,
  normalizeServiceAgreement,
  quoteDecisionStates,
  quoteViewStates,
  schematicPositions,
} = await load("src/normalizers/contracts.js");
const { coreSnowContract } = await load("src/adapters/core-snow-adapter.js");
const { normalizeProposals } = await load("src/normalizers/index.js");
const { fixtureAdapter } = await load("src/adapters/fixture-adapter.js");
const { modules } = await load("src/modules/index.js");
const { applyPortalConfig, quotePackage, state } = await load("src/state.js");
const { graniteRidgeSnowFixture } = await load("data/cases/granite-ridge-snow.js");
const { ProposalsList } = await load("src/routes/ProposalsPage.js");
const { ProposalDetail } = await load("src/routes/ProposalDetailPage.js");
const { Overview } = await load("src/routes/OverviewPage.js");
const { PropertyDetail } = await load("src/routes/PropertyDetailPage.js");

const plain = (value) => JSON.parse(JSON.stringify(value));
const PERIOD = { SERVICE_PERIOD_START: { value: "2026-11-01" }, SERVICE_PERIOD_END: { value: "2027-03-31" } };
const SENT = ["INITIAL", "QUOTE_PREPARED", "QUOTE_APPROVED_INTERNALLY", "QUOTE_SENT"];

function orderRow(id, codes, attributes = {}, extra = {}) {
  return Object.assign({
    id,
    type: { id: 5, code: "FIELD_SERVICE_ORDER", nls: { en: { NAME: "Field service order" } } },
    states: codes.map((code, index) => ({ id: index + 1, code })),
    attributes: { 5: attributes },
    grandTotal: 0,
    currency: { id: 2, code: "CAD" },
    created: 1785961364110,
  }, extra);
}

function agreementDocument(codes, attributes = {}, extra = {}) {
  return Object.assign({
    id: 9001,
    type: { id: 17, code: "SERVICE_AGREEMENT", nls: { en: { NAME: "Service agreement" } } },
    states: codes.map((code, index) => ({ id: index + 1, code })),
    attributes: { 17: attributes },
  }, extra);
}

const orderList = {
  resultSize: 12,
  result: [
    orderRow(501, SENT, Object.assign({ SERVICE_PROPERTY: { value: 278 }, PRICING_MODEL: { value: "PER_SERVICE" } }, PERIOD)),
    orderRow(502, SENT.concat("QUOTE_VIEWED"), Object.assign({ SERVICE_PROPERTY: { value: "278" }, PRICING_MODEL: { value: "MONTHLY" } }, PERIOD)),
    orderRow(503, SENT.concat("QUOTE_VIEWED", "CLIENT_APPROVED"), Object.assign({ SERVICE_PROPERTY: { value: 430 }, PRICING_MODEL: { value: "SEASONAL" } }, PERIOD), { grandTotal: "8625.50" }),
    orderRow(504, SENT.concat("QUOTE_VIEWED", "DECLINED"), { SERVICE_PROPERTY: { value: 430 }, PRICING_MODEL: { value: "MONTHLY" } }, { grandTotal: null }),
    orderRow(505, SENT.concat("QUOTE_VIEWED", "CUSTOMER_CHANGES_REQUESTED"), { SERVICE_PROPERTY: { value: 431 }, PRICING_MODEL: { value: "toString" } }, { grandTotal: 1200, currency: null }),
    orderRow(506, ["INITIAL"], { SERVICE_PROPERTY: { value: 432 } }),
    orderRow(507, ["INITIAL", "QUOTE_PREPARED"], {}),
    orderRow(508, ["SOMETHING_NEW"], { SERVICE_PROPERTY: { value: 278 } }),
    orderRow(509, SENT, { SERVICE_PROPERTY: { value: 278 } }, { type: { id: 9, code: "SUBSCRIPTION_ORDER" } }),
    orderRow(null, SENT, {}),
    orderRow(510, SENT, { PRICING_MODEL: { value: "HOURLY" }, SERVICE_PERIOD_START: { value: "2026-02-30" }, SERVICE_PERIOD_END: { value: "2027-03-31" } }, { grandTotal: -5 }),
    orderRow(511, SENT, { SERVICE_PROPERTY: { value: true }, PRICING_MODEL: { value: null } }, { grandTotal: "", currency: { code: "cad" } }),
  ],
};

{
  assert.deepEqual(plain(coreSnowContract.customerQuoteStatus), { CLIENT_APPROVED: "approved", CUSTOMER_CHANGES_REQUESTED: "revision", DECLINED: "declined", QUOTE_SENT: "unseen", QUOTE_VIEWED: "viewed" }, "the tenant adapter and the customer-scope normalizer read one set of Order states");

  const { orders, preparing } = normalizeQuoteOrders(orderList);
  assert.deepEqual(orders.map((order) => order.backendId), [501, 502, 503, 504, 505, 510, 511], "operator-side, unknown-state, other-type and id-less rows are not rows");
  assert.deepEqual(orders.map((order) => order.status), ["unseen", "viewed", "approved", "declined", "revision", "unseen", "unseen"]);
  assert.deepEqual(orders.map((order) => order.propertyBackendId), [278, 278, 430, 430, 431, null, null], "a string id is an id, and a boolean is not a property even though Number(true) is 1");
  assert.deepEqual(orders.map((order) => order.pricingModel && order.pricingModel.label), ["Per service", "Monthly", "Seasonal", "Monthly", null, null, null], "an unknown or inherited-name pricing model has no label and never shows its code");
  assert.deepEqual(plain(orders.map((order) => order.total)), [null, null, { amount: 8625.5, currency: "CAD" }, null, null, null, null], "a zero, null, negative or empty total, or one without a currency, renders as absent");
  assert.deepEqual(plain(orders[0].servicePeriod), { start: "2026-11-01", end: "2027-03-31" });
  assert.equal(orders[3].servicePeriod, null, "no service period on the Order means none on the row");
  assert.equal(orders[5].servicePeriod, null, "February 30th is not a date");
  assert.equal(preparing, true, "an Order the operator has not sent switches the preparing state on");
  assert.ok(orders.every((order) => /^quote-core-\d+$/.test(order.id)), "a row is identified by its Core id only");

  assert.equal(normalizeQuoteOrders({ resultSize: 1, result: [orderRow(1, SENT)] }).preparing, false);
  assert.equal(normalizeQuoteOrders({ result: [orderRow(1, ["SOMETHING_NEW"])] }).preparing, false, "a state nobody has named is neither a quote nor preparation");
  for (const payload of [null, undefined, {}, "<!doctype html>", { result: "nope" }]) {
    assert.deepEqual(plain(normalizeQuoteOrders(payload)), { orders: [], preparing: false });
  }
  assert.deepEqual(normalizeQuoteOrders([orderRow(7, SENT)]).orders.map((order) => order.backendId), [7], "a bare array of rows is accepted as well as the list envelope");
}

{
  const review = normalizeServiceAgreement(agreementDocument(["QUOTATION", "QUOTATION_SENT"], { CLIENT: { value: 62 }, ORDERS: { value: [501, "502", 503, 503, "x", 0, true] } }));
  assert.deepEqual(plain(review), {
    id: "agreement-core-9001", backendId: 9001, stateCode: "QUOTATION_SENT", stage: "review",
    label: "Awaiting your decisions", tone: "info", orderBackendIds: [501, 502, 503], effectiveDate: null, term: null,
  }, "the package reads its latest state and its listed Orders; no date is invented");
  assert.deepEqual(normalizeServiceAgreement(agreementDocument(["QUOTATION"], { ORDERS: { value: "501, 502" } })).orderBackendIds, [501, 502]);
  assert.deepEqual(normalizeServiceAgreement(agreementDocument(["QUOTATION"], { ORDERS: { value: 501 } })).orderBackendIds, [501]);
  assert.deepEqual(normalizeServiceAgreement(agreementDocument(["QUOTATION"], {})).orderBackendIds, []);
  assert.equal(normalizeServiceAgreement(agreementDocument(["QUOTATION"])).stage, "preparing");

  const active = normalizeServiceAgreement(agreementDocument(["QUOTATION", "QUOTATION_SENT", "AWAITING_CLIENT_DETAILS", "DRAFT", "PENDING_MANAGEMENT_APPROVAL", "INTERNALLY_APPROVED", "SENT_TO_CLIENT", "CLIENT_APPROVED", "ACTIVE"], {
    EFFECTIVE_DATE: { value: "2026-11-01" }, TERM_START_DATE: { value: "2026-11-01" }, TERM_END_DATE: { value: "2027-03-31" },
  }));
  assert.equal(active.stage, "active");
  assert.equal(active.effectiveDate, "2026-11-01");
  assert.deepEqual(plain(active.term), { start: "2026-11-01", end: "2027-03-31" });

  for (const value of [null, "", 0, [2026, 11, 1], "2026-13-01", "Nov 1, 2026", true]) {
    assert.equal(normalizeServiceAgreement(agreementDocument(["ACTIVE"], { EFFECTIVE_DATE: { value } })).effectiveDate, null, JSON.stringify(value) + " is not a date, and Number(null) is 0");
  }
  assert.equal(normalizeServiceAgreement(agreementDocument(["ACTIVE"], { TERM_START_DATE: { value: "2027-04-01" }, TERM_END_DATE: { value: "2027-03-31" } })).term, null, "a term that ends before it starts is not a term");
  assert.equal(normalizeServiceAgreement(agreementDocument(["ACTIVE"], {}, { type: { code: "DRIVER_LICENSE" } })), null);
  assert.equal(normalizeServiceAgreement(agreementDocument(["ACTIVE"], {}, { type: undefined })), null, "a document whose type was not read cannot be taken for an agreement");
  assert.equal(normalizeServiceAgreement(agreementDocument(["SOMETHING_NEW"])), null);
  assert.equal(normalizeServiceAgreement(agreementDocument(["ACTIVE"], {}, { id: null })), null);
  assert.equal(normalizeServiceAgreement(null), null);

  const seeded = ["QUOTATION", "QUOTATION_SENT", "QUOTATION_SEND_FAILED", "AWAITING_CLIENT_DETAILS", "DRAFT", "PENDING_MANAGEMENT_APPROVAL", "INTERNALLY_APPROVED", "SENT_TO_CLIENT", "AGREEMENT_SEND_FAILED", "CLIENT_APPROVED", "ACTIVE", "SUSPENDED", "EXPIRED", "ARCHIVED", "CANCELED"];
  assert.deepEqual(Object.keys(AGREEMENT_STAGES).sort(), seeded.slice().sort(), "every state of SERVICE_AGREEMENT_LIFECYCLE has a customer presentation");
  for (const code of seeded) {
    const stage = AGREEMENT_STAGES[code];
    if (stage.stage === "preparing") assert.equal(stage.label, "", code + " is operator-side and shows no label");
    else assert.ok(stage.label && ["ok", "info", "warn", "scheduled"].includes(stage.tone), code + " needs a label and a badge tone");
  }
}

{
  const properties = [
    { id: "prop-core-278", backendId: 278, name: "123 Main Street", address: "#1001 - 7445 132nd Street, Surrey, BC, V3W 1J8", lat: null, lon: null },
    { id: "prop-core-430", backendId: "430", name: "460 Nanaimo St", address: "460 Nanaimo St, Vancouver, BC, V5L 4W3", lat: 49.28, lon: -123.05 },
  ];
  const source = Object.assign({ agreement: normalizeServiceAgreement(agreementDocument(["QUOTATION", "QUOTATION_SENT"])) }, normalizeQuoteOrders(orderList));
  const quotes = contractsPackage(source, properties);
  assert.deepEqual(quotes.groups.map((group) => group.id), ["prop-core-278", "prop-core-430", "prop-core-431", ""], "rows are grouped by property in the order Core listed them; a quote without a property has no page to open");
  assert.deepEqual(quotes.groups.map((group) => group.property && group.property.name), ["123 Main Street", "460 Nanaimo St", null, null]);
  assert.deepEqual(quotes.groups.map((group) => group.orders.map((order) => order.backendId)), [[501, 502], [504, 503], [505], [510, 511]], "within a property the options run per service, monthly, seasonal");
  assert.deepEqual(quotes.groups.map((group) => group.decision), ["open", "approved", "revision", "open"]);
  assert.deepEqual(plain(quotes.counts), { orders: 7, properties: 3, decided: 1, approved: 1, revision: 1, declined: 1, open: 4 });
  assert.equal(quotes.counts.approved + quotes.counts.revision + quotes.counts.declined + quotes.counts.open, quotes.counts.orders, "the rollup counts each independent Order once");
  assert.equal(quotes.servicePeriod, null, "a service period is shown only when every Order shares it");
  assert.equal(quotes.agreement.stage, "review");
  assert.equal(quotes.preparing, true);

  const shared = contractsPackage(normalizeQuoteOrders({ result: [orderList.result[0], orderList.result[1], orderList.result[2]] }), properties);
  assert.deepEqual(plain(shared.servicePeriod), { start: "2026-11-01", end: "2027-03-31" });
  assert.equal(shared.agreement, null, "without a readable agreement the header has no agreement state");

  const declinedEverywhere = contractsPackage(normalizeQuoteOrders({ result: [orderRow(1, SENT.concat("DECLINED"), { SERVICE_PROPERTY: { value: 278 } }), orderRow(2, SENT.concat("DECLINED"), { SERVICE_PROPERTY: { value: 278 } })] }), properties);
  assert.equal(declinedEverywhere.groups[0].decision, "declined", "a property whose every option is declined is decided");
  assert.equal(declinedEverywhere.counts.decided, 1);

  const onlyOperator = contractsPackage(Object.assign({ agreement: normalizeServiceAgreement(agreementDocument(["QUOTATION"])) }, normalizeQuoteOrders({ result: [orderRow(1, ["INITIAL"])] })), properties);
  assert.deepEqual(plain({ agreement: onlyOperator.agreement, preparing: onlyOperator.preparing, groups: onlyOperator.groups }), { agreement: null, preparing: true, groups: [] }, "a package still being collected shows no agreement and no quote, only that the request is being prepared");
  const scopeHidesOperator = contractsPackage({ agreement: normalizeServiceAgreement(agreementDocument(["QUOTATION"])), orders: [], preparing: false }, properties);
  assert.equal(scopeHidesOperator.preparing, true, "an agreement still in QUOTATION is enough to say the request is being prepared when the Orders themselves are out of scope");
  assert.equal(contractsPackage(null, null).counts.orders, 0);

  assert.equal(groupStatus(quotes.groups[0].orders), "viewed");
  assert.equal(groupStatus([]), "unseen");

  const open = quotes.groups[0].orders;
  assert.deepEqual(plain(quoteViewStates(open)), [{ backendId: 501, codes: ["QUOTE_VIEWED"] }], "opening a property's quotes marks only the unseen ones viewed");
  assert.deepEqual(plain(quoteDecisionStates(open, "approved", "MONTHLY")), [
    { backendId: 501, codes: ["QUOTE_VIEWED", "DECLINED"] },
    { backendId: 502, codes: ["CLIENT_APPROVED"] },
  ], "approving one option declines the other options for the same property");
  assert.deepEqual(plain(quoteDecisionStates(open, "declined")), [{ backendId: 501, codes: ["QUOTE_VIEWED", "DECLINED"] }, { backendId: 502, codes: ["DECLINED"] }]);
  assert.deepEqual(plain(quoteDecisionStates(open, "revision")), [{ backendId: 501, codes: ["QUOTE_VIEWED", "CUSTOMER_CHANGES_REQUESTED"] }, { backendId: 502, codes: ["CUSTOMER_CHANGES_REQUESTED"] }]);
  assert.throws(() => quoteDecisionStates(open, "approved", "SEASONAL"), /no quote waiting/, "an option that was never quoted cannot be approved");
  assert.throws(() => quoteDecisionStates(quotes.groups[1].orders, "declined"), /not waiting/, "CLIENT_APPROVED and DECLINED are terminal");
  assert.throws(() => quoteDecisionStates(open, "maybe"), /Unsupported/);

  assert.deepEqual(schematicPositions([]), []);
  assert.deepEqual(schematicPositions([null, { lat: null, lon: null }]), [null, null], "a missing coordinate is never placed, and Number(null) is 0");
  assert.deepEqual(schematicPositions([{ lat: 49.2, lon: -122.9 }]), [{ x: 50, y: 50 }], "a lone property sits in the middle because it is the only point, not because it has none");
  assert.deepEqual(schematicPositions([{ lat: 49.1, lon: -123.1 }, null, { lat: 49.3, lon: -122.9 }]), [{ x: 18, y: 76 }, null, { x: 82, y: 24 }], "north is up, and the outermost pins stay far enough inside the frame for a centred label");
  const near = schematicPositions([{ lat: 49.2, lon: -122.9 }, { lat: 49.2001, lon: -122.9001 }]);
  assert.ok(near.every((point) => Math.abs(point.x - 50) <= 1 && Math.abs(point.y - 50) <= 1), "two neighbours are not flung to opposite corners");

  assert.equal(formatOrderTotal({ amount: 8625.5, currency: "CAD" }), "CA$8,625.50");
  assert.equal(formatOrderTotal({ amount: 8625, currency: "USD" }), "$8,625.00");
  assert.equal(formatOrderTotal(null), "");
  assert.equal(formatIsoDate("2026-11-01"), "Nov 1, 2026");
  assert.equal(formatIsoDate(""), "");
  assert.equal(formatDatePeriod({ start: "2026-11-01", end: "2027-03-31" }), "Nov 1, 2026 – Mar 31, 2027");
  assert.equal(formatDatePeriod(null), "");
}

const snowDataset = { portalVertical: "snow", portalProfile: "stormRetail", portalTheme: "snow", portalDataMode: "fixture", portalAuthMode: "fixture", portalCase: "granite-ridge-snow" };
const overviewProperties = graniteRidgeSnowFixture.overview.properties;
const quotedProperties = overviewProperties.filter((property) => property.quoteSiteId);

function configureFixture(extra = {}) {
  applyPortalConfig(readPortalConfig({ dataset: Object.assign({}, snowDataset, extra) }));
  state.liveWeather = null;
  refreshProposals();
}

function refreshProposals() {
  state.moduleData.proposals = normalizeProposals(fixtureAdapter.load("proposals", { config: state.config, state }));
}

function withProperties(changes, run) {
  const saved = overviewProperties.map((property) => ({ property, lat: property.lat, lon: property.lon, address: property.address }));
  changes();
  try { return run(); } finally {
    saved.forEach((entry) => { entry.property.lat = entry.lat; entry.property.lon = entry.lon; entry.property.address = entry.address; });
  }
}

const all = (root, selector) => root.querySelectorAll(selector);
const one = (root, selector) => root.querySelector(selector);

{
  configureFixture();
  const page = ProposalsList();
  const text = page.textContent;
  assert.equal(page.getAttribute("data-state"), "ready");
  const head = one(page, "[data-module=\"quote-package-head\"]");
  assert.equal(one(head, "h1").textContent, "Your quotes");
  assert.equal(one(head, "[data-module=\"status-badge\"]").textContent, "Awaiting your decisions", "the header states the agreement's own state");
  assert.equal(one(head, ".proposals-head__sub").textContent, "12 quotes for 4 properties · Service period Nov 1, 2026 – Mar 31, 2027");
  assert.equal(one(head, ".proposals-head__pill").textContent, "2 of 4 properties decided", "a property with changes requested is not decided");
  for (const invented of ["Proposal #", "valid until", "sent Dec", "sq ft", "Beam AI", "live orders", "Order #", "/mo"]) {
    assert.ok(!text.includes(invented), "the package page must not claim " + JSON.stringify(invented));
  }

  const notice = one(page, "[data-module=\"quote-preparing\"]");
  assert.equal(notice.textContent, "◔We’re still preparing part of your requestAnything we send you appears in this list.");
  assert.doesNotMatch(notice.textContent, /\d/, "the withheld Orders are never counted to the customer");

  const map = one(page, "[data-module=\"portfolio-map\"]");
  assert.equal(map.getAttribute("data-surface"), "schematic");
  assert.equal(one(map, ".portfolio-map__label").textContent, "portfolio map");
  assert.equal(all(map, ".portfolio-map__river").length, 0, "the drawn river implied a geography nobody measured");
  const expected = schematicPositions(quotedProperties.map((property) => ({ lat: property.lat, lon: property.lon })));
  assert.deepEqual(all(map, ".map-pin-wrap").map((pin) => pin.getAttribute("style")), expected.map((point) => "left:" + point.x + "%;top:" + point.y + "%"), "pins are placed from the properties' own coordinates");
  assert.deepEqual(all(map, ".map-pin-label").map((label) => label.textContent), ["Foothill Court", "Tabor Street", "Yarrow Ridge", "Cinnamon Bear Way"]);

  assert.deepEqual(all(page, ".rollup-card__num").map((cell) => cell.textContent), ["1", "3", "5", "3"]);
  const groups = all(page, "[data-module=\"quote-property\"]");
  assert.deepEqual(groups.map((group) => group.getAttribute("data-state")), ["approved", "revision", "declined", "open"]);
  const foothill = groups[0];
  const button = one(foothill, "button");
  assert.equal(button.getAttribute("data-action"), "proposal.open");
  assert.equal(button.getAttribute("data-id"), "gr-foothill");
  assert.equal(one(foothill, ".proposal-card__meta").textContent, "4820 Foothill Court, Lakewood, CO 80215 · 3 quotes");
  assert.equal(one(foothill, ".proposal-group__decision").textContent, "Option approved");
  assert.deepEqual(all(foothill, "[data-module=\"quote-row\"]").map((row) => [one(row, ".proposal-option__model").textContent, (one(row, ".proposal-option__total") || { textContent: null }).textContent, one(row, "[data-module=\"status-badge\"]").textContent]), [
    ["Per service", null, "✕ Declined"],
    ["Monthly", null, "✓ Approved"],
    ["Seasonal", "$8,625.00", "✕ Declined"],
  ]);
  assert.deepEqual(groups.map((group) => all(group, "[data-module=\"quote-row\"]").length), [3, 3, 3, 3]);
  assert.equal(all(page, ".proposal-card__tag").length, 0, "every quoted property is on the map, so none is marked off it");
  assert.equal(one(page, "[data-module=\"quote-package-footer\"]").textContent, "✦Decide each property on its own. Approving one option for a property declines its other options. Once every property has a decision, we’ll ask for your contract details and prepare your service agreement.");
  for (const id of all(page, "[data-id]").map((element) => element.getAttribute("data-id"))) {
    assert.match(id, /^[a-z0-9-]+$/, "a page link carries an id, never a name or an address");
  }
}

{
  configureFixture();
  const cinnamon = overviewProperties.find((property) => property.id === "prop-cinnamon");
  withProperties(() => { cinnamon.lat = null; cinnamon.lon = null; }, () => {
    const page = ProposalsList();
    const map = one(page, "[data-module=\"portfolio-map\"]");
    assert.equal(one(map, ".portfolio-map__label").textContent, "portfolio map · 3 of 4 properties on the map");
    assert.equal(all(map, ".map-pin-wrap").length, 3, "a property without a coordinate is listed but not pinned");
    const tags = all(page, "[data-module=\"quote-property\"]").map((group) => (one(group, ".proposal-card__tag") || { textContent: "" }).textContent);
    assert.deepEqual(tags, ["", "", "", "Not on the map"]);
  });
  withProperties(() => { quotedProperties.forEach((property) => { property.lat = null; property.lon = null; }); }, () => {
    const page = ProposalsList();
    assert.equal(all(page, "[data-module=\"portfolio-map\"]").length, 0, "with nothing to place there is no map, and nothing lands at its centre");
    assert.equal(all(page, ".proposal-card__tag").length, 0, "without a map no property is marked off it");
    assert.equal(all(page, "[data-module=\"quote-property\"]").length, 4, "every property is still listed");
  });
}

{
  configureFixture();
  state.porders = graniteRidgeSnowFixture.proposals.orders.filter((order) => order.id === 8113);
  refreshProposals();
  state.moduleData.proposals.quotes.agreement = normalizeServiceAgreement(agreementDocument(["QUOTATION"]));
  const page = ProposalsList();
  assert.equal(page.getAttribute("data-state"), "preparing");
  const block = one(page, "[data-module=\"quote-preparing\"]");
  assert.equal(block.getAttribute("data-state"), "preparing");
  assert.equal(block.textContent, "◔We have your requestWe’re preparing your quote. It appears here as soon as we send it to you.");
  assert.equal(page.textContent, "Your quotes" + block.textContent, "no count, pill, rollup, map or footer claims a quote exists");
  assert.equal(all(page, "[data-module=\"proposal-rollup\"]").length + all(page, ".proposals-head__pill").length + all(page, "[data-module=\"portfolio-map\"]").length, 0);

  state.porders = [];
  refreshProposals();
  const empty = ProposalsList();
  assert.equal(empty.getAttribute("data-state"), "empty");
  assert.equal(one(empty, "[data-module=\"empty-state\"]").textContent, "📄No quotes yetWhen we send you a quote for a property, it shows up here.");
  assert.equal(all(empty, "[data-module=\"quote-preparing\"]").length, 0);
}

{
  configureFixture();
  const decidedOnce = new Set();
  state.porders = graniteRidgeSnowFixture.proposals.orders.filter((order) => order.id !== 8113).map((order) => {
    const property = order.attributes[5].SERVICE_PROPERTY.value;
    const final = decidedOnce.has(property) ? "DECLINED" : "CLIENT_APPROVED";
    decidedOnce.add(property);
    return Object.assign({}, order, { states: order.states.concat({ code: "QUOTE_VIEWED" }, { code: final }) });
  });
  refreshProposals();
  state.moduleData.proposals.quotes.agreement = normalizeServiceAgreement(agreementDocument(["ACTIVE"], {
    EFFECTIVE_DATE: { value: "2026-11-01" }, TERM_START_DATE: { value: "2026-11-01" }, TERM_END_DATE: { value: "2027-03-31" },
  }));
  const page = ProposalsList();
  const head = one(page, "[data-module=\"quote-package-head\"]");
  assert.equal(one(head, "h1").textContent, "Your service agreement");
  assert.equal(one(head, "[data-module=\"status-badge\"]").textContent, "Active");
  assert.equal(one(head, ".proposals-head__sub").textContent, "12 quotes for 4 properties · Service period Nov 1, 2026 – Mar 31, 2027 · Effective Nov 1, 2026 · Term Nov 1, 2026 – Mar 31, 2027", "dates appear only because the agreement carries them");
  assert.equal(all(head, ".proposals-head__pill").length, 0, "once the agreement is past review there is nothing left to decide");
  assert.equal(all(page, "[data-module=\"quote-package-footer\"]").length, 0);
  assert.equal(all(page, "[data-module=\"quote-preparing\"]").length, 0);
}

{
  applyPortalConfig(readPortalConfig({ dataset: { portalVertical: "snow", portalProfile: "stormOps", portalTheme: "snow", portalDataMode: "fixture", portalAuthMode: "fixture" } }));
  refreshProposals();
  assert.equal(quotePackage(), null, "the generic proposal demonstration has no package");
  const text = ProposalsList().textContent;
  assert.match(text, /Proposal #PR-1043/, "a proposal whose data carries a number still shows it");
  assert.match(text, /valid until Mar 31, 2026/);
  assert.match(text, /Approving a plan records your decision on the quote we already prepared for that site\./);
  assert.doesNotMatch(text, /live orders the moment you confirm/, "approval is a state on an Order that already exists");
}

{
  configureFixture();
  state.currentSiteId = "gr-foothill";
  const decided = ProposalDetail();
  assert.equal(decided.getAttribute("data-state"), "approved");
  assert.equal(one(decided, "[data-visual-id=\"proposal-back\"]").textContent, "‹ Back to your quotes");
  assert.equal(one(decided, ".proposal-decided").textContent, "iYou approved Seasonal Unlimited. The other options for this property are declined.");
  assert.equal(all(decided, "[data-visual-id=\"proposal-approve\"]").length, 0, "a decided property offers no decision a terminal Order could not take");
  assert.doesNotMatch(decided.textContent, /Order #|live order|change your decision/);
  assert.match(decided.textContent, /Flex Service PlanPer service/);
  assert.match(decided.textContent, /Seasonal Unlimited CoverageMonthly/);
  assert.match(decided.textContent, /Season-Lock PrepaidSeasonal/);

  state.currentSiteId = "gr-cinnamon";
  const open = ProposalDetail();
  assert.equal(open.getAttribute("data-state"), "unseen");
  assert.equal(one(open, "[data-visual-id=\"proposal-approve\"]").textContent, "Approve Seasonal Unlimited");
  assert.equal(all(open, ".proposal-decided").length, 0);

  state.currentSiteId = "gr-tabor";
  const revision = ProposalDetail();
  assert.equal(one(revision, ".proposal-decided").textContent, "iYou asked for changes to these quotes. Our team is reviewing your request.");
  assert.equal(all(revision, "[data-visual-id=\"proposal-approve\"]").length, 0, "an Order with changes requested waits for the operator, not the customer");
}

{
  configureFixture();
  const widget = one(Overview(), "[data-module=\"active-contracts\"]");
  assert.equal(all(widget, "[data-module=\"contract-row\"]").length, 2);
  const row = one(widget, "[data-module=\"quote-preparing\"]");
  assert.equal(row.getAttribute("data-state"), "preparing");
  assert.equal(one(row, ".ov-row__title").textContent + one(row, ".ov-row__meta").textContent, "Request in preparationWe have your request and are preparing your quote.");

  const contracts = graniteRidgeSnowFixture.overview.contracts;
  graniteRidgeSnowFixture.overview.contracts = [];
  try {
    const preparingOnly = one(Overview(), "[data-module=\"active-contracts\"]");
    assert.equal(one(preparingOnly, "[data-module=\"quote-preparing\"]").textContent, "We have your requestWe’re preparing your quote. It appears under Contracts once we send it.Go to Contracts ›");
    state.porders = [];
    refreshProposals();
    const nothing = one(Overview(), "[data-module=\"active-contracts\"]");
    assert.equal(all(nothing, "[data-module=\"quote-preparing\"]").length, 0);
    assert.equal(one(nothing, ".ov-empty").textContent, "No active contractsA contract appears here once your service agreement is approved.", "a contract follows an approved service agreement, not an approved quote");
  } finally {
    graniteRidgeSnowFixture.overview.contracts = contracts;
  }
}

{
  const geography = JSON.stringify({ map: { center: { lat: 49.19, lon: -122.85 }, zoom: 10 }, zones: { surrey: { lat: 49.19, lon: -122.85 } } });
  const configureLive = (extra = {}) => {
    applyPortalConfig(readPortalConfig({ dataset: Object.assign({
      portalVertical: "snow", portalProfile: "stormRetail", portalTheme: "snow", portalDataMode: "live", portalAuthMode: "required",
      portalCase: "granite-ridge-snow", portalOrganization: "SNOWLIMITLESS", portalServiceGeography: geography,
      portalWeatherClientId: "cid", portalWeatherClientSecret: "sec",
    }, extra) }));
    state.liveWeather = null;
    state.liveWeatherState = "loading";
    state.sessionName = null;
    delete state.moduleData.properties;
    delete state.moduleData.proposals;
  };

  configureLive();
  assert.throws(() => modules.proposals.adapter({ config: state.config, state }), /not opened/, "proposals stays closed in live mode until a customer-scoped read exists");
  assert.equal(quotePackage(), null);
  assert.equal(state.porders.length, 0, "live mode carries no fixture Orders");

  const header = (page) => one(page, "[data-module=\"page-header\"]").textContent;
  let page = Overview();
  assert.equal(header(page), "Welcome back");
  assert.equal(one(page, "[data-module=\"overview-loading\"]").getAttribute("aria-busy"), "true");
  for (const fixtureFact of ["Dana", "Mara", "Storm watch", "under contract"]) {
    assert.ok(!page.textContent.includes(fixtureFact), "live mode never shows the fixture customer: " + fixtureFact);
  }

  state.sessionName = "Priya Natarajan";
  assert.equal(header(Overview()), "Welcome back, Priya");
  state.sessionName = "priya@example.test";
  assert.equal(header(Overview()), "Welcome back", "an e-mail address is not a first name");

  state.moduleData.properties = { state: "error", items: [] };
  assert.equal(one(Overview(), "[data-module=\"error-state\"]").textContent.startsWith("⚠Couldn’t load your home screen"), true);
  state.moduleData.properties = { state: "unauthorized", items: [] };
  assert.match(one(Overview(), "[data-module=\"empty-state\"]").textContent, /You don’t have access to these properties/);
  state.moduleData.properties = { state: "ready", items: [] };
  state.liveWeatherState = "failed";
  assert.equal(all(Overview(), "[data-module=\"error-state\"]").length, 1, "a failed forecast is an error, not an empty home");

  configureLive({ portalServiceGeography: "" });
  assert.match(one(Overview(), "[data-module=\"empty-state\"]").textContent, /isn’t set up yet/);

  configureLive();
  const liveProperty = {
    id: "prop-core-278", backendId: 278, name: "01953720 B.C. Ltd", address: "",
    city: "Surrey", postal: "", region: "BC", country: "CA", category: "COMMERCIAL", stateCode: "ACTIVE",
    lat: null, lon: null, zone: null, contract: null, quoteSiteId: null, appointment: null, ticket: null, lastService: null,
  };
  state.moduleData.properties = { state: "ready", accountId: 62, items: [liveProperty], scopeMode: "browser-filtered", truncated: false };
  state.liveWeatherState = "ready";
  state.liveWeather = { source: "xweather", nowIndex: 0, zoneCentroids: {}, legend: graniteRidgeSnowFixture.overview.weather.legend, timeline: [{ day: "Today", date: "Feb 2", kind: "snow", temp: "−4°C", label: "Snowfall 2 cm", note: "", stats: [], zones: {} }] };
  page = Overview();
  assert.equal(one(page, ".page-header__sub").textContent, "Snowfall 2 cm · 1 property", "a live property is not called under contract");
  assert.equal(one(page, "[data-module=\"active-contracts\"] .ov-empty").textContent, "No active contractsA contract appears here once your service agreement is approved.");
  assert.equal(all(page, "[data-module=\"quote-preparing\"]").length, 0, "live mode has no quote read, so it claims no preparation");
  const tooltipless = one(page, "[data-module=\"property-row\"]");
  assert.equal(all(tooltipless, ".ov-prow__addr").length, 0, "an absent address renders as absent");

  state.propertyId = "prop-core-278";
  const detail = PropertyDetail();
  assert.deepEqual(all(detail, "[data-fact]").map((fact) => fact.getAttribute("data-fact")), ["contract"], "no zone, lot, quote or map fact is invented for a live property");
  assert.equal(all(detail, ".prop-head__addr").length, 0);
  state.moduleData.properties = null;
}

{
  configureFixture();
  state.propertyId = "prop-foothill";
  const keyless = PropertyDetail();
  const facts = (root) => all(root, "[data-fact]").map((fact) => [fact.getAttribute("data-fact"), one(fact, ".prop-fact__value").textContent, (one(fact, ".prop-fact__note") || { textContent: "" }).textContent]);
  assert.deepEqual(facts(keyless), [
    ["contract", "#1234 · Seasonal Unlimited Coverage ›", ""],
    ["zone", "Central", ""],
    ["lot", "19,400 sq ft", ""],
    ["quotes", "3 quotes · option approved ›", ""],
  ], "without a map on the portal there is no map fact, and a plan id is never shown as a price");
  assert.doesNotMatch(keyless.textContent, /\$898/);
  assert.equal(one(keyless, "[data-fact=\"quotes\"] .link-action").getAttribute("data-id"), "gr-foothill");

  configureFixture({ portalMapsApiKey: "stubkey" });
  state.propertyId = "prop-foothill";
  const pinned = one(PropertyDetail(), "[data-fact=\"map\"]");
  assert.equal(one(pinned, ".link-action").getAttribute("data-action"), "property.showOnMap");
  assert.equal(one(pinned, ".link-action").textContent, "On the map ›");

  const alkire = overviewProperties.find((property) => property.name === "Alkire Street");
  withProperties(() => { alkire.lat = null; alkire.lon = null; alkire.address = ""; }, () => {
    state.propertyId = alkire.id;
    const unplaced = one(PropertyDetail(), "[data-fact=\"map\"]");
    assert.equal(one(unplaced, ".prop-fact__value").textContent, "Not on the map");
    assert.equal(one(unplaced, ".prop-fact__note").textContent, "No address on file");
  });
  withProperties(() => { alkire.lat = null; alkire.lon = null; }, () => {
    state.propertyId = alkire.id;
    const unplaced = one(PropertyDetail(), "[data-fact=\"map\"]");
    assert.equal(one(unplaced, ".prop-fact__value").textContent, "Not on the map", "an address the map has not placed is not on the map, and never at its centre");
    assert.equal(all(unplaced, ".prop-fact__note").length, 0);
  });
}

for (const property of overviewProperties) {
  assert.ok(!warnings.some((line) => line.includes(property.address)), "a console warning must never carry a customer address");
}

console.log("snow-contracts-check ok: the generic customer-scope order list and agreement document normalize with absent data left absent, Orders group by property with a true rollup and §6 decisions, the package page shows only agreement facts with a schematic map that never places an unlocated property, the preparing state claims no quote and shows no count, live mode keeps proposals closed and shows no fixture customer, and property detail explains whether a property is on the map");

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
      const steps = selector.split(" ");
      let scope = [this];
      steps.forEach((step) => {
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
