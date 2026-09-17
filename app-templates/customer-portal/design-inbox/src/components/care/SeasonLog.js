// customer-portal-design/src/components/care/SeasonLog.js — Wave 7 (Snow Removal): storm-response compliance log. No business logic.
import { h } from "../../dom.js";
import { DocRow, careChip } from "./shared.js";

export function SeasonLog(m) {
  /* season stat strip — data-module="season-stats" */
  var stats = h("div", { "class": "care-stats", "data-module": "season-stats", "data-visual-id": "season-stats" },
    m.stats.map(function (s) {
      return h("div", { "class": "care-stat" }, [
        h("div", { style: "font-size:12px;color:var(--ink-3)" }, s.label),
        h("div", { style: "font-weight:800;font-size:20px;margin-top:2px" }, s.value)
      ]);
    })
  );

  /* storm-response log — data-module="storm-log" */
  var log = h("div", { "class": "list-panel", "data-module": "storm-log", "data-visual-id": "storm-log" }, [
    h("div", { "class": "list-panel__head" }, [
      h("div", { "class": "list-panel__title", style: "flex:1" }, "Storm responses"),
      h("span", { style: "font-size:12.5px;color:var(--ink-3)" }, "GPS-logged \u00b7 this season")
    ])
  ]);
  m.events.forEach(function (ev) {
    log.appendChild(h("div", { "class": "log-row", "data-module": "storm-log-row", "data-state": ev.sla ? "ok" : "warn" }, [
      h("div", { "class": "log-date" }, ev.date),
      h("div", { style: "flex:1;min-width:0" }, [
        h("div", { style: "display:flex;align-items:center;gap:8px;flex-wrap:wrap" }, [
          h("span", { style: "font-weight:600;font-size:13.5px", "data-bind": "event.storm" }, ev.storm),
          careChip(ev.sla ? "ok" : "warn", ev.sla ? "SLA met" : "SLA missed")
        ]),
        h("div", { style: "font-size:12px;color:var(--ink-3);margin-top:2px" },
          ev.trigger + " \u00b7 response " + ev.response + " \u00b7 " + ev.material + (ev.note ? " \u00b7 " + ev.note : ""))
      ]),
      ev.photos ? h("div", { "class": "link-action", "data-action": "order.open", "data-id": ev.orderId || "#SV-3290" }, "Report \u203a") : null
    ]));
  });

  /* SLA meter — data-module="sla-meter" */
  var sla = h("div", { "class": "card card--pad", "data-module": "sla-meter", "data-visual-id": "sla-meter" }, [
    h("div", { "class": "card__title", style: "margin-bottom:10px" }, "SLA this season"),
    h("div", { "class": "score-big" }, m.sla.pct + "%"),
    h("div", { "class": "meter" }, [h("div", { "class": "meter__fill", style: "width:" + m.sla.pct + "%" })]),
    h("div", { style: "font-size:12.5px;color:var(--ink-2);margin-top:10px" }, m.sla.label)
  ]);

  /* compliance reports — data-module="compliance-reports" */
  var docs = h("div", { "class": "list-panel", "data-module": "compliance-reports", "data-visual-id": "compliance-reports" }, [
    h("div", { "class": "list-panel__head" }, [
      h("div", { "class": "list-panel__title", style: "flex:1" }, "Compliance reports"),
      h("span", { style: "font-size:12px;color:var(--ink-3)" }, "slip-and-fall record")
    ])
  ].concat(m.docs.map(DocRow)));

  return h("div", null, [stats, h("div", { "class": "care-grid" }, [
    h("div", { "class": "care-col" }, [log]),
    h("div", { "class": "care-col" }, [sla, docs])
  ])]);
}
