// customer-portal/runtime/src/components/commerce/ProductCard.js — production transfer module.
import { F } from "../../../data/fixtures.js";
import { h } from "../../dom.js";
import { ActionButton } from "../primitives/ActionButton.js";

export function ProductCard(p, catIndex) {
  var tint = F.TINTS[catIndex % 4];
  return h("div", { "class": "product-card", "data-module": "product-card", "data-visual-id": "product-card" }, [
    h("div", { "class": "product-card__art", style: "background:" + tint[1] },
      h("div", { "class": "product-card__thumb" }, h("i", { style: "background:" + tint[0] }))),
    h("span", { "class": "product-tag", "data-bind": "product.tag" }, p.tag || p.code || "Catalog"),
    h("div", { "class": "product-card__name", "data-bind": "product.name" }, p.name),
    h("div", { "class": "product-card__blurb", "data-bind": "product.blurb" }, p.blurb || p.description || p.cta),
    h("div", { "class": "product-card__foot" }, [
      h("div", { "class": "price-lg", "data-bind": "product.price" }, p.price),
      ActionButton({ variant: "btn--primary", label: p.allowedActions && p.allowedActions.includes("support.open") ? "Contact" : "Add", action: p.allowedActions && p.allowedActions.includes("support.open") ? "support.open" : "cart.addItem", id: p.name, visualId: "product-add" })
    ])
  ]);
}
