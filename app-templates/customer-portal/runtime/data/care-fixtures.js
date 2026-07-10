export const careFixtures = {
    "HVAC": {
      kind: "equipment", navLabel: "Equipment",
      empty: { glyph: "\u2699", title: "No equipment on file yet", desc: "After your first visit, every unit we service appears here with its passport and diagnostics." },
      title: "Your equipment", sub: "Every unit we service \u2014 condition, warranty and the latest diagnostic in one place.",
      units: [
        { id: "unit-ac-01", name: "Central AC", model: "Carrier 24ACC636", place: "Backyard pad", serial: "SN 4A88-22014", installed: "2019", warranty: "Parts until Aug 2029", lastVisit: "Jan 12, 2026", health: 86,
          note: "Supply-air \u0394T is trending slightly low \u2014 worth a coil clean before summer.",
          checks: [
            { group: "Cooling performance", items: [
              { name: "Refrigerant pressure", state: "ok", val: "118 psi" },
              { name: "Supply air \u0394T", state: "warn", val: "19\u00b0F", note: "target 20\u201322\u00b0F" },
              { name: "Compressor draw", state: "ok", val: "6.4 A" } ] },
            { group: "Airflow & filtration", items: [
              { name: "Air filter", state: "warn", val: "88 days", note: "replace soon" },
              { name: "Blower motor", state: "ok", val: "normal" },
              { name: "Duct static pressure", state: "ok", val: "0.48 in" } ] },
            { group: "Safety & electrical", items: [
              { name: "Capacitor", state: "ok", val: "within spec" },
              { name: "Contactor & wiring", state: "ok", val: "no wear" },
              { name: "Condensate drain", state: "ok", val: "clear" } ] }
          ] },
        { id: "unit-furnace-01", name: "Furnace", model: "Lennox EL296V", place: "Basement", serial: "SN 7C21-90387", installed: "2016", warranty: "Heat exchanger until 2036", lastVisit: "Oct 3, 2025", health: 71,
          note: "Igniter is near end of life \u2014 replacement recommended at the next visit.",
          checks: [
            { group: "Heating performance", items: [
              { name: "Ignition system", state: "issue", val: "aging igniter", note: "replace recommended" },
              { name: "Flame sensor", state: "ok", val: "cleaned Oct 3" },
              { name: "Temperature rise", state: "ok", val: "52\u00b0F" } ] },
            { group: "Safety", items: [
              { name: "Heat exchanger", state: "ok", val: "no cracks" },
              { name: "CO at registers", state: "ok", val: "0 ppm" },
              { name: "Gas connections", state: "ok", val: "no leaks" } ] },
            { group: "Airflow", items: [
              { name: "Blower wheel", state: "warn", val: "light dust", note: "clean at tune-up" },
              { name: "Return airflow", state: "ok", val: "normal" } ] }
          ] }
      ],
      docs: [
        { id: "doc-hvac-diag-2026-01", name: "Diagnostic report \u2014 Jan 12, 2026", meta: "PDF \u00b7 21-point check" },
        { id: "doc-hvac-warranty-carrier", name: "Carrier parts warranty", meta: "PDF \u00b7 valid to 2029" }
      ]
    },
    "Snow Removal": {
      kind: "seasonLog", navLabel: "Season log",
      empty: { glyph: "\u2744", title: "No storm responses yet", desc: "When the first storm triggers a visit, the GPS-logged response appears here." },
      title: "Season log", sub: "Every storm response this winter \u2014 GPS-logged, timed against your SLA, with materials used.",
      stats: [
        { label: "Storms served", value: "9" }, { label: "Visits", value: "14" },
        { label: "Avg response", value: "52 min" }, { label: "De-icer used", value: "310 kg" }
      ],
      sla: { pct: 93, label: "13 of 14 visits inside the 90-minute window \u2014 the missed one was credited per contract." },
      events: [
        { date: "Jan 12", storm: "Snowfall 3.2 cm", trigger: "Auto \u00b7 2 cm rule", response: "38 min", sla: true, material: "22 kg salt", orderId: "#SV-3290", photos: true },
        { date: "Jan 5", storm: "Snowfall 4.1 cm", trigger: "Auto \u00b7 2 cm rule", response: "47 min", sla: true, material: "26 kg salt", orderId: "#SV-3290", photos: true },
        { date: "Dec 28", storm: "Freezing rain", trigger: "Ice watch", response: "41 min", sla: true, material: "31 kg brine", photos: true },
        { date: "Dec 19", storm: "Snowfall 8.6 cm", trigger: "Auto \u00b7 2 cm rule", response: "104 min", sla: false, material: "24 kg salt", note: "crew rerouted \u2014 visit credited", photos: true },
        { date: "Dec 12", storm: "Snowfall 2.3 cm", trigger: "Auto \u00b7 2 cm rule", response: "55 min", sla: true, material: "18 kg salt", photos: true }
      ],
      docs: [
        { id: "doc-snow-compliance-2025-12", name: "December compliance report", meta: "PDF \u00b7 8 visits \u00b7 slip-and-fall record" },
        { id: "doc-snow-compliance-2025-11", name: "November compliance report", meta: "PDF \u00b7 4 visits" }
      ]
    },
    "Lawn & Garden": {
      kind: "program", navLabel: "Program",
      empty: { glyph: "\u2618", title: "Program starts in spring", desc: "Your 5-step season program appears here once the first application is scheduled." },
      title: "Season program", sub: "Your 5-step feeding and care program \u2014 what\u2019s done, what\u2019s next, and when the lawn is safe to use.",
      reentry: { active: true, treatment: "Fertilizing \u2014 applied today, 2:10 PM", safeAfter: "Safe after 6:00 PM today", note: "Water-in complete. Keep kids and pets off treated areas until dry." },
      steps: [
        { n: 1, name: "Early spring feed", detail: "Slow-release + pre-emergent", window: "April", status: "done", when: "Done \u00b7 Apr 14" },
        { n: 2, name: "Late spring feed", detail: "Balanced feed + broadleaf control", window: "May", status: "done", when: "Done \u00b7 May 22" },
        { n: 3, name: "Summer feed + grub control", detail: "Heat-safe formula", window: "July", status: "next", when: "Scheduled \u00b7 Jul 18" },
        { n: 4, name: "Fall feed", detail: "Root-builder + overseed", window: "September", status: "upcoming", when: "Auto-scheduled" },
        { n: 5, name: "Winterizer", detail: "Potassium winterizer", window: "November", status: "upcoming", when: "Auto-scheduled" }
      ],
      soil: [
        { label: "Soil pH", value: "6.6 \u00b7 ideal" }, { label: "Nitrogen", value: "adequate" }, { label: "Thatch", value: "6 mm \u00b7 fine" }
      ],
      photos: [{ label: "April" }, { label: "May" }, { label: "June", tone: "after" }]
    },
    "Pool & Spa": {
      kind: "water", navLabel: "Water",
      empty: { glyph: "\u25cb", title: "No readings yet", desc: "Water chemistry from every visit lands here after your first test." },
      title: "Water quality", sub: "Readings from every visit, tracked against safe ranges \u2014 plus what your tech dosed and why.",
      tested: "Last tested Jan 12 \u00b7 9:40 AM \u00b7 Daniel R.",
      nextTest: "Next test \u2014 Jan 19 (weekly plan)",
      readings: [
        { name: "pH", value: "7.4", target: "target 7.2\u20137.6", state: "ok", series: [55, 70, 80, 45, 60] },
        { name: "Free chlorine", value: "1.8 ppm", target: "target 1\u20133 ppm", state: "ok", series: [40, 35, 60, 70, 55] },
        { name: "Alkalinity", value: "78 ppm", target: "target 80\u2013120 ppm", state: "warn", note: "Slightly low \u2014 dose added Jan 12", series: [80, 70, 60, 50, 45] },
        { name: "Water temp", value: "27\u00b0C", target: "heater set 28\u00b0C", state: "ok", series: [50, 55, 60, 62, 65] }
      ],
      doses: [
        { date: "Jan 12", what: "Alkalinity increaser 1.2 kg \u00b7 chlorine tabs \u00d72", why: "Alkalinity trending low" },
        { date: "Jan 5", what: "Chlorine tabs \u00d72", why: "Routine top-up" },
        { date: "Dec 29", what: "Algaecide 250 ml", why: "Preventive \u2014 warm spell" }
      ]
    },
    "Roofing": {
      kind: "roof", navLabel: "Roof report",
      empty: { glyph: "\u2302", title: "No inspection yet", desc: "Book your first drone inspection to get a zone-by-zone condition report." },
      title: "Roof condition", sub: "Findings from your drone inspection on Jan 8 \u2014 and the repair project it kicked off.",
      score: "82", grade: "Good", inspected: "Inspected Jan 8, 2026", nextDue: "Next inspection \u2014 Jan 2027",
      zones: [
        { zone: "Main roof \u2014 south face", sev: "ok", note: "Shingles sound \u00b7 no lifting or granule loss" },
        { zone: "Valley at dormer", sev: "warn", note: "Early granule loss \u2014 monitor, reseal in 2026" },
        { zone: "Chimney flashing", sev: "issue", note: "Cracked sealant \u2014 repair scheduled Jan 22" },
        { zone: "Gutters \u2014 north run", sev: "warn", note: "60% debris \u2014 cleaning added to the visit" },
        { zone: "Ridge & vents", sev: "ok", note: "Ventilation normal" }
      ],
      project: { name: "Chimney flashing repair", eta: "Crew arrives Jan 22 \u00b7 9:00 AM", steps: [
        { label: "Quote approved", sub: "Jan 9 \u00b7 $180 \u00b7 2-year warranty", dot: "var(--ok)" },
        { label: "Materials ordered", sub: "Jan 10 \u00b7 matching flashing kit", dot: "var(--ok)" },
        { label: "Repair day", sub: "Jan 22 \u00b7 one crew, ~2 h", dot: "var(--accent)" },
        { label: "Final drone check", sub: "Within 7 days of repair", dot: "rgba(120,120,128,.35)", muted: true }
      ] },
      docs: [
        { id: "doc-roof-inspection-2026-01", name: "Inspection report \u2014 Jan 2026", meta: "PDF \u00b7 18 drone photos" },
        { id: "doc-roof-warranty-shingle", name: "25-year shingle warranty", meta: "PDF \u00b7 transferable" },
        { id: "doc-roof-insurance-pack", name: "Insurance documentation pack", meta: "ZIP \u00b7 photos + condition report" }
      ]
    },
    "Pest Control": {
      kind: "monitoring", navLabel: "Monitoring",
      empty: { glyph: "\u25c9", title: "No stations installed yet", desc: "After installation, every bait station and sensor reports its status here." },
      title: "Station monitoring", sub: "Bait stations and smart sensors watch your home between visits \u2014 alerts go straight to your technician.",
      summary: [
        { label: "Stations active", value: "8" }, { label: "Open alerts", value: "1" }, { label: "Last full sweep", value: "Jan 9" }
      ],
      stations: [
        { id: "S1", label: "Garage \u2014 north wall", type: "Bait station", status: "clear", last: "Checked Jan 9", x: 20, y: 64 },
        { id: "S2", label: "Kitchen \u2014 under sink", type: "Smart sensor", status: "alert", last: "Today \u00b7 4:12 AM", note: "activity detected", x: 46, y: 30 },
        { id: "S3", label: "Attic hatch", type: "Smart sensor", status: "clear", last: "Checked Jan 9", x: 62, y: 18 },
        { id: "S4", label: "Foundation \u2014 SE corner", type: "Bait station", status: "refreshed", last: "Bait refreshed Jan 9", x: 78, y: 70 },
        { id: "S5", label: "Crawl space entry", type: "Bait station", status: "clear", last: "Checked Jan 9", x: 34, y: 82 }
      ],
      alerts: [
        { when: "Today \u00b7 4:12 AM", text: "Sensor S2 (kitchen) \u2014 activity detected, Daniel notified automatically", state: "alert" },
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
      kind: "healthCare", navLabel: "Care plan",
      empty: { glyph: "\u2661", title: "No care plan yet", desc: "After your intake assessment, appointments, milestones and documents appear here." },
      title: "Your care plan", sub: "Appointments, milestones, documents and your care team \u2014 the logistics in one place. Clinical details stay with your provider.",
      disclaimer: "This portal shows scheduling and documents only \u2014 it is not a medical record. For clinical questions, contact your provider.",
      appointment: { id: "appt-health-2026-0130", name: "Physio session \u00b7 mid-plan review", providerId: "prov-health-pt-01", provider: "Priya N., physiotherapist", when: "Fri, Jan 30 \u00b7 10:00\u201311:00 AM", where: "Home \u2014 1240 Pine Street", orderId: "#SV-2410", prep: "Clear a 2\u00d72 m space and wear comfortable shoes. A family member is welcome to join the review." },
      plan: { id: "plan-health-2026", name: "Mobility & independence plan", cadence: "Reviewed quarterly \u00b7 started Nov 2025", milestones: [
        { n: 1, name: "Intake & home assessment", detail: "Care team assigned \u00b7 home setup reviewed", status: "done", when: "Done \u00b7 Nov 12" },
        { n: 2, name: "Weekly session rhythm", detail: "Twice-weekly sessions established", status: "done", when: "Done \u00b7 Dec 8" },
        { n: 3, name: "Mid-plan review", detail: "Review with you and your family", status: "next", when: "Scheduled \u00b7 Jan 30" },
        { n: 4, name: "Cadence check-in", detail: "Adjust visit frequency together", status: "upcoming", when: "Planned \u00b7 Mar" }
      ] },
      tasks: [
        { id: "task-health-01", label: "Confirm the Jan 30 session", due: "by Jan 28", done: false },
        { id: "task-health-02", label: "Sign the updated care plan", due: "before the review", done: false },
        { id: "task-health-03", label: "Send preferred times for February", due: "this month", done: true }
      ],
      provider: { id: "prov-health-pt-01", name: "Priya N.", role: "Physiotherapist \u00b7 your care lead", org: "Aircove partner provider network", since: "Your care lead since Nov 2025", note: "Messages are answered within one business day. This channel is for scheduling \u2014 for anything urgent, call your provider directly." },
      docs: [
        { id: "doc-health-plan-2025-11", name: "Care plan \u2014 signed Nov 2025", meta: "Secure PDF \u00b7 opens in the secure viewer", secure: true },
        { id: "doc-health-visit-2026-01-12", name: "Visit summary \u2014 Jan 12", meta: "Secure PDF \u00b7 session notes", secure: true },
        { id: "doc-health-results-2026-01", name: "Results package \u2014 Jan 2026", meta: "Secure \u00b7 contents never previewed here", secure: true }
      ],
      docsNote: "Documents open in the secure viewer only \u2014 nothing is previewed on this page and every access is logged."
    },
    /* WAVE 9 — Beauty care hub: appointments & packages, specialist
       preference, treatment/routine history, loyalty, routine products. */
    "Beauty": {
      kind: "beautyCare", navLabel: "My routine",
      empty: { glyph: "\u2740", title: "No routine yet", desc: "After your first visit, appointments, history and your specialist\u2019s notes appear here." },
      title: "Your routine", sub: "Appointments, packages, your specialist and the formulas they use \u2014 remembered visit to visit.",
      appointment: { id: "appt-beauty-2026-0116", name: "Gel manicure", specialistId: "spec-beauty-02", specialist: "Dana P., nail specialist", when: "Tomorrow \u00b7 Jan 16 \u00b7 2:00 PM", where: "Home \u2014 1240 Pine Street", orderId: "#SV-3312", prep: "Kit is sanitised and sealed \u2014 just have a clear table spot ready." },
      pkg: { id: "pkg-beauty-glow-2026", name: "Glow package", detail: "6 facial treatments \u00b7 valid to Jun 2026", used: 2, total: 6, next: "Session 3 \u2014 book anytime, it never expires early" },
      specialists: [
        { id: "spec-beauty-01", name: "Alina V.", role: "Hair & skin", rating: "4.9", visits: "18 visits with you" },
        { id: "spec-beauty-02", name: "Dana P.", role: "Nails", rating: "4.8", visits: "6 visits with you" },
        { id: "spec-beauty-03", name: "Marco T.", role: "Massage & spa", rating: "5.0", visits: "New to you" }
      ],
      preferredId: "spec-beauty-01",
      history: [
        { date: "Jan 8", what: "Facial treatment", who: "Alina V.", note: "Hydration serum \u00b7 T-zone is sensitive \u2014 gentle exfoliant only" },
        { date: "Dec 20", what: "Gel manicure", who: "Dana P.", note: "Shade \u201cRosewood 214\u201d saved to your profile" },
        { date: "Dec 6", what: "Root touch-up & blowout", who: "Alina V.", note: "Formula 6N + 20 vol \u00b7 35 min \u2014 saved" },
        { date: "Nov 22", what: "Facial treatment", who: "Alina V.", note: "Winter routine started \u2014 overnight mask twice a week" }
      ],
      routine: { title: "Between visits", note: "Hydration serum every morning \u00b7 overnight mask Tue & Sat. Next color window: early February \u2014 Alina will hold a slot.", by: "Set by Alina V. \u00b7 Jan 8" },
      loyalty: { id: "plan-beauty-member-2026", tier: "Gold member", points: 420, nextAt: 500, reward: "Free blowout at 500 pts", renews: "Renews Mar 1, 2026" },
      productRecs: { note: "Picked by Alina for your routine", names: ["Silk Repair Set", "Hydration Serum", "Overnight Mask"] }
    }
};
