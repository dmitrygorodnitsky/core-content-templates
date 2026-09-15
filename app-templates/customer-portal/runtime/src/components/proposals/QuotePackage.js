import { h } from "../../dom.js";
import { proposalStatusMeta } from "../../state.js";
import { StatusBadge } from "../primitives/StatusBadge.js";
import { formatDatePeriod, formatIsoDate, formatOrderTotal, schematicPositions } from "../../normalizers/contracts.js";

var QUOTE_STAGES = ["review", "details", "canceled"];
var DECISION_META = { approved: "approved", declined: "declined", revision: "revision", open: "unseen" };
var DECISION_LABEL = {
  approved: "Option approved",
  declined: "Declined",
  revision: "Changes requested",
  open: "Awaiting your decision",
};

export function QuotePackageHead(quotes) {
  var agreement = quotes.agreement;
  var counts = quotes.counts;
  var facts = [];
  if (counts.orders) {
    facts.push(plural(counts.orders, "quote", "quotes") + (counts.properties ? " for " + plural(counts.properties, "property", "properties") : ""));
  }
  if (quotes.servicePeriod) facts.push("Service period " + formatDatePeriod(quotes.servicePeriod));
  if (agreement && agreement.effectiveDate) facts.push("Effective " + formatIsoDate(agreement.effectiveDate));
  if (agreement && agreement.term) facts.push("Term " + formatDatePeriod(agreement.term));
  var deciding = (!agreement || agreement.stage === "review") && counts.properties > 0;

  return h("div", { "class": "proposals-head", "data-module": "quote-package-head", "data-visual-id": "quote-package-head", "data-state": agreement ? agreement.stage : "quotes" }, [
    h("div", { "class": "proposals-head__read" }, [
      h("div", { "class": "proposals-head__title-row" }, [
        h("h1", { "class": "proposals-head__title" }, packageTitle(agreement)),
        agreement ? StatusBadge({ variant: "status-badge--" + agreement.tone, label: agreement.label, bind: "agreement.stateLabel", state: agreement.stage }) : null,
      ]),
      facts.length ? h("div", { "class": "proposals-head__sub" }, facts.join(" · ")) : null,
    ]),
    deciding ? h("span", { "class": "proposals-head__pill" }, counts.decided + " of " + plural(counts.properties, "property", "properties") + " decided") : null,
  ]);
}

export function QuotesPreparing() {
  return h("div", { "class": "state-block", "data-module": "quote-preparing", "data-visual-id": "quote-preparing", "data-state": "preparing", role: "status" }, [
    h("div", { "class": "state-block__glyph quote-preparing__glyph" }, "◔"),
    h("div", { "class": "state-block__title" }, "We have your request"),
    h("div", { "class": "state-block__desc" }, "We’re preparing your quote. It appears here as soon as we send it to you."),
  ]);
}

export function QuotesPreparingNotice() {
  return h("div", { "class": "alert-banner alert-banner--info quote-preparing", "data-module": "quote-preparing", "data-visual-id": "quote-preparing", "data-state": "preparing", role: "status" }, [
    h("div", { "class": "alert-banner__icon quote-preparing__glyph" }, "◔"),
    h("div", { "class": "alert-banner__body" }, [
      h("div", { "class": "alert-banner__title" }, "We’re still preparing part of your request"),
      h("div", { "class": "alert-banner__desc" }, "Anything we send you appears in this list."),
    ]),
  ]);
}

export function PortfolioSchematic(groups, placements) {
  var positions = schematicPositions(placements.map(function (placement) { return placement.point; }));
  var placed = positions.filter(Boolean).length;
  if (!placed) return null;
  var mappable = groups.filter(function (group) { return !!group.propertyBackendId; }).length;
  var statusMeta = proposalStatusMeta();
  var canvas = h("div", { "class": "portfolio-map__canvas" }, [
    h("span", { "class": "portfolio-map__label" }, "portfolio map" + (placed < mappable ? " · " + placed + " of " + plural(mappable, "property", "properties") + " on the map" : "")),
  ]);
  groups.forEach(function (group, index) {
    var position = positions[index];
    if (!position) return;
    canvas.appendChild(h("div", { "class": "map-pin-wrap", style: "left:" + position.x + "%;top:" + position.y + "%", "data-state": group.decision }, [
      h("div", { "class": "map-pin-diamond", style: "background:" + statusMeta[DECISION_META[group.decision]].dot }),
      h("div", { "class": "map-pin-label" }, groupName(group)),
    ]));
  });
  return h("div", { "class": "portfolio-map", "data-module": "portfolio-map", "data-visual-id": "portfolio-map", "data-surface": "schematic" }, canvas);
}

export function QuoteGroups(groups, placements, mapShown) {
  var statusMeta = proposalStatusMeta();
  return h("div", { "class": "site-list", "data-module": "proposal-list", "data-visual-id": "proposal-list" }, groups.map(function (group, index) {
    var offMap = mapShown && !!group.propertyBackendId && !placements[index].point;
    var summary = [group.property && group.property.address, plural(group.orders.length, "quote", "quotes")].filter(Boolean).join(" · ");
    var head = [
      h("span", { "class": "proposal-card__diamond", style: "background:" + statusMeta[DECISION_META[group.decision]].dot }),
      h("span", { "class": "proposal-card__body" }, [
        h("span", { "class": "proposal-card__name" }, groupName(group)),
        h("span", { "class": "proposal-card__meta" }, summary),
        offMap ? h("span", { "class": "proposal-card__tag" }, "Not on the map") : null,
      ]),
      h("span", { "class": "proposal-group__decision", "data-state": group.decision }, DECISION_LABEL[group.decision]),
      group.id ? h("span", { "class": "proposal-card__chev", "aria-hidden": "true" }, "›") : null,
    ];
    return h("section", { "class": "proposal-group", "data-module": "quote-property", "data-visual-id": "quote-property", "data-state": group.decision }, [
      group.id
        ? h("button", { "class": "proposal-card proposal-group__head", "data-action": "proposal.open", "data-id": group.id, "aria-label": "Open the quotes for " + groupName(group) }, head)
        : h("div", { "class": "proposal-card proposal-group__head" }, head),
      h("ul", { "class": "proposal-options", "aria-label": "Quotes for " + groupName(group) }, group.orders.map(function (order) {
        return QuoteOption(order, statusMeta);
      })),
    ]);
  }));
}

export function QuotesFooter() {
  return h("div", { "class": "proposal-footer", "data-module": "quote-package-footer", "data-visual-id": "quote-package-footer" }, [
    h("div", { "class": "proposal-footer__icon" }, "✦"),
    h("div", { "class": "proposal-footer__copy" }, "Decide each property on its own. Approving one option for a property declines its other options. Once every property has a decision, we’ll ask for your contract details and prepare your service agreement."),
  ]);
}

function QuoteOption(order, statusMeta) {
  var meta = statusMeta[order.status];
  var total = formatOrderTotal(order.total);
  return h("li", { "class": "proposal-option", "data-module": "quote-row", "data-visual-id": "quote-row", "data-state": order.status }, [
    h("span", { "class": "proposal-option__model" }, order.pricingModel ? order.pricingModel.label : "Quote"),
    total ? h("span", { "class": "proposal-option__total" }, total) : null,
    StatusBadge({ variant: meta.badge, label: meta.label, bind: "quote.statusLabel", state: order.status }),
  ]);
}

function packageTitle(agreement) {
  return !agreement || QUOTE_STAGES.indexOf(agreement.stage) !== -1 ? "Your quotes" : "Your service agreement";
}

function groupName(group) {
  if (group.property && group.property.name) return group.property.name;
  return group.propertyBackendId ? "Property details unavailable" : "No property on this quote";
}

function plural(count, one, many) {
  return count + " " + (count === 1 ? one : many);
}
