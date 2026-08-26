var DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
var MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

var SNOW_CODES = ["S", "SI", "BS", "BY", "WM", "SW"];
var FREEZING_CODES = ["ZR", "ZL", "ZY", "IP", "IC"];
var THUNDER_CODES = ["T"];
var STORM_TEMP_C = -5;
var STORM_SNOW_CM = 2;
var STORM_POP = 40;

export function frameDay(date, index) {
  return index === 0 ? "Today" : DAY_NAMES[date.getDay()];
}

export function frameDate(date) {
  return MONTH_NAMES[date.getMonth()] + " " + date.getDate();
}

export function periodKind(period) {
  var coded = String((period && period.weatherPrimaryCoded) || "");
  var precipitation = coded.split(":")[2] || "";
  if (FREEZING_CODES.indexOf(precipitation) !== -1) return "freezing";
  if (SNOW_CODES.indexOf(precipitation) !== -1) {
    var snow = num(period.snowCM);
    var feels = num(period.minFeelslikeC);
    var stormy = (Number.isFinite(snow) && snow >= STORM_SNOW_CM) || (Number.isFinite(feels) && feels <= STORM_TEMP_C);
    return stormy ? "storm" : "snow";
  }
  if (THUNDER_CODES.indexOf(precipitation) !== -1 && num(period.pop) >= STORM_POP) return "storm";
  return "clear";
}

export function periodTemp(period) {
  var value = num(period && period.maxTempC);
  if (!Number.isFinite(value)) return "—";
  return (value < 0 ? "−" : "") + Math.abs(Math.round(value)) + "°C";
}

export function periodStats(period) {
  return [
    { label: "Precipitation", value: statValue(period.pop, "%") },
    { label: "Wind", value: windValue(period) },
    { label: "Feels like", value: tempValue(period.minFeelslikeC) },
    { label: "Humidity", value: statValue(period.humidity, "%") },
  ];
}

export function periodNote(period) {
  var snow = num(period && period.snowCM);
  if (Number.isFinite(snow) && snow >= STORM_SNOW_CM) return "Snowfall " + round1(snow) + " cm forecast · trigger met";
  if (Number.isFinite(snow) && snow > 0) return "Snowfall " + round1(snow) + " cm forecast · below the 2 cm trigger";
  var kind = periodKind(period);
  if (kind === "freezing") return "Freezing precipitation · de-icing expected";
  if (kind === "storm") return "Storm risk " + statValue(period.pop, "%") + " · crews on standby";
  return "Below the service trigger";
}

export function buildTimeline(zonePeriods, zoneOrder) {
  var lead = zonePeriods[zoneOrder[0]];
  if (!Array.isArray(lead) || !lead.length) throw new Error("The lead zone returned no periods");

  return lead.map(function (period, index) {
    var date = periodDate(period);
    var zones = {};
    zoneOrder.forEach(function (zone) {
      var periods = zonePeriods[zone];
      var match = Array.isArray(periods) && periods[index];
      zones[zone] = periodKind(match || period);
    });
    return {
      day: frameDay(date, index),
      date: frameDate(date),
      kind: worstKind(zoneOrder.map(function (zone) { return zones[zone]; })),
      temp: periodTemp(period),
      label: String(period.weather || "").split(",")[0] || "Forecast",
      note: periodNote(period),
      stats: periodStats(period),
      zones: zones,
    };
  });
}

var SEVERITY = { clear: 0, snow: 1, freezing: 2, storm: 3 };

export function worstKind(kinds) {
  return kinds.reduce(function (running, kind) {
    return SEVERITY[kind] > SEVERITY[running] ? kind : running;
  }, "clear");
}

function periodDate(period) {
  var seconds = num(period && period.timestamp);
  if (Number.isFinite(seconds)) return new Date(seconds * 1000);
  return new Date(String(period && period.dateTimeISO));
}

function num(value) {
  if (value === null || value === undefined || value === "") return Number.NaN;
  return Number(value);
}

function round1(value) {
  return Math.round(value * 10) / 10;
}

function statValue(value, unit) {
  var number = num(value);
  return Number.isFinite(number) ? Math.round(number) + unit : "—";
}

function tempValue(value) {
  var number = num(value);
  if (!Number.isFinite(number)) return "—";
  return (number < 0 ? "−" : "") + Math.abs(Math.round(number)) + "°C";
}

function windValue(period) {
  var speed = num(period && period.windSpeedMaxKPH);
  if (!Number.isFinite(speed)) speed = num(period && period.windSpeedKPH);
  if (!Number.isFinite(speed)) return "—";
  var direction = period && (period.windDirMax || period.windDir);
  return Math.round(speed) + " km/h" + (direction ? " " + direction : "");
}
