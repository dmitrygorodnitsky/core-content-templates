#!/usr/bin/env node

import { spawn } from "node:child_process";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const DEFAULT_WIDTHS = [360, 640, 768, 1024, 1280, 1600, 1920];
const DEFAULT_QUALITY = 84;
const DEFAULT_SIZES = "100vw";

function printHelp() {
  console.log(`Usage:
  node scripts/generate-image-set.mjs <image.png|image.jpg> [options]

Options:
  --widths 360,640,1024   Target widths. Default: ${DEFAULT_WIDTHS.join(",")}
  --quality 84            WebP quality, 1-100. Default: ${DEFAULT_QUALITY}
  --lossless              Use lossless WebP instead of lossy quality.
  --out <dir>             Output directory. Default: <image-name>.imageset
  --sizes <value>         HTML sizes value. Default: "${DEFAULT_SIZES}"
  --preload-width 1280    Fallback href width for the preload tag.
  --name <name>           Output file base name. Default: input file name.
  --allow-upscale         Generate widths larger than the source image.
  --help                  Show this help.

Examples:
  node scripts/generate-image-set.mjs ./hero.png --widths 640,960,1280,1920 --quality 86
  node scripts/generate-image-set.mjs ./hero.png --out ./public/images/hero --sizes "(max-width: 768px) 100vw, 1280px" --preload-width 1280
`);
}

function parseArgs(argv) {
  const options = {
    widths: DEFAULT_WIDTHS,
    quality: DEFAULT_QUALITY,
    sizes: DEFAULT_SIZES,
    lossless: false,
    allowUpscale: false,
    out: null,
    name: null,
    preloadWidth: null,
    inputs: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }

    if (arg === "--lossless") {
      options.lossless = true;
      continue;
    }

    if (arg === "--allow-upscale") {
      options.allowUpscale = true;
      continue;
    }

    if (arg.startsWith("--")) {
      const [flag, inlineValue] = arg.split("=", 2);
      const value = inlineValue ?? argv[index + 1];

      if (inlineValue === undefined) {
        index += 1;
      }

      if (value === undefined || value.startsWith("--")) {
        throw new Error(`Missing value for ${flag}`);
      }

      switch (flag) {
        case "--widths":
          options.widths = value
            .split(",")
            .map((item) => Number.parseInt(item.trim(), 10))
            .filter((width) => Number.isInteger(width) && width > 0);
          break;
        case "--quality":
          options.quality = Number.parseInt(value, 10);
          break;
        case "--out":
          options.out = value;
          break;
        case "--sizes":
          options.sizes = value;
          break;
        case "--preload-width":
          options.preloadWidth = Number.parseInt(value, 10);
          break;
        case "--name":
          options.name = value;
          break;
        default:
          throw new Error(`Unknown option: ${flag}`);
      }

      continue;
    }

    options.inputs.push(arg);
  }

  if (!options.widths.length) {
    throw new Error("At least one positive width is required.");
  }

  if (!Number.isInteger(options.quality) || options.quality < 1 || options.quality > 100) {
    throw new Error("--quality must be an integer from 1 to 100.");
  }

  if (options.preloadWidth !== null && (!Number.isInteger(options.preloadWidth) || options.preloadWidth < 1)) {
    throw new Error("--preload-width must be a positive integer.");
  }

  return options;
}

async function commandExists(command) {
  return new Promise((resolve) => {
    const child = spawn("sh", ["-c", `command -v ${command}`], { stdio: "ignore" });
    child.on("close", (code) => resolve(code === 0));
  });
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${command} failed with exit code ${code}\n${stderr.trim()}`));
    });
  });
}

function readPngDimensions(buffer) {
  const pngSignature = "89504e470d0a1a0a";
  if (buffer.subarray(0, 8).toString("hex") !== pngSignature) {
    return null;
  }

  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

function readJpegDimensions(buffer) {
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) {
    return null;
  }

  let offset = 2;
  const sofMarkers = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);

  while (offset < buffer.length) {
    while (buffer[offset] === 0xff) {
      offset += 1;
    }

    const marker = buffer[offset];
    offset += 1;

    if (marker === 0xd9 || marker === 0xda) {
      break;
    }

    if (offset + 2 > buffer.length) {
      break;
    }

    const segmentLength = buffer.readUInt16BE(offset);
    if (segmentLength < 2 || offset + segmentLength > buffer.length) {
      break;
    }

    if (sofMarkers.has(marker)) {
      return {
        height: buffer.readUInt16BE(offset + 3),
        width: buffer.readUInt16BE(offset + 5),
      };
    }

    offset += segmentLength;
  }

  return null;
}

async function readImageDimensions(filePath) {
  const buffer = await readFile(filePath);
  const dimensions = readPngDimensions(buffer) ?? readJpegDimensions(buffer);

  if (!dimensions) {
    throw new Error(`Cannot read dimensions for ${filePath}. Supported inputs: PNG, JPEG.`);
  }

  return dimensions;
}

function uniqueSortedWidths(widths) {
  return [...new Set(widths)].sort((left, right) => left - right);
}

function escapeHtmlAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function choosePreloadVariant(variants, requestedWidth) {
  if (!requestedWidth) {
    return variants.find((variant) => variant.width >= 1280) ?? variants.at(-1);
  }

  return variants.reduce((closest, variant) => {
    const currentDistance = Math.abs(variant.width - requestedWidth);
    const closestDistance = Math.abs(closest.width - requestedWidth);
    return currentDistance < closestDistance ? variant : closest;
  }, variants[0]);
}

function buildSnippets({ variants, preloadVariant, sizes, alt }) {
  const srcset = variants.map((variant) => `${variant.file} ${variant.width}w`).join(", ");
  const preload = `<link rel="preload" as="image" href="${escapeHtmlAttribute(preloadVariant.file)}" imagesrcset="${escapeHtmlAttribute(srcset)}" imagesizes="${escapeHtmlAttribute(sizes)}">`;
  const img = `<img src="${escapeHtmlAttribute(preloadVariant.file)}" srcset="${escapeHtmlAttribute(srcset)}" sizes="${escapeHtmlAttribute(sizes)}" width="${preloadVariant.width}" height="${preloadVariant.height}" alt="${escapeHtmlAttribute(alt)}" loading="eager" decoding="async">`;

  const cssVariants = [variants[0], variants.at(-1)].filter((variant, index, items) => {
    return index === 0 || variant.file !== items[0].file;
  });
  const cssImageSet = cssVariants
    .map((variant, index) => `url("${variant.file}") ${index + 1}x type("image/webp")`)
    .join(", ");

  return {
    preload,
    img,
    picture: `${preload}\n${img}`,
    css: `image-set(${cssImageSet})`,
  };
}

async function encodeVariant({ inputPath, outputPath, width, quality, lossless }) {
  const args = ["-quiet", "-m", "6", "-metadata", "none", "-resize", String(width), "0"];

  if (lossless) {
    args.push("-lossless");
  } else {
    args.push("-q", String(quality));
  }

  args.push(inputPath, "-o", outputPath);
  await run("cwebp", args);
}

async function generateImageSet(inputPath, options, cwebpAvailable) {
  if (!cwebpAvailable) {
    throw new Error("cwebp is required. Install libwebp first, for example: brew install webp");
  }

  const absoluteInput = path.resolve(inputPath);
  const inputInfo = path.parse(absoluteInput);
  const baseName = options.name ?? inputInfo.name;
  const dimensions = await readImageDimensions(absoluteInput);
  const outputRoot = options.out
    ? path.resolve(options.out)
    : path.join(inputInfo.dir, `${inputInfo.name}.imageset`);
  const outputDir = options.inputs.length > 1 && options.out
    ? path.join(outputRoot, `${inputInfo.name}.imageset`)
    : outputRoot;

  const targetWidths = uniqueSortedWidths(options.widths).filter((width) => {
    return options.allowUpscale || width <= dimensions.width;
  });

  if (!targetWidths.length) {
    throw new Error(`${absoluteInput}: all requested widths are larger than the source width (${dimensions.width}px). Use --allow-upscale if this is intentional.`);
  }

  await mkdir(outputDir, { recursive: true });

  const variants = [];
  for (const width of targetWidths) {
    const outputFile = `${baseName}-${width}.webp`;
    const outputPath = path.join(outputDir, outputFile);
    await encodeVariant({
      inputPath: absoluteInput,
      outputPath,
      width,
      quality: options.quality,
      lossless: options.lossless,
    });

    const outputStat = await stat(outputPath);
    variants.push({
      width,
      height: Math.round((dimensions.height * width) / dimensions.width),
      file: outputFile,
      bytes: outputStat.size,
    });
  }

  const preloadVariant = choosePreloadVariant(variants, options.preloadWidth);
  const snippets = buildSnippets({
    variants,
    preloadVariant,
    sizes: options.sizes,
    alt: baseName.replaceAll("-", " "),
  });

  const manifest = {
    source: path.relative(outputDir, absoluteInput),
    sourceWidth: dimensions.width,
    sourceHeight: dimensions.height,
    format: "webp",
    quality: options.lossless ? null : options.quality,
    lossless: options.lossless,
    sizes: options.sizes,
    preload: {
      href: preloadVariant.file,
      width: preloadVariant.width,
      imagesrcset: variants.map((variant) => `${variant.file} ${variant.width}w`).join(", "),
      imagesizes: options.sizes,
    },
    variants,
    snippets,
  };

  await writeFile(path.join(outputDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(
    path.join(outputDir, "snippets.html"),
    `<!-- Use the preload tag only for the first critical image on the page. -->\n${snippets.preload}\n\n${snippets.img}\n`,
  );
  await writeFile(path.join(outputDir, "snippets.css"), `.image {\n  background-image: ${snippets.css};\n}\n`);

  return { outputDir, variants, preloadVariant };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
    return;
  }

  if (!options.inputs.length) {
    printHelp();
    process.exitCode = 1;
    return;
  }

  const cwebpAvailable = await commandExists("cwebp");

  for (const input of options.inputs) {
    const result = await generateImageSet(input, options, cwebpAvailable);
    const totalBytes = result.variants.reduce((sum, variant) => sum + variant.bytes, 0);
    console.log(`Generated ${result.variants.length} WebP variants in ${result.outputDir}`);
    console.log(`Preload fallback: ${result.preloadVariant.file}`);
    console.log(`Total output: ${(totalBytes / 1024).toFixed(1)} KiB`);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
