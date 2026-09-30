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

  function taxonomyEntry(entry, locale) {
    if (!entry || typeof entry !== "object") return null;
    var name = localizedText(entry.name, locale, "");
    if (!name && entry.nls) {
      var nls = entry.nls[normalizeLocale(locale)] || entry.nls.en || entry.nls.default;
      name = firstText(nls, ["NAME", "name"], locale);
    }
    if (!name) return null;
    return {
      id: String(entry.id || ""),
      name: name,
      slug: String(entry.slug || ""),
      description: localizedText(entry.description, locale, "")
    };
  }

  function taxonomyOf(list, locale) {
    if (!Array.isArray(list)) return [];
    return list.map(function (entry) {
      return taxonomyEntry(entry, locale);
    }).filter(Boolean);
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
    var categories = taxonomyOf(post.categories, locale);
    var tags = taxonomyOf(post.tags, locale);
    var metadataCategory = firstText(metadata, ["CATEGORY_NAME", "categoryName", "CATEGORY"], locale);
    if (metadataCategory && !categories.some(function (entry) { return entry.name === metadataCategory; })) {
      categories = [{ id: "", name: metadataCategory, slug: "" }].concat(categories);
    }
    var category = categories.length ? categories[0].name : "";
    return {
      id: String(post.id || ""),
      permalink: permalink,
      title: title,
      summary: summary,
      category: category,
      categories: categories,
      tags: tags,
      author: firstText(metadata, ["AUTHOR_NAME", "authorName", "AUTHOR"], locale),
      authorAvatarUrl: firstText(metadata, ["AUTHOR_AVATAR", "authorAvatar", "AUTHOR_AVATAR_URL", "authorAvatarUrl", "AUTHOR_IMAGE_URL", "authorImageUrl"], locale),
      authorBio: firstText(metadata, ["AUTHOR_BIO", "authorBio"], locale),
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

  function loadTaxonomy(config, kind) {
    if (config.fixtureUrl) return Promise.resolve([]);
    var url = localizedApiBase(config) + "/public/" + encodeURIComponent(config.organization) +
      "/blog-post/" + kind + ".json";
    return fetch(url, { credentials: "omit", headers: { Accept: "application/json" } })
      .then(checkResponse)
      .then(function (data) {
        return taxonomyOf(Array.isArray(data) ? data : [], config.locale);
      })
      .catch(function () { return []; });
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
    loadTaxonomy: loadTaxonomy,
    localizedText: localizedText,
    normalizePost: normalizePost
  };
})(window);


/* generated child JS: blocks/15-blog/blog.post-dynamic/block.js */
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

  function documentPost(root) {
    var documentRoot = root.querySelector("[data-blog-document]");
    if (!documentRoot) return null;
    var heading = documentRoot.querySelector("h1");
    var summary = documentRoot.querySelector("h1 ~ p") || documentRoot.querySelector("p");
    var image = documentRoot.querySelector("img");
    var title = heading ? String(heading.textContent || "").trim() : "";
    if (!title) return null;
    return {
      title: title,
      summary: summary ? String(summary.textContent || "").trim() : "",
      imageUrl: image ? image.currentSrc || image.src : "",
      imageAlt: image ? String(image.alt || "").trim() : "",
      publishedAt: "",
      author: ""
    };
  }

  function isPlaceholderValue(value) {
    var text = String(value || "").trim();
    return !text || text === "#" || /^\$\{[A-Z0-9_]+(@[A-Z0-9_]+)?\}$/.test(text);
  }

  function isPlaceholderSchema(value) {
    var text = String(value || "").trim();
    return isPlaceholderValue(text) || text === "{}";
  }

  var clientWritten = {};

  function setMeta(selector, attribute, key, value) {
    if (!value) return;
    var node = document.head.querySelector(selector);
    if (node && !clientWritten[selector] && !isPlaceholderValue(node.getAttribute("content"))) return;
    if (!node) {
      node = document.createElement("meta");
      node.setAttribute(attribute, key);
      document.head.appendChild(node);
    }
    node.setAttribute("content", value);
    clientWritten[selector] = true;
  }

  function setNamedMeta(name, value) {
    setMeta('meta[name="' + name + '"]', "name", name, value);
  }

  function setPropertyMeta(property, value) {
    setMeta('meta[property="' + property + '"]', "property", property, value);
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
    if (!post || !post.title) return;
    var canonicalUrl = window.location.href.split("?")[0].split("#")[0];
    if (clientWritten.title || isPlaceholderValue(document.title)) {
      document.title = post.title;
      clientWritten.title = true;
    }
    setNamedMeta("description", post.summary);
    setPropertyMeta("og:type", "article");
    setPropertyMeta("og:title", post.title);
    setPropertyMeta("og:description", post.summary);
    setPropertyMeta("og:url", canonicalUrl);
    if (post.imageUrl) setPropertyMeta("og:image", post.imageUrl);
    setNamedMeta("twitter:card", post.imageUrl ? "summary_large_image" : "summary");
    setNamedMeta("twitter:title", post.title);
    setNamedMeta("twitter:description", post.summary);
    if (post.imageUrl) setNamedMeta("twitter:image", post.imageUrl);
    setCanonical(canonicalUrl);
    var schema = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: post.title,
      description: post.summary || undefined,
      datePublished: post.publishedAt || undefined,
      author: post.author
        ? { "@type": "Person", name: post.author, image: post.authorAvatarUrl || undefined }
        : undefined,
      image: post.imageUrl || undefined,
      mainEntityOfPage: canonicalUrl,
      url: canonicalUrl
    };
    Object.keys(schema).forEach(function (key) { if (schema[key] === undefined) delete schema[key]; });
    var node = root.querySelector("[data-blog-article-schema]");
    if (node && (clientWritten.schema || isPlaceholderSchema(node.textContent))) {
      node.textContent = JSON.stringify(schema);
      clientWritten.schema = true;
    }
  }

  function initialsOf(name) {
    var parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "";
    var first = parts[0].charAt(0);
    var last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : "";
    return (first + last).toUpperCase();
  }

  function avatarFor(post) {
    var avatar = element("span", "blog-post-page__avatar");
    avatar.setAttribute("aria-hidden", "true");
    if (post.authorAvatarUrl) {
      var image = document.createElement("img");
      image.src = post.authorAvatarUrl;
      image.alt = "";
      image.loading = "lazy";
      image.decoding = "async";
      avatar.appendChild(image);
      return avatar;
    }
    var initials = initialsOf(post.author);
    if (!initials) return null;
    avatar.appendChild(element("span", "blog-post-page__avatar-initials", initials));
    return avatar;
  }

  function fillAuthorText(node, value) {
    if (!node) return "";
    var current = String(node.textContent || "").trim();
    if (!isPlaceholderValue(current)) return current;
    node.textContent = value || "";
    return String(value || "").trim();
  }

  function renderAuthorCard(root, post) {
    var card = root.querySelector("[data-blog-author]");
    if (!card) return;
    var name = fillAuthorText(card.querySelector("[data-blog-author-name]"), post && post.author);
    var bio = fillAuthorText(card.querySelector("[data-blog-author-bio]"), post && post.authorBio);
    if (!name && !bio) {
      card.hidden = true;
      return;
    }
    var avatar = card.querySelector("[data-blog-author-avatar]");
    if (avatar && !avatar.firstChild) {
      var source = avatar.getAttribute("data-blog-author-avatar");
      if (isPlaceholderValue(source)) source = post && post.authorAvatarUrl;
      if (source) {
        var image = document.createElement("img");
        image.src = source;
        image.alt = "";
        image.loading = "lazy";
        image.decoding = "async";
        avatar.appendChild(image);
      } else {
        var initials = initialsOf(name);
        if (initials) avatar.appendChild(element("span", "blog-post-page__avatar-initials", initials));
      }
    }
    card.hidden = false;
  }

  function renderTags(root, post) {
    var host = root.querySelector("[data-blog-tags]");
    if (!host || !post.tags || !post.tags.length) return;
    host.textContent = "";
    post.tags.forEach(function (tag) {
      host.appendChild(element("span", "blog-post-page__tag", tag.name));
    });
    host.hidden = false;
  }

  function relevanceOf(post, current) {
    var ids = function (list) {
      return (list || []).map(function (entry) { return entry.id || entry.name; });
    };
    var currentTags = ids(current.tags);
    var currentCategories = ids(current.categories);
    var shared = function (list, reference) {
      return ids(list).filter(function (value) { return reference.indexOf(value) >= 0; }).length;
    };
    return shared(post.tags, currentTags) * 2 + shared(post.categories, currentCategories);
  }

  function renderCurrent(root, post, config) {
    var title = root.querySelector("[data-blog-current-title]");
    if (title) title.textContent = post.title;
    var meta = root.querySelector("[data-blog-current-meta]");
    var track = element("span", "blog-post-page__meta-track");
    var date = window.LabBlog.formatDate(post.publishedAt, config.locale);
    [post.category, date, post.readTime].filter(Boolean).forEach(function (value) {
      track.appendChild(element("span", "blog-post-page__meta-item", value));
    });
    if (post.author) {
      var avatar = avatarFor(post);
      if (avatar) meta.appendChild(avatar);
      var text = element("span", "blog-post-page__byline-text");
      text.appendChild(element("span", "blog-post-page__author", post.author));
      if (track.children.length) text.appendChild(track);
      meta.appendChild(text);
    } else if (track.children.length) {
      meta.appendChild(track);
    }
    meta.hidden = meta.children.length === 0;
    var hero = root.querySelector("[data-blog-current-image]");
    if (post.imageUrl && !post.imageFromContent) {
      var image = document.createElement("img");
      image.src = post.imageUrl;
      image.alt = post.imageAlt || post.title;
      image.decoding = "async";
      hero.appendChild(image);
      hero.hidden = false;
    }
    renderTags(root, post);
    renderAuthorCard(root, post);
    applySeo(root, post);
  }

  var SHARE_ICONS = {
    x: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117Z"/></svg>',
    facebook: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.78-3.91 1.09 0 2.24.2 2.24.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.45 2.91h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.46ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.11 20.45H3.56V9h3.55ZM22.22 0H1.77C.79 0 0 .77 0 1.72v20.55C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.72C24 .77 23.2 0 22.22 0Z"/></svg>',
    link: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>'
  };

  function canonicalUrl() {
    return window.location.href.split("?")[0].split("#")[0];
  }

  function copyTextFallback(value) {
    return new Promise(function (resolve, reject) {
      var area = document.createElement("textarea");
      area.value = value;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      try {
        if (document.execCommand("copy")) resolve();
        else reject(new Error("Copy command was rejected"));
      } catch (error) {
        reject(error);
      } finally {
        area.remove();
      }
    });
  }

  function copyText(value) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(value).catch(function () {
        return copyTextFallback(value);
      });
    }
    return copyTextFallback(value);
  }

  function shareLink(network, icon, href) {
    var link = document.createElement("a");
    link.className = "blog-post-page__share-button";
    link.href = href;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", network);
    link.title = network;
    link.innerHTML = icon;
    return link;
  }

  function renderShare(root) {
    var host = root.querySelector("[data-blog-share]");
    if (!host) return;
    var url = canonicalUrl();
    var title = serverRenderedTitle(root) || document.title;
    var encodedUrl = encodeURIComponent(url);
    host.appendChild(shareLink("X", SHARE_ICONS.x,
      "https://x.com/intent/post?url=" + encodedUrl + (title ? "&text=" + encodeURIComponent(title) : "")));
    host.appendChild(shareLink("Facebook", SHARE_ICONS.facebook,
      "https://www.facebook.com/sharer/sharer.php?u=" + encodedUrl));
    host.appendChild(shareLink("LinkedIn", SHARE_ICONS.linkedin,
      "https://www.linkedin.com/sharing/share-offsite/?url=" + encodedUrl));
    var copyLabel = root.getAttribute("data-blog-copy-link-label") || "Copy link";
    var copiedLabel = root.getAttribute("data-blog-link-copied-label") || "Link copied";
    var copy = document.createElement("button");
    copy.type = "button";
    copy.className = "blog-post-page__share-button";
    copy.setAttribute("aria-label", copyLabel);
    copy.title = copyLabel;
    copy.innerHTML = SHARE_ICONS.link;
    var feedback = element("span", "blog-post-page__share-feedback", copiedLabel);
    feedback.setAttribute("role", "status");
    feedback.hidden = true;
    var timer = null;
    copy.addEventListener("click", function () {
      copyText(canonicalUrl()).then(function () {
        copy.innerHTML = SHARE_ICONS.check;
        copy.classList.add("is-copied");
        feedback.hidden = false;
        if (timer) clearTimeout(timer);
        timer = setTimeout(function () {
          copy.innerHTML = SHARE_ICONS.link;
          copy.classList.remove("is-copied");
          feedback.hidden = true;
          timer = null;
        }, 2000);
      }).catch(function (error) {
        console.error(error);
      });
    });
    host.appendChild(copy);
    host.appendChild(feedback);
    host.hidden = false;
  }

  function relatedMediaFor(post) {
    var media = element("span", "blog-related-card__media");
    if (post.imageUrl) {
      var image = document.createElement("img");
      image.src = post.imageUrl;
      image.alt = "";
      image.loading = "lazy";
      image.decoding = "async";
      media.appendChild(image);
    } else {
      media.setAttribute("aria-hidden", "true");
    }
    return media;
  }

  function renderRelated(root, posts, current, config) {
    var limit = Math.max(1, Number(root.getAttribute("data-blog-related-limit") || 3));
    var readLabel = root.getAttribute("data-blog-read-label") || "Read article";
    var currentPost = posts.find(function (post) { return post.permalink === current; });
    var candidates = posts.filter(function (post) { return post.permalink !== current; });
    if (currentPost) {
      candidates = candidates.map(function (post, index) {
        return { post: post, score: relevanceOf(post, currentPost), index: index };
      }).sort(function (left, right) {
        return right.score - left.score || left.index - right.index;
      }).map(function (entry) { return entry.post; });
    }
    var list = candidates.slice(0, limit);
    if (!list.length) return;
    var grid = root.querySelector("[data-blog-related]");
    list.forEach(function (post) {
      var article = element("article", "blog-related-card");
      var link = element("a", "blog-related-card__link");
      link.href = window.LabBlog.buildPostUrl(post, config);
      link.appendChild(relatedMediaFor(post));
      var body = element("span", "blog-related-card__body");
      if (post.category) body.appendChild(element("span", "blog-related-card__category", post.category));
      body.appendChild(element("h3", "blog-related-card__title", post.title));
      if (post.summary) body.appendChild(element("p", "blog-related-card__summary", post.summary));
      body.appendChild(element("span", "blog-related-card__read", readLabel));
      link.appendChild(body);
      article.appendChild(link);
      grid.appendChild(article);
    });
    root.querySelector("[data-blog-related-section]").hidden = false;
  }

  function init(root) {
    var documentRoot = root.querySelector("[data-blog-document]");
    try {
      var initialPost = documentPost(root);
      if (initialPost) applySeo(root, initialPost);
    } catch (error) {
      console.error(error);
    } finally {
      if (documentRoot) {
        documentRoot.setAttribute("data-blog-render-state", "ready");
        documentRoot.removeAttribute("aria-busy");
      }
    }
    try {
      renderAuthorCard(root, null);
    } catch (error) {
      console.error(error);
    }
    try {
      renderShare(root);
    } catch (error) {
      console.error(error);
    }
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
