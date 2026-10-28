export const LEGACY_SHOWN_PREFIX = 'rdr2collector.shown.';
export const PERSIST_KEY = 'rdo-treasures';

export function readLegacyShownTexts(): Array<string> {
    const texts: Array<string> = [];
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(LEGACY_SHOWN_PREFIX)) {
                texts.push(key.slice(LEGACY_SHOWN_PREFIX.length));
            }
        }
    } catch { /* ignore */ }
    return texts;
}

export function clearLegacyShownKeys(texts: Iterable<string>): void {
    try {
        for (const text of texts) {
            localStorage.removeItem(LEGACY_SHOWN_PREFIX + text);
        }
    } catch { /* ignore */ }
}
