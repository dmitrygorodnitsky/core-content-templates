// Read-only Core Bill adapter. Every query is scoped to the Account resolved
// from the current Core User; route ids are never sufficient ownership proof.
//
// A purchase is the customer's view of a committed Order. What it delivers
// comes from its typed lines (SERVICE / RETAIL / PACKAGE / MEMBERSHIP, or MIXED
// when they differ); pickup is a separate fulfillment dimension carried by a
// SPA_FULFILLMENT shipment, not an order state.

const ITEM_KINDS = {
  SPA_ITEM_MEMBERSHIP: "MEMBERSHIP",
  SPA_ITEM_PACKAGE: "PACKAGE",
  SPA_ITEM_RETAIL: "RETAIL",
  SPA_ITEM_SERVICE: "SERVICE",
};

/* Backend workflow state -> approved customer vocabulary, in one place so no
   component ever reads a raw state. A state outside this table is a contract
   gap and fails loudly rather than reaching the UI with a guessed label. */
const ORDER_STATUS = {
  CANCELLED: "Cancelled",
  COMPLETED: "Fulfilled",
  IN_PROGRESS: "In progress",
  OPEN: "Confirmed",
};

const FULFILLMENT_TYPE = "SPA_FULFILLMENT";

const REF_MAPPINGS = [{ name: "id" }, { name: "code" }, { name: "nls" }];

const ORDER_ITEM_MAPPINGS = [
  { name: "amount" },
  { name: "attributes" },
  { name: "id" },
  { name: "itemCount" },
  { name: "notes" },
  { name: "sortOrder" },
  {
    key: "id",
    mappings: REF_MAPPINGS.concat([{ key: "id", mappings: REF_MAPPINGS, name: "product", type: "identifier" }]),
    name: "itemPrice",
    type: "identifier",
  },
  { key: "id", mappings: REF_MAPPINGS, name: "order", type: "identifier" },
  { key: "id", mappings: REF_MAPPINGS, name: "type", type: "identifier" },
];

const SHIPMENT_MAPPINGS = [
  { name: "attributes" },
  { name: "id" },
  { key: "id", mappings: REF_MAPPINGS, name: "type", type: "identifier" },
];

const ORDER_MAPPINGS = [
  { name: "attributes" },
  { name: "created" },
  { name: "grandTotal" },
  { name: "id" },
  { name: "notes" },
  { name: "optimistic" },
  { name: "totalCharges" },
  { name: "totalTaxes" },
  { key: "id", mappings: [{ name: "id" }, { name: "code" }, { name: "nls" }], name: "account", type: "identifier" },
  { key: "id", mappings: [{ name: "id" }, { name: "code" }, { name: "nls" }], name: "currency", type: "identifier" },
  { key: "id", name: "organization", type: "identifier" },
  { mappings: [{ name: "id" }, { name: "code" }, { name: "nls" }], name: "states", type: "collection" },
  { key: "id", mappings: [{ name: "id" }, { name: "code" }, { name: "nls" }], name: "type", type: "identifier" },
];

export function createCoreOrdersAdapter(options = {}) {
  var fetchImpl = options.fetch || globalThis.fetch;
  if (typeof fetchImpl !== "function") throw contractError("fetch-unavailable", "Core Orders adapter requires fetch");
  return {
    async load(moduleId, context) {
      if (moduleId !== "orders") throw contractError("unsupported-module", "Core Orders adapter cannot load " + moduleId);
      return loadCoreOrders(context, fetchImpl, options.origin);
    },
  };
}

const STUDIO_TYPE = "SPA_STUDIO";
const FULFILLMENT_CODE_PREFIX = "CP_DEMO_FULFILLMENT_";
const TYPE_WITH_WORKFLOW_MAPPINGS = [
  { name: "id" }, { name: "code" },
  { key: "id", mappings: REF_MAPPINGS, name: "workflow", type: "identifier" },
];

/**
 * Records the pickup dimension of a retail order.
 *
 * Four things about `Shipment` shape this, all of them platform behaviour:
 *   - it has NO order relation, so the link lives in the `SOURCE_ORDER`
 *     attribute and every match is client-side;
 *   - it has no `code` column, so identity is `RECORD_CODE`, never `notes`;
 *   - it never receives an initial workflow state and `send-event` on a
 *     stateless shipment 500s, so status is the `FULFILLMENT_STATUS` attribute
 *     and NO transition is ever attempted. The workflow stays attached for the
 *     day the backend fixes state initialisation;
 *   - Core cannot filter dynamic attributes, so the idempotency match reads the
 *     rows and compares here rather than asking the server to.
 *
 * No pickup window is written. Neither the accepted design nor the studio data
 * supplies one at confirmation time, and an invented window is worse than an
 * absent one — the reader already renders an absent window as absent.
 */
export function createPickupFulfillment(orderId, context, fetchImpl = globalThis.fetch, explicitOrigin) {
  var api = writeContext(context, explicitOrigin);
  var id = positiveInteger(orderId);
  if (!id) throw contractError("fulfillment-order-required", "A Core Order id is required to record a pickup");
  var marker = FULFILLMENT_CODE_PREFIX + id;

  return (async function () {
    var existing = await pickupForOrder(api, fetchImpl, id, marker);
    if (existing) return existing;

    var resolved = await Promise.all([
      resolveOne(api, fetchImpl, api.billBase + "/api/shipment-type/list.json",
        [{ operator: "=", property: "code", type: "STRING", value: FULFILLMENT_TYPE }],
        TYPE_WITH_WORKFLOW_MAPPINGS, "fulfillment-type-missing"),
      resolveOne(api, fetchImpl, api.coreBase + "/api/organization/list.json",
        [{ operator: "=", property: "code", type: "STRING", value: api.organization }],
        [{ name: "id" }, { name: "code" }], "organization-missing"),
      studioResource(api, fetchImpl),
    ]);
    var fulfillmentType = resolved[0];
    var organization = resolved[1];
    var studio = resolved[2];

    var values = {
      FULFILLMENT_KIND: { value: "PICKUP" },
      // PENDING is the workflow's initial state and matches the accepted copy:
      // the studio confirms availability after the order is recorded.
      FULFILLMENT_STATUS: { value: "PENDING" },
      RECORD_CODE: { value: marker },
      SOURCE_ORDER: { value: id },
    };
    if (studio.row) values.PICKUP_LOCATION = { value: studio.row.id };
    var attributes = {};
    attributes[String(fulfillmentType.id)] = values;

    var savedIds = await requestJson(fetchImpl, api.billBase + "/api/shipment/save.json", writeOptions(api, {
      entities: [{
        attributes: attributes,
        organization: { id: organization.id },
        type: { id: fulfillmentType.id },
        workflow: { id: fulfillmentType.workflow.id },
      }],
      mappings: SHIPMENT_MAPPINGS,
    }));
    if (!positiveInteger(Array.isArray(savedIds) && savedIds[0])) {
      throw contractError("invalid-save-response", "Core Shipment save did not return an id");
    }

    // A 2xx is not success: the pickup must be readable and joined to this
    // order, matched the only way Core allows.
    var readback = await pickupForOrder(api, fetchImpl, id, marker);
    if (!readback) throw contractError("fulfillment-unconfirmed", "Core did not report the pickup record after the save");
    // Why a location is absent stays visible instead of looking like a studio
    // that does not exist.
    return Object.assign(readback, { locationUnresolvedReason: studio.reason });
  })();
}

async function pickupForOrder(api, fetchImpl, orderId, marker) {
  var response = await requestJson(fetchImpl, api.billBase + "/api/shipment/list.json", writeOptions(api, {
    filters: [{ operator: "=", property: "type.code", type: "STRING", value: FULFILLMENT_TYPE }],
    mappings: SHIPMENT_MAPPINGS,
    offset: 0,
    pageSize: 200,
  }));
  var rows = Array.isArray(response && response.result) ? response.result : [];
  var row = rows.find(function (candidate) {
    // Both must agree: another order's shipment must never attach to this one.
    return attributeNumber(candidate, "SOURCE_ORDER") === orderId
      && attributeText(candidate, "RECORD_CODE") === marker;
  });
  if (!row) return null;
  var normalized = normalizeFulfillment({
    kind: attributeText(row, "FULFILLMENT_KIND"),
    status: attributeText(row, "FULFILLMENT_STATUS"),
    windowEnd: attributeNumber(row, "WINDOW_END"),
    windowStart: attributeNumber(row, "WINDOW_START"),
  });
  return Object.assign({
    backendId: positiveInteger(row.id),
    locationId: attributeNumber(row, "PICKUP_LOCATION"),
    sourceOrderId: orderId,
  }, normalized);
}

/**
 * Finds the studio the pickup happens at.
 *
 * `PICKUP_LOCATION` is optional, and it stays absent rather than guessed in
 * both failure cases — but the two are NOT the same and the caller is told
 * which occurred:
 *   - `no-studio-row`: the tenant has no `SPA_STUDIO` resource;
 *   - `resource-read-refused`: core-rm rejected the read. On dev-1 it answers
 *     a customer session with 401 for every request, so a customer-created
 *     pickup currently never carries a location. That is a backend gap, not a
 *     missing studio, and it must not be reported as one.
 */
async function studioResource(api, fetchImpl) {
  var response;
  try {
    response = await requestJson(fetchImpl, api.rmBase + "/api/resource/list.json", writeOptions(api, {
      filters: [{ operator: "=", property: "type.code", type: "STRING", value: STUDIO_TYPE }],
      mappings: [{ name: "id" }, { name: "code" }],
      offset: 0,
      pageSize: 10,
    }));
  } catch (error) {
    return { reason: "resource-read-refused", row: null, status: error && error.status || null };
  }
  var rows = Array.isArray(response && response.result) ? response.result : [];
  var row = rows[0] && positiveInteger(rows[0].id) ? rows[0] : null;
  return { reason: row ? null : "no-studio-row", row: row, status: null };
}

async function resolveOne(api, fetchImpl, url, filters, mappings, errorCode) {
  var response = await requestJson(fetchImpl, url, writeOptions(api, { filters: filters, mappings: mappings, offset: 0, pageSize: 1 }));
  var row = (Array.isArray(response && response.result) ? response.result : [])[0];
  if (!row || !positiveInteger(row.id)) throw contractError(errorCode, errorCode.replace(/-/g, " "));
  if (mappings === TYPE_WITH_WORKFLOW_MAPPINGS && !(row.workflow && positiveInteger(row.workflow.id))) {
    throw contractError(errorCode, FULFILLMENT_TYPE + " has no workflow");
  }
  return row;
}

function writeContext(context, explicitOrigin) {
  var config = context && context.config || {};
  var state = context && context.state || {};
  var session = context && context.session || state.session || {};
  var accessToken = text(session.accessToken || session.access_token);
  if (!accessToken) throw contractError("session-required", "A Core access token is required");
  var organization = text(config.organization);
  if (!organization) throw contractError("organization-required", "Verified portal organization is required");
  var origin = explicitOrigin || config.origin || browserOrigin();
  return {
    authorization: text(session.tokenType || session.token_type || "Bearer") + " " + accessToken,
    billBase: sameOriginBase(config.billApiBase || "/core-bill", origin, "Core Bill API base"),
    coreBase: sameOriginBase(config.coreApiBase || "/core", origin, "Core API base"),
    organization: organization,
    rmBase: sameOriginBase(config.resourceApiBase || "/core-rm", origin, "Core Resource API base"),
  };
}

function writeOptions(api, body) {
  return {
    body: JSON.stringify(body),
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      Authorization: api.authorization,
      "Content-Type": "application/json",
      "X-Organization-Code": api.organization,
    },
    method: "POST",
  };
}

export async function loadCoreOrders(context, fetchImpl = globalThis.fetch, explicitOrigin) {
  var config = context && context.config || {};
  var state = context && context.state || {};
  var session = context && context.session || state.session || {};
  var customer = context && context.account || state.customerAccount || state.session && state.session.account || {};
  var accountId = positiveInteger(customer.id);
  if (!accountId) throw contractError("customer-account-required", "Resolved customer Account is required before Orders load");
  var accessToken = text(session.accessToken || session.access_token);
  if (!accessToken) throw contractError("session-required", "A Core access token is required");
  var organization = text(config.organization);
  if (!organization) throw contractError("organization-required", "Verified portal organization is required");

  var origin = explicitOrigin || config.origin || browserOrigin();
  var billBase = sameOriginBase(config.billApiBase || "/core-bill", origin, "Core Bill API base");
  var authorization = text(session.tokenType || session.token_type || "Bearer") + " " + accessToken;
  var request = {
    filters: [{ type: "INTEGER", operator: "=", property: "account.id", value: String(accountId) }],
    mappings: ORDER_MAPPINGS,
    offset: 0,
    pageSize: positiveInteger(config.ordersPageSize) || 50,
    sorting: [{ field: "id", direction: "DESC" }],
  };
  var response = await requestJson(fetchImpl, billBase + "/api/order/list.json", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Organization-Code": organization,
    },
    body: JSON.stringify(request),
  });
  var rows = Array.isArray(response && response.result) ? response.result : [];
  var headers = {
    Accept: "application/json",
    Authorization: authorization,
    "Content-Type": "application/json",
    "X-Organization-Code": organization,
  };
  var context2 = { billBase: billBase, fetchImpl: fetchImpl, headers: headers };
  var orderIds = rows.map(function (row) { return positiveInteger(row && row.id); }).filter(Boolean);
  var joined = await Promise.all([linesByOrder(context2, orderIds), fulfillmentByOrder(context2, orderIds)]);
  // A purchase is what an Order delivered, and that comes from its lines. Orders
  // with none — pre-Purchases seed rows and demo checkout artifacts — are not
  // customer purchases. They are excluded rather than shown with an empty kind,
  // and the count is reported so the drop stays visible instead of silent.
  // Scope is validated for every returned row first: a foreign Order must fail
  // the load whether or not it happens to carry lines.
  rows.forEach(function (row) { assertOwnedBy(row, accountId); });
  var withoutLines = 0;
  var items = rows
    .filter(function (row) {
      var hasLines = (joined[0][String(row.id)] || []).length > 0;
      if (!hasLines) withoutLines += 1;
      return hasLines;
    })
    .map(function (row) {
      return normalizeOrder(row, accountId, joined[0][String(row.id)], joined[1][String(row.id)] || null);
    });
  var byRef = {};
  items.forEach(function (item) { byRef[item.ref] = item; });
  return {
    state: items.length ? "ready" : "empty",
    accountId: accountId,
    resultSize: items.length,
    ordersWithoutLines: withoutLines,
    accountResultSize: Number.isFinite(Number(response && response.resultSize)) ? Number(response.resultSize) : rows.length,
    items: items,
    byRef: byRef,
  };
}

async function postList(context, path, body) {
  return requestJson(context.fetchImpl, context.billBase + path, {
    method: "POST",
    credentials: "same-origin",
    headers: context.headers,
    body: JSON.stringify(body),
  });
}

async function linesByOrder(context, orderIds) {
  if (!orderIds.length) return {};
  var response = await postList(context, "/api/order-item/list.json", {
    filters: [],
    mappings: ORDER_ITEM_MAPPINGS,
    offset: 0,
    pageSize: 500,
    sorting: [{ field: "sortOrder", direction: "ASC" }],
  });
  var rows = Array.isArray(response && response.result) ? response.result : [];
  var grouped = {};
  rows.forEach(function (row) {
    var id = positiveInteger(row.order && row.order.id);
    if (orderIds.indexOf(id) < 0) return;
    (grouped[String(id)] = grouped[String(id)] || []).push(row);
  });
  return grouped;
}

// Shipment has no native order link, so the order reference lives in a dynamic
// attribute — which Core cannot filter on. The join happens here.
async function fulfillmentByOrder(context, orderIds) {
  if (!orderIds.length) return {};
  var response = await postList(context, "/api/shipment/list.json", {
    filters: [{ type: "STRING", operator: "=", property: "type.code", value: FULFILLMENT_TYPE }],
    mappings: SHIPMENT_MAPPINGS,
    offset: 0,
    pageSize: 200,
  });
  var rows = Array.isArray(response && response.result) ? response.result : [];
  var byOrder = {};
  rows.forEach(function (row) {
    var id = attributeNumber(row, "SOURCE_ORDER");
    if (!id || orderIds.indexOf(id) < 0) return;
    byOrder[String(id)] = {
      kind: attributeText(row, "FULFILLMENT_KIND"),
      location: attributeNumber(row, "PICKUP_LOCATION"),
      status: attributeText(row, "FULFILLMENT_STATUS"),
      windowEnd: attributeNumber(row, "WINDOW_END"),
      windowStart: attributeNumber(row, "WINDOW_START"),
    };
  });
  return byOrder;
}

function attributeEntry(row, code) {
  var typeId = row && row.type && row.type.id;
  var group = row && row.attributes && typeId != null ? row.attributes[String(typeId)] : null;
  return group && group[code] ? group[code] : null;
}

function attributeNumber(row, code) {
  var entry = attributeEntry(row, code);
  return entry && entry.value != null ? positiveInteger(entry.value) : null;
}

function attributeText(row, code) {
  var entry = attributeEntry(row, code);
  return entry && entry.value != null ? text(entry.value) : "";
}

function purchaseKind(lines) {
  var kinds = [];
  lines.forEach(function (line) {
    var kind = ITEM_KINDS[text(line.type && line.type.code)];
    if (kind && kinds.indexOf(kind) < 0) kinds.push(kind);
  });
  if (!kinds.length) return null;
  return kinds.length === 1 ? kinds[0] : "MIXED";
}

function lineTitle(line) {
  var product = line.itemPrice && line.itemPrice.product;
  return localizedName(product && product.nls) || text(product && product.code) || text(line.notes) || "Item";
}

/**
 * `OrderItem.amount` is the UNIT price — Core multiplies it by `itemCount` for
 * the order total. Core exposes no per-line total, and the browser does not
 * compute commercial figures, so the line total is omitted rather than derived.
 * The order-level total comes from the server's own `grandTotal`.
 */
function normalizeLine(line, currencyCode) {
  var id = positiveInteger(line && line.id);
  var count = positiveInteger(line.itemCount) || 1;
  var unit = finiteNumber(line.amount);
  return {
    ref: "pln-core-" + id,
    kind: ITEM_KINDS[text(line.type && line.type.code)] || null,
    title: lineTitle(line),
    variant: null,
    quantity: count,
    displayUnitPrice: unit != null ? formatMoney(unit, currencyCode) : null,
    displayTotal: null,
  };
}

function itemSummary(lines) {
  if (!lines.length) return null;
  return lines
    .map(function (line) { return line.quantity > 1 ? line.quantity + " × " + line.title : line.title; })
    .join(" · ");
}

function normalizeFulfillment(raw) {
  if (!raw || !raw.kind) return null;
  return {
    kind: raw.kind,
    status: raw.status || null,
    // An absent window stays absent; formatDate would render the epoch.
    windowEndLabel: raw.windowEnd ? formatDate(raw.windowEnd) : null,
    windowStartLabel: raw.windowStart ? formatDate(raw.windowStart) : null,
  };
}

function assertOwnedBy(row, accountId) {
  var rowAccountId = row && row.account && positiveInteger(row.account.id);
  if (rowAccountId !== accountId) throw contractError("order-scope-mismatch", "Core Order does not belong to the resolved customer Account");
}

function normalizeOrder(row, accountId, rawLines, rawFulfillment) {
  assertOwnedBy(row, accountId);
  var id = positiveInteger(row && row.id);
  if (!id) throw contractError("invalid-order", "Core Order response did not include an id");
  var states = Array.isArray(row.states) ? row.states.map(function (state) {
    return { id: positiveInteger(state && state.id), code: text(state && state.code), label: localizedName(state && state.nls) };
  }) : [];
  var stateCode = states.map(function (state) { return state.code; }).filter(Boolean)[0] || "";
  var status = ORDER_STATUS[stateCode];
  if (!status)
    throw contractError(
      "order-status-unmapped",
      "Workflow state " + (stateCode || "(none)") + " has no approved customer status for a purchase",
    );
  var currencyCode = text(row.currency && row.currency.code) || "USD";
  var lines = rawLines.map(function (line) { return normalizeLine(line, currencyCode); });
  var kind = purchaseKind(rawLines);
  var fulfillment = normalizeFulfillment(rawFulfillment);
  var attention = null;
  // Pickup readiness is a separate dimension; when it is ready it is also what
  // the customer needs to act on, so it surfaces as the status and the notice.
  if (fulfillment && fulfillment.status === "READY" && status !== "Cancelled") {
    status = "Ready for pickup";
    attention = "Ready — please pick up" + (fulfillment.windowEndLabel ? " by " + fulfillment.windowEndLabel : "");
  }
  return {
    ref: "order-core-" + id,
    reference: "order-core-" + id,
    id: id,
    optimistic: Number.isFinite(Number(row.optimistic)) ? Number(row.optimistic) : null,
    notes: text(row.notes),
    grandTotal: finiteNumber(row.grandTotal),
    totalCharges: finiteNumber(row.totalCharges),
    totalTaxes: finiteNumber(row.totalTaxes),
    currency: { code: text(row.currency && row.currency.code), label: localizedName(row.currency && row.currency.nls) },
    type: { code: text(row.type && row.type.code), label: localizedName(row.type && row.type.nls) },
    states: states,
    statusCode: stateCode,
    customerStatus: status,
    kind: kind,
    placedAt: formatDate(row.created),
    itemSummary: itemSummary(lines) || null,
    displayTotal: formatMoney(row.grandTotal, currencyCode),
    displayCurrency: currencyCode,
    attention: attention,
    allowedActions: [],
    lines: lines,
    money: {
      subtotal: formatMoney(row.totalCharges, currencyCode),
      tax: formatMoney(row.totalTaxes, currencyCode),
      total: formatMoney(row.grandTotal, currencyCode),
      currency: currencyCode,
    },
    paymentMode: "SIMULATED",
    fulfillment: fulfillment,
    relatedAppointments: [],
    relatedPlan: null,
  };
}

async function requestJson(fetchImpl, url, options) {
  var response = await fetchImpl(url, options);
  if (!response || typeof response.ok !== "boolean") throw contractError("invalid-response", "Core Bill returned an invalid response");
  if (!response.ok) {
    var code = response.status === 401 ? "session-expired" : response.status === 403 ? "orders-forbidden" : "orders-request-failed";
    var error = contractError(code, "Core Orders request failed with HTTP " + response.status);
    error.status = response.status;
    throw error;
  }
  try { return await response.json(); }
  catch (_) { throw contractError("invalid-response", "Core Orders response was not valid JSON"); }
}

function sameOriginBase(value, origin, label) {
  if (!origin) throw contractError("origin-required", label + " requires a browser origin");
  var target = new URL(String(value || ""), origin);
  if (target.origin !== new URL(origin).origin) throw contractError("cross-origin-service", label + " must be same-origin");
  return target.href.replace(/\/+$/, "");
}

function browserOrigin() { return globalThis.location && globalThis.location.origin || ""; }
function positiveInteger(value) { var number = Number(value); return Number.isInteger(number) && number > 0 ? number : null; }
function finiteNumber(value) { var number = Number(value); return Number.isFinite(number) ? number : null; }
function formatDate(value) { var date = new Date(value); return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date) : "Date not returned"; }
function formatMoney(value, currency) { var number = Number(value); return Number.isFinite(number) ? new Intl.NumberFormat("en-US", { style: "currency", currency: currency }).format(number) : ""; }
function localizedName(value) { if (!value || typeof value !== "object") return ""; var localized = value.en || value["en-US"] || Object.values(value)[0] || {}; return text(localized && (localized.NAME || localized.name)); }
function text(value) { return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim(); }
function contractError(code, message) { var error = new Error(message); error.code = code; return error; }

export const coreOrdersContract = Object.freeze({
  filters: ["account.id"],
  itemKinds: ITEM_KINDS,
  itemMappings: ORDER_ITEM_MAPPINGS,
  mappings: ORDER_MAPPINGS,
  orderStatus: ORDER_STATUS,
  shipmentMappings: SHIPMENT_MAPPINGS,
});
