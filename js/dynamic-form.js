/**
 * DynamicForm
 * -----------
 * Generic form renderer driven by a JSON schema.
 *
 * Supports two modes:
 *   - "single"   - single-page form
 *   - "multiple" - multi-step wizard with a stepper
 *
 * Usage:
 *   new DynamicForm({
 *     type: "multiple",
 *     apiBaseUrl: "https://example.com",
 *     lang: "en",
 *     formTypeCode: "MY_FORM",
 *     organizationId: 1,
 *     submitLabel: "Send",
 *     presetAttributes: {
 *       COMPANY_SIZE: "50-200",
 *       INTERESTS: ["FIELD_SERVICE", "CRM"],
 *     },
 *     onSubmit: (data) => console.log(data),
 *   }).mount("#form-container");
 */
class DynamicForm {
  /** @type {object|null} Loaded form schema */
  _schema = null;

  /**
   * @param {object} config
   * @param {"single"|"multiple"} config.type
   * @param {string}  config.apiBaseUrl
   * @param {string}  config.lang
   * @param {string}  config.formTypeCode
   * @param {number}  config.organizationId
   * @param {string}  [config.submitLabel]
   * @param {string}  [config.prevLabel]
   * @param {string}  [config.nextLabel]
   * @param {boolean} [config.withLabel]
   * @param {object}  [config.presetAttributes] Attributes to prefill, keyed by attribute code.
   * @param {function} [config.onSubmit]
   * @param {string} [config.descriptionRender]
   */
  constructor(config = {}) {
    this.cfg = config;
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  DOM utilities
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Creates a DOM element with a class and attributes.
   * The special "html" key sets innerHTML.
   */
  static _el(tag, cls, attrs) {
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    if (attrs) {
      Object.entries(attrs).forEach(([k, v]) => {
        if (k === "html") el.innerHTML = v;
        else el.setAttribute(k, v);
      });
    }
    return el;
  }

  /**
   * Returns a localized string from an nls object.
   * Lookup order: lang -> en -> first available language.
   * @param {object} nls
   * @param {string} lang
   * @param {string} [key="NAME"]
   */
  static _getNls(nls, lang, key = "NAME") {
    if (!nls) return "";
    const map = nls[lang] || nls.en || Object.values(nls)[0] || {};
    return map[key] || map.name || map.label || map.title || Object.values(map)[0] || "";
  }

  /** SVG arrow for custom selects */
  static _arrowSVG() {
    return `<svg width="14" height="8" viewBox="0 0 18 11" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0.707031 0.707031L8.70703 8.70703L16.707 0.707031" stroke="#D9D9D9" stroke-width="2"/>
    </svg>`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  inputFormat parsing and validation
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Parses an inputFormat string into a token object.
   * Example: "textarea rows:6 cols:80 placeholder:Enter text"
   */
  static _parseTokens(inputFormat) {
    const t = {
      re: null,
      password: false,
      textarea: false,
      rows: null,
      cols: null,
      expanded: false,
      slider: false,
      min: null,
      max: null,
      step: null,
      minLength: null,
      maxLength: null,
      tel: false,
      url: false,
      email: false,
      color: false,
      date: false,
      placeholder: null,
    };

    if (!inputFormat) return t;

    // Extract placeholder separately because it may contain spaces.
    const placeholderMatch = inputFormat.match(/placeholder:([^;]+)/);
    if (placeholderMatch) {
      t.placeholder = placeholderMatch[1].trim();
      inputFormat = inputFormat.replace(/placeholder:[^;]+/, "");
    }

    inputFormat
      .split(/[\s;]+/)
      .filter(Boolean)
      .forEach((tok) => {
        if (tok === "password") t.password = true;
        else if (tok === "textarea") t.textarea = true;
        else if (tok === "expanded") t.expanded = true;
        else if (tok === "slider") t.slider = true;
        else if (tok === "tel") t.tel = true;
        else if (tok === "url") t.url = true;
        else if (tok === "email") t.email = true;
        else if (tok === "color") t.color = true;
        else if (tok === "date") t.date = true;
        else if (tok.startsWith("rows:")) t.rows = Number(tok.slice(5));
        else if (tok.startsWith("cols:")) t.cols = Number(tok.slice(5));
        else if (tok.startsWith("minLength:")) t.minLength = Number(tok.slice(10));
        else if (tok.startsWith("maxLength:")) t.maxLength = Number(tok.slice(10));
        else if (tok.startsWith("min:")) t.min = Number(tok.slice(4));
        else if (tok.startsWith("max:")) t.max = Number(tok.slice(4));
        else if (tok.startsWith("step:")) t.step = Number(tok.slice(5));
        else if (tok.startsWith("re:")) t.re = tok.slice(3);
      });

    return t;
  }

  /**
   * Checks token compatibility with the field type.
   * Incompatible tokens are reset with a console warning.
   * @returns {{ resolved: object, warnings: string[] }}
   */
  static _validateAndResolveTokens(tokens, fieldType, hasChoices) {
    const warnings = [];
    const r = { ...tokens };

    const BOOL_FLAGS = [
      "password",
      "textarea",
      "slider",
      "expanded",
      "tel",
      "url",
      "email",
      "color",
      "date",
    ];
    const SPECIAL_TYPES = ["tel", "url", "email", "color", "date"];

    /** Resets a token and records a warning */
    const ignore = (key, reason) => {
      warnings.push(`'${key}' ignored for ${reason}`);
      r[key] = BOOL_FLAGS.includes(key) ? false : null;
    };

    if (hasChoices) {
      ["password", "textarea", "slider"].forEach((k) => {
        if (r[k]) ignore(k, "choice-based field");
      });
      ["min", "max", "step", "rows", "cols", "minLength", "maxLength"].forEach((k) => {
        if (r[k] !== null) ignore(k, "choice-based field");
      });
      SPECIAL_TYPES.forEach((k) => {
        if (r[k]) ignore(k, "choice-based field");
      });
      if (r.re) ignore("re", "choice-based field");
    } else if (fieldType === "string") {
      if (r.password && r.textarea) {
        warnings.push("Conflict: 'password' takes priority over 'textarea'");
        r.textarea = false;
      }
      if (r.slider) ignore("slider", "string field");
      ["min", "max", "step"].forEach((k) => {
        if (r[k] !== null) ignore(k, "string field");
      });
      if ((r.rows !== null || r.cols !== null) && !r.textarea) {
        warnings.push("'rows'/'cols' valid only with 'textarea'");
        r.rows = r.cols = null;
      }

      const activeSpecial = SPECIAL_TYPES.filter((k) => r[k]);
      if (activeSpecial.length > 1) {
        warnings.push(
          `Conflict: '${activeSpecial[0]}' takes priority over ${activeSpecial.slice(1).join(", ")}`,
        );
        activeSpecial.slice(1).forEach((k) => {
          r[k] = false;
        });
      }
      if (activeSpecial.length > 0) {
        if (r.password) {
          warnings.push("Conflict: special type overrides 'password'");
          r.password = false;
        }
        if (r.textarea) {
          warnings.push("Conflict: special type overrides 'textarea'");
          r.textarea = false;
        }
      }
    } else if (fieldType === "number") {
      if (r.password) ignore("password", "number field");
      if (r.textarea) ignore("textarea", "number field");
      ["rows", "cols", "minLength", "maxLength"].forEach((k) => {
        if (r[k] !== null) ignore(k, "number field");
      });
      SPECIAL_TYPES.forEach((k) => {
        if (r[k]) ignore(k, "number field");
      });
      if (r.placeholder !== null) ignore("placeholder", "number field");
      if (!r.slider && r.step !== null)
        warnings.push("'step' without 'slider': applies to number input stepper");
    } else if (fieldType === "boolean") {
      ["password", "textarea", "slider", "expanded"].forEach((k) => {
        if (r[k]) ignore(k, "boolean field");
      });
      ["min", "max", "step", "rows", "cols", "minLength", "maxLength"].forEach((k) => {
        if (r[k] !== null) ignore(k, "boolean field");
      });
      SPECIAL_TYPES.forEach((k) => {
        if (r[k]) ignore(k, "boolean field");
      });
      if (r.re) ignore("re", "boolean field");
      if (r.placeholder !== null) ignore("placeholder", "boolean field");
    } else if (fieldType === "entity") {
      ["password", "textarea", "slider"].forEach((k) => {
        if (r[k]) ignore(k, "entity field");
      });
      ["min", "max", "step", "rows", "cols", "minLength", "maxLength"].forEach((k) => {
        if (r[k] !== null) ignore(k, "entity field");
      });
      SPECIAL_TYPES.forEach((k) => {
        if (r[k]) ignore(k, "entity field");
      });
      if (r.re) ignore("re", "entity field");
    }

    return { resolved: r, warnings };
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Type and data helpers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Resolves the JS field type from the Java className in the schema.
   * @returns {"boolean"|"number"|"string"|"entity"}
   */
  static _javaType(className) {
    const s = String(className || "");
    if (s.includes("Boolean") || s === "boolean") return "boolean";
    if (/Integer|Long|Float|Double|BigDecimal|Short|Byte|^int$|^long$|^float$|^double$/.test(s))
      return "number";
    if (s.includes("java.lang.String") || s.endsWith(".String") || s === "String") return "string";
    return "entity";
  }

  /**
   * Normalizes attribute options into the common { value, label } format.
   */
  _normalizeChoices(attr) {
    return (Array.isArray(attr.options) ? attr.options : [])
      .map((o) => ({
        value: String(o.value ?? o.code ?? o.id ?? ""),
        label: String(
          o.label ?? o.name ?? DynamicForm._getNls(o.nls, this.cfg.lang) ?? o.value ?? "",
        ),
      }))
      .filter((o) => o.value !== "");
  }

  /**
   * Returns the display label for an entity option.
   */
  _getPresetValue(attr) {
    const code = attr?.code;
    const maps = [this.cfg.presetAttributes];

    for (const map of maps) {
      if (!map || typeof map !== "object" || !Object.prototype.hasOwnProperty.call(map, code)) {
        continue;
      }
      return map[code];
    }

    return attr?.defaultValue;
  }

  _mergePresetValues(data) {
    const merged = { ...data };
    [this.cfg.presetAttributes].forEach((map) => {
      if (!map || typeof map !== "object") return;
      Object.entries(map).forEach(([code, value]) => {
        if (!Object.prototype.hasOwnProperty.call(merged, code)) {
          merged[code] = value;
        }
      });
    });
    return merged;
  }

  _getAttributeTypeId(code) {
    if (!this._schema || !code) return null;
    if ((this._schema.attributes || []).some((attr) => attr.code === code)) return this._schema.id;

    const parent = (this._schema.parents || []).find((p) =>
      (p.attributes || []).some((attr) => attr.code === code),
    );
    return parent?.id ?? null;
  }

  static _valueList(value) {
    if (value === null || value === undefined || value === "") return [];
    if (Array.isArray(value)) return value.flatMap((v) => DynamicForm._valueList(v));
    if (typeof value === "object" && !Array.isArray(value)) {
      return DynamicForm._valueList(value.id ?? value.value ?? value.code ?? "");
    }
    return [String(value)];
  }

  static _resolveEntityLabel(item) {
    return (
      item.name ||
      item.title ||
      item.code ||
      item.login ||
      item.email ||
      item.username ||
      String(item.id || "")
    );
  }

  /**
   * Validates a field against the regular expression in data-regex.
   * Shows or clears the error message.
   */
  static _validateInput(input, wrap) {
    if (!input.dataset.regex) return;
    const errEl = wrap.querySelector(".df-error");
    const re = new RegExp(input.dataset.regex);
    const invalid = input.value && !re.test(input.value);
    input.classList.toggle("df-input--error", invalid);
    if (errEl) errEl.textContent = invalid ? "Invalid format" : "";
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Custom selects
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Builds a custom single-select control (df-customselect).
   * Returns a DOM element with a _getValue() method.
   */
  static _buildSingleSelect(code, choices, placeholder, initialValue) {
    const { _el, _arrowSVG } = DynamicForm;

    const wrap = _el("div", "df-customselect");
    wrap.dataset.code = code;

    // Hidden input used by FormData.
    const hidden = document.createElement("input");
    hidden.type = "hidden";
    hidden.name = code;
    hidden.value = "";

    // Trigger, the visible part of the control.
    const trigger = _el("div", "df-customselect__trigger");
    trigger.setAttribute("tabindex", "0");
    trigger.setAttribute("role", "combobox");
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");

    const arrow = _el("span", "df-customselect__arrow");
    arrow.innerHTML = _arrowSVG();

    const triggerText = _el("span", "df-customselect__text df-customselect__placeholder");
    triggerText.textContent = placeholder;

    trigger.appendChild(arrow);
    trigger.appendChild(triggerText);

    // Dropdown with options.
    const dropdown = _el("div", "df-customselect__dropdown");
    dropdown.setAttribute("role", "listbox");

    let selectedValue = "";

    /** Synchronizes the hidden input and trigger with the selected value */
    const syncTrigger = (val, label, emitChange = true) => {
      selectedValue = val;
      hidden.value = val;

      if (val) {
        triggerText.textContent = label;
        triggerText.classList.replace("df-customselect__placeholder", "df-customselect__value");
      } else {
        triggerText.textContent = placeholder;
        triggerText.classList.replace("df-customselect__value", "df-customselect__placeholder");
      }

      dropdown.querySelectorAll(".df-customselect__option").forEach((opt) => {
        const selected = opt.dataset.value === val;
        opt.classList.toggle("df-customselect__option--selected", selected);
        opt.setAttribute("aria-selected", String(selected));
      });

      if (emitChange) wrap.dispatchEvent(new Event("change", { bubbles: true }));
    };

    choices.forEach((c) => {
      const opt = _el("div", "df-customselect__option");
      opt.setAttribute("role", "option");
      opt.setAttribute("aria-selected", "false");
      opt.dataset.value = c.value;
      opt.textContent = c.label;
      opt.addEventListener("click", (e) => {
        e.stopPropagation();
        syncTrigger(c.value, c.label);
        closeDropdown();
      });
      dropdown.appendChild(opt);
    });

    // Open/close behavior.
    const openDropdown = () => {
      // Close all other open dropdowns.
      document.querySelectorAll(".df-customselect--open").forEach((s) => {
        if (s !== wrap) {
          s.classList.remove("df-customselect--open");
          s.querySelector(".df-customselect__trigger")?.setAttribute("aria-expanded", "false");
        }
      });
      document.querySelectorAll(".df-multiselect--open").forEach((ms) => {
        ms.classList.remove("df-multiselect--open");
        ms.querySelector(".df-multiselect__trigger")?.setAttribute("aria-expanded", "false");
      });

      wrap.classList.add("df-customselect--open");
      trigger.setAttribute("aria-expanded", "true");
    };

    const closeDropdown = () => {
      wrap.classList.remove("df-customselect--open");
      trigger.setAttribute("aria-expanded", "false");
    };

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      wrap.classList.contains("df-customselect--open") ? closeDropdown() : openDropdown();
    });

    trigger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        wrap.classList.contains("df-customselect--open") ? closeDropdown() : openDropdown();
      }
      if (e.key === "Escape") closeDropdown();
    });

    dropdown.addEventListener("click", (e) => e.stopPropagation());

    wrap.appendChild(hidden);
    wrap.appendChild(trigger);
    wrap.appendChild(dropdown);

    const initial = choices.find((c) => c.value === String(initialValue ?? ""));
    if (initial) syncTrigger(initial.value, initial.label, false);

    wrap._getValue = () => selectedValue;

    return wrap;
  }

  /**
   * Builds a custom multiselect control (df-multiselect).
   * Selected values are rendered as tags inside the trigger.
   */
  static _buildMultiselect(code, choices, placeholder, initialValue) {
    const { _el, _arrowSVG } = DynamicForm;

    const wrap = _el("div", "df-multiselect");
    wrap.dataset.code = code;

    // Trigger.
    const trigger = _el("div", "df-multiselect__trigger");
    trigger.setAttribute("tabindex", "0");
    trigger.setAttribute("role", "combobox");
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");

    const arrow = _el("span", "df-multiselect__arrow");
    arrow.innerHTML = _arrowSVG();

    const triggerTags = _el("div", "df-multiselect__tags");
    triggerTags.style.display = "none";

    const triggerText = _el("span", "df-multiselect__placeholder");
    triggerText.textContent = placeholder;

    trigger.appendChild(arrow);
    trigger.appendChild(triggerTags);
    trigger.appendChild(triggerText);

    // Dropdown with checkboxes.
    const dropdown = _el("div", "df-multiselect__dropdown");
    dropdown.setAttribute("role", "listbox");
    dropdown.setAttribute("aria-multiselectable", "true");

    // Hidden inputs used by FormData (code[]).
    const hiddenContainer = _el("div", "df-multiselect__hidden");
    hiddenContainer.style.display = "none";

    const initialValues = new Set(DynamicForm._valueList(initialValue));
    const selectedValues = new Set();

    /** Updates the hidden inputs */
    const syncHidden = () => {
      hiddenContainer.innerHTML = "";
      selectedValues.forEach((val) => {
        const inp = document.createElement("input");
        inp.type = "hidden";
        inp.name = code + "[]";
        inp.value = val;
        hiddenContainer.appendChild(inp);
      });
    };

    /** Rerenders the trigger tags */
    const syncTrigger = () => {
      triggerTags.innerHTML = "";

      if (selectedValues.size === 0) {
        triggerTags.style.display = "none";
        triggerText.style.display = "";
        return;
      }

      triggerTags.style.display = "";
      triggerText.style.display = "none";

      selectedValues.forEach((val) => {
        const choice = choices.find((c) => c.value === val);
        if (!choice) return;

        const tag = _el("span", "df-multiselect__tag");
        const tagLabel = document.createElement("span");
        tagLabel.textContent = choice.label;

        const removeBtn = _el("span", "df-multiselect__tag-remove");
        removeBtn.textContent = "×";
        removeBtn.setAttribute("aria-label", "Remove " + choice.label);
        removeBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          selectedValues.delete(val);
          const cb = dropdown.querySelector(`input[value="${CSS.escape(val)}"]`);
          if (cb) cb.checked = false;
          syncTrigger();
          syncHidden();
          wrap.dispatchEvent(new Event("change", { bubbles: true }));
        });

        tag.appendChild(tagLabel);
        tag.appendChild(removeBtn);
        triggerTags.appendChild(tag);
      });
    };

    choices.forEach((c) => {
      const itemLbl = _el("label", "df-choice-label");
      itemLbl.setAttribute("role", "option");

      const inp = document.createElement("input");
      inp.className = "df-choice-input";
      inp.type = "checkbox";
      inp.value = c.value;
      if (initialValues.has(c.value)) {
        inp.checked = true;
        selectedValues.add(c.value);
      }
      inp.addEventListener("change", () => {
        if (inp.checked) selectedValues.add(c.value);
        else selectedValues.delete(c.value);
        syncTrigger();
        syncHidden();
        wrap.dispatchEvent(new Event("change", { bubbles: true }));
      });

      const customDot = _el("span", "df-choice-custom");
      const span = document.createElement("span");
      span.textContent = c.label;

      itemLbl.appendChild(inp);
      itemLbl.appendChild(customDot);
      itemLbl.appendChild(span);
      dropdown.appendChild(itemLbl);
    });

    // Open/close behavior.
    const openDropdown = () => {
      document.querySelectorAll(".df-multiselect--open").forEach((ms) => {
        if (ms !== wrap) {
          ms.classList.remove("df-multiselect--open");
          ms.querySelector(".df-multiselect__trigger")?.setAttribute("aria-expanded", "false");
        }
      });
      document.querySelectorAll(".df-customselect--open").forEach((s) => {
        s.classList.remove("df-customselect--open");
        s.querySelector(".df-customselect__trigger")?.setAttribute("aria-expanded", "false");
      });

      wrap.classList.add("df-multiselect--open");
      trigger.setAttribute("aria-expanded", "true");
    };

    const closeDropdown = () => {
      wrap.classList.remove("df-multiselect--open");
      trigger.setAttribute("aria-expanded", "false");
    };

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      wrap.classList.contains("df-multiselect--open") ? closeDropdown() : openDropdown();
    });

    trigger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        wrap.classList.contains("df-multiselect--open") ? closeDropdown() : openDropdown();
      }
      if (e.key === "Escape") closeDropdown();
    });

    dropdown.addEventListener("click", (e) => e.stopPropagation());

    wrap.appendChild(trigger);
    wrap.appendChild(dropdown);
    wrap.appendChild(hiddenContainer);

    syncTrigger();
    syncHidden();

    return wrap;
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Form field construction
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Builds a field DOM element from a schema attribute.
   * @param {object} attr - schema attribute
   * @param {{ withLabel?: boolean }} options
   * @returns {HTMLElement} .df-field
   */
  _buildField(attr, { withLabel = false } = {}) {
    const { _el, _parseTokens, _validateAndResolveTokens, _javaType, _getNls, _validateInput } =
      DynamicForm;

    const rawTokens = _parseTokens(attr.inputFormat || "");
    const choices = this._normalizeChoices(attr);
    const hasChoices = choices.length > 0;
    const type = _javaType(attr.className);
    const { resolved: tok, warnings } = _validateAndResolveTokens(rawTokens, type, hasChoices);

    if (warnings.length > 0) {
      console.warn(
        `[DynamicForm] Field '${attr.code || "unknown"}': inputFormat="${attr.inputFormat}"`,
        warnings,
      );
    }

    const id = "df-" + attr.code;
    const label = _getNls(attr.nls, this.cfg.lang) || attr.code;
    const required = !!attr.required;
    const multi = !!attr.multiselect;
    const initialValue = this._getPresetValue(attr);
    const initialValues = DynamicForm._valueList(initialValue);
    const fieldPlaceholder =
      _getNls(attr.nls, this.cfg.lang, "PLACEHOLDER") || tok.placeholder || label;

    // Root field element.
    const wrap = _el("div", "df-field");
    wrap.dataset.code = attr.code;
    wrap.dataset.type = type;

    // Optional label. Boolean controls render their label inside the control.
    if (withLabel && type !== "boolean") {
      const labelEl = _el("label", "df-label", { for: id });
      const langNls =
        attr.nls?.[this.cfg.lang] || attr.nls?.en || Object.values(attr.nls || {})[0] || {};
      const description = (langNls["DESCRIPTION"] || "").trim();

      const descriptionRender = this.cfg.descriptionRender || "tooltip";

      let descHtml = "";
      if (description && descriptionRender === "tooltip") {
        descHtml = `<span class="df-tooltip-wrap"><span class="df-tooltip-icon">i</span><span class="df-tooltip-body">${description}</span></span>`;
      }

      labelEl.innerHTML =
        label + (required ? ' <span class="df-required">*</span>' : "") + descHtml;
      wrap.appendChild(labelEl);
    }
    // ── Control construction ──────────────────────────────────────────────

    let control;

    if (hasChoices) {
      // Choice-based field.
      if (tok.expanded) {
        // Expanded: radio/checkbox list.
        control = _el("div", "df-choice-list");
        choices.forEach((c, i) => {
          const itemLbl = _el("label", "df-choice-label");
          const inp = document.createElement("input");
          inp.className = "df-choice-input";
          inp.type = multi ? "checkbox" : "radio";
          inp.name = multi ? attr.code + "[]" : attr.code;
          inp.value = c.value;
          inp.checked = initialValues.includes(c.value);
          if (required && i === 0) inp.required = true;

          const customDot = _el("span", "df-choice-custom");
          const span = document.createElement("span");
          span.textContent = c.label;

          itemLbl.appendChild(inp);
          itemLbl.appendChild(customDot);
          itemLbl.appendChild(span);
          control.appendChild(itemLbl);
        });
      } else if (multi) {
        control = DynamicForm._buildMultiselect(attr.code, choices, fieldPlaceholder, initialValue);
      } else {
        control = DynamicForm._buildSingleSelect(
          attr.code,
          choices,
          fieldPlaceholder,
          initialValue,
        );
      }
    } else if (type === "entity") {
      // Entity: native select with options.
      control = _el("div", "df-entity-picker");
      const allOptions = Array.isArray(attr.options) ? attr.options : [];
      const select = _el("select", "df-input df-select", { id, name: attr.code });
      if (required) select.required = true;
      if (multi) select.multiple = true;

      if (!multi) {
        const placeholderOpt = _el("option", "", { value: "", disabled: "", selected: "" });
        placeholderOpt.textContent = fieldPlaceholder;
        if (initialValues.length > 0) placeholderOpt.selected = false;
        select.appendChild(placeholderOpt);
      }

      const renderOptions = (items) => {
        select.querySelectorAll("option:not([disabled])").forEach((o) => o.remove());
        items.forEach((item) => {
          const value = String(item.id ?? item.value ?? item.code ?? "");
          const o = _el("option", "", { value });
          o.textContent = DynamicForm._resolveEntityLabel(item);
          o.selected = initialValues.includes(value);
          select.appendChild(o);
        });
      };
      renderOptions(allOptions);
      control.appendChild(select);
    } else if (type === "boolean") {
      // Boolean: checkbox with label.
      control = _el("label", "df-choice-label");
      const inp = _el("input", "df-choice-input", {
        type: "checkbox",
        id,
        name: attr.code,
        value: "true",
      });
      if (required) inp.required = true;
      if (initialValue != null) inp.checked = String(initialValue) === "true";

      const customDot = _el("span", "df-choice-custom");
      const span = document.createElement("span");
      span.textContent = label;

      control.appendChild(inp);
      control.appendChild(customDot);
      control.appendChild(span);
    } else if (type === "number") {
      if (tok.slider) {
        // Slider.
        control = _el("div", "df-slider-wrap");
        const min = tok.min ?? 0;
        const max = tok.max ?? 100;
        const step = tok.step ?? 1;

        const range = _el("input", "df-slider", {
          type: "range",
          id,
          name: attr.code,
          min,
          max,
          step,
        });
        const val = _el("span", "df-slider-val");
        const sliderValue = initialValue ?? min;
        range.value = sliderValue;
        range.defaultValue = sliderValue;
        val.textContent = sliderValue;
        range.addEventListener("input", () => {
          val.textContent = range.value;
        });

        control.appendChild(range);
        control.appendChild(val);
      } else {
        // Number input.
        control = _el("input", "df-input", { type: "number", id, name: attr.code });
        if (tok.min != null) control.min = tok.min;
        if (tok.max != null) control.max = tok.max;
        if (tok.step != null) control.step = tok.step;
        if (required) control.required = true;
        if (tok.re) {
          control.dataset.regex = tok.re;
          control.addEventListener("input", () => _validateInput(control, wrap));
          control.addEventListener("blur", () => _validateInput(control, wrap));
        }
      }
      if (initialValue != null) {
        control.value = initialValue;
        control.defaultValue = initialValue;
      }
    } else {
      // String: textarea or input.
      if (tok.textarea) {
        control = _el("textarea", "df-input df-textarea", {
          id,
          name: attr.code,
          placeholder: fieldPlaceholder,
        });
        if (tok.rows) control.rows = tok.rows;
        if (tok.cols) control.cols = tok.cols;
      } else {
        const inputType = tok.tel
          ? "tel"
          : tok.url
            ? "url"
            : tok.email
              ? "email"
              : tok.color
                ? "color"
                : tok.date
                  ? "date"
                  : tok.password
                    ? "password"
                    : "text";

        control = _el("input", "df-input", {
          type: inputType,
          id,
          name: attr.code,
          placeholder: fieldPlaceholder,
        });
      }

      if (required) control.required = true;
      if (tok.re) {
        control.dataset.regex = tok.re;
        control.addEventListener("input", () => _validateInput(control, wrap));
        control.addEventListener("blur", () => _validateInput(control, wrap));
      }
      if (tok.minLength != null) control.minLength = tok.minLength;
      if (tok.maxLength != null) control.maxLength = tok.maxLength;
      if (initialValue != null) {
        control.value = initialValue;
        control.defaultValue = initialValue;
      }
    }

    // ── Field change logging (development) ────────────────────────────────

    if (control) {
      const isCustom =
        control.classList?.contains("df-multiselect") ||
        control.classList?.contains("df-customselect");

      if (isCustom) {
        control.addEventListener("change", () => {
          const form = control.closest("form");
          if (form) DynamicForm._logFormData(form, "Field changed: " + attr.code);
        });
      } else {
        const events =
          control.tagName === "INPUT" || control.tagName === "TEXTAREA"
            ? ["input", "change"]
            : ["change"];
        events.forEach((ev) =>
          control.addEventListener(ev, () => {
            const form = control.closest("form");
            if (form) DynamicForm._logFormData(form, "Field changed: " + attr.code);
          }),
        );
      }
    }

    // ── Add the control to the wrapper ────────────────────────────────────

    const isCustomDropdown =
      control.classList?.contains("df-multiselect") ||
      control.classList?.contains("df-customselect");

    if (isCustomDropdown) {
      wrap.appendChild(control);
    } else if (["INPUT", "SELECT", "TEXTAREA"].includes(control.tagName)) {
      const inputWrap = _el("div", "df-input-wrap");
      inputWrap.appendChild(control);
      wrap.appendChild(inputWrap);
    } else {
      wrap.appendChild(control);
    }

    if (type !== "boolean" && this.cfg.descriptionRender === "node") {
      const langNls =
        attr.nls?.[this.cfg.lang] || attr.nls?.en || Object.values(attr.nls || {})[0] || {};
      const description = (langNls["DESCRIPTION"] || "").trim();
      if (description) {
        const descEl = _el("div", "df-description");
        descEl.innerHTML = description;
        wrap.appendChild(descEl);
      }
    }

    // Error message container, except for boolean fields.
    if (type !== "boolean") {
      const errEl = _el("div", "df-error");
      errEl.setAttribute("aria-live", "polite");
      wrap.appendChild(errEl);
    }

    return wrap;
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Form data collection and validation
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Collects form data into a flat object.
   * Number fields are cast to Number, and boolean fields to boolean.
   */
  static _collectData(form) {
    const data = {};
    new FormData(form).forEach((val, key) => {
      const k = key.replace(/\[\]$/, "");
      data[k] = data[k] !== undefined ? [].concat(data[k], val) : val;
    });

    form.querySelectorAll(".df-field[data-type]").forEach((wrap) => {
      const k = wrap.dataset.code;
      const t = wrap.dataset.type;

      if (t === "number" && k in data) {
        data[k] = data[k] === "" ? null : Number(data[k]);
      } else if (t === "boolean") {
        const inp = wrap.querySelector("input[type='checkbox']");
        if (inp) data[k] = inp.checked;
      }
    });

    return data;
  }

  /**
   * Logs form data to the console for development.
   */
  static _logFormData(form, label) {
    const data = DynamicForm._collectData(form);
    const time = new Date().toLocaleTimeString();
    console.group(`🔍 [${time}] ${label || "Form Data"}`);
    console.table(data);
    console.log("Raw object:", data);
    console.groupEnd();
    return data;
  }

  /**
   * Validates a step or form: required fields and regular expressions.
   * Shows errors in the DOM. Returns true when everything is valid.
   */
  static _validateStep(stepEl) {
    let ok = true;

    // Clear previous errors.
    stepEl
      .querySelectorAll(".df-input--error")
      .forEach((el) => el.classList.remove("df-input--error"));
    stepEl
      .querySelectorAll(".df-choice-custom--error")
      .forEach((el) => el.classList.remove("df-choice-custom--error"));
    stepEl.querySelectorAll(".df-error").forEach((el) => (el.textContent = ""));

    stepEl.querySelectorAll(".df-field").forEach((wrap) => {
      const errEl = wrap.querySelector(".df-error");

      const setErr = (el, msg) => {
        el.classList.add("df-input--error");
        if (errEl) errEl.textContent = msg;
        ok = false;
      };

      const checkedRadioNames = new Set();

      wrap.querySelectorAll("[required]").forEach((inp) => {
        if (inp.type === "checkbox" && !inp.checked) {
          const customDot = inp.nextElementSibling;
          if (customDot?.classList.contains("df-choice-custom")) {
            customDot.classList.add("df-choice-custom--error");
          }
          ok = false;
        } else if (inp.type === "radio") {
          if (checkedRadioNames.has(inp.name)) return;
          checkedRadioNames.add(inp.name);
          const anyChecked = [...wrap.querySelectorAll(`input[name="${inp.name}"]`)].some(
            (r) => r.checked,
          );
          if (!anyChecked) {
            const group = wrap.querySelector(".df-choice-list, .df-radio-group, .df-checkbox-list");
            setErr(group || inp, "Please select an option");
          }
        } else if (inp.tagName === "SELECT" && (!inp.value || inp.value === "")) {
          setErr(inp, "This field is required");
        } else if (
          inp.tagName !== "SELECT" &&
          inp.type !== "checkbox" &&
          inp.type !== "radio" &&
          (!inp.value || inp.value === "")
        ) {
          setErr(inp, "This field is required");
        }
      });

      // Regex validation.
      wrap.querySelectorAll("[data-regex]").forEach((inp) => {
        if (inp.value && !new RegExp(inp.dataset.regex).test(inp.value)) {
          setErr(inp, "Invalid format");
        }
      });

      // Custom single-select validation.
      const cs = wrap.querySelector(".df-customselect");
      if (cs && wrap.dataset.required === "true") {
        const h = cs.querySelector("input[type='hidden']");
        if (!h?.value) {
          cs.querySelector(".df-customselect__trigger")?.classList.add("df-customselect--error");
          if (errEl) errEl.textContent = "This field is required";
          ok = false;
        } else {
          cs.querySelector(".df-customselect__trigger")?.classList.remove("df-customselect--error");
        }
      }

      // Custom multiselect validation.
      const ms = wrap.querySelector(".df-multiselect");
      if (ms && wrap.dataset.required === "true") {
        const hasSelected = ms.querySelectorAll(".df-multiselect__hidden input").length > 0;
        if (!hasSelected) {
          ms.querySelector(".df-multiselect__trigger")?.classList.add("df-multiselect--error");
          if (errEl) errEl.textContent = "This field is required";
          ok = false;
        } else {
          ms.querySelector(".df-multiselect__trigger")?.classList.remove("df-multiselect--error");
        }
      }
    });

    return ok;
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Render: Single Mode
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Renders a single-page form.
   */
  _renderSingle(container, groups, groupOrder) {
    const { _el, _collectData, _logFormData } = DynamicForm;
    const { cfg } = this;

    const allGroups = [
      ...(groups || []),
      ...(this._schema.parents || []).flatMap((p) => p.attributeGroups || []),
    ];

    const scrollToForm = () => {
      container.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const form = _el("form", "df-form", { novalidate: "" });

    groupOrder.forEach((entry) => {
      const [groupCode, items] = Object.entries(entry)[0];
      const group = allGroups.find((g) => g.code === groupCode);
      const groupLabel = group ? DynamicForm._getNls(group.nls, cfg.lang) : "";

      const section = _el("div", "df-section");

      if (groupLabel) {
        const h3 = _el("h3", "df-section-title");
        h3.textContent = groupLabel;
        section.appendChild(h3);
      }

      items.forEach((item) => {
        if (!item._attr) return;
        const fieldEl = this._buildField(item._attr, { withLabel: cfg.withLabel });
        if (item._attr.required) fieldEl.dataset.required = "true";
        section.appendChild(fieldEl);
      });

      form.appendChild(section);
    });

    // Submit button.
    const btnWrap = _el("div", "df-btn-wrap");
    const btn = _el("button", "df-btn df-btn--primary", { type: "submit" });
    btn.textContent = cfg.submitLabel || "Submit";
    btnWrap.appendChild(btn);
    form.appendChild(btnWrap);

    // Submit handler
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!DynamicForm._validateStep(form)) {
        scrollToForm();
        return;
      }

      const submittedData = this._mergePresetValues(_collectData(form));

      // Attribute -> typeId mapping used to group values on submit.
      const attrTypeMap = {};
      groupOrder.forEach((entry) => {
        const [, items] = Object.entries(entry)[0];
        items.forEach((item) => {
          if (item.attributeCode && item.typeId) attrTypeMap[item.attributeCode] = item.typeId;
        });
      });

      _logFormData(form, "SUBMITTED (Single Mode)");
      form.querySelector(".df-submit-error")?.remove();

      btn.disabled = true;
      btn.textContent = "Submitting...";

      try {
        await this._createForm(submittedData, attrTypeMap);
        form.reset();
        cfg.onSubmit?.(submittedData);
      } catch (err) {
        console.error("[DynamicForm] submit error", err);
        const errEl = _el("div", "df-submit-error");
        errEl.textContent = "Submit failed: " + err.message;
        form.appendChild(errEl);
      } finally {
        btn.disabled = false;
        btn.textContent = cfg.submitLabel || "Submit";
      }
    });

    container.appendChild(form);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Render: Multiple Mode (Wizard)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Renders a multi-step form wizard with a stepper.
   *
   * Architecture:
   *   - All steps are rendered immediately, but only the active one is shown (CSS .df-step--active)
   *   - visibility{} stores the visibility state for each step
   *   - uiBehavior can show or hide steps based on field values
   */
  _renderMultiple(container, groups, groupOrder) {
    const { _el, _collectData, _logFormData } = DynamicForm;
    const { cfg } = this;

    const scrollToForm = () => {
      container.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    // Merge root and parent groups so stepper labels can be resolved.
    const allGroups = [
      ...(groups || []),
      ...(this._schema.parents || []).flatMap((p) => p.attributeGroups || []),
    ];

    const allStepCodes = groupOrder.map((e) => Object.keys(e)[0]);

    // Step visibility state (true = visible).
    const visibility = {};
    allStepCodes.forEach((c) => {
      visibility[c] = true;
    });

    // Steps managed by behavior, registered and controlled.
    const controlled = new Set();
    const registered = new Set();

    // ── Stepper ───────────────────────────────────────────────────────────

    const stepper = _el("div", "df-stepper");
    container.appendChild(stepper);

    /** Rerenders the stepper from the currently visible steps */
    const renderStepper = (activeVisIdx, visibleCodes) => {
      stepper.innerHTML = "";
      visibleCodes.forEach((code, i) => {
        const group = allGroups.find((g) => g.code === code);
        const groupLabel = group ? DynamicForm._getNls(group.nls, cfg.lang) : "";

        const stepItem = _el("div", "df-stepper__item");
        if (i < activeVisIdx) stepItem.classList.add("df-stepper__item--done");
        if (i === activeVisIdx) stepItem.classList.add("df-stepper__item--active");

        const circle = _el("div", "df-stepper__circle");
        circle.textContent = String(i + 1).padStart(2, "0");

        const label = _el("div", "df-stepper__label");
        label.textContent = groupLabel || code;

        stepItem.appendChild(circle);
        stepItem.appendChild(label);
        stepper.appendChild(stepItem);

        if (i < visibleCodes.length - 1) {
          stepper.appendChild(_el("div", "df-stepper__line"));
        }
      });
    };

    // ── Form and steps ────────────────────────────────────────────────────

    const form = _el("form", "df-form df-form--wizard", { novalidate: "" });

    const stepElMap = {}; // { stepCode -> step DOM element }

    groupOrder.forEach((entry, gi) => {
      const [groupCode, items] = Object.entries(entry)[0];
      const group = allGroups.find((g) => g.code === groupCode);
      const groupLabel = group ? DynamicForm._getNls(group.nls, cfg.lang, "DESCRIPTION") : "";

      const stepEl = _el("div", "df-step");
      stepEl.dataset.step = gi;

      if (groupLabel) {
        const h3 = _el("h3", "df-multiple-section-title");
        h3.innerHTML = groupLabel;
        stepEl.appendChild(h3);
      }

      items.forEach((item) => {
        if (!item._attr) return;
        const fieldEl = this._buildField(item._attr, { withLabel: cfg.withLabel });
        if (item._attr.required) fieldEl.dataset.required = "true";
        stepEl.appendChild(fieldEl);
      });

      form.appendChild(stepEl);
      stepElMap[groupCode] = stepEl;
    });

    // ── Navigation ────────────────────────────────────────────────────────

    const nav = _el("div", "df-nav");
    const prevBtn = _el("button", "df-btn df-btn--ghost", { type: "button" });
    const nextBtn = _el("button", "df-btn df-btn--primary", { type: "button" });
    const submitBtn = _el("button", "df-btn df-btn--primary df-submit", { type: "submit" });

    prevBtn.textContent = cfg.prevLabel || "← Back";
    nextBtn.textContent = cfg.nextLabel || "Next →";
    submitBtn.textContent = cfg.submitLabel || "Submit";

    nav.appendChild(prevBtn);
    nav.appendChild(nextBtn);
    nav.appendChild(submitBtn);
    form.appendChild(nav);

    // ── Navigation helpers ────────────────────────────────────────────────

    const getVisibleCodes = () => allStepCodes.filter((c) => visibility[c] !== false);
    const getActiveEl = () => form.querySelector(".df-step--active");
    const getActiveCode = () => {
      const el = getActiveEl();
      if (!el) return null;
      return Object.entries(stepElMap).find(([, v]) => v === el)?.[0] || null;
    };

    /** Updates the stepper and button visibility */
    const updateUI = (visIdx, total) => {
      renderStepper(visIdx, getVisibleCodes());
      prevBtn.style.display = visIdx === 0 ? "none" : "";
      nextBtn.style.display = visIdx === total - 1 ? "none" : "";
      submitBtn.style.display = visIdx === total - 1 ? "" : "none";
    };

    /** Navigates to a step by code */
    const goToStep = (targetCode) => {
      const visibleCodes = getVisibleCodes();
      const targetIdx = visibleCodes.indexOf(targetCode);
      if (targetIdx === -1) return;

      allStepCodes.forEach((c) => {
        stepElMap[c]?.classList.remove("df-step--active", "df-step--done");
      });
      visibleCodes.slice(0, targetIdx).forEach((c) => stepElMap[c]?.classList.add("df-step--done"));
      stepElMap[targetCode]?.classList.add("df-step--active");

      updateUI(targetIdx, visibleCodes.length);
    };

    // ── Button handlers ───────────────────────────────────────────────────

    prevBtn.addEventListener("click", () => {
      const visibleCodes = getVisibleCodes();
      const idx = visibleCodes.indexOf(getActiveCode());
      if (idx > 0) goToStep(visibleCodes[idx - 1]);
    });

    nextBtn.addEventListener("click", () => {
      const activeEl = getActiveEl();
      if (!activeEl || !DynamicForm._validateStep(activeEl)) {
        scrollToForm();
        return;
      }
      const visibleCodes = getVisibleCodes();
      const idx = visibleCodes.indexOf(getActiveCode());
      if (idx < visibleCodes.length - 1) {
        goToStep(visibleCodes[idx + 1]);
        scrollToForm();
      }
    });

    // ── Submit ────────────────────────────────────────────────────────────

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const activeEl = getActiveEl();
      if (activeEl && !DynamicForm._validateStep(activeEl)) {
        scrollToForm();
        return;
      }

      // Collect data for the current form state.
      const rawData = this._mergePresetValues(_collectData(form));

      const attrTypeMap = {};
      groupOrder.forEach((entry) => {
        const [, items] = Object.entries(entry)[0];
        items.forEach((item) => {
          if (item.attributeCode && item.typeId) attrTypeMap[item.attributeCode] = item.typeId;
        });
      });

      // Remove fields from hidden steps.
      const hiddenAttrCodes = new Set();
      allStepCodes.forEach((code) => {
        if (visibility[code] === false) {
          const entry = groupOrder.find((en) => Object.keys(en)[0] === code);
          entry?.[code].forEach((item) => {
            if (item.attributeCode) hiddenAttrCodes.add(item.attributeCode);
          });
        }
      });
      hiddenAttrCodes.forEach((c) => {
        delete rawData[c];
        delete rawData[c + "[]"];
      });

      _logFormData(form, "SUBMITTED (Wizard Mode)");
      form.querySelector(".df-submit-error")?.remove();

      submitBtn.disabled = prevBtn.disabled = nextBtn.disabled = true;
      submitBtn.textContent = "Submitting...";

      try {
        await this._createForm(rawData, attrTypeMap);
        form.reset();
        goToStep(getVisibleCodes()[0]);
        cfg.onSubmit?.(rawData);
      } catch (err) {
        console.error("[DynamicForm] submit error", err);
        const errEl = _el("div", "df-submit-error");
        errEl.textContent = "Submit failed: " + err.message;
        form.appendChild(errEl);
      } finally {
        submitBtn.disabled = prevBtn.disabled = nextBtn.disabled = false;
        submitBtn.textContent = cfg.submitLabel || "Submit";
      }
    });

    container.appendChild(form);

    // ── Behavior Runtime ──────────────────────────────────────────────────
    //
    // Allows steps to be shown or hidden based on field values.
    // Each attribute with uiBehavior contains JavaScript that runs when the
    // field value changes. The code receives these helpers:
    //   applyBehavior(mapping) - shows a step based on the field value
    //   showStep(code)         - shows a step
    //   hideStep(code)         - hides a step
    //   setVisibleSteps(codes) - sets visibility for all controlled steps
    //   getVisibleSteps()      - returns an array of visible step codes
    //   currentValue           - current field value
    //   formValues             - all form values

    // ── Behavior helpers ─────────────────────────────────────────────────

    /** Resets all fields in a step to an empty state */
    const brtResetStep = (code) => {
      const el = stepElMap[code];
      if (!el) return;

      el.querySelectorAll(".df-multiselect").forEach((ms) => {
        ms.querySelectorAll("input[type='checkbox']").forEach((cb) => {
          cb.checked = false;
        });
        const hc = ms.querySelector(".df-multiselect__hidden");
        if (hc) hc.innerHTML = "";
        const tags = ms.querySelector(".df-multiselect__tags");
        if (tags) {
          tags.innerHTML = "";
          tags.style.display = "none";
        }
        const ph = ms.querySelector(".df-multiselect__placeholder");
        if (ph) ph.style.display = "";
      });

      el.querySelectorAll(".df-customselect").forEach((cs) => {
        const h = cs.querySelector("input[type='hidden']");
        if (h) h.value = "";
        const txt = cs.querySelector(".df-customselect__text");
        if (txt) {
          txt.classList.add("df-customselect__placeholder");
          txt.classList.remove("df-customselect__value");
        }
        cs.querySelectorAll(".df-customselect__option--selected").forEach((o) =>
          o.classList.remove("df-customselect__option--selected"),
        );
      });

      el.querySelectorAll("input, select, textarea").forEach((inp) => {
        if (inp.closest(".df-multiselect") || inp.closest(".df-customselect")) return;
        if (inp.type === "checkbox" || inp.type === "radio") inp.checked = false;
        else inp.value = "";
      });
    };

    /** Clears all validation errors in a step */
    const brtClearValidation = (code) => {
      const el = stepElMap[code];
      if (!el) return;
      el.querySelectorAll(".df-error").forEach((e) => {
        e.textContent = "";
      });
      el.querySelectorAll(".df-input--error").forEach((e) => e.classList.remove("df-input--error"));
      el.querySelectorAll(".df-customselect--error").forEach((e) =>
        e.classList.remove("df-customselect--error"),
      );
      el.querySelectorAll(".df-multiselect--error").forEach((e) =>
        e.classList.remove("df-multiselect--error"),
      );
      el.querySelectorAll(".df-choice-custom--error").forEach((e) =>
        e.classList.remove("df-choice-custom--error"),
      );
    };

    /** Applies data-behavior-hidden to a step DOM element */
    const brtSetHidden = (code, hidden) => {
      const el = stepElMap[code];
      if (!el) return;
      el.dataset.behaviorHidden = hidden ? "true" : "false";
      if (hidden) el.classList.remove("df-step--active");
    };

    /**
     * Synchronizes the active step after a visibility change.
     * If the current step is hidden, navigates to the nearest visible step.
     */
    const brtSyncAfterVisibilityChange = () => {
      const visibleCodes = getVisibleCodes();
      if (!visibleCodes.length) return;

      const currentCode = getActiveCode();

      if (currentCode && visibility[currentCode] === false) {
        // Find the next visible step.
        const allIdx = allStepCodes.indexOf(currentCode);
        let target = null;

        for (let i = allIdx + 1; i < allStepCodes.length; i++) {
          if (visibility[allStepCodes[i]] !== false) {
            target = allStepCodes[i];
            break;
          }
        }
        if (!target) {
          for (let i = allIdx - 1; i >= 0; i--) {
            if (visibility[allStepCodes[i]] !== false) {
              target = allStepCodes[i];
              break;
            }
          }
        }
        if (target) goToStep(target);
      } else {
        // Refresh the UI because the visible step count may have changed.
        const visIdx = currentCode ? visibleCodes.indexOf(currentCode) : 0;
        updateUI(visIdx !== -1 ? visIdx : 0, visibleCodes.length);
      }
    };

    // ── Behavior initialization ───────────────────────────────────────────

    const attrsWithBehavior = [];
    const scanAttrs = (attrs) => {
      (attrs || []).forEach((attr) => {
        if (attr.uiBehavior) attrsWithBehavior.push(attr);
      });
    };
    scanAttrs(this._schema.attributes);
    (this._schema.parents || []).forEach((p) => scanAttrs(p.attributes));

    if (attrsWithBehavior.length > 0) {
      // CSS used to hide behavior-controlled steps.
      if (!document.getElementById("df-behavior-style")) {
        const st = document.createElement("style");
        st.id = "df-behavior-style";
        st.textContent = `.df-step[data-behavior-hidden="true"] { display: none !important; }`;
        document.head.appendChild(st);
      }

      /** Reads the current field value by attribute code */
      const getFieldValue = (code) => {
        const ms = form.querySelector(`.df-multiselect[data-code="${code}"]`);
        if (ms)
          return Array.from(ms.querySelectorAll(".df-multiselect__hidden input")).map(
            (i) => i.value,
          );

        const cs = form.querySelector(`.df-customselect[data-code="${code}"]`);
        if (cs) {
          const h = cs.querySelector("input[type='hidden']");
          return h ? h.value || null : null;
        }

        const field = form.querySelector(`.df-field[data-code="${code}"]`);
        if (!field) return null;

        const cbs = field.querySelectorAll("input[type='checkbox']");
        if (cbs.length > 1)
          return Array.from(cbs)
            .filter((c) => c.checked)
            .map((c) => c.value);

        const radio = field.querySelector("input[type='radio']:checked");
        if (radio) return radio.value;

        const inp = field.querySelector("input, select, textarea");
        return inp ? inp.value || null : null;
      };

      /**
       * Builds the applyBehavior function for a specific attribute.
       * mapping: { optionValue: stepCode } shows a step when a value is selected.
       */
      const buildApplyBehavior = (attr) => (mapping) => {
        if (!mapping || typeof mapping !== "object") return;

        const currentValue = getFieldValue(attr.code);

        // Register controlled steps and hide them the first time they are registered.
        Object.values(mapping).forEach((stepCode) => {
          if (!stepCode || typeof stepCode !== "string" || !(stepCode in stepElMap)) return;
          controlled.add(stepCode);
          if (!registered.has(stepCode)) {
            registered.add(stepCode);
            visibility[stepCode] = false;
            brtSetHidden(stepCode, true);
          }
        });

        // Determine which steps should be visible.
        const selected = Array.isArray(currentValue)
          ? currentValue
          : currentValue
            ? [currentValue]
            : [];
        const toShow = new Set();
        selected.forEach((val) => {
          const matchedKey = Object.keys(mapping).find(
            (k) => k.toLowerCase() === val.toLowerCase(),
          );
          const target = matchedKey ? mapping[matchedKey] : undefined;
          if (target && typeof target === "string" && target in stepElMap) toShow.add(target);
        });

        // Apply visibility changes.
        let changed = false;
        Object.values(mapping).forEach((stepCode) => {
          if (!stepCode || typeof stepCode !== "string" || !(stepCode in stepElMap)) return;
          const show = toShow.has(stepCode);
          if (visibility[stepCode] === show) return;
          visibility[stepCode] = show;
          brtSetHidden(stepCode, !show);
          if (!show) {
            brtResetStep(stepCode);
            brtClearValidation(stepCode);
          }
          changed = true;
        });

        if (changed) brtSyncAfterVisibilityChange();
      };

      /**
       * Executes attribute uiBehavior code in an isolated function.
       * Passes all helpers as arguments.
       */
      const execBehavior = (attr) => {
        const code = (attr.uiBehavior || "").replace(/\/\*[\s\S]*?\*\//g, "").trim();
        if (!code) return;

        try {
          const currentValue = getFieldValue(attr.code);
          const formValues = DynamicForm._collectData(form);

          // eslint-disable-next-line no-new-func
          new Function(
            "applyBehavior",
            "showStep",
            "hideStep",
            "setVisibleSteps",
            "getVisibleSteps",
            "currentValue",
            "formValues",
            code,
          )(
            buildApplyBehavior(attr),

            // showStep(code)
            (stepCode) => {
              if (!(stepCode in stepElMap) || visibility[stepCode]) return;
              visibility[stepCode] = true;
              brtSetHidden(stepCode, false);
              brtSyncAfterVisibilityChange();
            },

            // hideStep(code)
            (stepCode) => {
              if (!(stepCode in stepElMap) || visibility[stepCode] === false) return;
              visibility[stepCode] = false;
              brtSetHidden(stepCode, true);
              brtResetStep(stepCode);
              brtClearValidation(stepCode);
              brtSyncAfterVisibilityChange();
            },

            // setVisibleSteps(codes[])
            (codes) => {
              controlled.forEach((c) => {
                const show = codes.includes(c);
                if (visibility[c] === show) return;
                visibility[c] = show;
                brtSetHidden(c, !show);
                if (!show) {
                  brtResetStep(c);
                  brtClearValidation(c);
                }
              });
              brtSyncAfterVisibilityChange();
            },

            // getVisibleSteps()
            () => getVisibleCodes(),

            currentValue,
            formValues,
          );
        } catch (err) {
          console.error(`[DynamicForm] uiBehavior error on "${attr.code}":`, err);
        }
      };

      // Run behavior before goToStep so hidden steps are hidden immediately.
      attrsWithBehavior.forEach((attr) => execBehavior(attr));

      // Attach listeners to fields with behavior.
      attrsWithBehavior.forEach((attr) => {
        const fieldEl = form.querySelector(`.df-field[data-code="${attr.code}"]`);
        if (!fieldEl) return;

        const run = () => execBehavior(attr);

        const ms = fieldEl.querySelector(".df-multiselect");
        const cs = fieldEl.querySelector(".df-customselect");

        if (ms) ms.addEventListener("change", run);
        else if (cs) cs.addEventListener("change", run);
        else
          fieldEl
            .querySelectorAll("input, select, textarea")
            .forEach((inp) => inp.addEventListener("change", run));
      });
    }

    // Show the first visible step after behavior initialization.
    goToStep(getVisibleCodes()[0]);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  API
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Loads the form schema from the server.
   */
  _fetchFormSchema() {
    const params = new URLSearchParams({ locale: this.cfg.lang });
    const url = `${this.cfg.apiBaseUrl}/core-cms/api/form-type/${this.cfg.formTypeCode}/get.json?${params}`;
    return fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json", accept: "application/json" },
    }).then((r) => {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }

  /**
   * Sends form data to the server.
   * Groups attributes by typeId according to attrTypeMap.
   * Attributes without a typeId are grouped under the root schema id.
   *
   * @param {object} attr        - flat object { code: value }
   * @param {object} attrTypeMap - mapping { code: typeId }
   */
  async _createForm(attr, attrTypeMap = {}) {
    const url = `${this.cfg.apiBaseUrl}/core-cms/api/form/submit.json`;

    // Group attributes by typeId.
    const groupedAttributes = {};
    Object.entries(attr).forEach(([key, value]) => {
      if (value === null || value === undefined || value === "") return;
      const typeId = attrTypeMap[key] ?? this._getAttributeTypeId(key) ?? this._schema.id;
      if (!groupedAttributes[typeId]) groupedAttributes[typeId] = {};
      groupedAttributes[typeId][key] = { value };
    });

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        type: { id: this._schema.id },
        organization: { id: this.cfg.organizationId },
        attributes: groupedAttributes,
      }),
    });

    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Build group order from schema
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Builds a flat array of groups with attributes for rendering.
   *
   * Attribute resolution:
   *   - item.typeId present -> look up the attribute in that specific parent by id
   *   - item.typeId absent  -> look only in root schema attributes
   *
   * This prevents duplicate fields when the same attribute code exists in both
   * the root type and a parent type.
   *
   * @returns {Array<{ [groupCode]: Array<item & { _attr }> }>}
   */
  static _buildGroupOrder(schema) {
    // Root attribute map.
    const rootAttrMap = {};
    (schema.attributes || []).forEach((a) => {
      rootAttrMap[a.code] = a;
    });

    // Attribute map by typeId: { parentId: { code: attr } }.
    const parentAttrMap = {};
    (schema.parents || []).forEach((parent) => {
      parentAttrMap[parent.id] = {};
      (parent.attributes || []).forEach((a) => {
        parentAttrMap[parent.id][a.code] = a;
      });
    });

    return (schema.attributeOrder || [])
      .map((entry) => {
        const groupCode = Object.keys(entry)[0];
        const items = entry[groupCode]
          .filter((i) => i.visible !== false)
          .map((i) => {
            const _attr = i.typeId
              ? parentAttrMap[i.typeId]?.[i.attributeCode] || null
              : rootAttrMap[i.attributeCode] || null;
            return { ...i, _attr };
          })
          .filter((i) => i._attr !== null);

        return { [groupCode]: items };
      })
      .filter((entry) => Object.values(entry)[0].length > 0);
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Entry point
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Mounts the form into the specified container.
   * @param {string|HTMLElement} selector - CSS selector or DOM element
   * @returns {DynamicForm} this, for chaining
   */
  mount(selector) {
    const container = typeof selector === "string" ? document.querySelector(selector) : selector;
    if (!container) throw new Error("DynamicForm: container not found: " + selector);

    // Global listener for closing dropdowns when clicking outside.
    if (!document._dfClickOutsideBound) {
      document._dfClickOutsideBound = true;
      document.addEventListener("click", () => {
        document.querySelectorAll(".df-multiselect--open").forEach((ms) => {
          ms.classList.remove("df-multiselect--open");
          ms.querySelector(".df-multiselect__trigger")?.setAttribute("aria-expanded", "false");
        });
        document.querySelectorAll(".df-customselect--open").forEach((s) => {
          s.classList.remove("df-customselect--open");
          s.querySelector(".df-customselect__trigger")?.setAttribute("aria-expanded", "false");
        });
      });
    }

    // Show loader.
    const loader = DynamicForm._el("div", "df-loader");
    loader.innerHTML = '<div class="df-spinner"></div><p>Loading form…</p>';
    container.appendChild(loader);

    this._fetchFormSchema()
      .then((schema) => {
        loader.remove();
        this._schema = schema;

        console.log(schema);

        const groups = schema.attributeGroups || [];
        const groupOrder = DynamicForm._buildGroupOrder(schema);

        const wrapper = DynamicForm._el("div", "df-wrapper");
        container.appendChild(wrapper);

        if (this.cfg.type === "multiple") {
          this._renderMultiple(wrapper, groups, groupOrder);
        } else {
          this._renderSingle(wrapper, groups, groupOrder);
        }
      })
      .catch((err) => {
        loader.remove();
        const errEl = DynamicForm._el("div", "df-load-error");
        errEl.textContent = "Failed to load form: " + err.message;
        container.appendChild(errEl);
        console.error("[DynamicForm]", err);
      });

    // Smart tooltip positioning.
    if (!document._dfTooltipBound) {
      document._dfTooltipBound = true;
      document.addEventListener("mouseover", (e) => {
        const wrap = e.target.closest(".df-tooltip-wrap");
        if (!wrap) return;
        const body = wrap.querySelector(".df-tooltip-body");
        if (!body) return;

        // Reset position to measure the real dimensions.
        body.style.left = "";
        body.style.top = "";
        body.style.bottom = "";

        const iconRect = wrap.getBoundingClientRect();
        const tooltipW = body.offsetWidth;
        const tooltipH = body.offsetHeight;
        const GAP = 8;
        const MARGIN = 8; // viewport edge margin

        // Try to show above the icon.
        let top = iconRect.top - tooltipH - GAP;
        let showBelow = false;
        if (top < MARGIN) {
          // If it does not fit above, show it below.
          top = iconRect.bottom + GAP;
          showBelow = true;
        }

        // Horizontal positioning: center relative to the icon.
        let left = iconRect.left + iconRect.width / 2 - tooltipW / 2;
        // Keep inside the left viewport edge.
        if (left < MARGIN) left = MARGIN;
        // Keep inside the right viewport edge.
        if (left + tooltipW > window.innerWidth - MARGIN) {
          left = window.innerWidth - tooltipW - MARGIN;
        }

        // Arrow position relative to the tooltip.
        const arrowLeft = iconRect.left + iconRect.width / 2 - left;
        body.style.setProperty("--arrow-left", arrowLeft + "px");

        // Arrow above or below.
        if (showBelow) {
          body.style.setProperty("--arrow-top", "-10px");
          body.style.cssText += `
        --arrow-rotate: 180deg;
      `;
          // Redraw the arrow upward when the tooltip is below.
          body.setAttribute("data-pos", "below");
        } else {
          body.removeAttribute("data-pos");
        }

        body.style.left = left + "px";
        body.style.top = top + "px";
      });
    }

    return this;
  }
}

window.DynamicForm = DynamicForm;
