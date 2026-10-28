import { getNocacheParam } from '@/lib/api/nocache';

const URLS = {
    cycles: '/RDR2CollectorsMap/data/cycles.json',
    fasttravels: '/RDR2CollectorsMap/data/fasttravels.json',
    filters: '/RDR2CollectorsMap/data/filters.json',
    items_value: '/RDR2CollectorsMap/data/items_value.json',
    items: '/RDR2CollectorsMap/data/items.json',
    lang_progress: '/RDR2CollectorsMap/data/lang_progress.json',
    loot: '/RDR2CollectorsMap/data/loot.json',
    mapping: '/RDR2CollectorsMap/data/mapping.json',
    overlays: '/RDR2CollectorsMap/data/overlays.json',
    treasures: '/RDR2CollectorsMap/data/treasures.json',
    weekly_sets: '/RDR2CollectorsMap/data/weekly_sets.json',
    nazar: '/RDR2CollectorsMap/data/nazar.json',
    weekly: '/RDR2CollectorsMap/data/weekly.json',
    jewelry_timestamps: '/RDR2CollectorsMap/data/jewelry_timestamps.json',
} as const;

export type LoaderKey = keyof typeof URLS;
const cache = new Map<LoaderKey, Promise<unknown>>();

function buildUrl(key: LoaderKey): string {
    const url = URLS[key];
    const params = new URLSearchParams();

    // if (key === 'updates') {
    //     params.set('nocache', Date.now().toString());
    // }

    if (!url.startsWith('http')) {
        params.set('nocache', getNocacheParam());
    } else {
        params.set('nocache', new Date(Date.now() - 21600000).toISOString().split('T')[0]);
    };

    if (['cycles', 'lang_progress'].includes(key)) {
        params.set('date', new Date().toISOString().split('T')[0]);
    };

    return `${url}?${params.toString()}`;
}

export function loadJson<T = unknown>(key: LoaderKey): Promise<T> {
    if (cache.has(key)) {
        return cache.get(key) as Promise<T>;
    };

    const promise = fetch(buildUrl(key)).then((res) => {
        if (!res.ok) {
            throw new Error(`${res.status} ${res.statusText} on ${res.url}`);
        };
        return res.json() as Promise<T>;
    }).finally(() => {
        setTimeout(() => cache.delete(key), 0);
    });

    cache.set(key, promise);
    return promise;
};

export function reloadJson<T = unknown>(key: LoaderKey): Promise<T> {
    cache.delete(key);
    return loadJson<T>(key);
}
