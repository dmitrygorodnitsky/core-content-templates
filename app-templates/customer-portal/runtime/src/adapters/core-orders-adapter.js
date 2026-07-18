// Read-only Core Bill adapter. Every query is scoped to the Account resolved
// from the current Core User; route ids are never sufficient ownership proof.

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
  var items = rows.map(function (row) { return normalizeOrder(row, accountId); });
  var byRef = {};
  items.forEach(function (item) { byRef[item.ref] = item; });
  return {
    state: items.length ? "ready" : "empty",
    accountId: accountId,
    resultSize: Number.isFinite(Number(response && response.resultSize)) ? Number(response.resultSize) : items.length,
    items: items,
    byRef: byRef,
  };
}

function normalizeOrder(row, accountId) {
  var rowAccountId = row && row.account && positiveInteger(row.account.id);
  if (rowAccountId !== accountId) throw contractError("order-scope-mismatch", "Core Order does not belong to the resolved customer Account");
  var id = positiveInteger(row && row.id);
  if (!id) throw contractError("invalid-order", "Core Order response did not include an id");
  var states = Array.isArray(row.states) ? row.states.map(function (state) {
    return { id: positiveInteger(state && state.id), code: text(state && state.code), label: localizedName(state && state.nls) };
  }) : [];
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
    statusCode: Array.from(new Set(states.map(function (state) { return state.code; }).filter(Boolean))).join(" · "),
    customerStatus: Array.from(new Set(states.map(function (state) { return state.code; }).filter(Boolean))).join(" · ") || "UNMAPPED",
    kind: "MIXED",
    placedAt: formatDate(row.created),
    itemSummary: text(row.notes).startsWith("CP_DEMO_") ? "Demo order recorded through the customer portal" : (localizedName(row.type && row.type.nls) || text(row.type && row.type.code) || "Core order"),
    displayTotal: formatMoney(row.grandTotal, text(row.currency && row.currency.code) || "USD"),
    displayCurrency: text(row.currency && row.currency.code) || "USD",
    attention: null,
    allowedActions: [],
    lines: [],
    money: {
      subtotal: formatMoney(row.totalCharges, text(row.currency && row.currency.code) || "USD"),
      tax: formatMoney(row.totalTaxes, text(row.currency && row.currency.code) || "USD"),
      total: formatMoney(row.grandTotal, text(row.currency && row.currency.code) || "USD"),
      currency: text(row.currency && row.currency.code) || "USD",
    },
    paymentMode: "SIMULATED",
    fulfillment: null,
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

export const coreOrdersContract = Object.freeze({ mappings: ORDER_MAPPINGS, filters: ["account.id"] });
