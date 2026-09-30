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
