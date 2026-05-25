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
