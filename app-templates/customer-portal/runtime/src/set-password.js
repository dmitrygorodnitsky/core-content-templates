import { state } from "./state.js";

export const PASSWORD_MIN_LENGTH = 6;

export const SET_PASSWORD_COPY = Object.freeze({
  short: "Use at least " + PASSWORD_MIN_LENGTH + " characters.",
  missing: "Choose a password.",
  mismatch: "The two passwords don’t match.",
  unreachable: "We couldn’t reach the server. Check your connection and try again.",
  refused: "We couldn’t set this password. Try again in a few minutes.",
});

var USED_KEY_MESSAGE = "Invalid credentials specified";
var UNKNOWN_USER_MESSAGE = "Invalid user specified";
var PASSWORD_RULE = /^password\b/i;

var entry = { password: "", confirm: "" };

export function captureSetPassword(routeId, raw) {
  if (routeId !== "auth.setPassword") return null;
  var link = linkFrom(raw);
  var current = state.setPassword;
  if (link.login && link.key) {
    if (!current || current.login !== link.login || current.key !== link.key) {
      entry = { password: "", confirm: "" };
      state.setPassword = { login: link.login, key: link.key, phase: "prompt", errors: {}, message: "" };
    }
  } else if (!current) {
    state.setPassword = { login: link.login, key: "", phase: "invalid", errors: {}, message: "" };
  }
  return state.setPassword;
}

export function setPasswordEntry() {
  return entry;
}

export function changeSetPasswordEntry(field, value) {
  var link = state.setPassword;
  if (!link || link.phase !== "prompt" || (field !== "password" && field !== "confirm")) return false;
  entry[field] = String(value == null ? "" : value);
  delete link.errors[field];
  return true;
}

export function validateSetPassword(values) {
  var errors = {};
  if (!values.password) errors.password = SET_PASSWORD_COPY.missing;
  else if (values.password.length < PASSWORD_MIN_LENGTH) errors.password = SET_PASSWORD_COPY.short;
  if (!errors.password && values.confirm !== values.password) errors.confirm = SET_PASSWORD_COPY.mismatch;
  return errors;
}

export function submitSetPassword(options) {
  var settings = options || {};
  var link = state.setPassword;
  var changed = settings.onChange || function () {};
  if (!link || link.phase !== "prompt" || !link.key) return Promise.resolve(false);
  var errors = validateSetPassword(entry);
  link.message = "";
  if (Object.keys(errors).length) {
    link.errors = errors;
    changed("invalid");
    return Promise.resolve(false);
  }
  var send = settings.fetch || globalThis.fetch;
  link.errors = {};
  link.phase = "pending";
  changed("pending");
  return Promise.resolve()
    .then(function () {
      return send(coreBase() + "/api/user/reset-password.json", {
        method: "POST",
        credentials: "omit",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ user: link.login, key: link.key, password: entry.password }),
      });
    })
    .then(function (response) {
      if (response && response.ok) return { ok: true, message: "" };
      return Promise.resolve(response && typeof response.json === "function" ? response.json() : null)
        .then(function (body) { return { ok: false, message: body && typeof body.message === "string" ? body.message : "" }; }, function () { return { ok: false, message: "" }; });
    }, function () {
      return null;
    })
    .then(function (result) {
      if (state.setPassword !== link) return false;
      if (!result) return settle(link, "prompt", { message: SET_PASSWORD_COPY.unreachable }, changed, "failed");
      if (result.ok) {
        entry = { password: "", confirm: "" };
        link.key = "";
        return settle(link, "done", {}, changed, "done");
      }
      if (result.message === USED_KEY_MESSAGE || result.message === UNKNOWN_USER_MESSAGE) {
        entry = { password: "", confirm: "" };
        link.key = "";
        return settle(link, "expired", {}, changed, "expired");
      }
      if (PASSWORD_RULE.test(result.message)) return settle(link, "prompt", { errors: { password: result.message } }, changed, "invalid");
      return settle(link, "prompt", { message: SET_PASSWORD_COPY.refused }, changed, "failed");
    });
}

function settle(link, phase, patch, changed, outcome) {
  link.phase = phase;
  link.errors = patch.errors || {};
  link.message = patch.message || "";
  changed(outcome);
  return outcome === "done";
}

function coreBase() {
  return String(state.config.coreApiBase || "/core").replace(/\/+$/, "");
}

function linkFrom(raw) {
  var text = String(raw || "");
  var index = text.indexOf("?");
  var query = new URLSearchParams(index === -1 ? "" : text.slice(index + 1));
  return { login: String(query.get("login") || "").trim(), key: String(query.get("key") || "").trim() };
}
