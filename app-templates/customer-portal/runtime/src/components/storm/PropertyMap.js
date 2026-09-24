import { h } from "../../dom.js";
import { OVERVIEW_STATUS as STATUS, knownPropertyStatus, propertyWeather, sourceOpened, zoneWeather } from "../../normalizers/overview.js";
import { addressKey, forecastPoint, geoPoint, popupDocks, popupPlacement, popupWeather, propertyPoint, weatherLabel, weatherReading } from "../../normalizers/property-map.js";
import { icon } from "./overview-icons.js";

var SINGLE_PIN_ZOOM = 14;
var FIT_PADDING = 56;
var FOCUS_ACTIONS = ["overview.selectProperty", "overview.closeProperty", "overview.openProperty"];
var PLACEMENT_NOTES = {
  locating: "Finding it on the map…",
  "not-found": "Address not found on the map",
  "no-address": "No address on file",
};
var listScroll = {};

export function createPropertyMap(options) {
  var adapter = options.adapter;
  var cache = options.cache;
  var dispatch = options.dispatch;
  var onChange = options.onChange;
  var mapId = options.mapId || "";
  var status = "idle";
  var maps = null;
  var map = null;
  var layer = null;
  var canvas = null;
  var mount = null;
  var statusLabel = null;
  var pinsHost = null;
  var popupHost = null;
  var view = null;
  var fitted = null;
  var narrow = false;
  var located = new Map();
  var failed = new Set();
  var requested = new Set();
  var queue = [];
  var geocoding = false;

  return {
    status: function () { return status; },
    docked: function () { return narrow; },
    placement: placement,
    pointOf: function (property) { return placement(property).point; },
    stage: stage,
  };

  function stage(next) {
    if (!canvas) build();
    if (status === "idle") start(next.viewport);
    view = next;
    canvas.setAttribute("data-state", status);
    canvas.setAttribute("data-pins", String(next.pins.length));
    canvas.setAttribute("data-locating", next.locating ? "true" : "false");
    statusLabel.textContent = statusText(next);
    pinsHost.replaceChildren.apply(pinsHost, next.pins.map(function (pin) { return pin.element; }));
    popupHost.replaceChildren.apply(popupHost, next.popup && !narrow ? [next.popup.element] : []);
    draw();
    Promise.resolve().then(settle);
    return canvas;
  }

  function statusText(next) {
    if (status !== "ready") return "Loading map…";
    if (next.pins.length) return "";
    return next.locating ? "Finding your properties on the map…" : "None of your properties could be placed on the map";
  }

  function settle() {
    fit(view.pins);
    draw();
  }

  function build() {
    mount = h("div", { "class": "ov-map__google" });
    statusLabel = h("span", { "class": "ov-map__status-label" }, "Loading map…");
    canvas = h("div", { "class": "ov-map__canvas", "data-surface": "google" }, [
      mount,
      h("div", { "class": "ov-map__status", role: "status" }, [statusLabel]),
    ]);
    pinsHost = h("div", { "class": "ov-map__pins" });
    popupHost = h("div", { "class": "ov-map__popup" });
    pinsHost.addEventListener("click", relay);
    popupHost.addEventListener("click", relay);
    new ResizeObserver(resized).observe(canvas);
  }

  function resized(entries) {
    var width = entries[entries.length - 1].contentRect.width;
    if (!width || popupDocks(width) === narrow) return;
    narrow = !narrow;
    if (view && view.popup) onChange();
  }

  function relay(event) {
    var host = event.currentTarget;
    var target = event.target && typeof event.target.closest === "function" ? event.target.closest("[data-action]") : null;
    if (!target || !host.contains(target)) return;
    event.stopPropagation();
    dispatch(target.getAttribute("data-action"), target.getAttribute("data-id"));
  }

  function start(viewport) {
    status = "loading";
    adapter.onFailure(fail);
    adapter.load().then(function (loaded) {
      if (status === "failed") return;
      maps = loaded;
      map = new maps.Map(mount, mapOptions(viewport, mapId));
      layer = pinLayer();
      layer.setMap(map);
      status = "ready";
      drain();
      onChange();
    }).catch(fail);
  }

  function fail(error) {
    if (status === "failed") return;
    status = "failed";
    console.warn("[portal] Google map unavailable, listing the properties instead", error && error.message);
    onChange();
  }

  function pinLayer() {
    var overlay = new maps.OverlayView();
    overlay.onAdd = function () {
      var panes = overlay.getPanes();
      panes.overlayMouseTarget.appendChild(pinsHost);
      panes.floatPane.appendChild(popupHost);
      if (typeof maps.OverlayView.preventMapHitsAndGesturesFrom === "function") {
        maps.OverlayView.preventMapHitsAndGesturesFrom(pinsHost);
        maps.OverlayView.preventMapHitsAndGesturesFrom(popupHost);
      }
    };
    overlay.draw = draw;
    overlay.onRemove = function () {
      pinsHost.remove();
      popupHost.remove();
    };
    return overlay;
  }

  function draw() {
    var projection = layer ? layer.getProjection() : null;
    if (!projection || !view) return;
    view.pins.forEach(function (pin) {
      var at = projection.fromLatLngToDivPixel(latLng(pin.point));
      if (!at) return;
      pin.element.style.left = at.x + "px";
      pin.element.style.top = at.y + "px";
    });
    if (view.popup && !narrow) placePopup(projection, view.popup);
  }

  function placePopup(projection, popup) {
    var anchor = latLng(popup.point);
    var at = projection.fromLatLngToDivPixel(anchor);
    var box = projection.fromLatLngToContainerPixel(anchor);
    if (!at || !box) return;
    var place = popupPlacement(box,
      { width: canvas.offsetWidth, height: canvas.offsetHeight },
      { width: popup.element.offsetWidth, height: popup.element.offsetHeight });
    popup.element.style.left = (at.x + place.left - box.x) + "px";
    popup.element.style.top = (at.y + place.top - box.y) + "px";
    popup.element.setAttribute("data-place", place.side);
  }

  function fit(pins) {
    if (!map) return;
    var signature = pins.map(function (pin) { return pin.id + "@" + pin.point.lat + "," + pin.point.lon; }).join("|");
    if (signature === fitted) return;
    fitted = signature;
    if (!pins.length) return;
    if (pins.length === 1) {
      map.setCenter(latLng(pins[0].point));
      map.setZoom(SINGLE_PIN_ZOOM);
      return;
    }
    var bounds = new maps.LatLngBounds();
    pins.forEach(function (pin) { bounds.extend(latLng(pin.point)); });
    map.fitBounds(bounds, FIT_PADDING);
  }

  function latLng(point) {
    return new maps.LatLng(point.lat, point.lon);
  }

  function placement(property) {
    var known = knownPlacement(property, null);
    if (known.reason !== "unplaced") return known;
    var key = addressKey(property.address);
    if (located.has(key)) return { point: located.get(key), reason: "located" };
    if (failed.has(key)) return { point: null, reason: "not-found" };
    if (requested.has(key)) return { point: null, reason: "locating" };
    var cached = cache.read(key);
    var point = cached ? geoPoint(cached.lat, cached.lon) : null;
    if (point) {
      located.set(key, point);
      return { point: point, reason: "located" };
    }
    requested.add(key);
    queue.push({ key: key, address: property.address });
    drain();
    return { point: null, reason: "locating" };
  }

  function drain() {
    if (geocoding || status !== "ready" || !queue.length) return;
    geocoding = true;
    var next = queue.shift();
    adapter.geocode(next.address).then(function (found) {
      var point = geoPoint(found.lat, found.lon);
      if (!point) throw new Error("Geocoder answered without a usable point");
      located.set(next.key, point);
      cache.write(next.key, point);
    }).catch(function (error) {
      failed.add(next.key);
      console.warn("[portal] a property could not be placed on the map", error && error.message);
    }).then(function () {
      geocoding = false;
      onChange();
      drain();
    });
  }
}

export function knownPlacement(property, cache) {
  var direct = propertyPoint(property);
  if (direct) return { point: direct, reason: "stored" };
  var key = addressKey(property && property.address);
  if (!key) return { point: null, reason: "no-address" };
  var cached = cache ? cache.read(key) : null;
  var point = cached ? geoPoint(cached.lat, cached.lon) : null;
  return point ? { point: point, reason: "located" } : { point: null, reason: "unplaced" };
}

export function PropertyStage(props) {
  var controller = props.map || null;
  var failed = !!controller && controller.status() === "failed";
  var map = controller && props.viewport && !failed ? controller : null;
  var placed = [];
  var listed = [];
  props.properties.forEach(function (property) {
    var place = controller ? controller.placement(property) : { point: propertyPoint(property), reason: null };
    var entry = { property: property, point: place.point, reason: map ? place.reason : null };
    if (map && entry.point) placed.push(entry);
    else listed.push(entry);
  });
  var chosen = placed.concat(listed).find(function (entry) { return entry.property.id === props.selectedId; }) || null;
  var popup = chosen ? PropertyPopup(chosen.property, props.frame ? popupView(chosen, props) : null, props.weather ? props.weather.legend : null, props.sources) : null;
  var pinned = !!chosen && placed.indexOf(chosen) !== -1;

  if (!map) {
    return h("div", { "class": "ov-map__stage", "data-surface": "list", "data-state": failed ? "failed" : undefined }, [
      failed ? h("div", { "class": "ov-map__note", "data-module": "map-unavailable", "data-visual-id": "map-unavailable", role: "status" }, "The map couldn’t load, so your properties are listed instead.") : null,
      PropertyList("all", listed, props, popup),
    ]);
  }
  var docked = pinned && map.docked();
  return h("div", { "class": "ov-map__stage", "data-surface": "google" }, [
    map.stage({
      viewport: props.viewport,
      pins: placed.map(function (entry) {
        return { id: entry.property.id, point: entry.point, element: PropertyPin(entry.property, props.frame, entry.property.id === props.selectedId, props.sources) };
      }),
      popup: pinned ? { point: chosen.point, element: popup } : null,
      locating: listed.some(function (entry) { return entry.reason === "locating"; }),
    }),
    docked ? dock(popup) : null,
    listed.length ? UnplacedProperties(listed, props, pinned ? null : popup) : null,
  ]);
}

export function WeatherAttribution(source, className) {
  return text("div", "ov-attr" + (className ? " " + className : ""), source === "xweather" ? "Weather · Xweather" : "Sample conditions");
}

export function closeOnEscape(target, isOpen, close) {
  target.addEventListener("keydown", function (event) {
    if (event.key !== "Escape" || event.defaultPrevented || !isOpen()) return;
    close();
  });
}

export function createFocusKeeper(doc) {
  var remembered = null;
  doc.addEventListener("focusin", function (event) { remembered = focusIdentity(event.target); }, true);
  doc.addEventListener("pointerdown", function (event) { remembered = focusIdentity(event.target); }, true);

  return {
    settle: function (selectedId, previousId) {
      var target = null;
      if (selectedId !== previousId) {
        target = selectedId ? doc.querySelector(".ov-tip__close") : actionElement(doc, "overview.selectProperty", previousId);
      } else if (remembered && (!doc.activeElement || doc.activeElement === doc.body)) {
        target = actionElement(doc, remembered.action, remembered.id);
      }
      if (!target) return;
      var tip = selectedId ? target.closest(".ov-tip") : null;
      var place = tip ? tip.getAttribute("data-place") : null;
      if (place === "inline" || place === "dock") tip.scrollIntoView({ block: "nearest" });
      target.focus({ preventScroll: true });
      remembered = focusIdentity(target);
    },
  };
}

function focusIdentity(element) {
  var target = element && typeof element.closest === "function" ? element.closest("[data-action]") : null;
  var action = target ? target.getAttribute("data-action") : null;
  return FOCUS_ACTIONS.indexOf(action) === -1 ? null : { action: action, id: target.getAttribute("data-id") };
}

function actionElement(root, action, id) {
  var candidates = root.querySelectorAll("[data-action=\"" + action + "\"]");
  for (var index = 0; index < candidates.length; index += 1) {
    if (candidates[index].getAttribute("data-id") === id) return candidates[index];
  }
  return null;
}

function mapOptions(viewport, mapId) {
  var settings = {
    center: { lat: viewport.center.lat, lng: viewport.center.lon },
    zoom: viewport.zoom,
    disableDefaultUI: true,
    zoomControl: true,
    clickableIcons: false,
    gestureHandling: "cooperative",
  };
  if (mapId) settings.mapId = mapId;
  return settings;
}

function popupView(entry, props) {
  var property = entry.property;
  var live = props.weather.source === "xweather" && entry.point && props.forecasts;
  var forecast = live ? props.forecasts.request(property.id, forecastPoint(entry.point)) : null;
  return popupWeather(props.frame, zoneWeather(property, props.frame), props.weather.source, forecast, props.index, props.sources);
}

function weatherKey(property, frame, status) {
  if (status) return propertyWeather(property, frame);
  return frame ? zoneWeather(property, frame) : undefined;
}

function PropertyPin(property, frame, selected, sources) {
  var status = knownPropertyStatus(property, sources);
  return h("button", {
    "class": "ov-pin" + (status === "enroute" ? " ov-pin--active" : "") + (selected ? " ov-pin--on" : ""),
    "data-action": "overview.selectProperty", "data-id": property.id,
    "data-module": "property-pin", "data-visual-id": "property-pin",
    "data-state": status || undefined, "data-weather": weatherKey(property, frame, status),
    "aria-label": status ? property.name + " — " + STATUS[status].label : property.name,
    "aria-pressed": selected ? "true" : "false",
  }, [icon("pin", "ov-pin__glyph")]);
}

function PropertyList(key, entries, props, popup) {
  if (!entries.length) {
    return h("div", { "class": "ov-empty", "data-state": "empty" }, [
      text("div", "ov-empty__title", "No properties yet"),
      sourceOpened(props.sources, "contracts") ? text("div", "ov-empty__desc", "A property appears here once it is under contract.") : null,
    ]);
  }
  var list = h("ul", { "class": "ov-plist", "data-module": "property-list", "data-visual-id": "property-list", "aria-label": "Your properties" },
    entries.map(function (entry) {
      var selected = entry.property.id === props.selectedId;
      return h("li", { "class": "ov-plist__item" }, [
        PropertyRow(entry.property, props, selected, entry.reason),
        selected && popup ? inline(popup) : null,
      ]);
    }));
  list.addEventListener("scroll", function () { listScroll[key] = list.scrollTop; });
  Promise.resolve().then(function () { list.scrollTop = listScroll[key] || 0; });
  return list;
}

function UnplacedProperties(entries, props, popup) {
  return h("div", { "class": "ov-map__unplaced", "data-module": "unplaced-properties", "data-visual-id": "unplaced-properties" }, [
    h("div", { "class": "ov-map__unplaced-head" }, [
      text("span", "ov-map__unplaced-title", "Not on the map"),
      text("span", "ov-map__unplaced-count", String(entries.length)),
    ]),
    PropertyList("unplaced", entries, props, popup),
  ]);
}

function PropertyRow(property, props, selected, reason) {
  var status = knownPropertyStatus(property, props.sources);
  var note = reason && Object.prototype.hasOwnProperty.call(PLACEMENT_NOTES, reason) ? PLACEMENT_NOTES[reason] : "";
  return h("button", {
    "class": "ov-prow" + (status === "enroute" ? " ov-prow--active" : "") + (selected ? " ov-prow--on" : ""),
    "data-action": "overview.selectProperty", "data-id": property.id,
    "data-module": "property-row", "data-visual-id": "property-row",
    "data-state": status || undefined, "data-weather": weatherKey(property, props.frame, status),
    "data-placement": note ? reason : undefined,
    "aria-expanded": selected ? "true" : "false",
  }, [
    h("span", { "class": "ov-prow__pin" }, [icon("pin", "ov-prow__glyph")]),
    h("span", { "class": "ov-prow__read" }, [
      text("span", "ov-prow__name", property.name),
      property.address ? text("span", "ov-prow__addr", property.address) : null,
      note ? text("span", "ov-prow__why", note) : null,
    ]),
    h("span", { "class": "ov-prow__meta" }, [
      props.frame ? text("span", "ov-prow__wx", weatherReading(zoneWeather(property, props.frame), props.frame, props.weather.legend)) : null,
      status ? text("span", "ov-tip__tag ov-tip__tag--" + status, STATUS[status].label) : null,
    ]),
  ]);
}

function PropertyPopup(property, weather, legend, sources) {
  var status = knownPropertyStatus(property, sources);
  var line = sourceOpened(sources, "appointments") ? visitLine(property) : "";
  return h("div", { "class": "ov-tip", "data-module": "property-tooltip", "data-visual-id": "property-tooltip", "data-state": status || undefined, role: "dialog", "aria-label": property.name }, [
    h("div", { "class": "ov-tip__head" }, [
      h("div", { style: "flex:1;min-width:0" }, [
        text("div", "ov-tip__name", property.name),
        property.address ? text("div", "ov-tip__addr", property.address) : null,
      ]),
      h("button", { "class": "ov-tip__close", "data-action": "overview.closeProperty", "aria-label": "Close" }, "✕"),
    ]),
    status ? h("div", { "class": "ov-tip__tags" }, [
      text("span", "ov-tip__tag ov-tip__tag--" + status, STATUS[status].label),
    ]) : null,
    line ? text("div", "ov-tip__line", line) : null,
    weather ? PopupWeather(weather, legend) : null,
    h("button", { "class": "link-action ov-tip__link", "data-action": "overview.openProperty", "data-id": property.id, "data-visual-id": "property-details" }, "Go to Property ›"),
  ]);
}

function PopupWeather(view, legend) {
  var own = view.state === "property" || view.state === "loading";
  var reading = view.state === "loading" ? "Loading forecast…" : (view.phrase || weatherLabel(view.kind, legend)) + " · " + view.temp;
  var note = view.state === "failed" ? "This property’s own forecast is unavailable right now." : view.note;
  return h("div", {
    "class": "ov-tip__wx", "data-module": "property-weather", "data-visual-id": "property-weather",
    "data-state": view.state, "data-weather": view.kind, "data-source": view.source, "aria-live": "polite",
    "aria-busy": view.state === "loading" ? "true" : undefined,
  }, [
    text("div", "ov-tip__wx-scope", (own ? "This property" : "Area forecast") + " · " + view.day),
    h("div", { "class": "ov-tip__wx-read" }, [h("i"), text("span", "", reading)]),
    note ? text("div", "ov-tip__wx-note", note) : null,
    view.state === "loading" ? h("div", { "class": "ov-tip__wx-note", "aria-hidden": "true" }, " ") : null,
  ]);
}

function visitLine(property) {
  var appointment = property.appointment;
  var active = appointment && appointment.state === "IN_PROGRESS" ? appointment : null;
  var next = appointment && appointment.state === "SCHEDULED" ? appointment : null;
  return active ? active.service + " · " + active.when
    : next ? next.service + " · " + next.when
    : property.lastService ? "Last service · " + property.lastService.service + " · " + property.lastService.when
    : "";
}

function inline(popup) {
  popup.setAttribute("data-place", "inline");
  return popup;
}

function dock(popup) {
  popup.setAttribute("data-place", "dock");
  return popup;
}

function text(tag, className, value) {
  return h(tag, className ? { "class": className } : null, value == null ? "" : String(value));
}
