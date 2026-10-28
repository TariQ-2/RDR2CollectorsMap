import type { FiltersData } from '@/types/marker';

export function flattenFilterData(filtersData: FiltersData, key: string): Array<string> {
    return ([] as Array<string>).concat(...Object.values(filtersData[key] ?? {}));
}
