(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // app-templates/customer-portal/runtime/data/care-fixtures.js
  var care_fixtures_exports = {};
  __export(care_fixtures_exports, {
    careFixtures: () => careFixtures
  });
  var careFixtures;
  var init_care_fixtures = __esm({
    "app-templates/customer-portal/runtime/data/care-fixtures.js"() {
      careFixtures = {
        "HVAC": {
          kind: "equipment",
          navLabel: "Equipment",
          empty: { glyph: "\u2699", title: "No equipment on file yet", desc: "After your first visit, every unit we service appears here with its passport and diagnostics." },
          title: "Your equipment",
          sub: "Every unit we service \u2014 condition, warranty and the latest diagnostic in one place.",
          units: [
            {
              id: "unit-ac-01",
              name: "Central AC",
              model: "Carrier 24ACC636",
              place: "Backyard pad",
              serial: "SN 4A88-22014",
              installed: "2019",
              warranty: "Parts until Aug 2029",
              lastVisit: "Jan 12, 2026",
              health: 86,
              note: "Supply-air \u0394T is trending slightly low \u2014 worth a coil clean before summer.",
              checks: [
                { group: "Cooling performance", items: [
                  { name: "Refrigerant pressure", state: "ok", val: "118 psi" },
                  { name: "Supply air \u0394T", state: "warn", val: "19\xB0F", note: "target 20\u201322\xB0F" },
                  { name: "Compressor draw", state: "ok", val: "6.4 A" }
                ] },
                { group: "Airflow & filtration", items: [
                  { name: "Air filter", state: "warn", val: "88 days", note: "replace soon" },
                  { name: "Blower motor", state: "ok", val: "normal" },
                  { name: "Duct static pressure", state: "ok", val: "0.48 in" }
                ] },
                { group: "Safety & electrical", items: [
                  { name: "Capacitor", state: "ok", val: "within spec" },
                  { name: "Contactor & wiring", state: "ok", val: "no wear" },
                  { name: "Condensate drain", state: "ok", val: "clear" }
                ] }
              ]
            },
            {
              id: "unit-furnace-01",
              name: "Furnace",
              model: "Lennox EL296V",
              place: "Basement",
              serial: "SN 7C21-90387",
              installed: "2016",
              warranty: "Heat exchanger until 2036",
              lastVisit: "Oct 3, 2025",
              health: 71,
              note: "Igniter is near end of life \u2014 replacement recommended at the next visit.",
              checks: [
                { group: "Heating performance", items: [
                  { name: "Ignition system", state: "issue", val: "aging igniter", note: "replace recommended" },
                  { name: "Flame sensor", state: "ok", val: "cleaned Oct 3" },
                  { name: "Temperature rise", state: "ok", val: "52\xB0F" }
                ] },
                { group: "Safety", items: [
                  { name: "Heat exchanger", state: "ok", val: "no cracks" },
                  { name: "CO at registers", state: "ok", val: "0 ppm" },
                  { name: "Gas connections", state: "ok", val: "no leaks" }
                ] },
                { group: "Airflow", items: [
                  { name: "Blower wheel", state: "warn", val: "light dust", note: "clean at tune-up" },
                  { name: "Return airflow", state: "ok", val: "normal" }
                ] }
              ]
            }
          ],
          docs: [
            { id: "doc-hvac-diag-2026-01", name: "Diagnostic report \u2014 Jan 12, 2026", meta: "PDF \xB7 21-point check" },
            { id: "doc-hvac-warranty-carrier", name: "Carrier parts warranty", meta: "PDF \xB7 valid to 2029" }
          ]
        },
        "Snow Removal": {
          kind: "seasonLog",
          navLabel: "Season log",
          empty: { glyph: "\u2744", title: "No storm responses yet", desc: "When the first storm triggers a visit, the GPS-logged response appears here." },
          title: "Season log",
          sub: "Every storm response this winter \u2014 GPS-logged, timed against your SLA, with materials used.",
          stats: [
            { label: "Storms served", value: "9" },
            { label: "Visits", value: "14" },
            { label: "Avg response", value: "52 min" },
            { label: "De-icer used", value: "310 kg" }
          ],
          sla: { pct: 93, label: "13 of 14 visits inside the 90-minute window \u2014 the missed one was credited per contract." },
          events: [
            { date: "Jan 12", storm: "Snowfall 3.2 cm", trigger: "Auto \xB7 2 cm rule", response: "38 min", sla: true, material: "22 kg salt", orderId: "#SV-3290", photos: true },
            { date: "Jan 5", storm: "Snowfall 4.1 cm", trigger: "Auto \xB7 2 cm rule", response: "47 min", sla: true, material: "26 kg salt", orderId: "#SV-3290", photos: true },
            { date: "Dec 28", storm: "Freezing rain", trigger: "Ice watch", response: "41 min", sla: true, material: "31 kg brine", photos: true },
            { date: "Dec 19", storm: "Snowfall 8.6 cm", trigger: "Auto \xB7 2 cm rule", response: "104 min", sla: false, material: "24 kg salt", note: "crew rerouted \u2014 visit credited", photos: true },
            { date: "Dec 12", storm: "Snowfall 2.3 cm", trigger: "Auto \xB7 2 cm rule", response: "55 min", sla: true, material: "18 kg salt", photos: true }
          ],
          docs: [
            { id: "doc-snow-compliance-2025-12", name: "December compliance report", meta: "PDF \xB7 8 visits \xB7 slip-and-fall record" },
            { id: "doc-snow-compliance-2025-11", name: "November compliance report", meta: "PDF \xB7 4 visits" }
          ]
        },
        "Lawn & Garden": {
          kind: "program",
          navLabel: "Program",
          empty: { glyph: "\u2618", title: "Program starts in spring", desc: "Your 5-step season program appears here once the first application is scheduled." },
          title: "Season program",
          sub: "Your 5-step feeding and care program \u2014 what\u2019s done, what\u2019s next, and when the lawn is safe to use.",
          reentry: { active: true, treatment: "Fertilizing \u2014 applied today, 2:10 PM", safeAfter: "Safe after 6:00 PM today", note: "Water-in complete. Keep kids and pets off treated areas until dry." },
          steps: [
            { n: 1, name: "Early spring feed", detail: "Slow-release + pre-emergent", window: "April", status: "done", when: "Done \xB7 Apr 14" },
            { n: 2, name: "Late spring feed", detail: "Balanced feed + broadleaf control", window: "May", status: "done", when: "Done \xB7 May 22" },
            { n: 3, name: "Summer feed + grub control", detail: "Heat-safe formula", window: "July", status: "next", when: "Scheduled \xB7 Jul 18" },
            { n: 4, name: "Fall feed", detail: "Root-builder + overseed", window: "September", status: "upcoming", when: "Auto-scheduled" },
            { n: 5, name: "Winterizer", detail: "Potassium winterizer", window: "November", status: "upcoming", when: "Auto-scheduled" }
          ],
          soil: [
            { label: "Soil pH", value: "6.6 \xB7 ideal" },
            { label: "Nitrogen", value: "adequate" },
            { label: "Thatch", value: "6 mm \xB7 fine" }
          ],
          photos: [{ label: "April" }, { label: "May" }, { label: "June", tone: "after" }]
        },
        "Pool & Spa": {
          kind: "water",
          navLabel: "Water",
          empty: { glyph: "\u25CB", title: "No readings yet", desc: "Water chemistry from every visit lands here after your first test." },
          title: "Water quality",
          sub: "Readings from every visit, tracked against safe ranges \u2014 plus what your tech dosed and why.",
          tested: "Last tested Jan 12 \xB7 9:40 AM \xB7 Daniel R.",
          nextTest: "Next test \u2014 Jan 19 (weekly plan)",
          readings: [
            { name: "pH", value: "7.4", target: "target 7.2\u20137.6", state: "ok", series: [55, 70, 80, 45, 60] },
            { name: "Free chlorine", value: "1.8 ppm", target: "target 1\u20133 ppm", state: "ok", series: [40, 35, 60, 70, 55] },
            { name: "Alkalinity", value: "78 ppm", target: "target 80\u2013120 ppm", state: "warn", note: "Slightly low \u2014 dose added Jan 12", series: [80, 70, 60, 50, 45] },
            { name: "Water temp", value: "27\xB0C", target: "heater set 28\xB0C", state: "ok", series: [50, 55, 60, 62, 65] }
          ],
          doses: [
            { date: "Jan 12", what: "Alkalinity increaser 1.2 kg \xB7 chlorine tabs \xD72", why: "Alkalinity trending low" },
            { date: "Jan 5", what: "Chlorine tabs \xD72", why: "Routine top-up" },
            { date: "Dec 29", what: "Algaecide 250 ml", why: "Preventive \u2014 warm spell" }
          ]
        },
        "Roofing": {
          kind: "roof",
          navLabel: "Roof report",
          empty: { glyph: "\u2302", title: "No inspection yet", desc: "Book your first drone inspection to get a zone-by-zone condition report." },
          title: "Roof condition",
          sub: "Findings from your drone inspection on Jan 8 \u2014 and the repair project it kicked off.",
          score: "82",
          grade: "Good",
          inspected: "Inspected Jan 8, 2026",
          nextDue: "Next inspection \u2014 Jan 2027",
          zones: [
            { zone: "Main roof \u2014 south face", sev: "ok", note: "Shingles sound \xB7 no lifting or granule loss" },
            { zone: "Valley at dormer", sev: "warn", note: "Early granule loss \u2014 monitor, reseal in 2026" },
            { zone: "Chimney flashing", sev: "issue", note: "Cracked sealant \u2014 repair scheduled Jan 22" },
            { zone: "Gutters \u2014 north run", sev: "warn", note: "60% debris \u2014 cleaning added to the visit" },
            { zone: "Ridge & vents", sev: "ok", note: "Ventilation normal" }
          ],
          project: { name: "Chimney flashing repair", eta: "Crew arrives Jan 22 \xB7 9:00 AM", steps: [
            { label: "Quote approved", sub: "Jan 9 \xB7 $180 \xB7 2-year warranty", dot: "var(--ok)" },
            { label: "Materials ordered", sub: "Jan 10 \xB7 matching flashing kit", dot: "var(--ok)" },
            { label: "Repair day", sub: "Jan 22 \xB7 one crew, ~2 h", dot: "var(--accent)" },
            { label: "Final drone check", sub: "Within 7 days of repair", dot: "rgba(120,120,128,.35)", muted: true }
          ] },
          docs: [
            { id: "doc-roof-inspection-2026-01", name: "Inspection report \u2014 Jan 2026", meta: "PDF \xB7 18 drone photos" },
            { id: "doc-roof-warranty-shingle", name: "25-year shingle warranty", meta: "PDF \xB7 transferable" },
            { id: "doc-roof-insurance-pack", name: "Insurance documentation pack", meta: "ZIP \xB7 photos + condition report" }
          ]
        },
        "Pest Control": {
          kind: "monitoring",
          navLabel: "Monitoring",
          empty: { glyph: "\u25C9", title: "No stations installed yet", desc: "After installation, every bait station and sensor reports its status here." },
          title: "Station monitoring",
          sub: "Bait stations and smart sensors watch your home between visits \u2014 alerts go straight to your technician.",
          summary: [
            { label: "Stations active", value: "8" },
            { label: "Open alerts", value: "1" },
            { label: "Last full sweep", value: "Jan 9" }
          ],
          stations: [
            { id: "S1", label: "Garage \u2014 north wall", type: "Bait station", status: "clear", last: "Checked Jan 9", x: 20, y: 64 },
            { id: "S2", label: "Kitchen \u2014 under sink", type: "Smart sensor", status: "alert", last: "Today \xB7 4:12 AM", note: "activity detected", x: 46, y: 30 },
            { id: "S3", label: "Attic hatch", type: "Smart sensor", status: "clear", last: "Checked Jan 9", x: 62, y: 18 },
            { id: "S4", label: "Foundation \u2014 SE corner", type: "Bait station", status: "refreshed", last: "Bait refreshed Jan 9", x: 78, y: 70 },
            { id: "S5", label: "Crawl space entry", type: "Bait station", status: "clear", last: "Checked Jan 9", x: 34, y: 82 }
          ],
          alerts: [
            { when: "Today \xB7 4:12 AM", text: "Sensor S2 (kitchen) \u2014 activity detected, Daniel notified automatically", state: "alert" },
            { when: "Jan 9", text: "Quarterly sweep \u2014 all 8 stations checked, 2 baits refreshed", state: "ok" },
            { when: "Dec 30", text: "Sensor S3 (attic) \u2014 false trigger cleared after review", state: "ok" }
          ],
          guarantee: {
            title: "Free re-treatment",
            note: "Seeing activity between visits? Re-treats are free under your Shield Plan \u2014 no questions asked.",
            usedNote: "Guarantee used Dec 12 \u2014 the next free re-treat unlocks with your next quarterly visit.",
            /* stable scope ids \u2014 the request payload contract (never display names) */
            scope: { planId: "plan-shield-2026", propertyId: "prop-maple-1284", serviceId: "svc-pest-retreat" },
            status: "available"
          }
        },
        /* WAVE 9 — Health care hub. LOGISTICS ONLY BY DESIGN: appointments,
           plan milestones, follow-up tasks, secure-document METADATA and the
           care team. No clinical metrics, readings, results or medical advice
           are ever rendered here \u2014 clinical data stays in the provider's own
           systems. All ids are stable data-contract ids. */
        "Health": {
          kind: "healthCare",
          navLabel: "Care plan",
          empty: { glyph: "\u2661", title: "No care plan yet", desc: "After your intake assessment, appointments, milestones and documents appear here." },
          title: "Your care plan",
          sub: "Appointments, milestones, documents and your care team \u2014 the logistics in one place. Clinical details stay with your provider.",
          disclaimer: "This portal shows scheduling and documents only \u2014 it is not a medical record. For clinical questions, contact your provider.",
          appointment: { id: "appt-health-2026-0130", name: "Physio session \xB7 mid-plan review", providerId: "prov-health-pt-01", provider: "Priya N., physiotherapist", when: "Fri, Jan 30 \xB7 10:00\u201311:00 AM", where: "Home \u2014 1240 Pine Street", orderId: "#SV-2410", prep: "Clear a 2\xD72 m space and wear comfortable shoes. A family member is welcome to join the review." },
          plan: { id: "plan-health-2026", name: "Mobility & independence plan", cadence: "Reviewed quarterly \xB7 started Nov 2025", milestones: [
            { n: 1, name: "Intake & home assessment", detail: "Care team assigned \xB7 home setup reviewed", status: "done", when: "Done \xB7 Nov 12" },
            { n: 2, name: "Weekly session rhythm", detail: "Twice-weekly sessions established", status: "done", when: "Done \xB7 Dec 8" },
            { n: 3, name: "Mid-plan review", detail: "Review with you and your family", status: "next", when: "Scheduled \xB7 Jan 30" },
            { n: 4, name: "Cadence check-in", detail: "Adjust visit frequency together", status: "upcoming", when: "Planned \xB7 Mar" }
          ] },
          tasks: [
            { id: "task-health-01", label: "Confirm the Jan 30 session", due: "by Jan 28", done: false },
            { id: "task-health-02", label: "Sign the updated care plan", due: "before the review", done: false },
            { id: "task-health-03", label: "Send preferred times for February", due: "this month", done: true }
          ],
          provider: { id: "prov-health-pt-01", name: "Priya N.", role: "Physiotherapist \xB7 your care lead", org: "Aircove partner provider network", since: "Your care lead since Nov 2025", note: "Messages are answered within one business day. This channel is for scheduling \u2014 for anything urgent, call your provider directly." },
          docs: [
            { id: "doc-health-plan-2025-11", name: "Care plan \u2014 signed Nov 2025", meta: "Secure PDF \xB7 opens in the secure viewer", secure: true },
            { id: "doc-health-visit-2026-01-12", name: "Visit summary \u2014 Jan 12", meta: "Secure PDF \xB7 session notes", secure: true },
            { id: "doc-health-results-2026-01", name: "Results package \u2014 Jan 2026", meta: "Secure \xB7 contents never previewed here", secure: true }
          ],
          docsNote: "Documents open in the secure viewer only \u2014 nothing is previewed on this page and every access is logged."
        },
        /* WAVE 9 — Beauty care hub: appointments & packages, specialist
           preference, treatment/routine history, loyalty, routine products. */
        "Beauty": {
          kind: "beautyCare",
          navLabel: "My routine",
          empty: { glyph: "\u2740", title: "No routine yet", desc: "After your first visit, appointments, history and your specialist\u2019s notes appear here." },
          title: "Your routine",
          sub: "Appointments, packages, your specialist and the formulas they use \u2014 remembered visit to visit.",
          appointment: { id: "appt-beauty-2026-0116", name: "Gel manicure", specialistId: "spec-beauty-02", specialist: "Dana P., nail specialist", when: "Tomorrow \xB7 Jan 16 \xB7 2:00 PM", where: "Home \u2014 1240 Pine Street", orderId: "#SV-3312", prep: "Kit is sanitised and sealed \u2014 just have a clear table spot ready." },
          pkg: { id: "pkg-beauty-glow-2026", name: "Glow package", detail: "6 facial treatments \xB7 valid to Jun 2026", used: 2, total: 6, next: "Session 3 \u2014 book anytime, it never expires early" },
          specialists: [
            { id: "spec-beauty-01", name: "Alina V.", role: "Hair & skin", rating: "4.9", visits: "18 visits with you" },
            { id: "spec-beauty-02", name: "Dana P.", role: "Nails", rating: "4.8", visits: "6 visits with you" },
            { id: "spec-beauty-03", name: "Marco T.", role: "Massage & spa", rating: "5.0", visits: "New to you" }
          ],
          preferredId: "spec-beauty-01",
          history: [
            { date: "Jan 8", what: "Facial treatment", who: "Alina V.", note: "Hydration serum \xB7 T-zone is sensitive \u2014 gentle exfoliant only" },
            { date: "Dec 20", what: "Gel manicure", who: "Dana P.", note: "Shade \u201CRosewood 214\u201D saved to your profile" },
            { date: "Dec 6", what: "Root touch-up & blowout", who: "Alina V.", note: "Formula 6N + 20 vol \xB7 35 min \u2014 saved" },
            { date: "Nov 22", what: "Facial treatment", who: "Alina V.", note: "Winter routine started \u2014 overnight mask twice a week" }
          ],
          routine: { title: "Between visits", note: "Hydration serum every morning \xB7 overnight mask Tue & Sat. Next color window: early February \u2014 Alina will hold a slot.", by: "Set by Alina V. \xB7 Jan 8" },
          loyalty: { id: "plan-beauty-member-2026", tier: "Gold member", points: 420, nextAt: 500, reward: "Free blowout at 500 pts", renews: "Renews Mar 1, 2026" },
          productRecs: { note: "Picked by Alina for your routine", names: ["Silk Repair Set", "Hydration Serum", "Overnight Mask"] }
        }
      };
    }
  });

  // app-templates/customer-portal/runtime/data/fixtures.js
  (function() {
    "use strict";
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
    var themes = {
      "HVAC": {
        slug: "hvac",
        accent: "#0a5ae6",
        hero: { badge: "\u26A1 Same-day slots in your area", title: "Home comfort, handled in a tap.", sub: "Book AC repair, maintenance and installs from certified local techs. Track them live, pay in the app." },
        svc: [
          { name: "AC Repair", price: "$60", tagline: "Fast diagnosis & on-site fix", duration: "~60 min", includes: ["Full fault diagnosis", "Most repairs done same visit", "90-day workmanship warranty"] },
          { name: "Maintenance", price: "$120", tagline: "Seasonal tune-up & cleaning", duration: "~90 min", includes: ["Coil, filter & drain clean", "21-point performance check", "Written health report"] },
          { name: "Installation", price: "Quote", tagline: "New system, expertly fitted", duration: "half day", includes: ["Free in-home site assessment", "Certified professional install", "Old unit haul-away included"] },
          { name: "Air Quality Check", price: "$90", tagline: "Breathe cleaner, healthier air", duration: "~45 min", includes: ["Particle & VOC measurement", "Personalised filter advice", "Full home air report"] }
        ],
        orderNames: ["Filter replacement", "Emergency AC Check", "Annual maintenance", "AC Installation", "Diagnostics visit"],
        wt: { icon: "\u{1F321}\uFE0F", trigger: "Heat wave \u2265 38\xB0C forecast tomorrow", past: "Heat spike 39.1\xB0C recorded", sla: "Checked within the 4-hour contracted window" },
        plan: {
          name: "Comfort Plan",
          plusName: "Comfort Plus",
          tag: "Best for a single home",
          desc: "2 visits a year, priority slots, \u201315% on parts.",
          headline: "Pricing that fits your home",
          features: ["2 seasonal tune-ups a year", "Priority same-week slots", "\u201315% on all parts", "Free diagnostics visits"],
          plusFeatures: ["4 visits a year", "Same-day priority dispatch", "\u201325% on all parts", "24/7 support line"]
        },
        feat: { badge: "New \xB7 Wi-Fi inverter", title: "Mini Split \u2014 whisper-quiet comfort", desc: "12,000 BTU, 22 SEER, app control. Professionally installed by your local team.", cta: "Buy & install \xB7 $1,290", fin: "or $108/mo \xB7 0% APR" },
        cats: [{ key: "units", label: "AC units" }, { key: "thermostats", label: "Thermostats" }, { key: "filters", label: "Filters" }, { key: "purifiers", label: "Air purifiers" }],
        products: [
          { cat: "units", tag: "AC Unit", name: "Mini Split 12k BTU", blurb: "Quiet inverter \xB7 Wi-Fi \xB7 22 SEER", price: "$1,290", priceNum: 1290 },
          { cat: "units", tag: "AC Unit", name: "Dual-Zone 24k BTU", blurb: "Cools two rooms independently", price: "$2,150", priceNum: 2150 },
          { cat: "thermostats", tag: "Thermostat", name: "Smart Thermostat", blurb: "Learns your weekly schedule", price: "$189", priceNum: 189 },
          { cat: "thermostats", tag: "Sensor", name: "Room Sensor Pack (3)", blurb: "Balance temperature room-by-room", price: "$99", priceNum: 99 },
          { cat: "filters", tag: "Filter", name: "HEPA Filter 20\xD725", blurb: "Captures 99.97% of particles", price: "$34", priceNum: 34 },
          { cat: "filters", tag: "Filter", name: "Carbon Odor Filter", blurb: "For kitchens, pets & smoke", price: "$28", priceNum: 28 },
          { cat: "purifiers", tag: "Purifier", name: "Purifier Pro", blurb: "Whole-home \xB7 up to 1,500 sq ft", price: "$349", priceNum: 349 },
          { cat: "purifiers", tag: "Purifier", name: "Desk Purifier", blurb: "Personal clean-air zone", price: "$129", priceNum: 129 }
        ],
        reminder: { title: "Replace your air filter", desc: "It has been 88 days since the last change" },
        prop: { svc: "Seasonal HVAC Program", surfaces: ["Floor 1", "Floor 2", "Basement", "Attic", "Garage"], months: "May\u2013Sep", unlimDesc: "Unlimited tune-ups and priority heat-wave response.", colA: "Tune-up", colB: "Deep clean", unitA: "/ tune-up", unitB: "/ deep clean" }
      },
      "Snow Removal": {
        slug: "snow",
        accent: "#0e8fc4",
        hero: { badge: "\u2744 24/7 storm response", title: "Winter, handled before you wake.", sub: "Snow clearing and de-icing by local crews \u2014 weather-triggered dispatch, GPS-logged visits, photo proof after every clear." },
        svc: [
          { name: "Snow Clearing", price: "$94", tagline: "Driveway, walkways & lanes", duration: "~45 min", includes: ["Cleared to bare surface", "GPS-logged arrival & photos", "90-minute storm-window SLA"] },
          { name: "De-Icing", price: "$58", tagline: "Salt & brine application", duration: "~30 min", includes: ["Eco-friendly de-icer available", "Slip-risk spot treatment", "Free re-treat on refreeze"] },
          { name: "Roof Snow Removal", price: "Quote", tagline: "Prevent ice dams & overload", duration: "half day", includes: ["Load assessment included", "Safe rope-access crew", "Gutter ice clearing"] },
          { name: "Seasonal Contract", price: "$120", tagline: "Set-and-forget winter cover", duration: "~30 min", includes: ["Weather-triggered dispatch", "Unlimited storm visits", "Monthly compliance report"] }
        ],
        orderNames: ["Walkway salting", "Snow Clearing \u2014 De-Icing", "Seasonal contract visit", "Roof Snow Removal", "De-icing visit"],
        wt: { icon: "\u2744\uFE0F", trigger: "Snowfall \u2265 2 cm forecast overnight", past: "Snowfall 3.2 cm recorded overnight", sla: "Cleared within the 90-minute contracted window" },
        plan: {
          name: "Winter Plan",
          plusName: "Winter Plus",
          tag: "Best for a single property",
          desc: "Priority storm dispatch, \u201315% on de-icing.",
          headline: "Pricing that fits your winter",
          features: ["Priority storm dispatch", "2 free de-icing visits", "\u201315% on materials", "Photo report every visit"],
          plusFeatures: ["Same-storm guarantee", "Unlimited de-icing", "\u201325% on materials", "24/7 storm line"]
        },
        feat: { badge: "New \xB7 App-scheduled", title: "Smart Brine Sprayer \u2014 de-ice before it freezes", desc: "Connected tank applies brine to driveways and walks ahead of the storm.", cta: "Buy & install \xB7 $890", fin: "or $75/mo \xB7 0% APR" },
        cats: [{ key: "deicers", label: "De-icers" }, { key: "equipment", label: "Equipment" }, { key: "markers", label: "Markers & mats" }],
        products: [
          { cat: "deicers", tag: "De-icer", name: "Calcium Blend 20 kg", blurb: "Melts to \u221225\xB0C \xB7 concrete-safe", price: "$32", priceNum: 32 },
          { cat: "deicers", tag: "De-icer", name: "Pet-Safe Granules", blurb: "Chloride-free \xB7 gentle on paws", price: "$38", priceNum: 38 },
          { cat: "equipment", tag: "Equipment", name: "Poly Snow Pusher", blurb: "Wide blade \xB7 no-scratch edge", price: "$54", priceNum: 54 },
          { cat: "equipment", tag: "Equipment", name: "Telescopic Roof Rake", blurb: "Reach 6 m from the ground", price: "$89", priceNum: 89 },
          { cat: "markers", tag: "Marker", name: "Driveway Markers (12)", blurb: "Reflective \xB7 guide the plow", price: "$24", priceNum: 24 },
          { cat: "markers", tag: "Mat", name: "Heated Walkway Mat", blurb: "Plug-in \xB7 melts 5 cm/hour", price: "$210", priceNum: 210 }
        ],
        reminder: { title: "Restock de-icer", desc: "Your last bag was delivered 60 days ago" },
        prop: { svc: "Snow Removal & De-Icing", surfaces: ["Drive Lanes", "Driveway", "Pavement", "Private Sidewalk", "Public Sidewalk"], months: "Nov\u2013Mar", unlimDesc: "Unlimited de-icing at \u22640\xB0C and clearing at 2 cm.", colA: "Snow clearing", colB: "De-icing", unitA: "/ clearing", unitB: "/ de-ice" }
      },
      "Lawn & Garden": {
        slug: "lawn",
        accent: "#2f9e44",
        hero: { badge: "\u{1F331} Weekly slots open", title: "A lawn worth staying home for.", sub: "Mowing, feeding and garden care by vetted local crews. Track visits live, pay in the app." },
        svc: [
          { name: "Lawn Mowing", price: "$45", tagline: "Cut, trim & blow", duration: "~40 min", includes: ["Edges & walkways trimmed", "Clippings removed", "Photo after every cut"] },
          { name: "Fertilizing", price: "$80", tagline: "Seasonal feeding program", duration: "~30 min", includes: ["Soil-matched formula", "Kid & pet safe options", "Growth report included"] },
          { name: "Landscaping", price: "Quote", tagline: "Beds, hedges & redesign", duration: "half day", includes: ["Free on-site design visit", "Licensed & insured crew", "1-year plant warranty"] },
          { name: "Yard Cleanup", price: "$110", tagline: "Spring & fall resets", duration: "~2 h", includes: ["Leaves & debris hauled", "Beds edged & mulched", "Gutter-line sweep"] }
        ],
        orderNames: ["Lawn mowing", "Lawn Care \u2014 Rain Check", "Fertilizing visit", "Landscaping project", "Yard cleanup"],
        wt: { icon: "\u{1F327}\uFE0F", trigger: "Heavy rain forecast \u2014 visit may shift", past: "Rain 22 mm recorded \u2014 visit completed late-day", sla: "Completed within the 48-hour weather window" },
        plan: {
          name: "Green Plan",
          plusName: "Green Plus",
          tag: "Best for a single yard",
          desc: "Weekly mowing priority, \u201315% on treatments.",
          headline: "Pricing that fits your yard",
          features: ["Weekly mowing priority", "2 free spot treatments", "\u201315% on fertilizing", "Photo report every visit"],
          plusFeatures: ["Mow + feed bundle", "Unlimited spot treatments", "\u201325% on landscaping", "Dedicated crew"]
        },
        feat: { badge: "New \xB7 GPS-guided", title: "Robotic Mower \u2014 hands-free stripes", desc: "Quiet, app-controlled, cuts on your schedule. Installed and tuned by your local crew.", cta: "Buy & install \xB7 $1,450", fin: "or $121/mo \xB7 0% APR" },
        cats: [{ key: "care", label: "Lawn care" }, { key: "irrigation", label: "Irrigation" }, { key: "garden", label: "Garden" }],
        products: [
          { cat: "care", tag: "Lawn care", name: "Seed & Feed Mix", blurb: "Overseed + slow-release feed", price: "$28", priceNum: 28 },
          { cat: "care", tag: "Lawn care", name: "Organic Fertilizer", blurb: "Kid & pet safe \xB7 4-week feed", price: "$36", priceNum: 36 },
          { cat: "irrigation", tag: "Irrigation", name: "Smart Sprinkler Timer", blurb: "Skips rainy days automatically", price: "$129", priceNum: 129 },
          { cat: "irrigation", tag: "Irrigation", name: "Drip Irrigation Kit", blurb: "Covers up to 20 beds", price: "$89", priceNum: 89 },
          { cat: "garden", tag: "Garden", name: "Cedar Planter Box", blurb: "Rot-resistant \xB7 120\xD740 cm", price: "$74", priceNum: 74 },
          { cat: "garden", tag: "Garden", name: "Garden Tool Set", blurb: "Ergonomic 5-piece set", price: "$59", priceNum: 59 }
        ],
        reminder: { title: "Time to fertilize", desc: "Last application was 45 days ago" },
        prop: { svc: "Lawn Care & Fertilization", surfaces: ["Front Lawn", "Back Lawn", "Side Yard", "Boulevard", "Garden Beds"], months: "May\u2013Sep", unlimDesc: "Weekly mowing plus unlimited spot treatments.", colA: "Mowing", colB: "Fertilizing", unitA: "/ mow", unitB: "/ treatment" }
      },
      "Pool & Spa": {
        slug: "pool",
        accent: "#0d9488",
        hero: { badge: "\u{1F4A7} Crystal-clear guarantee", title: "Your pool, always swim-ready.", sub: "Cleaning, balancing and equipment care by certified techs. Every visit logged with photos and readings." },
        svc: [
          { name: "Pool Cleaning", price: "$90", tagline: "Vacuum, skim & brush", duration: "~60 min", includes: ["Floor & walls vacuumed", "Baskets & filter rinsed", "Photo + reading log"] },
          { name: "Chemical Balance", price: "$55", tagline: "Water testing & dosing", duration: "~30 min", includes: ["7-point water test", "Chemicals included", "Re-check if off-range"] },
          { name: "Equipment Repair", price: "Quote", tagline: "Pumps, heaters & filters", duration: "~90 min", includes: ["Same-week diagnosis", "OEM parts warranty", "Energy-use check"] },
          { name: "Opening / Closing", price: "$220", tagline: "Season start & shutdown", duration: "half day", includes: ["Lines blown & plugged", "Cover fitted & sealed", "Startup chemicals included"] }
        ],
        orderNames: ["Pool cleaning", "Chemical Balance \u2014 Heat Watch", "Weekly maintenance", "Heater installation", "Water test visit"],
        wt: { icon: "\u2600\uFE0F", trigger: "Heat wave \u2265 34\xB0C \u2014 algae risk rising", past: "Heat wave 36\xB0C recorded \u2014 extra dose applied", sla: "Balanced within the 24-hour contracted window" },
        plan: {
          name: "Clear Plan",
          plusName: "Clear Plus",
          tag: "Best for a single pool",
          desc: "Weekly testing, \u201315% on chemicals.",
          headline: "Pricing that fits your pool",
          features: ["Weekly water testing", "Priority heat-wave visits", "\u201315% on chemicals", "Reading log every visit"],
          plusFeatures: ["Weekly clean + balance", "Unlimited re-balancing", "\u201325% on repairs", "24/7 equipment line"]
        },
        feat: { badge: "New \xB7 Energy Star", title: "Variable-Speed Pump \u2014 cut energy 70%", desc: "Whisper-quiet, app-scheduled, rebate-eligible. Installed by certified techs.", cta: "Buy & install \xB7 $1,150", fin: "or $96/mo \xB7 0% APR" },
        cats: [{ key: "chemicals", label: "Chemicals" }, { key: "equipment", label: "Equipment" }, { key: "accessories", label: "Accessories" }],
        products: [
          { cat: "chemicals", tag: "Chemical", name: "Chlorine Tabs 8 kg", blurb: "Slow-dissolve \xB7 season supply", price: "$64", priceNum: 64 },
          { cat: "chemicals", tag: "Chemical", name: "pH Balance Kit", blurb: "Raise & lower \xB7 40 doses", price: "$29", priceNum: 29 },
          { cat: "equipment", tag: "Equipment", name: "Robotic Pool Vac", blurb: "Cleans floor & walls solo", price: "$649", priceNum: 649 },
          { cat: "equipment", tag: "Equipment", name: "LED Pool Light", blurb: "16 colors \xB7 app control", price: "$89", priceNum: 89 },
          { cat: "accessories", tag: "Accessory", name: "Solar Cover 16 ft", blurb: "Holds heat overnight", price: "$139", priceNum: 139 },
          { cat: "accessories", tag: "Accessory", name: "Test Strips (100)", blurb: "7-way water check", price: "$18", priceNum: 18 }
        ],
        reminder: { title: "Water test due", desc: "Last full test was 30 days ago" },
        prop: { svc: "Pool Care Program", surfaces: ["Main Pool", "Spa", "Pool Deck", "Coping", "Equipment Pad"], months: "May\u2013Sep", unlimDesc: "Weekly cleaning plus unlimited chemical balancing.", colA: "Cleaning", colB: "Balancing", unitA: "/ clean", unitB: "/ balance" }
      },
      "Roofing": {
        slug: "roofing",
        accent: "#4f46e5",
        hero: { badge: "\u{1F6E1} Certified & insured crews", title: "A roof you never think about.", sub: "Inspections, repairs and replacements by certified local roofers. Drone reports, photo-logged work." },
        svc: [
          { name: "Roof Inspection", price: "$95", tagline: "Drone + on-roof check", duration: "~60 min", includes: ["Full drone survey", "Written condition report", "Repair plan & pricing"] },
          { name: "Leak Repair", price: "$180", tagline: "Find & fix, guaranteed", duration: "~2 h", includes: ["Moisture-traced source", "Matching materials", "2-year repair warranty"] },
          { name: "Gutter Cleaning", price: "$120", tagline: "Clear & flush downspouts", duration: "~90 min", includes: ["Debris hauled away", "Downspout flush test", "Photo before/after"] },
          { name: "Full Replacement", price: "Quote", tagline: "Tear-off to new roof", duration: "multi-day", includes: ["Free on-site estimate", "Certified installers", "25-year system warranty"] }
        ],
        orderNames: ["Gutter cleaning", "Storm Inspection", "Annual inspection", "Leak repair", "Drone survey"],
        wt: { icon: "\u{1F327}\uFE0F", trigger: "Storm gusts \u2265 80 km/h forecast tonight", past: "Gusts 92 km/h recorded overnight", sla: "Inspected within the 24-hour storm window" },
        plan: {
          name: "Shelter Plan",
          plusName: "Shelter Plus",
          tag: "Best for a single roof",
          desc: "Annual inspection, priority storm response.",
          headline: "Pricing that fits your roof",
          features: ["Annual drone inspection", "Priority storm response", "\u201315% on repairs", "Yearly condition report"],
          plusFeatures: ["Twice-yearly inspection", "Free minor repairs", "\u201325% on replacement", "24/7 storm line"]
        },
        feat: { badge: "New \xB7 25-yr warranty", title: "Gutter Guard System \u2014 never climb again", desc: "Micro-mesh guards keep leaves and needles out for good. Installed by certified crews.", cta: "Buy & install \xB7 $1,680", fin: "or $140/mo \xB7 0% APR" },
        cats: [{ key: "protection", label: "Protection" }, { key: "ventilation", label: "Ventilation" }, { key: "materials", label: "Materials" }],
        products: [
          { cat: "protection", tag: "Protection", name: "Micro-Mesh Gutter Guard", blurb: "Keeps leaves out for good", price: "$86", priceNum: 86 },
          { cat: "protection", tag: "Protection", name: "Heated De-Icing Cable", blurb: "Stops ice dams at the eave", price: "$115", priceNum: 115 },
          { cat: "ventilation", tag: "Ventilation", name: "Ridge Vent Kit", blurb: "Cooler attic, longer shingle life", price: "$124", priceNum: 124 },
          { cat: "ventilation", tag: "Ventilation", name: "Solar Attic Fan", blurb: "Self-powered airflow", price: "$189", priceNum: 189 },
          { cat: "materials", tag: "Material", name: "Sealant Pro Pack", blurb: "Flash & seal small leaks", price: "$42", priceNum: 42 },
          { cat: "materials", tag: "Material", name: "Skylight Flashing Kit", blurb: "Fits most 60\xD790 units", price: "$98", priceNum: 98 }
        ],
        reminder: { title: "Inspection due", desc: "Your annual roof inspection is due this month" },
        prop: { svc: "Roof Care & Snow Load", surfaces: ["Main Roof", "Garage Roof", "Flat Section", "Gutters", "Valleys"], months: "Nov\u2013Mar", unlimDesc: "Unlimited storm inspections and debris clearing.", colA: "Debris clearing", colB: "Snow removal", unitA: "/ clearing", unitB: "/ removal" }
      },
      "Pest Control": {
        slug: "pest",
        accent: "#7c3aed",
        hero: { badge: "\u{1F6E1} Family & pet safe", title: "A pest-free home, guaranteed.", sub: "Inspection, treatment and prevention by licensed local techs. Free re-treatments between visits." },
        svc: [
          { name: "General Treatment", price: "$85", tagline: "Interior + perimeter", duration: "~45 min", includes: ["Licensed technician", "Family & pet safe products", "30-day re-treat guarantee"] },
          { name: "Rodent Control", price: "$140", tagline: "Trap, seal & monitor", duration: "~90 min", includes: ["Entry-point sealing", "Monitored bait stations", "Follow-up visit included"] },
          { name: "Termite Inspection", price: "$95", tagline: "Detect before damage", duration: "~60 min", includes: ["Moisture & wood probe", "Written risk report", "Treatment plan & pricing"] },
          { name: "Wasp Removal", price: "$120", tagline: "Same-day nest removal", duration: "~40 min", includes: ["Full nest removal", "Nest site treated", "Re-nest guarantee"] }
        ],
        orderNames: ["Interior treatment", "Perimeter Re-Treatment", "Quarterly treatment", "Rodent exclusion", "Termite inspection"],
        wt: { icon: "\u{1F327}\uFE0F", trigger: "Heavy rain \u2014 perimeter barrier re-treat due", past: "Rain 28 mm recorded \u2014 barrier re-applied", sla: "Re-treated within the 48-hour contracted window" },
        plan: {
          name: "Shield Plan",
          plusName: "Shield Plus",
          tag: "Best for a single home",
          desc: "Quarterly treatments, free re-visits.",
          headline: "Pricing that fits your home",
          features: ["4 quarterly treatments", "Free re-treats between visits", "\u201315% on exclusion work", "Report every visit"],
          plusFeatures: ["Monthly perimeter service", "Rodent monitoring included", "\u201325% on exclusion work", "24/7 urgent line"]
        },
        feat: { badge: "New \xB7 App alerts", title: "Smart Rodent Sensors \u2014 know before you see", desc: "Connected sensors alert your technician automatically. Installed discreetly.", cta: "Buy & install \xB7 $340", fin: "or $29/mo \xB7 0% APR" },
        cats: [{ key: "barriers", label: "Barriers" }, { key: "traps", label: "Traps & bait" }, { key: "sensors", label: "Sensors" }],
        products: [
          { cat: "barriers", tag: "Barrier", name: "Perimeter Granules", blurb: "3-month outdoor barrier", price: "$34", priceNum: 34 },
          { cat: "barriers", tag: "Barrier", name: "Door Sweep Seal Kit", blurb: "Blocks entry gaps fast", price: "$28", priceNum: 28 },
          { cat: "traps", tag: "Bait", name: "Ant Bait Stations (8)", blurb: "Kills the colony, not just ants", price: "$22", priceNum: 22 },
          { cat: "traps", tag: "Trap", name: "Mosquito Trap Pro", blurb: "Covers a full backyard", price: "$119", priceNum: 119 },
          { cat: "sensors", tag: "Sensor", name: "Smart Rodent Sensor (2)", blurb: "App alert on first activity", price: "$89", priceNum: 89 },
          { cat: "sensors", tag: "Trap", name: "Pantry Moth Traps (6)", blurb: "Pheromone \xB7 non-toxic", price: "$16", priceNum: 16 }
        ],
        reminder: { title: "Quarterly treatment due", desc: "Last perimeter treatment was 80 days ago" },
        prop: { svc: "Perimeter Protection Program", surfaces: ["Perimeter", "Foundation", "Lawn Zone", "Interior", "Crawl Space"], months: "Apr\u2013Aug", unlimDesc: "Unlimited re-treatments between scheduled visits.", colA: "Perimeter spray", colB: "Interior treatment", unitA: "/ spray", unitB: "/ treatment" }
      },
      "Health": {
        slug: "health",
        accent: "#0b7285",
        hero: { badge: "\u2695\uFE0F Licensed & background-checked", title: "Care at home, coordinated.", sub: "Home care visits, physio and nursing support by licensed providers. One schedule the whole family can follow \u2014 documents kept secure." },
        svc: [
          { name: "Home Care Visit", price: "$75", tagline: "Support at home, on schedule", duration: "~60 min", includes: ["The same care team every visit", "Visit summary in your portal", "Family can follow the schedule"] },
          { name: "Physio Session", price: "$95", tagline: "Mobility work at home", duration: "~60 min", includes: ["Licensed physiotherapist", "Plan milestones updated after each session", "Home exercise notes included"] },
          { name: "Nursing Visit", price: "$110", tagline: "In-home nursing support", duration: "~45 min", includes: ["Registered nurse", "Coordinated with your care plan", "Secure visit notes"] },
          { name: "Care Assessment", price: "Quote", tagline: "Care plan intake & setup", duration: "~90 min", includes: ["In-home intake assessment", "Personal care plan drafted", "Family walkthrough included"] }
        ],
        orderNames: ["Home care visit", "Physio session", "Nursing visit", "Care assessment", "Follow-up visit"],
        wt: null,
        plan: {
          name: "Care Plan",
          plusName: "Care Plus",
          tag: "Best for one household",
          desc: "A consistent care team, priority scheduling.",
          headline: "Pricing that fits your care",
          features: ["The same care team, visit to visit", "Priority scheduling", "Quarterly plan reviews", "Family access included"],
          plusFeatures: ["Weekly scheduled visits", "Same-week rescheduling", "Dedicated care coordinator", "24/7 phone line"]
        },
        feat: { badge: "New \xB7 Fitted & installed", title: "Home Safety Rail Kit \u2014 steadier every day", desc: "Grab rails and threshold ramps, fitted by insured installers in one visit.", cta: "Buy & install \xB7 $240", fin: "or $20/mo \xB7 0% APR" },
        cats: [{ key: "safety", label: "Home safety" }, { key: "mobility", label: "Mobility" }, { key: "comfort", label: "Daily comfort" }],
        products: [
          { cat: "safety", tag: "Safety", name: "Grab Rail Set", blurb: "Bathroom & hallway \xB7 installed", price: "$68", priceNum: 68 },
          { cat: "safety", tag: "Safety", name: "Non-Slip Mat Pack", blurb: "Bath, shower & entry", price: "$32", priceNum: 32 },
          { cat: "mobility", tag: "Mobility", name: "Folding Walker", blurb: "Light frame \xB7 folds flat", price: "$129", priceNum: 129 },
          { cat: "mobility", tag: "Mobility", name: "Threshold Ramp", blurb: "Doorways up to 6 cm", price: "$84", priceNum: 84 },
          { cat: "comfort", tag: "Comfort", name: "Adjustable Bed Wedge", blurb: "Rest & reading support", price: "$59", priceNum: 59 },
          { cat: "comfort", tag: "Comfort", name: "Big-Button Phone", blurb: "Loud, simple, reliable", price: "$49", priceNum: 49 }
        ],
        reminder: { title: "Plan review due", desc: "Your quarterly care plan review is due this month" },
        prop: { svc: "Home Safety Program", surfaces: ["Bathroom", "Bedroom", "Hallway", "Kitchen", "Entry"], months: "Year-round", unlimDesc: "Scheduled visits plus unlimited plan adjustments.", colA: "Care visit", colB: "Physio session", unitA: "/ visit", unitB: "/ session" }
      },
      "Beauty": {
        slug: "beauty",
        accent: "#d6336c",
        hero: { badge: "\u2728 Vetted, licensed specialists", title: "Salon-level care, at your door.", sub: "Hair, nails and skin by vetted specialists \u2014 at home or in-studio. Formulas, shades and routine notes remembered visit to visit." },
        svc: [
          { name: "Hair Styling", price: "$65", tagline: "Cut, color & blowout", duration: "~75 min", includes: ["Licensed, vetted stylists", "Your color formulas saved", "Rebook the same specialist in a tap"] },
          { name: "Manicure & Nails", price: "$45", tagline: "Classic to gel, at home", duration: "~60 min", includes: ["Sanitised, sealed pro kit", "Gel, classic or press-on", "Shade saved to your profile"] },
          { name: "Facial Treatment", price: "$85", tagline: "A routine that carries over", duration: "~60 min", includes: ["Routine notes after every visit", "Products logged to your profile", "Sensitive-skin options"] },
          { name: "Event & Bridal Package", price: "Quote", tagline: "Trials, timeline, day-of team", duration: "custom", includes: ["Trial session included", "Day-of team scheduling", "One coordinator end-to-end"] }
        ],
        orderNames: ["Blowout & style", "Gel manicure", "Facial treatment", "Bridal trial", "Root touch-up"],
        wt: null,
        plan: {
          name: "Glow Plan",
          plusName: "Glow Plus",
          tag: "Best for a monthly routine",
          desc: "Member pricing, priority slots with your specialist.",
          headline: "Pricing that fits your routine",
          features: ["Member pricing on every visit", "Priority slots with your specialist", "1 style refresh a quarter", "Formulas & routine history saved"],
          plusFeatures: ["2 visits a month included", "Same-week rebooking guarantee", "\u201320% on all products", "Event styling priority"]
        },
        feat: { badge: "New \xB7 Pro-grade", title: "Silk Repair Set \u2014 salon results between visits", desc: "The treatment line your stylist uses, sized for home.", cta: "Buy \xB7 $64", fin: "or 4 \xD7 $16 \xB7 no fees" },
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
    var statusMeta = {
      completed: { label: "Completed", badge: "status-badge--ok" },
      inprogress: { label: "In progress", badge: "status-badge--progress" },
      scheduled: { label: "Scheduled", badge: "status-badge--scheduled" },
      cancelled: { label: "Cancelled", badge: "status-badge--danger" }
    };
    var technician = { name: "Daniel R.", role: "Senior HVAC technician", rating: "4.9", visits: "320", eta: "~14 min" };
    var pstatus = {
      approved: { label: "\u2713 Approved", badge: "status-badge--ok", dot: "#34c759" },
      revision: { label: "\u27F3 Revision pending", badge: "status-badge--warn", dot: "#ff9f0a" },
      declined: { label: "\u2715 Declined", badge: "status-badge--danger", dot: "#ff3b30" },
      unseen: { label: "\u25D4 Unseen", badge: "status-badge--scheduled", dot: "#8a94a6" },
      viewed: { label: "\u2022 Reviewing", badge: "status-badge--scheduled", dot: "#8a94a6" }
    };
    var customer = {
      firstName: "Mara",
      greeting: "Good afternoon, Mara",
      subline: "One visit in progress \xB7 next service in 2 days",
      fullName: "Mara Lindqvist",
      phone: "+1 (555) \u2022\u2022\u2022-7740",
      email: "mara@email.com",
      memberSince: "2023",
      stats: { orders: "12", spent: "$1,240", savings: "$186" }
    };
    var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    function buildFeed(v) {
      var todayItems = v.wt ? [
        { type: "orders", title: "Weather Trigger \u2014 confirm your visit", desc: v.wt.trigger + " at Office \xB7 respond by 8:00 PM today", time: "5:12 AM", dot: "#0e8fc4", iconBg: "rgba(14,143,196,.16)", action: "Review", act: "weather", unread: true }
      ] : [];
      todayItems = todayItems.concat([
        { type: "orders", title: "Daniel is on the way", desc: v.orderNames[0] + " \xB7 arriving in ~14 min", time: "2:41 PM", dot: "var(--accent)", iconBg: "rgba(var(--accent-rgb),.14)", action: "Track", act: "orders", unread: true },
        { type: "orders", title: "Technician assigned", desc: "Daniel R. (\u2605 4.9) will handle your visit", time: "9:02 AM", dot: "var(--accent)", iconBg: "rgba(var(--accent-rgb),.14)", unread: true }
      ]);
      return [
        { day: "Today", items: todayItems },
        { day: "Yesterday", items: [
          { type: "billing", title: "Payment received", desc: "$480 \xB7 " + v.orderNames[3] + " #SV-2381", time: "4:18 PM", dot: "#1f8a44", iconBg: "rgba(52,199,89,.16)", action: "View invoice", act: "invoice" },
          { type: "orders", title: "Service completed", desc: v.orderNames[3] + " finished \u2014 you rated it \u2605\u2605\u2605\u2605\u2605", time: "3:50 PM", dot: "#1f8a44", iconBg: "rgba(52,199,89,.16)" }
        ] },
        { day: "Earlier this week", items: [
          { type: "reminders", title: "Upcoming visit", desc: v.orderNames[2] + " is due Jan 30", time: "Mon", dot: "#ff8a3d", iconBg: "rgba(255,159,10,.16)", action: "Book now", act: "book" },
          { type: "billing", title: v.plan.name + " renewed", desc: "$9/mo \xB7 saved you $42 this quarter", time: "Mon", dot: "#7a52e0", iconBg: "rgba(122,82,224,.16)" },
          { type: "reminders", title: v.reminder.title, desc: v.reminder.desc, time: "Sun", dot: "#ff8a3d", iconBg: "rgba(255,159,10,.16)", action: "Shop supplies", act: "products" }
        ] }
      ];
    }
    var feedTabs = [
      { key: "all", label: "All" },
      { key: "orders", label: "Orders" },
      { key: "billing", label: "Billing" },
      { key: "reminders", label: "Reminders" }
    ];
    var initialMessages = [{ from: "agent", text: "Hi Mara, I'm Avery from support. How can I help today?" }];
    var quickReplies = ["Where's my technician?", "Reschedule a visit", "Billing question", "Talk to a human"];
    var helpTopics = [
      { label: "Track or contact my technician", dot: "var(--accent)", iconBg: "rgba(var(--accent-rgb),.14)", q: "Where's my technician?" },
      { label: "Reschedule or cancel a visit", dot: "#1f8a44", iconBg: "rgba(52,199,89,.16)", q: "I need to reschedule a visit" },
      { label: "Invoices & payments", dot: "#ff8a3d", iconBg: "rgba(255,159,10,.16)", q: "I have a billing question" },
      { label: "Report an issue after service", dot: "#7a52e0", iconBg: "rgba(122,82,224,.16)", q: "I want to report an issue" }
    ];
    function chatReply(text5) {
      var t = (text5 || "").toLowerCase();
      if (/(where|track|technician|daniel|coming|arriv)/.test(t)) return "Daniel is about 14 minutes away \u2014 3 stops out. You can watch his live location in the Orders tab.";
      if (/(reschedul|move|change.*(time|date|visit)|cancel)/.test(t)) return "Sure \u2014 which visit would you like to move? You can also reschedule straight from the order details.";
      if (/(bill|invoice|charge|pay|refund|price)/.test(t)) return "Your last invoice #SV-2381 was $480, paid Jan 12. Want me to email you a copy?";
      if (/(human|agent|person|representative|specialist)/.test(t)) return "Connecting you with a specialist now \u2014 typical wait is under 2 minutes. Stay with me here.";
      if (/(filter|maintenance|repair|install)/.test(t)) return "Happy to help with that. Would you like me to book a visit, or check the status of an existing order?";
      return "Got it, thanks Mara. A support specialist will follow up shortly. Is there anything else I can help with?";
    }
    var addresses = [
      { id: "home", label: "Home", line: "1240 Pine Street, Apt 4B", city: "Vancouver, BC V6E 1A5", dot: "var(--accent)", iconBg: "rgba(var(--accent-rgb),.14)" },
      { id: "office", label: "Office", line: "500 Granville St, Floor 12", city: "Vancouver, BC V6C 1W6", dot: "#1f8a44", iconBg: "rgba(52,199,89,.16)" }
    ];
    var cards = [
      { id: "visa", brand: "Visa", last4: "4242", exp: "08/27" },
      { id: "mc", brand: "Mastercard", last4: "8810", exp: "11/26" }
    ];
    var proposal = { id: "PR-1043", sent: "Dec 28", validUntil: "Mar 31, 2026" };
    var proposalSites2 = [
      { id: "s1", addr: "2381 Argue St", city: "Port Coquitlam, BC", postal: "V3C 6P9", lot: "17,303", areas: [876, 1026, 1539, 1456, 861], status: "approved", selected: "898", x: 22, y: 30 },
      { id: "s2", addr: "2287 Argue St", city: "Port Coquitlam, BC", postal: "V3B 1A2", lot: "21,400", areas: [1180, 1320, 1980, 1820, 1100], status: "revision", selected: "898", x: 46, y: 22 },
      { id: "s3", addr: "1618 Schooner St", city: "Coquitlam, BC", postal: "V3K 4M1", lot: "14,900", areas: [760, 900, 1400, 1340, 800], status: "declined", selected: "898", x: 72, y: 34 },
      { id: "s4", addr: "1153 Knox Way", city: "Port Coquitlam, BC", postal: "V3C 0B5", lot: "48,200", areas: [5200, 3400, 7800, 5600, 2800], status: "unseen", selected: "898", x: 58, y: 74 }
    ];
    var surfaceDefs = [
      { color: "#34c759", clear: 0.075, deice: 0.05 },
      { color: "#ffd60a", clear: 0.055, deice: 0.04 },
      { color: "#ff6b4a", clear: 0.045, deice: 0.03 },
      { color: "#2f7be0", clear: 0.05, deice: 0.035 },
      { color: "#c77dff", clear: 0.045, deice: 0.03 }
    ];
    var MOB_CLEAR = 47, MOB_DEICE = 37;
    function planName(id) {
      return id === "898" ? "Seasonal Unlimited" : id === "899" ? "Season-Lock" : "Flex Service";
    }
    function ordersFor(themeName) {
      var v = themes[themeName] || themes["HVAC"];
      var A = ["var(--accent)", "rgba(var(--accent-rgb),.12)"];
      var G = ["#1f8a44", "rgba(52,199,89,.16)"];
      var O = ["#ff8a3d", "rgba(255,159,10,.16)"];
      var B = ["#0e8fc4", "rgba(14,143,196,.16)"];
      var n = v.orderNames;
      var auto = "If we don\u2019t hear back by the deadline, the visit proceeds automatically per your contract.";
      return [
        { id: "#SV-2402", name: n[0], date: "Today", status: "inprogress", price: "$60", dot: O[0], iconBg: O[1], locationId: "home", y: 2026, m: 0, d: 15 },
        {
          id: "#SV-3312",
          name: n[1],
          date: "Tomorrow",
          status: "scheduled",
          price: "$94",
          dot: B[0],
          iconBg: B[1],
          locationId: "office",
          y: 2026,
          m: 0,
          d: 16,
          wt: v.wt ? { status: "pending", trigger: v.wt.trigger, detected: "Today \xB7 5:10 AM", deadline: "Today \xB7 8:00 PM", auto } : void 0
        },
        { id: "#SV-2410", name: n[2], date: "Jan 30", status: "scheduled", price: "$120", dot: A[0], iconBg: A[1], locationId: "home", y: 2026, m: 0, d: 30 },
        { id: "#SV-2381", name: n[3], date: "Jan 12", status: "completed", price: "$480", dot: G[0], iconBg: G[1], locationId: "home", y: 2026, m: 0, d: 12, photos: true },
        {
          id: "#SV-3290",
          name: n[1],
          date: "Jan 5",
          status: "completed",
          price: "$94",
          dot: B[0],
          iconBg: B[1],
          locationId: "office",
          y: 2026,
          m: 0,
          d: 5,
          photos: true,
          wt: v.wt ? { status: "auto", trigger: v.wt.past, detected: "Jan 5 \xB7 4:46 AM", deadline: "Jan 5 \xB7 7:00 AM", sla: v.wt.sla } : void 0
        },
        { id: "#SV-2356", name: n[4], date: "Oct 24", status: "completed", price: "$45", dot: G[0], iconBg: G[1], locationId: "office", y: 2025, m: 9, d: 24 }
      ];
    }
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
          { date: "Mon", dateSub: "Jan 12", weather: { state: "served", label: v.wt.past, temp: "\u22124\xB0C" }, events: [
            { type: s0, status: "completed", time: "7:38 AM", photos: true },
            { type: s1, status: "completed", time: "8:51 AM" }
          ] },
          { date: "Wed", dateSub: "Jan 14", weather: { state: "clear", label: "Clear \xB7 below service trigger", temp: "\u22121\xB0C" }, events: [
            { type: s0, status: "skipped", note: "Below trigger \u2014 visit not required" }
          ] },
          { date: "Today", dateSub: "Jan 15", today: true, weather: { state: "watch", label: "Storm watch \u2014 service likely tonight", temp: "\u22126\xB0C" }, events: [
            { type: s0, status: "onroute", time: "ETA 2:40 PM", tech: "Daniel R." }
          ] },
          { date: "Thu", dateSub: "Jan 16", needsAccess: true, weather: { state: "expected", label: v.wt.trigger, temp: "\u22128\xB0C" }, events: [
            { type: s0, status: "scheduled", trigger: true },
            { type: s1, status: "scheduled", trigger: true }
          ] },
          { date: "Sat", dateSub: "Jan 18", weather: { state: "expected", label: "Weather trigger possible", temp: "\u22123\xB0C" }, events: [
            { type: s1, status: "delayed", note: "Rescheduled from Fri \u2014 crew capacity" }
          ] }
        ]
      };
    }
    var spa = {
      brand: "Calm Harbor Spa",
      /* long-name / long-label review scenario (dev toolbar "name") */
      longCustomer: { first: "Anna-Katarina", greeting: "Good afternoon, Anna-Katarina", fullName: "Anna-Katarina Villanueva-\xD6str\xF6m" },
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
          salon: { id: "appt-ch-10318", service: "Facial treatment", specialist: "Alina V.", date: "Tue, Jul 21", time: "2:00\u20133:00 PM", mode: "salon", location: "Harbor Front studio \xB7 Room 2", status: "Confirmed", price: "$85", ref: "APT-10318" },
          home: { id: "appt-ch-10322", service: "Gel manicure", specialist: "Dana P.", date: "Wed, Jul 22", time: "11:00 AM\u201312:00 PM", mode: "home", location: "Address on file", status: "Confirmed", price: "$45", ref: "APT-10322" },
          long: { id: "appt-ch-10330", service: "Signature deep-renewal ritual with warm-stone massage and extended aromatherapy", specialist: "Alexandra-Marguerite Konstantinidou-Vandermeer", date: "Thu, Jul 30", time: "1:00\u20133:30 PM", mode: "salon", location: "Harbor Front studio \xB7 Quiet wing, Room 5", status: "Needs confirmation", price: "$310", ref: "APT-10330-SIGNATURE-RITUAL" },
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
    var spaCommerce = {
      /* Account overview entries. `availability` is decided by the PAGE from
         capability config — this is only the customer-safe copy per state. */
      accountEntries: [
        {
          key: "purchases",
          route: "purchases.list",
          action: "account.openPurchases",
          title: "Purchases",
          desc: "Everything you\u2019ve ordered \u2014 services, shop items and plans, with their current state.",
          unavailableDesc: "Purchase history with customer statuses isn\u2019t available on this portal yet. Your raw order records are on the Orders page."
        },
        {
          key: "plan",
          route: "plan",
          action: "account.openPlan",
          title: "My plan",
          desc: "Your packages and membership \u2014 remaining visits, renewal and valid actions.",
          unavailableDesc: "Plan and membership balances aren\u2019t connected yet. Published membership options are in Services & prices."
        },
        {
          key: "profile",
          route: "profile",
          action: "account.openProfile",
          title: "Profile",
          desc: "Your contact details and preferences.",
          unavailableDesc: "Profile editing isn\u2019t connected yet \u2014 our team can update your details for you."
        },
        {
          key: "support",
          route: null,
          action: "support.open",
          title: "Support",
          desc: "Get help with a visit, an order or your plan.",
          unavailableDesc: "A support destination hasn\u2019t been set up for this portal yet."
        }
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
          { ref: "pur-9f27a1", reference: "CH-2417", kind: "SERVICE", customerStatus: "Confirmed", placedAt: "Jul 12, 2026", displayTotal: "$85.00", currency: "USD", itemSummary: "Facial treatment \xB7 books your Jul 21 visit", attention: null },
          { ref: "pur-52e88d", reference: "CH-2409", kind: "RETAIL", customerStatus: "Ready for pickup", placedAt: "Jul 8, 2026", displayTotal: "$88.56", currency: "USD", itemSummary: "2 shop items \xB7 pickup", attention: "Ready \u2014 please pick up by Jul 22" },
          { ref: "pur-3d76c2", reference: "CH-2371", kind: "MIXED", customerStatus: "In progress", placedAt: "Jun 28, 2026", displayTotal: "$131.40", currency: "USD", itemSummary: "Gel manicure + 2 shop items", attention: null },
          { ref: "pur-b104fe", reference: "CH-2350", kind: "PACKAGE", customerStatus: "Fulfilled", placedAt: "Jun 14, 2026", displayTotal: "$510.00", currency: "USD", itemSummary: "Six-visit facial series", attention: null },
          { ref: "pur-64c913", reference: "CH-2334", kind: "RETAIL", customerStatus: "Fulfilled", placedAt: "Jun 2, 2026", displayTotal: "$73.44", currency: "USD", itemSummary: "2 shop items \xB7 picked up Jun 4", attention: null },
          { ref: "pur-1a45e0", reference: "CH-2242", kind: "MEMBERSHIP", customerStatus: "Confirmed", placedAt: "May 1, 2026", displayTotal: "$129.00", currency: "USD", itemSummary: "Harbor membership \xB7 monthly", attention: null }
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
          ref: "pur-9f27a1",
          reference: "CH-2417",
          kind: "SERVICE",
          customerStatus: "Confirmed",
          placedAt: "Jul 12, 2026",
          version: "v2",
          lines: [{ ref: "pln-4ac1", kind: "SERVICE", title: "Facial treatment", variant: null, quantity: 1, displayUnitPrice: "$85.00", displayTotal: "$85.00" }],
          money: { subtotal: "$85.00", tax: "$0.00", total: "$85.00", currency: "USD" },
          paymentMode: "SIMULATED",
          fulfillment: null,
          relatedAppointments: [{ ref: "appt-ch-10318", service: "Facial treatment", start: "Tue, Jul 21 \xB7 2:00\u20133:00 PM", customerStatus: "Confirmed" }],
          relatedPlan: null,
          allowedActions: ["openAppointment"]
        },
        "pur-52e88d": {
          ref: "pur-52e88d",
          reference: "CH-2409",
          kind: "RETAIL",
          customerStatus: "Ready for pickup",
          placedAt: "Jul 8, 2026",
          version: "v3",
          lines: [
            { ref: "pln-b210", kind: "RETAIL", title: "Silk Repair Set", variant: null, quantity: 1, displayUnitPrice: "$64.00", displayTotal: "$64.00" },
            { ref: "pln-b211", kind: "RETAIL", title: "Gel Removal Kit", variant: null, quantity: 1, displayUnitPrice: "$18.00", displayTotal: "$18.00" }
          ],
          money: { subtotal: "$82.00", tax: "$6.56", total: "$88.56", currency: "USD" },
          paymentMode: "SIMULATED",
          fulfillment: { kind: "PICKUP", status: "Ready for pickup", pickupWindow: "Until Jul 22 \xB7 10:00 AM\u20136:00 PM", note: "Harbor Front studio front desk" },
          relatedAppointments: [],
          relatedPlan: null,
          allowedActions: ["cancelRequest"]
        },
        "pur-3d76c2": {
          ref: "pur-3d76c2",
          reference: "CH-2371",
          kind: "MIXED",
          customerStatus: "In progress",
          placedAt: "Jun 28, 2026",
          version: "v5",
          groups: [{ label: "Service", lines: ["pln-c310"] }, { label: "Pickup items", lines: ["pln-c311", "pln-c312"] }],
          lines: [
            { ref: "pln-c310", kind: "SERVICE", title: "Gel manicure", variant: null, quantity: 1, displayUnitPrice: "$45.00", displayTotal: "$45.00" },
            { ref: "pln-c311", kind: "RETAIL", title: "Hydration Serum", variant: null, quantity: 1, displayUnitPrice: "$46.00", displayTotal: "$46.00" },
            { ref: "pln-c312", kind: "RETAIL", title: "Overnight Mask", variant: null, quantity: 1, displayUnitPrice: "$34.00", displayTotal: "$34.00" }
          ],
          money: { subtotal: "$125.00", tax: "$6.40", total: "$131.40", currency: "USD" },
          paymentMode: "SIMULATED",
          fulfillment: { kind: "PICKUP", status: "Being prepared", pickupWindow: null, note: "We\u2019ll let you know when your items are ready" },
          relatedAppointments: [{ ref: "appt-ch-10322", service: "Gel manicure", start: "Wed, Jul 22 \xB7 11:00 AM\u201312:00 PM", customerStatus: "Confirmed" }],
          relatedPlan: null,
          allowedActions: ["openAppointment"]
        },
        "pur-b104fe": {
          ref: "pur-b104fe",
          reference: "CH-2350",
          kind: "PACKAGE",
          customerStatus: "Fulfilled",
          placedAt: "Jun 14, 2026",
          version: "v1",
          lines: [{ ref: "pln-d410", kind: "PLAN", title: "Six-visit facial series", variant: null, quantity: 1, displayUnitPrice: "$510.00", displayTotal: "$510.00" }],
          money: { subtotal: "$510.00", tax: "$0.00", total: "$510.00", currency: "USD" },
          paymentMode: "SIMULATED",
          fulfillment: { kind: "ENTITLEMENT", status: "Credits granted", pickupWindow: null, note: "Visit credits were added to your plan" },
          relatedAppointments: [],
          relatedPlan: { ref: "plan-4e19c3", kind: "PACKAGE", status: "Active", title: "Six-visit facial series" },
          allowedActions: ["buyAgain"]
        },
        "pur-64c913": {
          ref: "pur-64c913",
          reference: "CH-2334",
          kind: "RETAIL",
          customerStatus: "Fulfilled",
          placedAt: "Jun 2, 2026",
          version: "v4",
          lines: [
            { ref: "pln-e510", kind: "RETAIL", title: "Hydration Serum", variant: null, quantity: 1, displayUnitPrice: "$46.00", displayTotal: "$46.00", returnable: true },
            { ref: "pln-e511", kind: "RETAIL", title: "Cuticle Care Kit", variant: null, quantity: 1, displayUnitPrice: "$22.00", displayTotal: "$22.00", returnable: true }
          ],
          money: { subtotal: "$68.00", tax: "$5.44", total: "$73.44", currency: "USD" },
          paymentMode: "SIMULATED",
          fulfillment: { kind: "PICKUP", status: "Picked up Jun 4", pickupWindow: null, note: null },
          relatedAppointments: [],
          relatedPlan: null,
          allowedActions: ["returnRequest", "buyAgain"]
        },
        "pur-1a45e0": {
          ref: "pur-1a45e0",
          reference: "CH-2242",
          kind: "MEMBERSHIP",
          customerStatus: "Confirmed",
          placedAt: "May 1, 2026",
          version: "v1",
          lines: [{ ref: "pln-f610", kind: "PLAN", title: "Harbor membership", variant: "Monthly", quantity: 1, displayUnitPrice: "$129.00", displayTotal: "$129.00" }],
          money: { subtotal: "$129.00", tax: "$0.00", total: "$129.00", currency: "USD" },
          paymentMode: "SIMULATED",
          fulfillment: { kind: "ENTITLEMENT", status: "Membership active", pickupWindow: null, note: "Renews monthly \u2014 manage it under My plan" },
          relatedAppointments: [],
          relatedPlan: { ref: "plan-8b02d7", kind: "MEMBERSHIP", status: "Active", title: "Harbor membership" },
          allowedActions: []
        },
        "pur-77d20b": {
          ref: "pur-77d20b",
          reference: "CH-2168",
          kind: "SERVICE",
          customerStatus: "Fulfilled",
          placedAt: "Apr 2, 2026",
          version: "v2",
          lines: [{ ref: "pln-g710", kind: "SERVICE", title: "Hair styling", variant: null, quantity: 1, displayUnitPrice: "$65.00", displayTotal: "$65.00" }],
          money: { subtotal: "$65.00", tax: "$0.00", total: "$65.00", currency: "USD" },
          paymentMode: "SIMULATED",
          fulfillment: null,
          relatedAppointments: [{ ref: "appt-ch-10203", service: "Facial treatment", start: "Jun 30", customerStatus: "Completed" }],
          relatedPlan: null,
          allowedActions: []
        },
        "pur-08c5b7": {
          ref: "pur-08c5b7",
          reference: "CH-2104",
          kind: "RETAIL",
          customerStatus: "Cancelled",
          placedAt: "Mar 19, 2026",
          version: "v2",
          lines: [{ ref: "pln-h810", kind: "RETAIL", title: "Heat Shield Spray", variant: "150 ml", quantity: 1, displayUnitPrice: "$28.00", displayTotal: "$28.00" }],
          money: { subtotal: "$28.00", tax: "$2.24", total: "$30.24", currency: "USD" },
          paymentMode: "SIMULATED",
          fulfillment: { kind: "PICKUP", status: "Cancelled before pickup", pickupWindow: null, note: null },
          relatedAppointments: [],
          relatedPlan: null,
          allowedActions: ["buyAgain"]
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
        "appt-ch-10318": { ref: "appt-ch-10318", service: "Facial treatment", customerStatus: "Confirmed", start: "Tue, Jul 21 \xB7 2:00\u20133:00 PM", timezoneNote: "local time", specialist: "Alina V.", visitMode: "salon", location: "Harbor Front studio \xB7 Room 2", displayPrice: "$85", reference: "APT-10318", attention: "Free rescheduling and cancellation for this visit until Jul 20, 6:00 PM \u2014 after that the studio\u2019s policy applies.", relatedPurchaseRef: "pur-9f27a1", allowedActions: ["reschedule", "cancel", "openPurchase"], version: "a3" },
        "appt-ch-10322": { ref: "appt-ch-10322", service: "Gel manicure", customerStatus: "Confirmed", start: "Wed, Jul 22 \xB7 11:00 AM\u201312:00 PM", timezoneNote: "local time", specialist: "Dana P.", visitMode: "home", location: "Address on file", displayPrice: "$45", reference: "APT-10322", attention: "Your specialist brings a sanitised, sealed kit \u2014 just have a clear table spot ready.", relatedPurchaseRef: "pur-3d76c2", allowedActions: ["reschedule", "cancel", "openPurchase"], version: "a1" },
        "appt-ch-10334": { ref: "appt-ch-10334", service: "Facial treatment", customerStatus: "Confirmed", start: "Fri, Jul 24 \xB7 4:00 PM", timezoneNote: "local time", specialist: null, visitMode: "salon", location: null, displayPrice: null, reference: "APT-10334", attention: null, relatedPurchaseRef: null, allowedActions: ["cancel"], version: "a1" },
        "appt-ch-10330": { ref: "appt-ch-10330", service: "Signature deep-renewal ritual with warm-stone massage and extended aromatherapy", customerStatus: "Needs confirmation", start: "Thu, Jul 30 \xB7 1:00\u20133:30 PM", timezoneNote: "local time", specialist: "Alexandra-Marguerite Konstantinidou-Vandermeer", visitMode: "salon", location: "Harbor Front studio \xB7 Quiet wing, Room 5", displayPrice: "$310", reference: "APT-10330-SIGNATURE-RITUAL", attention: "The studio still needs to confirm this time \u2014 you\u2019ll hear from us within a day. Nothing is charged either way.", relatedPurchaseRef: null, allowedActions: ["reschedule", "cancel"], version: "a1" },
        "appt-ch-10340": { ref: "appt-ch-10340", service: "Hair styling", customerStatus: "Confirmed", start: "Tue, Aug 4 \xB7 2:00 PM", timezoneNote: "local time", specialist: "Alina V.", visitMode: "salon", location: "Harbor Front studio", displayPrice: "$65", reference: "APT-10340", attention: null, relatedPurchaseRef: null, allowedActions: ["reschedule", "cancel"], version: "a2" },
        "appt-ch-10351": { ref: "appt-ch-10351", service: "Manicure & nails", customerStatus: "Needs confirmation", start: "Fri, Aug 14 \xB7 11:00 AM", timezoneNote: "local time", specialist: null, visitMode: "home", location: "Address on file", displayPrice: "$45", reference: "APT-10351", attention: "The studio still needs to confirm this time \u2014 you\u2019ll hear from us within a day. Nothing is charged either way.", relatedPurchaseRef: null, allowedActions: ["cancel"], version: "a1" },
        "appt-ch-10203": { ref: "appt-ch-10203", service: "Facial treatment", customerStatus: "Completed", start: "Tue, Jun 30 \xB7 2:00 PM", timezoneNote: "local time", specialist: "Alina V.", visitMode: "salon", location: "Harbor Front studio", displayPrice: "$85", reference: "APT-10203", attention: null, relatedPurchaseRef: null, allowedActions: ["bookAgain"], version: "a4" },
        "appt-ch-10164": { ref: "appt-ch-10164", service: "Gel manicure", customerStatus: "Completed", start: "Fri, Jun 12 \xB7 11:00 AM", timezoneNote: "local time", specialist: "Dana P.", visitMode: "home", location: "Address on file", displayPrice: "$45", reference: "APT-10164", attention: null, relatedPurchaseRef: null, allowedActions: ["bookAgain"], version: "a2" },
        "appt-ch-10101": { ref: "appt-ch-10101", service: "Hair styling", customerStatus: "Cancelled", start: "Thu, May 28 \xB7 3:00 PM", timezoneNote: "local time", specialist: "Alina V.", visitMode: "salon", location: "Harbor Front studio", displayPrice: null, reference: "APT-10101", attention: "This visit was cancelled \u2014 nothing further is scheduled from it.", relatedPurchaseRef: null, allowedActions: ["bookAgain"], version: "a2" }
      },
      /* ============ WAVE 16 — Published plan offers (sellable contract) ====
         PUBLIC catalog offers — visually and semantically distinct from the
         customer's My plan. Only server-provided display price, terms summary,
         benefits and sellability render; the buy entry exists ONLY while the
         sellable-plan contract is open (data-plan-commerce="open") AND the
         offer's sellability is "sellable". */
      planOffers: [
        { ref: "off-pkg-4c21", kind: "PACKAGE", title: "Six-visit facial series", displayPrice: "$510.00", termsSummary: "6 facial visits \xB7 valid 12 months from purchase", benefits: ["Six full facial treatments", "Book each visit with a credit", "Credits never expire early"], sellability: "sellable", allowedActions: ["purchase"] },
        { ref: "off-mem-8d02", kind: "MEMBERSHIP", title: "Harbor membership", displayPrice: "$129.00 / month", termsSummary: "Renews monthly \xB7 cancel renewal anytime", benefits: ["Member pricing on every treatment", "Priority booking windows", "One guest pass per season"], sellability: "sellable", allowedActions: ["purchase"] }
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
          { ref: "ful-pickup", kind: "PICKUP", label: "Pickup \u2014 Harbor Front studio", detail: "Usually ready in 2 days \xB7 free" }
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
            displayTotals: { subtotal: "$510.00", tax: "$0.00", total: "$510.00" },
            recurringNote: null
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
        retail: {
          kind: "retail",
          headline: "Order confirmed",
          sub: "Demo checkout completed \u2014 no charge was made.",
          purchase: { ref: "pur-n3w001", reference: "CH-2431" },
          fulfillment: "Pickup \u2014 Harbor Front studio. We\u2019ll let you know when your items are ready.",
          appointment: null,
          plan: null
        },
        "appointment-and-order": {
          kind: "booking",
          headline: "Booking confirmed",
          sub: "Demo checkout completed \u2014 no charge was made.",
          purchase: { ref: "pur-n3w002", reference: "CH-2432" },
          appointment: { ref: "appt-ch-10360", service: "Facial treatment", start: "Tue, Jul 28 \xB7 2:00 PM", customerStatus: "Confirmed" },
          fulfillment: null,
          plan: null
        },
        "appointment-only": {
          kind: "booking",
          headline: "Booking confirmed",
          sub: "No charge was made \u2014 you pay at the studio as usual.",
          purchase: null,
          appointment: { ref: "appt-ch-10361", service: "Facial treatment", start: "Tue, Jul 28 \xB7 2:00 PM", customerStatus: "Confirmed" },
          fulfillment: null,
          plan: null
        },
        plan: {
          kind: "plan",
          headline: "Order confirmed",
          sub: "Demo checkout completed \u2014 no charge was made.",
          purchase: { ref: "pur-n3w003", reference: "CH-2433" },
          appointment: null,
          fulfillment: null,
          plan: { ref: "plan-n3w01", kind: "PACKAGE", title: "Six-visit facial series", status: "Active" }
        },
        /* wave 16 — membership enrollment (source plan, offer off-mem-8d02) */
        membership: {
          kind: "plan",
          headline: "Order confirmed",
          sub: "Demo checkout completed \u2014 no charge was made.",
          purchase: { ref: "pur-n3w004", reference: "CH-2434" },
          appointment: null,
          fulfillment: null,
          plan: { ref: "plan-n3w02", kind: "MEMBERSHIP", title: "Harbor membership", status: "Active" }
        },
        /* wave 16 — booking with a package credit (appointment only + plan readback) */
        credit: {
          kind: "booking",
          headline: "Booking confirmed",
          sub: "A package credit was used \u2014 no charge was made.",
          purchase: null,
          fulfillment: null,
          appointment: { ref: "appt-ch-10362", service: "Facial treatment", start: "Tue, Jul 28 \xB7 2:00 PM", customerStatus: "Confirmed" },
          plan: { ref: "plan-4e19c3", kind: "PACKAGE", title: "Six-visit facial series \u2014 3 of 6 visits left", status: "Active" }
        },
        /* wave 16 — reschedule readback: the ORIGINAL visit is only released here */
        reschedule: {
          kind: "booking",
          headline: "Booking confirmed",
          sub: "Your visit was moved \u2014 the previous time was released. No charge was made.",
          purchase: null,
          fulfillment: null,
          plan: null,
          appointment: { ref: "appt-ch-10318", service: "Facial treatment", start: "Tue, Jul 28 \xB7 2:00 PM", customerStatus: "Confirmed" }
        }
      }
    };
    var spaBooking = {
      ref: "bkg-7a31f2",
      version: "b1",
      paymentMode: "SIMULATED",
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
      reviewLocation: "Harbor Front studio",
      /* server review context for a NEW booking; reschedules keep the original visit's mode/location */
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
    var spaCartSeq = 0;
    function spaServerCart(lines) {
      var sub = 0;
      lines.forEach(function(l) {
        sub += l.cents * l.qty;
      });
      var tax = Math.round(sub * 0.08);
      var fmt = function(c) {
        return "$" + (c / 100).toFixed(2);
      };
      spaCartSeq += 1;
      return {
        version: "c" + spaCartSeq,
        lines: lines.map(function(l) {
          return Object.assign({}, l, { displayUnitPrice: fmt(l.cents), displayTotal: fmt(l.cents * l.qty) });
        }),
        displayTotals: lines.length ? { subtotal: fmt(sub), tax: fmt(tax), total: fmt(sub + tax) } : null,
        fulfillment: { kind: "PICKUP", label: "Pickup \u2014 Harbor Front studio", detail: "Usually ready in 2 days \xB7 free" }
      };
    }
    window.AircoveFixtures = {
      PAL,
      TINTS,
      themeSlugs,
      themes,
      statusMeta,
      technician,
      pstatus,
      customer,
      MONTHS,
      buildFeed,
      feedTabs,
      initialMessages,
      quickReplies,
      helpTopics,
      chatReply,
      stormCalendar,
      spa,
      spaCommerce,
      spaServerCart,
      spaBooking,
      spaProfileSrv,
      addresses,
      cards,
      proposal,
      proposalSites: proposalSites2,
      surfaceDefs,
      MOB_CLEAR,
      MOB_DEICE,
      planName,
      ordersFor
    };
  })();
  var F = window.AircoveFixtures;

  // app-templates/customer-portal/runtime/data/cases/calm-harbor-spa.js
  var accent = "#3f7d6a";
  var softAccent = "rgba(63,125,106,.14)";
  var calmHarborSpaFixture = Object.freeze({
    id: "calm-harbor-spa",
    organization: { name: "Calm Harbor Spa", locality: "Austin, Texas", mode: "fixture" },
    theme: {
      slug: "beauty",
      accent,
      hero: {
        badge: "Austin day spa \xB7 fixture organization",
        title: "A quieter reset, planned around you.",
        sub: "Massage, facial care, and slower rituals at Calm Harbor Spa. Your appointments and routine stay together in one portal."
      },
      svc: [
        { id: "chs-grounding-massage", name: "Grounding massage", price: "$145", tagline: "Restore pace, comfort, and ease", duration: "75 min", includes: ["Arrival consultation", "Full-body massage", "Aftercare recommendations"] },
        { id: "chs-custom-facial", name: "Custom facial", price: "$130", tagline: "Care shaped around today's skin", duration: "60 min", includes: ["Routine check-in", "Tailored facial care", "Home-care notes"] },
        { id: "chs-harbor-reset", name: "Harbor reset", price: "$245", tagline: "Massage and facial in one longer visit", duration: "135 min", includes: ["Grounding massage", "Custom facial", "Quiet reset time"] },
        { id: "chs-seasonal-body-ritual", name: "Seasonal body ritual", price: "$165", tagline: "A sensory full-body seasonal reset", duration: "90 min", includes: ["Seasonal body care", "Aroma journey", "Take-home ritual note"] }
      ],
      orderNames: ["Grounding massage", "Custom facial", "Harbor reset", "Seasonal body ritual"],
      wt: null,
      plan: {
        name: "Harbor Membership",
        plusName: "Harbor Ritual Membership",
        monthlyPrice: "$18",
        plusMonthlyPrice: "$34",
        tag: "For a steadier self-care rhythm",
        desc: "Priority routine booking and member care notes in your portal.",
        headline: "A membership for your reset rhythm",
        features: ["Priority routine booking", "One seasonal care note each month", "Member treatment add-ons", "Routine history in one place"],
        plusFeatures: ["Two ritual credits a month", "Priority with your preferred specialist", "Member retail benefits", "Longer seasonal planning visit"]
      },
      feat: {
        badge: "Fixture retail catalog",
        title: "Harbor body oil for your at-home ritual",
        desc: "A fixture retail product linked to Calm Harbor's aftercare routine.",
        cta: "Add to cart \xB7 $42",
        fin: "Fixture checkout only"
      },
      cats: [{ key: "body", label: "Body care" }, { key: "bath", label: "Bath" }, { key: "skin", label: "Skin" }],
      products: [
        { id: "chs-body-oil", sku: "CHS-BODY-001", cat: "body", tag: "Body care", name: "Harbor body oil", blurb: "A quiet finish after bath or massage", price: "$42", priceNum: 42 },
        { id: "chs-bath-soak", sku: "CHS-BATH-001", cat: "bath", tag: "Bath", name: "Mineral bath soak", blurb: "A slow evening reset", price: "$28", priceNum: 28 },
        { id: "chs-body-cream", sku: "CHS-BODY-002", cat: "body", tag: "Body care", name: "Restorative body cream", blurb: "Daily comfort for dry skin", price: "$36", priceNum: 36 },
        { id: "chs-cleansing-balm", sku: "CHS-SKIN-001", cat: "skin", tag: "Skin", name: "Gentle cleansing balm", blurb: "First step in an unhurried evening routine", price: "$34", priceNum: 34 },
        { id: "chs-hydration-mist", sku: "CHS-SKIN-002", cat: "skin", tag: "Skin", name: "Hydration mist", blurb: "A light layer between visits", price: "$26", priceNum: 26 }
      ],
      reminder: { title: "Your next reset is coming up", desc: "A custom facial is scheduled for tomorrow." },
      checkout: { emptyCart: "Your ritual cart is empty", emptyCartDescription: "Browse Calm Harbor aftercare products.", fulfillmentNote: "Fixture checkout records the order in this Calm Harbor demo only." }
    },
    customer: {
      firstName: "Elena",
      greeting: "Good afternoon, Elena",
      subline: "One treatment today \xB7 next ritual tomorrow",
      fullName: "Elena Rios",
      phone: "+1 (512) 555-0182",
      email: "elena.rios@example.test",
      memberSince: "2025",
      stats: { orders: "8", spent: "$1,084", savings: "$96" }
    },
    addresses: [
      { id: "home", label: "Home", line: "1407 Garden Street", city: "Austin, TX 78703", dot: accent, iconBg: softAccent },
      { id: "studio", label: "Calm Harbor Spa", line: "214 Westfield Lane", city: "Austin, TX 78703", dot: "#b06b45", iconBg: "rgba(176,107,69,.14)" }
    ],
    cards: [{ id: "visa", brand: "Visa", last4: "0198", exp: "09/28" }],
    technician: { name: "Maya Chen", role: "Senior massage therapist", rating: "4.9", visits: "24 visits with you", eta: "arriving in ~12 min" },
    statusMeta: {
      inprogress: { badge: "accent", label: "In progress" },
      scheduled: { badge: "info", label: "Scheduled" },
      completed: { badge: "ok", label: "Completed" },
      cancelled: { badge: "danger", label: "Cancelled" }
    },
    orders: [
      { id: "#CHS-1042", name: "Grounding massage", date: "Today \xB7 2:30 PM", status: "inprogress", price: "$145", dot: "#b06b45", iconBg: "rgba(176,107,69,.14)", locationId: "studio", y: 2026, m: 0, d: 15, slot: "2:30 PM", serviceName: "Grounding massage", timeline: ["Appointment confirmed", "Maya checked in", "Treatment in progress"] },
      { id: "#CHS-1050", name: "Custom facial", date: "Tomorrow \xB7 11:00 AM", status: "scheduled", price: "$130", dot: accent, iconBg: softAccent, locationId: "studio", y: 2026, m: 0, d: 16, slot: "11:00 AM", serviceName: "Custom facial", timeline: ["Appointment confirmed", "Practitioner assignment pending"] },
      { id: "#CHS-1008", name: "Harbor reset", date: "Jan 8", status: "completed", price: "$245", dot: "#1f8a44", iconBg: "rgba(52,199,89,.16)", locationId: "studio", y: 2026, m: 0, d: 8, slot: "10:00 AM", serviceName: "Harbor reset", timeline: ["Appointment completed", "Aftercare routine saved"] },
      { id: "#CHS-0987", name: "Seasonal body ritual", date: "Dec 14", status: "completed", price: "$165", dot: "#1f8a44", iconBg: "rgba(52,199,89,.16)", locationId: "studio", y: 2025, m: 11, d: 14, slot: "4:00 PM", serviceName: "Seasonal body ritual", timeline: ["Appointment completed", "Seasonal care note saved"] }
    ],
    prefs: { receipts: true, sms: true, marketing: false },
    initialMessages: [{ from: "agent", text: "Hi Elena, I'm Nina at Calm Harbor. I can help with your appointments, routine, or retail order." }],
    quickReplies: ["Today's appointment", "Move my facial", "Retail order question", "Talk to the studio"],
    helpTopics: [
      { label: "Today's appointment", dot: accent, iconBg: softAccent, q: "Tell me about today's appointment" },
      { label: "Move or cancel an appointment", dot: "#1f8a44", iconBg: "rgba(52,199,89,.16)", q: "I need to change an appointment" },
      { label: "Membership and credits", dot: "#b06b45", iconBg: "rgba(176,107,69,.14)", q: "I have a membership question" },
      { label: "Retail order support", dot: "#7a52e0", iconBg: "rgba(122,82,224,.16)", q: "I need help with a retail order" }
    ],
    feedTabs: [{ key: "all", label: "All" }, { key: "appointments", label: "Appointments" }, { key: "billing", label: "Billing" }, { key: "routine", label: "Routine" }],
    activity: [
      { day: "Today", items: [
        { type: "appointments", title: "Maya is ready for you", desc: "Grounding massage \xB7 Calm Harbor Spa \xB7 2:30 PM", time: "2:18 PM", dot: accent, iconBg: softAccent, action: "View appointment", act: "orders", unread: true },
        { type: "routine", title: "Your aftercare note is ready", desc: "Open your routine after today's treatment.", time: "9:10 AM", dot: "#b06b45", iconBg: "rgba(176,107,69,.14)", action: "Open routine", act: "care" }
      ] },
      { day: "Yesterday", items: [
        { type: "appointments", title: "Custom facial confirmed", desc: "Tomorrow \xB7 11:00 AM \xB7 Maya will review your current routine.", time: "4:22 PM", dot: accent, iconBg: softAccent, action: "View appointment", act: "orders" },
        { type: "billing", title: "Retail order delivered", desc: "Mineral bath soak and hydration mist \xB7 fixture order #CHS-R-122", time: "1:40 PM", dot: "#1f8a44", iconBg: "rgba(52,199,89,.16)", action: "Browse products", act: "products" }
      ] },
      { day: "Earlier this week", items: [
        { type: "routine", title: "Membership care note", desc: "Your Harbor Membership renewal is coming up next month.", time: "Mon", dot: "#7a52e0", iconBg: "rgba(122,82,224,.16)", action: "View membership", act: "pricing" }
      ] }
    ],
    support: { agentName: "Nina", label: "Calm Harbor Support", ticket: "CHS-104", availability: "Studio support \xB7 replies during open hours" },
    care: {
      kind: "beautyCare",
      navLabel: "My routine",
      empty: { glyph: "\u2726", title: "No routine yet", desc: "After your first Calm Harbor visit, appointments and care notes appear here." },
      title: "Your routine",
      sub: "Appointments, ritual progress, preferred specialists, tasks, and aftercare in one place.",
      appointment: { id: "appt-chs-1050", name: "Custom facial", specialistId: "spec-chs-maya", specialist: "Maya Chen, skin and massage therapist", when: "Tomorrow \xB7 Jan 16 \xB7 11:00 AM", where: "Calm Harbor Spa \xB7 Austin", orderId: "#CHS-1050", prep: "Arrive a few minutes early and let Maya know about any routine changes." },
      pkg: { id: "pkg-chs-reset-2026", name: "Harbor reset series", detail: "4 rituals \xB7 active through Jun 2026", used: 1, total: 4, next: "Your next included ritual is ready to schedule after the booking contract opens." },
      specialists: [
        { id: "spec-chs-maya", name: "Maya Chen", role: "Massage and facial care", rating: "4.9", visits: "5 visits with you" },
        { id: "spec-chs-lena", name: "Lena Ortiz", role: "Body rituals", rating: "4.8", visits: "New to you" }
      ],
      preferredId: "spec-chs-maya",
      history: [
        { date: "Jan 8", what: "Harbor reset", who: "Maya Chen", note: "Aftercare note saved to your routine." },
        { date: "Dec 14", what: "Seasonal body ritual", who: "Lena Ortiz", note: "Evening bath ritual recommended twice a week." },
        { date: "Nov 22", what: "Custom facial", who: "Maya Chen", note: "Keep the routine simple and use gentle cleansing." }
      ],
      tasks: [
        { id: "task-chs-intake", label: "Complete your facial check-in", due: "before tomorrow", done: false },
        { id: "task-chs-routine", label: "Save your aftercare note", due: "after today's treatment", done: false },
        { id: "task-chs-membership", label: "Review your ritual credit", due: "this month", done: true }
      ],
      routine: { title: "Between visits", note: "Use gentle cleansing in the evening and take a slower bath ritual when it fits your week.", by: "Set with Maya Chen \xB7 Jan 8" },
      loyalty: { id: "plan-chs-member-2026", tier: "Harbor member", points: 280, nextAt: 400, reward: "A seasonal add-on at 400 pts", renews: "Renews Feb 1, 2026" },
      productRecs: { note: "Saved from your Calm Harbor aftercare routine", names: ["Harbor body oil", "Gentle cleansing balm", "Hydration mist"] }
    }
  });

  // app-templates/customer-portal/runtime/data/case-fixtures.js
  var cases = Object.freeze({ "calm-harbor-spa": calmHarborSpaFixture });
  var knownCaseIds = Object.freeze(Object.keys(cases));
  function caseFixtureFor(caseId) {
    return cases[String(caseId || "")] || null;
  }
  function cloneCaseValue(value) {
    return JSON.parse(JSON.stringify(value));
  }

  // app-templates/customer-portal/runtime/src/config.js
  var portalProfiles = {
    onDemand: {
      id: "onDemand",
      nav: [
        { key: "orders.list", label: "Orders" },
        { key: "care" },
        { key: "proposals.list", label: "Proposals" },
        { key: "services", label: "Services" },
        { key: "pricing", label: "Pricing" },
        { key: "products", label: "Products" },
        { key: "support", label: "Support" }
      ],
      primary: { label: "+ Book", action: "booking.open" },
      modules: ["orders", "calendar", "activity", "proposals", "care", "services", "pricing", "products", "checkout", "profile", "support"],
      weatherCalendar: false,
      showCart: true,
      drawerTitle: "Book a service"
    },
    stormOps: {
      id: "stormOps",
      nav: [
        { key: "orders.list", label: "Home" },
        { key: "calendar", label: "Calendar" },
        { key: "care" },
        { key: "proposals.list", label: "Contracts" },
        { key: "services", label: "Services" },
        { key: "activity", label: "Activity" },
        { key: "support", label: "Support" }
      ],
      primary: { label: "Request service", action: "service.request" },
      modules: ["orders", "calendar", "activity", "proposals", "care", "services", "profile", "support"],
      weatherCalendar: true,
      showCart: false,
      drawerTitle: "Request service"
    },
    appointments: {
      id: "appointments",
      nav: [
        { key: "orders.list", label: "Appointments" },
        { key: "calendar", label: "Calendar" },
        { key: "care" },
        { key: "services", label: "Services" },
        { key: "pricing", label: "Pricing" },
        { key: "products", label: "Products" },
        { key: "support", label: "Support" }
      ],
      primary: { label: "+ Book", action: "booking.open" },
      modules: ["orders", "calendar", "care", "services", "pricing", "products", "checkout", "profile", "support"],
      weatherCalendar: false,
      showCart: true,
      drawerTitle: "Book an appointment"
    },
    spaStaging: {
      id: "spaStaging",
      nav: [
        { key: "orders.list", label: "Orders" },
        { key: "services", label: "Services & prices" },
        { key: "products", label: "Shop", secondary: true },
        { key: "account", label: "Account" }
      ],
      primary: { label: "Browse services", action: "nav.go" },
      modules: ["orders", "services", "pricing", "products", "account"],
      weatherCalendar: false,
      showCart: false,
      drawerTitle: "Book an appointment"
    },
    spaTarget: {
      id: "spaTarget",
      nav: [
        { key: "orders.list", label: "Appointments" },
        { key: "services", label: "Services & prices" },
        { key: "products", label: "Shop", secondary: true },
        { key: "account", label: "Account" }
      ],
      primary: { label: "+ Book", action: "booking.open" },
      modules: ["appointments", "orders", "services", "pricing", "products", "account", "purchases", "plan", "cart", "checkout", "profile"],
      weatherCalendar: false,
      showCart: false,
      drawerTitle: "Book an appointment"
    }
  };
  var verticalProfiles = {
    hvac: vertical("hvac", "HVAC", "onDemand", "Equipment"),
    snow: vertical("snow", "Snow Removal", "stormOps", "Season log"),
    lawn: vertical("lawn", "Lawn & Garden", "stormOps", "Program"),
    pool: vertical("pool", "Pool & Spa", "stormOps", "Water"),
    roofing: vertical("roofing", "Roofing", "stormOps", "Roof report"),
    pest: vertical("pest", "Pest Control", "stormOps", "Monitoring"),
    health: vertical("health", "Health", "appointments", "Care plan", false),
    beauty: vertical("beauty", "Beauty", "spaStaging", "My routine", false)
  };
  var routeRegistry = {
    landing: { id: "landing", path: "/", module: "landing", public: true },
    "seo.landing": { id: "seo.landing", path: "/seo-preview", module: "seo-parity", public: true, parityOnly: true },
    "auth.oidc": { id: "auth.oidc", path: "/login", module: "auth", public: true },
    "auth.phone": { id: "auth.phone", path: "/login/phone-reference", module: "auth", public: true },
    "auth.code": { id: "auth.code", path: "/login/verify", module: "auth", public: true },
    "orders.list": { id: "orders.list", path: "/orders", module: "orders" },
    "order.detail": { id: "order.detail", path: "/orders/:id", module: "orders", param: "id" },
    "appointment.detail": { id: "appointment.detail", path: "/appointments/:id", module: "appointments", param: "id" },
    calendar: { id: "calendar", path: "/calendar", module: "calendar" },
    activity: { id: "activity", path: "/activity", module: "activity" },
    services: { id: "services", path: "/services", module: "services" },
    pricing: { id: "pricing", path: "/pricing", module: "pricing" },
    products: { id: "products", path: "/products", module: "products" },
    checkout: { id: "checkout", path: "/checkout", module: "checkout" },
    account: { id: "account", path: "/account", module: "account" },
    "purchases.list": { id: "purchases.list", path: "/purchases", module: "purchases" },
    "purchase.detail": { id: "purchase.detail", path: "/purchases/:id", module: "purchases", param: "id" },
    plan: { id: "plan", path: "/account/plan", module: "plan" },
    cart: { id: "cart", path: "/cart", module: "cart" },
    "proposals.list": { id: "proposals.list", path: "/proposals", module: "proposals" },
    "proposal.detail": { id: "proposal.detail", path: "/proposals/:id", module: "proposals", param: "id" },
    profile: { id: "profile", path: "/profile", module: "profile" },
    support: { id: "support", path: "/support", module: "support" },
    care: { id: "care", path: "/care", module: "care", access: "care" }
  };
  var routeMatchers = Object.values(routeRegistry).map(function(route) {
    var names = [];
    var pattern = route.path.split("/").map(function(segment) {
      if (segment.charAt(0) !== ":") return escapeRegExp(segment);
      names.push(segment.slice(1));
      return "([^/]+)";
    }).join("/");
    return { route, names, expression: new RegExp("^" + pattern + "/?$") };
  });
  function matchRoutePath(pathname) {
    var cleanPath = String(pathname || "/").split(/[?#]/, 1)[0] || "/";
    for (var i = 0; i < routeMatchers.length; i += 1) {
      var matcher = routeMatchers[i];
      var match = cleanPath.match(matcher.expression);
      if (!match) continue;
      var params = {};
      try {
        matcher.names.forEach(function(name, index) {
          params[name] = decodeURIComponent(match[index + 1]);
        });
      } catch (_) {
        return null;
      }
      return { id: matcher.route.id, params };
    }
    return null;
  }
  function normalizeVertical(value) {
    if (!value) return "hvac";
    var normalized = String(value).trim().toLowerCase();
    if (verticalProfiles[normalized]) return normalized;
    var match = Object.values(verticalProfiles).find(function(profile) {
      return profile.displayName.toLowerCase() === normalized;
    });
    return match ? match.slug : "hvac";
  }
  function resolveProfile(vertical2, requestedProfile) {
    var verticalConfig = verticalProfiles[vertical2] || verticalProfiles.hvac;
    var candidate = portalProfiles[requestedProfile] ? requestedProfile : verticalConfig.profile;
    if (portalProfiles[candidate].weatherCalendar && !verticalConfig.weather) return verticalConfig.profile;
    return candidate;
  }
  function readPortalConfig(root) {
    var dataset = root ? root.dataset : {};
    var vertical2 = normalizeVertical(dataset.portalVertical);
    var theme = normalizeVertical(dataset.portalTheme || vertical2);
    var verticalConfig = verticalProfiles[vertical2];
    var enabledModules = splitList(dataset.portalEnabledModules);
    var profile = resolveProfile(vertical2, dataset.portalProfile);
    var dataMode = allowed(dataset.portalDataMode, ["fixture", "live"], "fixture");
    var caseId = dataMode === "fixture" && caseFixtureFor(dataset.portalCase) ? dataset.portalCase : "";
    if (caseId && vertical2 !== "beauty") caseId = "";
    return {
      vertical: vertical2,
      theme,
      profile,
      capability: allowed(dataset.portalCapability, ["current-staging", "target-appointments"], "current-staging"),
      booking: allowed(dataset.portalBooking, ["closed", "open"], "closed"),
      retail: allowed(dataset.portalRetail, ["browse-only", "retail-commerce-open"], "browse-only"),
      planCommerce: allowed(dataset.portalPlanCommerce, ["closed", "open"], "closed"),
      demoCommands: allowed(dataset.portalDemoCommands, ["closed", "current-api"], "closed"),
      organization: dataset.portalOrganization || dataset.portalPimOrganization || "SERVICEWAND",
      coreApiBase: dataset.portalCoreApiBase || "/core",
      accountApiBase: dataset.portalAccountApiBase || "/core-acct",
      billApiBase: dataset.portalBillApiBase || "/core-bill",
      serviceApiBase: dataset.portalServiceApiBase || "/core-svc",
      accountTypeCode: dataset.portalAccountTypeCode || "SPA_CUSTOMER",
      authCoreBase: dataset.portalAuthCoreBase || "/core",
      authCallbackPath: dataset.portalAuthCallbackPath || "/core/oauth2-callback.html",
      authReturnStorageKey: dataset.portalAuthReturnStorageKey || "oidc-return-url",
      authLogoutReturnStorageKey: dataset.portalAuthLogoutReturnStorageKey || "oidc-logout-return-url",
      routerMode: allowed(dataset.portalRouterMode, ["hash", "history", "memory"], "hash"),
      authMode: allowed(dataset.portalAuthMode, ["fixture", "required"], "fixture"),
      defaultRoute: routeRegistry[dataset.portalDefaultRoute] ? dataset.portalDefaultRoute : verticalConfig.defaultRoute,
      enabledModules: enabledModules.length ? enabledModules : portalProfiles[profile].modules.slice(),
      errorMode: allowed(dataset.portalErrorMode, ["error", "fallback"], "error"),
      dataMode,
      caseId,
      pimFixtureUrl: dataset.portalPimFixtureUrl || "",
      pimApiBase: dataset.portalPimApiBase || "/core-pim/api",
      pimOrganization: dataset.portalPimOrganization || "SERVICEWAND",
      pimProductTypeCode: dataset.portalPimProductTypeCode || "SERVICEWAND_SAAS",
      pimPricingProductTypeCodes: splitList(dataset.portalPimPricingProductTypeCodes),
      pimProductsProductTypeCodes: splitList(dataset.portalPimProductsProductTypeCodes),
      pimCurrency: dataset.portalPimCurrency || "CAD",
      pimPriceTypeCode: dataset.portalPimPriceTypeCode || "RECURRENT",
      pimPriceAttributeCode: dataset.portalPimPriceAttributeCode || "INTERVAL",
      pimPriceAttributeValues: splitList(dataset.portalPimPriceAttributeValues || "1"),
      pimCurrencyAttributeCode: dataset.portalPimCurrencyAttributeCode || "CURRENCY",
      pimCurrencyAttributeValues: splitList(dataset.portalPimCurrencyAttributeValues || dataset.portalPimCurrency || "CAD"),
      pimAmountAttributeCode: dataset.portalPimAmountAttributeCode || "AMOUNT_MINOR",
      pimAmountMinorDivisor: positiveNumber(dataset.portalPimAmountMinorDivisor, 100),
      pimCta: dataset.portalPimCta || "",
      defaultMode: allowed(dataset.portalDefaultMode, ["light", "dark"], "light")
    };
  }
  function routePath(routeId, params) {
    var route = routeRegistry[routeId];
    if (!route) return "/";
    var values = params || {};
    return route.path.replace(/:([a-zA-Z0-9_]+)/g, function(_, name) {
      if (values[name] === void 0 || values[name] === null || values[name] === "") {
        throw new Error("Missing route parameter " + name + " for " + routeId);
      }
      return encodeURIComponent(String(values[name]));
    });
  }
  function vertical(slug2, displayName, profile, careNavLabel, weather) {
    return {
      slug: slug2,
      displayName,
      profile,
      careNavLabel,
      modules: portalProfiles[profile].modules.slice(),
      defaultRoute: "orders.list",
      weather: weather !== false
    };
  }
  function allowed(value, values, fallback) {
    return values.includes(value) ? value : fallback;
  }
  function splitList(value) {
    return String(value || "").split(",").map(function(item) {
      return item.trim();
    }).filter(Boolean);
  }
  function positiveNumber(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }
  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // app-templates/customer-portal/runtime/src/state.js
  var state = {
    route: "orders.list",
    routeQuery: "",
    routeQueryOwner: null,
    theme: "HVAC",
    // vertical display name
    mode: "Light",
    // Light | Dark
    view: "ready",
    // ready | loading | empty | error
    account: "ready",
    // ready | resolving-customer | customer-* | session-expired
    commands: {},
    cmdForce: null,
    contact: null,
    contactDraft: null,
    contactErrors: null,
    filter: "all",
    // order tab
    currentOrderId: null,
    // open order for order.detail
    cartItems: [],
    // checkout cart
    addrId: "home",
    // selected delivery address
    payId: "visa",
    // selected payment method
    prodCat: "all",
    // product category filter
    psites: F.proposalSites.map(function(p) {
      return Object.assign({}, p);
    }),
    // proposal sites (mutable)
    currentSiteId: "s2",
    // open proposal site
    profileFilter: "all",
    // profile order-history tab
    feedFilter: "all",
    // activity feed tab
    prefs: { receipts: true, sms: true, marketing: false },
    messages: F.initialMessages.slice(),
    typing: false,
    chatInput: "",
    activityReadAll: false,
    accessConfirmations: {},
    serviceRequests: [],
    nextFixtureOrder: 1,
    calYear: 2026,
    calMonth: 0,
    phone: "",
    code: "",
    authError: null,
    oidc: "ready-signed-out",
    sessionName: null,
    session: { authenticated: true, intendedRoute: null, hasCustomerScope: true, hasTenantScope: true },
    access: { care: { status: "granted", reasonCode: null } },
    carePayloadState: "ready",
    careStateVertical: null,
    careSelectedUnitId: null,
    careSelectedSpecialistId: null,
    careTasksDone: {},
    careAuthorizationEpoch: 0,
    careRetreatRequests: {},
    seoSelectedServiceId: null,
    seoFaqOpenId: null,
    seoCtaStates: {},
    moduleStatus: {},
    moduleData: {},
    pending: {},
    commandErrors: {},
    config: {
      vertical: "hvac",
      theme: "hvac",
      profile: "onDemand",
      routerMode: "hash",
      authMode: "fixture",
      defaultRoute: "orders.list",
      enabledModules: verticalProfiles.hvac.modules.slice(),
      errorMode: "error",
      dataMode: "fixture",
      caseId: "",
      defaultMode: "light",
      capability: "current-staging",
      booking: "closed",
      retail: "browse-only",
      planCommerce: "closed",
      demoCommands: "closed"
    },
    userModeOverridden: false,
    mobileNav: false,
    capability: "current-staging",
    spaBooking: "closed",
    spaAppt: "salon",
    spaRows: "many",
    spaLongName: false,
    spaCancelled: {},
    accountMenu: false,
    spaSupport: false,
    spaRetail: "browse-only",
    spaAccountPartial: false,
    spaPurchFilter: "all",
    spaPurchMore: "idle",
    spaCurrentPurchase: null,
    spaPlanScenario: "active",
    spaPlanCancelled: {},
    spaCart: null,
    spaCartDemo: "as-added",
    spaVariantPick: {},
    spaCheckoutSource: "cart",
    spaCheckoutDemo: "ready",
    spaPolicyAck: false,
    spaResult: null,
    spaHold: "held",
    spaBookResult: "appointment-and-order",
    spaReturns: {},
    spaCancelReqs: {},
    spaCurrentAppointment: null,
    spaFlow: null,
    spaBookAck: false,
    spaSlots: "ready",
    spaCredit: "ok",
    spaPlanCommerce: "closed",
    spaOfferDemo: "sellable",
    spaPlanOffer: null,
    spaRescheduled: {},
    spaProfile: null,
    spaProfileDraft: null,
    spaProfileErrors: null,
    drawer: null,
    // null | "booking"
    orders: F.ordersFor("HVAC")
  };
  function currentOrder() {
    var orders = orderItems();
    return orders.find(function(o) {
      return o.id === state.currentOrderId;
    }) || orders.find(function(o) {
      return o.status === "inprogress";
    }) || orders[0];
  }
  function money(n) {
    return "$" + n.toLocaleString();
  }
  function cartCount() {
    return state.cartItems.reduce(function(a, x) {
      return a + x.qty;
    }, 0);
  }
  function findProduct(name) {
    return productItems().find(function(p) {
      return p.name === name;
    });
  }
  function orderItems() {
    return state.moduleData.orders && state.moduleData.orders.items || state.orders;
  }
  function productItems() {
    var v = currentFixture().theme;
    return state.moduleData.products && state.moduleData.products.items || v.products;
  }
  function spaCatalogServices() {
    if (state.config.dataMode !== "live") return F.spa.pim.services;
    var source = state.moduleData.pricing && state.moduleData.pricing.rates || state.moduleData.services && state.moduleData.services.items || [];
    return source.filter(function(item) {
      return !item.productTypeCode || item.productTypeCode === "SPA_SERVICE";
    }).map(function(item) {
      return {
        code: item.code,
        name: item.name,
        shortDescription: item.description || "Published spa service",
        displayPrice: item.price,
        interval: item.interval === "one time" ? "" : item.interval
      };
    });
  }
  function spaPlanOffers() {
    if (state.config.dataMode !== "live") return F.spaCommerce.planOffers;
    var source = state.moduleData.pricing && state.moduleData.pricing.rates || [];
    return source.filter(function(item) {
      return item.productTypeCode === "SPA_MEMBERSHIP" || item.productTypeCode === "SPA_PACKAGE";
    }).map(function(item) {
      var kind = item.productTypeCode === "SPA_MEMBERSHIP" ? "MEMBERSHIP" : "PACKAGE";
      return {
        ref: "offer-" + item.code,
        productCode: item.code,
        kind,
        title: item.name,
        displayPrice: item.price + (item.interval && item.interval !== "one time" ? " / " + item.interval : ""),
        amount: Number(item.priceNum) || 0,
        termsSummary: item.description || "Published catalog offer",
        benefits: [],
        sellability: "sellable",
        allowedActions: ["purchase"]
      };
    });
  }
  function currentFixture() {
    var fixture = caseFixtureFor(state.config.caseId);
    if (fixture) return fixture;
    return {
      theme: F.themes[state.theme],
      customer: F.customer,
      addresses: F.addresses,
      cards: F.cards,
      technician: F.technician,
      statusMeta: F.statusMeta,
      feedTabs: F.feedTabs,
      support: { agentName: "Avery", label: "Aircove Support", ticket: "SP-104", availability: "Online now" },
      helpTopics: F.helpTopics,
      quickReplies: F.quickReplies,
      activity: F.buildFeed(F.themes[state.theme])
    };
  }
  function currentTheme() {
    return currentFixture().theme;
  }
  function proposalSites() {
    return state.moduleData.proposals && state.moduleData.proposals.sites || state.psites;
  }
  function activeVerticalConfig() {
    return verticalProfiles[state.config.vertical] || verticalProfiles.hvac;
  }
  function activeProfile() {
    var vertical2 = activeVerticalConfig();
    if (isSpa()) return portalProfiles[spaCapability() === "target-appointments" ? "spaTarget" : "spaStaging"];
    return portalProfiles[state.config.profile] || portalProfiles[vertical2.profile];
  }
  function isSpa() {
    return state.config.vertical === "beauty" || state.theme === "Beauty";
  }
  function spaCapability() {
    return state.capability === "target-appointments" ? "target-appointments" : "current-staging";
  }
  function spaBookingOpen() {
    return isSpa() && spaCapability() === "target-appointments" && state.spaBooking === "open";
  }
  function spaCurrentApiDemoOpen() {
    return isSpa() && state.config.dataMode === "live" && state.config.demoCommands === "current-api";
  }
  function spaAppointments() {
    if (state.config.dataMode === "live") {
      return state.moduleData.appointments || { state: state.moduleStatus.appointments || "loading", items: [], next: null, upcoming: [], past: [], byRef: {} };
    }
    var sc = state.spaAppt;
    var next = sc === "empty" || sc === "no-history" ? null : F.spa.appointments.nextVariants[sc] || F.spa.appointments.nextVariants.salon;
    return {
      state: next || F.spa.appointments.past.length ? "ready" : "empty",
      next,
      upcoming: F.spa.appointments.upcoming,
      past: sc === "no-history" ? [] : F.spa.appointments.past,
      byRef: F.spaCommerce.appointmentDetails
    };
  }
  function spaCustomer() {
    if (state.spaLongName) return F.spa.longCustomer;
    var fixtureCustomer = currentFixture().customer || F.customer;
    var displayName = state.sessionName || fixtureCustomer.fullName || fixtureCustomer.name || "Customer";
    var first = fixtureCustomer.firstName || displayName.split(/\s+/, 1)[0] || "Customer";
    return { first, greeting: fixtureCustomer.greeting || "Welcome back, " + first, fullName: displayName };
  }
  function spaRetailOpen() {
    return isSpa() && spaCapability() === "target-appointments" && state.spaRetail === "retail-commerce-open";
  }
  function spaPlanSellOpen() {
    return isSpa() && spaCapability() === "target-appointments" && state.spaPlanCommerce === "open";
  }
  function currentAppointment() {
    if (state.config.dataMode === "live") {
      var live = state.moduleData.appointments && state.moduleData.appointments.byRef || {};
      return state.spaCurrentAppointment ? live[state.spaCurrentAppointment] || null : null;
    }
    var appointment = state.spaCurrentAppointment ? F.spaCommerce.appointmentDetails[state.spaCurrentAppointment] || null : null;
    if (!appointment) return null;
    var rescheduled = state.spaRescheduled[appointment.ref];
    if (!rescheduled) return appointment;
    return Object.assign({}, appointment, {
      start: rescheduled.start,
      customerStatus: "Confirmed",
      attention: "Rescheduled \u2014 confirmed by the studio. The previous time was released."
    });
  }
  function spaProfileValues() {
    if (state.config.dataMode === "live") {
      var live = state.moduleData.profile || {};
      return {
        phone: live.phone == null ? null : live.phone,
        email: live.email || "",
        prefs: live.prefs || {},
        allowedActions: live.allowedActions || [],
        unavailableFields: live.unavailableFields || []
      };
    }
    if (state.spaProfile) return state.spaProfile;
    var prefs = {};
    F.spaProfileSrv.preferences.forEach(function(preference) {
      prefs[preference.key] = preference.value;
    });
    return { phone: F.spaProfileSrv.phone, email: F.spaProfileSrv.email, prefs };
  }
  function spaCartLines() {
    return state.spaCart && state.spaCart.lines || [];
  }
  function spaCartCount() {
    return spaCartLines().reduce(function(count, line) {
      return count + line.qty;
    }, 0);
  }
  function currentPurchase() {
    if (state.config.dataMode === "live") {
      var live = state.moduleData.orders && state.moduleData.orders.byRef || {};
      return state.spaCurrentPurchase ? live[state.spaCurrentPurchase] || null : null;
    }
    return state.spaCurrentPurchase ? F.spaCommerce.purchaseDetails[state.spaCurrentPurchase] || null : null;
  }
  function spaPlans() {
    var refs = F.spaCommerce.plans.scenarios[state.spaPlanScenario] || [];
    return refs.map(function(ref) {
      var plan = F.spaCommerce.plans.byRef[ref];
      if (!state.spaPlanCancelled[ref]) return plan;
      return Object.assign({}, plan, {
        status: "Cancelled",
        note: "Renewal cancelled \u2014 your benefits continue to the end of the paid period.",
        allowedActions: []
      });
    });
  }
  function routeLabel(routeId) {
    var nav = activeProfile().nav.find(function(item) {
      return item.key === routeId;
    });
    if (nav) return nav.label || "your page";
    var labels = {
      "order.detail": "Order details",
      checkout: "Checkout",
      profile: "Profile",
      calendar: "Calendar",
      activity: "Activity",
      "orders.list": "Home",
      account: "Account",
      "purchases.list": "Purchases",
      "purchase.detail": "Purchase details",
      plan: "My plan",
      cart: "Your bag",
      "appointment.detail": "Your visit"
    };
    return labels[routeId] || "your page";
  }
  function cmdPhase(key) {
    return state.commands[key] || "idle";
  }
  function currentContact() {
    var customer = currentFixture().customer || F.customer;
    return state.contact || { phone: customer.phone || "", email: customer.email || "" };
  }
  function isPublic(routeId) {
    var route = routeRegistry[routeId || state.route];
    return !!(route && route.public);
  }
  function isModuleEnabled(moduleId) {
    if (!moduleId || moduleId === "auth" || moduleId === "landing" || moduleId === "seo-parity") return true;
    return state.config.enabledModules.includes(moduleId);
  }
  function applyPortalConfig(config) {
    var vertical2 = verticalProfiles[config.vertical] ? config.vertical : "hvac";
    var verticalConfig = verticalProfiles[vertical2];
    var theme = verticalProfiles[config.theme] ? config.theme : vertical2;
    var profile = resolveProfile(vertical2, config.profile);
    state.config = Object.assign({}, state.config, config, {
      vertical: vertical2,
      theme,
      profile,
      defaultRoute: config.defaultRoute || verticalConfig.defaultRoute,
      enabledModules: config.enabledModules && config.enabledModules.length ? config.enabledModules : portalProfiles[profile].modules.slice()
    });
    state.capability = state.config.capability === "target-appointments" ? "target-appointments" : "current-staging";
    state.spaBooking = state.config.booking === "open" ? "open" : "closed";
    state.spaRetail = state.config.retail === "retail-commerce-open" ? "retail-commerce-open" : "browse-only";
    state.spaPlanCommerce = state.config.planCommerce === "open" ? "open" : "closed";
    state.session.authenticated = state.config.authMode !== "required";
    state.session.intendedRoute = null;
    var fixture = caseFixtureFor(state.config.caseId);
    state.theme = verticalConfig.displayName;
    state.orders = fixture ? cloneCaseValue(fixture.orders) : F.ordersFor(verticalConfig.displayName);
    state.addrId = fixture ? fixture.addresses[0].id : "home";
    state.payId = fixture ? fixture.cards[0].id : "visa";
    state.prefs = fixture ? cloneCaseValue(fixture.prefs) : { receipts: true, sms: true, marketing: false };
    state.messages = fixture ? cloneCaseValue(fixture.initialMessages) : F.initialMessages.slice();
    state.filter = "all";
    state.cartItems = [];
    state.account = state.config.dataMode === "live" && state.config.authMode === "required" ? "resolving-customer" : "ready";
    state.commands = {};
    state.accountMenu = false;
    state.spaSupport = false;
    state.spaCart = null;
    state.spaCartDemo = "as-added";
    state.spaVariantPick = {};
    state.spaResult = null;
    state.spaPolicyAck = false;
    state.spaCheckoutDemo = "ready";
    state.spaCheckoutSource = "cart";
    state.spaReturns = {};
    state.spaCancelReqs = {};
    state.spaPlanCancelled = {};
    state.spaPurchMore = "idle";
    state.spaPurchFilter = "all";
    state.spaCurrentPurchase = null;
    state.spaHold = "held";
    state.spaCurrentAppointment = null;
    state.spaFlow = null;
    state.spaBookAck = false;
    state.spaSlots = "ready";
    state.spaCredit = "ok";
    state.spaOfferDemo = "sellable";
    state.spaPlanOffer = null;
    state.spaRescheduled = {};
    state.spaProfile = null;
    state.spaProfileDraft = null;
    state.spaProfileErrors = null;
    state.carePayloadState = "ready";
    state.careStateVertical = null;
    state.careSelectedUnitId = null;
    state.careSelectedSpecialistId = null;
    state.careTasksDone = {};
    state.careAuthorizationEpoch += 1;
    state.careRetreatRequests = {};
    delete state.moduleData.care;
    delete state.moduleStatus.care;
    if (!state.userModeOverridden) {
      state.mode = state.config.defaultMode === "dark" ? "Dark" : "Light";
    }
  }
  function buildCalendarGrid(year, month) {
    var first = new Date(year, month, 1);
    var startWeekday = first.getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var cells = [];
    for (var i = 0; i < startWeekday; i++) cells.push({ empty: true });
    for (var d = 1; d <= daysInMonth; d++) {
      cells.push({ empty: false, day: d, events: orderItems().filter(function(o) {
        return o.y === year && o.m === month && o.d === d;
      }) });
    }
    return cells;
  }
  function currentSite() {
    return proposalSites().find(function(p) {
      return p.id === state.currentSiteId;
    }) || proposalSites()[0];
  }
  function computeSite(site) {
    var cs = 0, ds = 0, total = 0;
    var names = F.themes[state.theme].prop.surfaces;
    var rows = F.surfaceDefs.map(function(d, i) {
      var a = site.areas[i];
      var c = Math.round(a * d.clear), de = Math.round(a * d.deice);
      cs += c;
      ds += de;
      total += a;
      return {
        name: names[i] || "Surface " + (i + 1),
        color: d.color,
        area: a.toLocaleString(),
        clear: "$" + c,
        deice: "$" + de,
        clearRate: "$" + ("" + d.clear).replace(/^0/, ""),
        deiceRate: "$" + ("" + d.deice).replace(/^0/, "")
      };
    });
    var clearing = cs + F.MOB_CLEAR, deice = ds + F.MOB_DEICE;
    var seasonRef = clearing * 18 + deice * 22;
    var unlim = seasonRef * 0.853;
    var monthly = Math.round(unlim / 5 / 5) * 5;
    var seasonLock = Math.round(unlim * 0.9 / 25) * 25;
    return {
      rows,
      total,
      clearing,
      deice,
      monthly,
      seasonLock,
      unlim,
      clearStr: "$" + clearing,
      deiceStr: "$" + deice
    };
  }
  function filteredOrders() {
    var list = orderItems();
    if (state.filter !== "all") list = list.filter(function(o) {
      return o.status === state.filter;
    });
    return list;
  }
  function tabItems() {
    var o = orderItems();
    var count = function(k) {
      return k === "all" ? o.length : o.filter(function(x) {
        return x.status === k;
      }).length;
    };
    return [
      { key: "all", label: "All", count: count("all") },
      { key: "inprogress", label: "Active", count: count("inprogress") },
      { key: "scheduled", label: "Scheduled", count: count("scheduled") },
      { key: "completed", label: "Done", count: count("completed") }
    ];
  }

  // app-templates/customer-portal/runtime/src/components/primitives/StatusBadge.js
  function StatusBadge(props) {
    return h("span", {
      "class": "status-badge " + props.variant,
      "data-module": "status-badge",
      "data-visual-id": "status-badge",
      "data-bind": props.bind || "status.label",
      "data-state": props.state || void 0
    }, props.label);
  }

  // app-templates/customer-portal/runtime/src/adapters/core-spa-demo-adapter.js
  var REF_PREFIX = "appt-core-";
  var DEMO_CODE_PREFIX = "CP_DEMO_";
  var APPOINTMENT_TYPE = "SPA_VISIT";
  var REF_MAPPINGS = [{ name: "id" }, { name: "code" }, { name: "nls" }];
  var APPOINTMENT_MAPPINGS = [
    { name: "attributes" },
    { name: "code" },
    { name: "end" },
    { name: "id" },
    { name: "nls" },
    { name: "optimistic" },
    { name: "start" },
    { key: "id", name: "organization", type: "identifier" },
    { key: "id", mappings: REF_MAPPINGS, name: "task", type: "identifier" },
    { key: "id", mappings: REF_MAPPINGS, name: "type", type: "identifier" },
    { key: "id", mappings: REF_MAPPINGS, name: "workflow", type: "identifier" },
    { mappings: REF_MAPPINGS, name: "states", type: "collection" }
  ];
  var ORDER_MAPPINGS = [
    { name: "attributes" },
    { name: "grandTotal" },
    { name: "id" },
    { name: "notes" },
    { name: "optimistic" },
    { name: "totalCharges" },
    { name: "totalTaxes" },
    { key: "id", mappings: REF_MAPPINGS, name: "account", type: "identifier" },
    { key: "id", mappings: REF_MAPPINGS, name: "currency", type: "identifier" },
    { key: "id", name: "organization", type: "identifier" },
    { mappings: REF_MAPPINGS, name: "states", type: "collection" },
    { key: "id", mappings: REF_MAPPINGS, name: "type", type: "identifier" },
    { key: "id", mappings: REF_MAPPINGS, name: "workflow", type: "identifier" }
  ];
  var flights = /* @__PURE__ */ new Map();
  function createCoreSpaDemoAdapter(options2 = {}) {
    var fetchImpl = options2.fetch || globalThis.fetch;
    if (typeof fetchImpl !== "function") throw contractError("fetch-unavailable", "Core SPA demo adapter requires fetch");
    return {
      async load(moduleId, context) {
        if (moduleId !== "appointments") throw contractError("unsupported-module", "Core SPA demo adapter cannot load " + moduleId);
        return loadCoreAppointments(context, fetchImpl, options2.origin);
      },
      createAppointment(input, context) {
        return createCoreAppointment(input, context, fetchImpl, options2.origin);
      },
      rescheduleAppointment(ref, input, context) {
        return rescheduleCoreAppointment(ref, input, context, fetchImpl, options2.origin);
      },
      createOrder(input, context) {
        return createCoreOrder(input, context, fetchImpl, options2.origin);
      }
    };
  }
  async function loadCoreAppointments(context, fetchImpl = globalThis.fetch, explicitOrigin) {
    var api = requestContext(context, explicitOrigin);
    var response = await requestJson(fetchImpl, api.serviceBase + "/api/appointment/list.json", requestOptions(api, {
      filters: [{ type: "STRING", operator: "=", property: "type.code", value: APPOINTMENT_TYPE }],
      mappings: APPOINTMENT_MAPPINGS,
      offset: 0,
      pageSize: positiveInteger(api.config.appointmentsPageSize) || 100,
      sorting: [{ field: "start", direction: "ASC" }]
    }));
    var rows = Array.isArray(response && response.result) ? response.result : [];
    var items = rows.map(normalizeAppointment);
    var now = Number.isFinite(Number(api.config.now)) ? Number(api.config.now) : Date.now();
    var upcoming = items.filter(function(item) {
      return item.startEpoch >= now && item.customerStatus !== "Cancelled";
    });
    var past = items.filter(function(item) {
      return item.startEpoch < now || item.customerStatus === "Completed" || item.customerStatus === "Cancelled";
    }).reverse();
    var byRef = {};
    items.forEach(function(item) {
      byRef[item.ref] = item;
    });
    return {
      state: items.length ? "ready" : "empty",
      scopeMode: "tenant-demo-unscoped",
      resultSize: Number.isFinite(Number(response && response.resultSize)) ? Number(response.resultSize) : items.length,
      items,
      next: upcoming[0] || null,
      upcoming: upcoming.slice(1),
      past,
      byRef
    };
  }
  function createCoreAppointment(input, context, fetchImpl = globalThis.fetch, explicitOrigin) {
    var key = "appointment:create:" + idempotencyPart(input && input.requestRef || input && input.slotRef || "booking");
    return singleFlight(key, async function() {
      var api = requestContext(context, explicitOrigin);
      var code = DEMO_CODE_PREFIX + "APPT_" + idempotencyPart(input && input.requestRef || input && input.slotRef || Date.now());
      var existing = await listOne(fetchImpl, api.serviceBase + "/api/appointment/list.json", api, [
        { type: "STRING", operator: "=", property: "code", value: code }
      ], APPOINTMENT_MAPPINGS);
      if (existing) return normalizeAppointment(existing);
      var template = await appointmentTemplate(fetchImpl, api);
      var start = validIso(input && input.start);
      var durationMinutes = positiveInteger(input && input.durationMinutes) || 60;
      var end = new Date(Date.parse(start) + durationMinutes * 6e4).toISOString();
      var serviceName = text(input && input.serviceName) || "Spa appointment";
      var entity = {
        code,
        end,
        nls: { en: { NAME: serviceName } },
        organization: requiredRef(template.organization, "Appointment organization"),
        start,
        task: optionalRef(template.task),
        type: requiredRef(template.type, "Appointment type"),
        workflow: requiredRef(template.workflow, "Appointment workflow")
      };
      if (!entity.task) delete entity.task;
      var savedIds = await requestJson(fetchImpl, api.serviceBase + "/api/appointment/save.json", requestOptions(api, {
        entities: [entity],
        mappings: APPOINTMENT_MAPPINGS
      }));
      var id = positiveInteger(Array.isArray(savedIds) && savedIds[0]);
      if (!id) throw contractError("invalid-save-response", "Core Appointment save did not return an id");
      return normalizeAppointment(await getEntity(fetchImpl, api.serviceBase + "/api/appointment/get.json?id=" + id, api, APPOINTMENT_MAPPINGS));
    });
  }
  function rescheduleCoreAppointment(ref, input, context, fetchImpl = globalThis.fetch, explicitOrigin) {
    var id = appointmentId(ref);
    return singleFlight("appointment:reschedule:" + id, async function() {
      var api = requestContext(context, explicitOrigin);
      var current = await getEntity(fetchImpl, api.serviceBase + "/api/appointment/get.json?id=" + id, api, APPOINTMENT_MAPPINGS);
      if (!current || positiveInteger(current.id) !== id) throw contractError("appointment-not-found", "Core Appointment was not found");
      var start = validIso(input && input.start);
      var currentStart = Date.parse(current.start);
      var currentEnd = Date.parse(current.end);
      var duration = Number.isFinite(currentEnd - currentStart) && currentEnd > currentStart ? currentEnd - currentStart : 60 * 6e4;
      var entity = {
        attributes: current.attributes || {},
        code: text(current.code),
        end: new Date(Date.parse(start) + duration).toISOString(),
        id,
        nls: current.nls || { en: { NAME: "Spa appointment" } },
        optimistic: finiteNumber(current.optimistic, 0),
        organization: requiredRef(current.organization, "Appointment organization"),
        start,
        task: optionalRef(current.task),
        type: requiredRef(current.type, "Appointment type"),
        workflow: requiredRef(current.workflow, "Appointment workflow")
      };
      if (!entity.task) delete entity.task;
      await requestJson(fetchImpl, api.serviceBase + "/api/appointment/save.json", requestOptions(api, {
        entities: [entity],
        mappings: APPOINTMENT_MAPPINGS
      }));
      return normalizeAppointment(await getEntity(fetchImpl, api.serviceBase + "/api/appointment/get.json?id=" + id, api, APPOINTMENT_MAPPINGS));
    });
  }
  function createCoreOrder(input, context, fetchImpl = globalThis.fetch, explicitOrigin) {
    var requestRef = idempotencyPart(input && input.requestRef || "checkout");
    return singleFlight("order:create:" + requestRef, async function() {
      var api = requestContext(context, explicitOrigin);
      var accountId = positiveInteger(api.customer.id);
      if (!accountId) throw contractError("customer-account-required", "Resolved customer Account is required before checkout");
      var marker = DEMO_CODE_PREFIX + "ORDER_" + accountId + "_" + requestRef;
      var existing = await listOne(fetchImpl, api.billBase + "/api/order/list.json", api, [
        { type: "INTEGER", operator: "=", property: "account.id", value: String(accountId) },
        { type: "STRING", operator: "=", property: "notes", value: marker }
      ], ORDER_MAPPINGS);
      if (existing) return normalizeOrder(existing, accountId);
      var template = await listOne(fetchImpl, api.billBase + "/api/order/list.json", api, [
        { type: "INTEGER", operator: "=", property: "account.id", value: String(accountId) }
      ], ORDER_MAPPINGS, [{ field: "id", direction: "DESC" }]);
      if (!template) throw contractError("order-template-missing", "A seeded Core Order is required for the current-api checkout demo");
      var total = finiteNumber(input && input.total, 0);
      var entity = {
        account: { id: accountId },
        currency: requiredRef(template.currency, "Order currency"),
        grandTotal: total,
        notes: marker,
        organization: requiredRef(template.organization, "Order organization"),
        totalCharges: total,
        totalTaxes: finiteNumber(input && input.taxes, 0),
        type: requiredRef(template.type, "Order type"),
        workflow: requiredRef(template.workflow, "Order workflow")
      };
      var savedIds = await requestJson(fetchImpl, api.billBase + "/api/order/save.json", requestOptions(api, {
        entities: [entity],
        mappings: ORDER_MAPPINGS
      }));
      var id = positiveInteger(Array.isArray(savedIds) && savedIds[0]);
      if (!id) throw contractError("invalid-save-response", "Core Order save did not return an id");
      var readback = await getEntity(fetchImpl, api.billBase + "/api/order/get.json?id=" + id, api, ORDER_MAPPINGS);
      return normalizeOrder(readback, accountId);
    });
  }
  function appointmentTemplate(fetchImpl, api) {
    return listOne(fetchImpl, api.serviceBase + "/api/appointment/list.json", api, [
      { type: "STRING", operator: "=", property: "type.code", value: APPOINTMENT_TYPE }
    ], APPOINTMENT_MAPPINGS).then(function(template) {
      if (!template) throw contractError("appointment-template-missing", "A seeded SPA_VISIT is required for the current-api booking demo");
      return template;
    });
  }
  async function listOne(fetchImpl, url, api, filters, mappings, sorting) {
    var body = { filters, mappings, offset: 0, pageSize: 1 };
    if (sorting) body.sorting = sorting;
    var response = await requestJson(fetchImpl, url, requestOptions(api, body));
    var rows = Array.isArray(response && response.result) ? response.result : [];
    return rows[0] || null;
  }
  function getEntity(fetchImpl, url, api, mappings) {
    return requestJson(fetchImpl, url, requestOptions(api, mappings));
  }
  function requestContext(context, explicitOrigin) {
    var config = context && context.config || {};
    var state2 = context && context.state || {};
    var session = context && context.session || state2.session || {};
    var customer = context && context.account || state2.customerAccount || session.account || {};
    var accessToken = text(session.accessToken || session.access_token);
    if (!accessToken) throw contractError("session-required", "A Core access token is required");
    var organization = text(config.organization);
    if (!organization) throw contractError("organization-required", "Verified portal organization is required");
    var origin = explicitOrigin || config.origin || browserOrigin();
    return {
      authorization: text(session.tokenType || session.token_type || "Bearer") + " " + accessToken,
      billBase: sameOriginBase(config.billApiBase || "/core-bill", origin, "Core Bill API base"),
      config,
      customer,
      organization,
      serviceBase: sameOriginBase(config.serviceApiBase || "/core-svc", origin, "Core Service API base")
    };
  }
  function requestOptions(api, body) {
    return {
      method: "POST",
      credentials: "same-origin",
      headers: {
        Authorization: api.authorization,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Organization-Code": api.organization
      },
      body: JSON.stringify(body)
    };
  }
  async function requestJson(fetchImpl, url, options2) {
    var response = await fetchImpl(url, options2);
    if (!response || typeof response.ok !== "boolean") throw contractError("invalid-response", "Core request returned an invalid response");
    if (!response.ok) {
      var code = response.status === 401 ? "session-expired" : response.status === 403 ? "customer-forbidden" : response.status === 409 || response.status === 412 ? "conflict" : "core-request-failed";
      var error2 = contractError(code, "Core request failed with HTTP " + response.status);
      error2.status = response.status;
      throw error2;
    }
    try {
      return await response.json();
    } catch (_) {
      throw contractError("invalid-response", "Core response was not valid JSON");
    }
  }
  function normalizeAppointment(row) {
    var id = positiveInteger(row && row.id);
    if (!id) throw contractError("invalid-appointment", "Core Appointment response did not include an id");
    var start = validIso(row.start);
    var end = validIso(row.end);
    var states = Array.isArray(row.states) ? row.states.map(function(state2) {
      return text(state2 && state2.code);
    }).filter(Boolean) : [];
    var status = appointmentStatus(states);
    var allowedActions = [];
    if (status === "Confirmed") allowedActions.push("reschedule");
    if (status === "Completed") allowedActions.push("bookAgain");
    return {
      ref: REF_PREFIX + id,
      id: REF_PREFIX + id,
      backendId: id,
      optimistic: Number.isFinite(Number(row.optimistic)) ? Number(row.optimistic) : null,
      code: text(row.code),
      service: localizedName(row.nls) || text(row.code) || "Spa appointment",
      startIso: start,
      endIso: end,
      startEpoch: Date.parse(start),
      start: formatDateTime(start),
      date: formatDate(start),
      time: formatTime(start),
      specialist: "",
      mode: "salon",
      visitMode: "salon",
      location: "Harbor Front studio",
      price: null,
      displayPrice: null,
      reference: REF_PREFIX + id,
      timezoneNote: "America/Chicago",
      status,
      customerStatus: status,
      rawStates: states,
      allowedActions
    };
  }
  function normalizeOrder(row, accountId) {
    var rowAccountId = row && row.account && positiveInteger(row.account.id);
    if (rowAccountId !== accountId) throw contractError("order-scope-mismatch", "Core Order does not belong to the resolved customer Account");
    var id = positiveInteger(row && row.id);
    if (!id) throw contractError("invalid-order", "Core Order response did not include an id");
    var states = Array.isArray(row.states) ? row.states.map(function(state2) {
      return text(state2 && state2.code);
    }).filter(Boolean) : [];
    return {
      ref: "order-core-" + id,
      id,
      optimistic: Number.isFinite(Number(row.optimistic)) ? Number(row.optimistic) : null,
      notes: text(row.notes),
      grandTotal: finiteNumber(row.grandTotal, 0),
      totalCharges: finiteNumber(row.totalCharges, 0),
      totalTaxes: finiteNumber(row.totalTaxes, 0),
      currencyCode: text(row.currency && row.currency.code),
      typeCode: text(row.type && row.type.code),
      statusCode: states.join(" \xB7 ")
    };
  }
  function appointmentStatus(states) {
    if (states.includes("COMPLETED")) return "Completed";
    if (states.includes("CANCELLED")) return "Cancelled";
    if (states.includes("IN_PROGRESS")) return "In progress";
    return "Confirmed";
  }
  function appointmentId(ref) {
    var value = text(ref);
    if (!value.startsWith(REF_PREFIX)) throw contractError("invalid-appointment-ref", "Appointment reference is invalid");
    var id = positiveInteger(value.slice(REF_PREFIX.length));
    if (!id) throw contractError("invalid-appointment-ref", "Appointment reference is invalid");
    return id;
  }
  function singleFlight(key, operation) {
    if (flights.has(key)) return flights.get(key);
    var promise = Promise.resolve().then(operation).finally(function() {
      flights.delete(key);
    });
    flights.set(key, promise);
    return promise;
  }
  function sameOriginBase(value, origin, label) {
    if (!origin) throw contractError("origin-required", label + " requires a browser origin");
    var target = new URL(String(value || ""), origin);
    if (target.origin !== new URL(origin).origin) throw contractError("cross-origin-service", label + " must be same-origin");
    return target.href.replace(/\/+$/, "");
  }
  function browserOrigin() {
    return globalThis.location && globalThis.location.origin || "";
  }
  function positiveInteger(value) {
    var number = Number(value);
    return Number.isInteger(number) && number > 0 ? number : null;
  }
  function finiteNumber(value, fallback) {
    var number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }
  function text(value) {
    return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
  }
  function localizedName(value) {
    if (!value || typeof value !== "object") return "";
    var localized2 = value.en || value["en-US"] || Object.values(value)[0] || {};
    return text(localized2 && (localized2.NAME || localized2.name));
  }
  function requiredRef(value, label) {
    var id = value && positiveInteger(value.id);
    if (!id) throw contractError("template-reference-missing", label + " is missing");
    return { id };
  }
  function optionalRef(value) {
    var id = value && positiveInteger(value.id);
    return id ? { id } : null;
  }
  function validIso(value) {
    var date = new Date(value);
    if (!Number.isFinite(date.getTime())) throw contractError("invalid-date", "Appointment date is invalid");
    return date.toISOString();
  }
  function idempotencyPart(value) {
    var clean = text(value).toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    return (clean || "REQUEST").slice(0, 72);
  }
  function formatDate(value) {
    return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "America/Chicago" }).format(new Date(value));
  }
  function formatTime(value) {
    return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" }).format(new Date(value));
  }
  function formatDateTime(value) {
    return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Chicago" }).format(new Date(value));
  }
  function contractError(code, message) {
    var error2 = new Error(message);
    error2.code = code;
    return error2;
  }
  var coreSpaDemoContract = Object.freeze({
    appointmentMappings: APPOINTMENT_MAPPINGS,
    appointmentTypeCode: APPOINTMENT_TYPE,
    orderMappings: ORDER_MAPPINGS,
    scopeMode: "tenant-demo-unscoped"
  });

  // app-templates/customer-portal/runtime/src/adapters/core-oidc-adapter.js
  var manager = null;
  function createCoreOidcAdapter() {
    return {
      async load(moduleId, context) {
        if (moduleId !== "auth") throw new Error("Core OIDC adapter cannot load " + moduleId);
        if (context.config.dataMode !== "live" || context.config.authMode !== "required") {
          return { state: "ready-signed-in", user: null };
        }
        return loadCoreOidcSession(context.config);
      }
    };
  }
  async function loadCoreOidcSession(config) {
    if (!globalThis.oidc || !globalThis.oidc.UserManager || !globalThis.oidc.WebStorageStateStore) {
      throw contractError2("oidc-library-unavailable", "Core sign-in library did not load");
    }
    var coreBase = sameOriginUrl(config.authCoreBase || "/core", "Core authentication base").replace(/\/+$/, "");
    var expectedCallback = sameOriginUrl(config.authCallbackPath || "/core/oauth2-callback.html", "Core callback");
    var response = await globalThis.fetch(coreBase + "/.well-known/oauth-protected-resource/", {
      credentials: "omit",
      headers: { Accept: "application/json" }
    });
    if (!response.ok) throw contractError2("oidc-discovery-failed", "Core authentication discovery failed with HTTP " + response.status);
    var metadata = await response.json();
    var authority = Array.isArray(metadata.authorization_servers) ? metadata.authorization_servers[0] : "";
    if (!authority || !metadata.resource || !metadata.x_client_id || !metadata.x_redirect_uri || !metadata.x_post_logout_redirect_uri) {
      throw contractError2("oidc-discovery-incomplete", "Core authentication discovery is incomplete");
    }
    if (new URL(metadata.resource, globalThis.location.origin).origin !== globalThis.location.origin) {
      throw contractError2("oidc-cross-origin-resource", "Core authentication resource must be same-origin");
    }
    if (new URL(authority, globalThis.location.origin).origin !== globalThis.location.origin) {
      throw contractError2("oidc-cross-origin-authority", "Core authorization server must be same-origin");
    }
    if (new URL(metadata.x_redirect_uri, globalThis.location.origin).href !== expectedCallback || new URL(metadata.x_post_logout_redirect_uri, globalThis.location.origin).href !== expectedCallback) {
      throw contractError2("oidc-callback-mismatch", "Core authentication callback does not match the portal contract");
    }
    manager = new globalThis.oidc.UserManager({
      authority,
      client_id: metadata.x_client_id,
      post_logout_redirect_uri: expectedCallback,
      redirect_uri: expectedCallback,
      response_type: "code",
      scope: "openid profile email roles",
      userStore: new globalThis.oidc.WebStorageStateStore({ store: globalThis.localStorage })
    });
    var user = await manager.getUser();
    if (user && user.expired) {
      await manager.removeUser();
      user = null;
    }
    return { state: user ? "ready-signed-in" : "ready-signed-out", user: user || null };
  }
  function startCoreOidcSignIn(config) {
    if (!manager) return Promise.reject(contractError2("oidc-manager-unavailable", "Core sign-in is not ready"));
    var returnUrl = new URL(globalThis.location.href);
    returnUrl.hash = "#/orders";
    globalThis.sessionStorage.setItem(config.authReturnStorageKey || "oidc-return-url", returnUrl.href);
    return manager.signinRedirect();
  }
  function startCoreOidcSignOut(config) {
    if (!manager) return Promise.reject(contractError2("oidc-manager-unavailable", "Core sign-out is not ready"));
    var returnUrl = new URL(globalThis.location.href);
    returnUrl.hash = "#/login";
    globalThis.sessionStorage.setItem(config.authLogoutReturnStorageKey || "oidc-logout-return-url", returnUrl.href);
    return manager.signoutRedirect();
  }
  function sameOriginUrl(value, label) {
    var url = new URL(value, globalThis.location.origin);
    if (url.origin !== globalThis.location.origin) throw contractError2("cross-origin-service", label + " must be same-origin");
    return url.href;
  }
  function contractError2(code, message) {
    var error2 = new Error(message);
    error2.code = code;
    return error2;
  }

  // app-templates/customer-portal/runtime/src/adapters/core-user-profile-adapter.js
  var USER_MAPPINGS = [
    { name: "email" },
    { name: "enabled" },
    { name: "fullname" },
    { name: "id" },
    { name: "name" },
    { name: "optimistic" },
    { key: "id", name: "language", type: "identifier" },
    { key: "id", name: "workflow", type: "identifier" }
  ];
  var saveFlight = null;
  function createCoreUserProfileAdapter(options2 = {}) {
    var fetchImpl = options2.fetch || globalThis.fetch;
    return {
      async load(moduleId, context) {
        if (moduleId !== "profile") throw error("unsupported-module", "Core User profile adapter cannot load " + moduleId);
        return loadCoreUserProfile(context, fetchImpl, options2.origin);
      },
      save(input, context) {
        if (saveFlight) return saveFlight;
        saveFlight = saveCoreUserProfile(input, context, fetchImpl, options2.origin).finally(function() {
          saveFlight = null;
        });
        return saveFlight;
      }
    };
  }
  async function loadCoreUserProfile(context, fetchImpl = globalThis.fetch, explicitOrigin) {
    var api = requestContext2(context, explicitOrigin);
    var row = await requestJson2(fetchImpl, api.base + "/api/user/get.json?id=" + api.userId, options(api, USER_MAPPINGS));
    return normalize(row, api.userId);
  }
  async function saveCoreUserProfile(input, context, fetchImpl = globalThis.fetch, explicitOrigin) {
    var api = requestContext2(context, explicitOrigin);
    var current = await requestJson2(fetchImpl, api.base + "/api/user/get.json?id=" + api.userId, options(api, USER_MAPPINGS));
    var entity = {
      email: text2(input && input.email),
      enabled: current.enabled !== false,
      fullname: text2(current.fullname),
      id: api.userId,
      language: requiredRef2(current.language, "User language"),
      name: text2(current.name),
      optimistic: finiteNumber2(current.optimistic, 0),
      workflow: requiredRef2(current.workflow, "User workflow")
    };
    if (!entity.email) throw error("profile-email-required", "Email is required");
    await requestJson2(fetchImpl, api.base + "/api/user/save.json", options(api, { entities: [entity], mappings: USER_MAPPINGS }));
    var readback = await requestJson2(fetchImpl, api.base + "/api/user/get.json?id=" + api.userId, options(api, USER_MAPPINGS));
    return normalize(readback, api.userId);
  }
  function normalize(row, userId) {
    if (!row || positiveInteger2(row.id) !== userId) throw error("profile-scope-mismatch", "Core User readback did not match the signed-in User");
    return {
      state: "ready",
      email: text2(row.email),
      phone: null,
      prefs: {},
      optimistic: Number.isFinite(Number(row.optimistic)) ? Number(row.optimistic) : null,
      allowedActions: ["edit-email"],
      unavailableFields: ["phone", "preferences"]
    };
  }
  function requestContext2(context, explicitOrigin) {
    var config = context && context.config || {};
    var state2 = context && context.state || {};
    var session = context && context.session || state2.session || {};
    var token = text2(session.accessToken || session.access_token);
    var userId = positiveInteger2(session.userId);
    if (!token) throw error("session-required", "A Core access token is required");
    if (!userId) throw error("session-user-required", "The signed-in Core User is required");
    var origin = explicitOrigin || config.origin || globalThis.location && globalThis.location.origin;
    var base = sameOriginBase2(config.coreApiBase || "/core", origin, "Core API base");
    return { base, token: text2(session.tokenType || session.token_type || "Bearer") + " " + token, userId };
  }
  function options(api, body) {
    return { method: "POST", credentials: "same-origin", headers: { Authorization: api.token, "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(body) };
  }
  async function requestJson2(fetchImpl, url, requestOptions2) {
    var response = await fetchImpl(url, requestOptions2);
    if (!response || typeof response.ok !== "boolean") throw error("invalid-response", "Core User returned an invalid response");
    if (!response.ok) {
      var code = response.status === 401 ? "session-expired" : response.status === 403 ? "customer-forbidden" : response.status === 409 || response.status === 412 ? "conflict" : "profile-request-failed";
      var failure = error(code, "Core User request failed with HTTP " + response.status);
      failure.status = response.status;
      throw failure;
    }
    try {
      return await response.json();
    } catch (_) {
      throw error("invalid-response", "Core User response was not valid JSON");
    }
  }
  function sameOriginBase2(value, origin, label) {
    if (!origin) throw error("origin-required", label + " requires a browser origin");
    var url = new URL(value, origin);
    if (url.origin !== new URL(origin).origin) throw error("cross-origin-service", label + " must be same-origin");
    return url.href.replace(/\/+$/, "");
  }
  function requiredRef2(value, label) {
    var id = value && positiveInteger2(value.id);
    if (!id) throw error("profile-reference-missing", label + " is missing");
    return { id };
  }
  function positiveInteger2(value) {
    var number = Number(value);
    return Number.isInteger(number) && number > 0 ? number : null;
  }
  function finiteNumber2(value, fallback) {
    var number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }
  function text2(value) {
    return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
  }
  function error(code, message) {
    var failure = new Error(message);
    failure.code = code;
    return failure;
  }
  var coreUserProfileContract = Object.freeze({ mappings: USER_MAPPINGS, fields: ["email"] });

  // app-templates/customer-portal/runtime/src/components/primitives/ErrorState.js
  function ErrorState(props) {
    return h("div", { "class": "state-block", "data-module": "error-state", "data-visual-id": "error-state", "data-state": "error" }, [
      h("div", { "class": "state-block__glyph state-block__glyph--error" }, "\u26A0"),
      h("div", { "class": "state-block__title" }, props.title || "Something went wrong"),
      h("div", { "class": "state-block__desc" }, props.desc || "We couldn\u2019t load your orders. Check your connection and try again."),
      ActionButton({ variant: "btn--primary", label: "Try again", action: "ui.retry", visualId: "retry" })
    ]);
  }

  // app-templates/customer-portal/runtime/src/components/shell/SpaTopNav.js
  function spaBrand() {
    return h("div", { "class": "top-nav__brand", "data-action": "nav.go", "data-id": "orders.list" }, [
      h("div", { "class": "brand-logo" }),
      h("span", { "class": "brand-name", "data-bind": "brand.name" }, "Calm Harbor Spa")
    ]);
  }
  function linkActive(key) {
    if (key === "orders.list") return state.route === "orders.list" || state.route === "order.detail";
    if (key === "services") return state.route === "services" || state.route === "pricing";
    if (key === "products") return state.route === "products" || state.route === "cart" || state.route === "checkout";
    if (key === "account") return ["account", "purchases.list", "purchase.detail", "plan", "profile"].indexOf(state.route) !== -1;
    return key === state.route;
  }
  function SpaTopNav(gated) {
    var cap = spaCapability();
    var profile = activeProfile();
    var open = spaBookingOpen();
    var cust = spaCustomer();
    if (gated) {
      return h("div", { "class": "top-nav-wrap" }, h("nav", { "class": "top-nav", "data-module": "top-nav", "data-visual-id": "top-nav", "data-state": "gated", "data-capability": cap }, [
        spaBrand(),
        h("div", { "class": "nav-links" }),
        h("div", { "class": "top-nav__actions" }, [
          h("div", { "class": "icon-btn", "data-action": "ui.toggleMode", title: "Toggle light/dark" }, state.mode === "Dark" ? "\u2600" : "\u263E")
        ])
      ]));
    }
    var links = profile.nav.map(function(n) {
      var active = linkActive(n.key);
      return h("span", {
        "class": "nav-link" + (n.secondary ? " nav-link--secondary" : "") + (active ? " nav-link--active" : ""),
        "data-action": "nav.go",
        "data-id": n.key,
        "data-state": active ? "active" : void 0
      }, n.label);
    });
    var cta = open ? ActionButton({ variant: "btn--primary", label: "+ Book", action: "booking.open", visualId: "primary-cta" }) : ActionButton({ variant: "btn--ghost", label: "Browse services", action: "nav.go", id: "services", visualId: "primary-cta" });
    cta.classList.add("spa-cta");
    if (!open) cta.classList.add("spa-cta--browse");
    var initial = (cust.fullName || "?").charAt(0).toUpperCase();
    var accountBtn = h("button", {
      "class": "account-btn",
      "data-module": "account-control",
      "data-visual-id": "account-control",
      "data-action": "account.menu",
      "data-state": state.accountMenu ? "open" : void 0,
      "aria-haspopup": "menu",
      "aria-expanded": state.accountMenu ? "true" : "false",
      title: "Account"
    }, [
      h("span", { "class": "account-btn__ava" }, initial),
      h("span", { "class": "account-btn__name", "data-bind": "session.displayName" }, cust.fullName)
    ]);
    var nav = h("nav", { "class": "top-nav", "data-module": "top-nav", "data-visual-id": "top-nav", "data-capability": cap, "data-booking": cap === "target-appointments" ? open ? "open" : "closed" : void 0, "data-retail": cap === "target-appointments" ? spaRetailOpen() ? "retail-commerce-open" : "browse-only" : void 0, "data-state": state.accountMenu ? "account-menu-open" : void 0 }, [
      spaBrand(),
      h("div", { "class": "nav-links" }, [h("div", { "class": "nav-pill", "data-nav-pill": "true" })].concat(links)),
      h("div", { "class": "top-nav__actions" }, [
        h("div", { "class": "icon-btn icon-btn--optional", "data-action": "ui.toggleMode", title: "Toggle light/dark" }, state.mode === "Dark" ? "\u2600" : "\u263E"),
        /* wave 15 — the bag opens ONLY under retail-commerce-open; the count is the
           server cart's line count and never implies a reservation */
        spaRetailOpen() ? h("button", { "class": "icon-btn spa-bag", "data-module": "cart-indicator", "data-visual-id": "cart-indicator", "data-action": "cart.open", title: "Your bag", "data-state": spaCartCount() ? "filled" : "empty" }, [
          "\u25A1",
          spaCartCount() ? h("span", { "class": "spa-bag__count", "data-bind": "cart.lines.length" }, String(spaCartCount())) : null
        ]) : null,
        cta,
        accountBtn,
        h("div", { "class": "icon-btn hamburger", "data-action": "ui.toggleMobileNav", title: "Menu" }, "\u2630")
      ])
    ]);
    if (state.accountMenu) {
      nav.appendChild(h("div", { "class": "account-menu", "data-module": "account-menu", "data-visual-id": "account-menu", "data-state": "account-menu-open", role: "menu" }, [
        h("div", { "class": "account-menu__head" }, [
          h("span", { "class": "account-btn__ava account-menu__ava" }, initial),
          h("div", { style: "min-width:0;flex:1" }, [
            h("div", { "class": "account-menu__name", "data-bind": "session.displayName" }, cust.fullName),
            h("div", { "class": "account-menu__sub" }, "Signed in with the secure account service")
          ])
        ]),
        h("button", { "class": "account-menu__item", "data-action": "support.open", role: "menuitem" }, "Support"),
        h("button", { "class": "account-menu__item", "data-action": "ui.toggleMode", role: "menuitem" }, state.mode === "Dark" ? "Switch to light mode" : "Switch to dark mode"),
        h("div", { "class": "account-menu__divider" }),
        h("button", { "class": "account-menu__item account-menu__item--danger", "data-action": "auth.signOut", role: "menuitem" }, "Sign out")
      ]));
    }
    if (state.mobileNav) {
      var mob = h(
        "div",
        { "class": "mobile-nav", "data-state": "mobile-navigation-open" },
        profile.nav.map(function(n) {
          var active = linkActive(n.key);
          return h("span", { "class": "nav-link" + (active ? " nav-link--active" : ""), "data-action": "nav.go", "data-id": n.key }, n.label);
        })
      );
      mob.appendChild(h("div", { "class": "mobile-nav__divider" }));
      mob.appendChild(h("span", { "class": "nav-link", "data-action": "support.open" }, "Support"));
      mob.appendChild(h("span", { "class": "nav-link", "data-action": "auth.signOut" }, "Sign out"));
      nav.appendChild(mob);
    }
    return h("div", { "class": "top-nav-wrap" }, nav);
  }

  // app-templates/customer-portal/runtime/src/components/shell/TopNav.js
  function TopNav(gated) {
    if (isSpa()) return SpaTopNav(gated);
    var profile = activeProfile();
    if (gated) {
      return h("div", { "class": "top-nav-wrap" }, h("nav", { "class": "top-nav", "data-module": "top-nav", "data-visual-id": "top-nav", "data-state": "gated" }, [
        h("div", { "class": "top-nav__brand" }, [h("div", { "class": "brand-logo" }), h("span", { "class": "brand-name" }, "Aircove")]),
        h("div", { "class": "nav-links" }),
        h("div", { "class": "top-nav__actions" }, [h("div", { "class": "icon-btn", "data-action": "ui.toggleMode", title: "Toggle light/dark" }, state.mode === "Dark" ? "\u2600" : "\u263E")])
      ]));
    }
    var navItems = profile.nav.filter(isNavItemEnabled);
    var links = navItems.map(function(n) {
      var active = n.key === state.route || n.key === "orders.list" && state.route === "order.detail" || n.key === "products" && state.route === "checkout" || n.key === "proposals.list" && state.route === "proposal.detail";
      return h("span", {
        "class": "nav-link" + (active ? " nav-link--active" : ""),
        "data-action": "nav.go",
        "data-id": n.key,
        "data-state": active ? "active" : void 0
      }, navLabel(n));
    });
    var actions = [
      h("div", { "class": "icon-btn icon-btn--optional", "data-action": "ui.toggleMode", title: "Toggle light/dark" }, state.mode === "Dark" ? "\u2600" : "\u263E")
    ];
    if (isModuleEnabled("services")) actions.push(ActionButton({ variant: "btn--primary", label: profile.primary.label, action: profile.primary.action, visualId: "primary-cta" }));
    if (!profile.weatherCalendar && isModuleEnabled("calendar")) actions.push(h("div", { "class": "icon-btn icon-btn--optional", "data-action": "calendar.open", title: "Calendar" }, "\u{1F4C5}"));
    if (profile.showCart && isModuleEnabled("checkout")) actions.push(h("div", { "class": "icon-btn", "data-action": "cart.open", title: "Cart" }, ["\u{1F6D2}", cartCount() ? h("span", { "class": "cart-badge", "data-bind": "cart.count" }, String(cartCount())) : null]));
    var activityEnabled = isModuleEnabled("activity");
    actions.push(h("div", {
      "class": "icon-btn icon-btn--optional",
      "data-module": "activity-control",
      "data-action": activityEnabled ? "activity.open" : void 0,
      title: activityEnabled ? "Activity" : void 0,
      "aria-disabled": activityEnabled ? void 0 : "true"
    }, ["\u{1F514}", h("span", { "class": "dot-badge" })]));
    if (isModuleEnabled("profile")) actions.push(h("div", { "class": "avatar", "data-action": "profile.open", title: "Profile" }));
    actions.push(h("div", { "class": "icon-btn hamburger", "data-action": "ui.toggleMobileNav", title: "Menu" }, "\u2630"));
    var nav = h("nav", { "class": "top-nav", "data-module": "top-nav", "data-visual-id": "top-nav" }, [
      h("div", { "class": "top-nav__brand", "data-action": "nav.landing" }, [
        h("div", { "class": "brand-logo" }),
        h("span", { "class": "brand-name", "data-bind": "brand.name" }, "Aircove")
      ]),
      h("div", { "class": "nav-links" }, [h("div", { "class": "nav-pill", "data-nav-pill": "true" })].concat(links)),
      h("div", { "class": "top-nav__actions" }, actions)
    ]);
    if (state.mobileNav) {
      nav.appendChild(h(
        "div",
        { "class": "mobile-nav", "data-state": "mobile-navigation-open" },
        navItems.map(function(n) {
          var active = n.key === state.route || n.key === "orders.list" && state.route === "order.detail" || n.key === "products" && state.route === "checkout" || n.key === "proposals.list" && state.route === "proposal.detail";
          return h("span", { "class": "nav-link" + (active ? " nav-link--active" : ""), "data-action": "nav.go", "data-id": n.key }, navLabel(n));
        })
      ));
    }
    return h("div", { "class": "top-nav-wrap" }, nav);
  }
  function isNavItemEnabled(item) {
    var route = routeRegistry[item.key];
    return !!(route && (route.public || isModuleEnabled(route.module)));
  }
  function navLabel(item) {
    return item.key === "care" ? activeVerticalConfig().careNavLabel : item.label;
  }

  // app-templates/customer-portal/runtime/src/components/primitives/Toggle.js
  function Toggle(on, id) {
    return h(
      "div",
      { "class": "toggle" + (on ? " toggle--on" : ""), "data-module": "toggle", "data-action": "profile.togglePref", "data-id": id, "data-state": on ? "on" : "off", role: "switch", "aria-checked": on ? "true" : "false" },
      h("div", { "class": "toggle__knob" })
    );
  }

  // app-templates/customer-portal/runtime/src/components/shell/PublicNav.js
  function PublicNav() {
    return h(
      "div",
      { "class": "top-nav-wrap" },
      h("nav", { "class": "top-nav", "data-module": "public-nav", "data-visual-id": "public-nav" }, [
        h("div", { "class": "top-nav__brand", "data-action": "nav.landing" }, [
          h("div", { "class": "brand-logo" }),
          h("span", { "class": "brand-name", "data-bind": "brand.name" }, "Aircove")
        ]),
        h("div", { "class": "top-nav__actions" }, [
          h("div", { "class": "icon-btn icon-btn--optional", "data-action": "ui.toggleMode", title: "Toggle light/dark" }, state.mode === "Dark" ? "\u2600" : "\u263E"),
          state.route === "landing" || state.route === "seo.landing" ? ActionButton({ variant: "btn--primary", label: "Sign in", action: "auth.gotoSignin", visualId: "public-signin" }) : ActionButton({ variant: "btn--ghost", label: "\u2039 Home", action: "nav.landing", visualId: "public-home" })
        ])
      ])
    );
  }

  // app-templates/customer-portal/runtime/src/components/shell/AppShell.js
  function AppShell(content) {
    var gated = !isPublic() && state.account !== "ready";
    var capability = isSpa() ? spaCapability() : void 0;
    return h("div", {
      "class": "app-shell",
      "data-module": "app-shell",
      "data-visual-id": "app-shell",
      "data-account-state": isPublic() ? void 0 : state.account,
      "data-capability": capability,
      "data-booking": capability === "target-appointments" ? state.spaBooking : void 0,
      "data-portal-profile": isSpa() ? activeProfile().id : void 0
    }, [
      isPublic() ? PublicNav() : TopNav(gated),
      content,
      isSpa() && state.spaSupport ? h(
        "div",
        { "class": "spa-support-scrim" },
        h("div", { "class": "spa-support-card", "data-module": "support-unavailable", "data-visual-id": "support-unavailable", "data-state": "unavailable", role: "dialog", "aria-modal": "true", "aria-label": "Support unavailable" }, [
          h("div", { "class": "state-block__glyph" }, "\u2709"),
          h("div", { "class": "state-block__title" }, "Support isn\u2019t set up yet"),
          h("div", { "class": "state-block__desc" }, "A support contact hasn\u2019t been set up for this portal, so nothing was opened, sent or recorded. For now, please reach the studio the way you usually do."),
          h("button", { "class": "btn btn--primary", "data-action": "support.dismiss", "data-visual-id": "support-dismiss", style: "margin-top:14px" }, "Close")
        ])
      ) : null
    ]);
  }

  // app-templates/customer-portal/runtime/src/components/primitives/LoadingState.js
  function skeletonRow() {
    return h("div", { style: "display:flex;align-items:center;gap:13px;padding:14px 13px;border-top:1px solid var(--glass-border)" }, [
      h("div", { "class": "skeleton", style: "width:38px;height:38px;border-radius:11px" }),
      h("div", { style: "flex:1" }, [
        h("div", { "class": "skeleton", style: "width:46%;height:12px;margin-bottom:7px" }),
        h("div", { "class": "skeleton", style: "width:28%;height:10px" })
      ]),
      h("div", { "class": "skeleton", style: "width:74px;height:22px;border-radius:999px" })
    ]);
  }
  function detailSkeleton() {
    var col = h("div", { "class": "detail-col" });
    for (var i = 0; i < 3; i++) col.appendChild(h("div", { "class": "skeleton", style: "height:" + (i === 0 ? 180 : 120) + "px;border-radius:20px" }));
    return h("div", { "class": "detail-grid" }, [col, h("div", { "class": "detail-col" }, [h("div", { "class": "skeleton", style: "height:160px;border-radius:20px" })])]);
  }

  // app-templates/customer-portal/runtime/src/components/orders/TrackingCard.js
  function TrackingCard(technician, order) {
    var techData = technician || { name: "Your specialist", eta: "Arrival details are being prepared", role: "Service team" };
    var serviceName = order && order.name ? order.name : "your appointment";
    var map = h("div", { "class": "tracking-map" }, [
      h("span", { "class": "tracking-map__label" }, "live appointment status"),
      svgPath(),
      h("div", { "class": "tracking-pin-start" }),
      h("div", { "class": "tracking-pin-end" }, [
        h("div", { "class": "tracking-pin-end__ping" }),
        h("div", { "class": "tracking-pin-end__dot" })
      ])
    ]);
    var tech = h("div", { "class": "tracking-card__tech" }, [
      h("div", { "class": "tech-avatar" }),
      h("div", { style: "flex:1" }, [
        h("div", { style: "font-weight:600;font-size:14.5px", "data-bind": "visit.techName" }, techData.name + " is with you"),
        h("div", { style: "font-size:12.5px;color:var(--ink-2)", "data-bind": "visit.eta" }, techData.eta + " \xB7 " + serviceName)
      ]),
      ActionButton({ variant: "btn--ghost", label: "Message", action: "support.open", visualId: "tech-message" }),
      ActionButton({ variant: "btn--primary", label: "Call", action: "support.open", visualId: "tech-call" })
    ]);
    return h("div", { "class": "tracking-card", "data-module": "tracking-card", "data-visual-id": "tracking-card" }, [map, tech]);
  }

  // app-templates/customer-portal/runtime/src/components/orders/MembershipCard.js
  function MembershipCard(plan) {
    return h("div", { "class": "membership-card", "data-module": "membership-card", "data-visual-id": "membership-card" }, [
      h("div", { "class": "membership-card__sheen" }),
      h("div", { style: "position:relative" }, [
        h("div", { style: "font-weight:700;font-size:15px", "data-bind": "plan.name" }, plan.name),
        h("div", { style: "font-size:12.5px;line-height:1.5;opacity:.85;margin-top:5px", "data-bind": "plan.desc" }, plan.desc),
        h("div", { "class": "membership-card__cta", "data-action": "membership.activate", "data-visual-id": "membership-cta" }, "Activate \xB7 " + (plan.monthlyPrice || "$9") + "/mo")
      ])
    ]);
  }

  // app-templates/customer-portal/runtime/src/components/orders/Timeline.js
  function Timeline(steps2) {
    return h("div", { "class": "panel", "data-module": "timeline", "data-visual-id": "timeline" }, [
      h("div", { "class": "panel__title", style: "margin-bottom:16px" }, "Progress"),
      h("div", { "class": "timeline" }, [h("div", { "class": "timeline__line" })].concat(
        steps2.map(function(st) {
          return h("div", { "class": "timeline-step", "data-module": "timeline-step" }, [
            h("div", { "class": "timeline-step__dot", style: "background:" + st.dot }),
            h("div", null, [
              h("div", { "class": "timeline-step__title", style: st.muted ? "color:var(--ink-3)" : "" }, st.label),
              h("div", { "class": "timeline-step__sub" }, st.sub)
            ])
          ]);
        })
      ))
    ]);
  }

  // app-templates/customer-portal/runtime/src/routes/OrderDetailPage.js
  function buildOrderView(o) {
    var fixture = currentFixture();
    var num = parseInt(String(o.price).replace(/[^0-9]/g, ""), 10);
    var hasPrice = num > 0 && o.status !== "cancelled";
    var labor = hasPrice ? Math.round(num * 0.65) : 0;
    var parts = hasPrice ? num - labor : 0;
    var activeIdx = o.status === "scheduled" ? 0 : o.status === "inprogress" ? 2 : 3;
    var stepDefs = [
      { label: "Order booked", sub: "Confirmation sent" },
      { label: "Specialist assigned", sub: fixture.technician.name + " \xB7 \u2605 " + fixture.technician.rating },
      { label: "Appointment in progress", sub: "Status shared in your portal" },
      { label: "Service complete", sub: o.status === "completed" ? "Rated \u2605\u2605\u2605\u2605\u2605" : "Pending" }
    ];
    var steps2 = stepDefs.map(function(st, i) {
      var dot, done;
      if (o.status === "cancelled") {
        dot = i === 0 ? "#1f8a44" : "#cfd4dd";
        done = i === 0;
      } else if (o.status === "completed") {
        dot = "#1f8a44";
        done = true;
      } else if (i < activeIdx) {
        dot = "#1f8a44";
        done = true;
      } else if (i === activeIdx) {
        dot = "var(--accent)";
        done = true;
      } else {
        dot = "#cfd4dd";
        done = false;
      }
      return { label: st.label, sub: st.sub, dot, muted: !done };
    });
    var loc = fixture.addresses.find(function(a) {
      return a.id === o.locationId;
    });
    return {
      order: o,
      hasPrice,
      laborStr: "$" + labor,
      partsStr: "$" + parts,
      steps: steps2,
      location: loc,
      isScheduled: o.status === "scheduled",
      isInProgress: o.status === "inprogress",
      isCompleted: o.status === "completed",
      isCancelled: o.status === "cancelled"
    };
  }
  function DetailLiveMap(technician) {
    var tech = technician || { name: "Your specialist", eta: "Status updating" };
    var canvas = h("div", { "class": "detail-map__canvas" }, [
      detailSvg(),
      h("div", { style: "position:absolute;left:40px;top:142px;width:14px;height:14px;border-radius:999px;background:var(--surface);border:3px solid var(--accent)" }),
      h("div", { style: "position:absolute;left:548px;top:18px" }, [
        h("div", { "class": "tracking-pin-end__ping" }),
        h("div", { "class": "tracking-pin-end__dot" })
      ])
    ]);
    var bar = h("div", { "class": "detail-map__bar" }, [
      h("div", { style: "font-weight:600;font-size:14px;flex:1", "data-bind": "visit.techName,visit.eta" }, tech.name + " is with you \xB7 " + tech.eta),
      ActionButton({ variant: "btn--primary", label: "Call", action: "support.open", visualId: "detail-call" })
    ]);
    return h("div", { "class": "detail-map", "data-module": "tracking-card", "data-visual-id": "detail-live-map" }, [canvas, bar]);
  }
  function detailSvg() {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 600 180");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("style", "position:absolute;inset:0;width:100%;height:100%");
    var p = document.createElementNS(ns, "path");
    p.setAttribute("d", "M40 150 C 160 130, 200 50, 330 70 S 520 60, 560 30");
    p.setAttribute("fill", "none");
    p.setAttribute("stroke", "var(--accent)");
    p.setAttribute("stroke-width", "3");
    p.setAttribute("stroke-dasharray", "8 8");
    p.setAttribute("opacity", ".55");
    svg.appendChild(p);
    return svg;
  }
  function kv(k, v) {
    return h("div", { "class": "kv-row" }, [h("span", null, k), h("b", null, v)]);
  }
  function PhotoReport() {
    function col(label, after) {
      return h("div", null, [
        h("div", { "class": "photo-col__label" }, label),
        h("div", { "class": "photo-pair" }, [
          h("div", { "class": "photo-tile" + (after ? " photo-tile--after" : "") }, h("span", null, (after ? "after" : "before") + " photo")),
          h("div", { "class": "photo-tile" + (after ? " photo-tile--after" : "") }, h("span", null, (after ? "after" : "before") + " photo"))
        ])
      ]);
    }
    return h("div", { "class": "panel", "data-module": "photo-report", "data-visual-id": "photo-report" }, [
      h("div", { "class": "panel__title", style: "margin-bottom:3px" }, "Photo report"),
      h("div", { style: "font-size:13px;color:var(--ink-2);margin-bottom:14px" }, "Before & after this visit"),
      h("div", { "class": "photo-grid" }, [col("Before", false), col("After", true)])
    ]);
  }
  function OrderDetail() {
    var o = currentOrder();
    var fixture = currentFixture();
    var page = h("section", { "class": "page page--narrow", "data-route": "order.detail", "data-visual-id": "order-detail", "data-state": o.status });
    page.appendChild(h("div", { "class": "detail-back", "data-action": "order.back", "data-visual-id": "detail-back" }, "\u2039 Back to orders"));
    if (state.view === "loading") {
      page.appendChild(detailSkeleton());
      return page;
    }
    if (state.view === "error") {
      page.appendChild(ErrorState({ title: "Couldn\u2019t load this visit", desc: "Something went wrong fetching the order. Try again." }));
      return page;
    }
    var vm = buildOrderView(o);
    var meta = fixture.statusMeta[o.status];
    page.appendChild(h("div", { "class": "detail-head" }, [
      h("div", { "class": "detail-head__icon", style: "background:" + o.iconBg }, h("i", { style: "background:" + o.dot })),
      h("div", { "class": "detail-head__body" }, [
        h("div", { "class": "detail-head__title", "data-bind": "order.name" }, o.name),
        h("div", { "class": "detail-head__meta", "data-bind": "order.id,order.date" }, o.id + " \xB7 " + o.date)
      ]),
      h("div", { "class": "detail-head__right" }, [
        StatusBadge({ variant: meta.badge, label: meta.label, bind: "order.statusLabel" }),
        h("div", { "class": "detail-price", "data-bind": "order.price" }, vm.isCancelled ? "\u2014" : o.price)
      ])
    ]));
    var grid = h("div", { "class": "detail-grid" });
    var left = h("div", { "class": "detail-col" });
    var right = h("div", { "class": "detail-col" });
    if (vm.isInProgress) left.appendChild(DetailLiveMap(fixture.technician));
    if (vm.isScheduled) left.appendChild(h("div", { "class": "status-banner status-banner--accent", "data-module": "status-banner", "data-visual-id": "scheduled-banner" }, [
      h("div", { "class": "status-banner__icon" }, h("i")),
      h("div", { style: "flex:1" }, [
        h("div", { "class": "status-banner__title" }, "Scheduled for " + o.date),
        h("div", { "class": "status-banner__sub" }, "Your specialist and preparation details are in the appointment record.")
      ])
    ]));
    if (vm.isCompleted) left.appendChild(h("div", { "class": "status-banner status-banner--ok", "data-module": "status-banner", "data-visual-id": "completed-banner" }, [
      h("div", { "class": "status-banner__icon", style: "color:var(--ok)" }, "\u2713"),
      h("div", { style: "flex:1" }, [
        h("div", { "class": "status-banner__title" }, "Completed on " + o.date),
        h("div", { "class": "status-banner__sub status-banner__sub--ok" }, "You rated this visit \u2605\u2605\u2605\u2605\u2605")
      ])
    ]));
    if (vm.isCancelled) left.appendChild(h("div", { "class": "status-banner status-banner--danger", "data-module": "status-banner", "data-visual-id": "cancelled-banner" }, [
      h("div", { "class": "status-banner__icon", style: "color:var(--danger)" }, "\u2715"),
      h("div", { style: "flex:1" }, [
        h("div", { "class": "status-banner__title" }, "Visit cancelled"),
        h("div", { "class": "status-banner__sub status-banner__sub--danger" }, "This visit was cancelled. You weren\u2019t charged.")
      ])
    ]));
    if (vm.location) {
      var others = state.orders.filter(function(x) {
        return x.id !== o.id && (x.status === "scheduled" || x.status === "inprogress");
      });
      var locCard = h("div", { "class": "card", "data-module": "location-card", "data-visual-id": "location-card", style: "overflow:hidden" }, [
        h("div", { style: "display:flex;align-items:center;gap:10px;padding:14px 16px 0;flex-wrap:wrap" }, [
          h("div", { "class": "panel__title", style: "font-size:14.5px" }, "Service location"),
          h("div", { style: "font-size:12.5px;color:var(--ink-2)" }, "\u{1F4CD} " + vm.location.label)
        ])
      ]);
      if (others.length) locCard.appendChild(h(
        "div",
        { style: "display:flex;gap:8px;flex-wrap:wrap;padding:10px 16px 0" },
        others.map(function(x) {
          var l2 = fixture.addresses.find(function(a) {
            return a.id === x.locationId;
          });
          return h("span", { "class": "chip", "data-action": "order.open", "data-id": x.id }, "\u2194 " + (l2 ? l2.label : "") + " \xB7 " + x.date);
        })
      ));
      locCard.appendChild(h("div", { "class": "property-map" }, [
        h("span", { "class": "map-label" }, "property map"),
        h("div", { style: "position:absolute;left:30%;top:52%" }, h("div", { "class": "map-pin__marker" }))
      ]));
      left.appendChild(locCard);
    }
    if (!vm.isCancelled) left.appendChild(h("div", { "class": "tech-card", "data-module": "technician-card", "data-visual-id": "technician-card" }, [
      h("div", { "class": "tech-card__avatar" }),
      h("div", { style: "flex:1" }, [
        h("div", { style: "font-weight:700;font-size:15px", "data-bind": "technician.name" }, fixture.technician.name),
        h("div", { style: "font-size:12.5px;color:var(--ink-2)" }, fixture.technician.role + " \xB7 \u2605 " + fixture.technician.rating + " (" + fixture.technician.visits + " visits)")
      ]),
      ActionButton({ variant: "btn--ghost", label: "Message", action: "support.open", visualId: "tech-message" })
    ]));
    left.appendChild(Timeline(vm.steps));
    if (o.wt) left.appendChild(WeatherDetail(o));
    if (o.photos && vm.isCompleted) left.appendChild(PhotoReport());
    var inv = h("div", { "class": "panel", "data-module": "invoice", "data-visual-id": "invoice" }, [h("div", { "class": "panel__title", style: "margin-bottom:14px" }, "Invoice")]);
    if (vm.hasPrice) {
      inv.appendChild(h("div", { "class": "invoice__row" }, [h("span", null, "Treatment"), h("b", null, vm.laborStr)]));
      inv.appendChild(h("div", { "class": "invoice__row" }, [h("span", null, "Products & care"), h("b", null, vm.partsStr)]));
      inv.appendChild(h("div", { "class": "invoice__total" }, [h("span", null, "Total"), h("span", { "data-bind": "order.price" }, o.price)]));
    } else if (vm.isScheduled) {
      inv.appendChild(h("div", { style: "font-size:13px;line-height:1.5;color:var(--ink-2)" }, [
        "Your appointment total is confirmed before your visit. Estimate: ",
        h("b", { style: "color:var(--ink)" }, o.price),
        "."
      ]));
    } else {
      inv.appendChild(h("div", { style: "font-size:13px;color:var(--ink-2)" }, "No charge for this visit."));
    }
    right.appendChild(inv);
    var acts = h("div", { "class": "action-stack" });
    if (vm.isCompleted) {
      acts.appendChild(ActionButton({ variant: "btn--primary", label: "Download invoice", action: "order.downloadInvoice", id: o.id, block: true, lg: true, visualId: "download-invoice" }));
      acts.appendChild(ActionButton({ variant: "btn--ghost", label: "Book again", action: "order.bookAgain", block: true, lg: true, visualId: "book-again" }));
    } else if (vm.isInProgress) {
      acts.appendChild(ActionButton({ variant: "btn--primary", label: "Contact technician", action: "support.open", block: true, lg: true, visualId: "contact-tech" }));
    } else if (vm.isScheduled) {
      acts.appendChild(ActionButton({ variant: "btn--primary", label: "Reschedule", action: "order.reschedule", id: o.id, block: true, lg: true, visualId: "reschedule" }));
      acts.appendChild(ActionButton({ variant: "btn--danger", label: "Cancel visit", action: "order.cancel", id: o.id, confirm: true, block: true, lg: true, visualId: "cancel-visit" }));
    } else if (vm.isCancelled) {
      acts.appendChild(ActionButton({ variant: "btn--primary", label: "Rebook this service", action: "order.bookAgain", block: true, lg: true, visualId: "rebook" }));
    }
    acts.appendChild(ActionButton({ variant: "btn--ghost", label: "Get help", action: "support.open", block: true, lg: true, visualId: "get-help" }));
    right.appendChild(acts);
    grid.appendChild(left);
    grid.appendChild(right);
    page.appendChild(grid);
    return page;
  }

  // app-templates/customer-portal/runtime/src/components/orders/WeatherCard.js
  function WeatherBanner(order) {
    var v = F.themes[state.theme];
    var loc = (F.addresses.find(function(a) {
      return a.id === order.locationId;
    }) || {}).label || "";
    return h("div", { "class": "alert-banner alert-banner--info", "data-module": "alert-banner", "data-visual-id": "weather-banner", "data-state": "pending-action" }, [
      h("div", { "class": "alert-banner__icon wt-pulse", style: "background:rgba(14,143,196,.16)" }, v.wt.icon),
      h("div", { "class": "alert-banner__body", "data-action": "order.open", "data-id": order.id, style: "cursor:pointer" }, [
        h("div", { "class": "alert-banner__title" }, [
          h("span", null, "Weather Trigger \u2014 confirm your visit"),
          StatusBadge({ variant: "status-badge--warn", label: "Respond by " + order.wt.deadline })
        ]),
        h("div", { "class": "alert-banner__desc" }, order.name + " at " + loc + " \xB7 if we don\u2019t hear back, the visit proceeds automatically per your contract")
      ]),
      ActionButton({ variant: "btn--info", label: "Confirm", action: "weather.confirm", id: order.id, visualId: "weather-confirm" }),
      ActionButton({ variant: "btn--danger", label: "Decline", action: "weather.decline", id: order.id, visualId: "weather-decline" })
    ]);
  }
  function WeatherDetail(o) {
    var wt = o.wt, els = [];
    els.push(h("div", { "class": "weather-card__head" }, [
      h("div", { "class": "weather-card__icon" + (wt.status === "pending" ? " wt-pulse" : "") }, F.themes[state.theme].wt.icon),
      h("div", { "class": "panel__title", style: "flex:1" }, "Weather Trigger"),
      StatusBadge({
        variant: wt.status === "pending" ? "status-badge--warn" : wt.status === "declined" ? "status-badge--danger" : "status-badge--ok",
        label: wt.status === "pending" ? "Awaiting you" : wt.status === "declined" ? "Declined" : wt.status === "confirmed" ? "Confirmed" : "Auto-confirmed"
      })
    ]));
    els.push(h("div", { style: "font-size:13px;line-height:1.5;color:var(--ink-2);margin-bottom:14px" }, wt.trigger + " \xB7 detected " + wt.detected));
    if (wt.status === "pending") {
      els.push(h("div", { "class": "weather-pending", "data-state": "pending-action" }, [
        h("div", { style: "font-weight:600;font-size:13.5px;color:var(--warn)" }, "Please confirm by " + wt.deadline),
        h("div", { style: "font-size:12.5px;line-height:1.5;color:var(--ink-2);margin-top:3px" }, wt.auto)
      ]));
      els.push(h("div", { style: "display:flex;gap:10px" }, [
        ActionButton({ variant: "btn--info", label: "Confirm visit", action: "weather.confirm", id: o.id, block: true, visualId: "wt-confirm" }),
        ActionButton({ variant: "btn--danger", label: "Decline", action: "weather.decline", id: o.id, visualId: "wt-decline" })
      ]));
    } else if (wt.status === "auto") {
      els.push(h("div", { style: "display:flex;flex-direction:column;gap:7px;margin-bottom:6px" }, [
        kv("Dispatched", "Jan 5 \xB7 7:02 AM"),
        kv("Arrived", "Jan 5 \xB7 7:38 AM"),
        kv("Cleared", "Jan 5 \xB7 8:51 AM")
      ]));
      els.push(h("div", { style: "font-size:12.5px;color:var(--ok);font-weight:600" }, "\u2713 " + wt.sla));
    } else if (wt.status === "confirmed") {
      els.push(h("div", { style: "font-size:13px;color:var(--ok);font-weight:600" }, "\u2713 You confirmed this visit \u2014 the crew will proceed as scheduled."));
    } else if (wt.status === "declined") {
      els.push(h("div", { style: "font-size:13px;color:var(--danger);font-weight:600" }, "\u2715 You declined \u2014 no service will occur for this trigger."));
    }
    els.push(h("div", { "class": "locked-report", "data-module": "locked-report", "data-visual-id": "compliance-report" }, [
      h("div", { "class": "locked-report__blur" }, [
        kv("GPS arrival ping", "43.21, -79.88"),
        kv("Surface temp at arrival", "\u22122.4\xB0C"),
        kv("Snowfall depth logged", "3.2 cm")
      ]),
      h("div", { "class": "locked-report__lock" }, [
        h("div", { style: "font-size:20px" }, "\u{1F512}"),
        h("div", { style: "font-weight:700;font-size:13.5px" }, "Detailed Compliance Report"),
        h("div", { style: "font-size:12px;line-height:1.5;color:var(--ink-2);max-width:240px" }, "GPS arrival logs, time-stamped readings & full audit trail for this trigger."),
        h("div", { "class": "tab tab--active", style: "margin-top:4px", "data-action": "compliance.unlock", "data-visual-id": "unlock-compliance" }, "Unlock \xB7 $12/mo")
      ])
    ]));
    return h("div", { "class": "panel", "data-module": "weather-card", "data-visual-id": "weather-card" }, els);
  }

  // app-templates/customer-portal/runtime/src/components/proposals/ProposalBanner.js
  function ProposalBanner(pendingCount) {
    var v = F.themes[state.theme];
    return h("div", {
      "class": "alert-banner alert-banner--glass",
      "data-module": "alert-banner",
      "data-visual-id": "proposal-banner",
      "data-action": "proposal.review"
    }, [
      h("div", { "class": "brand-logo brand-logo--lg" }),
      h("div", { "class": "alert-banner__body" }, [
        h("div", { "class": "alert-banner__title" }, [
          h("span", { "data-bind": "proposal.id" }, "Proposal #" + F.proposal.id + " is ready"),
          StatusBadge({ variant: "status-badge--warn", label: pendingCount + " awaiting you", bind: "proposal.pendingCount" })
        ]),
        h("div", { "class": "alert-banner__desc" }, v.prop.svc + " across 4 properties \xB7 choose a plan per site \xB7 valid until " + F.proposal.validUntil)
      ]),
      h("div", { "class": "btn btn--primary btn--lg" }, "Review proposal \u203A")
    ]);
  }

  // app-templates/customer-portal/runtime/src/routes/CalendarPage.js
  function Calendar() {
    if (state.view === "empty") {
      return h("section", { "class": "page", "data-route": "calendar", "data-visual-id": "calendar", "data-state": "empty" }, [
        EmptyState({ glyph: "i", title: "No visits scheduled", desc: "Upcoming and completed visits appear here once they are available." })
      ]);
    }
    if (activeProfile().weatherCalendar) return StormCalendar();
    return MonthCalendar();
  }
  function MonthCalendar() {
    var page = h("section", { "class": "page", style: "max-width:920px", "data-route": "calendar", "data-visual-id": "calendar" });
    page.appendChild(h("div", { "class": "section-head" }, [
      h("div", { "class": "section-head__title" }, "Calendar"),
      h("div", { "class": "section-head__sub" }, "Every upcoming and past service, at a glance.")
    ]));
    var cal = h("div", { "class": "cal-card", "data-module": "calendar-grid", "data-visual-id": "calendar-grid" });
    cal.appendChild(h("div", { "class": "cal-nav" }, [
      h("div", { "class": "cal-nav__btn", "data-action": "calendar.prev", "aria-label": "Previous month" }, "\u2039"),
      h("div", { "class": "cal-month" }, F.MONTHS[state.calMonth] + " " + state.calYear),
      h("div", { "class": "cal-nav__btn", "data-action": "calendar.next", "aria-label": "Next month" }, "\u203A")
    ]));
    cal.appendChild(h("div", { "class": "cal-weekdays" }, ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(function(d) {
      return h("div", { "class": "cal-weekday" }, d);
    })));
    var grid = h("div", { "class": "cal-grid" });
    buildCalendarGrid(state.calYear, state.calMonth).forEach(function(c) {
      if (c.empty) {
        grid.appendChild(h("div"));
        return;
      }
      var isToday = state.calYear === 2026 && state.calMonth === 0 && c.day === 15;
      var cell = h(
        "div",
        { "class": "cal-cell" + (c.events.length ? " cal-cell--has" : "") + (isToday ? " cal-cell--today" : ""), "data-module": "calendar-cell" },
        [h("div", { "class": "cal-day" }, String(c.day))]
      );
      var dots = h("div", { "class": "cal-dots" });
      c.events.forEach(function(e) {
        var color = e.status === "completed" ? "#1f8a44" : e.status === "inprogress" ? "#ff9f0a" : "var(--accent)";
        dots.appendChild(h("span", { "class": "cal-dot", style: "background:" + color }));
      });
      cell.appendChild(dots);
      if (c.events.length) {
        cell.setAttribute("data-action", "order.open");
        cell.setAttribute("data-id", c.events[0].id);
      }
      grid.appendChild(cell);
    });
    cal.appendChild(grid);
    page.appendChild(cal);
    var upcoming = state.orders.filter(function(o) {
      return o.status !== "completed";
    }).sort(sortByDateAsc);
    var past = state.orders.filter(function(o) {
      return o.status === "completed";
    }).sort(sortByDateDesc);
    page.appendChild(h("div", { "class": "cal-lists" }, [
      calList("Upcoming", upcoming),
      calList("Past", past)
    ]));
    return page;
  }
  function sortByDateAsc(a, b) {
    return a.y - b.y || a.m - b.m || a.d - b.d;
  }
  function sortByDateDesc(a, b) {
    return b.y - a.y || b.m - a.m || b.d - a.d;
  }
  function calList(title, orders) {
    var list = h("div", { "class": "cal-list", "data-module": "order-list" }, [h("div", { "class": "cal-list__title" }, title)]);
    if (orders.length === 0) list.appendChild(h("div", { style: "padding:14px 12px;font-size:13px;color:var(--ink-2)" }, "Nothing here."));
    else orders.forEach(function(o) {
      list.appendChild(OrderCard(o));
    });
    return list;
  }

  // app-templates/customer-portal/runtime/src/components/storm/StormCalendar.js
  function stormChip(status) {
    var map = {
      completed: ["status-badge--ok", "Completed"],
      onroute: ["status-badge--info", "On route"],
      scheduled: ["status-badge--scheduled", "Scheduled"],
      skipped: ["status-badge--scheduled", "Skipped"],
      delayed: ["status-badge--warn", "Delayed"]
    };
    var m = map[status] || map.scheduled;
    return h("span", { "class": "status-badge " + m[0], "data-module": "status-badge", "data-bind": "event.status", "data-state": status }, m[1]);
  }
  function StormCalendar() {
    var cal = F.stormCalendar(state.theme);
    var page = h("section", { "class": "page page--narrow", "data-route": "calendar", "data-visual-id": "storm-calendar" });
    page.appendChild(h("div", { "class": "section-head" }, [
      h("div", { "class": "section-head__title" }, "Calendar"),
      h("div", { "class": "section-head__sub" }, "Your service plan, by date and weather \u2014 what\u2019s scheduled, what triggers service, and what needs you.")
    ]));
    page.appendChild(h("div", { "class": "contract-banner", "data-module": "contract-banner", "data-visual-id": "contract-banner" }, [
      h("div", { "class": "contract-banner__icon" }, "\u21BB"),
      h("div", { style: "flex:1" }, [
        h("div", { style: "font-weight:700;font-size:14px" }, "Recurring: " + cal.contract.rule),
        h("div", { style: "font-size:12.5px;color:var(--ink-2);margin-top:2px" }, cal.contract.note)
      ]),
      h("span", { "class": "status-badge status-badge--ok" }, "Active")
    ]));
    var agenda = h("div", { "class": "storm-agenda", "data-module": "storm-agenda" });
    cal.days.forEach(function(d) {
      var col = h("div", { "class": "storm-day__date" + (d.today ? " storm-day__date--today" : "") }, [
        h("div", { style: "font-weight:800;font-size:15px" }, d.date),
        h("div", { style: "font-size:12px;color:var(--ink-3);margin-top:1px" }, d.dateSub)
      ]);
      var main = h("div", { "class": "storm-day__main" });
      main.appendChild(h("div", { "class": "storm-weather storm-weather--" + d.weather.state, "data-module": "weather-row", "data-visual-id": "weather-row" }, [
        h("span", { "class": "storm-weather__dot" }),
        h("span", { style: "flex:1;font-weight:600;font-size:13px" }, d.weather.label),
        h("span", { style: "font-size:12.5px;color:var(--ink-2)" }, d.weather.temp)
      ]));
      d.events.forEach(function(ev) {
        var meta = ev.time ? ev.tech ? ev.time + " \xB7 " + ev.tech : ev.time : ev.note || (ev.trigger ? "Auto-dispatch on trigger" : "");
        var acts = [];
        if (ev.status === "onroute") {
          acts.push(stormAct("Track", "order.open", state.orders[0] && state.orders[0].id));
          acts.push(stormAct("Message", "support.open"));
        }
        if (ev.status === "scheduled" && d.needsAccess) acts.push(stormAct("Confirm access", "access.confirm", d.dateSub, true));
        if (ev.status === "completed") {
          if (ev.photos) acts.push(stormAct("View report", "order.open", "#SV-3290"));
          acts.push(stormAct("Report issue", "service.reportIssue", ev.type));
        }
        if (ev.status === "delayed" || ev.status === "skipped") acts.push(stormAct("Request extra", "service.requestExtra"));
        var event = h("div", { "class": "storm-event", "data-module": "service-window", "data-visual-id": "service-window", "data-state": ev.status }, [
          stormChip(ev.status),
          h("div", { "class": "storm-event__body" }, [
            h("div", { style: "display:flex;align-items:center;gap:8px;flex-wrap:wrap" }, [
              h("span", { style: "font-weight:600;font-size:14px", "data-bind": "event.type" }, ev.type),
              ev.trigger ? h("span", { "class": "trigger-tag" }, "\u26A1 auto by trigger") : null
            ]),
            meta ? h("div", { style: "font-size:12.5px;color:var(--ink-2);margin-top:2px" }, meta) : null
          ]),
          acts.length ? h("div", { "class": "storm-actions" }, acts) : null
        ]);
        main.appendChild(event);
      });
      agenda.appendChild(h("div", { "class": "storm-day" + (d.today ? " storm-day--today" : ""), "data-module": "storm-day", "data-visual-id": "storm-day" }, [col, main]));
    });
    page.appendChild(agenda);
    var access = h("div", { "class": "list-panel", "data-module": "access-notes", "data-visual-id": "access-notes" }, [
      h("div", { "class": "list-panel__head" }, [
        h("div", { "class": "list-panel__title", style: "flex:1" }, "Access & blackout notes"),
        h("div", { "class": "link-action", "data-action": "access.update" }, "Update")
      ])
    ]);
    cal.accessNotes.forEach(function(n) {
      access.appendChild(h("div", { "class": "access-row" }, [
        h("span", { style: "font-weight:600;font-size:13px;min-width:96px" }, n.label),
        h("span", { style: "font-size:13px;color:var(--ink-2)" }, n.value)
      ]));
    });
    page.appendChild(access);
    return page;
  }
  function stormAct(label, action, id, primary) {
    return h("button", { "class": "storm-act" + (primary ? " storm-act--primary" : ""), "data-action": action, "data-id": id || void 0, "data-visual-id": "storm-action" }, label);
  }

  // app-templates/customer-portal/runtime/src/components/storm/StormHome.js
  function StormHome() {
    var cal = F.stormCalendar(state.theme);
    var today = cal.days.find(function(d) {
      return d.today;
    }) || cal.days[0];
    var todayIdx = cal.days.indexOf(today);
    var upcoming = cal.days.slice(todayIdx + 1);
    var accessDay = upcoming.find(function(d) {
      return d.needsAccess;
    });
    var page = h("section", { "class": "page", "data-route": "orders.list", "data-visual-id": "storm-home" });
    page.appendChild(PageHeader({
      title: F.customer.greeting,
      sub: today.weather.state === "watch" ? "Weather watch tonight \xB7 " + (accessDay ? "1 visit needs your OK" : "crew on the way") : "Your service plan is on track"
    }));
    if (state.view === "error") {
      page.appendChild(ErrorState({}));
      return page;
    }
    var grid = h("div", { "class": "cabinet-grid" });
    var left = h("div", { "class": "cabinet-col" });
    var right = h("div", { "class": "cabinet-col" });
    var todayEvent = today.events[0];
    var statusActions = [];
    if (todayEvent && todayEvent.status === "onroute") {
      statusActions.push(stormAct("Track visit", "order.open", state.orders[0] && state.orders[0].id, true));
      statusActions.push(stormAct("Message crew", "support.open"));
    }
    if (accessDay) statusActions.push(stormAct("Confirm access \xB7 " + accessDay.date, "access.confirm", accessDay.dateSub, !todayEvent || todayEvent.status !== "onroute"));
    var status = h("div", { "class": "storm-status storm-status--" + today.weather.state, "data-module": "storm-status", "data-visual-id": "storm-status", "data-state": today.weather.state }, [
      h("div", { "class": "storm-status__head" }, [
        h("span", { "class": "storm-status__dot" }),
        h("span", { style: "flex:1;font-weight:700;font-size:15.5px" }, today.weather.label),
        h("span", { "class": "storm-status__temp" }, today.weather.temp)
      ]),
      todayEvent ? h("div", { "class": "storm-status__event" }, [
        stormChip(todayEvent.status),
        h("div", { style: "flex:1;min-width:0" }, [
          h("div", { style: "font-weight:600;font-size:14.5px" }, todayEvent.type),
          h("div", { style: "font-size:12.5px;color:var(--ink-2)" }, todayEvent.time ? todayEvent.tech ? todayEvent.time + " \xB7 " + todayEvent.tech : todayEvent.time : "Scheduled")
        ])
      ]) : h("div", { style: "font-size:13.5px;color:var(--ink-2)" }, "No visit needed today \u2014 below the service trigger."),
      statusActions.length ? h("div", { "class": "storm-actions", style: "margin-top:2px" }, statusActions) : null
    ]);
    left.appendChild(status);
    var windows = h("div", { "class": "card card--pad", "data-module": "next-windows", "data-visual-id": "next-windows" }, [
      h("div", { style: "display:flex;align-items:center;margin-bottom:12px" }, [
        h("div", { "class": "card__title", style: "flex:1" }, "Next service windows"),
        h("div", { "class": "link-action", "data-action": "nav.go", "data-id": "calendar" }, "Open calendar \u203A")
      ])
    ]);
    if (upcoming.length === 0) windows.appendChild(h("div", { style: "font-size:13px;color:var(--ink-2)" }, "Nothing scheduled \u2014 we dispatch automatically when the weather triggers."));
    upcoming.slice(0, 3).forEach(function(d) {
      var ev = d.events[0];
      windows.appendChild(h("div", { "class": "home-window", "data-module": "service-window" }, [
        h("div", { "class": "home-window__date" }, [h("div", { style: "font-weight:700;font-size:13.5px" }, d.date), h("div", { style: "font-size:11.5px;color:var(--ink-3)" }, d.dateSub)]),
        h("div", { "class": "storm-weather storm-weather--" + d.weather.state, style: "flex:1" }, [
          h("span", { "class": "storm-weather__dot" }),
          h("span", { style: "flex:1;font-weight:600;font-size:12.5px" }, d.weather.label)
        ]),
        ev ? stormChip(ev.status) : null,
        d.needsAccess ? stormAct("Confirm", "access.confirm", d.dateSub, true) : null
      ]));
    });
    left.appendChild(windows);
    var history = h("div", { "class": "card", "data-module": "order-list", "data-visual-id": "service-history" }, [
      h("div", { "class": "card__head" }, [h("span", { "class": "card__title" }, "Service history")])
    ]);
    var hlist = h("div", { "class": "order-list" });
    if (state.view === "loading") {
      for (var i = 0; i < 3; i++) hlist.appendChild(skeletonRow());
    } else state.orders.filter(function(o) {
      return o.status === "completed";
    }).slice(0, 4).forEach(function(o) {
      hlist.appendChild(OrderCard(o));
    });
    history.appendChild(hlist);
    left.appendChild(history);
    right.appendChild(h("div", { "class": "card card--pad season-card", "data-module": "season-status", "data-visual-id": "season-status" }, [
      h("div", { style: "display:flex;align-items:center;gap:9px;margin-bottom:14px" }, [
        h("div", { "class": "card__title", style: "flex:1" }, F.themes[state.theme].plan.name),
        h("span", { "class": "status-badge status-badge--ok" }, "Active")
      ]),
      seasonRow("Visits this season", "8"),
      seasonRow("Auto-dispatch", "weather trigger"),
      seasonRow("Saved this season", F.customer.stats.savings, "var(--ok)"),
      h("div", { style: "margin-top:14px" }, ActionButton({ variant: "btn--ghost", label: "Manage plan", action: "profile.managePlan", block: true, visualId: "home-manage-plan" }))
    ]));
    var access = h("div", { "class": "card card--pad", "data-module": "access-notes", "data-visual-id": "home-access-notes" }, [
      h("div", { style: "display:flex;align-items:center;margin-bottom:12px" }, [
        h("div", { "class": "card__title", style: "flex:1;font-size:15px" }, "Access notes"),
        h("div", { "class": "link-action", "data-action": "access.update" }, "Edit")
      ])
    ]);
    cal.accessNotes.forEach(function(n) {
      access.appendChild(h("div", { "class": "access-row" }, [h("span", { style: "font-weight:600;font-size:12.5px;min-width:84px" }, n.label), h("span", { style: "font-size:12.5px;color:var(--ink-2)" }, n.value)]));
    });
    right.appendChild(access);
    grid.appendChild(left);
    grid.appendChild(right);
    page.appendChild(grid);
    return page;
  }
  function seasonRow(label, value, color) {
    return h("div", { "class": "season-row" }, [
      h("span", { style: "font-size:13.5px;color:var(--ink-2)" }, label),
      h("span", { style: "font-weight:700;font-size:13.5px" + (color ? ";color:" + color : "") }, value)
    ]);
  }

  // app-templates/customer-portal/runtime/src/routes/OrdersPage.js
  function Cabinet() {
    if (activeProfile().weatherCalendar) return StormHome();
    var fixture = currentFixture();
    var v = currentTheme();
    var page = h("section", { "class": "page", "data-route": "orders.list", "data-visual-id": "cabinet" });
    page.appendChild(PageHeader({ title: fixture.customer.greeting, sub: fixture.customer.subline }));
    if (state.view === "error") {
      page.appendChild(ErrorState({}));
      return page;
    }
    var pending = state.config.caseId ? 0 : F.proposalSites.filter(function(p) {
      return p.status === "unseen" || p.status === "viewed";
    }).length;
    if (state.view === "ready") {
      if (!state.config.caseId) page.appendChild(ProposalBanner(pending));
      var wt = state.orders.find(function(o) {
        return o.wt && o.wt.status === "pending";
      });
      if (wt) page.appendChild(WeatherBanner(wt));
    }
    var grid = h("div", { "class": "cabinet-grid" });
    var left = h("div", { "class": "cabinet-col" });
    var right = h("div", { "class": "cabinet-col" });
    if (state.view === "ready" && state.orders.some(function(o) {
      return o.status === "inprogress";
    })) {
      left.appendChild(TrackingCard(fixture.technician, state.orders.find(function(o) {
        return o.status === "inprogress";
      })));
    }
    var ordersCard = h("div", { "class": "card", "data-module": "glass-card" });
    ordersCard.appendChild(h("div", { "class": "card__head" }, [
      h("span", { "class": "card__title" }, "Your orders"),
      h("div", { style: "margin-left:auto;display:flex;gap:6px;flex-wrap:wrap;align-items:center" }, [
        Tabs({ items: tabItems(), active: state.filter, action: "order.filter" }),
        h("select", { "class": "select-pill", "data-module": "filter-bar", "data-visual-id": "date-filter", "aria-label": "Date range" }, [
          h("option", null, "All time"),
          h("option", null, "Last 30 days"),
          h("option", null, "Last 90 days")
        ]),
        h(
          "select",
          { "class": "select-pill", "data-module": "filter-bar", "data-visual-id": "location-filter", "aria-label": "Location" },
          [h("option", null, "All locations")].concat(fixture.addresses.map(function(a) {
            return h("option", null, a.label);
          }))
        )
      ])
    ]));
    var listWrap = h("div", { "class": "order-list", "data-module": "order-list", "data-visual-id": "order-list" });
    if (state.view === "loading") {
      for (var i = 0; i < 4; i++) listWrap.appendChild(skeletonRow());
    } else if (state.view === "empty" || filteredOrders().length === 0) {
      listWrap.appendChild(EmptyState({
        glyph: "\u{1F5D3}",
        title: "No orders yet",
        desc: "When you book a visit it shows up here with live status and invoices.",
        action: { variant: "btn--primary", label: "Book a service", action: "booking.open", visualId: "empty-book" }
      }));
    } else {
      filteredOrders().forEach(function(o) {
        listWrap.appendChild(OrderCard(o));
      });
    }
    ordersCard.appendChild(listWrap);
    left.appendChild(ordersCard);
    var quick = h("div", { "class": "card card--pad", "data-module": "glass-card" }, [
      h("div", { "class": "card__title", style: "margin-bottom:13px" }, "Quick book"),
      h(
        "div",
        { style: "display:flex;flex-direction:column;gap:9px" },
        v.svc.map(function(s, i2) {
          return ServiceCard(s, i2);
        })
      )
    ]);
    right.appendChild(quick);
    right.appendChild(MembershipCard(v.plan));
    grid.appendChild(left);
    grid.appendChild(right);
    page.appendChild(grid);
    return page;
  }

  // app-templates/customer-portal/runtime/src/components/commerce/PricingCard.js
  function PricingCard(props) {
    var featIcon = props.featured ? h("span", { "class": "plan-badge" }, "POPULAR") : null;
    var card = h("div", { "class": "plan-card" + (props.featured ? " plan-card--featured" : ""), "data-module": "pricing-card", "data-visual-id": "pricing-card", "data-state": props.current ? "current" : void 0 });
    if (props.featured) card.appendChild(h("div", { "class": "plan-sheen" }));
    var body = h("div", props.featured ? { style: "position:relative;display:flex;flex-direction:column;flex:1" } : null, [
      h("div", { "class": "plan-card__name" }, [h("span", null, props.name), featIcon]),
      h("div", { "class": "plan-card__price" }, [h("b", null, props.price), h("span", null, props.suffix || "/mo")]),
      h("div", { "class": "plan-card__tag" }, props.tag),
      h("div", { "class": "plan-features" }, props.features.map(function(f) {
        return h("div", null, "\u2713 " + f);
      })),
      props.current ? h("div", { "class": "plan-cta" }, "Current plan") : h("div", { style: "margin-top:18px" }, ActionButton({ variant: props.featured ? "btn--onaccent" : "btn--ghost", label: props.ctaLabel || "Activate plan", action: props.action || "booking.open", id: props.actionId, block: true, lg: true, visualId: "activate-plan" }))
    ]);
    card.appendChild(body);
    return card;
  }

  // app-templates/customer-portal/runtime/src/routes/ServicesPage.js
  function Services() {
    var v = currentTheme();
    var page = h("section", { "class": "page", "data-route": "services", "data-visual-id": "services" });
    page.appendChild(h("div", { "class": "section-head" }, [
      h("div", { "class": "section-head__title" }, "Our services"),
      h("div", { "class": "section-head__sub" }, "Choose a ritual, review the details, and manage every visit in one place.")
    ]));
    if (state.view === "loading") {
      var g = h("div", { "class": "services-grid" });
      for (var i = 0; i < 4; i++) g.appendChild(h("div", { "class": "skeleton", style: "height:280px;border-radius:24px" }));
      page.appendChild(g);
      return page;
    }
    page.appendChild(h("div", { "class": "services-grid", "data-module": "service-list" }, v.svc.map(function(s, i2) {
      return ServiceCatalogCard(s, i2);
    })));
    var steps2 = [
      { n: "1", t: "Choose your ritual", d: "Review the service that fits your day" },
      { n: "2", t: "Confirm your visit", d: "Your appointment appears in the portal" },
      { n: "3", t: "Keep your routine", d: "Return to notes and aftercare after the visit" }
    ];
    page.appendChild(h("div", { "class": "howto", "data-module": "how-it-works" }, [
      h("div", { "class": "panel__title", style: "margin-bottom:16px" }, "How it works"),
      h("div", { "class": "howto-grid" }, steps2.map(function(s) {
        return h("div", { "class": "howto-step" }, [
          h("div", { "class": "howto-step__num" }, s.n),
          h("div", null, [h("div", { style: "font-weight:600;font-size:14px" }, s.t), h("div", { style: "font-size:12.5px;color:var(--ink-2)" }, s.d)])
        ]);
      }))
    ]));
    return page;
  }

  // app-templates/customer-portal/runtime/src/routes/PricingPage.js
  function Pricing() {
    var v = currentTheme();
    var pricing = state.moduleData.pricing || {};
    var livePlans = pricing.source === "core-pim" ? pricing.plans : null;
    var page = h("section", { "class": "page", "data-route": "pricing", "data-visual-id": "pricing" });
    page.appendChild(h("div", { "class": "pricing-head" }, [
      h("span", { "class": "eyebrow" }, "Transparent, no surprises"),
      h("h1", { "data-bind": livePlans ? "pim.plan.name" : "plan.headline" }, livePlans ? "Plans from Core PIM" : v.plan.headline),
      h("p", null, livePlans ? "Live catalog data is loaded from Core PIM." : "Pay per visit, or save with a membership. Cancel anytime.")
    ]));
    var cards = livePlans ? livePlans.map(function(plan, index) {
      return PricingCard({
        name: plan.name,
        price: plan.price,
        suffix: plan.interval ? "/" + plan.interval.replace(/^1\s+/i, "").toLowerCase() : "",
        tag: plan.description || plan.cta,
        featured: index === 1,
        features: plan.description ? [plan.description] : [plan.code],
        action: plan.allowedActions && plan.allowedActions.includes("support.open") ? "support.open" : "cart.addItem",
        actionId: plan.name,
        ctaLabel: plan.cta || "Choose plan"
      });
    }) : [
      PricingCard({
        name: "Pay as you go",
        price: "Per ritual",
        tag: "Current total is shown before confirmation",
        current: true,
        features: ["Choose an individual ritual", "Keep appointments in one portal", "Review aftercare after your visit"]
      }),
      PricingCard({ name: v.plan.name, price: v.plan.monthlyPrice || "$9", tag: v.plan.tag, featured: true, features: v.plan.features }),
      PricingCard({ name: v.plan.plusName, price: v.plan.plusMonthlyPrice || "$19", tag: "For a deeper ritual rhythm", features: v.plan.plusFeatures })
    ];
    page.appendChild(h("div", { "class": "pricing-grid", "data-bind": livePlans ? "pim.plans" : "plan.cards" }, cards));
    var rates = h("div", { "class": "rates-card", "data-module": "rates-list", "data-visual-id": "per-visit-rates" }, [
      h("div", { "class": "panel__title", style: "font-size:16px;padding:14px 0 6px" }, livePlans ? "Core PIM catalog" : "Per-visit rates")
    ]);
    (livePlans || v.svc).forEach(function(s, i) {
      var pal = F.PAL[i % 4];
      rates.appendChild(h("div", { "class": "rate-row", "data-module": "rate-row" }, [
        h("div", { "class": "rate-row__icon", style: "background:" + pal[1] }, h("i", { style: "background:" + pal[0] })),
        h("div", { style: "flex:1" }, [
          h("div", { style: "font-weight:600;font-size:14px", "data-bind": "service.name" }, s.name),
          h("div", { style: "font-size:12px;color:var(--ink-2)" }, s.tagline || s.description || s.code)
        ]),
        h("div", { style: "font-weight:700;font-size:15px", "data-bind": "service.price" }, s.price === "Quote" ? "Quote" : s.price)
      ]));
    });
    page.appendChild(rates);
    return page;
  }

  // app-templates/customer-portal/runtime/src/components/commerce/ProductCard.js
  function ProductCard(p, catIndex) {
    var tint = F.TINTS[catIndex % 4];
    return h("div", { "class": "product-card", "data-module": "product-card", "data-visual-id": "product-card" }, [
      h(
        "div",
        { "class": "product-card__art", style: "background:" + tint[1] },
        h("div", { "class": "product-card__thumb" }, h("i", { style: "background:" + tint[0] }))
      ),
      h("span", { "class": "product-tag", "data-bind": "product.tag" }, p.tag || p.code || "Catalog"),
      h("div", { "class": "product-card__name", "data-bind": "product.name" }, p.name),
      h("div", { "class": "product-card__blurb", "data-bind": "product.blurb" }, p.blurb || p.description || p.cta),
      h("div", { "class": "product-card__foot" }, [
        h("div", { "class": "price-lg", "data-bind": "product.price" }, p.price),
        ActionButton({ variant: "btn--primary", label: p.allowedActions && p.allowedActions.includes("support.open") ? "Contact" : "Add", action: p.allowedActions && p.allowedActions.includes("support.open") ? "support.open" : "cart.addItem", id: p.name, visualId: "product-add" })
      ])
    ]);
  }

  // app-templates/customer-portal/runtime/src/routes/ProductsPage.js
  function Products() {
    var v = currentTheme();
    var products = state.moduleData.products || {};
    var liveProducts = products.source === "core-pim";
    var page = h("section", { "class": "page", "data-route": "products", "data-visual-id": "products" });
    page.appendChild(h("div", { "class": "featured-banner", "data-module": "featured-banner", "data-visual-id": "featured-banner" }, [
      h("div", { style: "flex:1" }, [
        h("span", { "class": "eyebrow", "data-bind": liveProducts ? "pim.catalog" : "feat.badge" }, liveProducts ? "Core PIM catalog" : v.feat.badge),
        h("h1", { "data-bind": liveProducts ? "pim.product.name" : "feat.title" }, liveProducts ? "Live catalog products" : v.feat.title),
        h("p", { "data-bind": liveProducts ? "pim.product.description" : "feat.desc" }, liveProducts ? "Products and purchasable plans are loaded from Core PIM." : v.feat.desc),
        h("div", { style: "display:flex;gap:11px;align-items:center" }, [
          ActionButton({ variant: "btn--ghost", label: liveProducts ? "Contact support" : v.feat.cta, action: liveProducts ? "support.open" : "booking.open", lg: true, visualId: "featured-cta" }),
          h("div", { style: "font-size:13px;color:rgba(255,255,255,.8)", "data-bind": "feat.fin" }, liveProducts ? "Live mode" : v.feat.fin)
        ])
      ]),
      h("div", { "class": "featured-banner__art" }, h("div", { style: "width:120px;height:56px;border-radius:12px;background:var(--surface);box-shadow:0 4px 14px rgba(var(--hair),.12)" }))
    ]));
    var cats = liveProducts ? [{ key: "all", label: "All" }] : [{ key: "all", label: "All" }].concat(v.cats);
    page.appendChild(h("div", { "class": "shop-head" }, [
      h("div", { "class": "shop-head__title" }, "Shop"),
      h("div", { "class": "tabs", "data-module": "filter-bar" }, cats.map(function(c) {
        return h("span", { "class": "tab" + (c.key === state.prodCat ? " tab--active" : ""), "data-action": "products.filter", "data-id": c.key }, c.label);
      }))
    ]));
    if (state.view === "loading") {
      var loading = h("div", { "class": "product-grid", "data-module": "product-list", "data-state": "loading" });
      for (var index = 0; index < 4; index++) loading.appendChild(skeletonRow());
      page.appendChild(loading);
      return page;
    }
    var list = productItems();
    if (!liveProducts && state.prodCat !== "all") list = list.filter(function(p) {
      return p.cat === state.prodCat;
    });
    if (state.view === "empty" || list.length === 0) {
      page.appendChild(EmptyState({ glyph: "\u{1F4E6}", title: "Nothing here yet", desc: "No products in this category. Try another filter." }));
      return page;
    }
    page.appendChild(h("div", { "class": "product-grid", "data-module": "product-list" }, list.map(function(p) {
      var ci = liveProducts ? 0 : Math.max(0, v.cats.findIndex(function(c) {
        return c.key === p.cat;
      }));
      return ProductCard(p, ci);
    })));
    return page;
  }

  // app-templates/customer-portal/runtime/src/components/commerce/CartRow.js
  function CartRow(item) {
    return h("div", { "class": "cart-row", "data-module": "cart-row", "data-visual-id": "cart-row" }, [
      h(
        "div",
        { "class": "cart-row__thumb", style: "background:" + item.tint },
        h("div", { "class": "cart-row__thumb-inner" }, h("i", { style: "background:" + item.dot }))
      ),
      h("div", { "class": "cart-row__body" }, [
        h("div", { style: "font-weight:700;font-size:14.5px", "data-bind": "product.name" }, item.name),
        h("div", { style: "font-size:13px;color:var(--ink-2)" }, item.price + " each")
      ]),
      h("div", { "class": "qty" }, [
        h("button", { "class": "qty__btn qty__btn--minus", "data-action": "cart.dec", "data-id": item.name, "aria-label": "Decrease" }, "\u2212"),
        h("div", { "class": "qty__val", "data-bind": "cart.qty" }, String(item.qty)),
        h("button", { "class": "qty__btn qty__btn--plus", "data-action": "cart.inc", "data-id": item.name, "aria-label": "Increase" }, "+")
      ]),
      h("div", { "class": "cart-row__total" }, money(item.priceNum * item.qty)),
      h("button", { "class": "cart-remove", "data-action": "cart.removeItem", "data-id": item.name }, "Remove")
    ]);
  }

  // app-templates/customer-portal/runtime/src/components/commerce/AddressCard.js
  function AddressCard(a) {
    var sel = state.addrId === a.id;
    return h("div", { "class": "select-card" + (sel ? " select-card--active" : ""), "data-module": "address-card", "data-visual-id": "address-card", "data-action": "checkout.pickAddress", "data-id": a.id, "data-state": sel ? "selected" : void 0 }, [
      h("div", { "class": "select-card__icon", style: "background:" + a.iconBg }, h("i", { style: "background:" + a.dot })),
      h("div", { style: "flex:1" }, [
        h("div", { style: "font-weight:600;font-size:14px", "data-bind": "address.label" }, a.label),
        h("div", { style: "font-size:12.5px;color:var(--ink-2)" }, a.line + " \xB7 " + a.city)
      ]),
      sel ? h("span", { "class": "select-card__check" }, "\u2713") : null
    ]);
  }

  // app-templates/customer-portal/runtime/src/components/commerce/PaymentMethodCard.js
  function PaymentCard(c) {
    var sel = state.payId === c.id;
    return h("div", { "class": "select-card" + (sel ? " select-card--active" : ""), "data-module": "payment-method-card", "data-visual-id": "payment-method-card", "data-action": "checkout.pickPayment", "data-id": c.id, "data-state": sel ? "selected" : void 0 }, [
      h("div", { "class": "card-chip" }),
      h("div", { style: "flex:1" }, [
        h("div", { style: "font-weight:600;font-size:14px", "data-bind": "card.brand,card.last4" }, c.brand + " \xB7\xB7\xB7\xB7 " + c.last4),
        h("div", { style: "font-size:12.5px;color:var(--ink-2)" }, "Expires " + c.exp)
      ]),
      sel ? h("span", { "class": "select-card__check" }, "\u2713") : null
    ]);
  }

  // app-templates/customer-portal/runtime/src/routes/CheckoutPage.js
  function Checkout() {
    var fixture = currentFixture();
    var theme = currentTheme();
    var page = h("section", { "class": "page", "data-route": "checkout", "data-visual-id": "checkout" });
    page.appendChild(h("div", { "class": "section-head" }, [
      h("div", { "class": "section-head__title" }, "Checkout"),
      h("div", { "class": "section-head__sub" }, "Review your items, delivery and payment.")
    ]));
    if (state.cartItems.length === 0 || state.view === "empty") {
      page.appendChild(h("div", { "class": "empty-cart", "data-module": "empty-state", "data-state": "empty", "data-visual-id": "empty-cart" }, [
        h("div", { "class": "empty-cart__glyph" }, "\u{1F6D2}"),
        h("div", { style: "font-weight:700;font-size:18px" }, "Your cart is empty"),
        h("div", { style: "font-size:14px;color:var(--ink-2);margin:6px 0 20px" }, "Browse Calm Harbor ritual products and add them to your order."),
        ActionButton({ variant: "btn--primary", label: "Browse products", action: "nav.go", id: "products", lg: true, visualId: "browse-products" })
      ]));
      return page;
    }
    var subtotal = state.cartItems.reduce(function(a, x) {
      return a + x.priceNum * x.qty;
    }, 0);
    var tax = Math.round(subtotal * 0.0825);
    var grid = h("div", { "class": "checkout-grid" });
    var left = h("div", { style: "display:flex;flex-direction:column;gap:16px" });
    var cartCard = h("div", { "class": "cart-card", "data-module": "cart-list", "data-visual-id": "cart-list" }, [h("div", { "class": "panel__title", style: "font-size:16px;padding:14px 0 4px" }, "Your cart")]);
    state.cartItems.forEach(function(it) {
      cartCard.appendChild(CartRow(it));
    });
    left.appendChild(cartCard);
    var addrPanel = h("div", { "class": "checkout-panel" }, [
      h("div", { "class": "panel__title", style: "font-size:16px;margin-bottom:13px" }, "Delivery address"),
      h("div", { style: "display:flex;flex-direction:column;gap:10px" }, fixture.addresses.map(AddressCard))
    ]);
    left.appendChild(addrPanel);
    var payPanel = h("div", { "class": "checkout-panel" }, [
      h("div", { "class": "panel__title", style: "font-size:16px;margin-bottom:13px" }, "Payment"),
      h("div", { style: "display:flex;flex-direction:column;gap:10px" }, fixture.cards.map(PaymentCard))
    ]);
    left.appendChild(payPanel);
    var summary = h("div", { "class": "checkout-panel checkout-summary", "data-module": "checkout-summary", "data-visual-id": "checkout-summary" }, [
      h("div", { "class": "panel__title", style: "font-size:16px;margin-bottom:16px" }, "Order summary"),
      h("div", { "class": "summary-row" }, [h("span", null, "Subtotal"), h("b", null, money(subtotal))]),
      h("div", { "class": "summary-row" }, [h("span", null, "Delivery"), h("b", { style: "color:var(--ok)" }, "Free")]),
      h("div", { "class": "summary-row" }, [h("span", null, "Est. tax"), h("b", null, money(tax))]),
      h("div", { "class": "summary-total" }, [h("span", null, "Total"), h("span", null, money(subtotal + tax))]),
      ActionButton({ variant: "btn--primary", label: "Place order", action: "checkout.placeOrder", block: true, lg: true, visualId: "place-order" }),
      h("div", { "class": "summary-note" }, theme.checkoutNote || "Orders are prepared by Calm Harbor and sent to your saved delivery address.")
    ]);
    grid.appendChild(left);
    grid.appendChild(summary);
    page.appendChild(grid);
    return page;
  }

  // app-templates/customer-portal/runtime/src/components/proposals/ProposalCard.js
  function ProposalCard(site) {
    var c = computeSite(site);
    var st = F.pstatus[site.status];
    var sub = site.city.split(",")[0] + " \xB7 " + c.total.toLocaleString() + " sq ft \xB7 " + (site.status === "approved" ? "chose " + F.planName(site.selected) : "3 plans offered");
    var fromPrice = site.status === "declined" ? null : "$" + c.monthly.toLocaleString();
    return h("div", { "class": "proposal-card", "data-module": "proposal-card", "data-visual-id": "proposal-card", "data-action": "proposal.open", "data-id": site.id, "data-state": site.status }, [
      h("div", { "class": "proposal-card__diamond", style: "background:" + st.dot }),
      h("div", { "class": "proposal-card__body" }, [
        h("div", { style: "font-weight:700;font-size:14.5px", "data-bind": "site.addr" }, site.addr),
        h("div", { style: "font-size:12.5px;color:var(--ink-2)" }, sub)
      ]),
      fromPrice ? h("div", { "class": "proposal-card__price" }, [fromPrice, h("span", null, "/mo")]) : null,
      StatusBadge({ variant: st.badge, label: st.label, bind: "site.statusLabel" }),
      h("span", { style: "font-weight:600;font-size:18px;color:#c2c7d0" }, "\u203A")
    ]);
  }

  // app-templates/customer-portal/runtime/src/components/profile/StatCard.js
  function statCard(label, num, color) {
    return h("div", { "class": "stat-card", "data-module": "stat-card" }, [
      h("div", { "class": "stat-card__label" }, label),
      h("div", { "class": "stat-card__num", style: color ? "color:" + color : "" }, num)
    ]);
  }

  // app-templates/customer-portal/runtime/src/routes/ProfilePage.js
  function Profile() {
    var fixture = currentFixture();
    var v = currentTheme();
    var c = fixture.customer;
    var page = h("section", { "class": "page page--narrow", "data-route": "profile", "data-visual-id": "profile" });
    page.appendChild(h("div", { "class": "profile-hero", "data-module": "profile-hero", "data-visual-id": "profile-hero" }, [
      h("div", { "class": "profile-hero__avatar" }),
      h("div", { style: "flex:1" }, [
        h("div", { "class": "profile-hero__name", "data-bind": "customer.fullName" }, c.fullName),
        h("div", { "class": "profile-hero__meta" }, c.phone + " \xB7 " + c.email),
        h("span", { "class": "profile-hero__badge" }, v.plan.name + " member \xB7 since " + c.memberSince)
      ]),
      ActionButton({ variant: "btn--onaccent", label: "Manage plan", action: "profile.managePlan", visualId: "manage-plan" })
    ]));
    page.appendChild(h("div", { "class": "stats-grid", "data-module": "profile-stats" }, [
      statCard("Orders", c.stats.orders, null),
      statCard("Spent this year", c.stats.spent, null),
      statCard("Plan savings", c.stats.savings, "var(--ok)")
    ]));
    var history = state.profileFilter === "all" ? state.orders : state.orders.filter(function(o) {
      return o.status === state.profileFilter;
    });
    var hist = h("div", { "class": "list-panel", "data-module": "order-list", "data-visual-id": "profile-history" }, [
      h("div", { "class": "list-panel__head" }, [
        h("div", { "class": "list-panel__title", style: "margin-right:4px" }, "Order history"),
        Tabs({ items: [
          { key: "all", label: "All" },
          { key: "inprogress", label: "Active" },
          { key: "scheduled", label: "Scheduled" },
          { key: "completed", label: "Done" }
        ], active: state.profileFilter, action: "profile.filter" })
      ])
    ]);
    var histList = h("div", { style: "display:flex;flex-direction:column" });
    if (history.length === 0) histList.appendChild(EmptyState({ glyph: "\u{1F5D3}", title: "Nothing here", desc: "No orders in this filter." }));
    else history.forEach(function(o) {
      histList.appendChild(OrderCard(o));
    });
    hist.appendChild(histList);
    page.appendChild(hist);
    var addrPanel = h("div", { "class": "list-panel" }, [
      h("div", { "class": "list-panel__head" }, [
        h("div", { "class": "list-panel__title", style: "flex:1" }, "Saved addresses"),
        h("div", { "class": "link-action", "data-action": "profile.addAddress" }, "+ Add address")
      ])
    ]);
    var addrList = h("div", { style: "display:flex;flex-direction:column;gap:10px" });
    fixture.addresses.forEach(function(a) {
      var isDefault = a.id === state.addrId;
      addrList.appendChild(h("div", { "class": "saved-row", "data-module": "address-card", "data-visual-id": "profile-address" }, [
        h("div", { "class": "saved-row__icon", style: "background:" + a.iconBg }, h("i", { style: "background:" + a.dot })),
        h("div", { "class": "saved-row__body" }, [
          h("div", { style: "display:flex;align-items:center;gap:8px" }, [
            h("div", { style: "font-weight:600;font-size:14px" }, a.label),
            isDefault ? h("span", { "class": "default-tag" }, "Default") : null
          ]),
          h("div", { style: "font-size:12.5px;color:var(--ink-2)" }, a.line + " \xB7 " + a.city)
        ]),
        isDefault ? h("div", { "class": "link-action", style: "color:var(--ink-3)", "data-action": "profile.updateAddress", "data-id": a.id }, "Edit") : h("div", { "class": "link-action", "data-action": "profile.setDefaultAddress", "data-id": a.id }, "Make default")
      ]));
    });
    addrPanel.appendChild(addrList);
    page.appendChild(addrPanel);
    var payPanel = h("div", { "class": "list-panel" }, [
      h("div", { "class": "list-panel__head" }, [
        h("div", { "class": "list-panel__title", style: "flex:1" }, "Payment methods"),
        h("div", { "class": "link-action", "data-action": "profile.addCard" }, "+ Add card")
      ])
    ]);
    var payList = h("div", { style: "display:flex;flex-direction:column;gap:10px" });
    fixture.cards.forEach(function(cd) {
      var isDefault = cd.id === state.payId;
      payList.appendChild(h("div", { "class": "saved-row", "data-module": "payment-method-card", "data-visual-id": "profile-card" }, [
        h("div", { "class": "card-chip card-chip--lg" }),
        h("div", { "class": "saved-row__body" }, [
          h("div", { style: "display:flex;align-items:center;gap:8px" }, [
            h("div", { style: "font-weight:600;font-size:14px" }, cd.brand + " \xB7\xB7\xB7\xB7 " + cd.last4),
            isDefault ? h("span", { "class": "default-tag" }, "Default") : null
          ]),
          h("div", { style: "font-size:12.5px;color:var(--ink-2)" }, "Expires " + cd.exp)
        ]),
        isDefault ? null : h("div", { "class": "link-action", "data-action": "profile.setDefaultPayment", "data-id": cd.id }, "Make default")
      ]));
    });
    payPanel.appendChild(payList);
    page.appendChild(payPanel);
    var prefs = [
      { key: "receipts", title: "Email receipts", desc: "Invoice & payment confirmations" },
      { key: "sms", title: "SMS appointment updates", desc: "Appointment reminders and arrival alerts" },
      { key: "marketing", title: "Offers & tips", desc: "Wellness rituals, products and seasonal offers" }
    ];
    var prefPanel = h("div", { "class": "list-panel", "data-module": "preferences" }, [h("div", { "class": "list-panel__title", style: "margin-bottom:16px" }, "Notifications")]);
    prefs.forEach(function(p) {
      prefPanel.appendChild(h("div", { "class": "pref-row" }, [
        h("div", { style: "flex:1" }, [
          h("div", { style: "font-weight:600;font-size:14px" }, p.title),
          h("div", { style: "font-size:12.5px;color:var(--ink-2)" }, p.desc)
        ]),
        Toggle(state.prefs[p.key], p.key)
      ]));
    });
    page.appendChild(prefPanel);
    page.appendChild(h("div", { "class": "signout-btn", "data-action": "auth.signOut", "data-visual-id": "sign-out" }, "Sign out"));
    return page;
  }

  // app-templates/customer-portal/runtime/src/routes/ActivityPage.js
  function Activity() {
    var fixture = currentFixture();
    var page = h("section", { "class": "page", style: "max-width:760px", "data-route": "activity", "data-visual-id": "activity" });
    page.appendChild(h("div", { "class": "activity-head" }, [
      h("div", { style: "flex:1" }, [
        h("div", { style: "font-weight:800;font-size:28px;line-height:1.15;letter-spacing:-.025em" }, "Activity"),
        h("div", { style: "font-size:14.5px;color:var(--ink-2);margin-top:3px" }, "Your appointments, orders and account updates, newest first.")
      ]),
      h("div", { "class": "tab", "data-action": "activity.markRead", "data-visual-id": "mark-read" }, "Mark all read")
    ]));
    page.appendChild(h(
      "div",
      { "class": "tabs", style: "margin:0 4px 18px", "data-module": "activity-filter" },
      fixture.feedTabs.map(function(t) {
        return h("span", { "class": "tab" + (t.key === state.feedFilter ? " tab--active" : ""), "data-action": "activity.filter", "data-id": t.key }, t.label);
      })
    ));
    var groups = fixture.activity.map(function(g) {
      return { day: g.day, items: g.items.filter(function(ev) {
        return state.feedFilter === "all" || ev.type === state.feedFilter;
      }) };
    }).filter(function(g) {
      return g.items.length;
    });
    if (groups.length === 0) {
      page.appendChild(EmptyState({ glyph: "\u{1F514}", title: "Nothing here", desc: "No activity in this filter yet." }));
      return page;
    }
    groups.forEach(function(g) {
      page.appendChild(h("div", { "class": "feed-day" }, g.day));
      var group = h("div", { "class": "feed-group", "data-module": "activity-feed" }, [h("div", { "class": "feed-line" })]);
      g.items.forEach(function(ev) {
        var card = h("div", { "class": "feed-card" }, [
          h("div", { style: "flex:1;min-width:0" }, [
            h("div", { style: "display:flex;align-items:center;gap:8px" }, [
              h("div", { style: "font-weight:700;font-size:14.5px" }, ev.title),
              ev.unread ? h("span", { "class": "unread-dot" }) : null
            ]),
            h("div", { style: "font-size:13px;line-height:1.45;color:var(--ink-2);margin-top:2px" }, ev.desc)
          ]),
          h("div", { "class": "feed-time" }, ev.time),
          ev.action ? h("div", { "class": "feed-action", "data-action": "activity.act", "data-id": ev.act }, ev.action) : null
        ]);
        group.appendChild(h("div", { "class": "feed-item", "data-module": "activity-item", "data-visual-id": "activity-item" }, [
          h("div", { "class": "feed-item__icon", style: "background:" + ev.iconBg }, h("i", { style: "background:" + ev.dot })),
          card
        ]));
      });
      page.appendChild(group);
    });
    return page;
  }

  // app-templates/customer-portal/runtime/src/routes/SupportPage.js
  function Support() {
    var fixture = currentFixture();
    var page = h("section", { "class": "page", "data-route": "support", "data-visual-id": "support" });
    page.appendChild(h("div", { "class": "section-head" }, [
      h("div", { "class": "section-head__title" }, "How can we help, " + fixture.customer.firstName + "?"),
      h("div", { "class": "section-head__sub" }, "Chat with the Calm Harbor team about your appointment, products or account.")
    ]));
    var grid = h("div", { "class": "support-grid" });
    var rail = h("div", { "class": "help-rail" });
    var helpPanel = h("div", { "class": "help-panel", "data-module": "help-rail", "data-visual-id": "help-rail" }, [
      h("div", { "class": "help-search" }, "Search help articles\u2026"),
      h("div", { style: "font-weight:700;font-size:14px;margin-bottom:12px" }, "Common topics")
    ]);
    var topics = h("div", { style: "display:flex;flex-direction:column;gap:9px" });
    fixture.helpTopics.forEach(function(t) {
      topics.appendChild(h("div", { "class": "help-topic", "data-module": "help-topic", "data-action": "support.helpTopic", "data-id": t.q }, [
        h("div", { "class": "help-topic__icon", style: "background:" + t.iconBg }, h("i", { style: "background:" + t.dot })),
        h("div", { style: "flex:1;font-weight:600;font-size:13px" }, t.label),
        h("div", { style: "color:#b7bcc7;font-size:16px" }, "\u203A")
      ]));
    });
    helpPanel.appendChild(topics);
    rail.appendChild(helpPanel);
    rail.appendChild(h("div", { "class": "call-card", "data-module": "call-card" }, [
      h("div", { style: "font-weight:700;font-size:15px" }, "Prefer to talk?"),
      h("div", { style: "font-size:13px;line-height:1.5;opacity:.7;margin-top:5px" }, "Call the studio team during opening hours, or send us a message here."),
      h("div", { "class": "call-card__btns" }, [
        h("div", { "class": "call-card__btn call-card__btn--solid", "data-action": "support.call" }, "Call now"),
        h("div", { "class": "call-card__btn call-card__btn--ghost", "data-action": "support.email" }, "Email")
      ])
    ]));
    grid.appendChild(rail);
    var thread = h("div", { "class": "chat-thread", "data-module": "chat-thread", "data-visual-id": "chat-thread" }, [h("div", { "class": "chat-day" }, "Today")]);
    state.messages.forEach(function(m) {
      var user = m.from === "user";
      thread.appendChild(h(
        "div",
        { "class": "msg-row " + (user ? "msg-row--user" : "msg-row--agent") },
        h("div", { "class": "msg-bubble " + (user ? "msg-bubble--user" : "msg-bubble--agent") }, m.text)
      ));
    });
    if (state.typing) thread.appendChild(h("div", { "class": "msg-row msg-row--agent" }, h("div", { "class": "typing" }, [
      h("span", { "class": "typing-dot" }),
      h("span", { "class": "typing-dot", style: "animation-delay:.2s" }),
      h("span", { "class": "typing-dot", style: "animation-delay:.4s" })
    ])));
    var quick = h("div", { "class": "quick-replies" }, fixture.quickReplies.map(function(q) {
      return h("span", { "class": "quick-reply", "data-action": "support.quickReply", "data-id": q }, q);
    }));
    var input = h("input", { "class": "composer__input", placeholder: "Type a message\u2026", value: state.chatInput, "aria-label": "Message" });
    input.addEventListener("input", function() {
      state.chatInput = input.value;
    });
    input.addEventListener("keydown", function(e) {
      if (e.key === "Enter") {
        e.preventDefault();
        composer.querySelector('[data-action="support.sendMessage"]').click();
      }
    });
    var commandError = state.commandErrors["support.sendMessage:_"];
    var composer = h("div", {
      "class": "composer",
      "data-module": "chat-composer",
      "data-visual-id": "chat-composer",
      style: commandError ? "position:relative;padding-bottom:38px" : void 0
    }, [
      h("div", { "class": "composer__add" }, "+"),
      input,
      h("button", { "class": "composer__send", "data-action": "support.sendMessage", "aria-label": "Send" }, "\u2191")
    ]);
    if (commandError) {
      composer.appendChild(h("div", {
        "class": "composer__error",
        "data-state": "validation-error",
        "data-command-error": "support.sendMessage:_",
        "role": "alert",
        style: "position:absolute;left:64px;right:64px;bottom:8px;color:var(--danger);font-size:12px"
      }, commandError));
    }
    var panel = h("div", { "class": "chat-panel", "data-module": "chat-panel", "data-visual-id": "chat-panel" }, [
      h("div", { "class": "chat-header" }, [
        h("div", { "class": "chat-avatar" }, [h("div", { "class": "chat-avatar__img" }), h("span", { "class": "online-dot" })]),
        h("div", { style: "flex:1" }, [
          h("div", { style: "font-weight:700;font-size:15px" }, "Nina \xB7 Calm Harbor"),
          h("div", { style: "font-size:12.5px;color:var(--ok)" }, "Online now")
        ]),
        h("div", { "class": "chat-ticket" }, "Ticket #SP-104")
      ]),
      thread,
      quick,
      composer
    ]);
    grid.appendChild(panel);
    page.appendChild(grid);
    return page;
  }

  // app-templates/customer-portal/runtime/src/routes/ProposalDetailPage.js
  function noteBox(title, body) {
    return h("div", { "class": "note-box" }, [
      h("div", { style: "font-weight:700;font-size:12.5px" }, title),
      h("div", { style: "font-size:12px;line-height:1.45;color:var(--ink-2);margin-top:3px" }, body)
    ]);
  }
  function beamMap() {
    var rects = [
      "left:30%;top:34%;width:42%;height:34%;background:rgba(60,70,90,.45);border-radius:4px",
      "left:6%;top:20%;width:18%;height:62%;background:rgba(52,199,89,.45);border:1.5px solid #34c759;border-radius:3px",
      "left:30%;top:74%;width:42%;height:13%;background:rgba(255,214,10,.5);border:1.5px solid #ffd60a;border-radius:3px",
      "left:74%;top:22%;width:18%;height:40%;background:rgba(255,107,74,.42);border:1.5px solid #ff6b4a;border-radius:3px",
      "left:30%;top:24%;width:42%;height:7%;background:rgba(58,144,255,.45);border:1.5px solid #2f7be0;border-radius:3px",
      "left:6%;top:86%;width:86%;height:7%;background:rgba(199,125,255,.4);border:1.5px solid #c77dff;border-radius:3px"
    ];
    var map = h("div", { "class": "beam-map" }, [
      h("span", { "class": "beam-map__label", style: "top:13px;left:15px" }, "Beam AI \xB7 aerial property report")
    ]);
    rects.forEach(function(s) {
      map.appendChild(h("div", { style: "position:absolute;" + s }));
    });
    map.appendChild(h("span", { "class": "beam-map__label", style: "bottom:11px;left:15px" }, "licensed via ibeam.ai \u2014 drops in here"));
    return map;
  }
  function ProposalDetail() {
    var v = F.themes[state.theme];
    var p = currentSite();
    var c = computeSite(p);
    var st = F.pstatus[p.status];
    var page = h("section", { "class": "page page--narrow", "data-route": "proposal.detail", "data-visual-id": "proposal-detail", "data-state": p.status });
    page.appendChild(h("div", { "class": "detail-back", "data-action": "proposal.review", "data-visual-id": "proposal-back" }, "\u2039 Back to proposal"));
    page.appendChild(h("div", { "class": "proposal-detail-head" }, [
      h("div", { style: "flex:1" }, [
        h("div", { "class": "proposal-detail-head__title", "data-bind": "site.addr" }, p.addr),
        h("div", { "class": "proposal-detail-head__meta" }, p.city + " " + p.postal + " \xB7 lot " + p.lot + " sq ft")
      ]),
      StatusBadge({ variant: st.badge, label: st.label, bind: "site.statusLabel" })
    ]));
    var side = h("div", { "class": "beam-side" }, [
      h("div", { style: "display:flex;justify-content:space-between;align-items:baseline;margin-bottom:11px" }, [
        h("span", { style: "font-weight:700;font-size:14px" }, "Measured surfaces"),
        h("span", { style: "font-size:11.5px;color:var(--ink-3)" }, "serviceable")
      ])
    ]);
    c.rows.forEach(function(su) {
      side.appendChild(h("div", { "class": "surface-row" }, [
        h("span", { "class": "surface-swatch", style: "background:" + su.color }),
        h("span", { style: "flex:1;font-weight:590;font-size:13px" }, su.name),
        h("span", { style: "font-weight:700;font-size:13px;white-space:nowrap" }, [su.area, " ", h("span", { style: "color:var(--ink-3);font-weight:500" }, "sq ft")])
      ]));
    });
    side.appendChild(h("div", { "class": "beam-total" }, [
      h("span", { style: "font-weight:700;font-size:13.5px" }, "Total serviceable"),
      h("span", { style: "font-weight:800;font-size:16px;color:var(--accent)" }, c.total.toLocaleString() + " sq ft")
    ]));
    page.appendChild(h(
      "div",
      { "class": "beam-report", "data-module": "beam-report", "data-visual-id": "beam-report" },
      h("div", { "class": "beam-report__grid" }, [beamMap(), side])
    ));
    var comp = ProposalComparison(p, c);
    page.appendChild(comp.el);
    page.appendChild(h("div", { style: "margin:0 4px 12px" }, [
      h("div", { style: "font-weight:800;font-size:19px;letter-spacing:-.01em" }, v.prop.svc + " \u2014 choose your plan"),
      h("div", { style: "font-size:13px;color:var(--ink-2);margin-top:3px" }, "Approving one option declines the other two. Request a revision and we\u2019ll re-quote all three.")
    ]));
    var plans = [
      { id: "897", name: "Flex Service Plan", tag: "Pay-as-you-go \xB7 Order #34897", isFlex: true, desc: "Best for smaller or low-exposure sites. Billed per service at the rates above." },
      { id: "898", name: "Seasonal Unlimited Coverage", tag: "Order #34898", badge: "MOST SELECTED", priceMain: comp.monthlyStr, priceSub: "/ mo \xD7 5 \xB7 " + v.prop.months, desc: "Predictable budget, full-season protection. " + v.prop.unlimDesc + " GPS logs + photos after every visit." },
      { id: "899", name: "Season-Lock Prepaid", tag: "Order #34899", badge: "BEST VALUE", badgeGreen: true, priceMain: comp.lockStr, priceSub: "one-time \xB7 season", desc: "Maximum cost certainty for the whole season. 10% saving vs. monthly. " + v.prop.unlimDesc }
    ];
    plans.forEach(function(pl) {
      var sel = pl.id === p.selected;
      var opt = h("div", { "class": "plan-option" + (sel ? " plan-option--sel" : ""), "data-module": "plan-option", "data-visual-id": "plan-option", "data-action": "proposal.selectPlan", "data-id": pl.id, "data-state": sel ? "selected" : void 0 });
      if (pl.badge) opt.appendChild(h("span", { "class": "plan-badge2" + (pl.badgeGreen ? " plan-badge2--green" : "") }, pl.badge));
      opt.appendChild(h("div", { "class": "plan-radio" + (sel ? " plan-radio--sel" : "") }, sel ? h("i") : null));
      opt.appendChild(h("div", { "class": "plan-option__body" }, [
        h("div", { style: "display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding-right:104px" }, [
          h("span", { style: "font-weight:700;font-size:15.5px" }, pl.name),
          h("span", { style: "font-size:12px;color:var(--ink-3)" }, pl.tag)
        ]),
        h("div", { style: "font-size:13px;line-height:1.5;color:var(--ink-2);margin-top:4px" }, pl.desc)
      ]));
      var price = h("div", { "class": "plan-option__price" });
      if (pl.isFlex) {
        price.appendChild(h("div", { style: "font-weight:800;font-size:17px" }, [c.clearStr, h("span", { style: "font-weight:500;font-size:12.5px;color:var(--ink-3)" }, " " + v.prop.unitA)]));
        price.appendChild(h("div", { style: "font-weight:800;font-size:17px" }, [c.deiceStr, h("span", { style: "font-weight:500;font-size:12.5px;color:var(--ink-3)" }, " " + v.prop.unitB)]));
      } else {
        price.appendChild(h("div", { style: "font-weight:800;font-size:19px" }, pl.priceMain));
        price.appendChild(h("div", { style: "font-size:12px;color:var(--ink-2)" }, pl.priceSub));
      }
      opt.appendChild(price);
      page.appendChild(opt);
    });
    var decided = p.status === "approved" || p.status === "revision" || p.status === "declined";
    if (decided) {
      var note = p.status === "approved" ? "You approved " + F.planName(p.selected) + " \u2014 a live order was created." : p.status === "revision" ? "Revision requested \u2014 our team will re-quote all three options." : "You declined this proposal.";
      page.appendChild(h("div", { "class": "proposal-decided" }, [
        h("div", { "class": "proposal-decided__icon" }, "i"),
        h("div", { style: "font-size:13px;line-height:1.45;color:var(--ink-2)" }, note + " You can still change your decision below.")
      ]));
    }
    var selId = p.selected || "898";
    page.appendChild(h("div", { "class": "proposal-actions" }, [
      ActionButton({ variant: "btn--primary", label: "Approve " + F.planName(selId), action: "proposal.approve", block: true, lg: true, visualId: "proposal-approve" }),
      ActionButton({ variant: "btn--ghost", label: "Request revision", action: "proposal.requestRevision", lg: true, visualId: "proposal-revise" }),
      ActionButton({ variant: "btn--danger", label: "Decline", action: "proposal.decline", lg: true, visualId: "proposal-decline" })
    ]));
    return page;
  }

  // app-templates/customer-portal/runtime/src/components/proposals/ProposalComparison.js
  function ProposalComparison(site, c) {
    var v = F.themes[state.theme];
    var seasonStr = "$" + (Math.round(c.unlim / 25) * 25).toLocaleString();
    var monthlyStr = "$" + c.monthly.toLocaleString();
    var lockStr = "$" + c.seasonLock.toLocaleString();
    var table = h("div", { "class": "pricing-table", "data-module": "proposal-comparison", "data-visual-id": "proposal-comparison" });
    table.appendChild(h("div", { "class": "pt-title" }, [
      h("span", { style: "font-weight:800;font-size:16px;letter-spacing:-.01em" }, "Pricing from measured area"),
      h("span", { style: "font-size:12px;color:var(--ink-3)" }, "rate \xD7 Beam AI surface \xB7 per visit")
    ]));
    table.appendChild(h("div", { "class": "pt-grid pt-head" }, [
      h("div", null, "Surface"),
      h("div", { style: "text-align:right" }, "Area"),
      h("div", { style: "text-align:right", "data-bind": "prop.colA" }, v.prop.colA),
      h("div", { style: "text-align:right", "data-bind": "prop.colB" }, v.prop.colB)
    ]));
    c.rows.forEach(function(su) {
      table.appendChild(h("div", { "class": "pt-grid pt-row" }, [
        h("div", { style: "display:flex;align-items:center;gap:9px" }, [h("span", { "class": "surface-swatch", style: "background:" + su.color }), su.name]),
        h("div", { style: "text-align:right;color:var(--ink-2)" }, su.area),
        h("div", { style: "text-align:right;font-weight:600" }, [su.clear, " ", h("span", { style: "color:var(--ink-3);font-weight:500;font-size:11px" }, su.clearRate)]),
        h("div", { style: "text-align:right;font-weight:600" }, [su.deice, " ", h("span", { style: "color:var(--ink-3);font-weight:500;font-size:11px" }, su.deiceRate)])
      ]));
    });
    table.appendChild(h("div", { "class": "pt-grid pt-row", style: "color:var(--ink-2)" }, [
      h("div", null, "Site mobilization"),
      h("div", { style: "text-align:right" }, "\u2014"),
      h("div", { style: "text-align:right;font-weight:600;color:var(--ink)" }, "$" + F.MOB_CLEAR),
      h("div", { style: "text-align:right;font-weight:600;color:var(--ink)" }, "$" + F.MOB_DEICE)
    ]));
    table.appendChild(h("div", { "class": "pt-grid pt-total" }, [
      h("div", { style: "font-weight:800;font-size:14px" }, "Per-visit total"),
      h("div"),
      h("div", { style: "text-align:right;font-weight:800;font-size:16px" }, c.clearStr),
      h("div", { style: "text-align:right;font-weight:800;font-size:16px" }, c.deiceStr)
    ]));
    table.appendChild(h("div", { "class": "plan-notes" }, [
      noteBox("Flex", "Billed at the per-visit totals above."),
      noteBox("Seasonal Unlimited", ["Expected season \u2248 ", h("b", { style: "color:var(--ink)" }, seasonStr), " \xF7 5 mo = ", h("b", { style: "color:var(--accent)" }, monthlyStr + "/mo"), ", uncapped."]),
      noteBox("Season-Lock", [seasonStr + " prepaid ", h("b", { style: "color:var(--ink)" }, "\u221210%"), " = ", h("b", { style: "color:var(--accent)" }, lockStr), "."])
    ]));
    return { el: table, seasonStr, monthlyStr, lockStr };
  }

  // app-templates/customer-portal/runtime/src/routes/ProposalsPage.js
  function proposalRollup() {
    var r = { approved: 0, revision: 0, declined: 0, unseen: 0, viewed: 0 };
    state.psites.forEach(function(p) {
      r[p.status]++;
    });
    return r;
  }
  function ProposalsList() {
    var r = proposalRollup();
    var decided = r.approved + r.revision + r.declined;
    var open = r.unseen + r.viewed;
    var page = h("section", { "class": "page page--narrow", "data-route": "proposals.list", "data-visual-id": "proposals-list" });
    page.appendChild(h("div", { "class": "proposals-head" }, [
      h("div", { style: "flex:1" }, [
        h("div", { style: "font-weight:800;font-size:28px;line-height:1.15;letter-spacing:-.025em", "data-bind": "proposal.id" }, "Proposal #" + F.proposal.id),
        h("div", { style: "font-size:14.5px;color:var(--ink-2);margin-top:3px" }, open + " property choices open \xB7 sent " + F.proposal.sent + " \xB7 valid until " + F.proposal.validUntil)
      ]),
      h("span", { "class": "proposals-head__pill" }, decided + " of " + state.psites.length + " decided")
    ]));
    if (state.view === "empty") {
      page.appendChild(EmptyState({ glyph: "\u{1F4C4}", title: "No proposals yet", desc: "When our team sends you a multi-site proposal, it shows up here." }));
      return page;
    }
    var canvas = h("div", { "class": "portfolio-map__canvas" }, [
      h("span", { "class": "portfolio-map__label" }, "portfolio map \xB7 Port Coquitlam \xB7 Coquitlam"),
      h("div", { "class": "portfolio-map__river" })
    ]);
    state.psites.forEach(function(p) {
      var st = F.pstatus[p.status];
      canvas.appendChild(h("div", { "class": "map-pin-wrap", style: "left:" + p.x + "%;top:" + p.y + "%" }, [
        h("div", { "class": "map-pin-diamond", style: "background:" + st.dot }),
        h("div", { "class": "map-pin-label" }, p.addr)
      ]));
    });
    page.appendChild(h("div", { "class": "portfolio-map", "data-module": "portfolio-map", "data-visual-id": "portfolio-map" }, canvas));
    page.appendChild(h("div", { "class": "rollup-grid", "data-module": "proposal-rollup" }, [
      rollupCard("Approved", r.approved, "var(--ok)"),
      rollupCard("Revision", r.revision, "var(--warn)"),
      rollupCard("Declined", r.declined, "var(--danger)"),
      rollupCard("Open", open, "var(--ink-3)")
    ]));
    page.appendChild(h("div", { "class": "site-list", "data-module": "proposal-list", "data-visual-id": "proposal-list" }, state.psites.map(ProposalCard)));
    page.appendChild(h("div", { "class": "proposal-footer" }, [
      h("div", { "class": "proposal-footer__icon" }, "\u2726"),
      h("div", { style: "flex:1;font-size:13px;line-height:1.5;color:var(--ink-2)" }, "Decide each site independently. Every price is derived from that site\u2019s Beam AI measured area, so larger lots scale up automatically. Approved lines become live orders the moment you confirm.")
    ]));
    return page;
  }
  function rollupCard(label, num, color) {
    return h("div", { "class": "rollup-card" }, [
      h("div", { "class": "rollup-card__label" }, label),
      h("div", { "class": "rollup-card__num", style: "color:" + color }, String(num))
    ]);
  }

  // app-templates/customer-portal/runtime/src/routes/LandingPage.js
  function Landing() {
    var v = currentTheme();
    var profile = activeProfile();
    var storm = profile.weatherCalendar;
    var page = h("section", { "class": "page", "data-route": "landing", "data-visual-id": "landing" });
    var quoteCard = h("div", { "class": "landing-quote", "data-module": "quote-card", "data-visual-id": "quote-card" }, [
      h("div", { style: "font-weight:700;font-size:17px;margin-bottom:14px" }, storm ? "Protect your property this season" : "Get a quote in 30s"),
      h("div", { style: "display:flex;flex-direction:column;gap:10px" }, [
        quoteField("What do you need?", v.svc[0].name),
        quoteField("When?", storm ? "This season" : "Today"),
        h("div", { "class": "quote-addr", "data-action": profile.primary.action }, "Your address\u2026"),
        ActionButton({ variant: "btn--primary", label: storm ? "Get seasonal quote" : "See price & book", action: profile.primary.action, block: true, lg: true, visualId: "landing-quote-cta" }),
        h("div", { style: "text-align:center;font-size:11.5px;color:var(--ink-3)" }, "No card needed to get a quote")
      ])
    ]);
    page.appendChild(h(
      "div",
      { "class": "landing-hero", "data-module": "landing-hero", "data-visual-id": "landing-hero" },
      h("div", { "class": "landing-hero__inner" }, [
        h("div", null, [
          h("span", { "class": "eyebrow landing-hero__badge", "data-bind": "hero.badge" }, v.hero.badge),
          h("h1", { "class": "landing-hero__title", "data-bind": "hero.title" }, v.hero.title),
          h("p", { "class": "landing-hero__sub", "data-bind": "hero.sub" }, v.hero.sub),
          h("div", { style: "display:flex;gap:11px;align-items:center;flex-wrap:wrap" }, [
            ActionButton({ variant: "btn--onaccent", label: "Sign in to portal", action: "auth.gotoSignin", lg: true, visualId: "hero-signin" }),
            ActionButton({ variant: "btn--glass-hero", label: storm ? "See plans" : "See pricing", action: "auth.gotoSignin", lg: true, visualId: "hero-pricing" })
          ]),
          h("div", { "class": "landing-social" }, [
            h("div", { "class": "avatar-stack" }, [
              h("div", { "class": "avatar-stack__a", style: "background:linear-gradient(160deg,#ffd27a,#ff9b6a)" }),
              h("div", { "class": "avatar-stack__a", style: "background:linear-gradient(160deg,#c7e0ff,#88b4ff)" }),
              h("div", { "class": "avatar-stack__a", style: "background:linear-gradient(160deg,#b7f5d0,#6fd99a)" })
            ]),
            h("div", { style: "font-size:13px;color:rgba(255,255,255,.85)" }, "\u2605 4.9 \u2014 loved by 12k customers")
          ])
        ]),
        quoteCard
      ])
    ));
    var cat = v.svc.slice(0, 3);
    page.appendChild(h("div", { "class": "landing-services" }, cat.map(function(s, i) {
      var pal = F.PAL[i % 4];
      return h("div", { "class": "landing-svc", "data-module": "service-card", "data-visual-id": "landing-service-card", "data-action": profile.primary.action, "data-id": s.name }, [
        h("div", { "class": "landing-svc__icon", style: "background:" + pal[1] }, h("i", { style: "background:" + pal[0] })),
        h("div", { style: "font-weight:700;font-size:16px" }, s.name),
        h("div", { style: "font-size:13px;color:var(--ink-2);margin-top:4px" }, "From " + s.price)
      ]);
    })));
    return page;
  }
  function quoteField(label, value) {
    return h("div", { "class": "quote-field", "data-action": activeProfile().primary.action }, [
      label,
      h("span", { style: "font-weight:700;color:var(--ink)" }, value + " \u25BE")
    ]);
  }
  function pitchRow(dot, bg, text5) {
    return h("div", { style: "display:flex;align-items:center;gap:12px" }, [
      h("div", { style: "width:34px;height:34px;border-radius:10px;background:" + bg + ";display:grid;place-items:center" }, h("i", { style: "width:12px;height:12px;border-radius:4px;background:" + dot + ";display:block" })),
      h("div", { style: "font-size:14px;color:var(--ink-2)" }, text5)
    ]);
  }

  // app-templates/customer-portal/runtime/src/routes/AuthPage.js
  function Auth() {
    var page = h("section", { "class": "page auth-page", "data-route": state.route, "data-visual-id": state.route });
    var grid = h("div", { "class": "auth-grid" });
    grid.appendChild(h("div", { "class": "auth-pitch" }, [
      h("span", { "class": "eyebrow" }, "Your customer account"),
      h("h1", { "class": "auth-pitch__title" }, "Sign in to track every visit."),
      h("p", { "class": "auth-pitch__sub" }, "One account for all your properties \u2014 bookings, live tracking, invoices and your membership in one place."),
      h("div", { style: "display:flex;flex-direction:column;gap:14px;max-width:360px" }, [
        pitchRow("var(--accent)", "rgba(var(--accent-rgb),.12)", "Book in under a minute"),
        pitchRow("#1f8a44", "rgba(52,199,89,.16)", "Track your technician live"),
        pitchRow("#7a52e0", "rgba(122,82,224,.16)", "Save with a membership")
      ])
    ]));
    var step = state.route === "auth.code" ? "code" : "phone";
    var card = h("div", { "class": "auth-card", "data-module": "auth-card", "data-visual-id": "auth-card", "data-state": "auth-" + step });
    if (step === "phone") card.appendChild(AuthPhone());
    else card.appendChild(AuthCode());
    grid.appendChild(card);
    page.appendChild(grid);
    return page;
  }
  function AuthPhone() {
    var err = state.authError;
    var input = h("input", { "class": "auth-phone__input", placeholder: "(555) 000-0000", value: state.phone, inputmode: "tel", "aria-label": "Phone number" });
    input.addEventListener("input", function() {
      state.phone = input.value;
    });
    input.addEventListener("keydown", function(e) {
      if (e.key === "Enter") validatePhone();
    });
    return h("div", { "data-state": "auth-phone" }, [
      h("div", { "class": "brand-logo brand-logo--lg", style: "margin-bottom:18px" }),
      h("div", { style: "font-weight:800;font-size:22px;letter-spacing:-.02em" }, "Welcome to Aircove"),
      h("div", { style: "font-size:14px;color:var(--ink-2);margin:4px 0 22px" }, "Enter your phone to get a one-time code."),
      h("div", { style: "font-weight:600;font-size:12px;color:var(--ink-3);letter-spacing:.04em;text-transform:uppercase;margin-bottom:8px" }, "Phone number"),
      h("div", { "class": "auth-phone" + (err ? " auth-phone--error" : "") }, [
        h("div", { "class": "auth-phone__cc" }, "\u{1F1FA}\u{1F1F8} +1"),
        input
      ]),
      err ? h("div", { "class": "auth-error", "data-state": "validation-error" }, err) : null,
      h("div", { style: "margin-top:18px" }, ActionButton({ variant: "btn--primary", label: "Send code", action: "auth.sendCode", block: true, lg: true, visualId: "send-code" })),
      h("div", { "class": "auth-divider" }, [h("span", { "class": "auth-divider__line" }), h("span", { style: "font-size:12px;color:var(--ink-3)" }, "or"), h("span", { "class": "auth-divider__line" })]),
      h("div", { "class": "auth-apple", "data-action": "auth.apple", "data-visual-id": "apple-signin" }, [h("span", { "class": "auth-apple__mark" }), "Continue with Apple"]),
      h("div", { style: "text-align:center;font-size:12px;line-height:1.5;color:var(--ink-3);margin-top:18px" }, "By continuing you agree to our Terms & Privacy Policy.")
    ]);
  }
  function AuthCode() {
    var err = state.authError;
    var code = state.code || "";
    var boxEls = [];
    var boxes = h("div", { "class": "otp" }, [0, 1, 2, 3].map(function(i) {
      var filled = i < code.length;
      var active = i === code.length;
      var el = h("div", { "class": "otp__box" + (filled ? " otp__box--filled" : "") + (active && !err ? " otp__box--active" : "") + (err ? " otp__box--error" : "") }, filled ? code[i] : active ? "" : "");
      boxEls.push(el);
      return el;
    }));
    var input = h("input", { "class": "otp__input", inputmode: "numeric", maxlength: "4", value: code, "aria-label": "Verification code", autocomplete: "one-time-code" });
    input.addEventListener("input", function() {
      var v = input.value.replace(/\D/g, "").slice(0, 4);
      input.value = v;
      state.code = v;
      boxEls.forEach(function(el, i) {
        el.className = "otp__box" + (i < v.length ? " otp__box--filled" : "") + (i === v.length ? " otp__box--active" : "");
        el.textContent = i < v.length ? v[i] : "";
      });
    });
    input.addEventListener("keydown", function(e) {
      if (e.key === "Enter") validateCode();
    });
    return h("div", { "data-state": "auth-code" }, [
      h("div", { "class": "auth-back", "data-action": "auth.back" }, "\u2039 Back"),
      h("div", { style: "font-weight:800;font-size:22px;letter-spacing:-.02em" }, "Enter the code"),
      h("div", { style: "font-size:14px;color:var(--ink-2);margin:4px 0 22px" }, "We sent a 4-digit code to " + (state.phone ? "+1 " + state.phone : "+1 (555) \u2022\u2022\u2022-\u20220000") + "."),
      h("div", { "class": "otp-wrap" }, [boxes, input]),
      err ? h("div", { "class": "auth-error", "data-state": "validation-error", style: "margin-top:14px" }, err) : null,
      h("div", { style: "margin-top:22px" }, ActionButton({ variant: "btn--primary", label: "Verify & continue", action: "auth.verifyCode", block: true, lg: true, visualId: "verify-code" })),
      h("div", { style: "text-align:center;font-size:13px;color:var(--ink-2);margin-top:18px" }, ["Didn\u2019t get it? ", h("span", { style: "color:var(--accent);font-weight:600;cursor:pointer", "data-action": "auth.resend" }, "Resend")])
    ]);
  }

  // app-templates/customer-portal/runtime/src/activation-policy.js
  var HEALTH_CONTROL_SET = Object.freeze([
    "rbac",
    "consent",
    "audit",
    "secureViewerOrDownload",
    "leastData"
  ]);
  var HEALTH_SENSITIVE_IDS = Object.freeze([
    "care.live",
    "care.contactProvider",
    "care.openSecureDoc",
    "care.health.order.open",
    "care.health.order.reschedule",
    "care.health.support.call"
  ]);
  var CARE_SURFACE_CLOSED_IDS = Object.freeze([
    "care.hvac.booking.open",
    "care.lawn.service.requestExtra",
    "care.pool.service.requestExtra",
    "care.health.order.open",
    "care.health.order.reschedule",
    "care.health.support.call",
    "care.beauty.order.reschedule",
    "care.beauty.booking.open"
  ]);
  function markCareControlUnavailable(control, reason) {
    control.setAttribute("disabled", "");
    control.setAttribute("aria-disabled", "true");
    control.setAttribute("data-state", "unavailable");
    control.setAttribute("title", reason);
    return control;
  }

  // app-templates/customer-portal/runtime/src/components/care/shared.js
  function careChip(kind, label) {
    var map = { ok: "status-badge--ok", warn: "status-badge--warn", issue: "status-badge--danger", info: "status-badge--info", muted: "status-badge--scheduled" };
    return h("span", { "class": "status-badge " + (map[kind] || map.muted), "data-module": "status-badge", "data-state": kind }, label);
  }
  function DocRow(d) {
    return h("div", { "class": "log-row", "data-module": "document-row", "data-visual-id": "document-row", "data-document-id": d.id }, [
      h("div", { style: "flex:1;min-width:0" }, [
        h("div", { style: "font-weight:600;font-size:13.5px", "data-bind": "doc.name" }, d.name),
        h("div", { style: "font-size:12px;color:var(--ink-3);margin-top:1px", "data-bind": "doc.meta" }, d.meta)
      ]),
      markCareControlUnavailable(h("div", {
        "class": "link-action",
        "data-action": "care.download",
        "data-id": d.id,
        role: "link",
        tabindex: "-1"
      }, "Download"), "Download is unavailable: no approved document destination")
    ]);
  }
  function kvRow(label, val) {
    return h("div", { "class": "kv-row", style: "padding:5px 0" }, [h("span", null, label), h("b", null, val)]);
  }

  // app-templates/customer-portal/runtime/src/components/care/EquipmentHub.js
  var CHECK_DOT = { ok: "var(--ok)", warn: "#ff9f0a", issue: "#ff3b30" };
  function healthColor(n) {
    return n >= 80 ? "var(--ok)" : n >= 60 ? "#ff9f0a" : "#ff3b30";
  }
  function EquipmentHub(m, ui) {
    var u = m.units.find(function(x) {
      return x.id === ui.selectedUnitId;
    }) || m.units[0];
    var picker = h(
      "div",
      { "class": "unit-row", "data-module": "unit-picker", "data-visual-id": "unit-picker" },
      m.units.map(function(unit) {
        var active = unit.id === u.id;
        return h("button", {
          "class": "unit-pick" + (active ? " unit-pick--active" : ""),
          "data-action": "care.selectUnit",
          "data-id": unit.id,
          "data-state": active ? "active" : void 0
        }, [
          h("div", { style: "display:flex;align-items:center;gap:8px" }, [
            h("span", { style: "font-weight:700;font-size:14.5px;flex:1", "data-bind": "unit.name" }, unit.name),
            h("span", { style: "font-weight:700;font-size:12.5px;color:" + healthColor(unit.health), "data-bind": "unit.health" }, unit.health + "%")
          ]),
          h("div", { style: "font-size:12px;color:var(--ink-3);margin:2px 0 8px" }, unit.model + " \xB7 " + unit.place),
          h("div", { "class": "health-bar" }, [h("div", { "class": "health-bar__fill", style: "width:" + unit.health + "%;background:" + healthColor(unit.health) })])
        ]);
      })
    );
    var report = h("div", { "class": "card card--pad", "data-module": "diagnostic-report", "data-visual-id": "diagnostic-report" }, [
      h("div", { style: "display:flex;align-items:center;gap:9px" }, [
        h("div", { "class": "card__title", style: "flex:1" }, "Latest diagnostic"),
        h("span", { style: "font-size:12.5px;color:var(--ink-3)" }, u.lastVisit)
      ])
    ]);
    u.checks.forEach(function(g) {
      report.appendChild(h("div", { "class": "check-group" }, g.group));
      g.items.forEach(function(c) {
        report.appendChild(h("div", { "class": "check-row", "data-module": "check-row", "data-state": c.state }, [
          h("span", { "class": "check-dot", style: "background:" + (CHECK_DOT[c.state] || CHECK_DOT.ok) }),
          h("span", { style: "flex:1;min-width:0" }, c.name),
          c.note ? h("span", { style: "font-size:12px;color:var(--ink-3)" }, c.note) : null,
          h("span", { style: "font-weight:600" }, c.val)
        ]));
      });
    });
    var passport = h("div", { "class": "card card--pad", "data-module": "equipment-passport", "data-visual-id": "equipment-passport" }, [
      h("div", { "class": "card__title", style: "margin-bottom:10px" }, "Unit passport"),
      kvRow("Model", u.model),
      kvRow("Location", u.place),
      kvRow("Serial", u.serial),
      kvRow("Installed", u.installed),
      kvRow("Warranty", u.warranty),
      kvRow("Last serviced", u.lastVisit),
      h("div", { style: "margin-top:14px;background:rgba(var(--accent-rgb),.06);border:1px solid rgba(var(--accent-rgb),.14);border-radius:14px;padding:12px 14px;font-size:13px;color:var(--ink-2)" }, [
        h("b", { style: "color:var(--ink)" }, "Technician\u2019s note \xB7 "),
        u.note
      ]),
      h("div", { style: "margin-top:14px" }, markCareControlUnavailable(ActionButton({ variant: "btn--primary", label: "Book service for this unit", action: "booking.open", block: true, visualId: "care-book-unit" }), "Booking is unavailable: no approved booking destination"))
    ]);
    var docs = h("div", { "class": "list-panel", "data-module": "document-vault", "data-visual-id": "document-vault" }, [
      h("div", { "class": "list-panel__head" }, [h("div", { "class": "list-panel__title", style: "flex:1" }, "Reports & warranties")])
    ].concat(m.docs.map(DocRow)));
    return h("div", { "class": "care-grid" }, [
      h("div", { "class": "care-col" }, [picker, report]),
      h("div", { "class": "care-col" }, [passport, docs])
    ]);
  }

  // app-templates/customer-portal/runtime/src/components/care/SeasonLog.js
  function SeasonLog(m) {
    var stats = h(
      "div",
      { "class": "care-stats", "data-module": "season-stats", "data-visual-id": "season-stats" },
      m.stats.map(function(s) {
        return h("div", { "class": "care-stat" }, [
          h("div", { style: "font-size:12px;color:var(--ink-3)" }, s.label),
          h("div", { style: "font-weight:800;font-size:20px;margin-top:2px" }, s.value)
        ]);
      })
    );
    var log = h("div", { "class": "list-panel", "data-module": "storm-log", "data-visual-id": "storm-log" }, [
      h("div", { "class": "list-panel__head" }, [
        h("div", { "class": "list-panel__title", style: "flex:1" }, "Storm responses"),
        h("span", { style: "font-size:12.5px;color:var(--ink-3)" }, "GPS-logged \xB7 this season")
      ])
    ]);
    m.events.forEach(function(ev) {
      log.appendChild(h("div", { "class": "log-row", "data-module": "storm-log-row", "data-state": ev.sla ? "ok" : "warn" }, [
        h("div", { "class": "log-date" }, ev.date),
        h("div", { style: "flex:1;min-width:0" }, [
          h("div", { style: "display:flex;align-items:center;gap:8px;flex-wrap:wrap" }, [
            h("span", { style: "font-weight:600;font-size:13.5px", "data-bind": "event.storm" }, ev.storm),
            careChip(ev.sla ? "ok" : "warn", ev.sla ? "SLA met" : "SLA missed")
          ]),
          h(
            "div",
            { style: "font-size:12px;color:var(--ink-3);margin-top:2px" },
            ev.trigger + " \xB7 response " + ev.response + " \xB7 " + ev.material + (ev.note ? " \xB7 " + ev.note : "")
          )
        ]),
        ev.photos ? h("div", { "class": "link-action", "data-action": "order.open", "data-id": ev.orderId || "#SV-3290" }, "Report \u203A") : null
      ]));
    });
    var sla = h("div", { "class": "card card--pad", "data-module": "sla-meter", "data-visual-id": "sla-meter" }, [
      h("div", { "class": "card__title", style: "margin-bottom:10px" }, "SLA this season"),
      h("div", { "class": "score-big" }, m.sla.pct + "%"),
      h("div", { "class": "meter" }, [h("div", { "class": "meter__fill", style: "width:" + m.sla.pct + "%" })]),
      h("div", { style: "font-size:12.5px;color:var(--ink-2);margin-top:10px" }, m.sla.label)
    ]);
    var docs = h("div", { "class": "list-panel", "data-module": "compliance-reports", "data-visual-id": "compliance-reports" }, [
      h("div", { "class": "list-panel__head" }, [
        h("div", { "class": "list-panel__title", style: "flex:1" }, "Compliance reports"),
        h("span", { style: "font-size:12px;color:var(--ink-3)" }, "slip-and-fall record")
      ])
    ].concat(m.docs.map(DocRow)));
    return h("div", null, [stats, h("div", { "class": "care-grid" }, [
      h("div", { "class": "care-col" }, [log]),
      h("div", { "class": "care-col" }, [sla, docs])
    ])]);
  }

  // app-templates/customer-portal/runtime/src/components/care/LawnProgram.js
  var STEP_CHIP = { done: ["ok", "Done"], next: ["info", "Next up"], upcoming: ["muted", "Planned"] };
  function LawnProgram(m) {
    var program = h("div", { "class": "card card--pad", "data-module": "program-steps", "data-visual-id": "program-steps" }, [
      h("div", { style: "display:flex;align-items:center" }, [
        h("div", { "class": "card__title", style: "flex:1" }, "5-step season program"),
        markCareControlUnavailable(h("div", { "class": "link-action", "data-action": "service.requestExtra", role: "button", tabindex: "-1" }, "Add a visit"), "Extra visits are unavailable: no approved request contract")
      ])
    ]);
    m.steps.forEach(function(s) {
      var c = STEP_CHIP[s.status] || STEP_CHIP.upcoming;
      var numStyle = s.status === "done" ? "background:rgba(52,199,89,.16);color:#1f8a44" : s.status === "next" ? "background:rgba(var(--accent-rgb),.14);color:var(--accent)" : "background:rgba(120,120,128,.12);color:var(--ink-3)";
      program.appendChild(h("div", { "class": "step-row", "data-module": "program-step", "data-state": s.status }, [
        h("div", { "class": "step-num", style: numStyle }, String(s.n)),
        h("div", { style: "flex:1;min-width:0" }, [
          h("div", { style: "font-weight:600;font-size:14px", "data-bind": "step.name" }, s.name),
          h("div", { style: "font-size:12.5px;color:var(--ink-2);margin-top:1px" }, s.detail + " \xB7 " + s.window)
        ]),
        h("div", { style: "text-align:right" }, [
          careChip(c[0], c[1]),
          h("div", { style: "font-size:11.5px;color:var(--ink-3);margin-top:4px" }, s.when)
        ])
      ]));
    });
    var reentry = h("div", { "class": "reentry-card", "data-module": "reentry-card", "data-visual-id": "reentry-card", "data-state": m.reentry.active ? "pending-action" : "ready" }, [
      h("div", { style: "display:flex;align-items:center;gap:8px" }, [
        h("span", { style: "font-weight:700;font-size:14.5px;flex:1;color:#b5670a" }, "Kids & pets \u2014 re-entry"),
        careChip("warn", "Active")
      ]),
      h("div", { style: "font-weight:800;font-size:21px;letter-spacing:-.02em;margin:10px 0 2px", "data-bind": "reentry.safeAfter" }, m.reentry.safeAfter),
      h("div", { style: "font-size:13px;color:var(--ink-2)" }, m.reentry.treatment),
      h("div", { style: "font-size:12.5px;color:var(--ink-2);margin-top:8px" }, m.reentry.note)
    ]);
    var soil = h("div", { "class": "card card--pad", "data-module": "soil-snapshot", "data-visual-id": "soil-snapshot" }, [
      h("div", { "class": "card__title", style: "margin-bottom:8px" }, "Soil snapshot")
    ].concat(m.soil.map(function(r) {
      return kvRow(r.label, r.value);
    })));
    var photos = h("div", { "class": "card card--pad", "data-module": "progress-photos", "data-visual-id": "progress-photos" }, [
      h("div", { "class": "card__title", style: "margin-bottom:12px" }, "Lawn progress"),
      h(
        "div",
        { style: "display:grid;grid-template-columns:repeat(3,1fr);gap:8px" },
        m.photos.map(function(p) {
          return h("div", null, [
            h("div", { "class": "photo-tile" + (p.tone === "after" ? " photo-tile--after" : "") }, [h("span", null, "lawn photo")]),
            h("div", { style: "font-size:11.5px;color:var(--ink-3);margin-top:5px;text-align:center" }, p.label)
          ]);
        })
      )
    ]);
    return h("div", { "class": "care-grid" }, [
      h("div", { "class": "care-col" }, [program]),
      h("div", { "class": "care-col" }, [reentry, soil, photos])
    ]);
  }

  // app-templates/customer-portal/runtime/src/components/care/WaterQuality.js
  function WaterQuality(m) {
    var readings = h(
      "div",
      { "class": "reading-grid", "data-module": "water-readings", "data-visual-id": "water-readings" },
      m.readings.map(function(r) {
        return h("div", { "class": "reading-card", "data-module": "reading-card", "data-state": r.state }, [
          h("div", { style: "display:flex;align-items:center;gap:8px" }, [
            h("span", { style: "font-size:12.5px;color:var(--ink-2);flex:1", "data-bind": "reading.name" }, r.name),
            careChip(r.state, r.state === "ok" ? "In range" : "Low")
          ]),
          h("div", { style: "font-weight:800;font-size:24px;letter-spacing:-.02em;margin-top:6px", "data-bind": "reading.value" }, r.value),
          h("div", { style: "font-size:11.5px;color:var(--ink-3);margin-top:2px" }, r.target),
          h("div", { "class": "spark", title: "last 5 visits" }, r.series.map(function(v) {
            return h("span", { style: "height:" + v + "%" });
          })),
          r.note ? h("div", { style: "font-size:12px;color:#b5670a;margin-top:8px;font-weight:600" }, r.note) : null
        ]);
      })
    );
    var doses = h("div", { "class": "list-panel", "data-module": "dose-log", "data-visual-id": "dose-log" }, [
      h("div", { "class": "list-panel__head" }, [
        h("div", { "class": "list-panel__title", style: "flex:1" }, "Dosing log"),
        h("span", { style: "font-size:12.5px;color:var(--ink-3)" }, "what was added, and why")
      ])
    ]);
    m.doses.forEach(function(d) {
      doses.appendChild(h("div", { "class": "log-row", "data-module": "dose-row" }, [
        h("div", { "class": "log-date" }, d.date),
        h("div", { style: "flex:1;min-width:0" }, [
          h("div", { style: "font-weight:600;font-size:13.5px" }, d.what),
          h("div", { style: "font-size:12px;color:var(--ink-3);margin-top:1px" }, d.why)
        ])
      ]));
    });
    var status = h("div", { "class": "status-banner status-banner--ok", "data-module": "status-banner", "data-visual-id": "swim-ready" }, [
      h("div", { style: "flex:1" }, [
        h("div", { style: "font-weight:700;font-size:15px" }, "Swim-ready"),
        h("div", { style: "font-size:13px;color:var(--ink-2);margin-top:2px" }, "Alkalinity is being corrected \u2014 dose added at the last visit; safe to swim.")
      ])
    ]);
    var cadence = h("div", { "class": "card card--pad", "data-module": "test-cadence", "data-visual-id": "test-cadence" }, [
      h("div", { "class": "card__title", style: "margin-bottom:10px" }, "Testing cadence"),
      h("div", { style: "font-size:13.5px;font-weight:600" }, m.tested),
      h("div", { style: "font-size:13px;color:var(--ink-2);margin-top:6px" }, m.nextTest),
      h("div", { style: "margin-top:14px" }, markCareControlUnavailable(ActionButton({ variant: "btn--ghost", label: "Request an extra test", action: "service.requestExtra", block: true, visualId: "care-extra-test" }), "Extra tests are unavailable: no approved request contract"))
    ]);
    return h("div", { "class": "care-grid" }, [
      h("div", { "class": "care-col" }, [readings, doses]),
      h("div", { "class": "care-col" }, [status, cadence])
    ]);
  }

  // app-templates/customer-portal/runtime/src/components/care/RoofReport.js
  var SEV = { ok: ["ok", "Sound"], warn: ["warn", "Monitor"], issue: ["issue", "Repair"] };
  function RoofReport(m) {
    var zones = h("div", { "class": "card card--pad", "data-module": "roof-zones", "data-visual-id": "roof-zones" }, [
      h("div", { style: "display:flex;align-items:center" }, [
        h("div", { "class": "card__title", style: "flex:1" }, "Findings by zone"),
        h("span", { style: "font-size:12.5px;color:var(--ink-3)" }, "drone survey \xB7 18 photos")
      ])
    ]);
    m.zones.forEach(function(z) {
      var s = SEV[z.sev] || SEV.ok;
      zones.appendChild(h("div", { "class": "log-row", "data-module": "zone-row", "data-state": z.sev }, [
        h("div", { style: "flex:1;min-width:0" }, [
          h("div", { style: "font-weight:600;font-size:13.5px", "data-bind": "zone.name" }, z.zone),
          h("div", { style: "font-size:12.5px;color:var(--ink-2);margin-top:1px" }, z.note)
        ]),
        careChip(s[0], s[1])
      ]));
    });
    var steps2 = h("div", { "class": "timeline" }, [h("div", { "class": "timeline__line" })].concat(
      m.project.steps.map(function(st) {
        return h("div", { "class": "timeline-step", "data-module": "timeline-step" }, [
          h("div", { "class": "timeline-step__dot", style: "background:" + st.dot }),
          h("div", null, [
            h("div", { "class": "timeline-step__title", style: st.muted ? "color:var(--ink-3)" : "" }, st.label),
            h("div", { "class": "timeline-step__sub" }, st.sub)
          ])
        ]);
      })
    ));
    var project = h("div", { "class": "card card--pad", "data-module": "project-tracker", "data-visual-id": "project-tracker" }, [
      h("div", { style: "display:flex;align-items:center;gap:9px" }, [
        h("div", { "class": "card__title", style: "flex:1" }, m.project.name),
        careChip("info", "In progress")
      ]),
      h("div", { style: "font-size:12.5px;color:var(--ink-2);margin:2px 0 16px" }, m.project.eta),
      steps2
    ]);
    var score = h("div", { "class": "card card--pad", "data-module": "roof-score", "data-visual-id": "roof-score" }, [
      h("div", { style: "display:flex;align-items:center;gap:9px" }, [
        h("div", { "class": "card__title", style: "flex:1" }, "Roof condition"),
        careChip("ok", m.grade)
      ]),
      h("div", { style: "display:flex;align-items:baseline;gap:6px;margin-top:10px" }, [
        h("span", { "class": "score-big", "data-bind": "roof.score" }, m.score),
        h("span", { style: "font-size:14px;color:var(--ink-3);font-weight:600" }, "/ 100")
      ]),
      h("div", { style: "font-size:12.5px;color:var(--ink-2);margin-top:8px" }, m.inspected),
      h("div", { style: "font-size:12.5px;color:var(--ink-2)" }, m.nextDue)
    ]);
    var docs = h("div", { "class": "list-panel", "data-module": "document-vault", "data-visual-id": "document-vault" }, [
      h("div", { "class": "list-panel__head" }, [h("div", { "class": "list-panel__title", style: "flex:1" }, "Documents")])
    ].concat(m.docs.map(DocRow)));
    return h("div", { "class": "care-grid" }, [
      h("div", { "class": "care-col" }, [zones, project]),
      h("div", { "class": "care-col" }, [score, docs])
    ]);
  }

  // app-templates/customer-portal/runtime/src/components/care/PestMonitoring.js
  var ST = { clear: ["ok", "Clear"], alert: ["issue", "Activity"], refreshed: ["info", "Refreshed"] };
  var PIN = { clear: "#1f8a44", alert: "#ff3b30", refreshed: "var(--accent)" };
  function PestMonitoring(m, ui) {
    var summary = h(
      "div",
      { "class": "care-stats", style: "grid-template-columns:repeat(3,1fr)", "data-module": "monitoring-summary", "data-visual-id": "monitoring-summary" },
      m.summary.map(function(s) {
        return h("div", { "class": "care-stat" }, [
          h("div", { style: "font-size:12px;color:var(--ink-3)" }, s.label),
          h("div", { style: "font-weight:800;font-size:20px;margin-top:2px" }, s.value)
        ]);
      })
    );
    var map = h("div", { "class": "station-map", "data-module": "station-map", "data-visual-id": "station-map" }, [
      h("span", { "class": "map-label" }, "station map \xB7 your property")
    ].concat(m.stations.map(function(s) {
      return h("div", {
        "class": "station-pin",
        title: s.label,
        "data-state": s.status,
        style: "left:" + s.x + "%;top:" + s.y + "%;background:" + (PIN[s.status] || PIN.clear)
      }, s.id);
    })));
    var list = h("div", { "class": "card", "data-module": "station-list", "data-visual-id": "station-list" }, [
      h("div", { "class": "card__head" }, [h("span", { "class": "card__title" }, "Stations & sensors")]),
      h("div", { style: "padding:0 18px" }, [map])
    ]);
    var rows = h("div", { style: "padding:0 18px 12px" });
    m.stations.forEach(function(s) {
      var c = ST[s.status] || ST.clear;
      rows.appendChild(h("div", { "class": "log-row", "data-module": "station-row", "data-state": s.status }, [
        h("div", { "class": "log-date" }, s.id),
        h("div", { style: "flex:1;min-width:0" }, [
          h("div", { style: "font-weight:600;font-size:13.5px", "data-bind": "station.label" }, s.label),
          h("div", { style: "font-size:12px;color:var(--ink-3);margin-top:1px" }, s.type + " \xB7 " + s.last + (s.note ? " \xB7 " + s.note : ""))
        ]),
        careChip(c[0], c[1])
      ]));
    });
    list.appendChild(rows);
    var rStatus = ui.retreatPending || ui.retreatRequest && ui.retreatRequest.status === "submitting" ? "requesting" : ui.retreatRequest && ui.retreatRequest.status === "submitted" ? "used" : m.guarantee.status || "available";
    var sc = m.guarantee.scope;
    var retreatBody;
    if (rStatus === "requesting") {
      retreatBody = h("button", {
        "class": "btn btn--primary btn--block",
        disabled: true,
        "aria-busy": "true",
        "data-module": "action-button",
        "data-visual-id": "care-retreat",
        "data-state": "requesting"
      }, [h("span", { "class": "btn-spinner" }), "Requesting\u2026"]);
    } else if (rStatus === "used") {
      retreatBody = h("button", {
        "class": "btn btn--ghost btn--block",
        disabled: true,
        "data-module": "action-button",
        "data-visual-id": "care-retreat",
        "data-state": "unavailable"
      }, "Re-treat used this quarter");
    } else {
      retreatBody = h("button", {
        "class": "btn btn--primary btn--block",
        "data-module": "action-button",
        "data-visual-id": "care-retreat",
        "data-state": "available",
        "data-action": "care.requestRetreat",
        "data-id": sc.planId,
        "data-property-id": sc.propertyId,
        "data-service-id": sc.serviceId
      }, "Request free re-treat");
    }
    var guarantee = h("div", { "class": "card card--pad", "data-module": "retreat-card", "data-visual-id": "retreat-card", "data-state": rStatus }, [
      h("div", { "class": "card__title" }, m.guarantee.title),
      h(
        "div",
        { style: "font-size:13px;color:var(--ink-2);margin-top:6px", "data-bind": "guarantee.note" },
        rStatus === "used" ? m.guarantee.usedNote : m.guarantee.note
      ),
      rStatus === "requesting" ? h("div", { style: "font-size:12px;color:var(--ink-3);margin-top:8px" }, "Sending your request \u2014 your technician confirms the visit window.") : null,
      ui.retreatError ? h("div", { style: "font-size:12px;color:var(--danger);margin-top:8px", "data-state": "error" }, ui.retreatError) : null,
      h("div", { style: "margin-top:14px" }, [retreatBody])
    ]);
    var alerts = h("div", { "class": "list-panel", "data-module": "alert-log", "data-visual-id": "alert-log" }, [
      h("div", { "class": "list-panel__head" }, [h("div", { "class": "list-panel__title", style: "flex:1" }, "Sensor alerts")])
    ]);
    m.alerts.forEach(function(a) {
      alerts.appendChild(h("div", { "class": "log-row", "data-module": "alert-row", "data-state": a.state }, [
        h("span", { "class": "check-dot", style: "background:" + (a.state === "alert" ? "#ff3b30" : "var(--ok)") }),
        h("div", { style: "flex:1;min-width:0" }, [
          h("div", { style: "font-weight:600;font-size:13px" }, a.text),
          h("div", { style: "font-size:11.5px;color:var(--ink-3);margin-top:2px" }, a.when)
        ])
      ]));
    });
    return h("div", null, [summary, h("div", { "class": "care-grid" }, [
      h("div", { "class": "care-col" }, [list]),
      h("div", { "class": "care-col" }, [guarantee, alerts])
    ])]);
  }

  // app-templates/customer-portal/runtime/src/components/care/HealthCareHub.js
  var STEP_CHIP2 = { done: ["ok", "Done"], next: ["info", "Next up"], upcoming: ["muted", "Planned"] };
  function taskDone(t, ui) {
    return t.id in ui.tasksDone ? ui.tasksDone[t.id] : !!t.done;
  }
  function HealthCareHub(m, ui) {
    var a = m.appointment;
    var appt = h("div", { "class": "card card--pad", "data-module": "care-appointment", "data-visual-id": "care-appointment", "data-appointment-id": a.id, "data-provider-id": a.providerId }, [
      h("div", { style: "display:flex;align-items:center;gap:9px" }, [
        h("div", { "class": "card__title", style: "flex:1" }, "Next appointment"),
        careChip("info", "Scheduled")
      ]),
      h("div", { style: "font-weight:800;font-size:20px;letter-spacing:-.02em;margin:10px 0 2px", "data-bind": "appointment.when" }, a.when),
      h("div", { style: "font-size:13.5px;color:var(--ink-2)", "data-bind": "appointment.name" }, a.name + " \xB7 " + a.provider),
      h("div", { style: "font-size:12.5px;color:var(--ink-3);margin-top:2px" }, a.where),
      h("div", { style: "margin-top:12px;background:rgba(var(--accent-rgb),.06);border:1px solid rgba(var(--accent-rgb),.14);border-radius:14px;padding:11px 14px;font-size:12.5px;color:var(--ink-2)" }, [
        h("b", { style: "color:var(--ink)" }, "Before the visit \xB7 "),
        a.prep
      ]),
      h("div", { style: "display:flex;gap:10px;margin-top:14px" }, [
        markCareControlUnavailable(ActionButton({ variant: "btn--primary", label: "Reschedule", action: "order.reschedule", id: a.orderId, visualId: "care-appt-reschedule" }), "Rescheduling is unavailable: no approved scheduling contract"),
        markCareControlUnavailable(ActionButton({ variant: "btn--ghost", label: "Visit details", action: "order.open", id: a.orderId, visualId: "care-appt-open" }), "Visit details are unavailable: Health access controls are not complete")
      ])
    ]);
    var plan = h("div", { "class": "card card--pad", "data-module": "care-plan", "data-visual-id": "care-plan", "data-plan-id": m.plan.id }, [
      h("div", { style: "display:flex;align-items:center;gap:9px" }, [
        h("div", { "class": "card__title", style: "flex:1", "data-bind": "plan.name" }, m.plan.name),
        h("span", { style: "font-size:12.5px;color:var(--ink-3)" }, m.plan.cadence)
      ])
    ]);
    m.plan.milestones.forEach(function(s) {
      var c = STEP_CHIP2[s.status] || STEP_CHIP2.upcoming;
      var numStyle = s.status === "done" ? "background:rgba(52,199,89,.16);color:#1f8a44" : s.status === "next" ? "background:rgba(var(--accent-rgb),.14);color:var(--accent)" : "background:rgba(120,120,128,.12);color:var(--ink-3)";
      plan.appendChild(h("div", { "class": "step-row", "data-module": "plan-milestone", "data-state": s.status }, [
        h("div", { "class": "step-num", style: numStyle }, String(s.n)),
        h("div", { style: "flex:1;min-width:0" }, [
          h("div", { style: "font-weight:600;font-size:14px", "data-bind": "milestone.name" }, s.name),
          h("div", { style: "font-size:12.5px;color:var(--ink-2);margin-top:1px" }, s.detail)
        ]),
        h("div", { style: "text-align:right" }, [
          careChip(c[0], c[1]),
          h("div", { style: "font-size:11.5px;color:var(--ink-3);margin-top:4px" }, s.when)
        ])
      ]));
    });
    var doneCount = m.tasks.filter(function(task) {
      return taskDone(task, ui);
    }).length;
    var tasks = h("div", { "class": "list-panel", "data-module": "follow-up-tasks", "data-visual-id": "follow-up-tasks" }, [
      h("div", { "class": "list-panel__head" }, [
        h("div", { "class": "list-panel__title", style: "flex:1" }, "Follow-up tasks"),
        h("span", { style: "font-size:12px;color:var(--ink-3)" }, doneCount + " of " + m.tasks.length + " done")
      ])
    ]);
    m.tasks.forEach(function(t) {
      var done = taskDone(t, ui);
      tasks.appendChild(h("div", { "class": "log-row", "data-module": "task-row", "data-task-id": t.id, "data-state": done ? "done" : "open" }, [
        h("button", {
          "data-action": "care.completeTask",
          "data-id": t.id,
          "aria-pressed": done ? "true" : "false",
          title: done ? "Mark as not done" : "Mark as done",
          style: "width:24px;height:24px;border-radius:999px;flex-shrink:0;cursor:pointer;display:grid;place-items:center;font-family:inherit;font-size:12px;padding:0;border:1.5px solid " + (done ? "var(--accent)" : "rgba(120,120,128,.4)") + ";background:" + (done ? "var(--accent)" : "transparent") + ";color:#fff"
        }, done ? "\u2713" : ""),
        h("div", { style: "flex:1;min-width:0" }, [
          h("div", { style: "font-weight:600;font-size:13.5px;" + (done ? "text-decoration:line-through;color:var(--ink-3)" : ""), "data-bind": "task.label" }, t.label),
          h("div", { style: "font-size:12px;color:var(--ink-3);margin-top:1px" }, t.due)
        ])
      ]));
    });
    var p = m.provider;
    var provider = h("div", { "class": "card card--pad", "data-module": "provider-card", "data-visual-id": "provider-card", "data-provider-id": p.id }, [
      h("div", { style: "display:flex;align-items:center;gap:12px" }, [
        h(
          "div",
          { style: "width:46px;height:46px;border-radius:999px;background:rgba(var(--accent-rgb),.14);color:var(--accent);display:grid;place-items:center;font-weight:800;font-size:16px;flex-shrink:0" },
          p.name.split(" ").map(function(w) {
            return w[0];
          }).join("").slice(0, 2)
        ),
        h("div", { style: "flex:1;min-width:0" }, [
          h("div", { style: "font-weight:700;font-size:15px", "data-bind": "provider.name" }, p.name),
          h("div", { style: "font-size:12.5px;color:var(--ink-2)" }, p.role)
        ])
      ]),
      h("div", { style: "font-size:12.5px;color:var(--ink-3);margin-top:8px" }, p.org + " \xB7 " + p.since),
      h("div", { style: "display:flex;flex-direction:column;gap:8px;margin-top:14px" }, [
        markCareControlUnavailable(ActionButton({ variant: "btn--primary", label: "Message the care team", action: "care.contactProvider", id: p.id, block: true, visualId: "care-contact-provider" }), "Provider contact is unavailable: secure authorization and audit controls are not complete"),
        markCareControlUnavailable(ActionButton({ variant: "btn--ghost", label: "Call", action: "support.call", block: true, visualId: "care-call-provider" }), "Provider calling is unavailable: no approved destination or audit contract")
      ]),
      h("div", { style: "font-size:12px;color:var(--ink-3);margin-top:10px" }, p.note)
    ]);
    var docs = h("div", { "class": "list-panel", "data-module": "secure-documents", "data-visual-id": "secure-documents" }, [
      h("div", { "class": "list-panel__head" }, [
        h("div", { "class": "list-panel__title", style: "flex:1" }, "Secure documents"),
        careChip("muted", "\u26BF Secure")
      ])
    ]);
    m.docs.forEach(function(d) {
      docs.appendChild(h("div", { "class": "log-row", "data-module": "secure-document-row", "data-document-id": d.id }, [
        h("div", { style: "flex:1;min-width:0" }, [
          h("div", { style: "font-weight:600;font-size:13.5px", "data-bind": "doc.name" }, d.name),
          h("div", { style: "font-size:12px;color:var(--ink-3);margin-top:1px", "data-bind": "doc.meta" }, d.meta)
        ]),
        h("div", { "class": "link-action", "data-action": "care.openSecureDoc", "data-id": d.id, "data-state": "unavailable", role: "link", "aria-disabled": "true", tabindex: "-1", title: "Secure viewer is unavailable in fixture mode" }, "Open \u203A")
      ]));
    });
    docs.appendChild(h("div", { style: "font-size:12px;color:var(--ink-3);margin-top:10px" }, m.docsNote));
    var disclaimer = h("div", { "data-module": "care-disclaimer", "data-visual-id": "care-disclaimer", style: "border:1px dashed rgba(var(--hair),.18);border-radius:14px;padding:11px 14px;font-size:12px;color:var(--ink-3)" }, m.disclaimer);
    return h("div", { "class": "care-grid" }, [
      h("div", { "class": "care-col" }, [appt, plan, tasks]),
      h("div", { "class": "care-col" }, [provider, docs, disclaimer])
    ]);
  }

  // app-templates/customer-portal/runtime/src/components/care/BeautyCareHub.js
  function taskDone2(task, ui) {
    return Object.prototype.hasOwnProperty.call(ui.tasksDone || {}, task.id) ? ui.tasksDone[task.id] : !!task.done;
  }
  function BeautyCareHub(m, ui) {
    var a = m.appointment;
    var appt = h("div", { "class": "card card--pad", "data-module": "care-appointment", "data-visual-id": "care-appointment", "data-appointment-id": a.id, "data-specialist-id": a.specialistId }, [
      h("div", { style: "display:flex;align-items:center;gap:9px" }, [
        h("div", { "class": "card__title", style: "flex:1" }, "Next appointment"),
        careChip("info", "Scheduled")
      ]),
      h("div", { style: "font-weight:800;font-size:20px;letter-spacing:-.02em;margin:10px 0 2px", "data-bind": "appointment.when" }, a.when),
      h("div", { style: "font-size:13.5px;color:var(--ink-2)", "data-bind": "appointment.name" }, a.name + " \xB7 " + a.specialist),
      h("div", { style: "font-size:12.5px;color:var(--ink-3);margin-top:2px" }, a.where),
      h("div", { style: "margin-top:12px;background:rgba(var(--accent-rgb),.06);border:1px solid rgba(var(--accent-rgb),.14);border-radius:14px;padding:11px 14px;font-size:12.5px;color:var(--ink-2)" }, [
        h("b", { style: "color:var(--ink)" }, "Good to know \xB7 "),
        a.prep
      ]),
      h("div", { style: "display:flex;gap:10px;margin-top:14px" }, [
        markCareControlUnavailable(ActionButton({ variant: "btn--primary", label: "Reschedule", action: "order.reschedule", id: a.orderId, visualId: "care-appt-reschedule" }), "Rescheduling is unavailable: no approved scheduling contract"),
        ActionButton({ variant: "btn--ghost", label: "Visit details", action: "order.open", id: a.orderId, visualId: "care-appt-open" })
      ])
    ]);
    var pk = m.pkg;
    var pct = Math.round(pk.used / pk.total * 100);
    var pkg = h("div", { "class": "card card--pad", "data-module": "package-card", "data-visual-id": "package-card", "data-package-id": pk.id }, [
      h("div", { style: "display:flex;align-items:center;gap:9px;flex-wrap:wrap" }, [
        h("div", { "class": "card__title", style: "flex:1", "data-bind": "pkg.name" }, pk.name),
        h("span", { style: "font-size:12.5px;color:var(--ink-3)" }, pk.detail)
      ]),
      h("div", { style: "font-weight:800;font-size:20px;letter-spacing:-.02em;margin:10px 0 0", "data-bind": "pkg.used" }, pk.used + " of " + pk.total + " sessions used"),
      h("div", { "class": "meter" }, [h("div", { "class": "meter__fill", style: "width:" + pct + "%" })]),
      h("div", { style: "display:flex;align-items:center;gap:10px;margin-top:12px;flex-wrap:wrap" }, [
        h("div", { style: "flex:1;min-width:180px;font-size:12.5px;color:var(--ink-2)" }, pk.next),
        markCareControlUnavailable(ActionButton({ variant: "btn--primary", label: "Book next session", action: "booking.open", visualId: "care-book-session" }), "Booking is unavailable: no approved booking destination")
      ])
    ]);
    var history = h("div", { "class": "list-panel", "data-module": "treatment-history", "data-visual-id": "treatment-history" }, [
      h("div", { "class": "list-panel__head" }, [
        h("div", { "class": "list-panel__title", style: "flex:1" }, "Treatment history"),
        h("span", { style: "font-size:12.5px;color:var(--ink-3)" }, "formulas & notes saved")
      ])
    ]);
    m.history.forEach(function(ev) {
      history.appendChild(h("div", { "class": "log-row", "data-module": "treatment-row" }, [
        h("div", { "class": "log-date" }, ev.date),
        h("div", { style: "flex:1;min-width:0" }, [
          h("div", { style: "font-weight:600;font-size:13.5px", "data-bind": "visit.what" }, ev.what + " \xB7 " + ev.who),
          h("div", { style: "font-size:12px;color:var(--ink-3);margin-top:2px" }, ev.note)
        ])
      ]));
    });
    var routineTasks = m.tasks || [];
    var doneCount = routineTasks.filter(function(task) {
      return taskDone2(task, ui);
    }).length;
    var tasks = routineTasks.length ? h("div", { "class": "list-panel", "data-module": "routine-tasks", "data-visual-id": "routine-tasks" }, [
      h("div", { "class": "list-panel__head" }, [
        h("div", { "class": "list-panel__title", style: "flex:1" }, "This week's routine"),
        h("span", { style: "font-size:12px;color:var(--ink-3)" }, doneCount + " of " + routineTasks.length + " done")
      ])
    ]) : null;
    routineTasks.forEach(function(t) {
      var done = taskDone2(t, ui);
      if (tasks) tasks.appendChild(h("div", { "class": "log-row", "data-module": "routine-task-row", "data-task-id": t.id, "data-state": done ? "done" : "open" }, [
        h("button", {
          "data-action": "care.completeTask",
          "data-id": t.id,
          "aria-pressed": done ? "true" : "false",
          title: done ? "Mark as not done" : "Mark as done",
          style: "width:24px;height:24px;border-radius:999px;flex-shrink:0;cursor:pointer;display:grid;place-items:center;font-family:inherit;font-size:12px;padding:0;border:1.5px solid " + (done ? "var(--accent)" : "rgba(120,120,128,.4)") + ";background:" + (done ? "var(--accent)" : "transparent") + ";color:#fff"
        }, done ? "\u2713" : ""),
        h("div", { style: "flex:1;min-width:0" }, [
          h("div", { style: "font-weight:600;font-size:13.5px;" + (done ? "text-decoration:line-through;color:var(--ink-3)" : ""), "data-bind": "task.label" }, t.label),
          h("div", { style: "font-size:12px;color:var(--ink-3);margin-top:1px" }, t.due)
        ])
      ]));
    });
    var activeId = ui.selectedSpecialistId || m.preferredId;
    var picker = h("div", { "class": "card card--pad", "data-module": "specialist-picker", "data-visual-id": "specialist-picker" }, [
      h("div", { "class": "card__title" }, "Preferred specialist"),
      h("div", { style: "font-size:12.5px;color:var(--ink-2);margin:4px 0 12px" }, "Gets priority when we book your routine."),
      h("div", { "class": "unit-row", style: "flex-direction:column" }, m.specialists.map(function(s) {
        var active = s.id === activeId;
        return h("button", {
          "class": "unit-pick" + (active ? " unit-pick--active" : ""),
          "data-action": "care.selectSpecialist",
          "data-id": s.id,
          "data-state": active ? "active" : void 0
        }, [
          h("div", { style: "display:flex;align-items:center;gap:8px" }, [
            h("span", { style: "font-weight:700;font-size:14.5px;flex:1", "data-bind": "specialist.name" }, s.name),
            active ? careChip("info", "Preferred") : h("span", { style: "font-size:12px;color:var(--ink-3)" }, "\u2605 " + s.rating)
          ]),
          h("div", { style: "font-size:12px;color:var(--ink-3);margin-top:2px" }, s.role + " \xB7 " + s.visits + (active ? " \xB7 \u2605 " + s.rating : ""))
        ]);
      }))
    ]);
    var routine = h("div", { "class": "card card--pad", "data-module": "routine-card", "data-visual-id": "routine-card" }, [
      h("div", { "class": "card__title" }, m.routine.title),
      h("div", { style: "font-size:13.5px;color:var(--ink-2);margin-top:8px;line-height:1.55", "data-bind": "routine.note" }, m.routine.note),
      h("div", { style: "font-size:12px;color:var(--ink-3);margin-top:8px" }, m.routine.by)
    ]);
    var lo = m.loyalty;
    var lpct = Math.min(100, Math.round(lo.points / lo.nextAt * 100));
    var loyalty = h("div", { "class": "card card--pad", "data-module": "loyalty-card", "data-visual-id": "loyalty-card", "data-plan-id": lo.id }, [
      h("div", { style: "display:flex;align-items:center;gap:9px" }, [
        h("div", { "class": "card__title", style: "flex:1" }, "Loyalty"),
        careChip("info", lo.tier)
      ]),
      h("div", { "class": "score-big", style: "margin-top:10px", "data-bind": "loyalty.points" }, String(lo.points)),
      h("div", { style: "font-size:12.5px;color:var(--ink-2);margin-top:2px" }, "of " + lo.nextAt + " pts \xB7 " + lo.reward),
      h("div", { "class": "meter" }, [h("div", { "class": "meter__fill", style: "width:" + lpct + "%" })]),
      h("div", { style: "display:flex;align-items:center;gap:10px;margin-top:12px" }, [
        h("div", { style: "flex:1;font-size:12px;color:var(--ink-3)" }, lo.renews),
        h("div", { "class": "link-action", "data-action": "profile.managePlan" }, "Manage \u203A")
      ])
    ]);
    var recs = m.productRecs.items;
    var products = h("div", { "class": "list-panel", "data-module": "care-products", "data-visual-id": "care-products" }, [
      h("div", { "class": "list-panel__head" }, [
        h("div", { "class": "list-panel__title", style: "flex:1" }, "For your routine"),
        h("span", { style: "font-size:12px;color:var(--ink-3)" }, m.productRecs.note)
      ])
    ]);
    recs.forEach(function(p) {
      products.appendChild(h("div", { "class": "log-row", "data-module": "care-product-row" }, [
        h("div", { style: "flex:1;min-width:0" }, [
          h("div", { style: "font-weight:600;font-size:13.5px", "data-bind": "product.name" }, p.name),
          h("div", { style: "font-size:12px;color:var(--ink-3);margin-top:1px" }, p.blurb + " \xB7 " + p.price)
        ]),
        h("div", { "class": "link-action", "data-action": "cart.addItem", "data-id": p.name }, "Add \u203A")
      ]));
    });
    return h("div", { "class": "care-grid" }, [
      h("div", { "class": "care-col" }, [appt, pkg, history, tasks]),
      h("div", { "class": "care-col" }, [picker, routine, loyalty, products])
    ]);
  }

  // app-templates/customer-portal/runtime/src/routes/CarePage.js
  var RENDERERS = {
    equipment: EquipmentHub,
    seasonLog: SeasonLog,
    program: LawnProgram,
    water: WaterQuality,
    roof: RoofReport,
    monitoring: PestMonitoring,
    healthCare: HealthCareHub,
    beautyCare: BeautyCareHub
  };
  function careSkeleton() {
    return h("div", { "class": "care-grid", "data-state": "loading" }, [
      h("div", { "class": "care-col" }, [
        h("div", { "class": "skeleton", style: "height:120px;border-radius:16px" }),
        h("div", { "class": "skeleton", style: "height:320px;border-radius:20px" })
      ]),
      h("div", { "class": "care-col" }, [
        h("div", { "class": "skeleton", style: "height:240px;border-radius:20px" }),
        h("div", { "class": "skeleton", style: "height:150px;border-radius:20px" })
      ])
    ]);
  }
  function entitlementGate(envelope2) {
    return h("div", { "class": "state-block", "data-module": "entitlement-gate", "data-visual-id": "entitlement-gate", "data-state": "unauthorized" }, [
      h("div", { "class": "state-block__glyph" }, "\u26BF"),
      h("div", { "class": "state-block__title" }, envelope2.navLabel + " isn\u2019t part of your plan yet"),
      h("div", { "class": "state-block__desc" }, "Your current plan doesn\u2019t include " + envelope2.title.toLowerCase() + ". Upgrade to unlock it, or ask us anything."),
      h("div", { style: "display:flex;gap:10px;justify-content:center" }, [
        ActionButton({ variant: "btn--primary", label: "View plans", action: "profile.managePlan", visualId: "entitlement-upgrade" }),
        ActionButton({ variant: "btn--ghost", label: "Contact support", action: "support.open", visualId: "entitlement-support" })
      ])
    ]);
  }
  function accessState(envelope2) {
    if (envelope2.state === "unauthorized") return entitlementGate(envelope2);
    if (envelope2.state === "loading") return careSkeleton();
    if (envelope2.state === "error") return ErrorState({ title: "Couldn\u2019t load " + envelope2.title.toLowerCase(), desc: "Something went wrong fetching this page. Try again." });
    if (envelope2.state === "empty") return EmptyState({ glyph: envelope2.emptyState.glyph, title: envelope2.emptyState.title, desc: envelope2.emptyState.description });
    if (envelope2.state === "disabled") return EmptyState({ glyph: "i", title: "Care is not enabled", desc: "This module is disabled for the current portal configuration." });
    return null;
  }
  function Care() {
    var envelope2 = state.moduleData.care;
    if (!envelope2) {
      envelope2 = { title: "Care", subtitle: "", navLabel: "Care", kind: null, state: "loading", access: { status: "checking", reasonCode: null } };
    }
    var page = h("section", {
      "class": "page",
      "data-route": "care",
      "data-visual-id": envelope2.kind ? "care-" + envelope2.kind : "care-access",
      "data-state": envelope2.state,
      "data-access": envelope2.access.status,
      "data-reason-code": envelope2.access.reasonCode || void 0
    });
    page.appendChild(PageHeader({ title: envelope2.title, sub: envelope2.subtitle }));
    var treatment = accessState(envelope2);
    if (treatment) {
      page.appendChild(treatment);
      return page;
    }
    var renderer = RENDERERS[envelope2.kind];
    if (!renderer || !envelope2.content) {
      page.appendChild(ErrorState({ title: "Couldn\u2019t load care", desc: "The Care payload is unavailable." }));
      return page;
    }
    var retreatScope = envelope2.content.guarantee && envelope2.content.guarantee.scope;
    var retreatKey = retreatScope && "care.requestRetreat:" + retreatScope.planId;
    page.appendChild(renderer(envelope2.content, {
      selectedUnitId: state.careSelectedUnitId,
      selectedSpecialistId: state.careSelectedSpecialistId,
      tasksDone: state.careTasksDone,
      retreatRequest: retreatScope ? state.careRetreatRequests[retreatScope.planId] || null : null,
      retreatPending: retreatKey ? state.pending[retreatKey] === true : false,
      retreatError: retreatKey ? state.commandErrors[retreatKey] || null : null
    }));
    return page;
  }

  // app-templates/customer-portal/runtime/data/seo-fixtures.js
  var STEP_DEFAULT = [
    { key: "request", title: "Request", desc: "Tell us what you need and where \u2014 30 seconds, no account required." },
    { key: "schedule", title: "Scheduling", desc: "Pick a slot, or let dispatch assign the nearest certified crew." },
    { key: "service", title: "Service", desc: "The crew arrives in the window, tracked live in the portal." },
    { key: "report", title: "Report & payment", desc: "Photo report + digital invoice. Pay in the app, keep the history." }
  ];
  function steps(overrides) {
    return STEP_DEFAULT.map(function(s) {
      return Object.assign({}, s, (overrides || {})[s.key] ? { desc: overrides[s.key] } : {});
    });
  }
  var SEO = {
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
      how: steps({ service: "Certified tech diagnoses on site \u2014 most repairs done same visit." }),
      proof: {
        title: "Built around your equipment",
        items: [
          { title: "Equipment passport", desc: "Every unit tracked: make, model, serial, warranty \u2014 the tech arrives knowing your system." },
          { title: "Maintenance with a report", desc: "Each visit ends with a point-by-point diagnostic and the technician's notes in your portal." },
          { title: "Emergency response", desc: "No-cool emergencies get priority dispatch with live arrival tracking." }
        ]
      },
      pricing: {
        note: "Prices are set per market by the operator \u2014 shown from the CMS, never computed on the page.",
        rows: [
          { name: "AC Repair", from: "$60", unit: "visit" },
          { name: "Seasonal Maintenance", from: "$120", unit: "visit" },
          { name: "New Install / Replacement", from: null, reason: "Sized after a free on-site assessment" }
        ]
      },
      area: {
        cities: ["Austin", "Round Rock", "Cedar Park", "Pflugerville", "Georgetown"],
        note: "Full postcode list comes from dispatch coverage \u2014 no addresses shown on the page."
      },
      reviews: [
        { name: "Homeowner \xB7 Austin", rating: 5, text: "Tech showed up in the window, fixed the capacitor same visit, report in the app before he left the driveway.", media: true },
        { name: "Homeowner \xB7 Round Rock", rating: 5, text: "Maintenance plan pays for itself \u2014 the diagnostic caught a failing blower before summer.", media: false },
        { name: "Property manager", rating: 4, text: "Six units across three properties, one dashboard. Scheduling is the easy part now.", media: true }
      ],
      faq: [
        { q: "Do you charge for the diagnostic visit?", a: "The diagnostic fee is shown up front when you book and is credited toward the repair if you proceed." },
        { q: "How fast can a tech arrive?", a: "Same-day slots are offered in most of the service area; emergency no-cool calls get priority dispatch." },
        { q: "Is the repair guaranteed?", a: "Workmanship is covered by a 90-day warranty; parts carry the manufacturer's warranty." },
        { q: "Do I need an account to book?", a: "No \u2014 book as a guest. An account is created automatically so you can track the visit and keep reports." }
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
        service: "Weather-triggered clearing and de-icing \u2014 crews roll before you wake.",
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
        request: "Tell us the property and surfaces \u2014 we quote from measured area, not guesses.",
        schedule: "No calendar needed: dispatch fires automatically at your snowfall trigger.",
        service: "Crew clears to the contracted spec; arrival and route are GPS-logged.",
        report: "Timestamped photo log per storm \u2014 your slip-and-fall compliance record."
      }),
      proof: {
        title: "Compliance-grade storm response",
        items: [
          { title: "Weather trigger", desc: "Your contract sets the snowfall threshold \u2014 dispatch is automatic, no phone calls at 5 am." },
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
        note: "Commercial routes are planned per storm \u2014 coverage confirmed at quote time."
      },
      reviews: [
        { name: "Facilities manager", rating: 5, text: "The compliance log alone is worth it \u2014 every storm documented before our insurer even asks.", media: true },
        { name: "Homeowner \xB7 Edina", rating: 5, text: "Driveway was clear at 6:10 am after an overnight storm. Photo in the app as proof.", media: false }
      ],
      faq: [
        { q: "What triggers a visit?", a: "Your contract sets a snowfall threshold (e.g. 2 in / 5 cm). When the local station reports it, dispatch is automatic." },
        { q: "What if the SLA window is missed?", a: "Every response is logged against the window; misses are flagged in your season log and credited per contract terms." },
        { q: "Do you serve commercial lots?", a: "Yes \u2014 lots, walkways and loading zones, with per-surface pricing and a compliance report per storm." },
        { q: "Can I get proof of service for insurance?", a: "Each visit carries GPS, timestamps, photos and materials used \u2014 exportable as a compliance pack." }
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
        schedule: "Pick a weekly slot \u2014 the same crew keeps it all season.",
        report: "Photo after every cut + treatment log with re-entry guidance."
      }),
      proof: {
        title: "A programme, not one-off mows",
        items: [
          { title: "Season programme", desc: "Five steps from spring cleanup to winterizing \u2014 you see what's done, what's next, and when." },
          { title: "Kids & pets re-entry", desc: "After every treatment: what was applied and exactly when the lawn is safe to re-enter." },
          { title: "Visible progress", desc: "Soil snapshot and progress photos visit over visit \u2014 the lawn's history in one place." }
        ]
      },
      pricing: {
        note: "Programme pricing depends on lot size \u2014 quoted after a measured assessment.",
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
        { name: "Homeowner \xB7 Cary", rating: 5, text: "Same two guys every Thursday. Photo when they're done, re-entry note after treatments \u2014 kids out by dinner.", media: true },
        { name: "Homeowner \xB7 Raleigh", rating: 4, text: "The season programme took the guesswork out. Aeration happened exactly when the plan said.", media: false }
      ],
      faq: [
        { q: "Is it safe for kids and pets after treatment?", a: "Every treatment logs what was applied and the re-entry window \u2014 you get a notification when the lawn is safe." },
        { q: "Do I get the same crew?", a: "Yes \u2014 weekly routes keep the same crew on your lawn all season." },
        { q: "What's in the season programme?", a: "Five steps: spring cleanup, feeding, aeration & overseeding, weed control, winterizing \u2014 tracked in your portal." },
        { q: "What if I'm not happy with a cut?", a: "Report it from the visit photo \u2014 the crew re-cuts within 48 hours at no charge." }
      ]
    },
    /* ========================== Pool & Spa ========================== */
    "Pool & Spa": {
      meta: {
        seoTitle: "Pool Cleaning & Water Care in {locality} | Aircove",
        metaDescription: "Certified pool techs in {locality}: cleaning, chemical balancing, equipment care. Water readings logged every visit \u2014 always swim-ready.",
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
        service: "Tech cleans, tests and doses \u2014 every reading logged against safe ranges.",
        report: "Water readings + dosing log per visit; swim-ready status in the app."
      }),
      proof: {
        title: "Water you can see into \u2014 literally",
        items: [
          { title: "Readings every visit", desc: "Chlorine, pH, alkalinity logged against safe ranges with trends over time." },
          { title: "Swim-ready status", desc: "One clear answer in the app: safe to swim now, or when it will be." },
          { title: "Dosing log", desc: "What was added, how much, and why \u2014 no mystery chemicals." }
        ]
      },
      pricing: {
        note: "Weekly care is priced by pool volume and equipment \u2014 from the CMS per market.",
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
        { name: "Homeowner \xB7 Scottsdale", rating: 5, text: "The swim-ready status ended the 'can we swim yet?' debate forever. Readings right in the app.", media: true },
        { name: "Airbnb host", rating: 5, text: "Guests check in to a clear pool every time. The dosing log covers me if anyone asks.", media: true }
      ],
      faq: [
        { q: "How do I know the water is safe?", a: "Every visit logs chlorine, pH and alkalinity against safe ranges \u2014 the app shows a single swim-ready status." },
        { q: "Do you service spas and hot tubs?", a: "Yes \u2014 spa care follows the same visit + readings + dosing log model." },
        { q: "What if the pool turns green between visits?", a: "Covered by the clear-water guarantee \u2014 we return free of charge and adjust the programme." },
        { q: "Do you repair equipment?", a: "Pumps, filters and heaters are diagnosed on site; you approve the quote in the app before any work." }
      ]
    },
    /* =========================== Roofing =========================== */
    "Roofing": {
      meta: {
        seoTitle: "Roof Inspection & Repair in {locality} | Aircove",
        metaDescription: "Certified roofers in {locality}: drone inspections with written reports, tracked repairs and replacements. Photo-logged, insured crews.",
        h1: "Roofing in {locality} \u2014 inspected, documented, tracked",
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
        report: "Written condition report, repair plan and pricing \u2014 approve in the app."
      }),
      proof: {
        title: "Paper trail for your biggest asset",
        items: [
          { title: "Drone inspection", desc: "Full survey mapped by roof zone with severity per finding \u2014 no guesswork from the ground." },
          { title: "Written report", desc: "Condition score, photos and repair plan in a document you keep \u2014 useful for insurance." },
          { title: "Project tracking", desc: "Repairs and replacements tracked stage by stage in the portal, with photos at each milestone." }
        ]
      },
      pricing: {
        note: "Repair and replacement pricing always follows an inspection \u2014 only the inspection is priced up front.",
        rows: [
          { name: "Roof Inspection", from: "$95", unit: "visit" },
          { name: "Minor repair", from: "$240", unit: "job" },
          { name: "Replacement / major repair", from: null, reason: "Quoted from the inspection report" }
        ]
      },
      area: {
        cities: ["Denver", "Aurora", "Lakewood", "Arvada", "Centennial"],
        note: "Post-storm demand is triaged \u2014 inspection slots prioritized by damage severity."
      },
      reviews: [
        { name: "Homeowner \xB7 Denver", rating: 5, text: "The drone report found hail damage the adjuster missed. Claim approved with their photos.", media: true },
        { name: "Homeowner \xB7 Arvada", rating: 4, text: "Replacement tracked stage by stage \u2014 I knew exactly which day the crane was coming.", media: false }
      ],
      faq: [
        { q: "What does the inspection include?", a: "A drone survey plus on-roof check, mapped by zone with severity, delivered as a written report within 24 hours." },
        { q: "Can I use the report for an insurance claim?", a: "Yes \u2014 the report includes dated photos, findings by zone and a condition score in a shareable document." },
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
          { title: "Alert log", desc: "First activity triggers an alert \u2014 you see it the moment the sensor does." },
          { title: "Re-treat guarantee", desc: "Activity between visits? Request a free re-treatment from the app \u2014 covered by the plan." }
        ]
      },
      pricing: {
        note: "Plan pricing depends on property size and pest pressure \u2014 quoted after inspection.",
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
        { name: "Homeowner \xB7 Tampa", rating: 5, text: "Sensor pinged at 2 am, re-treat requested from bed, tech out two days later. Zero drama.", media: false },
        { name: "Restaurant owner", rating: 5, text: "The station log is our health-inspection insurance. Every check documented.", media: true }
      ],
      faq: [
        { q: "Are the products safe for kids and pets?", a: "Techs use family & pet safe options where possible; every product applied is logged with re-entry guidance." },
        { q: "What if pests come back between visits?", a: "On a plan, re-treatments between scheduled visits are free \u2014 request one from the app." },
        { q: "How does monitoring work?", a: "Bait stations and smart sensors report status to your portal; first activity triggers an alert." },
        { q: "Do you handle commercial properties?", a: "Yes \u2014 restaurants and offices get documented station checks suitable for health inspections." }
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
        request: "Tell us who the care is for and what kind of support \u2014 30 seconds, no paperwork to start.",
        schedule: "Pick times that fit the household \u2014 the same care team keeps the slot.",
        service: "A licensed provider arrives in the window; family can follow the schedule live.",
        report: "The visit summary lands in the secure portal \u2014 documents stay locked to your account."
      }),
      proof: {
        title: "Coordination, not paperwork",
        items: [
          { title: "One schedule for everyone", desc: "Appointments, reminders and reschedules in one portal the whole family can follow." },
          { title: "Care plan milestones", desc: "Intake, reviews and cadence changes tracked step by step \u2014 you always know what's next." },
          { title: "Secure documents", desc: "Visit summaries and results packages open in a secure viewer \u2014 never over email, every access logged." }
        ]
      },
      pricing: {
        note: "Care pricing is set per market and per program \u2014 always from the CMS, never computed on the page.",
        rows: [
          { name: "Home Care Visit", from: "$75", unit: "visit" },
          { name: "Physio Session", from: "$95", unit: "session" },
          { name: "Care program", from: null, reason: "Planned after the in-home intake assessment" }
        ]
      },
      area: {
        cities: ["Portland", "Beaverton", "Lake Oswego", "Gresham", "Tigard"],
        note: "Coverage depends on provider availability \u2014 confirmed at intake."
      },
      reviews: [
        { name: "Family caregiver \xB7 Portland", rating: 5, text: "Scheduling for my dad stopped being a group chat. Everyone sees the same calendar.", media: false },
        { name: "Client \xB7 Beaverton", rating: 5, text: "Same physio every Tuesday, and the visit summary is in the portal before dinner.", media: true }
      ],
      faq: [
        { q: "Is this a medical service?", a: "Aircove partners with licensed providers for in-home support visits. The portal handles scheduling and documents; clinical care and medical records stay with your provider." },
        { q: "Who can see the documents?", a: "Only account holders you invite. Documents open in a secure viewer and every access is logged." },
        { q: "Can family manage the schedule?", a: "Yes \u2014 invite family members with scheduling access. They see appointments and reminders; documents stay private unless you share them." },
        { q: "What if we need to cancel a visit?", a: "Reschedule from the appointment up to 24 hours ahead at no charge." }
      ]
    },
    /* ============================ Beauty ============================ */
    "Beauty": {
      meta: {
        seoTitle: "At-Home Beauty Services in {locality} | Aircove",
        metaDescription: "Hair, nails and skin by vetted specialists in {locality} \u2014 at home or in-studio. Your formulas and routine remembered visit to visit; packages and member pricing.",
        h1: "Beauty services in {locality} that remember your routine",
        canonicalPath: "/beauty/{locality-slug}",
        locality: "Miami, FL",
        serviceArea: "Miami-Dade",
        primaryCta: { kind: "book", label: "Book a specialist", destination: "flow.booking" },
        secondaryCta: { kind: "call", label: "Call us" }
      },
      hero: {
        service: "Hair, nails and skin by vetted specialists \u2014 at home or in-studio.",
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
        request: "Pick the service and where \u2014 your place or a partner studio.",
        schedule: "Choose your specialist or let us match one; keep them for every visit.",
        service: "The specialist arrives with a sanitised pro kit; formulas come from your profile.",
        report: "Formulas, shades and routine notes saved to your profile for next time."
      }),
      proof: {
        title: "A routine, not one-off appointments",
        items: [
          { title: "Your specialist, every time", desc: "Set a preferred specialist \u2014 priority rebooking keeps them on your routine." },
          { title: "Formulas remembered", desc: "Color formulas, shades and skin notes carry over visit to visit \u2014 no re-explaining." },
          { title: "Packages & loyalty", desc: "Session packages and member points tracked in the portal, redeemable on any visit." }
        ]
      },
      pricing: {
        note: "Prices are set per market by the operator \u2014 shown from the CMS, never computed on the page.",
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
        { name: "Client \xB7 Miami Beach", rating: 5, text: "Alina has my color formula saved \u2014 'the usual' actually means something now.", media: true },
        { name: "Bride \xB7 Coral Gables", rating: 5, text: "Trial, timeline, day-of team \u2014 one coordinator handled all of it.", media: true },
        { name: "Client \xB7 Doral", rating: 4, text: "Gel set at my kitchen table on a Sunday evening. The kit was spotless.", media: false }
      ],
      faq: [
        { q: "Home or studio?", a: "Both \u2014 book at-home visits or a partner studio near you; the price is shown before you confirm." },
        { q: "Can I keep the same specialist?", a: "Yes \u2014 set a preferred specialist and they get priority on your bookings; your formulas travel with your profile either way." },
        { q: "How do packages work?", a: "Buy a session package once, book sessions whenever \u2014 usage is tracked in the portal and never expires early." },
        { q: "What if I'm not happy with the result?", a: "Report it from the visit \u2014 a redo within 48 hours is covered by the guarantee." }
      ]
    }
  };
  var SEO_FOOTER = {
    contacts: {
      phone: null,
      /* slot: operator phone */
      email: null,
      /* slot: operator email */
      address: null
      /* slot: registered business address (optional) */
    },
    hours: [
      { d: "Mon\u2013Fri", h: "7:00 \u2013 20:00" },
      { d: "Sat", h: "8:00 \u2013 18:00" },
      { d: "Sun", h: "Emergency only" }
    ],
    legal: [
      { label: "Privacy policy", href: "#" },
      { label: "Terms of service", href: "#" },
      { label: "Licence & insurance", href: "#" }
    ]
  };

  // app-templates/customer-portal/runtime/src/normalizers/seo.js
  var MERGE_TAG = /\{([a-z][a-z0-9-]*)\}/gi;
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var TEL = /^tel:\+[1-9][0-9]{6,14}$/;
  var PHONE = /^\+[1-9][0-9]{6,14}$/;
  var SEO_PUBLIC_REQUIRED_COLLECTIONS = Object.freeze([
    "services",
    "how",
    "proof.items",
    "area.cities",
    "faq"
  ]);
  function own(object2, key, path) {
    if (!object2 || typeof object2 !== "object" || Array.isArray(object2) || !Object.prototype.hasOwnProperty.call(object2, key)) {
      throw new Error(path + "." + key + " is required");
    }
    return object2[key];
  }
  function object(value, path) {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(path + " must be an object");
    return value;
  }
  function string(value, path) {
    if (typeof value !== "string" || !value.trim()) throw new Error(path + " must be a nonempty string");
    return value.trim();
  }
  function nullableString(value, path) {
    if (value === null) return null;
    return string(value, path);
  }
  function array(value, path, minimum) {
    if (!Array.isArray(value) || value.length < (minimum || 0)) throw new Error(path + " must contain at least " + String(minimum || 0) + " item(s)");
    return value;
  }
  function slug(value, path) {
    var result = string(value, path);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result)) throw new Error(path + " must be a lowercase URL slug");
    return result;
  }
  function merge(value, tags, path) {
    var source = string(value, path);
    var result = source.replace(MERGE_TAG, function(_, key) {
      if (!Object.prototype.hasOwnProperty.call(tags, key)) throw new Error(path + " contains unknown merge tag {" + key + "}");
      return tags[key];
    });
    if (/[{}]/.test(result)) throw new Error(path + " contains an unresolved or malformed merge tag");
    return result.replace(/\s+/g, " ").trim();
  }
  function optionalMerge(value, tags, path) {
    return value === null ? null : merge(value, tags, path);
  }
  function parseOrigin(value, path) {
    var url;
    try {
      url = new URL(string(value, path));
    } catch (_) {
      throw new Error(path + " must be an absolute HTTPS origin");
    }
    if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
      throw new Error(path + " must be an absolute HTTPS origin without credentials, path, query, or fragment");
    }
    return url.origin;
  }
  function assertPublicDnsHost(origin, path, allowTestHosts) {
    var hostname = new URL(origin).hostname.toLowerCase();
    var isIpLiteral = hostname.indexOf(":") !== -1 || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname);
    if (isIpLiteral) throw new Error(path + " must use a public DNS hostname, not an IP literal");
    if (hostname.indexOf(".") === -1) throw new Error(path + " must use a multi-label public DNS hostname");
    var reservedSuffixes = [".example", ".invalid", ".localhost", ".local", ".internal", ".lan", ".localdomain", ".home.arpa", ".onion"];
    var reservedDomains = ["example.com", "example.net", "example.org"];
    if (hostname === "localhost" || reservedSuffixes.some(function(suffix) {
      return hostname.endsWith(suffix);
    }) || reservedDomains.some(function(domain) {
      return hostname === domain || hostname.endsWith("." + domain);
    })) {
      throw new Error(path + " must use a public DNS hostname, not a reserved or local hostname");
    }
    var labels = hostname.split(".");
    if (labels.some(function(label) {
      return !label || label.length > 63 || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label);
    })) {
      throw new Error(path + " must use a syntactically valid public DNS hostname");
    }
    var topLevel = labels[labels.length - 1];
    if (/^\d+$/.test(topLevel) || topLevel.length < 2) throw new Error(path + " must use a credible public DNS hostname");
    if (hostname.endsWith(".test")) {
      if (allowTestHosts) return;
      throw new Error(path + " must use a credible public DNS hostname; .test is reference-only");
    }
  }
  function normalizePolicy(deployment, allowTestHosts) {
    deployment = object(deployment, "deployment");
    var canonicalOrigin = parseOrigin(own(deployment, "canonicalOrigin", "deployment"), "deployment.canonicalOrigin");
    var allowedOrigins = array(own(deployment, "allowedOrigins", "deployment"), "deployment.allowedOrigins", 1).map(function(value, index) {
      return parseOrigin(value, "deployment.allowedOrigins[" + index + "]");
    });
    if (!allowedOrigins.includes(canonicalOrigin)) throw new Error("deployment.allowedOrigins must include deployment.canonicalOrigin");
    assertPublicDnsHost(canonicalOrigin, "deployment.canonicalOrigin", allowTestHosts);
    allowedOrigins.forEach(function(origin, index) {
      assertPublicDnsHost(origin, "deployment.allowedOrigins[" + index + "]", allowTestHosts);
    });
    var assetBase = string(own(deployment, "assetBase", "deployment"), "deployment.assetBase");
    var publicScriptUrl = string(own(deployment, "publicScriptUrl", "deployment"), "deployment.publicScriptUrl");
    if (!/^\/(?!\/)(?!.*\.\.)(?:[a-zA-Z0-9._~!$&'()*+,;=:@%/-]+)$/.test(assetBase)) throw new Error("deployment.assetBase must be a root-relative path without traversal");
    if (!/^\/(?!\/)(?!.*\.\.)(?:[a-zA-Z0-9._~!$&'()*+,;=:@%/-]+\.js)$/.test(publicScriptUrl)) throw new Error("deployment.publicScriptUrl must be a root-relative JavaScript path without traversal");
    return {
      canonicalOrigin,
      allowedOrigins: Array.from(new Set(allowedOrigins)),
      allowCanonicalQuery: own(deployment, "allowCanonicalQuery", "deployment") === true,
      assetBase: assetBase.replace(/\/$/, ""),
      publicScriptUrl
    };
  }
  function httpsUrl(value, policy, path, options2) {
    options2 = options2 || {};
    var raw = nullableString(value, path);
    if (raw === null) return null;
    var url;
    try {
      url = new URL(raw);
    } catch (_) {
      throw new Error(path + " must be an absolute HTTPS URL");
    }
    if (url.protocol !== "https:") throw new Error(path + " must use HTTPS");
    if (url.username || url.password) throw new Error(path + " must not contain credentials");
    if (url.hash) throw new Error(path + " must not contain a fragment");
    if (!policy.allowedOrigins.includes(url.origin)) throw new Error(path + " origin is not deployment-approved");
    if (options2.canonical) {
      if (url.origin !== policy.canonicalOrigin) throw new Error(path + " must match deployment.canonicalOrigin");
      if (url.search && !policy.allowCanonicalQuery) throw new Error(path + " query is not permitted");
    }
    return url.href;
  }
  function destination(value, policy, path, options2) {
    options2 = options2 || {};
    if (value === null) return null;
    var raw = string(value, path);
    if (options2.anchor && raw === "#seo-services") return raw;
    if (options2.tel && raw.startsWith("tel:")) {
      if (!TEL.test(raw)) throw new Error(path + " must be an international tel:+number destination");
      return raw;
    }
    return httpsUrl(raw, policy, path);
  }
  function normalizeCta(raw, action, policy, tags, path, options2) {
    if (raw === null) return null;
    raw = object(raw, path);
    var label = merge(own(raw, "label", path), tags, path + ".label");
    var target = own(raw, "destination", path);
    var resolved = target === null ? null : destination(merge(target, tags, path + ".destination"), policy, path + ".destination", options2);
    return { action, label, destination: resolved, available: Boolean(resolved) };
  }
  function normalizeAuthored(payload, options2) {
    options2 = options2 || {};
    payload = object(payload, "payload");
    var expected = options2.classification;
    if (own(payload, "classification", "payload") !== expected) throw new Error("payload.classification must be " + expected);
    var policy = normalizePolicy(own(payload, "deployment", "payload"), options2.allowTestHosts === true);
    var content = object(own(payload, "content", "payload"), "content");
    var brand = object(own(content, "brand", "content"), "content.brand");
    var vertical2 = object(own(content, "vertical", "content"), "content.vertical");
    var meta = object(own(content, "meta", "content"), "content.meta");
    var locality = string(own(meta, "locality", "content.meta"), "content.meta.locality");
    var localitySlug = slug(own(meta, "localitySlug", "content.meta"), "content.meta.localitySlug");
    var tags = { locality, "locality-slug": localitySlug };
    var hero = object(own(content, "hero", "content"), "content.hero");
    var ctas = object(own(content, "ctas", "content"), "content.ctas");
    var proof = object(own(content, "proof", "content"), "content.proof");
    var pricing = object(own(content, "pricing", "content"), "content.pricing");
    var area = object(own(content, "area", "content"), "content.area");
    var final = object(own(content, "final", "content"), "content.final");
    var footer = object(own(content, "footer", "content"), "content.footer");
    var canonical = httpsUrl(merge(own(meta, "canonical", "content.meta"), tags, "content.meta.canonical"), policy, "content.meta.canonical", { canonical: true });
    var media = own(hero, "media", "content.hero");
    var normalizedMedia = null;
    if (media !== null) {
      media = object(media, "content.hero.media");
      normalizedMedia = {
        url: httpsUrl(merge(own(media, "url", "content.hero.media"), tags, "content.hero.media.url"), policy, "content.hero.media.url"),
        alt: merge(own(media, "alt", "content.hero.media"), tags, "content.hero.media.alt")
      };
    }
    var primaryAction = own(ctas, "primaryAction", "content.ctas");
    if (primaryAction !== "seo.cta.book" && primaryAction !== "seo.cta.quote") throw new Error("content.ctas.primaryAction must be seo.cta.book or seo.cta.quote");
    var primaryCta = normalizeCta(own(ctas, "primary", "content.ctas"), primaryAction, policy, tags, "content.ctas.primary");
    var secondary = own(ctas, "secondary", "content.ctas");
    var secondaryCta = secondary === null ? null : normalizeCta(secondary, own(ctas, "secondaryAction", "content.ctas"), policy, tags, "content.ctas.secondary", { anchor: own(ctas, "secondaryAction", "content.ctas") === "seo.cta.services", tel: own(ctas, "secondaryAction", "content.ctas") === "seo.cta.call" });
    if (secondaryCta && !["seo.cta.services", "seo.cta.call"].includes(secondaryCta.action)) throw new Error("content.ctas.secondaryAction must be seo.cta.services or seo.cta.call");
    var callCta = normalizeCta(own(ctas, "call", "content.ctas"), "seo.cta.call", policy, tags, "content.ctas.call", { tel: true });
    var services = array(own(content, "services", "content"), "content.services", 1).map(function(service, index) {
      var path = "content.services[" + index + "]";
      service = object(service, path);
      return {
        id: slug(own(service, "id", path), path + ".id"),
        name: merge(own(service, "name", path), tags, path + ".name"),
        benefit: merge(own(service, "benefit", path), tags, path + ".benefit"),
        priceFrom: optionalMerge(own(service, "priceFrom", path), tags, path + ".priceFrom"),
        destination: own(service, "destination", path) === null ? null : destination(merge(own(service, "destination", path), tags, path + ".destination"), policy, path + ".destination"),
        palette: null
      };
    });
    if (new Set(services.map(function(service) {
      return service.id;
    })).size !== services.length) throw new Error("content.services ids must be unique");
    var faq = array(own(content, "faq", "content"), "content.faq", 1).map(function(item, index) {
      var path = "content.faq[" + index + "]";
      item = object(item, path);
      return { id: slug(own(item, "id", path), path + ".id"), q: merge(own(item, "question", path), tags, path + ".question"), a: merge(own(item, "answer", path), tags, path + ".answer") };
    });
    if (new Set(faq.map(function(item) {
      return item.id;
    })).size !== faq.length) throw new Error("content.faq ids must be unique");
    var trust = array(own(content, "trust", "content"), "content.trust", 0).map(function(fact, index) {
      var path = "content.trust[" + index + "]";
      fact = object(fact, path);
      return { key: "trust-" + index, icon: ["\u2605", "\u2696", "\u2714", "\u2B1A", "\u23F1"][index % 5], label: merge(own(fact, "label", path), tags, path + ".label"), value: merge(own(fact, "value", path), tags, path + ".value"), count: optionalMerge(own(fact, "count", path), tags, path + ".count"), slot: null };
    });
    var reviews = array(own(content, "reviews", "content"), "content.reviews", 0).map(function(review, index) {
      var path = "content.reviews[" + index + "]";
      review = object(review, path);
      var rating = Number(own(review, "rating", path));
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error(path + ".rating must be an integer from 1 to 5");
      return { name: merge(own(review, "name", path), tags, path + ".name"), rating, text: merge(own(review, "text", path), tags, path + ".text"), media: false };
    });
    var normalized = {
      mode: options2.mode,
      classification: expected,
      deployment: policy,
      brand: {
        name: merge(own(brand, "name", "content.brand"), tags, "content.brand.name"),
        url: own(brand, "url", "content.brand") === null ? null : httpsUrl(merge(own(brand, "url", "content.brand"), tags, "content.brand.url"), policy, "content.brand.url")
      },
      vertical: { name: merge(own(vertical2, "name", "content.vertical"), tags, "content.vertical.name"), slug: slug(own(vertical2, "slug", "content.vertical"), "content.vertical.slug") },
      meta: {
        title: merge(own(meta, "title", "content.meta"), tags, "content.meta.title"),
        description: merge(own(meta, "description", "content.meta"), tags, "content.meta.description"),
        h1: merge(own(meta, "h1", "content.meta"), tags, "content.meta.h1"),
        locality,
        serviceArea: merge(own(meta, "serviceArea", "content.meta"), tags, "content.meta.serviceArea"),
        canonicalUrl: canonical,
        canonicalPath: new URL(canonical).pathname + new URL(canonical).search,
        primaryCta,
        secondaryCta,
        callCta
      },
      hero: {
        service: merge(own(hero, "service", "content.hero"), tags, "content.hero.service"),
        note: optionalMerge(own(hero, "note", "content.hero"), tags, "content.hero.note"),
        offer: normalizeOffer(own(hero, "offer", "content.hero"), tags),
        media: normalizedMedia
      },
      services,
      trust,
      how: normalizeItems(array(own(content, "how", "content"), "content.how", 1), tags, "content.how", "title", "description"),
      proof: { title: merge(own(proof, "title", "content.proof"), tags, "content.proof.title"), items: normalizeItems(array(own(proof, "items", "content.proof"), "content.proof.items", 1), tags, "content.proof.items", "title", "description") },
      pricing: { note: optionalMerge(own(pricing, "note", "content.pricing"), tags, "content.pricing.note"), rows: normalizePricingRows(array(own(pricing, "rows", "content.pricing"), "content.pricing.rows", 0), tags) },
      area: { cities: array(own(area, "cities", "content.area"), "content.area.cities", 1).map(function(city, index) {
        return merge(city, tags, "content.area.cities[" + index + "]");
      }), note: optionalMerge(own(area, "note", "content.area"), tags, "content.area.note") },
      reviews,
      faq,
      final: { heading: merge(own(final, "heading", "content.final"), tags, "content.final.heading"), body: optionalMerge(own(final, "body", "content.final"), tags, "content.final.body") },
      footer: normalizeFooter(footer, policy, tags)
    };
    return Object.freeze(normalized);
  }
  function normalizeOffer(raw, tags) {
    if (raw === null) return null;
    raw = object(raw, "content.hero.offer");
    return { tag: merge(own(raw, "tag", "content.hero.offer"), tags, "content.hero.offer.tag"), text: merge(own(raw, "text", "content.hero.offer"), tags, "content.hero.offer.text"), until: optionalMerge(own(raw, "until", "content.hero.offer"), tags, "content.hero.offer.until") };
  }
  function normalizeItems(items, tags, base, titleKey, descriptionKey) {
    return items.map(function(item, index) {
      var path = base + "[" + index + "]";
      item = object(item, path);
      return { title: merge(own(item, titleKey, path), tags, path + "." + titleKey), desc: merge(own(item, descriptionKey, path), tags, path + "." + descriptionKey) };
    });
  }
  function normalizePricingRows(rows, tags) {
    return rows.map(function(row, index) {
      var path = "content.pricing.rows[" + index + "]";
      row = object(row, path);
      return { name: merge(own(row, "name", path), tags, path + ".name"), from: optionalMerge(own(row, "from", path), tags, path + ".from"), unit: optionalMerge(own(row, "unit", path), tags, path + ".unit"), reason: optionalMerge(own(row, "reason", path), tags, path + ".reason") };
    });
  }
  function normalizeFooter(footer, policy, tags) {
    var phone = own(footer, "phone", "content.footer");
    if (phone !== null && !PHONE.test(phone)) throw new Error("content.footer.phone must be null or an international +number");
    var email = own(footer, "email", "content.footer");
    if (email !== null && !EMAIL.test(email)) throw new Error("content.footer.email must be null or a valid email address");
    return {
      phone: phone === null ? null : phone,
      email: email === null ? null : email,
      hours: array(own(footer, "hours", "content.footer"), "content.footer.hours", 0).map(function(row, index) {
        var path = "content.footer.hours[" + index + "]";
        row = object(row, path);
        return { days: merge(own(row, "days", path), tags, path + ".days"), hours: merge(own(row, "hours", path), tags, path + ".hours") };
      }),
      legal: array(own(footer, "legal", "content.footer"), "content.footer.legal", 0).map(function(link, index) {
        var path = "content.footer.legal[" + index + "]";
        link = object(link, path);
        return { label: merge(own(link, "label", path), tags, path + ".label"), href: httpsUrl(merge(own(link, "url", path), tags, path + ".url"), policy, path + ".url") };
      })
    };
  }
  function normalizeSeoReference(rawSeo, rawVertical, rawFooter, verticalName, rawPalette) {
    if (!rawSeo || !rawVertical || !rawFooter) throw new Error("reference SEO fixtures are required");
    var name = verticalName || "Reference service";
    var primaryKind = rawSeo.meta.primaryCta.kind === "quote" ? "seo.cta.quote" : "seo.cta.book";
    var secondaryAction = rawSeo.meta.secondaryCta.kind === "services" ? "seo.cta.services" : "seo.cta.call";
    var payload = {
      classification: "reference-only",
      deployment: { canonicalOrigin: "https://reference-seo.test", allowedOrigins: ["https://reference-seo.test"], allowCanonicalQuery: false, assetBase: "/runtime", publicScriptUrl: "/public/src/seo-public.js" },
      content: {
        brand: { name: "Aircove reference fixture", url: null },
        vertical: { name, slug: rawVertical.slug },
        meta: { title: rawSeo.meta.seoTitle, description: rawSeo.meta.metaDescription, h1: rawSeo.meta.h1, locality: rawSeo.meta.locality, localitySlug: rawSeo.meta.canonicalPath.split("/").pop() === "{locality-slug}" ? rawSeo.meta.locality.split(",")[0].toLowerCase().replace(/[^a-z0-9]+/g, "-") : "reference", serviceArea: rawSeo.meta.serviceArea, canonical: "https://reference-seo.test" + rawSeo.meta.canonicalPath },
        hero: { service: rawSeo.hero.service, note: "No account needed. Price shown before you confirm.", offer: rawSeo.hero.offer, media: null },
        services: rawVertical.svc.slice(0, 6).map(function(service) {
          return { id: service.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""), name: service.name, benefit: service.tagline, priceFrom: service.price, destination: null };
        }),
        trust: [rawSeo.trust.rating, rawSeo.trust.licence, rawSeo.trust.insurance, rawSeo.trust.guarantee, rawSeo.trust.response].filter(function(fact) {
          return fact && fact.value;
        }).map(function(fact) {
          return { label: fact.label || "Rating", value: fact.value, count: fact.count || null };
        }),
        how: rawSeo.how.map(function(item) {
          return { title: item.title, description: item.desc };
        }),
        proof: { title: rawSeo.proof.title, items: rawSeo.proof.items.map(function(item) {
          return { title: item.title, description: item.desc };
        }) },
        pricing: { note: rawSeo.pricing.note, rows: rawSeo.pricing.rows.map(function(row) {
          return { name: row.name, from: row.from || null, unit: row.unit || null, reason: row.reason || null };
        }) },
        area: { cities: rawSeo.area.cities, note: rawSeo.area.note || null },
        reviews: rawSeo.reviews.map(function(review) {
          return { name: review.name, rating: review.rating, text: review.text };
        }),
        faq: rawSeo.faq.map(function(item, index) {
          return { id: "faq-" + String(index + 1), question: item.q, answer: item.a };
        }),
        ctas: { primaryAction: primaryKind, primary: { label: rawSeo.meta.primaryCta.label, destination: null }, secondaryAction, secondary: { label: rawSeo.meta.secondaryCta.label, destination: secondaryAction === "seo.cta.services" ? "#seo-services" : null }, call: { label: "Call us", destination: null } },
        final: { heading: "Ready when you are in {locality}", body: "Price up front, photo report after \u2014 every visit in your portal." },
        footer: { phone: null, email: null, hours: rawFooter.hours.map(function(row) {
          return { days: row.d, hours: row.h };
        }), legal: [] }
      }
    };
    var normalized = normalizeAuthored(payload, { classification: "reference-only", mode: "reference", allowTestHosts: true });
    var palette = array(rawPalette, "reference.palette", 4).map(function(pair, index) {
      pair = array(pair, "reference.palette[" + index + "]", 2);
      return [string(pair[0], "reference.palette[" + index + "][0]"), string(pair[1], "reference.palette[" + index + "][1]")];
    });
    var trustSource = rawSeo.trust;
    return Object.freeze(Object.assign({}, normalized, {
      brand: Object.freeze({ name: "Aircove", url: null }),
      meta: Object.freeze(Object.assign({}, normalized.meta, { canonicalPath: string(rawSeo.meta.canonicalPath, "reference.meta.canonicalPath") })),
      hero: Object.freeze(Object.assign({}, normalized.hero, { note: "No account needed \xB7 price shown before you confirm" })),
      trust: Object.freeze([
        referenceTrustFact("\u2605", "Rating", trustSource.rating, "rating", "rating"),
        referenceTrustFact("\u2696", trustSource.licence.label, trustSource.licence, "licence \u2116", "licence"),
        referenceTrustFact("\u2714", trustSource.insurance.label, trustSource.insurance, "policy", "insurance"),
        referenceTrustFact("\u2B1A", trustSource.guarantee.label, trustSource.guarantee, null, "guarantee"),
        referenceTrustFact("\u23F1", trustSource.response.label, trustSource.response, null, "response")
      ]),
      services: Object.freeze(normalized.services.map(function(service, index) {
        return Object.freeze(Object.assign({}, service, { palette: palette[index % 4] }));
      })),
      reviews: Object.freeze(normalized.reviews.map(function(review, index) {
        return Object.freeze(Object.assign({}, review, { media: rawSeo.reviews[index].media === true }));
      })),
      footer: Object.freeze(Object.assign({}, normalized.footer, {
        legal: rawFooter.legal.map(function(link, index) {
          return { label: string(link.label, "reference.footer.legal[" + index + "].label"), href: string(link.href, "reference.footer.legal[" + index + "].href") };
        })
      }))
    }));
  }
  function referenceTrustFact(icon, label, source, slot, key) {
    source = object(source, "reference.trust." + key);
    return {
      icon,
      label: string(label, "reference.trust." + key + ".label"),
      value: source.value === null ? null : string(source.value, "reference.trust." + key + ".value"),
      count: source.count == null ? null : string(source.count, "reference.trust." + key + ".count"),
      slot,
      key
    };
  }

  // app-templates/customer-portal/runtime/src/modules/seo.js
  var SEO_VERTICALS = Object.freeze(Object.keys(SEO));
  function loadSeoModel(verticalName, authored) {
    var name = SEO[verticalName] ? verticalName : "HVAC";
    if (authored) throw new Error("The parity SEO loader accepts reference fixtures only");
    return normalizeSeoReference(SEO[name], F.themes[name], SEO_FOOTER, name, F.PAL);
  }

  // app-templates/customer-portal/runtime/src/components/seo/SeoSections.js
  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function(char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }
  function attr(value) {
    return esc(value);
  }
  function skel(width) {
    return '<span class="seo-skel" style="width:' + attr(width) + '"></span>';
  }
  function head(eyebrow, title, sub) {
    return '<div class="seo-sec__head">' + (eyebrow ? '<span class="eyebrow">' + esc(eyebrow) + "</span>" : "") + '<h2 class="seo-sec__title">' + esc(title) + "</h2>" + (sub ? '<p class="seo-sec__sub">' + esc(sub) + "</p>" : "") + "</div>";
  }
  function slotChip(label) {
    return '<span class="seo-slot" data-state="no-data">' + esc(label) + " &middot; from CMS</span>";
  }
  function ctaState(view, action) {
    return view.parity && view.ctaStates && view.ctaStates[action] || "idle";
  }
  function SeoCta(cta, props, view) {
    if (!cta) return "";
    props = props || {};
    var state2 = ctaState(view, cta.action);
    var label = props.label || cta.label;
    var inner = state2 === "pending" ? '<span class="seo-cta__spin"></span>Sending&hellip;' : state2 === "success" ? "&#10003; " + esc(props.successLabel || "Done") : state2 === "error" ? "&#9888; Try again" : esc(label);
    var classes = "btn " + (props.variant || "btn--primary") + (props.large ? " btn--lg" : "") + " seo-cta";
    var shared = 'class="' + classes + '" data-module="seo-cta" data-visual-id="' + attr(props.visualId || "seo-cta") + '" data-action="' + attr(cta.action) + '" data-state="' + attr(view.parity ? state2 : cta.available ? state2 : "unavailable") + '"' + (props.bind ? ' data-bind="' + attr(props.bind) + '"' : "");
    if (!view.parity) {
      if (cta.available) return "<a " + shared + ' href="' + attr(cta.destination) + '">' + inner + "</a>";
      return "<button " + shared + ' type="button" disabled aria-disabled="true" title="Destination unavailable">' + esc(label) + "</button>";
    }
    var available = cta.available || cta.action === "seo.cta.services";
    return "<button " + shared + (cta.action === "seo.cta.services" ? ' href="#seo-services"' : "") + (!available ? ' aria-disabled="true"' : "") + (state2 === "pending" ? " disabled" : "") + ' aria-live="polite">' + inner + "</button>";
  }
  function SeoMetaPreview(model) {
    return '<div class="seo-meta" data-dev-toolbar="true" data-module="seo-meta-preview"><div class="seo-meta__head">&#9881; head-level CMS fields (dev preview &mdash; stripped on integration)</div><div class="seo-meta__row"><span class="seo-meta__k">seoTitle</span><span class="seo-meta__v">' + esc(model.meta.title) + '</span></div><div class="seo-meta__row"><span class="seo-meta__k">metaDescription</span><span class="seo-meta__v">' + esc(model.meta.description) + '</span></div><div class="seo-meta__row"><span class="seo-meta__k">canonical</span><span class="seo-meta__v">' + esc(model.meta.canonicalPath) + '</span></div><div class="seo-meta__row"><span class="seo-meta__k">locality</span><span class="seo-meta__v">' + esc(model.meta.locality + " \xB7 " + model.meta.serviceArea) + "</span></div></div>";
  }
  function SeoHero(model, view) {
    var localityIndex = model.meta.h1.indexOf(model.meta.locality);
    var before = localityIndex === -1 ? model.meta.h1 : model.meta.h1.slice(0, localityIndex);
    var after = localityIndex === -1 ? "" : model.meta.h1.slice(localityIndex + model.meta.locality.length);
    var offer = view.dataState === "loading" ? '<div class="seo-offer" data-state="loading">' + skel("220px") + "</div>" : view.dataState === "ready" && model.hero.offer ? '<div class="seo-offer" data-module="seo-offer" data-visual-id="seo-offer" data-bind="cms.hero.offer" data-state="ready"><span class="seo-offer__tag">' + esc(model.hero.offer.tag) + "</span><span>" + esc(model.hero.offer.text) + '</span><span class="seo-offer__until">' + esc(model.hero.offer.until || "") + "</span></div>" : "";
    var secondaryLabel = model.meta.secondaryCta && model.meta.secondaryCta.action === "seo.cta.call" ? "\u260E " + model.meta.secondaryCta.label : model.meta.secondaryCta && model.meta.secondaryCta.label;
    var media;
    var mediaClass = "";
    if (model.hero.media) media = '<img class="seo-hero__media" src="' + attr(model.hero.media.url) + '" alt="' + attr(model.hero.media.alt) + '">';
    else if (view.parity) media = '<div class="seo-media-slot seo-hero__media" data-state="no-data"><span class="seo-media-slot__label">hero image &middot; ' + esc(model.vertical.slug) + " crew on site</span></div>";
    else {
      media = "";
      mediaClass = " seo-hero--no-media";
    }
    return '<section class="seo-hero' + mediaClass + '" data-module="seo-hero" data-visual-id="seo-hero" data-media-state="' + (model.hero.media ? "available" : "absent") + '" data-offer-state="' + attr(view.dataState) + '"><div class="seo-hero__inner' + (mediaClass ? " seo-hero__inner--no-media" : "") + '"><div class="seo-hero__copy"><span class="eyebrow seo-hero__area" data-bind="cms.meta.serviceArea">\u25C9 Serving ' + esc(model.meta.serviceArea) + '</span><h1 class="seo-hero__title" data-bind="cms.meta.h1 + cms.meta.locality">' + esc(before) + '<span class="seo-hero__geo" data-bind="cms.meta.locality">' + esc(model.meta.locality) + "</span>" + esc(after) + '</h1><p class="seo-hero__sub" data-bind="cms.hero.service">' + esc(model.hero.service) + "</p>" + offer + '<div class="seo-hero__ctas">' + SeoCta(model.meta.primaryCta, { variant: "btn--onaccent", large: true, visualId: "seo-hero-primary-cta", bind: "cms.meta.primaryCta", successLabel: model.meta.primaryCta.action === "seo.cta.quote" ? "Request sent" : "Slot held" }, view) + SeoCta(model.meta.secondaryCta, { label: secondaryLabel, variant: "btn--glass-hero", large: true, visualId: "seo-hero-secondary-cta", bind: "cms.meta.secondaryCta", successLabel: "Calling\u2026" }, view) + "</div>" + (model.hero.note ? '<div class="seo-hero__note">' + esc(model.hero.note) + "</div>" : "") + "</div>" + media + "</div></section>";
  }
  function SeoTrustStrip(model, view) {
    if (view.dataState === "loading") return '<section class="seo-trust" data-module="seo-trust-strip" data-visual-id="seo-trust-strip" data-state="loading">' + Array(5).fill('<div class="seo-trust__item">' + skel("40%") + skel("70%") + "</div>").join("") + "</section>";
    if (view.dataState === "empty" || !model.trust.length) return '<section class="seo-trust" data-module="seo-trust-strip" data-visual-id="seo-trust-strip" data-state="empty"><div class="seo-trust__fallback" data-state="no-data">Trust claims (rating, licence, insurance) appear here once supplied in the CMS &mdash; nothing is shown unverified.</div></section>';
    return '<section class="seo-trust" data-module="seo-trust-strip" data-visual-id="seo-trust-strip" data-state="ready">' + model.trust.map(function(fact) {
      var value = fact.value ? fact.key === "rating" ? "<b>" + esc(fact.value) + "</b> &middot; " + esc(fact.count || "") : esc(fact.value) : slotChip(fact.slot || fact.label.toLowerCase());
      return '<div class="seo-trust__item" data-bind="cms.trust.' + attr(fact.key) + '"><span class="seo-trust__icon">' + esc(fact.icon) + '</span><div><div class="seo-trust__label">' + esc(fact.label) + '</div><div class="seo-trust__value">' + value + "</div></div></div>";
    }).join("") + "</section>";
  }
  function serviceControl(service, view) {
    var selected = service.id === view.selectedServiceId;
    var palette = service.palette || ["var(--accent)", "rgba(var(--accent-rgb),.12)"];
    var content = '<div class="seo-svc__icon" style="background:' + attr(palette[1]) + '"><i style="background:' + attr(palette[0]) + '"></i></div><div class="seo-svc__name">' + esc(service.name) + '</div><div class="seo-svc__benefit" data-bind="cms.services[].benefit">' + esc(service.benefit) + '</div><div class="seo-svc__meta"><span data-bind="cms.services[].priceFrom">' + (service.priceFrom ? "from " + esc(service.priceFrom) : "") + '</span><span class="seo-svc__go">' + (view.parity ? "Book \u2192" : service.destination ? "Continue" : "Unavailable") + "</span></div>";
    var shared = 'class="seo-svc' + (selected ? " is-selected" : "") + '" data-module="seo-service-card" data-visual-id="seo-service-card" data-action="seo.service.select" data-id="' + attr(service.id) + '" data-bind="cms.services[]"';
    if (view.parity) return "<div " + shared + ' role="button" tabindex="0"' + (selected ? ' aria-pressed="true"' : "") + ">" + content + "</div>";
    if (service.destination) return "<a " + shared + ' data-state="available" href="' + attr(service.destination) + '">' + content + "</a>";
    return '<button type="button" ' + shared + ' data-state="unavailable" disabled aria-disabled="true">' + content + "</button>";
  }
  function SeoServicesGrid(model, view) {
    var selected = model.services.find(function(service) {
      return service.id === view.selectedServiceId;
    });
    var readback = view.parity && selected ? '<p class="seo-selection-readback" data-seo-selection data-state="selected" aria-live="polite">Selected service: ' + esc(selected.name) + "</p>" : "";
    return '<section class="seo-sec" id="seo-services" data-module="seo-services-grid" data-visual-id="seo-services-grid">' + head("Services", "What we do", "Choose a service, then review availability before booking.") + '<div class="seo-svc-grid">' + model.services.map(function(service) {
      return serviceControl(service, view);
    }).join("") + "</div>" + readback + "</section>";
  }
  function SeoHowItWorks(model) {
    return '<section class="seo-sec" data-module="seo-how-it-works" data-visual-id="seo-how-it-works">' + head("How it works", "Your service, step by step") + '<div class="seo-how">' + model.how.map(function(step, index) {
      return '<div class="seo-how__step" data-bind="cms.how[' + index + ']"><div class="seo-how__num">' + (index + 1) + '</div><div class="seo-how__title">' + esc(step.title) + '</div><div class="seo-how__desc">' + esc(step.desc) + "</div></div>";
    }).join("") + "</div></section>";
  }
  function SeoProofBlock(model) {
    return '<section class="seo-sec seo-sec--tint" data-module="seo-proof" data-visual-id="seo-proof">' + head("Why " + model.brand.name, model.proof.title) + '<div class="seo-proof">' + model.proof.items.map(function(item, index) {
      return '<div class="seo-proof__card" data-bind="cms.proof.items[' + index + ']"><div class="seo-proof__glyph"><i></i></div><div class="seo-proof__title">' + esc(item.title) + '</div><div class="seo-proof__desc">' + esc(item.desc) + "</div></div>";
    }).join("") + "</div></section>";
  }
  function SeoPricing(model, view) {
    var body = view.dataState === "loading" ? '<div class="seo-price">' + Array(3).fill('<div class="seo-price__row">' + skel("30%") + skel("18%") + "</div>").join("") + "</div>" : view.dataState === "empty" || !model.pricing.rows.length ? '<div class="seo-price__fallback" data-state="no-data">' + esc(model.pricing.note || "Pricing is confirmed before you book.") + "</div>" : '<div class="seo-price">' + model.pricing.rows.map(function(row, index) {
      return '<div class="seo-price__row" data-bind="cms.pricing.rows[' + index + ']"><span class="seo-price__name">' + esc(row.name) + "</span>" + (row.from ? '<span class="seo-price__val"><b>from ' + esc(row.from) + '</b><span class="seo-price__unit"> / ' + esc(row.unit || "") + "</span></span>" : '<span class="seo-price__val seo-price__val--quote">' + esc(row.reason || "") + "</span>") + "</div>";
    }).join("") + "</div>";
    var ctaLabel = model.meta.primaryCta.action === "seo.cta.quote" ? "Get an exact quote" : "See exact price & book";
    return '<section class="seo-sec" data-module="seo-pricing" data-visual-id="seo-pricing" data-state="' + attr(view.dataState) + '">' + head("Pricing", "What to expect", view.dataState === "ready" ? model.pricing.note : "") + body + '<div class="seo-price__cta">' + SeoCta(model.meta.primaryCta, { label: ctaLabel, visualId: "seo-pricing-cta", successLabel: "Request sent" }, view) + "</div></section>";
  }
  function SeoServiceArea(model, view) {
    var list = view.dataState === "loading" ? '<div class="seo-area__cities">' + ["80px", "110px", "90px", "100px"].map(skel).join("") + "</div>" : view.dataState === "empty" ? '<div class="seo-area__fallback" data-state="no-data">Service-area list comes from dispatch coverage in the CMS.</div>' : '<div class="seo-area__cities" data-bind="cms.area.cities">' + model.area.cities.map(function(city) {
      return '<span class="seo-area__chip">' + esc(city) + "</span>";
    }).join("") + "</div>";
    var svg = '<svg viewBox="0 0 200 140" class="seo-area__visual"><circle cx="100" cy="70" r="64" fill="none" stroke="rgba(var(--accent-rgb),0.35)" stroke-dasharray="3 5"></circle><circle cx="100" cy="70" r="42" fill="none" stroke="rgba(var(--accent-rgb),0.26999999999999996)" stroke-dasharray="none"></circle><circle cx="100" cy="70" r="22" fill="rgba(var(--accent-rgb),.18)" stroke="rgba(var(--accent-rgb),0.18999999999999997)" stroke-dasharray="none"></circle><circle cx="100" cy="70" r="5" fill="var(--accent)"></circle></svg>';
    var region = view.dataState === "ready" ? '<div class="seo-area__region" data-bind="cms.meta.serviceArea">' + esc(model.meta.serviceArea) + "</div>" : "";
    var mapLabel = view.parity ? "coverage map \xB7 real map or polygon from CMS" : "coverage visualization";
    return '<section class="seo-sec" data-module="seo-service-area" data-visual-id="seo-service-area" data-state="' + attr(view.dataState) + '"><div class="seo-area"><div>' + head("Coverage", "Where we work") + region + list + (view.dataState === "ready" ? '<p class="seo-area__note">' + esc(model.area.note || "") + "</p>" : "") + '</div><div class="seo-area__map">' + svg + '<span class="seo-media-slot__label">' + esc(mapLabel) + "</span></div></div></section>";
  }
  function SeoReviews(model, view) {
    var body;
    if (view.dataState === "loading") body = '<div class="seo-reviews">' + Array(2).fill('<div class="seo-review">' + skel("35%") + skel("100%") + skel("85%") + "</div>").join("") + "</div>";
    else if (view.dataState === "empty" || !model.reviews.length) body = '<div class="seo-reviews__fallback" data-state="no-data"><div class="seo-reviews__fallback-title">Reviews appear here</div><div>Verified customer feedback is shown only when it is available.</div></div>';
    else body = '<div class="seo-reviews">' + model.reviews.map(function(review, index) {
      return '<div class="seo-review" data-bind="cms.reviews[' + index + ']">' + (review.media ? '<div class="seo-review__media"><span class="seo-media-slot__label">customer photo &middot; media slot</span></div>' : "") + '<div class="seo-review__stars">' + esc("\u2605\u2605\u2605\u2605\u2605".slice(0, review.rating) + "\u2606\u2606\u2606\u2606\u2606".slice(review.rating)) + '</div><p class="seo-review__text">&ldquo;' + esc(review.text) + '&rdquo;</p><div class="seo-review__name">' + esc(review.name) + "</div></div>";
    }).join("") + "</div>";
    return '<section class="seo-sec seo-sec--tint" data-module="seo-reviews" data-visual-id="seo-reviews" data-state="' + attr(view.dataState === "ready" && !model.reviews.length ? "empty" : view.dataState) + '">' + head("Reviews", "What customers say") + body + "</section>";
  }
  function SeoFaq(model, view) {
    var body;
    if (view.dataState === "loading") body = '<div class="seo-faq">' + Array(3).fill('<div class="seo-faq__item"><div class="seo-faq__q">' + skel("60%") + "</div></div>").join("") + "</div>";
    else if (view.dataState === "empty") body = '<div class="seo-faq__fallback" data-state="no-data">FAQ collection is empty &mdash; section is omitted from the page and from FAQ schema.</div>';
    else if (view.parity) body = '<div class="seo-faq" itemscope itemtype="https://schema.org/FAQPage">' + model.faq.map(function(faq, index) {
      var open = faq.id === view.faqOpenId;
      return '<div class="seo-faq__item' + (open ? " is-open" : "") + '" itemscope itemprop="mainEntity" itemtype="https://schema.org/Question" data-bind="cms.faq[' + index + ']"><button class="seo-faq__q" data-action="seo.faq.toggle" data-id="' + attr(faq.id) + '" aria-expanded="' + String(open) + '"><span itemprop="name">' + esc(faq.q) + '</span><span class="seo-faq__chev">' + (open ? "&minus;" : "+") + '</span></button><div class="seo-faq__a" itemscope itemprop="acceptedAnswer" itemtype="https://schema.org/Answer"' + (open ? "" : " hidden") + '><p itemprop="text">' + esc(faq.a) + "</p></div></div>";
    }).join("") + "</div>";
    else body = '<div class="seo-faq">' + model.faq.map(function(faq, index) {
      var open = index === 0;
      return '<details class="seo-faq__item' + (open ? " is-open" : "") + '" data-id="' + attr(faq.id) + '"' + (open ? " open" : "") + '><summary class="seo-faq__q" data-action="seo.faq.toggle" data-id="' + attr(faq.id) + '"><span>' + esc(faq.q) + '</span><span class="seo-faq__chev" aria-hidden="true"></span></summary><div class="seo-faq__a"><p>' + esc(faq.a) + "</p></div></details>";
    }).join("") + "</div>";
    return '<section class="seo-sec" data-module="seo-faq" data-visual-id="seo-faq" data-state="' + attr(view.dataState) + '">' + head("FAQ", "Common questions") + body + "</section>";
  }
  function SeoFinalCta(model, view) {
    var callLabel = model.meta.callCta ? "\u260E " + model.meta.callCta.label : "\u260E Call us";
    return '<section class="seo-final" data-module="seo-final-cta" data-visual-id="seo-final-cta"><h2 class="seo-final__title" data-bind="cms.meta.h1">' + esc(model.final.heading) + '</h2><p class="seo-final__sub">' + esc(model.final.body || "") + '</p><div class="seo-final__ctas">' + SeoCta(model.meta.primaryCta, { variant: "btn--onaccent", large: true, visualId: "seo-final-primary-cta", successLabel: "Request sent" }, view) + SeoCta(model.meta.callCta, { label: callLabel, variant: "btn--glass-hero", large: true, visualId: "seo-final-call-cta", successLabel: "Calling\u2026" }, view) + "</div></section>";
  }
  function SeoFooter(model, view) {
    function col(title, body) {
      return '<div class="seo-footer__col"><div class="seo-footer__head">' + esc(title) + "</div>" + body + "</div>";
    }
    var contact = model.footer.phone || model.footer.email || view.parity ? '<div data-bind="cms.footer.contacts.phone">' + (model.footer.phone ? esc(model.footer.phone) : slotChip("phone")) + '</div><div data-bind="cms.footer.contacts.email">' + (model.footer.email ? esc(model.footer.email) : slotChip("email")) + "</div>" : "";
    var hours = model.footer.hours.map(function(row) {
      return '<div class="seo-footer__row" data-bind="cms.footer.hours"><span>' + esc(row.days) + "</span><span>" + esc(row.hours) + "</span></div>";
    }).join("");
    var area = '<div data-bind="cms.meta.serviceArea">' + esc(model.meta.serviceArea) + '</div><div class="seo-footer__muted" data-bind="cms.area.cities">' + esc(model.area.cities.join(" \xB7 ")) + "</div>";
    var legal = model.footer.legal.map(function(link) {
      return '<a class="seo-footer__link" href="' + attr(link.href) + '" data-bind="cms.footer.legal">' + esc(link.label) + "</a>";
    }).join("");
    return '<footer class="seo-footer" data-module="seo-footer" data-visual-id="seo-footer"><div class="seo-footer__grid">' + (contact ? col("Contact", contact) : "") + col("Hours", hours) + col("Service area", area) + (legal ? col("Legal", legal) : "") + '</div><div class="seo-footer__base"><span data-bind="brand.name">' + esc(model.brand.name) + '</span><span class="seo-footer__muted" data-bind="cms.meta.canonicalPath">' + (view.parity ? "canonical: " + esc(model.meta.canonicalPath) : esc(model.meta.serviceArea)) + "</span></div></footer>";
  }
  function renderSeoSections(model, view) {
    view = Object.assign({ dataState: "ready", faqOpenId: null, selectedServiceId: null, ctaStates: {}, parity: false }, view || {});
    return (view.parity ? SeoMetaPreview(model) : "") + SeoHero(model, view) + SeoTrustStrip(model, view) + SeoServicesGrid(model, view) + SeoHowItWorks(model, view) + SeoProofBlock(model, view) + SeoPricing(model, view) + SeoServiceArea(model, view) + SeoReviews(model, view) + SeoFaq(model, view) + SeoFinalCta(model, view) + SeoFooter(model, view);
  }

  // app-templates/customer-portal/runtime/src/routes/SeoLandingPage.js
  function SeoLanding() {
    var model = loadSeoModel(state.theme);
    var page = h("section", {
      "class": "page seo-page",
      "data-route": "seo.landing",
      "data-visual-id": "seo-landing",
      "data-state": state.view === "loading" || state.view === "empty" ? state.view : "ready"
    });
    page.innerHTML = renderSeoSections(model, {
      dataState: page.getAttribute("data-state"),
      faqOpenId: state.seoFaqOpenId,
      selectedServiceId: state.seoSelectedServiceId,
      ctaStates: state.seoCtaStates,
      parity: true
    });
    return page;
  }

  // app-templates/customer-portal/runtime/src/routes/AuthOidcPage.js
  function AuthOidc() {
    var s = state.oidc || "ready-signed-out";
    var page = h("section", { "class": "page auth-page", "data-route": "auth.oidc", "data-visual-id": "auth.oidc", "data-screen-label": "Login (" + s + ")" });
    var grid = h("div", { "class": "auth-grid" });
    grid.appendChild(h("div", { "class": "auth-pitch" }, [
      h("span", { "class": "eyebrow" }, "Customer account"),
      h("h1", { "class": "auth-pitch__title" }, "Secure sign-in, handled in one place."),
      h("p", { "class": "auth-pitch__sub" }, "You sign in with our secure account service and come straight back here. Your password is never entered on this site.")
    ]));
    var card = h("div", { "class": "auth-card", "data-module": "core-oidc-auth", "data-visual-id": "core-oidc-auth", "data-state": s });
    if (s === "checking-session") card.appendChild(OidcProgress("checking-session", "Checking your session\u2026", "Securely restoring your existing sign-in. This only takes a moment \u2014 no need to do anything."));
    else if (s === "ready-signed-out") card.appendChild(OidcSignedOut());
    else if (s === "redirecting") card.appendChild(OidcProgress("redirecting", "Taking you to secure sign-in\u2026", "This page is leaving for the secure account service. You\u2019ll come back here automatically \u2014 no need to do anything."));
    else if (s === "unavailable") card.appendChild(OidcUnavailable());
    else if (s === "ready-signed-in") card.appendChild(OidcSignedIn());
    else if (s === "signing-out") card.appendChild(OidcProgress("signing-out", "Signing you out\u2026", "Finishing sign-out with the secure account service. One moment."));
    grid.appendChild(card);
    page.appendChild(grid);
    return page;
  }
  function oidcStep(n, text5) {
    return h("div", { "class": "oidc-step" }, [h("span", { "class": "oidc-step__num" }, String(n)), text5]);
  }
  function OidcSignedOut() {
    return h("div", { "data-state": "ready-signed-out" }, [
      h("div", { "class": "brand-logo brand-logo--lg", style: "margin-bottom:18px" }),
      h("div", { "class": "oidc-title" }, "Sign in to your account"),
      h("div", { "class": "oidc-sub" }, "Sign-in continues in the secure account service. When you\u2019re done, you\u2019ll return right here."),
      h("div", { "class": "oidc-steps" }, [
        oidcStep(1, "Continue to the secure account service"),
        oidcStep(2, "Sign in there \u2014 we never see your password"),
        oidcStep(3, "Come back here, signed in")
      ]),
      ActionButton({ variant: "btn--primary", label: "Continue to secure sign-in", action: "auth.oidcSignIn", block: true, lg: true, visualId: "oidc-signin" }),
      h("div", { "class": "oidc-note" }, "By continuing you agree to our Terms & Privacy Policy.")
    ]);
  }
  function OidcProgress(stateName, title, sub) {
    return h("div", { "data-state": stateName, "aria-busy": "true" }, [
      h("div", { "class": "oidc-status" }, [h("span", { "class": "oidc-spinner" })]),
      h("div", { "class": "oidc-title" }, title),
      h("div", { "class": "oidc-sub oidc-sub--tail" }, sub)
    ]);
  }
  function OidcUnavailable() {
    return h("div", { "data-state": "unavailable" }, [
      h("div", { "class": "oidc-status" }, [h("div", { "class": "oidc-glyph oidc-glyph--warn" }, "!")]),
      h("div", { "class": "oidc-title" }, "Secure sign-in isn\u2019t available"),
      h("div", { "class": "oidc-sub" }, "We couldn\u2019t reach the secure account service, so sign-in can\u2019t start right now. There\u2019s no other way to sign in here \u2014 please try again in a moment."),
      h("div", { "class": "oidc-actions" }, [
        ActionButton({ variant: "btn--primary", label: "Try again", action: "auth.retrySession", block: true, lg: true, visualId: "oidc-retry" }),
        ActionButton({ variant: "btn--ghost", label: "Back to the catalog", action: "nav.landing", block: true, visualId: "oidc-back-catalog" })
      ])
    ]);
  }
  function OidcSignedIn() {
    var name = state.sessionName || F.customer.firstName;
    return h("div", { "data-state": "ready-signed-in" }, [
      h("div", { "class": "oidc-status" }, [h("div", { "class": "oidc-glyph oidc-glyph--ok" }, "\u2713")]),
      h("div", { "class": "oidc-title" }, "You\u2019re signed in"),
      h("div", { "class": "oidc-session" }, [
        h("div", { "class": "oidc-session__ava" }, (name || "?").charAt(0).toUpperCase()),
        h("div", null, [
          h("div", { "class": "oidc-session__label" }, "Signed in as"),
          h("div", { "class": "oidc-session__name", "data-bind": "session.displayName" }, name)
        ])
      ]),
      h("div", { "class": "oidc-sub" }, "You can keep browsing while signed in."),
      h("div", { "class": "oidc-actions" }, [
        ActionButton({ variant: "btn--primary", label: "Browse the catalog", action: "nav.landing", block: true, lg: true, visualId: "oidc-browse-catalog" }),
        ActionButton({ variant: "btn--ghost", label: "Sign out", action: "auth.signOut", block: true, visualId: "oidc-signout" })
      ])
    ]);
  }

  // app-templates/customer-portal/runtime/src/components/primitives/RouteStates.js
  function UnauthorizedState(props) {
    props = props || {};
    return h("div", { "class": "state-block", "data-module": "unauthorized-state", "data-visual-id": "unauthorized-state", "data-state": "unauthorized" }, [
      h("div", { "class": "state-block__glyph" }, "\u26BF"),
      h("div", { "class": "state-block__title" }, "You don\u2019t have access to this page"),
      h("div", { "class": "state-block__desc" }, "Your account doesn\u2019t include access to " + (props.scope || "this area") + ". If that seems wrong, we can sort it out."),
      h("div", { style: "display:flex;gap:10px;justify-content:center;flex-wrap:wrap" }, [
        ActionButton({ variant: "btn--primary", label: "Contact support", action: "support.email", visualId: "unauthorized-support" }),
        ActionButton({ variant: "btn--ghost", label: "Go back", action: "nav.go", id: props.backRoute || "orders.list", visualId: "unauthorized-back" })
      ])
    ]);
  }
  function NotFoundState(props) {
    props = props || {};
    return h("div", { "class": "state-block", "data-module": "not-found-state", "data-visual-id": "not-found-state", "data-state": "not-found" }, [
      h("div", { "class": "state-block__glyph" }, "\u2205"),
      h("div", { "class": "state-block__title" }, "We can\u2019t find that " + (props.noun || "page")),
      h("div", { "class": "state-block__desc" }, "It may have been removed or the link may be out of date. Everything you can open is on your " + (props.backLabel || "overview") + " page."),
      ActionButton({ variant: "btn--primary", label: "Back to " + (props.backLabel || "overview"), action: "nav.go", id: props.backRoute || "orders.list", visualId: "not-found-back" })
    ]);
  }
  function ConflictBanner(props) {
    props = props || {};
    return h("div", { "class": "conflict-banner", "data-module": "conflict-banner", "data-visual-id": "conflict-banner", "data-state": "conflict", role: "alert" }, [
      h("div", { "class": "conflict-banner__icon" }, "\u21BA"),
      h("div", { "class": "conflict-banner__body" }, [
        h("div", { style: "font-weight:700;font-size:13.5px" }, "This " + (props.noun || "page") + " changed since you opened it"),
        h("div", { style: "font-size:12.5px;line-height:1.45;color:var(--ink-2);margin-top:2px" }, props.desc || "Load the latest version and review it before deciding \u2014 nothing was submitted.")
      ]),
      ActionButton({ variant: "btn--primary", label: "Load latest", action: "ui.retry", id: props.retryId, visualId: "conflict-refresh" })
    ]);
  }
  function InlineFailure(props) {
    props = props || {};
    return h("div", { "class": "inline-fail", "data-module": "command-failure", "data-visual-id": "command-failure", "data-state": "failed", role: "alert" }, [
      h("span", { "class": "inline-fail__icon" }, "!"),
      h("div", { style: "flex:1;font-size:13px;line-height:1.45;min-width:0" }, props.msg || "That didn\u2019t go through \u2014 nothing was changed."),
      props.retryAction ? ActionButton({ variant: "btn--ghost", label: props.retryLabel || "Try again", action: props.retryAction, id: props.retryId, visualId: "command-retry" }) : null
    ]);
  }
  function skel2(style) {
    return h("div", { "class": "skeleton", style });
  }
  function listSkeleton(n) {
    var card = h("div", { "class": "card", "data-state": "loading", "aria-busy": "true" });
    for (var i = 0; i < (n || 4); i++) card.appendChild(skeletonRow());
    return card;
  }
  function gridSkeleton(cls, n, height) {
    var g = h("div", { "class": cls, "data-state": "loading", "aria-busy": "true" });
    for (var i = 0; i < n; i++) g.appendChild(skel2("height:" + height + "px;border-radius:20px"));
    return g;
  }
  function routeStateBody(cfg) {
    var v = cfg.view || state.view;
    if (!cfg.states || cfg.states.indexOf(v) === -1) return null;
    if (v === "loading") return cfg.skeleton ? cfg.skeleton() : listSkeleton(4);
    if (v === "error") return ErrorState(cfg.error || {});
    if (v === "empty" && cfg.empty) return EmptyState(cfg.empty);
    if (v === "unauthorized") return UnauthorizedState({ scope: cfg.scope, backRoute: cfg.backRoute });
    return null;
  }

  // app-templates/customer-portal/runtime/src/components/spa/CommerceBits.js
  function UnavailableState(props) {
    props = props || {};
    return h("div", { "class": "state-block", "data-module": "unavailable-state", "data-visual-id": "unavailable-state", "data-state": "unavailable" }, [
      h("div", { "class": "state-block__glyph" }, "\u25CC"),
      h("div", { "class": "state-block__title" }, props.title || "This isn\u2019t available yet"),
      h("div", { "class": "state-block__desc" }, props.desc || "This part of the portal isn\u2019t connected yet. Nothing is shown in the meantime \u2014 we don\u2019t invent records."),
      props.action ? ActionButton(props.action) : null
    ]);
  }
  function spaGate(cfg) {
    if (state.view === "unavailable") return UnavailableState(cfg.unavailable || {});
    if (state.view === "not-found" && cfg.notFound) return NotFoundState(cfg.notFound);
    return routeStateBody(cfg);
  }
  function SimulationBadge(block) {
    return h("div", { "class": "sim-badge" + (block ? " sim-badge--block" : ""), "data-module": "simulation-notice", "data-visual-id": "simulation-notice", "data-bind": "checkout.paymentMode", role: "note" }, [
      h("i", { "class": "sim-badge__dot" }),
      h("b", null, "Simulation"),
      "\u2014 no charge will be made"
    ]);
  }
  function KindChip(kind) {
    return h("span", { "class": "kind-chip kind-chip--" + kind.toLowerCase(), "data-bind": "purchase.kind" }, F.spaCommerce.purchases.kindLabels[kind] || kind);
  }
  function purchaseStatusBadge(label) {
    return StatusBadge({ variant: F.spaCommerce.purchases.statusBadges[label] || "status-badge--scheduled", label, bind: "purchase.customerStatus" });
  }
  function MoneyRows(money2) {
    var rows = [["Subtotal", money2.subtotal, "money.subtotal"]];
    if (money2.discount) rows.push(["Discount", money2.discount, "money.discount"]);
    rows.push(["Tax", money2.tax, "money.tax"]);
    var wrap = h("div", { "class": "money-rows", "data-module": "commercial-totals", "data-visual-id": "commercial-totals" });
    rows.forEach(function(r) {
      if (r[1] == null) return;
      wrap.appendChild(h("div", { "class": "money-rows__row" }, [h("span", null, r[0]), h("span", { "data-bind": r[2] }, r[1])]));
    });
    wrap.appendChild(h("div", { "class": "money-rows__row money-rows__row--total" }, [
      h("span", null, "Total"),
      h("span", { "data-bind": "money.total" }, money2.total + (money2.currency ? " " + money2.currency : ""))
    ]));
    return wrap;
  }

  // app-templates/customer-portal/runtime/src/routes/SpaAccountPage.js
  function entryAvailability(key) {
    if (spaCurrentApiDemoOpen()) {
      if (key === "support" || key === "plan") return "unavailable";
      return "available";
    }
    var staging = spaCapability() === "current-staging";
    if (key === "support") return "unavailable";
    if (staging) return "unavailable";
    if (state.spaAccountPartial && (key === "plan" || key === "profile")) return "unavailable";
    return "available";
  }
  function SpaAccount() {
    var page = h("section", { "class": "page", "data-route": "account", "data-state": state.view, "data-visual-id": "spa-account", "data-module": "spa-account", "data-capability": spaCapability(), "data-screen-label": "Account overview" });
    page.appendChild(PageHeader({ title: "Account", sub: h("span", { "data-bind": "session.displayName" }, "Signed in as " + spaCustomer().fullName) }));
    var gate = spaGate({
      states: ["loading", "error", "unauthorized"],
      skeleton: function() {
        var w = h("div", { "class": "account-grid", "data-state": "loading", "aria-busy": "true" });
        for (var i = 0; i < 4; i++) w.appendChild(skel2("height:120px;border-radius:20px"));
        return w;
      },
      error: { title: "Couldn\u2019t load your account", desc: "Your account overview didn\u2019t load, so nothing is shown \u2014 we never show stale sections. Nothing was changed; try again.", retryId: "account" },
      scope: "your account",
      backRoute: "orders.list",
      unavailable: { title: "Account isn\u2019t available yet", desc: "This part of the portal isn\u2019t connected yet. Your visits and catalog pages still work as usual." }
    });
    if (gate) {
      page.appendChild(gate);
      return page;
    }
    var grid = h("div", { "class": "account-grid", "data-module": "account-entry-list", "data-visual-id": "account-entry-list" });
    F.spaCommerce.accountEntries.forEach(function(e) {
      var avail = entryAvailability(e.key);
      var card = h("div", {
        "class": "card card--pad account-entry" + (avail === "unavailable" ? " account-entry--unavailable" : ""),
        "data-module": "account-entry",
        "data-visual-id": "account-entry-" + e.key,
        "data-state": avail
      }, [
        h("div", { style: "display:flex;align-items:center;gap:9px" }, [
          h("div", { "class": "card__title", style: "flex:1" }, e.title),
          avail === "unavailable" ? h("span", { "class": "readonly-chip" }, "Not available yet") : null
        ]),
        h("div", { "class": "account-entry__desc" }, avail === "available" ? e.desc : spaCurrentApiDemoOpen() && e.key === "plan" ? "Published packages and memberships can be ordered now. A personal balance or renewal record is not exposed by the current API." : e.unavailableDesc),
        h(
          "div",
          { "class": "account-entry__foot" },
          avail === "available" ? h("span", { "class": "link-action", "data-action": e.action }, "Open " + e.title.toLowerCase() + " \u203A") : e.key === "purchases" && spaCapability() === "current-staging" ? h("span", { "class": "link-action", "data-action": "nav.go", "data-id": "orders.list" }, "See your orders \u203A") : e.key === "plan" ? h("span", { "class": "link-action", "data-action": "nav.go", "data-id": "pricing" }, "Membership options \u203A") : null
        )
      ]);
      grid.appendChild(card);
    });
    page.appendChild(grid);
    page.appendChild(h("div", { "class": "catalog-note" }, "Sections appear here as they\u2019re connected for your account \u2014 nothing is shown from guesses."));
    return page;
  }

  // app-templates/customer-portal/runtime/src/routes/SpaAppointmentsPage.js
  function modeChip(mode) {
    return h("span", { "class": "visit-mode visit-mode--" + mode, "data-module": "visit-mode", "data-bind": "appointment.visitMode" }, [
      h("i", { "class": "visit-mode__dot" }),
      F.spa.modeLabels[mode]
    ]);
  }
  function statusBadge(label) {
    return StatusBadge({ variant: F.spa.statusBadges[label] || "status-badge--scheduled", label, bind: "appointment.status" });
  }
  function apptRow(a, opts) {
    opts = opts || {};
    var meta = [a.time, a.specialist, F.spa.modeLabels[a.mode]].filter(Boolean).join(" \xB7 ");
    var row = h("div", { "class": "appt-row appt-row--link", "data-module": "appointment-row", "data-visual-id": "appointment-row", "data-appointment-id": a.id, "data-appointment-ref": a.id, "data-action": "appointment.open", "data-id": a.id, role: "link", tabindex: "0" }, [
      h("div", { "class": "log-date" }, a.date),
      h("div", { "class": "appt-row__body" }, [
        h("div", { "class": "appt-row__name", "data-bind": "appointment.service" }, a.service),
        h("div", { "class": "appt-row__meta", "data-bind": "appointment.time,appointment.specialist,appointment.visitMode" }, meta)
      ]),
      statusBadge(a.status),
      a.price ? h("div", { "class": "appt-row__price", "data-bind": "appointment.displayPrice" }, a.price) : null,
      opts.bookAgain && a.status === "Completed" ? h("span", { "class": "link-action", "data-action": "appointment.bookAgain", "data-id": a.id, "data-appointment-ref": a.id }, "Book again \u203A") : h("span", { "class": "appt-row__chev", "aria-hidden": "true" }, "\u203A")
    ]);
    return row;
  }
  function pastPanel(items, open) {
    var panel = h("div", { "class": "list-panel", "data-module": "appointment-list", "data-visual-id": "appointments-past" }, [
      h("div", { "class": "list-panel__head" }, [
        h("div", { "class": "list-panel__title", style: "flex:1" }, "Past"),
        h("span", { style: "font-size:12px;color:var(--ink-3)" }, "your visit history")
      ])
    ]);
    items.forEach(function(a) {
      panel.appendChild(apptRow(a, { bookAgain: open }));
    });
    return panel;
  }
  function loadingSkeleton() {
    var w = h("div", { "data-state": "loading", "aria-busy": "true" });
    w.appendChild(skel2("height:210px;border-radius:24px"));
    w.appendChild(skel2("height:150px;border-radius:24px;margin-top:18px"));
    w.appendChild(skel2("height:150px;border-radius:24px;margin-top:18px"));
    return w;
  }
  function SpaAppointments() {
    var open = spaBookingOpen();
    var appointments = spaAppointments();
    var view = state.config.dataMode === "live" ? state.moduleStatus.appointments || appointments.state || "loading" : state.view;
    var sc = state.spaAppt;
    var next = view === "empty" ? null : appointments.next;
    var cancelled = next && !!state.spaCancelled[next.id];
    var resched = next ? state.spaRescheduled[next.id] : null;
    var page = h("section", { "class": "page", "data-route": "orders.list", "data-state": view, "data-visual-id": "spa-appointments", "data-capability": "target-appointments", "data-booking": open ? "open" : "closed", "data-screen-label": "Appointments (target)" });
    var sub = next ? cancelled ? "Your " + next.date + " visit was cancelled." : "Your next visit \u2014 " + next.date + ", " + F.spa.modeLabels[next.mode].toLowerCase() + "." : "You have no upcoming visits.";
    page.appendChild(PageHeader({ title: spaCustomer().greeting, sub }));
    var gate = routeStateBody({
      view,
      states: ["loading", "error", "unauthorized"],
      skeleton: loadingSkeleton,
      error: { title: "Couldn\u2019t load your appointments", desc: "Your appointments didn\u2019t load, so nothing is shown \u2014 we never show stale or guessed visits. Nothing was changed; try again.", retryId: "appointments" },
      scope: "your appointments",
      backRoute: "services"
    });
    if (gate) {
      page.appendChild(gate);
      return page;
    }
    var grid = h("div", { "class": "appt-grid" });
    var left = h("div", { "class": "appt-col" });
    var right = h("div", { "class": "appt-col" });
    if (!next) {
      var emptyCard = h("div", { "class": "card appt-empty", "data-module": "appointment-empty", "data-visual-id": "appointment-empty", "data-state": "empty" }, [
        h("div", { "class": "state-block__glyph" }, "\u2740"),
        h("div", { "class": "state-block__title" }, "No upcoming appointments"),
        h("div", { "class": "state-block__desc" }, open ? "Nothing is booked right now \u2014 book your next visit whenever you\u2019re ready." : "Nothing is booked right now. Online booking isn\u2019t available yet \u2014 browse treatments and prices, and our team takes it from there."),
        h("div", { "class": "appt-empty__actions" }, open ? [
          ActionButton({ variant: "btn--primary", label: "Book an appointment", action: "booking.open", lg: true, visualId: "appt-empty-book" }),
          ActionButton({ variant: "btn--ghost", label: "Browse services", action: "nav.go", id: "services", visualId: "appt-empty-browse" })
        ] : [
          ActionButton({ variant: "btn--primary", label: "Browse services", action: "nav.go", id: "services", lg: true, visualId: "appt-empty-browse" }),
          ActionButton({ variant: "btn--ghost", label: "See prices", action: "nav.go", id: "pricing", visualId: "appt-empty-prices" })
        ])
      ]);
      if (sc === "no-history") {
        emptyCard.appendChild(h("div", { style: "font-size:12px;color:var(--ink-3)" }, "Visits you complete will build your history here."));
        left.appendChild(emptyCard);
      } else {
        left.appendChild(emptyCard);
        left.appendChild(pastPanel(appointments.past || [], open));
      }
    } else {
      var cKey = "order.cancel:" + next.id;
      var phase = cmdPhase(cKey);
      var hero = h("div", { "class": "card card--pad appt-hero", "data-module": "next-appointment", "data-visual-id": "next-appointment", "data-appointment-id": next.id, "data-state": cancelled ? "cancelled" : phase !== "idle" ? phase : "ready" }, [
        h("div", { style: "display:flex;align-items:center;gap:9px;flex-wrap:wrap" }, [
          h("div", { "class": "card__title", style: "flex:1" }, "Next appointment"),
          modeChip(next.mode),
          cancelled ? statusBadge("Cancelled") : statusBadge(next.status)
        ]),
        h("div", { "class": "appt-hero__service", "data-bind": "appointment.service" }, next.service),
        h("div", { "class": "appt-hero__when" }, [
          h("span", { "data-bind": "appointment.start" }, resched ? resched.start : next.date + " \xB7 " + next.time),
          h("span", { "class": "appt-hero__tz" }, F.spa.appointments.tzNote)
        ])
      ]);
      var details = h("div", { "class": "appt-details", "data-visual-id": "visit-details" }, [
        h("div", { "class": "appt-details__row" }, [
          h("div", { "class": "appt-details__label" }, "Where"),
          h("div", { "class": "appt-details__val", "data-bind": "appointment.visitMode,appointment.location" }, [
            h("b", null, F.spa.modeLabels[next.mode]),
            next.location ? " \xB7 " + next.location : h("span", { style: "color:var(--ink-3)" }, " \xB7 location details not provided yet")
          ])
        ]),
        h("div", { "class": "appt-details__row" }, [
          h("div", { "class": "appt-details__label" }, "With"),
          h(
            "div",
            { "class": "appt-details__val", "data-bind": "appointment.specialist" },
            next.specialist ? [h("b", null, next.specialist)] : [h("span", { style: "color:var(--ink-3)" }, "No specialist assigned yet")]
          )
        ])
      ]);
      if (next.price) details.appendChild(h("div", { "class": "appt-details__row" }, [
        h("div", { "class": "appt-details__label" }, "Price"),
        h("div", { "class": "appt-details__val", "data-bind": "appointment.displayPrice" }, [h("b", null, next.price), " \xB7 as booked"])
      ]));
      hero.appendChild(h("div", { style: "font-size:12px;font-weight:650;color:var(--ink-3);margin-top:14px;letter-spacing:.04em;text-transform:uppercase" }, "Visit details"));
      hero.appendChild(details);
      hero.appendChild(h("div", { "class": "appt-hero__ref", "data-bind": "appointment.reference" }, [
        "Reference " + next.ref,
        h("span", null, [" \xB7 ", h("span", { "class": "link-action", "data-action": "appointment.open", "data-id": next.id, "data-appointment-ref": next.id }, "View details \u203A")]),
        /* wave 15 — appointment detail may deep-link to its purchase (never the reverse priority) */
        state.config.dataMode !== "live" && F.spaCommerce.purchaseByAppointment[next.id] ? h("span", null, [" \xB7 ", h("span", { "class": "link-action", "data-action": "purchase.open", "data-id": F.spaCommerce.purchaseByAppointment[next.id], "data-purchase-ref": F.spaCommerce.purchaseByAppointment[next.id] }, "View purchase \u203A")]) : null
      ]));
      if (resched && !cancelled) {
        hero.appendChild(h("div", { "class": "appt-hero__note", "data-state": "succeeded" }, "Rescheduled \u2014 confirmed by the studio. The previous time was released."));
      }
      if (cancelled) {
        hero.appendChild(h("div", { "class": "appt-hero__note", "data-state": "succeeded" }, "Cancelled \u2014 confirmed by the studio. Nothing further is scheduled for this visit."));
        hero.appendChild(h("div", { "class": "appt-hero__actions" }, [
          open ? ActionButton({ variant: "btn--primary", label: "Book a new visit", action: "booking.open", visualId: "appt-rebook" }) : ActionButton({ variant: "btn--ghost", label: "Browse services", action: "nav.go", id: "services", visualId: "appt-rebook-browse" })
        ]));
      } else if (open) {
        if (phase === "failed") hero.appendChild(h("div", { style: "margin-top:12px" }, InlineFailure({
          msg: "Your appointment wasn\u2019t cancelled \u2014 it\u2019s still booked exactly as shown.",
          retryAction: "appointment.cancel",
          retryId: next.id,
          retryLabel: "Try cancelling again"
        })));
        if (phase === "conflict") hero.appendChild(h("div", { style: "margin-top:12px" }, InlineFailure({
          msg: "This appointment changed since you opened it \u2014 reload the latest version before making changes.",
          retryAction: "ui.retry",
          retryId: cKey,
          retryLabel: "Reload"
        })));
        var allowed2 = next.allowedActions || ["reschedule", "cancel"];
        var heroActions = h("div", { "class": "appt-hero__actions" });
        if (allowed2.indexOf("reschedule") !== -1) heroActions.appendChild(ActionButton({ variant: "btn--ghost", label: "Reschedule", action: "appointment.reschedule", id: next.id, disabled: phase === "pending" || phase === "conflict", visualId: "appt-reschedule" }));
        if (allowed2.indexOf("cancel") !== -1) heroActions.appendChild(ActionButton({ variant: "btn--ghost", label: "Cancel visit", action: "appointment.cancel", id: next.id, confirm: true, pending: phase === "pending", pendingLabel: "Cancelling\u2026", disabled: phase === "conflict", visualId: "appt-cancel" }));
        if (heroActions.childNodes.length) hero.appendChild(heroActions);
      } else {
        hero.appendChild(h("div", { "class": "appt-hero__actions" }, [
          ActionButton({ variant: "btn--ghost", label: "Reschedule", action: "order.reschedule", id: next.id, disabled: true, visualId: "appt-reschedule" }),
          ActionButton({ variant: "btn--ghost", label: "Cancel visit", action: "order.cancel", id: next.id, disabled: true, visualId: "appt-cancel" })
        ]));
        hero.appendChild(h("div", { "class": "appt-hero__note", "data-state": "unavailable" }, [
          "Online changes aren\u2019t available yet for this visit \u2014 our team can reschedule or cancel it for you. ",
          h("span", { "class": "link-action", "data-action": "support.open" }, "Contact support \u203A")
        ]));
      }
      left.appendChild(hero);
      var upcoming = h("div", { "class": "list-panel", "data-module": "appointment-list", "data-visual-id": "appointments-upcoming" }, [
        h("div", { "class": "list-panel__head" }, [h("div", { "class": "list-panel__title", style: "flex:1" }, "Upcoming")])
      ]);
      (appointments.upcoming || []).forEach(function(a) {
        upcoming.appendChild(apptRow(a));
      });
      left.appendChild(upcoming);
      left.appendChild(pastPanel(appointments.past || [], open));
    }
    var rail = h("div", { "class": "card card--pad", "data-module": "catalog-teaser", "data-visual-id": "catalog-teaser" }, [
      h("div", { "class": "card__title" }, "Treatments & prices"),
      h("div", { style: "font-size:12.5px;color:var(--ink-2);margin:4px 0 8px" }, "Live from the public catalog \u2014 shown as published.")
    ]);
    F.spa.pim.services.slice(0, 3).forEach(function(s) {
      rail.appendChild(h("div", { "class": "rate-row", "data-product-code": s.code }, [
        h("div", { style: "flex:1;min-width:0" }, [
          h("div", { style: "font-weight:600;font-size:13.5px", "data-bind": "pim.services[].name" }, s.name),
          h("div", { style: "font-size:12px;color:var(--ink-3)" }, s.shortDescription)
        ]),
        h("div", { style: "font-weight:700;font-size:13.5px", "data-bind": "pim.services[].displayPrice" }, s.displayPrice)
      ]));
    });
    rail.appendChild(h("div", { style: "margin-top:10px" }, h("span", { "class": "link-action", "data-action": "nav.go", "data-id": "services" }, "All services & prices \u203A")));
    right.appendChild(rail);
    grid.appendChild(left);
    grid.appendChild(right);
    page.appendChild(grid);
    return page;
  }

  // app-templates/customer-portal/runtime/src/routes/SpaAppointmentDetailPage.js
  function modeChip2(mode) {
    return h("span", { "class": "visit-mode visit-mode--" + mode, "data-module": "visit-mode", "data-bind": "appointment.visitMode" }, [
      h("i", { "class": "visit-mode__dot" }),
      F.spa.modeLabels[mode]
    ]);
  }
  function detailRow(label, val) {
    return h("div", { "class": "appt-details__row" }, [
      h("div", { "class": "appt-details__label" }, label),
      h("div", { "class": "appt-details__val" }, val)
    ]);
  }
  function SpaAppointmentDetail() {
    var a = currentAppointment();
    var view = state.config.dataMode === "live" ? state.moduleStatus.appointments || "loading" : state.view;
    var page = h("section", { "class": "page page--narrow", "data-route": "appointment.detail", "data-state": view, "data-visual-id": "appointment-detail", "data-module": "appointment-detail", "data-capability": spaCapability(), "data-appointment-ref": a ? a.ref : void 0, "data-screen-label": "Appointment detail" });
    page.appendChild(h("div", { "class": "detail-back" }, h("span", { "class": "link-action", "data-action": "nav.go", "data-id": "orders.list" }, "\u2039 Appointments")));
    var gate = routeStateBody({
      view,
      states: ["loading", "error", "unauthorized"],
      skeleton: function() {
        return h("div", { "data-state": "loading", "aria-busy": "true" }, [
          skel2("height:300px;border-radius:24px"),
          skel2("height:90px;border-radius:20px;margin-top:16px")
        ]);
      },
      error: { title: "Couldn\u2019t load this visit", desc: "The visit didn\u2019t load, so nothing is shown \u2014 we never show a stale or guessed visit. Nothing was changed; try again.", retryId: "appointment-detail" },
      scope: "this visit",
      backRoute: "orders.list"
    });
    if (gate) {
      page.appendChild(gate);
      return page;
    }
    if (!a || view === "not-found") {
      page.appendChild(NotFoundState({ noun: "visit", backLabel: "appointments", backRoute: "orders.list" }));
      return page;
    }
    var open = spaBookingOpen();
    var cancelled = !!state.spaCancelled[a.ref];
    var rescheduled = !!state.spaRescheduled[a.ref];
    var cKey = "order.cancel:" + a.ref;
    var phase = cmdPhase(cKey);
    var conflict = view === "conflict";
    var allowed2 = cancelled ? [] : a.allowedActions || [];
    var isPast = a.customerStatus === "Completed" || a.customerStatus === "Cancelled";
    page.appendChild(PageHeader({ title: "Your visit", sub: "Everything about this appointment, exactly as recorded by the studio." }));
    if (conflict) page.appendChild(ConflictBanner({ noun: "visit", desc: "This visit changed since you opened it. Load the latest version before making changes \u2014 nothing was submitted.", retryId: "appointment-detail" }));
    var hero = h("div", { "class": "card card--pad appt-hero", "data-module": "next-appointment", "data-visual-id": "appointment-detail-card", "data-appointment-ref": a.ref, "data-state": cancelled ? "cancelled" : phase !== "idle" ? phase : conflict ? "conflict" : "ready" }, [
      h("div", { style: "display:flex;align-items:center;gap:9px;flex-wrap:wrap" }, [
        modeChip2(a.visitMode),
        h("div", { style: "flex:1" }),
        StatusBadge({ variant: F.spa.statusBadges[cancelled ? "Cancelled" : a.customerStatus] || "status-badge--scheduled", label: cancelled ? "Cancelled" : a.customerStatus, bind: "appointment.customerStatus" })
      ]),
      h("div", { "class": "appt-hero__service", "data-bind": "appointment.service" }, a.service),
      h("div", { "class": "appt-hero__when" }, [
        h("span", { "data-bind": "appointment.start" }, a.start),
        h("span", { "class": "appt-hero__tz", "data-bind": "appointment.timezoneNote" }, a.timezoneNote)
      ])
    ]);
    var details = h("div", { "class": "appt-details", "data-visual-id": "visit-details" });
    details.appendChild(detailRow("Where", h("span", { "data-bind": "appointment.visitMode,appointment.location" }, [
      h("b", null, F.spa.modeLabels[a.visitMode]),
      a.location ? " \xB7 " + a.location : h("span", { style: "color:var(--ink-3)" }, " \xB7 location details not provided yet")
    ])));
    details.appendChild(detailRow("With", a.specialist ? h("b", { "data-bind": "appointment.specialist" }, a.specialist) : h("span", { style: "color:var(--ink-3)", "data-bind": "appointment.specialist" }, "No specialist assigned yet")));
    if (a.displayPrice) details.appendChild(detailRow("Price", h("span", { "data-bind": "appointment.displayPrice" }, [h("b", null, a.displayPrice), " \xB7 as booked"])));
    hero.appendChild(h("div", { style: "font-size:12px;font-weight:650;color:var(--ink-3);margin-top:14px;letter-spacing:.04em;text-transform:uppercase" }, "Visit details"));
    hero.appendChild(details);
    hero.appendChild(h("div", { "class": "appt-hero__ref", "data-bind": "appointment.reference" }, [
      "Reference " + a.reference,
      a.relatedPurchaseRef && allowed2.indexOf("openPurchase") !== -1 ? h("span", null, [" \xB7 ", h("span", { "class": "link-action", "data-action": "appointment.openPurchase", "data-id": a.relatedPurchaseRef, "data-purchase-ref": a.relatedPurchaseRef }, "View purchase \u203A")]) : null
    ]));
    if (a.attention && !cancelled) hero.appendChild(h("div", { "class": "purch-row__attention", "data-bind": "appointment.attention", role: "note", style: "margin-top:12px" }, a.attention));
    if (cancelled) {
      hero.appendChild(h("div", { "class": "appt-hero__note", "data-state": "succeeded" }, "Cancelled \u2014 confirmed by the studio. Nothing further is scheduled for this visit."));
      hero.appendChild(h("div", { "class": "appt-hero__actions" }, [
        open ? ActionButton({ variant: "btn--primary", label: "Book a new visit", action: "booking.open", visualId: "adet-rebook" }) : ActionButton({ variant: "btn--ghost", label: "Browse services", action: "nav.go", id: "services", visualId: "adet-rebook-browse" })
      ]));
    } else {
      if (rescheduled) hero.appendChild(h("div", { "class": "appt-hero__note", "data-state": "succeeded" }, "Rescheduled \u2014 confirmed by the studio. The previous time was released."));
      if (phase === "failed") hero.appendChild(h("div", { style: "margin-top:12px" }, InlineFailure({
        msg: "Your appointment wasn\u2019t cancelled \u2014 it\u2019s still booked exactly as shown.",
        retryAction: "appointment.cancel",
        retryId: a.ref,
        retryLabel: "Try cancelling again"
      })));
      if (phase === "conflict") hero.appendChild(h("div", { style: "margin-top:12px" }, InlineFailure({
        msg: "This appointment changed since you opened it \u2014 reload the latest version before making changes.",
        retryAction: "ui.retry",
        retryId: cKey,
        retryLabel: "Reload"
      })));
      var actions = h("div", { "class": "appt-hero__actions" });
      if (allowed2.indexOf("reschedule") !== -1) actions.appendChild(ActionButton({ variant: "btn--ghost", label: "Reschedule", action: "appointment.reschedule", id: a.ref, disabled: !open || conflict || phase === "pending" || phase === "conflict", visualId: "adet-reschedule" }));
      if (allowed2.indexOf("cancel") !== -1) actions.appendChild(ActionButton({ variant: "btn--ghost", label: "Cancel visit", action: "appointment.cancel", id: a.ref, confirm: true, pending: phase === "pending", pendingLabel: "Cancelling\u2026", disabled: !open || conflict || phase === "conflict", visualId: "adet-cancel" }));
      if (allowed2.indexOf("bookAgain") !== -1) actions.appendChild(ActionButton({ variant: "btn--primary", label: "Book again", action: "appointment.bookAgain", id: a.ref, disabled: !open || conflict, visualId: "adet-book-again" }));
      if (actions.childNodes.length) actions.childNodes.forEach(function(b) {
        b.setAttribute("data-appointment-ref", a.ref);
      });
      if (actions.childNodes.length) hero.appendChild(actions);
      if (!open && allowed2.length && !(allowed2.length === 1 && allowed2[0] === "openPurchase")) {
        hero.appendChild(h("div", { "class": "appt-hero__note", "data-state": "unavailable" }, [
          "Online changes aren\u2019t available yet for this visit \u2014 our team can " + (isPast ? "book it again" : "reschedule or cancel it") + " for you. ",
          h("span", { "class": "link-action", "data-action": "support.open" }, "Contact support \u203A")
        ]));
      }
    }
    page.appendChild(hero);
    page.appendChild(h("div", { "class": "catalog-note" }, "Times, prices and statuses are shown exactly as recorded \u2014 this page never estimates deadlines or eligibility."));
    return page;
  }

  // app-templates/customer-portal/runtime/src/routes/SpaCartPage.js
  function cartLineRow(l, i) {
    var demo = state.spaCartDemo;
    var lineState = i === 0 && demo === "stale-price" ? "stale-price" : i === 0 && demo === "inventory-conflict" ? "inventory-conflict" : null;
    var qPhase = cmdPhase("cart.changeQuantity:" + l.ref);
    var rPhase = cmdPhase("cart.removeItem:" + l.ref);
    var busy = qPhase === "pending" || rPhase === "pending";
    var row = h("div", { "class": "cart-row spa-cart-row", "data-module": "cart-line", "data-visual-id": "cart-line", "data-line-ref": l.ref, "data-state": lineState || (busy ? "pending" : qPhase !== "idle" ? qPhase : void 0) }, [
      h("div", { "class": "cart-row__body" }, [
        h("div", { style: "font-weight:700;font-size:14.5px", "data-bind": "cart.lines[].title" }, l.title + (l.variant ? " \xB7 " + l.variant : "")),
        h("div", { style: "font-size:13px;color:var(--ink-2)", "data-bind": "cart.lines[].displayUnitPrice" }, l.displayUnitPrice + " each"),
        qPhase === "failed" ? h("div", { "class": "cart-row__note", role: "alert" }, "Didn\u2019t save \u2014 quantity unchanged. Try again.") : null,
        lineState === "stale-price" ? h("div", { "class": "cart-row__note", role: "alert", "data-bind": "cart.lines[].priceNote" }, "The price of this item changed since you added it \u2014 refresh the bag to see current totals.") : null,
        lineState === "inventory-conflict" ? h("div", { "class": "cart-row__note", role: "alert" }, [
          "Only 1 is available right now. ",
          h("span", { "class": "link-action", "data-action": "cart.changeQuantity", "data-id": l.ref + "|1" }, "Keep 1"),
          " \xB7 ",
          h("span", { "class": "link-action", "data-action": "cart.removeItem", "data-id": l.ref }, "Remove")
        ]) : null
      ]),
      h("div", { "class": "qty" }, [
        h("button", { "class": "qty__btn qty__btn--minus", "data-action": "cart.changeQuantity", "data-id": l.ref + "|" + (l.qty - 1), "aria-label": "Decrease", disabled: busy ? true : void 0 }, "\u2212"),
        h("div", { "class": "qty__val", "data-bind": "cart.lines[].quantity" }, String(l.qty)),
        h("button", { "class": "qty__btn qty__btn--plus", "data-action": "cart.changeQuantity", "data-id": l.ref + "|" + (l.qty + 1), "aria-label": "Increase", disabled: busy ? true : void 0 }, "+")
      ]),
      h("div", { "class": "cart-row__total", "data-bind": "cart.lines[].displayTotal" }, l.displayTotal),
      h("button", { "class": "cart-remove", "data-action": "cart.removeItem", "data-id": l.ref, disabled: busy ? true : void 0 }, rPhase === "pending" ? "Removing\u2026" : "Remove")
    ]);
    return row;
  }
  function SpaCart() {
    var page = h("section", { "class": "page", "data-route": "cart", "data-state": state.view, "data-visual-id": "spa-cart", "data-module": "spa-cart", "data-capability": spaCapability(), "data-cart-ref": state.spaCart ? state.spaCart.version : void 0, "data-screen-label": "Your bag" });
    page.appendChild(h("div", { "class": "detail-back" }, h("span", { "class": "link-action", "data-action": "nav.products" }, "\u2039 Keep shopping")));
    page.appendChild(PageHeader({ title: "Your bag", sub: "Items you\u2019re planning to buy \u2014 totals come from the store, and nothing is reserved yet." }));
    if (!spaRetailOpen()) {
      page.appendChild(UnavailableState({ title: "Online shopping isn\u2019t open yet", desc: "The shop is browse-only on this portal for now \u2014 nothing can be added to a bag or purchased online.", action: { variant: "btn--ghost", label: "Browse the shop", action: "nav.products", visualId: "cart-unavailable-shop" } }));
      return page;
    }
    var gate = spaGate({
      states: ["loading", "error", "unauthorized"],
      skeleton: function() {
        var w = h("div", { "data-state": "loading", "aria-busy": "true" });
        w.appendChild(skel2("height:220px;border-radius:24px"));
        w.appendChild(skel2("height:130px;border-radius:24px;margin-top:18px"));
        return w;
      },
      error: { title: "Couldn\u2019t load your bag", desc: "Your bag didn\u2019t load, so nothing is shown \u2014 we never show a stale bag. Nothing was changed; try again.", retryId: "cart" },
      scope: "your bag",
      backRoute: "products",
      unavailable: { title: "The bag isn\u2019t available right now", desc: "The store can\u2019t open your bag at the moment. Your items aren\u2019t lost \u2014 try again in a bit." }
    });
    if (gate) {
      page.appendChild(gate);
      return page;
    }
    var lines = spaCartLines();
    if (state.view === "empty" || lines.length === 0) {
      page.appendChild(h("div", { "class": "state-block", "data-module": "empty-state", "data-visual-id": "cart-empty", "data-state": "empty" }, [
        h("div", { "class": "state-block__glyph" }, "\u25A1"),
        h("div", { "class": "state-block__title" }, "Your bag is empty"),
        h("div", { "class": "state-block__desc" }, "Products you add from the shop will wait here. Adding something doesn\u2019t reserve it \u2014 stock is confirmed at checkout."),
        ActionButton({ variant: "btn--primary", label: "Browse the shop", action: "nav.products", visualId: "cart-empty-shop" })
      ]));
      return page;
    }
    var demo = state.spaCartDemo;
    var grid = h("div", { "class": "purch-grid" });
    var left = h("div", { "class": "appt-col" });
    var right = h("div", { "class": "appt-col" });
    if (demo === "stale-price") {
      left.appendChild(ConflictBanner({ noun: "bag", desc: "The store re-checked your items and a price changed. Load the latest bag before checking out \u2014 nothing was ordered.", retryId: "cart-quote" }));
    }
    var card = h("div", { "class": "card", "data-module": "cart-list", "data-visual-id": "cart-list", "data-state": demo !== "as-added" ? demo : void 0 }, [
      h("div", { "class": "card__head" }, [
        h("span", { "class": "card__title" }, "Items"),
        h("span", { style: "font-size:12px;color:var(--ink-3)", "data-bind": "cart.version" }, "kept in your account \u2014 not reserved")
      ])
    ]);
    var listWrap = h("div", { style: "padding:0 16px 8px" });
    lines.forEach(function(l, i) {
      listWrap.appendChild(cartLineRow(l, i));
    });
    card.appendChild(listWrap);
    left.appendChild(card);
    var totals = state.spaCart.displayTotals;
    var totalsCard = h("div", { "class": "card card--pad", "data-module": "cart-totals", "data-visual-id": "cart-totals" }, [
      h("div", { "class": "card__title" }, "Totals"),
      h("div", { "class": "money-rows" }, [
        h("div", { "class": "money-rows__row" }, [h("span", null, "Subtotal"), h("span", { "data-bind": "cart.displayTotals.subtotal" }, totals.subtotal)]),
        h("div", { "class": "money-rows__row" }, [h("span", null, "Tax"), h("span", { "data-bind": "cart.displayTotals.tax" }, totals.tax)]),
        h("div", { "class": "money-rows__row money-rows__row--total" }, [h("span", null, "Total"), h("span", { "data-bind": "cart.displayTotals.total" }, totals.total)])
      ]),
      demo === "stale-price" ? h("div", { "class": "purch-ful__note", "data-state": "stale" }, "Shown totals are the last confirmed ones \u2014 they update when you load the latest bag.") : null
    ]);
    right.appendChild(totalsCard);
    var ful = state.spaCart.fulfillment;
    right.appendChild(h("div", { "class": "card card--pad", "data-module": "cart-fulfillment", "data-visual-id": "cart-fulfillment" }, [
      h("div", { "class": "card__title" }, "How you\u2019ll get it"),
      h("div", { style: "font-weight:600;font-size:13.5px;margin-top:6px", "data-bind": "cart.fulfillment.label" }, ful.label),
      h("div", { style: "font-size:12.5px;color:var(--ink-2);margin-top:2px", "data-bind": "cart.fulfillment.detail" }, ful.detail),
      h("div", { "class": "purch-ful__note", style: "margin-top:10px" }, "Items in your bag aren\u2019t reserved \u2014 stock and prices are confirmed at checkout.")
    ]));
    var blocked = demo === "stale-price" || demo === "inventory-conflict";
    right.appendChild(h("div", { style: "display:flex;flex-direction:column;gap:8px" }, [
      ActionButton({ variant: "btn--primary", label: "Go to checkout", action: "checkout.start", id: "cart", lg: true, block: true, disabled: blocked, visualId: "cart-checkout" }),
      blocked ? h("div", { "class": "purch-ful__note", "data-state": demo }, demo === "stale-price" ? "Checkout opens after you load the latest prices." : "Checkout opens after the stock issue above is resolved.") : null
    ]));
    grid.appendChild(left);
    grid.appendChild(right);
    page.appendChild(grid);
    return page;
  }

  // app-templates/customer-portal/runtime/src/routes/SpaCatalogPage.js
  function offerCard(o) {
    var sellability = state.spaOfferDemo === "sellable" ? o.sellability : state.spaOfferDemo;
    var isPkg = o.kind === "PACKAGE";
    var canBuy = o.allowedActions.indexOf("purchase") !== -1;
    var card = h("div", { "class": "card card--pad offer-card", "data-module": "plan-offer-card", "data-visual-id": "plan-offer-card", "data-plan-offer-ref": o.ref, "data-offer-kind": o.kind, "data-state": sellability }, [
      h("div", { style: "display:flex;align-items:center;gap:9px;flex-wrap:wrap" }, [
        h("span", { "class": "kind-chip kind-chip--" + (isPkg ? "package" : "membership"), "data-bind": "planOffer.kind" }, isPkg ? "Package" : "Membership"),
        h("div", { style: "flex:1" }),
        h("span", { "class": "readonly-chip" }, "Published offer")
      ]),
      h("div", { "class": "plan-card__title", "data-bind": "planOffer.title" }, o.title),
      h("div", { "class": "offer-card__price", "data-bind": "planOffer.displayPrice" }, o.displayPrice),
      h("div", { style: "font-size:12.5px;color:var(--ink-2);margin-top:2px", "data-bind": "planOffer.termsSummary" }, o.termsSummary),
      h("ul", { "class": "offer-benefits", "data-bind": "planOffer.benefits" }, o.benefits.map(function(b) {
        return h("li", null, b);
      }))
    ]);
    if (sellability === "changed") {
      card.appendChild(h("div", { "class": "purch-row__attention", role: "alert", style: "margin-top:10px" }, F.spaCommerce.offerNotes.changed));
      card.appendChild(h("div", { style: "margin-top:10px" }, ActionButton({ variant: "btn--ghost", label: "Reload offer", action: "ui.retry", id: "plan-offers", visualId: "offer-reload" })));
    }
    if (sellability === "unavailable") card.appendChild(h("div", { "class": "purch-ful__note", "data-state": "unavailable", style: "margin-top:10px" }, F.spaCommerce.offerNotes.unavailable));
    card.appendChild(h("div", { style: "margin-top:12px" }, ActionButton({
      variant: "btn--primary",
      label: isPkg ? "Buy package" : "Join membership",
      action: "plan.purchase",
      id: o.ref,
      block: true,
      disabled: !canBuy || sellability !== "sellable",
      visualId: isPkg ? "offer-buy-package" : "offer-join-membership"
    })));
    card.appendChild(h("div", { style: "font-size:11.5px;color:var(--ink-3);margin-top:8px;text-align:center" }, "Checkout is a demonstration \u2014 no charge will be made."));
    return card;
  }
  function SpaCatalog() {
    var tab = state.route === "pricing" ? "pricing" : "services";
    var open = spaBookingOpen();
    var services = spaCatalogServices();
    var planOffers = spaPlanOffers();
    var liveView = state.config.dataMode === "live" ? state.moduleStatus.pricing || state.moduleStatus.services || "loading" : state.view;
    var page = h("section", { "class": "page", "data-route": state.route, "data-state": liveView, "data-visual-id": "spa-catalog", "data-module": "spa-catalog", "data-screen-label": "Services & prices (" + tab + ")" });
    page.appendChild(h("div", { "class": "section-head" }, [
      h("div", { "class": "section-head__title" }, "Services & prices"),
      h("div", { "class": "section-head__sub" }, "Every treatment with its live published price \u2014 at the studio or your place.")
    ]));
    page.appendChild(h("div", { "class": "spa-tabs" }, Tabs({
      items: [{ key: "services", label: "Treatments" }, { key: "pricing", label: "Prices & memberships" }],
      active: tab,
      action: "nav.go"
    })));
    var gate = routeStateBody({
      view: liveView,
      states: ["loading", "empty", "error"],
      skeleton: function() {
        return gridSkeleton("spa-svc-grid", 4, 170);
      },
      empty: {
        glyph: "\u25A3",
        title: "Nothing is published right now",
        desc: "No treatments or membership options are published in the catalog at the moment. They\u2019ll appear here the moment they are \u2014 nothing is estimated in the meantime.",
        action: { variant: "btn--ghost", label: "Contact support", action: "support.email", visualId: "catalog-empty-support" }
      },
      error: { title: "Couldn\u2019t load the catalog", desc: "Published treatments and prices didn\u2019t load, so no numbers are shown. Nothing was changed \u2014 try again.", retryId: tab }
    });
    if (gate) {
      page.appendChild(gate);
      return page;
    }
    if (tab === "services") {
      var grid = h("div", { "class": "spa-svc-grid", "data-module": "spa-service-list", "data-visual-id": "spa-service-list" });
      services.forEach(function(s) {
        grid.appendChild(h("div", { "class": "card card--pad spa-svc-card", "data-module": "spa-service-card", "data-visual-id": "spa-service-card", "data-product-code": s.code }, [
          h("div", { style: "font-weight:700;font-size:16px;letter-spacing:-.01em;overflow-wrap:anywhere", "data-bind": "pim.services[].name" }, s.name),
          h("div", { style: "font-size:13px;color:var(--ink-2);margin-top:4px;line-height:1.5", "data-bind": "pim.services[].shortDescription" }, s.shortDescription),
          h("div", { "class": "spa-svc-card__price" }, [
            h("b", { "data-bind": "pim.services[].displayPrice" }, s.displayPrice),
            s.interval ? h("span", { "data-bind": "pim.services[].interval" }, "/ " + s.interval) : null
          ]),
          h("div", { "class": "spa-svc-card__foot" }, [
            h("span", { "class": "code-chip", style: "margin-left:0", "data-bind": "pim.services[].code" }, s.code),
            open ? ActionButton({ variant: "btn--primary", label: "Book", action: "booking.open", id: s.code, visualId: "spa-svc-book" }) : h("span", { "class": "link-action", "data-action": "nav.go", "data-id": "pricing" }, "See in the price list \u203A")
          ])
        ]));
      });
      page.appendChild(grid);
      page.appendChild(h("div", { "class": "catalog-note" }, "Prices are shown exactly as published in the public catalog. Availability isn\u2019t shown on this page" + (open ? "." : ", and booking online isn\u2019t available yet.")));
    } else {
      var rates = h("div", { "class": "rates-card", "data-module": "spa-pricing-list", "data-visual-id": "spa-pricing-list" }, [
        h("div", { "class": "panel__title", style: "font-size:16px;padding:14px 0 6px" }, "Treatments")
      ]);
      services.forEach(function(s, i) {
        var pal = F.PAL[i % 4];
        rates.appendChild(h("div", { "class": "rate-row", "data-module": "spa-pricing-row", "data-visual-id": "spa-pricing-row", "data-product-code": s.code }, [
          h("div", { "class": "rate-row__icon", style: "background:" + pal[1] }, h("i", { style: "background:" + pal[0] })),
          h("div", { style: "flex:1;min-width:0" }, [
            h("div", { style: "font-weight:600;font-size:14px;overflow-wrap:anywhere", "data-bind": "pim.services[].name" }, s.name),
            h("div", { style: "font-size:12px;color:var(--ink-2)", "data-bind": "pim.services[].shortDescription" }, s.shortDescription)
          ]),
          h("div", { style: "font-weight:700;font-size:15px;white-space:nowrap", "data-bind": "pim.services[].displayPrice" }, s.displayPrice + (s.interval ? " / " + s.interval : ""))
        ]));
      });
      page.appendChild(rates);
      var sellOpen = spaPlanSellOpen();
      if (sellOpen) {
        var offers = h("div", { style: "margin-top:18px", "data-module": "membership-options", "data-visual-id": "membership-options", "data-plan-commerce": "open" }, [
          h("div", { "class": "list-panel__head", style: "padding:0 2px 10px" }, [
            h("div", { "class": "list-panel__title", style: "flex:1" }, "Membership & package options"),
            h("span", { style: "font-size:12px;color:var(--ink-3)" }, "public offers from the catalog")
          ])
        ]);
        var ogrid = h("div", { "class": "offer-grid", "data-module": "plan-offer-list", "data-visual-id": "plan-offer-list" });
        planOffers.forEach(function(o) {
          ogrid.appendChild(offerCard(o));
        });
        offers.appendChild(ogrid);
        offers.appendChild(h("div", { "class": "catalog-note", style: "margin-top:12px" }, [
          "These are published offers with their exact recorded price and terms \u2014 not your plan or a balance. Already have one? ",
          h("span", { "class": "link-action", "data-action": "account.openPlan" }, "Open My plan \u203A")
        ]));
        page.appendChild(offers);
      } else {
        var mem = h("div", { "class": "list-panel", style: "margin-top:18px", "data-module": "membership-options", "data-visual-id": "membership-options", "data-plan-commerce": "closed" }, [
          h("div", { "class": "list-panel__head" }, [
            h("div", { "class": "list-panel__title", style: "flex:1" }, "Membership options"),
            h("span", { style: "font-size:12px;color:var(--ink-3)" }, "public offers from the catalog")
          ])
        ]);
        planOffers.filter(function(offer) {
          return offer.kind === "MEMBERSHIP";
        }).forEach(function(offer) {
          var m = { code: offer.productCode || offer.ref, name: offer.title, shortDescription: offer.termsSummary, displayPrice: offer.displayPrice, interval: "" };
          mem.appendChild(h("div", { "class": "rate-row", "data-module": "spa-pricing-row", "data-visual-id": "spa-pricing-row", "data-product-code": m.code }, [
            h("div", { style: "flex:1;min-width:0" }, [
              h("div", { style: "font-weight:600;font-size:14px", "data-bind": "pim.memberships[].name" }, m.name),
              h("div", { style: "font-size:12px;color:var(--ink-2)", "data-bind": "pim.memberships[].shortDescription" }, m.shortDescription)
            ]),
            h("div", { style: "font-weight:700;font-size:15px;white-space:nowrap", "data-bind": "pim.memberships[].displayPrice" }, m.displayPrice + (m.interval ? " / " + m.interval : ""))
          ]));
        });
        mem.appendChild(h("div", { "class": "catalog-note", style: "margin-top:10px" }, [
          "These are published offers \u2014 not your membership or a balance. Joining or managing a plan happens with our team. ",
          h("span", { "class": "link-action", "data-action": "support.email" }, "Ask about membership \u203A")
        ]));
        page.appendChild(mem);
      }
      page.appendChild(h("div", { "class": "catalog-note" }, "Every price on this page comes verbatim from the public catalog \u2014 nothing is calculated, estimated or compared here."));
    }
    return page;
  }

  // app-templates/customer-portal/runtime/src/routes/SpaCheckoutPage.js
  function quoteSource() {
    if (state.spaCheckoutSource === "plan") {
      if (state.config.dataMode === "live") {
        var offer = spaPlanOffers().find(function(item) {
          return item.ref === state.spaPlanOffer;
        });
        if (!offer) return null;
        return {
          lines: [{ ref: "line-" + offer.ref, title: offer.title, variant: null, qty: 1, displayUnitPrice: offer.displayPrice, displayTotal: offer.displayPrice }],
          displayTotals: { subtotal: offer.displayPrice, tax: "$0.00", total: offer.displayPrice },
          recurringNote: offer.kind === "MEMBERSHIP" ? offer.termsSummary : null
        };
      }
      return F.spaCommerce.checkout.planQuotes[state.spaPlanOffer || "off-pkg-4c21"] || F.spaCommerce.checkout.planQuote;
    }
    var cart = state.spaCart;
    return cart && cart.lines.length ? { lines: cart.lines, displayTotals: cart.displayTotals } : null;
  }
  function Confirmation(res) {
    var card = h("div", { "class": "card card--pad co-confirm", "data-module": "spa-confirmation", "data-visual-id": "spa-confirmation", "data-state": "confirmed", "data-result-kind": res.kind }, [
      h("div", { "class": "co-confirm__glyph" }, "\u2713"),
      h("div", { "class": "co-confirm__title", "data-bind": "result.headline" }, res.headline),
      h("div", { "class": "co-confirm__sub", "data-bind": "result.sub" }, res.sub),
      SimulationBadge(true)
    ]);
    var facts = h("div", { "class": "appt-details", style: "margin-top:14px;text-align:left" });
    if (res.purchase) {
      facts.appendChild(h("div", { "class": "appt-details__row" }, [
        h("div", { "class": "appt-details__label" }, "Purchase"),
        h("div", { "class": "appt-details__val" }, [
          h("b", { "data-bind": "result.purchase.reference" }, res.purchase.reference),
          " \xB7 ",
          h("span", { "class": "link-action", "data-action": "purchase.open", "data-id": res.purchase.ref, "data-purchase-ref": res.purchase.ref }, "view purchase \u203A")
        ])
      ]));
    }
    if (res.appointment) {
      facts.appendChild(h("div", { "class": "appt-details__row" }, [
        h("div", { "class": "appt-details__label" }, "Visit"),
        h("div", { "class": "appt-details__val" }, [
          h("b", { "data-bind": "result.appointment.service" }, res.appointment.service),
          " \xB7 " + res.appointment.start + " \xB7 ",
          h("span", { "class": "link-action", "data-action": "purchase.openAppointment", "data-id": res.appointment.ref, "data-appointment-ref": res.appointment.ref }, "see appointments \u203A")
        ])
      ]));
    }
    if (res.plan) {
      facts.appendChild(h("div", { "class": "appt-details__row" }, [
        h("div", { "class": "appt-details__label" }, "Plan"),
        h("div", { "class": "appt-details__val" }, [
          h("b", { "data-bind": "result.plan.title" }, res.plan.title),
          " \xB7 " + res.plan.status + " \xB7 ",
          h("span", { "class": "link-action", "data-action": "account.openPlan" }, "open My plan \u203A")
        ])
      ]));
    }
    if (res.fulfillment) {
      facts.appendChild(h("div", { "class": "appt-details__row" }, [
        h("div", { "class": "appt-details__label" }, "Pickup"),
        h("div", { "class": "appt-details__val", "data-bind": "result.fulfillment" }, res.fulfillment)
      ]));
    }
    card.appendChild(facts);
    card.appendChild(h("div", { "class": "appt-hero__actions", style: "justify-content:center" }, [
      ActionButton({ variant: "btn--primary", label: "All purchases", action: "account.openPurchases", visualId: "confirm-purchases" }),
      ActionButton({ variant: "btn--ghost", label: "Back to appointments", action: "nav.go", id: "orders.list", visualId: "confirm-home" })
    ]));
    return card;
  }
  function SpaCheckout() {
    var demo = state.spaCheckoutDemo;
    var res = state.spaResult;
    var page = h("section", { "class": "page", "data-route": "checkout", "data-state": res ? "confirmed" : state.view !== "ready" ? state.view : demo, "data-visual-id": "spa-checkout", "data-module": "spa-checkout", "data-capability": spaCapability(), "data-checkout-ref": F.spaCommerce.checkout.ref, "data-payment-mode": "SIMULATED", "data-screen-label": "Checkout (simulated)" });
    if (res) {
      page.appendChild(h("div", { style: "max-width:560px;margin:26px auto 0" }, Confirmation(res)));
      return page;
    }
    page.appendChild(h("div", { "class": "detail-back" }, h("span", { "class": "link-action", "data-action": state.spaCheckoutSource === "cart" ? "cart.open" : "account.openPlan" }, state.spaCheckoutSource === "cart" ? "\u2039 Back to your bag" : "\u2039 Back")));
    page.appendChild(PageHeader({ title: "Review & confirm", sub: "Check everything below \u2014 nothing is ordered until you confirm." }));
    if (!spaRetailOpen() && state.spaCheckoutSource === "cart") {
      page.appendChild(UnavailableState({ title: "Checkout isn\u2019t open yet", desc: "Online purchasing isn\u2019t enabled on this portal. Nothing can be ordered here yet.", action: { variant: "btn--ghost", label: "Browse the shop", action: "nav.products", visualId: "co-unavailable-shop" } }));
      return page;
    }
    var gate = spaGate({
      states: ["loading", "error", "unauthorized"],
      skeleton: function() {
        var w = h("div", { "data-state": "loading", "aria-busy": "true" });
        w.appendChild(skel2("height:320px;border-radius:24px"));
        return w;
      },
      error: { title: "Couldn\u2019t prepare your checkout", desc: "The review didn\u2019t load, so nothing is shown and nothing was ordered. Try again.", retryId: "checkout" },
      scope: "checkout",
      backRoute: "cart",
      unavailable: { title: "Checkout isn\u2019t available right now", desc: "The store can\u2019t take orders at the moment. Your bag is safe \u2014 nothing was ordered." }
    });
    if (gate) {
      page.appendChild(gate);
      return page;
    }
    var q = quoteSource();
    if (!q) {
      page.appendChild(UnavailableState({ title: "There\u2019s nothing to check out", desc: "Your bag is empty, so there\u2019s nothing to review here.", action: { variant: "btn--ghost", label: "Browse the shop", action: "nav.products", visualId: "co-empty-shop" } }));
      return page;
    }
    var co = F.spaCommerce.checkout;
    var key = "checkout.confirm:" + co.ref;
    var phase = cmdPhase(key);
    var blocked = demo !== "ready";
    var contact = currentContact();
    var grid = h("div", { "class": "purch-grid" });
    var left = h("div", { "class": "appt-col" });
    var right = h("div", { "class": "appt-col" });
    if (demo === "repriced") left.appendChild(ConflictBanner({ noun: "quote", desc: "Prices changed while you were reviewing. Load the latest quote and check the new totals \u2014 nothing was ordered.", retryId: "checkout-quote" }));
    if (demo === "inventory-conflict") left.appendChild(ConflictBanner({ noun: "quote", desc: "Something in your order just went out of stock. Go back to your bag to fix it \u2014 nothing was ordered.", retryId: "checkout-quote" }));
    if (demo === "slot-expired") left.appendChild(ConflictBanner({ noun: "held time", desc: "Your held appointment time expired during review. Pick a new time to continue \u2014 nothing was booked or ordered.", retryId: "checkout-quote" }));
    left.appendChild(h("div", { "class": "card card--pad", "data-module": "checkout-contact", "data-visual-id": "checkout-contact" }, [
      h("div", { "class": "card__title" }, "Contact"),
      h("div", { "class": "co-contact" }, [
        h("div", { "data-bind": "session.displayName" }, F.customer.fullName),
        h("div", { style: "color:var(--ink-2)", "data-bind": "profile.email,profile.phone" }, contact.email + " \xB7 " + contact.phone)
      ]),
      h("div", { "class": "purch-ful__note" }, "We use these only to tell you about this order.")
    ]));
    var fulCard = h("div", { "class": "card card--pad", "data-module": "checkout-fulfillment", "data-visual-id": "checkout-fulfillment" }, [h("div", { "class": "card__title" }, "How you\u2019ll get it")]);
    co.fulfillmentOptions.forEach(function(o) {
      fulCard.appendChild(h("label", { "class": "co-ful" + (o.ref === "ful-pickup" ? " co-ful--on" : ""), "data-action": "checkout.selectFulfillment", "data-id": o.ref, "data-fulfillment-ref": o.ref, "data-state": "active" }, [
        h("i", { "class": "co-ful__dot" }),
        h("div", { style: "flex:1;min-width:0" }, [
          h("div", { style: "font-weight:600;font-size:13.5px", "data-bind": "checkout.fulfillment.label" }, o.label),
          h("div", { style: "font-size:12px;color:var(--ink-3)", "data-bind": "checkout.fulfillment.detail" }, o.detail)
        ])
      ]));
    });
    fulCard.appendChild(h("div", { "class": "purch-ful__note" }, co.fulfillmentNote));
    left.appendChild(fulCard);
    var linesCard = h("div", { "class": "card card--pad", "data-module": "checkout-lines", "data-visual-id": "checkout-lines" }, [h("div", { "class": "card__title" }, "Your order")]);
    q.lines.forEach(function(l) {
      linesCard.appendChild(h("div", { "class": "co-line", "data-line-ref": l.ref }, [
        h("span", { style: "flex:1;min-width:0", "data-bind": "checkout.lines[].title" }, l.title + (l.variant ? " \xB7 " + l.variant : "") + " \xD7 " + l.qty),
        h("b", { "data-bind": "checkout.lines[].displayTotal" }, l.displayTotal)
      ]));
    });
    linesCard.appendChild(h("div", { "class": "purch-ful__note" }, co.expiresNote));
    if (q.recurringNote) linesCard.appendChild(h("div", { "class": "purch-row__attention", "data-bind": "checkout.recurringNote", role: "note", style: "margin-top:8px" }, q.recurringNote));
    left.appendChild(linesCard);
    var t = q.displayTotals;
    var payCard = h("div", { "class": "card card--pad", "data-module": "checkout-payment", "data-visual-id": "checkout-payment", "data-payment-mode": "SIMULATED" }, [
      h("div", { "class": "card__title" }, "Totals & confirmation"),
      h("div", { "class": "money-rows" }, [
        h("div", { "class": "money-rows__row" }, [h("span", null, "Subtotal"), h("span", { "data-bind": "checkout.displayTotals.subtotal" }, t.subtotal)]),
        h("div", { "class": "money-rows__row" }, [h("span", null, "Tax"), h("span", { "data-bind": "checkout.displayTotals.tax" }, t.tax)]),
        h("div", { "class": "money-rows__row money-rows__row--total" }, [h("span", null, "Total"), h("span", { "data-bind": "checkout.displayTotals.total" }, t.total)])
      ]),
      SimulationBadge(true),
      h("div", { "class": "purch-ful__note" }, "This is a demonstration checkout: confirming records your order without any payment. There\u2019s nothing to enter \u2014 no card, no charge, no receipt."),
      h("label", { "class": "co-policy", "data-module": "policy-ack", "data-visual-id": "policy-ack", "data-state": state.spaPolicyAck ? "acked" : "required" }, [
        h("button", { "class": "co-policy__box" + (state.spaPolicyAck ? " co-policy__box--on" : ""), "data-action": "checkout.ackPolicy", role: "checkbox", "aria-checked": state.spaPolicyAck ? "true" : "false" }, state.spaPolicyAck ? "\u2713" : ""),
        h("span", { "data-bind": "checkout.policy" }, co.policy)
      ])
    ]);
    if (phase === "failed") payCard.appendChild(InlineFailure({
      msg: "Your order wasn\u2019t confirmed \u2014 nothing was created. You can try again.",
      retryAction: "checkout.retryConfirm",
      retryId: co.ref,
      retryLabel: "Try confirming again"
    }));
    if (phase === "conflict") payCard.appendChild(InlineFailure({
      msg: "The quote changed at the last moment \u2014 reload it and review before confirming. Nothing was ordered.",
      retryAction: "ui.retry",
      retryId: key,
      retryLabel: "Reload quote"
    }));
    payCard.appendChild(h("div", { style: "margin-top:12px" }, ActionButton({
      variant: "btn--primary",
      label: "Confirm order",
      action: "checkout.confirm",
      id: co.ref,
      block: true,
      lg: true,
      pending: phase === "pending",
      pendingLabel: "Confirming\u2026",
      disabled: blocked || !state.spaPolicyAck || phase === "conflict",
      visualId: "checkout-confirm"
    })));
    if (!state.spaPolicyAck && !blocked) payCard.appendChild(h("div", { style: "font-size:11.5px;color:var(--ink-3);margin-top:7px;text-align:center" }, "Tick the box above to confirm"));
    right.appendChild(payCard);
    grid.appendChild(left);
    grid.appendChild(right);
    page.appendChild(grid);
    return page;
  }

  // app-templates/customer-portal/runtime/src/routes/SpaOrdersPage.js
  function SpaOrders() {
    var liveEnvelope = state.config.dataMode === "live" ? state.moduleData.orders : null;
    var routeState = liveEnvelope && liveEnvelope.state || state.moduleStatus.orders || state.view;
    var page = h("section", { "class": "page", "data-route": "orders.list", "data-state": routeState, "data-visual-id": "spa-orders", "data-capability": "current-staging", "data-screen-label": "Orders (current staging)" });
    page.appendChild(PageHeader({ title: spaCustomer().greeting, sub: "Here\u2019s what\u2019s on your account." }));
    var gate = routeStateBody({
      states: ["error", "unauthorized"],
      error: { title: "Couldn\u2019t load your orders", desc: "Your orders didn\u2019t load, so nothing is shown \u2014 we never show stale records. Nothing was changed; try again.", retryId: "orders" },
      scope: "your orders",
      backRoute: "services"
    });
    if (gate) {
      page.appendChild(gate);
      return page;
    }
    var card = h("div", { "class": "card", "data-module": "spa-order-list", "data-visual-id": "spa-order-list" });
    card.appendChild(h("div", { "class": "card__head" }, [
      h("span", { "class": "card__title" }, "Your orders"),
      h("span", { "class": "readonly-chip" }, "Read-only")
    ]));
    var listWrap = h("div", { "class": "order-list" });
    var fixtureRows = state.spaRows === "one" ? F.spa.stagingOrders.slice(0, 1) : F.spa.stagingOrders;
    var rows = liveEnvelope && Array.isArray(liveEnvelope.items) ? liveEnvelope.items.map(liveOrder) : fixtureRows;
    if (routeState === "loading") {
      for (var i = 0; i < 3; i++) listWrap.appendChild(skeletonRow());
    } else if (routeState === "empty" || rows.length === 0) {
      listWrap.appendChild(EmptyState({
        glyph: "\u25CE",
        title: "No orders on your account yet",
        desc: "Anything recorded on your account will appear here, exactly as our records show it.",
        action: { variant: "btn--ghost", label: "Browse services", action: "nav.go", id: "services", visualId: "orders-empty-browse" }
      }));
    } else {
      rows.forEach(function(o, i2) {
        var pal = F.PAL[i2 % 4];
        listWrap.appendChild(h("article", { "class": "spa-order-row", "data-module": "spa-order-row", "data-visual-id": "spa-order-row", "data-order-ref": o.ref }, [
          h("div", { "class": "order-card__icon", style: "background:" + pal[1] }, h("i", { style: "background:" + pal[0] })),
          h("div", { "class": "spa-order-row__body" }, [
            h("div", { "class": "order-card__name", "data-bind": "order.typeLabel" }, o.typeLabel),
            h("div", { "class": "order-card__meta" }, [
              h("span", { "data-bind": "order.reference" }, "Reference " + o.ref),
              h("span", { "class": "code-chip", "data-bind": "order.typeCode" }, o.typeCode)
            ])
          ]),
          StatusBadge({ variant: "status-badge--unmapped", label: o.status, bind: "order.rawStatus", state: "unmapped" }),
          h("div", { "class": "spa-order-row__amount" }, [
            h("b", { "data-bind": "order.displayTotal" }, o.total),
            h("span", { "data-bind": "order.currency" }, o.currency)
          ])
        ]));
      });
    }
    card.appendChild(listWrap);
    card.appendChild(h("div", { "class": "card__footnote" }, "Statuses and amounts appear exactly as recorded on your account \u2014 this view is read-only. Scheduling details and online changes aren\u2019t part of these records."));
    page.appendChild(card);
    return page;
  }
  function liveOrder(order) {
    var currency = order.currency && order.currency.code || "";
    var total = Number.isFinite(order.grandTotal) ? new Intl.NumberFormat("en", { style: "currency", currency: currency || "USD" }).format(order.grandTotal) : "\u2014";
    return {
      ref: String(order.id),
      typeLabel: order.type && order.type.label || order.type && order.type.code || "Order",
      typeCode: order.type && order.type.code || "ORDER",
      status: order.statusCode || "UNMAPPED",
      total,
      currency
    };
  }

  // app-templates/customer-portal/runtime/src/routes/SpaPlanPage.js
  function usageMeter(p) {
    if (p.remainingUses == null || p.totalUses == null) return null;
    var pct = p.totalUses ? Math.round(p.remainingUses / p.totalUses * 100) : 0;
    return h("div", { "class": "plan-meter", "data-module": "plan-usage", "data-visual-id": "plan-usage", "data-bind": "plan.remainingUses,plan.totalUses" }, [
      h("div", { "class": "plan-meter__bar" }, h("i", { style: "width:" + pct + "%" })),
      h("div", { "class": "plan-meter__label" }, [h("b", null, String(p.remainingUses)), " of " + p.totalUses + " visits left"])
    ]);
  }
  function planCard(p) {
    var isPkg = p.kind === "PACKAGE";
    var cKey = "plan.cancelRenewal:" + p.ref;
    var phase = cmdPhase(cKey);
    var badge = F.spaCommerce.plans.statusBadges[p.status] || "status-badge--scheduled";
    var card = h("div", { "class": "card card--pad plan-card", "data-module": "plan-card", "data-visual-id": "plan-card", "data-plan-ref": p.ref, "data-plan-kind": p.kind, "data-state": p.status === "Used up" ? "exhausted" : void 0 }, [
      h("div", { style: "display:flex;align-items:center;gap:9px;flex-wrap:wrap" }, [
        h("span", { "class": "kind-chip kind-chip--" + (isPkg ? "package" : "membership"), "data-bind": "plan.kind" }, isPkg ? "Package" : "Membership"),
        h("div", { style: "flex:1" }),
        StatusBadge({ variant: badge, label: p.status, bind: "plan.status" })
      ]),
      h("div", { "class": "plan-card__title", "data-bind": "plan.title" }, p.title),
      usageMeter(p)
    ]);
    var facts = h("div", { "class": "appt-details" });
    if (p.renewsAt) facts.appendChild(factRow("Renews", p.renewsAt, "plan.renewsAt"));
    if (p.expiresAt) facts.appendChild(factRow(p.status === "Cancelled" ? "Ends" : "Expires", p.expiresAt, "plan.expiresAt"));
    if (p.displayRecurringPrice) facts.appendChild(factRow("Price", p.displayRecurringPrice, "plan.displayRecurringPrice"));
    if (facts.childNodes.length) card.appendChild(facts);
    if (p.attention) card.appendChild(h("div", { "class": "purch-row__attention", "data-bind": "plan.attention", role: "note", style: "margin-top:10px" }, p.attention));
    if (p.note) card.appendChild(h("div", { "class": "purch-ful__note", style: "margin-top:10px" }, p.note));
    var actions = h("div", { "class": "appt-hero__actions" });
    if (p.allowedActions.indexOf("bookWithCredit") !== -1) {
      var bookOpen = spaBookingOpen();
      actions.appendChild(ActionButton({ variant: "btn--primary", label: "Book with a credit", action: "plan.bookWithCredit", id: p.ref, disabled: !bookOpen, visualId: "plan-book-credit" }));
      if (!bookOpen) card.appendChild(h("div", { "class": "purch-ful__note", "data-state": "unavailable", style: "margin-top:10px" }, "Online booking isn\u2019t available yet \u2014 the studio books credit visits for you."));
    }
    if (p.allowedActions.indexOf("cancelRenewal") !== -1) {
      if (phase === "failed") card.appendChild(h("div", { style: "margin-top:10px" }, InlineFailure({ msg: "Renewal wasn\u2019t cancelled \u2014 your membership is unchanged.", retryAction: "plan.cancelRenewal", retryId: p.ref, retryLabel: "Try again" })));
      if (phase === "conflict") card.appendChild(h("div", { style: "margin-top:10px" }, InlineFailure({ msg: "Your plan changed since you opened it \u2014 reload before making changes.", retryAction: "ui.retry", retryId: cKey, retryLabel: "Reload" })));
      actions.appendChild(ActionButton({ variant: "btn--ghost", label: "Cancel renewal", action: "plan.cancelRenewal", id: p.ref, confirm: true, pending: phase === "pending", pendingLabel: "Cancelling\u2026", disabled: phase === "conflict", visualId: "plan-cancel-renewal" }));
    }
    if (p.status === "Used up") {
      actions.appendChild(ActionButton({ variant: "btn--primary", label: "Buy this package again", action: "checkout.start", id: "plan", visualId: "plan-buy-again" }));
    }
    if (actions.childNodes.length) card.appendChild(actions);
    return card;
  }
  function factRow(label, val, bind) {
    return h("div", { "class": "appt-details__row" }, [
      h("div", { "class": "appt-details__label" }, label),
      h("div", { "class": "appt-details__val", "data-bind": bind }, h("b", null, val))
    ]);
  }
  function SpaPlan() {
    var page = h("section", { "class": "page", "data-route": "plan", "data-state": state.view, "data-visual-id": "spa-plan", "data-module": "spa-plan", "data-capability": spaCapability(), "data-screen-label": "My plan" });
    page.appendChild(h("div", { "class": "detail-back" }, h("span", { "class": "link-action", "data-action": "account.open" }, "\u2039 Account")));
    page.appendChild(PageHeader({ title: "My plan", sub: "Your packages and membership \u2014 balances and renewal, exactly as recorded." }));
    if (spaCurrentApiDemoOpen()) {
      page.appendChild(h("div", { "class": "state-block", "data-module": "unavailable-state", "data-visual-id": "plan-current-api-unavailable", "data-state": "unavailable" }, [
        h("div", { "class": "state-block__glyph" }, "\u2740"),
        h("div", { "class": "state-block__title" }, "Personal plan details aren\u2019t in the current API"),
        h("div", { "class": "state-block__desc" }, "You can order a published package or membership now. The resulting Core Order appears in Purchases, but visit balances and renewal controls need a customer entitlement API."),
        ActionButton({ variant: "btn--primary", label: "See membership options", action: "nav.go", id: "pricing", visualId: "plan-current-api-options" })
      ]));
      return page;
    }
    var gate = spaGate({
      states: ["loading", "error", "unauthorized"],
      skeleton: function() {
        var w = h("div", { "class": "plan-grid", "data-state": "loading", "aria-busy": "true" });
        w.appendChild(skel2("height:220px;border-radius:24px"));
        w.appendChild(skel2("height:220px;border-radius:24px"));
        return w;
      },
      error: { title: "Couldn\u2019t load your plan", desc: "Your plan didn\u2019t load, so no balance is shown \u2014 we never guess remaining visits. Nothing was changed; try again.", retryId: "plan" },
      scope: "your plan",
      backRoute: "account",
      unavailable: {
        title: "My plan isn\u2019t available yet",
        desc: "Plan balances aren\u2019t connected on this portal yet. Published membership options are in Services & prices.",
        action: { variant: "btn--ghost", label: "Membership options", action: "nav.go", id: "pricing", visualId: "plan-unavailable-options" }
      }
    });
    if (gate) {
      page.appendChild(gate);
      return page;
    }
    var plans = state.view === "empty" ? [] : spaPlans();
    if (!plans.length) {
      page.appendChild(h("div", { "class": "state-block", "data-module": "empty-state", "data-visual-id": "plan-empty", "data-state": "empty" }, [
        h("div", { "class": "state-block__glyph" }, "\u2740"),
        h("div", { "class": "state-block__title" }, "You don\u2019t have a plan yet"),
        h("div", { "class": "state-block__desc" }, "Packages and membership you buy will live here with their balance and renewal. The published options are in the catalog."),
        ActionButton({ variant: "btn--primary", label: "See membership options", action: "nav.go", id: "pricing", visualId: "plan-empty-options" })
      ]));
      return page;
    }
    var grid = h("div", { "class": "plan-grid", "data-module": "plan-list", "data-visual-id": "plan-list" });
    plans.forEach(function(p) {
      grid.appendChild(planCard(p));
    });
    page.appendChild(grid);
    page.appendChild(h("div", { "class": "catalog-note" }, "Balances, renewal dates and prices are shown exactly as recorded on your plan \u2014 this page never estimates or projects them."));
    return page;
  }

  // app-templates/customer-portal/runtime/src/routes/SpaPurchaseDetailPage.js
  function lineRow(l, d) {
    var retState = state.spaReturns[l.ref];
    var phase = cmdPhase("purchase.returnRequest:" + l.ref);
    var canReturn = l.returnable && d.allowedActions.indexOf("returnRequest") !== -1 && !retState;
    return h("div", { "class": "purch-line", "data-module": "purchase-line", "data-visual-id": "purchase-line", "data-line-ref": l.ref, "data-state": retState ? "return-" + retState : phase !== "idle" ? phase : void 0 }, [
      h("div", { style: "flex:1;min-width:0" }, [
        h("div", { "class": "purch-line__title", "data-bind": "purchase.lines[].title" }, l.title + (l.variant ? " \xB7 " + l.variant : "")),
        h("div", { "class": "purch-line__meta", "data-bind": "purchase.lines[].quantity,purchase.lines[].displayUnitPrice" }, l.quantity + " \xD7 " + l.displayUnitPrice),
        retState === "accepted-for-review" ? h("div", { "class": "purch-line__note", "data-state": "accepted-for-review" }, "Return requested \u2014 accepted for review. We\u2019ll confirm the next step; nothing is refunded or promised yet.") : null,
        phase === "failed" ? InlineFailure({ msg: "Your return request didn\u2019t go through \u2014 nothing was requested.", retryAction: "purchase.returnRequest", retryId: l.ref, retryLabel: "Try again" }) : null,
        phase === "conflict" ? InlineFailure({ msg: "This order changed since you opened it \u2014 reload before requesting a return.", retryAction: "ui.retry", retryId: "purchase.returnRequest:" + l.ref, retryLabel: "Reload" }) : null
      ]),
      h("div", { "class": "purch-line__side" }, [
        h("b", { "data-bind": "purchase.lines[].displayTotal" }, l.displayTotal),
        canReturn ? ActionButton({ variant: "btn--ghost", label: "Request return", action: "purchase.returnRequest", id: l.ref, pending: phase === "pending", pendingLabel: "Requesting\u2026", visualId: "line-return-request" }) : null
      ])
    ]);
  }
  function linesBlock(d) {
    var wrap = h("div", { "class": "purch-lines", "data-module": "purchase-lines", "data-visual-id": "purchase-lines" });
    if (d.groups) {
      d.groups.forEach(function(g) {
        wrap.appendChild(h("div", { "class": "purch-lines__group" }, g.label));
        g.lines.forEach(function(ref) {
          var l = d.lines.find(function(x) {
            return x.ref === ref;
          });
          if (l) wrap.appendChild(lineRow(l, d));
        });
      });
    } else {
      d.lines.forEach(function(l) {
        wrap.appendChild(lineRow(l, d));
      });
    }
    return wrap;
  }
  function SpaPurchaseDetail() {
    var d = currentPurchase();
    var page = h("section", { "class": "page", "data-route": "purchase.detail", "data-state": state.view, "data-visual-id": "spa-purchase-detail", "data-module": "spa-purchase-detail", "data-capability": spaCapability(), "data-purchase-ref": d ? d.ref : void 0, "data-screen-label": "Purchase detail" });
    page.appendChild(h("div", { "class": "detail-back" }, h("span", { "class": "link-action", "data-action": "account.openPurchases" }, "\u2039 All purchases")));
    var gate = spaGate({
      states: ["loading", "error", "unauthorized"],
      skeleton: function() {
        var w = h("div", { "data-state": "loading", "aria-busy": "true" });
        w.appendChild(skel2("height:200px;border-radius:24px"));
        w.appendChild(skel2("height:140px;border-radius:24px;margin-top:18px"));
        return w;
      },
      error: { title: "Couldn\u2019t load this purchase", desc: "This purchase didn\u2019t load, so nothing is shown \u2014 we never show stale records. Nothing was changed; try again.", retryId: "purchase" },
      scope: "this purchase",
      backRoute: "purchases.list",
      notFound: { noun: "purchase", backLabel: "purchases", backRoute: "purchases.list" },
      unavailable: { title: "Purchase details aren\u2019t available yet", desc: "The detailed view isn\u2019t connected on this portal yet. Your purchase list still shows current states." }
    });
    if (gate) {
      page.appendChild(gate);
      return page;
    }
    if (!d) {
      page.appendChild(NotFoundState({ noun: "purchase", backLabel: "purchases", backRoute: "purchases.list" }));
      return page;
    }
    var cancelState = state.spaCancelReqs[d.ref];
    var cPhase = cmdPhase("purchase.cancelRequest:" + d.ref);
    var bPhase = cmdPhase("purchase.buyAgain:" + d.ref);
    var head2 = h("div", { "class": "card card--pad purch-head", "data-module": "purchase-summary", "data-visual-id": "purchase-summary", "data-purchase-ref": d.ref }, [
      h("div", { style: "display:flex;align-items:center;gap:9px;flex-wrap:wrap" }, [
        h("div", { "class": "card__title", style: "flex:1" }, "Purchase"),
        KindChip(d.kind),
        purchaseStatusBadge(d.customerStatus)
      ]),
      h("div", { "class": "purch-head__ref", "data-bind": "purchase.reference" }, d.reference),
      h("div", { "class": "purch-head__meta" }, [
        h("span", { "data-bind": "purchase.placedAt" }, "Placed " + d.placedAt),
        h("span", { "class": "purch-head__dot" }, "\xB7"),
        h("span", { "data-bind": "purchase.displayTotal" }, d.money.total + " " + d.money.currency)
      ]),
      cancelState === "accepted-for-review" ? h(
        "div",
        { "class": "purch-line__note", "data-state": "accepted-for-review", style: "margin-top:10px" },
        "Cancellation requested \u2014 accepted for review. The order stays as shown until the studio confirms; nothing is undone yet."
      ) : null
    ]);
    page.appendChild(head2);
    var grid = h("div", { "class": "purch-grid" });
    var left = h("div", { "class": "appt-col" });
    var right = h("div", { "class": "appt-col" });
    var itemsCard = h("div", { "class": "card card--pad", "data-module": "purchase-items", "data-visual-id": "purchase-items" }, [
      h("div", { "class": "card__title" }, "Items"),
      d.lines && d.lines.length ? linesBlock(d) : h("div", { "class": "purch-ful__note", "data-state": "unavailable" }, "Line items are not returned by the current Core Order API. The recorded total and raw state are shown without guessing the contents.")
    ]);
    left.appendChild(itemsCard);
    var totalsCard = h("div", { "class": "card card--pad", "data-module": "purchase-totals", "data-visual-id": "purchase-totals" }, [
      h("div", { "class": "card__title" }, "Totals"),
      MoneyRows(d.money),
      h("div", { "class": "purch-paynote" }, [SimulationBadge(), h("span", { "class": "purch-paynote__txt" }, "Totals are recorded amounts \u2014 no payment was taken through this portal.")])
    ]);
    right.appendChild(totalsCard);
    if (d.fulfillment) {
      right.appendChild(h("div", { "class": "card card--pad", "data-module": "purchase-fulfillment", "data-visual-id": "purchase-fulfillment", "data-state": void 0 }, [
        h("div", { style: "display:flex;align-items:center;gap:9px" }, [
          h("div", { "class": "card__title", style: "flex:1" }, d.fulfillment.kind === "PICKUP" ? "Pickup" : d.fulfillment.kind === "ENTITLEMENT" ? "Your plan credit" : "Fulfillment"),
          StatusBadge({ variant: "status-badge--scheduled", label: d.fulfillment.status, bind: "purchase.fulfillment.status" })
        ]),
        d.fulfillment.pickupWindow ? h("div", { "class": "purch-ful__row", "data-bind": "purchase.fulfillment.pickupWindow" }, d.fulfillment.pickupWindow) : null,
        d.fulfillment.note ? h("div", { "class": "purch-ful__note" }, d.fulfillment.note) : null
      ]));
    }
    if (d.relatedAppointments && d.relatedAppointments.length) {
      var ap = h("div", { "class": "card card--pad", "data-module": "purchase-appointments", "data-visual-id": "purchase-appointments" }, [h("div", { "class": "card__title" }, "Appointment")]);
      d.relatedAppointments.forEach(function(a) {
        ap.appendChild(h("div", { "class": "purch-appt", "data-appointment-ref": a.ref }, [
          h("div", { style: "flex:1;min-width:0" }, [
            h("div", { style: "font-weight:600;font-size:13.5px", "data-bind": "purchase.relatedAppointments[].service" }, a.service),
            h("div", { style: "font-size:12px;color:var(--ink-3)", "data-bind": "purchase.relatedAppointments[].start" }, a.start)
          ]),
          StatusBadge({ variant: F.spa.statusBadges[a.customerStatus] || "status-badge--scheduled", label: a.customerStatus, bind: "purchase.relatedAppointments[].customerStatus" }),
          d.allowedActions.indexOf("openAppointment") !== -1 ? h("span", { "class": "link-action", "data-action": "purchase.openAppointment", "data-id": a.ref, "data-appointment-ref": a.ref }, "View \u203A") : null
        ]));
      });
      right.appendChild(ap);
    }
    if (d.relatedPlan) {
      right.appendChild(h("div", { "class": "card card--pad", "data-module": "purchase-plan", "data-visual-id": "purchase-plan", "data-plan-ref": d.relatedPlan.ref }, [
        h("div", { style: "display:flex;align-items:center;gap:9px" }, [
          h("div", { "class": "card__title", style: "flex:1" }, "Your plan"),
          StatusBadge({ variant: "status-badge--ok", label: d.relatedPlan.status, bind: "purchase.relatedPlan.status" })
        ]),
        h("div", { style: "font-weight:600;font-size:13.5px;margin-top:6px", "data-bind": "purchase.relatedPlan.title" }, d.relatedPlan.title),
        h("div", { style: "margin-top:8px" }, h("span", { "class": "link-action", "data-action": "account.openPlan" }, "Open My plan \u203A"))
      ]));
    }
    var actions = h("div", { "class": "purch-actions", "data-module": "purchase-actions", "data-visual-id": "purchase-actions" });
    if (d.allowedActions.indexOf("cancelRequest") !== -1 && !cancelState) {
      if (cPhase === "failed") actions.appendChild(InlineFailure({ msg: "Your cancellation request didn\u2019t go through \u2014 the order is unchanged.", retryAction: "purchase.cancelRequest", retryId: d.ref, retryLabel: "Try again" }));
      if (cPhase === "conflict") actions.appendChild(InlineFailure({ msg: "This order changed since you opened it \u2014 reload before requesting changes.", retryAction: "ui.retry", retryId: "purchase.cancelRequest:" + d.ref, retryLabel: "Reload" }));
      actions.appendChild(ActionButton({ variant: "btn--ghost", label: "Request cancellation", action: "purchase.cancelRequest", id: d.ref, confirm: true, pending: cPhase === "pending", pendingLabel: "Requesting\u2026", disabled: cPhase === "conflict", visualId: "purchase-cancel-request" }));
    }
    if (d.allowedActions.indexOf("buyAgain") !== -1) {
      var retailOk = spaRetailOpen() && d.kind === "RETAIL";
      if (bPhase === "failed") actions.appendChild(InlineFailure({ msg: "Couldn\u2019t add these items to your bag \u2014 your bag is unchanged.", retryAction: "purchase.buyAgain", retryId: d.ref, retryLabel: "Try again" }));
      actions.appendChild(ActionButton({
        variant: "btn--primary",
        label: d.kind === "RETAIL" ? "Buy again" : "Buy this plan again",
        action: "purchase.buyAgain",
        id: d.ref,
        pending: bPhase === "pending",
        pendingLabel: "Adding\u2026",
        disabled: d.kind === "RETAIL" && !retailOk,
        visualId: "purchase-buy-again"
      }));
      if (d.kind === "RETAIL" && !retailOk) actions.appendChild(h("div", { "class": "purch-ful__note", "data-state": "unavailable" }, "Online shopping isn\u2019t open on this portal yet \u2014 the studio can help you reorder."));
    }
    if (actions.childNodes.length) left.appendChild(actions);
    grid.appendChild(left);
    grid.appendChild(right);
    page.appendChild(grid);
    return page;
  }

  // app-templates/customer-portal/runtime/src/routes/SpaPurchasesPage.js
  function purchaseRow(p) {
    return h("article", { "class": "purch-row", "data-module": "purchase-row", "data-visual-id": "purchase-row", "data-purchase-ref": p.ref, "data-action": "purchase.open", "data-id": p.ref, tabindex: "0", role: "link" }, [
      h("div", { "class": "purch-row__body" }, [
        h("div", { "class": "purch-row__top" }, [
          h("span", { "class": "purch-row__ref", "data-bind": "purchase.reference" }, p.reference),
          KindChip(p.kind),
          h("span", { "class": "purch-row__date", "data-bind": "purchase.placedAt" }, p.placedAt)
        ]),
        h("div", { "class": "purch-row__summary", "data-bind": "purchase.itemSummary" }, p.itemSummary),
        p.attention ? h("div", { "class": "purch-row__attention", "data-bind": "purchase.attention", role: "note" }, p.attention) : null
      ]),
      h("div", { "class": "purch-row__side" }, [
        purchaseStatusBadge(p.customerStatus),
        h("div", { "class": "purch-row__total" }, [
          h("b", { "data-bind": "purchase.displayTotal" }, p.displayTotal),
          h("span", { "data-bind": "purchase.currency" }, p.displayCurrency || p.currency && p.currency.code || "")
        ])
      ]),
      h("span", { "class": "purch-row__chev", "aria-hidden": "true" }, "\u203A")
    ]);
  }
  function SpaPurchases() {
    var live = state.config.dataMode === "live";
    var source = live ? state.moduleData.orders : null;
    var view = live ? state.moduleStatus.orders || source && source.state || "loading" : state.view;
    var page = h("section", { "class": "page", "data-route": "purchases.list", "data-state": view, "data-visual-id": "spa-purchases", "data-module": "spa-purchases", "data-capability": spaCapability(), "data-screen-label": "Purchases" });
    page.appendChild(PageHeader({ title: "Purchases", sub: "Everything you\u2019ve ordered, with its current state \u2014 exactly as our records show it." }));
    if (spaCapability() === "current-staging" && view === "ready") {
      page.appendChild(spaGateUnavailable());
      return page;
    }
    var gate = spaGate({
      view,
      states: ["loading", "empty", "error", "unauthorized"],
      skeleton: function() {
        var card2 = h("div", { "class": "card", "data-state": "loading", "aria-busy": "true" });
        for (var i = 0; i < 4; i++) card2.appendChild(skeletonRow());
        return card2;
      },
      empty: {
        glyph: "\u25CE",
        title: "No purchases yet",
        desc: "Anything you order \u2014 a visit, shop items or a plan \u2014 will appear here with its current state.",
        action: { variant: "btn--ghost", label: "Browse services", action: "nav.go", id: "services", visualId: "purchases-empty-browse" }
      },
      error: { title: "Couldn\u2019t load your purchases", desc: "Your purchases didn\u2019t load, so nothing is shown \u2014 we never show stale records. Nothing was changed; try again.", retryId: "purchases" },
      scope: "your purchases",
      backRoute: "account",
      unavailable: { title: "Purchases aren\u2019t available yet", desc: "Purchase history isn\u2019t connected on this portal yet. Nothing is shown in the meantime.", action: { variant: "btn--ghost", label: "Back to account", action: "account.open", visualId: "purchases-unavailable-back" } }
    });
    if (gate) {
      page.appendChild(gate);
      return page;
    }
    var list = live ? source.items : F.spaCommerce.purchases.list;
    var loaded = !live && state.spaPurchMore === "loaded" ? list.concat(F.spaCommerce.purchases.nextPage) : list;
    var kindsPresent = {};
    loaded.forEach(function(p) {
      kindsPresent[p.kind] = true;
    });
    var filters = F.spaCommerce.purchases.filters.filter(function(f) {
      if (f.key === "all") return true;
      return (F.spaCommerce.purchases.kindFilter[f.key] || []).some(function(k) {
        return kindsPresent[k];
      });
    });
    if (filters.length > 1) {
      page.appendChild(h("div", { "class": "spa-tabs" }, Tabs({
        items: filters.map(function(f) {
          return { key: f.key, label: f.label };
        }),
        active: state.spaPurchFilter,
        action: "purchases.filter"
      })));
    }
    var visible = loaded.filter(function(p) {
      if (state.spaPurchFilter === "all") return true;
      return (F.spaCommerce.purchases.kindFilter[state.spaPurchFilter] || []).indexOf(p.kind) !== -1;
    });
    var card = h("div", { "class": "card", "data-module": "purchase-list", "data-visual-id": "purchase-list" });
    if (visible.length === 0) {
      card.appendChild(EmptyState({ glyph: "\u25CE", title: "Nothing under this filter", desc: "You have purchases, just not of this kind. Switch back to All to see everything." }));
    } else {
      visible.forEach(function(p) {
        card.appendChild(purchaseRow(p));
      });
    }
    if (!live && state.spaPurchMore === "loading") {
      card.appendChild(skeletonRow());
      card.appendChild(skeletonRow());
    }
    page.appendChild(card);
    if (!live && state.spaPurchMore === "idle") {
      page.appendChild(h(
        "div",
        { style: "display:flex;justify-content:center;margin-top:14px" },
        h("button", { "class": "btn btn--ghost", "data-action": "purchases.more", "data-module": "action-button", "data-visual-id": "purchases-load-more" }, "Show earlier purchases")
      ));
    }
    page.appendChild(h("div", { "class": "card__footnote", style: "border-top:0;padding:12px 4px 0" }, live ? "Amounts and raw Order states come from Core exactly as returned. Line items, receipts and payment history are not returned by this API." : "Amounts and statuses come from our records exactly as written \u2014 receipts and payment history aren\u2019t part of this portal yet."));
    return page;
  }
  function spaGateUnavailable() {
    return h("div", { "class": "state-block", "data-module": "unavailable-state", "data-visual-id": "unavailable-state", "data-state": "unavailable" }, [
      h("div", { "class": "state-block__glyph" }, "\u25CC"),
      h("div", { "class": "state-block__title" }, "Purchases aren\u2019t available on this portal yet"),
      h("div", { "class": "state-block__desc" }, "Purchase history with customer statuses isn\u2019t connected yet. Your raw order records \u2014 exactly as recorded \u2014 are on the Orders page."),
      h("button", { "class": "btn btn--primary", "data-action": "nav.go", "data-id": "orders.list", "data-module": "action-button", "data-visual-id": "purchases-unavailable-orders" }, "See your orders")
    ]);
  }

  // app-templates/customer-portal/runtime/src/routes/SpaProfilePage.js
  function isDirty(d, v) {
    if (d.phone !== v.phone || d.email !== v.email) return true;
    return Object.keys(d.prefs).some(function(k) {
      return d.prefs[k] !== v.prefs[k];
    });
  }
  function SpaProfile() {
    var live = state.config.dataMode === "live";
    var view = live ? state.moduleStatus.profile || "loading" : state.view;
    var page = h("section", { "class": "page page--narrow", "data-route": "profile", "data-state": view, "data-visual-id": "spa-profile", "data-module": "spa-profile", "data-capability": spaCapability(), "data-screen-label": "Profile (Calm Harbor)" });
    page.appendChild(h("div", { "class": "detail-back" }, h("span", { "class": "link-action", "data-action": "account.open" }, "\u2039 Account")));
    page.appendChild(PageHeader({ title: "Profile", sub: live ? "Your email from Core. Phone and preferences are not exposed by the current API." : "Your contact details and preferences \u2014 nothing else is stored here." }));
    var gate = spaGate({
      view,
      states: ["loading", "error", "unauthorized"],
      skeleton: function() {
        return h("div", { "data-state": "loading", "aria-busy": "true" }, [
          skel2("height:210px;border-radius:22px"),
          skel2("height:160px;border-radius:22px;margin-top:16px")
        ]);
      },
      error: { title: "Couldn\u2019t load your profile", desc: "Your details didn\u2019t load, so nothing is shown \u2014 we never show stale or guessed values. Nothing was changed; try again.", retryId: "profile" },
      scope: "your profile",
      backRoute: "account",
      unavailable: { title: "Profile isn\u2019t available yet", desc: "Profile editing isn\u2019t connected on this portal yet \u2014 our team can update your details for you." }
    });
    if (gate) {
      page.appendChild(gate);
      return page;
    }
    var confirmed = spaProfileValues();
    var draft = state.spaProfileDraft;
    var errs = state.spaProfileErrors || {};
    var phase = cmdPhase("profile.save:profile");
    var conflict = phase === "conflict";
    var saving = phase === "pending";
    var editing = !!draft;
    var dirty = editing && isDirty(draft, confirmed);
    var panelState = conflict ? "conflict" : saving ? "saving" : phase === "failed" ? "save-failed" : errs.phone || errs.email ? "invalid" : editing ? dirty ? "dirty" : "unchanged" : "ready";
    var canEdit = live ? confirmed.allowedActions.indexOf("edit-email") !== -1 : F.spaProfileSrv.allowedActions.indexOf("edit") !== -1;
    var panel = h("div", { "class": "list-panel", "data-module": "spa-profile-contact", "data-visual-id": "spa-profile-contact", "data-state": panelState, "data-profile-version": live ? void 0 : F.spaProfileSrv.version }, [
      h("div", { "class": "list-panel__head" }, [
        h("div", { "class": "list-panel__title", style: "flex:1" }, "Contact details"),
        saving ? h("span", { style: "font-size:12.5px;color:var(--ink-3)" }, "Saving\u2026") : null,
        editing && !saving && !conflict ? h("span", { "class": "readonly-chip", "data-dirty-chip": "true", "data-state": dirty ? "dirty" : "unchanged" }, dirty ? "Unsaved changes" : "No changes yet") : null
      ])
    ]);
    if (conflict) {
      panel.appendChild(h("div", { "class": "conflict-banner", "data-module": "conflict-banner", "data-visual-id": "profile-conflict", "data-state": "conflict", role: "alert" }, [
        h("div", { "class": "conflict-banner__icon" }, "\u21BA"),
        h("div", { "class": "conflict-banner__body" }, [
          h("div", { style: "font-weight:700;font-size:13.5px" }, "Your profile changed since you opened it"),
          h("div", { style: "font-size:12.5px;line-height:1.45;color:var(--ink-2);margin-top:2px" }, "Nothing was saved. Reload the latest details and review them before editing again.")
        ]),
        ActionButton({ variant: "btn--primary", label: "Reload profile", action: "profile.reload", visualId: "profile-conflict-reload" })
      ]));
    }
    if (!editing) {
      var ro = h("div", { "class": "appt-details" });
      if (confirmed.phone != null) ro.appendChild(h("div", { "class": "appt-details__row" }, [h("div", { "class": "appt-details__label" }, "Phone"), h("div", { "class": "appt-details__val" }, h("b", { "data-bind": "profile.phone" }, confirmed.phone))]));
      ro.appendChild(h("div", { "class": "appt-details__row" }, [h("div", { "class": "appt-details__label" }, "Email"), h("div", { "class": "appt-details__val" }, h("b", { "data-bind": "profile.email" }, confirmed.email))]));
      panel.appendChild(ro);
      if (canEdit) panel.appendChild(h("div", { style: "margin-top:14px" }, ActionButton({ variant: "btn--ghost", label: "Edit details", action: "profile.edit", visualId: "profile-edit" })));
    } else {
      var form = h("div", { "class": "contact-form" });
      (live ? [["Email", "email", "email"]] : [["Phone", "phone", "tel"], ["Email", "email", "email"]]).forEach(function(fd) {
        var label = fd[0], key = fd[1], type = fd[2];
        var input = h("input", { "class": "field", type, value: draft[key] || "", "aria-label": label, "data-action": "profile.changeField", "data-field": key, "data-bind": "profile." + key, "data-state": errs[key] ? "invalid" : void 0, disabled: saving || conflict ? true : void 0, "aria-invalid": errs[key] ? "true" : void 0, "aria-describedby": errs[key] ? "profile-err-" + key : void 0 });
        input.addEventListener("input", function() {
          ACTIONS["profile.changeField"](key + "|" + input.value);
          var chip = page.querySelector("[data-dirty-chip]");
          if (chip) {
            var d2 = state.spaProfileDraft, dr = d2 && isDirty(d2, spaProfileValues());
            chip.textContent = dr ? "Unsaved changes" : "No changes yet";
            chip.setAttribute("data-state", dr ? "dirty" : "unchanged");
          }
        });
        form.appendChild(h("div", { "class": "field-row" }, [
          h("span", { "class": "field-label" }, label),
          input,
          errs[key] ? h("div", { "class": "field-error", id: "profile-err-" + key, role: "alert" }, errs[key]) : null
        ]));
      });
      panel.appendChild(form);
      if (phase === "failed") panel.appendChild(h("div", { style: "margin-top:12px" }, InlineFailure({
        msg: "Your changes weren\u2019t saved \u2014 the details on file are unchanged.",
        retryAction: "profile.save",
        retryLabel: "Retry save"
      })));
      panel.appendChild(h("div", { style: "margin-top:14px;display:flex;gap:12px;align-items:center;flex-wrap:wrap" }, [
        ActionButton({ variant: "btn--primary", label: "Save changes", action: "profile.save", visualId: "profile-save", pending: saving, pendingLabel: "Saving\u2026", disabled: conflict }),
        ActionButton({ variant: "btn--ghost", label: "Discard", action: "profile.reload", visualId: "profile-discard", disabled: saving }),
        h("span", { style: "font-size:12px;color:var(--ink-3)" }, "Changes apply only once the studio\u2019s system confirms them.")
      ]));
    }
    page.appendChild(panel);
    if (!live) {
      var prefsPanel = h("div", { "class": "list-panel", "data-module": "spa-profile-preferences", "data-visual-id": "spa-profile-preferences", "data-state": editing ? "editing" : "ready" }, [
        h("div", { "class": "list-panel__head" }, [
          h("div", { "class": "list-panel__title", style: "flex:1" }, "Preferences"),
          h("span", { style: "font-size:12px;color:var(--ink-3)" }, "about your visits only")
        ])
      ]);
      F.spaProfileSrv.preferences.forEach(function(p) {
        var val = editing ? draft.prefs[p.key] : confirmed.prefs[p.key];
        prefsPanel.appendChild(h("div", { "class": "pref-row", "data-module": "profile-preference", "data-visual-id": "profile-preference", "data-pref-key": p.key, "data-state": val ? "on" : "off" }, [
          h("div", { style: "flex:1" }, [
            h("div", { style: "font-weight:600;font-size:14px", "data-bind": "profile.preferences[].label" }, p.label),
            h("div", { style: "font-size:12.5px;color:var(--ink-2)" }, p.desc)
          ]),
          editing ? h("div", { "class": "toggle" + (val ? " toggle--on" : ""), "data-action": "profile.changeField", "data-id": "pref:" + p.key, role: "switch", "aria-checked": val ? "true" : "false", "aria-label": p.label, disabled: saving || conflict ? true : void 0, "data-state": val ? "on" : "off" }, h("div", { "class": "toggle__knob" })) : h("span", { "class": "readonly-chip", "data-bind": "profile.preferences[].value" }, val ? "On" : "Off")
        ]));
      });
      if (!editing) prefsPanel.appendChild(h("div", { "class": "purch-ful__note", style: "margin-top:10px" }, "Use Edit details above to change these."));
      page.appendChild(prefsPanel);
    } else {
      page.appendChild(h("div", { "class": "purch-ful__note", "data-state": "unavailable" }, "Phone and visit preferences are not returned by the current Core User API, so this portal does not show or edit them."));
    }
    page.appendChild(h("div", { "class": "catalog-note" }, live ? "The email above is read from the signed-in Core User and saved back only after Core confirms it." : "This page holds only your contact details and the preferences above \u2014 exactly as the studio\u2019s system returns them."));
    return page;
  }

  // app-templates/customer-portal/runtime/src/routes/SpaShopPage.js
  function sellInfo(code) {
    if (state.config.dataMode === "live") {
      var product = productItems().find(function(item) {
        return item.code === code;
      });
      return product ? { state: "sellable", cents: Math.round(Number(product.priceNum || 0) * 100), displayPrice: product.price } : { state: "unavailable" };
    }
    return F.spaCommerce.retail.products.find(function(r) {
      return r.code === code;
    }) || { state: "unavailable" };
  }
  function sellableCard(p) {
    var r = sellInfo(p.code);
    var pickedRef = state.spaVariantPick[p.code] || null;
    var picked = r.variants ? r.variants.find(function(v) {
      return v.ref === pickedRef;
    }) : null;
    var phase = cmdPhase("cart.addItem:" + p.code);
    var canAdd = r.state === "sellable" || r.state === "price-changed" || r.state === "variant-required" && picked;
    var muted = r.state === "out-of-stock" || r.state === "unavailable";
    var card = h("div", { "class": "card card--pad spa-shop-card" + (muted ? " spa-shop-card--muted" : ""), "data-module": "spa-shop-card", "data-visual-id": "spa-shop-card", "data-product-code": p.code, "data-product-ref": p.code, "data-state": phase !== "idle" ? phase : r.state }, [
      h("div", { style: "font-weight:700;font-size:14.5px;overflow-wrap:anywhere", "data-bind": "pim.products[].name" }, p.name),
      h("div", { style: "font-size:12.5px;color:var(--ink-2);margin-top:3px;line-height:1.45", "data-bind": "pim.products[].shortDescription" }, p.blurb || p.description || "Published retail product")
    ]);
    if (r.state === "out-of-stock") {
      card.appendChild(h("div", { "class": "shop-chip shop-chip--stock", "data-bind": "retail.state" }, "Out of stock"));
    } else if (r.state === "unavailable") {
      card.appendChild(h("div", { "class": "shop-chip", "data-bind": "retail.state" }, r.note || "Not sold online"));
    } else if (r.state === "variant-required") {
      var vRow = h("div", { "class": "shop-variants", "data-module": "variant-picker", "data-visual-id": "variant-picker" });
      r.variants.forEach(function(v) {
        vRow.appendChild(h("button", {
          "class": "shop-variant" + (pickedRef === v.ref ? " shop-variant--on" : ""),
          "data-action": "shop.pickVariant",
          "data-id": p.code + "|" + v.ref,
          "data-variant-ref": v.ref,
          "data-state": pickedRef === v.ref ? "active" : void 0
        }, v.label + " \xB7 " + v.displayPrice));
      });
      card.appendChild(vRow);
    }
    var price = r.state === "variant-required" ? picked ? picked.displayPrice : "from " + r.variants[0].displayPrice : r.displayPrice || p.price;
    var priceRow = h("div", { style: "display:flex;align-items:center;gap:8px;margin-top:10px;flex-wrap:wrap" }, [
      h("b", { style: "font-size:15px", "data-bind": "retail.displayPrice" }, price),
      r.state === "price-changed" ? h("span", { "class": "shop-chip shop-chip--price", "data-bind": "retail.priceNote" }, "Price updated") : null,
      h("span", { "class": "code-chip", style: "margin-left:auto", "data-bind": "pim.products[].code" }, p.code)
    ]);
    card.appendChild(priceRow);
    if (!muted) {
      card.appendChild(h("div", { style: "margin-top:10px" }, ActionButton({
        variant: "btn--primary",
        label: "Add to bag",
        action: "cart.addItem",
        id: p.code,
        block: true,
        pending: phase === "pending",
        pendingLabel: "Adding\u2026",
        disabled: !canAdd,
        visualId: "shop-add-to-bag"
      })));
      if (r.state === "variant-required" && !picked) card.appendChild(h("div", { style: "font-size:11.5px;color:var(--ink-3);margin-top:6px" }, "Pick a size first"));
      if (phase === "failed") card.appendChild(h("div", { "class": "cart-row__note", role: "alert" }, "Not added \u2014 your bag is unchanged. Try again."));
      if (phase === "conflict") card.appendChild(h("div", { "class": "cart-row__note", role: "alert" }, "Stock changed just now \u2014 nothing was added."));
    }
    return card;
  }
  function SpaShop() {
    var open = spaRetailOpen();
    var liveView = state.config.dataMode === "live" ? state.moduleStatus.products || "loading" : state.view;
    var page = h("section", { "class": "page", "data-route": "products", "data-state": liveView, "data-visual-id": "spa-shop", "data-module": "spa-shop", "data-retail": open ? "retail-commerce-open" : "browse-only", "data-capability": spaCapability(), "data-screen-label": open ? "Shop (sellable)" : "Shop (browse-only)" });
    var head2 = h("div", { "class": "section-head", style: "display:flex;align-items:flex-end;gap:14px;flex-wrap:wrap" }, [
      h("div", { style: "flex:1;min-width:220px" }, [
        h("div", { style: "display:flex;align-items:center;gap:10px" }, [
          h("div", { "class": "section-head__title" }, "Spa shop"),
          open ? null : h("span", { "class": "readonly-chip", style: "margin-left:0" }, "Browse-only")
        ]),
        h("div", { "class": "section-head__sub" }, "Retail from the public catalog \u2014 the products our specialists use.")
      ]),
      open ? h("span", { "class": "link-action", "data-action": "cart.open", "data-visual-id": "shop-open-cart" }, "Your bag" + (spaCartCount() ? " \xB7 " + spaCartCount() : "") + " \u203A") : h("span", { "class": "link-action", "data-action": "nav.go", "data-id": "services" }, "Services & prices \u203A")
    ]);
    page.appendChild(head2);
    var gate = routeStateBody({
      view: liveView,
      states: ["loading", "empty", "error"],
      skeleton: function() {
        return gridSkeleton("spa-shop-grid", 4, 150);
      },
      empty: { glyph: "\u25A1", title: "The shelf is empty right now", desc: "No retail products are published in the catalog at the moment \u2014 nothing is invented in the meantime." },
      error: { title: "Couldn\u2019t load the shelf", desc: "Retail products didn\u2019t load, so nothing stale is shown. Nothing was changed \u2014 try again.", retryId: "products" }
    });
    if (gate) {
      page.appendChild(gate);
      return page;
    }
    var grid = h("div", { "class": "spa-shop-grid", "data-module": "spa-shop-list", "data-visual-id": "spa-shop-list" });
    productItems().forEach(function(p) {
      if (open) {
        grid.appendChild(sellableCard(p));
        return;
      }
      grid.appendChild(h("div", { "class": "card card--pad spa-shop-card", "data-module": "spa-shop-card", "data-visual-id": "spa-shop-card", "data-product-code": p.code }, [
        h("div", { style: "font-weight:700;font-size:14.5px;overflow-wrap:anywhere", "data-bind": "pim.products[].name" }, p.name),
        h("div", { style: "font-size:12.5px;color:var(--ink-2);margin-top:3px;line-height:1.45", "data-bind": "pim.products[].shortDescription" }, p.blurb || p.description || "Published retail product"),
        h("div", { style: "display:flex;align-items:center;gap:8px;margin-top:10px;flex-wrap:wrap" }, [
          h("b", { style: "font-size:15px", "data-bind": "pim.products[].displayPrice" }, p.price),
          h("span", { "class": "code-chip", style: "margin-left:auto", "data-bind": "pim.products[].code" }, p.code)
        ])
      ]));
    });
    page.appendChild(grid);
    page.appendChild(h("div", { "class": "catalog-note" }, open ? "Prices and stock come from the store at this moment. Adding something to your bag doesn\u2019t reserve it \u2014 availability and prices are confirmed at checkout." : "Prices as published in the public catalog. There\u2019s no cart or checkout here \u2014 nothing on this page starts a purchase."));
    return page;
  }

  // app-templates/customer-portal/runtime/src/router.js
  function ComingSoon(routeId, wave) {
    return h("section", { "class": "page", "data-route": routeId, "data-visual-id": routeId }, [
      EmptyState({
        glyph: "\u{1F9F1}",
        title: routeId + " \u2014 coming in " + wave,
        desc: "This route is part of a later wave. The shell, theming and action contract are already wired.",
        action: { variant: "btn--ghost", label: "Back to orders", action: "nav.go", id: "orders.list" }
      })
    ]);
  }
  function resolveRoute(routeId) {
    var requested = routeRegistry[routeId] ? routeId : null;
    var activeRoute = requested ? routeRegistry[requested] : null;
    var defaultRoute = reachableDefaultRoute();
    if (!activeRoute) return { id: defaultRoute, reason: "unknown" };
    if (!isPublic(requested) && !state.session.authenticated) {
      state.session.intendedRoute = requested;
      return { id: "auth.oidc", reason: "unauthorized" };
    }
    if (requested === "care" && !isModuleEnabled("care")) {
      return { id: "care", reason: "disabled" };
    }
    if (!activeRoute.public && !isModuleEnabled(activeRoute.module)) {
      return { id: defaultRoute, reason: "disabled" };
    }
    if (requested === "care") {
      return { id: "care", reason: careAccessReason() };
    }
    return { id: requested, reason: null };
  }
  function reachableDefaultRoute() {
    if (isRouteReachable(state.config.defaultRoute)) return state.config.defaultRoute;
    if (isRouteReachable("orders.list")) return "orders.list";
    var enabledRoute = Object.values(routeRegistry).find(function(route) {
      return !route.public && isModuleEnabled(route.module);
    });
    return enabledRoute ? enabledRoute.id : "landing";
  }
  function isRouteReachable(routeId) {
    var route = routeRegistry[routeId];
    return !!(route && (route.public || isModuleEnabled(route.module)));
  }
  function routeFromLocation() {
    if (state.config.routerMode === "memory") return state.route;
    var raw;
    if (state.config.routerMode === "history") {
      raw = window.location.pathname + window.location.search;
    } else {
      raw = window.location.hash.replace(/^#/, "");
      if (!raw) return state.route;
      if (raw.charAt(0) !== "/") {
        var routeId = raw.split("?", 1)[0];
        setRouteQuery(routeId, raw);
        return routeId;
      }
    }
    var match = matchRoutePath(raw);
    if (!match) {
      clearRouteQuery();
      return "__unknown__";
    }
    setRouteQuery(match.id, raw);
    applyRouteParams(match);
    return match.id;
  }
  function writeRouteToLocation(routeId) {
    scopeRouteQuery(routeId);
    if (state.config.routerMode === "memory") return;
    var path = routePath(routeId, paramsForRoute(routeId));
    var query = state.routeQuery || "";
    if (state.config.routerMode === "history") {
      if (window.location.pathname + window.location.search !== path + query) window.history.pushState({}, "", path + query);
      return;
    }
    var nextHash = "#" + path + query;
    if (window.location.hash !== nextHash) window.history.pushState({}, "", nextHash);
  }
  function initRouter(onRouteChange) {
    var applyLocation = function() {
      var resolved = resolveRoute(routeFromLocation());
      state.route = resolved.id;
      onRouteChange();
    };
    if (state.config.routerMode === "history") {
      window.addEventListener("popstate", applyLocation);
    } else if (state.config.routerMode === "hash") {
      window.addEventListener("hashchange", applyLocation);
    }
    var initial = resolveRoute(routeFromLocation());
    state.route = initial.id;
    writeRouteToLocation(initial.id);
  }
  function renderRoute() {
    var resolved = resolveRoute(state.route);
    if (resolved.id !== state.route) state.route = resolved.id;
    if (state.view === "fallback") return RouteFallback("fallback");
    switch (resolved.id) {
      case "orders.list":
        return isSpa() ? spaCapability() === "target-appointments" ? SpaAppointments() : SpaOrders() : Cabinet();
      case "order.detail":
        return OrderDetail();
      case "appointment.detail":
        return isSpa() && spaCapability() === "target-appointments" ? SpaAppointmentDetail() : ComingSoon("appointment.detail", "a later wave");
      case "services":
        return isSpa() ? SpaCatalog() : Services();
      case "pricing":
        return isSpa() ? SpaCatalog() : Pricing();
      case "products":
        return isSpa() ? SpaShop() : Products();
      case "checkout":
        return isSpa() ? SpaCheckout() : Checkout();
      case "account":
        return isSpa() ? SpaAccount() : ComingSoon("account", "a later wave");
      case "purchases.list":
        return isSpa() ? SpaPurchases() : ComingSoon("purchases.list", "a later wave");
      case "purchase.detail":
        return isSpa() ? SpaPurchaseDetail() : ComingSoon("purchase.detail", "a later wave");
      case "plan":
        return isSpa() ? SpaPlan() : ComingSoon("plan", "a later wave");
      case "cart":
        return isSpa() ? SpaCart() : Checkout();
      case "proposals.list":
        return ProposalsList();
      case "proposal.detail":
        return ProposalDetail();
      case "profile":
        return isSpa() ? SpaProfile() : Profile();
      case "activity":
        return Activity();
      case "calendar":
        return Calendar();
      case "support":
        return Support();
      case "landing":
        return Landing();
      case "auth.phone":
        return Auth();
      case "auth.code":
        return Auth();
      case "auth.oidc":
        return AuthOidc();
      case "care":
        return Care();
      case "seo.landing":
        return SeoLanding();
      default:
        return RouteFallback(resolved.reason);
    }
  }
  function RouteFallback(reason) {
    return h("section", { "class": "page", "data-route": state.route, "data-visual-id": "route-fallback", "data-state": reason || "error" }, [
      EmptyState({
        glyph: "!",
        title: "Route unavailable",
        desc: "This route is not enabled for the current portal profile.",
        action: { variant: "btn--ghost", label: "Back to home", action: "nav.go", id: "orders.list" }
      })
    ]);
  }
  function careAccessReason() {
    var access = state.access && state.access.care;
    var status = access && access.status;
    if (status === "granted") return "granted";
    if (status === "checking") return "loading";
    if (status === "error") return "error";
    return "unauthorized";
  }
  function applyRouteParams(match) {
    if (match.id === "order.detail" && match.params.id) state.currentOrderId = match.params.id;
    if (match.id === "proposal.detail" && match.params.id) state.currentSiteId = match.params.id;
    if (match.id === "purchase.detail" && match.params.id) state.spaCurrentPurchase = match.params.id;
    if (match.id === "appointment.detail" && match.params.id) state.spaCurrentAppointment = match.params.id;
  }
  function paramsForRoute(routeId) {
    if (routeId === "order.detail") {
      if (!state.currentOrderId) state.currentOrderId = state.orders[0] && state.orders[0].id;
      return { id: state.currentOrderId };
    }
    if (routeId === "proposal.detail") return { id: state.currentSiteId };
    if (routeId === "purchase.detail") return { id: state.spaCurrentPurchase };
    if (routeId === "appointment.detail") return { id: state.spaCurrentAppointment };
    return {};
  }
  function queryFrom(value) {
    var index = String(value || "").indexOf("?");
    return index === -1 ? "" : String(value).slice(index);
  }
  function routeFamily(routeId) {
    if (routeId === "orders.list" || routeId === "order.detail" || routeId === "appointment.detail") return "appointments";
    if (routeId === "proposals.list" || routeId === "proposal.detail") return "proposals";
    if (routeId === "purchases.list" || routeId === "purchase.detail") return "purchases";
    return null;
  }
  function setRouteQuery(routeId, value) {
    var query = queryFrom(value);
    state.routeQuery = query;
    state.routeQueryOwner = query ? routeFamily(routeId) : null;
  }
  function scopeRouteQuery(routeId) {
    var family = routeFamily(routeId);
    if (!family || state.routeQueryOwner !== family) clearRouteQuery();
  }
  function clearRouteQuery() {
    state.routeQuery = "";
    state.routeQueryOwner = null;
  }

  // app-templates/customer-portal/runtime/src/seo-actions.js
  function currentModel() {
    return loadSeoModel(state.theme);
  }
  function selectSeoService(id, render2) {
    if (!currentModel().services.some(function(service) {
      return service.id === id;
    })) throw new Error("SEO service not found");
    state.seoSelectedServiceId = id;
    render2();
  }
  function toggleSeoFaq(id, render2) {
    if (!currentModel().faq.some(function(faq) {
      return faq.id === id;
    })) throw new Error("SEO FAQ not found");
    state.seoFaqOpenId = state.seoFaqOpenId === id ? null : id;
    render2();
  }

  // app-templates/customer-portal/runtime/src/actions.js
  var ACTIONS = {
    "nav.go": function(id) {
      go(id);
    },
    "nav.landing": function() {
      go("landing");
    },
    "nav.services": function() {
      go("services");
    },
    "nav.pricing": function() {
      go("pricing");
    },
    "nav.products": function() {
      go("products");
    },
    "auth.gotoSignin": function() {
      state.authError = null;
      state.code = "";
      go("auth.oidc");
    },
    "auth.oidcSignIn": function() {
      if (state.config.dataMode !== "live") return failCommand("auth.oidcSignIn");
      state.oidc = "redirecting";
      render();
      return startCoreOidcSignIn(state.config).catch(function(error2) {
        state.oidc = "unavailable";
        state.commandErrors["auth.oidcSignIn"] = error2 && error2.message || "Sign-in failed";
        render();
        return false;
      });
    },
    "auth.retrySession": function() {
      return retryRuntimeLoad();
    },
    "auth.sendCode": function() {
      validatePhone();
    },
    "auth.verifyCode": function() {
      validateCode();
    },
    "auth.back": function() {
      state.authError = null;
      go("auth.phone");
    },
    "auth.resend": function() {
      failCommand("auth.resend");
    },
    "auth.apple": function() {
      failCommand("auth.apple");
    },
    "order.open": function(id) {
      openOrder(id);
    },
    "order.back": function() {
      go("orders.list");
    },
    "order.cancel": function(id) {
      if (isSpa()) return spaApptCancel(id);
      return runCommand("order.cancel", id, function() {
        cancelOrder(id);
      });
    },
    "order.reschedule": function(id) {
      if (spaFlowCapable()) return openSpaFlow({ entry: "reschedule", rescheduleOf: id });
      openDrawer("booking");
    },
    "order.downloadInvoice": function() {
      failCommand("order.downloadInvoice");
    },
    "order.bookAgain": function(id) {
      if (spaFlowCapable()) return openSpaFlow({ entry: "book-again", fromAppt: id });
      openDrawer("booking");
    },
    "order.filter": function(id) {
      setState({ filter: id });
    },
    "compliance.unlock": function() {
      toast("Compliance Reports is a Pro add-on \u2014 ask your account manager");
    },
    "booking.open": function(id) {
      if (spaFlowCapable()) return openSpaFlow(id ? { entry: "service", serviceCode: id } : { entry: "empty" });
      openDrawer("booking");
    },
    "booking.close": function() {
      state.spaFlow = null;
      state.spaBookAck = false;
      closeDrawer();
    },
    "booking.selectService": function(id) {
      var flow = state.spaFlow;
      if (!flow) return;
      flow.serviceCode = id;
      flow.specialistRef = null;
      flow.slotRef = null;
      flow.held = false;
      spaFlowAfterService(flow);
      render();
    },
    "booking.selectSpecialist": function(id) {
      var flow = state.spaFlow;
      if (!flow) return;
      flow.specialistRef = id === "any" ? null : id;
      flow.step = "slots";
      render();
    },
    "booking.selectSlot": function(id) {
      var flow = state.spaFlow;
      if (!flow) return;
      if (String(id).indexOf("day:") === 0) {
        flow.dayKey = String(id).slice(4);
        flow.slotRef = null;
      } else {
        flow.slotRef = id;
        var day = F.spaBooking.days.find(function(item) {
          return (item.slots || []).some(function(slot) {
            return slot.ref === id;
          });
        });
        if (day) flow.dayKey = day.key;
      }
      render();
    },
    "booking.hold": function(id) {
      return spaHoldSlot(id);
    },
    "booking.retry": function(id) {
      var flow = state.spaFlow;
      if (!flow) return;
      if (id === "hold") {
        clearSpaCommand("booking.hold:" + flow.slotRef);
        return spaHoldSlot(flow.slotRef);
      }
      clearSpaCommand("booking.confirm:" + F.spaBooking.ref);
      return spaBookingConfirm();
    },
    "booking.back": function() {
      var flow = state.spaFlow;
      if (!flow) return;
      if (flow.step === "review") {
        flow.held = false;
        flow.step = "slots";
      } else if (flow.step === "slots") {
        flow.step = (F.spaBooking.eligibleSpecialists[flow.serviceCode] || []).length ? "specialist" : "context";
      } else {
        flow.step = "context";
      }
      render();
    },
    "booking.ackPolicy": function() {
      setState({ spaBookAck: !state.spaBookAck });
    },
    "booking.confirm": function() {
      if (isSpa()) return spaBookingConfirm();
      closeDrawer();
      failCommand("booking.confirm");
    },
    "appointment.open": function(id) {
      state.spaCurrentAppointment = id;
      state.view = "ready";
      go("appointment.detail");
    },
    "appointment.openPurchase": function(id) {
      ACTIONS["purchase.open"](id);
    },
    "appointment.reschedule": function(id) {
      return openSpaFlow({ entry: "reschedule", rescheduleOf: id });
    },
    "appointment.cancel": function(id) {
      return spaApptCancel(id);
    },
    "appointment.bookAgain": function(id) {
      return openSpaFlow({ entry: "book-again", fromAppt: id });
    },
    "proposal.review": function() {
      go("proposals.list");
    },
    "proposal.open": function(id) {
      openProposal(id);
    },
    "proposal.selectPlan": function(id) {
      runCommand("proposal.selectPlan", id, function() {
        selectPlan(id);
      });
    },
    "proposal.approve": function() {
      runCommand("proposal.approve", state.currentSiteId, function() {
        decideSite("approved");
      });
    },
    "proposal.requestRevision": function() {
      runCommand("proposal.requestRevision", state.currentSiteId, function() {
        decideSite("revision");
      });
    },
    "proposal.decline": function() {
      runCommand("proposal.decline", state.currentSiteId, function() {
        decideSite("declined");
      });
    },
    "weather.confirm": function(id) {
      runCommand("weather.confirm", id, function() {
        confirmWeather(id, "confirmed");
      });
    },
    "weather.decline": function(id) {
      runCommand("weather.decline", id, function() {
        confirmWeather(id, "declined");
      });
    },
    "membership.activate": function() {
      failCommand("membership.activate");
    },
    "support.open": function() {
      if (isSpa()) return setState({ spaSupport: true, accountMenu: false, mobileNav: false });
      go("support");
    },
    "support.sendMessage": function() {
      runCommand("support.sendMessage", null, sendChat);
    },
    "support.quickReply": function(id) {
      runCommand("support.quickReply", id, function() {
        pushChat(id);
      });
    },
    "support.helpTopic": function(id) {
      go("support");
      runCommand("support.helpTopic", id, function() {
        pushChat(id);
      });
    },
    "support.call": function() {
      if (isSpa()) return setState({ spaSupport: true });
      failCommand("support.call");
    },
    "support.email": function() {
      if (isSpa()) return setState({ spaSupport: true });
      failCommand("support.email");
    },
    "support.dismiss": function() {
      setState({ spaSupport: false });
    },
    "care.selectUnit": function(id, el) {
      return selectCareUnit(id, el);
    },
    "care.download": function(id, el) {
      return downloadCareDocument(id, el);
    },
    "care.requestRetreat": function(id, el) {
      return requestCareRetreat(id, el);
    },
    "care.selectSpecialist": function(id, el) {
      return selectCareSpecialist(id, el);
    },
    "care.completeTask": function(id, el) {
      return toggleCareTask(id, el);
    },
    "care.contactProvider": function(id, el) {
      return runUnavailableCareCommand("care.contactProvider", id, el);
    },
    "care.openSecureDoc": function(id, el) {
      return runUnavailableCareCommand("care.openSecureDoc", id, el);
    },
    "seo.cta.book": function(id, el) {
      validateSeoLink(el);
    },
    "seo.cta.quote": function(id, el) {
      validateSeoLink(el);
    },
    "seo.cta.call": function(id, el) {
      validateSeoLink(el);
    },
    "seo.cta.services": function(id, el, event) {
      navigateSeoServices(el, event);
    },
    "seo.service.select": function(id) {
      selectSeoService(id, render);
    },
    "seo.faq.toggle": function(id, el, event) {
      if (event) event.preventDefault();
      toggleSeoFaq(id, render);
    },
    "cart.open": function() {
      go(isSpa() && spaRetailOpen() ? "cart" : "checkout");
    },
    "service.request": function() {
      openDrawer("booking");
    },
    "service.requestExtra": function(id) {
      runCommand("service.requestExtra", id, function() {
        requestExtraService(id);
      });
    },
    "service.reportIssue": function() {
      failCommand("service.reportIssue");
    },
    "access.confirm": function(id) {
      runCommand("access.confirm", id, function() {
        confirmAccess(id);
      });
    },
    "access.update": function() {
      failCommand("access.update");
    },
    "cart.addItem": function(id) {
      if (isSpa() && state.capability === "target-appointments") {
        if (spaCurrentApiDemoOpen()) {
          spaAddLine(id);
          render();
          return true;
        }
        return runSpaCommand("cart.addItem:" + id, function() {
          spaAddLine(id);
        });
      }
      runCommand("cart.addItem", id, function() {
        addToCart(id);
      });
    },
    "cart.removeItem": function(id) {
      if (isSpa() && state.capability === "target-appointments") {
        if (spaCurrentApiDemoOpen()) {
          spaSetLines(spaLines().filter(function(line) {
            return line.ref !== id;
          }));
          render();
          return true;
        }
        return runSpaCommand("cart.removeItem:" + id, function() {
          spaSetLines(spaLines().filter(function(line) {
            return line.ref !== id;
          }));
        });
      }
      runCommand("cart.removeItem", id, function() {
        removeCartItem(id);
      });
    },
    "cart.changeQuantity": function(id) {
      return spaChangeQuantity(id);
    },
    "cart.inc": function(id) {
      runCommand("cart.inc", id, function() {
        changeQty(id, 1);
      });
    },
    "cart.dec": function(id) {
      runCommand("cart.dec", id, function() {
        changeQty(id, -1);
      });
    },
    "checkout.placeOrder": function() {
      runCommand("checkout.placeOrder", null, placeFixtureOrder);
    },
    "checkout.pickAddress": function(id) {
      runCommand("checkout.pickAddress", id, function() {
        selectAddress(id);
      });
    },
    "checkout.pickPayment": function(id) {
      runCommand("checkout.pickPayment", id, function() {
        selectPayment(id);
      });
    },
    "account.open": function() {
      go("account");
    },
    "account.openPurchases": function() {
      state.spaPurchFilter = "all";
      go("purchases.list");
    },
    "account.openPlan": function() {
      go("plan");
    },
    "account.openProfile": function() {
      go("profile");
    },
    "account.menu": function() {
      setState({ accountMenu: !state.accountMenu, mobileNav: false });
    },
    "purchases.filter": function(id) {
      setState({ spaPurchFilter: id });
    },
    "purchases.more": function() {
      spaLoadMore();
    },
    "purchase.open": function(id) {
      state.spaCurrentPurchase = id;
      state.view = "ready";
      go("purchase.detail");
    },
    "purchase.openAppointment": function() {
      go("orders.list");
    },
    "purchase.cancelRequest": function(id) {
      return runSpaCommand("purchase.cancelRequest:" + id, function() {
        state.spaCancelReqs = Object.assign({}, state.spaCancelReqs, { [id]: "accepted-for-review" });
      });
    },
    "purchase.returnRequest": function(id) {
      return runSpaCommand("purchase.returnRequest:" + id, function() {
        state.spaReturns = Object.assign({}, state.spaReturns, { [id]: "accepted-for-review" });
      });
    },
    "purchase.buyAgain": function(id) {
      return spaBuyAgain(id);
    },
    "plan.bookWithCredit": function(id) {
      if (spaFlowCapable()) return openSpaFlow({ entry: "credit", planRef: id });
      openDrawer("booking");
    },
    "plan.purchase": function(id) {
      if (!spaPlanSellOpen() || state.spaOfferDemo !== "sellable") return false;
      state.spaPlanOffer = id;
      return spaCheckoutStart("plan");
    },
    "plan.cancelRenewal": function(id) {
      return runSpaCommand("plan.cancelRenewal:" + id, function() {
        state.spaPlanCancelled = Object.assign({}, state.spaPlanCancelled, { [id]: true });
      });
    },
    "shop.pickVariant": function(id) {
      var parts = String(id || "").split("|");
      state.spaVariantPick = Object.assign({}, state.spaVariantPick, { [parts[0]]: parts[1] });
      render();
    },
    "checkout.start": function(id) {
      return spaCheckoutStart(id);
    },
    "checkout.selectFulfillment": function() {
      render();
    },
    "checkout.ackPolicy": function() {
      setState({ spaPolicyAck: !state.spaPolicyAck });
    },
    "checkout.confirm": function() {
      return spaConfirmCheckout();
    },
    "checkout.retryConfirm": function() {
      return spaConfirmCheckout();
    },
    "products.filter": function(id) {
      setState({ prodCat: id });
    },
    "activity.open": function() {
      go("activity");
    },
    "activity.markRead": function() {
      runCommand("activity.markRead", null, function() {
        state.activityReadAll = true;
        toast("Activity marked read in fixture state");
      });
    },
    "activity.filter": function(id) {
      setState({ feedFilter: id });
    },
    "activity.act": function(id) {
      feedAction(id);
    },
    "profile.open": function() {
      go("profile");
    },
    "profile.filter": function(id) {
      setState({ profileFilter: id });
    },
    "profile.setDefaultAddress": function(id) {
      runCommand("profile.setDefaultAddress", id, function() {
        selectAddress(id);
      });
    },
    "profile.setDefaultPayment": function(id) {
      runCommand("profile.setDefaultPayment", id, function() {
        selectPayment(id);
      });
    },
    "profile.addAddress": function() {
      failCommand("profile.addAddress");
    },
    "profile.addCard": function() {
      failCommand("profile.addCard");
    },
    "profile.updateAddress": function() {
      failCommand("profile.updateAddress");
    },
    "profile.togglePref": function(id) {
      runCommand("profile.togglePref", id, function() {
        togglePref(id);
      });
    },
    "profile.edit": function() {
      var value = spaProfileValues();
      state.spaProfileDraft = { phone: value.phone, email: value.email, prefs: Object.assign({}, value.prefs) };
      state.spaProfileErrors = null;
      render();
    },
    "profile.changeField": function(id) {
      return spaProfileChange(id);
    },
    "profile.save": function() {
      return spaProfileSave();
    },
    "profile.reload": function() {
      clearSpaCommand("profile.save:profile");
      state.spaProfileDraft = null;
      state.spaProfileErrors = null;
      if (state.config.dataMode === "live") return reloadRuntimeModule("profile").then(function() {
        toast("Profile reloaded from Core");
      });
      render();
      toast("Profile reloaded \u2014 showing the details on file");
    },
    "profile.managePlan": function() {
      go("pricing");
    },
    "auth.signOut": function() {
      if (state.config.dataMode === "live") {
        state.oidc = "signing-out";
        render();
        return startCoreOidcSignOut(state.config).catch(function(error2) {
          state.oidc = "unavailable";
          state.commandErrors["auth.signOut"] = error2 && error2.message || "Sign-out failed";
          render();
          return false;
        });
      }
      state.session.authenticated = false;
      state.account = "session-expired";
      state.phone = "";
      state.code = "";
      invalidateCareRuntime();
      go("auth.oidc");
      toast("Signed out");
    },
    "calendar.open": function() {
      go("calendar");
    },
    "calendar.prev": function() {
      calShift(-1);
    },
    "calendar.next": function() {
      calShift(1);
    },
    "ui.retry": function(id) {
      return retrySpaOrRuntime(id);
    },
    "ui.toggleMode": function() {
      state.userModeOverridden = true;
      setState({ mode: state.mode === "Dark" ? "Light" : "Dark" });
    },
    "ui.toggleMobileNav": function() {
      setState({ mobileNav: !state.mobileNav, accountMenu: false });
    },
    "theme.pick": function(id) {
      return pickTheme(id);
    }
  };
  function validateSeoLink(el) {
    var href = el && el.getAttribute("href");
    if (!href || !(href.charAt(0) === "#" || /^https?:\/\//i.test(href) || /^tel:/i.test(href))) {
      throw new Error("SEO destination is unavailable");
    }
  }
  function navigateSeoServices(el, event) {
    validateSeoLink(el);
    if (state.route !== "seo.landing" || state.config.routerMode !== "hash") return;
    if (event) event.preventDefault();
    var target = document.getElementById("seo-services");
    if (target) target.scrollIntoView({ block: "start" });
  }
  function bindActions(root) {
    root.addEventListener("click", function(e) {
      var el = e.target.closest("[data-action]");
      if (!el || !root.contains(el)) return;
      if (el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true") return;
      var name = el.getAttribute("data-action");
      var id = el.getAttribute("data-id") || null;
      if (el.hasAttribute("data-requires-confirmation")) {
        if (!window.confirm("Are you sure?\n\n" + name + (id ? " \xB7 " + id : ""))) return;
      }
      var fn = ACTIONS[name];
      if (fn) {
        var result = fn(id, el, e);
        if (result && typeof result.then === "function") {
          Promise.resolve(result).catch(function() {
            render();
          });
        }
      } else failCommand(name);
    });
  }
  function failCommand(name) {
    console.warn("[aircove] command unavailable:", name);
    state.commandErrors[name] = "Command is not connected";
    toast(name + " is not connected yet");
  }
  function commandKey(name, id) {
    return name + ":" + (id || "_");
  }
  function runCommand(name, id, handler) {
    var key = commandKey(name, id);
    state.pending[key] = true;
    delete state.commandErrors[key];
    try {
      handler();
    } catch (error2) {
      state.commandErrors[key] = error2 && error2.message ? error2.message : "Command failed";
      toast(name + " failed");
    } finally {
      state.pending[key] = false;
      render();
    }
  }
  var spaCommandTimers = {};
  var spaLiveCommandFlights = /* @__PURE__ */ new Map();
  function runSpaCommand(key, onReadback, options2) {
    options2 = options2 || {};
    if (state.config.dataMode !== "fixture") {
      state.commands = Object.assign({}, state.commands, { [key]: "failed" });
      render();
      return false;
    }
    if (state.commands[key] === "pending") return false;
    clearTimeout(spaCommandTimers[key]);
    state.commands = Object.assign({}, state.commands, { [key]: "pending" });
    render();
    spaCommandTimers[key] = setTimeout(function() {
      var outcome = state.cmdForce || "succeeded";
      state.commands = Object.assign({}, state.commands);
      if (outcome === "session-lost") {
        delete state.commands[key];
        state.drawer = null;
        state.spaFlow = null;
        state.spaBookAck = false;
        state.account = "session-expired";
        render();
        return;
      }
      if (outcome !== "succeeded") {
        state.commands[key] = outcome;
        render();
        return;
      }
      delete state.commands[key];
      if (onReadback) onReadback();
      render();
      if (options2.toast) toast(options2.toast);
    }, options2.ms || 650);
    return true;
  }
  function runLiveSpaCommand(key, operation, onReadback, options2) {
    options2 = options2 || {};
    if (!spaCurrentApiDemoOpen()) return false;
    if (spaLiveCommandFlights.has(key)) return spaLiveCommandFlights.get(key);
    state.commands = Object.assign({}, state.commands, { [key]: "pending" });
    render();
    var flight = Promise.resolve().then(operation).then(function(result) {
      state.commands = Object.assign({}, state.commands);
      delete state.commands[key];
      if (onReadback) onReadback(result);
      if (options2.toast) toast(options2.toast);
      return result;
    }).catch(function(error2) {
      state.commands = Object.assign({}, state.commands, {
        [key]: error2 && error2.code === "conflict" ? "conflict" : "failed"
      });
      if (error2 && error2.code === "session-expired") {
        delete state.commands[key];
        state.drawer = null;
        state.spaFlow = null;
        state.spaBookAck = false;
        state.account = "session-expired";
      }
      console.error("[aircove] live SPA command failed", key, error2);
      return false;
    }).finally(function() {
      spaLiveCommandFlights.delete(key);
      render();
    });
    spaLiveCommandFlights.set(key, flight);
    return flight;
  }
  function spaLiveAdapter() {
    return createCoreSpaDemoAdapter();
  }
  function spaLiveContext() {
    return { config: state.config, state };
  }
  function spaLines() {
    return state.spaCart && state.spaCart.lines || [];
  }
  function spaSetLines(lines) {
    state.spaCart = F.spaServerCart(lines);
  }
  function spaAddLine(code) {
    if (!spaRetailOpen()) return;
    if (spaCurrentApiDemoOpen()) {
      var liveProduct = productItems().find(function(item) {
        return item.code === code;
      });
      if (!liveProduct || !Number.isFinite(Number(liveProduct.priceNum))) return;
      var liveRef = "cln-" + String(code).toLowerCase().replace(/[^a-z0-9]+/g, "-");
      var liveLines = spaLines().slice();
      var liveExisting = liveLines.find(function(line) {
        return line.ref === liveRef;
      });
      if (liveExisting) liveLines = liveLines.map(function(line) {
        return line.ref === liveRef ? Object.assign({}, line, { qty: line.qty + 1 }) : line;
      });
      else liveLines.push({ ref: liveRef, code, variantRef: null, title: liveProduct.name, variant: null, qty: 1, cents: Math.round(Number(liveProduct.priceNum) * 100) });
      spaSetLines(liveLines);
      return;
    }
    var retail = F.spaCommerce.retail.products.find(function(product2) {
      return product2.code === code;
    });
    var product = F.themes.Beauty.products.find(function(item) {
      return item.code === code;
    });
    if (!retail || !product) return;
    var variant = retail.variants && retail.variants.find(function(item) {
      return item.ref === state.spaVariantPick[code];
    });
    if (retail.variants && !variant) return;
    var lineRef = "cln-" + code.replace("rtl-beauty-", "") + (variant ? "-" + variant.ref.split("-").pop() : "");
    var lines = spaLines().slice();
    var existing = lines.find(function(line) {
      return line.ref === lineRef;
    });
    if (existing) lines = lines.map(function(line) {
      return line.ref === lineRef ? Object.assign({}, line, { qty: line.qty + 1 }) : line;
    });
    else lines.push({ ref: lineRef, code, variantRef: variant ? variant.ref : null, title: product.name, variant: variant ? variant.label : null, qty: 1, cents: variant ? variant.cents : retail.cents });
    spaSetLines(lines);
  }
  function spaChangeQuantity(id) {
    var parts = String(id || "").split("|");
    var ref = parts[0];
    var qty = Math.max(0, Number(parts[1] || 0));
    if (spaCurrentApiDemoOpen()) {
      spaSetLines(qty === 0 ? spaLines().filter(function(line) {
        return line.ref !== ref;
      }) : spaLines().map(function(line) {
        return line.ref === ref ? Object.assign({}, line, { qty }) : line;
      }));
      render();
      return true;
    }
    return runSpaCommand("cart.changeQuantity:" + ref, function() {
      spaSetLines(qty === 0 ? spaLines().filter(function(line) {
        return line.ref !== ref;
      }) : spaLines().map(function(line) {
        return line.ref === ref ? Object.assign({}, line, { qty }) : line;
      }));
      if (state.spaCartDemo === "inventory-conflict" && qty <= 1) state.spaCartDemo = "as-added";
    });
  }
  var spaPurchMoreTimer;
  function spaLoadMore() {
    if (state.spaPurchMore !== "idle") return;
    state.spaPurchMore = "loading";
    render();
    clearTimeout(spaPurchMoreTimer);
    spaPurchMoreTimer = setTimeout(function() {
      state.spaPurchMore = "loaded";
      render();
    }, 650);
  }
  function spaCheckoutStart(source) {
    if (source !== "plan" && (state.spaCartDemo === "stale-price" || state.spaCartDemo === "inventory-conflict")) return false;
    if (source === "plan" && !state.spaPlanOffer) state.spaPlanOffer = "off-pkg-4c21";
    state.spaCheckoutSource = source === "plan" ? "plan" : "cart";
    state.spaResult = null;
    state.spaPolicyAck = false;
    state.spaCheckoutDemo = "ready";
    delete state.commands["checkout.confirm:" + F.spaCommerce.checkout.ref];
    go("checkout");
    return true;
  }
  function spaConfirmCheckout() {
    var commerceOpen = state.spaCheckoutSource === "plan" ? spaPlanSellOpen() : spaRetailOpen();
    if (!commerceOpen || state.spaCheckoutDemo !== "ready" || !state.spaPolicyAck) return false;
    var key = "checkout.confirm:" + F.spaCommerce.checkout.ref;
    if (spaCurrentApiDemoOpen()) {
      var lines = state.spaCheckoutSource === "plan" ? [] : spaLines();
      var requestRef = F.spaCommerce.checkout.ref + "-" + state.spaCheckoutSource + "-" + (state.spaCheckoutSource === "plan" ? state.spaPlanOffer || "offer" : lines.map(function(line) {
        return line.ref + "x" + line.qty;
      }).sort().join("-"));
      var amounts = spaLiveCheckoutAmounts();
      return runLiveSpaCommand(key, function() {
        return spaLiveAdapter().createOrder({ requestRef, total: amounts.total, taxes: amounts.taxes }, spaLiveContext()).then(function(order) {
          return reloadRuntimeModule("orders").then(function() {
            return order;
          });
        });
      }, function(order) {
        state.spaResult = {
          kind: "purchase",
          headline: "Order confirmed",
          sub: "The order was recorded in Core. This demo did not take a payment.",
          purchase: { ref: order.ref, reference: order.ref },
          fulfillment: "Pickup at Harbor Front studio"
        };
        if (state.spaCheckoutSource === "cart") {
          state.spaCart = F.spaServerCart([]);
          state.spaCartDemo = "as-added";
        }
      }, { toast: "Order created \u2014 confirmed by Core" });
    }
    return runSpaCommand(key, function() {
      if (state.spaCheckoutSource === "plan") {
        var offer = F.spaCommerce.planOffers.find(function(item) {
          return item.ref === state.spaPlanOffer;
        });
        state.spaResult = offer && offer.kind === "MEMBERSHIP" ? F.spaCommerce.confirmations.membership : F.spaCommerce.confirmations.plan;
      } else state.spaResult = F.spaCommerce.confirmations.retail;
      if (state.spaCheckoutSource === "cart") {
        state.spaCart = F.spaServerCart([]);
        state.spaCartDemo = "as-added";
      }
    }, { ms: 900 });
  }
  function spaBookingConfirm() {
    if (state.capability !== "target-appointments" || state.spaBooking !== "open" || state.spaHold !== "held") return false;
    var flow = state.spaFlow;
    var key = flow ? "booking.confirm:" + F.spaBooking.ref : "booking.confirm:booking";
    if (flow && (!flow.held || !state.spaBookAck || flow.entry === "credit" && state.spaCredit !== "ok")) return false;
    if (flow && spaCurrentApiDemoOpen()) {
      var service = state.config.dataMode === "live" ? (state.moduleData.pricing && state.moduleData.pricing.rates || []).find(function(item) {
        return item.code === flow.serviceCode;
      }) : F.spa.pim.services.find(function(item) {
        return item.code === flow.serviceCode;
      });
      var input = {
        requestRef: F.spaBooking.ref + "-" + (flow.slotRef || "slot") + "-" + (flow.serviceCode || "service"),
        serviceName: service && service.name || "Spa appointment",
        start: spaSlotIso(flow.slotRef),
        durationMinutes: 60
      };
      var command = flow.entry === "reschedule" && flow.rescheduleOf ? spaLiveAdapter().rescheduleAppointment.bind(null, flow.rescheduleOf, input, spaLiveContext()) : spaLiveAdapter().createAppointment.bind(null, input, spaLiveContext());
      return runLiveSpaCommand(key, function() {
        return command().then(function(appointment) {
          return reloadRuntimeModule("appointments").then(function() {
            return appointment;
          });
        });
      }, function(appointment) {
        state.spaResult = {
          kind: "appointment",
          headline: flow.entry === "reschedule" ? "Booking updated" : "Booking confirmed",
          sub: "The appointment was recorded in Core. No payment was taken.",
          appointment: { ref: appointment.ref, service: appointment.service, start: appointment.start }
        };
        if (flow.entry === "reschedule" && flow.rescheduleOf) {
          state.spaRescheduled = Object.assign({}, state.spaRescheduled, { [flow.rescheduleOf]: { start: appointment.start } });
        }
        state.spaCurrentAppointment = appointment.ref;
        state.drawer = null;
        state.spaFlow = null;
        state.spaBookAck = false;
        state.route = "checkout";
        writeRouteToLocation("checkout");
      }, { toast: flow.entry === "reschedule" ? "Appointment moved \u2014 confirmed by Core" : "Appointment booked \u2014 confirmed by Core" });
    }
    return runSpaCommand(key, function() {
      state.spaResult = flow ? spaFlowResult() : F.spaCommerce.confirmations[state.spaBookResult] || F.spaCommerce.confirmations["appointment-only"];
      if (flow && flow.entry === "reschedule" && flow.rescheduleOf) {
        state.spaRescheduled = Object.assign({}, state.spaRescheduled, { [flow.rescheduleOf]: { start: spaSlotLabel() } });
      }
      state.drawer = null;
      state.spaFlow = null;
      state.spaBookAck = false;
      state.route = "checkout";
      writeRouteToLocation("checkout");
    }, { ms: 900 });
  }
  function clearSpaCommand(key) {
    if (!state.commands[key]) return;
    state.commands = Object.assign({}, state.commands);
    delete state.commands[key];
  }
  function spaFlowCapable() {
    return isSpa() && state.capability === "target-appointments" && state.spaBooking === "open";
  }
  function openSpaFlow(config) {
    if (!spaFlowCapable()) return false;
    clearSpaCommand("booking.confirm:" + F.spaBooking.ref);
    Object.keys(state.commands).forEach(function(key) {
      if (key.indexOf("booking.hold:") === 0) clearSpaCommand(key);
    });
    var flow = {
      entry: config.entry,
      step: "context",
      serviceCode: config.serviceCode || null,
      planRef: config.planRef || null,
      specialistRef: null,
      dayKey: F.spaBooking.days[0].key,
      slotRef: null,
      rescheduleOf: config.rescheduleOf || null,
      held: false
    };
    if (config.entry === "reschedule" && config.rescheduleOf) state.spaCurrentAppointment = config.rescheduleOf;
    if (config.fromAppt) {
      state.spaCurrentAppointment = config.fromAppt;
      var source = state.config.dataMode === "live" ? currentAppointment() : F.spaCommerce.appointmentDetails[config.fromAppt];
      if (source) flow.serviceCode = state.config.dataMode === "live" ? ((state.moduleData.pricing && state.moduleData.pricing.rates || []).find(function(item) {
        return item.name === source.service;
      }) || {}).code || null : F.spaBooking.serviceForTitle[source.service] || null;
    }
    if (config.entry === "reschedule" && flow.rescheduleOf) {
      var appointment = state.config.dataMode === "live" ? currentAppointment() : F.spaCommerce.appointmentDetails[flow.rescheduleOf];
      if (appointment) flow.serviceCode = state.config.dataMode === "live" ? ((state.moduleData.pricing && state.moduleData.pricing.rates || []).find(function(item) {
        return item.name === appointment.service;
      }) || {}).code || null : F.spaBooking.serviceForTitle[appointment.service] || null;
      flow.step = "slots";
    }
    if (config.entry === "credit") flow.serviceCode = "svc-spa-03";
    state.spaFlow = flow;
    state.spaBookAck = false;
    state.spaHold = "held";
    state.drawer = "booking";
    state.mobileNav = false;
    state.accountMenu = false;
    render();
    return true;
  }
  function spaFlowAfterService(flow) {
    flow.step = (F.spaBooking.eligibleSpecialists[flow.serviceCode] || []).length ? "specialist" : "slots";
  }
  function spaHoldSlot(slotRef) {
    var flow = state.spaFlow;
    if (!flow || !slotRef || state.spaSlots !== "ready") return false;
    flow.slotRef = slotRef;
    if (spaCurrentApiDemoOpen()) {
      flow.held = true;
      flow.step = "review";
      state.spaHold = "held";
      render();
      return true;
    }
    return runSpaCommand("booking.hold:" + slotRef, function() {
      flow.held = true;
      flow.step = "review";
      state.spaHold = "held";
    }, { ms: 900 });
  }
  function spaSlotLabel() {
    var flow = state.spaFlow;
    if (!flow) return "";
    for (var index = 0; index < F.spaBooking.days.length; index += 1) {
      var day = F.spaBooking.days[index];
      var slot = (day.slots || []).find(function(item) {
        return item.ref === flow.slotRef;
      });
      if (slot) return day.label + " \xB7 " + slot.label;
    }
    var fallback = F.spaBooking.days.find(function(item) {
      return item.key === flow.dayKey;
    }) || F.spaBooking.days[0];
    return fallback.label;
  }
  function spaSlotIso(slotRef) {
    var match = String(slotRef || "").match(/^sl-(\d{2})(\d{2})-(\d{1,4})$/);
    if (!match) throw new Error("Selected appointment time is invalid");
    var month = Number(match[1]);
    var day = Number(match[2]);
    var compact = match[3].padStart(2, "0");
    var hour = compact.length <= 2 ? Number(compact) : Number(compact.slice(0, -2));
    var minute = compact.length <= 2 ? 0 : Number(compact.slice(-2));
    var year = Number(state.config.demoCalendarYear) || 2026;
    return new Date(Date.UTC(year, month - 1, day, hour + 5, minute)).toISOString();
  }
  function spaLiveCheckoutAmounts() {
    if (state.spaCheckoutSource === "plan") {
      var offer = spaPlanOffers().find(function(item) {
        return item.ref === state.spaPlanOffer;
      });
      if (offer && Number.isFinite(Number(offer.amount))) return { total: Number(offer.amount), taxes: 0 };
      if (offer && Number.isFinite(Number(offer.cents))) return { total: Number(offer.cents) / 100, taxes: 0 };
      var match = offer && String(offer.displayPrice || "").replace(/,/g, "").match(/\d+(?:\.\d+)?/);
      return { total: match ? Number(match[0]) : 0, taxes: 0 };
    }
    var subtotalCents = spaLines().reduce(function(sum, line) {
      return sum + Number(line.cents || 0) * Number(line.qty || 0);
    }, 0);
    var taxCents = Math.round(subtotalCents * 0.08);
    return { total: (subtotalCents + taxCents) / 100, taxes: taxCents / 100 };
  }
  function spaFlowResult() {
    var flow = state.spaFlow;
    var confirmations = F.spaCommerce.confirmations;
    var service = F.spa.pim.services.find(function(item) {
      return flow && item.code === flow.serviceCode;
    }) || null;
    var start = spaSlotLabel();
    var stamp = function(base, ref) {
      return Object.assign({}, base, { appointment: Object.assign({}, base.appointment, {
        ref: ref || base.appointment.ref,
        service: service ? service.name : base.appointment.service,
        start: start || base.appointment.start
      }) });
    };
    if (flow.entry === "reschedule") return stamp(confirmations.reschedule, flow.rescheduleOf);
    if (flow.entry === "credit") return stamp(confirmations.credit, null);
    return stamp(confirmations[state.spaBookResult] || confirmations["appointment-only"], null);
  }
  function spaApptCancel(id) {
    return runSpaCommand("order.cancel:" + id, function() {
      state.spaCancelled = Object.assign({}, state.spaCancelled, { [id]: true });
    }, { toast: "Appointment cancelled \u2014 confirmed" });
  }
  function spaProfileChange(id) {
    var confirmed = spaProfileValues();
    var draft = state.spaProfileDraft || { phone: confirmed.phone, email: confirmed.email, prefs: Object.assign({}, confirmed.prefs) };
    state.spaProfileDraft = draft;
    var value = String(id || "");
    if (value.indexOf("pref:") === 0) {
      var key = value.slice(5);
      draft.prefs = Object.assign({}, draft.prefs, { [key]: !draft.prefs[key] });
      render();
      return true;
    }
    var separator = value.indexOf("|");
    if (separator === -1) return false;
    draft[value.slice(0, separator)] = value.slice(separator + 1);
    return true;
  }
  function spaProfileSave() {
    if (cmdPhase("profile.save:profile") === "conflict") return false;
    var draft = state.spaProfileDraft || spaProfileValues();
    var errors = {};
    if (draft.phone != null && (draft.phone || "").replace(/\D/g, "").length < 7) errors.phone = "Enter a valid phone number";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(draft.email || "")) errors.email = "Enter a valid email address";
    if (Object.keys(errors).length) {
      setState({ spaProfileErrors: errors });
      return false;
    }
    state.spaProfileErrors = null;
    if (spaCurrentApiDemoOpen()) {
      return runLiveSpaCommand("profile.save:profile", function() {
        return createCoreUserProfileAdapter().save({ email: draft.email }, spaLiveContext()).then(function(profile) {
          return reloadRuntimeModule("profile").then(function() {
            return profile;
          });
        });
      }, function() {
        state.spaProfileDraft = null;
      }, { toast: "Profile email saved \u2014 confirmed by Core" });
    }
    return runSpaCommand("profile.save:profile", function() {
      state.spaProfile = { phone: draft.phone, email: draft.email, prefs: Object.assign({}, draft.prefs) };
      state.spaProfileDraft = null;
    }, { toast: "Profile saved \u2014 confirmed" });
  }
  function spaBuyAgain() {
    var purchase = currentPurchase();
    if (!purchase) return false;
    if (purchase.kind === "PACKAGE" || purchase.kind === "MEMBERSHIP") return spaCheckoutStart("plan");
    if (!spaRetailOpen()) return false;
    return runSpaCommand("purchase.buyAgain:" + purchase.ref, function() {
      purchase.lines.forEach(function(line) {
        var product = F.themes.Beauty.products.find(function(item) {
          return item.name === line.title;
        });
        if (product) spaAddLine(product.code);
      });
      state.route = "cart";
      writeRouteToLocation("cart");
    });
  }
  function retrySpaOrRuntime(id) {
    if (id === "cart-quote") {
      state.spaCartDemo = "as-added";
      spaSetLines(spaLines());
      render();
      return true;
    }
    if (id === "checkout-quote") {
      setState({ spaCheckoutDemo: "ready" });
      return true;
    }
    if (id === "booking-hold") {
      setState({ spaHold: "held" });
      return true;
    }
    if (id === "slots") {
      setState({ spaSlots: "ready" });
      return true;
    }
    if (id === "plan-offers") {
      setState({ spaOfferDemo: "sellable" });
      return true;
    }
    if (id === "plan-credit") {
      setState({ spaCredit: "ok" });
      return true;
    }
    if (id && state.commands[id]) {
      state.commands = Object.assign({}, state.commands);
      delete state.commands[id];
      render();
      return true;
    }
    return retryRuntimeLoad();
  }
  function careEntityScope(name, id, element, content) {
    if (name === "care.selectUnit") return content.units && content.units.find(function(item) {
      return item.id === id;
    });
    if (name === "care.download" || name === "care.openSecureDoc") {
      return content.docs && content.docs.find(function(item) {
        return item.id === id;
      });
    }
    if (name === "care.selectSpecialist") {
      return content.specialists && content.specialists.find(function(item) {
        return item.id === id;
      });
    }
    if (name === "care.completeTask") return content.tasks && content.tasks.find(function(item) {
      return item.id === id;
    });
    if (name === "care.contactProvider") return content.provider && content.provider.id === id ? content.provider : null;
    if (name === "care.requestRetreat") {
      var scope = content.guarantee && content.guarantee.scope;
      var propertyId = element && element.getAttribute("data-property-id");
      var serviceId = element && element.getAttribute("data-service-id");
      return scope && scope.planId === id && scope.propertyId === propertyId && scope.serviceId === serviceId ? scope : null;
    }
    return null;
  }
  function authorizeCareCommand(name, id, element, expected) {
    var envelope2 = state.moduleData.care;
    var enabled = (state.config.enabledModules || []).includes("care");
    var authenticated = state.session && state.session.authenticated === true;
    var scoped = state.session && state.session.hasCustomerScope === true && state.session.hasTenantScope === true;
    var entitled = state.access && state.access.care && state.access.care.status === "granted";
    var fixtureReady = state.config.dataMode === "fixture" && envelope2 && envelope2.id === "care" && envelope2.phase === "payload" && envelope2.state === "ready" && envelope2.access && envelope2.access.status === "granted" && envelope2.content && Array.isArray(envelope2.allowedActions);
    var currentVertical = fixtureReady && envelope2.vertical === state.config.vertical && state.careStateVertical === state.config.vertical;
    var actionAllowed = fixtureReady && envelope2.allowedActions.includes(name);
    var entity = fixtureReady ? careEntityScope(name, id, element, envelope2.content) : null;
    var epoch = state.careAuthorizationEpoch || 0;
    var expectedCurrent = !expected || expected.epoch === epoch && expected.vertical === state.config.vertical && expected.entityId === id;
    if (!enabled || !authenticated || !scoped || !entitled || !fixtureReady || !currentVertical || !expectedCurrent) {
      var authorizationError = new Error("Care command is not authorized for the current portal state");
      authorizationError.careAuthorizationFailure = true;
      throw authorizationError;
    }
    if (!entity) throw new Error("Care command target is invalid or no longer current");
    if (!actionAllowed) throw new Error("Care command is unavailable");
    return { envelope: envelope2, content: envelope2.content, entity, epoch, vertical: state.config.vertical, entityId: id };
  }
  function clearGeneralCareCommandErrors() {
    for (const key of Object.keys(state.commandErrors || {})) {
      if (key.startsWith("care.") && key.endsWith(":_")) delete state.commandErrors[key];
    }
  }
  function runCareCommand(name, id, element, mutation) {
    try {
      var authorization = authorizeCareCommand(name, id, element);
      clearGeneralCareCommandErrors();
      delete state.commandErrors[commandKey(name, id)];
      mutation(authorization);
      render();
      return true;
    } catch (error2) {
      return failCareMutation(name, id, error2);
    }
  }
  function runUnavailableCareCommand(name, id, element) {
    return runCareCommand(name, id, element, function() {
      throw new Error("Care command is unavailable");
    });
  }
  function selectCareUnit(id, element) {
    return runCareCommand("care.selectUnit", id, element, function() {
      state.careSelectedUnitId = id;
    });
  }
  function selectCareSpecialist(id, element) {
    return runCareCommand("care.selectSpecialist", id, element, function() {
      state.careSelectedSpecialistId = id;
    });
  }
  function toggleCareTask(id, element) {
    return runCareCommand("care.completeTask", id, element, function(authorization) {
      var task = authorization.entity;
      var current = Object.prototype.hasOwnProperty.call(state.careTasksDone, id) ? state.careTasksDone[id] : !!task.done;
      state.careTasksDone = Object.assign({}, state.careTasksDone, { [id]: !current });
    });
  }
  function downloadCareDocument(id, element) {
    return runUnavailableCareCommand("care.download", id, element);
  }
  var careRetreatFlights = /* @__PURE__ */ new Map();
  function failCareMutation(name, id, error2) {
    var key = commandKey(name, error2 && error2.careAuthorizationFailure ? null : id);
    state.commandErrors[key] = error2 && error2.message ? error2.message : "Command failed";
    delete state.pending[key];
    render();
    toast(name + " failed");
    return false;
  }
  function requestCareRetreat(id, element) {
    var name = "care.requestRetreat";
    var key = commandKey(name, id);
    var authorization;
    try {
      authorization = authorizeCareCommand(name, id, element);
      clearGeneralCareCommandErrors();
      if (state.careRetreatRequests[id] && state.careRetreatRequests[id].status === "submitted") {
        throw new Error("Care re-treatment request is already submitted");
      }
    } catch (error2) {
      return Promise.resolve(failCareMutation(name, id, error2));
    }
    if (careRetreatFlights.has(key)) return careRetreatFlights.get(key);
    delete state.commandErrors[key];
    state.pending[key] = true;
    state.careRetreatRequests = Object.assign({}, state.careRetreatRequests, {
      [id]: { planId: authorization.entity.planId, propertyId: authorization.entity.propertyId, serviceId: authorization.entity.serviceId, status: "submitting" }
    });
    render();
    var flight = Promise.resolve().then(function() {
      authorizeCareCommand(name, id, element, authorization);
      state.careRetreatRequests = Object.assign({}, state.careRetreatRequests, {
        [id]: { planId: authorization.entity.planId, propertyId: authorization.entity.propertyId, serviceId: authorization.entity.serviceId, status: "submitted" }
      });
      return state.careRetreatRequests[id];
    }).catch(function(error2) {
      if (state.careAuthorizationEpoch === authorization.epoch) {
        var requests = Object.assign({}, state.careRetreatRequests);
        delete requests[id];
        state.careRetreatRequests = requests;
        delete state.pending[key];
        if (error2 && error2.careAuthorizationFailure) delete state.commandErrors[key];
        else state.commandErrors[key] = error2 && error2.message ? error2.message : "Care re-treatment request failed";
      }
      return false;
    }).finally(function() {
      if (state.careAuthorizationEpoch === authorization.epoch) delete state.pending[key];
      careRetreatFlights.delete(key);
      render();
    });
    careRetreatFlights.set(key, flight);
    return flight;
  }
  function setState(patch) {
    Object.assign(state, patch);
    render();
  }
  function go(route) {
    var resolved = resolveRoute(route);
    state.route = resolved.id;
    state.mobileNav = false;
    state.accountMenu = false;
    if (state.drawer) {
      state.drawer = null;
      state.spaFlow = null;
      state.spaBookAck = false;
    }
    writeRouteToLocation(resolved.id);
    render();
  }
  function openOrder(id) {
    if (!orderItems().some(function(order) {
      return order.id === id;
    })) throw new Error("Order not found");
    state.currentOrderId = id;
    state.view = "ready";
    go("order.detail");
  }
  function cancelOrder(id) {
    var order = state.orders.find(function(o) {
      return o.id === id;
    });
    if (!order) throw new Error("Order not found");
    if (order.status === "completed" || order.status === "cancelled") throw new Error("Order cannot be cancelled");
    state.orders = state.orders.map(function(o) {
      return o.id === id ? Object.assign({}, o, { status: "cancelled" }) : o;
    });
    render();
    toast("Visit " + id + " cancelled");
  }
  function setCart(items) {
    state.cartItems = items;
    render();
  }
  function addToCart(name) {
    var p = findProduct(name);
    if (!p) throw new Error("Product not found");
    var existing = state.cartItems.find(function(x) {
      return x.name === name;
    });
    if (existing) state.cartItems = state.cartItems.map(function(x) {
      return x.name === name ? Object.assign({}, x, { qty: x.qty + 1 }) : x;
    });
    else state.cartItems = state.cartItems.concat([Object.assign({}, p, { qty: 1 })]);
    render();
    toast(name + " added to cart");
  }
  function changeQty(name, delta) {
    if (!state.cartItems.some(function(x) {
      return x.name === name;
    })) throw new Error("Cart item not found");
    state.cartItems = state.cartItems.map(function(x) {
      return x.name === name ? Object.assign({}, x, { qty: x.qty + delta }) : x;
    }).filter(function(x) {
      return x.qty > 0;
    });
    render();
  }
  function removeCartItem(name) {
    if (!state.cartItems.some(function(x) {
      return x.name === name;
    })) throw new Error("Cart item not found");
    setCart(state.cartItems.filter(function(x) {
      return x.name !== name;
    }));
  }
  function selectAddress(id) {
    if (!currentFixture().addresses.some(function(address) {
      return address.id === id;
    })) throw new Error("Address not found");
    setState({ addrId: id });
  }
  function selectPayment(id) {
    if (!currentFixture().cards.some(function(card) {
      return card.id === id;
    })) throw new Error("Payment method not found");
    setState({ payId: id });
  }
  function pickThemeResetCart() {
    state.cartItems = [];
    state.prodCat = "all";
  }
  function signIn() {
    var nextRoute = state.session.intendedRoute || "orders.list";
    state.session.authenticated = true;
    state.session.intendedRoute = null;
    state.authError = null;
    state.code = "";
    go(nextRoute);
    toast("Signed in");
  }
  function validatePhone() {
    var digits = (state.phone || "").replace(/\D/g, "");
    if (digits.length < 6) {
      setState({ authError: "Enter a valid phone number" });
      return;
    }
    state.authError = null;
    state.code = "";
    go("auth.code");
  }
  function validateCode() {
    if ((state.code || "").length < 4) {
      setState({ authError: "Enter all 4 digits" });
      return;
    }
    signIn();
  }
  function togglePref(key) {
    if (["receipts", "sms", "marketing"].indexOf(key) === -1) throw new Error("Preference not found");
    state.prefs = Object.assign({}, state.prefs, {});
    state.prefs[key] = !state.prefs[key];
    render();
    toast("Preference updated in fixture state");
  }
  function calShift(delta) {
    var m = state.calMonth + delta, y = state.calYear;
    if (m < 0) {
      m = 11;
      y--;
    } else if (m > 11) {
      m = 0;
      y++;
    }
    setState({ calMonth: m, calYear: y });
  }
  function feedAction(act) {
    if (act === "orders") {
      var o = state.orders.find(function(x) {
        return x.status === "inprogress";
      }) || state.orders[0];
      openOrder(o.id);
    } else if (act === "products") go("products");
    else if (act === "pricing") go("pricing");
    else if (act === "care") go("care");
    else if (act === "book") openDrawer("booking");
    else if (act === "invoice") toast("Invoice #SV-2381 emailed to you");
    else if (act === "weather") {
      var w = state.orders.find(function(x) {
        return x.wt && x.wt.status === "pending";
      });
      if (w) openOrder(w.id);
    }
  }
  function pushChat(text5) {
    if (!text5 || !text5.trim()) throw new Error("Message is empty");
    state.messages = state.messages.concat([{ from: "user", text: text5.trim() }]);
    state.chatInput = "";
    if (state.route !== "support") state.route = "support";
    toast("Message queued in fixture state");
  }
  function sendChat() {
    pushChat(state.chatInput);
  }
  function confirmAccess(id) {
    var key = id || "";
    var cal = F.stormCalendar(state.theme);
    if (!cal.days.some(function(day) {
      return day.needsAccess && day.dateSub === key;
    })) throw new Error("Access confirmation target not found");
    state.accessConfirmations[key] = true;
    toast("Access confirmed in fixture state");
  }
  function requestExtraService(id) {
    state.serviceRequests = state.serviceRequests.concat([{ id: id || "extra", status: "draft" }]);
    openDrawer("booking");
  }
  function placeFixtureOrder() {
    if (!state.cartItems.length) throw new Error("Cart is empty");
    var first = state.cartItems[0];
    var total = state.cartItems.reduce(function(sum, item) {
      return sum + item.priceNum * item.qty;
    }, 0);
    var palette = F.PAL[0];
    var fixture = currentFixture();
    var order = {
      id: fixture.id === "calm-harbor-spa" ? "#CHS-R-" + String(200 + state.nextFixtureOrder++) : "FX-" + String(state.nextFixtureOrder++).padStart(3, "0"),
      status: "scheduled",
      name: first.name,
      date: "Jan 22",
      price: "$" + total.toLocaleString(),
      dot: palette[0],
      iconBg: palette[1],
      serviceName: first.name,
      y: 2026,
      m: 0,
      d: 22,
      slot: "10:00 AM",
      locationId: state.addrId,
      total,
      timeline: ["Order placed in fixture state", "Awaiting dispatch"]
    };
    state.orders = [order].concat(state.orders);
    setCart([]);
    go("orders.list");
    toast("Order placed in fixture state");
  }
  function openProposal(id) {
    if (!proposalSites().some(function(p) {
      return p.id === id;
    })) throw new Error("Proposal not found");
    state.currentSiteId = id;
    state.psites = state.psites.map(function(p) {
      return p.id === id && p.status === "unseen" ? Object.assign({}, p, { status: "viewed" }) : p;
    });
    go("proposal.detail");
  }
  function selectPlan(planId) {
    if (!planId) throw new Error("Plan is required");
    if (!proposalSites().some(function(p) {
      return p.id === state.currentSiteId;
    })) throw new Error("Proposal not found");
    if (["897", "898", "899"].indexOf(planId) === -1) throw new Error("Proposal plan not found");
    state.psites = state.psites.map(function(p) {
      return p.id === state.currentSiteId ? Object.assign({}, p, { selected: planId }) : p;
    });
    render();
  }
  function decideSite(status) {
    if (["approved", "revision", "declined"].indexOf(status) === -1) throw new Error("Unsupported proposal status");
    var id = state.currentSiteId;
    if (!proposalSites().some(function(p) {
      return p.id === id;
    })) throw new Error("Proposal not found");
    state.psites = state.psites.map(function(p) {
      return p.id === id ? Object.assign({}, p, { status }) : p;
    });
    go("proposals.list");
    toast(status === "approved" ? "Plan approved in fixture state" : status === "revision" ? "Revision requested in fixture state" : "Proposal declined in fixture state");
  }
  function pickTheme(name) {
    var slug2 = normalizeVertical(name);
    var profile = verticalProfiles[slug2];
    state.config.vertical = slug2;
    state.config.theme = slug2;
    state.config.profile = profile.profile;
    state.config.defaultRoute = profile.defaultRoute;
    state.config.enabledModules = profile.modules.slice();
    state.config.caseId = "";
    state.theme = profile.displayName;
    state.orders = F.ordersFor(profile.displayName);
    state.filter = "all";
    state.drawer = null;
    state.spaFlow = null;
    state.spaBookAck = false;
    state.spaCurrentAppointment = null;
    state.spaPlanOffer = null;
    state.spaRescheduled = {};
    state.spaProfile = null;
    state.spaProfileDraft = null;
    state.spaProfileErrors = null;
    for (const moduleId of Object.keys(state.moduleData || {})) {
      if (moduleId !== "auth") delete state.moduleData[moduleId];
    }
    for (const moduleId of Object.keys(state.moduleStatus || {})) {
      if (moduleId !== "auth") delete state.moduleStatus[moduleId];
    }
    pickThemeResetCart();
    var resolved = resolveRoute(state.route);
    state.route = resolved.id;
    writeRouteToLocation(resolved.id);
    return reloadCareRuntime();
  }
  function confirmWeather(id, decision) {
    if (["confirmed", "declined"].indexOf(decision) === -1) throw new Error("Unsupported weather decision");
    var order = state.orders.find(function(o) {
      return o.id === id && o.wt;
    });
    if (!order) throw new Error("Weather-triggered order not found");
    state.orders = state.orders.map(function(o) {
      if (o.id === id && o.wt) return Object.assign({}, o, { wt: Object.assign({}, o.wt, { status: decision }) });
      return o;
    });
    render();
    toast(decision === "confirmed" ? "Visit confirmed" : "Visit declined");
  }
  function openDrawer(name) {
    state.drawer = name;
    render();
  }
  function closeDrawer() {
    state.drawer = null;
    render();
  }
  var toastTimer;
  function toast(msg) {
    state.toast = msg;
    render();
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function() {
      state.toast = null;
      render();
    }, 2600);
  }

  // app-templates/customer-portal/runtime/src/components/commerce/ServiceCard.js
  function ServiceCard(svc, i) {
    var pal = F.PAL[i % 4];
    return h("div", {
      "class": "svc-row",
      "data-module": "service-card",
      "data-visual-id": "service-card",
      "data-action": "booking.open",
      "data-id": svc.name
    }, [
      h("div", { "class": "svc-row__icon", style: "background:" + pal[1] }, h("i", { style: "background:" + pal[0] })),
      h("div", { "class": "svc-row__name", "data-bind": "service.name" }, svc.name),
      h("div", { "class": "svc-row__price", "data-bind": "service.price" }, svc.price)
    ]);
  }
  function ServiceCatalogCard(svc, i) {
    var pal = F.PAL[i % 4];
    var price = svc.price === "Quote" ? "Free quote" : "from " + svc.price;
    return h("div", { "class": "service-catalog-card", "data-module": "service-catalog-card", "data-visual-id": "service-catalog-card" }, [
      h("div", { "class": "scc__head" }, [
        h("div", { "class": "scc__icon", style: "background:" + pal[1] }, h("i", { style: "background:" + pal[0] })),
        h("div", { style: "flex:1" }, [
          h("div", { "class": "scc__name", "data-bind": "service.name" }, svc.name),
          h("div", { "class": "scc__tagline", "data-bind": "service.tagline" }, svc.tagline)
        ]),
        h("div", { "class": "scc__price" }, [h("b", { "data-bind": "service.price" }, price), h("span", { "data-bind": "service.duration" }, svc.duration)])
      ]),
      h("div", { "class": "includes" }, svc.includes.map(function(inc) {
        return h("div", { "class": "include-item" }, [h("span", { "class": "check" }, "\u2713"), inc]);
      })),
      h("div", { "class": "scc__actions" }, [
        ActionButton({ variant: "btn--primary", label: "Book now", action: "booking.open", id: svc.name, block: true, lg: true, visualId: "scc-book" }),
        ActionButton({ variant: "btn--ghost", label: "Details", action: "nav.go", id: "pricing", lg: true, visualId: "scc-details" })
      ])
    ]);
  }

  // app-templates/customer-portal/runtime/src/components/orders/OrderCard.js
  function OrderCard(order) {
    var statusMeta = currentFixture().statusMeta;
    var meta = statusMeta[order.status] || statusMeta.scheduled;
    return h("article", {
      "class": "order-card",
      "data-module": "order-card",
      "data-visual-id": "order-card",
      "data-action": "order.open",
      "data-id": order.id
    }, [
      h(
        "div",
        { "class": "order-card__icon", style: "background:" + order.iconBg },
        h("i", { style: "background:" + order.dot })
      ),
      h("div", { "class": "order-card__body" }, [
        h("div", { "class": "order-card__name", "data-bind": "order.name" }, order.name),
        h("div", { "class": "order-card__meta", "data-bind": "order.id,order.date" }, order.id + " \xB7 " + order.date)
      ]),
      StatusBadge({ variant: meta.badge, label: meta.label, bind: "order.statusLabel" }),
      h("div", { "class": "order-card__price", "data-bind": "order.price" }, order.price),
      h("div", { "class": "chevron" }, "\u203A")
    ]);
  }

  // app-templates/customer-portal/runtime/src/components/primitives/Tabs.js
  function Tabs(props) {
    return h(
      "div",
      { "class": "tabs", "data-module": "tabs", "data-visual-id": "order-tabs", role: "tablist" },
      props.items.map(function(t) {
        return h("span", {
          "class": "tab" + (t.key === props.active ? " tab--active" : ""),
          "data-action": props.action,
          "data-id": t.key,
          "data-state": t.key === props.active ? "active" : void 0,
          role: "tab"
        }, t.count != null ? [t.label + " ", h("span", { style: "opacity:.6" }, String(t.count))] : t.label);
      })
    );
  }

  // app-templates/customer-portal/runtime/src/components/shell/PageHeader.js
  function PageHeader(props) {
    return h("div", { "class": "page-header", "data-module": "page-header", "data-visual-id": "page-header" }, [
      h("div", null, [
        h("h1", { "class": "page-header__title", "data-bind": "page.title" }, props.title),
        props.sub ? h("div", { "class": "page-header__sub", "data-bind": "page.subtitle" }, props.sub) : null
      ])
    ]);
  }

  // app-templates/customer-portal/runtime/src/components/primitives/ActionButton.js
  function ActionButton(props) {
    return h(props.href ? "a" : "button", {
      "class": "btn " + (props.variant || "btn--primary") + (props.block ? " btn--block" : "") + (props.lg ? " btn--lg" : ""),
      "data-module": "action-button",
      "data-visual-id": props.visualId || "action-button",
      "data-action": props.action,
      "data-id": props.id || void 0,
      "data-requires-confirmation": props.confirm ? "true" : void 0,
      "disabled": props.disabled ? true : void 0,
      "href": props.href || void 0
    }, props.label);
  }

  // app-templates/customer-portal/runtime/src/components/primitives/EmptyState.js
  function EmptyState(props) {
    return h("div", { "class": "state-block", "data-module": "empty-state", "data-visual-id": "empty-state", "data-state": "empty" }, [
      h("div", { "class": "state-block__glyph" }, props.glyph || "\u25CB"),
      h("div", { "class": "state-block__title" }, props.title),
      h("div", { "class": "state-block__desc" }, props.desc),
      props.action ? ActionButton(props.action) : null
    ]);
  }

  // app-templates/customer-portal/runtime/src/dom.js
  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function(k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === "class") el.className = v;
      else if (k === "html") el.innerHTML = v;
      else if (k === "style") el.setAttribute("style", v);
      else if (k === "text") el.textContent = v;
      else el.setAttribute(k, v === true ? "" : v);
    });
    if (children != null) (Array.isArray(children) ? children : [children]).forEach(function(c) {
      if (c == null || c === false) return;
      el.appendChild(typeof c === "string" || typeof c === "number" ? document.createTextNode(String(c)) : c);
    });
    return el;
  }
  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }
  function svgPath() {
    var ns = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 600 210");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("class", "tracking-map__path");
    var p = document.createElementNS(ns, "path");
    p.setAttribute("d", "M40 180 C 160 150, 200 60, 330 80 S 520 70, 560 36");
    p.setAttribute("fill", "none");
    p.setAttribute("stroke", "var(--accent)");
    p.setAttribute("stroke-width", "3");
    p.setAttribute("stroke-dasharray", "8 8");
    p.setAttribute("opacity", ".55");
    svg.appendChild(p);
    return svg;
  }

  // app-templates/customer-portal/runtime/src/adapters/fixture-adapter.js
  var fixtureAdapter = {
    load(moduleId, context) {
      var themeName = context.state.theme;
      var fixture = caseFixtureFor(context.config.caseId);
      var theme = fixture ? fixture.theme : F.themes[themeName];
      switch (moduleId) {
        case "auth":
          return { session: context.state.session, phone: context.state.phone, code: context.state.code };
        case "orders":
          return { orders: context.state.orders, statusMeta: fixture ? fixture.statusMeta || F.statusMeta : F.statusMeta, technician: fixture ? fixture.technician : F.technician, addresses: fixture ? fixture.addresses : F.addresses };
        case "proposals":
          return { proposal: F.proposal, sites: context.state.psites, statusMeta: F.pstatus };
        case "services":
          return { services: theme.svc };
        case "pricing":
          return { plan: theme.plan, services: theme.svc };
        case "products":
          return { feature: theme.feat, categories: theme.cats, products: theme.products };
        case "checkout":
          return { cartItems: context.state.cartItems, addresses: fixture ? fixture.addresses : F.addresses, cards: fixture ? fixture.cards : F.cards };
        case "calendar":
          return { orders: context.state.orders, stormCalendar: F.stormCalendar(themeName) };
        case "activity":
          return { groups: fixture ? fixture.activity : F.buildFeed(theme), tabs: fixture ? fixture.feedTabs : F.feedTabs };
        case "profile":
          return {
            customer: fixture ? fixture.customer : F.customer,
            addresses: fixture ? fixture.addresses : F.addresses,
            cards: fixture ? fixture.cards : F.cards,
            preferences: context.state.prefs,
            orders: context.state.orders
          };
        case "support":
          return {
            customer: fixture ? fixture.customer : F.customer,
            topics: fixture ? fixture.helpTopics : F.helpTopics,
            quickReplies: fixture ? fixture.quickReplies : F.quickReplies,
            messages: context.state.messages
          };
        default:
          throw new Error("Unknown fixture module: " + moduleId);
      }
    }
  };

  // app-templates/customer-portal/runtime/src/adapters/core-pim-adapter.js
  var API_PATH = "/public/{organization}/catalog/price-comparison.json";
  var corePimAdapter = {
    supports(moduleId) {
      return moduleId === "services" || moduleId === "pricing" || moduleId === "products";
    },
    async load(moduleId, context) {
      if (!this.supports(moduleId)) throw new Error("Core PIM adapter does not support " + moduleId);
      var config = context.config || {};
      var requests = productTypeCodes(config, moduleId).map(function(productTypeCode) {
        return buildRequest(config, productTypeCode);
      });
      var responses = await Promise.all(requests.map(async function(request) {
        return { data: await fetchPim(request), productTypeCode: request.payload.productTypeCode };
      }));
      var plans = normalizePimRows({ prices: responses.flatMap(function(response) {
        return (Array.isArray(response.data && response.data.prices) ? response.data.prices : []).map(function(row) {
          return Object.assign({ __productTypeCode: response.productTypeCode }, row);
        });
      }) }, config);
      if (moduleId === "pricing" || moduleId === "services") return { pimPlans: plans };
      return { pimProducts: plans };
    }
  };
  function buildRequest(config, productTypeCode) {
    var payload = {
      productTypeCode,
      includeChildProductTypes: true,
      priceTypeCode: config.pimPriceTypeCode || "RECURRENT",
      includeChildPriceTypes: true,
      priceAttributeCode: config.pimPriceAttributeCode || "INTERVAL",
      priceAttributeValues: configuredValues(config.pimPriceAttributeValues, ["1"]),
      currencyAttributeCode: config.pimCurrencyAttributeCode || "CURRENCY",
      currencyAttributeValues: configuredValues(config.pimCurrencyAttributeValues, [config.pimCurrency || "CAD"]),
      nlsKeys: ["NAME", "DESCRIPTION", "PLACEHOLDER"]
    };
    return {
      url: config.pimFixtureUrl || buildUrl(config),
      fixture: !!config.pimFixtureUrl,
      payload
    };
  }
  function productTypeCodes(config, moduleId) {
    var configured = moduleId === "pricing" || moduleId === "services" ? config.pimPricingProductTypeCodes : config.pimProductsProductTypeCodes;
    var values = configuredValues(configured, [config.pimProductTypeCode || "SERVICEWAND_SAAS"]);
    return Array.from(new Set(values));
  }
  async function fetchPim(request) {
    if (!window.fetch) throw new Error("fetch is not available");
    var options2 = request.fixture ? { method: "GET", headers: { Accept: "application/json" } } : {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "include",
      body: JSON.stringify(request.payload)
    };
    var response = await window.fetch(request.url, options2);
    if (!response.ok) throw new Error("Core PIM HTTP " + response.status);
    return response.json();
  }
  function buildUrl(config) {
    var organization = encodeURIComponent(config.pimOrganization || "SERVICEWAND");
    var path = API_PATH.replace("{organization}", organization);
    var base = String(config.pimApiBase || "/core-pim/api").trim().replace(/\/+$/, "");
    base = base.replace(/\/api$/, "");
    if (/^https?:\/\//i.test(base)) return base + path;
    return "/" + base.replace(/^\/+/, "") + path;
  }
  function normalizePimRows(data, config) {
    var rows = Array.isArray(data && data.prices) ? data.prices.slice() : [];
    rows.sort(function(left, right) {
      return sortPriority(left) - sortPriority(right);
    });
    return rows.map(function(row, index) {
      var product = productFromRow(row);
      var nls = localized(product.nls, "en");
      var display = row.price && row.price.display || {};
      var currency = display.currency || attributeValue(row.price, config.pimCurrencyAttributeCode || "CURRENCY") || config.pimCurrency || "CAD";
      var interval = display.intervalLabel || attributeValue(row.price, config.pimPriceAttributeCode || "INTERVAL") || "1 Month";
      var amount = displayAmount(row.price, config);
      var customPrice = !!display.customPrice || !Number.isFinite(amount) || amount >= 2147483647;
      return {
        id: product.code || "pim-" + index,
        code: product.code || "pim-" + index,
        name: nls.NAME || product.code || "Plan",
        description: stripHtml(nls.DESCRIPTION || ""),
        price: customPrice ? "Custom" : formatCurrency(amount, currency),
        priceNum: customPrice ? 0 : amount,
        currency: customPrice ? "" : currency,
        interval: formatInterval(interval),
        cta: customPrice ? "Contact us" : config.pimCta || "Choose plan",
        attributes: product.attributes || {},
        productTypeCode: product.type && product.type.code || row.productTypeCode || row.__productTypeCode || "",
        allowedActions: customPrice ? ["support.open"] : ["cart.addItem"],
        row
      };
    });
  }
  function configuredValues(value, fallback) {
    if (Array.isArray(value) && value.length) return value.map(String);
    if (typeof value === "string" && value.trim()) return value.split(",").map(function(item) {
      return item.trim();
    }).filter(Boolean);
    return fallback;
  }
  function displayAmount(price, config) {
    var display = price && price.display || {};
    var displayed = Number(display.amount);
    if (Number.isFinite(displayed)) return displayed;
    var minor = Number(attributeValue(price, config.pimAmountAttributeCode || "AMOUNT_MINOR"));
    if (!Number.isFinite(minor)) return NaN;
    var divisor = Number(config.pimAmountMinorDivisor);
    return minor / (Number.isFinite(divisor) && divisor > 0 ? divisor : 100);
  }
  function attributeValue(price, code) {
    var groups = price && price.attributes;
    if (!groups || typeof groups !== "object") return null;
    for (var group of Object.values(groups)) {
      var attribute = group && group[code];
      if (attribute && attribute.value !== void 0 && attribute.value !== null) return attribute.value;
    }
    return null;
  }
  function formatInterval(value) {
    var normalized = String(value || "").toUpperCase();
    if (normalized === "ONE_TIME") return "One time";
    if (normalized === "MONTH") return "Monthly";
    return String(value || "1 Month");
  }
  function productFromRow(row) {
    var wrapper = row && row.product || {};
    return wrapper.product || wrapper;
  }
  function localized(nls, locale) {
    return nls && (nls[locale] || nls.en) || {};
  }
  function sortPriority(row) {
    var attributes = (row.product || {}).attributes || {};
    for (var group of Object.values(attributes)) {
      if (group && group.SORT_ORDER_PRIORITY && Number.isFinite(Number(group.SORT_ORDER_PRIORITY.value))) {
        return Number(group.SORT_ORDER_PRIORITY.value);
      }
    }
    return 999;
  }
  function stripHtml(value) {
    return String(value || "").replace(/<[^>]*>/g, "").trim();
  }
  function formatCurrency(amount, currency) {
    if (!Number.isFinite(amount)) return "Custom";
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: currency || "CAD",
      maximumFractionDigits: amount % 1 ? 2 : 0
    }).format(amount);
  }

  // app-templates/customer-portal/runtime/src/adapters/care-fixture-adapter.js
  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }
  function createCareFixtureAdapter() {
    return {
      async load(moduleId, context) {
        if (moduleId !== "care") throw new Error("Care fixture adapter only supports care");
        var caseFixture = caseFixtureFor(context.config.caseId);
        var fixture;
        var products;
        if (caseFixture) {
          fixture = caseFixture.care;
          products = caseFixture.theme.products;
        } else {
          const { careFixtures: careFixtures2 } = await Promise.resolve().then(() => (init_care_fixtures(), care_fixtures_exports));
          var vertical2 = verticalProfiles[context.config.vertical];
          var displayName = vertical2 && vertical2.displayName;
          fixture = careFixtures2[displayName];
          products = F.themes[displayName] && F.themes[displayName].products || [];
        }
        if (!fixture) throw new Error("Care fixture is unavailable for configured vertical");
        var requestedState = context.state.carePayloadState;
        var stateName = requestedState === void 0 ? "ready" : requestedState;
        if (!["ready", "loading", "empty", "error"].includes(stateName)) {
          throw new Error("Unsupported Care payload state");
        }
        return {
          vertical: context.config.vertical,
          state: stateName,
          emptyState: clone(fixture.empty),
          fixture: stateName === "ready" ? clone(fixture) : null,
          products: stateName === "ready" ? clone(products) : []
        };
      }
    };
  }

  // app-templates/customer-portal/runtime/src/adapters/core-account-adapter.js
  var BASIC_INFO_MAPPINGS = ["code", "id", "name", "nls"].map(function(name) {
    return { name };
  });
  var ACCOUNT_MAPPINGS = [
    { name: "code" },
    { name: "id" },
    { name: "nls" },
    { name: "optimistic" },
    { key: "id", name: "organization", type: "identifier" },
    { key: "id", name: "type", type: "identifier" },
    { key: "id", name: "user", type: "identifier" }
  ];
  function createCoreAccountAdapter(options2 = {}) {
    var fetchImpl = options2.fetch || globalThis.fetch;
    if (typeof fetchImpl !== "function") throw contractError3("fetch-unavailable", "Core account adapter requires fetch");
    return {
      async load(moduleId, context) {
        if (moduleId !== "account") throw contractError3("unsupported-module", "Core account adapter cannot load " + moduleId);
        return resolveCoreAccount(context, fetchImpl, options2.origin);
      },
      async resolve(context) {
        return resolveCoreAccount(context, fetchImpl, options2.origin);
      }
    };
  }
  async function resolveCoreAccount(context, fetchImpl = globalThis.fetch, explicitOrigin) {
    var config = context && context.config || {};
    var session = context && context.session || context && context.state && context.state.session || {};
    var accessToken = text3(session.accessToken || session.access_token);
    if (!accessToken) throw contractError3("session-required", "A Core access token is required");
    var origin = explicitOrigin || config.origin || browserOrigin2();
    var coreBase = sameOriginBase3(config.coreApiBase || "/core", origin, "Core API base");
    var accountBase = sameOriginBase3(config.accountApiBase || "/core-acct", origin, "Core Account API base");
    var tokenType = text3(session.tokenType || session.token_type || "Bearer");
    var authorization = tokenType + " " + accessToken;
    var basicInfo = await requestJson3(fetchImpl, coreBase + "/api/user/basic-info.json", {
      method: "POST",
      credentials: "same-origin",
      headers: { Authorization: authorization, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(BASIC_INFO_MAPPINGS)
    });
    var userId = positiveInteger3(basicInfo.authenticatedUserId || basicInfo.id);
    if (!userId) throw contractError3("invalid-session-user", "Core basic-info did not return authenticatedUserId");
    var organizationCode = selectOrganization(config.organization || config.pimOrganization, basicInfo);
    var accountTypeCode = text3(config.accountTypeCode || "SPA_CUSTOMER");
    var accountReply = await requestJson3(fetchImpl, accountBase + "/api/account/list.json", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Organization-Code": organizationCode
      },
      body: JSON.stringify({
        filters: [
          { type: "INTEGER", operator: "=", property: "user.id", value: String(userId) },
          { type: "STRING", operator: "=", property: "type.code", value: accountTypeCode }
        ],
        mappings: ACCOUNT_MAPPINGS,
        offset: 0,
        pageSize: 2
      })
    });
    var accounts = Array.isArray(accountReply && accountReply.result) ? accountReply.result : [];
    if (!accounts.length) throw contractError3("customer-not-linked", "No customer Account is linked to the signed-in Core User");
    if (accounts.length !== 1 || Number(accountReply.resultSize || accounts.length) > 1) {
      throw contractError3("customer-account-ambiguous", "The signed-in Core User must resolve to exactly one customer Account");
    }
    var account = accounts[0] || {};
    if (!positiveInteger3(account.id)) throw contractError3("invalid-customer-account", "Core Account response did not include an id");
    if (account.user && positiveInteger3(account.user.id) && Number(account.user.id) !== userId) {
      throw contractError3("customer-scope-mismatch", "Core Account user does not match the authenticated Core User");
    }
    return {
      state: "ready",
      organization: { code: organizationCode },
      user: {
        id: userId,
        displayName: text3(basicInfo.authenticatedUserName || basicInfo.authenticatedUser || basicInfo.name)
      },
      account: {
        id: Number(account.id),
        code: text3(account.code),
        displayName: localizedName2(account.nls) || text3(account.code),
        optimistic: Number.isFinite(Number(account.optimistic)) ? Number(account.optimistic) : null,
        typeCode: accountTypeCode
      }
    };
  }
  function selectOrganization(configuredCode, basicInfo) {
    var configured = text3(configuredCode);
    var authorized = Array.isArray(basicInfo && basicInfo.authorizedOrganizations) ? basicInfo.authorizedOrganizations.map(function(item) {
      return text3(item && item.code);
    }).filter(Boolean) : [];
    var current = text3(basicInfo && (basicInfo.organizationCode || basicInfo.defaultOrganizationCode));
    var selected = configured || current || authorized[0];
    if (!selected) throw contractError3("organization-required", "Core basic-info did not provide an organization");
    if (authorized.length && !authorized.includes(selected)) {
      throw contractError3("organization-forbidden", "Configured portal organization is not authorized for the signed-in Core User");
    }
    return selected;
  }
  async function requestJson3(fetchImpl, url, options2) {
    var response = await fetchImpl(url, options2);
    if (!response || typeof response.ok !== "boolean") throw contractError3("invalid-response", "Core request returned an invalid response");
    if (!response.ok) {
      var code = response.status === 401 ? "session-expired" : response.status === 403 ? "customer-forbidden" : "core-request-failed";
      var error2 = contractError3(code, "Core request failed with HTTP " + response.status);
      error2.status = response.status;
      throw error2;
    }
    try {
      return await response.json();
    } catch (_) {
      throw contractError3("invalid-response", "Core response was not valid JSON");
    }
  }
  function sameOriginBase3(value, origin, label) {
    if (!origin) throw contractError3("origin-required", label + " requires a browser origin");
    var target = new URL(String(value || ""), origin);
    if (target.origin !== new URL(origin).origin) throw contractError3("cross-origin-service", label + " must be same-origin");
    return target.href.replace(/\/+$/, "");
  }
  function browserOrigin2() {
    return globalThis.location && globalThis.location.origin || "";
  }
  function positiveInteger3(value) {
    var number = Number(value);
    return Number.isInteger(number) && number > 0 ? number : null;
  }
  function localizedName2(value) {
    if (!value || typeof value !== "object") return "";
    var localized2 = value.en || value["en-US"] || Object.values(value)[0] || {};
    return text3(localized2 && (localized2.NAME || localized2.name));
  }
  function text3(value) {
    return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
  }
  function contractError3(code, message) {
    var error2 = new Error(message);
    error2.code = code;
    return error2;
  }
  var coreAccountContract = Object.freeze({
    basicInfoMappings: BASIC_INFO_MAPPINGS,
    accountMappings: ACCOUNT_MAPPINGS,
    accountFilters: ["user.id", "type.code"]
  });

  // app-templates/customer-portal/runtime/src/adapters/core-orders-adapter.js
  var ORDER_MAPPINGS2 = [
    { name: "attributes" },
    { name: "created" },
    { name: "grandTotal" },
    { name: "id" },
    { name: "notes" },
    { name: "optimistic" },
    { name: "totalCharges" },
    { name: "totalTaxes" },
    { key: "id", mappings: [{ name: "id" }, { name: "code" }, { name: "nls" }], name: "account", type: "identifier" },
    { key: "id", mappings: [{ name: "id" }, { name: "code" }, { name: "nls" }], name: "currency", type: "identifier" },
    { key: "id", name: "organization", type: "identifier" },
    { mappings: [{ name: "id" }, { name: "code" }, { name: "nls" }], name: "states", type: "collection" },
    { key: "id", mappings: [{ name: "id" }, { name: "code" }, { name: "nls" }], name: "type", type: "identifier" }
  ];
  function createCoreOrdersAdapter(options2 = {}) {
    var fetchImpl = options2.fetch || globalThis.fetch;
    if (typeof fetchImpl !== "function") throw contractError4("fetch-unavailable", "Core Orders adapter requires fetch");
    return {
      async load(moduleId, context) {
        if (moduleId !== "orders") throw contractError4("unsupported-module", "Core Orders adapter cannot load " + moduleId);
        return loadCoreOrders(context, fetchImpl, options2.origin);
      }
    };
  }
  async function loadCoreOrders(context, fetchImpl = globalThis.fetch, explicitOrigin) {
    var config = context && context.config || {};
    var state2 = context && context.state || {};
    var session = context && context.session || state2.session || {};
    var customer = context && context.account || state2.customerAccount || state2.session && state2.session.account || {};
    var accountId = positiveInteger4(customer.id);
    if (!accountId) throw contractError4("customer-account-required", "Resolved customer Account is required before Orders load");
    var accessToken = text4(session.accessToken || session.access_token);
    if (!accessToken) throw contractError4("session-required", "A Core access token is required");
    var organization = text4(config.organization);
    if (!organization) throw contractError4("organization-required", "Verified portal organization is required");
    var origin = explicitOrigin || config.origin || browserOrigin3();
    var billBase = sameOriginBase4(config.billApiBase || "/core-bill", origin, "Core Bill API base");
    var authorization = text4(session.tokenType || session.token_type || "Bearer") + " " + accessToken;
    var request = {
      filters: [{ type: "INTEGER", operator: "=", property: "account.id", value: String(accountId) }],
      mappings: ORDER_MAPPINGS2,
      offset: 0,
      pageSize: positiveInteger4(config.ordersPageSize) || 50,
      sorting: [{ field: "id", direction: "DESC" }]
    };
    var response = await requestJson4(fetchImpl, billBase + "/api/order/list.json", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        Authorization: authorization,
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-Organization-Code": organization
      },
      body: JSON.stringify(request)
    });
    var rows = Array.isArray(response && response.result) ? response.result : [];
    var items = rows.map(function(row) {
      return normalizeOrder2(row, accountId);
    });
    var byRef = {};
    items.forEach(function(item) {
      byRef[item.ref] = item;
    });
    return {
      state: items.length ? "ready" : "empty",
      accountId,
      resultSize: Number.isFinite(Number(response && response.resultSize)) ? Number(response.resultSize) : items.length,
      items,
      byRef
    };
  }
  function normalizeOrder2(row, accountId) {
    var rowAccountId = row && row.account && positiveInteger4(row.account.id);
    if (rowAccountId !== accountId) throw contractError4("order-scope-mismatch", "Core Order does not belong to the resolved customer Account");
    var id = positiveInteger4(row && row.id);
    if (!id) throw contractError4("invalid-order", "Core Order response did not include an id");
    var states = Array.isArray(row.states) ? row.states.map(function(state2) {
      return { id: positiveInteger4(state2 && state2.id), code: text4(state2 && state2.code), label: localizedName3(state2 && state2.nls) };
    }) : [];
    return {
      ref: "order-core-" + id,
      reference: "order-core-" + id,
      id,
      optimistic: Number.isFinite(Number(row.optimistic)) ? Number(row.optimistic) : null,
      notes: text4(row.notes),
      grandTotal: finiteNumber3(row.grandTotal),
      totalCharges: finiteNumber3(row.totalCharges),
      totalTaxes: finiteNumber3(row.totalTaxes),
      currency: { code: text4(row.currency && row.currency.code), label: localizedName3(row.currency && row.currency.nls) },
      type: { code: text4(row.type && row.type.code), label: localizedName3(row.type && row.type.nls) },
      states,
      statusCode: Array.from(new Set(states.map(function(state2) {
        return state2.code;
      }).filter(Boolean))).join(" \xB7 "),
      customerStatus: Array.from(new Set(states.map(function(state2) {
        return state2.code;
      }).filter(Boolean))).join(" \xB7 ") || "UNMAPPED",
      kind: "MIXED",
      placedAt: formatDate2(row.created),
      itemSummary: text4(row.notes).startsWith("CP_DEMO_") ? "Demo order recorded through the customer portal" : localizedName3(row.type && row.type.nls) || text4(row.type && row.type.code) || "Core order",
      displayTotal: formatMoney(row.grandTotal, text4(row.currency && row.currency.code) || "USD"),
      displayCurrency: text4(row.currency && row.currency.code) || "USD",
      attention: null,
      allowedActions: [],
      lines: [],
      money: {
        subtotal: formatMoney(row.totalCharges, text4(row.currency && row.currency.code) || "USD"),
        tax: formatMoney(row.totalTaxes, text4(row.currency && row.currency.code) || "USD"),
        total: formatMoney(row.grandTotal, text4(row.currency && row.currency.code) || "USD"),
        currency: text4(row.currency && row.currency.code) || "USD"
      },
      paymentMode: "SIMULATED",
      fulfillment: null,
      relatedAppointments: [],
      relatedPlan: null
    };
  }
  async function requestJson4(fetchImpl, url, options2) {
    var response = await fetchImpl(url, options2);
    if (!response || typeof response.ok !== "boolean") throw contractError4("invalid-response", "Core Bill returned an invalid response");
    if (!response.ok) {
      var code = response.status === 401 ? "session-expired" : response.status === 403 ? "orders-forbidden" : "orders-request-failed";
      var error2 = contractError4(code, "Core Orders request failed with HTTP " + response.status);
      error2.status = response.status;
      throw error2;
    }
    try {
      return await response.json();
    } catch (_) {
      throw contractError4("invalid-response", "Core Orders response was not valid JSON");
    }
  }
  function sameOriginBase4(value, origin, label) {
    if (!origin) throw contractError4("origin-required", label + " requires a browser origin");
    var target = new URL(String(value || ""), origin);
    if (target.origin !== new URL(origin).origin) throw contractError4("cross-origin-service", label + " must be same-origin");
    return target.href.replace(/\/+$/, "");
  }
  function browserOrigin3() {
    return globalThis.location && globalThis.location.origin || "";
  }
  function positiveInteger4(value) {
    var number = Number(value);
    return Number.isInteger(number) && number > 0 ? number : null;
  }
  function finiteNumber3(value) {
    var number = Number(value);
    return Number.isFinite(number) ? number : null;
  }
  function formatDate2(value) {
    var date = new Date(value);
    return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(date) : "Date not returned";
  }
  function formatMoney(value, currency) {
    var number = Number(value);
    return Number.isFinite(number) ? new Intl.NumberFormat("en-US", { style: "currency", currency }).format(number) : "";
  }
  function localizedName3(value) {
    if (!value || typeof value !== "object") return "";
    var localized2 = value.en || value["en-US"] || Object.values(value)[0] || {};
    return text4(localized2 && (localized2.NAME || localized2.name));
  }
  function text4(value) {
    return typeof value === "string" ? value.trim() : value == null ? "" : String(value).trim();
  }
  function contractError4(code, message) {
    var error2 = new Error(message);
    error2.code = code;
    return error2;
  }
  var coreOrdersContract = Object.freeze({ mappings: ORDER_MAPPINGS2, filters: ["account.id"] });

  // app-templates/customer-portal/runtime/src/normalizers/care.js
  var CARE_KINDS = ["equipment", "seasonLog", "program", "water", "roof", "monitoring", "healthCare", "beautyCare"];
  var CARE_META = {
    hvac: { navLabel: "Equipment", title: "Your equipment", subtitle: "Every unit we service \u2014 condition, warranty and the latest diagnostic in one place." },
    snow: { navLabel: "Season log", title: "Season log", subtitle: "Every storm response this winter \u2014 GPS-logged, timed against your SLA, with materials used." },
    lawn: { navLabel: "Program", title: "Season program", subtitle: "Your 5-step feeding and care program \u2014 what\u2019s done, what\u2019s next, and when the lawn is safe to use." },
    pool: { navLabel: "Water", title: "Water quality", subtitle: "Readings from every visit, tracked against safe ranges \u2014 plus what your tech dosed and why." },
    roofing: { navLabel: "Roof report", title: "Roof condition", subtitle: "Findings from your drone inspection on Jan 8 \u2014 and the repair project it kicked off." },
    pest: { navLabel: "Monitoring", title: "Station monitoring", subtitle: "Bait stations and smart sensors watch your home between visits \u2014 alerts go straight to your technician." },
    health: { navLabel: "Care plan", title: "Your care plan", subtitle: "Appointments, milestones, documents and your care team \u2014 the logistics in one place. Clinical details stay with your provider." },
    beauty: { navLabel: "My routine", title: "Your routine", subtitle: "Appointments, packages, your specialist and the formulas they use \u2014 remembered visit to visit." }
  };
  var ACTIONS_BY_KIND = {
    equipment: ["care.selectUnit"],
    seasonLog: [],
    program: [],
    water: [],
    roof: [],
    monitoring: ["care.requestRetreat"],
    healthCare: ["care.completeTask"],
    beautyCare: ["care.selectSpecialist", "care.completeTask"]
  };
  function clone2(value) {
    return JSON.parse(JSON.stringify(value));
  }
  function emptyState(raw) {
    if (!raw) return null;
    return { glyph: raw.glyph, title: raw.title, description: raw.desc };
  }
  function stripClosedDocumentDestinations(content) {
    if (!Array.isArray(content.docs)) return;
    content.docs = content.docs.map(function(documentItem) {
      var safe = Object.assign({}, documentItem);
      delete safe.url;
      delete safe.href;
      delete safe.downloadUrl;
      delete safe.filename;
      return safe;
    });
  }
  function careDisplayMeta(vertical2) {
    return CARE_META[vertical2] || CARE_META.hvac;
  }
  function envelope(vertical2, phase, stateName, access, extra) {
    var meta = careDisplayMeta(vertical2);
    return Object.assign({
      id: "care",
      vertical: vertical2,
      phase,
      kind: null,
      navLabel: meta.navLabel,
      title: meta.title,
      subtitle: meta.subtitle,
      state: stateName,
      access: { status: access.status, reasonCode: access.reasonCode || null },
      emptyState: null,
      content: null,
      allowedActions: []
    }, extra || {});
  }
  function normalizeCarePreflight(access, context) {
    var stateName = access.status === "disabled" ? "disabled" : access.status === "checking" ? "loading" : access.status === "error" ? "error" : "unauthorized";
    return envelope(context.config.vertical, "preflight", stateName, access);
  }
  function normalizeCareLoading(context) {
    return envelope(context.config.vertical, "payload", "loading", { status: "granted", reasonCode: null });
  }
  function normalizeCareFailure(context, reasonCode) {
    return envelope(context.config.vertical, "payload", "error", { status: "granted", reasonCode: reasonCode || "payload-load-failed" });
  }
  function normalizeCare(raw) {
    var stateName = raw && raw.state;
    if (!["ready", "loading", "empty", "error"].includes(stateName)) throw new Error("Unsupported Care payload state");
    if (stateName !== "ready") {
      return envelope(raw.vertical, "payload", stateName, { status: "granted", reasonCode: null }, {
        emptyState: stateName === "empty" ? emptyState(raw.emptyState) : null
      });
    }
    var fixture = raw.fixture;
    if (!fixture || !CARE_KINDS.includes(fixture.kind)) throw new Error("Invalid Care fixture kind");
    var content = clone2(fixture);
    delete content.kind;
    delete content.navLabel;
    delete content.title;
    delete content.sub;
    delete content.empty;
    stripClosedDocumentDestinations(content);
    if (fixture.kind === "beautyCare") {
      var productsByName = new Map((raw.products || []).map(function(product) {
        return [product.name, product];
      }));
      content.productRecs.items = content.productRecs.names.map(function(name) {
        return productsByName.get(name);
      }).filter(Boolean);
    }
    return envelope(raw.vertical, "payload", "ready", { status: "granted", reasonCode: null }, {
      kind: fixture.kind,
      navLabel: fixture.navLabel,
      title: fixture.title,
      subtitle: fixture.sub,
      emptyState: emptyState(fixture.empty),
      content,
      allowedActions: ACTIONS_BY_KIND[fixture.kind].slice()
    });
  }

  // app-templates/customer-portal/runtime/src/normalizers/index.js
  function clone3(value) {
    return JSON.parse(JSON.stringify(value));
  }
  function normalizeOrders(raw) {
    return {
      items: clone3(raw.orders).map(function(order) {
        return Object.assign({}, order, {
          allowedActions: order.status === "completed" ? ["order.bookAgain", "order.downloadInvoice"] : ["order.cancel", "order.reschedule", "support.open"]
        });
      }),
      statusMeta: raw.statusMeta,
      technician: raw.technician,
      addresses: raw.addresses
    };
  }
  function normalizeProposals(raw) {
    return {
      proposal: clone3(raw.proposal),
      sites: clone3(raw.sites).map(function(site) {
        return Object.assign({}, site, {
          allowedActions: ["proposal.selectPlan", "proposal.approve", "proposal.requestRevision", "proposal.decline"]
        });
      }),
      statusMeta: raw.statusMeta
    };
  }
  function normalizeServices(raw) {
    if (raw.pimPlans) return { items: clone3(raw.pimPlans), source: "core-pim" };
    return { items: clone3(raw.services) };
  }
  function normalizePricing(raw) {
    if (raw.pimPlans) {
      return {
        plans: clone3(raw.pimPlans),
        rates: clone3(raw.pimPlans),
        source: "core-pim"
      };
    }
    return {
      plans: [
        { id: "payg", name: "Pay as you go", price: "$0", interval: "visit", cta: "Book any service" },
        { id: "member", name: raw.plan.name, price: "$9", interval: "month", cta: raw.plan.tag },
        { id: "plus", name: raw.plan.plusName, price: "$19", interval: "month", cta: "For multiple properties" }
      ],
      rates: clone3(raw.services)
    };
  }
  function normalizeProducts(raw) {
    if (raw.pimProducts) {
      return {
        feature: null,
        categories: [],
        items: clone3(raw.pimProducts),
        source: "core-pim"
      };
    }
    return {
      feature: clone3(raw.feature),
      categories: clone3(raw.categories),
      items: clone3(raw.products).map(function(product) {
        return Object.assign({}, product, { allowedActions: ["cart.addItem"] });
      })
    };
  }
  function normalizeCheckout(raw) {
    return {
      cartItems: clone3(raw.cartItems),
      addresses: clone3(raw.addresses),
      cards: clone3(raw.cards),
      allowedActions: raw.cartItems.length ? ["checkout.placeOrder"] : []
    };
  }
  function normalizeCalendar(raw) {
    return {
      orders: clone3(raw.orders),
      stormCalendar: clone3(raw.stormCalendar)
    };
  }
  function normalizeActivity(raw) {
    return {
      tabs: clone3(raw.tabs),
      groups: clone3(raw.groups)
    };
  }
  function normalizeProfile(raw) {
    return {
      customer: clone3(raw.customer),
      addresses: clone3(raw.addresses),
      cards: clone3(raw.cards),
      preferences: clone3(raw.preferences),
      orders: clone3(raw.orders)
    };
  }
  function normalizeSupport(raw) {
    return {
      customer: clone3(raw.customer),
      topics: clone3(raw.topics),
      quickReplies: clone3(raw.quickReplies),
      messages: clone3(raw.messages)
    };
  }

  // app-templates/customer-portal/runtime/src/modules/index.js
  function module(id, normalize2) {
    return {
      id,
      adapter(context) {
        if (context.config.dataMode === "live") {
          if (corePimAdapter.supports(id)) return corePimAdapter;
          throw new Error("Live adapter is not opened for module " + id);
        }
        return fixtureAdapter;
      },
      normalize(raw) {
        return normalize2(raw);
      }
    };
  }
  function clearCareProtectedState(runtimeState) {
    runtimeState.careAuthorizationEpoch = (runtimeState.careAuthorizationEpoch || 0) + 1;
    runtimeState.careStateVertical = null;
    runtimeState.careSelectedUnitId = null;
    runtimeState.careSelectedSpecialistId = null;
    runtimeState.careTasksDone = {};
    runtimeState.careRetreatRequests = {};
    for (const key of Object.keys(runtimeState.pending || {})) if (key.startsWith("care.")) delete runtimeState.pending[key];
    for (const key of Object.keys(runtimeState.commandErrors || {})) {
      if (key.startsWith("care.") && !key.endsWith(":_")) delete runtimeState.commandErrors[key];
    }
  }
  function clearGeneralCareCommandErrors2(runtimeState) {
    for (const key of Object.keys(runtimeState.commandErrors || {})) {
      if (key.startsWith("care.") && key.endsWith(":_")) delete runtimeState.commandErrors[key];
    }
  }
  function carePreflight(context) {
    var enabled = context.config.enabledModules.includes("care");
    if (!enabled) return { status: "disabled", reasonCode: "module-disabled" };
    if (!context.state.session.authenticated) return { status: "unauthenticated", reasonCode: "session-required" };
    if (context.state.session.hasCustomerScope !== true || context.state.session.hasTenantScope !== true) {
      return { status: "forbidden", reasonCode: "scope-missing" };
    }
    var access = context.state.access && context.state.access.care;
    var status = access && access.status;
    if (status === "granted" && context.config.dataMode !== "fixture") {
      return { status: "error", reasonCode: "live-adapter-not-opened" };
    }
    if (["checking", "not-entitled", "forbidden", "granted", "error"].includes(status)) {
      return { status, reasonCode: access.reasonCode || null };
    }
    return { status: "not-entitled", reasonCode: "entitlement-missing" };
  }
  var careModule = {
    id: "care",
    asyncOnly: true,
    dataSources: ["care.fixture", "care.live"],
    requires: ["session", "customer-scope", "tenant-scope", "care-entitlement"],
    routes: ["care"],
    commands: ["care.selectUnit", "care.download", "care.requestRetreat", "care.selectSpecialist", "care.completeTask", "care.contactProvider", "care.openSecureDoc"],
    preflight: carePreflight,
    safeEnvelope: normalizeCarePreflight,
    loadingEnvelope: normalizeCareLoading,
    clearProtectedState(context) {
      clearCareProtectedState(context.state);
    },
    onResult(envelope2, context) {
      clearGeneralCareCommandErrors2(context.state);
      if (!envelope2.content) {
        clearCareProtectedState(context.state);
        return;
      }
      if (context.state.careStateVertical && context.state.careStateVertical !== envelope2.vertical) clearCareProtectedState(context.state);
      context.state.careStateVertical = envelope2.vertical;
    },
    failureEnvelope(context) {
      return normalizeCareFailure(context, "payload-load-failed");
    },
    cacheKey(context) {
      var payloadState = context.state.carePayloadState === void 0 ? "ready" : String(context.state.carePayloadState);
      return [context.config.dataMode, context.config.vertical, payloadState].join(":");
    },
    adapter(context) {
      if (context.config.dataMode !== "fixture") throw new Error("Care live adapter is not opened");
      return createCareFixtureAdapter();
    },
    normalize(raw, context) {
      return normalizeCare(raw, context);
    }
  };
  var accountModule = {
    id: "account",
    asyncOnly: true,
    adapter(context) {
      if (context.config.dataMode === "live") return createCoreAccountAdapter();
      return {
        load() {
          var customer = context.state.currentCustomer || {};
          return {
            state: "ready",
            organization: { code: context.config.organization },
            user: { id: null, displayName: customer.fullName || "Customer" },
            account: { id: null, code: "fixture", displayName: customer.fullName || "Customer", typeCode: context.config.accountTypeCode }
          };
        }
      };
    },
    normalize(raw) {
      return raw;
    },
    onResult(envelope2, context) {
      context.state.customerAccount = envelope2.account;
      context.state.session.account = envelope2.account;
      context.state.sessionName = envelope2.user && envelope2.user.displayName || envelope2.account && envelope2.account.displayName || null;
      context.state.session.userId = envelope2.user && envelope2.user.id || null;
      context.state.account = "ready";
    },
    onError(error2, context) {
      context.state.customerAccount = null;
      delete context.state.session.account;
      context.state.account = error2 && error2.code || "customer-unavailable";
    },
    failureEnvelope(context, error2) {
      return { state: error2 && error2.code || "customer-unavailable", items: [] };
    }
  };
  var profileModule = {
    id: "profile",
    asyncOnly: true,
    adapter(context) {
      return context.config.dataMode === "live" ? createCoreUserProfileAdapter() : fixtureAdapter;
    },
    normalize(raw, context) {
      return context.config.dataMode === "live" ? raw : normalizeProfile(raw);
    },
    onError(error2, context) {
      if (error2 && error2.code === "session-expired") context.state.account = "session-expired";
    },
    failureEnvelope(context, error2) {
      return { state: error2 && error2.code === "customer-forbidden" ? "unauthorized" : "error", email: "", phone: null, prefs: {}, allowedActions: [] };
    }
  };
  var authModule = {
    id: "auth",
    asyncOnly: true,
    adapter(context) {
      return createCoreOidcAdapter();
    },
    normalize(raw) {
      return raw;
    },
    onResult(envelope2, context) {
      if (context.config.dataMode !== "live") {
        context.state.oidc = context.config.authMode === "required" ? "ready-signed-out" : "ready-signed-in";
        context.state.session.authenticated = context.config.authMode !== "required";
        return;
      }
      var user = envelope2 && envelope2.user;
      context.state.oidc = envelope2 && envelope2.state || "ready-signed-out";
      context.state.session.authenticated = !!user || context.config.authMode !== "required";
      if (user) {
        context.state.session.accessToken = user.access_token;
        context.state.session.tokenType = user.token_type || "Bearer";
        var profile = user.profile || {};
        context.state.sessionName = profile.name || profile.preferred_username || profile.email || null;
      } else {
        delete context.state.session.accessToken;
        delete context.state.session.tokenType;
        context.state.account = "session-required";
      }
    },
    onError(error2, context) {
      context.state.oidc = "unavailable";
      context.state.session.authenticated = false;
      context.state.account = "session-required";
    },
    failureEnvelope() {
      return { state: "unavailable", user: null };
    }
  };
  var ordersModule = {
    id: "orders",
    asyncOnly: true,
    adapter(context) {
      return context.config.dataMode === "live" ? createCoreOrdersAdapter() : fixtureAdapter;
    },
    normalize(raw, context) {
      return context.config.dataMode === "live" ? raw : normalizeOrders(raw);
    },
    onError(error2, context) {
      if (error2 && error2.code === "session-expired") context.state.account = "session-expired";
    },
    failureEnvelope(context, error2) {
      return { state: error2 && error2.code || "error", items: [] };
    }
  };
  var appointmentsModule = {
    id: "appointments",
    asyncOnly: true,
    adapter(context) {
      if (context.config.dataMode === "live") return createCoreSpaDemoAdapter();
      return {
        load() {
          return { state: "ready", items: [], next: null, upcoming: [], past: [], byRef: {} };
        }
      };
    },
    normalize(raw) {
      return raw;
    },
    onError(error2, context) {
      if (error2 && error2.code === "session-expired") context.state.account = "session-expired";
    },
    failureEnvelope(context, error2) {
      return { state: error2 && error2.code === "customer-forbidden" ? "unauthorized" : "error", items: [], next: null, upcoming: [], past: [], byRef: {} };
    }
  };
  var checkoutModule = {
    id: "checkout",
    adapter(context) {
      if (context.config.dataMode === "live") return { load() {
        return { state: "ready" };
      } };
      return fixtureAdapter;
    },
    normalize(raw, context) {
      return context.config.dataMode === "live" ? raw : normalizeCheckout(raw);
    }
  };
  var modules = {
    auth: authModule,
    account: accountModule,
    appointments: appointmentsModule,
    orders: ordersModule,
    proposals: module("proposals", normalizeProposals),
    services: module("services", normalizeServices),
    pricing: module("pricing", normalizePricing),
    products: module("products", normalizeProducts),
    checkout: checkoutModule,
    calendar: module("calendar", normalizeCalendar),
    activity: module("activity", normalizeActivity),
    profile: profileModule,
    support: module("support", normalizeSupport),
    care: careModule
  };
  var openedModuleIds = Object.keys(modules);

  // app-templates/customer-portal/runtime/src/portal-runtime.js
  var PortalRuntime = class {
    constructor(options2) {
      this.state = options2.state;
      this.modules = options2.modules || modules;
      this.cache = /* @__PURE__ */ new Map();
      this.generations = /* @__PURE__ */ new Map();
      this.inFlight = /* @__PURE__ */ new Map();
    }
    parseConfig() {
      return this.state.config;
    }
    context() {
      var config = this.parseConfig();
      return {
        state: this.state,
        config: Object.assign({}, config, {
          enabledModules: (config.enabledModules || []).slice()
        })
      };
    }
    generation(moduleId) {
      return this.generations.get(moduleId) || 0;
    }
    cancel(moduleId, descriptor, context) {
      this.generations.set(moduleId, this.generation(moduleId) + 1);
      this.cache.delete(moduleId);
      this.inFlight.delete(moduleId);
      if (descriptor.clearProtectedState) descriptor.clearProtectedState(context);
    }
    publish(moduleId, data) {
      this.state.moduleData[moduleId] = data;
      this.state.moduleStatus[moduleId] = data && data.state ? data.state : "ready";
      return data;
    }
    publishDenied(moduleId, descriptor, preflight, context) {
      this.cancel(moduleId, descriptor, context);
      return this.publish(moduleId, descriptor.safeEnvelope(preflight, context));
    }
    cached(moduleId, cacheKey) {
      var cached = cacheKey && this.cache.get(moduleId);
      return cached && cached.cacheKey === cacheKey ? cached.data : null;
    }
    syncPreflight(moduleId) {
      var descriptor = this.modules[moduleId];
      if (!descriptor || !descriptor.preflight) return this.state.moduleData[moduleId] || null;
      var context = this.context();
      var preflight = descriptor.preflight(context);
      if (preflight.status !== "granted") return this.publishDenied(moduleId, descriptor, preflight, context);
      var current = this.state.moduleData[moduleId];
      if (descriptor.asyncOnly && current && current.vertical !== context.config.vertical) {
        this.cancel(moduleId, descriptor, context);
        return this.publish(moduleId, descriptor.loadingEnvelope(context));
      }
      return current || null;
    }
    load(moduleId) {
      var descriptor = this.modules[moduleId];
      if (!descriptor) throw new Error("Unknown module: " + moduleId);
      var context = this.context();
      var preflight = descriptor.preflight && descriptor.preflight(context);
      if (preflight && preflight.status !== "granted") {
        return this.publishDenied(moduleId, descriptor, preflight, context);
      }
      var cacheKey = descriptor.cacheKey && descriptor.cacheKey(context);
      var cached = this.cached(moduleId, cacheKey);
      if (cached) return this.publish(moduleId, cached);
      if (descriptor.asyncOnly) {
        var flight = this.inFlight.get(moduleId);
        if (flight && flight.cacheKey === cacheKey) return this.state.moduleData[moduleId];
        if (descriptor.clearProtectedState) descriptor.clearProtectedState(context);
        return this.publish(moduleId, descriptor.loadingEnvelope(context));
      }
      this.state.moduleStatus[moduleId] = "loading";
      try {
        var adapter = descriptor.adapter(context);
        var raw = adapter.load(moduleId, context);
        if (raw && typeof raw.then === "function") throw new Error("Module " + moduleId + " requires async load");
        var normalized = descriptor.normalize(raw, context);
        if (descriptor.onResult) descriptor.onResult(normalized, context);
        this.cache.set(moduleId, cacheKey ? { cacheKey, data: normalized } : normalized);
        return this.publish(moduleId, normalized);
      } catch (error2) {
        this.cache.delete(moduleId);
        if (descriptor.clearProtectedState) descriptor.clearProtectedState(context);
        if (descriptor.onError) descriptor.onError(error2, context);
        this.state.moduleStatus[moduleId] = "error";
        this.state.moduleData[moduleId] = descriptor.failureEnvelope ? descriptor.failureEnvelope(context, error2) : null;
        throw error2;
      }
    }
    loadAll(moduleIds) {
      var ids = moduleIds || this.enabledModuleIds().filter((moduleId) => !this.modules[moduleId].asyncOnly);
      return ids.map((moduleId) => this.load(moduleId));
    }
    loadAsync(moduleId) {
      var descriptor = this.modules[moduleId];
      if (!descriptor) return Promise.reject(new Error("Unknown module: " + moduleId));
      var context = this.context();
      var preflight = descriptor.preflight && descriptor.preflight(context);
      if (preflight && preflight.status !== "granted") {
        return Promise.resolve(this.publishDenied(moduleId, descriptor, preflight, context));
      }
      var cacheKey = descriptor.cacheKey && descriptor.cacheKey(context);
      var cached = this.cached(moduleId, cacheKey);
      if (cached) return Promise.resolve(this.publish(moduleId, cached));
      var existing = this.inFlight.get(moduleId);
      if (existing && existing.cacheKey === cacheKey) return existing.promise;
      var generation = this.generation(moduleId);
      var vertical2 = context.config.vertical;
      if (descriptor.clearProtectedState) descriptor.clearProtectedState(context);
      if (descriptor.loadingEnvelope) this.publish(moduleId, descriptor.loadingEnvelope(context));
      else this.state.moduleStatus[moduleId] = "loading";
      var operation;
      try {
        operation = Promise.resolve(descriptor.adapter(context).load(moduleId, context));
      } catch (error2) {
        operation = Promise.reject(error2);
      }
      var promise = operation.then((raw) => {
        if (!this.isCurrentLoad(moduleId, descriptor, generation, cacheKey, vertical2)) {
          return this.state.moduleData[moduleId] || null;
        }
        var normalized = descriptor.normalize(raw, context);
        if (!this.isCurrentLoad(moduleId, descriptor, generation, cacheKey, vertical2)) {
          return this.state.moduleData[moduleId] || null;
        }
        if (descriptor.onResult) descriptor.onResult(normalized, context);
        this.cache.set(moduleId, cacheKey ? { cacheKey, data: normalized } : normalized);
        return this.publish(moduleId, normalized);
      }).catch((error2) => {
        if (!this.isCurrentLoad(moduleId, descriptor, generation, cacheKey, vertical2)) {
          return this.state.moduleData[moduleId] || null;
        }
        this.cache.delete(moduleId);
        if (descriptor.clearProtectedState) descriptor.clearProtectedState(this.context());
        if (descriptor.onError) descriptor.onError(error2, this.context());
        this.state.moduleStatus[moduleId] = "error";
        this.state.moduleData[moduleId] = descriptor.failureEnvelope ? descriptor.failureEnvelope(this.context(), error2) : null;
        throw error2;
      }).finally(() => {
        var flight = this.inFlight.get(moduleId);
        if (flight && flight.promise === promise) this.inFlight.delete(moduleId);
      });
      this.inFlight.set(moduleId, { cacheKey, promise });
      return promise;
    }
    isCurrentLoad(moduleId, descriptor, generation, cacheKey, vertical2) {
      if (this.generation(moduleId) !== generation) return false;
      var context = this.context();
      if (context.config.vertical !== vertical2) return false;
      if (descriptor.cacheKey && descriptor.cacheKey(context) !== cacheKey) return false;
      var preflight = descriptor.preflight && descriptor.preflight(context);
      return !preflight || preflight.status === "granted";
    }
    async loadAllAsync(moduleIds) {
      var ids = moduleIds || this.enabledModuleIds();
      if (ids.includes("auth")) {
        await this.loadAsync("auth");
        ids = ids.filter((moduleId) => moduleId !== "auth");
        if (this.state.config.dataMode === "live" && this.state.config.authMode === "required" && !this.state.session.authenticated) return [];
      }
      if (ids.includes("account")) {
        await this.loadAsync("account");
        ids = ids.filter((moduleId) => moduleId !== "account");
      }
      return Promise.all(ids.map((moduleId) => this.loadAsync(moduleId)));
    }
    enabledModuleIds() {
      var enabled = this.state.config && this.state.config.enabledModules || [];
      return openedModuleIds.filter((moduleId) => moduleId === "auth" || enabled.includes(moduleId));
    }
    invalidate(moduleId) {
      var descriptor = this.modules[moduleId];
      if (!descriptor) throw new Error("Unknown module: " + moduleId);
      var context = this.context();
      this.cancel(moduleId, descriptor, context);
      return this.load(moduleId);
    }
    reloadAsync(moduleId) {
      var descriptor = this.modules[moduleId];
      if (!descriptor) return Promise.reject(new Error("Unknown module: " + moduleId));
      this.cancel(moduleId, descriptor, this.context());
      return this.loadAsync(moduleId);
    }
    refreshModules(moduleIds) {
      return Promise.all(moduleIds.map((moduleId) => {
        return this.modules[moduleId].asyncOnly ? this.reloadAsync(moduleId) : Promise.resolve(this.invalidate(moduleId));
      }));
    }
  };

  // app-templates/customer-portal/runtime/src/components/spa/SpaBookingFlow.js
  function svcByCode(code) {
    return spaCatalogServices().find(function(s) {
      return s.code === code;
    }) || null;
  }
  function dayByKey(key) {
    return F.spaBooking.days.find(function(d) {
      return d.key === key;
    }) || F.spaBooking.days[0];
  }
  function slotLabel(f) {
    for (var i = 0; i < F.spaBooking.days.length; i++) {
      var d = F.spaBooking.days[i];
      var s = (d.slots || []).find(function(x) {
        return x.ref === f.slotRef;
      });
      if (s) return d.label + " \xB7 " + s.label;
    }
    return null;
  }
  function flowTitle(f) {
    if (f.entry === "reschedule") return "Reschedule your visit";
    if (f.entry === "credit") return "Book with a credit";
    if (f.entry === "book-again") return "Book again";
    return "Book a visit";
  }
  function stepsBar(f) {
    var hasSpec = !!(f.serviceCode && (F.spaBooking.eligibleSpecialists[f.serviceCode] || []).length);
    var steps2 = f.entry === "reschedule" ? [{ k: "slots", l: "New time" }, { k: "review", l: "Review" }] : [{ k: "context", l: "Service" }].concat(hasSpec ? [{ k: "specialist", l: "Specialist" }] : []).concat([{ k: "slots", l: "Time" }, { k: "review", l: "Review" }]);
    var idx = steps2.findIndex(function(s) {
      return s.k === f.step;
    });
    if (idx === -1) idx = 0;
    return h("div", { "class": "bk-steps", "data-module": "booking-steps", "data-visual-id": "booking-steps" }, steps2.map(function(s, i) {
      return h("span", { "class": "bk-step" + (i === idx ? " bk-step--on" : i < idx ? " bk-step--done" : "") }, [
        h("i", null, i < idx ? "\u2713" : String(i + 1)),
        s.l
      ]);
    }));
  }
  function rescheduleCurrent(f) {
    var a = f.rescheduleOf ? currentAppointment() : null;
    if (!a) return null;
    return h("div", { "class": "bk-current", "data-module": "reschedule-current", "data-visual-id": "reschedule-current", "data-appointment-ref": a.ref }, [
      h("div", { "class": "bk-current__label" }, "Currently booked \u2014 unchanged until you confirm"),
      h("div", { style: "font-weight:700;font-size:13.5px", "data-bind": "appointment.service" }, a.service),
      h("div", { style: "font-size:12.5px;color:var(--ink-2)", "data-bind": "appointment.start" }, a.start + " \xB7 " + a.timezoneNote + (a.specialist ? " \xB7 " + a.specialist : ""))
    ]);
  }
  function creditCard(blockingOnly) {
    var f = state.spaFlow;
    if (!f || f.entry !== "credit") return null;
    var cs = state.spaCredit;
    var wrap = h("div", { "class": "bk-credit", "data-module": "plan-credit-context", "data-visual-id": "plan-credit-context", "data-plan-ref": f.planRef || "plan-4e19c3", "data-state": cs }, [
      h("div", { style: "display:flex;align-items:center;gap:8px" }, [
        h("span", { "class": "kind-chip kind-chip--package" }, "Package"),
        h("b", { style: "font-size:13.5px", "data-bind": "plan.title" }, "Six-visit facial series")
      ]),
      h("div", { style: "font-size:12.5px;line-height:1.5;color:var(--ink-2);margin-top:6px", "data-bind": "booking.creditNote" }, F.spaBooking.creditNotes[cs])
    ]);
    if (cs === "changed") wrap.appendChild(h("div", { style: "margin-top:8px" }, ActionButton({ variant: "btn--ghost", label: "Reload balance", action: "ui.retry", id: "plan-credit", visualId: "credit-reload" })));
    if (cs === "exhausted") wrap.appendChild(h("div", { style: "margin-top:8px;font-size:12px" }, h("span", { "class": "link-action", "data-action": "account.openPlan" }, "Open My plan \u203A")));
    if (cs === "unavailable") wrap.appendChild(h("div", { style: "margin-top:8px;font-size:12px" }, h("span", { "class": "link-action", "data-action": "support.open" }, "Contact support \u203A")));
    if (blockingOnly && cs === "ok") return null;
    return wrap;
  }
  function stepContext(f) {
    var parts = [];
    if (f.entry === "reschedule") parts.push(rescheduleCurrent(f));
    var credit = creditCard(false);
    if (credit) parts.push(credit);
    var creditBlocked = f.entry === "credit" && state.spaCredit !== "ok";
    var picked = svcByCode(f.serviceCode);
    var fixedService = f.entry === "credit" || f.entry === "reschedule";
    if (picked && fixedService) {
      parts.push(h("div", { "class": "bk-opt bk-opt--on", "data-module": "booking-context", "data-visual-id": "booking-service", "data-product-code": picked.code }, [
        h("i", { "class": "bk-opt__dot" }),
        h("div", { style: "flex:1;min-width:0" }, [
          h("div", { style: "font-weight:650;font-size:13.5px", "data-bind": "booking.service.name" }, picked.name),
          h("div", { style: "font-size:12px;color:var(--ink-3)" }, picked.shortDescription)
        ]),
        f.entry === "credit" ? h("b", { style: "font-size:13px" }, "1 credit") : h("b", { style: "font-size:13px", "data-bind": "booking.service.displayPrice" }, picked.displayPrice)
      ]));
      parts.push(h("div", { style: "margin-top:14px" }, ActionButton({ variant: "btn--primary", label: "Choose a time", action: "booking.selectService", id: picked.code, block: true, disabled: creditBlocked, visualId: "bk-continue" })));
    } else {
      parts.push(h("div", { "class": "bk-section-label" }, "Choose a treatment"));
      var list = h("div", { "class": "bk-opts", "data-module": "booking-context", "data-visual-id": "booking-service-list" });
      (spaCurrentApiDemoOpen() ? spaCatalogServices().map(function(service) {
        return service.code;
      }) : F.spaBooking.eligibleServices).forEach(function(code) {
        var s = svcByCode(code);
        if (!s) return;
        list.appendChild(h("button", { "class": "bk-opt" + (f.serviceCode === code ? " bk-opt--on" : ""), "data-action": "booking.selectService", "data-id": code, "data-product-code": code, "data-state": f.serviceCode === code ? "active" : void 0 }, [
          h("i", { "class": "bk-opt__dot" }),
          h("div", { style: "flex:1;min-width:0;text-align:left" }, [
            h("div", { style: "font-weight:650;font-size:13.5px", "data-bind": "pim.services[].name" }, s.name),
            h("div", { style: "font-size:12px;color:var(--ink-3)" }, s.shortDescription)
          ]),
          h("b", { style: "font-size:13px", "data-bind": "pim.services[].displayPrice" }, s.displayPrice)
        ]));
      });
      parts.push(list);
      parts.push(h("div", { "class": "bk-note" }, "Prices come from the public catalog \u2014 the exact total is shown before you confirm."));
    }
    return parts;
  }
  function stepSpecialist(f) {
    var refs = F.spaBooking.eligibleSpecialists[f.serviceCode] || [];
    var list = h("div", { "class": "bk-opts", "data-module": "specialist-options", "data-visual-id": "specialist-options" });
    refs.forEach(function(ref) {
      var sp = F.spaBooking.specialists[ref];
      list.appendChild(h("button", { "class": "bk-opt" + (f.specialistRef === ref ? " bk-opt--on" : ""), "data-action": "booking.selectSpecialist", "data-id": ref, "data-specialist-ref": ref }, [
        h("i", { "class": "bk-opt__dot" }),
        h("div", { style: "flex:1;min-width:0;text-align:left" }, [
          h("div", { style: "font-weight:650;font-size:13.5px", "data-bind": "booking.eligibleSpecialists[].name" }, sp.name),
          h("div", { style: "font-size:12px;color:var(--ink-3)" }, sp.role)
        ])
      ]));
    });
    list.appendChild(h("button", { "class": "bk-opt" + (!f.specialistRef ? " bk-opt--muted" : ""), "data-action": "booking.selectSpecialist", "data-id": "any" }, [
      h("i", { "class": "bk-opt__dot" }),
      h("div", { style: "flex:1;text-align:left;font-weight:650;font-size:13.5px" }, "No preference"),
      h("span", { style: "font-size:12px;color:var(--ink-3)" }, "first available")
    ]));
    return [
      h("div", { "class": "bk-section-label" }, "Who would you like?"),
      list,
      backLink()
    ];
  }
  function stepSlots(f) {
    var parts = [];
    if (f.entry === "reschedule") parts.push(rescheduleCurrent(f));
    parts.push(h("div", { "class": "bk-section-label" }, f.entry === "reschedule" ? "Pick a new time" : "Pick a time"));
    if (state.spaSlots === "loading") {
      var sk = h("div", { "data-state": "loading", "aria-busy": "true" }, [skel2("height:34px;border-radius:10px"), skel2("height:120px;border-radius:14px;margin-top:10px")]);
      parts.push(sk);
      return parts;
    }
    if (state.spaSlots === "error") {
      parts.push(InlineFailure({ msg: "Available times didn\u2019t load \u2014 nothing is shown so nothing is guessed. Try again.", retryAction: "ui.retry", retryId: "slots", retryLabel: "Reload times" }));
      parts.push(backLink());
      return parts;
    }
    if (state.spaSlots === "empty") {
      parts.push(h("div", { "class": "bk-empty", "data-state": "empty" }, [
        h("div", { style: "font-weight:700;font-size:14px" }, "No times are open right now"),
        h("div", { style: "font-size:12.5px;color:var(--ink-2);line-height:1.5;margin-top:4px" }, "The studio opens new times regularly \u2014 check back soon, or our team can find one for you."),
        h("div", { style: "margin-top:8px" }, h("span", { "class": "link-action", "data-action": "support.open" }, "Contact support \u203A"))
      ]));
      parts.push(backLink());
      return parts;
    }
    var days = h("div", { "class": "bk-days", "data-module": "slot-days", "data-visual-id": "slot-days" });
    F.spaBooking.days.forEach(function(d) {
      days.appendChild(h("button", { "class": "bk-day" + (d.key === f.dayKey ? " bk-day--on" : ""), "data-action": "booking.selectSlot", "data-id": "day:" + d.key, "data-day-key": d.key }, d.label));
    });
    parts.push(days);
    var day = dayByKey(f.dayKey);
    var grid = h("div", { "class": "bk-slots", "data-module": "slot-grid", "data-visual-id": "slot-grid", "data-bind": "booking.eligibleSlots" });
    day.slots.forEach(function(s) {
      grid.appendChild(h("button", { "class": "bk-slot" + (f.slotRef === s.ref ? " bk-slot--on" : ""), "data-action": "booking.selectSlot", "data-id": s.ref, "data-slot-ref": s.ref, "data-state": f.slotRef === s.ref ? "active" : void 0 }, s.label));
    });
    parts.push(grid);
    var holdKey = "booking.hold:" + f.slotRef;
    var holdPhase = f.slotRef ? cmdPhase(holdKey) : "idle";
    if (holdPhase === "failed") parts.push(InlineFailure({ msg: "That time couldn\u2019t be held \u2014 nothing is booked. Pick it again or choose another time.", retryAction: "booking.retry", retryId: "hold", retryLabel: "Try holding again" }));
    if (holdPhase === "conflict") parts.push(InlineFailure({ msg: "That time was just taken \u2014 nothing is booked. Choose another time.", retryAction: "ui.retry", retryId: holdKey, retryLabel: "OK" }));
    parts.push(h("div", { style: "margin-top:14px" }, ActionButton({
      variant: "btn--primary",
      label: spaCurrentApiDemoOpen() ? "Review this time" : "Hold this time",
      action: "booking.hold",
      id: f.slotRef || void 0,
      block: true,
      pending: holdPhase === "pending",
      pendingLabel: "Holding\u2026",
      disabled: !f.slotRef || holdPhase === "conflict",
      visualId: "bk-hold"
    })));
    parts.push(h("div", { "class": "bk-note" }, spaCurrentApiDemoOpen() ? "This demo API has no availability hold. The time is only selected in this browser until Core confirms the appointment." : "Holding keeps the time briefly while you review \u2014 nothing is booked yet."));
    if (f.entry !== "reschedule") parts.push(backLink());
    return parts;
  }
  function stepReview(f) {
    var parts = [];
    var svc = svcByCode(f.serviceCode);
    var picked = slotLabel(f);
    var sp = f.specialistRef ? F.spaBooking.specialists[f.specialistRef] : null;
    var confirmKey = "booking.confirm:" + F.spaBooking.ref;
    var phase = cmdPhase(confirmKey);
    var holdOk = state.spaHold === "held";
    var creditBlocked = f.entry === "credit" && state.spaCredit !== "ok";
    var origin = f.rescheduleOf ? currentAppointment() : null;
    if (f.entry === "reschedule" && origin) {
      parts.push(h("div", { "class": "bk-compare", "data-module": "reschedule-compare", "data-visual-id": "reschedule-compare", "data-appointment-ref": origin.ref }, [
        h("div", { "class": "bk-compare__cell" }, [
          h("div", { "class": "bk-current__label" }, "Currently booked"),
          h("div", { style: "font-weight:650;font-size:13px", "data-bind": "appointment.start" }, origin.start),
          h("div", { style: "font-size:11.5px;color:var(--ink-3)" }, "stays until you confirm")
        ]),
        h("div", { "class": "bk-compare__arrow" }, "\u2192"),
        h("div", { "class": "bk-compare__cell bk-compare__cell--new" }, [
          h("div", { "class": "bk-current__label" }, "Proposed new time"),
          h("div", { style: "font-weight:650;font-size:13px", "data-bind": "booking.hold.slot" }, picked || "\u2014"),
          h("div", { style: "font-size:11.5px;color:var(--ink-3)" }, "not booked yet")
        ])
      ]));
    }
    var review = h("div", { "class": "booking-review", "data-module": "booking-review", "data-visual-id": "booking-review", "data-payment-mode": "SIMULATED", "data-state": holdOk ? "held" : state.spaHold });
    if (holdOk) review.appendChild(h("div", { "class": "booking-review__hold", "data-module": "booking-hold", "data-visual-id": "booking-hold", "data-hold-ref": spaCurrentApiDemoOpen() ? void 0 : F.spaBooking.hold.ref, "data-bind": "booking.hold.untilLabel" }, spaCurrentApiDemoOpen() ? [h("b", null, "Current API demo"), " \xB7 Core will validate the save when you confirm; no slot hold exists yet."] : [h("b", null, F.spaBooking.hold.untilLabel), " \xB7 " + F.spaBooking.hold.note]));
    if (state.spaHold === "slot-expired") review.appendChild(InlineFailure({ msg: "Your held time expired \u2014 nothing was booked" + (f.entry === "reschedule" ? " and your original visit is unchanged" : "") + ". Pick a new time to continue.", retryAction: "ui.retry", retryId: "booking-hold", retryLabel: "Find a new time" }));
    if (state.spaHold === "repriced") review.appendChild(InlineFailure({ msg: "The price for this time changed while you were reviewing \u2014 reload and check it before confirming.", retryAction: "ui.retry", retryId: "booking-hold", retryLabel: "Reload & review" }));
    var det = h("div", { "class": "appt-details", style: "margin-top:10px" });
    var row = function(l, v) {
      return h("div", { "class": "appt-details__row" }, [h("div", { "class": "appt-details__label" }, l), h("div", { "class": "appt-details__val" }, v)]);
    };
    det.appendChild(row("Visit", h("b", { "data-bind": "booking.service" }, svc ? svc.name : "\u2014")));
    det.appendChild(row("When", h("span", null, [h("b", null, picked || "\u2014"), h("span", { style: "color:var(--ink-3)" }, " \xB7 local time")])));
    det.appendChild(row("With", sp ? h("b", { "data-bind": "booking.specialist" }, sp.name) : h("span", { style: "color:var(--ink-3)" }, "First available specialist")));
    det.appendChild(row("Where", h("span", null, origin ? [h("b", null, F.spa.modeLabels[origin.visitMode]), origin.location ? " \xB7 " + origin.location : null] : [h("b", null, F.spa.modeLabels.salon), " \xB7 " + F.spaBooking.reviewLocation])));
    det.appendChild(row("Price", f.entry === "credit" ? h("span", { "data-bind": "booking.creditNote" }, [h("b", null, "1 visit credit"), " \xB7 no charge for this visit"]) : h("b", { "data-bind": "booking.displayTotal" }, F.spaBooking.displayTotals[f.serviceCode] || svc && svc.displayPrice || "\u2014")));
    review.appendChild(det);
    var creditBlock = creditCard(true);
    if (creditBlock) review.appendChild(creditBlock);
    review.appendChild(h("div", { "class": "bk-note", "data-bind": "booking.policyNote", style: "margin-top:10px" }, F.spaBooking.policyNote));
    review.appendChild(h("label", { "class": "co-policy", "data-module": "policy-ack", "data-visual-id": "booking-policy-ack", "data-state": state.spaBookAck ? "acked" : "required" }, [
      h("button", { "class": "co-policy__box" + (state.spaBookAck ? " co-policy__box--on" : ""), "data-action": "booking.ackPolicy", role: "checkbox", "aria-checked": state.spaBookAck ? "true" : "false" }, state.spaBookAck ? "\u2713" : ""),
      h("span", { "data-bind": "booking.policy" }, F.spaBooking.policy)
    ]));
    review.appendChild(SimulationBadge(true));
    review.appendChild(h("div", { style: "font-size:11.5px;color:var(--ink-3);line-height:1.5;margin-top:6px" }, "No charge is made when you confirm \u2014 you pay at the studio as usual."));
    parts.push(review);
    if (phase === "failed") parts.push(InlineFailure({
      msg: f.entry === "reschedule" ? "Your visit wasn\u2019t moved \u2014 it\u2019s still booked at the original time." : "Your booking wasn\u2019t confirmed \u2014 nothing is scheduled yet.",
      retryAction: "booking.retry",
      retryId: "confirm",
      retryLabel: "Try again"
    }));
    if (phase === "conflict") parts.push(InlineFailure({
      msg: "That time window just changed \u2014 pick again before confirming. Nothing was booked.",
      retryAction: "ui.retry",
      retryId: confirmKey,
      retryLabel: "OK"
    }));
    parts.push(h("div", { style: "margin-top:14px" }, ActionButton({
      variant: "btn--primary",
      label: f.entry === "reschedule" ? "Confirm new time \u2014 no charge" : "Book \u2014 no charge",
      action: "booking.confirm",
      id: F.spaBooking.ref,
      block: true,
      lg: true,
      visualId: "confirm-booking",
      pending: phase === "pending",
      pendingLabel: "Confirming\u2026",
      disabled: !holdOk || !state.spaBookAck || creditBlocked || phase === "conflict"
    })));
    if (holdOk && !state.spaBookAck && phase === "idle") parts.push(h("div", { style: "font-size:11.5px;color:var(--ink-3);margin-top:7px;text-align:center" }, "Tick the policy box above to confirm"));
    parts.push(backLink("\u2039 Back to times"));
    return parts;
  }
  function backLink(label) {
    return h("div", { style: "margin-top:12px" }, h("span", { "class": "link-action", "data-action": "booking.back" }, label || "\u2039 Back"));
  }
  function SpaBookingFlow() {
    var f = state.spaFlow;
    var body = h("div", { "class": "bk-flow", "data-module": "booking-flow", "data-visual-id": "booking-flow", "data-booking-ref": F.spaBooking.ref, "data-payment-mode": "SIMULATED", "data-state": f.step, "data-entry": f.entry });
    body.appendChild(stepsBar(f));
    var parts = f.step === "context" ? stepContext(f) : f.step === "specialist" ? stepSpecialist(f) : f.step === "slots" ? stepSlots(f) : stepReview(f);
    parts.forEach(function(p) {
      if (p) body.appendChild(p);
    });
    return body;
  }

  // app-templates/customer-portal/runtime/src/components/shell/AccountBootstrap.js
  function gateActions(list) {
    return h("div", { "class": "account-gate__actions" }, list);
  }
  function AccountBootstrap() {
    var s = state.account;
    var page = h("section", { "class": "page account-gate", "data-route": state.route, "data-state": s, "data-visual-id": "account-gate", "data-screen-label": "Account (" + s + ")" });
    var card = h("div", { "class": "auth-card account-gate__card", "data-module": "account-bootstrap", "data-visual-id": "account-bootstrap", "data-state": s, "data-intended-route": state.route });
    if (s === "resolving-customer") {
      card.setAttribute("aria-busy", "true");
      card.appendChild(h("div", { "class": "oidc-status" }, [h("span", { "class": "oidc-spinner" })]));
      card.appendChild(h("div", { "class": "oidc-title" }, "Getting your account ready\u2026"));
      card.appendChild(h("div", { "class": "oidc-sub oidc-sub--tail" }, "You\u2019re signed in. We\u2019re securely loading your account and what it can do here \u2014 no need to do anything."));
    } else if (s === "customer-unavailable") {
      card.appendChild(h("div", { "class": "oidc-status" }, [h("div", { "class": "oidc-glyph oidc-glyph--warn" }, "!")]));
      card.appendChild(h("div", { "class": "oidc-title" }, "We can\u2019t open your account right now"));
      card.appendChild(h("div", { "class": "oidc-sub" }, "The portal couldn\u2019t load your account. Your data is safe and nothing was changed \u2014 try again in a moment."));
      card.appendChild(gateActions([
        ActionButton({ variant: "btn--primary", label: "Try again", action: "ui.retry", id: "account-bootstrap", block: true, lg: true, visualId: "account-retry" }),
        ActionButton({ variant: "btn--ghost", label: "Sign out", action: "auth.signOut", block: true, visualId: "account-signout" })
      ]));
    } else if (s === "customer-not-linked") {
      card.appendChild(h("div", { "class": "oidc-status" }, [h("div", { "class": "oidc-glyph" }, "\u26AD")]));
      card.appendChild(h("div", { "class": "oidc-title" }, "This sign-in isn\u2019t linked to a customer account"));
      card.appendChild(h("div", { "class": "oidc-sub" }, "You\u2019re signed in, but this identity isn\u2019t connected to an active customer account with us, so the portal can\u2019t be opened. Our support team can link it for you."));
      card.appendChild(gateActions([
        ActionButton({ variant: "btn--primary", label: "Contact support", action: "support.email", block: true, lg: true, visualId: "account-support" }),
        ActionButton({ variant: "btn--ghost", label: "Sign out", action: "auth.signOut", block: true, visualId: "account-signout" })
      ]));
    } else if (s === "customer-account-ambiguous") {
      card.appendChild(h("div", { "class": "oidc-status" }, [h("div", { "class": "oidc-glyph" }, "\u29C9")]));
      card.appendChild(h("div", { "class": "oidc-title" }, "We can\u2019t tell which account is yours"));
      card.appendChild(h("div", { "class": "oidc-sub" }, "Your sign-in matches more than one customer account, so the portal won\u2019t guess. Our support team can link the right one \u2014 nothing is shown until then."));
      card.appendChild(gateActions([
        ActionButton({ variant: "btn--primary", label: "Contact support", action: "support.email", block: true, lg: true, visualId: "account-support" }),
        ActionButton({ variant: "btn--ghost", label: "Sign out", action: "auth.signOut", block: true, visualId: "account-signout" })
      ]));
    } else if (s === "organization-forbidden") {
      card.appendChild(h("div", { "class": "oidc-status" }, [h("div", { "class": "oidc-glyph" }, "\u2302")]));
      card.appendChild(h("div", { "class": "oidc-title" }, "This sign-in can\u2019t be used here"));
      card.appendChild(h("div", { "class": "oidc-sub" }, "Your sign-in works, but it doesn\u2019t belong to this portal\u2019s organization, so nothing here can be opened. If that seems wrong, contact support."));
      card.appendChild(gateActions([
        ActionButton({ variant: "btn--primary", label: "Contact support", action: "support.email", block: true, lg: true, visualId: "account-support" }),
        ActionButton({ variant: "btn--ghost", label: "Sign out", action: "auth.signOut", block: true, visualId: "account-signout" })
      ]));
    } else if (s === "customer-forbidden") {
      card.appendChild(h("div", { "class": "oidc-status" }, [h("div", { "class": "oidc-glyph" }, "\u26BF")]));
      card.appendChild(h("div", { "class": "oidc-title" }, "This account can\u2019t open the customer portal"));
      card.appendChild(h("div", { "class": "oidc-sub" }, "Your sign-in works, but it doesn\u2019t include access to the customer portal. If you believe it should, contact support."));
      card.appendChild(gateActions([
        ActionButton({ variant: "btn--primary", label: "Contact support", action: "support.email", block: true, lg: true, visualId: "account-support" }),
        ActionButton({ variant: "btn--ghost", label: "Sign out", action: "auth.signOut", block: true, visualId: "account-signout" })
      ]));
    } else if (s === "session-expired") {
      card.appendChild(h("div", { "class": "oidc-status" }, [h("div", { "class": "oidc-glyph" }, "\u23F1")]));
      card.appendChild(h("div", { "class": "oidc-title" }, "Your session ended"));
      card.appendChild(h("div", { "class": "oidc-sub" }, "For your security you were signed out. Nothing you see below is live anymore. Sign in again and you\u2019ll come right back here."));
      card.appendChild(h("div", { "class": "account-gate__route" }, ["Returning to\u2002", h("b", null, routeLabel(state.route))]));
      card.appendChild(gateActions([
        ActionButton({ variant: "btn--primary", label: "Sign in again", action: "auth.oidcSignIn", block: true, lg: true, visualId: "account-reauth" }),
        ActionButton({ variant: "btn--ghost", label: "Back to the catalog", action: "nav.landing", block: true, visualId: "account-catalog" })
      ]));
    }
    page.appendChild(card);
    return page;
  }

  // app-templates/customer-portal/runtime/src/app.js
  function BookingDrawer() {
    if (state.spaFlow) {
      return h("div", null, [
        h("div", { "class": "scrim", "data-action": "booking.close", "data-visual-id": "scrim" }),
        h("aside", { "class": "drawer", "data-module": "drawer", "data-visual-id": "booking-drawer", "data-state": "drawer-open", role: "dialog", "aria-label": flowTitle(state.spaFlow) }, [
          h("div", { "class": "drawer__head" }, [
            h("div", { "class": "drawer__title" }, flowTitle(state.spaFlow)),
            h("button", { "class": "drawer__close", "data-action": "booking.close", "aria-label": "Close" }, "\u2715")
          ]),
          SpaBookingFlow()
        ])
      ]);
    }
    var v = currentTheme();
    var phase = cmdPhase("booking.confirm:booking");
    var spaBridge = isSpa() && state.capability === "target-appointments";
    var holdBlocked = spaBridge && state.spaHold !== "held";
    var spaReview = spaBridge ? h("div", { "class": "booking-review", "data-module": "booking-review", "data-visual-id": "booking-review", "data-payment-mode": "SIMULATED", "data-state": state.spaHold }, [
      state.spaHold === "held" ? h("div", { "class": "booking-review__hold" }, "Your time is held for 10 minutes while you review \u2014 confirming books it.") : null,
      state.spaHold === "slot-expired" ? InlineFailure({ msg: "Your held time expired \u2014 nothing was booked. Pick a new time to continue.", retryAction: "ui.retry", retryId: "booking-hold", retryLabel: "Find a new time" }) : null,
      state.spaHold === "repriced" ? InlineFailure({ msg: "The price for this time changed while you were reviewing \u2014 reload and check it before confirming.", retryAction: "ui.retry", retryId: "booking-hold", retryLabel: "Reload & review" }) : null,
      SimulationBadge(true),
      h("div", { style: "font-size:11.5px;color:var(--ink-3);line-height:1.5;margin-top:6px" }, "No charge is made when you confirm \u2014 you pay at the studio as usual.")
    ]) : null;
    return h("div", null, [
      h("div", { "class": "scrim", "data-action": "booking.close", "data-visual-id": "scrim" }),
      h("aside", { "class": "drawer", "data-module": "drawer", "data-visual-id": "booking-drawer", "data-state": "drawer-open", role: "dialog", "aria-label": "Book a service" }, [
        h("div", { "class": "drawer__head" }, [
          h("div", { "class": "drawer__title" }, activeProfile().drawerTitle),
          h("button", { "class": "drawer__close", "data-action": "booking.close", "aria-label": "Close" }, "\u2715")
        ]),
        h(
          "div",
          { style: "display:flex;flex-direction:column;gap:9px;margin-bottom:18px" },
          v.svc.map(function(s, i) {
            return ServiceCard(s, i);
          })
        ),
        spaReview,
        phase === "failed" || phase === "conflict" ? InlineFailure({
          msg: phase === "conflict" ? "That time window just changed \u2014 pick again before confirming." : "Your booking wasn\u2019t confirmed \u2014 nothing is scheduled yet.",
          retryAction: "booking.confirm",
          retryLabel: phase === "conflict" ? "Re-check & confirm" : "Try again"
        }) : null,
        ActionButton({ variant: "btn--primary", label: spaBridge ? "Book \u2014 no charge" : "Confirm booking", action: "booking.confirm", block: true, lg: true, visualId: "confirm-booking", disabled: holdBlocked, pending: phase === "pending", pendingLabel: "Confirming\u2026" })
      ])
    ]);
  }
  var mount;
  var shell;
  var resizeObs;
  var runtime;
  var liveRetryPromise;
  var careTransitionPromise;
  function loadGrantedCareTransition() {
    var envelope2 = state.moduleData.care;
    var granted = state.config.dataMode === "fixture" && state.config.enabledModules.includes("care") && state.session.authenticated === true && state.session.hasCustomerScope === true && state.session.hasTenantScope === true && state.access && state.access.care && state.access.care.status === "granted";
    if (!granted || !envelope2 || envelope2.phase !== "preflight") return;
    var pending = runtime.loadAsync("care");
    if (pending === careTransitionPromise) return;
    careTransitionPromise = pending;
    pending.then(function() {
      if (careTransitionPromise === pending) careTransitionPromise = null;
      render();
    }, function() {
      if (careTransitionPromise === pending) careTransitionPromise = null;
      render();
    });
  }
  function render() {
    var root = document.documentElement;
    root.setAttribute("data-theme", state.config.theme);
    root.setAttribute("data-mode", state.mode === "Dark" ? "dark" : "light");
    clear(mount);
    if (runtime && state.config.dataMode !== "live") runtime.loadAll();
    if (runtime) runtime.syncPreflight("care");
    if (runtime) loadGrantedCareTransition();
    var content = !isPublic() && state.account !== "ready" ? AccountBootstrap() : renderRoute();
    if (content && state.route !== lastRoute) content.classList.add("route-enter");
    lastRoute = state.route;
    shell = AppShell(content);
    mount.appendChild(shell);
    if (state.drawer === "booking") mount.appendChild(BookingDrawer());
    if (state.toast) mount.appendChild(h("div", { "class": "toast", "data-module": "toast", "data-visual-id": "toast" }, [h("span", { "class": "toast__dot" }), state.toast]));
    applyResponsive();
    positionNavPill();
    var thread = mount.querySelector(".chat-thread");
    if (thread) thread.scrollTop = thread.scrollHeight;
  }
  var lastPill = null;
  var lastRoute = null;
  function positionNavPill() {
    var links = mount.querySelector(".nav-links");
    var pill = links && links.querySelector("[data-nav-pill]");
    if (!pill) {
      lastPill = null;
      return;
    }
    var active = links.querySelector(".nav-link--active");
    if (!active || getComputedStyle(links).display === "none") {
      pill.style.opacity = "0";
      lastPill = null;
      return;
    }
    var target = { left: active.offsetLeft, width: active.offsetWidth };
    pill.style.opacity = "1";
    if (lastPill) {
      pill.style.transition = "none";
      pill.style.width = lastPill.width + "px";
      pill.style.transform = "translateX(" + lastPill.left + "px)";
      pill.getBoundingClientRect();
      pill.style.transition = "";
    }
    pill.style.width = target.width + "px";
    pill.style.transform = "translateX(" + target.left + "px)";
    lastPill = target;
  }
  function applyResponsive() {
    if (resizeObs) resizeObs.disconnect();
    var target = shell;
    var apply = function(w) {
      target.classList.remove("vw-mobile", "vw-tablet", "vw-compact");
      if (w <= 560) target.classList.add("vw-mobile");
      else if (w <= 900) target.classList.add("vw-tablet");
      if (w <= 1040) target.classList.add("vw-compact");
    };
    apply(shell.getBoundingClientRect().width);
    resizeObs = new ResizeObserver(function(ents) {
      apply(ents[0].contentRect.width);
    });
    resizeObs.observe(shell);
  }
  function retryRuntimeLoad() {
    if (state.route === "care" && runtime) {
      state.carePayloadState = "ready";
      return reloadCareRuntime().catch(function() {
        return null;
      });
    }
    if (state.config.dataMode !== "live" || !runtime) {
      setState({ view: "ready" });
      return Promise.resolve();
    }
    if (liveRetryPromise) return liveRetryPromise;
    state.view = "loading";
    render();
    liveRetryPromise = runtime.loadAllAsync().then(function() {
      state.view = "ready";
      render();
    }).catch(function(error2) {
      state.view = state.config.errorMode === "fallback" ? "fallback" : "error";
      console.error("[aircove] runtime retry failed", error2);
      render();
    }).finally(function() {
      liveRetryPromise = null;
    });
    return liveRetryPromise;
  }
  function invalidateCareRuntime() {
    if (!runtime) return null;
    return runtime.invalidate("care");
  }
  function reloadCareRuntime() {
    if (!runtime) return Promise.resolve(null);
    var pending = runtime.reloadAsync("care");
    render();
    return pending.then(function(result) {
      render();
      return result;
    }).catch(function(error2) {
      render();
      throw error2;
    });
  }
  function reloadRuntimeModule(moduleId) {
    if (!runtime) return Promise.reject(new Error("Portal runtime is not ready"));
    var pending = runtime.reloadAsync(moduleId);
    render();
    return pending.then(function(result) {
      render();
      return result;
    }).catch(function(error2) {
      render();
      throw error2;
    });
  }
  document.addEventListener("DOMContentLoaded", function() {
    mount = document.getElementById("app");
    applyPortalConfig(readPortalConfig(mount));
    runtime = new PortalRuntime({ state });
    var loaded = runtime.loadAllAsync();
    initRouter(render);
    bindActions(mount);
    loaded.then(function() {
      if (state.session.authenticated && state.route === "auth.oidc" && state.session.intendedRoute) {
        var intended = state.session.intendedRoute;
        state.session.intendedRoute = null;
        go(intended);
        return;
      }
      render();
    }).catch(function(error2) {
      state.view = state.config.errorMode === "fallback" ? "fallback" : "error";
      console.error("[aircove] runtime load failed", error2);
      render();
    });
  });
  window.AircovePortal = { state, go, setState, ACTIONS, runtime: function() {
    return runtime;
  } };
})();
