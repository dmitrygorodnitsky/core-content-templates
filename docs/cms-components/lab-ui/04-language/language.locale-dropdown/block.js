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
          '<span class="locale-item-code" aria-hidden="true">' + shortCodeForLocale(code) + '</span>' +
          '<span class="locale-item-label">' + name + '</span>' +
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
