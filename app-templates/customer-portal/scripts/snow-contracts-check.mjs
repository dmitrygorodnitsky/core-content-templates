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
  ORDER_SERVICE_STAGES,
  contractsPackage,
  findQuote,
  formatDatePeriod,
  formatIsoDate,
  formatMoney,
  formatOrderPrice,
  formatOrderTotal,
  groupStatus,
  pricingDisplay,
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
const { QuoteApproval } = await load("src/routes/QuoteApprovalPage.js");
const { QuoteOptionCard } = await load("src/components/proposals/QuoteOptionCard.js");
const { AgreementDetail } = await load("src/routes/AgreementDetailPage.js");
const { AgreementParties } = await load("src/components/proposals/AgreementParts.js");
const { Overview } = await load("src/routes/OverviewPage.js");
const { PropertyDetail } = await load("src/routes/PropertyDetailPage.js");
const { propertyPlan } = await load("src/property-plan.js");
const { PropertyPlan } = await load("src/components/storm/PropertyPlan.js");

const plain = (value) => JSON.parse(JSON.stringify(value));
const PERIOD = { SERVICE_PERIOD_START: { value: "2026-11-01" }, SERVICE_PERIOD_END: { value: "2027-03-31" } };
const SENT = ["DRAFT", "QUOTE_PREPARED", "QUOTE_APPROVED", "QUOTE_SENT"];

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
    orderRow(502, SENT, Object.assign({ SERVICE_PROPERTY: { value: "278" }, PRICING_MODEL: { value: "MONTHLY" } }, PERIOD)),
    orderRow(503, SENT.concat("ACCEPTED"), Object.assign({ SERVICE_PROPERTY: { value: 430 }, PRICING_MODEL: { value: "SEASONAL" } }, PERIOD), { grandTotal: "8625.50" }),
    orderRow(504, SENT.concat("DECLINED"), { SERVICE_PROPERTY: { value: 430 }, PRICING_MODEL: { value: "MONTHLY" } }, { grandTotal: null }),
    orderRow(505, SENT.concat("CUSTOMER_CHANGES_REQUESTED"), { SERVICE_PROPERTY: { value: 431 }, PRICING_MODEL: { value: "toString" } }, { grandTotal: 1200, currency: null }),
    orderRow(506, ["DRAFT"], { SERVICE_PROPERTY: { value: 432 } }),
    orderRow(507, ["DRAFT", "QUOTE_PREPARED"], {}),
    orderRow(508, ["SOMETHING_NEW"], { SERVICE_PROPERTY: { value: 278 } }),
    orderRow(509, SENT, { SERVICE_PROPERTY: { value: 278 } }, { type: { id: 9, code: "SUBSCRIPTION_ORDER" } }),
    orderRow(null, SENT, {}),
    orderRow(510, SENT, { PRICING_MODEL: { value: "HOURLY" }, SERVICE_PERIOD_START: { value: "2026-02-30" }, SERVICE_PERIOD_END: { value: "2027-03-31" } }, { grandTotal: -5 }),
    orderRow(511, SENT, { SERVICE_PROPERTY: { value: true }, PRICING_MODEL: { value: null } }, { grandTotal: "", currency: { code: "cad" } }),
  ],
};

{
  assert.deepEqual(plain(coreSnowContract.customerQuoteStatus), {
    ACCEPTED: "approved", ACTIVE: "approved", SUSPENDED: "approved", COMPLETED: "approved", CANCELED: "cancelled",
    CUSTOMER_CHANGES_REQUESTED: "revision", DECLINED: "declined", QUOTE_SENT: "unseen",
  }, "the tenant adapter and the customer-scope normalizer read one set of ORDER_LIFECYCLE states since 2026-11-09: a sent quote, the client's decision, and the service life of an accepted order");
  assert.deepEqual(plain(coreSnowContract.operatorQuoteStates), ["CHANGES_REQUESTED", "DRAFT", "QUOTE_APPROVED", "QUOTE_PREPARED"], "the quote branch before QUOTE_SENT belongs to the operator");

  const { orders, preparing, withheldBackendIds } = normalizeQuoteOrders(orderList);
  assert.deepEqual(orders.map((order) => order.backendId), [501, 502, 503, 504, 505, 510, 511], "operator-side, unknown-state, other-type and id-less rows are not rows");
  assert.deepEqual(orders.map((order) => order.status), ["unseen", "unseen", "approved", "declined", "revision", "unseen", "unseen"]);
  assert.deepEqual(orders.map((order) => order.propertyBackendId), [278, 278, 430, 430, 431, null, null], "a string id is an id, and a boolean is not a property even though Number(true) is 1");
  assert.deepEqual(orders.map((order) => order.pricingModel && order.pricingModel.label), ["Per service", "Monthly", "Seasonal", "Monthly", null, null, null], "an unknown or inherited-name pricing model has no label and never shows its code");
  assert.deepEqual(plain(orders.map((order) => order.total)), [null, null, { amount: 8625.5, currency: "CAD" }, null, null, null, null], "a zero, null, negative or empty total, or one without a currency, renders as absent");
  assert.ok(orders.every((order) => !("servicePeriod" in order)), "an Order's SERVICE_PERIOD_START/END are never read: they are always empty and leave the Order type");
  const withoutRemoved = { result: orderList.result.map((row) => Object.assign({}, row, { attributes: { 5: Object.fromEntries(Object.entries(row.attributes[5]).filter(([code]) => !/^(SERVICE_PERIOD_START|SERVICE_PERIOD_END|EFFECTIVE_DATE|CLIENT)$/.test(code))) } })) };
  const removedOnOrders = { result: orderList.result.map((row) => Object.assign({}, row, { attributes: { 5: Object.assign({}, row.attributes[5], { CLIENT: { value: 999 }, EFFECTIVE_DATE: { value: "2026-11-01" } }, PERIOD) } })) };
  assert.deepEqual(plain(normalizeQuoteOrders(removedOnOrders)), plain(normalizeQuoteOrders(withoutRemoved)), "Order SERVICE_PERIOD_START/END, EFFECTIVE_DATE and CLIENT change nothing the portal shows");
  assert.equal(preparing, true, "an Order the operator has not sent switches the preparing state on");
  assert.deepEqual(withheldBackendIds, [506, 507], "withheld Orders are remembered only so an agreement can tell them from unreadable ones");
  assert.ok(orders.every((order) => /^quote-core-\d+$/.test(order.id)), "a row is identified by its Core id only");
  const decide = ["approve", "changes", "decline"];
  assert.deepEqual(orders.map((order) => order.allowedActions), [decide, decide, [], [], [], decide, decide], "QUOTE_SENT is decided or sent back with a change request as it is shown; ORDER_LIFECYCLE has no view event");
  assert.equal(orders[2].money.total, "CA$8,625.50", "the server's total is formatted, never recomputed");
  assert.deepEqual(Object.keys(orders[2].money), ["total"], "a quote states only its total: no subtotal and no taxes");
  assert.equal(orders[0].money, null, "an unpriced Order states no money at all");
  assert.ok(orders.every((order) => order.linesState === "unavailable" && order.lines.length === 0), "without a line read every Order says its lines are unavailable rather than empty");

  assert.equal(normalizeQuoteOrders({ resultSize: 1, result: [orderRow(1, SENT)] }).preparing, false);
  assert.equal(normalizeQuoteOrders({ result: [orderRow(1, ["SOMETHING_NEW"])] }).preparing, false, "a state nobody has named is neither a quote nor preparation");
  for (const retired of ["INITIAL", "QUOTE_APPROVED_INTERNALLY", "QUOTE_VIEWED", "CLIENT_APPROVED"]) {
    assert.deepEqual(plain(normalizeQuoteOrders({ result: [orderRow(1, [retired])] })), { orders: [], preparing: false, withheldBackendIds: [] }, retired + " is a GENERAL_FSM_ORDER state, retired by ORDER_LIFECYCLE on 2026-11-09");
  }
  const service = normalizeQuoteOrders({ result: ["ACCEPTED", "ACTIVE", "SUSPENDED", "COMPLETED", "CANCELED"].map((code, index) => orderRow(index + 1, SENT.concat("ACCEPTED", code))) }).orders;
  assert.deepEqual(plain(service.map((order) => [order.stateCode, order.status, order.allowedActions])), [
    ["ACCEPTED", "approved", []], ["ACTIVE", "approved", []], ["SUSPENDED", "approved", []], ["COMPLETED", "approved", []], ["CANCELED", "cancelled", []],
  ], "every order after the client's acceptance stays the approved option, except a cancelled one, and none offers the client anything");
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
  assert.deepEqual(plain(orders[0].money), { total: "CA$2,444.72" }, "a quote states its total and nothing about taxes");
  const accepted = normalizeQuoteOrders([Object.assign({}, rows[0], { totalTaxes: 293.37, grandTotal: 2738.09 })], { ...catalog, orderItems: catalog.orderItems.map((line) => line.order.id === 7 ? { ...line, totalTaxes: 1, grandTotal: Number(line.grandTotal) + 1 } : line) }).orders[0];
  assert.deepEqual([plain(accepted.money), plain(accepted.total)], [{ total: "CA$2,444.72" }, { amount: 2444.72, currency: "CAD" }], "once Accept put taxes on the order, the total is still the server's charges before taxes, never the grandTotal with taxes");
  assert.deepEqual(accepted.lines.map((line) => [line.unitPrice, line.total]), [["CA$1,528.48", ""], ["CA$916.24", ""]], "and a taxed line keeps its price but shows no line total with taxes");
  const chargesUnknown = (taxes) => normalizeQuoteOrders([Object.assign({}, rows[0], { totalCharges: undefined, totalTaxes: taxes, grandTotal: 2738.09 })], catalog).orders[0].money;
  assert.deepEqual([chargesUnknown(293.37), plain(chargesUnknown(0))], [null, { total: "CA$2,738.09" }], "without totalCharges a taxed grandTotal is never shown, an untaxed one is");
  assert.deepEqual(orders.map((order) => Object.prototype.hasOwnProperty.call(order, "serviceAddress")), [false, false], "an Order's SERVICE_ADDRESS is never read: a property's address is its Resource's");
  assert.deepEqual(plain(orders[1].lines), [
    { key: "line-81", product: "", quantity: "12", unitPrice: "CA$12.50", total: "" },
    { key: "line-82", product: "", quantity: "", unitPrice: "", total: "" },
  ], "an unreadable price leaves the service unnamed, and a line total Core did not return is never multiplied out in the browser");
  assert.equal(orders[1].linesState, "partial", "a listed line that was not returned, or a price that was not readable, makes the lines partial");
  assert.equal(orders.length, 2, "the operator-side Order's lines never reach the customer");
  const withoutCatalog = normalizeQuoteOrders(rows, { orderItems: catalog.orderItems, productPrices: null, products: null }).orders[0];
  assert.deepEqual(withoutCatalog.lines.map((entry) => entry.product), ["", ""], "a failed catalog read names no service");
  assert.equal(withoutCatalog.linesState, "partial");
}

{
  const SNOW_PRICE = { id: 25, nls: { en: { NAME: "Snow Removal" } } };
  const DEICE_PRICE = { id: 28, nls: { en: { NAME: "Rock Salt De-Icing" } } };
  const price = (id, type, extra = {}) => Object.assign({ id, product: { id: id < 100 ? SNOW_PRICE.id : DEICE_PRICE.id }, type: type ? { id: 1, code: type } : null }, extra);
  const line = (id, order, priceId, metadata) => Object.assign({ id, order: { id: order }, itemPrice: { id: priceId }, amount: 100, itemCount: 1, sortOrder: id }, metadata === undefined ? {} : { metadata });
  const month = (count) => ({ QUOTE_TYPE: "IGNORED", INTERVAL_UNIT: "MONTH", INTERVAL_COUNT: count });
  const catalog = {
    orderItems: [
      line(1, 601, 27), line(2, 601, 135),
      line(3, 602, 52, month(1)), line(4, 602, 158, month(1)),
      line(5, 603, 224, month(5)), line(6, 603, 331, month(5)),
      line(7, 604, 52), line(8, 604, 158),
      line(9, 605, 224, month(5)), line(10, 605, 158, month(1)),
      line(11, 606, 52, { INTERVAL_UNIT: "WEEK", INTERVAL_COUNT: 1 }),
      line(12, 607, 60), line(13, 607, 160),
      line(14, 608, 27), line(15, 608, 52),
      line(16, 609, 70),
      line(17, 610, 27),
      line(18, 611, 61), line(19, 611, 161),
    ],
    productPrices: [
      price(27, "TIERED"), price(135, "TIERED"),
      price(52, "TIERED_RECURRENT"), price(158, "TIERED_RECURRENT"),
      price(224, "TIERED_RECURRENT"), price(331, "TIERED_RECURRENT"),
      price(60, "TIERED_RECURRENT", { nls: { en: { NAME: "Seasonal plan" } } }), price(160, "TIERED_RECURRENT", { nls: { en: { NAME: "Seasonal plan" } } }),
      price(70, null),
      price(61, "TIERED_RECURRENT", { nls: { en: { NAME: "Seasonal snow" } } }), price(161, "TIERED_RECURRENT", { nls: { en: { NAME: "Seasonal de-icing" } } }),
    ],
    products: [SNOW_PRICE, DEICE_PRICE],
  };
  const quoted = (id, attributes = {}) => orderRow(id, SENT, Object.assign({ SERVICE_PROPERTY: { value: 278 } }, attributes), { items: catalog.orderItems.filter((entry) => entry.order.id === id).map((entry) => ({ id: entry.id })) });
  const ids = [601, 602, 603, 604, 605, 606, 607, 608, 609, 610, 611];
  const labelled = normalizeQuoteOrders(ids.map((id) => quoted(id)), catalog).orders;
  assert.deepEqual(plain(labelled.map((order) => [order.backendId, order.pricingModel && order.pricingModel.code, order.pricingModel && order.pricingModel.label])), [
    [601, "PER_SERVICE", "Per service"],
    [602, "MONTHLY", "Monthly"],
    [603, "SEASONAL", "Seasonal"],
    [604, "RECURRING", "Recurring"],
    [605, "RECURRING", "Recurring"],
    [606, "RECURRING", "Recurring"],
    [607, "RECURRING", "Seasonal plan"],
    [608, null, null],
    [609, null, null],
    [610, "PER_SERVICE", "Per service"],
    [611, "RECURRING", "Recurring"],
  ], "without PRICING_MODEL the variant comes from the prices: TIERED is per service, TIERED_RECURRENT is monthly at 1 month and seasonal at more, recurring when the interval is missing, mixed or not in months; a shared price name is the label; mixed or unreadable prices name nothing");
  assert.deepEqual(plain(normalizeQuoteOrders(ids.map((id) => quoted(id, { PRICING_MODEL: { value: "SEASONAL" } })), catalog).orders.map((order) => order.pricingModel)), ids.map(() => ({ code: "SEASONAL", label: "Seasonal" })), "while an Order still carries PRICING_MODEL it wins, so nothing changes before the backfill");
  assert.equal(normalizeQuoteOrders([quoted(602)], { orderItems: catalog.orderItems, productPrices: null, products: null }).orders[0].pricingModel, null, "an unreadable price list names no variant");
  const ranked = contractsPackage(normalizeQuoteOrders([604, 603, 607, 601, 602].map((id) => quoted(id)), catalog), []);
  assert.deepEqual(ranked.groups[0].orders.map((order) => order.backendId), [601, 602, 603, 604, 607], "derived variants keep the per service, monthly, seasonal order, recurring last");
  const priced = (code, amount = 4217.94) => ({ total: { amount, currency: "CAD" }, pricingModel: code ? { code, label: code } : null });
  assert.deepEqual([priced("MONTHLY"), priced("SEASONAL", 16871.75), priced("PER_SERVICE", 1512.5), priced("RECURRING"), priced(null)].map(formatOrderPrice), [
    "CA$4,217.94 / month", "CA$16,871.75 per season", "CA$1,512.50 per visit", "CA$4,217.94", "CA$4,217.94",
  ], "every price carries the period of its pricing model, and a model without a known period shows the price alone");
  assert.equal(formatOrderPrice({ total: null, pricingModel: { code: "MONTHLY" } }), "", "no period without a price");
  const taxesNote = (value) => readPortalConfig({ dataset: { portalTaxesNote: value } }).taxesNote;
  assert.deepEqual(["${PORTAL_TAXES_NOTE@LOCALIZED_STRING_SS}", "#", "", undefined, " Plus taxes applicables. "].map(taxesNote), ["Plus applicable taxes.", "Plus applicable taxes.", "Plus applicable taxes.", "Plus applicable taxes.", "Plus taxes applicables."], "the taxes note is the translated PORTAL_TAXES_NOTE, and an unset parameter shows the English default");
  assert.deepEqual(["PER_SERVICE", "MONTHLY", "SEASONAL", "RECURRING", null].map((code) => plain(pricingDisplay(code ? { code } : null))), [
    { linePrices: true, total: false },
    { linePrices: false, total: true },
    { linePrices: false, total: true },
    { linePrices: false, total: true },
    { linePrices: true, total: true },
  ], "per service shows each service's price and no total; monthly, seasonal and recurring show only the total; an unknown billing type shows line prices and the total; none shows a subtotal or taxes");
  assert.equal(formatOrderPrice({ ...priced("PER_SERVICE", 1512.5), pricing: pricingDisplay({ code: "PER_SERVICE" }) }), "", "a per-service order states no total anywhere");
  assert.deepEqual(plain(normalizeQuoteOrders([{ ...quoted(602), metadata: { PRICING_MODEL: "SEASONAL" } }], catalog).orders[0].pricingModel), { code: "SEASONAL", label: "Seasonal" }, "the order's metadata.PRICING_MODEL is its billing type");

  assert.equal(formatMoney("8625.5", "USD"), "$8,625.50");
  assert.equal(formatMoney(0.02374, "CAD"), "CA$0.02374", "a unit price keeps the precision Core stored");
  assert.equal(formatMoney(null, "CAD"), "");
  assert.equal(formatMoney("", "CAD"), "", "an empty amount is absent, and Number('') is 0");
  assert.equal(formatMoney(12, "cad"), "12.00", "without a valid currency the amount is shown bare rather than in a guessed currency");
}

{
  const review = normalizeServiceAgreement(agreementDocument(["DRAFT"], { CLIENT: { value: 62 }, ORDERS: { value: [501, "502", 503, 503, "x", 0, true] } }));
  assert.deepEqual(plain({ id: review.id, backendId: review.backendId, stateCode: review.stateCode, stage: review.stage, label: review.label, tone: review.tone, orderBackendIds: review.orderBackendIds, effectiveDate: review.effectiveDate, term: review.term }), {
    id: "agreement-core-9001", backendId: 9001, stateCode: "DRAFT", stage: "drafting",
    label: "Being prepared", tone: "scheduled", orderBackendIds: [501, 502, 503], effectiveDate: null, term: null,
  }, "an agreement starts at DRAFT, being prepared by the provider; it reads its latest state and its listed Orders; no date is invented");
  assert.deepEqual(review.allowedActions, [], "only an agreement sent to the client can be approved");
  assert.equal("detailsErrors" in review, false, "CLIENT_DETAILS_ERRORS is the manager's, never read for the client");
  assert.deepEqual(review.terms, [], "an agreement without document content has no terms, not an empty paragraph");
  const termsFrom = (contents, attributes = {}) => plain(normalizeServiceAgreement(agreementDocument(["SENT_TO_CLIENT"], attributes), null, contents).terms).map((block) => block.text);
  const content = (id, document, language, text) => ({ id, document: { id: document }, language: { id: language }, contentType: "TEXT", content: text });
  assert.deepEqual(termsFrom([], { CONTRACT_TERMS: { value: "# Attribute terms" } }), [], "a CONTRACT_TERMS attribute is never read");
  assert.deepEqual(termsFrom([content(2, 9001, "fre", "Conditions"), content(3, 9001, "eng", "English terms"), content(1, 9002, "eng", "Another agreement")]), ["English terms"], "the agreement's own English content is its text");
  assert.deepEqual(termsFrom([content(5, 9001, "spa", "Términos"), content(4, 9001, "eng", "  ")]), ["Términos"], "an empty content is skipped and the only written one is used whatever its language");
  assert.deepEqual(plain(review.parties.client), { legalName: "", clientType: "", billingAddress: "", representativeName: "", representativeJobTitle: "", email: "", phone: "" });
  assert.deepEqual(normalizeServiceAgreement(agreementDocument(["DRAFT"], { ORDERS: { value: "501, 502" } })).orderBackendIds, [501, 502]);
  assert.deepEqual(normalizeServiceAgreement(agreementDocument(["DRAFT"], { ORDERS: { value: 501 } })).orderBackendIds, [501]);
  assert.deepEqual(normalizeServiceAgreement(agreementDocument(["DRAFT"], {})).orderBackendIds, []);
  for (const retired of ["QUOTATION", "QUOTATION_SENT", "QUOTATION_UPDATE", "QUOTATION_SEND_FAILED", "AWAITING_CLIENT_DETAILS", "CLIENT_DETAILS_RECEIVED"]) {
    assert.equal(normalizeServiceAgreement(agreementDocument([retired], { ORDERS: { value: [501] } })), null, retired + " is retired since 2026-11-06: no agreement is in it, and one that is shows nowhere");
  }
  const failedDelivery = normalizeServiceAgreement(agreementDocument(["SENT_TO_CLIENT"], {}, { metadata: { AGREEMENT_OPERATION_STATUS: "AGREEMENT_DELIVERY_FAILED" } }));
  assert.deepEqual([failedDelivery.stateCode, failedDelivery.label, failedDelivery.allowedActions], ["AGREEMENT_SEND_FAILED", "Being sent to you", []], "an agreement whose delivery failed stays in SENT_TO_CLIENT since 2026-11-05 and is presented as before: being sent, with no approval offered");
  assert.deepEqual([normalizeServiceAgreement(agreementDocument(["SENT_TO_CLIENT"], {}, { metadata: { AGREEMENT_OPERATION_STATUS: "AGREEMENT_DELIVERED" } })).stateCode, normalizeServiceAgreement(agreementDocument(["SENT_TO_CLIENT"], {}, { metadata: {} })).allowedActions], ["SENT_TO_CLIENT", ["approve"]], "a delivered or unmarked agreement keeps its state and its approval");
  assert.equal(normalizeServiceAgreement(agreementDocument(["CLIENT_APPROVED"], {}, { metadata: { AGREEMENT_OPERATION_STATUS: "ACTIVATION_FAILED" } })).stateCode, "ACTIVATION_FAILED");
  assert.equal(normalizeServiceAgreement(agreementDocument(["DRAFT"], {}, { metadata: { AGREEMENT_OPERATION_STATUS: "ACTIVATION_FAILED" } })).stateCode, "DRAFT", "a sub-status is presented only in the state it belongs to");
  for (const retired of ["ACTIVE", "SUSPENDED", "EXPIRED"]) {
    assert.equal(normalizeServiceAgreement(agreementDocument(["CLIENT_APPROVED", retired], { ORDERS: { value: [503] } })), null, retired + " is retired on the agreement since 2026-11-09: the service life is read from its orders");
  }

  const signed = normalizeServiceAgreement(agreementDocument(["DRAFT", "PENDING_MANAGEMENT_APPROVAL", "INTERNALLY_APPROVED", "SENT_TO_CLIENT", "CLIENT_APPROVED"], {
    EFFECTIVE_DATE: { value: "2026-11-01" }, TERM_START_DATE: { value: "2026-11-01" }, TERM_END_DATE: { value: "2027-03-31" },
  }));
  assert.deepEqual([signed.stateCode, signed.stage, signed.label], ["CLIENT_APPROVED", "approved", "Approved"], "CLIENT_APPROVED is the signed agreement");
  assert.equal(signed.effectiveDate, "2026-11-01");
  assert.deepEqual(plain(signed.term), { start: "2026-11-01", end: "2027-03-31" });

  for (const value of [null, "", 0, [2026, 11, 1], "2026-13-01", "Nov 1, 2026", true]) {
    assert.equal(normalizeServiceAgreement(agreementDocument(["CLIENT_APPROVED"], { EFFECTIVE_DATE: { value } })).effectiveDate, null, JSON.stringify(value) + " is not a date, and Number(null) is 0");
  }
  assert.equal(normalizeServiceAgreement(agreementDocument(["CLIENT_APPROVED"], { TERM_START_DATE: { value: "2027-04-01" }, TERM_END_DATE: { value: "2027-03-31" } })).term, null, "a term that ends before it starts is not a term");
  assert.equal(normalizeServiceAgreement(agreementDocument(["CLIENT_APPROVED"], {}, { type: { code: "DRIVER_LICENSE" } })), null);
  assert.equal(normalizeServiceAgreement(agreementDocument(["CLIENT_APPROVED"], {}, { type: undefined })), null, "a document whose type was not read cannot be taken for an agreement");
  assert.equal(normalizeServiceAgreement(agreementDocument(["SOMETHING_NEW"])), null);
  assert.equal(normalizeServiceAgreement(agreementDocument(["CLIENT_APPROVED"], {}, { id: null })), null);
  assert.equal(normalizeServiceAgreement(null), null);

  const account = {
    id: 732, nls: { en: { NAME: "Harbour View Strata" } }, attributes: { 35: { LEGAL_ENTITY_TYPE: { value: "corporate" } } },
    contacts: [
      { id: 9, type: { code: "PRIMARY" }, firstName: "Not", lastName: "Legal" },
      { id: 7, type: { code: "LEGAL" }, firstName: "Avery", lastName: "Flow", title: "Director", contactEntries: [{ id: 2, type: { code: "EMAIL" }, value: "avery@example.test" }, { id: 3, type: { code: "PHONE" }, value: "+1 604 555 0100" }] },
    ],
    addresses: [
      { id: 5, types: [{ code: "SERVICE" }], address: { address1: "2 Side St", city: "Vancouver" } },
      { id: 6, types: [{ code: "BILLING" }], address: { address1: "100 Harbour Way", city: "Vancouver", postalCode: "V6C 3T8", state: { code: "BC" }, country: { code: "CA", nls: { en: { NAME: "Canada" } } } } },
    ],
  };
  const sent = normalizeServiceAgreement(agreementDocument(["SENT_TO_CLIENT"], {}, { organization: { id: 43, code: "GRANITE", nls: { en: { NAME: "Granite Ridge Snow Removal" } } } }), { displayName: "Account display name", account: account }, [
    { id: 330, document: { id: 9001 }, language: { id: "eng" }, contentType: "TEXT", content: "# Parties\n\nService provider: Granite Ridge Snow Removal Ltd.\n- Phone: +1 604 670 0591\n\nClient: Harbour View Strata\n\n# Terms\n\n1. Services." },
  ]);
  assert.deepEqual(sent.allowedActions, ["approve"]);
  assert.deepEqual(plain(sent.parties), {
    provider: { legalName: "Granite Ridge Snow Removal", representativeName: "", representativeJobTitle: "", phone: "", email: "", logoImageId: "" },
    client: { legalName: "Harbour View Strata", clientType: "Corporation", billingAddress: "100 Harbour Way, Vancouver, BC V6C 3T8, Canada", representativeName: "Avery Flow", representativeJobTitle: "Director", email: "avery@example.test", phone: "+1 604-555-0100" },
  }, "the provider card is the owning organization's name and the client card is the Account: its name, LEGAL_ENTITY_TYPE, oldest BILLING address and LEGAL contact; the agreement stores no party details of its own");
  assert.deepEqual(sent.terms.slice(0, 3), [{ kind: "heading", text: "Parties" }, { kind: "paragraph", text: "Service provider: Granite Ridge Snow Removal Ltd.", depth: 0 }, { kind: "item", text: "Phone: +1 604 670 0591" }].map((block) => Object.assign({}, block)).map((block) => plain(sent.terms.find((candidate) => candidate.text === block.text))), "the parties the agreement text fixes read as its first blocks");
  const unlabelled = Object.assign({}, account, { attributes: { 35: { LEGAL_ENTITY_TYPE: { value: "PARTNERSHIP" } } } });
  assert.equal(normalizeServiceAgreement(agreementDocument(["SENT_TO_CLIENT"]), { displayName: "Harbour View Strata", account: unlabelled }).parties.client.clientType, "", "a client type without a known label is not shown as a code");
  assert.deepEqual(plain(normalizeServiceAgreement(agreementDocument(["SENT_TO_CLIENT"]), { displayName: "Harbour View Strata" }).parties.client), { legalName: "Harbour View Strata", clientType: "", billingAddress: "", representativeName: "", representativeJobTitle: "", email: "", phone: "" }, "without the Account read the display name alone names the client");

  const workflowStates = ["ACTIVATION_FAILED", "AGREEMENT_SEND_FAILED", "ARCHIVED", "CANCELED", "CLIENT_APPROVED", "CLIENT_CHANGES_REQUESTED", "DRAFT", "INTERNALLY_APPROVED", "PENDING_MANAGEMENT_APPROVAL", "SENT_TO_CLIENT"];
  assert.deepEqual(Object.keys(AGREEMENT_STAGES).sort(), workflowStates, "every state an agreement reaches from DRAFT on has a customer presentation; the quotation states before DRAFT are retired since 2026-11-06 and ACTIVE, SUSPENDED and EXPIRED since 2026-11-09");
  assert.deepEqual(plain(ORDER_SERVICE_STAGES), {
    ACTIVE: { stage: "active", label: "Active", tone: "ok" },
    SUSPENDED: { stage: "suspended", label: "Suspended", tone: "warn" },
    COMPLETED: { stage: "expired", label: "Expired", tone: "scheduled" },
  }, "a signed agreement is presented by the service life of its orders");
  for (const code of workflowStates) {
    const stage = AGREEMENT_STAGES[code];
    assert.ok(stage.label && ["ok", "info", "warn", "scheduled"].includes(stage.tone), code + " needs a label and a badge tone");
  }
  assert.equal(AGREEMENT_STAGES.ACTIVATION_FAILED.label, "Approved", "a failed activation is the provider's step; the customer's approval stands");
  assert.equal(AGREEMENT_STAGES.DRAFT.label, "Being prepared", "a DRAFT agreement is being prepared by the provider");
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
  ], "markup is reduced to text; nothing from the agreement text is ever parsed as HTML");
  assert.deepEqual(termsBlocks(""), []);
  assert.deepEqual(termsBlocks(null), []);
  assert.deepEqual(termsBlocks({ value: "x" }), []);
}

{
  const properties = [
    { id: "prop-core-278", backendId: 278, name: "123 Main Street", address: "#1001 - 7445 132nd Street, Surrey, BC, V3W 1J8", lat: null, lon: null },
    { id: "prop-core-430", backendId: "430", name: "460 Nanaimo St", address: "460 Nanaimo St, Vancouver, BC, V5L 4W3", lat: 49.28, lon: -123.05 },
  ];
  const review = normalizeServiceAgreement(agreementDocument(["DRAFT"]));
  const source = Object.assign({ agreements: [review] }, normalizeQuoteOrders(orderList));
  const quotes = contractsPackage(source, properties);
  assert.deepEqual(quotes.groups.map((group) => group.id), ["quote-0-278", "quote-0-430", "quote-0-431", "quote-0-0"], "rows are grouped by property in the order Core listed them, and a quote no agreement lists belongs to no package");
  assert.deepEqual(quotes.groups.map((group) => group.title), ["123 Main Street", "460 Nanaimo St", "Property details unavailable", "No property on this quote"]);
  assert.deepEqual(quotes.groups.map((group) => group.orders.map((order) => order.backendId)), [[501, 502], [504, 503], [505], [510, 511]], "within a property the options run per service, monthly, seasonal");
  assert.deepEqual(quotes.groups.map((group) => group.decision), ["open", "approved", "revision", "open"]);
  assert.deepEqual(plain(quotes.counts), { orders: 7, properties: 3, decided: 1, approved: 1, revision: 1, declined: 1, cancelled: 0, open: 4 });
  assert.equal(quotes.counts.approved + quotes.counts.revision + quotes.counts.declined + quotes.counts.open, quotes.counts.orders, "the rollup counts each independent Order once");
  assert.equal("servicePeriod" in quotes, false, "the quote package states no service period");
  assert.equal(quotes.agreements.length, 1);
  assert.equal(quotes.agreements[0].agreement.stage, "drafting");
  assert.equal(quotes.deciding, true);

  const listed = normalizeServiceAgreement(agreementDocument(["DRAFT"], { ORDERS: { value: [503, 506, 999] } }));
  const packaged = contractsPackage(Object.assign({ agreements: [listed] }, normalizeQuoteOrders(orderList)), properties);
  assert.deepEqual(packaged.groups.map((group) => group.id), ["quote-0-278", "quote-0-430", "quote-0-431", "quote-0-0"], "a DRAFT agreement takes the approved quote it holds out of the quote list");
  assert.deepEqual(packaged.groups[1].orders.map((order) => order.backendId), [504], "and its property keeps only the option no agreement holds");
  assert.equal(packaged.agreements[0].unreadableOrders, 1, "Order 999 is listed but was not read, while withheld Order 506 is not called unreadable");
  assert.deepEqual(packaged.agreements[0].properties.map((entry) => entry.orders.map((order) => order.backendId)), [[503]], "a DRAFT agreement's services are the options the client approved");
  assert.deepEqual(packaged.agreements[0].propertyNames, ["460 Nanaimo St"]);
  assert.equal(packaged.partial.unreadableOrders, 1);

  const later = normalizeServiceAgreement(agreementDocument(["DRAFT", "PENDING_MANAGEMENT_APPROVAL", "INTERNALLY_APPROVED", "SENT_TO_CLIENT"], { ORDERS: { value: [503, 504] } }, { id: 9002 }));
  const moved = contractsPackage(Object.assign({ agreements: [listed, later] }, normalizeQuoteOrders(orderList)), properties);
  assert.deepEqual(moved.groups.map((group) => group.id), ["quote-0-278", "quote-0-431", "quote-0-0"], "decided quotes an agreement holds leave the quote list for the agreement page");
  assert.equal(moved.agreements[0].id, "agreement-core-9002", "an agreement waiting for approval comes first");
  assert.deepEqual(moved.agreements[0].properties.map((entry) => entry.orders.map((order) => order.backendId)), [[503]], "an agreement's services are the options that were approved");
  assert.equal(moved.agreements[0].servicesScope, "approved");

  const shared = contractsPackage(normalizeQuoteOrders({ result: [orderList.result[0], orderList.result[1], orderList.result[2]] }), properties);
  assert.ok(!("servicePeriod" in shared) && shared.groups.every((group) => !("servicePeriod" in group)), "Orders that all carry the same SERVICE_PERIOD still show no period");
  assert.deepEqual(shared.agreements, [], "without a readable agreement there is no agreement row");

  const declinedEverywhere = contractsPackage(normalizeQuoteOrders({ result: [orderRow(1, SENT.concat("DECLINED"), { SERVICE_PROPERTY: { value: 278 } }), orderRow(2, SENT.concat("DECLINED"), { SERVICE_PROPERTY: { value: 278 } })] }), properties);
  assert.equal(declinedEverywhere.groups[0].decision, "declined", "a property whose every option is declined is decided");
  assert.equal(declinedEverywhere.counts.decided, 1);
  const cancelledEverywhere = contractsPackage(normalizeQuoteOrders({ result: [orderRow(1, SENT.concat("ACCEPTED", "ACTIVE", "CANCELED"), { SERVICE_PROPERTY: { value: 278 } }), orderRow(2, SENT.concat("DECLINED"), { SERVICE_PROPERTY: { value: 278 } })] }), properties);
  assert.deepEqual(plain([cancelledEverywhere.groups[0].decision, cancelledEverywhere.groups[0].status, cancelledEverywhere.counts.decided, cancelledEverywhere.counts.cancelled, cancelledEverywhere.counts.approved, cancelledEverywhere.pending.length]), ["cancelled", "cancelled", 1, 1, 0, 0], "a property whose accepted service was cancelled is closed as cancelled, never shown as approved, and waits for nothing");

  const onlyOperator = contractsPackage(normalizeQuoteOrders({ result: [orderRow(1, ["DRAFT"])] }), properties);
  assert.deepEqual(plain({ agreements: onlyOperator.agreements, preparing: onlyOperator.preparing, groups: onlyOperator.groups }), { agreements: [], preparing: true, groups: [] }, "a round still being prepared shows no agreement and no quote, only that the request is being prepared");
  const retiredOnly = normalizeContracts({ quoteOrders: [], agreements: [agreementDocument(["QUOTATION"])] });
  assert.deepEqual([retiredOnly.preparing, retiredOnly.agreements.length], [false, 0], "a Document left in the retired QUOTATION state neither shows nor claims a request in preparation");
  assert.equal(contractsPackage(null, null).counts.orders, 0);

  assert.equal(groupStatus(quotes.groups[0].orders), "unseen");
  assert.equal(groupStatus(quotes.groups[1].orders), "approved");
  assert.equal(groupStatus([]), "unseen");

  const lifeOf = (codes) => contractsPackage(Object.assign({
    agreements: [normalizeServiceAgreement(agreementDocument(["SENT_TO_CLIENT", "CLIENT_APPROVED"], { ORDERS: { value: codes.map((code, index) => 600 + index) } }))],
  }, normalizeQuoteOrders({ result: codes.map((code, index) => orderRow(600 + index, code === "DECLINED" ? SENT.concat(code) : SENT.concat("ACCEPTED", code === "ACCEPTED" ? [] : code), { SERVICE_PROPERTY: { value: 278 } })) })), properties).agreements[0].agreement;
  assert.deepEqual(plain([["ACCEPTED", "DECLINED"], ["ACTIVE", "DECLINED"], ["SUSPENDED"], ["COMPLETED"], ["ACTIVE", "SUSPENDED"], ["SUSPENDED", "COMPLETED"], ["CANCELED"], ["ACCEPTED", "CANCELED"]].map((codes) => {
    const agreement = lifeOf(codes);
    return [agreement.stateCode, agreement.stage, agreement.label, agreement.tone];
  })), [
    ["CLIENT_APPROVED", "approved", "Approved", "ok"],
    ["CLIENT_APPROVED", "active", "Active", "ok"],
    ["CLIENT_APPROVED", "suspended", "Suspended", "warn"],
    ["CLIENT_APPROVED", "expired", "Expired", "scheduled"],
    ["CLIENT_APPROVED", "active", "Active", "ok"],
    ["CLIENT_APPROVED", "suspended", "Suspended", "warn"],
    ["CLIENT_APPROVED", "canceled", "Cancelled", "scheduled"],
    ["CLIENT_APPROVED", "approved", "Approved", "ok"],
  ], "a signed agreement is active while any of its orders is ACTIVE, else suspended while any is SUSPENDED, else expired once one is COMPLETED, cancelled once every order is CANCELED, and otherwise signed; its own state stays CLIENT_APPROVED");
  const archived = contractsPackage(Object.assign({
    agreements: [normalizeServiceAgreement(agreementDocument(["CLIENT_APPROVED", "ARCHIVED"], { ORDERS: { value: [600] } }))],
  }, normalizeQuoteOrders({ result: [orderRow(600, SENT.concat("ACCEPTED", "ACTIVE", "COMPLETED"), { SERVICE_PROPERTY: { value: 278 } })] })), properties).agreements[0].agreement;
  assert.deepEqual([archived.stateCode, archived.stage], ["ARCHIVED", "archived"], "only a signed agreement reads its stage from its orders; an archived one stays archived");

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
const RETIRED = ["Proposal #", "valid until", "sent Dec", "sq ft", "Beam AI", "live orders", "Order #", "/mo", "Flex Service Plan", "Seasonal Unlimited", "Season-Lock", "Request revision", "PDF", "Download"];

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
  assert.equal(all(head, ".proposals-head__sub").length, 0, "the head no longer counts agreements and quotes under the title");
  assert.equal(one(head, ".proposals-head__pill").textContent, "2 of 4 properties decided", "a property with changes requested is not decided");
  for (const invented of RETIRED) assert.ok(!text.includes(invented), "the contracts page must not claim " + JSON.stringify(invented));

  const notice = one(page, "[data-module=\"quote-preparing\"]");
  assert.equal(notice.textContent, "◔We’re still preparing part of your requestAnything we send you appears in this list.");
  assert.doesNotMatch(notice.textContent, /\d/, "the withheld Orders are never counted to the customer");
  assert.equal(all(page, "[data-module=\"contracts-partial\"]").length, 0, "the fixture reads everything it lists");

  const rows = all(page, "[data-module=\"agreement-row\"]");
  assert.deepEqual(rows.map((row) => row.getAttribute("data-state")), ["approval", "drafting", "drafting", "approved", "active", "suspended", "expired", "archived", "canceled"], "an agreement waiting for the customer comes first; no agreement waits for quote decisions or details any more");
  assert.deepEqual(rows.map((row) => one(row, ".proposal-card__name").textContent), ["Alkire Street and Braun Court", "Dover Way", "Coal Creek Lane", "Lamar Terrace", "Eldridge Circle and Flatiron Parkway", "Independence Way", "Holland Street", "Jellison Place", "Kipling Crossing"]);
  assert.deepEqual(rows.map((row) => (one(row, ".proposal-card__meta") || { textContent: null }).textContent), [
    "2 options approved · Season Nov 1, 2026 – Mar 31, 2027",
    "Monthly · $8,825.00 / month · Season Nov 1, 2026 – Mar 31, 2027",
    "Seasonal · $8,100.00 per season · Season Nov 1, 2026 – Mar 31, 2027",
    "Seasonal · $7,730.00 per season · Season Nov 1, 2026 – Mar 31, 2027",
    "2 options approved · Season Nov 1, 2025 – Mar 31, 2026",
    "Monthly · $9,300.00 / month · Season Nov 1, 2025 – Mar 31, 2026",
    "Seasonal · $7,190.00 per season · Season Nov 1, 2024 – Mar 31, 2025",
    "Seasonal · $7,450.00 per season · Season Nov 1, 2024 – Mar 31, 2025",
    null,
  ], "an agreement row names its chosen option with its price and period, and its season from the agreement's own term, never from its Orders; a row with nothing to say has no second line");
  assert.ok(rows.every((row) => !one(row, ".proposal-card__meta") || !/Service agreement|Active|Approved/.test(one(row, ".proposal-card__meta").textContent)), "the status is shown once, as the badge");
  assert.equal(all(page, ".agreement-row__diamond").length + all(page, "[data-module=\"agreement-row\"] .proposal-card__diamond").length, 0, "agreement rows carry no coloured leaf or drop icon");
  assert.deepEqual(rows.map((row) => one(row, "[data-module=\"status-badge\"]").textContent), ["Sent for your approval", "Pending management approval", "Being prepared", "Approved", "Active", "Suspended", "Expired", "Archived", "Cancelled"]);
  assert.deepEqual(rows.map((row) => [row.getAttribute("data-action"), row.getAttribute("data-id")]), [
    ["agreement.open", "agreement-core-9102"], ["agreement.open", "agreement-core-9104"], ["agreement.open", "agreement-core-9103"],
    ["agreement.open", "agreement-core-9095"], ["agreement.open", "agreement-core-9100"],
    ["agreement.open", "agreement-core-9098"], ["agreement.open", "agreement-core-9099"], ["agreement.open", "agreement-core-9097"],
    ["agreement.open", "agreement-core-9096"],
  ]);

  const map = one(page, "[data-module=\"portfolio-map\"]");
  assert.equal(map.getAttribute("data-surface"), "schematic");
  assert.equal(one(map, ".portfolio-map__label").textContent, "portfolio map");
  assert.equal(all(map, ".portfolio-map__river").length, 0, "the drawn river implied a geography nobody measured");
  const pending = quotedProperties.filter((property) => ["prop-tabor", "prop-cinnamon"].includes(property.id));
  const expected = schematicPositions(pending.map((property) => ({ lat: property.lat, lon: property.lon })));
  assert.deepEqual(all(map, ".map-pin-wrap").map((pin) => pin.getAttribute("style")), expected.map((point) => "left:" + point.x + "%;top:" + point.y + "%"), "pins are placed from the properties' own coordinates");
  assert.deepEqual(all(map, ".map-pin-label").map((label) => label.textContent), ["Tabor Street", "Cinnamon Bear Way"], "only the properties whose quotes still wait are mapped");

  assert.equal(all(page, "[data-module=\"proposal-rollup\"]").length + all(page, ".rollup-card").length, 0, "no Approved, Revision, Declined or Open counters");
  assert.deepEqual(all(page, ".contracts-section__count").map((count) => count.textContent), ["9", "6", "31"], "the Quotes section counts only the quotes it lists, and All orders counts every order");
  const history = one(page, "[data-module=\"contracts-orders\"]");
  assert.equal(all(history, "[data-module=\"quote-row\"]").length, 31, "All orders lists every order the customer can see, decided ones included");
  assert.ok(["approved", "declined", "unseen"].every((status) => all(history, "[data-module=\"quote-row\"][data-state=\"" + status + "\"]").length > 0), "approved, declined and waiting orders alike");
  for (const id of all(history, "[data-action=\"proposal.open\"]").map((button) => button.getAttribute("data-id"))) assert.ok(quoteGroupFor(id), "every order group opens its detail");
  const groups = all(page, "[data-module=\"contracts-quotes\"] [data-module=\"quote-property\"]");
  assert.deepEqual(groups.map((group) => group.getAttribute("data-state")), ["revision", "open"], "only quotes awaiting a decision or in revision are listed; the approved and declined properties are not");
  const tabor = groups[0];
  const button = one(tabor, "button");
  assert.equal(button.getAttribute("data-action"), "proposal.open");
  assert.equal(button.getAttribute("data-id"), "quote-0-7102");
  assert.equal(one(tabor, ".proposal-card__meta").textContent, "1190 Tabor Street, Golden, CO 80401 · 3 quotes");
  assert.equal(one(tabor, ".proposal-group__decision").textContent, "Changes requested");
  assert.deepEqual(all(groups[1], "[data-module=\"quote-row\"]").map((row) => [one(row, ".proposal-option__model").textContent, (one(row, ".proposal-option__total") || { textContent: null }).textContent, one(row, "[data-module=\"status-badge\"]").textContent]), [
    ["Per service", "Per visit", "◔ Sent"],
    ["Monthly", "$32,815.00 / month", "◔ Sent"],
    ["Seasonal", "$31,250.00 per season", "◔ Sent"],
  ], "a monthly or seasonal option shows Core's grand total with its period, a per-service option shows no total but how it is priced, so every row fills the same price column, and nothing is computed from an area");
  assert.deepEqual(all(groups[1], ".proposal-option__total").map((cell) => cell.getAttribute("data-pricing")), ["per-service", null, null]);
  assert.deepEqual(groups.map((group) => all(group, "[data-module=\"quote-row\"]").length), [3, 3]);
  assert.equal(all(page, ".proposal-card__tag").length, 0, "every quoted property is on the map, so none is marked off it");
  assert.equal(one(page, "[data-module=\"quote-package-footer\"]").textContent, "✦Decide each property on its own. Approving one option for a property declines its other options, and your contract details go with the approval. Once every property has a decision, we prepare your service agreement.Plus applicable taxes.", "the footer says the prices shown are before taxes");
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
    assert.equal(one(map, ".portfolio-map__label").textContent, "portfolio map · 1 of 2 properties on the map");
    assert.equal(all(map, ".map-pin-wrap").length, 1, "a property without a coordinate is listed but not pinned");
    const tags = all(page, "[data-module=\"contracts-quotes\"] [data-module=\"quote-property\"]").map((group) => (one(group, ".proposal-card__tag") || { textContent: "" }).textContent);
    assert.deepEqual(tags, ["", "Not on the map"]);
  });
  withProperties(() => { quotedProperties.forEach((property) => { property.lat = null; property.lon = null; }); }, () => {
    const page = ProposalsList();
    assert.equal(all(page, "[data-module=\"portfolio-map\"]").length, 0, "with nothing to place there is no map, and nothing lands at its centre");
    assert.equal(all(page, ".proposal-card__tag").length, 0, "without a map no property is marked off it");
    assert.equal(all(page, "[data-module=\"contracts-quotes\"] [data-module=\"quote-property\"]").length, 2, "every property still waiting is listed");
  });
}

{
  configureFixture();
  state.porders = graniteRidgeSnowFixture.proposals.orders.filter((order) => order.id === 8113);
  state.pagreements = [];
  refreshProposals();
  const page = ProposalsList();
  assert.equal(page.getAttribute("data-state"), "preparing");
  const block = one(page, "[data-module=\"quote-preparing\"]");
  assert.equal(block.getAttribute("data-state"), "preparing");
  assert.equal(block.textContent, "◔We’re preparing your quotesA manager prepares and approves them. They appear here and arrive by email once they’re sent to you.");
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
    const final = decidedOnce.has(property) ? "DECLINED" : "ACCEPTED";
    decidedOnce.add(property);
    return Object.assign({}, order, { states: [{ code: "QUOTE_SENT" }, { code: final }] });
  });
  const approved = state.porders.filter((order) => Math.floor(order.id / 100) === 81 && order.states[1].code === "ACCEPTED").map((order) => order.id);
  state.pagreements = state.pagreements.concat(agreementDocument(["DRAFT"], { CLIENT: { value: 6001 }, ORDERS: { value: approved } }, { id: 9105 }));
  refreshProposals();
  const page = ProposalsList();
  const head = one(page, "[data-module=\"quote-package-head\"]");
  assert.equal(one(head, "h1").textContent, "Your contracts");
  assert.equal(all(head, ".proposals-head__sub").length, 0, "the head counts nothing");
  assert.equal(all(head, ".proposals-head__pill").length, 0, "there is nothing left to decide");
  assert.equal(all(page, "[data-module=\"quote-package-footer\"]").length, 0);
  assert.equal(all(page, "[data-module=\"quote-preparing\"]").length, 0);
  assert.equal(all(page, "[data-module=\"contracts-quotes\"]").length, 0, "the decided round's approved quotes move to the DRAFT agreement made from them, its declined ones leave the list");
  assert.equal(one(page, "[data-id=\"agreement-core-9105\"] [data-module=\"status-badge\"]").textContent, "Being prepared");
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
  state.currentSiteId = "quote-0-7101";
  const decided = ProposalDetail();
  assert.equal(decided.getAttribute("data-state"), "approved");
  assert.equal(one(decided, "[data-visual-id=\"proposal-back\"]").textContent, "‹ Back to your contracts");
  assert.equal(one(decided, "h1").textContent, "Foothill Court");
  assert.equal(one(decided, ".proposal-detail-head__meta").textContent, "4820 Foothill Court, Lakewood, CO 80215", "the address comes from the property's Resource, and no service period follows it");
  assert.equal(all(decided, "[data-module=\"quote-package-link\"]").length, 0, "a quote of an open round belongs to no agreement, so it links to none");
  assert.equal(one(decided, "[data-module=\"quote-decided\"]").textContent, "iYou approved Monthly. The other options for this property are declined.", "the note repeats what Core read back, including the declined siblings");
  const cards = all(decided, "[data-module=\"quote-option\"]");
  assert.deepEqual(cards.map((card) => [one(card, ".quote-option__model").textContent, card.getAttribute("data-state")]), [["Per service", "declined"], ["Monthly", "approved"], ["Seasonal", "declined"]]);
  const monthly = cards[1];
  const lineText = (card) => all(card, ".quote-line").map((row) => [one(row, ".purch-line__title").textContent, (one(row, ".purch-line__meta") || { textContent: null }).textContent, (one(row, ".purch-line__side") || { textContent: null }).textContent]);
  assert.deepEqual(lineText(monthly), [
    ["Snow clearing", "Quantity 5", null],
    ["De-icing", "Quantity 5", null],
  ], "a monthly option lists its services without a price per service");
  assert.deepEqual(all(monthly, ".money-rows__row").map((row) => row.textContent), ["Total$9,060.00 / month"], "and only its total, with its period: no subtotal or taxes");
  assert.equal(one(monthly, "[data-module=\"quote-totals\"] [data-kind=\"taxes\"]").textContent, "Plus applicable taxes.", "with the note that applicable taxes come on top");
  const perService = cards[0];
  assert.ok(lineText(perService).every((line) => line[2] && line[2].endsWith(" per service")), "a per-service option shows the price of each service");
  assert.equal(all(perService, ".money-rows__row").length, 0, "and no total, subtotal or taxes");
  assert.equal(one(perService, "[data-module=\"quote-totals\"]").getAttribute("data-state"), "per-service");
  assert.equal(one(perService, "[data-module=\"quote-totals\"] [data-kind=\"taxes\"]").textContent, "Plus applicable taxes.", "and says applicable taxes come on top of each price");
  assert.equal(all(decided, "[data-action=\"quote.approve\"]").length + all(decided, "[data-action=\"quote.decline\"]").length, 0, "a decided property offers no decision a terminal Order could not take");
  for (const retired of RETIRED) assert.ok(!decided.textContent.includes(retired), "the quote detail must not show " + JSON.stringify(retired));
  assert.equal(all(decided, "[data-module=\"beam-report\"]").length + all(decided, "[data-module=\"plan-option\"]").length, 0, "the Beam AI block and the hard-coded plans are gone from the package");

  state.currentSiteId = "quote-0-7102";
  const revision = ProposalDetail();
  assert.equal(one(revision, "[data-module=\"quote-decided\"]").textContent, "iYou asked for changes to these quotes. Our team is reviewing your request.");
  assert.equal(all(revision, "[data-action=\"quote.approve\"]").length, 0, "an Order with changes requested waits for the operator, not the customer");

  state.currentSiteId = "quote-0-7103";
  assert.equal(one(ProposalDetail(), "[data-module=\"quote-decided\"]").textContent, "iYou declined the quotes for this property.");

  state.currentSiteId = "quote-0-7104";
  const open = ProposalDetail();
  assert.equal(open.getAttribute("data-state"), "unseen");
  assert.equal(all(open, "[data-module=\"quote-decided\"]").length, 0);
  const openCards = all(open, "[data-module=\"quote-option\"]");
  assert.deepEqual(openCards.map((card) => card.getAttribute("data-state")), ["unseen", "unseen", "unseen"]);
  for (const [index, card] of openCards.entries()) {
    const id = String(8110 + index);
    assert.deepEqual(all(card, "[data-action]").map((button) => [button.getAttribute("data-action"), button.getAttribute("data-id"), button.textContent]), [
      ["quote.approve", id, "Approve"],
      ["quote.requestChanges", id, "Request changes"],
      ["quote.decline", id, "Decline"],
    ], "a sent quote offers approve, request changes and decline as soon as it is shown");
  }
  assert.equal(all(open, "[data-module=\"command-pending\"]").length + all(open, "[data-module=\"command-failure\"]").length, 0, "opening a quote sends nothing: ORDER_LIFECYCLE has no view event");
  assert.equal(one(open, "[data-module=\"quote-detail-footer\"]").textContent, "✦Approving one option for this property declines its other options.");

  state.approveQuoteId = 8110;
  state.contractDetails = { prefill: "loading", filled: false, draft: {}, errors: {} };
  const loadingStep = QuoteApproval();
  assert.deepEqual([loadingStep.getAttribute("data-route"), loadingStep.getAttribute("data-state")], ["proposal.approve", "open"], "Approve opens a page of its own for the option");
  assert.equal(one(loadingStep, "h1").textContent, "Contract details");
  assert.equal(one(loadingStep, ".proposal-detail-head__meta").textContent, "Cinnamon Bear Way · 870 Cinnamon Bear Way, Lakewood, CO 80227");
  assert.deepEqual(all(loadingStep, ".detail-back").map((back) => [back.getAttribute("data-action"), back.textContent]), [["quote.backToQuote", "‹ Back to the quote"]]);
  const perServiceSummary = one(loadingStep, "[data-module=\"quote-approval-summary\"]");
  assert.deepEqual([one(perServiceSummary, ".quote-option__model").textContent, one(perServiceSummary, ".quote-approval__price").textContent, one(perServiceSummary, "[data-kind=\"taxes\"]").textContent, one(perServiceSummary, ".quote-option__note").textContent], ["Per service", "You pay the price of each service every time it is performed.", "Plus applicable taxes.", "Approving it declines the other options for this property."], "the page opens with the option being approved: its name, how it is priced, the taxes note and the rule about its siblings");
  assert.equal(one(loadingStep, "[data-module=\"agreement-details\"]").getAttribute("data-state"), "loading", "the approval asks for the contract details, loaded from the account first");
  assert.equal(one(loadingStep, "[data-action=\"quote.sendApproval\"]").hasAttribute("disabled"), true, "nothing is approved before the details can be filled in");
  state.contractDetails = { prefill: "ready", filled: false, draft: {}, errors: {} };
  const editingStep = QuoteApproval();
  assert.equal(one(editingStep, "[data-module=\"agreement-details\"]").getAttribute("data-state"), "editing", "the contract details travel with the approval");
  assert.deepEqual(all(one(editingStep, "[data-module=\"quote-approval-form\"]"), "button[data-action]").map((button) => [button.getAttribute("data-action"), button.getAttribute("data-id"), button.textContent, button.hasAttribute("disabled")]), [
    ["quote.sendApproval", "8110", "Approve Per service", false],
    ["quote.backToQuote", null, "Back", false],
  ]);
  state.approveQuoteId = 8111;
  assert.deepEqual([one(QuoteApproval(), ".quote-option__model").textContent, one(QuoteApproval(), ".quote-approval__price").textContent], ["Monthly", "$32,815.00 / month"], "an option with a total states the server's price line");
  state.approveQuoteId = 8110;
  assert.equal(all(ProposalDetail(), "[data-module=\"agreement-details\"]").length + all(ProposalDetail(), "[data-contract-detail]").length, 0, "the quote itself asks no contract details: they are filled in one place only");

  state.contractCommand = { kind: "approve", targets: [8110], phase: "pending" };
  const pending = QuoteApproval();
  assert.equal(pending.getAttribute("data-state"), "pending");
  assert.deepEqual(all(one(pending, "[data-module=\"quote-approval-form\"]"), "button[data-action]").map((button) => [button.textContent, button.hasAttribute("disabled")]), [["Sending…", true], ["Back", true]], "one command at a time: nothing can be sent or left while it is in flight");
  assert.ok(all(pending, "[data-contract-detail]").filter((node) => node.tagName === "INPUT").concat(all(pending, "[data-client-type]")).every((input) => input.hasAttribute("disabled")), "and the details being sent cannot change");
  state.contractCommand = { kind: "approve", targets: [8110], phase: "refused", message: "The legal address needs a country." };
  const refused = QuoteApproval();
  assert.match(one(one(refused, "[data-module=\"quote-approval-form\"]"), "[data-module=\"command-failure\"]").textContent, /The legal address needs a country\./, "a refusal is shown on the page that sent it, with the form still open");
  assert.equal(one(refused, "[data-action=\"quote.sendApproval\"]").hasAttribute("disabled"), false);
  state.contractCommand = null;
  state.approveQuoteId = 999999;
  assert.equal(QuoteApproval().getAttribute("data-state"), "not-found", "an option that is not on this quote opens nothing to fill in");
  state.currentSiteId = "quote-0-7101";
  state.approveQuoteId = quoteGroupFor("quote-0-7101").orders.find((order) => order.status === "approved").backendId;
  const closedStep = QuoteApproval();
  assert.equal(closedStep.getAttribute("data-state"), "approved");
  assert.equal(all(closedStep, "[data-module=\"agreement-details\"]").length + all(closedStep, "[data-action=\"quote.sendApproval\"]").length, 0, "a decided option offers no form and no second approval");
  assert.equal(one(closedStep, "[data-module=\"quote-approval-closed\"]").textContent, "iThis option is no longer waiting for your decision.");
  state.currentSiteId = "quote-0-7104";
  state.approveQuoteId = null;
  state.contractDetails = null;

  state.contractConfirm = null;
  state.contractCommand = { kind: "approve", targets: [8111], phase: "pending" };
  const sentOption = findQuote(quotePackage(), 8110);
  assert.equal(sentOption.status, "unseen");
  assert.deepEqual(all(QuoteOptionCard(sentOption, { interactive: true, busy: true }), "[data-action]").map((button) => [button.textContent, button.hasAttribute("disabled")]), [["Approve", true], ["Request changes", true], ["Decline", true]], "while another option's command is in flight this option cannot be decided");
  assert.deepEqual(all(QuoteOptionCard(sentOption, { interactive: true, busy: false }), "[data-action]").map((button) => [button.textContent, button.hasAttribute("disabled")]), [["Approve", false], ["Request changes", false], ["Decline", false]]);

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
  const settled = quoteGroupFor("quote-0-7101").orders.find((order) => order.status === "declined");
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
  assert.equal(one(page, ".proposal-detail-head__meta").textContent, "Season Nov 1, 2026 – Mar 31, 2027", "the season replaces the property and quote counts under the title");
  assert.equal(one(page, "[data-module=\"agreement-detail-head\"] [data-module=\"status-badge\"]").textContent, "Sent for your approval");
  assert.equal(all(page, "[data-module=\"agreement-notice\"]").length, 0, "the approval itself is the banner, so no second notice repeats the status");
  const banner = page.children.find((node) => node.getAttribute("data-module") === "agreement-approve");
  assert.ok(banner, "the coloured approval banner sits in the page flow above the parties");
  assert.equal(page.children.indexOf(banner) < page.children.indexOf(one(page, "[data-module=\"agreement-parties\"]")), true);
  assert.equal(banner.getAttribute("data-tone"), "warn");
  assert.equal(one(banner, "h2").textContent, "Waiting for your approval");
  const facts = (card) => all(card, ".agreement-facts__row").map((row) => [one(row, "dt").textContent, one(row, "dd").textContent]);
  const parties = all(page, "[data-module=\"agreement-party\"]");
  const partyName = (card) => one(card, ".agreement-party__name").textContent;
  assert.deepEqual(parties.map((card) => card.getAttribute("data-party")), ["provider", "client"], "the two cards are a pair");
  assert.equal(partyName(parties[0]), "Granite Ridge Snow Removal", "the provider card is the owning organization");
  assert.equal(all(parties[0], "img").length, 0, "no logo id means no image");
  assert.equal(one(parties[0], ".party-mark").textContent, "GR", "a provider without a logo wears the initials of its real name");
  assert.deepEqual(facts(parties[0]), [], "the provider's representative and contact live in the agreement text");
  assert.equal(partyName(parties[1]), "Whitlock Property Group LLC");
  assert.equal(one(parties[1], "[data-module=\"party-tag\"]").textContent, "Organization");
  assert.equal(page.textContent.split("Whitlock Property Group LLC").length, 3, "the client's name shows on its card and once more where the agreement text names the parties");
  assert.deepEqual(facts(parties[1]), [
    ["Billing address", "1550 Wynkoop Street, Suite 400, Denver, CO 80202"],
    ["Representative", "Dana Whitlock, Portfolio Manager"],
    ["Email", "dana.whitlock@example.test"],
    ["Phone", "+1 303-555-0164"],
  ]);
  assert.deepEqual(facts(one(page, "[data-module=\"agreement-term\"]")), [["Effective date", "Oct 20, 2026"]], "the season is under the title, so the term card keeps only the effective date");
  const services = one(page, "[data-module=\"agreement-services\"]");
  assert.equal(one(services, ".agreement-section-head__sub").textContent, "The options you approved");
  assert.deepEqual(all(services, "[data-module=\"agreement-property\"]").map((entry) => [one(entry, ".agreement-property__title").textContent, (one(entry, ".agreement-property__address") || { textContent: "" }).textContent, all(entry, "[data-module=\"quote-option\"]").map((card) => one(card, ".quote-option__model").textContent).join("|")]), [
    ["Alkire Street", "210 Alkire Street, Arvada, CO 80004", "Seasonal"],
    ["Braun Court", "247 Braun Court, Golden, CO 80401", "Monthly"],
  ], "an agreement lists each property with its approved option and the property's own address");
  assert.equal(all(services, "[data-action]").length, 0, "services inside an agreement are read-only");
  const terms = one(page, "[data-module=\"agreement-terms\"]");
  assert.equal(terms.getAttribute("data-state"), "open", "the document is expanded by default");
  assert.deepEqual([one(terms, "[data-action=\"agreement.toggleTerms\"]").textContent, one(terms, "[data-action=\"agreement.toggleTerms\"]").getAttribute("aria-expanded")], ["Hide terms", "true"]);
  state.agreementTermsOpen = false;
  const collapsed = one(AgreementDetail(), "[data-module=\"agreement-terms\"]");
  assert.equal(all(collapsed, ".terms-heading").length + all(collapsed, ".terms-num").length, 0);
  const toggle = one(collapsed, "[data-action=\"agreement.toggleTerms\"]");
  assert.deepEqual([toggle.textContent, toggle.getAttribute("aria-expanded")], ["Show terms", "false"]);
  state.agreementTermsOpen = true;
  assert.deepEqual(all(terms, ".terms-heading").map((heading) => heading.textContent).slice(0, 2), ["Parties", "Winter service terms"], "the agreement text opens with the parties it fixes, then the terms");
  assert.deepEqual(all(terms, ".terms-num").map((row) => [row.getAttribute("data-depth"), one(row, ".terms-num__marker").textContent, one(row, ".terms-num__text").textContent.slice(0, 18)]), [
    ["1", "1.", "Services"], ["2", "1.1", "Granite Ridge clea"], ["2", "1.2", "Every visit is log"],
    ["1", "2.", "Service triggers"], ["2", "2.1", "Clearing starts on"], ["2", "2.2", "De-icing is applie"],
    ["1", "3.", "Invoicing"], ["1", "4.", "Access"], ["2", "1)", "Gate codes are sha"], ["2", "2)", "Blackout days are "],
  ]);
  assert.equal(all(terms, ".terms-list li").length, 11, "the eight party lines of the text and the three term items are list items");
  assert.equal(all(terms, "*").filter((node) => node.tagName === "SCRIPT" || node.tagName === "A").length, 0);
  assert.deepEqual(all(services, ".money-rows__row").map((row) => row.textContent).filter((row) => row.startsWith("Total")), ["Total$8,870.00 per season", "Total$9,650.00 / month"], "each option price in the agreement carries its period");
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
  assert.equal(all(changed, "[data-module=\"agreement-notice\"]").length, 0, "an active agreement shows no banner: its badge already says it is active");
  assert.equal(all(changed, "[data-action=\"agreement.approve\"]").length, 0);
  state.contractCommand = null;

  state.agreementId = "agreement-core-9103";
  const draft = AgreementDetail();
  assert.equal(draft.getAttribute("data-state"), "drafting");
  assert.equal(one(draft, "[data-module=\"agreement-detail-head\"] [data-module=\"status-badge\"]").textContent, "Being prepared");
  assert.equal(one(draft, "[data-module=\"agreement-notice\"]").textContent, "We’re preparing your service agreement from the options you approved. A manager approves it next; it appears here for your approval and we email you when it’s ready. Nothing is needed from you.", "a DRAFT agreement is being prepared by the provider and asks nothing of the client");
  assert.equal(all(draft, "[data-module=\"agreement-details\"]").length + all(draft, "[data-contract-detail]").length, 0, "no details form: the details came with the approvals");
  assert.equal(all(draft, "[data-module=\"agreement-approve\"]").length, 0);
  assert.doesNotMatch(draft.textContent, /CLIENT_DETAILS_ERRORS|MISSING|missing/, "what the manager still has to complete is never shown to the client");
  assert.deepEqual(all(draft, "[data-module=\"agreement-property\"]").map((entry) => all(entry, "[data-module=\"quote-option\"]").map((card) => card.getAttribute("data-state"))), [["approved"]], "a DRAFT agreement lists the options the client approved");

  for (const [id, stage, notice] of [
    ["agreement-core-9104", "drafting", "We’re preparing your service agreement from the options you approved. A manager approves it next; it appears here for your approval and we email you when it’s ready. Nothing is needed from you."],
    ["agreement-core-9100", "active", null],
    ["agreement-core-9099", "expired", null],
    ["agreement-core-9095", "approved", null],
    ["agreement-core-9098", "suspended", null],
    ["agreement-core-9097", "archived", null],
    ["agreement-core-9096", "canceled", null],
  ]) {
    state.agreementId = id;
    const detail = AgreementDetail();
    assert.equal(detail.getAttribute("data-state"), stage);
    assert.equal((one(detail, "[data-module=\"agreement-notice\"]") || { textContent: null }).textContent, notice, stage + ": a banner appears only while the provider has a step to take");
    assert.equal(all(detail, "[data-module=\"agreement-approve\"]").length, 0, stage + " offers no approval");
    assert.doesNotMatch(detail.textContent, /This agreement is active|shown for reference|You approved this agreement/);
  }

  state.agreementId = "agreement-core-1";
  assert.equal(AgreementDetail().getAttribute("data-state"), "not-found");
  assert.equal(contractAgreementFor("agreement-core-9102").properties.length, 2);
  assert.equal(quoteGroupFor("gr-foothill").id, "quote-0-7101", "a property's fixture key still finds its current quotes");
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

  state.sessionName = "priya@example.test";
  assert.equal(header(Overview()), "Welcome back", "a sign-in name is never the greeting; only the Account's own contact is");
  state.moduleData.profile = { state: "ready", accountName: "Natarajan Holdings", contact: { name: "Priya Natarajan", firstName: "Priya", title: "" }, emails: [], phones: [], billingAddresses: [] };
  assert.equal(header(Overview()), "Welcome back, Priya");
  delete state.moduleData.profile;

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
  assert.equal(all(noGeography, "[data-module=\"weather-summary\"]").length, 0, "without a configured forecast there is no forecast card");
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
  assert.equal(one(page, ".page-header__sub").textContent, "Snowfall 2 cm", "a live home counts no properties and calls none under contract");
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
  assert.deepEqual(all(detail, "[data-fact]").map((fact) => fact.getAttribute("data-fact")), [], "no contract, zone, lot, quote or map fact is invented for a live property");
  assert.equal(all(detail, "[data-module=\"property-facts\"]").length, 0, "with no fact to show there is no empty facts card");
  assert.equal(all(detail, ".prop-head__addr").length, 0);
  assert.equal(all(detail, ".status-badge").length, 0, "a live property header shows no status rather than Active Monitoring");
  assert.equal(all(detail, "[data-module=\"property-visits\"]").length + all(detail, "[data-module=\"section-unavailable\"]").length, 0, "visits have no live source, so the page has no Service — Not available yet card");
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
  ], "without a map on the portal there is no map fact, a plan id is never shown as a price, and decided quotes are not listed");
  assert.doesNotMatch(keyless.textContent, /\$898|option approved|declined/);
  state.propertyId = "prop-cinnamon";
  const waiting = one(PropertyDetail(), "[data-fact=\"quotes\"]");
  assert.equal(one(waiting, ".prop-fact__value").textContent, "3 quotes · awaiting your decision ›", "quotes are shown on a property only while one awaits a decision");
  assert.equal(one(waiting, ".link-action").getAttribute("data-id"), "quote-0-7104", "the property's quotes open their package group");
  state.propertyId = "prop-foothill";
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
  const keyed = PropertyDetail();
  assert.deepEqual(all(keyed, "[data-fact]").map((fact) => fact.getAttribute("data-fact")), ["contract", "zone", "lot"], "the Location card shows the map, so no map fact repeats it");
  const pinned = one(keyed, "[data-module=\"property-location\"]");
  assert.equal(pinned.getAttribute("data-state"), "placed");
  assert.equal(one(pinned, "[data-visual-id=\"property-location-link\"]").getAttribute("data-action"), "property.showOnMap");
  assert.equal(one(pinned, "[data-visual-id=\"property-location-link\"]").textContent, "See it with your other properties ›");

  const alkire = overviewProperties.find((property) => property.name === "Alkire Street");
  withProperties(() => { alkire.lat = null; alkire.lon = null; alkire.address = ""; }, () => {
    state.propertyId = alkire.id;
    const unplaced = PropertyDetail();
    assert.equal(all(unplaced, "[data-module=\"property-location\"]").length + all(unplaced, "[data-module=\"location-unavailable\"]").length, 0, "a property that cannot be placed has no location block and no way to a home map pin it does not have");
  });
  withProperties(() => { alkire.lat = null; alkire.lon = null; }, () => {
    state.propertyId = alkire.id;
    const locating = one(PropertyDetail(), "[data-module=\"property-location\"]");
    assert.equal(locating.getAttribute("data-state"), "locating", "an address the map has not placed is being located, and never pinned at the map centre");
    assert.equal(all(locating, "[data-visual-id=\"property-location-link\"]").length, 0);
  });

  state.currentSiteId = "quote-0-7101";
  const quoteLocation = one(ProposalDetail(), "[data-module=\"property-location\"]");
  assert.equal(quoteLocation.getAttribute("data-state"), "placed", "the quote detail shows its property on the map");
  assert.equal(all(quoteLocation, "[data-visual-id=\"property-location-link\"]").length, 0);
  configureFixture();
  state.currentSiteId = "quote-0-7101";
  assert.equal(all(ProposalDetail(), "[data-module=\"property-location\"]").length, 0, "without a map key the quote detail shows no location block; its address is already in the header");
}

{
  const ADDRESS = "1239 W Georgia St, Vancouver, BC V6E 4R8, Canada";
  const PLAN = "c08d28dc-0f70-4fb9-9d6e-1b881975d923";
  const ready = { state: "ready", scopeMode: "server-scoped", truncated: false };
  const decided = (...final) => SENT.concat(final);
  const quote = (id, codes, total, items) => orderRow(id, codes, { SERVICE_PROPERTY: { value: 983 }, SERVICE_ADDRESS: { value: "1239 W Georgia St, Vancouver, BC, V6E 4R8, CA" } }, { grandTotal: total, totalCharges: total, totalTaxes: 0, items: items.map((id) => ({ id })) });
  const month = (count) => ({ INTERVAL_UNIT: "MONTH", INTERVAL_COUNT: count });
  const item = (id, order, price, total, metadata) => Object.assign({ id, order: { id: order }, itemPrice: { id: price }, grandTotal: total, sortOrder: id }, metadata ? { metadata } : {});
  const recurring = (id, product) => ({ id, product: { id: product }, type: { id: 2, code: "TIERED_RECURRENT" } });
  const tiered = (id, product) => ({ id, product: { id: product }, type: { id: 1, code: "TIERED" } });
  const bilbo = (agreement = {}, extraOrders = []) => normalizeProposals({
    accountId: 732,
    scopeMode: "server-scoped",
    reads: { agreements: ready, orders: ready, orderItems: ready, productPrices: Object.assign({}, ready, { scopeMode: "unscoped" }), products: Object.assign({}, ready, { scopeMode: "unscoped" }) },
    client: { displayName: "Bilbo Baggins", account: {
      id: 732, nls: { en: { NAME: "Bilbo Baggins" } }, attributes: {},
      contacts: [{ id: 731, type: { code: "LEGAL" }, firstName: "Bilbo", lastName: "Baggins", contactEntries: [{ id: 959, type: { code: "EMAIL" }, kind: { code: "WORK" }, value: "opanagushin+104@gmail.com" }, { id: 960, type: { code: "PHONE" }, kind: { code: "WORK" }, value: "+19991112233" }] }],
      addresses: [{ id: 767, types: [{ code: "BILLING" }], address: { id: 742, address1: "1239 W Georgia St, Vancouver, BC, V6E 4R8, CA", postalCode: "V6E 4R8" } }, { id: 766, types: [{ code: "SERVICE" }], address: { id: 360, city: "Vancouver", address1: "1239 W Georgia St", postalCode: "V6E 4R8" } }],
    } },
    agreements: [agreementDocument(["QUOTATION", "QUOTATION_SENT", "AWAITING_CLIENT_DETAILS", "DRAFT", "SENT_TO_CLIENT", "CLIENT_APPROVED"], Object.assign({
      CLIENT: { value: 732 }, ORDERS: { value: [114] },
    }, agreement), { id: 169, organization: { id: 43, code: "SNOWLIMITLESS", nls: { en: { NAME: "Limitless Snow Removal Corp." } } } })],
    agreementContents: [{ id: 338, document: { id: 169 }, language: { id: "eng" }, contentType: "TEXT", content: "# Parties\n\nService provider: Limitless Snow Removal Corp.\n- Phone: +1 604 670 0591\n\nClient: Bilbo Baggins\n- Billing address: 1239 W Georgia St, Vancouver, BC, V6E 4R8, CA\n\n# Test terms\n\n1. Services\n1.1 Snow is cleared." }],
    quoteOrders: [
      quote(113, decided("DECLINED"), 1512.5, [142, 143]),
      quote(114, decided("ACCEPTED", "ACTIVE"), 4217.94, [140, 141]),
      quote(115, decided("DECLINED"), 16871.75, [138, 139]),
    ].concat(extraOrders),
    orderItems: [
      item(138, 115, 226, 2991.95, month(5)), item(139, 115, 232, 13879.8, month(5)),
      item(140, 114, 52, 747.99, month(1)), item(141, 114, 58, 3469.95, month(1)),
      item(142, 113, 27, 934.99), item(143, 113, 35, 577.51),
    ],
    productPrices: [tiered(27, 25), tiered(35, 28), recurring(52, 25), recurring(58, 28), recurring(226, 25), recurring(232, 28)],
    products: [{ id: 25, nls: { en: { NAME: "Snow Removal" } } }, { id: 28, nls: { en: { NAME: "Rock Salt De-Icing" } } }],
  });
  const property = (planId = "") => ({
    id: "prop-core-983", backendId: 983, name: ADDRESS, address: ADDRESS, city: "Vancouver", postal: "V6E 4R8", region: "BC", country: "CA",
    category: null, stateCode: null, lat: null, lon: null, areaSqft: 50000, planId,
    zone: null, contract: null, quoteSiteId: null, appointment: null, ticket: null, lastService: null,
  });
  const live = (proposals, planId) => {
    applyPortalConfig(readPortalConfig({ dataset: { portalVertical: "snow", portalProfile: "stormRetail", portalTheme: "snow", portalDataMode: "live", portalAuthMode: "required", portalOrganization: "SNOWLIMITLESS", portalEnabledModules: "overview,properties,proposals,profile" } }));
    state.liveWeather = null;
    state.liveWeatherState = "off";
    state.contractCommand = null;
    state.contractConfirm = null;
    state.agreementTermsOpen = true;
    state.moduleData.properties = { state: "ready", accountId: 732, items: [property(planId)], scopeMode: "browser-filtered", truncated: false };
    state.moduleData.proposals = proposals;
    state.moduleStatus.proposals = "ready";
    state.moduleData.profile = { state: "ready", accountName: "Bilbo Baggins", contact: { name: "Bilbo Baggins", firstName: "Bilbo", title: "" }, emails: [], phones: ["+1 999-111-2233"], billingAddresses: [ADDRESS] };
  };
  const once = (root, text) => root.textContent.split(text).length - 1;
  const SEASON = { TERM_START_DATE: { value: "2026-11-01" }, TERM_END_DATE: { value: "2027-03-31" } };

  live(bilbo());
  const home = Overview();
  assert.equal(one(home, ".page-header__title").textContent, "Welcome back, Bilbo");
  assert.equal(all(home, ".page-header__sub").length, 0, "agreement 169 has no season dates, so the greeting has no subtitle and never counts properties");
  for (const id of ["weather-summary", "invoices", "upcoming-services", "support-requests", "section-unavailable"]) assert.equal(all(home, `[data-module="${id}"]`).length, 0, id + " has no live source and is not on the home");
  assert.equal(one(home, ".ov-grid").getAttribute("data-count"), "1");
  const card = one(home, "[data-module=\"active-contracts\"]");
  const contractRow = one(card, "[data-module=\"contract-row\"]");
  assert.equal(one(contractRow, ".ov-row__title").textContent, ADDRESS);
  assert.deepEqual(all(contractRow, ".status-badge").map((badge) => badge.textContent), ["Active"]);
  assert.equal(one(contractRow, ".ov-row__meta").textContent, "Monthly · CA$4,217.94 / month", "the home shows the active agreement's chosen option and its price per period");
  assert.equal(all(card, "[data-module=\"quote-decision\"]").length, 0, "no decision link while no quote waits");
  assert.equal(all(card, ".ov-lead").length, 0, "no \"1 service agreement\" count above the agreement");
  for (const block of [card, one(home, "[data-module=\"property-map\"]")]) assert.equal(once(block, "1239 W Georgia St"), 1, "the address appears once on each card");
  assert.equal(one(one(home, "[data-module=\"property-row\"]"), ".ov-prow__addr").textContent, "50,000 ft²");
  assert.doesNotMatch(home.textContent, /1 property|Not available yet|Forecast unavailable|1,512\.50|16,871\.75/);

  const contracts = ProposalsList();
  assert.equal(all(contracts, ".proposals-head__sub").length + all(contracts, "[data-module=\"proposal-rollup\"]").length, 0, "no subtitle and no counters");
  assert.equal(all(contracts, "[data-module=\"contracts-quotes\"]").length, 0, "113 and 115 were declined and 114 was approved: no quote waits, so there is no Quotes section");
  const agreementRow = one(contracts, "[data-module=\"agreement-row\"]");
  assert.equal(one(agreementRow, ".proposal-card__name").textContent, ADDRESS);
  assert.equal(one(agreementRow, ".proposal-card__meta").textContent, "Monthly · CA$4,217.94 / month");
  assert.equal(once(agreementRow, "Active"), 1, "the status shows once, as the badge");
  assert.equal(all(agreementRow, ".proposal-card__diamond").length, 0);
  const orderHistory = one(contracts, "[data-module=\"contracts-orders\"]");
  assert.doesNotMatch(contracts.textContent.replace(orderHistory.textContent, ""), /declined|Declined|quote/, "nothing about the decided quotes reaches the agreements list");
  assert.deepEqual(all(orderHistory, "[data-module=\"quote-row\"]").map((row) => [one(row, ".proposal-option__model").textContent, (one(row, ".proposal-option__total") || { textContent: null }).textContent, row.getAttribute("data-state")]).sort(), [
    ["Monthly", "CA$4,217.94 / month", "approved"],
    ["Per service", "Per visit", "declined"],
    ["Seasonal", "CA$16,871.75 per season", "declined"],
  ], "All orders lists the approved and the declined orders, each priced by its billing type");

  state.agreementId = "agreement-core-169";
  const plainAgreement = AgreementDetail();
  assert.equal(all(plainAgreement, ".proposal-detail-head__meta").length, 0, "no season without dates, and no property or quote count");
  assert.equal(all(plainAgreement, "[data-module=\"agreement-notice\"]").length + all(plainAgreement, "[data-module=\"agreement-approve\"]").length, 0, "an active agreement needs nothing from the client, so there is no banner");
  assert.deepEqual(all(one(plainAgreement, "[data-module=\"agreement-party\"]"), "dt").map((label) => label.textContent), [], "agreement 169 carries no provider phone or e-mail, so none is shown");
  const services = one(plainAgreement, "[data-module=\"agreement-services\"]");
  assert.equal(once(services, "1239 W Georgia St"), 1, "the property address appears once among the services");
  assert.equal(all(services, ".agreement-property__address").length, 0);
  assert.deepEqual(all(services, ".money-rows__row").map((row) => row.textContent), ["TotalCA$4,217.94 / month"], "with no taxes only the total is shown, with its period");
  assert.deepEqual(all(services, ".purch-line__title").map((line) => line.textContent), ["Snow Removal", "Rock Salt De-Icing"]);
  assert.equal(one(plainAgreement, "[data-module=\"agreement-terms\"]").getAttribute("data-state"), "open");
  assert.equal(one(plainAgreement, "[data-action=\"agreement.toggleTerms\"]").textContent, "Hide terms");
  assert.deepEqual(all(plainAgreement, ".terms-heading").map((heading) => heading.textContent), ["Parties", "Test terms"], "agreement 169 reads its parties and its terms from the one text");
  const client = all(plainAgreement, "[data-module=\"agreement-party\"]")[1];
  assert.equal(all(client, "dd").find((value) => value.textContent.startsWith("1239")).textContent, ADDRESS, "the billing address reads like the property address");
  assert.equal(all(client, "dd").map((value) => value.textContent).includes("+1 999-111-2233"), true);

  state.propertyId = "prop-core-983";
  const detail = PropertyDetail();
  assert.equal(one(detail, ".prop-head__title").textContent, ADDRESS);
  assert.equal(all(detail, ".prop-head__addr").length, 0, "the address is the title and is not repeated under it");
  assert.deepEqual(all(detail, "[data-fact]").map((fact) => [fact.getAttribute("data-fact"), one(fact, ".prop-fact__value").textContent]), [["area", "50,000 ft²"]]);
  const service = one(detail, "[data-module=\"property-service\"]");
  assert.equal(one(service, ".prop-service__option").textContent, "Monthly");
  assert.equal(one(service, ".prop-service__price").textContent, "CA$4,217.94 / month");
  assert.deepEqual(all(service, ".prop-service__line").map((line) => line.textContent), ["Snow Removal", "Rock Salt De-Icing"], "the service block names the services on the chosen option");
  assert.deepEqual([one(service, "[data-action=\"agreement.open\"]").getAttribute("data-id"), one(service, "[data-action=\"agreement.open\"]").textContent], ["agreement-core-169", "View agreement ›"]);
  for (const absent of ["property-visits", "property-location", "location-unavailable", "section-unavailable", "property-plan"]) assert.equal(all(detail, `[data-module="${absent}"]`).length, 0, absent + " has nothing to show for this property");
  assert.equal(all(detail, "[data-fact=\"quotes\"]").length, 0, "no quote waits, so the declined quotes are not linked");
  assert.doesNotMatch(detail.textContent, /Not available yet|declined|2 quotes|Location unavailable/);

  live(bilbo(SEASON), PLAN);
  const fetched = [];
  globalThis.fetch = (url, options) => { fetched.push([url, options.credentials]); return new Promise(() => {}); };
  assert.equal(one(Overview(), ".page-header__sub").textContent, "Season Nov 1, 2026 – Mar 31, 2027", "the subtitle is the active agreement's season");
  assert.equal(one(Overview(), "[data-module=\"contract-row\"] .ov-row__meta").textContent, "Monthly · CA$4,217.94 / month · Season Nov 1, 2026 – Mar 31, 2027");
  assert.equal(one(Overview(), "[data-module=\"property-row\"] .ov-prow__addr").textContent, "50,000 ft² · Plan approved");
  assert.equal(one(ProposalsList(), "[data-module=\"agreement-row\"] .proposal-card__meta").textContent, "Monthly · CA$4,217.94 / month · Season Nov 1, 2026 – Mar 31, 2027", "the agreement row adds the season when the agreement has dates");
  state.agreementId = "agreement-core-169";
  const seasoned = AgreementDetail();
  assert.equal(one(seasoned, ".proposal-detail-head__meta").textContent, "Season Nov 1, 2026 – Mar 31, 2027");
  assert.equal(all(seasoned, "[data-module=\"agreement-term\"]").length, 0, "the season is under the title and not repeated in a term card");
  const provider = one(seasoned, "[data-module=\"agreement-party\"]");
  assert.deepEqual(all(provider, ".agreement-facts__row").length, 0, "the provider card names the owning organization only; its contact details are in the agreement text");
  assert.equal(one(provider, ".agreement-party__name").textContent, "Limitless Snow Removal Corp.");
  assert.equal(all(provider, "img").length, 0, "no agreement attribute names a logo any more");
  assert.equal(AgreementParties({ provider: { legalName: "", phone: "", email: "", logoImageId: "" }, client: {} }).children.length, 0, "a party with nothing stated has no card");
  const plannedDetail = PropertyDetail();
  assert.deepEqual(all(plannedDetail, "[data-fact]").map((fact) => [fact.getAttribute("data-fact"), one(fact, ".prop-fact__value").textContent]), [["area", "50,000 ft²"], ["plan", "Approved"], ["season", "Nov 1, 2026 – Mar 31, 2027"]]);
  assert.equal(one(plannedDetail, "[data-module=\"property-plan\"]").getAttribute("data-state"), "loading", "an approved plan is read and drawn on the property page");
  assert.deepEqual(fetched, [["/core/media/" + PLAN + "/stream.json", "omit"]], "the plan drawing is the public MediaAsset stream the review page reads, without credentials");
  state.currentSiteId = quotePackage().groups.find((group) => group.property && group.property.planId === PLAN).id;
  const quotedPlan = ProposalDetail();
  assert.equal(one(quotedPlan, ".proposal-detail-head__meta").textContent, "Service area 50,000 ft²", "a quote states its property's service area, the one area the price is set for");
  assert.equal(one(quotedPlan, "[data-module=\"property-plan\"]").getAttribute("data-state"), "loading", "and shows the property's plan above its options");
  assert.equal(fetched.length, 1, "the plan file is read once for both pages");

  const drawn = [];
  const planEntry = propertyPlan("8b6962ae-d617-438b-8aa3-4db8d089fc47", () => drawn.push("changed"), async () => ({ ok: true, json: async () => ({
    type: "PropertyPlan", schemaVersion: 1,
    elements: [
      { label: "Entrance walkway", elementTypeDictionaryId: 1, overlays: [{ map: "GOOGLE_MAPS", geometry: { type: "Polygon", coordinates: [[[-123.1141, 49.2608], [-123.1139, 49.2608], [-123.1139, 49.2609], [-123.1141, 49.2609], [-123.1141, 49.2608]]] } }] },
      { label: "Salt bin", elementTypeDictionaryId: 2, overlays: [{ map: "GOOGLE_MAPS", geometry: { type: "Point", coordinates: [-123.114, 49.26085] } }] },
    ],
  }) }));
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual([planEntry.status, drawn.length], ["ready", 1], "a plan that loads re-renders the page once");
  const drawing = PropertyPlan(planEntry);
  assert.equal(all(drawing, "path.prop-plan__shape").length + all(drawing, "circle.prop-plan__shape").length, 2, "each plan element is drawn from its geometry");
  assert.deepEqual(all(drawing, ".prop-plan__name").map((name) => name.textContent), ["Entrance walkway", "Salt bin"]);
  assert.deepEqual(all(drawing, ".prop-plan__figure .prop-plan__label").map((label) => label.textContent), ["Entrance walkway"], "a shape with an area carries its name on the drawing");
  assert.equal(all(drawing, ".prop-plan__size").length, 0, "a plan shown without the property's service area states no measurement");
  const measured = Math.round(planEntry.plan.squareFeet);
  assert.deepEqual(all(PropertyPlan(planEntry, { areaSqft: measured }), ".prop-plan__size").map((size) => size.textContent), [new Intl.NumberFormat("en").format(measured) + " ft²"], "a service area measured from the plan is broken down by its shapes");
  assert.equal(all(PropertyPlan(planEntry, { areaSqft: measured + 3000 }), ".prop-plan__size").length, 0, "a typed service area is the only area shown: the plan's own measurements do not compete with it");
  const missing = propertyPlan("6d6d69a3-32f5-47f5-afbf-08cdc61b35d8", () => {}, async () => ({ ok: false, status: 404 }));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(PropertyPlan(missing), null, "a plan that cannot be read shows nothing");
  assert.equal(propertyPlan("", () => {}), null, "a property without a plan shows nothing");

  const sentQuote = (id) => quote(id, SENT, 2100, []);
  live(bilbo({}, [sentQuote(116)]));
  const waitingCard = one(Overview(), "[data-module=\"active-contracts\"]");
  const link = one(waitingCard, "[data-module=\"quote-decision\"]");
  assert.deepEqual([link.textContent, link.getAttribute("data-action")], ["1 quote waiting for your decision›", "overview.openContracts"], "a quote awaiting the client is a prominent link to Contracts");
  const listed = ProposalsList();
  assert.deepEqual(all(listed, "[data-module=\"contracts-quotes\"] [data-module=\"quote-property\"]").map((group) => [group.getAttribute("data-state"), one(group, ".proposal-card__meta").textContent]), [["open", "1 quote"]], "only the quote that waits is listed, and its header names the address once");
  assert.equal(once(one(listed, "[data-module=\"contracts-quotes\"] [data-module=\"quote-property\"]"), "1239 W Georgia St"), 1);
  assert.equal(one(PropertyDetail(), "[data-fact=\"quotes\"] .prop-fact__value").textContent, "1 quote · awaiting your decision ›");
  live(bilbo({}, [sentQuote(116), sentQuote(117)]));
  assert.equal(one(Overview(), "[data-module=\"quote-decision\"]").textContent, "2 quotes waiting for your decision›");
  state.moduleData.properties = null;
  delete state.moduleData.profile;
}

for (const property of overviewProperties) {
  assert.ok(!warnings.some((line) => line.includes(property.address)), "a console warning must never carry a customer address");
}

console.log("snow-contracts-check ok: Orders, their lines and the agreement document normalize with absent data left absent and every figure taken from Core, the terms keep their headings, items and numbered outline as text, the Contracts page lists agreements by what they need from the customer with their chosen option, price per period and season, and only the quotes that still wait, with no subtitle or counters, the quote detail shows each option's lines and server totals with approve, request changes and decline for a sent quote as soon as it is shown and no retired Beam or plan claims, the agreement detail shows the season under the title, a banner only when the client must act, parties without placeholders, the provider contact the agreement carries, approved services with their totals before taxes and the plus applicable taxes note and collapsed terms, the live home, Contracts, agreement and property pages for a real client show each address once, the active option, waiting quotes and the plan drawing and nothing without data, and live mode opens Contracts through the snow adapter while other verticals stay closed");

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
