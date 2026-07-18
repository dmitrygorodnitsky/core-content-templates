import { fixtureAdapter } from "../adapters/fixture-adapter.js";
import { corePimAdapter } from "../adapters/core-pim-adapter.js";
import { createCareFixtureAdapter } from "../adapters/care-fixture-adapter.js";
import { createCoreAccountAdapter } from "../adapters/core-account-adapter.js";
import { createCoreOrdersAdapter } from "../adapters/core-orders-adapter.js";
import { createCoreSpaDemoAdapter } from "../adapters/core-spa-demo-adapter.js";
import { createCoreOidcAdapter } from "../adapters/core-oidc-adapter.js";
import { createCoreUserProfileAdapter } from "../adapters/core-user-profile-adapter.js";
import {
  normalizeCare,
  normalizeCareFailure,
  normalizeCareLoading,
  normalizeCarePreflight,
  normalizeActivity,
  normalizeAuth,
  normalizeCalendar,
  normalizeCheckout,
  normalizeOrders,
  normalizePricing,
  normalizeProducts,
  normalizeProfile,
  normalizeProposals,
  normalizeServices,
  normalizeSupport,
} from "../normalizers/index.js";

function module(id, normalize) {
  return {
    id: id,
    adapter(context) {
      if (context.config.dataMode === "live") {
        if (corePimAdapter.supports(id)) return corePimAdapter;
        throw new Error("Live adapter is not opened for module " + id);
      }
      return fixtureAdapter;
    },
    normalize(raw) {
      return normalize(raw);
    },
  };
}

function clearCareProtectedState(runtimeState) {
  runtimeState.careAuthorizationEpoch = (runtimeState.careAuthorizationEpoch || 0) + 1;
  runtimeState.careStateVertical = null;
  runtimeState.careSelectedUnitId = null;
  runtimeState.careSelectedSpecialistId = null;
  runtimeState.careTasksDone = {};
  runtimeState.careRetreatRequests = {};
  for (const key of Object.keys(runtimeState.pending || {})) if (key.startsWith("care.")) delete runtimeState.pending[key];
  for (const key of Object.keys(runtimeState.commandErrors || {})) {
    if (key.startsWith("care.") && !key.endsWith(":_")) delete runtimeState.commandErrors[key];
  }
}

function clearGeneralCareCommandErrors(runtimeState) {
  for (const key of Object.keys(runtimeState.commandErrors || {})) {
    if (key.startsWith("care.") && key.endsWith(":_")) delete runtimeState.commandErrors[key];
  }
}

function carePreflight(context) {
  var enabled = context.config.enabledModules.includes("care");
  if (!enabled) return { status: "disabled", reasonCode: "module-disabled" };
  if (!context.state.session.authenticated) return { status: "unauthenticated", reasonCode: "session-required" };
  if (context.state.session.hasCustomerScope !== true || context.state.session.hasTenantScope !== true) {
    return { status: "forbidden", reasonCode: "scope-missing" };
  }
  var access = context.state.access && context.state.access.care;
  var status = access && access.status;
  if (status === "granted" && context.config.dataMode !== "fixture") {
    return { status: "error", reasonCode: "live-adapter-not-opened" };
  }
  if (["checking", "not-entitled", "forbidden", "granted", "error"].includes(status)) {
    return { status: status, reasonCode: access.reasonCode || null };
  }
  return { status: "not-entitled", reasonCode: "entitlement-missing" };
}

const careModule = {
  id: "care",
  asyncOnly: true,
  dataSources: ["care.fixture", "care.live"],
  requires: ["session", "customer-scope", "tenant-scope", "care-entitlement"],
  routes: ["care"],
  commands: ["care.selectUnit", "care.download", "care.requestRetreat", "care.selectSpecialist", "care.completeTask", "care.contactProvider", "care.openSecureDoc"],
  preflight: carePreflight,
  safeEnvelope: normalizeCarePreflight,
  loadingEnvelope: normalizeCareLoading,
  clearProtectedState(context) {
    clearCareProtectedState(context.state);
  },
  onResult(envelope, context) {
    clearGeneralCareCommandErrors(context.state);
    if (!envelope.content) {
      clearCareProtectedState(context.state);
      return;
    }
    if (context.state.careStateVertical && context.state.careStateVertical !== envelope.vertical) clearCareProtectedState(context.state);
    context.state.careStateVertical = envelope.vertical;
  },
  failureEnvelope(context) {
    return normalizeCareFailure(context, "payload-load-failed");
  },
  cacheKey(context) {
    var payloadState = context.state.carePayloadState === undefined ? "ready" : String(context.state.carePayloadState);
    return [context.config.dataMode, context.config.vertical, payloadState].join(":");
  },
  adapter(context) {
    if (context.config.dataMode !== "fixture") throw new Error("Care live adapter is not opened");
    return createCareFixtureAdapter();
  },
  normalize(raw, context) {
    return normalizeCare(raw, context);
  },
};

const accountModule = {
  id: "account",
  asyncOnly: true,
  adapter(context) {
    if (context.config.dataMode === "live") return createCoreAccountAdapter();
    return {
      load() {
        var customer = context.state.currentCustomer || {};
        return {
          state: "ready",
          organization: { code: context.config.organization },
          user: { id: null, displayName: customer.fullName || "Customer" },
          account: { id: null, code: "fixture", displayName: customer.fullName || "Customer", typeCode: context.config.accountTypeCode },
        };
      },
    };
  },
  normalize(raw) { return raw; },
  onResult(envelope, context) {
    context.state.customerAccount = envelope.account;
    context.state.session.account = envelope.account;
    context.state.sessionName = envelope.user && envelope.user.displayName || envelope.account && envelope.account.displayName || null;
    context.state.session.userId = envelope.user && envelope.user.id || null;
    context.state.account = "ready";
  },
  onError(error, context) {
    context.state.customerAccount = null;
    delete context.state.session.account;
    context.state.account = error && error.code || "customer-unavailable";
  },
  failureEnvelope(context, error) { return { state: error && error.code || "customer-unavailable", items: [] }; },
};

const profileModule = {
  id: "profile",
  asyncOnly: true,
  adapter(context) { return context.config.dataMode === "live" ? createCoreUserProfileAdapter() : fixtureAdapter; },
  normalize(raw, context) { return context.config.dataMode === "live" ? raw : normalizeProfile(raw); },
  onError(error, context) { if (error && error.code === "session-expired") context.state.account = "session-expired"; },
  failureEnvelope(context, error) { return { state: error && error.code === "customer-forbidden" ? "unauthorized" : "error", email: "", phone: null, prefs: {}, allowedActions: [] }; },
};

const authModule = {
  id: "auth",
  asyncOnly: true,
  adapter(context) { return createCoreOidcAdapter(); },
  normalize(raw) { return raw; },
  onResult(envelope, context) {
    if (context.config.dataMode !== "live") {
      context.state.oidc = context.config.authMode === "required" ? "ready-signed-out" : "ready-signed-in";
      context.state.session.authenticated = context.config.authMode !== "required";
      return;
    }
    var user = envelope && envelope.user;
    context.state.oidc = envelope && envelope.state || "ready-signed-out";
    context.state.session.authenticated = !!user || context.config.authMode !== "required";
    if (user) {
      context.state.session.accessToken = user.access_token;
      context.state.session.tokenType = user.token_type || "Bearer";
      var profile = user.profile || {};
      context.state.sessionName = profile.name || profile.preferred_username || profile.email || null;
    } else {
      delete context.state.session.accessToken;
      delete context.state.session.tokenType;
      context.state.account = "session-required";
    }
  },
  onError(error, context) {
    context.state.oidc = "unavailable";
    context.state.session.authenticated = false;
    context.state.account = "session-required";
  },
  failureEnvelope() { return { state: "unavailable", user: null }; },
};

const ordersModule = {
  id: "orders",
  asyncOnly: true,
  adapter(context) {
    return context.config.dataMode === "live" ? createCoreOrdersAdapter() : fixtureAdapter;
  },
  normalize(raw, context) {
    return context.config.dataMode === "live" ? raw : normalizeOrders(raw);
  },
  onError(error, context) {
    if (error && error.code === "session-expired") context.state.account = "session-expired";
  },
  failureEnvelope(context, error) { return { state: error && error.code || "error", items: [] }; },
};

const appointmentsModule = {
  id: "appointments",
  asyncOnly: true,
  adapter(context) {
    if (context.config.dataMode === "live") return createCoreSpaDemoAdapter();
    return {
      load() { return { state: "ready", items: [], next: null, upcoming: [], past: [], byRef: {} }; },
    };
  },
  normalize(raw) { return raw; },
  onError(error, context) {
    if (error && error.code === "session-expired") context.state.account = "session-expired";
  },
  failureEnvelope(context, error) {
    return { state: error && error.code === "customer-forbidden" ? "unauthorized" : "error", items: [], next: null, upcoming: [], past: [], byRef: {} };
  },
};

const checkoutModule = {
  id: "checkout",
  adapter(context) {
    if (context.config.dataMode === "live") return { load() { return { state: "ready" }; } };
    return fixtureAdapter;
  },
  normalize(raw, context) {
    return context.config.dataMode === "live" ? raw : normalizeCheckout(raw);
  },
};

export const modules = {
  auth: authModule,
  account: accountModule,
  appointments: appointmentsModule,
  orders: ordersModule,
  proposals: module("proposals", normalizeProposals),
  services: module("services", normalizeServices),
  pricing: module("pricing", normalizePricing),
  products: module("products", normalizeProducts),
  checkout: checkoutModule,
  calendar: module("calendar", normalizeCalendar),
  activity: module("activity", normalizeActivity),
  profile: profileModule,
  support: module("support", normalizeSupport),
  care: careModule,
};

export const openedModuleIds = Object.keys(modules);
