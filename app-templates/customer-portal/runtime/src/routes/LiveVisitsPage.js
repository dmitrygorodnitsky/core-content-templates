import { h } from "../dom.js";
import { render } from "../app.js";
import { isModuleEnabled, liveListStatus, liveProperties, liveVisits, quotePackage, state } from "../state.js";
import { EmptyState } from "../components/primitives/EmptyState.js";
import { ErrorState } from "../components/primitives/ErrorState.js";
import { UnauthorizedState, skel } from "../components/primitives/RouteStates.js";
import { PageHeader } from "../components/shell/PageHeader.js";
import { PropertyPlan } from "../components/storm/PropertyPlan.js";
import { RecordSection, VisitRow } from "../components/storm/RecordRows.js";
import { activeServiceNames } from "../normalizers/contracts.js";
import { formatArea } from "../normalizers/overview.js";
import { findVisit, localDateKey, progressWhen, visitDay, visitImageUrl, visitPlace, visitWindow } from "../normalizers/visits.js";
import { propertyPlan } from "../property-plan.js";
import { visitProgress } from "../visit-progress.js";
import { VISIT_PHOTO_ACTION } from "../visit-photo-viewer.js";

export function LiveVisits() {
  var page = h("section", { "class": "page page--narrow", "data-route": "appointments", "data-visual-id": "visits" });
  page.appendChild(PageHeader({ title: "Visits" }));
  var status = liveListStatus("appointmentsTimeline");
  page.setAttribute("data-state", status);
  if (status !== "ready") {
    page.appendChild(listState(status));
    return page;
  }
  var visits = liveVisits();
  var today = localDateKey(new Date(), state.config.timeZone);
  var properties = liveProperties();
  var row = function (visit) { return VisitRow(visit, { today: today, place: visitPlace(visit, properties) }); };
  if (visits.upcoming.length) page.appendChild(RecordSection("visits-upcoming", "Upcoming", visits.upcoming.map(row)));
  if (visits.past.length) page.appendChild(RecordSection("visits-past", "Past", visits.past.map(row)));
  return page;
}

export function LiveVisitDetail() {
  var page = h("section", { "class": "page page--narrow", "data-route": "visit.detail", "data-visual-id": "visit-detail" });
  page.appendChild(h("div", { "class": "detail-back", "data-action": "nav.go", "data-id": "appointments" }, "‹ Back to visits"));
  var status = liveListStatus("appointmentsTimeline");
  var visit = status === "ready" ? findVisit(liveVisits(), state.visitId) : null;
  if (!visit) {
    page.setAttribute("data-state", status === "ready" || status === "empty" ? "not-found" : status);
    page.appendChild(status === "ready" || status === "empty"
      ? EmptyState({ glyph: "◌", title: "Visit not found", desc: "This visit is not on your schedule." })
      : listState(status));
    return page;
  }

  var today = localDateKey(new Date(), state.config.timeZone);
  var property = liveProperties().find(function (item) { return item.backendId === visit.propertyBackendId; }) || null;
  page.setAttribute("data-state", visit.stateCode.toLowerCase());
  page.appendChild(h("div", { "class": "prop-head" }, [
    h("div", { style: "flex:1;min-width:0" }, [
      h("h1", { "class": "prop-head__title" }, visitDay(visit, today)),
      h("div", { "class": "prop-head__addr", "data-module": "visit-when" }, visitWindow(visit)),
    ]),
    h("span", { "class": "status-badge status-badge--" + visit.status.tone }, visit.status.label),
  ]));

  if (property) {
    page.appendChild(PropertyFacts(property));
    var plan = PropertyPlan(propertyPlan(property.planId, render));
    if (plan) page.appendChild(plan);
    var services = ServicesCard(property);
    if (services) page.appendChild(services);
  }
  var progress = ProgressCard(visit);
  if (progress) page.appendChild(progress);

  if (visit.completionNotes) {
    page.appendChild(h("section", { "class": "card card--pad record-section", "data-module": "visit-notes", "data-visual-id": "visit-notes" }, [
      h("h2", { "class": "prop-section__title" }, "Completion notes"),
      h("p", { "class": "record-notes" }, visit.completionNotes),
    ]));
  }

  var photos = photoGroups([["Before", visit.before], ["After", visit.after]]);
  if (photos.length) {
    page.appendChild(h("section", { "class": "card card--pad record-section", "data-module": "visit-photos", "data-visual-id": "visit-photos" }, [
      h("h2", { "class": "prop-section__title" }, "Photos"),
    ].concat(photos)));
  }
  return page;
}

function PropertyFacts(property) {
  var area = formatArea(property.areaSqft);
  return h("section", { "class": "card card--pad prop-facts", "data-module": "visit-property", "data-visual-id": "visit-property" }, [
    h("div", { "class": "prop-fact", "data-fact": "property" }, [
      h("div", { "class": "prop-fact__label" }, "Property"),
      h("a", { "class": "link-action prop-fact__value", href: "#/properties/" + encodeURIComponent(property.id), "data-visual-id": "visit-property-link" }, (property.address || property.name) + " ›"),
    ]),
    area ? h("div", { "class": "prop-fact", "data-fact": "area" }, [
      h("div", { "class": "prop-fact__label" }, "Area"),
      h("div", { "class": "prop-fact__value" }, area),
    ]) : null,
  ]);
}

function ServicesCard(property) {
  if (!isModuleEnabled("proposals")) return null;
  var names = activeServiceNames(quotePackage(), property.backendId);
  if (!names.length) return null;
  return h("section", { "class": "card card--pad record-section", "data-module": "visit-services", "data-visual-id": "visit-services" }, [
    h("h2", { "class": "prop-section__title" }, "Services"),
    h("ul", { "class": "prop-service__lines", "aria-label": "Services" }, names.map(function (name) {
      return h("li", { "class": "prop-service__line" }, name);
    })),
  ]);
}

function ProgressCard(visit) {
  var entry = visitProgress(visit, render);
  if (!entry || entry.status !== "ready" || !entry.steps.length) return null;
  return h("section", { "class": "card card--pad record-section", "data-module": "visit-progress", "data-visual-id": "visit-progress" }, [
    h("h2", { "class": "prop-section__title" }, "Progress"),
    h("div", { "class": "timeline" }, [h("div", { "class": "timeline__line" })].concat(entry.steps.map(function (step) {
      return h("div", { "class": "timeline-step", "data-module": "visit-progress-step", "data-state": step.code.toLowerCase() }, [
        h("div", { "class": "timeline-step__dot", style: "background:" + (step.code === "COMPLETED" ? "var(--ok)" : "var(--accent)") }),
        h("div", { "class": "timeline-step__title" }, step.label + " · " + progressWhen(step, visit, state.config.timeZone)),
      ]);
    }))),
  ]);
}

function photoGroups(groups) {
  var offset = 0;
  return groups.map(function (group) {
    var urls = group[1].map(function (id) { return visitImageUrl(state.config.coreApiBase, id); }).filter(Boolean);
    var element = urls.length ? photoGroup(group[0], urls, offset) : null;
    offset += urls.length;
    return element;
  }).filter(Boolean);
}

function photoGroup(label, urls, offset) {
  return h("div", { "class": "record-photos", "data-module": "visit-photos-" + label.toLowerCase() }, [
    h("div", { "class": "record-photos__label" }, label),
    h("div", { "class": "record-photos__grid" }, urls.map(function (url, index) {
      return h("a", { "class": "record-photos__item", href: url, "data-action": VISIT_PHOTO_ACTION, "data-id": String(offset + index), "data-caption": label, "aria-haspopup": "dialog" }, [
        h("img", { src: url, alt: label + " service photo " + (index + 1), loading: "lazy", decoding: "async" }),
      ]);
    })),
  ]);
}

function listState(status) {
  if (status === "loading") {
    return h("div", { "data-module": "visits-loading", "data-visual-id": "visits-loading", "aria-busy": "true" }, [
      skel("height:72px;border-radius:16px;margin-bottom:12px"),
      skel("height:72px;border-radius:16px;margin-bottom:12px"),
      skel("height:72px;border-radius:16px"),
    ]);
  }
  if (status === "unauthorized") return UnauthorizedState({ scope: "these visits", backRoute: state.config.defaultRoute });
  if (status === "error") return ErrorState({ title: "Couldn’t load your visits", desc: "Nothing was changed. Check your connection and try again." });
  return EmptyState({ glyph: "◌", title: "No visits yet", desc: "Your scheduled and completed visits appear here." });
}
