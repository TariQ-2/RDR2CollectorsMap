import type { FiltersData, MarkerCategory, MarkerData, PreliminaryMarker } from '@/types/marker';

export interface ItemsJson {
    [category: string]: {
        [cycleName: string]: Array<PreliminaryMarker>;
    };
}

export interface MarkersState {
    allMarkers: Array<MarkerData>;
    visibleMarkers: Array<MarkerData>;
    enabledCategories: Set<MarkerCategory>;
    searchQuery: string;
    searchResults: Array<MarkerData> | null;
    filtersData: FiltersData;
    focusedMarkerId: string | null;
    focusVersion: number;
    focusOn: { lat: number; lng: number } | null;
    focusOnVersion: number;
    isLoading: boolean;
    error: Error | null;
    _initialized: boolean;

    setFocusedMarker: (markerId: string | null) => void;
    setFocusOn: (coords: { lat: number; lng: number } | null) => void;
    toggleCategory: (cat: MarkerCategory) => void;
    setEnabledCategories: (cats: Array<MarkerCategory>) => void;
    setSearchQuery: (q: string) => void;
    setSearchResults: (r: Array<MarkerData> | null) => void;
    recomputeVisible: () => void;
    loadAll: () => Promise<void>;

    enable: {
        all: () => void;
        category: (cat: MarkerCategory) => void;
        categories: (cats: Array<MarkerCategory>) => void;
    };
    disable: {
        all: () => void;
        category: (cat: MarkerCategory) => void;
        categories: (cats: Array<MarkerCategory>) => void;
    };

    enableGroup: (groupId: string) => void;
    disableGroup: (groupId: string) => void;
    toggleGroup: (groupId: string) => void;
    isGroupEnabled: (groupId: string) => boolean;
    isGroupDisabled: (groupId: string) => boolean;
}
