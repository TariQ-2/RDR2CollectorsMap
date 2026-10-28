import type { MarkerData, MarkerCategory, PreliminaryMarker, LootTables } from '@/types/marker';
import { RANDOMIZED_CATEGORIES } from '@/data/categories';
import { coreOfCategory } from '@/features/core';

function getLootTable(prelim: PreliminaryMarker, category: MarkerCategory): string {
    if (category === 'fossils_random') {
        const t = prelim.text;
        if (t.includes('.mud.') || t.includes('_mud_')) {
            return 'fossilsBuriedMud';
        }
        if (t.includes('.snowDirt.') || t.includes('_snow_dirt_')) {
            return 'fossilsBuriedDirtSnow';
        }
        if (t.includes('.snow.') || t.includes('_snow_')) {
            return 'fossilsBuriedSnow';
        }
        if (t.includes('.water.') || t.includes('_water_')) {
            return 'fossilsBuriedWater';
        }
        return 'fossilsRandom';
    }
    if (category === 'arrowhead') {
        return prelim.tool === 1 ? 'arrowheadBuriedMounds' : 'arrowhead';
    }
    if (category === 'random') {
        const type = prelim.type ?? "";
        const capType = type.charAt(0).toUpperCase() + type.slice(1);
        return `randomBuried${capType}`;
    }
    return category.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

function resolveLootItems(key: string, loot: LootTables['loot'], visited: Set<string>): Array<string> {
    if (visited.has(key)) {
        console.warn(`[loot] cycle detected at "${key}" — skipping`);
        return [];
    }
    visited.add(key);

    const items = loot[key];
    if (!items) {
        return [key];
    }

    const out: Array<string> = [];
    for (const childKey of Object.keys(items)) {
        out.push(...resolveLootItems(childKey, loot, visited));
    }
    return out;
}

export function getPossibleItems(lootTable: string, lootTables?: LootTables): Array<string> | undefined {
    if (!lootTables) {
        return undefined;
    }
    const { categories, loot } = lootTables;
    const randomCategories = categories[lootTable];
    if (!randomCategories) {
        return undefined;
    }

    const items = new Set<string>();
    for (const category of randomCategories) {
        for (const item of resolveLootItems(category, loot, new Set())) {
            items.add(item);
        }
    }
    return [...items];
}

function getPrimaryDescriptionKey(prelim: PreliminaryMarker, itemId: string, category: MarkerCategory, cycleName: string): string {
    if (category === 'fossils_random') {
        return '';
    }
    if (category === 'random') {
        return '';
    }
    if (category === "flower") {
        return '';
    }
    return `${itemId}.${cycleName}.desc`;
}

function getSecondaryDescriptionKey(prelim: PreliminaryMarker, itemId: string, category: MarkerCategory): string {
    if (category === 'random') {
        return prelim.tool === 1 ? 'collectables.map.random_spot_shovel.desc' : `collectables.map.random_spot_metal_detector_${prelim.type}.desc`;
    }
    if (category === 'arrowhead') {
        return 'collectables.menu.items.arrowhead.random.desc';
    }
    if (category === 'coin') {
        return 'collectables.menu.items.coin.random.desc';
    }

    if (category === 'fossils_random') {
        return 'collectables.menu.items.fossil.random.desc';
    }
    if (category === 'jewelry_random') {
        return 'collectables.menu.items.jewelry.random.desc';
    }

    if (itemId === 'collectables.menu.items.flower.agarita' || itemId === 'collectables.menu.items.flower.bloodFlower') {
        return 'collectables.map.flower_type.night_only';
    }

    if (itemId === 'collectables.menu.items.flower.creekPlum') {
        return 'collectables.map.flower_type.bush';
    }

    if (category === 'egg') {
        const eggBase = itemId.replace('collectables.menu.items.egg.', '');
        if (['spoonbill', 'heron', 'eagle', 'hawk', 'egret'].includes(eggBase)) {
            return 'collectables.map.egg_type.tree';
        }
        if (eggBase === 'vulture') {
            return 'collectables.map.egg_type.stump';
        }
        if (['duck', 'goose', 'loon'].includes(eggBase)) {
            return 'collectables.map.egg_type.ground';
        }
    }

    return '';
}

/* ───────── buildMarker ───────── */
const ITEM_TEXT_RE = /^(.+?)(?:_(\d+))?$/;

export function buildMarker(
    prelim: PreliminaryMarker,
    cycleName: string,
    category: MarkerCategory,
    currentCycles: Record<string, number> = {},
): MarkerData {
    const match = ITEM_TEXT_RE.exec(prelim.text);
    if (!match) {
        throw new Error(`[buildMarker] invalid item text: "${prelim.text}"`);
    }

    const itemId        = match[1];
    const numberStr     = match[2];
    const itemNumber    = numberStr ? Number(numberStr) : 1;
    const itemNumberStr = numberStr ? `#${itemNumber}` : '';
    const subdata       = (category === 'egg' || category === 'flower') ? (itemId.split('.').pop() ?? itemId) : undefined;
    const lootTable     = getLootTable(prelim, category);

    const currentCycle  = currentCycles[category];
    const isCurrent     = currentCycle === undefined ? true : cycleName === String(currentCycle);
    const coreId        = coreOfCategory(category) ?? 'collectors';

    return {
        ...prelim,
        coreId,
        itemId,
        itemNumber,
        itemNumberStr,
        cycleName,
        markerId: `${prelim.text}_${cycleName}`,
        category,
        subdata,
        legacyItemId: subdata ?? prelim.text,
        primaryDescriptionKey: getPrimaryDescriptionKey(prelim, itemId, category, cycleName),
        secondaryDescriptionKey: getSecondaryDescriptionKey(prelim, itemId, category),
        lootTable,
        possibleItems: undefined,
        isCollected: false,
        isVisible: true,
        canCollect: true,
        isCurrent,
        isRandomizedItem: RANDOMIZED_CATEGORIES.has(category),
    };
}
