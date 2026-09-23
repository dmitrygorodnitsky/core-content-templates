(function (global) {
  "use strict";

  var ns = global.ClientReview || (global.ClientReview = {});

  var ORDER_STATUS = {
    QUOTE_SENT: "new",
    QUOTE_VIEWED: "viewed",
    CLIENT_APPROVED: "approved",
    DECLINED: "declined",
    CUSTOMER_CHANGES_REQUESTED: "changes",
    INITIAL: "revising",
    QUOTE_PREPARED: "revising",
    CHANGES_REQUESTED: "revising",
    QUOTE_APPROVED_INTERNALLY: "revising",
  };

  var PRICED_STATUSES = ["new", "viewed", "approved", "declined", "changes"];

  var AGREEMENT_DISPOSITION = {
    QUOTATION: { kind: "preparing" },
    QUOTATION_SENT: { kind: "quote-review" },
    QUOTATION_SEND_FAILED: { kind: "unavailable", reason: "send-failed" },
    AWAITING_CLIENT_DETAILS: { kind: "contract-details" },
    CLIENT_DETAILS_RECEIVED: { kind: "checking" },
    DRAFT: { kind: "preparing" },
    PENDING_MANAGEMENT_APPROVAL: { kind: "preparing" },
    INTERNALLY_APPROVED: { kind: "preparing" },
    SENT_TO_CLIENT: { kind: "agreement-review" },
    AGREEMENT_SEND_FAILED: { kind: "unavailable", reason: "send-failed" },
    CLIENT_APPROVED: { kind: "completion", completion: "approved" },
    ACTIVATION_FAILED: { kind: "completion", completion: "finishing" },
    ACTIVE: { kind: "completion", completion: "active" },
    SUSPENDED: { kind: "reference", banner: "suspended" },
    EXPIRED: { kind: "reference", banner: "expired" },
    ARCHIVED: { kind: "closed", reason: "archived" },
    CANCELED: { kind: "closed", reason: "canceled" },
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

  function clauseOf(line) {
    var match = /^(\d{1,3}(?:\.\d{1,3})*)([.)]?)\s+(.+)$/.exec(line);
    if (!match || (!match[2] && match[1].indexOf(".") === -1)) return null;
    return { kind: "clause", number: match[1] + match[2], depth: match[1].split(".").length, text: match[3] };
  }

  function owns(map, key) {
    return Boolean(map) && Object.prototype.hasOwnProperty.call(map, key);
  }

  function detailsCodes(value) {
    var source = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
    var codes = [];
    source.forEach(function (entry) {
      var code = text(entry);
      if (code && codes.indexOf(code) === -1) codes.push(code);
    });
    return codes;
  }

  function returnedDetails(value, fields, vocabulary) {
    var codes = detailsCodes(value);
    var kinds = {};
    fields.forEach(function (field) { kinds[field.code] = field.kind; });
    var result = { returned: codes.length > 0, processingFailed: false, unexplained: false, fields: {} };
    codes.forEach(function (code) {
      if (code === vocabulary.processingFailed) {
        result.processingFailed = true;
        return;
      }
      var invalid = owns(vocabulary.invalid, code) ? vocabulary.invalid[code] : null;
      var field = invalid ? invalid.field : code;
      if (!owns(kinds, field)) {
        result.unexplained = true;
        return;
      }
      if (owns(result.fields, field)) return;
      result.fields[field] = invalid ? invalid.reason : kinds[field] === "boolean" ? "unconfirmed" : "missing";
    });
    return result;
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
    return ordered.map(function (code) { return fieldOf(byCode[code], locale); });
  }

  function primaryContact(account) {
    var contacts = account && Array.isArray(account.contacts)
      ? account.contacts.filter(function (contact) { return contact && typeof contact === "object"; })
      : [];
    var primary = contacts.filter(function (contact) { return text(contact.type && contact.type.code).toUpperCase() === "PRIMARY"; })[0];
    return primary || contacts[0] || null;
  }

  function contactEntry(contact, typeCode) {
    var entries = contact && Array.isArray(contact.contactEntries) ? contact.contactEntries : [];
    var found = entries.filter(function (entry) {
      return entry && text(entry.type && entry.type.code).toUpperCase() === typeCode && text(entry.value);
    })[0];
    return found ? text(found.value) : "";
  }

  function primaryEmail(account) {
    var found = [];
    (account && Array.isArray(account.contacts) ? account.contacts : []).forEach(function (contact) {
      if (!contact || typeof contact !== "object" || text(contact.type && contact.type.code).toUpperCase() !== "PRIMARY") return;
      (Array.isArray(contact.contactEntries) ? contact.contactEntries : []).forEach(function (entry) {
        var value = entry && text(entry.type && entry.type.code).toUpperCase() === "EMAIL" ? text(entry.value) : "";
        if (value) found.push(value);
      });
    });
    return found.length === 1 ? found[0] : "";
  }

  function formatAddress(address, locale) {
    if (!address || typeof address !== "object") return "";
    var region = text(address.state && address.state.code) || localizedName(address.state && address.state.nls, locale);
    var country = localizedName(address.country && address.country.nls, locale) || text(address.country && address.country.code);
    var regionLine = [region, text(address.postalCode)].filter(Boolean).join(" ");
    var cityLine = [text(address.city), regionLine].filter(Boolean).join(", ");
    return [text(address.address1), text(address.address2), cityLine, country].filter(Boolean).join(", ");
  }

  function billingAddress(account, locale) {
    var entries = account && Array.isArray(account.addresses) ? account.addresses : [];
    var billing = entries.filter(function (entry) {
      return entry && Array.isArray(entry.types) && entry.types.some(function (type) {
        return text(type && type.code).toUpperCase() === "BILLING";
      });
    })[0];
    return billing ? formatAddress(billing.address, locale) : "";
  }

  function detailsPrefill(account, fields, locale) {
    var values = {};
    if (!account || typeof account !== "object") return values;
    var contact = primaryContact(account);
    var derived = {
      LEGAL_NAME: localizedName(account.nls, locale),
      BILLING_ADDRESS: billingAddress(account, locale),
      REPRESENTATIVE_FIRST_NAME: contact ? text(contact.firstName) : "",
      REPRESENTATIVE_LAST_NAME: contact ? text(contact.lastName) : "",
      REPRESENTATIVE_EMAIL: contactEntry(contact, "EMAIL"),
      REPRESENTATIVE_PHONE: contactEntry(contact, "PHONE"),
    };
    fields.forEach(function (field) {
      if (field.kind === "boolean") return;
      var value = attributeText(account, field.code) || text(derived[field.code]);
      if (!value) return;
      if (field.choices.length && !field.choices.some(function (option) { return option.value === value; })) return;
      values[field.code] = value;
    });
    return values;
  }

  function partiesOf(agreement, account, fields, locale, contract) {
    var codes = contract.agreementAttributes;
    var owner = agreement && agreement[contract.rawShape.documentOwner];
    var contact = primaryContact(account);
    function stated(code) {
      return attributeText(agreement, code) || attributeText(account, code);
    }
    var typeField = fields.filter(function (field) { return field.code === "CLIENT_TYPE"; })[0];
    var typeValue = stated("CLIENT_TYPE");
    var typeChoice = typeField ? typeField.choices.filter(function (option) { return option.value === typeValue; })[0] : null;
    var first = stated("REPRESENTATIVE_FIRST_NAME") || (contact ? text(contact.firstName) : "");
    var last = stated("REPRESENTATIVE_LAST_NAME") || (contact ? text(contact.lastName) : "");
    return {
      provider: {
        legalName: attributeText(agreement, codes.providerLegalName) || localizedName(owner && owner.nls, locale),
        representativeName: attributeText(agreement, codes.providerRepresentativeName),
        representativeJobTitle: attributeText(agreement, codes.providerRepresentativeJobTitle),
      },
      client: {
        legalName: stated("LEGAL_NAME") || localizedName(account && account.nls, locale),
        clientType: typeChoice ? typeChoice.label : "",
        billingAddress: stated("BILLING_ADDRESS") || billingAddress(account, locale),
        representativeName: [first, last].filter(Boolean).join(" "),
        representativeJobTitle: stated("REPRESENTATIVE_JOB_TITLE"),
        email: stated("REPRESENTATIVE_EMAIL") || contactEntry(contact, "EMAIL"),
        phone: stated("REPRESENTATIVE_PHONE") || contactEntry(contact, "PHONE"),
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
        };
      });
  }

  function optionOf(row, position, context) {
    var contract = context.contract;
    var id = positiveInteger(row.id);
    var state = stateCode(row, contract.orderStates);
    var status = ORDER_STATUS[state] || "unknown";
    var currency = text(row.currency && row.currency.code);
    var model = attributeText(row, contract.orderAttributes.pricingModel).toUpperCase();
    var priced = PRICED_STATUSES.indexOf(status) !== -1;
    return {
      id: id,
      recordKey: "order:" + id,
      position: position,
      model: contract.pricingModels.indexOf(model) !== -1 ? model : "",
      state: state,
      status: status,
      priced: priced,
      lines: priced ? linesOf(row, currency, context.locale, contract, context.catalog) : [],
      subtotal: priced ? formatMoney(row.totalCharges, currency, context.locale) : "",
      taxes: priced ? formatMoney(row.totalTaxes, currency, context.locale) : "",
      total: priced ? formatMoney(row.grandTotal, currency, context.locale) : "",
      awaitingClient: state === contract.orderEvents.view.source || state === contract.orderEvents.approve.source,
      siblingApproved: false,
      actions: { view: false, approve: false, decline: false, changes: false },
    };
  }

  function propertyStatus(options) {
    var statuses = options.map(function (option) { return option.status; });
    if (statuses.indexOf("approved") !== -1) return "approved";
    if (statuses.length && statuses.every(function (status) { return status === "declined"; })) return "declined";
    if (statuses.indexOf("changes") !== -1 || statuses.indexOf("revising") !== -1) return "changes";
    if (statuses.indexOf("new") !== -1 || statuses.indexOf("viewed") !== -1) return "awaiting";
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
        group = byKey[key] = { key: key, address: "", rows: [] };
        groups.push(group);
      }
      group.rows.push(row);
      if (!group.address) group.address = attributeText(row, contract.orderAttributes.address);
    });
    return groups.map(function (group) {
      var options = group.rows.map(function (row, index) { return optionOf(row, index + 1, context); });
      options.forEach(function (option) {
        option.siblingApproved = options.some(function (other) { return other.id !== option.id && other.status === "approved"; });
      });
      return { key: group.key, address: group.address, options: options, status: propertyStatus(options) };
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
          view: allowed(events.view),
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

  function reviewModel(input, options) {
    var locale = options.locale;
    var contract = options.contract;
    var grant = input.grant || grantOf(null);
    var expiresAt = formatDate(grant.expiresAt, locale);
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
    var state = stateCode(agreement, contract.agreementStates);
    var disposition = AGREEMENT_DISPOSITION[state] || { kind: "unavailable", reason: "unknown-state" };
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

    var properties = propertiesOf(readable, {
      locale: locale,
      contract: contract,
      catalog: {
        orderItems: rowsById(input.orderItems),
        productPrices: rowsById(input.productPrices),
        products: rowsById(input.products),
      },
    });
    if (state === "QUOTATION_SENT") grantActions(properties, grant, contract);
    var detailsEvent = contract.agreementEvents.details;
    var approveEvent = contract.agreementEvents.approve;
    var awaitingDetails = state === detailsEvent.source;

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
        terms: termsBlocks(attributeValue(agreement, contract.agreementAttributes.terms)),
        detailsErrors: detailsCodes(attributeValue(agreement, contract.agreementAttributes.detailsErrors)).join(","),
      },
      names: {
        provider: parties.provider.legalName,
        client: localizedName(account && account.nls, locale) || parties.client.legalName,
      },
      parties: parties,
      properties: properties,
      summary: summaryOf(properties),
      allDecided: properties.length > 0 && properties.every(function (property) {
        return property.status === "approved" || property.status === "declined";
      }),
      unreadableOrders: unreadable,
      accountUnavailable: Boolean(input.accountFailed),
      details: {
        available: awaitingDetails && eventGranted(grant, "document", agreementId, detailsEvent.code),
        fields: fields,
        prefill: detailsPrefill(account, fields, locale),
        returned: returnedDetails(awaitingDetails ? attributeValue(agreement, contract.agreementAttributes.detailsErrors) : null, fields, contract.detailsReturn),
      },
      canApproveAgreement: state === approveEvent.source && eventGranted(grant, "document", agreementId, approveEvent.code),
      primaryEmail: primaryEmail(account),
    };
  }

  ns.normalizer = Object.freeze({
    orderStatus: Object.freeze(Object.assign({}, ORDER_STATUS)),
    agreementDisposition: Object.freeze(Object.assign({}, AGREEMENT_DISPOSITION)),
    positiveInteger: positiveInteger,
    attributeValue: attributeValue,
    idList: idList,
    stateCode: stateCode,
    entityKind: entityKind,
    grantOf: grantOf,
    canRead: canRead,
    eventGranted: eventGranted,
    formatMoney: formatMoney,
    formatQuantity: formatQuantity,
    formatDate: formatDate,
    termsBlocks: termsBlocks,
    returnedDetails: returnedDetails,
    primaryEmail: primaryEmail,
    detailFields: detailFields,
    detailsPrefill: detailsPrefill,
    pickAgreement: pickAgreement,
    pickAccount: pickAccount,
    packageOrderIds: packageOrderIds,
    propertyStatus: propertyStatus,
    reviewModel: reviewModel,
  });
})(typeof window !== "undefined" ? window : globalThis);
