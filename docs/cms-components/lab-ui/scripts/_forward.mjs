import { spawnSync } from "node:child_process";
import process from "node:process";
import { fileURLToPath } from "node:url";

export function forward(script) {
  const target = fileURLToPath(new URL(`../../../../app-templates/landing-page/scripts/${script}`, import.meta.url));
  const result = spawnSync(process.execPath, [target, ...process.argv.slice(2)], { stdio: "inherit" });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}
