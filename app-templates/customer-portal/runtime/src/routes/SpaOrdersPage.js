// customer-portal-design/src/routes/SpaOrdersPage.js — Wave 14: Calm Harbor CURRENT
// STAGING Orders (route orders.list, capability current-staging).
// A neutral, READ-ONLY presentation of the proven User -> Account -> Orders path.
// Rows render ONLY the normalized safe fields the staging adapter owns: order type
// label/code, reference, raw status, displayed total and currency.
// DELIBERATELY ABSENT (their sources are not open): appointment claims, date/time,
// specialist, salon/home location, tracking, invoice download, detail navigation,
// reschedule / cancel / book-again controls. Raw statuses (e.g. OPEN) are shown AS
// RECORDED with the unmapped-status treatment — never translated into scheduling
// language like "Upcoming" or "Confirmed".
import { h } from "../dom.js";
import { F } from "../../data/fixtures.js";
import { spaCustomer, state } from "../state.js";
import { PageHeader } from "../components/shell/PageHeader.js";
import { EmptyState } from "../components/primitives/EmptyState.js";
import { StatusBadge } from "../components/primitives/StatusBadge.js";
import { routeStateBody } from "../components/primitives/RouteStates.js";
import { skeletonRow } from "../components/primitives/LoadingState.js";

function orderThumb(order) {
  var mode = state.spaOrderMedia;
  var attrs = { "class": "order-card__icon spa-order-thumb", "data-visual-id": "order-thumb", "data-media-kind": order.media && order.media.kind || "none", "aria-hidden": "true" };
  if (mode === "loading") {
    attrs["class"] += " skeleton";
    attrs["data-state"] = "loading";
    return h("div", attrs);
  }
  var showImage = mode === "broken" || mode !== "missing" && mode !== "forbidden" && order.media && order.media.url;
  if (!showImage) {
    attrs["data-state"] = "no-media";
    return h("div", attrs);
  }
  attrs["data-state"] = "ready";
  var wrap = h("div", attrs);
  var image = h("img", { "class": "spa-order-thumb__img", src: mode === "broken" ? "media/orders/__unresolved__.webp" : order.media.url, alt: "", "data-bind": "order.media.url" });
  image.addEventListener("error", function () {
    wrap.setAttribute("data-state", "no-media");
    if (image.parentNode) wrap.removeChild(image);
  });
  wrap.appendChild(image);
  return wrap;
}

export function SpaOrders() {
  var liveEnvelope = state.config.dataMode === "live" ? state.moduleData.orders : null;
  var routeState = liveEnvelope && liveEnvelope.state || state.moduleStatus.orders || state.view;
  var page = h("section", { "class": "page", "data-route": "orders.list", "data-state": routeState, "data-visual-id": "spa-orders", "data-capability": "current-staging", "data-screen-label": "Orders (current staging)" });
  page.appendChild(PageHeader({ title: spaCustomer().greeting, sub: "Here\u2019s what\u2019s on your account." }));

  var gate = routeStateBody({
    states: ["error", "unauthorized"],
    error: { title: "Couldn\u2019t load your orders", desc: "Your orders didn\u2019t load, so nothing is shown \u2014 we never show stale records. Nothing was changed; try again.", retryId: "orders" },
    scope: "your orders", backRoute: "services"
  });
  if (gate) { page.appendChild(gate); return page; }

  var card = h("div", { "class": "card", "data-module": "spa-order-list", "data-visual-id": "spa-order-list" });
  card.appendChild(h("div", { "class": "card__head" }, [
    h("span", { "class": "card__title" }, "Your orders"),
    h("span", { "class": "readonly-chip" }, "Read-only")
  ]));

  var listWrap = h("div", { "class": "order-list" });
  var fixtureRows = state.spaRows === "one" ? F.spa.stagingOrders.slice(0, 1) : F.spa.stagingOrders;
  var rows = liveEnvelope && Array.isArray(liveEnvelope.items) ? liveEnvelope.items.map(liveOrder) : fixtureRows;
  if (routeState === "loading") {
    for (var i = 0; i < 3; i++) listWrap.appendChild(skeletonRow());
  } else if (routeState === "empty" || rows.length === 0) {
    listWrap.appendChild(EmptyState({
      glyph: "\u25ce", title: "No orders on your account yet",
      desc: "Anything recorded on your account will appear here, exactly as our records show it.",
      action: { variant: "btn--ghost", label: "Browse services", action: "nav.go", id: "services", visualId: "orders-empty-browse" }
    }));
  } else {
    rows.forEach(function (o, i) {
      listWrap.appendChild(h("article", { "class": "spa-order-row", "data-module": "spa-order-row", "data-visual-id": "spa-order-row", "data-order-ref": o.ref }, [
        orderThumb(o),
        h("div", { "class": "spa-order-row__body" }, [
          h("div", { "class": "order-card__name", "data-bind": "order.typeLabel" }, o.typeLabel),
          h("div", { "class": "order-card__meta" }, [
            h("span", { "data-bind": "order.reference" }, "Reference " + o.ref),
            h("span", { "class": "code-chip", "data-bind": "order.typeCode" }, o.typeCode)
          ])
        ]),
        StatusBadge({ variant: "status-badge--unmapped", label: o.status, bind: "order.rawStatus", state: "unmapped" }),
        h("div", { "class": "spa-order-row__amount" }, [
          h("b", { "data-bind": "order.displayTotal" }, o.total),
          h("span", { "data-bind": "order.currency" }, o.currency)
        ])
      ]));
    });
  }
  card.appendChild(listWrap);
  card.appendChild(h("div", { "class": "card__footnote" }, "Statuses and amounts appear exactly as recorded on your account \u2014 this view is read-only. Scheduling details and online changes aren\u2019t part of these records."));
  page.appendChild(card);
  return page;
}

function liveOrder(order) {
  var currency = order.currency && order.currency.code || "";
  var total = Number.isFinite(order.grandTotal)
    ? new Intl.NumberFormat("en", { style: "currency", currency: currency || "USD" }).format(order.grandTotal)
    : "—";
  return {
    ref: String(order.id),
    typeLabel: order.type && order.type.label || order.type && order.type.code || "Order",
    typeCode: order.type && order.type.code || "ORDER",
    status: order.statusCode || "UNMAPPED",
    total: total,
    currency: currency,
    media: order.media || null,
  };
}
