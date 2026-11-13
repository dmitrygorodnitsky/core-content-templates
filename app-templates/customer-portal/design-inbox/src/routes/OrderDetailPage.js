// customer-portal-design/src/routes/OrderDetailPage.js — presentation runtime (auto-split from app.js). No business logic.
import { F } from "../../data/fixtures.js";
import { h } from "../dom.js";
import { currentOrder, cmdPhase, state } from "../state.js";
import { StatusBadge } from "../components/primitives/StatusBadge.js";
import { ActionButton } from "../components/primitives/ActionButton.js";
import { ErrorState } from "../components/primitives/ErrorState.js";
import { detailSkeleton } from "../components/primitives/LoadingState.js";
import { InlineFailure } from "../components/primitives/RouteStates.js";
import { WeatherDetail } from "../components/orders/WeatherCard.js";
import { Timeline } from "../components/orders/Timeline.js";

export function buildOrderView(o) {
  var num = parseInt(String(o.price).replace(/[^0-9]/g, ""), 10);
  var hasPrice = num > 0 && o.status !== "cancelled";
  var labor = hasPrice ? Math.round(num * 0.65) : 0;
  var parts = hasPrice ? num - labor : 0;
  var activeIdx = o.status === "scheduled" ? 0 : o.status === "inprogress" ? 2 : 3;
  var stepDefs = [
    { label: "Order booked", sub: "Confirmation sent" },
    { label: "Technician assigned", sub: "Daniel R. \u00b7 \u2605 4.9" },
    { label: "On the way", sub: "Live ETA shared" },
    { label: "Service complete", sub: o.status === "completed" ? "Rated \u2605\u2605\u2605\u2605\u2605" : "Pending" }
  ];
  var steps = stepDefs.map(function (st, i) {
    var dot, done;
    if (o.status === "cancelled") { dot = i === 0 ? "#1f8a44" : "#cfd4dd"; done = i === 0; }
    else if (o.status === "completed") { dot = "#1f8a44"; done = true; }
    else if (i < activeIdx) { dot = "#1f8a44"; done = true; }
    else if (i === activeIdx) { dot = "var(--accent)"; done = true; }
    else { dot = "#cfd4dd"; done = false; }
    return { label: st.label, sub: st.sub, dot: dot, muted: !done };
  });
  var loc = F.addresses.find(function (a) { return a.id === o.locationId; });
  return {
    order: o, hasPrice: hasPrice,
    laborStr: "$" + labor, partsStr: "$" + parts,
    steps: steps, location: loc,
    isScheduled: o.status === "scheduled", isInProgress: o.status === "inprogress",
    isCompleted: o.status === "completed", isCancelled: o.status === "cancelled"
  };
}

/* Timeline component */

export function DetailLiveMap() {
  var canvas = h("div", { "class": "detail-map__canvas" }, [
    detailSvg(),
    h("div", { style: "position:absolute;left:40px;top:142px;width:14px;height:14px;border-radius:999px;background:var(--surface);border:3px solid var(--accent)" }),
    h("div", { style: "position:absolute;left:548px;top:18px" }, [
      h("div", { "class": "tracking-pin-end__ping" }),
      h("div", { "class": "tracking-pin-end__dot" })
    ])
  ]);
  var bar = h("div", { "class": "detail-map__bar" }, [
    h("div", { style: "font-weight:600;font-size:14px;flex:1", "data-bind": "visit.techName,visit.eta" }, F.technician.name + " is on the way \u00b7 " + F.technician.eta),
    ActionButton({ variant: "btn--primary", label: "Call", action: "support.open", visualId: "detail-call" })
  ]);
  return h("div", { "class": "detail-map", "data-module": "tracking-card", "data-visual-id": "detail-live-map" }, [canvas, bar]);
}

export function detailSvg() {
  var ns = "http://www.w3.org/2000/svg";
  var svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 600 180"); svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("style", "position:absolute;inset:0;width:100%;height:100%");
  var p = document.createElementNS(ns, "path");
  p.setAttribute("d", "M40 150 C 160 130, 200 50, 330 70 S 520 60, 560 30");
  p.setAttribute("fill", "none"); p.setAttribute("stroke", "var(--accent)");
  p.setAttribute("stroke-width", "3"); p.setAttribute("stroke-dasharray", "8 8"); p.setAttribute("opacity", ".55");
  svg.appendChild(p); return svg;
}

/* Weather-trigger detail card */

export function kv(k, v) { return h("div", { "class": "kv-row" }, [h("span", null, k), h("b", null, v)]); }

export function PhotoReport() {
  function col(label, after) {
    return h("div", null, [
      h("div", { "class": "photo-col__label" }, label),
      h("div", { "class": "photo-pair" }, [
        h("div", { "class": "photo-tile" + (after ? " photo-tile--after" : "") }, h("span", null, (after ? "after" : "before") + " photo")),
        h("div", { "class": "photo-tile" + (after ? " photo-tile--after" : "") }, h("span", null, (after ? "after" : "before") + " photo"))
      ])
    ]);
  }
  return h("div", { "class": "panel", "data-module": "photo-report", "data-visual-id": "photo-report" }, [
    h("div", { "class": "panel__title", style: "margin-bottom:3px" }, "Photo report"),
    h("div", { style: "font-size:13px;color:var(--ink-2);margin-bottom:14px" }, "Before & after this visit"),
    h("div", { "class": "photo-grid" }, [col("Before", false), col("After", true)])
  ]);
}

export function OrderDetail() {
  var o = currentOrder();
  var page = h("section", { "class": "page page--narrow", "data-route": "order.detail", "data-visual-id": "order-detail", "data-state": o.status });
  page.appendChild(h("div", { "class": "detail-back", "data-action": "order.back", "data-visual-id": "detail-back" }, "\u2039 Back to orders"));

  if (state.view === "loading") { page.appendChild(detailSkeleton()); return page; }
  if (state.view === "error") { page.appendChild(ErrorState({ title: "Couldn\u2019t load this visit", desc: "Something went wrong fetching the order. Try again." })); return page; }

  var vm = buildOrderView(o);
  var meta = F.statusMeta[o.status];

  /* header */
  page.appendChild(h("div", { "class": "detail-head" }, [
    h("div", { "class": "detail-head__icon", style: "background:" + o.iconBg }, h("i", { style: "background:" + o.dot })),
    h("div", { "class": "detail-head__body" }, [
      h("div", { "class": "detail-head__title", "data-bind": "order.name" }, o.name),
      h("div", { "class": "detail-head__meta", "data-bind": "order.id,order.date" }, o.id + " \u00b7 " + o.date)
    ]),
    h("div", { "class": "detail-head__right" }, [
      StatusBadge({ variant: meta.badge, label: meta.label, bind: "order.statusLabel" }),
      h("div", { "class": "detail-price", "data-bind": "order.price" }, vm.isCancelled ? "\u2014" : o.price)
    ])
  ]));

  var grid = h("div", { "class": "detail-grid" });
  var left = h("div", { "class": "detail-col" });
  var right = h("div", { "class": "detail-col" });

  /* status banner / live map */
  if (vm.isInProgress) left.appendChild(DetailLiveMap());
  if (vm.isScheduled) left.appendChild(h("div", { "class": "status-banner status-banner--accent", "data-module": "status-banner", "data-visual-id": "scheduled-banner" }, [
    h("div", { "class": "status-banner__icon" }, h("i")),
    h("div", { style: "flex:1" }, [
      h("div", { "class": "status-banner__title" }, "Scheduled for " + o.date),
      h("div", { "class": "status-banner__sub" }, "A technician will be assigned 24h before your visit.")
    ])
  ]));
  if (vm.isCompleted) left.appendChild(h("div", { "class": "status-banner status-banner--ok", "data-module": "status-banner", "data-visual-id": "completed-banner" }, [
    h("div", { "class": "status-banner__icon", style: "color:var(--ok)" }, "\u2713"),
    h("div", { style: "flex:1" }, [
      h("div", { "class": "status-banner__title" }, "Completed on " + o.date),
      h("div", { "class": "status-banner__sub status-banner__sub--ok" }, "You rated this visit \u2605\u2605\u2605\u2605\u2605")
    ])
  ]));
  if (vm.isCancelled) left.appendChild(h("div", { "class": "status-banner status-banner--danger", "data-module": "status-banner", "data-visual-id": "cancelled-banner" }, [
    h("div", { "class": "status-banner__icon", style: "color:var(--danger)" }, "\u2715"),
    h("div", { style: "flex:1" }, [
      h("div", { "class": "status-banner__title" }, "Visit cancelled"),
      h("div", { "class": "status-banner__sub status-banner__sub--danger" }, "This visit was cancelled. You weren\u2019t charged.")
    ])
  ]));

  /* service location */
  if (vm.location) {
    var others = state.orders.filter(function (x) { return x.id !== o.id && (x.status === "scheduled" || x.status === "inprogress"); });
    var locCard = h("div", { "class": "card", "data-module": "location-card", "data-visual-id": "location-card", style: "overflow:hidden" }, [
      h("div", { style: "display:flex;align-items:center;gap:10px;padding:14px 16px 0;flex-wrap:wrap" }, [
        h("div", { "class": "panel__title", style: "font-size:14.5px" }, "Service location"),
        h("div", { style: "font-size:12.5px;color:var(--ink-2)" }, "\ud83d\udccd " + vm.location.label)
      ])
    ]);
    if (others.length) locCard.appendChild(h("div", { style: "display:flex;gap:8px;flex-wrap:wrap;padding:10px 16px 0" },
      others.map(function (x) {
        var l2 = F.addresses.find(function (a) { return a.id === x.locationId; });
        return h("span", { "class": "chip", "data-action": "order.open", "data-id": x.id }, "\u2194 " + (l2 ? l2.label : "") + " \u00b7 " + x.date);
      })));
    locCard.appendChild(h("div", { "class": "property-map" }, [
      h("span", { "class": "map-label" }, "property map"),
      h("div", { style: "position:absolute;left:30%;top:52%" }, h("div", { "class": "map-pin__marker" }))
    ]));
    left.appendChild(locCard);
  }

  /* technician */
  if (!vm.isCancelled) left.appendChild(h("div", { "class": "tech-card", "data-module": "technician-card", "data-visual-id": "technician-card" }, [
    h("div", { "class": "tech-card__avatar" }),
    h("div", { style: "flex:1" }, [
      h("div", { style: "font-weight:700;font-size:15px", "data-bind": "technician.name" }, F.technician.name),
      h("div", { style: "font-size:12.5px;color:var(--ink-2)" }, F.technician.role + " \u00b7 \u2605 " + F.technician.rating + " (" + F.technician.visits + " visits)")
    ]),
    ActionButton({ variant: "btn--ghost", label: "Message", action: "support.open", visualId: "tech-message" })
  ]));

  /* timeline */
  left.appendChild(Timeline(vm.steps));

  /* weather trigger */
  if (o.wt) left.appendChild(WeatherDetail(o));

  /* photo report */
  if (o.photos && vm.isCompleted) left.appendChild(PhotoReport());

  /* right rail: invoice + actions */
  var inv = h("div", { "class": "panel", "data-module": "invoice", "data-visual-id": "invoice" }, [h("div", { "class": "panel__title", style: "margin-bottom:14px" }, "Invoice")]);
  if (vm.hasPrice) {
    inv.appendChild(h("div", { "class": "invoice__row" }, [h("span", null, "Labor"), h("b", null, vm.laborStr)]));
    inv.appendChild(h("div", { "class": "invoice__row" }, [h("span", null, "Parts & materials"), h("b", null, vm.partsStr)]));
    inv.appendChild(h("div", { "class": "invoice__total" }, [h("span", null, "Total"), h("span", { "data-bind": "order.price" }, o.price)]));
  } else if (vm.isScheduled) {
    inv.appendChild(h("div", { style: "font-size:13px;line-height:1.5;color:var(--ink-2)" }, [
      "Final price is confirmed after the on-site assessment. Estimate: ",
      h("b", { style: "color:var(--ink)" }, o.price), "."
    ]));
  } else {
    inv.appendChild(h("div", { style: "font-size:13px;color:var(--ink-2)" }, "No charge for this visit."));
  }
  right.appendChild(inv);

  var acts = h("div", { "class": "action-stack" });
  if (vm.isCompleted) {
    acts.appendChild(ActionButton({ variant: "btn--primary", label: "Download invoice", action: "order.downloadInvoice", id: o.id, block: true, lg: true, visualId: "download-invoice" }));
    acts.appendChild(ActionButton({ variant: "btn--ghost", label: "Book again", action: "order.bookAgain", block: true, lg: true, visualId: "book-again" }));
  } else if (vm.isInProgress) {
    acts.appendChild(ActionButton({ variant: "btn--primary", label: "Contact technician", action: "support.open", block: true, lg: true, visualId: "contact-tech" }));
  } else if (vm.isScheduled) {
    /* wave 13 — cancel is an entity-scoped command on THIS visit: pending on the
       exact button, failure keeps the visit scheduled with explicit retry */
    var cnKey = "order.cancel:" + o.id;
    var cnPhase = cmdPhase(cnKey);
    acts.appendChild(ActionButton({ variant: "btn--primary", label: "Reschedule", action: "order.reschedule", id: o.id, block: true, lg: true, visualId: "reschedule", disabled: cnPhase === "pending" }));
    if (cnPhase === "failed" || cnPhase === "conflict") acts.appendChild(InlineFailure({
      msg: cnPhase === "conflict" ? "This visit changed while you were viewing it \u2014 it was NOT cancelled. Refresh and review it first." : "The visit wasn\u2019t cancelled \u2014 it\u2019s still scheduled.",
      retryAction: cnPhase === "conflict" ? "ui.retry" : "order.cancel", retryId: cnPhase === "conflict" ? cnKey : o.id,
      retryLabel: cnPhase === "conflict" ? "Refresh" : "Retry cancel"
    }));
    acts.appendChild(ActionButton({ variant: "btn--danger", label: "Cancel visit", action: "order.cancel", id: o.id, confirm: true, block: true, lg: true, visualId: "cancel-visit",
      pending: cnPhase === "pending", pendingLabel: "Cancelling\u2026" }));
  } else if (vm.isCancelled) {
    acts.appendChild(ActionButton({ variant: "btn--primary", label: "Rebook this service", action: "order.bookAgain", block: true, lg: true, visualId: "rebook" }));
  }
  acts.appendChild(ActionButton({ variant: "btn--ghost", label: "Get help", action: "support.open", block: true, lg: true, visualId: "get-help" }));
  right.appendChild(acts);

  grid.appendChild(left); grid.appendChild(right);
  page.appendChild(grid);
  return page;
}
