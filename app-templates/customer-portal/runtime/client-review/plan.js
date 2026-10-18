(function (global) {
  "use strict";

  var ns = global.ClientReview || (global.ClientReview = {});

  var EARTH_RADIUS_METERS = 6378137;
  var SQUARE_FOOT_IN_SQUARE_METERS = 0.09290304;
  var MAP_SURFACE = "GOOGLE_MAPS";
  var TONES = 5;

  function finite(value) {
    return typeof value === "number" && isFinite(value);
  }

  function radians(degrees) {
    return degrees * Math.PI / 180;
  }

  function position(value) {
    if (!Array.isArray(value) || value.length < 2 || value.length > 3) return null;
    var lng = value[0];
    var lat = value[1];
    if (!finite(lng) || !finite(lat) || Math.abs(lng) > 180 || Math.abs(lat) > 90) return null;
    if (value.length === 3 && !finite(value[2])) return null;
    return { lat: lat, lng: lng };
  }

  function path(value, minimum) {
    if (!Array.isArray(value) || value.length < minimum) return null;
    var points = [];
    for (var index = 0; index < value.length; index += 1) {
      var point = position(value[index]);
      if (!point) return null;
      points.push(point);
    }
    return points;
  }

  function polygon(value) {
    if (!Array.isArray(value) || !value.length) return null;
    var rings = [];
    for (var index = 0; index < value.length; index += 1) {
      var ring = path(value[index], 4);
      if (!ring) return null;
      rings.push(ring);
    }
    return rings;
  }

  function shapeOf(geometry) {
    if (!geometry || typeof geometry !== "object") return null;
    var coordinates = geometry.coordinates;
    if (geometry.type === "Point") {
      var point = position(coordinates);
      return point ? { kind: "point", position: point } : null;
    }
    if (geometry.type === "LineString") {
      var line = path(coordinates, 2);
      return line ? { kind: "line", path: line } : null;
    }
    if (geometry.type === "Polygon") {
      var single = polygon(coordinates);
      return single ? { kind: "area", polygons: [single] } : null;
    }
    if (geometry.type === "MultiPolygon") {
      if (!Array.isArray(coordinates) || !coordinates.length) return null;
      var polygons = [];
      for (var index = 0; index < coordinates.length; index += 1) {
        var part = polygon(coordinates[index]);
        if (!part) return null;
        polygons.push(part);
      }
      return { kind: "area", polygons: polygons };
    }
    if (geometry.type === "Circle") {
      var center = position(coordinates);
      return center && finite(geometry.radius) && geometry.radius > 0 ? { kind: "circle", center: center, radius: geometry.radius } : null;
    }
    return null;
  }

  function projector(origin) {
    var scale = Math.cos(radians(origin.lat));
    return function (point) {
      return [EARTH_RADIUS_METERS * radians(point.lng - origin.lng) * scale, EARTH_RADIUS_METERS * radians(point.lat - origin.lat)];
    };
  }

  function ringArea(ring, project) {
    var twice = 0;
    ring.forEach(function (point, index) {
      var here = project(point);
      var next = project(ring[(index + 1) % ring.length]);
      twice += here[0] * next[1] - next[0] * here[1];
    });
    return Math.abs(twice) / 2;
  }

  function polygonArea(rings, project) {
    var holes = 0;
    rings.slice(1).forEach(function (ring) { holes += ringArea(ring, project); });
    return Math.max(0, ringArea(rings[0], project) - holes);
  }

  function shapeArea(shape) {
    if (shape.kind === "circle") return Math.PI * shape.radius * shape.radius;
    if (shape.kind !== "area") return 0;
    var project = projector(shape.polygons[0][0][0]);
    var area = 0;
    shape.polygons.forEach(function (rings) { area += polygonArea(rings, project); });
    return area;
  }

  function shapePoints(shape) {
    if (shape.kind === "point") return [shape.position];
    if (shape.kind === "line") return shape.path;
    if (shape.kind === "circle") {
      var latSpan = shape.radius / EARTH_RADIUS_METERS * 180 / Math.PI;
      var lngSpan = latSpan / Math.max(Math.cos(radians(shape.center.lat)), 0.01);
      return [
        { lat: shape.center.lat + latSpan, lng: shape.center.lng + lngSpan },
        { lat: shape.center.lat - latSpan, lng: shape.center.lng - lngSpan },
      ];
    }
    var points = [];
    shape.polygons.forEach(function (rings) { points = points.concat(rings[0]); });
    return points;
  }

  function boundsOf(elements) {
    var bounds = { north: -90, south: 90, east: -180, west: 180 };
    elements.forEach(function (element) {
      element.shapes.forEach(function (shape) {
        shapePoints(shape).forEach(function (point) {
          bounds.north = Math.max(bounds.north, point.lat);
          bounds.south = Math.min(bounds.south, point.lat);
          bounds.east = Math.max(bounds.east, point.lng);
          bounds.west = Math.min(bounds.west, point.lng);
        });
      });
    });
    return bounds;
  }

  function nameOf(element, locale) {
    var localized = ns.normalizer && typeof ns.normalizer.localizedName === "function" ? ns.normalizer.localizedName(element.nls, locale) : "";
    var label = typeof element.label === "string" ? element.label.replace(/\s+/g, " ").trim() : "";
    return localized || label;
  }

  function parse(raw, locale) {
    if (!raw || typeof raw !== "object" || raw.type !== "PropertyPlan" || raw.schemaVersion !== 1 || !Array.isArray(raw.elements)) return null;
    var tones = {};
    var toneCount = 0;
    var elements = [];
    var area = 0;
    raw.elements.forEach(function (element) {
      if (!element || typeof element !== "object" || !Array.isArray(element.overlays)) return;
      var shapes = [];
      element.overlays.forEach(function (overlay) {
        if (!overlay || typeof overlay !== "object" || overlay.map !== MAP_SURFACE) return;
        var shape = shapeOf(overlay.geometry);
        if (shape) shapes.push(shape);
      });
      if (!shapes.length) return;
      var type = "type-" + String(element.elementTypeDictionaryId);
      if (!Object.prototype.hasOwnProperty.call(tones, type)) {
        tones[type] = toneCount % TONES + 1;
        toneCount += 1;
      }
      var elementArea = 0;
      shapes.forEach(function (shape) { elementArea += shapeArea(shape); });
      area += elementArea;
      var kind = shapes[0].kind === "circle" ? "area" : shapes[0].kind;
      var squareFeet = elementArea / SQUARE_FOOT_IN_SQUARE_METERS;
      elements.push({
        key: "element-" + (elements.length + 1),
        position: elements.length + 1,
        name: nameOf(element, locale),
        tone: tones[type],
        kind: kind,
        shapes: shapes,
        squareFeet: squareFeet,
        areaText: kind === "area" ? formatArea(squareFeet, locale) : "",
      });
    });
    if (!elements.length) return null;
    var planSquareFeet = area / SQUARE_FOOT_IN_SQUARE_METERS;
    return { elements: elements, squareFeet: planSquareFeet, areaText: formatArea(planSquareFeet, locale), bounds: boundsOf(elements) };
  }

  function formatArea(squareFeet, locale) {
    if (!finite(squareFeet) || squareFeet <= 0) return "";
    try {
      return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(squareFeet);
    } catch (_) {
      return new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(squareFeet);
    }
  }

  ns.plan = Object.freeze({
    tones: TONES,
    parse: parse,
    formatArea: formatArea,
  });
})(typeof window !== "undefined" ? window : globalThis);
