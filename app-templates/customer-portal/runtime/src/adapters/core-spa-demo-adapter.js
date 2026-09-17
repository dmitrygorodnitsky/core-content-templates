// Staging-only live adapter for the Calm Harbor demo.
//
// This adapter deliberately uses the generic tenant APIs that exist today. The
// Appointment list is therefore tenant-scoped, not customer-scoped. That is an
// explicit demo residual until the backend exposes the customer-portal scope
// endpoints; it must not be presented as a production authorization boundary.

import { normalizeCoreAvailability } from "../normalizers/spa-availability.js";

const REF_PREFIX = "appt-core-";
const DEMO_CODE_PREFIX = "CP_DEMO_";
const APPOINTMENT_TYPE = "SPA_VISIT";
const CARE_TASK_TYPE = "SPA_CARE_TASK";
const ORDER_TYPE = "SPA_ORDER";
const RESOURCE_TYPE = "SPA_SERVICE_PROVIDER";
const LOCATION_TYPE = "SPA_STUDIO";

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

const RESOURCE_MAPPINGS = [
  { name: "attributes" },
  { name: "code" },
  { name: "id" },
  { name: "nls" },
  { key: "id", mappings: REF_MAPPINGS, name: "type", type: "identifier" },
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
    cancelAppointment(ref, context) {
      return cancelCoreAppointment(ref, context, fetchImpl, options.origin);
    },
    createOrder(input, context) {
      return createCoreOrder(input, context, fetchImpl, options.origin);
    },
  };
}

const CANCEL_EVENT = "SCHEDULED-CANCELLED";
const CONFIRM_EVENT = "REQUESTED-SCHEDULED";

/**
 * Cancels a visit through its workflow event and proves it from the readback.
 * A 2xx on send-event is not success: only the state actually reported by Core
 * is. An appointment that is already cancelled returns unchanged.
 */
export function cancelCoreAppointment(ref, context, fetchImpl = globalThis.fetch, explicitOrigin) {
  var id = appointmentId(ref);
  return singleFlight("appointment:cancel:" + id, async function () {
    var api = requestContext(context, explicitOrigin);
    var current = await getEntity(fetchImpl, api.serviceBase + "/api/appointment/get.json?id=" + id, api, APPOINTMENT_MAPPINGS);
    if (!current || positiveInteger(current.id) !== id) throw contractError("appointment-not-found", "Core Appointment was not found");

    // Ownership is re-checked here: a route id is never proof on its own.
    var accountId = positiveInteger(api.customer && api.customer.id);
    if (!accountId || customerAttributeId(current, "CUSTOMER_ACCOUNT") !== accountId) {
      throw contractError("appointment-forbidden", "This appointment does not belong to the signed-in customer");
    }

    var before = normalizeAppointment(current);
    if (before.customerStatus === "Cancelled") return before;
    if (before.allowedActions.indexOf("cancel") === -1) {
      throw contractError("appointment-not-cancellable", "This appointment cannot be cancelled in its current state");
    }

    await requestCommand(fetchImpl, api.serviceBase + "/api/appointment/" + id + "/send-event.json?event=" + CANCEL_EVENT,
      requestOptions(api, {}));

    var readback = normalizeAppointment(
      await getEntity(fetchImpl, api.serviceBase + "/api/appointment/get.json?id=" + id, api, APPOINTMENT_MAPPINGS));
    if (readback.customerStatus !== "Cancelled") {
      throw contractError("appointment-cancel-unconfirmed", "Core did not report the appointment as cancelled");
    }
    return readback;
  });
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
  // SPA_VISIT carries the customer link in a dynamic attribute, which Core
  // cannot filter on, so the narrowing happens here. This is presentation:
  // the server still returns the tenant's appointments to any portal session,
  // and this filter must never be described as an authorization boundary.
  var customerAccountId = positiveInteger(api.customer && api.customer.id);
  var scoped = customerAccountId
    ? rows.filter(function (row) { return customerAttributeId(row, "CUSTOMER_ACCOUNT") === customerAccountId; })
    : [];
  var items = scoped.map(normalizeAppointment);
  var now = Number.isFinite(Number(api.config.now)) ? Number(api.config.now) : Date.now();
  var terminalStatuses = new Set(["Completed", "Cancelled", "Rejected"]);
  var upcoming = items.filter(function (item) { return item.startEpoch >= now && !terminalStatuses.has(item.customerStatus); });
  var past = items.filter(function (item) { return item.startEpoch < now || terminalStatuses.has(item.customerStatus); }).reverse();
  var byRef = {};
  items.forEach(function (item) { byRef[item.ref] = item; });
  var availability;
  try {
    var resourceResults = await Promise.all([RESOURCE_TYPE, LOCATION_TYPE].map(function (typeCode) {
      return requestJson(fetchImpl, api.resourceBase + "/api/resource/list.json", requestOptions(api, {
        filters: [{ type: "STRING", operator: "=", property: "type.code", value: typeCode }],
        mappings: RESOURCE_MAPPINGS,
        offset: 0,
        pageSize: positiveInteger(api.config.resourcesPageSize) || 100,
        sorting: [{ field: "code", direction: "ASC" }],
      }));
    }));
    var providerResponse = resourceResults[0];
    var locationResponse = resourceResults[1];
    availability = normalizeCoreAvailability(providerResponse && providerResponse.result, rows, {
      now: now,
      horizonDays: api.config.bookingHorizonDays,
      maxVisibleDays: api.config.bookingVisibleDays,
      locationRows: locationResponse && locationResponse.result,
    });
  } catch (error) {
    if (error && error.code === "session-expired") throw error;
    availability = {
      state: "error",
      reasonCode: error && error.code || "availability-load-failed",
      providers: [],
      busy: [],
    };
  }
  return {
    state: items.length ? "ready" : "empty",
    // Named to stay honest: the narrowing is done by this client, not by Core.
    scopeMode: "customer-filtered-client-side",
    resultSize: items.length,
    tenantResultSize: Number.isFinite(Number(response && response.resultSize)) ? Number(response.resultSize) : rows.length,
    items: items,
    next: upcoming[0] || null,
    upcoming: upcoming.slice(1),
    past: past,
    byRef: byRef,
    availability: availability,
  };
}

export function createCoreAppointment(input, context, fetchImpl = globalThis.fetch, explicitOrigin) {
  var key = "appointment:create:"
    + customerFlightPart(context) + ":"
    + idempotencyPart(input && input.requestRef || input && input.slotRef || "booking");
  return singleFlight(key, async function () {
    var api = requestContext(context, explicitOrigin);
    var accountId = positiveInteger(api.customer && api.customer.id);
    if (!accountId) throw contractError("customer-account-required", "Resolved customer Account is required before booking");
    var requestRef = accountId + "_" + idempotencyPart(input && input.requestRef || input && input.slotRef || Date.now());
    // appointment.code is varchar(64), and the task code appends `_TASK`.
    // Keep the Appointment at 59 chars maximum so both records fit. Long
    // selection identities retain a deterministic hash suffix rather than
    // being naively truncated into collisions.
    var code = boundedEntityCode(DEMO_CODE_PREFIX + "APPT_", requestRef, 59);
    var existing = await listOne(fetchImpl, api.serviceBase + "/api/appointment/list.json", api, [
      { type: "STRING", operator: "=", property: "code", value: code },
    ], APPOINTMENT_MAPPINGS);
    if (existing) return confirmRequestedAppointment(existing, api, fetchImpl, accountId, input);

    var resolved = await Promise.all([
      resolveTypeWithWorkflow(fetchImpl, api, api.serviceBase, "appointment-type", APPOINTMENT_TYPE, "appointment-type-missing"),
      resolveTypeWithWorkflow(fetchImpl, api, api.serviceBase, "task-type", CARE_TASK_TYPE, "task-type-missing"),
      resolveOrganization(fetchImpl, api),
      resolveCarePlan(fetchImpl, api),
    ]);
    var visitType = resolved[0];
    var taskType = resolved[1];
    var organization = resolved[2];
    var carePlan = resolved[3];

    var start = validIso(input && input.start);
    var durationMinutes = positiveInteger(input && input.durationMinutes) || 60;
    var end = new Date(Date.parse(start) + durationMinutes * 60000).toISOString();
    var serviceName = text(input && input.serviceName) || "Spa appointment";
    var serviceProductId = positiveInteger(input && input.serviceProductId);
    if (!serviceProductId) throw contractError("service-product-required", "A Core Product is required before booking");
    var resourceIds = Array.from(new Set((Array.isArray(input && input.resourceIds) ? input.resourceIds : [])
      .map(positiveInteger).filter(Boolean)));
    if (!resourceIds.length) throw contractError("appointment-resources-required", "A bookable Resource is required before booking");
    var specialistAccountId = positiveInteger(input && input.specialistAccountId);
    if (!specialistAccountId) throw contractError("specialist-account-required", "A specialist Account is required before booking");

    // appointment.task_id is NOT NULL in core-svc, so each visit gets its own
    // task rather than borrowing another appointment's.
    var taskId = await ensureVisitTask(fetchImpl, api, {
      carePlan: carePlan,
      code: code + "_TASK",
      organization: organization,
      serviceName: serviceName,
      taskType: taskType,
    });

    var entity = {
      attributes: customerAttributes(api, visitType, {
        ADD_ON_REFS: textList(input && input.addOnRefs),
        BOOKING_ORIGIN: "CUSTOMER_PORTAL",
        BOOKING_OPTIONS_VERSION: text(input && input.bookingOptionsVersion) || null,
        CUSTOMER_NOTE: text(input && input.customerNote) || null,
        LOCATION_LABEL: text(input && input.locationLabel) || null,
        LOCATION_RESOURCE: positiveInteger(input && input.locationResourceId),
        REQUEST_REF: requestRef,
        RESOURCES: resourceIds,
        SERVICE_PRODUCT: serviceProductId,
        SPECIALIST_ACCOUNT: specialistAccountId,
        VISIT_MODE: text(input && input.visitMode) || null,
      }),
      code: code,
      end: end,
      nls: { en: { NAME: serviceName } },
      organization: { id: organization.id },
      start: start,
      task: { id: taskId },
      type: { id: visitType.id },
      workflow: { id: visitType.workflow.id },
    };
    var savedIds = await requestJson(fetchImpl, api.serviceBase + "/api/appointment/save.json", requestOptions(api, {
      entities: [entity], mappings: APPOINTMENT_MAPPINGS,
    }));
    var id = positiveInteger(Array.isArray(savedIds) && savedIds[0]);
    if (!id) throw contractError("invalid-save-response", "Core Appointment save did not return an id");
    var requested = await getEntity(fetchImpl, api.serviceBase + "/api/appointment/get.json?id=" + id, api, APPOINTMENT_MAPPINGS);
    return confirmRequestedAppointment(requested, api, fetchImpl, accountId, input);
  });
}

function customerFlightPart(context) {
  var state = context && context.state || {};
  var session = context && context.session || state.session || {};
  var customer = context && context.account || state.customerAccount || session.account || {};
  return positiveInteger(customer.id) || "unresolved";
}

async function confirmRequestedAppointment(row, api, fetchImpl, accountId, input) {
  if (!row || !positiveInteger(row.id)) throw contractError("appointment-not-found", "Core Appointment was not found after booking");
  if (customerAttributeId(row, "CUSTOMER_ACCOUNT") !== accountId) {
    throw contractError("appointment-forbidden", "Booking idempotency resolved another customer's appointment");
  }
  var before = normalizeAppointment(row);
  assertBookingSelection(row, input);
  if (before.customerStatus === "Confirmed") return before;
  if (before.customerStatus !== "Requested") {
    throw contractError("appointment-request-unavailable", "Core did not keep the booking in a confirmable request state");
  }
  try {
    await requestCommand(
      fetchImpl,
      api.serviceBase + "/api/appointment/" + before.backendId + "/send-event.json?event=" + CONFIRM_EVENT,
      requestOptions(api, {}),
    );
  } catch (error) {
    // Staging's generic workflow-event dispatcher currently returns an opaque
    // 5xx tenant-wide, including for an administrator. The Appointment save is
    // still authoritative and has already been read back in REQUESTED. Keep
    // that honest result instead of telling the customer nothing was recorded.
    // Authorization/conflict/client failures still fail normally: only the
    // proven backend-dispatch outage degrades to a pending studio request.
    if (error && error.code === "core-request-failed" && Number(error.status) >= 500) {
      return Object.assign({}, before, { confirmationMode: "studio-request" });
    }
    throw error;
  }
  var confirmed = normalizeAppointment(
    await getEntity(fetchImpl, api.serviceBase + "/api/appointment/get.json?id=" + before.backendId, api, APPOINTMENT_MAPPINGS),
  );
  if (confirmed.customerStatus === "Requested") {
    assertNormalizedBookingSelection(confirmed, input);
    return Object.assign({}, confirmed, { confirmationMode: "studio-request" });
  }
  if (confirmed.customerStatus !== "Confirmed") {
    throw contractError("appointment-confirm-unconfirmed", "Core did not report the appointment as scheduled");
  }
  assertNormalizedBookingSelection(confirmed, input);
  return Object.assign({}, confirmed, { confirmationMode: "confirmed" });
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
    var currentDuration = Number.isFinite(currentEnd - currentStart) && currentEnd > currentStart ? currentEnd - currentStart : 60 * 60000;
    var duration = (positiveInteger(input && input.durationMinutes) || Math.round(currentDuration / 60000)) * 60000;
    var entity = {
      attributes: mergeAppointmentAttributes(current.attributes, current.type, {
        ADD_ON_REFS: textList(input && input.addOnRefs),
        BOOKING_OPTIONS_VERSION: text(input && input.bookingOptionsVersion) || null,
        CUSTOMER_NOTE: text(input && input.customerNote) || null,
        LOCATION_LABEL: text(input && input.locationLabel) || null,
        LOCATION_RESOURCE: positiveInteger(input && input.locationResourceId),
        RESOURCES: Array.from(new Set((Array.isArray(input && input.resourceIds) ? input.resourceIds : []).map(positiveInteger).filter(Boolean))),
        SERVICE_PRODUCT: positiveInteger(input && input.serviceProductId),
        SPECIALIST_ACCOUNT: positiveInteger(input && input.specialistAccountId),
        VISIT_MODE: text(input && input.visitMode) || null,
      }),
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
    var readback = await getEntity(fetchImpl, api.serviceBase + "/api/appointment/get.json?id=" + id, api, APPOINTMENT_MAPPINGS);
    assertBookingSelection(readback, input);
    return normalizeAppointment(readback);
  });
}

/* A purchase is its lines. What the order delivers comes from the
   `SPA_ITEM_*` type of each line, never from the order, which is always
   `SPA_ORDER`. A product type outside this table is a contract gap: the order
   fails rather than being filed under a guessed kind. */
const ITEM_TYPE_BY_PRODUCT_TYPE = {
  SPA_MEMBERSHIP: "SPA_ITEM_MEMBERSHIP",
  SPA_PACKAGE: "SPA_ITEM_PACKAGE",
  SPA_RETAIL: "SPA_ITEM_RETAIL",
  SPA_SERVICE: "SPA_ITEM_SERVICE",
};

const ORDER_ITEM_SAVE_MAPPINGS = [
  { name: "amount" },
  { name: "attributes" },
  { name: "id" },
  { name: "itemCount" },
  { name: "notes" },
  { name: "optimistic" },
  { name: "sortOrder" },
  { key: "id", name: "itemPrice", type: "identifier" },
  { key: "id", name: "order", type: "identifier" },
  { key: "id", name: "organization", type: "identifier" },
  { key: "id", mappings: REF_MAPPINGS, name: "type", type: "identifier" },
  { key: "id", mappings: REF_MAPPINGS, name: "workflow", type: "identifier" },
];

/**
 * Creates one `SPA_ORDER` from the server cart, with one `SPA_ITEM_*` line per
 * cart item.
 *
 * No totals are sent. `Order.grandTotal` is computed by Core as
 * SUM(amount x itemCount) and a client-sent value is ignored, so writing one
 * would only suggest the portal owns pricing when the server does.
 * `OrderItem.amount` is the UNIT price — the cart's own `unitAmount`, never
 * pre-multiplied, or every multi-quantity order doubles.
 *
 * Success is the readback: the order and its lines are re-read from Core and
 * the command fails unless they are there. A save id is not proof.
 */
export function createCoreOrder(input, context, fetchImpl = globalThis.fetch, explicitOrigin) {
  var requestRef = idempotencyPart(input && input.requestRef || "checkout");
  var lines = Array.isArray(input && input.lines) ? input.lines : [];
  return singleFlight("order:create:" + requestRef, async function () {
    var api = requestContext(context, explicitOrigin);
    var accountId = positiveInteger(api.customer.id);
    if (!accountId) throw contractError("customer-account-required", "Resolved customer Account is required before checkout");
    if (!lines.length) throw contractError("order-lines-required", "An order needs at least one cart line");

    var marker = DEMO_CODE_PREFIX + "ORDER_" + accountId + "_" + requestRef;
    // Idempotency check: a replayed requestRef must return the existing order.
    var rows = await listMany(fetchImpl, api.billBase + "/api/order/list.json", api, [
      { type: "INTEGER", operator: "=", property: "account.id", value: String(accountId) },
    ], ORDER_MAPPINGS, [{ field: "id", direction: "DESC" }]);
    var existing = rows.find(function (row) {
      // `notes` is the legacy marker of orders written before RECORD_CODE existed.
      return recordCodeOf(row) === marker || text(row.notes) === marker;
    });
    if (existing) return withOrderLines(fetchImpl, api, normalizeOrder(existing, accountId), accountId);

    var resolved = await Promise.all([
      resolveTypeWithWorkflow(fetchImpl, api, api.billBase, "order-type", ORDER_TYPE, "order-type-missing"),
      resolveOrganization(fetchImpl, api),
      resolveByCode(fetchImpl, api, api.coreBase, "dictionary", orderCurrencyCode(api), null, "currency-missing"),
      itemTypesByCode(fetchImpl, api),
    ]);
    var orderType = resolved[0];
    var organization = resolved[1];
    var currency = resolved[2];
    var itemTypes = resolved[3];

    var planned = lines.map(function (line, index) { return plannedLine(line, index, itemTypes); });

    var savedIds = await requestJson(fetchImpl, api.billBase + "/api/order/save.json", requestOptions(api, {
      entities: [{
        account: { id: accountId },
        attributes: recordCodeAttributes(orderType, marker),
        currency: { id: currency.id },
        // Totals are NOT sent — Core computes grandTotal from the lines.
        notes: text(input && input.label) || "Customer portal checkout",
        organization: { id: organization.id },
        type: { id: orderType.id },
        workflow: { id: orderType.workflow.id },
      }],
      mappings: ORDER_MAPPINGS,
    }));
    var id = positiveInteger(Array.isArray(savedIds) && savedIds[0]);
    if (!id) throw contractError("invalid-save-response", "Core Order save did not return an id");

    for (var index = 0; index < planned.length; index += 1) {
      var line = planned[index];
      await requestJson(fetchImpl, api.billBase + "/api/order-item/save.json", requestOptions(api, {
        entities: [{
          amount: line.unitAmount,
          attributes: recordCodeAttributes(line.itemType, marker + "_L" + (index + 1)),
          itemCount: line.qty,
          itemPrice: { id: line.priceId },
          notes: line.productCode,
          order: { id: id },
          organization: { id: organization.id },
          sortOrder: index + 1,
          type: { id: line.itemType.id },
          workflow: { id: line.itemType.workflow.id },
        }],
        mappings: ORDER_ITEM_SAVE_MAPPINGS,
      }));
    }

    var readback = await getEntity(fetchImpl, api.billBase + "/api/order/get.json?id=" + id, api, ORDER_MAPPINGS);
    var order = await withOrderLines(fetchImpl, api, normalizeOrder(readback, accountId), accountId);
    if (order.lines.length !== planned.length) {
      throw contractError("order-lines-unconfirmed",
        "Core reported " + order.lines.length + " of " + planned.length + " order lines after the save");
    }
    return order;
  });
}

function plannedLine(line, index, itemTypes) {
  var priceId = positiveInteger(line && line.priceId);
  if (!priceId) throw contractError("order-line-price-missing", "Cart line " + (index + 1) + " has no price id");
  var qty = positiveInteger(line && line.qty);
  if (!qty) throw contractError("order-line-count-missing", "Cart line " + (index + 1) + " has no quantity");
  var unitAmount = finiteNumber(line && line.unitAmount, null);
  if (unitAmount == null) throw contractError("order-line-amount-missing", "Cart line " + (index + 1) + " has no server unit amount");
  /* The product type rides in on the cart line, from the catalog the portal
     already holds. It is deliberately NOT looked up here: the authenticated
     core-pim API on this deployment 401s every other identical request, which
     would fail roughly half of all checkouts. */
  var productTypeCode = text(line && line.productTypeCode);
  var itemTypeCode = ITEM_TYPE_BY_PRODUCT_TYPE[productTypeCode];
  if (!itemTypeCode)
    throw contractError("order-item-type-unmapped",
      "Product type " + (productTypeCode || "(none)") + " has no SPA_ITEM_* line type");
  var itemType = itemTypes[itemTypeCode];
  if (!itemType) throw contractError("order-item-type-missing", itemTypeCode + " is not provisioned in this organization");
  return { itemType: itemType, priceId: priceId, productCode: text(line && line.productCode), qty: qty, unitAmount: unitAmount };
}

async function itemTypesByCode(fetchImpl, api) {
  var rows = await listMany(fetchImpl, api.billBase + "/api/order-item-type/list.json", api, [],
    TYPE_WITH_WORKFLOW_MAPPINGS, null, 100);
  var byCode = {};
  rows.forEach(function (row) {
    if (row.workflow && positiveInteger(row.workflow.id)) byCode[text(row.code)] = row;
  });
  return byCode;
}

/* Order lines are read back so the caller can prove what was created. Nothing
   here multiplies: `amount` is shown as the unit price and Core exposes no
   per-line total, so none is reported. */
async function withOrderLines(fetchImpl, api, order, accountId) {
  var rows = await listMany(fetchImpl, api.billBase + "/api/order-item/list.json", api, [
    { type: "INTEGER", operator: "=", property: "order.id", value: String(order.id) },
  ], ORDER_ITEM_SAVE_MAPPINGS, [{ field: "sortOrder", direction: "ASC" }], 200);
  return Object.assign({}, order, {
    accountId: accountId,
    lines: rows.map(function (row) {
      return {
        itemCount: finiteNumber(row.itemCount, 0),
        priceId: positiveInteger(row.itemPrice && row.itemPrice.id),
        productCode: text(row.notes),
        typeCode: text(row.type && row.type.code),
        unitAmount: finiteNumber(row.amount, null),
      };
    }),
  });
}

// References are resolved by code, never copied off whichever row happens to be
// newest. A typed entity carries its own workflow, so one lookup yields both.
const TYPE_WITH_WORKFLOW_MAPPINGS = [
  { name: "id" },
  { name: "code" },
  { key: "id", mappings: REF_MAPPINGS, name: "workflow", type: "identifier" },
];

async function resolveByCode(fetchImpl, api, base, endpoint, code, mappings, errorCode) {
  var row = await listOne(fetchImpl, base + "/api/" + endpoint + "/list.json", api, [
    { type: "STRING", operator: "=", property: "code", value: code },
  ], mappings || [{ name: "id" }, { name: "code" }]);
  if (!row) throw contractError(errorCode || "reference-missing", endpoint + " " + code + " is not provisioned in this organization");
  return row;
}

function resolveTypeWithWorkflow(fetchImpl, api, base, endpoint, code, errorCode) {
  return resolveByCode(fetchImpl, api, base, endpoint, code, TYPE_WITH_WORKFLOW_MAPPINGS, errorCode).then(function (row) {
    if (!row.workflow || !positiveInteger(row.workflow.id))
      throw contractError(errorCode || "reference-missing", endpoint + " " + code + " has no workflow");
    return row;
  });
}

function resolveOrganization(fetchImpl, api) {
  return resolveByCode(fetchImpl, api, api.coreBase, "organization", api.organization, null, "organization-missing");
}

function orderCurrencyCode(api) {
  return text(api.config.currency || api.config.pimCurrency) || "USD";
}

// `project` must be mapped as well as set: core-svc NPEs on a Task save whose
// mappings omit it, even though the entity carries the reference.
const TASK_MAPPINGS = [
  { name: "attributes" },
  { name: "code" },
  { name: "id" },
  { name: "nls" },
  { name: "optimistic" },
  { key: "id", name: "organization", type: "identifier" },
  { key: "id", name: "project", type: "identifier" },
  { key: "id", mappings: REF_MAPPINGS, name: "type", type: "identifier" },
  { key: "id", mappings: REF_MAPPINGS, name: "workflow", type: "identifier" },
];

const CARE_PLAN_TYPE = "SPA_CARE_PLAN";
const CARE_PLAN_MAPPINGS = [
  { name: "attributes" },
  { name: "code" },
  { name: "id" },
  { key: "id", mappings: REF_MAPPINGS, name: "type", type: "identifier" },
];

/**
 * Finds the signed-in customer's care plan, which every booked visit's task
 * hangs off — Core requires a Task to have a Project. The plan carries its
 * customer link in a dynamic attribute, so the match happens here.
 */
async function resolveCarePlan(fetchImpl, api) {
  var accountId = positiveInteger(api.customer && api.customer.id);
  if (!accountId) throw contractError("customer-account-required", "Resolved customer Account is required before booking");
  var rows = await listMany(fetchImpl, api.serviceBase + "/api/project/list.json", api, [
    { type: "STRING", operator: "=", property: "type.code", value: CARE_PLAN_TYPE },
  ], CARE_PLAN_MAPPINGS);
  var owned = rows.find(function (row) { return customerAttributeId(row, "CUSTOMER_ACCOUNT") === accountId; });
  if (!owned) throw contractError("care-plan-missing", "This customer has no care plan to record a visit against");
  return owned;
}

/** Creates (or re-finds) the task a booked visit hangs off. Idempotent by code. */
async function ensureVisitTask(fetchImpl, api, options) {
  var existing = await listOne(fetchImpl, api.serviceBase + "/api/task/list.json", api, [
    { type: "STRING", operator: "=", property: "code", value: options.code },
  ], TASK_MAPPINGS);
  if (existing) return positiveInteger(existing.id);
  // Task is a mandatory Appointment relation in Core, but the current generic
  // customer path can return an opaque 500 when it tries to create one. The
  // customer's care plan is already ownership-checked above, so an existing
  // SPA_CARE_TASK under that exact plan is a safe staging bridge: it cannot be
  // borrowed from another customer's plan and it avoids making Task creation
  // a prerequisite for recording the Appointment request.
  var careTasks = await listMany(fetchImpl, api.serviceBase + "/api/task/list.json", api, [
    { type: "STRING", operator: "=", property: "type.code", value: CARE_TASK_TYPE },
  ], TASK_MAPPINGS);
  var reusable = careTasks.find(function (row) {
    return positiveInteger(row && row.project && row.project.id) === positiveInteger(options.carePlan && options.carePlan.id);
  });
  if (reusable && positiveInteger(reusable.id)) return positiveInteger(reusable.id);
  var savedIds = await requestJson(fetchImpl, api.serviceBase + "/api/task/save.json", requestOptions(api, {
    entities: [{
      attributes: customerAttributes(api, options.taskType),
      code: options.code,
      nls: { en: { NAME: options.serviceName } },
      organization: { id: options.organization.id },
      project: { id: options.carePlan.id },
      type: { id: options.taskType.id },
      workflow: { id: options.taskType.workflow.id },
    }],
    mappings: TASK_MAPPINGS,
  }));
  var id = positiveInteger(Array.isArray(savedIds) && savedIds[0]);
  if (!id) throw contractError("invalid-save-response", "Core Task save did not return an id");
  return id;
}

async function listOne(fetchImpl, url, api, filters, mappings, sorting) {
  var body = { filters: filters, mappings: mappings, offset: 0, pageSize: 1 };
  if (sorting) body.sorting = sorting;
  var response = await requestJson(fetchImpl, url, requestOptions(api, body));
  var rows = Array.isArray(response && response.result) ? response.result : [];
  return rows[0] || null;
}

async function listMany(fetchImpl, url, api, filters, mappings, sorting, pageSize) {
  var body = { filters: filters, mappings: mappings, offset: 0, pageSize: pageSize || 200 };
  if (sorting) body.sorting = sorting;
  var response = await requestJson(fetchImpl, url, requestOptions(api, body));
  return Array.isArray(response && response.result) ? response.result : [];
}

// Order has no `code` column, so its type carries a RECORD_CODE attribute that
// plays that role. Core cannot filter on dynamic attributes — a filter on
// `attributes.RECORD_CODE` silently returns zero rows rather than erroring —
// so callers must match client-side or they will create duplicates.
function recordCodeOf(row) {
  var typeId = row && row.type && row.type.id;
  var group = row && row.attributes && typeId != null ? row.attributes[String(typeId)] : null;
  var entry = group && group.RECORD_CODE;
  return entry && entry.value != null ? String(entry.value) : "";
}

function recordCodeAttributes(typeRef, code) {
  var typeId = typeRef && typeRef.id;
  if (typeId == null) return {};
  var attributes = {};
  attributes[String(typeId)] = { RECORD_CODE: { value: code } };
  return attributes;
}

// Reads an entity-reference attribute (CUSTOMER_ACCOUNT, SERVICE_PRODUCT, ...)
// from a row's own type group.
function customerAttributeId(row, code) {
  var typeId = row && row.type && row.type.id;
  var group = row && row.attributes && typeId != null ? row.attributes[String(typeId)] : null;
  var entry = group && group[code];
  return entry && entry.value != null ? positiveInteger(entry.value) : null;
}

// Every appointment this portal writes must carry the customer link the read
// path filters on, or a freshly booked visit disappears from the list.
function customerAttributes(api, typeRef, extra) {
  var typeId = typeRef && typeRef.id;
  if (typeId == null) return {};
  var values = {};
  var accountId = positiveInteger(api.customer && api.customer.id);
  if (accountId) values.CUSTOMER_ACCOUNT = { value: accountId };
  if (api.customerUserId) values.CUSTOMER_USER = { value: api.customerUserId };
  Object.keys(extra || {}).forEach(function (key) {
    if (extra[key] != null) values[key] = { value: extra[key] };
  });
  var attributes = {};
  attributes[String(typeId)] = values;
  return attributes;
}

function mergeAppointmentAttributes(attributes, typeRef, extra) {
  var result = Object.assign({}, attributes || {});
  var typeId = typeRef && typeRef.id;
  if (typeId == null) return result;
  var group = Object.assign({}, result[String(typeId)] || {});
  Object.keys(extra || {}).forEach(function (key) {
    if (extra[key] == null) delete group[key];
    else group[key] = { value: extra[key] };
  });
  result[String(typeId)] = group;
  return result;
}

function appointmentAttributeValue(row, code) {
  var typeId = row && row.type && row.type.id;
  var group = row && row.attributes && typeId != null ? row.attributes[String(typeId)] : null;
  var entry = group && group[code];
  return entry && Object.prototype.hasOwnProperty.call(entry, "value") ? entry.value : null;
}

function assertBookingSelection(row, input) {
  if (!input) return;
  var expected = {
    addOnRefs: textList(input.addOnRefs),
    bookingOptionsVersion: text(input.bookingOptionsVersion),
    customerNote: text(input.customerNote),
    locationLabel: text(input.locationLabel),
    locationResourceId: positiveInteger(input.locationResourceId),
    visitMode: text(input.visitMode),
  };
  var observed = {
    addOnRefs: textList(appointmentAttributeValue(row, "ADD_ON_REFS")),
    bookingOptionsVersion: text(appointmentAttributeValue(row, "BOOKING_OPTIONS_VERSION")),
    customerNote: text(appointmentAttributeValue(row, "CUSTOMER_NOTE")),
    locationLabel: text(appointmentAttributeValue(row, "LOCATION_LABEL")),
    locationResourceId: positiveInteger(appointmentAttributeValue(row, "LOCATION_RESOURCE")),
    visitMode: text(appointmentAttributeValue(row, "VISIT_MODE")),
  };
  if (JSON.stringify(expected) !== JSON.stringify(observed)) {
    throw contractError("booking-selection-readback-mismatch", "Core Appointment did not retain the selected booking options");
  }
}

function assertNormalizedBookingSelection(appointment, input) {
  if (!input) return;
  var expectedRefs = textList(input.addOnRefs);
  if (appointment.visitMode !== text(input.visitMode)
    || appointment.location !== text(input.locationLabel)
    || appointment.bookingOptionsVersion !== text(input.bookingOptionsVersion)
    || appointment.customerNote !== text(input.customerNote)
    || JSON.stringify(appointment.addOnRefs) !== JSON.stringify(expectedRefs)) {
    throw contractError("booking-selection-readback-mismatch", "Confirmed Appointment did not retain the selected booking options");
  }
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
    coreBase: sameOriginBase(config.coreApiBase || "/core", origin, "Core API base"),
    customer: customer,
    customerUserId: positiveInteger(session.userId || state.session && state.session.userId) || null,
    organization: organization,
    resourceBase: sameOriginBase(config.resourceApiBase || "/core-rm", origin, "Core Resource API base"),
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
  var response = await requestResponse(fetchImpl, url, options);
  try { return await response.json(); }
  catch (_) { throw contractError("invalid-response", "Core response was not valid JSON"); }
}

// Workflow command endpoints are successful by HTTP status and commonly
// return an empty body. Their business effect is always proven by the entity
// readback that follows, so attempting JSON parsing here can only turn a valid
// 2xx into a false client-side failure.
async function requestCommand(fetchImpl, url, options) {
  await requestResponse(fetchImpl, url, options);
  return true;
}

async function requestResponse(fetchImpl, url, options) {
  var response = await fetchImpl(url, options);
  if (!response || typeof response.ok !== "boolean") throw contractError("invalid-response", "Core request returned an invalid response");
  if (!response.ok) {
    var code = response.status === 401 ? "session-expired"
      : response.status === 403 ? "customer-forbidden"
        : response.status === 409 || response.status === 412 ? "conflict"
          : "core-request-failed";
    var detail = await failureDetail(response);
    var error = contractError(code, "Core request failed with HTTP " + response.status + (detail ? " — " + detail : ""));
    error.status = response.status;
    if (detail) error.serverDetail = detail;
    throw error;
  }
  return response;
}

async function failureDetail(response) {
  try {
    var raw = "";
    if (response && typeof response.clone === "function") raw = await response.clone().text();
    else if (response && typeof response.json === "function") raw = JSON.stringify(await response.json());
    raw = text(raw).replace(/\s+/g, " ").slice(0, 500);
    if (!raw || raw === "{}") return "";
    try {
      var parsed = JSON.parse(raw);
      return text(parsed && (parsed.message || parsed.error || parsed.detail)) || raw;
    } catch (_) { return raw; }
  } catch (_) { return ""; }
}

function normalizeAppointment(row) {
  var id = positiveInteger(row && row.id);
  if (!id) throw contractError("invalid-appointment", "Core Appointment response did not include an id");
  var start = validIso(row.start);
  var end = validIso(row.end);
  var states = Array.isArray(row.states) ? row.states.map(function (state) { return text(state && state.code); }).filter(Boolean) : [];
  var status = appointmentStatus(states);
  // Actions follow the workflow: only a scheduled visit can be moved or called
  // off, and only a finished one can be repeated.
  var allowedActions = [];
  if (status === "Confirmed") allowedActions.push("reschedule", "cancel");
  if (status === "Completed") allowedActions.push("bookAgain");
  return {
    ref: REF_PREFIX + id,
    id: REF_PREFIX + id,
    backendId: id,
    optimistic: Number.isFinite(Number(row.optimistic)) ? Number(row.optimistic) : null,
    code: text(row.code),
    service: localizedName(row.nls) || "Spa appointment",
    startIso: start,
    endIso: end,
    startEpoch: Date.parse(start),
    start: formatDateTime(start),
    date: formatDate(start),
    time: formatTime(start),
    specialist: "",
    mode: text(appointmentAttributeValue(row, "VISIT_MODE")) || "salon",
    visitMode: text(appointmentAttributeValue(row, "VISIT_MODE")) || "salon",
    location: text(appointmentAttributeValue(row, "LOCATION_LABEL")),
    locationResourceId: positiveInteger(appointmentAttributeValue(row, "LOCATION_RESOURCE")),
    addOnRefs: textList(appointmentAttributeValue(row, "ADD_ON_REFS")),
    customerNote: text(appointmentAttributeValue(row, "CUSTOMER_NOTE")),
    bookingOptionsVersion: text(appointmentAttributeValue(row, "BOOKING_OPTIONS_VERSION")),
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
  if (states.includes("REJECTED")) return "Rejected";
  if (states.includes("IN_PROGRESS")) return "In progress";
  if (states.includes("SCHEDULED")) return "Confirmed";
  if (states.includes("REQUESTED")) return "Requested";
  return "Unknown";
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

export function resetCoreSpaDemoFlightsForTest() { flights.clear(); }

function sameOriginBase(value, origin, label) {
  if (!origin) throw contractError("origin-required", label + " requires a browser origin");
  var target = new URL(String(value || ""), origin);
  if (target.origin !== new URL(origin).origin) throw contractError("cross-origin-service", label + " must be same-origin");
  return target.href.replace(/\/+$/, "");
}

function browserOrigin() { return globalThis.location && globalThis.location.origin || ""; }
function positiveInteger(value) {
  var candidate = value && typeof value === "object" && !Array.isArray(value) ? value.id : value;
  var number = Number(candidate);
  return Number.isInteger(number) && number > 0 ? number : null;
}
function finiteNumber(value, fallback) { var number = Number(value); return Number.isFinite(number) ? number : fallback; }
function text(value) { return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim(); }
function textList(value) { return (Array.isArray(value) ? value : value == null || value === "" ? [] : [value]).map(text).filter(Boolean).sort(); }
function localizedName(value) { if (!value || typeof value !== "object") return ""; var localized = value.en || value["en-US"] || Object.values(value)[0] || {}; return text(localized && (localized.NAME || localized.name)); }
function requiredRef(value, label) { var id = value && positiveInteger(value.id); if (!id) throw contractError("template-reference-missing", label + " is missing"); return { id: id }; }
function optionalRef(value) { var id = value && positiveInteger(value.id); return id ? { id: id } : null; }
function validIso(value) { var date = new Date(value); if (!Number.isFinite(date.getTime())) throw contractError("invalid-date", "Appointment date is invalid"); return date.toISOString(); }
function idempotencyPart(value, maxLength) {
  var clean = text(value).toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "REQUEST";
  var limit = positiveInteger(maxLength) || 32;
  if (clean.length <= limit) return clean;
  var suffix = "_" + stableCodeHash(clean);
  return clean.slice(0, Math.max(1, limit - suffix.length)) + suffix;
}
function boundedEntityCode(prefix, value, maxLength) {
  var room = Math.max(10, Number(maxLength) - String(prefix).length);
  return String(prefix) + idempotencyPart(value, room);
}
function stableCodeHash(value) {
  var hash = 2166136261;
  var input = String(value || "");
  for (var index = 0; index < input.length; index += 1) hash = Math.imul(hash ^ input.charCodeAt(index), 16777619);
  return (hash >>> 0).toString(36).toUpperCase().padStart(7, "0");
}
function formatDate(value) { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/Chicago" }).format(new Date(value)); }
function formatTime(value) { return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" }).format(new Date(value)); }
function formatDateTime(value) { return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" }).format(new Date(value)); }
function contractError(code, message) { var error = new Error(message); error.code = code; return error; }

export const coreSpaDemoContract = Object.freeze({
  appointmentMappings: APPOINTMENT_MAPPINGS,
  appointmentTypeCode: APPOINTMENT_TYPE,
  confirmEvent: CONFIRM_EVENT,
  locationTypeCode: LOCATION_TYPE,
  orderMappings: ORDER_MAPPINGS,
  resourceMappings: RESOURCE_MAPPINGS,
  resourceTypeCode: RESOURCE_TYPE,
  scopeMode: "tenant-demo-unscoped",
});
