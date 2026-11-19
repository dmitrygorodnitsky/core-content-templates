import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const quoteScriptCodes = ['WINTER_SERVICE_QUOTATION_CREATOR'];
export const coreUiRepository = process.env.CORE_UI_REPOSITORY
  || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../../../core-ui');
export const canonicalJava = source => source.replaceAll('\r\n', '\n').trimEnd();
export async function readQuoteSources() {
  return Object.fromEntries(await Promise.all(quoteScriptCodes.map(async code => [code,
    await fs.readFile(path.join(coreUiRepository, 'scripts/dev/seeds/scripts', code + '.java'), 'utf8')])));
}

// The deployed script has one fingerprint; exercise both retained expiry implementations.
export async function readQuoteExpirySources() {
  const source = (await readQuoteSources()).WINTER_SERVICE_QUOTATION_CREATOR;
  return Object.fromEntries(['QuotationDelivery', 'DecisionConfirmation'].map(name => {
    const start = `    // BEGIN QUOTATION COMPONENT ${name}\n    private final class ${name} {`;
    const end = `\n    }\n    // END QUOTATION COMPONENT ${name}`;
    const offset = source.indexOf(start);
    const limit = source.indexOf(end, offset);
    if (offset < 0 || limit < 0) throw new Error(`Missing quote expiry component ${name}`);
    return [name, source.slice(offset + start.length, limit)];
  }));
}
