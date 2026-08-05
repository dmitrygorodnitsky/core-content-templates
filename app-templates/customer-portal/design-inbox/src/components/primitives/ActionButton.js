// customer-portal-design/src/components/primitives/ActionButton.js — presentation runtime (auto-split from app.js). No business logic.
import { h } from "../../dom.js";
import { PageHeader } from "../shell/PageHeader.js";

export function ActionButton(props) {
  /* wave 13 — pending: the exact action is visibly in flight and duplicate
     submission is disabled. props.state stamps the command lifecycle
     (pending|failed|…) on the actionable element itself. */
  return h(props.href ? "a" : "button", {
    "class": "btn " + (props.variant || "btn--primary") + (props.block ? " btn--block" : "") + (props.lg ? " btn--lg" : ""),
    "data-module": "action-button",
    "data-visual-id": props.visualId || "action-button",
    "data-action": props.action,
    "data-id": props.id || undefined,
    "data-requires-confirmation": props.confirm ? "true" : undefined,
    "data-state": props.state || (props.pending ? "pending" : undefined),
    "aria-busy": props.pending ? "true" : undefined,
    "disabled": (props.disabled || props.pending) ? true : undefined,
    "href": props.href || undefined
  }, props.pending ? [h("span", { "class": "btn-spinner" }), props.pendingLabel || props.label] : props.label);
}

/* PageHeader */
