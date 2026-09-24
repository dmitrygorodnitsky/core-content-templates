import { h } from "../../dom.js";
import { state } from "../../state.js";
import { ActionButton } from "../primitives/ActionButton.js";
import { formatIsoDate } from "../../normalizers/contracts.js";
import { CommandOutcome } from "./ContractStates.js";
import { QuoteOptionCard } from "./QuoteOptionCard.js";

var STAGE_NOTICE = {
  review: { tone: "info", text: "The quotes in this agreement are waiting for your decisions.", link: { label: "Go to your quotes ›", action: "nav.go", id: "proposals.list" } },
  details: { tone: "warn", text: "We need your contract details before we can prepare this agreement." },
  drafting: { tone: "info", text: "We’re preparing this agreement. It appears here for your approval once it’s ready." },
  approval: { tone: "warn", text: "Read the parties, services and terms below, then approve the agreement." },
  approved: { tone: "ok", text: "You approved this agreement." },
  active: { tone: "ok", text: "This agreement is active." },
  suspended: { tone: "warn", text: "This agreement is suspended. It is shown for reference." },
  expired: { tone: "neutral", text: "This agreement has expired. It is shown for reference." },
  archived: { tone: "neutral", text: "This agreement is archived. It is shown for reference." },
  canceled: { tone: "neutral", text: "This agreement was cancelled. It is shown for reference." },
};

export function AgreementStageNotice(agreement) {
  var notice = STAGE_NOTICE[agreement.stage];
  if (!notice) return null;
  return h("div", { "class": "agreement-notice", "data-module": "agreement-notice", "data-visual-id": "agreement-notice", "data-state": agreement.stage, "data-tone": notice.tone, role: "status" }, [
    h("span", { "class": "agreement-notice__dot", "aria-hidden": "true" }),
    h("span", { "class": "agreement-notice__text" }, notice.text),
    notice.link ? h("span", { "class": "link-action agreement-notice__link", "data-action": notice.link.action, "data-id": notice.link.id }, notice.link.label) : null,
  ]);
}

export function AgreementParties(parties) {
  return h("div", { "class": "agreement-parties", "data-module": "agreement-parties", "data-visual-id": "agreement-parties" }, [
    FactsCard("Provider", "agreement-party", [
      ["Legal name", parties.provider.legalName],
      ["Representative", joinName(parties.provider.representativeName, parties.provider.representativeJobTitle)],
    ]),
    FactsCard("Client", "agreement-party", [
      ["Legal name", parties.client.legalName],
      ["Client type", parties.client.clientType],
      ["Billing address", parties.client.billingAddress],
      ["Representative", joinName(parties.client.representativeName, parties.client.representativeJobTitle)],
      ["Email", parties.client.email],
      ["Phone", parties.client.phone],
    ]),
  ]);
}

export function AgreementTerm(agreement) {
  var rows = [
    ["Effective date", agreement.effectiveDate ? formatIsoDate(agreement.effectiveDate) : ""],
    ["Starts", agreement.term ? formatIsoDate(agreement.term.start) : ""],
    ["Ends", agreement.term ? formatIsoDate(agreement.term.end) : ""],
  ].filter(function (row) { return !!row[1]; });
  if (!rows.length) return null;
  return FactsCard("Term", "agreement-term", rows);
}

export function AgreementServices(row) {
  var section = h("section", { "class": "agreement-services", "data-module": "agreement-services", "data-visual-id": "agreement-services", "aria-labelledby": "agreement-services-title" }, [
    h("div", { "class": "agreement-section-head" }, [
      h("h2", { "class": "contracts-section__title", id: "agreement-services-title" }, "Properties and services"),
      row.servicesScope === "approved" ? h("div", { "class": "agreement-section-head__sub" }, "The options you approved") : null,
    ]),
  ]);
  if (!row.properties.length) {
    section.appendChild(h("div", { "class": "card card--pad quote-option__note", "data-state": "empty" }, row.servicesScope === "approved" ? "No approved services are listed on this agreement yet." : "No services are listed on this agreement yet."));
    return section;
  }
  row.properties.forEach(function (entry) {
    section.appendChild(h("div", { "class": "agreement-property", "data-module": "agreement-property", "data-visual-id": "agreement-property" }, [
      h("div", { "class": "agreement-property__head" }, [
        h("h3", { "class": "agreement-property__title" }, entry.title),
        entry.address ? h("div", { "class": "agreement-property__address" }, entry.address) : null,
      ]),
      h("div", { "class": "agreement-property__options" }, entry.orders.map(function (order) { return QuoteOptionCard(order); })),
    ]));
  });
  return section;
}

export function AgreementTerms(blocks) {
  var card = h("section", { "class": "card card--pad agreement-terms", "data-module": "agreement-terms", "data-visual-id": "agreement-terms", "aria-labelledby": "agreement-terms-title" }, [
    h("h2", { "class": "agreement-card__title", id: "agreement-terms-title" }, "Terms"),
  ]);
  if (!blocks.length) {
    card.appendChild(h("p", { "class": "quote-option__note", "data-state": "empty" }, "The agreement text isn’t included yet."));
    return card;
  }
  var list = null;
  blocks.forEach(function (block) {
    if (block.kind === "item") {
      if (!list || list.getAttribute("data-depth") !== String(block.depth)) {
        list = h("ul", { "class": "terms-list", "data-depth": String(block.depth) });
        card.appendChild(list);
      }
      list.appendChild(h("li", null, block.text));
      return;
    }
    list = null;
    if (block.kind === "heading") card.appendChild(h("h3", { "class": "terms-heading" }, block.text));
    else if (block.kind === "numbered") {
      card.appendChild(h("div", { "class": "terms-num", "data-depth": String(block.depth) }, [
        h("span", { "class": "terms-num__marker" }, block.marker),
        h("span", { "class": "terms-num__text" }, block.text),
      ]));
    } else card.appendChild(h("p", { "class": "terms-paragraph", "data-depth": String(block.depth) }, block.text));
  });
  return card;
}

export function AgreementOutcome(agreement) {
  var command = state.contractCommand;
  if (!command || command.kind !== "agreement" || command.phase === "pending" || command.targets.indexOf(agreement.backendId) === -1) return null;
  var outcome = CommandOutcome(command.phase);
  if (!outcome) return null;
  return h("section", { "class": "card card--pad agreement-approve", "data-module": "agreement-approve", "data-visual-id": "agreement-approve", "data-state": command.phase, "aria-labelledby": "agreement-approve-title" }, [
    h("h2", { "class": "agreement-card__title", id: "agreement-approve-title" }, "Your approval"),
    outcome,
  ]);
}

export function AgreementApproval(row, busy) {
  var agreement = row.agreement;
  var command = state.contractCommand;
  var targeted = !!command && command.kind === "agreement" && command.targets.indexOf(agreement.backendId) !== -1;
  var pending = targeted && command.phase === "pending";
  var confirm = state.contractConfirm;
  var confirming = !!confirm && confirm.kind === "agreement" && confirm.backendId === agreement.backendId;
  var card = h("section", { "class": "card card--pad agreement-approve", "data-module": "agreement-approve", "data-visual-id": "agreement-approve", "data-state": pending ? "pending" : confirming ? "confirming" : "idle", "aria-labelledby": "agreement-approve-title" });
  if (confirming) {
    var client = agreement.parties.client.legalName;
    var confirmButton = ActionButton({ variant: "btn--primary", label: pending ? "Sending…" : "Confirm approval", action: "agreement.confirm", id: String(agreement.backendId), lg: true, disabled: pending || busy, visualId: "agreement-confirm" });
    if (pending) confirmButton.setAttribute("data-state", "pending");
    card.appendChild(h("div", { "class": "decision-confirm", "data-module": "decision-confirm", "data-visual-id": "decision-confirm", "data-state": pending ? "pending" : "open", "data-kind": "agreement", role: "group", "aria-labelledby": "agreement-approve-title" }, [
      h("p", { "class": "decision-confirm__title", id: "agreement-approve-title" }, "Approve this service agreement?"),
      client ? h("p", { "class": "decision-confirm__body" }, "You approve it on behalf of " + client + ".") : null,
      h("div", { "class": "proposal-actions" }, [
        confirmButton,
        ActionButton({ variant: "btn--ghost", label: "Cancel", action: "agreement.cancel", lg: true, disabled: pending, visualId: "agreement-cancel" }),
      ]),
    ]));
  } else {
    card.appendChild(h("h2", { "class": "agreement-card__title", id: "agreement-approve-title" }, "Your approval"));
    card.appendChild(h("p", { "class": "agreement-approve__copy" }, "Approving accepts the parties, services and terms shown on this page."));
    card.appendChild(h("div", { "class": "proposal-actions" }, [
      ActionButton({ variant: "btn--primary", label: "Approve agreement", action: "agreement.approve", id: String(agreement.backendId), lg: true, disabled: busy, visualId: "agreement-approve" }),
    ]));
  }
  if (targeted && !pending) {
    var outcome = CommandOutcome(command.phase);
    if (outcome) card.appendChild(outcome);
  }
  return card;
}

function FactsCard(title, className, rows) {
  return h("section", { "class": "card card--pad " + className, "data-module": className, "data-visual-id": className }, [
    h("h2", { "class": "agreement-card__title" }, title),
    h("dl", { "class": "agreement-facts" }, rows.map(function (row) {
      return h("div", { "class": "agreement-facts__row" }, [
        h("dt", { "class": "agreement-facts__label" }, row[0]),
        h("dd", { "class": "agreement-facts__value" + (row[1] ? "" : " agreement-facts__value--missing") }, row[1] || "Not stated"),
      ]);
    })),
  ]);
}

function joinName(name, title) {
  if (!name) return "";
  return title ? name + ", " + title : name;
}
