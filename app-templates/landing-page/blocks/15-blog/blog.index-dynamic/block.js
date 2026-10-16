(function () {
  "use strict";

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function metaFor(post, config) {
    var meta = element("span", "blog-card__meta");
    if (post.category) meta.appendChild(element("span", "blog-card__category", post.category));
    var date = window.LabBlog.formatDate(post.publishedAt, config.locale);
    if (date || post.readTime) {
      var line = element("span", "blog-card__meta-line");
      if (date) {
        var time = element("time", "blog-card__date", date);
        if (post.publishedAt) time.dateTime = post.publishedAt;
        line.appendChild(time);
      }
      if (post.readTime) line.appendChild(element("span", "blog-card__read-time", post.readTime));
      meta.appendChild(line);
    }
    return meta;
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
    body.appendChild(metaFor(post, config));
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
    body.appendChild(metaFor(post, config));
    body.appendChild(element("h2", "blog-featured__title", post.title));
    if (post.summary) body.appendChild(element("p", "blog-featured__summary", post.summary));
    if (post.author) body.appendChild(element("span", "blog-featured__author", post.author));
    body.appendChild(element("span", "blog-card__read", readLabel));
    link.appendChild(body);
    return link;
  }

  function categoryNames(post) {
    if (!post.categories || !post.categories.length) return post.category ? [post.category] : [];
    return post.categories.map(function (entry) { return entry.name; });
  }

  function categoriesOf(posts) {
    var categories = [];
    posts.forEach(function (post) {
      categoryNames(post).forEach(function (name) {
        if (name && categories.indexOf(name) < 0) categories.push(name);
      });
    });
    return categories.sort();
  }

  function renderChips(root, state, onChange) {
    var host = root.querySelector("[data-blog-filters]");
    if (!host) return;
    var categories = categoriesOf(state.posts);
    if (categories.length < 2) {
      host.hidden = true;
      return;
    }
    var allLabel = root.getAttribute("data-blog-filter-all-label") || "All topics";
    host.textContent = "";
    var allChip = element("button", "blog-index__filter", allLabel);
    allChip.type = "button";
    allChip.setAttribute("aria-pressed", String(!state.selected.length));
    allChip.addEventListener("click", function () {
      if (!state.selected.length) return;
      state.selected = [];
      onChange();
    });
    host.appendChild(allChip);
    categories.forEach(function (category) {
      var chip = element("button", "blog-index__filter", category);
      chip.type = "button";
      chip.setAttribute("aria-pressed", String(state.selected.indexOf(category) >= 0));
      chip.addEventListener("click", function () {
        var at = state.selected.indexOf(category);
        if (at >= 0) state.selected.splice(at, 1);
        else state.selected.push(category);
        onChange();
      });
      host.appendChild(chip);
    });
    host.hidden = false;
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
    var state = { posts: [], selected: [], visible: 0 };

    function isFiltered() {
      return Boolean(state.selected.length);
    }

    function visiblePosts() {
      if (!state.selected.length) return state.posts;
      return state.posts.filter(function (post) {
        return categoryNames(post).some(function (name) {
          return state.selected.indexOf(name) >= 0;
        });
      });
    }

    function reveal(posts) {
      var remaining = isFiltered() ? posts : posts.slice(1);
      var next = remaining.slice(state.visible, state.visible + config.pageSize);
      next.forEach(function (post) { grid.appendChild(cardFor(post, config, readLabel)); });
      state.visible += next.length;
      more.hidden = state.visible >= remaining.length;
    }

    function renderList() {
      var posts = visiblePosts();
      featured.textContent = "";
      grid.textContent = "";
      state.visible = 0;
      featured.hidden = true;
      if (!posts.length) {
        more.hidden = true;
        status.textContent = emptyLabel;
        status.hidden = false;
        return;
      }
      status.hidden = true;
      if (!isFiltered()) {
        featured.appendChild(featuredFor(posts[0], config, readLabel));
        featured.hidden = false;
      }
      reveal(posts);
    }

    function rerender() {
      renderChips(root, state, rerender);
      renderList();
    }

    more.addEventListener("click", function () { reveal(visiblePosts()); });

    window.LabBlog.loadPosts(config).then(function (posts) {
      state.posts = posts;
      rerender();
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
