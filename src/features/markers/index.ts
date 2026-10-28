'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { loadJson } from '@/lib/api/loader';
import { buildMarker, getPossibleItems } from './build';
import { useCycles } from '@/features/cycles';
import { allCoreCategories, getCore, allCoreGroups, getCoreGroup } from '@/features/core';
import { useCollected } from '@/features/collected';
import type { FiltersData, LootTables, MarkerCategory, MarkerData, PreliminaryMarker } from '@/types/marker';
import type { ItemsJson, MarkersState } from './types';

export type { MarkersState, ItemsJson } from './types';
export type { CoreGroup } from '@/features/core';

const getAllCategories = () => allCoreCategories();

export const useMarkers = create<MarkersState>()(
    persist(
        (set, get) => ({
            allMarkers: [],
            visibleMarkers: [],
            enabledCategories: new Set(),
            searchQuery: '',
            searchResults: null,
            filtersData: {},
            focusedMarkerId: null,
            focusVersion: 0,
            focusOn: null,
            focusOnVersion: 0,
            isLoading: true,
            error: null,
            _initialized: false,

            toggleCategory: (cat) => {
                const next = new Set(get().enabledCategories);
                if (next.has(cat)) {
                    next.delete(cat);
                } else {
                    next.add(cat);
                }
                set({ enabledCategories: next });
                get().recomputeVisible();
            },

            setEnabledCategories: (cats) => {
                set({ enabledCategories: new Set(cats) });
                get().recomputeVisible();
            },

            setSearchQuery: (searchQuery) => {
                set({ searchQuery });
                if (!searchQuery.trim()) {
                    set({ searchResults: null });
                    get().recomputeVisible();
                }
            },

            setFocusedMarker: (markerId) => {
                set((state) => ({
                    focusedMarkerId: markerId,
                    focusVersion: markerId ? state.focusVersion + 1 : state.focusVersion,
                }));
            },

            setFocusOn: (coords) => {
                set((state) => ({
                    focusOn: coords,
                    focusOnVersion: coords ? state.focusOnVersion + 1 : state.focusOnVersion,
                }));
            },

            setSearchResults: (searchResults) => {
                set({ searchResults });
                get().recomputeVisible();
            },

            recomputeVisible: () => {
                const { allMarkers, enabledCategories, searchResults, filtersData } = get();

                // When a search is active (even with zero results), use results directly.
                // `null` = no search; `[]` = search yielded nothing → show nothing.
                if (searchResults !== null) {
                    set({ visibleMarkers: searchResults });
                    return;
                }

                const sysCtx = { enabled: enabledCategories, allMarkers, filtersData };
                const visible: Array<MarkerData> = [];

                for (const m of allMarkers) {
                    if (!enabledCategories.has(m.category)) {
                        continue;
                    }
                    const sys = getCore(m.coreId);
                    if (!sys) {
                        continue;
                    }
                    if (sys.isVisible && !sys.isVisible(m, sysCtx)) {
                        continue;
                    }
                    visible.push(m);
                }

                set({ visibleMarkers: visible });
            },

            loadAll: async () => {
                set({ isLoading: true, error: null });
                try {
                    if (Object.keys(useCycles.getState().categories).length === 0) {
                        await useCycles.getState().load();
                    }

                    const currentCycles = useCycles.getState().categories;
                    const [data, filtersData, lootTables] = await Promise.all([
                        loadJson<ItemsJson>('items'),
                        loadJson<FiltersData>('filters'),
                        loadJson<LootTables>('loot'),
                    ]);

                    const { collectedTexts, importantItemIds } = useCollected.getState();
                    const pending: Array<[PreliminaryMarker, string, MarkerCategory]> = [];

                    for (const [category, cycles] of Object.entries(data)) {
                        const currentCycle = currentCycles[category];
                        if (currentCycle === undefined) {
                            continue;
                        }
                        const cycleList = cycles[String(currentCycle)];
                        if (!cycleList) {
                            continue;
                        }
                        for (const prelim of cycleList) {
                            pending.push([prelim, String(currentCycle), category as MarkerCategory]);
                        }
                    }

                    const possibleItemsCache = new Map<string, Array<string> | undefined>();
                    const built: Array<MarkerData> = [];
                    const CHUNK = 2000;

                    for (let i = 0; i < pending.length; i += CHUNK) {
                        const end = Math.min(i + CHUNK, pending.length);
                        for (let j = i; j < end; j++) {
                            const [prelim, cycleName, category] = pending[j];
                            const m = buildMarker(prelim, cycleName, category, currentCycles);

                            if (m.lootTable) {
                                if (!possibleItemsCache.has(m.lootTable)) {
                                    possibleItemsCache.set(
                                        m.lootTable,
                                        getPossibleItems(m.lootTable, lootTables),
                                    );
                                }
                                m.possibleItems = possibleItemsCache.get(m.lootTable);
                            }

                            m.isCollected = collectedTexts.has(prelim.text);
                            m.isImportant = importantItemIds.has(m.itemId);
                            built.push(m);
                        }
                        await new Promise((r) => setTimeout(r, 0));
                    }

                    useCollected.getState().convertLegacyImportant(built.map((m) => m.itemId));

                    const prevEnabled = get().enabledCategories;
                    const defaults = new Set<MarkerCategory>([
                        ...allCoreCategories(),
                        ...built.map((m) => m.category),
                    ]);
                    const isFirstInit = !get()._initialized;

                    set({
                        allMarkers: built,
                        filtersData,
                        enabledCategories: isFirstInit ? defaults : prevEnabled,
                        isLoading: false,
                        _initialized: true,
                    });

                    get().recomputeVisible();

                    if (typeof window !== 'undefined') {
                        const params = new URLSearchParams(window.location.search);
                        const searchParam = params.get('search');
                        if (searchParam) {
                            get().setSearchQuery(decodeURIComponent(searchParam));
                        }
                        const markerParam = params.get('m');
                        if (markerParam) {
                            get().setFocusedMarker(decodeURIComponent(markerParam));
                        }
                    }
                } catch (err) {
                    console.error('[Markers] Failed', err);
                    set({ isLoading: false, error: err as Error });
                }
            },

            enable: {
                all: () => {
                    set({ enabledCategories: new Set(getAllCategories()) });
                    get().recomputeVisible();
                },
                category: (cat) => {
                    const next = new Set(get().enabledCategories);
                    next.add(cat);
                    set({ enabledCategories: next });
                    get().recomputeVisible();
                },
                categories: (cats) => {
                    const next = new Set(get().enabledCategories);
                    for (const cat of cats) {
                        next.add(cat);
                    }
                    set({ enabledCategories: next });
                    get().recomputeVisible();
                },
            },

            disable: {
                all: () => {
                    set({ enabledCategories: new Set() });
                    get().recomputeVisible();
                },
                category: (cat) => {
                    const next = new Set(get().enabledCategories);
                    next.delete(cat);
                    set({ enabledCategories: next });
                    get().recomputeVisible();
                },
                categories: (cats) => {
                    const next = new Set(get().enabledCategories);
                    for (const cat of cats) {
                        next.delete(cat);
                    }
                    set({ enabledCategories: next });
                    get().recomputeVisible();
                },
            },

            enableGroup: (groupId) => {
                const group = getCoreGroup(groupId);
                if (!group) {
                    console.warn(`[markers] enableGroup: unknown group "${groupId}"`);
                    return;
                }
                const next = new Set(get().enabledCategories);
                for (const c of group.categories ?? []) {
                    next.add(c);
                }
                set({ enabledCategories: next });
                get().recomputeVisible();
            },

            disableGroup: (groupId) => {
                const group = getCoreGroup(groupId);
                if (!group) {
                    console.warn(`[markers] disableGroup: unknown group "${groupId}"`);
                    return;
                }
                const toRemove = new Set(group.categories ?? []);
                set({
                    enabledCategories: new Set(
                        [...get().enabledCategories].filter((c) => !toRemove.has(c)),
                    ),
                });
                get().recomputeVisible();
            },

            toggleGroup: (groupId) => {
                const group = getCoreGroup(groupId);
                if (!group || !group.categories || group.categories.length === 0) {
                    return;
                }
                const enabled = get().enabledCategories;
                const isFullyEnabled = group.categories.every((c) => enabled.has(c));
                if (isFullyEnabled) {
                    get().disableGroup(groupId);
                } else {
                    get().enableGroup(groupId);
                }
            },

            isGroupEnabled: (groupId) => {
                const group = getCoreGroup(groupId);
                if (!group || !group.categories || group.categories.length === 0) {
                    return false;
                }
                const enabled = get().enabledCategories;
                return group.categories.every((c) => enabled.has(c));
            },

            isGroupDisabled: (groupId) => {
                const group = getCoreGroup(groupId);
                if (!group || !group.categories || group.categories.length === 0) {
                    return false;
                }
                const enabled = get().enabledCategories;
                return group.categories.every((c) => !enabled.has(c));
            },
        }),
        {
            name: 'rdr2collector.markers',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                enabledCategories: Array.from(state.enabledCategories),
                _initialized: state._initialized,
            }),
            merge: (persisted, current) => {
                const p = persisted as
                    | { enabledCategories?: Array<MarkerCategory>; _initialized?: boolean }
                    | undefined;
                return {
                    ...current,
                    enabledCategories: new Set(p?.enabledCategories ?? []),
                    _initialized: p?._initialized ?? false,
                };
            },
        },
    ),
);

export { flattenFilterData } from './filters';

export const markers = {
    load: () => useMarkers.getState().loadAll(),
    recompute: () => useMarkers.getState().recomputeVisible(),

    toggleCategory: (cat: MarkerCategory) => useMarkers.getState().toggleCategory(cat),
    setEnabledCategories: (cats: Array<MarkerCategory>) => useMarkers.getState().setEnabledCategories(cats),
    setSearchQuery: (q: string) => useMarkers.getState().setSearchQuery(q),
    setSearchResults: (r: ReturnType<typeof useMarkers.getState>['searchResults']) =>
        useMarkers.getState().setSearchResults(r),

    enable: {
        all: () => useMarkers.getState().enable.all(),
        category: (cat: MarkerCategory) => useMarkers.getState().enable.category(cat),
        categories: (cats: Array<MarkerCategory>) => useMarkers.getState().enable.categories(cats),
    },
    disable: {
        all: () => useMarkers.getState().disable.all(),
        category: (cat: MarkerCategory) => useMarkers.getState().disable.category(cat),
        categories: (cats: Array<MarkerCategory>) => useMarkers.getState().disable.categories(cats),
    },

    groups: () => allCoreGroups(),
    enableGroup: (groupId: string) => useMarkers.getState().enableGroup(groupId),
    disableGroup: (groupId: string) => useMarkers.getState().disableGroup(groupId),
    toggleGroup: (groupId: string) => useMarkers.getState().toggleGroup(groupId),
    isGroupEnabled: (groupId: string) => useMarkers.getState().isGroupEnabled(groupId),
    isGroupDisabled: (groupId: string) => useMarkers.getState().isGroupDisabled(groupId),
};
