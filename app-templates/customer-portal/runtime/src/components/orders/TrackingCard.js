// customer-portal/runtime/src/components/orders/TrackingCard.js — production transfer module.
import { h, svgPath } from "../../dom.js";
import { ActionButton } from "../primitives/ActionButton.js";

export function TrackingCard(technician, order) {
  var techData = technician || { name: "Your specialist", eta: "Arrival details are being prepared", role: "Service team" };
  var serviceName = order && order.name ? order.name : "your appointment";
  var map = h("div", { "class": "tracking-map" }, [
    h("span", { "class": "tracking-map__label" }, "live appointment status"),
    svgPath(),
    h("div", { "class": "tracking-pin-start" }),
    h("div", { "class": "tracking-pin-end" }, [
      h("div", { "class": "tracking-pin-end__ping" }),
      h("div", { "class": "tracking-pin-end__dot" })
    ])
  ]);
  var tech = h("div", { "class": "tracking-card__tech" }, [
    h("div", { "class": "tech-avatar" }),
    h("div", { style: "flex:1" }, [
      h("div", { style: "font-weight:600;font-size:14.5px", "data-bind": "visit.techName" }, techData.name + " is with you"),
      h("div", { style: "font-size:12.5px;color:var(--ink-2)", "data-bind": "visit.eta" }, techData.eta + " \u00b7 " + serviceName)
    ]),
    ActionButton({ variant: "btn--ghost", label: "Message", action: "support.open", visualId: "tech-message" }),
    ActionButton({ variant: "btn--primary", label: "Call", action: "support.open", visualId: "tech-call" })
  ]);
  return h("div", { "class": "tracking-card", "data-module": "tracking-card", "data-visual-id": "tracking-card" }, [map, tech]);
}
