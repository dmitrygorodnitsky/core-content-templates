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
      address: false,
      rows: null, cols: null, min: null, max: null, step: null,
      minLength: null, maxLength: null, re: null, mask: null, placeholder: null,
      country: null, coordinatesOf: null,
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
        || token === "tel" || token === "url" || token === "email" || token === "color" || token === "date"
        || token === "address") {
        tokens[token] = true;
        return;
      }
      var pair = token.match(/^(rows|cols|min|max|step|minLength|maxLength):(.+)$/);
      if (pair) { tokens[pair[1]] = Number(pair[2]); return; }
      var region = token.match(/^country:([A-Za-z,]+)$/);
      if (region) {
        tokens.country = region[1].split(",").map(function (code) { return code.trim().toLowerCase(); }).filter(Boolean);
        return;
      }
      var source = token.match(/^coordinates-of:(.+)$/);
      if (source) { tokens.coordinatesOf = source[1]; return; }
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
    if (tokens.address) return attribute.multiselect ? "address-list" : "address";
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
    var hidden = [];
    var placed = {};

    order.forEach(function (entry) {
      Object.keys(entry || {}).forEach(function (groupCode) {
        var rows = Array.isArray(entry[groupCode]) ? entry[groupCode] : [];
        var fields = [];
        rows.forEach(function (row) {
          var found = byCode[row.attributeCode];
          if (!found || placed[row.attributeCode]) return;
          placed[row.attributeCode] = true;
          var field = toField(found.attribute, found.typeId, locale);
          if (row.visible === false || field.tokens.coordinatesOf) hidden.push(field);
          else fields.push(field);
        });
        if (fields.length) groups.push({ code: groupCode, title: groupTitles[groupCode] || "", fields: fields });
      });
    });

    var loose = [];
    Object.keys(byCode).forEach(function (code) {
      if (placed[code]) return;
      var field = toField(byCode[code].attribute, byCode[code].typeId, locale);
      if (field.tokens.coordinatesOf) hidden.push(field);
      else loose.push(field);
    });
    if (loose.length) groups.push({ code: "__ungrouped", title: "", fields: loose });

    return { id: schema.id, code: schema.code, title: localized(schema.nls, locale), groups: groups, hidden: hidden };
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

  function repeatList(value) {
    if (Array.isArray(value)) return value;
    return value ? [String(value)] : [];
  }

  function withEntry(list, entry) {
    var known = list.some(function (existing) { return String(existing).toLowerCase() === entry.toLowerCase(); });
    return known ? list : list.concat([entry]);
  }

  function addressKey(field, text) {
    var address = text == null ? "" : String(text);
    return field.kind === "address-list" ? address.trim() : address;
  }

  function pointOf(location) {
    if (!location) return null;
    var lat = typeof location.lat === "function" ? location.lat() : location.lat;
    var lng = typeof location.lng === "function" ? location.lng() : location.lng;
    if (typeof lat !== "number" || typeof lng !== "number" || !isFinite(lat) || !isFinite(lng)) return null;
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
    return { lat: lat, lng: lng };
  }

  function keepFocus(event) {
    event.preventDefault();
  }

  var CONTROLS = { INPUT: true, SELECT: true, TEXTAREA: true, BUTTON: true };

  function within(outer, node) {
    for (var current = node; current; current = current.parentNode) {
      if (current === outer) return true;
    }
    return false;
  }

  function focusKey(node) {
    if (!node || typeof node.getAttribute !== "function") return "";
    if (node.id) return "#" + node.id;
    var name = node.getAttribute("name");
    if (name) return name + "=" + node.getAttribute("value");
    return node.getAttribute("data-focus") || "";
  }

  function findNode(node, match) {
    if (match(node)) return node;
    var children = node.children || [];
    for (var index = 0; index < children.length; index += 1) {
      var found = findNode(children[index], match);
      if (found) return found;
    }
    return null;
  }

  function debounce(fn, wait) {
    var timer = null;
    return function () {
      var args = arguments;
      var self = this;
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(self, args); }, wait);
    };
  }

  var mapsPromise = null;
  var MAPS_LIBRARIES = ["maps", "places", "marker", "geocoding"];

  function loadMaps(apiKey) {
    if (mapsPromise) return mapsPromise;
    if (!apiKey) return Promise.reject(new Error("no-key"));
    mapsPromise = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.async = true;
      script.src = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(apiKey)
        + "&loading=async&v=weekly";
      script.addEventListener("error", function () { reject(new Error("maps-script-failed")); });
      script.addEventListener("load", function () {
        var maps = global.google && global.google.maps;
        if (maps && typeof maps.importLibrary === "function") resolve(maps);
        else reject(new Error("maps-unavailable"));
      });
      document.head.appendChild(script);
    }).then(function (maps) {
      return Promise.all(MAPS_LIBRARIES.map(function (name) { return maps.importLibrary(name); }))
        .then(function () { return maps; });
    });
    return mapsPromise;
  }

  function geocodeAddress(maps, text, answered) {
    var query = String(text == null ? "" : text).trim();
    if (!query || !maps.Geocoder) return false;
    new maps.Geocoder().geocode({ address: query }, function (results, status) {
      answered(status === "OK" && results && results.length ? results[0] : null);
    });
    return true;
  }

  function PortalForm(config) {
    this.cfg = config || {};
    this.locale = this.cfg.locale || "en";
    this.model = null;
    this.values = {};
    this.errors = {};
    this.touched = {};
    this.pending = {};
    this.locations = {};
    this.lookups = {};
    this.previews = {};
    this.fieldNodes = {};
    this.unpainted = {};
    this.pressing = false;
    this.step = 0;
    this.state = "loading";
    this.result = null;
  }

  PortalForm.prototype.mount = function (target) {
    this.root = typeof target === "string" ? document.querySelector(target) : target;
    if (!this.root) throw new Error("PortalForm mount target was not found");
    this.root.classList.add("pf");
    this.trackPress();
    this.render();
    var self = this;
    this.load().then(function () { self.render(); }, function () { self.render(); });
    return this;
  };

  PortalForm.prototype.trackPress = function () {
    var self = this;
    this.root.addEventListener("mousedown", function (event) {
      if (event.button === 0) self.pressing = true;
    }, true);
    document.addEventListener("mouseup", function () {
      if (self.pressing) setTimeout(function () { self.release(); }, 0);
    }, true);
    document.addEventListener("keydown", function () {
      if (self.pressing) self.release();
    }, true);
  };

  PortalForm.prototype.release = function () {
    var self = this;
    var waiting = this.unpainted;
    this.pressing = false;
    this.unpainted = {};
    Object.keys(waiting).forEach(function (code) { self.paint(waiting[code]); });
  };

  PortalForm.prototype.paint = function (field) {
    if (this.pressing) { this.unpainted[field.code] = field; return; }
    var nodes = this.fieldNodes[field.code];
    if (!nodes) return;
    var invalid = Boolean(this.touched[field.code] && this.errors[field.code]);
    nodes.wrap.setAttribute("data-state", invalid ? "invalid" : "idle");
    nodes.error.textContent = invalid ? this.errors[field.code] : "";
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
    this.seed();
    this.state = this.model.groups.length ? "ready" : "empty";
  };

  PortalForm.prototype.seed = function () {
    var preset = this.cfg.presetValues || {};
    var self = this;
    this.eachField(function (field) {
      if (Object.prototype.hasOwnProperty.call(preset, field.code)) {
        self.values[field.code] = preset[field.code];
      } else if (field.kind === "checklist" || field.kind === "multiselect" || field.kind === "address-list") {
        self.values[field.code] = [];
      } else if (field.kind === "boolean") {
        self.values[field.code] = false;
      } else if (field.kind === "slider") {
        self.values[field.code] = field.tokens.min != null ? field.tokens.min : 0;
      } else {
        self.values[field.code] = "";
      }
    });
  };

  PortalForm.prototype.eachField = function (visit) {
    if (!this.model) return;
    this.model.groups.forEach(function (group) {
      group.fields.forEach(function (field) { visit(field, group); });
    });
    this.model.hidden.forEach(function (field) { visit(field, null); });
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

  PortalForm.prototype.flushPending = function () {
    var self = this;
    this.eachField(function (field) {
      if (field.kind === "address-list") self.takePending(field, self.pending[field.code]);
    });
  };

  PortalForm.prototype.takePending = function (field, raw) {
    var entry = String(raw == null ? "" : raw).trim();
    this.pending[field.code] = "";
    if (!entry) return false;
    var held = repeatList(this.values[field.code]);
    var next = withEntry(held, entry);
    if (next === held) return false;
    this.touched[field.code] = true;
    this.setValue(field, next);
    return true;
  };

  PortalForm.prototype.submit = function () {
    var self = this;
    this.flushPending();
    var groups = this.visibleGroups();
    var ok = true;
    groups.forEach(function (group) { if (!self.validateGroup(group)) ok = false; });
    if (!ok) {
      this.step = groups.findIndex(function (group) {
        return group.fields.some(function (field) { return self.errors[field.code]; });
      });
      if (this.step < 0) this.step = 0;
      this.render();
      this.focusInvalid(groups[this.step]);
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
    var sent = {};
    function collect(field) {
      var value = self.values[field.code];
      if (value === "" || value === null || value === undefined) return;
      if (Array.isArray(value) && !value.length) return;
      if (field.kind === "boolean" && value !== true) return;
      var bucket = String(field.typeId != null ? field.typeId : self.model.id);
      if (!attributes[bucket]) attributes[bucket] = {};
      attributes[bucket][field.code] = { value: value };
      sent[field.code] = true;
    }
    groups.forEach(function (group) { group.fields.forEach(collect); });
    this.model.hidden.forEach(function (field) {
      if (field.tokens.coordinatesOf && !sent[field.tokens.coordinatesOf]) return;
      collect(field);
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
        self.focusKeyed("success");
        if (typeof self.cfg.onSubmit === "function") self.cfg.onSubmit(payload, self.values);
        return true;
      })
      .catch(function (error) {
        self.state = "submit-error";
        self.result = { message: error.message };
        self.render();
        self.focusKeyed("next");
        return false;
      });
  };

  PortalForm.prototype.setValue = function (field, value) {
    this.values[field.code] = value;
    if (this.touched[field.code]) this.errors[field.code] = this.validateField(field);
    this.syncCoordinates(field);
  };

  PortalForm.prototype.holdsAddress = function (field, address) {
    if (repeatList(this.values[field.code]).indexOf(address) !== -1) return true;
    return field.kind === "address-list" && String(this.pending[field.code] || "").trim() === address;
  };

  PortalForm.prototype.rememberLocation = function (field, text, location, fromGeocoder) {
    var address = addressKey(field, text);
    var point = pointOf(location);
    if (!address || !point) return;
    var known = this.locations[field.code] || (this.locations[field.code] = Object.create(null));
    if (fromGeocoder && known[address]) return;
    known[address] = point;
    this.syncCoordinates(field);
    var preview = this.previews[field.code];
    if (preview && known[address]) preview(address, known[address]);
  };

  PortalForm.prototype.locate = function (field, text, maps) {
    var self = this;
    var address = addressKey(field, text);
    var known = this.locations[field.code];
    var asked = this.lookups[field.code] || (this.lookups[field.code] = Object.create(null));
    if (!address || !this.cfg.mapsApiKey || (known && known[address]) || asked[address]) return;
    asked[address] = "pending";
    function ask(loaded) {
      var sent = geocodeAddress(loaded, address, function (best) {
        if (best) {
          delete asked[address];
          self.rememberLocation(field, address, best.geometry && best.geometry.location, true);
        } else if (self.holdsAddress(field, address)) {
          asked[address] = "missed";
        } else {
          delete asked[address];
        }
      });
      if (!sent) delete asked[address];
    }
    if (maps) ask(maps);
    else loadMaps(this.cfg.mapsApiKey).then(ask).catch(function () { delete asked[address]; });
  };

  PortalForm.prototype.syncCoordinates = function (source) {
    var self = this;
    var known = this.locations[source.code];
    if (known) {
      Object.keys(known).forEach(function (address) {
        if (!self.holdsAddress(source, address)) delete known[address];
      });
    }
    var asked = this.lookups[source.code];
    if (asked) {
      Object.keys(asked).forEach(function (address) {
        if (asked[address] === "missed" && !self.holdsAddress(source, address)) delete asked[address];
      });
    }
    this.model.hidden.forEach(function (field) {
      if (field.tokens.coordinatesOf !== source.code) return;
      var entries = [];
      repeatList(self.values[source.code]).forEach(function (address) {
        var point = known && known[address];
        if (point) entries.push({ address: address, lat: point.lat, lng: point.lng });
      });
      self.values[field.code] = entries.length ? JSON.stringify(entries) : "";
    });
  };

  PortalForm.prototype.render = function () {
    var active = document.activeElement;
    var held = within(this.root, active) ? focusKey(active) : "";
    this.draw();
    if (held) this.focusKeyed(held);
  };

  PortalForm.prototype.focusKeyed = function (key) {
    if (!key) return false;
    var node = findNode(this.root, function (candidate) { return focusKey(candidate) === key; });
    if (node) node.focus();
    return Boolean(node);
  };

  PortalForm.prototype.draw = function () {
    var self = this;
    var root = this.root;
    root.dataset.state = this.state;
    this.fieldNodes = {};
    root.replaceChildren();

    var card = el("div", "pf__card");
    root.appendChild(card);

    if (this.state === "loading") { card.appendChild(this.renderSkeleton()); return; }
    if (this.state === "error") { card.appendChild(this.renderNotice("error", this.cfg.copy.schemaErrorTitle, this.cfg.copy.schemaErrorBody, true)); return; }
    if (this.state === "empty") { card.appendChild(this.renderNotice("empty", this.cfg.copy.emptyTitle, this.cfg.copy.emptyBody, false)); return; }
    if (this.state === "success") { card.appendChild(this.renderSuccess()); return; }

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

    var titleId = group.title ? "pf-group-" + group.code : undefined;
    var section = el("div", "pf-group", { "data-group": group.code, role: "group", tabindex: "-1", "aria-labelledby": titleId });
    if (group.title) {
      var groupTitle = text("p", "pf-group__title", group.title);
      groupTitle.id = titleId;
      section.appendChild(groupTitle);
    }
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
      back.addEventListener("click", function () { self.step -= 1; self.render(); self.focusStep(); });
      actions.appendChild(back);
    }
    var last = this.step === groups.length - 1;
    var submitting = this.state === "submitting";
    var next = text("button", "btn btn--primary btn--lg", submitting ? this.cfg.copy.submittingLabel : last ? this.cfg.copy.submitLabel : this.cfg.copy.nextLabel);
    next.type = "submit";
    next.setAttribute("data-focus", "next");
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
    this.flushPending();
    if (!this.validateGroup(groups[this.step])) { this.render(); this.focusInvalid(groups[this.step]); return; }
    if (this.step < groups.length - 1) { this.step += 1; this.render(); this.focusStep(); return; }
    this.submit();
  };

  PortalForm.prototype.focusStep = function () {
    var section = findNode(this.root, function (node) { return node.getAttribute("data-group") !== null; });
    if (section) section.focus();
  };

  PortalForm.prototype.focusInvalid = function (group) {
    var self = this;
    var field = group.fields.filter(function (candidate) { return self.errors[candidate.code]; })[0];
    var nodes = field && this.fieldNodes[field.code];
    if (!nodes) return;
    var control = findNode(nodes.wrap, function (node) { return node.id === "pf-" + field.code && CONTROLS[node.tagName] === true; })
      || findNode(nodes.wrap, function (node) { return CONTROLS[node.tagName] === true; });
    if (control) control.focus();
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

  PortalForm.prototype.renderSuccess = function () {
    var self = this;
    var copy = this.cfg.copy;
    var wrap = el("div", "pf-notice pf-notice--success", { "data-state": "success" });
    var glyph = text("div", "pf-notice__glyph", "✓");
    glyph.setAttribute("aria-hidden", "true");
    wrap.appendChild(glyph);
    var title = text("h2", "pf-notice__title", copy.successTitle);
    title.setAttribute("tabindex", "-1");
    title.setAttribute("data-focus", "success");
    wrap.appendChild(title);
    if (copy.successBody) wrap.appendChild(text("div", "pf-notice__body", copy.successBody));

    var steps = [copy.successStep1, copy.successStep2, copy.successStep3].filter(function (step) {
      return step != null && String(step).trim() !== "";
    });
    if (steps.length) {
      var next = el("div", "pf-next");
      if (copy.successNextTitle) next.appendChild(text("h3", "pf-next__title", copy.successNextTitle));
      var list = el("ol", "pf-next__list");
      steps.forEach(function (step, index) {
        var item = el("li", "pf-next__item");
        var number = text("span", "pf-next__n", index + 1);
        number.setAttribute("aria-hidden", "true");
        item.appendChild(number);
        item.appendChild(text("span", "pf-next__text", step));
        list.appendChild(item);
      });
      next.appendChild(list);
      wrap.appendChild(next);
    }

    if (copy.successAgainLabel) {
      var again = text("button", "btn btn--ghost btn--lg", copy.successAgainLabel);
      again.type = "button";
      again.addEventListener("click", function () { self.restart(); });
      wrap.appendChild(again);
    }
    return wrap;
  };

  PortalForm.prototype.restart = function () {
    this.values = {};
    this.errors = {};
    this.touched = {};
    this.pending = {};
    this.locations = {};
    this.lookups = {};
    this.result = null;
    this.step = 0;
    this.seed();
    this.state = "ready";
    this.render();
    this.focusStep();
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
    this.fieldNodes[field.code] = { wrap: wrap, error: error };

    wrap.addEventListener("focusout", function (event) {
      if (within(wrap, event.relatedTarget)) return;
      self.touched[field.code] = true;
      self.errors[field.code] = self.validateField(field);
      self.paint(field);
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
        chip.setAttribute("data-focus", field.code + "=" + choice.value);
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

    if (field.kind === "address") return this.addressControl(field, id, value, null);
    if (field.kind === "address-list") return this.addressListControl(field, id, value);

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

  PortalForm.prototype.addressListControl = function (field, id, value) {
    var self = this;
    var held = repeatList(value);
    var wrap = el("div", "pf-repeat");

    if (held.length) {
      var items = el("div", "pf-repeat__items", { role: "group", "aria-label": field.label });
      held.forEach(function (entry) {
        var row = el("button", "pf-repeat__row", {
          type: "button", "aria-pressed": "true", "aria-label": String(entry),
        });
        row.appendChild(text("span", "pf-repeat__text", entry));
        var glyph = text("span", "pf-repeat__x", "×");
        glyph.setAttribute("aria-hidden", "true");
        row.appendChild(glyph);
        row.addEventListener("click", function () {
          self.touched[field.code] = true;
          self.setValue(field, repeatList(self.values[field.code]).filter(function (existing) {
            return String(existing) !== String(entry);
          }));
          self.renderAndFocus(id);
        });
        items.appendChild(row);
      });
      wrap.appendChild(items);
    }

    var entry = el("div", "pf-repeat__entry");
    entry.appendChild(this.addressControl(field, id, this.pending[field.code] || "", function (candidate, picked) {
      if (self.takePending(field, candidate) && !picked) self.locate(field, candidate);
      self.renderAndFocus(id);
    }));
    var add = text("button", "pf-repeat__add", "+");
    add.type = "button";
    add.addEventListener("mousedown", keepFocus);
    add.addEventListener("click", function () {
      var typed = self.pending[field.code];
      if (self.takePending(field, typed)) self.locate(field, typed);
      self.renderAndFocus(id);
    });
    entry.appendChild(add);
    wrap.appendChild(entry);
    return wrap;
  };

  PortalForm.prototype.renderAndFocus = function (id) {
    this.render();
    var input = document.getElementById(id);
    if (input && typeof input.focus === "function") input.focus();
  };

  PortalForm.prototype.addressControl = function (field, id, value, accept) {
    var self = this;
    var repeating = typeof accept === "function";
    var wrap = el("div", "pf-address");
    var input = el("input", "pf-input", {
      type: "text", id: id, name: field.code, placeholder: field.placeholder,
      autocomplete: "street-address", "aria-describedby": id + "-error",
    });
    input.value = value != null ? value : "";
    var listbox = { key: null };
    var take = repeating ? accept : function (formatted) {
      input.value = formatted;
      self.setValue(field, formatted);
    };
    input.addEventListener("keydown", function (event) {
      if (listbox.key && listbox.key(event)) return;
      if (!repeating || event.key !== "Enter") return;
      event.preventDefault();
      if (wrap.dataset.autocomplete === "legacy") return;
      take(input.value);
    });
    if (repeating) {
      input.addEventListener("input", function () {
        self.pending[field.code] = input.value;
        self.syncCoordinates(field);
      });
    } else {
      input.addEventListener("input", function () { self.setValue(field, input.value); });
    }
    var anchor = el("div", "pf-address__anchor");
    anchor.appendChild(input);
    wrap.appendChild(anchor);

    var canvas = el("div", "pf-address__map", { "data-state": "idle", "aria-hidden": "true" });
    wrap.appendChild(canvas);

    if (!this.cfg.mapsApiKey) return wrap;

    loadMaps(this.cfg.mapsApiKey).then(function (maps) {
      self.upgradeAddress(field, wrap, input, canvas, maps, take, listbox);
    }).catch(function () {
      canvas.dataset.state = "idle";
    });
    return wrap;
  };

  PortalForm.prototype.upgradeAddress = function (field, wrap, input, canvas, maps, take, listbox) {
    var self = this;
    var repeating = field.kind === "address-list";
    var map = null;
    var marker = null;

    function show(location, label) {
      if (!location) return;
      canvas.dataset.state = "ready";
      canvas.removeAttribute("aria-hidden");
      if (!map) {
        map = new maps.Map(canvas, {
          center: location, zoom: 16, disableDefaultUI: true, zoomControl: true,
          mapId: self.cfg.mapsMapId || undefined,
        });
      } else {
        map.setCenter(location);
      }
      if (marker && marker.setMap) marker.setMap(null);
      marker = new maps.Marker({ map: map, position: location, title: label || "" });
    }

    function preview(text) {
      var address = addressKey(field, text);
      var known = self.locations[field.code];
      if (known && known[address]) show(known[address], address);
      else self.locate(field, text, maps);
    }

    self.previews[field.code] = function (address, point) {
      if (addressKey(field, repeating ? self.pending[field.code] : input.value) === address) show(point, address);
    };

    function pick(formatted, location) {
      if (!formatted) return;
      take(formatted, true);
      if (location) self.rememberLocation(field, formatted, location, false);
      else self.locate(field, formatted, maps);
    }

    var places = maps.places || {};
    var mode = places.AutocompleteSuggestion ? "data-api" : places.Autocomplete ? "legacy" : "geocode";
    wrap.dataset.autocomplete = mode;

    if (mode === "data-api") {
      this.suggest(field, input, places, pick, listbox);
    } else if (mode === "legacy") {
      try {
        var autocomplete = new places.Autocomplete(input, {
          fields: ["formatted_address", "geometry"],
          types: ["address"],
          componentRestrictions: field.tokens.country ? { country: field.tokens.country } : undefined,
        });
        autocomplete.addListener("place_changed", function () {
          var place = autocomplete.getPlace();
          if (!place) return;
          pick(place.formatted_address, place.geometry && place.geometry.location);
        });
      } catch (_) {
        wrap.dataset.autocomplete = "geocode";
      }
    }

    if (repeating) {
      input.addEventListener("blur", function () { preview(self.pending[field.code]); });
    } else {
      input.addEventListener("blur", function () { preview(input.value); });
      preview(input.value);
    }
  };

  PortalForm.prototype.suggest = function (field, input, places, pick, listbox) {
    var repeating = field.kind === "address-list";
    var listId = input.id + "-suggestions";
    var list = el("ul", "pf-address__list", { id: listId, role: "listbox", "aria-label": field.label, hidden: true });
    var token = places.AutocompleteSessionToken ? new places.AutocompleteSessionToken() : undefined;
    var offered = [];
    var recent = { query: "", items: [] };
    var active = -1;
    input.parentNode.appendChild(list);
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-controls", listId);
    input.setAttribute("aria-expanded", "false");
    input.setAttribute("autocomplete", "off");

    function highlight(index) {
      active = index;
      offered.forEach(function (option, position) {
        option.node.setAttribute("aria-selected", position === index ? "true" : "false");
      });
      if (index === -1) input.removeAttribute("aria-activedescendant");
      else input.setAttribute("aria-activedescendant", offered[index].node.id);
    }

    function closeList() {
      list.replaceChildren();
      list.hidden = true;
      offered = [];
      highlight(-1);
      input.setAttribute("aria-expanded", "false");
    }

    function choose(option) {
      closeList();
      option.accept();
    }

    function offer(items) {
      closeList();
      offered = items.slice(0, 5).map(function (item, index) {
        var node = el("li", "pf-address__option", { id: listId + "-" + index, role: "option", "aria-selected": "false" });
        node.textContent = item.label;
        var option = { node: node, accept: item.accept };
        node.addEventListener("mousedown", keepFocus);
        node.addEventListener("click", function () { choose(option); });
        list.appendChild(node);
        return option;
      });
      if (!offered.length) return;
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
    }

    listbox.key = function (event) {
      if (list.hidden) {
        if (event.key !== "ArrowDown" || !recent.items.length || recent.query !== input.value.trim()) return false;
        event.preventDefault();
        offer(recent.items);
        highlight(0);
        return true;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        var count = offered.length;
        highlight(event.key === "ArrowDown" ? (active + 1) % count : (active <= 0 ? count : active) - 1);
        return true;
      }
      if (event.key === "Enter") {
        if (active !== -1) {
          event.preventDefault();
          choose(offered[active]);
          return true;
        }
        closeList();
        if (repeating) return false;
        event.preventDefault();
        return true;
      }
      if (event.key !== "Escape") return false;
      event.preventDefault();
      closeList();
      return true;
    };

    input.addEventListener("input", debounce(function () {
      var value = input.value.trim();
      if (value.length < 3) { closeList(); return; }
      places.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: value,
        sessionToken: token,
        includedPrimaryTypes: ["street_address", "premise", "subpremise", "route"],
        includedRegionCodes: field.tokens.country || undefined,
      }).then(function (response) {
        if (document.activeElement !== input || input.value.trim() !== value) return;
        recent = {
          query: value,
          items: ((response && response.suggestions) || []).map(function (suggestion) {
            var prediction = suggestion.placePrediction;
            var label = prediction && prediction.text ? String(prediction.text) : "";
            return {
              label: label,
              accept: function () {
                var place = prediction.toPlace();
                place.fetchFields({ fields: ["formattedAddress", "location"] }).then(function () {
                  pick(place.formattedAddress, place.location);
                }).catch(function () { pick(label, null); });
              },
            };
          }).filter(function (item) { return item.label; }),
        };
        offer(recent.items);
      }).catch(closeList);
    }, 250));
    input.addEventListener("blur", closeList);
  };

  global.PortalForm = PortalForm;
  global.PortalForm.normalizeSchema = normalizeSchema;
  global.PortalForm.parseTokens = parseTokens;
  global.PortalForm.applyMask = applyMask;
  global.PortalForm.maskComplete = maskComplete;
  global.PortalForm.javaType = javaType;
  global.PortalForm.parseBehavior = parseBehavior;
})(typeof window !== "undefined" ? window : globalThis);

(function () {
  "use strict";
  var COPY_KEYS = {"TITLE":"title","SUBTITLE":"subtitle","NOTE":"note","SUBMIT_LABEL":"submitLabel","SUBMITTING_LABEL":"submittingLabel","NEXT_LABEL":"nextLabel","BACK_LABEL":"backLabel","RETRY_LABEL":"retryLabel","STEP_FALLBACK":"stepFallback","SELECT_PLACEHOLDER":"selectPlaceholder","REQUIRED_ERROR":"requiredError","FORMAT_ERROR":"formatError","INCOMPLETE_ERROR":"incompleteError","EMAIL_ERROR":"emailError","URL_ERROR":"urlError","NUMBER_ERROR":"numberError","MIN_ERROR":"minError","MAX_ERROR":"maxError","MIN_LENGTH_ERROR":"minLengthError","MAX_LENGTH_ERROR":"maxLengthError","SCHEMA_ERROR_TITLE":"schemaErrorTitle","SCHEMA_ERROR_BODY":"schemaErrorBody","EMPTY_TITLE":"emptyTitle","EMPTY_BODY":"emptyBody","SUCCESS_TITLE":"successTitle","SUCCESS_BODY":"successBody","SUCCESS_NEXT_TITLE":"successNextTitle","SUCCESS_STEP_1":"successStep1","SUCCESS_STEP_2":"successStep2","SUCCESS_STEP_3":"successStep3","SUCCESS_AGAIN_LABEL":"successAgainLabel","SUBMIT_ERROR_TITLE":"submitErrorTitle","SUBMIT_ERROR_BODY":"submitErrorBody","BLOCKED_TITLE":"blockedTitle","BLOCKED_BODY":"blockedBody"};
  var THEMES = ["hvac","snow","lawn","pool","roofing","pest","health","beauty"];
  var MODES = ["light","dark"];
  function oneOf(value, allowed, fallback) { return allowed.indexOf(value) === -1 ? fallback : value; }
  function ready(fn) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true }); else fn(); }
  function attribute(root, name) { return String(root.getAttribute(name) || "").trim(); }
  function safeBase(value) {
    if (!value) return "";
    try { var url = new URL(value); return url.protocol === "https:" ? url.origin + url.pathname.replace(/\/+$/, "") : ""; } catch (_) { return ""; }
  }
  function copyFrom(root) {
    var copy = {};
    Object.keys(COPY_KEYS).forEach(function (code) {
      var name = "data-copy-" + COPY_KEYS[code].replace(/[A-Z]/g, function (character) { return "-" + character.toLowerCase(); });
      copy[COPY_KEYS[code]] = attribute(root, name);
    });
    return copy;
  }
  ready(function () {
    var root = document.getElementById("portal-form-root");
    if (!root || typeof window.PortalForm !== "function") return;
    var mount = root.querySelector("[data-portal-form-mount]");
    if (!mount) return;
    var theme = oneOf(attribute(root, "data-form-theme").toLowerCase(), THEMES, "snow");
    var mode = oneOf(attribute(root, "data-form-mode").toLowerCase(), MODES, "light");
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.mode = mode;
    var organizationId = Number(attribute(root, "data-form-organization-id"));
    new window.PortalForm({
      apiBaseUrl: safeBase(attribute(root, "data-form-api-base")),
      formTypeCode: attribute(root, "data-form-type-code"),
      organizationId: Number.isFinite(organizationId) && organizationId > 0 ? organizationId : null,
      locale: attribute(root, "data-form-locale") || "en",
      mapsApiKey: attribute(root, "data-form-maps-api-key"),
      copy: copyFrom(root),
    }).mount(mount);
  });
})();
