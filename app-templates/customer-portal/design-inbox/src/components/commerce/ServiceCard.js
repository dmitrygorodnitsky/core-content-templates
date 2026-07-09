// customer-portal-design/src/components/commerce/ServiceCard.js — presentation runtime (auto-split from app.js). No business logic.
import { F } from "../../../data/fixtures.js";
import { h } from "../../dom.js";
import { go } from "../../actions.js";
import { ActionButton } from "../primitives/ActionButton.js";
import { MembershipCard } from "../orders/MembershipCard.js";

export function ServiceCard(svc, i) {
  var pal = F.PAL[i % 4];
  return h("div", {
    "class": "svc-row", "data-module": "service-card", "data-visual-id": "service-card",
    "data-action": "booking.open", "data-id": svc.name
  }, [
    h("div", { "class": "svc-row__icon", style: "background:" + pal[1] }, h("i", { style: "background:" + pal[0] })),
    h("div", { "class": "svc-row__name", "data-bind": "service.name" }, svc.name),
    h("div", { "class": "svc-row__price", "data-bind": "service.price" }, svc.price)
  ]);
}

/* MembershipCard */

export function ServiceCatalogCard(svc, i) {
  var pal = F.PAL[i % 4];
  var price = svc.price === "Quote" ? "Free quote" : "from " + svc.price;
  return h("div", { "class": "service-catalog-card", "data-module": "service-catalog-card", "data-visual-id": "service-catalog-card" }, [
    h("div", { "class": "scc__head" }, [
      h("div", { "class": "scc__icon", style: "background:" + pal[1] }, h("i", { style: "background:" + pal[0] })),
      h("div", { style: "flex:1" }, [
        h("div", { "class": "scc__name", "data-bind": "service.name" }, svc.name),
        h("div", { "class": "scc__tagline", "data-bind": "service.tagline" }, svc.tagline)
      ]),
      h("div", { "class": "scc__price" }, [h("b", { "data-bind": "service.price" }, price), h("span", { "data-bind": "service.duration" }, svc.duration)])
    ]),
    h("div", { "class": "includes" }, svc.includes.map(function (inc) {
      return h("div", { "class": "include-item" }, [h("span", { "class": "check" }, "\u2713"), inc]);
    })),
    h("div", { "class": "scc__actions" }, [
      ActionButton({ variant: "btn--primary", label: "Book now", action: "booking.open", id: svc.name, block: true, lg: true, visualId: "scc-book" }),
      ActionButton({ variant: "btn--ghost", label: "Details", action: "nav.go", id: "pricing", lg: true, visualId: "scc-details" })
    ])
  ]);
}
