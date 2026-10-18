// customer-portal/runtime/src/components/primitives/Tabs.js — production transfer module.
import { h } from "../../dom.js";
import { state } from "../../state.js";
import { OrderCard } from "../orders/OrderCard.js";

export function Tabs(props) {
  return h("div", { "class": "tabs", "data-module": "tabs", "data-visual-id": "order-tabs", role: "tablist" },
    props.items.map(function (t) {
      return h("span", {
        "class": "tab" + (t.key === props.active ? " tab--active" : ""),
        "data-action": props.action, "data-id": t.key,
        "data-state": t.key === props.active ? "active" : undefined,
        role: "tab"
      }, t.count != null ? [t.label + " ", h("span", { style: "opacity:.6" }, String(t.count))] : t.label);
    })
  );
}

/* OrderCard (list row) */
