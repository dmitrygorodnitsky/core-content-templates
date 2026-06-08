// lab-ui block · pricing.plans-flex
// Local billing toggle + cross-block sync via a document-level
// CustomEvent. Any block listening for `pricing:billing` updates
// its own [data-pricing-period] attr without coupling to this block.

(() => {
  const EVENT = "pricing:billing";

  const ready = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else fn();
  };

  const normalize = (mode) => (mode === "annual" ? "annual" : "monthly");

  const apply = (section, mode) => {
    const next = normalize(mode);
    section.dataset.billing = next;
    section.dataset.pricingPeriod = next;
    section.querySelectorAll("[data-billing-option]").forEach((button) => {
      const active = button.dataset.billingOption === next;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
    });
  };

  const broadcast = (mode, source) => {
    document.dispatchEvent(new CustomEvent(EVENT, {
      detail: { period: normalize(mode), source },
    }));
  };

  const init = (section) => {
    if (section.dataset.pfInit === "1") return;
    section.dataset.pfInit = "1";

    apply(section, section.dataset.billing);

    section.querySelectorAll("[data-billing-option]").forEach((button) => {
      button.addEventListener("click", () => {
        const next = normalize(button.dataset.billingOption);
        apply(section, next);
        broadcast(next, section);
      });
    });

    document.addEventListener(EVENT, (event) => {
      if (!event.detail || event.detail.source === section) return;
      apply(section, event.detail.period);
    });
  };

  ready(() => {
    document.querySelectorAll('[data-block="pricing.plans-flex"]').forEach(init);
  });
})();
