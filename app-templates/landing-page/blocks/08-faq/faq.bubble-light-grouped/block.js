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
