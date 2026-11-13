export const ATTACHMENT_LIMITS = Object.freeze({ count: 5, fileBytes: 5 * 1024 * 1024, totalBytes: 10 * 1024 * 1024 });
export const ATTACHMENT_TYPES = Object.freeze(["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"]);
export const ATTACHMENT_ACCEPT = ATTACHMENT_TYPES.join(",");

export const ATTACHMENT_COPY = Object.freeze({
  count: "Attach at most " + ATTACHMENT_LIMITS.count + " files.",
  fileSize: "Each file must be 5 MB or smaller.",
  totalSize: "Files together must be 10 MB or smaller.",
  type: "Attach JPEG, PNG, GIF or WebP images, or PDF files.",
  unreadable: "This file couldn’t be read. Try another one.",
});

const SIGNATURES = Object.freeze([
  { type: "image/jpeg", bytes: [0xff, 0xd8, 0xff] },
  { type: "image/png", bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { type: "image/gif", bytes: [0x47, 0x49, 0x46, 0x38] },
  { type: "application/pdf", bytes: [0x25, 0x50, 0x44, 0x46, 0x2d] },
]);

export function sniffType(bytes) {
  var head = bytes || [];
  var known = SIGNATURES.find(function (signature) {
    return signature.bytes.every(function (value, index) { return head[index] === value; });
  });
  if (known) return known.type;
  var riff = [0x52, 0x49, 0x46, 0x46].every(function (value, index) { return head[index] === value; });
  var webp = [0x57, 0x45, 0x42, 0x50].every(function (value, index) { return head[index + 8] === value; });
  return riff && webp ? "image/webp" : "";
}

export function attachmentProblem(existing, added) {
  var files = (existing || []).concat(added || []);
  if (files.length > ATTACHMENT_LIMITS.count) return ATTACHMENT_COPY.count;
  if ((added || []).some(function (file) { return !file.type; })) return ATTACHMENT_COPY.type;
  if (files.some(function (file) { return file.size > ATTACHMENT_LIMITS.fileBytes; })) return ATTACHMENT_COPY.fileSize;
  var total = files.reduce(function (sum, file) { return sum + file.size; }, 0);
  if (total > ATTACHMENT_LIMITS.totalBytes) return ATTACHMENT_COPY.totalSize;
  return "";
}

export function attachmentsValue(files) {
  var list = (files || []).map(function (file) { return { name: file.name, data: file.data }; });
  return list.length ? JSON.stringify(list) : "";
}

export function readAttachment(file) {
  return new Promise(function (resolve) {
    var Reader = globalThis.FileReader;
    if (typeof Reader !== "function" || !file) {
      resolve(null);
      return;
    }
    var reader = new Reader();
    reader.onload = function () {
      var data = typeof reader.result === "string" ? reader.result : "";
      var bytes = headBytes(data);
      var type = sniffType(bytes);
      resolve({ key: attachmentKey(file), name: String(file.name || "file"), size: Number(file.size) || 0, type: ATTACHMENT_TYPES.indexOf(type) !== -1 ? type : "", data: data });
    };
    reader.onerror = function () { resolve(null); };
    reader.readAsDataURL(file);
  });
}

export function formatBytes(size) {
  if (!Number.isFinite(size) || size < 0) return "";
  if (size < 1024) return size + " B";
  if (size < 1024 * 1024) return Math.round(size / 1024) + " KB";
  return (Math.round(size / 104857.6) / 10) + " MB";
}

function attachmentKey(file) {
  return [file.name, file.size, file.lastModified].join(":") + ":" + Math.random().toString(36).slice(2, 8);
}

function headBytes(dataUrl) {
  var comma = dataUrl.indexOf(",");
  if (comma === -1) return [];
  try {
    var decoded = globalThis.atob(dataUrl.slice(comma + 1, comma + 1 + 24));
    return Array.prototype.map.call(decoded, function (character) { return character.charCodeAt(0); });
  } catch (_) {
    return [];
  }
}
