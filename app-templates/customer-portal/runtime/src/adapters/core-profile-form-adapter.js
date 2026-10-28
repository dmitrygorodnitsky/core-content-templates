import { positiveInteger, text } from "../normalizers/core-record.js";

export const PROFILE_FORM = Object.freeze({ typeCode: "CUSTOMER_PROFILE_UPDATE", preference: "SNOW_CUSTOMER_PROFILE_UPDATE" });
export const LOGIN_FORM = Object.freeze({ typeCode: "CUSTOMER_LOGIN_CHANGE", preference: "SNOW_CUSTOMER_LOGIN_CHANGE" });
export const INVOICE_PAYMENT_FORM = Object.freeze({ typeCode: "CUSTOMER_INVOICE_PAYMENT", preference: "SNOW_CUSTOMER_INVOICE_PAYMENT" });

const OUTCOMES = Object.freeze(["APPLIED", "REFUSED", "FAILED"]);
const FORM_LOCALE = "en";
const POLL_INTERVAL_MS = 1000;
const OUTCOME_TIMEOUT_MS = 45000;

export function createCoreProfileFormAdapter(options = {}) {
  var fetchImpl = options.fetch || globalThis.fetch;
  if (typeof fetchImpl !== "function") throw coded("fetch-unavailable", "Core profile form adapter requires fetch");
  var wait = options.wait || function (ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); };
  var now = options.now || function () { return Date.now(); };
  var pollInterval = options.pollIntervalMs || POLL_INTERVAL_MS;
  var timeout = options.timeoutMs || OUTCOME_TIMEOUT_MS;
  var typeIds = {};

  async function formTypeId(form, api) {
    if (typeIds[form.typeCode]) return typeIds[form.typeCode];
    var type = await requestJson(fetchImpl, api.origin + "/" + FORM_LOCALE + api.cmsPath + "/api/form-type/" + encodeURIComponent(form.typeCode) + "/get.json", {
      method: "GET",
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    }, "form-type-unavailable");
    var id = positiveInteger(type && type.id);
    if (!id || text(type.code) !== form.typeCode) throw coded("form-type-unavailable", "Core did not answer the " + form.typeCode + " form type");
    typeIds[form.typeCode] = id;
    return id;
  }

  var adapter = {
    async submit(form, values, context) {
      var api = requestContext(context);
      var typeId = await formTypeId(form, api);
      var attributes = {};
      Object.keys(values).forEach(function (code) { attributes[code] = { value: values[code] }; });
      var formId = await requestJson(fetchImpl, api.cmsBase + "/api/form/submit.json", {
        method: "POST",
        credentials: "same-origin",
        headers: api.headers({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          type: { id: typeId },
          organization: { id: api.organizationId },
          attributes: { [String(typeId)]: attributes },
          metadata: { language: FORM_LOCALE },
        }),
      }, "profile-submit-failed");
      var id = positiveInteger(formId);
      if (!id) throw coded("profile-submit-failed", "Core accepted the form without a form id");
      return id;
    },

    async outcome(form, formId, context) {
      var reported = await adapter.report(form, formId, context, OUTCOMES);
      return {
        outcome: reported.outcome,
        field: text(reported.field) || null,
        message: text(reported.message),
        changed: Array.isArray(reported.changed) ? reported.changed.map(text).filter(Boolean) : [],
      };
    },

    async report(form, formId, context, outcomes) {
      var api = requestContext(context);
      var deadline = now() + timeout;
      while (true) {
        var preferences = await requestJson(fetchImpl, api.coreBase + "/api/user/preferences.json", {
          method: "GET",
          credentials: "same-origin",
          headers: api.headers({}),
        }, "outcome-unreadable");
        var reported = parsed(preferences && preferences[form.preference]);
        if (reported && positiveInteger(reported.form) === formId && outcomes.indexOf(reported.outcome) !== -1) return reported;
        if (now() >= deadline) throw coded("outcome-unknown", "Core did not report the outcome of form " + formId + " in time");
        await wait(pollInterval);
      }
    },
  };
  return adapter;
}

function parsed(value) {
  if (typeof value !== "string" || !value) return null;
  try {
    var result = JSON.parse(value);
    return result && typeof result === "object" ? result : null;
  } catch (_) {
    return null;
  }
}

export function requestContext(context) {
  var config = context && context.config || {};
  var session = context && context.state && context.state.session || {};
  var accessToken = text(session.accessToken || session.access_token);
  if (!accessToken) throw coded("session-expired", "A Core access token is required");
  var organization = text(config.organization);
  var organizationId = positiveInteger(session.organizationId);
  if (!organization || !organizationId) throw coded("organization-required", "The portal organization and its id are required");
  var origin = config.origin || (globalThis.location && globalThis.location.origin) || "";
  var cmsBase = sameOriginBase(config.cmsApiBase || "/core-cms", origin, "Core CMS API base");
  var authorization = text(session.tokenType || session.token_type || "Bearer") + " " + accessToken;
  return {
    origin: new URL(origin).origin,
    cmsBase: cmsBase,
    cmsPath: new URL(cmsBase).pathname.replace(/\/+$/, ""),
    coreBase: sameOriginBase(config.coreApiBase || "/core", origin, "Core API base"),
    organizationId: organizationId,
    headers: function (extra) {
      return Object.assign({ Authorization: authorization, Accept: "application/json", "X-Organization-Code": organization }, extra);
    },
  };
}

async function requestJson(fetchImpl, url, options, failureCode) {
  var response = await fetchImpl(url, options);
  if (!response || typeof response.ok !== "boolean") throw coded(failureCode, "Core request returned an invalid response");
  if (!response.ok) {
    var failure = coded(response.status === 401 ? "session-expired" : failureCode, "Core request failed with HTTP " + response.status);
    failure.status = response.status;
    throw failure;
  }
  try {
    return await response.json();
  } catch (_) {
    throw coded(failureCode, "Core response was not valid JSON");
  }
}

function sameOriginBase(value, origin, label) {
  if (!origin) throw coded("origin-required", label + " requires a browser origin");
  var target = new URL(String(value || ""), origin);
  if (target.origin !== new URL(origin).origin) throw coded("cross-origin-service", label + " must be same-origin");
  return target.href.replace(/\/+$/, "");
}

function coded(code, message) {
  var error = new Error(message);
  error.code = code;
  return error;
}
