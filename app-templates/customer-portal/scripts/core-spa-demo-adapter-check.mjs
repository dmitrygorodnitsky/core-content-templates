import assert from "node:assert/strict";
import {
  coreSpaDemoContract,
  createCoreAppointment,
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
    session: { accessToken: "test-token", tokenType: "Bearer" },
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
};

{
  const calls = [];
  const result = await loadCoreAppointments(context, async (url, options) => {
    calls.push({ url, options });
    return json({ resultSize: 1, result: [templateAppointment] });
  }, origin);
  assert.equal(result.state, "ready");
  assert.equal(result.scopeMode, "tenant-demo-unscoped");
  assert.equal(result.next.ref, "appt-core-1050");
  assert.deepEqual(result.next.allowedActions, ["reschedule"]);
  assert.equal(result.next.customerStatus, "Confirmed");
  assert.equal(calls[0].url, origin + "/core-svc/api/appointment/list.json");
  const body = JSON.parse(calls[0].options.body);
  assert.deepEqual(body.filters, [{ type: "STRING", operator: "=", property: "type.code", value: "SPA_VISIT" }]);
  assert.deepEqual(body.mappings, coreSpaDemoContract.appointmentMappings);
}

{
  const calls = [];
  const fetch = sequence([
    json({ result: [] }),
    json({ result: [templateAppointment] }),
    json([2051]),
    json({ ...templateAppointment, id: 2051, optimistic: 0, code: "CP_DEMO_APPT_BOOK_1", nls: { en: { NAME: "Grounding massage" } } }),
  ], calls);
  const input = { requestRef: "book-1", serviceName: "Grounding massage", start: "2026-07-29T15:00:00.000Z", durationMinutes: 60 };
  const [first, duplicate] = await Promise.all([
    createCoreAppointment(input, context, fetch, origin),
    createCoreAppointment(input, context, fetch, origin),
  ]);
  assert.deepEqual(first, duplicate, "same entity command must share one in-flight promise");
  assert.equal(first.ref, "appt-core-2051");
  assert.equal(calls.filter((call) => call.url.endsWith("/appointment/save.json")).length, 1);
  const save = JSON.parse(calls.find((call) => call.url.endsWith("/appointment/save.json")).options.body).entities[0];
  assert.equal(save.code, "CP_DEMO_APPT_BOOK_1");
  assert.equal(save.nls.en.NAME, "Grounding massage");
  assert.equal(save.type.id, 33);
  assert.equal(save.workflow.id, 44);
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

{
  const calls = [];
  const templateOrder = {
    id: 7001, optimistic: 1, account: { id: 1042 }, currency: { id: 1, code: "USD" },
    organization: { id: 11 }, type: { id: 77, code: "SPA_SERVICE_ORDER" }, workflow: { id: 88, code: "SPA_ORDER_LIFECYCLE" },
    notes: "CHS_STG_ORDER_1042", grandTotal: 145, totalCharges: 145, totalTaxes: 0, states: [{ code: "OPEN" }],
  };
  const savedOrder = { ...templateOrder, id: 8002, optimistic: 0, notes: "CP_DEMO_ORDER_1042_CART_1", grandTotal: 70, totalCharges: 70 };
  const result = await createCoreOrder({ requestRef: "cart-1", total: 70 }, context, sequence([
    json({ result: [] }),
    json({ result: [templateOrder] }),
    json([8002]),
    json(savedOrder),
  ], calls), origin);
  assert.equal(result.ref, "order-core-8002");
  assert.equal(result.grandTotal, 70);
  const save = JSON.parse(calls[2].options.body).entities[0];
  assert.equal(save.account.id, 1042);
  assert.equal(save.notes, "CP_DEMO_ORDER_1042_CART_1");
  assert.equal(save.workflow.id, 88);
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
