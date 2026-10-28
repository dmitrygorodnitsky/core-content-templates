import { h } from "../dom.js";
import { liveListStatus, liveProperties, liveVisits, state } from "../state.js";
import { EmptyState } from "../components/primitives/EmptyState.js";
import { ErrorState } from "../components/primitives/ErrorState.js";
import { UnauthorizedState, skel } from "../components/primitives/RouteStates.js";
import { PageHeader } from "../components/shell/PageHeader.js";
import { RecordSection, VisitRow } from "../components/storm/RecordRows.js";
import { findVisit, localDateKey, visitDay, visitImageUrl, visitPlace, visitWindow } from "../normalizers/visits.js";

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
  var today = localDateKey(new Date());
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

  var today = localDateKey(new Date());
  var place = visitPlace(visit, liveProperties());
  page.setAttribute("data-state", visit.stateCode.toLowerCase());
  page.appendChild(h("div", { "class": "prop-head" }, [
    h("div", { style: "flex:1;min-width:0" }, [
      h("h1", { "class": "prop-head__title" }, visitDay(visit, today)),
      h("div", { "class": "prop-head__addr", "data-module": "visit-when" }, [visitWindow(visit), place].filter(Boolean).join(" · ")),
    ]),
    h("span", { "class": "status-badge status-badge--" + visit.status.tone }, visit.status.label),
  ]));

  if (visit.completionNotes) {
    page.appendChild(h("section", { "class": "card card--pad record-section", "data-module": "visit-notes", "data-visual-id": "visit-notes" }, [
      h("h2", { "class": "prop-section__title" }, "Completion notes"),
      h("p", { "class": "record-notes" }, visit.completionNotes),
    ]));
  }

  var photos = [photoGroup("Before", visit.before), photoGroup("After", visit.after)].filter(Boolean);
  if (photos.length) {
    page.appendChild(h("section", { "class": "card card--pad record-section", "data-module": "visit-photos", "data-visual-id": "visit-photos" }, [
      h("h2", { "class": "prop-section__title" }, "Photos"),
    ].concat(photos)));
  }
  return page;
}

function photoGroup(label, ids) {
  var urls = ids.map(function (id) { return visitImageUrl(state.config.coreApiBase, id); }).filter(Boolean);
  if (!urls.length) return null;
  return h("div", { "class": "record-photos", "data-module": "visit-photos-" + label.toLowerCase() }, [
    h("div", { "class": "record-photos__label" }, label),
    h("div", { "class": "record-photos__grid" }, urls.map(function (url, index) {
      return h("a", { "class": "record-photos__item", href: url, target: "_blank", rel: "noopener" }, [
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
