// customer-portal/runtime/src/dom.js — production transfer module.
import { EmptyState } from "./components/primitives/EmptyState.js";
import { ErrorState } from "./components/primitives/ErrorState.js";

export function h(tag, attrs, children) {
  var el = document.createElement(tag);
  if (attrs) Object.keys(attrs).forEach(function (k) {
    var v = attrs[k];
    if (v == null || v === false) return;
    if (k === "class") el.className = v;
    else if (k === "html") el.innerHTML = v;
    else if (k === "style") el.setAttribute("style", v);
    else if (k === "text") el.textContent = v;
    else el.setAttribute(k, v === true ? "" : v);
  });
  if (children != null) (Array.isArray(children) ? children : [children]).forEach(function (c) {
    if (c == null || c === false) return;
    el.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
  });
  return el;
}

export function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

export function svgPath() {
  var ns = "http://www.w3.org/2000/svg";
  var svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 600 210");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("class", "tracking-map__path");
  var p = document.createElementNS(ns, "path");
  p.setAttribute("d", "M40 180 C 160 150, 200 60, 330 80 S 520 70, 560 36");
  p.setAttribute("fill", "none"); p.setAttribute("stroke", "var(--accent)");
  p.setAttribute("stroke-width", "3"); p.setAttribute("stroke-dasharray", "8 8"); p.setAttribute("opacity", ".55");
  svg.appendChild(p);
  return svg;
}

/* EmptyState / ErrorState / LoadingState */
