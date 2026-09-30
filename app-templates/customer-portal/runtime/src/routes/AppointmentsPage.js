import { h } from "../dom.js";
import { currentOverview, state } from "../state.js";
import { EmptyState } from "../components/primitives/EmptyState.js";
import { PageHeader } from "../components/shell/PageHeader.js";
import { appointmentRows, filterRows, resourceNames, sortRows, stateMeta } from "../normalizers/appointments.js";

var COLUMNS = [
  { key: "resource", label: "Resource", sortable: true },
  { key: "address", label: "Address" },
  { key: "state", label: "Appointment state" },
  { key: "est", label: "Est time" },
  { key: "actual", label: "Actual time" },
];

export function Appointments() {
  var page = h("section", { "class": "page", "data-route": "appointments", "data-visual-id": "appointments" });
  var model = currentOverview();
  var timeline = (model && model.weather && model.weather.timeline) || [];
  var all = appointmentRows(model && model.properties, timeline);

  page.appendChild(PageHeader({
    title: "Appointments timeline",
    sub: subline(all, timeline),
  }));

  if (!all.length) {
    page.appendChild(EmptyState({
      glyph: "◌",
      title: "No appointments yet",
      desc: "Visits appear here once a storm trigger dispatches a crew.",
    }));
    return page;
  }

  var day = state.apptDay;
  var direction = state.apptSort === "desc" ? "desc" : "asc";
  var rows = sortRows(filterRows(all, day), direction);

  page.appendChild(Filters(all, timeline, day));

  var card = h("div", { "class": "card card--pad appt", "data-module": "appointments-table", "data-visual-id": "appointments-table" });
  if (!rows.length) {
    card.appendChild(h("div", { "class": "appt__empty" }, [
      text("div", "ov-empty__title", "No visits on this day"),
      text("div", "ov-empty__desc", "Pick another date, or clear the filter to see the whole week."),
      h("div", { "class": "link-action", "data-action": "appointments.filterDay", "data-id": "" }, "Show all dates ›"),
    ]));
    page.appendChild(card);
    return page;
  }

  card.appendChild(Table(rows, direction));
  page.appendChild(card);
  page.appendChild(text("div", "appt__count", rows.length === all.length
    ? String(all.length) + (all.length === 1 ? " appointment" : " appointments")
    : String(rows.length) + " of " + all.length + " appointments"));
  return page;
}

function subline(rows, timeline) {
  var span = timeline.length ? timeline[0].date + " – " + timeline[timeline.length - 1].date : "";
  var resources = resourceNames(rows).length;
  return span
    ? span + " · " + resources + (resources === 1 ? " resource" : " resources")
    : resources + (resources === 1 ? " resource" : " resources");
}

function Filters(rows, timeline, day) {
  var chips = [dayChip("All dates", "", day === null || day === undefined || day === "")];
  timeline.forEach(function (frame, index) {
    var count = rows.filter(function (row) { return row.dayIndex === index; }).length;
    if (!count) return;
    chips.push(dayChip(frame.day + " " + frame.date, String(index), String(day) === String(index), count));
  });

  return h("div", { "class": "appt-filters", "data-module": "appointment-filters", "data-visual-id": "appointment-filters" }, [
    text("span", "appt-filters__label", "Date"),
    h("div", { "class": "appt-filters__chips", role: "group", "aria-label": "Filter appointments by date" }, chips),
  ]);
}

function dayChip(label, id, active, count) {
  return h("button", {
    "class": "appt-chip" + (active ? " appt-chip--on" : ""),
    "data-action": "appointments.filterDay", "data-id": id,
    "aria-pressed": active ? "true" : "false",
  }, count ? [text("span", "", label), text("span", "appt-chip__count", String(count))] : [text("span", "", label)]);
}

function Table(rows, direction) {
  var head = h("tr", null, COLUMNS.map(function (column) {
    if (!column.sortable) return h("th", { scope: "col" }, column.label);
    return h("th", { scope: "col", "aria-sort": direction === "desc" ? "descending" : "ascending" }, [
      h("button", {
        "class": "appt__sort", "data-action": "appointments.sortResource",
        "aria-label": "Sort by resource, currently " + (direction === "desc" ? "descending" : "ascending"),
      }, [text("span", "", column.label), text("span", "appt__caret", direction === "desc" ? "↓" : "↑")]),
    ]);
  }));

  var body = h("tbody", null, rows.map(function (row) {
    var meta = stateMeta(row.state);
    return h("tr", { "data-module": "appointment-row", "data-visual-id": "appointment-row", "data-state": row.state.toLowerCase() }, [
      h("td", null, [
        text("div", "appt__resource", row.resource),
        row.day ? text("div", "appt__sub", row.day) : null,
      ]),
      h("td", null, [
        h("button", { "class": "appt__link", "data-action": "appointments.openProperty", "data-id": row.id,
          "aria-label": "Open " + row.name }, [
          text("span", "appt__name", row.name),
          text("span", "appt__sub", row.address),
        ]),
      ]),
      h("td", null, [
        h("button", { "class": "appt__link", "data-action": "appointments.openVisit", "data-id": row.id,
          "aria-label": "Open the " + row.service + " visit at " + row.name }, [
          text("span", "status-badge status-badge--" + meta.tone, meta.label),
          text("span", "appt__sub", row.service),
        ]),
      ]),
      h("td", { "class": "appt__time" }, row.est || "—"),
      h("td", { "class": "appt__time" }, row.actual || "—"),
    ]);
  }));

  return h("div", { "class": "appt__scroll" }, [
    h("table", { "class": "appt__table" }, [h("thead", null, [head]), body]),
  ]);
}

function text(tag, className, value) {
  return h(tag, className ? { "class": className } : null, value == null ? "" : String(value));
}
