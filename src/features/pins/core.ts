import { registerCore } from '@/features/core';
import { usePins } from './index';

registerCore({
    id: 'pins',
    labelKey: 'systems.pins',
    icon: '/assets/images/icons/pin.png',
    categories: [],
    utilityCategories: ['user_pins'],
    filterIds: [],

    onLoad: () => {
        usePins.getState().loadPins();
    },
});
