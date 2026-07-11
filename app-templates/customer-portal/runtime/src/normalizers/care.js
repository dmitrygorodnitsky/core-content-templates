const CARE_KINDS = ["equipment", "seasonLog", "program", "water", "roof", "monitoring", "healthCare", "beautyCare"];

const CARE_META = {
  hvac: { navLabel: "Equipment", title: "Your equipment", subtitle: "Every unit we service \u2014 condition, warranty and the latest diagnostic in one place." },
  snow: { navLabel: "Season log", title: "Season log", subtitle: "Every storm response this winter \u2014 GPS-logged, timed against your SLA, with materials used." },
  lawn: { navLabel: "Program", title: "Season program", subtitle: "Your 5-step feeding and care program \u2014 what\u2019s done, what\u2019s next, and when the lawn is safe to use." },
  pool: { navLabel: "Water", title: "Water quality", subtitle: "Readings from every visit, tracked against safe ranges \u2014 plus what your tech dosed and why." },
  roofing: { navLabel: "Roof report", title: "Roof condition", subtitle: "Findings from your drone inspection on Jan 8 \u2014 and the repair project it kicked off." },
  pest: { navLabel: "Monitoring", title: "Station monitoring", subtitle: "Bait stations and smart sensors watch your home between visits \u2014 alerts go straight to your technician." },
  health: { navLabel: "Care plan", title: "Your care plan", subtitle: "Appointments, milestones, documents and your care team \u2014 the logistics in one place. Clinical details stay with your provider." },
  beauty: { navLabel: "My routine", title: "Your routine", subtitle: "Appointments, packages, your specialist and the formulas they use \u2014 remembered visit to visit." },
};

const ACTIONS_BY_KIND = {
  equipment: ["care.selectUnit"],
  seasonLog: [],
  program: [],
  water: [],
  roof: [],
  monitoring: ["care.requestRetreat"],
  healthCare: ["care.completeTask"],
  beautyCare: ["care.selectSpecialist"],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function emptyState(raw) {
  if (!raw) return null;
  return { glyph: raw.glyph, title: raw.title, description: raw.desc };
}

function stripClosedDocumentDestinations(content) {
  if (!Array.isArray(content.docs)) return;
  content.docs = content.docs.map(function (documentItem) {
    var safe = Object.assign({}, documentItem);
    delete safe.url;
    delete safe.href;
    delete safe.downloadUrl;
    delete safe.filename;
    return safe;
  });
}

export function careDisplayMeta(vertical) {
  return CARE_META[vertical] || CARE_META.hvac;
}

function envelope(vertical, phase, stateName, access, extra) {
  var meta = careDisplayMeta(vertical);
  return Object.assign({
    id: "care", vertical: vertical, phase: phase, kind: null,
    navLabel: meta.navLabel, title: meta.title, subtitle: meta.subtitle,
    state: stateName,
    access: { status: access.status, reasonCode: access.reasonCode || null },
    emptyState: null, content: null, allowedActions: [],
  }, extra || {});
}

export function normalizeCarePreflight(access, context) {
  var stateName = access.status === "disabled" ? "disabled"
    : access.status === "checking" ? "loading"
    : access.status === "error" ? "error" : "unauthorized";
  return envelope(context.config.vertical, "preflight", stateName, access);
}

export function normalizeCareLoading(context) {
  return envelope(context.config.vertical, "payload", "loading", { status: "granted", reasonCode: null });
}

export function normalizeCareFailure(context, reasonCode) {
  return envelope(context.config.vertical, "payload", "error", { status: "granted", reasonCode: reasonCode || "payload-load-failed" });
}

export function normalizeCare(raw) {
  var stateName = raw && raw.state;
  if (!["ready", "loading", "empty", "error"].includes(stateName)) throw new Error("Unsupported Care payload state");

  if (stateName !== "ready") {
    return envelope(raw.vertical, "payload", stateName, { status: "granted", reasonCode: null }, {
      emptyState: stateName === "empty" ? emptyState(raw.emptyState) : null,
    });
  }

  var fixture = raw.fixture;
  if (!fixture || !CARE_KINDS.includes(fixture.kind)) throw new Error("Invalid Care fixture kind");
  var content = clone(fixture);
  delete content.kind;
  delete content.navLabel;
  delete content.title;
  delete content.sub;
  delete content.empty;
  stripClosedDocumentDestinations(content);

  if (fixture.kind === "beautyCare") {
    var productsByName = new Map((raw.products || []).map(function (product) { return [product.name, product]; }));
    content.productRecs.items = content.productRecs.names.map(function (name) { return productsByName.get(name); }).filter(Boolean);
  }

  return envelope(raw.vertical, "payload", "ready", { status: "granted", reasonCode: null }, {
    kind: fixture.kind,
    navLabel: fixture.navLabel,
    title: fixture.title,
    subtitle: fixture.sub,
    emptyState: emptyState(fixture.empty),
    content: content,
    allowedActions: ACTIONS_BY_KIND[fixture.kind].slice(),
  });
}
