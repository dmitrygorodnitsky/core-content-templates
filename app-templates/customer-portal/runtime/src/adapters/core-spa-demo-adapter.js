// Staging-only live adapter for the Calm Harbor demo.
//
// This adapter deliberately uses the generic tenant APIs that exist today. The
// Appointment list is therefore tenant-scoped, not customer-scoped. That is an
// explicit demo residual until the backend exposes the customer-portal scope
// endpoints; it must not be presented as a production authorization boundary.

const REF_PREFIX = "appt-core-";
const DEMO_CODE_PREFIX = "CP_DEMO_";
const APPOINTMENT_TYPE = "SPA_VISIT";

const REF_MAPPINGS = [{ name: "id" }, { name: "code" }, { name: "nls" }];
const APPOINTMENT_MAPPINGS = [
  { name: "attributes" },
  { name: "code" },
  { name: "end" },
  { name: "id" },
  { name: "nls" },
  { name: "optimistic" },
  { name: "start" },
  { key: "id", name: "organization", type: "identifier" },
  { key: "id", mappings: REF_MAPPINGS, name: "task", type: "identifier" },
  { key: "id", mappings: REF_MAPPINGS, name: "type", type: "identifier" },
  { key: "id", mappings: REF_MAPPINGS, name: "workflow", type: "identifier" },
  { mappings: REF_MAPPINGS, name: "states", type: "collection" },
];

const ORDER_MAPPINGS = [
  { name: "attributes" },
  { name: "grandTotal" },
  { name: "id" },
  { name: "notes" },
  { name: "optimistic" },
  { name: "totalCharges" },
  { name: "totalTaxes" },
  { key: "id", mappings: REF_MAPPINGS, name: "account", type: "identifier" },
  { key: "id", mappings: REF_MAPPINGS, name: "currency", type: "identifier" },
  { key: "id", name: "organization", type: "identifier" },
  { mappings: REF_MAPPINGS, name: "states", type: "collection" },
  { key: "id", mappings: REF_MAPPINGS, name: "type", type: "identifier" },
  { key: "id", mappings: REF_MAPPINGS, name: "workflow", type: "identifier" },
];

const flights = new Map();

export function createCoreSpaDemoAdapter(options = {}) {
  var fetchImpl = options.fetch || globalThis.fetch;
  if (typeof fetchImpl !== "function") throw contractError("fetch-unavailable", "Core SPA demo adapter requires fetch");
  return {
    async load(moduleId, context) {
      if (moduleId !== "appointments") throw contractError("unsupported-module", "Core SPA demo adapter cannot load " + moduleId);
      return loadCoreAppointments(context, fetchImpl, options.origin);
    },
    createAppointment(input, context) {
      return createCoreAppointment(input, context, fetchImpl, options.origin);
    },
    rescheduleAppointment(ref, input, context) {
      return rescheduleCoreAppointment(ref, input, context, fetchImpl, options.origin);
    },
    createOrder(input, context) {
      return createCoreOrder(input, context, fetchImpl, options.origin);
    },
  };
}

export async function loadCoreAppointments(context, fetchImpl = globalThis.fetch, explicitOrigin) {
  var api = requestContext(context, explicitOrigin);
  var response = await requestJson(fetchImpl, api.serviceBase + "/api/appointment/list.json", requestOptions(api, {
    filters: [{ type: "STRING", operator: "=", property: "type.code", value: APPOINTMENT_TYPE }],
    mappings: APPOINTMENT_MAPPINGS,
    offset: 0,
    pageSize: positiveInteger(api.config.appointmentsPageSize) || 100,
    sorting: [{ field: "start", direction: "ASC" }],
  }));
  var rows = Array.isArray(response && response.result) ? response.result : [];
  var items = rows.map(normalizeAppointment);
  var now = Number.isFinite(Number(api.config.now)) ? Number(api.config.now) : Date.now();
  var upcoming = items.filter(function (item) { return item.startEpoch >= now && item.customerStatus !== "Cancelled"; });
  var past = items.filter(function (item) { return item.startEpoch < now || item.customerStatus === "Completed" || item.customerStatus === "Cancelled"; }).reverse();
  var byRef = {};
  items.forEach(function (item) { byRef[item.ref] = item; });
  return {
    state: items.length ? "ready" : "empty",
    scopeMode: "tenant-demo-unscoped",
    resultSize: Number.isFinite(Number(response && response.resultSize)) ? Number(response.resultSize) : items.length,
    items: items,
    next: upcoming[0] || null,
    upcoming: upcoming.slice(1),
    past: past,
    byRef: byRef,
  };
}

export function createCoreAppointment(input, context, fetchImpl = globalThis.fetch, explicitOrigin) {
  var key = "appointment:create:" + idempotencyPart(input && input.requestRef || input && input.slotRef || "booking");
  return singleFlight(key, async function () {
    var api = requestContext(context, explicitOrigin);
    var code = DEMO_CODE_PREFIX + "APPT_" + idempotencyPart(input && input.requestRef || input && input.slotRef || Date.now());
    var existing = await listOne(fetchImpl, api.serviceBase + "/api/appointment/list.json", api, [
      { type: "STRING", operator: "=", property: "code", value: code },
    ], APPOINTMENT_MAPPINGS);
    if (existing) return normalizeAppointment(existing);

    var template = await appointmentTemplate(fetchImpl, api);
    var start = validIso(input && input.start);
    var durationMinutes = positiveInteger(input && input.durationMinutes) || 60;
    var end = new Date(Date.parse(start) + durationMinutes * 60000).toISOString();
    var serviceName = text(input && input.serviceName) || "Spa appointment";
    var entity = {
      code: code,
      end: end,
      nls: { en: { NAME: serviceName } },
      organization: requiredRef(template.organization, "Appointment organization"),
      start: start,
      task: optionalRef(template.task),
      type: requiredRef(template.type, "Appointment type"),
      workflow: requiredRef(template.workflow, "Appointment workflow"),
    };
    if (!entity.task) delete entity.task;
    var savedIds = await requestJson(fetchImpl, api.serviceBase + "/api/appointment/save.json", requestOptions(api, {
      entities: [entity], mappings: APPOINTMENT_MAPPINGS,
    }));
    var id = positiveInteger(Array.isArray(savedIds) && savedIds[0]);
    if (!id) throw contractError("invalid-save-response", "Core Appointment save did not return an id");
    return normalizeAppointment(await getEntity(fetchImpl, api.serviceBase + "/api/appointment/get.json?id=" + id, api, APPOINTMENT_MAPPINGS));
  });
}

export function rescheduleCoreAppointment(ref, input, context, fetchImpl = globalThis.fetch, explicitOrigin) {
  var id = appointmentId(ref);
  return singleFlight("appointment:reschedule:" + id, async function () {
    var api = requestContext(context, explicitOrigin);
    var current = await getEntity(fetchImpl, api.serviceBase + "/api/appointment/get.json?id=" + id, api, APPOINTMENT_MAPPINGS);
    if (!current || positiveInteger(current.id) !== id) throw contractError("appointment-not-found", "Core Appointment was not found");
    var start = validIso(input && input.start);
    var currentStart = Date.parse(current.start);
    var currentEnd = Date.parse(current.end);
    var duration = Number.isFinite(currentEnd - currentStart) && currentEnd > currentStart ? currentEnd - currentStart : 60 * 60000;
    var entity = {
      attributes: current.attributes || {},
      code: text(current.code),
      end: new Date(Date.parse(start) + duration).toISOString(),
      id: id,
      nls: current.nls || { en: { NAME: "Spa appointment" } },
      optimistic: finiteNumber(current.optimistic, 0),
      organization: requiredRef(current.organization, "Appointment organization"),
      start: start,
      task: optionalRef(current.task),
      type: requiredRef(current.type, "Appointment type"),
      workflow: requiredRef(current.workflow, "Appointment workflow"),
    };
    if (!entity.task) delete entity.task;
    await requestJson(fetchImpl, api.serviceBase + "/api/appointment/save.json", requestOptions(api, {
      entities: [entity], mappings: APPOINTMENT_MAPPINGS,
    }));
    return normalizeAppointment(await getEntity(fetchImpl, api.serviceBase + "/api/appointment/get.json?id=" + id, api, APPOINTMENT_MAPPINGS));
  });
}

export function createCoreOrder(input, context, fetchImpl = globalThis.fetch, explicitOrigin) {
  var requestRef = idempotencyPart(input && input.requestRef || "checkout");
  return singleFlight("order:create:" + requestRef, async function () {
    var api = requestContext(context, explicitOrigin);
    var accountId = positiveInteger(api.customer.id);
    if (!accountId) throw contractError("customer-account-required", "Resolved customer Account is required before checkout");
    var marker = DEMO_CODE_PREFIX + "ORDER_" + accountId + "_" + requestRef;
    var existing = await listOne(fetchImpl, api.billBase + "/api/order/list.json", api, [
      { type: "INTEGER", operator: "=", property: "account.id", value: String(accountId) },
      { type: "STRING", operator: "=", property: "notes", value: marker },
    ], ORDER_MAPPINGS);
    if (existing) return normalizeOrder(existing, accountId);

    var template = await listOne(fetchImpl, api.billBase + "/api/order/list.json", api, [
      { type: "INTEGER", operator: "=", property: "account.id", value: String(accountId) },
    ], ORDER_MAPPINGS, [{ field: "id", direction: "DESC" }]);
    if (!template) throw contractError("order-template-missing", "A seeded Core Order is required for the current-api checkout demo");
    var total = finiteNumber(input && input.total, 0);
    var entity = {
      account: { id: accountId },
      currency: requiredRef(template.currency, "Order currency"),
      grandTotal: total,
      notes: marker,
      organization: requiredRef(template.organization, "Order organization"),
      totalCharges: total,
      totalTaxes: finiteNumber(input && input.taxes, 0),
      type: requiredRef(template.type, "Order type"),
      workflow: requiredRef(template.workflow, "Order workflow"),
    };
    var savedIds = await requestJson(fetchImpl, api.billBase + "/api/order/save.json", requestOptions(api, {
      entities: [entity], mappings: ORDER_MAPPINGS,
    }));
    var id = positiveInteger(Array.isArray(savedIds) && savedIds[0]);
    if (!id) throw contractError("invalid-save-response", "Core Order save did not return an id");
    var readback = await getEntity(fetchImpl, api.billBase + "/api/order/get.json?id=" + id, api, ORDER_MAPPINGS);
    return normalizeOrder(readback, accountId);
  });
}

function appointmentTemplate(fetchImpl, api) {
  return listOne(fetchImpl, api.serviceBase + "/api/appointment/list.json", api, [
    { type: "STRING", operator: "=", property: "type.code", value: APPOINTMENT_TYPE },
  ], APPOINTMENT_MAPPINGS).then(function (template) {
    if (!template) throw contractError("appointment-template-missing", "A seeded SPA_VISIT is required for the current-api booking demo");
    return template;
  });
}

async function listOne(fetchImpl, url, api, filters, mappings, sorting) {
  var body = { filters: filters, mappings: mappings, offset: 0, pageSize: 1 };
  if (sorting) body.sorting = sorting;
  var response = await requestJson(fetchImpl, url, requestOptions(api, body));
  var rows = Array.isArray(response && response.result) ? response.result : [];
  return rows[0] || null;
}

function getEntity(fetchImpl, url, api, mappings) {
  return requestJson(fetchImpl, url, requestOptions(api, mappings));
}

function requestContext(context, explicitOrigin) {
  var config = context && context.config || {};
  var state = context && context.state || {};
  var session = context && context.session || state.session || {};
  var customer = context && context.account || state.customerAccount || session.account || {};
  var accessToken = text(session.accessToken || session.access_token);
  if (!accessToken) throw contractError("session-required", "A Core access token is required");
  var organization = text(config.organization);
  if (!organization) throw contractError("organization-required", "Verified portal organization is required");
  var origin = explicitOrigin || config.origin || browserOrigin();
  return {
    authorization: text(session.tokenType || session.token_type || "Bearer") + " " + accessToken,
    billBase: sameOriginBase(config.billApiBase || "/core-bill", origin, "Core Bill API base"),
    config: config,
    customer: customer,
    organization: organization,
    serviceBase: sameOriginBase(config.serviceApiBase || "/core-svc", origin, "Core Service API base"),
  };
}

function requestOptions(api, body) {
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
  if (!response.ok) {
    var code = response.status === 401 ? "session-expired"
      : response.status === 403 ? "customer-forbidden"
        : response.status === 409 || response.status === 412 ? "conflict"
          : "core-request-failed";
    var error = contractError(code, "Core request failed with HTTP " + response.status);
    error.status = response.status;
    throw error;
  }
  try { return await response.json(); }
  catch (_) { throw contractError("invalid-response", "Core response was not valid JSON"); }
}

function normalizeAppointment(row) {
  var id = positiveInteger(row && row.id);
  if (!id) throw contractError("invalid-appointment", "Core Appointment response did not include an id");
  var start = validIso(row.start);
  var end = validIso(row.end);
  var states = Array.isArray(row.states) ? row.states.map(function (state) { return text(state && state.code); }).filter(Boolean) : [];
  var status = appointmentStatus(states);
  var allowedActions = [];
  if (status === "Confirmed") allowedActions.push("reschedule");
  if (status === "Completed") allowedActions.push("bookAgain");
  return {
    ref: REF_PREFIX + id,
    id: REF_PREFIX + id,
    backendId: id,
    optimistic: Number.isFinite(Number(row.optimistic)) ? Number(row.optimistic) : null,
    code: text(row.code),
    service: localizedName(row.nls) || text(row.code) || "Spa appointment",
    startIso: start,
    endIso: end,
    startEpoch: Date.parse(start),
    start: formatDateTime(start),
    date: formatDate(start),
    time: formatTime(start),
    specialist: "",
    mode: "salon",
    visitMode: "salon",
    location: "Harbor Front studio",
    price: null,
    displayPrice: null,
    reference: REF_PREFIX + id,
    timezoneNote: "America/Chicago",
    status: status,
    customerStatus: status,
    rawStates: states,
    allowedActions: allowedActions,
  };
}

function normalizeOrder(row, accountId) {
  var rowAccountId = row && row.account && positiveInteger(row.account.id);
  if (rowAccountId !== accountId) throw contractError("order-scope-mismatch", "Core Order does not belong to the resolved customer Account");
  var id = positiveInteger(row && row.id);
  if (!id) throw contractError("invalid-order", "Core Order response did not include an id");
  var states = Array.isArray(row.states) ? row.states.map(function (state) { return text(state && state.code); }).filter(Boolean) : [];
  return {
    ref: "order-core-" + id,
    id: id,
    optimistic: Number.isFinite(Number(row.optimistic)) ? Number(row.optimistic) : null,
    notes: text(row.notes),
    grandTotal: finiteNumber(row.grandTotal, 0),
    totalCharges: finiteNumber(row.totalCharges, 0),
    totalTaxes: finiteNumber(row.totalTaxes, 0),
    currencyCode: text(row.currency && row.currency.code),
    typeCode: text(row.type && row.type.code),
    statusCode: states.join(" · "),
  };
}

function appointmentStatus(states) {
  if (states.includes("COMPLETED")) return "Completed";
  if (states.includes("CANCELLED")) return "Cancelled";
  if (states.includes("IN_PROGRESS")) return "In progress";
  return "Confirmed";
}

function appointmentId(ref) {
  var value = text(ref);
  if (!value.startsWith(REF_PREFIX)) throw contractError("invalid-appointment-ref", "Appointment reference is invalid");
  var id = positiveInteger(value.slice(REF_PREFIX.length));
  if (!id) throw contractError("invalid-appointment-ref", "Appointment reference is invalid");
  return id;
}

function singleFlight(key, operation) {
  if (flights.has(key)) return flights.get(key);
  var promise = Promise.resolve().then(operation).finally(function () { flights.delete(key); });
  flights.set(key, promise);
  return promise;
}

function sameOriginBase(value, origin, label) {
  if (!origin) throw contractError("origin-required", label + " requires a browser origin");
  var target = new URL(String(value || ""), origin);
  if (target.origin !== new URL(origin).origin) throw contractError("cross-origin-service", label + " must be same-origin");
  return target.href.replace(/\/+$/, "");
}

function browserOrigin() { return globalThis.location && globalThis.location.origin || ""; }
function positiveInteger(value) { var number = Number(value); return Number.isInteger(number) && number > 0 ? number : null; }
function finiteNumber(value, fallback) { var number = Number(value); return Number.isFinite(number) ? number : fallback; }
function text(value) { return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim(); }
function localizedName(value) { if (!value || typeof value !== "object") return ""; var localized = value.en || value["en-US"] || Object.values(value)[0] || {}; return text(localized && (localized.NAME || localized.name)); }
function requiredRef(value, label) { var id = value && positiveInteger(value.id); if (!id) throw contractError("template-reference-missing", label + " is missing"); return { id: id }; }
function optionalRef(value) { var id = value && positiveInteger(value.id); return id ? { id: id } : null; }
function validIso(value) { var date = new Date(value); if (!Number.isFinite(date.getTime())) throw contractError("invalid-date", "Appointment date is invalid"); return date.toISOString(); }
function idempotencyPart(value) { var clean = text(value).toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, ""); return (clean || "REQUEST").slice(0, 72); }
function formatDate(value) { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/Chicago" }).format(new Date(value)); }
function formatTime(value) { return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" }).format(new Date(value)); }
function formatDateTime(value) { return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" }).format(new Date(value)); }
function contractError(code, message) { var error = new Error(message); error.code = code; return error; }

export const coreSpaDemoContract = Object.freeze({
  appointmentMappings: APPOINTMENT_MAPPINGS,
  appointmentTypeCode: APPOINTMENT_TYPE,
  orderMappings: ORDER_MAPPINGS,
  scopeMode: "tenant-demo-unscoped",
});
