// customer-portal/runtime/src/components/shell/TopNav.js — production transfer module.
import { h } from "../../dom.js";
import { activeProfile, cartCount, isModuleEnabled, state } from "../../state.js";
import { go } from "../../actions.js";
import { routeRegistry } from "../../config.js";
import { ActionButton } from "../primitives/ActionButton.js";
import { Toggle } from "../primitives/Toggle.js";
import { Profile } from "../../routes/ProfilePage.js";
import { Activity } from "../../routes/ActivityPage.js";
import { Calendar } from "../../routes/CalendarPage.js";

export function TopNav() {
  var profile = activeProfile();
  var navItems = profile.nav.filter(isNavItemEnabled);
  var links = navItems.map(function (n) {
    var active = n.key === state.route || (n.key === "orders.list" && state.route === "order.detail") || (n.key === "products" && state.route === "checkout") || (n.key === "proposals.list" && state.route === "proposal.detail");
    return h("span", {
      "class": "nav-link" + (active ? " nav-link--active" : ""),
      "data-action": "nav.go", "data-id": n.key, "data-state": active ? "active" : undefined
    }, n.label);
  });

  var actions = [
    h("div", { "class": "icon-btn icon-btn--optional", "data-action": "ui.toggleMode", title: "Toggle light/dark" }, state.mode === "Dark" ? "\u2600" : "\u263e")
  ];
  if (isModuleEnabled("services")) actions.push(ActionButton({ variant: "btn--primary", label: profile.primary.label, action: profile.primary.action, visualId: "primary-cta" }));
  if (!profile.weatherCalendar && isModuleEnabled("calendar")) actions.push(h("div", { "class": "icon-btn icon-btn--optional", "data-action": "calendar.open", title: "Calendar" }, "\ud83d\udcc5"));
  if (profile.showCart && isModuleEnabled("checkout")) actions.push(h("div", { "class": "icon-btn", "data-action": "cart.open", title: "Cart" }, ["\ud83d\uded2", cartCount() ? h("span", { "class": "cart-badge", "data-bind": "cart.count" }, String(cartCount())) : null]));
  if (isModuleEnabled("activity")) actions.push(h("div", { "class": "icon-btn icon-btn--optional", "data-action": "activity.open", title: "Activity" }, ["\ud83d\udd14", h("span", { "class": "dot-badge" })]));
  if (isModuleEnabled("profile")) actions.push(h("div", { "class": "avatar", "data-action": "profile.open", title: "Profile" }));
  actions.push(h("div", { "class": "icon-btn hamburger", "data-action": "ui.toggleMobileNav", title: "Menu" }, "\u2630"));

  var nav = h("nav", { "class": "top-nav", "data-module": "top-nav", "data-visual-id": "top-nav" }, [
    h("div", { "class": "top-nav__brand", "data-action": "nav.landing" }, [
      h("div", { "class": "brand-logo" }),
      h("span", { "class": "brand-name", "data-bind": "brand.name" }, "Aircove")
    ]),
    h("div", { "class": "nav-links" }, [h("div", { "class": "nav-pill", "data-nav-pill": "true" })].concat(links)),
    h("div", { "class": "top-nav__actions" }, actions)
  ]);

  if (state.mobileNav) {
    nav.appendChild(h("div", { "class": "mobile-nav", "data-state": "mobile-navigation-open" },
      navItems.map(function (n) {
        var active = n.key === state.route || (n.key === "orders.list" && state.route === "order.detail");
        return h("span", { "class": "nav-link" + (active ? " nav-link--active" : ""), "data-action": "nav.go", "data-id": n.key }, n.label);
      })
    ));
  }
  return h("div", { "class": "top-nav-wrap" }, nav);
}

function isNavItemEnabled(item) {
  var route = routeRegistry[item.key];
  return !!(route && (route.public || isModuleEnabled(route.module)));
}

/* =========================================================
   CABINET  (data-route="orders.list")
   ========================================================= */
