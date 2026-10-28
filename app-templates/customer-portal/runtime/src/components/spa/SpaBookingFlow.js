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
import { ACTIONS } from "../../actions.js";
import { cmdPhase, currentAppointment, spaAddonChange, spaBookingModel, spaBookingOpts, spaBookingQuote, spaBookingSlotState, spaCatalogServices, spaCurrentApiDemoOpen, spaEligibleLocations, spaFlowSteps, spaNoteState, spaOptionsComplete, spaSelectedAddOns, spaSelectedLocation, spaSelectedSlot, spaVisitMode, state } from "../../state.js";
import { ActionButton } from "../primitives/ActionButton.js";
import { InlineFailure, skel } from "../primitives/RouteStates.js";
import { SimulationBadge } from "./CommerceBits.js";

function svcByCode(code) { return spaCatalogServices().find(function (s) { return s.code === code; }) || null; }
// `days` is empty in a release build — see the note on spaFlowCapable in
// actions.js. Returning null here keeps every caller on its absent-data path
// instead of dereferencing undefined.
function dayByKey(key) {
  var booking = spaBookingModel();
  var days = (booking && Array.isArray(booking.days)) ? booking.days : [];
  return days.find(function (d) { return d.key === key; }) || days[0] || null;
}
function slotLabel(f) {
  var days = spaBookingModel().days || [];
  for (var i = 0; i < days.length; i++) {
    var d = days[i];
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
  var steps = spaFlowSteps(f);
  var idx = steps.findIndex(function (s) { return s.k === f.step; });
  if (idx === -1) idx = 0;
  return h("div", { "class": "bk-steps", "data-module": "booking-steps", "data-visual-id": "booking-steps", "data-step-count": String(steps.length) }, steps.map(function (s, i) {
    return h("span", { "class": "bk-step" + (i === idx ? " bk-step--on" : i < idx ? " bk-step--done" : ""), "data-step": s.k, "data-state": i === idx ? "active" : undefined }, [
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
    h("div", { style: "font-size:12.5px;line-height:1.5;color:var(--ink-2);margin-top:6px", "data-bind": "booking.creditNote" }, spaBookingModel().creditNotes[cs])
  ]);
  if (cs === "changed") wrap.appendChild(h("div", { style: "margin-top:8px" }, ActionButton({ variant: "btn--ghost", label: "Reload balance", action: "ui.retry", id: "plan-credit", visualId: "credit-reload" })));
  if (cs === "exhausted") wrap.appendChild(h("div", { style: "margin-top:8px;font-size:12px" }, h("span", { "class": "link-action", "data-action": "account.openPlan" }, "Open My plan \u203a")));
  if (cs === "unavailable") wrap.appendChild(h("div", { style: "margin-top:8px;font-size:12px" }, h("span", { "class": "link-action", "data-action": "support.open" }, "Contact support \u203a")));
  if (blockingOnly && cs === "ok") return null;
  return wrap;
}

/* ---- step: context (service / plan-credit) ---- */
function stepContext(f) {
  var booking = spaBookingModel();
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
    booking.eligibleServices.forEach(function (code) {
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

function srcBlock(cfg) {
  var wrap = h("div", { "class": "bk-empty", "data-state": cfg.state, "data-visual-id": cfg.visualId }, [
    h("div", { style: "font-weight:700;font-size:13.5px" }, cfg.title),
    h("div", { style: "font-size:12.5px;color:var(--ink-2);line-height:1.5;margin-top:4px", "data-bind": cfg.bind }, cfg.copy)
  ]);
  if (cfg.support) wrap.appendChild(h("div", { style: "margin-top:8px;font-size:12px" }, h("span", { "class": "link-action", "data-action": "support.open" }, "Contact support \u203a")));
  return wrap;
}

function visitModeGroup(f, o) {
  if (!o.capabilities.visitMode || !o.visitModes.length) return null;
  var modes = o.visitModes;
  var group = h("div", { "class": "bk-group", "data-module": "visit-mode-options", "data-visual-id": "booking-visit-mode", "data-state": modes.length > 1 ? "ready" : "fixed" });
  group.appendChild(h("div", { "class": "bk-section-label" }, modes.length > 1 ? "How would you like your visit?" : "Your visit"));
  if (modes.length === 1) {
    group.appendChild(h("div", { "class": "bk-opt bk-opt--fixed", "data-visit-mode": modes[0].code }, [
      h("div", { style: "flex:1;min-width:0" }, h("div", { style: "font-weight:650;font-size:13.5px", "data-bind": "bookingOptions.visitModes[].label" }, modes[0].label)),
      h("span", { "class": "bk-tag" }, "Set by the studio")
    ]));
    return group;
  }
  var list = h("div", { "class": "bk-opts" });
  var cur = spaVisitMode(o);
  modes.forEach(function (m) {
    var on = !!(cur && cur.code === m.code);
    list.appendChild(h("button", { "class": "bk-opt" + (on ? " bk-opt--on" : ""), "data-action": "booking.selectVisitMode", "data-id": m.code, "data-visit-mode": m.code, "data-state": on ? "active" : undefined, role: "radio", "aria-checked": on ? "true" : "false" }, [
      h("i", { "class": "bk-opt__dot" }),
      h("div", { style: "flex:1;min-width:0;text-align:left" }, [
        h("div", { style: "font-weight:650;font-size:13.5px", "data-bind": "bookingOptions.visitModes[].label" }, m.label),
        m.locationRequired ? h("div", { style: "font-size:12px;color:var(--ink-3)" }, "You\u2019ll choose the place next") : null
      ])
    ]));
  });
  group.appendChild(list);
  return group;
}

function locationGroup(f, o) {
  if (!o.capabilities.location) return null;
  var mode = spaVisitMode(o);
  if (o.capabilities.visitMode && o.visitModes.length > 1 && !mode) return null;
  var src = state.spaLocSrc;
  var group = h("div", { "class": "bk-group", "data-module": "location-options", "data-visual-id": "booking-locations", "data-state": src });
  group.appendChild(h("div", { "class": "bk-section-label" }, "Where should we see you?"));
  if (src === "loading") {
    group.setAttribute("aria-busy", "true");
    group.appendChild(h("div", null, [skel("height:52px;border-radius:14px"), skel("height:52px;border-radius:14px;margin-top:9px")]));
    return group;
  }
  if (src === "error") { group.appendChild(InlineFailure({ msg: o.copy.locationsError, retryAction: "booking.reloadLocations", retryLabel: "Reload places" })); return group; }
  if (src === "unavailable") { group.appendChild(srcBlock({ state: "unavailable", visualId: "booking-locations-unavailable", title: "The studio will confirm the place", copy: o.copy.locationsUnavailable, bind: "bookingOptions.locations" })); return group; }
  if (src === "empty") { group.appendChild(srcBlock({ state: "empty", visualId: "booking-locations-empty", title: "No place is open for this visit", copy: o.copy.locationsEmpty, bind: "bookingOptions.locations", support: true })); return group; }
  var locations = spaEligibleLocations(o);
  if (!locations.length) { group.appendChild(srcBlock({ state: "empty", visualId: "booking-locations-no-place", title: "No place on file for at-home visits", copy: o.copy.noSavedPlace, bind: "bookingOptions.locations", support: true })); return group; }
  if (src === "ineligible") group.appendChild(InlineFailure({ msg: o.copy.locationIneligible, retryAction: "booking.reloadLocations", retryLabel: "Reload places" }));
  if (locations.length === 1 && src !== "ineligible") {
    group.appendChild(h("div", { "class": "bk-opt bk-opt--fixed", "data-location-ref": locations[0].ref }, [h("div", { style: "flex:1;min-width:0" }, h("div", { style: "font-weight:650;font-size:13.5px", "data-bind": "bookingOptions.locations[].label" }, locations[0].label)), h("span", { "class": "bk-tag" }, "Only place available")]));
    return group;
  }
  var picked = spaSelectedLocation(o);
  var opts = h("div", { "class": "bk-opts" });
  locations.forEach(function (loc) {
    var on = !!(picked && picked.ref === loc.ref);
    opts.appendChild(h("button", { "class": "bk-opt" + (on ? " bk-opt--on" : ""), "data-action": "booking.selectLocation", "data-id": loc.ref, "data-location-ref": loc.ref, "data-state": on ? "active" : undefined, role: "radio", "aria-checked": on ? "true" : "false" }, [h("i", { "class": "bk-opt__dot" }), h("div", { style: "flex:1;min-width:0;text-align:left" }, h("div", { style: "font-weight:650;font-size:13.5px", "data-bind": "bookingOptions.locations[].label" }, loc.label))]));
  });
  group.appendChild(opts);
  group.appendChild(h("div", { "class": "bk-note" }, "Places come from your account \u2014 only the short label is shown here."));
  return group;
}

function addonGroup(f, o) {
  if (!o.capabilities.addOns) return null;
  var src = state.spaAddonSrc;
  var group = h("div", { "class": "bk-group", "data-module": "addon-options", "data-visual-id": "booking-addons", "data-state": src });
  group.appendChild(h("div", { "class": "bk-section-label" }, "Add to your visit"));
  if (src === "loading") { group.setAttribute("aria-busy", "true"); group.appendChild(h("div", null, [skel("height:58px;border-radius:14px"), skel("height:58px;border-radius:14px;margin-top:9px")])); return group; }
  if (src === "error") { group.appendChild(InlineFailure({ msg: o.copy.addOnsError, retryAction: "ui.retry", retryId: "booking-addons", retryLabel: "Reload extras" })); return group; }
  if (src === "unavailable") { group.appendChild(srcBlock({ state: "unavailable", visualId: "booking-addons-unavailable", title: "Extras aren\u2019t connected yet", copy: o.copy.addOnsUnavailable, bind: "bookingOptions.addOns" })); return group; }
  if (!o.addOns.length) return null;
  if (src === "ineligible") group.appendChild(h("div", { "class": "bk-note", "data-bind": "bookingOptions.addOns", style: "margin:0 0 10px" }, o.copy.addOnsIneligible));
  var change = spaAddonChange(o);
  if (change) group.appendChild(InlineFailure({ msg: change.copy, retryAction: "ui.retry", retryId: "booking-addons", retryLabel: "Reload extras" }));
  var selected = f.addOns || [];
  var list = h("div", { "class": "bk-opts" });
  o.addOns.forEach(function (addon) {
    var togglable = (addon.allowedActions || []).indexOf("toggle") !== -1;
    var on = selected.indexOf(addon.ref) !== -1 || (addon.required && addon.selected && !togglable);
    var phase = cmdPhase("booking.toggleAddon:" + addon.ref);
    var meta = h("div", { "class": "bk-addon__meta" }, [addon.displayPrice ? h("b", { style: "font-size:13px", "data-bind": "bookingOptions.addOns[].displayPrice" }, addon.displayPrice) : null, addon.durationNote ? h("span", { "class": "bk-addon__dur", "data-bind": "bookingOptions.addOns[].durationNote" }, addon.durationNote) : null]);
    var body = h("div", { "class": "bk-addon__body" }, [h("div", { "class": "bk-addon__name", "data-bind": "bookingOptions.addOns[].name" }, addon.name), addon.description ? h("div", { "class": "bk-addon__desc", "data-bind": "bookingOptions.addOns[].description" }, addon.description) : null, addon.required ? h("span", { "class": "bk-tag bk-tag--req" }, togglable ? "Required" : "Added by the studio") : null]);
    var box = h("span", { "class": "bk-check" + (on ? " bk-check--on" : "") }, on ? "\u2713" : "");
    if (!togglable) { list.appendChild(h("div", { "class": "bk-opt bk-addon bk-opt--fixed", "data-addon-ref": addon.ref, "data-state": "fixed" }, [box, body, meta])); return; }
    list.appendChild(h("button", { "class": "bk-opt bk-addon" + (on ? " bk-opt--on" : ""), "data-action": "booking.toggleAddon", "data-id": addon.ref, "data-addon-ref": addon.ref, "data-state": phase !== "idle" ? phase : (on ? "active" : undefined), role: "checkbox", "aria-checked": on ? "true" : "false", "aria-busy": phase === "pending" ? "true" : undefined, disabled: phase === "pending" ? true : undefined }, [box, body, phase === "pending" ? h("span", { "class": "btn-spinner" }) : meta]));
  });
  group.appendChild(list);
  group.appendChild(h("div", { "class": "bk-note" }, Object.keys(state.commands).some(function (key) { return key.indexOf("booking.toggleAddon:") === 0 && state.commands[key] === "pending"; }) ? o.copy.addOnPendingNote : "Amounts and added time come from the studio \u2014 the total is shown before you confirm."));
  return group;
}

function stepOptions(f) {
  var o = spaBookingOpts();
  var parts = [];
  if (f.entry === "reschedule") parts.push(rescheduleCurrent(f));
  [visitModeGroup(f, o), locationGroup(f, o), addonGroup(f, o)].forEach(function (group) { if (group) parts.push(group); });
  var steps = spaFlowSteps(f);
  var index = steps.findIndex(function (step) { return step.k === "options"; });
  var next = steps[index + 1] || { k: "slots" };
  var ready = spaOptionsComplete(o);
  parts.push(h("div", { style: "margin-top:16px" }, ActionButton({ variant: "btn--primary", label: next.k === "specialist" ? "Choose a specialist" : "Choose a time", action: "booking.next", block: true, disabled: !ready, visualId: "bk-options-continue" })));
  if (!ready) {
    var why = "Choose how you\u2019d like your visit to continue";
    var mode = spaVisitMode(o);
    if (mode && o.capabilities.location && !spaSelectedLocation(o)) why = "Pick a place to continue";
    if (state.spaLocSrc === "loading") why = "Loading the places you can choose\u2026";
    if (state.spaLocSrc === "error" || state.spaLocSrc === "empty") why = "Nothing can be booked until places load \u2014 nothing was reserved";
    parts.push(h("div", { style: "font-size:11.5px;color:var(--ink-3);margin-top:7px;text-align:center" }, why));
  }
  parts.push(backLink());
  return parts;
}

/* ---- step: specialist (ONLY when the server returned any) ---- */
function stepSpecialist(f) {
  var booking = spaBookingModel();
  var refs = booking.eligibleSpecialists[f.serviceCode] || [];
  var list = h("div", { "class": "bk-opts", "data-module": "specialist-options", "data-visual-id": "specialist-options" });
  refs.forEach(function (ref) {
    var sp = booking.specialists[ref];
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
  if (f.reloadedBy) parts.push(h("div", { "class": "bk-changed", "data-visual-id": "booking-options-changed", "data-state": "changed", role: "status", "data-bind": "bookingOptions.selectionVersion" }, spaBookingOpts().copy.optionsChangedSlot));
  parts.push(h("div", { "class": "bk-section-label" }, f.entry === "reschedule" ? "Pick a new time" : "Pick a time"));

  /* slot source lifecycle — nothing is guessed while it loads or fails */
  var slotState = spaBookingSlotState();
  if (slotState === "loading") {
    var sk = h("div", { "data-state": "loading", "aria-busy": "true" }, [skel("height:34px;border-radius:10px"), skel("height:120px;border-radius:14px;margin-top:10px")]);
    parts.push(sk);
    return parts;
  }
  if (slotState === "error") {
    parts.push(InlineFailure({ msg: "Available times didn\u2019t load \u2014 nothing is shown so nothing is guessed. Try again.", retryAction: "ui.retry", retryId: "slots", retryLabel: "Reload times" }));
    if (hasPrev(f)) parts.push(backLink());
    return parts;
  }
  if (slotState === "empty") {
    parts.push(h("div", { "class": "bk-empty", "data-state": "empty" }, [
      h("div", { style: "font-weight:700;font-size:14px" }, "No times are open right now"),
      h("div", { style: "font-size:12.5px;color:var(--ink-2);line-height:1.5;margin-top:4px" }, "The studio opens new times regularly \u2014 check back soon, or our team can find one for you."),
      h("div", { style: "margin-top:8px" }, h("span", { "class": "link-action", "data-action": "support.open" }, "Contact support \u203a"))
    ]));
    if (hasPrev(f)) parts.push(backLink());
    return parts;
  }

  var days = h("div", { "class": "bk-days", "data-module": "slot-days", "data-visual-id": "slot-days" });
  spaBookingModel().days.forEach(function (d) {
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
  if (hasPrev(f)) parts.push(backLink());
  return parts;
}

function noteField(confirmableOtherwise) {
  var note = spaNoteState();
  if (!note.enabled) return null;
  var stateName = note.invalid ? "invalid" : note.near ? "near-limit" : note.len ? "filled" : "empty";
  var wrap = h("div", { "class": "bk-note-field", "data-module": "booking-notes", "data-visual-id": "booking-note", "data-state": stateName });
  var input = h("textarea", { "class": "field bk-note-field__input", id: "bk-note-input", rows: "3", "data-action": "booking.changeNotes", "data-bind": "bookingOptions.notes.value", "aria-describedby": "bk-note-help bk-note-err", "aria-invalid": note.invalid ? "true" : "false", "data-state": note.invalid ? "invalid" : undefined }, note.value);
  var counter = h("span", { "class": "bk-counter" + (note.invalid ? " bk-counter--over" : ""), "data-bind": "bookingOptions.notes.maxLength" }, note.len + "/" + note.max);
  var error = h("div", { "class": "field-error", id: "bk-note-err", role: "alert" }, note.invalid ? note.errorCopy : "");
  if (!note.invalid) error.hidden = true;
  input.addEventListener("input", function () {
    ACTIONS["booking.changeNotes"](input.value);
    var length = input.value.length;
    var over = length > note.max;
    counter.textContent = length + "/" + note.max;
    counter.classList.toggle("bk-counter--over", over);
    input.setAttribute("aria-invalid", over ? "true" : "false");
    if (over) { input.setAttribute("data-state", "invalid"); error.textContent = note.errorCopy; error.hidden = false; }
    else { input.removeAttribute("data-state"); error.hidden = true; error.textContent = ""; }
    wrap.setAttribute("data-state", over ? "invalid" : (length >= note.max - 30 ? "near-limit" : (length ? "filled" : "empty")));
    var button = document.querySelector('[data-visual-id="confirm-booking"]');
    if (button) { if (over || !confirmableOtherwise) button.setAttribute("disabled", ""); else button.removeAttribute("disabled"); }
  });
  wrap.appendChild(h("div", { "class": "bk-note-field__head" }, [h("label", { "class": "field-label", "for": "bk-note-input" }, "Note for the studio"), counter]));
  wrap.appendChild(input);
  wrap.appendChild(error);
  wrap.appendChild(h("div", { "class": "bk-note", id: "bk-note-help", "data-bind": "bookingOptions.notes.helperText" }, note.helperText));
  wrap.appendChild(h("div", { "class": "bk-note-field__sent", "data-bind": "bookingOptions.notes" }, spaBookingOpts().copy.noteSentWith));
  return wrap;
}

/* ---- step: review (server totals, policy ack, SIMULATED treatment) ---- */
function stepReview(f) {
  var parts = [];
  var booking = spaBookingModel();
  var options = spaBookingOpts();
  var svc = svcByCode(f.serviceCode);
  var picked = slotLabel(f);
  var selectedSlot = spaSelectedSlot();
  var sp = f.specialistRef ? booking.specialists[f.specialistRef] : null;
  var specialistsOffered = (booking.eligibleSpecialists[f.serviceCode] || []).length > 0;
  var confirmKey = "booking.confirm:" + booking.ref;
  var phase = cmdPhase(confirmKey);
  var holdOk = state.spaHold === "held";
  var creditBlocked = f.entry === "credit" && state.spaCredit !== "ok";
  var origin = f.rescheduleOf ? currentAppointment() : null;
  var addonChange = spaAddonChange(options);
  var note = spaNoteState(options);
  var quote = spaBookingQuote(options);
  var selectedAddOns = spaSelectedAddOns(options);

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

  var review = h("div", { "class": "booking-review", "data-module": "booking-review", "data-visual-id": "booking-review", "data-payment-mode": "SIMULATED", "data-state": addonChange ? addonChange.kind : (holdOk ? "held" : state.spaHold), "data-selection-version": options.selectionVersion });

  /* the hold is a SERVER fact: a display-ready expiry label, never a local countdown */
  if (holdOk) review.appendChild(h("div", { "class": "booking-review__hold", "data-module": "booking-hold", "data-visual-id": "booking-hold", "data-hold-ref": spaCurrentApiDemoOpen() ? undefined : booking.hold.ref, "data-bind": "booking.hold.untilLabel" }, spaCurrentApiDemoOpen()
    ? [h("b", null, "Current API demo"), " \u00b7 Core will validate the save when you confirm; no slot hold exists yet."]
    : [h("b", null, booking.hold.untilLabel), " \u00b7 " + booking.hold.note]));
  if (state.spaHold === "slot-expired") review.appendChild(InlineFailure({ msg: "Your held time expired \u2014 nothing was booked" + (f.entry === "reschedule" ? " and your original visit is unchanged" : "") + ". Pick a new time to continue.", retryAction: "ui.retry", retryId: "booking-hold", retryLabel: "Find a new time" }));
  if (state.spaHold === "repriced") review.appendChild(InlineFailure({ msg: "The price for this time changed while you were reviewing \u2014 reload and check it before confirming.", retryAction: "ui.retry", retryId: "booking-hold", retryLabel: "Reload & review" }));
  if (addonChange) review.appendChild(InlineFailure({ msg: addonChange.copy, retryAction: "ui.retry", retryId: "booking-addons", retryLabel: "Reload extras" }));

  var det = h("div", { "class": "appt-details", style: "margin-top:10px" });
  var row = function (l, v) { return h("div", { "class": "appt-details__row" }, [h("div", { "class": "appt-details__label" }, l), h("div", { "class": "appt-details__val" }, v)]); };
  det.appendChild(row("Visit", h("b", { "data-bind": "booking.service" }, svc ? svc.name : "\u2014")));
  det.appendChild(row("When", h("span", null, [h("b", null, picked || "\u2014"), h("span", { style: "color:var(--ink-3)" }, " \u00b7 local time")])));
  if (sp) det.appendChild(row("With", h("b", { "data-bind": "booking.specialist" }, sp.name)));
  else if (f.entry === "reschedule" && origin && origin.specialist) det.appendChild(row("With", h("span", null, [h("b", { "data-bind": "appointment.specialist" }, origin.specialist), h("span", { style: "color:var(--ink-3)" }, " \u00b7 unchanged")])));
  else if (specialistsOffered && f.entry !== "reschedule") det.appendChild(row("With", h("span", { style: "color:var(--ink-3)", "data-bind": "booking.specialist" }, "No preference \u2014 first available")));

  var mode = spaVisitMode(options);
  var location = spaSelectedLocation(options);
  var whereBits = [];
  if (mode) whereBits.push(h("b", { "data-bind": "bookingOptions.visitModes[].label" }, mode.label));
  if (location) whereBits.push(h("span", { "data-bind": "bookingOptions.locations[].label" }, (whereBits.length ? " \u00b7 " : "") + location.label));
  if (!whereBits.length && origin) {
    if (origin.visitMode && F.spa.modeLabels[origin.visitMode]) whereBits.push(h("b", { "data-bind": "appointment.visitMode" }, F.spa.modeLabels[origin.visitMode]));
    if (origin.location) whereBits.push(h("span", { "data-bind": "appointment.location" }, (whereBits.length ? " \u00b7 " : "") + origin.location));
  }
  if (!whereBits.length && selectedSlot && selectedSlot.locationName) whereBits.push(h("span", { "data-bind": "booking.slot.locationName" }, selectedSlot.locationName));
  if (options.capabilities.location && state.spaLocSrc === "unavailable") whereBits.push(h("div", { style: "font-size:11.5px;color:var(--ink-3);line-height:1.45;margin-top:3px", "data-bind": "bookingOptions.locations" }, options.copy.locationsUnavailable));
  if (whereBits.length) det.appendChild(row("Where", h("span", null, whereBits)));

  if (selectedAddOns.length) {
    var addonList = h("div", { "class": "bk-review-addons", "data-module": "booking-review-addons", "data-visual-id": "booking-review-addons" });
    selectedAddOns.forEach(function (addon) { addonList.appendChild(h("div", { "class": "bk-review-addon", "data-addon-ref": addon.ref }, [h("span", { "class": "bk-review-addon__name", "data-bind": "bookingOptions.addOns[].name" }, addon.name), addon.displayPrice ? h("span", { "class": "bk-review-addon__amt", "data-bind": "bookingOptions.addOns[].displayPrice" }, addon.displayPrice) : null])); });
    det.appendChild(row(selectedAddOns.length > 1 ? "Extras" : "Extra", addonList));
  }
  if (f.entry === "credit") det.appendChild(row("Price", h("span", { "data-bind": "booking.creditNote" }, [h("b", null, "1 visit credit"), " \u00b7 no charge for this visit"])));
  else if (quote && quote.displaySubtotal) {
    det.appendChild(row("Subtotal", h("span", { "data-bind": "booking.displaySubtotal" }, quote.displaySubtotal)));
    det.appendChild(row("Total", h("b", { "data-bind": "booking.displayTotal" }, quote.displayTotal)));
  } else det.appendChild(row("Price", h("b", { "data-bind": "booking.displayTotal" }, (quote && quote.displayTotal) || booking.displayTotals[f.serviceCode] || (svc && svc.displayPrice) || "\u2014")));
  review.appendChild(det);

  var creditBlock = creditCard(true);
  if (creditBlock) review.appendChild(creditBlock);

  var confirmable = holdOk && state.spaBookAck && !creditBlocked && !addonChange && phase !== "conflict";
  var noteBlock = noteField(confirmable);
  if (noteBlock) review.appendChild(noteBlock);

  /* server-owned policy copy + explicit acknowledgement */
  review.appendChild(h("div", { "class": "bk-note", "data-bind": "booking.policyNote", style: "margin-top:10px" }, booking.policyNote));
  review.appendChild(h("label", { "class": "co-policy", "data-module": "policy-ack", "data-visual-id": "booking-policy-ack", "data-state": state.spaBookAck ? "acked" : "required" }, [
    h("button", { "class": "co-policy__box" + (state.spaBookAck ? " co-policy__box--on" : ""), "data-action": "booking.ackPolicy", role: "checkbox", "aria-checked": state.spaBookAck ? "true" : "false" }, state.spaBookAck ? "\u2713" : ""),
    h("span", { "data-bind": "booking.policy" }, booking.policy)
  ]));

  review.appendChild(SimulationBadge(true));
  review.appendChild(h("div", { style: "font-size:11.5px;color:var(--ink-3);line-height:1.5;margin-top:6px" }, "No charge is made when you confirm \u2014 you pay at the studio as usual."));
  parts.push(review);

  if (phase === "failed") parts.push(InlineFailure({
    msg: f.entry === "reschedule" ? "Your visit wasn\u2019t moved \u2014 it\u2019s still booked at the original time." : "Your booking wasn\u2019t confirmed \u2014 nothing is scheduled yet." + (note.enabled && note.len ? " Your note is kept here." : ""),
    retryAction: "booking.retry", retryId: "confirm", retryLabel: "Try again"
  }));
  if (phase === "conflict") parts.push(InlineFailure({
    msg: "That time window just changed \u2014 pick again before confirming. Nothing was booked.",
    retryAction: "ui.retry", retryId: confirmKey, retryLabel: "OK"
  }));

  parts.push(h("div", { style: "margin-top:14px" }, ActionButton({
    variant: "btn--primary", label: f.entry === "reschedule" ? "Request new time \u2014 no charge" : "Send booking request \u2014 no charge",
    action: "booking.confirm", id: booking.ref, block: true, lg: true, visualId: "confirm-booking",
    pending: phase === "pending", pendingLabel: "Confirming\u2026",
    disabled: !confirmable || (note.enabled && note.invalid)
  })));
  if (holdOk && !state.spaBookAck && phase === "idle" && !addonChange) parts.push(h("div", { style: "font-size:11.5px;color:var(--ink-3);margin-top:7px;text-align:center" }, "Tick the policy box above to confirm"));
  if (addonChange) parts.push(h("div", { style: "font-size:11.5px;color:var(--ink-3);margin-top:7px;text-align:center" }, "Reload the extras above to review the change before confirming"));
  parts.push(backLink("\u2039 Back to times"));
  return parts;
}

function backLink(label) {
  return h("div", { style: "margin-top:12px" }, h("span", { "class": "link-action", "data-action": "booking.back" }, label || "\u2039 Back"));
}

function hasPrev(f) {
  var steps = spaFlowSteps(f);
  return steps.findIndex(function (step) { return step.k === f.step; }) > 0;
}

/* drawer body — one flow, four steps */
export function SpaBookingFlow() {
  var f = state.spaFlow;
  var options = spaBookingOpts();
  var body = h("div", { "class": "bk-flow", "data-module": "booking-flow", "data-visual-id": "booking-flow", "data-booking-ref": spaBookingModel().ref, "data-payment-mode": "SIMULATED", "data-state": f.step, "data-entry": f.entry, "data-selection-version": options.selectionVersion });
  body.appendChild(stepsBar(f));
  var parts = f.step === "context" ? stepContext(f)
    : f.step === "options" ? stepOptions(f)
    : f.step === "specialist" ? stepSpecialist(f)
    : f.step === "slots" ? stepSlots(f)
    : stepReview(f);
  parts.forEach(function (p) { if (p) body.appendChild(p); });
  return body;
}
