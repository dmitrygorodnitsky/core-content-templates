import { state } from "./state.js";
import { routeRegistry } from "./config.js";

var OUTCOME_STORAGE_KEY = "portal-request-link-done";
var UNREACHABLE_STATUSES = [502, 503, 504];

export function captureRequestLink(routeId, raw) {
  var route = routeRegistry[routeId];
  if (!route || !route.requestEvent) return null;
  var token = tokenFrom(raw);
  var current = state.requestLink;
  if (token) {
    if (!current || current.token !== token) state.requestLink = { route: routeId, event: route.requestEvent, token: token, phase: "ready" };
  } else if (!current || current.route !== routeId) {
    state.requestLink = { route: routeId, event: route.requestEvent, token: "", phase: remembered(routeId) ? "done" : "invalid" };
  }
  return state.requestLink;
}

export function runRequestLink(options) {
  var link = state.requestLink;
  if (!link || link.phase !== "ready") return link;
  var settings = options || {};
  var send = settings.fetch || globalThis.fetch;
  link.phase = "pending";
  var settle = function (phase) {
    if (state.requestLink !== link) return;
    link.phase = phase;
    if (phase !== "failed") link.token = "";
    if (phase === "done") remember(link.route, settings.storage);
    if (settings.onChange) settings.onChange();
  };
  Promise.resolve().then(function () {
    return send(cmsBase() + "/api/form/send-event/" + encodeURIComponent(link.token) + ".json", {
      method: "POST",
      credentials: "omit",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: "{}",
    });
  }).then(function (response) {
    settle(response && response.ok ? "done" : response && UNREACHABLE_STATUSES.indexOf(response.status) !== -1 ? "failed" : "invalid");
  }, function () {
    settle("failed");
  });
  return link;
}

export function retryRequestLink() {
  var link = state.requestLink;
  if (!link || link.phase !== "failed" || !link.token) return false;
  link.phase = "ready";
  return true;
}

function cmsBase() {
  return String(state.config.cmsApiBase || "/core-cms").replace(/\/+$/, "");
}

function tokenFrom(raw) {
  var text = String(raw || "");
  var index = text.indexOf("?");
  if (index === -1) return "";
  var token = new URLSearchParams(text.slice(index + 1)).get("token");
  return token ? token.trim() : "";
}

function sessionStore(storage) {
  try {
    return storage || globalThis.sessionStorage || null;
  } catch (_) {
    return null;
  }
}

function remembered(routeId) {
  var store = sessionStore();
  try {
    return !!store && store.getItem(OUTCOME_STORAGE_KEY) === routeId;
  } catch (_) {
    return false;
  }
}

function remember(routeId, storage) {
  var store = sessionStore(storage);
  try {
    if (store) store.setItem(OUTCOME_STORAGE_KEY, routeId);
  } catch (_) {
    return;
  }
}
