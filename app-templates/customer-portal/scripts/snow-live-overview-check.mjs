import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import path from "node:path";

globalThis.window = globalThis;

const runtimeRoot = pathToFileURL(path.resolve("app-templates/customer-portal/runtime") + "/");
const { readPortalConfig, readServiceGeography } = await import(new URL("src/config.js", runtimeRoot));
const { weatherSource } = await import(new URL("src/live-weather.js", runtimeRoot));
const { WEATHER_LEGEND } = await import(new URL("src/normalizers/weather.js", runtimeRoot));
const { applyPortalConfig, currentOverview, state } = await import(new URL("src/state.js", runtimeRoot));
const { propertyPoint } = await import(new URL("src/normalizers/property-map.js", runtimeRoot));
const { invoiceBuckets, propertyStatus, propertyWeather } = await import(new URL("src/normalizers/overview.js", runtimeRoot));
const { graniteRidgeSnowFixture } = await import(new URL("data/cases/granite-ridge-snow.js", runtimeRoot));

const GEOGRAPHY = JSON.stringify({
  map: { center: { lat: 49.19, lon: -122.85 }, zoom: 10 },
  zones: { surrey: { lat: 49.19, lon: -122.85 }, vancouver: { lat: 49.26, lon: -123.09 } },
});

const geography = (map, zones = { a: { lat: 1, lon: 2 } }) => readServiceGeography(JSON.stringify({ map, zones }));

function configure(dataMode, geography = GEOGRAPHY) {
  const config = readPortalConfig({
    dataset: {
      portalVertical: "snow",
      portalProfile: "stormRetail",
      portalTheme: "snow",
      portalDataMode: dataMode,
      portalAuthMode: dataMode === "live" ? "required" : "fixture",
      portalCase: "granite-ridge-snow",
      portalOrganization: "SNOWLIMITLESS",
      portalServiceGeography: geography,
    },
  });
  applyPortalConfig(config);
  state.liveWeather = null;
  state.moduleData.properties = null;
  return config;
}

const liveWeather = {
  source: "xweather",
  nowIndex: 0,
  zoneCentroids: {},
  legend: graniteRidgeSnowFixture.overview.weather.legend,
  timeline: [{ day: "Today", date: "Feb 2", kind: "snow", temp: "-4°C", label: "Snowfall 2 cm", note: "", stats: [], zones: {} }],
};

const liveProperties = {
  state: "ready",
  accountId: 62,
  scopeMode: "browser-filtered",
  truncated: false,
  items: [
    {
      id: "prop-core-278", backendId: 278, name: "123 Main Street",
      address: "#1001 - 7445 132nd Street, Surrey, BC, V3W 1J8", city: "Surrey", postal: "V3W 1J8",
      region: "BC", country: "CA", category: "COMMERCIAL", stateCode: "ACTIVE",
      lat: null, lon: null, zone: null, contract: null, quoteSiteId: null,
      appointment: null, ticket: null, lastService: null,
    },
  ],
};

{
  assert.equal(readServiceGeography(""), null);
  assert.equal(readServiceGeography("not json"), null);
  assert.equal(readServiceGeography(JSON.stringify({ zones: { a: { lat: 1, lon: 2 } } })), null, "geography without a map is refused rather than half-applied");
  assert.equal(geography({ center: { lat: 99, lon: 2 }, zoom: 10 }), null, "an impossible latitude is refused");
  assert.equal(geography({ center: { lat: 1, lon: 2 }, zoom: 10 }, {}), null, "geography with no zone has no forecast to read");
  assert.equal(geography({ center: { lat: null, lon: null }, zoom: 10 }), null, "a null centre is refused rather than read as 0,0");
  assert.equal(geography({ center: { lat: "", lon: 2 }, zoom: 10 }), null, "an empty latitude is refused rather than read as 0");
  assert.equal(geography({ center: { lat: 1, lon: 2 } }), null, "a map with no zoom has no initial viewport");
  assert.equal(geography({ center: { lat: 1, lon: 2 }, zoom: null }), null, "a null zoom is refused rather than read as the whole world");
  assert.equal(geography({ center: { lat: 1, lon: 2 }, zoom: 23 }), null);
  assert.equal(readServiceGeography(JSON.stringify({ map: { center: { lat: 1, lon: 2 }, zoom: 10 }, zones: { a: { lat: null, lon: 2 } } })), null, "a zone with a null centroid is refused");
  const legacy = geography({ center: { lat: 1, lon: 2 }, zoom: 10, size: { width: 1040, height: 560 }, layers: ["flat"] });
  assert.deepEqual(legacy.map, { center: { lat: 1, lon: 2 }, zoom: 10 }, "a geography written for the retired map image still opens, and its image fields are dropped");
  const parsed = readServiceGeography(GEOGRAPHY);
  assert.deepEqual(Object.keys(parsed.zones), ["surrey", "vancouver"]);
  assert.deepEqual(parsed.map, { center: { lat: 49.19, lon: -122.85 }, zoom: 10 });
}

{
  const live = configure("live");
  assert.deepEqual(weatherSource(live, null).zoneCentroids, live.serviceGeography.zones, "configured zones replace the fixture geography");
  assert.equal(weatherSource(live, null).legend, WEATHER_LEGEND);
  const fixtureConfig = configure("fixture", "");
  assert.equal(weatherSource(fixtureConfig, graniteRidgeSnowFixture.overview.weather), graniteRidgeSnowFixture.overview.weather);
  assert.equal(weatherSource(configure("live", ""), graniteRidgeSnowFixture.overview.weather), null, "live mode never reads the demonstration geography");
}

{
  configure("fixture");
  const model = currentOverview();
  assert.ok(model, "fixture mode keeps the demonstration overview");
  assert.equal(model.properties.length, graniteRidgeSnowFixture.overview.properties.length);
  assert.ok(model.invoices.outstanding.length > 0);
  assert.ok(model.contracts.length > 0);
}

{
  configure("live");
  state.moduleData.properties = liveProperties;
  assert.equal(currentOverview(), null, "a live home screen without live weather has no accepted representation and must not fall back to a fabricated forecast");

  configure("live", "");
  state.liveWeather = liveWeather;
  state.moduleData.properties = liveProperties;
  assert.equal(currentOverview(), null, "without configured service geography the live home screen has no map and no zones");
}

{
  configure("live");
  state.liveWeather = liveWeather;
  assert.equal(currentOverview(), null, "a live home screen must wait for the properties envelope rather than show the fixture book");

  state.moduleData.properties = { state: "error", items: [] };
  assert.equal(currentOverview(), null, "a failed properties read must not fall back to the fixture book");
}

{
  configure("live");
  state.liveWeather = liveWeather;
  state.moduleData.properties = liveProperties;
  const model = currentOverview();

  assert.ok(model);
  assert.equal(model.weather.source, "xweather");
  assert.deepEqual(model.properties, liveProperties.items);
  assert.equal(model.invoices, null, "no Invoice record exists in Core for this tenant");
  assert.deepEqual(model.contracts, [], "a contract is a customer fact and never comes from the fixture in live mode");
  assert.deepEqual(model.support, [], "no Support Ticket record exists in Core for this tenant");
  assert.equal(model.banner, null);

  const buckets = invoiceBuckets(model.invoices);
  assert.equal(buckets.outstanding.count, 0);
  assert.equal(buckets.paidThisMonth.count, 0);

  const property = model.properties[0];
  assert.equal(propertyStatus(property), "monitoring", "a property with no appointment and no ticket is monitored, not scheduled");
  assert.equal(propertyWeather(property, model.weather.timeline[0]), "snow", "with no zone the property reads the frame's own kind");
  assert.equal(propertyPoint(property), null, "a property with no coordinates places no pin instead of landing at the map centre");
  assert.deepEqual(model.map, { center: { lat: 49.19, lon: -122.85 }, zoom: 10 }, "the configured centre and zoom are the initial viewport");
}

console.log("snow-live-overview-check ok: service geography is deployment configuration with a centre and zoom only, live mode reads properties from Core, and a fabricated forecast, a fixture book, a null coordinate and an unplaceable pin are all refused");
