(function (global) {
  "use strict";

  var ns = global.ClientReview || (global.ClientReview = {});

  var OPTION_BADGE = {
    new: ["status-badge--info", "optionNew"],
    approved: ["status-badge--ok", "optionApproved"],
    declined: ["status-badge--danger", "optionDeclined"],
    cancelled: ["status-badge--scheduled", "optionCancelled"],
    changes: ["status-badge--warn", "optionChanges"],
    revising: ["status-badge--warn", "optionRevising"],
    unknown: ["status-badge--scheduled", "optionUnknown"],
  };

  var PROPERTY_BADGE = {
    awaiting: ["status-badge--info", "propertyAwaiting"],
    approved: ["status-badge--ok", "propertyApproved"],
    declined: ["status-badge--danger", "propertyDeclined"],
    cancelled: ["status-badge--scheduled", "propertyCancelled"],
    changes: ["status-badge--warn", "propertyChanges"],
    unknown: ["status-badge--scheduled", "propertyUnknown"],
  };

  var AUTOCOMPLETE = {
    LEGAL_NAME: "organization",
    BILLING_ADDRESS: "street-address",
    LEGAL_ADDRESS: "street-address",
    REPRESENTATIVE_FIRST_NAME: "given-name",
    REPRESENTATIVE_LAST_NAME: "family-name",
    REPRESENTATIVE_JOB_TITLE: "organization-title",
    REPRESENTATIVE_EMAIL: "email",
    REPRESENTATIVE_PHONE: "tel",
  };

  var STATEMENT_COPY = {
    INFORMATION_CONFIRMED: "confirmInformationStatement",
    AUTHORITY_CONFIRMED: "confirmAuthorityStatement",
  };

  function el(tag, className, attrs) {
    var node = global.document.createElement(tag);
    if (className) node.className = className;
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        var value = attrs[key];
        if (value === undefined || value === null || value === false) return;
        node.setAttribute(key, value === true ? "" : String(value));
      });
    }
    return node;
  }

  function text(tag, className, value, attrs) {
    var node = el(tag, className, attrs);
    node.textContent = value === null || value === undefined ? "" : String(value);
    return node;
  }

  function mark(ctx, node, key) {
    node.setAttribute("data-focus-key", key);
    ctx.focus[key] = node;
    return node;
  }

  function button(label, variant, onClick, attrs) {
    var node = text("button", "btn " + variant, label, Object.assign({ type: "button" }, attrs || {}));
    if (typeof onClick === "function") node.addEventListener("click", onClick);
    return node;
  }

  function badge(map, status, copy) {
    var entry = map[status] || map.unknown;
    return text("span", "status-badge " + entry[0], copy[entry[1]], { "data-state": status });
  }

  function optionLabel(option, copy) {
    return ns.optionLabel(option, copy);
  }

  function confirmationStatement(copy, field) {
    var key = STATEMENT_COPY[field.code];
    if (!key) return field.description || field.label;
    var configured = copy[key];
    if (configured !== ns.defaultCopy()[key]) return configured;
    return field.description || configured;
  }

  function isPending(command) {
    return Boolean(command && command.status === "pending");
  }

  function sentences(parts) {
    return parts.filter(Boolean).map(function (part) { return /[.!?…:]$/.test(part) ? part : part + "."; }).join(" ");
  }

  function announce(ctx, parts) {
    ctx.announcement = sentences(parts);
  }

  function stateCard(tone, glyph, title, body, action, quiet) {
    var card = el("section", "cr-panel cr-state cr-state--" + tone, { "data-state": tone, role: quiet ? null : tone === "error" ? "alert" : "status" });
    card.appendChild(text("div", "cr-state__glyph", glyph, { "aria-hidden": "true" }));
    card.appendChild(text("h1", "cr-state__title", title));
    if (body) card.appendChild(text("p", "cr-state__body", body));
    if (action) card.appendChild(action);
    return card;
  }

  function announcedCard(ctx, tone, glyph, title, body, action) {
    announce(ctx, [title, body]);
    return stateCard(tone, glyph, title, body, action);
  }

  function notice(tone, title, body, action, options) {
    var settings = options || {};
    var box = el("div", "cr-notice cr-notice--" + tone, { role: settings.quiet ? null : "status", "data-state": tone });
    var glyph = settings.busy ? "" : tone === "ok" ? "✓" : tone === "warn" ? "!" : "i";
    box.appendChild(text("span", "cr-notice__icon" + (settings.busy ? " cr-notice__icon--busy" : ""), glyph, { "aria-hidden": "true" }));
    var content = el("div", "cr-notice__body");
    if (title) content.appendChild(text("p", "cr-notice__title", title));
    (Array.isArray(body) ? body : [body]).forEach(function (line) {
      if (!line) return;
      content.appendChild(typeof line === "string" ? text("p", "cr-notice__text", line) : line);
    });
    box.appendChild(content);
    if (action) box.appendChild(action);
    return box;
  }

  function refreshButton(ctx, recordKey, label) {
    return button(label, "btn--ghost", function () { ctx.dispatch("refresh", { recordKey: recordKey }); }, {
      disabled: ctx.busy,
      "data-action": "refresh",
      "aria-busy": ctx.snapshot.refreshing ? "true" : null,
    });
  }

  function skeletonBar(extra) {
    return el("span", "skeleton cr-skeleton__bar " + extra, { "aria-hidden": "true" });
  }

  function skeleton(copy) {
    var wrap = el("div", "cr-skeleton", { "data-state": "loading", role: "status", "aria-label": copy.loadingLabel });
    var head = el("div", "cr-head");
    head.appendChild(skeletonBar("cr-skeleton__eyebrow"));
    head.appendChild(skeletonBar("cr-skeleton__title"));
    head.appendChild(skeletonBar("cr-skeleton__sub"));
    wrap.appendChild(head);
    var summary = el("div", "cr-summary");
    for (var tile = 0; tile < 5; tile += 1) summary.appendChild(skeletonBar("cr-skeleton__tile"));
    wrap.appendChild(summary);
    for (var card = 0; card < 2; card += 1) {
      var property = el("div", "cr-property cr-skeleton__property");
      var propertyHead = el("div", "cr-property__head");
      propertyHead.appendChild(skeletonBar("cr-skeleton__pin"));
      propertyHead.appendChild(skeletonBar("cr-skeleton__address"));
      property.appendChild(propertyHead);
      for (var row = 0; row < 3; row += 1) {
        var line = el("div", "cr-skeleton__row");
        line.appendChild(skeletonBar("cr-skeleton__label"));
        line.appendChild(skeletonBar("cr-skeleton__chip"));
        property.appendChild(line);
      }
      wrap.appendChild(property);
    }
    return wrap;
  }

  function linkRow(ctx) {
    var copy = ctx.copy;
    var view = ctx.snapshot.view;
    var link = ctx.snapshot.link;
    if (!view.expiresAt && !link.available) return null;
    var box = el("div", "cr-link", { "data-link": link.status || "idle" });
    var row = el("div", "cr-link__row");
    box.appendChild(row);
    if (view.expiresAt) row.appendChild(text("p", "cr-validity", ns.fill(copy.linkValidUntil, { date: view.expiresAt })));
    if (!link.available) return box;
    var copied = link.status === "copied";
    row.appendChild(mark(ctx, button(copied ? copy.linkCopied : copy.linkCopy, "btn--ghost cr-link__copy", function () {
      ctx.dispatch("link.copy");
    }, { "data-action": "link.copy" }), "link-copy"));
    var unsent = view.details.available ? copy.linkCopiedUnsent : "";
    var notes = copied ? [copy.linkCopiedNote, unsent].filter(Boolean) : link.status === "failed" ? [copy.linkCopyFailed] : [];
    notes.forEach(function (line) { box.appendChild(text("p", "cr-link__note", line)); });
    ctx.linkStatus = sentences(copied ? [copy.linkCopied].concat(notes) : notes);
    return box;
  }

  function pageHead(ctx, eyebrow, title, subtitle, badgeNode) {
    var view = ctx.snapshot.view;
    var copy = ctx.copy;
    var head = el("header", "cr-head");
    var top = el("div", "cr-head__top");
    top.appendChild(text("p", "cr-eyebrow", eyebrow));
    if (badgeNode) top.appendChild(badgeNode);
    head.appendChild(top);
    head.appendChild(mark(ctx, text("h1", "cr-title", title, { tabindex: "-1" }), "page-title"));
    if (subtitle) head.appendChild(text("p", "cr-sub", subtitle));
    announce(ctx, [title, subtitle]);
    var meta = el("dl", "cr-meta");
    [[copy.fromLabel, view.names && view.names.provider], [copy.forLabel, view.names && view.names.client]].forEach(function (entry) {
      if (!entry[1]) return;
      var item = el("div", "cr-meta__item");
      item.appendChild(text("dt", "cr-meta__label", entry[0]));
      item.appendChild(text("dd", "cr-meta__value", entry[1]));
      meta.appendChild(item);
    });
    if (meta.children.length) head.appendChild(meta);
    var link = linkRow(ctx);
    if (link) head.appendChild(link);
    if (ns.pdf && view.agreement && ns.pdf.offered(ctx.snapshot)) {
      var pdf = ctx.snapshot.pdf || {};
      var pending = pdf.status === "pending";
      var allowed = ns.pdf.available(ctx.snapshot);
      var actions = el("div", "cr-pdf");
      actions.appendChild(mark(ctx, button(pending ? copy.pdfCreating : copy.pdfDownload, "btn--ghost", function () {
        ctx.dispatch("pdf.download");
      }, { "data-action": "pdf.download", disabled: pending || !allowed || ctx.busy, "aria-busy": pending ? "true" : null }), "pdf-download"));
      var note = !allowed ? copy.pdfIncomplete : pdf.status === "failed" ? copy.pdfFailed : pdf.status === "downloaded" ? copy.pdfDownloaded : "";
      if (note) actions.appendChild(text("p", "cr-pdf__note", note));
      ctx.pdfStatus = note;
      head.appendChild(actions);
    }
    return head;
  }

  function readNotices(ctx) {
    var view = ctx.snapshot.view;
    var copy = ctx.copy;
    var found = [];
    if (view.unreadableOrders) {
      var body = ns.fill(view.unreadableOrders === 1 ? copy.partialOne : copy.partialMany, { n: view.unreadableOrders });
      found.push(notice("warn", "", body, refreshButton(ctx, "", copy.retryLabel)));
    }
    if (view.accountUnavailable && view.details.available) found.push(notice("warn", "", copy.accountPartial, null));
    return found;
  }

  function summary(ctx) {
    var counts = ctx.snapshot.view.summary;
    var copy = ctx.copy;
    var section = el("section", "cr-summary", { "aria-label": copy.summaryLabel });
    [
      ["properties", copy.summaryProperties],
      ["awaiting", copy.summaryAwaiting],
      ["approved", copy.summaryApproved],
      ["declined", copy.summaryDeclined],
      ["changes", copy.summaryChanges],
    ].forEach(function (entry) {
      var item = el("div", "cr-summary__item", { "data-kind": entry[0] });
      item.appendChild(text("span", "cr-summary__label", entry[1]));
      item.appendChild(text("span", "cr-summary__value", String(counts[entry[0]])));
      section.appendChild(item);
    });
    return section;
  }

  function linesTable(ctx, option) {
    var copy = ctx.copy;
    if (!option.lines.length) return text("p", "cr-note cr-lines-empty", copy.linesEmpty);
    var priced = option.pricing.linePrices;
    var wrap = el("div", "cr-lines-wrap");
    var table = el("table", "cr-lines" + (priced ? "" : " cr-lines--unpriced"), { role: "table", "data-priced": priced ? "true" : "false" });
    var head = el("thead", "", { role: "rowgroup" });
    var headRow = el("tr", "", { role: "row" });
    headRow.appendChild(text("th", "", copy.lineService, { scope: "col", role: "columnheader" }));
    headRow.appendChild(text("th", "cr-num", copy.lineQuantity, { scope: "col", role: "columnheader" }));
    if (priced) headRow.appendChild(text("th", "cr-num", copy.lineUnitPrice, { scope: "col", role: "columnheader" }));
    head.appendChild(headRow);
    table.appendChild(head);
    var body = el("tbody", "", { role: "rowgroup" });
    option.lines.forEach(function (line) {
      var row = el("tr", "", { role: "row", "data-line": line.key, "data-recurrent": line.recurrent ? "true" : null });
      row.appendChild(text("td", "cr-lines__service" + (line.product ? "" : " cr-muted"), line.product || copy.serviceUnnamed, { role: "cell", "data-label": copy.lineService }));
      row.appendChild(text("td", "cr-num" + (line.quantity ? "" : " cr-muted"), line.quantity || copy.valueNotStated, { role: "cell", "data-label": copy.lineQuantity }));
      if (priced) {
        var price = line.recurrent ? copy.lineIncluded : line.unitPrice || copy.valueNotStated;
        row.appendChild(text("td", "cr-num" + (!line.recurrent && line.unitPrice ? "" : " cr-muted"), price, { role: "cell", "data-label": copy.lineUnitPrice }));
      }
      body.appendChild(row);
    });
    table.appendChild(body);
    wrap.appendChild(table);
    return wrap;
  }

  function optionContent(body, ctx, option) {
    var copy = ctx.copy;
    if (!option.priced) {
      body.appendChild(text("p", "cr-note", option.status === "revising" ? copy.noteRevising : copy.noteNoActions));
      return;
    }
    body.appendChild(linesTable(ctx, option));
    if (!option.pricing.total) {
      body.appendChild(text("p", "cr-note cr-per-service", copy.perServiceNote, { "data-pricing": "per-service" }));
      body.appendChild(text("p", "cr-note cr-taxes-note", copy.taxesNote, { "data-pricing": "taxes" }));
      return;
    }
    var total = el("div", "cr-total");
    total.appendChild(text("span", "cr-total__label", copy.orderTotal));
    total.appendChild(text("span", "cr-total__value" + (option.total ? "" : " cr-muted"), option.total || copy.valueNotStated));
    body.appendChild(total);
    body.appendChild(text("p", "cr-note cr-taxes-note", copy.taxesNote, { "data-pricing": "taxes" }));
  }

  function outcomeBox(ctx, command, options) {
    var copy = ctx.copy;
    var settings = options || {};
    var refused = command.status === "refused";
    var box = el("div", "cr-outcome cr-outcome--" + command.status, { role: "alert", "data-state": command.status });
    box.appendChild(text("span", "cr-outcome__icon", "!", { "aria-hidden": "true" }));
    var content = el("div", "cr-outcome__body");
    var title = settings.title || (refused ? copy.refusedTitle : "");
    if (title) content.appendChild(text("p", "cr-outcome__title", title));
    var detail = refused ? command.message || copy.refusedFallback : settings.title ? "" : copy.failedBody;
    if (detail) content.appendChild(text("p", "cr-outcome__text", detail));
    box.appendChild(content);
    if (settings.action) box.appendChild(settings.action);
    return box;
  }

  function chosenOption(ctx, property, option) {
    var choice = ctx.snapshot.choices[property.key];
    return Boolean(choice && choice.kind === "approve" && choice.id === option.id);
  }

  function actionRow(ctx, property, option) {
    var copy = ctx.copy;
    var disabled = ctx.busy || isPending(ctx.snapshot.commands[option.recordKey]);
    var chosen = chosenOption(ctx, property, option);
    var row = el("div", "cr-actions");
    if (option.actions.approve && !chosen) {
      row.appendChild(button(copy.approveLabel, "btn--primary btn--lg", function () { ctx.dispatch("option.choose", { id: option.id }); }, { disabled: disabled, "data-action": "option.approve" }));
    }
    if (option.actions.changes) {
      row.appendChild(button(copy.changesLabel, "btn--ghost btn--lg", function () { ctx.dispatch("option.intent", { id: option.id, kind: "changes" }); }, { disabled: disabled, "data-action": "option.changes" }));
    }
    return row;
  }

  function chosenNote(ctx, property, kind) {
    var copy = ctx.copy;
    var box = el("div", "cr-chosen", { "data-chosen": kind, role: "group", "aria-label": kind === "approve" ? copy.choiceApprovedNote : copy.choiceDeclinedNote });
    box.appendChild(text("span", "cr-chosen__icon", kind === "approve" ? "✓" : "✕", { "aria-hidden": "true" }));
    box.appendChild(text("p", "cr-chosen__text", kind === "approve" ? copy.choiceApprovedNote : copy.choiceDeclinedNote));
    box.appendChild(mark(ctx, button(copy.choiceUndo, "btn--ghost", function () {
      ctx.dispatch("choice.clear", { key: property.key });
    }, { disabled: ctx.busy, "data-action": "choice.clear" }), "choice-" + property.key));
    return box;
  }

  function confirmPanel(ctx, property, option, confirm, pending) {
    var copy = ctx.copy;
    var kind = confirm.kind;
    var titleId = "cr-confirm-title-" + option.id;
    var panel = el("div", "cr-confirm cr-confirm--" + kind, { role: "group", "aria-labelledby": titleId, "data-state": pending ? "pending" : "open" });
    if (kind === "changes") {
      var invalid = Boolean(ctx.snapshot.draftInvalid[option.id]);
      var field = el("div", "cr-field", { "data-state": invalid ? "invalid" : "idle" });
      field.appendChild(text("label", "cr-field__label", copy.changesTitle, { for: "cr-draft-" + option.id, id: titleId }));
      var area = el("textarea", "cr-input cr-input--area", {
        id: "cr-draft-" + option.id,
        name: "MESSAGE",
        rows: 4,
        placeholder: copy.changesPlaceholder,
        "aria-required": "true",
        "aria-invalid": invalid ? "true" : null,
        "aria-describedby": "cr-draft-error-" + option.id,
        disabled: pending,
      });
      area.value = ctx.snapshot.drafts[option.id] || "";
      area.addEventListener("input", function () { ctx.dispatch("option.draft", { id: option.id, value: area.value }); });
      mark(ctx, area, "draft-" + option.id);
      field.appendChild(area);
      field.appendChild(text("p", "cr-field__error", invalid ? copy.changesRequired : "", { id: "cr-draft-error-" + option.id }));
      panel.appendChild(field);
    }
    var actions = el("div", "cr-actions");
    var confirmButton = button(pending ? copy.sendingLabel : copy.changesSend, "btn--primary btn--lg", function () {
      ctx.dispatch("option.confirm", { id: option.id });
    }, { disabled: pending || ctx.busy, "data-state": pending ? "pending" : null, "data-action": "option.confirm", "aria-busy": pending ? "true" : null });
    actions.appendChild(confirmButton);
    actions.appendChild(button(copy.cancelLabel, "btn--ghost btn--lg", function () {
      ctx.dispatch("option.cancel", { id: option.id });
    }, { disabled: pending, "data-action": "option.cancel" }));
    panel.appendChild(actions);
    return panel;
  }

  function unconfirmedNotice(ctx, recordKey) {
    var box = notice("info", "", ctx.copy.commandUnconfirmed, refreshButton(ctx, recordKey, ctx.copy.refreshLabel), { quiet: true });
    box.setAttribute("data-command", "unconfirmed");
    return box;
  }

  function announceUnconfirmed(ctx) {
    var commands = ctx.snapshot.commands;
    if (Object.keys(commands).some(function (key) { return commands[key].status === "unconfirmed"; })) announce(ctx, [ctx.copy.commandUnconfirmed]);
  }

  function optionFooter(body, ctx, property, option) {
    var copy = ctx.copy;
    var command = ctx.snapshot.commands[option.recordKey] || null;
    if (command && command.status === "unconfirmed") {
      body.appendChild(unconfirmedNotice(ctx, option.recordKey));
      return;
    }
    var pending = isPending(command);
    if (option.siblingApproved && option.awaitingClient) {
      body.appendChild(text("p", "cr-note", copy.noteSiblingApproved));
      return;
    }
    var decisions = option.actions.approve || option.actions.changes;
    if (!decisions) {
      if (option.awaitingClient) body.appendChild(text("p", "cr-note", copy.noteNoActions));
      return;
    }
    var confirm = ctx.snapshot.confirm && ctx.snapshot.confirm.kind === "changes" && ctx.snapshot.confirm.id === option.id ? ctx.snapshot.confirm : null;
    if (chosenOption(ctx, property, option)) body.appendChild(chosenNote(ctx, property, "approve"));
    body.appendChild(confirm ? confirmPanel(ctx, property, option, confirm, pending) : actionRow(ctx, property, option));
    if (command && !pending) {
      body.appendChild(outcomeBox(ctx, command, { action: refreshButton(ctx, option.recordKey, copy.refreshLabel) }));
    }
  }

  function optionItem(ctx, property, option) {
    var copy = ctx.copy;
    var expanded = Boolean(ctx.snapshot.expanded[option.id]);
    var bodyId = "cr-option-" + option.id;
    var item = el("li", "cr-option", { "data-state": option.status, "data-expanded": expanded ? "true" : "false" });
    var choice = el("label", "cr-option__toggle cr-pick");
    var radio = el("input", "cr-pick__radio", {
      type: "radio",
      name: "cr-pick-" + property.key,
      value: String(option.id),
      checked: expanded,
      "aria-controls": expanded ? bodyId : null,
      "data-action": "option.toggle",
    });
    radio.checked = expanded;
    radio.addEventListener("click", function () {
      if (!expanded) ctx.dispatch("option.toggle", { id: option.id });
    });
    mark(ctx, radio, "toggle-" + option.id);
    choice.appendChild(radio);
    choice.appendChild(el("span", "cr-pick__mark", { "aria-hidden": "true" }));
    choice.appendChild(text("span", "cr-option__label", optionLabel(option, copy)));
    if (option.priced && option.pricing.total && option.total) choice.appendChild(text("span", "cr-pick__total", option.total));
    choice.appendChild(badge(OPTION_BADGE, option.status, copy));
    item.appendChild(choice);
    if (!expanded) return item;
    var body = el("div", "cr-option__body", { id: bodyId });
    optionContent(body, ctx, option);
    optionFooter(body, ctx, property, option);
    item.appendChild(body);
    return item;
  }

  function optionStatic(ctx, option) {
    var item = el("li", "cr-option cr-option--static", { "data-state": option.status });
    item.appendChild(text("p", "cr-option__head", optionLabel(option, ctx.copy)));
    var body = el("div", "cr-option__body");
    optionContent(body, ctx, option);
    item.appendChild(body);
    return item;
  }

  function propertyFooter(ctx, property) {
    var copy = ctx.copy;
    var snapshot = ctx.snapshot;
    var declineCode = ns.contract.orderEvents.decline.code;
    var chosen = property.options.some(function (option) { return snapshot.expanded[option.id]; });
    var declinable = property.options.some(function (option) { return option.actions.decline; });
    var choice = snapshot.choices[property.key] || null;
    var failed = property.options.filter(function (option) {
      var command = snapshot.commands[option.recordKey];
      return command && command.event === declineCode && (command.status === "failed" || command.status === "refused") && !snapshot.expanded[option.id];
    })[0];
    var footer = el("div", "cr-property__foot");
    if (!chosen && !choice && property.options.some(function (option) { return option.awaitingClient && !option.siblingApproved; })) {
      footer.appendChild(text("p", "cr-note cr-pick__hint", copy.chooseOption));
    }
    if (failed) {
      footer.appendChild(outcomeBox(ctx, snapshot.commands[failed.recordKey], { action: refreshButton(ctx, failed.recordKey, copy.refreshLabel) }));
    }
    if (choice && choice.kind === "decline") {
      footer.appendChild(chosenNote(ctx, property, "decline"));
    } else if (declinable) {
      var pending = property.options.some(function (option) { return isPending(snapshot.commands[option.recordKey]); });
      var intent = button(copy.declineAllLabel, "btn--danger", function () {
        ctx.dispatch("property.decline", { key: property.key });
      }, { disabled: ctx.busy || pending, "data-action": "property.decline" });
      mark(ctx, intent, "decline-" + property.key);
      var row = el("div", "cr-actions cr-property__actions");
      row.appendChild(intent);
      footer.appendChild(row);
    }
    return footer.children.length ? footer : null;
  }

  function propertyCard(ctx, property, interactive) {
    var copy = ctx.copy;
    var headingId = "cr-" + property.key;
    var card = el("section", "cr-property", { "data-state": property.status, "aria-labelledby": headingId });
    var head = el("header", "cr-property__head");
    head.appendChild(el("span", "cr-pin", { "aria-hidden": "true" }));
    var identity = el("div", "cr-property__identity");
    var heading = text("h2", "cr-property__address" + (property.address ? "" : " cr-muted"), property.address || copy.addressUnavailable, { id: headingId, tabindex: interactive ? "-1" : null });
    if (interactive) mark(ctx, heading, "property-" + property.key);
    identity.appendChild(heading);
    identity.appendChild(text("p", "cr-property__meta", property.options.length === 1 ? copy.optionsOne : ns.fill(copy.optionsMany, { n: property.options.length })));
    head.appendChild(identity);
    if (interactive) head.appendChild(badge(PROPERTY_BADGE, property.status, copy));
    card.appendChild(head);
    var site = propertySite(ctx, property);
    if (site) card.appendChild(site);
    var list = el("ol", "cr-options");
    property.options.forEach(function (option) {
      list.appendChild(interactive ? optionItem(ctx, property, option) : optionStatic(ctx, option));
    });
    if (!interactive) {
      card.appendChild(list);
      return card;
    }
    var group = el("fieldset", "cr-pick-group");
    group.appendChild(text("legend", "cr-visually-hidden", ns.fill(copy.choiceLegend, { address: property.address || copy.addressUnavailable })));
    group.appendChild(list);
    card.appendChild(group);
    var footer = propertyFooter(ctx, property);
    if (footer) card.appendChild(footer);
    return card;
  }

  function decidedNotice(ctx) {
    var copy = ctx.copy;
    var waiting = ctx.snapshot.waiting;
    var following = waiting.decisions && !waiting.exhausted;
    var body = following ? copy.decidedFollowingBody : copy.decidedRoundBody;
    announce(ctx, [copy.decidedTitle, body]);
    var box = notice("ok", copy.decidedTitle, body, null, { quiet: waiting.decisions, busy: following });
    box.setAttribute("data-decided", following ? "following" : "recorded");
    return box;
  }

  function partialNotice(ctx) {
    var copy = ctx.copy;
    var counts = ctx.snapshot.view.summary;
    if (ctx.snapshot.view.allDecided || !counts.awaiting || !(counts.approved + counts.declined)) return null;
    var box = notice("ok", copy.partialDecidedTitle, copy.partialDecidedBody, null, { quiet: true });
    box.setAttribute("data-decided", "partial");
    return box;
  }

  function choiceRow(ctx, entry) {
    var copy = ctx.copy;
    var item = el("li", "cr-approved__item cr-choices__item", { "data-choice": entry.kind, "data-property": entry.property.key });
    var row = el("div", "cr-approved__row");
    var identity = el("div", "cr-approved__identity");
    identity.appendChild(text("span", "cr-approved__address" + (entry.property.address ? "" : " cr-muted"), entry.property.address || copy.addressUnavailable));
    identity.appendChild(text("span", "cr-approved__option", entry.kind === "approve" ? ns.fill(copy.choiceApproveRow, { option: optionLabel(entry.option, copy) }) : copy.choiceDeclineRow));
    row.appendChild(identity);
    if (entry.kind === "approve" && entry.option.pricing.total) row.appendChild(text("span", "cr-approved__total" + (entry.option.total ? "" : " cr-muted"), entry.option.total || copy.valueNotStated));
    item.appendChild(row);
    var failed = (entry.kind === "approve" ? [entry.option] : entry.property.options).map(function (option) { return ctx.snapshot.commands[option.recordKey]; }).filter(function (command) {
      return command && (command.status === "failed" || command.status === "refused");
    })[0];
    if (failed) item.appendChild(outcomeBox(ctx, failed, { action: refreshButton(ctx, "", copy.refreshLabel) }));
    return item;
  }

  function choicesPanel(ctx) {
    var view = ctx.snapshot.view;
    var copy = ctx.copy;
    var entries = view.properties.filter(function (property) { return Boolean(ctx.snapshot.choices[property.key]); }).map(function (property) {
      var choice = ctx.snapshot.choices[property.key];
      var option = choice.kind === "approve" ? property.options.filter(function (candidate) { return candidate.id === choice.id; })[0] : null;
      return { property: property, kind: choice.kind, option: option };
    }).filter(function (entry) { return entry.kind === "decline" || entry.option; });
    if (!entries.length) return null;
    var sending = ctx.snapshot.bulk === "choices";
    var approvals = entries.some(function (entry) { return entry.kind === "approve"; });
    var card = el("section", "cr-panel cr-choices", { "aria-labelledby": "cr-choices-title", "data-state": sending ? "pending" : "open" });
    card.appendChild(mark(ctx, text("h2", "cr-section-title", copy.choicesTitle, { id: "cr-choices-title", tabindex: "-1" }), "choices-title"));
    card.appendChild(text("p", "cr-note", copy.choicesBody));
    var list = el("ul", "cr-approved__list cr-choices__list");
    entries.forEach(function (entry) { list.appendChild(choiceRow(ctx, entry)); });
    card.appendChild(list);
    if (approvals) card.appendChild(text("p", "cr-note cr-taxes-note", copy.taxesNote, { "data-pricing": "taxes" }));
    var undecided = view.properties.filter(function (property) {
      return property.status === "awaiting" && !ctx.snapshot.choices[property.key];
    }).length;
    if (undecided) card.appendChild(text("p", "cr-note", ns.fill(undecided === 1 ? copy.choicesUndecidedOne : copy.choicesUndecidedMany, { n: undecided }), { "data-undecided": String(undecided) }));
    var form = el("form", "cr-form", { novalidate: true, "data-state": sending ? "pending" : "idle" });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      ctx.dispatch("choices.submit");
    });
    if (approvals) {
      var details = el("div", "cr-form-card", { role: "group", "aria-labelledby": "cr-details-title" });
      details.appendChild(text("h3", "cr-section-title", copy.detailsFormTitle, { id: "cr-details-title" }));
      details.appendChild(text("p", "cr-note", copy.detailsSubtitle));
      var fields = el("div", "cr-fields");
      view.details.fields.forEach(function (field) { fields.appendChild(fieldNode(ctx, field, sending)); });
      details.appendChild(fields);
      var entered = ctx.snapshot.details;
      var invalid = view.details.fields.some(function (field) { return entered.touched[field.code] && entered.errors[field.code]; });
      if (entered.invalid && invalid) details.appendChild(notice("warn", "", copy.detailsInvalid, null));
      form.appendChild(details);
    }
    var actions = el("div", "cr-form-actions");
    actions.appendChild(text("button", "btn btn--primary btn--lg", sending ? copy.sendingLabel : copy.choicesSubmit, {
      type: "submit",
      disabled: sending || ctx.busy,
      "data-state": sending ? "pending" : null,
      "data-action": "choices.submit",
      "aria-busy": sending ? "true" : null,
    }));
    form.appendChild(actions);
    card.appendChild(form);
    return card;
  }

  function quoteReview(shell, ctx) {
    var view = ctx.snapshot.view;
    var copy = ctx.copy;
    shell.appendChild(pageHead(ctx, copy.quoteEyebrow, copy.quoteTitle, copy.quoteSubtitle, null));
    shell.appendChild(summary(ctx));
    readNotices(ctx).forEach(function (node) { shell.appendChild(node); });
    if (view.allDecided) shell.appendChild(decidedNotice(ctx));
    var partial = partialNotice(ctx);
    if (partial) shell.appendChild(partial);
    if (!view.properties.length && !view.unreadableOrders) {
      shell.appendChild(stateCard("neutral", "○", copy.emptyTitle, copy.emptyBody, null));
      return;
    }
    var list = el("div", "cr-properties");
    view.properties.forEach(function (property) { list.appendChild(propertyCard(ctx, property, true)); });
    shell.appendChild(list);
    var choices = choicesPanel(ctx);
    if (choices) shell.appendChild(choices);
    announceUnconfirmed(ctx);
  }

  function fieldNode(ctx, field, pending) {
    var details = ctx.snapshot.details;
    var copy = ctx.copy;
    var id = "cr-field-" + field.code;
    var errorId = id + "-error";
    var describedBy = field.description && field.kind !== "boolean" ? id + "-hint " + errorId : errorId;
    var clientError = details.touched[field.code] ? details.errors[field.code] || "" : "";
    var message = clientError || details.serverErrors[field.code] || "";
    var wrap = el("div", "cr-field", { "data-code": field.code, "data-kind": field.kind, "data-state": message ? "invalid" : "idle" });
    var errorNode = text("p", "cr-field__error", message, { id: errorId, role: message ? "alert" : null });
    var control;

    function common(extra) {
      return Object.assign({
        id: id,
        name: field.code,
        "aria-describedby": describedBy,
        "aria-invalid": message ? "true" : null,
        "aria-required": field.required || field.askedFirst ? "true" : null,
        disabled: pending,
      }, extra || {});
    }

    function patch(next) {
      var current = next || "";
      wrap.setAttribute("data-state", current ? "invalid" : "idle");
      errorNode.textContent = current;
      if (current) control.setAttribute("aria-invalid", "true");
      else control.removeAttribute("aria-invalid");
    }

    if (field.kind !== "boolean") {
      var label = el("label", "cr-field__label", { for: id });
      label.appendChild(text("span", "", field.label));
      if (field.required || field.askedFirst) label.appendChild(text("span", "cr-req", "*", { "aria-hidden": "true" }));
      wrap.appendChild(label);
    }

    if (field.kind === "boolean") {
      var toggle = el("label", "cr-choice", { for: id });
      control = el("input", "cr-choice__input", common({ type: "checkbox" }));
      control.checked = details.values[field.code] === true;
      control.addEventListener("change", function () { patch(ctx.dispatch("details.choose", { code: field.code, value: control.checked })); });
      toggle.appendChild(control);
      toggle.appendChild(el("span", "cr-check", { "aria-hidden": "true" }));
      var caption = text("span", "cr-choice__label", confirmationStatement(copy, field));
      if (field.required || field.askedFirst) caption.appendChild(text("span", "cr-req", "*", { "aria-hidden": "true" }));
      toggle.appendChild(caption);
      wrap.appendChild(toggle);
    } else if (field.kind === "select") {
      control = el("select", "cr-input cr-select", common());
      var blank = text("option", "", copy.selectPlaceholder);
      blank.value = "";
      control.appendChild(blank);
      field.choices.forEach(function (choice) {
        var option = text("option", "", choice.label);
        option.value = choice.value;
        if (details.values[field.code] === choice.value) option.selected = true;
        control.appendChild(option);
      });
      control.value = details.values[field.code] || "";
      control.addEventListener("change", function () { patch(ctx.dispatch("details.choose", { code: field.code, value: control.value })); });
      wrap.appendChild(control);
    } else if (field.kind === "radio") {
      control = el("div", "cr-choices", { role: "radiogroup", id: id, "aria-describedby": errorId, "aria-required": field.required || field.askedFirst ? "true" : null });
      field.choices.forEach(function (choice, index) {
        var row = el("label", "cr-choice");
        var input = el("input", "cr-choice__input", { type: "radio", name: field.code, value: choice.value, id: index === 0 ? id + "-first" : null, disabled: pending });
        input.checked = details.values[field.code] === choice.value;
        input.addEventListener("change", function () { patch(ctx.dispatch("details.choose", { code: field.code, value: choice.value })); });
        row.appendChild(input);
        row.appendChild(el("span", "cr-radio", { "aria-hidden": "true" }));
        row.appendChild(text("span", "cr-choice__label", choice.label));
        control.appendChild(row);
      });
      wrap.appendChild(control);
    } else {
      var area = field.kind === "textarea";
      control = el(area ? "textarea" : "input", area ? "cr-input cr-input--area" : "cr-input", common(area ? { rows: 4 } : {
        type: field.kind === "email" ? "email" : field.kind === "tel" ? "tel" : "text",
        inputmode: field.kind === "tel" ? "tel" : field.kind === "email" ? "email" : null,
        autocomplete: AUTOCOMPLETE[field.code] || null,
      }));
      control.value = details.values[field.code] || "";
      control.addEventListener("input", function () { patch(ctx.dispatch("details.input", { code: field.code, value: control.value })); });
      control.addEventListener("blur", function () { patch(ctx.dispatch("details.blur", { code: field.code })); });
      if (field.kind === "address") {
        var anchor = el("div", "cr-address");
        anchor.appendChild(control);
        wrap.appendChild(anchor);
      } else {
        wrap.appendChild(control);
      }
    }
    mark(ctx, control, "field-" + field.code);
    if (field.description && field.kind !== "boolean") wrap.appendChild(text("p", "cr-field__hint", field.description, { id: id + "-hint" }));
    wrap.appendChild(errorNode);
    if (field.kind === "address") {
      var reuse = serviceAddressOffer(ctx, field, pending);
      if (reuse) wrap.appendChild(reuse);
      if (ctx.maps) {
        wrap.appendChild(ctx.maps.attachAddress(field.code, control, function (formatted) {
          control.value = formatted;
          patch(ctx.dispatch("details.input", { code: field.code, value: formatted }));
        }));
      }
    }
    return wrap;
  }

  function serviceAddressOffer(ctx, field, pending) {
    var copy = ctx.copy;
    var choices = ctx.snapshot.choices;
    var addresses = [];
    ctx.snapshot.view.properties.forEach(function (property) {
      var choice = choices[property.key];
      if (choice && choice.kind === "approve" && property.address && addresses.indexOf(property.address) === -1) addresses.push(property.address);
    });
    if (!addresses.length) return null;
    var current = String(ctx.snapshot.details.values[field.code] || "").trim();
    var row = el("div", "cr-reuse", { role: "group", "aria-labelledby": "cr-reuse-" + field.code });
    row.appendChild(text("p", "cr-reuse__label", copy.serviceAddressReuse, { id: "cr-reuse-" + field.code }));
    var chips = el("div", "cr-reuse__chips");
    addresses.forEach(function (address) {
      var chosen = current === address;
      chips.appendChild(button(address, "cr-chip", function () {
        ctx.dispatch("details.useAddress", { code: field.code, value: address });
      }, {
        "aria-label": ns.fill(copy.serviceAddressUse, { address: address }),
        "aria-pressed": chosen ? "true" : "false",
        "data-action": "details.useAddress",
        "data-state": chosen ? "chosen" : null,
        disabled: pending || ctx.busy,
      }));
    });
    row.appendChild(chips);
    return row;
  }

  function areaFact(ctx, value) {
    var facts = el("p", "cr-plan__area", { "data-fact": "total-area" });
    facts.appendChild(text("span", "cr-plan__area-label", ctx.copy.propertyArea));
    facts.appendChild(text("span", "cr-plan__area-value", ns.fill(ctx.copy.planAreaValue, { area: value })));
    return facts;
  }

  function propertySite(ctx, property) {
    if (property.plan) return planBlock(ctx, property);
    if (!property.area) return null;
    var block = el("div", "cr-plan cr-plan--facts", { "data-state": "area", "data-plan": property.key });
    block.appendChild(areaFact(ctx, property.area));
    return block;
  }

  function planBlock(ctx, property) {
    var copy = ctx.copy;
    var loaded = ctx.snapshot.plans && ctx.snapshot.plans[property.plan];
    var status = loaded ? loaded.status : "loading";
    var block = el("div", "cr-plan", { "data-state": status, "data-plan": property.key });
    block.appendChild(text("p", "cr-plan__title", copy.planTitle));
    if (status === "unavailable") {
      block.appendChild(text("p", "cr-note cr-plan__note", copy.planUnavailable));
      if (property.area) block.appendChild(areaFact(ctx, property.area));
      return block;
    }
    if (status !== "ready") {
      block.appendChild(el("div", "cr-plan__placeholder skeleton", { "aria-hidden": "true" }));
      block.appendChild(text("p", "cr-note cr-note--pending", copy.planLoading, { role: "status", "data-state": "pending" }));
      return block;
    }
    var plan = loaded.plan;
    if (ctx.maps) block.appendChild(ctx.maps.planView(property.key, plan));
    if (property.area) block.appendChild(areaFact(ctx, property.area));
    if (plan.areaText) {
      var facts = el("p", "cr-plan__area", { "data-fact": "plan-area" });
      facts.appendChild(text("span", "cr-plan__area-label", copy.planArea));
      facts.appendChild(text("span", "cr-plan__area-value", ns.fill(copy.planAreaValue, { area: plan.areaText })));
      block.appendChild(facts);
    }
    var legend = el("ul", "cr-plan__legend", { "aria-label": copy.planTitle });
    plan.elements.forEach(function (element) {
      var item = el("li", "cr-plan__element", { "data-kind": element.kind });
      item.appendChild(el("span", "cr-plan__swatch", { "data-tone": String(element.tone), "data-kind": element.kind, "aria-hidden": "true" }));
      item.appendChild(text("span", "cr-plan__name", element.name || ns.fill(copy.planElementFallback, { n: element.position })));
      if (element.areaText) item.appendChild(text("span", "cr-plan__size", ns.fill(copy.planAreaValue, { area: element.areaText })));
      legend.appendChild(item);
    });
    block.appendChild(legend);
    block.appendChild(text("p", "cr-plan__note", copy.planNote));
    return block;
  }

  function portalLink(ctx) {
    return text("a", "btn btn--ghost", ctx.copy.portalOpen, { href: ctx.snapshot.portalUrl, rel: "noreferrer", "data-action": "portal.open" });
  }

  function portalBody(ctx, className) {
    var email = ctx.snapshot.primaryEmail;
    if (!email) return text("p", className, ctx.copy.portalBody);
    var line = el("p", className);
    ctx.copy.portalEmailBody.split("{email}").forEach(function (part, index) {
      if (index > 0) line.appendChild(text("strong", "cr-portal__email", email));
      if (part) line.appendChild(text("span", "", part));
    });
    return line;
  }

  function portalInvitation(ctx) {
    var box = notice("info", ctx.copy.portalTitle, [portalBody(ctx, "cr-notice__text")], ctx.snapshot.portalUrl ? portalLink(ctx) : null);
    box.setAttribute("data-portal", "invitation");
    return box;
  }

  function portalReturn(ctx) {
    var box = notice("info", ctx.copy.portalTitle, [], portalLink(ctx), { quiet: true });
    box.setAttribute("data-portal", "return");
    return box;
  }

  function portalAside(ctx, title, line) {
    var aside = el("div", "cr-state__aside", { "data-portal": title ? "invitation" : "sign-in" });
    if (title) aside.appendChild(text("h2", "cr-state__aside-title", title));
    aside.appendChild(line);
    if (ctx.snapshot.portalUrl) aside.appendChild(portalLink(ctx));
    return aside;
  }

  function joinName(name, title) {
    if (!name) return "";
    return title ? name + ", " + title : name;
  }

  function providerLogo(ctx) {
    if (!ctx.snapshot.logoUrl) return null;
    var provider = ctx.snapshot.view.parties.provider.legalName;
    var image = el("img", "cr-party__logo", {
      src: ctx.snapshot.logoUrl,
      alt: provider ? ns.fill(ctx.copy.providerLogoAlt, { provider: provider }) : "",
      decoding: "async",
      referrerpolicy: "no-referrer",
    });
    image.addEventListener("error", function () { image.setAttribute("hidden", ""); });
    return image;
  }

  function statedFact(row) {
    return !!row[1];
  }

  function factsCard(ctx, title, rows, className, lead) {
    var copy = ctx.copy;
    var card = el("article", "cr-panel " + className);
    card.appendChild(text("h2", "cr-section-title", title));
    if (lead) card.appendChild(lead);
    var list = el("dl", "cr-facts");
    rows.forEach(function (row) {
      var item = el("div", "cr-facts__row");
      item.appendChild(text("dt", "cr-facts__label", row[0]));
      item.appendChild(text("dd", "cr-facts__value" + (row[1] ? "" : " cr-muted"), row[1] || copy.valueNotStated));
      list.appendChild(item);
    });
    card.appendChild(list);
    return card;
  }

  function approveSection(ctx) {
    var view = ctx.snapshot.view;
    var copy = ctx.copy;
    var recordKey = view.agreement.recordKey;
    var command = ctx.snapshot.commands[recordKey] || null;
    var pending = isPending(command);
    var card = el("section", "cr-panel cr-approve", { "data-state": pending ? "pending" : "idle" });
    if (command && command.status === "unconfirmed") {
      card.appendChild(unconfirmedNotice(ctx, recordKey));
      return card;
    }
    if (!view.canApproveAgreement && !view.canRequestAgreementChanges) {
      card.appendChild(text("p", "cr-note", copy.agreementNoAction));
      return card;
    }
    var confirm = ctx.snapshot.confirm;
    var confirming = Boolean(confirm && confirm.kind === "agreement");
    var changing = Boolean(confirm && confirm.kind === "agreement-changes");
    var actions = el("div", "cr-actions");
    if (changing) {
      var invalid = Boolean(ctx.snapshot.draftInvalid.agreement);
      card.setAttribute("role", "group");
      card.setAttribute("aria-labelledby", "cr-agreement-changes-title");
      var field = el("div", "cr-field", { "data-state": invalid ? "invalid" : "idle" });
      field.appendChild(text("label", "cr-field__label", copy.changesTitle, { for: "cr-draft-agreement", id: "cr-agreement-changes-title" }));
      field.appendChild(text("p", "cr-field__hint", copy.agreementChangesHint, { id: "cr-draft-hint-agreement" }));
      var area = el("textarea", "cr-input cr-input--area", {
        id: "cr-draft-agreement",
        name: "MESSAGE",
        rows: 5,
        placeholder: copy.agreementChangesPlaceholder,
        "aria-required": "true",
        "aria-invalid": invalid ? "true" : null,
        "aria-describedby": "cr-draft-hint-agreement cr-draft-error-agreement",
        disabled: pending,
      });
      area.value = ctx.snapshot.drafts.agreement || "";
      area.addEventListener("input", function () { ctx.dispatch("agreement.draft", { value: area.value }); });
      mark(ctx, area, "draft-agreement");
      field.appendChild(area);
      field.appendChild(text("p", "cr-field__error", invalid ? copy.changesRequired : "", { id: "cr-draft-error-agreement" }));
      card.appendChild(field);
      actions.appendChild(button(pending ? copy.sendingLabel : copy.changesSend, "btn--primary btn--lg", function () {
        ctx.dispatch("agreement.changes.send");
      }, { disabled: pending || ctx.busy, "data-state": pending ? "pending" : null, "data-action": "agreement.changes.send", "aria-busy": pending ? "true" : null }));
      actions.appendChild(button(copy.cancelLabel, "btn--ghost btn--lg", function () { ctx.dispatch("agreement.cancel"); }, { disabled: pending, "data-action": "agreement.cancel" }));
    } else if (confirming) {
      card.setAttribute("role", "group");
      card.setAttribute("aria-labelledby", "cr-agreement-confirm");
      card.appendChild(text("p", "cr-confirm__title", copy.agreementConfirmTitle, { id: "cr-agreement-confirm" }));
      var client = view.parties.client.legalName || view.names.client;
      if (client) card.appendChild(text("p", "cr-confirm__body", ns.fill(copy.agreementConfirmBody, { client: client })));
      card.appendChild(billingField(ctx, pending));
      var confirmButton = button(pending ? copy.sendingLabel : copy.agreementConfirmButton, "btn--primary btn--lg", function () {
        ctx.dispatch("agreement.confirm");
      }, { disabled: pending || ctx.busy, "data-state": pending ? "pending" : null, "data-action": "agreement.confirm", "aria-busy": pending ? "true" : null });
      mark(ctx, confirmButton, "confirm-agreement");
      actions.appendChild(confirmButton);
      actions.appendChild(button(copy.cancelLabel, "btn--ghost btn--lg", function () { ctx.dispatch("agreement.cancel"); }, { disabled: pending, "data-action": "agreement.cancel" }));
    } else {
      if (view.canApproveAgreement) {
        actions.appendChild(mark(ctx, button(copy.agreementApprove, "btn--primary btn--lg", function () {
          ctx.dispatch("agreement.intent");
        }, { disabled: ctx.busy || pending, "data-action": "agreement.approve" }), "approve-agreement"));
      }
      if (view.canRequestAgreementChanges) {
        actions.appendChild(mark(ctx, button(copy.changesLabel, "btn--ghost btn--lg", function () {
          ctx.dispatch("agreement.changes");
        }, { disabled: ctx.busy || pending, "data-action": "agreement.changes" }), "agreement-changes"));
      }
    }
    card.appendChild(actions);
    if (command && !pending) card.appendChild(outcomeBox(ctx, command, { action: refreshButton(ctx, recordKey, copy.refreshLabel) }));
    return card;
  }

  function billingField(ctx, pending) {
    var copy = ctx.copy;
    var billing = ctx.snapshot.billing;
    var message = billing.invalid ? copy.billingAddressRequired : "";
    var field = el("div", "cr-field cr-billing", { "data-module": "billing-address", "data-state": message ? "invalid" : "idle", role: "group", "aria-labelledby": "cr-billing-label" });
    field.appendChild(text("p", "cr-field__label", copy.billingAddressLabel, { id: "cr-billing-label" }));
    field.appendChild(text("p", "cr-field__hint", copy.billingAddressHint, { id: "cr-billing-hint" }));
    var toggle = el("label", "cr-choice", { for: "cr-billing-same" });
    var same = el("input", "cr-choice__input", { type: "checkbox", id: "cr-billing-same", name: "BILLING_SAME_AS_LEGAL", disabled: pending });
    same.checked = billing.same;
    same.addEventListener("change", function () { ctx.dispatch("agreement.billing.same", { value: same.checked }); });
    mark(ctx, same, "billing-same");
    toggle.appendChild(same);
    toggle.appendChild(el("span", "cr-check", { "aria-hidden": "true" }));
    toggle.appendChild(text("span", "cr-choice__label", copy.billingSameAsLegal));
    field.appendChild(toggle);
    if (!billing.same) {
      var input = el("input", "cr-input", {
        type: "text",
        id: "cr-billing-address",
        name: "BILLING_ADDRESS",
        autocomplete: "street-address",
        maxlength: String(ns.contract.agreementEvents.approve.billingAddressLimit),
        "aria-labelledby": "cr-billing-label",
        "aria-describedby": "cr-billing-hint cr-billing-error",
        "aria-required": "true",
        "aria-invalid": message ? "true" : null,
        disabled: pending,
      });
      input.value = billing.value;
      input.addEventListener("input", function () { ctx.dispatch("agreement.billing.value", { value: input.value }); });
      mark(ctx, input, "billing-address");
      field.appendChild(input);
    }
    field.appendChild(text("p", "cr-field__error", message, { id: "cr-billing-error", role: message ? "alert" : null }));
    return field;
  }

  function clauseItem(block) {
    var item = el("li", "cr-terms__clause", { "data-depth": String(Math.min(block.depth, 3)) });
    item.appendChild(text("span", "cr-terms__number", block.number));
    item.appendChild(text("span", "cr-terms__clause-text", block.text));
    return item;
  }

  function agreementPage(shell, ctx) {
    var view = ctx.snapshot.view;
    var copy = ctx.copy;
    var completion = view.kind === "completion";
    var reviewing = view.kind === "agreement-review";
    var changesRequested = view.kind === "reference" && view.banner === "changes";
    var badgeNode = reviewing ? text("span", "status-badge status-badge--info", copy.agreementAwaiting)
      : completion ? text("span", "status-badge status-badge--ok", view.completion === "active" ? copy.agreementActive : copy.agreementApproved)
        : changesRequested ? text("span", "status-badge status-badge--warn", copy.agreementChangesBadge)
          : null;
    var title = completion ? (view.completion === "active" ? copy.completeActiveTitle : copy.completeApprovedTitle)
      : changesRequested ? copy.agreementChangesSentTitle : copy.agreementTitle;
    var subtitle = completion ? (view.completion === "finishing" ? copy.completeFinishingBody : copy.completeBody)
      : reviewing ? copy.agreementSubtitle : changesRequested ? copy.agreementChangesSentBody : "";
    shell.appendChild(pageHead(ctx, copy.agreementEyebrow, title, subtitle, badgeNode));
    if (completion) shell.appendChild(portalInvitation(ctx));
    if (view.kind === "reference" && !changesRequested) shell.appendChild(notice("warn", "", view.banner === "expired" ? copy.agreementExpired : copy.agreementSuspended, null));
    readNotices(ctx).forEach(function (node) { shell.appendChild(node); });

    var parties = view.parties;
    var partiesSection = el("div", "cr-parties");
    partiesSection.appendChild(factsCard(ctx, copy.partyProvider, [
      [copy.partyLegalName, parties.provider.legalName],
      [copy.partyRepresentative, joinName(parties.provider.representativeName, parties.provider.representativeJobTitle)],
    ].filter(statedFact), "cr-party", providerLogo(ctx)));
    partiesSection.appendChild(factsCard(ctx, copy.partyClient, [
      [copy.partyLegalName, parties.client.legalName],
      [copy.partyClientType, parties.client.clientType],
      [copy.partyBillingAddress, parties.client.billingAddress],
      [copy.partyRepresentative, joinName(parties.client.representativeName, parties.client.representativeJobTitle)],
      [copy.partyEmail, parties.client.email],
      [copy.partyPhone, parties.client.phone],
    ].filter(statedFact), "cr-party"));
    shell.appendChild(partiesSection);

    var term = view.agreement;
    var termRows = [[copy.termEffective, term.effectiveDate], [copy.termStart, term.termStart], [copy.termEnd, term.termEnd]]
      .filter(function (row) { return row[1]; });
    if (termRows.length) shell.appendChild(factsCard(ctx, copy.termTitle, termRows, "cr-term"));

    var services = el("section", "cr-services", { "aria-labelledby": "cr-services-title" });
    services.appendChild(text("h2", "cr-section-heading", copy.servicesTitle, { id: "cr-services-title" }));
    view.properties.forEach(function (property) { services.appendChild(propertyCard(ctx, property, false)); });
    if (!view.properties.length && !view.unreadableOrders) services.appendChild(text("p", "cr-note", copy.linesEmpty));
    shell.appendChild(services);

    var terms = el("section", "cr-panel cr-terms", { "aria-labelledby": "cr-terms-title" });
    terms.appendChild(text("h2", "cr-section-title", copy.termsTitle, { id: "cr-terms-title" }));
    if (!term.terms.length) terms.appendChild(text("p", "cr-note", copy.termsEmpty));
    var list = null;
    var clauses = null;
    term.terms.forEach(function (block) {
      if (block.kind === "item") {
        clauses = null;
        if (!list) {
          list = el("ul", "cr-terms__list");
          terms.appendChild(list);
        }
        list.appendChild(text("li", "", block.text));
        return;
      }
      list = null;
      if (block.kind === "clause") {
        if (!clauses) {
          clauses = el("ol", "cr-terms__clauses", { role: "list" });
          terms.appendChild(clauses);
        }
        clauses.appendChild(clauseItem(block));
        return;
      }
      clauses = null;
      terms.appendChild(text(block.kind === "heading" ? "h3" : "p", block.kind === "heading" ? "cr-terms__heading" : "cr-terms__paragraph", block.text));
    });
    shell.appendChild(terms);

    if (reviewing) shell.appendChild(approveSection(ctx));
    if (completion && ctx.snapshot.portalUrl) shell.appendChild(portalReturn(ctx));
    announceUnconfirmed(ctx);
  }

  function ready(shell, ctx) {
    var view = ctx.snapshot.view;
    var copy = ctx.copy;
    switch (view.kind) {
      case "quote-review":
        quoteReview(shell, ctx);
        return;
      case "agreement-review":
      case "reference":
      case "completion":
        agreementPage(shell, ctx);
        return;
      case "preparing":
        shell.appendChild(announcedCard(ctx, "progress", "…", copy.preparingTitle, copy.preparingBody, null));
        return;
      case "closed":
        shell.appendChild(view.reason === "archived"
          ? announcedCard(ctx, "neutral", "⊘", copy.archivedTitle, copy.archivedBody, null)
          : announcedCard(ctx, "neutral", "⊘", copy.canceledTitle, copy.canceledBody, null));
        return;
      case "empty":
        shell.appendChild(announcedCard(ctx, "neutral", "○", copy.emptyTitle, copy.emptyBody, null));
        return;
      default:
        shell.appendChild(announcedCard(ctx, "warn", "!", copy.unavailableTitle, view.reason === "ambiguous-round" ? copy.roundAmbiguousBody : copy.unavailableBody, null));
    }
  }

  function contactLine(label, value, href, kind) {
    var item = el("li", "cr-contact__item", { "data-contact": kind });
    item.appendChild(text("span", "cr-contact__label", label));
    item.appendChild(href ? text("a", "cr-contact__link", value, { href: href }) : text("span", "cr-contact__value", value));
    return item;
  }

  function contactBlock(ctx) {
    var contact = ctx.snapshot.contact;
    if (!contact || (!contact.phone && !contact.email)) return null;
    var copy = ctx.copy;
    var block = el("section", "cr-contact", { "aria-labelledby": "cr-contact-title" });
    var identity = el("div", "cr-contact__identity");
    identity.appendChild(text("h2", "cr-contact__title", copy.contactTitle, { id: "cr-contact-title" }));
    if (contact.name) identity.appendChild(text("p", "cr-contact__name", contact.name));
    block.appendChild(identity);
    var list = el("ul", "cr-contact__list");
    if (contact.phone) list.appendChild(contactLine(copy.contactPhone, contact.phone, contact.phoneHref, "phone"));
    if (contact.email) list.appendChild(contactLine(copy.contactEmail, contact.email, contact.emailHref, "email"));
    block.appendChild(list);
    return block;
  }

  function closedCard(ctx) {
    var copy = ctx.copy;
    var after = ctx.snapshot.closedAfter;
    if (!after) {
      var signIn = ctx.snapshot.portalUrl ? portalAside(ctx, "", text("p", "cr-state__aside-text", copy.linkClosedPortal)) : null;
      return announcedCard(ctx, "neutral", "⊘", copy.linkClosedTitle, copy.linkClosedBody, signIn);
    }
    if (after === "approval") {
      return announcedCard(ctx, "ok", "✓", copy.approvalSentTitle, copy.approvalSentBody, portalAside(ctx, copy.portalTitle, portalBody(ctx, "cr-state__aside-text")));
    }
    if (after === "declined") return announcedCard(ctx, "neutral", "⊘", copy.canceledTitle, copy.declinedClosedBody, null);
    return announcedCard(ctx, "ok", "✓", copy.detailsSentTitle, copy.detailsSentBody, null);
  }

  function renderPage(mount, snapshot, dispatch, copy, services) {
    var ctx = {
      snapshot: snapshot,
      dispatch: dispatch,
      copy: copy,
      maps: services && services.maps ? services.maps : null,
      focus: {},
      announcement: "",
      linkStatus: "",
      pdfStatus: "",
      busy: snapshot.refreshing || snapshot.phase !== "ready" || Boolean(snapshot.bulk),
    };
    var page = el("div", "cr-page", {
      "data-phase": snapshot.phase,
      "data-kind": snapshot.view ? snapshot.view.kind : null,
      "aria-busy": snapshot.phase === "loading" || snapshot.refreshing ? "true" : null,
    });
    var shell = el("div", "cr-shell");
    page.appendChild(shell);
    switch (snapshot.phase) {
      case "loading":
        shell.appendChild(skeleton(copy));
        break;
      case "unconfigured":
        shell.appendChild(stateCard("warn", "!", copy.unconfiguredTitle, copy.unconfiguredBody, null));
        break;
      case "link-missing":
        shell.appendChild(stateCard("warn", "?", copy.linkMissingTitle, copy.linkMissingBody, null));
        break;
      case "link-closed":
        shell.appendChild(closedCard(ctx));
        break;
      case "error":
        shell.appendChild(announcedCard(ctx, "error", "!", copy.errorTitle, snapshot.errorAfterCommand ? copy.readbackErrorBody : copy.errorBody,
          button(copy.retryLabel, "btn--primary btn--lg", function () { dispatch("retry"); }, { "data-action": "retry" })));
        break;
      default:
        if (snapshot.view) ready(shell, ctx);
    }
    var contact = contactBlock(ctx);
    if (contact) shell.appendChild(contact);
    mount.replaceChildren();
    mount.appendChild(page);
    return { focus: ctx.focus, announcement: ctx.announcement, linkStatus: ctx.linkStatus, pdfStatus: ctx.pdfStatus };
  }

  ns.components = Object.freeze({
    renderPage: renderPage,
    optionLabel: optionLabel,
    confirmationStatement: confirmationStatement,
  });
})(typeof window !== "undefined" ? window : globalThis);
