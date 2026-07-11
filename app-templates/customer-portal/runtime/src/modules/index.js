import { fixtureAdapter } from "../adapters/fixture-adapter.js";
import { corePimAdapter } from "../adapters/core-pim-adapter.js";
import { createCareFixtureAdapter } from "../adapters/care-fixture-adapter.js";
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
      if (context.config.dataMode === "live" && corePimAdapter.supports(id)) return corePimAdapter;
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

export const modules = {
  auth: module("auth", normalizeAuth),
  orders: module("orders", normalizeOrders),
  proposals: module("proposals", normalizeProposals),
  services: module("services", normalizeServices),
  pricing: module("pricing", normalizePricing),
  products: module("products", normalizeProducts),
  checkout: module("checkout", normalizeCheckout),
  calendar: module("calendar", normalizeCalendar),
  activity: module("activity", normalizeActivity),
  profile: module("profile", normalizeProfile),
  support: module("support", normalizeSupport),
  care: careModule,
};

export const openedModuleIds = Object.keys(modules);
