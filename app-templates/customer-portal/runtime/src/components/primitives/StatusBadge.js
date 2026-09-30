// customer-portal/runtime/src/components/primitives/StatusBadge.js — production transfer module.
import { h } from "../../dom.js";
import { state } from "../../state.js";
import { ActionButton } from "./ActionButton.js";

export function StatusBadge(props) {
  return h("span", {
    "class": "status-badge " + props.variant,
    "data-module": "status-badge",
    "data-visual-id": "status-badge",
    "data-bind": props.bind || "status.label",
    "data-state": props.state || undefined
  }, props.label);
}

/* ActionButton */
