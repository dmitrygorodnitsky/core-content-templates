/* generated child JS: 02-footer/footer.corporate-reference/block.js */
// lab-ui block · footer.corporate-reference
// Imported from CMS BlockTemplate 8d9f72c2-51ae-4f40-a726-3562be0e75e5 (FOOTER).

document.addEventListener('DOMContentLoaded', () => {
  const footer = document.querySelector('.footer');

  if (footer) {
    const bg = footer.getAttribute('data-bg');

    if (bg) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            footer.style.setProperty('--footer-bg', 'url("' + bg + '")');
            observer.unobserve(footer);
          });
        },
        { rootMargin: '200px', threshold: 0 }
      );

      observer.observe(footer);
    }
  }
});
