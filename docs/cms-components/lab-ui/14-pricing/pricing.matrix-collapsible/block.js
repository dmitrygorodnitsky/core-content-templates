// lab-ui block · pricing.matrix-collapsible
// Listens for the cross-block `pricing:billing` CustomEvent and
// mirrors the period on the section root so any downstream rule
// like `.mx-matrix[data-pricing-period="annual"] [data-price-monthly]`
// can hide / show period-specific values without coupling to other blocks.

(() => {
  const EVENT = "pricing:billing";

  const ready = (fn) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else fn();
  };

  const apply = (section, mode) => {
    section.dataset.pricingPeriod = mode === "annual" ? "annual" : "monthly";
  };

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };

  const append = (parent, child) => {
    parent.appendChild(child);
    return child;
  };

  const stateLabel = (section, state) => {
    const labels = {
      yes: section.dataset.stateLabelYes,
      no: section.dataset.stateLabelNo,
      partial: section.dataset.stateLabelPartial,
      empty: section.dataset.stateLabelEmpty || "",
    };
    return labels[state] || "";
  };

  const rowHint = (attr) => attr.description || "";
  const rowTooltip = (attr) => attr.placeholder || "";

  const setStateA11y = (section, cell, state, valueNode) => {
    const label = stateLabel(section, state);
    if (label && valueNode && !valueNode.textContent.trim()) {
      cell.setAttribute("aria-label", label);
    }
  };

  const planCtaLabel = (section, plan) => {
    if (plan.ctaLabel) return plan.ctaLabel;
    if (plan.customPrice && section.dataset.pricingContactLabel) return section.dataset.pricingContactLabel;
    if (!plan.customPrice && section.dataset.pricingBuyLabel) return section.dataset.pricingBuyLabel;
    const slot = String(plan.index + 1).padStart(2, "0");
    const existing = section.querySelector('.mx-row--cta [data-plan-col="' + slot + '"] .mx-cta');
    return existing ? existing.textContent.trim() : "";
  };

  const planCtaHref = (section, plan, config) => (
    plan.ctaUrl || (config && config.purchaseUrl) || section.dataset.pricingPurchaseUrl || "#"
  );

  const planCol = (index) => String(index + 1).padStart(2, "0");
  const enabled = (value) => value === "true" || value === "on" || value === "1";
  const hasUnifiedGroupCollapse = (section) => Object.prototype.hasOwnProperty.call(section.dataset, "collapsable");

  // Desktop row groups can collapse their rows behind a clickable group
  // title (the mobile accordion already covers <=720px). Opt-in via
  // data-groups-collapsible="on"; per-group default via data-group-collapsed.
  const groupsCollapsible = (section) => {
    if (hasUnifiedGroupCollapse(section)) return enabled(section.dataset.collapsable);
    return section.dataset.groupsCollapsible === "on";
  };

  const applyUnifiedGroupCollapse = (section) => {
    if (!hasUnifiedGroupCollapse(section)) return;
    const collapsible = enabled(section.dataset.collapsable);
    section.dataset.groupsCollapsible = collapsible ? "on" : "off";
    section.querySelectorAll(".mx-shell--table .mx-group").forEach((group) => {
      group.dataset.groupCollapsed = collapsible && enabled(section.dataset.collapsed) ? "true" : "false";
    });
  };

  let groupSeq = 0;
  const setupGroupToggle = (section, group) => {
    if (hasUnifiedGroupCollapse(section)) {
      const collapsible = enabled(section.dataset.collapsable);
      group.dataset.groupCollapsed = collapsible && enabled(section.dataset.collapsed) ? "true" : "false";
    }
    if (!groupsCollapsible(section)) return;
    const title = group.querySelector(".mx-group-title");
    if (!title || title.dataset.collapsibleInit === "1") return;
    title.dataset.collapsibleInit = "1";

    if (!group.id) group.id = "mx-group-" + ++groupSeq;
    if (group.dataset.groupCollapsed !== "true") group.dataset.groupCollapsed = "false";

    const chev = append(title, el("span", "mx-group-chev"));
    chev.setAttribute("aria-hidden", "true");

    title.setAttribute("role", "button");
    title.setAttribute("tabindex", "0");
    title.setAttribute("aria-controls", group.id);
    title.setAttribute("aria-expanded", String(group.dataset.groupCollapsed !== "true"));

    const toggle = () => {
      const collapsed = group.dataset.groupCollapsed === "true";
      group.dataset.groupCollapsed = collapsed ? "false" : "true";
      title.setAttribute("aria-expanded", String(collapsed));
    };
    title.addEventListener("click", toggle);
    title.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle();
      }
    });
  };

  // ─── Per-row explanation tooltip (optional, opt-in) ─────────
  // When data-hint-style="tooltip", the per-row hint/Placeholder text
  // moves into a small popover on the feature label instead of
  // sitting inline. A single position:fixed layer per section keeps it
  // out of the table's clipped overflow. Only rows that actually have
  // explanation text are upgraded.
  let tipLayerSeq = 0;

  const tipText = (btn) => {
    const cell = btn.closest(".mx-cell--feature, dt");
    const source = cell && cell.querySelector(".mx-feature-tip-source");
    const fallbackHint = cell && cell.querySelector(".mx-feature-hint");
    if (source) return source.textContent.trim();
    return fallbackHint ? fallbackHint.textContent.trim() : "";
  };

  const positionTip = (layer, btn) => {
    const rect = btn.getBoundingClientRect();
    layer.style.visibility = "hidden";
    layer.hidden = false;
    const tip = layer.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - tip.width / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - tip.width - 8));
    let top = rect.top - tip.height - 10;
    let placement = "top";
    if (top < 8) {
      top = rect.bottom + 10;
      placement = "bottom";
    }
    layer.style.left = Math.round(left) + "px";
    layer.style.top = Math.round(top) + "px";
    layer.dataset.placement = placement;
    layer.style.setProperty("--mx-tip-arrow", Math.round(rect.left + rect.width / 2 - left) + "px");
    layer.style.visibility = "";
  };

  const tipController = (section) => {
    if (section._mxTip) return section._mxTip;
    const layer = append(section, el("div", "mx-tip"));
    layer.setAttribute("role", "tooltip");
    layer.id = "mx-tip-" + ++tipLayerSeq;
    layer.hidden = true;

    const ctrl = { layer, active: null, pinned: null };
    ctrl.show = (btn) => {
      const text = tipText(btn);
      if (!text) return;
      layer.textContent = text;
      positionTip(layer, btn);
      btn.setAttribute("aria-expanded", "true");
      ctrl.active = btn;
    };
    ctrl.hide = () => {
      if (!ctrl.active) return;
      layer.hidden = true;
      ctrl.active.setAttribute("aria-expanded", "false");
      ctrl.active = null;
    };

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") { ctrl.pinned = null; ctrl.hide(); }
    });
    document.addEventListener("click", (event) => {
      const trigger = event.target.closest(".mx-feature-label--tip");
      if (ctrl.pinned && trigger !== ctrl.pinned) { ctrl.pinned = null; ctrl.hide(); }
    });
    window.addEventListener("scroll", () => { if (ctrl.active) positionTip(layer, ctrl.active); }, true);
    window.addEventListener("resize", () => ctrl.hide());

    section._mxTip = ctrl;
    return ctrl;
  };

  const setupTips = (section) => {
    if (section.dataset.hintStyle !== "tooltip") return;
    const cells = section.querySelectorAll(".mx-shell--table .mx-cell--feature, .mx-shell--accordion .mx-acc-item dt");
    if (!cells.length) return;
    const ctrl = tipController(section);
    cells.forEach((cell) => {
      const label = cell.querySelector(".mx-feature-label");
      const source = cell.querySelector(".mx-feature-tip-source");
      const hint = cell.querySelector(".mx-feature-hint");
      const text = source ? source.textContent.trim() : (hint ? hint.textContent.trim() : "");
      // The label itself is the trigger; the dotted underline signals it.
      // Only rows that actually carry explanation text get upgraded.
      if (!label || !text) return;
      if (label.dataset.tipInit === "1") return;
      label.dataset.tipInit = "1";
      label.classList.add("mx-feature-label--tip");
      label.tabIndex = 0;
      label.setAttribute("role", "button");
      label.setAttribute("aria-label", (section.dataset.tipLabel || "Explanation") + ": " + label.textContent.trim());
      label.setAttribute("aria-describedby", ctrl.layer.id);
      label.setAttribute("aria-expanded", "false");

      const toggle = () => {
        if (ctrl.pinned === label) { ctrl.pinned = null; ctrl.hide(); }
        else { ctrl.pinned = label; ctrl.show(label); }
      };
      label.addEventListener("mouseenter", () => { if (!ctrl.pinned) ctrl.show(label); });
      label.addEventListener("mouseleave", () => { if (ctrl.pinned !== label) ctrl.hide(); });
      label.addEventListener("focus", () => ctrl.show(label));
      label.addEventListener("blur", () => { if (ctrl.pinned !== label) ctrl.hide(); });
      label.addEventListener("click", (event) => { event.preventDefault(); toggle(); });
      label.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") { event.preventDefault(); toggle(); }
      });
    });
  };

  const renderHead = (section, table, plans) => {
    const row = append(table, el("div", "mx-row mx-row--head"));
    row.setAttribute("role", "row");
    const feature = append(row, el("div", "mx-cell mx-cell--feature", section.dataset.featureColumnLabel || ""));
    feature.setAttribute("role", "columnheader");

    plans.forEach((plan) => {
      const cell = append(row, el("div", "mx-cell mx-cell--plan"));
      cell.setAttribute("role", "columnheader");
      cell.dataset.planCol = planCol(plan.index);
      append(cell, el("span", "mx-plan-name", plan.name));
      append(cell, el("span", "mx-plan-tag", plan.customPrice ? (section.dataset.pricingContactLabel || "") : plan.currency));
    });
  };

  const renderTableGroup = (section, table, group, plans) => {
    const groupNode = append(table, el("div", "mx-group"));
    groupNode.setAttribute("role", "rowgroup");
    groupNode.dataset.groupVisible = "show";

    const titleRow = append(groupNode, el("div", "mx-row--group"));
    titleRow.setAttribute("role", "row");
    const title = append(titleRow, el("div", "mx-group-title", group.label));
    title.setAttribute("role", "rowheader");

    group.attributes.forEach((attr) => {
      const row = append(groupNode, el("div", "mx-row"));
      row.setAttribute("role", "row");
      row.dataset.rowVisible = "show";

      const feature = append(row, el("div", "mx-cell mx-cell--feature"));
      feature.setAttribute("role", "rowheader");
      append(feature, el("span", "mx-feature-label", attr.label));
      append(feature, el("span", "mx-feature-hint", rowHint(attr)));
      append(feature, el("span", "mx-feature-tip-source", rowTooltip(attr)));

      plans.forEach((plan) => {
        const value = attr.values[plan.index] || { state: "empty", text: "" };
        const cell = append(row, el("div", "mx-cell"));
        cell.setAttribute("role", "cell");
        cell.dataset.planCol = planCol(plan.index);
        cell.dataset.state = value.state;
        append(cell, el("span", "mx-mobile-plan", plan.name));
        const valueNode = append(cell, el("span", "mx-value", value.text));
        setStateA11y(section, cell, value.state, valueNode);
      });
    });

    setupGroupToggle(section, groupNode);
  };

  const renderCtaRow = (section, table, plans, config) => {
    const row = append(table, el("div", "mx-row mx-row--cta"));
    row.setAttribute("role", "row");
    row.dataset.rowVisible = "show";
    const feature = append(row, el("div", "mx-cell mx-cell--feature"));
    feature.setAttribute("role", "rowheader");
    append(feature, el("span", "mx-feature-label", section.dataset.ctaRowLabel || ""));

    plans.forEach((plan) => {
      const cell = append(row, el("div", "mx-cell"));
      cell.setAttribute("role", "cell");
      cell.dataset.planCol = planCol(plan.index);
      const link = append(cell, el("a", "mx-cta", planCtaLabel(section, plan)));
      link.href = planCtaHref(section, plan, config);
    });
  };

  const renderAccordion = (section, accordion, groups, plans, config) => {
    plans.forEach((plan, index) => {
      const details = append(accordion, el("details", "mx-acc"));
      details.dataset.planCol = planCol(plan.index);
      if (index === 1 || (plans.length < 2 && index === 0)) details.open = true;

      const summary = append(details, el("summary", "mx-acc-summary"));
      append(summary, el("span", "mx-acc-name", plan.name));
      append(summary, el("span", "mx-acc-tag", plan.customPrice ? (section.dataset.pricingContactLabel || "") : plan.currency));
      const chev = append(summary, el("span", "mx-acc-chev"));
      chev.setAttribute("aria-hidden", "true");

      const body = append(details, el("div", "mx-acc-body"));
      groups.forEach((group) => {
        const groupNode = append(body, el("div", "mx-acc-group"));
        groupNode.dataset.groupVisible = "show";
        append(groupNode, el("p", "mx-acc-group-title", group.label));
        const list = append(groupNode, el("dl", "mx-acc-list"));

        group.attributes.forEach((attr) => {
          const value = attr.values[plan.index] || { state: "empty", text: "" };
          const item = append(list, el("div", "mx-acc-item"));
          item.dataset.rowVisible = "show";
          const term = append(item, el("dt"));
          append(term, el("span", "mx-feature-label", attr.label));
          append(term, el("span", "mx-feature-hint", rowHint(attr)));
          append(term, el("span", "mx-feature-tip-source", rowTooltip(attr)));
          const dd = append(item, el("dd", "", value.text));
          dd.dataset.state = value.state;
          setStateA11y(section, dd, value.state, dd);
        });
      });

      const link = append(body, el("a", "mx-acc-cta", planCtaLabel(section, plan)));
      link.dataset.rowVisible = "show";
      link.href = planCtaHref(section, plan, config);
    });
  };

  const renderDynamicMatrix = (section, pricing) => {
    const plans = pricing.plans;
    if (!plans.length || !pricing.groups.length) return;

    section.dataset.columns = String(plans.length);
    section.style.setProperty("--mx-plan-cols", String(plans.length));

    const table = section.querySelector(".mx-shell--table");
    if (table) {
      table.innerHTML = "";
      renderHead(section, table, plans);
      pricing.groups.forEach((group) => renderTableGroup(section, table, group, plans));
      renderCtaRow(section, table, plans, pricing.config);
      table.querySelectorAll(".mx-group").forEach((group) => setupGroupToggle(section, group));
    }

    const accordion = section.querySelector(".mx-shell--accordion");
    if (accordion) {
      accordion.innerHTML = "";
      renderAccordion(section, accordion, pricing.groups, plans, pricing.config);
    }

    labelStates(section);
    setupTips(section);
    section.dataset.pricingState = "dynamic";
  };

  const loadDynamic = (section) => {
    if (!window.LabPricing) {
      section.dataset.pricingState = "fallback";
      return;
    }
    const config = window.LabPricing.parseConfig(section);
    if (!config.enabled) {
      section.dataset.pricingState = "fallback";
      return;
    }

    section.dataset.pricingState = "loading";
    window.LabPricing.load(section)
      .then((pricing) => {
        if (!pricing.ok || !pricing.plans.length || !pricing.groups.length) {
          section.dataset.pricingState = "fallback";
          return;
        }
        renderDynamicMatrix(section, pricing);
      })
      .catch((error) => {
        section.dataset.pricingState = "fallback";
        section.dataset.pricingError = error.message;
      });
  };

  // Icon-only cells (yes/no/partial with an empty value) carry their
  // meaning in CSS pseudo-elements; give them an accessible name from
  // the localized state labels on the section root.
  const labelStates = (section) => {
    const labels = {
      yes: section.dataset.stateLabelYes,
      no: section.dataset.stateLabelNo,
      partial: section.dataset.stateLabelPartial,
      empty: section.dataset.stateLabelEmpty,
    };
    section.querySelectorAll("[data-state]").forEach((el) => {
      const label = labels[el.dataset.state];
      if (!label) return;
      const value = el.matches("dd") ? el : el.querySelector(".mx-value");
      if (value && !value.textContent.trim()) el.setAttribute("aria-label", label);
    });
  };

  const init = (section) => {
    if (section.dataset.mxInit === "1") return;
    section.dataset.mxInit = "1";
    apply(section, section.dataset.pricingPeriod);
    labelStates(section);
    applyUnifiedGroupCollapse(section);
    section.querySelectorAll(".mx-shell--table .mx-group").forEach((group) => setupGroupToggle(section, group));
    setupTips(section);

    document.addEventListener(EVENT, (event) => {
      if (!event.detail) return;
      apply(section, event.detail.period);
    });

    loadDynamic(section);
  };

  ready(() => {
    document.querySelectorAll('[data-block="pricing.matrix-collapsible"]').forEach(init);
  });
})();
