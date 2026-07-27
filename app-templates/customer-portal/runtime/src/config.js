import { caseFixtureFor } from "../data/case-fixtures.js";

export const portalProfiles = {
  onDemand: {
    id: "onDemand",
    nav: [
      { key: "orders.list", label: "Orders" },
      { key: "care" },
      { key: "proposals.list", label: "Proposals" },
      { key: "services", label: "Services" },
      { key: "pricing", label: "Pricing" },
      { key: "products", label: "Products" },
      { key: "support", label: "Support" },
    ],
    primary: { label: "+ Book", action: "booking.open" },
    modules: ["orders", "calendar", "activity", "proposals", "care", "services", "pricing", "products", "checkout", "profile", "support"],
    weatherCalendar: false,
    showCart: true,
    drawerTitle: "Book a service",
  },
  stormOps: {
    id: "stormOps",
    nav: [
      { key: "orders.list", label: "Home" },
      { key: "calendar", label: "Calendar" },
      { key: "care" },
      { key: "proposals.list", label: "Contracts" },
      { key: "services", label: "Services" },
      { key: "activity", label: "Activity" },
      { key: "support", label: "Support" },
    ],
    primary: { label: "Request service", action: "service.request" },
    modules: ["orders", "calendar", "activity", "proposals", "care", "services", "profile", "support"],
    weatherCalendar: true,
    showCart: false,
    drawerTitle: "Request service",
  },
  appointments: {
    id: "appointments",
    nav: [
      { key: "orders.list", label: "Appointments" },
      { key: "calendar", label: "Calendar" },
      { key: "care" },
      { key: "services", label: "Services" },
      { key: "pricing", label: "Pricing" },
      { key: "products", label: "Products" },
      { key: "support", label: "Support" },
    ],
    primary: { label: "+ Book", action: "booking.open" },
    modules: ["orders", "calendar", "care", "services", "pricing", "products", "checkout", "profile", "support"],
    weatherCalendar: false,
    showCart: true,
    drawerTitle: "Book an appointment",
  },
  spaStaging: {
    id: "spaStaging",
    nav: [
      { key: "orders.list", label: "Orders" },
      { key: "services", label: "Services & prices" },
      { key: "products", label: "Shop", secondary: true },
      { key: "account", label: "Account" },
    ],
    primary: { label: "Browse services", action: "nav.go" },
    modules: ["orders", "services", "pricing", "products", "account"],
    weatherCalendar: false,
    showCart: false,
    drawerTitle: "Book an appointment",
  },
  spaTarget: {
    id: "spaTarget",
    nav: [
      { key: "orders.list", label: "Appointments" },
      { key: "services", label: "Services & prices" },
      { key: "products", label: "Shop", secondary: true },
      { key: "account", label: "Account" },
    ],
    primary: { label: "+ Book", action: "booking.open" },
    modules: ["appointments", "orders", "services", "pricing", "products", "account", "purchases", "plan", "cart", "checkout", "profile"],
    weatherCalendar: false,
    showCart: false,
    drawerTitle: "Book an appointment",
  },
};

export const verticalProfiles = {
  hvac: vertical("hvac", "HVAC", "onDemand", "Equipment"),
  snow: vertical("snow", "Snow Removal", "stormOps", "Season log"),
  lawn: vertical("lawn", "Lawn & Garden", "stormOps", "Program"),
  pool: vertical("pool", "Pool & Spa", "stormOps", "Water"),
  roofing: vertical("roofing", "Roofing", "stormOps", "Roof report"),
  pest: vertical("pest", "Pest Control", "stormOps", "Monitoring"),
  health: vertical("health", "Health", "appointments", "Care plan", false),
  beauty: vertical("beauty", "Beauty", "spaStaging", "My routine", false),
};

export const routeRegistry = {
  landing: { id: "landing", path: "/", module: "landing", public: true },
  "seo.landing": { id: "seo.landing", path: "/seo-preview", module: "seo-parity", public: true, parityOnly: true },
  "auth.oidc": { id: "auth.oidc", path: "/login", module: "auth", public: true },
  "auth.phone": { id: "auth.phone", path: "/login/phone-reference", module: "auth", public: true },
  "auth.code": { id: "auth.code", path: "/login/verify", module: "auth", public: true },
  "orders.list": { id: "orders.list", path: "/orders", module: "orders" },
  "order.detail": { id: "order.detail", path: "/orders/:id", module: "orders", param: "id" },
  "appointment.detail": { id: "appointment.detail", path: "/appointments/:id", module: "appointments", param: "id" },
  calendar: { id: "calendar", path: "/calendar", module: "calendar" },
  activity: { id: "activity", path: "/activity", module: "activity" },
  services: { id: "services", path: "/services", module: "services" },
  pricing: { id: "pricing", path: "/pricing", module: "pricing" },
  products: { id: "products", path: "/products", module: "products" },
  "product.detail": { id: "product.detail", path: "/products/:id", module: "products", param: "id" },
  checkout: { id: "checkout", path: "/checkout", module: "checkout" },
  account: { id: "account", path: "/account", module: "account" },
  "purchases.list": { id: "purchases.list", path: "/purchases", module: "purchases" },
  "purchase.detail": { id: "purchase.detail", path: "/purchases/:id", module: "purchases", param: "id" },
  plan: { id: "plan", path: "/account/plan", module: "plan" },
  cart: { id: "cart", path: "/cart", module: "cart" },
  "proposals.list": { id: "proposals.list", path: "/proposals", module: "proposals" },
  "proposal.detail": { id: "proposal.detail", path: "/proposals/:id", module: "proposals", param: "id" },
  profile: { id: "profile", path: "/profile", module: "profile" },
  support: { id: "support", path: "/support", module: "support" },
  care: { id: "care", path: "/care", module: "care", access: "care" },
};

const routeMatchers = Object.values(routeRegistry).map(function (route) {
  var names = [];
  var pattern = route.path.split("/").map(function (segment) {
    if (segment.charAt(0) !== ":") return escapeRegExp(segment);
    names.push(segment.slice(1));
    return "([^/]+)";
  }).join("/");
  return { route: route, names: names, expression: new RegExp("^" + pattern + "/?$") };
});

export function matchRoutePath(pathname) {
  var cleanPath = String(pathname || "/").split(/[?#]/, 1)[0] || "/";
  for (var i = 0; i < routeMatchers.length; i += 1) {
    var matcher = routeMatchers[i];
    var match = cleanPath.match(matcher.expression);
    if (!match) continue;
    var params = {};
    try {
      matcher.names.forEach(function (name, index) {
        params[name] = decodeURIComponent(match[index + 1]);
      });
    } catch (_) {
      return null;
    }
    return { id: matcher.route.id, params: params };
  }
  return null;
}

export function routeByPath(pathname) {
  var match = matchRoutePath(pathname);
  return match ? match.id : null;
}

export function normalizeVertical(value) {
  if (!value) return "hvac";
  var normalized = String(value).trim().toLowerCase();
  if (verticalProfiles[normalized]) return normalized;
  var match = Object.values(verticalProfiles).find(function (profile) {
    return profile.displayName.toLowerCase() === normalized;
  });
  return match ? match.slug : "hvac";
}

export function resolveProfile(vertical, requestedProfile) {
  var verticalConfig = verticalProfiles[vertical] || verticalProfiles.hvac;
  var candidate = portalProfiles[requestedProfile] ? requestedProfile : verticalConfig.profile;
  if (portalProfiles[candidate].weatherCalendar && !verticalConfig.weather) return verticalConfig.profile;
  return candidate;
}

export function readPortalConfig(root) {
  var dataset = root ? root.dataset : {};
  var vertical = normalizeVertical(dataset.portalVertical);
  var theme = normalizeVertical(dataset.portalTheme || vertical);
  var verticalConfig = verticalProfiles[vertical];
  var enabledModules = splitList(dataset.portalEnabledModules);
  var profile = resolveProfile(vertical, dataset.portalProfile);
  var dataMode = allowed(dataset.portalDataMode, ["fixture", "live"], "fixture");
  var caseId = dataMode === "fixture" && caseFixtureFor(dataset.portalCase) ? dataset.portalCase : "";
  if (caseId && vertical !== "beauty") caseId = "";
  return {
    vertical: vertical,
    theme: theme,
    profile: profile,
    capability: allowed(dataset.portalCapability, ["current-staging", "target-appointments"], "current-staging"),
    booking: allowed(dataset.portalBooking, ["closed", "open"], "closed"),
    retail: allowed(dataset.portalRetail, ["browse-only", "retail-commerce-open"], "browse-only"),
    planCommerce: allowed(dataset.portalPlanCommerce, ["closed", "open"], "closed"),
    demoCommands: allowed(dataset.portalDemoCommands, ["closed", "current-api"], "closed"),
    organization: dataset.portalOrganization || dataset.portalPimOrganization || "SERVICEWAND",
    coreApiBase: dataset.portalCoreApiBase || "/core",
    accountApiBase: dataset.portalAccountApiBase || "/core-acct",
    billApiBase: dataset.portalBillApiBase || "/core-bill",
    serviceApiBase: dataset.portalServiceApiBase || "/core-svc",
    accountTypeCode: dataset.portalAccountTypeCode || "SPA_CUSTOMER",
    authCoreBase: dataset.portalAuthCoreBase || "/core",
    authCallbackPath: dataset.portalAuthCallbackPath || "/core/oauth2-callback.html",
    authReturnStorageKey: dataset.portalAuthReturnStorageKey || "oidc-return-url",
    authLogoutReturnStorageKey: dataset.portalAuthLogoutReturnStorageKey || "oidc-logout-return-url",
    routerMode: allowed(dataset.portalRouterMode, ["hash", "history", "memory"], "hash"),
    authMode: allowed(dataset.portalAuthMode, ["fixture", "required"], "fixture"),
    defaultRoute: routeRegistry[dataset.portalDefaultRoute] ? dataset.portalDefaultRoute : verticalConfig.defaultRoute,
    enabledModules: enabledModules.length ? enabledModules : portalProfiles[profile].modules.slice(),
    errorMode: allowed(dataset.portalErrorMode, ["error", "fallback"], "error"),
    dataMode: dataMode,
    caseId: caseId,
    pimFixtureUrl: dataset.portalPimFixtureUrl || "",
    pimApiBase: dataset.portalPimApiBase || "/core-pim/api",
    pimOrganization: dataset.portalPimOrganization || "SERVICEWAND",
    pimEnrichmentMode: allowed(dataset.portalPimEnrichment, ["closed", "current-api"], "closed"),
    pimProductTypeCode: dataset.portalPimProductTypeCode || "SERVICEWAND_SAAS",
    pimPricingProductTypeCodes: splitList(dataset.portalPimPricingProductTypeCodes),
    pimProductsProductTypeCodes: splitList(dataset.portalPimProductsProductTypeCodes),
    pimCurrency: dataset.portalPimCurrency || "CAD",
    pimPriceTypeCode: dataset.portalPimPriceTypeCode || "RECURRENT",
    pimPriceAttributeCode: dataset.portalPimPriceAttributeCode || "INTERVAL",
    pimPriceAttributeValues: splitList(dataset.portalPimPriceAttributeValues || "1"),
    pimCurrencyAttributeCode: dataset.portalPimCurrencyAttributeCode || "CURRENCY",
    pimCurrencyAttributeValues: splitList(dataset.portalPimCurrencyAttributeValues || dataset.portalPimCurrency || "CAD"),
    pimAmountAttributeCode: dataset.portalPimAmountAttributeCode || "AMOUNT_MINOR",
    pimAmountMinorDivisor: positiveNumber(dataset.portalPimAmountMinorDivisor, 100),
    pimCta: dataset.portalPimCta || "",
    defaultMode: allowed(dataset.portalDefaultMode, ["light", "dark"], "light"),
  };
}

export function routePath(routeId, params) {
  var route = routeRegistry[routeId];
  if (!route) return "/";
  var values = params || {};
  return route.path.replace(/:([a-zA-Z0-9_]+)/g, function (_, name) {
    if (values[name] === undefined || values[name] === null || values[name] === "") {
      throw new Error("Missing route parameter " + name + " for " + routeId);
    }
    return encodeURIComponent(String(values[name]));
  });
}

function vertical(slug, displayName, profile, careNavLabel, weather) {
  return {
    slug: slug,
    displayName: displayName,
    profile: profile,
    careNavLabel: careNavLabel,
    modules: portalProfiles[profile].modules.slice(),
    defaultRoute: "orders.list",
    weather: weather !== false,
  };
}

function allowed(value, values, fallback) {
  return values.includes(value) ? value : fallback;
}

function splitList(value) {
  return String(value || "")
    .split(",")
    .map(function (item) { return item.trim(); })
    .filter(Boolean);
}

function positiveNumber(value, fallback) {
  var parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function escapeRegExp(value) {
  /* Keep `$` away from `{` in the emitted source: `${` is a JTE expression
     opener even when those characters happen to live inside a JS regex. */
  return value.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&");
}
