import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const dom = createDom();
globalThis.window = globalThis;
globalThis.document = dom.document;
const warnings = [];
console.warn = (...parts) => { warnings.push(parts.map(String).join(" ")); };
const resizeObservers = [];
globalThis.ResizeObserver = class {
  constructor(callback) { this.callback = callback; this.targets = []; resizeObservers.push(this); }
  observe(target) { this.targets.push(target); }
  unobserve(target) { this.targets = this.targets.filter((observed) => observed !== target); }
  disconnect() { this.targets = []; }
};
const resize = (element, width, height) => {
  element.offsetWidth = width;
  element.offsetHeight = height;
  resizeObservers.filter((observer) => observer.targets.includes(element))
    .forEach((observer) => observer.callback([{ target: element, contentRect: { width, height } }], observer));
};

const runtimeRoot = pathToFileURL(path.resolve("app-templates/customer-portal/runtime") + "/");
const { readPortalConfig } = await import(new URL("src/config.js", runtimeRoot));
const { createPropertyForecasts } = await import(new URL("src/live-weather.js", runtimeRoot));
const { createXweatherAdapter } = await import(new URL("src/adapters/xweather-adapter.js", runtimeRoot));
const { browserStorage, createGeocodeCache, createGoogleMapsAdapter } = await import(new URL("src/adapters/google-maps-adapter.js", runtimeRoot));
const { PropertyStage, closeOnEscape, createFocusKeeper, createPropertyMap } = await import(new URL("src/components/storm/PropertyMap.js", runtimeRoot));
const { addressKey, forecastPoint, geoPoint, popupDocks, popupPlacement, popupWeather, propertyPoint } = await import(new URL("src/normalizers/property-map.js", runtimeRoot));
const { propertyStatus, propertyWeather } = await import(new URL("src/normalizers/overview.js", runtimeRoot));
const { graniteRidgeSnowFixture } = await import(new URL("data/cases/granite-ridge-snow.js", runtimeRoot));
const { applyPortalConfig } = await import(new URL("src/state.js", runtimeRoot));
const { Overview } = await import(new URL("src/routes/OverviewPage.js", runtimeRoot));

const overview = graniteRidgeSnowFixture.overview;
const liveWeather = Object.assign({}, overview.weather, { source: "xweather" });
const sampleWeather = overview.weather;
const PERIODS = Array.from({ length: 7 }, (_, index) => ({
  timestamp: Math.floor(Date.UTC(2026, 8, 11 + index, 18) / 1000),
  maxTempC: -3 - index,
  minFeelslikeC: 1,
  pop: 40,
  humidity: 70,
  snowCM: index === 1 ? 2.4 : 0.6,
  windSpeedMaxKPH: 12,
  windDirMax: "N",
  weather: index === 1 ? "Snow Showers, Windy" : "Light Snow",
  weatherPrimaryCoded: "S::S",
}));

{
  const mapsKey = (value) => readPortalConfig({ dataset: { portalVertical: "snow", portalMapsApiKey: value } }).mapsApiKey;
  const mapId = (value) => readPortalConfig({ dataset: { portalVertical: "snow", portalMapsMapId: value } }).mapsMapId;
  assert.equal(mapsKey(" AIzaSyTest_Key-123 "), "AIzaSyTest_Key-123");
  assert.equal(mapsKey("${PORTAL_MAPS_API_KEY@STRING}"), "", "an unset CMS parameter renders as its own marker, which is not a key");
  assert.equal(mapsKey("#"), "", "a placeholder is not a key, so no Google script is requested with it");
  assert.equal(mapsKey(""), "");
  assert.equal(mapsKey(undefined), "");
  assert.equal(mapsKey("key\" onload=\"x"), "", "a value that is not a plain token never reaches a script URL");
  assert.equal(mapId("8e0a97af9386fef"), "8e0a97af9386fef");
  assert.equal(mapId("${PORTAL_MAPS_MAP_ID@STRING}"), "");
}

{
  assert.deepEqual(geoPoint(49.19, -122.85), { lat: 49.19, lon: -122.85 });
  assert.deepEqual(geoPoint("49.19", " -122.85 "), { lat: 49.19, lon: -122.85 });
  assert.equal(geoPoint(null, null), null, "Number(null) is 0, and a missing coordinate must stay missing");
  assert.equal(geoPoint("", ""), null);
  assert.equal(geoPoint(49.19, null), null, "half a coordinate places nothing");
  assert.equal(geoPoint(0, 0), null, "0,0 is what a defaulted Float looks like, not a property");
  assert.equal(geoPoint(91, 10), null);
  assert.equal(geoPoint(10, -181), null);
  assert.equal(geoPoint(true, [5]), null, "a boolean or an array is not a coordinate");
  assert.deepEqual(geoPoint(0, 12.5), { lat: 0, lon: 12.5 }, "the equator alone is a real place");
  assert.equal(propertyPoint({ lat: null, lon: null }), null);
  assert.equal(propertyPoint(null), null);

  assert.equal(addressKey("  870 Cinnamon Bear Way ,Lakewood,  CO   80227 "), "870 cinnamon bear way, lakewood, co 80227");
  assert.equal(addressKey("870 CINNAMON BEAR WAY, LAKEWOOD, CO 80227"), addressKey("870 Cinnamon Bear Way,Lakewood, CO 80227"), "one address is one cache entry however it is typed");
  assert.equal(addressKey(""), "");
  assert.equal(addressKey(null), "");

  assert.deepEqual(forecastPoint({ lat: 39.73336, lon: -105.12205 }), { lat: 39.73, lon: -105.12 }, "the forecast asks for the property's neighbourhood, not its doorstep");

  assert.deepEqual(popupPlacement({ x: 500, y: 100 }, { width: 1000, height: 380 }, { width: 288, height: 250 }), { side: "below", left: 356, top: 110 });
  assert.deepEqual(popupPlacement({ x: 500, y: 330 }, { width: 1000, height: 380 }, { width: 288, height: 250 }), { side: "above", left: 356, top: 34 }, "a pin in the lower part opens its popup above it");
  assert.deepEqual(popupPlacement({ x: 20, y: 100 }, { width: 1000, height: 380 }, { width: 288, height: 250 }).left, 8, "a popup never leaves the map on the left");
  assert.deepEqual(popupPlacement({ x: 990, y: 100 }, { width: 1000, height: 380 }, { width: 288, height: 250 }).left, 704, "or on the right");
  assert.deepEqual(popupPlacement({ x: 500, y: 200 }, { width: 1000, height: 380 }, { width: 0, height: 0 }), { side: "right", left: 528, top: 57 }, "a popup too tall for either side of a mid-height pin opens beside it rather than over it");
  assert.deepEqual(popupPlacement({ x: 900, y: 200 }, { width: 1000, height: 380 }, { width: 288, height: 250 }), { side: "left", left: 584, top: 57 }, "near the right edge it opens on the left");
  assert.deepEqual(popupPlacement({ x: 150, y: 150 }, { width: 320, height: 300 }, { width: 288, height: 250 }), { side: "below", left: 8, top: 42 }, "when nothing fits, a narrow map keeps the preferred side and clamps");
  assert.equal(popupDocks(343), true, "a phone-width map docks its popup below itself instead");
  assert.equal(popupDocks(647), true);
  assert.equal(popupDocks(648), false, "from 648 px a 288 px popup fits beside a pin in the middle of the map");
  assert.equal(popupDocks(0), false, "a map that has not been measured is not narrow");

  const frame = liveWeather.timeline[0];
  assert.deepEqual(popupWeather(frame, "snow", "xweather", { state: "loading", days: [] }, 0), { state: "loading", day: "Today Jan 15", source: "xweather" });
  assert.deepEqual(
    popupWeather(frame, "snow", "xweather", { state: "ready", days: [{ kind: "storm", temp: "−4°C", phrase: "Snow Showers", note: "trigger met" }] }, 0),
    { state: "property", day: "Today Jan 15", kind: "storm", temp: "−4°C", phrase: "Snow Showers", note: "trigger met", source: "xweather" },
  );
  assert.equal(popupWeather(frame, "snow", "xweather", { state: "failed", days: [] }, 0).state, "failed");
  assert.equal(popupWeather(frame, "snow", "xweather", { state: "ready", days: [] }, 3).state, "area", "a forecast shorter than the timeline falls back to the area forecast for that day");
  assert.deepEqual(popupWeather(frame, "clear", undefined, null, 0), { state: "area", day: "Today Jan 15", kind: "clear", temp: frame.temp, phrase: "", note: "", source: "sample" });
}

{
  const closed = createGoogleMapsAdapter({ apiKey: "", scope: { document: dom.fresh() } });
  assert.equal(closed.opened(), false);
  await assert.rejects(closed.load(), /not opened/);

  const scope = { document: dom.fresh() };
  const adapter = createGoogleMapsAdapter({ apiKey: "AIza-test_key", scope });
  const first = adapter.load();
  const second = adapter.load();
  assert.equal(first, second, "the script is requested once however many times the card renders");
  const scripts = scope.document.head.children;
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].src, "https://maps.googleapis.com/maps/api/js?key=AIza-test_key&loading=async&v=weekly");
  assert.equal(scripts[0].async, true);
  const google = createGoogleStub();
  scope.google = { maps: google.maps };
  fire(scripts[0], "load");
  assert.equal(await first, google.maps);
  assert.deepEqual(google.log.imports, ["core", "maps", "geocoding"]);

  const failing = { document: dom.fresh() };
  const broken = createGoogleMapsAdapter({ apiKey: "AIza-test_key", scope: failing }).load();
  fire(failing.document.head.children[0], "error");
  await assert.rejects(broken, /did not load/);

  let previousHandler = 0;
  const rejected = { document: dom.fresh(), gm_authFailure: () => { previousHandler += 1; } };
  const rejectedAdapter = createGoogleMapsAdapter({ apiKey: "AIza-test_key", scope: rejected });
  const failures = [];
  rejectedAdapter.onFailure((error) => failures.push(error.message));
  const pending = rejectedAdapter.load();
  rejected.gm_authFailure();
  await assert.rejects(pending, /rejected the browser key/);
  assert.deepEqual(failures, ["Google Maps rejected the browser key"]);
  assert.equal(previousHandler, 1, "a page that already listens for gm_authFailure keeps its own handler");

  const hosted = { document: dom.fresh(), google: { maps: createGoogleStub().maps } };
  await createGoogleMapsAdapter({ apiKey: "AIza-test_key", scope: hosted }).load();
  assert.equal(hosted.document.head.children.length, 0, "a page that already carries Google Maps is not given a second copy");
}

{
  const storage = memoryStorage();
  const cache = createGeocodeCache(storage);
  assert.equal(cache.write("12 frost lane", { lat: 49.12, lon: -122.84 }), true);
  assert.deepEqual(cache.read("12 frost lane"), { lat: 49.12, lon: -122.84 });
  storage.setItem("portal.geocode:corrupt", "{not json");
  assert.equal(cache.read("corrupt"), null);
  const hostile = createGeocodeCache({ getItem() { throw new Error("SecurityError"); }, setItem() { throw new Error("QuotaExceededError"); } });
  assert.equal(hostile.read("12 frost lane"), null, "a storage that throws reads as a miss");
  assert.equal(hostile.write("12 frost lane", { lat: 1, lon: 2 }), false, "and a write that throws is dropped, not raised");
  assert.equal(createGeocodeCache(null).read("12 frost lane"), null);

  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, get() { throw new Error("SecurityError"); } });
  assert.equal(browserStorage(), null, "even reaching for localStorage can throw in a sandboxed frame");
  if (descriptor) Object.defineProperty(globalThis, "localStorage", descriptor);
  else delete globalThis.localStorage;
}

{
  const google = createGoogleStub();
  const weather = xweather(["39.72,-105.24"]);
  const dispatched = [];
  let changes = 0;
  const controller = createPropertyMap({
    adapter: createGoogleMapsAdapter({ apiKey: "AIza-test_key", scope: { document: dom.fresh(), google: { maps: google.maps } } }),
    cache: createGeocodeCache(memoryStorage()),
    mapId: "styled-map",
    dispatch: (name, id) => dispatched.push([name, id]),
    onChange: () => { changes += 1; },
  });
  const forecasts = createPropertyForecasts({ adapter: weather.adapter, onChange: () => { changes += 1; } });
  const stage = (overrides = {}) => PropertyStage(Object.assign({
    properties: overview.properties,
    frame: liveWeather.timeline[0],
    index: 0,
    weather: liveWeather,
    viewport: overview.map,
    selectedId: null,
    map: controller,
    forecasts,
  }, overrides));

  const loading = stage();
  const firstCanvas = loading.children[0];
  assert.equal(loading.getAttribute("data-surface"), "google");
  assert.equal(controller.status(), "loading");
  assert.equal(firstCanvas.getAttribute("data-state"), "loading");
  assert.equal(firstCanvas.querySelector(".ov-map__status-label").textContent, "Loading map…");
  assert.equal(loading.querySelectorAll("[data-module=\"unplaced-properties\"]").length, 0, "every fixture property has a coordinate, so nothing is listed off the map");

  await flush();
  assert.equal(controller.status(), "ready");
  assert.equal(changes, 1, "a loaded map asks for exactly one re-render");
  assert.equal(google.log.maps.length, 1);
  const options = google.log.maps[0].options;
  assert.deepEqual(options.center, { lat: overview.map.center.lat, lng: overview.map.center.lon }, "service geography is the initial viewport");
  assert.equal(options.zoom, overview.map.zoom);
  assert.equal(options.mapId, "styled-map");
  assert.equal(options.clickableIcons, false, "Google's own points of interest must not open a second kind of popup");

  const ready = stage();
  const canvas = ready.children[0];
  assert.equal(canvas, firstCanvas, "the map element survives a re-render, so a render is never a new map load");
  assert.equal(canvas.getAttribute("data-state"), "ready");
  assert.equal(google.log.maps.length, 1);
  const pins = ready.querySelectorAll("[data-module=\"property-pin\"]");
  assert.equal(pins.length, overview.properties.length);
  for (const pin of pins) {
    const property = overview.properties.find((item) => item.id === pin.getAttribute("data-id"));
    const at = google.projection.fromLatLngToDivPixel(new google.maps.LatLng(property.lat, property.lon));
    assert.equal(pin.style.left, at.x + "px", property.name + " is not drawn at its own coordinate");
    assert.equal(pin.style.top, at.y + "px");
    assert.equal(pin.getAttribute("data-weather"), propertyWeather(property, liveWeather.timeline[0]), property.name + " takes its colour from its zone forecast");
    assert.equal(pin.getAttribute("data-state"), propertyStatus(property));
    assert.equal(pin.getAttribute("aria-pressed"), "false");
  }
  const pinFor = (root, id) => root.querySelectorAll("[data-module=\"property-pin\"]").find((pin) => pin.getAttribute("data-id") === id);
  assert.equal(pinFor(ready, "prop-yarrow").getAttribute("data-weather"), "issue", "an open ticket paints the pin red whatever the forecast says");
  assert.ok(pinFor(ready, "prop-foothill").className.split(" ").includes("ov-pin--active"), "a crew on site keeps the en-route ring");
  assert.equal(pinFor(ready, "prop-tabor").getAttribute("data-weather"), liveWeather.timeline[0].zones.north);
  assert.equal(pinFor(stage({ frame: liveWeather.timeline[4], index: 4 }), "prop-tabor").getAttribute("data-weather"), liveWeather.timeline[4].zones.north, "choosing another day repaints the pins");
  assert.deepEqual(google.log.prevented.map((element) => element.className), ["ov-map__pins", "ov-map__popup"], "dragging from a pin or the popup must not pan the map");
  assert.equal(google.log.fitBounds.length, 0, "fitting waits until the render has attached the map, since a detached map has no size");
  await flush();
  assert.equal(google.log.fitBounds.length, 1, "the viewport fits the pins once");
  assert.equal(google.log.fitBounds[0].points.length, overview.properties.length);
  assert.equal(google.log.fitBounds[0].padding, 56);
  stage();
  await flush();
  assert.equal(google.log.fitBounds.length, 1, "re-rendering the same pins must not wrench the viewport away from the customer");
  assert.equal(weather.urls.length, 0, "pins are coloured from the zone forecast; no property is fetched on load");

  const pane = google.log.maps[0].panes.overlayMouseTarget;
  let reachedMap = 0;
  pane.addEventListener("click", () => { reachedMap += 1; });
  const glyph = pinFor(stage(), "prop-foothill").children[0];
  fire(glyph, "click");
  assert.deepEqual(dispatched, [["overview.selectProperty", "prop-foothill"]], "clicking a pin's glyph selects its property");
  assert.equal(reachedMap, 0, "a pin click is not also a map click");

  const opened = stage({ selectedId: "prop-foothill" });
  opened.children[0].offsetWidth = 1000;
  opened.children[0].offsetHeight = 380;
  const popupHost = google.log.maps[0].panes.floatPane.children[0];
  assert.equal(popupHost.children.length, 1);
  const popup = popupHost.children[0];
  assert.equal(popup.getAttribute("data-module"), "property-tooltip");
  assert.equal(popup.getAttribute("role"), "dialog");
  assert.equal(popup.getAttribute("aria-label"), "Foothill Court");
  assert.match(popup.textContent, /Foothill Court/);
  assert.match(popup.textContent, /4820 Foothill Court, Lakewood, CO 80215/);
  assert.match(popup.textContent, /En Route/);
  assert.match(popup.textContent, /Lot & drive clearing · Started 5:38 AM/);
  assert.equal(popup.querySelector(".ov-tip__link").tagName, "BUTTON", "Go to Property is a button, so the keyboard can reach it");
  assert.equal(popup.querySelector(".ov-tip__close").tagName, "BUTTON");
  assert.equal(pinFor(opened, "prop-foothill").getAttribute("aria-pressed"), "true");
  assert.equal(popup.querySelector("[data-module=\"property-weather\"]").getAttribute("data-state"), "loading");
  assert.equal(popup.querySelector("[data-module=\"property-weather\"]").textContent, "This property · Today Jan 15Loading forecast…\u00a0", "loading reserves the note line, so the popup does not jump when the forecast lands");
  assert.equal(popup.querySelectorAll(".ov-attr").length, 0, "the popup's forecast always comes from the provider the map card already credits, so the popup repeats no attribution");
  assert.equal(weather.urls.length, 1, "opening the popup is what fetches the property's own forecast");
  assert.match(weather.urls[0], /\/forecasts\/39\.73%2C-105\.12\?/);

  await flush();
  const foothill = { lat: 39.73336, lon: -105.12205 };
  const anchor = new google.maps.LatLng(foothill.lat, foothill.lon);
  const at = google.projection.fromLatLngToDivPixel(anchor);
  const box = google.projection.fromLatLngToContainerPixel(anchor);
  const place = popupPlacement(box, { width: 1000, height: 380 }, { width: 0, height: 0 });
  assert.equal(popup.style.left, (at.x + place.left - box.x) + "px", "the popup is anchored to its pin and kept inside the map");
  assert.equal(popup.style.top, (at.y + place.top - box.y) + "px");
  assert.equal(popup.getAttribute("data-place"), place.side);

  const ownWeather = stage({ selectedId: "prop-foothill" }).querySelector("[data-module=\"property-weather\"]");
  assert.equal(ownWeather.getAttribute("data-state"), "property");
  assert.equal(ownWeather.getAttribute("data-weather"), "snow");
  assert.equal(ownWeather.textContent, "This property · Today Jan 15Light Snow · −3°CSnowfall 0.6 cm forecast · below the 2 cm trigger");
  assert.equal(ownWeather.getAttribute("data-source"), "xweather");
  const nextDay = stage({ selectedId: "prop-foothill", frame: liveWeather.timeline[1], index: 1 }).querySelector("[data-module=\"property-weather\"]");
  assert.equal(nextDay.textContent, "This property · Fri Jan 16Snow Showers · −4°CSnowfall 2.4 cm forecast · trigger met", "the popup follows the selected day from the same forecast");
  stage({ selectedId: null });
  const page = dom.fresh();
  const keeper = createFocusKeeper(page);
  page.appendChild(stage({ selectedId: "prop-foothill" }));
  assert.equal(weather.urls.length, 1, "a property is fetched once per page session, however often its popup opens");

  keeper.settle("prop-foothill", null);
  const firstClose = popupHost.querySelector(".ov-tip__close");
  assert.equal(dom.activeElement, firstClose, "opening moves focus into the popup");
  assert.deepEqual(dom.focusOptions, { preventScroll: true }, "focusing inside the map must not scroll Google's container");
  assert.equal(dom.scrolled.length, 0, "a popup on the map is never scrolled into view");

  page.replaceChildren(stage({ selectedId: "prop-foothill" }));
  assert.notEqual(popupHost.querySelector(".ov-tip__close"), firstClose, "a re-render, such as the forecast arriving, replaces the focused button");
  keeper.settle("prop-foothill", "prop-foothill");
  assert.equal(dom.activeElement, popupHost.querySelector(".ov-tip__close"), "and focus follows it into the new popup, so the keyboard is not dropped");

  const elsewhere = dom.document.createElement("button");
  page.appendChild(elsewhere);
  page.activeElement = elsewhere;
  const focusedBefore = dom.activeElement;
  page.replaceChildren(stage({ selectedId: "prop-foothill" }), elsewhere);
  keeper.settle("prop-foothill", "prop-foothill");
  assert.equal(dom.activeElement, focusedBefore, "focus is only restored when a render dropped it");
  delete page.activeElement;
  fire(elsewhere, "pointerdown");
  const lastFocused = dom.activeElement;
  page.replaceChildren(stage({ selectedId: "prop-foothill" }));
  keeper.settle("prop-foothill", "prop-foothill");
  assert.equal(dom.activeElement, lastFocused, "a pointer that moved on elsewhere is not pulled back into the popup");

  fire(popupHost.querySelector(".ov-tip__close"), "click");
  assert.deepEqual(dispatched[dispatched.length - 1], ["overview.closeProperty", null]);
  page.replaceChildren(stage({ selectedId: null }));
  assert.equal(popupHost.children.length, 0, "closing removes the popup");
  keeper.settle(null, "prop-foothill");
  assert.equal(dom.activeElement, pinFor(page, "prop-foothill"), "closing returns focus to the pin that opened it");

  dom.windowBlurred = true;
  const quietPage = dom.fresh();
  const quietKeeper = createFocusKeeper(quietPage);
  quietPage.appendChild(stage({ selectedId: "prop-foothill" }));
  quietKeeper.settle("prop-foothill", null);
  quietPage.replaceChildren(stage({ selectedId: "prop-foothill" }));
  quietKeeper.settle("prop-foothill", "prop-foothill");
  assert.equal(dom.activeElement, popupHost.querySelector(".ov-tip__close"), "a browser that fires no focusin while its window is in the background still keeps focus in the popup");
  dom.windowBlurred = false;
  page.replaceChildren(stage({ selectedId: null }));

  let closes = 0;
  let open = true;
  const keys = dom.fresh();
  closeOnEscape(keys, () => open, () => { closes += 1; });
  fire(keys, "keydown", { key: "Enter" });
  assert.equal(closes, 0);
  fire(keys, "keydown", { key: "Escape" });
  assert.equal(closes, 1, "Escape closes an open popup");
  open = false;
  fire(keys, "keydown", { key: "Escape" });
  assert.equal(closes, 1, "Escape does nothing when no popup is open");

  const narrowed = changes;
  resize(canvas, 343, 320);
  assert.equal(changes, narrowed, "a map that narrows while no popup is open asks for no re-render");
  const dockPage = dom.fresh();
  const dockKeeper = createFocusKeeper(dockPage);
  const delegated = [];
  dockPage.addEventListener("click", (event) => {
    const target = event.target.closest("[data-action]");
    if (target) delegated.push([target.getAttribute("data-action"), target.getAttribute("data-id")]);
  });
  let dockEscapes = 0;
  closeOnEscape(dockPage, () => true, () => { dockEscapes += 1; });
  const dockedStage = stage({ selectedId: "prop-foothill" });
  dockPage.appendChild(dockedStage);
  assert.equal(popupHost.children.length, 0, "a narrow map floats no popup over itself and its pins");
  assert.equal(dockedStage.children[0], canvas);
  const docked = dockedStage.children[1];
  assert.equal(docked && docked.getAttribute("data-module"), "property-tooltip", "the popup docks right below the map, inside the card");
  assert.equal(docked.getAttribute("data-place"), "dock");
  assert.equal(docked.getAttribute("role"), "dialog");
  assert.equal(docked.getAttribute("aria-label"), "Foothill Court");
  assert.equal(docked.style.left, undefined, "a docked popup is not positioned against the map");
  assert.equal(pinFor(dockedStage, "prop-foothill").getAttribute("aria-pressed"), "true", "its pin stays marked on the map");
  assert.equal(docked.querySelector("[data-module=\"property-weather\"]").textContent, "This property · Today Jan 15Light Snow · −3°CSnowfall 0.6 cm forecast · below the 2 cm trigger", "the docked popup keeps the property's own forecast");
  dockKeeper.settle("prop-foothill", null);
  assert.equal(dom.activeElement, docked.querySelector(".ov-tip__close"), "opening moves focus into the docked popup");
  assert.deepEqual(dom.scrolled[dom.scrolled.length - 1], { element: docked, options: { block: "nearest" } }, "and brings it into view, since it opens below the map");
  fire(docked.querySelector(".ov-tip__link"), "click");
  assert.deepEqual(delegated, [["overview.openProperty", "prop-foothill"]], "Go to Property reaches the page's own action handler from outside Google's panes");
  fire(docked.querySelector(".ov-tip__close"), "keydown", { key: "Escape" });
  assert.equal(dockEscapes, 1, "Escape from inside the docked popup reaches the page that closes it");
  resize(canvas, 330, 320);
  assert.equal(changes, narrowed, "a map that stays narrow asks for no re-render");
  resize(canvas, 0, 0);
  assert.equal(changes, narrowed, "a map a render has taken out of the page has no width to judge by");
  dockPage.replaceChildren(stage({ selectedId: null }));
  dockKeeper.settle(null, "prop-foothill");
  assert.equal(dom.activeElement, pinFor(dockPage, "prop-foothill"), "closing the docked popup returns focus to the pin that opened it");

  page.replaceChildren(stage({ selectedId: "prop-foothill" }));
  resize(canvas, 1000, 380);
  assert.equal(changes, narrowed + 1, "a map that widens under an open popup asks for one re-render");
  stage({ selectedId: "prop-foothill" });
  assert.equal(popupHost.children.length, 1, "on a wide map the popup is anchored to its pin again");
  assert.notEqual(popupHost.children[0].getAttribute("data-place"), "dock");
  resize(canvas, 343, 320);
  assert.equal(changes, narrowed + 2, "a map that narrows under an open popup asks for one re-render");
  assert.equal(stage({ selectedId: "prop-foothill" }).children[1].getAttribute("data-place"), "dock");
  assert.equal(popupHost.children.length, 0);
  resize(canvas, 1000, 380);
  page.replaceChildren(stage({ selectedId: null }));

  stage({ selectedId: "prop-tabor" });
  assert.equal(weather.urls.length, 2);
  await flush();
  stage({ selectedId: "prop-tabor" });
  const areaWeather = popupHost.querySelector("[data-module=\"property-weather\"]");
  assert.equal(areaWeather.getAttribute("data-state"), "failed");
  assert.equal(areaWeather.getAttribute("data-weather"), liveWeather.timeline[0].zones.north, "a failed property forecast falls back to the zone forecast already loaded");
  assert.equal(areaWeather.textContent, "Area forecast · Today Jan 15Storm warning · −6°CThis property’s own forecast is unavailable right now.");
  assert.equal(areaWeather.getAttribute("data-source"), "xweather");
  stage({ selectedId: "prop-tabor" });
  assert.equal(weather.urls.length, 2, "a failed forecast is not retried on every render");

  stage({ selectedId: "prop-cinnamon", weather: sampleWeather });
  assert.equal(weather.urls.length, 2, "sample conditions are never mixed with a live property forecast");
  const sample = popupHost.querySelector("[data-module=\"property-weather\"]");
  assert.equal(sample.getAttribute("data-state"), "area");
  assert.match(sample.textContent, /^Area forecast · Today Jan 15/);
  assert.equal(sample.getAttribute("data-source"), "sample", "the card credits sample conditions once, so the popup only marks where its reading came from");
}

{
  const google = createGoogleStub({ "12 Frost Lane, Surrey, BC, V3W 1J8": { lat: 49.12, lon: -122.84 } });
  const storage = memoryStorage();
  let changes = 0;
  const book = [
    liveProperty("prop-core-1", "Frost Lane", "12 Frost Lane, Surrey, BC, V3W 1J8", null, null),
    liveProperty("prop-core-2", "Nowhere Road", "1 Nowhere Road, Atlantis", null, null),
    liveProperty("prop-core-3", "Unaddressed", "", null, null),
    liveProperty("prop-core-4", "Stored Way", "5 Stored Way, Surrey, BC", 49.2, -122.9),
  ];
  const session = (maps, cacheStorage) => createPropertyMap({
    adapter: createGoogleMapsAdapter({ apiKey: "AIza-test_key", scope: { document: dom.fresh(), google: { maps: maps } } }),
    cache: createGeocodeCache(cacheStorage),
    dispatch: () => {},
    onChange: () => { changes += 1; },
  });
  const controller = session(google.maps, storage);
  const stage = (map, overrides = {}) => PropertyStage(Object.assign({
    properties: book, frame: liveWeather.timeline[0], index: 0, weather: liveWeather,
    viewport: { center: { lat: 49.19, lon: -122.85 }, zoom: 10 }, selectedId: null, map: map, forecasts: null,
  }, overrides));

  const before = stage(controller);
  assert.deepEqual(rowIds(before), ["prop-core-1", "prop-core-2", "prop-core-3"], "a property without a coordinate is listed without a pin");
  assert.deepEqual(google.log.geocode, [], "nothing is geocoded before the map has loaded");
  assert.deepEqual(rowNotes(before), ["Finding it on the map…", "Finding it on the map…", "No address on file"], "each property off the map says why it has no pin");

  await flush();
  assert.deepEqual(google.log.geocode, ["12 Frost Lane, Surrey, BC, V3W 1J8", "1 Nowhere Road, Atlantis"], "each address is geocoded once, one at a time, and a property with no address is not guessed at");
  assert.deepEqual([...storage.values.keys()], ["portal.geocode:12 frost lane, surrey, bc, v3w 1j8"], "only a found coordinate is cached; a failure is never stored");
  assert.deepEqual(JSON.parse(storage.values.get("portal.geocode:12 frost lane, surrey, bc, v3w 1j8")), { lat: 49.12, lon: -122.84 });

  const after = stage(controller);
  assert.deepEqual(pinIds(google), ["prop-core-1", "prop-core-4"]);
  assert.deepEqual(rowIds(after), ["prop-core-2", "prop-core-3"]);
  assert.deepEqual(rowNotes(after), ["Address not found on the map", "No address on file"], "a failed geocode stops saying it is being located");
  assert.deepEqual(after.querySelectorAll("[data-module=\"property-row\"]").map((row) => row.getAttribute("data-placement")), ["not-found", "no-address"]);
  assert.equal(after.children[0].getAttribute("data-pins"), "2");
  assert.equal(after.querySelector(".ov-map__status-label").textContent, "", "a map that carries pins shows no status over itself");
  assert.match(after.querySelector("[data-module=\"unplaced-properties\"]").textContent, /^Not on the map2/);
  const frost = pinsOf(google).find((pin) => pin.getAttribute("data-id") === "prop-core-1");
  const at = google.projection.fromLatLngToDivPixel(new google.maps.LatLng(49.12, -122.84));
  assert.equal(frost.style.left, at.x + "px", "a geocoded property is drawn at the geocoded coordinate");
  await flush();
  assert.equal(google.log.fitBounds.length, 1);
  assert.deepEqual(google.log.fitBounds[0].points, [[49.12, -122.84], [49.2, -122.9]]);
  stage(controller);
  assert.equal(google.log.geocode.length, 2, "a failed address is not retried within the page session");

  const addresslessPopup = stage(controller, { selectedId: "prop-core-3" }).querySelector("[data-module=\"property-tooltip\"]");
  assert.equal(addresslessPopup.querySelectorAll(".ov-tip__addr").length, 0, "a property with no address shows no empty address line");
  const unplacedPopup = stage(controller, { selectedId: "prop-core-2" });
  const inline = unplacedPopup.querySelector("[data-module=\"property-tooltip\"]");
  assert.equal(inline.getAttribute("data-place"), "inline", "a property with no pin opens the same popup inside its row");
  assert.equal(inline.querySelector("[data-module=\"property-weather\"]").getAttribute("data-state"), "area");

  const nextGoogle = createGoogleStub();
  const nextSession = session(nextGoogle.maps, storage);
  assert.deepEqual(rowIds(stage(nextSession)), ["prop-core-2", "prop-core-3"], "a later page session places the property from the cache straight away");
  await flush();
  stage(nextSession);
  assert.deepEqual(pinIds(nextGoogle), ["prop-core-1", "prop-core-4"]);
  assert.deepEqual(nextGoogle.log.geocode, ["1 Nowhere Road, Atlantis"], "a cached address is never geocoded again");

  const hostileGoogle = createGoogleStub({ "12 Frost Lane, Surrey, BC, V3W 1J8": { lat: 49.12, lon: -122.84 } });
  const hostileSession = session(hostileGoogle.maps, { getItem() { throw new Error("SecurityError"); }, setItem() { throw new Error("SecurityError"); } });
  stage(hostileSession);
  await flush();
  stage(hostileSession);
  assert.deepEqual(pinIds(hostileGoogle), ["prop-core-1", "prop-core-4"], "a blocked localStorage still places the property for this session");

  const lone = createGoogleStub();
  const loneSession = session(lone.maps, memoryStorage());
  PropertyStage({ properties: [book[3]], frame: liveWeather.timeline[0], index: 0, weather: liveWeather, viewport: { center: { lat: 49.19, lon: -122.85 }, zoom: 10 }, selectedId: null, map: loneSession, forecasts: null });
  await flush();
  PropertyStage({ properties: [book[3]], frame: liveWeather.timeline[0], index: 0, weather: liveWeather, viewport: { center: { lat: 49.19, lon: -122.85 }, zoom: 10 }, selectedId: null, map: loneSession, forecasts: null });
  await flush();
  assert.deepEqual(lone.log.centers, [[49.2, -122.9]], "a single pin is centred rather than fitted to a zero-sized box");
  assert.deepEqual(lone.log.zooms, [14]);
  assert.equal(lone.log.fitBounds.length, 0);
}

{
  const weather = xweather([]);
  const forecasts = createPropertyForecasts({ adapter: weather.adapter, onChange: () => {} });
  assert.equal(readPortalConfig({ dataset: { portalVertical: "snow" } }).mapsApiKey, "", "the fixture entry ships without a Google key");
  const list = PropertyStage({
    properties: overview.properties, frame: liveWeather.timeline[0], index: 0, weather: liveWeather,
    viewport: overview.map, selectedId: null, map: null, forecasts,
  });
  assert.equal(list.getAttribute("data-surface"), "list", "without a key the card lists the properties instead of drawing a map");
  assert.equal(list.querySelectorAll("[data-module=\"map-unavailable\"]").length, 0, "a portal without a key never had a map, so its list apologises for nothing");
  assert.equal(list.querySelectorAll("[data-module=\"property-pin\"]").length, 0);
  const rows = list.querySelectorAll("[data-module=\"property-row\"]");
  assert.equal(rows.length, overview.properties.length, "every property is listed");
  for (const row of rows) {
    const property = overview.properties.find((item) => item.id === row.getAttribute("data-id"));
    assert.equal(row.getAttribute("data-state"), propertyStatus(property));
    assert.equal(row.getAttribute("data-weather"), propertyWeather(property, liveWeather.timeline[0]));
    assert.equal(row.tagName, "BUTTON");
    assert.equal(row.getAttribute("aria-expanded"), "false");
  }
  const scrolledList = list.querySelector("[data-module=\"property-list\"]");
  scrolledList.scrollTop = 420;
  fire(scrolledList, "scroll");
  const rerendered = PropertyStage({
    properties: overview.properties, frame: liveWeather.timeline[2], index: 2, weather: liveWeather,
    viewport: overview.map, selectedId: null, map: null, forecasts,
  });
  await flush();
  assert.equal(rerendered.querySelector("[data-module=\"property-list\"]").scrollTop, 420, "a re-render keeps the list where the customer scrolled it");
  const yarrowRow = rows.find((row) => row.getAttribute("data-id") === "prop-yarrow");
  assert.equal(yarrowRow.textContent, "Yarrow Ridge3355 Yarrow Ridge Drive, Arvada, CO 80002Storm warningIssue Opened", "a row carries its name, address, zone weather and status");
  assert.equal(weather.urls.length, 0, "listing the properties fetches no property forecast");

  const expanded = PropertyStage({
    properties: overview.properties, frame: liveWeather.timeline[0], index: 0, weather: liveWeather,
    viewport: overview.map, selectedId: "prop-yarrow", map: null, forecasts,
  });
  const item = expanded.querySelectorAll("li").find((entry) => entry.children[0].getAttribute("data-id") === "prop-yarrow");
  assert.equal(item.children[0].getAttribute("aria-expanded"), "true");
  const popup = item.children[1];
  assert.equal(popup.getAttribute("data-module"), "property-tooltip", "the same popup opens under the selected row");
  assert.equal(popup.getAttribute("data-place"), "inline");
  assert.match(popup.textContent, /Issue Opened/);
  assert.ok(popup.querySelector(".ov-tip__close") && popup.querySelector(".ov-tip__link"));
  assert.equal(weather.urls.length, 1, "the property's own forecast does not depend on a Google key");
  assert.equal(expanded.querySelectorAll("[data-module=\"property-tooltip\"]").length, 1);
  const listPage = dom.fresh();
  const listKeeper = createFocusKeeper(listPage);
  listPage.appendChild(expanded);
  listKeeper.settle("prop-yarrow", null);
  assert.equal(dom.activeElement, popup.querySelector(".ov-tip__close"));
  assert.deepEqual(dom.scrolled[dom.scrolled.length - 1], { element: popup, options: { block: "nearest" } }, "a popup opened inside the scrolling list is brought into view");
  const grown = PropertyStage({
    properties: overview.properties, frame: liveWeather.timeline[0], index: 0, weather: liveWeather,
    viewport: overview.map, selectedId: "prop-yarrow", map: null, forecasts,
  });
  listPage.replaceChildren(grown);
  const scrollsBefore = dom.scrolled.length;
  listKeeper.settle("prop-yarrow", "prop-yarrow");
  const grownPopup = grown.querySelector("[data-module=\"property-tooltip\"]");
  assert.equal(dom.activeElement, grownPopup.querySelector(".ov-tip__close"));
  assert.equal(dom.scrolled.length, scrollsBefore + 1, "when a re-render hands focus back to a popup that may have grown, the popup is brought into view again");
  assert.equal(dom.scrolled[dom.scrolled.length - 1].element, grownPopup);

  const scope = { document: dom.fresh() };
  let changes = 0;
  const failing = createPropertyMap({
    adapter: createGoogleMapsAdapter({ apiKey: "AIza-test_key", scope }),
    cache: createGeocodeCache(memoryStorage()),
    dispatch: () => {},
    onChange: () => { changes += 1; },
  });
  const props = { properties: overview.properties, frame: liveWeather.timeline[0], index: 0, weather: liveWeather, viewport: overview.map, selectedId: null, map: failing, forecasts };
  assert.equal(PropertyStage(props).getAttribute("data-surface"), "google");
  scope.gm_authFailure();
  await flush();
  assert.equal(failing.status(), "failed");
  assert.equal(changes, 1, "a rejected key asks for one re-render");
  assert.equal(PropertyStage(props).getAttribute("data-surface"), "list", "a rejected key lists the properties instead of leaving a grey map");
  assert.equal(PropertyStage(props).querySelector("[data-module=\"map-unavailable\"]").textContent, "The map couldn’t load, so your properties are listed instead.", "a map that failed says so once, above the list it falls back to");
  const unframed = createPropertyMap({
    adapter: createGoogleMapsAdapter({ apiKey: "AIza-test_key", scope: { document: dom.fresh(), google: { maps: createGoogleStub().maps } } }),
    cache: createGeocodeCache(null),
    dispatch: () => {},
    onChange: () => {},
  });
  assert.equal(PropertyStage(Object.assign({}, props, { map: unframed, viewport: null })).getAttribute("data-surface"), "list", "a map with no initial viewport is not drawn");
  assert.equal(unframed.status(), "idle", "and its script is never requested");
}

{
  const { knownPlacement } = await import(new URL("src/components/storm/PropertyMap.js", runtimeRoot));
  const cache = createGeocodeCache(memoryStorage());
  cache.write(addressKey("12 Frost Lane, Surrey, BC"), { lat: 49.12, lon: -122.84 });
  assert.deepEqual(knownPlacement({ lat: 49.2, lon: -122.9, address: "" }, cache), { point: { lat: 49.2, lon: -122.9 }, reason: "stored" });
  assert.deepEqual(knownPlacement({ lat: null, lon: null, address: "12 Frost Lane, Surrey, BC" }, cache), { point: { lat: 49.12, lon: -122.84 }, reason: "located" }, "a page without the map reads the point the map already found");
  assert.deepEqual(knownPlacement({ lat: null, lon: null, address: "" }, cache), { point: null, reason: "no-address" });
  assert.deepEqual(knownPlacement({ lat: 0, lon: 0, address: "1 Nowhere Road" }, null), { point: null, reason: "unplaced" }, "0,0 is a defaulted Float and an unplaced address stays unplaced, never at the centre");

  const book = [
    liveProperty("prop-core-11", "North Lot", "11 North Lot, Surrey, BC", null, null),
    liveProperty("prop-core-12", "South Lot", "12 South Lot, Surrey, BC", null, null),
  ];
  const unanswered = createGoogleStub();
  unanswered.maps.Geocoder = class { geocode(request) { unanswered.log.geocode.push(request.address); } };
  const session = (maps) => createPropertyMap({
    adapter: createGoogleMapsAdapter({ apiKey: "AIza-test_key", scope: { document: dom.fresh(), google: { maps } } }),
    cache: createGeocodeCache(memoryStorage()),
    dispatch: () => {},
    onChange: () => {},
  });
  const stageOf = (controller) => PropertyStage({ properties: book, frame: liveWeather.timeline[0], index: 0, weather: liveWeather, viewport: { center: { lat: 49.19, lon: -122.85 }, zoom: 10 }, selectedId: null, map: controller, forecasts: null });
  const status = (stage) => ["data-state", "data-pins", "data-locating"].map((name) => stage.children[0].getAttribute(name)).concat(stage.querySelector(".ov-map__status-label").textContent);

  const waiting = session(unanswered.maps);
  assert.deepEqual(status(stageOf(waiting)), ["loading", "0", "true", "Loading map…"]);
  await flush();
  const locating = stageOf(waiting);
  assert.deepEqual(status(locating), ["ready", "0", "true", "Finding your properties on the map…"], "a ready map with nothing placed yet says it is still looking, and keeps its height so the first pin does not move the page");
  assert.deepEqual(unanswered.log.geocode, ["11 North Lot, Surrey, BC"], "addresses are still geocoded one at a time");
  assert.deepEqual(rowNotes(locating), ["Finding it on the map…", "Finding it on the map…"]);

  const refusing = createGoogleStub();
  const nowhere = session(refusing.maps);
  stageOf(nowhere);
  await flush();
  const none = stageOf(nowhere);
  assert.deepEqual(status(none), ["ready", "0", "false", "None of your properties could be placed on the map"], "when every address has failed, the empty map shrinks to its status and the list below explains each one");
  assert.deepEqual(rowNotes(none), ["Address not found on the map", "Address not found on the map"]);
  assert.equal(none.querySelector("[data-module=\"unplaced-properties\"]").textContent.startsWith("Not on the map2"), true);
}

{
  applyPortalConfig(readPortalConfig({ dataset: { portalVertical: "snow", portalProfile: "stormRetail", portalTheme: "snow", portalDataMode: "fixture", portalAuthMode: "fixture", portalCase: "granite-ridge-snow" } }));
  const badges = Overview().querySelector("[data-module=\"weather-timeline\"]").querySelectorAll(".ov-day__svc");
  assert.deepEqual(badges.map((badge) => badge.textContent), ["4 visits", "5 visits", "2 visits", "2 visits", "", "", "1 visit"], "a day with service names its visits, with a space between the count and the word");
  for (const badge of badges.filter((candidate) => candidate.textContent)) {
    assert.deepEqual(badge.children.map((part) => part.tagName + "." + part.className), ["B.", "SPAN.ov-day__svc-word"]);
    assert.match(badge.children[1].textContent, /^ visits?$/, "the space opens the word, so hiding the word takes the space with it");
  }
  const rules = ["routes.css", "responsive.css"]
    .map((file) => fs.readFileSync(path.resolve("app-templates/customer-portal/runtime/styles", file), "utf8"))
    .join("\n")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .match(/[^{}]+\{[^{}]*\}/g)
    .map((rule) => ({
      selectors: rule.slice(0, rule.indexOf("{")).split(",").map((selector) => selector.trim().replace(/\s+/g, " ")),
      body: rule.slice(rule.indexOf("{") + 1, -1),
    }));
  const styling = (subject) => rules.filter((rule) => rule.selectors.some((selector) => selector.split(" ").pop() === subject));
  assert.ok(styling(".ov-day__svc").length, "the badge is styled");
  for (const rule of styling(".ov-day__svc")) {
    assert.doesNotMatch(rule.body, /display\s*:\s*(inline-)?(flex|grid)\b/, rule.selectors.join(", ") + " makes the badge a flex or grid box, which turns ' visits' into a block that drops its opening space");
  }
  for (const rule of styling(".ov-day__svc-word")) {
    assert.doesNotMatch(rule.body, /display\s*:(?!\s*none\b)/, rule.selectors.join(", ") + " may hide the word but never make it a box of its own");
  }
  assert.deepEqual(
    styling(".ov-day__svc-word").filter((rule) => /display\s*:\s*none\b/.test(rule.body)).flatMap((rule) => rule.selectors).sort(),
    [".vw-mobile .ov-day__svc-word", ".vw-tablet .ov-day__svc-word"],
    "tablet and mobile widths still hide the word and keep the count",
  );
}

for (const address of ["Frost Lane", "Nowhere Road", "Foothill Court", "Tabor Street"]) {
  assert.ok(!warnings.some((line) => line.includes(address)), "a console warning must never carry a customer address");
}
assert.ok(warnings.length > 0, "the failure paths above did warn");

console.log("property-map-check ok: pins drawn at each coordinate with zone colouring, the issue red and the en-route ring, one map load across renders, a popup anchored to its pin that opens, closes and takes Escape, the same popup docked below a map too narrow to hold it beside a pin, a property forecast fetched once on open with the area forecast as its fallback, addresses geocoded once with only successes cached, a keyless or rejected map that lists every property instead, and timeline badges that read 4 visits");

function liveProperty(id, name, address, lat, lon) {
  return { id, name, address, lat, lon, zone: null, contract: null, quoteSiteId: null, appointment: null, ticket: null, lastService: null };
}

function pinsOf(google) {
  const map = google.log.maps[google.log.maps.length - 1];
  return map ? map.panes.overlayMouseTarget.querySelectorAll("[data-module=\"property-pin\"]") : [];
}

function pinIds(google) {
  return pinsOf(google).map((pin) => pin.getAttribute("data-id")).sort();
}

function rowNotes(root) {
  return root.querySelectorAll("[data-module=\"property-row\"]").map((row) => {
    const note = row.querySelector(".ov-prow__why");
    return note ? note.textContent : "";
  });
}

function rowIds(root) {
  return root.querySelectorAll("[data-module=\"property-row\"]").map((row) => row.getAttribute("data-id"));
}

function xweather(failing) {
  const urls = [];
  const adapter = createXweatherAdapter({
    clientId: "cid",
    clientSecret: "sec",
    fetch: async (url) => {
      urls.push(url);
      const point = decodeURIComponent(url.split("/forecasts/")[1].split("?")[0]);
      if (failing.includes(point)) return { ok: false, status: 503, json: async () => ({}) };
      return { ok: true, json: async () => ({ success: true, response: [{ periods: PERIODS }] }) };
    },
  });
  return { adapter, urls };
}

function memoryStorage() {
  const values = new Map();
  return {
    values,
    getItem: (key) => (values.has(key) ? values.get(key) : null),
    setItem: (key, value) => { values.set(key, String(value)); },
  };
}

function createGoogleStub(answers = {}) {
  const log = { maps: [], fitBounds: [], centers: [], zooms: [], geocode: [], prevented: [], imports: [] };
  class LatLng {
    constructor(lat, lng) { this.latitude = lat; this.longitude = lng; }
    lat() { return this.latitude; }
    lng() { return this.longitude; }
  }
  class LatLngBounds {
    constructor() { this.points = []; }
    extend(point) { this.points.push(point); return this; }
  }
  const projection = {
    fromLatLngToDivPixel: (latLng) => ({ x: Math.round((latLng.lng() + 106) * 1000), y: Math.round((40 - latLng.lat()) * 1000) }),
    fromLatLngToContainerPixel: (latLng) => ({ x: Math.round((latLng.lng() + 106) * 1000) - 400, y: Math.round((40 - latLng.lat()) * 1000) - 120 }),
  };
  class Map {
    constructor(div, options) {
      this.div = div;
      this.options = options;
      this.panes = { overlayMouseTarget: dom.document.createElement("div"), floatPane: dom.document.createElement("div") };
      const layers = dom.document.createElement("div");
      layers.appendChild(this.panes.overlayMouseTarget);
      layers.appendChild(this.panes.floatPane);
      div.appendChild(layers);
      log.maps.push(this);
    }
    fitBounds(bounds, padding) { log.fitBounds.push({ points: bounds.points.map((point) => [point.lat(), point.lng()]), padding }); }
    setCenter(center) { log.centers.push([center.lat(), center.lng()]); }
    setZoom(zoom) { log.zooms.push(zoom); }
  }
  class OverlayView {
    setMap(map) { this.map = map; this.onAdd(); this.added = true; this.draw(); }
    getPanes() { return this.map.panes; }
    getProjection() { return this.added ? projection : null; }
    static preventMapHitsAndGesturesFrom(element) { log.prevented.push(element); }
  }
  class Geocoder {
    geocode(request, callback) {
      log.geocode.push(request.address);
      const hit = answers[request.address];
      callback(hit ? [{ geometry: { location: new LatLng(hit.lat, hit.lon) } }] : [], hit ? "OK" : "ZERO_RESULTS");
    }
  }
  const maps = { Map, OverlayView, LatLng, LatLngBounds, Geocoder, importLibrary: async (name) => { log.imports.push(name); return {}; } };
  return { maps, log, projection };
}

function flush() {
  return new Promise((resolve) => setImmediate(resolve));
}

function fire(target, type, init = {}) {
  const event = {
    type,
    target,
    key: init.key,
    defaultPrevented: false,
    stopped: false,
    stopPropagation() { this.stopped = true; },
    preventDefault() { this.defaultPrevented = true; },
  };
  for (let node = target; node && !event.stopped; node = node.parentNode) {
    event.currentTarget = node;
    (node.listeners[type] || []).slice().forEach((listener) => listener.call(node, event));
  }
  return event;
}

function createDom() {
  const state = { activeElement: null, focusOptions: null, scrolled: [], windowBlurred: false };

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
    focus(options) {
      state.activeElement = this;
      state.focusOptions = options || null;
      if (!state.windowBlurred) fire(this, "focusin");
    }
    scrollIntoView(options) { state.scrolled.push({ element: this, options }); }
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

  function fresh() {
    const documentNode = new Element("#document");
    documentNode.head = new Element("head");
    documentNode.createElement = (tag) => new Element(tag);
    documentNode.createElementNS = (_, tag) => new Element(tag);
    documentNode.createTextNode = (value) => new Text(value);
    return documentNode;
  }

  return {
    document: fresh(),
    fresh,
    get activeElement() { return state.activeElement; },
    get focusOptions() { return state.focusOptions; },
    get scrolled() { return state.scrolled; },
    set windowBlurred(value) { state.windowBlurred = value; },
  };
}
