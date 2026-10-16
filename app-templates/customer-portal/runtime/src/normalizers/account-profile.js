import { positiveInteger, text } from "./core-record.js";

export var ACCOUNT_PROFILE_SCOPE_MODES = Object.freeze(["server-scoped", "browser-filtered"]);

var PRIMARY_CONTACT = "PRIMARY";
var BILLING_ADDRESS = "BILLING";
var EMAIL_ENTRY = "EMAIL";
var PHONE_ENTRY = "PHONE";

export function normalizeAccountProfile(raw) {
  var source = raw && typeof raw === "object" ? raw : {};
  var account = source.account && typeof source.account === "object" && !Array.isArray(source.account) ? source.account : null;
  if (!account) return accountProfileFailure("profile-unavailable");
  var primary = primaryContact(account.contacts);
  var contact = primary ? { name: [plain(primary.firstName), plain(primary.lastName)].filter(Boolean).join(" "), title: plain(primary.title) } : null;
  var emails = primary ? entryValues(primary.contactEntries, EMAIL_ENTRY) : [];
  var phones = primary ? entryValues(primary.contactEntries, PHONE_ENTRY) : [];
  var billingAddresses = typedAddresses(account.addresses, BILLING_ADDRESS);
  var filled = [!!(contact && contact.name), emails.length > 0, phones.length > 0, billingAddresses.length > 0];
  return {
    state: filled.every(Boolean) ? "ready" : filled.some(Boolean) ? "partial" : "empty",
    reasonCode: null,
    scopeMode: ACCOUNT_PROFILE_SCOPE_MODES.indexOf(source.scopeMode) === -1 ? null : source.scopeMode,
    accountName: localizedName(account.nls),
    contact: contact,
    emails: emails,
    phones: phones,
    billingAddresses: billingAddresses,
    allowedActions: [],
  };
}

export function accountProfileFailure(code) {
  return {
    state: code === "customer-forbidden" ? "unauthorized" : code === "profile-unavailable" ? "unavailable" : "error",
    reasonCode: code || "profile-load-failed",
    scopeMode: null,
    accountName: "",
    contact: null,
    emails: [],
    phones: [],
    billingAddresses: [],
    allowedActions: [],
  };
}

export function formatAccountAddress(address) {
  if (!address || typeof address !== "object") return "";
  var region = address.state && typeof address.state === "object" ? plain(address.state.code) : "";
  return [plain(address.address1), plain(address.address2), plain(address.city), region, plain(address.postalCode)].filter(Boolean).join(", ");
}

function primaryContact(contacts) {
  var primaries = rows(contacts).filter(function (contact) {
    return text(contact.type && contact.type.code) === PRIMARY_CONTACT;
  });
  return primaries.sort(byIdAscending)[0] || null;
}

function entryValues(entries, typeCode) {
  var values = [];
  rows(entries).forEach(function (entry) {
    if (text(entry.type && entry.type.code) !== typeCode) return;
    var value = plain(entry.value);
    if (value && values.indexOf(value) === -1) values.push(value);
  });
  return values;
}

function typedAddresses(addresses, typeCode) {
  var formatted = [];
  rows(addresses)
    .filter(function (row) {
      return rows(row.types).some(function (type) { return text(type.code) === typeCode; });
    })
    .sort(byIdDescending)
    .forEach(function (row) {
      var line = formatAccountAddress(row.address);
      if (line && formatted.indexOf(line) === -1) formatted.push(line);
    });
  return formatted;
}

function byIdAscending(left, right) {
  return compareIds(left, right, 1);
}

function byIdDescending(left, right) {
  return compareIds(left, right, -1);
}

function compareIds(left, right, direction) {
  var a = positiveInteger(left && left.id);
  var b = positiveInteger(right && right.id);
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return (a - b) * direction;
}

function rows(value) {
  return Array.isArray(value) ? value.filter(function (row) { return row && typeof row === "object"; }) : [];
}

function localizedName(value) {
  if (!value || typeof value !== "object") return "";
  var localized = value.en || value["en-US"] || Object.values(value)[0] || {};
  return plain(localized && (localized.NAME || localized.name));
}

function plain(value) {
  if (typeof value === "string") return value.trim();
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
}
