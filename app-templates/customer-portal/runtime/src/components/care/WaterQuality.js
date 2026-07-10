// customer-portal/runtime/src/components/care/WaterQuality.js — Wave 7 (Pool & Spa): water chemistry dashboard. No business logic.
import { h } from "../../dom.js";
import { ActionButton } from "../primitives/ActionButton.js";
import { careChip } from "./shared.js";

export function WaterQuality(m) {
  /* readings vs. safe ranges — data-module="water-readings" */
  var readings = h("div", { "class": "reading-grid", "data-module": "water-readings", "data-visual-id": "water-readings" },
    m.readings.map(function (r) {
      return h("div", { "class": "reading-card", "data-module": "reading-card", "data-state": r.state }, [
        h("div", { style: "display:flex;align-items:center;gap:8px" }, [
          h("span", { style: "font-size:12.5px;color:var(--ink-2);flex:1", "data-bind": "reading.name" }, r.name),
          careChip(r.state, r.state === "ok" ? "In range" : "Low")
        ]),
        h("div", { style: "font-weight:800;font-size:24px;letter-spacing:-.02em;margin-top:6px", "data-bind": "reading.value" }, r.value),
        h("div", { style: "font-size:11.5px;color:var(--ink-3);margin-top:2px" }, r.target),
        h("div", { "class": "spark", title: "last 5 visits" }, r.series.map(function (v) { return h("span", { style: "height:" + v + "%" }); })),
        r.note ? h("div", { style: "font-size:12px;color:#b5670a;margin-top:8px;font-weight:600" }, r.note) : null
      ]);
    })
  );

  /* dosing log — data-module="dose-log" */
  var doses = h("div", { "class": "list-panel", "data-module": "dose-log", "data-visual-id": "dose-log" }, [
    h("div", { "class": "list-panel__head" }, [
      h("div", { "class": "list-panel__title", style: "flex:1" }, "Dosing log"),
      h("span", { style: "font-size:12.5px;color:var(--ink-3)" }, "what was added, and why")
    ])
  ]);
  m.doses.forEach(function (d) {
    doses.appendChild(h("div", { "class": "log-row", "data-module": "dose-row" }, [
      h("div", { "class": "log-date" }, d.date),
      h("div", { style: "flex:1;min-width:0" }, [
        h("div", { style: "font-weight:600;font-size:13.5px" }, d.what),
        h("div", { style: "font-size:12px;color:var(--ink-3);margin-top:1px" }, d.why)
      ])
    ]));
  });

  /* swim-ready banner + cadence */
  var status = h("div", { "class": "status-banner status-banner--ok", "data-module": "status-banner", "data-visual-id": "swim-ready" }, [
    h("div", { style: "flex:1" }, [
      h("div", { style: "font-weight:700;font-size:15px" }, "Swim-ready"),
      h("div", { style: "font-size:13px;color:var(--ink-2);margin-top:2px" }, "Alkalinity is being corrected \u2014 dose added at the last visit; safe to swim.")
    ])
  ]);

  var cadence = h("div", { "class": "card card--pad", "data-module": "test-cadence", "data-visual-id": "test-cadence" }, [
    h("div", { "class": "card__title", style: "margin-bottom:10px" }, "Testing cadence"),
    h("div", { style: "font-size:13.5px;font-weight:600" }, m.tested),
    h("div", { style: "font-size:13px;color:var(--ink-2);margin-top:6px" }, m.nextTest),
    h("div", { style: "margin-top:14px" }, ActionButton({ variant: "btn--ghost", label: "Request an extra test", action: "service.requestExtra", block: true, visualId: "care-extra-test" }))
  ]);

  return h("div", { "class": "care-grid" }, [
    h("div", { "class": "care-col" }, [readings, doses]),
    h("div", { "class": "care-col" }, [status, cadence])
  ]);
}
