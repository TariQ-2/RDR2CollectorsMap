'use client';
import L from 'leaflet';
import { Marker as LeafletMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import { memo, useCallback, useEffect, useMemo, useRef } from 'react';
import { Minus, Plus, Star, Copy, AlertTriangle, CheckCircle2, Circle } from 'lucide-react';
import collectorsService from '@/features/collectors';
import { collected, useCollected } from '@/features/collected';
import type { MarkerData } from '@/types/marker';
import type { CollectionModel, ItemModel } from '@/features/collectors/types';
import type { OverlayType } from './MarkerIcon';
import { markerDivIcon } from './MarkerIcon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useMarkers } from '@/features/markers';
import { DEFAULT_CATEGORY_COLORS as CATEGORY_COLORS, CYCLE_COLORS as CYCLE_COLOR_NAMES } from '@/data/marker-colors';
import type { CustomColors } from '@/features/markers/custom-colors';

export interface MarkerDisplayConfig {
    baseLayer: string;
    markerSize: number;
    markerOpacity: number;
    isShadowsEnabled: boolean;
    showTooltipsMap: number;
    isPopupsHoverEnabled: boolean;
    isPopupsEnabled: boolean;
    isInvisibleRemovedMarkers: boolean;
    inventoryEnabled: boolean;
    highlightLowAmountItems: boolean;
    highlightStyle: string;
    stackSizeSetting: number;
    flowersSoftStackSize: number;
    t: (key: string, vars?: Record<string, string | number>) => string;
}

interface Props {
    item: MarkerData;
    config: MarkerDisplayConfig;
    itemModel?: ItemModel;
    collection?: CollectionModel;
}

function getColorName(item: MarkerData, markerColor: string, isDark: boolean, customColors: CustomColors = {}): string {
    if (markerColor.startsWith('auto')) {
        const [, normal, dark] = markerColor.split('_');
        return isDark ? (dark ?? 'orange') : (normal ?? 'darkblue');
    };

    let base = CATEGORY_COLORS[item.category] || 'lightred';

    if (item.category === 'random') {
        if (item.tool === 1) {
            base = 'lightergray';
        } else if (item.type === 'chest') {
            base = 'gray';
        } else {
            base = 'lightgray';
        };
    };

    if (markerColor === 'by_category') {
        // no change
    } else if (markerColor === 'custom') {
        if (customColors[item.category]) {
            base = customColors[item.category];
        };

        if (item.category === 'random' && customColors.random_spot_shovel && item.tool === 1) {
            base = customColors.random_spot_shovel;
        };
    } else if (markerColor === 'by_cycle') {
        base = CYCLE_COLOR_NAMES[item.cycleName] || 'lightred';
    } else {
        base = markerColor;
    };

    return base;
}

function getIconName(item: MarkerData): string {
    if (item.category === 'random') {
        return item.tool === 1 ? 'shovel' : 'magnet';
    };
    return item.category;
}

function getOverlayType(item: MarkerData): OverlayType {
    if (item.buggy) {
        return 'cross';
    };

    if (item.itemId === 'collectables.menu.items.flower.agarita' || item.itemId === 'collectables.menu.items.flower.bloodFlower') {
        return 'time';
    };

    if (item.height === 1) {
        return 'high';
    };

    if (item.height === -1) {
        return 'low';
    };

    return null;
}

function MapMarkerComponent({ item, config, itemModel, collection }: Props) {
    const {
        baseLayer, markerSize, markerOpacity, isShadowsEnabled, showTooltipsMap,
        isPopupsHoverEnabled, isPopupsEnabled, isInvisibleRemovedMarkers,
        inventoryEnabled, highlightLowAmountItems, highlightStyle,
        stackSizeSetting, flowersSoftStackSize, t,
    } = config;

    const markerRef = useRef<L.Marker>(null);
    const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const map = useMap();
    const focusedMarkerId = useMarkers((s) => s.focusedMarkerId);
    const focusVersion = useMarkers((s) => s.focusVersion);
    const isFocused = focusedMarkerId === item.text;

    const isCollected = useCollected((s) => s.collectedTexts.has(item.text));
    const isImportant = useCollected((s) => s.importantItemIds.has(item.itemId));

    useEffect(() => {
        if (!isFocused || !markerRef.current) {
            return;
        };

        markerRef.current.openPopup();
        if (map) {
            map.setView(markerRef.current.getLatLng(), Math.max(map.getZoom(), 5), { animate: true });
        };

    }, [isFocused, focusVersion, map]);

    const changeAmount = collectorsService.changeAmount;
    const isDark = baseLayer === 'general.map.layers.dark' || baseLayer === 'general.map.layers.black';
    const iconName = getIconName(item);
    const amount = itemModel?.amount ?? 0;
    const stackSize = item.category === 'flower' ? flowersSoftStackSize : stackSizeSetting;
    const canCollect = isCollected ? false : item.category === 'random' ? true : inventoryEnabled && itemModel ? amount < stackSize : true;
    const { highlightOpacity, highlightAnimated } = useMemo(() => {
        const hidden = { highlightOpacity: 0, highlightAnimated: false };
        if (!inventoryEnabled || !highlightLowAmountItems || !itemModel || !canCollect) {
            return hidden;
        };

        if (['arrowhead', 'coin', 'fossils_random', 'jewelry_random'].includes(item.category)) {
            return hidden;
        };

        if (!collection) {
            return hidden;
        };

        const collectionAverage = collectorsService.averageAmount(collection);
        const weight = Math.max(0, (collectionAverage - amount) / stackSizeSetting);
        const scaledWeight = Math.min(1, weight * 2.4);
        if (weight < 0.02) {
            return hidden;
        };

        if (weight < 0.3 || highlightStyle === 'static') {
            return { highlightOpacity: scaledWeight, highlightAnimated: false };
        };

        return { highlightOpacity: scaledWeight, highlightAnimated: true };
    }, [inventoryEnabled, highlightLowAmountItems, highlightStyle, itemModel, item.category, collection, amount, stackSizeSetting, canCollect]);

    const colorName = useMemo(() => getColorName(item, "by_category", isDark), [item, isDark]);

    const overlayType = useMemo(() => getOverlayType(item), [item]);
    const icon = useMemo(
        () => markerDivIcon({
            color: colorName,
            iconName,
            markerSize,
            isShadowsEnabled,
            isDark,
            overlay: overlayType,
            isCollected,
            canCollect,
            isInvisibleRemovedMarkers,
            isImportant,
            highlightOpacity,
            highlightAnimated,
        }),
        [colorName, iconName, markerSize, isShadowsEnabled, isDark, overlayType, isCollected, isInvisibleRemovedMarkers, isImportant, canCollect, highlightOpacity, highlightAnimated],
    );

    const displayName = useMemo(() => {
        if (itemModel?.displayName) {
            return itemModel.displayName;
        }
        if (item.category === 'random') {
            const num = item.text.replace('random_item_', '');
            const typeLabel = (item.type ?? 'mounds').charAt(0).toUpperCase() + (item.type ?? 'mounds').slice(1);
            return `Random Spot #${num} (${typeLabel})`;
        }
        return t(item.itemId);
    }, [item, itemModel, t]);

    const tooltipText = useMemo(() => {
        return `${displayName} ${item.itemNumberStr}`;
    }, [displayName, item.itemNumberStr]);

    const handleClick = useCallback(() => {
        if (!isPopupsEnabled) {
            collected.toggle(item.text);
        }
    }, [isPopupsEnabled, item.text]);

    const handleMouseOver = useCallback(() => {
        if (!isPopupsHoverEnabled) {
            return;
        }
        markerRef.current?.openPopup();
    }, [isPopupsHoverEnabled]);

    const handleMouseOut = useCallback(() => {
        if (!isPopupsHoverEnabled) {
            return;
        }
        closeTimerRef.current = setTimeout(() => {
            markerRef.current?.closePopup();
        }, 100);
    }, [isPopupsHoverEnabled]);

    const handlePopupMouseOver = useCallback(() => {
        if (closeTimerRef.current) {
            clearTimeout(closeTimerRef.current);
            closeTimerRef.current = null;
        }
    }, []);

    useEffect(() => {
        return () => {
            if (closeTimerRef.current) {
                clearTimeout(closeTimerRef.current);
            };
        };
    }, []);

    const tSafe = useCallback((key?: string): string => {
        if (!key) {
            return '';
        }
        const v = t(key);
        return v === key ? '' : v;
    }, [t]);

    const primaryDescText = useMemo(() => tSafe(item.primaryDescriptionKey), [item.primaryDescriptionKey, tSafe]);
    const secondaryDescText = useMemo(() => tSafe(item.secondaryDescriptionKey), [item.secondaryDescriptionKey, tSafe]);

    const renderPopup = () => {
        const isRandom = item.category === 'random';
        const showInventory = inventoryEnabled && !isRandom && itemModel;

        return (
            <div className="min-w-65 max-w-[320px] p-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <h1 className="text-base font-bold leading-tight text-foreground flex-1">
                        {displayName}
                        {item.itemNumberStr && (
                            <span className="ms-1 text-sm text-muted-foreground font-normal">
                                {item.itemNumberStr}
                            </span>
                        )}
                    </h1>

                    <div className="flex items-center gap-1 shrink-0">
                        {item.isCurrent && item.category !== 'random' && (
                            <Button
                                variant="ghost" size="icon" className="h-7 w-7 rounded-full"
                                onClick={(e) => {
                                    e.preventDefault(); collected.toggleImportant(item.itemId); 
                                }}
                                title={isImportant ? t('collectables.map.unmarkImportant') : t('collectables.map.markImportant')}
                                data-help="collectables.map.markImportant.desc"
                            >
                                <Star className={cn('h-4 w-4', isImportant ? 'fill-warning text-warning' : 'text-muted-foreground')} />
                            </Button>
                        )}
                        <Button
                            variant="ghost" size="icon" className="h-7 w-7 rounded-full"
                            onClick={(e) => {
                                e.preventDefault();
                                const url = new URL(window.location.origin + window.location.pathname);
                                url.searchParams.set('m', item.text);
                                navigator.clipboard.writeText(url.toString());
                            }}
                            title={t('general.map.copyLink')}
                            data-help="general.map.copyLink.desc"
                        >
                            <Copy className="h-4 w-4 text-muted-foreground" />
                        </Button>
                    </div>
                </div>

                {item.buggy && (
                    <div className="mb-3 flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/30 px-2.5 py-1.5 text-xs text-destructive">
                        <AlertTriangle className="h-4 w-4 shrink-0" />
                        <span>{t('collectables.map.item.unable')}</span>
                    </div>
                )}

                {(primaryDescText || secondaryDescText) && (
                    <div className="mb-3 text-[13px] leading-relaxed text-muted-foreground text-center bg-muted/30 p-2 rounded-md">
                        {primaryDescText && <p>{primaryDescText.replace(/\{int\.[^}]+\}/g, '')}</p>}
                        {secondaryDescText && <p>{secondaryDescText.replace(/\{int\.[^}]+\}/g, '')}</p>}
                    </div>
                )}

                {showInventory && (
                    <div className="mb-3 flex items-center justify-between gap-2 rounded-md border border-border bg-muted/50 px-2 py-1">
                        <Button
                            type="button" size="icon" variant="ghost"
                            className="h-6 w-6 rounded text-destructive hover:bg-destructive/15"
                            onClick={(e) => {
                                e.stopPropagation(); e.preventDefault(); changeAmount(item.itemId, -1); 
                            }}
                            disabled={amount === 0}
                        >
                            <Minus className="h-3 w-3" />
                        </Button>
                        <span className={cn('min-w-8 text-center text-sm font-bold tabular-nums', amount >= stackSize ? 'text-warning' : 'text-foreground')}>
                            {amount} <span className="text-[10px] text-muted-foreground font-normal">/ {stackSize}</span>
                        </span>
                        <Button
                            type="button" size="icon" variant="ghost"
                            className="h-6 w-6 rounded text-success hover:bg-success/15"
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                changeAmount(item.itemId, +1);
                            }}
                            disabled={amount >= stackSize}
                        >
                            <Plus className="h-3 w-3" />
                        </Button>
                    </div>
                )}

                <Button
                    variant={isCollected ? 'secondary' : 'default'}
                    size="sm"
                    className={cn(
                        "w-full h-9 font-semibold transition-all",
                        isCollected ? "bg-muted text-muted-foreground hover:bg-muted/80" : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md",
                    )}
                    onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        collected.toggle(item.text);
                    }}
                    data-help="collectables.menu.item.desc"
                >
                    {isCollected ? (
                        <><CheckCircle2 className="h-4 w-4 me-1.5" /> {t('collectables.map.add')}</>
                    ) : (
                        <><Circle className="h-4 w-4 me-1.5" /> {t('collectables.map.remove')}</>
                    )}
                </Button>
            </div>
        );
    };

    return (
        <LeafletMarker
            ref={markerRef}
            position={[item.lat, item.lng]}
            icon={icon}
            opacity={markerOpacity}
            eventHandlers={{
                click: handleClick,
                mouseover: handleMouseOver,
                mouseout: handleMouseOut,
                contextmenu: (e) => {
                    L.DomEvent.stopPropagation(e);
                    collected.toggle(item.text);
                },
            }}
        >
            {showTooltipsMap === 1 && !isPopupsHoverEnabled && (
                <Tooltip direction="right" offset={[10, 0]} className="map-tooltip">
                    <span dangerouslySetInnerHTML={{ __html: tooltipText }} />
                </Tooltip>
            )}

            {isPopupsEnabled && (
                <Popup
                    minWidth={300}
                    maxWidth={400}
                    className="marker-popup-tailwind"
                    eventHandlers={{ mouseover: handlePopupMouseOver }}
                >
                    {renderPopup()}
                </Popup>
            )}
        </LeafletMarker>
    );
}

const MapMarker = memo(MapMarkerComponent, (prev, next) => {

    return (
        prev.item.markerId  === next.item.markerId &&
        prev.item.lat       === next.item.lat &&
        prev.item.lng       === next.item.lng &&
        prev.item.cycleName === next.item.cycleName &&
        prev.config         === next.config &&
        prev.itemModel      === next.itemModel &&
        prev.collection     === next.collection
    );
});

MapMarker.displayName = 'MapMarker';

export default MapMarker;
