export function text(value) {
  return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
}

export function positiveInteger(value) {
  var number = typeof value === "number" ? value
    : typeof value === "string" && value.trim() !== "" ? Number(value)
    : Number.NaN;
  return Number.isInteger(number) && number > 0 ? number : null;
}

export function latestStateCode(row) {
  var states = Array.isArray(row && row.states) ? row.states : [];
  var last = states[states.length - 1];
  return text(last && last.code);
}

export function attributeEntry(row, code) {
  var buckets = row && row.attributes;
  if (!buckets || typeof buckets !== "object") return null;
  var keys = Object.keys(buckets);
  for (var index = 0; index < keys.length; index += 1) {
    var bucket = buckets[keys[index]];
    if (bucket && Object.prototype.hasOwnProperty.call(bucket, code)) return bucket[code];
  }
  return null;
}

export function attributeNumber(row, code) {
  var entry = attributeEntry(row, code);
  return entry ? positiveInteger(entry.value) : null;
}

export function attributeText(row, code) {
  var entry = attributeEntry(row, code);
  return entry && entry.value != null ? text(entry.value) : "";
}
