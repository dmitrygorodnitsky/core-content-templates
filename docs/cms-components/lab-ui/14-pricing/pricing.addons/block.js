// lab-ui block · pricing.addons
// Optional whole-section collapse. When data-collapsed="on", the header
// becomes a teaser band (glyph stack derived from the cards + summary +
// toggle) and the card grid collapses behind it. Works at any card count
// and any viewport. Dynamic mode replaces fallback slots with every product
// returned by the configured Core PIM catalog specs.

(() => {
  let addonsSeq = 0;
  const DEFAULT_SPECS = [
    "SERVICEWAND_SAAS_EXT|RECURRENT|INTERVAL|1 month|",
    "SERVICEWAND_SAAS_ROUTING_TOKENS|PER_UNIT|UNIT_PRICE|3,4,4.5,5|",
  ];

  const ready = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else fn();
  };

  const firstGlyph = (text) => {
    const trimmed = (text || "").trim();
    return trimmed ? trimmed[0].toUpperCase() : "+";
  };

  const textOf = (node, selector) => {
    const target = node && node.querySelector(selector);
    return target ? target.textContent.trim() : "";
  };

  const cards = (section) => Array.from(section.querySelectorAll(".pricing-addon-card"));
  const realCards = (section) => {
    const items = cards(section).filter((card) => !card.classList.contains("pricing-addon-card--skeleton"));
    if (section.dataset.pricingDynamic !== "true") return items;
    if (section.dataset.pricingState !== "dynamic" && section.dataset.pricingState !== "fallback") return [];
    return items;
  };

  const numericPrice = (text) => {
    const match = String(text || "").match(/[-+]?\d[\d,]*(?:\.\d+)?/);
    if (!match) return null;
    return {
      rank: Number(match[0].replace(/,/g, "")),
      text: String(text || "").trim(),
    };
  };

  const lowestPriceText = (items) => {
    return items
      .map((card) => numericPrice(textOf(card, ".pricing-addon-price")))
      .filter(Boolean)
      .sort((a, b) => a.rank - b.rank)[0]?.text || "";
  };

  const updateSummary = (section) => {
    const summary = section.querySelector(".pricing-addons-summary");
    if (!summary) return;

    const items = realCards(section);
    if (!items.length) {
      summary.textContent = "";
      return;
    }

    const categories = new Set(items.map((card) => textOf(card, ".pricing-addon-type")).filter(Boolean));
    const parts = [
      items.length + " " + (section.dataset.summaryAddonsLabel || "add-ons"),
    ];
    if (categories.size) {
      parts.push(categories.size + " " + (section.dataset.summaryCategoriesLabel || "categories"));
    }

    const price = lowestPriceText(items);
    if (price) {
      parts.push((section.dataset.summaryFromLabel || "from") + " " + price);
    }

    summary.textContent = parts.join(" · ");
  };

  const buildGlyphStack = (section, glyphs) => {
    if (!glyphs) return;
    glyphs.textContent = "";
    const items = realCards(section);
    const shown = items.slice(0, 5);
    shown.forEach((card) => {
      const name = card.querySelector(".pricing-addon-name");
      const tile = document.createElement("span");
      tile.className = "pricing-addons-glyph";
      tile.textContent = firstGlyph(name && name.textContent);
      glyphs.appendChild(tile);
    });
    if (items.length > shown.length) {
      const more = document.createElement("span");
      more.className = "pricing-addons-glyph pricing-addons-glyph--more";
      more.textContent = "+" + (items.length - shown.length);
      glyphs.appendChild(more);
    }
  };

  const updateTeaser = (section) => {
    buildGlyphStack(section, section.querySelector(".pricing-addons-glyphs"));
    updateSummary(section);
  };

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };

  const append = (parent, child) => {
    parent.appendChild(child);
    return child;
  };

  const safe = (value) => (
    window.LabPricing ? window.LabPricing.safeText(value) : String(value == null ? "" : value).replace(/\s+/g, " ").trim()
  );

  const parseCatalogSpecs = (section) => {
    const source = safe(section.dataset.pricingCatalogSpecs);
    const specs = (source ? source.split(";") : DEFAULT_SPECS)
      .map((item) => item.trim())
      .filter(Boolean)
      .map((item) => {
        const parts = item.split("|").map((part) => part.trim());
        return {
          productTypeCode: parts[0] || "",
          priceTypeCode: parts[1] || "RECURRENT",
          priceAttributeCode: parts[2] || "INTERVAL",
          priceAttributeValues: parts[3] || "1",
          fixtureUrl: parts[4] || "",
        };
      })
      .filter((spec) => spec.productTypeCode);

    if (specs.length) return specs;
    const fallbackCode = safe(section.dataset.pricingProductTypeCode);
    return fallbackCode ? [{
      productTypeCode: fallbackCode,
      priceTypeCode: safe(section.dataset.pricingPriceTypeCode) || "RECURRENT",
      priceAttributeCode: safe(section.dataset.pricingPriceAttributeCode) || "INTERVAL",
      priceAttributeValues: safe(section.dataset.pricingPriceAttributeValues) || "1",
      fixtureUrl: safe(section.dataset.pricingFixtureUrl),
    }] : [];
  };

  const configSectionFor = (section, spec) => {
    const proxy = document.createElement("section");
    Object.keys(section.dataset).forEach((key) => {
      proxy.dataset[key] = section.dataset[key];
    });
    proxy.dataset.pricingDynamic = "true";
    proxy.dataset.pricingProductTypeCode = spec.productTypeCode;
    proxy.dataset.pricingPriceTypeCode = spec.priceTypeCode;
    proxy.dataset.pricingPriceAttributeCode = spec.priceAttributeCode;
    proxy.dataset.pricingPriceAttributeValues = spec.priceAttributeValues;
    if (spec.fixtureUrl) proxy.dataset.pricingFixtureUrl = spec.fixtureUrl;
    else delete proxy.dataset.pricingFixtureUrl;
    return proxy;
  };

  const formatCurrency = (plan, locale) => {
    if (!plan || plan.customPrice) return "";
    const amount = Number(plan.amount);
    if (!Number.isFinite(amount)) return [plan.amountText, plan.currency].filter(Boolean).join(" ");
    try {
      return new Intl.NumberFormat(locale || undefined, {
        style: "currency",
        currency: plan.currency || "CAD",
        currencyDisplay: "narrowSymbol",
        minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
      }).format(amount) + (plan.currency ? " " + plan.currency : "");
    } catch (error) {
      return [plan.amountText || String(amount), plan.currency].filter(Boolean).join(" ");
    }
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
          text: value.text || (value.state === "yes" ? "" : ""),
        });
      }
    }
    return details;
  };

  const primaryDetail = (details) => details.find((detail) => detail.text) || details[0] || null;

  const priceLabel = (section, plan, locale) => {
    if (!plan || plan.customPrice) return section.dataset.pricingContactLabel || "";
    const parts = [formatCurrency(plan, locale)];
    if (plan.intervalLabel) parts.push(plan.intervalLabel);
    return parts.filter(Boolean).join(" / ");
  };

  const renderDetails = (card, details, primary) => {
    const extra = details.filter((detail) => detail !== primary);
    if (!extra.length) return;

    const list = append(card, el("dl", "pricing-addon-details"));
    extra.forEach((detail) => {
      const item = append(list, el("div", "pricing-addon-detail"));
      item.dataset.attributeCode = detail.code || "";
      item.dataset.state = detail.state || "";
      append(item, el("dt", "", detail.label || ""));
      append(item, el("dd", "", detail.text || ""));
    });
  };

  const renderCard = (section, item) => {
    const plan = item.plan;
    const details = planDetails(plan, item.pricing.groups);
    const primary = primaryDetail(details);
    const state = plan.cardState || "standard";

    const card = el("article", "pricing-addon-card pricing-addon-card--" + state);
    card.dataset.planCode = plan.code || "";
    card.dataset.productTypeCode = item.spec.productTypeCode || "";

    const head = append(card, el("div", "pricing-addon-head"));
    append(head, el("span", "pricing-addon-type", item.category || ""));
    append(head, el("span", "pricing-addon-plan", plan.kicker || plan.badge || ""));
    append(card, el("h3", "pricing-addon-name", plan.name));
    append(card, el("p", "pricing-addon-description", plan.description));

    const meter = append(card, el("div", "pricing-addon-meter"));
    append(meter, el("span", "pricing-addon-quantity", primary ? primary.text : plan.amountText));
    append(meter, el("span", "pricing-addon-unit", primary ? primary.label : ""));

    append(card, el("p", "pricing-addon-price", priceLabel(section, plan, item.pricing.config.locale)));
    renderDetails(card, details, primary);
    return card;
  };

  const categoryFor = (pricing, spec) => {
    const firstGroup = pricing.groups && pricing.groups[0];
    return safe(firstGroup && firstGroup.label) || safe(spec.productTypeCode);
  };

  const renderDynamic = (section, results) => {
    const grid = section.querySelector(".pricing-addons-grid");
    if (!grid) return false;

    const dynamicItems = [];
    results.forEach((pricing) => {
      if (!pricing || !pricing.ok || !pricing.plans.length) return;
      const category = categoryFor(pricing, pricing.spec || {});
      pricing.plans.forEach((plan) => {
        dynamicItems.push({ plan, pricing, spec: pricing.spec || {}, category });
      });
    });
    if (!dynamicItems.length) return false;

    grid.querySelectorAll(".pricing-addon-card:not(.pricing-addon-card--skeleton)").forEach((card) => card.remove());
    dynamicItems.forEach((item) => grid.appendChild(renderCard(section, item)));
    section.dataset.pricingState = "dynamic";
    updateTeaser(section);
    return true;
  };

  const loadDynamic = (section) => {
    if (section.dataset.pricingDynamic !== "true") return Promise.resolve(false);
    if (!window.LabPricing) {
      section.dataset.pricingState = "fallback";
      return Promise.resolve(false);
    }

    const specs = parseCatalogSpecs(section);
    if (!specs.length) {
      section.dataset.pricingState = "fallback";
      return Promise.resolve(false);
    }

    section.dataset.pricingState = "loading";
    return Promise.allSettled(specs.map((spec) => (
      window.LabPricing.load(configSectionFor(section, spec))
        .then((pricing) => Object.assign(pricing, { spec }))
    )))
      .then((settled) => {
        const results = settled
          .filter((result) => result.status === "fulfilled")
          .map((result) => result.value);
        const errors = settled
          .filter((result) => result.status === "rejected")
          .map((result) => result.reason && result.reason.message)
          .filter(Boolean);

        if (errors.length) section.dataset.pricingPartialError = errors.join("; ");
        if (!renderDynamic(section, results)) section.dataset.pricingState = "fallback";
        return section.dataset.pricingState === "dynamic";
      })
      .catch((error) => {
        section.dataset.pricingState = "fallback";
        section.dataset.pricingError = error.message;
        return false;
      });
  };

  const init = (section) => {
    if (section.dataset.addonsInit === "1") return;
    section.dataset.addonsInit = "1";

    const toggle = section.querySelector(".pricing-addons-toggle");
    const label = section.querySelector(".pricing-addons-toggle-label");
    const body = section.querySelector(".pricing-addons-body");
    if (!body) return;

    if (section.dataset.collapsed !== "on" || !toggle) {
      loadDynamic(section).then(() => updateTeaser(section));
      return;
    }

    body.id = body.id || "pricing-addons-body-" + ++addonsSeq;
    toggle.setAttribute("aria-controls", body.id);

    updateTeaser(section);
    section.dataset.collapseReady = "1";

    let expanded = section.dataset.expanded === "true";

    const setLabel = () => {
      if (!label) return;
      const next = expanded ? label.dataset.labelLess : label.dataset.labelMore;
      if (next) label.textContent = next;
    };

    const apply = (animate) => {
      section.dataset.expanded = String(expanded);
      toggle.setAttribute("aria-expanded", String(expanded));
      setLabel();
      if (!animate) {
        body.style.height = expanded ? "auto" : "0px";
        return;
      }
      if (expanded) {
        body.style.height = body.scrollHeight + "px";
        window.setTimeout(() => {
          if (expanded) body.style.height = "auto";
        }, 360);
      } else {
        body.style.height = body.scrollHeight + "px";
        void body.offsetHeight;
        body.style.height = "0px";
      }
    };

    apply(false);
    toggle.addEventListener("click", () => {
      expanded = !expanded;
      apply(true);
    });

    loadDynamic(section).then(() => {
      if (expanded) body.style.height = "auto";
      else body.style.height = "0px";
      updateTeaser(section);
    });

    const grid = section.querySelector(".pricing-addons-grid");
    if (grid && "MutationObserver" in window) {
      const observer = new MutationObserver(() => {
        updateTeaser(section);
        if (expanded) body.style.height = "auto";
      });
      observer.observe(grid, { childList: true, subtree: true, characterData: true });
    }
  };

  ready(() => {
    document.querySelectorAll('[data-block="pricing.addons"]').forEach(init);
  });
})();
