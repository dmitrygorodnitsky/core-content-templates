// customer-portal-design/data/seo-fixtures.js — CMS content slots for the public SEO landing.
// ============================================================
// EVERYTHING here is a CMS DATA SLOT, not a fact. Values that a
// real business must supply (licence numbers, insurance, phone,
// addresses, review media) are `null` — the sections render an
// explicit "from CMS" slot chip instead of an invented claim.
// Codex maps this shape 1:1 onto the CMS collection per
// vertical × locality page.
//
// Shape per vertical:
//   meta      — SEO title, meta description, H1, canonical path,
//               locality / service area, primary CTA destination
//   hero      — service line, seasonal offer slot
//   trust     — rating/reviews, licence, insurance, guarantee,
//               response-time claims (all nullable slots)
//   how       — request → scheduling/dispatch → service → report/payment
//   proof     — vertical-specific proof items (3)
//   pricing   — "from" price rows; from:null = price needs assessment
//   area      — locality + city/region slots (no street addresses)
//   reviews   — review/media collection (media:false = no photo slot)
//   faq       — question/answer collection (FAQ-schema ready)
//   footer    — contacts, hours, service areas, legal links
//
// `{locality}` inside strings is a geography merge tag — Codex
// replaces it per page; the design renders meta.locality into it.
// ============================================================

var STEP_DEFAULT = [
  { key: "request",  title: "Request",   desc: "Tell us what you need and where — 30 seconds, no account required." },
  { key: "schedule", title: "Scheduling", desc: "Pick a slot, or let dispatch assign the nearest certified crew." },
  { key: "service",  title: "Service",   desc: "The crew arrives in the window, tracked live in the portal." },
  { key: "report",   title: "Report & payment", desc: "Photo report + digital invoice. Pay in the app, keep the history." }
];

function steps(overrides) {
  return STEP_DEFAULT.map(function (s) {
    return Object.assign({}, s, (overrides || {})[s.key] ? { desc: overrides[s.key] } : {});
  });
}

export const SEO = {

  /* ============================ HVAC ============================ */
  "HVAC": {
    meta: {
      seoTitle: "AC Repair & HVAC Maintenance in {locality} | Aircove",
      metaDescription: "Book certified HVAC techs in {locality}: same-day AC repair, seasonal maintenance and installs. Live tracking, photo reports, up-front pricing.",
      h1: "AC repair & HVAC maintenance in {locality}",
      canonicalPath: "/hvac/{locality-slug}",
      locality: "Austin, TX",
      serviceArea: "Travis County + 25 mi",
      primaryCta: { kind: "book", label: "Book a visit", destination: "flow.booking" },
      secondaryCta: { kind: "call", label: "Call us" }
    },
    hero: {
      service: "AC repair, tune-ups and installs by certified local techs.",
      offer: { tag: "Season offer", text: "Pre-summer tune-up special on maintenance plans", until: "valid-until: CMS" }
    },
    trust: {
      rating: { value: "4.9", count: "1,284 reviews" },
      licence: { label: "State HVAC licence", value: null },
      insurance: { label: "Insured & bonded", value: null },
      guarantee: { label: "Guarantee", value: "90-day workmanship warranty" },
      response: { label: "Response", value: "Same-day slots in most areas" }
    },
    how: steps({ service: "Certified tech diagnoses on site — most repairs done same visit." }),
    proof: {
      title: "Built around your equipment",
      items: [
        { title: "Equipment passport", desc: "Every unit tracked: make, model, serial, warranty — the tech arrives knowing your system." },
        { title: "Maintenance with a report", desc: "Each visit ends with a point-by-point diagnostic and the technician's notes in your portal." },
        { title: "Emergency response", desc: "No-cool emergencies get priority dispatch with live arrival tracking." }
      ]
    },
    pricing: {
      note: "Prices are set per market by the operator — shown from the CMS, never computed on the page.",
      rows: [
        { name: "AC Repair", from: "$60", unit: "visit" },
        { name: "Seasonal Maintenance", from: "$120", unit: "visit" },
        { name: "New Install / Replacement", from: null, reason: "Sized after a free on-site assessment" }
      ]
    },
    area: {
      cities: ["Austin", "Round Rock", "Cedar Park", "Pflugerville", "Georgetown"],
      note: "Full postcode list comes from dispatch coverage — no addresses shown on the page."
    },
    reviews: [
      { name: "Homeowner · Austin", rating: 5, text: "Tech showed up in the window, fixed the capacitor same visit, report in the app before he left the driveway.", media: true },
      { name: "Homeowner · Round Rock", rating: 5, text: "Maintenance plan pays for itself — the diagnostic caught a failing blower before summer.", media: false },
      { name: "Property manager", rating: 4, text: "Six units across three properties, one dashboard. Scheduling is the easy part now.", media: true }
    ],
    faq: [
      { q: "Do you charge for the diagnostic visit?", a: "The diagnostic fee is shown up front when you book and is credited toward the repair if you proceed." },
      { q: "How fast can a tech arrive?", a: "Same-day slots are offered in most of the service area; emergency no-cool calls get priority dispatch." },
      { q: "Is the repair guaranteed?", a: "Workmanship is covered by a 90-day warranty; parts carry the manufacturer's warranty." },
      { q: "Do I need an account to book?", a: "No — book as a guest. An account is created automatically so you can track the visit and keep reports." }
    ]
  },

  /* ========================= Snow Removal ========================= */
  "Snow Removal": {
    meta: {
      seoTitle: "Snow Removal & De-icing in {locality} | Aircove",
      metaDescription: "Weather-triggered snow clearing and de-icing for homes and commercial lots in {locality}. SLA response windows, GPS-logged visits, compliance reports.",
      h1: "Snow removal in {locality}, dispatched by the storm",
      canonicalPath: "/snow/{locality-slug}",
      locality: "Minneapolis, MN",
      serviceArea: "Hennepin County",
      primaryCta: { kind: "quote", label: "Request seasonal quote", destination: "flow.quote" },
      secondaryCta: { kind: "services", label: "View services" }
    },
    hero: {
      service: "Weather-triggered clearing and de-icing — crews roll before you wake.",
      offer: { tag: "Early-bird", text: "Season-lock pricing before the first snowfall", until: "valid-until: CMS" }
    },
    trust: {
      rating: { value: "4.8", count: "912 reviews" },
      licence: { label: "Municipal contractor licence", value: null },
      insurance: { label: "Liability insurance", value: null },
      guarantee: { label: "SLA", value: "Cleared within the contracted storm window" },
      response: { label: "Dispatch", value: "Automatic at your snowfall trigger" }
    },
    how: steps({
      request: "Tell us the property and surfaces — we quote from measured area, not guesses.",
      schedule: "No calendar needed: dispatch fires automatically at your snowfall trigger.",
      service: "Crew clears to the contracted spec; arrival and route are GPS-logged.",
      report: "Timestamped photo log per storm — your slip-and-fall compliance record."
    }),
    proof: {
      title: "Compliance-grade storm response",
      items: [
        { title: "Weather trigger", desc: "Your contract sets the snowfall threshold — dispatch is automatic, no phone calls at 5 am." },
        { title: "SLA response window", desc: "Every storm response is timed against the contracted window and logged, met or missed." },
        { title: "Slip-and-fall compliance", desc: "GPS + photo + materials log per visit, exportable as a season compliance report." }
      ]
    },
    pricing: {
      note: "Seasonal contracts are quoted from measured surface area; per-storm pricing from the CMS.",
      rows: [
        { name: "Per-storm clearing", from: "$94", unit: "storm" },
        { name: "De-icing add-on", from: "$38", unit: "application" },
        { name: "Seasonal contract", from: null, reason: "Quoted from measured area and trigger level" }
      ]
    },
    area: {
      cities: ["Minneapolis", "St. Paul", "Bloomington", "Edina", "Plymouth"],
      note: "Commercial routes are planned per storm — coverage confirmed at quote time."
    },
    reviews: [
      { name: "Facilities manager", rating: 5, text: "The compliance log alone is worth it — every storm documented before our insurer even asks.", media: true },
      { name: "Homeowner · Edina", rating: 5, text: "Driveway was clear at 6:10 am after an overnight storm. Photo in the app as proof.", media: false }
    ],
    faq: [
      { q: "What triggers a visit?", a: "Your contract sets a snowfall threshold (e.g. 2 in / 5 cm). When the local station reports it, dispatch is automatic." },
      { q: "What if the SLA window is missed?", a: "Every response is logged against the window; misses are flagged in your season log and credited per contract terms." },
      { q: "Do you serve commercial lots?", a: "Yes — lots, walkways and loading zones, with per-surface pricing and a compliance report per storm." },
      { q: "Can I get proof of service for insurance?", a: "Each visit carries GPS, timestamps, photos and materials used — exportable as a compliance pack." }
    ]
  },

  /* ========================= Lawn & Garden ========================= */
  "Lawn & Garden": {
    meta: {
      seoTitle: "Lawn Care & Garden Maintenance in {locality} | Aircove",
      metaDescription: "Season-programme lawn care in {locality}: mowing, feeding, aeration on schedule. Re-entry safety after treatments, photo log of every visit.",
      h1: "Lawn care in {locality} on a season programme",
      canonicalPath: "/lawn/{locality-slug}",
      locality: "Raleigh, NC",
      serviceArea: "Wake County",
      primaryCta: { kind: "quote", label: "Request a quote", destination: "flow.quote" },
      secondaryCta: { kind: "services", label: "View services" }
    },
    hero: {
      service: "Mowing, feeding and garden care by vetted local crews.",
      offer: { tag: "Spring start", text: "Programme sign-up offer for the new season", until: "valid-until: CMS" }
    },
    trust: {
      rating: { value: "4.9", count: "1,040 reviews" },
      licence: { label: "Applicator licence", value: null },
      insurance: { label: "Insured crews", value: null },
      guarantee: { label: "Guarantee", value: "Re-cut within 48h if you're not happy" },
      response: { label: "Cadence", value: "Weekly slots, same crew" }
    },
    how: steps({
      schedule: "Pick a weekly slot — the same crew keeps it all season.",
      report: "Photo after every cut + treatment log with re-entry guidance."
    }),
    proof: {
      title: "A programme, not one-off mows",
      items: [
        { title: "Season programme", desc: "Five steps from spring cleanup to winterizing — you see what's done, what's next, and when." },
        { title: "Kids & pets re-entry", desc: "After every treatment: what was applied and exactly when the lawn is safe to re-enter." },
        { title: "Visible progress", desc: "Soil snapshot and progress photos visit over visit — the lawn's history in one place." }
      ]
    },
    pricing: {
      note: "Programme pricing depends on lot size — quoted after a measured assessment.",
      rows: [
        { name: "Lawn Mowing", from: "$45", unit: "visit" },
        { name: "Feeding & Treatment", from: "$60", unit: "application" },
        { name: "Season Programme", from: null, reason: "Priced from measured lawn area" }
      ]
    },
    area: {
      cities: ["Raleigh", "Cary", "Apex", "Wake Forest", "Garner"],
      note: "Crews are routed by neighborhood for weekly cadence."
    },
    reviews: [
      { name: "Homeowner · Cary", rating: 5, text: "Same two guys every Thursday. Photo when they're done, re-entry note after treatments — kids out by dinner.", media: true },
      { name: "Homeowner · Raleigh", rating: 4, text: "The season programme took the guesswork out. Aeration happened exactly when the plan said.", media: false }
    ],
    faq: [
      { q: "Is it safe for kids and pets after treatment?", a: "Every treatment logs what was applied and the re-entry window — you get a notification when the lawn is safe." },
      { q: "Do I get the same crew?", a: "Yes — weekly routes keep the same crew on your lawn all season." },
      { q: "What's in the season programme?", a: "Five steps: spring cleanup, feeding, aeration & overseeding, weed control, winterizing — tracked in your portal." },
      { q: "What if I'm not happy with a cut?", a: "Report it from the visit photo — the crew re-cuts within 48 hours at no charge." }
    ]
  },

  /* ========================== Pool & Spa ========================== */
  "Pool & Spa": {
    meta: {
      seoTitle: "Pool Cleaning & Water Care in {locality} | Aircove",
      metaDescription: "Certified pool techs in {locality}: cleaning, chemical balancing, equipment care. Water readings logged every visit — always swim-ready.",
      h1: "Pool care in {locality}, always swim-ready",
      canonicalPath: "/pool/{locality-slug}",
      locality: "Scottsdale, AZ",
      serviceArea: "Maricopa County East",
      primaryCta: { kind: "book", label: "Book a visit", destination: "flow.booking" },
      secondaryCta: { kind: "call", label: "Call us" }
    },
    hero: {
      service: "Cleaning, balancing and equipment care by certified techs.",
      offer: { tag: "Season opening", text: "Opening + first month of weekly care bundled", until: "valid-until: CMS" }
    },
    trust: {
      rating: { value: "4.9", count: "768 reviews" },
      licence: { label: "CPO certification", value: null },
      insurance: { label: "Insured techs", value: null },
      guarantee: { label: "Guarantee", value: "Crystal-clear or we come back free" },
      response: { label: "Cadence", value: "Weekly visits, readings every time" }
    },
    how: steps({
      service: "Tech cleans, tests and doses — every reading logged against safe ranges.",
      report: "Water readings + dosing log per visit; swim-ready status in the app."
    }),
    proof: {
      title: "Water you can see into — literally",
      items: [
        { title: "Readings every visit", desc: "Chlorine, pH, alkalinity logged against safe ranges with trends over time." },
        { title: "Swim-ready status", desc: "One clear answer in the app: safe to swim now, or when it will be." },
        { title: "Dosing log", desc: "What was added, how much, and why — no mystery chemicals." }
      ]
    },
    pricing: {
      note: "Weekly care is priced by pool volume and equipment — from the CMS per market.",
      rows: [
        { name: "Pool Cleaning", from: "$90", unit: "visit" },
        { name: "Chemical Balancing", from: "$45", unit: "visit" },
        { name: "Equipment repair", from: null, reason: "Diagnosed on site, quoted before work starts" }
      ]
    },
    area: {
      cities: ["Scottsdale", "Tempe", "Mesa", "Paradise Valley", "Fountain Hills"],
      note: "Routes are weekly; one-time cleanups subject to slot availability."
    },
    reviews: [
      { name: "Homeowner · Scottsdale", rating: 5, text: "The swim-ready status ended the 'can we swim yet?' debate forever. Readings right in the app.", media: true },
      { name: "Airbnb host", rating: 5, text: "Guests check in to a clear pool every time. The dosing log covers me if anyone asks.", media: true }
    ],
    faq: [
      { q: "How do I know the water is safe?", a: "Every visit logs chlorine, pH and alkalinity against safe ranges — the app shows a single swim-ready status." },
      { q: "Do you service spas and hot tubs?", a: "Yes — spa care follows the same visit + readings + dosing log model." },
      { q: "What if the pool turns green between visits?", a: "Covered by the clear-water guarantee — we return free of charge and adjust the programme." },
      { q: "Do you repair equipment?", a: "Pumps, filters and heaters are diagnosed on site; you approve the quote in the app before any work." }
    ]
  },

  /* =========================== Roofing =========================== */
  "Roofing": {
    meta: {
      seoTitle: "Roof Inspection & Repair in {locality} | Aircove",
      metaDescription: "Certified roofers in {locality}: drone inspections with written reports, tracked repairs and replacements. Photo-logged, insured crews.",
      h1: "Roofing in {locality} — inspected, documented, tracked",
      canonicalPath: "/roofing/{locality-slug}",
      locality: "Denver, CO",
      serviceArea: "Denver metro",
      primaryCta: { kind: "book", label: "Book an inspection", destination: "flow.booking" },
      secondaryCta: { kind: "call", label: "Call us" }
    },
    hero: {
      service: "Drone inspections, repairs and replacements by certified crews.",
      offer: { tag: "Post-storm", text: "Priority inspection slots after hail events", until: "valid-until: CMS" }
    },
    trust: {
      rating: { value: "4.8", count: "534 reviews" },
      licence: { label: "Roofing contractor licence", value: null },
      insurance: { label: "Liability + workers' comp", value: null },
      guarantee: { label: "Guarantee", value: "Workmanship warranty on every repair" },
      response: { label: "Reports", value: "Written condition report within 24h" }
    },
    how: steps({
      service: "Drone survey + on-roof check; findings mapped by zone with severity.",
      report: "Written condition report, repair plan and pricing — approve in the app."
    }),
    proof: {
      title: "Paper trail for your biggest asset",
      items: [
        { title: "Drone inspection", desc: "Full survey mapped by roof zone with severity per finding — no guesswork from the ground." },
        { title: "Written report", desc: "Condition score, photos and repair plan in a document you keep — useful for insurance." },
        { title: "Project tracking", desc: "Repairs and replacements tracked stage by stage in the portal, with photos at each milestone." }
      ]
    },
    pricing: {
      note: "Repair and replacement pricing always follows an inspection — only the inspection is priced up front.",
      rows: [
        { name: "Roof Inspection", from: "$95", unit: "visit" },
        { name: "Minor repair", from: "$240", unit: "job" },
        { name: "Replacement / major repair", from: null, reason: "Quoted from the inspection report" }
      ]
    },
    area: {
      cities: ["Denver", "Aurora", "Lakewood", "Arvada", "Centennial"],
      note: "Post-storm demand is triaged — inspection slots prioritized by damage severity."
    },
    reviews: [
      { name: "Homeowner · Denver", rating: 5, text: "The drone report found hail damage the adjuster missed. Claim approved with their photos.", media: true },
      { name: "Homeowner · Arvada", rating: 4, text: "Replacement tracked stage by stage — I knew exactly which day the crane was coming.", media: false }
    ],
    faq: [
      { q: "What does the inspection include?", a: "A drone survey plus on-roof check, mapped by zone with severity, delivered as a written report within 24 hours." },
      { q: "Can I use the report for an insurance claim?", a: "Yes — the report includes dated photos, findings by zone and a condition score in a shareable document." },
      { q: "How are big projects tracked?", a: "Replacements run as tracked projects: stages, milestone photos and payments all in the portal." },
      { q: "Is the work guaranteed?", a: "Every repair carries a workmanship warranty; materials carry the manufacturer's warranty." }
    ]
  },

  /* ========================= Pest Control ========================= */
  "Pest Control": {
    meta: {
      seoTitle: "Pest Control & Prevention in {locality} | Aircove",
      metaDescription: "Licensed pest control in {locality}: inspection, treatment and station monitoring. Family & pet safe, free re-treatments under the plan guarantee.",
      h1: "Pest control in {locality} that stays on watch",
      canonicalPath: "/pest/{locality-slug}",
      locality: "Tampa, FL",
      serviceArea: "Hillsborough County",
      primaryCta: { kind: "book", label: "Book a treatment", destination: "flow.booking" },
      secondaryCta: { kind: "call", label: "Call us" }
    },
    hero: {
      service: "Inspection, treatment and prevention by licensed techs.",
      offer: { tag: "Plan offer", text: "First quarterly treatment discounted on annual plans", until: "valid-until: CMS" }
    },
    trust: {
      rating: { value: "4.9", count: "1,102 reviews" },
      licence: { label: "State applicator licence", value: null },
      insurance: { label: "Insured technicians", value: null },
      guarantee: { label: "Guarantee", value: "Free re-treat between visits on a plan" },
      response: { label: "Products", value: "Family & pet safe options logged per visit" }
    },
    how: steps({
      service: "Licensed tech treats interior + perimeter; products logged per visit.",
      report: "Treatment log + station status in the app; re-treat requests one tap away."
    }),
    proof: {
      title: "Monitoring between visits",
      items: [
        { title: "Station & sensor map", desc: "Bait stations and smart sensors around the property, each with its own status in the app." },
        { title: "Alert log", desc: "First activity triggers an alert — you see it the moment the sensor does." },
        { title: "Re-treat guarantee", desc: "Activity between visits? Request a free re-treatment from the app — covered by the plan." }
      ]
    },
    pricing: {
      note: "Plan pricing depends on property size and pest pressure — quoted after inspection.",
      rows: [
        { name: "General Treatment", from: "$85", unit: "visit" },
        { name: "Rodent Control", from: "$120", unit: "setup" },
        { name: "Annual plan", from: null, reason: "Quoted after the initial inspection" }
      ]
    },
    area: {
      cities: ["Tampa", "Brandon", "Riverview", "Wesley Chapel", "Carrollwood"],
      note: "Quarterly routes; acute infestations get priority slots."
    },
    reviews: [
      { name: "Homeowner · Tampa", rating: 5, text: "Sensor pinged at 2 am, re-treat requested from bed, tech out two days later. Zero drama.", media: false },
      { name: "Restaurant owner", rating: 5, text: "The station log is our health-inspection insurance. Every check documented.", media: true }
    ],
    faq: [
      { q: "Are the products safe for kids and pets?", a: "Techs use family & pet safe options where possible; every product applied is logged with re-entry guidance." },
      { q: "What if pests come back between visits?", a: "On a plan, re-treatments between scheduled visits are free — request one from the app." },
      { q: "How does monitoring work?", a: "Bait stations and smart sensors report status to your portal; first activity triggers an alert." },
      { q: "Do you handle commercial properties?", a: "Yes — restaurants and offices get documented station checks suitable for health inspections." }
    ]
  },

  /* ============================ Health ============================
     LOGISTICS ONLY — the page markets scheduling, coordination and
     secure documents. NO clinical claims, outcomes or medical advice;
     regulated statements (registrations, insurance) are null CMS slots. */
  "Health": {
    meta: {
      seoTitle: "In-Home Care & Support Visits in {locality} | Aircove",
      metaDescription: "Book licensed in-home care providers in {locality}: home care visits, physio and nursing support. One family schedule, secure documents, a consistent care team.",
      h1: "In-home care in {locality}, coordinated in one portal",
      canonicalPath: "/health/{locality-slug}",
      locality: "Portland, OR",
      serviceArea: "Multnomah County",
      primaryCta: { kind: "book", label: "Book an intake visit", destination: "flow.booking" },
      secondaryCta: { kind: "call", label: "Call us" }
    },
    hero: {
      service: "Home care visits, physio and nursing support by licensed providers.",
      offer: { tag: "New clients", text: "Intake assessment bundled with the first visit", until: "valid-until: CMS" }
    },
    trust: {
      rating: { value: "4.9", count: "486 reviews" },
      licence: { label: "Provider registration", value: null },
      insurance: { label: "Insured & background-checked", value: null },
      guarantee: { label: "Continuity", value: "The same care team, visit to visit" },
      response: { label: "Intake", value: "First visit within a week in most areas" }
    },
    how: steps({
      request: "Tell us who the care is for and what kind of support — 30 seconds, no paperwork to start.",
      schedule: "Pick times that fit the household — the same care team keeps the slot.",
      service: "A licensed provider arrives in the window; family can follow the schedule live.",
      report: "The visit summary lands in the secure portal — documents stay locked to your account."
    }),
    proof: {
      title: "Coordination, not paperwork",
      items: [
        { title: "One schedule for everyone", desc: "Appointments, reminders and reschedules in one portal the whole family can follow." },
        { title: "Care plan milestones", desc: "Intake, reviews and cadence changes tracked step by step — you always know what's next." },
        { title: "Secure documents", desc: "Visit summaries and results packages open in a secure viewer — never over email, every access logged." }
      ]
    },
    pricing: {
      note: "Care pricing is set per market and per program — always from the CMS, never computed on the page.",
      rows: [
        { name: "Home Care Visit", from: "$75", unit: "visit" },
        { name: "Physio Session", from: "$95", unit: "session" },
        { name: "Care program", from: null, reason: "Planned after the in-home intake assessment" }
      ]
    },
    area: {
      cities: ["Portland", "Beaverton", "Lake Oswego", "Gresham", "Tigard"],
      note: "Coverage depends on provider availability — confirmed at intake."
    },
    reviews: [
      { name: "Family caregiver · Portland", rating: 5, text: "Scheduling for my dad stopped being a group chat. Everyone sees the same calendar.", media: false },
      { name: "Client · Beaverton", rating: 5, text: "Same physio every Tuesday, and the visit summary is in the portal before dinner.", media: true }
    ],
    faq: [
      { q: "Is this a medical service?", a: "Aircove partners with licensed providers for in-home support visits. The portal handles scheduling and documents; clinical care and medical records stay with your provider." },
      { q: "Who can see the documents?", a: "Only account holders you invite. Documents open in a secure viewer and every access is logged." },
      { q: "Can family manage the schedule?", a: "Yes — invite family members with scheduling access. They see appointments and reminders; documents stay private unless you share them." },
      { q: "What if we need to cancel a visit?", a: "Reschedule from the appointment up to 24 hours ahead at no charge." }
    ]
  },

  /* ============================ Beauty ============================ */
  "Beauty": {
    meta: {
      seoTitle: "At-Home Beauty Services in {locality} | Aircove",
      metaDescription: "Hair, nails and skin by vetted specialists in {locality} — at home or in-studio. Your formulas and routine remembered visit to visit; packages and member pricing.",
      h1: "Beauty services in {locality} that remember your routine",
      canonicalPath: "/beauty/{locality-slug}",
      locality: "Miami, FL",
      serviceArea: "Miami-Dade",
      primaryCta: { kind: "book", label: "Book a specialist", destination: "flow.booking" },
      secondaryCta: { kind: "call", label: "Call us" }
    },
    hero: {
      service: "Hair, nails and skin by vetted specialists — at home or in-studio.",
      offer: { tag: "First visit", text: "Intro offer on your first routine visit", until: "valid-until: CMS" }
    },
    trust: {
      rating: { value: "4.9", count: "2,036 reviews" },
      licence: { label: "Cosmetology licences", value: null },
      insurance: { label: "Insured specialists", value: null },
      guarantee: { label: "Guarantee", value: "Redo within 48h if you're not happy" },
      response: { label: "Slots", value: "Evenings & weekends available" }
    },
    how: steps({
      request: "Pick the service and where — your place or a partner studio.",
      schedule: "Choose your specialist or let us match one; keep them for every visit.",
      service: "The specialist arrives with a sanitised pro kit; formulas come from your profile.",
      report: "Formulas, shades and routine notes saved to your profile for next time."
    }),
    proof: {
      title: "A routine, not one-off appointments",
      items: [
        { title: "Your specialist, every time", desc: "Set a preferred specialist — priority rebooking keeps them on your routine." },
        { title: "Formulas remembered", desc: "Color formulas, shades and skin notes carry over visit to visit — no re-explaining." },
        { title: "Packages & loyalty", desc: "Session packages and member points tracked in the portal, redeemable on any visit." }
      ]
    },
    pricing: {
      note: "Prices are set per market by the operator — shown from the CMS, never computed on the page.",
      rows: [
        { name: "Manicure & Nails", from: "$45", unit: "visit" },
        { name: "Hair Styling", from: "$65", unit: "visit" },
        { name: "Event & bridal package", from: null, reason: "Quoted after a trial consultation" }
      ]
    },
    area: {
      cities: ["Miami", "Coral Gables", "Miami Beach", "Doral", "Aventura"],
      note: "In-studio appointments at partner locations; at-home slots by neighborhood."
    },
    reviews: [
      { name: "Client · Miami Beach", rating: 5, text: "Alina has my color formula saved — 'the usual' actually means something now.", media: true },
      { name: "Bride · Coral Gables", rating: 5, text: "Trial, timeline, day-of team — one coordinator handled all of it.", media: true },
      { name: "Client · Doral", rating: 4, text: "Gel set at my kitchen table on a Sunday evening. The kit was spotless.", media: false }
    ],
    faq: [
      { q: "Home or studio?", a: "Both — book at-home visits or a partner studio near you; the price is shown before you confirm." },
      { q: "Can I keep the same specialist?", a: "Yes — set a preferred specialist and they get priority on your bookings; your formulas travel with your profile either way." },
      { q: "How do packages work?", a: "Buy a session package once, book sessions whenever — usage is tracked in the portal and never expires early." },
      { q: "What if I'm not happy with the result?", a: "Report it from the visit — a redo within 48 hours is covered by the guarantee." }
    ]
  }
};

/* Shared footer slots — per-operator, not per-vertical. All contact
   values are CMS slots (null = must be supplied, never invented). */
export const SEO_FOOTER = {
  contacts: {
    phone: null,       /* slot: operator phone */
    email: null,       /* slot: operator email */
    address: null      /* slot: registered business address (optional) */
  },
  hours: [
    { d: "Mon–Fri", h: "7:00 – 20:00" },
    { d: "Sat", h: "8:00 – 18:00" },
    { d: "Sun", h: "Emergency only" }
  ],
  legal: [
    { label: "Privacy policy", href: "#" },
    { label: "Terms of service", href: "#" },
    { label: "Licence & insurance", href: "#" }
  ]
};
