export interface CycleData {
    date: string;
    arrowhead: number;
    bottle: number;
    coin: number;
    egg: number;
    flower: number;
    heirlooms: number;
    lost_jewelry: number;
    random: number;
    tarot_cards: number;
    fossils: number;
}

export interface CyclesState {
    data: Array<CycleData>;
    dateIndex: Map<string, number>;
    categories: Record<string, number>;
    yesterday: CycleData | null;
    selectedDay: Date | null;
    localeDate: string | null;

    load: () => Promise<void>;
    getTodayCycle: () => void;
    setLocaleDate: () => void;
    setCustomCycles: () => void;
    getInGameCycle: (category: string) => Record<string, number> | Array<number>;
    getCycleColor: (cycle: number) => string;
    getCyclesMainCategory: (category: string) => string;
}
