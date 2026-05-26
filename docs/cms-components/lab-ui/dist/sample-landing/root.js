(() => {
  if (window.__LAB_UI_CMS_FAMILY_INIT__) return;
  window.__LAB_UI_CMS_FAMILY_INIT__ = true;
})();

/* generated root JS: 04-language/language.locale-dropdown/block.js */
// lab-ui block · language.locale-dropdown
// Toggle + outside-click close + active-locale state + optional API hydration.
// Idempotent: safe to load multiple times (uses dataset flag to dedupe).

(() => {
  const FALLBACK = [
    { code: "en-US", name: "English (US)" },
    { code: "fr-CA", name: "Français (CA)" },
    { code: "es",    name: "Español" },
  ];

  const shortCodeForLocale = (code) => {
    const language = String(code || "en")
      .replace("_", "-")
      .split("-")[0]
      .slice(0, 2)
      .toUpperCase();
    return /^[A-Z]{2}$/.test(language) ? language : "EN";
  };

  const init = (selector) => {
    if (selector.dataset.localeInit === "1") return;
    selector.dataset.localeInit = "1";

    const trigger = selector.querySelector(".locale-trigger");
    const label   = selector.querySelector(".locale-trigger-label");
    const list    = selector.querySelector(".locale-list");
    if (!trigger || !label || !list) return;

    const close = () => {
      selector.classList.remove("is-open");
      trigger.setAttribute("aria-expanded", "false");
    };
    const open = () => {
      document.querySelectorAll(".locale-selector.is-open").forEach((s) => {
        if (s !== selector) s.classList.remove("is-open");
      });
      selector.classList.add("is-open");
      trigger.setAttribute("aria-expanded", "true");
    };

    const apply = (code, name) => {
      label.textContent = name;
      trigger.dataset.shortCode = shortCodeForLocale(code);
      trigger.dataset.locale = code;
      list.querySelectorAll(".locale-item").forEach((item) => {
        const active = item.dataset.locale === code;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-selected", String(active));
      });
    };

    const render = (langs) => {
      const current = new URL(window.location.href).searchParams.get("locale") || "en-US";
      list.replaceChildren();
      langs.forEach((l) => {
        const code = l.code || l.locale || l.id || "en-US";
        const name = l.name || l.label || l.title || code;
        const li = document.createElement("li");
        li.className = "locale-item";
        li.dataset.locale = code;
        li.dataset.shortCode = shortCodeForLocale(code);
        li.setAttribute("role", "option");
        li.innerHTML =
          `<span class="locale-item-code" aria-hidden="true">${shortCodeForLocale(code)}</span>` +
          `<span class="locale-item-label">${name}</span>` +
          `<svg class="locale-check" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">` +
            `<path d="M3 7L6 10L11 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` +
          `</svg>`;
        li.addEventListener("click", () => {
          try {
            const url = new URL(window.location.href);
            url.searchParams.set("locale", code);
            window.history.replaceState({}, "", url.toString());
          } catch {}
          apply(code, name);
          close();
        });
        list.appendChild(li);
      });
      const active = langs.find((l) => (l.code || l.locale || l.id) === current) || langs[0];
      apply(active.code || active.locale || active.id || "en-US",
            active.name || active.label || active.title || "English (US)");
    };

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      selector.classList.contains("is-open") ? close() : open();
    });
    document.addEventListener("click", (e) => {
      if (!selector.contains(e.target)) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    if (window.location.protocol === "file:") {
      // Static preview / harness — render fallback.
      render(FALLBACK);
      return;
    }
    fetch("/core/api/language/active.json", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((p) => {
        const langs = Array.isArray(p) ? p : p?.items || p?.data || p?.result;
        render(Array.isArray(langs) && langs.length ? langs : FALLBACK);
      })
      .catch(() => render(FALLBACK));
  };

  const ready = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else fn();
  };

  ready(() => {
    document.querySelectorAll('[data-block="language.locale-dropdown"]').forEach(init);
  });
})();


/* generated root JS: 01-header/header.default/block.js */
// lab-ui block · header.default
// - Tap-toggle desktop panels on touch devices
// - Click-outside closes the open panel
// - Esc closes the open panel
// - Burger toggles .is-open on the header host (mobile full-width menu)
// - Auto-hide empty mega columns + mega/list/link slots whose label
//   is empty / still a handlebars placeholder

(() => {
  const ready = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else fn();
  };

  const isPlaceholder = (s) =>
    !s || /^\{\{[a-z0-9_]+\}\}$/i.test(s.trim());

  function pruneEmptySlots(header) {
    // Hide mega-links whose label is unset
    header.querySelectorAll(".nav-mega-link, .nav-list-link").forEach((a) => {
      if (isPlaceholder(a.textContent)) a.hidden = true;
    });
    // Hide mega columns whose title is unset OR whose links are all hidden
    header.querySelectorAll(".nav-mega-col").forEach((col) => {
      const title = col.querySelector(".nav-mega-title")?.textContent ?? "";
      const allLinksHidden = [...col.querySelectorAll(".nav-mega-link")]
        .every((a) => a.hidden);
      if (isPlaceholder(title) && allLinksHidden) col.hidden = true;
    });
    // Hide whole nav-item if its label / trigger / anchor is empty
    header.querySelectorAll("[data-nav-item]").forEach((item) => {
      const label =
        item.querySelector(".nav-trigger")?.firstChild?.textContent ??
        item.querySelector("a.nav-link")?.textContent ??
        "";
      if (isPlaceholder(label)) item.hidden = true;
    });
  }

  function pruneBreadcrumb(chip) {
    ["1", "2"].forEach((idx) => {
      const link = chip.querySelector(`[data-mid="${idx}"]`);
      const text = link?.textContent?.trim();
      if (link && isPlaceholder(text)) {
        link.hidden = true;
        const sep = chip.querySelector(`[data-sep-for="mid_${idx}"]`);
        if (sep) sep.hidden = true;
      }
    });

    const root = chip.querySelector(".bc-root")?.textContent?.trim();
    const current = chip.querySelector(".bc-current")?.textContent?.trim();
    if (isPlaceholder(root) || isPlaceholder(current)) {
      chip.hidden = true;
    }
  }

  function wireTapToggle(header) {
    // Tap toggle for coarse-pointer desktop widths. Narrow viewports
    // render panel links inline inside the burger menu, without accordion
    // state.
    let openItem = null;
    const shouldClickToggle = () =>
      window.matchMedia("(pointer: coarse)").matches &&
      !window.matchMedia("(max-width: 1024px)").matches;
    const closeOpen = () => {
      if (!openItem) return;
      openItem.dataset.open = "false";
      const trig = openItem.querySelector(".nav-trigger");
      trig?.setAttribute("aria-expanded", "false");
      openItem = null;
    };

    header.querySelectorAll('[data-nav-item][data-kind="dropdown"], [data-nav-item][data-kind="mega"]').forEach((item) => {
      const trigger = item.querySelector(".nav-trigger");
      if (!trigger) return;
      trigger.addEventListener("click", (e) => {
        if (!shouldClickToggle()) return;
        e.preventDefault();
        const willOpen = openItem !== item;
        closeOpen();
        if (willOpen) {
          item.dataset.open = "true";
          trigger.setAttribute("aria-expanded", "true");
          openItem = item;
        }
      });
    });

    document.addEventListener("click", (e) => {
      if (openItem && !openItem.contains(e.target)) closeOpen();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeOpen();
    });
  }

  function wireBurger(header) {
    const burger = header.querySelector(".burger");
    if (!burger) return;
    // Prefer .header-host wrapper if present (older harness pattern),
    // fall back to <body> (recommended page pattern — body is host).
    const host =
      header.closest(".header-host") ||
      document.body;
    const setMobilePanelState = (open) => {
      if (!window.matchMedia("(max-width: 1024px)").matches) return;
      header.querySelectorAll(".nav-trigger").forEach((trigger) => {
        trigger.setAttribute("aria-expanded", String(open));
      });
    };
    burger.addEventListener("click", () => {
      const open = host.classList.toggle("is-open");
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      setMobilePanelState(open);
    });
    header.querySelectorAll('.header-nav a[href]').forEach((link) => {
      link.addEventListener("click", () => {
        host.classList.remove("is-open");
        burger.setAttribute("aria-expanded", "false");
        burger.setAttribute("aria-label", "Open menu");
        setMobilePanelState(false);
      });
    });
  }

  ready(() => {
    document.querySelectorAll('[data-block="header.default"]').forEach((header) => {
      pruneEmptySlots(header);
      wireTapToggle(header);
      wireBurger(header);
    });
    document.querySelectorAll('[data-block="header.default-breadcrumb"]').forEach(pruneBreadcrumb);
  });
})();


/* generated root JS: 06-features/features.accordion-2col-numbered/block.js */
// lab-ui block · features.accordion-2col-numbered
// Toggle .is-open on click. Multiple rows can be open at the same time
// (matches v5 design source — no one-open rule).
// Hides empty slots automatically (slots whose title is empty / handlebars).

(() => {
  const ready = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else fn();
  };

  ready(() => {
    document
      .querySelectorAll('[data-block="features.accordion-2col-numbered"]')
      .forEach((section) => {
        section.querySelectorAll(".f-row").forEach((row) => {
          // Hide empty slots
          const title = row.querySelector(".f-title")?.textContent?.trim();
          if (!title || /^\{\{slot_\d+_title\}\}$/.test(title)) {
            row.hidden = true;
            return;
          }
          const btn = row.querySelector(".f-row-head");
          if (!btn) return;
          btn.addEventListener("click", () => {
            const isOpen = row.classList.toggle("is-open");
            btn.setAttribute("aria-expanded", String(isOpen));
          });
        });
      });
  });
})();


/* generated root JS: 07-comparison/comparison.three-col-with-mobile-cards/block.js */
// lab-ui block · comparison.three-col-with-mobile-cards
// Auto-hides empty rows and adds mobile expanders for secondary columns.

(() => {
  const ready = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else fn();
  };

  ready(() => {
    document
      .querySelectorAll('[data-block="comparison.three-col-with-mobile-cards"]')
      .forEach((section) => {
        section.querySelectorAll(".compare-body .compare-row").forEach((row) => {
          const cap = row.querySelector(".compare-capability")?.textContent?.trim();
          if (!cap || /^\{\{slot_\d+_capability\}\}$/.test(cap)) {
            row.hidden = true;
            return;
          }

          const secondaryCells = row.querySelectorAll(
            ".compare-cell:not(.compare-cell--capability):not(.compare-cell--sw)"
          );
          const swCell = row.querySelector(".compare-cell--sw");
          if (!swCell || !secondaryCells.length || row.querySelector(".compare-toggle")) return;

          const button = document.createElement("button");
          button.className = "compare-toggle";
          button.type = "button";
          button.setAttribute("aria-expanded", "false");
          button.innerHTML = [
            '<span class="compare-toggle-open">Show other platforms</span>',
            '<span class="compare-toggle-close">Hide other platforms</span>',
            '<span class="compare-toggle-icon" aria-hidden="true"></span>',
          ].join("");
          button.addEventListener("click", () => {
            const isOpen = row.classList.toggle("is-expanded");
            button.setAttribute("aria-expanded", String(isOpen));
          });
          swCell.insertAdjacentElement("afterend", button);
        });
      });
  });
})();


/* generated root JS: 08-faq/faq.bubble-light-grouped/block.js */
// lab-ui block · faq.bubble-light-grouped
// Hides empty FAQ items (q empty / unfilled handlebars). Hides whole groups
// whose title is empty or that have no visible items left.
//
// Toggle behavior is native <details>; we add `is-open` mirror class so CSS
// not relying on `[open]` still works.

(() => {
  const ready = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else fn();
  };

  const isPlaceholder = (s) =>
    !s || /^\{\{[a-z0-9_]+\}\}$/i.test(s);

  ready(() => {
    document
      .querySelectorAll('[data-block="faq.bubble-light-grouped"]')
      .forEach((section) => {
        section.querySelectorAll(".faq-group").forEach((group) => {
          // Hide empty items
          group.querySelectorAll(".faq-item").forEach((item) => {
            const q = item.querySelector(".faq-q-text")?.textContent?.trim();
            if (isPlaceholder(q)) {
              item.hidden = true;
            }
            item.addEventListener("toggle", () => {
              item.classList.toggle("is-open", item.open);
            });
            // Sync initial state
            item.classList.toggle("is-open", item.open);
          });

          // Hide group with no visible items or empty title
          const groupTitle = group
            .querySelector(".faq-group-title")
            ?.textContent?.trim();
          const visibleItems = group.querySelectorAll(
            ".faq-item:not([hidden])"
          ).length;
          if (isPlaceholder(groupTitle) || visibleItems === 0) {
            group.hidden = true;
          }
        });
      });
  });
})();


