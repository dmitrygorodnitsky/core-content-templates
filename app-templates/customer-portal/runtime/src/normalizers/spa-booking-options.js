const EMPTY_COPY = Object.freeze({
  locationsError: "Places didn’t load — nothing is shown so nothing is guessed. Try again.",
  locationsEmpty: "No place is open for this visit right now. Nothing was reserved — our team can find one for you.",
  locationsUnavailable: "Choosing a place isn’t connected yet. Your visit will be confirmed with the place the studio assigns — you’ll see it before you confirm.",
  locationIneligible: "The place you picked isn’t available with your current choices — it was cleared. Pick one of the places below.",
  noSavedPlace: "We don’t have a place on file for at-home visits, so this option can’t be completed here. The studio can add one with you — nothing was saved or sent.",
  addOnsError: "Extras didn’t load — nothing is shown so nothing is guessed. Try again.",
  addOnsUnavailable: "Extras aren’t connected yet for this treatment. Nothing is added — you can ask at the studio.",
  addOnsIneligible: "These extras aren’t eligible for the treatment and time you picked, so they can’t be selected.",
  addOnRemoved: "The studio removed an extra that is no longer available for this visit. Review the visit below before you confirm.",
  addOnRepriced: "The amount for one of your extras changed. Review the visit below before you confirm.",
  addOnPendingNote: "Extras are checked with the studio one at a time — the rest stay available while one is checked.",
  optionsChangedSlot: "Your choices changed, so the earlier time was released and new times were loaded. Nothing is booked.",
  noteTooLong: "Your note is longer than the studio can accept. Please shorten it to {max} characters or fewer.",
  noteSentWith: "Sent to the studio with your request",
});

export function emptyLiveBookingOptions(selectionVersion = "core-booking-options-unavailable") {
  return {
    capabilities: { visitMode: false, location: false, addOns: false, notes: false },
    visitModes: [],
    locations: [],
    addOns: [],
    notes: { enabled: false, value: "", maxLength: 0, helperText: "" },
    quotes: {},
    selectionVersion: selectionVersion,
    copy: EMPTY_COPY,
  };
}

/**
 * Converts the versioned SPA_SERVICE.BOOKING_OPTIONS attribute into the exact
 * view contract accepted by Wave 20. Missing or malformed attributes fail
 * closed: live mode never borrows the designer fixture.
 */
export function normalizeLiveBookingOptions(service, availability) {
  var raw = productAttribute(service && service.attributes, "BOOKING_OPTIONS");
  if (!raw) return emptyLiveBookingOptions();
  var source;
  try { source = typeof raw === "string" ? JSON.parse(raw) : raw; }
  catch (_) { return emptyLiveBookingOptions("core-booking-options-invalid"); }
  if (!source || source.schemaVersion !== 1 || !text(source.selectionVersion)) {
    return emptyLiveBookingOptions("core-booking-options-invalid");
  }

  var visitModes = array(source.visitModes).map(function (mode) {
    return {
      code: text(mode && mode.code),
      label: text(mode && mode.label),
      locationRequired: !!(mode && mode.locationRequired),
    };
  }).filter(function (mode) { return mode.code && mode.label; });

  var providers = array(availability && availability.providers);
  var locationByCode = new Map();
  providers.forEach(function (provider) {
    var code = text(provider && provider.locationCode);
    var id = positiveInteger(provider && provider.locationResourceId);
    if (code && id && !locationByCode.has(code)) locationByCode.set(code, provider);
  });
  var locations = array(source.locations).map(function (location) {
    var resourceCode = text(location && location.resourceCode);
    var live = locationByCode.get(resourceCode);
    if (!live) return null;
    return {
      ref: opaqueRef("loc-core", resourceCode),
      backendResourceId: live.locationResourceId,
      resourceCode: resourceCode,
      label: text(live.locationName) || text(location && location.label),
      kind: text(location && location.kind) || "STUDIO",
      visitModeCode: text(location && location.visitModeCode),
    };
  }).filter(function (location) {
    return location && location.label && location.visitModeCode
      && visitModes.some(function (mode) { return mode.code === location.visitModeCode; });
  });

  var addOns = array(source.addOns).map(function (addon) {
    var ref = text(addon && addon.ref);
    var name = text(addon && addon.name);
    if (!ref || !name) return null;
    var allowed = array(addon.allowedActions).map(text).filter(function (action) { return action === "toggle"; });
    return {
      ref: ref,
      name: name,
      description: text(addon.description),
      required: !!addon.required,
      selected: !!addon.selected,
      displayPrice: text(addon.displayPrice) || null,
      durationNote: text(addon.durationNote) || null,
      allowedActions: allowed,
    };
  }).filter(Boolean);

  var notesSource = source.notes || {};
  var notesEnabled = notesSource.enabled === true;
  var maxLength = notesEnabled ? boundedInteger(notesSource.maxLength, 200, 1, 2000) : 0;
  var quotes = {};
  Object.entries(source.quotes || {}).forEach(function (entry) {
    var key = canonicalSelectionKey(entry[0] ? entry[0].split("|") : []);
    var quote = entry[1] || {};
    var durationMinutes = positiveInteger(quote.durationMinutes);
    var displayTotal = text(quote.displayTotal);
    if (!durationMinutes || !displayTotal) return;
    quotes[key] = {
      version: text(source.selectionVersion),
      addOns: addOns.filter(function (addon) { return key.split("|").includes(addon.ref); }),
      displaySubtotal: text(quote.displaySubtotal) || null,
      displayTotal: displayTotal,
      durationMinutes: durationMinutes,
    };
  });

  return {
    capabilities: {
      visitMode: visitModes.length > 0,
      location: array(source.locations).length > 0,
      addOns: addOns.length > 0,
      notes: notesEnabled,
    },
    visitModes: visitModes,
    locations: locations,
    addOns: addOns,
    notes: {
      enabled: notesEnabled,
      value: "",
      maxLength: maxLength,
      helperText: text(notesSource.helperText),
    },
    quotes: quotes,
    selectionVersion: text(source.selectionVersion),
    copy: EMPTY_COPY,
  };
}

export function liveBookingQuote(options, selectedRefs) {
  var key = canonicalSelectionKey(selectedRefs);
  return options && options.quotes && options.quotes[key] || null;
}

export function canonicalSelectionKey(refs) {
  return array(refs).map(text).filter(Boolean).sort().join("|");
}

function productAttribute(attributes, code) {
  if (!attributes || typeof attributes !== "object") return null;
  for (var group of Object.values(attributes)) {
    var entry = group && group[code];
    if (entry && Object.prototype.hasOwnProperty.call(entry, "value")) return entry.value;
  }
  return null;
}

function opaqueRef(prefix, value) {
  var source = text(value);
  var hash = 2166136261;
  for (var index = 0; index < source.length; index += 1) hash = Math.imul(hash ^ source.charCodeAt(index), 16777619);
  return prefix + "-" + (hash >>> 0).toString(36);
}

function array(value) { return Array.isArray(value) ? value : []; }
function text(value) { return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim(); }
function positiveInteger(value) { var number = Number(value); return Number.isInteger(number) && number > 0 ? number : null; }
function boundedInteger(value, fallback, min, max) { var number = Number(value); return Number.isInteger(number) && number >= min && number <= max ? number : fallback; }
