// customer-portal-design/src/components/commerce/CartRow.js — presentation runtime (auto-split from app.js). No business logic.
import { h } from "../../dom.js";
import { money } from "../../state.js";

export function CartRow(item) {
  return h("div", { "class": "cart-row", "data-module": "cart-row", "data-visual-id": "cart-row" }, [
    h("div", { "class": "cart-row__thumb", style: "background:" + item.tint },
      h("div", { "class": "cart-row__thumb-inner" }, h("i", { style: "background:" + item.dot }))),
    h("div", { "class": "cart-row__body" }, [
      h("div", { style: "font-weight:700;font-size:14.5px", "data-bind": "product.name" }, item.name),
      h("div", { style: "font-size:13px;color:var(--ink-2)" }, item.price + " each")
    ]),
    h("div", { "class": "qty" }, [
      h("button", { "class": "qty__btn qty__btn--minus", "data-action": "cart.dec", "data-id": item.name, "aria-label": "Decrease" }, "\u2212"),
      h("div", { "class": "qty__val", "data-bind": "cart.qty" }, String(item.qty)),
      h("button", { "class": "qty__btn qty__btn--plus", "data-action": "cart.inc", "data-id": item.name, "aria-label": "Increase" }, "+")
    ]),
    h("div", { "class": "cart-row__total" }, money(item.priceNum * item.qty)),
    h("button", { "class": "cart-remove", "data-action": "cart.removeItem", "data-id": item.name }, "Remove")
  ]);
}
