// customer-portal-design/src/components/spa/CommerceBits.js — Wave 15: shared
// presentation primitives for the Calm Harbor commercial lifecycle. Composes the
// accepted state-block / badge / card vocabulary — no new visual system.
// PRIVACY: non-enumerating, no raw ids, no permission or policy reconstruction.
import { h } from "../../dom.js";
import { state } from "../../state.js";
import { F } from "../../../data/fixtures.js";
import { ActionButton } from "../primitives/ActionButton.js";
import { StatusBadge } from "../primitives/StatusBadge.js";
import { NotFoundState, routeStateBody } from "../primitives/RouteStates.js";

/* honest module/route unavailability — an unopened capability is NOT empty data */
export function UnavailableState(props) {
  props = props || {};
  return h("div", { "class": "state-block", "data-module": "unavailable-state", "data-visual-id": "unavailable-state", "data-state": "unavailable" }, [
    h("div", { "class": "state-block__glyph" }, "\u25cc"),
    h("div", { "class": "state-block__title" }, props.title || "This isn\u2019t available yet"),
    h("div", { "class": "state-block__desc" }, props.desc || "This part of the portal isn\u2019t connected yet. Nothing is shown in the meantime \u2014 we don\u2019t invent records."),
    props.action ? ActionButton(props.action) : null
  ]);
}

/* wave-13 route gate extended with unavailable + not-found for the new surfaces */
export function spaGate(cfg) {
  if (state.view === "unavailable") return UnavailableState(cfg.unavailable || {});
  if (state.view === "not-found" && cfg.notFound) return NotFoundState(cfg.notFound);
  return routeStateBody(cfg);
}

/* the explicit simulation treatment — REQUIRED wherever a payment step or a
   confirmation is shown. Never rendered as a success/payment claim. */
export function SimulationBadge(block) {
  return h("div", { "class": "sim-badge" + (block ? " sim-badge--block" : ""), "data-module": "simulation-notice", "data-visual-id": "simulation-notice", "data-bind": "checkout.paymentMode", role: "note" }, [
    h("i", { "class": "sim-badge__dot" }),
    h("b", null, "Simulation"),
    "\u2014 no charge will be made"
  ]);
}

/* purchase kind chip (SERVICE / RETAIL / PACKAGE / MEMBERSHIP / MIXED) */
export function KindChip(kind) {
  return h("span", { "class": "kind-chip kind-chip--" + kind.toLowerCase(), "data-bind": "purchase.kind" }, F.spaCommerce.purchases.kindLabels[kind] || kind);
}

export function purchaseStatusBadge(label) {
  return StatusBadge({ variant: F.spaCommerce.purchases.statusBadges[label] || "status-badge--scheduled", label: label, bind: "purchase.customerStatus" });
}

/* server-owned commercial totals — verbatim display strings, nothing computed */
export function MoneyRows(money) {
  var rows = [["Subtotal", money.subtotal, "money.subtotal"]];
  if (money.discount) rows.push(["Discount", money.discount, "money.discount"]);
  rows.push(["Tax", money.tax, "money.tax"]);
  var wrap = h("div", { "class": "money-rows", "data-module": "commercial-totals", "data-visual-id": "commercial-totals" });
  rows.forEach(function (r) {
    if (r[1] == null) return;
    wrap.appendChild(h("div", { "class": "money-rows__row" }, [h("span", null, r[0]), h("span", { "data-bind": r[2] }, r[1])]));
  });
  wrap.appendChild(h("div", { "class": "money-rows__row money-rows__row--total" }, [
    h("span", null, "Total"),
    h("span", { "data-bind": "money.total" }, money.total + (money.currency ? " " + money.currency : ""))
  ]));
  return wrap;
}

/* small labelled section inside a detail card */
export function DetailSection(title, children) {
  return h("div", { "class": "detail-section" }, [
    h("div", { "class": "detail-section__title" }, title),
    h("div", null, children)
  ]);
}
