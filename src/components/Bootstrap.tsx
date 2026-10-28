'use client';
import { useEffect, useRef } from 'react';
import { useSettings } from '@/features/settings';
import { useMarkers } from '@/features/markers';
import { useCycles } from '@/features/cycles';
import { useOverlays } from '@/features/overlays';
import { Mapping } from '@/features/markers/mapping';
import '@/features/core/setup';
import '@/features/inventory';
import { bootCores } from '@/features/core';

import { normalizeLanguage } from '@/i18n/languages';
import { ensureUiLocale } from '@/i18n/load-locale';

export function Bootstrap() {
    const language = useSettings((s) => s.core.language);
    const loadMarkers = useMarkers((s) => s.loadAll);
    const loadCycles = useCycles((s) => s.load);
    const loadOverlays = useOverlays((s) => s.load);
    const bootstrappedRef = useRef(false);

    useEffect(() => {
        const lang = normalizeLanguage(language);
        if (lang !== "en") {
            void ensureUiLocale(lang);
        }
    }, [language]);

    useEffect(() => {
        if (bootstrappedRef.current) {
            return;
        };

        bootstrappedRef.current = true;
        (async () => {
            try {
                await Mapping.init();
                await bootCores();
                await Promise.all([loadCycles(), loadOverlays()]);
                await loadMarkers();
            } catch (err) {
                console.error('Bootstrap failed:', err);
            }
        })();
    }, [loadCycles, loadMarkers, loadOverlays]);

    return null;
}
