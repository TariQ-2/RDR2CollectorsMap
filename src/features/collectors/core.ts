import { registerCore } from '@/features/core';
import type { MarkerData, MarkerCategory, FiltersData } from '@/types/marker';
import { COLLECTIBLE_GROUPS } from '@/data/collectibles';
import { useSettings } from '@/features/settings';
import { useInventory } from '@/features/inventory';
import { buildCollectorsFilter, type FilterDefinition } from './filters';
import collectorsService from './index';

const COLLECTIBLE_CATEGORIES: Array<MarkerCategory> = COLLECTIBLE_GROUPS
    .flatMap((g) => g.subCategories.map((s) => s.id as MarkerCategory))
    .concat('random');

const FILTER_IDS: ReadonlyArray<string> = [
    'moonshiner',
    'naturalist',
    'weekly',
    'weeklyAndRandom',
    'important',
    'static',
    'hideFlowers',
    'coinsSpots',
    'lowInventoryItems',
    'lowInventoryItemsAndRandom',
];

const CHILD_CATEGORY_REQUIREMENTS: Partial<Record<MarkerCategory, ReadonlyArray<MarkerCategory>>> = {
    jewelry_random: ['bracelet', 'earring', 'necklace', 'ring'],
    fossils_random: ['coastal', 'oceanic', 'megafauna'],
};

let filterCache: {
    filterType: string;
    allMarkers: ReadonlyArray<MarkerData>;
    filtersData: FiltersData;
    maxAmount: number;
    weeklyItemsRef: ReadonlyArray<unknown>;
    def: FilterDefinition | null;
} | null = null;

function getCollectorsFilter(filterType: string, allMarkers: ReadonlyArray<MarkerData>, filtersData: FiltersData, maxAmount: number): FilterDefinition | null {
    const cache = filterCache;
    if (cache && cache.filterType === filterType && cache.allMarkers === allMarkers && cache.filtersData === filtersData && cache.maxAmount === maxAmount && cache.weeklyItemsRef === collectorsService.weekly.items) {
        return cache.def;
    }

    const def = buildCollectorsFilter(filterType, [...allMarkers], filtersData, maxAmount);
    filterCache = {
        filterType,
        allMarkers,
        filtersData,
        maxAmount,
        weeklyItemsRef: collectorsService.weekly.items,
        def,
    };
    return def;
}

registerCore({
    id: collectorsService.SYSTEM_ID,
    labelKey: 'systems.collectors',
    // icon: '/assets/images/icons/ui/collector.png',
    onLoad: async () => {
        await collectorsService.load();
    },
    categories: COLLECTIBLE_CATEGORIES,
    utilityCategories: [],
    groups: [
        {
            id: 'collectibles',
            labelKey: 'systems.collectors.groups.collectibles',
            categories: COLLECTIBLE_CATEGORIES,
        },
    ],
    filterIds: FILTER_IDS,

    isVisible: (m, ctx) => {
        const settings = useSettings.getState();
        const inventory = useInventory.getState();
        const { toolType, filterType } = settings.collectors;

        if (toolType !== 3 && !(toolType >= m.tool || toolType === -m.tool)) {
            return false;
        }

        const childReqs = CHILD_CATEGORY_REQUIREMENTS[m.category];
        if (childReqs && !childReqs.some((c) => ctx.enabled.has(c))) {
            return false;
        }

        if (filterType !== 'none') {
            const filter = getCollectorsFilter(filterType, ctx.allMarkers, ctx.filtersData, inventory.maxAmountLowInventoryItems);
            if (filter && !filter.predicate(m)) {
                return false;
            }
        }

        return true;
    },
});
