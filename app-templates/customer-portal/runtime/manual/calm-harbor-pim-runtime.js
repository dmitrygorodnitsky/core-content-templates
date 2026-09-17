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
      accountMenu: false,
      auth: { error: null, manager: null, state: "checking-session", user: null },
      checkout: { item: null, policyAccepted: false, state: "idle" },
      customer: { account: null, error: null, orders: [], state: "signed-out" },
      error: null,
      memberships: [],
      mobileNav: false,
      products: [],
      services: [],
      status: "loading",
      supportOpen: false,
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
      model.services = catalog.services;
      model.memberships = catalog.memberships;
      model.products = catalog.products;
      render();
    }).catch(function (error) {
      model.status = "error";
      model.error = error;
      render();
    });

    function render() {
      clear(root);
      var current = route(config);
      var customerRoute = current === "orders" || current === "account";
      var accountGated = customerRoute && model.auth.state === "ready-signed-in" && model.customer.state !== "ready" && model.customer.state !== "empty";
      var shell = el("div", { className: "app-shell", dataset: { module: "app-shell", visualId: "app-shell", capability: "current-staging", retail: config.retail, portalProfile: "spaStaging", accountState: current === "login" ? undefined : model.customer.state } });
      shell.appendChild(nav(accountGated));
      var page;
      if (current === "login" || customerRoute && model.auth.state !== "ready-signed-in") page = loginPage();
      else if (accountGated) page = accountBootstrap();
      else if (current === "orders") page = ordersPage();
      else if (current === "account") page = accountPage();
      else if (current === "checkout") page = checkoutPage();
      else {
        if (current === "products") page = productsPage(model.products);
        else page = catalogPage(current);
      }
      shell.appendChild(page);
      if (model.supportOpen) shell.appendChild(supportUnavailable());
      root.appendChild(shell);
      applyResponsive(shell);
      positionNavPill(shell);
    }

    function nav(gated) {
      if (route(config) === "login" || (route(config) === "orders" || route(config) === "account") && model.auth.state !== "ready-signed-in") return loginNav();
      var current = route(config);
      var bar = el("nav", { className: "top-nav", dataset: { module: "top-nav", visualId: "top-nav", capability: "current-staging", state: gated ? "gated" : model.accountMenu ? "account-menu-open" : undefined } });
      var home = config.enabledModules.includes("orders") && model.auth.state === "ready-signed-in" ? "orders" : "pricing";
      var brand = el("a", { className: "top-nav__brand", href: "#/" + home, ariaLabel: "Calm Harbor Spa portal" });
      brand.appendChild(el("span", { className: "brand-logo", ariaHidden: "true" }));
      brand.appendChild(el("span", { className: "brand-name", text: "Calm Harbor Spa" }));
      bar.appendChild(brand);
      if (gated) {
        bar.appendChild(el("div", { className: "nav-links" }));
        bar.appendChild(el("div", { className: "top-nav__actions" }, [modeButton()]));
        return el("div", { className: "top-nav-wrap" }, [bar]);
      }
      var signedIn = model.auth.state === "ready-signed-in";
      var links = [navLink("orders", "Orders", current), navLink("services", "Services & prices", current), navLink("products", "Shop", current, true)];
      if (signedIn && config.enabledModules.includes("account")) links.push(navLink("account", "Account", current));
      bar.appendChild(el("div", { className: "nav-links" }, [el("div", { className: "nav-pill", dataset: { navPill: "true" } })].concat(links)));
      var actions = [modeButton(), actionLink("Browse services", "btn btn--ghost spa-cta spa-cta--browse", "nav.go", "primary-cta", "#/services")];
      if (signedIn) {
        var name = customerName(), initial = name.charAt(0).toUpperCase() || "?";
        actions.push(el("button", { className: "account-btn", type: "button", title: "Account", ariaLabel: "Account", ariaExpanded: model.accountMenu ? "true" : "false", dataset: { module: "account-control", visualId: "account-control", action: "account.menu", state: model.accountMenu ? "open" : undefined }, onClick: function () { model.accountMenu = !model.accountMenu; render(); } }, [
          el("span", { className: "account-btn__ava", text: initial }),
          el("span", { className: "account-btn__name", text: name, dataset: { bind: "session.displayName" } }),
        ]));
      } else actions.push(actionLink("Sign in", "btn btn--primary", "auth.gotoSignin", "public-signin", "#/login"));
      actions.push(el("button", { className: "icon-btn hamburger", type: "button", text: "☰", title: "Menu", ariaLabel: "Menu", dataset: { action: "ui.toggleMobileNav" }, onClick: function () { model.mobileNav = !model.mobileNav; render(); } }));
      bar.appendChild(el("div", { className: "top-nav__actions" }, actions));
      if (model.accountMenu && signedIn) bar.appendChild(accountMenu());
      if (model.mobileNav) bar.appendChild(mobileMenu(current, signedIn));
      return el("div", { className: "top-nav-wrap" }, [bar]);
    }

    function modeButton() {
      return el("button", { className: "icon-btn icon-btn--optional", text: modeIcon(), type: "button", ariaLabel: "Toggle light/dark", title: "Toggle light/dark", dataset: { action: "ui.toggleMode" }, onClick: toggleMode });
    }

    function accountMenu() {
      var name = customerName(), initial = name.charAt(0).toUpperCase() || "?";
      return el("div", { className: "account-menu", role: "menu", dataset: { module: "account-menu", visualId: "account-menu", state: "account-menu-open" } }, [
        el("div", { className: "account-menu__head" }, [
          el("span", { className: "account-btn__ava account-menu__ava", text: initial }),
          el("div", { style: "min-width:0;flex:1" }, [el("div", { className: "account-menu__name", text: name, dataset: { bind: "session.displayName" } }), el("div", { className: "account-menu__sub", text: "Signed in with the secure account service" })]),
        ]),
        el("button", { className: "account-menu__item", type: "button", role: "menuitem", text: "Support", dataset: { action: "support.open" }, onClick: openSupport }),
        el("button", { className: "account-menu__item", type: "button", role: "menuitem", text: mode === "dark" ? "Switch to light mode" : "Switch to dark mode", dataset: { action: "ui.toggleMode" }, onClick: toggleMode }),
        el("div", { className: "account-menu__divider" }),
        el("button", { className: "account-menu__item account-menu__item--danger", type: "button", role: "menuitem", text: "Sign out", dataset: { action: "auth.signOut" }, onClick: signOut }),
      ]);
    }

    function mobileMenu(current, signedIn) {
      var menu = el("div", { className: "mobile-nav", dataset: { state: "mobile-navigation-open" } }, [navLink("orders", "Orders", current), navLink("services", "Services & prices", current), navLink("products", "Shop", current)]);
      if (signedIn && config.enabledModules.includes("account")) menu.appendChild(navLink("account", "Account", current));
      menu.appendChild(el("div", { className: "mobile-nav__divider" }));
      menu.appendChild(el("button", { className: "nav-link", type: "button", text: "Support", onClick: openSupport }));
      if (signedIn) menu.appendChild(el("button", { className: "nav-link", type: "button", text: "Sign out", onClick: signOut }));
      return menu;
    }

    function loginNav() {
      var bar = el("nav", { className: "top-nav", dataset: { module: "public-nav", visualId: "public-nav" } });
      var home = config.enabledModules.includes("orders") && model.auth.state === "ready-signed-in" ? "orders" : "pricing";
      var brand = el("a", { className: "top-nav__brand", href: "#/" + home, ariaLabel: "Calm Harbor Spa portal", dataset: { action: "nav.landing" } });
      brand.appendChild(el("span", { className: "brand-logo", ariaHidden: "true" }));
      brand.appendChild(el("span", { className: "brand-name", text: "Calm Harbor Spa", dataset: { bind: "brand.name" } }));
      bar.appendChild(brand);
      bar.appendChild(el("div", { className: "top-nav__actions" }, [
        modeButton(),
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
      var page = el("section", { className: "page", dataset: { route: "orders.list", state: model.customer.state, visualId: "spa-orders", capability: "current-staging", screenLabel: "Orders (current staging)" } });
      page.appendChild(heading(greeting(), "Here's what's on your account."));
      var card = el("section", { className: "card", dataset: { module: "spa-order-list", visualId: "spa-order-list", state: model.customer.state } });
      card.appendChild(el("div", { className: "card__head" }, [el("span", { className: "card__title", text: "Your orders" }), el("span", { className: "readonly-chip", text: "Read-only" })]));
      var list = el("div", { className: "order-list" });
      if (!model.customer.orders.length) list.appendChild(emptyState("◎", "No orders on your account yet", "Anything recorded on your account will appear here, exactly as our records show it.", actionLink("Browse services", "btn btn--ghost", "nav.go", "orders-empty-browse", "#/services")));
      else model.customer.orders.forEach(function (order, index) { list.appendChild(orderCard(order, index)); });
      card.appendChild(list);
      card.appendChild(el("div", { className: "card__footnote", text: "Statuses and amounts appear exactly as recorded on your account — this view is read-only. Scheduling details and online changes aren't part of these records." }));
      page.appendChild(card);
      return page;
    }

    function accountPage() {
      var page = el("section", { className: "page", dataset: { route: "account", state: "ready", visualId: "spa-account", module: "spa-account", capability: "current-staging", screenLabel: "Account overview" } });
      page.appendChild(el("div", { className: "page-header", dataset: { module: "page-header", visualId: "page-header" } }, [
        el("div", null, [
          el("h1", { className: "page-header__title", text: "Account" }),
          el("div", { className: "page-header__sub", text: "Signed in as " + customerName(), dataset: { bind: "session.displayName" } }),
        ]),
      ]));
      var entries = [
        { key: "purchases", title: "Purchases", desc: "Purchase history isn’t connected yet. Your current raw records remain available in Orders.", href: "#/orders", label: "See your orders ›" },
        { key: "plan", title: "My plan", desc: "Your personal plan and benefit balance aren’t connected yet. Published offers remain available in the catalog.", href: "#/pricing", label: "Membership options ›" },
        { key: "profile", title: "Profile", desc: "Contact editing isn’t connected yet, so no account details are shown or changed here." },
        { key: "support", title: "Support", desc: "A support destination hasn’t been configured for this portal yet." },
      ];
      var grid = el("div", { className: "account-grid", dataset: { module: "account-entry-list", visualId: "account-entry-list" } });
      entries.forEach(function (entry) {
        var foot = entry.href ? el("div", { className: "account-entry__foot" }, [actionLink(entry.label, "link-action", "nav.go", "account-entry-" + entry.key + "-alternative", entry.href)]) : null;
        grid.appendChild(el("div", { className: "card card--pad account-entry account-entry--unavailable", dataset: { module: "account-entry", visualId: "account-entry-" + entry.key, state: "unavailable" } }, [
          el("div", { style: "display:flex;align-items:center;gap:9px" }, [el("div", { className: "card__title", style: "flex:1", text: entry.title }), el("span", { className: "readonly-chip", text: "Not available yet" })]),
          el("div", { className: "account-entry__desc", text: entry.desc }),
          foot,
        ]));
      });
      page.appendChild(grid);
      page.appendChild(el("div", { className: "catalog-note", text: "Sections appear here as they’re connected for your account — nothing is shown from guesses." }));
      return page;
    }

    function orderCard(order, index) {
      var palette = [["var(--accent)", "rgba(var(--accent-rgb),.12)"], ["#1f8a44", "rgba(52,199,89,.16)"], ["#ff8a3d", "rgba(255,159,10,.16)"], ["#7a52e0", "rgba(122,82,224,.16)"]][index % 4];
      var article = el("article", { className: "spa-order-row", dataset: { module: "spa-order-row", visualId: "spa-order-row", orderRef: String(order.id) } });
      article.appendChild(el("div", { className: "order-card__icon", style: "background:" + palette[1] }, [el("i", { style: "background:" + palette[0] })]));
      article.appendChild(el("div", { className: "spa-order-row__body" }, [
        el("div", { className: "order-card__name", text: order.typeLabel || order.typeCode || "Order", dataset: { bind: "order.typeLabel" } }),
        el("div", { className: "order-card__meta" }, [el("span", { text: "Reference " + order.id, dataset: { bind: "order.reference" } }), el("span", { className: "code-chip", text: order.typeCode || "ORDER", dataset: { bind: "order.typeCode" } })]),
      ]));
      article.appendChild(el("span", { className: "status-badge status-badge--unmapped", text: order.statusCode || "UNMAPPED", dataset: { bind: "order.rawStatus", state: "unmapped" } }));
      article.appendChild(el("div", { className: "spa-order-row__amount" }, [el("b", { text: order.displayTotal, dataset: { bind: "order.displayTotal" } }), el("span", { text: order.currencyCode || "", dataset: { bind: "order.currency" } })]));
      return article;
    }

    function accountBootstrap() {
      var raw = model.customer.state, code = raw === "order-scope-mismatch" || raw === "orders-forbidden" ? "customer-forbidden" : raw;
      var page = el("section", { className: "page account-gate", dataset: { route: "orders.list", state: raw, visualId: "account-gate", screenLabel: "Account (" + raw + ")" } });
      var card = el("div", { className: "auth-card account-gate__card", dataset: { module: "account-bootstrap", visualId: "account-bootstrap", state: raw, intendedRoute: "orders.list" } });
      if (raw === "resolving-customer") {
        card.setAttribute("aria-busy", "true");
        card.appendChild(el("div", { className: "oidc-status" }, [el("span", { className: "oidc-spinner" })]));
        card.appendChild(el("div", { className: "oidc-title", text: "Getting your account ready…" }));
        card.appendChild(el("div", { className: "oidc-sub oidc-sub--tail", text: "You're signed in. We're securely loading your account and what it can do here — no need to do anything." }));
      } else {
        var copy = code === "customer-not-linked"
          ? ["⚭", "This sign-in isn't linked to a customer account", "You're signed in, but this identity isn't connected to an active customer account with us, so the portal can't be opened. Our support team can link it for you."]
          : code === "customer-account-ambiguous"
            ? ["⧉", "We can't tell which account is yours", "Your sign-in matches more than one customer account, so the portal won't guess. Our support team can link the right one — nothing is shown until then."]
            : code === "organization-forbidden"
              ? ["⌂", "This sign-in can't be used here", "Your sign-in works, but it doesn't belong to this portal's organization, so nothing here can be opened. If that seems wrong, contact support."]
              : code === "customer-forbidden"
                ? ["⚿", "This account can't open the customer portal", "Your sign-in works, but it doesn't include access to the customer portal. If you believe it should, contact support."]
                : code === "session-expired"
                  ? ["⏱", "Your session ended", "For your security you were signed out. Nothing you see below is live anymore. Sign in again and you'll come right back here."]
                  : ["!", "We can't open your account right now", "The portal couldn't load your account. Your data is safe and nothing was changed — try again in a moment."];
        card.appendChild(el("div", { className: "oidc-status" }, [el("div", { className: "oidc-glyph" + (copy[0] === "!" ? " oidc-glyph--warn" : ""), text: copy[0] })]));
        card.appendChild(el("div", { className: "oidc-title", text: copy[1] }));
        card.appendChild(el("div", { className: "oidc-sub", text: copy[2] }));
        var primary = code === "session-expired"
          ? actionLink("Sign in again", "btn btn--primary btn--block btn--lg", "auth.oidcSignIn", "account-reauth", "#/login")
          : code === "customer-unavailable" || code.indexOf("request-failed") !== -1 || code === "invalid-response"
            ? actionButton("Try again", "btn btn--primary btn--block btn--lg", "ui.retry", "account-retry", function () { if (model.auth.user) resolveCustomerOrders(model.auth.user); })
            : actionButton("Contact support", "btn btn--primary btn--block btn--lg", "support.open", "account-support", openSupport);
        card.appendChild(el("div", { className: "account-gate__actions" }, [primary, actionButton("Sign out", "btn btn--ghost btn--block", "auth.signOut", "account-signout", signOut)]));
      }
      page.appendChild(card);
      return page;
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

    function catalogPage(current) {
      var tab = current === "pricing" ? "pricing" : "services";
      var page = el("section", { className: "page", dataset: { route: tab, state: model.status, visualId: "spa-catalog", module: "spa-catalog", screenLabel: "Services & prices (" + tab + ")" } });
      page.appendChild(el("div", { className: "section-head" }, [el("div", { className: "section-head__title", text: "Services & prices" }), el("div", { className: "section-head__sub", text: "Every treatment with its live published price — at the studio or your place." })]));
      page.appendChild(el("div", { className: "spa-tabs" }, [el("div", { className: "tabs" }, [tabLink("services", "Treatments", tab), tabLink("pricing", "Prices & memberships", tab)])]));
      if (model.status === "loading") { page.appendChild(gridSkeleton("spa-svc-grid", 4, 170)); return page; }
      if (model.status === "error") { page.appendChild(errorState("Couldn't load the catalog", "Published treatments and prices didn't load, so no numbers are shown. Nothing was changed — try again.")); return page; }
      if (!model.services.length && !model.memberships.length) { page.appendChild(emptyState("▣", "Nothing is published right now", "No treatments or membership options are published in the catalog at the moment. They'll appear here the moment they are — nothing is estimated in the meantime.", actionButton("Contact support", "btn btn--ghost", "support.open", "catalog-empty-support", openSupport))); return page; }
      if (tab === "services") {
        var grid = el("div", { className: "spa-svc-grid", dataset: { module: "spa-service-list", visualId: "spa-service-list" } });
        model.services.forEach(function (item) { grid.appendChild(serviceCard(item)); });
        page.appendChild(grid);
        page.appendChild(el("div", { className: "catalog-note", text: "Prices are shown exactly as published in the public catalog. Availability isn't shown on this page, and booking online isn't available yet." }));
      } else {
        var rates = el("div", { className: "rates-card", dataset: { module: "spa-pricing-list", visualId: "spa-pricing-list" } }, [el("div", { className: "panel__title", text: "Treatments", style: "font-size:16px;padding:14px 0 6px" })]);
        model.services.forEach(function (item, index) { rates.appendChild(rateRow(item, index)); });
        page.appendChild(rates);
        var memberships = el("div", { className: "list-panel", style: "margin-top:18px", dataset: { module: "membership-options", visualId: "membership-options" } }, [el("div", { className: "list-panel__head" }, [el("div", { className: "list-panel__title", text: "Membership options", style: "flex:1" }), el("span", { text: "public offers from the catalog", style: "font-size:12px;color:var(--ink-3)" })])]);
        model.memberships.forEach(function (item, index) { memberships.appendChild(rateRow(item, index)); });
        memberships.appendChild(el("div", { className: "catalog-note", style: "margin-top:10px" }, [document.createTextNode("These are published offers — not your membership or a balance. Joining or managing a plan happens with our team. "), el("button", { className: "link-action", type: "button", text: "Ask about membership ›", onClick: openSupport })]));
        page.appendChild(memberships);
        page.appendChild(el("div", { className: "catalog-note", text: "Every price on this page comes from the public catalog — nothing is calculated, estimated or compared here." }));
      }
      return page;
    }

    function productsPage(items) {
      var commerceOpen = config.retail === "retail-commerce-open";
      var page = el("section", { className: "page", dataset: { route: "products", state: model.status, visualId: "spa-shop", module: "spa-shop", retail: config.retail, screenLabel: commerceOpen ? "Shop (simulated checkout)" : "Shop (browse-only)" } });
      page.appendChild(el("div", { className: "section-head", style: "display:flex;align-items:flex-end;gap:14px;flex-wrap:wrap" }, [el("div", { style: "flex:1;min-width:220px" }, [el("div", { style: "display:flex;align-items:center;gap:10px" }, [el("div", { className: "section-head__title", text: "Spa shop" }), commerceOpen ? null : el("span", { className: "readonly-chip", text: "Browse-only", style: "margin-left:0" })]), el("div", { className: "section-head__sub", text: "Retail from the public catalog — the products our specialists use." })]), actionLink("Services & prices ›", "link-action", "nav.go", "shop-services", "#/services") ]));
      if (model.status === "loading") { page.appendChild(gridSkeleton("spa-shop-grid", 4, 150)); return page; }
      if (model.status === "error") { page.appendChild(errorState("Couldn't load the shelf", "Retail products didn't load, so nothing stale is shown. Nothing was changed — try again.")); return page; }
      if (!items.length) { page.appendChild(emptyState("□", "The shelf is empty right now", "No retail products are published in the catalog at the moment — nothing is invented in the meantime.")); return page; }
      var grid = el("div", { className: "spa-shop-grid", dataset: { module: "spa-shop-list", visualId: "spa-shop-list" } });
      items.forEach(function (item) { grid.appendChild(productCard(item, commerceOpen)); });
      page.appendChild(grid);
      page.appendChild(el("div", { className: "catalog-note", text: commerceOpen
        ? "Prices come from the public catalog. Buying opens a demonstration checkout — no card is requested and no charge is made."
        : "Prices as published in the public catalog. There's no cart or checkout here — nothing on this page starts a purchase." }));
      return page;
    }

    function serviceCard(item) {
      return el("div", { className: "card card--pad spa-svc-card", dataset: { module: "spa-service-card", visualId: "spa-service-card", productCode: item.code } }, [
        el("div", { text: item.name, style: "font-weight:700;font-size:16px;letter-spacing:-.01em;overflow-wrap:anywhere", dataset: { bind: "pim.services[].name" } }),
        el("div", { text: item.description, style: "font-size:13px;color:var(--ink-2);margin-top:4px;line-height:1.5", dataset: { bind: "pim.services[].shortDescription" } }),
        el("div", { className: "spa-svc-card__price" }, [el("b", { text: item.price, dataset: { bind: "pim.services[].displayPrice" } }), item.interval ? el("span", { text: " / " + item.interval.toLowerCase(), dataset: { bind: "pim.services[].interval" } }) : null]),
        el("div", { className: "spa-svc-card__foot" }, [el("span", { className: "code-chip", text: item.code, style: "margin-left:0", dataset: { bind: "pim.services[].code" } }), actionLink("See in the price list ›", "link-action", "nav.go", "spa-svc-pricing", "#/pricing")]),
      ]);
    }

    function rateRow(item, index) {
      var palette = [["var(--accent)", "rgba(var(--accent-rgb),.12)"], ["#1f8a44", "rgba(52,199,89,.16)"], ["#ff8a3d", "rgba(255,159,10,.16)"], ["#7a52e0", "rgba(122,82,224,.16)"]][index % 4];
      return el("div", { className: "rate-row", dataset: { module: "spa-pricing-row", visualId: "spa-pricing-row", productCode: item.code } }, [el("div", { className: "rate-row__icon", style: "background:" + palette[1] }, [el("i", { style: "background:" + palette[0] })]), el("div", { style: "flex:1;min-width:0" }, [el("div", { text: item.name, style: "font-weight:600;font-size:14px;overflow-wrap:anywhere" }), el("div", { text: item.description, style: "font-size:12px;color:var(--ink-2)" })]), el("div", { text: item.price + (item.interval ? " / " + item.interval.toLowerCase() : ""), style: "font-weight:700;font-size:15px;white-space:nowrap" })]);
    }

    function productCard(item, commerceOpen) {
      return el("div", { className: "card card--pad spa-shop-card", dataset: { module: "spa-shop-card", visualId: "spa-shop-card", productCode: item.code, state: commerceOpen ? "sellable" : "browse-only" } }, [
        el("div", { text: item.name, style: "font-weight:700;font-size:14.5px;overflow-wrap:anywhere", dataset: { bind: "pim.products[].name" } }),
        el("div", { text: item.description || item.code, style: "font-size:12.5px;color:var(--ink-2);margin-top:3px;line-height:1.45", dataset: { bind: "pim.products[].shortDescription" } }),
        el("div", { style: "display:flex;align-items:center;gap:8px;margin-top:10px;flex-wrap:wrap" }, [el("b", { text: item.price, style: "font-size:15px", dataset: { bind: "pim.products[].displayPrice" } }), el("span", { className: "code-chip", text: item.code, style: "margin-left:auto", dataset: { bind: "pim.products[].code" } })]),
        commerceOpen ? el("div", { style: "margin-top:14px" }, [actionButton("Buy", "btn btn--primary btn--block", "checkout.start", "shop-buy-" + item.code, function () { startCheckout(item); })]) : null,
      ]);
    }

    function simulationNotice() {
      return el("div", { className: "sim-badge sim-badge--block", role: "note", dataset: { module: "simulation-notice", visualId: "simulation-notice", bind: "checkout.paymentMode" } }, [
        el("i", { className: "sim-badge__dot" }), el("b", { text: "Simulation" }), document.createTextNode(" — no charge will be made"),
      ]);
    }

    function startCheckout(item) {
      model.checkout = { item: item, policyAccepted: false, state: "ready" };
      location.hash = "#/checkout";
      render();
    }

    function checkoutPage() {
      var checkout = model.checkout;
      var page = el("section", { className: "page", dataset: { route: "checkout", state: checkout.state, visualId: "spa-checkout", module: "spa-checkout", paymentMode: "SIMULATED", retail: config.retail, screenLabel: "Checkout (simulated)" } });
      if (!checkout.item) {
        page.appendChild(emptyState("□", "There’s nothing to check out", "Choose a product in the Spa shop to start the demonstration checkout.", actionLink("Back to the shop", "btn btn--ghost", "nav.products", "checkout-empty-shop", "#/products")));
        return page;
      }
      if (checkout.state === "confirmed") {
        page.appendChild(el("div", { style: "max-width:560px;margin:26px auto 0" }, [
          el("div", { className: "card card--pad co-confirm", dataset: { module: "spa-confirmation", visualId: "spa-confirmation", state: "confirmed", resultKind: "retail-demo" } }, [
            el("div", { className: "co-confirm__glyph", text: "✓" }),
            el("div", { className: "co-confirm__title", text: "Order confirmed" }),
            el("div", { className: "co-confirm__sub", text: "Demo checkout completed — no charge was made." }),
            simulationNotice(),
            el("div", { className: "appt-details", style: "margin-top:14px;text-align:left" }, [
              el("div", { className: "appt-details__row" }, [el("div", { className: "appt-details__label", text: "Item" }), el("div", { className: "appt-details__val" }, [el("b", { text: checkout.item.name }), document.createTextNode(" · " + checkout.item.price)])]),
              el("div", { className: "appt-details__row" }, [el("div", { className: "appt-details__label", text: "Reference" }), el("div", { className: "appt-details__val", text: "DEMO-" + checkout.item.code })]),
            ]),
            el("div", { className: "appt-hero__actions", style: "justify-content:center" }, [actionLink("Back to the shop", "btn btn--primary", "nav.products", "confirm-shop", "#/products"), actionLink("See your orders", "btn btn--ghost", "nav.go", "confirm-orders", "#/orders")]),
          ]),
        ]));
        return page;
      }
      page.appendChild(el("div", { className: "detail-back" }, [actionLink("‹ Back to the shop", "link-action", "nav.products", "checkout-back", "#/products")]));
      page.appendChild(heading("Review & confirm", "Check the demo order below — nothing is ordered until you confirm."));
      var grid = el("div", { className: "purch-grid" });
      grid.appendChild(el("div", { className: "card card--pad", dataset: { module: "checkout-lines", visualId: "checkout-lines" } }, [
        el("div", { className: "card__title", text: "Your order" }),
        el("div", { className: "co-line", dataset: { productRef: checkout.item.code } }, [el("span", { style: "flex:1;min-width:0", text: checkout.item.name + " × 1" }), el("b", { text: checkout.item.price })]),
        el("div", { className: "purch-ful__note", text: "Pickup details are confirmed by the studio after this demonstration order." }),
      ]));
      var confirm = el("div", { className: "card card--pad", dataset: { module: "checkout-payment", visualId: "checkout-payment", paymentMode: "SIMULATED" } }, [
        el("div", { className: "card__title", text: "Total & confirmation" }),
        el("div", { className: "money-rows" }, [el("div", { className: "money-rows__row money-rows__row--total" }, [el("span", { text: "Total" }), el("span", { text: checkout.item.price })])]),
        simulationNotice(),
        el("div", { className: "purch-ful__note", text: "This is a demonstration checkout. No card is requested, no money moves and no receipt is created." }),
        el("div", { style: "margin-top:12px" }, [actionButton(checkout.policyAccepted ? "✓ Simulation understood" : "I understand this is a simulation", "btn btn--ghost btn--block", "checkout.ackPolicy", "policy-ack", function () { model.checkout.policyAccepted = !model.checkout.policyAccepted; render(); })]),
        el("div", { style: "margin-top:10px" }, [el("button", { className: "btn btn--primary btn--block btn--lg", type: "button", text: checkout.state === "pending" ? "Confirming…" : "Confirm order", disabled: !checkout.policyAccepted || checkout.state === "pending", dataset: { module: "action-button", action: "checkout.confirm", visualId: "checkout-confirm" }, onClick: confirmCheckout })]),
      ]);
      grid.appendChild(confirm);
      page.appendChild(grid);
      return page;
    }

    function confirmCheckout() {
      if (!model.checkout.item || !model.checkout.policyAccepted || model.checkout.state === "pending") return;
      model.checkout.state = "pending";
      render();
      window.setTimeout(function () { model.checkout.state = "confirmed"; render(); }, 650);
    }

    function supportUnavailable() {
      return el("div", { className: "spa-support-scrim" }, [el("div", { className: "spa-support-card", role: "dialog", ariaLabel: "Support unavailable", dataset: { module: "support-unavailable", visualId: "support-unavailable", state: "unavailable" } }, [el("div", { className: "state-block__glyph", text: "✉" }), el("div", { className: "state-block__title", text: "Support isn't set up yet" }), el("div", { className: "state-block__desc", text: "A support contact hasn't been set up for this portal, so nothing was opened, sent or recorded. For now, please reach the studio the way you usually do." }), actionButton("Close", "btn btn--primary", "support.dismiss", "support-dismiss", function () { model.supportOpen = false; render(); })])]);
    }
    function openSupport() { model.accountMenu = false; model.mobileNav = false; model.supportOpen = true; render(); }
    function customerName() { return model.customer.account && model.customer.account.displayName || displayName(model.auth.user); }
    function greeting() { var first = customerName().trim().split(/\s+/, 1)[0] || "there"; return "Good afternoon, " + first; }
    function heading(title, copy) { return el("div", { className: "page-header", dataset: { module: "page-header", visualId: "page-header" } }, [el("div", null, [el("h1", { className: "page-header__title", text: title, dataset: { bind: "page.title" } }), el("div", { className: "page-header__sub", text: copy, dataset: { bind: "page.subtitle" } })])]); }
    function emptyState(glyph, title, copy, action) { return el("div", { className: "state-block", dataset: { state: "empty" } }, [el("div", { className: "state-block__glyph", text: glyph }), el("div", { className: "state-block__title", text: title }), el("div", { className: "state-block__desc", text: copy }), action]); }
    function errorState(title, copy) { return el("div", { className: "state-block", dataset: { state: "error" } }, [el("div", { className: "state-block__glyph", text: "!" }), el("div", { className: "state-block__title", text: title }), el("div", { className: "state-block__desc", text: copy })]); }
    function gridSkeleton(className, count, height) { var grid = el("div", { className: className, ariaBusy: "true", dataset: { state: "loading" } }); for (var index = 0; index < count; index += 1) grid.appendChild(el("div", { className: "skeleton", style: "height:" + height + "px;border-radius:20px" })); return grid; }

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

    function positionNavPill(shell) {
      var links = shell.querySelector(".nav-links"), pill = links && links.querySelector("[data-nav-pill]"), active = links && links.querySelector(".nav-link--active");
      if (!pill || !active || window.getComputedStyle(links).display === "none") return;
      pill.style.opacity = "1";
      pill.style.width = active.offsetWidth + "px";
      pill.style.transform = "translateX(" + active.offsetLeft + "px)";
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
      retail: root.getAttribute("data-portal-retail") || "browse-only",
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
        currencyCode: currencyCode,
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
    var serviceRows = await loadTypes(config.pricingTypes.slice(0, 1), config);
    var membershipRows = config.pricingTypes.length > 1 ? await loadTypes(config.pricingTypes.slice(1), config) : [];
    var productRows = await loadTypes(config.productTypes, config);
    return { services: normalize(serviceRows, config), memberships: normalize(membershipRows, config), products: normalize(productRows, config) };
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
    if (value === "services" && config.enabledModules.includes("pricing")) return value;
    if (config.enabledModules.includes(value) && ["orders", "pricing", "products", "account", "checkout"].includes(value)) return value;
    return config.enabledModules.includes(config.defaultRoute) ? config.defaultRoute : "pricing";
  }
  function navLink(id, label, current, secondary) {
    var active = id === current || id === "services" && current === "pricing";
    return el("a", { className: "nav-link" + (secondary ? " nav-link--secondary" : "") + (active ? " nav-link--active" : ""), href: "#/" + id, text: label, dataset: { state: active ? "active" : undefined } });
  }
  function tabLink(id, label, current) { return el("a", { className: "tab" + (id === current ? " tab--active" : ""), href: "#/" + id, text: label }); }
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
    if (options.ariaExpanded) node.setAttribute("aria-expanded", options.ariaExpanded);
    if (options.role) node.setAttribute("role", options.role);
    if (options.title) node.title = options.title;
    if (options.dataset) Object.keys(options.dataset).forEach(function (key) { if (options.dataset[key] !== undefined && options.dataset[key] !== null) node.dataset[key] = options.dataset[key]; });
    if (options.onClick) node.addEventListener("click", options.onClick);
    (children || []).forEach(function (child) { if (child) node.appendChild(child); });
    return node;
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true }); else boot();
}());
