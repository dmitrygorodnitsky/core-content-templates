import { state } from "./state.js";
import { routeRegistry } from "./config.js";

var OUTCOME_STORAGE_KEY = "portal-request-link-done";
var UNREACHABLE_STATUSES = [502, 503, 504];
var RECORDED_STATUS = 404;
var READBACK_DELAYS = [400, 800, 1500, 2500, 4000];
var REFUSED_READBACK_DELAYS = [400, 1200];

export function captureRequestLink(routeId, raw) {
  var route = routeRegistry[routeId];
  if (!route || !route.requestEvent) return null;
  var token = tokenFrom(raw);
  var current = state.requestLink;
  if (token) {
    if (!current || current.token !== token) state.requestLink = { route: routeId, event: route.requestEvent, token: token, phase: "prompt", sent: false };
  } else if (!current || current.route !== routeId) {
    state.requestLink = { route: routeId, event: route.requestEvent, token: "", phase: remembered(routeId) ? "done" : "invalid", sent: false };
  }
  return state.requestLink;
}

export function sendRequestLink(options) {
  var link = state.requestLink;
  if (!link || !link.token || (link.phase !== "prompt" && link.phase !== "failed")) return false;
  var run = runner(link, options);
  link.phase = "pending";
  run.post().then(function (status) {
    if (status === null || UNREACHABLE_STATUSES.indexOf(status) !== -1) return run.settle("failed");
    if (status === RECORDED_STATUS) return run.settle("invalid");
    link.sent = true;
    var accepted = status >= 200 && status < 300;
    return run.readBack(accepted ? READBACK_DELAYS : REFUSED_READBACK_DELAYS, accepted ? "unconfirmed" : "invalid");
  });
  return true;
}

export function checkRequestLink(options) {
  var link = state.requestLink;
  if (!link || !link.token || !link.sent || link.phase !== "unconfirmed") return false;
  link.phase = "pending";
  runner(link, options).readBack(READBACK_DELAYS, "unconfirmed");
  return true;
}

function runner(link, options) {
  var settings = options || {};
  var send = settings.fetch || globalThis.fetch;
  var wait = settings.wait || function (milliseconds) { return new Promise(function (resolve) { setTimeout(resolve, milliseconds); }); };
  var url = cmsBase() + "/api/form/send-event/" + encodeURIComponent(link.token) + ".json";
  function post() {
    return Promise.resolve().then(function () {
      return send(url, { method: "POST", credentials: "omit", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: "{}" });
    }).then(function (response) {
      return response && typeof response.status === "number" ? response.status : null;
    }, function () {
      return null;
    });
  }
  function settle(phase) {
    if (state.requestLink !== link) return phase;
    link.phase = phase;
    if (phase === "done" || phase === "invalid") link.token = "";
    if (phase === "done") remember(link.route, settings.storage);
    if (settings.onChange) settings.onChange();
    return phase;
  }
  function readBack(delays, otherwise) {
    return delays.reduce(function (earlier, delay) {
      return earlier.then(function (recorded) {
        if (recorded) return true;
        return wait(delay).then(post).then(function (status) { return status === RECORDED_STATUS; });
      });
    }, Promise.resolve(false)).then(function (recorded) {
      return settle(recorded ? "done" : otherwise);
    });
  }
  return { post: post, settle: settle, readBack: readBack };
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
