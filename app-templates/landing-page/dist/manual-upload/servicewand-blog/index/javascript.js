/* generated local JS: blocks/15-blog/_shared/blog-runtime.js */
(function (global) {
  "use strict";

  var KNOWN_LOCALES = [
    "en", "zh", "es", "de", "fr", "ja", "pt", "ru", "it", "nl", "pl", "tr",
    "ar", "ko", "uk", "cs", "el", "da", "sv", "nb", "vi", "fa", "he", "hi",
    "ms", "et", "sl", "kk", "th", "id", "ro", "hu", "fi", "bg", "hr", "sk",
    "lt", "lv"
  ];

  function normalizeLocale(value) {
    return String(value || "").trim().toLowerCase().replace("_", "-").split("-")[0];
  }

  function localeFromPath(pathname) {
    var first = String(pathname || "").split("/").filter(Boolean)[0] || "";
    first = normalizeLocale(first);
    return KNOWN_LOCALES.indexOf(first) >= 0 ? first : "";
  }

  function getLocale() {
    var pathLocale = localeFromPath(global.location && global.location.pathname);
    var shared = global.__swLocale;
    var sharedLocale = shared && typeof shared.getEffectiveLocale === "function"
      ? shared.getEffectiveLocale()
      : "";
    return pathLocale || normalizeLocale(sharedLocale) ||
      normalizeLocale(document.documentElement.lang) || "en";
  }

  function localizedText(value, locale, defaultValue) {
    if (typeof value === "string" || typeof value === "number") {
      var direct = String(value).trim();
      return direct || String(defaultValue || "").trim();
    }
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return String(defaultValue || "").trim();
    }
    var current = normalizeLocale(locale);
    var candidates = [current, String(locale || ""), "default", "en"];
    for (var i = 0; i < candidates.length; i += 1) {
      var candidate = value[candidates[i]];
      if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
    }
    var keys = Object.keys(value);
    for (var j = 0; j < keys.length; j += 1) {
      var fallback = value[keys[j]];
      if (typeof fallback === "string" && fallback.trim()) return fallback.trim();
    }
    return String(defaultValue || "").trim();
  }

  function firstText(source, keys, locale) {
    for (var i = 0; i < keys.length; i += 1) {
      var text = localizedText(source && source[keys[i]], locale, "");
      if (text) return text;
    }
    return "";
  }

  function safePath(value) {
    var path = String(value || "").trim().replace(/^\/+|\/+$/g, "");
    return path && !path.includes(":") && !path.includes("..") ? path : "";
  }

  function heroImageUrlOf(post) {
    var hero = post.heroImage;
    if (!hero) return "";
    if (typeof hero === "string") return hero.trim();
    if (typeof hero === "object" && hero.id) {
      return "/core/image/" + encodeURIComponent(String(hero.id)) + "/get";
    }
    return "";
  }

  function normalizePost(post, locale) {
    post = post && typeof post === "object" ? post : {};
    var metadata = post.metadata && typeof post.metadata === "object" ? post.metadata : {};
    var title = firstText(metadata, ["TITLE", "title", "META_TITLE", "metaTitle"], locale) ||
      firstText(post, ["title", "name"], locale);
    var permalink = safePath(post.permalink || post.slug);
    if (!permalink) return null;

    var summary = localizedText(post.summary, locale, "") ||
      firstText(metadata, ["SUMMARY", "summary", "META_DESCRIPTION", "metaDescription", "DESCRIPTION"], locale);
    var publishedAt = firstText(metadata, ["PUBLISHED_AT", "publishedAt", "PUBLISH_DATE", "publishDate", "DATE"], locale) ||
      String(post.publishedAt || post.publishDate || post.created || "");
    var imageUrl = firstText(metadata, ["HERO_IMAGE_URL", "heroImageUrl", "IMAGE_URL", "imageUrl", "COVER_URL", "coverUrl"], locale) ||
      heroImageUrlOf(post) ||
      firstText(post, ["imageUrl", "coverUrl"], locale);
    var imageAlt = firstText(metadata, ["HERO_IMAGE_ALT", "heroImageAlt", "IMAGE_ALT", "imageAlt"], locale) || title;
    var category = firstText(metadata, ["CATEGORY_NAME", "categoryName", "CATEGORY"], locale);
    if (!category && Array.isArray(post.categories)) {
      for (var i = 0; i < post.categories.length && !category; i += 1) {
        var categoryNls = post.categories[i] && post.categories[i].nls;
        var localizedCategory = categoryNls && (categoryNls[normalizeLocale(locale)] || categoryNls.en);
        category = firstText(localizedCategory, ["NAME", "name"], locale);
      }
    }
    return {
      id: String(post.id || ""),
      permalink: permalink,
      title: title,
      summary: summary,
      category: category,
      author: firstText(metadata, ["AUTHOR_NAME", "authorName", "AUTHOR"], locale),
      authorAvatarUrl: firstText(metadata, ["AUTHOR_AVATAR_URL", "authorAvatarUrl", "AUTHOR_IMAGE_URL", "authorImageUrl", "AUTHOR_PHOTO_URL"], locale),
      publishedAt: publishedAt,
      readTime: firstText(metadata, ["READING_TIME", "readingTime", "READ_TIME", "readTime"], locale),
      imageUrl: imageUrl,
      imageAlt: imageAlt,
      metadata: metadata,
      raw: post
    };
  }

  function parsePositive(value, fallback) {
    var number = Number(value);
    return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
  }

  function optionalFixtureUrl(value) {
    var url = String(value || "").trim();
    return !url || url === "#" ? "" : url;
  }

  function optionalPositiveId(value) {
    var id = String(value || "").trim();
    return Number(id) > 0 ? id : "";
  }

  function localizedApiBase(config) {
    var base = String(config.apiBase || "").replace(/\/+$/, "");
    if (!base.startsWith("/") || base.startsWith("//")) return base;
    var first = base.split("/").filter(Boolean)[0] || "";
    if (KNOWN_LOCALES.indexOf(normalizeLocale(first)) >= 0) return base;
    return "/" + encodeURIComponent(normalizeLocale(config.locale) || "en") + base;
  }

  function configFrom(root) {
    var data = root.dataset || {};
    return {
      apiBase: String(data.blogApiBase || "/core-cms").replace(/\/+$/, ""),
      organization: String(data.blogOrganization || "SERVICEWAND").trim(),
      categoryId: optionalPositiveId(data.blogCategoryId),
      pageSize: parsePositive(data.blogPageSize, 12),
      maxResults: parsePositive(data.blogMaxResults, 1000),
      basePath: "/" + (safePath(data.blogBasePath) || "blog"),
      postPath: "/" + (safePath(data.blogPostPath) || safePath(data.blogBasePath) || "post"),
      fixtureUrl: optionalFixtureUrl(data.blogFixtureUrl),
      locale: getLocale()
    };
  }

  function requestPage(config, offset) {
    if (config.fixtureUrl) {
      return fetch(config.fixtureUrl, { headers: { Accept: "application/json" } }).then(checkResponse);
    }
    var filters = [];
    if (config.categoryId) {
      filters.push({
        property: "categories.id",
        clazz: "java.lang.Integer",
        operator: "=",
        value: config.categoryId
      });
    }
    var url = localizedApiBase(config) + "/public/" + encodeURIComponent(config.organization) +
      "/blog-post/list.json";
    return fetch(url, {
      method: "POST",
      credentials: "omit",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        first: offset,
        offset: offset,
        pageSize: config.pageSize,
        filters: filters,
        sorting: [{ field: "permalink", direction: "DESC" }]
      })
    }).then(checkResponse);
  }

  function checkResponse(response) {
    if (!response.ok) throw new Error("Blog request failed: " + response.status);
    return response.json();
  }

  function detailsFromMarkdown(source) {
    var lines = String(source || "").replace(/\r/g, "").split("\n");
    var title = "";
    var summary = "";
    for (var i = 0; i < lines.length; i += 1) {
      var line = lines[i].trim();
      if (!title) {
        var heading = line.match(/^#\s+(.+)$/);
        if (heading) title = heading[1].trim();
        continue;
      }
      if (!line || /^(?:#{1,6}\s|[-*+]\s|>\s|```)/.test(line)) continue;
      summary = line;
      break;
    }
    return { title: title, summary: summary };
  }

  function detailsFromPostHtml(html) {
    var parsed = new DOMParser().parseFromString(String(html || ""), "text/html");
    var documentRoot = parsed.querySelector("[data-blog-document]") || parsed.querySelector(".blog-post");
    if (!documentRoot) return { title: "", summary: "", imageUrl: "", imageAlt: "" };
    var titleNode = documentRoot.querySelector("h1");
    var summaryNode = documentRoot.querySelector("h1 ~ p") || documentRoot.querySelector("p");
    var details = {
      title: titleNode ? titleNode.textContent.trim() : "",
      summary: summaryNode ? summaryNode.textContent.trim() : ""
    };
    if (!details.title) {
      var markdownNode = documentRoot.querySelector("pre code");
      if (markdownNode) details = detailsFromMarkdown(markdownNode.textContent);
    }
    var imageNode = documentRoot.querySelector("img");
    details.imageUrl = imageNode ? String(imageNode.getAttribute("src") || "").trim() : "";
    details.imageAlt = imageNode ? String(imageNode.getAttribute("alt") || "").trim() : "";
    return details;
  }

  function hydratePost(post, config) {
    if (post.title && post.summary && post.imageUrl) return Promise.resolve(post);
    return fetch(buildPostUrl(post, config), {
      credentials: "omit",
      headers: { Accept: "text/html" }
    }).then(function (response) {
      if (!response.ok) throw new Error("Blog post request failed: " + response.status);
      return response.text();
    }).then(function (html) {
      var details = detailsFromPostHtml(html);
      post.title = post.title || details.title;
      post.summary = post.summary || details.summary;
      if (!post.imageUrl && details.imageUrl) {
        post.imageUrl = details.imageUrl;
        post.imageAlt = post.imageAlt || details.imageAlt || post.title;
        post.imageFromContent = true;
      }
      return post;
    }).catch(function () {
      return post;
    });
  }

  function hydratePosts(posts, config) {
    return Promise.all(posts.map(function (post) {
      return hydratePost(post, config);
    })).then(function (hydrated) {
      return hydrated.filter(function (post) { return Boolean(post.title); });
    });
  }

  function loadPosts(config) {
    var collected = [];
    function next(offset) {
      return requestPage(config, offset).then(function (data) {
        var result = Array.isArray(data) ? data : (Array.isArray(data.result) ? data.result : []);
        var normalized = result.map(function (post) {
          return normalizePost(post, config.locale);
        }).filter(Boolean);
        collected = collected.concat(normalized);
        var total = Number(data.resultSize || data.total || result.length);
        var done = config.fixtureUrl || result.length === 0 || collected.length >= total ||
          collected.length >= config.maxResults;
        return done
          ? hydratePosts(collected.slice(0, config.maxResults), config)
          : next(offset + result.length);
      });
    }
    if (!config.organization && !config.fixtureUrl) return Promise.reject(new Error("Blog organization is required"));
    return next(0);
  }

  function buildIndexUrl(config) {
    var locale = config.locale || "";
    var prefix = localeFromPath(global.location && global.location.pathname) ? "/" + locale : "";
    return prefix + config.basePath;
  }

  function buildPostUrl(post, config) {
    var locale = config.locale || "";
    var prefix = localeFromPath(global.location && global.location.pathname) ? "/" + locale : "";
    return prefix + config.postPath + "/" + post.permalink;
  }

  function currentPermalink(config) {
    var parts = String(global.location && global.location.pathname || "").split("/").filter(Boolean);
    if (parts.length && KNOWN_LOCALES.indexOf(normalizeLocale(parts[0])) >= 0) parts.shift();
    var base = config.postPath.split("/").filter(Boolean);
    for (var i = 0; i <= parts.length - base.length; i += 1) {
      if (base.every(function (part, offset) { return parts[i + offset] === part; })) {
        return parts.slice(i + base.length).map(decodeURIComponent).join("/");
      }
    }
    var legacyIndex = parts.indexOf("blog.html");
    return legacyIndex >= 0 ? parts.slice(legacyIndex + 1).map(decodeURIComponent).join("/") : "";
  }

  function formatDate(value, locale) {
    if (!value) return "";
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    try {
      return new Intl.DateTimeFormat(locale || "en", { year: "numeric", month: "long", day: "numeric" }).format(date);
    } catch (error) {
      return String(value);
    }
  }

  global.LabBlog = {
    buildIndexUrl: buildIndexUrl,
    buildPostUrl: buildPostUrl,
    configFrom: configFrom,
    currentPermalink: currentPermalink,
    formatDate: formatDate,
    getLocale: getLocale,
    loadPosts: loadPosts,
    localizedText: localizedText,
    normalizePost: normalizePost
  };
})(window);


/* generated child JS: blocks/15-blog/blog.index-dynamic/block.js */
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

  function categoriesOf(posts) {
    var categories = [];
    posts.forEach(function (post) {
      if (post.category && categories.indexOf(post.category) < 0) categories.push(post.category);
    });
    return categories;
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
        return state.selected.indexOf(post.category) >= 0;
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
