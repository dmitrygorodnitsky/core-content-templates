// customer-portal-design/src/routes/SpaAppointmentsPage.js — Wave 14: Calm Harbor
// TARGET Appointments default (route orders.list, capability target-appointments).
// CAPABILITY-GATED: none of these fixtures are selectable by the current-staging
// profile, and no state ever shows a fixture while the (future) live source is
// loading, failed or unauthorized. Customer status labels ("Confirmed",
// "Needs confirmation") are placeholders for a BACKEND-OWNED approved mapping —
// never derived from raw Core statuses in the browser.
// Commands: reschedule / cancel / book-again render ONLY while the booking command
// contract is open (data-booking="open"). Closed shows an honest disabled treatment.
// Cancel demonstrates the full entity-scoped lifecycle (pending | failed | conflict |
// session-lost) — success renders EXCLUSIVELY from the (demo) authoritative readback
// (state.spaCancelled). Reschedule / book / book-again route into the accepted
// booking drawer, whose confirm carries the same command lifecycle.
import { h } from "../dom.js";
import { F } from "../../data/fixtures.js";
import { cmdPhase, spaAppointments, spaBookingOpen, spaCustomer, state } from "../state.js";
import { PageHeader } from "../components/shell/PageHeader.js";
import { ActionButton } from "../components/primitives/ActionButton.js";
import { StatusBadge } from "../components/primitives/StatusBadge.js";
import { InlineFailure, routeStateBody, skel } from "../components/primitives/RouteStates.js";

function modeChip(mode) {
  return h("span", { "class": "visit-mode visit-mode--" + mode, "data-module": "visit-mode", "data-bind": "appointment.visitMode" }, [
    h("i", { "class": "visit-mode__dot" }),
    F.spa.modeLabels[mode]
  ]);
}

function statusBadge(label) {
  return StatusBadge({ variant: F.spa.statusBadges[label] || "status-badge--scheduled", label: label, bind: "appointment.status" });
}

/* one row of the upcoming/past structure — wave 16: rows OPEN the standalone
   customer-owned detail route (appointment.open, opaque data-appointment-ref) */
function apptRow(a, opts) {
  opts = opts || {};
  var meta = [a.time, a.specialist, F.spa.modeLabels[a.mode]].filter(Boolean).join(" \u00b7 ");
  var row = h("div", { "class": "appt-row appt-row--link", "data-module": "appointment-row", "data-visual-id": "appointment-row", "data-appointment-id": a.id, "data-appointment-ref": a.id, "data-action": "appointment.open", "data-id": a.id, role: "link", tabindex: "0" }, [
    h("div", { "class": "log-date" }, a.date),
    h("div", { "class": "appt-row__body" }, [
      h("div", { "class": "appt-row__name", "data-bind": "appointment.service" }, a.service),
      h("div", { "class": "appt-row__meta", "data-bind": "appointment.time,appointment.specialist,appointment.visitMode" }, meta)
    ]),
    statusBadge(a.status),
    a.price ? h("div", { "class": "appt-row__price", "data-bind": "appointment.displayPrice" }, a.price) : null,
    opts.bookAgain && a.status === "Completed"
      ? h("span", { "class": "link-action", "data-action": "appointment.bookAgain", "data-id": a.id, "data-appointment-ref": a.id }, "Book again \u203a")
      : h("span", { "class": "appt-row__chev", "aria-hidden": "true" }, "\u203a")
  ]);
  return row;
}

function pastPanel(items, open) {
  var panel = h("div", { "class": "list-panel", "data-module": "appointment-list", "data-visual-id": "appointments-past" }, [
    h("div", { "class": "list-panel__head" }, [
      h("div", { "class": "list-panel__title", style: "flex:1" }, "Past"),
      h("span", { style: "font-size:12px;color:var(--ink-3)" }, "your visit history")
    ])
  ]);
  items.forEach(function (a) { panel.appendChild(apptRow(a, { bookAgain: open })); });
  return panel;
}

function loadingSkeleton() {
  var w = h("div", { "data-state": "loading", "aria-busy": "true" });
  w.appendChild(skel("height:210px;border-radius:24px"));
  w.appendChild(skel("height:150px;border-radius:24px;margin-top:18px"));
  w.appendChild(skel("height:150px;border-radius:24px;margin-top:18px"));
  return w;
}

export function SpaAppointments() {
  var open = spaBookingOpen();
  var appointments = spaAppointments();
  var view = state.config.dataMode === "live" ? (state.moduleStatus.appointments || appointments.state || "loading") : state.view;
  var sc = state.spaAppt;
  var next = view === "empty" ? null : appointments.next;
  var cancelled = next && !!state.spaCancelled[next.id];
  var resched = next ? state.spaRescheduled[next.id] : null; /* wave 16 — authoritative reschedule readback */

  var page = h("section", { "class": "page", "data-route": "orders.list", "data-state": view, "data-visual-id": "spa-appointments", "data-capability": "target-appointments", "data-booking": open ? "open" : "closed", "data-screen-label": "Appointments (target)" });

  var sub = next
    ? (cancelled ? "Your " + next.date + " visit was cancelled." : "Your next visit \u2014 " + next.date + ", " + F.spa.modeLabels[next.mode].toLowerCase() + ".")
    : "You have no upcoming visits.";
  page.appendChild(PageHeader({ title: spaCustomer().greeting, sub: sub }));

  /* while the live source is loading / failed / unauthorized, NO fixture
     appointment may be visible — the gate replaces the whole body */
  var gate = routeStateBody({
    view: view,
    states: ["loading", "error", "unauthorized"],
    skeleton: loadingSkeleton,
    error: { title: "Couldn\u2019t load your appointments", desc: "Your appointments didn\u2019t load, so nothing is shown \u2014 we never show stale or guessed visits. Nothing was changed; try again.", retryId: "appointments" },
    scope: "your appointments", backRoute: "services"
  });
  if (gate) { page.appendChild(gate); return page; }

  var grid = h("div", { "class": "appt-grid" });
  var left = h("div", { "class": "appt-col" });
  var right = h("div", { "class": "appt-col" });

  if (!next) {
    /* EMPTY — the authorized source returned no upcoming appointments.
       "Book an appointment" exists ONLY while the booking command is open;
       closed offers honest catalog navigation instead. */
    var emptyCard = h("div", { "class": "card appt-empty", "data-module": "appointment-empty", "data-visual-id": "appointment-empty", "data-state": "empty" }, [
      h("div", { "class": "state-block__glyph" }, "\u2740"),
      h("div", { "class": "state-block__title" }, "No upcoming appointments"),
      h("div", { "class": "state-block__desc" }, open
        ? "Nothing is booked right now \u2014 book your next visit whenever you\u2019re ready."
        : "Nothing is booked right now. Online booking isn\u2019t available yet \u2014 browse treatments and prices, and our team takes it from there."),
      h("div", { "class": "appt-empty__actions" }, open
        ? [ActionButton({ variant: "btn--primary", label: "Book an appointment", action: "booking.open", lg: true, visualId: "appt-empty-book" }),
           ActionButton({ variant: "btn--ghost", label: "Browse services", action: "nav.go", id: "services", visualId: "appt-empty-browse" })]
        : [ActionButton({ variant: "btn--primary", label: "Browse services", action: "nav.go", id: "services", lg: true, visualId: "appt-empty-browse" }),
           ActionButton({ variant: "btn--ghost", label: "See prices", action: "nav.go", id: "pricing", visualId: "appt-empty-prices" })])
    ]);
    if (sc === "no-history") {
      emptyCard.appendChild(h("div", { style: "font-size:12px;color:var(--ink-3)" }, "Visits you complete will build your history here."));
      left.appendChild(emptyCard);
    } else {
      left.appendChild(emptyCard);
      left.appendChild(pastPanel(appointments.past || [], open));
    }
  } else {
    /* NEXT APPOINTMENT — only source-owned fields; the reference is secondary
       detail, never the headline */
    var cKey = "order.cancel:" + next.id;
    var phase = cmdPhase(cKey);
    var hero = h("div", { "class": "card card--pad appt-hero", "data-module": "next-appointment", "data-visual-id": "next-appointment", "data-appointment-id": next.id, "data-state": cancelled ? "cancelled" : (phase !== "idle" ? phase : "ready") }, [
      h("div", { style: "display:flex;align-items:center;gap:9px;flex-wrap:wrap" }, [
        h("div", { "class": "card__title", style: "flex:1" }, "Next appointment"),
        modeChip(next.mode),
        cancelled ? statusBadge("Cancelled") : statusBadge(next.status)
      ]),
      h("div", { "class": "appt-hero__service", "data-bind": "appointment.service" }, next.service),
      h("div", { "class": "appt-hero__when" }, [
        h("span", { "data-bind": "appointment.start" }, resched ? resched.start : (next.date + " \u00b7 " + next.time)),
        h("span", { "class": "appt-hero__tz" }, F.spa.appointments.tzNote)
      ])
    ]);

    var details = h("div", { "class": "appt-details", "data-visual-id": "visit-details" }, [
      h("div", { "class": "appt-details__row" }, [
        h("div", { "class": "appt-details__label" }, "Where"),
        h("div", { "class": "appt-details__val", "data-bind": "appointment.visitMode,appointment.location" }, [
          h("b", null, F.spa.modeLabels[next.mode]),
          next.location ? " \u00b7 " + next.location : h("span", { style: "color:var(--ink-3)" }, " \u00b7 location details not provided yet")
        ])
      ]),
      h("div", { "class": "appt-details__row" }, [
        h("div", { "class": "appt-details__label" }, "With"),
        h("div", { "class": "appt-details__val", "data-bind": "appointment.specialist" },
          next.specialist ? [h("b", null, next.specialist)] : [h("span", { style: "color:var(--ink-3)" }, "No specialist assigned yet")])
      ])
    ]);
    if (next.price) details.appendChild(h("div", { "class": "appt-details__row" }, [
      h("div", { "class": "appt-details__label" }, "Price"),
      h("div", { "class": "appt-details__val", "data-bind": "appointment.displayPrice" }, [h("b", null, next.price), " \u00b7 as booked"])
    ]));
    hero.appendChild(h("div", { style: "font-size:12px;font-weight:650;color:var(--ink-3);margin-top:14px;letter-spacing:.04em;text-transform:uppercase" }, "Visit details"));
    hero.appendChild(details);
    hero.appendChild(h("div", { "class": "appt-hero__ref", "data-bind": "appointment.reference" }, [
      "Reference " + next.ref,
      h("span", null, [" \u00b7 ", h("span", { "class": "link-action", "data-action": "appointment.open", "data-id": next.id, "data-appointment-ref": next.id }, "View details \u203a")]),
      /* wave 15 — appointment detail may deep-link to its purchase (never the reverse priority) */
      state.config.dataMode !== "live" && F.spaCommerce.purchaseByAppointment[next.id]
        ? h("span", null, [" \u00b7 ", h("span", { "class": "link-action", "data-action": "purchase.open", "data-id": F.spaCommerce.purchaseByAppointment[next.id], "data-purchase-ref": F.spaCommerce.purchaseByAppointment[next.id] }, "View purchase \u203a")])
        : null
    ]));

    if (resched && !cancelled) {
      hero.appendChild(h("div", { "class": "appt-hero__note", "data-state": "succeeded" }, "Rescheduled \u2014 confirmed by the studio. The previous time was released."));
    }

    if (cancelled) {
      hero.appendChild(h("div", { "class": "appt-hero__note", "data-state": "succeeded" }, "Cancelled \u2014 confirmed by the studio. Nothing further is scheduled for this visit."));
      hero.appendChild(h("div", { "class": "appt-hero__actions" }, [
        open ? ActionButton({ variant: "btn--primary", label: "Book a new visit", action: "booking.open", visualId: "appt-rebook" })
             : ActionButton({ variant: "btn--ghost", label: "Browse services", action: "nav.go", id: "services", visualId: "appt-rebook-browse" })
      ]));
    } else if (open) {
      if (phase === "failed") hero.appendChild(h("div", { style: "margin-top:12px" }, InlineFailure({
        msg: "Your appointment wasn\u2019t cancelled \u2014 it\u2019s still booked exactly as shown.",
        retryAction: "appointment.cancel", retryId: next.id, retryLabel: "Try cancelling again"
      })));
      if (phase === "conflict") hero.appendChild(h("div", { style: "margin-top:12px" }, InlineFailure({
        msg: "This appointment changed since you opened it \u2014 reload the latest version before making changes.",
        retryAction: "ui.retry", retryId: cKey, retryLabel: "Reload"
      })));
      /* wave 16: appointment.reschedule / appointment.cancel are the stable ids;
         order.reschedule / order.cancel remain preserved aliases (same command key) */
      var allowed = next.allowedActions || ["reschedule", "cancel"];
      var heroActions = h("div", { "class": "appt-hero__actions" });
      if (allowed.indexOf("reschedule") !== -1) heroActions.appendChild(ActionButton({ variant: "btn--ghost", label: "Reschedule", action: "appointment.reschedule", id: next.id, disabled: phase === "pending" || phase === "conflict", visualId: "appt-reschedule" }));
      if (allowed.indexOf("cancel") !== -1) heroActions.appendChild(ActionButton({ variant: "btn--ghost", label: "Cancel visit", action: "appointment.cancel", id: next.id, confirm: true, pending: phase === "pending", pendingLabel: "Cancelling\u2026", disabled: phase === "conflict", visualId: "appt-cancel" }));
      if (heroActions.childNodes.length) hero.appendChild(heroActions);
    } else {
      /* booking commands CLOSED — honest disabled treatment, never a dead control
         that looks live */
      hero.appendChild(h("div", { "class": "appt-hero__actions" }, [
        ActionButton({ variant: "btn--ghost", label: "Reschedule", action: "order.reschedule", id: next.id, disabled: true, visualId: "appt-reschedule" }),
        ActionButton({ variant: "btn--ghost", label: "Cancel visit", action: "order.cancel", id: next.id, disabled: true, visualId: "appt-cancel" })
      ]));
      hero.appendChild(h("div", { "class": "appt-hero__note", "data-state": "unavailable" }, [
        "Online changes aren\u2019t available yet for this visit \u2014 our team can reschedule or cancel it for you. ",
        h("span", { "class": "link-action", "data-action": "support.open" }, "Contact support \u203a")
      ]));
    }
    left.appendChild(hero);

    var upcoming = h("div", { "class": "list-panel", "data-module": "appointment-list", "data-visual-id": "appointments-upcoming" }, [
      h("div", { "class": "list-panel__head" }, [h("div", { "class": "list-panel__title", style: "flex:1" }, "Upcoming")])
    ]);
    (appointments.upcoming || []).forEach(function (a) { upcoming.appendChild(apptRow(a)); });
    left.appendChild(upcoming);
    left.appendChild(pastPanel(appointments.past || [], open));
  }

  /* right rail — catalog stays behind the next visit; Shop is not present here */
  var rail = h("div", { "class": "card card--pad", "data-module": "catalog-teaser", "data-visual-id": "catalog-teaser" }, [
    h("div", { "class": "card__title" }, "Treatments & prices"),
    h("div", { style: "font-size:12.5px;color:var(--ink-2);margin:4px 0 8px" }, "Live from the public catalog \u2014 shown as published.")
  ]);
  F.spa.pim.services.slice(0, 3).forEach(function (s) {
    rail.appendChild(h("div", { "class": "rate-row", "data-product-code": s.code }, [
      h("div", { style: "flex:1;min-width:0" }, [
        h("div", { style: "font-weight:600;font-size:13.5px", "data-bind": "pim.services[].name" }, s.name),
        h("div", { style: "font-size:12px;color:var(--ink-3)" }, s.shortDescription)
      ]),
      h("div", { style: "font-weight:700;font-size:13.5px", "data-bind": "pim.services[].displayPrice" }, s.displayPrice)
    ]));
  });
  rail.appendChild(h("div", { style: "margin-top:10px" }, h("span", { "class": "link-action", "data-action": "nav.go", "data-id": "services" }, "All services & prices \u203a")));
  right.appendChild(rail);

  grid.appendChild(left);
  grid.appendChild(right);
  page.appendChild(grid);
  return page;
}
