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
    "Pest Control": "pest"
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
    return [
      { day: "Today", items: [
        { type: "orders", title: "Weather Trigger \u2014 confirm your visit", desc: v.wt.trigger + " at Office \u00b7 respond by 8:00 PM today", time: "5:12 AM", dot: "#0e8fc4", iconBg: "rgba(14,143,196,.16)", action: "Review", act: "weather", unread: true },
        { type: "orders", title: "Daniel is on the way", desc: v.orderNames[0] + " \u00b7 arriving in ~14 min", time: "2:41 PM", dot: "var(--accent)", iconBg: "rgba(var(--accent-rgb),.14)", action: "Track", act: "orders", unread: true },
        { type: "orders", title: "Technician assigned", desc: "Daniel R. (\u2605 4.9) will handle your visit", time: "9:02 AM", dot: "var(--accent)", iconBg: "rgba(var(--accent-rgb),.14)", unread: true }
      ] },
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
        wt: { status: "pending", trigger: v.wt.trigger, detected: "Today \u00b7 5:10 AM", deadline: "Today \u00b7 8:00 PM", auto: auto } },
      { id: "#SV-2410", name: n[2], date: "Jan 30",   status: "scheduled",  price: "$120", dot: A[0], iconBg: A[1], locationId: "home",   y: 2026, m: 0, d: 30 },
      { id: "#SV-2381", name: n[3], date: "Jan 12",   status: "completed",  price: "$480", dot: G[0], iconBg: G[1], locationId: "home",   y: 2026, m: 0, d: 12, photos: true },
      { id: "#SV-3290", name: n[1], date: "Jan 5",    status: "completed",  price: "$94",  dot: B[0], iconBg: B[1], locationId: "office", y: 2026, m: 0, d: 5,  photos: true,
        wt: { status: "auto", trigger: v.wt.past, detected: "Jan 5 \u00b7 4:46 AM", deadline: "Jan 5 \u00b7 7:00 AM", sla: v.wt.sla } },
      { id: "#SV-2356", name: n[4], date: "Oct 24",   status: "completed",  price: "$45",  dot: G[0], iconBg: G[1], locationId: "office", y: 2025, m: 9, d: 24 }
    ];
  }

  /* ============================================================
     PORTAL PROFILES — configure the whole portal per vertical.
     'onDemand' (HVAC-style): booking-first, full commerce.
     'stormOps' (weather-triggered verticals: snow, roofing, pool,
     lawn, pest): a Home + weather-operational Calendar + contracts;
     primary action is "Request service", not "+ Book".
     This is DEPLOYMENT CONFIG (like data-theme), not a user choice.
     ============================================================ */
  var profiles = {
    onDemand: {
      id: "onDemand",
      nav: [
        { key: "orders.list", label: "Orders" },
        { key: "proposals.list", label: "Proposals" },
        { key: "services", label: "Services" },
        { key: "pricing", label: "Pricing" },
        { key: "products", label: "Products" },
        { key: "support", label: "Support" }
      ],
      primary: { label: "+ Book", action: "booking.open" },
      weatherCalendar: false,
      showCart: true,
      drawerTitle: "Book a service"
    },
    stormOps: {
      id: "stormOps",
      nav: [
        { key: "orders.list", label: "Home" },
        { key: "calendar", label: "Calendar" },
        { key: "proposals.list", label: "Contracts" },
        { key: "services", label: "Services" },
        { key: "activity", label: "Activity" },
        { key: "support", label: "Support" }
      ],
      primary: { label: "Request service", action: "service.request" },
      weatherCalendar: true,
      showCart: false,
      drawerTitle: "Request service"
    }
  };
  var profileFor = {
    "HVAC": "onDemand",
    "Snow Removal": "stormOps",
    "Lawn & Garden": "stormOps",
    "Pool & Spa": "stormOps",
    "Roofing": "stormOps",
    "Pest Control": "stormOps"
  };

  /* Weather-operational calendar (stormOps). Derives service names +
     trigger copy from the active vertical so it fits all 5 verticals. */
  function stormCalendar(themeName) {
    var v = themes[themeName] || themes["Snow Removal"];
    var s0 = v.svc[0].name, s1 = v.svc[1].name;
    return {
      contract: { rule: "Auto-dispatch after 2\u2033 snowfall", note: v.wt.sla },
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
        { date: "Wed", dateSub: "Jan 14", weather: { state: "clear", label: "Clear \u00b7 no accumulation", temp: "\u22121\u00b0C" }, events: [
          { type: s0, status: "skipped", note: "Below trigger \u2014 visit not required" }
        ] },
        { date: "Today", dateSub: "Jan 15", today: true, weather: { state: "watch", label: "Storm watch \u2014 service likely tonight", temp: "\u22126\u00b0C" }, events: [
          { type: s0, status: "onroute", time: "ETA 2:40 PM", tech: "Daniel R." }
        ] },
        { date: "Thu", dateSub: "Jan 16", needsAccess: true, weather: { state: "expected", label: v.wt.trigger, temp: "\u22128\u00b0C" }, events: [
          { type: s0, status: "scheduled", trigger: true },
          { type: s1, status: "scheduled", trigger: true }
        ] },
        { date: "Sat", dateSub: "Jan 18", weather: { state: "expected", label: "Light snow possible", temp: "\u22123\u00b0C" }, events: [
          { type: s1, status: "delayed", note: "Rescheduled from Fri \u2014 crew capacity" }
        ] }
      ]
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
    profiles: profiles,
    profileFor: profileFor,
    stormCalendar: stormCalendar,
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
