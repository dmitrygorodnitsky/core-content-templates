# CUSTOMER_PORTAL_CALM_HARBOR_LOGIN

Source for the live BlockTemplate `bf6bb842-e02b-4f1b-8b13-48cf92bd0e3c`.

CMS skin for the `core-auth` login page. `core-auth` retrieves this page from
`core-cms` server-to-server, substitutes its runtime placeholders, and serves
the result from its own origin. The CMS supplies presentation only — it never
receives the username, password, CSRF token, session, or authentication
cookies.

Standalone root template: no children, no third-party assets, and no dependency
on JavaScript.

## Provenance

Transferred 1:1 from the accepted design package —
`app-templates/customer-portal/design-inbox/core-auth-login.html` and
`styles/core-auth-login.css` (Wave 18), against the brief in
`app-templates/customer-portal/design-requests/core-auth-cms-login.md`.

CSS is extracted verbatim from the accepted stylesheets and inlined into `head`:
tokens, the base reset, `.brand-logo`, the `.btn` and `.field` primitives,
`.eyebrow`, and the `auth-page` / `auth-grid` / `auth-pitch` / `auth-card`
composition, followed by the page's own rules. Nothing was retyped or restyled.

## The one transfer change

The accepted page hosts its design tokens on `:root` and selects the palette
and mode with `data-theme` / `data-mode` attributes on `<html>`. A CMS block
template cannot set attributes on `<html>` — the CMS owns that element and
supplies `lang` and `dir` from the render locale.

So the token host moved down one level. Every `:root` selector became
`.auth-root`, and the markup opens with:

```html
<div class="auth-root" data-theme="${THEME@STRING}" data-mode="${MODE@STRING}">
```

Custom properties inherit, so everything inside resolves exactly as before.
All seven vertical palettes and the dark overrides carried across unchanged.
`lang` and `dir` still come from the CMS, and RTL still works through the
logical properties the design already used.

## Runtime contract

`core-auth` substitutes these at request time. They must survive CMS rendering
untouched, and nothing else may produce or consume them:

| Placeholder | Where it sits |
| --- | --- |
| `{{LOGIN_ACTION}}` | the form `action` |
| `{{CSRF_PARAMETER_NAME}}` | the hidden input's `name` |
| `{{CSRF_TOKEN}}` | the hidden input's `value` |
| `{{RESET_PASSWORD_URL}}` | the password-reset link `href` |
| `{{ERROR_DISPLAY}}` | `block` or `none` on the assertive region |
| `{{LOGOUT_DISPLAY}}` | `block` or `none` on the polite region |

Invariants the page must keep, or `core-auth` falls back to its bundled page:

- exactly one `<form>`, marked `data-core-auth-login`;
- field names `username` and `password` — never rename them, never turn them
  into parameters;
- visibility of the two message regions comes only from the inline `display`.
  No class toggling, no `data-state`, no script.

## Parameters

`THEME` (`hvac` · `snow` · `lawn` · `pool` · `roofing` · `pest` · `health` ·
`beauty`) and `MODE` (`light` · `dark`) are plain strings. Everything else is a
`LOCALIZED_STRING_SS` copy slot: `TITLE`, `BRAND_NAME`, `CARD_TITLE`,
`CARD_SUBTITLE`, `ERROR_TITLE`, `ERROR_BODY`, `LOGOUT_TITLE`, `LOGOUT_BODY`,
`USERNAME_LABEL`, `PASSWORD_LABEL`, `FORGOT_PASSWORD`, `SHOW_PASSWORD`,
`HIDE_PASSWORD`, `LOGIN_BUTTON`, `CARD_NOTE`, `PITCH_EYEBROW`, `PITCH_TITLE`,
`PITCH_BODY`.

Copy ships in `en` alone. Every one of the 3104 localized parameters already in
this repository carries `en` and nothing else, and the CMS rejects a save whose
value is keyed by a locale the organization has not configured — a first sync
attempt with `ru` present returned `400` from
`/api/block-template/save.json` with an empty body.

Add a locale to a parameter's `value` map only once the organization actually
has it enabled. The Russian copy is kept here so it is not lost:

| Code | ru |
| --- | --- |
| `TITLE` | Вход — Calm Harbor Spa |
| `BRAND_NAME` | Calm Harbor Spa |
| `CARD_TITLE` | Вход |
| `CARD_SUBTITLE` | Введите имя пользователя и пароль, чтобы продолжить. |
| `ERROR_TITLE` | Не удалось выполнить вход |
| `ERROR_BODY` | Проверьте имя пользователя и пароль и попробуйте ещё раз. |
| `LOGOUT_TITLE` | Вы вышли из системы |
| `LOGOUT_BODY` | Сеанс завершён. Войдите снова, чтобы продолжить. |
| `USERNAME_LABEL` | Имя пользователя |
| `PASSWORD_LABEL` | Пароль |
| `FORGOT_PASSWORD` | Забыли пароль? |
| `SHOW_PASSWORD` | Показать |
| `HIDE_PASSWORD` | Скрыть |
| `LOGIN_BUTTON` | Войти |
| `CARD_NOTE` | Мы никогда не запрашиваем пароль по почте, в сообщениях или по телефону. |
| `PITCH_EYEBROW` | Аккаунт клиента |
| `PITCH_TITLE` | Вы входите в сервисе учётных записей. |
| `PITCH_BODY` | Портал направил вас сюда, потому что это единственная страница, где вводится пароль. После входа вы вернётесь туда, откуда пришли. |

Copy is the accepted design's own, verbatim, with one sanctioned substitution:
the design was authored against the `Aircove` fallback brand, and this template
is the Calm Harbor one, so `Aircove` reads `Calm Harbor Spa` in `BRAND_NAME` and
`TITLE`. Nothing else was reworded.

`ar`, `es`, `fr`, `he` and `zh` are untranslated; `ar` and `he` are also the
ones that exercise the RTL layout.

Parameters carry no `options` key. Across the working packages in
`docs/cms-components/lab-ui/dist/` the key appears only where a parameter really
has options, never as an empty array, so it is omitted here rather than sent
as `[]`.

## Page setup

Create the `PageContext` at:

```text
/pages/{ORG_CODE}/auth/login.html
```

or, for a site below the organization root:

```text
/pages/{ORG_CODE}/{CMS_PATH}/auth/login.html
```

The page must render anonymously, so give it no access permissions, and set
`excludeFromSeo` to `true`. The template already emits
`<meta name="robots" content="noindex, nofollow">`, which is what actually
matters once `core-auth` serves the page from its own origin.

## Not covered here

Two-factor authentication is a separate package. It was deliberately not built
alongside this one: its backend contract could not be verified, so the
placeholder names and state set would have been written from the specification
without anything to check them against. Login and 2FA fall back independently,
so a missing custom 2FA page does not affect this one.

Three questions belong to `core-auth` rather than to this template, and are
open:

1. **Locale.** The CMS resolves `LOCALIZED_STRING_SS` from the render locale,
   and the site convention is a `?locale=` query parameter. `core-auth` must
   append it to its server-to-server request, or every skin returns in the
   default language. Suggested precedence: `ui_locales` from the saved OAuth
   request → `locale` on the public auth URL → `Accept-Language` → site
   default, stored in the auth session so 2FA matches login.
2. **Caching.** The substituted response carries a live CSRF token and must be
   `no-store`. The raw CMS HTML holds no secret and should be cached — keyed by
   organization, CMS path, and locale — so a slow CMS does not make every sign-in
   wait, and a brief CMS outage does not flip everyone to the bundled page.
3. **Per-field errors.** The contract has no per-field placeholder, so both
   inputs point `aria-describedby` at the single error region. A per-field
   invalid treatment would need `core-auth` to supply one placeholder per
   field.
