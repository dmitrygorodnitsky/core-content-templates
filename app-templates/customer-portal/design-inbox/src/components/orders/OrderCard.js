// customer-portal-design/src/components/orders/OrderCard.js — presentation runtime (auto-split from app.js). No business logic.
import { F } from "../../../data/fixtures.js";
import { h } from "../../dom.js";
import { StatusBadge } from "../primitives/StatusBadge.js";
import { ServiceCard } from "../commerce/ServiceCard.js";

export function OrderCard(order) {
  var meta = F.statusMeta[order.status] || F.statusMeta.scheduled;
  return h("article", {
    "class": "order-card", "data-module": "order-card", "data-visual-id": "order-card",
    "data-action": "order.open", "data-id": order.id
  }, [
    h("div", { "class": "order-card__icon", style: "background:" + order.iconBg },
      h("i", { style: "background:" + order.dot })),
    h("div", { "class": "order-card__body" }, [
      h("div", { "class": "order-card__name", "data-bind": "order.name" }, order.name),
      h("div", { "class": "order-card__meta", "data-bind": "order.id,order.date" }, order.id + " \u00b7 " + order.date)
    ]),
    StatusBadge({ variant: meta.badge, label: meta.label, bind: "order.statusLabel" }),
    h("div", { "class": "order-card__price", "data-bind": "order.price" }, order.price),
    h("div", { "class": "chevron" }, "\u203a")
  ]);
}

/* ServiceCard (compact quick-book row) */
