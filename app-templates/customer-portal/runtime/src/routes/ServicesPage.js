// customer-portal/runtime/src/routes/ServicesPage.js — production transfer module.
import { F } from "../../data/fixtures.js";
import { h } from "../dom.js";
import { state } from "../state.js";
import { ServiceCatalogCard } from "../components/commerce/ServiceCard.js";
import { PricingCard } from "../components/commerce/PricingCard.js";

export function Services() {
  var v = F.themes[state.theme];
  var page = h("section", { "class": "page", "data-route": "services", "data-visual-id": "services" });
  page.appendChild(h("div", { "class": "section-head" }, [
    h("div", { "class": "section-head__title" }, "Our services"),
    h("div", { "class": "section-head__sub" }, "Certified technicians, upfront pricing, every visit tracked live.")
  ]));
  if (state.view === "loading") {
    var g = h("div", { "class": "services-grid" });
    for (var i = 0; i < 4; i++) g.appendChild(h("div", { "class": "skeleton", style: "height:280px;border-radius:24px" }));
    page.appendChild(g); return page;
  }
  page.appendChild(h("div", { "class": "services-grid", "data-module": "service-list" }, v.svc.map(function (s, i) { return ServiceCatalogCard(s, i); })));
  var steps = [
    { n: "1", t: "Book in seconds", d: "Pick a service & time slot" },
    { n: "2", t: "Track your tech", d: "Live location & ETA" },
    { n: "3", t: "Pay & relax", d: "In-app payment & warranty" }
  ];
  page.appendChild(h("div", { "class": "howto", "data-module": "how-it-works" }, [
    h("div", { "class": "panel__title", style: "margin-bottom:16px" }, "How it works"),
    h("div", { "class": "howto-grid" }, steps.map(function (s) {
      return h("div", { "class": "howto-step" }, [
        h("div", { "class": "howto-step__num" }, s.n),
        h("div", null, [h("div", { style: "font-weight:600;font-size:14px" }, s.t), h("div", { style: "font-size:12.5px;color:var(--ink-2)" }, s.d)])
      ]);
    }))
  ]));
  return page;
}

/* PricingCard */
