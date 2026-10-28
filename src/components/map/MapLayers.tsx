'use client';

import L                                                                                        from 'leaflet';
import { useMapEvents, useMap, Marker, Popup, Tooltip, Circle }                                 from 'react-leaflet';
import { useEffect, useState, useMemo, Fragment }                                               from 'react';
import { Trash2, Save }                                                                         from 'lucide-react';
import { useTranslate }                                                                         from '@/i18n';
import type { FastTravelPoint }                                                                 from '@/types/marker';
import MapMarker, { type MarkerDisplayConfig }                                                  from '@/components/map/Marker';
import { markerDivIcon }                                                                        from '@/components/map/MarkerIcon';
import { Button }                                                                               from '@/components/ui/button';
import { Input }                                                                                from '@/components/ui/input';
import { Label }                                                                                from '@/components/ui/label';
import { Textarea }                                                                             from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle }    from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue }                        from '@/components/ui/select';
import { ColorPicker, type ColorPickerItem }                                                    from '@/components/common/ColorPicker';
import { useMarkers }                                                                           from '@/features/markers';
import { useSettings, useSetting }                                                              from '@/features/settings';
import { usePins, ADD_PIN_CENTER_EVENT, type PinData }                                          from '@/features/pins';
import { useMapClickStore }                                                                     from '@/features/map';
import { useInventory }                                                                         from '@/features/inventory';
import { useCollectors }                                                                        from '@/features/collectors/hooks/useCollectors';
import { useTreasures }                                                                         from '@/features/treasures';
import { useNazar }                                                                             from '@/features/nazar';
import { useOverlays }                                                                          from '@/features/overlays';
import { loadJson }                                                                             from '@/lib/api/loader';
import { getNocacheParam }                                                                      from '@/lib/api/nocache';
import { colorNameMap, colorNameToHexMap }                                                      from '@/data/pin-colors';
import type { CollectionModel }                                                                 from '@/features/collectors/types';

function CollectorsLayer() {
    const map = useMap();
    const visibleMarkers = useMarkers((s) => s.visibleMarkers);
    const baseLayer = useSettings((s) => s.core.baseLayer);
    const markerSize = useSettings((s) => s.collectors.markerSize);
    const markerOpacity = useSettings((s) => s.collectors.markerOpacity);
    const isShadowsEnabled = useSettings((s) => s.collectors.isShadowsEnabled);
    const showTooltipsMap = useSettings((s) => s.collectors.showTooltipsMap);
    const isPopupsHoverEnabled = useSettings((s) => s.collectors.isPopupsHoverEnabled);
    const isPopupsEnabled = useSettings((s) => s.collectors.isPopupsEnabled);
    const isInvisibleRemovedMarkers = useSettings((s) => s.collectors.isInvisibleRemovedMarkers);

    const inventoryEnabled = useInventory((s) => s.isEnabled);
    const highlightLowAmountItems = useInventory((s) => s.highlightLowAmountItems);
    const highlightStyle = useInventory((s) => s.highlightStyle);
    const stackSizeSetting = useInventory((s) => s.stackSize);
    const flowersSoftStackSize = useInventory((s) => s.flowersSoftStackSize);

    const itemsById = useCollectors((s) => s.itemsById);
    const collections = useCollectors((s) => s.collections);
    const t = useTranslate();

    const [bounds, setBounds] = useState<L.LatLngBounds>(() => map.getBounds());
    useMapEvents({
        moveend: () => {
            setTimeout(() => {
                if (map) {
                    setBounds(map.getBounds());
                }
            }, 150);
        },
        zoomend: () => {
            setTimeout(() => {
                if (map) {
                    setBounds(map.getBounds());
                }
            }, 150);
        },
    });

    const markersInView = useMemo(() => {
        const paddedBounds = bounds.pad(0.2);
        return visibleMarkers.filter((m) => paddedBounds.contains([m.lat, m.lng]));
    }, [visibleMarkers, bounds]);

    const collectionsByCategory = useMemo(() => {
        const map = new Map<string, CollectionModel>();
        for (const c of collections) {
            map.set(c.category, c);
        };
        return map;
    }, [collections]);

    const config: MarkerDisplayConfig = useMemo(
        () => ({
            baseLayer, markerSize, markerOpacity, isShadowsEnabled, showTooltipsMap,
            isPopupsHoverEnabled, isPopupsEnabled, isInvisibleRemovedMarkers,
            inventoryEnabled, highlightLowAmountItems, highlightStyle,
            stackSizeSetting, flowersSoftStackSize, t,
        }),
        [
            baseLayer, markerSize, markerOpacity, isShadowsEnabled, showTooltipsMap,
            isPopupsHoverEnabled, isPopupsEnabled, isInvisibleRemovedMarkers,
            inventoryEnabled, highlightLowAmountItems, highlightStyle,
            stackSizeSetting, flowersSoftStackSize, t,
        ],
    );

    return (
        <>
            {markersInView.map((m) => (
                <MapMarker
                    key={m.markerId}
                    item={m}
                    config={config}
                    itemModel={itemsById[m.itemId]}
                    collection={collectionsByCategory.get(m.category)}
                />
            ))}
        </>
    );
}

function FastTravelLayer() {
    const t = useTranslate();
    const markerSize = useSetting('collectors', 'markerSize');
    const isShadowsEnabled = useSetting('collectors', 'isShadowsEnabled');
    const showTooltipsMap = useSetting('collectors', 'showTooltipsMap');
    const baseLayer = useSetting('core', 'baseLayer');

    const [data, setData] = useState<Record<string, FastTravelPoint> | null>(null);

    useEffect(() => {
        loadJson<Record<string, FastTravelPoint>>('fasttravels')
            .then(setData)
            .catch((err) => console.error('[FastTravel] Failed', err));
    }, []);

    if (!data) {
        return null;
    }

    const isDark = baseLayer === 'general.map.layers.dark' || baseLayer === 'general.map.layers.black';
    const icon = markerDivIcon({
        color: 'fast_travel',
        iconName: 'fast_travel',
        markerSize,
        isShadowsEnabled,
        isDark,
    });

    return (
        <>
            {Object.entries(data).map(([key, value]) => {
                const translatedName = t(value.text + '');
                return (
                    <Marker key={key} position={[value.x, value.y]} icon={icon}>
                        {showTooltipsMap === 1 && (
                            <Tooltip direction="right" offset={[10, 0]}>
                                {translatedName}
                            </Tooltip>
                        )}
                        <Popup>
                            <h1>{translatedName}</h1>
                        </Popup>
                    </Marker>
                );
            })}
        </>
    );
}

function NazarLayer() {
    const t = useTranslate();
    const markerSize = useSetting('collectors', 'markerSize');
    const isShadowsEnabled = useSetting('collectors', 'isShadowsEnabled');
    const language = useSetting('core', 'language');

    const possibleLocations = useNazar((s) => s.possibleLocations);
    const currentLocation = useNazar((s) => s.currentLocation);
    const currentDate = useNazar((s) => s.currentDate);
    const load = useNazar((s) => s.load);

    useEffect(() => {
        void load();
    }, [load]);

    if (currentLocation == null || currentLocation < 0 || currentLocation >= possibleLocations.length) {
        return null;
    }

    const loc = possibleLocations[currentLocation];

    const icon = markerDivIcon({
        color: 'red',
        iconName: 'nazar',
        markerSize,
        isShadowsEnabled,
    });

    const locale = currentDate
        ? new Date(currentDate).toLocaleString(language, { timeZone: 'UTC', month: 'long', day: 'numeric' })
        : '';

    const desc = t('general.menu.madamNazar.desc');
    const [descBefore, descAfter] = desc.split('{int.nazar.link}');

    return (
        <Marker position={[loc.x, loc.y]} icon={icon}>
            <Tooltip direction="right" offset={[10, 0]}>
                {t('general.menu.madamNazar')}
            </Tooltip>
            <Popup minWidth={300}>
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-center">
                        {t('general.menu.madamNazar')} — {locale || `#${currentLocation + 1}`}
                    </h3>
                    <p className="text-xs text-center text-muted-foreground">
                        {descBefore}

                        {descAfter}
                    </p>
                </div>
            </Popup>
        </Marker>
    );
}

function OverlaysLayer() {
    const map = useMap();
    const overlays = useOverlays((s) => s.overlays);
    const opacity = useSetting('core', 'overlayOpacity');
    const baseLayer = useSetting('core', 'baseLayer');

    useEffect(() => {
        if (opacity === 0 || !overlays || Object.keys(overlays).length === 0) {
            return;
        }

        const isDark = baseLayer === 'general.map.layers.dark' || baseLayer === 'general.map.layers.black';
        const subDir = isDark ? 'dark' : 'normal';
        const nocache = getNocacheParam();
        const layers: Array<L.ImageOverlay> = [];

        for (const [key, value] of Object.entries(overlays)) {
            if (!value || !Array.isArray(value)) {
                continue;
            }
            const url = `/RDR2CollectorsMap/assets/overlays/${subDir}/${key}.png?nocache=${nocache}`;
            const bounds = value as unknown as [[number, number], [number, number]];
            try {
                layers.push(L.imageOverlay(url, bounds, { opacity }).addTo(map));
            } catch (err) {
                console.warn(`[Overlays] Failed to add ${key}`, err);
            }
        }

        return () => {
            layers.forEach((l) => map.removeLayer(l));
        };
    }, [map, overlays, opacity, baseLayer]);

    return null;
}

const PIN_SHAPES = ["default", "pushpin"] as const;

function PinDialog({ pin, onClose }: { pin: PinData | null; onClose: () => void }) {
    if (!pin) {
        return null;
    }
    return (
        <Dialog open onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="sm:max-w-md">
                <PinDialogContent key={String(pin.id)} pin={pin} onClose={onClose} />
            </DialogContent>
        </Dialog>
    );
}

function PinDialogContent({ pin, onClose }: { pin: PinData; onClose: () => void }) {
    const t = useTranslate();
    const isPinsEditingEnabled = useSetting("pins", "editingEnabled");
    const savePin = usePins((s) => s.savePin);
    const removePin = usePins((s) => s.removePin);

    const [title, setTitle] = useState(pin.title);
    const [description, setDescription] = useState(pin.description);
    const [shape, setShape] = useState<string>(pin.shape);
    const [color, setColor] = useState<string>(pin.color);

    const hex = colorNameToHexMap[color] ?? color;

    const colorItems: Array<ColorPickerItem> = useMemo(
        () => Object.entries(colorNameMap).map(([hexVal, name]) => ({ value: hexVal, label: name })),
        [],
    );

    const handleSave = () => {
        savePin({ ...pin, title, description, shape, color }); onClose();
    };
    const handleRemove = () => {
        removePin(pin.id); onClose();
    };

    if (!isPinsEditingEnabled) {
        return (
            <>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <span className="truncate">{pin.title}</span>
                    </DialogTitle>
                    {pin.description && <DialogDescription className="whitespace-pre-wrap text-sm">{pin.description}</DialogDescription>}
                </DialogHeader>
                <p className="text-[11px] text-muted-foreground text-center">
                    {t("general.map.latitude")}: {pin.lat.toFixed(4)} · {t("general.map.longitude")}: {pin.lng.toFixed(4)}
                </p>
            </>
        );
    }

    return (
        <>
            <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <span className="truncate">{t("pins.menu.title")}</span>
                </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
                <div className="space-y-1">
                    <Label htmlFor={`pin-title-${pin.id}`} className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        {t("pins.user.defaultTitle")}
                    </Label>
                    <Input
                        id={`pin-title-${pin.id}`}
                        value={title} onChange={(e) => setTitle(e.target.value)}
                        placeholder={t("pins.user.placeholderTitle")}
                        className="h-8 text-sm"
                    />
                </div>
                <div className="space-y-1">
                    <Label htmlFor={`pin-desc-${pin.id}`} className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        {t("pins.user.placeholderDesc")}
                    </Label>
                    <Textarea
                        id={`pin-desc-${pin.id}`}
                        value={description}
                        onChange={(e) =>
                            setDescription(e.target.value)
                        }
                        placeholder={t("pins.user.placeholderDesc")}
                        rows={3} className="text-sm resize-none"
                    />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                        <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">{t("pins.user.shape")}</Label>
                        <Select value={shape} onValueChange={setShape}>
                            <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {PIN_SHAPES.map((value) => (
                                    <SelectItem key={value} value={value} className="text-sm">{t(`pins.user.shape.${value}`)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
                            {t("pins.user.color")}
                        </Label>
                        <ColorPicker value={hex} onChange={(newHex) => {
                            const name = colorNameMap[newHex.toLowerCase()]; setColor(name ?? newHex);
                        }} items={colorItems} />
                    </div>
                </div>

                <p className="text-[11px] text-muted-foreground text-center pt-1">
                    {t("general.map.latitude")}: {pin.lat.toFixed(4)} · {t("general.map.longitude")}: {pin.lng.toFixed(4)}
                </p>
            </div>
            <DialogFooter className="flex-row gap-2">
                <Button variant="destructive" size="sm" onClick={handleRemove} className="gap-1.5">
                    <Trash2 className="h-3.5 w-3.5" />
                    {t("pins.user.remove")}
                </Button>
                <Button size="sm" onClick={handleSave} className="gap-1.5">
                    <Save className="h-3.5 w-3.5" />
                    {t("pins.user.save")}
                </Button>
            </DialogFooter>
        </>
    );
}

function PinMarker({ pin, onEdit }: { pin: PinData; onEdit: (pin: PinData) => void }) {
    const markerSize = useSetting("collectors", "markerSize");
    const isShadowsEnabled = useSetting("collectors", "isShadowsEnabled");
    const isPinsEditingEnabled = useSetting("pins", "editingEnabled");
    const movePin = usePins((s) => s.movePin);

    const icon = useMemo(() => {
        const isPushpin = pin.shape === 'pushpin';
        return markerDivIcon({
            shape: isPushpin ? 'pushpin' : 'teardrop',
            color: colorNameToHexMap[pin.color] ?? pin.color,

            markerSize,
            isShadowsEnabled,
        });
    }, [pin, markerSize, isShadowsEnabled]);

    return (
        <Marker
            position={[pin.lat, pin.lng]}
            icon={icon}
            draggable={isPinsEditingEnabled}
            eventHandlers={{
                click: () => onEdit(pin),
                dragend: (e) => {
                    const latLng = (e.target as L.Marker).getLatLng();
                    movePin(pin.id, latLng.lat, latLng.lng);
                },
            }}
        />
    );
}

function PinsLayer() {
    const map = useMap();
    const pinsList = usePins((s) => s.pinsList);
    const loadPins = usePins((s) => s.loadPins);
    const enabled = useMarkers((s) => s.enabledCategories.has("user_pins"));
    const [editingPin, setEditingPin] = useState<PinData | null>(null);

    useEffect(() => {
        loadPins();
    }, [loadPins]);

    useEffect(() => {
        const handler = () => {
            const markers = useMarkers.getState();
            if (!markers.enabledCategories.has("user_pins")) {
                markers.setEnabledCategories([...markers.enabledCategories, "user_pins"]);
            }
            const center = map.getCenter();
            usePins.getState().addPin({ lat: center.lat, lng: center.lng });
        };
        window.addEventListener(ADD_PIN_CENTER_EVENT, handler);
        return () => window.removeEventListener(ADD_PIN_CENTER_EVENT, handler);
    }, [map]);

    if (!enabled) {
        return null;
    }

    return (
        <>
            {pinsList.map((pin) => (
                <PinMarker key={pin.id} pin={pin} onEdit={setEditingPin} />
            ))}
            <PinDialog pin={editingPin} onClose={() => setEditingPin(null)} />
        </>
    );
}

function TreasurePopup({ id, onRemove }: { id: string; onRemove: () => void }) {
    const t = useTranslate();
    return (
        <div className="space-y-2">
            <h3 className="font-semibold text-foreground text-center text-xl">{t(`treasures.map.${id}`)}</h3>
            <Button type="button" size="sm" variant="destructive" onClick={onRemove} className="w-full">{t('collectables.map.remove')}</Button>
        </div>
    );
}

function TreasuresLayer() {
    const showOnMap = useSetting('treasures', 'showOnMap');
    const circleOpacity = useSetting('treasures', 'circleOpacity');

    const treasures = useTreasures((s) => s.treasures);
    const shownIds = useTreasures((s) => s.shownIds);
    const isLoading = useTreasures((s) => s.isLoading);
    const load = useTreasures((s) => s.load);
    const setShown = useTreasures((s) => s.setShown);
    const shownSet = useMemo(() => new Set(shownIds), [shownIds]);

    useEffect(() => {
        load();
    }, [load]);

    const visible = useMemo(() => treasures.filter((t) => shownSet.has(t.id)), [treasures, shownSet]);

    const crossIcon = useMemo(() => markerDivIcon({
        shape: 'cross',
        color: '#CC0000',
        markerSize: 0.5,
        isShadowsEnabled: false,
    }), []);

    if (!showOnMap || isLoading) {
        return null;
    }

    return (
        <>
            {visible.map((treasure) => (
                <Fragment key={treasure.id}>
                    <Circle center={[treasure.center.x, treasure.center.y]} radius={treasure.radius} pathOptions={{ className: '', fillOpacity: circleOpacity }}>
                        <Popup minWidth={240}>
                            <TreasurePopup id={treasure.id} onRemove={() => setShown(treasure.id, false)}/>
                        </Popup>
                    </Circle>
                    {treasure.locations.map((cross, index) => (
                        <Marker key={`${treasure.id}-${index}`} position={[cross.x, cross.y]} icon={crossIcon}>
                            <Popup minWidth={240}>
                                <TreasurePopup id={treasure.id} onRemove={() => setShown(treasure.id, false) } />
                            </Popup>
                        </Marker>
                    ))}
                </Fragment>
            ))}
        </>
    );
}

function MapClickHandler() {
    const setCoords = useMapClickStore((s) => s.setCoords);

    useMapEvents({
        click: (e) => {
            const settings = useSettings.getState();
            if (settings.core.isCoordsOnClickEnabled) {
                setCoords(Number(e.latlng.lat.toFixed(4)), Number(e.latlng.lng.toFixed(4)));
            }
            if (settings.pins.placingEnabled) {
                const markersStore = useMarkers.getState();
                if (!markersStore.enabledCategories.has('user_pins')) {
                    markersStore.setEnabledCategories([...markersStore.enabledCategories, 'user_pins']);
                }
                usePins.getState().addPin({ lat: e.latlng.lat, lng: e.latlng.lng });
            }
        },
    });

    return null;
}

export default function MapLayers() {
    const enabled = useMarkers((s) => s.enabledCategories);

    return (
        <>
            {enabled.size > 0 && <CollectorsLayer />}
            {enabled.has('nazar') && <NazarLayer />}
            <PinsLayer />
            {enabled.has('fast_travel') && <FastTravelLayer />}
            {enabled.has('treasure') && <TreasuresLayer />}
            <OverlaysLayer />
            <MapClickHandler />
        </>
    );
}
