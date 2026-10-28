import L from 'leaflet';

export const MAP_BOUNDS: [[number, number], [number, number]] = [
    [-144, 0],  // SW
    [0, 176],   // NE
];

export const MAP_BOUNDARY = L.latLngBounds(MAP_BOUNDS[0], MAP_BOUNDS[1]);
export const DEFAULT_CENTER: [number, number] = [-70, 111.75];
export const DEFAULT_ZOOM = 3;
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 7;

export const BASE_LAYERS = {
    'general.map.layers.default': {
        url: 'https://s.rsg.sc/sc/images/games/RDR2/map/game/{z}/{x}/{y}.jpg',
    },
    'general.map.layers.detailed': {
        url: 'https://map-tiles.b-cdn.net/assets/rdr3/webp/detailed/{z}/{x}_{y}.webp',
    },
    'general.map.layers.dark': {
        url: 'https://map-tiles.b-cdn.net/assets/rdr3/webp/darkmode/{z}/{x}_{y}.webp',
    },
    'general.map.layers.black': {
        url: 'https://map-tiles.b-cdn.net/assets/rdr3/webp/black/{z}/{x}_{y}.webp',
    },
} as const;

export type BaseLayerKey = keyof typeof BASE_LAYERS;
export function isDarkLayer(key: BaseLayerKey | string): boolean {
    return key === 'general.map.layers.dark' || key === 'general.map.layers.black';
}

export function getBackgroundColor(key: BaseLayerKey | string): string {
    if (key === 'general.map.layers.black') {
        return '#000';
    };

    if (key === 'general.map.layers.dark') {
        return '#3d3d3d';
    };

    return '#d2b790';
}

export function latLngToGame(lat: number, lng: number): { x: number; y: number } {
    const x = (lng / 176) * 100;
    const y = ((lat + 144) / 144) * 100;
    return { x, y };
}

export function gameToLatLng(x: number, y: number): { lat: number; lng: number } {
    const lng = (x / 100) * 176;
    const lat = (y / 100) * 144 - 144;
    return { lat, lng };
}

export function formatCoords(lat: number, lng: number): string {
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}
