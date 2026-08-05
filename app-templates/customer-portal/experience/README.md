# Customer Experience Definition

This is the canonical authored definition of a landing + portal + Core Auth
login + Core Auth 2FA family.

## Contents

- `config/customer-experience.schema.json` validates every descriptor.
- `config/customer-experience.parameters.json` is the shared registry of
  template codes, profiles, routes, capabilities, and safe CMS parameters.
- `contracts/CUSTOMER-EXPERIENCE-PARAMETER-CONTRACT.md` defines compilation and
  navigation semantics.
- `contracts/ANONYMOUS-INTENT-AUTH-RESUME-CONTRACT.md` defines safe anonymous
  selection and post-auth resume behavior.
- `descriptors/*.json` contains one environment-specific family instance per
  file.

Descriptors are authored here, compiled by the stable entrypoints in
`../scripts/`, and emitted only into `../dist/customer-experience/`.
Generated files are never read back as compiler inputs.

## Related Sources That Stay Outside This Folder

- `../design-inbox/` remains immutable visual authority.
- `../content/cases/` remains domain/content evidence shared with other builds.
- `../../../cms-templates/` remains the home of independently authored reusable
  CMS packages, not generated customer-experience surfaces.
- `../runtime/` remains production portal behavior rather than family config.

## Create And Validate

```bash
node app-templates/customer-portal/scripts/create-customer-experience.mjs
node app-templates/customer-portal/scripts/customer-experience-config-check.mjs
node app-templates/customer-portal/scripts/customer-experience-build-check.mjs
node app-templates/customer-portal/scripts/customer-experience-login-check.mjs
node app-templates/customer-portal/scripts/customer-experience-2fa-check.mjs
```

The wizard writes new descriptors to `experience/descriptors/` by default.
Unresolved URLs, Core Auth PageContext selection, or activation evidence remain
fail-closed.
