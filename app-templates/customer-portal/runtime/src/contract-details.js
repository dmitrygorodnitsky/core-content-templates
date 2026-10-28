import { state } from "./state.js";
import { CONTRACT_CLIENT_TYPES } from "./normalizers/contracts.js";
import { contractDetailsPrefill } from "./normalizers/account-profile.js";
import { loadContractDetailsAccount } from "./adapters/core-account-profile-adapter.js";
import { validateProfileValue } from "./profile-edit.js";

const TEXT_LIMIT = 255;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

const field = (code, label, kind, autocomplete, required) => Object.freeze({ code, label, kind, autocomplete, required });

export const CONTRACT_DETAILS_FIELDS = Object.freeze([
  field("LEGAL_NAME", "Legal name", "text", "organization", true),
  field("CLIENT_TYPE", "Client type", "choice", null, true),
  field("BILLING_ADDRESS", "Billing address", "address", "street-address", true),
  field("REPRESENTATIVE_FIRST_NAME", "First name", "text", "given-name", true),
  field("REPRESENTATIVE_LAST_NAME", "Last name", "text", "family-name", true),
  field("REPRESENTATIVE_JOB_TITLE", "Job title", "text", "organization-title", false),
  field("REPRESENTATIVE_EMAIL", "Email", "email", "email", true),
  field("REPRESENTATIVE_PHONE", "Phone", "tel", "tel", true),
  field("INFORMATION_CONFIRMED", "I confirm that the information above is accurate.", "confirm", null, true),
  field("AUTHORITY_CONFIRMED", "I confirm that I am authorized to enter into this agreement on behalf of the client.", "confirm", null, true),
]);

export const CONTRACT_DETAILS_COPY = Object.freeze({
  legalName: "Enter the client’s legal name.",
  clientType: "Choose the client type.",
  clientTypeInvalid: "Choose one of the client types.",
  confirm: "Confirm this to send your details.",
  plainText: "Use letters, spaces and punctuation only.",
  tooLong: "Use " + TEXT_LIMIT + " characters or fewer.",
  returnedMissing: "This was missing from the details you sent.",
  returnedUnconfirmed: "This confirmation was missing from the details you sent.",
  returnedEmail: "Enter a valid email address, like name@example.com.",
});

const PROFILE_RULES = Object.freeze({
  BILLING_ADDRESS: "BILLING_ADDRESS",
  REPRESENTATIVE_FIRST_NAME: "FIRST_NAME",
  REPRESENTATIVE_LAST_NAME: "LAST_NAME",
  REPRESENTATIVE_EMAIL: "EMAIL",
  REPRESENTATIVE_PHONE: "PHONE",
});

const CLIENT_TYPE_CODES = CONTRACT_CLIENT_TYPES.map(function (type) { return type.code; });

export function contractDetailsFor(backendId) {
  var details = state.contractDetails;
  return details && details.agreementId === backendId ? details : null;
}

export function openContractDetails(backendId, options) {
  if (contractDetailsFor(backendId)) return Promise.resolve(state.contractDetails);
  var settings = options || {};
  var details = { agreementId: backendId, prefill: "loading", filled: false, draft: emptyDraft(), errors: {} };
  state.contractDetails = details;
  var load = settings.load || loadContractDetailsAccount;
  return Promise.resolve()
    .then(function () { return load({ config: state.config, state: state }); })
    .then(function (result) {
      var values = contractDetailsPrefill(result && result.account, CLIENT_TYPE_CODES);
      Object.keys(values).forEach(function (code) { details.draft[code] = values[code]; });
      details.filled = Object.keys(values).some(function (code) { return !!values[code]; });
      details.prefill = "ready";
    }, function (error) {
      if (error && error.code === "session-expired") state.account = "session-expired";
      details.prefill = "failed";
    })
    .then(function () {
      if (settings.onChange) settings.onChange();
      return details;
    });
}

export function changeContractDetail(backendId, code, value) {
  var details = contractDetailsFor(backendId);
  var definition = CONTRACT_DETAILS_FIELDS.find(function (item) { return item.code === code; });
  if (!details || !definition) return false;
  details.draft[code] = definition.kind === "confirm" ? value === true : String(value == null ? "" : value);
  return true;
}

export function contractDetailsRequest(draft) {
  var errors = {};
  var values = {};
  CONTRACT_DETAILS_FIELDS.forEach(function (item) {
    var checked = validateDetail(item, draft[item.code]);
    if (checked.error) errors[item.code] = checked.error;
    else values[item.code] = checked.value;
  });
  return Object.keys(errors).length ? { errors: errors, values: null } : { errors: {}, values: values };
}

export function returnedDetailErrors(codes) {
  var errors = {};
  (codes || []).forEach(function (code) {
    if (code === "CLIENT_TYPE_INVALID") errors.CLIENT_TYPE = CONTRACT_DETAILS_COPY.clientTypeInvalid;
    else if (code === "REPRESENTATIVE_EMAIL_INVALID") errors.REPRESENTATIVE_EMAIL = CONTRACT_DETAILS_COPY.returnedEmail;
    else {
      var definition = CONTRACT_DETAILS_FIELDS.find(function (item) { return item.code === code; });
      if (definition) errors[code] = definition.kind === "confirm" ? CONTRACT_DETAILS_COPY.returnedUnconfirmed : CONTRACT_DETAILS_COPY.returnedMissing;
    }
  });
  return errors;
}

function validateDetail(item, raw) {
  if (item.kind === "confirm") return raw === true ? accepted(true) : refusal(CONTRACT_DETAILS_COPY.confirm);
  var collapsed = String(raw == null ? "" : raw).replace(/\s+/g, " ").trim();
  if (item.kind === "choice") {
    if (!collapsed) return refusal(CONTRACT_DETAILS_COPY.clientType);
    return CLIENT_TYPE_CODES.indexOf(collapsed) === -1 ? refusal(CONTRACT_DETAILS_COPY.clientTypeInvalid) : accepted(collapsed);
  }
  if (PROFILE_RULES[item.code]) return validateProfileValue(PROFILE_RULES[item.code], collapsed, "");
  if (!collapsed && item.required) return refusal(CONTRACT_DETAILS_COPY.legalName);
  if (CONTROL_CHARACTERS.test(collapsed)) return refusal(CONTRACT_DETAILS_COPY.plainText);
  if (collapsed.length > TEXT_LIMIT) return refusal(CONTRACT_DETAILS_COPY.tooLong);
  return accepted(collapsed);
}

function emptyDraft() {
  var draft = {};
  CONTRACT_DETAILS_FIELDS.forEach(function (item) { draft[item.code] = item.kind === "confirm" ? false : ""; });
  return draft;
}

function refusal(message) {
  return { error: message, value: null };
}

function accepted(value) {
  return { error: null, value: value };
}
