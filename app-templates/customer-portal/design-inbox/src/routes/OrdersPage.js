// customer-portal-design/src/routes/OrdersPage.js — presentation runtime (auto-split from app.js). No business logic.
import { F } from "../../data/fixtures.js";
import { h } from "../dom.js";
import { activeProfile, filteredOrders, state, tabItems } from "../state.js";
import { Tabs } from "../components/primitives/Tabs.js";
import { EmptyState } from "../components/primitives/EmptyState.js";
import { ErrorState } from "../components/primitives/ErrorState.js";
import { skeletonRow } from "../components/primitives/LoadingState.js";
import { PageHeader } from "../components/shell/PageHeader.js";
import { OrderCard } from "../components/orders/OrderCard.js";
import { TrackingCard } from "../components/orders/TrackingCard.js";
import { MembershipCard } from "../components/orders/MembershipCard.js";
import { WeatherBanner } from "../components/orders/WeatherCard.js";
import { ServiceCard } from "../components/commerce/ServiceCard.js";
import { ProposalBanner } from "../components/proposals/ProposalBanner.js";
import { StormHome } from "../components/storm/StormHome.js";

export function Cabinet() {
  if (activeProfile().weatherCalendar) return StormHome();
  var v = F.themes[state.theme];
  var page = h("section", { "class": "page", "data-route": "orders.list", "data-state": state.view, "data-visual-id": "cabinet" });

  page.appendChild(PageHeader({ title: F.customer.greeting, sub: F.customer.subline }));

  /* ERROR state short-circuits body */
  if (state.view === "error") { page.appendChild(ErrorState({})); return page; }

  /* banners */
  var pending = F.proposalSites.filter(function (p) { return p.status === "unseen" || p.status === "viewed"; }).length;
  if (state.view === "ready") {
    page.appendChild(ProposalBanner(pending));
    var wt = state.orders.find(function (o) { return o.wt && o.wt.status === "pending"; });
    if (wt) page.appendChild(WeatherBanner(wt));
  }

  var grid = h("div", { "class": "cabinet-grid" });
  var left = h("div", { "class": "cabinet-col" });
  var right = h("div", { "class": "cabinet-col" });

  /* live tracking (only when a visit is in progress + ready) */
  if (state.view === "ready" && state.orders.some(function (o) { return o.status === "inprogress"; })) {
    left.appendChild(TrackingCard());
  }

  /* orders card */
  var ordersCard = h("div", { "class": "card", "data-module": "glass-card" });
  ordersCard.appendChild(h("div", { "class": "card__head" }, [
    h("span", { "class": "card__title" }, "Your orders"),
    h("div", { style: "margin-left:auto;display:flex;gap:6px;flex-wrap:wrap;align-items:center" }, [
      Tabs({ items: tabItems(), active: state.filter, action: "order.filter" }),
      h("select", { "class": "select-pill", "data-module": "filter-bar", "data-visual-id": "date-filter", "aria-label": "Date range" }, [
        h("option", null, "All time"), h("option", null, "Last 30 days"), h("option", null, "Last 90 days")
      ]),
      h("select", { "class": "select-pill", "data-module": "filter-bar", "data-visual-id": "location-filter", "aria-label": "Location" },
        [h("option", null, "All locations")].concat(F.addresses.map(function (a) { return h("option", null, a.label); })))
    ])
  ]));

  var listWrap = h("div", { "class": "order-list", "data-module": "order-list", "data-visual-id": "order-list" });
  if (state.view === "loading") {
    for (var i = 0; i < 4; i++) listWrap.appendChild(skeletonRow());
  } else if (state.view === "empty" || filteredOrders().length === 0) {
    listWrap.appendChild(EmptyState({
      glyph: "\ud83d\uddd3", title: "No orders yet",
      desc: "When you book a visit it shows up here with live status and invoices.",
      action: { variant: "btn--primary", label: "Book a service", action: "booking.open", visualId: "empty-book" }
    }));
  } else {
    filteredOrders().forEach(function (o) { listWrap.appendChild(OrderCard(o)); });
  }
  ordersCard.appendChild(listWrap);
  left.appendChild(ordersCard);

  /* right rail */
  var quick = h("div", { "class": "card card--pad", "data-module": "glass-card" }, [
    h("div", { "class": "card__title", style: "margin-bottom:13px" }, "Quick book"),
    h("div", { style: "display:flex;flex-direction:column;gap:9px" },
      v.svc.map(function (s, i) { return ServiceCard(s, i); }))
  ]);
  right.appendChild(quick);
  right.appendChild(MembershipCard(v.plan));

  grid.appendChild(left); grid.appendChild(right);
  page.appendChild(grid);
  return page;
}

/* =========================================================
   STORM HOME  (data-route="orders.list", stormOps profile)
   "What needs me now / before the storm" — not booking-first.
   ========================================================= */
