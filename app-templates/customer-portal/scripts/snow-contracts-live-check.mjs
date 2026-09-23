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
      coreAgreement(5601, "QUOTATION_SENT", [4101, 4102]),
      coreAgreement(5602, "SENT_TO_CLIENT", [4001], {
        LEGAL_NAME: { value: "Harbour View Strata" }, CLIENT_TYPE: { value: "ORGANIZATION" },
        EFFECTIVE_DATE: { value: "2026-10-01" }, TERM_START_DATE: { value: "2026-11-01" }, TERM_END_DATE: { value: "2027-03-31" },
        PROVIDER_LEGAL_NAME: { value: "Granite Ridge Snow Removal LLC" },
        CONTRACT_TERMS: { value: "# Scope\nSnow clearing and de-icing.\n\n1. Billing\n- Seasonal options are invoiced once." },
      }),
    ],
    orders: [
      coreOrder(4001, "CLIENT_APPROVED", 958, "SEASONAL", 26751.6),
      coreOrder(4101, "QUOTE_SENT", 959, "SEASONAL", 26751.6),
      coreOrder(4102, "QUOTE_VIEWED", 959, "PER_SERVICE", 2444.72),
      coreOrder(4103, "INITIAL", 959, "MONTHLY", 6687.9),
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
    if (route === "/core/api/document-type/list.json") return json({ resultSize: 1, result: [{ id: 17, code: "SERVICE_AGREEMENT" }] });
    if (route === "/core/api/document/list.json") {
      const rows = table.agreements.filter((row) => String(row.attributes[17].CLIENT.value) === filter("attributes.17.CLIENT.value").value);
      return json({ resultSize: rows.length, result: rows, sequence: 1 });
    }
    if (route === "/core-bill/api/order/list.json") return json({ resultSize: table.orders.length, result: table.orders, sequence: 1 });
    if (route === "/core-bill/api/order-item/list.json") return json({ resultSize: 1, result: table.orderItems.filter((row) => ids("order.id").includes(row.order.id)) });
    if (route === "/core-pim/api/product-price/list.json") return json({ resultSize: 1, result: table.productPrices.filter((row) => ids("id").includes(row.id)) });
    if (route === "/core-pim/api/product/list.json") return json({ resultSize: 1, result: table.products.filter((row) => ids("id").includes(row.id)) });
    if (route === "/core-bill/api/order/get.json") {
      const row = table.orders.find((candidate) => candidate.id === Number(target.searchParams.get("id")));
      return row ? json(row) : { ok: false, status: 404, async json() { throw new Error("empty"); } };
    }
    if (route === "/core/api/document/get.json") {
      const row = table.agreements.find((candidate) => candidate.id === Number(target.searchParams.get("id")));
      return row ? json(row) : { ok: false, status: 404, async json() { throw new Error("empty"); } };
    }
    const event = /^\/(core-bill|core)\/api\/(order|document)\/(\d+)\/send-event\.json$/.exec(route);
    if (event) {
      table.events.push({ entity: event[2], id: Number(event[3]), code: target.searchParams.get("event") });
      if (table.eventStatus) return { ok: false, status: table.eventStatus, async json() { return {}; } };
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
  if (entity === "order" && next === "CLIENT_APPROVED") {
    const property = row.attributes[5].SERVICE_PROPERTY && row.attributes[5].SERVICE_PROPERTY.value;
    table.orders.forEach((other) => {
      const sameProperty = other.attributes[5].SERVICE_PROPERTY && other.attributes[5].SERVICE_PROPERTY.value === property;
      if (other.id !== id && sameProperty && ["QUOTE_SENT", "QUOTE_VIEWED"].includes(other.states[0].code)) other.states = [{ id: other.states[0].id + 1000, code: "DECLINED" }];
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
  assert.deepEqual(pkg.agreements.map((row) => [row.id, row.agreement.stage]), [["agreement-core-5602", "approval"], ["agreement-core-5601", "review"]]);
  assert.deepEqual(pkg.groups.map((group) => [group.id, group.title, group.orders.map((order) => order.backendId)]), [["quote-5601-959", "Property details unavailable", [4102, 4101]]], "a property the customer's properties list does not include is not named from another source");
  assert.equal(pkg.preparing, true, "the INITIAL Order is withheld and only says a request is being prepared");
  assert.deepEqual(findQuote(pkg, 4102).lines.map((line) => [line.product, line.unitPrice, line.total]), [["Snow Removal", "CA$1,528.48", "CA$1,528.48"], ["Rock Salt De-Icing", "CA$916.24", "CA$916.24"]]);
  assert.equal(findQuote(pkg, 4103), null, "the operator-side Order and its lines never reach a page");

  state.moduleData.properties = { state: "ready", accountId: ACCOUNT, scopeMode: "browser-filtered", truncated: false, items: [{ id: "prop-core-959", backendId: 959, name: "Harbour View Tower", address: "1177 West Hastings Street, Vancouver, BC, V6E 2K3", lat: null, lon: null }] };
  assert.equal(quotePackage().groups[0].title, "Harbour View Tower", "a live group is named from the customer's own property list");

  const list = ProposalsList();
  assert.equal(list.getAttribute("data-state"), "ready");
  assert.equal(one(list, "h1").textContent, "Your contracts");
  assert.deepEqual(all(list, "[data-module=\"agreement-row\"]").map((row) => one(row, "[data-module=\"status-badge\"]").textContent), ["Ready for your approval", "Awaiting your decisions"]);
  assert.equal(all(list, "[data-module=\"quote-property\"]").length, 1);
  assert.equal(one(list, "[data-module=\"quote-property\"] .proposal-card__meta").textContent, "1177 West Hastings Street, Vancouver, BC, V6E 2K3 · 2 quotes");
  assert.ok(!list.textContent.includes("Line note for the operator"), "operator notes on a line are never shown");

  state.currentSiteId = "quote-5601-959";
  state.quoteViews = { 4101: "pending" };
  const detail = ProposalDetail();
  assert.deepEqual(all(detail, "[data-module=\"quote-option\"]").map((card) => card.getAttribute("data-state")), ["viewed", "unseen"]);
  assert.deepEqual(all(detail, "[data-module=\"quote-option\"] .money-rows__row").map((row) => row.textContent).slice(0, 3), ["SubtotalCA$2,444.72", "TaxesCA$0.00", "TotalCA$2,444.72"], "Core's zero taxes are stated rather than left out");
  state.quoteViews = {};

  state.agreementId = "agreement-core-5602";
  const agreement = AgreementDetail();
  assert.equal(agreement.getAttribute("data-state"), "approval");
  assert.deepEqual(all(agreement, "[data-module=\"agreement-party\"] .agreement-facts__row").slice(0, 2).map((row) => row.textContent), ["Legal nameGranite Ridge Snow Removal LLC", "RepresentativeNot stated"]);
  assert.equal(all(agreement, "[data-module=\"agreement-property\"]").length, 1);
  assert.equal(one(agreement, "[data-module=\"agreement-property\"] .agreement-property__title").textContent, "Property details unavailable");
  assert.equal(all(agreement, "[data-action=\"agreement.approve\"]").length, 1);
  assert.equal(table.events.length, 0, "reading and rendering send no event");
}

{
  const console = quietConsole();
  try {
    const partial = coreTable();
    partial.fail["/core/api/document/list.json"] = 500;
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
    state.quoteViews = { 4101: "pending" };
    const detail = ProposalDetail();
    assert.deepEqual(all(detail, ".quote-line__title--unnamed").map((node) => node.textContent), ["Unnamed service", "Unnamed service", "Unnamed service", "Unnamed service"], "an unreadable product is unnamed, never guessed");
    assert.equal(all(detail, "[data-module=\"contracts-partial\"]").length, 1);
    state.quoteViews = {};

    const noLines = coreTable();
    noLines.fail["/core-bill/api/order-item/list.json"] = 500;
    await liveRuntime(noLines).loadAsync("proposals");
    state.currentSiteId = "quote-5601-959";
    state.quoteViews = { 4101: "pending" };
    assert.deepEqual(all(ProposalDetail(), "[data-module=\"quote-lines\"]").map((node) => node.textContent), ["The services on this quote couldn’t be loaded.", "The services on this quote couldn’t be loaded."]);
    state.quoteViews = {};

    const noOrders = coreTable();
    noOrders.fail["/core-bill/api/order/list.json"] = 500;
    await liveRuntime(noOrders).loadAsync("proposals");
    const agreementsOnly = ProposalsList();
    assert.equal(agreementsOnly.getAttribute("data-state"), "partial");
    assert.match(agreementsOnly.textContent, /Your quotes couldn’t be loaded, so only your service agreements are shown\./);
    assert.equal(all(agreementsOnly, "[data-module=\"quote-property\"]").length, 0);
    assert.equal(all(agreementsOnly, "[data-module=\"agreement-row\"]").length, 2);
    state.agreementId = "agreement-core-5602";
    assert.equal(all(AgreementDetail(), "[data-module=\"agreement-property\"]").length, 0, "an agreement whose Orders could not be read lists no invented service");

    const broken = coreTable();
    broken.fail["/core/api/document/list.json"] = 500;
    broken.fail["/core-bill/api/order/list.json"] = 500;
    await liveRuntime(broken).loadAsync("proposals").catch(() => null);
    assert.equal(state.moduleStatus.proposals, "error");
    const failed = ProposalsList();
    assert.equal(failed.getAttribute("data-state"), "error");
    assert.match(one(failed, "[data-module=\"error-state\"]").textContent, /Couldn’t load your contracts/);
    assert.equal(one(failed, "[data-module=\"error-state\"] [data-action]").getAttribute("data-action"), "ui.retry");

    const forbidden = coreTable();
    forbidden.fail["/core/api/document"] = 403;
    forbidden.fail["/core-bill/api/order/list.json"] = 403;
    await liveRuntime(forbidden).loadAsync("proposals").catch(() => null);
    const denied = ProposalsList();
    assert.equal(denied.getAttribute("data-state"), "unauthorized");
    assert.match(one(denied, "[data-module=\"unauthorized-state\"]").textContent, /doesn’t include access to your contracts/);
    state.agreementId = "agreement-core-5602";
    assert.equal(AgreementDetail().getAttribute("data-state"), "unauthorized");

    const expired = coreTable();
    expired.fail["/core-bill/api/order/list.json"] = 401;
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
  state.quoteViews = {};
}

{
  assert.deepEqual(plain(CONTRACT_EVENTS), {
    view: { entity: "order", source: "QUOTE_SENT", code: "QUOTE_SENT-QUOTE_VIEWED" },
    approve: { entity: "order", source: "QUOTE_VIEWED", code: "QUOTE_VIEWED-CLIENT_APPROVED" },
    decline: { entity: "order", source: "QUOTE_VIEWED", code: "QUOTE_VIEWED-DECLINED" },
    agreement: { entity: "document", source: "SENT_TO_CLIENT", code: "SENT_TO_CLIENT-CLIENT_APPROVED" },
  }, "the portal sends only the four generic workflow events; a change request is a future form, not an event here");

  const table = coreTable();
  table.orders.push(coreOrder(4104, "QUOTE_VIEWED", 959, "MONTHLY", 6687.9));
  table.agreements[0].attributes[17].ORDERS.value.push(4104);
  const harness = commandHarness(table);
  await ready(harness);
  const before = findQuote(quotePackage(), 4104);
  assert.equal(before.status, "viewed");
  state.contractConfirm = { kind: "approve", backendId: 4102 };
  const flight = harness.commands.decide("approve", 4102);
  assert.equal(state.contractCommand.phase, "pending", "the command is pending the moment it starts");
  assert.deepEqual(harness.busyAtRender, [true], "the pending page is drawn with the command already in flight, so every other decision renders disabled");
  assert.equal(await harness.commands.decide("decline", 4104), false, "a second command while one is in flight is refused");
  assert.equal(await harness.commands.approveAgreement(5602), false);
  assert.equal(findQuote(quotePackage(), 4104).status, "viewed", "while the approval is in flight the sibling is not predicted to be declined");
  assert.equal(await flight, true);
  assert.deepEqual(harness.busyAtRender, [true, false], "the readback is drawn once the command has left flight, with the decisions enabled again");
  assert.deepEqual(table.events, [{ entity: "order", id: 4102, code: "QUOTE_VIEWED-CLIENT_APPROVED" }], "exactly one event was sent");
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
  state.currentSiteId = "quote-5601-959";
  state.quoteViews = { 4101: "pending" };
  const cards = all(ProposalDetail(), "[data-module=\"quote-option\"]");
  assert.deepEqual(cards.filter((card) => all(card, "[data-module=\"command-conflict\"]").length > 0).map((card) => card.getAttribute("data-state")), ["declined"], "the conflict is explained on the quote that changed, shown as Core now has it");
  state.quoteViews = {};
}

{
  const table = coreTable();
  const harness = commandHarness(table);
  await ready(harness);
  assert.equal(await harness.commands.decide("approve", 4101), false, "an unseen quote cannot be approved");
  assert.equal(await harness.commands.decide("decline", 4001), false, "an approved quote cannot be declined");
  assert.equal(await harness.commands.decide("requestChanges", 4102), false, "no change request is sent from the portal");
  assert.equal(await harness.commands.approveAgreement(5601), false, "an agreement under quote review cannot be approved");
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
  assert.equal(findQuote(quotePackage(), 4102).status, "viewed", "a refused or failed command changes nothing on the page");
}

{
  const table = coreTable();
  const harness = commandHarness(table);
  await ready(harness);
  table.dropEvents = true;
  assert.equal(await harness.commands.decide("decline", 4102), false);
  assert.equal(table.events.length, 1);
  assert.equal(state.contractCommand.phase, "unconfirmed", "a 200 that Core did not apply is reported from the readback, not as success");
  assert.equal(findQuote(quotePackage(), 4102).status, "viewed");
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
  assert.equal(all(page, "[data-module=\"quote-property\"]").length, 0, "no stale quote is shown after the command");
}

{
  const table = coreTable();
  const harness = commandHarness(table);
  await ready(harness);
  table.fail["/core-bill/api/order/list.json"] = 500;
  assert.equal(await harness.commands.decide("approve", 4102), false);
  assert.equal(table.events.length, 1);
  assert.equal(state.contractCommand.phase, "readback-failed", "a readback whose Orders could not be read is not reported as a decision that did not register");

  const agreementTable = coreTable();
  const agreementHarness = commandHarness(agreementTable);
  await ready(agreementHarness);
  agreementTable.fail["/core/api/document/list.json"] = 500;
  assert.equal(await agreementHarness.commands.approveAgreement(5602), false);
  assert.equal(state.contractCommand.phase, "readback-failed", "the same holds for an agreement whose readback lost the agreements read");

  const viewTable = coreTable();
  const viewHarness = commandHarness(viewTable);
  await ready(viewHarness);
  viewTable.fail["/core-bill/api/order/list.json"] = 500;
  await viewHarness.commands.view([4101]);
  assert.equal(state.contractCommand.phase, "readback-failed");
  assert.deepEqual(plain(state.quoteViews), { 4101: "failed" });
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
  assert.equal(one(approved, "[data-module=\"agreement-notice\"]").textContent, "You approved this agreement.");
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
  table.orders.push(coreOrder(4105, "QUOTE_SENT", 959, "MONTHLY", 6687.9));
  table.agreements[0].attributes[17].ORDERS.value.push(4105);
  const harness = commandHarness(table);
  await ready(harness);
  const view = harness.commands.view([4101, 4105, 4102, 4101]);
  assert.deepEqual(plain(state.quoteViews), { 4101: "pending", 4105: "pending" }, "only unseen quotes are marked, each once");
  assert.equal(await view, true);
  assert.deepEqual(table.events.map((event) => [event.id, event.code]), [[4101, "QUOTE_SENT-QUOTE_VIEWED"], [4105, "QUOTE_SENT-QUOTE_VIEWED"]], "view events go out one at a time, in order");
  assert.equal(harness.reloads(), 1, "and are read back once");
  assert.deepEqual(plain(state.quoteViews), {});
  assert.equal(findQuote(quotePackage(), 4105).status, "viewed");
  assert.equal(state.contractCommand, null);

  const dropped = coreTable();
  const dropHarness = commandHarness(dropped);
  await ready(dropHarness);
  dropped.dropEvents = true;
  await dropHarness.commands.view([4101]);
  assert.deepEqual(plain(state.quoteViews), { 4101: "failed" }, "a view Core did not apply is failed, so the page offers a retry instead of decisions");
  assert.equal(await dropHarness.commands.view([4102]), false, "a viewed quote needs no view event");
}

{
  const state = { porders: [], pagreements: [], quoteViews: {} };
  const fixture = (await load("data/cases/granite-ridge-snow.js")).graniteRidgeSnowFixture;
  state.porders = structuredClone(fixture.proposals.orders);
  state.pagreements = structuredClone(fixture.proposals.agreements);
  const gateway = createFixtureContractsGateway(state);
  const latest = (rows, id) => rows.find((row) => row.id === id).states.at(-1).code;
  await assert.rejects(gateway.sendOrderEvent(8111, "QUOTE_VIEWED-CLIENT_APPROVED"), (error) => error.code === "command-refused", "the fixture refuses an event from the wrong state, as Core would");
  await gateway.sendOrderEvent(8111, "QUOTE_SENT-QUOTE_VIEWED");
  assert.equal(latest(state.porders, 8111), "QUOTE_VIEWED");
  await gateway.sendOrderEvent(8111, "QUOTE_VIEWED-CLIENT_APPROVED");
  assert.deepEqual([8110, 8111, 8112].map((id) => latest(state.porders, id)), ["DECLINED", "CLIENT_APPROVED", "DECLINED"], "approving an option declines its open siblings in the same package");
  assert.equal(latest(state.pagreements, 9101), "QUOTATION_SENT", "a package with a property still under revision is not evaluated as decided");
  for (const id of [8104, 8105, 8106]) state.porders.find((row) => row.id === id).states.push({ code: "QUOTE_VIEWED" });
  await gateway.sendOrderEvent(8104, "QUOTE_VIEWED-DECLINED");
  await gateway.sendOrderEvent(8105, "QUOTE_VIEWED-DECLINED");
  await gateway.sendOrderEvent(8106, "QUOTE_VIEWED-CLIENT_APPROVED");
  assert.equal(latest(state.pagreements, 9101), "AWAITING_CLIENT_DETAILS", "once every property is decided the package asks for contract details");
  await gateway.sendAgreementEvent(9102, "SENT_TO_CLIENT-CLIENT_APPROVED");
  assert.equal(latest(state.pagreements, 9102), "CLIENT_APPROVED");
  await assert.rejects(gateway.readOrder(1), (error) => error.code === "not-found");

  const raw = fixtureAdapter.load("proposals", { config: { caseId: "granite-ridge-snow" }, state: { theme: "Snow Removal", psites: [], porders: state.porders, pagreements: state.pagreements } });
  const normalized = normalizeProposals(raw);
  assert.equal(normalized.quotes.scopeMode, null, "a fixture envelope was scoped by no server and says so");
  const pkg = contractsPackage(normalizeContracts(raw), fixture.overview.properties);
  assert.equal(pkg.agreements.find((row) => row.id === "agreement-core-9101").agreement.label, "Contract details needed");
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
    assert.equal(one(ready, ".ov-lead").textContent, "2service agreements");
    const rows = all(ready, "[data-module=\"contract-row\"]");
    assert.deepEqual(rows.map((row) => row.getAttribute("data-state")), ["approval", "review"], "an agreement waiting for the customer comes first, as on the Contracts page");
    assert.deepEqual(rows.map((row) => one(row, ".ov-row__title").textContent), ["Juniper Terrace", "Aspen Commons"]);
    assert.deepEqual(rows.map((row) => one(row, ".status-badge").textContent), ["Ready for your approval", "Awaiting your decisions"]);
    assert.deepEqual(rows.map((row) => [one(row, ".ov-chev").getAttribute("data-action"), one(row, ".ov-chev").getAttribute("data-id")]), [["agreement.open", "agreement-core-5602"], ["agreement.open", "agreement-core-5601"]]);
    assert.deepEqual(rows.map((row) => (one(row, ".ov-row__meta") || { textContent: "" }).textContent), ["Nov 1, 2026 – Mar 31, 2027", "2 quotes for 1 property"]);
    assert.equal(one(ready, ".ov-more").getAttribute("data-action"), "overview.openContracts");
    assert.doesNotMatch(ready.textContent, /aren’t in the portal yet|No active contracts/);

    state.propertyId = "prop-core-958";
    const approval = one(PropertyDetail(), "[data-fact=\"contract\"]");
    assert.equal(one(approval, ".prop-fact__label").textContent, "Service agreement");
    assert.equal(one(approval, ".prop-fact__value").textContent, "Ready for your approval ›");
    assert.equal(one(approval, ".prop-fact__value").getAttribute("data-action"), "agreement.open");
    assert.equal(one(approval, ".prop-fact__value").getAttribute("data-id"), "agreement-core-5602");
    state.propertyId = "prop-core-959";
    assert.equal(one(one(PropertyDetail(), "[data-fact=\"contract\"]"), ".prop-fact__value").textContent, "Awaiting your decisions ›", "a property follows the agreement that lists it");

    const emptyTable = coreTable();
    emptyTable.agreements = [];
    emptyTable.orders = [];
    const empty = await widget(emptyTable);
    assert.equal(empty.getAttribute("data-state"), "empty");
    assert.equal(one(empty, ".ov-empty").textContent, "No contracts yetWhen we send you a quote or a service agreement, it appears here.");
    state.propertyId = "prop-core-958";
    assert.equal(one(one(PropertyDetail(), "[data-fact=\"contract\"]"), ".prop-fact__value").textContent, "None yet", "a read that found no agreement says so only once the read is in");

    const preparingTable = coreTable();
    preparingTable.agreements = [];
    preparingTable.orders = [coreOrder(4103, "INITIAL", 959, "MONTHLY", 6687.9)];
    const preparing = await widget(preparingTable);
    assert.equal(preparing.getAttribute("data-state"), "preparing");
    assert.equal(one(preparing, "[data-module=\"quote-preparing\"]").getAttribute("data-state"), "preparing");
    assert.doesNotMatch(preparing.textContent, /\d/, "a request in preparation is never counted to the customer");

    const partialTable = coreTable();
    partialTable.fail["/core/api/document/list.json"] = 500;
    const partial = await widget(partialTable);
    assert.equal(partial.getAttribute("data-state"), "partial");
    assert.equal(one(partial, ".ov-lead").textContent, "3quotes1 of 2 properties decided");
    assert.equal(one(partial, "[data-module=\"quote-decision\"] .ov-row__title").textContent, "Quotes awaiting your decision");
    assert.equal(one(partial, "[data-module=\"contracts-partial\"]").textContent, "Part of your contracts couldn’t be loaded. Contracts shows what did.");

    const brokenTable = coreTable();
    brokenTable.fail["/core/api/document/list.json"] = 500;
    brokenTable.fail["/core-bill/api/order/list.json"] = 500;
    const broken = await widget(brokenTable);
    assert.equal(broken.getAttribute("data-state"), "error");
    assert.equal(one(broken, "[data-module=\"contracts-error\"] .ov-empty__title").textContent, "Couldn’t load your contracts");
    assert.equal(one(broken, "[data-action=\"contracts.refresh\"]").textContent, "Try again ›");
    state.propertyId = "prop-core-958";
    const unreadable = one(PropertyDetail(), "[data-fact=\"contract\"]");
    assert.equal(unreadable.getAttribute("data-state"), "unavailable");
    assert.equal(one(unreadable, ".prop-fact__note").textContent, "Your contracts couldn’t be loaded.");

    const forbiddenTable = coreTable();
    forbiddenTable.fail["/core/api/document"] = 403;
    forbiddenTable.fail["/core-bill/api/order/list.json"] = 403;
    const forbidden = await widget(forbiddenTable);
    assert.equal(forbidden.getAttribute("data-state"), "unauthorized");
    assert.equal(all(forbidden, "[data-action]").length, 0, "an access refusal offers no retry");

    state.contractCommand = { phase: "readback-failed", kind: "approve" };
    assert.equal(one(Overview(), "[data-module=\"active-contracts\"]").getAttribute("data-state"), "error", "a lost readback never shows the stale package on the home");
    state.contractCommand = null;

    const closed = await widget(null, { portalEnabledModules: "overview,properties" });
    assert.equal(closed.getAttribute("data-state"), "unavailable", "without the Contracts module the home says Contracts are not in the portal");
    assert.equal(one(closed, "[data-module=\"section-unavailable\"]").textContent, "Not available yetContracts aren’t in the portal yet.");
  } finally {
    state.moduleData.properties = null;
    console.restore();
  }
}

const source = fs.readFileSync(path.resolve("app-templates/customer-portal/runtime/src/contract-commands.js"), "utf8")
  + fs.readFileSync(path.resolve("app-templates/customer-portal/runtime/src/components/proposals/AgreementParts.js"), "utf8")
  + fs.readFileSync(path.resolve("app-templates/customer-portal/runtime/src/components/proposals/QuoteOptionCard.js"), "utf8");
assert.doesNotMatch(source, /CUSTOMER_CHANGES_REQUESTED|QUOTE_CHANGE_REQUEST|innerHTML|html:/, "no change-request control and no markup injection in the contracts presentation");

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
