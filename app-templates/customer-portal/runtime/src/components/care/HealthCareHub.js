// customer-portal/runtime/src/components/care/HealthCareHub.js — Wave 9 (Health): appointments, plan milestones, tasks, secure documents, care team.
// LOGISTICS ONLY BY DESIGN: this hub renders scheduling and document
// METADATA — never clinical metrics, readings, results or medical advice.
// Clinical data stays in the provider's own systems.
import { h } from "../../dom.js";
import { ActionButton } from "../primitives/ActionButton.js";
import { careChip } from "./shared.js";

var STEP_CHIP = { done: ["ok", "Done"], next: ["info", "Next up"], upcoming: ["muted", "Planned"] };

/* effective task state: state.careTasksDone override wins over the fixture */
function taskDone(t, ui) { return (t.id in ui.tasksDone) ? ui.tasksDone[t.id] : !!t.done; }

function makeUnavailable(control, label) {
  control.setAttribute("disabled", "");
  control.setAttribute("aria-disabled", "true");
  control.setAttribute("data-state", "unavailable");
  control.setAttribute("title", label + " is unavailable in fixture mode");
  return control;
}

export function HealthCareHub(m, ui) {
  /* upcoming appointment — data-module="care-appointment"; stable data-appointment-id */
  var a = m.appointment;
  var appt = h("div", { "class": "card card--pad", "data-module": "care-appointment", "data-visual-id": "care-appointment", "data-appointment-id": a.id, "data-provider-id": a.providerId }, [
    h("div", { style: "display:flex;align-items:center;gap:9px" }, [
      h("div", { "class": "card__title", style: "flex:1" }, "Next appointment"),
      careChip("info", "Scheduled")
    ]),
    h("div", { style: "font-weight:800;font-size:20px;letter-spacing:-.02em;margin:10px 0 2px", "data-bind": "appointment.when" }, a.when),
    h("div", { style: "font-size:13.5px;color:var(--ink-2)", "data-bind": "appointment.name" }, a.name + " \u00b7 " + a.provider),
    h("div", { style: "font-size:12.5px;color:var(--ink-3);margin-top:2px" }, a.where),
    h("div", { style: "margin-top:12px;background:rgba(var(--accent-rgb),.06);border:1px solid rgba(var(--accent-rgb),.14);border-radius:14px;padding:11px 14px;font-size:12.5px;color:var(--ink-2)" }, [
      h("b", { style: "color:var(--ink)" }, "Before the visit \u00b7 "), a.prep
    ]),
    h("div", { style: "display:flex;gap:10px;margin-top:14px" }, [
      ActionButton({ variant: "btn--primary", label: "Reschedule", action: "order.reschedule", id: a.orderId, visualId: "care-appt-reschedule" }),
      ActionButton({ variant: "btn--ghost", label: "Visit details", action: "order.open", id: a.orderId, visualId: "care-appt-open" })
    ])
  ]);

  /* care plan milestones — data-module="care-plan"; stable data-plan-id.
     Milestones are LOGISTICS steps (intake, reviews, cadence), never outcomes. */
  var plan = h("div", { "class": "card card--pad", "data-module": "care-plan", "data-visual-id": "care-plan", "data-plan-id": m.plan.id }, [
    h("div", { style: "display:flex;align-items:center;gap:9px" }, [
      h("div", { "class": "card__title", style: "flex:1", "data-bind": "plan.name" }, m.plan.name),
      h("span", { style: "font-size:12.5px;color:var(--ink-3)" }, m.plan.cadence)
    ])
  ]);
  m.plan.milestones.forEach(function (s) {
    var c = STEP_CHIP[s.status] || STEP_CHIP.upcoming;
    var numStyle = s.status === "done" ? "background:rgba(52,199,89,.16);color:#1f8a44"
      : s.status === "next" ? "background:rgba(var(--accent-rgb),.14);color:var(--accent)"
      : "background:rgba(120,120,128,.12);color:var(--ink-3)";
    plan.appendChild(h("div", { "class": "step-row", "data-module": "plan-milestone", "data-state": s.status }, [
      h("div", { "class": "step-num", style: numStyle }, String(s.n)),
      h("div", { style: "flex:1;min-width:0" }, [
        h("div", { style: "font-weight:600;font-size:14px", "data-bind": "milestone.name" }, s.name),
        h("div", { style: "font-size:12.5px;color:var(--ink-2);margin-top:1px" }, s.detail)
      ]),
      h("div", { style: "text-align:right" }, [
        careChip(c[0], c[1]),
        h("div", { style: "font-size:11.5px;color:var(--ink-3);margin-top:4px" }, s.when)
      ])
    ]));
  });

  /* follow-up tasks — data-module="follow-up-tasks"; care.completeTask data-id = task.id */
  var doneCount = m.tasks.filter(function (task) { return taskDone(task, ui); }).length;
  var tasks = h("div", { "class": "list-panel", "data-module": "follow-up-tasks", "data-visual-id": "follow-up-tasks" }, [
    h("div", { "class": "list-panel__head" }, [
      h("div", { "class": "list-panel__title", style: "flex:1" }, "Follow-up tasks"),
      h("span", { style: "font-size:12px;color:var(--ink-3)" }, doneCount + " of " + m.tasks.length + " done")
    ])
  ]);
  m.tasks.forEach(function (t) {
    var done = taskDone(t, ui);
    tasks.appendChild(h("div", { "class": "log-row", "data-module": "task-row", "data-task-id": t.id, "data-state": done ? "done" : "open" }, [
      h("button", {
        "data-action": "care.completeTask", "data-id": t.id, "aria-pressed": done ? "true" : "false",
        title: done ? "Mark as not done" : "Mark as done",
        style: "width:24px;height:24px;border-radius:999px;flex-shrink:0;cursor:pointer;display:grid;place-items:center;font-family:inherit;font-size:12px;padding:0;border:1.5px solid " + (done ? "var(--accent)" : "rgba(120,120,128,.4)") + ";background:" + (done ? "var(--accent)" : "transparent") + ";color:#fff"
      }, done ? "\u2713" : ""),
      h("div", { style: "flex:1;min-width:0" }, [
        h("div", { style: "font-weight:600;font-size:13.5px;" + (done ? "text-decoration:line-through;color:var(--ink-3)" : ""), "data-bind": "task.label" }, t.label),
        h("div", { style: "font-size:12px;color:var(--ink-3);margin-top:1px" }, t.due)
      ])
    ]));
  });

  /* care team — data-module="provider-card"; care.contactProvider data-id = provider.id */
  var p = m.provider;
  var provider = h("div", { "class": "card card--pad", "data-module": "provider-card", "data-visual-id": "provider-card", "data-provider-id": p.id }, [
    h("div", { style: "display:flex;align-items:center;gap:12px" }, [
      h("div", { style: "width:46px;height:46px;border-radius:999px;background:rgba(var(--accent-rgb),.14);color:var(--accent);display:grid;place-items:center;font-weight:800;font-size:16px;flex-shrink:0" },
        p.name.split(" ").map(function (w) { return w[0]; }).join("").slice(0, 2)),
      h("div", { style: "flex:1;min-width:0" }, [
        h("div", { style: "font-weight:700;font-size:15px", "data-bind": "provider.name" }, p.name),
        h("div", { style: "font-size:12.5px;color:var(--ink-2)" }, p.role)
      ])
    ]),
    h("div", { style: "font-size:12.5px;color:var(--ink-3);margin-top:8px" }, p.org + " \u00b7 " + p.since),
    h("div", { style: "display:flex;flex-direction:column;gap:8px;margin-top:14px" }, [
      makeUnavailable(ActionButton({ variant: "btn--primary", label: "Message the care team", action: "care.contactProvider", id: p.id, block: true, visualId: "care-contact-provider" }), "Provider contact"),
      ActionButton({ variant: "btn--ghost", label: "Call", action: "support.call", block: true, visualId: "care-call-provider" })
    ]),
    h("div", { style: "font-size:12px;color:var(--ink-3);margin-top:10px" }, p.note)
  ]);

  /* secure documents — data-module="secure-documents"; care.openSecureDoc data-id = document.id.
     Only NAMES + metadata render here — contents open in the secure viewer. */
  var docs = h("div", { "class": "list-panel", "data-module": "secure-documents", "data-visual-id": "secure-documents" }, [
    h("div", { "class": "list-panel__head" }, [
      h("div", { "class": "list-panel__title", style: "flex:1" }, "Secure documents"),
      careChip("muted", "\u26bf Secure")
    ])
  ]);
  m.docs.forEach(function (d) {
    docs.appendChild(h("div", { "class": "log-row", "data-module": "secure-document-row", "data-document-id": d.id }, [
      h("div", { style: "flex:1;min-width:0" }, [
        h("div", { style: "font-weight:600;font-size:13.5px", "data-bind": "doc.name" }, d.name),
        h("div", { style: "font-size:12px;color:var(--ink-3);margin-top:1px", "data-bind": "doc.meta" }, d.meta)
      ]),
      h("div", { "class": "link-action", "data-action": "care.openSecureDoc", "data-id": d.id, "data-state": "unavailable", role: "link", "aria-disabled": "true", tabindex: "-1", title: "Secure viewer is unavailable in fixture mode" }, "Open \u203a")
    ]));
  });
  docs.appendChild(h("div", { style: "font-size:12px;color:var(--ink-3);margin-top:10px" }, m.docsNote));

  /* not-a-medical-record disclaimer — data-module="care-disclaimer" */
  var disclaimer = h("div", { "data-module": "care-disclaimer", "data-visual-id": "care-disclaimer", style: "border:1px dashed rgba(var(--hair),.18);border-radius:14px;padding:11px 14px;font-size:12px;color:var(--ink-3)" }, m.disclaimer);

  return h("div", { "class": "care-grid" }, [
    h("div", { "class": "care-col" }, [appt, plan, tasks]),
    h("div", { "class": "care-col" }, [provider, docs, disclaimer])
  ]);
}
