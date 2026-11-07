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

  function replaceNumbers(element, numbers) {
    if (!element) return;
    var index = 0;
    var walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
    for (var node = walker.nextNode(); node; node = walker.nextNode()) {
      node.data = node.data.replace(/\d[\d,]*(?:\.\d+)?/g, function (match) {
        var next = numbers[index++];
        return next === undefined || next === null ? match : next;
      });
    }
  }

  function formatAmount(amount, locale, fractions) {
    try {
      return Number(amount).toLocaleString(locale || "en", { minimumFractionDigits: fractions, maximumFractionDigits: fractions });
    } catch (error) {
      return Number(amount).toFixed(fractions);
    }
  }

  function attributeValue(row, code) {
    var wrapper = (row && row.product) || {};
    var groups = wrapper.attributes || (wrapper.product && wrapper.product.attributes) || {};
    for (var key in groups) {
      var values = groups[key];
      if (values && Object.prototype.hasOwnProperty.call(values, code)) {
        var entry = values[code];
        return entry && typeof entry === "object" && "value" in entry ? entry.value : entry;
      }
    }
    return null;
  }

  function sameCurrency(plan, config) {
    return !plan.currency || !config.currency || plan.currency === config.currency;
  }

  function fillPlans(main, pricing) {
    var host = main.querySelector(".plans[data-pricing-dynamic]");
    if (!host || !pricing) return;
    pricing.load(host).then(function (data) {
      if (!data || !data.ok) return;
      var config = data.config;
      var capacityCode = host.dataset.pricingCapacityAttribute || "";
      var byCode = {};
      data.plans.forEach(function (plan) { byCode[plan.code] = plan; });
      var capacities = {};
      host.querySelectorAll("article.plan[data-plan-code]").forEach(function (card) {
        var plan = byCode[card.dataset.planCode];
        if (!plan || !sameCurrency(plan, config)) return;
        var title = card.querySelector("h3");
        if (title && plan.name) title.textContent = plan.name;
        if (!plan.customPrice && plan.amount !== null && plan.amount !== undefined) {
          var currency = card.querySelector(".plan-price .currency");
          var amount = card.querySelector(".plan-price b");
          if (currency && plan.currency) currency.textContent = plan.currency;
          if (amount) amount.textContent = formatAmount(plan.amount, config.locale, plan.amount % 1 ? 2 : 0);
        }
        var included = capacityCode ? attributeValue(plan.row, capacityCode) : null;
        if (included !== null && /^\d+$/.test(String(included).trim())) {
          var count = formatAmount(Number(included), config.locale, 0);
          capacities[card.dataset.planCode] = count;
          replaceNumbers(card.querySelector(".plan-capacity"), [count]);
        }
        card.dataset.pricingSource = "catalog";
      });
      var row = main.querySelector("#plan-comparison [data-capacity-row]");
      if (row) {
        var codes = {};
        host.querySelectorAll("article.plan[data-plan-code]").forEach(function (card, index) {
          var heading = main.querySelectorAll("#plan-comparison .plan-switch button")[index];
          if (heading) codes[heading.dataset.plan] = card.dataset.planCode;
        });
        row.querySelectorAll("td[data-plan]").forEach(function (cell) {
          var count = capacities[codes[cell.dataset.plan]];
          if (count) replaceNumbers(cell, [count]);
        });
      }
      host.dataset.pricingState = "catalog";
    }).catch(function () {
      host.dataset.pricingState = "fallback";
    });
  }

  function fillWeather(main, pricing) {
    var host = main.querySelector(".weather[data-pricing-dynamic]");
    if (!host || !pricing) return;
    pricing.load(host).then(function (data) {
      if (!data || !data.ok) return;
      var plan = data.plans.filter(function (item) { return item.code === host.dataset.pricingProductCode; })[0];
      if (!plan || plan.customPrice || plan.amount === null || plan.amount === undefined || !sameCurrency(plan, data.config)) return;
      var locale = data.config.locale;
      var unit = formatAmount(plan.amount, locale, 2);
      replaceNumbers(host.querySelector(".weather-price b"), [unit]);
      var example = host.querySelector(".weather-price small");
      if (example) {
        var count = Number(((example.textContent.match(/\d[\d,]*/) || ["0"])[0]).replace(/,/g, ""));
        var total = count * plan.amount;
        replaceNumbers(example, [formatAmount(count, locale, 0), unit, formatAmount(total, locale, total % 1 ? 2 : 0)]);
      }
      host.dataset.pricingState = "catalog";
    }).catch(function () {
      host.dataset.pricingState = "fallback";
    });
  }

  onReady(function () {
    var main = document.querySelector("main.snow-landing");
    if (!main) return;
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    initSurfaces(main);
    initReveal(main, reduceMotion);
    initFilms(main);
    initDialog(main);
    initComparison(main, reduceMotion);
    fillPlans(main, window.LabPricing);
    fillWeather(main, window.LabPricing);
  });
})();
