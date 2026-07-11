export const HEALTH_CONTROL_SET = Object.freeze([
  "rbac",
  "consent",
  "audit",
  "secureViewerOrDownload",
  "leastData",
]);

export const HEALTH_SENSITIVE_IDS = Object.freeze([
  "care.live",
  "care.contactProvider",
  "care.openSecureDoc",
  "care.health.order.open",
  "care.health.order.reschedule",
  "care.health.support.call",
]);

export const CARE_SURFACE_CLOSED_IDS = Object.freeze([
  "care.hvac.booking.open",
  "care.lawn.service.requestExtra",
  "care.pool.service.requestExtra",
  "care.health.order.open",
  "care.health.order.reschedule",
  "care.health.support.call",
  "care.beauty.order.reschedule",
  "care.beauty.booking.open",
]);

export function markCareControlUnavailable(control, reason) {
  control.setAttribute("disabled", "");
  control.setAttribute("aria-disabled", "true");
  control.setAttribute("data-state", "unavailable");
  control.setAttribute("title", reason);
  return control;
}
