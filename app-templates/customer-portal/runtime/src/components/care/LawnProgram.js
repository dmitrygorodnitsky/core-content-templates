// customer-portal/runtime/src/components/care/LawnProgram.js — Wave 7 (Lawn & Garden): season program + re-entry. No business logic.
import { h } from "../../dom.js";
import { careChip, kvRow } from "./shared.js";
import { markCareControlUnavailable } from "../../activation-policy.js";

var STEP_CHIP = { done: ["ok", "Done"], next: ["info", "Next up"], upcoming: ["muted", "Planned"] };

export function LawnProgram(m) {
  /* 5-step program — data-module="program-steps" */
  var program = h("div", { "class": "card card--pad", "data-module": "program-steps", "data-visual-id": "program-steps" }, [
    h("div", { style: "display:flex;align-items:center" }, [
      h("div", { "class": "card__title", style: "flex:1" }, "5-step season program"),
      markCareControlUnavailable(h("div", { "class": "link-action", "data-action": "service.requestExtra", role: "button", tabindex: "-1" }, "Add a visit"), "Extra visits are unavailable: no approved request contract")
    ])
  ]);
  m.steps.forEach(function (s) {
    var c = STEP_CHIP[s.status] || STEP_CHIP.upcoming;
    var numStyle = s.status === "done" ? "background:rgba(52,199,89,.16);color:#1f8a44"
      : s.status === "next" ? "background:rgba(var(--accent-rgb),.14);color:var(--accent)"
      : "background:rgba(120,120,128,.12);color:var(--ink-3)";
    program.appendChild(h("div", { "class": "step-row", "data-module": "program-step", "data-state": s.status }, [
      h("div", { "class": "step-num", style: numStyle }, String(s.n)),
      h("div", { style: "flex:1;min-width:0" }, [
        h("div", { style: "font-weight:600;font-size:14px", "data-bind": "step.name" }, s.name),
        h("div", { style: "font-size:12.5px;color:var(--ink-2);margin-top:1px" }, s.detail + " \u00b7 " + s.window)
      ]),
      h("div", { style: "text-align:right" }, [
        careChip(c[0], c[1]),
        h("div", { style: "font-size:11.5px;color:var(--ink-3);margin-top:4px" }, s.when)
      ])
    ]));
  });

  /* kids & pets re-entry — data-module="reentry-card" */
  var reentry = h("div", { "class": "reentry-card", "data-module": "reentry-card", "data-visual-id": "reentry-card", "data-state": m.reentry.active ? "pending-action" : "ready" }, [
    h("div", { style: "display:flex;align-items:center;gap:8px" }, [
      h("span", { style: "font-weight:700;font-size:14.5px;flex:1;color:#b5670a" }, "Kids & pets \u2014 re-entry"),
      careChip("warn", "Active")
    ]),
    h("div", { style: "font-weight:800;font-size:21px;letter-spacing:-.02em;margin:10px 0 2px", "data-bind": "reentry.safeAfter" }, m.reentry.safeAfter),
    h("div", { style: "font-size:13px;color:var(--ink-2)" }, m.reentry.treatment),
    h("div", { style: "font-size:12.5px;color:var(--ink-2);margin-top:8px" }, m.reentry.note)
  ]);

  /* soil snapshot — data-module="soil-snapshot" */
  var soil = h("div", { "class": "card card--pad", "data-module": "soil-snapshot", "data-visual-id": "soil-snapshot" }, [
    h("div", { "class": "card__title", style: "margin-bottom:8px" }, "Soil snapshot")
  ].concat(m.soil.map(function (r) { return kvRow(r.label, r.value); })));

  /* progress photos — data-module="progress-photos" */
  var photos = h("div", { "class": "card card--pad", "data-module": "progress-photos", "data-visual-id": "progress-photos" }, [
    h("div", { "class": "card__title", style: "margin-bottom:12px" }, "Lawn progress"),
    h("div", { style: "display:grid;grid-template-columns:repeat(3,1fr);gap:8px" },
      m.photos.map(function (p) {
        return h("div", null, [
          h("div", { "class": "photo-tile" + (p.tone === "after" ? " photo-tile--after" : "") }, [h("span", null, "lawn photo")]),
          h("div", { style: "font-size:11.5px;color:var(--ink-3);margin-top:5px;text-align:center" }, p.label)
        ]);
      }))
  ]);

  return h("div", { "class": "care-grid" }, [
    h("div", { "class": "care-col" }, [program]),
    h("div", { "class": "care-col" }, [reentry, soil, photos])
  ]);
}
