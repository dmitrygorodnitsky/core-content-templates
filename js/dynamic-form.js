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
   * @param {string} [config.searchPlaceholder] Placeholder of the freeValue search field.
   * @param {string} [config.createValueLabel] Prefix of the "use this value" row.
   * @param {string} [config.emptyLabel] Text shown when the search matches nothing.
   * @param {object} [config.schema] Ready-made schema; skips the API request.
   * @param {boolean} [config.dryRun] Build and log the submit body without sending it.
   *
   * Address fields — an attribute referencing the Address entity, or a String
   * attribute with the 'address' inputFormat token:
   * @param {"google"|"photon"} [config.addressProvider] Suggestion provider.
   *        Defaults to Google when mapApiKey is set, otherwise to Photon, which
   *        needs neither a key nor billing.
   * @param {"google"|"osm"} [config.addressMapProvider] Map provider; follows
   *        addressProvider unless set.
   * @param {string}  [config.photonUrl] Photon instance, defaults to the public
   *                                     photon.komoot.io.
   * @param {string}  [config.tileUrl] Tile template for the OSM map. The public
   *        OpenStreetMap servers are the default and are fine for development,
   *        but their tile policy does not cover production traffic.
   * @param {string}  [config.tileAttribution]
   * @param {string}  [config.mapApiKey] Google Maps key, required only by the
   *                                     Google provider.
   * @param {string}  [config.mapId] Google map id, enables advanced markers.
   * @param {boolean} [config.addressMap] Set to false to drop the map entirely.
   * @param {boolean} [config.addressMapOpen] Open the map right away. Off by
   *        default: it sits behind a "Show on map" toggle.
   * @param {number}  [config.addressImportMax] Cap on a single bulk import (50).
   * @param {number}  [config.addressMapZoom] Zoom once an address is picked (16).
   * @param {number}  [config.addressMapOverviewZoom] Zoom while the map is only
   *        there to pick from (11).
   * @param {{lat: number, lng: number}} [config.addressMapCenter] Where the map
   *        opens before anything is picked.
   * @param {boolean} [config.addressMapScrollZoom] Let a plain wheel or
   *        two-finger scroll zoom the map. Off by default: pinch and
   *        ⌘/Ctrl + wheel zoom, everything else scrolls the page.
   * @param {string[]} [config.addressRegions] Region codes the suggestions are
   *                                           limited to, e.g. ["ca", "us"].
   * @param {number}  [config.addressMinQuery] Characters before the first lookup (3).
   * @param {number}  [config.addressDebounce] Delay before the lookup, ms (300).
   * @param {function} [config.loadAddresses] (attr) => Promise<Address[]>, the
   *                                          list of already saved addresses.
   * @param {function} [config.createAddress] (draft) => Promise<number>, replaces
   *                                          the default save.json request.
   * @param {function} [config.buildAddressPayload] (draft) => object, keeps the
   *                                          default request but changes its body.
   * @param {string}  [config.addressSaveUrl] Overrides the save endpoint.
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
    return (
      map[key] ||
      map.name ||
      map.label ||
      map.title ||
      Object.values(map)[0] ||
      ""
    );
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
      address: false,
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
        else if (tok === "address") t.address = true;
        else if (tok.startsWith("rows:")) t.rows = Number(tok.slice(5));
        else if (tok.startsWith("cols:")) t.cols = Number(tok.slice(5));
        else if (tok.startsWith("minLength:"))
          t.minLength = Number(tok.slice(10));
        else if (tok.startsWith("maxLength:"))
          t.maxLength = Number(tok.slice(10));
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
      "address",
    ];
    const SPECIAL_TYPES = ["tel", "url", "email", "color", "date", "address"];

    /** Resets a token and records a warning */
    const ignore = (key, reason) => {
      warnings.push(`'${key}' ignored for ${reason}`);
      r[key] = BOOL_FLAGS.includes(key) ? false : null;
    };

    if (hasChoices) {
      ["password", "textarea", "slider"].forEach((k) => {
        if (r[k]) ignore(k, "choice-based field");
      });
      ["min", "max", "step", "rows", "cols", "minLength", "maxLength"].forEach(
        (k) => {
          if (r[k] !== null) ignore(k, "choice-based field");
        },
      );
      // 'address' survives here: for an address field the options are the list
      // of saved addresses to offer, not a set of values to choose between.
      SPECIAL_TYPES.filter((k) => k !== "address").forEach((k) => {
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
        warnings.push(
          "'step' without 'slider': applies to number input stepper",
        );
    } else if (fieldType === "boolean") {
      ["password", "textarea", "slider", "expanded"].forEach((k) => {
        if (r[k]) ignore(k, "boolean field");
      });
      ["min", "max", "step", "rows", "cols", "minLength", "maxLength"].forEach(
        (k) => {
          if (r[k] !== null) ignore(k, "boolean field");
        },
      );
      SPECIAL_TYPES.forEach((k) => {
        if (r[k]) ignore(k, "boolean field");
      });
      if (r.re) ignore("re", "boolean field");
      if (r.placeholder !== null) ignore("placeholder", "boolean field");
    } else if (fieldType === "entity") {
      ["password", "textarea", "slider"].forEach((k) => {
        if (r[k]) ignore(k, "entity field");
      });
      ["min", "max", "step", "rows", "cols", "minLength", "maxLength"].forEach(
        (k) => {
          if (r[k] !== null) ignore(k, "entity field");
        },
      );
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
    if (
      /Integer|Long|Float|Double|BigDecimal|Short|Byte|^int$|^long$|^float$|^double$/.test(
        s,
      )
    )
      return "number";
    if (
      s.includes("java.lang.String") ||
      s.endsWith(".String") ||
      s === "String"
    )
      return "string";
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
          o.label ??
            o.name ??
            DynamicForm._getNls(o.nls, this.cfg.lang) ??
            o.value ??
            "",
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
      if (
        !map ||
        typeof map !== "object" ||
        !Object.prototype.hasOwnProperty.call(map, code)
      ) {
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
    const ctaSourceMissing = [undefined, null, ""].includes(merged[DynamicForm.CTA_SOURCE_CODE]);
    if (ctaSourceMissing && this._getAttributeTypeId(DynamicForm.CTA_SOURCE_CODE) !== null) {
      const ctaSource = DynamicForm._ctaSourceFromSearch(window.location.search);
      if (ctaSource) merged[DynamicForm.CTA_SOURCE_CODE] = ctaSource;
    }
    return merged;
  }

  static CTA_SOURCE_CODE = "CTA_SOURCE";
  static CTA_SOURCE_DETAIL_PARAMS = ["plan", "period", "packs", "weather"];
  static CTA_SOURCE_PART_MAX = 64;
  static CTA_SOURCE_MAX = 255;

  static _ctaSourceFromSearch(search) {
    const params = new URLSearchParams(search || "");
    const plain = (value) =>
      String(value ?? "")
        .replace(/[^A-Za-z0-9_.:-]/g, "")
        .slice(0, DynamicForm.CTA_SOURCE_PART_MAX);
    const source = plain(params.get("cta_source"));
    if (!source) return "";
    const details = DynamicForm.CTA_SOURCE_DETAIL_PARAMS.map((key) => [key, plain(params.get(key))])
      .filter(([, value]) => value)
      .map(([key, value]) => `${key}=${value}`);
    return [source, ...details].join("; ").slice(0, DynamicForm.CTA_SOURCE_MAX);
  }

  _getAttributeTypeId(code) {
    if (!this._schema || !code) return null;
    if ((this._schema.attributes || []).some((attr) => attr.code === code))
      return this._schema.id;

    const parent = (this._schema.parents || []).find((p) =>
      (p.attributes || []).some((attr) => attr.code === code),
    );
    return parent?.id ?? null;
  }

  static _valueList(value) {
    if (value === null || value === undefined || value === "") return [];
    if (Array.isArray(value))
      return value.flatMap((v) => DynamicForm._valueList(v));
    if (typeof value === "object" && !Array.isArray(value)) {
      return DynamicForm._valueList(
        value.id ?? value.value ?? value.code ?? "",
      );
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
   *
   * @param {object} [opts]
   * @param {boolean} [opts.freeValue]  add a search field that also accepts values
   *                                    outside the option list
   * @param {string}  [opts.searchPlaceholder] search field placeholder
   * @param {string}  [opts.createLabel]     prefix of the "use this value" row
   * @param {string}  [opts.emptyLabel]      text shown when nothing matches
   */
  static _buildSingleSelect(
    code,
    choices,
    placeholder,
    initialValue,
    opts = {},
  ) {
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

    const triggerText = _el(
      "span",
      "df-customselect__text df-customselect__placeholder",
    );
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
        triggerText.classList.replace(
          "df-customselect__placeholder",
          "df-customselect__value",
        );
      } else {
        triggerText.textContent = placeholder;
        triggerText.classList.replace(
          "df-customselect__value",
          "df-customselect__placeholder",
        );
      }

      dropdown.querySelectorAll(".df-customselect__option").forEach((opt) => {
        const selected = opt.dataset.value === val;
        opt.classList.toggle("df-customselect__option--selected", selected);
        opt.setAttribute("aria-selected", String(selected));
      });

      if (emitChange)
        wrap.dispatchEvent(new Event("change", { bubbles: true }));
    };

    /** Creates a dropdown option, optionally inserted before a given node */
    const addOption = (c, { custom = false, before = null } = {}) => {
      const opt = _el("div", "df-customselect__option");
      opt.setAttribute("role", "option");
      opt.setAttribute("aria-selected", "false");
      opt.dataset.value = c.value;
      if (custom) opt.dataset.custom = "true";
      opt.textContent = c.label;
      opt.addEventListener("click", (e) => {
        e.stopPropagation();
        syncTrigger(c.value, c.label);
        closeDropdown();
      });
      if (before) dropdown.insertBefore(opt, before);
      else dropdown.appendChild(opt);
      return opt;
    };

    choices.forEach((c) => addOption(c));

    // Free value: the dropdown gets a search field at the top. Typing filters
    // the options; when the query matches none of them, the list offers to use
    // the typed text as the value.
    let searchInput = null;
    let createOpt = null;
    let applyFilter = () => {};

    if (opts.freeValue) {
      const searchPlaceholder =
        opts.searchPlaceholder || "Search or type your own";
      const search = _el("div", "df-select-search");
      searchInput = _el("input", "df-select-search__input", {
        type: "text",
        placeholder: searchPlaceholder,
        "aria-label": searchPlaceholder,
        autocomplete: "off",
      });
      search.appendChild(searchInput);
      dropdown.insertBefore(search, dropdown.firstChild);

      createOpt = _el(
        "div",
        "df-customselect__option df-customselect__option--create",
      );
      createOpt.setAttribute("role", "option");
      const emptyEl = _el("div", "df-select-empty");
      emptyEl.textContent = opts.emptyLabel || "Nothing found";
      dropdown.appendChild(createOpt);
      dropdown.appendChild(emptyEl);

      const listedOptions = () =>
        dropdown.querySelectorAll(
          ".df-customselect__option:not(.df-customselect__option--create)",
        );

      /** Turns the typed text into the selected value */
      const commitCreate = () => {
        const raw = searchInput.value.trim();
        if (!raw) return;

        const existing = choices.find(
          (c) => c.value === raw || c.label === raw,
        );
        if (existing) {
          syncTrigger(existing.value, existing.label);
        } else {
          // Only one custom option is kept — a single select holds one value.
          dropdown
            .querySelectorAll('.df-customselect__option[data-custom="true"]')
            .forEach((old) => {
              const i = choices.findIndex((c) => c.value === old.dataset.value);
              if (i !== -1) choices.splice(i, 1);
              old.remove();
            });

          const c = { value: raw, label: raw };
          choices.push(c);
          addOption(c, { custom: true, before: createOpt });
          syncTrigger(c.value, c.label);
        }

        closeDropdown();
      };

      applyFilter = () => {
        const raw = searchInput.value.trim();
        const q = raw.toLowerCase();

        let visible = 0;
        listedOptions().forEach((opt) => {
          const match = !q || opt.textContent.toLowerCase().includes(q);
          opt.style.display = match ? "" : "none";
          if (match) visible++;
        });

        const exact = choices.some(
          (c) => c.label.toLowerCase() === q || c.value.toLowerCase() === q,
        );
        const showCreate = !!raw && !exact;
        createOpt.textContent = showCreate
          ? `${opts.createLabel || "Use"} “${raw}”`
          : "";
        createOpt.style.display = showCreate ? "" : "none";
        emptyEl.style.display = visible === 0 && !showCreate ? "" : "none";
      };

      createOpt.addEventListener("click", (e) => {
        e.stopPropagation();
        commitCreate();
      });

      searchInput.addEventListener("input", applyFilter);
      searchInput.addEventListener("click", (e) => e.stopPropagation());
      searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          // Enter picks the first matching option, or creates when none match.
          const first = [...listedOptions()].find(
            (o) => o.style.display !== "none",
          );
          if (first) first.click();
          else commitCreate();
        }
        if (e.key === "Escape") {
          e.stopPropagation();
          closeDropdown();
        }
      });

      applyFilter();
    }

    // Open/close behavior.
    const openDropdown = () => {
      // Close all other open dropdowns.
      document.querySelectorAll(".df-customselect--open").forEach((s) => {
        if (s !== wrap) {
          s.classList.remove("df-customselect--open");
          s.querySelector(".df-customselect__trigger")?.setAttribute(
            "aria-expanded",
            "false",
          );
        }
      });
      document.querySelectorAll(".df-multiselect--open").forEach((ms) => {
        ms.classList.remove("df-multiselect--open");
        ms.querySelector(".df-multiselect__trigger")?.setAttribute(
          "aria-expanded",
          "false",
        );
      });

      wrap.classList.add("df-customselect--open");
      trigger.setAttribute("aria-expanded", "true");
      searchInput?.focus();
    };

    const closeDropdown = () => {
      wrap.classList.remove("df-customselect--open");
      trigger.setAttribute("aria-expanded", "false");
      // Reopen on a clean list rather than the previous query.
      if (searchInput) {
        searchInput.value = "";
        applyFilter();
      }
    };

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      wrap.classList.contains("df-customselect--open")
        ? closeDropdown()
        : openDropdown();
    });

    trigger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        wrap.classList.contains("df-customselect--open")
          ? closeDropdown()
          : openDropdown();
      }
      if (e.key === "Escape") closeDropdown();
    });

    dropdown.addEventListener("click", (e) => e.stopPropagation());

    wrap.appendChild(hidden);
    wrap.appendChild(trigger);
    wrap.appendChild(dropdown);

    const initialStr = String(initialValue ?? "");
    const initial = choices.find((c) => c.value === initialStr);
    if (initial) {
      syncTrigger(initial.value, initial.label, false);
    } else if (opts.freeValue && initialStr) {
      // Preset value that is not in the option list is kept as a custom option.
      const c = { value: initialStr, label: initialStr };
      choices.push(c);
      addOption(c, { custom: true, before: createOpt });
      syncTrigger(c.value, c.label, false);
    }

    wrap._getValue = () => selectedValue;

    return wrap;
  }

  /**
   * Builds a custom multiselect control (df-multiselect).
   * Selected values are rendered as tags inside the trigger.
   *
   * @param {object} [opts]
   * @param {boolean} [opts.freeValue]  add a search field that also accepts values
   *                                    outside the option list
   * @param {string}  [opts.searchPlaceholder] search field placeholder
   * @param {string}  [opts.createLabel]     prefix of the "add this value" row
   * @param {string}  [opts.emptyLabel]      text shown when nothing matches
   */
  static _buildMultiselect(
    code,
    choices,
    placeholder,
    initialValue,
    opts = {},
  ) {
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
          const cb = dropdown.querySelector(
            `input[value="${CSS.escape(val)}"]`,
          );
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

    /** Creates a dropdown checkbox item, optionally inserted before a given node */
    const addChoiceItem = (c, { custom = false, before = null } = {}) => {
      const itemLbl = _el("label", "df-choice-label");
      itemLbl.setAttribute("role", "option");
      if (custom) itemLbl.dataset.custom = "true";

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
      if (before) dropdown.insertBefore(itemLbl, before);
      else dropdown.appendChild(itemLbl);
      return itemLbl;
    };

    choices.forEach((c) => addChoiceItem(c));

    // Free value: the dropdown gets a search field at the top. Typing filters
    // the options; when the query matches none of them, the list offers to add
    // the typed text as a selected value.
    let searchInput = null;
    let createOpt = null;
    let applyFilter = () => {};

    if (opts.freeValue) {
      const searchPlaceholder =
        opts.searchPlaceholder || "Search or type your own";
      const search = _el("div", "df-select-search");
      searchInput = _el("input", "df-select-search__input", {
        type: "text",
        placeholder: searchPlaceholder,
        "aria-label": searchPlaceholder,
        autocomplete: "off",
      });
      search.appendChild(searchInput);
      dropdown.insertBefore(search, dropdown.firstChild);

      createOpt = _el("div", "df-multiselect__create");
      createOpt.setAttribute("role", "option");
      const emptyEl = _el("div", "df-select-empty");
      emptyEl.textContent = opts.emptyLabel || "Nothing found";
      dropdown.appendChild(createOpt);
      dropdown.appendChild(emptyEl);

      const listedItems = () => dropdown.querySelectorAll(".df-choice-label");

      /** Adds the typed text to the list as a checked item */
      const commitCreate = () => {
        const raw = searchInput.value.trim();
        if (!raw) return;

        if (choices.some((c) => c.value === raw || c.label === raw)) {
          const cb = dropdown.querySelector(
            `input[value="${CSS.escape(raw)}"]`,
          );
          if (cb && !cb.checked) {
            cb.checked = true;
            cb.dispatchEvent(new Event("change"));
          }
        } else {
          const c = { value: raw, label: raw };
          choices.push(c);
          const item = addChoiceItem(c, { custom: true, before: createOpt });
          const cb = item.querySelector("input[type='checkbox']");
          cb.checked = true;
          selectedValues.add(raw);
          syncTrigger();
          syncHidden();
          wrap.dispatchEvent(new Event("change", { bubbles: true }));
        }

        // A multiselect stays open so several values can be added in a row.
        searchInput.value = "";
        applyFilter();
        searchInput.focus();
      };

      applyFilter = () => {
        const raw = searchInput.value.trim();
        const q = raw.toLowerCase();

        let visible = 0;
        listedItems().forEach((item) => {
          const match = !q || item.textContent.toLowerCase().includes(q);
          item.style.display = match ? "" : "none";
          if (match) visible++;
        });

        const exact = choices.some(
          (c) => c.label.toLowerCase() === q || c.value.toLowerCase() === q,
        );
        const showCreate = !!raw && !exact;
        createOpt.textContent = showCreate
          ? `${opts.createLabel || "Add"} “${raw}”`
          : "";
        createOpt.style.display = showCreate ? "" : "none";
        emptyEl.style.display = visible === 0 && !showCreate ? "" : "none";
      };

      createOpt.addEventListener("click", (e) => {
        e.stopPropagation();
        commitCreate();
      });

      searchInput.addEventListener("input", applyFilter);
      searchInput.addEventListener("click", (e) => e.stopPropagation());
      searchInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          // Enter toggles the first matching option, or adds the typed value.
          const first = [...listedItems()].find(
            (i) => i.style.display !== "none",
          );
          if (first) {
            const cb = first.querySelector("input[type='checkbox']");
            cb.checked = !cb.checked;
            cb.dispatchEvent(new Event("change"));
          } else {
            commitCreate();
          }
        }
        if (e.key === "Escape") {
          e.stopPropagation();
          closeDropdown();
        }
      });

      // Preset values that are not in the option list are kept as custom items.
      initialValues.forEach((val) => {
        if (choices.some((c) => c.value === val)) return;
        const c = { value: val, label: val };
        choices.push(c);
        addChoiceItem(c, { custom: true, before: createOpt });
      });

      applyFilter();
    }

    // Open/close behavior.
    const openDropdown = () => {
      document.querySelectorAll(".df-multiselect--open").forEach((ms) => {
        if (ms !== wrap) {
          ms.classList.remove("df-multiselect--open");
          ms.querySelector(".df-multiselect__trigger")?.setAttribute(
            "aria-expanded",
            "false",
          );
        }
      });
      document.querySelectorAll(".df-customselect--open").forEach((s) => {
        s.classList.remove("df-customselect--open");
        s.querySelector(".df-customselect__trigger")?.setAttribute(
          "aria-expanded",
          "false",
        );
      });

      wrap.classList.add("df-multiselect--open");
      trigger.setAttribute("aria-expanded", "true");
      searchInput?.focus();
    };

    const closeDropdown = () => {
      wrap.classList.remove("df-multiselect--open");
      trigger.setAttribute("aria-expanded", "false");
      // Reopen on a clean list rather than the previous query.
      if (searchInput) {
        searchInput.value = "";
        applyFilter();
      }
    };

    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      wrap.classList.contains("df-multiselect--open")
        ? closeDropdown()
        : openDropdown();
    });

    trigger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        wrap.classList.contains("df-multiselect--open")
          ? closeDropdown()
          : openDropdown();
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

  /**
   * Builds an expanded choice list (radio/checkbox).
   *
   * With freeValue the list gets a search field on top: what is typed filters
   * the options and, when nothing matches, can be added to the list as a new
   * checked option — the same interaction the custom dropdowns use.
   *
   * @param {object} p
   * @param {string}  p.code
   * @param {Array<{value: string, label: string}>} p.choices
   * @param {boolean} p.multi
   * @param {boolean} p.required
   * @param {string[]} p.initialValues
   * @param {boolean} [p.freeValue]
   * @param {string}  [p.searchPlaceholder]
   * @param {string}  [p.createLabel]
   * @param {string}  [p.emptyLabel]
   */
  static _buildExpandedChoices({
    code,
    choices,
    multi,
    required,
    initialValues,
    freeValue,
    searchPlaceholder,
    createLabel,
    emptyLabel,
  }) {
    const { _el } = DynamicForm;
    const list = _el("div", "df-choice-list");

    /** Creates one option, optionally inserted before a given node */
    const addItem = (
      c,
      { custom = false, before = null, checked = false } = {},
    ) => {
      const itemLbl = _el("label", "df-choice-label");
      if (custom) itemLbl.dataset.custom = "true";

      const inp = document.createElement("input");
      inp.className = "df-choice-input";
      inp.type = multi ? "checkbox" : "radio";
      inp.name = multi ? code + "[]" : code;
      inp.value = c.value;
      inp.checked = checked || initialValues.includes(c.value);

      const customDot = _el("span", "df-choice-custom");
      const span = document.createElement("span");
      span.textContent = c.label;

      itemLbl.appendChild(inp);
      itemLbl.appendChild(customDot);
      itemLbl.appendChild(span);
      if (before) list.insertBefore(itemLbl, before);
      else list.appendChild(itemLbl);
      return itemLbl;
    };

    choices.forEach((c) => addItem(c));

    if (!freeValue) {
      // The group is required as a whole, so marking the first input is enough.
      if (required)
        list.querySelector(".df-choice-input")?.setAttribute("required", "");
      return list;
    }

    const search = _el("div", "df-select-search df-select-search--inline");
    const searchInput = _el("input", "df-select-search__input", {
      type: "text",
      placeholder: searchPlaceholder,
      "aria-label": searchPlaceholder,
      autocomplete: "off",
    });
    search.appendChild(searchInput);
    list.insertBefore(search, list.firstChild);

    const createOpt = _el("div", "df-choice-create");
    createOpt.setAttribute("role", "option");
    const emptyEl = _el("div", "df-select-empty");
    emptyEl.textContent = emptyLabel;
    list.appendChild(createOpt);
    list.appendChild(emptyEl);

    const items = () => list.querySelectorAll(".df-choice-label");

    /** Adds the typed text to the list as a checked option */
    const commitCreate = () => {
      const raw = searchInput.value.trim();
      if (!raw) return;

      const existing = list.querySelector(`input[value="${CSS.escape(raw)}"]`);
      if (existing) {
        if (!existing.checked) {
          existing.checked = true;
          existing.dispatchEvent(new Event("change", { bubbles: true }));
        }
      } else {
        // A radio group holds one value, so only one typed option is kept.
        if (!multi)
          list
            .querySelectorAll('.df-choice-label[data-custom="true"]')
            .forEach((o) => o.remove());

        choices.push({ value: raw, label: raw });
        const item = addItem(
          { value: raw, label: raw },
          { custom: true, before: createOpt, checked: true },
        );
        item
          .querySelector("input")
          .dispatchEvent(new Event("change", { bubbles: true }));
      }

      searchInput.value = "";
      applyFilter();
      searchInput.focus();
    };

    const applyFilter = () => {
      const raw = searchInput.value.trim();
      const q = raw.toLowerCase();

      let visible = 0;
      items().forEach((item) => {
        const match = !q || item.textContent.toLowerCase().includes(q);
        item.style.display = match ? "" : "none";
        if (match) visible++;
      });

      const exact = [...items()].some(
        (item) => item.querySelector("input").value.toLowerCase() === q,
      );
      const showCreate = !!raw && !exact;
      createOpt.textContent = showCreate ? `${createLabel} “${raw}”` : "";
      createOpt.style.display = showCreate ? "" : "none";
      emptyEl.style.display = visible === 0 && !showCreate ? "" : "none";
    };

    createOpt.addEventListener("click", commitCreate);
    searchInput.addEventListener("input", applyFilter);
    searchInput.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      // Enter picks the first match, or adds the typed value when none match.
      const first = [...items()].find((i) => i.style.display !== "none");
      if (first) first.querySelector("input").click();
      else commitCreate();
    });

    // Preset values outside the option list are kept as typed options.
    initialValues
      .filter((v) => !choices.some((c) => c.value === v))
      .forEach((v) => {
        choices.push({ value: v, label: v });
        addItem(
          { value: v, label: v },
          { custom: true, before: createOpt, checked: true },
        );
      });

    // The search field must not be the element carrying `required`.
    if (required)
      list.querySelector(".df-choice-input")?.setAttribute("required", "");
    applyFilter();

    return list;
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Address field
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * True for attributes referencing the Address entity. Those get a dedicated
   * control (search + Google suggestions + map) instead of the generic entity
   * select, which would need a preloaded option list to be of any use.
   */
  static _isAddressClass(className) {
    return /(^|\.)Address$/.test(String(className || ""));
  }

  /** Sentinel kept in the hidden input while a picked address has no id yet. */
  static ADDRESS_DRAFT_VALUE = "__df_new_address__";

  /**
   * Loads the Google Maps JS API once per page. Resolves with google.maps.
   * Without a key the address field still works — it just falls back to the
   * saved-address list plus manual entry, with no suggestions and no map.
   */
  static _loadGoogleMaps(apiKey, lang) {
    if (window.google?.maps?.places) return Promise.resolve(window.google.maps);
    if (DynamicForm._mapsPromise) return DynamicForm._mapsPromise;
    if (!apiKey)
      return Promise.reject(new Error("Google Maps API key is not configured"));

    DynamicForm._mapsPromise = new Promise((resolve, reject) => {
      const callback = "__dfGoogleMapsReady";
      window[callback] = () => resolve(window.google.maps);

      const script = document.createElement("script");
      const params = new URLSearchParams({
        key: apiKey,
        libraries: "places,marker",
        language: lang || "en",
        loading: "async",
        callback,
      });
      script.src = "https://maps.googleapis.com/maps/api/js?" + params;
      script.async = true;
      script.onerror = () =>
        reject(new Error("Failed to load the Google Maps script"));
      document.head.appendChild(script);
    });

    return DynamicForm._mapsPromise;
  }

  /**
   * Loads Leaflet once per page — the map used when there is no Google key.
   * Tiles come from OpenStreetMap by default; point cfg.tileUrl at your own
   * tile server (MapTiler, Protomaps, …) before shipping this to production,
   * the OSMF tile policy does not cover commercial traffic.
   */
  static _loadLeaflet() {
    if (window.L?.map) return Promise.resolve(window.L);
    if (DynamicForm._leafletPromise) return DynamicForm._leafletPromise;

    const BASE = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/";

    DynamicForm._leafletPromise = new Promise((resolve, reject) => {
      if (!document.querySelector(`link[href="${BASE}leaflet.css"]`)) {
        const css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = BASE + "leaflet.css";
        document.head.appendChild(css);
      }

      const script = document.createElement("script");
      script.src = BASE + "leaflet.js";
      script.async = true;
      script.onload = () => {
        // The default marker icon is referenced relatively, which breaks when
        // Leaflet is served from a CDN.
        window.L.Icon.Default.imagePath = BASE + "images/";
        resolve(window.L);
      };
      script.onerror = () => reject(new Error("Failed to load Leaflet"));
      document.head.appendChild(script);
    });

    return DynamicForm._leafletPromise;
  }

  /**
   * Address suggestions from Photon (OpenStreetMap). Needs no key and no
   * billing account, which makes it the default when no Google key is set.
   * Point cfg.photonUrl at your own instance for production traffic.
   *
   * @returns {Promise<Array<{ label: string, _feature: object }>>}
   */
  static async _suggestPhoton(query, { lang, regions, url } = {}) {
    const endpoint = new URL((url || "https://photon.komoot.io") + "/api/");
    endpoint.searchParams.set("q", query);
    endpoint.searchParams.set("limit", "7");
    // Photon only speaks a handful of languages; anything else is left to it.
    if (["de", "en", "fr", "it"].includes(lang)) {
      endpoint.searchParams.set("lang", lang);
    }

    const res = await fetch(endpoint, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error("Photon: HTTP " + res.status);

    const data = await res.json();
    const wanted = (regions || []).map((r) => String(r).toUpperCase());

    return (data.features || [])
      .filter(
        (f) =>
          !wanted.length ||
          wanted.includes(
            String(f.properties?.countrycode || "").toUpperCase(),
          ),
      )
      .map((feature) => ({
        label: DynamicForm._photonLabel(feature),
        _feature: feature,
      }))
      .filter((item) => item.label);
  }

  /** One-line label for a Photon feature. */
  static _photonLabel(feature) {
    const p = feature?.properties || {};
    const street = [p.housenumber, p.street || p.name]
      .filter(Boolean)
      .join(" ");

    return [
      street,
      p.city || p.town || p.village || p.county,
      [p.state, p.postcode].filter(Boolean).join(" "),
      p.country,
    ]
      .filter(Boolean)
      .join(", ");
  }

  /** Maps a Photon feature onto an address draft. */
  static _photonFeatureToDraft(feature) {
    const p = feature?.properties || {};
    const [longitude, latitude] = feature?.geometry?.coordinates || [];

    return {
      alias: DynamicForm._photonLabel(feature),
      address1: [p.housenumber, p.street || p.name].filter(Boolean).join(" "),
      address2: "",
      city: p.city || p.town || p.village || p.county || "",
      state: p.state || "",
      stateName: p.state || "",
      country: String(p.countrycode || "").toUpperCase(),
      countryName: p.country || "",
      postalCode: p.postcode || "",
      latitude,
      longitude,
      source: "photon",
    };
  }

  /** Reverse geocoding through Photon, used after the marker is dragged. */
  static async _reversePhoton(lat, lon, { lang, url } = {}) {
    const endpoint = new URL((url || "https://photon.komoot.io") + "/reverse");
    endpoint.searchParams.set("lat", String(lat));
    endpoint.searchParams.set("lon", String(lon));
    if (["de", "en", "fr", "it"].includes(lang)) {
      endpoint.searchParams.set("lang", lang);
    }

    const res = await fetch(endpoint, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error("Photon: HTTP " + res.status);

    const data = await res.json();
    const feature = (data.features || [])[0];
    return feature ? DynamicForm._photonFeatureToDraft(feature) : null;
  }

  /**
   * Address predictions for a query. Prefers the current Places API
   * (AutocompleteSuggestion) and falls back to the legacy AutocompleteService
   * so the widget keeps working on older keys.
   *
   * @returns {Promise<Array<{ placeId: string, label: string, _prediction?: object }>>}
   */
  static async _suggestPlaces(query, { token, regions, lang } = {}) {
    const places = window.google?.maps?.places;
    if (!places || !query) return [];

    if (places.AutocompleteSuggestion?.fetchAutocompleteSuggestions) {
      const request = { input: query, sessionToken: token, language: lang };
      if (regions?.length) request.includedRegionCodes = regions;

      const { suggestions } =
        await places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
          request,
        );

      return (suggestions || [])
        .map((s) => s.placePrediction)
        .filter(Boolean)
        .map((prediction) => ({
          placeId: prediction.placeId,
          label: String(prediction.text?.text ?? prediction.text ?? ""),
          _prediction: prediction,
        }));
    }

    // Legacy path.
    const service = new places.AutocompleteService();
    const request = { input: query, sessionToken: token, types: ["address"] };
    if (regions?.length) request.componentRestrictions = { country: regions };

    return new Promise((resolve) => {
      service.getPlacePredictions(request, (predictions, status) => {
        if (status !== places.PlacesServiceStatus.OK || !predictions)
          return resolve([]);
        resolve(
          predictions.map((p) => ({
            placeId: p.place_id,
            label: p.description,
          })),
        );
      });
    });
  }

  /**
   * Turns a picked suggestion into an address draft. Uses Place.fetchFields on
   * the new API and the geocoder (by place id) on the legacy one.
   */
  static async _placeToDraft(suggestion) {
    if (suggestion._prediction?.toPlace) {
      const place = suggestion._prediction.toPlace();
      await place.fetchFields({
        fields: ["addressComponents", "location", "formattedAddress"],
      });

      return DynamicForm._componentsToDraft(
        (place.addressComponents || []).map((c) => ({
          long: c.longText,
          short: c.shortText,
          types: c.types,
        })),
        {
          alias: place.formattedAddress,
          latitude: place.location?.lat?.(),
          longitude: place.location?.lng?.(),
          placeId: place.id || suggestion.placeId,
        },
      );
    }

    const geocoder = new window.google.maps.Geocoder();
    const { results } = await geocoder.geocode({ placeId: suggestion.placeId });
    return DynamicForm._geocodeResultToDraft(results?.[0], suggestion.placeId);
  }

  /** Maps a google.maps.GeocoderResult onto an address draft. */
  static _geocodeResultToDraft(result, placeId) {
    if (!result) return null;

    return DynamicForm._componentsToDraft(
      (result.address_components || []).map((c) => ({
        long: c.long_name,
        short: c.short_name,
        types: c.types,
      })),
      {
        alias: result.formatted_address,
        latitude: result.geometry?.location?.lat?.(),
        longitude: result.geometry?.location?.lng?.(),
        placeId: placeId || result.place_id,
      },
    );
  }

  /**
   * Normalizes Google address components into the shape the Address entity
   * expects. Country and state are kept as codes — the backend resolves them
   * to dictionary records, the widget has no access to those lists.
   */
  static _componentsToDraft(
    components,
    { alias, latitude, longitude, placeId } = {},
  ) {
    const pick = (type, form = "long") => {
      const found = components.find((c) => (c.types || []).includes(type));
      return found ? found[form] || "" : "";
    };

    const streetNumber = pick("street_number");
    const route = pick("route");

    return {
      alias: alias || "",
      address1:
        [streetNumber, route].filter(Boolean).join(" ") || pick("premise"),
      address2: pick("subpremise"),
      city:
        pick("locality") ||
        pick("postal_town") ||
        pick("sublocality") ||
        pick("administrative_area_level_2"),
      state: pick("administrative_area_level_1", "short"),
      stateName: pick("administrative_area_level_1"),
      country: pick("country", "short"),
      countryName: pick("country"),
      postalCode: pick("postal_code"),
      latitude,
      longitude,
      placeId,
      source: "google",
    };
  }

  /** Human-readable one-line address, used for triggers and summaries. */
  static _addressLabel(draft) {
    if (!draft) return "";
    if (draft.alias) return draft.alias;

    return [
      [draft.address1, draft.address2].filter(Boolean).join(", "),
      draft.city,
      [draft.state, draft.postalCode].filter(Boolean).join(" "),
      draft.countryName || draft.country,
    ]
      .filter(Boolean)
      .join(", ");
  }

  /** Label of a saved address coming from the schema or cfg.loadAddresses. */
  static _savedAddressLabel(item) {
    return (
      item.alias ||
      item.label ||
      DynamicForm._addressLabel({
        address1: item.address1,
        address2: item.address2,
        city: item.city,
        state: item.state?.code ?? item.state,
        postalCode: item.postalCode,
        country: item.country?.code2 ?? item.country,
      }) ||
      String(item.id ?? item.value ?? "")
    );
  }

  /**
   * Builds the address control: a searchable list of saved addresses, Google
   * suggestions for anything else, a manual entry panel, and a map with a
   * draggable marker.
   *
   * What the hidden input carries depends on the mode:
   *   "entity" — the id of a saved address, or ADDRESS_DRAFT_VALUE while the
   *              picked address still has to be created; _resolveAddressFields
   *              swaps in the real id on submit;
   *   "string" — the formatted address, submitted as typed text.
   *
   * @param {{ mode?: "entity"|"string" }} options
   * @returns {HTMLElement} .df-address with a _getDraft() method
   */
  _buildAddressControl(
    attr,
    { id, required, placeholder, initialValue, mode = "entity", multi = false },
  ) {
    const { _el, _arrowSVG, _addressLabel, _savedAddressLabel } = DynamicForm;
    const cfg = this.cfg;
    // In string mode nothing is created: the value is the address itself.
    const isEntityMode = mode === "entity";

    const labels = {
      saved: cfg.addressSavedLabel || "Saved addresses",
      suggestions: cfg.addressSuggestionsLabel || "Suggestions",
      manual: cfg.addressManualLabel || "Enter the address manually",
      search: cfg.addressSearchPlaceholder || "Start typing an address…",
      empty: cfg.addressEmptyLabel || "Nothing found",
      hint: cfg.addressMapHint || "Drag a marker to correct its location",
      pick: cfg.addressMapPickHint || "Or click the map to pick the location",
      isNew: cfg.addressNewBadge || "New address",
      unavailable:
        cfg.addressUnavailableLabel ||
        "Address suggestions are unavailable — enter the address manually",
      showMap: cfg.addressShowMapLabel || "Show on map",
      hideMap: cfg.addressHideMapLabel || "Hide map",
      importOpen: cfg.addressImportLabel || "Paste a list of addresses",
      importHint:
        cfg.addressImportHint ||
        "One address per line. Each one is looked up and added to the list.",
      importApply: cfg.addressImportApplyLabel || "Import",
      importBusy: cfg.addressImportBusyLabel || "Importing",
      importFailed: cfg.addressImportFailedLabel || "Not found",
      ...(cfg.addressLabels || {}),
    };

    const root = _el("div", "df-address");
    root.dataset.code = attr.code;
    root.dataset.mode = mode;
    if (multi) root.classList.add("df-address--multi");

    // Hidden inputs carry the value. A single field keeps one input so the
    // shared required-check always has something to look at; a multi field
    // gets one input per address, named the way FormData expects a list.
    const hiddenBox = _el("div", "df-address__hidden");

    // ── Select ────────────────────────────────────────────────────────────
    // Built on the custom-select skin, and data-code plus the hidden inputs
    // living inside it are what the shared validation and the uiBehavior
    // runtime look for.
    const select = _el("div", "df-customselect df-address__select");
    select.dataset.code = attr.code;
    select.appendChild(hiddenBox);

    const trigger = _el("div", "df-customselect__trigger", {
      tabindex: "0",
      role: "combobox",
      "aria-haspopup": "listbox",
      "aria-expanded": "false",
      "aria-controls": id + "-dropdown",
    });
    const arrow = _el("span", "df-customselect__arrow", { html: _arrowSVG() });
    const triggerText = _el(
      "span",
      "df-customselect__text df-customselect__placeholder",
    );
    triggerText.textContent = placeholder || labels.search;
    // A multi field shows the picked addresses as removable tags instead of
    // one line of text.
    const tagsBox = _el("div", "df-multiselect__tags");
    trigger.appendChild(arrow);
    trigger.appendChild(multi ? tagsBox : triggerText);
    if (multi) tagsBox.appendChild(triggerText);

    const dropdown = _el("div", "df-customselect__dropdown", {
      role: "listbox",
      id: id + "-dropdown",
    });

    const search = _el("div", "df-select-search");
    const searchInput = _el("input", "df-select-search__input", {
      type: "text",
      placeholder: labels.search,
      "aria-label": labels.search,
      autocomplete: "off",
    });
    search.appendChild(searchInput);
    dropdown.appendChild(search);

    const savedTitle = _el("div", "df-address__group");
    savedTitle.textContent = labels.saved;
    const savedList = _el("div", "df-address__list");
    const suggestTitle = _el("div", "df-address__group");
    suggestTitle.textContent = labels.suggestions;
    const suggestList = _el("div", "df-address__list");
    const emptyEl = _el("div", "df-select-empty");
    emptyEl.textContent = labels.empty;
    // Shown instead of "nothing found" when the provider itself is out of
    // reach — otherwise an unusable key looks exactly like an unknown address.
    const noteEl = _el("div", "df-address__note");
    noteEl.textContent = labels.unavailable;
    const manualToggle = _el("div", "df-address__manual-toggle");
    manualToggle.textContent = labels.manual;
    // Bulk import only makes sense where more than one address fits.
    const importToggle = _el("div", "df-address__manual-toggle");
    importToggle.textContent = labels.importOpen;

    dropdown.appendChild(savedTitle);
    dropdown.appendChild(savedList);
    dropdown.appendChild(suggestTitle);
    dropdown.appendChild(suggestList);
    dropdown.appendChild(emptyEl);
    dropdown.appendChild(noteEl);
    dropdown.appendChild(manualToggle);
    if (multi) dropdown.appendChild(importToggle);

    select.appendChild(trigger);
    select.appendChild(dropdown);
    root.appendChild(select);

    // ── Map, hidden until asked for ───────────────────────────────────────
    const mapToggle = _el("button", "df-address__map-toggle", {
      type: "button",
    });
    mapToggle.textContent = labels.showMap;
    if (cfg.addressMap !== false) root.appendChild(mapToggle);

    const panel = _el("div", "df-address__panel");
    const mapEl = _el("div", "df-address__map");
    const hint = _el("p", "df-address__hint");
    hint.textContent = labels.pick;
    panel.appendChild(mapEl);
    panel.appendChild(hint);
    root.appendChild(panel);

    // ── Manual entry ──────────────────────────────────────────────────────
    const manualFields = [
      {
        key: "address1",
        label: cfg.addressLine1Label || "Street address",
        required: true,
      },
      { key: "address2", label: cfg.addressLine2Label || "Apt, suite, unit" },
      { key: "city", label: cfg.addressCityLabel || "City", required: true },
      { key: "state", label: cfg.addressStateLabel || "State / province" },
      {
        key: "postalCode",
        label: cfg.addressPostalLabel || "Postal code",
        required: true,
      },
      {
        key: "country",
        label: cfg.addressCountryLabel || "Country code",
        required: true,
      },
    ];
    const manual = _el("div", "df-address__manual");
    const manualInputs = {};
    manualFields.forEach((f) => {
      const row = _el("div", "df-address__manual-row");
      const fieldLabel = _el("label", "df-address__manual-label");
      fieldLabel.textContent = f.label + (f.required ? " *" : "");
      fieldLabel.setAttribute("for", `${id}-${f.key}`);
      const input = _el("input", "df-input df-address__manual-input", {
        type: "text",
        id: `${id}-${f.key}`,
        autocomplete: "off",
      });
      manualInputs[f.key] = input;
      row.appendChild(fieldLabel);
      row.appendChild(input);
      manual.appendChild(row);
    });
    const manualApply = _el(
      "button",
      "df-btn df-btn--ghost df-address__manual-apply",
      { type: "button" },
    );
    manualApply.textContent = cfg.addressManualApplyLabel || "Use this address";
    manual.appendChild(manualApply);
    root.appendChild(manual);

    // ── Bulk import ───────────────────────────────────────────────────────
    const importBox = _el("div", "df-address__import");
    const importHint = _el("p", "df-address__import-hint");
    importHint.textContent = labels.importHint;
    const importArea = _el("textarea", "df-input df-textarea", {
      rows: "6",
      placeholder: labels.importOpen,
      "aria-label": labels.importOpen,
    });
    const importApply = _el(
      "button",
      "df-btn df-btn--ghost df-address__import-apply",
      { type: "button" },
    );
    importApply.textContent = labels.importApply;
    const importStatus = _el("p", "df-address__import-status");
    importBox.appendChild(importHint);
    importBox.appendChild(importArea);
    importBox.appendChild(importApply);
    importBox.appendChild(importStatus);
    if (multi) root.appendChild(importBox);

    // ── State ─────────────────────────────────────────────────────────────
    /** Picked addresses. A single field never holds more than one. */
    let drafts = [];
    // Both modes offer the same saved addresses; they differ only in what ends
    // up in the value.
    let savedAddresses = (Array.isArray(attr.options) ? attr.options : []).map(
      (o) => ({
        ...o,
        id: o.id ?? o.value,
        label: _savedAddressLabel(o),
      }),
    );
    let suggestions = [];
    let suggestionsUnavailable = false;
    let mapsReady = false;
    let mapOpen = cfg.addressMapOpen === true;
    let map = null;
    let markers = [];
    let sessionToken = null;
    let searchSeq = 0;
    let searchTimer = null;

    const regions = cfg.addressRegions || cfg.addressCountries || null;

    // Google needs a key and a billing account; Photon and OpenStreetMap need
    // neither. So a configured key opts into Google, and its absence falls back
    // to the free stack instead of leaving the field half-working.
    const provider =
      cfg.addressProvider || (cfg.mapApiKey ? "google" : "photon");
    const isGoogle = provider === "google";
    const mapProvider = cfg.addressMapProvider || (isGoogle ? "google" : "osm");
    const photon = { lang: cfg.lang, regions, url: cfg.photonUrl };

    // Close-up once an address is picked, wider while the map is only there to
    // pick from. A zoom the visitor set by hand wins over both.
    const pickedZoom = cfg.addressMapZoom || 16;
    const overviewZoom = cfg.addressMapOverviewZoom || 11;
    let userZoom = null;
    let programmaticZoom = false;

    const openDropdown = () => {
      select.classList.add("df-customselect--open");
      trigger.setAttribute("aria-expanded", "true");
      searchInput.focus();
    };
    const closeDropdown = () => {
      select.classList.remove("df-customselect--open");
      trigger.setAttribute("aria-expanded", "false");
    };

    const sameAddress = (a, b) =>
      _addressLabel(a).toLowerCase() === _addressLabel(b).toLowerCase();

    // ── Value ─────────────────────────────────────────────────────────────

    /** Rebuilds the hidden inputs from the current drafts. */
    const syncHidden = () => {
      hiddenBox.innerHTML = "";

      if (!multi) {
        const input = _el("input", "", { type: "hidden", name: attr.code });
        if (required) input.setAttribute("required", "");
        const draft = drafts[0];
        // String mode submits the address as text. Entity mode submits the id
        // of a saved record, or a sentinel until _resolveAddressFields
        // creates one.
        input.value = !draft
          ? ""
          : !isEntityMode
            ? _addressLabel(draft)
            : draft.id
              ? String(draft.id)
              : DynamicForm.ADDRESS_DRAFT_VALUE;
        hiddenBox.appendChild(input);
        return;
      }

      drafts.forEach((draft, index) => {
        const input = _el("input", "", {
          type: "hidden",
          name: attr.code + "[]",
        });
        input.dataset.index = String(index);
        input.value = !isEntityMode
          ? _addressLabel(draft)
          : draft.id
            ? String(draft.id)
            : DynamicForm.ADDRESS_DRAFT_VALUE;
        hiddenBox.appendChild(input);
      });
    };

    /** Redraws the trigger: tags for a multi field, one line for a single. */
    const syncTrigger = () => {
      if (!multi) {
        const label = drafts[0] ? _addressLabel(drafts[0]) : "";
        triggerText.textContent = label || placeholder || labels.search;
        triggerText.classList.toggle("df-customselect__value", !!label);
        triggerText.classList.toggle("df-customselect__placeholder", !label);
        return;
      }

      tagsBox.innerHTML = "";

      if (drafts.length === 0) {
        triggerText.textContent = placeholder || labels.search;
        triggerText.classList.add("df-customselect__placeholder");
        triggerText.classList.remove("df-customselect__value");
        tagsBox.appendChild(triggerText);
        return;
      }

      drafts.forEach((draft, index) => {
        const tag = _el("span", "df-multiselect__tag");
        const text = _el("span");
        text.textContent = _addressLabel(draft);
        tag.appendChild(text);

        const remove = _el("span", "df-multiselect__tag-remove", {
          role: "button",
          "aria-label": "Remove",
        });
        remove.textContent = "×";
        remove.addEventListener("click", (e) => {
          e.stopPropagation();
          drafts = drafts.filter((_, i) => i !== index);
          syncSelection();
        });

        tag.appendChild(remove);
        tagsBox.appendChild(tag);
      });
    };

    /** Reflects the current drafts in the trigger, hidden inputs and map. */
    const syncSelection = ({ emitChange = true } = {}) => {
      syncHidden();
      syncTrigger();

      root.classList.toggle("df-address--selected", drafts.length > 0);
      hint.textContent = drafts.length > 0 ? labels.hint : labels.pick;
      renderMap();

      if (emitChange)
        root.dispatchEvent(new Event("change", { bubbles: true }));
    };

    /** Adds an address, replacing the current one when the field is single. */
    const addDraft = (draft) => {
      if (!draft) return;

      if (!multi) {
        drafts = [draft];
      } else if (!drafts.some((existing) => sameAddress(existing, draft))) {
        drafts = [...drafts, draft];
      }

      syncSelection();
    };

    // ── Map ───────────────────────────────────────────────────────────────

    const ensureMaps = async () => {
      if (mapsReady) return;
      await DynamicForm._loadGoogleMaps(cfg.mapApiKey, cfg.lang);
      mapsReady = true;
      const places = window.google.maps.places;
      if (places?.AutocompleteSessionToken) {
        sessionToken = new places.AutocompleteSessionToken();
      }
    };

    /** Where the map opens before anything has coordinates. */
    const fallbackCenter = () => {
      const withGeo = savedAddresses.find(
        (a) => a.geoLocation?.latitude != null,
      );
      if (cfg.addressMapCenter) {
        const c = cfg.addressMapCenter;
        return { lat: c.lat ?? c.latitude, lng: c.lng ?? c.longitude };
      }
      if (withGeo) {
        return {
          lat: withGeo.geoLocation.latitude,
          lng: withGeo.geoLocation.longitude,
        };
      }
      return null;
    };

    const positioned = () =>
      drafts
        .map((draft, index) => ({ draft, index }))
        .filter(
          ({ draft }) => draft.latitude != null && draft.longitude != null,
        );

    /**
     * A point picked straight off the map. Coordinates are what the visitor
     * meant, so they are kept and only the text is refreshed by the geocoder.
     */
    const pickOnMap = async (lat, lng, index) => {
      const target =
        index != null ? index : drafts.length ? drafts.length - 1 : null;

      if (target == null) {
        // Nothing picked yet: the click itself becomes the address.
        const resolved = await reverseGeocode(lat, lng);
        addDraft({
          ...(resolved || {}),
          latitude: lat,
          longitude: lng,
          source: "manual",
        });
        return;
      }

      drafts = drafts.map((draft, i) =>
        i === target
          ? { ...draft, latitude: lat, longitude: lng, source: "manual" }
          : draft,
      );
      syncSelection();

      const resolved = await reverseGeocode(lat, lng);
      if (!resolved) return;

      drafts = drafts.map((draft, i) =>
        i === target
          ? {
              ...resolved,
              latitude: lat,
              longitude: lng,
              // The moved point is no longer the record the value pointed at.
              id: undefined,
              source: "manual",
            }
          : draft,
      );
      syncSelection();
    };

    /** Refreshes the address parts after a marker has been moved. */
    const reverseGeocode = async (lat, lng) => {
      try {
        if (isGoogle) {
          await ensureMaps();
          const geocoder = new window.google.maps.Geocoder();
          const { results } = await geocoder.geocode({
            location: { lat, lng },
          });
          return DynamicForm._geocodeResultToDraft(results?.[0]);
        }
        return await DynamicForm._reversePhoton(lat, lng, photon);
      } catch (err) {
        console.warn("[DynamicForm] reverse geocoding failed", err);
        return null;
      }
    };

    /** Draws the map and its markers, whichever provider is in use. */
    const renderMap = async () => {
      if (cfg.addressMap === false) return;

      root.classList.toggle("df-address--map", mapOpen);
      mapToggle.textContent = mapOpen ? labels.hideMap : labels.showMap;
      if (!mapOpen) return;

      const points = positioned();
      const center = points[0]
        ? { lat: points[0].draft.latitude, lng: points[0].draft.longitude }
        : fallbackCenter();
      if (!center) return;

      const zoom = userZoom ?? (points.length ? pickedZoom : overviewZoom);

      try {
        if (mapProvider === "osm") await renderLeafletMap(center, zoom, points);
        else await renderGoogleMap(center, zoom, points);
      } catch (err) {
        console.warn("[DynamicForm] map unavailable", err.message);
      }
    };

    const renderGoogleMap = async (center, zoom, points) => {
      await ensureMaps();
      const maps = window.google.maps;

      if (!map) {
        map = new maps.Map(mapEl, {
          center,
          zoom,
          mapId: cfg.mapId || undefined,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          // Cooperative already means pinch-to-zoom and ⌘/Ctrl + wheel, while
          // a plain scroll moves the page.
          gestureHandling: cfg.addressMapScrollZoom ? "greedy" : "cooperative",
        });
        map.addListener("click", (e) => {
          if (e.latLng) pickOnMap(e.latLng.lat(), e.latLng.lng());
        });
        map.addListener("zoom_changed", () => {
          if (!programmaticZoom) userZoom = map.getZoom();
        });
      } else {
        programmaticZoom = true;
        map.setCenter(center);
        map.setZoom(zoom);
        programmaticZoom = false;
      }

      markers.forEach((marker) => marker.setMap?.(null));
      markers = points.map(({ draft, index }) => {
        const position = { lat: draft.latitude, lng: draft.longitude };
        const marker = new maps.Marker({ map, position, draggable: true });
        marker.addListener("dragend", (e) => {
          if (e.latLng) pickOnMap(e.latLng.lat(), e.latLng.lng(), index);
        });
        return marker;
      });
    };

    const renderLeafletMap = async (center, zoom, points) => {
      const L = await DynamicForm._loadLeaflet();

      if (!map) {
        map = L.map(mapEl, {
          // Plain wheel zoom is off so the page keeps scrolling past the map;
          // the trackpad gesture below zooms instead.
          scrollWheelZoom: !!cfg.addressMapScrollZoom,
          zoomSnap: 0.25,
          zoomDelta: 0.5,
        }).setView([center.lat, center.lng], zoom);

        L.tileLayer(
          cfg.tileUrl || "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
          {
            maxZoom: 19,
            attribution:
              cfg.tileAttribution ||
              '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          },
        ).addTo(map);

        map.on("click", (e) => pickOnMap(e.latlng.lat, e.latlng.lng));
        map.on("zoomend", () => {
          if (!programmaticZoom) userZoom = map.getZoom();
        });

        // A trackpad pinch reaches the browser as a wheel event with ctrlKey
        // set, so pinching zooms the map while two-finger scrolling still
        // scrolls the form. ⌘/Ctrl + wheel works the same way with a mouse.
        mapEl.addEventListener(
          "wheel",
          (e) => {
            if (!e.ctrlKey && !e.metaKey && !cfg.addressMapScrollZoom) return;
            e.preventDefault();
            const step = Math.max(-1.5, Math.min(1.5, -e.deltaY / 100));
            map.setZoomAround(
              map.mouseEventToContainerPoint(e),
              map.getZoom() + step,
            );
          },
          { passive: false },
        );
      } else {
        programmaticZoom = true;
        map.setView([center.lat, center.lng], zoom);
        programmaticZoom = false;
      }

      markers.forEach((marker) => map.removeLayer(marker));
      markers = points.map(({ draft, index }) => {
        const marker = L.marker([draft.latitude, draft.longitude], {
          draggable: true,
        }).addTo(map);
        marker.on("dragend", () => {
          const { lat, lng } = marker.getLatLng();
          pickOnMap(lat, lng, index);
        });
        return marker;
      });

      // The container is measured while the panel is still being shown, so the
      // first paint can end up with the wrong size.
      setTimeout(() => map.invalidateSize(), 50);
    };

    // ── Options ───────────────────────────────────────────────────────────

    const draftFromSaved = (item) => ({
      // A record id only means something where the value is one.
      id: isEntityMode ? item.id : undefined,
      alias: item.label,
      address1: item.address1,
      address2: item.address2,
      city: item.city,
      state: item.state?.code ?? item.state,
      postalCode: item.postalCode,
      country: item.country?.code2 ?? item.country,
      latitude: item.geoLocation?.latitude,
      longitude: item.geoLocation?.longitude,
      source: "saved",
    });

    /** Turns a suggestion into a full address. */
    const resolveSuggestion = async (item) =>
      isGoogle
        ? await DynamicForm._placeToDraft(item)
        : DynamicForm._photonFeatureToDraft(item._feature);

    /** Renders both option groups for the current query. */
    const renderOptions = () => {
      const query = searchInput.value.trim().toLowerCase();

      savedList.innerHTML = "";
      const matches = savedAddresses.filter(
        (a) => !query || String(a.label).toLowerCase().includes(query),
      );
      matches.forEach((item) => {
        const opt = _el("div", "df-customselect__option df-address__option");
        opt.setAttribute("role", "option");
        opt.dataset.value = String(item.id);
        opt.textContent = item.label;
        opt.addEventListener("click", (e) => {
          e.stopPropagation();
          addDraft(draftFromSaved(item));
          if (!multi) closeDropdown();
        });
        savedList.appendChild(opt);
      });

      suggestList.innerHTML = "";
      suggestions.forEach((item) => {
        const opt = _el("div", "df-customselect__option df-address__option");
        opt.setAttribute("role", "option");
        opt.dataset.placeId = item.placeId;
        opt.innerHTML = `<span class="df-address__option-pin">📍</span><span>${item.label}</span>`;
        opt.addEventListener("click", async (e) => {
          e.stopPropagation();
          opt.classList.add("df-address__option--loading");
          try {
            const next = await resolveSuggestion(item);
            if (next) {
              // A picked suggestion ends the billing session; the next search
              // starts a fresh one.
              sessionToken = window.google?.maps?.places
                ?.AutocompleteSessionToken
                ? new window.google.maps.places.AutocompleteSessionToken()
                : null;
              addDraft(next);
              if (!multi) closeDropdown();
            }
          } catch (err) {
            console.error(
              "[DynamicForm] failed to resolve the picked place",
              err,
            );
          } finally {
            opt.classList.remove("df-address__option--loading");
          }
        });
        suggestList.appendChild(opt);
      });

      savedTitle.hidden = matches.length === 0;
      suggestTitle.hidden = suggestions.length === 0;
      noteEl.hidden = !suggestionsUnavailable;
      emptyEl.hidden =
        suggestionsUnavailable || matches.length > 0 || suggestions.length > 0;
    };

    /** Looks a query up with whichever provider is configured. */
    const lookup = async (query) => {
      if (!isGoogle) return DynamicForm._suggestPhoton(query, photon);

      await ensureMaps();
      return DynamicForm._suggestPlaces(query, {
        token: sessionToken,
        regions,
        lang: cfg.lang,
      });
    };

    /** Debounced lookup for the search field. */
    const runSearch = () => {
      const query = searchInput.value.trim();
      clearTimeout(searchTimer);

      if (query.length < (cfg.addressMinQuery ?? 3)) {
        suggestions = [];
        renderOptions();
        return;
      }

      searchTimer = setTimeout(async () => {
        const seq = ++searchSeq;
        try {
          const found = await lookup(query);
          if (seq !== searchSeq) return;
          suggestions = found;
          suggestionsUnavailable = false;
        } catch (err) {
          suggestions = [];
          suggestionsUnavailable = true;
          console.warn(
            "[DynamicForm] address suggestions unavailable",
            err.message,
          );
        }
        renderOptions();
      }, cfg.addressDebounce ?? 300);
    };

    // ── Events ────────────────────────────────────────────────────────────
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      if (select.classList.contains("df-customselect--open")) closeDropdown();
      else openDropdown();
    });
    trigger.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openDropdown();
      }
    });
    dropdown.addEventListener("click", (e) => e.stopPropagation());
    searchInput.addEventListener("input", runSearch);
    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeDropdown();
    });

    mapToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      mapOpen = !mapOpen;
      renderMap();
    });

    manualToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      root.classList.add("df-address--manual");
      root.classList.remove("df-address--import");
      closeDropdown();
      // Prefill from whatever was typed in the search box.
      if (searchInput.value.trim() && !manualInputs.address1.value) {
        manualInputs.address1.value = searchInput.value.trim();
      }
      manualInputs.address1.focus();
    });

    importToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      root.classList.add("df-address--import");
      root.classList.remove("df-address--manual");
      closeDropdown();
      importArea.focus();
    });

    manualApply.addEventListener("click", async () => {
      const values = Object.fromEntries(
        Object.entries(manualInputs).map(([key, input]) => [
          key,
          input.value.trim(),
        ]),
      );

      const missing = manualFields
        .filter((f) => f.required && !values[f.key])
        .map((f) => f.key);
      manualFields.forEach((f) => {
        manualInputs[f.key].classList.toggle(
          "df-input--error",
          missing.includes(f.key),
        );
      });
      if (missing.length) return;

      const draft = { ...values, source: "manual" };
      draft.alias = _addressLabel(draft);

      // Geocode the typed address so it still lands on the map.
      const located = await geocodeText(draft.alias);
      if (located) {
        draft.latitude = located.latitude;
        draft.longitude = located.longitude;
      }

      root.classList.remove("df-address--manual");
      Object.values(manualInputs).forEach((input) => (input.value = ""));
      addDraft(draft);
    });

    /** Address text → the provider's best match, or null. */
    const geocodeText = async (text) => {
      if (!text) return null;

      try {
        const [best] = await lookup(text);
        if (!best) return null;
        return await resolveSuggestion(best);
      } catch {
        // No key, no network or no match — the address is still usable, just
        // without coordinates.
        return null;
      }
    };

    importApply.addEventListener("click", async () => {
      const lines = importArea.value
        .split(/[\n\r]+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, cfg.addressImportMax ?? 50);

      if (lines.length === 0) return;

      importApply.disabled = true;
      const failed = [];

      try {
        for (let i = 0; i < lines.length; i++) {
          importStatus.textContent = `${labels.importBusy} ${i + 1} / ${lines.length}`;

          const found = await geocodeText(lines[i]);
          // A line the provider cannot place is still kept — the visitor typed
          // it on purpose — it just goes in without coordinates.
          addDraft(
            found || { alias: lines[i], address1: lines[i], source: "manual" },
          );
          if (!found) failed.push(lines[i]);
        }
      } finally {
        importApply.disabled = false;
      }

      importArea.value = failed.join("\n");
      importStatus.textContent = failed.length
        ? `${labels.importFailed}: ${failed.length} / ${lines.length}`
        : "";
      if (!failed.length) root.classList.remove("df-address--import");
    });

    // ── Initial value ─────────────────────────────────────────────────────
    const initialValues = DynamicForm._valueList(initialValue);
    initialValues.slice(0, multi ? undefined : 1).forEach((value) => {
      if (!isEntityMode) {
        // The preset is the address text itself.
        drafts.push({ alias: value, source: "preset" });
        return;
      }

      const found = savedAddresses.find((a) => String(a.id) === String(value));
      if (found) drafts.push(draftFromSaved(found));
    });

    renderOptions();
    syncSelection({ emitChange: false });

    // Saved addresses can also be supplied asynchronously by the host page.
    if (typeof cfg.loadAddresses === "function") {
      Promise.resolve(cfg.loadAddresses(attr))
        .then((items) => {
          if (!Array.isArray(items)) return;
          savedAddresses = items.map((o) => ({
            ...o,
            id: o.id ?? o.value,
            label: _savedAddressLabel(o),
          }));
          renderOptions();
        })
        .catch((err) =>
          console.warn("[DynamicForm] loadAddresses failed", err),
        );
    }

    root._getDrafts = () => drafts;
    root._setDrafts = (next) => {
      drafts = Array.isArray(next) ? next : [];
      syncSelection();
    };

    // A native form reset clears the hidden inputs but knows nothing about the
    // control's own state, so it is cleared here too.
    root.addEventListener("df-reset", () => {
      drafts = [];
      searchInput.value = "";
      importArea.value = "";
      importStatus.textContent = "";
      suggestions = [];
      Object.values(manualInputs).forEach((input) => {
        input.value = "";
        input.classList.remove("df-input--error");
      });
      root.classList.remove("df-address--manual", "df-address--import");
      renderOptions();
      syncSelection({ emitChange: false });
    });

    return root;
  }

  /**
   * Creates the addresses picked in this form and writes the resulting ids
   * into the hidden inputs, so the submitted attribute value is an Address id
   * like any other entity reference.
   *
   * Records are only created on submit — an abandoned form leaves nothing
   * behind.
   */
  /** Clears the address controls of a form after a native reset. */
  static _resetAddressFields(form) {
    form
      .querySelectorAll(".df-address")
      .forEach((el) => el.dispatchEvent(new Event("df-reset")));
  }

  async _resolveAddressFields(form, { skipCodes } = {}) {
    // Only entity fields turn into records; a string field submits its text.
    const fields = [
      ...form.querySelectorAll('.df-address[data-mode="entity"]'),
    ].filter((el) => !skipCodes?.has(el.dataset.code));

    for (const el of fields) {
      const drafts = el._getDrafts?.() ?? [];
      // Only addresses that are not records yet cost a request.
      if (!drafts.some((draft) => draft && draft.id == null)) continue;

      const saved = [];
      for (const draft of drafts) {
        if (!draft) continue;
        if (draft.id != null) {
          saved.push(draft);
          continue;
        }

        const id = await this._createAddress(draft);
        if (id == null) throw new Error("Address could not be created");
        saved.push({ ...draft, id });
      }

      // Writing the drafts back rebuilds the hidden inputs with the real ids.
      el._setDrafts(saved);
    }
  }

  /**
   * Saves one address draft and returns its id.
   *
   * Override with cfg.createAddress(draft) when the host application has its
   * own endpoint, or with cfg.buildAddressPayload(draft) to keep the default
   * request but change its body. Country and state go out as codes — matching
   * them against the dictionaries is left to the backend, the widget cannot
   * read those lists anonymously.
   */
  async _createAddress(draft) {
    if (typeof this.cfg.createAddress === "function") {
      const id = await this.cfg.createAddress(draft);
      return typeof id === "object" ? (id?.id ?? id?.[0]) : id;
    }

    const payload =
      typeof this.cfg.buildAddressPayload === "function"
        ? this.cfg.buildAddressPayload(draft)
        : {
            alias: DynamicForm._addressLabel(draft),
            address1: draft.address1 || "",
            address2: draft.address2 || "",
            city: draft.city || "",
            postalCode: draft.postalCode || "",
            country: draft.country
              ? { code2: draft.country, name: draft.countryName }
              : undefined,
            state: draft.state
              ? { code: draft.state, name: draft.stateName }
              : undefined,
            geoLocation:
              draft.latitude != null && draft.longitude != null
                ? { latitude: draft.latitude, longitude: draft.longitude }
                : undefined,
            geoLocationStatus:
              draft.source === "google" ? "processed_google" : "manual",
            organization: this.cfg.organizationId
              ? { id: this.cfg.organizationId }
              : undefined,
          };

    const url =
      this.cfg.addressSaveUrl ||
      `${this.cfg.apiBaseUrl}/core/api/address/save.json`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("Address save failed: HTTP " + res.status);

    const data = await res.json();
    // save.json answers with the id, an [id] tuple or the saved record.
    if (typeof data === "number") return data;
    if (Array.isArray(data)) return data[0];
    return data?.id;
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
    const {
      _el,
      _parseTokens,
      _validateAndResolveTokens,
      _javaType,
      _getNls,
      _validateInput,
    } = DynamicForm;

    const rawTokens = _parseTokens(attr.inputFormat || "");
    const choices = this._normalizeChoices(attr);
    const hasChoices = choices.length > 0;
    const type = _javaType(attr.className);
    const { resolved: tok, warnings } = _validateAndResolveTokens(
      rawTokens,
      type,
      hasChoices,
    );

    if (warnings.length > 0) {
      console.warn(
        `[DynamicForm] Field '${attr.code || "unknown"}': inputFormat="${attr.inputFormat}"`,
        warnings,
      );
    }

    const id = "df-" + attr.code;
    // Address fields come in two flavours, both drawn by the same control:
    //   "entity" — the attribute references the Address entity, so the picked
    //              address is saved as a record and its id becomes the value;
    //   "string" — a plain String attribute carrying the 'address' inputFormat
    //              token, whose value is the formatted address itself.
    const addressMode =
      type === "entity" && DynamicForm._isAddressClass(attr.className)
        ? "entity"
        : type === "string" && tok.address
          ? "string"
          : null;
    const isAddress = !!addressMode;
    const label = _getNls(attr.nls, this.cfg.lang) || attr.code;
    const required = !!attr.required;
    const multi = !!attr.multiselect;
    const initialValue = this._getPresetValue(attr);
    const initialValues = DynamicForm._valueList(initialValue);
    // Free value lets the user type an answer of their own next to the offered
    // options. It only applies to native (java.*) types — entity attributes
    // must reference an existing record, so an arbitrary value is meaningless.
    const freeValue = !!attr.freeValue && type !== "entity";

    const langNls =
      attr.nls?.[this.cfg.lang] ||
      attr.nls?.en ||
      Object.values(attr.nls || {})[0] ||
      {};
    const description = (langNls["DESCRIPTION"] || "").trim();
    const descriptionRender = this.cfg.descriptionRender || "tooltip";
    // Rich-text fields often send empty markup ("<p></p>", "<p><br></p>") which
    // is a non-empty string but has no visible text. Only treat the description
    // as present when there is actual text content.
    const hasDescription =
      description
        .replace(/<[^>]*>/g, "")
        .replace(/&nbsp;/gi, " ")
        .trim().length > 0;

    // Placeholder resolution. Use an explicit PLACEHOLDER translation or the
    // inputFormat token first. Only fall back to the field label when the label
    // is not rendered separately — otherwise the label text gets duplicated
    // inside the control (e.g. "Full Name" shown both above and inside).
    const explicitPlaceholder =
      _getNls(attr.nls, this.cfg.lang, "PLACEHOLDER") || tok.placeholder || "";
    const labelShown = withLabel && type !== "boolean";
    const inputPlaceholder = explicitPlaceholder || (labelShown ? "" : label);
    // Dropdown triggers still need prompt text, so keep the label fallback there.
    const selectPlaceholder = explicitPlaceholder || label;

    // Wording of the free-value search, shared by all three choice controls.
    const freeSearchOpts = {
      searchPlaceholder:
        this.cfg.searchPlaceholder || "Search or type your own",
      createLabel: this.cfg.createValueLabel || "Use",
      emptyLabel: this.cfg.emptyLabel || "Nothing found",
    };

    // Root field element.
    const wrap = _el("div", "df-field");
    wrap.dataset.code = attr.code;
    wrap.dataset.type = isAddress ? "address" : type;
    if (addressMode) {
      wrap.dataset.addressMode = addressMode;
      // A multi address field always submits a list, even with one value.
      if (multi) wrap.dataset.addressMulti = "true";
    }

    // Optional label. Boolean controls render their label inside the control.
    if (labelShown) {
      const labelEl = _el("label", "df-label", { for: id });

      let descHtml = "";
      if (hasDescription && descriptionRender === "tooltip") {
        descHtml = `<span class="df-tooltip-wrap"><span class="df-tooltip-icon">i</span><span class="df-tooltip-body">${description}</span></span>`;
      }

      labelEl.innerHTML =
        label +
        (required ? ' <span class="df-required">*</span>' : "") +
        descHtml;
      wrap.appendChild(labelEl);
    }

    // Field description as a block. Placed above the control so it is read
    // before a (potentially long) list of options.
    if (type !== "boolean" && descriptionRender === "node" && hasDescription) {
      const descEl = _el("div", "df-description");
      descEl.innerHTML = description;
      wrap.appendChild(descEl);
    }
    // ── Control construction ──────────────────────────────────────────────

    let control;

    if (isAddress) {
      // Address: saved addresses + Google suggestions + map.
      control = this._buildAddressControl(attr, {
        id,
        required,
        placeholder: selectPlaceholder,
        initialValue,
        mode: addressMode,
        multi,
      });
    } else if (hasChoices) {
      // Choice-based field.
      if (tok.expanded) {
        // Expanded: radio/checkbox list.
        control = DynamicForm._buildExpandedChoices({
          code: attr.code,
          choices,
          multi,
          required,
          initialValues,
          freeValue,
          ...freeSearchOpts,
        });
      } else if (multi) {
        control = DynamicForm._buildMultiselect(
          attr.code,
          choices,
          selectPlaceholder,
          initialValue,
          {
            freeValue,
            ...freeSearchOpts,
          },
        );
      } else {
        control = DynamicForm._buildSingleSelect(
          attr.code,
          choices,
          selectPlaceholder,
          initialValue,
          {
            freeValue,
            ...freeSearchOpts,
          },
        );
      }
    } else if (type === "entity") {
      // Entity: native select with options.
      control = _el("div", "df-entity-picker");
      const allOptions = Array.isArray(attr.options) ? attr.options : [];
      const select = _el("select", "df-input df-select", {
        id,
        name: attr.code,
      });
      if (required) select.required = true;
      if (multi) select.multiple = true;

      if (!multi) {
        const placeholderOpt = _el("option", "", {
          value: "",
          disabled: "",
          selected: "",
        });
        placeholderOpt.textContent = selectPlaceholder;
        if (initialValues.length > 0) placeholderOpt.selected = false;
        select.appendChild(placeholderOpt);
      }

      const renderOptions = (items) => {
        select
          .querySelectorAll("option:not([disabled])")
          .forEach((o) => o.remove());
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
        control = _el("input", "df-input", {
          type: "number",
          id,
          name: attr.code,
        });
        if (tok.min != null) control.min = tok.min;
        if (tok.max != null) control.max = tok.max;
        if (tok.step != null) control.step = tok.step;
        if (required) control.required = true;
        if (tok.re) {
          control.dataset.regex = tok.re;
          control.addEventListener("input", () =>
            _validateInput(control, wrap),
          );
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
          placeholder: inputPlaceholder,
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
          placeholder: inputPlaceholder,
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
          if (form)
            DynamicForm._logFormData(form, "Field changed: " + attr.code);
        });
      } else {
        const events =
          control.tagName === "INPUT" || control.tagName === "TEXTAREA"
            ? ["input", "change"]
            : ["change"];
        events.forEach((ev) =>
          control.addEventListener(ev, () => {
            const form = control.closest("form");
            if (form)
              DynamicForm._logFormData(form, "Field changed: " + attr.code);
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

    // Character counter for length-limited text fields (e.g. maxLength:300).
    if (
      (control.tagName === "TEXTAREA" || control.tagName === "INPUT") &&
      Number(control.maxLength) > 0
    ) {
      const max = Number(control.maxLength);
      const counter = _el("div", "df-char-counter");
      const updateCounter = () => {
        counter.textContent = `${control.value.length} / ${max}`;
        counter.classList.toggle(
          "df-char-counter--limit",
          control.value.length >= max,
        );
      };
      updateCounter();
      control.addEventListener("input", updateCounter);
      wrap.appendChild(counter);
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

      if (t === "address" && k in data) {
        const isMulti = wrap.dataset.addressMulti === "true";
        // FormData collapses a single repeated field into a scalar, so a multi
        // address with one value would otherwise submit as a bare value.
        const values = [].concat(data[k]).filter((v) => v !== "");

        // Entity mode submits an Address id, numeric like any other entity
        // reference; string mode submits the address text as it is.
        const cast =
          wrap.dataset.addressMode === "entity"
            ? values.map(Number)
            : values.map(String);

        data[k] = isMulti ? cast : (cast[0] ?? null);
      } else if (t === "number" && k in data) {
        // Multi-value number fields arrive as an array and must be cast per item.
        if (Array.isArray(data[k]))
          data[k] = data[k].filter((v) => v !== "").map(Number);
        else data[k] = data[k] === "" ? null : Number(data[k]);
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
    const results = [];

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
      let fieldOk = true;
      let fieldMsg = "";

      const setErr = (el, msg) => {
        el.classList.add("df-input--error");
        if (errEl) errEl.textContent = msg;
        ok = false;
        fieldOk = false;
        fieldMsg = msg;
      };

      const checkedGroupNames = new Set();

      wrap.querySelectorAll("[required]").forEach((inp) => {
        if (inp.type === "checkbox" && inp.name.endsWith("[]")) {
          // Expanded checkbox group (multiselect): valid when at least one
          // option in the group is checked, not just this specific checkbox.
          if (checkedGroupNames.has(inp.name)) return;
          checkedGroupNames.add(inp.name);
          const anyChecked = [
            ...wrap.querySelectorAll(`input[name="${inp.name}"]`),
          ].some((r) => r.checked);
          if (!anyChecked) {
            const group = wrap.querySelector(
              ".df-choice-list, .df-radio-group, .df-checkbox-list",
            );
            setErr(group || inp, "Please select an option");
          }
        } else if (inp.type === "checkbox" && !inp.checked) {
          const customDot = inp.nextElementSibling;
          if (customDot?.classList.contains("df-choice-custom")) {
            customDot.classList.add("df-choice-custom--error");
          }
          ok = false;
          fieldOk = false;
          fieldMsg = "This field is required";
        } else if (inp.type === "radio") {
          if (checkedGroupNames.has(inp.name)) return;
          checkedGroupNames.add(inp.name);
          const anyChecked = [
            ...wrap.querySelectorAll(`input[name="${inp.name}"]`),
          ].some((r) => r.checked);
          if (!anyChecked) {
            const group = wrap.querySelector(
              ".df-choice-list, .df-radio-group, .df-checkbox-list",
            );
            setErr(group || inp, "Please select an option");
          }
        } else if (
          inp.tagName === "SELECT" &&
          (!inp.value || inp.value === "")
        ) {
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
          cs.querySelector(".df-customselect__trigger")?.classList.add(
            "df-customselect--error",
          );
          if (errEl) errEl.textContent = "This field is required";
          ok = false;
          fieldOk = false;
          fieldMsg = "This field is required";
        } else {
          cs.querySelector(".df-customselect__trigger")?.classList.remove(
            "df-customselect--error",
          );
        }
      }

      // Custom multiselect validation.
      const ms = wrap.querySelector(".df-multiselect");
      if (ms && wrap.dataset.required === "true") {
        const hasSelected =
          ms.querySelectorAll(".df-multiselect__hidden input").length > 0;
        if (!hasSelected) {
          ms.querySelector(".df-multiselect__trigger")?.classList.add(
            "df-multiselect--error",
          );
          if (errEl) errEl.textContent = "This field is required";
          ok = false;
          fieldOk = false;
          fieldMsg = "This field is required";
        } else {
          ms.querySelector(".df-multiselect__trigger")?.classList.remove(
            "df-multiselect--error",
          );
        }
      }

      results.push({
        code: wrap.dataset.code,
        type: wrap.dataset.type,
        required: wrap.dataset.required === "true",
        valid: fieldOk,
        message: fieldMsg,
      });
    });

    const time = new Date().toLocaleTimeString();
    console.group(
      `[DynamicForm] [${time}] Field validation: ${ok ? "PASSED" : "FAILED"}`,
    );
    console.table(results);
    console.groupEnd();

    return ok;
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Form header (title + description)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Builds the form header from the schema's localized NAME and DESCRIPTION.
   * Returns null when there is nothing to show or when disabled via
   * cfg.withHeader === false. Uses _getNls so the active language is respected.
   */
  _buildFormHeader() {
    if (this.cfg.withHeader === false) return null;

    const nls = this._schema?.nls;
    const name = DynamicForm._getNls(nls, this.cfg.lang, "NAME");
    const description = DynamicForm._getNls(nls, this.cfg.lang, "DESCRIPTION");
    if (!name && !description) return null;

    const header = DynamicForm._el("div", "df-form-header");
    if (name) {
      const titleEl = DynamicForm._el("h2", "df-form-title");
      titleEl.textContent = name;
      header.appendChild(titleEl);
    }
    if (description) {
      const descEl = DynamicForm._el("p", "df-form-description");
      descEl.innerHTML = description;
      header.appendChild(descEl);
    }
    return header;
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

    // Form header (title + description) disabled for now.
    // const header = this._buildFormHeader();
    // if (header) container.appendChild(header);

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

      const groupDesc = group
        ? DynamicForm._getNls(group.nls, cfg.lang, "DESCRIPTION")
        : "";
      if (groupDesc) {
        const descEl = _el("p", "df-section-desc");
        descEl.innerHTML = groupDesc;
        section.appendChild(descEl);
      }

      items.forEach((item) => {
        if (!item._attr) return;
        const fieldEl = this._buildField(item._attr, {
          withLabel: cfg.withLabel,
        });
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

      // Attribute -> typeId mapping used to group values on submit.
      const attrTypeMap = {};
      groupOrder.forEach((entry) => {
        const [, items] = Object.entries(entry)[0];
        items.forEach((item) => {
          if (item.attributeCode && item.typeId)
            attrTypeMap[item.attributeCode] = item.typeId;
        });
      });

      form.querySelector(".df-submit-error")?.remove();

      btn.disabled = true;
      btn.textContent = "Submitting...";

      try {
        // New addresses become real records first, so their ids can be
        // collected together with the rest of the values.
        await this._resolveAddressFields(form);

        const submittedData = this._mergePresetValues(_collectData(form));
        _logFormData(form, "SUBMITTED (Single Mode)");

        await this._createForm(submittedData, attrTypeMap);
        form.reset();
        DynamicForm._resetAddressFields(form);
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

    // Form header (title + description) disabled for now.
    // const header = this._buildFormHeader();
    // if (header) container.appendChild(header);

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
        const groupLabel = group
          ? DynamicForm._getNls(group.nls, cfg.lang)
          : "";

        const stepItem = _el("div", "df-stepper__item");
        if (i < activeVisIdx) stepItem.classList.add("df-stepper__item--done");
        if (i === activeVisIdx)
          stepItem.classList.add("df-stepper__item--active");

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
      const groupLabel = group
        ? DynamicForm._getNls(group.nls, cfg.lang, "DESCRIPTION")
        : "";

      const stepEl = _el("div", "df-step");
      stepEl.dataset.step = gi;

      if (groupLabel) {
        const h3 = _el("h3", "df-multiple-section-title");
        h3.innerHTML = groupLabel;
        stepEl.appendChild(h3);
      }

      items.forEach((item) => {
        if (!item._attr) return;
        const fieldEl = this._buildField(item._attr, {
          withLabel: cfg.withLabel,
        });
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
    const submitBtn = _el("button", "df-btn df-btn--primary df-submit", {
      type: "submit",
    });

    prevBtn.textContent = cfg.prevLabel || "← Back";
    nextBtn.textContent = cfg.nextLabel || "Next →";
    submitBtn.textContent = cfg.submitLabel || "Submit";

    nav.appendChild(prevBtn);
    nav.appendChild(nextBtn);
    nav.appendChild(submitBtn);
    form.appendChild(nav);

    // ── Navigation helpers ────────────────────────────────────────────────

    const getVisibleCodes = () =>
      allStepCodes.filter((c) => visibility[c] !== false);
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
      visibleCodes
        .slice(0, targetIdx)
        .forEach((c) => stepElMap[c]?.classList.add("df-step--done"));
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

      const attrTypeMap = {};
      groupOrder.forEach((entry) => {
        const [, items] = Object.entries(entry)[0];
        items.forEach((item) => {
          if (item.attributeCode && item.typeId)
            attrTypeMap[item.attributeCode] = item.typeId;
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
      form.querySelector(".df-submit-error")?.remove();

      submitBtn.disabled = prevBtn.disabled = nextBtn.disabled = true;
      submitBtn.textContent = "Submitting...";

      try {
        // Addresses picked on visible steps become real records first; steps
        // that ended up hidden are skipped, their values are dropped anyway.
        await this._resolveAddressFields(form, { skipCodes: hiddenAttrCodes });

        // Collect data for the current form state.
        const rawData = this._mergePresetValues(_collectData(form));
        hiddenAttrCodes.forEach((c) => {
          delete rawData[c];
          delete rawData[c + "[]"];
        });

        _logFormData(form, "SUBMITTED (Wizard Mode)");

        await this._createForm(rawData, attrTypeMap);
        form.reset();
        DynamicForm._resetAddressFields(form);
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
        if (inp.closest(".df-multiselect") || inp.closest(".df-customselect"))
          return;
        if (inp.type === "checkbox" || inp.type === "radio")
          inp.checked = false;
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
      el.querySelectorAll(".df-input--error").forEach((e) =>
        e.classList.remove("df-input--error"),
      );
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
          return Array.from(
            ms.querySelectorAll(".df-multiselect__hidden input"),
          ).map((i) => i.value);

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
          if (
            !stepCode ||
            typeof stepCode !== "string" ||
            !(stepCode in stepElMap)
          )
            return;
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
          if (target && typeof target === "string" && target in stepElMap)
            toShow.add(target);
        });

        // Apply visibility changes.
        let changed = false;
        Object.values(mapping).forEach((stepCode) => {
          if (
            !stepCode ||
            typeof stepCode !== "string" ||
            !(stepCode in stepElMap)
          )
            return;
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
        const code = (attr.uiBehavior || "")
          .replace(/\/\*[\s\S]*?\*\//g, "")
          .trim();
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
              if (!(stepCode in stepElMap) || visibility[stepCode] === false)
                return;
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
          console.error(
            `[DynamicForm] uiBehavior error on "${attr.code}":`,
            err,
          );
        }
      };

      // Run behavior before goToStep so hidden steps are hidden immediately.
      attrsWithBehavior.forEach((attr) => execBehavior(attr));

      // Attach listeners to fields with behavior.
      attrsWithBehavior.forEach((attr) => {
        const fieldEl = form.querySelector(
          `.df-field[data-code="${attr.code}"]`,
        );
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
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
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
      const typeId =
        attrTypeMap[key] ?? this._getAttributeTypeId(key) ?? this._schema.id;
      if (!groupedAttributes[typeId]) groupedAttributes[typeId] = {};
      groupedAttributes[typeId][key] = { value };
    });

    const body = {
      type: { id: this._schema.id },
      organization: { id: this.cfg.organizationId },
      attributes: groupedAttributes,
    };

    // Dry run: everything is built and logged, nothing is sent.
    if (this.cfg.dryRun) {
      console.info("[DynamicForm] dry run, request body:", body);
      return body;
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(body),
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
    const container =
      typeof selector === "string"
        ? document.querySelector(selector)
        : selector;
    if (!container)
      throw new Error("DynamicForm: container not found: " + selector);

    // Global listener for closing dropdowns when clicking outside.
    if (!document._dfClickOutsideBound) {
      document._dfClickOutsideBound = true;
      document.addEventListener("click", () => {
        document.querySelectorAll(".df-multiselect--open").forEach((ms) => {
          ms.classList.remove("df-multiselect--open");
          ms.querySelector(".df-multiselect__trigger")?.setAttribute(
            "aria-expanded",
            "false",
          );
        });
        document.querySelectorAll(".df-customselect--open").forEach((s) => {
          s.classList.remove("df-customselect--open");
          s.querySelector(".df-customselect__trigger")?.setAttribute(
            "aria-expanded",
            "false",
          );
        });
      });
    }

    // Show loader.
    const loader = DynamicForm._el("div", "df-loader");
    loader.innerHTML = '<div class="df-spinner"></div><p>Loading form…</p>';
    container.appendChild(loader);

    // cfg.schema short-circuits the request — handy for demos, previews and
    // tests that should not depend on the API being reachable.
    Promise.resolve(this.cfg.schema || this._fetchFormSchema())
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
