import { h } from "../../dom.js";
import { skel } from "../primitives/RouteStates.js";
import { CONTRACT_CLIENT_TYPES } from "../../normalizers/contracts.js";
import { CONTRACT_DETAILS_FIELDS, changeContractDetail } from "../../contract-details.js";
import { addressFinder } from "../../quote-request.js";
import { attachAddressSuggestions } from "../../address-suggestions.js";
import { PartialNotice } from "./ContractStates.js";

var GROUPS = [
  { title: "Client", codes: ["LEGAL_NAME", "CLIENT_TYPE", "BILLING_ADDRESS", "LEGAL_ADDRESS"] },
  { title: "Representative", codes: ["REPRESENTATIVE_FIRST_NAME", "REPRESENTATIVE_LAST_NAME", "REPRESENTATIVE_JOB_TITLE", "REPRESENTATIVE_EMAIL", "REPRESENTATIVE_PHONE"] },
];
var PAIRS = { REPRESENTATIVE_FIRST_NAME: "REPRESENTATIVE_LAST_NAME", REPRESENTATIVE_EMAIL: "REPRESENTATIVE_PHONE" };
var CONFIRMATIONS = ["INFORMATION_CONFIRMED", "AUTHORITY_CONFIRMED"];
var INPUT_TYPES = { text: "text", address: "text", email: "email", tel: "tel" };

export function contractDetailsLoading(details) {
  return !details || details.prefill === "loading";
}

export function ContractDetailsForm(details, pending) {
  var loading = contractDetailsLoading(details);
  var panel = h("div", {
    "class": "agreement-details",
    "data-module": "agreement-details",
    "data-visual-id": "agreement-details",
    "data-state": loading ? "loading" : pending ? "pending" : "editing",
    role: "group",
    "aria-labelledby": "agreement-details-title",
  }, [
    h("p", { "class": "decision-confirm__title", id: "agreement-details-title" }, "Your contract details"),
    h("p", { "class": "decision-confirm__body" }, "These details go into your service agreement."),
  ]);
  if (loading) {
    panel.setAttribute("aria-busy", "true");
    panel.appendChild(h("div", { "class": "contract-form", "data-module": "agreement-details-loading" }, [0, 1, 2].map(function () {
      return h("div", { "class": "field-row" }, [skel("width:28%;height:11px;margin-bottom:4px"), skel("height:40px;border-radius:12px")]);
    })));
    return panel;
  }

  var notice = prefillNotice(details);
  if (notice) panel.appendChild(notice);

  var errors = details.errors;
  var form = h("div", { "class": "contract-form", "aria-busy": pending ? "true" : undefined });
  GROUPS.forEach(function (group) {
    var section = h("div", { "class": "contract-form__group" }, [h("div", { "class": "contract-form__legend" }, group.title)]);
    var skip = {};
    group.codes.forEach(function (code) {
      if (skip[code]) return;
      var pair = PAIRS[code];
      if (pair) {
        skip[pair] = true;
        section.appendChild(h("div", { "class": "contract-form__pair" }, [Field(code, details, errors, pending), Field(pair, details, errors, pending)]));
      } else section.appendChild(Field(code, details, errors, pending));
    });
    form.appendChild(section);
  });
  form.appendChild(h("div", { "class": "contract-form__group contract-form__confirmations" }, CONFIRMATIONS.map(function (code) {
    return Confirmation(code, details, errors, pending);
  })));
  panel.appendChild(form);
  return panel;
}

function prefillNotice(details) {
  if (details.prefill === "failed") return PartialNotice("Your account details could not be loaded, so nothing is filled in for you.");
  if (details.filled) {
    return h("p", { "class": "contract-form__note", "data-module": "agreement-details-prefill" }, "Filled in from your account. Check every field before sending.");
  }
  return null;
}

function Field(code, details, errors, pending) {
  var definition = definitionOf(code);
  if (definition.kind === "choice") return ClientType(definition, details, errors, pending);
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
  input.addEventListener("input", function () { changeContractDetail(code, input.value); });
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
          changeContractDetail(code, address);
          input.focus();
        });
      },
    });
  }
  return cell;
}

function ClientType(definition, details, errors, pending) {
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
      input.addEventListener("change", function () { if (input.checked) changeContractDetail(definition.code, type.code); });
      return h("label", { "class": "choice-chip" }, [input, h("span", { "class": "choice-chip__label" }, type.label)]);
    })),
    error ? h("div", { "class": "field-error", id: legendId + "-error", role: "alert" }, error) : null,
  ]);
}

function Confirmation(code, details, errors, pending) {
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
  input.addEventListener("change", function () { changeContractDetail(code, input.checked === true); });
  return h("div", { "class": "check-line", "data-state": error ? "invalid" : undefined }, [
    h("label", { "class": "check-line__label", "for": id }, [input, h("span", null, definition.label)]),
    error ? h("div", { "class": "field-error", id: id + "-error", role: "alert" }, error) : null,
  ]);
}

function definitionOf(code) {
  return CONTRACT_DETAILS_FIELDS.find(function (item) { return item.code === code; });
}
