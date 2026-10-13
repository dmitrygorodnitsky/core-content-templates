(function (global) {
  "use strict";

  var ns = global.ClientReview || (global.ClientReview = {});
  var KINDS = ["quote-review", "contract-details", "agreement-review", "reference", "completion"];
  var STATUSES = { new: "optionNew", viewed: "optionViewed", approved: "optionApproved", declined: "optionDeclined", changes: "optionChanges", revising: "optionRevising", unknown: "optionUnknown" };

  function offered(snapshot) {
    return snapshot.phase === "ready" && snapshot.view && KINDS.indexOf(snapshot.view.kind) !== -1;
  }

  function available(snapshot) {
    return Boolean(offered(snapshot) && !snapshot.refreshing && !snapshot.view.unreadableOrders && !snapshot.view.accountUnavailable);
  }

  function isAgreement(view) {
    return ["agreement-review", "reference", "completion"].indexOf(view.kind) !== -1;
  }

  function statusOf(view, copy) {
    if (view.kind === "agreement-review") return copy.agreementAwaiting;
    if (view.kind === "completion") return view.completion === "active" ? copy.agreementActive : copy.agreementApproved;
    if (view.kind === "reference") return view.banner === "changes" ? copy.agreementChangesBadge : view.banner === "expired" ? copy.agreementExpired : copy.agreementSuspended;
    return "";
  }

  function joined(name, title) { return name ? name + (title ? ", " + title : "") : ""; }

  function build(snapshot, copy, options) {
    if (!available(snapshot)) throw new Error("The document is unavailable or incomplete");
    var settings = options || {};
    var engine = settings.engine || global.jspdf;
    var font = settings.font || global.ClientReviewPdfFont;
    if (!engine || typeof engine.jsPDF !== "function" || !font) throw new Error("PDF assets are unavailable");
    var doc = new engine.jsPDF({ unit: "pt", format: "a4", compress: true, putOnlyUsedFonts: true });
    doc.addFileToVFS("Roboto-Regular.ttf", font);
    doc.addFont("Roboto-Regular.ttf", "Review", "normal");
    doc.setFont("Review", "normal");
    var view = snapshot.view;
    var agreement = isAgreement(view);
    var title = agreement ? copy.agreementEyebrow : copy.quoteEyebrow;
    var identity = title + " #" + view.agreement.id;
    doc.setProperties({ title: identity, author: view.names.provider || "", creator: "ServiceWand", subject: title });
    var width = doc.internal.pageSize.getWidth();
    var height = doc.internal.pageSize.getHeight();
    var margin = 44;
    var contentWidth = width - margin * 2;
    var bottom = height - 58;
    var y = margin + 24;
    var ink = [31, 43, 61];
    var muted = [89, 105, 125];
    var accent = [30, 92, 139];

    function safeText(value) {
      var valueText = String(value == null ? "" : value).replace(/\u00a0/g, " ").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "");
      var metadata = doc.getFont().metadata;
      if (metadata && typeof metadata.characterToGlyph === "function") {
        Array.from(valueText).forEach(function (character) {
          if (!/\s/.test(character) && !metadata.characterToGlyph(character.codePointAt(0))) throw new Error("The PDF font does not support this text");
        });
      }
      return valueText;
    }

    function newPage() {
      doc.addPage();
      y = margin;
      doc.setFontSize(9);
      doc.setTextColor.apply(doc, muted);
      var heading = doc.splitTextToSize(safeText(identity), contentWidth);
      doc.text(heading, margin, y);
      y += heading.length * 12 + 16;
    }

    function ensure(size) { if (y + size > bottom) newPage(); }

    function paragraph(value, size, color, gap, inset) {
      var fontSize = size || 10;
      var left = inset || 0;
      doc.setFontSize(fontSize);
      var lines = doc.splitTextToSize(safeText(value), contentWidth - left);
      lines.forEach(function (line) {
        ensure(fontSize * 1.45);
        doc.setFontSize(fontSize);
        doc.setTextColor.apply(doc, color || ink);
        doc.text(line, margin + left, y);
        y += fontSize * 1.45;
      });
      y += gap === undefined ? 6 : gap;
    }

    function section(label) {
      ensure(58);
      y += 12;
      doc.setDrawColor(220, 228, 236);
      doc.line(margin, y - 8, width - margin, y - 8);
      paragraph(label, 13, accent, 9);
    }

    function fact(label, value) { paragraph(label + ": " + (value || copy.valueNotStated), 10); }

    function tableHeader(recurrent) {
      ensure(35);
      doc.setFillColor(240, 245, 249);
      doc.rect(margin, y - 11, contentWidth, 24, "F");
      doc.setFontSize(9);
      doc.setTextColor.apply(doc, muted);
      doc.text(safeText(copy.lineService), margin + 8, y + 3);
      doc.text(safeText(copy.lineQuantity), margin + contentWidth * 0.61, y + 3);
      if (!recurrent) doc.text(safeText(copy.lineUnitPrice), margin + contentWidth * 0.81, y + 3);
      y += 31;
    }

    function lines(option) {
      if (!option.lines.length) { paragraph(copy.linesEmpty, 10, muted); return; }
      var columns = option.recurrent ? [contentWidth * 0.61 - 18, contentWidth * 0.39 - 16] : [contentWidth * 0.61 - 18, contentWidth * 0.2 - 16, contentWidth * 0.19 - 16];
      var offsets = [8, contentWidth * 0.61, contentWidth * 0.81];
      tableHeader(option.recurrent);
      option.lines.forEach(function (line) {
        var cells = [line.product || copy.serviceUnnamed, line.quantity || copy.valueNotStated];
        if (!option.recurrent) cells.push(line.recurrent ? copy.lineIncluded : line.unitPrice || copy.valueNotStated);
        doc.setFontSize(10);
        var wrapped = cells.map(function (value, i) { return doc.splitTextToSize(safeText(value), columns[i]); });
        var count = Math.max.apply(Math, wrapped.map(function (cell) { return cell.length; }));
        for (var i = 0; i < count; i += 1) {
          if (y + 15 > bottom) { newPage(); tableHeader(option.recurrent); }
          doc.setFontSize(10);
          doc.setTextColor.apply(doc, ink);
          wrapped.forEach(function (cell, column) { if (cell[i]) doc.text(cell[i], margin + offsets[column], y); });
          y += 15;
        }
        doc.setDrawColor(230, 236, 242);
        doc.line(margin, y, width - margin, y);
        y += 13;
      });
    }

    doc.setFillColor.apply(doc, accent);
    doc.rect(margin, margin - 17, contentWidth, 3, "F");
    if (settings.logo) {
      try {
        var props = doc.getImageProperties(settings.logo);
        var scale = Math.min(100 / props.width, 40 / props.height);
        doc.addImage(settings.logo, "PNG", width - margin - props.width * scale, y, props.width * scale, props.height * scale);
        y += 52;
      } catch (_) {}
    }
    paragraph(identity, 24, ink, 9);
    var status = statusOf(view, copy);
    if (status) paragraph(status, 11, accent, 10);
    if (view.names.provider) fact(copy.fromLabel, view.names.provider);
    if (view.names.client) fact(copy.forLabel, view.names.client);
    paragraph(ns.fill(copy.pdfSnapshot, { date: new Intl.DateTimeFormat(settings.locale || "en", { dateStyle: "medium", timeStyle: "short" }).format(settings.now || new Date()) }), 9, muted, 10);

    if (agreement) {
      section(copy.partyProvider);
      fact(copy.partyLegalName, view.parties.provider.legalName);
      fact(copy.partyRepresentative, joined(view.parties.provider.representativeName, view.parties.provider.representativeJobTitle));
      section(copy.partyClient);
      var client = view.parties.client;
      [[copy.partyLegalName, client.legalName], [copy.partyClientType, client.clientType], [copy.partyBillingAddress, client.billingAddress], [copy.partyRepresentative, joined(client.representativeName, client.representativeJobTitle)], [copy.partyEmail, client.email], [copy.partyPhone, client.phone]].forEach(function (row) { fact(row[0], row[1]); });
      var term = view.agreement;
      var dates = [[copy.termEffective, term.effectiveDate], [copy.termStart, term.termStart], [copy.termEnd, term.termEnd]].filter(function (row) { return row[1]; });
      if (dates.length) { section(copy.termTitle); dates.forEach(function (row) { fact(row[0], row[1]); }); }
    }

    section(copy.servicesTitle);
    view.properties.forEach(function (property) {
      var options = view.kind === "contract-details" ? property.options.filter(function (option) { return option.status === "approved"; }) : property.options;
      if (!options.length) return;
      ensure(70);
      paragraph(property.address || copy.addressUnavailable, 12, ink, 10);
      options.forEach(function (option) {
        ensure(65);
        var label = ns.optionLabel(option, copy);
        paragraph(label + " - " + (copy[STATUSES[option.status]] || copy.optionUnknown), 11, accent, 10);
        if (!option.priced) { paragraph(option.status === "revising" ? copy.noteRevising : copy.noteNoActions, 10, muted); return; }
        lines(option);
        if (!option.recurrent) {
          if (option.subtotal) fact(copy.orderSubtotal, option.subtotal);
          if (option.taxes) fact(copy.orderTaxes, option.taxes);
        }
        paragraph(copy.orderTotal + ": " + (option.total || copy.valueNotStated), 12, ink, 16);
      });
    });
    if (!view.properties.length) paragraph(copy.linesEmpty, 10, muted);

    if (agreement) {
      section(copy.termsTitle);
      if (!view.agreement.terms.length) paragraph(copy.termsEmpty, 10, muted);
      view.agreement.terms.forEach(function (block) {
        var prefix = block.kind === "clause" ? block.number + " " : block.kind === "item" ? "- " : "";
        var inset = block.kind === "clause" ? Math.min(block.depth || 0, 3) * 10 : 0;
        if (block.kind === "heading") ensure(45);
        paragraph(prefix + block.text, block.kind === "heading" ? 12 : 10, ink, 8, inset);
      });
    }
    var contact = snapshot.contact || view.contact;
    if (contact && (contact.phone || contact.email)) {
      section(copy.contactTitle);
      if (contact.phone) fact(copy.contactPhone, contact.phone);
      if (contact.email) fact(copy.contactEmail, contact.email);
    }
    var pageCount = doc.getNumberOfPages();
    for (var page = 1; page <= pageCount; page += 1) {
      doc.setPage(page);
      doc.setFontSize(9);
      doc.setTextColor.apply(doc, muted);
      doc.text(ns.fill(copy.pdfPage, { page: page, pages: pageCount }), width - margin, height - 28, { align: "right" });
    }
    return { document: doc, bytes: doc.output("arraybuffer"), filename: (agreement ? "service-agreement-" : "quotation-") + view.agreement.id + ".pdf" };
  }

  function logoOf(url) {
    if (!url || typeof global.Image !== "function" || !global.document) return Promise.resolve(null);
    return new Promise(function (resolve) {
      var image = new global.Image();
      image.referrerPolicy = "no-referrer";
      var timer = global.setTimeout(function () { finish(null); }, 3000);
      function finish(value) { global.clearTimeout(timer); image.onload = image.onerror = null; resolve(value); }
      image.onerror = function () { finish(null); };
      image.onload = function () {
        try {
          var canvas = global.document.createElement("canvas");
          var scale = Math.min(1, 600 / image.naturalWidth, 240 / image.naturalHeight);
          canvas.width = Math.max(1, image.naturalWidth * scale);
          canvas.height = Math.max(1, image.naturalHeight * scale);
          canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
          finish(canvas.toDataURL("image/png"));
        } catch (_) { finish(null); }
      };
      image.src = url;
    });
  }

  function create(snapshot, copy, locale) {
    return logoOf(snapshot.logoUrl).then(function (logo) { return build(snapshot, copy, { logo: logo, locale: locale }); });
  }

  function save(result) {
    result.document.save(result.filename);
  }

  ns.pdf = Object.freeze({ offered: offered, available: available, build: build, create: create, save: save });
})(typeof window !== "undefined" ? window : globalThis);
