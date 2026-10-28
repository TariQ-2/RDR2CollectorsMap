'use client';

import { MapContainer, TileLayer, ZoomControl, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo } from 'react';
import MapLayers from './MapLayers';
import { cn } from '@/lib/utils';
import { MAP_BOUNDS, DEFAULT_CENTER, DEFAULT_ZOOM, MIN_ZOOM, MAX_ZOOM, BASE_LAYERS, getBackgroundColor, type BaseLayerKey } from '@/features/map';
import { useSetting, useSettings } from '@/features/settings';
import { map } from '@/features/map';
import { useMarkers } from '@/features/markers';
import { useTranslate } from '@/i18n';

function ExposeMap() {
    const map = useMap();
    useEffect(() => {
        (window as unknown as { __map: L.Map }).__map = map;
    }, [map]);
    return null;
}

function ContextMenuBlocker() {
    const map = useMap();
    useEffect(() => {
        const container = map.getContainer();
        const handler = (e: MouseEvent) => {
            if (!useSettings.getState().core.isRightClickEnabled) {
                e.preventDefault();
            }
        };
        container.addEventListener('contextmenu', handler);
        return () => container.removeEventListener('contextmenu', handler);
    }, [map]);
    return null;
}

function MapFocuser() {
    const map = useMap();
    const focusOn = useMarkers((s) => s.focusOn);
    const focusOnVersion = useMarkers((s) => s.focusOnVersion);

    useEffect(() => {
        if (!focusOn) {
            return;
        }
        map.setView(
            [focusOn.lat, focusOn.lng],
            Math.max(map.getZoom(), 5),
            { animate: true },
        );
    }, [focusOn, focusOnVersion, map]);

    return null;
}

export default function MapContent() {
    const t = useTranslate();
    const rawBaseLayer = useSetting('core', 'baseLayer') as BaseLayerKey;
    const setValue = useSettings((s) => s.setValue);
    const baseLayer = rawBaseLayer;
    const layerConfig = BASE_LAYERS[baseLayer] || BASE_LAYERS['general.map.layers.default'];

    const setReady = map.setReady;
    const bgColor = getBackgroundColor(baseLayer);
    const mapBoundary = useMemo(
        () => L.latLngBounds(MAP_BOUNDS[0], MAP_BOUNDS[1]),
        [],
    );

    useEffect(() => {
        setReady(true);
        return () => setReady(false);
    }, [setReady]);

    return (
        <div className="relative w-full h-full z-0 overflow-hidden rounded-[10px]">
            <MapContainer
                center={DEFAULT_CENTER}
                zoom={DEFAULT_ZOOM}
                minZoom={MIN_ZOOM}
                maxZoom={MAX_ZOOM}
                crs={L.CRS.Simple}
                zoomControl={false}
                attributionControl={false}
                maxBounds={mapBoundary}
                maxBoundsViscosity={1.0}
                preferCanvas={true}
                style={{ height: '100%', width: '100%', backgroundColor: bgColor }}
            >
                <ExposeMap />
                <ContextMenuBlocker />
                <TileLayer
                    key={baseLayer}
                    url={layerConfig.url}
                    noWrap
                    bounds={mapBoundary}
                />
                <MapLayers />
                <MapFocuser />
                <ZoomControl position="bottomright" />
            </MapContainer>

            <div className="absolute top-2 inset-e-2 z-1001 flex gap-1 rounded-lg border border-border/60 bg-card/95 p-1 shadow-lg backdrop-blur-md">
                {(Object.keys(BASE_LAYERS) as Array<BaseLayerKey>).map((key) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setValue('core', 'baseLayer', key)}
                        data-help={`${key}.desc`}
                        className={cn(
                            "px-2 py-1 text-[11px] font-medium rounded-md transition-colors",
                            baseLayer === key
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground",
                        )}
                    >
                        {t(key)}
                    </button>
                ))}
            </div>
        </div>
    );
}
