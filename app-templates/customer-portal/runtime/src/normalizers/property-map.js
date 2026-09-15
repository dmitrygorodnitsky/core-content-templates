import { sourceOpened } from "./overview.js";
import { WEATHER_LEGEND } from "./weather.js";

var POPUP_WIDTH = 288;
var POPUP_HEIGHT = 250;
var PIN_HEIGHT = 36;
var PIN_HALF_WIDTH = 18;
var GAP = 10;
var EDGE = 8;
var LOWER_PART = 0.55;
var FORECAST_DECIMALS = 2;

export function geoPoint(lat, lon) {
  var latitude = coordinate(lat, 90);
  var longitude = coordinate(lon, 180);
  if (latitude === null || longitude === null) return null;
  if (latitude === 0 && longitude === 0) return null;
  return { lat: latitude, lon: longitude };
}

export function propertyPoint(property) {
  return property ? geoPoint(property.lat, property.lon) : null;
}

export function addressKey(address) {
  if (typeof address !== "string") return "";
  return address.normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .replace(/^[\s,]+|[\s,]+$/g, "");
}

export function forecastPoint(point) {
  var factor = Math.pow(10, FORECAST_DECIMALS);
  return { lat: Math.round(point.lat * factor) / factor, lon: Math.round(point.lon * factor) / factor };
}

export function weatherLabel(kind, legend) {
  var items = legend && legend.length ? legend : WEATHER_LEGEND;
  var match = items.find(function (item) { return item.key === kind; });
  return match ? match.label : "";
}

export function popupWeather(frame, zoneKind, source, entry, index, sources) {
  var day = frame.day + " " + frame.date;
  if (entry && entry.state === "loading") return { state: "loading", day: day, source: "xweather" };
  var own = entry && entry.state === "ready" && Array.isArray(entry.days) ? entry.days[index] : null;
  if (own) {
    var note = sourceOpened(sources, "contracts") ? own.note : own.forecastNote || "";
    return { state: "property", day: day, kind: own.kind, temp: own.temp, phrase: own.phrase, note: note, source: "xweather" };
  }
  return {
    state: entry && entry.state === "failed" ? "failed" : "area",
    day: day,
    kind: zoneKind,
    temp: frame.temp,
    phrase: "",
    note: "",
    source: source === "xweather" ? "xweather" : "sample",
  };
}

export function popupDocks(frameWidth) {
  return frameWidth > 0 && frameWidth < 2 * (POPUP_WIDTH + PIN_HALF_WIDTH + GAP + EDGE);
}

export function popupPlacement(anchor, frame, size) {
  var width = size && size.width > 0 ? size.width : POPUP_WIDTH;
  var height = size && size.height > 0 ? size.height : POPUP_HEIGHT;
  var room = {
    below: frame.height - EDGE - anchor.y - GAP,
    above: anchor.y - PIN_HEIGHT - GAP - EDGE,
    right: frame.width - EDGE - anchor.x - PIN_HALF_WIDTH - GAP,
    left: anchor.x - PIN_HALF_WIDTH - GAP - EDGE,
  };
  var preferred = anchor.y > frame.height * LOWER_PART ? "above" : "below";
  var other = preferred === "above" ? "below" : "above";
  var side = height <= room[preferred] ? preferred
    : height <= room[other] ? other
    : width <= Math.max(room.right, room.left) ? (room.right >= room.left ? "right" : "left")
    : preferred;
  var top = side === "above" ? anchor.y - PIN_HEIGHT - GAP - height
    : side === "below" ? anchor.y + GAP
    : anchor.y - PIN_HEIGHT / 2 - height / 2;
  var left = side === "right" ? anchor.x + PIN_HALF_WIDTH + GAP
    : side === "left" ? anchor.x - PIN_HALF_WIDTH - GAP - width
    : anchor.x - width / 2;
  return {
    side: side,
    left: clamp(left, EDGE, frame.width - width - EDGE),
    top: clamp(top, EDGE, frame.height - height - EDGE),
  };
}

function coordinate(value, limit) {
  var number = typeof value === "number" ? value
    : typeof value === "string" && value.trim() !== "" ? Number(value)
    : Number.NaN;
  return Number.isFinite(number) && Math.abs(number) <= limit ? number : null;
}

function clamp(value, low, high) {
  if (high < low) return low;
  return Math.min(Math.max(value, low), high);
}
