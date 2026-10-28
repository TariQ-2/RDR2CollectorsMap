'use client';

import { create } from 'zustand';
import { persist, createJSONStorage, subscribeWithSelector } from 'zustand/middleware';
import { SCHEMA, buildDefaults } from './schema';
import type { SettingsData, SettingsNamespace } from './types';
import { languageDir } from '@/i18n';

export type * from './types';
export { SCHEMA, buildDefaults } from './schema';
export { THEMES, getTheme, type ThemeDef, type ThemeId } from './themes';

const DEFAULTS = buildDefaults();

const CHANGE_HANDLERS: Record<string, (value: unknown) => void> = {
    'core.language': (value) => {
        if (typeof window === 'undefined') {
            return;
        };

        const lang = String(value ?? 'en');
        document.documentElement.lang = lang;
        document.documentElement.dir = languageDir(lang);
    },
};

function triggerRecompute(): void {
    import('@/features/markers')
        .then(({ useMarkers }) => useMarkers.getState().recomputeVisible())
        .catch((e) => console.error('[settings] recompute failed', e));
}

function isRecomputePath(ns: string, key: string): boolean {
    const def = (SCHEMA[ns as SettingsNamespace] as Record<string, { recompute?: boolean }>)?.[key];
    return Boolean(def?.recompute);
}

const FLAT_TO_NAMESPACED: Record<string, [string, string]> = {
    lastVersion: ['core', 'lastVersion'],
    language: ['core', 'language'],
    baseLayer: ['core', 'baseLayer'],
    overlayOpacity: ['core', 'overlayOpacity'],
    isMapBoundariesEnabled: ['core', 'isMapBoundariesEnabled'],
    isDoubleClickZoomEnabled: ['core', 'isDoubleClickZoomEnabled'],
    isCoordsOnClickEnabled: ['core', 'isCoordsOnClickEnabled'],
    isRightClickEnabled: ['core', 'isRightClickEnabled'],
    overrideBrowserSearch: ['core', 'overrideBrowserSearch'],
    activeSideMenuTab: ['core', 'activeSideMenuTab'],
    markerColor: ['collectors', 'markerColor'],
    markerSize: ['collectors', 'markerSize'],
    markerOpacity: ['collectors', 'markerOpacity'],
    isShadowsEnabled: ['collectors', 'isShadowsEnabled'],
    isInvisibleRemovedMarkers: ['collectors', 'isInvisibleRemovedMarkers'],
    isMarkerClusterEnabled: ['collectors', 'isMarkerClusterEnabled'],
    isPopupsEnabled: ['collectors', 'isPopupsEnabled'],
    isPopupsHoverEnabled: ['collectors', 'isPopupsHoverEnabled'],
    showTooltipsMap: ['collectors', 'showTooltipsMap'],
    toolType: ['collectors', 'toolType'],
    filterType: ['collectors', 'filterType'],
    showAllMarkers: ['collectors', 'showAllMarkers'],
    showWeeklySettings: ['collectors', 'showWeeklySettings'],
    sortItemsAlphabetically: ['collectors', 'sortItemsAlphabetically'],
    isCyclesVisible: ['collectors', 'isCyclesVisible'],
    isCycleInputEnabled: ['collectors', 'isCycleInputEnabled'],
    isCycleChangerEnabled: ['collectors', 'isCycleChangerEnabled'],
    isPinsPlacingEnabled: ['pins', 'placingEnabled'],
    isPinsEditingEnabled: ['pins', 'editingEnabled'],
};

function migrateV3(raw: Record<string, unknown>): SettingsData {
    const result = JSON.parse(JSON.stringify(DEFAULTS)) as SettingsData;
    for (const [flatKey, [ns, key]] of Object.entries(FLAT_TO_NAMESPACED)) {
        if (flatKey in raw) {
            (result[ns as SettingsNamespace] as Record<string, unknown>)[key] = raw[flatKey];
        }
    }
    return result;
}

function mergeWithDefaults(persisted: Partial<SettingsData> | undefined): SettingsData {
    const out: Record<string, Record<string, unknown>> = {};
    for (const ns of Object.keys(SCHEMA) as Array<SettingsNamespace>) {
        out[ns] = { ...DEFAULTS[ns], ...(persisted?.[ns] ?? {}) };
    }
    return out as SettingsData;
}

interface StoreState extends SettingsData {
    setValue: <NS extends SettingsNamespace, K extends keyof SettingsData[NS]>(
        ns: NS, key: K, value: SettingsData[NS][K],
    ) => void;
    setSetting: <NS extends SettingsNamespace>(ns: NS, partial: Partial<SettingsData[NS]>) => void;
    reset: () => void;
    snapshot: () => SettingsData;
}

export const useSettings = create<StoreState>()(
    subscribeWithSelector(
        persist(
            (set, get) => ({
                ...DEFAULTS,

                setValue: (ns, key, value) => {
                    const path = `${String(ns)}.${String(key)}`;
                    const old = (get()[ns] as Record<string, unknown>)[key as string];
                    if (old === value) {
                        return;
                    }
                    set((s) => ({ [ns]: { ...s[ns], [key]: value } }) as Partial<StoreState>);
                    CHANGE_HANDLERS[path]?.(value);
                    if (isRecomputePath(String(ns), String(key))) {
                        triggerRecompute();
                    }
                },

                setSetting: (ns, partial) => {
                    const prev = get()[ns] as Record<string, unknown>;
                    set((s) => ({ [ns]: { ...s[ns], ...partial } }) as Partial<StoreState>);
                    for (const key of Object.keys(partial)) {
                        const path = `${String(ns)}.${key}`;
                        const newValue = (partial as Record<string, unknown>)[key];
                        if (prev[key] !== newValue) {
                            CHANGE_HANDLERS[path]?.(newValue);
                            if (isRecomputePath(String(ns), key)) {
                                triggerRecompute();
                            }
                        }
                    }
                },

                reset: () => set(JSON.parse(JSON.stringify(DEFAULTS)) as Partial<StoreState>),

                snapshot: () => {
                    const s = get();
                    const out = {} as SettingsData;
                    for (const ns of Object.keys(SCHEMA) as Array<SettingsNamespace>) {
                        (out as Record<string, unknown>)[ns] = (s as unknown as Record<string, unknown>)[ns];
                    }
                    return out;
                },
            }),
            {
                name: 'rdr2collector',
                storage: createJSONStorage(() => localStorage),
                version: 3,
                migrate: (state, version) => {
                    const raw = state as Record<string, unknown>;
                    return version < 3 ? migrateV3(raw) : mergeWithDefaults(raw as Partial<SettingsData>);
                },
                merge: (persisted, current) => ({
                    ...current,
                    ...mergeWithDefaults(persisted as Partial<SettingsData>),
                }),
            },
        ),
    ),
);

export function useSetting<NS extends SettingsNamespace, K extends keyof SettingsData[NS]>(
    ns: NS, key: K,
): SettingsData[NS][K] {
    return useSettings((s) => s[ns][key]);
}

export function useNamespace<NS extends SettingsNamespace>(ns: NS): SettingsData[NS] {
    return useSettings((s) => s[ns]);
}
