import { liveProperties, state } from "./state.js";
import { positiveInteger, text } from "./normalizers/core-record.js";
import { QUOTE_REQUEST_FORM, createCoreProfileFormAdapter } from "./adapters/core-profile-form-adapter.js";
import { createGoogleMapsAdapter } from "./adapters/google-maps-adapter.js";

export const QUOTE_REQUEST_OUTCOME_TIMEOUT_MS = 300000;
export const QUOTE_REQUEST_POLL_MS = 3000;
export const QUOTE_REQUEST_LIMIT = 20;
export const QUOTE_REQUEST_FINAL_OUTCOMES = Object.freeze(["ACCEPTED", "REFUSED", "FAILED"]);
export const QUOTE_REQUEST_FIELDS = Object.freeze(["PROPERTY_IDS", "PROPERTY_ADDRESSES"]);

export const QUOTE_REQUEST_COPY = Object.freeze({
  nothingChosen: "Choose a property or add an address to quote.",
  tooManyProperties: "Choose at most " + QUOTE_REQUEST_LIMIT + " properties in one request.",
  tooManyAddresses: "Add at most " + QUOTE_REQUEST_LIMIT + " new addresses in one request.",
  addressOutside: "This address is outside the area we serve.",
  addressUnknown: "We could not find this address. Check it or pick one from the suggestions.",
  notSent: "Your request wasn’t sent. Check your connection and try again.",
  failed: "We couldn’t take your quote request right now. Please try again in a few minutes.",
});

const BUSY_PHASES = Object.freeze(["sending", "waiting", "processing", "checking"]);

let finder = null;

export function quoteRequestOpen(config) {
  return !!config && config.vertical === "snow" && config.dataMode === "live";
}

export function quoteRequestState() {
  if (!state.quoteRequest) state.quoteRequest = freshRequest();
  return state.quoteRequest;
}

export function resetQuoteRequest() {
  var current = state.quoteRequest;
  if (current && BUSY_PHASES.indexOf(current.phase) !== -1) return false;
  state.quoteRequest = freshRequest();
  return true;
}

export function quoteRequestBusy() {
  return !!state.quoteRequest && BUSY_PHASES.indexOf(state.quoteRequest.phase) !== -1;
}

function freshRequest() {
  return {
    phase: "editing",
    draft: { propertyIds: [], addresses: [], risks: [], notes: "", pendingAddress: "" },
    errors: {},
    message: "",
    addressCheck: "",
    formId: null,
  };
}

export function quoteRequestSchema(type) {
  var attributes = typeAttributes(type);
  var addresses = attributes.PROPERTY_ADDRESSES || {};
  var risks = attributes.RISK_FACTORS || {};
  var notes = attributes.ADDITIONAL_NOTES || {};
  var rows = /(?:^|\s)rows:(\d+)/.exec(text(notes.inputFormat));
  return {
    within: withinBox(addresses.inputFormat),
    riskLabel: localizedName(risks.nls),
    risks: (Array.isArray(risks.options) ? risks.options : []).map(function (option) {
      var value = text(option && option.value);
      return value ? { value: value, label: localizedName(option.nls) || value } : null;
    }).filter(Boolean),
    notesLabel: localizedName(notes.nls),
    notesRows: rows ? Math.min(Number(rows[1]), 12) : 5,
  };
}

export function withinBox(inputFormat) {
  var match = /(?:^|\s)within:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:\s|;|$)/.exec(text(inputFormat));
  if (!match) return null;
  var box = { south: Number(match[1]), west: Number(match[2]), north: Number(match[3]), east: Number(match[4]) };
  return box.south < box.north && box.west < box.east && Math.abs(box.south) <= 90 && Math.abs(box.north) <= 90 ? box : null;
}

export function insideBox(box, point) {
  return !box || !point || (point.lat >= box.south && point.lat <= box.north && point.lon >= box.west && point.lon <= box.east);
}

export function loadQuoteRequestSchema(options) {
  var settings = options || {};
  var current = state.quoteRequestSchema;
  if (current && current.state !== "error") return Promise.resolve(current);
  var forms = settings.forms || createCoreProfileFormAdapter();
  var loading = { state: "loading", schema: null };
  state.quoteRequestSchema = loading;
  return Promise.resolve()
    .then(function () { return forms.type(QUOTE_REQUEST_FORM, { config: state.config, state: state }); })
    .then(function (type) {
      if (state.quoteRequestSchema !== loading) return state.quoteRequestSchema;
      state.quoteRequestSchema = { state: "ready", schema: quoteRequestSchema(type) };
      return state.quoteRequestSchema;
    }, function (error) {
      if (state.quoteRequestSchema !== loading) return state.quoteRequestSchema;
      if (error && error.code === "session-expired") state.account = "session-expired";
      state.quoteRequestSchema = { state: "error", schema: null };
      return state.quoteRequestSchema;
    })
    .then(function (result) {
      if (settings.onChange) settings.onChange();
      return result;
    });
}

export function toggleQuoteProperty(backendId) {
  var request = quoteRequestState();
  var id = positiveInteger(backendId);
  if (!id || quoteRequestBusy() || !liveProperties().some(function (property) { return property.backendId === id; })) return false;
  var chosen = request.draft.propertyIds;
  request.draft.propertyIds = chosen.indexOf(id) === -1 ? chosen.concat([id]) : chosen.filter(function (other) { return other !== id; });
  delete request.errors.PROPERTY_IDS;
  return true;
}

export function changeQuoteRequestDraft(key, value) {
  var request = quoteRequestState();
  if (quoteRequestBusy()) return false;
  if (key === "notes" || key === "pendingAddress") request.draft[key] = String(value == null ? "" : value);
  else if (key === "risk") {
    var risks = request.draft.risks;
    request.draft.risks = risks.indexOf(value) === -1 ? risks.concat([value]) : risks.filter(function (risk) { return risk !== value; });
  } else return false;
  return true;
}

export function removeQuoteAddress(index) {
  var request = quoteRequestState();
  var position = Number(index);
  if (quoteRequestBusy() || !Number.isInteger(position) || position < 0 || position >= request.draft.addresses.length) return false;
  request.draft.addresses = request.draft.addresses.filter(function (_, at) { return at !== position; });
  delete request.errors.PROPERTY_ADDRESSES;
  return true;
}

export function acceptQuoteAddress(address, point) {
  var request = quoteRequestState();
  var value = text(address).replace(/\s+/g, " ");
  if (!value) return false;
  var schema = state.quoteRequestSchema && state.quoteRequestSchema.schema;
  if (!insideBox(schema && schema.within, point)) {
    request.errors.PROPERTY_ADDRESSES = QUOTE_REQUEST_COPY.addressOutside;
    return false;
  }
  var known = request.draft.addresses.some(function (entry) { return entry.address.toLowerCase() === value.toLowerCase(); });
  if (!known && request.draft.addresses.length >= QUOTE_REQUEST_LIMIT) {
    request.errors.PROPERTY_ADDRESSES = QUOTE_REQUEST_COPY.tooManyAddresses;
    return false;
  }
  if (!known) request.draft.addresses = request.draft.addresses.concat([{ address: value, point: point || null }]);
  request.draft.pendingAddress = "";
  delete request.errors.PROPERTY_ADDRESSES;
  delete request.errors.PROPERTY_IDS;
  return true;
}

export function addTypedQuoteAddress(options) {
  var settings = options || {};
  var request = quoteRequestState();
  var typed = text(request.draft.pendingAddress);
  if (!typed) return Promise.resolve(true);
  if (quoteRequestBusy() || request.addressCheck) return Promise.resolve(false);
  var maps = settings.finder || addressFinder();
  if (!maps) return Promise.resolve(acceptQuoteAddress(typed, null));
  request.addressCheck = "checking";
  if (settings.onChange) settings.onChange();
  return Promise.resolve()
    .then(function () { return maps.load(); })
    .then(function () { return maps.geocode(typed); })
    .then(function (point) { return { point: point, missed: false }; }, function (error) {
      return { point: null, missed: !!error && error.status === "ZERO_RESULTS" };
    })
    .then(function (found) {
      request.addressCheck = "";
      if (text(request.draft.pendingAddress) !== typed) return false;
      if (found.missed) {
        request.errors.PROPERTY_ADDRESSES = QUOTE_REQUEST_COPY.addressUnknown;
        return false;
      }
      return acceptQuoteAddress(typed, found.point);
    })
    .then(function (added) {
      if (settings.onChange) settings.onChange();
      return added;
    });
}

export function addressFinder() {
  if (!state.config.mapsApiKey) return null;
  if (!finder) finder = createGoogleMapsAdapter({ apiKey: state.config.mapsApiKey });
  return finder;
}

export function validateQuoteRequest(draft) {
  var errors = {};
  if (!draft.propertyIds.length && !draft.addresses.length) errors.PROPERTY_IDS = QUOTE_REQUEST_COPY.nothingChosen;
  if (draft.propertyIds.length > QUOTE_REQUEST_LIMIT) errors.PROPERTY_IDS = QUOTE_REQUEST_COPY.tooManyProperties;
  if (draft.addresses.length > QUOTE_REQUEST_LIMIT) errors.PROPERTY_ADDRESSES = QUOTE_REQUEST_COPY.tooManyAddresses;
  return errors;
}

export function quoteRequestValues(draft) {
  var values = {};
  var located = draft.addresses.filter(function (entry) { return !!entry.point; });
  var notes = text(draft.notes);
  if (draft.propertyIds.length) values.PROPERTY_IDS = draft.propertyIds.map(String);
  if (draft.addresses.length) values.PROPERTY_ADDRESSES = draft.addresses.map(function (entry) { return entry.address; });
  if (located.length) {
    values.PROPERTY_COORDINATES = JSON.stringify(located.map(function (entry) {
      return { address: entry.address, lat: entry.point.lat, lng: entry.point.lon };
    }));
  }
  if (draft.risks.length) values.RISK_FACTORS = draft.risks.slice();
  if (notes) values.ADDITIONAL_NOTES = notes;
  return values;
}

export function submitQuoteRequest(options) {
  var request = quoteRequestState();
  var changed = options.onChange || function () {};
  if (quoteRequestBusy()) return Promise.resolve(false);
  var errors = validateQuoteRequest(request.draft);
  if (Object.keys(errors).length) {
    request.errors = errors;
    request.message = "";
    changed("invalid");
    return Promise.resolve(false);
  }
  var forms = options.forms || outcomeForms(options);
  var context = { config: state.config, state: state };
  request.phase = "sending";
  request.errors = {};
  request.message = "";
  changed("sending");
  return Promise.resolve()
    .then(function () { return forms.submit(QUOTE_REQUEST_FORM, quoteRequestValues(request.draft), context); })
    .then(function (formId) {
      if (state.quoteRequest !== request) return false;
      request.formId = formId;
      request.phase = "waiting";
      changed("waiting");
      return awaitOutcome(request, forms, context, options);
    }, function (error) {
      if (state.quoteRequest !== request) return false;
      if (error && error.code === "session-expired") return sessionEnded(request, changed);
      request.phase = "editing";
      request.message = QUOTE_REQUEST_COPY.notSent;
      changed("not-sent");
      return false;
    });
}

export function checkQuoteRequestAgain(options) {
  var request = state.quoteRequest;
  if (!request || request.phase !== "slow" || !request.formId) return Promise.resolve(false);
  var forms = options.forms || outcomeForms(options);
  request.phase = "checking";
  (options.onChange || function () {})("checking");
  return awaitOutcome(request, forms, { config: state.config, state: state }, options);
}

function outcomeForms(options) {
  return createCoreProfileFormAdapter({ timeoutMs: QUOTE_REQUEST_OUTCOME_TIMEOUT_MS, pollIntervalMs: QUOTE_REQUEST_POLL_MS, wait: options.wait, now: options.now });
}

function awaitOutcome(request, forms, context, options) {
  var changed = options.onChange || function () {};
  return Promise.resolve()
    .then(function () {
      return forms.report(QUOTE_REQUEST_FORM, request.formId, context, QUOTE_REQUEST_FINAL_OUTCOMES, function (reported) {
        if (reported.outcome !== "PROCESSING" || request.phase !== "waiting" || state.quoteRequest !== request) return;
        request.phase = "processing";
        changed("processing");
      });
    })
    .then(function (report) {
      if (state.quoteRequest !== request) return false;
      return settle(request, report, options);
    }, function (error) {
      if (state.quoteRequest !== request) return false;
      if (error && error.code === "session-expired") return sessionEnded(request, changed);
      request.phase = "slow";
      changed("slow");
      return false;
    });
}

function settle(request, report, options) {
  var changed = options.onChange || function () {};
  if (report.outcome === "ACCEPTED") {
    request.phase = "accepted";
    changed("accepted");
    if (options.reload) {
      ["proposals", "properties"].forEach(function (moduleId) {
        Promise.resolve().then(function () { return options.reload(moduleId); }).catch(function () { return null; });
      });
    }
    return true;
  }
  request.phase = "editing";
  var field = text(report.field);
  var message = text(report.message);
  if (report.outcome === "REFUSED" && message && QUOTE_REQUEST_FIELDS.indexOf(field) !== -1) request.errors = { [field]: message };
  else request.message = message || QUOTE_REQUEST_COPY.failed;
  changed(report.outcome === "REFUSED" ? "refused" : "failed");
  return false;
}

function sessionEnded(request, changed) {
  request.phase = request.formId ? "slow" : "editing";
  state.account = "session-expired";
  changed("session-expired");
  return false;
}

function typeAttributes(type) {
  var found = {};
  [type].concat(type && Array.isArray(type.parents) ? type.parents : []).forEach(function (owner) {
    (owner && Array.isArray(owner.attributes) ? owner.attributes : []).forEach(function (attribute) {
      var code = text(attribute && attribute.code);
      if (code && !found[code]) found[code] = attribute;
    });
  });
  return found;
}

function localizedName(nls) {
  if (!nls || typeof nls !== "object") return "";
  var bag = nls.en || nls[Object.keys(nls)[0]] || {};
  return text(bag && bag.NAME).replace(/\s+/g, " ");
}
