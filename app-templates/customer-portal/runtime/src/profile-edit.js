import { state } from "./state.js";
import { customerAccountProfile } from "./config.js";
import { LOGIN_FORM, PROFILE_FORM, createCoreProfileFormAdapter } from "./adapters/core-profile-form-adapter.js";

const NAME_LIMIT = 32;
const EMAIL_LIMIT = 254;
const ADDRESS_LIMIT = 255;
const EMAIL_SHAPE = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;
const PHONE_CHARACTERS = /^\+?[0-9 ().-]+$/;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

const field = (code, key, label, type, autocomplete, placeholder) => Object.freeze({ code, key, label, type, autocomplete, placeholder });

export const PROFILE_EDIT_ROWS = Object.freeze({
  contact: Object.freeze({ label: "Name", form: PROFILE_FORM, fields: Object.freeze([field("FIRST_NAME", "firstName", "First name", "text", "given-name"), field("LAST_NAME", "lastName", "Last name", "text", "family-name")]) }),
  email: Object.freeze({ label: "Email", form: PROFILE_FORM, fields: Object.freeze([field("EMAIL", "email", "Email", "email", "email")]) }),
  phone: Object.freeze({ label: "Phone", form: PROFILE_FORM, fields: Object.freeze([field("PHONE", "phone", "Phone", "tel", "tel")]) }),
  billing: Object.freeze({ label: "Billing address", form: PROFILE_FORM, fields: Object.freeze([field("BILLING_ADDRESS", "billingAddress", "Billing address", "text", "street-address")]) }),
  login: Object.freeze({ label: "Account name", form: LOGIN_FORM, fields: Object.freeze([field("LOGIN", "login", "Account name", "email", "username", "name@example.com")]) }),
});

const SESSION_ENDED = "Your session ended while the sign-in was changing. Sign in again: with {next} if the change went through, otherwise with {current}.";
const UNCONFIRMED = "We couldn't confirm the change yet. Reload the page in a minute to see the details on file.";
const NOT_SENT = "Your change wasn't sent. Check your connection and try again.";
const FAILED = "We couldn't save your change right now. Please try again in a few minutes.";

export function profileEditing(config) {
  return !!config && config.vertical === "snow" && config.dataMode === "live" && customerAccountProfile(config);
}

export function profileEditBusy() {
  return !!(state.profileEdit && state.profileEdit.phase === "saving");
}

export function currentSignIn() {
  return state.profileLoginChanged || state.session && state.session.login || "";
}

export function startProfileEdit(row) {
  var definition = PROFILE_EDIT_ROWS[row];
  if (!definition || profileEditBusy()) return false;
  var initial = initialValues(row);
  state.profileSaved = null;
  state.profileEdit = { row: row, initial: initial, draft: Object.assign({}, initial), errors: {}, phase: "editing", message: null };
  return true;
}

export function changeProfileDraft(key, value) {
  var edit = state.profileEdit;
  if (!edit || edit.phase === "saving") return false;
  edit.draft[key] = String(value == null ? "" : value);
  return true;
}

export function cancelProfileEdit() {
  if (!state.profileEdit || profileEditBusy()) return false;
  state.profileEdit = null;
  return true;
}

export function profileEditRequest(row, initial, draft) {
  var definition = PROFILE_EDIT_ROWS[row];
  var errors = {};
  var values = {};
  var fields = [];
  definition.fields.forEach(function (item) {
    var raw = String(draft[item.key] == null ? "" : draft[item.key]);
    var before = String(initial[item.key] == null ? "" : initial[item.key]);
    var unchanged = item.code === "LOGIN" ? comparable(raw).toLowerCase() === comparable(before).toLowerCase() : comparable(raw) === comparable(before);
    if (unchanged && item.code !== "LOGIN") return;
    var checked = validateProfileValue(item.code, raw, before);
    if (checked.error) errors[item.code] = checked.error;
    else {
      values[item.code] = checked.value;
      fields.push(item.code);
    }
  });
  if (Object.keys(errors).length) return { errors: errors, values: null };
  if (!fields.length) return { errors: {}, values: null };
  if (definition.form === LOGIN_FORM) return { errors: {}, values: { LOGIN: values.LOGIN } };
  return { errors: {}, values: Object.assign({ FIELDS: fields }, values) };
}

export function validateProfileValue(code, raw, current) {
  var collapsed = comparable(raw);
  if (code === "FIRST_NAME" || code === "LAST_NAME") {
    if (!collapsed) return refusal(code === "FIRST_NAME" ? "Enter your first name." : "Enter your last name.");
    if (CONTROL_CHARACTERS.test(collapsed)) return refusal("Use letters, spaces and punctuation only.");
    if (collapsed.length > NAME_LIMIT) return refusal("Use " + NAME_LIMIT + " characters or fewer.");
    return accepted(collapsed);
  }
  if (code === "EMAIL" || code === "LOGIN") {
    var email = String(raw == null ? "" : raw).trim().toLowerCase();
    if (!email) return refusal(code === "EMAIL" ? "Enter your email address." : "Enter the email you want to sign in with.");
    if (email.length > EMAIL_LIMIT || !EMAIL_SHAPE.test(email)) return refusal("Enter a valid email address, like name@example.com.");
    if (code === "LOGIN" && email === comparable(current).toLowerCase()) return refusal("This is already the email you sign in with.");
    return accepted(email);
  }
  if (code === "PHONE") {
    if (!collapsed) return refusal("Enter your phone number.");
    var digits = collapsed.replace(/\D/g, "");
    if (!PHONE_CHARACTERS.test(collapsed) || digits.length < 7 || digits.length > 15) return refusal("Enter a valid phone number with its area code.");
    return accepted(collapsed);
  }
  if (code === "BILLING_ADDRESS") {
    if (!collapsed) return refusal("Enter your billing address.");
    if (collapsed.length > ADDRESS_LIMIT) return refusal("Use " + ADDRESS_LIMIT + " characters or fewer.");
    if (CONTROL_CHARACTERS.test(collapsed) || !/[0-9]/.test(collapsed) || !/\p{L}/u.test(collapsed)) return refusal("Enter the full street address, including the building number.");
    return accepted(collapsed);
  }
  return refusal("This detail can't be changed here.");
}

export function saveProfileEdit(options) {
  var edit = state.profileEdit;
  if (!edit || edit.phase === "saving") return Promise.resolve(false);
  var changed = options.onChange;
  var definition = PROFILE_EDIT_ROWS[edit.row];
  var request = profileEditRequest(edit.row, edit.initial, edit.draft);
  if (Object.keys(request.errors).length) {
    edit.errors = request.errors;
    edit.message = null;
    edit.phase = "editing";
    changed("invalid");
    return Promise.resolve(false);
  }
  if (!request.values) {
    state.profileEdit = null;
    changed("closed");
    return Promise.resolve(true);
  }
  var forms = options.forms || createCoreProfileFormAdapter();
  var context = { config: state.config, state: state };
  edit.phase = "saving";
  edit.errors = {};
  edit.message = null;
  changed("saving");
  return Promise.resolve()
    .then(function () { return forms.submit(definition.form, request.values, context); })
    .then(function (formId) { return forms.outcome(definition.form, formId, context); })
    .then(function (result) { return settle(edit, definition, request.values, result, options.reload, changed); }, function (error) { return fail(edit, request.values, error, changed); });
}

function settle(edit, definition, values, result, reloadProfile, changed) {
  if (state.profileEdit !== edit) return false;
  if (result.outcome === "APPLIED") {
    if (definition.form === LOGIN_FORM) {
      state.profileLoginChanged = values.LOGIN;
      state.session.login = values.LOGIN;
      state.profileEdit = null;
      changed("applied");
      return true;
    }
    return Promise.resolve().then(function () { return reloadProfile("profile"); }).then(function () { return true; }, function () { return true; }).then(function (done) {
      if (state.profileEdit === edit) state.profileEdit = null;
      state.profileSaved = edit.row;
      changed("applied");
      return done;
    });
  }
  edit.phase = result.outcome === "REFUSED" ? "refused" : "failed";
  var codes = definition.fields.map(function (item) { return item.code; });
  if (result.outcome === "REFUSED" && result.field && codes.indexOf(result.field) !== -1) edit.errors = { [result.field]: result.message };
  else edit.message = result.message || FAILED;
  changed(edit.phase);
  return false;
}

function fail(edit, values, error, changed) {
  if (state.profileEdit !== edit) return false;
  var code = error && error.code;
  if (code === "session-expired" && edit.row === "login") {
    edit.phase = "session-ended";
    edit.message = SESSION_ENDED.replace("{next}", values.LOGIN).replace("{current}", edit.initial.login || "your current email");
  } else if (code === "session-expired") {
    state.profileEdit = null;
    state.account = "session-expired";
  } else {
    edit.phase = "failed";
    edit.message = code === "outcome-unknown" ? UNCONFIRMED : NOT_SENT;
  }
  changed(edit.phase || "closed");
  return false;
}

function initialValues(row) {
  if (row === "login") return { login: currentSignIn() };
  var envelope = state.moduleData.profile || {};
  var editable = envelope.editable || {};
  var values = {};
  PROFILE_EDIT_ROWS[row].fields.forEach(function (item) { values[item.key] = editable[item.key] || ""; });
  return values;
}

export function focusProfileInput(invalidFirst) {
  var root = globalThis.document;
  if (!root || typeof root.querySelector !== "function") return;
  var input = (invalidFirst && root.querySelector("[data-profile-input][aria-invalid=\"true\"]")) || root.querySelector("[data-profile-input]");
  if (input && typeof input.focus === "function") input.focus();
}

function comparable(value) {
  return String(value == null ? "" : value).replace(/\s+/g, " ").trim();
}

function refusal(message) {
  return { error: message, value: null };
}

function accepted(value) {
  return { error: null, value: value };
}
