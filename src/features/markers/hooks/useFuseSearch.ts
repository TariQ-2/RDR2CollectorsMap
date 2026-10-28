'use client';

import Fuse from 'fuse.js';
import { startTransition, useEffect, useMemo } from 'react';
import { useMarkers } from '@/features/markers';
import { useTranslate } from '@/i18n';
import { useTreasures } from '@/features/treasures';
import { collectSearchItems } from '@/features/core';
import type { SearchItem } from '@/features/core';
import type { MarkerData } from '@/types/marker';

function normalize(s: string): string {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function parseTerms(query: string): Array<string> {
    const cleaned = query.replace(/^[;\s]+|[;\s]+$/g, '');
    if (!cleaned) {
        return [];
    }
    return [
        ...new Set(
            cleaned.split(';').map((t) => normalize(t.trim())).filter(Boolean),
        ),
    ];
}

export interface IndexedSearchItem extends SearchItem {
    searchText: string;
}

function buildIndex(items: Array<SearchItem>): Array<IndexedSearchItem> {
    return items.map((it) => ({
        ...it,
        searchText: [normalize(it.label), ...it.keywords.map(normalize)].join(' '),
    }));
}

function createFuse(index: Array<IndexedSearchItem>) {
    return new Fuse(index, {
        keys: [{ name: 'searchText', weight: 1 }],
        threshold: 0.4,
        ignoreLocation: true,
    });
}

export function useFuseSearch() {
    const allMarkersRaw = useMarkers((s) => s.allMarkers);
    const allMarkers = useMemo(() => allMarkersRaw ?? [], [allMarkersRaw]);

    const searchQuery = useMarkers((s) => s.searchQuery) ?? '';
    const setSearchResults = useMarkers((s) => s.setSearchResults);
    const treasures = useTreasures((s) => s.treasures);
    const t = useTranslate();

    const fuse = useMemo(() => {
        void treasures;
        const markerItems: Array<SearchItem> = allMarkers.map((m) => ({
            id: m.markerId,
            label: `${t(m.itemId)} ${m.itemNumberStr}`.trim(),
            keywords: [m.itemId, m.itemNumberStr].filter(Boolean),
            onSelect: () => {},
        }));
        const systemItems = collectSearchItems();
        return createFuse(buildIndex([...markerItems, ...systemItems]));
    }, [allMarkers, treasures, t]);

    useEffect(() => {
        if (!setSearchResults) {
            return;
        }

        const terms = parseTerms(searchQuery);
        if (terms.length === 0) {
            setSearchResults(null);
            return;
        }

        const matchedMarkerIds = new Set<string>();

        const markersById = new Map<string, MarkerData>();
        for (const m of allMarkers) {
            markersById.set(m.markerId, m);
        }

        for (const term of terms) {
            let hasExact = false;

            for (const m of allMarkers) {
                const translated = normalize(t(m.itemId));
                if (
                    m.itemId === term ||
                    m.itemNumberStr === term ||
                    translated.includes(term)
                ) {
                    matchedMarkerIds.add(m.markerId);
                    hasExact = true;
                }
            }

            if (!hasExact) {
                const best = fuse.search(term)[0];
                if (best) {
                    const matched = markersById.get(best.item.id);
                    if (matched) {
                        for (const m of allMarkers) {
                            if (m.itemId === matched.itemId) {
                                matchedMarkerIds.add(m.markerId);
                            }
                        }
                    }
                }
            }
        }

        const result = allMarkers.filter((m) => matchedMarkerIds.has(m.markerId));

        startTransition(() => {
            setSearchResults(result);
        });
    }, [searchQuery, fuse, allMarkers, t, setSearchResults]);

    return fuse;
}
