import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const { LANGUAGES } = await import('../src/i18n/languages.ts');

await mkdir('public/langs', { recursive: true });

let built = 0;
let skipped = 0;

for (const { code } of LANGUAGES) {
    const sourcePath = `src/i18n/locales/${code}.ts`;

    if (!existsSync(sourcePath)) {
        skipped++;
        continue;
    }

    try {
        const mod = await import(`../src/i18n/locales/${code}.ts`);
        const data = mod.default;
        const sorted = Object.fromEntries(
            Object.entries(data).sort(([a], [b]) => a.localeCompare(b)),
        );
        await writeFile(`public/langs/${code}.json`, JSON.stringify(sorted, null, 2) + '\n');
        console.log(`Built ${code}.json — ${Object.keys(sorted).length} keys`);
        built++;
    } catch (err) {
        console.error(`Failed ${code}: ${err.message}`);
    }
}

console.log(`\nDone: ${built} built, ${skipped} skipped (no source file)`);
