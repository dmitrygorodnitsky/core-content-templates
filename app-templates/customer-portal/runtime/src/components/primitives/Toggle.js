// customer-portal/runtime/src/components/primitives/Toggle.js — production transfer module.
import { h } from "../../dom.js";
import { state } from "../../state.js";
import { togglePref } from "../../actions.js";

export function Toggle(on, id) {
  return h("div", { "class": "toggle" + (on ? " toggle--on" : ""), "data-module": "toggle", "data-action": "profile.togglePref", "data-id": id, "data-state": on ? "on" : "off", role: "switch", "aria-checked": on ? "true" : "false" },
    h("div", { "class": "toggle__knob" }));
}
