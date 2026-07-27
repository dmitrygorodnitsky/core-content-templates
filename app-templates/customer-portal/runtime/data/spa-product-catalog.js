// Wave 17 accepted fixture transfer: optional ProductModel, gallery and
// published-review enrichment for the Calm Harbor retail catalog. Opaque refs
// are presentation-safe handles; media URLs remain empty until approved assets
// are supplied by the backend/CMS.
export const SPA_PRODUCT_CATALOG = {
  codeToRef: {
    "rtl-beauty-01": "prd-7f3a91",
    "rtl-beauty-02": "prd-2c88de",
    "rtl-beauty-03": "prd-b41f07",
    "rtl-beauty-04": "prd-9d20c5",
    "rtl-beauty-05": "prd-5e6a12",
    "rtl-beauty-06": "prd-c130fb",
  },
  models: [
    { ref: "pmd-bond01", name: "Bond Repair system", media: { url: null, alt: "" }, variants: ["Format", "Size"], productCodes: ["rtl-beauty-01", "rtl-beauty-02"] },
    { ref: "pmd-nail01", name: "At-home nail care", media: null, variants: ["Kit"], productCodes: ["rtl-beauty-03", "rtl-beauty-04"] },
    { ref: "pmd-skin01", name: "Skin hydration ritual", media: { url: null, alt: "" }, variants: ["Format", "Size"], productCodes: ["rtl-beauty-05"] },
  ],
  othersLabel: "Other products",
  byRef: {
    "prd-7f3a91": {
      ref: "prd-7f3a91", code: "rtl-beauty-01", name: "Silk Repair Set", displayPrice: "$64.00",
      collection: { ref: "pmd-bond01", name: "Bond Repair system" },
      description: "The post-color bond treatment our stylists use, sized for home. A weekly rinse-out mask that helps hold your colour and rebuild strength between salon visits.",
      variantFacts: [{ label: "Format", value: "Rinse-out treatment" }, { label: "Size", value: "200 ml" }],
      media: [
        { ref: "med-01a", url: null, alt: "Silk Repair Set jar, front label" },
        { ref: "med-01b", url: null, alt: "Silk Repair Set cream texture, close up" },
        { ref: "med-01c", url: null, alt: "Silk Repair Set applied at the basin" },
      ],
    },
    "prd-2c88de": {
      ref: "prd-2c88de", code: "rtl-beauty-02", name: "Heat Shield Spray", displayPrice: "$28.00",
      collection: { ref: "pmd-bond01", name: "Bond Repair system" },
      description: "A lightweight thermal-protection mist to use before every hot tool. Shields the hair cuticle up to 230°C without weighing styles down.",
      variantFacts: [{ label: "Format", value: "Spray" }, { label: "Size", value: "150 ml · 250 ml" }],
      media: [{ ref: "med-02a", url: null, alt: "Heat Shield Spray bottle, front" }],
    },
    "prd-b41f07": {
      ref: "prd-b41f07", code: "rtl-beauty-03", name: "Cuticle Care Kit", displayPrice: "$22.00",
      collection: { ref: "pmd-nail01", name: "At-home nail care" },
      description: "Everything for between-visit nail upkeep: nourishing oil, a gentle pusher and a conditioning balm to keep cuticles neat and hydrated.",
      variantFacts: [{ label: "Kit", value: "Oil · pusher · balm" }], media: [],
    },
    "prd-9d20c5": {
      ref: "prd-9d20c5", code: "rtl-beauty-04", name: "Gel Removal Kit", displayPrice: "$18.00",
      collection: { ref: "pmd-nail01", name: "At-home nail care" },
      description: "Take gel off without damage. Foil wraps and a conditioning solution lift colour cleanly, so your natural nail stays intact between manicures.",
      variantFacts: [{ label: "Kit", value: "Foils + solution" }, { label: "Uses", value: "10" }],
      media: [{ ref: "med-04a", url: null, alt: "Gel Removal Kit contents laid out" }, { ref: "med-04b", url: null, alt: "Gel Removal Kit foil wrap on a nail" }],
    },
    "prd-5e6a12": {
      ref: "prd-5e6a12", code: "rtl-beauty-05", name: "Hydration Serum", displayPrice: "$52.00",
      collection: { ref: "pmd-skin01", name: "Skin hydration ritual" },
      description: "Your specialist's pick for thirsty skin. A hyaluronic serum that layers under moisturiser to hold water in the skin through the day.",
      variantFacts: [{ label: "Format", value: "Serum" }, { label: "Size", value: "30 ml" }],
      media: [{ ref: "med-05a", url: null, alt: "Hydration Serum dropper bottle, front" }, { ref: "med-05b", url: null, alt: "Hydration Serum dropper, close up" }, { ref: "med-05c", url: null, alt: "Hydration Serum applied to the back of a hand" }],
    },
    "prd-c130fb": {
      ref: "prd-c130fb", code: "rtl-beauty-06", name: "Overnight Mask", displayPrice: "$34.00", collection: null,
      description: "A leave-on treatment mask for twice-a-week use. Wake to softer, more even-looking skin — no rinsing, works while you sleep.",
      variantFacts: [{ label: "Format", value: "Leave-on mask" }, { label: "Size", value: "50 ml" }],
      media: [{ ref: "med-06a", url: null, alt: "Overnight Mask jar, front" }, { ref: "med-06b", url: null, alt: "Overnight Mask whipped texture, close up" }],
    },
    "prd-longform": {
      ref: "prd-longform", code: "rtl-beauty-01", name: "Ultra-restorative overnight bond-recovery treatment mask with extended slow-release conditioning complex", displayPrice: "$64.00",
      collection: { ref: "pmd-bond01", name: "The complete post-colour restoration & ongoing maintenance ritual collection" },
      description: "A preview scenario for the longest content the layout must hold without overflow at 390 px: an unusually long product name, an unusually long collection name, a long multi-sentence description, and a long review body below. None of this text may clip, overlap or push the add-to-bag control off screen — it wraps at word boundaries and the media, facts and reviews stack cleanly beneath it on a narrow phone.",
      variantFacts: [{ label: "Format", value: "Rinse-out treatment" }, { label: "Size", value: "200 ml" }],
      media: [{ ref: "med-lfa", url: null, alt: "Long-name treatment jar, front label" }, { ref: "med-lfb", url: null, alt: "Long-name treatment texture, close up" }],
    },
  },
  reviews: {
    "prd-7f3a91": [
      { ref: "rev-8f01", productRef: "prd-7f3a91", rating: 5, title: "My colour lasts noticeably longer", body: "Three washes in and the fade I usually get by week two just isn't happening. It rinses clean and doesn't leave my hair heavy.", authorName: "Priya S.", verified: true, publishedAt: "Jul 2, 2026" },
      { ref: "rev-8f02", productRef: "prd-7f3a91", rating: 4, title: null, body: "Does what my stylist said it would. A little pricey, but a jar has lasted me two months of weekly use.", authorName: "Danielle R.", verified: true, publishedAt: "Jun 24, 2026" },
      { ref: "rev-8f03", productRef: "prd-7f3a91", rating: 5, title: "Worth it", body: "Hair feels stronger and the shine is back. Repurchasing.", authorName: "Mei L.", verified: false, publishedAt: "Jun 10, 2026" },
    ],
    "prd-2c88de": [],
    "prd-b41f07": [
      { ref: "rev-8f10", productRef: "prd-b41f07", rating: 5, title: "Keeps my hands looking done", body: "The balm is lovely at night and the oil sinks in fast. Cuticles look tidy between appointments.", authorName: "Amara O.", verified: true, publishedAt: "Jun 30, 2026" },
      { ref: "rev-8f11", productRef: "prd-b41f07", rating: 4, title: null, body: "Good little kit. The pusher is gentle — no soreness.", authorName: "Grace T.", verified: false, publishedAt: "Jun 18, 2026" },
    ],
    "prd-9d20c5": [{ ref: "rev-8f20", productRef: "prd-9d20c5", rating: 5, title: "No more picking at gel", body: "Wrapped, waited, and the gel slid right off. My natural nails didn't peel for once.", authorName: "Lena K.", verified: true, publishedAt: "Jun 15, 2026" }],
    "prd-5e6a12": [
      { ref: "rev-8f30", productRef: "prd-5e6a12", rating: 5, title: "Plump, hydrated skin all day", body: "I have combination skin that gets tight by the afternoon, especially with air-con at the office. Two drops under my moisturiser in the morning and that tight feeling is completely gone — my skin still looks dewy when I get home. It layers beautifully under makeup too, no pilling at all, which is the thing that usually ruins serums for me.", authorName: "Sofia H.", verified: true, publishedAt: "Jul 5, 2026" },
      { ref: "rev-8f31", productRef: "prd-5e6a12", rating: 4, title: "A little goes a long way", body: "Lightweight and not sticky. Docking a star only because the dropper can be fiddly.", authorName: "Yuki N.", verified: true, publishedAt: "Jun 27, 2026" },
      { ref: "rev-8f32", productRef: "prd-5e6a12", rating: 5, title: null, body: "My facialist recommended this after my last visit and I get why. Skin looks calmer.", authorName: "Robin C.", verified: true, publishedAt: "Jun 19, 2026" },
      { ref: "rev-8f33", productRef: "prd-5e6a12", rating: 3, title: "Nice, but subtle", body: "It's pleasant and hydrating, I just didn't see a dramatic change. Might work better in winter.", authorName: "Tara M.", verified: false, publishedAt: "Jun 3, 2026" },
    ],
    "prd-c130fb": [
      { ref: "rev-8f40", productRef: "prd-c130fb", rating: 5, title: "Wake up glowing", body: "I use it Sunday and Wednesday nights. By morning my skin is soft and even — no rinsing, which I love.", authorName: "Iris B.", verified: true, publishedAt: "Jul 1, 2026" },
      { ref: "rev-8f41", productRef: "prd-c130fb", rating: 4, title: null, body: "Rich without being greasy. A jar lasts ages.", authorName: "Noor A.", verified: false, publishedAt: "Jun 21, 2026" },
    ],
    "prd-longform": [{ ref: "rev-8f90", productRef: "prd-longform", rating: 5, title: "An unusually long review title that must wrap onto more than one line at 390 px without ever clipping or overlapping the stars", body: "This is a deliberately long review body used to check that a wall of customer text wraps cleanly inside the review card on a narrow phone screen. It should never overflow its container horizontally, never push the verified-purchase badge or the author name out of alignment, and never force the whole page into a horizontal scroll. Long words, long sentences and long paragraphs all have to behave — the card grows downward, the text stays readable, and everything below it simply flows further down the page as expected.", authorName: "Anna-Katarina Villanueva-Öström", verified: true, publishedAt: "Jul 3, 2026" }],
  },
};
