function esc(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
  });
}

function attr(value) { return esc(value); }
function skel(width) { return '<span class="seo-skel" style="width:' + attr(width) + '"></span>'; }
function head(eyebrow, title, sub) {
  return '<div class="seo-sec__head">' + (eyebrow ? '<span class="eyebrow">' + esc(eyebrow) + '</span>' : "") +
    '<h2 class="seo-sec__title">' + esc(title) + '</h2>' + (sub ? '<p class="seo-sec__sub">' + esc(sub) + '</p>' : "") + '</div>';
}

function ctaState(view, action) {
  return view.parity && view.ctaStates && view.ctaStates[action] || "idle";
}

function ctaInner(label, state, parity) {
  if (!parity) return esc(label);
  if (state === "pending") return '<span class="seo-cta__spin" aria-hidden="true"></span>Sending...';
  if (state === "success") return 'Done: ' + esc(label);
  if (state === "error") return 'Try again: ' + esc(label);
  return esc(label);
}

export function SeoCta(cta, props, view) {
  if (!cta) return "";
  props = props || {};
  var state = ctaState(view, cta.action);
  var renderedState = view.parity ? state : cta.available ? state : "unavailable";
  var classes = "btn " + (props.variant || "btn--primary") + (props.large ? " btn--lg" : "") + " seo-cta";
  var shared = 'class="' + classes + '" data-module="seo-cta" data-visual-id="' + attr(props.visualId || "seo-cta") +
    '" data-action="' + attr(cta.action) + '" data-state="' + attr(renderedState) + '"';
  if (cta.available) return '<a ' + shared + ' href="' + attr(cta.destination) + '">' + ctaInner(cta.label, state, view.parity) + '</a>';
  return '<button ' + shared + ' type="button" disabled aria-disabled="true" title="Destination unavailable">' + esc(cta.label) + '</button>';
}

export function SeoPublicHeader(model) {
  var brand = model.brand.url ? '<a class="seo-public-header__brand" href="' + attr(model.brand.url) + '">' + esc(model.brand.name) + '</a>' : '<span class="seo-public-header__brand">' + esc(model.brand.name) + '</span>';
  return '<header class="seo-public-header" data-module="seo-public-header"><div class="seo-public-header__inner">' + brand + '<span class="seo-public-header__area">' + esc(model.meta.serviceArea) + '</span></div></header>';
}

export function SeoMetaPreview(model) {
  return '<div class="seo-meta" data-dev-toolbar="true" data-module="seo-meta-preview"><div class="seo-meta__head">Reference fixture metadata (parity only)</div>' +
    '<div class="seo-meta__row"><span class="seo-meta__k">title</span><span class="seo-meta__v">' + esc(model.meta.title) + '</span></div>' +
    '<div class="seo-meta__row"><span class="seo-meta__k">description</span><span class="seo-meta__v">' + esc(model.meta.description) + '</span></div>' +
    '<div class="seo-meta__row"><span class="seo-meta__k">canonical</span><span class="seo-meta__v">' + esc(model.meta.canonicalUrl) + '</span></div></div>';
}

export function SeoHero(model, view) {
  var offer = "";
  if (view.dataState === "loading") offer = '<div class="seo-offer" data-state="loading">' + skel("220px") + '</div>';
  else if (view.dataState === "ready" && model.hero.offer) offer = '<div class="seo-offer" data-module="seo-offer" data-visual-id="seo-offer" data-bind="cms.hero.offer" data-state="ready"><span class="seo-offer__tag">' + esc(model.hero.offer.tag) + '</span><span>' + esc(model.hero.offer.text) + '</span>' + (model.hero.offer.until ? '<span class="seo-offer__until">' + esc(model.hero.offer.until) + '</span>' : "") + '</div>';
  var hasMedia = Boolean(model.hero.media);
  var media = hasMedia ? '<img class="seo-hero__media" src="' + attr(model.hero.media.url) + '" alt="' + attr(model.hero.media.alt) + '">' : view.parity ? '<div class="seo-media-slot seo-hero__media" data-state="no-data"><span class="seo-media-slot__label">reference media slot</span></div>' : "";
  var noMedia = !hasMedia && !view.parity;
  return '<section class="seo-hero' + (noMedia ? ' seo-hero--no-media' : '') + '" data-module="seo-hero" data-visual-id="seo-hero" data-media-state="' + (hasMedia ? 'available' : 'absent') + '" data-offer-state="' + attr(view.dataState) + '"><div class="seo-hero__inner' + (noMedia ? ' seo-hero__inner--no-media' : '') + '"><div class="seo-hero__copy">' +
    '<span class="eyebrow seo-hero__area" data-bind="cms.meta.serviceArea">Serving ' + esc(model.meta.serviceArea) + '</span><h1 class="seo-hero__title" data-bind="cms.meta.h1">' + esc(model.meta.h1) + '</h1>' +
    '<p class="seo-hero__sub" data-bind="cms.hero.service">' + esc(model.hero.service) + '</p>' + offer + '<div class="seo-hero__ctas">' +
    SeoCta(model.meta.primaryCta, { variant: "btn--onaccent", large: true, visualId: "seo-hero-primary-cta" }, view) + SeoCta(model.meta.secondaryCta, { variant: "btn--glass-hero", large: true, visualId: "seo-hero-secondary-cta" }, view) + '</div>' +
    (model.hero.note ? '<div class="seo-hero__note">' + esc(model.hero.note) + '</div>' : "") + '</div>' + media + '</div></section>';
}

export function SeoTrustStrip(model, view) {
  if (view.dataState === "loading") return '<section class="seo-trust" data-module="seo-trust-strip" data-visual-id="seo-trust-strip" data-state="loading">' + Array(5).fill('<div class="seo-trust__item">' + skel("70%") + '</div>').join("") + '</section>';
  if (view.dataState === "empty" || !model.trust.length) return '<section class="seo-trust" data-module="seo-trust-strip" data-visual-id="seo-trust-strip" data-state="empty"><p class="seo-trust__fallback">Verified trust details are not available.</p></section>';
  return '<section class="seo-trust" data-module="seo-trust-strip" data-visual-id="seo-trust-strip" data-state="ready">' + model.trust.map(function (fact) { return '<div class="seo-trust__item"><div><div class="seo-trust__label">' + esc(fact.label) + '</div><div class="seo-trust__value"><b>' + esc(fact.value) + '</b>' + (fact.count ? ' &middot; ' + esc(fact.count) : "") + '</div></div></div>'; }).join("") + '</section>';
}

function serviceControl(service, view) {
  var content = '<span class="seo-svc__icon" aria-hidden="true"><i></i></span><span class="seo-svc__name">' + esc(service.name) + '</span><span class="seo-svc__benefit">' + esc(service.benefit) + '</span><span class="seo-svc__meta">' + (service.priceFrom ? '<span>from ' + esc(service.priceFrom) + '</span>' : '<span></span>') + '<span class="seo-svc__go">' + (view.parity ? 'Select' : service.destination ? 'Continue' : 'Unavailable') + '</span></span>';
  var shared = 'class="seo-svc' + (view.parity && service.id === view.selectedServiceId ? ' is-selected' : '') + '" data-module="seo-service-card" data-visual-id="seo-service-card" data-action="seo.service.select" data-id="' + attr(service.id) + '" data-bind="cms.services[]"';
  if (view.parity) return '<button type="button" ' + shared + ' aria-pressed="' + String(service.id === view.selectedServiceId) + '">' + content + '</button>';
  if (service.destination) return '<a ' + shared + ' data-state="available" href="' + attr(service.destination) + '">' + content + '</a>';
  return '<button type="button" ' + shared + ' data-state="unavailable" disabled aria-disabled="true">' + content + '</button>';
}

export function SeoServicesGrid(model, view) {
  var readback = view.parity ? '<p class="seo-selection-readback" data-seo-selection aria-live="polite">' + (view.selectedServiceId ? 'Selected service: ' + esc((model.services.find(function (item) { return item.id === view.selectedServiceId; }) || {}).name || "") : 'No service selected') + '</p>' : "";
  return '<section class="seo-sec" id="seo-services" data-module="seo-services-grid" data-visual-id="seo-services-grid">' + head("Services", "What we do", "Available services and destinations are authored for this page.") + '<div class="seo-svc-grid">' + model.services.map(function (service) { return serviceControl(service, view); }).join("") + '</div>' + readback + '</section>';
}

export function SeoHowItWorks(model) {
  return '<section class="seo-sec" data-module="seo-how-it-works" data-visual-id="seo-how-it-works">' + head("How it works", "From request to completion") + '<div class="seo-how">' + model.how.map(function (step, index) { return '<div class="seo-how__step"><div class="seo-how__num">' + String(index + 1) + '</div><div class="seo-how__title">' + esc(step.title) + '</div><div class="seo-how__desc">' + esc(step.desc) + '</div></div>'; }).join("") + '</div></section>';
}

export function SeoProofBlock(model) {
  return '<section class="seo-sec seo-sec--tint" data-module="seo-proof" data-visual-id="seo-proof">' + head("Why choose us", model.proof.title) + '<div class="seo-proof">' + model.proof.items.map(function (item) { return '<div class="seo-proof__card"><div class="seo-proof__glyph" aria-hidden="true"><i></i></div><div class="seo-proof__title">' + esc(item.title) + '</div><div class="seo-proof__desc">' + esc(item.desc) + '</div></div>'; }).join("") + '</div></section>';
}

export function SeoPricing(model, view) {
  var body = view.dataState === "loading" ? '<div class="seo-price">' + Array(3).fill('<div class="seo-price__row">' + skel("70%") + '</div>').join("") + '</div>' : view.dataState === "empty" || !model.pricing.rows.length ? '<p class="seo-price__fallback">Published pricing is not available.</p>' : '<div class="seo-price">' + model.pricing.rows.map(function (row) { return '<div class="seo-price__row"><span class="seo-price__name">' + esc(row.name) + '</span><span class="seo-price__val">' + (row.from ? '<b>from ' + esc(row.from) + '</b>' + (row.unit ? ' / ' + esc(row.unit) : '') : esc(row.reason || "")) + '</span></div>'; }).join("") + '</div>';
  return '<section class="seo-sec" data-module="seo-pricing" data-visual-id="seo-pricing" data-state="' + attr(view.dataState) + '">' + head("Pricing", "What to expect", view.dataState === "ready" ? model.pricing.note : "") + body + '<div class="seo-price__cta">' + SeoCta(model.meta.primaryCta, { visualId: "seo-pricing-cta" }, view) + '</div></section>';
}

export function SeoServiceArea(model, view) {
  var body;
  if (view.dataState === "loading") body = '<div class="seo-area__cities" data-state="loading">' + skel("70%") + '</div>';
  else if (view.dataState === "empty") body = '<p class="seo-area__fallback" data-state="no-data">Service-area details are not available.</p>';
  else body = '<div class="seo-area__region">' + esc(model.meta.serviceArea) + '</div><div class="seo-area__cities">' + model.area.cities.map(function (city) { return '<span class="seo-area__chip">' + esc(city) + '</span>'; }).join("") + '</div>' + (model.area.note ? '<p class="seo-area__note">' + esc(model.area.note) + '</p>' : "");
  return '<section class="seo-sec" data-module="seo-service-area" data-visual-id="seo-service-area" data-state="' + attr(view.dataState) + '"><div class="seo-area"><div>' + head("Coverage", "Where we work") + body + '</div></div></section>';
}

export function SeoReviews(model, view) {
  var state = view.dataState === "empty" || view.dataState === "ready" && !model.reviews.length ? "empty" : view.dataState;
  var reviews;
  if (view.dataState === "loading") reviews = Array(2).fill('<div class="seo-review" data-state="loading">' + skel("90%") + '</div>').join("");
  else if (state === "empty") reviews = '<p class="seo-reviews__fallback" data-state="no-data">Verified reviews are not available.</p>';
  else reviews = model.reviews.map(function (review) { return '<article class="seo-review"><div class="seo-review__stars" aria-label="' + attr(review.rating) + ' out of 5 stars">' + '&#9733;'.repeat(review.rating) + '</div><p class="seo-review__text">' + esc(review.text) + '</p><div class="seo-review__name">' + esc(review.name) + '</div></article>'; }).join("");
  return '<section class="seo-sec seo-sec--tint" data-module="seo-reviews" data-visual-id="seo-reviews" data-state="' + attr(state) + '">' + head("Reviews", "What customers say") + '<div class="seo-reviews">' + reviews + '</div></section>';
}

export function SeoFaq(model, view) {
  var body;
  if (view.dataState === "loading") body = Array(3).fill('<div class="seo-faq__item" data-state="loading">' + skel("70%") + '</div>').join("");
  else if (view.dataState === "empty") body = '<p class="seo-faq__fallback" data-state="no-data">FAQ details are not available.</p>';
  else body = model.faq.map(function (faq, index) {
    var open = view.parity ? faq.id === view.faqOpenId : index === 0;
    return '<details class="seo-faq__item' + (open ? ' is-open' : '') + '" data-id="' + attr(faq.id) + '"' + (open ? ' open' : '') + '><summary class="seo-faq__q" data-action="seo.faq.toggle" data-id="' + attr(faq.id) + '"><span>' + esc(faq.q) + '</span><span class="seo-faq__chev" aria-hidden="true"></span></summary><div class="seo-faq__a"><p>' + esc(faq.a) + '</p></div></details>';
  }).join("");
  return '<section class="seo-sec" data-module="seo-faq" data-visual-id="seo-faq" data-state="' + attr(view.dataState) + '">' + head("FAQ", "Common questions") + '<div class="seo-faq">' + body + '</div></section>';
}

export function SeoFinalCta(model, view) {
  return '<section class="seo-final" data-module="seo-final-cta" data-visual-id="seo-final-cta"><h2 class="seo-final__title">' + esc(model.final.heading) + '</h2>' + (model.final.body ? '<p class="seo-final__sub">' + esc(model.final.body) + '</p>' : "") + '<div class="seo-final__ctas">' + SeoCta(model.meta.primaryCta, { variant: "btn--onaccent", large: true, visualId: "seo-final-primary-cta" }, view) + SeoCta(model.meta.callCta, { variant: "btn--glass-hero", large: true, visualId: "seo-final-call-cta" }, view) + '</div></section>';
}

export function SeoFooter(model) {
  var contact = [model.footer.phone ? '<a href="tel:' + attr(model.footer.phone) + '">' + esc(model.footer.phone) + '</a>' : "", model.footer.email ? '<a href="mailto:' + attr(model.footer.email) + '">' + esc(model.footer.email) + '</a>' : ""].filter(Boolean).join("");
  return '<footer class="seo-footer" data-module="seo-footer" data-visual-id="seo-footer"><div class="seo-footer__grid">' + (contact ? '<div class="seo-footer__col"><div class="seo-footer__head">Contact</div>' + contact + '</div>' : "") + (model.footer.hours.length ? '<div class="seo-footer__col"><div class="seo-footer__head">Hours</div>' + model.footer.hours.map(function (row) { return '<div class="seo-footer__row"><span>' + esc(row.days) + '</span><span>' + esc(row.hours) + '</span></div>'; }).join("") + '</div>' : "") + '<div class="seo-footer__col"><div class="seo-footer__head">Service area</div><div>' + esc(model.meta.serviceArea) + '</div><div class="seo-footer__muted">' + esc(model.area.cities.join(" | ")) + '</div></div>' + (model.footer.legal.length ? '<div class="seo-footer__col"><div class="seo-footer__head">Legal</div>' + model.footer.legal.map(function (link) { return '<a class="seo-footer__link" href="' + attr(link.href) + '">' + esc(link.label) + '</a>'; }).join("") + '</div>' : "") + '</div><div class="seo-footer__base"><span>' + esc(model.brand.name) + '</span><span class="seo-footer__muted">' + esc(model.meta.serviceArea) + '</span></div></footer>';
}

export const SEO_SECTION_ORDER = ["seo-hero", "seo-trust-strip", "seo-services-grid", "seo-how-it-works", "seo-proof", "seo-pricing", "seo-service-area", "seo-reviews", "seo-faq", "seo-final-cta", "seo-footer"];
export const SEO_COMPONENT_IDS = ["seo-hero", "seo-trust-strip", "seo-service-card", "seo-services-grid", "seo-how-it-works", "seo-proof", "seo-pricing", "seo-service-area", "seo-reviews", "seo-faq", "seo-final-cta", "seo-footer", "seo-cta", "seo-meta-preview"];

export function renderSeoSections(model, view) {
  view = Object.assign({ dataState: "ready", faqOpenId: null, selectedServiceId: null, ctaStates: {}, parity: false }, view || {});
  return (view.parity ? SeoMetaPreview(model) : "") + SeoHero(model, view) + SeoTrustStrip(model, view) + SeoServicesGrid(model, view) + SeoHowItWorks(model) + SeoProofBlock(model) + SeoPricing(model, view) + SeoServiceArea(model, view) + SeoReviews(model, view) + SeoFaq(model, view) + SeoFinalCta(model, view) + SeoFooter(model);
}
