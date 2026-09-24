/*
 * Manual CMS runtime for the Calm Harbor staging catalog and first
 * authenticated customer-portal increment.
 * It has no imports because the CMS stores it in the template javascript field.
 */
(function () {
  "use strict";

  function boot() {
    var root = document.querySelector("#app[data-portal-pim-organization]");
    if (!root) throw new Error("Calm Harbor PIM root is missing");
    var config = readConfig(root);
    document.documentElement.dataset.theme = root.getAttribute("data-portal-theme") || "beauty";
    var mode = document.documentElement.dataset.mode || root.getAttribute("data-portal-default-mode") || "light";
    document.documentElement.dataset.mode = mode;
    var model = {
      auth: { error: null, manager: null, state: "checking-session", user: null },
      customer: { account: null, error: null, orders: [], state: "signed-out" },
      error: null,
      pricing: [],
      products: [],
      status: "loading",
    };

    var resizeObserver = null;
    var customerGeneration = 0;
    window.addEventListener("hashchange", render);
    render();
    loadSession(config).then(function (auth) {
      model.auth = auth;
      render();
      if (auth.user && config.enabledModules.includes("orders")) resolveCustomerOrders(auth.user);
    }).catch(function (error) {
      model.auth = { error: error, manager: null, state: "unavailable", user: null };
      render();
    });
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
      var current = route(config);
      var page;
      if (current === "login" || current === "orders" && model.auth.state !== "ready-signed-in") page = loginPage();
      else if (current === "orders") page = ordersPage();
      else {
        page = el("main", { className: "page", dataset: { route: current } });
        if (model.status === "loading") page.appendChild(loading());
        else if (model.status === "error") page.appendChild(failure(model.error));
        else if (current === "products") page.appendChild(productsPage(model.products));
        else page.appendChild(pricingPage(model.pricing));
      }
      shell.appendChild(page);
      root.appendChild(shell);
      applyResponsive(shell);
    }

    function nav() {
      if (route(config) === "login" || route(config) === "orders" && model.auth.state !== "ready-signed-in") return loginNav();
      var current = route(config);
      var bar = el("nav", { className: "top-nav", dataset: { module: "public-nav", visualId: "public-nav" } });
      var home = config.enabledModules.includes("orders") && model.auth.state === "ready-signed-in" ? "orders" : "pricing";
      var brand = el("a", { className: "top-nav__brand", href: "#/" + home, ariaLabel: "Calm Harbor Spa portal" });
      brand.appendChild(el("span", { className: "brand-logo", ariaHidden: "true" }));
      brand.appendChild(el("span", { className: "brand-name", text: "Calm Harbor Spa" }));
      bar.appendChild(brand);
      var links = [];
      if (config.enabledModules.includes("orders") && model.auth.state === "ready-signed-in") links.push(navLink("orders", "My orders", current));
      links.push(navLink("pricing", "Services & membership", current), navLink("products", "Shop", current));
      bar.appendChild(el("div", { className: "nav-links" }, links));
      var signedIn = model.auth.state === "ready-signed-in";
      var actions = [el("span", { className: "eyebrow", text: signedIn ? "Customer portal" : "Live catalog" }), actionLink(signedIn ? "Account" : "Sign in", signedIn ? "btn btn--ghost" : "btn btn--primary", "auth.gotoSignin", "public-signin", "#/login")];
      bar.appendChild(el("div", { className: "top-nav__actions" }, actions));
      return el("div", { className: "top-nav-wrap" }, [bar]);
    }

    function loginNav() {
      var bar = el("nav", { className: "top-nav", dataset: { module: "public-nav", visualId: "public-nav" } });
      var home = config.enabledModules.includes("orders") && model.auth.state === "ready-signed-in" ? "orders" : "pricing";
      var brand = el("a", { className: "top-nav__brand", href: "#/" + home, ariaLabel: "Calm Harbor Spa portal", dataset: { action: "nav.landing" } });
      brand.appendChild(el("span", { className: "brand-logo", ariaHidden: "true" }));
      brand.appendChild(el("span", { className: "brand-name", text: "Calm Harbor Spa", dataset: { bind: "brand.name" } }));
      bar.appendChild(brand);
      bar.appendChild(el("div", { className: "top-nav__actions" }, [
        el("button", { className: "icon-btn icon-btn--optional", text: modeIcon(), type: "button", ariaLabel: "Toggle light/dark", title: "Toggle light/dark", dataset: { action: "ui.toggleMode" }, onClick: toggleMode }),
        actionLink("< Home", "btn btn--ghost", "nav.landing", "public-home", "#/" + home),
      ]));
      return el("div", { className: "top-nav-wrap" }, [bar]);
    }

    function loginPage() {
      var state = model.auth.state;
      var section = el("section", { className: "page auth-page", dataset: { route: "auth.oidc", visualId: "auth.oidc", screenLabel: "Login (" + state + ")" } });
      var grid = el("div", { className: "auth-grid" });
      grid.appendChild(el("div", { className: "auth-pitch" }, [
        el("span", { className: "eyebrow", text: "Customer account" }),
        el("h1", { className: "auth-pitch__title", text: "Secure sign-in, handled in one place." }),
        el("p", { className: "auth-pitch__sub", text: "You sign in with our secure account service and come straight back here. Your password is never entered on this site." }),
      ]));
      var card = el("div", { className: "auth-card", dataset: { module: "core-oidc-auth", visualId: "core-oidc-auth", state: state } });
      if (state === "checking-session") card.appendChild(oidcProgress("checking-session", "Checking your session...", "Securely restoring your existing sign-in. This only takes a moment - no need to do anything."));
      else if (state === "ready-signed-out") card.appendChild(oidcSignedOut());
      else if (state === "redirecting") card.appendChild(oidcProgress("redirecting", "Taking you to secure sign-in...", "This page is leaving for the secure account service. You'll come back here automatically - no need to do anything."));
      else if (state === "unavailable") card.appendChild(oidcUnavailable());
      else if (state === "ready-signed-in") card.appendChild(oidcSignedIn());
      else if (state === "signing-out") card.appendChild(oidcProgress("signing-out", "Signing you out...", "Finishing sign-out with the secure account service. One moment."));
      grid.appendChild(card);
      section.appendChild(grid);
      return section;
    }

    function oidcProgress(state, title, copy) {
      return el("div", { dataset: { state: state }, ariaBusy: "true" }, [
        el("div", { className: "oidc-status" }, [el("span", { className: "oidc-spinner" })]),
        el("div", { className: "oidc-title", text: title }),
        el("div", { className: "oidc-sub oidc-sub--tail", text: copy }),
      ]);
    }
    function oidcStep(number, text) { return el("div", { className: "oidc-step" }, [el("span", { className: "oidc-step__num", text: String(number) }), document.createTextNode(text)]); }
    function oidcSignedOut() {
      return el("div", { dataset: { state: "ready-signed-out" } }, [
        el("div", { className: "brand-logo brand-logo--lg", style: "margin-bottom:18px", ariaHidden: "true" }),
        el("div", { className: "oidc-title", text: "Sign in to your account" }),
        el("div", { className: "oidc-sub", text: "Sign-in continues in the secure account service. When you're done, you'll return right here." }),
        el("div", { className: "oidc-steps" }, [oidcStep(1, "Continue to the secure account service"), oidcStep(2, "Sign in there - we never see your password"), oidcStep(3, "Come back here, signed in")]),
        actionButton("Continue to secure sign-in", "btn btn--primary btn--block btn--lg", "auth.oidcSignIn", "oidc-signin", startSignIn),
        el("div", { className: "oidc-note", text: "By continuing you agree to our Terms & Privacy Policy." }),
      ]);
    }
    function oidcUnavailable() {
      return el("div", { dataset: { state: "unavailable" } }, [
        el("div", { className: "oidc-status" }, [el("div", { className: "oidc-glyph oidc-glyph--warn", text: "!" })]),
        el("div", { className: "oidc-title", text: "Secure sign-in isn't available" }),
        el("div", { className: "oidc-sub", text: "We couldn't reach the secure account service, so sign-in can't start right now. There's no other way to sign in here - please try again in a moment." }),
        el("div", { className: "oidc-actions" }, [actionButton("Try again", "btn btn--primary btn--block btn--lg", "auth.retrySession", "oidc-retry", refreshSession), actionLink("Back to the catalog", "btn btn--ghost btn--block", "nav.landing", "oidc-back-catalog", "#/pricing")]),
      ]);
    }
    function oidcSignedIn() {
      var name = displayName(model.auth.user), initial = name.charAt(0).toUpperCase() || "?";
      return el("div", { dataset: { state: "ready-signed-in" } }, [
        el("div", { className: "oidc-status" }, [el("div", { className: "oidc-glyph oidc-glyph--ok", text: "\u2713" })]),
        el("div", { className: "oidc-title", text: "You're signed in" }),
        el("div", { className: "oidc-session" }, [el("div", { className: "oidc-session__ava", text: initial }), el("div", null, [el("div", { className: "oidc-session__label", text: "Signed in as" }), el("div", { className: "oidc-session__name", text: name, dataset: { bind: "session.displayName" } })])]),
        el("div", { className: "oidc-sub", text: config.enabledModules.includes("orders") ? "Your customer Account and orders are resolved only after this secure sign-in." : "You can keep browsing while signed in." }),
        el("div", { className: "oidc-actions" }, [actionLink(config.enabledModules.includes("orders") ? "Open my portal" : "Browse the catalog", "btn btn--primary btn--block btn--lg", "nav.landing", "oidc-browse-catalog", config.enabledModules.includes("orders") ? "#/orders" : "#/pricing"), actionButton("Sign out", "btn btn--ghost btn--block", "auth.signOut", "oidc-signout", signOut)]),
      ]);
    }

    function ordersPage() {
      var page = el("main", { className: "page", dataset: { route: "orders.list", state: model.customer.state, module: "customer-orders", visualId: "customer-orders" } });
      if (model.customer.state === "resolving-customer") {
        page.appendChild(heading("Opening your account", "Securely matching your sign-in to your Calm Harbor customer account."));
        page.appendChild(oidcProgress("resolving-customer", "Loading your orders...", "No customer data is shown until the account match is complete."));
        return page;
      }
      if (model.customer.state !== "ready" && model.customer.state !== "empty") {
        page.appendChild(customerFailure(model.customer.error));
        return page;
      }
      var accountName = model.customer.account && model.customer.account.displayName || "Customer";
      page.appendChild(heading("Welcome back, " + accountName, "Your current Calm Harbor orders, loaded from your customer account."));
      var card = el("section", { className: "card", dataset: { module: "order-list", visualId: "order-list", state: model.customer.state } });
      card.appendChild(el("div", { className: "card__head" }, [el("span", { className: "card__title", text: "Your orders" }), el("span", { className: "status-badge status-badge--info", text: String(model.customer.orders.length) + (model.customer.orders.length === 1 ? " order" : " orders") })]));
      var list = el("div", { className: "order-list" });
      if (!model.customer.orders.length) list.appendChild(empty("No orders are currently linked to your customer account."));
      else model.customer.orders.forEach(function (order) { list.appendChild(orderCard(order)); });
      card.appendChild(list);
      page.appendChild(card);
      return page;
    }

    function orderCard(order) {
      var status = order.statusCode || "CURRENT";
      var article = el("article", { className: "order-card", dataset: { module: "order-card", visualId: "order-card", id: String(order.id) } });
      article.appendChild(el("div", { className: "order-card__icon", style: "background:rgba(var(--accent-rgb),.14)" }, [el("i", { style: "background:var(--accent)" })]));
      article.appendChild(el("div", { className: "order-card__body" }, [el("div", { className: "order-card__name", text: order.typeLabel || order.typeCode || "Calm Harbor order", dataset: { bind: "order.type" } }), el("div", { className: "order-card__meta", text: "Order #" + order.id, dataset: { bind: "order.id" } })]));
      article.appendChild(el("span", { className: "status-badge status-badge--info", text: status, dataset: { bind: "order.status" } }));
      article.appendChild(el("div", { className: "order-card__price", text: order.displayTotal, dataset: { bind: "order.grandTotal" } }));
      return article;
    }

    function customerFailure(error) {
      var code = error && error.code || "customer-unavailable";
      var copy = code === "customer-not-linked" ? ["Customer account not linked", "This sign-in is not linked to an active Calm Harbor customer account."]
        : code === "customer-forbidden" || code === "orders-forbidden" ? ["Portal access unavailable", "Your sign-in is valid, but this customer portal cannot be opened."]
          : code === "session-expired" ? ["Session expired", "Sign in again to securely reopen your customer portal."]
            : ["Customer portal is unavailable", "We could not safely load your customer account and orders. No private fallback data is shown."];
      var section = el("section", { className: "page--narrow", dataset: { state: code } });
      section.appendChild(heading(copy[0], copy[1]));
      section.appendChild(el("div", { className: "oidc-actions" }, [actionButton("Try again", "btn btn--primary", "customer.retry", "customer-retry", function () { if (model.auth.user) resolveCustomerOrders(model.auth.user); }), actionLink("Account & sign out", "btn btn--ghost", "auth.gotoSignin", "customer-account", "#/login")]));
      return section;
    }

    function resolveCustomerOrders(user) {
      var generation = ++customerGeneration;
      model.customer = { account: null, error: null, orders: [], state: "resolving-customer" };
      render();
      loadCustomerOrders(user, config).then(function (result) {
        if (generation !== customerGeneration || model.auth.user !== user || model.auth.state !== "ready-signed-in") return;
        model.customer = { account: result.account, error: null, orders: result.orders, state: result.orders.length ? "ready" : "empty" };
        render();
      }).catch(function (error) {
        if (generation !== customerGeneration || model.auth.user !== user || model.auth.state !== "ready-signed-in") return;
        model.customer = { account: null, error: error, orders: [], state: error && error.code || "customer-unavailable" };
        render();
      });
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

    function startSignIn() {
      if (!model.auth.manager || model.auth.state !== "ready-signed-out") return;
      model.auth.state = "redirecting";
      render();
      try {
        window.sessionStorage.setItem(config.authReturnStorageKey, window.location.href);
        model.auth.manager.signinRedirect().catch(function (error) {
          model.auth = { error: error, manager: model.auth.manager, state: "unavailable", user: null };
          render();
        });
      } catch (error) {
        model.auth = { error: error, manager: model.auth.manager, state: "unavailable", user: null };
        render();
      }
    }

    function signOut() {
      if (!model.auth.manager || !model.auth.user || model.auth.state !== "ready-signed-in") return;
      customerGeneration += 1;
      model.auth.state = "signing-out";
      model.customer = { account: null, error: null, orders: [], state: "signed-out" };
      render();
      try {
        var returnUrl = new URL(window.location.href);
        returnUrl.hash = "#/pricing";
        window.sessionStorage.setItem(config.authLogoutReturnStorageKey, returnUrl.href);
        model.auth.manager.signoutRedirect().catch(function (error) {
          model.auth = { error: error, manager: model.auth.manager, state: "unavailable", user: model.auth.user };
          render();
        });
      } catch (error) {
        model.auth = { error: error, manager: model.auth.manager, state: "unavailable", user: model.auth.user };
        render();
      }
    }

    function refreshSession() {
      customerGeneration += 1;
      model.auth = { error: null, manager: null, state: "checking-session", user: null };
      model.customer = { account: null, error: null, orders: [], state: "signed-out" };
      render();
      loadSession(config).then(function (auth) {
        model.auth = auth;
        render();
        if (auth.user && config.enabledModules.includes("orders")) resolveCustomerOrders(auth.user);
      }).catch(function (error) {
        model.auth = { error: error, manager: null, state: "unavailable", user: null };
        render();
      });
    }

    function toggleMode() {
      mode = mode === "dark" ? "light" : "dark";
      document.documentElement.dataset.mode = mode;
      render();
    }

    function modeIcon() { return mode === "dark" ? "\u2600" : "\u263e"; }

    function applyResponsive(shell) {
      if (resizeObserver) resizeObserver.disconnect();
      function apply(width) {
        shell.classList.remove("vw-mobile", "vw-tablet", "vw-compact");
        if (width <= 560) shell.classList.add("vw-mobile");
        else if (width <= 900) shell.classList.add("vw-tablet");
        if (width <= 1040) shell.classList.add("vw-compact");
      }
      apply(shell.getBoundingClientRect().width);
      if (window.ResizeObserver) {
        resizeObserver = new window.ResizeObserver(function (entries) {
          if (entries[0]) apply(entries[0].contentRect.width);
        });
        resizeObserver.observe(shell);
      }
    }
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
      enabledModules: values(root.getAttribute("data-portal-enabled-modules")),
      defaultRoute: root.getAttribute("data-portal-default-route") || "pricing",
      portalOrganization: root.getAttribute("data-portal-organization") || root.getAttribute("data-portal-pim-organization") || "",
      coreApiBase: root.getAttribute("data-portal-core-api-base") || "/core",
      accountApiBase: root.getAttribute("data-portal-account-api-base") || "/core-acct",
      billApiBase: root.getAttribute("data-portal-bill-api-base") || "/core-bill",
      accountTypeCode: root.getAttribute("data-portal-account-type-code") || "SPA_CUSTOMER",
      authCallbackPath: required(root, "data-portal-auth-callback-path"),
      authCoreBase: required(root, "data-portal-auth-core-base"),
      authLogoutReturnStorageKey: required(root, "data-portal-auth-logout-return-storage-key"),
      authReturnStorageKey: required(root, "data-portal-auth-return-storage-key"),
    };
  }
  function required(root, name) { var value = root.getAttribute(name); if (!value) throw new Error("Missing required portal config: " + name); return value; }
  function values(value) { return String(value || "").split(",").map(function (item) { return item.trim(); }).filter(Boolean); }

  async function loadSession(config) {
    if (!window.oidc || !window.oidc.UserManager || !window.oidc.WebStorageStateStore) {
      throw new Error("Core sign-in library did not load");
    }
    var coreBase = sameOriginUrl(config.authCoreBase, "Core base").replace(/\/+$/, "");
    var expectedCallback = sameOriginUrl(config.authCallbackPath, "Core callback");
    var response = await window.fetch(coreBase + "/.well-known/oauth-protected-resource/", {
      credentials: "omit",
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error("Core authentication discovery HTTP " + response.status);
    var metadata = await response.json();
    var authority = Array.isArray(metadata.authorization_servers) ? metadata.authorization_servers[0] : "";
    if (!authority || !metadata.resource || !metadata.x_client_id || !metadata.x_redirect_uri || !metadata.x_post_logout_redirect_uri) {
      throw new Error("Core authentication discovery is incomplete");
    }
    if (new URL(metadata.resource, window.location.origin).origin !== window.location.origin) {
      throw new Error("Core authentication resource must be same-origin");
    }
    if (new URL(authority, window.location.origin).origin !== window.location.origin) {
      throw new Error("Core authorization server must be same-origin");
    }
    if (new URL(metadata.x_redirect_uri, window.location.origin).href !== expectedCallback) {
      throw new Error("Core authentication callback does not match the portal contract");
    }
    if (new URL(metadata.x_post_logout_redirect_uri, window.location.origin).href !== expectedCallback) {
      throw new Error("Core logout callback does not match the portal contract");
    }
    var manager = new window.oidc.UserManager({
      authority: authority,
      client_id: metadata.x_client_id,
      post_logout_redirect_uri: expectedCallback,
      redirect_uri: expectedCallback,
      response_type: "code",
      scope: "openid profile email roles",
      userStore: new window.oidc.WebStorageStateStore({ store: window.localStorage }),
    });
    var user = await manager.getUser();
    if (user && user.expired) {
      await manager.removeUser();
      user = null;
    }
    return { error: null, manager: manager, state: user ? "ready-signed-in" : "ready-signed-out", user: user || null };
  }

  function sameOriginUrl(value, label) {
    var url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) throw new Error(label + " must be same-origin");
    return url.href;
  }

  async function loadCustomerOrders(user, config) {
    var accessToken = user && user.access_token;
    if (!accessToken) throw customerError("session-required", "OIDC session does not include an access token");
    var authorization = String(user.token_type || "Bearer") + " " + accessToken;
    var coreBase = sameOriginUrl(config.coreApiBase, "Core API base").replace(/\/+$/, "");
    var accountBase = sameOriginUrl(config.accountApiBase, "Core Account API base").replace(/\/+$/, "");
    var billBase = sameOriginUrl(config.billApiBase, "Core Bill API base").replace(/\/+$/, "");
    var basicInfo = await coreJson(coreBase + "/api/user/basic-info.json", {
      method: "POST", credentials: "same-origin", headers: { Authorization: authorization, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(["code", "id", "name", "nls"].map(function (name) { return { name: name }; })),
    }, "customer");
    var userId = positiveInteger(basicInfo.authenticatedUserId || basicInfo.id);
    if (!userId) throw customerError("invalid-session-user", "Core basic-info did not return authenticatedUserId");
    var authorizedOrganizations = Array.isArray(basicInfo.authorizedOrganizations) ? basicInfo.authorizedOrganizations.map(function (item) { return text(item && item.code); }).filter(Boolean) : [];
    var organization = text(config.portalOrganization);
    if (!organization) throw customerError("organization-required", "Portal organization is missing");
    if (authorizedOrganizations.length && !authorizedOrganizations.includes(organization)) throw customerError("organization-forbidden", "Portal organization is not authorized");
    var accountReply = await coreJson(accountBase + "/api/account/list.json", {
      method: "POST", credentials: "same-origin", headers: { Authorization: authorization, "Content-Type": "application/json", Accept: "application/json", "X-Organization-Code": organization },
      body: JSON.stringify({
        filters: [
          { type: "INTEGER", operator: "=", property: "user.id", value: String(userId) },
          { type: "STRING", operator: "=", property: "type.code", value: config.accountTypeCode },
        ],
        mappings: [
          { name: "code" }, { name: "id" }, { name: "nls" }, { name: "optimistic" },
          { key: "id", name: "organization", type: "identifier" }, { key: "id", name: "type", type: "identifier" }, { key: "id", name: "user", type: "identifier" },
        ],
        offset: 0, pageSize: 2,
      }),
    }, "customer");
    var accounts = Array.isArray(accountReply && accountReply.result) ? accountReply.result : [];
    if (!accounts.length) throw customerError("customer-not-linked", "No customer Account is linked to this User");
    if (accounts.length !== 1 || Number(accountReply.resultSize || accounts.length) > 1) throw customerError("customer-account-ambiguous", "Customer Account resolution is ambiguous");
    var rawAccount = accounts[0] || {};
    var accountId = positiveInteger(rawAccount.id);
    if (!accountId) throw customerError("invalid-customer-account", "Customer Account id is missing");
    if (rawAccount.user && positiveInteger(rawAccount.user.id) && Number(rawAccount.user.id) !== userId) throw customerError("customer-scope-mismatch", "Customer Account does not match the authenticated User");
    var ordersReply = await coreJson(billBase + "/api/order/list.json", {
      method: "POST", credentials: "same-origin", headers: { Authorization: authorization, "Content-Type": "application/json", Accept: "application/json", "X-Organization-Code": organization },
      body: JSON.stringify({
        filters: [{ type: "INTEGER", operator: "=", property: "account.id", value: String(accountId) }],
        mappings: [
          { name: "grandTotal" }, { name: "id" }, { name: "optimistic" }, { name: "totalCharges" }, { name: "totalTaxes" },
          { key: "id", mappings: [{ name: "id" }, { name: "code" }, { name: "nls" }], name: "account", type: "identifier" },
          { key: "id", mappings: [{ name: "id" }, { name: "code" }, { name: "nls" }], name: "currency", type: "identifier" },
          { key: "id", name: "organization", type: "identifier" },
          { mappings: [{ name: "id" }, { name: "code" }, { name: "nls" }], name: "states", type: "collection" },
          { key: "id", mappings: [{ name: "id" }, { name: "code" }, { name: "nls" }], name: "type", type: "identifier" },
        ],
        offset: 0, pageSize: 50, sorting: [{ field: "id", direction: "DESC" }],
      }),
    }, "orders");
    var orders = (Array.isArray(ordersReply && ordersReply.result) ? ordersReply.result : []).map(function (row) {
      if (!row.account || positiveInteger(row.account.id) !== accountId) throw customerError("order-scope-mismatch", "Order does not belong to the resolved Account");
      var id = positiveInteger(row.id);
      if (!id) throw customerError("invalid-order", "Order id is missing");
      var states = Array.isArray(row.states) ? row.states : [];
      var statusCode = Array.from(new Set(states.map(function (state) { return text(state && state.code); }).filter(Boolean))).join(" · ");
      var currencyCode = text(row.currency && row.currency.code) || "USD";
      var total = Number(row.grandTotal);
      return {
        id: id,
        statusCode: statusCode,
        typeCode: text(row.type && row.type.code),
        typeLabel: localizedName(row.type && row.type.nls),
        displayTotal: Number.isFinite(total) ? new Intl.NumberFormat("en", { style: "currency", currency: currencyCode }).format(total) : "",
      };
    });
    return { account: { id: accountId, displayName: localizedName(rawAccount.nls) || text(basicInfo.authenticatedUserName || basicInfo.authenticatedUser || basicInfo.name) || "Customer" }, orders: orders };
  }

  async function coreJson(url, options, family) {
    var response = await window.fetch(url, options);
    if (!response || !response.ok) {
      var status = response && response.status;
      var code = status === 401 ? "session-expired" : status === 403 ? family === "orders" ? "orders-forbidden" : "customer-forbidden" : family + "-request-failed";
      throw customerError(code, "Core " + family + " request failed");
    }
    try { return await response.json(); }
    catch (_) { throw customerError("invalid-response", "Core response was not valid JSON"); }
  }

  function customerError(code, message) { var error = new Error(message); error.code = code; return error; }
  function positiveInteger(value) { var number = Number(value); return Number.isInteger(number) && number > 0 ? number : null; }
  function localizedName(value) { if (!value || typeof value !== "object") return ""; var localized = value.en || value["en-US"] || Object.values(value)[0] || {}; return text(localized && (localized.NAME || localized.name)); }
  function text(value) { return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim(); }

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
  function route(config) {
    var value = location.hash.replace(/^#\/?/, "").split("?", 1)[0];
    if (value === "login") return value;
    if (config.enabledModules.includes(value) && ["orders", "pricing", "products"].includes(value)) return value;
    return config.enabledModules.includes(config.defaultRoute) ? config.defaultRoute : "pricing";
  }
  function navLink(id, label, current) { return el("a", { className: "nav-link" + (id === current ? " nav-link--active" : ""), href: "#/" + id, text: label }); }
  function actionButton(label, className, action, visualId, onClick) { return el("button", { className: className, onClick: onClick, text: label, type: "button", dataset: { module: "action-button", action: action, visualId: visualId } }); }
  function actionLink(label, className, action, visualId, href) { return el("a", { className: className, href: href, text: label, dataset: { module: "action-button", action: action, visualId: visualId } }); }
  function displayName(user) {
    var profile = user && user.profile ? user.profile : {};
    return profile.name || profile.preferred_username || profile.email || "Customer";
  }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }
  function el(tag, options, children) {
    var node = document.createElement(tag); options = options || {};
    if (options.className) node.className = options.className;
    if (options.text !== undefined) node.textContent = options.text;
    if (options.href) node.href = options.href;
    if (options.type) node.type = options.type;
    if (options.disabled) node.disabled = true;
    if (options.style) node.setAttribute("style", options.style);
    if (options.ariaLabel) node.setAttribute("aria-label", options.ariaLabel);
    if (options.ariaHidden) node.setAttribute("aria-hidden", options.ariaHidden);
    if (options.ariaBusy) node.setAttribute("aria-busy", options.ariaBusy);
    if (options.title) node.title = options.title;
    if (options.dataset) Object.keys(options.dataset).forEach(function (key) { node.dataset[key] = options.dataset[key]; });
    if (options.onClick) node.addEventListener("click", options.onClick);
    (children || []).forEach(function (child) { if (child) node.appendChild(child); });
    return node;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true }); else boot();
}());
