import { readdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const DIRS = [
    'src/i18n/locales/en',
];

let fixed = 0;
let skipped = 0;

for (const dir of DIRS) {
    if (!existsSync(dir)) continue;

    for (const file of await readdir(dir)) {
        if (!file.endsWith('.ts') || file.startsWith('_')) continue;

        const path = join(dir, file);
        let content = await readFile(path, 'utf8');

        // Skip if already converted
        if (/^const \w+ = \{/m.test(content)) {
            skipped++;
            continue;
        }

        // Skip if no anonymous export
        if (!content.includes('export default {')) {
            skipped++;
            continue;
        }

        const varName = file.replace('.ts', '');

        // Replace `export default {` → `const <name> = {`
        content = content.replace(/export default \{/, `const ${varName} = {`);

        // Append `export default <name>;` after the closing brace
        if (/} as const;\s*$/.test(content)) {
            content = content.replace(
                /} as const;\s*$/,
                `} as const;\n\nexport default ${varName};\n`,
            );
        } else if (/};\s*$/.test(content)) {
            content = content.replace(
                /};\s*$/,
                `};\n\nexport default ${varName};\n`,
            );
        }

        await writeFile(path, content);
        console.log(`Fixed ${path}`);
        fixed++;
    }
}

console.log(`\nDone. Fixed: ${fixed}, skipped: ${skipped}.`);
