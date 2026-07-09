// customer-portal/runtime/src/components/orders/MembershipCard.js — production transfer module.
import { h } from "../../dom.js";

export function MembershipCard(plan) {
  return h("div", { "class": "membership-card", "data-module": "membership-card", "data-visual-id": "membership-card" }, [
    h("div", { "class": "membership-card__sheen" }),
    h("div", { style: "position:relative" }, [
      h("div", { style: "font-weight:700;font-size:15px", "data-bind": "plan.name" }, plan.name),
      h("div", { style: "font-size:12.5px;line-height:1.5;opacity:.85;margin-top:5px", "data-bind": "plan.desc" }, plan.desc),
      h("div", { "class": "membership-card__cta", "data-action": "membership.activate", "data-visual-id": "membership-cta" }, "Activate \u00b7 $9/mo")
    ])
  ]);
}

/* AlertBanner (proposal + weather trigger) */
