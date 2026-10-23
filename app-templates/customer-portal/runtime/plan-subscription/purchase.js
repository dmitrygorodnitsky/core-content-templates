(function (global) {
  "use strict";

  var ns = global.PlanSubscription || (global.PlanSubscription = {});
  var core = ns.core;
  var ui = ns.ui;
  var rules = ns.selection;
  var el = core.el;

  var FORM_TYPE_CODE = "PLAN_SUBSCRIPTION";

  function loadFormType(fetchImpl, base, code) {
    return core.request(fetchImpl, base + "/core-cms/api/form-type/" + encodeURIComponent(code) + "/get.json").then(function (result) {
      if (result.status < 200 || result.status >= 300) throw core.failure("form-type", result.status, core.messageOf(result.payload));
      var payload = result.payload;
      if (!payload || typeof payload !== "object") throw core.failure("form-type", result.status);
      if (!Number.isInteger(payload.id) || payload.code !== code) throw core.failure("form-type-shape", result.status);
      return payload.id;
    });
  }

  function presetFrom(search) {
    var params;
    try {
      params = new URLSearchParams(search || "");
    } catch (_) {
      return {};
    }
    var period = String(params.get("period") || "").toUpperCase();
    return { plan: params.get("plan") || "", period: period === "YEARLY" || period === "ANNUAL" ? "YEARLY" : period === "MONTHLY" ? "MONTHLY" : "" };
  }

  function mount(root, options) {
    var settings = options || {};
    var copy = ns.copy.merge(ns.copy.defaults.purchase, settings.copy);
    var fetchImpl = settings.fetch || (global.fetch && global.fetch.bind(global));
    var base = core.apiBase(settings.apiBase, global.location);
    var locale = settings.locale || (global.document.documentElement.lang || "en");
    var organizationId = Number(settings.organizationId);
    var salesHref = settings.salesHref || "request-demo.html";
    var alive = true;
    var refs = {};
    var state = {
      phase: "loading",
      step: 0,
      catalog: null,
      typeId: null,
      selection: null,
      weatherRaw: "",
      contact: {},
      errors: {},
      submitError: "",
      email: "",
    };

    var shell = el("div", "df-wrapper ps", { dataset: { psScreen: "purchase", state: "loading" } });
    var live = el("p", "ps-visually-hidden", { role: "status", "aria-live": "polite", "aria-atomic": "true" });
    root.replaceChildren(shell, live);

    function periodWord() {
      return state.selection && state.selection.period === "YEARLY" ? copy.perYear : copy.perMonth;
    }

    function price(cents) {
      return core.money(cents, state.catalog && state.catalog.currency, locale);
    }

    function setPhase(phase) {
      state.phase = phase;
      render();
    }

    function load() {
      setPhase("loading");
      if (!base || typeof fetchImpl !== "function" || !Number.isInteger(organizationId) || organizationId <= 0) {
        setPhase("unconfigured");
        return;
      }
      Promise.all([
        ns.catalog.load({ fetch: fetchImpl, apiBase: base, organizationCode: settings.organizationCode, rules: settings.rules, locale: locale }),
        loadFormType(fetchImpl, base, settings.formTypeCode || FORM_TYPE_CODE),
      ]).then(function (results) {
        if (!alive) return;
        state.catalog = results[0];
        state.typeId = results[1];
        if (!rules.selfServicePlans(state.catalog).length) {
          setPhase("unavailable");
          return;
        }
        state.selection = rules.initial(state.catalog, settings.preset || presetFrom(global.location && global.location.search));
        state.step = 0;
        setPhase("form");
      }, function (error) {
        if (!alive) return;
        setPhase(error && error.code === "form-type-shape" ? "unavailable" : "load-error");
      });
    }

    function render() {
      shell.dataset.state = state.phase;
      refs = {};
      if (state.phase === "loading") {
        shell.replaceChildren(ui.loader(copy.loading));
        return;
      }
      if (state.phase === "load-error") {
        shell.replaceChildren(ui.status({ tone: "error", state: "error", title: copy.loadErrorTitle, body: copy.loadErrorBody, actions: [ui.button(copy.retry, "primary", { onclick: load })] }));
        return;
      }
      if (state.phase === "unavailable") {
        shell.replaceChildren(ui.status({ tone: "info", state: "empty", icon: "doc", title: copy.unavailableTitle, body: copy.unavailableBody, actions: [ui.link(copy.salesOnlyAction, salesHref, "primary")] }));
        return;
      }
      if (state.phase === "unconfigured") {
        shell.replaceChildren(ui.status({ tone: "error", state: "disabled", icon: "lock", title: copy.unconfiguredTitle, body: copy.unconfiguredBody }));
        return;
      }
      if (state.phase === "done") {
        renderDone();
        return;
      }
      renderForm();
    }

    function renderDone() {
      var body = core.fill(copy.doneBody, { email: "\u0000" }).split("\u0000");
      var view = ui.status({
        tone: "success",
        state: "success",
        icon: "mail",
        visualId: "plan-subscription-sent",
        title: copy.doneTitle,
        body: [body[0], el("strong", "ps-email", { text: state.email }), body[1] || ""],
        extra: [
          el("ol", "ps-timeline", null, copy.doneSteps.map(function (text, index) {
            return el("li", "ps-timeline__item" + (index === 0 ? " ps-timeline__item--current" : ""), null, [
              el("span", "ps-timeline__num", { text: "0" + (index + 1) }),
              el("span", "ps-timeline__text", { text: text }),
            ]);
          })),
          el("p", "ps-status__hint", { text: copy.doneHint }),
        ],
        actions: [ui.button(copy.restart, "ghost", { onclick: restart })],
      });
      shell.replaceChildren(view);
      focusTitle();
    }

    function restart() {
      state.contact = {};
      state.errors = {};
      state.submitError = "";
      state.email = "";
      state.weatherRaw = "";
      state.selection = rules.initial(state.catalog, {});
      state.step = 0;
      setPhase("form");
    }

    function renderForm() {
      var submitting = state.phase === "submitting";
      var form = el("form", "df-form df-form--wizard ps-form", { novalidate: true, onsubmit: function (event) { event.preventDefault(); next(); } });
      var title = el("p", "df-multiple-section-title ps-step-title", { text: copy.stepIntro[state.step], tabindex: "-1" });
      refs.title = title;
      form.appendChild(title);
      var content = el("div", "df-step df-step--active ps-step", { dataset: { step: String(state.step) } });
      if (state.step === 0) planStep(content);
      if (state.step === 1) addonStep(content);
      if (state.step === 2) companyStep(content);
      form.appendChild(content);
      if (state.submitError) form.appendChild(ui.banner(copy.submitErrorTitle, state.submitError));
      var nav = el("div", "df-nav ps-nav");
      if (state.step > 0) nav.appendChild(ui.button(copy.back, "ghost", { onclick: back, disabled: submitting || null }));
      var last = state.step === copy.steps.length - 1;
      nav.appendChild(el("button", "df-btn df-btn--primary" + (last ? " df-submit" : ""), {
        type: "submit",
        disabled: submitting || null,
        "aria-busy": submitting ? "true" : null,
        text: submitting ? copy.submitting : last ? copy.submit : copy.next,
      }));
      form.appendChild(nav);
      shell.replaceChildren(ui.stepper(copy.steps, state.step), form);
    }

    function planStep(content) {
      var periods = el("div", "ps-period", { role: "radiogroup", "aria-label": copy.periodLabel });
      rules.periods.forEach(function (period) {
        var input = el("input", "ps-period__input", { type: "radio", name: "period", value: period, checked: state.selection.period === period || null });
        input.addEventListener("change", function () {
          state.selection = rules.normalize(state.catalog, Object.assign({}, state.selection, { period: period }));
          renderForm();
          var again = shell.querySelector('input[name="period"][value="' + period + '"]');
          if (again) again.focus();
        });
        periods.appendChild(el("label", "ps-period__option", null, [input, el("span", "ps-period__text", { text: period === "YEARLY" ? copy.yearly : copy.monthly })]));
      });
      content.appendChild(el("div", "df-field ps-field", null, [el("span", "df-label", { text: copy.periodLabel }), periods]));

      var list = el("div", "ps-plans", { role: "radiogroup", "aria-label": copy.steps[0] });
      state.catalog.plans.forEach(function (plan) {
        if (!plan.selfService) {
          list.appendChild(el("div", "ps-plan ps-plan--sales", { dataset: { plan: plan.code } }, [
            el("span", "ps-plan__body", null, [
              el("span", "ps-plan__head", null, [el("span", "ps-plan__name", { text: plan.name })]),
              plan.kicker ? el("span", "ps-plan__kicker", { text: plan.kicker }) : null,
              plan.description ? el("span", "ps-plan__desc", { text: plan.description }) : null,
            ]),
            el("span", "ps-plan__price ps-plan__price--sales", null, [
              el("span", "ps-plan__custom", { text: copy.salesOnlyPrice }),
              el("a", "ps-link ps-link--forward", { href: salesHref, text: copy.salesOnlyAction }),
            ]),
          ]));
          return;
        }
        var selected = plan.id === state.selection.planId;
        var input = el("input", "df-choice-input", { type: "radio", name: "plan", value: String(plan.id), checked: selected || null });
        input.addEventListener("change", function () {
          state.selection = rules.normalize(state.catalog, Object.assign({}, state.selection, { planId: plan.id }));
          list.querySelectorAll(".ps-plan").forEach(function (card) { card.classList.toggle("ps-plan--selected", card.dataset.plan === plan.code); });
          delete state.errors.plan;
          refs.planError.textContent = "";
        });
        var meta = [];
        if (plan.included !== null) meta.push(core.fill(copy.included, { count: core.integer(plan.included, locale) }));
        if (plan.maximum !== null) meta.push(core.fill(copy.upTo, { count: core.integer(plan.maximum, locale) }));
        list.appendChild(el("label", "ps-plan" + (selected ? " ps-plan--selected" : "") + (plan.featured ? " ps-plan--featured" : ""), { dataset: { plan: plan.code } }, [
          input,
          el("span", "df-choice-custom", { "aria-hidden": "true" }),
          el("span", "ps-plan__body", null, [
            el("span", "ps-plan__head", null, [
              el("span", "ps-plan__name", { text: plan.name }),
              plan.featured ? el("span", "ps-plan__badge", { text: copy.featured }) : null,
            ]),
            plan.kicker ? el("span", "ps-plan__kicker", { text: plan.kicker }) : null,
            plan.description ? el("span", "ps-plan__desc", { text: plan.description }) : null,
            meta.length ? el("span", "ps-plan__meta", { text: meta.join(" · ") }) : null,
          ]),
          el("span", "ps-plan__price", null, [
            el("strong", "ps-plan__amount", { text: price(plan.prices[state.selection.period]) }),
            el("span", "ps-plan__period", { text: periodWord() }),
          ]),
        ]));
      });
      content.appendChild(list);
      refs.planError = el("div", "df-error", { text: state.errors.plan ? copy.errors.plan : "" });
      content.appendChild(refs.planError);
    }

    function addonStep(content) {
      var available = rules.options(state.catalog, state.selection);
      if (!available.expansion && !available.weather) {
        content.appendChild(el("div", "ps-empty", { dataset: { state: "empty" } }, [ui.icon("doc"), el("p", null, { text: copy.noAddons })]));
        return;
      }
      if (available.expansion) content.appendChild(expansionCard(available));
      if (available.weather) content.appendChild(weatherCard(available));
    }

    function expansionCard(available) {
      var addon = available.expansion;
      var minus = el("button", "ps-qty__btn", { type: "button", "aria-label": copy.decrease, text: "−" });
      var plus = el("button", "ps-qty__btn", { type: "button", "aria-label": copy.increase, text: "+" });
      var value = el("input", "ps-qty__value", { type: "text", inputmode: "numeric", value: String(state.selection.packs), "aria-label": copy.packsLabel, id: "ps-packs" });
      function set(packs) {
        state.selection = rules.normalize(state.catalog, Object.assign({}, state.selection, { packs: packs }));
        value.value = String(state.selection.packs);
        refreshAddons();
      }
      minus.addEventListener("click", function () { set(state.selection.packs - 1); });
      plus.addEventListener("click", function () { set(state.selection.packs + 1); });
      value.addEventListener("change", function () {
        var parsed = Number(String(value.value).trim());
        set(Number.isInteger(parsed) ? parsed : state.selection.packs);
      });
      refs.minus = minus;
      refs.plus = plus;
      refs.capacityText = el("p", "ps-capacity__text");
      refs.capacityFill = el("span", "ps-capacity__fill");
      refs.capacityNote = el("p", "ps-hint ps-capacity__note");
      return el("div", "ps-addon", { dataset: { addon: "site-expansion" } }, [
        el("div", "ps-addon__head", null, [
          el("div", "ps-addon__info", null, [
            el("h3", "ps-addon__title", { text: addon.name || copy.expansionTitle }),
            el("p", "ps-addon__meta", { text: core.fill(copy.expansionUnit, { count: core.integer(addon.packSize, locale) }) + " · " + core.fill(copy.expansionPrice, { price: price(addon.prices[state.selection.period]), period: periodWord() }) }),
          ]),
          el("div", "ps-qty", { role: "group", "aria-label": copy.packsLabel }, [minus, value, plus]),
        ]),
        el("div", "ps-capacity", null, [
          el("div", "ps-capacity__bar", { "aria-hidden": "true" }, [refs.capacityFill]),
          refs.capacityText,
          refs.capacityNote,
        ]),
      ]);
    }

    function weatherCard(available) {
      var addon = available.weather;
      var toggle = el("input", "df-choice-input", { type: "checkbox", id: "ps-weather-toggle", checked: state.selection.weatherOn || null });
      var count = ui.field({
        id: "ps-weather-count",
        name: "WEATHER_PROPERTY_COUNT",
        label: copy.weatherCountLabel,
        type: "number",
        inputmode: "numeric",
        min: "1",
        max: available.capacity === null ? null : String(available.capacity),
        step: "1",
        required: true,
        value: state.weatherRaw,
        hint: available.capacity === null ? null : core.fill(copy.weatherCountHint, { count: core.integer(available.capacity, locale) }),
        error: state.errors.weather ? copy.errors[state.errors.weather] : "",
      });
      refs.weatherField = count;
      count.node.hidden = !state.selection.weatherOn;
      toggle.addEventListener("change", function () {
        state.selection = Object.assign({}, state.selection, { weatherOn: toggle.checked });
        count.node.hidden = !toggle.checked;
        if (toggle.checked && !state.weatherRaw) count.input.focus();
        delete state.errors.weather;
        ui.setFieldError(count, "");
        syncWeather();
      });
      count.input.addEventListener("input", function () {
        state.weatherRaw = count.input.value;
        syncWeather();
        if (state.errors.weather) validateWeather();
      });
      count.input.addEventListener("blur", validateWeather);
      return el("div", "ps-addon", { dataset: { addon: "weather" } }, [
        el("div", "ps-addon__head", null, [
          el("div", "ps-addon__info", null, [
            el("h3", "ps-addon__title", { text: addon.name || copy.weatherTitle }),
            el("p", "ps-addon__meta", { text: core.fill(copy.weatherPrice, { price: price(addon.prices[state.selection.period]), period: periodWord() }) }),
          ]),
        ]),
        el("label", "df-choice-label ps-toggle", { for: "ps-weather-toggle" }, [toggle, el("span", "df-choice-custom", { "aria-hidden": "true" }), el("span", null, { text: copy.weatherToggle })]),
        count.node,
        el("p", "ps-note", null, [ui.icon("alert"), el("span", null, { text: copy.weatherPending })]),
      ]);
    }

    function syncWeather() {
      var parsed = Number(String(state.weatherRaw).trim());
      state.selection = Object.assign({}, state.selection, { weather: Number.isInteger(parsed) && parsed > 0 ? parsed : 0 });
    }

    function validateWeather() {
      var errors = rules.validateAddons(state.catalog, state.selection, state.weatherRaw);
      if (errors.weather) state.errors.weather = errors.weather;
      else delete state.errors.weather;
      ui.setFieldError(refs.weatherField, errors.weather ? copy.errors[errors.weather] : "");
      return !errors.weather;
    }

    function refreshAddons() {
      var available = rules.options(state.catalog, state.selection);
      if (refs.capacityText && available.expansion) {
        var extra = state.selection.packs * available.packSize;
        refs.capacityText.textContent = available.included === null ? "" : core.fill(copy.capacityLine, {
          included: core.integer(available.included, locale),
          extra: core.integer(extra, locale),
          total: core.integer(available.capacity, locale),
        });
        var atLimit = available.maxPacks !== null && state.selection.packs >= available.maxPacks;
        refs.capacityNote.textContent = atLimit ? copy.capacityReached : available.maximum !== null ? core.fill(copy.capacityLimit, { count: core.integer(available.maximum, locale) }) : "";
        refs.capacityNote.classList.toggle("ps-capacity__note--limit", atLimit);
        var ratio = available.maximum ? Math.min(1, available.capacity / available.maximum) : 0;
        refs.capacityFill.style.width = Math.round(ratio * 100) + "%";
        refs.minus.disabled = state.selection.packs <= 0;
        refs.plus.disabled = atLimit;
      }
      if (refs.weatherField) {
        var input = refs.weatherField.input;
        if (available.capacity !== null) input.setAttribute("max", String(available.capacity));
        var hint = refs.weatherField.node.querySelector(".ps-hint");
        if (hint && available.capacity !== null) hint.textContent = core.fill(copy.weatherCountHint, { count: core.integer(available.capacity, locale) });
        if (state.selection.weatherOn && state.weatherRaw) validateWeather();
      }
    }

    function companyStep(content) {
      refs.fields = {};
      var make = function (code, extra) {
        var ref = ui.field(Object.assign({
          id: "ps-" + code.toLowerCase().replace(/_/g, "-"),
          name: code,
          value: state.contact[code] || "",
          required: rules.requiredFields.indexOf(code) !== -1,
          optionalLabel: rules.requiredFields.indexOf(code) === -1 ? copy.optional : null,
          error: state.errors[code] ? copy.errors[state.errors[code]] : "",
          maxlength: code === "EMAIL" ? "254" : "4096",
        }, extra));
        ref.input.addEventListener("input", function () {
          state.contact[code] = ref.input.value;
          if (state.errors[code]) {
            var errors = rules.validateContact(state.contact);
            if (errors[code]) state.errors[code] = errors[code];
            else delete state.errors[code];
            ui.setFieldError(ref, errors[code] ? copy.errors[errors[code]] : "");
          }
        });
        ref.input.addEventListener("blur", function () {
          if (!ref.input.value) return;
          var errors = rules.validateContact(state.contact);
          if (errors[code]) state.errors[code] = errors[code];
          else delete state.errors[code];
          ui.setFieldError(ref, errors[code] ? copy.errors[errors[code]] : "");
        });
        refs.fields[code] = ref;
        return ref.node;
      };
      content.appendChild(make("COMPANY_NAME", { label: copy.companyName, autocomplete: "organization" }));
      content.appendChild(make("COMPANY_ADDRESS", { label: copy.companyAddress, placeholder: copy.companyAddressPlaceholder, hint: copy.companyAddressHint, autocomplete: "street-address" }));
      content.appendChild(el("div", "ps-row", null, [
        make("FIRST_NAME", { label: copy.firstName, autocomplete: "given-name" }),
        make("LAST_NAME", { label: copy.lastName, autocomplete: "family-name" }),
      ]));
      content.appendChild(make("EMAIL", { label: copy.email, type: "email", hint: copy.emailHint, autocomplete: "email", inputmode: "email" }));
      content.appendChild(make("PHONE", { label: copy.phone, type: "tel", autocomplete: "tel", inputmode: "tel" }));
    }

    function focusTitle() {
      var target = shell.querySelector(".ps-step-title, .ps-status__title");
      if (target && typeof target.focus === "function") target.focus({ preventScroll: true });
      if (typeof shell.scrollIntoView === "function" && settings.scroll !== false) {
        var top = shell.getBoundingClientRect().top;
        if (top < 0 || top > global.innerHeight * 0.6) shell.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    function goTo(step) {
      state.step = step;
      state.submitError = "";
      renderForm();
      if (step === 1) refreshAddons();
      focusTitle();
      core.announce(live, copy.steps[step]);
    }

    function back() {
      if (state.step > 0) goTo(state.step - 1);
    }

    function next() {
      if (state.phase === "submitting") return;
      if (state.step === 0) {
        var plan = rules.options(state.catalog, state.selection).plan;
        if (!plan || !plan.selfService) {
          state.errors.plan = "plan";
          refs.planError.textContent = copy.errors.plan;
          return;
        }
        goTo(1);
        return;
      }
      if (state.step === 1) {
        var errors = rules.validateAddons(state.catalog, state.selection, state.weatherRaw);
        if (errors.weather) {
          state.errors.weather = errors.weather;
          ui.setFieldError(refs.weatherField, copy.errors[errors.weather]);
          if (refs.weatherField) refs.weatherField.input.focus();
          return;
        }
        if (errors.packs || errors.plan) return;
        goTo(2);
        return;
      }
      var contactErrors = rules.validateContact(state.contact);
      state.errors = Object.assign({}, contactErrors);
      Object.keys(refs.fields || {}).forEach(function (code) {
        ui.setFieldError(refs.fields[code], contactErrors[code] ? copy.errors[contactErrors[code]] : "");
      });
      var first = rules.contactFields.filter(function (code) { return contactErrors[code]; })[0];
      if (first) {
        refs.fields[first].input.focus();
        return;
      }
      submit();
    }

    function submit() {
      var values = rules.attributes(state.catalog, state.selection, state.contact);
      var body = rules.submitBody(state.typeId, organizationId, values);
      state.submitError = "";
      setPhase("submitting");
      core.request(fetchImpl, base + "/core-cms/api/form/submit.json", { method: "POST", body: body }).then(function (result) {
        if (!alive) return;
        if (result.status >= 200 && result.status < 300 && Number.isInteger(Number(result.payload)) && Number(result.payload) > 0) {
          state.email = values.EMAIL;
          setPhase("done");
          core.announce(live, copy.doneTitle);
          return;
        }
        state.submitError = core.clip(core.messageOf(result.payload)) || copy.submitErrorBody;
        setPhase("form");
        focusBanner();
      }, function () {
        if (!alive) return;
        state.submitError = copy.submitErrorBody;
        setPhase("form");
        focusBanner();
      });
    }

    function focusBanner() {
      var node = shell.querySelector(".ps-banner");
      if (node) node.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    load();

    return {
      stop: function () {
        alive = false;
        root.replaceChildren();
      },
      state: function () { return state; },
      go: function (step) { if (state.phase === "form") goTo(step); },
    };
  }

  ns.purchase = Object.freeze({ mount: mount, formTypeCode: FORM_TYPE_CODE, presetFrom: presetFrom });
})(typeof window !== "undefined" ? window : globalThis);
