// customer-portal/runtime/src/routes/CalendarPage.js — production transfer module.
import { F } from "../../data/fixtures.js";
import { h } from "../dom.js";
import { activeProfile, buildCalendarGrid, state } from "../state.js";
import { OrderCard } from "../components/orders/OrderCard.js";
import { StormCalendar } from "../components/storm/StormCalendar.js";

export function Calendar() {
  if (activeProfile().weatherCalendar) return StormCalendar();
  return MonthCalendar();
}

export function MonthCalendar() {
  var page = h("section", { "class": "page", style: "max-width:920px", "data-route": "calendar", "data-visual-id": "calendar" });
  page.appendChild(h("div", { "class": "section-head" }, [
    h("div", { "class": "section-head__title" }, "Calendar"),
    h("div", { "class": "section-head__sub" }, "Every upcoming and past service, at a glance.")
  ]));

  var cal = h("div", { "class": "cal-card", "data-module": "calendar-grid", "data-visual-id": "calendar-grid" });
  cal.appendChild(h("div", { "class": "cal-nav" }, [
    h("div", { "class": "cal-nav__btn", "data-action": "calendar.prev", "aria-label": "Previous month" }, "\u2039"),
    h("div", { "class": "cal-month" }, F.MONTHS[state.calMonth] + " " + state.calYear),
    h("div", { "class": "cal-nav__btn", "data-action": "calendar.next", "aria-label": "Next month" }, "\u203a")
  ]));
  cal.appendChild(h("div", { "class": "cal-weekdays" }, ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(function (d) {
    return h("div", { "class": "cal-weekday" }, d);
  })));
  var grid = h("div", { "class": "cal-grid" });
  buildCalendarGrid(state.calYear, state.calMonth).forEach(function (c) {
    if (c.empty) { grid.appendChild(h("div")); return; }
    var isToday = state.calYear === 2026 && state.calMonth === 0 && c.day === 15;
    var cell = h("div", { "class": "cal-cell" + (c.events.length ? " cal-cell--has" : "") + (isToday ? " cal-cell--today" : ""), "data-module": "calendar-cell" },
      [h("div", { "class": "cal-day" }, String(c.day))]);
    var dots = h("div", { "class": "cal-dots" });
    c.events.forEach(function (e) {
      var color = e.status === "completed" ? "#1f8a44" : e.status === "inprogress" ? "#ff9f0a" : "var(--accent)";
      dots.appendChild(h("span", { "class": "cal-dot", style: "background:" + color }));
    });
    cell.appendChild(dots);
    if (c.events.length) { cell.setAttribute("data-action", "order.open"); cell.setAttribute("data-id", c.events[0].id); }
    grid.appendChild(cell);
  });
  cal.appendChild(grid);
  page.appendChild(cal);

  var upcoming = state.orders.filter(function (o) { return o.status !== "completed"; }).sort(sortByDateAsc);
  var past = state.orders.filter(function (o) { return o.status === "completed"; }).sort(sortByDateDesc);
  page.appendChild(h("div", { "class": "cal-lists" }, [
    calList("Upcoming", upcoming), calList("Past", past)
  ]));
  return page;
}

export function sortByDateAsc(a, b) { return (a.y - b.y) || (a.m - b.m) || (a.d - b.d); }

export function sortByDateDesc(a, b) { return (b.y - a.y) || (b.m - a.m) || (b.d - a.d); }

export function calList(title, orders) {
  var list = h("div", { "class": "cal-list", "data-module": "order-list" }, [h("div", { "class": "cal-list__title" }, title)]);
  if (orders.length === 0) list.appendChild(h("div", { style: "padding:14px 12px;font-size:13px;color:var(--ink-2)" }, "Nothing here."));
  else orders.forEach(function (o) { list.appendChild(OrderCard(o)); });
  return list;
}
