import { h } from "../../dom.js";
import { ATTACHMENT_ACCEPT, ATTACHMENT_LIMITS, formatBytes } from "../../support-attachments.js";

export function AttachmentPicker(props) {
  var id = props.id;
  var files = props.files || [];
  var disabled = !!props.disabled;
  var input = h("input", { "class": "attachment-picker__input", type: "file", id: id, name: props.field || undefined, multiple: true, accept: ATTACHMENT_ACCEPT, disabled: disabled || files.length >= ATTACHMENT_LIMITS.count ? true : undefined, "aria-describedby": id + "-hint" + (props.error ? " " + id + "-error" : "") });
  input.addEventListener("change", function () {
    var picked = Array.prototype.slice.call(input.files || []);
    input.value = "";
    if (picked.length && props.onAdd) props.onAdd(picked);
  });
  return h("div", { "class": "field-row support-form__field attachment-picker", "data-module": props.module || "attachment-picker", "data-state": props.error ? "invalid" : props.reading ? "reading" : undefined }, [
    h("span", { "class": "field-label" }, props.label || "Attachments (optional)"),
    files.length ? h("ul", { "class": "attachment-picker__list", "aria-label": "Attached files" }, files.map(function (file) {
      return h("li", { "class": "attachment-chip", "data-module": "attachment-chip" }, [
        h("span", { "class": "attachment-chip__icon", "aria-hidden": "true" }, file.type === "application/pdf" ? "PDF" : "IMG"),
        h("span", { "class": "attachment-chip__name" }, file.name),
        h("span", { "class": "attachment-chip__size" }, formatBytes(file.size)),
        h("button", { "class": "attachment-chip__remove", type: "button", "data-action": props.removeAction, "data-id": props.scope + ":" + file.key, "aria-label": "Remove " + file.name, disabled: disabled ? true : undefined }, "✕"),
      ]);
    })) : null,
    h("label", { "class": "btn btn--ghost attachment-picker__add", "for": id, "aria-disabled": disabled || files.length >= ATTACHMENT_LIMITS.count ? "true" : undefined }, [props.reading ? "Reading files…" : "Attach files", input]),
    h("div", { "class": "field-hint", id: id + "-hint" }, "Up to 5 images (JPEG, PNG, GIF, WebP) or PDFs, 5 MB each and 10 MB in total."),
    props.error ? h("div", { "class": "field-error", id: id + "-error", role: "alert" }, props.error) : null,
  ]);
}
