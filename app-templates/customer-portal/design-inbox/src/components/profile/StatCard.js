// customer-portal-design/src/components/profile/StatCard.js — presentation runtime (auto-split from app.js). No business logic.
import { h } from "../../dom.js";

export function statCard(label, num, color) {
  return h("div", { "class": "stat-card", "data-module": "stat-card" }, [
    h("div", { "class": "stat-card__label" }, label),
    h("div", { "class": "stat-card__num", style: color ? "color:" + color : "" }, num)
  ]);
}
