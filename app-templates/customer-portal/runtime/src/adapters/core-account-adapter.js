// Resolves the signed-in Core User to the one customer Account used by the portal.
// The request shape follows core-ui: Bearer token, user/basic-info, mapped list
// requests, and an authorized X-Organization-Code header.

const BASIC_INFO_MAPPINGS = ["code", "id", "name", "nls"].map(function (name) {
  return { name: name };
});

const ACCOUNT_MAPPINGS = [
  { name: "code" },
  { name: "id" },
  { name: "nls" },
  { name: "optimistic" },
  { key: "id", name: "organization", type: "identifier" },
  { key: "id", name: "type", type: "identifier" },
  { key: "id", name: "user", type: "identifier" },
];

export function createCoreAccountAdapter(options = {}) {
  var fetchImpl = options.fetch || globalThis.fetch;
  if (typeof fetchImpl !== "function") throw contractError("fetch-unavailable", "Core account adapter requires fetch");

  return {
    async load(moduleId, context) {
      if (moduleId !== "account") throw contractError("unsupported-module", "Core account adapter cannot load " + moduleId);
      return resolveCoreAccount(context, fetchImpl, options.origin);
    },
    async resolve(context) {
      return resolveCoreAccount(context, fetchImpl, options.origin);
    },
  };
}

export async function resolveCoreAccount(context, fetchImpl = globalThis.fetch, explicitOrigin) {
  var config = context && context.config || {};
  var session = context && context.session || context && context.state && context.state.session || {};
  var accessToken = text(session.accessToken || session.access_token);
  if (!accessToken) throw contractError("session-required", "A Core access token is required");

  var origin = explicitOrigin || config.origin || browserOrigin();
  var coreBase = sameOriginBase(config.coreApiBase || "/core", origin, "Core API base");
  var accountBase = sameOriginBase(config.accountApiBase || "/core-acct", origin, "Core Account API base");
  var tokenType = text(session.tokenType || session.token_type || "Bearer");
  var authorization = tokenType + " " + accessToken;

  var basicInfo = await requestJson(fetchImpl, coreBase + "/api/user/basic-info.json", {
    method: "POST",
    credentials: "same-origin",
    headers: { Authorization: authorization, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(BASIC_INFO_MAPPINGS),
  });
  var userId = positiveInteger(basicInfo.authenticatedUserId || basicInfo.id);
  if (!userId) throw contractError("invalid-session-user", "Core basic-info did not return authenticatedUserId");

  var organizationCode = selectOrganization(config.organization || config.pimOrganization, basicInfo);
  var accountTypeCode = text(config.accountTypeCode || "SPA_CUSTOMER");
  var accountReply = await requestJson(fetchImpl, accountBase + "/api/account/list.json", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      Authorization: authorization,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Organization-Code": organizationCode,
    },
    body: JSON.stringify({
      filters: [
        { type: "INTEGER", operator: "=", property: "user.id", value: String(userId) },
        { type: "STRING", operator: "=", property: "type.code", value: accountTypeCode },
      ],
      mappings: ACCOUNT_MAPPINGS,
      offset: 0,
      pageSize: 2,
    }),
  });
  var accounts = Array.isArray(accountReply && accountReply.result) ? accountReply.result : [];
  if (!accounts.length) throw contractError("customer-not-linked", "No customer Account is linked to the signed-in Core User");
  if (accounts.length !== 1 || Number(accountReply.resultSize || accounts.length) > 1) {
    throw contractError("customer-account-ambiguous", "The signed-in Core User must resolve to exactly one customer Account");
  }

  var account = accounts[0] || {};
  if (!positiveInteger(account.id)) throw contractError("invalid-customer-account", "Core Account response did not include an id");
  if (account.user && positiveInteger(account.user.id) && Number(account.user.id) !== userId) {
    throw contractError("customer-scope-mismatch", "Core Account user does not match the authenticated Core User");
  }

  return {
    state: "ready",
    organization: { code: organizationCode },
    user: {
      id: userId,
      displayName: text(basicInfo.authenticatedUserName || basicInfo.authenticatedUser || basicInfo.name),
    },
    account: {
      id: Number(account.id),
      code: text(account.code),
      displayName: localizedName(account.nls) || text(account.code),
      optimistic: Number.isFinite(Number(account.optimistic)) ? Number(account.optimistic) : null,
      typeCode: accountTypeCode,
    },
  };
}

function selectOrganization(configuredCode, basicInfo) {
  var configured = text(configuredCode);
  var authorized = Array.isArray(basicInfo && basicInfo.authorizedOrganizations)
    ? basicInfo.authorizedOrganizations.map(function (item) { return text(item && item.code); }).filter(Boolean)
    : [];
  var current = text(basicInfo && (basicInfo.organizationCode || basicInfo.defaultOrganizationCode));
  var selected = configured || current || authorized[0];
  if (!selected) throw contractError("organization-required", "Core basic-info did not provide an organization");
  if (authorized.length && !authorized.includes(selected)) {
    throw contractError("organization-forbidden", "Configured portal organization is not authorized for the signed-in Core User");
  }
  return selected;
}

async function requestJson(fetchImpl, url, options) {
  var response = await fetchImpl(url, options);
  if (!response || typeof response.ok !== "boolean") throw contractError("invalid-response", "Core request returned an invalid response");
  if (!response.ok) {
    var code = response.status === 401 ? "session-expired" : response.status === 403 ? "customer-forbidden" : "core-request-failed";
    var error = contractError(code, "Core request failed with HTTP " + response.status);
    error.status = response.status;
    throw error;
  }
  try {
    return await response.json();
  } catch (_) {
    throw contractError("invalid-response", "Core response was not valid JSON");
  }
}

function sameOriginBase(value, origin, label) {
  if (!origin) throw contractError("origin-required", label + " requires a browser origin");
  var target = new URL(String(value || ""), origin);
  if (target.origin !== new URL(origin).origin) throw contractError("cross-origin-service", label + " must be same-origin");
  return target.href.replace(/\/+$/, "");
}

function browserOrigin() {
  return globalThis.location && globalThis.location.origin || "";
}

function positiveInteger(value) {
  var number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

function localizedName(value) {
  if (!value || typeof value !== "object") return "";
  var localized = value.en || value["en-US"] || Object.values(value)[0] || {};
  return text(localized && (localized.NAME || localized.name));
}

function text(value) {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

function contractError(code, message) {
  var error = new Error(message);
  error.code = code;
  return error;
}

export const coreAccountContract = Object.freeze({
  basicInfoMappings: BASIC_INFO_MAPPINGS,
  accountMappings: ACCOUNT_MAPPINGS,
  accountFilters: ["user.id", "type.code"],
});
