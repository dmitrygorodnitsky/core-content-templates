// customer-portal/runtime/src/router.js — production transfer module.
import { h } from "./dom.js";
import { isModuleEnabled, isPublic, state } from "./state.js";
import { matchRoutePath, routePath, routeRegistry } from "./config.js";
import { EmptyState } from "./components/primitives/EmptyState.js";
import { Cabinet } from "./routes/OrdersPage.js";
import { OrderDetail } from "./routes/OrderDetailPage.js";
import { Services } from "./routes/ServicesPage.js";
import { Pricing } from "./routes/PricingPage.js";
import { Products } from "./routes/ProductsPage.js";
import { Checkout } from "./routes/CheckoutPage.js";
import { ProposalsList } from "./routes/ProposalsPage.js";
import { ProposalDetail } from "./routes/ProposalDetailPage.js";
import { Profile } from "./routes/ProfilePage.js";
import { Activity } from "./routes/ActivityPage.js";
import { Calendar } from "./routes/CalendarPage.js";
import { Support } from "./routes/SupportPage.js";
import { Landing } from "./routes/LandingPage.js";
import { Auth } from "./routes/AuthPage.js";
import { Care } from "./routes/CarePage.js";
import { SeoLanding } from "./routes/SeoLandingPage.js";

export function ComingSoon(routeId, wave) {
  return h("section", { "class": "page", "data-route": routeId, "data-visual-id": routeId }, [
    EmptyState({
      glyph: "\ud83e\uddf1", title: routeId + " \u2014 coming in " + wave,
      desc: "This route is part of a later wave. The shell, theming and action contract are already wired.",
      action: { variant: "btn--ghost", label: "Back to orders", action: "nav.go", id: "orders.list" }
    })
  ]);
}

export function resolveRoute(routeId) {
  var requested = routeRegistry[routeId] ? routeId : null;
  var activeRoute = requested ? routeRegistry[requested] : null;
  var defaultRoute = reachableDefaultRoute();

  if (!activeRoute) return { id: defaultRoute, reason: "unknown" };

  if (!isPublic(requested) && !state.session.authenticated) {
    state.session.intendedRoute = requested;
    return { id: "auth.phone", reason: "unauthorized" };
  }

  if (requested === "care" && !isModuleEnabled("care")) {
    return { id: "care", reason: "disabled" };
  }

  if (!activeRoute.public && !isModuleEnabled(activeRoute.module)) {
    return { id: defaultRoute, reason: "disabled" };
  }

  if (requested === "care") {
    return { id: "care", reason: careAccessReason() };
  }

  return { id: requested, reason: null };
}

function reachableDefaultRoute() {
  if (isRouteReachable(state.config.defaultRoute)) return state.config.defaultRoute;
  if (isRouteReachable("orders.list")) return "orders.list";

  var enabledRoute = Object.values(routeRegistry).find(function (route) {
    return !route.public && isModuleEnabled(route.module);
  });
  return enabledRoute ? enabledRoute.id : "landing";
}

function isRouteReachable(routeId) {
  var route = routeRegistry[routeId];
  return !!(route && (route.public || isModuleEnabled(route.module)));
}

export function routeFromLocation() {
  if (state.config.routerMode === "memory") return state.route;
  var raw;
  if (state.config.routerMode === "history") {
    raw = window.location.pathname + window.location.search;
  } else {
    raw = window.location.hash.replace(/^#/, "");
    if (!raw) return state.route;
    if (raw.charAt(0) !== "/") {
      var routeId = raw.split("?", 1)[0];
      setRouteQuery(routeId, raw);
      return routeId;
    }
  }
  var match = matchRoutePath(raw);
  if (!match) {
    clearRouteQuery();
    return "__unknown__";
  }
  setRouteQuery(match.id, raw);
  applyRouteParams(match);
  return match.id;
}

export function writeRouteToLocation(routeId) {
  scopeRouteQuery(routeId);
  if (state.config.routerMode === "memory") return;
  var path = routePath(routeId, paramsForRoute(routeId));
  var query = state.routeQuery || "";
  if (state.config.routerMode === "history") {
    if (window.location.pathname + window.location.search !== path + query) window.history.pushState({}, "", path + query);
    return;
  }
  var nextHash = "#" + path + query;
  if (window.location.hash !== nextHash) window.history.pushState({}, "", nextHash);
}

export function initRouter(onRouteChange) {
  var applyLocation = function () {
    var resolved = resolveRoute(routeFromLocation());
    state.route = resolved.id;
    onRouteChange();
  };
  if (state.config.routerMode === "history") {
    window.addEventListener("popstate", applyLocation);
  } else if (state.config.routerMode === "hash") {
    window.addEventListener("hashchange", applyLocation);
  }
  var initial = resolveRoute(routeFromLocation());
  state.route = initial.id;
  writeRouteToLocation(initial.id);
}

export function renderRoute() {
  var resolved = resolveRoute(state.route);
  if (resolved.id !== state.route) state.route = resolved.id;
  if (state.view === "fallback") return RouteFallback("fallback");

  switch (resolved.id) {
    case "orders.list": return Cabinet();
    case "order.detail": return OrderDetail();
    case "services":    return Services();
    case "pricing":     return Pricing();
    case "products":    return Products();
    case "checkout":    return Checkout();
    case "proposals.list": return ProposalsList();
    case "proposal.detail": return ProposalDetail();
    case "profile":     return Profile();
    case "activity":    return Activity();
    case "calendar":    return Calendar();
    case "support":     return Support();
    case "landing":     return Landing();
    case "auth.phone":  return Auth();
    case "auth.code":   return Auth();
    case "care":        return Care();
    case "seo.landing": return SeoLanding();
    default:            return RouteFallback(resolved.reason);
  }
}

function RouteFallback(reason) {
  return h("section", { "class": "page", "data-route": state.route, "data-visual-id": "route-fallback", "data-state": reason || "error" }, [
    EmptyState({
      glyph: "!",
      title: "Route unavailable",
      desc: "This route is not enabled for the current portal profile.",
      action: { variant: "btn--ghost", label: "Back to home", action: "nav.go", id: "orders.list" }
    })
  ]);
}

function careAccessReason() {
  var access = state.access && state.access.care;
  var status = access && access.status;
  if (status === "granted") return "granted";
  if (status === "checking") return "loading";
  if (status === "error") return "error";
  return "unauthorized";
}

function applyRouteParams(match) {
  if (match.id === "order.detail" && match.params.id) state.currentOrderId = match.params.id;
  if (match.id === "proposal.detail" && match.params.id) state.currentSiteId = match.params.id;
}

function paramsForRoute(routeId) {
  if (routeId === "order.detail") {
    if (!state.currentOrderId) state.currentOrderId = state.orders[0] && state.orders[0].id;
    return { id: state.currentOrderId };
  }
  if (routeId === "proposal.detail") return { id: state.currentSiteId };
  return {};
}

function queryFrom(value) {
  var index = String(value || "").indexOf("?");
  return index === -1 ? "" : String(value).slice(index);
}

function routeFamily(routeId) {
  if (routeId === "orders.list" || routeId === "order.detail") return "orders";
  if (routeId === "proposals.list" || routeId === "proposal.detail") return "proposals";
  return null;
}

function setRouteQuery(routeId, value) {
  var query = queryFrom(value);
  state.routeQuery = query;
  state.routeQueryOwner = query ? routeFamily(routeId) : null;
}

function scopeRouteQuery(routeId) {
  var family = routeFamily(routeId);
  if (!family || state.routeQueryOwner !== family) clearRouteQuery();
}

function clearRouteQuery() {
  state.routeQuery = "";
  state.routeQueryOwner = null;
}

/* =========================================================
   Booking drawer (minimal — full flow in later waves)
   ========================================================= */
