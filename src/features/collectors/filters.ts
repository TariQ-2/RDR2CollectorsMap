import collectorsService from '@/features/collectors';
import { flattenFilterData } from '@/features/markers';
import type { FiltersData, MarkerData } from '@/types/marker';

export interface FilterDefinition {
    predicate: (marker: MarkerData) => boolean;
    enableMainCategory: boolean;
}

function weeklyItemSet(allMarkers: Array<MarkerData>): Set<string> {
    const collectibleIds = new Set(allMarkers.map((m) => m.itemId));
    const set = new Set<string>();
    for (const item of collectorsService.weekly.items) {
        if (collectibleIds.has(item.itemId)) {
            set.add(item.itemId);
        }
    }
    return set;
}

export function buildCollectorsFilter(filterType: string, allMarkers: Array<MarkerData>, filtersData: FiltersData, maxAmountLowInventoryItems: number): FilterDefinition | null {
    if (filterType === 'moonshiner' || filterType === 'naturalist') {
        const roleItems = new Set(flattenFilterData(filtersData, filterType));
        return {
            predicate: (marker) => roleItems.has(marker.itemId),
            enableMainCategory: true,
        };
    }

    if (filterType === 'weekly') {
        const weeklyItems = weeklyItemSet(allMarkers);
        return {
            predicate: (marker) => weeklyItems.has(marker.itemId),
            enableMainCategory: true,
        };
    }

    if (filterType === 'weeklyAndRandom') {
        const weeklyItems = weeklyItemSet(allMarkers);
        return {
            predicate: (marker) =>
                weeklyItems.has(marker.itemId) ||
                (marker.possibleItems != null && marker.possibleItems.some((id) => weeklyItems.has(id))),
            enableMainCategory: true,
        };
    }

    if (filterType === 'important') {
        const importantItems = new Set(allMarkers.filter((m) => m.isImportant).map((m) => m.itemId));
        return {
            predicate: (marker) => importantItems.has(marker.itemId),
            enableMainCategory: true,
        };
    }

    if (filterType === 'static') {
        return {
            predicate: (marker) => !marker.legacyItemId.includes('random'),
            enableMainCategory: true,
        };
    }

    if (filterType === 'hideFlowers') {
        const roleItems = new Set(flattenFilterData(filtersData, 'moonshiner'));
        return {
            predicate: (marker) => roleItems.has(marker.itemId) || marker.category !== 'flower',
            enableMainCategory: true,
        };
    }

    if (filterType === 'coinsSpots') {
        return {
            predicate: (marker) => (marker.category === 'coin' || marker.category === 'random') && marker.tool === 2,
            enableMainCategory: true,
        };
    }

    if (filterType === 'lowInventoryItems') {
        const lowItems = new Set(
            Object.values(collectorsService.itemsById)
                .filter((item) => item.amount < maxAmountLowInventoryItems)
                .map((item) => item.itemId),
        );
        return {
            predicate: (marker) => lowItems.has(marker.itemId),
            enableMainCategory: false,
        };
    }

    if (filterType === 'lowInventoryItemsAndRandom') {
        const lowItems = new Set(Object.values(collectorsService.itemsById).filter((item) => item.amount < maxAmountLowInventoryItems).map((item) => item.itemId));
        return {
            predicate: (marker) => lowItems.has(marker.itemId) || (marker.possibleItems != null && marker.possibleItems.some((id) => lowItems.has(id))),
            enableMainCategory: false,
        };
    }

    return null;
}
