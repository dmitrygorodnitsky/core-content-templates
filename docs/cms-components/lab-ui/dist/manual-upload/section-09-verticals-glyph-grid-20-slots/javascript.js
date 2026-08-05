/* generated child JS: 10-verticals-grid/verticals.glyph-grid-20-slots/block.js */
// lab-ui block · verticals.glyph-grid-20-slots
// Hides only empty cards and optional empty card controls. Idempotent.

(() => {
  const ready = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else fn();
  };

  const isBlankOrPlaceholder = (value) => {
    const text = String(value || "").trim();
    return !text || /^\{\{[a-z0-9_]+\}\}$/i.test(text);
  };

  const isEmptyHref = (value) => {
    const href = String(value || "").trim();
    return isBlankOrPlaceholder(href) || href === "#";
  };

  const setHiddenWhenEmpty = (element) => {
    if (!element) return true;
    const shouldHide = isBlankOrPlaceholder(element.textContent);
    element.hidden = shouldHide;
    return shouldHide;
  };

  ready(() => {
    document
      .querySelectorAll('[data-block="verticals.glyph-grid-20-slots"] .vertical-card')
      .forEach((card) => {
        const title = card.querySelector(".vertical-title")?.textContent?.trim();
        if (isBlankOrPlaceholder(title)) {
          card.hidden = true;
          return;
        }

        card.hidden = false;
        setHiddenWhenEmpty(card.querySelector(".vertical-desc"));
        const statusHidden = setHiddenWhenEmpty(card.querySelector(".vertical-status"));
        const photoHint = card.querySelector(".vertical-photo-meta .hint");
        if (photoHint) photoHint.hidden = isBlankOrPlaceholder(photoHint.textContent);

        const cta = card.querySelector(".vertical-waitlist-btn");
        const ctaHidden =
          !cta || isBlankOrPlaceholder(cta.textContent) || isEmptyHref(cta.getAttribute("href"));
        if (cta) cta.hidden = ctaHidden;

        const foot = card.querySelector(".vertical-foot");
        if (foot) foot.hidden = statusHidden && ctaHidden;
      });
  });
})();
