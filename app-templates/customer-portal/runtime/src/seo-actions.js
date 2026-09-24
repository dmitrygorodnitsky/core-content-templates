import { state } from "./state.js";
import { loadSeoModel } from "./modules/seo.js";

function currentModel() { return loadSeoModel(state.theme); }

export function selectSeoService(id, render) {
  if (!currentModel().services.some(function (service) { return service.id === id; })) throw new Error("SEO service not found");
  state.seoSelectedServiceId = id;
  render();
}

export function toggleSeoFaq(id, render) {
  if (!currentModel().faq.some(function (faq) { return faq.id === id; })) throw new Error("SEO FAQ not found");
  state.seoFaqOpenId = state.seoFaqOpenId === id ? null : id;
  render();
}
