// customer-portal-design/src/components/shell/SpaTopNav.js — Wave 14: Calm Harbor Spa
// authenticated shell (Beauty vertical). Two capability variants of the SAME accepted
// top-nav composition, chosen by deployment config (state.capability — preview only):
//   current-staging      nav = Orders / Services & prices / Shop + account menu.
//                        No + Book, Calendar, cart, notification badge or editable
//                        profile — none of those source contracts are open. The only
//                        global CTA is honest navigation ("Browse services").
//   target-appointments  nav = Appointments / Services & prices / Shop (visually
//                        secondary). "+ Book" renders ONLY while the booking command
//                        contract is open (data-booking="open"); closed keeps the
//                        honest browse CTA.
// The account menu owns session identity: ONE customer-safe display name
// (data-bind session.displayName), Support, light/dark and secure sign-out. No
// editable profile until a profile write contract is opened. Shop stays last and
// muted (nav-link--secondary) — it never outranks appointments or services.
import { h } from "../../dom.js";
import { activeProfile, spaBookingOpen, spaCapability, spaCartCount, spaCustomer, spaRetailOpen, state } from "../../state.js";
import { ActionButton } from "../primitives/ActionButton.js";

function spaBrand() {
  return h("div", { "class": "top-nav__brand", "data-action": "nav.go", "data-id": "orders.list" }, [
    h("div", { "class": "brand-logo" }),
    h("span", { "class": "brand-name", "data-bind": "brand.name" }, state.config.brandName || "Calm Harbor Spa")
  ]);
}

function linkActive(key) {
  if (key === "orders.list") return state.route === "orders.list" || state.route === "order.detail";
  if (key === "services") return state.route === "services" || state.route === "pricing";
  if (key === "products") return state.route === "products" || state.route === "cart" || state.route === "checkout";
  if (key === "account") return ["account", "purchases.list", "purchase.detail", "plan", "profile"].indexOf(state.route) !== -1; /* wave 15 */
  return key === state.route;
}

export function SpaTopNav(gated) {
  var cap = spaCapability();
  var profile = activeProfile();
  var open = spaBookingOpen();
  var cust = spaCustomer();

  /* gated shell (account not ready) — brand + light/dark only, same as accepted */
  if (gated) {
    return h("div", { "class": "top-nav-wrap" }, h("nav", { "class": "top-nav", "data-module": "top-nav", "data-visual-id": "top-nav", "data-state": "gated", "data-capability": cap }, [
      spaBrand(),
      h("div", { "class": "nav-links" }),
      h("div", { "class": "top-nav__actions" }, [
        h("div", { "class": "icon-btn", "data-action": "ui.toggleMode", title: "Toggle light/dark" }, state.mode === "Dark" ? "\u2600" : "\u263e")
      ])
    ]));
  }

  var links = profile.nav.map(function (n) {
    var active = linkActive(n.key);
    return h("span", {
      "class": "nav-link" + (n.secondary ? " nav-link--secondary" : "") + (active ? " nav-link--active" : ""),
      "data-action": "nav.go", "data-id": n.key, "data-state": active ? "active" : undefined
    }, navLabel(n));
  });

  /* global CTA: "+ Book" exists ONLY in the open-booking target scenario;
     otherwise the honest catalog navigation. Never a fake booking control. */
  var cta = open
    ? ActionButton({ variant: "btn--primary", label: state.config.primaryCtaLabel || "+ Book", action: "booking.open", visualId: "primary-cta" })
    : ActionButton({ variant: "btn--ghost", label: state.config.primaryCtaLabel || "Browse services", action: "nav.go", id: "services", visualId: "primary-cta" });
  cta.classList.add("spa-cta");
  if (!open) cta.classList.add("spa-cta--browse");

  var initial = (cust.fullName || "?").charAt(0).toUpperCase();
  var accountBtn = h("button", {
    "class": "account-btn", "data-module": "account-control", "data-visual-id": "account-control",
    "data-action": "account.menu", "data-state": state.accountMenu ? "open" : undefined,
    "aria-haspopup": "menu", "aria-expanded": state.accountMenu ? "true" : "false", title: "Account"
  }, [
    h("span", { "class": "account-btn__ava" }, initial),
    h("span", { "class": "account-btn__name", "data-bind": "session.displayName" }, cust.fullName)
  ]);

  var nav = h("nav", { "class": "top-nav", "data-module": "top-nav", "data-visual-id": "top-nav", "data-capability": cap, "data-booking": cap === "target-appointments" ? (open ? "open" : "closed") : undefined, "data-retail": cap === "target-appointments" ? (spaRetailOpen() ? "retail-commerce-open" : "browse-only") : undefined, "data-state": state.accountMenu ? "account-menu-open" : undefined }, [
    spaBrand(),
    h("div", { "class": "nav-links" }, [h("div", { "class": "nav-pill", "data-nav-pill": "true" })].concat(links)),
    h("div", { "class": "top-nav__actions" }, [
      h("div", { "class": "icon-btn icon-btn--optional", "data-action": "ui.toggleMode", title: "Toggle light/dark" }, state.mode === "Dark" ? "\u2600" : "\u263e"),
      /* wave 15 — the bag opens ONLY under retail-commerce-open; the count is the
         server cart's line count and never implies a reservation */
      spaRetailOpen() ? h("button", { "class": "icon-btn spa-bag", "data-module": "cart-indicator", "data-visual-id": "cart-indicator", "data-action": "cart.open", title: "Your bag", "data-state": spaCartCount() ? "filled" : "empty" }, [
        "\u25a1",
        spaCartCount() ? h("span", { "class": "spa-bag__count", "data-bind": "cart.lines.length" }, String(spaCartCount())) : null
      ]) : null,
      cta,
      accountBtn,
      h("div", { "class": "icon-btn hamburger", "data-action": "ui.toggleMobileNav", title: "Menu" }, "\u2630")
    ])
  ]);

  /* account menu — session-safe identity + sign-out only (no profile editing,
     no Account id, no plan/entitlement claims) */
  if (state.accountMenu) {
    nav.appendChild(h("div", { "class": "account-menu", "data-module": "account-menu", "data-visual-id": "account-menu", "data-state": "account-menu-open", role: "menu" }, [
      h("div", { "class": "account-menu__head" }, [
        h("span", { "class": "account-btn__ava account-menu__ava" }, initial),
        h("div", { style: "min-width:0;flex:1" }, [
          h("div", { "class": "account-menu__name", "data-bind": "session.displayName" }, cust.fullName),
          h("div", { "class": "account-menu__sub" }, "Signed in with the secure account service")
        ])
      ]),
      h("button", { "class": "account-menu__item", "data-action": "support.open", role: "menuitem" }, (state.config.navigation && state.config.navigation.support) || "Support"),
      h("button", { "class": "account-menu__item", "data-action": "ui.toggleMode", role: "menuitem" }, state.mode === "Dark" ? "Switch to light mode" : "Switch to dark mode"),
      h("div", { "class": "account-menu__divider" }),
      h("button", { "class": "account-menu__item account-menu__item--danger", "data-action": "auth.signOut", role: "menuitem" }, "Sign out")
    ]));
  }

  /* mobile menu — the 3 product destinations + account/overflow items */
  if (state.mobileNav) {
    var mob = h("div", { "class": "mobile-nav", "data-state": "mobile-navigation-open" },
      profile.nav.map(function (n) {
        var active = linkActive(n.key);
        return h("span", { "class": "nav-link" + (active ? " nav-link--active" : ""), "data-action": "nav.go", "data-id": n.key }, navLabel(n));
      })
    );
    mob.appendChild(h("div", { "class": "mobile-nav__divider" }));
    mob.appendChild(h("span", { "class": "nav-link", "data-action": "support.open" }, (state.config.navigation && state.config.navigation.support) || "Support"));
    mob.appendChild(h("span", { "class": "nav-link", "data-action": "auth.signOut" }, "Sign out"));
    nav.appendChild(mob);
  }

  return h("div", { "class": "top-nav-wrap" }, nav);
}

function navLabel(item) {
  var configured = state.config.navigation || {};
  var key = {
    "orders.list": "primary",
    services: "services",
    pricing: "pricing",
    products: "products",
    account: "account",
  }[item.key];
  return configured[key] || item.label;
}
