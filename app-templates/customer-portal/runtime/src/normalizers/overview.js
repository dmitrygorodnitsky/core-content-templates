export var OVERVIEW_STATUS = {
  issue: {
    label: "Issue Opened",
    copy: "Your request is being reviewed. We’ll get back to you shortly.",
  },
  enroute: {
    label: "En Route",
    copy: "Our team is on the way to this property.",
  },
  scheduled: {
    label: "Scheduled",
    copy: "Service is scheduled for this property.",
  },
  monitoring: {
    label: "Active Monitoring",
    copy: "We’re monitoring conditions and will dispatch service when needed.",
  },
};

export var OPEN_TICKET_STATES = ["SUBMITTED", "IN_PROGRESS", "ESCALATED"];

export function propertyStatus(property) {
  var ticket = property && property.ticket;
  if (ticket && OPEN_TICKET_STATES.indexOf(ticket.state) !== -1) return "issue";
  var appointment = property && property.appointment;
  if (appointment && appointment.state === "IN_PROGRESS") return "enroute";
  if (appointment && appointment.state === "SCHEDULED") return "scheduled";
  return "monitoring";
}

export function propertyWeather(property, frame) {
  if (propertyStatus(property) === "issue") return "issue";
  return zoneWeather(property, frame);
}

export function zoneWeather(property, frame) {
  var zones = (frame && frame.zones) || null;
  var zone = property && property.zone;
  if (zones && zone && zones[zone]) return zones[zone];
  return (frame && frame.kind) || "clear";
}

export function clampFrameIndex(timeline, index) {
  var total = (timeline && timeline.length) || 0;
  if (!total) return 0;
  if (index < 0) return 0;
  if (index > total - 1) return total - 1;
  return index;
}

export function serviceDayCount(properties, dayIndex) {
  if (!properties || !Number.isFinite(dayIndex)) return 0;
  return properties.filter(function (property) {
    return property.appointment && property.appointment.dayIndex === dayIndex;
  }).length;
}

export function appointmentDay(appointment, timeline) {
  var frame = appointment && Number.isFinite(appointment.dayIndex) && timeline && timeline[appointment.dayIndex];
  return frame ? frame.day + " " + frame.date : "";
}

export function sectionAvailable(model, section) {
  return !!model && sourceOpened(model.sources, section);
}

export function sourceOpened(sources, section) {
  return !sources || sources[section] === "ready";
}

var PROPERTY_STATUS_SOURCES = ["appointments", "support", "contracts"];

export function propertyStatusKnown(sources) {
  return PROPERTY_STATUS_SOURCES.every(function (section) { return sourceOpened(sources, section); });
}

export function knownPropertyStatus(property, sources) {
  return propertyStatusKnown(sources) ? propertyStatus(property) : null;
}

export function invoiceBuckets(invoices) {
  var outstanding = (invoices && invoices.outstanding) || [];
  var paid = (invoices && invoices.paidThisMonth) || [];
  var overdue = outstanding.filter(function (invoice) { return invoice.state === "OVERDUE"; });
  var thisMonth = outstanding.filter(function (invoice) { return invoice.state === "DUE_THIS_MONTH"; });
  return {
    overdue: bucket(overdue),
    outstanding: bucket(outstanding),
    dueThisMonth: bucket(thisMonth),
    paidThisMonth: bucket(paid),
  };
}

function bucket(rows) {
  return {
    count: rows.length,
    amount: rows.reduce(function (running, invoice) { return running + (Number(invoice.amount) || 0); }, 0),
  };
}

export function money(amount) {
  return "$" + Number(amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
