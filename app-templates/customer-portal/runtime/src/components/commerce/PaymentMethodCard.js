// customer-portal/runtime/src/components/commerce/PaymentMethodCard.js — production transfer module.
import { h } from "../../dom.js";
import { state } from "../../state.js";

export function PaymentCard(c) {
  var sel = state.payId === c.id;
  return h("div", { "class": "select-card" + (sel ? " select-card--active" : ""), "data-module": "payment-method-card", "data-visual-id": "payment-method-card", "data-action": "checkout.pickPayment", "data-id": c.id, "data-state": sel ? "selected" : undefined }, [
    h("div", { "class": "card-chip" }),
    h("div", { style: "flex:1" }, [
      h("div", { style: "font-weight:600;font-size:14px", "data-bind": "card.brand,card.last4" }, c.brand + " \u00b7\u00b7\u00b7\u00b7 " + c.last4),
      h("div", { style: "font-size:12.5px;color:var(--ink-2)" }, "Expires " + c.exp)
    ]),
    sel ? h("span", { "class": "select-card__check" }, "\u2713") : null
  ]);
}
