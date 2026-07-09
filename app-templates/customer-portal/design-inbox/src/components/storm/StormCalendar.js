// customer-portal-design/src/components/storm/StormCalendar.js — presentation runtime (auto-split from app.js). No business logic.
import { F } from "../../../data/fixtures.js";
import { clear, h } from "../../dom.js";
import { state } from "../../state.js";
import { Calendar } from "../../routes/CalendarPage.js";

export function stormChip(status) {
  var map = {
    completed: ["status-badge--ok", "Completed"],
    onroute:   ["status-badge--info", "On route"],
    scheduled: ["status-badge--scheduled", "Scheduled"],
    skipped:   ["status-badge--scheduled", "Skipped"],
    delayed:   ["status-badge--warn", "Delayed"]
  };
  var m = map[status] || map.scheduled;
  return h("span", { "class": "status-badge " + m[0], "data-module": "status-badge", "data-bind": "event.status", "data-state": status }, m[1]);
}
var stormWeatherLabel = { served: "Storm served", clear: "Clear", watch: "Storm watch", expected: "Snow expected" };

export function StormCalendar() {
  var cal = F.stormCalendar(state.theme);
  var page = h("section", { "class": "page page--narrow", "data-route": "calendar", "data-visual-id": "storm-calendar" });
  page.appendChild(h("div", { "class": "section-head" }, [
    h("div", { "class": "section-head__title" }, "Calendar"),
    h("div", { "class": "section-head__sub" }, "Your winter service, by date and weather \u2014 what\u2019s scheduled, what the storm triggers, and what needs you.")
  ]));

  /* contract trigger banner */
  page.appendChild(h("div", { "class": "contract-banner", "data-module": "contract-banner", "data-visual-id": "contract-banner" }, [
    h("div", { "class": "contract-banner__icon" }, "\u21bb"),
    h("div", { style: "flex:1" }, [
      h("div", { style: "font-weight:700;font-size:14px" }, "Recurring: " + cal.contract.rule),
      h("div", { style: "font-size:12.5px;color:var(--ink-2);margin-top:2px" }, cal.contract.note)
    ]),
    h("span", { "class": "status-badge status-badge--ok" }, "Active")
  ]));

  /* day agenda */
  var agenda = h("div", { "class": "storm-agenda", "data-module": "storm-agenda" });
  cal.days.forEach(function (d) {
    var col = h("div", { "class": "storm-day__date" + (d.today ? " storm-day__date--today" : "") }, [
      h("div", { style: "font-weight:800;font-size:15px" }, d.date),
      h("div", { style: "font-size:12px;color:var(--ink-3);margin-top:1px" }, d.dateSub)
    ]);
    var main = h("div", { "class": "storm-day__main" });
    /* weather row */
    main.appendChild(h("div", { "class": "storm-weather storm-weather--" + d.weather.state, "data-module": "weather-row", "data-visual-id": "weather-row" }, [
      h("span", { "class": "storm-weather__dot" }),
      h("span", { style: "flex:1;font-weight:600;font-size:13px" }, d.weather.label),
      h("span", { style: "font-size:12.5px;color:var(--ink-2)" }, d.weather.temp)
    ]));
    /* events */
    d.events.forEach(function (ev) {
      var meta = ev.time ? (ev.tech ? ev.time + " \u00b7 " + ev.tech : ev.time) : (ev.note || (ev.trigger ? "Auto-dispatch on trigger" : ""));
      var acts = [];
      if (ev.status === "onroute") { acts.push(stormAct("Track", "order.open", state.orders[0] && state.orders[0].id)); acts.push(stormAct("Message", "support.open")); }
      if (ev.status === "scheduled" && d.needsAccess) acts.push(stormAct("Confirm access", "access.confirm", d.dateSub, true));
      if (ev.status === "completed") { if (ev.photos) acts.push(stormAct("View report", "order.open", "#SV-3290")); acts.push(stormAct("Report issue", "service.reportIssue", ev.type)); }
      if (ev.status === "delayed" || ev.status === "skipped") acts.push(stormAct("Request extra", "service.requestExtra"));
      var event = h("div", { "class": "storm-event", "data-module": "service-window", "data-visual-id": "service-window", "data-state": ev.status }, [
        stormChip(ev.status),
        h("div", { "class": "storm-event__body" }, [
          h("div", { style: "display:flex;align-items:center;gap:8px;flex-wrap:wrap" }, [
            h("span", { style: "font-weight:600;font-size:14px", "data-bind": "event.type" }, ev.type),
            ev.trigger ? h("span", { "class": "trigger-tag" }, "\u26a1 auto after 2\u2033") : null
          ]),
          meta ? h("div", { style: "font-size:12.5px;color:var(--ink-2);margin-top:2px" }, meta) : null
        ]),
        acts.length ? h("div", { "class": "storm-actions" }, acts) : null
      ]);
      main.appendChild(event);
    });
    agenda.appendChild(h("div", { "class": "storm-day" + (d.today ? " storm-day--today" : ""), "data-module": "storm-day", "data-visual-id": "storm-day" }, [col, main]));
  });
  page.appendChild(agenda);

  /* access & blackout notes */
  var access = h("div", { "class": "list-panel", "data-module": "access-notes", "data-visual-id": "access-notes" }, [
    h("div", { "class": "list-panel__head" }, [
      h("div", { "class": "list-panel__title", style: "flex:1" }, "Access & blackout notes"),
      h("div", { "class": "link-action", "data-action": "access.update" }, "Update")
    ])
  ]);
  cal.accessNotes.forEach(function (n) {
    access.appendChild(h("div", { "class": "access-row" }, [
      h("span", { style: "font-weight:600;font-size:13px;min-width:96px" }, n.label),
      h("span", { style: "font-size:13px;color:var(--ink-2)" }, n.value)
    ]));
  });
  page.appendChild(access);
  return page;
}

export function stormAct(label, action, id, primary) {
  return h("button", { "class": "storm-act" + (primary ? " storm-act--primary" : ""), "data-action": action, "data-id": id || undefined, "data-visual-id": "storm-action" }, label);
}

/* =========================================================
   WAVE 6 — Public (landing + auth)
   ========================================================= */
