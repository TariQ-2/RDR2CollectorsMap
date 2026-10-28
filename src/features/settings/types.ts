'use client';

import type { SCHEMA } from './schema';
import type { THEMES } from './themes';

type ExtractDefault<T> = T extends { default: infer D } ? D : never;

export type SettingsData = {
    [NS in keyof typeof SCHEMA]: {
        [K in keyof (typeof SCHEMA)[NS]]: ExtractDefault<(typeof SCHEMA)[NS][K]>;
    };
};

export type SettingsNamespace = keyof SettingsData;
export type CoreSettings = SettingsData['core'];
export type CollectorsSettings = SettingsData['collectors'];
export type TreasuresSettings = SettingsData['treasures'];
export type PinsSettings = SettingsData['pins'];

export type SideMenuTab = CoreSettings['activeSideMenuTab'];
export type BaseLayer = CoreSettings['baseLayer'];

export type ThemeScheme = 'dark' | 'light';

export interface ThemeDef {
    id: string;
    label: string;
    scheme: ThemeScheme;
}

export type ThemeId = (typeof THEMES)[number]['id'];

export interface SettingsState extends SettingsData {
    setValue: <NS extends SettingsNamespace, K extends keyof SettingsData[NS]>(
        ns: NS,
        key: K,
        value: SettingsData[NS][K],
    ) => void;
    setSetting: <NS extends SettingsNamespace>(
        ns: NS,
        partial: Partial<SettingsData[NS]>,
    ) => void;
    reset: () => void;
    snapshot: () => SettingsData;
}

export type TransferStatus = 'idle' | 'loading' | 'success' | 'error';
