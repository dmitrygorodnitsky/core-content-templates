import { positiveInteger, text } from "../normalizers/core-record.js";

const CODE_MAPPINGS = [{ name: "id" }, { name: "code" }];

const PROFILE_MAPPINGS = [
  { name: "id" },
  { name: "nls" },
  { key: "id", mappings: [{ name: "id" }], name: "user", type: "identifier" },
  {
    mappings: [
      { name: "id" },
      { name: "firstName" },
      { name: "lastName" },
      { name: "title" },
      { key: "id", mappings: CODE_MAPPINGS, name: "type", type: "identifier" },
      {
        mappings: [
          { name: "id" },
          { name: "value" },
          { key: "id", mappings: CODE_MAPPINGS, name: "type", type: "identifier" },
        ],
        name: "contactEntries",
        type: "collection",
      },
    ],
    name: "contacts",
    type: "collection",
  },
  {
    mappings: [
      { name: "id" },
      { mappings: CODE_MAPPINGS, name: "types", type: "collection" },
      {
        key: "id",
        mappings: [
          { name: "id" },
          { name: "address1" },
          { name: "address2" },
          { name: "city" },
          { name: "postalCode" },
          { key: "id", mappings: CODE_MAPPINGS, name: "state", type: "identifier" },
        ],
        name: "address",
        type: "identifier",
      },
    ],
    name: "addresses",
    type: "collection",
  },
];

export function createCoreAccountProfileAdapter(options = {}) {
  var fetchImpl = options.fetch || globalThis.fetch;
  if (typeof fetchImpl !== "function") throw coded("fetch-unavailable", "Core account profile adapter requires fetch");
  return {
    async load(moduleId, context) {
      if (moduleId !== "profile") throw coded("unsupported-module", "Core account profile adapter cannot load " + moduleId);
      return loadCustomerAccountProfile(context, fetchImpl, options.origin);
    },
  };
}

export async function loadCustomerAccountProfile(context, fetchImpl = globalThis.fetch, explicitOrigin) {
  var api = requestContext(context, explicitOrigin);
  var reply = await requestJson(fetchImpl, api.accountBase + "/api/account/list.json", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      Authorization: api.authorization,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Organization-Code": api.organization,
    },
    body: JSON.stringify({
      filters: [
        { type: "INTEGER", operator: "=", property: "id", value: String(api.accountId) },
        { type: "INTEGER", operator: "=", property: "user.id", value: String(api.userId) },
      ],
      mappings: PROFILE_MAPPINGS,
      offset: 0,
      pageSize: 2,
    }),
  });
  var rows = Array.isArray(reply && reply.result) ? reply.result : [];
  var owned = rows.filter(function (row) { return ownedBySession(row, api); });
  if (!owned.length) throw coded("profile-unavailable", "Core did not return the signed-in customer's Account");
  return { account: owned[0], scopeMode: owned.length === rows.length ? "server-scoped" : "browser-filtered" };
}

function ownedBySession(row, api) {
  if (!row || typeof row !== "object" || positiveInteger(row.id) !== api.accountId) return false;
  var linked = row.user && typeof row.user === "object" ? positiveInteger(row.user.id) : null;
  return linked === null || linked === api.userId;
}

function requestContext(context, explicitOrigin) {
  var config = context && context.config || {};
  var runtimeState = context && context.state || {};
  var session = runtimeState.session || {};
  var accessToken = text(session.accessToken || session.access_token);
  if (!accessToken) throw coded("session-required", "A Core access token is required");
  var userId = positiveInteger(session.userId);
  if (!userId) throw coded("session-user-required", "The signed-in Core User is required");
  var account = runtimeState.customerAccount || session.account || null;
  var accountId = positiveInteger(account && account.id);
  if (!accountId) throw coded("customer-unresolved", "A resolved customer Account is required before reading its profile");
  var organization = text(config.organization);
  if (!organization) throw coded("organization-required", "A portal organization code is required");
  var origin = explicitOrigin || config.origin || (globalThis.location && globalThis.location.origin) || "";
  return {
    accountBase: sameOriginBase(config.accountApiBase || "/core-acct", origin, "Core Account API base"),
    accountId: accountId,
    authorization: text(session.tokenType || session.token_type || "Bearer") + " " + accessToken,
    organization: organization,
    userId: userId,
  };
}

async function requestJson(fetchImpl, url, options) {
  var response = await fetchImpl(url, options);
  if (!response || typeof response.ok !== "boolean") throw coded("invalid-response", "Core request returned an invalid response");
  if (!response.ok) {
    var code = response.status === 401 ? "session-expired" : response.status === 403 ? "customer-forbidden" : "profile-request-failed";
    var failure = coded(code, "Core Account request failed with HTTP " + response.status);
    failure.status = response.status;
    throw failure;
  }
  var payload;
  try {
    payload = await response.json();
  } catch (_) {
    throw coded("invalid-response", "Core response was not valid JSON");
  }
  if (!payload || typeof payload !== "object") throw coded("invalid-response", "Core answered with an unprojected body");
  return payload;
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

export const coreAccountProfileContract = Object.freeze({
  endpoint: "/api/account/list.json",
  filters: Object.freeze(["id", "user.id"]),
  mappings: PROFILE_MAPPINGS,
  scopeMode: "server-scoped",
});
