# Portal Block Template Structure

Use this guide when designing a reusable portal website from CMS block templates. The goal is to give designers and front-end developers a shared structure that supports many portal pages without duplicating the same header, footer, styles, scripts, and section layouts.

## Recommended Pattern

Build one common portal root and organize child templates into three major areas:

```text
PORTAL_ROOT
  MENU
    MAIN_MENU
    MENU_INDUSTRIES
    MENU_INDUSTRY_DETAIL
    MENU_SHOP
    MENU_BLOG

  CONTENT
    HOME_LANDING
    INDUSTRIES_LANDING
    INDUSTRY_DETAIL
    SHOP
    BLOG_LIST
    BLOG_DETAIL

  FOOTER
    MAIN_FOOTER
    FOOTER_INDUSTRIES
    FOOTER_SHOP
    FOOTER_BLOG
```

Each page should enable only the menu, content, and footer blocks it needs. The root remains stable, while page composition changes from page to page.

## Root Template

`PORTAL_ROOT` owns only the shared page shell:

- global layout wrapper
- shared CSS and JavaScript
- typography, spacing, color, and button tokens
- menu placement
- content placement
- footer placement
- common head elements and shared asset references

Do not place page-specific copy or one-off content sections directly in the root. If a section appears only on one page, make it a content child template. If a section is reusable, make it a named block under `CONTENT`.

## Menu Templates

Menus should be reusable and composable. Put global navigation in `MAIN_MENU` and page-family navigation in separate menu blocks.

Example menu blocks:

```text
MENU
  MAIN_MENU
  MENU_INDUSTRIES
  MENU_INDUSTRY_DETAIL
  MENU_SHOP
  MENU_BLOG
```

Use normal localized parameters for labels and links instead of large JSON menu structures whenever possible.

Recommended menu parameters:

```text
MENU_LABEL
MENU_URL
MENU_DESCRIPTION
CTA_LABEL
CTA_URL
ARIA_LABEL
```

Example `MENU_INDUSTRIES` parameters:

```text
INDUSTRIES_LABEL
INDUSTRIES_URL
CONSTRUCTION_LABEL
CONSTRUCTION_URL
HEALTHCARE_LABEL
HEALTHCARE_URL
LOGISTICS_LABEL
LOGISTICS_URL
```

Use `LOCALIZED_STRING_SS` for visible text such as labels, descriptions, CTA text, and aria labels. Use a plain string URL parameter for links.

## Content Templates

Content templates represent visible page bodies or reusable page sections.

Good content structure:

```text
CONTENT
  HOME_LANDING
  INDUSTRIES_LANDING
  INDUSTRY_DETAIL
  SHOP
  BLOG_LIST
  BLOG_DETAIL
  CONTACT_SECTION
  NEWSLETTER_CTA
```

Prefer reusable templates by page purpose rather than creating a unique template for every final URL.

Recommended:

```text
INDUSTRY_DETAIL
```

Use this one template for construction, healthcare, logistics, and other industry detail pages when the layout is the same.

Avoid this unless the layouts are genuinely different:

```text
INDUSTRY_1_LANDING
INDUSTRY_2_LANDING
INDUSTRY_3_LANDING
```

Use separate templates only when the visual structure, section order, or interaction model is different.

## Footer Templates

Split the footer into common and contextual blocks.

```text
FOOTER
  MAIN_FOOTER
  FOOTER_INDUSTRIES
  FOOTER_SHOP
  FOOTER_BLOG
```

`MAIN_FOOTER` should contain stable global content:

- logo
- company summary
- contact basics
- social links
- legal links
- copyright

Contextual footer blocks should add page-family-specific links, CTAs, or supporting content.

Example `FOOTER_INDUSTRIES` content:

- industry landing link
- top industry links
- industry consultation CTA
- related resource links

## Page Composition Examples

### Home Page

Use the global menu, home content, and main footer.

```text
PORTAL_ROOT
  MENU
    MAIN_MENU
  CONTENT
    HOME_LANDING
  FOOTER
    MAIN_FOOTER
```

Example page URL:

```text
/
```

Example home content sections inside `HOME_LANDING`:

```text
Hero
Trust strip
Featured industries
Featured products
Latest articles
Final CTA
```

Recommended `HOME_LANDING` parameters:

```text
HERO_TITLE
HERO_SUBTITLE
HERO_CTA_LABEL
HERO_CTA_URL
HERO_IMAGE
TRUST_HEADING
INDUSTRIES_HEADING
SHOP_HEADING
BLOG_HEADING
FINAL_CTA_TITLE
FINAL_CTA_LABEL
FINAL_CTA_URL
```

### Industries Landing Page

Use global navigation plus an industries menu, industries page content, and the industries footer.

```text
PORTAL_ROOT
  MENU
    MAIN_MENU
    MENU_INDUSTRIES
  CONTENT
    INDUSTRIES_LANDING
  FOOTER
    MAIN_FOOTER
    FOOTER_INDUSTRIES
```

Example page URL:

```text
/industries
```

Example `INDUSTRIES_LANDING` sections:

```text
Hero
Industry overview cards
Capabilities summary
Case study strip
Consultation CTA
```

Recommended `INDUSTRIES_LANDING` parameters:

```text
PAGE_TITLE
PAGE_INTRO
CONSTRUCTION_CARD_TITLE
CONSTRUCTION_CARD_SUMMARY
CONSTRUCTION_CARD_URL
HEALTHCARE_CARD_TITLE
HEALTHCARE_CARD_SUMMARY
HEALTHCARE_CARD_URL
LOGISTICS_CARD_TITLE
LOGISTICS_CARD_SUMMARY
LOGISTICS_CARD_URL
CTA_TITLE
CTA_LABEL
CTA_URL
```

### Industry Detail Page

Use the same `INDUSTRY_DETAIL` template for each industry detail page when the layout is shared.

```text
PORTAL_ROOT
  MENU
    MAIN_MENU
    MENU_INDUSTRIES
    MENU_INDUSTRY_DETAIL
  CONTENT
    INDUSTRY_DETAIL
  FOOTER
    MAIN_FOOTER
    FOOTER_INDUSTRIES
```

Example page URLs:

```text
/industries/construction
/industries/healthcare
/industries/logistics
```

Each page can override the same `INDUSTRY_DETAIL` parameters with different values.

Recommended `INDUSTRY_DETAIL` parameters:

```text
INDUSTRY_NAME
HERO_TITLE
HERO_SUBTITLE
HERO_IMAGE
OVERVIEW_HEADING
OVERVIEW_BODY
CHALLENGES_HEADING
CHALLENGE_1_TITLE
CHALLENGE_1_BODY
CHALLENGE_2_TITLE
CHALLENGE_2_BODY
SOLUTIONS_HEADING
SOLUTION_1_TITLE
SOLUTION_1_BODY
SOLUTION_2_TITLE
SOLUTION_2_BODY
CASE_STUDY_TITLE
CASE_STUDY_SUMMARY
CTA_TITLE
CTA_LABEL
CTA_URL
```

Example construction page values:

```text
INDUSTRY_NAME = Construction
HERO_TITLE = Digital operations for construction teams
OVERVIEW_HEADING = Coordinate sites, crews, and equipment
CTA_LABEL = Talk to a construction specialist
```

Example healthcare page values:

```text
INDUSTRY_NAME = Healthcare
HERO_TITLE = Connected service workflows for healthcare facilities
OVERVIEW_HEADING = Keep facilities, requests, and compliance tasks aligned
CTA_LABEL = Talk to a healthcare specialist
```

### Shop Page

Use the global menu plus shop-specific navigation and footer content.

```text
PORTAL_ROOT
  MENU
    MAIN_MENU
    MENU_SHOP
  CONTENT
    SHOP
  FOOTER
    MAIN_FOOTER
    FOOTER_SHOP
```

Example page URL:

```text
/shop
```

Recommended `SHOP` sections:

```text
Hero
Category navigation
Featured products
Product grid
Support CTA
```

Recommended `SHOP` parameters:

```text
PAGE_TITLE
PAGE_INTRO
FEATURED_HEADING
CATEGORY_1_LABEL
CATEGORY_1_URL
CATEGORY_2_LABEL
CATEGORY_2_URL
SUPPORT_CTA_TITLE
SUPPORT_CTA_LABEL
SUPPORT_CTA_URL
```

### Blog List Page

Use blog-specific navigation and footer blocks.

```text
PORTAL_ROOT
  MENU
    MAIN_MENU
    MENU_BLOG
  CONTENT
    BLOG_LIST
  FOOTER
    MAIN_FOOTER
    FOOTER_BLOG
```

Example page URL:

```text
/blog
```

Recommended `BLOG_LIST` sections:

```text
Hero
Featured article
Category filter
Article cards
Newsletter CTA
```

Recommended `BLOG_LIST` parameters:

```text
PAGE_TITLE
PAGE_INTRO
FEATURED_HEADING
CATEGORY_FILTER_LABEL
EMPTY_STATE_TITLE
EMPTY_STATE_BODY
NEWSLETTER_TITLE
NEWSLETTER_LABEL
```

### Blog Detail Page

Use the same root and blog navigation, but swap the content block.

```text
PORTAL_ROOT
  MENU
    MAIN_MENU
    MENU_BLOG
  CONTENT
    BLOG_DETAIL
  FOOTER
    MAIN_FOOTER
    FOOTER_BLOG
```

Example page URL:

```text
/blog/how-to-plan-service-routes
```

Recommended `BLOG_DETAIL` sections:

```text
Article header
Article body
Author block
Related articles
Newsletter CTA
```

## Comprehensive Example: Multi-Industry Portal

The following example shows one portal structure that supports a home page, industries section, three industry detail pages, shop page, and blog pages.

### Template Tree

```text
PORTAL_ROOT
  MENU
    MAIN_MENU
    MENU_INDUSTRIES
    MENU_INDUSTRY_DETAIL
    MENU_SHOP
    MENU_BLOG

  CONTENT
    HOME_LANDING
    INDUSTRIES_LANDING
    INDUSTRY_DETAIL
    SHOP
    BLOG_LIST
    BLOG_DETAIL

  FOOTER
    MAIN_FOOTER
    FOOTER_INDUSTRIES
    FOOTER_SHOP
    FOOTER_BLOG
```

### Page Map

| Page | URL | Enabled menu blocks | Enabled content blocks | Enabled footer blocks |
| --- | --- | --- | --- | --- |
| Home | `/` | `MAIN_MENU` | `HOME_LANDING` | `MAIN_FOOTER` |
| Industries | `/industries` | `MAIN_MENU`, `MENU_INDUSTRIES` | `INDUSTRIES_LANDING` | `MAIN_FOOTER`, `FOOTER_INDUSTRIES` |
| Construction | `/industries/construction` | `MAIN_MENU`, `MENU_INDUSTRIES`, `MENU_INDUSTRY_DETAIL` | `INDUSTRY_DETAIL` | `MAIN_FOOTER`, `FOOTER_INDUSTRIES` |
| Healthcare | `/industries/healthcare` | `MAIN_MENU`, `MENU_INDUSTRIES`, `MENU_INDUSTRY_DETAIL` | `INDUSTRY_DETAIL` | `MAIN_FOOTER`, `FOOTER_INDUSTRIES` |
| Logistics | `/industries/logistics` | `MAIN_MENU`, `MENU_INDUSTRIES`, `MENU_INDUSTRY_DETAIL` | `INDUSTRY_DETAIL` | `MAIN_FOOTER`, `FOOTER_INDUSTRIES` |
| Shop | `/shop` | `MAIN_MENU`, `MENU_SHOP` | `SHOP` | `MAIN_FOOTER`, `FOOTER_SHOP` |
| Blog | `/blog` | `MAIN_MENU`, `MENU_BLOG` | `BLOG_LIST` | `MAIN_FOOTER`, `FOOTER_BLOG` |
| Blog article | `/blog/{article}` | `MAIN_MENU`, `MENU_BLOG` | `BLOG_DETAIL` | `MAIN_FOOTER`, `FOOTER_BLOG` |

### Shared Navigation Fields

`MAIN_MENU`:

```text
LOGO
HOME_LABEL
HOME_URL
INDUSTRIES_LABEL
INDUSTRIES_URL
SHOP_LABEL
SHOP_URL
BLOG_LABEL
BLOG_URL
CONTACT_LABEL
CONTACT_URL
MOBILE_OPEN_LABEL
MOBILE_CLOSE_LABEL
```

`MENU_INDUSTRIES`:

```text
SECTION_LABEL
ALL_INDUSTRIES_LABEL
ALL_INDUSTRIES_URL
CONSTRUCTION_LABEL
CONSTRUCTION_URL
HEALTHCARE_LABEL
HEALTHCARE_URL
LOGISTICS_LABEL
LOGISTICS_URL
```

`MENU_INDUSTRY_DETAIL`:

```text
OVERVIEW_LABEL
CHALLENGES_LABEL
SOLUTIONS_LABEL
CASE_STUDY_LABEL
CONTACT_LABEL
```

### Shared Footer Fields

`MAIN_FOOTER`:

```text
FOOTER_LOGO
FOOTER_SUMMARY
CONTACT_HEADING
CONTACT_EMAIL
CONTACT_PHONE
LEGAL_HEADING
PRIVACY_LABEL
PRIVACY_URL
TERMS_LABEL
TERMS_URL
COPYRIGHT_TEXT
```

`FOOTER_INDUSTRIES`:

```text
INDUSTRIES_FOOTER_HEADING
INDUSTRIES_FOOTER_BODY
CONSULTATION_LABEL
CONSULTATION_URL
```

### Industry Detail Reuse

Use one `INDUSTRY_DETAIL` template for all industry pages. Each page changes values, not structure.

Common fields:

```text
INDUSTRY_NAME
HERO_TITLE
HERO_SUBTITLE
HERO_IMAGE
OVERVIEW_HEADING
OVERVIEW_BODY
CHALLENGE_1_TITLE
CHALLENGE_1_BODY
CHALLENGE_2_TITLE
CHALLENGE_2_BODY
SOLUTION_1_TITLE
SOLUTION_1_BODY
SOLUTION_2_TITLE
SOLUTION_2_BODY
CTA_TITLE
CTA_LABEL
CTA_URL
```

Construction page values:

```text
INDUSTRY_NAME = Construction
HERO_TITLE = Manage field work across active job sites
HERO_SUBTITLE = Coordinate crews, equipment, safety tasks, and service requests from one portal.
OVERVIEW_HEADING = Built for moving teams and changing site conditions
CTA_LABEL = Schedule a construction workflow review
```

Healthcare page values:

```text
INDUSTRY_NAME = Healthcare
HERO_TITLE = Facility service workflows for healthcare operations
HERO_SUBTITLE = Keep maintenance, compliance, vendor work, and urgent requests visible.
OVERVIEW_HEADING = Designed for high-accountability service environments
CTA_LABEL = Schedule a healthcare workflow review
```

Logistics page values:

```text
INDUSTRY_NAME = Logistics
HERO_TITLE = Service coordination for logistics networks
HERO_SUBTITLE = Connect sites, assets, routes, and operational teams across a distributed network.
OVERVIEW_HEADING = Built for location-aware operational planning
CTA_LABEL = Schedule a logistics workflow review
```

## Authoring Guidelines

1. Keep the root stable and generic.
2. Put navigation in menu blocks.
3. Put page bodies in content blocks.
4. Put stable company/legal information in the main footer.
5. Put page-family CTAs and links in contextual footer blocks.
6. Use localized text fields for visible copy.
7. Reuse one detail template when the layout is the same across many pages.
8. Create separate templates only when the visual structure or interaction model is different.
9. Keep block names descriptive and stable.
10. Avoid large JSON structures for author-editable menu labels when normal localized fields are easier to manage.

## Naming Rules

Use clear uppercase codes:

```text
PORTAL_ROOT
MAIN_MENU
MENU_INDUSTRIES
MENU_INDUSTRY_DETAIL
HOME_LANDING
INDUSTRIES_LANDING
INDUSTRY_DETAIL
BLOG_LIST
BLOG_DETAIL
MAIN_FOOTER
FOOTER_INDUSTRIES
```

Avoid names tied to temporary campaigns, page drafts, or one customer unless the template is intentionally customer-specific.

## Design Review Checklist

Before publishing a portal template structure, confirm:

- the root contains only shared shell concerns
- every page has a clear menu/content/footer composition
- labels, headings, CTA text, and descriptions are localized fields
- repeated layouts use shared templates with page-specific values
- contextual footer content is separate from the main footer
- menu blocks do not duplicate the same link labels in multiple places unnecessarily
- one-off content is not hidden inside the root
- block names are stable enough to survive future page additions
