// customer-portal-design/src/components/primitives/ErrorState.js — presentation runtime (auto-split from app.js). No business logic.
import { h } from "../../dom.js";
import { state } from "../../state.js";
import { ActionButton } from "./ActionButton.js";

export function ErrorState(props) {
  return h("div", { "class": "state-block", "data-module": "error-state", "data-visual-id": "error-state", "data-state": "error" }, [
    h("div", { "class": "state-block__glyph state-block__glyph--error" }, "\u26a0"),
    h("div", { "class": "state-block__title" }, props.title || "Something went wrong"),
    h("div", { "class": "state-block__desc" }, props.desc || "We couldn\u2019t load your orders. Check your connection and try again."),
    /* wave 13 — retry keeps the existing ui.retry action; retryId scopes it to a module/entity */
    ActionButton({ variant: "btn--primary", label: props.retryLabel || "Try again", action: "ui.retry", id: props.retryId, visualId: "retry" })
  ]);
}
