// Spa Profile is deliberately least-data: the signed-in User's email, and the
// phone carried by the customer Account's PRIMARY contact. Preferences have no
// storage in Core — UserOrganizationPreferences holds only {id, user} and both
// preference endpoints return empty — so they stay explicitly unavailable
// rather than being faked client-side.
const CONTACT_ENTRY_MAPPINGS = [
  { name: "id" },
  { name: "value" },
  { key: "id", mappings: [{ name: "id" }, { name: "code" }], name: "kind", type: "identifier" },
  { key: "id", mappings: [{ name: "id" }, { name: "code" }], name: "type", type: "identifier" },
];

const ACCOUNT_CONTACT_MAPPINGS = [
  { name: "id" },
  { name: "code" },
  {
    mappings: [
      { name: "id" },
      { name: "firstName" },
      { name: "lastName" },
      { mappings: CONTACT_ENTRY_MAPPINGS, name: "contactEntries", type: "collection" },
    ],
    name: "contacts",
    type: "collection",
  },
];

const USER_MAPPINGS = [
  { name: "email" },
  { name: "enabled" },
  { name: "fullname" },
  { name: "id" },
  { name: "name" },
  { name: "optimistic" },
  { key: "id", name: "language", type: "identifier" },
  { key: "id", name: "workflow", type: "identifier" },
];

var saveFlight = null;

export function createCoreUserProfileAdapter(options = {}) {
  var fetchImpl = options.fetch || globalThis.fetch;
  return {
    async load(moduleId, context) {
      if (moduleId !== "profile") throw error("unsupported-module", "Core User profile adapter cannot load " + moduleId);
      return loadCoreUserProfile(context, fetchImpl, options.origin);
    },
    save(input, context) {
      if (saveFlight) return saveFlight;
      saveFlight = saveCoreUserProfile(input, context, fetchImpl, options.origin).finally(function () { saveFlight = null; });
      return saveFlight;
    },
  };
}

export async function loadCoreUserProfile(context, fetchImpl = globalThis.fetch, explicitOrigin) {
  var api = requestContext(context, explicitOrigin);
  var row = await requestJson(fetchImpl, api.base + "/api/user/get.json?id=" + api.userId, options(api, USER_MAPPINGS));
  var phone = api.accountId ? await loadAccountPhone(api, fetchImpl) : null;
  return normalize(row, api.userId, phone);
}

/* Phone lives on the Account's contact entries. A missing contact is a missing
   phone, never a placeholder. */
async function loadAccountPhone(api, fetchImpl) {
  if (!api.accountBase) return null;
  var response = await requestJson(fetchImpl, api.accountBase + "/api/account/list.json", options(api, {
    filters: [{ type: "INTEGER", operator: "=", property: "id", value: String(api.accountId) }],
    mappings: ACCOUNT_CONTACT_MAPPINGS,
    offset: 0,
    pageSize: 1,
  }));
  var account = (Array.isArray(response && response.result) ? response.result : [])[0];
  if (!account || positiveInteger(account.id) !== api.accountId) return null;
  var contacts = Array.isArray(account.contacts) ? account.contacts : [];
  for (var index = 0; index < contacts.length; index += 1) {
    var entries = Array.isArray(contacts[index].contactEntries) ? contacts[index].contactEntries : [];
    for (var entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
      var entry = entries[entryIndex];
      if (text(entry.type && entry.type.code) === "PHONE" && text(entry.value)) return text(entry.value);
    }
  }
  return null;
}

export async function saveCoreUserProfile(input, context, fetchImpl = globalThis.fetch, explicitOrigin) {
  var api = requestContext(context, explicitOrigin);
  var current = await requestJson(fetchImpl, api.base + "/api/user/get.json?id=" + api.userId, options(api, USER_MAPPINGS));
  var entity = {
    email: text(input && input.email),
    enabled: current.enabled !== false,
    fullname: text(current.fullname),
    id: api.userId,
    language: requiredRef(current.language, "User language"),
    name: text(current.name),
    optimistic: finiteNumber(current.optimistic, 0),
    workflow: requiredRef(current.workflow, "User workflow"),
  };
  if (!entity.email) throw error("profile-email-required", "Email is required");
  await requestJson(fetchImpl, api.base + "/api/user/save.json", options(api, { entities: [entity], mappings: USER_MAPPINGS }));
  var readback = await requestJson(fetchImpl, api.base + "/api/user/get.json?id=" + api.userId, options(api, USER_MAPPINGS));
  return normalize(readback, api.userId);
}

function normalize(row, userId, phone) {
  if (!row || positiveInteger(row.id) !== userId) throw error("profile-scope-mismatch", "Core User readback did not match the signed-in User");
  return {
    state: "ready",
    email: text(row.email),
    phone: phone || null,
    prefs: {},
    optimistic: Number.isFinite(Number(row.optimistic)) ? Number(row.optimistic) : null,
    // Phone is read-only until a scoped contact write contract exists; only the
    // email edit is opened. Preferences have nowhere to persist in Core.
    allowedActions: ["edit-email"],
    unavailableFields: phone ? ["preferences"] : ["phone", "preferences"],
  };
}

function requestContext(context, explicitOrigin) {
  var config = context && context.config || {};
  var state = context && context.state || {};
  var session = context && context.session || state.session || {};
  var token = text(session.accessToken || session.access_token);
  var userId = positiveInteger(session.userId);
  if (!token) throw error("session-required", "A Core access token is required");
  if (!userId) throw error("session-user-required", "The signed-in Core User is required");
  var origin = explicitOrigin || config.origin || globalThis.location && globalThis.location.origin;
  var base = sameOriginBase(config.coreApiBase || "/core", origin, "Core API base");
  var customer = context && context.account || state.customerAccount || session.account || {};
  return {
    accountBase: sameOriginBase(config.accountApiBase || "/core-acct", origin, "Core Account API base"),
    accountId: positiveInteger(customer.id) || null,
    base: base,
    token: text(session.tokenType || session.token_type || "Bearer") + " " + token,
    userId: userId,
  };
}

function options(api, body) {
  return { method: "POST", credentials: "same-origin", headers: { Authorization: api.token, "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(body) };
}

async function requestJson(fetchImpl, url, requestOptions) {
  var response = await fetchImpl(url, requestOptions);
  if (!response || typeof response.ok !== "boolean") throw error("invalid-response", "Core User returned an invalid response");
  if (!response.ok) {
    var code = response.status === 401 ? "session-expired" : response.status === 403 ? "customer-forbidden" : response.status === 409 || response.status === 412 ? "conflict" : "profile-request-failed";
    var failure = error(code, "Core User request failed with HTTP " + response.status); failure.status = response.status; throw failure;
  }
  try { return await response.json(); } catch (_) { throw error("invalid-response", "Core User response was not valid JSON"); }
}

function sameOriginBase(value, origin, label) { if (!origin) throw error("origin-required", label + " requires a browser origin"); var url = new URL(value, origin); if (url.origin !== new URL(origin).origin) throw error("cross-origin-service", label + " must be same-origin"); return url.href.replace(/\/+$/, ""); }
function requiredRef(value, label) { var id = value && positiveInteger(value.id); if (!id) throw error("profile-reference-missing", label + " is missing"); return { id: id }; }
function positiveInteger(value) { var number = Number(value); return Number.isInteger(number) && number > 0 ? number : null; }
function finiteNumber(value, fallback) { var number = Number(value); return Number.isFinite(number) ? number : fallback; }
function text(value) { return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim(); }
function error(code, message) { var failure = new Error(message); failure.code = code; return failure; }

export const coreUserProfileContract = Object.freeze({ mappings: USER_MAPPINGS, fields: ["email"] });
