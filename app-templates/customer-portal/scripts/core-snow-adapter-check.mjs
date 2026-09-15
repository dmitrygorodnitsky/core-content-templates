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
const orderType = { id: 5, code: "FIELD_SERVICE_ORDER", nls: { en: { NAME: "Field service order" } } };

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

function order(id, stateCode, propertyId) {
  const row = {
    id,
    account: { id: 62 },
    type: orderType,
    grandTotal: 0,
    created: 1785961364110,
    states: [{ id: 1, code: stateCode }],
    attributes: { 5: { CLIENT: { value: 62 } } },
  };
  if (propertyId != null) row.attributes[5].SERVICE_PROPERTY = { value: propertyId };
  return row;
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
    return json({ resultSize: (table.orders || []).length, result: table.orders || [] });
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

{
  const calls = [];
  const table = {
    orders: [
      order(18, "INITIAL", 278),
      order(19, "QUOTE_PREPARED", 278),
      order(20, "QUOTE_SENT", 278),
      order(21, "QUOTE_VIEWED", 278),
      order(22, "CLIENT_APPROVED", 278),
      order(23, "DECLINED", null),
      order(24, "CUSTOMER_CHANGES_REQUESTED", 278),
    ],
    properties: [property(278, 62, 610, "123 Main Street")],
    addresses: [address(610, "#1001 - 7445 132nd Street", "Surrey", "V3W 1J8")],
  };
  const adapter = createCoreSnowQuotesAdapter({ origin, fetch: coreFetch(table, calls) });
  const result = await adapter.load("proposals", context);

  assert.equal(result.state, "ready");
  assert.equal(result.scopeMode, "server-scoped");
  assert.deepEqual(calls[0].body.filters, [{ type: "INTEGER", operator: "=", property: "account.id", value: "62" }]);
  assert.deepEqual(result.sites.map((site) => site.backendId), [20, 21, 22, 23, 24]);
  assert.deepEqual(result.sites.map((site) => site.status), ["unseen", "viewed", "approved", "declined", "revision"]);
  assert.equal(result.unsentCount, 2, "a quote the operator has not sent is not the customer's business but is still counted");

  const sent = result.sites[0];
  assert.equal(sent.addr, "123 Main Street");
  assert.equal(sent.city, "Surrey");
  assert.equal(sent.postal, "V3W 1J8");
  assert.equal(sent.propertyId, "prop-core-278");
  for (const absent of ["lot", "areas", "selected", "x", "y"]) {
    assert.equal(sent[absent], null, absent + " is design-only and has no Core source");
  }
  const declined = result.sites[3];
  assert.equal(declined.propertyId, null);
  assert.equal(declined.addr, "");
}

{
  const adapter = createCoreSnowQuotesAdapter({ origin, fetch: coreFetch({ orders: [] }) });
  const result = await adapter.load("proposals", context);
  assert.deepEqual(result.sites, []);
  assert.equal(result.unsentCount, 0);
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
  const failing = (status) => async () => ({ ok: false, status, async json() { return {}; } });
  await rejectsWith("session-expired", () => createCoreSnowQuotesAdapter({ origin, fetch: failing(401) }).load("proposals", context));
  await rejectsWith("customer-forbidden", () => createCoreSnowQuotesAdapter({ origin, fetch: failing(403) }).load("proposals", context));
  await rejectsWith("core-request-failed", () => createCoreSnowQuotesAdapter({ origin, fetch: failing(500) }).load("proposals", context));
  await rejectsWith("unprojectable-response", () => createCoreSnowQuotesAdapter({
    origin,
    fetch: async () => ({ ok: true, status: 200, async json() { return "<!doctype html>"; } }),
  }).load("proposals", context));
}

assert.deepEqual(coreSnowContract.quoteFilters, ["account.id"]);
assert.deepEqual(coreSnowContract.propertyFilters, ["type.code"]);
assert.equal(coreSnowContract.propertyType, "SNOW_REMOVAL_PROPERTY");
assert.deepEqual(Object.keys(coreSnowContract.customerQuoteStatus).sort(), [
  "CLIENT_APPROVED", "CUSTOMER_CHANGES_REQUESTED", "DECLINED", "QUOTE_SENT", "QUOTE_VIEWED",
]);
assert.deepEqual(coreSnowContract.operatorQuoteStates, ["CHANGES_REQUESTED", "INITIAL", "QUOTE_APPROVED_INTERNALLY", "QUOTE_PREPARED"]);

console.log("core-snow-adapter-check ok: properties filtered in the browser against an inherited ACCOUNT attribute, coordinates read from COORD_LAT and COORD_LNG with a missing value left missing, quotes scoped by the server, operator-side quote states withheld, and every design-only field left absent");

function json(value) { return { ok: true, status: 200, async json() { return structuredClone(value); } }; }
async function rejectsWith(code, operation) { await assert.rejects(operation, function (error) { return error && error.code === code; }); }
