'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { patch } from '@/lib/patch';

export interface InventoryState {
    highlightLowAmountItems: boolean;
    isEnabled: boolean;
    isMenuUpdateEnabled: boolean;
    isPopupsEnabled: boolean;
    resetInventoryDaily: boolean;
    stackSize: number;
    flowersSoftStackSize: number;
    enableAdvancedInventoryOptions: boolean;
    autoEnableSoldItems: boolean;
    maxAmountLowInventoryItems: number;
    highlightStyle: 'static' | 'animated';

    setSetting: <K extends keyof InventoryState>(
        key: K,
        value: InventoryState[K],
    ) => void;
}

const DEFAULTS = {
    highlightLowAmountItems: false,
    isEnabled: false,
    isMenuUpdateEnabled: true,
    isPopupsEnabled: true,
    resetInventoryDaily: false,
    stackSize: 10,
    flowersSoftStackSize: 10,
    enableAdvancedInventoryOptions: true,
    autoEnableSoldItems: true,
    maxAmountLowInventoryItems: 5,
    highlightStyle: 'animated' as const,
};

export const useInventory = create<InventoryState>()(
    persist(
        (set) => ({
            ...DEFAULTS,
            setSetting: (key, value) => set(patch(key, value)),
        }),
        {
            name: 'rdr2collector.inventory',
            storage: createJSONStorage(() => localStorage),
        },
    ),
);

if (typeof window !== 'undefined') {
    void (async () => {
        try {
            const [{ events }, { default: collectorsService }] = await Promise.all([
                import('@/lib/events'),
                import('@/features/collectors'),
            ]);

            events.markersCollectedChanged.subscribe(({ changes }) => {
                const { isEnabled } = useInventory.getState();
                if (!isEnabled) {
                    return;
                }

                for (const { itemId, category, isCollected } of changes) {
                    if (category === 'random') {
                        continue;
                    }
                    collectorsService.changeAmount(itemId, isCollected ? 1 : -1);
                }
            });
        } catch (err) {
            console.error('[inventory] subscriber setup failed', err);
        }
    })();
}

export const inventory = {
    setSetting: <K extends keyof InventoryState>(
        key: K,
        value: InventoryState[K],
    ) => useInventory.getState().setSetting(key, value),
    snapshot: () => useInventory.getState(),
    get: <K extends keyof InventoryState>(key: K): InventoryState[K] =>
        useInventory.getState()[key],
};
