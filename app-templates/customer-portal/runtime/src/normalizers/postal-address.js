var POSTAL_CODE = /^(?:[A-Z]\d[A-Z] ?\d[A-Z]\d|\d{5}(?:-\d{4})?)$/i;
var COUNTRY_CODE = /^[A-Z]{2}$/;
var REGION_CODE = /^[A-Z]{2,3}$/;
var NORTH_AMERICAN_PHONE = /^\+?1(\d{3})(\d{3})(\d{4})$/;
var PHONE_PUNCTUATION = /[\s().-]/g;

export function formatPostalAddress(address) {
  if (!address || typeof address !== "object") return "";
  return formatAddressParts({
    lines: [address.address1, address.address2],
    city: address.city,
    region: address.state && typeof address.state === "object" ? address.state.code : "",
    postalCode: address.postalCode,
    country: address.country && typeof address.country === "object" ? address.country.code || address.country.id : "",
  });
}

export function formatAddressLine(value) {
  return formatAddressParts({ lines: [value] });
}

export function formatAddressParts(parts) {
  var segments = [];
  var country = plain(parts.country);
  appendSegments(segments, parts.lines || []);
  var last = segments[segments.length - 1];
  if (last && COUNTRY_CODE.test(last) && segments.slice(0, -1).some(isPostalCode)) {
    country = country || last;
    segments.pop();
  }
  appendSegments(segments, [parts.city, parts.region]);
  var postal = plain(parts.postalCode) || segments.filter(isPostalCode).pop() || "";
  if (postal) {
    segments = segments.filter(function (segment) { return comparable(segment) !== comparable(postal); });
    if (segments.some(function (segment) { return comparable(segment).indexOf(comparable(postal)) !== -1; })) postal = "";
  }
  if (country) {
    segments = segments.filter(function (segment) { return comparable(segment) !== comparable(country); });
  }
  last = segments[segments.length - 1];
  if (postal && last && REGION_CODE.test(last)) {
    segments[segments.length - 1] = last + " " + postal;
    postal = "";
  }
  if (postal) segments.push(postal);
  if (country) segments.push(countryName(country));
  return segments.join(", ");
}

export function addressRepeats(title, address) {
  var street = comparable(plain(address).split(",")[0]);
  return !!street && comparable(title).indexOf(street) !== -1;
}

export function formatPhone(value) {
  var stored = plain(value);
  var match = NORTH_AMERICAN_PHONE.exec(stored.replace(PHONE_PUNCTUATION, ""));
  return match ? "+1 " + match[1] + "-" + match[2] + "-" + match[3] : stored;
}

export function countryName(code) {
  var value = plain(code);
  if (!COUNTRY_CODE.test(value)) return value;
  try {
    var name = new Intl.DisplayNames(["en"], { type: "region" }).of(value);
    return name || value;
  } catch (_) {
    return value;
  }
}

function appendSegments(segments, values) {
  values.forEach(function (value) {
    plain(value).split(",").forEach(function (piece) {
      var segment = piece.replace(/\s+/g, " ").trim();
      if (segment && !segments.some(function (known) { return comparable(known) === comparable(segment); })) segments.push(segment);
    });
  });
}

function isPostalCode(segment) {
  return POSTAL_CODE.test(segment);
}

function comparable(value) {
  return plain(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function plain(value) {
  if (typeof value === "string") return value.trim();
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
}
