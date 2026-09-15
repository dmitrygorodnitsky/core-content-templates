(function (global) {
  "use strict";

  var ns = global.ClientReview || (global.ClientReview = {});

  var OPTION_BADGE = {
    new: ["status-badge--info", "optionNew"],
    viewed: ["status-badge--info", "optionViewed"],
    approved: ["status-badge--ok", "optionApproved"],
    declined: ["status-badge--danger", "optionDeclined"],
    changes: ["status-badge--warn", "optionChanges"],
    revising: ["status-badge--warn", "optionRevising"],
    unknown: ["status-badge--scheduled", "optionUnknown"],
  };

  var PROPERTY_BADGE = {
    awaiting: ["status-badge--info", "propertyAwaiting"],
    approved: ["status-badge--ok", "propertyApproved"],
    declined: ["status-badge--danger", "propertyDeclined"],
    changes: ["status-badge--warn", "propertyChanges"],
    unknown: ["status-badge--scheduled", "propertyUnknown"],
  };

  var MODEL_COPY = { SEASONAL: "modelSeasonal", MONTHLY: "modelMonthly", PER_SERVICE: "modelPerService" };

  var AUTOCOMPLETE = {
    LEGAL_NAME: "organization",
    BILLING_ADDRESS: "street-address",
    REPRESENTATIVE_FIRST_NAME: "given-name",
    REPRESENTATIVE_LAST_NAME: "family-name",
    REPRESENTATIVE_JOB_TITLE: "organization-title",
    REPRESENTATIVE_EMAIL: "email",
    REPRESENTATIVE_PHONE: "tel",
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
    return option.model ? copy[MODEL_COPY[option.model]] : ns.fill(copy.optionFallback, { n: option.position });
  }

  function isPending(command) {
    return Boolean(command && command.status === "pending");
  }

  function stateCard(tone, glyph, title, body, action) {
    var card = el("section", "cr-panel cr-state cr-state--" + tone, { "data-state": tone, role: tone === "error" ? "alert" : "status" });
    card.appendChild(text("div", "cr-state__glyph", glyph, { "aria-hidden": "true" }));
    card.appendChild(text("h1", "cr-state__title", title));
    if (body) card.appendChild(text("p", "cr-state__body", body));
    if (action) card.appendChild(action);
    return card;
  }

  function notice(tone, title, body, action) {
    var box = el("div", "cr-notice cr-notice--" + tone, { role: "status", "data-state": tone });
    box.appendChild(text("span", "cr-notice__icon", tone === "ok" ? "✓" : tone === "warn" ? "!" : "i", { "aria-hidden": "true" }));
    var content = el("div", "cr-notice__body");
    if (title) content.appendChild(text("p", "cr-notice__title", title));
    if (body) content.appendChild(text("p", "cr-notice__text", body));
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

  function pageHead(ctx, eyebrow, title, subtitle, badgeNode) {
    var view = ctx.snapshot.view;
    var copy = ctx.copy;
    var head = el("header", "cr-head");
    var top = el("div", "cr-head__top");
    top.appendChild(text("p", "cr-eyebrow", eyebrow));
    if (badgeNode) top.appendChild(badgeNode);
    head.appendChild(top);
    head.appendChild(text("h1", "cr-title", title));
    if (subtitle) head.appendChild(text("p", "cr-sub", subtitle));
    var meta = el("dl", "cr-meta");
    [[copy.fromLabel, view.names && view.names.provider], [copy.forLabel, view.names && view.names.client]].forEach(function (entry) {
      if (!entry[1]) return;
      var item = el("div", "cr-meta__item");
      item.appendChild(text("dt", "cr-meta__label", entry[0]));
      item.appendChild(text("dd", "cr-meta__value", entry[1]));
      meta.appendChild(item);
    });
    if (meta.children.length) head.appendChild(meta);
    if (view.expiresAt) head.appendChild(text("p", "cr-validity", ns.fill(copy.linkValidUntil, { date: view.expiresAt })));
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
    if (view.accountUnavailable && view.kind === "contract-details") found.push(notice("warn", "", copy.accountPartial, null));
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
    if (!option.lines.length) return text("p", "cr-note", copy.linesEmpty);
    var wrap = el("div", "cr-lines-wrap");
    var table = el("table", "cr-lines");
    var head = el("thead");
    var headRow = el("tr");
    headRow.appendChild(text("th", "", copy.lineService, { scope: "col" }));
    headRow.appendChild(text("th", "cr-num", copy.lineQuantity, { scope: "col" }));
    headRow.appendChild(text("th", "cr-num", copy.lineUnitPrice, { scope: "col" }));
    head.appendChild(headRow);
    table.appendChild(head);
    var body = el("tbody");
    option.lines.forEach(function (line) {
      var row = el("tr", "", { "data-line": line.key });
      row.appendChild(text("td", "cr-lines__service" + (line.product ? "" : " cr-muted"), line.product || copy.serviceUnnamed, { "data-label": copy.lineService }));
      row.appendChild(text("td", "cr-num" + (line.quantity ? "" : " cr-muted"), line.quantity || copy.valueNotStated, { "data-label": copy.lineQuantity }));
      row.appendChild(text("td", "cr-num" + (line.unitPrice ? "" : " cr-muted"), line.unitPrice || copy.valueNotStated, { "data-label": copy.lineUnitPrice }));
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
    var total = el("div", "cr-total");
    total.appendChild(text("span", "cr-total__label", copy.orderTotal));
    total.appendChild(text("span", "cr-total__value" + (option.total ? "" : " cr-muted"), option.total || copy.valueNotStated));
    body.appendChild(total);
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

  function actionRow(ctx, option) {
    var copy = ctx.copy;
    var disabled = ctx.busy || isPending(ctx.snapshot.commands[option.recordKey]);
    var row = el("div", "cr-actions");
    function intent(kind) {
      return function () { ctx.dispatch("option.intent", { id: option.id, kind: kind }); };
    }
    if (option.actions.approve) row.appendChild(button(copy.approveLabel, "btn--primary btn--lg", intent("approve"), { disabled: disabled, "data-action": "option.approve" }));
    if (option.actions.changes) row.appendChild(button(copy.changesLabel, "btn--ghost btn--lg", intent("changes"), { disabled: disabled, "data-action": "option.changes" }));
    if (option.actions.decline) row.appendChild(button(copy.declineLabel, "btn--danger btn--lg", intent("decline"), { disabled: disabled, "data-action": "option.decline" }));
    return row;
  }

  function confirmPanel(ctx, property, option, confirm, pending) {
    var copy = ctx.copy;
    var label = optionLabel(option, copy);
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
    } else {
      panel.appendChild(text("p", "cr-confirm__title", ns.fill(kind === "approve" ? copy.approveConfirmTitle : copy.declineConfirmTitle, { option: label }), { id: titleId }));
      var others = property.options.some(function (other) { return other.id !== option.id && other.status !== "declined"; });
      var body = kind === "approve" ? (others ? copy.approveConfirmOthers : "") : copy.declineConfirmBody;
      if (body) panel.appendChild(text("p", "cr-confirm__body", body));
    }
    var actions = el("div", "cr-actions");
    var confirmLabel = pending ? copy.sendingLabel
      : kind === "approve" ? copy.approveConfirmButton
        : kind === "decline" ? copy.declineConfirmButton : copy.changesSend;
    var confirmButton = button(confirmLabel, kind === "decline" ? "btn--danger btn--lg" : "btn--primary btn--lg", function () {
      ctx.dispatch("option.confirm", { id: option.id });
    }, { disabled: pending || ctx.busy, "data-state": pending ? "pending" : null, "data-action": "option.confirm", "aria-busy": pending ? "true" : null });
    if (kind !== "changes") mark(ctx, confirmButton, "confirm-" + option.id);
    actions.appendChild(confirmButton);
    actions.appendChild(button(copy.cancelLabel, "btn--ghost btn--lg", function () {
      ctx.dispatch("option.cancel", { id: option.id });
    }, { disabled: pending, "data-action": "option.cancel" }));
    panel.appendChild(actions);
    return panel;
  }

  function optionFooter(body, ctx, property, option) {
    var copy = ctx.copy;
    var command = ctx.snapshot.commands[option.recordKey] || null;
    var pending = isPending(command);
    if (command && command.event === ns.contract.orderEvents.view.code) {
      if (pending) {
        body.appendChild(text("p", "cr-note cr-note--pending", copy.viewPending, { role: "status", "data-state": "pending" }));
        return;
      }
      body.appendChild(outcomeBox(ctx, command, {
        title: copy.viewFailed,
        action: button(copy.retryLabel, "btn--ghost", function () { ctx.dispatch("option.view", { id: option.id }); }, { disabled: ctx.busy, "data-action": "option.view" }),
      }));
      return;
    }
    if (option.siblingApproved && option.awaitingClient) {
      body.appendChild(text("p", "cr-note", copy.noteSiblingApproved));
      return;
    }
    var decisions = option.actions.approve || option.actions.decline || option.actions.changes;
    if (!decisions) {
      if (option.awaitingClient && !option.actions.view) body.appendChild(text("p", "cr-note", copy.noteNoActions));
      return;
    }
    var confirm = ctx.snapshot.confirm && ctx.snapshot.confirm.kind !== "agreement" && ctx.snapshot.confirm.id === option.id ? ctx.snapshot.confirm : null;
    body.appendChild(confirm ? confirmPanel(ctx, property, option, confirm, pending) : actionRow(ctx, option));
    if (command && !pending) {
      body.appendChild(outcomeBox(ctx, command, { action: refreshButton(ctx, option.recordKey, copy.refreshLabel) }));
    }
  }

  function optionItem(ctx, property, option) {
    var copy = ctx.copy;
    var expanded = Boolean(ctx.snapshot.expanded[option.id]);
    var bodyId = "cr-option-" + option.id;
    var item = el("li", "cr-option", { "data-state": option.status, "data-expanded": expanded ? "true" : "false" });
    var toggle = el("button", "cr-option__toggle", {
      type: "button",
      "aria-expanded": expanded ? "true" : "false",
      "aria-controls": expanded ? bodyId : null,
      "data-action": "option.toggle",
    });
    toggle.appendChild(text("span", "cr-option__label", optionLabel(option, copy)));
    toggle.appendChild(badge(OPTION_BADGE, option.status, copy));
    toggle.appendChild(text("span", "cr-visually-hidden", expanded ? copy.hideOption : copy.showOption));
    toggle.appendChild(el("span", "cr-option__chevron", { "aria-hidden": "true" }));
    toggle.addEventListener("click", function () { ctx.dispatch("option.toggle", { id: option.id }); });
    mark(ctx, toggle, "toggle-" + option.id);
    item.appendChild(toggle);
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

  function propertyCard(ctx, property, interactive) {
    var copy = ctx.copy;
    var headingId = "cr-" + property.key;
    var card = el("section", "cr-property", { "data-state": property.status, "aria-labelledby": headingId });
    var head = el("header", "cr-property__head");
    head.appendChild(el("span", "cr-pin", { "aria-hidden": "true" }));
    var identity = el("div", "cr-property__identity");
    identity.appendChild(text("h2", "cr-property__address" + (property.address ? "" : " cr-muted"), property.address || copy.addressUnavailable, { id: headingId }));
    identity.appendChild(text("p", "cr-property__meta", property.options.length === 1 ? copy.optionsOne : ns.fill(copy.optionsMany, { n: property.options.length })));
    head.appendChild(identity);
    if (interactive) head.appendChild(badge(PROPERTY_BADGE, property.status, copy));
    card.appendChild(head);
    var list = el("ol", "cr-options");
    property.options.forEach(function (option) {
      list.appendChild(interactive ? optionItem(ctx, property, option) : optionStatic(ctx, option));
    });
    card.appendChild(list);
    return card;
  }

  function quoteReview(shell, ctx) {
    var view = ctx.snapshot.view;
    var copy = ctx.copy;
    shell.appendChild(pageHead(ctx, copy.quoteEyebrow, copy.quoteTitle, copy.quoteSubtitle, null));
    shell.appendChild(summary(ctx));
    readNotices(ctx).forEach(function (node) { shell.appendChild(node); });
    if (view.allDecided) shell.appendChild(notice("ok", copy.decidedTitle, copy.decidedBody, refreshButton(ctx, "", copy.checkAgain)));
    if (!view.properties.length && !view.unreadableOrders) {
      shell.appendChild(stateCard("neutral", "○", copy.emptyTitle, copy.emptyBody, null));
      return;
    }
    var list = el("div", "cr-properties");
    view.properties.forEach(function (property) { list.appendChild(propertyCard(ctx, property, true)); });
    shell.appendChild(list);
  }

  function fieldNode(ctx, field, pending) {
    var details = ctx.snapshot.details;
    var copy = ctx.copy;
    var id = "cr-field-" + field.code;
    var errorId = id + "-error";
    var clientError = details.touched[field.code] ? details.errors[field.code] || "" : "";
    var message = clientError || details.serverErrors[field.code] || "";
    var wrap = el("div", "cr-field", { "data-code": field.code, "data-kind": field.kind, "data-state": message ? "invalid" : "idle" });
    var errorNode = text("p", "cr-field__error", message, { id: errorId, role: message ? "alert" : null });
    var control;

    function common(extra) {
      return Object.assign({
        id: id,
        name: field.code,
        "aria-describedby": errorId,
        "aria-invalid": message ? "true" : null,
        "aria-required": field.required ? "true" : null,
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
      if (field.required) label.appendChild(text("span", "cr-req", "*", { "aria-hidden": "true" }));
      wrap.appendChild(label);
    }

    if (field.kind === "boolean") {
      var toggle = el("label", "cr-choice", { for: id });
      control = el("input", "cr-choice__input", common({ type: "checkbox" }));
      control.checked = details.values[field.code] === true;
      control.addEventListener("change", function () { patch(ctx.dispatch("details.choose", { code: field.code, value: control.checked })); });
      toggle.appendChild(control);
      toggle.appendChild(el("span", "cr-check", { "aria-hidden": "true" }));
      var caption = text("span", "cr-choice__label", field.label);
      if (field.required) caption.appendChild(text("span", "cr-req", "*", { "aria-hidden": "true" }));
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
      control = el("div", "cr-choices", { role: "radiogroup", id: id, "aria-describedby": errorId, "aria-required": field.required ? "true" : null });
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
      wrap.appendChild(control);
    }
    mark(ctx, control, "field-" + field.code);
    wrap.appendChild(errorNode);
    return wrap;
  }

  function detailsForm(ctx) {
    var view = ctx.snapshot.view;
    var copy = ctx.copy;
    var card = el("section", "cr-panel cr-form-card", { "aria-labelledby": "cr-details-title" });
    card.appendChild(text("h2", "cr-section-title", copy.detailsFormTitle, { id: "cr-details-title" }));
    if (!view.details.available) {
      card.appendChild(text("p", "cr-note", copy.detailsUnavailable));
      return card;
    }
    var command = ctx.snapshot.commands[view.agreement.recordKey] || null;
    var pending = isPending(command);
    var form = el("form", "cr-form", { novalidate: true, "data-state": pending ? "pending" : "idle" });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      ctx.dispatch("details.submit");
    });
    var fields = el("div", "cr-fields");
    view.details.fields.forEach(function (field) { fields.appendChild(fieldNode(ctx, field, pending)); });
    form.appendChild(fields);
    var details = ctx.snapshot.details;
    var invalid = view.details.fields.some(function (field) { return details.touched[field.code] && details.errors[field.code]; });
    if (details.invalid && invalid) form.appendChild(notice("warn", "", copy.detailsInvalid, null));
    if (command && command.status === "refused") {
      var mapped = Object.keys(details.serverErrors).length > 0;
      if (command.message || !mapped) {
        form.appendChild(outcomeBox(ctx, { status: "refused", message: command.message }, { title: copy.detailsRefusedTitle }));
      }
    }
    if (command && command.status === "failed") {
      form.appendChild(outcomeBox(ctx, command, { action: refreshButton(ctx, view.agreement.recordKey, copy.refreshLabel) }));
    }
    var actions = el("div", "cr-form-actions");
    actions.appendChild(text("button", "btn btn--primary btn--lg", pending ? copy.sendingLabel : copy.detailsSubmit, {
      type: "submit",
      disabled: pending || ctx.busy,
      "data-state": pending ? "pending" : null,
      "data-action": "details.submit",
      "aria-busy": pending ? "true" : null,
    }));
    form.appendChild(actions);
    card.appendChild(form);
    return card;
  }

  function approvedEntries(view) {
    var entries = [];
    view.properties.forEach(function (property) {
      property.options.forEach(function (option) {
        if (option.status === "approved") entries.push({ address: property.address, option: option });
      });
    });
    return entries;
  }

  function contractDetails(shell, ctx) {
    var view = ctx.snapshot.view;
    var copy = ctx.copy;
    shell.appendChild(pageHead(ctx, copy.detailsEyebrow, copy.detailsTitle, copy.detailsSubtitle, null));
    readNotices(ctx).forEach(function (node) { shell.appendChild(node); });
    var approved = approvedEntries(view);
    if (approved.length) {
      var section = el("section", "cr-panel cr-approved", { "aria-labelledby": "cr-approved-title" });
      section.appendChild(text("h2", "cr-section-title", copy.detailsApprovedTitle, { id: "cr-approved-title" }));
      var list = el("ul", "cr-approved__list");
      approved.forEach(function (entry) {
        var item = el("li", "cr-approved__item");
        var identity = el("div", "cr-approved__identity");
        identity.appendChild(text("span", "cr-approved__address" + (entry.address ? "" : " cr-muted"), entry.address || copy.addressUnavailable));
        identity.appendChild(text("span", "cr-approved__option", optionLabel(entry.option, copy)));
        item.appendChild(identity);
        item.appendChild(text("span", "cr-approved__total" + (entry.option.total ? "" : " cr-muted"), entry.option.total || copy.valueNotStated));
        list.appendChild(item);
      });
      section.appendChild(list);
      shell.appendChild(section);
    }
    shell.appendChild(detailsForm(ctx));
  }

  function joinName(name, title) {
    if (!name) return "";
    return title ? name + ", " + title : name;
  }

  function factsCard(ctx, title, rows, className) {
    var copy = ctx.copy;
    var card = el("article", "cr-panel " + className);
    card.appendChild(text("h2", "cr-section-title", title));
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
    if (!view.canApproveAgreement) {
      card.appendChild(text("p", "cr-note", copy.agreementNoAction));
      return card;
    }
    var confirming = Boolean(ctx.snapshot.confirm && ctx.snapshot.confirm.kind === "agreement");
    var actions = el("div", "cr-actions");
    if (confirming) {
      card.setAttribute("role", "group");
      card.setAttribute("aria-labelledby", "cr-agreement-confirm");
      card.appendChild(text("p", "cr-confirm__title", copy.agreementConfirmTitle, { id: "cr-agreement-confirm" }));
      var client = view.parties.client.legalName || view.names.client;
      if (client) card.appendChild(text("p", "cr-confirm__body", ns.fill(copy.agreementConfirmBody, { client: client })));
      var confirmButton = button(pending ? copy.sendingLabel : copy.agreementConfirmButton, "btn--primary btn--lg", function () {
        ctx.dispatch("agreement.confirm");
      }, { disabled: pending || ctx.busy, "data-state": pending ? "pending" : null, "data-action": "agreement.confirm", "aria-busy": pending ? "true" : null });
      mark(ctx, confirmButton, "confirm-agreement");
      actions.appendChild(confirmButton);
      actions.appendChild(button(copy.cancelLabel, "btn--ghost btn--lg", function () { ctx.dispatch("agreement.cancel"); }, { disabled: pending, "data-action": "agreement.cancel" }));
    } else {
      actions.appendChild(mark(ctx, button(copy.agreementApprove, "btn--primary btn--lg", function () {
        ctx.dispatch("agreement.intent");
      }, { disabled: ctx.busy || pending, "data-action": "agreement.approve" }), "approve-agreement"));
    }
    card.appendChild(actions);
    if (command && !pending) card.appendChild(outcomeBox(ctx, command, { action: refreshButton(ctx, recordKey, copy.refreshLabel) }));
    return card;
  }

  function agreementPage(shell, ctx) {
    var view = ctx.snapshot.view;
    var copy = ctx.copy;
    var completion = view.kind === "completion";
    var reviewing = view.kind === "agreement-review";
    var badgeNode = reviewing ? text("span", "status-badge status-badge--info", copy.agreementAwaiting)
      : completion ? text("span", "status-badge status-badge--ok", view.completion === "active" ? copy.agreementActive : copy.agreementApproved)
        : null;
    var title = completion ? (view.completion === "active" ? copy.completeActiveTitle : copy.completeApprovedTitle) : copy.agreementTitle;
    var subtitle = completion ? copy.completeBody : reviewing ? copy.agreementSubtitle : "";
    shell.appendChild(pageHead(ctx, copy.agreementEyebrow, title, subtitle, badgeNode));
    if (completion && view.portalAccess) shell.appendChild(notice("ok", "", copy.completePortal, null));
    if (view.kind === "reference") shell.appendChild(notice("warn", "", view.banner === "expired" ? copy.agreementExpired : copy.agreementSuspended, null));
    readNotices(ctx).forEach(function (node) { shell.appendChild(node); });

    var parties = view.parties;
    var partiesSection = el("div", "cr-parties");
    partiesSection.appendChild(factsCard(ctx, copy.partyProvider, [
      [copy.partyLegalName, parties.provider.legalName],
      [copy.partyRepresentative, joinName(parties.provider.representativeName, parties.provider.representativeJobTitle)],
    ], "cr-party"));
    partiesSection.appendChild(factsCard(ctx, copy.partyClient, [
      [copy.partyLegalName, parties.client.legalName],
      [copy.partyClientType, parties.client.clientType],
      [copy.partyBillingAddress, parties.client.billingAddress],
      [copy.partyRepresentative, joinName(parties.client.representativeName, parties.client.representativeJobTitle)],
      [copy.partyEmail, parties.client.email],
      [copy.partyPhone, parties.client.phone],
    ], "cr-party"));
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
    term.terms.forEach(function (block) {
      if (block.kind === "item") {
        if (!list) {
          list = el("ul", "cr-terms__list");
          terms.appendChild(list);
        }
        list.appendChild(text("li", "", block.text));
        return;
      }
      list = null;
      terms.appendChild(text(block.kind === "heading" ? "h3" : "p", block.kind === "heading" ? "cr-terms__heading" : "cr-terms__paragraph", block.text));
    });
    shell.appendChild(terms);

    if (reviewing) shell.appendChild(approveSection(ctx));
  }

  function ready(shell, ctx) {
    var view = ctx.snapshot.view;
    var copy = ctx.copy;
    switch (view.kind) {
      case "quote-review":
        quoteReview(shell, ctx);
        return;
      case "contract-details":
        contractDetails(shell, ctx);
        return;
      case "agreement-review":
      case "reference":
      case "completion":
        agreementPage(shell, ctx);
        return;
      case "preparing":
        shell.appendChild(stateCard("progress", "…", copy.preparingTitle, copy.preparingBody, null));
        return;
      case "closed":
        shell.appendChild(view.reason === "archived"
          ? stateCard("neutral", "⊘", copy.archivedTitle, copy.archivedBody, null)
          : stateCard("neutral", "⊘", copy.canceledTitle, copy.canceledBody, null));
        return;
      case "empty":
        shell.appendChild(stateCard("neutral", "○", copy.emptyTitle, copy.emptyBody, null));
        return;
      default:
        shell.appendChild(stateCard("warn", "!", copy.unavailableTitle, copy.unavailableBody, null));
    }
  }

  function renderPage(mount, snapshot, dispatch, copy) {
    var ctx = {
      snapshot: snapshot,
      dispatch: dispatch,
      copy: copy,
      focus: {},
      busy: snapshot.refreshing || snapshot.phase !== "ready",
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
        shell.appendChild(snapshot.closedAfter
          ? stateCard("info", "i", copy.closedAfterTitle, snapshot.closedAfter === "details" ? copy.closedAfterDetailsBody : copy.closedAfterApprovalBody, null)
          : stateCard("neutral", "⊘", copy.linkClosedTitle, copy.linkClosedBody, null));
        break;
      case "error":
        shell.appendChild(stateCard("error", "!", copy.errorTitle, snapshot.errorAfterCommand ? copy.readbackErrorBody : copy.errorBody,
          button(copy.retryLabel, "btn--primary btn--lg", function () { dispatch("retry"); }, { "data-action": "retry" })));
        break;
      default:
        if (snapshot.view) ready(shell, ctx);
    }
    mount.replaceChildren();
    mount.appendChild(page);
    return { focus: ctx.focus };
  }

  ns.components = Object.freeze({
    renderPage: renderPage,
    optionLabel: optionLabel,
  });
})(typeof window !== "undefined" ? window : globalThis);
