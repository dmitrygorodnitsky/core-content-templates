import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const quoteScriptCodes = ['SNOW_SERVICE_QUOTATION_DELIVERY_V17', 'SNOW_QUOTATION_DECISION_CONFIRMATION_V10'];
export const coreUiRepository = process.env.CORE_UI_REPOSITORY
  || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../../../core-ui');
export const canonicalJava = source => source.replaceAll('\r\n', '\n').trimEnd();
export async function readQuoteSources() {
  return Object.fromEntries(await Promise.all(quoteScriptCodes.map(async code => [code,
    await fs.readFile(path.join(coreUiRepository, 'scripts/dev/seeds/scripts', code + '.java'), 'utf8')])));
}
