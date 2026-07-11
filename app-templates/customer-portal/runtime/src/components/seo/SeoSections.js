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
function slotChip(label) { return '<span class="seo-slot" data-state="no-data">' + esc(label) + ' &middot; from CMS</span>'; }
function ctaState(view, action) { return view.parity && view.ctaStates && view.ctaStates[action] || "idle"; }

export function SeoCta(cta, props, view) {
  if (!cta) return "";
  props = props || {};
  var state = ctaState(view, cta.action);
  var label = props.label || cta.label;
  var inner = state === "pending" ? '<span class="seo-cta__spin"></span>Sending&hellip;'
    : state === "success" ? '&#10003; ' + esc(props.successLabel || "Done")
      : state === "error" ? '&#9888; Try again' : esc(label);
  var classes = "btn " + (props.variant || "btn--primary") + (props.large ? " btn--lg" : "") + " seo-cta";
  var shared = 'class="' + classes + '" data-module="seo-cta" data-visual-id="' + attr(props.visualId || "seo-cta") + '" data-action="' + attr(cta.action) + '" data-state="' + attr(view.parity ? state : cta.available ? state : "unavailable") + '"' + (props.bind ? ' data-bind="' + attr(props.bind) + '"' : "");
  if (!view.parity) {
    if (cta.available) return '<a ' + shared + ' href="' + attr(cta.destination) + '">' + inner + '</a>';
    return '<button ' + shared + ' type="button" disabled aria-disabled="true" title="Destination unavailable">' + esc(label) + '</button>';
  }
  var available = cta.available || cta.action === "seo.cta.services";
  return '<button ' + shared + (cta.action === "seo.cta.services" ? ' href="#seo-services"' : "") + (!available ? ' aria-disabled="true"' : "") + (state === "pending" ? ' disabled' : "") + ' aria-live="polite">' + inner + '</button>';
}

export function SeoPublicHeader(model) {
  var brand = model.brand.url ? '<a class="seo-public-header__brand" href="' + attr(model.brand.url) + '">' + esc(model.brand.name) + '</a>' : '<span class="seo-public-header__brand">' + esc(model.brand.name) + '</span>';
  return '<header class="seo-public-header" data-module="seo-public-header"><div class="seo-public-header__inner">' + brand + '<span class="seo-public-header__area">' + esc(model.meta.serviceArea) + '</span></div></header>';
}

export function SeoMetaPreview(model) {
  return '<div class="seo-meta" data-dev-toolbar="true" data-module="seo-meta-preview"><div class="seo-meta__head">&#9881; head-level CMS fields (dev preview &mdash; stripped on integration)</div>' +
    '<div class="seo-meta__row"><span class="seo-meta__k">seoTitle</span><span class="seo-meta__v">' + esc(model.meta.title) + '</span></div>' +
    '<div class="seo-meta__row"><span class="seo-meta__k">metaDescription</span><span class="seo-meta__v">' + esc(model.meta.description) + '</span></div>' +
    '<div class="seo-meta__row"><span class="seo-meta__k">canonical</span><span class="seo-meta__v">' + esc(model.meta.canonicalPath) + '</span></div>' +
    '<div class="seo-meta__row"><span class="seo-meta__k">locality</span><span class="seo-meta__v">' + esc(model.meta.locality + " \u00b7 " + model.meta.serviceArea) + '</span></div></div>';
}

export function SeoHero(model, view) {
  var localityIndex = model.meta.h1.indexOf(model.meta.locality);
  var before = localityIndex === -1 ? model.meta.h1 : model.meta.h1.slice(0, localityIndex);
  var after = localityIndex === -1 ? "" : model.meta.h1.slice(localityIndex + model.meta.locality.length);
  var offer = view.dataState === "loading" ? '<div class="seo-offer" data-state="loading">' + skel("220px") + '</div>'
    : view.dataState === "ready" && model.hero.offer ? '<div class="seo-offer" data-module="seo-offer" data-visual-id="seo-offer" data-bind="cms.hero.offer" data-state="ready"><span class="seo-offer__tag">' + esc(model.hero.offer.tag) + '</span><span>' + esc(model.hero.offer.text) + '</span><span class="seo-offer__until">' + esc(model.hero.offer.until || "") + '</span></div>' : "";
  var secondaryLabel = model.meta.secondaryCta && model.meta.secondaryCta.action === "seo.cta.call" ? "\u260e " + model.meta.secondaryCta.label : model.meta.secondaryCta && model.meta.secondaryCta.label;
  var media;
  var mediaClass = "";
  if (model.hero.media) media = '<img class="seo-hero__media" src="' + attr(model.hero.media.url) + '" alt="' + attr(model.hero.media.alt) + '">';
  else if (view.parity) media = '<div class="seo-media-slot seo-hero__media" data-state="no-data"><span class="seo-media-slot__label">hero image &middot; ' + esc(model.vertical.slug) + ' crew on site</span></div>';
  else { media = ""; mediaClass = " seo-hero--no-media"; }
  return '<section class="seo-hero' + mediaClass + '" data-module="seo-hero" data-visual-id="seo-hero" data-media-state="' + (model.hero.media ? 'available' : 'absent') + '" data-offer-state="' + attr(view.dataState) + '"><div class="seo-hero__inner' + (mediaClass ? ' seo-hero__inner--no-media' : '') + '"><div class="seo-hero__copy">' +
    '<span class="eyebrow seo-hero__area" data-bind="cms.meta.serviceArea">\u25c9 Serving ' + esc(model.meta.serviceArea) + '</span><h1 class="seo-hero__title" data-bind="cms.meta.h1 + cms.meta.locality">' + esc(before) + '<span class="seo-hero__geo" data-bind="cms.meta.locality">' + esc(model.meta.locality) + '</span>' + esc(after) + '</h1><p class="seo-hero__sub" data-bind="cms.hero.service">' + esc(model.hero.service) + '</p>' + offer + '<div class="seo-hero__ctas">' +
    SeoCta(model.meta.primaryCta, { variant: "btn--onaccent", large: true, visualId: "seo-hero-primary-cta", bind: "cms.meta.primaryCta", successLabel: model.meta.primaryCta.action === "seo.cta.quote" ? "Request sent" : "Slot held" }, view) +
    SeoCta(model.meta.secondaryCta, { label: secondaryLabel, variant: "btn--glass-hero", large: true, visualId: "seo-hero-secondary-cta", bind: "cms.meta.secondaryCta", successLabel: "Calling\u2026" }, view) +
    '</div>' + (model.hero.note ? '<div class="seo-hero__note">' + esc(model.hero.note) + '</div>' : "") + '</div>' + media + '</div></section>';
}

export function SeoTrustStrip(model, view) {
  if (view.dataState === "loading") return '<section class="seo-trust" data-module="seo-trust-strip" data-visual-id="seo-trust-strip" data-state="loading">' + Array(5).fill('<div class="seo-trust__item">' + skel("40%") + skel("70%") + '</div>').join("") + '</section>';
  if (view.dataState === "empty" || !model.trust.length) return '<section class="seo-trust" data-module="seo-trust-strip" data-visual-id="seo-trust-strip" data-state="empty"><div class="seo-trust__fallback" data-state="no-data">Trust claims (rating, licence, insurance) appear here once supplied in the CMS &mdash; nothing is shown unverified.</div></section>';
  return '<section class="seo-trust" data-module="seo-trust-strip" data-visual-id="seo-trust-strip" data-state="ready">' + model.trust.map(function (fact) {
    var value = fact.value ? (fact.key === "rating" ? '<b>' + esc(fact.value) + '</b> &middot; ' + esc(fact.count || "") : esc(fact.value)) : slotChip(fact.slot || fact.label.toLowerCase());
    return '<div class="seo-trust__item" data-bind="cms.trust.' + attr(fact.key) + '"><span class="seo-trust__icon">' + esc(fact.icon) + '</span><div><div class="seo-trust__label">' + esc(fact.label) + '</div><div class="seo-trust__value">' + value + '</div></div></div>';
  }).join("") + '</section>';
}

function serviceControl(service, view) {
  var selected = service.id === view.selectedServiceId;
  var palette = service.palette || ["var(--accent)", "rgba(var(--accent-rgb),.12)"];
  var content = '<div class="seo-svc__icon" style="background:' + attr(palette[1]) + '"><i style="background:' + attr(palette[0]) + '"></i></div><div class="seo-svc__name">' + esc(service.name) + '</div><div class="seo-svc__benefit" data-bind="cms.services[].benefit">' + esc(service.benefit) + '</div><div class="seo-svc__meta"><span data-bind="cms.services[].priceFrom">' + (service.priceFrom ? 'from ' + esc(service.priceFrom) : "") + '</span><span class="seo-svc__go">' + (view.parity ? 'Book \u2192' : service.destination ? 'Continue' : 'Unavailable') + '</span></div>';
  var shared = 'class="seo-svc' + (selected ? ' is-selected' : '') + '" data-module="seo-service-card" data-visual-id="seo-service-card" data-action="seo.service.select" data-id="' + attr(service.id) + '" data-bind="cms.services[]"';
  if (view.parity) return '<div ' + shared + ' role="button" tabindex="0"' + (selected ? ' aria-pressed="true"' : '') + '>' + content + '</div>';
  if (service.destination) return '<a ' + shared + ' data-state="available" href="' + attr(service.destination) + '">' + content + '</a>';
  return '<button type="button" ' + shared + ' data-state="unavailable" disabled aria-disabled="true">' + content + '</button>';
}

export function SeoServicesGrid(model, view) {
  var selected = model.services.find(function (service) { return service.id === view.selectedServiceId; });
  var readback = view.parity && selected ? '<p class="seo-selection-readback" data-seo-selection data-state="selected" aria-live="polite">Selected service: ' + esc(selected.name) + '</p>' : "";
  return '<section class="seo-sec" id="seo-services" data-module="seo-services-grid" data-visual-id="seo-services-grid">' + head("Services", "What we do", "Every service ends with a photo report in your portal.") + '<div class="seo-svc-grid">' + model.services.map(function (service) { return serviceControl(service, view); }).join("") + '</div>' + readback + '</section>';
}

export function SeoHowItWorks(model) {
  return '<section class="seo-sec" data-module="seo-how-it-works" data-visual-id="seo-how-it-works">' + head("How it works", "From request to report") + '<div class="seo-how">' + model.how.map(function (step, index) { return '<div class="seo-how__step" data-bind="cms.how[' + index + ']"><div class="seo-how__num">' + (index + 1) + '</div><div class="seo-how__title">' + esc(step.title) + '</div><div class="seo-how__desc">' + esc(step.desc) + '</div></div>'; }).join("") + '</div></section>';
}

export function SeoProofBlock(model) {
  return '<section class="seo-sec seo-sec--tint" data-module="seo-proof" data-visual-id="seo-proof">' + head("Why Aircove", model.proof.title) + '<div class="seo-proof">' + model.proof.items.map(function (item, index) { return '<div class="seo-proof__card" data-bind="cms.proof.items[' + index + ']"><div class="seo-proof__glyph"><i></i></div><div class="seo-proof__title">' + esc(item.title) + '</div><div class="seo-proof__desc">' + esc(item.desc) + '</div></div>'; }).join("") + '</div></section>';
}

export function SeoPricing(model, view) {
  var body = view.dataState === "loading" ? '<div class="seo-price">' + Array(3).fill('<div class="seo-price__row">' + skel("30%") + skel("18%") + '</div>').join("") + '</div>'
    : view.dataState === "empty" || !model.pricing.rows.length ? '<div class="seo-price__fallback" data-state="no-data">No published prices for this market yet &mdash; every request is quoted individually.</div>'
      : '<div class="seo-price">' + model.pricing.rows.map(function (row, index) { return '<div class="seo-price__row" data-bind="cms.pricing.rows[' + index + ']"><span class="seo-price__name">' + esc(row.name) + '</span>' + (row.from ? '<span class="seo-price__val"><b>from ' + esc(row.from) + '</b><span class="seo-price__unit"> / ' + esc(row.unit || "") + '</span></span>' : '<span class="seo-price__val seo-price__val--quote">' + esc(row.reason || "") + '</span>') + '</div>'; }).join("") + '</div>';
  var ctaLabel = model.meta.primaryCta.action === "seo.cta.quote" ? "Get an exact quote" : "See exact price & book";
  return '<section class="seo-sec" data-module="seo-pricing" data-visual-id="seo-pricing" data-state="' + attr(view.dataState) + '">' + head("Pricing", "What to expect", view.dataState === "ready" ? model.pricing.note : "") + body + '<div class="seo-price__cta">' + SeoCta(model.meta.primaryCta, { label: ctaLabel, visualId: "seo-pricing-cta", successLabel: "Request sent" }, view) + '</div></section>';
}

export function SeoServiceArea(model, view) {
  var list = view.dataState === "loading" ? '<div class="seo-area__cities">' + ["80px", "110px", "90px", "100px"].map(skel).join("") + '</div>'
    : view.dataState === "empty" ? '<div class="seo-area__fallback" data-state="no-data">Service-area list comes from dispatch coverage in the CMS.</div>'
      : '<div class="seo-area__cities" data-bind="cms.area.cities">' + model.area.cities.map(function (city) { return '<span class="seo-area__chip">' + esc(city) + '</span>'; }).join("") + '</div>';
  var svg = '<svg viewBox="0 0 200 140" class="seo-area__visual"><circle cx="100" cy="70" r="64" fill="none" stroke="rgba(var(--accent-rgb),0.35)" stroke-dasharray="3 5"></circle><circle cx="100" cy="70" r="42" fill="none" stroke="rgba(var(--accent-rgb),0.26999999999999996)" stroke-dasharray="none"></circle><circle cx="100" cy="70" r="22" fill="rgba(var(--accent-rgb),.18)" stroke="rgba(var(--accent-rgb),0.18999999999999997)" stroke-dasharray="none"></circle><circle cx="100" cy="70" r="5" fill="var(--accent)"></circle></svg>';
  var region = view.dataState === "ready" ? '<div class="seo-area__region" data-bind="cms.meta.serviceArea">' + esc(model.meta.serviceArea) + '</div>' : "";
  var mapLabel = view.parity ? "coverage map \u00b7 real map or polygon from CMS" : "coverage visualization";
  return '<section class="seo-sec" data-module="seo-service-area" data-visual-id="seo-service-area" data-state="' + attr(view.dataState) + '"><div class="seo-area"><div>' + head("Coverage", "Where we work") + region + list + (view.dataState === "ready" ? '<p class="seo-area__note">' + esc(model.area.note || "") + '</p>' : "") + '</div><div class="seo-area__map">' + svg + '<span class="seo-media-slot__label">' + esc(mapLabel) + '</span></div></div></section>';
}

export function SeoReviews(model, view) {
  var body;
  if (view.dataState === "loading") body = '<div class="seo-reviews">' + Array(2).fill('<div class="seo-review">' + skel("35%") + skel("100%") + skel("85%") + '</div>').join("") + '</div>';
  else if (view.dataState === "empty" || !model.reviews.length) body = '<div class="seo-reviews__fallback" data-state="no-data"><div class="seo-reviews__fallback-title">Reviews appear here</div><div>Verified customer reviews are pulled from the CMS collection &mdash; none are shown until real ones exist.</div></div>';
  else body = '<div class="seo-reviews">' + model.reviews.map(function (review, index) { return '<div class="seo-review" data-bind="cms.reviews[' + index + ']">' + (review.media ? '<div class="seo-review__media"><span class="seo-media-slot__label">customer photo &middot; media slot</span></div>' : "") + '<div class="seo-review__stars">' + esc("\u2605\u2605\u2605\u2605\u2605".slice(0, review.rating) + "\u2606\u2606\u2606\u2606\u2606".slice(review.rating)) + '</div><p class="seo-review__text">&ldquo;' + esc(review.text) + '&rdquo;</p><div class="seo-review__name">' + esc(review.name) + '</div></div>'; }).join("") + '</div>';
  return '<section class="seo-sec seo-sec--tint" data-module="seo-reviews" data-visual-id="seo-reviews" data-state="' + attr(view.dataState === "ready" && !model.reviews.length ? "empty" : view.dataState) + '">' + head("Reviews", "What customers say") + body + '</section>';
}

export function SeoFaq(model, view) {
  var body;
  if (view.dataState === "loading") body = '<div class="seo-faq">' + Array(3).fill('<div class="seo-faq__item"><div class="seo-faq__q">' + skel("60%") + '</div></div>').join("") + '</div>';
  else if (view.dataState === "empty") body = '<div class="seo-faq__fallback" data-state="no-data">FAQ collection is empty &mdash; section is omitted from the page and from FAQ schema.</div>';
  else if (view.parity) body = '<div class="seo-faq" itemscope itemtype="https://schema.org/FAQPage">' + model.faq.map(function (faq, index) { var open = faq.id === view.faqOpenId; return '<div class="seo-faq__item' + (open ? ' is-open' : '') + '" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question" data-bind="cms.faq[' + index + ']"><button class="seo-faq__q" data-action="seo.faq.toggle" data-id="' + attr(faq.id) + '" aria-expanded="' + String(open) + '"><span itemprop="name">' + esc(faq.q) + '</span><span class="seo-faq__chev">' + (open ? '&minus;' : '+') + '</span></button><div class="seo-faq__a" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer"' + (open ? '' : ' hidden') + '><p itemprop="text">' + esc(faq.a) + '</p></div></div>'; }).join("") + '</div>';
  else body = '<div class="seo-faq">' + model.faq.map(function (faq, index) { var open = index === 0; return '<details class="seo-faq__item' + (open ? ' is-open' : '') + '" data-id="' + attr(faq.id) + '"' + (open ? ' open' : '') + '><summary class="seo-faq__q" data-action="seo.faq.toggle" data-id="' + attr(faq.id) + '"><span>' + esc(faq.q) + '</span><span class="seo-faq__chev" aria-hidden="true"></span></summary><div class="seo-faq__a"><p>' + esc(faq.a) + '</p></div></details>'; }).join("") + '</div>';
  return '<section class="seo-sec" data-module="seo-faq" data-visual-id="seo-faq" data-state="' + attr(view.dataState) + '">' + head("FAQ", "Common questions") + body + '</section>';
}

export function SeoFinalCta(model, view) {
  return '<section class="seo-final" data-module="seo-final-cta" data-visual-id="seo-final-cta"><h2 class="seo-final__title" data-bind="cms.meta.h1">' + esc(model.final.heading) + '</h2><p class="seo-final__sub">' + esc(model.final.body || "") + '</p><div class="seo-final__ctas">' + SeoCta(model.meta.primaryCta, { variant: "btn--onaccent", large: true, visualId: "seo-final-primary-cta", successLabel: "Request sent" }, view) + SeoCta(model.meta.callCta, { label: "\u260e Call us", variant: "btn--glass-hero", large: true, visualId: "seo-final-call-cta", successLabel: "Calling\u2026" }, view) + '</div></section>';
}

export function SeoFooter(model, view) {
  function col(title, body) { return '<div class="seo-footer__col"><div class="seo-footer__head">' + esc(title) + '</div>' + body + '</div>'; }
  var contact = model.footer.phone || model.footer.email || view.parity ? '<div data-bind="cms.footer.contacts.phone">' + (model.footer.phone ? esc(model.footer.phone) : slotChip("phone")) + '</div><div data-bind="cms.footer.contacts.email">' + (model.footer.email ? esc(model.footer.email) : slotChip("email")) + '</div>' : "";
  var hours = model.footer.hours.map(function (row) { return '<div class="seo-footer__row" data-bind="cms.footer.hours"><span>' + esc(row.days) + '</span><span>' + esc(row.hours) + '</span></div>'; }).join("");
  var area = '<div data-bind="cms.meta.serviceArea">' + esc(model.meta.serviceArea) + '</div><div class="seo-footer__muted" data-bind="cms.area.cities">' + esc(model.area.cities.join(" \u00b7 ")) + '</div>';
  var legal = model.footer.legal.map(function (link) { return '<a class="seo-footer__link" href="' + attr(link.href) + '" data-bind="cms.footer.legal">' + esc(link.label) + '</a>'; }).join("");
  return '<footer class="seo-footer" data-module="seo-footer" data-visual-id="seo-footer"><div class="seo-footer__grid">' + (contact ? col("Contact", contact) : "") + col("Hours", hours) + col("Service area", area) + (legal ? col("Legal", legal) : "") + '</div><div class="seo-footer__base"><span data-bind="brand.name">' + esc(model.brand.name) + '</span><span class="seo-footer__muted" data-bind="cms.meta.canonicalPath">' + (view.parity ? 'canonical: ' + esc(model.meta.canonicalPath) : esc(model.meta.serviceArea)) + '</span></div></footer>';
}

export const SEO_SECTION_ORDER = ["seo-hero", "seo-trust-strip", "seo-services-grid", "seo-how-it-works", "seo-proof", "seo-pricing", "seo-service-area", "seo-reviews", "seo-faq", "seo-final-cta", "seo-footer"];
export const SEO_COMPONENT_IDS = ["seo-hero", "seo-trust-strip", "seo-service-card", "seo-services-grid", "seo-how-it-works", "seo-proof", "seo-pricing", "seo-service-area", "seo-reviews", "seo-faq", "seo-final-cta", "seo-footer", "seo-cta", "seo-meta-preview"];

export function renderSeoSections(model, view) {
  view = Object.assign({ dataState: "ready", faqOpenId: null, selectedServiceId: null, ctaStates: {}, parity: false }, view || {});
  return (view.parity ? SeoMetaPreview(model) : "") + SeoHero(model, view) + SeoTrustStrip(model, view) + SeoServicesGrid(model, view) + SeoHowItWorks(model, view) + SeoProofBlock(model, view) + SeoPricing(model, view) + SeoServiceArea(model, view) + SeoReviews(model, view) + SeoFaq(model, view) + SeoFinalCta(model, view) + SeoFooter(model, view);
}
