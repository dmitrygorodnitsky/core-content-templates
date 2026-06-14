/* generated child JS: 07-comparison/comparison.two-col-seo-matrix/block.js */
// lab-ui block · comparison.two-col-seo-matrix
// Applies CMS-authored status icon values.

(() => {
  const ready = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else fn();
  };

  ready(() => {
    document
      .querySelectorAll('[data-block="comparison.two-col-seo-matrix"]')
      .forEach((section) => {
        section.querySelectorAll(".seo-compare-value-body").forEach((valueBody) => {
          const rawIcon = valueBody.querySelector(".seo-compare-icon-source")?.textContent?.trim();
          const icon = /^(check|yes|neutral|partial|cross|no|none)$/.test(rawIcon || "")
            ? rawIcon
            : "neutral";
          valueBody.classList.add("seo-compare-status--" + icon);
        });
      });
  });
})();
