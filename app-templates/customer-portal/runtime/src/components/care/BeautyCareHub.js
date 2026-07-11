// customer-portal/runtime/src/components/care/BeautyCareHub.js — Wave 9 (Beauty): appointments & packages, specialist preference, routine history, loyalty, products.
import { h } from "../../dom.js";
import { ActionButton } from "../primitives/ActionButton.js";
import { careChip } from "./shared.js";
import { markCareControlUnavailable } from "../../activation-policy.js";

export function BeautyCareHub(m, ui) {
  /* upcoming appointment — data-module="care-appointment"; stable data-appointment-id */
  var a = m.appointment;
  var appt = h("div", { "class": "card card--pad", "data-module": "care-appointment", "data-visual-id": "care-appointment", "data-appointment-id": a.id, "data-specialist-id": a.specialistId }, [
    h("div", { style: "display:flex;align-items:center;gap:9px" }, [
      h("div", { "class": "card__title", style: "flex:1" }, "Next appointment"),
      careChip("info", "Scheduled")
    ]),
    h("div", { style: "font-weight:800;font-size:20px;letter-spacing:-.02em;margin:10px 0 2px", "data-bind": "appointment.when" }, a.when),
    h("div", { style: "font-size:13.5px;color:var(--ink-2)", "data-bind": "appointment.name" }, a.name + " \u00b7 " + a.specialist),
    h("div", { style: "font-size:12.5px;color:var(--ink-3);margin-top:2px" }, a.where),
    h("div", { style: "margin-top:12px;background:rgba(var(--accent-rgb),.06);border:1px solid rgba(var(--accent-rgb),.14);border-radius:14px;padding:11px 14px;font-size:12.5px;color:var(--ink-2)" }, [
      h("b", { style: "color:var(--ink)" }, "Good to know \u00b7 "), a.prep
    ]),
    h("div", { style: "display:flex;gap:10px;margin-top:14px" }, [
      markCareControlUnavailable(ActionButton({ variant: "btn--primary", label: "Reschedule", action: "order.reschedule", id: a.orderId, visualId: "care-appt-reschedule" }), "Rescheduling is unavailable: no approved scheduling contract"),
      ActionButton({ variant: "btn--ghost", label: "Visit details", action: "order.open", id: a.orderId, visualId: "care-appt-open" })
    ])
  ]);

  /* session package — data-module="package-card"; stable data-package-id */
  var pk = m.pkg;
  var pct = Math.round(pk.used / pk.total * 100);
  var pkg = h("div", { "class": "card card--pad", "data-module": "package-card", "data-visual-id": "package-card", "data-package-id": pk.id }, [
    h("div", { style: "display:flex;align-items:center;gap:9px;flex-wrap:wrap" }, [
      h("div", { "class": "card__title", style: "flex:1", "data-bind": "pkg.name" }, pk.name),
      h("span", { style: "font-size:12.5px;color:var(--ink-3)" }, pk.detail)
    ]),
    h("div", { style: "font-weight:800;font-size:20px;letter-spacing:-.02em;margin:10px 0 0", "data-bind": "pkg.used" }, pk.used + " of " + pk.total + " sessions used"),
    h("div", { "class": "meter" }, [h("div", { "class": "meter__fill", style: "width:" + pct + "%" })]),
    h("div", { style: "display:flex;align-items:center;gap:10px;margin-top:12px;flex-wrap:wrap" }, [
      h("div", { style: "flex:1;min-width:180px;font-size:12.5px;color:var(--ink-2)" }, pk.next),
      markCareControlUnavailable(ActionButton({ variant: "btn--primary", label: "Book next session", action: "booking.open", visualId: "care-book-session" }), "Booking is unavailable: no approved booking destination")
    ])
  ]);

  /* treatment & routine history — data-module="treatment-history" */
  var history = h("div", { "class": "list-panel", "data-module": "treatment-history", "data-visual-id": "treatment-history" }, [
    h("div", { "class": "list-panel__head" }, [
      h("div", { "class": "list-panel__title", style: "flex:1" }, "Treatment history"),
      h("span", { style: "font-size:12.5px;color:var(--ink-3)" }, "formulas & notes saved")
    ])
  ]);
  m.history.forEach(function (ev) {
    history.appendChild(h("div", { "class": "log-row", "data-module": "treatment-row" }, [
      h("div", { "class": "log-date" }, ev.date),
      h("div", { style: "flex:1;min-width:0" }, [
        h("div", { style: "font-weight:600;font-size:13.5px", "data-bind": "visit.what" }, ev.what + " \u00b7 " + ev.who),
        h("div", { style: "font-size:12px;color:var(--ink-3);margin-top:2px" }, ev.note)
      ])
    ]));
  });

  /* specialist preference — data-module="specialist-picker";
     contract: care.selectSpecialist data-id = specialist.id (stable), never the name */
  var activeId = ui.selectedSpecialistId || m.preferredId;
  var picker = h("div", { "class": "card card--pad", "data-module": "specialist-picker", "data-visual-id": "specialist-picker" }, [
    h("div", { "class": "card__title" }, "Preferred specialist"),
    h("div", { style: "font-size:12.5px;color:var(--ink-2);margin:4px 0 12px" }, "Gets priority when we book your routine."),
    h("div", { "class": "unit-row", style: "flex-direction:column" }, m.specialists.map(function (s) {
      var active = s.id === activeId;
      return h("button", {
        "class": "unit-pick" + (active ? " unit-pick--active" : ""),
        "data-action": "care.selectSpecialist", "data-id": s.id,
        "data-state": active ? "active" : undefined
      }, [
        h("div", { style: "display:flex;align-items:center;gap:8px" }, [
          h("span", { style: "font-weight:700;font-size:14.5px;flex:1", "data-bind": "specialist.name" }, s.name),
          active ? careChip("info", "Preferred") : h("span", { style: "font-size:12px;color:var(--ink-3)" }, "\u2605 " + s.rating)
        ]),
        h("div", { style: "font-size:12px;color:var(--ink-3);margin-top:2px" }, s.role + " \u00b7 " + s.visits + (active ? " \u00b7 \u2605 " + s.rating : ""))
      ]);
    }))
  ]);

  /* at-home routine from the specialist — data-module="routine-card" */
  var routine = h("div", { "class": "card card--pad", "data-module": "routine-card", "data-visual-id": "routine-card" }, [
    h("div", { "class": "card__title" }, m.routine.title),
    h("div", { style: "font-size:13.5px;color:var(--ink-2);margin-top:8px;line-height:1.55", "data-bind": "routine.note" }, m.routine.note),
    h("div", { style: "font-size:12px;color:var(--ink-3);margin-top:8px" }, m.routine.by)
  ]);

  /* loyalty / membership — data-module="loyalty-card"; stable data-plan-id */
  var lo = m.loyalty;
  var lpct = Math.min(100, Math.round(lo.points / lo.nextAt * 100));
  var loyalty = h("div", { "class": "card card--pad", "data-module": "loyalty-card", "data-visual-id": "loyalty-card", "data-plan-id": lo.id }, [
    h("div", { style: "display:flex;align-items:center;gap:9px" }, [
      h("div", { "class": "card__title", style: "flex:1" }, "Loyalty"),
      careChip("info", lo.tier)
    ]),
    h("div", { "class": "score-big", style: "margin-top:10px", "data-bind": "loyalty.points" }, String(lo.points)),
    h("div", { style: "font-size:12.5px;color:var(--ink-2);margin-top:2px" }, "of " + lo.nextAt + " pts \u00b7 " + lo.reward),
    h("div", { "class": "meter" }, [h("div", { "class": "meter__fill", style: "width:" + lpct + "%" })]),
    h("div", { style: "display:flex;align-items:center;gap:10px;margin-top:12px" }, [
      h("div", { style: "flex:1;font-size:12px;color:var(--ink-3)" }, lo.renews),
      h("div", { "class": "link-action", "data-action": "profile.managePlan" }, "Manage \u203a")
    ])
  ]);

  /* routine products — data-module="care-products"; reuses the cart contract (data-id = product name) */
  var recs = m.productRecs.items;
  var products = h("div", { "class": "list-panel", "data-module": "care-products", "data-visual-id": "care-products" }, [
    h("div", { "class": "list-panel__head" }, [
      h("div", { "class": "list-panel__title", style: "flex:1" }, "For your routine"),
      h("span", { style: "font-size:12px;color:var(--ink-3)" }, m.productRecs.note)
    ])
  ]);
  recs.forEach(function (p) {
    products.appendChild(h("div", { "class": "log-row", "data-module": "care-product-row" }, [
      h("div", { style: "flex:1;min-width:0" }, [
        h("div", { style: "font-weight:600;font-size:13.5px", "data-bind": "product.name" }, p.name),
        h("div", { style: "font-size:12px;color:var(--ink-3);margin-top:1px" }, p.blurb + " \u00b7 " + p.price)
      ]),
      h("div", { "class": "link-action", "data-action": "cart.addItem", "data-id": p.name }, "Add \u203a")
    ]));
  });

  return h("div", { "class": "care-grid" }, [
    h("div", { "class": "care-col" }, [appt, pkg, history]),
    h("div", { "class": "care-col" }, [picker, routine, loyalty, products])
  ]);
}
