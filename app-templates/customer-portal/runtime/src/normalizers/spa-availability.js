const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const BUSY_STATES = new Set(["REQUESTED", "SCHEDULED", "IN_PROGRESS"]);

export function normalizeCoreAvailability(providerRows, appointmentRows, options = {}) {
  var locations = new Map((Array.isArray(options.locationRows) ? options.locationRows : [])
    .map(normalizeLocation)
    .filter(Boolean)
    .map(function (location) { return [location.id, location]; }));
  var providers = (Array.isArray(providerRows) ? providerRows : [])
    .map(function (row) { return normalizeProvider(row, locations); })
    .filter(function (provider) { return provider.bookingEnabled; })
    .sort(function (left, right) { return left.ref.localeCompare(right.ref); });
  var busy = (Array.isArray(appointmentRows) ? appointmentRows : [])
    .map(normalizeBusyAppointment)
    .filter(Boolean);
  return {
    // An authoritative empty Resource result means that online booking is not
    // configured. It is not the same fact as a configured provider having no
    // open slots inside the current horizon.
    state: providers.length ? "ready" : "unavailable",
    now: finiteNumber(options.now, Date.now()),
    horizonDays: boundedInteger(options.horizonDays, 14, 1, 60),
    maxVisibleDays: boundedInteger(options.maxVisibleDays, 7, 1, 31),
    providers: providers,
    busy: busy,
  };
}

export function deriveCoreBookingModel(source, services, options = {}) {
  var empty = emptyBookingModel(source && source.state || "empty");
  if (!source || source.state !== "ready") return empty;

  var catalog = (Array.isArray(services) ? services : []).filter(function (service) {
    return positiveInteger(service && service.backendProductId)
      && positiveInteger(service && service.durationMinutes);
  });
  var providerByServiceId = new Map();
  source.providers.forEach(function (provider) {
    provider.serviceProductIds.forEach(function (serviceId) {
      var list = providerByServiceId.get(serviceId) || [];
      list.push(provider);
      providerByServiceId.set(serviceId, list);
    });
  });
  var eligible = catalog.filter(function (service) {
    return providerByServiceId.has(positiveInteger(service.backendProductId));
  });
  // A catalog without a matching provider/service relationship cannot be
  // booked. Keep this distinct from a valid schedule that currently yields no
  // candidate slots.
  if (!eligible.length) return emptyBookingModel("unavailable");

  var selected = eligible.find(function (service) { return service.code === options.serviceCode; }) || eligible[0];
  var providers = (providerByServiceId.get(positiveInteger(selected.backendProductId)) || []).filter(function (provider) {
    return !options.specialistRef || provider.ref === options.specialistRef;
  });
  var days = deriveDays(source, providers, selected);
  var specialists = {};
  source.providers.forEach(function (provider) {
    specialists[provider.ref] = {
      ref: provider.ref,
      name: provider.name,
      role: "Service provider",
    };
  });
  var eligibleSpecialists = {};
  eligible.forEach(function (service) {
    eligibleSpecialists[service.code] = (providerByServiceId.get(positiveInteger(service.backendProductId)) || [])
      .map(function (provider) { return provider.ref; });
  });
  var serviceForTitle = {};
  var displayTotals = {};
  eligible.forEach(function (service) {
    serviceForTitle[service.name] = service.code;
    displayTotals[service.code] = service.displayPrice || "";
  });
  return {
    state: days.length ? "ready" : "empty",
    ref: "core-booking-v1",
    version: "core-resource-availability-v1",
    paymentMode: "SIMULATED",
    eligibleServices: eligible.map(function (service) { return service.code; }),
    eligibleSpecialists: eligibleSpecialists,
    specialists: specialists,
    serviceForTitle: serviceForTitle,
    displayTotals: displayTotals,
    days: days,
    hold: { ref: "", untilLabel: "", note: "" },
    reviewLocation: days[0] && days[0].slots[0] ? days[0].slots[0].locationName : "",
    policy: "I understand this demo has no temporary slot hold.",
    policyNote: "Your request is recorded in Core and the studio confirms it; another customer could select the same time before confirmation.",
    creditNotes: {
      ok: "Plan-credit validation is not available in the current booking API.",
      unavailable: "Plan-credit validation is not available in the current booking API.",
      exhausted: "Plan-credit validation is not available in the current booking API.",
      changed: "Plan-credit validation is not available in the current booking API.",
    },
  };
}

function normalizeProvider(row, locations) {
  var id = positiveInteger(row && row.id);
  if (!id) throw availabilityError("availability-invalid-provider", "Bookable Resource has no id");
  var values = ownTypeAttributes(row);
  var timezone = requiredText(attributeValue(values, "AVAILABILITY_TIMEZONE"), "AVAILABILITY_TIMEZONE");
  assertTimezone(timezone);
  var weekly = parseWeeklyAvailability(attributeValue(values, "WEEKLY_AVAILABILITY"));
  var serviceProductIds = integerList(attributeValue(values, "SERVICE_PRODUCTS"));
  if (!serviceProductIds.length) throw availabilityError("availability-invalid-provider", "Bookable Resource has no SERVICE_PRODUCTS");
  var specialistAccountId = positiveInteger(attributeValue(values, "SPECIALIST_ACCOUNT"));
  var locationResourceId = positiveInteger(attributeValue(values, "LOCATION_RESOURCE"));
  if (!specialistAccountId || !locationResourceId) {
    throw availabilityError("availability-invalid-provider", "Bookable Resource is missing its specialist or location reference");
  }
  var location = locations.get(locationResourceId) || null;
  return {
    ref: opaqueRef("spc-core", row.code || id),
    backendResourceId: id,
    code: text(row.code),
    name: localizedName(row.nls) || "Service provider",
    // The provider projection currently carries the location Resource id, but
    // not that Resource's localized name. Keep the customer copy generic until
    // Core returns the real location instead of inventing a studio name.
    locationName: location && location.name || localizedName(row.locationNls) || "Service location",
    locationCode: location && location.code || "",
    locationResourceId: locationResourceId,
    specialistAccountId: specialistAccountId,
    serviceProductIds: serviceProductIds,
    timezone: timezone,
    weeklyAvailability: weekly,
    slotIntervalMinutes: requiredPositiveInteger(attributeValue(values, "SLOT_INTERVAL_MINUTES"), "SLOT_INTERVAL_MINUTES"),
    bufferMinutes: requiredNonNegativeInteger(attributeValue(values, "BUFFER_MINUTES"), "BUFFER_MINUTES"),
    bookingEnabled: booleanValue(attributeValue(values, "BOOKING_ENABLED")),
  };
}

function normalizeLocation(row) {
  var id = positiveInteger(row && row.id);
  var code = text(row && row.code);
  var name = localizedName(row && row.nls);
  return id && code && name ? { id: id, code: code, name: name } : null;
}

function normalizeBusyAppointment(row) {
  var states = Array.isArray(row && row.states)
    ? row.states.map(function (state) { return text(state && state.code); }).filter(Boolean)
    : [];
  if (!states.some(function (state) { return BUSY_STATES.has(state); })) return null;
  var values = ownTypeAttributes(row);
  var resourceIds = integerList(attributeValue(values, "RESOURCES"));
  var start = Date.parse(row && row.start);
  var end = Date.parse(row && row.end);
  if (!resourceIds.length || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return { resourceIds: resourceIds, start: start, end: end, states: states };
}

function deriveDays(source, providers, service) {
  var byDay = new Map();
  providers.forEach(function (provider) {
    var today = datePartsInZone(new Date(source.now), provider.timezone);
    for (var offset = 0; offset < source.horizonDays; offset += 1) {
      var date = addCalendarDays(today, offset);
      var weekday = DAY_NAMES[new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay()];
      var windows = provider.weeklyAvailability[weekday] || [];
      windows.forEach(function (window) {
        var windowStart = zonedEpoch(date, window[0], provider.timezone);
        var windowEnd = zonedEpoch(date, window[1], provider.timezone);
        for (var start = windowStart; start + service.durationMinutes * 60000 <= windowEnd; start += provider.slotIntervalMinutes * 60000) {
          if (start < source.now) continue;
          var end = start + service.durationMinutes * 60000;
          if (conflicts(source.busy, provider, start, end)) continue;
          var key = "d-core-" + date.year + pad(date.month) + pad(date.day);
          var day = byDay.get(key) || {
            key: key,
            label: formatDay(start, provider.timezone),
            slots: [],
          };
          if (!day.slots.some(function (slot) { return slot.startIso === new Date(start).toISOString(); })) {
            day.slots.push({
              ref: opaqueRef("sl-core", provider.code + ":" + start),
              label: formatTime(start, provider.timezone),
              startIso: new Date(start).toISOString(),
              endIso: new Date(end).toISOString(),
              providerRef: provider.ref,
              resourceIds: [provider.backendResourceId, provider.locationResourceId],
              specialistAccountId: provider.specialistAccountId,
              locationName: provider.locationName,
              timezone: provider.timezone,
            });
          }
          byDay.set(key, day);
        }
      });
    }
  });
  return Array.from(byDay.values())
    .sort(function (left, right) { return left.key.localeCompare(right.key); })
    .slice(0, source.maxVisibleDays);
}

function conflicts(busy, provider, start, end) {
  var buffer = provider.bufferMinutes * 60000;
  return busy.some(function (appointment) {
    return appointment.resourceIds.includes(provider.backendResourceId)
      && start < appointment.end + buffer
      && end + buffer > appointment.start;
  });
}

function parseWeeklyAvailability(value) {
  var parsed;
  try { parsed = JSON.parse(requiredText(value, "WEEKLY_AVAILABILITY")); }
  catch (_) { throw availabilityError("availability-invalid-schedule", "WEEKLY_AVAILABILITY is not valid JSON"); }
  if (!parsed || parsed.schemaVersion !== 1) {
    throw availabilityError("availability-invalid-schedule", "WEEKLY_AVAILABILITY schemaVersion must be 1");
  }
  var result = {};
  DAY_NAMES.forEach(function (day) {
    var windows = parsed[day];
    if (!Array.isArray(windows)) throw availabilityError("availability-invalid-schedule", "WEEKLY_AVAILABILITY is missing " + day);
    result[day] = windows.map(function (window) {
      if (!Array.isArray(window) || window.length !== 2 || !validTime(window[0]) || !validTime(window[1]) || window[0] >= window[1]) {
        throw availabilityError("availability-invalid-schedule", "WEEKLY_AVAILABILITY has an invalid " + day + " interval");
      }
      return [window[0], window[1]];
    });
  });
  return result;
}

function ownTypeAttributes(row) {
  var typeId = row && row.type && row.type.id;
  return row && row.attributes && typeId != null ? row.attributes[String(typeId)] || {} : {};
}

function attributeValue(group, code) {
  var entry = group && group[code];
  return entry && Object.prototype.hasOwnProperty.call(entry, "value") ? entry.value : null;
}

function integerList(value) {
  return (Array.isArray(value) ? value : value == null ? [] : [value])
    .map(positiveInteger)
    .filter(Boolean);
}

function datePartsInZone(date, timezone) {
  var parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(date);
  return {
    year: Number(part(parts, "year")),
    month: Number(part(parts, "month")),
    day: Number(part(parts, "day")),
  };
}

function addCalendarDays(parts, offset) {
  var date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + offset));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

function zonedEpoch(date, clock, timezone) {
  var time = clock.split(":").map(Number);
  var desired = Date.UTC(date.year, date.month - 1, date.day, time[0], time[1]);
  var guess = desired;
  for (var index = 0; index < 3; index += 1) {
    var actual = zonedParts(new Date(guess), timezone);
    var actualUtc = Date.UTC(actual.year, actual.month - 1, actual.day, actual.hour, actual.minute);
    guess += desired - actualUtc;
  }
  return guess;
}

function zonedParts(date, timezone) {
  var parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).formatToParts(date);
  return {
    year: Number(part(parts, "year")), month: Number(part(parts, "month")), day: Number(part(parts, "day")),
    hour: Number(part(parts, "hour")), minute: Number(part(parts, "minute")),
  };
}

function emptyBookingModel(state) {
  return {
    state: state === "error" ? "error" : state === "loading" ? "loading" : state === "unavailable" ? "unavailable" : "empty",
    ref: "core-booking-v1",
    eligibleServices: [], eligibleSpecialists: {}, specialists: {}, serviceForTitle: {}, displayTotals: {}, days: [],
    hold: { ref: "", untilLabel: "", note: "" }, reviewLocation: "", policy: "", policyNote: "", creditNotes: {},
  };
}

function assertTimezone(value) {
  try { new Intl.DateTimeFormat("en-US", { timeZone: value }).format(new Date(0)); }
  catch (_) { throw availabilityError("availability-invalid-timezone", "AVAILABILITY_TIMEZONE is invalid"); }
}

function formatDay(epoch, timezone) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: timezone }).format(new Date(epoch));
}

function formatTime(epoch, timezone) {
  return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: timezone }).format(new Date(epoch));
}

function opaqueRef(prefix, value) {
  var hash = 2166136261;
  var input = String(value || prefix);
  for (var index = 0; index < input.length; index += 1) hash = Math.imul(hash ^ input.charCodeAt(index), 16777619);
  return prefix + "-" + (hash >>> 0).toString(36);
}

function localizedName(value) {
  if (!value || typeof value !== "object") return "";
  var localized = value.en || value["en-US"] || Object.values(value)[0] || {};
  return text(localized.NAME || localized.name);
}

function part(parts, type) { return (parts.find(function (item) { return item.type === type; }) || {}).value; }
function validTime(value) { return typeof value === "string" && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value); }
function pad(value) { return String(value).padStart(2, "0"); }
function text(value) { return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim(); }
function requiredText(value, code) { var result = text(value); if (!result) throw availabilityError("availability-invalid-provider", code + " is required"); return result; }
function positiveInteger(value) {
  var candidate = value && typeof value === "object" && !Array.isArray(value) ? value.id : value;
  var number = Number(candidate);
  return Number.isInteger(number) && number > 0 ? number : null;
}
function booleanValue(value) { return value === true || String(value || "").trim().toLowerCase() === "true"; }
function requiredPositiveInteger(value, code) { var number = positiveInteger(value); if (!number) throw availabilityError("availability-invalid-provider", code + " must be a positive integer"); return number; }
function requiredNonNegativeInteger(value, code) { var number = Number(value); if (!Number.isInteger(number) || number < 0) throw availabilityError("availability-invalid-provider", code + " must be a non-negative integer"); return number; }
function finiteNumber(value, fallback) { var number = Number(value); return Number.isFinite(number) ? number : fallback; }
function boundedInteger(value, fallback, min, max) { var number = Number(value); return Number.isInteger(number) && number >= min && number <= max ? number : fallback; }
function availabilityError(code, message) { var error = new Error(message); error.code = code; return error; }
