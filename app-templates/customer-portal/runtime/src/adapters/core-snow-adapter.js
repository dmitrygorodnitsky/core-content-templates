import { attributeEntry, attributeNumber, attributeText, latestStateCode, positiveInteger, text } from "../normalizers/core-record.js";
import { CUSTOMER_ORDER_STATUS, OPERATOR_ORDER_STATES, QUOTE_ORDER_TYPES } from "../normalizers/contracts.js";
import { formatPostalAddress } from "../normalizers/postal-address.js";
import { VISIT_TYPE } from "../normalizers/visits.js";
import { coreSessionFetch } from "./core-oidc-adapter.js";

const PROPERTY_TYPE = "SNOW_REMOVAL_PROPERTY";
const PROPERTY_BASE_TYPE = "PROPERTY";
const AGREEMENT_TYPE = "SERVICE_AGREEMENT";
const PIM_SERVICE_BASE = "/core-pim";

const PROPERTY_PAGE_SIZE = 200;
const PROPERTY_PAGE_LIMIT = 6;
const AGREEMENT_PAGE_SIZE = 100;
const ORDER_PAGE_SIZE = 100;
const LINE_PAGE_SIZE = 200;
const CATALOG_PAGE_SIZE = 200;
const VISIT_PAGE_SIZE = 50;
const VISIT_TRANSITION_PAGE_SIZE = 20;
const INVOICE_PAGE_SIZE = 50;

const MEDIA_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const REF_MAPPINGS = [{ name: "id" }, { name: "code" }, { name: "nls" }];
const ID_MAPPINGS = [{ name: "id" }];

const RESOURCE_MAPPINGS = [
  { name: "attributes" },
  { name: "code" },
  { name: "id" },
  { name: "nls" },
  { key: "id", mappings: REF_MAPPINGS, name: "type", type: "identifier" },
  { mappings: REF_MAPPINGS, name: "states", type: "collection" },
];

const ADDRESS_MAPPINGS = [
  { name: "address1" },
  { name: "city" },
  { name: "id" },
  { name: "postalCode" },
  { key: "id", mappings: [{ name: "id" }, { name: "code" }], name: "country", type: "identifier" },
  { key: "id", mappings: [{ name: "id" }, { name: "code" }], name: "state", type: "identifier" },
];

const ACCOUNT_ADDRESS_MAPPINGS = [
  { name: "id" },
  { key: "id", mappings: ID_MAPPINGS, name: "user", type: "identifier" },
  {
    name: "addresses",
    type: "collection",
    mappings: [{ key: "id", mappings: ADDRESS_MAPPINGS, name: "address", type: "identifier" }],
  },
];

const ORDER_MAPPINGS = [
  { name: "attributes" },
  { name: "grandTotal" },
  { name: "id" },
  { name: "totalCharges" },
  { name: "totalTaxes" },
  { key: "id", mappings: ID_MAPPINGS, name: "account", type: "identifier" },
  { key: "id", mappings: REF_MAPPINGS, name: "currency", type: "identifier" },
  { mappings: ID_MAPPINGS, name: "items", type: "collection" },
  { mappings: REF_MAPPINGS, name: "states", type: "collection" },
  { key: "id", mappings: REF_MAPPINGS, name: "type", type: "identifier" },
];

const DOCUMENT_TYPE_MAPPINGS = [{ name: "code" }, { name: "id" }];

const AGREEMENT_MAPPINGS = [
  { name: "attributes" },
  { name: "id" },
  { key: "id", mappings: REF_MAPPINGS, name: "organization", type: "identifier" },
  { mappings: REF_MAPPINGS, name: "states", type: "collection" },
  { key: "id", mappings: REF_MAPPINGS, name: "type", type: "identifier" },
];

const ORDER_ITEM_MAPPINGS = [
  { name: "amount" },
  { name: "grandTotal" },
  { name: "id" },
  { name: "itemCount" },
  { name: "metadata" },
  { name: "sortOrder" },
  { name: "totalTaxes" },
  { key: "id", mappings: ID_MAPPINGS, name: "itemPrice", type: "identifier" },
  { key: "id", mappings: ID_MAPPINGS, name: "order", type: "identifier" },
];

const PRODUCT_PRICE_MAPPINGS = [
  { name: "id" },
  { name: "nls" },
  { key: "id", mappings: ID_MAPPINGS, name: "product", type: "identifier" },
  { key: "id", mappings: REF_MAPPINGS, name: "type", type: "identifier" },
];

const PRODUCT_MAPPINGS = [{ name: "code" }, { name: "id" }, { name: "nls" }];

const ORDER_TARGET_MAPPINGS = [
  { name: "id" },
  { key: "id", mappings: ID_MAPPINGS, name: "account", type: "identifier" },
  { mappings: REF_MAPPINGS, name: "states", type: "collection" },
  { key: "id", mappings: REF_MAPPINGS, name: "type", type: "identifier" },
];

const AGREEMENT_TARGET_MAPPINGS = [
  { name: "attributes" },
  { name: "id" },
  { mappings: REF_MAPPINGS, name: "states", type: "collection" },
  { key: "id", mappings: REF_MAPPINGS, name: "type", type: "identifier" },
];

const TAGGED_REF_MAPPINGS = [{ name: "id" }, { name: "code" }, { name: "nls" }];

const VISIT_MAPPINGS = [
  { name: "id" },
  { name: "code" },
  { name: "nls" },
  { name: "start" },
  { name: "end" },
  { name: "attributes" },
  { name: "type", type: "identifier", mappings: TAGGED_REF_MAPPINGS },
  { name: "states", type: "collection", mappings: TAGGED_REF_MAPPINGS },
];

const INVOICE_MAPPINGS = [
  { name: "id" },
  { name: "created" },
  { name: "dueDate" },
  { name: "notes" },
  { name: "amountDue" },
  { name: "totalPaidAmount" },
  { name: "attributes" },
  { name: "type", type: "identifier", mappings: TAGGED_REF_MAPPINGS },
  { name: "states", type: "collection", mappings: TAGGED_REF_MAPPINGS },
  { name: "order", type: "reference", mappings: [{ name: "id" }, { name: "currency", type: "identifier", mappings: [{ name: "id" }, { name: "code" }] }] },
  {
    name: "items",
    type: "collection",
    mappings: [
      { name: "id" },
      { name: "amount" },
      { name: "itemCount" },
      { name: "notes" },
      {
        name: "itemPrice",
        type: "reference",
        mappings: [{ name: "id" }, { name: "product", type: "reference", mappings: TAGGED_REF_MAPPINGS }],
      },
    ],
  },
];

const VISIT_LIST_BODY = Object.freeze({
  filters: [{ operator: "=", property: "type.code", value: VISIT_TYPE }],
  mappings: VISIT_MAPPINGS,
  offset: 0,
  pageSize: VISIT_PAGE_SIZE,
  sorting: [{ field: "start", direction: "DESC" }],
});

const VISIT_TRANSITIONS_BODY = Object.freeze({
  filters: [],
  mappings: [
    { name: "id" },
    { name: "observed" },
    { name: "state", type: "identifier", mappings: TAGGED_REF_MAPPINGS },
  ],
  offset: 0,
  pageSize: VISIT_TRANSITION_PAGE_SIZE,
  sorting: [{ field: "observed", direction: "ASC" }],
});

const INVOICE_LIST_BODY = Object.freeze({
  mappings: INVOICE_MAPPINGS,
  offset: 0,
  pageSize: INVOICE_PAGE_SIZE,
  sorting: [{ field: "dueDate", direction: "DESC" }],
});

export function createCoreSnowVisitsAdapter(options = {}) {
  var fetchImpl = options.fetch || coreSessionFetch;
  if (typeof fetchImpl !== "function") throw contractError("fetch-unavailable", "Core snow adapter requires fetch");
  return {
    async load(moduleId, context) {
      if (moduleId !== "appointmentsTimeline") throw contractError("unsupported-module", "Core snow visits adapter cannot load " + moduleId);
      return loadSnowVisits(context, fetchImpl, options.origin);
    },
  };
}

export function createCoreSnowInvoicesAdapter(options = {}) {
  var fetchImpl = options.fetch || coreSessionFetch;
  if (typeof fetchImpl !== "function") throw contractError("fetch-unavailable", "Core snow adapter requires fetch");
  return {
    async load(moduleId, context) {
      if (moduleId !== "invoices") throw contractError("unsupported-module", "Core snow invoices adapter cannot load " + moduleId);
      return loadSnowInvoices(context, fetchImpl, options.origin);
    },
  };
}

export async function loadSnowVisits(context, fetchImpl = coreSessionFetch, explicitOrigin) {
  var api = readContext(context, explicitOrigin);
  var reply = await requestJson(fetchImpl, api.serviceBase + "/api/tagged/appointment/list.json", readOptions(api, VISIT_LIST_BODY));
  var rows = listResult(reply);
  return {
    state: "ready",
    accountId: api.accountId,
    items: rows.filter(function (row) { return text(row && row.type && row.type.code) === VISIT_TYPE; }),
    truncated: resultSizeOf(reply, rows.length) > rows.length,
  };
}

export async function readVisitTransitions(context, backendId, fetchImpl = coreSessionFetch, explicitOrigin) {
  var api = readContext(context, explicitOrigin);
  var id = positiveInteger(backendId);
  if (!id) throw contractError("invalid-target", "A visit id is required before reading its progress");
  var reply = await requestJson(fetchImpl, api.serviceBase + "/api/tagged/appointment/" + id + "/list-transitions.json", readOptions(api, VISIT_TRANSITIONS_BODY));
  return listResult(reply);
}

export async function loadSnowInvoices(context, fetchImpl = coreSessionFetch, explicitOrigin) {
  var api = readContext(context, explicitOrigin);
  var reply = await requestJson(fetchImpl, api.billBase + "/api/tagged/invoice/list.json", readOptions(api, INVOICE_LIST_BODY));
  var rows = listResult(reply);
  return {
    state: "ready",
    accountId: api.accountId,
    items: rows,
    truncated: resultSizeOf(reply, rows.length) > rows.length,
  };
}

export function createCoreSnowPropertiesAdapter(options = {}) {
  var fetchImpl = options.fetch || coreSessionFetch;
  if (typeof fetchImpl !== "function") throw contractError("fetch-unavailable", "Core snow adapter requires fetch");
  return {
    async load(moduleId, context) {
      if (moduleId !== "properties") throw contractError("unsupported-module", "Core snow properties adapter cannot load " + moduleId);
      return loadSnowProperties(context, fetchImpl, options.origin);
    },
  };
}

export function createCoreSnowQuotesAdapter(options = {}) {
  var fetchImpl = options.fetch || coreSessionFetch;
  if (typeof fetchImpl !== "function") throw contractError("fetch-unavailable", "Core snow adapter requires fetch");
  return {
    async load(moduleId, context) {
      if (moduleId !== "proposals") throw contractError("unsupported-module", "Core snow quotes adapter cannot load " + moduleId);
      return loadSnowQuotes(context, fetchImpl, options.origin);
    },
    async readOrder(backendId, context) {
      return readCustomerOrder(context, backendId, fetchImpl, options.origin);
    },
    async readAgreement(backendId, context) {
      return readCustomerAgreement(context, backendId, fetchImpl, options.origin);
    },
    async sendOrderEvent(backendId, event, context) {
      var api = readContext(context, options.origin);
      return sendEvent(fetchImpl, api, api.billBase + "/api/tagged/order/" + commandId(backendId) + "/send-event.json?event=" + eventCode(event));
    },
    async sendAgreementEvent(backendId, event, context) {
      var api = readContext(context, options.origin);
      return sendEvent(fetchImpl, api, api.coreBase + "/api/tagged/document/" + commandId(backendId) + "/send-event.json?event=" + eventCode(event));
    },
  };
}

export async function loadSnowProperties(context, fetchImpl = coreSessionFetch, explicitOrigin) {
  var api = readContext(context, explicitOrigin);
  var rows = await customerProperties(api, fetchImpl);
  var addresses = await resolveAddresses(api, fetchImpl, rows.items);
  return {
    state: "ready",
    accountId: api.accountId,
    items: rows.items.map(function (row) { return propertyRecord(row, addresses); }),
    scopeMode: rows.scopeMode,
    truncated: rows.truncated,
  };
}

export async function loadSnowQuotes(context, fetchImpl = coreSessionFetch, explicitOrigin) {
  var api = readContext(context, explicitOrigin);
  var primary = await Promise.all([
    settled(customerAgreements(api, fetchImpl)),
    settled(customerOrders(api, fetchImpl)),
  ]);
  var agreements = primary[0];
  var orders = primary[1];
  rethrowSessionLoss(primary);
  if (agreements.state !== "ready" && orders.state !== "ready") throw orders.error;

  var visibleOrderIds = orders.state === "ready" ? customerVisibleOrderIds(orders.rows) : [];
  var orderItems = visibleOrderIds.length
    ? await settled(customerOrderItems(api, fetchImpl, visibleOrderIds))
    : skippedRead("server-scoped", orders.state === "ready");
  rethrowSessionLoss([orderItems]);
  var priceIds = referencedIds(orderItems.rows, "itemPrice");
  var productPrices = priceIds.length
    ? await settled(catalogRows(fetchImpl, api, api.pimBase + "/api/product-price/list.json", priceIds, PRODUCT_PRICE_MAPPINGS))
    : skippedRead("unscoped", orderItems.state === "ready");
  var productIds = referencedIds(productPrices.rows, "product");
  var products = productIds.length
    ? await settled(catalogRows(fetchImpl, api, api.pimBase + "/api/product/list.json", productIds, PRODUCT_MAPPINGS))
    : skippedRead("unscoped", productPrices.state === "ready");

  return {
    state: "ready",
    accountId: api.accountId,
    scopeMode: weakestScope([agreements, orders, orderItems]),
    reads: {
      agreements: readSummary(agreements),
      orders: readSummary(orders),
      orderItems: readSummary(orderItems),
      productPrices: readSummary(productPrices),
      products: readSummary(products),
    },
    client: { displayName: api.accountName },
    agreements: agreements.rows,
    quoteOrders: orders.rows,
    orderItems: orderItems.rows,
    productPrices: productPrices.rows,
    products: products.rows,
  };
}

export async function readCustomerOrder(context, backendId, fetchImpl = coreSessionFetch, explicitOrigin) {
  var api = readContext(context, explicitOrigin);
  var id = commandId(backendId);
  var row = await requestJson(fetchImpl, api.billBase + "/api/tagged/order/get.json?id=" + id, readOptions(api, ORDER_TARGET_MAPPINGS));
  if (!row || positiveInteger(row.id) !== id) throw contractError("not-found", "Core did not return the Order");
  if (positiveInteger(row.account && row.account.id) !== api.accountId) throw contractError("customer-forbidden", "The Order does not belong to the signed-in customer");
  return row;
}

export async function readCustomerAgreement(context, backendId, fetchImpl = coreSessionFetch, explicitOrigin) {
  var api = readContext(context, explicitOrigin);
  var id = commandId(backendId);
  var row = await requestJson(fetchImpl, api.coreBase + "/api/tagged/document/get.json?id=" + id, readOptions(api, AGREEMENT_TARGET_MAPPINGS));
  if (!row || positiveInteger(row.id) !== id || text(row.type && row.type.code) !== AGREEMENT_TYPE) throw contractError("not-found", "Core did not return the service agreement");
  if (attributeNumber(row, "CLIENT") !== api.accountId) throw contractError("customer-forbidden", "The service agreement does not belong to the signed-in customer");
  return row;
}

async function customerAgreements(api, fetchImpl) {
  var types = await requestJson(fetchImpl, api.coreBase + "/api/document-type/list.json", readOptions(api, {
    filters: [{ type: "STRING", operator: "=", property: "code", value: AGREEMENT_TYPE }],
    mappings: DOCUMENT_TYPE_MAPPINGS,
    offset: 0,
    pageSize: 2,
  }));
  var type = listResult(types).find(function (row) { return text(row && row.code) === AGREEMENT_TYPE; });
  var typeId = positiveInteger(type && type.id);
  if (!typeId) throw contractError("agreement-type-unavailable", "Core did not return the service agreement type");
  var reply = await requestJson(fetchImpl, api.coreBase + "/api/tagged/document/list.json", readOptions(api, {
    filters: [
      { type: "STRING", operator: "=", property: "type.code", value: AGREEMENT_TYPE },
      { type: "INTEGER", operator: "=", property: "attributes." + typeId + ".CLIENT.value", value: String(api.accountId) },
    ],
    mappings: AGREEMENT_MAPPINGS,
    offset: 0,
    pageSize: AGREEMENT_PAGE_SIZE,
  }));
  return scopedRows(reply, function (row) {
    return text(row && row.type && row.type.code) === AGREEMENT_TYPE && attributeNumber(row, "CLIENT") === api.accountId;
  });
}

async function customerOrders(api, fetchImpl) {
  var reply = await requestJson(fetchImpl, api.billBase + "/api/tagged/order/list.json", readOptions(api, {
    filters: [{ type: "INTEGER", operator: "=", property: "account.id", value: String(api.accountId) }],
    mappings: ORDER_MAPPINGS,
    offset: 0,
    pageSize: ORDER_PAGE_SIZE,
  }));
  return scopedRows(reply, function (row) { return positiveInteger(row && row.account && row.account.id) === api.accountId; });
}

async function customerOrderItems(api, fetchImpl, orderIds) {
  var reply = await requestJson(fetchImpl, api.billBase + "/api/tagged/order-item/list.json", readOptions(api, {
    filters: [
      { type: "INTEGER", operator: "=", property: "order.account.id", value: String(api.accountId) },
      { type: "INTEGER", operator: "IN", property: "order.id", value: orderIds.join(",") },
    ],
    mappings: ORDER_ITEM_MAPPINGS,
    offset: 0,
    pageSize: LINE_PAGE_SIZE,
  }));
  return scopedRows(reply, function (row) { return orderIds.indexOf(positiveInteger(row && row.order && row.order.id)) !== -1; });
}

async function catalogRows(fetchImpl, api, url, ids, mappings) {
  var reply = await requestJson(fetchImpl, url, readOptions(api, {
    filters: [{ type: "INTEGER", operator: "IN", property: "id", value: ids.join(",") }],
    mappings: mappings,
    offset: 0,
    pageSize: CATALOG_PAGE_SIZE,
  }));
  var rows = listResult(reply).filter(function (row) { return ids.indexOf(positiveInteger(row && row.id)) !== -1; });
  return { rows: rows, scopeMode: "unscoped", truncated: resultSizeOf(reply, rows.length) > rows.length };
}

function scopedRows(reply, owned) {
  var rows = listResult(reply);
  var kept = rows.filter(owned);
  return {
    rows: kept,
    scopeMode: kept.length === rows.length ? "server-scoped" : "browser-filtered",
    truncated: resultSizeOf(reply, rows.length) > rows.length,
  };
}

function customerVisibleOrderIds(rows) {
  var ids = [];
  (rows || []).forEach(function (row) {
    var id = positiveInteger(row && row.id);
    if (!id || QUOTE_ORDER_TYPES.indexOf(text(row.type && row.type.code)) === -1) return;
    if (!Object.prototype.hasOwnProperty.call(CUSTOMER_ORDER_STATUS, latestStateCode(row))) return;
    if (ids.indexOf(id) === -1) ids.push(id);
  });
  return ids;
}

function referencedIds(rows, field) {
  var ids = [];
  (rows || []).forEach(function (row) {
    var id = positiveInteger(row && row[field] && row[field].id);
    if (id && ids.indexOf(id) === -1) ids.push(id);
  });
  return ids;
}

async function settled(operation) {
  try {
    var result = await operation;
    return { state: "ready", rows: result.rows, scopeMode: result.scopeMode, truncated: !!result.truncated, error: null };
  } catch (error) {
    return { state: error && error.code === "customer-forbidden" ? "unauthorized" : "error", rows: null, scopeMode: null, truncated: false, error: error };
  }
}

function skippedRead(scopeMode, readable) {
  return readable
    ? { state: "ready", rows: [], scopeMode: scopeMode, truncated: false, error: null }
    : { state: "error", rows: null, scopeMode: null, truncated: false, error: null };
}

function rethrowSessionLoss(reads) {
  var lost = reads.find(function (read) { return read.error && read.error.code === "session-expired"; });
  if (lost) throw lost.error;
}

function readSummary(read) {
  var summary = { state: read.state, scopeMode: read.scopeMode, truncated: read.truncated };
  if (read.error && read.error.code) summary.reasonCode = read.error.code;
  return summary;
}

function weakestScope(reads) {
  var modes = reads.filter(function (read) { return read.state === "ready"; }).map(function (read) { return read.scopeMode; });
  if (modes.indexOf("unscoped") !== -1) return "unscoped";
  if (modes.indexOf("browser-filtered") !== -1) return "browser-filtered";
  return modes.length ? "server-scoped" : null;
}

function listResult(reply) {
  return Array.isArray(reply && reply.result) ? reply.result : [];
}

function resultSizeOf(reply, fallback) {
  return reply && typeof reply.resultSize === "number" && Number.isFinite(reply.resultSize) ? reply.resultSize : fallback;
}

async function sendEvent(fetchImpl, api, url) {
  var response = await fetchImpl(url, readOptions(api, {}));
  if (!response || typeof response.ok !== "boolean") throw contractError("invalid-response", "Core request returned an invalid response");
  if (!response.ok) throw failure(response.status, true);
  return true;
}

function commandId(backendId) {
  var id = positiveInteger(backendId);
  if (!id) throw contractError("invalid-target", "A Core id is required before sending an event");
  return id;
}

function eventCode(event) {
  var code = text(event);
  if (!/^[A-Z][A-Z_]*-[A-Z][A-Z_]*$/.test(code)) throw contractError("invalid-event", "A workflow event code is required");
  return encodeURIComponent(code);
}

async function customerProperties(api, fetchImpl) {
  var items = [];
  var truncated = false;
  var scopeMode = "server-scoped";
  for (var page = 0; page < PROPERTY_PAGE_LIMIT; page += 1) {
    var response = await requestJson(fetchImpl, api.resourceBase + "/api/tagged/resource/list.json", readOptions(api, {
      filters: [{ type: "STRING", operator: "=", property: "type.code", value: PROPERTY_TYPE }],
      mappings: RESOURCE_MAPPINGS,
      offset: page * PROPERTY_PAGE_SIZE,
      pageSize: PROPERTY_PAGE_SIZE,
    }));
    var rows = Array.isArray(response && response.result) ? response.result : [];
    rows.forEach(function (row) {
      if (attributeNumber(row, "ACCOUNT") === api.accountId) items.push(row);
      else scopeMode = "browser-filtered";
    });
    if (rows.length < PROPERTY_PAGE_SIZE) return { items: items, truncated: false, scopeMode: scopeMode };
    truncated = page === PROPERTY_PAGE_LIMIT - 1;
  }
  return { items: items, truncated: truncated, scopeMode: scopeMode };
}

async function resolveAddresses(api, fetchImpl, rows) {
  var resolved = {};
  var ids = [];
  rows.forEach(function (row) {
    var id = attributeNumber(row, "ADDRESS");
    if (id && ids.indexOf(id) < 0) ids.push(id);
  });
  if (!ids.length) return resolved;
  if (!api.userId) throw contractError("session-user-required", "The signed-in Core User is required before reading property addresses");
  var account = await requestJson(fetchImpl, api.accountBase + "/api/tagged/account/get.json?id=" + api.accountId, readOptions(api, ACCOUNT_ADDRESS_MAPPINGS));
  if (positiveInteger(account && account.id) !== api.accountId || positiveInteger(account && account.user && account.user.id) !== api.userId) {
    throw contractError("customer-forbidden", "Property addresses must belong to the signed-in customer's Account");
  }
  (Array.isArray(account.addresses) ? account.addresses : []).forEach(function (link) {
    var address = link && link.address;
    var id = positiveInteger(address && address.id);
    if (id && ids.indexOf(id) !== -1) resolved[String(id)] = address;
  });
  return resolved;
}

function propertyRecord(row, addresses) {
  var address = addresses[String(attributeNumber(row, "ADDRESS"))] || null;
  return {
    id: "prop-core-" + row.id,
    backendId: positiveInteger(row.id),
    name: localizedName(row.nls) || text(row.code) || "Property",
    address: formatPostalAddress(address),
    city: address ? text(address.city) : "",
    postal: address ? text(address.postalCode) : "",
    region: address && address.state ? text(address.state.code) : "",
    country: address && address.country ? text(address.country.id || address.country.code) : "",
    category: attributeText(row, "PROPERTY_CATEGORY") || null,
    stateCode: latestStateCode(row) || null,
    lat: attributeCoordinate(row, "COORD_LAT", 90),
    lon: attributeCoordinate(row, "COORD_LNG", 180),
    areaSqft: attributeArea(row, "SERVICE_AREA_SQFT"),
    planId: attributeMediaId(row, "PROPERTY_PLAN"),
    zone: null,
    contract: null,
    quoteSiteId: null,
    appointment: null,
    ticket: null,
    lastService: null,
  };
}

function attributeArea(row, code) {
  var entry = attributeEntry(row, code);
  var value = entry ? entry.value : null;
  var number = typeof value === "number" ? value
    : typeof value === "string" && value.trim() !== "" ? Number(value)
    : Number.NaN;
  return Number.isFinite(number) && number > 0 ? number : null;
}

function attributeMediaId(row, code) {
  var entry = attributeEntry(row, code);
  var value = entry ? entry.value : null;
  if (typeof value === "string" && /^\s*\[/.test(value)) {
    try {
      value = JSON.parse(value);
    } catch (_) {
      return "";
    }
  }
  var ids = (Array.isArray(value) ? value : value == null ? [] : [value]).map(function (item) {
    var id = text(item && typeof item === "object" ? item.id : item).toLowerCase();
    return MEDIA_ID.test(id) ? id : "";
  });
  return ids.length === 1 ? ids[0] : "";
}

function attributeCoordinate(row, code, limit) {
  var entry = attributeEntry(row, code);
  var value = entry ? entry.value : null;
  var number = typeof value === "number" ? value
    : typeof value === "string" && value.trim() !== "" ? Number(value)
    : Number.NaN;
  return Number.isFinite(number) && Math.abs(number) <= limit ? number : null;
}

function readContext(context, explicitOrigin) {
  var config = context && context.config || {};
  var runtimeState = context && context.state || {};
  var session = runtimeState.session || {};
  var accessToken = text(session.accessToken || session.access_token);
  if (!accessToken) throw contractError("session-required", "A Core access token is required");
  var account = runtimeState.customerAccount || session.account || null;
  var accountId = positiveInteger(account && account.id);
  if (!accountId) throw contractError("customer-unresolved", "A resolved customer Account is required before reading snow records");
  var organization = text(config.organization);
  if (!organization) throw contractError("organization-required", "A portal organization code is required");
  var origin = explicitOrigin || config.origin || browserOrigin();
  return {
    accountBase: sameOriginBase(config.accountApiBase || "/core-acct", origin, "Core Account API base"),
    accountId: accountId,
    accountName: text(account && typeof account.displayName === "string" ? account.displayName : ""),
    authorization: text(session.tokenType || session.token_type || "Bearer") + " " + accessToken,
    billBase: sameOriginBase(config.billApiBase || "/core-bill", origin, "Core Bill API base"),
    coreBase: sameOriginBase(config.coreApiBase || "/core", origin, "Core API base"),
    organization: organization,
    pimBase: sameOriginBase(PIM_SERVICE_BASE, origin, "Core PIM API base"),
    resourceBase: sameOriginBase(config.resourceApiBase || "/core-rm", origin, "Core Resource API base"),
    serviceBase: sameOriginBase(config.serviceApiBase || "/core-svc", origin, "Core Service API base"),
    userId: positiveInteger(session.userId),
  };
}

function readOptions(api, body) {
  return {
    method: "POST",
    credentials: "same-origin",
    headers: {
      Authorization: api.authorization,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Organization-Code": api.organization,
    },
    body: JSON.stringify(body),
  };
}

async function requestJson(fetchImpl, url, options) {
  var response = await fetchImpl(url, options);
  if (!response || typeof response.ok !== "boolean") throw contractError("invalid-response", "Core request returned an invalid response");
  if (!response.ok) throw failure(response.status);
  var payload;
  try {
    payload = await response.json();
  } catch (_) {
    throw contractError("invalid-response", "Core response was not valid JSON");
  }
  if (typeof payload === "string") throw contractError("unprojectable-response", "Core answered with an unprojected body");
  return payload;
}

function sameOriginBase(value, origin, label) {
  if (!origin) throw contractError("origin-required", label + " requires a browser origin");
  var target = new URL(String(value || ""), origin);
  if (target.origin !== new URL(origin).origin) throw contractError("cross-origin-service", label + " must be same-origin");
  return target.href.replace(/\/+$/, "");
}

function browserOrigin() {
  return globalThis.location && globalThis.location.origin || "";
}

function localizedName(value) {
  if (!value || typeof value !== "object") return "";
  var localized = value.en || value["en-US"] || Object.values(value)[0] || {};
  return text(localized && (localized.NAME || localized.name));
}

function failure(status, command) {
  var code = status === 401 ? "session-expired"
    : status === 403 ? "customer-forbidden"
    : status === 404 ? "not-found"
    : command && status >= 400 && status < 500 ? "command-refused"
    : "core-request-failed";
  var error = contractError(code, "Core request failed with HTTP " + status);
  error.status = status;
  return error;
}

function contractError(code, message) {
  var error = new Error(message);
  error.code = code;
  return error;
}

export const coreSnowContract = Object.freeze({
  accountAddressMappings: ACCOUNT_ADDRESS_MAPPINGS,
  addressMappings: ADDRESS_MAPPINGS,
  agreementMappings: AGREEMENT_MAPPINGS,
  agreementType: AGREEMENT_TYPE,
  invoiceListBody: INVOICE_LIST_BODY,
  customerQuoteStatus: Object.freeze(Object.assign({}, CUSTOMER_ORDER_STATUS)),
  operatorQuoteStates: Object.freeze(OPERATOR_ORDER_STATES.slice()),
  orderItemMappings: ORDER_ITEM_MAPPINGS,
  orderMappings: ORDER_MAPPINGS,
  productMappings: PRODUCT_MAPPINGS,
  productPriceMappings: PRODUCT_PRICE_MAPPINGS,
  propertyBaseType: PROPERTY_BASE_TYPE,
  propertyPageLimit: PROPERTY_PAGE_LIMIT,
  propertyPageSize: PROPERTY_PAGE_SIZE,
  propertyType: PROPERTY_TYPE,
  quoteOrderTypes: Object.freeze(QUOTE_ORDER_TYPES.slice()),
  resourceMappings: RESOURCE_MAPPINGS,
  visitListBody: VISIT_LIST_BODY,
  visitTransitionsBody: VISIT_TRANSITIONS_BODY,
  quoteFilters: ["account.id"],
  agreementFilters: ["type.code", "attributes.{SERVICE_AGREEMENT type id}.CLIENT.value"],
  orderItemFilters: ["order.account.id", "order.id"],
  catalogFilters: ["id"],
  propertyFilters: ["type.code"],
  scopeModes: Object.freeze({
    agreements: "server-scoped",
    orders: "server-scoped",
    orderItems: "server-scoped",
    productPrices: "unscoped",
    products: "unscoped",
    properties: "server-scoped",
  }),
});
