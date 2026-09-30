import assert from "node:assert/strict";
import {
  coreSpaDemoContract,
  createCoreAppointment,
  cancelCoreAppointment,
  createCoreOrder,
  loadCoreAppointments,
  resetCoreSpaDemoFlightsForTest,
  rescheduleCoreAppointment,
} from "../runtime/src/adapters/core-spa-demo-adapter.js";
import {
  deriveCoreBookingModel,
  normalizeCoreAvailability,
} from "../runtime/src/normalizers/spa-availability.js";
import {
  liveBookingQuote,
  normalizeLiveBookingOptions,
} from "../runtime/src/normalizers/spa-booking-options.js";

const origin = "https://dev-1.servicewand.com";
const context = {
  config: {
    origin,
    organization: "CALM_HARBOR_SPA_STAGING",
    serviceApiBase: "/core-svc",
    resourceApiBase: "/core-rm",
    billApiBase: "/core-bill",
    now: Date.parse("2026-07-17T12:00:00.000Z"),
  },
  state: {
    session: { accessToken: "test-token", tokenType: "Bearer", userId: 33 },
    customerAccount: { id: 1042 },
  },
};

const templateAppointment = {
  id: 1050,
  optimistic: 3,
  code: "CHS_STG_APPOINTMENT_1050",
  nls: { en: { NAME: "Custom facial" } },
  start: "2026-07-28T14:00:00.000Z",
  end: "2026-07-28T15:00:00.000Z",
  organization: { id: 11 },
  task: { id: 22, code: "CHS_STG_FACIAL_CHECKIN" },
  type: { id: 33, code: "SPA_VISIT" },
  workflow: { id: 44, code: "SPA_APPOINTMENT_LIFECYCLE" },
  states: [{ id: 55, code: "SCHEDULED" }],
  attributes: { 33: { CUSTOMER_ACCOUNT: { value: 1042 }, CUSTOMER_USER: { value: 33 } } },
};

// Core returns the whole tenant's SPA_VISIT rows to any portal session, so the
// adapter narrows to the signed-in customer itself.
const foreignAppointment = {
  ...templateAppointment,
  id: 1060,
  code: "CHS_STG_APPOINTMENT_1060",
  attributes: { 33: { CUSTOMER_ACCOUNT: { value: 2099 }, CUSTOMER_USER: { value: 30 } } },
};
const unlinkedAppointment = { ...templateAppointment, id: 1070, code: "CP_DEMO_LEGACY", attributes: {} };

const providerResource = {
  id: 3001,
  code: "CHS_STG_MAYA_CHEN_PROVIDER",
  nls: { en: { NAME: "Maya Chen" } },
  type: { id: 66, code: "SPA_SERVICE_PROVIDER" },
  attributes: {
    66: {
      AVAILABILITY_TIMEZONE: { value: "America/Chicago" },
      BOOKING_ENABLED: { value: "true" },
      BUFFER_MINUTES: { value: 15 },
      LOCATION_RESOURCE: { value: { id: 3002 } },
      SERVICE_PRODUCTS: { value: [{ id: 501 }] },
      SLOT_INTERVAL_MINUTES: { value: 30 },
      SPECIALIST_ACCOUNT: { value: { id: 1044 } },
      WEEKLY_AVAILABILITY: {
        value: JSON.stringify({
          schemaVersion: 1,
          sunday: [],
          monday: [["09:00", "17:00"]],
          tuesday: [["09:00", "17:00"]],
          wednesday: [["09:00", "17:00"]],
          thursday: [["09:00", "17:00"]],
          friday: [["09:00", "17:00"]],
          saturday: [],
        }),
      },
    },
  },
};
const studioResource = {
  id: 3002,
  code: "CHS_STG_AUSTIN_STUDIO",
  nls: { en: { NAME: "Calm Harbor Spa - Austin" } },
  type: { id: 67, code: "SPA_STUDIO" },
  attributes: {},
};
const bookingOptionsAttribute = JSON.stringify({
  schemaVersion: 1,
  selectionVersion: "grounding-v1",
  visitModes: [{ code: "STUDIO", label: "At Calm Harbor", locationRequired: true }],
  locations: [{ resourceCode: "CHS_STG_AUSTIN_STUDIO", kind: "STUDIO", visitModeCode: "STUDIO" }],
  addOns: [{ ref: "add-warm", name: "Warm stone finish", displayPrice: "$18.00", durationNote: "+15 min", allowedActions: ["toggle"] }],
  notes: { enabled: true, maxLength: 200, helperText: "Optional" },
  quotes: {
    "": { displayTotal: "$145.00", durationMinutes: 75 },
    "add-warm": { displaySubtotal: "$145.00", displayTotal: "$163.00", durationMinutes: 90 },
  },
});

function resourceRows(options) {
  const body = JSON.parse(options.body);
  const typeCode = body.filters && body.filters[0] && body.filters[0].value;
  return typeCode === "SPA_STUDIO" ? [studioResource] : [providerResource];
}

{
  const calls = [];
  const result = await loadCoreAppointments(context, async (url, options) => {
    calls.push({ url, options });
    if (url.includes("/core-rm/")) return json({ result: resourceRows(options) });
    return json({ resultSize: 3, result: [templateAppointment, foreignAppointment, unlinkedAppointment] });
  }, origin);
  assert.equal(result.state, "ready");
  assert.equal(result.scopeMode, "customer-filtered-client-side");
  assert.equal(result.items.length, 1, "another customer's appointment must not reach the UI");
  assert.equal(result.resultSize, 1);
  assert.equal(result.tenantResultSize, 3, "the tenant count stays visible so the gap is not hidden");
  assert.equal(result.next.ref, "appt-core-1050");
  assert.deepEqual(result.next.allowedActions, ["reschedule", "cancel"]);
  assert.equal(result.next.customerStatus, "Confirmed");
  assert.equal(calls[0].url, origin + "/core-svc/api/appointment/list.json");
  const body = JSON.parse(calls[0].options.body);
  assert.deepEqual(body.filters, [{ type: "STRING", operator: "=", property: "type.code", value: "SPA_VISIT" }]);
  assert.deepEqual(body.mappings, coreSpaDemoContract.appointmentMappings);
  assert.equal(result.availability.state, "ready");
  assert.equal(result.availability.providers[0].locationCode, "CHS_STG_AUSTIN_STUDIO");
  assert.equal(result.availability.providers[0].locationName, "Calm Harbor Spa - Austin");
  const resourceCall = calls.find((call) => call.url.includes("/core-rm/"));
  assert.deepEqual(JSON.parse(resourceCall.options.body).mappings, coreSpaDemoContract.resourceMappings);
}

{
  // With no resolved customer account the list is empty, never the tenant's.
  const bare = { ...context, state: { ...context.state, customerAccount: {} } };
  const result = await loadCoreAppointments(bare, async (url, options) =>
    url.includes("/core-rm/")
      ? json({ result: resourceRows(options) })
      : json({ resultSize: 2, result: [templateAppointment, foreignAppointment] }), origin);
  assert.equal(result.state, "empty");
  assert.equal(result.items.length, 0);
}

{
  // Slot generation uses Resource hours, service duration, provider buffer and
  // every tenant appointment that names the provider Resource.
  const busy = {
    ...templateAppointment,
    start: "2026-07-20T15:00:00.000Z",
    end: "2026-07-20T16:00:00.000Z",
    attributes: {
      33: {
        CUSTOMER_ACCOUNT: { value: 1042 },
        RESOURCES: { value: [{ id: 3001 }, { id: 3002 }] },
      },
    },
  };
  const source = normalizeCoreAvailability([providerResource], [busy], {
    now: Date.parse("2026-07-20T12:00:00.000Z"),
    horizonDays: 1,
    maxVisibleDays: 1,
    locationRows: [studioResource],
  });
  const model = deriveCoreBookingModel(source, [{
    code: "CHS_GROUNDING_MASSAGE",
    name: "Grounding massage",
    backendProductId: 501,
    durationMinutes: 60,
    displayPrice: "$145.00",
  }], { serviceCode: "CHS_GROUNDING_MASSAGE" });
  assert.equal(model.state, "ready");
  assert.deepEqual(model.eligibleServices, ["CHS_GROUNDING_MASSAGE"]);
  assert.deepEqual(model.eligibleSpecialists.CHS_GROUNDING_MASSAGE, [model.days[0].slots[0].providerRef]);
  assert.equal(model.days[0].slots.some((slot) => slot.label === "9:00 AM"), false,
    "the provider buffer must remove a candidate immediately before the busy visit");
  assert.equal(model.days[0].slots.some((slot) => slot.label === "11:30 AM"), true,
    "the first interval after the provider buffer should remain available");
  assert.deepEqual(model.days[0].slots[0].resourceIds, [3001, 3002]);
  assert.equal(model.days[0].slots[0].locationName, "Calm Harbor Spa - Austin");
}

{
  const source = normalizeCoreAvailability([providerResource], [], {
    now: context.config.now,
    locationRows: [studioResource],
  });
  const service = {
    code: "CHS_GROUNDING_MASSAGE",
    attributes: { 1: { BOOKING_OPTIONS: { value: bookingOptionsAttribute } } },
  };
  const options = normalizeLiveBookingOptions(service, source);
  assert.deepEqual(options.capabilities, { visitMode: true, location: true, addOns: true, notes: true });
  assert.equal(options.locations[0].backendResourceId, 3002);
  assert.equal(options.locations[0].label, "Calm Harbor Spa - Austin");
  assert.equal(liveBookingQuote(options, ["add-warm"]).durationMinutes, 90);
  assert.equal(liveBookingQuote(options, ["add-warm"]).displayTotal, "$163.00");
  assert.equal(normalizeLiveBookingOptions({ attributes: {} }, source).capabilities.addOns, false,
    "live mode must never borrow fixture options when the attribute is absent");
}

{
  const noProvider = normalizeCoreAvailability([], [], { now: context.config.now });
  assert.equal(noProvider.state, "unavailable", "no bookable Resource is unavailable, not an empty calendar");
  assert.equal(deriveCoreBookingModel(noProvider, []).state, "unavailable");

  const unlinked = deriveCoreBookingModel(
    normalizeCoreAvailability([providerResource], [], { now: context.config.now }),
    [{ code: "UNLINKED_SERVICE", name: "Unlinked", backendProductId: 999, durationMinutes: 60 }],
  );
  assert.equal(unlinked.state, "unavailable", "a service without a provider relationship is not bookable");

  const noSlots = deriveCoreBookingModel(
    normalizeCoreAvailability([providerResource], [], {
      now: Date.parse("2026-07-19T12:00:00.000Z"),
      horizonDays: 1,
      maxVisibleDays: 1,
    }),
    [{ code: "CHS_GROUNDING_MASSAGE", name: "Grounding massage", backendProductId: 501, durationMinutes: 60 }],
  );
  assert.equal(noSlots.state, "empty", "a configured provider with no candidate slots remains a real empty-slots state");
  assert.deepEqual(noSlots.eligibleServices, ["CHS_GROUNDING_MASSAGE"]);
}

{
  globalThis.window = globalThis;
  const { spaBookingModel, spaBookingOpen, spaBookingOpts, spaBookingQuote, state } = await import("../runtime/src/state.js");
  const previous = {
    config: { ...state.config },
    theme: state.theme,
    capability: state.capability,
    spaBooking: state.spaBooking,
    spaFlow: state.spaFlow,
    moduleData: state.moduleData,
  };
  Object.assign(state.config, { dataMode: "live", vertical: "beauty" });
  state.theme = "Beauty";
  state.capability = "target-appointments";
  state.spaBooking = "open";
  state.moduleData = {
    appointments: { availability: normalizeCoreAvailability([], [], { now: context.config.now }) },
    pricing: { rates: [{ code: "CHS_GROUNDING_MASSAGE", name: "Grounding massage", price: "$145.00", backendProductId: 501, attributes: { 1: { BOOKING_OPTIONS: { value: bookingOptionsAttribute } } } }] },
  };
  assert.equal(spaBookingOpen(), false, "missing Resource closes every live booking entry before the drawer opens");
  state.moduleData.appointments.availability = normalizeCoreAvailability([providerResource], [], {
    now: Date.parse("2026-07-19T12:00:00.000Z"),
    horizonDays: 1,
    maxVisibleDays: 1,
    locationRows: [studioResource],
  });
  assert.equal(spaBookingModel().eligibleServices[0], "CHS_GROUNDING_MASSAGE", "BOOKING_OPTIONS base quote supplies duration when the public catalog omits DURATION_MIN");
  assert.equal(spaBookingOpen(), true, "a valid Resource keeps booking open even when its current horizon has no slots");
  state.spaFlow = { serviceCode: "CHS_GROUNDING_MASSAGE", addOns: ["add-warm"] };
  assert.deepEqual(spaBookingOpts().capabilities, { visitMode: true, location: true, addOns: true, notes: true });
  assert.equal(spaBookingQuote().displayTotal, "$163.00");
  assert.equal(spaBookingModel().displayTotals.CHS_GROUNDING_MASSAGE, "$145.00");
  Object.assign(state.config, previous.config);
  state.theme = previous.theme;
  state.capability = previous.capability;
  state.spaBooking = previous.spaBooking;
  state.spaFlow = previous.spaFlow;
  state.moduleData = previous.moduleData;
}

{
  const invalid = structuredClone(providerResource);
  invalid.attributes[66].WEEKLY_AVAILABILITY.value = "not-json";
  assert.throws(
    () => normalizeCoreAvailability([invalid], [], { now: context.config.now }),
    (error) => error && error.code === "availability-invalid-schedule",
  );
}

// References are resolved by code; the booking stub answers each lookup rather
// than handing back a row to clone.
const visitType = { id: 33, code: "SPA_VISIT", workflow: { id: 44, code: "SPA_APPOINTMENT_LIFECYCLE" } };
const careTaskType = { id: 27, code: "SPA_CARE_TASK", workflow: { id: 28, code: "SPA_TASK_LIFECYCLE" } };
const organization = { id: 11, code: "CALM_HARBOR_SPA_STAGING" };
// A Task must belong to a Project, so booking hangs the visit task off the
// customer's own care plan rather than any project it happens to find.
const carePlan = {
  id: 7, code: "CHS_STG_ELENA_CARE_PLAN", type: { id: 10, code: "SPA_CARE_PLAN" },
  attributes: { 10: { CUSTOMER_ACCOUNT: { value: 1042 }, CUSTOMER_USER: { value: 33 } } },
};

function bookingFetch(calls, overrides = {}) {
  let confirmed = false;
  let savedAppointment = null;
  return async (url, options) => {
    calls.push({ url, options });
    if (url.includes("/appointment-type/list.json")) return json({ result: [visitType] });
    if (url.includes("/task-type/list.json")) return json({ result: [careTaskType] });
    if (url.includes("/organization/list.json")) return json({ result: [organization] });
    if (url.includes("/project/list.json")) return json({ result: [carePlan] });
    if (url.includes("/task/list.json")) {
      const body = JSON.parse(options.body);
      const codeLookup = body.filters && body.filters.some((filter) => filter.property === "code");
      return json({ result: codeLookup
        ? overrides.existingTask ? [overrides.existingTask] : []
        : overrides.reusableTask ? [overrides.reusableTask] : [] });
    }
    if (url.includes("/task/save.json")) return json([7788]);
    if (url.includes("/appointment/list.json")) return json({ result: overrides.existingAppointment ? [overrides.existingAppointment] : [] });
    if (url.includes("/appointment/save.json")) {
      savedAppointment = JSON.parse(options.body).entities[0];
      return json([2051]);
    }
    if (url.includes("/send-event.json")) {
      if (overrides.eventStatus) return errorJson(overrides.eventStatus);
      confirmed = true;
      return emptyResponse();
    }
    if (url.includes("/appointment/get.json")) {
      return json({
        ...templateAppointment,
        id: 2051,
        optimistic: 0,
        code: "CP_DEMO_APPT_1042_BOOK_1",
        nls: { en: { NAME: "Grounding massage" } },
        attributes: savedAppointment && savedAppointment.attributes
          || overrides.existingAppointment && overrides.existingAppointment.attributes
          || templateAppointment.attributes,
        states: [{ code: confirmed && !overrides.keepRequested ? "SCHEDULED" : "REQUESTED" }],
      });
    }
    throw new Error("unexpected request: " + url);
  };
}

function bookingInput(requestRef) {
  return {
    addOnRefs: ["add-warm"],
    bookingOptionsVersion: "grounding-v1",
    customerNote: "Please prepare a warm blanket.",
    requestRef,
    serviceName: "Grounding massage",
    start: "2026-07-29T15:00:00.000Z",
    durationMinutes: 90,
    serviceProductId: 501,
    resourceIds: [3001, 3002],
    specialistAccountId: 1044,
    visitMode: "STUDIO",
    locationResourceId: 3002,
    locationLabel: "Calm Harbor Spa - Austin",
  };
}

function bookingAttributes(input) {
  return {
    CUSTOMER_ACCOUNT: { value: 1042 },
    CUSTOMER_USER: { value: 33 },
    ADD_ON_REFS: { value: input.addOnRefs },
    BOOKING_OPTIONS_VERSION: { value: input.bookingOptionsVersion },
    CUSTOMER_NOTE: { value: input.customerNote },
    LOCATION_LABEL: { value: input.locationLabel },
    LOCATION_RESOURCE: { value: input.locationResourceId },
    VISIT_MODE: { value: input.visitMode },
  };
}

{
  const calls = [];
  const input = bookingInput("book-1");
  resetCoreSpaDemoFlightsForTest();
  const [first, duplicate] = await Promise.all([
    createCoreAppointment(input, context, bookingFetch(calls), origin),
    createCoreAppointment(input, context, bookingFetch(calls), origin),
  ]);
  assert.deepEqual(first, duplicate, "same entity command must share one in-flight promise");
  assert.equal(first.ref, "appt-core-2051");
  assert.equal(calls.filter((call) => call.url.endsWith("/appointment/save.json")).length, 1);

  const save = JSON.parse(calls.find((call) => call.url.endsWith("/appointment/save.json")).options.body).entities[0];
  assert.equal(save.code, "CP_DEMO_APPT_1042_BOOK_1");
  assert.equal(save.nls.en.NAME, "Grounding massage");
  assert.equal(save.type.id, 33, "type resolved by code, not copied off another row");
  assert.equal(save.workflow.id, 44, "workflow comes from the type it belongs to");
  assert.equal(save.organization.id, 11, "organization resolved by code");
  // A booked visit must carry the link the read path filters on, or it would
  // vanish from the customer's own list.
  assert.equal(save.attributes[33].CUSTOMER_ACCOUNT.value, 1042);
  assert.equal(save.attributes[33].CUSTOMER_USER.value, 33);
  assert.equal(save.attributes[33].BOOKING_ORIGIN.value, "CUSTOMER_PORTAL");
  assert.equal(save.attributes[33].REQUEST_REF.value, "1042_BOOK_1");
  assert.deepEqual(save.attributes[33].RESOURCES.value, [3001, 3002]);
  assert.equal(save.attributes[33].SERVICE_PRODUCT.value, 501);
  assert.equal(save.attributes[33].SPECIALIST_ACCOUNT.value, 1044);
  assert.deepEqual(save.attributes[33].ADD_ON_REFS.value, ["add-warm"]);
  assert.equal(save.attributes[33].BOOKING_OPTIONS_VERSION.value, "grounding-v1");
  assert.equal(save.attributes[33].CUSTOMER_NOTE.value, "Please prepare a warm blanket.");
  assert.equal(save.attributes[33].LOCATION_RESOURCE.value, 3002);
  assert.equal(save.attributes[33].LOCATION_LABEL.value, "Calm Harbor Spa - Austin");
  assert.equal(save.attributes[33].VISIT_MODE.value, "STUDIO");
  assert.equal(first.visitMode, "STUDIO");
  assert.deepEqual(first.addOnRefs, ["add-warm"]);
  assert.equal(calls.filter((call) => call.url.includes("/send-event.json?event=REQUESTED-SCHEDULED")).length, 1);

  // appointment.task_id is NOT NULL: booking creates its own task instead of
  // pointing at another visit's.
  const taskSave = JSON.parse(calls.find((call) => call.url.endsWith("/task/save.json")).options.body).entities[0];
  assert.equal(taskSave.code, "CP_DEMO_APPT_1042_BOOK_1_TASK");
  assert.equal(taskSave.type.id, 27);
  assert.equal(taskSave.workflow.id, 28);
  assert.equal(taskSave.attributes[27].CUSTOMER_ACCOUNT.value, 1042);
  assert.equal(save.task.id, 7788, "the appointment hangs off the task just created");
}

{
  // The deployed workflow dispatcher currently returns an opaque 5xx even for
  // administrators. A successfully saved and read-back REQUESTED appointment
  // remains a truthful studio request; it must not be presented as confirmed,
  // but it must not be discarded as if Core recorded nothing either.
  const calls = [];
  const result = await createCoreAppointment(
    bookingInput("book-event-outage"),
    context,
    bookingFetch(calls, { eventStatus: 500 }),
    origin,
  );
  assert.equal(result.customerStatus, "Requested");
  assert.equal(result.confirmationMode, "studio-request");
  assert.equal(calls.filter((call) => call.url.endsWith("/appointment/save.json")).length, 1);
  assert.equal(calls.filter((call) => call.url.includes("/send-event.json")).length, 1);
}

{
  // Permission/client failures are not the known dispatcher outage and must
  // still fail. Otherwise a missing write/transition grant would look like a
  // successfully submitted request.
  await assert.rejects(
    () => createCoreAppointment(
      bookingInput("book-event-forbidden"),
      context,
      bookingFetch([], { eventStatus: 403 }),
      origin,
    ),
    (error) => error && error.code === "customer-forbidden",
  );
}

{
  // The live booking identity contains booking, slot and service refs and can
  // be much longer than appointment.code varchar(64). Both Appointment and
  // its derived `_TASK` code must fit while different long identities remain
  // distinct through their hash suffix.
  const longA = "core-booking-v1-sl-core-very-long-provider-and-start-identity-CHS_CUSTOM_FACIAL-A";
  const longB = "core-booking-v1-sl-core-very-long-provider-and-start-identity-CHS_CUSTOM_FACIAL-B";
  const callsA = [];
  const callsB = [];
  await createCoreAppointment(bookingInput(longA), context, bookingFetch(callsA), origin);
  await createCoreAppointment(bookingInput(longB), context, bookingFetch(callsB), origin);
  const saveA = JSON.parse(callsA.find((call) => call.url.endsWith("/appointment/save.json")).options.body).entities[0];
  const saveB = JSON.parse(callsB.find((call) => call.url.endsWith("/appointment/save.json")).options.body).entities[0];
  const taskA = JSON.parse(callsA.find((call) => call.url.endsWith("/task/save.json")).options.body).entities[0];
  assert.ok(saveA.code.length <= 59, "Appointment code leaves room for the task suffix");
  assert.ok(taskA.code.length <= 64, "Task code fits Core varchar(64)");
  assert.notEqual(saveA.code, saveB.code, "different long booking identities keep distinct hash suffixes");
}

{
  // Core requires appointment.task_id, but staging can reuse a task only from
  // the already ownership-checked care plan. This avoids the live customer
  // Task-save 500 without ever borrowing a foreign customer's task.
  const calls = [];
  const reusableTask = {
    id: 7799,
    code: "CHS_STG_FACIAL_CHECKIN",
    project: { id: carePlan.id },
    type: careTaskType,
  };
  await createCoreAppointment(
    bookingInput("book-reuse-care-task"),
    context,
    bookingFetch(calls, { reusableTask }),
    origin,
  );
  assert.equal(calls.filter((call) => call.url.endsWith("/task/save.json")).length, 0);
  const appointmentSave = JSON.parse(calls.find((call) => call.url.endsWith("/appointment/save.json")).options.body).entities[0];
  assert.equal(appointmentSave.task.id, 7799);
}

{
  // A replay that finds an already scheduled appointment returns the readback
  // without saving or dispatching the confirmation event again.
  const calls = [];
  const replayInput = bookingInput("book-replay");
  const existingAppointment = {
    ...templateAppointment,
    id: 2051,
    code: "CP_DEMO_APPT_1042_BOOK_REPLAY",
    attributes: { 33: bookingAttributes(replayInput) },
  };
  const result = await createCoreAppointment(
    replayInput,
    context,
    bookingFetch(calls, { existingAppointment }),
    origin,
  );
  assert.equal(result.customerStatus, "Confirmed");
  assert.equal(calls.filter((call) => call.url.endsWith("/appointment/save.json")).length, 0);
  assert.equal(calls.filter((call) => call.url.includes("/send-event.json")).length, 0);
}

{
  // A 2xx event response is not confirmation. If the authoritative readback
  // remains REQUESTED, the saved row is exposed as a pending studio request,
  // never as a confirmed booking and never as if nothing was recorded.
  const result = await createCoreAppointment(
      bookingInput("book-unconfirmed"),
      context,
      bookingFetch([], { keepRequested: true }),
      origin,
  );
  assert.equal(result.customerStatus, "Requested");
  assert.equal(result.confirmationMode, "studio-request");
}

// Cancellation is a workflow event proven by readback, never by a 2xx.
function cancelFetch(calls, states) {
  let call = 0;
  return async (url, options) => {
    calls.push({ url, options });
    if (url.includes("/send-event.json")) return emptyResponse();
    call += 1;
    const stateCodes = call === 1 ? states.before : states.after;
    return json({ ...templateAppointment, states: stateCodes.map((code) => ({ code })) });
  };
}

{
  const calls = [];
  const result = await cancelCoreAppointment("appt-core-1050", context,
    cancelFetch(calls, { before: ["SCHEDULED"], after: ["CANCELLED"] }), origin);
  assert.equal(result.customerStatus, "Cancelled");
  assert.deepEqual(result.allowedActions, [], "a cancelled visit offers nothing further");
  const event = calls.find((call) => call.url.includes("/send-event.json"));
  assert.ok(event.url.endsWith("/appointment/1050/send-event.json?event=SCHEDULED-CANCELLED"));
}

{
  // Core accepting the event is not success: if the readback still says
  // scheduled, the command fails rather than claiming a cancellation.
  await assert.rejects(
    () => cancelCoreAppointment("appt-core-1050", context,
      cancelFetch([], { before: ["SCHEDULED"], after: ["SCHEDULED"] }), origin),
    (error) => error && error.code === "appointment-cancel-unconfirmed",
  );
}

{
  // Already cancelled is not an error, and sends no event.
  const calls = [];
  const result = await cancelCoreAppointment("appt-core-1050", context,
    cancelFetch(calls, { before: ["CANCELLED"], after: ["CANCELLED"] }), origin);
  assert.equal(result.customerStatus, "Cancelled");
  assert.equal(calls.filter((call) => call.url.includes("/send-event.json")).length, 0);
}

{
  // A completed visit cannot be called off.
  await assert.rejects(
    () => cancelCoreAppointment("appt-core-1050", context,
      cancelFetch([], { before: ["COMPLETED"], after: ["COMPLETED"] }), origin),
    (error) => error && error.code === "appointment-not-cancellable",
  );
}

{
  // Another customer's appointment is refused even with a valid route id.
  await assert.rejects(
    () => cancelCoreAppointment("appt-core-1050", context, async () =>
      json({ ...foreignAppointment, id: 1050 }), origin),
    (error) => error && error.code === "appointment-forbidden",
  );
}

{
  // Replaying a booking must not create a second task.
  const calls = [];
  const existingTask = { id: 7788, code: "CP_DEMO_APPT_1042_BOOK_2_TASK", type: careTaskType };
  await createCoreAppointment(
    bookingInput("book-2"),
    context, bookingFetch(calls, { existingTask }), origin,
  );
  assert.equal(calls.filter((call) => call.url.endsWith("/task/save.json")).length, 0);
}

{
  // A tenant missing the type fails with a named contract error rather than
  // silently borrowing a reference.
  await assert.rejects(
    () => createCoreAppointment(bookingInput("book-3"), context, async (url) => {
      if (url.includes("/appointment-type/list.json")) return json({ result: [] });
      if (url.includes("/task-type/list.json")) return json({ result: [careTaskType] });
      if (url.includes("/organization/list.json")) return json({ result: [organization] });
      if (url.includes("/project/list.json")) return json({ result: [carePlan] });
      if (url.includes("/appointment/list.json")) return json({ result: [] });
      throw new Error("unexpected request: " + url);
    }, origin),
    (error) => error && error.code === "appointment-type-missing",
  );
}

{
  const calls = [];
  const readback = { ...templateAppointment, start: "2026-07-30T14:30:00.000Z", end: "2026-07-30T15:30:00.000Z", optimistic: 4 };
  const result = await rescheduleCoreAppointment("appt-core-1050", { start: readback.start }, context, sequence([
    json(templateAppointment),
    json([1050]),
    json(readback),
  ], calls), origin);
  assert.equal(result.startIso, readback.start);
  const save = JSON.parse(calls[1].options.body).entities[0];
  assert.equal(save.id, 1050);
  assert.equal(save.optimistic, 3);
  assert.equal(save.end, "2026-07-30T15:30:00.000Z");
}

const spaOrderType = { id: 77, code: "SPA_ORDER", workflow: { id: 88, code: "SPA_ORDER_LIFECYCLE" } };
const usd = { id: 17, code: "USD" };

const itemWorkflow = { id: 99, code: "SPA_ORDER_ITEM_LIFECYCLE" };
const spaItemTypes = [
  { id: 101, code: "SPA_ITEM_SERVICE", workflow: itemWorkflow },
  { id: 102, code: "SPA_ITEM_RETAIL", workflow: itemWorkflow },
  { id: 103, code: "SPA_ITEM_PACKAGE", workflow: itemWorkflow },
  { id: 104, code: "SPA_ITEM_MEMBERSHIP", workflow: itemWorkflow },
];
// The line's SPA_ITEM_* type follows the PRODUCT's type, which lives in PIM.
const pimProducts = [
  { id: 5, code: "CHS_BODY_001", type: { id: 2, code: "SPA_RETAIL" } },
  { id: 12, code: "CHS_FACIAL", type: { id: 1, code: "SPA_SERVICE" } },
  { id: 30, code: "CHS_MYSTERY", type: { id: 9, code: "SPA_SOMETHING_NEW" } },
];

// Checkout resolves order type, organization, currency, product types and item
// types by code; the stub answers each lookup instead of handing back a row to
// clone.
function checkoutFetch(rows, calls) {
  let nextItemId = 9100;
  return async (url, options) => {
    if (calls) calls.push({ url, options });
    if (url.includes("/order-type/list.json")) return json({ result: [spaOrderType] });
    if (url.includes("/order-item-type/list.json")) return json({ result: spaItemTypes });
    if (url.includes("/organization/list.json")) return json({ result: [organization] });
    if (url.includes("/dictionary/list.json")) return json({ result: [usd] });
    if (url.includes("/order-item/list.json")) return json({ result: rows.itemReadback || [] });
    if (url.includes("/order-item/save.json")) return json([nextItemId++]);
    if (url.includes("/order/list.json")) return json({ result: rows.list || [] });
    if (url.includes("/order/save.json")) return json([8002]);
    if (url.includes("/order/get.json")) return json(rows.readback);
    throw new Error("unexpected request: " + url);
  };
}

const retailLine = { priceId: 77, productCode: "CHS_BODY_001", productId: 5, productTypeCode: "SPA_RETAIL", qty: 2, unitAmount: 42 };
const serviceLine = { priceId: 90, productCode: "CHS_FACIAL", productId: 12, productTypeCode: "SPA_SERVICE", qty: 1, unitAmount: 145 };
// What Core reports back for those lines. `amount` is the UNIT price.
const retailItemRow = { amount: 42, id: 9100, itemCount: 2, itemPrice: { id: 77 }, notes: "CHS_BODY_001", sortOrder: 1, type: { id: 102, code: "SPA_ITEM_RETAIL" } };
const serviceItemRow = { amount: 145, id: 9101, itemCount: 1, itemPrice: { id: 90 }, notes: "CHS_FACIAL", sortOrder: 2, type: { id: 101, code: "SPA_ITEM_SERVICE" } };

const templateOrder = {
  id: 7001, optimistic: 1, account: { id: 1042 }, currency: { id: 1, code: "USD" },
  organization: { id: 11 }, type: { id: 77, code: "SPA_ORDER" }, workflow: { id: 88, code: "SPA_ORDER_LIFECYCLE" },
  notes: "Grounding massage visit", grandTotal: 145, totalCharges: 145, totalTaxes: 0, states: [{ code: "OPEN" }],
  attributes: { 77: { RECORD_CODE: { value: "CHS_STG_ORDER_SERVICE" } } },
};

{
  // Order identity lives in the RECORD_CODE attribute, so one account-scoped
  // list serves both the idempotency check and the template lookup.
  const calls = [];
  const savedOrder = {
    ...templateOrder, id: 8002, optimistic: 0, notes: "Customer portal checkout",
    grandTotal: 70, totalCharges: 70,
    attributes: { 77: { RECORD_CODE: { value: "CP_DEMO_ORDER_1042_CART_1" } } },
  };
  const result = await createCoreOrder({ lines: [retailLine, serviceLine], requestRef: "cart-1" }, context,
    checkoutFetch({ itemReadback: [retailItemRow, serviceItemRow], list: [], readback: savedOrder }, calls), origin);
  assert.equal(result.ref, "order-core-8002");
  assert.equal(result.grandTotal, 70);
  assert.equal(calls.filter((call) => call.url.endsWith("/order/list.json")).length, 1);
  const save = JSON.parse(calls.find((call) => call.url.endsWith("/order/save.json")).options.body).entities[0];
  assert.equal(save.account.id, 1042);
  assert.equal(save.attributes[77].RECORD_CODE.value, "CP_DEMO_ORDER_1042_CART_1");
  assert.notEqual(save.notes, "CP_DEMO_ORDER_1042_CART_1", "notes must stay a human label, not an identity marker");
  assert.equal(save.type.id, 77, "order type resolved by code");
  assert.equal(save.workflow.id, 88, "workflow comes from the order type");
  assert.equal(save.organization.id, 11, "organization resolved by code");
  assert.equal(save.currency.id, 17, "currency resolved by code, not copied from a neighbouring order");

  // NO TOTALS. Core computes grandTotal from the lines; a client value is
  // ignored, and sending one would claim the portal owns pricing.
  assert.equal("grandTotal" in save, false, "the order save must not carry grandTotal");
  assert.equal("totalCharges" in save, false, "the order save must not carry totalCharges");
  assert.equal("totalTaxes" in save, false, "the order save must not carry totalTaxes");

  // One typed line per cart item, amount = the server's UNIT price.
  const itemSaves = calls.filter((call) => call.url.endsWith("/order-item/save.json"))
    .map((call) => JSON.parse(call.options.body).entities[0]);
  assert.equal(itemSaves.length, 2);
  assert.equal(itemSaves[0].type.id, 102, "a SPA_RETAIL product yields a SPA_ITEM_RETAIL line");
  assert.equal(itemSaves[0].amount, 42, "amount is the server unitAmount, never pre-multiplied");
  assert.equal(itemSaves[0].itemCount, 2);
  assert.equal(itemSaves[0].itemPrice.id, 77, "the line points at the cart item's own price");
  assert.equal(itemSaves[0].workflow.id, 99, "the line workflow comes from its own type");
  assert.equal(itemSaves[0].attributes[102].RECORD_CODE.value, "CP_DEMO_ORDER_1042_CART_1_L1");
  assert.equal(itemSaves[1].type.id, 101, "a SPA_SERVICE product yields a SPA_ITEM_SERVICE line");
  assert.equal(itemSaves[1].amount, 145);
  assert.equal(itemSaves[1].order.id, 8002, "lines attach to the order that was just created");

  // The readback is what the caller gets, and it reports units, not line totals
  // — Core exposes no per-line total, so none is invented.
  assert.deepEqual(result.lines.map((line) => [line.typeCode, line.unitAmount, line.itemCount]), [
    ["SPA_ITEM_RETAIL", 42, 2], ["SPA_ITEM_SERVICE", 145, 1],
  ]);
}

{
  // A product whose type has no SPA_ITEM_* mapping fails by name rather than
  // being filed under a guessed kind — and nothing is saved.
  const calls = [];
  await assert.rejects(
    () => createCoreOrder({
      lines: [{ priceId: 5, productCode: "CHS_MYSTERY", productId: 30, productTypeCode: "SPA_SOMETHING_NEW", qty: 1, unitAmount: 10 }],
      requestRef: "cart-mystery",
    }, context, checkoutFetch({ list: [] }, calls), origin),
    (error) => error && error.code === "order-item-type-unmapped",
  );
  assert.equal(calls.filter((call) => call.url.endsWith("/order/save.json")).length, 0,
    "an unmappable line must stop the order before anything is written");
}

{
  // A 2xx on the saves is not success: if Core does not report the lines back,
  // the command fails rather than claiming an order that has none.
  const savedOrder = {
    ...templateOrder, id: 8002, notes: "Customer portal checkout",
    attributes: { 77: { RECORD_CODE: { value: "CP_DEMO_ORDER_1042_CART_2" } } },
  };
  await assert.rejects(
    () => createCoreOrder({ lines: [retailLine, serviceLine], requestRef: "cart-2" }, context,
      checkoutFetch({ itemReadback: [retailItemRow], list: [], readback: savedOrder }), origin),
    (error) => error && error.code === "order-lines-unconfirmed",
  );
}

{
  // An empty cart is not a purchase.
  await assert.rejects(
    () => createCoreOrder({ lines: [], requestRef: "cart-empty" }, context, checkoutFetch({ list: [] }), origin),
    (error) => error && error.code === "order-lines-required",
  );
}

{
  // Replaying the same requestRef must return the existing order, never save again.
  const calls = [];
  const existing = {
    ...templateOrder, id: 8002, grandTotal: 70, totalCharges: 70,
    attributes: { 77: { RECORD_CODE: { value: "CP_DEMO_ORDER_1042_CART_1" } } },
  };
  const result = await createCoreOrder({ lines: [retailLine], requestRef: "cart-1" }, context,
    checkoutFetch({ itemReadback: [retailItemRow], list: [existing] }, calls), origin);
  assert.equal(result.ref, "order-core-8002");
  assert.equal(calls.filter((call) => call.url.endsWith("/order/save.json")).length, 0);
}

{
  // Orders written before RECORD_CODE existed are still recognised by `notes`.
  const calls = [];
  const legacy = { ...templateOrder, id: 8003, notes: "CP_DEMO_ORDER_1042_CART_9", attributes: {} };
  const result = await createCoreOrder({ lines: [retailLine], requestRef: "cart-9" }, context,
    checkoutFetch({ itemReadback: [retailItemRow], list: [legacy] }, calls), origin);
  assert.equal(result.ref, "order-core-8003");
  assert.equal(calls.filter((call) => call.url.endsWith("/order/save.json")).length, 0);
}

assert.throws(
  () => rescheduleCoreAppointment("1050", { start: "2026-07-30T14:30:00.000Z" }, context, async () => json({}), origin),
  (error) => error && error.code === "invalid-appointment-ref",
);

await assert.rejects(
  () => loadCoreAppointments(context, async () => ({ ok: false, status: 401, async json() { return {}; } }), origin),
  (error) => error && error.code === "session-expired",
);

await assert.rejects(
  () => rescheduleCoreAppointment("appt-core-1050", { start: "2026-07-30T14:30:00.000Z" }, context, async () => ({ ok: false, status: 409, async json() { return {}; } }), origin),
  (error) => error && error.code === "conflict",
);

console.log("core-spa-demo-adapter-check ok: live Appointment/Order writes are single-flight and confirmed by readback");

function json(value) {
  return { ok: true, status: 200, async json() { return structuredClone(value); } };
}

function errorJson(status) {
  return { ok: false, status, async json() { return {}; } };
}

function emptyResponse(status = 200) {
  return { ok: true, status, async json() { throw new SyntaxError("empty response"); } };
}

function sequence(responses, calls = []) {
  let index = 0;
  return async function fetch(url, options) {
    calls.push({ url, options });
    const response = responses[index++];
    if (!response) throw new Error("Unexpected fetch call " + url);
    return response;
  };
}
