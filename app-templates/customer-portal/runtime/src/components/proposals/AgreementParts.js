import { h } from "../../dom.js";
import { state } from "../../state.js";
import { ActionButton } from "../primitives/ActionButton.js";
import { formatIsoDate } from "../../normalizers/contracts.js";
import { visitImageUrl } from "../../normalizers/visits.js";
import { icon } from "../storm/overview-icons.js";
import { CommandOutcome } from "./ContractStates.js";
import { QuoteOptionCard } from "./QuoteOptionCard.js";

var STAGE_NOTICE = {
  drafting: { tone: "info", text: "We’re preparing your service agreement from the options you approved. A manager approves it next; it appears here for your approval and we email you when it’s ready. Nothing is needed from you." },
};

var STATE_NOTICE = {
  CLIENT_CHANGES_REQUESTED: { tone: "info", text: "We’re revising this agreement as you asked. It appears here for your approval and we email you when it’s ready." },
  AGREEMENT_SEND_FAILED: { tone: "info", text: "We’re sending this agreement to you. You can approve it here as soon as it arrives." },
};

var LOGO_WIDTH = 440;
var failedLogos = {};

export function AgreementStageNotice(agreement) {
  var notice = STATE_NOTICE[agreement.stateCode] || STAGE_NOTICE[agreement.stage];
  if (!notice) return null;
  return h("div", { "class": "agreement-notice", "data-module": "agreement-notice", "data-visual-id": "agreement-notice", "data-state": agreement.stage, "data-tone": notice.tone, role: "status" }, [
    h("span", { "class": "agreement-notice__dot", "aria-hidden": "true" }),
    h("span", { "class": "agreement-notice__text" }, notice.text),
  ]);
}

export function AgreementParties(parties) {
  return h("div", { "class": "agreement-parties", "data-module": "agreement-parties", "data-visual-id": "agreement-parties" }, [
    ProviderCard(parties.provider),
    ClientCard(parties.client),
  ]);
}

export function providerLogoUrl(provider) {
  var url = provider.logoImageId && !failedLogos[provider.logoImageId] ? visitImageUrl(state.config.coreApiBase, provider.logoImageId) : "";
  return url ? url + "?width=" + LOGO_WIDTH : "";
}

export function ProviderLogo(provider, fallback) {
  var url = providerLogoUrl(provider);
  if (!url) return fallback;
  var image = h("img", { "class": "party-logo__image", src: url, alt: provider.legalName ? provider.legalName + " logo" : "Provider logo", referrerpolicy: "no-referrer", decoding: "async" });
  var plate = h("span", { "class": "party-logo", "data-module": "provider-logo", "data-visual-id": "provider-logo" }, [image]);
  image.addEventListener("error", function () {
    failedLogos[provider.logoImageId] = true;
    if (typeof plate.replaceWith === "function") {
      if (fallback) plate.replaceWith(fallback);
      else plate.remove();
    }
  });
  return plate;
}

function ProviderCard(provider) {
  return PartyCard("provider", "Provider", provider.legalName, "", ProviderLogo(provider, Monogram(provider.legalName)), [
    ["Representative", joinName(provider.representativeName, provider.representativeJobTitle), null, "person"],
    ["Phone", provider.phone, "tel:" + provider.phone.replace(/[^+\d]/g, ""), "phone"],
    ["Email", provider.email, "mailto:" + provider.email, "mail"],
  ]);
}

function ClientCard(client) {
  return PartyCard("client", "Client", client.legalName, client.clientType, Monogram(client.legalName), [
    ["Billing address", client.billingAddress, null, "pin"],
    ["Representative", joinName(client.representativeName, client.representativeJobTitle), null, "person"],
    ["Email", client.email, null, "mail"],
    ["Phone", client.phone, null, "phone"],
  ]);
}

function PartyCard(role, label, name, tag, mark, rows) {
  var stated = rows.filter(function (row) { return !!row[1]; });
  if (!name && !stated.length) return null;
  return h("section", { "class": "card card--pad agreement-party", "data-module": "agreement-party", "data-visual-id": "agreement-party", "data-party": role, "aria-label": label }, [
    h("div", { "class": "agreement-party__head" }, [
      mark,
      h("div", { "class": "agreement-party__identity" }, [
        h("div", { "class": "agreement-party__role" }, [
          h("span", null, label),
          tag ? h("span", { "class": "agreement-party__tag", "data-module": "party-tag" }, tag) : null,
        ]),
        name ? h("h2", { "class": "agreement-party__name" }, name) : null,
      ]),
    ]),
    stated.length ? h("dl", { "class": "agreement-facts agreement-party__facts" }, stated.map(function (row) {
      return h("div", { "class": "agreement-facts__row", "data-fact": row[3] }, [
        h("dt", { "class": "agreement-facts__label" }, [icon(row[3], "agreement-party__icon"), row[0]]),
        h("dd", { "class": "agreement-facts__value" }, row[2] ? h("a", { "class": "link-action", href: row[2] }, row[1]) : row[1]),
      ]);
    })) : null,
  ]);
}

function Monogram(name) {
  var letters = String(name || "").split(/\s+/).filter(function (part) { return /^\p{L}/u.test(part); }).slice(0, 2).map(function (part) {
    return part.charAt(0).toUpperCase();
  }).join("");
  return letters ? h("span", { "class": "party-mark", "aria-hidden": "true" }, letters) : null;
}

export function AgreementTerm(agreement) {
  if (!agreement.effectiveDate) return null;
  return FactsCard("Term", "agreement-term", [["Effective date", formatIsoDate(agreement.effectiveDate)]]);
}

export function AgreementServices(row, map) {
  var section = h("section", { "class": "agreement-services", "data-module": "agreement-services", "data-visual-id": "agreement-services", "aria-labelledby": "agreement-services-title" }, [
    h("div", { "class": "agreement-section-head" }, [
      h("h2", { "class": "contracts-section__title", id: "agreement-services-title" }, "Properties and services"),
      row.servicesScope === "approved" ? h("div", { "class": "agreement-section-head__sub" }, "The options you approved") : null,
    ]),
    map || null,
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

export function AgreementTerms(blocks, open) {
  if (!blocks.length) return null;
  var card = h("section", { "class": "card card--pad agreement-terms", "data-module": "agreement-terms", "data-visual-id": "agreement-terms", "data-state": open ? "open" : "closed", "aria-labelledby": "agreement-terms-title" }, [
    h("div", { "class": "agreement-terms__head" }, [
      h("h2", { "class": "agreement-card__title", id: "agreement-terms-title" }, "Terms"),
      h("button", { "class": "link-action agreement-terms__toggle", type: "button", "data-action": "agreement.toggleTerms", "aria-expanded": open ? "true" : "false", "aria-controls": "agreement-terms-body", "data-visual-id": "agreement-terms-toggle" }, open ? "Hide terms" : "Show terms"),
    ]),
  ]);
  if (!open) return card;
  var body = h("div", { "class": "agreement-terms__body", id: "agreement-terms-body" });
  card.appendChild(body);
  var list = null;
  blocks.forEach(function (block) {
    if (block.kind === "item") {
      if (!list || list.getAttribute("data-depth") !== String(block.depth)) {
        list = h("ul", { "class": "terms-list", "data-depth": String(block.depth) });
        body.appendChild(list);
      }
      list.appendChild(h("li", null, block.text));
      return;
    }
    list = null;
    if (block.kind === "heading") body.appendChild(h("h3", { "class": "terms-heading" }, block.text));
    else if (block.kind === "numbered") {
      body.appendChild(h("div", { "class": "terms-num", "data-depth": String(block.depth) }, [
        h("span", { "class": "terms-num__marker" }, block.marker),
        h("span", { "class": "terms-num__text" }, block.text),
      ]));
    } else body.appendChild(h("p", { "class": "terms-paragraph", "data-depth": String(block.depth) }, block.text));
  });
  return card;
}

export function AgreementOutcome(agreement) {
  var command = state.contractCommand;
  if (!command || command.kind !== "agreement" || command.phase === "pending" || command.targets.indexOf(agreement.backendId) === -1) return null;
  var outcome = CommandOutcome(command.phase, command.message);
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
  var card = h("section", { "class": "card card--pad agreement-approve", "data-module": "agreement-approve", "data-visual-id": "agreement-approve", "data-tone": "warn", "data-state": pending ? "pending" : confirming ? "confirming" : "idle", "aria-labelledby": "agreement-approve-title" });
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
    card.appendChild(h("h2", { "class": "agreement-card__title", id: "agreement-approve-title" }, "Waiting for your approval"));
    card.appendChild(h("p", { "class": "agreement-approve__copy" }, "Approving accepts the parties, services and terms shown on this page."));
    card.appendChild(h("div", { "class": "proposal-actions" }, [
      ActionButton({ variant: "btn--primary", label: "Approve agreement", action: "agreement.approve", id: String(agreement.backendId), lg: true, disabled: busy, visualId: "agreement-approve" }),
    ]));
  }
  if (targeted && !pending) {
    var outcome = CommandOutcome(command.phase, command.message);
    if (outcome) card.appendChild(outcome);
  }
  return card;
}

function FactsCard(title, className, rows) {
  var stated = rows.filter(function (row) { return !!row[1]; });
  if (!stated.length) return null;
  return h("section", { "class": "card card--pad " + className, "data-module": className, "data-visual-id": className }, [
    h("h2", { "class": "agreement-card__title" }, title),
    h("dl", { "class": "agreement-facts" }, stated.map(function (row) {
      return h("div", { "class": "agreement-facts__row" }, [
        h("dt", { "class": "agreement-facts__label" }, row[0]),
        h("dd", { "class": "agreement-facts__value" }, row[2] ? h("a", { "class": "link-action", href: row[2] }, row[1]) : row[1]),
      ]);
    })),
  ]);
}

function joinName(name, title) {
  if (!name) return "";
  return title ? name + ", " + title : name;
}
