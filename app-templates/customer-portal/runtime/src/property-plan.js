import "../client-review/plan.js";
import { state } from "./state.js";

var MEDIA_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
var plans = new Map();

export function propertyPlan(planId, onChange, fetchImpl) {
  if (!MEDIA_ID.test(String(planId || ""))) return null;
  var entry = plans.get(planId);
  if (entry) return entry;
  entry = { status: "loading", plan: null };
  plans.set(planId, entry);
  readPlan(planId, fetchImpl || globalThis.fetch).then(function (raw) {
    var plan = globalThis.ClientReview.plan.parse(raw, "en");
    entry.status = plan ? "ready" : "unavailable";
    entry.plan = plan;
  }, function () {
    entry.status = "unavailable";
  }).then(function () {
    if (typeof onChange === "function") onChange();
  });
  return entry;
}

function readPlan(planId, fetchImpl) {
  var base = String(state.config.coreApiBase || "/core").replace(/\/+$/, "");
  return Promise.resolve(fetchImpl(base + "/media/" + planId + "/stream.json", {
    method: "GET",
    credentials: "omit",
    referrerPolicy: "no-referrer",
    headers: { Accept: "application/json" },
  })).then(function (response) {
    if (!response || !response.ok) throw new Error("The property plan could not be read");
    return response.json();
  });
}
