(function (global) {
  "use strict";

  var ns = global.PlanSubscription || (global.PlanSubscription = {});
  var core = ns.core;
  var ui = ns.ui;
  var el = core.el;

  var CLOSED = [401, 403, 404];
  var PAYMENT_SECRET = /^pi_[A-Za-z0-9]+_secret_[A-Za-z0-9]+$/;
  var PUBLISHABLE_KEY = /^pk_(test|live)_[A-Za-z0-9]+$/;
  var TEST_CARDS = [
    { key: "payTestSuccess", number: "4242 4242 4242 4242" },
    { key: "payTestSecure", number: "4000 0027 6000 3184" },
    { key: "payTestDeclined", number: "4000 0000 0000 0002" },
  ];

  function grantUrl(base, token, tail, service) {
    return base + "/" + (service || "core-bill") + "/i/" + encodeURIComponent(token) + "/" + tail;
  }

  function read(fetchImpl, url) {
    return core.request(fetchImpl, url, { method: "POST", body: {} }).then(function (result) {
      if (result.status >= 200 && result.status < 300 && result.payload && typeof result.payload === "object") return result.payload;
      if (CLOSED.indexOf(result.status) !== -1) throw core.failure("closed", result.status);
      throw core.failure("failed", result.status);
    });
  }

  function productName(price, locale) {
    return price && price.product ? core.nls(price.product.nls, locale) : "";
  }

  function normalize(order, items, grant, locale, copy, prices) {
    var priceById = prices || {};
    var currency = order.currency && order.currency.code || "";
    var state = Array.isArray(order.states) && order.states[0] || null;
    var lines = items.slice().sort(function (a, b) { return Number(a.id) - Number(b.id); }).map(function (item) {
      var unit = core.toCents(item.amount);
      var count = Number.isInteger(item.itemCount) ? item.itemCount : null;
      return {
        id: item.id,
        name: productName(priceById[item.itemPrice && item.itemPrice.id], locale) || core.nls(item.itemPrice && item.itemPrice.nls, locale) || core.nls(item.type && item.type.nls, locale) || "#" + item.id,
        quantity: count,
        unit: unit,
        amount: unit !== null && count !== null ? unit * count : null,
      };
    });
    var taxes = core.toCents(order.totalTaxes);
    return {
      id: order.id,
      currency: currency,
      stateCode: state && state.code || "",
      stateName: state ? (copy.states[state.code] || core.nls(state.nls, locale) || state.code) : "",
      lines: lines,
      subtotal: core.toCents(order.totalCharges),
      taxes: taxes,
      total: taxes === null ? null : core.toCents(order.grandTotal),
      expiresAt: grant && (typeof grant.expiresAt === "string" || typeof grant.expiresAt === "number") ? grant.expiresAt : "",
    };
  }

  function open(location, history) {
    var values = core.fragment(location && location.hash);
    core.scrubFragment(location, history);
    return {
      token: core.acceptableToken(values.token) ? values.token : "",
      orderId: /^[1-9][0-9]{0,17}$/.test(String(values.orderId || "")) ? values.orderId : "",
      secret: PAYMENT_SECRET.test(String(values.pay || "")) ? values.pay : "",
    };
  }

  function publishableKey(value) {
    var text = String(value == null ? "" : value).trim();
    return PUBLISHABLE_KEY.test(text) ? text : "";
  }

  function payment(stateCode, secret, stripeKey, factory) {
    if (stateCode === "ACTIVE") return "paid";
    if (secret && publishableKey(stripeKey) && typeof factory === "function") return "pay";
    return "none";
  }

  function mount(root, options) {
    var settings = options || {};
    var copy = ns.copy.merge(ns.copy.defaults.order, settings.copy);
    var fetchImpl = settings.fetch || (global.fetch && global.fetch.bind(global));
    var base = core.apiBase(settings.apiBase, global.location);
    var locale = settings.locale || (global.document.documentElement.lang || "en");
    var location = settings.location || global.location;
    var onHash = settings.location ? null : function () {
      if (core.acceptableToken(core.fragment(global.location.hash).token)) global.location.reload();
    };
    if (onHash) global.addEventListener("hashchange", onHash);
    var link = open(location, settings.history || global.history);
    var token = link.token;
    var orderId = link.orderId;
    var stripeKey = publishableKey(settings.stripeKey);
    var contactHref = settings.contactHref || "";
    var alive = true;
    var card = null;
    var shell = el("div", "df-wrapper ps ps--order", { dataset: { psScreen: "order", state: "loading" } });
    root.replaceChildren(shell);

    function money(cents, currency) {
      return core.money(cents, currency, locale);
    }

    function status(phase) {
      shell.dataset.state = phase;
      var view;
      if (phase === "loading") view = ui.loader(copy.loading);
      else if (phase === "closed") view = ui.status({ tone: "info", state: "unauthorized", icon: "lock", title: copy.closedTitle, body: copy.closedBody, actions: contactHref ? [ui.link(copy.contact, contactHref, "ghost")] : [] });
      else if (phase === "failed") view = ui.status({ tone: "error", state: "error", title: copy.failedTitle, body: copy.failedBody, actions: [ui.button(copy.retry, "primary", { onclick: load })] });
      else view = ui.status({ tone: "info", state: "unauthorized", icon: "lock", title: copy.missingTitle, body: copy.missingBody });
      shell.replaceChildren(view);
    }

    function releaseCard() {
      if (card && typeof card.destroy === "function") card.destroy();
      card = null;
    }

    function note(text, icon, variant) {
      return el("p", "ps-note" + (variant ? " ps-note--" + variant : ""), null, [ui.icon(icon), el("span", null, { text: text })]);
    }

    function paidNotice(title, body) {
      return el("div", "ps-paid", { role: "status", dataset: { state: "paid", visualId: "plan-subscription-paid" } }, [
        el("div", "ps-paid__icon", null, [ui.icon("check")]),
        el("div", "ps-paid__text", null, [
          el("p", "ps-paid__title", { text: title, tabindex: "-1" }),
          el("p", "ps-paid__body", { text: body }),
        ]),
      ]);
    }

    function payLabel(view) {
      return view.total === null ? copy.payActionPlain : core.fill(copy.payAction, { amount: money(view.total, view.currency) });
    }

    function cardStyle() {
      var light = global.document.documentElement.getAttribute("data-theme") === "light";
      return {
        base: {
          color: light ? "#14161c" : "#ffffff",
          iconColor: light ? "#4f95ff" : "#6beaf9",
          fontFamily: "\"Vela Sans\", system-ui, -apple-system, \"Segoe UI\", sans-serif",
          fontSize: "17px",
          fontSmoothing: "antialiased",
          "::placeholder": { color: light ? "#5c6474" : "#97a2b8" },
        },
        invalid: { color: "#ff6c56", iconColor: "#ff6c56" },
      };
    }

    function testCards() {
      return el("div", "ps-pay__test", null, [
        el("p", "ps-pay__test-hint", { text: copy.payTestHint }),
        el("ul", "ps-pay__test-cards", null, TEST_CARDS.map(function (entry) {
          return el("li", "ps-pay__test-card", null, [
            el("span", null, { text: copy[entry.key] }),
            el("code", "ps-pay__test-number", { dir: "ltr", text: entry.number }),
          ]);
        })),
      ]);
    }

    function paymentPanel(view, holder, factory) {
      var stripe = factory(stripeKey, { locale: String(locale).toLowerCase().split("-")[0] || "auto" });
      card = stripe.elements().create("card", { style: cardStyle() });
      var element = card;
      var busy = false;
      var host = el("div", "ps-pay__card", { role: "group", "aria-labelledby": "ps-pay-card-label" });
      var error = el("div", "df-error ps-pay__error", { id: "ps-pay-error", role: "alert", dir: "auto" });
      var action = ui.button(payLabel(view), "primary", { "aria-describedby": "ps-pay-error" });
      var panel = el("section", "ps-pay", { "aria-labelledby": "ps-pay-title", dataset: { state: "ready", visualId: "plan-subscription-payment" } }, [
        el("div", "ps-pay__head", null, [
          el("h4", "ps-pay__title", { id: "ps-pay-title", text: copy.payTitle }),
          stripeKey.indexOf("pk_test_") === 0 ? el("span", "ps-pay__badge", { text: copy.payTestMode }) : null,
        ]),
        el("p", "ps-pay__note", null, [ui.icon("lock"), el("span", null, { text: copy.payNote })]),
        stripeKey.indexOf("pk_test_") === 0 ? testCards() : null,
        el("div", "ps-pay__field", null, [
          el("span", "df-label ps-pay__label", { id: "ps-pay-card-label", text: copy.payCardLabel }),
          host,
          error,
        ]),
        el("div", "ps-pay__actions", null, [action]),
      ]);

      function setBusy(on) {
        busy = on;
        panel.dataset.state = on ? "processing" : "ready";
        action.disabled = on;
        action.textContent = on ? copy.payProcessing : payLabel(view);
        if (on) action.setAttribute("aria-busy", "true");
        else action.removeAttribute("aria-busy");
        if (typeof element.update === "function") element.update({ disabled: on });
      }

      function fail(message) {
        setBusy(false);
        panel.dataset.state = "failed";
        error.textContent = message ? core.clip(message) : copy.payFailed;
      }

      function paid() {
        releaseCard();
        holder.replaceChildren(paidNotice(copy.payDoneTitle, copy.payDoneBody));
        var title = holder.querySelector(".ps-paid__title");
        if (title) title.focus({ preventScroll: true });
      }

      action.addEventListener("click", function () {
        if (busy || !alive || card !== element) return;
        error.textContent = "";
        setBusy(true);
        new Promise(function (resolve) {
          resolve(stripe.confirmCardPayment(link.secret, { payment_method: { card: element } }));
        }).then(function (result) {
          if (!alive || card !== element) return;
          var outcome = result || {};
          var intent = outcome.paymentIntent || (outcome.error && outcome.error.payment_intent);
          if (intent && intent.status === "succeeded") return paid();
          fail(outcome.error && outcome.error.message);
        }, function () {
          if (alive && card === element) fail("");
        });
      });

      element.on("change", function (event) {
        if (busy) return;
        error.textContent = event && event.error && event.error.message ? core.clip(event.error.message) : "";
        if (!error.textContent && panel.dataset.state === "failed") panel.dataset.state = "ready";
      });

      return { node: panel, mount: function () { element.mount(host); } };
    }

    function settlement(view) {
      var factory = settings.stripe || global.Stripe;
      var mode = payment(view.stateCode, link.secret, stripeKey, factory);
      if (mode === "paid") return { node: paidNotice(copy.paidTitle, copy.paidBody) };
      if (mode === "pay") {
        var holder = el("div", "ps-settle");
        try {
          var panel = paymentPanel(view, holder, factory);
          holder.append(note(copy.payableNote, "lock", "info"), panel.node);
          return { node: holder, mount: panel.mount };
        } catch (_) {
          releaseCard();
        }
      }
      return { node: note(copy.draftNote, "alert") };
    }

    function render(view, partial) {
      shell.dataset.state = partial ? "partial" : "ready";
      releaseCard();
      var settle = settlement(view);
      var rows = view.lines.map(function (line) {
        return el("li", "ps-order__line", { dataset: { item: String(line.id) } }, [
          el("div", "ps-order__item", null, [
            el("span", "ps-order__name", { text: line.name }),
            line.unit !== null ? el("span", "ps-order__unit", { text: core.fill(copy.unitPrice, { price: money(line.unit, view.currency) }) }) : null,
          ]),
          el("span", "ps-order__qty", { text: line.quantity === null ? "—" : "× " + core.integer(line.quantity, locale) }),
          el("span", "ps-order__amount", { text: line.amount === null ? "—" : money(line.amount, view.currency) }),
        ]);
      });
      var totals = el("dl", "ps-order__totals", null, [
        el("div", "ps-order__total-row", null, [el("dt", null, { text: copy.subtotal }), el("dd", null, { text: view.subtotal === null ? "—" : money(view.subtotal, view.currency) })]),
        el("div", "ps-order__total-row", null, [el("dt", null, { text: copy.taxes }), el("dd", view.taxes === null ? "ps-order__pending" : null, { text: view.taxes === null ? copy.taxesPending : money(view.taxes, view.currency) })]),
        el("div", "ps-order__total-row ps-order__total-row--grand", null, [el("dt", null, { text: copy.total }), el("dd", view.total === null ? "ps-order__pending" : null, { text: view.total === null ? copy.totalPending : money(view.total, view.currency) })]),
      ]);
      var expires = core.date(view.expiresAt, locale);
      shell.replaceChildren(el("article", "ps-order", { "aria-labelledby": "ps-order-title", dataset: { visualId: "plan-subscription-order" } }, [
        el("header", "ps-order__head", null, [
          el("div", null, null, [
            el("p", "ps-order__number", { text: core.fill(copy.orderNumber, { id: view.id }) }),
            el("h3", "ps-order__title", { id: "ps-order-title", text: copy.title, tabindex: "-1" }),
          ]),
          view.stateName ? el("span", "ps-chip ps-chip--" + String(view.stateCode || "unknown").toLowerCase(), { text: view.stateName }) : null,
        ]),
        partial ? ui.banner(copy.partial) : null,
        el("div", "ps-order__columns", { "aria-hidden": "true" }, [
          el("span", null, { text: copy.columnItem }),
          el("span", null, { text: copy.columnQuantity }),
          el("span", null, { text: copy.columnAmount }),
        ]),
        el("ul", "ps-order__lines", null, rows),
        totals,
        settle.node,
        expires ? el("p", "ps-order__expires", null, [ui.icon("lock"), el("span", null, { text: core.fill(copy.expires, { date: expires }) })]) : null,
      ]));
      if (settle.mount) settle.mount();
    }

    function load() {
      status("loading");
      Promise.all([
        read(fetchImpl, grantUrl(base, token, "introspect.json")),
        read(fetchImpl, grantUrl(base, token, "order/get.json") + "?id=" + encodeURIComponent(orderId)),
      ]).then(function (results) {
        var grant = results[0];
        var order = results[1];
        if (String(order.id) !== String(orderId)) throw core.failure("closed", 404);
        var ids = (Array.isArray(order.items) ? order.items : []).map(function (item) { return item && item.id; }).filter(Boolean);
        return Promise.all(ids.map(function (id) {
          return read(fetchImpl, grantUrl(base, token, "order-item/get.json") + "?id=" + encodeURIComponent(id)).then(function (item) {
            return item && String(item.order && item.order.id) === String(order.id) ? item : null;
          }, function (error) {
            if (error && error.code === "closed" && error.status === 401) throw error;
            return null;
          });
        })).then(function (items) {
          var loaded = items.filter(Boolean);
          var priceIds = loaded.map(function (item) { return item.itemPrice && item.itemPrice.id; })
            .filter(function (id, index, all) { return id && all.indexOf(id) === index; });
          return Promise.all(priceIds.map(function (id) {
            return read(fetchImpl, grantUrl(base, token, "product-price/get.json", "core-pim") + "?id=" + encodeURIComponent(id)).then(function (price) {
              return price && String(price.id) === String(id) ? price : null;
            }, function () { return null; });
          })).then(function (found) {
            var prices = {};
            found.forEach(function (price) { if (price) prices[price.id] = price; });
            return { loaded: loaded, prices: prices };
          });
        }).then(function (result) {
          if (!alive) return;
          var loaded = result.loaded;
          render(normalize(order, loaded, grant, locale, copy, result.prices), loaded.length !== ids.length);
          var title = shell.querySelector(".ps-order__title");
          if (title) title.focus({ preventScroll: true });
        });
      }).then(null, function (error) {
        if (!alive) return;
        status(error && error.code === "closed" ? "closed" : "failed");
      });
    }

    if (!token || !orderId || !base || typeof fetchImpl !== "function") status("missing");
    else load();

    return {
      stop: function () {
        alive = false;
        releaseCard();
        if (onHash) global.removeEventListener("hashchange", onHash);
        root.replaceChildren();
      },
    };
  }

  ns.order = Object.freeze({ mount: mount, normalize: normalize, open: open, publishableKey: publishableKey, payment: payment });
})(typeof window !== "undefined" ? window : globalThis);
