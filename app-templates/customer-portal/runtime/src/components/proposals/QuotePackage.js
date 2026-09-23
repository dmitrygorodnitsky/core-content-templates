import { h } from "../../dom.js";
import { StatusBadge } from "../primitives/StatusBadge.js";
import { formatDatePeriod, formatIsoDate, formatOrderTotal, schematicPositions } from "../../normalizers/contracts.js";

export var QUOTE_STATUS = Object.freeze({
  approved: Object.freeze({ label: "✓ Approved", badge: "status-badge--ok", dot: "#34c759" }),
  revision: Object.freeze({ label: "⟳ Revision pending", badge: "status-badge--warn", dot: "#ff9f0a" }),
  declined: Object.freeze({ label: "✕ Declined", badge: "status-badge--danger", dot: "#ff3b30" }),
  unseen: Object.freeze({ label: "◔ Unseen", badge: "status-badge--scheduled", dot: "#8a94a6" }),
  viewed: Object.freeze({ label: "• Reviewing", badge: "status-badge--scheduled", dot: "#8a94a6" }),
});

var DECISION_META = { approved: "approved", declined: "declined", revision: "revision", open: "unseen" };
var DECISION_LABEL = {
  approved: "Option approved",
  declined: "Declined",
  revision: "Changes requested",
  open: "Awaiting your decision",
};

export function ContractsHead(quotes) {
  var counts = quotes.counts;
  var facts = [];
  if (quotes.agreements.length) facts.push(plural(quotes.agreements.length, "service agreement", "service agreements"));
  if (counts.orders) {
    facts.push(plural(counts.orders, "quote", "quotes") + (counts.properties ? " for " + plural(counts.properties, "property", "properties") : ""));
  }
  if (quotes.servicePeriod) facts.push("Service period " + formatDatePeriod(quotes.servicePeriod));
  var deciding = quotes.deciding && counts.properties > 0;
  return h("div", { "class": "proposals-head", "data-module": "quote-package-head", "data-visual-id": "quote-package-head", "data-state": deciding ? "deciding" : "settled" }, [
    h("div", { "class": "proposals-head__read" }, [
      h("div", { "class": "proposals-head__title-row" }, [
        h("h1", { "class": "proposals-head__title" }, quotes.groups.length && !quotes.agreements.length ? "Your quotes" : "Your contracts"),
      ]),
      facts.length ? h("div", { "class": "proposals-head__sub" }, facts.join(" · ")) : null,
    ]),
    deciding ? h("span", { "class": "proposals-head__pill" }, counts.decided + " of " + plural(counts.properties, "property", "properties") + " decided") : null,
  ]);
}

export function ContractsSectionTitle(label, count) {
  return h("h2", { "class": "contracts-section__title" }, [label, count ? h("span", { "class": "contracts-section__count" }, String(count)) : null]);
}

export function AgreementList(rows) {
  return h("div", { "class": "site-list agreement-list", "data-module": "agreement-list", "data-visual-id": "agreement-list" }, rows.map(function (row) {
    var agreement = row.agreement;
    return h("button", {
      "class": "proposal-card agreement-row",
      "data-module": "agreement-row",
      "data-visual-id": "agreement-row",
      "data-action": "agreement.open",
      "data-id": row.id,
      "data-state": agreement.stage,
      "aria-label": "Open the service agreement " + agreementTitle(row) + " — " + agreement.label,
    }, [
      h("span", { "class": "proposal-card__diamond agreement-row__diamond", "data-tone": agreement.tone }),
      h("span", { "class": "proposal-card__body" }, [
        h("span", { "class": "proposal-card__name" }, agreementTitle(row)),
        h("span", { "class": "proposal-card__meta" }, agreementMeta(row)),
      ]),
      StatusBadge({ variant: "status-badge--" + agreement.tone, label: agreement.label, bind: "agreement.stateLabel", state: agreement.stage }),
      h("span", { "class": "proposal-card__chev", "aria-hidden": "true" }, "›"),
    ]);
  }));
}

export function agreementTitle(row) {
  var names = row.propertyNames;
  if (!names.length) return "Service agreement";
  if (names.length === 1) return names[0];
  if (names.length === 2) return names[0] + " and " + names[1];
  return names[0] + " and " + (names.length - 1) + " more";
}

export function agreementMeta(row) {
  var agreement = row.agreement;
  var facts = [];
  if (row.propertyNames.length) facts.push("Service agreement");
  if (agreement.stage === "review" && row.quoteCount) {
    facts.push(plural(row.quoteCount, "quote", "quotes") + (row.propertyCount ? " for " + plural(row.propertyCount, "property", "properties") : ""));
  }
  if (agreement.term) facts.push("Term " + formatDatePeriod(agreement.term));
  else if (agreement.effectiveDate) facts.push("Effective " + formatIsoDate(agreement.effectiveDate));
  else if (row.servicePeriod) facts.push("Service period " + formatDatePeriod(row.servicePeriod));
  if (!facts.length) facts.push(row.propertyCount ? plural(row.propertyCount, "property", "properties") : "No properties listed yet");
  return facts.join(" · ");
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
  var canvas = h("div", { "class": "portfolio-map__canvas" }, [
    h("span", { "class": "portfolio-map__label" }, "portfolio map" + (placed < mappable ? " · " + placed + " of " + plural(mappable, "property", "properties") + " on the map" : "")),
  ]);
  groups.forEach(function (group, index) {
    var position = positions[index];
    if (!position) return;
    canvas.appendChild(h("div", { "class": "map-pin-wrap", style: "left:" + position.x + "%;top:" + position.y + "%", "data-state": group.decision }, [
      h("div", { "class": "map-pin-diamond", style: "background:" + QUOTE_STATUS[DECISION_META[group.decision]].dot }),
      h("div", { "class": "map-pin-label" }, group.title),
    ]));
  });
  return h("div", { "class": "portfolio-map", "data-module": "portfolio-map", "data-visual-id": "portfolio-map", "data-surface": "schematic" }, canvas);
}

export function QuoteGroups(groups, placements, mapShown) {
  return h("div", { "class": "site-list", "data-module": "proposal-list", "data-visual-id": "proposal-list" }, groups.map(function (group, index) {
    var offMap = mapShown && !!group.propertyBackendId && !placements[index].point;
    var summary = [group.address, plural(group.orders.length, "quote", "quotes")].filter(Boolean).join(" · ");
    var head = [
      h("span", { "class": "proposal-card__diamond", style: "background:" + QUOTE_STATUS[DECISION_META[group.decision]].dot }),
      h("span", { "class": "proposal-card__body" }, [
        h("span", { "class": "proposal-card__name" }, group.title),
        h("span", { "class": "proposal-card__meta" }, summary),
        offMap ? h("span", { "class": "proposal-card__tag" }, "Not on the map") : null,
      ]),
      h("span", { "class": "proposal-group__decision", "data-state": group.decision }, DECISION_LABEL[group.decision]),
      h("span", { "class": "proposal-card__chev", "aria-hidden": "true" }, "›"),
    ];
    return h("section", { "class": "proposal-group", "data-module": "quote-property", "data-visual-id": "quote-property", "data-state": group.decision }, [
      h("button", { "class": "proposal-card proposal-group__head", "data-action": "proposal.open", "data-id": group.id, "aria-label": "Open the quotes for " + group.title }, head),
      h("ul", { "class": "proposal-options", "aria-label": "Quotes for " + group.title }, group.orders.map(QuoteOption)),
    ]);
  }));
}

export function QuotesFooter() {
  return h("div", { "class": "proposal-footer", "data-module": "quote-package-footer", "data-visual-id": "quote-package-footer" }, [
    h("div", { "class": "proposal-footer__icon" }, "✦"),
    h("div", { "class": "proposal-footer__copy" }, "Decide each property on its own. Approving one option for a property declines its other options. Once every property has a decision, we’ll ask for your contract details and prepare your service agreement."),
  ]);
}

function QuoteOption(order) {
  var meta = QUOTE_STATUS[order.status];
  var total = formatOrderTotal(order.total);
  return h("li", { "class": "proposal-option", "data-module": "quote-row", "data-visual-id": "quote-row", "data-state": order.status }, [
    h("span", { "class": "proposal-option__model" }, order.pricingModel ? order.pricingModel.label : "Quote"),
    total ? h("span", { "class": "proposal-option__total" }, total) : null,
    StatusBadge({ variant: meta.badge, label: meta.label, bind: "quote.statusLabel", state: order.status }),
  ]);
}

export function plural(count, one, many) {
  return count + " " + (count === 1 ? one : many);
}
