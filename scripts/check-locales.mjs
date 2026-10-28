import fs from 'node:fs';
import path from 'node:path';
import { LANGUAGES, DEFAULT_LANGUAGE } from '../src/i18n/languages.ts';

const LANGS_DIR = 'public/langs';

const sourceModule = await import(`../src/i18n/locales/${DEFAULT_LANGUAGE}.ts`);
const sourceMap = new Map(Object.entries(sourceModule.default));

console.log(`Source: ${sourceMap.size} keys (${DEFAULT_LANGUAGE})\n`);

const results = [];

for (const { code } of LANGUAGES) {
    const filePath = path.join(LANGS_DIR, `${code}.json`);

    if (!fs.existsSync(filePath)) {
        results.push({ code, status: 'skip' });
        continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    let json;
    try {
        json = JSON.parse(content);
    } catch (e) {
        results.push({ code, status: 'error', message: `Invalid JSON: ${e.message}` });
        continue;
    }

    const missing = [];
    const empty = [];
    const placeholderMismatch = [];

    for (const [key, sourceValue] of sourceMap) {
        const value = json[key];

        if (value === undefined) {
            missing.push(key);
            continue;
        }

        if (value === '') {
            empty.push(key);
            continue;
        }

        const sourcePlaceholders = new Set([...sourceValue.matchAll(/\{(\w+)\}/g)].map(m => m[1]));
        const targetPlaceholders = new Set([...value.matchAll(/\{(\w+)\}/g)].map(m => m[1]));

        for (const p of sourcePlaceholders) {
            if (!targetPlaceholders.has(p)) {
                placeholderMismatch.push(`${key} (missing {${p}})`);
                break;
            }
        }
    }

    const total = sourceMap.size;
    const present = total - missing.length;
    const pct = ((present / total) * 100).toFixed(1);

    results.push({ code, status: 'ok', total, present, missing, empty, placeholderMismatch, pct });
}

console.log('=============================================');
console.log('  Locale Completeness Report');
console.log('=============================================\n');

results.sort((a, b) => {
    if (a.status === 'skip' && b.status !== 'skip') return 1;
    if (a.status !== 'skip' && b.status === 'skip') return -1;
    return parseFloat(a.pct || 0) - parseFloat(b.pct || 0);
});

let totalIssues = 0;
let skippedCount = 0;

for (const r of results) {
    if (r.status === 'skip') {
        console.log(`[SKIP] ${r.code.padEnd(8)}  (no built file)`);
        skippedCount++;
        continue;
    }

    if (r.status === 'error') {
        console.log(`[FAIL] ${r.code.padEnd(8)}  ${r.message}`);
        totalIssues++;
        continue;
    }

    const hasIssues = r.missing.length + r.empty.length + r.placeholderMismatch.length > 0;
    const status = !hasIssues ? '[OK]  ' : (parseFloat(r.pct) > 90 ? '[WARN]' : '[FAIL]');

    console.log(`${status} ${r.code.padEnd(8)} ${r.pct.padStart(5)}%  (${r.present}/${r.total})`);

    if (r.missing.length > 0) {
        console.log(`       Missing: ${r.missing.length}`);
        if (process.argv.includes('--verbose')) {
            r.missing.slice(0, 10).forEach(k => console.log(`         - ${k}`));
            if (r.missing.length > 10) console.log(`         ... and ${r.missing.length - 10} more`);
        }
        totalIssues += r.missing.length;
    }

    if (r.empty.length > 0) {
        console.log(`       Empty: ${r.empty.length}`);
        totalIssues += r.empty.length;
    }

    if (r.placeholderMismatch.length > 0) {
        console.log(`       Placeholder mismatches: ${r.placeholderMismatch.length}`);
        r.placeholderMismatch.slice(0, 5).forEach(k => console.log(`         - ${k}`));
        totalIssues += r.placeholderMismatch.length;
    }
}

console.log(`\nTotal issues: ${totalIssues} (skipped: ${skippedCount})`);
if (totalIssues > 0) process.exit(1);
