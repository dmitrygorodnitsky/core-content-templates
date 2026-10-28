import { positiveInteger, text } from "./core-record.js";
import { formatPhone, formatPostalAddress } from "./postal-address.js";

export var ACCOUNT_PROFILE_SCOPE_MODES = Object.freeze(["server-scoped", "browser-filtered"]);

var LEGAL_CONTACT = "LEGAL";
var BILLING_ADDRESS = "BILLING";
var EMAIL_ENTRY = "EMAIL";
var PHONE_ENTRY = "PHONE";

export function normalizeAccountProfile(raw) {
  var source = raw && typeof raw === "object" ? raw : {};
  var account = source.account && typeof source.account === "object" && !Array.isArray(source.account) ? source.account : null;
  if (!account) return accountProfileFailure("profile-unavailable");
  var primary = primaryContact(account.contacts);
  var contact = primary ? { name: [plain(primary.firstName), plain(primary.lastName)].filter(Boolean).join(" "), firstName: plain(primary.firstName), title: plain(primary.title) } : null;
  var emails = primary ? entryValues(primary.contactEntries, EMAIL_ENTRY) : [];
  var phones = primary ? entryValues(primary.contactEntries, PHONE_ENTRY).map(formatPhone) : [];
  var billingAddresses = typedAddresses(account.addresses, BILLING_ADDRESS);
  var editable = {
    firstName: primary ? plain(primary.firstName) : "",
    lastName: primary ? plain(primary.lastName) : "",
    email: primary ? firstEntryValue(primary.contactEntries, EMAIL_ENTRY) : "",
    phone: primary ? formatPhone(firstEntryValue(primary.contactEntries, PHONE_ENTRY)) : "",
    billingAddress: oldestTypedAddress(account.addresses, BILLING_ADDRESS),
  };
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
    editable: editable,
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
    editable: null,
    allowedActions: [],
  };
}

export function formatAccountAddress(address) {
  return formatPostalAddress(address);
}

function primaryContact(contacts) {
  var primaries = rows(contacts).filter(function (contact) {
    return text(contact.type && contact.type.code) === LEGAL_CONTACT;
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

function firstEntryValue(entries, typeCode) {
  var entry = rows(entries)
    .filter(function (row) { return text(row.type && row.type.code) === typeCode && plain(row.value); })
    .sort(byIdAscending)[0];
  return entry ? plain(entry.value) : "";
}

function oldestTypedAddress(addresses, typeCode) {
  var link = rows(addresses)
    .filter(function (row) { return rows(row.types).some(function (type) { return text(type.code) === typeCode; }); })
    .sort(byIdAscending)[0];
  return link ? formatAccountAddress(link.address) : "";
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
