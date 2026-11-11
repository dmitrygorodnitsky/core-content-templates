import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const dom = createDom();
globalThis.window = globalThis;
globalThis.document = dom.document;
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };

const runtimeRoot = pathToFileURL(path.resolve("app-templates/customer-portal/runtime") + "/");
const load = (file) => import(new URL(file, runtimeRoot));
const { readPortalConfig } = await load("src/config.js");
const { applyPortalConfig, quotePackage, state } = await load("src/state.js");
const { PortalRuntime } = await load("src/portal-runtime.js");
const { CONTRACT_EVENTS, createContractCommands } = await load("src/contract-commands.js");
const { createFixtureContractsGateway, fixtureAdapter } = await load("src/adapters/fixture-adapter.js");
const { createCoreSnowQuotesAdapter } = await load("src/adapters/core-snow-adapter.js");
const { contractsPackage, findQuote, normalizeContracts } = await load("src/normalizers/contracts.js");
const { normalizeProposals } = await load("src/normalizers/index.js");
const { ProposalsList } = await load("src/routes/ProposalsPage.js");
const { ProposalDetail } = await load("src/routes/ProposalDetailPage.js");
const { AgreementDetail } = await load("src/routes/AgreementDetailPage.js");

const ORIGIN = "https://portal.example.test";
const ACCOUNT = 62;
const all = (root, selector) => root.querySelectorAll(selector);
const one = (root, selector) => root.querySelector(selector);
const plain = (value) => JSON.parse(JSON.stringify(value));

function coreOrder(id, stateCode, property, model, charges, extra = {}) {
  return Object.assign({
    id,
    account: { optimistic: 18, id: ACCOUNT },
    type: { optimistic: 4, id: 6, code: "WINTER_SERVICES_ORDER" },
    currency: { optimistic: 0, id: 21, code: "CAD" },
    totalCharges: charges,
    totalTaxes: 0,
    grandTotal: charges,
    states: [{ id: 200 + id, code: stateCode }],
    attributes: {
      5: Object.assign({ CLIENT: { value: ACCOUNT }, PRICING_MODEL: { value: model } }, property ? { SERVICE_PROPERTY: { value: property } } : {}),
      6: { QUOTE_REQUEST_FORM_ID: { value: 7 } },
    },
    items: [{ id: id * 10 + 1 }, { id: id * 10 + 2 }],
  }, extra);
}

function coreLine(orderId, position, priceId, amount) {
  return {
    amount, notes: "Line note for the operator", sortOrder: position - 1, attributes: {},
    itemPrice: { optimistic: 1, id: priceId }, id: orderId * 10 + position,
    type: { optimistic: 3, id: 5, code: "SNOW_REMOVAL_ORDER_ITEM" }, itemCount: 1, grandTotal: amount, totalTaxes: 0,
    order: { id: orderId },
  };
}

function coreAgreement(id, stateCode, orders, attributes = {}) {
  return {
    optimistic: 9,
    id,
    type: { optimistic: 2, id: 17, code: "SERVICE_AGREEMENT", nls: { en: { NAME: "Service Agreement" } } },
    organization: { optimistic: 12, id: 43, code: "GRANITE_RIDGE_SNOW", nls: { en: { NAME: "Granite Ridge Snow Removal" } } },
    states: [{ id: 300 + id, code: stateCode }],
    attributes: { 17: Object.assign({ CLIENT: { value: ACCOUNT }, ORDERS: { value: orders } }, attributes) },
  };
}

function coreTable() {
  return {
    agreements: [
      coreAgreement(5602, "SENT_TO_CLIENT", [4001], {
        LEGAL_NAME: { value: "Harbour View Strata" }, CLIENT_TYPE: { value: "ORGANIZATION" },
        EFFECTIVE_DATE: { value: "2026-10-01" }, TERM_START_DATE: { value: "2026-11-01" }, TERM_END_DATE: { value: "2027-03-31" },
        PROVIDER_LEGAL_NAME: { value: "Granite Ridge Snow Removal LLC" },
        CONTRACT_TERMS: { value: "# Scope\nSnow clearing and de-icing.\n\n1. Billing\n- Seasonal options are invoiced once." },
      }),
    ],
    orders: [
      coreOrder(4001, "ACCEPTED", 958, "SEASONAL", 26751.6),
      coreOrder(4101, "QUOTE_SENT", 959, "SEASONAL", 26751.6),
      coreOrder(4102, "QUOTE_SENT", 959, "PER_SERVICE", 2444.72),
      coreOrder(4103, "DRAFT", 959, "MONTHLY", 6687.9),
    ],
    orderItems: [
      coreLine(4001, 1, 227, 4891.92), coreLine(4001, 2, 233, 21859.68),
      coreLine(4101, 1, 227, 4891.92), coreLine(4101, 2, 233, 21859.68),
      coreLine(4102, 1, 28, 1528.48), coreLine(4102, 2, 36, 916.24),
      coreLine(4103, 1, 53, 1222.98),
    ],
    productPrices: [{ optimistic: 1, id: 227, product: { id: 25 } }, { optimistic: 1, id: 233, product: { id: 28 } }, { optimistic: 1, id: 28, product: { id: 25 } }, { optimistic: 1, id: 36, product: { id: 28 } }],
    products: [{ optimistic: 1, id: 25, code: "PARKING_LOT_SNOW_REMOVAL", nls: { en: { NAME: "Snow Removal" } } }, { optimistic: 0, id: 28, code: "ROCK_SALT_DE_ICING", nls: { en: { NAME: "Rock Salt De-Icing" } } }],
    fail: {},
    events: [],
  };
}

function coreFetch(table) {
  return async (url, options) => {
    const target = new URL(url);
    const route = target.pathname;
    const body = options && options.body ? JSON.parse(options.body) : null;
    const failure = Object.keys(table.fail).find((fragment) => url.includes(fragment));
    if (failure) return { ok: false, status: table.fail[failure], async json() { return {}; } };
    const filter = (property) => ((body && body.filters) || []).find((entry) => entry.property === property);
    const ids = (property) => String(filter(property).value).split(",").map(Number);
    if (table.requests && body) table.requests.push({ route, mappings: body.mappings });
    if (route === "/core/api/document-type/list.json") return json({ resultSize: 1, result: [{ id: 17, code: "SERVICE_AGREEMENT" }] });
    if (route === "/core/api/tagged/document/list.json") {
      const rows = table.agreements.filter((row) => String(row.attributes[17].CLIENT.value) === filter("attributes.17.CLIENT.value").value);
      return json({ resultSize: rows.length, result: rows, sequence: 1 });
    }
    if (route === "/core-bill/api/tagged/order/list.json") return json({ resultSize: table.orders.length, result: table.orders, sequence: 1 });
    if (route === "/core-bill/api/tagged/order-item/list.json") return json({ resultSize: 1, result: table.orderItems.filter((row) => ids("order.id").includes(row.order.id)) });
    if (route === "/core-pim/api/product-price/list.json") return json({ resultSize: 1, result: table.productPrices.filter((row) => ids("id").includes(row.id)) });
    if (route === "/core-pim/api/product/list.json") return json({ resultSize: 1, result: table.products.filter((row) => ids("id").includes(row.id)) });
    if (route === "/core-bill/api/tagged/order/get.json") {
      const row = table.orders.find((candidate) => candidate.id === Number(target.searchParams.get("id")));
      return row ? json(row) : { ok: false, status: 404, async json() { throw new Error("empty"); } };
    }
    if (route === "/core/api/tagged/document/get.json") {
      const row = table.agreements.find((candidate) => candidate.id === Number(target.searchParams.get("id")));
      return row ? json(row) : { ok: false, status: 404, async json() { throw new Error("empty"); } };
    }
    const event = /^\/(core-bill|core)\/api\/tagged\/(order|document)\/(\d+)\/send-event\.json$/.exec(route);
    if (event) {
      table.events.push({ entity: event[2], id: Number(event[3]), code: target.searchParams.get("event") });
      if (table.eventStatus) return { ok: false, status: table.eventStatus, async json() { return table.eventBody || {}; } };
      if (!table.dropEvents) applyServerEvent(table, event[2], Number(event[3]), target.searchParams.get("event"));
      return { ok: true, status: 200, async json() { throw new Error("empty body"); } };
    }
    throw new Error("unexpected request " + url);
  };
}

function applyServerEvent(table, entity, id, code) {
  const [source, next] = code.split("-");
  const rows = entity === "order" ? table.orders : table.agreements;
  const row = rows.find((candidate) => candidate.id === id);
  if (!row || row.states[0].code !== source) return;
  row.states = [{ id: row.states[0].id + 1000, code: next }];
  if (entity === "order" && next === "ACCEPTED") {
    const property = row.attributes[5].SERVICE_PROPERTY && row.attributes[5].SERVICE_PROPERTY.value;
    table.orders.forEach((other) => {
      const sameProperty = other.attributes[5].SERVICE_PROPERTY && other.attributes[5].SERVICE_PROPERTY.value === property;
      if (other.id !== id && sameProperty && other.states[0].code === "QUOTE_SENT") other.states = [{ id: other.states[0].id + 1000, code: "DECLINED" }];
    });
  }
}

function json(value) {
  return { ok: true, status: 200, async json() { return structuredClone(value); } };
}

function liveRuntime(table, dataset = {}) {
  applyPortalConfig(readPortalConfig({
    dataset: Object.assign({
      portalVertical: "snow", portalProfile: "stormRetail", portalTheme: "snow", portalDataMode: "live",
      portalAuthMode: "required", portalOrganization: "SNOWLIMITLESS", portalEnabledModules: "overview,properties,proposals",
    }, dataset),
  }));
  state.config.origin = ORIGIN;
  Object.assign(state.session, { authenticated: true, accessToken: "test-token", tokenType: "Bearer" });
  state.customerAccount = { id: ACCOUNT, displayName: "Harbour View Strata" };
  state.account = "ready";
  for (const id of ["proposals", "properties"]) {
    delete state.moduleData[id];
    delete state.moduleStatus[id];
  }
  globalThis.fetch = coreFetch(table);
  return new PortalRuntime({ state });
}

function quietConsole() {
  const original = { error: console.error, warn: console.warn };
  const errors = [];
  console.error = (...parts) => { errors.push(parts.map(String).join(" ")); };
  console.warn = () => {};
  return { errors, restore() { Object.assign(console, original); } };
}

{
  const table = coreTable();
  const runtime = liveRuntime(table);
  await runtime.loadAsync("proposals");
  const envelope = state.moduleData.proposals;
  assert.equal(state.moduleStatus.proposals, "ready");
  assert.equal(envelope.quotes.scopeMode, "server-scoped");
  assert.deepEqual(plain(envelope.quotes.reads), {
    agreements: { state: "ready", scopeMode: "server-scoped", truncated: false },
    orders: { state: "ready", scopeMode: "server-scoped", truncated: false },
    orderItems: { state: "ready", scopeMode: "server-scoped", truncated: false },
    productPrices: { state: "ready", scopeMode: "unscoped", truncated: false },
    products: { state: "ready", scopeMode: "unscoped", truncated: false },
  }, "the live envelope states per read whether it was server-scoped, browser-filtered or unscoped");
  assert.deepEqual(envelope.sites, [], "a live envelope carries no fixture sites");
  assert.equal(envelope.proposal, null);

  const pkg = quotePackage();
  assert.deepEqual(pkg.agreements.map((row) => [row.id, row.agreement.stage]), [["agreement-core-5602", "approval"]], "a quotation round carries no agreement");
  assert.deepEqual(pkg.groups.map((group) => [group.id, group.title, group.orders.map((order) => order.backendId)]), [["quote-0-959", "Property details unavailable", [4102, 4101]]], "a property the customer's properties list does not include is not named from another source");
  assert.equal(pkg.preparing, true, "the DRAFT Order is withheld and only says a request is being prepared");
  assert.deepEqual(findQuote(pkg, 4102).lines.map((line) => [line.product, line.unitPrice, line.total]), [["Snow Removal", "CA$1,528.48", "CA$1,528.48"], ["Rock Salt De-Icing", "CA$916.24", "CA$916.24"]]);
  assert.equal(findQuote(pkg, 4103), null, "the operator-side Order and its lines never reach a page");

  state.moduleData.properties = { state: "ready", accountId: ACCOUNT, scopeMode: "browser-filtered", truncated: false, items: [{ id: "prop-core-959", backendId: 959, name: "Harbour View Tower", address: "1177 West Hastings Street, Vancouver, BC, V6E 2K3", lat: null, lon: null }] };
  assert.equal(quotePackage().groups[0].title, "Harbour View Tower", "a live group is named from the customer's own property list");

  const list = ProposalsList();
  assert.equal(list.getAttribute("data-state"), "ready");
  assert.equal(one(list, "h1").textContent, "Your contracts");
  assert.deepEqual(all(list, "[data-module=\"agreement-row\"]").map((row) => one(row, "[data-module=\"status-badge\"]").textContent), ["Sent for your approval"]);
  assert.equal(all(list, "[data-module=\"contracts-quotes\"] [data-module=\"quote-property\"]").length, 1);
  assert.equal(one(list, "[data-module=\"contracts-quotes\"] [data-module=\"quote-property\"] .proposal-card__meta").textContent, "1177 West Hastings Street, Vancouver, BC, V6E 2K3 · 2 quotes");
  assert.ok(!list.textContent.includes("Line note for the operator"), "operator notes on a line are never shown");

  state.currentSiteId = "quote-0-959";
  const detail = ProposalDetail();
  assert.deepEqual(all(detail, "[data-module=\"quote-option\"]").map((card) => card.getAttribute("data-state")), ["unseen", "unseen"]);
  assert.deepEqual(all(detail, "[data-module=\"quote-option\"] .money-rows__row").map((row) => row.textContent), ["TotalCA$26,751.60 per season"], "the seasonal option states only its total, the per-service option no total, and neither a subtotal or taxes");
  assert.deepEqual(all(detail, "[data-module=\"quote-totals\"]").map((node) => node.getAttribute("data-state")), ["per-service", null], "the per-service option says each service is paid when performed");

  state.agreementId = "agreement-core-5602";
  const agreement = AgreementDetail();
  assert.equal(agreement.getAttribute("data-state"), "approval");
  assert.deepEqual(all(agreement, "[data-module=\"agreement-party\"]").map((party) => [party.getAttribute("data-party"), one(party, ".agreement-party__name").textContent, all(party, ".agreement-facts__row").length]), [["provider", "Granite Ridge Snow Removal", 0], ["client", "Harbour View Strata", 0]], "each party shows its name and no row for a fact the agreement does not state");
  assert.equal(all(agreement, "[data-module=\"agreement-property\"]").length, 1);
  assert.equal(one(agreement, "[data-module=\"agreement-property\"] .agreement-property__title").textContent, "Property details unavailable");
  assert.equal(all(agreement, "[data-action=\"agreement.approve\"]").length, 1);
  assert.equal(table.events.length, 0, "reading and rendering send no event");
}

{
  const table = coreTable();
  table.requests = [];
  table.orders.forEach((row) => { delete row.attributes[5].PRICING_MODEL; });
  const SEASONAL_PRICES = [227, 233];
  table.productPrices.forEach((row) => { row.type = SEASONAL_PRICES.includes(row.id) ? { optimistic: 0, id: 6, code: "TIERED_RECURRENT" } : { optimistic: 3, id: 3, code: "TIERED" }; });
  table.orderItems.forEach((row) => {
    if (SEASONAL_PRICES.includes(row.itemPrice.id)) row.metadata = { QUOTE_TYPE: "SEASONAL", SERVICE_TYPE: "AREA_BASED_SNOW_REMOVAL", INTERVAL_UNIT: "MONTH", INTERVAL_COUNT: 5 };
  });
  await liveRuntime(table).loadAsync("proposals");
  const mappingsOf = (route) => table.requests.find((request) => request.route === route).mappings;
  const names = (mappings) => mappings.map((mapping) => mapping.name);
  assert.ok(names(mappingsOf("/core-bill/api/tagged/order-item/list.json")).includes("metadata"), "order lines are read with their metadata, where the pricer records each line's interval");
  assert.ok(["nls", "type"].every((name) => names(mappingsOf("/core-pim/api/product-price/list.json")).includes(name)), "prices are read with their name and type");
  assert.ok(!JSON.stringify(table.requests).includes("SERVICE_PERIOD"), "no read names an Order service period");
  const pkg = quotePackage();
  assert.deepEqual(pkg.groups[0].orders.map((order) => [order.backendId, order.pricingModel && order.pricingModel.label]), [[4102, "Per service"], [4101, "Seasonal"]], "without PRICING_MODEL the live portal names each option from its prices and the lines' interval");
  assert.equal(findQuote(pkg, 4001).pricingModel.label, "Seasonal");
}

{
  const console = quietConsole();
  try {
    const partial = coreTable();
    partial.fail["/core/api/tagged/document/list.json"] = 500;
    partial.fail["/core-pim/api/product/list.json"] = 401;
    const runtime = liveRuntime(partial);
    await runtime.loadAsync("proposals");
    assert.equal(state.moduleStatus.proposals, "ready", "a failed agreement read and a catalog 401 leave the module ready and partial");
    assert.equal(state.account, "ready", "a catalog 401 never signs the customer out");
    const page = ProposalsList();
    assert.equal(page.getAttribute("data-state"), "partial");
    assert.deepEqual(all(page, "[data-module=\"contracts-partial\"]").map((notice) => notice.textContent), [
      "!Your service agreements couldn’t be loaded, so only your quotes are shown.",
      "!Some services on your quotes couldn’t be loaded. Prices and totals shown come from our system as returned.",
    ]);
    assert.equal(all(page, "[data-module=\"agreement-row\"]").length, 0);
    assert.equal(one(page, "h1").textContent, "Your quotes");
    assert.deepEqual(quotePackage().groups.map((group) => group.id), ["quote-0-958", "quote-0-959"], "without readable agreements every quote stands outside a package");
    state.currentSiteId = "quote-0-959";
    const detail = ProposalDetail();
    assert.deepEqual(all(detail, ".quote-line__title--unnamed").map((node) => node.textContent), ["Unnamed service", "Unnamed service", "Unnamed service", "Unnamed service"], "an unreadable product is unnamed, never guessed");
    assert.equal(all(detail, "[data-module=\"contracts-partial\"]").length, 1);

    const noLines = coreTable();
    noLines.fail["/core-bill/api/tagged/order-item/list.json"] = 500;
    await liveRuntime(noLines).loadAsync("proposals");
    state.currentSiteId = "quote-0-959";
    assert.deepEqual(all(ProposalDetail(), "[data-module=\"quote-lines\"]").map((node) => node.textContent), ["The services on this quote couldn’t be loaded.", "The services on this quote couldn’t be loaded."]);

    const noOrders = coreTable();
    noOrders.fail["/core-bill/api/tagged/order/list.json"] = 500;
    await liveRuntime(noOrders).loadAsync("proposals");
    const agreementsOnly = ProposalsList();
    assert.equal(agreementsOnly.getAttribute("data-state"), "partial");
    assert.match(agreementsOnly.textContent, /Your quotes couldn’t be loaded, so only your service agreements are shown\./);
    assert.equal(all(agreementsOnly, "[data-module=\"contracts-quotes\"] [data-module=\"quote-property\"]").length, 0);
    assert.equal(all(agreementsOnly, "[data-module=\"agreement-row\"]").length, 1, "the one agreement the customer can act on is still listed");
    state.agreementId = "agreement-core-5602";
    assert.equal(all(AgreementDetail(), "[data-module=\"agreement-property\"]").length, 0, "an agreement whose Orders could not be read lists no invented service");

    const broken = coreTable();
    broken.fail["/core/api/tagged/document/list.json"] = 500;
    broken.fail["/core-bill/api/tagged/order/list.json"] = 500;
    await liveRuntime(broken).loadAsync("proposals").catch(() => null);
    assert.equal(state.moduleStatus.proposals, "error");
    const failed = ProposalsList();
    assert.equal(failed.getAttribute("data-state"), "error");
    assert.match(one(failed, "[data-module=\"error-state\"]").textContent, /Couldn’t load your contracts/);
    assert.equal(one(failed, "[data-module=\"error-state\"] [data-action]").getAttribute("data-action"), "ui.retry");

    const forbidden = coreTable();
    forbidden.fail["/core/api/tagged/document"] = 403;
    forbidden.fail["/core-bill/api/tagged/order/list.json"] = 403;
    await liveRuntime(forbidden).loadAsync("proposals").catch(() => null);
    const denied = ProposalsList();
    assert.equal(denied.getAttribute("data-state"), "unauthorized");
    assert.match(one(denied, "[data-module=\"unauthorized-state\"]").textContent, /doesn’t include access to your contracts/);
    state.agreementId = "agreement-core-5602";
    assert.equal(AgreementDetail().getAttribute("data-state"), "unauthorized");

    const expired = coreTable();
    expired.fail["/core-bill/api/tagged/order/list.json"] = 401;
    await liveRuntime(expired).loadAsync("proposals").catch(() => null);
    assert.equal(state.account, "session-expired", "a 401 on a customer read sends the customer back through sign-in");

    await liveRuntime(coreTable(), { portalVertical: "lawn", portalTheme: "lawn", portalProfile: "stormOps" }).loadAsync("proposals").catch(() => null);
    const closed = ProposalsList();
    assert.equal(closed.getAttribute("data-state"), "unavailable", "another vertical's live Contracts stay unavailable instead of showing a fixture proposal");
    assert.equal(one(closed, "[data-module=\"contracts-unavailable\"]").textContent, "○Contracts aren’t in the portal yetYour quotes and service agreements can’t be shown here yet.");

    liveRuntime(coreTable());
    state.moduleStatus.proposals = "loading";
    const loading = ProposalsList();
    assert.equal(loading.getAttribute("data-state"), "loading");
    assert.equal(one(loading, "[data-module=\"contracts-loading\"]").getAttribute("aria-busy"), "true");
    state.agreementId = "agreement-core-5602";
    assert.equal(AgreementDetail().getAttribute("data-state"), "loading");
  } finally {
    console.restore();
  }
}

function commandHarness(table, options = {}) {
  const runtime = liveRuntime(table);
  const renders = [];
  const busyAtRender = [];
  const toasts = [];
  let reloads = 0;
  const commands = createContractCommands({
    state,
    render() {
      renders.push(state.contractCommand ? state.contractCommand.phase : null);
      busyAtRender.push(commands.busy());
    },
    notify(message) { toasts.push(message); },
    current() { return quotePackage(); },
    context() { return { config: state.config, state }; },
    gateway() { return createCoreSnowQuotesAdapter({ fetch: coreFetch(table), origin: ORIGIN }); },
    reload() {
      reloads += 1;
      if (options.failReload && reloads >= options.failReload) return Promise.reject(Object.assign(new Error("readback failed"), { code: "core-request-failed" }));
      return runtime.reloadAsync("proposals").then(() => quotePackage());
    },
  });
  return { runtime, commands, renders, busyAtRender, toasts, reloads: () => reloads };
}

async function ready(harness) {
  await harness.runtime.loadAsync("proposals");
  state.contractCommand = null;
  state.contractConfirm = null;
}

{
  assert.deepEqual(plain(CONTRACT_EVENTS), {
    approve: { entity: "order", source: "QUOTE_SENT", code: "QUOTE_SENT-ACCEPTED" },
    decline: { entity: "order", source: "QUOTE_SENT", code: "QUOTE_SENT-DECLINED" },
    changes: { entity: "order", source: "QUOTE_SENT", code: "QUOTE_SENT-CUSTOMER_CHANGES_REQUESTED" },
    agreement: { entity: "document", source: "SENT_TO_CLIENT", code: "SENT_TO_CLIENT-CLIENT_APPROVED" },
  }, "the portal sends the three ORDER_LIFECYCLE client events and the agreement approval; there is no view event");

  const table = coreTable();
  table.orders.push(coreOrder(4104, "QUOTE_SENT", 959, "MONTHLY", 6687.9));
  table.agreements[0].attributes[17].ORDERS.value.push(4104);
  const harness = commandHarness(table);
  await ready(harness);
  const before = findQuote(quotePackage(), 4104);
  assert.equal(before.status, "unseen");
  state.contractConfirm = { kind: "approve", backendId: 4102 };
  const flight = harness.commands.decide("approve", 4102);
  assert.equal(state.contractCommand.phase, "pending", "the command is pending the moment it starts");
  assert.deepEqual(harness.busyAtRender, [true], "the pending page is drawn with the command already in flight, so every other decision renders disabled");
  assert.equal(await harness.commands.decide("decline", 4104), false, "a second command while one is in flight is refused");
  assert.equal(await harness.commands.approveAgreement(5602), false);
  assert.equal(findQuote(quotePackage(), 4104).status, "unseen", "while the approval is in flight the sibling is not predicted to be declined");
  assert.equal(await flight, true);
  assert.deepEqual(harness.busyAtRender, [true, false], "the readback is drawn once the command has left flight, with the decisions enabled again");
  assert.deepEqual(table.events, [{ entity: "order", id: 4102, code: "QUOTE_SENT-ACCEPTED" }], "exactly one event was sent");
  assert.equal(harness.reloads(), 1, "the page reads back once after the event");
  assert.equal(state.contractCommand, null);
  assert.equal(state.contractConfirm, null);
  assert.deepEqual(harness.toasts, ["Option approved"]);
  const read = quotePackage();
  assert.equal(findQuote(read, 4102).status, "approved");
  assert.equal(findQuote(read, 4104).status, "declined", "the sibling is declined because Core declined it, as read back");
  assert.equal(findQuote(read, 4101).status, "declined");
}

{
  const table = coreTable();
  const harness = commandHarness(table);
  await ready(harness);
  table.orders.find((row) => row.id === 4102).states = [{ id: 1, code: "DECLINED" }];
  assert.equal(await harness.commands.decide("approve", 4102), false);
  assert.equal(table.events.length, 0, "a quote that changed since it was read is not sent an event");
  assert.equal(state.contractCommand.phase, "conflict");
  assert.equal(harness.reloads(), 1, "the conflict is shown on fresh data");
  assert.equal(findQuote(quotePackage(), 4102).status, "declined");
  state.currentSiteId = "quote-0-959";
  const cards = all(ProposalDetail(), "[data-module=\"quote-option\"]");
  assert.deepEqual(cards.filter((card) => all(card, "[data-module=\"command-conflict\"]").length > 0).map((card) => card.getAttribute("data-state")), ["declined"], "the conflict is explained on the quote that changed, shown as Core now has it");
}

{
  const table = coreTable();
  const harness = commandHarness(table);
  await ready(harness);
  assert.equal(await harness.commands.decide("approve", 4103), false, "a quote still with the operator cannot be approved");
  assert.equal(await harness.commands.decide("decline", 4001), false, "an approved quote cannot be declined");
  assert.equal(await harness.commands.decide("requestChanges", 4102), false, "no change request is sent from the portal");
  assert.equal(await harness.commands.approveAgreement(5601), false, "an agreement the client does not hold cannot be approved");
  assert.equal(table.events.length + harness.reloads(), 0, "refused guards do no IO");
  assert.equal(state.contractCommand, null);
}

for (const [status, phase] of [[403, "refused"], [409, "refused"], [500, "failed"]]) {
  const table = coreTable();
  const harness = commandHarness(table);
  await ready(harness);
  table.eventStatus = status;
  assert.equal(await harness.commands.decide("decline", 4102), false);
  assert.equal(state.contractCommand.phase, phase, "HTTP " + status + " is " + phase);
  assert.deepEqual(state.contractCommand.targets, [4102]);
  assert.equal(harness.reloads(), 0);
  assert.equal(findQuote(quotePackage(), 4102).status, "unseen", "a refused or failed command changes nothing on the page");
}

{
  const table = coreTable();
  const harness = commandHarness(table);
  await ready(harness);
  table.eventStatus = 409;
  table.eventBody = { status: 409, message: "A legal address is required before this quote can be accepted." };
  assert.equal(await harness.commands.decide("decline", 4102), false);
  assert.equal(state.contractCommand.message, "A legal address is required before this quote can be accepted.", "a refusal keeps Core's reason");
  state.currentSiteId = "quote-0-959";
  const refusedCard = all(ProposalDetail(), "[data-module=\"quote-option\"]").find((card) => all(card, "[data-module=\"command-failure\"]").length);
  assert.match(one(refusedCard, "[data-module=\"command-failure\"]").textContent, /wasn’t accepted.*A legal address is required before this quote can be accepted\./, "and the customer reads it beside the option, never a silent refusal");
}

{
  const table = coreTable();
  const harness = commandHarness(table);
  await ready(harness);
  table.dropEvents = true;
  assert.equal(await harness.commands.decide("decline", 4102), false);
  assert.equal(table.events.length, 1);
  assert.equal(state.contractCommand.phase, "unconfirmed", "a 200 that Core did not apply is reported from the readback, not as success");
  assert.equal(findQuote(quotePackage(), 4102).status, "unseen");
}

{
  const table = coreTable();
  const harness = commandHarness(table, { failReload: 1 });
  await ready(harness);
  assert.equal(await harness.commands.decide("decline", 4102), false);
  assert.equal(table.events.length, 1);
  assert.equal(state.contractCommand.phase, "readback-failed", "an event that went out but could not be read back is its own state");
  const page = ProposalsList();
  assert.equal(page.getAttribute("data-state"), "readback-failed");
  assert.equal(all(page, "[data-module=\"contracts-quotes\"] [data-module=\"quote-property\"]").length, 0, "no stale quote is shown after the command");
}

{
  const table = coreTable();
  const harness = commandHarness(table);
  await ready(harness);
  table.fail["/core-bill/api/tagged/order/list.json"] = 500;
  assert.equal(await harness.commands.decide("approve", 4102), false);
  assert.equal(table.events.length, 1);
  assert.equal(state.contractCommand.phase, "readback-failed", "a readback whose Orders could not be read is not reported as a decision that did not register");

  const agreementTable = coreTable();
  const agreementHarness = commandHarness(agreementTable);
  await ready(agreementHarness);
  agreementTable.fail["/core/api/tagged/document/list.json"] = 500;
  assert.equal(await agreementHarness.commands.approveAgreement(5602), false);
  assert.equal(state.contractCommand.phase, "readback-failed", "the same holds for an agreement whose readback lost the agreements read");
}

{
  const table = coreTable();
  const harness = commandHarness(table);
  await ready(harness);
  table.eventStatus = 401;
  assert.equal(await harness.commands.decide("decline", 4102), false);
  assert.equal(state.account, "session-expired");
  assert.equal(state.contractCommand, null);
}

{
  const table = coreTable();
  const harness = commandHarness(table);
  await ready(harness);
  state.contractConfirm = { kind: "agreement", backendId: 5602 };
  assert.equal(await harness.commands.approveAgreement(5602), true);
  assert.deepEqual(table.events, [{ entity: "document", id: 5602, code: "SENT_TO_CLIENT-CLIENT_APPROVED" }]);
  assert.equal(quotePackage().agreements.find((row) => row.agreement.backendId === 5602).agreement.stage, "approved");
  assert.deepEqual(harness.toasts, ["Agreement approved"]);
  state.agreementId = "agreement-core-5602";
  const approved = AgreementDetail();
  assert.equal(all(approved, "[data-module=\"agreement-notice\"]").length, 0, "an approved agreement needs nothing from the customer, so it shows no banner");
  assert.equal(all(approved, "[data-module=\"agreement-approve\"]").length, 0);

  table.agreements.push(coreAgreement(5699, "SENT_TO_CLIENT", [], { CLIENT: { value: 701 } }));
  await ready(harness);
  state.moduleData.proposals.quotes.agreements.push(Object.assign({}, state.moduleData.proposals.quotes.agreements[0], { id: "agreement-core-5699", backendId: 5699, stateCode: "SENT_TO_CLIENT", stage: "approval", allowedActions: ["approve"] }));
  assert.equal(await harness.commands.approveAgreement(5699), false);
  assert.equal(state.contractCommand.phase, "refused", "an agreement Core says belongs to another client is refused before any event");
  assert.equal(table.events.length, 1);
}

{
  const table = coreTable();
  const harness = commandHarness(table);
  await ready(harness);
  assert.equal("view" in harness.commands, false, "the portal has no view command: ORDER_LIFECYCLE keeps a shown quote in QUOTE_SENT");
  assert.equal(table.events.length + harness.reloads(), 0, "loading Contracts sends no event");
}

{
  const state = { porders: [], pagreements: [] };
  const fixture = (await load("data/cases/granite-ridge-snow.js")).graniteRidgeSnowFixture;
  state.porders = structuredClone(fixture.proposals.orders);
  state.pagreements = structuredClone(fixture.proposals.agreements);
  const gateway = createFixtureContractsGateway(state);
  const latest = (rows, id) => rows.find((row) => row.id === id).states.at(-1).code;
  await assert.rejects(gateway.sendOrderEvent(8113, "QUOTE_SENT-ACCEPTED"), (error) => error.code === "command-refused", "the fixture refuses an event from the wrong state, as Core would");
  const details = { LEGAL_NAME: { value: "Whitlock Property Group LLC" }, CLIENT_TYPE: { value: "CORPORATE" } };
  await gateway.sendOrderEvent(8111, "QUOTE_SENT-ACCEPTED", {}, details);
  assert.deepEqual([8110, 8111, 8112].map((id) => latest(state.porders, id)), ["DECLINED", "ACCEPTED", "DECLINED"], "approving an option declines its open siblings for the same property");
  const held = state.pagreements.length;
  assert.equal(state.pagreements.some((row) => latest(state.pagreements, row.id) === "DRAFT" && row.attributes[17].ORDERS.value.includes(8111)), false, "a round with a property still under revision is not settled");
  for (const id of [8104, 8105, 8106]) state.porders.find((row) => row.id === id).states.push({ code: "QUOTE_SENT" });
  await gateway.sendOrderEvent(8104, "QUOTE_SENT-DECLINED");
  await gateway.sendOrderEvent(8105, "QUOTE_SENT-DECLINED");
  await gateway.sendOrderEvent(8106, "QUOTE_SENT-ACCEPTED", {}, details);
  assert.equal(state.pagreements.length, held + 1, "once every property of the round is settled one agreement is made");
  const made = state.pagreements.at(-1);
  assert.deepEqual([made.id, latest(state.pagreements, made.id), made.attributes[17].ORDERS.value, made.attributes[17].LEGAL_NAME.value], [9105, "DRAFT", [8102, 8106, 8111], "Whitlock Property Group LLC"], "the agreement starts at DRAFT with only the approved quotes and the details that came with the approval");
  await gateway.sendAgreementEvent(9102, "SENT_TO_CLIENT-CLIENT_APPROVED");
  assert.equal(latest(state.pagreements, 9102), "CLIENT_APPROVED");
  await assert.rejects(gateway.readOrder(1), (error) => error.code === "not-found");

  const raw = fixtureAdapter.load("proposals", { config: { caseId: "granite-ridge-snow" }, state: { theme: "Snow Removal", psites: [], porders: state.porders, pagreements: state.pagreements } });
  const normalized = normalizeProposals(raw);
  assert.equal(normalized.quotes.scopeMode, null, "a fixture envelope was scoped by no server and says so");
  const pkg = contractsPackage(normalizeContracts(raw), fixture.overview.properties);
  assert.equal(pkg.agreements.find((row) => row.id === "agreement-core-9105").agreement.label, "Being prepared");
}

{
  const { Overview } = await load("src/routes/OverviewPage.js");
  const { PropertyDetail } = await load("src/routes/PropertyDetailPage.js");
  const console = quietConsole();
  const place = (backendId, name) => ({ id: "prop-core-" + backendId, backendId, name, address: "", lat: null, lon: null, zone: null, contract: null, quoteSiteId: null, appointment: null, ticket: null, lastService: null });
  const properties = { state: "ready", accountId: ACCOUNT, scopeMode: "browser-filtered", truncated: false, items: [place(958, "Juniper Terrace"), place(959, "Aspen Commons")] };
  const widget = async (table, dataset) => {
    const runtime = liveRuntime(table || coreTable(), dataset);
    state.contractCommand = null;
    state.moduleData.properties = structuredClone(properties);
    state.moduleStatus.properties = "ready";
    if (table) await runtime.loadAsync("proposals").catch(() => null);
    return one(Overview(), "[data-module=\"active-contracts\"]");
  };
  try {
    const loading = await widget(null);
    assert.equal(loading.getAttribute("data-state"), "loading", "the home widget waits for the Contracts read");
    assert.equal(loading.getAttribute("aria-busy"), "true");
    assert.equal(all(loading, "[data-module=\"section-unavailable\"]").length, 0);

    const ready = await widget(coreTable());
    assert.equal(ready.getAttribute("data-state"), "ready", "the home widget reads the same live module as the Contracts page");
    assert.equal(one(ready, ".ov-card__title").textContent, "Contracts");
    assert.equal(all(ready, ".ov-lead").length, 0, "the home widget shows no counters");
    const rows = all(ready, "[data-module=\"contract-row\"]");
    assert.deepEqual(rows.map((row) => row.getAttribute("data-state")), ["approval"], "the quotation round carries no agreement, so only the agreement waiting for approval is listed");
    assert.deepEqual(rows.map((row) => one(row, ".ov-row__title").textContent), ["Juniper Terrace"]);
    assert.deepEqual(rows.map((row) => one(row, ".status-badge").textContent), ["Sent for your approval"]);
    assert.deepEqual(rows.map((row) => [one(row, ".ov-chev").getAttribute("data-action"), one(row, ".ov-chev").getAttribute("data-id")]), [["agreement.open", "agreement-core-5602"]]);
    assert.deepEqual(rows.map((row) => (one(row, ".ov-row__meta") || { textContent: "" }).textContent), ["Seasonal · CA$26,751.60 per season · Season Nov 1, 2026 – Mar 31, 2027"], "the row names the chosen option, its total with its period and the season");
    assert.equal(one(ready, ".ov-more").getAttribute("data-action"), "overview.openContracts");
    assert.doesNotMatch(ready.textContent, /aren’t in the portal yet|No active contracts/);

    state.propertyId = "prop-core-958";
    const approval = one(PropertyDetail(), "[data-module=\"property-service\"]");
    assert.equal(one(approval, ".status-badge").textContent, "Sent for your approval");
    assert.equal(one(approval, "[data-action=\"agreement.open\"]").getAttribute("data-id"), "agreement-core-5602", "the property's service links to its agreement");

    const emptyTable = coreTable();
    emptyTable.agreements = [];
    emptyTable.orders = [];
    const empty = await widget(emptyTable);
    assert.equal(empty.getAttribute("data-state"), "empty");
    assert.equal(one(empty, ".ov-empty").textContent, "No contracts yetWhen we send you a quote or a service agreement, it appears here.");
    state.propertyId = "prop-core-958";
    assert.equal(all(PropertyDetail(), "[data-module=\"property-service\"]").length, 0, "a read that found no agreement shows no service card");

    const preparingTable = coreTable();
    preparingTable.agreements = [];
    preparingTable.orders = [coreOrder(4103, "DRAFT", 959, "MONTHLY", 6687.9)];
    const preparing = await widget(preparingTable);
    assert.equal(preparing.getAttribute("data-state"), "preparing");
    assert.equal(one(preparing, "[data-module=\"quote-preparing\"]").getAttribute("data-state"), "preparing");
    assert.doesNotMatch(preparing.textContent, /\d/, "a request in preparation is never counted to the customer");

    const partialTable = coreTable();
    partialTable.fail["/core/api/tagged/document/list.json"] = 500;
    const partial = await widget(partialTable);
    assert.equal(partial.getAttribute("data-state"), "partial");
    assert.equal(all(partial, ".ov-lead").length, 0, "the home widget shows no counters");
    assert.equal(one(partial, "[data-module=\"quote-decision\"] .ov-waiting__label").textContent, "2 quotes waiting for your decision");
    assert.equal(one(partial, "[data-module=\"contracts-partial\"]").textContent, "Part of your contracts couldn’t be loaded. Contracts shows what did.");

    const brokenTable = coreTable();
    brokenTable.fail["/core/api/tagged/document/list.json"] = 500;
    brokenTable.fail["/core-bill/api/tagged/order/list.json"] = 500;
    const broken = await widget(brokenTable);
    assert.equal(broken.getAttribute("data-state"), "error");
    assert.equal(one(broken, "[data-module=\"contracts-error\"] .ov-empty__title").textContent, "Couldn’t load your contracts");
    assert.equal(one(broken, "[data-action=\"contracts.refresh\"]").textContent, "Try again ›");
    state.propertyId = "prop-core-958";
    assert.equal(all(PropertyDetail(), "[data-module=\"property-service\"]").length, 0, "a property whose contracts could not be read shows no invented service");

    const forbiddenTable = coreTable();
    forbiddenTable.fail["/core/api/tagged/document"] = 403;
    forbiddenTable.fail["/core-bill/api/tagged/order/list.json"] = 403;
    const forbidden = await widget(forbiddenTable);
    assert.equal(forbidden.getAttribute("data-state"), "unauthorized");
    assert.equal(all(forbidden, "[data-action]").length, 0, "an access refusal offers no retry");

    state.contractCommand = { phase: "readback-failed", kind: "approve" };
    assert.equal(one(Overview(), "[data-module=\"active-contracts\"]").getAttribute("data-state"), "error", "a lost readback never shows the stale package on the home");
    state.contractCommand = null;

    const closed = await widget(null, { portalEnabledModules: "overview,properties" });
    assert.equal(closed, null, "without the Contracts module the home shows no Contracts card");
  } finally {
    state.moduleData.properties = null;
    console.restore();
  }
}

const source = fs.readFileSync(path.resolve("app-templates/customer-portal/runtime/src/contract-commands.js"), "utf8")
  + fs.readFileSync(path.resolve("app-templates/customer-portal/runtime/src/components/proposals/AgreementParts.js"), "utf8")
  + fs.readFileSync(path.resolve("app-templates/customer-portal/runtime/src/components/proposals/QuoteOptionCard.js"), "utf8");
assert.doesNotMatch(source, /QUOTE_CHANGE_REQUEST|innerHTML|html:/, "no markup injection in the contracts presentation, and change requests use only the ORDER_LIFECYCLE event");

console.log("snow-contracts-live-check ok: the live Contracts module reads agreements, quotes and their lines from Core with each read's scope stated, renders partial, error, unauthorized, unavailable and loading states without fixture data on the Contracts page, the home widget and the property page alike, and sends one command at a time: a pre-read that refuses stale or foreign records, one generic workflow event, a readback that decides success, and distinct refused, failed, unconfirmed, readback-failed and signed-out outcomes, with view events sent in order and approving an option shown as declining its siblings only after Core did");

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
    replaceChildren(...nodes) {
      this.childNodes.forEach((node) => { node.parentNode = null; });
      this.childNodes = [];
      nodes.forEach((node) => this.appendChild(node));
    }
    addEventListener(type, listener) { (this.listeners[type] = this.listeners[type] || []).push(listener); }
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
