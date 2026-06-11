// lab-ui block · pricing.matrix-collapsible
// Listens for the cross-block `pricing:billing` CustomEvent and
// mirrors the period on the section root so any downstream rule
// like `.mx-matrix[data-pricing-period="annual"] [data-price-monthly]`
// can hide / show period-specific values without coupling to other blocks.

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

  // Icon-only cells (yes/no/partial with an empty value) carry their
  // meaning in CSS pseudo-elements; give them an accessible name from
  // the localized state labels on the section root.
  const labelStates = (section) => {
    const labels = {
      yes: section.dataset.stateLabelYes,
      no: section.dataset.stateLabelNo,
      partial: section.dataset.stateLabelPartial,
    };
    section.querySelectorAll("[data-state]").forEach((el) => {
      const label = labels[el.dataset.state];
      if (!label) return;
      const value = el.matches("dd") ? el : el.querySelector(".mx-value");
      if (value && !value.textContent.trim()) el.setAttribute("aria-label", label);
    });
  };

  const init = (section) => {
    if (section.dataset.mxInit === "1") return;
    section.dataset.mxInit = "1";
    apply(section, section.dataset.pricingPeriod);
    labelStates(section);

    document.addEventListener(EVENT, (event) => {
      if (!event.detail) return;
      apply(section, event.detail.period);
    });
  };

  ready(() => {
    document.querySelectorAll('[data-block="pricing.matrix-collapsible"]').forEach(init);
  });
})();
