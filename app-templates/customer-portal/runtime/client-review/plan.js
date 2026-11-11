(function (global) {
  "use strict";

  var ns = global.ClientReview || (global.ClientReview = {});

  var EARTH_RADIUS_METERS = 6378137;
  var SQUARE_FOOT_IN_SQUARE_METERS = 0.09290304;
  var MAP_SURFACE = "GOOGLE_MAPS";
  var TONES = 5;
  var SVG_NAMESPACE = "http://www.w3.org/2000/svg";
  var DRAWING_SCALE = 100000;
  var DRAWING_MIN_SPAN = 0.0002;
  var DRAWING_PADDING = 0.08;
  var DRAWING_MIN_ASPECT = 16 / 9;
  var DRAWING_MAX_ASPECT = 5 / 2;
  var DRAWING_DOT = 1 / 70;
  var METERS_PER_DEGREE = 111320;
  var AREA_TOLERANCE_SQUARE_FEET = 1;

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

  function sumsTo(plan, squareFeet) {
    return Boolean(plan) && finite(squareFeet) && squareFeet > 0 && Math.abs(plan.squareFeet - squareFeet) <= AREA_TOLERANCE_SQUARE_FEET;
  }

  function frameOf(bounds) {
    var cos = Math.cos(radians((bounds.north + bounds.south) / 2));
    var spanX = (bounds.east - bounds.west) * cos * DRAWING_SCALE;
    var spanY = (bounds.north - bounds.south) * DRAWING_SCALE;
    var minimum = DRAWING_MIN_SPAN * DRAWING_SCALE;
    var reach = Math.max(spanX, spanY, minimum);
    var width = Math.max(spanX, minimum) + reach * DRAWING_PADDING * 2;
    var height = Math.max(spanY, minimum) + reach * DRAWING_PADDING * 2;
    if (width / height < DRAWING_MIN_ASPECT) width = height * DRAWING_MIN_ASPECT;
    if (width / height > DRAWING_MAX_ASPECT) height = width / DRAWING_MAX_ASPECT;
    return {
      x: spanX / 2 - width / 2,
      y: spanY / 2 - height / 2,
      width: width,
      height: height,
      dot: reach * DRAWING_DOT,
      project: function (point) {
        return [(point.lng - bounds.west) * cos * DRAWING_SCALE, (bounds.north - point.lat) * DRAWING_SCALE];
      },
    };
  }

  function svgNode(doc, tag, attributes) {
    var node = doc.createElementNS(SVG_NAMESPACE, tag);
    Object.keys(attributes).forEach(function (name) { node.setAttribute(name, String(attributes[name])); });
    return node;
  }

  function shapeNode(doc, shape, element, frame, prefix) {
    var attributes = { "class": prefix + "__shape", "data-tone": String(element.tone), "data-kind": shape.kind };
    if (shape.kind === "area") {
      attributes.d = shape.polygons.map(function (rings) {
        return rings.map(function (ring) { return "M" + ring.map(function (point) { return frame.project(point).join(" "); }).join("L") + "Z"; }).join("");
      }).join("");
      attributes["fill-rule"] = "evenodd";
      return svgNode(doc, "path", attributes);
    }
    if (shape.kind === "line") {
      attributes.points = shape.path.map(function (point) { return frame.project(point).join(","); }).join(" ");
      return svgNode(doc, "polyline", attributes);
    }
    var center = frame.project(shape.kind === "circle" ? shape.center : shape.position);
    attributes.cx = center[0];
    attributes.cy = center[1];
    attributes.r = shape.kind === "circle" ? shape.radius / METERS_PER_DEGREE * DRAWING_SCALE : frame.dot;
    return svgNode(doc, "circle", attributes);
  }

  function ringCentre(ring, frame) {
    var points = ring.map(frame.project);
    var twice = 0;
    var x = 0;
    var y = 0;
    points.forEach(function (here, index) {
      var next = points[(index + 1) % points.length];
      var cross = here[0] * next[1] - next[0] * here[1];
      twice += cross;
      x += (here[0] + next[0]) * cross;
      y += (here[1] + next[1]) * cross;
    });
    return { weight: Math.abs(twice) / 2, point: twice ? [x / (3 * twice), y / (3 * twice)] : points[0] };
  }

  function labelPoint(element, frame) {
    var best = null;
    element.shapes.forEach(function (shape) {
      var candidates = [];
      if (shape.kind === "circle") {
        var reach = shape.radius / METERS_PER_DEGREE * DRAWING_SCALE;
        candidates.push({ weight: Math.PI * reach * reach, point: frame.project(shape.center) });
      } else if (shape.kind === "area") {
        shape.polygons.forEach(function (rings) { candidates.push(ringCentre(rings[0], frame)); });
      }
      candidates.forEach(function (candidate) {
        if (!best || candidate.weight > best.weight) best = candidate;
      });
    });
    return best ? best.point : null;
  }

  function percent(value) {
    return Math.min(Math.max(value, 0), 1) * 100 + "%";
  }

  function figure(doc, plan, options) {
    var settings = options || {};
    var prefix = settings.classPrefix;
    var frame = frameOf(plan.bounds);
    var node = doc.createElement("div");
    node.className = prefix + "__figure";
    var svg = svgNode(doc, "svg", {
      "class": prefix + "__drawing",
      viewBox: [frame.x, frame.y, frame.width, frame.height].join(" "),
      role: "img",
      "aria-label": settings.label || "",
    });
    plan.elements.forEach(function (element) {
      element.shapes.forEach(function (shape) { svg.appendChild(shapeNode(doc, shape, element, frame, prefix)); });
    });
    node.appendChild(svg);
    var labels = 0;
    plan.elements.forEach(function (element) {
      var point = labelPoint(element, frame);
      var name = typeof settings.nameOf === "function" ? settings.nameOf(element) : element.name;
      if (!point || !name) return;
      var label = doc.createElement("span");
      label.className = prefix + "__label";
      label.setAttribute("data-tone", String(element.tone));
      label.setAttribute("aria-hidden", "true");
      label.style.left = percent((point[0] - frame.x) / frame.width);
      label.style.top = percent((point[1] - frame.y) / frame.height);
      label.textContent = name;
      node.appendChild(label);
      labels += 1;
    });
    node.setAttribute("data-labels", String(labels));
    return node;
  }

  ns.plan = Object.freeze({
    tones: TONES,
    parse: parse,
    formatArea: formatArea,
    sumsTo: sumsTo,
    figure: figure,
  });
})(typeof window !== "undefined" ? window : globalThis);
