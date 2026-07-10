import { F } from "../../data/fixtures.js";
import { SEO, SEO_FOOTER } from "../../data/seo-fixtures.js";
import { normalizeSeoReference } from "../normalizers/seo.js";

export const SEO_VERTICALS = Object.freeze(Object.keys(SEO));

export function loadSeoModel(verticalName, authored) {
  var name = SEO[verticalName] ? verticalName : "HVAC";
  if (authored) throw new Error("The parity SEO loader accepts reference fixtures only");
  return normalizeSeoReference(SEO[name], F.themes[name], SEO_FOOTER, name);
}

export const seoModule = {
  id: "seo-reference-parity",
  routes: ["seo.landing"],
  states: ["ready", "loading", "empty"],
  actions: ["seo.cta.book", "seo.cta.quote", "seo.cta.call", "seo.cta.services", "seo.service.select", "seo.faq.toggle"],
  load: loadSeoModel,
};
