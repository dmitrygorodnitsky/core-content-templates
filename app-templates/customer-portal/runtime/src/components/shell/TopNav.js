// customer-portal/runtime/src/components/shell/TopNav.js — production transfer module.
import { h } from "../../dom.js";
import { activeProfile, activeVerticalConfig, activityUnread, cartCount, currentFixture, isModuleEnabled, isSpa, liveProvider, navListShown, state } from "../../state.js";
import { visitImageUrl } from "../../normalizers/visits.js";
import { configuredExternalUrl, routeRegistry } from "../../config.js";
import { ActionButton } from "../primitives/ActionButton.js";
import { isRouteReachable, signedInWithAccess } from "../../router.js";
import { icon } from "../storm/overview-icons.js";
import { SpaTopNav } from "./SpaTopNav.js";

var WORDMARK_ASPECT = 2.5;
var LOGO_ATTEMPTS = 3;
var providerLogos = new Map();

export function TopNav(gated) {
  if (globalThis.__PORTAL_VERTICAL__ !== "snow" && isSpa()) return SpaTopNav(gated);
  var profile = activeProfile();
  if (gated) {
    return h("div", { "class": "top-nav-wrap" }, h("nav", { "class": "top-nav", "data-module": "top-nav", "data-visual-id": "top-nav", "data-state": "gated" }, [
      h("div", { "class": "top-nav__brand" }, [h("div", { "class": "brand-logo" }), h("span", { "class": "brand-name" }, state.config.brandName || "Aircove")]),
      h("div", { "class": "nav-links" }),
      h("div", { "class": "top-nav__actions" }, [h("div", { "class": "icon-btn", "data-action": "ui.toggleMode", title: "Toggle light/dark" }, state.mode === "Dark" ? "☀" : "☾")])
    ]));
  }
  var navItems = profile.nav.filter(isNavItemEnabled);
  var links = navItems.map(function (n) {
    var active = navActive(n);
    return h("span", {
      "class": "nav-link" + (active ? " nav-link--active" : ""),
      "data-action": "nav.go", "data-id": n.key, "data-state": active ? "active" : undefined
    }, navLabel(n));
  });

  var actions = [
    h("div", { "class": "icon-btn icon-btn--optional", "data-action": "ui.toggleMode", title: "Toggle light/dark" }, state.mode === "Dark" ? "\u2600" : "\u263e")
  ];
  if (primaryConnected(profile.primary)) actions.push(ActionButton({ variant: "btn--primary", label: state.config.primaryCtaLabel || profile.primary.label, action: profile.primary.action, visualId: "primary-cta" }));
  if (!profile.weatherCalendar && isModuleEnabled("calendar")) actions.push(h("div", { "class": "icon-btn icon-btn--optional", "data-action": "calendar.open", title: "Calendar" }, "\ud83d\udcc5"));
  if (profile.showCart && isModuleEnabled("checkout")) actions.push(h("div", { "class": "icon-btn", "data-action": "cart.open", title: "Cart", "data-state": cartCount() ? "filled" : "empty" }, ["\ud83d\uded2", cartCount() ? h("span", { "class": "cart-badge", "data-bind": "cart.count" }, String(cartCount())) : null]));
  if (isModuleEnabled("activity")) {
    var unread = activityUnread();
    actions.push(h("div", {
      "class": "icon-btn icon-btn--optional",
      "data-module": "activity-control",
      "data-action": "activity.open",
      "data-state": unread ? "unread" : undefined,
      title: "Activity",
    }, ["\ud83d\udd14", unread ? h("span", { "class": "dot-badge" }) : null]));
  }
  var profileEnabled = isModuleEnabled("profile");
  var signInRequired = state.config.authMode === "required";
  if (profileEnabled) actions.push(h("div", { "class": "avatar", "data-module": "profile-avatar", "data-action": "profile.open", title: "Profile", "aria-label": "Profile" }, initials(avatarName())));
  else if (signInRequired) actions.push(h("button", { "class": "icon-btn icon-btn--optional", "data-module": "sign-out-control", "data-visual-id": "sign-out-control", "data-action": "auth.signOut", title: "Sign out", "aria-label": "Sign out", type: "button" }, [icon("signOut", "ov-icon")]));
  actions.push(h("div", { "class": "icon-btn hamburger", "data-action": "ui.toggleMobileNav", title: "Menu" }, "\u2630"));

  var brandLeaves = !signedInWithAccess() && !!configuredExternalUrl(state.config, "landingUrl");
  var provider = liveProvider();
  var logo = providerLogo(provider);
  var nav = h("nav", { "class": "top-nav", "data-module": "top-nav", "data-visual-id": "top-nav" }, [
    h("div", { "class": "top-nav__brand", "data-action": brandLeaves ? "nav.landing" : "nav.go", "data-id": brandLeaves ? undefined : state.config.defaultRoute, "data-brand": logo && logo.wordmark ? "wordmark" : undefined }, [
      logo ? logo.node : h("div", { "class": "brand-logo" }),
      h("span", { "class": "brand-name", "data-bind": "brand.name" }, (provider && provider.name) || state.config.brandName || "Aircove")
    ]),
    h("div", { "class": "nav-links" }, [h("div", { "class": "nav-pill", "data-nav-pill": "true" })].concat(links)),
    h("div", { "class": "top-nav__actions" }, actions)
  ]);

  if (state.mobileNav) {
    nav.appendChild(h("div", { "class": "mobile-nav", "data-state": "mobile-navigation-open" },
      navItems.map(function (n) {
        var active = navActive(n);
        return h("span", { "class": "nav-link" + (active ? " nav-link--active" : ""), "data-action": "nav.go", "data-id": n.key }, navLabel(n));
      }).concat(profileEnabled || signInRequired ? [h("div", { "class": "mobile-nav__divider" })] : [], profileEnabled ? [
        h("span", { "class": "nav-link" + (state.route === "profile" ? " nav-link--active" : ""), "data-action": "profile.open" }, navLabel({ key: "profile", label: "Profile" })),
      ] : [], signInRequired ? [
        h("span", { "class": "nav-link", "data-module": "mobile-sign-out", "data-action": "auth.signOut" }, "Sign out"),
      ] : [])
    ));
  }
  return h("div", { "class": "top-nav-wrap" }, nav);
}

function providerLogo(provider) {
  var source = provider && provider.logoImageId ? visitImageUrl(state.config.coreApiBase, provider.logoImageId) : "";
  if (!source) return null;
  var logo = providerLogos.get(source);
  if (!logo) {
    logo = { node: null, wordmark: false, attempts: 0 };
    providerLogos.set(source, logo);
  }
  if (!logo.node && logo.attempts < LOGO_ATTEMPTS) {
    logo.attempts += 1;
    logo.node = logoImage(source, logo);
  }
  return logo.node ? logo : null;
}

function logoImage(source, logo) {
  var image = h("img", { "class": "brand-logo brand-logo--image", src: source, alt: "", loading: "lazy", decoding: "async", "data-module": "brand-logo", "data-source": "organization" });
  image.addEventListener("load", function () {
    logo.wordmark = image.naturalWidth > image.naturalHeight * WORDMARK_ASPECT;
    if (logo.wordmark && image.parentNode) image.parentNode.setAttribute("data-brand", "wordmark");
  });
  image.addEventListener("error", function () {
    logo.node = null;
    logo.wordmark = false;
    var brand = image.parentNode;
    if (!brand) return;
    brand.removeAttribute("data-brand");
    brand.replaceChild(h("div", { "class": "brand-logo" }), image);
  });
  return image;
}

function avatarName() {
  if (state.config.dataMode !== "live") {
    var customer = currentFixture().customer;
    return (customer && customer.fullName) || "";
  }
  var profile = state.moduleData.profile;
  return (profile && ((profile.contact && profile.contact.name) || profile.accountName)) || "";
}

function initials(name) {
  return String(name || "").split(/\s+/).filter(function (part) { return /^\p{L}/u.test(part); }).slice(0, 2).map(function (part) {
    return part.charAt(0).toUpperCase();
  }).join("");
}

function primaryConnected(primary) {
  if (!primary) return false;
  return primary.action !== "service.requestForm" || isRouteReachable("quote.new") || !!state.config.requestFormUrl;
}

var NAV_DETAIL_ROUTES = {
  "orders.list": ["order.detail"],
  products: ["checkout"],
  "proposals.list": ["proposal.detail", "agreement.detail", "quote.new"],
  appointments: ["visit.detail"],
  invoices: ["invoice.detail"],
};

function navActive(item) {
  return item.key === state.route || (NAV_DETAIL_ROUTES[item.key] || []).indexOf(state.route) !== -1;
}

function isNavItemEnabled(item) {
  var route = routeRegistry[item.key];
  return !!(route && (route.public || (isModuleEnabled(route.module) && navListShown(route.module))));
}

function navLabel(item) {
  var configured = state.config.navigation || {};
  var key = {
    "orders.list": "primary",
    appointments: "appointments",
    invoices: "invoices",
    calendar: "calendar",
    activity: "activity",
    care: "care",
    "proposals.list": "proposals",
    services: "services",
    pricing: "pricing",
    products: "products",
    account: "account",
    support: "support",
  }[item.key];
  return configured[key] || (item.key === "care" ? activeVerticalConfig().careNavLabel : item.label);
}

/* =========================================================
   CABINET  (data-route="orders.list")
   ========================================================= */
