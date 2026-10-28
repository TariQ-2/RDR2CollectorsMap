import { registerCore } from '@/features/core';
import type { MarkerCategory } from '@/types/marker';
import { useTreasures } from './index';
import { useMarkers } from '@/features/markers';
import { translate } from '@/i18n';
export const TREASURES_SYSTEM_ID = 'treasures';

registerCore({
    id: TREASURES_SYSTEM_ID,
    labelKey: 'systems.treasures',
    icon: '/assets/images/icons/ui/treasure.png',
    categories: ['treasure'] as Array<MarkerCategory>,
    utilityCategories: [],
    groups: [
        {
            id: 'treasures',
            labelKey: 'systems.treasures.groups.treasures',
            categories: ['treasure'] as Array<MarkerCategory>,
        },
    ],
    filterIds: [],
    visibleByText: () => {
        const { treasures, shownIds } = useTreasures.getState();
        if (treasures.length === 0) {
            return null;
        }
        return new Set(shownIds);
    },
    onLoad: async () => {
        await useTreasures.getState().load();
    },
    search: {
        items: () => {
            const { treasures } = useTreasures.getState();
            return treasures.map((tr) => ({
                id: `treasure:${tr.id}`,
                label: translate(`map.${tr.id}`),
                keywords: [tr.id, tr.label],
                group: 'Treasure',
                onSelect: () => {
                    useMarkers.getState().enable.category('treasure');
                    useTreasures.getState().setShown(tr.id, true);
                    useMarkers.getState().setFocusOn({
                        lat: tr.center.x,
                        lng: tr.center.y,
                    });
                },
            }));
        },
    },
});
