// customer-portal-design/src/components/shell/TopNav.js — presentation runtime (auto-split from app.js). No business logic.
import { h } from "../../dom.js";
import { F } from "../../../data/fixtures.js";
import { activeProfile, cartCount, state } from "../../state.js";
import { go } from "../../actions.js";
import { ActionButton } from "../primitives/ActionButton.js";
import { Toggle } from "../primitives/Toggle.js";
import { Profile } from "../../routes/ProfilePage.js";
import { Activity } from "../../routes/ActivityPage.js";
import { Calendar } from "../../routes/CalendarPage.js";

/* the care hub's nav label is vertical-specific (fixtures.careModules) */
function navLabel(n) { return n.key === "care" ? F.careModules[state.theme].navLabel : n.label; }

export function TopNav() {
  var profile = activeProfile();
  var links = profile.nav.map(function (n) {
    var active = n.key === state.route || (n.key === "orders.list" && state.route === "order.detail") || (n.key === "products" && state.route === "checkout") || (n.key === "proposals.list" && state.route === "proposal.detail");
    return h("span", {
      "class": "nav-link" + (active ? " nav-link--active" : ""),
      "data-action": "nav.go", "data-id": n.key, "data-state": active ? "active" : undefined
    }, navLabel(n));
  });

  var actions = [
    h("div", { "class": "icon-btn icon-btn--optional", "data-action": "ui.toggleMode", title: "Toggle light/dark" }, state.mode === "Dark" ? "\u2600" : "\u263e"),
    ActionButton({ variant: "btn--primary", label: profile.primary.label, action: profile.primary.action, visualId: "primary-cta" })
  ];
  if (!profile.weatherCalendar) actions.push(h("div", { "class": "icon-btn icon-btn--optional", "data-action": "calendar.open", title: "Calendar" }, "\ud83d\udcc5"));
  if (profile.showCart) actions.push(h("div", { "class": "icon-btn", "data-action": "cart.open", title: "Cart" }, ["\ud83d\uded2", cartCount() ? h("span", { "class": "cart-badge", "data-bind": "cart.count" }, String(cartCount())) : null]));
  actions.push(h("div", { "class": "icon-btn icon-btn--optional", "data-action": "activity.open", title: "Activity" }, ["\ud83d\udd14", h("span", { "class": "dot-badge" })]));
  actions.push(h("div", { "class": "avatar", "data-action": "profile.open", title: "Profile" }));
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
      profile.nav.map(function (n) {
        var active = n.key === state.route || (n.key === "orders.list" && state.route === "order.detail");
        return h("span", { "class": "nav-link" + (active ? " nav-link--active" : ""), "data-action": "nav.go", "data-id": n.key }, navLabel(n));
      })
    ));
  }
  return h("div", { "class": "top-nav-wrap" }, nav);
}

/* =========================================================
   CABINET  (data-route="orders.list")
   ========================================================= */
