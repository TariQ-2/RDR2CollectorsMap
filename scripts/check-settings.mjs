import fs from 'node:fs';
import path from 'node:path';

const SCHEMA_FILE = 'src/features/settings/schema.ts';
const SRC_DIR = 'src';

// ═══════════════════════════════════════════════════════════
// 1. Parse schema.ts
// ═══════════════════════════════════════════════════════════
const schemaSrc = fs.readFileSync(SCHEMA_FILE, 'utf8');
const namespaceBlocks = {};

for (const m of schemaSrc.matchAll(/const\s+([A-Z_]+)\s*=\s*\{([\s\S]*?)\}\s*satisfies/g)) {
    const name = m[1].toLowerCase();
    const keys = [];
    for (const km of m[2].matchAll(/^\s{4}(\w+):\s*\{/gm)) {
        keys.push(km[1]);
    }
    namespaceBlocks[name] = keys;
}

const schemaMapMatch = schemaSrc.match(/export\s+const\s+SCHEMA\s*=\s*\{([\s\S]*?)\}\s*as\s+const/);
const namespaces = {};

if (schemaMapMatch) {
    for (const m of schemaMapMatch[1].matchAll(/(\w+):\s*([A-Z_]+)/g)) {
        namespaces[m[1]] = namespaceBlocks[m[2].toLowerCase()] || [];
    }
}

if (Object.keys(namespaces).length === 0) {
    console.error('❌ Failed to parse schema.ts');
    process.exit(1);
}

// ═══════════════════════════════════════════════════════════
// 2. Strip comments from source
// ═══════════════════════════════════════════════════════════
function stripComments(src) {
    // Remove block comments /* ... */
    src = src.replace(/\/\*[\s\S]*?\*\//g, '');
    // Remove line comments // ...
    src = src.replace(/\/\/[^\n]*/g, '');
    return src;
}

// ═══════════════════════════════════════════════════════════
// 3. Check if a key is an "action" (not a real setting)
// ═══════════════════════════════════════════════════════════
function isAction(key) {
    return /^(reset|clear|remove|placeNew|delete)/i.test(key) || /Everything$/i.test(key);
}

// ═══════════════════════════════════════════════════════════
// 4. Scan source files
// ═══════════════════════════════════════════════════════════
function* walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.name === 'node_modules' || entry.name === '.next') continue;
        if (entry.isDirectory()) yield* walk(full);
        else if (/\.(ts|tsx)$/.test(entry.name)) yield full;
    }
}

const usedKeys = new Set();
const writtenKeys = new Set();

for (const file of walk(SRC_DIR)) {
    let src = fs.readFileSync(file, 'utf8');
    // تجاهل ملف schema.ts نفسه (هو التعريف)
    if (file.endsWith('schema.ts')) continue;
    src = stripComments(src);

    for (const m of src.matchAll(/useSetting\(\s*['"](\w+)['"]\s*,\s*['"](\w+)['"]/g)) {
        usedKeys.add(`${m[1]}:${m[2]}`);
    }

    for (const m of src.matchAll(/setValue\(\s*['"](\w+)['"]\s*,\s*['"](\w+)['"]/g)) {
        usedKeys.add(`${m[1]}:${m[2]}`);
        writtenKeys.add(`${m[1]}:${m[2]}`);
    }

    for (const m of src.matchAll(/setSetting\(\s*['"](\w+)['"]\s*,\s*\{([\s\S]*?)\}/g)) {
        const ns = m[1];
        for (const km of m[2].matchAll(/(\w+)\s*:/g)) {
            usedKeys.add(`${ns}:${km[1]}`);
            writtenKeys.add(`${ns}:${km[1]}`);
        }
    }

    for (const ns of Object.keys(namespaces)) {
        const re = new RegExp(`\\.${ns}\\.(\\w+)`, 'g');
        for (const m of src.matchAll(re)) {
            if (namespaces[ns].includes(m[1])) {
                usedKeys.add(`${ns}:${m[1]}`);
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════
// 5. Report
// ═══════════════════════════════════════════════════════════
const definedKeys = new Set();
for (const [ns, keys] of Object.entries(namespaces)) {
    for (const k of keys) definedKeys.add(`${ns}:${k}`);
}

const missingInSchema = [];
const unusedInCode = [];
const deadControls = [];

for (const key of usedKeys) {
    if (!definedKeys.has(key)) missingInSchema.push(key);
}

for (const key of definedKeys) {
    if (!usedKeys.has(key)) {
        const [, k] = key.split(':');
        if (!isAction(k)) unusedInCode.push(key);
    }
}

for (const key of writtenKeys) {
    const [, k] = key.split(':');
    if (isAction(k)) continue;
    if (!usedKeys.has(key)) deadControls.push(key);
}

console.log('═══════════════════════════════════════════');
console.log('  Settings Health Check');
console.log('═══════════════════════════════════════════\n');

console.log(`Namespaces:       ${Object.keys(namespaces).join(', ')}`);
console.log(`Defined keys:     ${definedKeys.size}`);
console.log(`Used in code:     ${usedKeys.size}`);
console.log(`Written in code:  ${writtenKeys.size}\n`);

if (missingInSchema.length === 0) {
    console.log('✅ All used settings exist in schema.');
} else {
    console.log(`❌ ${missingInSchema.length} settings used in code but missing from schema:`);
    missingInSchema.forEach(k => console.log(`   - ${k}`));
}

console.log('');

if (unusedInCode.length === 0) {
    console.log('✅ No unused settings.');
} else {
    console.log(`⚠️  ${unusedInCode.length} settings defined but never used:`);
    unusedInCode.forEach(k => console.log(`   - ${k}`));
}

console.log('');

if (deadControls.length === 0) {
    console.log('✅ No dead controls.');
} else {
    console.log(`⚠️  ${deadControls.length} settings written but never read:`);
    deadControls.forEach(k => console.log(`   - ${k}`));
}

console.log('');

if (missingInSchema.length > 0) process.exit(1);
