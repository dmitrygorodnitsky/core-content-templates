import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import path from "node:path";

const runtimeRoot = pathToFileURL(path.resolve("app-templates/customer-portal/runtime") + "/");
const { createXweatherAdapter } = await import(new URL("src/adapters/xweather-adapter.js", runtimeRoot));
const { buildTimeline, forecastDay, periodForecastNote, periodKind, periodNote, periodTemp, worstKind } = await import(new URL("src/normalizers/weather.js", runtimeRoot));

const ok = (periods) => ({ ok: true, json: async () => ({ success: true, response: [{ periods }] }) });

const period = (over = {}) => Object.assign({
  timestamp: Math.floor(Date.UTC(2026, 0, 15, 14) / 1000),
  maxTempC: -6,
  minFeelslikeC: -10,
  pop: 70,
  humidity: 80,
  snowCM: 0,
  windSpeedMaxKPH: 18,
  windDirMax: "NW",
  weather: "Cloudy",
  weatherPrimaryCoded: "::CL",
}, over);

assert.equal(createXweatherAdapter({ clientId: "", clientSecret: "b" }).opened(), false, "a half-configured key must stay closed");
assert.equal(createXweatherAdapter({ clientId: "a", clientSecret: "" }).opened(), false);
assert.equal(createXweatherAdapter({ clientId: "a", clientSecret: "b", fetch: async () => ok([period()]) }).opened(), true);

await assert.rejects(
  createXweatherAdapter({ clientId: "", clientSecret: "" }).dailyForecast(39, -105, 7),
  /not opened/,
  "a closed adapter must refuse rather than call out",
);

await assert.rejects(
  createXweatherAdapter({ clientId: "a", clientSecret: "b", fetch: async () => ({ ok: false, status: 401 }) }).dailyForecast(39, -105, 7),
  /HTTP 401/,
);

await assert.rejects(
  createXweatherAdapter({
    clientId: "a", clientSecret: "b",
    fetch: async () => ({ ok: true, json: async () => ({ success: false, error: { description: "The client provided is invalid." } }) }),
  }).dailyForecast(39, -105, 7),
  /client provided is invalid/,
  "Xweather answers a rejected key with HTTP 200 and success:false, so the body decides",
);

await assert.rejects(
  createXweatherAdapter({ clientId: "a", clientSecret: "b", fetch: async () => ok([]) }).dailyForecast(39, -105, 7),
  /no forecast periods/,
);

await assert.rejects(
  createXweatherAdapter({ clientId: "a", clientSecret: "b", fetch: async () => ok([period()]) }).dailyForecast(Number.NaN, -105, 7),
  /finite coordinate/,
);

let requested = "";
await createXweatherAdapter({
  clientId: "id one", clientSecret: "secret/two",
  fetch: async (url, init) => { requested = url; assert.equal(init.credentials, "omit", "a public key request must not carry cookies"); return ok([period()]); },
}).dailyForecast(39.72, -105.09, 7);
assert.match(requested, /^https:\/\/data\.api\.xweather\.com\//, "the forecast host is https and fixed");
assert.match(requested, /client_id=id%20one/, "credentials must be encoded, not concatenated raw");
assert.match(requested, /client_secret=secret%2Ftwo/);

globalThis.window = globalThis;
const { readPortalConfig } = await import(new URL("src/config.js", runtimeRoot));
const { liveWeatherOpened, loadLiveWeather } = await import(new URL("src/live-weather.js", runtimeRoot));
const { applyPortalConfig, liveForecastState } = await import(new URL("src/state.js", runtimeRoot));

{
  const geography = JSON.stringify({ map: { center: { lat: 49.23, lon: -122.98 }, zoom: 10 }, zones: { vancouver: { lat: 49.28, lon: -123.12 } } });
  const weatherConfig = (clientId, clientSecret) => readPortalConfig({ dataset: {
    portalVertical: "snow", portalProfile: "stormRetail", portalDataMode: "live", portalAuthMode: "required",
    portalServiceGeography: geography, portalWeatherClientId: clientId, portalWeatherClientSecret: clientSecret,
  } });
  const placeholder = weatherConfig("#", "#");
  assert.equal(placeholder.weatherClientId, "", "the # placeholder a CMS parameter ships with is not a credential");
  assert.equal(placeholder.weatherClientSecret, "");
  assert.equal(liveWeatherOpened(placeholder), false);
  let forecastCalls = 0;
  const spy = { opened: () => true, dailyForecast: async () => { forecastCalls += 1; return [period()]; } };
  assert.equal(await loadLiveWeather(null, placeholder, spy), null);
  assert.equal(forecastCalls, 0, "Xweather is never called with the placeholder");
  applyPortalConfig(placeholder);
  assert.equal(liveForecastState(), "unconfigured", "with the placeholder the forecast card says it is not set up");
  assert.equal(weatherConfig("${PORTAL_WEATHER_CLIENT_ID@STRING}", "${PORTAL_WEATHER_CLIENT_SECRET@STRING}").weatherClientId, "", "an unset CMS parameter renders as its own marker, which is not a credential");
  assert.equal(weatherConfig("id\" onload=\"x", "secret").weatherClientId, "", "a value that is not a plain token never reaches a request");
  const configured = weatherConfig(" zAbc123DEF ", "s3cret_Value-40");
  assert.equal(configured.weatherClientId, "zAbc123DEF");
  assert.equal(configured.weatherClientSecret, "s3cret_Value-40");
  assert.equal(liveWeatherOpened(configured), true);
}

assert.equal(periodKind(period({ weatherPrimaryCoded: "::CL" })), "clear");
assert.equal(periodKind(period({ weatherPrimaryCoded: "S::S", snowCM: 0.4, minFeelslikeC: 1 })), "snow");
assert.equal(periodKind(period({ weatherPrimaryCoded: "S::S", snowCM: 3.1, minFeelslikeC: 1 })), "storm", "past the 2 cm trigger a snow day is a storm day");
assert.equal(periodKind(period({ weatherPrimaryCoded: "::ZR" })), "freezing");
assert.equal(periodKind(period({ weatherPrimaryCoded: "S::T", pop: 43 })), "storm");
assert.equal(periodKind(period({ weatherPrimaryCoded: "S::T", pop: 19 })), "clear", "an isolated thunderstorm is not a service trigger");

assert.equal(periodTemp(period({ maxTempC: -6 })), "−6°C", "a negative temperature uses the typographic minus the design renders");
assert.equal(periodTemp(period({ maxTempC: 30 })), "30°C");
assert.equal(periodTemp(period({ maxTempC: null })), "—");

assert.equal(worstKind(["clear", "snow", "clear"]), "snow");
assert.equal(worstKind(["snow", "storm", "freezing"]), "storm");
assert.equal(worstKind(["clear", "clear"]), "clear");

const timeline = buildTimeline({
  north: [period({ weatherPrimaryCoded: "S::S", snowCM: 3.1 }), period({ weatherPrimaryCoded: "::CL" })],
  south: [period({ weatherPrimaryCoded: "::CL" }), period({ weatherPrimaryCoded: "::CL" })],
}, ["north", "south"]);

assert.equal(timeline.length, 2);
assert.equal(timeline[0].day, "Today", "the first frame is always today, whatever weekday it falls on");
assert.notEqual(timeline[1].day, "Today");
assert.equal(timeline[0].kind, "storm", "the headline kind is the worst zone, not the first one");
assert.deepEqual(timeline[0].zones, { north: "storm", south: "clear" });
assert.match(timeline[0].note, /3\.1 cm/, "the note must describe the same zone the headline kind came from");
assert.equal(timeline[1].kind, "clear");
assert.match(timeline[1].note, /Below the service trigger/);
assert.equal(timeline[0].stats.length, 4);
assert.deepEqual(timeline[0].stats.map((stat) => stat.label), ["Precipitation", "Wind", "Feels like", "Humidity"]);
assert.equal(timeline[0].stats[1].value, "18 km/h NW");
assert.equal(timeline[0].stats[2].value, "−10°C");
assert.match(timeline[0].note, /trigger met/);

const shortZone = buildTimeline({
  north: [period({ weatherPrimaryCoded: "::ZR" }), period({ weatherPrimaryCoded: "::ZR" })],
  south: [period({ weatherPrimaryCoded: "::CL" })],
}, ["north", "south"]);
assert.equal(shortZone[1].zones.south, "freezing", "a zone that returns fewer periods falls back to the lead zone, never to undefined");

await assert.rejects(async () => buildTimeline({ north: [] }, ["north"]), /no periods/);

const coldStorm = period({ weatherPrimaryCoded: "S::S", snowCM: 0, minFeelslikeC: -11 });
assert.equal(periodKind(coldStorm), "storm", "deep cold alone makes a snow day a storm day");
assert.match(periodNote(coldStorm), /refreeze risk/, "a note must explain the same reason the kind was raised for");
assert.match(periodNote(period({ weatherPrimaryCoded: "S::T", pop: 55, minFeelslikeC: 14 })), /Storm risk 55%/);
assert.match(periodNote(period({ weatherPrimaryCoded: "S::T", pop: 55, minFeelslikeC: -11 })), /refreeze risk/, "for a plough crew the cold outranks the thunder");
assert.match(periodNote(period({ weatherPrimaryCoded: "S::S", snowCM: 4, minFeelslikeC: 1 })), /4 cm forecast · trigger met/);
assert.match(periodNote(period({ weatherPrimaryCoded: "S::S", snowCM: 0.6, minFeelslikeC: 1 })), /below the 2 cm trigger/);
assert.match(periodNote(period({ weatherPrimaryCoded: "::ZR", snowCM: 9 })), /de-icing expected/, "freezing rain outranks an accumulation note");

const ownDay = forecastDay(period({ weatherPrimaryCoded: "S::S", snowCM: 0.6, minFeelslikeC: 1, maxTempC: -3, weather: "Light Snow, Cloudy" }));
assert.deepEqual(ownDay, { kind: "snow", temp: "−3°C", phrase: "Light Snow", note: "Snowfall 0.6 cm forecast · below the 2 cm trigger", forecastNote: "Snowfall 0.6 cm forecast" });

assert.equal(timeline[0].forecastNote, "Snowfall 3.1 cm forecast", "a frame keeps what the forecast says apart from the contract reading");
assert.equal(timeline[1].forecastNote, "", "a clear day has nothing to forecast once the service trigger is taken out");
assert.equal(periodForecastNote(period({ weatherPrimaryCoded: "::ZR", snowCM: 9 })), "Freezing precipitation");
assert.equal(periodForecastNote(period({ weatherPrimaryCoded: "S::T", pop: 55, minFeelslikeC: 14 })), "Storm risk 55%");
assert.equal(periodForecastNote(coldStorm), "Feels like −11°C · refreeze risk overnight");
for (const sample of [period({ weatherPrimaryCoded: "S::S", snowCM: 4 }), period({ weatherPrimaryCoded: "S::S", snowCM: 0.6, minFeelslikeC: 1 }), period({ weatherPrimaryCoded: "::ZR" }), period({ weatherPrimaryCoded: "S::T", pop: 55, minFeelslikeC: 14 }), period()]) {
  assert.doesNotMatch(periodForecastNote(sample), /trigger|standby|de-icing|dispatch/i, "a forecast note states no dispatch condition");
}
assert.equal(forecastDay(period({ maxTempC: null })).temp, "—", "a property day with no temperature must not read 0°C");

console.log("live-weather-check ok: closed without a key and never called with the # placeholder or an unset CMS marker, rejects HTTP and success:false alike, encoded credentials, zone-worst headline, a fixture fallback on every failure, and a property day shaped by the same rules as a zone day");
