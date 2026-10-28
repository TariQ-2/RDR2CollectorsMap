import { loadJson } from '@/lib/api/loader';
import { openModal } from '@/lib/modal-bridge';

export interface MappingPreliminary {
    key: string;
    value: string;
}

function migrateLegacyKeys(entries: ReadonlyArray<MappingPreliminary>): void {
    for (const { key, value } of entries) {
        const amount = localStorage.getItem(`amount.${value}`);
        const collected = localStorage.getItem(`collected.${value}`);

        if (amount != null) {
            localStorage.setItem(`rdr2collector.amount.${key}`, amount);
            localStorage.removeItem(`amount.${value}`);
        }
        if (collected != null) {
            localStorage.setItem(`rdr2collector.collected.${key}`, collected);
            localStorage.removeItem(`collected.${value}`);
        }
    }
}

export class Mapping {
    static mapping: Array<MappingPreliminary> = [];

    static async init(): Promise<void> {
        const data = await loadJson<Array<MappingPreliminary>>('mapping');
        Mapping.mapping = data;
        migrateLegacyKeys(data);
        console.info('%c[Mapping] Loaded!', 'color: #bada55; background: #242424');
    }

    static showModal(): void {
        openModal('mapping-modal');
    }
}

if (typeof window !== 'undefined') {
    (window as unknown as { Mapping: typeof Mapping }).Mapping = Mapping;
}
