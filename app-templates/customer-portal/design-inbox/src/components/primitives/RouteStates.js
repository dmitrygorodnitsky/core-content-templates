// customer-portal-design/src/components/primitives/RouteStates.js — Wave 13: shared route-lifecycle
// states for authenticated live data. Presentation only. These compose with the accepted
// state-block / action-button language — no separate visual system.
// PRIVACY: none of these states render entity ids, Account ids, tenant ids, claims or reasons
// that could reveal whether another customer owns a resource (non-enumerating by design).
import { h } from "../../dom.js";
import { state } from "../../state.js";
import { ActionButton } from "./ActionButton.js";
import { ErrorState } from "./ErrorState.js";
import { EmptyState } from "./EmptyState.js";
import { skeletonRow } from "./LoadingState.js";

/* non-enumerating access-denied for a private route or module.
   Deliberately does NOT say why, what exists, or who owns anything. */
export function UnauthorizedState(props) {
  props = props || {};
  return h("div", { "class": "state-block", "data-module": "unauthorized-state", "data-visual-id": "unauthorized-state", "data-state": "unauthorized" }, [
    h("div", { "class": "state-block__glyph" }, "\u26bf"),
    h("div", { "class": "state-block__title" }, "You don\u2019t have access to this page"),
    h("div", { "class": "state-block__desc" }, "Your account doesn\u2019t include access to " + (props.scope || "this area") + ". If that seems wrong, we can sort it out."),
    h("div", { style: "display:flex;gap:10px;justify-content:center;flex-wrap:wrap" }, [
      ActionButton({ variant: "btn--primary", label: "Contact support", action: "support.email", visualId: "unauthorized-support" }),
      ActionButton({ variant: "btn--ghost", label: "Go back", action: "nav.go", id: props.backRoute || "orders.list", visualId: "unauthorized-back" })
    ])
  ]);
}

/* non-enumerating not-found for a private entity: identical whether the id
   never existed, was removed, or belongs to another customer. */
export function NotFoundState(props) {
  props = props || {};
  return h("div", { "class": "state-block", "data-module": "not-found-state", "data-visual-id": "not-found-state", "data-state": "not-found" }, [
    h("div", { "class": "state-block__glyph" }, "\u2205"),
    h("div", { "class": "state-block__title" }, "We can\u2019t find that " + (props.noun || "page")),
    h("div", { "class": "state-block__desc" }, "It may have been removed or the link may be out of date. Everything you can open is on your " + (props.backLabel || "overview") + " page."),
    ActionButton({ variant: "btn--primary", label: "Back to " + (props.backLabel || "overview"), action: "nav.go", id: props.backRoute || "orders.list", visualId: "not-found-back" })
  ]);
}

/* version-conflict banner: the loaded entity is stale. Prompts a refresh —
   never claims success on top of stale data. ui.retry carries the module/entity id. */
export function ConflictBanner(props) {
  props = props || {};
  return h("div", { "class": "conflict-banner", "data-module": "conflict-banner", "data-visual-id": "conflict-banner", "data-state": "conflict", role: "alert" }, [
    h("div", { "class": "conflict-banner__icon" }, "\u21ba"),
    h("div", { "class": "conflict-banner__body" }, [
      h("div", { style: "font-weight:700;font-size:13.5px" }, "This " + (props.noun || "page") + " changed since you opened it"),
      h("div", { style: "font-size:12.5px;line-height:1.45;color:var(--ink-2);margin-top:2px" }, props.desc || "Load the latest version and review it before deciding \u2014 nothing was submitted.")
    ]),
    ActionButton({ variant: "btn--primary", label: "Load latest", action: "ui.retry", id: props.retryId, visualId: "conflict-refresh" })
  ]);
}

/* inline command failure: the action did NOT complete; authoritative data stays
   visible around it and retry is explicit (re-fires the original action). */
export function InlineFailure(props) {
  props = props || {};
  return h("div", { "class": "inline-fail", "data-module": "command-failure", "data-visual-id": "command-failure", "data-state": "failed", role: "alert" }, [
    h("span", { "class": "inline-fail__icon" }, "!"),
    h("div", { style: "flex:1;font-size:13px;line-height:1.45;min-width:0" }, props.msg || "That didn\u2019t go through \u2014 nothing was changed."),
    props.retryAction ? ActionButton({ variant: "btn--ghost", label: props.retryLabel || "Try again", action: props.retryAction, id: props.retryId, visualId: "command-retry" }) : null
  ]);
}

/* skeleton helpers — mirror the route's ready layout, never fixture values */
export function skel(style) { return h("div", { "class": "skeleton", style: style }); }

export function listSkeleton(n) {
  var card = h("div", { "class": "card", "data-state": "loading", "aria-busy": "true" });
  for (var i = 0; i < (n || 4); i++) card.appendChild(skeletonRow());
  return card;
}

export function gridSkeleton(cls, n, height) {
  var g = h("div", { "class": cls, "data-state": "loading", "aria-busy": "true" });
  for (var i = 0; i < n; i++) g.appendChild(skel("height:" + height + "px;border-radius:20px"));
  return g;
}

/* shared route gate: returns the state body for the current state.view, or null
   when the route should render its ready content. Each route keeps its own
   header/skeleton so the loading shape mirrors that route's accepted layout. */
export function routeStateBody(cfg) {
  var v = state.view;
  if (!cfg.states || cfg.states.indexOf(v) === -1) return null;
  if (v === "loading") return cfg.skeleton ? cfg.skeleton() : listSkeleton(4);
  if (v === "error") return ErrorState(cfg.error || {});
  if (v === "empty" && cfg.empty) return EmptyState(cfg.empty);
  if (v === "unauthorized") return UnauthorizedState({ scope: cfg.scope, backRoute: cfg.backRoute });
  return null;
}
