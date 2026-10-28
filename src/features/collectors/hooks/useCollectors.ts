'use client';

import { useRef, useSyncExternalStore } from 'react';
import { collectorsService } from '@/features/collectors';
import type { CollectionsState } from '@/features/collectors/types';

export function useCollectors<T>(selector: (s: CollectionsState) => T): T {
    const cacheRef = useRef<{ version: number; selector: typeof selector; value: T } | null>(null);

    const getSnapshot = (): T => {
        const version = collectorsService._snapshotVersion;
        const cache = cacheRef.current;
        if (cache && cache.version === version && cache.selector === selector) {
            return cache.value;
        }
        const value = selector(collectorsService.snapshot());
        cacheRef.current = { version, selector, value };
        return value;
    };

    return useSyncExternalStore(
        collectorsService._subscribe,
        getSnapshot,
        getSnapshot,
    );
}
