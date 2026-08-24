(function (global) {
  "use strict";

  var MASK_CLASSES = { "9": /\d/, A: /[A-Za-z]/, "*": /[A-Za-z0-9]/ };
  var NUMERIC = /Integer|Long|Float|Double|BigDecimal|Short|Byte|^int$|^long$|^float$|^double$/;

  function el(tag, className, attrs) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var value = attrs[key];
        if (value === undefined || value === null || value === false) return;
        if (value === true) node.setAttribute(key, "");
        else node.setAttribute(key, String(value));
      });
    }
    return node;
  }

  function text(tag, className, value) {
    var node = el(tag, className);
    node.textContent = value == null ? "" : String(value);
    return node;
  }

  function localized(nls, locale, key) {
    if (!nls || typeof nls !== "object") return "";
    var bag = nls[locale] || nls.en || nls[Object.keys(nls)[0]] || {};
    var value = bag[key || "NAME"];
    if (value == null) return "";
    return String(value).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  }

  function javaType(className) {
    var name = String(className || "");
    if (name.indexOf("Boolean") !== -1 || name === "boolean") return "boolean";
    if (NUMERIC.test(name)) return "number";
    if (name.indexOf("java.lang.String") !== -1 || /(^|\.)String$/.test(name)) return "string";
    return "entity";
  }

  function parseTokens(inputFormat) {
    var tokens = {
      password: false, textarea: false, expanded: false, slider: false,
      tel: false, url: false, email: false, color: false, date: false,
      rows: null, cols: null, min: null, max: null, step: null,
      minLength: null, maxLength: null, re: null, mask: null, placeholder: null,
    };
    if (!inputFormat) return tokens;
    var rest = String(inputFormat);
    var placeholder = rest.match(/placeholder:([^;]+)/);
    if (placeholder) {
      tokens.placeholder = placeholder[1].trim();
      rest = rest.replace(/placeholder:[^;]+/, " ");
    }
    var mask = rest.match(/mask:([^;]+?)(?=\s*;|\s+(?:password|textarea|expanded|slider|tel|url|email|color|date)\b|\s+[a-zA-Z]+:|\s*$)/);
    if (mask) {
      tokens.mask = mask[1].trim();
      rest = rest.replace(mask[0], " ");
    }
    rest.split(/[\s;]+/).filter(Boolean).forEach(function (token) {
      if (token === "password" || token === "textarea" || token === "expanded" || token === "slider"
        || token === "tel" || token === "url" || token === "email" || token === "color" || token === "date") {
        tokens[token] = true;
        return;
      }
      var pair = token.match(/^(rows|cols|min|max|step|minLength|maxLength):(.+)$/);
      if (pair) { tokens[pair[1]] = Number(pair[2]); return; }
      if (token.indexOf("re:") === 0) tokens.re = token.slice(3);
    });
    return tokens;
  }

  function normalizeChoices(attribute, locale) {
    return (Array.isArray(attribute.options) ? attribute.options : [])
      .map(function (option) {
        return {
          value: String(option.value != null ? option.value : option.code != null ? option.code : option.id != null ? option.id : ""),
          label: String(option.label || option.name || localized(option.nls, locale) || option.value || ""),
        };
      })
      .filter(function (option) { return option.value !== ""; });
  }

  function fieldKind(attribute, tokens, choices) {
    if (choices.length) {
      if (attribute.freeValue && !attribute.multiselect) return "combobox";
      if (tokens.expanded) return attribute.multiselect ? "checklist" : "radio";
      return attribute.multiselect ? "multiselect" : "select";
    }
    var type = javaType(attribute.className);
    if (type === "boolean") return "boolean";
    if (type === "number") return tokens.slider ? "slider" : "number";
    if (type === "entity") return "select";
    if (tokens.textarea) return "textarea";
    if (tokens.password) return "password";
    if (tokens.email) return "email";
    if (tokens.tel) return "tel";
    if (tokens.url) return "url";
    if (tokens.color) return "color";
    if (tokens.date) return "date";
    return "text";
  }

  function normalizeSchema(schema, locale) {
    var owners = [{ id: schema.id, attributes: schema.attributes || [], groups: schema.attributeGroups || [] }];
    (schema.parents || []).forEach(function (parent) {
      owners.push({ id: parent.id, attributes: parent.attributes || [], groups: parent.attributeGroups || [] });
    });

    var byCode = {};
    owners.forEach(function (owner) {
      (owner.attributes || []).forEach(function (attribute) {
        if (!byCode[attribute.code]) byCode[attribute.code] = { attribute: attribute, typeId: owner.id };
      });
    });

    var groupTitles = {};
    owners.forEach(function (owner) {
      (owner.groups || []).forEach(function (group) { groupTitles[group.code] = localized(group.nls, locale); });
    });

    var order = Array.isArray(schema.attributeOrder) ? schema.attributeOrder : [];
    var groups = [];
    var placed = {};

    order.forEach(function (entry) {
      Object.keys(entry || {}).forEach(function (groupCode) {
        var rows = Array.isArray(entry[groupCode]) ? entry[groupCode] : [];
        var fields = [];
        rows.forEach(function (row) {
          if (row.visible === false) return;
          var found = byCode[row.attributeCode];
          if (!found || placed[row.attributeCode]) return;
          placed[row.attributeCode] = true;
          fields.push(toField(found.attribute, found.typeId, locale));
        });
        if (fields.length) groups.push({ code: groupCode, title: groupTitles[groupCode] || "", fields: fields });
      });
    });

    var loose = [];
    Object.keys(byCode).forEach(function (code) {
      if (placed[code]) return;
      loose.push(toField(byCode[code].attribute, byCode[code].typeId, locale));
    });
    if (loose.length) groups.push({ code: "__ungrouped", title: "", fields: loose });

    return { id: schema.id, code: schema.code, title: localized(schema.nls, locale), groups: groups };
  }

  function toField(attribute, typeId, locale) {
    var tokens = parseTokens(attribute.inputFormat);
    var choices = normalizeChoices(attribute, locale);
    var label = localized(attribute.nls, locale);
    return {
      code: attribute.code,
      typeId: typeId,
      kind: fieldKind(attribute, tokens, choices),
      label: label,
      placeholder: tokens.placeholder || localized(attribute.nls, locale, "PLACEHOLDER") || "",
      description: localized(attribute.nls, locale, "DESCRIPTION"),
      required: attribute.required === true,
      multiselect: attribute.multiselect === true,
      freeValue: attribute.freeValue === true,
      choices: choices,
      tokens: tokens,
      behavior: parseBehavior(attribute.uiBehavior),
      mask: tokens.mask || null,
    };
  }

  function parseBehavior(source) {
    if (!source) return null;
    var body = String(source).replace(/\/\*[\s\S]*?\*\//g, "").trim();
    var call = body.match(/applyBehavior\(\s*(\{[\s\S]*?\})\s*\)/);
    if (!call) return null;
    var literal = call[1]
      .replace(/([{,]\s*)([A-Za-z_$][\w$]*)\s*:/g, '$1"$2":')
      .replace(/'/g, '"')
      .replace(/,\s*}/g, "}");
    try {
      var mapping = JSON.parse(literal);
      var clean = {};
      Object.keys(mapping).forEach(function (key) {
        if (typeof mapping[key] === "string") clean[String(key).toUpperCase()] = mapping[key];
      });
      return Object.keys(clean).length ? clean : null;
    } catch (_) {
      return null;
    }
  }

  function applyMask(raw, mask) {
    var out = "";
    var index = 0;
    for (var position = 0; position < mask.length && index < raw.length; position += 1) {
      var slot = mask.charAt(position);
      var matcher = MASK_CLASSES[slot];
      if (!matcher) {
        out += slot;
        if (raw.charAt(index) === slot) index += 1;
        continue;
      }
      while (index < raw.length && !matcher.test(raw.charAt(index))) index += 1;
      if (index >= raw.length) break;
      out += slot === "A" ? raw.charAt(index).toUpperCase() : raw.charAt(index);
      index += 1;
    }
    return out;
  }

  function maskComplete(value, mask) {
    var slots = mask.split("").filter(function (character) { return MASK_CLASSES[character]; }).length;
    var filled = value.split("").filter(function (character, position) {
      return MASK_CLASSES[mask.charAt(position)];
    }).length;
    return filled >= slots;
  }

  function PortalForm(config) {
    this.cfg = config || {};
    this.locale = this.cfg.locale || "en";
    this.model = null;
    this.values = {};
    this.errors = {};
    this.touched = {};
    this.step = 0;
    this.state = "loading";
    this.result = null;
  }

  PortalForm.prototype.mount = function (target) {
    this.root = typeof target === "string" ? document.querySelector(target) : target;
    if (!this.root) throw new Error("PortalForm mount target was not found");
    this.root.classList.add("pf");
    this.render();
    var self = this;
    this.load().then(function () { self.render(); }, function () { self.render(); });
    return this;
  };

  PortalForm.prototype.load = function () {
    var self = this;
    if (this.cfg.schema) {
      this.adopt(this.cfg.schema);
      return Promise.resolve();
    }
    var base = String(this.cfg.apiBaseUrl || "").replace(/\/+$/, "");
    if (!base || !this.cfg.formTypeCode) {
      this.state = "error";
      this.result = { reason: "unconfigured" };
      return Promise.reject(new Error("unconfigured"));
    }
    var url = base + "/" + encodeURIComponent(this.locale) + "/core-cms/api/form-type/"
      + encodeURIComponent(this.cfg.formTypeCode) + "/get.json";
    return fetch(url, { method: "GET", credentials: "omit", headers: { accept: "application/json" } })
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json();
      })
      .then(function (schema) { self.adopt(schema); })
      .catch(function (error) {
        self.state = "error";
        self.result = { reason: "schema", message: error.message };
        throw error;
      });
  };

  PortalForm.prototype.adopt = function (schema) {
    this.model = normalizeSchema(schema, this.locale);
    var preset = this.cfg.presetValues || {};
    var self = this;
    this.eachField(function (field) {
      if (Object.prototype.hasOwnProperty.call(preset, field.code)) {
        self.values[field.code] = preset[field.code];
      } else if (field.kind === "checklist" || field.kind === "multiselect") {
        self.values[field.code] = [];
      } else if (field.kind === "boolean") {
        self.values[field.code] = false;
      } else if (field.kind === "slider") {
        self.values[field.code] = field.tokens.min != null ? field.tokens.min : 0;
      } else {
        self.values[field.code] = "";
      }
    });
    this.state = this.model.groups.length ? "ready" : "empty";
  };

  PortalForm.prototype.eachField = function (visit) {
    (this.model ? this.model.groups : []).forEach(function (group) {
      group.fields.forEach(function (field) { visit(field, group); });
    });
  };

  PortalForm.prototype.visibleGroups = function () {
    if (!this.model) return [];
    var controlled = {};
    var shown = {};
    this.eachField(function (field) {
      if (!field.behavior) return;
      Object.keys(field.behavior).forEach(function (key) { controlled[field.behavior[key]] = true; });
    });
    var self = this;
    this.eachField(function (field) {
      if (!field.behavior) return;
      var current = self.values[field.code];
      var selected = Array.isArray(current) ? current : current ? [current] : [];
      selected.forEach(function (value) {
        var target = field.behavior[String(value).toUpperCase()];
        if (target) shown[target] = true;
      });
    });
    return this.model.groups.filter(function (group) {
      return !controlled[group.code] || shown[group.code];
    });
  };

  PortalForm.prototype.validateField = function (field) {
    var value = this.values[field.code];
    var tokens = field.tokens;
    var empty = value === "" || value === null || value === undefined
      || (Array.isArray(value) && value.length === 0)
      || (field.kind === "boolean" && value !== true);
    if (field.required && empty) return this.cfg.copy.requiredError;
    if (empty) return "";
    var asText = Array.isArray(value) ? value.join(",") : String(value);
    if (field.mask && !maskComplete(asText, field.mask)) return this.cfg.copy.incompleteError;
    if (tokens.re && !new RegExp(tokens.re).test(asText)) return this.cfg.copy.formatError;
    if (field.kind === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(asText)) return this.cfg.copy.emailError;
    if (field.kind === "url" && !/^https?:\/\/[^\s]+$/.test(asText)) return this.cfg.copy.urlError;
    if (tokens.minLength != null && asText.length < tokens.minLength) return this.cfg.copy.minLengthError.replace("{n}", tokens.minLength);
    if (tokens.maxLength != null && asText.length > tokens.maxLength) return this.cfg.copy.maxLengthError.replace("{n}", tokens.maxLength);
    if (field.kind === "number" || field.kind === "slider") {
      var numeric = Number(asText);
      if (!isFinite(numeric)) return this.cfg.copy.numberError;
      if (tokens.min != null && numeric < tokens.min) return this.cfg.copy.minError.replace("{n}", tokens.min);
      if (tokens.max != null && numeric > tokens.max) return this.cfg.copy.maxError.replace("{n}", tokens.max);
    }
    return "";
  };

  PortalForm.prototype.validateGroup = function (group) {
    var self = this;
    var ok = true;
    group.fields.forEach(function (field) {
      var message = self.validateField(field);
      self.errors[field.code] = message;
      self.touched[field.code] = true;
      if (message) ok = false;
    });
    return ok;
  };

  PortalForm.prototype.submit = function () {
    var self = this;
    var groups = this.visibleGroups();
    var ok = true;
    groups.forEach(function (group) { if (!self.validateGroup(group)) ok = false; });
    if (!ok) {
      this.step = groups.findIndex(function (group) {
        return group.fields.some(function (field) { return self.errors[field.code]; });
      });
      if (this.step < 0) this.step = 0;
      this.render();
      return Promise.resolve(false);
    }

    var organizationId = this.cfg.organizationId;
    var base = String(this.cfg.apiBaseUrl || "").replace(/\/+$/, "");
    if (!organizationId || !base) {
      this.state = "blocked";
      this.render();
      return Promise.resolve(false);
    }

    var attributes = {};
    groups.forEach(function (group) {
      group.fields.forEach(function (field) {
        var value = self.values[field.code];
        if (value === "" || value === null || value === undefined) return;
        if (Array.isArray(value) && !value.length) return;
        if (field.kind === "boolean" && value !== true) return;
        var bucket = String(field.typeId != null ? field.typeId : self.model.id);
        if (!attributes[bucket]) attributes[bucket] = {};
        attributes[bucket][field.code] = { value: value };
      });
    });

    this.state = "submitting";
    this.render();

    return fetch(base + "/core-cms/api/form/submit.json", {
      method: "POST",
      credentials: "omit",
      headers: { "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        type: { id: this.model.id },
        organization: { id: organizationId },
        attributes: attributes,
      }),
    })
      .then(function (response) {
        if (!response.ok) throw new Error("HTTP " + response.status);
        return response.json().catch(function () { return {}; });
      })
      .then(function (payload) {
        self.state = "success";
        self.result = payload;
        self.render();
        if (typeof self.cfg.onSubmit === "function") self.cfg.onSubmit(payload, self.values);
        return true;
      })
      .catch(function (error) {
        self.state = "submit-error";
        self.result = { message: error.message };
        self.render();
        return false;
      });
  };

  PortalForm.prototype.setValue = function (field, value) {
    this.values[field.code] = value;
    if (this.touched[field.code]) this.errors[field.code] = this.validateField(field);
  };

  PortalForm.prototype.render = function () {
    var self = this;
    var root = this.root;
    root.dataset.state = this.state;
    root.replaceChildren();

    var card = el("div", "pf__card");
    root.appendChild(card);

    if (this.state === "loading") { card.appendChild(this.renderSkeleton()); return; }
    if (this.state === "error") { card.appendChild(this.renderNotice("error", this.cfg.copy.schemaErrorTitle, this.cfg.copy.schemaErrorBody, true)); return; }
    if (this.state === "empty") { card.appendChild(this.renderNotice("empty", this.cfg.copy.emptyTitle, this.cfg.copy.emptyBody, false)); return; }
    if (this.state === "success") { card.appendChild(this.renderNotice("success", this.cfg.copy.successTitle, this.cfg.copy.successBody, false)); return; }

    var groups = this.visibleGroups();
    if (this.step >= groups.length) this.step = Math.max(0, groups.length - 1);
    var multi = groups.length > 1;
    var group = groups[this.step];

    var head = el("div", "pf__head");
    head.appendChild(text("h2", "pf__title", this.cfg.copy.title || this.model.title));
    if (this.cfg.copy.subtitle) head.appendChild(text("p", "pf__sub", this.cfg.copy.subtitle));
    card.appendChild(head);

    if (multi) card.appendChild(this.renderSteps(groups));

    var form = el("form", "pf__body", { novalidate: true });
    form.addEventListener("submit", function (event) { event.preventDefault(); self.advance(groups); });
    card.appendChild(form);

    var section = el("div", "pf-group", { "data-group": group.code });
    if (group.title) section.appendChild(text("p", "pf-group__title", group.title));
    group.fields.forEach(function (field) { section.appendChild(self.renderField(field)); });
    form.appendChild(section);

    if (this.state === "submit-error") {
      form.appendChild(this.renderNotice("error", this.cfg.copy.submitErrorTitle, this.cfg.copy.submitErrorBody, false));
    }
    if (this.state === "blocked") {
      form.appendChild(this.renderNotice("blocked", this.cfg.copy.blockedTitle, this.cfg.copy.blockedBody, false));
    }

    var actions = el("div", "pf-actions");
    if (multi && this.step > 0) {
      var back = text("button", "btn btn--ghost btn--lg", this.cfg.copy.backLabel);
      back.type = "button";
      back.addEventListener("click", function () { self.step -= 1; self.render(); });
      actions.appendChild(back);
    }
    var last = this.step === groups.length - 1;
    var submitting = this.state === "submitting";
    var next = text("button", "btn btn--primary btn--lg", submitting ? this.cfg.copy.submittingLabel : last ? this.cfg.copy.submitLabel : this.cfg.copy.nextLabel);
    next.type = "submit";
    if (submitting || (last && !this.canSubmit())) next.disabled = true;
    if (last && !this.canSubmit()) next.dataset.formDestination = "unset";
    actions.appendChild(next);
    form.appendChild(actions);

    if (this.cfg.copy.note) card.appendChild(text("p", "pf-note", this.cfg.copy.note));
  };

  PortalForm.prototype.canSubmit = function () {
    return Boolean(this.cfg.organizationId && this.cfg.apiBaseUrl);
  };

  PortalForm.prototype.advance = function (groups) {
    if (!this.validateGroup(groups[this.step])) { this.render(); return; }
    if (this.step < groups.length - 1) { this.step += 1; this.render(); return; }
    this.submit();
  };

  PortalForm.prototype.renderSteps = function (groups) {
    var self = this;
    var wrap = el("div", "pf-steps", { role: "list" });
    groups.forEach(function (group, index) {
      var state = index === self.step ? "on" : index < self.step ? "done" : "todo";
      var step = el("div", "pf-step pf-step--" + state, { role: "listitem", "data-state": state });
      step.appendChild(text("i", "", state === "done" ? "✓" : String(index + 1)));
      step.appendChild(text("span", "", group.title || self.cfg.copy.stepFallback.replace("{n}", index + 1)));
      wrap.appendChild(step);
    });
    return wrap;
  };

  PortalForm.prototype.renderSkeleton = function () {
    var wrap = el("div", "pf-skeleton", { "data-state": "loading", "aria-busy": "true" });
    for (var index = 0; index < 4; index += 1) {
      var row = el("div", "pf-skeleton__row");
      row.appendChild(el("span", "pf-skeleton__bar pf-skeleton__bar--label"));
      row.appendChild(el("span", "pf-skeleton__bar"));
      wrap.appendChild(row);
    }
    return wrap;
  };

  PortalForm.prototype.renderNotice = function (kind, title, body, retry) {
    var self = this;
    var wrap = el("div", "pf-notice pf-notice--" + kind, { "data-state": kind, role: kind === "error" ? "alert" : "status" });
    wrap.appendChild(text("div", "pf-notice__glyph", kind === "success" ? "✓" : kind === "empty" ? "◌" : "!"));
    wrap.appendChild(text("div", "pf-notice__title", title));
    if (body) wrap.appendChild(text("div", "pf-notice__body", body));
    if (retry) {
      var button = text("button", "btn btn--primary", self.cfg.copy.retryLabel);
      button.type = "button";
      button.addEventListener("click", function () {
        self.state = "loading";
        self.render();
        self.load().then(function () { self.render(); }, function () { self.render(); });
      });
      wrap.appendChild(button);
    }
    return wrap;
  };

  PortalForm.prototype.renderField = function (field) {
    var self = this;
    var invalid = Boolean(this.touched[field.code] && this.errors[field.code]);
    var wrap = el("div", "pf-field", { "data-code": field.code, "data-kind": field.kind, "data-state": invalid ? "invalid" : "idle" });
    var id = "pf-" + field.code;

    if (field.kind !== "boolean") {
      var label = el("label", "pf-field__label", { for: id });
      label.appendChild(text("span", "", field.label));
      if (field.required) label.appendChild(text("span", "pf-req", "*"));
      wrap.appendChild(label);
    }

    var control = this.buildControl(field, id);
    wrap.appendChild(control);

    if (field.description) wrap.appendChild(text("p", "pf-field__hint", field.description));
    var error = text("p", "pf-field__error", invalid ? this.errors[field.code] : "");
    error.id = id + "-error";
    wrap.appendChild(error);

    wrap.addEventListener("focusout", function () {
      self.touched[field.code] = true;
      var message = self.validateField(field);
      if (message !== self.errors[field.code] || (message && !invalid) || (!message && invalid)) {
        self.errors[field.code] = message;
        self.render();
      }
    });
    return wrap;
  };

  PortalForm.prototype.buildControl = function (field, id) {
    var self = this;
    var value = this.values[field.code];
    var tokens = field.tokens;

    if (field.kind === "textarea") {
      var area = el("textarea", "pf-input pf-input--area", {
        id: id, name: field.code, placeholder: field.placeholder,
        rows: tokens.rows || 4, maxlength: tokens.maxLength,
        "aria-describedby": id + "-error",
      });
      area.value = value || "";
      area.addEventListener("input", function () { self.setValue(field, area.value); });
      return area;
    }

    if (field.kind === "slider") {
      var sliderWrap = el("div", "pf-slider");
      var min = tokens.min != null ? tokens.min : 0;
      var max = tokens.max != null ? tokens.max : 100;
      var range = el("input", "pf-range", {
        type: "range", id: id, name: field.code, min: min, max: max,
        step: tokens.step != null ? tokens.step : 1,
      });
      range.value = value != null && value !== "" ? value : min;
      var readout = text("output", "pf-slider__val", range.value);
      range.addEventListener("input", function () {
        readout.textContent = range.value;
        self.setValue(field, Number(range.value));
      });
      sliderWrap.appendChild(range);
      sliderWrap.appendChild(readout);
      return sliderWrap;
    }

    if (field.kind === "boolean") {
      var toggle = el("label", "pf-choice", { for: id });
      var box = el("input", "pf-choice__input", { type: "checkbox", id: id, name: field.code });
      box.checked = value === true;
      box.addEventListener("change", function () { self.setValue(field, box.checked); self.render(); });
      toggle.appendChild(box);
      toggle.appendChild(el("span", "pf-check"));
      var copy = text("span", "pf-choice__label", field.label);
      if (field.required) copy.appendChild(text("span", "pf-req", "*"));
      toggle.appendChild(copy);
      return toggle;
    }

    if (field.kind === "radio" || field.kind === "checklist") {
      var multiple = field.kind === "checklist";
      var list = el("div", "pf-choices", { role: multiple ? "group" : "radiogroup", "aria-label": field.label });
      field.choices.forEach(function (choice, index) {
        var option = el("label", "pf-choice");
        var input = el("input", "pf-choice__input", {
          type: multiple ? "checkbox" : "radio",
          name: field.code + (multiple ? "[]" : ""),
          value: choice.value,
          id: index === 0 ? id : undefined,
        });
        input.checked = multiple ? (value || []).indexOf(choice.value) !== -1 : value === choice.value;
        input.addEventListener("change", function () {
          if (!multiple) { self.setValue(field, choice.value); self.render(); return; }
          var next = (self.values[field.code] || []).slice();
          var at = next.indexOf(choice.value);
          if (input.checked && at === -1) next.push(choice.value);
          if (!input.checked && at !== -1) next.splice(at, 1);
          self.setValue(field, next);
          self.render();
        });
        option.appendChild(input);
        option.appendChild(el("span", multiple ? "pf-check" : "pf-radio"));
        option.appendChild(text("span", "pf-choice__label", choice.label));
        list.appendChild(option);
      });
      return list;
    }

    if (field.kind === "multiselect") {
      var chips = el("div", "pf-chips", { role: "group", "aria-label": field.label, id: id });
      field.choices.forEach(function (choice) {
        var on = (value || []).indexOf(choice.value) !== -1;
        var chip = text("button", "pf-chip" + (on ? " pf-chip--on" : ""), choice.label);
        chip.type = "button";
        chip.setAttribute("aria-pressed", on ? "true" : "false");
        chip.addEventListener("click", function () {
          var next = (self.values[field.code] || []).slice();
          var at = next.indexOf(choice.value);
          if (at === -1) next.push(choice.value); else next.splice(at, 1);
          self.touched[field.code] = true;
          self.setValue(field, next);
          self.render();
        });
        chips.appendChild(chip);
      });
      return chips;
    }

    if (field.kind === "select") {
      var select = el("select", "pf-input pf-select", { id: id, name: field.code, "aria-describedby": id + "-error" });
      var blank = text("option", "", field.placeholder || this.cfg.copy.selectPlaceholder);
      blank.value = "";
      select.appendChild(blank);
      field.choices.forEach(function (choice) {
        var option = text("option", "", choice.label);
        option.value = choice.value;
        if (value === choice.value) option.selected = true;
        select.appendChild(option);
      });
      select.addEventListener("change", function () { self.setValue(field, select.value); self.render(); });
      return select;
    }

    if (field.kind === "combobox") {
      var comboWrap = el("div", "pf-combo");
      var listId = id + "-list";
      var combo = el("input", "pf-input", {
        id: id, name: field.code, list: listId, placeholder: field.placeholder,
        "aria-describedby": id + "-error",
      });
      combo.value = value || "";
      combo.addEventListener("input", function () { self.setValue(field, combo.value); });
      var datalist = el("datalist", "", { id: listId });
      field.choices.forEach(function (choice) {
        var option = el("option", "", { value: choice.value });
        option.textContent = choice.label;
        datalist.appendChild(option);
      });
      comboWrap.appendChild(combo);
      comboWrap.appendChild(datalist);
      return comboWrap;
    }

    var nativeType = field.kind === "number" ? "number"
      : field.kind === "password" ? "password"
      : field.kind === "email" ? "email"
      : field.kind === "tel" ? "tel"
      : field.kind === "url" ? "url"
      : field.kind === "color" ? "color"
      : field.kind === "date" ? "date"
      : "text";

    if (field.kind === "color") {
      var colorWrap = el("div", "pf-color");
      var swatch = el("input", "pf-color__swatch", { type: "color", id: id, name: field.code, "aria-describedby": id + "-error" });
      swatch.value = value || "#0e8fc4";
      var readout = text("span", "pf-color__value", swatch.value);
      swatch.addEventListener("input", function () {
        readout.textContent = swatch.value;
        self.setValue(field, swatch.value);
      });
      colorWrap.appendChild(swatch);
      colorWrap.appendChild(readout);
      return colorWrap;
    }

    var input = el("input", "pf-input", {
      type: nativeType, id: id, name: field.code, placeholder: field.placeholder,
      inputmode: field.kind === "number" ? "decimal" : field.kind === "tel" ? "tel" : undefined,
      min: tokens.min, max: tokens.max, step: tokens.step,
      maxlength: field.mask ? field.mask.length : tokens.maxLength,
      autocomplete: field.kind === "email" ? "email" : field.kind === "tel" ? "tel" : undefined,
      "aria-describedby": id + "-error",
    });
    input.value = value != null ? value : "";
    input.addEventListener("input", function () {
      if (field.mask) {
        var masked = applyMask(input.value, field.mask);
        if (masked !== input.value) input.value = masked;
      }
      self.setValue(field, input.value);
    });
    return input;
  };

  global.PortalForm = PortalForm;
  global.PortalForm.normalizeSchema = normalizeSchema;
  global.PortalForm.parseTokens = parseTokens;
  global.PortalForm.applyMask = applyMask;
  global.PortalForm.maskComplete = maskComplete;
  global.PortalForm.javaType = javaType;
  global.PortalForm.parseBehavior = parseBehavior;
})(typeof window !== "undefined" ? window : globalThis);
