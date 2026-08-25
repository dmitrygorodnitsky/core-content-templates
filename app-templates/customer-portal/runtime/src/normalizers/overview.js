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
