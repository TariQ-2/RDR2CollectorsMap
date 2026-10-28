import type { MarkerCategory } from '@/types/marker';
import type { SearchItem, CoreDefinition, CoreGroup } from './types';
export type { SearchItem, CoreDefinition, CoreGroup, CoreId, CoreVisibilityContext } from './types';

const registry = new Map<string, CoreDefinition>();
const order: Array<string> = [];

export function registerCore(def: CoreDefinition): void {
    if (registry.has(def.id)) {
        return;
    };

    registry.set(def.id, def);
    order.push(def.id);
}

export const getCore = (id: string): CoreDefinition | undefined => registry.get(id);
export const listCores = (): Array<CoreDefinition> => order.map((id) => registry.get(id)!);

function categoriesOfCore(id: string): Array<MarkerCategory> {
    const sys = registry.get(id);
    return sys ? [...sys.categories, ...sys.utilityCategories] : [];
}

export const allCoreCategories = (): Array<MarkerCategory> => order.flatMap(categoriesOfCore);

export function coreOfCategory(cat: MarkerCategory): string | undefined {
    for (const id of order) {
        const sys = registry.get(id)!;
        if (sys.categories.includes(cat) || sys.utilityCategories.includes(cat)) {
            return id;
        }
    }
    return undefined;
}

export function allCoreGroups(): Array<CoreGroup> {
    const out: Array<CoreGroup> = [];
    for (const id of order) {
        const sys = registry.get(id)!;
        if (sys.groups) {
            out.push(...sys.groups);
        };
    }
    return out;
}

export function getCoreGroup(groupId: string): CoreGroup | undefined {
    for (const id of order) {
        const sys = registry.get(id)!;
        const g = sys.groups?.find((gr) => gr.id === groupId);
        if (g) {
            return g;
        }
    }
    return undefined;
}

let _ready = false;
export async function bootCores(): Promise<void> {
    if (_ready) {
        return;
    }
    await Promise.all(
        listCores().map(async (s) => {
            try {
                await s.onLoad?.(); 
            } catch (e) {
                console.error(`[core:${s.id}]`, e); 
            }
        }),
    );
    _ready = true;
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('cores:ready'));
    }
}

export function collectSearchItems(): Array<SearchItem> {
    const items: Array<SearchItem> = [];
    for (const id of order) {
        const sys = registry.get(id)!;
        if (!sys.search) {
            continue;
        }
        try {
            items.push(...sys.search.items());
        } catch (e) {
            console.error(`[core:${id}] search.items() failed`, e);
        }
    }
    return items;
}
