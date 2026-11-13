import { h } from "./dom.js";

export const RICH_TEXT_TAGS = Object.freeze(["p", "br", "strong", "b", "em", "i", "u", "s", "strike", "ul", "ol", "li", "blockquote", "code", "pre", "h1", "h2", "h3", "a"]);
export const RICH_TEXT_LINK_SCHEMES = Object.freeze(["http:", "https:", "mailto:"]);
export const RICH_TEXT_LIMIT = 4000;
export const RICH_HTML_LIMIT = 20000;

const DROPPED = Object.freeze(["script", "style", "template", "iframe", "object", "embed", "svg", "math", "noscript", "title", "head", "img", "video", "audio", "canvas", "input", "button", "select", "textarea", "form"]);
const AS_PARAGRAPH = Object.freeze(["div", "section", "article", "header", "footer", "h4", "h5", "h6"]);
const BLOCKS = Object.freeze(["p", "ul", "ol", "li", "blockquote", "pre", "h1", "h2", "h3"]);
const VOID = Object.freeze(["br"]);

export function safeLink(value) {
  var href = String(value == null ? "" : value).trim();
  if (!href) return "";
  try {
    var url = new URL(href);
    return RICH_TEXT_LINK_SCHEMES.indexOf(url.protocol) !== -1 ? url.href : "";
  } catch (_) {
    return "";
  }
}

export function richTree(source) {
  return asBlocks(cleanChildren(source && source.childNodes ? source.childNodes : []));
}

function asBlocks(nodes) {
  var blocks = [];
  var run = [];
  var flush = function () {
    if (run.some(hasContent)) blocks.push({ tag: "p", children: trimRun(run) });
    run = [];
  };
  nodes.forEach(function (node) {
    if (typeof node !== "string" && BLOCKS.indexOf(node.tag) !== -1) {
      flush();
      if (node.tag !== "p" || hasContent(node)) blocks.push(node);
    } else {
      run.push(node);
    }
  });
  flush();
  return blocks;
}

function hasContent(node) {
  if (typeof node === "string") return !!node.replace(/\u00a0/g, " ").trim();
  return node.tag === "br" ? false : node.children.some(hasContent);
}

function trimRun(run) {
  var start = 0;
  var end = run.length;
  while (start < end && isBreak(run[start])) start += 1;
  while (end > start && isBreak(run[end - 1])) end -= 1;
  return run.slice(start, end);
}

function isBreak(node) {
  return typeof node === "string" ? !node.trim() : node.tag === "br";
}

export function parseRichHtml(html, parse) {
  var value = String(html == null ? "" : html);
  if (!value.trim()) return [];
  var reader = parse || browserParse;
  return richTree(reader(value));
}

export function cleanRichHtml(html, parse) {
  return richHtml(parseRichHtml(html, parse));
}

export function richHtml(tree) {
  var html = tree.map(serialize).join("");
  return richText(tree).trim() ? html : "";
}

export function richText(tree) {
  return tree.map(function (node) {
    if (typeof node === "string") return node;
    if (node.tag === "br") return "\n";
    var inner = richText(node.children);
    return BLOCKS.indexOf(node.tag) !== -1 ? inner + "\n" : inner;
  }).join("");
}

export function richNodes(tree) {
  return tree.map(function (node) {
    if (typeof node === "string") return globalThis.document.createTextNode(node);
    if (node.tag === "a") return h("a", { href: node.href, rel: "noopener noreferrer nofollow", target: "_blank" }, richNodes(node.children));
    return h(node.tag, null, richNodes(node.children));
  });
}

export function RichText(html, attributes, parse) {
  return h("div", Object.assign({ "class": "rich-text" }, attributes || {}), richNodes(parseRichHtml(html, parse)));
}

function browserParse(html) {
  var Parser = globalThis.DOMParser;
  if (typeof Parser !== "function") return { childNodes: [globalThis.document.createTextNode(html.replace(/<[^>]*>/g, " "))] };
  return new Parser().parseFromString("<!doctype html><body>" + html, "text/html").body;
}

function cleanChildren(nodes) {
  var out = [];
  Array.prototype.forEach.call(nodes, function (node) {
    cleanNode(node).forEach(function (cleaned) {
      var last = out[out.length - 1];
      if (typeof cleaned === "string" && typeof last === "string") out[out.length - 1] = last + cleaned;
      else out.push(cleaned);
    });
  });
  return out;
}

function cleanNode(node) {
  if (!node || node.nodeType === 8) return [];
  if (typeof node.tagName !== "string") {
    var value = node.nodeType === 3 || node.nodeType === undefined ? String(node.textContent == null ? node.nodeValue || "" : node.textContent) : "";
    return value ? [value] : [];
  }
  var tag = node.tagName.toLowerCase();
  if (DROPPED.indexOf(tag) !== -1) return [];
  var children = cleanChildren(node.childNodes || []);
  if (tag === "a") {
    var href = safeLink(node.getAttribute && node.getAttribute("href"));
    return href ? [{ tag: "a", href: href, children: children }] : children;
  }
  if (AS_PARAGRAPH.indexOf(tag) !== -1) return [{ tag: "p", children: children }];
  if (tag === "ol" && children.some(function (child) { return child.tag === "li" && child.bullet; })) return [{ tag: "ul", children: children }];
  if (tag === "li") return [{ tag: "li", bullet: !!(node.getAttribute && node.getAttribute("data-list") === "bullet"), children: children }];
  if (RICH_TEXT_TAGS.indexOf(tag) === -1) return children;
  if (VOID.indexOf(tag) !== -1) return [{ tag: tag, children: [] }];
  return [{ tag: tag, children: children }];
}

function serialize(node) {
  if (typeof node === "string") return escapeText(node);
  if (node.tag === "br") return "<br>";
  var inner = node.children.map(serialize).join("");
  if (node.tag === "a") return "<a href=\"" + escapeAttribute(node.href) + "\">" + inner + "</a>";
  return "<" + node.tag + ">" + inner + "</" + node.tag + ">";
}

function escapeText(value) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttribute(value) {
  return escapeText(value).replace(/"/g, "&quot;");
}
