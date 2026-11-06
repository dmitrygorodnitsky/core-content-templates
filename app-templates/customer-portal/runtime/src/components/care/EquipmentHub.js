// customer-portal/runtime/src/components/care/EquipmentHub.js — Wave 7 (HVAC): equipment passport + diagnostics. No business logic.
import { h } from "../../dom.js";
import { ActionButton } from "../primitives/ActionButton.js";
import { DocRow, kvRow } from "./shared.js";
import { markCareControlUnavailable } from "../../activation-policy.js";

var CHECK_DOT = { ok: "var(--ok)", warn: "#ff9f0a", issue: "#ff3b30" };
function healthColor(n) { return n >= 80 ? "var(--ok)" : n >= 60 ? "#ff9f0a" : "#ff3b30"; }

export function EquipmentHub(m, ui) {
  var u = m.units.find(function (x) { return x.id === ui.selectedUnitId; }) || m.units[0];

  /* unit picker — data-module="unit-picker"; contract: data-id = unit.id */
  var picker = h("div", { "class": "unit-row", "data-module": "unit-picker", "data-visual-id": "unit-picker" },
    m.units.map(function (unit) {
      var active = unit.id === u.id;
      return h("button", {
        "class": "unit-pick" + (active ? " unit-pick--active" : ""),
        "data-action": "care.selectUnit", "data-id": unit.id,
        "data-state": active ? "active" : undefined
      }, [
        h("div", { style: "display:flex;align-items:center;gap:8px" }, [
          h("span", { style: "font-weight:700;font-size:14.5px;flex:1", "data-bind": "unit.name" }, unit.name),
          h("span", { style: "font-weight:700;font-size:12.5px;color:" + healthColor(unit.health), "data-bind": "unit.health" }, unit.health + "%")
        ]),
        h("div", { style: "font-size:12px;color:var(--ink-3);margin:2px 0 8px" }, unit.model + " \u00b7 " + unit.place),
        h("div", { "class": "health-bar" }, [h("div", { "class": "health-bar__fill", style: "width:" + unit.health + "%;background:" + healthColor(unit.health) })])
      ]);
    })
  );

  /* latest diagnostic — data-module="diagnostic-report" */
  var report = h("div", { "class": "card card--pad", "data-module": "diagnostic-report", "data-visual-id": "diagnostic-report" }, [
    h("div", { style: "display:flex;align-items:center;gap:9px" }, [
      h("div", { "class": "card__title", style: "flex:1" }, "Latest diagnostic"),
      h("span", { style: "font-size:12.5px;color:var(--ink-3)" }, u.lastVisit)
    ])
  ]);
  u.checks.forEach(function (g) {
    report.appendChild(h("div", { "class": "check-group" }, g.group));
    g.items.forEach(function (c) {
      report.appendChild(h("div", { "class": "check-row", "data-module": "check-row", "data-state": c.state }, [
        h("span", { "class": "check-dot", style: "background:" + (CHECK_DOT[c.state] || CHECK_DOT.ok) }),
        h("span", { style: "flex:1;min-width:0" }, c.name),
        c.note ? h("span", { style: "font-size:12px;color:var(--ink-3)" }, c.note) : null,
        h("span", { style: "font-weight:600" }, c.val)
      ]));
    });
  });

  /* unit passport — data-module="equipment-passport" */
  var passport = h("div", { "class": "card card--pad", "data-module": "equipment-passport", "data-visual-id": "equipment-passport" }, [
    h("div", { "class": "card__title", style: "margin-bottom:10px" }, "Unit passport"),
    kvRow("Model", u.model), kvRow("Location", u.place), kvRow("Serial", u.serial),
    kvRow("Installed", u.installed), kvRow("Warranty", u.warranty), kvRow("Last serviced", u.lastVisit),
    h("div", { style: "margin-top:14px;background:rgba(var(--accent-rgb),.06);border:1px solid rgba(var(--accent-rgb),.14);border-radius:14px;padding:12px 14px;font-size:13px;color:var(--ink-2)" }, [
      h("b", { style: "color:var(--ink)" }, "Technician\u2019s note \u00b7 "), u.note
    ]),
    h("div", { style: "margin-top:14px" }, markCareControlUnavailable(ActionButton({ variant: "btn--primary", label: "Book service for this unit", action: "booking.open", block: true, visualId: "care-book-unit" }), "Booking is unavailable: no approved booking destination"))
  ]);

  /* documents — data-module="document-vault" */
  var docs = h("div", { "class": "list-panel", "data-module": "document-vault", "data-visual-id": "document-vault" }, [
    h("div", { "class": "list-panel__head" }, [h("div", { "class": "list-panel__title", style: "flex:1" }, "Reports & warranties")])
  ].concat(m.docs.map(DocRow)));

  return h("div", { "class": "care-grid" }, [
    h("div", { "class": "care-col" }, [picker, report]),
    h("div", { "class": "care-col" }, [passport, docs])
  ]);
}
