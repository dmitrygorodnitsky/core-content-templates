// lab-ui block · header.sw-default
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
    document.querySelectorAll('[data-block="header.sw-default"]').forEach((header) => {
      pruneEmptySlots(header);
      wireTapToggle(header);
      wireBurger(header);
    });
    document.querySelectorAll('[data-block="header.sw-default-breadcrumb"]').forEach(pruneBreadcrumb);
  });
})();
