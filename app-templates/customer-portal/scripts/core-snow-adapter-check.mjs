import assert from "node:assert/strict";
import {
  coreSnowContract,
  createCoreSnowPropertiesAdapter,
  createCoreSnowQuotesAdapter,
} from "../runtime/src/adapters/core-snow-adapter.js";

const origin = "https://dev-1.servicewand.com";
const context = {
  config: { origin, organization: "SNOWLIMITLESS", billApiBase: "/core-bill", coreApiBase: "/core", resourceApiBase: "/core-rm" },
  state: { session: { accessToken: "test-token", tokenType: "Bearer" }, customerAccount: { id: 62 } },
};

const propertyType = { id: 154, code: "SNOW_REMOVAL_PROPERTY", nls: { en: { NAME: "Snow Removal Property" } } };

function property(id, accountId, addressId, name, stateCode) {
  const row = {
    id,
    code: "RES-" + id,
    nls: { en: { NAME: name } },
    type: propertyType,
    states: [{ id: 1, code: stateCode || "ACTIVE" }],
    attributes: { 153: { PROPERTY_CATEGORY: { value: "COMMERCIAL" } } },
  };
  if (accountId != null) row.attributes[153].ACCOUNT = { value: accountId };
  if (addressId != null) row.attributes[153].ADDRESS = { value: addressId };
  return row;
}

function address(id, line, city, postal) {
  return { id, address1: line, city, postalCode: postal, state: { id: 2, code: "BC" }, country: { id: "CA" } };
}

function coreFetch(table, calls) {
  return async (url, options) => {
    const body = JSON.parse(options.body);
    if (calls) calls.push({ url, body, headers: options.headers });
    if (url.includes("/address/list.json")) {
      const wanted = Number(body.filters[0].value);
      const row = (table.addresses || []).find((candidate) => candidate.id === wanted);
      return json({ resultSize: row ? 1 : 0, result: row ? [row] : [] });
    }
    if (url.includes("/resource/list.json")) {
      const byId = (body.filters || []).find((filter) => filter.property === "id");
      if (byId) {
        const row = (table.properties || []).find((candidate) => candidate.id === Number(byId.value));
        return json({ resultSize: row ? 1 : 0, result: row ? [row] : [] });
      }
      const page = (table.properties || []).slice(body.offset, body.offset + body.pageSize);
      return json({ resultSize: (table.properties || []).length, result: page });
    }
    throw new Error("unexpected request " + url);
  };
}

{
  const calls = [];
  const table = {
    properties: [
      property(278, 62, 610, "123 Main Street"),
      property(279, 63, 611, "Someone else's yard"),
      property(280, 62, null, "A property with no address"),
    ],
    addresses: [address(610, "#1001 - 7445 132nd Street", "Surrey", "V3W 1J8")],
  };
  const adapter = createCoreSnowPropertiesAdapter({ origin, fetch: coreFetch(table, calls) });
  const result = await adapter.load("properties", context);

  assert.equal(result.state, "ready");
  assert.equal(result.accountId, 62);
  assert.equal(result.scopeMode, "browser-filtered", "properties carry no server-side account filter and must say so");
  assert.equal(result.truncated, false);
  assert.equal(result.items.length, 2, "only the resolved account's properties survive");
  assert.deepEqual(result.items.map((item) => item.backendId), [278, 280]);

  const listCall = calls.find((call) => call.url.includes("/resource/list.json"));
  assert.deepEqual(listCall.body.filters, [{ type: "STRING", operator: "=", property: "type.code", value: "SNOW_REMOVAL_PROPERTY" }]);
  assert.equal(listCall.headers["X-Organization-Code"], "SNOWLIMITLESS");

  const first = result.items[0];
  assert.equal(first.id, "prop-core-278");
  assert.equal(first.name, "123 Main Street");
  assert.equal(first.address, "#1001 - 7445 132nd Street, Surrey, BC, V3W 1J8");
  assert.equal(first.region, "BC");
  assert.equal(first.country, "CA");
  assert.equal(first.category, "COMMERCIAL");
  assert.equal(first.stateCode, "ACTIVE");
  for (const absent of ["zone", "contract", "quoteSiteId", "appointment", "ticket", "lastService"]) {
    assert.equal(first[absent], null, absent + " has no Core source and must stay absent rather than become a default");
  }
  assert.equal(first.lat, null, "a property without COORD_LAT has no latitude, never 0");
  assert.equal(first.lon, null, "a property without COORD_LNG has no longitude, never 0");

  const withoutAddress = result.items[1];
  assert.equal(withoutAddress.address, "", "a missing ADDRESS must not resolve to address id 0");
  assert.equal(calls.filter((call) => call.url.includes("/address/list.json")).length, 1);
}

{
  const table = {
    properties: [property(278, 62, 610, "Numeric account"), property(430, "62", "49", "String account")],
    addresses: [address(610, "#1001 - 7445 132nd Street", "Surrey", "V3W 1J8"), address(49, "460 Nanaimo St", "Vancouver", "V5L 4W3")],
  };
  const adapter = createCoreSnowPropertiesAdapter({ origin, fetch: coreFetch(table) });
  const result = await adapter.load("properties", context);
  assert.deepEqual(result.items.map((item) => item.backendId), [278, 430], "Core stores the same attribute as a number on one row and a string on the next");
  assert.equal(result.items[1].address, "460 Nanaimo St, Vancouver, BC, V5L 4W3");
}

{
  const located = (id, lat, lng) => {
    const row = property(id, 62, null, "Located " + id);
    if (lat !== undefined) row.attributes[153].COORD_LAT = { value: lat };
    if (lng !== undefined) row.attributes[153].COORD_LNG = { value: lng };
    return row;
  };
  const inChildBucket = property(307, 62, null, "Child bucket");
  inChildBucket.attributes[154] = { COORD_LAT: { value: 49.2827 }, COORD_LNG: { value: -123.1207 } };
  const table = {
    properties: [
      located(301, 49.19, -122.85),
      located(302, "49.26", "-123.09"),
      located(303, null, null),
      located(304, "", " "),
      located(305, 49.19),
      located(306, 91, 200),
      inChildBucket,
      located(308, true, [5]),
    ],
  };
  const result = await createCoreSnowPropertiesAdapter({ origin, fetch: coreFetch(table) }).load("properties", context);
  const coordinates = Object.fromEntries(result.items.map((item) => [item.backendId, [item.lat, item.lon]]));
  assert.deepEqual(coordinates[301], [49.19, -122.85], "COORD_LAT and COORD_LNG are read from the inherited PROPERTY bucket");
  assert.deepEqual(coordinates[302], [49.26, -123.09], "a Float that arrives as a string is still a coordinate");
  assert.deepEqual(coordinates[303], [null, null], "a null Float is missing, never 0");
  assert.deepEqual(coordinates[304], [null, null], "an empty value is missing, never 0");
  assert.deepEqual(coordinates[305], [49.19, null], "each attribute stands alone; a half coordinate is left for the placement rule to refuse");
  assert.deepEqual(coordinates[306], [null, null], "a coordinate outside the globe is refused");
  assert.deepEqual(coordinates[307], [49.2827, -123.1207], "the attribute-bucket scan finds the coordinate in whichever type bucket carries it");
  assert.deepEqual(coordinates[308], [null, null], "a boolean or an array is not a coordinate, even though Number() would coerce it");
}

{
  const total = coreSnowContract.propertyPageSize * coreSnowContract.propertyPageLimit + 100;
  const table = { properties: Array.from({ length: total }, (_, index) => property(1000 + index, 62, null, "Bulk " + index)) };
  const adapter = createCoreSnowPropertiesAdapter({ origin, fetch: coreFetch(table) });
  const result = await adapter.load("properties", context);
  assert.equal(result.items.length, coreSnowContract.propertyPageSize * coreSnowContract.propertyPageLimit);
  assert.equal(result.truncated, true, "a book larger than the walk limit must report truncation rather than claim completeness");
}

{
  const table = { properties: Array.from({ length: coreSnowContract.propertyPageSize }, (_, index) => property(2000 + index, 62, null, "Exact " + index)) };
  const adapter = createCoreSnowPropertiesAdapter({ origin, fetch: coreFetch(table) });
  const result = await adapter.load("properties", context);
  assert.equal(result.items.length, coreSnowContract.propertyPageSize);
  assert.equal(result.truncated, false, "a book that ends exactly on a page boundary is complete once the next page comes back empty");
}

const winterOrderType = { id: 6, code: "WINTER_SERVICES_ORDER", nls: { en: { NAME: "Winter services order" } } };

function quote(id, stateCode, propertyId, extra = {}) {
  return Object.assign({
    id,
    account: { id: 62 },
    type: winterOrderType,
    currency: { id: 21, code: "CAD" },
    totalCharges: 2444.72,
    totalTaxes: 0,
    grandTotal: 2444.72,
    states: [{ id: 200 + id, code: stateCode }],
    attributes: { 5: Object.assign({ CLIENT: { value: 62 }, PRICING_MODEL: { value: "SEASONAL" } }, propertyId ? { SERVICE_PROPERTY: { value: propertyId } } : {}) },
    items: [{ id: id * 10 + 1 }, { id: id * 10 + 2 }],
  }, extra);
}

function line(orderId, position, priceId, amount) {
  return { id: orderId * 10 + position, order: { id: orderId }, itemPrice: { id: priceId }, amount, itemCount: 1, sortOrder: position - 1, grandTotal: amount, totalTaxes: 0 };
}

function agreement(id, stateCode, orderIds, client = 62) {
  return {
    id,
    type: { id: 17, code: "SERVICE_AGREEMENT" },
    organization: { id: 43, code: "GRANITE_RIDGE_SNOW", nls: { en: { NAME: "Granite Ridge Snow Removal" } } },
    states: [{ id: 300 + id, code: stateCode }],
    attributes: { 17: { CLIENT: { value: client }, ORDERS: { value: orderIds } } },
  };
}

function quoteTable(overrides = {}) {
  return Object.assign({
    agreements: [agreement(136, "QUOTATION_SENT", [41, 42]), agreement(133, "CLIENT_APPROVED", [38])],
    orders: [quote(38, "CLIENT_APPROVED", 959), quote(41, "QUOTE_SENT", 959), quote(42, "QUOTE_VIEWED", 958), quote(43, "INITIAL", 958)],
    orderItems: [line(38, 1, 227, 4891.92), line(38, 2, 233, 21859.68), line(41, 1, 227, 4891.92), line(41, 2, 233, 21859.68), line(42, 1, 28, 1528.48), line(42, 2, 36, 916.24), line(43, 1, 53, 1222.98)],
    productPrices: [{ id: 227, product: { id: 25 } }, { id: 233, product: { id: 28 } }, { id: 28, product: { id: 25 } }, { id: 36, product: { id: 28 } }, { id: 53, product: { id: 25 } }],
    products: [{ id: 25, code: "PARKING_LOT_SNOW_REMOVAL", nls: { en: { NAME: "Snow Removal" } } }, { id: 28, code: "ROCK_SALT_DE_ICING", nls: { en: { NAME: "Rock Salt De-Icing" } } }],
    fail: {},
    serverFiltersClient: true,
  }, overrides);
}

function quoteFetch(table, calls = []) {
  return async (url, options) => {
    const target = new URL(url);
    const route = target.pathname;
    const body = options.body ? JSON.parse(options.body) : null;
    calls.push({ url, route, body, headers: options.headers, method: options.method });
    const failure = Object.keys(table.fail).find((fragment) => url.includes(fragment));
    if (failure) return { ok: false, status: table.fail[failure], async json() { return {}; } };
    const filterValue = (property) => ((body && body.filters) || []).find((filter) => filter.property === property);
    const inIds = (property) => String(filterValue(property).value).split(",").map(Number);
    if (route === "/core/api/document-type/list.json") return json({ resultSize: 1, result: [{ id: 17, code: "SERVICE_AGREEMENT" }] });
    if (route === "/core/api/document/list.json") {
      const client = filterValue("attributes.17.CLIENT.value");
      const rows = table.serverFiltersClient ? table.agreements.filter((row) => String(row.attributes[17].CLIENT.value) === client.value) : table.agreements;
      return json({ resultSize: rows.length, result: rows });
    }
    if (route === "/core-bill/api/order/list.json") return json({ resultSize: table.orders.length, result: table.orders });
    if (route === "/core-bill/api/order-item/list.json") {
      const wanted = inIds("order.id");
      const rows = table.orderItems.filter((row) => wanted.includes(row.order.id));
      return json({ resultSize: rows.length, result: rows });
    }
    if (route === "/core-pim/api/product-price/list.json") return json({ resultSize: 1, result: table.productPrices.filter((row) => inIds("id").includes(row.id)) });
    if (route === "/core-pim/api/product/list.json") return json({ resultSize: 1, result: table.products.filter((row) => inIds("id").includes(row.id)) });
    if (route === "/core-bill/api/order/get.json") {
      const row = table.orders.find((candidate) => candidate.id === Number(target.searchParams.get("id")));
      return row ? json(row) : { ok: false, status: 404, async json() { throw new Error("empty"); } };
    }
    if (route === "/core/api/document/get.json") {
      const row = table.agreements.find((candidate) => candidate.id === Number(target.searchParams.get("id")));
      return row ? json(row) : { ok: false, status: 404, async json() { throw new Error("empty"); } };
    }
    if (route.endsWith("/send-event.json")) return { ok: true, status: 200, async json() { throw new Error("empty body"); } };
    throw new Error("unexpected request " + url);
  };
}

{
  const calls = [];
  const adapter = createCoreSnowQuotesAdapter({ origin, fetch: quoteFetch(quoteTable(), calls) });
  const result = await adapter.load("proposals", Object.assign({}, context, { state: Object.assign({}, context.state, { customerAccount: { id: 62, displayName: "Harbour View Strata" } }) }));

  assert.equal(result.state, "ready");
  assert.equal(result.accountId, 62);
  assert.equal(result.scopeMode, "server-scoped", "every customer record was narrowed to the Account in the request");
  assert.deepEqual(plain(result.reads), {
    agreements: { state: "ready", scopeMode: "server-scoped", truncated: false },
    orders: { state: "ready", scopeMode: "server-scoped", truncated: false },
    orderItems: { state: "ready", scopeMode: "server-scoped", truncated: false },
    productPrices: { state: "ready", scopeMode: "unscoped", truncated: false },
    products: { state: "ready", scopeMode: "unscoped", truncated: false },
  }, "each read states how it was narrowed; catalog rows are tenant records nothing filters to the customer");
  assert.deepEqual(plain(result.client), { displayName: "Harbour View Strata" });
  assert.deepEqual(result.agreements.map((row) => row.id), [136, 133]);
  assert.deepEqual(result.quoteOrders.map((row) => row.id), [38, 41, 42, 43], "the adapter passes rows through; the normalizer withholds operator-side Orders");
  assert.deepEqual(result.orderItems.map((row) => row.id), [381, 382, 411, 412, 421, 422], "lines are read only for Orders the customer can see");
  assert.deepEqual(result.productPrices.map((row) => row.id).sort((a, b) => a - b), [28, 36, 227, 233]);
  assert.deepEqual(result.products.map((row) => row.id), [25, 28]);

  const byRoute = (route) => calls.filter((call) => call.route === route);
  assert.deepEqual(byRoute("/core/api/document-type/list.json")[0].body.filters, [{ type: "STRING", operator: "=", property: "code", value: "SERVICE_AGREEMENT" }]);
  assert.deepEqual(byRoute("/core/api/document/list.json")[0].body.filters, [
    { type: "STRING", operator: "=", property: "type.code", value: "SERVICE_AGREEMENT" },
    { type: "INTEGER", operator: "=", property: "attributes.17.CLIENT.value", value: "62" },
  ], "agreements are filtered to the customer's Account in the request, through the type id Core returned");
  assert.deepEqual(byRoute("/core-bill/api/order/list.json")[0].body.filters, [{ type: "INTEGER", operator: "=", property: "account.id", value: "62" }]);
  assert.deepEqual(byRoute("/core-bill/api/order-item/list.json")[0].body.filters, [
    { type: "INTEGER", operator: "=", property: "order.account.id", value: "62" },
    { type: "INTEGER", operator: "IN", property: "order.id", value: "38,41,42" },
  ]);
  assert.deepEqual(byRoute("/core-pim/api/product-price/list.json")[0].body.filters, [{ type: "INTEGER", operator: "IN", property: "id", value: "227,233,28,36" }]);
  assert.deepEqual(byRoute("/core-pim/api/product/list.json")[0].body.filters, [{ type: "INTEGER", operator: "IN", property: "id", value: "25,28" }]);
  assert.ok(calls.every((call) => call.method === "POST" && call.headers["X-Organization-Code"] === "SNOWLIMITLESS" && call.headers.Authorization === "Bearer test-token"));
  assert.ok(calls.every((call) => call.url.startsWith(origin + "/")), "every service is reached same-origin");
  assert.equal(calls.filter((call) => call.route.endsWith("/send-event.json")).length, 0, "a read sends no event");
}

{
  const table = quoteTable({
    serverFiltersClient: false,
    agreements: [agreement(136, "QUOTATION_SENT", [41, 42]), agreement(137, "QUOTATION_SEND_FAILED", [50], 712)],
    orders: [quote(41, "QUOTE_SENT", 959), Object.assign(quote(50, "QUOTE_SENT", 960), { account: { id: 712 } })],
  });
  const result = await createCoreSnowQuotesAdapter({ origin, fetch: quoteFetch(table) }).load("proposals", context);
  assert.deepEqual(result.agreements.map((row) => row.id), [136], "a row the server should have filtered out is dropped in the browser");
  assert.equal(result.reads.agreements.scopeMode, "browser-filtered", "and the read then says it was browser-filtered");
  assert.deepEqual(result.quoteOrders.map((row) => row.id), [41]);
  assert.equal(result.reads.orders.scopeMode, "browser-filtered");
  assert.equal(result.scopeMode, "browser-filtered", "the envelope never claims more isolation than its weakest customer read");
}

{
  const empty = await createCoreSnowQuotesAdapter({ origin, fetch: quoteFetch(quoteTable({ agreements: [], orders: [quote(43, "INITIAL", 958)] })) }).load("proposals", context);
  assert.deepEqual(empty.orderItems, [], "without a visible Order no line is read");
  assert.equal(empty.reads.orderItems.state, "ready");
  assert.deepEqual(empty.products, []);
}

{
  const adapter = createCoreSnowPropertiesAdapter({ origin, fetch: coreFetch({}) });
  await rejectsWith("session-required", () => adapter.load("properties", { config: context.config, state: { session: {} } }));
  await rejectsWith("customer-unresolved", () => adapter.load("properties", { config: context.config, state: { session: context.state.session } }));
  await rejectsWith("organization-required", () => adapter.load("properties", {
    config: { origin, coreApiBase: "/core" },
    state: context.state,
  }));
  await rejectsWith("unsupported-module", () => adapter.load("orders", context));
  await rejectsWith("cross-origin-service", () => adapter.load("properties", {
    config: Object.assign({}, context.config, { resourceApiBase: "https://elsewhere.example.com/core-rm" }),
    state: context.state,
  }));
}

{
  const partialAgreements = await createCoreSnowQuotesAdapter({ origin, fetch: quoteFetch(quoteTable({ fail: { "/core/api/document/list.json": 500 } })) }).load("proposals", context);
  assert.equal(partialAgreements.agreements, null, "a failed read is absent, never an empty list");
  assert.deepEqual(plain(partialAgreements.reads.agreements), { state: "error", scopeMode: null, truncated: false, reasonCode: "core-request-failed" });
  assert.deepEqual(partialAgreements.quoteOrders.map((row) => row.id), [38, 41, 42, 43], "the quotes still load when the agreements do not");

  const forbiddenAgreements = await createCoreSnowQuotesAdapter({ origin, fetch: quoteFetch(quoteTable({ fail: { "/core/api/document-type/list.json": 403 } })) }).load("proposals", context);
  assert.equal(forbiddenAgreements.reads.agreements.state, "unauthorized", "a role without document permissions reads as unauthorized for agreements only");

  const partialOrders = await createCoreSnowQuotesAdapter({ origin, fetch: quoteFetch(quoteTable({ fail: { "/core-bill/api/order/list.json": 500 } })) }).load("proposals", context);
  assert.equal(partialOrders.quoteOrders, null);
  assert.equal(partialOrders.reads.orderItems.state, "error", "lines are unknown when their Orders are");
  assert.deepEqual(partialOrders.agreements.map((row) => row.id), [136, 133]);

  const partialLines = await createCoreSnowQuotesAdapter({ origin, fetch: quoteFetch(quoteTable({ fail: { "/core-bill/api/order-item/list.json": 500 } })) }).load("proposals", context);
  assert.equal(partialLines.orderItems, null);
  assert.equal(partialLines.reads.productPrices.state, "error");
  assert.equal(partialLines.reads.products.state, "error");

  const catalogSession = await createCoreSnowQuotesAdapter({ origin, fetch: quoteFetch(quoteTable({ fail: { "/core-pim/api/product/list.json": 401 } })) }).load("proposals", context);
  assert.equal(catalogSession.reads.products.state, "error", "a catalog 401 is a partial read, never a sign-out");
  assert.equal(catalogSession.products, null);

  await rejectsWith("core-request-failed", () => createCoreSnowQuotesAdapter({ origin, fetch: quoteFetch(quoteTable({ fail: { "/core/api/document/list.json": 500, "/core-bill/api/order/list.json": 500 } })) }).load("proposals", context));
  await rejectsWith("customer-forbidden", () => createCoreSnowQuotesAdapter({ origin, fetch: quoteFetch(quoteTable({ fail: { "/core/api/document": 403, "/core-bill/api/order/list.json": 403 } })) }).load("proposals", context));
  await rejectsWith("session-expired", () => createCoreSnowQuotesAdapter({ origin, fetch: quoteFetch(quoteTable({ fail: { "/core-bill/api/order/list.json": 401 } })) }).load("proposals", context));
  await rejectsWith("session-expired", () => createCoreSnowQuotesAdapter({ origin, fetch: quoteFetch(quoteTable({ fail: { "/core-bill/api/order-item/list.json": 401 } })) }).load("proposals", context));
  await rejectsWith("unprojectable-response", () => createCoreSnowQuotesAdapter({
    origin,
    fetch: async () => ({ ok: true, status: 200, async json() { return "<!doctype html>"; } }),
  }).load("proposals", context));
  await rejectsWith("customer-unresolved", () => createCoreSnowQuotesAdapter({ origin, fetch: quoteFetch(quoteTable()) }).load("proposals", { config: context.config, state: { session: context.state.session } }));
}

{
  const calls = [];
  const table = quoteTable();
  const adapter = createCoreSnowQuotesAdapter({ origin, fetch: quoteFetch(table, calls) });
  const row = await adapter.readOrder(42, context);
  assert.equal(row.id, 42);
  assert.equal(calls[0].route, "/core-bill/api/order/get.json");
  assert.equal(new URL(calls[0].url).searchParams.get("id"), "42");
  assert.ok(Array.isArray(calls[0].body), "a get sends its mappings as the body");
  assert.ok(calls[0].body.some((mapping) => mapping.name === "account"), "the pre-read asks for the Order's Account so ownership can be checked");

  table.orders.push(Object.assign(quote(77, "QUOTE_VIEWED", 958), { account: { id: 701 } }));
  await rejectsWith("customer-forbidden", () => adapter.readOrder(77, context));
  await rejectsWith("not-found", () => adapter.readOrder(999, context));
  await rejectsWith("invalid-target", () => adapter.readOrder("x", context));

  const document = await adapter.readAgreement(136, context);
  assert.equal(document.id, 136);
  table.agreements.push(agreement(140, "SENT_TO_CLIENT", [], 701));
  await rejectsWith("customer-forbidden", () => adapter.readAgreement(140, context));
  await rejectsWith("not-found", () => adapter.readAgreement(1, context));

  calls.length = 0;
  assert.equal(await adapter.sendOrderEvent(42, "QUOTE_VIEWED-CLIENT_APPROVED", context), true);
  assert.equal(calls[0].url, origin + "/core-bill/api/order/42/send-event.json?event=QUOTE_VIEWED-CLIENT_APPROVED");
  assert.equal(calls[0].method, "POST");
  assert.deepEqual(calls[0].body, {}, "the generic event carries no attributes");
  assert.equal(await adapter.sendAgreementEvent(136, "SENT_TO_CLIENT-CLIENT_APPROVED", context), true);
  assert.equal(calls[1].url, origin + "/core/api/document/136/send-event.json?event=SENT_TO_CLIENT-CLIENT_APPROVED");
  await rejectsWith("invalid-event", () => adapter.sendOrderEvent(42, "approve&admin=1", context));

  const answering = (status) => createCoreSnowQuotesAdapter({ origin, fetch: async () => ({ ok: status < 300, status, async json() { return {}; } }) });
  await rejectsWith("session-expired", () => answering(401).sendOrderEvent(42, "QUOTE_VIEWED-DECLINED", context));
  await rejectsWith("customer-forbidden", () => answering(403).sendOrderEvent(42, "QUOTE_VIEWED-DECLINED", context));
  await rejectsWith("not-found", () => answering(404).sendOrderEvent(42, "QUOTE_VIEWED-DECLINED", context));
  await rejectsWith("command-refused", () => answering(409).sendOrderEvent(42, "QUOTE_VIEWED-DECLINED", context));
  await rejectsWith("core-request-failed", () => answering(500).sendOrderEvent(42, "QUOTE_VIEWED-DECLINED", context));
}

assert.deepEqual(coreSnowContract.quoteFilters, ["account.id"]);
assert.deepEqual(coreSnowContract.orderItemFilters, ["order.account.id", "order.id"]);
assert.deepEqual(plain(coreSnowContract.scopeModes), {
  agreements: "server-scoped",
  orders: "server-scoped",
  orderItems: "server-scoped",
  productPrices: "unscoped",
  products: "unscoped",
  properties: "browser-filtered",
});
assert.deepEqual(coreSnowContract.propertyFilters, ["type.code"]);
assert.equal(coreSnowContract.propertyType, "SNOW_REMOVAL_PROPERTY");
assert.deepEqual(Object.keys(coreSnowContract.customerQuoteStatus).sort(), [
  "CLIENT_APPROVED", "CUSTOMER_CHANGES_REQUESTED", "DECLINED", "QUOTE_SENT", "QUOTE_VIEWED",
]);
assert.deepEqual(coreSnowContract.operatorQuoteStates, ["CHANGES_REQUESTED", "INITIAL", "QUOTE_APPROVED_INTERNALLY", "QUOTE_PREPARED"]);

console.log("core-snow-adapter-check ok: properties filtered in the browser against an inherited ACCOUNT attribute, coordinates read from COORD_LAT and COORD_LNG with a missing value left missing, agreements, quotes and their lines filtered to the Account in the request with any foreign row dropped and reported as browser-filtered, catalog rows reported as unscoped, a failed read left absent as a partial result, a catalog 401 kept from signing the customer out, and the pre-read, ownership check and generic event request of every contract command")

function json(value) { return { ok: true, status: 200, async json() { return structuredClone(value); } }; }
function plain(value) { return JSON.parse(JSON.stringify(value)); }
async function rejectsWith(code, operation) { await assert.rejects(operation, function (error) { return error && error.code === code; }); }
