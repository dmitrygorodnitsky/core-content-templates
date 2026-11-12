import { h } from "../../dom.js";
import { liveProvider, state } from "../../state.js";
import { visitImageUrl } from "../../normalizers/visits.js";

var WORDMARK_ASPECT = 2.5;
var LOGO_ATTEMPTS = 3;
var providerLogos = new Map();

export function brandIdentity() {
  var provider = liveProvider();
  return {
    name: (provider && provider.name) || state.config.brandName || "Aircove",
    logo: brandLogo((provider && provider.logoImageId) || state.config.brandLogoImageId || ""),
  };
}

export function BrandParts(identity) {
  return [
    identity.logo ? identity.logo.node : h("div", { "class": "brand-logo" }),
    h("span", { "class": "brand-name", "data-bind": "brand.name" }, identity.name),
  ];
}

function brandLogo(imageId) {
  var source = imageId ? visitImageUrl(state.config.coreApiBase, imageId) : "";
  if (!source) return null;
  var logo = providerLogos.get(source);
  if (!logo) {
    logo = { node: null, wordmark: false, attempts: 0 };
    providerLogos.set(source, logo);
  }
  if (!logo.node && logo.attempts < LOGO_ATTEMPTS) {
    logo.attempts += 1;
    logo.node = logoImage(source, logo);
  }
  return logo.node ? logo : null;
}

function logoImage(source, logo) {
  var image = h("img", { "class": "brand-logo brand-logo--image", src: source, alt: "", loading: "lazy", decoding: "async", "data-module": "brand-logo", "data-source": "organization" });
  image.addEventListener("load", function () {
    logo.wordmark = image.naturalWidth > image.naturalHeight * WORDMARK_ASPECT;
    if (logo.wordmark && image.parentNode) image.parentNode.setAttribute("data-brand", "wordmark");
  });
  image.addEventListener("error", function () {
    logo.node = null;
    logo.wordmark = false;
    var brand = image.parentNode;
    if (!brand) return;
    brand.removeAttribute("data-brand");
    brand.replaceChild(h("div", { "class": "brand-logo" }), image);
  });
  return image;
}
