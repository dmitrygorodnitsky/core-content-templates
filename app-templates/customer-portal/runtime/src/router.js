// customer-portal/runtime/src/router.js — production transfer module.
import { h } from "./dom.js";
import { isModuleEnabled, isPublic, state } from "./state.js";
import { routeByPath, routePath, routeRegistry } from "./config.js";
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

  if (!isModuleEnabled(activeRoute.module)) {
    return { id: defaultRoute, reason: "disabled" };
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
  if (state.config.routerMode === "history") return routeByPath(window.location.pathname) || state.route;
  var hash = window.location.hash.replace(/^#/, "");
  if (!hash) return state.route;
  if (hash.charAt(0) === "/") return routeByPath(hash) || state.route;
  return hash;
}

export function writeRouteToLocation(routeId) {
  if (state.config.routerMode === "memory") return;
  var path = routePath(routeId);
  if (state.config.routerMode === "history") {
    if (window.location.pathname !== path) window.history.pushState({}, "", path);
    return;
  }
  var nextHash = "#" + path;
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

/* =========================================================
   Booking drawer (minimal — full flow in later waves)
   ========================================================= */
