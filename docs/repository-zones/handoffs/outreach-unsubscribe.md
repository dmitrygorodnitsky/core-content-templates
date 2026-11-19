# Outreach unsubscribe route

- Parent task: Move the public outreach unsubscribe page to the root CMS route on dev-1.
- From zone: Snow CRM application bundle in the core-ui repository.
- To zone: Shared CMS packages.
- Required inputs: The existing FormToken API and public ServiceWand wordmark. The asset remains public in the Snow CRM bundle for the email templates.
- Expected output: The standalone HTML source under `cms-templates/OUTREACH_UNSUBSCRIBE` supplies the `head` and `html` fields of the public JTE template. The `SERVICEWAND` PageContext binds it to `/outreach-unsubscribe.html`.
- Acceptance criteria: The new route opens anonymously. Preview and token submission use the existing behavior. The Snow CRM preview and the `UNSUBSCRIBE_PAGE` setting use the root URL. The former app page is absent.
- Owner: cms-packaging. Backup owner: repository-maintenance.

## Evidence

The root page returned HTTP 200 on both dev-1 CMS nodes. A browser submitted
a test FormToken from the new route, and both email variants rendered the new
URL. The Snow CRM preview bundle loaded on both Core nodes. After a clean
redeploy of the verified archive, the previous HTML, CSS and JavaScript URLs
returned HTTP 404 on both Core nodes.

## Production URLs

The `SERVICEWAND` CMS page uses the same source and the PNG from the
production Service Wand media library. Resolve the PNG in that library by
filename and verify its contents against the outreach logo in the Core UI
checkout. Materialize the public image URL in the CMS page and in the
production environment metadata in `scripts/dev/seeds/accountOutreachScripts.json`.
Both assets returned HTTP 200 anonymously on `servicewand.com`. The page
uses the existing FormToken API once the outreach workflow is provisioned.
