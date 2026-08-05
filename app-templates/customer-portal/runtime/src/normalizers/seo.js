const MERGE_TAG = /\{([a-z][a-z0-9-]*)\}/gi;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TEL = /^tel:\+[1-9][0-9]{6,14}$/;
const PHONE = /^\+[1-9][0-9]{6,14}$/;

export const SEO_PUBLIC_REQUIRED_COLLECTIONS = Object.freeze([
  "services", "how", "proof.items", "area.cities", "faq",
]);

function own(object, key, path) {
  if (!object || typeof object !== "object" || Array.isArray(object) || !Object.prototype.hasOwnProperty.call(object, key)) {
    throw new Error(path + "." + key + " is required");
  }
  return object[key];
}

function object(value, path) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(path + " must be an object");
  return value;
}

function string(value, path) {
  if (typeof value !== "string" || !value.trim()) throw new Error(path + " must be a nonempty string");
  return value.trim();
}

function nullableString(value, path) {
  if (value === null) return null;
  return string(value, path);
}

function array(value, path, minimum) {
  if (!Array.isArray(value) || value.length < (minimum || 0)) throw new Error(path + " must contain at least " + String(minimum || 0) + " item(s)");
  return value;
}

function slug(value, path) {
  var result = string(value, path);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result)) throw new Error(path + " must be a lowercase URL slug");
  return result;
}

function merge(value, tags, path) {
  var source = string(value, path);
  var result = source.replace(MERGE_TAG, function (_, key) {
    if (!Object.prototype.hasOwnProperty.call(tags, key)) throw new Error(path + " contains unknown merge tag {" + key + "}");
    return tags[key];
  });
  if (/[{}]/.test(result)) throw new Error(path + " contains an unresolved or malformed merge tag");
  return result.replace(/\s+/g, " ").trim();
}

function optionalMerge(value, tags, path) {
  return value === null ? null : merge(value, tags, path);
}

function parseOrigin(value, path) {
  var url;
  try { url = new URL(string(value, path)); } catch (_) { throw new Error(path + " must be an absolute HTTPS origin"); }
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error(path + " must be an absolute HTTPS origin without credentials, path, query, or fragment");
  }
  return url.origin;
}

function assertPublicDnsHost(origin, path, allowTestHosts) {
  var hostname = new URL(origin).hostname.toLowerCase();
  var isIpLiteral = hostname.indexOf(":") !== -1 || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname);
  if (isIpLiteral) throw new Error(path + " must use a public DNS hostname, not an IP literal");
  if (hostname.indexOf(".") === -1) throw new Error(path + " must use a multi-label public DNS hostname");

  var reservedSuffixes = [".example", ".invalid", ".localhost", ".local", ".internal", ".lan", ".localdomain", ".home.arpa", ".onion"];
  var reservedDomains = ["example.com", "example.net", "example.org"];
  if (hostname === "localhost" || reservedSuffixes.some(function (suffix) { return hostname.endsWith(suffix); }) || reservedDomains.some(function (domain) { return hostname === domain || hostname.endsWith("." + domain); })) {
    throw new Error(path + " must use a public DNS hostname, not a reserved or local hostname");
  }
  var labels = hostname.split(".");
  if (labels.some(function (label) { return !label || label.length > 63 || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label); })) {
    throw new Error(path + " must use a syntactically valid public DNS hostname");
  }
  var topLevel = labels[labels.length - 1];
  if (/^\d+$/.test(topLevel) || topLevel.length < 2) throw new Error(path + " must use a credible public DNS hostname");
  if (hostname.endsWith(".test")) {
    if (allowTestHosts) return;
    throw new Error(path + " must use a credible public DNS hostname; .test is reference-only");
  }
}

function normalizePolicy(deployment, allowTestHosts) {
  deployment = object(deployment, "deployment");
  var canonicalOrigin = parseOrigin(own(deployment, "canonicalOrigin", "deployment"), "deployment.canonicalOrigin");
  var allowedOrigins = array(own(deployment, "allowedOrigins", "deployment"), "deployment.allowedOrigins", 1).map(function (value, index) {
    return parseOrigin(value, "deployment.allowedOrigins[" + index + "]");
  });
  if (!allowedOrigins.includes(canonicalOrigin)) throw new Error("deployment.allowedOrigins must include deployment.canonicalOrigin");
  assertPublicDnsHost(canonicalOrigin, "deployment.canonicalOrigin", allowTestHosts);
  allowedOrigins.forEach(function (origin, index) { assertPublicDnsHost(origin, "deployment.allowedOrigins[" + index + "]", allowTestHosts); });
  var assetBase = string(own(deployment, "assetBase", "deployment"), "deployment.assetBase");
  var publicScriptUrl = string(own(deployment, "publicScriptUrl", "deployment"), "deployment.publicScriptUrl");
  if (!/^\/(?!\/)(?!.*\.\.)(?:[a-zA-Z0-9._~!$&'()*+,;=:@%/-]+)$/.test(assetBase)) throw new Error("deployment.assetBase must be a root-relative path without traversal");
  if (!/^\/(?!\/)(?!.*\.\.)(?:[a-zA-Z0-9._~!$&'()*+,;=:@%/-]+\.js)$/.test(publicScriptUrl)) throw new Error("deployment.publicScriptUrl must be a root-relative JavaScript path without traversal");
  return {
    canonicalOrigin: canonicalOrigin,
    allowedOrigins: Array.from(new Set(allowedOrigins)),
    allowCanonicalQuery: own(deployment, "allowCanonicalQuery", "deployment") === true,
    assetBase: assetBase.replace(/\/$/, ""),
    publicScriptUrl: publicScriptUrl,
  };
}

function httpsUrl(value, policy, path, options) {
  options = options || {};
  var raw = nullableString(value, path);
  if (raw === null) return null;
  var url;
  try { url = new URL(raw); } catch (_) { throw new Error(path + " must be an absolute HTTPS URL"); }
  if (url.protocol !== "https:") throw new Error(path + " must use HTTPS");
  if (url.username || url.password) throw new Error(path + " must not contain credentials");
  if (url.hash) throw new Error(path + " must not contain a fragment");
  if (!policy.allowedOrigins.includes(url.origin)) throw new Error(path + " origin is not deployment-approved");
  if (options.canonical) {
    if (url.origin !== policy.canonicalOrigin) throw new Error(path + " must match deployment.canonicalOrigin");
    if (url.search && !policy.allowCanonicalQuery) throw new Error(path + " query is not permitted");
  }
  return url.href;
}

function destination(value, policy, path, options) {
  options = options || {};
  if (value === null) return null;
  var raw = string(value, path);
  if (options.anchor && raw === "#seo-services") return raw;
  if (options.tel && raw.startsWith("tel:")) {
    if (!TEL.test(raw)) throw new Error(path + " must be an international tel:+number destination");
    return raw;
  }
  return httpsUrl(raw, policy, path);
}

function normalizeCta(raw, action, policy, tags, path, options) {
  if (raw === null) return null;
  raw = object(raw, path);
  var label = merge(own(raw, "label", path), tags, path + ".label");
  var target = own(raw, "destination", path);
  var resolved = target === null ? null : destination(merge(target, tags, path + ".destination"), policy, path + ".destination", options);
  return { action: action, label: label, destination: resolved, available: Boolean(resolved) };
}

function normalizeAuthored(payload, options) {
  options = options || {};
  payload = object(payload, "payload");
  var expected = options.classification;
  if (own(payload, "classification", "payload") !== expected) throw new Error("payload.classification must be " + expected);
  var policy = normalizePolicy(own(payload, "deployment", "payload"), options.allowTestHosts === true);
  var content = object(own(payload, "content", "payload"), "content");
  var brand = object(own(content, "brand", "content"), "content.brand");
  var vertical = object(own(content, "vertical", "content"), "content.vertical");
  var meta = object(own(content, "meta", "content"), "content.meta");
  var locality = string(own(meta, "locality", "content.meta"), "content.meta.locality");
  var localitySlug = slug(own(meta, "localitySlug", "content.meta"), "content.meta.localitySlug");
  var tags = { locality: locality, "locality-slug": localitySlug };
  var hero = object(own(content, "hero", "content"), "content.hero");
  var ctas = object(own(content, "ctas", "content"), "content.ctas");
  var proof = object(own(content, "proof", "content"), "content.proof");
  var pricing = object(own(content, "pricing", "content"), "content.pricing");
  var area = object(own(content, "area", "content"), "content.area");
  var final = object(own(content, "final", "content"), "content.final");
  var footer = object(own(content, "footer", "content"), "content.footer");
  var canonical = httpsUrl(merge(own(meta, "canonical", "content.meta"), tags, "content.meta.canonical"), policy, "content.meta.canonical", { canonical: true });
  var media = own(hero, "media", "content.hero");
  var normalizedMedia = null;
  if (media !== null) {
    media = object(media, "content.hero.media");
    normalizedMedia = {
      url: httpsUrl(merge(own(media, "url", "content.hero.media"), tags, "content.hero.media.url"), policy, "content.hero.media.url"),
      alt: merge(own(media, "alt", "content.hero.media"), tags, "content.hero.media.alt"),
    };
  }

  var primaryAction = own(ctas, "primaryAction", "content.ctas");
  if (primaryAction !== "seo.cta.book" && primaryAction !== "seo.cta.quote") throw new Error("content.ctas.primaryAction must be seo.cta.book or seo.cta.quote");
  var primaryCta = normalizeCta(own(ctas, "primary", "content.ctas"), primaryAction, policy, tags, "content.ctas.primary");
  var secondary = own(ctas, "secondary", "content.ctas");
  var secondaryCta = secondary === null ? null : normalizeCta(secondary, own(ctas, "secondaryAction", "content.ctas"), policy, tags, "content.ctas.secondary", { anchor: own(ctas, "secondaryAction", "content.ctas") === "seo.cta.services", tel: own(ctas, "secondaryAction", "content.ctas") === "seo.cta.call" });
  if (secondaryCta && !["seo.cta.services", "seo.cta.call"].includes(secondaryCta.action)) throw new Error("content.ctas.secondaryAction must be seo.cta.services or seo.cta.call");
  var callCta = normalizeCta(own(ctas, "call", "content.ctas"), "seo.cta.call", policy, tags, "content.ctas.call", { tel: true });

  var services = array(own(content, "services", "content"), "content.services", 1).map(function (service, index) {
    var path = "content.services[" + index + "]";
    service = object(service, path);
    return {
      id: slug(own(service, "id", path), path + ".id"),
      name: merge(own(service, "name", path), tags, path + ".name"),
      benefit: merge(own(service, "benefit", path), tags, path + ".benefit"),
      priceFrom: optionalMerge(own(service, "priceFrom", path), tags, path + ".priceFrom"),
      destination: own(service, "destination", path) === null ? null : destination(merge(own(service, "destination", path), tags, path + ".destination"), policy, path + ".destination"),
      palette: null,
    };
  });
  if (new Set(services.map(function (service) { return service.id; })).size !== services.length) throw new Error("content.services ids must be unique");

  var faq = array(own(content, "faq", "content"), "content.faq", 1).map(function (item, index) {
    var path = "content.faq[" + index + "]";
    item = object(item, path);
    return { id: slug(own(item, "id", path), path + ".id"), q: merge(own(item, "question", path), tags, path + ".question"), a: merge(own(item, "answer", path), tags, path + ".answer") };
  });
  if (new Set(faq.map(function (item) { return item.id; })).size !== faq.length) throw new Error("content.faq ids must be unique");

  var trust = array(own(content, "trust", "content"), "content.trust", 0).map(function (fact, index) {
    var path = "content.trust[" + index + "]";
    fact = object(fact, path);
    return { key: "trust-" + index, icon: ["\u2605", "\u2696", "\u2714", "\u2b1a", "\u23f1"][index % 5], label: merge(own(fact, "label", path), tags, path + ".label"), value: merge(own(fact, "value", path), tags, path + ".value"), count: optionalMerge(own(fact, "count", path), tags, path + ".count"), slot: null };
  });
  var reviews = array(own(content, "reviews", "content"), "content.reviews", 0).map(function (review, index) {
    var path = "content.reviews[" + index + "]";
    review = object(review, path);
    var rating = Number(own(review, "rating", path));
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error(path + ".rating must be an integer from 1 to 5");
    return { name: merge(own(review, "name", path), tags, path + ".name"), rating: rating, text: merge(own(review, "text", path), tags, path + ".text"), media: false };
  });

  var normalized = {
    mode: options.mode,
    classification: expected,
    deployment: policy,
    brand: {
      name: merge(own(brand, "name", "content.brand"), tags, "content.brand.name"),
      url: own(brand, "url", "content.brand") === null ? null : httpsUrl(merge(own(brand, "url", "content.brand"), tags, "content.brand.url"), policy, "content.brand.url"),
    },
    vertical: { name: merge(own(vertical, "name", "content.vertical"), tags, "content.vertical.name"), slug: slug(own(vertical, "slug", "content.vertical"), "content.vertical.slug") },
    meta: {
      title: merge(own(meta, "title", "content.meta"), tags, "content.meta.title"),
      description: merge(own(meta, "description", "content.meta"), tags, "content.meta.description"),
      h1: merge(own(meta, "h1", "content.meta"), tags, "content.meta.h1"),
      locality: locality,
      serviceArea: merge(own(meta, "serviceArea", "content.meta"), tags, "content.meta.serviceArea"),
      canonicalUrl: canonical,
      canonicalPath: new URL(canonical).pathname + new URL(canonical).search,
      primaryCta: primaryCta,
      secondaryCta: secondaryCta,
      callCta: callCta,
    },
    hero: {
      service: merge(own(hero, "service", "content.hero"), tags, "content.hero.service"),
      note: optionalMerge(own(hero, "note", "content.hero"), tags, "content.hero.note"),
      offer: normalizeOffer(own(hero, "offer", "content.hero"), tags),
      media: normalizedMedia,
    },
    services: services,
    trust: trust,
    how: normalizeItems(array(own(content, "how", "content"), "content.how", 1), tags, "content.how", "title", "description"),
    proof: { title: merge(own(proof, "title", "content.proof"), tags, "content.proof.title"), items: normalizeItems(array(own(proof, "items", "content.proof"), "content.proof.items", 1), tags, "content.proof.items", "title", "description") },
    pricing: { note: optionalMerge(own(pricing, "note", "content.pricing"), tags, "content.pricing.note"), rows: normalizePricingRows(array(own(pricing, "rows", "content.pricing"), "content.pricing.rows", 0), tags) },
    area: { cities: array(own(area, "cities", "content.area"), "content.area.cities", 1).map(function (city, index) { return merge(city, tags, "content.area.cities[" + index + "]"); }), note: optionalMerge(own(area, "note", "content.area"), tags, "content.area.note") },
    reviews: reviews,
    faq: faq,
    final: { heading: merge(own(final, "heading", "content.final"), tags, "content.final.heading"), body: optionalMerge(own(final, "body", "content.final"), tags, "content.final.body") },
    footer: normalizeFooter(footer, policy, tags),
  };
  return Object.freeze(normalized);
}

function normalizeOffer(raw, tags) {
  if (raw === null) return null;
  raw = object(raw, "content.hero.offer");
  return { tag: merge(own(raw, "tag", "content.hero.offer"), tags, "content.hero.offer.tag"), text: merge(own(raw, "text", "content.hero.offer"), tags, "content.hero.offer.text"), until: optionalMerge(own(raw, "until", "content.hero.offer"), tags, "content.hero.offer.until") };
}

function normalizeItems(items, tags, base, titleKey, descriptionKey) {
  return items.map(function (item, index) {
    var path = base + "[" + index + "]";
    item = object(item, path);
    return { title: merge(own(item, titleKey, path), tags, path + "." + titleKey), desc: merge(own(item, descriptionKey, path), tags, path + "." + descriptionKey) };
  });
}

function normalizePricingRows(rows, tags) {
  return rows.map(function (row, index) {
    var path = "content.pricing.rows[" + index + "]";
    row = object(row, path);
    return { name: merge(own(row, "name", path), tags, path + ".name"), from: optionalMerge(own(row, "from", path), tags, path + ".from"), unit: optionalMerge(own(row, "unit", path), tags, path + ".unit"), reason: optionalMerge(own(row, "reason", path), tags, path + ".reason") };
  });
}

function normalizeFooter(footer, policy, tags) {
  var phone = own(footer, "phone", "content.footer");
  if (phone !== null && !PHONE.test(phone)) throw new Error("content.footer.phone must be null or an international +number");
  var email = own(footer, "email", "content.footer");
  if (email !== null && !EMAIL.test(email)) throw new Error("content.footer.email must be null or a valid email address");
  return {
    phone: phone === null ? null : phone,
    email: email === null ? null : email,
    hours: array(own(footer, "hours", "content.footer"), "content.footer.hours", 0).map(function (row, index) { var path = "content.footer.hours[" + index + "]"; row = object(row, path); return { days: merge(own(row, "days", path), tags, path + ".days"), hours: merge(own(row, "hours", path), tags, path + ".hours") }; }),
    legal: array(own(footer, "legal", "content.footer"), "content.footer.legal", 0).map(function (link, index) { var path = "content.footer.legal[" + index + "]"; link = object(link, path); return { label: merge(own(link, "label", path), tags, path + ".label"), href: httpsUrl(merge(own(link, "url", path), tags, path + ".url"), policy, path + ".url") }; }),
  };
}

export function normalizeSeoPublic(payload) {
  return normalizeAuthored(payload, { classification: "public-authored", mode: "public", allowTestHosts: false });
}

export function normalizeSeoPublicTest(payload) {
  return normalizeAuthored(payload, { classification: "public-authored-test", mode: "public-test", allowTestHosts: true });
}

export function normalizeSeoReference(rawSeo, rawVertical, rawFooter, verticalName, rawPalette) {
  if (!rawSeo || !rawVertical || !rawFooter) throw new Error("reference SEO fixtures are required");
  var name = verticalName || "Reference service";
  var primaryKind = rawSeo.meta.primaryCta.kind === "quote" ? "seo.cta.quote" : "seo.cta.book";
  var secondaryAction = rawSeo.meta.secondaryCta.kind === "services" ? "seo.cta.services" : "seo.cta.call";
  var payload = {
    classification: "reference-only",
    deployment: { canonicalOrigin: "https://reference-seo.test", allowedOrigins: ["https://reference-seo.test"], allowCanonicalQuery: false, assetBase: "/runtime", publicScriptUrl: "/public/src/seo-public.js" },
    content: {
      brand: { name: "Aircove reference fixture", url: null },
      vertical: { name: name, slug: rawVertical.slug },
      meta: { title: rawSeo.meta.seoTitle, description: rawSeo.meta.metaDescription, h1: rawSeo.meta.h1, locality: rawSeo.meta.locality, localitySlug: rawSeo.meta.canonicalPath.split("/").pop() === "{locality-slug}" ? rawSeo.meta.locality.split(",")[0].toLowerCase().replace(/[^a-z0-9]+/g, "-") : "reference", serviceArea: rawSeo.meta.serviceArea, canonical: "https://reference-seo.test" + rawSeo.meta.canonicalPath },
      hero: { service: rawSeo.hero.service, note: "No account needed. Price shown before you confirm.", offer: rawSeo.hero.offer, media: null },
      services: rawVertical.svc.slice(0, 6).map(function (service) { return { id: service.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), name: service.name, benefit: service.tagline, priceFrom: service.price, destination: null }; }),
      trust: [rawSeo.trust.rating, rawSeo.trust.licence, rawSeo.trust.insurance, rawSeo.trust.guarantee, rawSeo.trust.response].filter(function (fact) { return fact && fact.value; }).map(function (fact) { return { label: fact.label || "Rating", value: fact.value, count: fact.count || null }; }),
      how: rawSeo.how.map(function (item) { return { title: item.title, description: item.desc }; }),
      proof: { title: rawSeo.proof.title, items: rawSeo.proof.items.map(function (item) { return { title: item.title, description: item.desc }; }) },
      pricing: { note: rawSeo.pricing.note, rows: rawSeo.pricing.rows.map(function (row) { return { name: row.name, from: row.from || null, unit: row.unit || null, reason: row.reason || null }; }) },
      area: { cities: rawSeo.area.cities, note: rawSeo.area.note || null },
      reviews: rawSeo.reviews.map(function (review) { return { name: review.name, rating: review.rating, text: review.text }; }),
      faq: rawSeo.faq.map(function (item, index) { return { id: "faq-" + String(index + 1), question: item.q, answer: item.a }; }),
      ctas: { primaryAction: primaryKind, primary: { label: rawSeo.meta.primaryCta.label, destination: null }, secondaryAction: secondaryAction, secondary: { label: rawSeo.meta.secondaryCta.label, destination: secondaryAction === "seo.cta.services" ? "#seo-services" : null }, call: { label: "Call us", destination: null } },
      final: { heading: "Ready when you are in {locality}", body: "Price up front, photo report after \u2014 every visit in your portal." },
      footer: { phone: null, email: null, hours: rawFooter.hours.map(function (row) { return { days: row.d, hours: row.h }; }), legal: [] },
    },
  };
  var normalized = normalizeAuthored(payload, { classification: "reference-only", mode: "reference", allowTestHosts: true });
  var palette = array(rawPalette, "reference.palette", 4).map(function (pair, index) {
    pair = array(pair, "reference.palette[" + index + "]", 2);
    return [string(pair[0], "reference.palette[" + index + "][0]"), string(pair[1], "reference.palette[" + index + "][1]")];
  });
  var trustSource = rawSeo.trust;
  return Object.freeze(Object.assign({}, normalized, {
    brand: Object.freeze({ name: "Aircove", url: null }),
    meta: Object.freeze(Object.assign({}, normalized.meta, { canonicalPath: string(rawSeo.meta.canonicalPath, "reference.meta.canonicalPath") })),
    hero: Object.freeze(Object.assign({}, normalized.hero, { note: "No account needed \u00b7 price shown before you confirm" })),
    trust: Object.freeze([
      referenceTrustFact("\u2605", "Rating", trustSource.rating, "rating", "rating"),
      referenceTrustFact("\u2696", trustSource.licence.label, trustSource.licence, "licence \u2116", "licence"),
      referenceTrustFact("\u2714", trustSource.insurance.label, trustSource.insurance, "policy", "insurance"),
      referenceTrustFact("\u2b1a", trustSource.guarantee.label, trustSource.guarantee, null, "guarantee"),
      referenceTrustFact("\u23f1", trustSource.response.label, trustSource.response, null, "response"),
    ]),
    services: Object.freeze(normalized.services.map(function (service, index) { return Object.freeze(Object.assign({}, service, { palette: palette[index % 4] })); })),
    reviews: Object.freeze(normalized.reviews.map(function (review, index) { return Object.freeze(Object.assign({}, review, { media: rawSeo.reviews[index].media === true })); })),
    footer: Object.freeze(Object.assign({}, normalized.footer, {
      legal: rawFooter.legal.map(function (link, index) { return { label: string(link.label, "reference.footer.legal[" + index + "].label"), href: string(link.href, "reference.footer.legal[" + index + "].href") }; }),
    })),
  }));
}

function referenceTrustFact(icon, label, source, slot, key) {
  source = object(source, "reference.trust." + key);
  return {
    icon: icon,
    label: string(label, "reference.trust." + key + ".label"),
    value: source.value === null ? null : string(source.value, "reference.trust." + key + ".value"),
    count: source.count == null ? null : string(source.count, "reference.trust." + key + ".count"),
    slot: slot,
    key: key,
  };
}

export function faqJsonLd(model) {
  return { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: model.faq.map(function (item) { return { "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } }; }) };
}
