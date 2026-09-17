import path from "node:path";
import { exportSeoPublicManual } from "./export-seo-public-manual.mjs";

const portalRoot = path.resolve("app-templates/customer-portal");
const cases = [
  {
    name: "calm-harbor-spa",
    input: "content/cases/calm-harbor-spa.public-authored.json",
    asset: "assets/public-seo/calm-harbor-spa-hero.png",
    assetName: "calm-harbor-spa-hero.png",
    assetUrl: "https://calmharborspa.com/assets/customer-portal/calm-harbor-spa-hero.png",
  },
  {
    name: "luma-beauty-studio",
    input: "content/cases/luma-beauty-studio.public-authored.json",
    asset: "assets/public-seo/luma-beauty-studio-hero.png",
    assetName: "luma-beauty-studio-hero.png",
    assetUrl: "https://lumabeautystudio.com/assets/customer-portal/luma-beauty-studio-hero.png",
  },
];

for (const entry of cases) {
  const result = await exportSeoPublicManual({
    inputPath: path.join(portalRoot, entry.input),
    outputDir: path.join(portalRoot, "dist/manual-upload/cases", entry.name),
    mode: "production",
    launchState: "concept",
    assets: [{
      sourcePath: path.join(portalRoot, entry.asset),
      outputPath: entry.assetName,
      publicUrl: entry.assetUrl,
    }],
  });
  console.log("build-beauty-concept-cases ok: " + path.relative(process.cwd(), result.outputDir));
}
