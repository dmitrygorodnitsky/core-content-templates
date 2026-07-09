// customer-portal/runtime/src/components/commerce/PricingCard.js — production transfer module.
import { h } from "../../dom.js";
import { state } from "../../state.js";
import { ActionButton } from "../primitives/ActionButton.js";

export function PricingCard(props) {
  var featIcon = props.featured ? h("span", { "class": "plan-badge" }, "POPULAR") : null;
  var card = h("div", { "class": "plan-card" + (props.featured ? " plan-card--featured" : ""), "data-module": "pricing-card", "data-visual-id": "pricing-card", "data-state": props.current ? "current" : undefined });
  if (props.featured) card.appendChild(h("div", { "class": "plan-sheen" }));
  var body = h("div", props.featured ? { style: "position:relative;display:flex;flex-direction:column;flex:1" } : null, [
    h("div", { "class": "plan-card__name" }, [h("span", null, props.name), featIcon]),
    h("div", { "class": "plan-card__price" }, [h("b", null, props.price), h("span", null, "/mo")]),
    h("div", { "class": "plan-card__tag" }, props.tag),
    h("div", { "class": "plan-features" }, props.features.map(function (f) { return h("div", null, "\u2713 " + f); })),
    props.current
      ? h("div", { "class": "plan-cta" }, "Current plan")
      : h("div", { style: "margin-top:18px" }, ActionButton({ variant: props.featured ? "btn--onaccent" : "btn--ghost", label: "Activate plan", action: "booking.open", block: true, lg: true, visualId: "activate-plan" }))
  ]);
  card.appendChild(body);
  return card;
}
