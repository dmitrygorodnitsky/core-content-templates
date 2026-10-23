import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { readQuoteSources } from './quote-sources.mjs';

const config = JSON.parse(await fs.readFile(new URL('./config.json', import.meta.url), 'utf8'));
const cases = [
  ['2026-09-01T12:00', '2026-11-01', '2026-11-01T00:00'],
  ['2026-10-23T12:00', '2026-11-01', '2026-11-01T00:00'],
  ['2026-10-31T23:59:59.999999999', '2026-11-01', '2026-11-01T00:00'],
  ['2026-11-01T00:00', '2026-11-01', '2026-12-01T00:00'],
  ['2026-11-01T10:15', '2026-11-01', '2026-12-01T10:15'],
  ['2026-12-20T09:30', '2026-11-01', '2027-01-19T09:30'],
  ['2027-04-01T13:45', '2026-11-01', '2027-05-01T13:45'],
  ['2028-02-15T08:00', '2028-01-01', '2028-03-16T08:00'],
];

for (const [code, source] of Object.entries(await readQuoteSources())) {
  test(code + ': exercise the actual expiry method without database, grants or mail', async () => {
    const start = source.indexOf('    private LocalDateTime quotationExpiry(');
    assert.ok(start >= 0); let end = source.indexOf('{', start), depth = 1;
    while (depth && ++end < source.length) { if (source[end] === '{') depth++; if (source[end] === '}') depth--; }
    assert.equal(depth, 0);
    const method = source.slice(start, end + 1);
    const days = source.match(/private static final int DEFAULT_QUOTATION_EXPIRATION_DAYS = ([0-9]+);/);
    assert.ok(days); assert.equal(Number(days[1]), config.quoteLinkPolicy.afterSeasonStartedDays);
    const checks = cases.map(([issued, season, expected]) => `
      check(p.quotationExpiry(new Document("${season}"), LocalDateTime.parse("${issued}")), LocalDateTime.parse("${expected}"));`).join('');
    const java = `import java.time.*;
public class QuoteExpiryMethodTest {
  private static final int DEFAULT_QUOTATION_EXPIRATION_DAYS = ${days[1]};
  static class ApplicationException extends RuntimeException { ApplicationException(String s) { super(s); } }
  static class Document { String season; Document(String s) { season=s; }
    Object getOrganization() { throw new AssertionError("Expiry must not read an organization's legacy date or live season"); }
  }
  private String documentText(Document d, String code) { if(!"TERM_START_DATE".equals(code)) throw new AssertionError(code); return d.season; }
${method}
  static void check(Object actual,Object expected) { if(!expected.equals(actual)) throw new AssertionError(actual+" != "+expected); }
  public static void main(String[] args) { QuoteExpiryMethodTest p=new QuoteExpiryMethodTest(); ${checks}
    boolean missing=false; try {p.quotationExpiry(new Document(""),LocalDateTime.parse("2026-10-23T12:00"));} catch(ApplicationException e){missing=true;}
    if(!missing)throw new AssertionError("Missing season must not fall back to a guessed expiry");
    boolean invalid=false; try {p.quotationExpiry(new Document("invalid-date"),LocalDateTime.parse("2026-10-23T12:00"));} catch(java.time.format.DateTimeParseException e){invalid=true;}
    if(!invalid)throw new AssertionError("Invalid season must be rejected");
    System.out.println("10 checks passed on the deployed method source");
  }
}`;
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'quote-expiry-'));
    try {
      const file = path.join(dir, 'QuoteExpiryMethodTest.java'); await fs.writeFile(file, java);
      execFileSync('javac', ['-d', dir, file], {stdio:'pipe'});
      const output = execFileSync('java', ['-cp', dir, 'QuoteExpiryMethodTest'], {encoding:'utf8'});
      assert.match(output, /10 checks passed/);
    } finally { await fs.rm(dir, {recursive:true,force:true}); }
  });
}
