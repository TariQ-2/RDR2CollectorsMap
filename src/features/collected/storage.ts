const COLLECTED_PREFIX = 'rdr2collector.collected.';
const IMPORTANT_PREFIX = 'rdr2collector.important.';

export function readCollectedSet(): Set<string> {
    const set = new Set<string>();
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(COLLECTED_PREFIX)) {
                set.add(key.slice(COLLECTED_PREFIX.length));
            };
        };
    } catch { /* ignore */ }
    return set;
}

export function writeCollected(text: string, isCollected: boolean): void {
    try {
        if (isCollected) {
            localStorage.setItem(COLLECTED_PREFIX + text, String(Date.now()));
        } else {
            localStorage.removeItem(COLLECTED_PREFIX + text);
        };
    } catch { /* ignore */ }
}

export function clearCollected(texts: Iterable<string>): void {
    try {
        for (const text of texts) {
            localStorage.removeItem(COLLECTED_PREFIX + text);
        };
    } catch { /* ignore */ }
}

export function clearAllCollected(): void {
    try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key?.startsWith(COLLECTED_PREFIX)) {
                localStorage.removeItem(key);
            };
        }
    } catch { /* ignore */ }
}

export function readCollectedTimestamp(text: string): number | null {
    try {
        const raw = localStorage.getItem(COLLECTED_PREFIX + text);
        if (!raw || raw === 'true') {
            return null;
        };

        const ts = Number(raw);
        return Number.isFinite(ts) ? ts : null;
    } catch {
        return null;
    }
}

export function readImportantSet(): Set<string> {
    const set = new Set<string>();
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(IMPORTANT_PREFIX)) {
                set.add(key.slice(IMPORTANT_PREFIX.length));
            };
        }
    } catch { /* ignore */ }
    return set;
}

export function writeImportant(itemId: string, isImportant: boolean): void {
    try {
        const key = IMPORTANT_PREFIX + itemId;
        if (isImportant) {
            localStorage.setItem(key, 'true');
        } else {
            localStorage.removeItem(key);
        };
    } catch { /* ignore */ }
}

export function clearAllImportant(): void {
    try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key?.startsWith(IMPORTANT_PREFIX)) {
                localStorage.removeItem(key);
            };
        }
    } catch { /* ignore */ }
}

export const LEGACY = {
    IMPORTANT_ITEMS_KEY: 'importantItems',
} as const;
