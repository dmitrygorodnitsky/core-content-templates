import { h } from "../../dom.js";
import { skel } from "../primitives/RouteStates.js";

var SVG = "http://www.w3.org/2000/svg";
var SCALE = 100000;
var METERS_PER_DEGREE = 111320;
var MIN_SPAN = 0.0002;
var PADDING = 0.08;

export function PropertyPlan(entry) {
  if (!entry || entry.status === "unavailable") return null;
  var card = h("section", { "class": "card card--pad prop-plan", "data-module": "property-plan", "data-visual-id": "property-plan", "data-state": entry.status, "aria-labelledby": "property-plan-title" }, [
    h("div", { "class": "prop-section__title", id: "property-plan-title" }, "Service plan"),
  ]);
  if (entry.status !== "ready") {
    card.setAttribute("aria-busy", "true");
    card.appendChild(skel("height:220px;border-radius:14px"));
    return card;
  }
  card.appendChild(planDrawing(entry.plan));
  card.appendChild(h("ul", { "class": "prop-plan__legend", "aria-label": "Plan elements" }, entry.plan.elements.map(function (element) {
    return h("li", { "class": "prop-plan__item" }, [
      h("span", { "class": "prop-plan__swatch", "data-tone": String(element.tone), "data-kind": element.kind, "aria-hidden": "true" }),
      h("span", { "class": "prop-plan__name" }, element.name || "Element " + element.position),
      element.areaText ? h("span", { "class": "prop-plan__size" }, element.areaText + " ft²") : null,
    ]);
  })));
  return card;
}

export function planDrawing(plan) {
  var frame = planFrame(plan.bounds);
  var svg = svgNode("svg", {
    "class": "prop-plan__drawing",
    viewBox: [frame.x, frame.y, frame.width, frame.height].map(round).join(" "),
    role: "img",
    "aria-label": "Plan drawing with " + plan.elements.length + (plan.elements.length === 1 ? " element" : " elements"),
  });
  plan.elements.forEach(function (element) {
    element.shapes.forEach(function (shape) {
      svg.appendChild(shapeNode(shape, element, frame));
    });
  });
  return svg;
}

function planFrame(bounds) {
  var cos = Math.cos((bounds.north + bounds.south) / 2 * Math.PI / 180);
  var width = Math.max((bounds.east - bounds.west) * cos, MIN_SPAN) * SCALE;
  var height = Math.max(bounds.north - bounds.south, MIN_SPAN) * SCALE;
  var centerX = (bounds.east - bounds.west) * cos * SCALE / 2;
  var centerY = (bounds.north - bounds.south) * SCALE / 2;
  var pad = Math.max(width, height) * PADDING;
  return {
    x: centerX - width / 2 - pad,
    y: centerY - height / 2 - pad,
    width: width + pad * 2,
    height: height + pad * 2,
    dot: Math.max(width, height) / 70,
    project: function (point) {
      return [(point.lng - bounds.west) * cos * SCALE, (bounds.north - point.lat) * SCALE];
    },
  };
}

function shapeNode(shape, element, frame) {
  var project = frame.project;
  var attributes = { "class": "prop-plan__shape", "data-tone": String(element.tone), "data-kind": shape.kind };
  if (shape.kind === "area") {
    attributes.d = shape.polygons.map(function (rings) {
      return rings.map(function (ring) { return "M" + ring.map(function (point) { return project(point).map(round).join(" "); }).join("L") + "Z"; }).join("");
    }).join("");
    attributes["fill-rule"] = "evenodd";
    return svgNode("path", attributes);
  }
  if (shape.kind === "line") {
    attributes.points = shape.path.map(function (point) { return project(point).map(round).join(","); }).join(" ");
    return svgNode("polyline", attributes);
  }
  var center = project(shape.kind === "circle" ? shape.center : shape.position);
  attributes.cx = round(center[0]);
  attributes.cy = round(center[1]);
  attributes.r = round(shape.kind === "circle" ? shape.radius / METERS_PER_DEGREE * SCALE : frame.dot);
  return svgNode("circle", attributes);
}

function svgNode(tag, attributes) {
  var node = document.createElementNS(SVG, tag);
  Object.keys(attributes).forEach(function (name) { node.setAttribute(name, String(attributes[name])); });
  return node;
}

function round(value) {
  return Math.round(value * 10) / 10;
}
