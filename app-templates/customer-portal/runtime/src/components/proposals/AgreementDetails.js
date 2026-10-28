import { h } from "../../dom.js";
import { state } from "../../state.js";
import { ActionButton } from "../primitives/ActionButton.js";
import { skel } from "../primitives/RouteStates.js";
import { CONTRACT_CLIENT_TYPES } from "../../normalizers/contracts.js";
import { CONTRACT_DETAILS_FIELDS, changeContractDetail, contractDetailsFor, returnedDetailErrors } from "../../contract-details.js";
import { addressFinder } from "../../quote-request.js";
import { attachAddressSuggestions } from "../../address-suggestions.js";
import { CommandOutcome, DecisionFailure, PartialNotice, PendingNote } from "./ContractStates.js";

var GROUPS = [
  { title: "Client", codes: ["LEGAL_NAME", "CLIENT_TYPE", "BILLING_ADDRESS"] },
  { title: "Representative", codes: ["REPRESENTATIVE_FIRST_NAME", "REPRESENTATIVE_LAST_NAME", "REPRESENTATIVE_JOB_TITLE", "REPRESENTATIVE_EMAIL", "REPRESENTATIVE_PHONE"] },
];
var PAIRS = { REPRESENTATIVE_FIRST_NAME: "REPRESENTATIVE_LAST_NAME", REPRESENTATIVE_EMAIL: "REPRESENTATIVE_PHONE" };
var CONFIRMATIONS = ["INFORMATION_CONFIRMED", "AUTHORITY_CONFIRMED"];
var INPUT_TYPES = { text: "text", address: "text", email: "email", tel: "tel" };

export function AgreementDetailsStep(row, busy) {
  var agreement = row.agreement;
  var backendId = agreement.backendId;
  var details = contractDetailsFor(backendId);
  var command = state.contractCommand;
  var targeted = !!command && command.kind === "details" && command.targets.indexOf(backendId) !== -1;
  var pending = targeted && command.phase === "pending";
  var card = h("section", {
    "class": "card card--pad agreement-details",
    "data-module": "agreement-details",
    "data-visual-id": "agreement-details",
    "data-tone": "warn",
    "data-state": !details || details.prefill === "loading" ? "loading" : pending ? "pending" : "editing",
    "aria-labelledby": "agreement-details-title",
  }, [
    h("h2", { "class": "agreement-card__title", id: "agreement-details-title" }, "Your contract details"),
    h("p", { "class": "agreement-approve__copy" }, "Every property has a decision. These details go into your service agreement."),
  ]);
  if (!details || details.prefill === "loading") {
    card.setAttribute("aria-busy", "true");
    card.appendChild(h("div", { "class": "contract-form", "data-module": "agreement-details-loading" }, [0, 1, 2].map(function () {
      return h("div", { "class": "field-row" }, [skel("width:28%;height:11px;margin-bottom:4px"), skel("height:40px;border-radius:12px")]);
    })));
    return card;
  }

  var browserErrors = Object.keys(details.errors).length > 0;
  var returned = !browserErrors ? agreement.detailsErrors : [];
  var errors = browserErrors ? details.errors : returnedDetailErrors(returned);
  var notice = detailsNotice(details, returned, targeted ? command.phase : null);
  if (notice) card.appendChild(notice);

  var form = h("div", { "class": "contract-form", role: "group", "aria-labelledby": "agreement-details-title", "aria-busy": pending ? "true" : undefined });
  GROUPS.forEach(function (group) {
    var section = h("div", { "class": "contract-form__group" }, [h("div", { "class": "contract-form__legend" }, group.title)]);
    var skip = {};
    group.codes.forEach(function (code) {
      if (skip[code]) return;
      var pair = PAIRS[code];
      if (pair) {
        skip[pair] = true;
        section.appendChild(h("div", { "class": "contract-form__pair" }, [Field(backendId, code, details, errors, pending), Field(backendId, pair, details, errors, pending)]));
      } else section.appendChild(Field(backendId, code, details, errors, pending));
    });
    form.appendChild(section);
  });
  form.appendChild(h("div", { "class": "contract-form__group contract-form__confirmations" }, CONFIRMATIONS.map(function (code) {
    return Confirmation(backendId, code, details, errors, pending);
  })));
  card.appendChild(form);

  var sendButton = ActionButton({ variant: "btn--primary", label: pending ? "Sending…" : "Send details", action: "agreement.sendDetails", id: String(backendId), lg: true, disabled: pending || busy, visualId: "agreement-send-details" });
  if (pending) sendButton.setAttribute("data-state", "pending");
  card.appendChild(h("div", { "class": "proposal-actions contract-form__actions" }, [sendButton]));
  if (pending) card.appendChild(PendingNote("Sending your details and waiting for our system to check them…"));
  else if (targeted && ["conflict", "failed", "refused", "readback-failed"].indexOf(command.phase) !== -1) {
    var outcome = CommandOutcome(command.phase);
    if (outcome) card.appendChild(outcome);
  }
  return card;
}

function detailsNotice(details, returned, phase) {
  if (phase === "unconfirmed") {
    return DecisionFailure("We couldn’t confirm that your details arrived. Refresh the status in a minute before sending them again.", { action: "contracts.refresh", label: "Refresh status" });
  }
  if (returned.indexOf("PROCESSING_FAILED") !== -1) {
    return PartialNotice("Your details were not saved. Nothing was wrong with what you entered: our system could not save them. Check the form and send your details again.");
  }
  if (returned.length) return PartialNotice("Your details came back. Our system could not accept them. Fix the marked fields and send your details again.");
  if (details.prefill === "failed") return PartialNotice("Your account details could not be loaded, so nothing is filled in for you.");
  if (details.filled) {
    return h("p", { "class": "contract-form__note", "data-module": "agreement-details-prefill" }, "Filled in from your account. Check every field before sending.");
  }
  return null;
}

function Field(backendId, code, details, errors, pending) {
  var definition = definitionOf(code);
  if (definition.kind === "choice") return ClientType(backendId, definition, details, errors, pending);
  var id = "contract-detail-" + code.toLowerCase().replace(/_/g, "-");
  var error = errors[code];
  var suggesting = definition.kind === "address" && !!addressFinder() && !pending;
  var input = h("input", {
    "class": "field",
    id: id,
    name: code,
    type: INPUT_TYPES[definition.kind] || "text",
    autocomplete: suggesting ? "off" : definition.autocomplete,
    value: details.draft[code] || "",
    "data-contract-detail": code,
    "data-state": error ? "invalid" : undefined,
    "aria-invalid": error ? "true" : undefined,
    "aria-describedby": error ? id + "-error" : undefined,
    "aria-required": definition.required ? "true" : undefined,
    disabled: pending ? true : undefined,
    spellcheck: definition.kind === "text" ? undefined : "false",
  });
  input.addEventListener("input", function () { changeContractDetail(backendId, code, input.value); });
  var cell = h("div", { "class": "field-row prop-edit__field" }, [
    h("label", { "class": "field-label", "for": id }, definition.required ? definition.label : definition.label + " (optional)"),
    input,
    error ? h("div", { "class": "field-error", id: id + "-error", role: "alert" }, error) : null,
  ]);
  if (suggesting) {
    attachAddressSuggestions(input, cell, {
      finder: addressFinder(),
      pick: function (item) {
        Promise.resolve(item.address()).then(function (address) {
          input.value = address;
          changeContractDetail(backendId, code, address);
          input.focus();
        });
      },
    });
  }
  return cell;
}

function ClientType(backendId, definition, details, errors, pending) {
  var error = errors[definition.code];
  var legendId = "contract-detail-client-type";
  var chosen = details.draft[definition.code];
  return h("div", {
    "class": "field-row",
    role: "radiogroup",
    "aria-labelledby": legendId,
    "aria-required": "true",
    "aria-invalid": error ? "true" : undefined,
    "aria-describedby": error ? legendId + "-error" : undefined,
    "data-contract-detail": definition.code,
  }, [
    h("div", { "class": "field-label", id: legendId }, definition.label),
    h("div", { "class": "choice-chips" }, CONTRACT_CLIENT_TYPES.map(function (type) {
      var input = h("input", { "class": "choice-chip__input", type: "radio", name: "contract-detail-client-type", value: type.code, checked: chosen === type.code ? true : undefined, disabled: pending ? true : undefined, "data-client-type": type.code });
      input.addEventListener("change", function () { if (input.checked) changeContractDetail(backendId, definition.code, type.code); });
      return h("label", { "class": "choice-chip" }, [input, h("span", { "class": "choice-chip__label" }, type.label)]);
    })),
    error ? h("div", { "class": "field-error", id: legendId + "-error", role: "alert" }, error) : null,
  ]);
}

function Confirmation(backendId, code, details, errors, pending) {
  var definition = definitionOf(code);
  var error = errors[code];
  var id = "contract-detail-" + code.toLowerCase().replace(/_/g, "-");
  var input = h("input", {
    "class": "check-line__input",
    type: "checkbox",
    id: id,
    checked: details.draft[code] === true ? true : undefined,
    disabled: pending ? true : undefined,
    "aria-invalid": error ? "true" : undefined,
    "aria-describedby": error ? id + "-error" : undefined,
    "data-contract-detail": code,
  });
  input.addEventListener("change", function () { changeContractDetail(backendId, code, input.checked === true); });
  return h("div", { "class": "check-line", "data-state": error ? "invalid" : undefined }, [
    h("label", { "class": "check-line__label", "for": id }, [input, h("span", null, definition.label)]),
    error ? h("div", { "class": "field-error", id: id + "-error", role: "alert" }, error) : null,
  ]);
}

function definitionOf(code) {
  return CONTRACT_DETAILS_FIELDS.find(function (item) { return item.code === code; });
}
