# Winter report source archives

Retrieved from dev-1 on 17 November 2026. Original archive bytes are preserved; hashes are in manifest.json. Report metadata connectionConfig and all database credentials are deliberately excluded.

Both reports remain deferred by the user; this is not a migration blocker. No report was created on production. The temporary fixed-code export helper and its task records were deleted on dev-1 after export.

Before later loading: configure the production JDBC connection, resolve WINTER_SERVICES and BUSINESS_REPORTS by code, preserve required Long parameters, PDF format and source permissions, then compile and render against authorized data. Dev database credentials must not be copied.

Static inspection found JasperReports 7 templates, four language bundles and no subreport packages. WinterContract additionally uses Core CommonMark and DejaVu Sans. SQL fetches the requested document/invoice; caller authorization remains required. WinterInvoice prints full parent-order totals, not invoice allocation or remaining balance; preserve this existing behavior when transferring.

No production compilation, PDF rendering or visual acceptance has been performed.
