import "../../../client-review/plan.js";
import { h } from "../../dom.js";
import { skel } from "../primitives/RouteStates.js";

export function PropertyPlan(entry, property) {
  if (!entry || entry.status === "unavailable") return null;
  var card = h("section", { "class": "card card--pad prop-plan", "data-module": "property-plan", "data-visual-id": "property-plan", "data-state": entry.status, "aria-labelledby": "property-plan-title" }, [
    h("div", { "class": "prop-section__title", id: "property-plan-title" }, "Service plan"),
  ]);
  if (entry.status !== "ready") {
    card.setAttribute("aria-busy", "true");
    card.appendChild(skel("height:220px;border-radius:14px"));
    return card;
  }
  var sized = globalThis.ClientReview.plan.sumsTo(entry.plan, property ? property.areaSqft : null);
  card.appendChild(planDrawing(entry.plan));
  card.appendChild(h("ul", { "class": "prop-plan__legend", "aria-label": "Plan elements" }, entry.plan.elements.map(function (element) {
    return h("li", { "class": "prop-plan__item" }, [
      h("span", { "class": "prop-plan__swatch", "data-tone": String(element.tone), "data-kind": element.kind, "aria-hidden": "true" }),
      h("span", { "class": "prop-plan__name" }, elementName(element)),
      sized && element.areaText ? h("span", { "class": "prop-plan__size" }, element.areaText + " ft²") : null,
    ]);
  })));
  return card;
}

export function planDrawing(plan) {
  return globalThis.ClientReview.plan.figure(document, plan, {
    classPrefix: "prop-plan",
    label: "Plan drawing with " + plan.elements.length + (plan.elements.length === 1 ? " element" : " elements"),
    nameOf: elementName,
  });
}

function elementName(element) {
  return element.name || "Element " + element.position;
}
