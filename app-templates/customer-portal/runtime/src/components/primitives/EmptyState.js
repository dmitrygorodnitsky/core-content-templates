// customer-portal/runtime/src/components/primitives/EmptyState.js — production transfer module.
import { h } from "../../dom.js";
import { state } from "../../state.js";
import { ActionButton } from "./ActionButton.js";

export function EmptyState(props) {
  return h("div", { "class": "state-block", "data-module": "empty-state", "data-visual-id": "empty-state", "data-state": "empty" }, [
    h("div", { "class": "state-block__glyph" }, props.glyph || "\u25cb"),
    h("div", { "class": "state-block__title" }, props.title),
    h("div", { "class": "state-block__desc" }, props.desc),
    props.action ? ActionButton(props.action) : null
  ]);
}
