// customer-portal/runtime/src/router.js — production transfer module.
import { h } from "./dom.js";
import { activeProfile, isModuleEnabled, isPublic, isSpa, spaCapability, state } from "./state.js";
import { ACCOUNT_NO_ACCESS_STATES, LANDING_ENTRY_REASONS, customerAccountProfile, landingEntryOpen, landingEntryUrl, matchRoutePath, routePath, routeRegistry } from "./config.js";
import { EmptyState } from "./components/primitives/EmptyState.js";
import { Cabinet } from "./routes/OrdersPage.js";
import { OrderDetail } from "./routes/OrderDetailPage.js";
import { Services } from "./routes/ServicesPage.js";
import { Pricing } from "./routes/PricingPage.js";
import { Products } from "./routes/ProductsPage.js";
import { Checkout } from "./routes/CheckoutPage.js";
import { Overview } from "./routes/OverviewPage.js";
import { Appointments as AppointmentsTimeline } from "./routes/AppointmentsPage.js";
import { VisitDetail } from "./routes/VisitDetailPage.js";
import { PropertyDetail } from "./routes/PropertyDetailPage.js";
import { ProposalsList } from "./routes/ProposalsPage.js";
import { ProposalDetail } from "./routes/ProposalDetailPage.js";
import { AgreementDetail } from "./routes/AgreementDetailPage.js";
import { Profile } from "./routes/ProfilePage.js";
import { AccountProfile } from "./routes/AccountProfilePage.js";
import { Activity } from "./routes/ActivityPage.js";
import { Calendar } from "./routes/CalendarPage.js";
import { Support } from "./routes/SupportPage.js";
import { Auth } from "./routes/AuthPage.js";
import { Care } from "./routes/CarePage.js";
import { SeoLanding } from "./routes/SeoLandingPage.js";
import { AuthOidc } from "./routes/AuthOidcPage.js";
import { SpaAccount } from "./routes/SpaAccountPage.js";
import { SpaAppointments } from "./routes/SpaAppointmentsPage.js";
import { SpaAppointmentDetail } from "./routes/SpaAppointmentDetailPage.js";
import { SpaCart } from "./routes/SpaCartPage.js";
import { SpaCatalog } from "./routes/SpaCatalogPage.js";
import { SpaCheckout } from "./routes/SpaCheckoutPage.js";
import { SpaOrders } from "./routes/SpaOrdersPage.js";
import { SpaPlan } from "./routes/SpaPlanPage.js";
import { SpaPurchaseDetail } from "./routes/SpaPurchaseDetailPage.js";
import { SpaPurchases } from "./routes/SpaPurchasesPage.js";
import { SpaProfile } from "./routes/SpaProfilePage.js";
import { SpaShop } from "./routes/SpaShopPage.js";
import { SpaProductDetail } from "./routes/SpaProductDetailPage.js";

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
  var defaultRoute = reachableDefaultRoute();
  var requested = routeRegistry[routeId] ? routeId : defaultRoute;
  var activeRoute = routeRegistry[requested];
  var reason = requested === routeId ? null : "unknown";

  /* The SEO parity route remains executable in the local reference harness,
     but it is not a customer-portal screen and must never be reachable from a
     live portal template. The real landing is a separate CMS document. */
  if (activeRoute && activeRoute.parityOnly && state.config.dataMode === "live") {
    requested = defaultRoute;
    activeRoute = routeRegistry[requested];
    reason = "preview-only";
  }

  if (!activeRoute) return { id: "auth.oidc", reason: "invalid-config" };

  if (!isPublic(requested) && !state.session.authenticated) {
    state.session.intendedRoute = requested;
    return { id: "auth.oidc", reason: "unauthorized" };
  }

  if (requested === "care" && !isModuleEnabled("care")) {
    return { id: "care", reason: "disabled" };
  }

  if (!activeRoute.public && !privateRouteOpen(activeRoute)) {
    return { id: defaultRoute, reason: "disabled" };
  }

  if (requested === "care") {
    return { id: "care", reason: careAccessReason() };
  }

  return { id: requested, reason: reason };
}

export function publicEntryDestination() {
  if (!landingEntryOpen(state.config) || !state.session.intendedRoute) return "";
  if (!state.session.authenticated) return state.oidc === "ready-signed-out" ? landingEntryUrl(state.config) : "";
  return ACCOUNT_NO_ACCESS_STATES.includes(state.account) ? landingEntryUrl(state.config, LANDING_ENTRY_REASONS.noAccess) : "";
}

function reachableDefaultRoute() {
  if (isRouteReachable(state.config.defaultRoute)) return state.config.defaultRoute;
  if (isRouteReachable("orders.list")) return "orders.list";

  var enabledRoute = Object.values(routeRegistry).find(function (route) {
    return !route.public && privateRouteOpen(route);
  });
  return enabledRoute ? enabledRoute.id : "auth.oidc";
}

function isRouteReachable(routeId) {
  var route = routeRegistry[routeId];
  if (!route || (route.parityOnly && state.config.dataMode === "live")) return false;
  return !!(route.public || privateRouteOpen(route));
}

function privateRouteOpen(route) {
  if (!isModuleEnabled(route.module)) return false;
  return !route.ownedByProfile || activeProfile().modules.includes(route.module);
}

export function routeFromLocation() {
  if (state.config.routerMode === "memory") return state.route;
  var raw;
  if (state.config.routerMode === "history") {
    raw = window.location.pathname + window.location.search;
  } else {
    raw = window.location.hash.replace(/^#/, "");
    if (!raw) return state.config.defaultRoute || state.route;
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

export function writeRouteToLocation(routeId, replace) {
  scopeRouteQuery(routeId);
  if (state.config.routerMode === "memory") return;
  var path = routePath(routeId, paramsForRoute(routeId));
  var query = state.routeQuery || "";
  var record = replace ? "replaceState" : "pushState";
  if (state.config.routerMode === "history") {
    if (window.location.pathname + window.location.search !== path + query) window.history[record]({}, "", path + query);
    return;
  }
  var nextHash = "#" + path + query;
  if (window.location.hash !== nextHash) window.history[record]({}, "", nextHash);
}

export function initRouter(onRouteChange) {
  var applyLocation = function () {
    var requested = routeFromLocation();
    var resolved = resolveRoute(requested);
    state.route = resolved.id;
    if (resolved.id !== requested) writeRouteToLocation(resolved.id, true);
    onRouteChange();
  };
  if (state.config.routerMode === "history") {
    window.addEventListener("popstate", applyLocation);
  } else if (state.config.routerMode === "hash") {
    window.addEventListener("hashchange", applyLocation);
  }
  var initial = resolveRoute(routeFromLocation());
  state.route = initial.id;
  writeRouteToLocation(initial.id, landingEntryOpen(state.config));
}

export function renderRoute() {
  var resolved = resolveRoute(state.route);
  if (resolved.id !== state.route) state.route = resolved.id;
  if (state.view === "fallback") return RouteFallback("fallback");

  switch (resolved.id) {
    case "overview":    return Overview();
    case "appointments": return AppointmentsTimeline();
    case "visit.detail": return VisitDetail();
    case "property.detail": return PropertyDetail();
    case "orders.list": return isSpa() ? (spaCapability() === "target-appointments" ? SpaAppointments() : SpaOrders()) : Cabinet();
    case "order.detail": return OrderDetail();
    case "appointment.detail": return isSpa() && spaCapability() === "target-appointments" ? SpaAppointmentDetail() : ComingSoon("appointment.detail", "a later wave");
    case "services":    return isSpa() ? SpaCatalog() : Services();
    case "pricing":     return isSpa() ? SpaCatalog() : Pricing();
    case "products":    return isSpa() ? SpaShop() : Products();
    case "product.detail": return isSpa() ? SpaProductDetail() : ComingSoon("product.detail", "a later wave");
    case "checkout":    return isSpa() ? SpaCheckout() : Checkout();
    case "account":     return isSpa() ? SpaAccount() : ComingSoon("account", "a later wave");
    case "purchases.list": return isSpa() ? SpaPurchases() : ComingSoon("purchases.list", "a later wave");
    case "purchase.detail": return isSpa() ? SpaPurchaseDetail() : ComingSoon("purchase.detail", "a later wave");
    case "plan":        return isSpa() ? SpaPlan() : ComingSoon("plan", "a later wave");
    case "cart":        return isSpa() ? SpaCart() : Checkout();
    case "proposals.list": return ProposalsList();
    case "proposal.detail": return ProposalDetail();
    case "agreement.detail": return AgreementDetail();
    case "profile":     return isSpa() ? SpaProfile() : customerAccountProfile(state.config) ? AccountProfile() : Profile();
    case "activity":    return Activity();
    case "calendar":    return Calendar();
    case "support":     return Support();
    case "auth.phone":  return Auth();
    case "auth.code":   return Auth();
    case "auth.oidc":   return AuthOidc();
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
  if (match.id === "agreement.detail" && match.params.id) state.agreementId = match.params.id;
  if (match.id === "visit.detail" && match.params.id) state.visitId = match.params.id;
  if (match.id === "property.detail" && match.params.id) state.propertyId = match.params.id;
  if (match.id === "purchase.detail" && match.params.id) state.spaCurrentPurchase = match.params.id;
  if (match.id === "appointment.detail" && match.params.id) state.spaCurrentAppointment = match.params.id;
  if (match.id === "product.detail" && match.params.id) state.spaCurrentProduct = match.params.id;
}

function paramsForRoute(routeId) {
  if (routeId === "order.detail") {
    if (!state.currentOrderId) state.currentOrderId = state.orders[0] && state.orders[0].id;
    return { id: state.currentOrderId };
  }
  if (routeId === "proposal.detail") return { id: state.currentSiteId };
  if (routeId === "agreement.detail") return { id: state.agreementId };
  if (routeId === "visit.detail") return { id: state.visitId };
  if (routeId === "property.detail") return { id: state.propertyId };
  if (routeId === "purchase.detail") return { id: state.spaCurrentPurchase };
  if (routeId === "appointment.detail") return { id: state.spaCurrentAppointment };
  if (routeId === "product.detail") return { id: state.spaCurrentProduct };
  return {};
}

function queryFrom(value) {
  var index = String(value || "").indexOf("?");
  return index === -1 ? "" : String(value).slice(index);
}

function routeFamily(routeId) {
  if (routeId === "orders.list" || routeId === "order.detail" || routeId === "appointment.detail") return "appointments";
  if (routeId === "appointments" || routeId === "visit.detail" || routeId === "property.detail") return "appointments-timeline";
  if (routeId === "proposals.list" || routeId === "proposal.detail" || routeId === "agreement.detail") return "proposals";
  if (routeId === "purchases.list" || routeId === "purchase.detail") return "purchases";
  if (routeId === "products" || routeId === "product.detail") return "products";
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
