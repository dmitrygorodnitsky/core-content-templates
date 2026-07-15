/*
 * Manual CMS runtime for the Calm Harbor staging catalog.
 * It has no imports because the CMS stores it in the template javascript field.
 */
(function () {
  "use strict";

  function boot() {
    var root = document.querySelector("#app[data-portal-pim-organization]");
    if (!root) throw new Error("Calm Harbor PIM root is missing");
    var config = readConfig(root);
    document.documentElement.dataset.theme = root.getAttribute("data-portal-theme") || "beauty";
    document.documentElement.dataset.mode = root.getAttribute("data-portal-default-mode") || "light";
    var model = { status: "loading", pricing: [], products: [], error: null };

    window.addEventListener("hashchange", render);
    render();
    loadCatalog(config).then(function (catalog) {
      model.status = "ready";
      model.pricing = catalog.pricing;
      model.products = catalog.products;
      render();
    }).catch(function (error) {
      model.status = "error";
      model.error = error;
      render();
    });

    function render() {
      clear(root);
      var shell = el("div", { className: "app-shell" });
      shell.appendChild(nav());
      var page = el("main", { className: "page", dataset: { route: route() } });
      if (model.status === "loading") page.appendChild(loading());
      else if (model.status === "error") page.appendChild(failure(model.error));
      else if (route() === "products") page.appendChild(productsPage(model.products));
      else page.appendChild(pricingPage(model.pricing));
      shell.appendChild(page);
      root.appendChild(shell);
    }

    function nav() {
      var current = route();
      var bar = el("nav", { className: "top-nav" });
      var brand = el("a", { className: "top-nav__brand", href: "#/pricing", ariaLabel: "Calm Harbor Spa catalog" });
      brand.appendChild(el("span", { className: "brand-logo", ariaHidden: "true" }));
      brand.appendChild(el("span", { className: "brand-name", text: "Calm Harbor Spa" }));
      bar.appendChild(brand);
      bar.appendChild(el("div", { className: "nav-links" }, [
        navLink("pricing", "Services & membership", current), navLink("products", "Shop", current),
      ]));
      bar.appendChild(el("div", { className: "top-nav__actions" }, [el("span", { className: "eyebrow", text: "Live catalog" })]));
      return el("div", { className: "top-nav-wrap" }, [bar]);
    }

    function pricingPage(items) {
      var section = el("section", { dataset: { visualId: "pricing" } });
      section.appendChild(el("div", { className: "pricing-head" }, [
        el("span", { className: "eyebrow", text: "Live availability from Calm Harbor" }),
        el("h1", { text: "Care, priced clearly" }),
        el("p", { text: "Services and membership options are loaded directly from the Calm Harbor catalog." }),
      ]));
      if (!items.length) { section.appendChild(empty("No services or memberships are currently published.")); return section; }
      var cards = el("div", { className: "pricing-grid", dataset: { module: "pim-pricing" } });
      items.forEach(function (item, index) { cards.appendChild(pricingCard(item, index)); });
      section.appendChild(cards);
      return section;
    }

    function pricingCard(item, index) {
      var featured = index === 1;
      var card = el("article", { className: "plan-card" + (featured ? " plan-card--featured" : "") });
      card.appendChild(el("div", { className: "plan-card__name", text: item.name }));
      card.appendChild(el("div", { className: "plan-card__price" }, [el("b", { text: item.price }), el("span", { text: item.interval ? " / " + item.interval.toLowerCase() : "" })]));
      card.appendChild(el("p", { className: "plan-card__tag", text: item.description || "Details are confirmed by Calm Harbor at booking." }));
      card.appendChild(el("div", { className: "plan-features" }, [el("div", { text: item.code }), el("div", { text: "Availability is confirmed before booking." })]));
      card.appendChild(el("div", { className: "plan-cta", text: "Contact Calm Harbor to book" }));
      return card;
    }

    function productsPage(items) {
      var section = el("section", { dataset: { visualId: "products" } });
      section.appendChild(el("div", { className: "featured-banner" }, [
        el("div", { style: "flex:1" }, [
          el("span", { className: "eyebrow", text: "Live catalog" }),
          el("h1", { text: "Bring the ritual home" }),
          el("p", { text: "Retail products currently published by Calm Harbor Spa." }),
        ]),
        el("div", { className: "featured-banner__art" }, [el("div", { className: "brand-logo brand-logo--lg", ariaHidden: "true" })]),
      ]));
      section.appendChild(el("div", { className: "shop-head" }, [el("div", { className: "shop-head__title", text: "Shop" })]));
      if (!items.length) { section.appendChild(empty("No retail products are currently published.")); return section; }
      var grid = el("div", { className: "product-grid", dataset: { module: "pim-products" } });
      items.forEach(function (item, index) { grid.appendChild(productCard(item, index)); });
      section.appendChild(grid);
      return section;
    }

    function productCard(item, index) {
      var colors = ["#f7c6d8", "#e8c9f0", "#f7ddb2", "#cce9dd"];
      var card = el("article", { className: "product-card" });
      card.appendChild(el("div", { className: "product-card__art", style: "background:" + colors[index % colors.length] }, [el("div", { className: "product-card__thumb" }, [el("i", { style: "background:var(--accent)" })]) ]));
      card.appendChild(el("span", { className: "product-tag", text: "Calm Harbor" }));
      card.appendChild(el("div", { className: "product-card__name", text: item.name }));
      card.appendChild(el("div", { className: "product-card__blurb", text: item.description || item.code }));
      card.appendChild(el("div", { className: "product-card__foot" }, [el("span", { className: "price-lg", text: item.price })]));
      return card;
    }

    function loading() { return heading("Loading Calm Harbor catalog", "Requesting current products and prices from Core PIM."); }
    function failure(error) {
      var section = el("section", { className: "page--narrow" });
      section.appendChild(heading("Catalog is unavailable", "The live catalog could not be loaded. No catalog data is shown."));
      section.appendChild(el("div", { className: "rates-card" }, [el("div", { className: "panel__title", text: error && error.message ? error.message : "Core PIM request failed" })]));
      return section;
    }
    function heading(title, copy) { return el("div", { className: "page-header" }, [el("div", null, [el("h1", { className: "page-header__title", text: title }), el("p", { className: "page-header__sub", text: copy })])]); }
    function empty(message) { return el("div", { className: "rates-card" }, [el("div", { className: "panel__title", text: message })]); }
  }

  function readConfig(root) {
    return {
      apiBase: root.getAttribute("data-portal-pim-api-base") || "/core-pim/api",
      organization: required(root, "data-portal-pim-organization"),
      pricingTypes: values(root.getAttribute("data-portal-pim-pricing-product-type-codes")),
      productTypes: values(root.getAttribute("data-portal-pim-products-product-type-codes")),
      priceTypeCode: required(root, "data-portal-pim-price-type-code"),
      priceAttributeCode: required(root, "data-portal-pim-price-attribute-code"),
      priceAttributeValues: values(root.getAttribute("data-portal-pim-price-attribute-values")),
      currency: required(root, "data-portal-pim-currency"),
      currencyAttributeCode: required(root, "data-portal-pim-currency-attribute-code"),
      currencyAttributeValues: values(root.getAttribute("data-portal-pim-currency-attribute-values")),
      amountAttributeCode: required(root, "data-portal-pim-amount-attribute-code"),
      amountMinorDivisor: Number(root.getAttribute("data-portal-pim-amount-minor-divisor") || "100"),
    };
  }
  function required(root, name) { var value = root.getAttribute(name); if (!value) throw new Error("Missing required portal config: " + name); return value; }
  function values(value) { return String(value || "").split(",").map(function (item) { return item.trim(); }).filter(Boolean); }

  async function loadCatalog(config) {
    var pricingRows = await loadTypes(config.pricingTypes, config);
    var productRows = await loadTypes(config.productTypes, config);
    return { pricing: normalize(pricingRows, config), products: normalize(productRows, config) };
  }
  async function loadTypes(types, config) {
    if (!types.length) throw new Error("No Core PIM product types are configured");
    var responses = await Promise.all(types.map(function (type) { return request(type, config); }));
    return responses.reduce(function (all, response) { return all.concat(Array.isArray(response && response.prices) ? response.prices : []); }, []);
  }
  async function request(productTypeCode, config) {
    var base = String(config.apiBase).replace(/\/+$/, "").replace(/\/api$/, "");
    var response = await window.fetch(base + "/public/" + encodeURIComponent(config.organization) + "/catalog/price-comparison.json", {
      method: "POST", credentials: "omit", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ productTypeCode: productTypeCode, includeChildProductTypes: true, priceTypeCode: config.priceTypeCode, includeChildPriceTypes: true, priceAttributeCode: config.priceAttributeCode, priceAttributeValues: config.priceAttributeValues, currencyAttributeCode: config.currencyAttributeCode, currencyAttributeValues: config.currencyAttributeValues, nlsKeys: ["NAME", "DESCRIPTION", "PLACEHOLDER"] }),
    });
    if (!response.ok) throw new Error("Core PIM HTTP " + response.status);
    return response.json();
  }
  function normalize(rows, config) {
    var deduped = {};
    rows.forEach(function (row) { var product = productFrom(row); if (product.code) deduped[product.code] = row; });
    return Object.keys(deduped).map(function (code) { return item(deduped[code], config); }).sort(function (left, right) { return left.priority - right.priority || left.name.localeCompare(right.name); });
  }
  function item(row, config) {
    var product = productFrom(row), nls = (product.nls && (product.nls.en || product.nls["en"])) || {}, price = row.price || {};
    var amount = Number(price.display && price.display.amount);
    if (!Number.isFinite(amount)) amount = Number(attribute(price, config.amountAttributeCode)) / config.amountMinorDivisor;
    var currency = (price.display && price.display.currency) || attribute(price, config.currencyAttributeCode) || config.currency;
    var interval = (price.display && price.display.intervalLabel) || attribute(price, config.priceAttributeCode) || "";
    return { code: product.code || "PIM_ITEM", name: nls.NAME || product.code || "Catalog item", description: strip(nls.DESCRIPTION || ""), price: Number.isFinite(amount) ? new Intl.NumberFormat("en", { style: "currency", currency: currency, maximumFractionDigits: amount % 1 ? 2 : 0 }).format(amount) : "Price on request", interval: interval === "MONTH" ? "Monthly" : interval === "ONE_TIME" ? "One time" : interval, priority: Number(attribute(product, "SORT_ORDER_PRIORITY")) || 999 };
  }
  function productFrom(row) { return (row && row.product && (row.product.product || row.product)) || {}; }
  function attribute(entity, code) { var groups = entity && entity.attributes; if (!groups || typeof groups !== "object") return null; for (var groupName in groups) { var value = groups[groupName] && groups[groupName][code]; if (value && value.value !== undefined && value.value !== null) return value.value; } return null; }
  function strip(value) { return String(value || "").replace(/<[^>]*>/g, "").trim(); }
  function route() { return location.hash.replace(/^#\/?/, "") === "products" ? "products" : "pricing"; }
  function navLink(id, label, current) { return el("a", { className: "nav-link" + (id === current ? " nav-link--active" : ""), href: "#/" + id, text: label }); }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function el(tag, options, children) {
    var node = document.createElement(tag); options = options || {};
    if (options.className) node.className = options.className;
    if (options.text !== undefined) node.textContent = options.text;
    if (options.href) node.href = options.href;
    if (options.style) node.setAttribute("style", options.style);
    if (options.ariaLabel) node.setAttribute("aria-label", options.ariaLabel);
    if (options.ariaHidden) node.setAttribute("aria-hidden", options.ariaHidden);
    if (options.dataset) Object.keys(options.dataset).forEach(function (key) { node.dataset[key] = options.dataset[key]; });
    (children || []).forEach(function (child) { if (child) node.appendChild(child); });
    return node;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true }); else boot();
}());
