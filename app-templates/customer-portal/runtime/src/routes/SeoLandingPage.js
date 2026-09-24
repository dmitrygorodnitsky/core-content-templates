import { h } from "../dom.js";
import { state } from "../state.js";
import { loadSeoModel } from "../modules/seo.js";
import { renderSeoSections } from "../components/seo/SeoSections.js";

export function SeoLanding() {
  var model = loadSeoModel(state.theme);
  var page = h("section", {
    "class": "page seo-page",
    "data-route": "seo.landing",
    "data-visual-id": "seo-landing",
    "data-state": state.view === "loading" || state.view === "empty" ? state.view : "ready",
  });
  page.innerHTML = renderSeoSections(model, {
    dataState: page.getAttribute("data-state"),
    faqOpenId: state.seoFaqOpenId,
    selectedServiceId: state.seoSelectedServiceId,
    ctaStates: state.seoCtaStates,
    parity: true,
  });
  return page;
}
