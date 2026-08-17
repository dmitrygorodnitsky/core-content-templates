(function () {
  "use strict";

  function element(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function safeUrl(value, image) {
    var source = String(value || "").trim();
    if (!source || /^javascript:/i.test(source) || /^data:/i.test(source)) return "";
    try {
      var url = new URL(source, window.location.href);
      if (["http:", "https:"].indexOf(url.protocol) >= 0) return source;
      if (!image && ["mailto:", "tel:"].indexOf(url.protocol) >= 0) return source;
    } catch (error) {
      return "";
    }
    return "";
  }

  function appendInlineMarkdown(target, source) {
    var remaining = String(source || "");
    var match;
    while (remaining) {
      match = remaining.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+["']([^"']*)["'])?\)/);
      if (match) {
        var imageUrl = safeUrl(match[2], true);
        if (imageUrl) {
          var image = document.createElement("img");
          image.src = imageUrl;
          image.alt = match[1];
          image.loading = "lazy";
          image.decoding = "async";
          if (match[3]) image.title = match[3];
          target.appendChild(image);
        } else {
          target.appendChild(document.createTextNode(match[1]));
        }
        remaining = remaining.slice(match[0].length);
        continue;
      }
      match = remaining.match(/^\[([^\]]+)\]\(([^)\s]+)(?:\s+["']([^"']*)["'])?\)/);
      if (match) {
        var linkUrl = safeUrl(match[2], false);
        if (linkUrl) {
          var link = document.createElement("a");
          link.href = linkUrl;
          if (match[3]) link.title = match[3];
          appendInlineMarkdown(link, match[1]);
          target.appendChild(link);
        } else {
          target.appendChild(document.createTextNode(match[1]));
        }
        remaining = remaining.slice(match[0].length);
        continue;
      }
      match = remaining.match(/^`([^`]+)`/);
      if (match) {
        target.appendChild(element("code", "", match[1]));
        remaining = remaining.slice(match[0].length);
        continue;
      }
      match = remaining.match(/^(?:\*\*|__)(.+?)(?:\*\*|__)/);
      if (match) {
        var strong = document.createElement("strong");
        appendInlineMarkdown(strong, match[1]);
        target.appendChild(strong);
        remaining = remaining.slice(match[0].length);
        continue;
      }
      match = remaining.match(/^(?:\*|_)([^*_]+?)(?:\*|_)/);
      if (match) {
        var emphasis = document.createElement("em");
        appendInlineMarkdown(emphasis, match[1]);
        target.appendChild(emphasis);
        remaining = remaining.slice(match[0].length);
        continue;
      }
      match = remaining.match(/^<((?:https?:\/\/|mailto:)[^>]+)>/i);
      if (match) {
        var autoUrl = safeUrl(match[1], false);
        var autoLink = document.createElement("a");
        autoLink.href = autoUrl;
        autoLink.textContent = match[1];
        target.appendChild(autoLink);
        remaining = remaining.slice(match[0].length);
        continue;
      }
      match = remaining.match(/^\\([\\`*_[\]{}()#+\-.!>])/);
      if (match) {
        target.appendChild(document.createTextNode(match[1]));
        remaining = remaining.slice(match[0].length);
        continue;
      }
      target.appendChild(document.createTextNode(remaining.charAt(0)));
      remaining = remaining.slice(1);
    }
  }

  function markdownFragment(source) {
    var fragment = document.createDocumentFragment();
    var lines = String(source || "").replace(/\r\n?/g, "\n").split("\n");
    var paragraph = [];
    var list = null;
    var quote = [];
    var code = null;
    var codeLanguage = "";

    function appendTextBlock(tag, values) {
      if (!values.length) return;
      var node = document.createElement(tag);
      appendInlineMarkdown(node, values.join(" ").trim());
      fragment.appendChild(node);
      values.length = 0;
    }

    function flushParagraph() {
      appendTextBlock("p", paragraph);
    }

    function flushQuote() {
      appendTextBlock("blockquote", quote);
    }

    function closeList() {
      list = null;
    }

    lines.forEach(function (line) {
      var match;
      if (code) {
        if (/^\s*```\s*$/.test(line)) {
          var pre = document.createElement("pre");
          var codeNode = document.createElement("code");
          codeNode.textContent = code.join("\n");
          if (codeLanguage) codeNode.className = "language-" + codeLanguage;
          pre.appendChild(codeNode);
          fragment.appendChild(pre);
          code = null;
          codeLanguage = "";
        } else {
          code.push(line);
        }
        return;
      }

      match = line.match(/^\s*```([A-Za-z0-9_-]*)\s*$/);
      if (match) {
        flushParagraph();
        flushQuote();
        closeList();
        code = [];
        codeLanguage = match[1];
        return;
      }
      if (!line.trim()) {
        flushParagraph();
        flushQuote();
        closeList();
        return;
      }
      match = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
      if (match) {
        flushParagraph();
        flushQuote();
        closeList();
        var heading = document.createElement("h" + match[1].length);
        appendInlineMarkdown(heading, match[2]);
        fragment.appendChild(heading);
        return;
      }
      if (/^\s{0,3}(?:-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
        flushParagraph();
        flushQuote();
        closeList();
        fragment.appendChild(document.createElement("hr"));
        return;
      }
      match = line.match(/^\s*>\s?(.*)$/);
      if (match) {
        flushParagraph();
        closeList();
        quote.push(match[1]);
        return;
      }
      match = line.match(/^\s*[-+*]\s+(.+)$/);
      if (match) {
        flushParagraph();
        flushQuote();
        if (!list || list.tagName !== "UL") {
          list = document.createElement("ul");
          fragment.appendChild(list);
        }
        var unorderedItem = document.createElement("li");
        appendInlineMarkdown(unorderedItem, match[1]);
        list.appendChild(unorderedItem);
        return;
      }
      match = line.match(/^\s*\d+[.)]\s+(.+)$/);
      if (match) {
        flushParagraph();
        flushQuote();
        if (!list || list.tagName !== "OL") {
          list = document.createElement("ol");
          fragment.appendChild(list);
        }
        var orderedItem = document.createElement("li");
        appendInlineMarkdown(orderedItem, match[1]);
        list.appendChild(orderedItem);
        return;
      }
      flushQuote();
      closeList();
      paragraph.push(line.trim());
    });

    if (code) paragraph.push("```" + codeLanguage, code.join("\n"));
    flushParagraph();
    flushQuote();
    return fragment;
  }

  function renderServerMarkdown(root) {
    var documentRoot = root.querySelector("[data-blog-document]");
    if (!documentRoot) return;
    documentRoot.querySelectorAll(".blog-post > .content").forEach(function (content) {
      var pre = content.querySelector(":scope > pre");
      if (!pre) return;
      var meaningfulSiblings = Array.from(content.children).filter(function (child) {
        return child !== pre && String(child.textContent || "").trim();
      });
      if (meaningfulSiblings.length) return;
      var source = String((pre.querySelector("code") || pre).textContent || "").trim();
      if (!source) return;
      content.replaceChildren(markdownFragment(source));
      content.setAttribute("data-blog-markdown-rendered", "true");
    });
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

  function setNamedMeta(name, value) {
    if (!value) return;
    var node = document.head.querySelector('meta[name="' + name + '"]');
    if (!node) {
      node = document.createElement("meta");
      node.name = name;
      document.head.appendChild(node);
    }
    node.content = value;
  }

  function setPropertyMeta(property, value) {
    if (!value) return;
    var node = document.head.querySelector('meta[property="' + property + '"]');
    if (!node) {
      node = document.createElement("meta");
      node.setAttribute("property", property);
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
    if (!post || !post.title) return;
    var canonicalUrl = window.location.href.split("?")[0].split("#")[0];
    document.title = post.title;
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
      author: post.author ? { "@type": "Organization", name: post.author } : undefined,
      image: post.imageUrl || undefined,
      mainEntityOfPage: canonicalUrl,
      url: canonicalUrl
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
    [date, post.readTime, post.author].filter(Boolean).forEach(function (value) {
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
    var documentRoot = root.querySelector("[data-blog-document]");
    try {
      renderServerMarkdown(root);
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
