'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { loadJson } from '@/lib/api/loader';
import type { TreasuresState, TreasureData, TreasuresFile } from './types';
import { PERSIST_KEY, readLegacyShownTexts, clearLegacyShownKeys } from './storage';

function filterValidIds(ids: Array<string>, treasures: Array<TreasureData>): Array<string> {
    const valid = new Set(treasures.map((t) => t.id));
    return ids.filter((id) => valid.has(id));
}

export const useTreasures = create<TreasuresState>()(
    persist(
        (set, get) => ({
            treasures: [],
            shownIds: [],
            isLoading: false,
            error: null,
            _loaded: false,

            load: async () => {
                if (get()._loaded) {
                    return;
                }

                set({ isLoading: true, error: null });
                try {
                    const payload = await loadJson<TreasuresFile>('treasures');
                    const treasures = payload?.treasures ?? [];

                    let shown = get().shownIds;
                    if (shown.length === 0) {
                        const legacy = readLegacyShownTexts();
                        if (legacy.length > 0) {
                            shown = legacy;
                            clearLegacyShownKeys(legacy);
                        }
                    }

                    const valid = filterValidIds(shown, treasures);
                    set({ treasures,shownIds: valid,isLoading: false,_loaded: true });
                } catch (err) {
                    console.error('[Treasures] load failed:', err);
                    set({ isLoading: false, error: err instanceof Error? err: new Error('load failed') });
                }
            },

            setShown: (id, shown) => {
                set((state) => {
                    const s = new Set(state.shownIds);
                    if (shown) {
                        s.add(id);
                    } else {
                        s.delete(id);
                    }
                    return { shownIds: Array.from(s) };
                });
            },

            toggleShown: (id) => {
                set((state) => {
                    const s = new Set(state.shownIds);
                    if (s.has(id)) {
                        s.delete(id);
                    } else {
                        s.add(id);
                    }
                    return { shownIds: Array.from(s) };
                });
            },

            showAll: (show) => {
                const { treasures } = get();
                if (show && treasures.length === 0) {
                    console.warn(
                        '[Treasures] showAll(true) called before load',
                    );
                    return;
                }
                set({ shownIds: show ? treasures.map((t) => t.id) : [] });
            },

            clearAll: () => set({ shownIds: [] }),

            importShown: (ids) => {
                const valid = filterValidIds(ids, get().treasures);
                set({ shownIds: valid });
            },

            exportShown: () => [...get().shownIds],
            reset: () => set({ shownIds: [] }),
        }),
        {
            name: PERSIST_KEY,
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({ shownIds: state.shownIds }),
        },
    ),
);

export const treasures = {
    all: () => useTreasures.getState().treasures,
    shown: () => useTreasures.getState().shownIds,
    shownSet: () => new Set(useTreasures.getState().shownIds),
    isLoading: () => useTreasures.getState().isLoading,
    error: () => useTreasures.getState().error,
    load: () => useTreasures.getState().load(),
    setShown: (id: string, shown: boolean) => useTreasures.getState().setShown(id, shown),
    toggle: (id: string) => useTreasures.getState().toggleShown(id),
    showAll: (show: boolean) => useTreasures.getState().showAll(show),
    clearAll: () => useTreasures.getState().clearAll(),
    import: (ids: Array<string>) => useTreasures.getState().importShown(ids),
    export: () => useTreasures.getState().exportShown(),
    reset: () => useTreasures.getState().reset(),
};

export type { TreasuresState, TreasureData } from './types';
