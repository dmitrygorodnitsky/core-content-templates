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
    section.querySelectorAll("[data-period-monthly], [data-period-annual]").forEach((card) => {
      setText(card, ".pf-period", next === "annual" ? card.dataset.periodAnnual : card.dataset.periodMonthly);
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
    const slotCode = String(plan.index + 1).padStart(2, "0");
    const slot = section.querySelector('[data-plan-slot="' + slotCode + '"]');
    const existing = slot && slot.querySelector(".pf-cta");
    if (existing && existing.textContent.trim()) return existing.textContent.trim();
    return "";
  };

  const periodText = (plan) => {
    if (plan.customPrice) return "";
    return plan.intervalLabel || "";
  };

  const planPrice = (plan, mode) => {
    const prices = plan.prices || {};
    return prices[mode] || prices.monthly || plan;
  };

  const amountText = (section, plan, mode) => {
    const price = planPrice(plan, mode);
    if (price.customPrice || plan.customPrice) {
      return fallbackLabel(section, "pricingContactLabel", dynamicCtaLabel(section, plan));
    }
    return price.amountText || "";
  };

  const intervalText = (plan, mode) => {
    const price = planPrice(plan, mode);
    if (price.customPrice || plan.customPrice) return "";
    return price.intervalLabel || "";
  };

  const ctaStyle = (plan) => (
    plan.cardState === "featured" ? "filled" : "primary"
  );

  const renderDynamicPlans = (section, pricing) => {
    const plans = pricing.plans;
    const grid = section.querySelector(".pf-grid");
    if (!grid) return;

    const templates = Array.from(grid.querySelectorAll("[data-plan-slot]"))
      .map((card) => card.cloneNode(true));
    if (!templates.length) return;

    const featuresByPlan = new Map(plans.map((plan) => [
      plan.code,
      Array.isArray(plan.cardFeatures) ? plan.cardFeatures : [],
    ]));

    grid.innerHTML = "";

    plans.forEach((plan, index) => {
      const card = (templates[index] || templates[0]).cloneNode(true);
      card.dataset.planSlot = String(index + 1).padStart(2, "0");
      card.dataset.planVisible = "show";
      card.dataset.planCode = plan.code;
      card.classList.remove("pf-card--featured", "pf-card--muted");
      if (plan.cardState && plan.cardState !== "standard") {
        card.classList.add("pf-card--" + plan.cardState);
      }
      setText(card, ".pf-kicker", plan.kicker);
      setText(card, ".pf-badge", plan.badge);
      setText(card, ".pf-name", plan.name);
      setText(card, ".pf-subtitle", plan.description);
      setText(card, ".pf-currency", plan.currency);
      setText(card, "[data-price-monthly]", amountText(section, plan, "monthly"));
      setText(card, "[data-price-annual]", amountText(section, plan, "annual"));
      card.dataset.periodMonthly = intervalText(plan, "monthly");
      card.dataset.periodAnnual = intervalText(plan, "annual");
      setText(card, ".pf-period", periodText(plan));
      setText(card, ".pf-card-save", "");
      setText(card, "[data-billed-monthly]", intervalText(plan, "monthly"));
      setText(card, "[data-billed-annual]", intervalText(plan, "annual"));

      const ctaLabel = dynamicCtaLabel(section, plan);
      const cta = card.querySelector(".pf-cta");
      if (cta) {
        cta.classList.remove("pf-cta--primary", "pf-cta--filled", "pf-cta--ghost");
        cta.classList.add("pf-cta--" + ctaStyle(plan));
      }
      setText(card, ".pf-cta", ctaLabel);
      setHref(card, ".pf-cta", pricing.config.purchaseUrl);

      const price = card.querySelector(".pf-price");
      if (price) {
        price.setAttribute("aria-label", (plan.name + " " + (plan.customPrice ? ctaLabel : plan.amountText)).trim());
      }

      const list = card.querySelector(".pf-features");
      if (list) {
        const listLabel = section.dataset.pricingFeatureListLabel || list.getAttribute("aria-label") || "";
        if (listLabel) list.setAttribute("aria-label", listLabel);
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
    apply(section, section.dataset.billing);
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
