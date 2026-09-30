document.addEventListener('DOMContentLoaded', function () {
  if (document.body) {
    document.body.setAttribute('dir', document.documentElement.getAttribute('dir') || 'ltr');
  }
});

document.addEventListener('DOMContentLoaded', function () {
  const FALLBACK_LOCALES = [
    'en', 'zh', 'es', 'de', 'fr', 'ja', 'pt', 'ru', 'it', 'nl', 'pl', 'tr',
    'ar', 'ko', 'uk', 'cs', 'el', 'da', 'sv', 'nb', 'vi', 'fa', 'he', 'hi',
    'ms', 'et', 'sl', 'kk', 'th', 'id', 'ro', 'hu', 'fi', 'bg', 'hr', 'sk',
    'lt', 'lv'
  ];

  let supported = FALLBACK_LOCALES.slice();

  function getPathLocale(pathname) {
    const seg = pathname.split('/')[1];
    return supported.includes(seg) ? seg : null;
  }

  function stripLocale(pathname) {
    const parts = pathname.split('/');
    if (supported.includes(parts[1])) parts.splice(1, 1);
    return parts.join('/') || '/';
  }

  function addLocale(pathname, loc) {
    if (!loc) return pathname;
    const clean = stripLocale(pathname);
    return '/' + loc + (clean === '/' ? '' : clean);
  }

  function rewriteLinks() {
    const locale = getPathLocale(window.location.pathname);

    document.querySelectorAll('a[href]').forEach(function (a) {
      if (a.closest('.locale-selector')) return;

      const href = a.getAttribute('href');
      if (!href || href.startsWith('mailto:') || href.startsWith('tel:')) return;

      if (href === '#') {
        a.addEventListener('click', e => e.preventDefault());
        a.setAttribute('aria-disabled', 'true');
        a.setAttribute('tabindex', '-1');
        return;
      }

      if (href.startsWith('#')) return;

      let url;
      try {
        url = new URL(href, window.location.href);
      } catch (err) {
        return;
      }
      if (url.origin !== window.location.origin) return;

      if (locale) {
        url.pathname = addLocale(url.pathname, locale);
        a.setAttribute('href', url.pathname + url.search + url.hash);
      }
    });
  }

  fetch('/core/api/language/active.json', {
    method: 'POST',
    headers: { 'accept': 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify([{ name: 'code2' }])
  })
    .then(res => (res.ok ? res.json() : null))
    .then(langs => {
      if (Array.isArray(langs) && langs.length) {
        supported = langs.map(l => (l.code2 || '').toLowerCase()).filter(Boolean);
      }
    })
    .catch(() => { /* остаётся FALLBACK_LOCALES */ })
    .finally(rewriteLinks);
});
