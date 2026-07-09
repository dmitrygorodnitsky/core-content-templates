export const verticalProfiles = {
  hvac: {
    slug: "hvac",
    displayName: "HVAC",
    profile: "onDemand",
    modules: ["orders", "calendar", "activity", "proposals", "services", "pricing", "products", "checkout", "profile", "support"],
    defaultRoute: "orders.list",
  },
  snow: {
    slug: "snow",
    displayName: "Snow Removal",
    profile: "stormOps",
    modules: ["orders", "calendar", "activity", "proposals", "services", "profile", "support"],
    defaultRoute: "orders.list",
  },
  lawn: {
    slug: "lawn",
    displayName: "Lawn & Garden",
    profile: "stormOps",
    modules: ["orders", "calendar", "activity", "proposals", "services", "profile", "support"],
    defaultRoute: "orders.list",
  },
  pool: {
    slug: "pool",
    displayName: "Pool & Spa",
    profile: "stormOps",
    modules: ["orders", "calendar", "activity", "proposals", "services", "profile", "support"],
    defaultRoute: "orders.list",
  },
  roofing: {
    slug: "roofing",
    displayName: "Roofing",
    profile: "stormOps",
    modules: ["orders", "calendar", "activity", "proposals", "services", "profile", "support"],
    defaultRoute: "orders.list",
  },
  pest: {
    slug: "pest",
    displayName: "Pest Control",
    profile: "stormOps",
    modules: ["orders", "calendar", "activity", "proposals", "services", "profile", "support"],
    defaultRoute: "orders.list",
  },
};

export const routeRegistry = {
  landing: { id: "landing", path: "/", module: "landing", public: true },
  "auth.phone": { id: "auth.phone", path: "/login", module: "auth", public: true },
  "auth.code": { id: "auth.code", path: "/login/verify", module: "auth", public: true },
  "orders.list": { id: "orders.list", path: "/orders", module: "orders" },
  "order.detail": { id: "order.detail", path: "/orders/detail", module: "orders" },
  calendar: { id: "calendar", path: "/calendar", module: "calendar" },
  activity: { id: "activity", path: "/activity", module: "activity" },
  services: { id: "services", path: "/services", module: "services" },
  pricing: { id: "pricing", path: "/pricing", module: "pricing" },
  products: { id: "products", path: "/products", module: "products" },
  checkout: { id: "checkout", path: "/checkout", module: "checkout" },
  "proposals.list": { id: "proposals.list", path: "/proposals", module: "proposals" },
  "proposal.detail": { id: "proposal.detail", path: "/proposals/detail", module: "proposals" },
  profile: { id: "profile", path: "/profile", module: "profile" },
  support: { id: "support", path: "/support", module: "support" },
};

const pathToRoute = Object.fromEntries(
  Object.values(routeRegistry).map((route) => [route.path, route.id])
);

export function routeByPath(pathname) {
  return pathToRoute[pathname] || null;
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

export function readPortalConfig(root) {
  var dataset = root ? root.dataset : {};
  var vertical = normalizeVertical(dataset.portalVertical || dataset.portalTheme);
  var profile = verticalProfiles[vertical];
  var enabledModules = splitList(dataset.portalEnabledModules);
  return {
    vertical: vertical,
    theme: dataset.portalTheme || vertical,
    profile: dataset.portalProfile || profile.profile,
    routerMode: dataset.portalRouterMode || "hash",
    authMode: dataset.portalAuthMode || "fixture",
    defaultRoute: dataset.portalDefaultRoute || profile.defaultRoute,
    enabledModules: enabledModules.length ? enabledModules : profile.modules.slice(),
    errorMode: dataset.portalErrorMode || "error",
    dataMode: dataset.portalDataMode || "fixture",
    pimFixtureUrl: dataset.portalPimFixtureUrl || "",
    pimApiBase: dataset.portalPimApiBase || "/core-pim/api",
    pimOrganization: dataset.portalPimOrganization || "SERVICEWAND",
    pimProductTypeCode: dataset.portalPimProductTypeCode || "SERVICEWAND_SAAS",
    pimCurrency: dataset.portalPimCurrency || "CAD",
    defaultMode: dataset.portalDefaultMode || "light",
  };
}

export function routePath(routeId) {
  return routeRegistry[routeId] ? routeRegistry[routeId].path : "/";
}

function splitList(value) {
  return String(value || "")
    .split(",")
    .map(function (item) { return item.trim(); })
    .filter(Boolean);
}
