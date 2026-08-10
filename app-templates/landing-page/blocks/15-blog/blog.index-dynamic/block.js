(function () {
  "use strict";

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function appendMeta(target, post, config) {
    var meta = element("div", "blog-card__meta");
    if (post.category) meta.appendChild(element("span", "blog-card__category", post.category));
    var date = window.LabBlog.formatDate(post.publishedAt, config.locale);
    if (date) {
      var time = element("time", "blog-card__date", date);
      if (post.publishedAt) time.dateTime = post.publishedAt;
      meta.appendChild(time);
    }
    if (post.readTime) meta.appendChild(element("span", "blog-card__read-time", post.readTime));
    target.appendChild(meta);
  }

  function imageFor(post, modifier) {
    var media = element("span", "blog-card__media " + modifier);
    if (post.imageUrl) {
      var image = document.createElement("img");
      image.src = post.imageUrl;
      image.alt = post.imageAlt || post.title;
      image.loading = "lazy";
      image.decoding = "async";
      media.appendChild(image);
    } else {
      media.setAttribute("aria-hidden", "true");
    }
    return media;
  }

  function cardFor(post, config, readLabel) {
    var card = element("article", "blog-card");
    var link = element("a", "blog-card__link");
    link.href = window.LabBlog.buildPostUrl(post, config);
    link.appendChild(imageFor(post, "blog-card__media--card"));
    var body = element("span", "blog-card__body");
    appendMeta(body, post, config);
    body.appendChild(element("h2", "blog-card__title", post.title));
    if (post.summary) body.appendChild(element("p", "blog-card__summary", post.summary));
    body.appendChild(element("span", "blog-card__read", readLabel));
    link.appendChild(body);
    card.appendChild(link);
    return card;
  }

  function featuredFor(post, config, readLabel) {
    var link = element("a", "blog-featured__link");
    link.href = window.LabBlog.buildPostUrl(post, config);
    link.appendChild(imageFor(post, "blog-card__media--featured"));
    var body = element("span", "blog-featured__body");
    appendMeta(body, post, config);
    body.appendChild(element("h2", "blog-featured__title", post.title));
    if (post.summary) body.appendChild(element("p", "blog-featured__summary", post.summary));
    if (post.author) body.appendChild(element("span", "blog-featured__author", post.author));
    body.appendChild(element("span", "blog-card__read", readLabel));
    link.appendChild(body);
    return link;
  }

  function init(root) {
    if (!window.LabBlog) return;
    var config = window.LabBlog.configFrom(root);
    var status = root.querySelector("[data-blog-status]");
    var featured = root.querySelector("[data-blog-featured]");
    var grid = root.querySelector("[data-blog-grid]");
    var more = root.querySelector("[data-blog-more]");
    var readLabel = root.getAttribute("data-blog-read-label") || "Read article";
    var emptyLabel = root.getAttribute("data-blog-empty-label") || "No articles are available yet.";
    var errorLabel = root.getAttribute("data-blog-error-label") || "Articles could not be loaded.";

    window.LabBlog.loadPosts(config).then(function (posts) {
      status.hidden = true;
      if (!posts.length) {
        status.hidden = false;
        status.textContent = emptyLabel;
        return;
      }
      featured.appendChild(featuredFor(posts[0], config, readLabel));
      featured.hidden = false;
      var remaining = posts.slice(1);
      var visible = 0;
      function reveal() {
        var next = remaining.slice(visible, visible + config.pageSize);
        next.forEach(function (post) { grid.appendChild(cardFor(post, config, readLabel)); });
        visible += next.length;
        more.hidden = visible >= remaining.length;
      }
      more.addEventListener("click", reveal);
      reveal();
    }).catch(function (error) {
      status.textContent = errorLabel;
      status.hidden = false;
      console.error(error);
    });
  }

  function ready() {
    document.querySelectorAll("[data-blog-index]").forEach(function (root) {
      init(root);
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready);
  else ready();
})();
