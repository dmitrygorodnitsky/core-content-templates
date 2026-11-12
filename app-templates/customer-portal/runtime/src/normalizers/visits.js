import { attributeEntry, attributeNumber, attributeText, latestStateCode, positiveInteger, text } from "./core-record.js";

export var VISIT_TYPE = "SNOW_SERVICE_VISIT";

export var VISIT_STATUS = Object.freeze({
  SCHEDULED: Object.freeze({ label: "Scheduled", tone: "info", phase: "upcoming" }),
  IN_PROGRESS: Object.freeze({ label: "In progress", tone: "progress", phase: "upcoming" }),
  COMPLETED: Object.freeze({ label: "Completed", tone: "ok", phase: "past" }),
  CANCELED: Object.freeze({ label: "Cancelled", tone: "scheduled", phase: "cancelled" }),
});

var PROGRESS_STEPS = Object.freeze({
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "Arrived",
  COMPLETED: "Departed",
});

var ON_SITE_STEPS = ["IN_PROGRESS", "COMPLETED"];
var CREW_SNAPSHOT = "CLIENT_VISIT_CREW";
var ACRONYM_LENGTH = 3;

var MEDIA_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
var WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function normalizeVisits(raw) {
  var rows = Array.isArray(raw && raw.items) ? raw.items : [];
  var visits = rows.map(visitRecord).filter(Boolean);
  return {
    state: "ready",
    truncated: !!(raw && raw.truncated),
    upcoming: visits.filter(inPhase("upcoming")).sort(function (left, right) { return left.start.ms - right.start.ms; }),
    past: visits.filter(inPhase("past")).sort(function (left, right) { return right.start.ms - left.start.ms; }),
    cancelled: visits.filter(inPhase("cancelled")).sort(function (left, right) { return right.start.ms - left.start.ms; }),
  };
}

export function visitCount(envelope) {
  return envelope ? (envelope.upcoming || []).length + (envelope.past || []).length + (envelope.cancelled || []).length : 0;
}

export function findVisit(envelope, id) {
  if (!envelope || !id) return null;
  return (envelope.upcoming || []).concat(envelope.past || [], envelope.cancelled || []).find(function (visit) { return visit.id === id; }) || null;
}

export function propertyWithVisits(property, envelope, today) {
  var found = visitsForProperty(envelope, property.backendId);
  var next = ((envelope && envelope.upcoming) || []).find(function (visit) { return visit.propertyBackendId === property.backendId && visit.stateCode === "IN_PROGRESS"; }) || found.next;
  var last = found.last;
  return Object.assign({}, property, {
    appointment: next ? { id: next.id, state: next.stateCode, onSite: next.stateCode === "IN_PROGRESS", service: next.stateCode === "IN_PROGRESS" ? "Visit in progress" : "Next visit", when: visitWhen(next, today) } : null,
    lastService: last ? { id: last.id, label: "Last visit", service: "Visit", when: visitDay(last, today) } : null,
  });
}

export function upcomingDays(today, count) {
  var parts = String(today || "").split("-").map(Number);
  var days = [];
  for (var offset = 0; offset < count; offset += 1) {
    var at = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + offset));
    days.push({
      key: at.getUTCFullYear() + "-" + pad(at.getUTCMonth() + 1) + "-" + pad(at.getUTCDate()),
      name: offset === 0 ? "Today" : WEEKDAYS[at.getUTCDay()],
      date: MONTHS[at.getUTCMonth()] + " " + at.getUTCDate(),
    });
  }
  return days;
}

export function visitDayCounts(envelope, days) {
  var visits = ((envelope && envelope.upcoming) || []).concat((envelope && envelope.past) || []);
  return days.map(function (day) {
    return visits.filter(function (visit) { return visit.start.date === day.key; }).length;
  });
}

export function visitsForProperty(envelope, propertyBackendId) {
  var owned = function (visit) { return visit.propertyBackendId === propertyBackendId; };
  return {
    next: ((envelope && envelope.upcoming) || []).find(owned) || null,
    last: ((envelope && envelope.past) || []).find(owned) || null,
  };
}

export function visitPlace(visit, properties) {
  var list = Array.isArray(properties) ? properties : [];
  if (list.length < 2 || !visit) return "";
  var property = list.find(function (item) { return item.backendId === visit.propertyBackendId; });
  return property ? property.address || property.name || "" : "";
}

export function visitDay(visit, today) {
  var start = visit && visit.start;
  if (!start) return "";
  if (today && start.date === today) return "Today";
  var label = WEEKDAYS[start.weekday] + ", " + MONTHS[start.month - 1] + " " + start.day;
  return today && today.slice(0, 4) !== String(start.year) ? label + ", " + start.year : label;
}

export function visitWindow(visit) {
  var start = visit && visit.start;
  if (!start) return "";
  var end = visit.end && visit.end.ms > start.ms ? visit.end : null;
  if (!end) return clock(start.minutes, true);
  var samePeriod = meridiem(start.minutes) === meridiem(end.minutes) && start.date === end.date;
  return clock(start.minutes, !samePeriod) + " – " + clock(end.minutes, true);
}

export function visitWhen(visit, today) {
  return [visitDay(visit, today), visitWindow(visit)].filter(Boolean).join(", ");
}

export function normalizeVisitProgress(rows) {
  return (Array.isArray(rows) ? rows : []).map(function (row) {
    var code = text(row && row.state && row.state.code);
    var ms = epochMs(row && row.observed);
    if (!Object.prototype.hasOwnProperty.call(PROGRESS_STEPS, code) || ms === null) return null;
    return { code: code, label: PROGRESS_STEPS[code], ms: ms };
  }).filter(Boolean).sort(function (left, right) { return left.ms - right.ms; });
}

export function progressWhen(step, visit, timeZone) {
  var at = zonedParts(step.ms, timeZone);
  var day = MONTHS[at.month - 1] + " " + at.day;
  var start = visit && visit.start;
  if (start && at.year !== start.year) day += ", " + at.year;
  if (step.code === "SCHEDULED") return day;
  var time = clock(at.minutes, true);
  return start && at.date === start.date ? time : day + ", " + time;
}

export function onSiteTimes(steps, visit, timeZone) {
  var duration = onSiteDuration(steps);
  return ON_SITE_STEPS.map(function (code) {
    var step = lastStep(steps, code);
    return step ? step.label + " " + progressWhen(step, visit, timeZone) : "";
  }).concat(duration ? duration + " on site" : "").filter(Boolean).join(" · ");
}

export function onSiteDuration(steps) {
  var arrived = lastStep(steps, "IN_PROGRESS");
  var departed = lastStep(steps, "COMPLETED");
  if (!arrived || !departed || departed.ms < arrived.ms) return "";
  var minutes = Math.round((departed.ms - arrived.ms) / 60000);
  if (minutes < 1) return "Under 1 min";
  var hours = Math.floor(minutes / 60);
  var rest = minutes % 60;
  if (!hours) return minutes + " min";
  return rest ? hours + " h " + rest + " min" : hours + " h";
}

export function visitPhotoCount(visit) {
  return visit ? (visit.before || []).length + (visit.after || []).length : 0;
}

export function localDateKey(date, timeZone) {
  return zonedParts((date instanceof Date ? date : new Date()).getTime(), timeZone).date;
}

export function visitImageUrl(coreBase, id) {
  return MEDIA_ID.test(id) ? String(coreBase || "/core").replace(/\/+$/, "") + "/image/" + id + "/get" : "";
}

function visitRecord(row) {
  var backendId = positiveInteger(row && row.id);
  var stateCode = latestStateCode(row);
  var status = Object.prototype.hasOwnProperty.call(VISIT_STATUS, stateCode) ? VISIT_STATUS[stateCode] : null;
  if (!backendId || !status || text(row.type && row.type.code) !== VISIT_TYPE) return null;
  var start = wallClock(row.start);
  if (!start) return null;
  return {
    id: "visit-core-" + backendId,
    backendId: backendId,
    stateCode: stateCode,
    status: { label: status.label, tone: status.tone },
    phase: status.phase,
    start: start,
    end: wallClock(row.end),
    propertyBackendId: attributeNumber(row, "RESOURCE"),
    completionNotes: attributeText(row, "COMPLETION_NOTES"),
    before: mediaIds(row, "PRE_SERVICE_MEDIA"),
    after: mediaIds(row, "POST_SERVICE_MEDIA"),
    crew: visitCrew(row.metadata && row.metadata[CREW_SNAPSHOT]),
  };
}

export function visitCrew(snapshot) {
  var source = snapshot;
  if (typeof source === "string") {
    try {
      source = JSON.parse(source);
    } catch (_) {
      return null;
    }
  }
  if (!source || typeof source !== "object") return null;
  var crew = {
    people: named(source.crew, "role"),
    vehicle: named([source.vehicle], "type")[0] || null,
    equipment: named(source.equipment, "type"),
  };
  return crew.people.length || crew.vehicle || crew.equipment.length ? crew : null;
}

export function crewLine(crew) {
  if (!crew) return "";
  var names = function (list) { return list.map(function (item) { return item.name; }).join(", "); };
  return [names(crew.people), crew.vehicle ? crew.vehicle.name : "", names(crew.equipment)].filter(Boolean).join(" · ");
}

export function titleCaseName(value) {
  return text(value).split(/\s+/).filter(Boolean).map(function (word) {
    return word.split("-").map(titleCasePart).join("-");
  }).join(" ");
}

function titleCasePart(part) {
  if (/\d/.test(part)) return part;
  var letters = part.replace(/[^\p{L}]/gu, "");
  if (!letters) return part;
  var shouting = letters === letters.toUpperCase() && letters !== letters.toLowerCase();
  if (shouting && letters.length <= ACRONYM_LENGTH) return part;
  var rest = shouting ? part.toLowerCase() : part;
  return rest.replace(/\p{L}/u, function (first) { return first.toUpperCase(); });
}

function named(list, kindKey) {
  return (Array.isArray(list) ? list : []).map(function (item) {
    var name = titleCaseName(item && item.name);
    return name ? { name: name, kind: text(item[kindKey]) } : null;
  }).filter(Boolean);
}

function zonedParts(ms, timeZone) {
  var at = new Date(ms);
  var parts = { year: at.getFullYear(), month: at.getMonth() + 1, day: at.getDate(), hour: at.getHours(), minute: at.getMinutes() };
  if (timeZone) {
    new Intl.DateTimeFormat("en-US", { timeZone: timeZone, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" }).formatToParts(at).forEach(function (part) {
      if (Object.prototype.hasOwnProperty.call(parts, part.type)) parts[part.type] = Number(part.value);
    });
  }
  return {
    date: parts.year + "-" + pad(parts.month) + "-" + pad(parts.day),
    year: parts.year,
    month: parts.month,
    day: parts.day,
    minutes: (parts.hour % 24) * 60 + parts.minute,
  };
}

function epochMs(value) {
  var ms = typeof value === "number" ? value : typeof value === "string" && value.trim() !== "" ? Number(value) : Number.NaN;
  return Number.isFinite(ms) ? ms : null;
}

function wallClock(value) {
  var ms = epochMs(value);
  if (ms === null) return null;
  var instant = new Date(ms);
  var year = instant.getUTCFullYear();
  var month = instant.getUTCMonth() + 1;
  var day = instant.getUTCDate();
  return {
    ms: ms,
    date: year + "-" + pad(month) + "-" + pad(day),
    year: year,
    month: month,
    day: day,
    weekday: instant.getUTCDay(),
    minutes: instant.getUTCHours() * 60 + instant.getUTCMinutes(),
  };
}

function mediaIds(row, code) {
  var entry = attributeEntry(row, code);
  var value = entry ? entry.value : null;
  if (typeof value === "string" && /^\s*\[/.test(value)) {
    try {
      value = JSON.parse(value);
    } catch (_) {
      return [];
    }
  }
  return (Array.isArray(value) ? value : []).map(function (item) {
    if (!item || typeof item !== "object") return "";
    if (item.type != null && text(item.type) !== "image") return "";
    var id = text(item.id).toLowerCase();
    return MEDIA_ID.test(id) ? id : "";
  }).filter(function (id, index, ids) { return !!id && ids.indexOf(id) === index; });
}

function lastStep(steps, code) {
  return (steps || []).filter(function (entry) { return entry.code === code; }).pop() || null;
}

function inPhase(phase) {
  return function (visit) { return visit.phase === phase; };
}

function clock(minutes, withMeridiem) {
  var hour = Math.floor(minutes / 60);
  var label = (hour % 12 || 12) + ":" + pad(minutes % 60);
  return withMeridiem ? label + " " + meridiem(minutes) : label;
}

function meridiem(minutes) {
  return minutes < 720 ? "AM" : "PM";
}

function pad(value) {
  return value < 10 ? "0" + value : String(value);
}
