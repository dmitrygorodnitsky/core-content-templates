import assert from "node:assert/strict";
import {
  coreSpaDemoContract,
  createCoreAppointment,
  cancelCoreAppointment,
  createCoreOrder,
  loadCoreAppointments,
  rescheduleCoreAppointment,
} from "../runtime/src/adapters/core-spa-demo-adapter.js";

const origin = "https://dev-1.servicewand.com";
const context = {
  config: {
    origin,
    organization: "CALM_HARBOR_SPA_STAGING",
    serviceApiBase: "/core-svc",
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

{
  const calls = [];
  const result = await loadCoreAppointments(context, async (url, options) => {
    calls.push({ url, options });
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
}

{
  // With no resolved customer account the list is empty, never the tenant's.
  const bare = { ...context, state: { ...context.state, customerAccount: {} } };
  const result = await loadCoreAppointments(bare, async () =>
    json({ resultSize: 2, result: [templateAppointment, foreignAppointment] }), origin);
  assert.equal(result.state, "empty");
  assert.equal(result.items.length, 0);
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
  return async (url, options) => {
    calls.push({ url, options });
    if (url.includes("/appointment-type/list.json")) return json({ result: [visitType] });
    if (url.includes("/task-type/list.json")) return json({ result: [careTaskType] });
    if (url.includes("/organization/list.json")) return json({ result: [organization] });
    if (url.includes("/project/list.json")) return json({ result: [carePlan] });
    if (url.includes("/task/list.json")) return json({ result: overrides.existingTask ? [overrides.existingTask] : [] });
    if (url.includes("/task/save.json")) return json([7788]);
    if (url.includes("/appointment/list.json")) return json({ result: overrides.existingAppointment ? [overrides.existingAppointment] : [] });
    if (url.includes("/appointment/save.json")) return json([2051]);
    if (url.includes("/appointment/get.json")) {
      return json({ ...templateAppointment, id: 2051, optimistic: 0, code: "CP_DEMO_APPT_BOOK_1", nls: { en: { NAME: "Grounding massage" } } });
    }
    throw new Error("unexpected request: " + url);
  };
}

{
  const calls = [];
  const input = { requestRef: "book-1", serviceName: "Grounding massage", start: "2026-07-29T15:00:00.000Z", durationMinutes: 60 };
  const [first, duplicate] = await Promise.all([
    createCoreAppointment(input, context, bookingFetch(calls), origin),
    createCoreAppointment(input, context, bookingFetch(calls), origin),
  ]);
  assert.deepEqual(first, duplicate, "same entity command must share one in-flight promise");
  assert.equal(first.ref, "appt-core-2051");
  assert.equal(calls.filter((call) => call.url.endsWith("/appointment/save.json")).length, 1);

  const save = JSON.parse(calls.find((call) => call.url.endsWith("/appointment/save.json")).options.body).entities[0];
  assert.equal(save.code, "CP_DEMO_APPT_BOOK_1");
  assert.equal(save.nls.en.NAME, "Grounding massage");
  assert.equal(save.type.id, 33, "type resolved by code, not copied off another row");
  assert.equal(save.workflow.id, 44, "workflow comes from the type it belongs to");
  assert.equal(save.organization.id, 11, "organization resolved by code");
  // A booked visit must carry the link the read path filters on, or it would
  // vanish from the customer's own list.
  assert.equal(save.attributes[33].CUSTOMER_ACCOUNT.value, 1042);
  assert.equal(save.attributes[33].CUSTOMER_USER.value, 33);

  // appointment.task_id is NOT NULL: booking creates its own task instead of
  // pointing at another visit's.
  const taskSave = JSON.parse(calls.find((call) => call.url.endsWith("/task/save.json")).options.body).entities[0];
  assert.equal(taskSave.code, "CP_DEMO_APPT_BOOK_1_TASK");
  assert.equal(taskSave.type.id, 27);
  assert.equal(taskSave.workflow.id, 28);
  assert.equal(taskSave.attributes[27].CUSTOMER_ACCOUNT.value, 1042);
  assert.equal(save.task.id, 7788, "the appointment hangs off the task just created");
}

// Cancellation is a workflow event proven by readback, never by a 2xx.
function cancelFetch(calls, states) {
  let call = 0;
  return async (url, options) => {
    calls.push({ url, options });
    if (url.includes("/send-event.json")) return json({});
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
  const existingTask = { id: 7788, code: "CP_DEMO_APPT_BOOK_2_TASK", type: careTaskType };
  await createCoreAppointment(
    { requestRef: "book-2", serviceName: "Grounding massage", start: "2026-07-29T15:00:00.000Z" },
    context, bookingFetch(calls, { existingTask }), origin,
  );
  assert.equal(calls.filter((call) => call.url.endsWith("/task/save.json")).length, 0);
}

{
  // A tenant missing the type fails with a named contract error rather than
  // silently borrowing a reference.
  await assert.rejects(
    () => createCoreAppointment({ requestRef: "book-3", start: "2026-07-29T15:00:00.000Z" }, context, async (url) => {
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

// Checkout resolves order type, organization and currency by code; the stub
// answers each lookup instead of handing back a row to clone.
function checkoutFetch(rows, calls) {
  return async (url, options) => {
    if (calls) calls.push({ url, options });
    if (url.includes("/order-type/list.json")) return json({ result: [spaOrderType] });
    if (url.includes("/organization/list.json")) return json({ result: [organization] });
    if (url.includes("/dictionary/list.json")) return json({ result: [usd] });
    if (url.includes("/order/list.json")) return json({ result: rows.list || [] });
    if (url.includes("/order/save.json")) return json([8002]);
    if (url.includes("/order/get.json")) return json(rows.readback);
    throw new Error("unexpected request: " + url);
  };
}

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
  const result = await createCoreOrder({ requestRef: "cart-1", total: 70 }, context,
    checkoutFetch({ list: [], readback: savedOrder }, calls), origin);
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
}

{
  // Replaying the same requestRef must return the existing order, never save again.
  const calls = [];
  const existing = {
    ...templateOrder, id: 8002, grandTotal: 70, totalCharges: 70,
    attributes: { 77: { RECORD_CODE: { value: "CP_DEMO_ORDER_1042_CART_1" } } },
  };
  const result = await createCoreOrder({ requestRef: "cart-1", total: 70 }, context,
    checkoutFetch({ list: [existing] }, calls), origin);
  assert.equal(result.ref, "order-core-8002");
  assert.equal(calls.filter((call) => call.url.endsWith("/order/save.json")).length, 0);
}

{
  // Orders written before RECORD_CODE existed are still recognised by `notes`.
  const calls = [];
  const legacy = { ...templateOrder, id: 8003, notes: "CP_DEMO_ORDER_1042_CART_9", attributes: {} };
  const result = await createCoreOrder({ requestRef: "cart-9", total: 70 }, context,
    checkoutFetch({ list: [legacy] }, calls), origin);
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

function sequence(responses, calls = []) {
  let index = 0;
  return async function fetch(url, options) {
    calls.push({ url, options });
    const response = responses[index++];
    if (!response) throw new Error("Unexpected fetch call " + url);
    return response;
  };
}
