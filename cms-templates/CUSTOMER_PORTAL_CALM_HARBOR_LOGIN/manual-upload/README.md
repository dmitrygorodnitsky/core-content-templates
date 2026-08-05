# Manual upload bundle: CUSTOMER_PORTAL_CALM_HARBOR_LOGIN

Use these files for manual CMS UI paste:

- html.html -> HTML field
- head.html -> Head field
- javascript.js -> JavaScript field
- parameters.json -> parameters list/reference
- template.json -> full source object

Code: CUSTOMER_PORTAL_CALM_HARBOR_LOGIN
Template language: JTE
Parameters: 20 (18 localized copy slots, 2 strings)
Children: none — this is a standalone root template

## Which head file to paste

This template exports in the Core shape used by the other packages in
`cms-templates/`, where a template has no separate CSS field and the stylesheet
lives inside `head` as a `<style>` block. **`head.html` is that field, complete
and ready to paste.**

`head.no-style.html` and `css.css` are the same bytes split apart, for a
deployment whose CMS does expose a separate CSS field — that is the shape
`docs/cms-components/lab-ui/dist/manual-upload/` uses. `template.json` carries
the split form. Pick one path; do not paste the CSS twice.

## After pasting

Create the `PageContext` at `/pages/{ORG_CODE}/auth/login.html` (or
`/pages/{ORG_CODE}/{CMS_PATH}/auth/login.html`), with no access permissions
and `excludeFromSeo` set to `true`.

Then check the page renders anonymously through the canonical CMS URL and that
these six placeholders are still present, unsubstituted, in the CMS output —
`core-auth` replaces them at request time and the page falls back to the bundled
one if they are gone:

```text
{{LOGIN_ACTION}}  {{CSRF_PARAMETER_NAME}}  {{CSRF_TOKEN}}
{{RESET_PASSWORD_URL}}  {{ERROR_DISPLAY}}  {{LOGOUT_DISPLAY}}
```

See `../README.md` for the full runtime contract.
