// customer-portal-design/src/components/care/PestMonitoring.js — Wave 7 (Pest Control): station monitoring between visits. No business logic.
import { h } from "../../dom.js";
import { state } from "../../state.js";
import { careChip } from "./shared.js";

var ST = { clear: ["ok", "Clear"], alert: ["issue", "Activity"], refreshed: ["info", "Refreshed"] };
var PIN = { clear: "#1f8a44", alert: "#ff3b30", refreshed: "var(--accent)" };

export function PestMonitoring(m) {
  /* summary strip */
  var summary = h("div", { "class": "care-stats", style: "grid-template-columns:repeat(3,1fr)", "data-module": "monitoring-summary", "data-visual-id": "monitoring-summary" },
    m.summary.map(function (s) {
      return h("div", { "class": "care-stat" }, [
        h("div", { style: "font-size:12px;color:var(--ink-3)" }, s.label),
        h("div", { style: "font-weight:800;font-size:20px;margin-top:2px" }, s.value)
      ]);
    })
  );

  /* station map + list — data-module="station-map" / "station-list" */
  var map = h("div", { "class": "station-map", "data-module": "station-map", "data-visual-id": "station-map" }, [
    h("span", { "class": "map-label" }, "station map \u00b7 your property")
  ].concat(m.stations.map(function (s) {
    return h("div", {
      "class": "station-pin", title: s.label, "data-state": s.status,
      style: "left:" + s.x + "%;top:" + s.y + "%;background:" + (PIN[s.status] || PIN.clear)
    }, s.id);
  })));

  var list = h("div", { "class": "card", "data-module": "station-list", "data-visual-id": "station-list" }, [
    h("div", { "class": "card__head" }, [h("span", { "class": "card__title" }, "Stations & sensors")]),
    h("div", { style: "padding:0 18px" }, [map])
  ]);
  var rows = h("div", { style: "padding:0 18px 12px" });
  m.stations.forEach(function (s) {
    var c = ST[s.status] || ST.clear;
    rows.appendChild(h("div", { "class": "log-row", "data-module": "station-row", "data-state": s.status }, [
      h("div", { "class": "log-date" }, s.id),
      h("div", { style: "flex:1;min-width:0" }, [
        h("div", { style: "font-weight:600;font-size:13.5px", "data-bind": "station.label" }, s.label),
        h("div", { style: "font-size:12px;color:var(--ink-3);margin-top:1px" }, s.type + " \u00b7 " + s.last + (s.note ? " \u00b7 " + s.note : ""))
      ]),
      careChip(c[0], c[1])
    ]));
  });
  list.appendChild(rows);

  /* free re-treat guarantee — data-module="retreat-card"
     states: available | requesting | used (visual only — Codex owns the request).
     contract: data-id = plan.planId; element also carries data-property-id +
     data-service-id (stable scope ids, never display names). */
  var rStatus = state.careRetreat || m.guarantee.status || "available";
  var sc = m.guarantee.scope;
  var retreatBody;
  if (rStatus === "requesting") {
    retreatBody = h("button", {
      "class": "btn btn--primary btn--block", disabled: true, "aria-busy": "true",
      "data-module": "action-button", "data-visual-id": "care-retreat", "data-state": "requesting"
    }, [h("span", { "class": "btn-spinner" }), "Requesting\u2026"]);
  } else if (rStatus === "used") {
    retreatBody = h("button", {
      "class": "btn btn--ghost btn--block", disabled: true,
      "data-module": "action-button", "data-visual-id": "care-retreat", "data-state": "unavailable"
    }, "Re-treat used this quarter");
  } else {
    retreatBody = h("button", {
      "class": "btn btn--primary btn--block",
      "data-module": "action-button", "data-visual-id": "care-retreat", "data-state": "available",
      "data-action": "care.requestRetreat", "data-id": sc.planId,
      "data-property-id": sc.propertyId, "data-service-id": sc.serviceId
    }, "Request free re-treat");
  }
  var guarantee = h("div", { "class": "card card--pad", "data-module": "retreat-card", "data-visual-id": "retreat-card", "data-state": rStatus }, [
    h("div", { "class": "card__title" }, m.guarantee.title),
    h("div", { style: "font-size:13px;color:var(--ink-2);margin-top:6px", "data-bind": "guarantee.note" },
      rStatus === "used" ? m.guarantee.usedNote : m.guarantee.note),
    rStatus === "requesting" ? h("div", { style: "font-size:12px;color:var(--ink-3);margin-top:8px" }, "Sending your request \u2014 your technician confirms the visit window.") : null,
    /* wave 13 — explicit command failure: nothing was scheduled, retry is the button */
    (state.commands["care.requestRetreat:" + sc.planId] === "failed" || state.commands["care.requestRetreat:" + sc.planId] === "conflict")
      ? h("div", { style: "margin-top:10px;display:flex;gap:10px;align-items:center;padding:9px 11px;border-radius:11px;background:var(--danger-bg);font-size:12.5px;line-height:1.4" },
          "The request didn\u2019t go through \u2014 nothing was scheduled. Try again below.")
      : null,
    h("div", { style: "margin-top:14px" }, [retreatBody])
  ]);

  /* alert log — data-module="alert-log" */
  var alerts = h("div", { "class": "list-panel", "data-module": "alert-log", "data-visual-id": "alert-log" }, [
    h("div", { "class": "list-panel__head" }, [h("div", { "class": "list-panel__title", style: "flex:1" }, "Sensor alerts")])
  ]);
  m.alerts.forEach(function (a) {
    alerts.appendChild(h("div", { "class": "log-row", "data-module": "alert-row", "data-state": a.state }, [
      h("span", { "class": "check-dot", style: "background:" + (a.state === "alert" ? "#ff3b30" : "var(--ok)") }),
      h("div", { style: "flex:1;min-width:0" }, [
        h("div", { style: "font-weight:600;font-size:13px" }, a.text),
        h("div", { style: "font-size:11.5px;color:var(--ink-3);margin-top:2px" }, a.when)
      ])
    ]));
  });

  return h("div", null, [summary, h("div", { "class": "care-grid" }, [
    h("div", { "class": "care-col" }, [list]),
    h("div", { "class": "care-col" }, [guarantee, alerts])
  ])]);
}
