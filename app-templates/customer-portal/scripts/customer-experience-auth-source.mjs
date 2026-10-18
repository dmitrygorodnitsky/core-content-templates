const localizedType = "LOCALIZED_STRING_SS";

export const AUTH_LOGIN_STYLE_NAMES = [
  "tokens.css",
  "base.css",
  "shell.css",
  "components.css",
  "routes.css",
  "core-auth-login.css",
];

export const LOGIN_RUNTIME_PLACEHOLDERS = [
  "LOGIN_ACTION",
  "CSRF_PARAMETER_NAME",
  "CSRF_TOKEN",
  "RESET_PASSWORD_URL",
  "ERROR_DISPLAY",
  "LOGOUT_DISPLAY",
];

export const LOGIN_COPY_SLOTS = {
  "page.documentTitle": "LOGIN_DOCUMENT_TITLE",
  "brand.name": "CX_BRAND_NAME",
  "card.title": "LOGIN_CARD_TITLE",
  "card.subtitle": "LOGIN_CARD_SUBTITLE",
  "error.title": "LOGIN_ERROR_TITLE",
  "error.body": "LOGIN_ERROR_BODY",
  "logout.title": "LOGIN_LOGOUT_TITLE",
  "logout.body": "LOGIN_LOGOUT_BODY",
  "field.username.label": "LOGIN_USERNAME_LABEL",
  "field.password.label": "LOGIN_PASSWORD_LABEL",
  "link.resetPassword": "LOGIN_FORGOT_PASSWORD_LABEL",
  "action.showPassword": "LOGIN_SHOW_PASSWORD_LABEL",
  "action.hidePassword": "LOGIN_HIDE_PASSWORD_LABEL",
  "action.submit": "LOGIN_SUBMIT_LABEL",
  "card.note": "LOGIN_CARD_NOTE",
  "pitch.eyebrow": "LOGIN_PITCH_EYEBROW",
  "pitch.title": "LOGIN_PITCH_TITLE",
  "pitch.body": "LOGIN_PITCH_BODY",
};

export function validateAcceptedLoginSource(source) {
  const withoutComments = stripHtmlComments(source);
  for (const placeholder of LOGIN_RUNTIME_PLACEHOLDERS) {
    requireContract(countOccurrences(withoutComments, "{{" + placeholder + "}}") === 1, "Login source must preserve exactly one Core Auth placeholder " + placeholder);
  }
  requireContract((withoutComments.match(/<form\b/gi) || []).length === 1, "Login source must contain exactly one form");
  requireContract((withoutComments.match(/data-core-auth-login\b/gi) || []).length === 1, "Login source must contain exactly one marked form");
  requireContract(/<form[^>]+method="post"[^>]+action="\{\{LOGIN_ACTION\}\}"[^>]+data-core-auth-login/i.test(withoutComments), "Login source form contract drifted");
  requireContract(/name="username"[^>]+autocomplete="username"/i.test(withoutComments), "Login source username contract drifted");
  requireContract(/name="password"[^>]+autocomplete="current-password"/i.test(withoutComments), "Login source password contract drifted");
  requireContract(!/https?:\/\//i.test(stripPreviewCommentsAndStyles(withoutComments)), "Login source must not depend on a third-party origin");

  const actualSlots = [...withoutComments.matchAll(/data-copy="([^"]+)"/g)].map((match) => match[1]);
  const expectedSlots = Object.keys(LOGIN_COPY_SLOTS);
  requireContract(new Set(actualSlots).size === actualSlots.length, "Login source data-copy slots must be unique");
  requireContract(JSON.stringify(actualSlots.slice().sort()) === JSON.stringify(expectedSlots.slice().sort()), "Login source data-copy inventory drifted");
  return source;
}

export function compileAcceptedLoginSource(source, stylesByName) {
  validateAcceptedLoginSource(source);
  const productionDocument = stripLoginPreviewHarness(source);
  const scriptMatches = [...productionDocument.matchAll(/<script(?![^>]*data-dev-toolbar)[^>]*>([\s\S]*?)<\/script>/gi)];
  requireContract(scriptMatches.length === 1, "Accepted login must contain exactly one production enhancement script");
  const javascript = [scriptMatches[0][1].trim(), directSessionLoginBootstrapJavascript()].join("\n\n");
  const withoutScripts = productionDocument.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
  const bodyMatch = withoutScripts.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  requireContract(Boolean(bodyMatch), "Accepted login source has no body");
  let body = bodyMatch[1].trim();
  for (const [slot, code] of Object.entries(LOGIN_COPY_SLOTS)) {
    if (slot === "page.documentTitle") continue;
    body = replaceCopySlot(body, slot, parameterRef(code));
  }
  body = addRawCmsDisplayFallback(body, ["ERROR_DISPLAY", "LOGOUT_DISPLAY"]);
  body = addDirectSessionLoginHooks(body);
  requireContract(!/data-dev-toolbar/.test(body), "Login preview harness leaked into CMS body");
  requireContract(!/<script\b/i.test(body), "Login script must be emitted through the CMS javascript field");

  const css = compileAcceptedLoginCss(stylesByName);
  const head = [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="robots" content="noindex, nofollow">',
    '<title>' + parameterRef(LOGIN_COPY_SLOTS["page.documentTitle"]) + '</title>',
    '<link rel="icon" href="data:,">',
    '<style>',
    css,
    '</style>',
  ].join("\n");
  const html = '<body>\n<div class="auth-root" lang="${CX_LANGUAGE@STRING}" dir="${CX_DIRECTION@STRING}" data-theme="${CX_THEME@STRING}" data-mode="${CX_DEFAULT_MODE@STRING}">\n' + body + '\n</div>\n</body>';
  return { head, html, css: "", javascript };
}

export function stripLoginPreviewHarness(source) {
  let value = stripHtmlComments(source);
  value = value.replace(/<style[^>]*data-dev-toolbar[^>]*>[\s\S]*?<\/style>/gi, "");
  value = value.replace(/<script[^>]*data-dev-toolbar[^>]*>[\s\S]*?<\/script>/gi, "");
  value = value.replace(/<i[^>]*data-dev-toolbar[^>]*>[\s\S]*?<\/i>/gi, "");
  value = value.replace(/<div[^>]*class="[^"]*dev-toolbar[^"]*"[^>]*data-dev-toolbar[^>]*>[\s\S]*?<\/div>/gi, "");
  requireContract(!/data-dev-toolbar/.test(value), "Accepted login preview harness could not be removed deterministically");
  return value;
}

function compileAcceptedLoginCss(stylesByName) {
  return AUTH_LOGIN_STYLE_NAMES.map((name) => {
    requireContract(typeof stylesByName[name] === "string" && stylesByName[name].trim(), "Missing accepted login stylesheet " + name);
    let css = acceptedLoginSection(name, stylesByName[name]).trim().replaceAll(":root", ".auth-root");
    if (name === "base.css") css = css.replace(/(^|})\s*body\s*\{/gm, "$1\n.auth-root {");
    return "/* accepted design source: design-inbox/styles/" + name + " */\n" + css;
  }).join("\n\n");
}

function acceptedLoginSection(name, source) {
  if (name === "tokens.css" || name === "core-auth-login.css") return source;
  if (name === "base.css") return sliceBefore(source, "@keyframes sheen");
  if (name === "shell.css") return sliceBetween(source, ".brand-logo {", ".nav-links {");
  if (name === "components.css") {
    return [
      sliceBetween(source, ".btn {", "/* ============================================================\n   PageHeader"),
      sliceBetween(source, ".field-row {", ".contact-form {"),
    ].join("\n\n");
  }
  if (name === "routes.css") {
    return [
      sliceBetween(source, ".eyebrow {", ".section-head {"),
      sliceBetween(source, ".auth-page {", ".auth-phone {"),
    ].join("\n\n");
  }
  throw new Error("Unsupported accepted login stylesheet " + name);
}

function sliceBefore(source, marker) {
  const end = source.indexOf(marker);
  requireContract(end >= 0, "Accepted auth CSS marker is missing: " + marker);
  return source.slice(0, end);
}

function sliceBetween(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  requireContract(start >= 0 && end > start, "Accepted auth CSS markers are missing or out of order: " + startMarker + " -> " + endMarker);
  return source.slice(start, end);
}

function replaceCopySlot(body, slot, replacement) {
  const pattern = new RegExp('(<([a-z][a-z0-9]*)\\b[^>]*\\bdata-copy="' + escapeRegex(slot) + '"[^>]*>)([\\s\\S]*?)(<\\/\\2>)', "gi");
  let count = 0;
  const result = body.replace(pattern, (match, open, tag, current, close) => {
    count += 1;
    requireContract(!/<[a-z][^>]*>/i.test(current), "Login copy slot must remain a leaf element: " + slot);
    return open + replacement + close;
  });
  requireContract(count === 1, "Login copy slot must occur exactly once: " + slot);
  return result;
}

function addRawCmsDisplayFallback(body, placeholders) {
  let result = body;
  for (const placeholder of placeholders) {
    const marker = 'style="display:{{' + placeholder + '}}"';
    requireContract(countOccurrences(result, marker) === 1, "Login display-state contract drifted for " + placeholder);
    // A direct CMS read leaves the placeholder unresolved. In that case the
    // second declaration is invalid and the safe hidden default remains. Once
    // Core Auth substitutes block|none, the later declaration wins normally.
    result = result.replace(marker, 'style="display:none;display:{{' + placeholder + '}}"');
  }
  return result;
}

function addDirectSessionLoginHooks(body) {
  const replacements = [
    ['data-core-auth-login>', 'data-core-auth-login data-login-success-url="${CX_PORTAL_URL@STRING}">'],
    ['<input type="hidden" name="{{CSRF_PARAMETER_NAME}}" value="{{CSRF_TOKEN}}">', '<input type="hidden" name="{{CSRF_PARAMETER_NAME}}" value="{{CSRF_TOKEN}}" data-login-csrf>'],
    ['<a class="auth-link" href="{{RESET_PASSWORD_URL}}"', '<a class="auth-link" href="{{RESET_PASSWORD_URL}}" data-login-reset'],
    ['type="submit" data-copy="action.submit"', 'type="submit" data-copy="action.submit" data-login-submit'],
  ];
  let result = body;
  for (const [marker, replacement] of replacements) {
    requireContract(countOccurrences(result, marker) === 1, "Login direct-session hook contract drifted: " + marker);
    result = result.replace(marker, replacement);
  }
  return result;
}

function directSessionLoginBootstrapJavascript() {
  return [
    "(function () {",
    "  var form = document.querySelector('[data-core-auth-login]');",
    "  if (!form) return;",
    "  var submit = form.querySelector('[data-login-submit]');",
    "  var csrf = form.querySelector('[data-login-csrf]');",
    "  var username = form.querySelector('input[name=\"username\"]');",
    "  var password = form.querySelector('input[name=\"password\"]');",
    "  var reset = document.querySelector('[data-login-reset]');",
    "  var error = document.getElementById('auth-error-message');",
    "  var logout = document.getElementById('auth-logout-message');",
    "  if (!submit || !csrf || !username || !password) return;",
    "",
    "  var actionPath = '/oauth2/login';",
    "  var resetPath = '/oauth2/forgot-password';",
    "  var rawAction = form.getAttribute('action') || '';",
    "  var rawCsrfName = csrf.getAttribute('name') || '';",
    "  var rawCsrfValue = csrf.getAttribute('value') || '';",
    "  var directMode = rawAction.indexOf('{{') !== -1 || rawCsrfName.indexOf('{{') !== -1 || rawCsrfValue.indexOf('{{') !== -1;",
    "  if (!directMode) {",
    "    submit.disabled = false;",
    "    form.removeAttribute('aria-busy');",
    "    return;",
    "  }",
    "",
    "  var successUrl;",
    "  try {",
    "    var requestUrl = new URL(window.location.href);",
    "    var successTarget = (requestUrl.searchParams.get('returnUrl') || form.getAttribute('data-login-success-url') || '').trim();",
    "    if (!successTarget) throw new Error('Login return is unavailable');",
    "    successUrl = new URL(successTarget, window.location.origin);",
    "    if (successUrl.origin !== window.location.origin) throw new Error('Cross-origin login return is forbidden');",
    "    if (successUrl.pathname === actionPath || successUrl.pathname === requestUrl.pathname) throw new Error('Login return loop is forbidden');",
    "  } catch (failure) {",
    "    submit.disabled = true;",
    "    form.setAttribute('data-login-bootstrap-state', 'error');",
    "    return;",
    "  }",
    "",
    "  var ready = false;",
    "  var submitting = false;",
    "  var bootstrapPromise = null;",
    "  if (reset) reset.setAttribute('href', resetPath);",
    "",
    "  function setPending(pending) {",
    "    submit.disabled = pending;",
    "    if (pending) form.setAttribute('aria-busy', 'true');",
    "    else form.removeAttribute('aria-busy');",
    "  }",
    "",
    "  function loginParts(html) {",
    "    var parsed = new DOMParser().parseFromString(html, 'text/html');",
    "    var sourceForm = parsed.querySelector('form[action=\"/oauth2/login\"]');",
    "    var sourceCsrf = sourceForm && sourceForm.querySelector('input[name=\"_csrf\"]');",
    "    var token = sourceCsrf && sourceCsrf.getAttribute('value');",
    "    if (!token || token.length > 2048) throw new Error('Login CSRF token is unavailable');",
    "    return { name: '_csrf', token: token };",
    "  }",
    "",
    "  function applyLoginParts(parts) {",
    "    csrf.setAttribute('name', parts.name);",
    "    csrf.setAttribute('value', parts.token);",
    "    form.setAttribute('action', actionPath);",
    "  }",
    "",
    "  function bootstrap() {",
    "    if (bootstrapPromise) return bootstrapPromise;",
    "    ready = false;",
    "    setPending(true);",
    "    form.setAttribute('data-login-bootstrap-state', 'pending');",
    "    bootstrapPromise = fetch(actionPath, {",
    "      method: 'GET',",
    "      credentials: 'same-origin',",
    "      cache: 'no-store',",
    "      headers: { Accept: 'text/html' }",
    "    }).then(function (response) {",
    "      if (!response.ok) throw new Error('Login bootstrap failed');",
    "      var finalUrl = new URL(response.url, window.location.origin);",
    "      if (finalUrl.pathname !== actionPath) {",
    "        window.location.assign(successUrl.href);",
    "        return null;",
    "      }",
    "      return response.text();",
    "    }).then(function (html) {",
    "      if (html === null) return;",
    "      applyLoginParts(loginParts(html));",
    "      ready = true;",
    "      form.setAttribute('data-login-bootstrap-state', 'ready');",
    "      setPending(false);",
    "    }).catch(function () {",
    "      bootstrapPromise = null;",
    "      ready = false;",
    "      form.setAttribute('data-login-bootstrap-state', 'error');",
    "      setPending(true);",
    "    });",
    "    return bootstrapPromise;",
    "  }",
    "",
    "  function completeFailure(html) {",
    "    try { applyLoginParts(loginParts(html)); } catch (ignored) { bootstrapPromise = null; bootstrap(); return; }",
    "    submitting = false;",
    "    ready = true;",
    "    form.setAttribute('data-login-bootstrap-state', 'ready');",
    "    if (error) error.style.display = 'block';",
    "    if (logout) logout.style.display = 'none';",
    "    setPending(false);",
    "    password.focus();",
    "  }",
    "",
    "  form.addEventListener('submit', function (event) {",
    "    event.preventDefault();",
    "    if (!ready || submitting) {",
    "      if (!ready) bootstrap();",
    "      return;",
    "    }",
    "    submitting = true;",
    "    ready = false;",
    "    setPending(true);",
    "    if (error) error.style.display = 'none';",
    "",
    "    var body = new URLSearchParams();",
    "    body.set('username', username.value);",
    "    body.set('password', password.value);",
    "    body.set(csrf.getAttribute('name'), csrf.getAttribute('value'));",
    "    fetch(actionPath, {",
    "      method: 'POST',",
    "      credentials: 'same-origin',",
    "      redirect: 'follow',",
    "      headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'text/html' },",
    "      body: body.toString()",
    "    }).then(function (response) {",
    "      return response.text().then(function (html) { return { response: response, html: html }; });",
    "    }).then(function (result) {",
    "      var finalUrl = new URL(result.response.url, window.location.origin);",
    "      if (finalUrl.pathname === actionPath && finalUrl.searchParams.has('error')) {",
    "        completeFailure(result.html);",
    "        return;",
    "      }",
    "      if (finalUrl.pathname === actionPath) {",
    "        submitting = false;",
    "        bootstrapPromise = null;",
    "        bootstrap();",
    "        return;",
    "      }",
    "      if (finalUrl.pathname === '/oauth2' || finalUrl.pathname === '/oauth2/') window.location.assign(successUrl.href);",
    "      else window.location.assign(finalUrl.href);",
    "    }).catch(function () {",
    "      submitting = false;",
    "      bootstrapPromise = null;",
    "      bootstrap();",
    "    });",
    "  });",
    "",
    "  bootstrap();",
    "})();",
  ].join("\n");
}

function stripPreviewCommentsAndStyles(value) {
  return String(value).replace(/<style[^>]*data-dev-toolbar[^>]*>[\s\S]*?<\/style>/gi, "");
}

function stripHtmlComments(value) { return String(value).replace(/<!--[\s\S]*?-->/g, ""); }
function countOccurrences(value, needle) { return String(value).split(needle).length - 1; }
function parameterRef(code) { return "${" + code + "@" + localizedType + "}"; }
function escapeRegex(value) { return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function requireContract(condition, message) { if (!condition) throw new Error(message); }
