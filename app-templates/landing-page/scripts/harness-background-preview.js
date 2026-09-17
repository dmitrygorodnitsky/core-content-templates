(function () {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("bg") || "none";
  if (mode === "none") return;

  const target = document.querySelector("[data-block]") || document.querySelector("section");
  if (!target) return;

  const style = document.createElement("style");
  style.textContent = `
    [data-bg-preview] {
      position: relative;
      isolation: isolate;
      overflow: hidden;
    }
    [data-bg-preview]::before {
      content: "";
      position: absolute;
      inset: 0;
      z-index: 0;
      pointer-events: none;
      background: var(--lab-bg-preview);
      background-size: cover;
      background-position: center;
      opacity: var(--lab-bg-preview-opacity, 1);
    }
    [data-bg-preview] > * {
      position: relative;
      z-index: 1;
    }
  `;
  document.head.append(style);

  const defaultGradient = [
    "radial-gradient(70% 60% at 85% 12%, color-mix(in srgb, var(--cta-accent, #6BEAF9) 18%, transparent), transparent 65%)",
    "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(244,246,250,0.65) 100%)",
  ].join(", ");

  const imagePreview = [
    "linear-gradient(180deg, rgba(255,255,255,0.84), rgba(255,255,255,0.9))",
    "repeating-linear-gradient(135deg, rgba(15,17,22,0.04) 0 10px, rgba(15,17,22,0.075) 10px 20px)",
  ].join(", ");

  let background = null;
  if (mode === "gradient") {
    background = params.get("bgGradient") || defaultGradient;
  }
  if (mode === "image") {
    const imageUrl = params.get("bgImage");
    background = imageUrl
      ? `linear-gradient(180deg, rgba(255,255,255,0.78), rgba(255,255,255,0.9)), url("${imageUrl.replace(/"/g, "%22")}")`
      : imagePreview;
  }

  if (!background) return;
  target.dataset.bgPreview = mode;
  target.style.setProperty("--lab-bg-preview", background);
})();
