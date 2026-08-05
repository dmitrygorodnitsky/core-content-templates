// lab-ui block · language.locale-dropdown
// Toggle + outside-click close + active-locale state + optional API hydration.
// Idempotent: safe to load multiple times (uses dataset flag to dedupe).

(() => {
  const FALLBACK = [
    { code: "en-US", code2: "en", name: "English (US)", nativeName: "English (US)" },
    { code: "fr-CA", code2: "fr", name: "Français (CA)", nativeName: "Français (CA)" },
    { code: "es",    code2: "es", name: "Español", nativeName: "Español" },
  ];

  const LOCALE_TO_COUNTRY = {
    en: "us", zh: "cn", ar: "sa", ko: "kr", ja: "jp", uk: "ua", cs: "cz",
    el: "gr", da: "dk", sv: "se", fi: "fi", nb: "no", vi: "vn", fa: "ir",
    he: "il", hi: "in", ms: "my", th: "th", id: "id", et: "ee", lv: "lv",
    lt: "lt", sl: "si", sk: "sk", kk: "kz", kz: "kz", es: "es", fr: "fr",
  };

  const shortCodeForLocale = (code) => {
    const language = String(code || "en")
      .replace("_", "-")
      .split("-")[0]
      .slice(0, 2)
      .toUpperCase();
    return /^[A-Z]{2}$/.test(language) ? language : "EN";
  };

  const normalizeLanguageCode = (code) =>
    String(code || "en")
      .replace("_", "-")
      .split("-")[0]
      .toLowerCase();

  const codeForLanguage = (language) =>
    String(language?.code2 || normalizeLanguageCode(language?.code || language?.locale || language?.id || "en")).toLowerCase();

  const nameForLanguage = (language, code) =>
    language?.nativeName || language?.name || language?.label || language?.title || code;

  const getLocaleFromURL = () =>
    new URLSearchParams(window.location.search).get("locale");

  const setLocaleInURL = (value) => {
    const url = new URL(window.location.href);
    url.searchParams.set("locale", value);
    window.location.assign(url.toString());
  };

  const detectBrowserLocale = (availableLanguages) => {
    const browserLangs = navigator.languages?.length
      ? navigator.languages
      : [navigator.language || navigator.userLanguage || "en"];

    for (const browserLang of browserLangs) {
      const code = normalizeLanguageCode(browserLang);
      const match = availableLanguages.find((language) => codeForLanguage(language) === code);
      if (match) return codeForLanguage(match);
    }
    return "en";
  };

  const countryCodeForLocale = (code) => {
    const parts = String(code || "en")
      .replace("_", "-")
      .toLowerCase()
      .split("-")
      .filter(Boolean);
    const language = parts[0] || "en";
    const region = parts[1];
    return (region && /^[a-z]{2}$/.test(region) ? region : LOCALE_TO_COUNTRY[language] || language).slice(0, 2);
  };

  const flagEmojiForCountry = (countryCode) => {
    const country = String(countryCode || "us").toUpperCase();
    if (!/^[A-Z]{2}$/.test(country)) return "";
    return String.fromCodePoint(...[...country].map((letter) => 127397 + letter.charCodeAt(0)));
  };

  const flagImageUrlForCountry = (countryCode) =>
    "https://flagcdn.com/w40/" + String(countryCode || "us").toLowerCase() + ".png";

  const createFlagElement = (code) => {
    const country = countryCodeForLocale(code);
    const flag = document.createElement("span");
    flag.className = "locale-flag flag-icon flag-icon-" + country;
    flag.setAttribute("aria-hidden", "true");
    const img = document.createElement("img");
    img.className = "locale-flag-img";
    img.src = flagImageUrlForCountry(country);
    img.alt = "";
    img.loading = "lazy";
    img.decoding = "async";
    img.addEventListener("error", () => {
      flag.classList.add("is-fallback");
    }, { once: true });
    const fallback = document.createElement("span");
    fallback.className = "locale-flag-fallback";
    fallback.textContent = flagEmojiForCountry(country);
    flag.appendChild(img);
    flag.appendChild(fallback);
    return flag;
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
      trigger.querySelectorAll(".locale-trigger-left .locale-flag").forEach((flag) => flag.remove());
      const existingFlag = Array.from(trigger.children).find((child) => child.classList?.contains("locale-flag"));
      const nextFlag = createFlagElement(code);
      if (existingFlag) existingFlag.replaceWith(nextFlag);
      else trigger.appendChild(nextFlag);
      list.querySelectorAll(".locale-item").forEach((item) => {
        const active = item.dataset.locale === code;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-selected", String(active));
      });
    };

    const render = (langs) => {
      const current = normalizeLanguageCode(getLocaleFromURL() || detectBrowserLocale(langs));
      list.replaceChildren();
      langs.forEach((l) => {
        const code = codeForLanguage(l);
        const name = nameForLanguage(l, code);
        const li = document.createElement("li");
        li.className = "locale-item";
        li.dataset.locale = code;
        li.dataset.shortCode = shortCodeForLocale(code);
        li.setAttribute("role", "option");
        const codeSpan = document.createElement("span");
        codeSpan.className = "locale-item-code";
        codeSpan.setAttribute("aria-hidden", "true");
        codeSpan.textContent = shortCodeForLocale(code);
        const labelSpan = document.createElement("span");
        labelSpan.className = "locale-item-label";
        labelSpan.textContent = name;
        const check = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        check.setAttribute("class", "locale-check");
        check.setAttribute("width", "14");
        check.setAttribute("height", "14");
        check.setAttribute("viewBox", "0 0 14 14");
        check.setAttribute("fill", "none");
        check.setAttribute("aria-hidden", "true");
        check.innerHTML = `<path d="M3 7L6 10L11 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
        li.appendChild(createFlagElement(code));
        li.appendChild(codeSpan);
        li.appendChild(labelSpan);
        li.appendChild(check);
        li.addEventListener("click", () => {
          try {
            setLocaleInURL(code);
          } catch {
            apply(code, name);
            close();
          }
        });
        list.appendChild(li);
      });
      const active = langs.find((l) => codeForLanguage(l) === current) || langs[0];
      const activeCode = codeForLanguage(active);
      apply(activeCode, nameForLanguage(active, activeCode));
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
    fetch("/core/api/language/active.json", {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify([{ name: "code2" }, { name: "nativeName" }]),
    })
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
