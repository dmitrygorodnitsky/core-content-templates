(function () {
  "use strict";

  var html = document.documentElement;
  var pathLocale = (location.pathname.split("/")[1] || "").toLowerCase();
  if (!html.getAttribute("lang")) html.setAttribute("lang", /^[a-z]{2}$/.test(pathLocale) ? pathLocale : "en");
  if (!html.getAttribute("dir")) html.setAttribute("dir", ["ar", "fa", "he", "ur"].indexOf(html.getAttribute("lang")) !== -1 ? "rtl" : "ltr");
  html.classList.add("js");
  if (!html.dataset.theme) html.dataset.theme = "dark";

  function onReady(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }

  function initSurfaces(main) {
    var header = document.querySelector(".header");
    var footer = document.querySelector(".footer");
    var surfaces = Array.prototype.slice.call(main.querySelectorAll("[data-surface]"));
    var queued = false;
    var surfaceAt = function (y) {
      if (footer && footer.getBoundingClientRect().top <= y) return "dark";
      var hit = surfaces.filter(function (section) {
        var box = section.getBoundingClientRect();
        return box.top <= y && box.bottom > y;
      })[0];
      return hit ? hit.dataset.surface : "light";
    };
    var apply = function () {
      queued = false;
      var probe = header ? header.getBoundingClientRect().height / 2 : 0;
      var theme = surfaceAt(probe);
      if (html.dataset.theme !== theme) html.dataset.theme = theme;
    };
    var queue = function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(apply);
    };
    apply();
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
  }

  function initReveal(main, reduceMotion) {
    var items = main.querySelectorAll(".reveal");
    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      items.forEach(function (item) { item.classList.add("is-visible"); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (item) { observer.observe(item); });
  }

  function initFilms(main) {
    main.querySelectorAll(".film").forEach(function (film) {
      var video = film.querySelector("video");
      var button = film.querySelector(".play-film");
      if (!video || !button) return;
      var loadPoster = function () {
        if (video.dataset.poster && !video.getAttribute("poster")) video.setAttribute("poster", video.dataset.poster);
      };
      if ("IntersectionObserver" in window) {
        var observer = new IntersectionObserver(function (entries) {
          if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
          loadPoster();
          observer.disconnect();
        }, { rootMargin: "400px 0px" });
        observer.observe(film);
      } else {
        loadPoster();
      }
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", function () {
        loadPoster();
        if (video.paused) {
          video.controls = true;
          video.play().catch(function () {});
        } else {
          video.pause();
        }
      });
      video.addEventListener("play", function () {
        film.classList.add("is-playing");
        button.setAttribute("aria-pressed", "true");
      });
      video.addEventListener("pause", function () {
        film.classList.remove("is-playing");
        button.setAttribute("aria-pressed", "false");
      });
    });
  }

  function initDialog(main) {
    var dialog = document.querySelector(".shot-dialog");
    if (!dialog || typeof dialog.showModal !== "function") return;
    var dialogImage = dialog.querySelector("img");
    main.querySelectorAll(".zoom-shot").forEach(function (trigger) {
      trigger.addEventListener("click", function () {
        var source = trigger.querySelector("img");
        dialogImage.src = trigger.dataset.image;
        dialogImage.width = Number(trigger.dataset.width);
        dialogImage.height = Number(trigger.dataset.height);
        dialogImage.alt = source ? source.alt : "";
        dialog.showModal();
      });
    });
    dialog.querySelector(".shot-dialog-close").addEventListener("click", function () { dialog.close(); });
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog) dialog.close();
    });
  }

  function initComparison(main, reduceMotion) {
    var comparison = main.querySelector("#plan-comparison");
    if (!comparison) return;
    var open = function () {
      comparison.open = true;
      comparison.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "start" });
    };
    main.querySelectorAll("[data-compare-open]").forEach(function (link) {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        open();
        history.replaceState(null, "", "#plan-comparison");
      });
    });
    if (location.hash === "#plan-comparison") open();

    var included = comparison.dataset.includedLabel || "";
    comparison.querySelectorAll("td.cell").forEach(function (cell) {
      var holder = cell.querySelector(".cell-value");
      var value = holder ? holder.textContent.trim() : "";
      if (value === "✓") {
        cell.classList.add("cell--yes");
        cell.innerHTML = '<i class="state state--yes" aria-hidden="true"><svg><use href="#i-check"/></svg></i><span class="sr-only"></span>';
        cell.querySelector(".sr-only").textContent = included;
      } else if (value === "—" || value === "-") {
        cell.classList.add("cell--none");
        cell.innerHTML = '<span class="state state--none">—</span>';
      } else {
        cell.classList.add("cell--text");
        if (holder) holder.removeAttribute("class");
      }
    });

    var buttons = comparison.querySelectorAll(".plan-switch button");
    var pick = function (plan) {
      comparison.dataset.plan = plan;
      buttons.forEach(function (button) { button.setAttribute("aria-pressed", String(button.dataset.plan === plan)); });
    };
    buttons.forEach(function (button) {
      button.addEventListener("click", function () { pick(button.dataset.plan); });
    });
    pick("Business");
  }

  function replaceNumber(element, value) {
    if (!element) return;
    var walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    for (var node = walker.nextNode(); node; node = walker.nextNode()) {
      if (/\d/.test(node.data)) {
        node.data = node.data.replace(/\d[\d,.\s]*\d|\d/, value);
        return;
      }
    }
  }

  function codeList(value) {
    return String(value || "").split(",").map(function (code) { return code.trim(); }).filter(Boolean);
  }

  function localize(href) {
    var lang = (location.pathname.match(/^\/([a-z]{2})\//) || [])[1];
    var clean = String(href || "").replace(/^\/[a-z]{2}(?=\/)/, "");
    if (!lang || !/^\/(?!\/)/.test(clean)) return clean;
    return "/" + lang + clean;
  }

  function initPricing(main) {
    var PS = window.PlanSubscription;
    var host = main.querySelector(".plans[data-plan-codes]");
    var addons = main.querySelector("[data-addons]");
    var comparison = main.querySelector("#plan-comparison");
    if (!PS || !PS.catalog || !PS.selection || !host || !addons) return;
    var core = PS.core;
    var copy = {};
    addons.querySelectorAll("[data-copy]").forEach(function (node) { copy[node.dataset.copy] = node.textContent.trim(); });
    var fill = core.fill;
    var locale = html.getAttribute("lang") || "en";
    var subscribeUrl = host.dataset.subscribeUrl || "/subscribe.html";
    var rules = { planCodes: codeList(host.dataset.planCodes), siteExpansionCodes: codeList(host.dataset.expansionCodes), weatherCode: host.dataset.weatherCode || "" };
    var enterpriseLink = main.querySelector('.compare-head-plan[data-plan="Enterprise"] a');
    var salesHref = enterpriseLink ? enterpriseLink.getAttribute("href") : "";
    var salesLabel = enterpriseLink ? enterpriseLink.textContent.trim() : "";
    var buttons = Array.prototype.slice.call(addons.querySelectorAll("[data-addons-plans] button"));
    var checked = buttons.filter(function (button) { return button.getAttribute("aria-checked") === "true"; })[0] || buttons[0];
    var state = { catalog: null, status: "loading", period: "MONTHLY", planCode: checked ? checked.dataset.planCode : "", selection: null, notices: [] };
    var refs = {
      meta: addons.querySelector("[data-expansion-meta]"),
      controls: addons.querySelector("[data-expansion-controls]"),
      minus: addons.querySelector('[data-step="-1"]'),
      plus: addons.querySelector('[data-step="1"]'),
      packs: addons.querySelector("[data-packs]"),
      packPrice: addons.querySelector("[data-pack-price]"),
      packUnit: addons.querySelector("[data-pack-unit]"),
      packsSummary: addons.querySelector("[data-packs-summary]"),
      capacityTotal: addons.querySelector("[data-capacity-total]"),
      capacityFill: addons.querySelector("[data-capacity-fill]"),
      capacityLimit: addons.querySelector("[data-capacity-limit]"),
      expansionCard: addons.querySelector('[data-addon="expansion"]'),
      weatherRate: addons.querySelector("[data-weather-rate]"),
      weatherUnit: addons.querySelector("[data-weather-unit]"),
      weatherToggle: addons.querySelector("[data-weather-toggle]"),
      weatherField: addons.querySelector("[data-weather-field]"),
      weatherCount: addons.querySelector("[data-weather-count]"),
      weatherHint: addons.querySelector("[data-weather-hint]"),
      weatherFormula: addons.querySelector("[data-weather-formula]"),
      panelPlan: addons.querySelector("[data-panel-plan]"),
      panelIncluded: addons.querySelector("[data-panel-included]"),
      panelLines: addons.querySelector("[data-panel-lines]"),
      panelNotice: addons.querySelector("[data-panel-notice]"),
      totalLabel: addons.querySelector("[data-total-label]"),
      totalCapacity: addons.querySelector("[data-total-capacity]"),
      totalAmount: addons.querySelector("[data-total-amount]"),
      continueLink: addons.querySelector("[data-continue]"),
      continueLabel: addons.querySelector("[data-continue-label]"),
      enterprisePanel: addons.querySelector("[data-addons-enterprise]"),
      layout: addons.querySelector("[data-addons-layout]"),
    };

    function planByCode(code) {
      return state.catalog ? state.catalog.plans.filter(function (plan) { return plan.code === code; })[0] || null : null;
    }

    function number(cents) {
      var whole = cents % 100 === 0;
      try {
        return new Intl.NumberFormat(locale, { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 }).format(cents / 100);
      } catch (error) {
        return (cents / 100).toFixed(whole ? 0 : 2);
      }
    }

    function money(cents) {
      return core.money(cents, state.catalog.currency, locale);
    }

    function yearly() {
      return state.period === "YEARLY";
    }

    function query(plan, selection) {
      var parts = ["plan=" + encodeURIComponent(plan.code), "period=" + state.period];
      if (selection && selection.packs > 0) parts.push("packs=" + selection.packs);
      if (selection && selection.weatherOn && selection.weather > 0) parts.push("weather=" + selection.weather);
      return localize(subscribeUrl + (subscribeUrl.indexOf("?") === -1 ? "?" : "&") + parts.join("&"));
    }

    function capWeather(selection) {
      var available = PS.selection.options(state.catalog, selection);
      if (selection.weatherOn && available.capacity !== null && selection.weather > available.capacity) {
        return { selection: Object.assign({}, selection, { weather: available.capacity }), capped: true };
      }
      return { selection: selection, capped: false };
    }

    function adapt(plan) {
      if (!state.selection || !plan.selfService) return null;
      return capWeather(PS.selection.normalize(state.catalog, Object.assign({}, state.selection, { planId: plan.id, period: state.period }))).selection;
    }

    function hrefFor(code) {
      var plan = planByCode(code);
      if (plan && plan.selfService) return query(plan, adapt(plan));
      if (plan || !code) return localize(salesHref);
      return localize(subscribeUrl + (subscribeUrl.indexOf("?") === -1 ? "?" : "&") + "plan=" + encodeURIComponent(code) + "&period=MONTHLY");
    }

    function renderPrices() {
      main.querySelectorAll("article.plan[data-plan-code]").forEach(function (card) {
        var plan = planByCode(card.dataset.planCode);
        if (!plan) return;
        var title = card.querySelector("h3");
        if (title && plan.name) title.textContent = plan.name;
        var price = plan.prices[state.period];
        if (plan.selfService && typeof price === "number") {
          card.querySelector(".plan-price .currency").textContent = state.catalog.currency;
          card.querySelector(".plan-price b").textContent = number(price);
          card.querySelector(".plan-price small").textContent = yearly() ? host.dataset.perYear : host.dataset.perMonth;
          var buy = card.querySelector(".plan-btn");
          if (buy) buy.setAttribute("href", query(plan, null));
        }
        if (plan.included !== null) replaceNumber(card.querySelector(".plan-capacity"), core.integer(plan.included, locale));
      });
      main.querySelectorAll(".compare-head-plan[data-plan-code]").forEach(function (column) {
        var plan = planByCode(column.dataset.planCode);
        if (!plan || !plan.selfService || typeof plan.prices[state.period] !== "number") return;
        column.querySelector("[data-head-currency]").textContent = state.catalog.currency;
        column.querySelector("[data-head-amount]").textContent = number(plan.prices[state.period]);
        column.querySelector("[data-head-period]").textContent = yearly() ? host.dataset.perYear : host.dataset.perMonth;
      });
      var row = main.querySelector("#plan-comparison [data-capacity-row]");
      if (row) {
        row.querySelectorAll("td[data-plan]").forEach(function (cell) {
          var column = main.querySelector('.compare-head-plan[data-plan="' + cell.dataset.plan + '"]');
          var plan = column ? planByCode(column.dataset.planCode) : null;
          if (plan && plan.included !== null) replaceNumber(cell.querySelector(".cell-value") || cell, core.integer(plan.included, locale));
        });
      }
      var note = main.querySelector("[data-billing-note]");
      if (note) note.textContent = yearly() ? note.dataset.yearly : note.dataset.monthly;
    }

    function renderChooseLinks() {
      main.querySelectorAll(".compare-head-plan[data-plan-code] [data-choose]").forEach(function (link) {
        link.setAttribute("href", hrefFor(link.closest("[data-plan-code]").dataset.planCode));
      });
      main.querySelectorAll(".compare-cta a.plan-btn").forEach(function (link) {
        var code = (String(link.dataset.baseHref || link.getAttribute("href")).match(/[?&]plan=([^&]+)/) || [])[1];
        if (!link.dataset.baseHref) link.dataset.baseHref = link.getAttribute("href");
        if (code) link.setAttribute("href", hrefFor(decodeURIComponent(code)));
      });
      renderSwitchBuy();
    }

    function renderSwitchBuy() {
      var bar = main.querySelector("[data-switch-buy]");
      if (!bar || !comparison) return;
      var column = main.querySelector('.compare-head-plan[data-plan="' + (comparison.dataset.plan || "Business") + '"]');
      if (!column) return;
      var price = column.querySelector(".compare-head-price");
      var action = column.querySelector("a");
      var parts = Array.prototype.map.call(price.children, function (node) { return node.textContent.trim(); }).filter(Boolean);
      bar.querySelector("[data-switch-price]").textContent = column.querySelector(".compare-head-name").textContent.trim() + " · " + parts.join(" ");
      var choose = bar.querySelector("[data-switch-choose]");
      choose.setAttribute("href", action.getAttribute("href"));
      choose.className = action.className.replace("compare-head-btn", "plan-switch-choose");
      bar.querySelector("[data-switch-choose-label]").textContent = action.textContent.trim();
    }

    function setNotice(messages) {
      state.notices = messages.filter(Boolean);
      refs.panelNotice.hidden = !state.notices.length;
      refs.panelNotice.textContent = state.notices.join(" ");
    }

    function line(label, amount) {
      var row = document.createElement("div");
      row.className = "addons-line";
      var name = document.createElement("span");
      name.textContent = label;
      var value = document.createElement("b");
      value.textContent = amount;
      row.appendChild(name);
      row.appendChild(value);
      return row;
    }

    function renderAddons() {
      addons.dataset.state = state.status;
      addons.dataset.period = state.period;
      buttons.forEach(function (button) {
        var selected = button.dataset.planCode === state.planCode;
        button.setAttribute("aria-checked", String(selected));
        button.tabIndex = selected ? 0 : -1;
      });
      var enterprise = rules.planCodes.indexOf(state.planCode) === -1;
      addons.dataset.mode = enterprise ? "enterprise" : "calculator";
      if (refs.enterprisePanel) refs.enterprisePanel.hidden = !enterprise;
      if (refs.layout) refs.layout.hidden = enterprise;
      if (enterprise) return;
      var current = buttons.filter(function (button) { return button.dataset.planCode === state.planCode; })[0];
      var planName = current ? current.textContent.trim() : "";
      var plan = planByCode(state.planCode);
      var live = state.status === "catalog" && plan && plan.selfService && state.selection;
      refs.panelPlan.textContent = plan ? plan.name : planName;
      refs.panelLines.replaceChildren();
      refs.totalLabel.textContent = yearly() ? copy.totalYear : copy.totalMonth;
      refs.minus.disabled = true;
      refs.plus.disabled = true;
      refs.weatherToggle.disabled = true;
      if (!live) {
        var sales = (plan && !plan.selfService) || (!plan && rules.planCodes.indexOf(state.planCode) === -1);
        refs.controls.hidden = sales;
        refs.meta.textContent = sales ? fill(copy.expansionUnavailable, { plan: planName }) : state.status === "loading" ? copy.loading : copy.offline;
        refs.packs.textContent = "0";
        refs.packPrice.textContent = "";
        refs.packUnit.textContent = "";
        refs.packsSummary.textContent = "";
        refs.capacityTotal.textContent = "";
        refs.capacityLimit.textContent = "";
        refs.capacityFill.style.width = "0";
        refs.weatherToggle.checked = false;
        refs.weatherField.hidden = true;
        refs.weatherRate.textContent = "";
        refs.weatherUnit.textContent = "";
        refs.weatherHint.textContent = sales ? copy.enterpriseNote : "";
        refs.weatherFormula.textContent = "";
        refs.panelIncluded.textContent = plan && plan.included !== null ? fill(copy.included, { count: core.integer(plan.included, locale) }) : "";
        refs.totalCapacity.textContent = "";
        refs.totalAmount.textContent = sales ? (main.querySelector(".compare-head-talk") || {}).textContent || "" : "—";
        if (sales) setNotice([copy.enterpriseNote]);
        else setNotice([state.status === "loading" ? copy.loading : copy.offline]);
        refs.continueLink.setAttribute("href", hrefFor(state.planCode));
        refs.continueLabel.textContent = sales ? salesLabel : fill(copy.continue, { plan: planName });
        return;
      }
      var selection = state.selection;
      var available = PS.selection.options(state.catalog, selection);
      var period = yearly() ? copy.periodYear : copy.periodMonth;
      var planPrice = plan.prices[state.period] || 0;
      var total = planPrice;
      refs.panelIncluded.textContent = plan.included !== null ? fill(copy.included, { count: core.integer(plan.included, locale) }) : "";
      refs.panelLines.appendChild(line(fill(copy.linePlan, { plan: plan.name }), money(planPrice)));
      if (available.expansion) {
        var packPrice = available.expansion.prices[state.period] || 0;
        var added = selection.packs * available.packSize;
        var atLimit = available.maxPacks !== null && selection.packs >= available.maxPacks;
        refs.controls.hidden = false;
        refs.meta.textContent = fill(copy.packsMeta, { included: core.integer(available.included, locale), size: core.integer(available.packSize, locale) });
        refs.packs.textContent = String(selection.packs);
        refs.packPrice.textContent = money(packPrice);
        refs.packUnit.textContent = yearly() ? copy.perPackYear : copy.perPackMonth;
        refs.packsSummary.textContent = selection.packs > 0 ? fill(copy.packsSummary, { count: selection.packs, size: core.integer(available.packSize, locale), added: core.integer(added, locale), amount: money(selection.packs * packPrice) }) : copy.packsNone;
        refs.capacityTotal.textContent = fill(copy.capacityTotal, { total: core.integer(available.capacity, locale) });
        refs.capacityLimit.textContent = available.maximum === null ? "" : fill(atLimit ? copy.capacityReached : copy.capacityLimit, { plan: plan.name, max: core.integer(available.maximum, locale) });
        refs.capacityLimit.classList.toggle("is-limit", atLimit);
        refs.capacityFill.style.width = available.maximum ? Math.min(100, Math.round(available.capacity / available.maximum * 100)) + "%" : "0";
        refs.minus.disabled = selection.packs <= 0;
        refs.plus.disabled = atLimit;
        if (selection.packs > 0) {
          refs.panelLines.appendChild(line(fill(copy.linePacks, { count: selection.packs }), money(selection.packs * packPrice)));
          total += selection.packs * packPrice;
        }
      } else {
        refs.controls.hidden = true;
        refs.meta.textContent = fill(copy.expansionUnavailable, { plan: plan.name });
        refs.packsSummary.textContent = "";
        refs.capacityTotal.textContent = available.capacity === null ? "" : fill(copy.capacityTotal, { total: core.integer(available.capacity, locale) });
        refs.capacityLimit.textContent = "";
        refs.capacityFill.style.width = "0";
      }
      if (available.weather) {
        var rate = available.weather.prices[state.period] || 0;
        refs.weatherToggle.disabled = false;
        refs.weatherToggle.checked = selection.weatherOn;
        refs.weatherRate.textContent = money(rate);
        refs.weatherUnit.textContent = yearly() ? copy.weatherRateYear : copy.weatherRateMonth;
        refs.weatherField.hidden = !selection.weatherOn;
        if (document.activeElement !== refs.weatherCount) refs.weatherCount.value = selection.weatherOn ? String(selection.weather) : "";
        if (available.capacity !== null) refs.weatherCount.setAttribute("max", String(available.capacity));
        refs.weatherHint.textContent = available.capacity === null ? "" : fill(copy.weatherHint, { capacity: core.integer(available.capacity, locale) });
        if (selection.weatherOn && selection.weather > 0) {
          refs.weatherFormula.textContent = fill(copy.weatherFormula, { count: core.integer(selection.weather, locale), rate: money(rate), amount: money(selection.weather * rate), period: period });
          refs.panelLines.appendChild(line(fill(copy.lineWeather, { count: core.integer(selection.weather, locale) }), money(selection.weather * rate)));
          total += selection.weather * rate;
        } else {
          refs.weatherFormula.textContent = copy.weatherOff;
        }
      } else {
        refs.weatherToggle.checked = false;
        refs.weatherField.hidden = true;
        refs.weatherFormula.textContent = fill(copy.weatherRemoved, { plan: plan.name });
      }
      refs.totalCapacity.textContent = available.capacity === null ? "" : fill(copy.capacityTotal, { total: core.integer(available.capacity, locale) });
      refs.totalAmount.textContent = money(total);
      refs.continueLink.setAttribute("href", query(plan, selection));
      refs.continueLabel.textContent = fill(copy.continue, { plan: plan.name });
      refs.panelNotice.hidden = !state.notices.length;
    }

    function renderAll() {
      if (state.catalog) renderPrices();
      renderChooseLinks();
      renderAddons();
    }

    function update(next, messages) {
      var capped = capWeather(next);
      state.selection = capped.selection;
      setNotice((messages || []).concat(capped.capped ? [fill(copy.weatherCapped, { count: core.integer(capped.selection.weather, locale) })] : []));
      renderAll();
    }

    function choosePlan(code) {
      state.planCode = code;
      var plan = planByCode(code);
      if (!plan || !plan.selfService || state.status !== "catalog") {
        setNotice([]);
        renderAll();
        return;
      }
      var previous = state.selection || PS.selection.initial(state.catalog, { plan: code, period: state.period });
      var next = PS.selection.normalize(state.catalog, Object.assign({}, previous, { planId: plan.id, period: state.period }));
      var available = PS.selection.options(state.catalog, next);
      var messages = [];
      if (previous.packs > 0 && !available.expansion) messages.push(fill(copy.packsRemoved, { plan: plan.name }));
      else if (next.packs < previous.packs) messages.push(fill(copy.packsTrimmed, { plan: plan.name, max: core.integer(available.maximum, locale), count: next.packs }));
      if (previous.weatherOn && !next.weatherOn) messages.push(fill(copy.weatherRemoved, { plan: plan.name }));
      update(next, messages);
    }

    function setPeriod(period) {
      if (state.status !== "catalog") return;
      state.period = period;
      main.querySelectorAll("[data-billing-switch] button").forEach(function (button) { button.setAttribute("aria-checked", String(button.dataset.period === period)); });
      if (state.selection) state.selection = PS.selection.normalize(state.catalog, Object.assign({}, state.selection, { period: period }));
      renderAll();
    }

    buttons.forEach(function (button, index) {
      button.addEventListener("click", function () { choosePlan(button.dataset.planCode); });
      button.addEventListener("keydown", function (event) {
        var step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
        var target = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1 : step ? (index + step + buttons.length) % buttons.length : -1;
        if (target < 0) return;
        event.preventDefault();
        choosePlan(buttons[target].dataset.planCode);
        buttons[target].focus();
      });
    });
    main.querySelectorAll("[data-billing-switch] button").forEach(function (button) {
      button.addEventListener("click", function () { setPeriod(button.dataset.period); });
    });
    refs.minus.addEventListener("click", function () { if (state.selection) update(PS.selection.normalize(state.catalog, Object.assign({}, state.selection, { packs: state.selection.packs - 1 }))); });
    refs.plus.addEventListener("click", function () { if (state.selection) update(PS.selection.normalize(state.catalog, Object.assign({}, state.selection, { packs: state.selection.packs + 1 }))); });
    refs.weatherToggle.addEventListener("change", function () {
      if (!state.selection) return;
      var capacity = PS.selection.options(state.catalog, state.selection).capacity;
      update(Object.assign({}, state.selection, { weatherOn: refs.weatherToggle.checked, weather: state.selection.weather || capacity || 0 }));
      if (refs.weatherToggle.checked) refs.weatherCount.focus();
    });
    refs.weatherCount.addEventListener("input", function () {
      var count = Number(refs.weatherCount.value);
      if (state.selection && Number.isInteger(count) && count >= 1) update(Object.assign({}, state.selection, { weather: count }));
    });
    refs.weatherCount.addEventListener("change", function () {
      if (state.selection) refs.weatherCount.value = String(state.selection.weather);
    });
    main.querySelectorAll("[data-expand-plan]").forEach(function (link) {
      link.addEventListener("click", function (event) {
        event.preventDefault();
        choosePlan(link.dataset.expandPlan);
        addons.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
        refs.expansionCard.classList.add("is-highlighted");
        setTimeout(function () { refs.expansionCard.classList.remove("is-highlighted"); }, 2400);
      });
    });
    if (comparison) {
      comparison.querySelectorAll(".plan-switch button").forEach(function (button) {
        button.addEventListener("click", renderSwitchBuy);
      });
    }

    renderAll();
    if (host.dataset.pricingDynamic !== "true" || typeof window.fetch !== "function") {
      state.status = "offline";
      host.dataset.pricingState = "fallback";
      renderAll();
      return;
    }
    var loadCatalog = function (attempt) {
      return PS.catalog.load({ fetch: window.fetch.bind(window), apiBase: location.origin, organizationCode: host.dataset.pricingOrganization || "SERVICEWAND", rules: rules, locale: locale }).catch(function (error) {
        if (attempt >= 3) throw error;
        return new Promise(function (resolve) { setTimeout(resolve, attempt * 1500); }).then(function () { return loadCatalog(attempt + 1); });
      });
    };
    loadCatalog(1).then(function (catalog) {
      if (!catalog || !catalog.currency || !catalog.plans.length) throw new Error("empty catalog");
      state.catalog = catalog;
      state.status = "catalog";
      var plan = planByCode(state.planCode);
      state.selection = plan && plan.selfService ? PS.selection.initial(catalog, { plan: plan.code, period: state.period }) : null;
      if (!state.selection) {
        var first = catalog.plans.filter(function (entry) { return entry.selfService; })[0];
        state.selection = first ? PS.selection.initial(catalog, { plan: first.code, period: state.period }) : null;
      }
      main.querySelectorAll("[data-billing-switch] button").forEach(function (button) { button.disabled = false; });
      host.dataset.pricingState = "catalog";
      setNotice([]);
      renderAll();
    }).catch(function () {
      state.status = "offline";
      host.dataset.pricingState = "fallback";
      renderAll();
    });
  }

  function initStickyTop(main) {
    var header = document.querySelector(".header");
    var queued = false;
    var sync = function () {
      queued = false;
      var top = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
      main.style.setProperty("--snow-sticky-top", Math.round(top + 8) + "px");
    };
    var queue = function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(sync);
    };
    sync();
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
  }

  onReady(function () {
    var main = document.querySelector("main.snow-landing");
    if (!main) return;
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    main.querySelectorAll(".review-note").forEach(function (note) { note.hidden = !note.textContent.trim(); });
    initSurfaces(main);
    initReveal(main, reduceMotion);
    initFilms(main);
    initDialog(main);
    initComparison(main, reduceMotion);
    initStickyTop(main);
    initPricing(main);
  });
})();
