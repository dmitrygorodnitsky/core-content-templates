// customer-portal-design/src/components/spa/SpaBookingFlow.js — Wave 16: the
// complete Calm Harbor booking flow inside the accepted drawer. One flow serves
// every supported entry (service Book, empty-state Book, Book again, Book with
// a credit, Reschedule). Steps: context → optional specialist (ONLY when the
// server returns eligible specialists) → eligible date/slot selection → an
// expiring SERVER slot hold → review with server display total, policy
// acknowledgement and the explicit "Simulation — no charge will be made"
// treatment. TRUTH RULES: slots/specialists/prices/hold expiry are all
// server-returned display data; the hold expiry is a server event (never a
// local countdown); a reschedule identifies the currently booked visit and the
// original visit is released ONLY by the confirmation readback; plan-credit
// eligibility/balance is never calculated here — the server's credit state
// (ok | unavailable | exhausted | changed) gates the flow verbatim.
import { h } from "../../dom.js";
import { F } from "../../../data/fixtures.js";
import { cmdPhase, currentAppointment, spaCatalogServices, spaCurrentApiDemoOpen, state } from "../../state.js";
import { ActionButton } from "../primitives/ActionButton.js";
import { InlineFailure, skel } from "../primitives/RouteStates.js";
import { SimulationBadge } from "./CommerceBits.js";

function svcByCode(code) { return spaCatalogServices().find(function (s) { return s.code === code; }) || null; }
// `days` is empty in a release build — see the note on spaFlowCapable in
// actions.js. Returning null here keeps every caller on its absent-data path
// instead of dereferencing undefined.
function dayByKey(key) {
  var days = (F.spaBooking && Array.isArray(F.spaBooking.days)) ? F.spaBooking.days : [];
  return days.find(function (d) { return d.key === key; }) || days[0] || null;
}
function slotLabel(f) {
  for (var i = 0; i < F.spaBooking.days.length; i++) {
    var d = F.spaBooking.days[i];
    var s = (d.slots || []).find(function (x) { return x.ref === f.slotRef; });
    if (s) return d.label + " \u00b7 " + s.label;
  }
  return null;
}

export function flowTitle(f) {
  if (f.entry === "reschedule") return "Reschedule your visit";
  if (f.entry === "credit") return "Book with a credit";
  if (f.entry === "book-again") return "Book again";
  return "Book a visit";
}

/* step rail — specialist appears ONLY when the server returned specialists */
function stepsBar(f) {
  var hasSpec = !!(f.serviceCode && (F.spaBooking.eligibleSpecialists[f.serviceCode] || []).length);
  var steps = f.entry === "reschedule"
    ? [{ k: "slots", l: "New time" }, { k: "review", l: "Review" }]
    : [{ k: "context", l: "Service" }].concat(hasSpec ? [{ k: "specialist", l: "Specialist" }] : []).concat([{ k: "slots", l: "Time" }, { k: "review", l: "Review" }]);
  var idx = steps.findIndex(function (s) { return s.k === f.step; });
  if (idx === -1) idx = 0;
  return h("div", { "class": "bk-steps", "data-module": "booking-steps", "data-visual-id": "booking-steps" }, steps.map(function (s, i) {
    return h("span", { "class": "bk-step" + (i === idx ? " bk-step--on" : i < idx ? " bk-step--done" : "") }, [
      h("i", null, i < idx ? "\u2713" : String(i + 1)), s.l
    ]);
  }));
}

/* the currently booked visit — a reschedule must never imply it changed */
function rescheduleCurrent(f) {
  var a = f.rescheduleOf ? currentAppointment() : null;
  if (!a) return null;
  return h("div", { "class": "bk-current", "data-module": "reschedule-current", "data-visual-id": "reschedule-current", "data-appointment-ref": a.ref }, [
    h("div", { "class": "bk-current__label" }, "Currently booked \u2014 unchanged until you confirm"),
    h("div", { style: "font-weight:700;font-size:13.5px", "data-bind": "appointment.service" }, a.service),
    h("div", { style: "font-size:12.5px;color:var(--ink-2)", "data-bind": "appointment.start" }, a.start + " \u00b7 " + a.timezoneNote + (a.specialist ? " \u00b7 " + a.specialist : ""))
  ]);
}

/* plan-credit context — the server's credit state gates the flow verbatim */
function creditCard(blockingOnly) {
  var f = state.spaFlow;
  if (!f || f.entry !== "credit") return null;
  var cs = state.spaCredit;
  var wrap = h("div", { "class": "bk-credit", "data-module": "plan-credit-context", "data-visual-id": "plan-credit-context", "data-plan-ref": f.planRef || "plan-4e19c3", "data-state": cs }, [
    h("div", { style: "display:flex;align-items:center;gap:8px" }, [
      h("span", { "class": "kind-chip kind-chip--package" }, "Package"),
      h("b", { style: "font-size:13.5px", "data-bind": "plan.title" }, "Six-visit facial series")
    ]),
    h("div", { style: "font-size:12.5px;line-height:1.5;color:var(--ink-2);margin-top:6px", "data-bind": "booking.creditNote" }, F.spaBooking.creditNotes[cs])
  ]);
  if (cs === "changed") wrap.appendChild(h("div", { style: "margin-top:8px" }, ActionButton({ variant: "btn--ghost", label: "Reload balance", action: "ui.retry", id: "plan-credit", visualId: "credit-reload" })));
  if (cs === "exhausted") wrap.appendChild(h("div", { style: "margin-top:8px;font-size:12px" }, h("span", { "class": "link-action", "data-action": "account.openPlan" }, "Open My plan \u203a")));
  if (cs === "unavailable") wrap.appendChild(h("div", { style: "margin-top:8px;font-size:12px" }, h("span", { "class": "link-action", "data-action": "support.open" }, "Contact support \u203a")));
  if (blockingOnly && cs === "ok") return null;
  return wrap;
}

/* ---- step: context (service / plan-credit) ---- */
function stepContext(f) {
  var parts = [];
  if (f.entry === "reschedule") parts.push(rescheduleCurrent(f));
  var credit = creditCard(false);
  if (credit) parts.push(credit);
  var creditBlocked = f.entry === "credit" && state.spaCredit !== "ok";

  var picked = svcByCode(f.serviceCode);
  var fixedService = f.entry === "credit" || f.entry === "reschedule";
  if (picked && fixedService) {
    parts.push(h("div", { "class": "bk-opt bk-opt--on", "data-module": "booking-context", "data-visual-id": "booking-service", "data-product-code": picked.code }, [
      h("i", { "class": "bk-opt__dot" }),
      h("div", { style: "flex:1;min-width:0" }, [
        h("div", { style: "font-weight:650;font-size:13.5px", "data-bind": "booking.service.name" }, picked.name),
        h("div", { style: "font-size:12px;color:var(--ink-3)" }, picked.shortDescription)
      ]),
      f.entry === "credit"
        ? h("b", { style: "font-size:13px" }, "1 credit")
        : h("b", { style: "font-size:13px", "data-bind": "booking.service.displayPrice" }, picked.displayPrice)
    ]));
    parts.push(h("div", { style: "margin-top:14px" }, ActionButton({ variant: "btn--primary", label: "Choose a time", action: "booking.selectService", id: picked.code, block: true, disabled: creditBlocked, visualId: "bk-continue" })));
  } else {
    parts.push(h("div", { "class": "bk-section-label" }, "Choose a treatment"));
    var list = h("div", { "class": "bk-opts", "data-module": "booking-context", "data-visual-id": "booking-service-list" });
    (spaCurrentApiDemoOpen() ? spaCatalogServices().map(function (service) { return service.code; }) : F.spaBooking.eligibleServices).forEach(function (code) {
      var s = svcByCode(code);
      if (!s) return;
      list.appendChild(h("button", { "class": "bk-opt" + (f.serviceCode === code ? " bk-opt--on" : ""), "data-action": "booking.selectService", "data-id": code, "data-product-code": code, "data-state": f.serviceCode === code ? "active" : undefined }, [
        h("i", { "class": "bk-opt__dot" }),
        h("div", { style: "flex:1;min-width:0;text-align:left" }, [
          h("div", { style: "font-weight:650;font-size:13.5px", "data-bind": "pim.services[].name" }, s.name),
          h("div", { style: "font-size:12px;color:var(--ink-3)" }, s.shortDescription)
        ]),
        h("b", { style: "font-size:13px", "data-bind": "pim.services[].displayPrice" }, s.displayPrice)
      ]));
    });
    parts.push(list);
    parts.push(h("div", { "class": "bk-note" }, "Prices come from the public catalog \u2014 the exact total is shown before you confirm."));
  }
  return parts;
}

/* ---- step: specialist (ONLY when the server returned any) ---- */
function stepSpecialist(f) {
  var refs = F.spaBooking.eligibleSpecialists[f.serviceCode] || [];
  var list = h("div", { "class": "bk-opts", "data-module": "specialist-options", "data-visual-id": "specialist-options" });
  refs.forEach(function (ref) {
    var sp = F.spaBooking.specialists[ref];
    list.appendChild(h("button", { "class": "bk-opt" + (f.specialistRef === ref ? " bk-opt--on" : ""), "data-action": "booking.selectSpecialist", "data-id": ref, "data-specialist-ref": ref }, [
      h("i", { "class": "bk-opt__dot" }),
      h("div", { style: "flex:1;min-width:0;text-align:left" }, [
        h("div", { style: "font-weight:650;font-size:13.5px", "data-bind": "booking.eligibleSpecialists[].name" }, sp.name),
        h("div", { style: "font-size:12px;color:var(--ink-3)" }, sp.role)
      ])
    ]));
  });
  list.appendChild(h("button", { "class": "bk-opt" + (!f.specialistRef ? " bk-opt--muted" : ""), "data-action": "booking.selectSpecialist", "data-id": "any" }, [
    h("i", { "class": "bk-opt__dot" }),
    h("div", { style: "flex:1;text-align:left;font-weight:650;font-size:13.5px" }, "No preference"),
    h("span", { style: "font-size:12px;color:var(--ink-3)" }, "first available")
  ]));
  return [
    h("div", { "class": "bk-section-label" }, "Who would you like?"),
    list,
    backLink()
  ];
}

/* ---- step: eligible dates & slots + the server hold ---- */
function stepSlots(f) {
  var parts = [];
  if (f.entry === "reschedule") parts.push(rescheduleCurrent(f));
  parts.push(h("div", { "class": "bk-section-label" }, f.entry === "reschedule" ? "Pick a new time" : "Pick a time"));

  /* slot source lifecycle — nothing is guessed while it loads or fails */
  if (state.spaSlots === "loading") {
    var sk = h("div", { "data-state": "loading", "aria-busy": "true" }, [skel("height:34px;border-radius:10px"), skel("height:120px;border-radius:14px;margin-top:10px")]);
    parts.push(sk);
    return parts;
  }
  if (state.spaSlots === "error") {
    parts.push(InlineFailure({ msg: "Available times didn\u2019t load \u2014 nothing is shown so nothing is guessed. Try again.", retryAction: "ui.retry", retryId: "slots", retryLabel: "Reload times" }));
    parts.push(backLink());
    return parts;
  }
  if (state.spaSlots === "empty") {
    parts.push(h("div", { "class": "bk-empty", "data-state": "empty" }, [
      h("div", { style: "font-weight:700;font-size:14px" }, "No times are open right now"),
      h("div", { style: "font-size:12.5px;color:var(--ink-2);line-height:1.5;margin-top:4px" }, "The studio opens new times regularly \u2014 check back soon, or our team can find one for you."),
      h("div", { style: "margin-top:8px" }, h("span", { "class": "link-action", "data-action": "support.open" }, "Contact support \u203a"))
    ]));
    parts.push(backLink());
    return parts;
  }

  var days = h("div", { "class": "bk-days", "data-module": "slot-days", "data-visual-id": "slot-days" });
  F.spaBooking.days.forEach(function (d) {
    days.appendChild(h("button", { "class": "bk-day" + (d.key === f.dayKey ? " bk-day--on" : ""), "data-action": "booking.selectSlot", "data-id": "day:" + d.key, "data-day-key": d.key }, d.label));
  });
  parts.push(days);

  var day = dayByKey(f.dayKey);
  var grid = h("div", { "class": "bk-slots", "data-module": "slot-grid", "data-visual-id": "slot-grid", "data-bind": "booking.eligibleSlots" });
  ((day && Array.isArray(day.slots)) ? day.slots : []).forEach(function (s) {
    grid.appendChild(h("button", { "class": "bk-slot" + (f.slotRef === s.ref ? " bk-slot--on" : ""), "data-action": "booking.selectSlot", "data-id": s.ref, "data-slot-ref": s.ref, "data-state": f.slotRef === s.ref ? "active" : undefined }, s.label));
  });
  parts.push(grid);

  var holdKey = "booking.hold:" + f.slotRef;
  var holdPhase = f.slotRef ? cmdPhase(holdKey) : "idle";
  if (holdPhase === "failed") parts.push(InlineFailure({ msg: "That time couldn\u2019t be held \u2014 nothing is booked. Pick it again or choose another time.", retryAction: "booking.retry", retryId: "hold", retryLabel: "Try holding again" }));
  if (holdPhase === "conflict") parts.push(InlineFailure({ msg: "That time was just taken \u2014 nothing is booked. Choose another time.", retryAction: "ui.retry", retryId: holdKey, retryLabel: "OK" }));
  parts.push(h("div", { style: "margin-top:14px" }, ActionButton({
    variant: "btn--primary", label: spaCurrentApiDemoOpen() ? "Review this time" : "Hold this time", action: "booking.hold", id: f.slotRef || undefined, block: true,
    pending: holdPhase === "pending", pendingLabel: "Holding\u2026", disabled: !f.slotRef || holdPhase === "conflict", visualId: "bk-hold"
  })));
  parts.push(h("div", { "class": "bk-note" }, spaCurrentApiDemoOpen()
    ? "This demo API has no availability hold. The time is only selected in this browser until Core confirms the appointment."
    : "Holding keeps the time briefly while you review \u2014 nothing is booked yet."));
  if (f.entry !== "reschedule") parts.push(backLink());
  return parts;
}

/* ---- step: review (server totals, policy ack, SIMULATED treatment) ---- */
function stepReview(f) {
  var parts = [];
  var svc = svcByCode(f.serviceCode);
  var picked = slotLabel(f);
  var sp = f.specialistRef ? F.spaBooking.specialists[f.specialistRef] : null;
  var confirmKey = "booking.confirm:" + F.spaBooking.ref;
  var phase = cmdPhase(confirmKey);
  var holdOk = state.spaHold === "held";
  var creditBlocked = f.entry === "credit" && state.spaCredit !== "ok";
  var origin = f.rescheduleOf ? currentAppointment() : null;

  if (f.entry === "reschedule" && origin) {
    parts.push(h("div", { "class": "bk-compare", "data-module": "reschedule-compare", "data-visual-id": "reschedule-compare", "data-appointment-ref": origin.ref }, [
      h("div", { "class": "bk-compare__cell" }, [
        h("div", { "class": "bk-current__label" }, "Currently booked"),
        h("div", { style: "font-weight:650;font-size:13px", "data-bind": "appointment.start" }, origin.start),
        h("div", { style: "font-size:11.5px;color:var(--ink-3)" }, "stays until you confirm")
      ]),
      h("div", { "class": "bk-compare__arrow" }, "\u2192"),
      h("div", { "class": "bk-compare__cell bk-compare__cell--new" }, [
        h("div", { "class": "bk-current__label" }, "Proposed new time"),
        h("div", { style: "font-weight:650;font-size:13px", "data-bind": "booking.hold.slot" }, picked || "\u2014"),
        h("div", { style: "font-size:11.5px;color:var(--ink-3)" }, "not booked yet")
      ])
    ]));
  }

  var review = h("div", { "class": "booking-review", "data-module": "booking-review", "data-visual-id": "booking-review", "data-payment-mode": "SIMULATED", "data-state": holdOk ? "held" : state.spaHold });

  /* the hold is a SERVER fact: a display-ready expiry label, never a local countdown */
  if (holdOk) review.appendChild(h("div", { "class": "booking-review__hold", "data-module": "booking-hold", "data-visual-id": "booking-hold", "data-hold-ref": spaCurrentApiDemoOpen() ? undefined : F.spaBooking.hold.ref, "data-bind": "booking.hold.untilLabel" }, spaCurrentApiDemoOpen()
    ? [h("b", null, "Current API demo"), " \u00b7 Core will validate the save when you confirm; no slot hold exists yet."]
    : [h("b", null, F.spaBooking.hold.untilLabel), " \u00b7 " + F.spaBooking.hold.note]));
  if (state.spaHold === "slot-expired") review.appendChild(InlineFailure({ msg: "Your held time expired \u2014 nothing was booked" + (f.entry === "reschedule" ? " and your original visit is unchanged" : "") + ". Pick a new time to continue.", retryAction: "ui.retry", retryId: "booking-hold", retryLabel: "Find a new time" }));
  if (state.spaHold === "repriced") review.appendChild(InlineFailure({ msg: "The price for this time changed while you were reviewing \u2014 reload and check it before confirming.", retryAction: "ui.retry", retryId: "booking-hold", retryLabel: "Reload & review" }));

  var det = h("div", { "class": "appt-details", style: "margin-top:10px" });
  var row = function (l, v) { return h("div", { "class": "appt-details__row" }, [h("div", { "class": "appt-details__label" }, l), h("div", { "class": "appt-details__val" }, v)]); };
  det.appendChild(row("Visit", h("b", { "data-bind": "booking.service" }, svc ? svc.name : "\u2014")));
  det.appendChild(row("When", h("span", null, [h("b", null, picked || "\u2014"), h("span", { style: "color:var(--ink-3)" }, " \u00b7 local time")])));
  det.appendChild(row("With", sp ? h("b", { "data-bind": "booking.specialist" }, sp.name) : h("span", { style: "color:var(--ink-3)" }, "First available specialist")));
  det.appendChild(row("Where", h("span", null, origin
    ? [h("b", null, F.spa.modeLabels[origin.visitMode]), origin.location ? " \u00b7 " + origin.location : null]
    : [h("b", null, F.spa.modeLabels.salon), " \u00b7 " + F.spaBooking.reviewLocation])));
  det.appendChild(row("Price", f.entry === "credit"
    ? h("span", { "data-bind": "booking.creditNote" }, [h("b", null, "1 visit credit"), " \u00b7 no charge for this visit"])
    : h("b", { "data-bind": "booking.displayTotal" }, F.spaBooking.displayTotals[f.serviceCode] || (svc && svc.displayPrice) || "\u2014")));
  review.appendChild(det);

  var creditBlock = creditCard(true);
  if (creditBlock) review.appendChild(creditBlock);

  /* server-owned policy copy + explicit acknowledgement */
  review.appendChild(h("div", { "class": "bk-note", "data-bind": "booking.policyNote", style: "margin-top:10px" }, F.spaBooking.policyNote));
  review.appendChild(h("label", { "class": "co-policy", "data-module": "policy-ack", "data-visual-id": "booking-policy-ack", "data-state": state.spaBookAck ? "acked" : "required" }, [
    h("button", { "class": "co-policy__box" + (state.spaBookAck ? " co-policy__box--on" : ""), "data-action": "booking.ackPolicy", role: "checkbox", "aria-checked": state.spaBookAck ? "true" : "false" }, state.spaBookAck ? "\u2713" : ""),
    h("span", { "data-bind": "booking.policy" }, F.spaBooking.policy)
  ]));

  review.appendChild(SimulationBadge(true));
  review.appendChild(h("div", { style: "font-size:11.5px;color:var(--ink-3);line-height:1.5;margin-top:6px" }, "No charge is made when you confirm \u2014 you pay at the studio as usual."));
  parts.push(review);

  if (phase === "failed") parts.push(InlineFailure({
    msg: f.entry === "reschedule" ? "Your visit wasn\u2019t moved \u2014 it\u2019s still booked at the original time." : "Your booking wasn\u2019t confirmed \u2014 nothing is scheduled yet.",
    retryAction: "booking.retry", retryId: "confirm", retryLabel: "Try again"
  }));
  if (phase === "conflict") parts.push(InlineFailure({
    msg: "That time window just changed \u2014 pick again before confirming. Nothing was booked.",
    retryAction: "ui.retry", retryId: confirmKey, retryLabel: "OK"
  }));

  parts.push(h("div", { style: "margin-top:14px" }, ActionButton({
    variant: "btn--primary", label: f.entry === "reschedule" ? "Confirm new time \u2014 no charge" : "Book \u2014 no charge",
    action: "booking.confirm", id: F.spaBooking.ref, block: true, lg: true, visualId: "confirm-booking",
    pending: phase === "pending", pendingLabel: "Confirming\u2026",
    disabled: !holdOk || !state.spaBookAck || creditBlocked || phase === "conflict"
  })));
  if (holdOk && !state.spaBookAck && phase === "idle") parts.push(h("div", { style: "font-size:11.5px;color:var(--ink-3);margin-top:7px;text-align:center" }, "Tick the policy box above to confirm"));
  parts.push(backLink("\u2039 Back to times"));
  return parts;
}

function backLink(label) {
  return h("div", { style: "margin-top:12px" }, h("span", { "class": "link-action", "data-action": "booking.back" }, label || "\u2039 Back"));
}

/* drawer body — one flow, four steps */
export function SpaBookingFlow() {
  var f = state.spaFlow;
  var body = h("div", { "class": "bk-flow", "data-module": "booking-flow", "data-visual-id": "booking-flow", "data-booking-ref": F.spaBooking.ref, "data-payment-mode": "SIMULATED", "data-state": f.step, "data-entry": f.entry });
  body.appendChild(stepsBar(f));
  var parts = f.step === "context" ? stepContext(f)
    : f.step === "specialist" ? stepSpecialist(f)
    : f.step === "slots" ? stepSlots(f)
    : stepReview(f);
  parts.forEach(function (p) { if (p) body.appendChild(p); });
  return body;
}
