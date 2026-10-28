'use client';
import { create } from 'zustand';

export type CustomColors = Record<string, string>;

const KEY = 'rdr2collector.customMarkersColors';
const LEGACY_KEY = 'customMarkersColors';
const CATEGORIES_KEY = 'rdr2collector.__categories';

function readInitial(): CustomColors {
    if (typeof window === 'undefined') {
        return {};
    }
    try {
        const stored = localStorage.getItem(KEY) ?? localStorage.getItem(LEGACY_KEY);
        return stored ? (JSON.parse(stored) as CustomColors) : {};
    } catch {
        return {};
    }
}

export function collectCustomColorCategories(): Array<string> {
    const categories = new Set<string>();

    try {
        const markers = JSON.parse(localStorage.getItem(CATEGORIES_KEY) ?? '[]');
        markers.forEach((c: string) => categories.add(c));
    } catch { /* ignore */ }

    const FALLBACK_CATEGORIES = [
        'arrowhead', 'bottle', 'coin', 'egg', 'flower',
        'fossils_random', 'jewelry_random', 'random',
        'bracelet', 'earring', 'necklace', 'ring',
        'cups', 'swords', 'wands', 'pentacles',
        'heirlooms',
    ];
    FALLBACK_CATEGORIES.forEach((c) => categories.add(c));

    return Array.from(categories);
}

interface CustomColorsState {
    colors: CustomColors;
    setColors: (colors: CustomColors) => void;
    reset: () => void;
}

export const useCustomColors = create<CustomColorsState>()((set) => ({
    colors: readInitial(),
    setColors: (colors) => {
        try {
            localStorage.setItem(KEY, JSON.stringify(colors));
        } catch { /* ignore quota errors */ }
        set({ colors });
    },
    reset: () => {
        try {
            localStorage.removeItem(KEY);
            localStorage.removeItem(LEGACY_KEY);
        } catch { /* ignore */ }
        set({ colors: {} });
    },
}));

export function applyCustomColors(colors: CustomColors): void {
    useCustomColors.getState().setColors(colors);
}
