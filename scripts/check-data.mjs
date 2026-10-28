import fs from 'node:fs';
import path from 'node:path';

const CANDIDATES = [
    'public/data',
    'public/RDR2CollectorsMap/data',
    'data',
    'src/data',
];

let DATA_DIR = null;
for (const d of CANDIDATES) {
    if (fs.existsSync(d) && fs.statSync(d).isDirectory()) {
        if (fs.existsSync(path.join(d, 'items.json')) || fs.existsSync(path.join(d, 'cycles.json'))) {
            DATA_DIR = d;
            break;
        }
    }
}

if (!DATA_DIR) {
    function findDir(dir, depth = 0) {
        if (depth > 4) return null;
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            if (entries.some(e => e.isFile() && e.name === 'items.json')) return dir;
            for (const e of entries) {
                if (!e.isDirectory()) continue;
                if (e.name === 'node_modules' || e.name === '.next') continue;
                const found = findDir(path.join(dir, e.name), depth + 1);
                if (found) return found;
            }
        } catch { /* ignore */ }
        return null;
    }
    DATA_DIR = findDir('.');
}

if (!DATA_DIR) {
    console.error('[FAIL] Could not find data directory (items.json).');
    console.error('       Looked in: ' + CANDIDATES.join(', '));
    console.error('       Place data files (items.json, cycles.json, etc.) in public/data/');
    process.exit(1);
}

console.log(`Data directory: ${DATA_DIR}\n`);

const MAP_BOUNDS = [[-144, 0], [0, 176]];
const VALID_CATEGORIES = new Set([
    'arrowhead', 'bottle', 'coin', 'egg', 'flower',
    'fossils_random', 'jewelry_random', 'random',
    'bracelet', 'earring', 'necklace', 'ring',
    'cups', 'swords', 'wands', 'pentacles',
    'heirlooms', 'fast_travel', 'coastal', 'oceanic', 'megafauna',
]);

let totalErrors = 0;
let missingFiles = 0;

function loadJson(name) {
    const p = path.join(DATA_DIR, name);
    if (!fs.existsSync(p)) {
        console.log(`   [FAIL] ${name} not found`);
        missingFiles++;
        totalErrors++;
        return null;
    }
    try {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (e) {
        console.log(`   [FAIL] ${name} is invalid JSON: ${e.message}`);
        totalErrors++;
        return null;
    }
}

function inBounds(lat, lng) {
    return lat >= MAP_BOUNDS[0][0] && lat <= MAP_BOUNDS[1][0]
        && lng >= MAP_BOUNDS[0][1] && lng <= MAP_BOUNDS[1][1];
}

console.log('=============================================');
console.log('  Data Files Integrity Check');
console.log('=============================================\n');

console.log('items.json');
const items = loadJson('items.json');
if (items) {
    let markerCount = 0;
    let boundsErrors = 0;
    const unknownCategories = [];

    for (const [category, cycles] of Object.entries(items)) {
        if (!VALID_CATEGORIES.has(category)) unknownCategories.push(category);
        for (const [cycleName, markers] of Object.entries(cycles)) {
            const cycleNum = parseInt(cycleName, 10);
            if (isNaN(cycleNum) || cycleNum < 1 || cycleNum > 6) {
                console.log(`   [WARN] Invalid cycle "${cycleName}" in ${category}`);
            }
            if (!Array.isArray(markers)) continue;
            for (const m of markers) {
                markerCount++;
                if (typeof m.lat !== 'number' || typeof m.lng !== 'number' || !inBounds(m.lat, m.lng)) {
                    boundsErrors++;
                }
            }
        }
    }

    console.log(`   Categories: ${Object.keys(items).length}`);
    console.log(`   Markers: ${markerCount}`);
    if (unknownCategories.length > 0) {
        console.log(`   [FAIL] Unknown categories: ${unknownCategories.join(', ')}`);
        totalErrors += unknownCategories.length;
    } else {
        console.log('   [OK] All categories valid');
    }
    if (boundsErrors > 0) {
        console.log(`   [FAIL] ${boundsErrors} markers out of bounds`);
        totalErrors += boundsErrors;
    } else {
        console.log('   [OK] All markers in bounds');
    }
}

console.log('\ncycles.json');
const cycles = loadJson('cycles.json');
if (cycles) {
    let badCycleCount = 0;
    for (const entry of cycles) {
        for (const key of ['arrowhead', 'bottle', 'coin', 'egg', 'flower', 'heirlooms', 'lost_jewelry', 'random', 'tarot_cards', 'fossils']) {
            const v = entry[key];
            if (typeof v !== 'number' || v < 1 || v > 6) {
                badCycleCount++;
                if (badCycleCount <= 3) console.log(`   [FAIL] Invalid ${key}=${v} on ${entry.date}`);
            }
        }
    }
    console.log(`   Entries: ${cycles.length}`);
    if (badCycleCount === 0) console.log('   [OK] All cycles valid (1-6)');
    else totalErrors += badCycleCount;
}

console.log('\ntreasures.json');
const treasures = loadJson('treasures.json');
if (treasures) {
    const list = treasures.treasures || treasures;
    let outOfBounds = 0;
    for (const t of list) {
        if (!t.center || !inBounds(t.center.x, t.center.y)) outOfBounds++;
        for (const loc of (t.locations || [])) {
            if (!inBounds(loc.x, loc.y)) outOfBounds++;
        }
    }
    console.log(`   Treasures: ${list.length}`);
    if (outOfBounds === 0) console.log('   [OK] All locations in bounds');
    else { console.log(`   [FAIL] ${outOfBounds} locations out of bounds`); totalErrors += outOfBounds; }
}

console.log('\nitems_value.json');
const itemsValue = loadJson('items_value.json');
if (itemsValue) {
    console.log(`   Categories: ${itemsValue.length}`);
    const unknown = itemsValue.map(c => c.category).filter(c => !VALID_CATEGORIES.has(c) && c !== 'random');
    if (unknown.length > 0) console.log(`   [WARN] Unknown value categories: ${unknown.join(', ')}`);
    else console.log('   [OK] All value categories match');
}

console.log('\nfilters.json');
const filters = loadJson('filters.json');
if (filters) console.log(`   Keys: ${Object.keys(filters).join(', ')}`);

console.log('\nloot.json');
const loot = loadJson('loot.json');
if (loot) console.log(`   Tables: ${Object.keys(loot.categories || {}).length}`);

console.log('\n=============================================');
if (totalErrors === 0) {
    console.log('[OK] All data files are healthy.');
} else {
    if (missingFiles > 0) {
        console.log(`[FAIL] ${missingFiles} file(s) missing and ${totalErrors - missingFiles} other error(s).`);
        console.log(`\nNote: Make sure these files exist in: ${DATA_DIR}`);
        console.log('   items.json, cycles.json, treasures.json, items_value.json,');
        console.log('   filters.json, loot.json, overlays.json, weekly.json,');
        console.log('   weekly_sets.json, nazar.json, fasttravels.json, jewelry_timestamps.json');
    } else {
        console.log(`[FAIL] Found ${totalErrors} errors.`);
    }
    process.exit(1);
}
