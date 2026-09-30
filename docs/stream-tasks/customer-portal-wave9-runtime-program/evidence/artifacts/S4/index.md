# S4 Visual Acceptance Artifacts

Design baseline: `c9879ae`
Rows: 62
Modes: strict-full=29, source-effect-components=31, contract-state=2

Raw metrics are always retained. Accepted metrics equal raw metrics for strict rows, exclude only associated changed-pixel components for source-effect rows, and are not an acceptance threshold for contract-state rows.

| Row | Mode | Surface | Vertical | Width | State/variant | Raw changed | Accepted changed | Raw RMS | Accepted RMS | Result |
| --- | --- | --- | --- | ---: | --- | ---: | ---: | ---: | ---: | --- |
| [care-ready-hvac-390](./care-ready-hvac-390/) | source-effect-components | care | HVAC | 390 | ready/default/light | 11010 | 0 | 19.370178 | 0.000000 | pass |
| [care-ready-hvac-768](./care-ready-hvac-768/) | source-effect-components | care | HVAC | 768 | ready/default/light | 23862 | 0 | 21.938328 | 0.000000 | pass |
| [care-ready-hvac-1180](./care-ready-hvac-1180/) | source-effect-components | care | HVAC | 1180 | ready/default/light | 13390 | 0 | 15.943100 | 0.000000 | pass |
| [care-ready-hvac-1440](./care-ready-hvac-1440/) | source-effect-components | care | HVAC | 1440 | ready/default/light | 13390 | 0 | 14.432191 | 0.000000 | pass |
| [care-ready-snow-removal-390](./care-ready-snow-removal-390/) | source-effect-components | care | Snow Removal | 390 | ready/default/light | 742 | 0 | 2.489644 | 0.000000 | pass |
| [care-ready-snow-removal-768](./care-ready-snow-removal-768/) | source-effect-components | care | Snow Removal | 768 | ready/default/light | 742 | 0 | 1.985816 | 0.000000 | pass |
| [care-ready-snow-removal-1180](./care-ready-snow-removal-1180/) | source-effect-components | care | Snow Removal | 1180 | ready/default/light | 742 | 0 | 1.791630 | 0.000000 | pass |
| [care-ready-snow-removal-1440](./care-ready-snow-removal-1440/) | source-effect-components | care | Snow Removal | 1440 | ready/default/light | 742 | 0 | 1.622659 | 0.000000 | pass |
| [care-ready-lawn-and-garden-390](./care-ready-lawn-and-garden-390/) | source-effect-components | care | Lawn & Garden | 390 | ready/default/light | 381 | 0 | 2.012585 | 0.000000 | pass |
| [care-ready-lawn-and-garden-768](./care-ready-lawn-and-garden-768/) | source-effect-components | care | Lawn & Garden | 768 | ready/default/light | 381 | 0 | 1.414110 | 0.000000 | pass |
| [care-ready-lawn-and-garden-1180](./care-ready-lawn-and-garden-1180/) | source-effect-components | care | Lawn & Garden | 1180 | ready/default/light | 362 | 0 | 1.339427 | 0.000000 | pass |
| [care-ready-lawn-and-garden-1440](./care-ready-lawn-and-garden-1440/) | source-effect-components | care | Lawn & Garden | 1440 | ready/default/light | 362 | 0 | 1.212491 | 0.000000 | pass |
| [care-ready-pool-and-spa-390](./care-ready-pool-and-spa-390/) | source-effect-components | care | Pool & Spa | 390 | ready/default/light | 10852 | 0 | 4.470338 | 0.000000 | pass |
| [care-ready-pool-and-spa-768](./care-ready-pool-and-spa-768/) | source-effect-components | care | Pool & Spa | 768 | ready/default/light | 24460 | 0 | 4.671922 | 0.000000 | pass |
| [care-ready-pool-and-spa-1180](./care-ready-pool-and-spa-1180/) | source-effect-components | care | Pool & Spa | 1180 | ready/default/light | 13372 | 0 | 3.473827 | 0.000000 | pass |
| [care-ready-pool-and-spa-1440](./care-ready-pool-and-spa-1440/) | source-effect-components | care | Pool & Spa | 1440 | ready/default/light | 13372 | 0 | 3.144564 | 0.000000 | pass |
| [care-ready-roofing-390](./care-ready-roofing-390/) | source-effect-components | care | Roofing | 390 | ready/default/light | 1113 | 0 | 2.828581 | 0.000000 | pass |
| [care-ready-roofing-768](./care-ready-roofing-768/) | source-effect-components | care | Roofing | 768 | ready/default/light | 1113 | 0 | 2.069334 | 0.000000 | pass |
| [care-ready-roofing-1180](./care-ready-roofing-1180/) | source-effect-components | care | Roofing | 1180 | ready/default/light | 1113 | 0 | 2.016969 | 0.000000 | pass |
| [care-ready-roofing-1440](./care-ready-roofing-1440/) | source-effect-components | care | Roofing | 1440 | ready/default/light | 1113 | 0 | 1.825565 | 0.000000 | pass |
| [care-ready-pest-control-390](./care-ready-pest-control-390/) | strict-full | care | Pest Control | 390 | ready/default/light | 0 | 0 | 0.000000 | 0.000000 | pass |
| [care-ready-pest-control-768](./care-ready-pest-control-768/) | strict-full | care | Pest Control | 768 | ready/default/light | 0 | 0 | 0.000000 | 0.000000 | pass |
| [care-ready-pest-control-1180](./care-ready-pest-control-1180/) | strict-full | care | Pest Control | 1180 | ready/default/light | 0 | 0 | 0.000000 | 0.000000 | pass |
| [care-ready-pest-control-1440](./care-ready-pest-control-1440/) | strict-full | care | Pest Control | 1440 | ready/default/light | 0 | 0 | 0.000000 | 0.000000 | pass |
| [care-ready-health-390](./care-ready-health-390/) | source-effect-components | care | Health | 390 | ready/default/light | 29041 | 0 | 21.311489 | 0.000000 | pass |
| [care-ready-health-768](./care-ready-health-768/) | source-effect-components | care | Health | 768 | ready/default/light | 55502 | 0 | 22.409471 | 0.000000 | pass |
| [care-ready-health-1180](./care-ready-health-1180/) | source-effect-components | care | Health | 1180 | ready/default/light | 33942 | 0 | 17.629279 | 0.000000 | pass |
| [care-ready-health-1440](./care-ready-health-1440/) | source-effect-components | care | Health | 1440 | ready/default/light | 33942 | 0 | 15.958586 | 0.000000 | pass |
| [care-ready-beauty-390](./care-ready-beauty-390/) | source-effect-components | care | Beauty | 390 | ready/default/light | 8350 | 0 | 12.465155 | 0.000000 | pass |
| [care-ready-beauty-768](./care-ready-beauty-768/) | source-effect-components | care | Beauty | 768 | ready/default/light | 8350 | 0 | 9.233454 | 0.000000 | pass |
| [care-ready-beauty-1180](./care-ready-beauty-1180/) | source-effect-components | care | Beauty | 1180 | ready/default/light | 8350 | 0 | 9.590664 | 0.000000 | pass |
| [care-ready-beauty-1440](./care-ready-beauty-1440/) | source-effect-components | care | Beauty | 1440 | ready/default/light | 8350 | 0 | 8.681775 | 0.000000 | pass |
| [care-loading-hvac-390](./care-loading-hvac-390/) | strict-full | care | HVAC | 390 | loading/default/light | 0 | 0 | 0.000000 | 0.000000 | pass |
| [care-empty-health-768](./care-empty-health-768/) | strict-full | care | Health | 768 | empty/default/light | 0 | 0 | 0.000000 | 0.000000 | pass |
| [care-error-beauty-1180](./care-error-beauty-1180/) | strict-full | care | Beauty | 1180 | error/default/light | 0 | 0 | 0.000000 | 0.000000 | pass |
| [care-unauthorized-pest-1440](./care-unauthorized-pest-1440/) | strict-full | care | Pest Control | 1440 | unauthorized/default/light | 0 | 0 | 0.000000 | 0.000000 | pass |
| [care-disabled-hvac-768](./care-disabled-hvac-768/) | contract-state | care | HVAC | 768 | disabled/default/light | 18087 | 18087 | 15.000141 | 15.000141 | pass |
| [care-mobile-nav-health-390](./care-mobile-nav-health-390/) | source-effect-components | care | Health | 390 | ready/mobile-nav/light | 29041 | 0 | 21.311005 | 0.000000 | pass |
| [care-dark-health-390](./care-dark-health-390/) | source-effect-components | care | Health | 390 | ready/default/dark | 29052 | 0 | 12.001520 | 0.000000 | pass |
| [care-dark-health-1440](./care-dark-health-1440/) | source-effect-components | care | Health | 1440 | ready/default/dark | 33953 | 0 | 8.916581 | 0.000000 | pass |
| [seo-ready-health-390](./seo-ready-health-390/) | strict-full | seo | Health | 390 | ready/default/light | 0 | 0 | 0.000000 | 0.000000 | pass |
| [seo-ready-health-768](./seo-ready-health-768/) | strict-full | seo | Health | 768 | ready/default/light | 0 | 0 | 0.000000 | 0.000000 | pass |
| [seo-ready-health-1180](./seo-ready-health-1180/) | strict-full | seo | Health | 1180 | ready/default/light | 0 | 0 | 0.000000 | 0.000000 | pass |
| [seo-ready-health-1440](./seo-ready-health-1440/) | strict-full | seo | Health | 1440 | ready/default/light | 0 | 0 | 0.000000 | 0.000000 | pass |
| [seo-ready-beauty-390](./seo-ready-beauty-390/) | strict-full | seo | Beauty | 390 | ready/default/light | 0 | 0 | 0.000000 | 0.000000 | pass |
| [seo-ready-beauty-768](./seo-ready-beauty-768/) | strict-full | seo | Beauty | 768 | ready/default/light | 0 | 0 | 0.000000 | 0.000000 | pass |
| [seo-ready-beauty-1180](./seo-ready-beauty-1180/) | strict-full | seo | Beauty | 1180 | ready/default/light | 0 | 0 | 0.000000 | 0.000000 | pass |
| [seo-ready-beauty-1440](./seo-ready-beauty-1440/) | strict-full | seo | Beauty | 1440 | ready/default/light | 0 | 0 | 0.000000 | 0.000000 | pass |
| [seo-ready-hvac-390](./seo-ready-hvac-390/) | strict-full | seo | HVAC | 390 | ready/default/light | 0 | 0 | 0.000000 | 0.000000 | pass |
| [seo-ready-hvac-768](./seo-ready-hvac-768/) | strict-full | seo | HVAC | 768 | ready/default/light | 0 | 0 | 0.000000 | 0.000000 | pass |
| [seo-ready-hvac-1180](./seo-ready-hvac-1180/) | strict-full | seo | HVAC | 1180 | ready/default/light | 0 | 0 | 0.000000 | 0.000000 | pass |
| [seo-ready-hvac-1440](./seo-ready-hvac-1440/) | strict-full | seo | HVAC | 1440 | ready/default/light | 0 | 0 | 0.000000 | 0.000000 | pass |
| [seo-faq-open-hvac-768](./seo-faq-open-hvac-768/) | strict-full | seo | HVAC | 768 | ready/faq-open/light | 0 | 0 | 0.000000 | 0.000000 | pass |
| [seo-selected-service-beauty-768](./seo-selected-service-beauty-768/) | contract-state | seo | Beauty | 768 | ready/selected-service/light | 1691274 | 1691274 | 57.031696 | 57.031696 | pass |
| [seo-cta-pending-health-768](./seo-cta-pending-health-768/) | strict-full | seo | Health | 768 | ready/cta-pending/light | 0 | 0 | 0.000000 | 0.000000 | pass |
| [seo-cta-success-health-768](./seo-cta-success-health-768/) | strict-full | seo | Health | 768 | ready/cta-success/light | 0 | 0 | 0.000000 | 0.000000 | pass |
| [seo-cta-error-health-768](./seo-cta-error-health-768/) | strict-full | seo | Health | 768 | ready/cta-error/light | 0 | 0 | 0.000000 | 0.000000 | pass |
| [seo-source-long-health-390](./seo-source-long-health-390/) | strict-full | seo | Health | 390 | ready/source-long-content/light | 0 | 0 | 0.000000 | 0.000000 | pass |
| [seo-missing-media-hvac-390](./seo-missing-media-hvac-390/) | strict-full | seo | HVAC | 390 | ready/missing-media/light | 0 | 0 | 0.000000 | 0.000000 | pass |
| [seo-missing-media-hvac-1440](./seo-missing-media-hvac-1440/) | strict-full | seo | HVAC | 1440 | ready/missing-media/light | 0 | 0 | 0.000000 | 0.000000 | pass |
| [seo-dark-beauty-390](./seo-dark-beauty-390/) | strict-full | seo | Beauty | 390 | ready/default/dark | 0 | 0 | 0.000000 | 0.000000 | pass |
| [seo-dark-beauty-1440](./seo-dark-beauty-1440/) | strict-full | seo | Beauty | 1440 | ready/default/dark | 0 | 0 | 0.000000 | 0.000000 | pass |
