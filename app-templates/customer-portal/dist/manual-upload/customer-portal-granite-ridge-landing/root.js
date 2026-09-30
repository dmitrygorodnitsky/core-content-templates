/* Granite Ridge public landing runtime. CMS-authored content only: no backend call, no customer data. */
(function () {
  "use strict";
  function ready(fn) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true }); else fn(); }
  function safeUrl(value) {
    var raw = String(value || "").trim();
    if (!raw) return "";
    try { var url = new URL(raw); return url.protocol === "https:" ? url.href : ""; } catch (_) { return ""; }
  }
  function destinations(root) {
    var portal = safeUrl(root.dataset.portalUrl);
    return {
      "portal.signin": portal,
      "portal.request": safeUrl(root.dataset.portalRequestUrl) || portal,
      "portal.services": safeUrl(root.dataset.portalServicesUrl) || portal
    };
  }
  function markUnavailable(root, targets) {
    root.querySelectorAll("[data-action]").forEach(function (node) {
      var action = node.dataset.action;
      if (!Object.prototype.hasOwnProperty.call(targets, action)) return;
      if (targets[action]) return;
      node.dataset.portalDestination = "unset";
      node.disabled = true;
    });
  }
  function revealMedia(root) {
    root.querySelectorAll("[data-media-url]").forEach(function (slot) {
      var url = String(slot.dataset.mediaUrl || "").trim();
      if (!url) return;
      var label = slot.querySelector(".seo-media-slot__label");
      var image = document.createElement("img");
      image.className = "seo-media__img";
      image.alt = slot.dataset.mediaAlt || "";
      image.loading = "lazy";
      image.style.objectPosition = slot.dataset.mediaFocal || "50% 50%";
      image.addEventListener("error", function () {
        if (image.parentNode) image.parentNode.removeChild(image);
        slot.dataset.state = "no-data";
        if (label && !label.parentNode) slot.appendChild(label);
      });
      image.src = url;
      if (label) label.remove();
      slot.dataset.state = "ready";
      slot.appendChild(image);
    });
  }
  function anchor(name) {
    if (name === "nav.services") return "#seo-services";
    if (name === "nav.pricing") return "#seo-pricing";
    return "";
  }
  function toggleFaq(action) {
    var item = action.closest(".seo-faq__item");
    var open = item.classList.toggle("is-open");
    action.setAttribute("aria-expanded", open ? "true" : "false");
    var chev = action.querySelector(".seo-faq__chev");
    if (chev) chev.textContent = open ? "−" : "+";
    var answer = item.querySelector(".seo-faq__a");
    if (!open) { if (answer) answer.remove(); return; }
    if (answer) return;
    answer = document.createElement("div");
    answer.className = "seo-faq__a";
    answer.setAttribute("itemscope", "");
    answer.setAttribute("itemprop", "acceptedAnswer");
    answer.setAttribute("itemtype", "https://schema.org/Answer");
    var copy = document.createElement("p");
    copy.setAttribute("itemprop", "text");
    copy.textContent = action.dataset.faqAnswer || "";
    answer.appendChild(copy);
    item.appendChild(answer);
  }
  function wire(root, targets) {
    root.addEventListener("click", function (event) {
      var action = event.target.closest("[data-action]");
      if (!action || !root.contains(action)) return;
      var name = action.dataset.action;
      if (name === "ui.toggleMode") {
        event.preventDefault();
        document.documentElement.dataset.mode = document.documentElement.dataset.mode === "dark" ? "light" : "dark";
        root.dataset.mode = document.documentElement.dataset.mode;
        return;
      }
      if (name === "seo.faq.toggle") { event.preventDefault(); toggleFaq(action); return; }
      var target = anchor(name);
      if (target) {
        var section = document.querySelector(target);
        if (section) { event.preventDefault(); section.scrollIntoView({ behavior: "smooth", block: "start" }); }
        return;
      }
      if (Object.prototype.hasOwnProperty.call(targets, name)) {
        event.preventDefault();
        if (targets[name]) window.location.assign(targets[name]);
      }
    });
    var apply = function () {
      var width = root.getBoundingClientRect().width;
      root.classList.toggle("vw-mobile", width <= 560);
      root.classList.toggle("vw-tablet", width > 560 && width <= 900);
      root.classList.toggle("vw-compact", width <= 1040);
    };
    apply();
    if (window.ResizeObserver) new ResizeObserver(apply).observe(root);
  }
  ready(function () {
    var root = document.querySelector("#granite-ridge-landing");
    if (!root) return;
    document.documentElement.dataset.theme = "snow";
    document.documentElement.dataset.mode = root.dataset.mode || "light";
    var targets = destinations(root);
    markUnavailable(root, targets);
    revealMedia(root);
    wire(root, targets);
  });
})();
