import type { FiltersData, MarkerCategory, MarkerData } from '@/types/marker';

export type CoreId = string;
export interface SearchItem {
    id: string;
    label: string;
    keywords: Array<string>;
    group?: string;
    onSelect: () => void;
}

export interface CoreSearchProvider {
    items: () => Array<SearchItem>;
}

export interface CoreGroup {
    readonly id: string;
    readonly labelKey: string;
    readonly categories?: ReadonlyArray<MarkerCategory>;
}

export interface CoreVisibilityContext {
    enabled: ReadonlySet<MarkerCategory>;
    allMarkers: ReadonlyArray<MarkerData>;
    filtersData: FiltersData;
}

export interface CoreDefinition {
    readonly id: CoreId;
    readonly labelKey: string;
    readonly icon?: string;
    readonly categories: ReadonlyArray<MarkerCategory>;
    readonly utilityCategories: ReadonlyArray<MarkerCategory>;
    readonly groups?: ReadonlyArray<CoreGroup>;
    readonly filterIds: ReadonlyArray<string>;
    readonly search?: CoreSearchProvider;
    readonly isVisible?: (marker: MarkerData, ctx: CoreVisibilityContext) => boolean;
    readonly visibleByText?: () => ReadonlySet<string> | null;

    readonly onLoad?: () => void | Promise<void>;}
