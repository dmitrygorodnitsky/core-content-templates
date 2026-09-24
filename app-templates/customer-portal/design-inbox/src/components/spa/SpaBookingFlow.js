// customer-portal-design/src/components/spa/SpaBookingFlow.js — Wave 16: the
// complete Calm Harbor booking flow inside the accepted drawer. One flow serves
// every supported entry (service Book, empty-state Book, Book again, Book with
// a credit, Reschedule). Steps: context → OPTIONS (wave 20 — visit mode /
// location + eligible add-ons, only when the server returns the capability) →
// optional specialist (ONLY when the server returns eligible specialists) →
// eligible date/slot selection → an expiring SERVER slot hold → review with the
// server display total, the optional customer note, policy acknowledgement and
// the explicit "Simulation — no charge will be made" treatment.
// TRUTH RULES: slots/specialists/prices/hold expiry are all server-returned
// display data; the hold expiry is a server event (never a local countdown); a
// reschedule identifies the currently booked visit and the original visit is
// released ONLY by the confirmation readback; plan-credit eligibility/balance is
// never calculated here — the server's credit state (ok | unavailable |
// exhausted | changed) gates the flow verbatim.
// WAVE 20 TRUTH RULES: capabilities decide whether a section AND its step
// exist — an absent source is never an empty choice; mode codes, location refs
// and add-on refs are OPAQUE; location labels are least-data (nickname or
// redacted summary) and no free-form address is ever captured; compatibility,
// price, duration, tax and inventory are never inferred; changing the service,
// visit mode, location or an add-on invalidates the downstream specialist/slot
// selection and reloads eligibility; a removed or repriced add-on blocks
// confirmation until an explicit reload; the note is transient browser state
// and is never persisted, logged or put in a URL.
import { h } from "../../dom.js";
import { F } from "../../../data/fixtures.js";
import { ACTIONS } from "../../actions.js";
import { cmdPhase, spaAddonChange, spaBookingOpts, spaBookingQuote, spaEligibleLocations, spaFlowSteps, spaNoteState, spaOptionsComplete, spaSelectedAddOns, spaSelectedLocation, spaVisitMode, state } from "../../state.js";
import { ActionButton } from "../primitives/ActionButton.js";
import { InlineFailure, skel } from "../primitives/RouteStates.js";
import { SimulationBadge } from "./CommerceBits.js";

function svcByCode(code) { return F.spa.pim.services.find(function (s) { return s.code === code; }) || null; }
function dayByKey(key) { return F.spaBooking.days.find(function (d) { return d.key === key; }) || F.spaBooking.days[0]; }
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

/* step rail — Options and Specialist exist only when the source returns
   something for them; an empty step is never rendered (see spaFlowSteps) */
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
  var a = f.rescheduleOf ? F.spaCommerce.appointmentDetails[f.rescheduleOf] : null;
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
    F.spaBooking.eligibleServices.forEach(function (code) {
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

/* =========================================================
   WAVE 20 — step: options (visit mode / location + add-ons)
   Rendered ONLY when at least one supported capability has something real to
   show. Each group is source-owned: a failing or unconnected source renders
   its own honest state instead of an empty list, and retry appears only where
   it can change the result.
   ========================================================= */

/* one source-state block in the accepted state vocabulary */
function srcBlock(cfg) {
  var wrap = h("div", { "class": "bk-empty", "data-state": cfg.state, "data-visual-id": cfg.visualId }, [
    h("div", { style: "font-weight:700;font-size:13.5px" }, cfg.title),
    h("div", { style: "font-size:12.5px;color:var(--ink-2);line-height:1.5;margin-top:4px", "data-bind": cfg.bind }, cfg.copy)
  ]);
  if (cfg.support) wrap.appendChild(h("div", { style: "margin-top:8px;font-size:12px" }, h("span", { "class": "link-action", "data-action": "support.open" }, "Contact support \u203a")));
  return wrap;
}

function visitModeGroup(f, o) {
  if (!o.capabilities.visitMode) return null;
  var modes = o.visitModes;
  if (!modes.length) return null;
  var group = h("div", { "class": "bk-group", "data-module": "visit-mode-options", "data-visual-id": "booking-visit-mode", "data-state": modes.length > 1 ? "ready" : "fixed" });
  group.appendChild(h("div", { "class": "bk-section-label" }, modes.length > 1 ? "How would you like your visit?" : "Your visit"));
  if (modes.length === 1) {
    /* no choice required — the one returned mode is context, not a question */
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
  if (o.capabilities.visitMode && o.visitModes.length > 1 && !mode) return null; /* progressive: the place follows the mode */
  var src = state.spaLocSrc;
  var group = h("div", { "class": "bk-group", "data-module": "location-options", "data-visual-id": "booking-locations", "data-state": src });
  group.appendChild(h("div", { "class": "bk-section-label" }, "Where should we see you?"));

  if (src === "loading") {
    group.setAttribute("aria-busy", "true");
    group.appendChild(h("div", null, [skel("height:52px;border-radius:14px"), skel("height:52px;border-radius:14px;margin-top:9px")]));
    return group;
  }
  if (src === "error") {
    group.appendChild(InlineFailure({ msg: o.copy.locationsError, retryAction: "booking.reloadLocations", retryLabel: "Reload places" }));
    return group;
  }
  if (src === "unavailable") {
    group.appendChild(srcBlock({ state: "unavailable", visualId: "booking-locations-unavailable", title: "The studio will confirm the place", copy: o.copy.locationsUnavailable, bind: "bookingOptions.locations" }));
    return group;
  }
  if (src === "empty") {
    group.appendChild(srcBlock({ state: "empty", visualId: "booking-locations-empty", title: "No place is open for this visit", copy: o.copy.locationsEmpty, bind: "bookingOptions.locations", support: true }));
    return group;
  }

  var list = spaEligibleLocations(o);
  if (!list.length) {
    /* at-home chosen but no customer-safe place is returned — no free-form
       address capture exists in this flow */
    group.appendChild(srcBlock({ state: "empty", visualId: "booking-locations-no-place", title: "No place on file for at-home visits", copy: o.copy.noSavedPlace, bind: "bookingOptions.locations", support: true }));
    return group;
  }
  if (src === "ineligible") group.appendChild(InlineFailure({ msg: o.copy.locationIneligible, retryAction: "booking.reloadLocations", retryLabel: "Reload places" }));

  if (list.length === 1 && src !== "ineligible") {
    group.appendChild(h("div", { "class": "bk-opt bk-opt--fixed", "data-location-ref": list[0].ref }, [
      h("div", { style: "flex:1;min-width:0" }, h("div", { style: "font-weight:650;font-size:13.5px", "data-bind": "bookingOptions.locations[].label" }, list[0].label)),
      h("span", { "class": "bk-tag" }, "Only place available")
    ]));
    return group;
  }
  var picked = spaSelectedLocation(o);
  var opts = h("div", { "class": "bk-opts" });
  list.forEach(function (l) {
    var on = !!(picked && picked.ref === l.ref);
    opts.appendChild(h("button", { "class": "bk-opt" + (on ? " bk-opt--on" : ""), "data-action": "booking.selectLocation", "data-id": l.ref, "data-location-ref": l.ref, "data-state": on ? "active" : undefined, role: "radio", "aria-checked": on ? "true" : "false" }, [
      h("i", { "class": "bk-opt__dot" }),
      h("div", { style: "flex:1;min-width:0;text-align:left" }, h("div", { style: "font-weight:650;font-size:13.5px", "data-bind": "bookingOptions.locations[].label" }, l.label))
    ]));
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

  if (src === "loading") {
    group.setAttribute("aria-busy", "true");
    group.appendChild(h("div", null, [skel("height:58px;border-radius:14px"), skel("height:58px;border-radius:14px;margin-top:9px")]));
    return group;
  }
  if (src === "error") {
    group.appendChild(InlineFailure({ msg: o.copy.addOnsError, retryAction: "ui.retry", retryId: "booking-addons", retryLabel: "Reload extras" }));
    return group;
  }
  if (src === "unavailable") {
    group.appendChild(srcBlock({ state: "unavailable", visualId: "booking-addons-unavailable", title: "Extras aren\u2019t connected yet", copy: o.copy.addOnsUnavailable, bind: "bookingOptions.addOns" }));
    return group;
  }
  if (!o.addOns.length) return null; /* none returned — the section does not exist */

  if (src === "ineligible") group.appendChild(h("div", { "class": "bk-note", "data-bind": "bookingOptions.addOns", style: "margin:0 0 10px" }, o.copy.addOnsIneligible));
  var change = spaAddonChange(o);
  if (change) group.appendChild(InlineFailure({ msg: change.copy, retryAction: "ui.retry", retryId: "booking-addons", retryLabel: "Reload extras" }));

  var picked = (f.addOns || []);
  var list = h("div", { "class": "bk-opts" });
  o.addOns.forEach(function (a) {
    var togglable = (a.allowedActions || []).indexOf("toggle") !== -1;
    var on = picked.indexOf(a.ref) !== -1 || (a.required && a.selected && !togglable);
    var phase = cmdPhase("booking.toggleAddon:" + a.ref);
    var meta = h("div", { "class": "bk-addon__meta" }, [
      a.displayPrice ? h("b", { style: "font-size:13px", "data-bind": "bookingOptions.addOns[].displayPrice" }, a.displayPrice) : null,
      a.durationNote ? h("span", { "class": "bk-addon__dur", "data-bind": "bookingOptions.addOns[].durationNote" }, a.durationNote) : null
    ]);
    var body = h("div", { "class": "bk-addon__body" }, [
      h("div", { "class": "bk-addon__name", "data-bind": "bookingOptions.addOns[].name" }, a.name),
      a.description ? h("div", { "class": "bk-addon__desc", "data-bind": "bookingOptions.addOns[].description" }, a.description) : null,
      a.required ? h("span", { "class": "bk-tag bk-tag--req", "data-bind": "bookingOptions.addOns[].required" }, togglable ? "Required" : "Added by the studio") : null
    ]);
    var box = h("span", { "class": "bk-check" + (on ? " bk-check--on" : "") }, on ? "\u2713" : "");
    if (!togglable) {
      list.appendChild(h("div", { "class": "bk-opt bk-addon bk-opt--fixed", "data-addon-ref": a.ref, "data-state": "fixed" }, [box, body, meta]));
      return;
    }
    list.appendChild(h("button", {
      "class": "bk-opt bk-addon" + (on ? " bk-opt--on" : ""), "data-action": "booking.toggleAddon", "data-id": a.ref, "data-addon-ref": a.ref,
      "data-state": phase !== "idle" ? phase : (on ? "active" : undefined),
      role: "checkbox", "aria-checked": on ? "true" : "false", "aria-busy": phase === "pending" ? "true" : undefined,
      disabled: phase === "pending" ? true : undefined
    }, [box, body, phase === "pending" ? h("span", { "class": "btn-spinner" }) : meta]));
  });
  group.appendChild(list);
  if (Object.keys(state.commands).some(function (k) { return k.indexOf("booking.toggleAddon:") === 0 && state.commands[k] === "pending"; })) {
    group.appendChild(h("div", { "class": "bk-note" }, o.copy.addOnPendingNote));
  } else {
    group.appendChild(h("div", { "class": "bk-note" }, "Amounts and added time come from the studio \u2014 the total is shown before you confirm."));
  }
  return group;
}

function stepOptions(f) {
  var o = spaBookingOpts();
  var parts = [];
  if (f.entry === "reschedule") parts.push(rescheduleCurrent(f));
  [visitModeGroup(f, o), locationGroup(f, o), addonGroup(f, o)].forEach(function (g) { if (g) parts.push(g); });

  var steps = spaFlowSteps(f);
  var i = steps.findIndex(function (s) { return s.k === "options"; });
  var next = steps[i + 1] || { k: "slots" };
  var ready = spaOptionsComplete(o);
  parts.push(h("div", { style: "margin-top:16px" }, ActionButton({
    variant: "btn--primary", label: next.k === "specialist" ? "Choose a specialist" : "Choose a time",
    action: "booking.next", block: true, disabled: !ready, visualId: "bk-options-continue"
  })));
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
  /* wave 20 — an option change released the previous time: say so, never keep
     a stale slot silently */
  if (f.reloadedBy) parts.push(h("div", { "class": "bk-changed", "data-visual-id": "booking-options-changed", "data-state": "changed", role: "status", "data-bind": "bookingOptions.selectionVersion" }, spaBookingOpts().copy.optionsChangedSlot));
  parts.push(h("div", { "class": "bk-section-label" }, f.entry === "reschedule" ? "Pick a new time" : "Pick a time"));

  /* slot source lifecycle — nothing is guessed while it loads or fails */
  if (state.spaSlots === "loading") {
    var sk = h("div", { "data-state": "loading", "aria-busy": "true" }, [skel("height:34px;border-radius:10px"), skel("height:120px;border-radius:14px;margin-top:10px")]);
    parts.push(sk);
    return parts;
  }
  if (state.spaSlots === "error") {
    parts.push(InlineFailure({ msg: "Available times didn\u2019t load \u2014 nothing is shown so nothing is guessed. Try again.", retryAction: "ui.retry", retryId: "slots", retryLabel: "Reload times" }));
    if (hasPrev(f)) parts.push(backLink());
    return parts;
  }
  if (state.spaSlots === "empty") {
    parts.push(h("div", { "class": "bk-empty", "data-state": "empty" }, [
      h("div", { style: "font-weight:700;font-size:14px" }, "No times are open right now"),
      h("div", { style: "font-size:12.5px;color:var(--ink-2);line-height:1.5;margin-top:4px" }, "The studio opens new times regularly \u2014 check back soon, or our team can find one for you."),
      h("div", { style: "margin-top:8px" }, h("span", { "class": "link-action", "data-action": "support.open" }, "Contact support \u203a"))
    ]));
    if (hasPrev(f)) parts.push(backLink());
    return parts;
  }

  var days = h("div", { "class": "bk-days", "data-module": "slot-days", "data-visual-id": "slot-days" });
  F.spaBooking.days.forEach(function (d) {
    days.appendChild(h("button", { "class": "bk-day" + (d.key === f.dayKey ? " bk-day--on" : ""), "data-action": "booking.selectSlot", "data-id": "day:" + d.key, "data-day-key": d.key }, d.label));
  });
  parts.push(days);

  var day = dayByKey(f.dayKey);
  var grid = h("div", { "class": "bk-slots", "data-module": "slot-grid", "data-visual-id": "slot-grid", "data-bind": "booking.eligibleSlots" });
  day.slots.forEach(function (s) {
    grid.appendChild(h("button", { "class": "bk-slot" + (f.slotRef === s.ref ? " bk-slot--on" : ""), "data-action": "booking.selectSlot", "data-id": s.ref, "data-slot-ref": s.ref, "data-state": f.slotRef === s.ref ? "active" : undefined }, s.label));
  });
  parts.push(grid);

  var holdKey = "booking.hold:" + f.slotRef;
  var holdPhase = f.slotRef ? cmdPhase(holdKey) : "idle";
  if (holdPhase === "failed") parts.push(InlineFailure({ msg: "That time couldn\u2019t be held \u2014 nothing is booked. Pick it again or choose another time.", retryAction: "booking.retry", retryId: "hold", retryLabel: "Try holding again" }));
  if (holdPhase === "conflict") parts.push(InlineFailure({ msg: "That time was just taken \u2014 nothing is booked. Choose another time.", retryAction: "ui.retry", retryId: holdKey, retryLabel: "OK" }));
  parts.push(h("div", { style: "margin-top:14px" }, ActionButton({
    variant: "btn--primary", label: "Hold this time", action: "booking.hold", id: f.slotRef || undefined, block: true,
    pending: holdPhase === "pending", pendingLabel: "Holding\u2026", disabled: !f.slotRef || holdPhase === "conflict", visualId: "bk-hold"
  })));
  parts.push(h("div", { "class": "bk-note" }, "Holding keeps the time briefly while you review \u2014 nothing is booked yet."));
  if (hasPrev(f)) parts.push(backLink());
  return parts;
}

/* WAVE 20 — the optional customer note. A real <label>, a server-provided
   maximum, an accessible inline explanation when it is too long, and a value
   that lives in memory only (never storage, analytics, logs or a URL). */
function noteField(confirmableOtherwise) {
  var nz = spaNoteState();
  if (!nz.enabled) return null;
  var state0 = nz.invalid ? "invalid" : nz.near ? "near-limit" : nz.len ? "filled" : "empty";
  var wrap = h("div", { "class": "bk-note-field", "data-module": "booking-notes", "data-visual-id": "booking-note", "data-state": state0 });
  var ta = h("textarea", {
    "class": "field bk-note-field__input", id: "bk-note-input", rows: "3",
    "data-action": "booking.changeNotes", "data-bind": "bookingOptions.notes.value",
    "aria-describedby": "bk-note-help bk-note-err", "aria-invalid": nz.invalid ? "true" : "false",
    "data-state": nz.invalid ? "invalid" : undefined
  }, nz.value);
  var counter = h("span", { "class": "bk-counter" + (nz.invalid ? " bk-counter--over" : ""), "data-bind": "bookingOptions.notes.maxLength" }, nz.len + "/" + nz.max);
  var err = h("div", { "class": "field-error", id: "bk-note-err", role: "alert" }, nz.invalid ? nz.errorCopy : "");
  if (!nz.invalid) err.hidden = true;

  ta.addEventListener("input", function () {
    ACTIONS["booking.changeNotes"](ta.value); /* input-event hook — no re-render (focus preserved) */
    var len = ta.value.length, over = len > nz.max;
    counter.textContent = len + "/" + nz.max;
    counter.classList.toggle("bk-counter--over", over);
    ta.setAttribute("aria-invalid", over ? "true" : "false");
    if (over) { ta.setAttribute("data-state", "invalid"); err.textContent = nz.errorCopy; err.hidden = false; }
    else { ta.removeAttribute("data-state"); err.hidden = true; err.textContent = ""; }
    wrap.setAttribute("data-state", over ? "invalid" : (len >= nz.max - 30 ? "near-limit" : (len ? "filled" : "empty")));
    var btn = document.querySelector('[data-visual-id="confirm-booking"]');
    if (btn) { if (over || !confirmableOtherwise) btn.setAttribute("disabled", ""); else btn.removeAttribute("disabled"); }
  });

  wrap.appendChild(h("div", { "class": "bk-note-field__head" }, [
    h("label", { "class": "field-label", "for": "bk-note-input" }, "Note for the studio"),
    counter
  ]));
  wrap.appendChild(ta);
  wrap.appendChild(err);
  wrap.appendChild(h("div", { "class": "bk-note", id: "bk-note-help", "data-bind": "bookingOptions.notes.helperText" }, nz.helperText));
  wrap.appendChild(h("div", { "class": "bk-note-field__sent", "data-bind": "bookingOptions.notes" }, spaBookingOpts().copy.noteSentWith));
  return wrap;
}

/* ---- step: review (server totals, policy ack, SIMULATED treatment) ---- */
function stepReview(f) {
  var parts = [];
  var o = spaBookingOpts();
  var svc = svcByCode(f.serviceCode);
  var picked = slotLabel(f);
  var sp = f.specialistRef ? F.spaBooking.specialists[f.specialistRef] : null;
  var specialistsOffered = (F.spaBooking.eligibleSpecialists[f.serviceCode] || []).length > 0;
  var confirmKey = "booking.confirm:" + F.spaBooking.ref;
  var phase = cmdPhase(confirmKey);
  var holdOk = state.spaHold === "held";
  var creditBlocked = f.entry === "credit" && state.spaCredit !== "ok";
  var origin = f.rescheduleOf ? F.spaCommerce.appointmentDetails[f.rescheduleOf] : null;
  var addonChange = spaAddonChange(o);
  var nz = spaNoteState(o);
  var quote = spaBookingQuote(o);
  var selectedAddOns = spaSelectedAddOns(o);

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

  var review = h("div", { "class": "booking-review", "data-module": "booking-review", "data-visual-id": "booking-review", "data-payment-mode": "SIMULATED", "data-state": addonChange ? addonChange.kind : (holdOk ? "held" : state.spaHold), "data-selection-version": o.selectionVersion });

  /* the hold is a SERVER fact: a display-ready expiry label, never a local countdown */
  if (holdOk) review.appendChild(h("div", { "class": "booking-review__hold", "data-module": "booking-hold", "data-visual-id": "booking-hold", "data-hold-ref": F.spaBooking.hold.ref, "data-bind": "booking.hold.untilLabel" }, [
    h("b", null, F.spaBooking.hold.untilLabel), " \u00b7 " + F.spaBooking.hold.note
  ]));
  if (state.spaHold === "slot-expired") review.appendChild(InlineFailure({ msg: "Your held time expired \u2014 nothing was booked" + (f.entry === "reschedule" ? " and your original visit is unchanged" : "") + ". Pick a new time to continue.", retryAction: "ui.retry", retryId: "booking-hold", retryLabel: "Find a new time" }));
  if (state.spaHold === "repriced") review.appendChild(InlineFailure({ msg: "The price for this time changed while you were reviewing \u2014 reload and check it before confirming.", retryAction: "ui.retry", retryId: "booking-hold", retryLabel: "Reload & review" }));
  /* wave 20 — a removed or repriced add-on BLOCKS confirmation until reloaded */
  if (addonChange) review.appendChild(InlineFailure({ msg: addonChange.copy, retryAction: "ui.retry", retryId: "booking-addons", retryLabel: "Reload extras" }));

  var det = h("div", { "class": "appt-details", style: "margin-top:10px" });
  var row = function (l, v) { return h("div", { "class": "appt-details__row" }, [h("div", { "class": "appt-details__label" }, l), h("div", { "class": "appt-details__val" }, v)]); };
  det.appendChild(row("Visit", h("b", { "data-bind": "booking.service" }, svc ? svc.name : "\u2014")));
  det.appendChild(row("When", h("span", null, [h("b", null, picked || "\u2014"), h("span", { style: "color:var(--ink-3)" }, " \u00b7 local time")])));
  /* "First available" is claimed ONLY when the selection explicitly allows no
     preference; a service that returns no specialists has no row at all, and a
     reschedule keeps the identified visit's own specialist */
  if (sp) det.appendChild(row("With", h("b", { "data-bind": "booking.specialist" }, sp.name)));
  else if (f.entry === "reschedule" && origin && origin.specialist) det.appendChild(row("With", h("span", null, [h("b", { "data-bind": "appointment.specialist" }, origin.specialist), h("span", { style: "color:var(--ink-3)" }, " \u00b7 unchanged")])));
  else if (specialistsOffered && f.entry !== "reschedule") det.appendChild(row("With", h("span", { style: "color:var(--ink-3)", "data-bind": "booking.specialist" }, "No preference \u2014 first available")));

  /* WAVE 20 — visit mode + least-data place, from the source only. No assumed
     studio: when the source returned neither, the row does not exist. */
  var mode = spaVisitMode(o);
  var loc = spaSelectedLocation(o);
  var whereBits = [];
  if (mode) whereBits.push(h("b", { "data-bind": "bookingOptions.visitModes[].label" }, mode.label));
  if (loc) whereBits.push(h("span", { "data-bind": "bookingOptions.locations[].label" }, (whereBits.length ? " \u00b7 " : "") + loc.label));
  if (!whereBits.length && origin) {
    whereBits.push(h("b", { "data-bind": "appointment.visitMode" }, F.spa.modeLabels[origin.visitMode]));
    if (origin.location) whereBits.push(h("span", { "data-bind": "appointment.location" }, " \u00b7 " + origin.location));
  }
  if (o.capabilities.location && state.spaLocSrc === "unavailable") whereBits.push(h("div", { style: "font-size:11.5px;color:var(--ink-3);line-height:1.45;margin-top:3px", "data-bind": "bookingOptions.locations" }, o.copy.locationsUnavailable));
  if (whereBits.length) det.appendChild(row("Where", h("span", null, whereBits)));

  /* WAVE 20 — selected add-ons with the server's display amounts when supplied */
  if (selectedAddOns.length) {
    var alist = h("div", { "class": "bk-review-addons", "data-module": "booking-review-addons", "data-visual-id": "booking-review-addons" });
    selectedAddOns.forEach(function (a) {
      alist.appendChild(h("div", { "class": "bk-review-addon", "data-addon-ref": a.ref }, [
        h("span", { "class": "bk-review-addon__name", "data-bind": "bookingOptions.addOns[].name" }, a.name),
        a.displayPrice ? h("span", { "class": "bk-review-addon__amt", "data-bind": "bookingOptions.addOns[].displayPrice" }, a.displayPrice) : null
      ]));
    });
    det.appendChild(row(selectedAddOns.length > 1 ? "Extras" : "Extra", alist));
  }

  if (f.entry === "credit") {
    det.appendChild(row("Price", h("span", { "data-bind": "booking.creditNote" }, [h("b", null, "1 visit credit"), " \u00b7 no charge for this visit"])));
  } else if (quote && quote.displaySubtotal) {
    det.appendChild(row("Subtotal", h("span", { "data-bind": "booking.displaySubtotal" }, quote.displaySubtotal)));
    det.appendChild(row("Total", h("b", { "data-bind": "booking.displayTotal" }, quote.displayTotal)));
  } else {
    det.appendChild(row("Price", h("b", { "data-bind": "booking.displayTotal" }, (quote && quote.displayTotal) || F.spaBooking.displayTotals[f.serviceCode] || (svc && svc.displayPrice) || "\u2014")));
  }
  review.appendChild(det);

  var creditBlock = creditCard(true);
  if (creditBlock) review.appendChild(creditBlock);

  var confirmable = holdOk && state.spaBookAck && !creditBlocked && !addonChange && phase !== "conflict";
  var noteBlock = noteField(confirmable);
  if (noteBlock) review.appendChild(noteBlock);

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
    msg: f.entry === "reschedule" ? "Your visit wasn\u2019t moved \u2014 it\u2019s still booked at the original time." : "Your booking wasn\u2019t confirmed \u2014 nothing is scheduled yet." + (nz.enabled && nz.len ? " Your note is kept here." : ""),
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
    disabled: !confirmable || (nz.enabled && nz.invalid)
  })));
  if (holdOk && !state.spaBookAck && phase === "idle" && !addonChange) parts.push(h("div", { style: "font-size:11.5px;color:var(--ink-3);margin-top:7px;text-align:center" }, "Tick the policy box above to confirm"));
  if (addonChange) parts.push(h("div", { style: "font-size:11.5px;color:var(--ink-3);margin-top:7px;text-align:center" }, "Reload the extras above to review the change before confirming"));
  parts.push(backLink("\u2039 Back to times"));
  return parts;
}

function backLink(label) {
  return h("div", { style: "margin-top:12px" }, h("span", { "class": "link-action", "data-action": "booking.back" }, label || "\u2039 Back"));
}

/* a back affordance exists only when a previous step exists */
function hasPrev(f) {
  var steps = spaFlowSteps(f);
  return steps.findIndex(function (s) { return s.k === f.step; }) > 0;
}

/* drawer body — one flow; Options and Specialist are present only when the
   source returns something for them */
export function SpaBookingFlow() {
  var f = state.spaFlow;
  var o = spaBookingOpts();
  var body = h("div", { "class": "bk-flow", "data-module": "booking-flow", "data-visual-id": "booking-flow", "data-booking-ref": F.spaBooking.ref, "data-payment-mode": "SIMULATED", "data-state": f.step, "data-entry": f.entry, "data-selection-version": o.selectionVersion });
  body.appendChild(stepsBar(f));
  var parts = f.step === "context" ? stepContext(f)
    : f.step === "options" ? stepOptions(f)
    : f.step === "specialist" ? stepSpecialist(f)
    : f.step === "slots" ? stepSlots(f)
    : stepReview(f);
  parts.forEach(function (p) { if (p) body.appendChild(p); });
  return body;
}
