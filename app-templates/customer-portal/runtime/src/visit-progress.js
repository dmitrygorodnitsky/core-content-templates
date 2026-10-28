import { readVisitTransitions } from "./adapters/core-snow-adapter.js";
import { normalizeVisitProgress } from "./normalizers/visits.js";
import { state } from "./state.js";
import { coreSessionFetch } from "./adapters/core-oidc-adapter.js";

var progress = new Map();

export function visitProgress(visit, onChange, fetchImpl) {
  if (!visit || !visit.backendId) return null;
  var account = state.customerAccount && state.customerAccount.id;
  var key = [account, visit.backendId, visit.stateCode].join(":");
  var entry = progress.get(key);
  if (entry) return entry;
  entry = { status: "loading", steps: [] };
  progress.set(key, entry);
  readVisitTransitions({ config: state.config, state: state }, visit.backendId, fetchImpl || coreSessionFetch).then(function (rows) {
    entry.steps = normalizeVisitProgress(rows);
    entry.status = "ready";
  }, function () {
    entry.status = "unavailable";
  }).then(function () {
    if (typeof onChange === "function") onChange();
  });
  return entry;
}
