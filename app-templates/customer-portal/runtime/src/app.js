// customer-portal/runtime/src/app.js — production transfer module.
import { F } from "../data/fixtures.js";
import { clear, h } from "./dom.js";
import { readPortalConfig } from "./config.js";
import { activeProfile, applyPortalConfig, cmdPhase, currentTheme, customerPortalGateActive, isPublic, isSpa, state } from "./state.js";
import { ACTIONS, bindActions, go, setState, toast } from "./actions.js";
import { initRouter, renderRoute } from "./router.js";
import { PortalRuntime } from "./portal-runtime.js";
import { ActionButton } from "./components/primitives/ActionButton.js";
import { InlineFailure } from "./components/primitives/RouteStates.js";
import { SimulationBadge } from "./components/spa/CommerceBits.js";
import { SpaBookingFlow, flowTitle } from "./components/spa/SpaBookingFlow.js";
import { ServiceCard } from "./components/commerce/ServiceCard.js";
import { AppShell } from "./components/shell/AppShell.js";
import { AccountBootstrap } from "./components/shell/AccountBootstrap.js";

export function BookingDrawer() {
  if (state.spaFlow) {
    return h("div", null, [
      h("div", { "class": "scrim", "data-action": "booking.close", "data-visual-id": "scrim" }),
      h("aside", { "class": "drawer", "data-module": "drawer", "data-visual-id": "booking-drawer", "data-state": "drawer-open", role: "dialog", "aria-label": flowTitle(state.spaFlow) }, [
        h("div", { "class": "drawer__head" }, [
          h("div", { "class": "drawer__title" }, flowTitle(state.spaFlow)),
          h("button", { "class": "drawer__close", "data-action": "booking.close", "aria-label": "Close" }, "✕")
        ]),
        SpaBookingFlow()
      ])
    ]);
  }
  var v = currentTheme();
  var phase = cmdPhase("booking.confirm:booking");
  var spaBridge = isSpa() && state.capability === "target-appointments";
  var holdBlocked = spaBridge && state.spaHold !== "held";
  var spaReview = spaBridge ? h("div", { "class": "booking-review", "data-module": "booking-review", "data-visual-id": "booking-review", "data-payment-mode": "SIMULATED", "data-state": state.spaHold }, [
    state.spaHold === "held" ? h("div", { "class": "booking-review__hold" }, "Your time is held for 10 minutes while you review — confirming books it.") : null,
    state.spaHold === "slot-expired" ? InlineFailure({ msg: "Your held time expired — nothing was booked. Pick a new time to continue.", retryAction: "ui.retry", retryId: "booking-hold", retryLabel: "Find a new time" }) : null,
    state.spaHold === "repriced" ? InlineFailure({ msg: "The price for this time changed while you were reviewing — reload and check it before confirming.", retryAction: "ui.retry", retryId: "booking-hold", retryLabel: "Reload & review" }) : null,
    SimulationBadge(true),
    h("div", { style: "font-size:11.5px;color:var(--ink-3);line-height:1.5;margin-top:6px" }, "No charge is made when you confirm — you pay at the studio as usual.")
  ]) : null;
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
      phase === "failed" || phase === "conflict" ? InlineFailure({
        msg: phase === "conflict" ? "That time window just changed — pick again before confirming." : "Your booking wasn’t confirmed — nothing is scheduled yet.",
        retryAction: "booking.confirm", retryLabel: phase === "conflict" ? "Re-check & confirm" : "Try again",
      }) : null,
      ActionButton({ variant: "btn--primary", label: spaBridge ? "Book — no charge" : "Confirm booking", action: "booking.confirm", block: true, lg: true, visualId: "confirm-booking", disabled: holdBlocked, pending: phase === "pending", pendingLabel: "Confirming…" })
    ])
  ]);
}

/* =========================================================
   Root render
   ========================================================= */
var mount, shell, resizeObs, runtime, liveRetryPromise, careTransitionPromise;

function loadGrantedCareTransition() {
  var envelope = state.moduleData.care;
  var granted = state.config.dataMode === "fixture"
    && state.config.enabledModules.includes("care")
    && state.session.authenticated === true
    && state.session.hasCustomerScope === true
    && state.session.hasTenantScope === true
    && state.access && state.access.care && state.access.care.status === "granted";
  if (!granted || !envelope || envelope.phase !== "preflight") return;

  var pending = runtime.loadAsync("care");
  if (pending === careTransitionPromise) return;
  careTransitionPromise = pending;
  pending.then(function () {
    if (careTransitionPromise === pending) careTransitionPromise = null;
    render();
  }, function () {
    if (careTransitionPromise === pending) careTransitionPromise = null;
    render();
  });
}

export function render() {
  /* theming: declarative attributes only */
  var root = document.documentElement;
  root.setAttribute("data-theme", state.config.theme);
  root.setAttribute("data-mode", state.mode === "Dark" ? "dark" : "light");

  clear(mount);
  if (runtime && state.config.dataMode !== "live") runtime.loadAll();
  if (runtime) runtime.syncPreflight("care");
  if (runtime) loadGrantedCareTransition();

  var content = customerPortalGateActive() || (!isPublic() && state.account !== "ready") ? AccountBootstrap() : renderRoute();
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
  if (state.route === "care" && runtime) {
    state.carePayloadState = "ready";
    return reloadCareRuntime().catch(function () { return null; });
  }
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
      if (continueToIntendedRoute()) return;
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

function continueToIntendedRoute() {
  if (!state.session.authenticated || state.account !== "ready") return false;
  var intended = state.session.intendedRoute;
  if (!intended && state.route === "auth.oidc") intended = state.config.defaultRoute || "orders.list";
  if (!intended) return false;
  state.session.intendedRoute = null;
  go(intended);
  return true;
}

export function invalidateCareRuntime() {
  if (!runtime) return null;
  return runtime.invalidate("care");
}

export function reloadCareRuntime() {
  if (!runtime) return Promise.resolve(null);
  var pending = runtime.reloadAsync("care");
  render();
  return pending.then(function (result) {
    render();
    return result;
  }).catch(function (error) {
    render();
    throw error;
  });
}

export function reloadRuntimeModule(moduleId) {
  if (!runtime) return Promise.reject(new Error("Portal runtime is not ready"));
  var pending = runtime.reloadAsync(moduleId);
  render();
  return pending.then(function (result) {
    render();
    return result;
  }).catch(function (error) {
    render();
    throw error;
  });
}

/* boot */
document.addEventListener("DOMContentLoaded", function () {
  mount = document.getElementById("app");
  applyPortalConfig(readPortalConfig(mount));
  runtime = new PortalRuntime({ state: state });
  var loaded = runtime.loadAllAsync();
  initRouter(render);
  bindActions(mount);
  loaded.then(function () {
    if (continueToIntendedRoute()) return;
    render();
  }).catch(function (error) {
    state.view = state.config.errorMode === "fallback" ? "fallback" : "error";
    console.error("[aircove] runtime load failed", error);
    render();
  });
});

/* expose for Codex / tests */
window.AircovePortal = { state: state, go: go, setState: setState, ACTIONS: ACTIONS, runtime: function () { return runtime; } };
