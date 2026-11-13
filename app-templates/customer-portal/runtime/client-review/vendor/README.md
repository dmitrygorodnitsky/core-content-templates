# PDF browser assets

The client-review exporter embeds these pinned assets into the CMS document.
No customer document, font or library is sent to or loaded from a PDF service.

- `jspdf-4.2.1.umd.min.js`: unmodified `dist/jspdf.umd.min.js` from the npm
  `jspdf@4.2.1` tarball; verified against that release's SHA-512 integrity.
  Upstream: https://github.com/parallax/jsPDF. MIT license: `jspdf-LICENSE.txt`.
- `roboto-font.js`: base64 of Google's `src/hinted/Roboto-Regular.ttf`, assigned
  to `ClientReviewPdfFont`. Upstream:
  https://github.com/googlefonts/roboto/blob/main/src/hinted/Roboto-Regular.ttf.
  Apache 2.0 license: `roboto-LICENSE.txt`. The PDF embeds only used glyphs.
  Source TTF SHA-256:
  `56a45233d29f11b4dfb86d248e921939d115778f87325e7ae8cc108383d6664d`.

Roboto supports the current Latin and Cyrillic document text. Unsupported
glyphs fail export instead of producing a document with missing characters.
Additional font coverage belongs with the planned localization work.

The engine is embedded as a data-URI script because its JavaScript template
literals otherwise become JTE expressions. The original vendor file remains
unchanged and auditable. Test the generated CMS preview, which uses the same
embedded assets, when updating an asset.
