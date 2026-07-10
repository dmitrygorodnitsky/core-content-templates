// customer-portal/runtime/src/app.js — production transfer module.
import { F } from "../data/fixtures.js";
import { clear, h } from "./dom.js";
import { readPortalConfig } from "./config.js";
import { activeProfile, applyPortalConfig, state } from "./state.js";
import { ACTIONS, bindActions, go, setState, toast } from "./actions.js";
import { initRouter, renderRoute } from "./router.js";
import { PortalRuntime } from "./portal-runtime.js";
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
   Root render
   ========================================================= */
var mount, shell, resizeObs, runtime, liveRetryPromise;

export function render() {
  /* theming: declarative attributes only */
  var root = document.documentElement;
  root.setAttribute("data-theme", state.config.theme);
  root.setAttribute("data-mode", state.mode === "Dark" ? "dark" : "light");

  clear(mount);
  if (runtime && state.config.dataMode !== "live") runtime.loadAll();

  var content = renderRoute();
  if (content && state.route !== lastRoute) content.classList.add("route-enter");
  lastRoute = state.route;
  shell = AppShell(content);
  mount.appendChild(shell);

  if (state.drawer === "booking") mount.appendChild(BookingDrawer());
  if (state.toast) mount.appendChild(h("div", { "class": "toast", "data-module": "toast", "data-visual-id": "toast" }, [h("span", { "class": "toast__dot" }), state.toast]));

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

export function retryRuntimeLoad() {
  if (state.config.dataMode !== "live" || !runtime) {
    setState({ view: "ready" });
    return Promise.resolve();
  }
  if (liveRetryPromise) return liveRetryPromise;

  state.view = "loading";
  render();
  liveRetryPromise = runtime.loadAllAsync()
    .then(function () {
      state.view = "ready";
      render();
    })
    .catch(function (error) {
      state.view = state.config.errorMode === "fallback" ? "fallback" : "error";
      console.error("[aircove] runtime retry failed", error);
      render();
    })
    .finally(function () {
      liveRetryPromise = null;
    });
  return liveRetryPromise;
}

/* boot */
document.addEventListener("DOMContentLoaded", function () {
  mount = document.getElementById("app");
  applyPortalConfig(readPortalConfig(mount));
  runtime = new PortalRuntime({ state: state });
  var loaded = state.config.dataMode === "live" ? runtime.loadAllAsync() : Promise.resolve(runtime.loadAll());
  initRouter(render);
  bindActions(mount);
  loaded.then(render).catch(function (error) {
    state.view = state.config.errorMode === "fallback" ? "fallback" : "error";
    console.error("[aircove] runtime load failed", error);
    render();
  });
});

/* expose for Codex / tests */
window.AircovePortal = { state: state, go: go, setState: setState, ACTIONS: ACTIONS, runtime: function () { return runtime; } };
