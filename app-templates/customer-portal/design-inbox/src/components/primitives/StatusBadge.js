// customer-portal-design/src/components/primitives/StatusBadge.js — presentation runtime (auto-split from app.js). No business logic.
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
