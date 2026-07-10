// customer-portal-design/src/components/seo/SeoSections.js — presentation runtime. No business logic.
// ============================================================
// Reusable public SEO-landing sections. ONE set of sections
// serves all six verticals — content comes from data/seo-fixtures.js
// (CMS slots), theming from data-theme on <html>.
//
// Stable contract per section:
//   data-module="seo-*"        reusable component id
//   data-visual-id="seo-*"     screenshot parity id
//   data-bind="cms.*"          CMS field the value came from
//   data-state                 ready | loading | empty (dynamic sections only)
//
// CTA action ids are FIXED (see manifest):
//   seo.cta.book     primary — book flow        (destination: meta.primaryCta.destination)
//   seo.cta.quote    primary — request-quote flow
//   seo.cta.call     secondary — call
//   seo.cta.services secondary — jump to services grid
//   seo.service.select  services grid card → booking/quote flow
//   seo.faq.toggle      FAQ accordion
// Each CTA renders data-state = idle | pending | success | error
// from state.seoCta[actionId] (demo lifecycle; Codex owns real
// submission). state.seoCtaForce (dev toolbar) previews any state.
// ============================================================
import { h } from "../../dom.js";
import { state } from "../../state.js";

/* ---------- helpers ---------- */

/* geography merge tag: "{locality}" → CMS locality value */
export function mergeLocality(str, meta) {
  return String(str).split("{locality}").join(meta.locality);
}

/* explicit CMS slot chip — rendered whenever a factual value is
   not supplied (licence №, phone, …). Never invent the fact. */
export function slotChip(label) {
  return h("span", { "class": "seo-slot", "data-state": "no-data" }, label + " \u00b7 from CMS");
}

/* skeleton line for loading states */
function skel(w) {
  return h("span", { "class": "seo-skel", style: "width:" + w });
}

/* dynamic-data state for CMS-driven sections: follows the global
   dev-toolbar view switch. Static sections ignore it. */
export function seoDataState() {
  return state.view === "loading" ? "loading" : state.view === "empty" ? "empty" : "ready";
}

/* CTA with idle/pending/success/error lifecycle */
export function SeoCta(props) {
  var st = state.seoCtaForce || (state.seoCta || {})[props.action] || "idle";
  var label = props.label;
  var cls = "btn " + (props.variant || "btn--primary") + (props.block ? " btn--block" : "") + (props.lg ? " btn--lg" : "") + " seo-cta";
  var inner;
  if (st === "pending") inner = [h("span", { "class": "seo-cta__spin" }), "Sending\u2026"];
  else if (st === "success") inner = ["\u2713 " + (props.successLabel || "Done")];
  else if (st === "error") inner = ["\u26a0 Try again"];
  else inner = [label];
  return h("button", {
    "class": cls,
    "data-module": "seo-cta",
    "data-visual-id": props.visualId || "seo-cta",
    "data-action": props.action,
    "data-id": props.id || undefined,
    "data-state": st,
    "data-bind": props.bind || undefined,
    "disabled": st === "pending" ? true : undefined,
    "aria-live": "polite"
  }, inner);
}

/* striped media slot (real photo/logo supplied later — never drawn) */
function mediaSlot(label, cls) {
  return h("div", { "class": "seo-media-slot " + (cls || ""), "data-state": "no-data" },
    h("span", { "class": "seo-media-slot__label" }, label));
}

function sectionHead(eyebrow, title, sub) {
  return h("div", { "class": "seo-sec__head" }, [
    eyebrow ? h("span", { "class": "eyebrow" }, eyebrow) : null,
    h("h2", { "class": "seo-sec__title" }, title),
    sub ? h("p", { "class": "seo-sec__sub" }, sub) : null
  ]);
}

/* ============================================================
   1 · HERO — service + geography slot + seasonal offer + CTAs
   ============================================================ */
export function SeoHero(seo, v) {
  var meta = seo.meta;
  var ds = seoDataState();
  var primary = SeoCta({
    action: meta.primaryCta.kind === "quote" ? "seo.cta.quote" : "seo.cta.book",
    label: meta.primaryCta.label,
    successLabel: meta.primaryCta.kind === "quote" ? "Request sent" : "Slot held",
    variant: "btn--onaccent", lg: true,
    visualId: "seo-hero-primary-cta",
    bind: "cms.meta.primaryCta"
  });
  var secondary = SeoCta({
    action: meta.secondaryCta.kind === "call" ? "seo.cta.call" : "seo.cta.services",
    label: meta.secondaryCta.kind === "call" ? "\u260e " + meta.secondaryCta.label : meta.secondaryCta.label,
    successLabel: "Calling\u2026",
    variant: "btn--glass-hero", lg: true,
    visualId: "seo-hero-secondary-cta",
    bind: "cms.meta.secondaryCta"
  });

  /* seasonal offer — dynamic CMS slot: skeleton / hidden when absent */
  var offer = null;
  if (ds === "loading") offer = h("div", { "class": "seo-offer", "data-state": "loading" }, [skel("220px")]);
  else if (ds === "ready" && seo.hero.offer) offer = h("div", { "class": "seo-offer", "data-module": "seo-offer", "data-visual-id": "seo-offer", "data-bind": "cms.hero.offer", "data-state": "ready" }, [
    h("span", { "class": "seo-offer__tag" }, seo.hero.offer.tag),
    h("span", null, seo.hero.offer.text),
    h("span", { "class": "seo-offer__until" }, seo.hero.offer.until)
  ]);
  /* ds === "empty" → offer simply not rendered (graceful no-offer page) */

  return h("section", { "class": "seo-hero", "data-module": "seo-hero", "data-visual-id": "seo-hero" },
    h("div", { "class": "seo-hero__inner" }, [
      h("div", { "class": "seo-hero__copy" }, [
        h("span", { "class": "eyebrow seo-hero__area", "data-bind": "cms.meta.serviceArea" }, "\u25c9 Serving " + meta.serviceArea),
        h("h1", { "class": "seo-hero__title", "data-bind": "cms.meta.h1 + cms.meta.locality" }, [
          mergeLocality(meta.h1, meta).split(meta.locality)[0],
          h("span", { "class": "seo-hero__geo", "data-bind": "cms.meta.locality" }, meta.locality),
          mergeLocality(meta.h1, meta).split(meta.locality)[1] || ""
        ]),
        h("p", { "class": "seo-hero__sub", "data-bind": "cms.hero.service" }, seo.hero.service),
        offer,
        h("div", { "class": "seo-hero__ctas" }, [primary, secondary]),
        h("div", { "class": "seo-hero__note" }, "No account needed \u00b7 price shown before you confirm")
      ]),
      mediaSlot("hero image \u00b7 " + v.slug + " crew on site", "seo-hero__media")
    ])
  );
}

/* ============================================================
   2 · TRUST STRIP — rating / licence / insurance / guarantee /
   response-time. CMS DATA SLOTS ONLY — null renders a slot chip.
   ============================================================ */
export function SeoTrustStrip(seo) {
  var t = seo.trust;
  var ds = seoDataState();
  var strip = h("section", { "class": "seo-trust", "data-module": "seo-trust-strip", "data-visual-id": "seo-trust-strip", "data-state": ds });

  if (ds === "loading") {
    for (var i = 0; i < 5; i++) strip.appendChild(h("div", { "class": "seo-trust__item" }, [skel("40%"), skel("70%")]));
    return strip;
  }
  if (ds === "empty") {
    strip.appendChild(h("div", { "class": "seo-trust__fallback", "data-state": "no-data" },
      "Trust claims (rating, licence, insurance) appear here once supplied in the CMS \u2014 nothing is shown unverified."));
    return strip;
  }

  function item(icon, label, valueNode, bind) {
    return h("div", { "class": "seo-trust__item", "data-bind": bind }, [
      h("span", { "class": "seo-trust__icon" }, icon),
      h("div", null, [
        h("div", { "class": "seo-trust__label" }, label),
        h("div", { "class": "seo-trust__value" }, valueNode)
      ])
    ]);
  }
  strip.appendChild(item("\u2605", "Rating", t.rating ? [h("b", null, t.rating.value), " \u00b7 " + t.rating.count] : [slotChip("rating")], "cms.trust.rating"));
  strip.appendChild(item("\u2696", t.licence.label, t.licence.value ? [t.licence.value] : [slotChip("licence \u2116")], "cms.trust.licence"));
  strip.appendChild(item("\u2714", t.insurance.label, t.insurance.value ? [t.insurance.value] : [slotChip("policy")], "cms.trust.insurance"));
  strip.appendChild(item("\u2b1a", t.guarantee.label, [t.guarantee.value], "cms.trust.guarantee"));
  strip.appendChild(item("\u23f1", t.response.label, [t.response.value], "cms.trust.response"));
  return strip;
}

/* ============================================================
   3 · SERVICES GRID — 3–6 services, benefit-first, → booking/quote
   ============================================================ */
export function SeoServicesGrid(seo, v, PAL) {
  var cards = v.svc.slice(0, 6).map(function (s, i) {
    var pal = PAL[i % 4];
    return h("div", {
      "class": "seo-svc", "data-module": "seo-service-card", "data-visual-id": "seo-service-card",
      "data-action": "seo.service.select", "data-id": s.name, "data-bind": "cms.services[]", role: "button", tabindex: "0"
    }, [
      h("div", { "class": "seo-svc__icon", style: "background:" + pal[1] }, h("i", { style: "background:" + pal[0] })),
      h("div", { "class": "seo-svc__name" }, s.name),
      h("div", { "class": "seo-svc__benefit", "data-bind": "cms.services[].benefit" }, s.tagline),
      h("div", { "class": "seo-svc__meta" }, [
        h("span", { "data-bind": "cms.services[].priceFrom" }, "from " + s.price),
        h("span", { "class": "seo-svc__go" }, meta_arrow())
      ])
    ]);
  });
  return h("section", { "class": "seo-sec", id: "seo-services", "data-module": "seo-services-grid", "data-visual-id": "seo-services-grid" }, [
    sectionHead("Services", "What we do", "Every service ends with a photo report in your portal."),
    h("div", { "class": "seo-svc-grid" }, cards)
  ]);
}
function meta_arrow() { return "Book \u2192"; }

/* ============================================================
   4 · HOW IT WORKS — request → scheduling/dispatch → service →
   report/payment (copy per vertical from CMS)
   ============================================================ */
export function SeoHowItWorks(seo) {
  return h("section", { "class": "seo-sec", "data-module": "seo-how-it-works", "data-visual-id": "seo-how-it-works" }, [
    sectionHead("How it works", "From request to report"),
    h("div", { "class": "seo-how" }, seo.how.map(function (s, i) {
      return h("div", { "class": "seo-how__step", "data-bind": "cms.how[" + i + "]" }, [
        h("div", { "class": "seo-how__num" }, String(i + 1)),
        h("div", { "class": "seo-how__title" }, s.title),
        h("div", { "class": "seo-how__desc" }, s.desc)
      ]);
    }))
  ]);
}

/* ============================================================
   5 · VERTICAL PROOF — 3 vertical-specific proof cards
   ============================================================ */
export function SeoProofBlock(seo) {
  return h("section", { "class": "seo-sec seo-sec--tint", "data-module": "seo-proof", "data-visual-id": "seo-proof" }, [
    sectionHead("Why Aircove", seo.proof.title),
    h("div", { "class": "seo-proof" }, seo.proof.items.map(function (p, i) {
      return h("div", { "class": "seo-proof__card", "data-bind": "cms.proof.items[" + i + "]" }, [
        h("div", { "class": "seo-proof__glyph" }, h("i", null)),
        h("div", { "class": "seo-proof__title" }, p.title),
        h("div", { "class": "seo-proof__desc" }, p.desc)
      ]);
    }))
  ]);
}

/* ============================================================
   6 · PRICING EXPECTATIONS — "from" prices via CMS only;
   from:null = price needs assessment/quote
   ============================================================ */
export function SeoPricing(seo) {
  var ds = seoDataState();
  var body;
  if (ds === "loading") {
    body = h("div", { "class": "seo-price" }, [0, 1, 2].map(function () {
      return h("div", { "class": "seo-price__row" }, [skel("30%"), skel("18%")]);
    }));
  } else if (ds === "empty") {
    body = h("div", { "class": "seo-price__fallback", "data-state": "no-data" },
      "No published prices for this market yet \u2014 every request is quoted individually.");
  } else {
    body = h("div", { "class": "seo-price" }, seo.pricing.rows.map(function (r, i) {
      return h("div", { "class": "seo-price__row", "data-bind": "cms.pricing.rows[" + i + "]" }, [
        h("span", { "class": "seo-price__name" }, r.name),
        r.from
          ? h("span", { "class": "seo-price__val" }, [h("b", null, "from " + r.from), h("span", { "class": "seo-price__unit" }, " / " + r.unit)])
          : h("span", { "class": "seo-price__val seo-price__val--quote" }, r.reason)
      ]);
    }));
  }
  return h("section", { "class": "seo-sec", "data-module": "seo-pricing", "data-visual-id": "seo-pricing", "data-state": ds }, [
    sectionHead("Pricing", "What to expect", ds === "ready" ? seo.pricing.note : null),
    body,
    h("div", { "class": "seo-price__cta" }, SeoCta({
      action: seo.meta.primaryCta.kind === "quote" ? "seo.cta.quote" : "seo.cta.book",
      label: seo.meta.primaryCta.kind === "quote" ? "Get an exact quote" : "See exact price & book",
      successLabel: "Request sent",
      variant: "btn--primary", visualId: "seo-pricing-cta"
    }))
  ]);
}

/* ============================================================
   7 · SERVICE AREA — city/region slots + abstract coverage visual
   (no street addresses, no fake map pins)
   ============================================================ */
export function SeoServiceArea(seo) {
  var ds = seoDataState();
  var meta = seo.meta;
  var list;
  if (ds === "loading") list = h("div", { "class": "seo-area__cities" }, [skel("80px"), skel("110px"), skel("90px"), skel("100px")]);
  else if (ds === "empty") list = h("div", { "class": "seo-area__fallback", "data-state": "no-data" }, "Service-area list comes from dispatch coverage in the CMS.");
  else list = h("div", { "class": "seo-area__cities", "data-bind": "cms.area.cities" }, seo.area.cities.map(function (c) {
    return h("span", { "class": "seo-area__chip" }, c);
  }));

  /* abstract coverage rings — deliberately schematic, not a map */
  var ns = "http://www.w3.org/2000/svg";
  var svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", "0 0 200 140");
  svg.setAttribute("class", "seo-area__visual");
  [64, 42, 22].forEach(function (r, i) {
    var c = document.createElementNS(ns, "circle");
    c.setAttribute("cx", "100"); c.setAttribute("cy", "70"); c.setAttribute("r", String(r));
    c.setAttribute("fill", i === 2 ? "rgba(var(--accent-rgb),.18)" : "none");
    c.setAttribute("stroke", "rgba(var(--accent-rgb)," + (0.35 - i * 0.08) + ")");
    c.setAttribute("stroke-dasharray", i === 0 ? "3 5" : "none");
    svg.appendChild(c);
  });
  var dot = document.createElementNS(ns, "circle");
  dot.setAttribute("cx", "100"); dot.setAttribute("cy", "70"); dot.setAttribute("r", "5");
  dot.setAttribute("fill", "var(--accent)");
  svg.appendChild(dot);

  return h("section", { "class": "seo-sec", "data-module": "seo-service-area", "data-visual-id": "seo-service-area", "data-state": ds }, [
    h("div", { "class": "seo-area" }, [
      h("div", null, [
        sectionHead("Coverage", "Where we work"),
        h("div", { "class": "seo-area__region", "data-bind": "cms.meta.serviceArea" }, meta.serviceArea),
        list,
        ds === "ready" ? h("p", { "class": "seo-area__note" }, seo.area.note) : null
      ]),
      h("div", { "class": "seo-area__map" }, [
        svg,
        h("span", { "class": "seo-media-slot__label" }, "coverage map \u00b7 real map or polygon from CMS")
      ])
    ])
  ]);
}

/* ============================================================
   8 · REVIEWS / CASE STUDIES — real media slots + fallback when
   no review or photo is supplied
   ============================================================ */
export function SeoReviews(seo) {
  var ds = seoDataState();
  var body;
  if (ds === "loading") {
    body = h("div", { "class": "seo-reviews" }, [0, 1].map(function () {
      return h("div", { "class": "seo-review" }, [skel("35%"), skel("100%"), skel("85%")]);
    }));
  } else if (ds === "empty" || !seo.reviews.length) {
    /* fallback: no reviews supplied — page stays honest */
    body = h("div", { "class": "seo-reviews__fallback", "data-state": "no-data" }, [
      h("div", { "class": "seo-reviews__fallback-title" }, "Reviews appear here"),
      h("div", null, "Verified customer reviews are pulled from the CMS collection \u2014 none are shown until real ones exist.")
    ]);
  } else {
    body = h("div", { "class": "seo-reviews" }, seo.reviews.map(function (r, i) {
      return h("div", { "class": "seo-review", "data-bind": "cms.reviews[" + i + "]" }, [
        r.media ? h("div", { "class": "seo-review__media" }, h("span", { "class": "seo-media-slot__label" }, "customer photo \u00b7 media slot")) : null,
        h("div", { "class": "seo-review__stars" }, "\u2605\u2605\u2605\u2605\u2605".slice(0, r.rating) + "\u2606\u2606\u2606\u2606\u2606".slice(r.rating)),
        h("p", { "class": "seo-review__text" }, "\u201c" + r.text + "\u201d"),
        h("div", { "class": "seo-review__name" }, r.name)
      ]);
    }));
  }
  return h("section", { "class": "seo-sec seo-sec--tint", "data-module": "seo-reviews", "data-visual-id": "seo-reviews", "data-state": ds === "ready" && !seo.reviews.length ? "empty" : ds }, [
    sectionHead("Reviews", "What customers say"),
    body
  ]);
}

/* ============================================================
   9 · FAQ ACCORDION — question/answer CMS collection.
   Microdata (schema.org FAQPage) so Codex can emit FAQ schema
   straight from the same collection.
   ============================================================ */
export function SeoFaq(seo) {
  var ds = seoDataState();
  var body;
  if (ds === "loading") {
    body = h("div", { "class": "seo-faq" }, [0, 1, 2].map(function () {
      return h("div", { "class": "seo-faq__item" }, h("div", { "class": "seo-faq__q" }, skel("60%")));
    }));
  } else if (ds === "empty") {
    body = h("div", { "class": "seo-faq__fallback", "data-state": "no-data" }, "FAQ collection is empty \u2014 section is omitted from the page and from FAQ schema.");
  } else {
    body = h("div", { "class": "seo-faq", itemscope: "", itemtype: "https://schema.org/FAQPage" }, seo.faq.map(function (f, i) {
      var open = state.seoFaqOpen === i;
      return h("div", {
        "class": "seo-faq__item" + (open ? " is-open" : ""),
        itemscope: "", itemprop: "mainEntity", itemtype: "https://schema.org/Question",
        "data-bind": "cms.faq[" + i + "]"
      }, [
        h("button", { "class": "seo-faq__q", "data-action": "seo.faq.toggle", "data-id": String(i), "aria-expanded": open ? "true" : "false" }, [
          h("span", { itemprop: "name" }, f.q),
          h("span", { "class": "seo-faq__chev" }, open ? "\u2212" : "+")
        ]),
        open ? h("div", { "class": "seo-faq__a", itemscope: "", itemprop: "acceptedAnswer", itemtype: "https://schema.org/Answer" },
          h("p", { itemprop: "text" }, f.a)) : null
      ]);
    }));
  }
  return h("section", { "class": "seo-sec", "data-module": "seo-faq", "data-visual-id": "seo-faq", "data-state": ds }, [
    sectionHead("FAQ", "Common questions"),
    body
  ]);
}

/* ============================================================
   10 · FINAL CONVERSION CTA
   ============================================================ */
export function SeoFinalCta(seo) {
  var meta = seo.meta;
  return h("section", { "class": "seo-final", "data-module": "seo-final-cta", "data-visual-id": "seo-final-cta" }, [
    h("h2", { "class": "seo-final__title", "data-bind": "cms.meta.h1" }, mergeLocality("Ready when you are in {locality}", meta)),
    h("p", { "class": "seo-final__sub" }, "Price up front, photo report after \u2014 every visit in your portal."),
    h("div", { "class": "seo-final__ctas" }, [
      SeoCta({
        action: meta.primaryCta.kind === "quote" ? "seo.cta.quote" : "seo.cta.book",
        label: meta.primaryCta.label, successLabel: "Request sent",
        variant: "btn--onaccent", lg: true, visualId: "seo-final-primary-cta"
      }),
      SeoCta({
        action: "seo.cta.call", label: "\u260e Call us", successLabel: "Calling\u2026",
        variant: "btn--glass-hero", lg: true, visualId: "seo-final-call-cta"
      })
    ])
  ]);
}

/* ============================================================
   11 · PUBLIC FOOTER — contacts / hours / areas / legal (slots)
   ============================================================ */
export function SeoFooter(seo, footer) {
  function col(title, children) {
    return h("div", { "class": "seo-footer__col" }, [h("div", { "class": "seo-footer__head" }, title)].concat(children));
  }
  return h("footer", { "class": "seo-footer", "data-module": "seo-footer", "data-visual-id": "seo-footer" }, [
    h("div", { "class": "seo-footer__grid" }, [
      col("Contact", [
        h("div", { "data-bind": "cms.footer.contacts.phone" }, footer.contacts.phone ? footer.contacts.phone : slotChip("phone")),
        h("div", { "data-bind": "cms.footer.contacts.email" }, footer.contacts.email ? footer.contacts.email : slotChip("email"))
      ]),
      col("Hours", footer.hours.map(function (r) {
        return h("div", { "class": "seo-footer__row", "data-bind": "cms.footer.hours" }, [h("span", null, r.d), h("span", null, r.h)]);
      })),
      col("Service area", [
        h("div", { "data-bind": "cms.meta.serviceArea" }, seo.meta.serviceArea),
        h("div", { "class": "seo-footer__muted", "data-bind": "cms.area.cities" }, seo.area.cities.join(" \u00b7 "))
      ]),
      col("Legal", footer.legal.map(function (l) {
        return h("a", { "class": "seo-footer__link", href: l.href, "data-bind": "cms.footer.legal" }, l.label);
      }))
    ]),
    h("div", { "class": "seo-footer__base" }, [
      h("span", { "data-bind": "brand.name" }, "Aircove"),
      h("span", { "class": "seo-footer__muted", "data-bind": "cms.meta.canonicalPath" }, "canonical: " + seo.meta.canonicalPath)
    ])
  ]);
}

/* ============================================================
   DEV-ONLY · CMS meta preview — surfaces the head-level CMS
   fields (SEO title, meta description, canonical) that have no
   visible place on the page. Stripped on integration
   (data-dev-toolbar).
   ============================================================ */
export function SeoMetaPreview(seo) {
  var meta = seo.meta;
  function row(k, v, bind) {
    return h("div", { "class": "seo-meta__row" }, [
      h("span", { "class": "seo-meta__k" }, k),
      h("span", { "class": "seo-meta__v", "data-bind": bind }, v)
    ]);
  }
  return h("div", { "class": "seo-meta", "data-dev-toolbar": "true", "data-module": "seo-meta-preview" }, [
    h("div", { "class": "seo-meta__head" }, "\u2699 head-level CMS fields (dev preview \u2014 stripped on integration)"),
    row("seoTitle", mergeLocality(meta.seoTitle, meta), "cms.meta.seoTitle"),
    row("metaDescription", mergeLocality(meta.metaDescription, meta), "cms.meta.metaDescription"),
    row("canonical", meta.canonicalPath, "cms.meta.canonicalPath"),
    row("locality", meta.locality + " \u00b7 " + meta.serviceArea, "cms.meta.locality"),
    row("primaryCta \u2192", meta.primaryCta.destination, "cms.meta.primaryCta.destination")
  ]);
}
