// customer-portal-design/src/components/commerce/AddressCard.js — presentation runtime (auto-split from app.js). No business logic.
import { h } from "../../dom.js";
import { state } from "../../state.js";

export function AddressCard(a) {
  var sel = state.addrId === a.id;
  return h("div", { "class": "select-card" + (sel ? " select-card--active" : ""), "data-module": "address-card", "data-visual-id": "address-card", "data-action": "checkout.pickAddress", "data-id": a.id, "data-state": sel ? "selected" : undefined }, [
    h("div", { "class": "select-card__icon", style: "background:" + a.iconBg }, h("i", { style: "background:" + a.dot })),
    h("div", { style: "flex:1" }, [
      h("div", { style: "font-weight:600;font-size:14px", "data-bind": "address.label" }, a.label),
      h("div", { style: "font-size:12.5px;color:var(--ink-2)" }, a.line + " \u00b7 " + a.city)
    ]),
    sel ? h("span", { "class": "select-card__check" }, "\u2713") : null
  ]);
}
