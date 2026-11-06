export var PHOTOSWIPE = Object.freeze({
  version: "5.4.4",
  script: Object.freeze({
    src: "https://cdnjs.cloudflare.com/ajax/libs/photoswipe/5.4.4/umd/photoswipe.umd.min.js",
    integrity: "sha384-k8EKyYcONphQ7zH4cQ0888JapXwrLTXQl/Ue1/jYgjVYahln1NWpnt2S4IC56LNh",
  }),
  style: Object.freeze({
    href: "https://cdnjs.cloudflare.com/ajax/libs/photoswipe/5.4.4/photoswipe.css",
    integrity: "sha384-s2AldnnzPSlbjXKTGuicXrolvAtPwQBv9ndvaRLccssYIi3A2bjWOv3p+poD8LUk",
  }),
});

export var VISIT_PHOTO_ACTION = "visit.photo.open";

var THUMBNAIL = "[data-action=\"" + VISIT_PHOTO_ACTION + "\"]";
var LOAD_TIMEOUT_MS = 20000;
var UNMEASURED = Object.freeze({ width: 1600, height: 1200 });
var loads = new WeakMap();

export function loadPhotoSwipe(scope) {
  scope = scope || globalThis;
  if (loads.has(scope)) return loads.get(scope);
  var loading = Promise.all([
    attach(scope, "link", { rel: "stylesheet", href: PHOTOSWIPE.style.href, integrity: PHOTOSWIPE.style.integrity, crossorigin: "anonymous", referrerpolicy: "no-referrer" }),
    attach(scope, "script", { src: PHOTOSWIPE.script.src, integrity: PHOTOSWIPE.script.integrity, crossorigin: "anonymous", referrerpolicy: "no-referrer", async: "" }),
  ]).then(function () {
    if (typeof scope.PhotoSwipe !== "function") throw new Error("PhotoSwipe loaded without its constructor");
    return scope.PhotoSwipe;
  });
  loads.set(scope, loading);
  loading.catch(function () { loads.delete(scope); });
  return loading;
}

export function visitPhotoGallery(trigger) {
  var section = trigger.closest("[data-module=\"visit-photos\"]");
  var thumbnails = section ? Array.prototype.slice.call(section.querySelectorAll(THUMBNAIL)) : [trigger];
  return {
    index: Math.max(0, thumbnails.indexOf(trigger)),
    items: thumbnails.map(function (thumbnail) {
      var image = thumbnail.querySelector("img");
      return {
        src: thumbnail.getAttribute("href"),
        caption: thumbnail.getAttribute("data-caption") || "",
        alt: image ? image.getAttribute("alt") || "" : "",
        thumbnail: image,
      };
    }),
  };
}

export function openVisitPhotos(trigger, options) {
  options = options || {};
  var scope = options.scope || globalThis;
  var load = options.load || loadPhotoSwipe;
  var gallery = visitPhotoGallery(trigger);
  var openedFrom = trigger.getAttribute("data-id");
  return Promise.all([load(scope), Promise.all(gallery.items.map(function (item) { return measured(item, scope); }))]).then(function (ready) {
    var PhotoSwipe = ready[0];
    var viewer = new PhotoSwipe({
      dataSource: ready[1],
      index: gallery.index,
      returnFocus: false,
      bgOpacity: 0.92,
      showHideAnimationType: "zoom",
      indexIndicatorSep: " of ",
      closeTitle: "Close photo",
      zoomTitle: "Zoom photo",
      arrowPrevTitle: "Previous photo",
      arrowNextTitle: "Next photo",
      errorMsg: "This photo could not be loaded.",
    });
    viewer.addFilter("thumbEl", function (thumbnail, data, index) {
      var current = thumbnailFor(scope, String(index));
      return (current && current.querySelector("img")) || thumbnail;
    });
    viewer.on("uiRegister", function () {
      viewer.ui.registerElement({
        name: "caption",
        order: 9,
        isButton: false,
        appendTo: "root",
        onInit: function (element) {
          element.setAttribute("aria-live", "polite");
          viewer.on("change", function () { element.textContent = viewer.currSlide ? viewer.currSlide.data.caption : ""; });
        },
      });
    });
    viewer.on("destroy", function () {
      var thumbnail = thumbnailFor(scope, openedFrom) || trigger;
      if (thumbnail && typeof thumbnail.focus === "function") thumbnail.focus({ preventScroll: true });
    });
    viewer.init();
    return viewer;
  });
}

function thumbnailFor(scope, id) {
  var root = scope.document;
  if (!root || id == null) return null;
  return root.querySelector(THUMBNAIL + "[data-id=\"" + id + "\"]");
}

function measured(item, scope) {
  var image = item.thumbnail;
  if (image && image.complete && image.naturalWidth > 0) return Promise.resolve(slide(item, image.naturalWidth, image.naturalHeight));
  if (typeof scope.Image !== "function") return Promise.resolve(slide(item, UNMEASURED.width, UNMEASURED.height));
  return new Promise(function (resolve) {
    var probe = new scope.Image();
    probe.onload = function () { resolve(slide(item, probe.naturalWidth || UNMEASURED.width, probe.naturalHeight || UNMEASURED.height)); };
    probe.onerror = function () { resolve(slide(item, UNMEASURED.width, UNMEASURED.height)); };
    probe.src = item.src;
  });
}

function slide(item, width, height) {
  return { src: item.src, msrc: item.src, width: width, height: height, alt: item.alt, caption: item.caption, thumbCropped: true };
}

function attach(scope, tag, attributes) {
  var root = scope.document;
  if (!root) return Promise.reject(new Error("PhotoSwipe needs a document"));
  return new Promise(function (resolve, reject) {
    var node = root.createElement(tag);
    Object.keys(attributes).forEach(function (name) { node.setAttribute(name, attributes[name]); });
    var timer = setTimeout(function () { fail("did not load in time"); }, LOAD_TIMEOUT_MS);
    function fail(reason) {
      clearTimeout(timer);
      if (node.parentNode) node.parentNode.removeChild(node);
      reject(new Error("PhotoSwipe " + tag + " " + reason));
    }
    node.addEventListener("load", function () { clearTimeout(timer); resolve(); });
    node.addEventListener("error", function () { fail("could not be loaded"); });
    (root.head || root.body).appendChild(node);
  });
}
