(function (global) {
  "use strict";

  var ns = global.PlanSubscription || (global.PlanSubscription = {});
  var core = ns.core;
  var el = core.el;

  var ICONS = {
    mail: "M3 6.5A2.5 2.5 0 0 1 5.5 4h13A2.5 2.5 0 0 1 21 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-11Zm2.2-.3 6.8 5.4 6.8-5.4M5 18l5.2-5.2M19 18l-5.2-5.2",
    check: "M20 6 9 17l-5-5",
    lock: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z",
    alert: "M12 8v5m0 3.5v.5M10.3 3.9 2.6 17.3A2 2 0 0 0 4.3 20.3h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z",
    link: "M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
    doc: "M7 3h7l5 5v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Zm7 0v5h5M9 13h6M9 17h6",
  };

  function icon(name) {
    var svg = global.document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("class", "ps-icon");
    var path = global.document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", ICONS[name] || ICONS.alert);
    path.setAttribute("stroke", "currentColor");
    path.setAttribute("stroke-width", "1.6");
    path.setAttribute("stroke-linecap", "round");
    path.setAttribute("stroke-linejoin", "round");
    svg.appendChild(path);
    return svg;
  }

  function stepper(labels, active) {
    var children = [];
    labels.forEach(function (label, index) {
      if (index) children.push(el("div", "df-stepper__line", { "aria-hidden": "true" }));
      var modifier = index === active ? " df-stepper__item--active" : index < active ? " df-stepper__item--done" : "";
      children.push(el("div", "df-stepper__item" + modifier, { "aria-current": index === active ? "step" : null }, [
        el("div", "df-stepper__circle", { text: (index < 9 ? "0" : "") + (index + 1) }),
        el("div", "df-stepper__label", { text: label }),
      ]));
    });
    return el("div", "df-stepper ps-stepper", { role: "list" }, children);
  }

  function loader(text) {
    return el("div", "df-loader", { role: "status", dataset: { state: "loading" } }, [
      el("div", "df-spinner", { "aria-hidden": "true" }),
      el("span", null, { text: text }),
    ]);
  }

  function status(options) {
    var tone = options.tone || "info";
    var body = el("div", "ps-status ps-status--" + tone, {
      role: tone === "error" ? "alert" : "status",
      dataset: { state: options.state || tone, visualId: options.visualId || null },
    }, [
      el("div", "ps-status__icon", null, [icon(options.icon || (tone === "success" ? "check" : tone === "error" ? "alert" : "mail"))]),
      el("h3", "ps-status__title", { text: options.title, tabindex: "-1" }),
      options.body ? el("p", "ps-status__body", null, typeof options.body === "string" ? [options.body] : options.body) : null,
    ]);
    (options.extra || []).forEach(function (node) { if (node) body.appendChild(node); });
    if (options.actions && options.actions.length) {
      body.appendChild(el("div", "df-nav ps-status__actions", null, options.actions));
    }
    return body;
  }

  function button(label, variant, attrs) {
    return el("button", "df-btn df-btn--" + (variant || "primary"), Object.assign({ type: "button", text: label }, attrs || {}));
  }

  function link(label, href, variant) {
    return el("a", "df-btn df-btn--" + (variant || "ghost") + " ps-btn-link", { href: href, text: label });
  }

  function field(options) {
    var id = options.id;
    var errorId = id + "-error";
    var hintId = options.hint ? id + "-hint" : null;
    var labelChildren = [options.label];
    if (options.required) labelChildren.push(el("span", "df-required", { "aria-hidden": "true", text: "*" }));
    if (options.optionalLabel) labelChildren.push(el("span", "ps-optional", { text: " (" + options.optionalLabel + ")" }));
    var input = el("input", "df-input" + (options.error ? " df-input--error" : ""), {
      id: id,
      name: options.name,
      type: options.type || "text",
      value: options.value || "",
      placeholder: options.placeholder || null,
      autocomplete: options.autocomplete || null,
      inputmode: options.inputmode || null,
      min: options.min,
      max: options.max,
      step: options.step,
      required: options.required || null,
      "aria-invalid": options.error ? "true" : "false",
      "aria-describedby": [hintId, errorId].filter(Boolean).join(" "),
      maxlength: options.maxlength || null,
    });
    var error = el("div", "df-error", { id: errorId, text: options.error || "" });
    var node = el("div", "df-field ps-field", { dataset: { code: options.name } }, [
      el("label", "df-label", { for: id }, labelChildren),
      el("div", "df-input-wrap", null, [input]),
      hintId ? el("div", "ps-hint", { id: hintId, text: options.hint }) : null,
      error,
    ]);
    return { node: node, input: input, error: error };
  }

  function setFieldError(ref, message) {
    if (!ref) return;
    ref.error.textContent = message || "";
    ref.input.classList.toggle("df-input--error", Boolean(message));
    ref.input.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function banner(title, body) {
    return el("div", "ps-banner", { role: "alert", dataset: { state: "error" } }, [
      icon("alert"),
      el("div", null, null, [el("strong", null, { text: title }), body ? el("p", null, { text: body }) : null]),
    ]);
  }

  ns.ui = Object.freeze({
    icon: icon,
    stepper: stepper,
    loader: loader,
    status: status,
    button: button,
    link: link,
    field: field,
    setFieldError: setFieldError,
    banner: banner,
  });
})(typeof window !== "undefined" ? window : globalThis);
