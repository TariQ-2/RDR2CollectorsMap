
export interface TreasureLocation {
    x: number;
    y: number;
}

export interface TreasureData {
    id: string;
    label: string;
    center: TreasureLocation;
    radius: number;
    locations: Array<TreasureLocation>;
}

export interface TreasuresFile {
    version: number;
    treasures: Array<TreasureData>;
}

export interface TreasuresState {
    treasures: Array<TreasureData>;
    shownIds: Array<string>;
    isLoading: boolean;
    error: Error | null;
    _loaded: boolean;

    load: () => Promise<void>;
    setShown: (id: string, shown: boolean) => void;
    toggleShown: (id: string) => void;
    showAll: (show: boolean) => void;
    clearAll: () => void;
    importShown: (ids: Array<string>) => void;
    exportShown: () => Array<string>;
    reset: () => void;
}
