// customer-portal-design/src/app.js — presentation runtime (auto-split from app.js). No business logic.
import { F } from "../data/fixtures.js";
import { clear, h } from "./dom.js";
import { activeProfile, currentOrder, state } from "./state.js";
import { ACTIONS, bindActions, go, openOrder, pickTheme, setState, toast } from "./actions.js";
import { renderRoute } from "./router.js";
import { ActionButton } from "./components/primitives/ActionButton.js";
import { ServiceCard } from "./components/commerce/ServiceCard.js";
import { AppShell } from "./components/shell/AppShell.js";

export function BookingDrawer() {
  var v = F.themes[state.theme];
  return h("div", null, [
    h("div", { "class": "scrim", "data-action": "booking.confirm", "data-visual-id": "scrim" }),
    h("aside", { "class": "drawer", "data-module": "drawer", "data-visual-id": "booking-drawer", "data-state": "drawer-open", role: "dialog", "aria-label": "Book a service" }, [
      h("div", { "class": "drawer__head" }, [
        h("div", { "class": "drawer__title" }, activeProfile().drawerTitle),
        h("button", { "class": "drawer__close", "data-action": "booking.confirm", "aria-label": "Close" }, "\u2715")
      ]),
      h("div", { style: "display:flex;flex-direction:column;gap:9px;margin-bottom:18px" },
        v.svc.map(function (s, i) { return ServiceCard(s, i); })),
      ActionButton({ variant: "btn--primary", label: "Confirm booking", action: "booking.confirm", block: true, lg: true, visualId: "confirm-booking" })
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
    { v: "orders.list", l: "orders.list" }, { v: "order.detail", l: "order.detail" }, { v: "care", l: "care" }, { v: "services", l: "services" },
    { v: "pricing", l: "pricing" }, { v: "products", l: "products" }, { v: "checkout", l: "checkout" },
    { v: "proposals.list", l: "proposals.list" }, { v: "proposal.detail", l: "proposal.detail" },
    { v: "profile", l: "profile" }, { v: "calendar", l: "calendar" }, { v: "activity", l: "activity" }, { v: "support", l: "support" },
    { v: "landing", l: "landing" }, { v: "seo.landing", l: "seo.landing" }, { v: "auth.oidc", l: "auth.oidc" }, { v: "auth.phone", l: "auth.phone (ref)" }, { v: "auth.code", l: "auth.code (ref)" }
  ].map(function (o) { var e = h("option", { value: o.v }, o.l); if (o.v === state.route) e.selected = true; return e; }));
  routeSel.addEventListener("change", function () {
    if (routeSel.value === "order.detail" && !state.currentOrderId) { openOrder((currentOrder() || {}).id); }
    else go(routeSel.value);
  });

  var themeSel = h("select", {}, Object.keys(F.themes).map(function (n) { var e = h("option", { value: n }, n); if (n === state.theme) e.selected = true; return e; }));
  themeSel.addEventListener("change", function () { pickTheme(themeSel.value); });

  var stateSel = h("select", {}, ["ready", "loading", "empty", "error", "unauthorized"].map(function (n) { var e = h("option", { value: n }, n); if (n === state.view) e.selected = true; return e; }));
  stateSel.addEventListener("change", function () { setState({ view: stateSel.value }); });

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

  return h("div", { "class": "dev-toolbar", "data-dev-toolbar": "true" }, [
    h("div", { "class": "dev-toolbar__group" }, [h("span", { "class": "dev-toolbar__label" }, "route"), routeSel]),
    h("div", { "class": "dev-toolbar__group" }, [h("span", { "class": "dev-toolbar__label" }, "theme"), themeSel]),
    h("div", { "class": "dev-toolbar__group" }, [h("span", { "class": "dev-toolbar__label" }, "state"), stateSel]),
    oidcGroup,
    retreatGroup,
    ctaGroup,
    modeBtn,
    vwGroup
  ]);
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
  var content = renderRoute();
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

/* expose for Codex / tests */
window.AircovePortal = { state: state, go: go, setState: setState, ACTIONS: ACTIONS };
