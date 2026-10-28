import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { existsSync } from 'node:fs';
import { DEFAULT_LANGUAGE } from '../src/i18n/languages.ts';

const SRC_DIR      = 'src';
const SOURCE_FILE  = `src/i18n/locales/${DEFAULT_LANGUAGE}.ts`;
const ARCHIVE_PATH = 'src/i18n/locales/_unused.json';
const REPORT       = 'i18n-audit.md';

const args = process.argv.slice(2);
const MOVE = args.includes('--move');

async function walk(dir) {
    const out = [];
    for (const entry of await readdir(dir, { withFileTypes: true })) {
        if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === '.next') continue;
        const full = join(dir, entry.name);
        if (entry.isDirectory()) out.push(...await walk(full));
        else if (['.ts', '.tsx'].includes(extname(entry.name))) out.push(full);
    }
    return out;
}

const STATIC_PATTERNS = [
    /\bt\(\s*['"`]([a-zA-Z0-9_.\-]+)['"`]/g,
    /\btranslate\(\s*['"`]([a-zA-Z0-9_.\-]+)['"`]/g,
    /\bhelpKey\s*=\s*["']([a-zA-Z0-9_.\-]+)["']/g,
    /\blabelKey\s*=\s*["']([a-zA-Z0-9_.\-]+)["']/g,
    /\btitleKey\s*=\s*["']([a-zA-Z0-9_.\-]+)["']/g,
    /\bdata-text\s*=\s*["']([a-zA-Z0-9_.\-]+)["']/g,
    /<(?:Row|MenuRow|SettingRow|ToggleRow|NumberRow|SelectRow|ActionRow|SectionRow)\s+[^>]*?\bid\s*=\s*["']([a-zA-Z0-9_]+\.[a-zA-Z0-9_.\-]+)["']/g,
    /<(?:Row|MenuRow|SettingRow|ToggleRow|NumberRow|SelectRow|ActionRow|SectionRow)\s+[^>]*?\bid\s*=\s*\{\s*["']([a-zA-Z0-9_]+\.[a-zA-Z0-9_.\-]+)["']\s*\}/g,
    /<ConfirmDialog\s+[^>]*?\bid\s*=\s*\{?\s*["']([a-zA-Z0-9_]+\.[a-zA-Z0-9_.\-]+)["']\s*\}?/g,
];
const DYNAMIC_PATTERNS = [
    /\bt\(\s*`([a-zA-Z0-9_.\-]+?)\$\{/g,
    /\btranslate\(\s*`([a-zA-Z0-9_.\-]+?)\$\{/g,
];
const INTERPOLATED_VAR = /\{([a-zA-Z0-9_.]+)\}/g;

const DYNAMIC_WHITELIST = [
    /^collectables\.menu\.items\./,
    /^collectables\.menu\.fossil\./,
    /^collectables\.menu\.jewelry\./,
    /^collectables\.menu\.item\./,
    /^collectables\.menu\.items_value/,
    /^collectables\.map\./,
    /^weekly\.desc\./,
    /^weekly\.flavor\./,
    /^weekly\.items\./,
    /^treasures\.map\./,
    /^fasttravel\./,
    /^settings\.menu\./,
    /^general\.menu\./,
    /^settings\.menu\.general\.language\./,
    /^menu\.lang_/,
    /^general\.menu\.language\./,
    /^general\.map\.layers\./,
    /^map\.layers\./,
    /^map\.user_pins\.color\./,
    /^map\.user_pins\.icon\./,
    /^map\.user_pins\.shape\./,
    /^pins\.user\.color\./,
    /^pins\.user\.icon\./,
    /^pins\.user\.shape\./,
    /^menu\.tool_type\./,
    /^menu\.filter_type\./,
    /^menu\.highlight_style\./,
    /^menu\.marker_color\./,
    /^settings\.menu\.toolsFilter\./,
    /^settings\.menu\.appearance\./,
    /^settings\.menu\.inventory\./,
    /^settings\.menu\.pins\./,
    /^map\.weather\./,
    /^map\.flower_type\./,
    /^map\.egg_type\./,
    /^map\.sightseeing\./,
    /^alerts\./,
    /^notification\./,
    /^general\.generic\./,
    /^menu\.modal_/,
    /^general\.menu\.modal/,
    /^collectables\.menu\.modal/,
    /^settings\.menu\.general\.resetEverything\./,
    /^settings\.menu\.pins\.removeAll\./,
    /^settings\.menu\.toolsFilter\.clear/,
    /^pins\.menu\.remove_all\./,
];
const isDynamic = (key) => DYNAMIC_WHITELIST.some((re) => re.test(key));

async function loadTranslations() {
    return (await import(`../src/i18n/locales/${DEFAULT_LANGUAGE}.ts`)).default;
}

async function main() {
    if (!existsSync(SOURCE_FILE)) {
        console.error(`[ERROR] Source file not found: ${SOURCE_FILE}`);
        process.exit(1);
    }

    const files = await walk(SRC_DIR);
    console.log(`Scanned ${files.length} source files`);

    const usedStatic = new Set();
    const usedDynamicPrefixes = new Set();

    for (const file of files) {
        const content = await readFile(file, 'utf8');
        for (const regex of STATIC_PATTERNS) {
            regex.lastIndex = 0;
            let m;
            while ((m = regex.exec(content))) usedStatic.add(m[1]);
        }
        for (const regex of DYNAMIC_PATTERNS) {
            regex.lastIndex = 0;
            let m;
            while ((m = regex.exec(content))) usedDynamicPrefixes.add(m[1]);
        }
    }

    const translations = await loadTranslations();
    const unusedArchive = existsSync(ARCHIVE_PATH)
        ? JSON.parse(await readFile(ARCHIVE_PATH, 'utf8'))
        : {};

    const interpolatedVars = new Set();
    for (const value of Object.values(translations)) {
        if (typeof value !== 'string') continue;
        INTERPOLATED_VAR.lastIndex = 0;
        let m;
        while ((m = INTERPOLATED_VAR.exec(value))) interpolatedVars.add(m[1]);
    }

    const missing = [...usedStatic]
        .filter((k) => k.includes('.'))
        .filter((k) => !(k in translations) && !(k in unusedArchive))
        .sort();

    const unused = [];
    for (const key of Object.keys(translations).sort()) {
        if (usedStatic.has(key)) continue;
        if (interpolatedVars.has(key)) continue;
        if (isDynamic(key)) continue;
        if ([...usedDynamicPrefixes].some((p) => key.startsWith(p))) continue;
        unused.push(key);
    }

    const resurrected = Object.keys(unusedArchive).filter(
        (k) => usedStatic.has(k) || [...usedDynamicPrefixes].some((p) => k.startsWith(p)),
    );

    const lines = [];
    lines.push('# i18n Audit Report');
    lines.push('');
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push('');
    lines.push(`- Source language: **${DEFAULT_LANGUAGE}**`);
    lines.push(`- Source files scanned: **${files.length}**`);
    lines.push(`- Active translation keys: **${Object.keys(translations).length}**`);
    lines.push(`- Static keys used (detected): **${usedStatic.size}**`);
    lines.push(`- Dynamic prefixes: **${usedDynamicPrefixes.size}**`);
    lines.push(`- Archived: **${Object.keys(unusedArchive).length}**`);
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push(`## Missing keys (used, NOT in ${DEFAULT_LANGUAGE}.ts): ${missing.length}`);
    lines.push('');
    if (!missing.length) lines.push('_None_');
    else for (const k of missing) lines.push(`- \`${k}\``);
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push(`## Unused keys (review before --move): ${unused.length}`);
    lines.push('');
    if (!unused.length) lines.push('_None_');
    else for (const k of unused) lines.push(`- \`${k}\``);
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push(`## Resurrected (in archive, now used): ${resurrected.length}`);
    lines.push('');
    if (!resurrected.length) lines.push('_None_');
    else for (const k of resurrected) lines.push(`- \`${k}\``);

    await writeFile(REPORT, lines.join('\n'));

    console.log(`\nReport: ${REPORT}`);
    console.log(`  Missing:     ${missing.length}`);
    console.log(`  Unused:      ${unused.length}`);
    console.log(`  Resurrected: ${resurrected.length}`);
    console.log(`  Archived:    ${Object.keys(unusedArchive).length}`);

    if (!MOVE) {
        console.log(`\nDRY-RUN — nothing moved.`);
        return;
    }

    if (unused.length === 0) {
        console.log(`\nNothing to move.`);
        return;
    }

    const nextArchive = { ...unusedArchive };
    for (const k of unused) nextArchive[k] = translations[k];
    await writeFile(ARCHIVE_PATH, JSON.stringify(
        Object.fromEntries(Object.entries(nextArchive).sort(([a], [b]) => a.localeCompare(b))),
        null, 2,
    ) + '\n');

    const remaining = Object.keys(translations).filter((k) => !unused.includes(k)).sort();
    let ts = 'export default {\n';
    for (let i = 0; i < remaining.length; i++) {
        const key = remaining[i];
        const value = String(translations[key]);
        const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
        ts += `  "${key}": "${escaped}"`;
        if (i < remaining.length - 1) ts += ',';
        ts += '\n';
    }
    ts += '} as const;\n';
    await writeFile(SOURCE_FILE, ts);

    console.log(`\nDone. Archived ${unused.length}, remaining ${remaining.length}.`);
}

main().catch((e) => { console.error('[ERROR]', e); process.exit(1); });
