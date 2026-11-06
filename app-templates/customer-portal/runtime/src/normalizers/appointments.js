export var APPOINTMENT_STATE = {
  COMPLETED: { label: "Completed", tone: "ok" },
  IN_PROGRESS: { label: "In progress", tone: "progress" },
  EN_ROUTE: { label: "En route", tone: "warn" },
  SCHEDULED: { label: "Scheduled", tone: "info" },
  CANCELLED: { label: "Cancelled", tone: "scheduled" },
};

var STATE_ORDER = ["IN_PROGRESS", "EN_ROUTE", "SCHEDULED", "COMPLETED", "CANCELLED"];

export function appointmentRows(properties, timeline) {
  var rows = [];
  (properties || []).forEach(function (property) {
    var appointment = property.appointment;
    if (!appointment) return;
    var frame = timeline && timeline[appointment.dayIndex];
    rows.push({
      id: property.id,
      resource: appointment.resource || "Unassigned",
      name: property.name,
      address: property.address,
      service: appointment.service,
      state: appointment.state,
      dayIndex: appointment.dayIndex,
      day: frame ? frame.day + " " + frame.date : "",
      est: window_(appointment.est),
      actual: window_(appointment.actual),
      minutes: minutesOf(appointment.est),
    });
  });
  return rows;
}

export function stateMeta(state) {
  return APPOINTMENT_STATE[state] || { label: state || "Unknown", tone: "scheduled" };
}

export function resourceNames(rows) {
  var seen = {};
  var names = [];
  rows.forEach(function (row) {
    if (seen[row.resource]) return;
    seen[row.resource] = true;
    names.push(row.resource);
  });
  return names.sort(function (a, b) { return a.localeCompare(b); });
}

export function filterRows(rows, dayIndex) {
  if (dayIndex === null || dayIndex === undefined || dayIndex === "") return rows.slice();
  var wanted = Number(dayIndex);
  return rows.filter(function (row) { return row.dayIndex === wanted; });
}

export function sortRows(rows, direction) {
  var factor = direction === "desc" ? -1 : 1;
  return rows.slice().sort(function (a, b) {
    var byResource = a.resource.localeCompare(b.resource) * factor;
    if (byResource) return byResource;
    if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex;
    if (a.minutes !== b.minutes) return a.minutes - b.minutes;
    return a.name.localeCompare(b.name);
  });
}

export function stateRank(state) {
  var index = STATE_ORDER.indexOf(state);
  return index === -1 ? STATE_ORDER.length : index;
}

function window_(range) {
  if (!range || !range.start) return "";
  return range.end ? range.start + " – " + range.end : range.start + " – …";
}

export function minutesOf(range) {
  if (!range || !range.start) return Number.MAX_SAFE_INTEGER;
  return clockMinutes(range.start);
}

export function clockMinutes(clock) {
  var match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(clock).trim());
  if (!match) return Number.MAX_SAFE_INTEGER;
  var hour = Number(match[1]) % 12;
  if (/PM/i.test(match[3])) hour += 12;
  return hour * 60 + Number(match[2]);
}
