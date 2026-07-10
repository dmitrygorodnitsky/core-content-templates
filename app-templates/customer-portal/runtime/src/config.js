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
};

export const verticalProfiles = {
  hvac: vertical("hvac", "HVAC", "onDemand", "Equipment"),
  snow: vertical("snow", "Snow Removal", "stormOps", "Season log"),
  lawn: vertical("lawn", "Lawn & Garden", "stormOps", "Program"),
  pool: vertical("pool", "Pool & Spa", "stormOps", "Water"),
  roofing: vertical("roofing", "Roofing", "stormOps", "Roof report"),
  pest: vertical("pest", "Pest Control", "stormOps", "Monitoring"),
  health: vertical("health", "Health", "appointments", "Care plan", false),
  beauty: vertical("beauty", "Beauty", "appointments", "My routine", false),
};

export const routeRegistry = {
  landing: { id: "landing", path: "/", module: "landing", public: true },
  "seo.landing": { id: "seo.landing", path: "/seo-preview", module: "seo-parity", public: true, parityOnly: true },
  "auth.phone": { id: "auth.phone", path: "/login", module: "auth", public: true },
  "auth.code": { id: "auth.code", path: "/login/verify", module: "auth", public: true },
  "orders.list": { id: "orders.list", path: "/orders", module: "orders" },
  "order.detail": { id: "order.detail", path: "/orders/:id", module: "orders", param: "id" },
  calendar: { id: "calendar", path: "/calendar", module: "calendar" },
  activity: { id: "activity", path: "/activity", module: "activity" },
  services: { id: "services", path: "/services", module: "services" },
  pricing: { id: "pricing", path: "/pricing", module: "pricing" },
  products: { id: "products", path: "/products", module: "products" },
  checkout: { id: "checkout", path: "/checkout", module: "checkout" },
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
  return {
    vertical: vertical,
    theme: theme,
    profile: profile,
    routerMode: allowed(dataset.portalRouterMode, ["hash", "history", "memory"], "hash"),
    authMode: allowed(dataset.portalAuthMode, ["fixture", "required"], "fixture"),
    defaultRoute: routeRegistry[dataset.portalDefaultRoute] ? dataset.portalDefaultRoute : verticalConfig.defaultRoute,
    enabledModules: enabledModules.length ? enabledModules : portalProfiles[profile].modules.slice(),
    errorMode: allowed(dataset.portalErrorMode, ["error", "fallback"], "error"),
    dataMode: allowed(dataset.portalDataMode, ["fixture", "live"], "fixture"),
    pimFixtureUrl: dataset.portalPimFixtureUrl || "",
    pimApiBase: dataset.portalPimApiBase || "/core-pim/api",
    pimOrganization: dataset.portalPimOrganization || "SERVICEWAND",
    pimProductTypeCode: dataset.portalPimProductTypeCode || "SERVICEWAND_SAAS",
    pimCurrency: dataset.portalPimCurrency || "CAD",
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
