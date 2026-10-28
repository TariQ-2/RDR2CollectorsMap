export interface CollectedState {
    collectedTexts: Set<string>;
    importantItemIds: Set<string>;

    toggle: (text: string) => boolean;
    toggleBatch: (texts: Array<string>) => Array<{ text: string; isCollected: boolean }>;
    mark: (text: string) => void;

    setImportant: (itemId: string, isImportant: boolean) => void;
    toggleImportant: (itemId: string) => boolean;
    clearImportant: () => void;
    convertLegacyImportant: (allItemIds: Array<string>) => void;

    reset: (texts: Iterable<string>) => void;
    resetAll: () => void;
    getTimestamp: (text: string) => number | null;
}
