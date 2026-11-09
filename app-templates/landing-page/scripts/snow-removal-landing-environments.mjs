import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const landingRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const SNOW_CONTENT_DIR = join(landingRoot, "content", "snow-removal-software");
const config = JSON.parse(readFileSync(join(SNOW_CONTENT_DIR, "environments.json"), "utf8"));

export const SNOW_ENVIRONMENT_NAMES = Object.keys(config.environments);

export const snowEnvironment = (name = config.default) => {
  const environment = config.environments[name];
  if (!environment) throw new Error(`Unknown Snow landing environment "${name}"; expected one of ${SNOW_ENVIRONMENT_NAMES.join(", ")}`);
  if (!/^\/[a-z0-9/_-]+$/.test(environment.pageUrl || "")) throw new Error(`Snow landing environment "${name}" needs a site-path pageUrl`);
  const mediaFile = join(SNOW_CONTENT_DIR, environment.media);
  return {
    name,
    origin: environment.origin,
    pageUrl: environment.pageUrl,
    mediaName: environment.media,
    mediaFile,
    media: existsSync(mediaFile) ? JSON.parse(readFileSync(mediaFile, "utf8")) : {},
    mediaLibraryParent: environment.mediaLibraryParent,
    outputName: environment.outputDir,
    outputDir: join(landingRoot, "dist", "manual-upload", environment.outputDir),
    values: environment.values,
  };
};

export const snowEnvironmentForOrigin = (origin) => {
  const name = SNOW_ENVIRONMENT_NAMES.find((candidate) => config.environments[candidate].origin === origin);
  if (!name) throw new Error(`No Snow landing environment serves ${origin}`);
  return snowEnvironment(name);
};

export const snowEnvironmentArgument = (args) => {
  const index = args.indexOf("--env");
  return snowEnvironment(index >= 0 ? args[index + 1] : undefined);
};

export const requireEnvironmentOrigin = (environment, baseUrl) => {
  if (new URL(baseUrl).origin !== environment.origin) throw new Error(`--base-url ${baseUrl} does not belong to environment ${environment.name} (${environment.origin})`);
};
