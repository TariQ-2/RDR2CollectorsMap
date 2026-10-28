// src/features/map/index.ts
'use client';

import { create } from 'zustand';
import { DEFAULT_CENTER, DEFAULT_ZOOM, type BaseLayerKey } from './constants';

export {
    MAP_BOUNDARY,
    MAP_BOUNDS,
    DEFAULT_CENTER,
    DEFAULT_ZOOM,
    MIN_ZOOM,
    MAX_ZOOM,
    BASE_LAYERS,
    isDarkLayer,
    getBackgroundColor,
    latLngToGame,
    gameToLatLng,
    formatCoords,
} from './constants';
export type { BaseLayerKey } from './constants';

export interface MapViewState {
    center: [number, number];
    zoom: number;
    isReady: boolean;
    lastClick: { lat: number; lng: number } | null;
}

export interface MapState {
    view: MapViewState;
    baseLayer: BaseLayerKey;

    setCenter: (center: [number, number]) => void;
    setZoom: (zoom: number) => void;
    setReady: (ready: boolean) => void;
    setLastClick: (coords: { lat: number; lng: number } | null) => void;
    setBaseLayer: (key: BaseLayerKey) => void;
    reset: () => void;
}

interface MapClickState {
    lat: number | null;
    lng: number | null;
    visible: boolean;
    setCoords: (lat: number, lng: number) => void;
    hide: () => void;
}

export const useMapClickStore = create<MapClickState>()((set) => ({
    lat: null,
    lng: null,
    visible: false,
    setCoords: (lat, lng) => set({ lat, lng, visible: true }),
    hide: () => set({ visible: false }),
}));

const initialView: MapViewState = {
    center: DEFAULT_CENTER,
    zoom: DEFAULT_ZOOM,
    isReady: false,
    lastClick: null,
};

export const useMap = create<MapState>()((set) => ({
    view: initialView,
    baseLayer: 'general.map.layers.default',

    setCenter: (center) => set((state) => ({ view: { ...state.view, center } })),
    setZoom: (zoom) => set((state) => ({ view: { ...state.view, zoom } })),
    setReady: (isReady) => set((state) => ({ view: { ...state.view, isReady } })),
    setLastClick: (lastClick) => set((state) => ({ view: { ...state.view, lastClick } })),
    setBaseLayer: (baseLayer) => set({ baseLayer }),
    reset: () => set({ view: initialView }),
}));

export const map = {
    center: () => useMap.getState().view.center,
    zoom: () => useMap.getState().view.zoom,
    isReady: () => useMap.getState().view.isReady,
    lastClick: () => useMap.getState().view.lastClick,
    baseLayer: () => useMap.getState().baseLayer,

    setCenter: (center: [number, number]) => useMap.getState().setCenter(center),
    setZoom: (zoom: number) => useMap.getState().setZoom(zoom),
    setReady: (ready: boolean) => useMap.getState().setReady(ready),
    setLastClick: (coords: { lat: number; lng: number } | null) =>
        useMap.getState().setLastClick(coords),
    setBaseLayer: (key: BaseLayerKey) => useMap.getState().setBaseLayer(key),
    reset: () => useMap.getState().reset(),
};
