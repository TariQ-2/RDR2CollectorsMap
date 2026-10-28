'use client';

import { loadJson } from '@/lib/api/loader';
import type { ItemsJson } from '../markers/types';
import type { CollectionModel, CollectionsState, ItemModel, ItemsValueEntry, WeeklyState } from './types';

const amountKey = (itemId: string) => `rdr2collector.amount.${itemId}`;

function readAmount(itemId: string): number {
    if (typeof window === 'undefined') {
        return 0;
    };

    const raw = localStorage.getItem(amountKey(itemId));
    if (raw == null) {
        return 0;
    };

    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 0;
}

function writeAmount(itemId: string, value: number): void {
    if (value > 0) {
        localStorage.setItem(amountKey(itemId), String(value));
    } else {
        localStorage.removeItem(amountKey(itemId));
    }
}

async function loadJewelryTimestamps(): Promise<Record<string, unknown>> {
    try {
        const data = await loadJson<{ items?: Record<string, unknown> }>('jewelry_timestamps');
        return data.items ?? {};
    } catch {
        return {};
    }
}

type Listener = () => void;

let _snapshotVersion = 0;
let _cachedCollectionsSnapshot: CollectionsState | null = null;
let _cachedWeeklySnapshot: WeeklyState | null = null;

export const collectorsService = {
    SYSTEM_ID: 'collectors' as const,
    collections: [] as Array<CollectionModel>,
    itemsById: {} as Record<string, ItemModel>,
    jewelryTimestamps: {} as Record<string, unknown>,
    _listeners: new Set<Listener>(),

    get _snapshotVersion(): number {
        return _snapshotVersion;
    },

    _subscribe(listener: Listener): () => void {
        collectorsService._listeners.add(listener);
        return () => {
            collectorsService._listeners.delete(listener);
        };
    },

    _notify(): void {
        _snapshotVersion++;
        _cachedCollectionsSnapshot = null;
        _cachedWeeklySnapshot = null;
        collectorsService._listeners.forEach((l) => l());
    },

    load: async (): Promise<void> => {
        const [data, jewelryTimestamps, itemsJson] = await Promise.all([
            loadJson<Array<ItemsValueEntry>>('items_value'),
            loadJewelryTimestamps(),
            loadJson<ItemsJson>('items'),
        ]);

        const randomCycles = itemsJson['random'] ?? {};
        const seen = new Map<string, { tool: number; type: string }>();
        for (const cycleMarkers of Object.values(randomCycles)) {
            for (const marker of cycleMarkers) {
                if (!seen.has(marker.text)) {
                    seen.set(marker.text, { tool: marker.tool, type: (marker as { type?: string }).type ?? 'mounds' });
                }
            }
        }

        const randomItemsList: Array<ItemModel> = [...seen.entries()]
            .sort(([a], [b]) => {
                const na = Number(a.replace('random_item_', ''));
                const nb = Number(b.replace('random_item_', ''));
                return na - nb;
            }).map(([text, meta]) => {
                const num = text.replace('random_item_', '');
                const typeLabel = meta.type.charAt(0).toUpperCase() + meta.type.slice(1);
                return { itemId: text, displayName: `Random Spot #${num} (${typeLabel})`, price: 0, enumHash: 0, category: 'random', amount: 0, tool: meta.tool };
            });

        const collections: Array<CollectionModel> = data.map((entry) => ({
            category: entry.category,
            price: entry.price,
            items: entry.itemsList.map((it) => ({
                itemId: it.itemId,
                price: it.price,
                enumHash: it.enumHash,
                category: entry.category,
                amount: readAmount(it.itemId),
            })),
        }));

        collections.push({ category: 'random', price: 0, items: randomItemsList });

        const itemsById: Record<string, ItemModel> = {};
        for (const collection of collections) {
            for (const item of collection.items) {
                console.log("Items = ", item);
                itemsById[item.itemId] = item;
            }
        }

        collectorsService.collections = collections;
        collectorsService.itemsById = itemsById;
        collectorsService.jewelryTimestamps = jewelryTimestamps;
        collectorsService._notify();
    },

    setAmount: (itemId: string, value: number): void => {
        const item = collectorsService.itemsById[itemId];
        if (!item) {
            return;
        }

        const newAmount = Math.max(0, Math.floor(value));
        if (newAmount === item.amount) {
            return;
        }

        writeAmount(itemId, newAmount);

        const updatedItem = { ...item, amount: newAmount };
        const nextItemsById = { ...collectorsService.itemsById, [itemId]: updatedItem };
        const nextCollections = collectorsService.collections.map((collection) => {
            const idx = collection.items.findIndex((it) => it.itemId === itemId);
            if (idx === -1) {
                return collection;
            }

            const items = collection.items.slice();
            items[idx] = updatedItem;
            return { ...collection, items };
        });

        collectorsService.itemsById = nextItemsById;
        collectorsService.collections = nextCollections;
        collectorsService._notify();
    },

    changeAmount: (itemId: string, delta: number): void => {
        const item = collectorsService.itemsById[itemId];
        if (!item) {
            return;
        }

        collectorsService.setAmount(itemId, item.amount + delta);
    },

    importInventory: (json: string): void => {
        const entries = JSON.parse(json) as Array<{ itemid: number; quantity: number }>;
        const byHash = new Map<number, number>();
        for (const e of entries) {
            const id = Number(e.itemid);
            const qty = Number(e.quantity);
            byHash.set(id, Number.isFinite(qty) && qty > 0 ? qty : 0);
        }

        const itemsById: Record<string, ItemModel> = { ...collectorsService.itemsById };
        let changed = false;

        for (const collection of collectorsService.collections) {
            if (collection.category === 'random') {
                continue;
            }
            for (const item of collection.items) {
                const qty = byHash.get(item.enumHash) ?? 0;
                if (qty === item.amount) {
                    continue;
                }
                writeAmount(item.itemId, qty);
                itemsById[item.itemId] = { ...item, amount: qty };
                changed = true;
            }
        }

        if (!changed) {
            return;
        }

        const collections = collectorsService.collections.map((c) => ({
            ...c,
            items: c.items.map((it) => itemsById[it.itemId] ?? it),
        }));

        collectorsService.itemsById = itemsById;
        collectorsService.collections = collections;
        collectorsService._notify();
    },

    resetAmounts: (): void => {
        const itemsById: Record<string, ItemModel> = {};
        let changed = false;

        for (const [id, item] of Object.entries(collectorsService.itemsById)) {
            if (item.amount !== 0) {
                localStorage.removeItem(amountKey(id));
                itemsById[id] = { ...item, amount: 0 };
                changed = true;
            } else {
                itemsById[id] = item;
            }
        }

        if (!changed) {
            return;
        }

        collectorsService.itemsById = itemsById;
        collectorsService.collections = collectorsService.collections.map((c) => ({
            ...c,
            items: c.items.map((it) => itemsById[it.itemId] ?? it),
        }));
        collectorsService._notify();
    },

    snapshot(): CollectionsState {
        if (_cachedCollectionsSnapshot) {
            return _cachedCollectionsSnapshot;
        }
        _cachedCollectionsSnapshot = {
            collections: collectorsService.collections,
            itemsById: collectorsService.itemsById,
            jewelryTimestamps: collectorsService.jewelryTimestamps,
        };
        return _cachedCollectionsSnapshot;
    },

    get<K extends keyof CollectionsState>(key: K): CollectionsState[K] {
        return collectorsService.snapshot()[key];
    },

    averageAmount(collection: CollectionModel): number {
        if (collection.items.length === 0) {
            return 0;
        }
        return collection.items.reduce((s, i) => s + i.amount, 0) / collection.items.length;
    },

    totalValue(collection: CollectionModel, effective: (item: ItemModel) => number): number {
        if (collection.items.length === 0) {
            return 0;
        }

        const values = collection.items.map(effective);
        const ca = Math.min(...values);
        let sum = 0;
        for (let i = 0; i < collection.items.length; i++) {
            sum += (values[i] - ca) * collection.items[i].price;
        }
        return sum + ca * collection.price;
    },

    totalValues(collections: Array<CollectionModel>, effective: (item: ItemModel) => number): number {
        return collections.reduce(
            (sum, c) => sum + collectorsService.totalValue(c, effective),
            0,
        );
    },

    weekly: {
        currentId: null as string | null,
        sets: {} as Record<string, { id: string; value: number; items: Array<string> }>,
        items: [] as Array<{ itemId: string; name: string; icon: string; category: string }>,
        value: 0,
        isLoading: true,
        error: null as Error | null,

        load: async (): Promise<void> => {
            try {
                const weeklyData = await loadJson<{ sets: Record<string, { id: string; value: number; items: Array<string> }> }>('weekly_sets');
                const response = await loadJson<{ set: string }>('weekly');
                const rawId = response.set.replace('AWARD_ROLE_COLLECTOR_SET_', '').toLowerCase();
                const setId = rawId.startsWith('set_') ? rawId : `set_${rawId}`;

                let weeklyParam: string | null = null;
                if (typeof window !== 'undefined') {
                    weeklyParam = new URLSearchParams(window.location.search).get('weekly');
                }

                let activeId = setId;
                if (weeklyParam) {
                    const normalized = weeklyParam.startsWith('set_') ? weeklyParam : `set_${weeklyParam}`;
                    if (weeklyData.sets[normalized]) {
                        activeId = normalized;
                    }
                }

                const activeSet = weeklyData.sets[activeId];
                if (!activeSet) {
                    throw new Error(`Weekly set "${activeId}" not found`);
                }

                const items = activeSet.items.map((itemId) => {
                    const mapItem = collectorsService.itemsById[itemId];
                    if (mapItem) {
                        return {
                            itemId,
                            name: itemId,
                            icon: `/RDR2CollectorsMap/assets/images/icons/${mapItem.category}.png`,
                            category: mapItem.category,
                        };
                    }

                    const leaf = itemId.replace(/^weekly\.items\./, '');
                    return {
                        itemId,
                        name: itemId,
                        icon: `/assets/images/icons/game/${leaf}.png`,
                        category: leaf.replace(/^consumable_|^provision_|^legendary_item_|^animal_carcass_|^pocket_watch_|^fish_/, '').split('_')[0],
                    };
                });

                collectorsService.weekly.currentId = activeId;
                collectorsService.weekly.sets = weeklyData.sets;
                collectorsService.weekly.items = items;
                collectorsService.weekly.value = activeSet.value;
                collectorsService.weekly.isLoading = false;
                collectorsService.weekly.error = null;
                collectorsService._notify();
            } catch (err) {
                console.error('[Weekly] Failed to load', err);
                collectorsService.weekly.isLoading = false;
                collectorsService.weekly.error = err as Error;
                collectorsService._notify();
            }
        },

        snapshot(): WeeklyState {
            if (_cachedWeeklySnapshot) {
                return _cachedWeeklySnapshot;
            }
            _cachedWeeklySnapshot = {
                currentId: collectorsService.weekly.currentId,
                sets: collectorsService.weekly.sets,
                items: collectorsService.weekly.items,
                value: collectorsService.weekly.value,
                isLoading: collectorsService.weekly.isLoading,
                error: collectorsService.weekly.error,
                load: collectorsService.weekly.load,
            };
            return _cachedWeeklySnapshot;
        },

        get<K extends keyof WeeklyState>(key: K): WeeklyState[K] {
            return collectorsService.weekly.snapshot()[key];
        },
    },
};

export default collectorsService;

if (typeof window !== 'undefined') {
    (window as unknown as { __collectors: typeof collectorsService }).__collectors = collectorsService;
}
