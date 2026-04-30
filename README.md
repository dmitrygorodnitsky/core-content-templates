# Core Content Templates

Public repository for reusable Core content packages: CMS block templates, dynamic form assets, email templates, typed entity descriptions, workflow definitions, and configuration scripts.

## Repository Description

Reusable Core CMS templates, dynamic forms, email templates, workflow/type JSON, and configuration examples for Core-based projects.

## Purpose

This repository is for Core-related artifacts that can be shared, reviewed, versioned, and improved outside a specific deployment. It is not a replacement for the Core platform source code. It is a library of importable or referenceable content used by Core modules and Core-based solutions.

`core-content-templates` is the recommended name because the repository is broader than CMS templates, but templates and content packages remain the main theme.

## What Belongs Here

- Core CMS block template exports.
- Shared JavaScript assets such as `dynamic-form.js`.
- Email templates.
- Typed entity type descriptions in JSON.
- Workflow definitions, workflow states, and workflow events in JSON.
- Configuration scripts and examples for Core deployments.
- Sample media metadata needed by CMS template packages.
- Documentation explaining how a package is intended to be imported or used.
- Test cases for scripts

## What Does Not Belong Here

- Core platform source code.
- Customer secrets, credentials, tokens, private keys, or production dumps.
- Deployment-specific configuration containing private hostnames, tenant data, or internal user data.
- Generated build artifacts unless they are the actual importable package.

## Suggested Layout

```text
.
+-- cms-templates/
|   +-- TEMPLATE_CODE/
|       +-- block_template_config.json
|       +-- libraries.json
|       +-- media/
+-- js/
|   +-- dynamic-form.js
+-- email-templates/
|   +-- TEMPLATE_CODE/
+-- entity-types/
|   +-- TYPE_CODE.json
|   +-- README.md
+-- workflows/
|   +-- WORKFLOW_CODE/
|       +-- workflow.json
|       +-- README.md
+-- configuration/
|   +-- examples/
+-- docs/
|-- test/
    +-- js/
    +-- java/
    +-- css
```

CMS template directories should keep the Core export shape whenever possible. A template package should include `block_template_config.json` and any referenced media or library metadata required for import.

## Core Conventions

Artifacts in this repository should follow the existing Core contracts and metadata model.

- Use existing Core JSON shapes rather than inventing new fields.
- Keep codes stable, uppercase, and descriptive.
- Prefer NLS values for names and descriptions.
- For CMS templates, keep parameters grouped and documented.
- For dynamic forms, render from `EntityTypeAttribute`, attribute groups, attribute order, options, and NLS.
- For workflows, include localized state and event names and preserve workflow attribute metadata.
- For media references, document whether the package expects image, video, sound, or media-asset endpoints.

## Contribution Guidelines

Contributions should be self-contained and reviewable.

Before opening a pull request:

1. Remove secrets and deployment-specific data.
2. Validate JSON files.
3. Include a short README for any new package directory.
4. Explain which Core module or feature consumes the artifact.
5. Include import or setup notes when the artifact is not obvious.

Pull requests should describe:

- What the package adds or changes.
- Which Core version or module it was tested with.
- Any required media, scripts, permissions, or configuration.

## License Recommendation

Recommended license: Apache License 2.0.

Apache 2.0 is a good fit for a public contribution repository because it is permissive, widely understood, and includes an explicit patent grant. That is useful for shared templates, scripts, JSON definitions, and workflow examples that may be reused in commercial Core deployments.

If the goal is maximum simplicity and the repository will only contain templates and small scripts, MIT is also reasonable. Apache 2.0 is the safer default for a public ecosystem repository.

## Status

Initial repository structure and contribution rules are being defined. Content packages will be added over time.
