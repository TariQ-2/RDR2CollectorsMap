'use client';

import type { ThemeId } from './types';

type SettingMeta<T> = {
    default: T;
    recompute?: boolean;
};

const CORE = {
    language:                       { default: 'en' },
    theme:                          { default: 'normal' as ThemeId },
    baseLayer:                      { default: 'general.map.layers.default', recompute: true },
    overlayOpacity:                 { default: 0.5 },
    isMapBoundariesEnabled:         { default: true },
    isDoubleClickZoomEnabled:       { default: true },
    isCoordsOnClickEnabled:         { default: false },
    isRightClickEnabled:            { default: false },
    overrideBrowserSearch:          { default: true },
    activeSideMenuTab:              { default: 'collections' as 'collections' | 'treasures' },
    resetEverything:                { default: null },
} satisfies Record<string, SettingMeta<unknown>>;

const COLLECTORS = {
    markerSize:                 { default: 1, recompute: true },
    markerOpacity:              { default: 1, recompute: true },
    isShadowsEnabled:           { default: true, recompute: true },
    isInvisibleRemovedMarkers:  { default: false, recompute: true },
    isPopupsEnabled:            { default: true, recompute: true },
    isPopupsHoverEnabled:       { default: false, recompute: true },
    showTooltipsMap:            { default: 1 },
    toolType:                   { default: 3, recompute: true },
    filterType:                 { default: 'none', recompute: true },
    sortItemsAlphabetically:    { default: false },
    clearMarkers:               { default: null },
    clearImportantItems:        { default: null },
    showWeeklySettings:         { default: true },
} satisfies Record<string, SettingMeta<unknown>>;

const TREASURES = {
    showOnMap: { default: true, recompute: true },
    circleOpacity: { default: 0.5 },
} satisfies Record<string, SettingMeta<unknown>>;

const PINS = {
    placingEnabled: { default: false },
    editingEnabled: { default: true },
    placeNew: { default: null },
    removeAll: { default: null },
} satisfies Record<string, SettingMeta<unknown>>;

export const SCHEMA = {
    core: CORE,
    collectors: COLLECTORS,
    treasures: TREASURES,
    pins: PINS,
} as const;

export function buildDefaults(): SettingsData {
    const out: Record<string, Record<string, unknown>> = {};
    for (const ns of Object.keys(SCHEMA) as Array<keyof typeof SCHEMA>) {
        out[ns] = {};
        for (const key of Object.keys(SCHEMA[ns]) as Array<string>) {
            out[ns][key] = (SCHEMA[ns] as Record<string, { default: unknown }>)[key].default;
        }
    }
    return out as SettingsData;
}

import type { SettingsData } from './types';
