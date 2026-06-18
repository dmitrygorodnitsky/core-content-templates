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

  const setStateA11y = (section, cell, state, valueNode) => {
    const label = stateLabel(section, state);
    if (label && valueNode && !valueNode.textContent.trim()) {
      cell.setAttribute("aria-label", label);
    }
  };

  const planCtaLabel = (section, plan) => {
    if (plan.customPrice && section.dataset.pricingContactLabel) return section.dataset.pricingContactLabel;
    if (!plan.customPrice && section.dataset.pricingBuyLabel) return section.dataset.pricingBuyLabel;
    const slot = String(plan.index + 1).padStart(2, "0");
    const existing = section.querySelector('.mx-row--cta [data-plan-col="' + slot + '"] .mx-cta');
    return existing ? existing.textContent.trim() : "";
  };

  const planCol = (index) => String(index + 1).padStart(2, "0");
  const enabled = (value) => value === "true" || value === "on" || value === "1";

  const setupSectionCollapse = (section) => {
    if (!enabled(section.dataset.collapsable)) return;
    const toggle = section.querySelector(".mx-section-toggle");
    const body = section.querySelector(".mx-body");
    if (!toggle || !body) return;

    if (!body.id) body.id = "pricing-matrix-body-" + Math.random().toString(36).slice(2);
    toggle.setAttribute("aria-controls", body.id);
    section.dataset.collapseReady = "1";

    const sync = () => {
      const collapsed = enabled(section.dataset.collapsed);
      toggle.setAttribute("aria-expanded", String(!collapsed));
      body.hidden = collapsed;
    };

    toggle.addEventListener("click", () => {
      section.dataset.collapsed = enabled(section.dataset.collapsed) ? "false" : "true";
      sync();
    });

    sync();
  };

  // Desktop row groups can collapse their rows behind a clickable group
  // title (the mobile accordion already covers <=720px). Opt-in via
  // data-groups-collapsible="on"; per-group default via data-group-collapsed.
  const groupsCollapsible = (section) => section.dataset.groupsCollapsible === "on";

  let groupSeq = 0;
  const setupGroupToggle = (section, group) => {
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
      append(feature, el("span", "mx-feature-hint", attr.description));

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
      link.href = config.purchaseUrl || "#";
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
          append(item, el("dt", "", attr.label));
          const dd = append(item, el("dd", "", value.text));
          dd.dataset.state = value.state;
          setStateA11y(section, dd, value.state, dd);
        });
      });

      const link = append(body, el("a", "mx-acc-cta", planCtaLabel(section, plan)));
      link.dataset.rowVisible = "show";
      link.href = config.purchaseUrl || "#";
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
    setupSectionCollapse(section);
    section.querySelectorAll(".mx-shell--table .mx-group").forEach((group) => setupGroupToggle(section, group));

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
