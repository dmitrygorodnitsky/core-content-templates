// Live /plans read model for the Calm Harbor staging portal.
//
// Plans are hybrid by product decision: a membership is a core-bill
// Subscription bound to the customer Account and its source Order, a package is
// a customer-scoped SPA_PLAN_ENROLLMENT project carrying a finite visit
// balance. Both are returned through one normalized list; the split is backend
// truth, not a UI concept.
//
// Scope note: SPA_PLAN_ENROLLMENT carries its customer link in a dynamic
// attribute, which Core cannot filter on, so enrollments are narrowed in this
// adapter. That narrowing is presentation. Core still returns the tenant's rows
// to any portal session and this filter is not an authorization boundary.

const ENROLLMENT_TYPE = "SPA_PLAN_ENROLLMENT";
const MEMBERSHIP_ITEM_TYPE = "SPA_ITEM_MEMBERSHIP";
const PLAN_REF_PREFIX = "plan-core-";
// Matches the ref the Orders adapter emits, so sourcePurchase resolves.
const PURCHASE_REF_PREFIX = "order-core-";

const REF_MAPPINGS = [{ name: "id" }, { name: "code" }, { name: "nls" }];

const ENROLLMENT_MAPPINGS = [
  { name: "attributes" },
  { name: "code" },
  { name: "id" },
  { name: "nls" },
  { name: "optimistic" },
  { key: "id", mappings: REF_MAPPINGS, name: "type", type: "identifier" },
  { mappings: REF_MAPPINGS, name: "states", type: "collection" },
];

const SUBSCRIPTION_MAPPINGS = [
  { name: "autoRenew" },
  { name: "expiresOn" },
  { name: "id" },
  { name: "nextBillingAt" },
  { name: "optimistic" },
  { name: "period" },
  { name: "startsOn" },
  { key: "id", mappings: REF_MAPPINGS, name: "account", type: "identifier" },
  { key: "id", mappings: REF_MAPPINGS, name: "order", type: "identifier" },
  { mappings: REF_MAPPINGS, name: "states", type: "collection" },
];

const ORDER_ITEM_MAPPINGS = [
  { name: "amount" },
  { name: "attributes" },
  { name: "id" },
  { name: "itemCount" },
  { name: "notes" },
  {
    key: "id",
    // The membership's display name lives on the Product behind the price.
    mappings: REF_MAPPINGS.concat([
      { name: "attributes" },
      { key: "id", mappings: REF_MAPPINGS, name: "product", type: "identifier" },
    ]),
    name: "itemPrice",
    type: "identifier",
  },
  { key: "id", mappings: REF_MAPPINGS, name: "order", type: "identifier" },
  { key: "id", mappings: REF_MAPPINGS, name: "type", type: "identifier" },
];

/* Backend workflow state -> approved customer vocabulary. The mapping lives
   here, in one place, so components never read raw workflow states. Any state
   outside this table is a contract gap, not something to label by guesswork. */
const ENROLLMENT_STATUS = { ACTIVE: "Active", CANCELLED: "Cancelled", EXHAUSTED: "Used up" };
const SUBSCRIPTION_STATUS = { ACTIVE: "Active", CANCELLED: "Cancelled" };

export const corePlansContract = {
  enrollmentMappings: ENROLLMENT_MAPPINGS,
  enrollmentStatus: ENROLLMENT_STATUS,
  subscriptionMappings: SUBSCRIPTION_MAPPINGS,
  subscriptionStatus: SUBSCRIPTION_STATUS,
};

export function createCorePlansAdapter(options = {}) {
  var fetchImpl = options.fetch || globalThis.fetch;
  if (typeof fetchImpl !== "function") throw contractError("fetch-unavailable", "Core plans adapter requires fetch");
  return {
    load(moduleId, context) {
      if (moduleId !== "plan") throw contractError("unsupported-module", "Core plans adapter cannot load " + moduleId);
      return loadCorePlans(context, fetchImpl, options.origin);
    },
  };
}

export async function loadCorePlans(context, fetchImpl = globalThis.fetch, explicitOrigin) {
  var api = planContext(context, explicitOrigin);
  var accountId = positiveInteger(api.customer && api.customer.id);
  if (!accountId) return { items: [], byRef: {}, scopeMode: "customer-filtered-client-side", state: "empty" };

  var results = await Promise.all([
    loadEnrollments(api, accountId, fetchImpl),
    loadMemberships(api, accountId, fetchImpl),
  ]);
  var items = results[0].concat(results[1]);

  var byRef = {};
  items.forEach(function (item) { byRef[item.ref] = item; });
  return {
    byRef: byRef,
    items: items,
    scopeMode: "customer-filtered-client-side",
    state: items.length ? "ready" : "empty",
  };
}

async function loadEnrollments(api, accountId, fetchImpl) {
  var response = await requestJson(fetchImpl, api.serviceBase + "/api/project/list.json", requestOptions(api, {
    filters: [{ type: "STRING", operator: "=", property: "type.code", value: ENROLLMENT_TYPE }],
    mappings: ENROLLMENT_MAPPINGS,
    offset: 0,
    pageSize: positiveInteger(api.config.plansPageSize) || 100,
  }));
  var rows = Array.isArray(response && response.result) ? response.result : [];
  return rows
    .filter(function (row) { return attributeNumber(row, "CUSTOMER_ACCOUNT") === accountId; })
    .map(normalizeEnrollment);
}

function normalizeEnrollment(row) {
  var id = positiveInteger(row && row.id);
  if (!id) throw contractError("invalid-plan", "Core plan enrollment response did not include an id");
  var state = firstState(row);
  var status = ENROLLMENT_STATUS[state];
  if (!status)
    throw contractError(
      "plan-status-unmapped",
      "Workflow state " + (state || "(none)") + " has no approved customer status for a package plan",
    );
  var total = attributeNumber(row, "CREDITS_TOTAL");
  var used = attributeNumber(row, "CREDITS_USED");
  var remaining = total != null && used != null ? Math.max(total - used, 0) : null;
  var sourceOrder = attributeNumber(row, "SOURCE_ORDER");
  return {
    allowedActions: status === "Active" && remaining > 0 ? ["bookWithCredit"] : [],
    backendId: id,
    expiresAt: formatDate(attributeText(row, "VALID_UNTIL")),
    kind: "PACKAGE",
    optimistic: finiteNumber(row.optimistic, null),
    ref: PLAN_REF_PREFIX + id,
    remainingUses: remaining,
    sourcePurchase: sourceOrder ? PURCHASE_REF_PREFIX + sourceOrder : null,
    status: status,
    title: localizedName(row.nls) || text(row.code) || "Package",
    totalUses: total,
  };
}

async function loadMemberships(api, accountId, fetchImpl) {
  var response = await requestJson(fetchImpl, api.billBase + "/api/subscription/list.json", requestOptions(api, {
    filters: [{ type: "INTEGER", operator: "=", property: "account.id", value: String(accountId) }],
    mappings: SUBSCRIPTION_MAPPINGS,
    offset: 0,
    pageSize: positiveInteger(api.config.plansPageSize) || 100,
  }));
  var rows = Array.isArray(response && response.result) ? response.result : [];
  if (!rows.length) return [];

  // Subscription carries no title or price of its own; both come from the
  // membership line of its source Order.
  var lines = await membershipLines(api, rows, fetchImpl);
  var lineRows = Object.values(lines);
  var resolved = await Promise.all([
    codesById(api, api.coreBase, "dictionary", uniqueIds(lineRows, currencyId), fetchImpl),
    codesById(api, api.coreBase, "unit", uniqueIds(lineRows, intervalUnitId), fetchImpl),
  ]);
  return rows.map(function (row) {
    var line = lines[String(orderId(row))] || null;
    return normalizeMembership(row, line, {
      currency: resolved[0][String(currencyId(line))] || "",
      intervalUnit: resolved[1][String(intervalUnitId(line))] || "",
    });
  });
}

/* On a SYSTEM price type both CURRENCY and the INTERVAL unit are entity
   references, so their codes are resolved from Core rather than assumed. */
function priceAttributeEntry(line, code) {
  var groups = line && line.itemPrice && line.itemPrice.attributes
    ? Object.values(line.itemPrice.attributes) : [];
  for (var index = 0; index < groups.length; index += 1) {
    var entry = groups[index] && groups[index][code];
    if (entry && entry.value != null) return entry;
  }
  return null;
}

function currencyId(line) {
  var entry = priceAttributeEntry(line, "CURRENCY");
  return entry ? positiveInteger(entry.value) : 0;
}

function intervalUnitId(line) {
  var entry = priceAttributeEntry(line, "INTERVAL");
  return entry ? positiveInteger(entry.unit) : 0;
}

async function codesById(api, base, endpoint, ids, fetchImpl) {
  if (!ids.length) return {};
  var response = await requestJson(fetchImpl, base + "/api/" + endpoint + "/list.json", requestOptions(api, {
    filters: ids.map(function (id) { return { type: "INTEGER", operator: "=", property: "id", value: String(id) }; }),
    mappings: [{ name: "id" }, { name: "code" }],
    offset: 0,
    pageSize: 50,
  }));
  var byId = {};
  (Array.isArray(response && response.result) ? response.result : []).forEach(function (row) {
    byId[String(row.id)] = text(row.code);
  });
  return byId;
}

function uniqueIds(lines, pick) {
  var ids = [];
  lines.forEach(function (line) {
    var id = pick(line);
    if (id && ids.indexOf(id) < 0) ids.push(id);
  });
  return ids;
}

async function membershipLines(api, subscriptions, fetchImpl) {
  var orderIds = subscriptions.map(orderId).filter(Boolean);
  if (!orderIds.length) return {};
  var response = await requestJson(fetchImpl, api.billBase + "/api/order-item/list.json", requestOptions(api, {
    filters: [{ type: "STRING", operator: "=", property: "type.code", value: MEMBERSHIP_ITEM_TYPE }],
    mappings: ORDER_ITEM_MAPPINGS,
    offset: 0,
    pageSize: 200,
  }));
  var rows = Array.isArray(response && response.result) ? response.result : [];
  var byOrder = {};
  rows.forEach(function (row) {
    var key = String(row.order && row.order.id);
    if (orderIds.indexOf(positiveInteger(row.order && row.order.id)) >= 0 && !byOrder[key]) byOrder[key] = row;
  });
  return byOrder;
}

/* The recurring rate is the catalog ProductPrice behind the membership line —
   the order line records a single charge, not the ongoing rate.
   Under the SYSTEM price types the amount is `UNIT_PRICE`, a decimal already in
   major units, the interval lives on the RECURRENT group with its own unit, and
   `CURRENCY` is a Dictionary reference whose code the caller resolves. Nothing
   is computed and no currency symbol is assumed. */
function recurringPrice(line, labels) {
  var unitPrice = priceAttributeEntry(line, "UNIT_PRICE");
  if (!unitPrice || !labels.currency) return null;
  var interval = priceAttributeEntry(line, "INTERVAL");
  var period = interval ? Number(interval.value) : 0;
  var suffix = period && labels.intervalUnit
    ? " / " + (period === 1 ? "" : period + " ") + labels.intervalUnit.toLowerCase()
    : "";
  return formatMoney(Number(unitPrice.value), labels.currency) + suffix;
}

function normalizeMembership(row, line, labels) {
  var id = positiveInteger(row && row.id);
  if (!id) throw contractError("invalid-plan", "Core subscription response did not include an id");
  var state = firstState(row);
  var status = SUBSCRIPTION_STATUS[state];
  if (!status)
    throw contractError(
      "plan-status-unmapped",
      "Workflow state " + (state || "(none)") + " has no approved customer status for a membership plan",
    );
  var source = orderId(row);
  return {
    allowedActions: status === "Active" && row.autoRenew ? ["cancelRenewal"] : [],
    backendId: id,
    displayRecurringPrice: recurringPrice(line, labels),
    expiresAt: formatDate(row.expiresOn),
    kind: "MEMBERSHIP",
    optimistic: finiteNumber(row.optimistic, null),
    ref: PLAN_REF_PREFIX + "sub-" + id,
    remainingUses: null,
    renewsAt: formatDate(row.nextBillingAt || null),
    sourcePurchase: source ? PURCHASE_REF_PREFIX + source : null,
    status: status,
    title: membershipTitle(line),
    totalUses: null,
  };
}

function planContext(context, explicitOrigin) {
  var config = (context && context.config) || {};
  var state = (context && context.state) || {};
  var session = (context && context.session) || state.session || {};
  var accessToken = text(session.accessToken || session.access_token);
  if (!accessToken) throw contractError("session-required", "A Core access token is required");
  var organization = text(config.organization);
  if (!organization) throw contractError("organization-required", "Verified portal organization is required");
  var origin = explicitOrigin || config.origin || browserOrigin();
  return {
    authorization: text(session.tokenType || session.token_type || "Bearer") + " " + accessToken,
    billBase: sameOriginBase(config.billApiBase || "/core-bill", origin, "Core Bill API base"),
    coreBase: sameOriginBase(config.coreApiBase || "/core", origin, "Core API base"),
    config: config,
    customer: (context && context.account) || state.customerAccount || session.account || {},
    organization: organization,
    serviceBase: sameOriginBase(config.serviceApiBase || "/core-svc", origin, "Core Service API base"),
  };
}

function requestOptions(api, body) {
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

async function requestJson(fetchImpl, url, options) {
  var response = await fetchImpl(url, options);
  if (response.status === 401) throw contractError("session-expired", "Core rejected the portal session");
  if (response.status === 403) throw contractError("customer-forbidden", "Core refused the plan read for this customer");
  if (!response.ok) throw contractError("plans-unavailable", "Core plan read failed with HTTP " + response.status);
  return response.json();
}

function attributeGroup(row) {
  var typeId = row && row.type && row.type.id;
  if (typeId == null || !row.attributes) return null;
  return row.attributes[String(typeId)] || null;
}

function attributeNumber(row, code) {
  var group = attributeGroup(row);
  var entry = group && group[code];
  return entry && entry.value != null ? Number(entry.value) : null;
}

function attributeText(row, code) {
  var group = attributeGroup(row);
  var entry = group && group[code];
  return entry && entry.value != null ? String(entry.value) : "";
}

function firstState(row) {
  var states = Array.isArray(row && row.states) ? row.states : [];
  for (var index = 0; index < states.length; index += 1) {
    var code = text(states[index] && states[index].code);
    if (code) return code;
  }
  return "";
}

function orderId(row) {
  return positiveInteger(row && row.order && row.order.id);
}

function membershipTitle(line) {
  if (!line) return "Membership";
  var product = line.itemPrice && line.itemPrice.product;
  return localizedName(product && product.nls) || localizedName(line.itemPrice && line.itemPrice.nls) || "Membership";
}

function formatMoney(amount, currency) {
  return new Intl.NumberFormat("en-US", { currency: currency, style: "currency" })
    .format(Number(amount))
    .replace(/\.00$/, "");
}

/* Core returns LocalDate as [y, m, d]; normalize both that and ISO strings. */
function formatDate(value) {
  if (!value) return null;
  var date = Array.isArray(value) ? new Date(Date.UTC(value[0], (value[1] || 1) - 1, value[2] || 1)) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-US", { day: "numeric", month: "short", timeZone: "UTC", year: "numeric" });
}

function localizedName(nls) {
  if (!nls || typeof nls !== "object") return "";
  var locales = Object.keys(nls);
  for (var index = 0; index < locales.length; index += 1) {
    var entry = nls[locales[index]];
    var name = entry && text(entry.NAME);
    if (name) return name;
  }
  return "";
}

function sameOriginBase(base, origin, label) {
  var value = text(base);
  if (!value) throw contractError("api-base-required", label + " is required");
  if (/^https?:\/\//i.test(value)) {
    if (value.indexOf(origin) !== 0) throw contractError("cross-origin-base", label + " must stay same-origin");
    return value.replace(/\/$/, "");
  }
  return (origin || "").replace(/\/$/, "") + (value.charAt(0) === "/" ? value : "/" + value).replace(/\/$/, "");
}

function browserOrigin() {
  return typeof window !== "undefined" && window.location ? window.location.origin : "";
}

function positiveInteger(value) {
  var number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : 0;
}

function finiteNumber(value, fallback) {
  var number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function text(value) {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value);
}

function contractError(code, message) {
  var error = new Error(message);
  error.code = code;
  return error;
}
