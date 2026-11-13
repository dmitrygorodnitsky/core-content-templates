import { h } from "../../dom.js";
import { cleanRichHtml, parseRichHtml, richNodes, richText, safeLink } from "../../rich-text.js";

export const EDITOR_TOOLS = Object.freeze([
  Object.freeze({ key: "bold", label: "B", title: "Bold", command: "bold" }),
  Object.freeze({ key: "italic", label: "I", title: "Italic", command: "italic" }),
  Object.freeze({ key: "underline", label: "U", title: "Underline", command: "underline" }),
  Object.freeze({ key: "bullets", label: "•", title: "Bulleted list", command: "insertUnorderedList" }),
  Object.freeze({ key: "numbers", label: "1.", title: "Numbered list", command: "insertOrderedList" }),
  Object.freeze({ key: "quote", label: "❝", title: "Quote", command: "formatBlock", value: "blockquote" }),
  Object.freeze({ key: "link", label: "🔗", title: "Link", command: "createLink" }),
]);

export function RichTextEditor(props) {
  var id = props.id;
  var disabled = !!props.disabled;
  var surface = h("div", {
    "class": "rich-editor__surface rich-text",
    id: id,
    "data-field": props.field || undefined,
    role: "textbox",
    "aria-multiline": "true",
    "aria-labelledby": id + "-label",
    "aria-invalid": props.error ? "true" : undefined,
    "aria-describedby": props.error ? id + "-error" : undefined,
    "aria-disabled": disabled ? "true" : undefined,
    "data-placeholder": props.placeholder || "",
    "data-empty": richText(parseRichHtml(props.html)).trim() ? undefined : "true",
    contenteditable: disabled ? "false" : "true",
    spellcheck: "true",
  }, richNodes(parseRichHtml(props.html)));
  var emit = function () {
    var html = cleanRichHtml(surface.innerHTML);
    if (html) surface.removeAttribute("data-empty");
    else surface.setAttribute("data-empty", "true");
    if (props.onChange) props.onChange(html);
  };
  surface.addEventListener("focus", function () { run("defaultParagraphSeparator", "p"); });
  surface.addEventListener("input", emit);
  surface.addEventListener("paste", function (event) {
    var data = event.clipboardData;
    if (!data) return;
    event.preventDefault();
    var html = data.getData("text/html");
    var cleaned = html ? cleanRichHtml(html) : "";
    if (cleaned) run("insertHTML", cleaned);
    else run("insertText", data.getData("text/plain"));
    emit();
  });
  var toolbar = h("div", { "class": "rich-editor__toolbar", role: "toolbar", "aria-label": "Formatting", "aria-controls": id }, EDITOR_TOOLS.map(function (tool) {
    var button = h("button", { "class": "rich-editor__tool", type: "button", title: tool.title, "aria-label": tool.title, "data-tool": tool.key, disabled: disabled ? true : undefined }, tool.label);
    button.addEventListener("mousedown", function (event) { event.preventDefault(); });
    button.addEventListener("click", function () {
      surface.focus();
      if (tool.command === "createLink") {
        var href = safeLink(globalThis.prompt ? globalThis.prompt("Link address (https://, http:// or mailto:)", "https://") : "");
        if (!href) return;
        run("createLink", href);
      } else {
        run(tool.command, tool.value || null);
      }
      emit();
    });
    return button;
  }));
  return h("div", { "class": "field-row support-form__field rich-editor", "data-module": props.module || "rich-editor", "data-state": props.error ? "invalid" : disabled ? "disabled" : undefined }, [
    h("span", { "class": "field-label", id: id + "-label" }, props.label),
    h("div", { "class": "rich-editor__frame field" + (props.error ? " field--invalid" : "") }, [toolbar, surface]),
    props.hint ? h("div", { "class": "field-hint" }, props.hint) : null,
    props.error ? h("div", { "class": "field-error", id: id + "-error", role: "alert" }, props.error) : null,
  ]);
}

function run(command, value) {
  var doc = globalThis.document;
  if (doc && typeof doc.execCommand === "function") doc.execCommand(command, false, value);
}
