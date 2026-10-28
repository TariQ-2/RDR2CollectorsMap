import type { CoreId } from "@/features/core";

// src/types/marker.ts
export type MarkerCategory =
  | 'arrowhead' | 'bottle' | 'coin' | 'egg' | 'flower'
  | 'fossils_random' | 'jewelry_random' | 'random'
  | 'bracelet' | 'earring' | 'necklace' | 'ring'
  | 'cups' | 'swords' | 'wands' | 'pentacles'
  | 'heirlooms' | 'fast_travel' | 'weekly'
  | 'coastal' | 'oceanic' | 'megafauna'
  | 'nazar' | 'collections' | 'treasure' | 'user_pins';

export type ToolType = -2 | -1 | 0 | 1 | 2;
export type ToolFilter = ToolType | 3;

export interface PreliminaryMarker {
  text: string;
  lat: number;
  lng: number;
  tool: ToolType;
  height?: 0 | 1 | -1;
  buggy?: boolean;
  video?: string;
  video_en?: string;
  video_de?: string;
  video_fr?: string;
  type?: 'chest' | 'metal_detector' | string;
}

export interface MarkerData extends PreliminaryMarker {
  coreId: CoreId;
  itemId: string;
  itemNumber: number;
  itemNumberStr: string;
//   itemTranslationKey: string;
  cycleName: string;
  markerId: string;
  category: MarkerCategory;
  subdata?: string;
  legacyItemId: string;
  primaryDescriptionKey: string;
  secondaryDescriptionKey: string;
  lootTable: string;
  possibleItems?: Array<string>;

  // حالة
  isCollected: boolean;
  isVisible: boolean;
  canCollect: boolean;
  isCurrent: boolean;
  isRandomizedItem: boolean;
  isImportant?: boolean;
}

export interface OverlayData {
  name?: string;
  lat?: number;
  lng?: number;
  width?: number;
  height?: number;
  bounds?: [[number, number], [number, number]];
}

export interface FastTravelPoint {
  x: number;
  y: number;
  text: string;
}

/** Legacy `MapBase.filtersData` (filters.json): role -> recipe -> itemId[]. */
export type FiltersData = Record<string, Record<string, Array<string>>>;

/** Legacy `MapBase.lootTables` (loot.json). */
export interface LootTables {
  categories: Record<string, Array<string>>;
  loot: Record<string, Record<string, unknown>>;
}
