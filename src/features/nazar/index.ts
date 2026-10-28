// src/features/nazar/index.ts
'use client';

import { create } from 'zustand';
import { loadJson } from '@/lib/api/loader';

export interface NazarLocation {
    key: string;
    x: number;
    y: number;
    id: string;
}

export const NAZAR_LOCATIONS: ReadonlyArray<NazarLocation> = [
    { key: 'MPSW_LOCATION_00', x: -123.9039, y: 34.8213, id: 'rio' },
    { key: 'MPSW_LOCATION_01', x: -100.0742, y: 49.0765, id: 'cho' },
    { key: 'MPSW_LOCATION_02', x: -104.7679, y: 85.7222, id: 'hen' },
    { key: 'MPSW_LOCATION_03', x: -84.2973, y: 82.4512, id: 'tal' },
    { key: 'MPSW_LOCATION_04', x: -56.1619, y: 78.5, id: 'bgv' },
    { key: 'MPSW_LOCATION_05', x: -60.9622, y: 130.6067, id: 'hrt_e' },
    { key: 'MPSW_LOCATION_06', x: -63.8927, y: 105.3496, id: 'hrt_w' },
    { key: 'MPSW_LOCATION_07', x: -43.1046, y: 132.8263, id: 'grz' },
    { key: 'MPSW_LOCATION_08', x: -90.0802, y: 135.6969, id: 'scm' },
    { key: 'MPSW_LOCATION_09', x: -65.9688, y: 150.4468, id: 'blu' },
    { key: 'MPSW_LOCATION_10', x: -40.7817, y: 109.4863, id: 'der' },
    { key: 'MPSW_LOCATION_11', x: -36.5097, y: 154.1859, id: 'bbr' },
];

interface NazarFile {
    location: number | null;
    date: string | null;
}

export interface NazarState {
    possibleLocations: ReadonlyArray<NazarLocation>;
    currentLocation: number | null;
    currentDate: string | null;
    isLoading: boolean;
    error: Error | null;
    load: () => Promise<void>;
}

let inFlight: Promise<void> | null = null;

export const useNazar = create<NazarState>()((set, get) => ({
    possibleLocations: NAZAR_LOCATIONS,
    currentLocation: null,
    currentDate: null,
    isLoading: false,
    error: null,

    load: async () => {
        if (inFlight) {
            await inFlight;
            return;
        }
        if (get().currentLocation != null) {
            return;
        }

        const run = (async () => {
            set({ isLoading: true, error: null });
            try {
                const data = await loadJson<NazarFile>('nazar');
                set({
                    currentLocation: data.location,
                    currentDate: data.date,
                    isLoading: false,
                });
            } catch (err) {
                console.error('[Nazar] load failed', err);
                set({
                    isLoading: false,
                    error: err instanceof Error ? err : new Error('load failed'),
                });
            }
        })();

        inFlight = run;
        try {
            await run;
        } finally {
            inFlight = null;
        }
    },
}));

/* Debug handle */
if (typeof window !== 'undefined') {
    (window as unknown as { __nazar: unknown }).__nazar = useNazar;
}
