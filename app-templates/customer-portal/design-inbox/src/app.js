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
    { v: "orders.list", l: "orders.list" }, { v: "order.detail", l: "order.detail" }, { v: "services", l: "services" },
    { v: "pricing", l: "pricing" }, { v: "products", l: "products" }, { v: "checkout", l: "checkout" },
    { v: "proposals.list", l: "proposals.list" }, { v: "proposal.detail", l: "proposal.detail" },
    { v: "profile", l: "profile" }, { v: "calendar", l: "calendar" }, { v: "activity", l: "activity" }, { v: "support", l: "support" },
    { v: "landing", l: "landing" }, { v: "auth.phone", l: "auth.phone" }, { v: "auth.code", l: "auth.code" }
  ].map(function (o) { var e = h("option", { value: o.v }, o.l); if (o.v === state.route) e.selected = true; return e; }));
  routeSel.addEventListener("change", function () {
    if (routeSel.value === "order.detail" && !state.currentOrderId) { openOrder((currentOrder() || {}).id); }
    else go(routeSel.value);
  });

  var themeSel = h("select", {}, Object.keys(F.themes).map(function (n) { var e = h("option", { value: n }, n); if (n === state.theme) e.selected = true; return e; }));
  themeSel.addEventListener("change", function () { pickTheme(themeSel.value); });

  var stateSel = h("select", {}, ["ready", "loading", "empty", "error"].map(function (n) { var e = h("option", { value: n }, n); if (n === state.view) e.selected = true; return e; }));
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

  return h("div", { "class": "dev-toolbar", "data-dev-toolbar": "true" }, [
    h("div", { "class": "dev-toolbar__group" }, [h("span", { "class": "dev-toolbar__label" }, "route"), routeSel]),
    h("div", { "class": "dev-toolbar__group" }, [h("span", { "class": "dev-toolbar__label" }, "theme"), themeSel]),
    h("div", { "class": "dev-toolbar__group" }, [h("span", { "class": "dev-toolbar__label" }, "state"), stateSel]),
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
  mount = document.getElementById("app");
  bindActions(mount);
  render();
});

/* expose for Codex / tests */
window.AircovePortal = { state: state, go: go, setState: setState, ACTIONS: ACTIONS };
