import type { MarkerCategory } from "@/types/marker";

export interface CollectibleSubCategory {
    id: MarkerCategory;
    labelKey: string;
    icon: string;
}

export interface CollectibleGroup {
    id: string;
    subCategories: ReadonlyArray<CollectibleSubCategory>;
}

export const RANDOM_CATEGORIES: ReadonlySet<string> = new Set([
    "arrowhead",
    "coin",
    "coastal",
    "oceanic",
    "megafauna",
    "bracelet",
    "earring",
    "necklace",
    "ring",
    "jewelry_random",
    "fossils_random",
    "random",
]);

export const CATEGORY_VALUES: Record<string, number> = {
    coastal: 217.0,
    oceanic: 288.5,
    megafauna: 321.0,
    flower: 155.5,
    cups: 240.5,
    swords: 286.5,
    wands: 239.0,
    pentacles: 287.0,
    bracelet: 271.5,
    earring: 364.5,
    necklace: 335.0,
    ring: 378.0,
    bottle: 160.5,
    egg: 182.5,
    arrowhead: 289.0,
    heirlooms: 292.5,
    coin: 540.0,
};

export const COLLECTIBLE_GROUPS: ReadonlyArray<CollectibleGroup> = [
    {
        id: "fossils",
        subCategories: [
            { id: "coastal",    labelKey: "collectables.menu.fossil.coastal",   icon: "coastal" },
            { id: "oceanic",    labelKey: "collectables.menu.fossil.oceanic",   icon: "oceanic" },
            { id: "megafauna",  labelKey: "collectables.menu.fossil.megafauna", icon: "megafauna" },
        ],
    },
    {
        id: "tarot_cards",
        subCategories: [
            { id: "cups",       labelKey: "collectables.menu.cups",         icon: "cups" },
            { id: "swords",     labelKey: "collectables.menu.swords",       icon: "swords" },
            { id: "wands",      labelKey: "collectables.menu.wands",        icon: "wands" },
            { id: "pentacles",  labelKey: "collectables.menu.pentacles",    icon: "pentacles" },
        ],
    },
    {
        id: "lost_jewelry",
        subCategories: [
            { id: "bracelet",   labelKey: "collectables.menu.jewelry.bracelet", icon: "bracelet" },
            { id: "earring",    labelKey: "collectables.menu.jewelry.earring",  icon: "earring" },
            { id: "necklace",   labelKey: "collectables.menu.jewelry.necklace", icon: "necklace" },
            { id: "ring",       labelKey: "collectables.menu.jewelry.ring",     icon: "ring" },
        ],
    },
    {
        id: "flower",
        subCategories: [
            { id: "flower", labelKey: "collectables.menu.flower", icon: "flower" },
        ],
    },
    {
        id: "bottle",
        subCategories: [
            { id: "bottle", labelKey: "collectables.menu.bottle", icon: "bottle" },
        ],
    },
    {
        id: "egg",
        subCategories: [
            { id: "egg", labelKey: "collectables.menu.egg", icon: "egg" },
        ],
    },
    {
        id: "arrowhead",
        subCategories: [
            { id: "arrowhead", labelKey: "collectables.menu.arrowhead", icon: "arrowhead" },
        ],
    },
    {
        id: "heirlooms",
        subCategories: [
            { id: "heirlooms", labelKey: "collectables.menu.heirlooms", icon: "heirlooms" },
        ],
    },
    {
        id: "coin",
        subCategories: [
            { id: "coin", labelKey: "collectables.menu.coin", icon: "coin" },
        ],
    },
    {
        id: "random",
        subCategories: [
            { id: "random", labelKey: "collectables.menu.randomSpots", icon: "random" },
        ],
    },
] as const;
