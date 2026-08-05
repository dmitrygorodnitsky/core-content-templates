// lab-ui block · pricing.credits-meter
// Mirrors cross-block billing changes and can opt into the shared
// LabPricing runtime for routing-token price tiers.

(() => {
  const EVENT = "pricing:billing";
  const TOKEN_ATTRIBUTE = "ROUTING_TOKENS";
  const LOREM = "Lorem ipsum";

  const ready = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else fn();
  };

  const apply = (section, mode) => {
    section.dataset.pricingPeriod = mode === "annual" ? "annual" : "monthly";
  };

  const setText = (root, selector, value) => {
    const node = root.querySelector(selector);
    if (node) node.textContent = value || "";
  };

  const setHref = (root, selector, value) => {
    const node = root.querySelector(selector);
    if (node) node.setAttribute("href", value || "#");
  };

  const text = (value) => (
    window.LabPricing ? window.LabPricing.safeText(value) : String(value == null ? "" : value).trim()
  );

  const tokenAmount = (plan) => {
    const attributes = plan && plan.row && plan.row.product && plan.row.product.attributes;
    if (!attributes) return "";

    for (const values of Object.values(attributes)) {
      const raw = values && values[TOKEN_ATTRIBUTE];
      if (raw && raw.value != null && raw.value !== "") return text(raw.value);
    }
    return "";
  };

  const formatCurrency = (plan, locale) => {
    if (!plan || plan.customPrice) return "";
    const amount = Number(plan.amount);
    if (!Number.isFinite(amount)) return plan.amountText || "";

    const currency = plan.currency || "CAD";
    try {
      return new Intl.NumberFormat(locale || undefined, {
        style: "currency",
        currency,
        currencyDisplay: "narrowSymbol",
        minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
      }).format(amount) + (currency ? " " + currency : "");
    } catch (error) {
      return ((plan.amountText || amount) + " " + currency).trim();
    }
  };

  const dynamicPriceLabel = (section, plan, locale) => {
    if (plan.customPrice) {
      return section.dataset.pricingContactLabel || "";
    }
    return formatCurrency(plan, locale);
  };

  const fallbackText = (root, selector) => {
    const node = root.querySelector(selector);
    return node ? node.textContent.trim() : "";
  };

  const planDetails = (plan, groups) => {
    const details = [];
    for (const group of groups || []) {
      for (const attr of group.attributes || []) {
        const value = attr.values && attr.values[plan.index];
        if (!value || value.state === "no" || value.state === "empty") continue;
        details.push({
          code: attr.code,
          label: attr.label,
          state: value.state,
          text: value.text || "",
        });
      }
    }
    return details;
  };

  const renderPackDetails = (pack, details) => {
    const existing = pack.querySelector(".cm-pack-details");
    if (existing) existing.remove();
    if (!details.length) return;

    const list = document.createElement("dl");
    list.className = "cm-pack-details";

    for (const detail of details) {
      const item = document.createElement("div");
      item.className = "cm-pack-detail";
      item.dataset.attributeCode = detail.code;
      item.dataset.state = detail.state;

      const label = document.createElement("dt");
      label.textContent = detail.label;
      item.appendChild(label);

      if (detail.text) {
        const value = document.createElement("dd");
        value.dataset.state = detail.state;
        value.textContent = detail.text;
        item.appendChild(value);
      }

      list.appendChild(item);
    }

    pack.appendChild(list);
  };

  const renderDynamicPacks = (section, pricing) => {
    const plans = pricing.plans;
    const packList = section.querySelector(".cm-packs");
    if (!packList) return;

    const templates = Array.from(packList.querySelectorAll(".cm-pack:not(.cm-pack--skeleton)"))
      .map((pack) => pack.cloneNode(true));
    if (!templates.length) return;

    packList.innerHTML = "";

    plans.forEach((plan, index) => {
      const pack = (templates[index] || templates[0]).cloneNode(true);
      const tokens = tokenAmount(plan);
      pack.dataset.packVisible = "show";
      pack.dataset.planCode = plan.code;
      setText(pack, ".cm-pack-badge", "");
      setText(pack, ".cm-pack-name", plan.name);
      setText(pack, ".cm-pack-amount", tokens || plan.amountText || "");

      const unit = document.createElement("span");
      unit.className = "cm-pack-unit";
      unit.textContent = tokens
        ? (section.dataset.pricingTokenUnitLabel || fallbackText(pack, ".cm-pack-unit"))
        : "";
      const amount = pack.querySelector(".cm-pack-amount");
      if (amount && unit.textContent) amount.appendChild(unit);

      setText(pack, ".cm-pack-price", dynamicPriceLabel(section, plan, pricing.config.locale));
      setText(pack, ".cm-pack-rate", pricing.config.lorem
        ? LOREM
        : (plan.customPrice
            ? (section.dataset.pricingTokenCustomRateLabel || fallbackText(pack, ".cm-pack-rate"))
            : (section.dataset.pricingTokenRateLabel || fallbackText(pack, ".cm-pack-rate"))));
      renderPackDetails(pack, planDetails(plan, pricing.groups));
      packList.appendChild(pack);
    });

    setHref(section, ".cm-packs-cta", pricing.config.purchaseUrl);
    const cta = section.querySelector(".cm-packs-cta");
    if (cta && section.dataset.pricingBuyLabel) cta.textContent = section.dataset.pricingBuyLabel;

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
        renderDynamicPacks(section, pricing);
      })
      .catch((error) => {
        section.dataset.pricingState = "fallback";
        section.dataset.pricingError = error.message;
      });
  };

  const init = (section) => {
    if (section.dataset.cmInit === "1") return;
    section.dataset.cmInit = "1";
    apply(section, section.dataset.pricingPeriod);

    document.addEventListener(EVENT, (event) => {
      if (!event.detail) return;
      apply(section, event.detail.period);
    });

    loadDynamic(section);
  };

  ready(() => {
    document.querySelectorAll('[data-block="pricing.credits-meter"]').forEach(init);
  });
})();
