import type { MarkerCategory } from '@/types/marker';

export const MAIN_CATEGORY: Record<string, string> = {
    cups: 'tarot_cards',
    pentacles: 'tarot_cards',
    swords: 'tarot_cards',
    wands: 'tarot_cards',
    bracelet: 'lost_jewelry',
    earring: 'lost_jewelry',
    necklace: 'lost_jewelry',
    ring: 'lost_jewelry',
    oceanic: 'fossils',
    coastal: 'fossils',
    megafauna: 'fossils',
} as const;

export const RANDOMIZED_CATEGORIES = new Set<MarkerCategory>([
    'arrowhead',
    'coin',
    'fossils_random',
    'jewelry_random',
    'random',
]);

export const CATEGORY_TO_MAIN = (cat: string): string =>
    MAIN_CATEGORY[cat] ?? cat;

export const CYCLE_FALLBACK = {
    arrowhead: 1,
    bottle: 1,
    coin: 1,
    egg: 1,
    flower: 1,
    heirlooms: 1,
    lost_jewelry: 1,
    random: 1,
    tarot_cards: 1,
    fossils: 1,
} as const;
