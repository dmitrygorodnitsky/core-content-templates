// customer-portal-design/src/app.js — presentation runtime (auto-split from app.js). No business logic.
import { F } from "../data/fixtures.js";
import { clear, h } from "./dom.js";
import { activeProfile, cmdPhase, currentOrder, isPublic, isSpa, state } from "./state.js";
import { ACTIONS, bindActions, go, openOrder, pickTheme, setState, toast } from "./actions.js";
import { renderRoute } from "./router.js";
import { ActionButton } from "./components/primitives/ActionButton.js";
import { InlineFailure } from "./components/primitives/RouteStates.js";
import { SimulationBadge } from "./components/spa/CommerceBits.js";
import { SpaBookingFlow, flowTitle } from "./components/spa/SpaBookingFlow.js";
import { ServiceCard } from "./components/commerce/ServiceCard.js";
import { AppShell } from "./components/shell/AppShell.js";
import { AccountBootstrap } from "./components/shell/AccountBootstrap.js";

export function BookingDrawer() {
  /* wave 16 — with a Calm Harbor flow open, the drawer body is the complete
     multi-step booking flow (context → optional specialist → slots + server
     hold → simulated review). The legacy single-step drawer below stays for
     the other verticals. */
  if (state.spaFlow) {
    return h("div", null, [
      h("div", { "class": "scrim", "data-action": "booking.close", "data-visual-id": "scrim" }),
      h("aside", { "class": "drawer", "data-module": "drawer", "data-visual-id": "booking-drawer", "data-state": "drawer-open", role: "dialog", "aria-label": flowTitle(state.spaFlow) }, [
        h("div", { "class": "drawer__head" }, [
          h("div", { "class": "drawer__title" }, flowTitle(state.spaFlow)),
          h("button", { "class": "drawer__close", "data-action": "booking.close", "aria-label": "Close" }, "\u2715")
        ]),
        SpaBookingFlow()
      ])
    ]);
  }
  var v = F.themes[state.theme];
  var bkPhase = cmdPhase("booking.confirm:booking"); /* wave 13 — confirm is a command */
  /* wave 15 — Calm Harbor booking bridge: the review is explicitly SIMULATED
     (no charge), and held-slot expiry / price change are BLOCKING states —
     confirm stays disabled until an explicit reload picks a new hold/quote. */
  var spaBridge = isSpa() && state.capability === "target-appointments";
  var holdBlocked = spaBridge && state.spaHold !== "held";
  var spaReview = null;
  if (spaBridge) {
    spaReview = h("div", { "class": "booking-review", "data-module": "booking-review", "data-visual-id": "booking-review", "data-payment-mode": "SIMULATED", "data-state": state.spaHold }, [
      state.spaHold === "held" ? h("div", { "class": "booking-review__hold" }, "Your time is held for 10 minutes while you review — confirming books it.") : null,
      state.spaHold === "slot-expired" ? InlineFailure({ msg: "Your held time expired — nothing was booked. Pick a new time to continue.", retryAction: "ui.retry", retryId: "booking-hold", retryLabel: "Find a new time" }) : null,
      state.spaHold === "repriced" ? InlineFailure({ msg: "The price for this time changed while you were reviewing — reload and check it before confirming.", retryAction: "ui.retry", retryId: "booking-hold", retryLabel: "Reload & review" }) : null,
      SimulationBadge(true),
      h("div", { style: "font-size:11.5px;color:var(--ink-3);line-height:1.5;margin-top:6px" }, "No charge is made when you confirm — you pay at the studio as usual.")
    ]);
  }
  return h("div", null, [
    h("div", { "class": "scrim", "data-action": "booking.close", "data-visual-id": "scrim" }),
    h("aside", { "class": "drawer", "data-module": "drawer", "data-visual-id": "booking-drawer", "data-state": "drawer-open", role: "dialog", "aria-label": "Book a service" }, [
      h("div", { "class": "drawer__head" }, [
        h("div", { "class": "drawer__title" }, activeProfile().drawerTitle),
        h("button", { "class": "drawer__close", "data-action": "booking.close", "aria-label": "Close" }, "\u2715")
      ]),
      h("div", { style: "display:flex;flex-direction:column;gap:9px;margin-bottom:18px" },
        v.svc.map(function (s, i) { return ServiceCard(s, i); })),
      spaReview,
      bkPhase === "failed" || bkPhase === "conflict" ? h("div", { style: "margin-bottom:12px" }, InlineFailure({
        msg: bkPhase === "conflict" ? "That time window just changed \u2014 pick again before confirming." : "Your booking wasn\u2019t confirmed \u2014 nothing is scheduled yet.",
        retryAction: "booking.confirm", retryLabel: bkPhase === "conflict" ? "Re-check & confirm" : "Try again"
      })) : null,
      ActionButton({ variant: "btn--primary", label: spaBridge ? "Book — no charge" : "Confirm booking", action: "booking.confirm", block: true, lg: true, visualId: "confirm-booking", disabled: holdBlocked,
        pending: bkPhase === "pending", pendingLabel: "Confirming\u2026" })
    ])
  ]);
}

/* =========================================================
   Dev harness toolbar (PREVIEW ONLY — data-dev-toolbar)
   ========================================================= */

export function DevToolbar() {
  function sel(label, value, opts, on) {
    return h("div", { "class": "dev-toolbar__group" }, [
      h("span", { "class": "dev-toolbar__label" }, label),
      h("select", { onchange: null }, opts.map(function (o) {
        var opt = h("option", { value: o.v }, o.l); if (o.v === value) opt.selected = true; return opt;
      }))
    ]);
  }
  var routeSel = h("select", {}, [
    { v: "orders.list", l: "orders.list" }, { v: "order.detail", l: "order.detail" }, { v: "appointment.detail", l: "appointment.detail" }, { v: "care", l: "care" }, { v: "services", l: "services" },
    { v: "pricing", l: "pricing" }, { v: "products", l: "products" }, { v: "product.detail", l: "product.detail" }, { v: "cart", l: "cart" }, { v: "checkout", l: "checkout" },
    { v: "account", l: "account" }, { v: "purchases.list", l: "purchases.list" }, { v: "purchase.detail", l: "purchase.detail" }, { v: "plan", l: "plan" },
    { v: "proposals.list", l: "proposals.list" }, { v: "proposal.detail", l: "proposal.detail" },
    { v: "profile", l: "profile" }, { v: "calendar", l: "calendar" }, { v: "activity", l: "activity" }, { v: "support", l: "support" },
    { v: "landing", l: "landing" }, { v: "seo.landing", l: "seo.landing" }, { v: "auth.oidc", l: "auth.oidc" }, { v: "auth.phone", l: "auth.phone (ref)" }, { v: "auth.code", l: "auth.code (ref)" }
  ].map(function (o) { var e = h("option", { value: o.v }, o.l); if (o.v === state.route) e.selected = true; return e; }));
  routeSel.addEventListener("change", function () {
    if (routeSel.value === "order.detail" && !state.currentOrderId) { openOrder((currentOrder() || {}).id); }
    else if (routeSel.value === "purchase.detail" && !state.spaCurrentPurchase) { state.spaCurrentPurchase = "pur-9f27a1"; go("purchase.detail"); }
    else if (routeSel.value === "appointment.detail") { if (!state.spaCurrentAppointment) state.spaCurrentAppointment = "appt-ch-10318"; go("appointment.detail"); }
    else if (routeSel.value === "product.detail") { if (!state.spaCurrentProduct) state.spaCurrentProduct = "prd-7f3a91"; state.spaGallery = 0; go("product.detail"); }
    else go(routeSel.value);
  });

  var themeSel = h("select", {}, Object.keys(F.themes).map(function (n) { var e = h("option", { value: n }, n); if (n === state.theme) e.selected = true; return e; }));
  themeSel.addEventListener("change", function () { pickTheme(themeSel.value); });

  var stateSel = h("select", {}, ["ready", "loading", "empty", "error", "unauthorized", "not-found", "conflict", "unavailable"].map(function (n) { var e = h("option", { value: n }, n); if (n === state.view) e.selected = true; return e; }));
  stateSel.addEventListener("change", function () { setState({ view: stateSel.value }); });

  /* wave 13 — shared account-bootstrap state (private routes only) */
  var accountGroup = null;
  if (!isPublic()) {
    var aSel = h("select", {}, ["ready", "resolving-customer", "customer-unavailable", "customer-not-linked", "customer-account-ambiguous", "organization-forbidden", "customer-forbidden", "session-expired"].map(function (n) {
      var e = h("option", { value: n }, n); if (n === state.account) e.selected = true; return e;
    }));
    aSel.addEventListener("change", function () { setState({ account: aSel.value }); });
    accountGroup = h("div", { "class": "dev-toolbar__group" }, [h("span", { "class": "dev-toolbar__label" }, "account"), aSel]);
  }

  /* wave 13 — forced command outcome (succeeded = demo readback) */
  var cSel2 = h("select", {}, ["succeeded", "failed", "conflict", "session-lost"].map(function (n) {
    var e = h("option", { value: n }, n); if (n === (state.cmdForce || "succeeded")) e.selected = true; return e;
  }));
  cSel2.addEventListener("change", function () { setState({ cmdForce: cSel2.value === "succeeded" ? null : cSel2.value }); });
  var cmdGroup = h("div", { "class": "dev-toolbar__group" }, [h("span", { "class": "dev-toolbar__label" }, "cmd"), cSel2]);

  var modeBtn = h("button", { "class": state.mode === "Dark" ? "is-on" : "" }, state.mode === "Dark" ? "\u263e dark" : "\u2600 light");
  modeBtn.addEventListener("click", function () { setState({ mode: state.mode === "Dark" ? "Light" : "Dark" }); });
  routeSel.value = state.route; themeSel.value = state.theme; stateSel.value = state.view;

  var vwGroup = h("div", { "class": "dev-toolbar__group" }, [h("span", { "class": "dev-toolbar__label" }, "vw")].concat(
    ["full", "390", "768", "1180", "1440"].map(function (w) {
      var b = h("button", { "class": state.vw === w ? "is-on" : "" }, w);
      b.addEventListener("click", function () { setState({ vw: w }); });
      return b;
    })
  ));

  /* retreat-request visual state (only on the pest care hub) */
  var retreatGroup = null;
  if (state.route === "care" && (F.careModules[state.theme] || {}).kind === "monitoring") {
    var rSel = h("select", {}, ["available", "requesting", "used"].map(function (n) {
      var e = h("option", { value: n }, n);
      if (n === (state.careRetreat || F.careModules[state.theme].guarantee.status)) e.selected = true;
      return e;
    }));
    rSel.addEventListener("change", function () { setState({ careRetreat: rSel.value }); });
    retreatGroup = h("div", { "class": "dev-toolbar__group" }, [h("span", { "class": "dev-toolbar__label" }, "retreat"), rSel]);
  }

  /* Core OIDC session-state preview (only on auth.oidc) */
  var oidcGroup = null;
  if (state.route === "auth.oidc") {
    var oSel = h("select", {}, ["checking-session", "ready-signed-out", "redirecting", "unavailable", "ready-signed-in", "signing-out"].map(function (n) {
      var e = h("option", { value: n }, n);
      if (n === state.oidc) e.selected = true;
      return e;
    }));
    oSel.addEventListener("change", function () {
      var v = oSel.value;
      setState({ oidc: v, sessionName: (v === "ready-signed-in" || v === "signing-out") ? (state.sessionName || F.customer.firstName) : null });
    });
    oidcGroup = h("div", { "class": "dev-toolbar__group" }, [h("span", { "class": "dev-toolbar__label" }, "oidc"), oSel]);
  }

  /* CTA lifecycle preview (only on the public SEO landing) */
  var ctaGroup = null;
  if (state.route === "seo.landing") {
    var cSel = h("select", {}, ["idle", "pending", "success", "error"].map(function (n) {
      var e = h("option", { value: n }, n);
      if (n === (state.seoCtaForce || "idle")) e.selected = true;
      return e;
    }));
    cSel.addEventListener("change", function () { setState({ seoCtaForce: cSel.value === "idle" ? null : cSel.value }); });
    ctaGroup = h("div", { "class": "dev-toolbar__group" }, [h("span", { "class": "dev-toolbar__label" }, "cta"), cSel]);
  }

  /* wave 14 — Calm Harbor spa capability config + review scenarios (Beauty only) */
  var spaGroups = [];
  if (state.theme === "Beauty") {
    var group = function (label, el) { return h("div", { "class": "dev-toolbar__group" }, [h("span", { "class": "dev-toolbar__label" }, label), el]); };
    var mkSel = function (opts, val, on) {
      var s2 = h("select", {}, opts.map(function (n) { var e = h("option", { value: n }, n); if (n === val) e.selected = true; return e; }));
      s2.addEventListener("change", function () { on(s2.value); });
      return s2;
    };
    spaGroups.push(group("spa", mkSel(["current-staging", "target-appointments"], state.capability, function (v) { setState({ capability: v, accountMenu: false, mobileNav: false }); })));
    if (state.capability === "target-appointments") {
      spaGroups.push(group("booking", mkSel(["closed", "open"], state.spaBooking, function (v) { setState({ spaBooking: v }); })));
      /* wave 15 — the retail-commerce-open deployment capability */
      spaGroups.push(group("retail", mkSel(["browse-only", "retail-commerce-open"], state.spaRetail, function (v) { setState({ spaRetail: v }); })));
      if (state.route === "orders.list") spaGroups.push(group("appt", mkSel(["salon", "home", "long", "minimal", "empty", "no-history"], state.spaAppt, function (v) { setState({ spaAppt: v, spaCancelled: {} }); })));
      /* wave 16 — appointment detail scenario (refs + one non-enumerating unknown) */
      if (state.route === "appointment.detail") spaGroups.push(group("adet", mkSel(["appt-ch-10318", "appt-ch-10322", "appt-ch-10334", "appt-ch-10351", "appt-ch-10203", "appt-ch-10101", "unknown-ref"], state.spaCurrentAppointment || "appt-ch-10318", function (v) { setState({ spaCurrentAppointment: v, spaCancelled: {}, view: "ready" }); })));
      /* wave 16 — sellable plan contract + published-offer scenario */
      if (state.route === "pricing" || state.route === "services") {
        spaGroups.push(group("plansell", mkSel(["closed", "open"], state.spaPlanCommerce, function (v) { setState({ spaPlanCommerce: v }); })));
        spaGroups.push(group("offers", mkSel(["sellable", "unavailable", "changed"], state.spaOfferDemo, function (v) { setState({ spaOfferDemo: v }); })));
      }
      if (state.route === "account") spaGroups.push(group("acct", mkSel(["full", "partial"], state.spaAccountPartial ? "partial" : "full", function (v) { setState({ spaAccountPartial: v === "partial" }); })));
      if (state.route === "plan") spaGroups.push(group("plan", mkSel(["active", "expiring", "exhausted", "cancelled", "empty"], state.spaPlanScenario, function (v) { setState({ spaPlanScenario: v, spaPlanCancelled: {} }); })));
      if (state.route === "cart") spaGroups.push(group("cart", mkSel(["as-added", "stale-price", "inventory-conflict"], state.spaCartDemo, function (v) {
        if (!state.spaCart || !state.spaCart.lines.length) window.AircovePortal.seedCart(); /* demo convenience: review scenarios need a non-empty bag */
        setState({ spaCartDemo: v });
      })));
      if (state.route === "checkout") {
        spaGroups.push(group("co", mkSel(["ready", "repriced", "inventory-conflict", "slot-expired"], state.spaCheckoutDemo, function (v) { setState({ spaCheckoutDemo: v, spaResult: null }); })));
        spaGroups.push(group("src", mkSel(["cart", "plan"], state.spaCheckoutSource, function (v) {
          if (v === "cart" && (!state.spaCart || !state.spaCart.lines.length)) window.AircovePortal.seedCart();
          setState({ spaCheckoutSource: v, spaResult: null });
        })));
      }
      if (state.spaBooking === "open") {
        spaGroups.push(group("hold", mkSel(["held", "slot-expired", "repriced"], state.spaHold, function (v) { setState({ spaHold: v }); })));
        spaGroups.push(group("bookres", mkSel(["appointment-and-order", "appointment-only"], state.spaBookResult, function (v) { setState({ spaBookResult: v }); })));
      }
      /* wave 16 — booking-flow review scenarios (only while the flow is open) */
      if (state.spaFlow) {
        spaGroups.push(group("slots", mkSel(["ready", "loading", "empty", "error"], state.spaSlots, function (v) { setState({ spaSlots: v }); })));
        if (state.spaFlow.entry === "credit") spaGroups.push(group("credit", mkSel(["ok", "unavailable", "exhausted", "changed"], state.spaCredit, function (v) { setState({ spaCredit: v }); })));
      }
    } else if (state.route === "orders.list") {
      spaGroups.push(group("rows", mkSel(["many", "one"], state.spaRows, function (v) { setState({ spaRows: v }); })));
      spaGroups.push(group("omedia", mkSel(["mixed", "loading", "missing", "forbidden", "broken"], state.spaOrderMedia, function (v) { setState({ spaOrderMedia: v }); })));
    }
    /* wave 17 — Shop model grouping + product detail scenarios (both capabilities) */
    if (state.route === "products" || state.route === "product.detail") {
      spaGroups.push(group("models", mkSel(["ready", "unavailable"], state.spaModels, function (v) { setState({ spaModels: v }); })));
    }
    if (state.route === "product.detail") {
      spaGroups.push(group("pdet", mkSel(["prd-7f3a91", "prd-2c88de", "prd-b41f07", "prd-9d20c5", "prd-5e6a12", "prd-c130fb", "prd-longform", "unknown-ref"], state.spaCurrentProduct || "prd-7f3a91", function (v) { setState({ spaCurrentProduct: v, spaGallery: 0, view: "ready" }); })));
      spaGroups.push(group("rev", mkSel(["ready", "loading", "empty", "unavailable", "error"], state.spaReviews, function (v) { setState({ spaReviews: v }); })));
    }
    spaGroups.push(group("name", mkSel(["default", "long"], state.spaLongName ? "long" : "default", function (v) { setState({ spaLongName: v === "long" }); })));
  }

  return h("div", { "class": "dev-toolbar", "data-dev-toolbar": "true" }, [
    h("div", { "class": "dev-toolbar__group" }, [h("span", { "class": "dev-toolbar__label" }, "route"), routeSel]),
    h("div", { "class": "dev-toolbar__group" }, [h("span", { "class": "dev-toolbar__label" }, "theme"), themeSel]),
    h("div", { "class": "dev-toolbar__group" }, [h("span", { "class": "dev-toolbar__label" }, "state"), stateSel]),
    accountGroup,
    cmdGroup,
    oidcGroup,
    retreatGroup,
    ctaGroup
  ].concat(spaGroups).concat([
    modeBtn,
    vwGroup
  ]));
}

/* =========================================================
   Root render
   ========================================================= */
var mount, shell, resizeObs;

export function render() {
  /* theming: declarative attributes only */
  var root = document.documentElement;
  root.setAttribute("data-theme", F.themes[state.theme].slug);
  root.setAttribute("data-mode", state.mode === "Dark" ? "dark" : "light");

  clear(mount);

  var frame = h("div", { "class": "viewport-frame", "data-vw": state.vw });
  /* wave 13 — no private route content (fixture or otherwise) renders while the
     customer Account is unresolved, failed, unlinked, forbidden or expired */
  var content = (!isPublic() && state.account !== "ready") ? AccountBootstrap() : renderRoute();
  if (content && state.route !== lastRoute) content.classList.add("route-enter");
  lastRoute = state.route;
  shell = AppShell(content);
  frame.appendChild(shell);
  mount.appendChild(h("div", { "class": "viewport-host" }, frame));

  if (state.drawer === "booking") mount.appendChild(BookingDrawer());
  if (state.toast) mount.appendChild(h("div", { "class": "toast", "data-module": "toast", "data-visual-id": "toast" }, [h("span", { "class": "toast__dot" }), state.toast]));

  mount.appendChild(DevToolbar());

  applyResponsive();
  positionNavPill();

  /* keep chat scrolled to newest */
  var thread = mount.querySelector(".chat-thread");
  if (thread) thread.scrollTop = thread.scrollHeight;
}

/* sliding active-nav pill: animate from the previous position to the
   new active link so it glides on route change (survives full re-render) */
var lastPill = null;
var lastRoute = null;
function positionNavPill() {
  var links = mount.querySelector(".nav-links");
  var pill = links && links.querySelector("[data-nav-pill]");
  if (!pill) { lastPill = null; return; }
  var active = links.querySelector(".nav-link--active");
  if (!active || getComputedStyle(links).display === "none") { pill.style.opacity = "0"; lastPill = null; return; }
  var target = { left: active.offsetLeft, width: active.offsetWidth };
  pill.style.opacity = "1";
  if (lastPill) {
    pill.style.transition = "none";
    pill.style.width = lastPill.width + "px";
    pill.style.transform = "translateX(" + lastPill.left + "px)";
    pill.getBoundingClientRect(); /* force reflow before animating */
    pill.style.transition = "";
  }
  pill.style.width = target.width + "px";
  pill.style.transform = "translateX(" + target.left + "px)";
  lastPill = target;
}

/* container-width responsive classes on the shell */
function applyResponsive() {
  if (resizeObs) resizeObs.disconnect();
  var target = shell;
  var apply = function (w) {
    target.classList.remove("vw-mobile", "vw-tablet", "vw-compact");
    if (w <= 560) target.classList.add("vw-mobile");
    else if (w <= 900) target.classList.add("vw-tablet");
    if (w <= 1040) target.classList.add("vw-compact"); /* nav-links -> hamburger */
  };
  apply(shell.getBoundingClientRect().width);
  resizeObs = new ResizeObserver(function (ents) { apply(ents[0].contentRect.width); });
  resizeObs.observe(shell);
}

/* boot */
document.addEventListener("DOMContentLoaded", function () {
  /* optional initial route for direct-preview entry files (e.g. seo-landing.html
     sets window.__initialRoute). Preview convenience only — Codex owns real routing. */
  if (window.__initialRoute) state.route = window.__initialRoute;
  if (window.__initialTheme && F.themes[window.__initialTheme]) { state.theme = window.__initialTheme; state.orders = F.ordersFor(window.__initialTheme); }
  mount = document.getElementById("app");
  bindActions(mount);
  render();
});

/* expose for Codex / tests (seedCart is a PREVIEW convenience for the dev
   toolbar's cart/checkout review scenarios — it replays add commands against
   the demo server cart) */
window.AircovePortal = { state: state, go: go, setState: setState, ACTIONS: ACTIONS,
  seedCart: function () {
    return import("./actions.js").then(function (a) {
      a.spaAddLine("rtl-beauty-01");
      a.spaAddLine("rtl-beauty-04");
      var lines = (state.spaCart ? state.spaCart.lines : []).map(function (l) { return l.ref === "cln-04" ? Object.assign({}, l, { qty: 2 }) : l; });
      a.spaSetLines(lines);
    });
  } };
