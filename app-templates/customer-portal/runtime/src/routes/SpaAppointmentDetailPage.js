// customer-portal-design/src/routes/SpaAppointmentDetailPage.js — Wave 16:
// standalone customer-owned Appointment detail (route appointment.detail,
// Calm Harbor target only). Renders ONLY source-provided fields: service
// title (the headline — never "Order #"), backend-mapped customer status,
// local start + timezone note, optional specialist, visit mode + least-data
// location, optional display price, customer-safe reference, the related
// Purchase link when provided, server-owned policy/attention copy, and the
// per-resource allowedActions list. Foreign, removed or unknown refs share
// ONE non-enumerating not-found treatment. Cancel is an entity-scoped
// command (pending | failed | conflict | session-lost); cancelled and
// rescheduled states render EXCLUSIVELY from the authoritative (demo)
// readback (state.spaCancelled / state.spaRescheduled).
import { h } from "../dom.js";
import { F } from "../../data/fixtures.js";
import { cmdPhase, currentAppointment, spaBookingOpen, spaCapability, state } from "../state.js";
import { PageHeader } from "../components/shell/PageHeader.js";
import { ActionButton } from "../components/primitives/ActionButton.js";
import { StatusBadge } from "../components/primitives/StatusBadge.js";
import { ConflictBanner, InlineFailure, NotFoundState, routeStateBody, skel } from "../components/primitives/RouteStates.js";

function modeChip(mode) {
  return h("span", { "class": "visit-mode visit-mode--" + mode, "data-module": "visit-mode", "data-bind": "appointment.visitMode" }, [
    h("i", { "class": "visit-mode__dot" }),
    F.spa.modeLabels[mode]
  ]);
}

function detailRow(label, val) {
  return h("div", { "class": "appt-details__row" }, [
    h("div", { "class": "appt-details__label" }, label),
    h("div", { "class": "appt-details__val" }, val)
  ]);
}

export function SpaAppointmentDetail() {
  var a = currentAppointment();
  var view = state.config.dataMode === "live" ? (state.moduleStatus.appointments || "loading") : state.view;
  var page = h("section", { "class": "page page--narrow", "data-route": "appointment.detail", "data-state": view, "data-visual-id": "appointment-detail", "data-module": "appointment-detail", "data-capability": spaCapability(), "data-appointment-ref": a ? a.ref : undefined, "data-screen-label": "Appointment detail" });
  page.appendChild(h("div", { "class": "detail-back" }, h("span", { "class": "link-action", "data-action": "nav.go", "data-id": "orders.list" }, "\u2039 Appointments")));

  /* route lifecycle — nothing fixture-owned renders through these gates */
  var gate = routeStateBody({
    view: view,
    states: ["loading", "error", "unauthorized"],
    skeleton: function () {
      return h("div", { "data-state": "loading", "aria-busy": "true" }, [
        skel("height:300px;border-radius:24px"),
        skel("height:90px;border-radius:20px;margin-top:16px")
      ]);
    },
    error: { title: "Couldn\u2019t load this visit", desc: "The visit didn\u2019t load, so nothing is shown \u2014 we never show a stale or guessed visit. Nothing was changed; try again.", retryId: "appointment-detail" },
    scope: "this visit", backRoute: "orders.list"
  });
  if (gate) { page.appendChild(gate); return page; }

  /* ONE non-enumerating not-found: unknown, removed and foreign refs look identical */
  if (!a || view === "not-found") {
    page.appendChild(NotFoundState({ noun: "visit", backLabel: "appointments", backRoute: "orders.list" }));
    return page;
  }

  var open = spaBookingOpen();
  var cancelled = !!state.spaCancelled[a.ref];
  var rescheduled = !!state.spaRescheduled[a.ref];
  var cKey = "order.cancel:" + a.ref; /* one command key — appointment.cancel + its preserved alias order.cancel */
  var phase = cmdPhase(cKey);
  var conflict = view === "conflict";
  var allowed = cancelled ? [] : a.allowedActions || [];
  var isPast = a.customerStatus === "Completed" || a.customerStatus === "Cancelled";

  page.appendChild(PageHeader({ title: "Your visit", sub: "Everything about this appointment, exactly as recorded by the studio." }));

  if (conflict) page.appendChild(ConflictBanner({ noun: "visit", desc: "This visit changed since you opened it. Load the latest version before making changes \u2014 nothing was submitted.", retryId: "appointment-detail" }));

  var hero = h("div", { "class": "card card--pad appt-hero", "data-module": "next-appointment", "data-visual-id": "appointment-detail-card", "data-appointment-ref": a.ref, "data-state": cancelled ? "cancelled" : (phase !== "idle" ? phase : (conflict ? "conflict" : "ready")) }, [
    h("div", { style: "display:flex;align-items:center;gap:9px;flex-wrap:wrap" }, [
      modeChip(a.visitMode),
      h("div", { style: "flex:1" }),
      StatusBadge({ variant: F.spa.statusBadges[cancelled ? "Cancelled" : a.customerStatus] || "status-badge--scheduled", label: cancelled ? "Cancelled" : a.customerStatus, bind: "appointment.customerStatus" })
    ]),
    h("div", { "class": "appt-hero__service", "data-bind": "appointment.service" }, a.service),
    h("div", { "class": "appt-hero__when" }, [
      h("span", { "data-bind": "appointment.start" }, a.start),
      h("span", { "class": "appt-hero__tz", "data-bind": "appointment.timezoneNote" }, a.timezoneNote)
    ])
  ]);

  var details = h("div", { "class": "appt-details", "data-visual-id": "visit-details" });
  details.appendChild(detailRow("Where", h("span", { "data-bind": "appointment.visitMode,appointment.location" }, [
    h("b", null, F.spa.modeLabels[a.visitMode]),
    a.location ? " \u00b7 " + a.location : h("span", { style: "color:var(--ink-3)" }, " \u00b7 location details not provided yet")
  ])));
  details.appendChild(detailRow("With", a.specialist
    ? h("b", { "data-bind": "appointment.specialist" }, a.specialist)
    : h("span", { style: "color:var(--ink-3)", "data-bind": "appointment.specialist" }, "No specialist assigned yet")));
  if (a.displayPrice) details.appendChild(detailRow("Price", h("span", { "data-bind": "appointment.displayPrice" }, [h("b", null, a.displayPrice), " \u00b7 as booked"])));
  hero.appendChild(h("div", { style: "font-size:12px;font-weight:650;color:var(--ink-3);margin-top:14px;letter-spacing:.04em;text-transform:uppercase" }, "Visit details"));
  hero.appendChild(details);

  hero.appendChild(h("div", { "class": "appt-hero__ref", "data-bind": "appointment.reference" }, [
    "Reference " + a.reference,
    a.relatedPurchaseRef && allowed.indexOf("openPurchase") !== -1
      ? h("span", null, [" \u00b7 ", h("span", { "class": "link-action", "data-action": "appointment.openPurchase", "data-id": a.relatedPurchaseRef, "data-purchase-ref": a.relatedPurchaseRef }, "View purchase \u203a")])
      : null
  ]));

  /* server-owned policy / attention copy — rendered verbatim, never derived */
  if (a.attention && !cancelled) hero.appendChild(h("div", { "class": "purch-row__attention", "data-bind": "appointment.attention", role: "note", style: "margin-top:12px" }, a.attention));

  if (cancelled) {
    hero.appendChild(h("div", { "class": "appt-hero__note", "data-state": "succeeded" }, "Cancelled \u2014 confirmed by the studio. Nothing further is scheduled for this visit."));
    hero.appendChild(h("div", { "class": "appt-hero__actions" }, [
      open ? ActionButton({ variant: "btn--primary", label: "Book a new visit", action: "booking.open", visualId: "adet-rebook" })
           : ActionButton({ variant: "btn--ghost", label: "Browse services", action: "nav.go", id: "services", visualId: "adet-rebook-browse" })
    ]));
  } else {
    if (rescheduled) hero.appendChild(h("div", { "class": "appt-hero__note", "data-state": "succeeded" }, "Rescheduled \u2014 confirmed by the studio. The previous time was released."));
    if (phase === "failed") hero.appendChild(h("div", { style: "margin-top:12px" }, InlineFailure({
      msg: "Your appointment wasn\u2019t cancelled \u2014 it\u2019s still booked exactly as shown.",
      retryAction: "appointment.cancel", retryId: a.ref, retryLabel: "Try cancelling again"
    })));
    if (phase === "conflict") hero.appendChild(h("div", { style: "margin-top:12px" }, InlineFailure({
      msg: "This appointment changed since you opened it \u2014 reload the latest version before making changes.",
      retryAction: "ui.retry", retryId: cKey, retryLabel: "Reload"
    })));

    /* actions render ONLY from the server's allowedActions list */
    var actions = h("div", { "class": "appt-hero__actions" });
    if (allowed.indexOf("reschedule") !== -1) actions.appendChild(ActionButton({ variant: "btn--ghost", label: "Reschedule", action: "appointment.reschedule", id: a.ref, disabled: !open || conflict || phase === "pending" || phase === "conflict", visualId: "adet-reschedule" }));
    if (allowed.indexOf("cancel") !== -1) actions.appendChild(ActionButton({ variant: "btn--ghost", label: "Cancel visit", action: "appointment.cancel", id: a.ref, confirm: true, pending: phase === "pending", pendingLabel: "Cancelling\u2026", disabled: !open || conflict || phase === "conflict", visualId: "adet-cancel" }));
    if (allowed.indexOf("bookAgain") !== -1) actions.appendChild(ActionButton({ variant: "btn--primary", label: "Book again", action: "appointment.bookAgain", id: a.ref, disabled: !open || conflict, visualId: "adet-book-again" }));
    if (actions.childNodes.length) actions.childNodes.forEach(function (b) { b.setAttribute("data-appointment-ref", a.ref); });
    if (actions.childNodes.length) hero.appendChild(actions);
    if (!open && allowed.length && !(allowed.length === 1 && allowed[0] === "openPurchase")) {
      hero.appendChild(h("div", { "class": "appt-hero__note", "data-state": "unavailable" }, [
        "Online changes aren\u2019t available yet for this visit \u2014 our team can " + (isPast ? "book it again" : "reschedule or cancel it") + " for you. ",
        h("span", { "class": "link-action", "data-action": "support.open" }, "Contact support \u203a")
      ]));
    }
  }

  page.appendChild(hero);
  page.appendChild(h("div", { "class": "catalog-note" }, "Times, prices and statuses are shown exactly as recorded \u2014 this page never estimates deadlines or eligibility."));
  return page;
}
