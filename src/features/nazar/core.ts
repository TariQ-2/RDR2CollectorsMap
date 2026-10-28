// src/features/nazar/system.ts
import { registerCore } from '@/features/core';
import { useNazar } from './index';
import { useMarkers } from '@/features/markers';
import { translate } from '@/i18n';

registerCore({
    id: 'nazar',
    labelKey: 'menu.madam_nazar',
    categories: [],
    utilityCategories: ['nazar'],
    filterIds: [],

    onLoad: async () => {
        await useNazar.getState().load();
    },

    search: {
        items: () => {
            return [
                {
                    id: 'nazar:current',
                    label: translate('menu.madam_nazar'),
                    keywords: ['nazar', 'madam'],
                    group: 'NPC',
                    onSelect: () => {
                        useMarkers.getState().enable.category('nazar');

                        void (async () => {
                            await useNazar.getState().load();
                            const { currentLocation, possibleLocations } =
                                useNazar.getState();
                            if (currentLocation == null) {
                                return;
                            }
                            const loc = possibleLocations[currentLocation];
                            useMarkers.getState().setFocusOn({
                                lat: loc.x,
                                lng: loc.y,
                            });
                        })();
                    },
                },
            ];
        },
    },
});
