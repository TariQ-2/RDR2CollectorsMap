'use client';

import { create } from 'zustand';
import { loadJson } from '@/lib/api/loader';
import type { OverlayData } from '@/types/marker';

export interface OverlaysState {
    overlays: Record<string, OverlayData>;
    load: () => Promise<void>;
}

export const useOverlays = create<OverlaysState>()((set) => ({
    overlays: {},
    load: async () => {
        const overlays = await loadJson<Record<string, OverlayData>>('overlays');
        set({ overlays });
    },
}));
