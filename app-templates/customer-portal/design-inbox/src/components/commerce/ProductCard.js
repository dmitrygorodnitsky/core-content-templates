// customer-portal-design/src/components/commerce/ProductCard.js — presentation runtime (auto-split from app.js). No business logic.
import { F } from "../../../data/fixtures.js";
import { h } from "../../dom.js";
import { cmdPhase } from "../../state.js";
import { ActionButton } from "../primitives/ActionButton.js";

export function ProductCard(p, catIndex) {
  var tint = F.TINTS[catIndex % 4];
  /* wave 13 — adding to cart is an entity-scoped command on THIS product only */
  var phase = cmdPhase("cart.addItem:" + p.name);
  return h("div", { "class": "product-card", "data-module": "product-card", "data-visual-id": "product-card", "data-state": phase === "idle" ? undefined : phase }, [
    h("div", { "class": "product-card__art", style: "background:" + tint[1] },
      h("div", { "class": "product-card__thumb" }, h("i", { style: "background:" + tint[0] }))),
    h("span", { "class": "product-tag", "data-bind": "product.tag" }, p.tag),
    h("div", { "class": "product-card__name", "data-bind": "product.name" }, p.name),
    h("div", { "class": "product-card__blurb", "data-bind": "product.blurb" }, p.blurb),
    h("div", { "class": "product-card__foot" }, [
      h("div", { "class": "price-lg", "data-bind": "product.price" }, p.price),
      ActionButton({ variant: "btn--primary", label: phase === "failed" || phase === "conflict" ? "Retry add" : "Add", action: "cart.addItem", id: p.name, visualId: "product-add",
        pending: phase === "pending", pendingLabel: "Adding\u2026", state: phase === "failed" || phase === "conflict" ? "failed" : undefined })
    ])
  ]);
}
