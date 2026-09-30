import { h } from "../dom.js";
import { currentOverview, state } from "../state.js";
import { EmptyState } from "../components/primitives/EmptyState.js";
import { appointmentRows, stateMeta } from "../normalizers/appointments.js";

export function currentVisit() {
  var model = currentOverview();
  var timeline = (model && model.weather && model.weather.timeline) || [];
  var rows = appointmentRows(model && model.properties, timeline);
  return rows.find(function (row) { return row.id === state.visitId; }) || null;
}

export function VisitDetail() {
  var page = h("section", { "class": "page page--narrow", "data-route": "visit.detail", "data-visual-id": "visit-detail" });
  var visit = currentVisit();

  page.appendChild(h("div", { "class": "detail-back", "data-action": "nav.go", "data-id": "appointments" }, "‹ Back to appointments"));

  if (!visit) {
    page.appendChild(EmptyState({ glyph: "◌", title: "Visit not found", desc: "This visit is no longer on the schedule." }));
    return page;
  }

  var meta = stateMeta(visit.state);
  page.appendChild(h("div", { "class": "prop-head", "data-state": visit.state.toLowerCase() }, [
    h("div", { style: "flex:1;min-width:0" }, [
      text("h1", "prop-head__title", visit.service),
      text("div", "prop-head__addr", visit.day),
    ]),
    text("span", "status-badge status-badge--" + meta.tone, meta.label),
  ]));

  page.appendChild(h("div", { "class": "card card--pad prop-facts", "data-module": "visit-facts", "data-visual-id": "visit-facts" }, [
    fact("Resource", visit.resource),
    fact("Property", visit.name, "appointments.openProperty", visit.id),
    fact("Address", visit.address),
    fact("Estimated", visit.est || "—"),
    fact("Actual", visit.actual || "Not started"),
  ]));

  return page;
}

function fact(label, value, action, id) {
  return h("div", { "class": "prop-fact" }, [
    text("div", "prop-fact__label", label),
    action
      ? h("div", { "class": "link-action prop-fact__value", "data-action": action, "data-id": id }, value + " ›")
      : text("div", "prop-fact__value", value),
  ]);
}

function text(tag, className, value) {
  return h(tag, className ? { "class": className } : null, value == null ? "" : String(value));
}
