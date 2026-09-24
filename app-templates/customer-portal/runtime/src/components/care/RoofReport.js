// customer-portal/runtime/src/components/care/RoofReport.js — Wave 7 (Roofing): inspection report + project tracker. No business logic.
import { h } from "../../dom.js";
import { DocRow, careChip } from "./shared.js";

var SEV = { ok: ["ok", "Sound"], warn: ["warn", "Monitor"], issue: ["issue", "Repair"] };

export function RoofReport(m) {
  /* findings by zone — data-module="roof-zones" */
  var zones = h("div", { "class": "card card--pad", "data-module": "roof-zones", "data-visual-id": "roof-zones" }, [
    h("div", { style: "display:flex;align-items:center" }, [
      h("div", { "class": "card__title", style: "flex:1" }, "Findings by zone"),
      h("span", { style: "font-size:12.5px;color:var(--ink-3)" }, "drone survey \u00b7 18 photos")
    ])
  ]);
  m.zones.forEach(function (z) {
    var s = SEV[z.sev] || SEV.ok;
    zones.appendChild(h("div", { "class": "log-row", "data-module": "zone-row", "data-state": z.sev }, [
      h("div", { style: "flex:1;min-width:0" }, [
        h("div", { style: "font-weight:600;font-size:13.5px", "data-bind": "zone.name" }, z.zone),
        h("div", { style: "font-size:12.5px;color:var(--ink-2);margin-top:1px" }, z.note)
      ]),
      careChip(s[0], s[1])
    ]));
  });

  /* active repair project — data-module="project-tracker" (reuses timeline classes) */
  var steps = h("div", { "class": "timeline" }, [h("div", { "class": "timeline__line" })].concat(
    m.project.steps.map(function (st) {
      return h("div", { "class": "timeline-step", "data-module": "timeline-step" }, [
        h("div", { "class": "timeline-step__dot", style: "background:" + st.dot }),
        h("div", null, [
          h("div", { "class": "timeline-step__title", style: st.muted ? "color:var(--ink-3)" : "" }, st.label),
          h("div", { "class": "timeline-step__sub" }, st.sub)
        ])
      ]);
    })
  ));
  var project = h("div", { "class": "card card--pad", "data-module": "project-tracker", "data-visual-id": "project-tracker" }, [
    h("div", { style: "display:flex;align-items:center;gap:9px" }, [
      h("div", { "class": "card__title", style: "flex:1" }, m.project.name),
      careChip("info", "In progress")
    ]),
    h("div", { style: "font-size:12.5px;color:var(--ink-2);margin:2px 0 16px" }, m.project.eta),
    steps
  ]);

  /* condition score — data-module="roof-score" */
  var score = h("div", { "class": "card card--pad", "data-module": "roof-score", "data-visual-id": "roof-score" }, [
    h("div", { style: "display:flex;align-items:center;gap:9px" }, [
      h("div", { "class": "card__title", style: "flex:1" }, "Roof condition"),
      careChip("ok", m.grade)
    ]),
    h("div", { style: "display:flex;align-items:baseline;gap:6px;margin-top:10px" }, [
      h("span", { "class": "score-big", "data-bind": "roof.score" }, m.score),
      h("span", { style: "font-size:14px;color:var(--ink-3);font-weight:600" }, "/ 100")
    ]),
    h("div", { style: "font-size:12.5px;color:var(--ink-2);margin-top:8px" }, m.inspected),
    h("div", { style: "font-size:12.5px;color:var(--ink-2)" }, m.nextDue)
  ]);

  /* documents — data-module="document-vault" */
  var docs = h("div", { "class": "list-panel", "data-module": "document-vault", "data-visual-id": "document-vault" }, [
    h("div", { "class": "list-panel__head" }, [h("div", { "class": "list-panel__title", style: "flex:1" }, "Documents")])
  ].concat(m.docs.map(DocRow)));

  return h("div", { "class": "care-grid" }, [
    h("div", { "class": "care-col" }, [zones, project]),
    h("div", { "class": "care-col" }, [score, docs])
  ]);
}
