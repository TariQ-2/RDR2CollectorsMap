export const MARKER_COLORS = [
    { name: 'aquagreen',    hex: '#00ffa2' },
    { name: 'beige',        hex: '#ffce70' },
    { name: 'black',        hex: '#292929' },
    { name: 'blue',         hex: '#31a6c7' },
    { name: 'brown',        hex: '#7C411E' },
    { name: 'cadetblue',    hex: '#416776' },
    { name: 'darkblue',     hex: '#0066a2' },
    { name: 'darkgreen',    hex: '#627134' },
    { name: 'darkorange',   hex: '#e27839' },
    { name: 'darkpurple',   hex: '#593769' },
    { name: 'darkred',      hex: '#a13235' },
    { name: 'gray',         hex: '#444444' },
    { name: 'green',        hex: '#70ae25' },
    { name: 'lightblue',    hex: '#88dbff' },
    { name: 'lightdarkred', hex: '#C23E3D' },
    { name: 'lightgray',    hex: '#5e5e5e' },
    { name: 'lightgreen',   hex: '#a3c62c' },
    { name: 'lightorange',  hex: '#ff8c7d' },
    { name: 'lightred',     hex: '#da4d6d' },
    { name: 'orange',       hex: '#ee9232' },
    { name: 'pink',         hex: '#c05b9f' },
    { name: 'purple',       hex: '#6b65a4' },
    { name: 'red',          hex: '#d43d29' },
    { name: 'white',        hex: '#ffffff' },
    { name: 'yellow',       hex: '#FFCB5C' },
    { name: 'fast_travel',  hex: '#393939' },
];
// { name: 'fastTravel',   hxe: "#393939" },

export const MARKER_COLOR_HEX: Record<string, string> = Object.fromEntries(
    MARKER_COLORS.map(({ name, hex }) => [name, hex]),
);

export const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
    arrowhead: 'purple',
    bottle: 'brown',
    coin: 'darkorange',
    egg: 'white',
    flower: 'lightdarkred',
    fossils_random: 'darkgreen',
    coastal: 'darkgreen',
    oceanic: 'darkgreen',
    megafauna: 'darkgreen',
    tarot_cards: 'blue',
    cups: 'blue',
    swords: 'blue',
    wands: 'blue',
    pentacles: 'blue',
    lost_jewelry: 'yellow',
    jewelry_random: 'yellow',
    bracelet: 'yellow',
    earring: 'yellow',
    necklace: 'yellow',
    ring: 'yellow',
    heirlooms: 'pink',
    random: 'lightgray',
    fast_travel: 'fast_travel',
    nazar: 'red',
    user_pins: 'purple',
    treasure: 'orange',
};

export const FALLBACK_CATEGORY_COLOR = 'lightred';

export const CONTOUR_MAP: Record<string, string> = {
    beige: 'darkblue',
    black: 'white',
    blue: 'orange',
    cadetblue: 'lightred',
    darkblue: 'red',
    darkgreen: 'purple',
    darkpurple: 'green',
    darkred: 'blue',
    green: 'pink',
    lightred: 'cadetblue',
    orange: 'lightblue',
    purple: 'lightgreen',
    white: 'gray',
};

export const CYCLE_COLORS: Record<string, string> = {
    '1': 'blue',
    '2': 'orange',
    '3': 'pink',
    '4': 'darkpurple',
    '5': 'darkred',
    '6': 'darkblue',
};

export function markerIconUrl(category: string): string {
    return `/assets/images/icons/${category}.png`;
}

export function markerImageUrl(color: string): string {
    const fileName = color.startsWith('marker_') ? color : `marker_${color}`;
    return `/assets/images/icons/${fileName}.png`;
}

export function getMarkerHex(color: string): string {
    const name = color.startsWith('marker_') ? color.slice(7) : color;
    return MARKER_COLOR_HEX[name] ?? '#da4d6d';
}
