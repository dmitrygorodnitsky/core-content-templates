// customer-portal/runtime/src/components/shell/TopNav.js — production transfer module.
import { h } from "../../dom.js";
import { activeProfile, activeVerticalConfig, activityUnread, cartCount, isModuleEnabled, isSpa, state } from "../../state.js";
import { configuredExternalUrl, routeRegistry } from "../../config.js";
import { ActionButton } from "../primitives/ActionButton.js";
import { icon } from "../storm/overview-icons.js";
import { SpaTopNav } from "./SpaTopNav.js";

export function TopNav(gated) {
  if (isSpa()) return SpaTopNav(gated);
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
    var active = n.key === state.route || (n.key === "orders.list" && state.route === "order.detail") || (n.key === "products" && state.route === "checkout") || (n.key === "proposals.list" && (state.route === "proposal.detail" || state.route === "agreement.detail"));
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
  var activityEnabled = isModuleEnabled("activity");
  var unread = activityUnread();
  actions.push(h("div", {
    "class": "icon-btn icon-btn--optional",
    "data-module": "activity-control",
    "data-action": activityEnabled ? "activity.open" : undefined,
    "data-state": unread ? "unread" : undefined,
    title: activityEnabled ? "Activity" : undefined,
    "aria-disabled": activityEnabled ? undefined : "true",
  }, ["\ud83d\udd14", unread ? h("span", { "class": "dot-badge" }) : null]));
  var profileEnabled = isModuleEnabled("profile");
  var signInRequired = state.config.authMode === "required";
  if (profileEnabled) actions.push(h("div", { "class": "avatar", "data-action": "profile.open", title: "Profile" }));
  else if (signInRequired) actions.push(h("button", { "class": "icon-btn icon-btn--optional", "data-module": "sign-out-control", "data-visual-id": "sign-out-control", "data-action": "auth.signOut", title: "Sign out", "aria-label": "Sign out", type: "button" }, [icon("signOut", "ov-icon")]));
  actions.push(h("div", { "class": "icon-btn hamburger", "data-action": "ui.toggleMobileNav", title: "Menu" }, "\u2630"));

  var landingOpen = !!configuredExternalUrl(state.config, "landingUrl");
  var nav = h("nav", { "class": "top-nav", "data-module": "top-nav", "data-visual-id": "top-nav" }, [
    h("div", { "class": "top-nav__brand", "data-action": landingOpen ? "nav.landing" : "nav.go", "data-id": landingOpen ? undefined : state.config.defaultRoute }, [
      h("div", { "class": "brand-logo" }),
      h("span", { "class": "brand-name", "data-bind": "brand.name" }, state.config.brandName || "Aircove")
    ]),
    h("div", { "class": "nav-links" }, [h("div", { "class": "nav-pill", "data-nav-pill": "true" })].concat(links)),
    h("div", { "class": "top-nav__actions" }, actions)
  ]);

  if (state.mobileNav) {
    nav.appendChild(h("div", { "class": "mobile-nav", "data-state": "mobile-navigation-open" },
      navItems.map(function (n) {
        var active = n.key === state.route || (n.key === "orders.list" && state.route === "order.detail") || (n.key === "products" && state.route === "checkout") || (n.key === "proposals.list" && (state.route === "proposal.detail" || state.route === "agreement.detail"));
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

function primaryConnected(primary) {
  if (!primary) return false;
  return primary.action !== "service.requestForm" || !!state.config.requestFormUrl;
}

function isNavItemEnabled(item) {
  var route = routeRegistry[item.key];
  return !!(route && (route.public || isModuleEnabled(route.module)));
}

function navLabel(item) {
  var configured = state.config.navigation || {};
  var key = {
    "orders.list": "primary",
    appointments: "appointments",
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
