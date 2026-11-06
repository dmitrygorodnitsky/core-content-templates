import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

export const illustrationsRoot = path.resolve("app-templates/customer-portal/assets/snow-landing");

const KB = 1024;
const slot = (name, width, height, maxBytes, kind) => Object.freeze({ name, file: name + ".webp", width, height, maxBytes, kind });

export const illustrationSlots = Object.freeze([
  slot("hero", 960, 720, 180 * KB, "hero"),
  slot("service-snow-removal", 720, 480, 90 * KB, "service"),
  slot("service-de-icing", 720, 480, 90 * KB, "service"),
  slot("step-request", 240, 240, 30 * KB, "step"),
  slot("step-prepare", 240, 240, 30 * KB, "step"),
  slot("step-accept", 240, 240, 30 * KB, "step"),
  slot("step-portal", 240, 240, 30 * KB, "step"),
  slot("service-area", 1600, 500, 150 * KB, "area"),
  slot("final-cta", 1600, 400, 140 * KB, "final"),
]);

export const serviceSlotNames = Object.freeze(["service-snow-removal", "service-de-icing"]);
export const stepSlotNames = Object.freeze(["step-request", "step-prepare", "step-accept", "step-portal"]);

const flake = (x, y, r) => '<circle class="snow-art__snow" cx="' + x + '" cy="' + y + '" r="' + r + '"/>';
const flakes = (points) => points.map((point) => flake(point[0], point[1], point[2])).join("");
const hill = (d) => '<path class="snow-art__snow" d="' + d + '"/>';
const mist = (d) => '<path class="snow-art__mist" d="' + d + '"/>';
const plow = (x, y, s) => '<g class="snow-art__plow" transform="translate(' + x + " " + y + ") scale(" + s + ')">'
  + '<path class="snow-art__warm" d="M-34 20 L0 -4 V52 H-48 Z"/>'
  + '<rect class="snow-art__deep" x="0" y="0" width="118" height="44" rx="10"/>'
  + '<path class="snow-art__deep" d="M60 0 L72 -34 H112 Q118 -34 118 -28 V0 Z"/>'
  + '<path class="snow-art__sky" d="M72 -6 L80 -27 H108 V-6 Z"/>'
  + '<circle class="snow-art__ink" cx="28" cy="48" r="13"/><circle class="snow-art__ink" cx="94" cy="48" r="13"/>'
  + "</g>";
const glyph = (d) => '<circle class="snow-art__sky" cx="120" cy="120" r="108"/><path class="snow-art__line" d="' + d + '"/>';

const PLACEHOLDERS = {
  hero: '<clipPath id="snow-art-hero-clip"><rect width="960" height="720" rx="56"/></clipPath><g clip-path="url(#snow-art-hero-clip)">'
    + '<rect class="snow-art__sky" width="960" height="720"/><circle class="snow-art__mist" cx="770" cy="150" r="82"/>'
    + mist("M0 440 C180 370 340 410 480 440 S780 490 960 400 V720 H0 Z")
    + '<rect class="snow-art__deep" x="140" y="350" width="210" height="150" rx="6"/><path class="snow-art__deep" d="M116 356 L245 262 L374 356 Z"/><path class="snow-art__snow" d="M116 356 L245 262 L374 356 L340 356 L245 290 L150 356 Z"/><rect class="snow-art__warm" x="215" y="400" width="60" height="60" rx="5"/>'
    + hill("M0 550 C220 480 420 510 600 550 S860 590 960 530 V720 H0 Z")
    + plow(560, 462, 1.25)
    + flakes([[90, 110, 8], [210, 200, 6], [340, 90, 7], [470, 170, 9], [600, 80, 6], [700, 260, 7], [860, 300, 8], [420, 300, 5], [70, 300, 6], [900, 120, 6]])
    + "</g>",
  "service-snow-removal": '<rect class="snow-art__sky" width="720" height="480"/>' + mist("M0 300 C160 250 320 280 460 300 S640 330 720 280 V480 H0 Z") + hill("M0 370 C200 330 380 350 520 380 S660 400 720 370 V480 H0 Z") + plow(300, 306, 1.35)
    + flakes([[80, 90, 7], [180, 170, 5], [300, 70, 6], [430, 150, 8], [560, 80, 6], [650, 180, 5]]),
  "service-de-icing": '<rect class="snow-art__sky" width="720" height="480"/>' + mist("M0 340 C180 310 360 340 720 300 V480 H0 Z")
    + '<g class="snow-art__line snow-art__line--wide"><path d="M360 70 V290 M265 125 L455 235 M455 125 L265 235"/><path d="M360 110 L334 86 M360 110 L386 86 M360 250 L334 274 M360 250 L386 274"/><path d="M300 160 L266 168 M300 160 L290 126 M420 200 L454 192 M420 200 L430 234 M420 160 L454 168 M420 160 L430 126 M300 200 L266 192 M300 200 L290 234"/></g>'
    + flakes([[120, 400, 7], [190, 430, 5], [270, 395, 6], [350, 435, 7], [430, 400, 5], [510, 430, 6], [590, 395, 7], [650, 430, 5]]),
  "step-request": glyph("M120 186 C120 186 72 142 72 106 A48 48 0 1 1 168 106 C168 142 120 186 120 186 Z M120 124 A18 18 0 1 0 120 88 A18 18 0 1 0 120 124 Z"),
  "step-prepare": glyph("M64 76 H176 V164 H64 Z M64 100 H80 M64 124 H88 M64 148 H80 M96 76 V92 M128 76 V100 M160 76 V92"),
  "step-accept": glyph("M78 56 H146 L166 76 V184 H78 Z M146 56 V76 H166 M98 128 L114 146 L146 106"),
  "step-portal": glyph("M58 72 H182 V168 H58 Z M58 96 H182 M72 84 H80 M90 84 H98 M120 152 C120 152 100 134 100 120 A20 20 0 1 1 140 120 C140 134 120 152 120 152 Z"),
  "service-area": '<rect class="snow-art__sky" width="1600" height="500"/>'
    + mist("M0 300 L240 150 L420 270 L640 110 L860 280 L1080 140 L1320 270 L1600 170 V500 H0 Z")
    + '<g class="snow-art__deep"><rect x="330" y="250" width="70" height="190"/><rect x="420" y="190" width="80" height="250"/><rect x="520" y="280" width="60" height="160"/><rect x="740" y="160" width="90" height="280"/><rect x="850" y="230" width="70" height="210"/><rect x="1080" y="260" width="80" height="180"/><rect x="1180" y="210" width="70" height="230"/></g>'
    + hill("M0 420 C320 380 640 430 960 410 S1400 390 1600 420 V500 H0 Z")
    + '<g class="snow-art__pins"><circle cx="200" cy="380" r="15"/><circle cx="460" cy="150" r="15"/><circle cx="785" cy="120" r="15"/><circle cx="1215" cy="170" r="15"/><circle cx="1440" cy="370" r="15"/></g>',
  "final-cta": mist("M0 260 C260 180 520 240 800 260 S1300 300 1600 210 V400 H0 Z") + hill("M0 320 C300 270 620 300 900 330 S1380 350 1600 300 V400 H0 Z")
    + '<g class="snow-art__snow"><path d="M170 300 L204 200 L238 300 Z"/><path d="M240 296 L268 216 L296 296 Z"/><path d="M1270 310 L1304 210 L1338 310 Z"/><path d="M1340 306 L1368 226 L1396 306 Z"/></g>',
};

export const illustrationMediaPath = (directory = illustrationsRoot) => path.join(directory, "media.json");

export const illustrationImageCode = (name) => name.replace(/-/g, "_").toUpperCase() + "_ART";

async function readIllustrationMedia(directory) {
  try {
    return JSON.parse(await fs.readFile(illustrationMediaPath(directory), "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return {};
    throw error;
  }
}

export async function readIllustrations(directory = illustrationsRoot) {
  const found = new Map();
  const media = await readIllustrationMedia(directory);
  for (const item of illustrationSlots) {
    let bytes;
    try {
      bytes = await fs.readFile(path.join(directory, item.file));
    } catch (error) {
      if (error.code === "ENOENT") continue;
      throw error;
    }
    const size = webpSize(bytes);
    if (!size) throw new Error("Illustration " + item.file + " must be a WebP file");
    if (size.width !== item.width || size.height !== item.height) throw new Error("Illustration " + item.file + " must be exactly " + item.width + "x" + item.height + ", got " + size.width + "x" + size.height);
    if (bytes.length > item.maxBytes) throw new Error("Illustration " + item.file + " is " + bytes.length + " bytes; the slot allows " + item.maxBytes);
    const uploaded = media[item.name];
    if (!uploaded || uploaded.sha256 !== createHash("sha256").update(bytes).digest("hex")) throw new Error("Illustration " + item.file + " is not in the media library; run upload-snow-landing-illustrations.mjs --live");
    found.set(item.name, { id: uploaded.id, name: uploaded.name });
  }
  return found;
}

export function webpSize(bytes) {
  if (bytes.length < 30 || bytes.toString("latin1", 0, 4) !== "RIFF" || bytes.toString("latin1", 8, 12) !== "WEBP") return null;
  const chunk = bytes.toString("latin1", 12, 16);
  if (chunk === "VP8X") return { width: 1 + bytes.readUIntLE(24, 3), height: 1 + bytes.readUIntLE(27, 3) };
  if (chunk === "VP8 ") return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
  if (chunk === "VP8L") {
    const bits = bytes.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
  }
  return null;
}

export function illustrationHtml(name, illustrations) {
  const item = illustrationSlots.find((entry) => entry.name === name);
  if (!item) throw new Error("Unknown illustration slot " + name);
  const art = illustrations.get(name);
  const open = '<div class="snow-art snow-art--' + item.kind + '" data-illustration="' + name + '" data-illustration-state="' + (art ? "art" : "placeholder") + '" style="aspect-ratio:' + item.width + " / " + item.height + '" aria-hidden="true">';
  const code = illustrationImageCode(name);
  const body = art
    ? '<img src="/core/image/${' + code + "@IMAGE}/get/${" + code + '_NAME@STRING}" width="' + item.width + '" height="' + item.height + '" alt="" loading="lazy" decoding="async">'
    : '<svg viewBox="0 0 ' + item.width + " " + item.height + '" focusable="false">' + PLACEHOLDERS[name] + "</svg>";
  return open + body + "</div>";
}

export function illustrationParameters(illustrations) {
  return illustrationSlots.filter((item) => illustrations.has(item.name)).flatMap((item) => {
    const code = illustrationImageCode(item.name);
    const art = illustrations.get(item.name);
    return [
      { code, type: "IMAGE", value: art.id, nls: { en: { NAME: item.name + " illustration", DESCRIPTION: "Media library image of the " + item.name + " illustration." } }, options: [] },
      { code: code + "_NAME", type: "STRING", value: art.name, nls: { en: { NAME: item.name + " illustration file name", DESCRIPTION: "File name in the image address of the " + item.name + " illustration." } }, options: [] },
    ];
  });
}

export function illustrationManifest(illustrations) {
  return illustrationSlots.map((item) => ({ slot: item.name, file: "assets/snow-landing/" + item.file, width: item.width, height: item.height, maxBytes: item.maxBytes, state: illustrations.has(item.name) ? "art" : "placeholder" }));
}

export function illustrationCss() {
  return String.raw`.snow-landing { --art-sky: rgba(var(--accent-rgb), .12); --art-mist: rgba(var(--accent-rgb), .22); --art-snow: #fff; --art-deep: #0b5c80; --art-warm: #ff8a3d; --art-ink: #1d1d1f; }
:root[data-mode="dark"] .snow-landing { --art-sky: rgba(var(--accent-rgb), .2); --art-mist: rgba(var(--accent-rgb), .34); --art-snow: #e7f0f8; --art-deep: #9fdcf5; --art-ink: #0d1320; }
.seo-hero .snow-art, .seo-final .snow-art { --art-sky: rgba(255,255,255,.14); --art-mist: rgba(255,255,255,.28); --art-snow: #fff; --art-deep: #0a5f86; --art-ink: #123a50; }
.snow-art { display: block; position: relative; overflow: hidden; min-width: 0; }
.snow-art svg, .snow-art img { display: block; width: 100%; height: 100%; }
.snow-art img { object-fit: cover; }
.snow-art__sky { fill: var(--art-sky); }
.snow-art__mist { fill: var(--art-mist); }
.snow-art__snow { fill: var(--art-snow); }
.snow-art__deep { fill: var(--art-deep); }
.snow-art__warm { fill: var(--art-warm); }
.snow-art__ink { fill: var(--art-ink); }
.snow-art__line { fill: none; stroke: var(--art-deep); stroke-width: 7; stroke-linecap: round; stroke-linejoin: round; }
.snow-art__line--wide { stroke-width: 11; }
.snow-art__contour { fill: none; stroke: var(--art-mist); stroke-width: 5; }
.snow-art__pins { fill: var(--pin-marker, #ea4335); stroke: var(--art-snow); stroke-width: 5; }
.snow-hero__inner { position: relative; z-index: 1; gap: 36px; }
.snow-art--hero { flex: none; width: min(36%, 360px); }
.snow-hero__inner .seo-hero__title { font-size: 42px; text-wrap: wrap; }
.seo-area { align-items: start; }
.seo-svc--static { display: grid; grid-template-columns: 200px 1fr; column-gap: 18px; align-content: center; align-items: start; }
.seo-svc--static .seo-svc__name { align-self: end; }
.snow-art--service { grid-row: 1 / span 2; border-radius: var(--radius-md); }
.snow-how__head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 10px; }
.snow-how__head .seo-how__num { margin-bottom: 0; }
.snow-art--step { flex: none; width: 72px; }
.snow-art--area { grid-column: 1 / -1; border-radius: var(--radius-md); }
.seo-final, .vw-mobile .seo-final { position: relative; overflow: hidden; padding-bottom: 0; }
.seo-final > :not(.snow-flakes) { position: relative; z-index: 1; }
.snow-art--final { margin: 26px -30px 0; }
.vw-mobile .snow-art--final { margin: 20px -22px 0; }
.snow-flakes { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.snow-flakes::before, .snow-flakes::after { content: ""; position: absolute; left: 0; right: 0; bottom: 0; background-repeat: repeat; }
.snow-flakes::before { top: -380px; background-size: 380px 380px; background-image: radial-gradient(circle at 30px 50px, rgba(255,255,255,.75) 0 2px, transparent 2.5px), radial-gradient(circle at 210px 20px, rgba(255,255,255,.55) 0 1.5px, transparent 2px), radial-gradient(circle at 90px 160px, rgba(255,255,255,.6) 0 2px, transparent 2.5px), radial-gradient(circle at 330px 120px, rgba(255,255,255,.5) 0 1.5px, transparent 2px), radial-gradient(circle at 150px 290px, rgba(255,255,255,.55) 0 1.5px, transparent 2px), radial-gradient(circle at 270px 230px, rgba(255,255,255,.7) 0 2px, transparent 2.5px), radial-gradient(circle at 50px 340px, rgba(255,255,255,.5) 0 1.5px, transparent 2px); }
.snow-flakes::after { top: -520px; background-size: 520px 520px; background-image: radial-gradient(circle at 70px 90px, rgba(255,255,255,.9) 0 3px, transparent 3.5px), radial-gradient(circle at 390px 40px, rgba(255,255,255,.8) 0 2.5px, transparent 3px), radial-gradient(circle at 240px 240px, rgba(255,255,255,.85) 0 3px, transparent 3.5px), radial-gradient(circle at 460px 370px, rgba(255,255,255,.8) 0 2.5px, transparent 3px), radial-gradient(circle at 120px 450px, rgba(255,255,255,.85) 0 3px, transparent 3.5px); }
@media (max-width: 1040px) {
  .snow-hero__inner { flex-direction: column; align-items: stretch; }
  .snow-art--hero { width: 100%; max-width: 440px; margin: 0 auto; }
  .snow-hero__inner .seo-hero__title { max-width: none; }
}
@media (max-width: 900px) {
  .seo-svc--static { grid-template-columns: 1fr; }
  .snow-art--service { grid-row: auto; margin-bottom: 12px; }
}
@media (max-width: 560px) {
  .snow-hero__inner .seo-hero__title { font-size: 32px; }
  .snow-art--final { margin: 20px -30px 0; }
}
@media screen and (prefers-reduced-motion: no-preference) {
  @keyframes snow-fall-far { to { transform: translateY(380px); } }
  @keyframes snow-fall-near { to { transform: translateY(520px); } }
  @keyframes snow-rise { from { opacity: .2; transform: translateY(18px); } to { opacity: 1; transform: none; } }
  @keyframes snow-float { from { transform: translateY(-6px); } to { transform: translateY(6px); } }
  @keyframes snow-plow { from { translate: -40px 0; } to { translate: 30px 0; } }
  .snow-flakes::before { animation: snow-fall-far 30s linear infinite; }
  .snow-flakes::after { animation: snow-fall-near 18s linear infinite; }
  .seo-hero__copy > * { animation: snow-rise .7s cubic-bezier(.2,.7,.2,1) backwards; }
  .seo-hero__copy > :nth-child(2) { animation-delay: .1s; }
  .seo-hero__copy > :nth-child(3) { animation-delay: .2s; }
  .snow-art--hero { animation: snow-float 6s ease-in-out infinite alternate; }
  .snow-art__plow { animation: snow-plow 8s ease-in-out infinite alternate; }
  .seo-svc--static:hover { transform: translateY(-3px); box-shadow: var(--shadow-float); }
  .seo-how__step { transition: transform .18s, box-shadow .18s; }
  .seo-how__step:hover { transform: translateY(-3px); box-shadow: var(--shadow-card); }
  .seo-how__step .snow-art--step { transition: transform .25s cubic-bezier(.2,.7,.2,1); }
  .seo-how__step:hover .snow-art--step { transform: scale(1.08) rotate(-2deg); }
  .seo-area__chip { transition: transform .15s; }
  .seo-area__chip:hover { transform: translateY(-2px); }
  @supports (animation-timeline: view()) {
    .seo-svc, .seo-how__step, .seo-area, .seo-faq__item, .seo-final { animation: snow-rise linear backwards; animation-timeline: view(); animation-range: entry 0% entry 30%; }
  }
}`;
}
