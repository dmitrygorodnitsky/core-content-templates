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
const { readPortalConfig, routeRegistry } = await load("src/config.js");
const {
  AGREEMENT_STAGES,
  contractsPackage,
  findQuote,
  formatDatePeriod,
  formatIsoDate,
  formatMoney,
  formatOrderTotal,
  groupStatus,
  normalizeContracts,
  normalizeQuoteOrders,
  normalizeServiceAgreement,
  schematicPositions,
  termsBlocks,
} = await load("src/normalizers/contracts.js");
const { coreSnowContract } = await load("src/adapters/core-snow-adapter.js");
const { normalizeProposals } = await load("src/normalizers/index.js");
const { fixtureAdapter } = await load("src/adapters/fixture-adapter.js");
const { modules } = await load("src/modules/index.js");
const { applyPortalConfig, contractAgreementFor, quoteGroupFor, quotePackage, state } = await load("src/state.js");
const { graniteRidgeSnowFixture } = await load("data/cases/granite-ridge-snow.js");
const { ProposalsList } = await load("src/routes/ProposalsPage.js");
const { ProposalDetail } = await load("src/routes/ProposalDetailPage.js");
const { QuoteOptionCard } = await load("src/components/proposals/QuoteOptionCard.js");
const { AgreementDetail } = await load("src/routes/AgreementDetailPage.js");
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

  const { orders, preparing, withheldBackendIds } = normalizeQuoteOrders(orderList);
  assert.deepEqual(orders.map((order) => order.backendId), [501, 502, 503, 504, 505, 510, 511], "operator-side, unknown-state, other-type and id-less rows are not rows");
  assert.deepEqual(orders.map((order) => order.status), ["unseen", "viewed", "approved", "declined", "revision", "unseen", "unseen"]);
  assert.deepEqual(orders.map((order) => order.propertyBackendId), [278, 278, 430, 430, 431, null, null], "a string id is an id, and a boolean is not a property even though Number(true) is 1");
  assert.deepEqual(orders.map((order) => order.pricingModel && order.pricingModel.label), ["Per service", "Monthly", "Seasonal", "Monthly", null, null, null], "an unknown or inherited-name pricing model has no label and never shows its code");
  assert.deepEqual(plain(orders.map((order) => order.total)), [null, null, { amount: 8625.5, currency: "CAD" }, null, null, null, null], "a zero, null, negative or empty total, or one without a currency, renders as absent");
  assert.deepEqual(plain(orders[0].servicePeriod), { start: "2026-11-01", end: "2027-03-31" });
  assert.equal(orders[3].servicePeriod, null, "no service period on the Order means none on the row");
  assert.equal(orders[5].servicePeriod, null, "February 30th is not a date");
  assert.equal(preparing, true, "an Order the operator has not sent switches the preparing state on");
  assert.deepEqual(withheldBackendIds, [506, 507], "withheld Orders are remembered only so an agreement can tell them from unreadable ones");
  assert.ok(orders.every((order) => /^quote-core-\d+$/.test(order.id)), "a row is identified by its Core id only");
  assert.deepEqual(orders.map((order) => order.allowedActions), [["view"], ["approve", "decline"], [], [], [], ["view"], ["view"]], "only QUOTE_SENT can be viewed and only QUOTE_VIEWED can be decided; no order offers a change request");
  assert.equal(orders[2].money.total, "CA$8,625.50", "the server's total is formatted, never recomputed");
  assert.equal(orders[2].money.subtotal, "", "a subtotal Core did not return is absent");
  assert.equal(orders[0].money, null, "an unpriced Order states no money at all");
  assert.ok(orders.every((order) => order.linesState === "unavailable" && order.lines.length === 0), "without a line read every Order says its lines are unavailable rather than empty");

  assert.equal(normalizeQuoteOrders({ resultSize: 1, result: [orderRow(1, SENT)] }).preparing, false);
  assert.equal(normalizeQuoteOrders({ result: [orderRow(1, ["SOMETHING_NEW"])] }).preparing, false, "a state nobody has named is neither a quote nor preparation");
  for (const payload of [null, undefined, {}, "<!doctype html>", { result: "nope" }]) {
    assert.deepEqual(plain(normalizeQuoteOrders(payload)), { orders: [], preparing: false, withheldBackendIds: [] });
  }
  assert.deepEqual(normalizeQuoteOrders([orderRow(7, SENT)]).orders.map((order) => order.backendId), [7], "a bare array of rows is accepted as well as the list envelope");
}

{
  const catalog = {
    orderItems: [
      { id: 72, order: { id: 7 }, itemPrice: { id: 36 }, amount: 916.24, itemCount: 1, sortOrder: 1, grandTotal: 916.24 },
      { id: 71, order: { id: 7 }, itemPrice: { id: 28 }, amount: 1528.48, itemCount: 1, sortOrder: 0, grandTotal: 1528.48 },
      { id: 81, order: { id: 8 }, itemPrice: { id: 99 }, amount: "12.5", itemCount: 12, sortOrder: null },
      { id: 82, order: { id: 8 }, itemPrice: null, amount: null, itemCount: null },
      { id: 91, order: { id: 9 }, itemPrice: { id: 28 }, amount: 10, itemCount: 1, sortOrder: 0, grandTotal: 10 },
    ],
    productPrices: [{ id: 28, product: { id: 25 } }, { id: 36, product: { id: 28 } }],
    products: [{ id: 25, nls: { en: { NAME: "Snow Removal" } } }, { id: 28, nls: { en: { NAME: "Rock Salt De-Icing" } } }],
  };
  const priced = { totalCharges: 2444.72, totalTaxes: 0, grandTotal: 2444.72 };
  const rows = [
    orderRow(7, SENT, { PRICING_MODEL: { value: "PER_SERVICE" }, SERVICE_ADDRESS: { value: " 1180 Pacific Crescent, Vancouver, BC V6Z 2R5 " } }, Object.assign({ items: [{ id: 71 }, { id: 72 }] }, priced)),
    orderRow(8, SENT, { SERVICE_ADDRESS: { value: { address1: "not a string" } } }, Object.assign({ items: [{ id: 81 }, { id: 82 }, { id: 83 }] }, priced)),
    orderRow(9, ["INITIAL"], {}, { items: [{ id: 91 }] }),
  ];
  const { orders } = normalizeQuoteOrders(rows, catalog);
  assert.deepEqual(plain(orders[0].lines), [
    { key: "line-71", product: "Snow Removal", quantity: "1", unitPrice: "CA$1,528.48", total: "CA$1,528.48" },
    { key: "line-72", product: "Rock Salt De-Icing", quantity: "1", unitPrice: "CA$916.24", total: "CA$916.24" },
  ], "Order, OrderItem, ProductPrice and Product are joined by id, lines run in sortOrder, and every figure is the server's");
  assert.equal(orders[0].linesState, "ready");
  assert.deepEqual(plain(orders[0].money), { subtotal: "CA$2,444.72", taxes: "CA$0.00", total: "CA$2,444.72" }, "taxes Core returned as zero are shown as zero, not hidden");
  assert.equal(orders[0].serviceAddress, "1180 Pacific Crescent, Vancouver, BC V6Z 2R5");
  assert.equal(orders[1].serviceAddress, "", "an address that is not text is not an address, and never [object Object]");
  assert.deepEqual(plain(orders[1].lines), [
    { key: "line-81", product: "", quantity: "12", unitPrice: "CA$12.50", total: "" },
    { key: "line-82", product: "", quantity: "", unitPrice: "", total: "" },
  ], "an unreadable price leaves the service unnamed, and a line total Core did not return is never multiplied out in the browser");
  assert.equal(orders[1].linesState, "partial", "a listed line that was not returned, or a price that was not readable, makes the lines partial");
  assert.equal(orders.length, 2, "the operator-side Order's lines never reach the customer");
  const withoutCatalog = normalizeQuoteOrders(rows, { orderItems: catalog.orderItems, productPrices: null, products: null }).orders[0];
  assert.deepEqual(withoutCatalog.lines.map((entry) => entry.product), ["", ""], "a failed catalog read names no service");
  assert.equal(withoutCatalog.linesState, "partial");

  assert.equal(formatMoney("8625.5", "USD"), "$8,625.50");
  assert.equal(formatMoney(0.02374, "CAD"), "CA$0.02374", "a unit price keeps the precision Core stored");
  assert.equal(formatMoney(null, "CAD"), "");
  assert.equal(formatMoney("", "CAD"), "", "an empty amount is absent, and Number('') is 0");
  assert.equal(formatMoney(12, "cad"), "12.00", "without a valid currency the amount is shown bare rather than in a guessed currency");
}

{
  const review = normalizeServiceAgreement(agreementDocument(["QUOTATION", "QUOTATION_SENT"], { CLIENT: { value: 62 }, ORDERS: { value: [501, "502", 503, 503, "x", 0, true] } }));
  assert.deepEqual(plain({ id: review.id, backendId: review.backendId, stateCode: review.stateCode, stage: review.stage, label: review.label, tone: review.tone, orderBackendIds: review.orderBackendIds, effectiveDate: review.effectiveDate, term: review.term }), {
    id: "agreement-core-9001", backendId: 9001, stateCode: "QUOTATION_SENT", stage: "review",
    label: "Awaiting your decisions", tone: "info", orderBackendIds: [501, 502, 503], effectiveDate: null, term: null,
  }, "the package reads its latest state and its listed Orders; no date is invented");
  assert.deepEqual(review.allowedActions, [], "only an agreement sent to the client can be approved");
  assert.deepEqual(review.terms, [], "an agreement without CONTRACT_TERMS has no terms, not an empty paragraph");
  assert.deepEqual(plain(review.parties.client), { legalName: "", clientType: "", billingAddress: "", representativeName: "", representativeJobTitle: "", email: "", phone: "" });
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

  const sent = normalizeServiceAgreement(agreementDocument(["SENT_TO_CLIENT"], {
    LEGAL_NAME: { value: "Harbour View Strata" }, CLIENT_TYPE: { value: "ORGANIZATION" }, BILLING_ADDRESS: { value: "100 Harbour Way, Vancouver" },
    REPRESENTATIVE_FIRST_NAME: { value: "Avery" }, REPRESENTATIVE_LAST_NAME: { value: "Flow" }, REPRESENTATIVE_JOB_TITLE: { value: "Director" },
    REPRESENTATIVE_EMAIL: { value: "avery@example.test" }, REPRESENTATIVE_PHONE: { value: "+1 604 555 0100" },
    PROVIDER_REPRESENTATIVE_NAME: { value: "Morgan Ellis" }, PROVIDER_REPRESENTATIVE_JOB_TITLE: { value: "Contracts Manager" },
  }, { organization: { id: 43, code: "GRANITE", nls: { en: { NAME: "Granite Ridge Snow Removal" } } } }), { displayName: "Account display name" });
  assert.deepEqual(sent.allowedActions, ["approve"]);
  assert.deepEqual(plain(sent.parties), {
    provider: { legalName: "Granite Ridge Snow Removal", representativeName: "Morgan Ellis", representativeJobTitle: "Contracts Manager" },
    client: { legalName: "Harbour View Strata", clientType: "Organization", billingAddress: "100 Harbour Way, Vancouver", representativeName: "Avery Flow", representativeJobTitle: "Director", email: "avery@example.test", phone: "+1 604 555 0100" },
  }, "the agreement's own snapshot names the parties, and the provider falls back to the owning organization");
  assert.equal(normalizeServiceAgreement(agreementDocument(["SENT_TO_CLIENT"], { CLIENT_TYPE: { value: "PARTNERSHIP" } }), { displayName: "Harbour View Strata" }).parties.client.clientType, "", "a client type without a known label is not shown as a code");
  assert.equal(normalizeServiceAgreement(agreementDocument(["SENT_TO_CLIENT"]), { displayName: "Harbour View Strata" }).parties.client.legalName, "Harbour View Strata", "before the client sends details the Account's own name is the client");

  const workflowStates = ["ACTIVATION_FAILED", "ACTIVE", "AGREEMENT_SEND_FAILED", "ARCHIVED", "AWAITING_CLIENT_DETAILS", "CANCELED", "CLIENT_APPROVED", "CLIENT_DETAILS_RECEIVED", "DRAFT", "EXPIRED", "INTERNALLY_APPROVED", "PENDING_MANAGEMENT_APPROVAL", "QUOTATION", "QUOTATION_SEND_FAILED", "QUOTATION_SENT", "SENT_TO_CLIENT", "SUSPENDED"];
  assert.deepEqual(Object.keys(AGREEMENT_STAGES).sort(), workflowStates, "every state of SERVICE_AGREEMENT_LIFECYCLE as read from dev-1 on 2026-09-23 has a customer presentation");
  for (const code of workflowStates) {
    const stage = AGREEMENT_STAGES[code];
    if (stage.stage === "preparing") assert.equal(stage.label, "", code + " is operator-side and shows no label");
    else assert.ok(stage.label && ["ok", "info", "warn", "scheduled"].includes(stage.tone), code + " needs a label and a badge tone");
  }
  assert.equal(AGREEMENT_STAGES.ACTIVATION_FAILED.label, "Approved", "a failed activation is the provider's step; the customer's approval stands");
  assert.equal(AGREEMENT_STAGES.CLIENT_DETAILS_RECEIVED.label, "Agreement in preparation");
}

{
  const blocks = termsBlocks([
    "# Scope",
    "Snow clearing and de-icing for the addresses listed.",
    "",
    "1. Services",
    "1.1 Clearing starts at 2 cm.",
    "1.2. De-icing at or below 0 °C.",
    "Crews photograph every visit.",
    "- Seasonal options are invoiced once.",
    "* Monthly options are invoiced monthly.",
    "",
    "2. Access",
    "1) Gate codes go through the storm desk.",
    "2) Blackout days are agreed in writing.",
    "2026 is the first season.",
    "",
    "# Cancellation",
    "Thirty days notice.",
  ].join("\r\n"));
  assert.deepEqual(plain(blocks), [
    { kind: "heading", text: "Scope" },
    { kind: "paragraph", text: "Snow clearing and de-icing for the addresses listed.", depth: 0 },
    { kind: "numbered", marker: "1.", text: "Services", depth: 1 },
    { kind: "numbered", marker: "1.1", text: "Clearing starts at 2 cm.", depth: 2 },
    { kind: "numbered", marker: "1.2.", text: "De-icing at or below 0 °C.", depth: 2 },
    { kind: "paragraph", text: "Crews photograph every visit.", depth: 2 },
    { kind: "item", text: "Seasonal options are invoiced once.", depth: 2 },
    { kind: "item", text: "Monthly options are invoiced monthly.", depth: 2 },
    { kind: "numbered", marker: "2.", text: "Access", depth: 1 },
    { kind: "numbered", marker: "1)", text: "Gate codes go through the storm desk.", depth: 2 },
    { kind: "numbered", marker: "2)", text: "Blackout days are agreed in writing.", depth: 2 },
    { kind: "paragraph", text: "2026 is the first season.", depth: 2 },
    { kind: "heading", text: "Cancellation" },
    { kind: "paragraph", text: "Thirty days notice.", depth: 0 },
  ], "“# ” is a heading, “- ” an item, a blank line ends a block, numbered lines keep their own markers, “1)” nests under the current numbered section, and a year is not a marker");
  assert.deepEqual(plain(termsBlocks("1) One\n2) Two")), [
    { kind: "numbered", marker: "1)", text: "One", depth: 1 },
    { kind: "numbered", marker: "2)", text: "Two", depth: 1 },
  ], "a list that uses only “1)” stays at the first level");
  assert.deepEqual(plain(termsBlocks("<h2>1. Services</h2><p>The Provider clears snow &amp; ice.</p><ul><li>Seasonal</li></ul><script>alert(1)</script>")), [
    { kind: "heading", text: "1. Services" },
    { kind: "paragraph", text: "The Provider clears snow & ice.", depth: 0 },
    { kind: "item", text: "Seasonal", depth: 0 },
    { kind: "paragraph", text: "alert(1)", depth: 0 },
  ], "markup is reduced to text; nothing from CONTRACT_TERMS is ever parsed as HTML");
  assert.deepEqual(termsBlocks(""), []);
  assert.deepEqual(termsBlocks(null), []);
  assert.deepEqual(termsBlocks({ value: "x" }), []);
}

{
  const properties = [
    { id: "prop-core-278", backendId: 278, name: "123 Main Street", address: "#1001 - 7445 132nd Street, Surrey, BC, V3W 1J8", lat: null, lon: null },
    { id: "prop-core-430", backendId: "430", name: "460 Nanaimo St", address: "460 Nanaimo St, Vancouver, BC, V5L 4W3", lat: 49.28, lon: -123.05 },
  ];
  const review = normalizeServiceAgreement(agreementDocument(["QUOTATION", "QUOTATION_SENT"]));
  const source = Object.assign({ agreements: [review] }, normalizeQuoteOrders(orderList));
  const quotes = contractsPackage(source, properties);
  assert.deepEqual(quotes.groups.map((group) => group.id), ["quote-0-278", "quote-0-430", "quote-0-431", "quote-0-0"], "rows are grouped by property in the order Core listed them, and a quote no agreement lists belongs to no package");
  assert.deepEqual(quotes.groups.map((group) => group.title), ["123 Main Street", "460 Nanaimo St", "Property details unavailable", "No property on this quote"]);
  assert.deepEqual(quotes.groups.map((group) => group.orders.map((order) => order.backendId)), [[501, 502], [504, 503], [505], [510, 511]], "within a property the options run per service, monthly, seasonal");
  assert.deepEqual(quotes.groups.map((group) => group.decision), ["open", "approved", "revision", "open"]);
  assert.deepEqual(plain(quotes.counts), { orders: 7, properties: 3, decided: 1, approved: 1, revision: 1, declined: 1, open: 4 });
  assert.equal(quotes.counts.approved + quotes.counts.revision + quotes.counts.declined + quotes.counts.open, quotes.counts.orders, "the rollup counts each independent Order once");
  assert.equal(quotes.servicePeriod, null, "a service period is shown only when every Order shares it");
  assert.equal(quotes.agreements.length, 1);
  assert.equal(quotes.agreements[0].agreement.stage, "review");
  assert.equal(quotes.deciding, true);

  const listed = normalizeServiceAgreement(agreementDocument(["QUOTATION", "QUOTATION_SENT"], { ORDERS: { value: [501, 502, 503, 504, 506, 999] } }));
  const packaged = contractsPackage(Object.assign({ agreements: [listed] }, normalizeQuoteOrders(orderList)), properties);
  assert.deepEqual(packaged.groups.map((group) => group.id), ["quote-9001-278", "quote-9001-430", "quote-0-431", "quote-0-0"], "a quote an agreement lists is grouped inside that package");
  assert.equal(packaged.groups[0].agreement.id, "agreement-core-9001");
  assert.equal(packaged.agreements[0].unreadableOrders, 1, "Order 999 is listed but was not read, while withheld Order 506 is not called unreadable");
  assert.equal(packaged.agreements[0].quoteCount, 4);
  assert.deepEqual(packaged.agreements[0].propertyNames, ["123 Main Street", "460 Nanaimo St"]);
  assert.equal(packaged.partial.unreadableOrders, 1);

  const later = normalizeServiceAgreement(agreementDocument(["QUOTATION", "QUOTATION_SENT", "SENT_TO_CLIENT"], { ORDERS: { value: [503, 504] } }, { id: 9002 }));
  const moved = contractsPackage(Object.assign({ agreements: [listed, later] }, normalizeQuoteOrders(orderList)), properties);
  assert.deepEqual(moved.groups.map((group) => group.id), ["quote-9001-278", "quote-0-431", "quote-0-0"], "decided quotes of an agreement past review leave the quote list for the agreement page");
  assert.equal(moved.agreements[0].id, "agreement-core-9002", "an agreement waiting for approval comes first");
  assert.deepEqual(moved.agreements[0].properties.map((entry) => entry.orders.map((order) => order.backendId)), [[503]], "past review an agreement's services are the options that were approved");
  assert.equal(moved.agreements[0].servicesScope, "approved");

  const shared = contractsPackage(normalizeQuoteOrders({ result: [orderList.result[0], orderList.result[1], orderList.result[2]] }), properties);
  assert.deepEqual(plain(shared.servicePeriod), { start: "2026-11-01", end: "2027-03-31" });
  assert.deepEqual(shared.agreements, [], "without a readable agreement there is no agreement row");

  const declinedEverywhere = contractsPackage(normalizeQuoteOrders({ result: [orderRow(1, SENT.concat("DECLINED"), { SERVICE_PROPERTY: { value: 278 } }), orderRow(2, SENT.concat("DECLINED"), { SERVICE_PROPERTY: { value: 278 } })] }), properties);
  assert.equal(declinedEverywhere.groups[0].decision, "declined", "a property whose every option is declined is decided");
  assert.equal(declinedEverywhere.counts.decided, 1);

  const onlyOperator = contractsPackage(Object.assign({ agreements: [normalizeServiceAgreement(agreementDocument(["QUOTATION"]))] }, normalizeQuoteOrders({ result: [orderRow(1, ["INITIAL"])] })), properties);
  assert.deepEqual(plain({ agreements: onlyOperator.agreements, preparing: onlyOperator.preparing, groups: onlyOperator.groups }), { agreements: [], preparing: true, groups: [] }, "a package still being collected shows no agreement and no quote, only that the request is being prepared");
  const scopeHidesOperator = normalizeContracts({ quoteOrders: [], agreements: [agreementDocument(["QUOTATION"])] });
  assert.equal(scopeHidesOperator.preparing, true, "an agreement still in QUOTATION is enough to say the request is being prepared when the Orders themselves are out of scope");
  assert.equal(contractsPackage(null, null).counts.orders, 0);

  assert.equal(groupStatus(quotes.groups[0].orders), "viewed");
  assert.equal(groupStatus([]), "unseen");

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
const RETIRED = ["Proposal #", "valid until", "sent Dec", "sq ft", "Beam AI", "live orders", "Order #", "/mo", "Flex Service Plan", "Seasonal Unlimited", "Season-Lock", "Request revision", "Request changes", "PDF", "Download"];

{
  assert.equal(routeRegistry["agreement.detail"].path, "/agreements/:id");
  assert.equal(routeRegistry["agreement.detail"].module, "proposals", "the agreement page is enabled wherever Contracts is, so no deployment has to name a new module");
  assert.deepEqual(Object.values(routeRegistry).filter((route) => route.path === "/agreements/:id").map((route) => route.id), ["agreement.detail"]);
}

{
  configureFixture();
  const page = ProposalsList();
  const text = page.textContent;
  assert.equal(page.getAttribute("data-state"), "ready");
  const head = one(page, "[data-module=\"quote-package-head\"]");
  assert.equal(one(head, "h1").textContent, "Your contracts");
  assert.equal(one(head, ".proposals-head__sub").textContent, "10 service agreements · 12 quotes for 4 properties · Service period Nov 1, 2026 – Mar 31, 2027");
  assert.equal(one(head, ".proposals-head__pill").textContent, "2 of 4 properties decided", "a property with changes requested is not decided");
  for (const invented of RETIRED) assert.ok(!text.includes(invented), "the contracts page must not claim " + JSON.stringify(invented));

  const notice = one(page, "[data-module=\"quote-preparing\"]");
  assert.equal(notice.textContent, "◔We’re still preparing part of your requestAnything we send you appears in this list.");
  assert.doesNotMatch(notice.textContent, /\d/, "the withheld Orders are never counted to the customer");
  assert.equal(all(page, "[data-module=\"contracts-partial\"]").length, 0, "the fixture reads everything it lists");

  const rows = all(page, "[data-module=\"agreement-row\"]");
  assert.deepEqual(rows.map((row) => row.getAttribute("data-state")), ["approval", "review", "details", "drafting", "approved", "active", "suspended", "expired", "archived", "canceled"], "an agreement waiting for the customer comes first");
  assert.deepEqual(rows.map((row) => one(row, ".proposal-card__name").textContent), ["Alkire Street and Braun Court", "Foothill Court and 3 more", "Coal Creek Lane", "Dover Way", "Lamar Terrace", "Eldridge Circle and Flatiron Parkway", "Independence Way", "Holland Street", "Jellison Place", "Kipling Crossing"]);
  assert.deepEqual(rows.map((row) => one(row, ".proposal-card__meta").textContent), [
    "Service agreement · Term Nov 1, 2026 – Mar 31, 2027",
    "Service agreement · 12 quotes for 4 properties · Service period Nov 1, 2026 – Mar 31, 2027",
    "Service agreement · Term Nov 1, 2026 – Mar 31, 2027",
    "Service agreement · Term Nov 1, 2026 – Mar 31, 2027",
    "Service agreement · Term Nov 1, 2026 – Mar 31, 2027",
    "Service agreement · Term Nov 1, 2025 – Mar 31, 2026",
    "Service agreement · Term Nov 1, 2025 – Mar 31, 2026",
    "Service agreement · Term Nov 1, 2024 – Mar 31, 2025",
    "Service agreement · Term Nov 1, 2024 – Mar 31, 2025",
    "Service agreement · Service period Nov 1, 2026 – Mar 31, 2027",
  ]);
  assert.deepEqual(rows.map((row) => one(row, "[data-module=\"status-badge\"]").textContent), ["Ready for your approval", "Awaiting your decisions", "Contract details needed", "Agreement in preparation", "Approved", "Active", "Suspended", "Expired", "Archived", "Cancelled"]);
  assert.deepEqual(rows.map((row) => [row.getAttribute("data-action"), row.getAttribute("data-id")]), [
    ["agreement.open", "agreement-core-9102"], ["agreement.open", "agreement-core-9101"], ["agreement.open", "agreement-core-9103"],
    ["agreement.open", "agreement-core-9104"], ["agreement.open", "agreement-core-9095"], ["agreement.open", "agreement-core-9100"],
    ["agreement.open", "agreement-core-9098"], ["agreement.open", "agreement-core-9099"], ["agreement.open", "agreement-core-9097"],
    ["agreement.open", "agreement-core-9096"],
  ]);

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
  assert.equal(button.getAttribute("data-id"), "quote-9101-7101");
  assert.equal(one(foothill, ".proposal-card__meta").textContent, "4820 Foothill Court, Lakewood, CO 80215 · 3 quotes");
  assert.equal(one(foothill, ".proposal-group__decision").textContent, "Option approved");
  assert.deepEqual(all(foothill, "[data-module=\"quote-row\"]").map((row) => [one(row, ".proposal-option__model").textContent, (one(row, ".proposal-option__total") || { textContent: null }).textContent, one(row, "[data-module=\"status-badge\"]").textContent]), [
    ["Per service", "$266.51", "✕ Declined"],
    ["Monthly", "$9,322.74", "✓ Approved"],
    ["Seasonal", "$8,875.13", "✕ Declined"],
  ], "each option shows Core's grand total, never one computed from an area");
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
  state.pagreements = [agreementDocument(["QUOTATION"], { ORDERS: { value: [] } })];
  refreshProposals();
  const page = ProposalsList();
  assert.equal(page.getAttribute("data-state"), "preparing");
  const block = one(page, "[data-module=\"quote-preparing\"]");
  assert.equal(block.getAttribute("data-state"), "preparing");
  assert.equal(block.textContent, "◔We have your requestWe’re preparing your quote. It appears here as soon as we send it to you.");
  assert.equal(page.textContent, "Your contracts" + block.textContent, "no count, pill, rollup, map, agreement or footer claims a quote exists");
  assert.equal(all(page, "[data-module=\"proposal-rollup\"]").length + all(page, ".proposals-head__pill").length + all(page, "[data-module=\"portfolio-map\"]").length + all(page, "[data-module=\"agreement-row\"]").length, 0);

  state.porders = [];
  state.pagreements = [];
  refreshProposals();
  const empty = ProposalsList();
  assert.equal(empty.getAttribute("data-state"), "empty");
  assert.equal(one(empty, "h1").textContent, "Your contracts", "an empty page is titled like the navigation, never as a list of quotes");
  assert.equal(one(empty, "[data-module=\"empty-state\"]").textContent, "📄No contracts yetWhen we send you a quote or a service agreement, it shows up here.");
  assert.equal(all(empty, "[data-module=\"quote-preparing\"]").length, 0);
}

{
  configureFixture();
  const decidedOnce = new Set();
  state.porders = state.porders.filter((order) => order.id !== 8113).map((order) => {
    if (Math.floor(order.id / 100) !== 81) return order;
    const property = order.attributes[5].SERVICE_PROPERTY.value;
    const final = decidedOnce.has(property) ? "DECLINED" : "CLIENT_APPROVED";
    decidedOnce.add(property);
    return Object.assign({}, order, { states: [{ code: "QUOTE_VIEWED" }, { code: final }] });
  });
  state.pagreements = state.pagreements.map((agreement) => agreement.id === 9101 ? Object.assign({}, agreement, { states: agreement.states.concat({ code: "DRAFT" }) }) : agreement);
  refreshProposals();
  const page = ProposalsList();
  const head = one(page, "[data-module=\"quote-package-head\"]");
  assert.equal(one(head, "h1").textContent, "Your contracts");
  assert.equal(one(head, ".proposals-head__sub").textContent, "10 service agreements", "once every package is past review the page counts agreements, not quotes");
  assert.equal(all(head, ".proposals-head__pill").length, 0, "there is nothing left to decide");
  assert.equal(all(page, "[data-module=\"quote-package-footer\"]").length, 0);
  assert.equal(all(page, "[data-module=\"quote-preparing\"]").length, 0);
  assert.equal(all(page, "[data-module=\"contracts-quotes\"]").length, 0, "decided quotes of drafted agreements move to the agreement pages");
  assert.equal(one(page, "[data-id=\"agreement-core-9101\"] [data-module=\"status-badge\"]").textContent, "Agreement in preparation");
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
  state.currentSiteId = "s2";
  const older = ProposalDetail();
  assert.equal(one(older, "[data-visual-id=\"proposal-back\"]").textContent, "‹ Back to proposal", "the older proposal detail keeps its own page");
  assert.equal(all(older, "[data-module=\"beam-report\"]").length, 1);
  assert.equal(all(older, "[data-module=\"plan-option\"]").length, 3);
  assert.match(older.textContent, /Pay-as-you-go · Order #34897/);
  assert.equal(one(older, "[data-visual-id=\"proposal-approve\"]").getAttribute("data-action"), "proposal.approve");
}

{
  configureFixture();
  state.currentSiteId = "quote-9101-7101";
  const decided = ProposalDetail();
  assert.equal(decided.getAttribute("data-state"), "approved");
  assert.equal(one(decided, "[data-visual-id=\"proposal-back\"]").textContent, "‹ Back to your contracts");
  assert.equal(one(decided, "h1").textContent, "Foothill Court");
  assert.equal(one(decided, ".proposal-detail-head__meta").textContent, "4820 Foothill Court, Lakewood, CO 80215 · Service period Nov 1, 2026 – Mar 31, 2027", "the address comes from the Order's SERVICE_ADDRESS");
  const link = one(decided, "[data-module=\"quote-package-link\"]");
  assert.equal(link.getAttribute("data-action"), "agreement.open");
  assert.equal(link.getAttribute("data-id"), "agreement-core-9101");
  assert.equal(link.textContent, "Part of your service agreementAwaiting your decisions›");
  assert.equal(one(decided, "[data-module=\"quote-decided\"]").textContent, "iYou approved Monthly. The other options for this property are declined.", "the note repeats what Core read back, including the declined siblings");
  const cards = all(decided, "[data-module=\"quote-option\"]");
  assert.deepEqual(cards.map((card) => [one(card, ".quote-option__model").textContent, card.getAttribute("data-state")]), [["Per service", "declined"], ["Monthly", "approved"], ["Seasonal", "declined"]]);
  const monthly = cards[1];
  assert.deepEqual(all(monthly, ".quote-line").map((row) => [one(row, ".purch-line__title").textContent, one(row, ".purch-line__meta").textContent, one(row, ".purch-line__side").textContent]), [
    ["Snow clearing", "5 × $1,256.00", "$6,280.00"],
    ["De-icing", "5 × $556.00", "$2,780.00"],
  ], "each line is its product, quantity, unit price and Core's line total");
  assert.deepEqual(all(monthly, ".money-rows__row").map((row) => row.textContent), ["Subtotal$9,060.00", "Taxes$262.74", "Total$9,322.74"]);
  assert.equal(all(decided, "[data-action=\"quote.approve\"]").length + all(decided, "[data-action=\"quote.decline\"]").length, 0, "a decided property offers no decision a terminal Order could not take");
  for (const retired of RETIRED) assert.ok(!decided.textContent.includes(retired), "the quote detail must not show " + JSON.stringify(retired));
  assert.equal(all(decided, "[data-module=\"beam-report\"]").length + all(decided, "[data-module=\"plan-option\"]").length, 0, "the Beam AI block and the hard-coded plans are gone from the package");

  state.currentSiteId = "quote-9101-7102";
  const revision = ProposalDetail();
  assert.equal(one(revision, "[data-module=\"quote-decided\"]").textContent, "iYou asked for changes to these quotes. Our team is reviewing your request.");
  assert.equal(all(revision, "[data-action=\"quote.approve\"]").length, 0, "an Order with changes requested waits for the operator, not the customer");

  state.currentSiteId = "quote-9101-7103";
  assert.equal(one(ProposalDetail(), "[data-module=\"quote-decided\"]").textContent, "iYou declined the quotes for this property.");

  state.quoteViews = { 8111: "pending", 8112: "failed" };
  state.currentSiteId = "quote-9101-7104";
  const open = ProposalDetail();
  assert.equal(open.getAttribute("data-state"), "viewed");
  assert.equal(all(open, "[data-module=\"quote-decided\"]").length, 0);
  const openCards = all(open, "[data-module=\"quote-option\"]");
  assert.deepEqual(openCards.map((card) => card.getAttribute("data-state")), ["viewed", "unseen", "unseen"]);
  assert.deepEqual(all(openCards[0], "[data-action]").map((button) => [button.getAttribute("data-action"), button.getAttribute("data-id"), button.textContent]), [
    ["quote.approve", "8110", "Approve"],
    ["quote.decline", "8110", "Decline"],
  ], "a viewed quote offers approve and decline, and nothing that requests changes");
  assert.equal(one(openCards[1], "[data-module=\"command-pending\"]").textContent, "Letting the provider know you opened this quote…");
  assert.equal(all(openCards[1], "[data-action=\"quote.approve\"]").length, 0, "an unseen quote cannot be decided before its view is read back");
  const retry = one(openCards[2], "[data-module=\"command-failure\"]");
  assert.match(retry.textContent, /couldn’t let the provider know you opened this quote/);
  assert.equal(one(retry, "[data-action]").getAttribute("data-action"), "quote.retryView");
  assert.equal(one(retry, "[data-action]").getAttribute("data-id"), "8112");
  assert.equal(one(open, "[data-module=\"quote-detail-footer\"]").textContent, "✦Approving one option for this property declines its other options.");

  state.contractConfirm = { kind: "approve", backendId: 8110 };
  const confirming = one(ProposalDetail(), "[data-module=\"decision-confirm\"]");
  assert.equal(confirming.getAttribute("data-kind"), "approve");
  assert.equal(one(confirming, ".decision-confirm__title").textContent, "Approve Per service for this property?");
  assert.equal(one(confirming, ".decision-confirm__body").textContent, "Approving it declines the other options for this property.", "the rule is stated before the customer agrees, and the page still waits for Core to apply it");
  assert.deepEqual(all(confirming, "[data-action]").map((button) => [button.getAttribute("data-action"), button.textContent, button.hasAttribute("disabled")]), [
    ["quote.confirm", "Confirm approval", false],
    ["quote.cancel", "Cancel", false],
  ]);

  state.contractCommand = { kind: "approve", targets: [8110], phase: "pending" };
  const pending = one(ProposalDetail(), "[data-module=\"decision-confirm\"]");
  assert.equal(pending.getAttribute("data-state"), "pending");
  assert.deepEqual(all(pending, "[data-action]").map((button) => [button.textContent, button.hasAttribute("disabled")]), [["Sending…", true], ["Cancel", true]], "one command at a time: nothing can be sent or cancelled while it is in flight");

  state.contractConfirm = null;
  state.contractCommand = { kind: "approve", targets: [8111], phase: "pending" };
  const viewedOption = findQuote(quotePackage(), 8110);
  assert.equal(viewedOption.status, "viewed");
  assert.deepEqual(all(QuoteOptionCard(viewedOption, { interactive: true, busy: true }), "[data-action]").map((button) => [button.textContent, button.hasAttribute("disabled")]), [["Approve", true], ["Decline", true]], "while another option's command is in flight this option cannot be decided");
  assert.deepEqual(all(QuoteOptionCard(viewedOption, { interactive: true, busy: false }), "[data-action]").map((button) => [button.textContent, button.hasAttribute("disabled")]), [["Approve", false], ["Decline", false]]);

  state.contractConfirm = { kind: "decline", backendId: 8110 };
  state.contractCommand = null;
  const declining = one(ProposalDetail(), "[data-module=\"decision-confirm\"]");
  assert.equal(one(declining, ".decision-confirm__title").textContent, "Decline Per service?");
  assert.equal(one(declining, ".decision-confirm__body").textContent, "A declined option can’t be approved later.");
  assert.equal(one(declining, "[data-action=\"quote.confirm\"]").textContent, "Confirm decline");

  state.contractConfirm = null;
  for (const [phase, expected] of [
    ["failed", "We couldn’t confirm whether this went through. Refresh the status before trying again."],
    ["refused", "This decision wasn’t accepted, so nothing was changed."],
    ["unconfirmed", "Your decision didn’t register — this is still waiting for it. Nothing else was changed."],
  ]) {
    state.contractCommand = { kind: "approve", targets: [8110], phase };
    const card = all(ProposalDetail(), "[data-module=\"quote-option\"]")[0];
    const failure = one(card, "[data-module=\"command-failure\"]");
    assert.equal(failure.getAttribute("data-state"), "failed");
    assert.ok(failure.textContent.includes(expected), phase + " explains itself");
    assert.equal(one(failure, "[data-action]").getAttribute("data-action"), "contracts.refresh");
    assert.equal(all(card, "[data-action=\"quote.approve\"]").length, 1, "after a failed command the readback still offers the decision");
  }
  state.contractCommand = { kind: "approve", targets: [8110], phase: "conflict" };
  assert.equal(one(all(ProposalDetail(), "[data-module=\"quote-option\"]")[0], "[data-module=\"command-conflict\"]").textContent, "↺This changed since you opened itIts current state is shown here. Nothing was sent.");
  const settled = quoteGroupFor("quote-9101-7101").orders.find((order) => order.status === "declined");
  state.contractCommand = { kind: "approve", targets: [settled.backendId], phase: "conflict" };
  const movedOn = QuoteOptionCard(settled, { interactive: true, busy: false });
  assert.equal(one(movedOn, "[data-module=\"command-conflict\"]").textContent, "↺This changed since you opened itIts current state is shown here. Nothing was sent.", "a quote that left its decidable state still explains why nothing was sent");
  assert.equal(all(movedOn, "[data-action=\"quote.approve\"]").length + all(movedOn, "[data-action=\"quote.decline\"]").length, 0);
  state.contractCommand = null;
  assert.equal(all(QuoteOptionCard(settled, { interactive: true, busy: false }), ".quote-option__decide").length, 0, "without a command a decided quote carries no decision area");

  state.contractCommand = { kind: "approve", targets: [8110], phase: "readback-failed" };
  const readback = ProposalDetail();
  assert.equal(readback.getAttribute("data-state"), "readback-failed");
  assert.equal(one(readback, "[data-module=\"contracts-readback-failed\"]").textContent, "⚠Your approval was sent, but the quote’s current status couldn’t be loadedNothing is shown until it loads, so you never see an out-of-date status.Try again");
  assert.equal(all(readback, "[data-module=\"quote-option\"]").length, 0, "a stale quote is never shown after its command");
  state.contractCommand = null;
  state.quoteViews = {};

  state.currentSiteId = "quote-9999-1";
  const missing = ProposalDetail();
  assert.equal(missing.getAttribute("data-state"), "not-found");
  assert.equal(one(missing, "[data-module=\"not-found-state\"]").textContent, "∅We can’t find that quoteIt may have been removed or the link may be out of date. Everything you can open is on your contracts page.Back to contracts");
}

{
  configureFixture();
  state.agreementId = "agreement-core-9102";
  const page = AgreementDetail();
  assert.equal(page.getAttribute("data-state"), "approval");
  assert.equal(one(page, "[data-visual-id=\"agreement-back\"]").textContent, "‹ Back to your contracts");
  assert.equal(one(page, ".agreement-detail-head__eyebrow").textContent, "Service agreement");
  assert.equal(one(page, "h1").textContent, "Alkire Street and Braun Court");
  assert.equal(one(page, ".proposal-detail-head__meta").textContent, "2 properties · 4 quotes");
  assert.equal(one(page, "[data-module=\"agreement-detail-head\"] [data-module=\"status-badge\"]").textContent, "Ready for your approval");
  assert.equal(one(page, "[data-module=\"agreement-notice\"]").textContent, "Read the parties, services and terms below, then approve the agreement.");
  const facts = (card) => all(card, ".agreement-facts__row").map((row) => [one(row, "dt").textContent, one(row, "dd").textContent]);
  const parties = all(page, "[data-module=\"agreement-party\"]");
  assert.deepEqual(facts(parties[0]), [["Legal name", "Granite Ridge Snow Removal LLC"], ["Representative", "Jordan Pike, Contracts Manager"]]);
  assert.deepEqual(facts(parties[1]), [
    ["Legal name", "Whitlock Property Group LLC"],
    ["Client type", "Organization"],
    ["Billing address", "1550 Wynkoop Street, Suite 400, Denver, CO 80202"],
    ["Representative", "Dana Whitlock, Portfolio Manager"],
    ["Email", "dana.whitlock@example.test"],
    ["Phone", "+1 (303) 555-0164"],
  ]);
  assert.deepEqual(facts(one(page, "[data-module=\"agreement-term\"]")), [["Effective date", "Oct 20, 2026"], ["Starts", "Nov 1, 2026"], ["Ends", "Mar 31, 2027"]]);
  const services = one(page, "[data-module=\"agreement-services\"]");
  assert.equal(one(services, ".agreement-section-head__sub").textContent, "The options you approved");
  assert.deepEqual(all(services, "[data-module=\"agreement-property\"]").map((entry) => [one(entry, ".agreement-property__title").textContent, (one(entry, ".agreement-property__address") || { textContent: "" }).textContent, all(entry, "[data-module=\"quote-option\"]").map((card) => one(card, ".quote-option__model").textContent).join("|")]), [
    ["Alkire Street", "210 Alkire Street, Arvada, CO 80004", "Seasonal"],
    ["Braun Court", "247 Braun Court, Golden, CO 80401", "Monthly"],
  ], "an agreement lists each property with its approved option; without SERVICE_ADDRESS the property's own address is shown");
  assert.equal(all(services, "[data-action]").length, 0, "services inside an agreement are read-only");
  const terms = one(page, "[data-module=\"agreement-terms\"]");
  assert.equal(one(terms, ".terms-heading").textContent, "Winter service terms");
  assert.deepEqual(all(terms, ".terms-num").map((row) => [row.getAttribute("data-depth"), one(row, ".terms-num__marker").textContent, one(row, ".terms-num__text").textContent.slice(0, 18)]), [
    ["1", "1.", "Services"], ["2", "1.1", "Granite Ridge clea"], ["2", "1.2", "Every visit is log"],
    ["1", "2.", "Service triggers"], ["2", "2.1", "Clearing starts on"], ["2", "2.2", "De-icing is applie"],
    ["1", "3.", "Invoicing"], ["1", "4.", "Access"], ["2", "1)", "Gate codes are sha"], ["2", "2)", "Blackout days are "],
  ]);
  assert.equal(all(terms, ".terms-list li").length, 3);
  assert.equal(all(terms, "*").filter((node) => node.tagName === "SCRIPT" || node.tagName === "A").length, 0);
  assert.equal(all(page, "[data-module=\"agreement-approve\"]").length, 1);
  assert.deepEqual(all(one(page, "[data-module=\"agreement-approve\"]"), "[data-action]").map((button) => [button.getAttribute("data-action"), button.getAttribute("data-id"), button.textContent]), [["agreement.approve", "9102", "Approve agreement"]]);
  for (const retired of ["PDF", "Download", "Request changes"]) assert.ok(!page.textContent.includes(retired), "the agreement page offers no " + retired);

  state.contractConfirm = { kind: "agreement", backendId: 9102 };
  const confirm = one(AgreementDetail(), "[data-module=\"agreement-approve\"]");
  assert.equal(one(confirm, ".decision-confirm__title").textContent, "Approve this service agreement?");
  assert.equal(one(confirm, ".decision-confirm__body").textContent, "You approve it on behalf of Whitlock Property Group LLC.");
  assert.deepEqual(all(confirm, "[data-action]").map((button) => button.getAttribute("data-action")), ["agreement.confirm", "agreement.cancel"]);
  state.contractCommand = { kind: "agreement", targets: [9102], phase: "pending" };
  assert.equal(one(AgreementDetail(), "[data-action=\"agreement.confirm\"]").textContent, "Sending…");
  state.contractCommand = { kind: "agreement", targets: [9102], phase: "refused" };
  state.contractConfirm = null;
  assert.match(one(AgreementDetail(), "[data-module=\"agreement-approve\"] [data-module=\"command-failure\"]").textContent, /wasn’t accepted/);
  state.contractCommand = { kind: "agreement", targets: [9102], phase: "readback-failed" };
  assert.equal(one(AgreementDetail(), "[data-module=\"contracts-readback-failed\"] .state-block__title").textContent, "Your approval was sent, but the agreement’s current status couldn’t be loaded");
  state.agreementId = "agreement-core-9100";
  state.contractCommand = { kind: "agreement", targets: [9100], phase: "conflict" };
  const changed = AgreementDetail();
  assert.equal(one(changed, "[data-module=\"agreement-approve\"]").getAttribute("data-state"), "conflict", "an agreement that left SENT_TO_CLIENT still explains why nothing was sent");
  assert.equal(one(changed, "[data-module=\"agreement-approve\"]").textContent, "Your approval↺This changed since you opened itIts current state is shown here. Nothing was sent.");
  assert.equal(all(changed, "[data-action=\"agreement.approve\"]").length, 0);
  state.contractCommand = null;

  state.agreementId = "agreement-core-9101";
  const review = AgreementDetail();
  assert.equal(one(review, "[data-module=\"agreement-notice\"]").textContent, "The quotes in this agreement are waiting for your decisions.Go to your quotes ›");
  assert.equal(facts(all(review, "[data-module=\"agreement-party\"]")[0])[0][1], "Granite Ridge Snow Removal", "before the provider fields are written the owning organization names the provider");
  assert.deepEqual(facts(all(review, "[data-module=\"agreement-party\"]")[1]).map((row) => row[1]), ["Dana Whitlock", "Not stated", "Not stated", "Not stated", "Not stated", "Not stated"]);
  assert.equal(all(review, "[data-module=\"agreement-term\"]").length, 0, "no term is shown before the agreement carries one");
  assert.equal(one(review, "[data-module=\"agreement-terms\"] .quote-option__note").textContent, "The agreement text isn’t included yet.");
  assert.equal(all(review, "[data-module=\"agreement-approve\"]").length, 0);
  assert.equal(all(review, "[data-module=\"agreement-property\"]").length, 4, "in review the agreement lists every option it collects");

  for (const [id, stage, notice] of [
    ["agreement-core-9103", "details", "We need your contract details before we can prepare this agreement."],
    ["agreement-core-9104", "drafting", "We’re preparing this agreement. It appears here for your approval once it’s ready."],
    ["agreement-core-9100", "active", "This agreement is active."],
    ["agreement-core-9099", "expired", "This agreement has expired. It is shown for reference."],
    ["agreement-core-9095", "approved", "You approved this agreement."],
    ["agreement-core-9098", "suspended", "This agreement is suspended. It is shown for reference."],
    ["agreement-core-9097", "archived", "This agreement is archived. It is shown for reference."],
    ["agreement-core-9096", "canceled", "This agreement was cancelled. It is shown for reference."],
  ]) {
    state.agreementId = id;
    const detail = AgreementDetail();
    assert.equal(detail.getAttribute("data-state"), stage);
    assert.equal(one(detail, "[data-module=\"agreement-notice\"]").textContent, notice);
    assert.equal(all(detail, "[data-module=\"agreement-approve\"]").length, 0, stage + " offers no approval");
  }

  state.agreementId = "agreement-core-1";
  assert.equal(AgreementDetail().getAttribute("data-state"), "not-found");
  assert.equal(contractAgreementFor("agreement-core-9102").properties.length, 2);
  assert.equal(quoteGroupFor("gr-foothill").id, "quote-9101-7101", "a property's fixture key still finds its current quotes");
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
    delete state.moduleStatus.proposals;
  };

  configureLive();
  const liveAdapter = modules.proposals.adapter({ config: state.config, state });
  assert.deepEqual(["load", "readOrder", "readAgreement", "sendOrderEvent", "sendAgreementEvent"].filter((name) => typeof liveAdapter[name] === "function").length, 5, "live snow Contracts read and decide through the Core snow adapter");
  assert.throws(() => modules.proposals.adapter({ config: Object.assign({}, state.config, { vertical: "hvac" }), state }), /not opened/, "no other vertical's live proposals are opened by this adapter");
  assert.equal(modules.proposals.failureEnvelope({ config: state.config, state }, { code: "live-adapter-not-opened" }).state, "unavailable");
  assert.equal(modules.proposals.failureEnvelope({ config: state.config, state }, { code: "customer-forbidden" }).state, "unauthorized");
  assert.equal(modules.proposals.failureEnvelope({ config: state.config, state }, { code: "core-request-failed" }).state, "error");
  assert.equal(quotePackage(), null);
  assert.equal(state.porders.length, 0, "live mode carries no fixture Orders");
  assert.equal(state.pagreements.length, 0, "live mode carries no fixture agreements");
  const loading = ProposalsList();
  assert.equal(loading.getAttribute("data-state"), "loading", "a live Contracts page waits for Core instead of showing the fixture proposal");
  assert.equal(one(loading, "[data-module=\"contracts-loading\"]").getAttribute("aria-busy"), "true");
  for (const fixtureFact of ["Proposal #", "Foothill", "Dana", "Beam AI"]) assert.ok(!loading.textContent.includes(fixtureFact));

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
  const forecastFailed = Overview();
  assert.equal(all(forecastFailed, "[data-module=\"error-state\"]").length, 0, "a failed forecast leaves the properties on screen");
  assert.equal(one(forecastFailed, "[data-module=\"weather-summary\"]").getAttribute("data-state"), "error", "the weather card owns the failed forecast");
  assert.ok(one(forecastFailed, "[data-module=\"property-map\"]"));

  configureLive({ portalServiceGeography: "" });
  state.moduleData.properties = { state: "ready", items: [] };
  const noGeography = Overview();
  assert.equal(one(noGeography, "[data-module=\"weather-summary\"]").getAttribute("data-state"), "unavailable");
  assert.match(one(noGeography, "[data-module=\"weather-summary\"]").textContent, /isn’t set up for this portal yet/);
  assert.ok(one(noGeography, "[data-module=\"property-map\"]"), "a home without a service area still lists the properties");

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
  const liveContracts = one(page, "[data-module=\"active-contracts\"]");
  assert.equal(liveContracts.getAttribute("data-state"), "loading", "the home widget waits for the live Contracts read instead of saying there is no contract");
  assert.equal(all(liveContracts, "[data-module=\"section-unavailable\"]").length, 0, "Contracts is live, so the home no longer says it is not in the portal");
  assert.equal(all(liveContracts, "[data-state=\"empty\"]").length, 0);
  assert.equal(all(page, "[data-module=\"quote-preparing\"]").length, 0, "the live home claims no preparation");
  const tooltipless = one(page, "[data-module=\"property-row\"]");
  assert.equal(all(tooltipless, ".ov-prow__addr").length, 0, "an absent address renders as absent");
  assert.equal(tooltipless.getAttribute("data-state"), null, "a live property row carries no status derived from unread visits and tickets");
  assert.equal(all(tooltipless, ".ov-tip__tag").length, 0);

  const LIVE_CLAIMS = ["Not under contract", "No visit booked", "Dispatch", "dispatch", "trigger", "Active Monitoring", "En Route", "Issue Opened", "Back to appointments", "not on your contract"];
  state.propertyId = "prop-core-278";
  const detail = PropertyDetail();
  assert.deepEqual(all(detail, "[data-fact]").map((fact) => fact.getAttribute("data-fact")), ["contract"], "no zone, lot, quote or map fact is invented for a live property");
  assert.equal(all(detail, ".prop-head__addr").length, 0);
  assert.equal(all(detail, ".status-badge").length, 0, "a live property header shows no status rather than Active Monitoring");
  const contractFact = one(detail, "[data-fact=\"contract\"]");
  assert.equal(contractFact.getAttribute("data-state"), "loading", "the agreement fact waits for the live Contracts read");
  assert.equal(one(contractFact, ".prop-fact__label").textContent, "Service agreement");
  const visits = one(detail, "[data-module=\"property-visits\"]");
  assert.equal(visits.getAttribute("data-state"), "unavailable");
  assert.equal(one(visits, "[data-module=\"section-unavailable\"]").textContent, "Not available yetScheduled visits aren’t in the portal yet.");
  assert.equal(all(visits, "[data-action]").length, 0, "the week view is not reachable live, so the section offers nothing");
  assert.equal(one(detail, ".detail-back").getAttribute("data-id"), "overview");
  assert.equal(one(detail, ".detail-back").textContent, "‹ Back to home");
  for (const claim of LIVE_CLAIMS) assert.ok(!detail.textContent.includes(claim), "live property detail never says \"" + claim + "\"");
  state.propertyId = "prop-core-missing";
  assert.doesNotMatch(PropertyDetail().textContent, /contract/i, "a live property that is not found is not said to be off a contract");
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
  assert.equal(one(keyless, "[data-fact=\"quotes\"] .link-action").getAttribute("data-id"), "quote-9101-7101", "the property's quotes open their package group");
  assert.equal(one(keyless, ".detail-back").textContent, "‹ Back to appointments", "fixture mode keeps its appointments week");
  assert.equal(all(keyless, ".prop-head .status-badge").length, 1, "fixture mode still states the property status");

  const unbooked = overviewProperties.find((property) => !property.appointment && !property.ticket);
  state.propertyId = unbooked.id;
  const quiet = PropertyDetail();
  assert.match(quiet.textContent, /No visit booked\. Dispatch happens automatically when your trigger is met\./, "fixture mode still explains dispatch for a property with no visit");
  assert.equal(one(quiet, ".prop-head .status-badge").textContent, "Active Monitoring");
  const savedContract = unbooked.contract;
  unbooked.contract = null;
  try {
    assert.equal(one(PropertyDetail(), "[data-fact=\"contract\"] .prop-fact__value").textContent, "Not under contract", "fixture mode still says a property without a contract is not under contract");
  } finally {
    unbooked.contract = savedContract;
  }

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

console.log("snow-contracts-check ok: Orders, their lines and the agreement document normalize with absent data left absent and every figure taken from Core, the terms keep their headings, items and numbered outline as text, the Contracts page lists agreements by what they need from the customer and quotes by property with a true rollup, the quote detail shows each option's lines and server totals with approve and decline only for a viewed quote and no retired Beam or plan claims, the agreement detail shows parties, term, approved services and terms with approval only when sent, and live mode opens Contracts through the snow adapter while other verticals stay closed");

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
