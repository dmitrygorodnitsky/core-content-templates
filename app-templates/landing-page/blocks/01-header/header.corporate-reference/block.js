/* generated child JS: 01-header/header.corporate-reference/block.js */
// lab-ui block · header.corporate-reference
// Imported from CMS BlockTemplate 5ef64a49-2d1c-44df-873f-8e6f471e4b38 (HEADER).

document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  if (window.__localeSelectorInit) return;
  window.__localeSelectorInit = true;

  const FLAG_OVERRIDES = {
    en: "us",
    zh: "cn",
    ar: "sa",
    ko: "kr",
    ja: "jp",
    uk: "ua",
    cs: "cz",
    el: "gr",
    da: "dk",
    sv: "se",
    nb: "no",
    vi: "vn",
    fa: "ir",
    he: "il",
    hi: "in",
    ms: "my",
    et: "ee",
    sl: "si",
    kk: "kz",
    kz: "kz",
  };

  let KNOWN_CODES = new Set();

  function looksLikeLocale(seg) {
    return /^[a-z]{2}$/.test(seg);
  }

  function isKnownLocale(code) {
    const c = (code || "").toLowerCase();
    return KNOWN_CODES.size ? KNOWN_CODES.has(c) : looksLikeLocale(c);
  }

  function getLocaleFromURL() {
    const segments = window.location.pathname.split("/").filter(Boolean);
    if (segments.length > 0 && isKnownLocale(segments[0])) {
      return segments[0].toLowerCase();
    }
    return new URLSearchParams(window.location.search).get("locale");
  }

  function setLocaleInURL(value) {
    const url = new URL(window.location.href);
    let segments = url.pathname.split("/").filter(Boolean);
    const first = (segments[0] || "").toLowerCase();

    if (segments.length > 0 && isKnownLocale(first)) {
      segments[0] = value;
    } else {
      segments.unshift(value);
    }

    url.pathname = "/" + segments.join("/");
    url.searchParams.delete("locale");
    window.location.assign(url.toString());
  }

  function detectBrowserLocale(availableLanguages) {
    const browserLangs = navigator.languages?.length
      ? navigator.languages
      : [navigator.language || navigator.userLanguage || "en"];

    for (const browserLang of browserLangs) {
      const code = browserLang.split("-")[0].toLowerCase();
      const match = availableLanguages.find((l) => l.code2 === code);
      if (match) return match.code2;
    }
    return "en";
  }

  function createFlagElement(code2) {
    const countryCode = (FLAG_OVERRIDES[code2] || code2).toLowerCase();
    const span = document.createElement("span");
    span.classList.add(
      "flag-icon",
      "flag-icon-" + countryCode,
      "vl-locale-flag",
    );
    span.setAttribute("aria-hidden", "true");
    return span;
  }

  function createCheckIcon() {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("class", "vl-locale-check");
    svg.setAttribute("viewBox", "0 0 14 14");
    svg.setAttribute("fill", "none");
    svg.innerHTML =
      '<path d="M2.5 7L5.5 10L11.5 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>';
    return svg;
  }

  function initSelector(selector) {
    const trigger = selector.querySelector(".vl-locale-trigger");
    const dropdown = selector.querySelector(".vl-locale-dropdown");
    const triggerLabel = selector.querySelector(".vl-locale-trigger-label");

    if (!trigger || !dropdown) return;

    function open() {
      document.querySelectorAll(".vl-locale-selector.is-open").forEach((el) => {
        if (el !== selector) {
          el.classList.remove("is-open");
          el.querySelector(".vl-locale-trigger")?.setAttribute(
            "aria-expanded",
            "false",
          );
        }
      });
      selector.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
    }

    function close() {
      selector.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
    }

    function toggle() {
      selector.classList.contains("is-open") ? close() : open();
    }

    selector.addEventListener("click", (e) => e.stopPropagation());

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      toggle();
    });

    function bindArrowNav() {
      dropdown.addEventListener("keydown", (e) => {
        const items = Array.from(dropdown.querySelectorAll(".vl-locale-item"));
        const focused = document.activeElement;
        const idx = items.indexOf(focused);

        if (e.key === "ArrowDown") {
          e.preventDefault();
          (items[idx + 1] || items[0]).focus();
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          (items[idx - 1] || items[items.length - 1]).focus();
        }
      });
    }

    function renderItems(languages, currentLocale) {
      const list = dropdown.querySelector(".vl-locale-list");
      if (!list) return;

      list.innerHTML = "";

      languages.forEach((lang) => {
        const code = lang.code2;
        const label = lang.nativeName || code;

        const li = document.createElement("li");
        li.className =
          "vl-locale-item" + (code === currentLocale ? " is-active" : "");
        li.role = "option";
        li.tabIndex = 0;
        li.dataset.value = code;
        li.dataset.label = label;
        li.setAttribute(
          "aria-selected",
          code === currentLocale ? "true" : "false",
        );

        const span = document.createElement("span");
        span.className = "vl-locale-item-label";
        span.textContent = label;

        li.appendChild(createFlagElement(code));
        li.appendChild(span);
        li.appendChild(createCheckIcon());

        li.addEventListener("click", (e) => {
          e.stopPropagation();
          setLocaleInURL(code);
        });

        li.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setLocaleInURL(code);
          }
        });

        list.appendChild(li);
      });

      const active = languages.find((l) => l.code2 === currentLocale);
      if (active && triggerLabel) {
        triggerLabel.textContent = active.nativeName || currentLocale;

        const existingFlag = trigger.querySelector(".vl-locale-flag");
        const newFlag = createFlagElement(currentLocale);

        if (existingFlag) existingFlag.replaceWith(newFlag);
        else trigger.appendChild(newFlag);
      }

      bindArrowNav();
    }

    async function loadLanguages() {
      try {
        const res = await fetch("/core/api/language/active.json", {
          method: "POST",
          headers: {
            accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify([{ name: "code2" }, { name: "nativeName" }]),
        });

        if (!res.ok) throw new Error("HTTP " + res.status);

        const languages = await res.json();

        // Источник истины по локалям — ответ сервера. Заполняем набор кодов.
        KNOWN_CODES = new Set(
          languages.map((l) => (l.code2 || "").toLowerCase()).filter(Boolean),
        );

        const currentLocale =
          getLocaleFromURL() || detectBrowserLocale(languages);

        renderItems(languages, currentLocale);
      } catch (err) {
        console.error("[LocaleSelector] Failed:", err);
      }
    }

    document.addEventListener("click", (e) => {
      if (!selector.contains(e.target)) close();
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && selector.classList.contains("is-open")) {
        close();
        trigger.focus();
      }
    });

    loadLanguages();
  }

  document.querySelectorAll(".vl-locale-selector").forEach(initSelector);
});

document.addEventListener("DOMContentLoaded", () => {
  const burgerButton = document.querySelector(".header-burger-button");
  const header = document.querySelector(".header");
  const mobileLinks = document.querySelectorAll(".mobile-menu-link");

  function openMenu() {
    if (!header || !burgerButton) return;
    header.classList.add("is-open");
    burgerButton.classList.add("is-open");
    document.body.style.overflow = "hidden";
    document.querySelectorAll(".locale-selector.is-open").forEach((el) => {
      el.classList.remove("is-open");
      el.querySelector(".locale-trigger")?.setAttribute(
        "aria-expanded",
        "false",
      );
    });
  }

  function closeMenu() {
    if (!header || !burgerButton) return;
    header.classList.remove("is-open");
    burgerButton.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  if (burgerButton) {
    burgerButton.addEventListener("click", () => {
      header.classList.contains("is-open") ? closeMenu() : openMenu();
    });
  }

  mobileLinks.forEach((link) => link.addEventListener("click", closeMenu));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  // Закрытие бургера при клике вне header,
  // но НЕ если клик был внутри .locale-selector
  document.addEventListener("click", (e) => {
    if (
      header?.classList.contains("is-open") &&
      !header.contains(e.target) &&
      !e.target.closest(".locale-selector") // ← исключаем селектор
    ) {
      closeMenu();
    }
  });
});

document.addEventListener("DOMContentLoaded", function () {
  var trigger = document.getElementById("mobileIndTrigger");
  var overlay = document.getElementById("mobIndOverlay");
  var views = document.getElementById("mobIndViews");
  var detailScroll = document.getElementById("mobIndDetailScroll");
  var detailTitle = document.getElementById("mobIndDetailTitle");
  var backBtn = document.getElementById("mobIndBack");

  if (!trigger || !overlay) return;

  function openModal() {
    overlay.classList.add("is-open");
    overlay.removeAttribute("aria-hidden");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    setTimeout(function () {
      if (views) views.classList.remove("detail-open");
      if (detailScroll) detailScroll.innerHTML = "";
      if (detailTitle) detailTitle.textContent = "";
    }, 350);
  }

  function openDetail(indKey) {
    var panel = document.querySelector('[data-panel="' + indKey + '"]');
    if (!panel) return;

    var labelEl = panel.querySelector(".ind-industry-label");
    var titleEl = panel.querySelector(".ind-industry-title");
    var bodyEl = panel.querySelector(".ind-industry-body");
    var ctaEl = panel.querySelector(".ind-cta-link");
    var subItems = panel.querySelectorAll(".ind-sub-item");

    if (detailTitle) {
      detailTitle.textContent = titleEl ? titleEl.textContent : "";
    }

    var html = "";

    html += '<div class="mob-ind-detail-head">';
    if (labelEl)
      html += '<p class="mob-ind-detail-label">' + labelEl.innerHTML + "</p>";
    if (titleEl)
      html += '<p class="mob-ind-detail-title">' + titleEl.innerHTML + "</p>";
    if (bodyEl)
      html += '<p class="mob-ind-detail-body">' + bodyEl.innerHTML + "</p>";
    if (ctaEl) {
      var ctaDisabledClass = ctaEl.classList.contains("is-disabled")
        ? " is-disabled"
        : "";
      html +=
        '<a href="' +
        (ctaEl.getAttribute("href") || "#") +
        '" class="mob-ind-detail-cta' +
        ctaDisabledClass +
        '">' +
        ctaEl.innerHTML +
        "</a>";
    }
    html += "</div>";

    html += '<ul class="mob-ind-sublist">';
    subItems.forEach(function (item) {
      var isDisabled = !!item.querySelector(".ind-badge");
      var iconEl = item.querySelector(".ind-sub-icon");
      var textSpan = item.querySelector(
        "span:not(.ind-sub-icon):not(.ind-badge):not(.ind-sub-arrow)",
      );
      var href = item.getAttribute("href") || "#";

      if (isDisabled) {
        html += '<span class="mob-ind-subitem is-disabled">';
      } else {
        html += '<a href="' + href + '" class="mob-ind-subitem">';
      }

      if (iconEl) {
        html += '<span class="mob-ind-subicon">' + iconEl.innerHTML + "</span>";
      }
      if (textSpan) {
        html += "<span>" + textSpan.innerHTML + "</span>";
      }

      html += isDisabled ? "</span>" : "</a>";
    });
    html += "</ul>";

    if (detailScroll) {
      detailScroll.innerHTML = html;
      detailScroll.scrollTop = 0;
    }

    if (views) views.classList.add("detail-open");
  }

  trigger.addEventListener("click", openModal);

  if (backBtn) {
    backBtn.addEventListener("click", function () {
      if (views) views.classList.remove("detail-open");
    });
  }

  document.querySelectorAll(".mob-ind-close-btn").forEach(function (btn) {
    btn.addEventListener("click", closeModal);
  });

  overlay.addEventListener("click", function (e) {
    if (e.target === overlay) closeModal();
  });

  document
    .querySelectorAll(".mob-ind-navitem:not(.is-disabled)")
    .forEach(function (item) {
      item.addEventListener("click", function () {
        openDetail(this.dataset.ind);
      });
    });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && overlay.classList.contains("is-open")) {
      closeModal();
    }
  });
});

document.addEventListener(
  "mouseenter",
  function (e) {
    if (!e.target || typeof e.target.closest !== "function") return;
    const menuItem = e.target.closest(".header-menu-item");
    if (!menuItem || menuItem.dataset.bgLoaded) return;
    menuItem.dataset.bgLoaded = "true";
    menuItem.style.setProperty(
      "--menu-item-bg",
      'url("/core/image/{{menu_item_shadow}}/get")',
    );
  },
  true,
);

document.addEventListener("DOMContentLoaded", function () {
  const wrappers = document.querySelectorAll(".resources-dropdown-wrapper");

  wrappers.forEach((wrapper) => {
    const trigger = wrapper.querySelector(".resources-trigger");
    if (!trigger) return;

    let timer;

    const openMenu = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        wrappers.forEach((el) => {
          if (el !== wrapper) {
            el.classList.remove("is-open");
            el.querySelector(".resources-trigger")?.setAttribute(
              "aria-expanded",
              "false",
            );
          }
        });
        wrapper.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
      }, 80);
    };

    const closeMenu = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        wrapper.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
      }, 200);
    };

    wrapper.addEventListener("mouseenter", openMenu);
    wrapper.addEventListener("mouseleave", closeMenu);

    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = wrapper.classList.contains("is-open");
      clearTimeout(timer);
      if (isOpen) {
        wrapper.classList.remove("is-open");
        trigger.setAttribute("aria-expanded", "false");
      } else {
        wrappers.forEach((el) => {
          if (el !== wrapper) {
            el.classList.remove("is-open");
            el.querySelector(".resources-trigger")?.setAttribute(
              "aria-expanded",
              "false",
            );
          }
        });
        wrapper.classList.add("is-open");
        trigger.setAttribute("aria-expanded", "true");
      }
    });
  });

  document.addEventListener("click", (e) => {
    if (
      !e.target.closest(".resources-dropdown-wrapper") &&
      !e.target.closest(".locale-selector")
    ) {
      wrappers.forEach((wrapper) => {
        wrapper.classList.remove("is-open");
        wrapper
          .querySelector(".resources-trigger")
          ?.setAttribute("aria-expanded", "false");
      });
    }
  });

  // Industries panel hover logic
  const indWrapper = document.querySelector('[data-dropdown="industries"]');
  if (!indWrapper) return;

  const navItems = indWrapper.querySelectorAll(".ind-nav-item");
  const panels = indWrapper.querySelectorAll(".ind-panel");
  const defaultPanel = indWrapper.querySelector('[data-panel="default"]');

  let panelTimer;

  const showPanel = (targetKey) => {
    clearTimeout(panelTimer);
    panels.forEach((p) => p.classList.remove("is-active"));
    navItems.forEach((i) => i.classList.remove("is-active"));

    const panel = indWrapper.querySelector('[data-panel="' + targetKey + '"]');
    const item = indWrapper.querySelector('[data-ind="' + targetKey + '"]');
    if (panel) panel.classList.add("is-active");
    if (item) item.classList.add("is-active");
  };

  const showDefault = () => {
    panelTimer = setTimeout(() => {
      panels.forEach((p) => p.classList.remove("is-active"));
      navItems.forEach((i) => i.classList.remove("is-active"));
      if (defaultPanel) defaultPanel.classList.add("is-active");
    }, 100);
  };

  navItems.forEach((item) => {
    item.addEventListener("mouseenter", () => {
      showPanel(item.dataset.ind);
    });
  });

  const indRight = indWrapper.querySelector(".ind-right");
  const indLeft = indWrapper.querySelector(".ind-left");

  if (indLeft) {
    indLeft.addEventListener("mouseleave", showDefault);
  }

  if (indRight) {
    indRight.addEventListener("mouseenter", () => clearTimeout(panelTimer));
  }
});
