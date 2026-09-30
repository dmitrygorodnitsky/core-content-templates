import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
import path from "node:path";

const dom = createDom();
globalThis.window = globalThis;
globalThis.document = dom.document;
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };

const runtimeRoot = pathToFileURL(path.resolve("app-templates/customer-portal/runtime") + "/");
const { readPortalConfig, readServiceGeography } = await import(new URL("src/config.js", runtimeRoot));
const { weatherSource } = await import(new URL("src/live-weather.js", runtimeRoot));
const { WEATHER_LEGEND, buildTimeline, forecastDay } = await import(new URL("src/normalizers/weather.js", runtimeRoot));
const { applyPortalConfig, currentOverview, liveOverviewStatus, state } = await import(new URL("src/state.js", runtimeRoot));
const { propertyPoint } = await import(new URL("src/normalizers/property-map.js", runtimeRoot));
const { OVERVIEW_STATUS, invoiceBuckets, knownPropertyStatus, propertyStatus, propertyWeather, sectionAvailable } = await import(new URL("src/normalizers/overview.js", runtimeRoot));
const { graniteRidgeSnowFixture } = await import(new URL("data/cases/granite-ridge-snow.js", runtimeRoot));
const { PortalRuntime } = await import(new URL("src/portal-runtime.js", runtimeRoot));
const { Overview } = await import(new URL("src/routes/OverviewPage.js", runtimeRoot));
const { PropertyDetail } = await import(new URL("src/routes/PropertyDetailPage.js", runtimeRoot));
const { PropertyStage } = await import(new URL("src/components/storm/PropertyMap.js", runtimeRoot));

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
  const withoutForecast = currentOverview();
  assert.deepEqual(withoutForecast.properties, liveProperties.items, "properties that loaded are shown whatever the forecast does");
  assert.equal(withoutForecast.weather, null, "no fabricated forecast stands in for a missing one");
  assert.equal(withoutForecast.forecast, "unconfigured", "without weather keys the forecast says it is not set up");

  configure("live", "");
  state.liveWeather = liveWeather;
  state.liveWeatherState = "ready";
  state.moduleData.properties = liveProperties;
  const withoutGeography = currentOverview();
  assert.equal(withoutGeography.map, null, "without service geography there is no viewport, so the card lists the properties");
  assert.equal(withoutGeography.weather, null, "a forecast is never read without configured zones");
  assert.equal(withoutGeography.forecast, "unconfigured");
  assert.deepEqual(withoutGeography.properties, liveProperties.items);
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
  Object.assign(state.config, { weatherClientId: "cid", weatherClientSecret: "sec" });
  state.liveWeather = liveWeather;
  state.liveWeatherState = "ready";
  state.moduleData.properties = liveProperties;
  const model = currentOverview();

  assert.ok(model);
  assert.equal(model.forecast, "ready");
  assert.equal(model.weather.source, "xweather");
  assert.deepEqual(model.properties, liveProperties.items);
  assert.deepEqual(model.sources, { invoices: "unavailable", appointments: "unavailable", contracts: "unavailable", support: "unavailable" }, "every home section without a live source is declared unavailable, so none of them can read as empty");
  assert.equal(model.invoices, null, "no Invoice record exists in Core for this tenant");
  assert.equal(model.contracts, null, "a contract is a customer fact and never comes from the fixture in live mode");
  assert.equal(model.support, null, "no Support Ticket record exists in Core for this tenant");
  for (const section of ["invoices", "appointments", "contracts", "support"]) assert.equal(sectionAvailable(model, section), false);
  assert.equal(model.banner, null);

  const buckets = invoiceBuckets(model.invoices);
  assert.equal(buckets.outstanding.count, 0);
  assert.equal(buckets.paidThisMonth.count, 0);

  const property = model.properties[0];
  assert.equal(propertyStatus(property), "monitoring", "the shared rule reads a property with no appointment and no ticket as monitored");
  assert.equal(knownPropertyStatus(property, model.sources), null, "live mode reads no visit, ticket or contract, so it derives no status for the property");
  assert.equal(propertyWeather(property, model.weather.timeline[0]), "snow", "with no zone the property reads the frame's own kind");
  assert.equal(propertyPoint(property), null, "a property with no coordinates places no pin instead of landing at the map centre");
  assert.deepEqual(model.map, { center: { lat: 49.19, lon: -122.85 }, zoom: 10 }, "the configured centre and zoom are the initial viewport");
}

const LOAD = ["overview", "properties"];
const EMPTY_CLAIMS = ["No invoices yet", "No scheduled visits", "No active contracts", "No open requests", "Everything looks good", "Submit a request"];
const HOME_SECTIONS = ["invoices", "upcoming-services", "active-contracts", "support-requests"];
const PERIODS = Array.from({ length: 7 }, (_, index) => ({
  timestamp: Math.floor(Date.UTC(2026, 10, 2 + index, 18) / 1000),
  maxTempC: -4 - index,
  minFeelslikeC: -2,
  pop: 60,
  humidity: 70,
  snowCM: index === 0 ? 2.4 : 0.4,
  windSpeedMaxKPH: 12,
  windDirMax: "N",
  weather: "Light Snow",
  weatherPrimaryCoded: "S::S",
}));
const coreProperty = {
  id: 9001,
  code: "RES-9001",
  nls: { en: { NAME: "Frost Lane Strata" } },
  type: { id: 154, code: "SNOW_REMOVAL_PROPERTY" },
  states: [{ id: 1, code: "ACTIVE" }],
  attributes: { 153: { ACCOUNT: { value: 62 }, ADDRESS: { value: 610 }, PROPERTY_CATEGORY: { value: "STRATA" }, COORD_LAT: { value: 49.12 }, COORD_LNG: { value: -122.84 } } },
};
const coreAddress = { id: 610, address1: "12 Frost Lane", city: "Surrey", postalCode: "V3W 1J8", state: { id: 2, code: "BC" }, country: { id: "CA" } };

function liveRuntime(options = {}) {
  const outcomes = Object.assign({ properties: "ok", weather: "ok", keys: true }, options);
  applyPortalConfig(readPortalConfig({
    dataset: {
      portalVertical: "snow", portalProfile: "stormRetail", portalTheme: "snow",
      portalDataMode: "live", portalAuthMode: "required", portalOrganization: "SNOWLIMITLESS",
      portalCase: "granite-ridge-snow", portalServiceGeography: GEOGRAPHY, portalEnabledModules: "overview,properties",
      portalWeatherClientId: outcomes.keys ? "cid" : "", portalWeatherClientSecret: outcomes.keys ? "sec" : "",
    },
  }));
  state.config.origin = "https://portal.example.test";
  Object.assign(state.session, { authenticated: true, accessToken: "test-token", tokenType: "Bearer" });
  state.customerAccount = { id: 62 };
  state.account = "ready";
  state.sessionName = null;
  state.liveWeather = null;
  state.liveWeatherState = "off";
  for (const id of LOAD) {
    delete state.moduleData[id];
    delete state.moduleStatus[id];
  }
  const calls = { core: [], xweather: [] };
  globalThis.fetch = async (url) => {
    const target = String(url);
    if (target.includes("xweather.com")) {
      calls.xweather.push(target);
      if (outcomes.weather === "fail") return { ok: false, status: 503, json: async () => ({}) };
      if (outcomes.weather === "hold") return new Promise(() => {});
      return { ok: true, status: 200, json: async () => ({ success: true, error: null, response: [{ periods: PERIODS }] }) };
    }
    calls.core.push(target);
    if (outcomes.properties === "fail") return { ok: false, status: 500, json: async () => ({}) };
    if (target.includes("/core-rm/api/resource/list.json")) return { ok: true, status: 200, json: async () => ({ resultSize: 1, result: [structuredClone(coreProperty)] }) };
    if (target.includes("/core/api/address/list.json")) return { ok: true, status: 200, json: async () => ({ resultSize: 1, result: [structuredClone(coreAddress)] }) };
    throw new Error("unexpected request " + target);
  };
  return { runtime: new PortalRuntime({ state }), calls, outcomes };
}

const settle = async () => { for (let round = 0; round < 6; round += 1) await new Promise((resolve) => setImmediate(resolve)); };
const failureOf = (promise) => promise.then(() => null, (error) => error);

function quietConsole() {
  const original = { error: console.error, warn: console.warn };
  const errors = [];
  console.error = (...parts) => { errors.push(parts.map(String).join(" ")); };
  console.warn = () => {};
  return { errors, restore() { Object.assign(console, original); } };
}

{
  const console = quietConsole();
  try {
    const { runtime, calls } = liveRuntime();
    assert.deepEqual(runtime.enabledModuleIds(), ["auth", "account", "overview", "properties"], "a live signed-in portal resolves the customer Account whether or not its module list names it");
    await runtime.loadAllAsync(LOAD);
    await runtime.settled();
    assert.equal(state.moduleStatus.overview, "ready", "the overview module has a live path, so a live load no longer fails on it");
    assert.deepEqual(state.moduleData.overview, { state: "ready", source: "xweather" }, "the overview module carries the state of its forecast and no fixture data");
    assert.equal(state.moduleStatus.properties, "ready");
    assert.equal(calls.xweather.length, 2, "one forecast per configured zone");
    assert.ok(calls.xweather.every((url) => url.includes("/forecasts/49.")), "only the configured service area is forecast, never the demonstration geography");
    assert.equal(liveOverviewStatus(), "ready");
    const model = currentOverview();
    assert.deepEqual(model.properties.map((property) => property.name), ["Frost Lane Strata"]);
    assert.equal(model.weather.source, "xweather");
    const page = Overview();
    assert.equal(page.querySelectorAll("[data-module=\"error-state\"]").length, 0, "a successful live load renders the home, not the error state");
    assert.ok(page.querySelector("[data-module=\"property-map\"]"));
    assert.ok(!page.textContent.includes("Dana") && !page.textContent.includes("Foothill"), "nothing from the demonstration tenant reaches the live home");
    for (const claim of EMPTY_CLAIMS) assert.ok(!page.textContent.includes(claim), "the live home never says \"" + claim + "\" about a source it has not opened");
    for (const id of HOME_SECTIONS) {
      const card = page.querySelector(`[data-module="${id}"]`);
      assert.equal(card.getAttribute("data-state"), "unavailable", id + " is unavailable, not empty");
      assert.match(card.querySelector("[data-module=\"section-unavailable\"]").textContent, /^Not available yet.+ aren’t in the portal yet\.$/);
      assert.equal(card.querySelectorAll("[data-action]").length, 0, id + " offers no action that cannot work without Core");
    }
    assert.ok(page.querySelectorAll(".ov-day").every((day) => !day.getAttribute("aria-label").includes("no visit")), "a day is never announced as having no visit while visits are not read");
    assert.equal(page.querySelector(".ov-wx__note").textContent, "Snowfall 2.4 cm forecast", "the live weather card keeps the forecast and drops the contract trigger");
    assert.deepEqual(page.querySelectorAll(".ov-legend__item").map((item) => item.getAttribute("data-weather")), ["clear", "snow", "freezing", "storm"], "no key is shown for a status live mode cannot read");
    const rows = page.querySelectorAll("[data-module=\"property-row\"]");
    assert.equal(rows.length, 1);
    assert.equal(rows[0].getAttribute("data-weather"), "storm", "the 2.4 cm day keeps its trigger colour");
    assert.equal(rows[0].querySelector(".ov-prow__wx").textContent, page.querySelector(".ov-wx__label").textContent, "a property row reads the same forecast as the weather card");
    assert.equal(rows[0].querySelector(".ov-prow__wx").textContent, "Light Snow");
    for (const row of rows) {
      assert.equal(row.getAttribute("data-state"), null, "a live property row carries no status");
      assert.equal(row.querySelectorAll(".ov-tip__tag").length, 0);
    }
    for (const claim of ["trigger", "crews on standby", "de-icing expected", "Active Monitoring", "Issue opened", "under contract"]) assert.ok(!page.textContent.includes(claim), "the live home never says \"" + claim + "\"");
    await runtime.loadAllAsync(LOAD);
    assert.equal(calls.xweather.length, 2, "reloading the modules reuses a forecast that already loaded");
    assert.deepEqual(console.errors, [], "a successful live load logs no error");
  } finally {
    console.restore();
  }
}

{
  const console = quietConsole();
  try {
    const { runtime, calls, outcomes } = liveRuntime({ weather: "fail" });
    const failure = await failureOf(runtime.loadAllAsync(LOAD));
    await runtime.settled();
    assert.equal(failure, null, "a failed forecast does not fail the load");
    assert.equal(state.moduleStatus.overview, "error");
    assert.deepEqual(state.moduleData.overview, { state: "error", reasonCode: "weather-unavailable", source: null });
    assert.equal(state.moduleStatus.properties, "ready");
    const model = currentOverview();
    assert.equal(model.weather, null, "no demonstration forecast stands in for the failed one");
    assert.equal(model.forecast, "failed");
    assert.equal(liveOverviewStatus(), "ready", "the home follows the properties read, not the forecast");
    const page = Overview();
    assert.equal(page.querySelectorAll("[data-module=\"error-state\"]").length, 0, "a failed forecast never hides the properties");
    const card = page.querySelector("[data-module=\"weather-summary\"]");
    assert.equal(card.getAttribute("data-state"), "error", "the weather card owns its failure");
    assert.match(card.textContent, /^Forecast unavailableThe forecast didn’t load\. Your properties are shown without it\./);
    assert.equal(card.querySelector("[data-action=\"overview.retryWeather\"]").textContent, "Try again ›");
    assert.deepEqual(page.querySelectorAll("[data-module=\"property-row\"]").map((row) => row.querySelector(".ov-prow__name").textContent), ["Frost Lane Strata"]);
    assert.equal(page.querySelectorAll(".ov-prow__wx").length + page.querySelectorAll(".ov-legend__item").length + page.querySelectorAll("[data-module=\"weather-timeline\"]").length, 0, "no weather reading, legend or day strip without a forecast");
    assert.equal(page.querySelector(".page-header__sub").textContent, "1 property");

    outcomes.weather = "ok";
    await runtime.reloadAsync("overview");
    assert.equal(calls.xweather.length, 4, "Try again reloads the overview module, which fetches the forecast again");
    assert.equal(currentOverview().forecast, "ready");
    assert.ok(Overview().querySelector("[data-module=\"weather-summary\"][data-weather]"), "the forecast replaces its unavailable state once it loads");
  } finally {
    console.restore();
  }
}

{
  const console = quietConsole();
  try {
    const { runtime } = liveRuntime({ properties: "fail" });
    const failure = await failureOf(runtime.loadAllAsync(LOAD));
    await settle();
    assert.equal(failure && failure.code, "core-request-failed", "a failed properties read still fails the load");
    assert.equal(state.moduleStatus.overview, "ready", "the forecast loaded; the failure belongs to the properties read");
    assert.equal(state.moduleData.properties.state, "error");
    assert.equal(currentOverview(), null, "no fixture book stands in for the failed read");
    assert.equal(liveOverviewStatus(), "error");
    assert.match(Overview().querySelector("[data-module=\"error-state\"]").textContent, /Couldn’t load your home screen/, "a failed properties read reaches the designed error state");
  } finally {
    console.restore();
  }
}

{
  const console = quietConsole();
  try {
    const { runtime, calls } = liveRuntime({ keys: false });
    state.propertyId = "prop-core-9001";
    const deepLink = PropertyDetail();
    assert.equal(deepLink.getAttribute("data-state"), "loading", "a deep link to a property waits for the properties read");
    assert.equal(deepLink.querySelector("[data-module=\"property-loading\"]").getAttribute("aria-busy"), "true");
    assert.doesNotMatch(deepLink.textContent, /not found/i, "a property is never called missing while the list is still loading");
    await runtime.loadAllAsync(LOAD);
    assert.deepEqual(state.moduleData.overview, { state: "unavailable", reasonCode: "forecast-unconfigured", source: null }, "without weather keys there is nothing to load and nothing failed");
    assert.equal(calls.xweather.length, 0);
    assert.equal(liveOverviewStatus(), "ready", "the properties loaded, so the home is ready without a forecast");
    const page = Overview();
    const card = page.querySelector("[data-module=\"weather-summary\"]");
    assert.equal(card.getAttribute("data-state"), "unavailable");
    assert.equal(card.textContent, "Forecast unavailableThe forecast isn’t set up for this portal yet.");
    assert.equal(card.querySelectorAll("[data-action]").length, 0, "nothing to retry when nothing is configured");
    assert.deepEqual(page.querySelectorAll("[data-module=\"property-row\"]").map((row) => row.querySelector(".ov-prow__name").textContent), ["Frost Lane Strata"], "properties that loaded are listed without a forecast");
    assert.doesNotMatch(page.textContent, /no service area or forecast configured|isn’t set up yet/);
    assert.equal(page.querySelector(".page-header__sub").textContent, "1 property");
    const detail = PropertyDetail();
    assert.equal(detail.querySelector(".prop-head__title").textContent, "Frost Lane Strata", "the property page opens without a forecast");
    assert.equal(detail.getAttribute("data-state"), null);
    state.propertyId = "prop-core-4040";
    assert.equal(PropertyDetail().getAttribute("data-state"), "not-found", "an id outside the loaded list is not found once the list is in");
    assert.deepEqual(console.errors, []);
  } finally {
    console.restore();
  }
}

{
  const console = quietConsole();
  try {
    const { runtime, calls } = liveRuntime({ weather: "hold" });
    await runtime.loadAllAsync(LOAD);
    assert.equal(calls.xweather.length, 2, "the forecast was asked for");
    assert.equal(state.moduleStatus.properties, "ready", "the first render waits for the properties, never for a third-party forecast");
    assert.equal(state.moduleStatus.overview, "loading");
    const model = currentOverview();
    assert.equal(model.forecast, "loading");
    const page = Overview();
    const card = page.querySelector("[data-module=\"weather-summary\"]");
    assert.equal(card.getAttribute("data-state"), "loading", "a forecast still on its way shows its own loading state");
    assert.equal(card.getAttribute("aria-busy"), "true");
    assert.deepEqual(page.querySelectorAll("[data-module=\"property-row\"]").map((row) => row.querySelector(".ov-prow__name").textContent), ["Frost Lane Strata"], "properties show while the forecast loads");
  } finally {
    console.restore();
  }
}

{
  configure("fixture");
  const envelope = new PortalRuntime({ state }).load("overview");
  assert.equal(envelope.overview, graniteRidgeSnowFixture.overview, "fixture mode still serves the demonstration overview through the same module");
}

{
  assert.equal(sectionAvailable(graniteRidgeSnowFixture.overview, "contracts"), true, "a fixture overview is its own source for every section");
  assert.equal(sectionAvailable({ sources: {} }, "contracts"), false, "a live model that does not declare a source has not opened it");
  assert.equal(sectionAvailable({ sources: { contracts: "ready" }, contracts: [] }, "contracts"), true, "an opened source with zero rows is available, and empty");
}

{
  configure("fixture");
  const overview = graniteRidgeSnowFixture.overview;
  const saved = { invoices: overview.invoices, contracts: overview.contracts, support: overview.support, properties: overview.properties };
  Object.assign(overview, {
    invoices: { outstanding: [], paidThisMonth: [] },
    contracts: [],
    support: [],
    properties: overview.properties.map((property) => Object.assign({}, property, { appointment: null })),
  });
  try {
    const page = Overview();
    for (const claim of EMPTY_CLAIMS) assert.ok(page.textContent.includes(claim), "fixture mode still says \"" + claim + "\" when its own rows are empty");
    assert.equal(page.querySelectorAll("[data-module=\"section-unavailable\"]").length, 0, "fixture mode never marks a section unavailable");
    assert.ok(page.querySelector("[data-module=\"support-requests\"]").querySelector("[data-action=\"overview.newRequest\"]"), "fixture mode keeps Submit a request");
    assert.ok(page.querySelectorAll(".ov-day").some((day) => day.getAttribute("aria-label").endsWith(" — no visit")), "fixture mode still announces a day with no visit");

    overview.sources = { invoices: "unavailable", appointments: "ready", contracts: "ready", support: "unavailable" };
    const mixed = Overview();
    assert.match(mixed.querySelector("[data-module=\"active-contracts\"]").textContent, /No active contracts/, "a source declared ready with zero rows still says it is empty");
    assert.match(mixed.querySelector("[data-module=\"upcoming-services\"]").textContent, /No scheduled visits/);
    assert.equal(mixed.querySelector("[data-module=\"invoices\"]").getAttribute("data-state"), "unavailable");
    assert.equal(mixed.querySelector("[data-module=\"support-requests\"]").getAttribute("data-state"), "unavailable");
    assert.ok(!mixed.textContent.includes("No invoices yet") && !mixed.textContent.includes("No open requests"), "only the undeclared sources lose their empty copy");
  } finally {
    delete overview.sources;
    Object.assign(overview, saved);
  }
}

{
  const frames = buildTimeline({ surrey: PERIODS }, ["surrey"]);
  const weather = { source: "xweather", nowIndex: 0, zoneCentroids: {}, legend: WEATHER_LEGEND, timeline: frames };
  const property = { id: "prop-core-9001", backendId: 9001, name: "Frost Lane Strata", address: "12 Frost Lane, Surrey, BC, V3W 1J8", lat: 49.12, lon: -122.84, zone: null, contract: null, appointment: null, ticket: null, lastService: null };
  const unread = { invoices: "unavailable", appointments: "unavailable", contracts: "unavailable", support: "unavailable" };
  const forecasts = { request: () => ({ state: "ready", days: PERIODS.map(forecastDay) }) };
  const pinned = (sources) => {
    const pins = [];
    const controller = {
      status: () => "ready",
      placement: (entry) => ({ point: { lat: entry.lat, lon: entry.lon }, reason: null }),
      docked: () => false,
      stage: (view) => {
        const host = document.createElement("div");
        view.pins.forEach((pin) => { pins.push(pin.element); host.appendChild(pin.element); });
        if (view.popup) host.appendChild(view.popup.element);
        return host;
      },
    };
    const stage = PropertyStage({ properties: [property], frame: frames[0], index: 0, weather, viewport: { center: { lat: 49.19, lon: -122.85 }, zoom: 10 }, selectedId: property.id, map: controller, forecasts, sources });
    return { pin: pins[0], tooltip: stage.querySelector("[data-module=\"property-tooltip\"]") };
  };
  const reading = "This property · " + frames[0].day + " " + frames[0].date + "Light Snow · −4°C";

  const live = pinned(unread);
  assert.equal(live.pin.getAttribute("data-state"), null, "a live pin carries no status");
  assert.equal(live.pin.getAttribute("data-weather"), "storm", "a live pin keeps the colour of its forecast");
  assert.equal(live.pin.getAttribute("aria-label"), "Frost Lane Strata", "a live pin is announced by name, with no invented status");
  assert.equal(live.tooltip.getAttribute("data-state"), null);
  assert.equal(live.tooltip.querySelectorAll(".ov-tip__tag").length, 0, "the live tooltip shows no status");
  assert.equal(live.tooltip.querySelectorAll(".ov-tip__line").length, 0, "the live tooltip states no visit");
  assert.equal(live.tooltip.querySelector("[data-module=\"property-weather\"]").textContent, reading + "Snowfall 2.4 cm forecast", "the live tooltip keeps the property forecast without the trigger");

  const fixture = pinned(undefined);
  assert.equal(fixture.pin.getAttribute("data-state"), "monitoring", "fixture mode still derives a status");
  assert.equal(fixture.pin.getAttribute("aria-label"), "Frost Lane Strata — " + OVERVIEW_STATUS.monitoring.label);
  assert.equal(fixture.tooltip.querySelector(".ov-tip__tag").textContent, "Active Monitoring");
  assert.equal(fixture.tooltip.querySelector("[data-module=\"property-weather\"]").textContent, reading + "Snowfall 2.4 cm forecast · trigger met", "fixture mode keeps the trigger reading");
}

{
  configure("fixture");
  const triggerIndex = graniteRidgeSnowFixture.overview.weather.timeline.findIndex((frame) => /trigger/i.test(frame.note));
  state.ovWeatherIndex = triggerIndex;
  try {
    const page = Overview();
    assert.match(page.querySelector(".ov-wx__note").textContent, /trigger/i, "fixture mode keeps its trigger reading on the weather card");
    assert.ok(page.querySelectorAll(".ov-legend__item").some((item) => item.getAttribute("data-weather") === "issue"), "fixture mode keeps the issue key");
    const tags = page.querySelectorAll(".ov-tip__tag").map((tag) => tag.textContent);
    for (const label of ["Issue Opened", "En Route", "Scheduled", "Active Monitoring"]) assert.ok(tags.includes(label), "fixture mode still labels a property " + label);

    state.liveWeather = { source: "xweather", nowIndex: 0, zoneCentroids: {}, legend: WEATHER_LEGEND, timeline: buildTimeline({ surrey: PERIODS }, ["surrey"]) };
    state.ovWeatherIndex = null;
    assert.equal(Overview().querySelector(".ov-wx__note").textContent, "Snowfall 2.4 cm forecast · trigger met", "an Xweather forecast in fixture mode keeps the trigger reading");
  } finally {
    state.ovWeatherIndex = null;
    state.liveWeather = null;
  }
}

console.log("snow-live-overview-check ok: service geography is deployment configuration with a centre and zoom only, live mode reads properties from Core, a fabricated forecast, a fixture book, a null coordinate and an unplaceable pin are all refused, and the overview module loads its live forecast without error and without holding back the properties, a failed or unconfigured forecast leaves the properties on screen with the weather card in its own state while a failed properties read reaches the designed error state, a property row reads the forecast the weather card reads, a deep link waits for the list, and a home section with no live source says it is not in the portal yet instead of claiming it is empty, while fixture mode keeps its empty copy, and live mode derives no property status, visit, contract or trigger reading from sources it has not opened while fixture mode keeps them");

function createDom() {
  class Text {
    constructor(value) { this.textContent = String(value); this.parentNode = null; this.listeners = {}; }
  }

  class Element {
    constructor(tag) {
      this.tagName = String(tag).toUpperCase();
      this.attributes = new Map();
      this.childNodes = [];
      this.parentNode = null;
      this.listeners = {};
      this.style = {};
      this.offsetWidth = 0;
      this.offsetHeight = 0;
    }
    get className() { return this.getAttribute("class") || ""; }
    set className(value) { this.setAttribute("class", value); }
    get children() { return this.childNodes.filter((node) => node instanceof Element); }
    get textContent() { return this.childNodes.map((node) => node.textContent).join(""); }
    set textContent(value) { this.replaceChildren(new Text(value)); }
    setAttribute(name, value) { this.attributes.set(name, String(value)); }
    getAttribute(name) { return this.attributes.has(name) ? this.attributes.get(name) : null; }
    hasAttribute(name) { return this.attributes.has(name); }
    removeAttribute(name) { this.attributes.delete(name); }
    appendChild(child) {
      if (child.parentNode) child.parentNode.removeChild(child);
      child.parentNode = this;
      this.childNodes.push(child);
      return child;
    }
    removeChild(child) {
      this.childNodes = this.childNodes.filter((node) => node !== child);
      child.parentNode = null;
      return child;
    }
    remove() { if (this.parentNode) this.parentNode.removeChild(this); }
    replaceChildren(...nodes) {
      this.childNodes.forEach((node) => { node.parentNode = null; });
      this.childNodes = [];
      nodes.forEach((node) => this.appendChild(node));
    }
    addEventListener(type, listener) { (this.listeners[type] = this.listeners[type] || []).push(listener); }
    contains(node) {
      for (let current = node; current; current = current.parentNode) if (current === this) return true;
      return false;
    }
    closest(selector) {
      for (let current = this; current instanceof Element; current = current.parentNode) if (matches(current, selector)) return current;
      return null;
    }
    querySelectorAll(selector) {
      const found = [];
      const walk = (node) => node.children.forEach((child) => { if (matches(child, selector)) found.push(child); walk(child); });
      walk(this);
      return found;
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    focus() {}
    scrollIntoView() {}
  }

  function matches(node, selector) {
    const parts = selector.match(/^[a-zA-Z0-9-]+|\.[\w-]+|\[[^\]]+\]/g) || [];
    return parts.every((part) => {
      if (part[0] === ".") return node.className.split(/\s+/).includes(part.slice(1));
      if (part[0] === "[") {
        const attribute = /^\[([\w-]+)(?:="([^"]*)")?\]$/.exec(part);
        return attribute[2] === undefined ? node.hasAttribute(attribute[1]) : node.getAttribute(attribute[1]) === attribute[2];
      }
      return node.tagName === part.toUpperCase();
    });
  }

  const documentNode = new Element("#document");
  documentNode.head = new Element("head");
  documentNode.createElement = (tag) => new Element(tag);
  documentNode.createElementNS = (_, tag) => new Element(tag);
  documentNode.createTextNode = (value) => new Text(value);
  return { document: documentNode };
}
