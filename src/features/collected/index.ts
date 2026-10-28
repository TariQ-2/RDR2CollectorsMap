'use client';

import { create } from 'zustand';
import { events } from '@/lib/events';
import {
    readCollectedSet, writeCollected, clearCollected, clearAllCollected,
    readCollectedTimestamp,
    readImportantSet, writeImportant, clearAllImportant,
    LEGACY,
} from './storage';
import type { CollectedState } from './types';

const SSR_EMPTY = new Set<string>();

export const useCollected = create<CollectedState>((set, get) => ({
    collectedTexts: typeof window === 'undefined' ? SSR_EMPTY : readCollectedSet(),
    importantItemIds: typeof window === 'undefined' ? SSR_EMPTY : readImportantSet(),

    toggle: (text) => {
        const next = !get().collectedTexts.has(text);
        writeCollected(text, next);
        const s = new Set(get().collectedTexts);
        if (next) {
            s.add(text);
        } else {
            s.delete(text);
        };

        set({ collectedTexts: s });
        void (async () => {
            try {
                const { useMarkers } = await import('@/features/markers');
                const marker = useMarkers.getState().allMarkers.find((m) => m.text === text);
                if (marker) {
                    events.markersCollectedChanged.emit({
                        changes: [{ itemId: marker.itemId, category: marker.category, isCollected: next }],
                    });
                }
            } catch { }
        })();

        return next;
    },

    toggleBatch: (texts) => {
        const s = new Set(get().collectedTexts);
        const result: Array<{ text: string; isCollected: boolean }> = [];
        const collectedNow: Array<string> = [];
        const clearedNow: Array<string> = [];

        for (const t of texts) {
            const next = !s.has(t);
            writeCollected(t, next);
            if (next) {
                s.add(t);
                collectedNow.push(t);
            } else {
                s.delete(t);
                clearedNow.push(t);
            };

            result.push({ text: t, isCollected: next });
        }

        set({ collectedTexts: s });
        if (collectedNow.length) {
            events.collectedToggled.emit({ texts: collectedNow, isCollected: true });
        };

        if (clearedNow.length) {
            events.collectedToggled.emit({ texts: clearedNow, isCollected: false });
        };

        void (async () => {
            try {
                const { useMarkers } = await import('@/features/markers');
                const allMarkers = useMarkers.getState().allMarkers;
                const changes: Array<{ itemId: string; category: string; isCollected: boolean }> = [];

                for (const { text, isCollected } of result) {
                    const m = allMarkers.find((mm) => mm.text === text);
                    if (!m) {
                        continue;
                    };

                    changes.push({ itemId: m.itemId, category: m.category, isCollected });
                }

                if (changes.length > 0) {
                    events.markersCollectedChanged.emit({ changes });
                }
            } catch {}
        })();

        return result;
    },

    mark: (text) => {
        if (get().collectedTexts.has(text)) {
            return;
        };

        writeCollected(text, true);
        const s = new Set(get().collectedTexts);
        s.add(text);
        set({ collectedTexts: s });
        events.collectedToggled.emit({ texts: [text], isCollected: true });
    },

    setImportant: (itemId, isImportant) => {
        writeImportant(itemId, isImportant);
        const s = new Set(get().importantItemIds);
        if (isImportant) {
            s.add(itemId);
        } else {
            s.delete(itemId);
        };

        set({ importantItemIds: s });
        events.importantToggled.emit({ itemId, isImportant });
    },

    toggleImportant: (itemId) => {
        const next = !get().importantItemIds.has(itemId);
        get().setImportant(itemId, next);
        return next;
    },

    clearImportant: () => {
        clearAllImportant();
        set({ importantItemIds: new Set() });
    },

    convertLegacyImportant: (allItemIds) => {
        try {
            const raw = localStorage.getItem(LEGACY.IMPORTANT_ITEMS_KEY);
            if (!raw) {
                return;
            };

            const oldItems = JSON.parse(raw) as Array<string>;
            if (!Array.isArray(oldItems) || oldItems.length === 0) {
                return;
            };

            const all = new Set(allItemIds);
            const s = new Set(get().importantItemIds);
            for (const itemId of oldItems) {
                if (!all.has(itemId)) {
                    continue;
                };

                writeImportant(itemId, true);
                s.add(itemId);
            }
            set({ importantItemIds: s });
            localStorage.removeItem(LEGACY.IMPORTANT_ITEMS_KEY);
        } catch {
            /* ignore */
        }
    },

    reset: (texts) => {
        const textsArr = Array.from(texts);
        clearCollected(texts);
        const s = new Set(get().collectedTexts);
        for (const t of textsArr) {
            s.delete(t);
        };

        set({ collectedTexts: s });
        if (textsArr.length) {
            events.collectedToggled.emit({ texts: textsArr, isCollected: false });
            void (async () => {
                try {
                    const { useMarkers } = await import('@/features/markers');
                    const allMarkers = useMarkers.getState().allMarkers;
                    const changes: Array<{ itemId: string; category: string; isCollected: boolean }> = [];

                    for (const text of textsArr) {
                        const m = allMarkers.find((mm) => mm.text === text);
                        if (!m) {
                            continue;
                        };

                        changes.push({ itemId: m.itemId, category: m.category, isCollected: false });
                    }

                    if (changes.length > 0) {
                        events.markersCollectedChanged.emit({ changes });
                    }
                } catch {}
            })();
        }
    },

    resetAll: () => {
        const texts = Array.from(get().collectedTexts);
        clearAllCollected();
        set({ collectedTexts: new Set() });
        if (texts.length) {
            events.collectedToggled.emit({ texts, isCollected: false });
            void (async () => {
                try {
                    const { useMarkers } = await import('@/features/markers');
                    const allMarkers = useMarkers.getState().allMarkers;
                    const changes: Array<{ itemId: string; category: string; isCollected: boolean }> = [];

                    for (const text of texts) {
                        const m = allMarkers.find((mm) => mm.text === text);
                        if (!m) {
                            continue;
                        };

                        changes.push({ itemId: m.itemId, category: m.category, isCollected: false });
                    }

                    if (changes.length > 0) {
                        events.markersCollectedChanged.emit({ changes });
                    }
                } catch {}
            })();
        }
    },

    getTimestamp: readCollectedTimestamp,
}));

export const collected = {
    toggle: (text: string) => useCollected.getState().toggle(text),
    toggleBatch: (texts: Array<string>) => useCollected.getState().toggleBatch(texts),
    mark: (text: string) => useCollected.getState().mark(text),
    isCollected: (text: string) => useCollected.getState().collectedTexts.has(text),
    isImportant: (itemId: string) => useCollected.getState().importantItemIds.has(itemId),
    toggleImportant: (itemId: string) => useCollected.getState().toggleImportant(itemId),
    clearImportant: () => useCollected.getState().clearImportant(),
    convertLegacyImportant: (allItemIds: Array<string>) => useCollected.getState().convertLegacyImportant(allItemIds),
    reset: (texts: Iterable<string>) => useCollected.getState().reset(texts),
    resetAll: () => useCollected.getState().resetAll(),
    getTimestamp: (text: string) => useCollected.getState().getTimestamp(text),
};

export type { CollectedState } from './types';
