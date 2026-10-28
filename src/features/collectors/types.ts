
export interface ItemModel {
    itemId: string;
    price: number;
    enumHash: number;
    icon?: string;
    category: string;
    amount: number;
    displayName?: string;
    tool?: number;
}

export interface CollectionModel {
    category: string;
    price: number;
    items: Array<ItemModel>;
}

export interface ItemsValueEntry {
    category: string;
    price: number;
    itemsList: Array<{ itemId: string; price: number; enumHash: number }>;
}

export interface WeeklySet {
    id: string;
    value: number;
    items: Array<string>;
}

export interface WeeklySetItem {
    itemId: string;
    name: string;
    icon: string;
    category: string;
}

export interface CollectionsState {
    collections: Array<CollectionModel>;
    itemsById: Record<string, ItemModel>;
    jewelryTimestamps: Record<string, unknown>;
}

export interface WeeklyState {
    currentId: string | null;
    sets: Record<string, { id: string; value: number; items: Array<string> }>;
    items: Array<{ itemId: string; name: string; icon: string; category: string }>;
    value: number;
    isLoading: boolean;
    error: Error | null;
    load: () => Promise<void>;
}
