// customer-portal/runtime/src/components/primitives/ActionButton.js — production transfer module.
import { h } from "../../dom.js";
import { PageHeader } from "../shell/PageHeader.js";

export function ActionButton(props) {
  return h(props.href ? "a" : "button", {
    "class": "btn " + (props.variant || "btn--primary") + (props.block ? " btn--block" : "") + (props.lg ? " btn--lg" : ""),
    "data-module": "action-button",
    "data-visual-id": props.visualId || "action-button",
    "data-action": props.action,
    "data-id": props.id || undefined,
    "data-requires-confirmation": props.confirm ? "true" : undefined,
    "disabled": props.disabled ? true : undefined,
    "href": props.href || undefined
  }, props.label);
}

/* PageHeader */
