// lab-ui block · verticals.glyph-grid-20-slots
// Hides cards whose title text is empty (so CMS-side "clear a slot" auto-removes
// the card without touching markup). Idempotent.

(() => {
  const ready = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else fn();
  };

  ready(() => {
    document
      .querySelectorAll('[data-block="verticals.glyph-grid-20-slots"] .vertical-card')
      .forEach((card) => {
        const title = card.querySelector(".vertical-title")?.textContent?.trim();
        if (!title || /^\{\{slot_\d+_title\}\}$/.test(title)) card.hidden = true;
        else card.hidden = false;
      });
  });
})();
