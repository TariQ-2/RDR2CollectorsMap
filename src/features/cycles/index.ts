'use client';

import { create } from 'zustand';
import { loadJson } from '@/lib/api/loader';
import { CATEGORY_TO_MAIN, CYCLE_FALLBACK } from '@/data/categories';
import { useSettings } from '@/features/settings';
import type { CycleData, CyclesState } from './types';
export type { CycleData, CyclesState } from './types';

export const toDateStr = (d: Date): string => d.toISOString().split('T')[0];
export function getParameterByName(name: string): string | null {
    if (typeof window === 'undefined') {
        return null;
    };

    return new URLSearchParams(window.location.search).get(name);
}

const toCycle = (v: unknown, fallback = 1): number => typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 6 ? v : fallback;
export function buildCategories(data: CycleData): Record<string, number> {
    const tarot = toCycle(data.tarot_cards);
    const jewelry = toCycle(data.lost_jewelry);
    const fossils = toCycle(data.fossils);

    return {
        flower: toCycle(data.flower),
        cups: tarot,
        pentacles: tarot,
        swords: tarot,
        wands: tarot,
        jewelry_random: jewelry,
        bracelet: jewelry,
        earring: jewelry,
        necklace: jewelry,
        ring: jewelry,
        bottle: toCycle(data.bottle),
        egg: toCycle(data.egg),
        arrowhead: toCycle(data.arrowhead),
        heirlooms: toCycle(data.heirlooms),
        coin: toCycle(data.coin),
        fossils_random: fossils,
        coastal: fossils,
        oceanic: fossils,
        megafauna: fossils,
        random: toCycle(data.random),
    };
}

export const useCycles = create<CyclesState>()((set, get) => ({
    data: [],
    dateIndex: new Map(),
    categories: {},
    yesterday: null,
    selectedDay: null,
    localeDate: null,

    load: async () => {
        const data = await loadJson<Array<CycleData>>('cycles');
        const dateIndex = new Map<string, number>();
        for (let i = 0; i < data.length; i++) {
            dateIndex.set(data[i].date, i);
        }
        set({ data, dateIndex });
        get().getTodayCycle();
    },

    getTodayCycle: () => {
        const { data, dateIndex } = get();
        const now = new Date();
        const selectedDay = new Date(
            Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate(),
            ),
        );
        const dateStr = toDateStr(selectedDay);

        let cycle: CycleData;
        let yesterday: CycleData | null = null;

        const idx = dateIndex.get(dateStr);
        if (idx !== undefined) {
            cycle = data[idx];
            const yStr = toDateStr(
                new Date(selectedDay.getTime() - 86_400_000),
            );
            const yIdx = dateIndex.get(yStr);
            if (yIdx !== undefined) {
                yesterday = data[yIdx];
            }
        } else if (data.length > 0) {
            cycle = data[data.length - 1];
            yesterday = data.length >= 2 ? data[data.length - 2] : null;
        } else {
            cycle = { date: dateStr, ...CYCLE_FALLBACK };
        }

        set({
            categories: buildCategories(cycle),
            yesterday,
            selectedDay,
        });

        if (typeof window !== 'undefined') {
            if (idx === undefined || idx === 0) {
                window.dispatchEvent(new Event('cycleNotFound'));
            } else {
                window.dispatchEvent(new Event('cycleFound'));
            }
        }

        get().setLocaleDate();
        get().setCustomCycles();
    },

    setLocaleDate: () => {
        const { selectedDay } = get();
        if (selectedDay == null) {
            return;
        }
        const language = useSettings.getState().core.language;
        set({
            localeDate: selectedDay.toLocaleString(language, {
                timeZone: 'UTC',
                month: 'long',
                day: 'numeric',
            }),
        });
    },

    setCustomCycles: () => {
        const param = getParameterByName('cycles');
        if (param == null) {
            return;
        }

        if (param.includes(',')) {
            const _cycles = param.split(',');
            if (_cycles.length === 9) {
                if (
                    _cycles.some((e) => isNaN(+e)) ||
                    _cycles.some((e) => +e < 1 || +e > 6)
                ) {
                    console.warn('Cycles parameters invalid for items.');
                } else {
                    const categories = { ...get().categories };
                    categories.flower = +_cycles[0];
                    categories.cups = +_cycles[1];
                    categories.pentacles = +_cycles[1];
                    categories.swords = +_cycles[1];
                    categories.wands = +_cycles[1];
                    categories.bracelet = +_cycles[2];
                    categories.earring = +_cycles[2];
                    categories.necklace = +_cycles[2];
                    categories.ring = +_cycles[2];
                    categories.bottle = +_cycles[3];
                    categories.egg = +_cycles[4];
                    categories.arrowhead = +_cycles[5];
                    categories.heirlooms = +_cycles[6];
                    categories.coin = +_cycles[7];
                    categories.random = +_cycles[8];
                    set({ categories });
                }
            } else {
                console.warn('Cycles parameters invalid for items.');
            }
        } else if (!isNaN(+param) && +param > 0 && +param < 7) {
            const categories = { ...get().categories };
            for (const key in categories) {
                if (Object.prototype.hasOwnProperty.call(categories, key)) {
                    categories[key] = +param;
                }
            }
            set({ categories });
        } else {
            console.warn('Cycles parameters invalid for items.');
        }
    },

    getInGameCycle: (category) => {
        let _cycles: Record<string, number> | Array<number> = [];

        switch (category) {
            case 'arrowhead':
            case 'bottle':
            case 'bracelet':
            case 'earring':
            case 'necklace':
            case 'ring':
                _cycles = { '2': 1, '3': 2, '1': 3, '6': 4, '4': 5, '5': 6 };
                break;
            case 'egg':
            case 'heirlooms':
                _cycles = { '2': 1, '3': 2, '1': 3, '6': 4, '5': 5, '4': 6 };
                break;
            case 'coin':
                _cycles = { '2': 1, '3': 2, '1': 3, '4': 4, '6': 5, '5': 6 };
                break;
            case 'cups':
            case 'pentacles':
            case 'swords':
            case 'wands':
            case 'flower':
                _cycles = { '2': 1, '3': 2, '1': 3, '4': 4, '5': 5, '6': 6 };
                break;
            case 'oceanic':
            case 'coastal':
            case 'megafauna':
                _cycles = { '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6 };
                break;
            default:
                console.error(`Category '${category}' invalid.`);
                break;
        }
        return _cycles;
    },

    getCycleColor: (cycle) => {
        let color = '';
        switch (cycle) {
            case 1:
                color = '#35a0d0';
                break;
            case 2:
                color = '#ef932f';
                break;
            case 3:
                color = '#c74db0';
                break;
            case 4:
                color = '#573767';
                break;
            case 5:
                color = '#993033';
                break;
            case 6:
                color = '#005f9a';
                break;
        }
        return color;
    },

    getCyclesMainCategory: (category) => CATEGORY_TO_MAIN(category),
}));

export const cycles = {
    load: () => useCycles.getState().load(),
    getTodayCycle: () => useCycles.getState().getTodayCycle(),
    snapshot: () => useCycles.getState(),
};
