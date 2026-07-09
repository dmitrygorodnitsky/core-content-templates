// customer-portal/runtime/src/components/storm/StormHome.js — production transfer module.
import { F } from "../../../data/fixtures.js";
import { h } from "../../dom.js";
import { state } from "../../state.js";
import { go } from "../../actions.js";
import { ActionButton } from "../primitives/ActionButton.js";
import { ErrorState } from "../primitives/ErrorState.js";
import { skeletonRow } from "../primitives/LoadingState.js";
import { PageHeader } from "../shell/PageHeader.js";
import { OrderCard } from "../orders/OrderCard.js";
import { stormAct, stormChip } from "./StormCalendar.js";

export function StormHome() {
  var cal = F.stormCalendar(state.theme);
  var today = cal.days.find(function (d) { return d.today; }) || cal.days[0];
  var todayIdx = cal.days.indexOf(today);
  var upcoming = cal.days.slice(todayIdx + 1);
  var accessDay = upcoming.find(function (d) { return d.needsAccess; });
  var page = h("section", { "class": "page", "data-route": "orders.list", "data-visual-id": "storm-home" });

  page.appendChild(PageHeader({
    title: F.customer.greeting,
    sub: today.weather.state === "watch" ? "Storm watch tonight \u00b7 " + (accessDay ? "1 visit needs your OK" : "crew on the way") : "Your winter service is on track"
  }));

  if (state.view === "error") { page.appendChild(ErrorState({})); return page; }

  var grid = h("div", { "class": "cabinet-grid" });
  var left = h("div", { "class": "cabinet-col" });
  var right = h("div", { "class": "cabinet-col" });

  /* 1) storm status — the lead block */
  var todayEvent = today.events[0];
  var statusActions = [];
  if (todayEvent && todayEvent.status === "onroute") { statusActions.push(stormAct("Track visit", "order.open", state.orders[0] && state.orders[0].id, true)); statusActions.push(stormAct("Message crew", "support.open")); }
  if (accessDay) statusActions.push(stormAct("Confirm access \u00b7 " + accessDay.date, "access.confirm", accessDay.dateSub, !todayEvent || todayEvent.status !== "onroute"));
  var status = h("div", { "class": "storm-status storm-status--" + today.weather.state, "data-module": "storm-status", "data-visual-id": "storm-status", "data-state": today.weather.state }, [
    h("div", { "class": "storm-status__head" }, [
      h("span", { "class": "storm-status__dot" }),
      h("span", { style: "flex:1;font-weight:700;font-size:15.5px" }, today.weather.label),
      h("span", { "class": "storm-status__temp" }, today.weather.temp)
    ]),
    todayEvent ? h("div", { "class": "storm-status__event" }, [
      stormChip(todayEvent.status),
      h("div", { style: "flex:1;min-width:0" }, [
        h("div", { style: "font-weight:600;font-size:14.5px" }, todayEvent.type),
        h("div", { style: "font-size:12.5px;color:var(--ink-2)" }, todayEvent.time ? (todayEvent.tech ? todayEvent.time + " \u00b7 " + todayEvent.tech : todayEvent.time) : "Scheduled")
      ])
    ]) : h("div", { style: "font-size:13.5px;color:var(--ink-2)" }, "No visit needed today \u2014 below the service trigger."),
    statusActions.length ? h("div", { "class": "storm-actions", style: "margin-top:2px" }, statusActions) : null
  ]);
  left.appendChild(status);

  /* 2) next service windows */
  var windows = h("div", { "class": "card card--pad", "data-module": "next-windows", "data-visual-id": "next-windows" }, [
    h("div", { style: "display:flex;align-items:center;margin-bottom:12px" }, [
      h("div", { "class": "card__title", style: "flex:1" }, "Next service windows"),
      h("div", { "class": "link-action", "data-action": "nav.go", "data-id": "calendar" }, "Open calendar \u203a")
    ])
  ]);
  if (upcoming.length === 0) windows.appendChild(h("div", { style: "font-size:13px;color:var(--ink-2)" }, "Nothing scheduled \u2014 we dispatch automatically when the weather triggers."));
  upcoming.slice(0, 3).forEach(function (d) {
    var ev = d.events[0];
    windows.appendChild(h("div", { "class": "home-window", "data-module": "service-window" }, [
      h("div", { "class": "home-window__date" }, [h("div", { style: "font-weight:700;font-size:13.5px" }, d.date), h("div", { style: "font-size:11.5px;color:var(--ink-3)" }, d.dateSub)]),
      h("div", { "class": "storm-weather storm-weather--" + d.weather.state, style: "flex:1" }, [
        h("span", { "class": "storm-weather__dot" }),
        h("span", { style: "flex:1;font-weight:600;font-size:12.5px" }, d.weather.label)
      ]),
      ev ? stormChip(ev.status) : null,
      d.needsAccess ? stormAct("Confirm", "access.confirm", d.dateSub, true) : null
    ]));
  });
  left.appendChild(windows);

  /* 3) recent service history */
  var history = h("div", { "class": "card", "data-module": "order-list", "data-visual-id": "service-history" }, [
    h("div", { "class": "card__head" }, [h("span", { "class": "card__title" }, "Service history")])
  ]);
  var hlist = h("div", { "class": "order-list" });
  if (state.view === "loading") { for (var i = 0; i < 3; i++) hlist.appendChild(skeletonRow()); }
  else state.orders.filter(function (o) { return o.status === "completed"; }).slice(0, 4).forEach(function (o) { hlist.appendChild(OrderCard(o)); });
  history.appendChild(hlist);
  left.appendChild(history);

  /* right rail: season/contract status + access notes */
  right.appendChild(h("div", { "class": "card card--pad season-card", "data-module": "season-status", "data-visual-id": "season-status" }, [
    h("div", { style: "display:flex;align-items:center;gap:9px;margin-bottom:14px" }, [
      h("div", { "class": "card__title", style: "flex:1" }, F.themes[state.theme].plan.name),
      h("span", { "class": "status-badge status-badge--ok" }, "Active")
    ]),
    seasonRow("Visits this season", "8"),
    seasonRow("Auto-dispatch", "after 2\u2033 snow"),
    seasonRow("Saved this season", F.customer.stats.savings, "var(--ok)"),
    h("div", { style: "margin-top:14px" }, ActionButton({ variant: "btn--ghost", label: "Manage plan", action: "profile.managePlan", block: true, visualId: "home-manage-plan" }))
  ]));

  var access = h("div", { "class": "card card--pad", "data-module": "access-notes", "data-visual-id": "home-access-notes" }, [
    h("div", { style: "display:flex;align-items:center;margin-bottom:12px" }, [
      h("div", { "class": "card__title", style: "flex:1;font-size:15px" }, "Access notes"),
      h("div", { "class": "link-action", "data-action": "access.update" }, "Edit")
    ])
  ]);
  cal.accessNotes.forEach(function (n) { access.appendChild(h("div", { "class": "access-row" }, [h("span", { style: "font-weight:600;font-size:12.5px;min-width:84px" }, n.label), h("span", { style: "font-size:12.5px;color:var(--ink-2)" }, n.value)])); });
  right.appendChild(access);

  grid.appendChild(left); grid.appendChild(right);
  page.appendChild(grid);
  return page;
}

export function seasonRow(label, value, color) {
  return h("div", { "class": "season-row" }, [
    h("span", { style: "font-size:13.5px;color:var(--ink-2)" }, label),
    h("span", { style: "font-weight:700;font-size:13.5px" + (color ? ";color:" + color : "") }, value)
  ]);
}

/* =========================================================
   ORDER DETAIL  (data-route="order.detail")
   ========================================================= */
/* presentation-only view model (labor/parts split is a display
   estimate, not a billing calc — Codex owns real invoicing). */
