// lab-ui block · pricing.credits-meter
// Listens for the cross-block `pricing:billing` CustomEvent and mirrors
// the period on the section root. The block has no own toggle; it only
// reflects what plans-flex or other pricing.* blocks broadcast.

(() => {
  const EVENT = "pricing:billing";

  const ready = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else fn();
  };

  const apply = (section, mode) => {
    section.dataset.pricingPeriod = mode === "annual" ? "annual" : "monthly";
  };

  const init = (section) => {
    if (section.dataset.cmInit === "1") return;
    section.dataset.cmInit = "1";
    apply(section, section.dataset.pricingPeriod);

    document.addEventListener(EVENT, (event) => {
      if (!event.detail) return;
      apply(section, event.detail.period);
    });
  };

  ready(() => {
    document.querySelectorAll('[data-block="pricing.credits-meter"]').forEach(init);
  });
})();
