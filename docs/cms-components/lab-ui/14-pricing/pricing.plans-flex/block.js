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

  const setText = (root, selector, value) => {
    const node = root.querySelector(selector);
    if (node) node.textContent = value || "";
  };

  const setHref = (root, selector, value) => {
    const node = root.querySelector(selector);
    if (node) node.setAttribute("href", value || "#");
  };

  const fallbackLabel = (section, key, fallback) => (
    section.dataset[key] || fallback || ""
  );

  const dynamicCtaLabel = (section, plan) => {
    const key = plan.customPrice ? "pricingContactLabel" : "pricingBuyLabel";
    const value = section.dataset[key];
    if (value) return value;
    const slot = section.querySelector(`[data-plan-slot="${String(plan.index + 1).padStart(2, "0")}"]`);
    const existing = slot && slot.querySelector(".pf-cta");
    if (existing && existing.textContent.trim()) return existing.textContent.trim();
    return plan.customPrice ? "Contact us" : "Buy now";
  };

  const periodText = (plan) => {
    if (plan.customPrice) return "";
    return plan.intervalLabel || "";
  };

  const renderDynamicPlans = (section, pricing) => {
    const plans = pricing.plans;
    const grid = section.querySelector(".pf-grid");
    if (!grid) return;

    const templates = Array.from(grid.querySelectorAll("[data-plan-slot]"))
      .map((card) => card.cloneNode(true));
    if (!templates.length) return;

    const featuresByPlan = new Map(plans.map((plan) => [
      plan.code,
      window.LabPricing.featureList(plan, pricing.groups, 5),
    ]));

    grid.innerHTML = "";

    plans.forEach((plan, index) => {
      const card = (templates[index] || templates[0]).cloneNode(true);
      card.dataset.planSlot = String(index + 1).padStart(2, "0");
      card.dataset.planVisible = "show";
      card.dataset.planCode = plan.code;
      setText(card, ".pf-name", plan.name);
      setText(card, ".pf-subtitle", plan.description);
      setText(card, ".pf-currency", plan.currency);
      setText(card, "[data-price-monthly]", plan.customPrice
        ? fallbackLabel(section, "pricingContactLabel", dynamicCtaLabel(section, plan))
        : plan.amountText);
      setText(card, "[data-price-annual]", plan.customPrice
        ? fallbackLabel(section, "pricingContactLabel", dynamicCtaLabel(section, plan))
        : plan.amountText);
      setText(card, ".pf-period", periodText(plan));
      setText(card, ".pf-card-save", "");
      setText(card, "[data-billed-monthly]", plan.intervalLabel);
      setText(card, "[data-billed-annual]", plan.intervalLabel);

      const ctaLabel = dynamicCtaLabel(section, plan);
      setText(card, ".pf-cta", ctaLabel);
      setHref(card, ".pf-cta", pricing.config.purchaseUrl);

      const price = card.querySelector(".pf-price");
      if (price) price.setAttribute("aria-label", `${plan.name} ${plan.customPrice ? ctaLabel : plan.amountText}`.trim());

      const list = card.querySelector(".pf-features");
      if (list) {
        list.setAttribute("aria-label", `${plan.name} features`);
        list.innerHTML = "";
        for (const feature of featuresByPlan.get(plan.code) || []) {
          const item = document.createElement("li");
          item.textContent = feature;
          list.appendChild(item);
        }
      }

      setText(card, ".pf-disclaimer", "");
      grid.appendChild(card);
    });

    if (grid) grid.dataset.planCount = String(plans.length);
    section.dataset.pricingState = plans.length ? "dynamic" : "fallback";
  };

  const loadDynamic = (section) => {
    if (!window.LabPricing) {
      section.dataset.pricingState = "fallback";
      return;
    }
    const config = window.LabPricing.parseConfig(section);
    if (!config.enabled) {
      section.dataset.pricingState = "fallback";
      return;
    }

    section.dataset.pricingState = "loading";
    window.LabPricing.load(section)
      .then((pricing) => {
        if (!pricing.ok || !pricing.plans.length) {
          section.dataset.pricingState = "fallback";
          return;
        }
        renderDynamicPlans(section, pricing);
      })
      .catch((error) => {
        section.dataset.pricingState = "fallback";
        section.dataset.pricingError = error.message;
      });
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

    loadDynamic(section);
  };

  ready(() => {
    document.querySelectorAll('[data-block="pricing.plans-flex"]').forEach(init);
  });
})();
