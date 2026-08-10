(function () {
  "use strict";

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function serverRenderedTitle(root) {
    var heading = root.querySelector("[data-blog-document] h1");
    return heading ? String(heading.textContent || "").trim() : "";
  }

  function setMeta(name, value) {
    if (!value) return;
    var selector = name === "description" ? 'meta[name="description"]' : 'meta[property="' + name + '"]';
    var node = document.head.querySelector(selector);
    if (!node) {
      node = document.createElement("meta");
      if (name === "description") node.name = name;
      else node.setAttribute("property", name);
      document.head.appendChild(node);
    }
    node.content = value;
  }

  function setCanonical(url) {
    var canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = url;
  }

  function applySeo(root, post) {
    document.title = post.title;
    setMeta("description", post.summary);
    setMeta("og:title", post.title);
    setMeta("og:description", post.summary);
    if (post.imageUrl) setMeta("og:image", post.imageUrl);
    setCanonical(window.location.href.split("?")[0].split("#")[0]);
    var schema = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.summary || undefined,
      datePublished: post.publishedAt || undefined,
      author: post.author ? { "@type": "Organization", name: post.author } : undefined,
      image: post.imageUrl || undefined,
      mainEntityOfPage: window.location.href.split("#")[0]
    };
    Object.keys(schema).forEach(function (key) { if (schema[key] === undefined) delete schema[key]; });
    var node = root.querySelector("[data-blog-article-schema]");
    if (node) node.textContent = JSON.stringify(schema);
  }

  function renderCurrent(root, post, config) {
    var title = root.querySelector("[data-blog-current-title]");
    if (title) title.textContent = post.title;
    var meta = root.querySelector("[data-blog-current-meta]");
    var date = window.LabBlog.formatDate(post.publishedAt, config.locale);
    [post.category, date, post.readTime, post.author].filter(Boolean).forEach(function (value) {
      meta.appendChild(element("span", "blog-post-page__meta-item", value));
    });
    meta.hidden = meta.children.length === 0;
    var hero = root.querySelector("[data-blog-current-image]");
    if (post.imageUrl) {
      var image = document.createElement("img");
      image.src = post.imageUrl;
      image.alt = post.imageAlt || post.title;
      image.decoding = "async";
      hero.appendChild(image);
      hero.hidden = false;
    }
    applySeo(root, post);
  }

  function renderRelated(root, posts, current, config) {
    var limit = Math.max(1, Number(root.getAttribute("data-blog-related-limit") || 3));
    var readLabel = root.getAttribute("data-blog-read-label") || "Read article";
    var list = posts.filter(function (post) { return post.permalink !== current; }).slice(0, limit);
    if (!list.length) return;
    var grid = root.querySelector("[data-blog-related]");
    list.forEach(function (post) {
      var article = element("article", "blog-related-card");
      var link = element("a", "blog-related-card__link");
      link.href = window.LabBlog.buildPostUrl(post, config);
      if (post.category) link.appendChild(element("span", "blog-related-card__category", post.category));
      link.appendChild(element("h3", "blog-related-card__title", post.title));
      if (post.summary) link.appendChild(element("p", "blog-related-card__summary", post.summary));
      link.appendChild(element("span", "blog-related-card__read", readLabel));
      article.appendChild(link);
      grid.appendChild(article);
    });
    root.querySelector("[data-blog-related-section]").hidden = false;
  }

  function init(root) {
    if (!window.LabBlog) return;
    var config = window.LabBlog.configFrom(root);
    var indexLink = root.querySelector("[data-blog-index-link]");
    if (indexLink) indexLink.href = window.LabBlog.buildIndexUrl(config);
    var title = root.querySelector("[data-blog-current-title]");
    var fallbackTitle = serverRenderedTitle(root);
    if (title && fallbackTitle) title.textContent = fallbackTitle;
    var current = root.getAttribute("data-blog-current-permalink") || window.LabBlog.currentPermalink(config);
    window.LabBlog.loadPosts(config).then(function (posts) {
      var post = posts.find(function (candidate) { return candidate.permalink === current; });
      if (post) renderCurrent(root, post, config);
      renderRelated(root, posts, current, config);
    }).catch(function (error) {
      console.error(error);
    });
  }

  function ready() {
    document.querySelectorAll("[data-blog-post]").forEach(init);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ready);
  else ready();
})();
