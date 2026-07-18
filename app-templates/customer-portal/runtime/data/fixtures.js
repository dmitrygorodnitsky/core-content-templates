/* ============================================================
   Aircove Customer Portal — data/fixtures.js
   Fixture data ONLY. No API calls, no business math that
   Codex must own. Everything here is display data the design
   renders from. Codex swaps this module for real adapters.

   Exposes:  window.AircoveFixtures
   ============================================================ */
(function () {
  "use strict";

  /* Icon palettes used to tint order / service rows (dot + soft bg) */
  var PAL = [
    ["var(--accent)", "rgba(var(--accent-rgb),.12)"],
    ["#1f8a44", "rgba(52,199,89,.16)"],
    ["#ff8a3d", "rgba(255,159,10,.16)"],
    ["#7a52e0", "rgba(122,82,224,.16)"]
  ];
  var TINTS = [
    ["var(--accent)", "linear-gradient(160deg,rgba(var(--accent-rgb),.18),rgba(var(--accent-rgb),.32))"],
    ["#1f8a44", "linear-gradient(160deg,#dcf5e2,#bff0cf)"],
    ["#ff8a3d", "linear-gradient(160deg,#ffe9d6,#ffd3ad)"],
    ["#7a52e0", "linear-gradient(160deg,#eee6ff,#d8c6ff)"]
  ];

  /* Map vertical display name -> data-theme slug (styles.css) */
  var themeSlugs = {
    "HVAC": "hvac",
    "Snow Removal": "snow",
    "Lawn & Garden": "lawn",
    "Pool & Spa": "pool",
    "Roofing": "roofing",
    "Pest Control": "pest",
    "Health": "health",
    "Beauty": "beauty"
  };

  /* ---------- Verticals (theme content) ---------- */
  var themes = {
    "HVAC": {
      slug: "hvac", accent: "#0a5ae6",
      hero: { badge: "\u26a1 Same-day slots in your area", title: "Home comfort, handled in a tap.", sub: "Book AC repair, maintenance and installs from certified local techs. Track them live, pay in the app." },
      svc: [
        { name: "AC Repair", price: "$60", tagline: "Fast diagnosis & on-site fix", duration: "~60 min", includes: ["Full fault diagnosis", "Most repairs done same visit", "90-day workmanship warranty"] },
        { name: "Maintenance", price: "$120", tagline: "Seasonal tune-up & cleaning", duration: "~90 min", includes: ["Coil, filter & drain clean", "21-point performance check", "Written health report"] },
        { name: "Installation", price: "Quote", tagline: "New system, expertly fitted", duration: "half day", includes: ["Free in-home site assessment", "Certified professional install", "Old unit haul-away included"] },
        { name: "Air Quality Check", price: "$90", tagline: "Breathe cleaner, healthier air", duration: "~45 min", includes: ["Particle & VOC measurement", "Personalised filter advice", "Full home air report"] }
      ],
      orderNames: ["Filter replacement", "Emergency AC Check", "Annual maintenance", "AC Installation", "Diagnostics visit"],
      wt: { icon: "\ud83c\udf21\ufe0f", trigger: "Heat wave \u2265 38\u00b0C forecast tomorrow", past: "Heat spike 39.1\u00b0C recorded", sla: "Checked within the 4-hour contracted window" },
      plan: { name: "Comfort Plan", plusName: "Comfort Plus", tag: "Best for a single home", desc: "2 visits a year, priority slots, \u201315% on parts.", headline: "Pricing that fits your home",
        features: ["2 seasonal tune-ups a year", "Priority same-week slots", "\u201315% on all parts", "Free diagnostics visits"],
        plusFeatures: ["4 visits a year", "Same-day priority dispatch", "\u201325% on all parts", "24/7 support line"] },
      feat: { badge: "New \u00b7 Wi-Fi inverter", title: "Mini Split \u2014 whisper-quiet comfort", desc: "12,000 BTU, 22 SEER, app control. Professionally installed by your local team.", cta: "Buy & install \u00b7 $1,290", fin: "or $108/mo \u00b7 0% APR" },
      cats: [{ key: "units", label: "AC units" }, { key: "thermostats", label: "Thermostats" }, { key: "filters", label: "Filters" }, { key: "purifiers", label: "Air purifiers" }],
      products: [
        { cat: "units", tag: "AC Unit", name: "Mini Split 12k BTU", blurb: "Quiet inverter \u00b7 Wi-Fi \u00b7 22 SEER", price: "$1,290", priceNum: 1290 },
        { cat: "units", tag: "AC Unit", name: "Dual-Zone 24k BTU", blurb: "Cools two rooms independently", price: "$2,150", priceNum: 2150 },
        { cat: "thermostats", tag: "Thermostat", name: "Smart Thermostat", blurb: "Learns your weekly schedule", price: "$189", priceNum: 189 },
        { cat: "thermostats", tag: "Sensor", name: "Room Sensor Pack (3)", blurb: "Balance temperature room-by-room", price: "$99", priceNum: 99 },
        { cat: "filters", tag: "Filter", name: "HEPA Filter 20\u00d725", blurb: "Captures 99.97% of particles", price: "$34", priceNum: 34 },
        { cat: "filters", tag: "Filter", name: "Carbon Odor Filter", blurb: "For kitchens, pets & smoke", price: "$28", priceNum: 28 },
        { cat: "purifiers", tag: "Purifier", name: "Purifier Pro", blurb: "Whole-home \u00b7 up to 1,500 sq ft", price: "$349", priceNum: 349 },
        { cat: "purifiers", tag: "Purifier", name: "Desk Purifier", blurb: "Personal clean-air zone", price: "$129", priceNum: 129 }
      ],
      reminder: { title: "Replace your air filter", desc: "It has been 88 days since the last change" },
      prop: { svc: "Seasonal HVAC Program", surfaces: ["Floor 1", "Floor 2", "Basement", "Attic", "Garage"], months: "May\u2013Sep", unlimDesc: "Unlimited tune-ups and priority heat-wave response.", colA: "Tune-up", colB: "Deep clean", unitA: "/ tune-up", unitB: "/ deep clean" }
    },
    "Snow Removal": {
      slug: "snow", accent: "#0e8fc4",
      hero: { badge: "\u2744 24/7 storm response", title: "Winter, handled before you wake.", sub: "Snow clearing and de-icing by local crews \u2014 weather-triggered dispatch, GPS-logged visits, photo proof after every clear." },
      svc: [
        { name: "Snow Clearing", price: "$94", tagline: "Driveway, walkways & lanes", duration: "~45 min", includes: ["Cleared to bare surface", "GPS-logged arrival & photos", "90-minute storm-window SLA"] },
        { name: "De-Icing", price: "$58", tagline: "Salt & brine application", duration: "~30 min", includes: ["Eco-friendly de-icer available", "Slip-risk spot treatment", "Free re-treat on refreeze"] },
        { name: "Roof Snow Removal", price: "Quote", tagline: "Prevent ice dams & overload", duration: "half day", includes: ["Load assessment included", "Safe rope-access crew", "Gutter ice clearing"] },
        { name: "Seasonal Contract", price: "$120", tagline: "Set-and-forget winter cover", duration: "~30 min", includes: ["Weather-triggered dispatch", "Unlimited storm visits", "Monthly compliance report"] }
      ],
      orderNames: ["Walkway salting", "Snow Clearing \u2014 De-Icing", "Seasonal contract visit", "Roof Snow Removal", "De-icing visit"],
      wt: { icon: "\u2744\ufe0f", trigger: "Snowfall \u2265 2 cm forecast overnight", past: "Snowfall 3.2 cm recorded overnight", sla: "Cleared within the 90-minute contracted window" },
      plan: { name: "Winter Plan", plusName: "Winter Plus", tag: "Best for a single property", desc: "Priority storm dispatch, \u201315% on de-icing.", headline: "Pricing that fits your winter",
        features: ["Priority storm dispatch", "2 free de-icing visits", "\u201315% on materials", "Photo report every visit"],
        plusFeatures: ["Same-storm guarantee", "Unlimited de-icing", "\u201325% on materials", "24/7 storm line"] },
      feat: { badge: "New \u00b7 App-scheduled", title: "Smart Brine Sprayer \u2014 de-ice before it freezes", desc: "Connected tank applies brine to driveways and walks ahead of the storm.", cta: "Buy & install \u00b7 $890", fin: "or $75/mo \u00b7 0% APR" },
      cats: [{ key: "deicers", label: "De-icers" }, { key: "equipment", label: "Equipment" }, { key: "markers", label: "Markers & mats" }],
      products: [
        { cat: "deicers", tag: "De-icer", name: "Calcium Blend 20 kg", blurb: "Melts to \u221225\u00b0C \u00b7 concrete-safe", price: "$32", priceNum: 32 },
        { cat: "deicers", tag: "De-icer", name: "Pet-Safe Granules", blurb: "Chloride-free \u00b7 gentle on paws", price: "$38", priceNum: 38 },
        { cat: "equipment", tag: "Equipment", name: "Poly Snow Pusher", blurb: "Wide blade \u00b7 no-scratch edge", price: "$54", priceNum: 54 },
        { cat: "equipment", tag: "Equipment", name: "Telescopic Roof Rake", blurb: "Reach 6 m from the ground", price: "$89", priceNum: 89 },
        { cat: "markers", tag: "Marker", name: "Driveway Markers (12)", blurb: "Reflective \u00b7 guide the plow", price: "$24", priceNum: 24 },
        { cat: "markers", tag: "Mat", name: "Heated Walkway Mat", blurb: "Plug-in \u00b7 melts 5 cm/hour", price: "$210", priceNum: 210 }
      ],
      reminder: { title: "Restock de-icer", desc: "Your last bag was delivered 60 days ago" },
      prop: { svc: "Snow Removal & De-Icing", surfaces: ["Drive Lanes", "Driveway", "Pavement", "Private Sidewalk", "Public Sidewalk"], months: "Nov\u2013Mar", unlimDesc: "Unlimited de-icing at \u22640\u00b0C and clearing at 2 cm.", colA: "Snow clearing", colB: "De-icing", unitA: "/ clearing", unitB: "/ de-ice" }
    },
    "Lawn & Garden": {
      slug: "lawn", accent: "#2f9e44",
      hero: { badge: "\ud83c\udf31 Weekly slots open", title: "A lawn worth staying home for.", sub: "Mowing, feeding and garden care by vetted local crews. Track visits live, pay in the app." },
      svc: [
        { name: "Lawn Mowing", price: "$45", tagline: "Cut, trim & blow", duration: "~40 min", includes: ["Edges & walkways trimmed", "Clippings removed", "Photo after every cut"] },
        { name: "Fertilizing", price: "$80", tagline: "Seasonal feeding program", duration: "~30 min", includes: ["Soil-matched formula", "Kid & pet safe options", "Growth report included"] },
        { name: "Landscaping", price: "Quote", tagline: "Beds, hedges & redesign", duration: "half day", includes: ["Free on-site design visit", "Licensed & insured crew", "1-year plant warranty"] },
        { name: "Yard Cleanup", price: "$110", tagline: "Spring & fall resets", duration: "~2 h", includes: ["Leaves & debris hauled", "Beds edged & mulched", "Gutter-line sweep"] }
      ],
      orderNames: ["Lawn mowing", "Lawn Care \u2014 Rain Check", "Fertilizing visit", "Landscaping project", "Yard cleanup"],
      wt: { icon: "\ud83c\udf27\ufe0f", trigger: "Heavy rain forecast \u2014 visit may shift", past: "Rain 22 mm recorded \u2014 visit completed late-day", sla: "Completed within the 48-hour weather window" },
      plan: { name: "Green Plan", plusName: "Green Plus", tag: "Best for a single yard", desc: "Weekly mowing priority, \u201315% on treatments.", headline: "Pricing that fits your yard",
        features: ["Weekly mowing priority", "2 free spot treatments", "\u201315% on fertilizing", "Photo report every visit"],
        plusFeatures: ["Mow + feed bundle", "Unlimited spot treatments", "\u201325% on landscaping", "Dedicated crew"] },
      feat: { badge: "New \u00b7 GPS-guided", title: "Robotic Mower \u2014 hands-free stripes", desc: "Quiet, app-controlled, cuts on your schedule. Installed and tuned by your local crew.", cta: "Buy & install \u00b7 $1,450", fin: "or $121/mo \u00b7 0% APR" },
      cats: [{ key: "care", label: "Lawn care" }, { key: "irrigation", label: "Irrigation" }, { key: "garden", label: "Garden" }],
      products: [
        { cat: "care", tag: "Lawn care", name: "Seed & Feed Mix", blurb: "Overseed + slow-release feed", price: "$28", priceNum: 28 },
        { cat: "care", tag: "Lawn care", name: "Organic Fertilizer", blurb: "Kid & pet safe \u00b7 4-week feed", price: "$36", priceNum: 36 },
        { cat: "irrigation", tag: "Irrigation", name: "Smart Sprinkler Timer", blurb: "Skips rainy days automatically", price: "$129", priceNum: 129 },
        { cat: "irrigation", tag: "Irrigation", name: "Drip Irrigation Kit", blurb: "Covers up to 20 beds", price: "$89", priceNum: 89 },
        { cat: "garden", tag: "Garden", name: "Cedar Planter Box", blurb: "Rot-resistant \u00b7 120\u00d740 cm", price: "$74", priceNum: 74 },
        { cat: "garden", tag: "Garden", name: "Garden Tool Set", blurb: "Ergonomic 5-piece set", price: "$59", priceNum: 59 }
      ],
      reminder: { title: "Time to fertilize", desc: "Last application was 45 days ago" },
      prop: { svc: "Lawn Care & Fertilization", surfaces: ["Front Lawn", "Back Lawn", "Side Yard", "Boulevard", "Garden Beds"], months: "May\u2013Sep", unlimDesc: "Weekly mowing plus unlimited spot treatments.", colA: "Mowing", colB: "Fertilizing", unitA: "/ mow", unitB: "/ treatment" }
    },
    "Pool & Spa": {
      slug: "pool", accent: "#0d9488",
      hero: { badge: "\ud83d\udca7 Crystal-clear guarantee", title: "Your pool, always swim-ready.", sub: "Cleaning, balancing and equipment care by certified techs. Every visit logged with photos and readings." },
      svc: [
        { name: "Pool Cleaning", price: "$90", tagline: "Vacuum, skim & brush", duration: "~60 min", includes: ["Floor & walls vacuumed", "Baskets & filter rinsed", "Photo + reading log"] },
        { name: "Chemical Balance", price: "$55", tagline: "Water testing & dosing", duration: "~30 min", includes: ["7-point water test", "Chemicals included", "Re-check if off-range"] },
        { name: "Equipment Repair", price: "Quote", tagline: "Pumps, heaters & filters", duration: "~90 min", includes: ["Same-week diagnosis", "OEM parts warranty", "Energy-use check"] },
        { name: "Opening / Closing", price: "$220", tagline: "Season start & shutdown", duration: "half day", includes: ["Lines blown & plugged", "Cover fitted & sealed", "Startup chemicals included"] }
      ],
      orderNames: ["Pool cleaning", "Chemical Balance \u2014 Heat Watch", "Weekly maintenance", "Heater installation", "Water test visit"],
      wt: { icon: "\u2600\ufe0f", trigger: "Heat wave \u2265 34\u00b0C \u2014 algae risk rising", past: "Heat wave 36\u00b0C recorded \u2014 extra dose applied", sla: "Balanced within the 24-hour contracted window" },
      plan: { name: "Clear Plan", plusName: "Clear Plus", tag: "Best for a single pool", desc: "Weekly testing, \u201315% on chemicals.", headline: "Pricing that fits your pool",
        features: ["Weekly water testing", "Priority heat-wave visits", "\u201315% on chemicals", "Reading log every visit"],
        plusFeatures: ["Weekly clean + balance", "Unlimited re-balancing", "\u201325% on repairs", "24/7 equipment line"] },
      feat: { badge: "New \u00b7 Energy Star", title: "Variable-Speed Pump \u2014 cut energy 70%", desc: "Whisper-quiet, app-scheduled, rebate-eligible. Installed by certified techs.", cta: "Buy & install \u00b7 $1,150", fin: "or $96/mo \u00b7 0% APR" },
      cats: [{ key: "chemicals", label: "Chemicals" }, { key: "equipment", label: "Equipment" }, { key: "accessories", label: "Accessories" }],
      products: [
        { cat: "chemicals", tag: "Chemical", name: "Chlorine Tabs 8 kg", blurb: "Slow-dissolve \u00b7 season supply", price: "$64", priceNum: 64 },
        { cat: "chemicals", tag: "Chemical", name: "pH Balance Kit", blurb: "Raise & lower \u00b7 40 doses", price: "$29", priceNum: 29 },
        { cat: "equipment", tag: "Equipment", name: "Robotic Pool Vac", blurb: "Cleans floor & walls solo", price: "$649", priceNum: 649 },
        { cat: "equipment", tag: "Equipment", name: "LED Pool Light", blurb: "16 colors \u00b7 app control", price: "$89", priceNum: 89 },
        { cat: "accessories", tag: "Accessory", name: "Solar Cover 16 ft", blurb: "Holds heat overnight", price: "$139", priceNum: 139 },
        { cat: "accessories", tag: "Accessory", name: "Test Strips (100)", blurb: "7-way water check", price: "$18", priceNum: 18 }
      ],
      reminder: { title: "Water test due", desc: "Last full test was 30 days ago" },
      prop: { svc: "Pool Care Program", surfaces: ["Main Pool", "Spa", "Pool Deck", "Coping", "Equipment Pad"], months: "May\u2013Sep", unlimDesc: "Weekly cleaning plus unlimited chemical balancing.", colA: "Cleaning", colB: "Balancing", unitA: "/ clean", unitB: "/ balance" }
    },
    "Roofing": {
      slug: "roofing", accent: "#4f46e5",
      hero: { badge: "\ud83d\udee1 Certified & insured crews", title: "A roof you never think about.", sub: "Inspections, repairs and replacements by certified local roofers. Drone reports, photo-logged work." },
      svc: [
        { name: "Roof Inspection", price: "$95", tagline: "Drone + on-roof check", duration: "~60 min", includes: ["Full drone survey", "Written condition report", "Repair plan & pricing"] },
        { name: "Leak Repair", price: "$180", tagline: "Find & fix, guaranteed", duration: "~2 h", includes: ["Moisture-traced source", "Matching materials", "2-year repair warranty"] },
        { name: "Gutter Cleaning", price: "$120", tagline: "Clear & flush downspouts", duration: "~90 min", includes: ["Debris hauled away", "Downspout flush test", "Photo before/after"] },
        { name: "Full Replacement", price: "Quote", tagline: "Tear-off to new roof", duration: "multi-day", includes: ["Free on-site estimate", "Certified installers", "25-year system warranty"] }
      ],
      orderNames: ["Gutter cleaning", "Storm Inspection", "Annual inspection", "Leak repair", "Drone survey"],
      wt: { icon: "\ud83c\udf27\ufe0f", trigger: "Storm gusts \u2265 80 km/h forecast tonight", past: "Gusts 92 km/h recorded overnight", sla: "Inspected within the 24-hour storm window" },
      plan: { name: "Shelter Plan", plusName: "Shelter Plus", tag: "Best for a single roof", desc: "Annual inspection, priority storm response.", headline: "Pricing that fits your roof",
        features: ["Annual drone inspection", "Priority storm response", "\u201315% on repairs", "Yearly condition report"],
        plusFeatures: ["Twice-yearly inspection", "Free minor repairs", "\u201325% on replacement", "24/7 storm line"] },
      feat: { badge: "New \u00b7 25-yr warranty", title: "Gutter Guard System \u2014 never climb again", desc: "Micro-mesh guards keep leaves and needles out for good. Installed by certified crews.", cta: "Buy & install \u00b7 $1,680", fin: "or $140/mo \u00b7 0% APR" },
      cats: [{ key: "protection", label: "Protection" }, { key: "ventilation", label: "Ventilation" }, { key: "materials", label: "Materials" }],
      products: [
        { cat: "protection", tag: "Protection", name: "Micro-Mesh Gutter Guard", blurb: "Keeps leaves out for good", price: "$86", priceNum: 86 },
        { cat: "protection", tag: "Protection", name: "Heated De-Icing Cable", blurb: "Stops ice dams at the eave", price: "$115", priceNum: 115 },
        { cat: "ventilation", tag: "Ventilation", name: "Ridge Vent Kit", blurb: "Cooler attic, longer shingle life", price: "$124", priceNum: 124 },
        { cat: "ventilation", tag: "Ventilation", name: "Solar Attic Fan", blurb: "Self-powered airflow", price: "$189", priceNum: 189 },
        { cat: "materials", tag: "Material", name: "Sealant Pro Pack", blurb: "Flash & seal small leaks", price: "$42", priceNum: 42 },
        { cat: "materials", tag: "Material", name: "Skylight Flashing Kit", blurb: "Fits most 60\u00d790 units", price: "$98", priceNum: 98 }
      ],
      reminder: { title: "Inspection due", desc: "Your annual roof inspection is due this month" },
      prop: { svc: "Roof Care & Snow Load", surfaces: ["Main Roof", "Garage Roof", "Flat Section", "Gutters", "Valleys"], months: "Nov\u2013Mar", unlimDesc: "Unlimited storm inspections and debris clearing.", colA: "Debris clearing", colB: "Snow removal", unitA: "/ clearing", unitB: "/ removal" }
    },
    "Pest Control": {
      slug: "pest", accent: "#7c3aed",
      hero: { badge: "\ud83d\udee1 Family & pet safe", title: "A pest-free home, guaranteed.", sub: "Inspection, treatment and prevention by licensed local techs. Free re-treatments between visits." },
      svc: [
        { name: "General Treatment", price: "$85", tagline: "Interior + perimeter", duration: "~45 min", includes: ["Licensed technician", "Family & pet safe products", "30-day re-treat guarantee"] },
        { name: "Rodent Control", price: "$140", tagline: "Trap, seal & monitor", duration: "~90 min", includes: ["Entry-point sealing", "Monitored bait stations", "Follow-up visit included"] },
        { name: "Termite Inspection", price: "$95", tagline: "Detect before damage", duration: "~60 min", includes: ["Moisture & wood probe", "Written risk report", "Treatment plan & pricing"] },
        { name: "Wasp Removal", price: "$120", tagline: "Same-day nest removal", duration: "~40 min", includes: ["Full nest removal", "Nest site treated", "Re-nest guarantee"] }
      ],
      orderNames: ["Interior treatment", "Perimeter Re-Treatment", "Quarterly treatment", "Rodent exclusion", "Termite inspection"],
      wt: { icon: "\ud83c\udf27\ufe0f", trigger: "Heavy rain \u2014 perimeter barrier re-treat due", past: "Rain 28 mm recorded \u2014 barrier re-applied", sla: "Re-treated within the 48-hour contracted window" },
      plan: { name: "Shield Plan", plusName: "Shield Plus", tag: "Best for a single home", desc: "Quarterly treatments, free re-visits.", headline: "Pricing that fits your home",
        features: ["4 quarterly treatments", "Free re-treats between visits", "\u201315% on exclusion work", "Report every visit"],
        plusFeatures: ["Monthly perimeter service", "Rodent monitoring included", "\u201325% on exclusion work", "24/7 urgent line"] },
      feat: { badge: "New \u00b7 App alerts", title: "Smart Rodent Sensors \u2014 know before you see", desc: "Connected sensors alert your technician automatically. Installed discreetly.", cta: "Buy & install \u00b7 $340", fin: "or $29/mo \u00b7 0% APR" },
      cats: [{ key: "barriers", label: "Barriers" }, { key: "traps", label: "Traps & bait" }, { key: "sensors", label: "Sensors" }],
      products: [
        { cat: "barriers", tag: "Barrier", name: "Perimeter Granules", blurb: "3-month outdoor barrier", price: "$34", priceNum: 34 },
        { cat: "barriers", tag: "Barrier", name: "Door Sweep Seal Kit", blurb: "Blocks entry gaps fast", price: "$28", priceNum: 28 },
        { cat: "traps", tag: "Bait", name: "Ant Bait Stations (8)", blurb: "Kills the colony, not just ants", price: "$22", priceNum: 22 },
        { cat: "traps", tag: "Trap", name: "Mosquito Trap Pro", blurb: "Covers a full backyard", price: "$119", priceNum: 119 },
        { cat: "sensors", tag: "Sensor", name: "Smart Rodent Sensor (2)", blurb: "App alert on first activity", price: "$89", priceNum: 89 },
        { cat: "sensors", tag: "Trap", name: "Pantry Moth Traps (6)", blurb: "Pheromone \u00b7 non-toxic", price: "$16", priceNum: 16 }
      ],
      reminder: { title: "Quarterly treatment due", desc: "Last perimeter treatment was 80 days ago" },
      prop: { svc: "Perimeter Protection Program", surfaces: ["Perimeter", "Foundation", "Lawn Zone", "Interior", "Crawl Space"], months: "Apr\u2013Aug", unlimDesc: "Unlimited re-treatments between scheduled visits.", colA: "Perimeter spray", colB: "Interior treatment", unitA: "/ spray", unitB: "/ treatment" }
    },
    "Health": {
      slug: "health", accent: "#0b7285",
      hero: { badge: "\u2695\ufe0f Licensed & background-checked", title: "Care at home, coordinated.", sub: "Home care visits, physio and nursing support by licensed providers. One schedule the whole family can follow \u2014 documents kept secure." },
      svc: [
        { name: "Home Care Visit", price: "$75", tagline: "Support at home, on schedule", duration: "~60 min", includes: ["The same care team every visit", "Visit summary in your portal", "Family can follow the schedule"] },
        { name: "Physio Session", price: "$95", tagline: "Mobility work at home", duration: "~60 min", includes: ["Licensed physiotherapist", "Plan milestones updated after each session", "Home exercise notes included"] },
        { name: "Nursing Visit", price: "$110", tagline: "In-home nursing support", duration: "~45 min", includes: ["Registered nurse", "Coordinated with your care plan", "Secure visit notes"] },
        { name: "Care Assessment", price: "Quote", tagline: "Care plan intake & setup", duration: "~90 min", includes: ["In-home intake assessment", "Personal care plan drafted", "Family walkthrough included"] }
      ],
      orderNames: ["Home care visit", "Physio session", "Nursing visit", "Care assessment", "Follow-up visit"],
      wt: null,
      plan: { name: "Care Plan", plusName: "Care Plus", tag: "Best for one household", desc: "A consistent care team, priority scheduling.", headline: "Pricing that fits your care",
        features: ["The same care team, visit to visit", "Priority scheduling", "Quarterly plan reviews", "Family access included"],
        plusFeatures: ["Weekly scheduled visits", "Same-week rescheduling", "Dedicated care coordinator", "24/7 phone line"] },
      feat: { badge: "New \u00b7 Fitted & installed", title: "Home Safety Rail Kit \u2014 steadier every day", desc: "Grab rails and threshold ramps, fitted by insured installers in one visit.", cta: "Buy & install \u00b7 $240", fin: "or $20/mo \u00b7 0% APR" },
      cats: [{ key: "safety", label: "Home safety" }, { key: "mobility", label: "Mobility" }, { key: "comfort", label: "Daily comfort" }],
      products: [
        { cat: "safety", tag: "Safety", name: "Grab Rail Set", blurb: "Bathroom & hallway \u00b7 installed", price: "$68", priceNum: 68 },
        { cat: "safety", tag: "Safety", name: "Non-Slip Mat Pack", blurb: "Bath, shower & entry", price: "$32", priceNum: 32 },
        { cat: "mobility", tag: "Mobility", name: "Folding Walker", blurb: "Light frame \u00b7 folds flat", price: "$129", priceNum: 129 },
        { cat: "mobility", tag: "Mobility", name: "Threshold Ramp", blurb: "Doorways up to 6 cm", price: "$84", priceNum: 84 },
        { cat: "comfort", tag: "Comfort", name: "Adjustable Bed Wedge", blurb: "Rest & reading support", price: "$59", priceNum: 59 },
        { cat: "comfort", tag: "Comfort", name: "Big-Button Phone", blurb: "Loud, simple, reliable", price: "$49", priceNum: 49 }
      ],
      reminder: { title: "Plan review due", desc: "Your quarterly care plan review is due this month" },
      prop: { svc: "Home Safety Program", surfaces: ["Bathroom", "Bedroom", "Hallway", "Kitchen", "Entry"], months: "Year-round", unlimDesc: "Scheduled visits plus unlimited plan adjustments.", colA: "Care visit", colB: "Physio session", unitA: "/ visit", unitB: "/ session" }
    },
    "Beauty": {
      slug: "beauty", accent: "#d6336c",
      hero: { badge: "\u2728 Vetted, licensed specialists", title: "Salon-level care, at your door.", sub: "Hair, nails and skin by vetted specialists \u2014 at home or in-studio. Formulas, shades and routine notes remembered visit to visit." },
      svc: [
        { name: "Hair Styling", price: "$65", tagline: "Cut, color & blowout", duration: "~75 min", includes: ["Licensed, vetted stylists", "Your color formulas saved", "Rebook the same specialist in a tap"] },
        { name: "Manicure & Nails", price: "$45", tagline: "Classic to gel, at home", duration: "~60 min", includes: ["Sanitised, sealed pro kit", "Gel, classic or press-on", "Shade saved to your profile"] },
        { name: "Facial Treatment", price: "$85", tagline: "A routine that carries over", duration: "~60 min", includes: ["Routine notes after every visit", "Products logged to your profile", "Sensitive-skin options"] },
        { name: "Event & Bridal Package", price: "Quote", tagline: "Trials, timeline, day-of team", duration: "custom", includes: ["Trial session included", "Day-of team scheduling", "One coordinator end-to-end"] }
      ],
      orderNames: ["Blowout & style", "Gel manicure", "Facial treatment", "Bridal trial", "Root touch-up"],
      wt: null,
      plan: { name: "Glow Plan", plusName: "Glow Plus", tag: "Best for a monthly routine", desc: "Member pricing, priority slots with your specialist.", headline: "Pricing that fits your routine",
        features: ["Member pricing on every visit", "Priority slots with your specialist", "1 style refresh a quarter", "Formulas & routine history saved"],
        plusFeatures: ["2 visits a month included", "Same-week rebooking guarantee", "\u201320% on all products", "Event styling priority"] },
      feat: { badge: "New \u00b7 Pro-grade", title: "Silk Repair Set \u2014 salon results between visits", desc: "The treatment line your stylist uses, sized for home.", cta: "Buy \u00b7 $64", fin: "or 4 \u00d7 $16 \u00b7 no fees" },
      cats: [{ key: "hair", label: "Hair care" }, { key: "nails", label: "Nails" }, { key: "skin", label: "Skin" }],
      products: [
        { code: "rtl-beauty-01", cat: "hair", tag: "Hair", name: "Silk Repair Set", blurb: "Post-color bond care", price: "$64", priceNum: 64 },
        { code: "rtl-beauty-02", cat: "hair", tag: "Hair", name: "Heat Shield Spray", blurb: "Before every hot tool", price: "$28", priceNum: 28 },
        { code: "rtl-beauty-03", cat: "nails", tag: "Nails", name: "Cuticle Care Kit", blurb: "Between-visit upkeep", price: "$22", priceNum: 22 },
        { code: "rtl-beauty-04", cat: "nails", tag: "Nails", name: "Gel Removal Kit", blurb: "Damage-free at home", price: "$18", priceNum: 18 },
        { code: "rtl-beauty-05", cat: "skin", tag: "Skin", name: "Hydration Serum", blurb: "Your specialist\u2019s pick", price: "$46", priceNum: 46 },
        { code: "rtl-beauty-06", cat: "skin", tag: "Skin", name: "Overnight Mask", blurb: "Twice-a-week routine", price: "$34", priceNum: 34 }
      ],
      reminder: { title: "Roots check-in", desc: "It has been 6 weeks since your last color visit" },
      prop: { svc: "Routine Membership", surfaces: ["Hair", "Nails", "Skin", "Massage", "Makeup"], months: "Year-round", unlimDesc: "Monthly routine visits plus member pricing on extras.", colA: "Styling", colB: "Treatment", unitA: "/ visit", unitB: "/ treatment" }
    }
  };

  /* ---------- Visit / order status meta -> StatusBadge variant ---------- */
  var statusMeta = {
    completed:  { label: "Completed",   badge: "status-badge--ok" },
    inprogress: { label: "In progress", badge: "status-badge--progress" },
    scheduled:  { label: "Scheduled",   badge: "status-badge--scheduled" },
    cancelled:  { label: "Cancelled",   badge: "status-badge--danger" }
  };

  /* Technician shown on visit detail (fixture) */
  var technician = { name: "Daniel R.", role: "Senior HVAC technician", rating: "4.9", visits: "320", eta: "~14 min" };

  /* ---------- Proposal per-site status meta ---------- */
  var pstatus = {
    approved: { label: "\u2713 Approved",        badge: "status-badge--ok",        dot: "#34c759" },
    revision: { label: "\u27f3 Revision pending", badge: "status-badge--warn",      dot: "#ff9f0a" },
    declined: { label: "\u2715 Declined",         badge: "status-badge--danger",    dot: "#ff3b30" },
    unseen:   { label: "\u25d4 Unseen",           badge: "status-badge--scheduled", dot: "#8a94a6" },
    viewed:   { label: "\u2022 Reviewing",        badge: "status-badge--scheduled", dot: "#8a94a6" }
  };

  /* ---------- Customer profile ---------- */
  var customer = {
    firstName: "Mara", greeting: "Good afternoon, Mara", subline: "One visit in progress \u00b7 next service in 2 days",
    fullName: "Mara Lindqvist", phone: "+1 (555) \u2022\u2022\u2022-7740", email: "mara@email.com",
    memberSince: "2023", stats: { orders: "12", spent: "$1,240", savings: "$186" }
  };

  var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  /* Activity feed (fixture; grouped, newest first) */
  function buildFeed(v) {
    var todayItems = v.wt ? [
      { type: "orders", title: "Weather Trigger \u2014 confirm your visit", desc: v.wt.trigger + " at Office \u00b7 respond by 8:00 PM today", time: "5:12 AM", dot: "#0e8fc4", iconBg: "rgba(14,143,196,.16)", action: "Review", act: "weather", unread: true }
    ] : [];
    todayItems = todayItems.concat([
        { type: "orders", title: "Daniel is on the way", desc: v.orderNames[0] + " \u00b7 arriving in ~14 min", time: "2:41 PM", dot: "var(--accent)", iconBg: "rgba(var(--accent-rgb),.14)", action: "Track", act: "orders", unread: true },
        { type: "orders", title: "Technician assigned", desc: "Daniel R. (\u2605 4.9) will handle your visit", time: "9:02 AM", dot: "var(--accent)", iconBg: "rgba(var(--accent-rgb),.14)", unread: true }
    ]);
    return [
      { day: "Today", items: todayItems },
      { day: "Yesterday", items: [
        { type: "billing", title: "Payment received", desc: "$480 \u00b7 " + v.orderNames[3] + " #SV-2381", time: "4:18 PM", dot: "#1f8a44", iconBg: "rgba(52,199,89,.16)", action: "View invoice", act: "invoice" },
        { type: "orders", title: "Service completed", desc: v.orderNames[3] + " finished \u2014 you rated it \u2605\u2605\u2605\u2605\u2605", time: "3:50 PM", dot: "#1f8a44", iconBg: "rgba(52,199,89,.16)" }
      ] },
      { day: "Earlier this week", items: [
        { type: "reminders", title: "Upcoming visit", desc: v.orderNames[2] + " is due Jan 30", time: "Mon", dot: "#ff8a3d", iconBg: "rgba(255,159,10,.16)", action: "Book now", act: "book" },
        { type: "billing", title: v.plan.name + " renewed", desc: "$9/mo \u00b7 saved you $42 this quarter", time: "Mon", dot: "#7a52e0", iconBg: "rgba(122,82,224,.16)" },
        { type: "reminders", title: v.reminder.title, desc: v.reminder.desc, time: "Sun", dot: "#ff8a3d", iconBg: "rgba(255,159,10,.16)", action: "Shop supplies", act: "products" }
      ] }
    ];
  }

  var feedTabs = [
    { key: "all", label: "All" }, { key: "orders", label: "Orders" },
    { key: "billing", label: "Billing" }, { key: "reminders", label: "Reminders" }
  ];

  /* Support */
  var initialMessages = [{ from: "agent", text: "Hi Mara, I'm Avery from support. How can I help today?" }];
  var quickReplies = ["Where's my technician?", "Reschedule a visit", "Billing question", "Talk to a human"];
  var helpTopics = [
    { label: "Track or contact my technician", dot: "var(--accent)", iconBg: "rgba(var(--accent-rgb),.14)", q: "Where's my technician?" },
    { label: "Reschedule or cancel a visit", dot: "#1f8a44", iconBg: "rgba(52,199,89,.16)", q: "I need to reschedule a visit" },
    { label: "Invoices & payments", dot: "#ff8a3d", iconBg: "rgba(255,159,10,.16)", q: "I have a billing question" },
    { label: "Report an issue after service", dot: "#7a52e0", iconBg: "rgba(122,82,224,.16)", q: "I want to report an issue" }
  ];
  function chatReply(text) {
    var t = (text || "").toLowerCase();
    if (/(where|track|technician|daniel|coming|arriv)/.test(t)) return "Daniel is about 14 minutes away \u2014 3 stops out. You can watch his live location in the Orders tab.";
    if (/(reschedul|move|change.*(time|date|visit)|cancel)/.test(t)) return "Sure \u2014 which visit would you like to move? You can also reschedule straight from the order details.";
    if (/(bill|invoice|charge|pay|refund|price)/.test(t)) return "Your last invoice #SV-2381 was $480, paid Jan 12. Want me to email you a copy?";
    if (/(human|agent|person|representative|specialist)/.test(t)) return "Connecting you with a specialist now \u2014 typical wait is under 2 minutes. Stay with me here.";
    if (/(filter|maintenance|repair|install)/.test(t)) return "Happy to help with that. Would you like me to book a visit, or check the status of an existing order?";
    return "Got it, thanks Mara. A support specialist will follow up shortly. Is there anything else I can help with?";
  }

  var addresses = [
    { id: "home",   label: "Home",   line: "1240 Pine Street, Apt 4B",   city: "Vancouver, BC V6E 1A5", dot: "var(--accent)", iconBg: "rgba(var(--accent-rgb),.14)" },
    { id: "office", label: "Office", line: "500 Granville St, Floor 12", city: "Vancouver, BC V6C 1W6", dot: "#1f8a44",       iconBg: "rgba(52,199,89,.16)" }
  ];

  var cards = [
    { id: "visa", brand: "Visa",       last4: "4242", exp: "08/27" },
    { id: "mc",   brand: "Mastercard", last4: "8810", exp: "11/26" }
  ];

  var proposal = { id: "PR-1043", sent: "Dec 28", validUntil: "Mar 31, 2026" };

  var proposalSites = [
    { id: "s1", addr: "2381 Argue St", city: "Port Coquitlam, BC", postal: "V3C 6P9", lot: "17,303", areas: [876, 1026, 1539, 1456, 861], status: "approved", selected: "898", x: 22, y: 30 },
    { id: "s2", addr: "2287 Argue St", city: "Port Coquitlam, BC", postal: "V3B 1A2", lot: "21,400", areas: [1180, 1320, 1980, 1820, 1100], status: "revision", selected: "898", x: 46, y: 22 },
    { id: "s3", addr: "1618 Schooner St", city: "Coquitlam, BC", postal: "V3K 4M1", lot: "14,900", areas: [760, 900, 1400, 1340, 800], status: "declined", selected: "898", x: 72, y: 34 },
    { id: "s4", addr: "1153 Knox Way", city: "Port Coquitlam, BC", postal: "V3C 0B5", lot: "48,200", areas: [5200, 3400, 7800, 5600, 2800], status: "unseen", selected: "898", x: 58, y: 74 }
  ];

  /* Surface rate table (per-visit $/sq ft) used to derive proposal
     pricing from Beam AI measured area. PRESENTATION reference only;
     Codex owns real quoting. Names come from the vertical's prop.surfaces. */
  var surfaceDefs = [
    { color: "#34c759", clear: 0.075, deice: 0.05 },
    { color: "#ffd60a", clear: 0.055, deice: 0.04 },
    { color: "#ff6b4a", clear: 0.045, deice: 0.03 },
    { color: "#2f7be0", clear: 0.05,  deice: 0.035 },
    { color: "#c77dff", clear: 0.045, deice: 0.03 }
  ];
  var MOB_CLEAR = 47, MOB_DEICE = 37;
  function planName(id) { return id === "898" ? "Seasonal Unlimited" : id === "899" ? "Season-Lock" : "Flex Service"; }

  /* ---------- Orders for a given vertical (fixture rows) ---------- */
  function ordersFor(themeName) {
    var v = themes[themeName] || themes["HVAC"];
    var A = ["var(--accent)", "rgba(var(--accent-rgb),.12)"];
    var G = ["#1f8a44", "rgba(52,199,89,.16)"];
    var O = ["#ff8a3d", "rgba(255,159,10,.16)"];
    var B = ["#0e8fc4", "rgba(14,143,196,.16)"];
    var n = v.orderNames;
    var auto = "If we don\u2019t hear back by the deadline, the visit proceeds automatically per your contract.";
    return [
      { id: "#SV-2402", name: n[0], date: "Today",    status: "inprogress", price: "$60",  dot: O[0], iconBg: O[1], locationId: "home",   y: 2026, m: 0, d: 15 },
      { id: "#SV-3312", name: n[1], date: "Tomorrow", status: "scheduled",  price: "$94",  dot: B[0], iconBg: B[1], locationId: "office", y: 2026, m: 0, d: 16,
        wt: v.wt ? { status: "pending", trigger: v.wt.trigger, detected: "Today \u00b7 5:10 AM", deadline: "Today \u00b7 8:00 PM", auto: auto } : undefined },
      { id: "#SV-2410", name: n[2], date: "Jan 30",   status: "scheduled",  price: "$120", dot: A[0], iconBg: A[1], locationId: "home",   y: 2026, m: 0, d: 30 },
      { id: "#SV-2381", name: n[3], date: "Jan 12",   status: "completed",  price: "$480", dot: G[0], iconBg: G[1], locationId: "home",   y: 2026, m: 0, d: 12, photos: true },
      { id: "#SV-3290", name: n[1], date: "Jan 5",    status: "completed",  price: "$94",  dot: B[0], iconBg: B[1], locationId: "office", y: 2026, m: 0, d: 5,  photos: true,
        wt: v.wt ? { status: "auto", trigger: v.wt.past, detected: "Jan 5 \u00b7 4:46 AM", deadline: "Jan 5 \u00b7 7:00 AM", sla: v.wt.sla } : undefined },
      { id: "#SV-2356", name: n[4], date: "Oct 24",   status: "completed",  price: "$45",  dot: G[0], iconBg: G[1], locationId: "office", y: 2025, m: 9, d: 24 }
    ];
  }

  /* Weather-operational calendar (stormOps). Derives service names +
     trigger copy from the active vertical so it fits all 5 verticals. */
  function stormCalendar(themeName) {
    var v = themes[themeName];
    if (!v) throw new Error("Unknown calendar theme: " + themeName);
    if (!v.wt) return null;
    var s0 = v.svc[0].name, s1 = v.svc[1].name;
    return {
      contract: { rule: "Auto-dispatch by weather trigger", note: v.wt.sla },
      accessNotes: [
        { label: "Gate code", value: "4417" },
        { label: "Driveway", value: "Do not block \u2014 car parked on the left" },
        { label: "Sundays", value: "Do not service" }
      ],
      days: [
        { date: "Mon", dateSub: "Jan 12", weather: { state: "served", label: v.wt.past, temp: "\u22124\u00b0C" }, events: [
          { type: s0, status: "completed", time: "7:38 AM", photos: true },
          { type: s1, status: "completed", time: "8:51 AM" }
        ] },
        { date: "Wed", dateSub: "Jan 14", weather: { state: "clear", label: "Clear \u00b7 below service trigger", temp: "\u22121\u00b0C" }, events: [
          { type: s0, status: "skipped", note: "Below trigger \u2014 visit not required" }
        ] },
        { date: "Today", dateSub: "Jan 15", today: true, weather: { state: "watch", label: "Storm watch \u2014 service likely tonight", temp: "\u22126\u00b0C" }, events: [
          { type: s0, status: "onroute", time: "ETA 2:40 PM", tech: "Daniel R." }
        ] },
        { date: "Thu", dateSub: "Jan 16", needsAccess: true, weather: { state: "expected", label: v.wt.trigger, temp: "\u22128\u00b0C" }, events: [
          { type: s0, status: "scheduled", trigger: true },
          { type: s1, status: "scheduled", trigger: true }
        ] },
        { date: "Sat", dateSub: "Jan 18", weather: { state: "expected", label: "Weather trigger possible", temp: "\u22123\u00b0C" }, events: [
          { type: s1, status: "delayed", note: "Rescheduled from Fri \u2014 crew capacity" }
        ] }
      ]
    };
  }

  var spa = {
    brand: "Calm Harbor Spa",
    /* long-name / long-label review scenario (dev toolbar "name") */
    longCustomer: { first: "Anna-Katarina", greeting: "Good afternoon, Anna-Katarina", fullName: "Anna-Katarina Villanueva-\u00d6str\u00f6m" },
    /* CURRENT STAGING — read-only Core Order rows. ONLY the normalized safe
       fields the staging adapter proves: order type label/code, reference,
       raw status, displayed total, currency. NO date/time, specialist,
       location, tracking or invoice fields exist here, and the raw status
       (e.g. OPEN) is NEVER translated into a customer status. */
    stagingOrders: [
      { ref: "ORD-10318", typeLabel: "Service order", typeCode: "SPA_SERVICE", status: "OPEN", total: "$85.00", currency: "USD" },
      { ref: "ORD-10292", typeLabel: "Retail order", typeCode: "SPA_RETAIL", status: "OPEN", total: "$64.00", currency: "USD" },
      { ref: "ORD-10241-PKG-TRANSFER", typeLabel: "Prepaid treatment package \u2014 six-session series transfer", typeCode: "SPA_SERVICE_PACKAGE_PREPAID", status: "AWAITING_SETTLEMENT_REVIEW", total: "$510.00", currency: "USD" },
      { ref: "ORD-10186", typeLabel: "Service order", typeCode: "SPA_SERVICE", status: "CLOSED", total: "$45.00", currency: "USD" }
    ],
    /* Public Core PIM rows (mirrors the accepted wave-12 pim.pricing demo).
       displayPrice renders VERBATIM; no availability, duration, savings or
       eligibility may be inferred. SPA_MEMBERSHIP rows are public offers. */
    pim: {
      services: [
        { code: "svc-spa-01", "class": "SPA_SERVICE", name: "Manicure & nails", displayPrice: "$45", interval: "visit", shortDescription: "Classic to gel \u2014 sanitised, sealed kit" },
        { code: "svc-spa-02", "class": "SPA_SERVICE", name: "Hair styling", displayPrice: "$65", interval: "visit", shortDescription: "Cut, color & blowout \u2014 formulas saved" },
        { code: "svc-spa-03", "class": "SPA_SERVICE", name: "Facial treatment", displayPrice: "$85", interval: "visit", shortDescription: "A routine that carries over visit to visit" },
        { code: "svc-spa-04", "class": "SPA_SERVICE", name: "Event & bridal package", displayPrice: "Quote", interval: null, shortDescription: "Trials, timeline and a day-of team" }
      ],
      memberships: [
        { code: "mem-spa-01", "class": "SPA_MEMBERSHIP", name: "Harbor membership", displayPrice: "$129", interval: "month", shortDescription: "Member pricing on every treatment" }
      ]
    },
    /* TARGET terminology + approved-mapping PLACEHOLDER: these customer status
       labels stand in for a BACKEND-OWNED mapping that must exist before
       production renders them. They are never derived from raw Core statuses. */
    modeLabels: { salon: "At Calm Harbor", home: "At your place" },
    statusBadges: { "Confirmed": "status-badge--ok", "Needs confirmation": "status-badge--warn", "Completed": "status-badge--ok", "Cancelled": "status-badge--danger" },
    /* TARGET APPOINTMENTS — capability-gated fixtures (target-appointments only).
       Stable entity ids appt-ch-*; the reference is secondary detail, never the
       card headline. `minimal` demonstrates missing OPTIONAL specialist and
       location-detail fields. */
    appointments: {
      tzNote: "local time",
      nextVariants: {
        salon:   { id: "appt-ch-10318", service: "Facial treatment", specialist: "Alina V.", date: "Tue, Jul 21", time: "2:00\u20133:00 PM", mode: "salon", location: "Harbor Front studio \u00b7 Room 2", status: "Confirmed", price: "$85", ref: "APT-10318" },
        home:    { id: "appt-ch-10322", service: "Gel manicure", specialist: "Dana P.", date: "Wed, Jul 22", time: "11:00 AM\u201312:00 PM", mode: "home", location: "Address on file", status: "Confirmed", price: "$45", ref: "APT-10322" },
        long:    { id: "appt-ch-10330", service: "Signature deep-renewal ritual with warm-stone massage and extended aromatherapy", specialist: "Alexandra-Marguerite Konstantinidou-Vandermeer", date: "Thu, Jul 30", time: "1:00\u20133:30 PM", mode: "salon", location: "Harbor Front studio \u00b7 Quiet wing, Room 5", status: "Needs confirmation", price: "$310", ref: "APT-10330-SIGNATURE-RITUAL" },
        minimal: { id: "appt-ch-10334", service: "Facial treatment", specialist: null, date: "Fri, Jul 24", time: "4:00 PM", mode: "salon", location: null, status: "Confirmed", price: null, ref: "APT-10334" }
      },
      upcoming: [
        { id: "appt-ch-10340", service: "Hair styling", specialist: "Alina V.", date: "Aug 4", time: "2:00 PM", mode: "salon", location: "Harbor Front studio", status: "Confirmed", price: "$65", ref: "APT-10340" },
        { id: "appt-ch-10351", service: "Manicure & nails", specialist: null, date: "Aug 14", time: "11:00 AM", mode: "home", location: "Address on file", status: "Needs confirmation", price: "$45", ref: "APT-10351" }
      ],
      past: [
        { id: "appt-ch-10203", service: "Facial treatment", specialist: "Alina V.", date: "Jun 30", mode: "salon", status: "Completed", price: "$85", ref: "APT-10203" },
        { id: "appt-ch-10164", service: "Gel manicure", specialist: "Dana P.", date: "Jun 12", mode: "home", status: "Completed", price: "$45", ref: "APT-10164" },
        { id: "appt-ch-10101", service: "Hair styling", specialist: "Alina V.", date: "May 28", mode: "salon", status: "Cancelled", price: null, ref: "APT-10101" }
      ]
    }
  };

  /* ============================================================
     WAVE 15 — Calm Harbor commercial lifecycle (Beauty).
     Customer READ MODELS from the product contract: purchases,
     purchase detail, plans, sellable retail, server cart, simulated
     checkout. Every money/status field is a DISPLAY-READY string
     owned by the (demo) server — presentation renders it VERBATIM
     and never calculates savings, tax, balance, deadlines or
     eligibility. paymentMode is always "SIMULATED": nothing here is,
     or may look like, a real financial event. Opaque `ref` values
     (pur-*, pln-*, plan-*, cln-*, chk-*) are stable non-sequential
     handles — never raw Core ids.
     ============================================================ */
  var spaCommerce = {
    /* Account overview entries. `availability` is decided by the PAGE from
       capability config — this is only the customer-safe copy per state. */
    accountEntries: [
      { key: "purchases", route: "purchases.list", action: "account.openPurchases", title: "Purchases",
        desc: "Everything you\u2019ve ordered \u2014 services, shop items and plans, with their current state.",
        unavailableDesc: "Purchase history with customer statuses isn\u2019t available on this portal yet. Your raw order records are on the Orders page." },
      { key: "plan", route: "plan", action: "account.openPlan", title: "My plan",
        desc: "Your packages and membership \u2014 remaining visits, renewal and valid actions.",
        unavailableDesc: "Plan and membership balances aren\u2019t connected yet. Published membership options are in Services & prices." },
      { key: "profile", route: "profile", action: "account.openProfile", title: "Profile",
        desc: "Your contact details and preferences.",
        unavailableDesc: "Profile editing isn\u2019t connected yet \u2014 our team can update your details for you." },
      { key: "support", route: null, action: "support.open", title: "Support",
        desc: "Get help with a visit, an order or your plan.",
        unavailableDesc: "A support destination hasn\u2019t been set up for this portal yet." }
    ],
    /* ---- Purchases (customer-safe Order read model) ---- */
    purchases: {
      filters: [{ key: "all", label: "All" }, { key: "services", label: "Services" }, { key: "shop", label: "Shop" }, { key: "plans", label: "Plans" }],
      kindFilter: { services: ["SERVICE", "MIXED"], shop: ["RETAIL", "MIXED"], plans: ["PACKAGE", "MEMBERSHIP"] },
      kindLabels: { SERVICE: "Service", RETAIL: "Shop", PACKAGE: "Plan", MEMBERSHIP: "Plan", MIXED: "Service + shop" },
      /* approved contract vocabulary — a BACKEND-OWNED mapping, never derived
         from raw workflow states in the browser */
      statusBadges: { "Confirmed": "status-badge--ok", "In progress": "status-badge--scheduled", "Ready for pickup": "status-badge--warn", "Fulfilled": "status-badge--ok", "Cancelled": "status-badge--danger" },
      list: [
        { ref: "pur-9f27a1", reference: "CH-2417", kind: "SERVICE", customerStatus: "Confirmed", placedAt: "Jul 12, 2026", displayTotal: "$85.00", currency: "USD", itemSummary: "Facial treatment \u00b7 books your Jul 21 visit", attention: null },
        { ref: "pur-52e88d", reference: "CH-2409", kind: "RETAIL", customerStatus: "Ready for pickup", placedAt: "Jul 8, 2026", displayTotal: "$88.56", currency: "USD", itemSummary: "2 shop items \u00b7 pickup", attention: "Ready \u2014 please pick up by Jul 22" },
        { ref: "pur-3d76c2", reference: "CH-2371", kind: "MIXED", customerStatus: "In progress", placedAt: "Jun 28, 2026", displayTotal: "$131.40", currency: "USD", itemSummary: "Gel manicure + 2 shop items", attention: null },
        { ref: "pur-b104fe", reference: "CH-2350", kind: "PACKAGE", customerStatus: "Fulfilled", placedAt: "Jun 14, 2026", displayTotal: "$510.00", currency: "USD", itemSummary: "Six-visit facial series", attention: null },
        { ref: "pur-64c913", reference: "CH-2334", kind: "RETAIL", customerStatus: "Fulfilled", placedAt: "Jun 2, 2026", displayTotal: "$73.44", currency: "USD", itemSummary: "2 shop items \u00b7 picked up Jun 4", attention: null },
        { ref: "pur-1a45e0", reference: "CH-2242", kind: "MEMBERSHIP", customerStatus: "Confirmed", placedAt: "May 1, 2026", displayTotal: "$129.00", currency: "USD", itemSummary: "Harbor membership \u00b7 monthly", attention: null }
      ],
      /* cursor page 2 — appended below already-rendered rows, never replacing them */
      nextPage: [
        { ref: "pur-77d20b", reference: "CH-2168", kind: "SERVICE", customerStatus: "Fulfilled", placedAt: "Apr 2, 2026", displayTotal: "$65.00", currency: "USD", itemSummary: "Hair styling", attention: null },
        { ref: "pur-08c5b7", reference: "CH-2104", kind: "RETAIL", customerStatus: "Cancelled", placedAt: "Mar 19, 2026", displayTotal: "$28.00", currency: "USD", itemSummary: "1 shop item", attention: null }
      ]
    },
    /* ---- Purchase detail read models (keyed by opaque ref).
       Sections that are absent here are OMITTED by the page — never filled
       with guessed facts. `groups` exists only where the source groups lines. ---- */
    purchaseDetails: {
      "pur-9f27a1": {
        ref: "pur-9f27a1", reference: "CH-2417", kind: "SERVICE", customerStatus: "Confirmed", placedAt: "Jul 12, 2026", version: "v2",
        lines: [{ ref: "pln-4ac1", kind: "SERVICE", title: "Facial treatment", variant: null, quantity: 1, displayUnitPrice: "$85.00", displayTotal: "$85.00" }],
        money: { subtotal: "$85.00", tax: "$0.00", total: "$85.00", currency: "USD" }, paymentMode: "SIMULATED",
        fulfillment: null,
        relatedAppointments: [{ ref: "appt-ch-10318", service: "Facial treatment", start: "Tue, Jul 21 \u00b7 2:00\u20133:00 PM", customerStatus: "Confirmed" }],
        relatedPlan: null, allowedActions: ["openAppointment"]
      },
      "pur-52e88d": {
        ref: "pur-52e88d", reference: "CH-2409", kind: "RETAIL", customerStatus: "Ready for pickup", placedAt: "Jul 8, 2026", version: "v3",
        lines: [
          { ref: "pln-b210", kind: "RETAIL", title: "Silk Repair Set", variant: null, quantity: 1, displayUnitPrice: "$64.00", displayTotal: "$64.00" },
          { ref: "pln-b211", kind: "RETAIL", title: "Gel Removal Kit", variant: null, quantity: 1, displayUnitPrice: "$18.00", displayTotal: "$18.00" }
        ],
        money: { subtotal: "$82.00", tax: "$6.56", total: "$88.56", currency: "USD" }, paymentMode: "SIMULATED",
        fulfillment: { kind: "PICKUP", status: "Ready for pickup", pickupWindow: "Until Jul 22 \u00b7 10:00 AM\u20136:00 PM", note: "Harbor Front studio front desk" },
        relatedAppointments: [], relatedPlan: null, allowedActions: ["cancelRequest"]
      },
      "pur-3d76c2": {
        ref: "pur-3d76c2", reference: "CH-2371", kind: "MIXED", customerStatus: "In progress", placedAt: "Jun 28, 2026", version: "v5",
        groups: [{ label: "Service", lines: ["pln-c310"] }, { label: "Pickup items", lines: ["pln-c311", "pln-c312"] }],
        lines: [
          { ref: "pln-c310", kind: "SERVICE", title: "Gel manicure", variant: null, quantity: 1, displayUnitPrice: "$45.00", displayTotal: "$45.00" },
          { ref: "pln-c311", kind: "RETAIL", title: "Hydration Serum", variant: null, quantity: 1, displayUnitPrice: "$46.00", displayTotal: "$46.00" },
          { ref: "pln-c312", kind: "RETAIL", title: "Overnight Mask", variant: null, quantity: 1, displayUnitPrice: "$34.00", displayTotal: "$34.00" }
        ],
        money: { subtotal: "$125.00", tax: "$6.40", total: "$131.40", currency: "USD" }, paymentMode: "SIMULATED",
        fulfillment: { kind: "PICKUP", status: "Being prepared", pickupWindow: null, note: "We\u2019ll let you know when your items are ready" },
        relatedAppointments: [{ ref: "appt-ch-10322", service: "Gel manicure", start: "Wed, Jul 22 \u00b7 11:00 AM\u201312:00 PM", customerStatus: "Confirmed" }],
        relatedPlan: null, allowedActions: ["openAppointment"]
      },
      "pur-b104fe": {
        ref: "pur-b104fe", reference: "CH-2350", kind: "PACKAGE", customerStatus: "Fulfilled", placedAt: "Jun 14, 2026", version: "v1",
        lines: [{ ref: "pln-d410", kind: "PLAN", title: "Six-visit facial series", variant: null, quantity: 1, displayUnitPrice: "$510.00", displayTotal: "$510.00" }],
        money: { subtotal: "$510.00", tax: "$0.00", total: "$510.00", currency: "USD" }, paymentMode: "SIMULATED",
        fulfillment: { kind: "ENTITLEMENT", status: "Credits granted", pickupWindow: null, note: "Visit credits were added to your plan" },
        relatedAppointments: [], relatedPlan: { ref: "plan-4e19c3", kind: "PACKAGE", status: "Active", title: "Six-visit facial series" },
        allowedActions: ["buyAgain"]
      },
      "pur-64c913": {
        ref: "pur-64c913", reference: "CH-2334", kind: "RETAIL", customerStatus: "Fulfilled", placedAt: "Jun 2, 2026", version: "v4",
        lines: [
          { ref: "pln-e510", kind: "RETAIL", title: "Hydration Serum", variant: null, quantity: 1, displayUnitPrice: "$46.00", displayTotal: "$46.00", returnable: true },
          { ref: "pln-e511", kind: "RETAIL", title: "Cuticle Care Kit", variant: null, quantity: 1, displayUnitPrice: "$22.00", displayTotal: "$22.00", returnable: true }
        ],
        money: { subtotal: "$68.00", tax: "$5.44", total: "$73.44", currency: "USD" }, paymentMode: "SIMULATED",
        fulfillment: { kind: "PICKUP", status: "Picked up Jun 4", pickupWindow: null, note: null },
        relatedAppointments: [], relatedPlan: null, allowedActions: ["returnRequest", "buyAgain"]
      },
      "pur-1a45e0": {
        ref: "pur-1a45e0", reference: "CH-2242", kind: "MEMBERSHIP", customerStatus: "Confirmed", placedAt: "May 1, 2026", version: "v1",
        lines: [{ ref: "pln-f610", kind: "PLAN", title: "Harbor membership", variant: "Monthly", quantity: 1, displayUnitPrice: "$129.00", displayTotal: "$129.00" }],
        money: { subtotal: "$129.00", tax: "$0.00", total: "$129.00", currency: "USD" }, paymentMode: "SIMULATED",
        fulfillment: { kind: "ENTITLEMENT", status: "Membership active", pickupWindow: null, note: "Renews monthly \u2014 manage it under My plan" },
        relatedAppointments: [], relatedPlan: { ref: "plan-8b02d7", kind: "MEMBERSHIP", status: "Active", title: "Harbor membership" },
        allowedActions: []
      },
      "pur-77d20b": {
        ref: "pur-77d20b", reference: "CH-2168", kind: "SERVICE", customerStatus: "Fulfilled", placedAt: "Apr 2, 2026", version: "v2",
        lines: [{ ref: "pln-g710", kind: "SERVICE", title: "Hair styling", variant: null, quantity: 1, displayUnitPrice: "$65.00", displayTotal: "$65.00" }],
        money: { subtotal: "$65.00", tax: "$0.00", total: "$65.00", currency: "USD" }, paymentMode: "SIMULATED",
        fulfillment: null,
        relatedAppointments: [{ ref: "appt-ch-10203", service: "Facial treatment", start: "Jun 30", customerStatus: "Completed" }],
        relatedPlan: null, allowedActions: []
      },
      "pur-08c5b7": {
        ref: "pur-08c5b7", reference: "CH-2104", kind: "RETAIL", customerStatus: "Cancelled", placedAt: "Mar 19, 2026", version: "v2",
        lines: [{ ref: "pln-h810", kind: "RETAIL", title: "Heat Shield Spray", variant: "150 ml", quantity: 1, displayUnitPrice: "$28.00", displayTotal: "$28.00" }],
        money: { subtotal: "$28.00", tax: "$2.24", total: "$30.24", currency: "USD" }, paymentMode: "SIMULATED",
        fulfillment: { kind: "PICKUP", status: "Cancelled before pickup", pickupWindow: null, note: null },
        relatedAppointments: [], relatedPlan: null, allowedActions: ["buyAgain"]
      }
    },
    /* appointment detail -> its purchase (deep link, target only) */
    purchaseByAppointment: { "appt-ch-10318": "pur-9f27a1", "appt-ch-10322": "pur-3d76c2" },
    /* ============ WAVE 16 — Appointment detail read models ============
       Keyed by opaque ref (data-appointment-ref). ONLY source-provided
       fields exist here; absent optional fields are omitted by the page,
       never guessed. `attention` and the policy copy are SERVER-OWNED
       strings; `allowedActions` is the server's capability list — the page
       renders exactly those actions and derives none. A ref that is not in
       this map (foreign / removed / unknown) gets ONE non-enumerating
       not-found treatment. */
    appointmentDetails: {
      "appt-ch-10318": { ref: "appt-ch-10318", service: "Facial treatment", customerStatus: "Confirmed", start: "Tue, Jul 21 \u00b7 2:00\u20133:00 PM", timezoneNote: "local time", specialist: "Alina V.", visitMode: "salon", location: "Harbor Front studio \u00b7 Room 2", displayPrice: "$85", reference: "APT-10318", attention: "Free rescheduling and cancellation for this visit until Jul 20, 6:00 PM \u2014 after that the studio\u2019s policy applies.", relatedPurchaseRef: "pur-9f27a1", allowedActions: ["reschedule", "cancel", "openPurchase"], version: "a3" },
      "appt-ch-10322": { ref: "appt-ch-10322", service: "Gel manicure", customerStatus: "Confirmed", start: "Wed, Jul 22 \u00b7 11:00 AM\u201312:00 PM", timezoneNote: "local time", specialist: "Dana P.", visitMode: "home", location: "Address on file", displayPrice: "$45", reference: "APT-10322", attention: "Your specialist brings a sanitised, sealed kit \u2014 just have a clear table spot ready.", relatedPurchaseRef: "pur-3d76c2", allowedActions: ["reschedule", "cancel", "openPurchase"], version: "a1" },
      "appt-ch-10334": { ref: "appt-ch-10334", service: "Facial treatment", customerStatus: "Confirmed", start: "Fri, Jul 24 \u00b7 4:00 PM", timezoneNote: "local time", specialist: null, visitMode: "salon", location: null, displayPrice: null, reference: "APT-10334", attention: null, relatedPurchaseRef: null, allowedActions: ["cancel"], version: "a1" },
      "appt-ch-10330": { ref: "appt-ch-10330", service: "Signature deep-renewal ritual with warm-stone massage and extended aromatherapy", customerStatus: "Needs confirmation", start: "Thu, Jul 30 \u00b7 1:00\u20133:30 PM", timezoneNote: "local time", specialist: "Alexandra-Marguerite Konstantinidou-Vandermeer", visitMode: "salon", location: "Harbor Front studio \u00b7 Quiet wing, Room 5", displayPrice: "$310", reference: "APT-10330-SIGNATURE-RITUAL", attention: "The studio still needs to confirm this time \u2014 you\u2019ll hear from us within a day. Nothing is charged either way.", relatedPurchaseRef: null, allowedActions: ["reschedule", "cancel"], version: "a1" },
      "appt-ch-10340": { ref: "appt-ch-10340", service: "Hair styling", customerStatus: "Confirmed", start: "Tue, Aug 4 \u00b7 2:00 PM", timezoneNote: "local time", specialist: "Alina V.", visitMode: "salon", location: "Harbor Front studio", displayPrice: "$65", reference: "APT-10340", attention: null, relatedPurchaseRef: null, allowedActions: ["reschedule", "cancel"], version: "a2" },
      "appt-ch-10351": { ref: "appt-ch-10351", service: "Manicure & nails", customerStatus: "Needs confirmation", start: "Fri, Aug 14 \u00b7 11:00 AM", timezoneNote: "local time", specialist: null, visitMode: "home", location: "Address on file", displayPrice: "$45", reference: "APT-10351", attention: "The studio still needs to confirm this time \u2014 you\u2019ll hear from us within a day. Nothing is charged either way.", relatedPurchaseRef: null, allowedActions: ["cancel"], version: "a1" },
      "appt-ch-10203": { ref: "appt-ch-10203", service: "Facial treatment", customerStatus: "Completed", start: "Tue, Jun 30 \u00b7 2:00 PM", timezoneNote: "local time", specialist: "Alina V.", visitMode: "salon", location: "Harbor Front studio", displayPrice: "$85", reference: "APT-10203", attention: null, relatedPurchaseRef: null, allowedActions: ["bookAgain"], version: "a4" },
      "appt-ch-10164": { ref: "appt-ch-10164", service: "Gel manicure", customerStatus: "Completed", start: "Fri, Jun 12 \u00b7 11:00 AM", timezoneNote: "local time", specialist: "Dana P.", visitMode: "home", location: "Address on file", displayPrice: "$45", reference: "APT-10164", attention: null, relatedPurchaseRef: null, allowedActions: ["bookAgain"], version: "a2" },
      "appt-ch-10101": { ref: "appt-ch-10101", service: "Hair styling", customerStatus: "Cancelled", start: "Thu, May 28 \u00b7 3:00 PM", timezoneNote: "local time", specialist: "Alina V.", visitMode: "salon", location: "Harbor Front studio", displayPrice: null, reference: "APT-10101", attention: "This visit was cancelled \u2014 nothing further is scheduled from it.", relatedPurchaseRef: null, allowedActions: ["bookAgain"], version: "a2" }
    },
    /* ============ WAVE 16 — Published plan offers (sellable contract) ====
       PUBLIC catalog offers — visually and semantically distinct from the
       customer's My plan. Only server-provided display price, terms summary,
       benefits and sellability render; the buy entry exists ONLY while the
       sellable-plan contract is open (data-plan-commerce="open") AND the
       offer's sellability is "sellable". */
    planOffers: [
      { ref: "off-pkg-4c21", kind: "PACKAGE", title: "Six-visit facial series", displayPrice: "$510.00", termsSummary: "6 facial visits \u00b7 valid 12 months from purchase", benefits: ["Six full facial treatments", "Book each visit with a credit", "Credits never expire early"], sellability: "sellable", allowedActions: ["purchase"] },
      { ref: "off-mem-8d02", kind: "MEMBERSHIP", title: "Harbor membership", displayPrice: "$129.00 / month", termsSummary: "Renews monthly \u00b7 cancel renewal anytime", benefits: ["Member pricing on every treatment", "Priority booking windows", "One guest pass per season"], sellability: "sellable", allowedActions: ["purchase"] }
    ],
    offerNotes: {
      unavailable: "Not available to buy right now \u2014 the published offer is shown for reference only.",
      changed: "The price or terms of this offer changed while you were looking \u2014 reload to see the current offer before buying."
    },
    /* ---- My plan (customer-scoped entitlements — NEVER the public
       "Membership options" offers) ---- */
    plans: {
      statusBadges: { "Active": "status-badge--ok", "Expiring soon": "status-badge--warn", "Used up": "status-badge--neutral", "Cancelled": "status-badge--danger" },
      scenarios: { active: ["plan-4e19c3", "plan-8b02d7"], expiring: ["plan-ex91b4", "plan-8b02d7"], exhausted: ["plan-x201aa"], cancelled: ["plan-c77f02"], empty: [] },
      byRef: {
        "plan-4e19c3": { ref: "plan-4e19c3", kind: "PACKAGE", title: "Six-visit facial series", status: "Active", remainingUses: 4, totalUses: 6, expiresAt: "Dec 31, 2026", displayRecurringPrice: null, allowedActions: ["bookWithCredit"], sourcePurchase: "pur-b104fe" },
        "plan-8b02d7": { ref: "plan-8b02d7", kind: "MEMBERSHIP", title: "Harbor membership", status: "Active", remainingUses: null, totalUses: null, renewsAt: "Aug 1, 2026", displayRecurringPrice: "$129 / month", allowedActions: ["cancelRenewal"], sourcePurchase: "pur-1a45e0" },
        "plan-ex91b4": { ref: "plan-ex91b4", kind: "PACKAGE", title: "Six-visit facial series", status: "Expiring soon", remainingUses: 2, totalUses: 6, expiresAt: "Jul 31, 2026", attention: "2 visits left \u2014 they expire Jul 31", displayRecurringPrice: null, allowedActions: ["bookWithCredit"] },
        "plan-x201aa": { ref: "plan-x201aa", kind: "PACKAGE", title: "Six-visit facial series", status: "Used up", remainingUses: 0, totalUses: 6, expiresAt: "Dec 31, 2026", displayRecurringPrice: null, allowedActions: [] },
        "plan-c77f02": { ref: "plan-c77f02", kind: "MEMBERSHIP", title: "Harbor membership", status: "Cancelled", expiresAt: "Jul 31, 2026", note: "Your benefits continue to the end of the paid period.", displayRecurringPrice: "$129 / month", allowedActions: [] }
      }
    },
    /* ---- Sellable retail (capability retail-commerce-open). Joined to the
       public PIM card by `code`; `state` is SERVER sellability, never inferred. ---- */
    retail: {
      products: [
        { code: "rtl-beauty-01", state: "sellable", cents: 6400, displayPrice: "$64.00" },
        { code: "rtl-beauty-02", state: "variant-required", variants: [
          { ref: "var-hs-150", label: "150 ml", displayPrice: "$28.00", cents: 2800 },
          { ref: "var-hs-250", label: "250 ml", displayPrice: "$42.00", cents: 4200 }
        ] },
        { code: "rtl-beauty-03", state: "out-of-stock" },
        { code: "rtl-beauty-04", state: "sellable", cents: 1800, displayPrice: "$18.00" },
        { code: "rtl-beauty-05", state: "price-changed", cents: 5200, displayPrice: "$52.00", priceNote: "Price recently updated in the catalog" },
        { code: "rtl-beauty-06", state: "unavailable", note: "Not sold online" }
      ]
    },
    /* ---- Simulated checkout scaffolding ---- */
    checkout: {
      ref: "chk-5b8d31",
      expiresNote: "This quote holds for 15 minutes \u2014 prices and stock are re-checked at confirmation.",
      fulfillmentOptions: [
        { ref: "ful-pickup", kind: "PICKUP", label: "Pickup \u2014 Harbor Front studio", detail: "Usually ready in 2 days \u00b7 free" }
      ],
      fulfillmentNote: "Delivery isn\u2019t offered on this portal yet \u2014 pickup only.",
      policy: "I understand pickup orders are held for 14 days and services follow the studio\u2019s cancellation policy.",
      /* the plan-enrollment checkout source (a frozen server quote).
         WAVE 16: one quote per published offer ref (source `plan` carries
         data-plan-offer-ref); planQuote stays as the package default. */
      planQuote: {
        lines: [{ ref: "cln-pl01", title: "Six-visit facial series", variant: null, qty: 1, displayUnitPrice: "$510.00", displayTotal: "$510.00" }],
        displayTotals: { subtotal: "$510.00", tax: "$0.00", total: "$510.00" }
      },
      planQuotes: {
        "off-pkg-4c21": {
          lines: [{ ref: "cln-pl01", title: "Six-visit facial series", variant: null, qty: 1, displayUnitPrice: "$510.00", displayTotal: "$510.00" }],
          displayTotals: { subtotal: "$510.00", tax: "$0.00", total: "$510.00" }, recurringNote: null
        },
        "off-mem-8d02": {
          lines: [{ ref: "cln-pl02", title: "Harbor membership", variant: "Monthly", qty: 1, displayUnitPrice: "$129.00", displayTotal: "$129.00" }],
          displayTotals: { subtotal: "$129.00", tax: "$0.00", total: "$129.00" },
          recurringNote: "Renews at $129.00 / month until you cancel renewal \u2014 each renewal is recorded the same simulated way."
        }
      }
    },
    /* ---- Authoritative confirmation READBACKS (demo). The confirmation
       surface renders ONLY from one of these. Copy is contract-approved:
       "Order confirmed" / "Booking confirmed" / "Demo checkout completed" —
       never "Paid", "Charged" or "Payment successful". ---- */
    confirmations: {
      retail: { kind: "retail", headline: "Order confirmed", sub: "Demo checkout completed \u2014 no charge was made.",
        purchase: { ref: "pur-n3w001", reference: "CH-2431" },
        fulfillment: "Pickup \u2014 Harbor Front studio. We\u2019ll let you know when your items are ready.",
        appointment: null, plan: null },
      "appointment-and-order": { kind: "booking", headline: "Booking confirmed", sub: "Demo checkout completed \u2014 no charge was made.",
        purchase: { ref: "pur-n3w002", reference: "CH-2432" },
        appointment: { ref: "appt-ch-10360", service: "Facial treatment", start: "Tue, Jul 28 \u00b7 2:00 PM", customerStatus: "Confirmed" },
        fulfillment: null, plan: null },
      "appointment-only": { kind: "booking", headline: "Booking confirmed", sub: "No charge was made \u2014 you pay at the studio as usual.",
        purchase: null,
        appointment: { ref: "appt-ch-10361", service: "Facial treatment", start: "Tue, Jul 28 \u00b7 2:00 PM", customerStatus: "Confirmed" },
        fulfillment: null, plan: null },
      plan: { kind: "plan", headline: "Order confirmed", sub: "Demo checkout completed \u2014 no charge was made.",
        purchase: { ref: "pur-n3w003", reference: "CH-2433" },
        appointment: null, fulfillment: null,
        plan: { ref: "plan-n3w01", kind: "PACKAGE", title: "Six-visit facial series", status: "Active" } },
      /* wave 16 — membership enrollment (source plan, offer off-mem-8d02) */
      membership: { kind: "plan", headline: "Order confirmed", sub: "Demo checkout completed \u2014 no charge was made.",
        purchase: { ref: "pur-n3w004", reference: "CH-2434" },
        appointment: null, fulfillment: null,
        plan: { ref: "plan-n3w02", kind: "MEMBERSHIP", title: "Harbor membership", status: "Active" } },
      /* wave 16 — booking with a package credit (appointment only + plan readback) */
      credit: { kind: "booking", headline: "Booking confirmed", sub: "A package credit was used \u2014 no charge was made.",
        purchase: null, fulfillment: null,
        appointment: { ref: "appt-ch-10362", service: "Facial treatment", start: "Tue, Jul 28 \u00b7 2:00 PM", customerStatus: "Confirmed" },
        plan: { ref: "plan-4e19c3", kind: "PACKAGE", title: "Six-visit facial series \u2014 3 of 6 visits left", status: "Active" } },
      /* wave 16 — reschedule readback: the ORIGINAL visit is only released here */
      reschedule: { kind: "booking", headline: "Booking confirmed", sub: "Your visit was moved \u2014 the previous time was released. No charge was made.",
        purchase: null, fulfillment: null, plan: null,
        appointment: { ref: "appt-ch-10318", service: "Facial treatment", start: "Tue, Jul 28 \u00b7 2:00 PM", customerStatus: "Confirmed" } }
    }
  };

  /* ============================================================
     WAVE 16 — Booking flow read model (Calm Harbor target).
     Everything the drawer shows is SERVER-OWNED: eligible services,
     specialists (returned per service \u2014 the step exists only when the
     list is non-empty), eligible days/slots, the slot hold (an opaque
     ref + a display-ready expiry label; the browser NEVER counts it
     down or extends it), the review display total, and the policy
     copy. paymentMode is always "SIMULATED".
     ============================================================ */
  var spaBooking = {
    ref: "bkg-7a31f2", version: "b1", paymentMode: "SIMULATED",
    eligibleServices: ["svc-spa-01", "svc-spa-02", "svc-spa-03"],
    /* appointment service title -> bookable service code (server mapping;
       an unmapped title simply starts the flow at the service choice) */
    serviceForTitle: { "Facial treatment": "svc-spa-03", "Gel manicure": "svc-spa-01", "Manicure & nails": "svc-spa-01", "Hair styling": "svc-spa-02" },
    displayTotals: { "svc-spa-01": "$45.00", "svc-spa-02": "$65.00", "svc-spa-03": "$85.00" },
    specialists: {
      "spc-a1v": { ref: "spc-a1v", name: "Alina V.", role: "Hair & skin" },
      "spc-m3k": { ref: "spc-m3k", name: "Marta K.", role: "Facials" },
      "spc-d2p": { ref: "spc-d2p", name: "Dana P.", role: "Nails" }
    },
    /* returned per service — an empty list means the server offers no choice
       and the specialist step is SKIPPED (never invented) */
    eligibleSpecialists: { "svc-spa-01": [], "svc-spa-02": ["spc-a1v", "spc-m3k"], "svc-spa-03": ["spc-a1v", "spc-m3k"] },
    days: [
      { key: "d-0728", label: "Tue, Jul 28", slots: [{ ref: "sl-0728-09", label: "9:00 AM" }, { ref: "sl-0728-1130", label: "11:30 AM" }, { ref: "sl-0728-14", label: "2:00 PM" }, { ref: "sl-0728-1630", label: "4:30 PM" }] },
      { key: "d-0729", label: "Wed, Jul 29", slots: [{ ref: "sl-0729-10", label: "10:00 AM" }, { ref: "sl-0729-13", label: "1:00 PM" }, { ref: "sl-0729-1530", label: "3:30 PM" }] },
      { key: "d-0730", label: "Thu, Jul 30", slots: [{ ref: "sl-0730-0930", label: "9:30 AM" }, { ref: "sl-0730-12", label: "12:00 PM" }, { ref: "sl-0730-1430", label: "2:30 PM" }, { ref: "sl-0730-17", label: "5:00 PM" }] },
      { key: "d-0801", label: "Sat, Aug 1", slots: [{ ref: "sl-0801-11", label: "11:00 AM" }, { ref: "sl-0801-1330", label: "1:30 PM" }] }
    ],
    /* the server slot hold: opaque ref + display-ready expiry. The label is
       rendered verbatim; expiry itself is a SERVER event (dev select `hold`). */
    hold: { ref: "hld-2f91c4", version: "h1", untilLabel: "Held until 2:47 PM (studio clock)", note: "The studio releases the time automatically after that \u2014 it\u2019s re-checked when you confirm." },
    reviewLocation: "Harbor Front studio", /* server review context for a NEW booking; reschedules keep the original visit's mode/location */
    policy: "I understand this visit follows the studio\u2019s cancellation policy.",
    policyNote: "Free rescheduling and cancellation until 24 hours before the visit \u2014 after that the studio\u2019s policy applies.",
    /* plan-credit context strings (SERVER copy per credit state) */
    creditNotes: {
      ok: "1 visit credit from your Six-visit facial series will be used \u2014 no charge for this visit.",
      unavailable: "Your plan can\u2019t be used for this booking right now \u2014 nothing was used or booked. The studio can help.",
      exhausted: "Your package has no visits left \u2014 nothing was used or booked. You can buy the package again or book at the published price.",
      changed: "Your plan balance changed while you were booking \u2014 reload to see the current balance before continuing."
    }
  };

  /* ============================================================
     WAVE 16 — Calm Harbor Profile read model (scoped API).
     LEAST DATA by design: phone, email and the explicitly approved
     preference list below are the ONLY fields this source returns.
     No spend, savings, order stats, addresses, saved cards, plan or
     member-since claims, raw ids, roles or organization exist here.
     ============================================================ */
  var spaProfileSrv = {
    version: "p4",
    phone: "+1 (415) 555-0134",
    email: "mia.chen@example.com",
    preferences: [
      { key: "appt-reminders", label: "Appointment reminders", desc: "A reminder before each visit", value: true },
      { key: "appt-changes", label: "Schedule change alerts", desc: "If the studio needs to move or confirm a visit", value: true },
      { key: "care-tips", label: "Care tips between visits", desc: "Occasional tips from your specialist", value: false }
    ],
    allowedActions: ["edit", "save"]
  };

  /* DEMO stand-in for the AUTHORITATIVE server cart recalculation: every cart
     mutation returns a COMPLETE recalculated cart read model (versioned, with
     display-ready totals). Presentation renders the returned strings verbatim.
     Codex replaces this with the real /portal/v1/cart responses. */
  var spaCartSeq = 0;
  function spaServerCart(lines) {
    var sub = 0;
    lines.forEach(function (l) { sub += l.cents * l.qty; });
    var tax = Math.round(sub * 0.08);
    var fmt = function (c) { return "$" + (c / 100).toFixed(2); };
    spaCartSeq += 1;
    return {
      version: "c" + spaCartSeq,
      lines: lines.map(function (l) { return Object.assign({}, l, { displayUnitPrice: fmt(l.cents), displayTotal: fmt(l.cents * l.qty) }); }),
      displayTotals: lines.length ? { subtotal: fmt(sub), tax: fmt(tax), total: fmt(sub + tax) } : null,
      fulfillment: { kind: "PICKUP", label: "Pickup \u2014 Harbor Front studio", detail: "Usually ready in 2 days \u00b7 free" }
    };
  }

  window.AircoveFixtures = {
    PAL: PAL, TINTS: TINTS,
    themeSlugs: themeSlugs,
    themes: themes,
    statusMeta: statusMeta,
    technician: technician,
    pstatus: pstatus,
    customer: customer,
    MONTHS: MONTHS,
    buildFeed: buildFeed,
    feedTabs: feedTabs,
    initialMessages: initialMessages,
    quickReplies: quickReplies,
    helpTopics: helpTopics,
    chatReply: chatReply,
    stormCalendar: stormCalendar,
    spa: spa,
    spaCommerce: spaCommerce,
    spaServerCart: spaServerCart,
    spaBooking: spaBooking,
    spaProfileSrv: spaProfileSrv,
    addresses: addresses,
    cards: cards,
    proposal: proposal,
    proposalSites: proposalSites,
    surfaceDefs: surfaceDefs,
    MOB_CLEAR: MOB_CLEAR,
    MOB_DEICE: MOB_DEICE,
    planName: planName,
    ordersFor: ordersFor
  };
})();


/* ES-module export for the split runtime (IIFE above still sets window.AircoveFixtures). */
export const F = window.AircoveFixtures;
