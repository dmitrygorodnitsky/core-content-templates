export function spaVisitModeLabel(mode, labels) {
  var value = String(mode || "").trim();
  var normalized = value.toUpperCase();
  var configured = labels && (labels[value] || labels[value.toLowerCase()] || labels[normalized]);
  if (configured) return configured;
  if (normalized === "STUDIO" || normalized === "SALON") return "At Calm Harbor";
  if (normalized === "HOME" || normalized === "MOBILE") return "At your place";
  return "Visit location pending";
}

export function spaVisitModeClass(mode) {
  var normalized = String(mode || "").trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
  return normalized || "pending";
}
