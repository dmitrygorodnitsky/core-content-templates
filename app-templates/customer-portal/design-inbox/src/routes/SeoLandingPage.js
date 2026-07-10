// customer-portal-design/src/routes/SeoLandingPage.js — presentation runtime. No business logic.
// Public SEO landing: ONE route serves all six verticals — sections are
// reusable (src/components/seo/SeoSections.js), content is CMS slots
// (data/seo-fixtures.js) selected by the active vertical (state.theme).
// Switch the vertical with the dev-toolbar "theme" select.
import { F } from "../../data/fixtures.js";
import { SEO, SEO_FOOTER } from "../../data/seo-fixtures.js";
import { h } from "../dom.js";
import { state } from "../state.js";
import {
  SeoMetaPreview, SeoHero, SeoTrustStrip, SeoServicesGrid, SeoHowItWorks,
  SeoProofBlock, SeoPricing, SeoServiceArea, SeoReviews, SeoFaq, SeoFinalCta, SeoFooter
} from "../components/seo/SeoSections.js";

export function SeoLanding() {
  var seo = SEO[state.theme];
  var v = F.themes[state.theme];
  return h("section", { "class": "page seo-page", "data-route": "seo.landing", "data-visual-id": "seo-landing", "data-screen-label": "SEO landing \u00b7 " + state.theme }, [
    SeoMetaPreview(seo),
    SeoHero(seo, v),
    SeoTrustStrip(seo),
    SeoServicesGrid(seo, v, F.PAL),
    SeoHowItWorks(seo),
    SeoProofBlock(seo),
    SeoPricing(seo),
    SeoServiceArea(seo),
    SeoReviews(seo),
    SeoFaq(seo),
    SeoFinalCta(seo),
    SeoFooter(seo, SEO_FOOTER)
  ]);
}
