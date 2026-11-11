(function (global) {
  "use strict";

  var ns = global.ClientReview || (global.ClientReview = {});

  var ORDER_STATUS = {
    QUOTE_SENT: "new",
    ACCEPTED: "approved",
    ACTIVE: "approved",
    SUSPENDED: "approved",
    COMPLETED: "approved",
    CANCELED: "cancelled",
    DECLINED: "declined",
    CUSTOMER_CHANGES_REQUESTED: "changes",
    DRAFT: "revising",
    QUOTE_PREPARED: "revising",
    CHANGES_REQUESTED: "revising",
    QUOTE_APPROVED: "revising",
  };

  var PRICED_STATUSES = ["new", "approved", "declined", "cancelled", "changes"];

  var SIGNED_AGREEMENT_STATE = "CLIENT_APPROVED";

  var CANCELED_ORDER_STATE = "CANCELED";

  var CANCELED_SERVICE = { kind: "closed", reason: "canceled" };

  var SERVICE_DISPOSITION = {
    ACTIVE: { kind: "completion", completion: "active" },
    SUSPENDED: { kind: "reference", banner: "suspended" },
    COMPLETED: { kind: "reference", banner: "expired" },
  };

  var AGREEMENT_DISPOSITION = {
    QUOTATION: { kind: "unavailable", reason: "retired" },
    QUOTATION_SENT: { kind: "unavailable", reason: "retired" },
    QUOTATION_UPDATE: { kind: "unavailable", reason: "retired" },
    QUOTATION_SEND_FAILED: { kind: "unavailable", reason: "retired" },
    AWAITING_CLIENT_DETAILS: { kind: "unavailable", reason: "retired" },
    CLIENT_DETAILS_RECEIVED: { kind: "unavailable", reason: "retired" },
    DRAFT: { kind: "preparing" },
    PENDING_MANAGEMENT_APPROVAL: { kind: "preparing" },
    INTERNALLY_APPROVED: { kind: "preparing" },
    SENT_TO_CLIENT: { kind: "agreement-review" },
    CLIENT_CHANGES_REQUESTED: { kind: "reference", banner: "changes" },
    AGREEMENT_SEND_FAILED: { kind: "unavailable", reason: "send-failed" },
    CLIENT_APPROVED: { kind: "completion", completion: "approved" },
    ACTIVATION_FAILED: { kind: "completion", completion: "finishing" },
    ACTIVE: { kind: "unavailable", reason: "retired" },
    SUSPENDED: { kind: "unavailable", reason: "retired" },
    EXPIRED: { kind: "unavailable", reason: "retired" },
    ARCHIVED: { kind: "closed", reason: "archived" },
    CANCELED: { kind: "closed", reason: "canceled" },
    ACCESS_CLEANUP_RETRY: { kind: "closed", reason: "canceled" },
  };

  function text(value) {
    if (typeof value === "string") return value.trim();
    if (typeof value === "number" && isFinite(value)) return String(value);
    return "";
  }

  function positiveInteger(value) {
    if (value === null || value === undefined || value === "" || typeof value === "boolean") return null;
    var number = Number(value);
    return Number.isInteger(number) && number > 0 ? number : null;
  }

  function finiteOrNull(value) {
    if (value === null || value === undefined || value === "" || typeof value === "boolean") return null;
    var number = Number(value);
    return isFinite(number) ? number : null;
  }

  function ascending(left, right) {
    if (left < right) return -1;
    if (left > right) return 1;
    return 0;
  }

  function localizedText(nls, locale, key) {
    if (!nls || typeof nls !== "object") return "";
    var language = String(locale || "en").split("-")[0];
    var bag = nls[locale] || nls[language] || nls.en || nls[Object.keys(nls)[0]];
    if (!bag || typeof bag !== "object") return "";
    return text(bag[key]).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  }

  function localizedName(nls, locale) {
    return localizedText(nls, locale, "NAME") || localizedText(nls, locale, "name");
  }

  function attributeEntry(row, code) {
    var buckets = row && row.attributes;
    if (!buckets || typeof buckets !== "object") return null;
    var keys = Object.keys(buckets);
    for (var index = 0; index < keys.length; index += 1) {
      var bucket = buckets[keys[index]];
      if (bucket && typeof bucket === "object" && Object.prototype.hasOwnProperty.call(bucket, code)) return bucket[code];
    }
    return null;
  }

  function attributeValue(row, code) {
    var entry = attributeEntry(row, code);
    if (entry && typeof entry === "object" && !Array.isArray(entry)) return entry.value;
    return entry === null ? undefined : entry;
  }

  function attributeText(row, code) {
    return text(attributeValue(row, code));
  }

  function idList(value) {
    var source = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : value === null || value === undefined ? [] : [value];
    var ids = [];
    source.forEach(function (item) {
      var id = positiveInteger(item && typeof item === "object" ? item.id : item);
      if (id && ids.indexOf(id) === -1) ids.push(id);
    });
    return ids;
  }

  function mediaId(value) {
    var id = text(value);
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id) ? id.toLowerCase() : "";
  }

  function mediaIds(value) {
    var source = value;
    if (typeof source === "string" && /^\s*\[/.test(source)) {
      try {
        source = JSON.parse(source);
      } catch (_) {
        return null;
      }
    }
    var list = Array.isArray(source) ? source : source === null || source === undefined || source === "" ? [] : [source];
    var ids = [];
    var invalid = false;
    list.forEach(function (entry) {
      var id = mediaId(entry && typeof entry === "object" ? entry.id : entry);
      if (!id) invalid = true;
      else if (ids.indexOf(id) === -1) ids.push(id);
    });
    return invalid ? null : ids;
  }

  function planReference(values) {
    var ids = [];
    var invalid = false;
    values.forEach(function (value) {
      var found = mediaIds(value);
      if (!found) invalid = true;
      else found.forEach(function (id) { if (ids.indexOf(id) === -1) ids.push(id); });
    });
    return !invalid && ids.length === 1 ? ids[0] : "";
  }

  function pathValue(row, path) {
    var value = row;
    path.split(".").forEach(function (key) {
      value = value && typeof value === "object" ? value[key] : undefined;
    });
    return value;
  }

  function addressText(row, format) {
    if (!row || typeof row !== "object") return "";
    var parts = [];
    var seen = [];
    format.parts.forEach(function (path) {
      var part = text(pathValue(row, path));
      var folded = part.toLowerCase();
      if (!part || seen.indexOf(folded) !== -1) return;
      seen.push(folded);
      parts.push(part);
    });
    return parts.length ? parts.join(format.separator) : text(row[format.fallback]);
  }

  function propertyAddress(resource, addresses, contract) {
    var value = attributeValue(resource, contract.propertyAttributes.address);
    var id = positiveInteger(value && typeof value === "object" ? value.id : value);
    return id && addresses[id] ? addressText(addresses[id], contract.addressFormat) : "";
  }

  function stateCode(row, known) {
    var codes = [];
    var states = row && Array.isArray(row.states) ? row.states : [];
    states.forEach(function (entry) {
      var code = text(entry && typeof entry === "object" ? entry.code : entry);
      if (code && known.indexOf(code) !== -1 && codes.indexOf(code) === -1) codes.push(code);
    });
    if (!codes.length && row && row.state && typeof row.state === "object") {
      var single = text(row.state.code);
      if (known.indexOf(single) !== -1) codes.push(single);
    }
    return codes.length === 1 ? codes[0] : "";
  }

  function presentedAgreementState(row, contract) {
    var state = stateCode(row, contract.agreementStates);
    var spec = contract.agreementOperationStatus;
    var metadata = row && row.metadata;
    if (!spec || !metadata || typeof metadata !== "object") return state;
    var status = text(metadata[spec.key]);
    var presented = spec.presentedStates && Object.prototype.hasOwnProperty.call(spec.presentedStates, state) ? spec.presentedStates[state] : null;
    return presented && status && Object.prototype.hasOwnProperty.call(presented, status) ? presented[status] : state;
  }

  function entityKind(entityType) {
    var tail = text(entityType).split(".").pop() || "";
    var compact = tail.replace(/[^A-Za-z]/g, "").toLowerCase();
    if (compact === "orderitem") return "order-item";
    if (compact === "productprice") return "product-price";
    return compact;
  }

  function eventCodeOf(entry) {
    var code = text(entry && typeof entry === "object" ? entry.code : entry);
    var separator = code.lastIndexOf(":");
    return separator === -1 ? code : code.slice(separator).replace(/^:/, "");
  }

  function grantOf(raw) {
    var grant = { expiresAt: raw && typeof raw.expiresAt === "string" ? raw.expiresAt : "", entities: {} };
    var types = raw && Array.isArray(raw.types) ? raw.types : [];
    types.forEach(function (type) {
      if (!type || typeof type !== "object") return;
      var kind = entityKind(type.entityType);
      if (!kind) return;
      var slot = grant.entities[kind] || (grant.entities[kind] = { readable: false, writable: false, events: [], entries: {} });
      var events = (Array.isArray(type.events) ? type.events : []).map(eventCodeOf).filter(Boolean);
      var scoped = idList(type.entityIds !== undefined ? type.entityIds : type.entityId);
      if (type.canRead === true) slot.readable = true;
      if (type.canWrite === true) slot.writable = true;
      if (scoped.length) {
        scoped.forEach(function (id) {
          var bucket = slot.entries[id] || (slot.entries[id] = []);
          events.forEach(function (code) { if (bucket.indexOf(code) === -1) bucket.push(code); });
        });
        return;
      }
      events.forEach(function (code) { if (slot.events.indexOf(code) === -1) slot.events.push(code); });
    });
    return grant;
  }

  function canRead(grant, kind) {
    return Boolean(grant && grant.entities && grant.entities[kind] && grant.entities[kind].readable);
  }

  function eventGranted(grant, kind, id, code) {
    var slot = grant && grant.entities && grant.entities[kind];
    if (!slot) return false;
    if (slot.events.indexOf(code) !== -1) return true;
    var entry = slot.entries[id];
    return Boolean(entry && entry.indexOf(code) !== -1);
  }

  function formatMoney(value, currency, locale) {
    var number = finiteOrNull(value);
    if (number === null) return "";
    var code = /^[A-Z]{3}$/.test(text(currency)) ? text(currency) : "";
    var digits = { minimumFractionDigits: 2, maximumFractionDigits: 6 };
    try {
      if (code) return new Intl.NumberFormat(locale, { style: "currency", currency: code, minimumFractionDigits: 2, maximumFractionDigits: 6 }).format(number);
    } catch (_) {
      return new Intl.NumberFormat(locale, digits).format(number);
    }
    return new Intl.NumberFormat(locale, digits).format(number);
  }

  function formatQuantity(value, locale) {
    var number = finiteOrNull(value);
    if (number === null) return "";
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 6 }).format(number);
  }

  function formatArea(value, locale) {
    var number = finiteOrNull(value);
    if (number === null || number <= 0) return "";
    return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(number);
  }

  function formatDate(value, locale) {
    var date = null;
    var utc = false;
    if (typeof value === "number" && isFinite(value)) {
      date = new Date(value);
    } else if (typeof value === "string" && value.trim()) {
      var day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
      if (day) {
        date = new Date(Date.UTC(Number(day[1]), Number(day[2]) - 1, Number(day[3])));
        utc = true;
      } else {
        date = new Date(value.trim());
      }
    }
    if (!date || !isFinite(date.getTime())) return "";
    try {
      return new Intl.DateTimeFormat(locale, utc ? { dateStyle: "medium", timeZone: "UTC" } : { dateStyle: "medium" }).format(date);
    } catch (_) {
      return "";
    }
  }

  function decodeEntities(value) {
    return value.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, function (match, name) {
      var lower = name.toLowerCase();
      if (lower === "amp") return "&";
      if (lower === "lt") return "<";
      if (lower === "gt") return ">";
      if (lower === "quot") return "\"";
      if (lower === "apos") return "'";
      if (lower === "nbsp") return " ";
      var point = lower.charAt(1) === "x" ? parseInt(lower.slice(2), 16) : parseInt(lower.slice(1), 10);
      return isFinite(point) && point > 0 && point <= 1114111 ? String.fromCodePoint(point) : match;
    });
  }

  function termsBlocks(value) {
    var source = typeof value === "string" ? value.replace(/\r\n?/g, "\n") : "";
    if (!source.trim()) return [];
    if (/<\/?[a-z][^>]*>/i.test(source)) {
      source = decodeEntities(source
        .replace(/<\s*br\s*\/?\s*>/gi, "\n")
        .replace(/<\s*h[1-6](\s[^>]*)?>/gi, "\n\n# ")
        .replace(/<\s*li(\s[^>]*)?>/gi, "\n- ")
        .replace(/<\s*\/\s*(p|div|h[1-6]|ul|ol|li|section|article|blockquote|table|tr)\s*>/gi, "\n\n")
        .replace(/<\s*(p|div|ul|ol|section|article|blockquote|table|tr)(\s[^>]*)?>/gi, "\n\n")
        .replace(/<[^>]*>/g, ""));
    }
    var blocks = [];
    source.split(/\n[ \t]*\n+/).forEach(function (chunk) {
      var paragraph = [];
      var clause = null;
      function flush() {
        if (paragraph.length) blocks.push({ kind: "paragraph", text: paragraph.join("\n") });
        paragraph = [];
      }
      chunk.split("\n").forEach(function (line) {
        var trimmed = line.replace(/\s+/g, " ").trim();
        if (!trimmed) return;
        var heading = /^#{1,6}\s+(.+)$/.exec(trimmed);
        var item = /^[-*•]\s+(.+)$/.exec(trimmed);
        var numbered = heading || item ? null : clauseOf(trimmed);
        if (heading) {
          flush();
          clause = null;
          blocks.push({ kind: "heading", text: heading[1] });
        } else if (item) {
          flush();
          clause = null;
          blocks.push({ kind: "item", text: item[1] });
        } else if (numbered) {
          flush();
          clause = numbered;
          blocks.push(clause);
        } else if (clause) {
          clause.text += "\n" + trimmed;
        } else {
          paragraph.push(trimmed);
        }
      });
      flush();
    });
    return blocks;
  }

  var LANGUAGE_ALIASES = { eng: "en", fre: "fr", fra: "fr", rus: "ru", spa: "es", heb: "he", kaz: "kk", chi: "zh", zho: "zh", ara: "ar" };

  function languageTag(language) {
    var code = text(language && typeof language === "object" ? language.code2 || language.id : language).toLowerCase();
    return LANGUAGE_ALIASES[code] || code;
  }

  function agreementTermsText(agreement, contents, locale, contract) {
    var spec = contract.agreementContent;
    var agreementId = positiveInteger(agreement && agreement.id);
    var written = (Array.isArray(contents) ? contents : []).filter(function (row) {
      var owner = row && row[spec.document];
      return agreementId && positiveInteger(owner && typeof owner === "object" ? owner.id : owner) === agreementId && text(row[spec.text]);
    }).sort(function (left, right) { return ascending(positiveInteger(left.id) || 0, positiveInteger(right.id) || 0); });
    var wanted = text(locale).toLowerCase().split("-")[0];
    var chosen = written.filter(function (row) { return languageTag(row[spec.language]) === wanted; })[0] || written[0];
    return chosen ? text(chosen[spec.text]) : "";
  }

  function clauseOf(line) {
    var match = /^(\d{1,3}(?:\.\d{1,3})*)([.)]?)\s+(.+)$/.exec(line);
    if (!match || (!match[2] && match[1].indexOf(".") === -1)) return null;
    return { kind: "clause", number: match[1] + match[2], depth: match[1].split(".").length, text: match[3] };
  }

  function inputTokens(inputFormat) {
    return String(inputFormat || "").split(/[\s;]+/).filter(Boolean);
  }

  function fieldOf(definition, locale) {
    var tokens = inputTokens(definition.inputFormat);
    var choices = (Array.isArray(definition.options) ? definition.options : []).map(function (option) {
      var value = text(option && option.value);
      return { value: value, label: localizedName(option && option.nls, locale) || value };
    }).filter(function (option) { return option.value; });
    var kind = "text";
    if (choices.length) kind = tokens.indexOf("expanded") !== -1 ? "radio" : "select";
    else if (/Boolean$|^boolean$/.test(text(definition.className))) kind = "boolean";
    else if (tokens.indexOf("address") !== -1) kind = "address";
    else if (tokens.indexOf("textarea") !== -1) kind = "textarea";
    else if (tokens.indexOf("email") !== -1) kind = "email";
    else if (tokens.indexOf("tel") !== -1) kind = "tel";
    return {
      code: definition.code,
      kind: kind,
      label: localizedName(definition.nls, locale) || definition.code,
      description: localizedText(definition.nls, locale, "DESCRIPTION"),
      required: definition.required === true,
      choices: choices,
    };
  }

  function detailFields(definition, locale) {
    var attributes = definition && Array.isArray(definition.attributes) ? definition.attributes : [];
    var byCode = {};
    attributes.forEach(function (attribute) { if (attribute && attribute.code) byCode[attribute.code] = attribute; });
    var ordered = [];
    var hidden = [];
    (definition && Array.isArray(definition.attributeOrder) ? definition.attributeOrder : []).forEach(function (entry) {
      Object.keys(entry || {}).forEach(function (group) {
        (Array.isArray(entry[group]) ? entry[group] : []).forEach(function (row) {
          var code = row && row.attributeCode;
          if (!byCode[code] || ordered.indexOf(code) !== -1 || hidden.indexOf(code) !== -1) return;
          if (row.visible === false) hidden.push(code);
          else ordered.push(code);
        });
      });
    });
    attributes.forEach(function (attribute) {
      if (attribute && ordered.indexOf(attribute.code) === -1 && hidden.indexOf(attribute.code) === -1) ordered.push(attribute.code);
    });
    var askedFirst = definition && Array.isArray(definition.requiredBeforeAccept) ? definition.requiredBeforeAccept : [];
    return ordered.map(function (code) {
      var field = fieldOf(byCode[code], locale);
      if (askedFirst.indexOf(code) !== -1) field.askedFirst = true;
      return field;
    });
  }

  function legalContact(account) {
    var contacts = account && Array.isArray(account.contacts)
      ? account.contacts.filter(function (contact) { return contact && typeof contact === "object"; })
      : [];
    return contacts.filter(function (contact) { return text(contact.type && contact.type.code).toUpperCase() === "LEGAL"; }).sort(function(a,b){return Number(a.id)-Number(b.id);})[0] || null;
  }

  function contactEntry(contact, typeCode) {
    var entries = (contact && Array.isArray(contact.contactEntries) ? contact.contactEntries : []).filter(function(entry){return entry && text(entry.type && entry.type.code).toUpperCase() === typeCode && text(entry.value);});
    function unique(rows) { var values=[]; rows.forEach(function(entry){var value=text(entry.value);if(values.indexOf(value)<0)values.push(value);});return values; }
    for(var i=0;i<2;i++){var kind=["PRIMARY","WORK"][i];var selected=unique(entries.filter(function(entry){return text(entry.kind && entry.kind.code).toUpperCase() === kind;}));if(selected.length)return selected.length===1?selected[0]:"";}
    var values=unique(entries);return values.length===1?values[0]:"";
  }

  function primaryEmail(account) { return contactEntry(legalContact(account),"EMAIL"); }

  function formatAddress(address, locale) {
    if (!address || typeof address !== "object") return "";
    var region = text(address.state && address.state.code) || localizedName(address.state && address.state.nls, locale);
    var country = localizedName(address.country && address.country.nls, locale) || text(address.country && address.country.code);
    var regionLine = [region, text(address.postalCode)].filter(Boolean).join(" ");
    var cityLine = [text(address.city), regionLine].filter(Boolean).join(", ");
    return [text(address.address1), text(address.address2), cityLine, country].filter(Boolean).join(", ");
  }

  function typedAddress(account, typeCode, locale) {
    var entries = account && Array.isArray(account.addresses) ? account.addresses : [];
    var found = entries.filter(function (entry) {
      return entry && Array.isArray(entry.types) && entry.types.some(function (type) {
        return text(type && type.code).toUpperCase() === typeCode;
      });
    })[0];
    return found ? formatAddress(found.address, locale) : "";
  }

  function billingAddress(account, locale) {
    return typedAddress(account, "BILLING", locale);
  }

  function detailsPrefill(account, fields, locale, contract) {
    var values = {};
    if (!account || typeof account !== "object") return values;
    var contact = legalContact(account);
    var derived = {
      CLIENT_TYPE: attributeText(account, "LEGAL_ENTITY_TYPE"),
      LEGAL_NAME: localizedName(account.nls, locale),
      BILLING_ADDRESS: billingAddress(account, locale),
      LEGAL_ADDRESS: typedAddress(account, "LEGAL", locale),
      REPRESENTATIVE_FIRST_NAME: contact ? text(contact.firstName) : "",
      REPRESENTATIVE_JOB_TITLE: contact ? text(contact.title) : "",
      REPRESENTATIVE_LAST_NAME: contact ? text(contact.lastName) : "",
      REPRESENTATIVE_EMAIL: contactEntry(contact, "EMAIL"),
      REPRESENTATIVE_PHONE: contactEntry(contact, "PHONE"),
    };
    fields.forEach(function (field) {
      if (field.kind === "boolean") return;
      var value = text(derived[field.code]);
      if (!value) return;
      if (field.choices.length && !field.choices.some(function (option) { return option.value === value; })) return;
      values[field.code] = value;
    });
    return values;
  }

  function telHref(value) {
    var match = /^(\+?[\d\s().-]+?)(?:\s*(?:ext\.?|x)\s*\d+)?$/i.exec(value);
    var number = match ? match[1].replace(/[^\d+]/g, "") : "";
    return number.replace(/\D/g, "").length < 3 ? "" : "tel:" + number;
  }

  function mailHref(value) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "";
    return "mailto:" + encodeURIComponent(value).replace(/%40/g, "@");
  }

  function contactOf(provider) {
    return { name: provider, phone: "", phoneHref: "", email: "", emailHref: "" };
  }

  function partiesOf(agreement, account, fields, locale, contract) {
    var owner = agreement && agreement[contract.rawShape.documentOwner];
    var contact = legalContact(account);
    var typeField = fields.filter(function (field) { return field.code === "CLIENT_TYPE"; })[0];
    var typeValue = attributeText(account, "LEGAL_ENTITY_TYPE");
    var typeChoice = typeField ? typeField.choices.filter(function (option) { return option.value === typeValue; })[0] : null;
    var first = contact ? text(contact.firstName) : "";
    var last = contact ? text(contact.lastName) : "";
    return {
      provider: {
        legalName: localizedName(owner && owner.nls, locale),
        representativeName: "",
        representativeJobTitle: "",
        logo: "",
      },
      client: {
        legalName: localizedName(account && account.nls, locale),
        clientType: typeChoice ? typeChoice.label : "",
        billingAddress: billingAddress(account, locale),
        representativeName: [first, last].filter(Boolean).join(" "),
        representativeJobTitle: contact ? text(contact.title) : "",
        email: contactEntry(contact, "EMAIL"),
        phone: contactEntry(contact, "PHONE"),
      },
    };
  }

  function rowsById(rows) {
    var found = {};
    (Array.isArray(rows) ? rows : []).forEach(function (row) {
      var id = positiveInteger(row && row.id);
      if (id && !found[id]) found[id] = row;
    });
    return found;
  }

  function referenced(value, rows) {
    if (!value || typeof value !== "object") return null;
    var id = positiveInteger(value.id);
    return id && rows[id] ? rows[id] : value;
  }

  function priceTypeCode(price) {
    return text(price && price.type && price.type.code).toUpperCase();
  }

  function recurrentPrice(price) {
    return /(^|_)RECURRENT$/.test(priceTypeCode(price));
  }

  function intervalMonths(line, variants) {
    var metadata = line[variants.lineMetadata];
    if (!metadata || typeof metadata !== "object") return null;
    if (text(metadata[variants.intervalUnit]).toUpperCase() !== variants.monthUnit) return null;
    return positiveInteger(metadata[variants.intervalCount]);
  }

  function priceIntervalMonths(price, units, variants) {
    var interval = attributeEntry(price, variants.priceInterval);
    if (!interval || typeof interval !== "object") return null;
    var reference = interval[variants.priceIntervalUnit];
    var unitId = positiveInteger(reference && typeof reference === "object" ? reference.id : reference);
    var unit = unitId && units ? units[unitId] : null;
    if (!unit || text(unit.code).toUpperCase() !== variants.monthUnit) return null;
    return positiveInteger(interval.value);
  }

  function recurringModel(months, variants) {
    var first = months[0];
    var shared = first !== null && months.every(function (count) { return count === first; });
    if (!shared) return variants.recurring;
    return first === 1 ? variants.monthly : variants.seasonal;
  }

  function priceVariant(row, context) {
    var contract = context.contract;
    var variants = contract.priceVariants;
    var raw = row && Array.isArray(row[contract.rawShape.orderLines]) ? row[contract.rawShape.orderLines] : [];
    var lines = raw
      .map(function (line) { return referenced(line, context.catalog.orderItems); })
      .filter(function (line) { return line && typeof line === "object"; });
    if (!lines.length) return { model: "", name: "" };
    var prices = lines.map(function (line) { return referenced(line.itemPrice, context.catalog.productPrices); });
    var names = lines.map(function (line, index) {
      return localizedName(prices[index] && prices[index].nls, context.locale) || localizedName(line.itemPrice && line.itemPrice.nls, context.locale);
    });
    var name = names[0] && names.every(function (entry) { return entry === names[0]; }) ? names[0] : "";
    var typed = prices.every(function (price) { return Boolean(priceTypeCode(price)); });
    var recurrent = prices.filter(recurrentPrice).length;
    var model = "";
    if (typed && recurrent === 0) model = variants.perService;
    if (typed && recurrent === prices.length) {
      model = recurringModel(lines.map(function (line, index) {
        var months = priceIntervalMonths(prices[index], context.catalog.units, variants);
        return months !== null ? months : intervalMonths(line, variants);
      }), variants);
    }
    return { model: model, name: name };
  }

  function linesOf(row, currency, locale, contract, catalog) {
    var raw = row && Array.isArray(row[contract.rawShape.orderLines]) ? row[contract.rawShape.orderLines] : [];
    return raw
      .map(function (line, position) {
        var resolved = referenced(line, catalog.orderItems);
        return { line: resolved, position: position, rank: resolved ? finiteOrNull(resolved.sortOrder) : null };
      })
      .filter(function (entry) { return entry.line && typeof entry.line === "object"; })
      .sort(function (left, right) {
        if (left.rank === null && right.rank === null) return ascending(left.position, right.position);
        if (left.rank === null) return 1;
        if (right.rank === null) return -1;
        return ascending(left.rank, right.rank) || ascending(left.position, right.position);
      })
      .map(function (entry) {
        var line = entry.line;
        var price = referenced(line.itemPrice, catalog.productPrices);
        var product = referenced(price && price.product, catalog.products);
        var lineId = positiveInteger(line.id);
        return {
          key: lineId ? "line-" + lineId : "position-" + entry.position,
          product: localizedName(product && product.nls, locale) || localizedName(price && price.product && price.product.nls, locale) || localizedName(price && price.nls, locale),
          quantity: formatQuantity(line.itemCount, locale),
          unitPrice: formatMoney(line.amount, currency, locale),
          recurrent: recurrentPrice(price),
        };
      });
  }

  function recordedModel(row, contract) {
    var metadata = row && row.metadata && typeof row.metadata === "object" ? row.metadata : {};
    var candidates = [text(metadata[contract.orderMetadata.pricingModel]), attributeText(row, contract.orderAttributes.pricingModel)];
    return candidates.map(function (value) { return value.toUpperCase(); }).filter(function (value) {
      return contract.pricingModels.indexOf(value) !== -1;
    })[0] || "";
  }

  function pricingDisplay(model, lines, contract) {
    var variants = contract.priceVariants;
    if (model === variants.perService) return { linePrices: true, total: false };
    var recurring = [variants.monthly, variants.seasonal, variants.recurring].indexOf(model) !== -1;
    if (recurring || (lines.length > 0 && lines.every(function (line) { return line.recurrent; }))) return { linePrices: false, total: true };
    return { linePrices: true, total: true };
  }

  function totalBeforeTaxes(row) {
    if (finiteOrNull(row.totalCharges) !== null) return row.totalCharges;
    return finiteOrNull(row.totalTaxes) ? null : row.grandTotal;
  }

  function optionOf(row, position, context) {
    var contract = context.contract;
    var id = positiveInteger(row.id);
    var state = stateCode(row, contract.orderStates);
    var status = ORDER_STATUS[state] || "unknown";
    var currency = text(row.currency && row.currency.code);
    var statedModel = recordedModel(row, contract);
    var variant = statedModel ? { model: statedModel, name: "" } : priceVariant(row, context);
    var priced = PRICED_STATUSES.indexOf(status) !== -1;
    var lines = priced ? linesOf(row, currency, context.locale, contract, context.catalog) : [];
    return {
      id: id,
      recordKey: "order:" + id,
      position: position,
      model: variant.model,
      priceName: variant.name,
      state: state,
      status: status,
      priced: priced,
      lines: lines,
      recurrent: lines.length > 0 && lines.every(function (line) { return line.recurrent; }),
      pricing: pricingDisplay(variant.model, lines, contract),
      total: priced ? formatMoney(totalBeforeTaxes(row), currency, context.locale) : "",
      awaitingClient: state === contract.orderEvents.approve.source,
      siblingApproved: false,
      actions: { approve: false, decline: false, changes: false },
    };
  }

  function propertyStatus(options) {
    var statuses = options.map(function (option) { return option.status; });
    if (statuses.indexOf("approved") !== -1) return "approved";
    if (statuses.length && statuses.every(function (status) { return status === "declined"; })) return "declined";
    if (statuses.length && statuses.every(function (status) { return status === "declined" || status === "cancelled"; })) return "cancelled";
    if (statuses.indexOf("changes") !== -1 || statuses.indexOf("revising") !== -1) return "changes";
    if (statuses.indexOf("new") !== -1) return "awaiting";
    return "unknown";
  }

  function propertiesOf(rows, context) {
    var contract = context.contract;
    var groups = [];
    var byKey = {};
    rows.forEach(function (row) {
      var propertyId = positiveInteger(attributeValue(row, contract.orderAttributes.property));
      var key = propertyId ? "property-" + propertyId : "order-" + row.id;
      var group = byKey[key];
      if (!group) {
        group = byKey[key] = { key: key, resource: propertyId ? context.catalog.resources[propertyId] || null : null, rows: [] };
        groups.push(group);
      }
      group.rows.push(row);
    });
    return groups.map(function (group) {
      var options = group.rows.map(function (row, index) { return optionOf(row, index + 1, context); });
      options.forEach(function (option) {
        option.siblingApproved = options.some(function (other) { return other.id !== option.id && other.status === "approved"; });
      });
      return {
        key: group.key,
        address: group.resource ? propertyAddress(group.resource, context.catalog.addresses, contract) : "",
        plan: group.resource ? planReference([attributeValue(group.resource, contract.propertyAttributes.plan)]) : "",
        area: group.resource ? formatArea(attributeValue(group.resource, contract.propertyAttributes.area), context.locale) : "",
        options: options,
        status: propertyStatus(options),
      };
    });
  }

  function approvalsOffered(properties) {
    return properties.some(function (property) {
      return property.options.some(function (option) {
        return option.actions.approve;
      });
    });
  }

  function grantActions(properties, grant, contract) {
    var events = contract.orderEvents;
    properties.forEach(function (property) {
      property.options.forEach(function (option) {
        function allowed(event) {
          return !option.siblingApproved && option.state === event.source && eventGranted(grant, "order", option.id, event.code);
        }
        option.actions = {
          approve: allowed(events.approve),
          decline: allowed(events.decline),
          changes: allowed(events.changes),
        };
      });
    });
  }

  function summaryOf(properties) {
    var counts = { properties: properties.length, awaiting: 0, approved: 0, declined: 0, changes: 0 };
    properties.forEach(function (property) {
      if (["awaiting", "approved", "declined", "changes"].indexOf(property.status) !== -1) counts[property.status] += 1;
    });
    return counts;
  }

  function pickAgreement(rows, contract) {
    var documents = (Array.isArray(rows) ? rows : []).filter(function (row) {
      return row && typeof row === "object" && positiveInteger(row.id);
    });
    var typed = documents.filter(function (row) { return text(row.type && row.type.code) === contract.agreementType; });
    var untyped = documents.filter(function (row) { return !text(row.type && row.type.code); });
    var candidates = typed.length ? typed : untyped;
    if (candidates.length === 1) return { row: candidates[0], ambiguous: false };
    return { row: null, ambiguous: candidates.length > 1 };
  }

  function pickAccount(accounts, agreement, contract) {
    var rows = (Array.isArray(accounts) ? accounts : []).filter(function (row) { return row && typeof row === "object"; });
    var clientId = positiveInteger(attributeValue(agreement, contract.agreementAttributes.client));
    var matched = clientId ? rows.filter(function (row) { return positiveInteger(row.id) === clientId; })[0] : null;
    return matched || (rows.length === 1 ? rows[0] : null);
  }

  function packageOrderIds(documents, contract) {
    var picked = pickAgreement(documents, contract);
    if (!picked.row || attributeEntry(picked.row, contract.agreementAttributes.orders) === null) return null;
    return idList(attributeValue(picked.row, contract.agreementAttributes.orders));
  }

  function documentRooted(input) {
    return canRead(input.grant, "document") || (Array.isArray(input.documents) && input.documents.length > 0);
  }

  function pickRound(orders, contract) {
    var rounds = [];
    (Array.isArray(orders) ? orders : []).forEach(function (row) {
      var round = attributeText(row, contract.orderAttributes.quotationRound);
      if (round && rounds.indexOf(round) === -1) rounds.push(round);
    });
    return { round: rounds.length === 1 ? rounds[0] : "", ambiguous: rounds.length > 1 };
  }

  function requestLocale(input, fallback, contract) {
    var picked = pickAgreement(input.documents, contract);
    var account = picked.row || !documentRooted(input) ? pickAccount(input.accounts, picked.row, contract) : null;
    var contact = legalContact(account);
    var language = contact && contact.language;
    var code = language && (language.code2 || language.id);
    code = LANGUAGE_ALIASES[code] || code;
    return typeof code === "string" && /^[a-z]{2,3}(?:-[A-Za-z0-9]+)*$/.test(code) ? code : fallback;
  }

  function catalogOf(input) {
    return {
      orderItems: rowsById(input.orderItems),
      productPrices: rowsById(input.productPrices),
      products: rowsById(input.products),
      resources: rowsById(input.resources),
      addresses: rowsById(input.addresses),
      units: rowsById(input.units),
    };
  }

  function summarized(properties) {
    return {
      summary: summaryOf(properties),
      allDecided: properties.length > 0 && properties.every(function (property) {
        return property.status === "approved" || property.status === "declined" || property.status === "cancelled";
      }),
    };
  }

  function roundModel(input, grant, locale, contract, expiresAt) {
    var ordersById = rowsById(input.orders);
    var orders = Object.keys(ordersById).map(Number).sort(ascending).map(function (id) { return ordersById[id]; });
    if (!orders.length) return { kind: "empty", reason: "no-orders", expiresAt: expiresAt };
    var picked = pickRound(orders, contract);
    if (picked.ambiguous) return { kind: "unavailable", reason: "ambiguous-round", expiresAt: expiresAt };
    var account = pickAccount(input.accounts, null, contract);
    var properties = propertiesOf(orders, { locale: locale, contract: contract, catalog: catalogOf(input) });
    grantActions(properties, grant, contract);
    var decided = summarized(properties);
    var fields = detailFields(contract.contractDetails, locale);
    return {
      kind: "quote-review",
      reason: "",
      banner: "",
      completion: "",
      expiresAt: expiresAt,
      round: picked.round,
      agreement: null,
      names: { provider: "", client: localizedName(account && account.nls, locale) },
      parties: null,
      contact: null,
      properties: properties,
      summary: decided.summary,
      allDecided: decided.allDecided,
      unreadableOrders: 0,
      accountUnavailable: Boolean(input.accountFailed),
      details: {
        available: approvalsOffered(properties),
        fields: fields,
        prefill: detailsPrefill(account, fields, locale, contract),
      },
      canApproveAgreement: false,
      canRequestAgreementChanges: false,
      primaryEmail: primaryEmail(account, contract),
    };
  }

  function serviceDisposition(orders, contract) {
    var states = orders.map(function (row) { return stateCode(row, contract.orderStates); });
    var found = Object.keys(SERVICE_DISPOSITION).filter(function (code) { return states.indexOf(code) !== -1; })[0];
    if (found) return SERVICE_DISPOSITION[found];
    return states.length && states.every(function (code) { return code === CANCELED_ORDER_STATE; }) ? CANCELED_SERVICE : null;
  }

  function reviewModel(input, options) {
    var locale = options.locale;
    var contract = options.contract;
    var grant = input.grant || grantOf(null);
    var expiresAt = formatDate(grant.expiresAt, locale);
    if (!documentRooted(input)) return roundModel(input, grant, locale, contract, expiresAt);
    var picked = pickAgreement(input.documents, contract);
    if (!picked.row) {
      return {
        kind: picked.ambiguous ? "unavailable" : "empty",
        reason: picked.ambiguous ? "ambiguous" : "no-agreement",
        expiresAt: expiresAt,
      };
    }

    var agreement = picked.row;
    var agreementId = positiveInteger(agreement.id);
    var state = presentedAgreementState(agreement, contract);
    var account = pickAccount(input.accounts, agreement, contract);
    var fields = detailFields(contract.contractDetails, locale);
    var parties = partiesOf(agreement, account, fields, locale, contract);

    var ordersById = {};
    (Array.isArray(input.orders) ? input.orders : []).forEach(function (row) {
      var id = positiveInteger(row && row.id);
      if (id && !ordersById[id]) ordersById[id] = row;
    });
    var listed = packageOrderIds([agreement], contract);
    var wanted = listed || Object.keys(ordersById).map(Number).sort(ascending);
    var readable = [];
    var unreadable = 0;
    wanted.forEach(function (id) {
      if (ordersById[id]) readable.push(ordersById[id]);
      else unreadable += 1;
    });

    var disposition = (state === SIGNED_AGREEMENT_STATE && serviceDisposition(readable, contract))
      || AGREEMENT_DISPOSITION[state] || { kind: "unavailable", reason: "unknown-state" };
    var properties = propertiesOf(readable, { locale: locale, contract: contract, catalog: catalogOf(input) });
    var decided = summarized(properties);
    var approveEvent = contract.agreementEvents.approve;
    var changesEvent = contract.agreementEvents.changes;

    return {
      kind: disposition.kind,
      reason: disposition.reason || "",
      banner: disposition.banner || "",
      completion: disposition.completion || "",
      expiresAt: expiresAt,
      agreement: {
        id: agreementId,
        recordKey: "document:" + agreementId,
        state: state,
        effectiveDate: formatDate(attributeValue(agreement, contract.agreementAttributes.effectiveDate), locale),
        termStart: formatDate(attributeValue(agreement, contract.agreementAttributes.termStart), locale),
        termEnd: formatDate(attributeValue(agreement, contract.agreementAttributes.termEnd), locale),
        terms: termsBlocks(agreementTermsText(agreement, input.contents, locale, contract)),
      },
      names: {
        provider: parties.provider.legalName,
        client: localizedName(account && account.nls, locale) || parties.client.legalName,
      },
      parties: parties,
      contact: contactOf(parties.provider.legalName),
      properties: properties,
      summary: decided.summary,
      allDecided: decided.allDecided,
      unreadableOrders: unreadable,
      accountUnavailable: Boolean(input.accountFailed),
      details: { available: false, fields: [], prefill: {} },
      canApproveAgreement: state === approveEvent.source && eventGranted(grant, "document", agreementId, approveEvent.code),
      canRequestAgreementChanges: state === changesEvent.source && eventGranted(grant, "document", agreementId, changesEvent.code),
      primaryEmail: primaryEmail(account, contract),
    };
  }

  ns.normalizer = Object.freeze({
    orderStatus: Object.freeze(Object.assign({}, ORDER_STATUS)),
    agreementDisposition: Object.freeze(Object.assign({}, AGREEMENT_DISPOSITION)),
    serviceDisposition: Object.freeze(Object.assign({}, SERVICE_DISPOSITION)),
    positiveInteger: positiveInteger,
    localizedName: localizedName,
    planReference: planReference,
    addressText: addressText,
    attributeValue: attributeValue,
    idList: idList,
    stateCode: stateCode,
    entityKind: entityKind,
    grantOf: grantOf,
    canRead: canRead,
    eventGranted: eventGranted,
    formatMoney: formatMoney,
    formatQuantity: formatQuantity,
    recurrentPrice: recurrentPrice,
    priceVariant: priceVariant,
    formatDate: formatDate,
    termsBlocks: termsBlocks,
    agreementTermsText: agreementTermsText,
    pricingDisplay: pricingDisplay,
    primaryEmail: primaryEmail,
    telHref: telHref,
    mailHref: mailHref,
    detailFields: detailFields,
    detailsPrefill: detailsPrefill,
    pickAgreement: pickAgreement,
    pickAccount: pickAccount,
    packageOrderIds: packageOrderIds,
    pickRound: pickRound,
    propertyStatus: propertyStatus,
    requestLocale: requestLocale,
    reviewModel: reviewModel,
  });
})(typeof window !== "undefined" ? window : globalThis);
