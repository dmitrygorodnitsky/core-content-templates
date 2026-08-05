// customer-portal-design/src/routes/SpaCatalogPage.js — Wave 14: Calm Harbor
// "Services & prices" — ONE customer destination over the two stable routes
// `services` and `pricing` (route ids preserved; the in-section tab is the
// accepted transition pattern between them; nav.go carries the route id).
// Data truth: the ready state renders ONLY public Core PIM rows (SPA_SERVICE +
// SPA_MEMBERSHIP) with displayPrice VERBATIM — the page never calculates,
// estimates, compares or transforms a price, and makes no availability claim.
// SPA_MEMBERSHIP rows are "Membership options" (public offers) — NEVER the
// customer's membership or a balance. While booking is closed, cards navigate
// within the catalog ("See in the price list") — never a false reservation.
import { h } from "../dom.js";
import { F } from "../../data/fixtures.js";
import { spaBookingOpen, spaCatalogServices, spaCapability, spaPlanOffers, spaPlanSellOpen, state } from "../state.js";
import { Tabs } from "../components/primitives/Tabs.js";
import { ActionButton } from "../components/primitives/ActionButton.js";
import { gridSkeleton, routeStateBody } from "../components/primitives/RouteStates.js";

/* wave 16 — published plan offer (PACKAGE ≠ MEMBERSHIP) with the buy entry.
   Renders ONLY server-provided displayPrice / termsSummary / benefits /
   sellability; the primary action exists per allowedActions and is disabled
   whenever the offer isn't sellable. Explicitly a PUBLIC offer — never the
   customer's plan or a balance. */
function offerCard(o) {
  var sellability = state.spaOfferDemo === "sellable" ? o.sellability : state.spaOfferDemo;
  var isPkg = o.kind === "PACKAGE";
  var canBuy = o.allowedActions.indexOf("purchase") !== -1;
  var card = h("div", { "class": "card card--pad offer-card", "data-module": "plan-offer-card", "data-visual-id": "plan-offer-card", "data-plan-offer-ref": o.ref, "data-offer-kind": o.kind, "data-state": sellability }, [
    h("div", { style: "display:flex;align-items:center;gap:9px;flex-wrap:wrap" }, [
      h("span", { "class": "kind-chip kind-chip--" + (isPkg ? "package" : "membership"), "data-bind": "planOffer.kind" }, isPkg ? "Package" : "Membership"),
      h("div", { style: "flex:1" }),
      h("span", { "class": "readonly-chip" }, "Published offer")
    ]),
    h("div", { "class": "plan-card__title", "data-bind": "planOffer.title" }, o.title),
    h("div", { "class": "offer-card__price", "data-bind": "planOffer.displayPrice" }, o.displayPrice),
    h("div", { style: "font-size:12.5px;color:var(--ink-2);margin-top:2px", "data-bind": "planOffer.termsSummary" }, o.termsSummary),
    h("ul", { "class": "offer-benefits", "data-bind": "planOffer.benefits" }, o.benefits.map(function (b) { return h("li", null, b); }))
  ]);
  if (sellability === "changed") {
    card.appendChild(h("div", { "class": "purch-row__attention", role: "alert", style: "margin-top:10px" }, F.spaCommerce.offerNotes.changed));
    card.appendChild(h("div", { style: "margin-top:10px" }, ActionButton({ variant: "btn--ghost", label: "Reload offer", action: "ui.retry", id: "plan-offers", visualId: "offer-reload" })));
  }
  if (sellability === "unavailable") card.appendChild(h("div", { "class": "purch-ful__note", "data-state": "unavailable", style: "margin-top:10px" }, F.spaCommerce.offerNotes.unavailable));
  card.appendChild(h("div", { style: "margin-top:12px" }, ActionButton({
    variant: "btn--primary", label: isPkg ? "Buy package" : "Join membership", action: "plan.purchase", id: o.ref, block: true,
    disabled: !canBuy || sellability !== "sellable", visualId: isPkg ? "offer-buy-package" : "offer-join-membership"
  })));
  card.appendChild(h("div", { style: "font-size:11.5px;color:var(--ink-3);margin-top:8px;text-align:center" }, "Checkout is a demonstration — no charge will be made."));
  return card;
}

export function SpaCatalog() {
  var tab = state.route === "pricing" ? "pricing" : "services";
  var open = spaBookingOpen();
  var services = spaCatalogServices();
  var planOffers = spaPlanOffers();
  var liveView = state.config.dataMode === "live" ? (state.moduleStatus.pricing || state.moduleStatus.services || "loading") : state.view;
  var page = h("section", { "class": "page", "data-route": state.route, "data-state": liveView, "data-visual-id": "spa-catalog", "data-module": "spa-catalog", "data-screen-label": "Services & prices (" + tab + ")" });

  page.appendChild(h("div", { "class": "section-head" }, [
    h("div", { "class": "section-head__title" }, "Services & prices"),
    h("div", { "class": "section-head__sub" }, "Every treatment with its live published price \u2014 at the studio or your place.")
  ]));
  page.appendChild(h("div", { "class": "spa-tabs" }, Tabs({
    items: [{ key: "services", label: "Treatments" }, { key: "pricing", label: "Prices & memberships" }],
    active: tab, action: "nav.go"
  })));

  /* live public PIM lifecycle — an empty catalog shows NO fallback or
     estimated price, and a failed load shows nothing stale */
  var gate = routeStateBody({
    view: liveView,
    states: ["loading", "empty", "error"],
    skeleton: function () { return gridSkeleton("spa-svc-grid", 4, 170); },
    empty: { glyph: "\u25a3", title: "Nothing is published right now", desc: "No treatments or membership options are published in the catalog at the moment. They\u2019ll appear here the moment they are \u2014 nothing is estimated in the meantime.",
      action: { variant: "btn--ghost", label: "Contact support", action: "support.email", visualId: "catalog-empty-support" } },
    error: { title: "Couldn\u2019t load the catalog", desc: "Published treatments and prices didn\u2019t load, so no numbers are shown. Nothing was changed \u2014 try again.", retryId: tab }
  });
  if (gate) { page.appendChild(gate); return page; }

  if (tab === "services") {
    var grid = h("div", { "class": "spa-svc-grid", "data-module": "spa-service-list", "data-visual-id": "spa-service-list" });
    services.forEach(function (s) {
      grid.appendChild(h("div", { "class": "card card--pad spa-svc-card", "data-module": "spa-service-card", "data-visual-id": "spa-service-card", "data-product-code": s.code }, [
        h("div", { style: "font-weight:700;font-size:16px;letter-spacing:-.01em;overflow-wrap:anywhere", "data-bind": "pim.services[].name" }, s.name),
        h("div", { style: "font-size:13px;color:var(--ink-2);margin-top:4px;line-height:1.5", "data-bind": "pim.services[].shortDescription" }, s.shortDescription),
        h("div", { "class": "spa-svc-card__price" }, [
          h("b", { "data-bind": "pim.services[].displayPrice" }, s.displayPrice),
          s.interval ? h("span", { "data-bind": "pim.services[].interval" }, "/ " + s.interval) : null
        ]),
        h("div", { "class": "spa-svc-card__foot" }, [
          h("span", { "class": "code-chip", style: "margin-left:0", "data-bind": "pim.services[].code" }, s.code),
          open
            ? ActionButton({ variant: "btn--primary", label: "Book", action: "booking.open", id: s.code, visualId: "spa-svc-book" })
            : h("span", { "class": "link-action", "data-action": "nav.go", "data-id": "pricing" }, "See in the price list \u203a")
        ])
      ]));
    });
    page.appendChild(grid);
    page.appendChild(h("div", { "class": "catalog-note" }, "Prices are shown exactly as published in the public catalog. Availability isn\u2019t shown on this page" + (open ? "." : ", and booking online isn\u2019t available yet.")));
  } else {
    var rates = h("div", { "class": "rates-card", "data-module": "spa-pricing-list", "data-visual-id": "spa-pricing-list" }, [
      h("div", { "class": "panel__title", style: "font-size:16px;padding:14px 0 6px" }, "Treatments")
    ]);
    services.forEach(function (s, i) {
      var pal = F.PAL[i % 4];
      rates.appendChild(h("div", { "class": "rate-row", "data-module": "spa-pricing-row", "data-visual-id": "spa-pricing-row", "data-product-code": s.code }, [
        h("div", { "class": "rate-row__icon", style: "background:" + pal[1] }, h("i", { style: "background:" + pal[0] })),
        h("div", { style: "flex:1;min-width:0" }, [
          h("div", { style: "font-weight:600;font-size:14px;overflow-wrap:anywhere", "data-bind": "pim.services[].name" }, s.name),
          h("div", { style: "font-size:12px;color:var(--ink-2)" , "data-bind": "pim.services[].shortDescription" }, s.shortDescription)
        ]),
        h("div", { style: "font-weight:700;font-size:15px;white-space:nowrap", "data-bind": "pim.services[].displayPrice" }, s.displayPrice + (s.interval ? " / " + s.interval : ""))
      ]));
    });
    page.appendChild(rates);

    /* PUBLIC membership/package offers. Wave 16: while the sellable plan
       contract is open (data-plan-commerce="open") the offers carry the buy
       entry; otherwise the accepted wave-14 catalog treatment stays. Either
       way these are published offers — never the customer's plan. */
    var sellOpen = spaPlanSellOpen();
    if (sellOpen) {
      var offers = h("div", { style: "margin-top:18px", "data-module": "membership-options", "data-visual-id": "membership-options", "data-plan-commerce": "open" }, [
        h("div", { "class": "list-panel__head", style: "padding:0 2px 10px" }, [
          h("div", { "class": "list-panel__title", style: "flex:1" }, "Membership & package options"),
          h("span", { style: "font-size:12px;color:var(--ink-3)" }, "public offers from the catalog")
        ])
      ]);
      var ogrid = h("div", { "class": "offer-grid", "data-module": "plan-offer-list", "data-visual-id": "plan-offer-list" });
      planOffers.forEach(function (o) { ogrid.appendChild(offerCard(o)); });
      offers.appendChild(ogrid);
      offers.appendChild(h("div", { "class": "catalog-note", style: "margin-top:12px" }, [
        "These are published offers with their exact recorded price and terms — not your plan or a balance. Already have one? ",
        h("span", { "class": "link-action", "data-action": "account.openPlan" }, "Open My plan \u203a")
      ]));
      page.appendChild(offers);
    } else {
      var mem = h("div", { "class": "list-panel", style: "margin-top:18px", "data-module": "membership-options", "data-visual-id": "membership-options", "data-plan-commerce": "closed" }, [
        h("div", { "class": "list-panel__head" }, [
          h("div", { "class": "list-panel__title", style: "flex:1" }, "Membership options"),
          h("span", { style: "font-size:12px;color:var(--ink-3)" }, "public offers from the catalog")
        ])
      ]);
      planOffers.filter(function (offer) { return offer.kind === "MEMBERSHIP"; }).forEach(function (offer) {
        var m = { code: offer.productCode || offer.ref, name: offer.title, shortDescription: offer.termsSummary, displayPrice: offer.displayPrice, interval: "" };
        mem.appendChild(h("div", { "class": "rate-row", "data-module": "spa-pricing-row", "data-visual-id": "spa-pricing-row", "data-product-code": m.code }, [
          h("div", { style: "flex:1;min-width:0" }, [
            h("div", { style: "font-weight:600;font-size:14px", "data-bind": "pim.memberships[].name" }, m.name),
            h("div", { style: "font-size:12px;color:var(--ink-2)", "data-bind": "pim.memberships[].shortDescription" }, m.shortDescription)
          ]),
          h("div", { style: "font-weight:700;font-size:15px;white-space:nowrap", "data-bind": "pim.memberships[].displayPrice" }, m.displayPrice + (m.interval ? " / " + m.interval : ""))
        ]));
      });
      mem.appendChild(h("div", { "class": "catalog-note", style: "margin-top:10px" }, [
        "These are published offers \u2014 not your membership or a balance. Joining or managing a plan happens with our team. ",
        h("span", { "class": "link-action", "data-action": "support.email" }, "Ask about membership \u203a")
      ]));
      page.appendChild(mem);
    }
    page.appendChild(h("div", { "class": "catalog-note" }, "Every price on this page comes verbatim from the public catalog \u2014 nothing is calculated, estimated or compared here."));
  }
  return page;
}
