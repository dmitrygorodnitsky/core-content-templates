import { h } from "../../dom.js";

var PLAN_PADDING = 28;
var POINT_RADIUS_METERS = 1.5;
var TONE_TOKENS = ["--accent", "--warn", "--ok", "--danger", "--accent-3"];

export function createPlanMap(options) {
  var adapter = options.adapter;
  var onChange = options.onChange;
  var scope = options.scope || globalThis;
  var status = "idle";
  var maps = null;
  var views = new Map();

  return {
    status: function () { return status; },
    view: view,
  };

  function view(plan, label) {
    if (status === "failed") return null;
    if (status === "idle") start();
    var entry = views.get(plan);
    if (!entry) {
      var canvas = h("div", { "class": "prop-plan__canvas", role: "img", "aria-label": label });
      entry = { node: h("div", { "class": "prop-plan__map", "data-module": "plan-map", "data-visual-id": "plan-map", "data-surface": "google" }, [canvas]), canvas: canvas, map: null, drawn: false };
      views.set(plan, entry);
    }
    entry.node.setAttribute("data-state", status === "ready" ? "ready" : "loading");
    if (status === "ready" && !entry.drawn) {
      entry.drawn = true;
      Promise.resolve().then(function () { draw(entry, plan); }).catch(fail);
    }
    return entry.node;
  }

  function start() {
    status = "loading";
    adapter.onFailure(fail);
    adapter.load().then(function (loaded) {
      if (status === "failed") return;
      maps = loaded;
      status = "ready";
      onChange();
    }).catch(fail);
  }

  function fail(error) {
    if (status === "failed") return;
    status = "failed";
    views.forEach(function (entry) { entry.node.setAttribute("data-state", "failed"); });
    console.warn("[portal] Google map unavailable, drawing the plan as an outline instead", error && error.message);
    onChange();
  }

  function draw(entry, plan) {
    var canvas = entry.canvas;
    var bounds = plan.bounds;
    var map = new maps.Map(canvas, {
      center: { lat: (bounds.north + bounds.south) / 2, lng: (bounds.east + bounds.west) / 2 },
      zoom: 18,
      mapTypeId: "hybrid",
      tilt: 0,
      disableDefaultUI: true,
      zoomControl: true,
      clickableIcons: false,
      gestureHandling: "cooperative",
    });
    entry.map = map;
    plan.elements.forEach(function (element) {
      var color = toneColor(element.tone);
      element.shapes.forEach(function (shape) { overlay(map, shape, color); });
    });
    var fit = function () { map.fitBounds(bounds, PLAN_PADDING); };
    fit();
    if (typeof scope.ResizeObserver !== "function") return;
    var size = "";
    new scope.ResizeObserver(function () {
      var measured = canvas.offsetWidth + "x" + canvas.offsetHeight;
      if (!canvas.offsetWidth || !canvas.offsetHeight || measured === size) return;
      size = measured;
      fit();
    }).observe(canvas);
  }

  function overlay(map, shape, color) {
    var paint = color ? { strokeColor: color, fillColor: color } : {};
    if (shape.kind === "area") {
      shape.polygons.forEach(function (rings) {
        new maps.Polygon(Object.assign({ map: map, paths: rings, strokeOpacity: 1, strokeWeight: 2, fillOpacity: 0.35, clickable: false }, paint));
      });
      return;
    }
    if (shape.kind === "line") {
      new maps.Polyline(Object.assign({ map: map, path: shape.path, strokeOpacity: 1, strokeWeight: 4, clickable: false }, color ? { strokeColor: color } : {}));
      return;
    }
    var circle = shape.kind === "circle";
    new maps.Circle(Object.assign({ map: map, center: circle ? shape.center : shape.position, radius: circle ? shape.radius : POINT_RADIUS_METERS, strokeOpacity: 1, strokeWeight: 2, fillOpacity: circle ? 0.35 : 1, clickable: false }, paint));
  }

  function toneColor(tone) {
    var root = scope.document && scope.document.documentElement;
    if (!root || typeof scope.getComputedStyle !== "function") return "";
    return String(scope.getComputedStyle(root).getPropertyValue(TONE_TOKENS[(tone - 1) % TONE_TOKENS.length]) || "").trim();
  }
}
