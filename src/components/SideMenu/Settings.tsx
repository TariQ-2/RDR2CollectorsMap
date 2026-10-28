'use client';

import { useState, useRef } from 'react';
import { Row, NumberRow } from '@/components/common/Row';
import SectionHeader from '@/components/common/SectionHeader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import StatusLine, { type ActionStatus } from '@/components/common/StatusLine';
import { useTranslate, LANGUAGES, setUiLanguage, type UiLanguage } from '@/i18n';
import { useSettings, useSetting, THEMES } from '../../features/settings/index';
import { useInventory } from '@/features/inventory';
import { useMarkers } from '@/features/markers';
import { usePins, ADD_PIN_CENTER_EVENT } from '@/features/pins';
import { RotateCcw, Trash2, MapPin, Download, Loader2, Upload } from 'lucide-react';
import { collected } from '@/features/collected';
import type { ThemeId } from '@/features/settings/themes';

type Status = ActionStatus;

function clampNumber(value: number, min: number, max: number, fallback: number): number {
    return Number.isNaN(value) || value < min || value > max ? fallback : value;
}

function resetEverything(): void {
    try {
        const keysToRemove: Array<string> = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) {
                continue;
            }
            if (
                key.startsWith('rdr2collector') || key.startsWith('rdo-') ||
                key === 'importantItems' || key === 'pinned-items' || key === 'customMarkersColors'
            ) {
                keysToRemove.push(key);
            }
        }
        for (const key of keysToRemove) {
            localStorage.removeItem(key);
        }
    } catch {}
    window.location.reload();
}

function downloadJson(data: unknown, filename: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function extractCollected(markers: ReturnType<typeof useMarkers.getState>['allMarkers']) {
    return markers.filter((m) => m.isCollected).map((m) => m.text);
}

function formatDate(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function flash(setStatus: (s: Status) => void, setMessage: (m: string) => void, status: Status, msg: string) {
    setStatus(status);
    setMessage(msg);
    if (status === 'success' || status === 'error') {
        setTimeout(() => {
            setStatus('idle'); setMessage('');
        }, 2500);
    }
}

function InventoryFilterMin() {
    const filterType = useSetting('collectors', 'filterType');
    const inventoryEnabled = useInventory((s) => s.isEnabled);
    const value = useInventory((s) => s.maxAmountLowInventoryItems);
    const setValue = useInventory((s) => s.setSetting);
    const requires = filterType === 'lowInventoryItems' || filterType === 'lowInventoryItemsAndRandom';
    if (!requires || !inventoryEnabled) {
        return null;
    }
    return (
        <NumberRow
            id="settings.menu.inventory.filterMinAmountItems"
            value={value} min={1} max={10}
            onChange={(v) => {
                setValue('maxAmountLowInventoryItems', v); useMarkers.getState().recomputeVisible();
            }}
        />
    );
}

function SettingsTransfer({ t }: { t: ReturnType<typeof useTranslate> }) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [status, setStatus] = useState<Status>('idle');
    const [message, setMessage] = useState('');
    const settings = useSettings();
    const markersState = useMarkers();

    const handleExport = () => {
        try {
            const payload = {
                version: 1,
                exportedAt: new Date().toISOString(),
                settings: useSettings.getState().snapshot(),
                cycles: markersState.enabledCategories ? Array.from(markersState.enabledCategories) : [],
                collected: extractCollected(markersState.allMarkers),
            };
            downloadJson(payload, `rdo-settings-${formatDate(new Date())}.json`);
            flash(setStatus, setMessage, 'success', t('settings.menu.general.export.success'));
        } catch {
            flash(setStatus, setMessage, 'error', t('settings.menu.general.export.failed'));
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }
        setStatus('loading');
        setMessage(t('settings.menu.general.import.loading'));
        try {
            const data = JSON.parse(await file.text());
            if (!data || typeof data !== 'object' || !data.settings) {
                throw new Error('Invalid');
            }
            for (const [key, value] of Object.entries(data.settings)) {
                settings.setSetting(key as never, value as never);
            }
            if (Array.isArray(data.cycles)) {
                markersState.setEnabledCategories(data.cycles);
            }
            flash(setStatus, setMessage, 'success', t('settings.menu.general.import.success'));
        } catch {
            flash(setStatus, setMessage, 'error', t('settings.menu.general.import.failed'));
        } finally {
            if (fileRef.current) {
                fileRef.current.value = '';
            }
        }
    };

    const isLoading = status === 'loading';
    return (
        <div className="space-y-0.5">
            <input ref={fileRef} type="file" accept=".json,application/json"
                onChange={handleFileChange} className="hidden" aria-hidden="true" />
            <Row id="settings.menu.general.import" type="action"
                onClick={() => fileRef.current?.click()} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            </Row>
            <Row id="settings.menu.general.export" type="action" onClick={handleExport} disabled={isLoading}>
                <Download className="h-3.5 w-3.5" />
            </Row>
            <StatusLine status={status} message={message} />
        </div>
    );
}

function PinsTransfer({ t }: { t: ReturnType<typeof useTranslate> }) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [status, setStatus] = useState<Status>('idle');
    const [, setMessage] = useState('');
    const pinsList = usePins((s) => s.pinsList);
    const importPins = usePins((s) => s.importPins);
    const exportPins = usePins((s) => s.exportPins);

    const handleExport = () => {
        try {
            exportPins();
            flash(setStatus, setMessage, 'success', t('settings.menu.general.export.success'));
        } catch {
            flash(setStatus, setMessage, 'error', t('settings.menu.general.export.failed'));
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }
        setStatus('loading');
        try {
            importPins(await file.text());
            flash(setStatus, setMessage, 'success', t('settings.menu.general.import.success'));
        } catch {
            flash(setStatus, setMessage, 'error', t('settings.menu.general.import.failed'));
        } finally {
            if (fileRef.current) {
                fileRef.current.value = '';
            }
        }
    };

    const isLoading = status === 'loading';
    return (
        <div className="space-y-0.5">
            <input ref={fileRef} type="file" accept=".json,application/json"
                onChange={handleFileChange} className="hidden" aria-hidden="true" />
            <Row id="settings.menu.pins.Import" type="action"
                onClick={() => fileRef.current?.click()} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            </Row>
            <Row id="settings.menu.pins.export" type="action" onClick={handleExport} disabled={isLoading}>
                <Download className="h-3.5 w-3.5" /> {pinsList.length}
            </Row>
        </div>
    );
}

export default function SettingsContent({ activeTab }: { activeTab: 'collections' | 'treasures' }) {
    const t = useTranslate();
    const setValue = useSettings((s) => s.setValue);

    const language = useSetting('core', 'language');
    const theme = useSetting('core', 'theme');
    const overlayOpacity = useSetting('core', 'overlayOpacity');
    const isMapBoundariesEnabled = useSetting('core', 'isMapBoundariesEnabled');
    const isDoubleClickZoomEnabled = useSetting('core', 'isDoubleClickZoomEnabled');
    const isCoordsOnClickEnabled = useSetting('core', 'isCoordsOnClickEnabled');
    const isRightClickEnabled = useSetting('core', 'isRightClickEnabled');
    const overrideBrowserSearch = useSetting('core', 'overrideBrowserSearch');

    const markerSize = useSetting('collectors', 'markerSize');
    const markerOpacity = useSetting('collectors', 'markerOpacity');
    const isShadowsEnabled = useSetting('collectors', 'isShadowsEnabled');
    const isPopupsEnabled = useSetting('collectors', 'isPopupsEnabled');
    const isPopupsHoverEnabled = useSetting('collectors', 'isPopupsHoverEnabled');
    const showTooltipsMap = useSetting('collectors', 'showTooltipsMap');
    const isInvisibleRemovedMarkers = useSetting('collectors', 'isInvisibleRemovedMarkers');
    const sortItemsAlphabetically = useSetting('collectors', 'sortItemsAlphabetically');
    const showWeeklySettings = useSetting('collectors', 'showWeeklySettings');
    const toolType = useSetting('collectors', 'toolType');
    const filterType = useSetting('collectors', 'filterType');

    const placingEnabled = useSetting('pins', 'placingEnabled');
    const editingEnabled = useSetting('pins', 'editingEnabled');

    const pinsCount = usePins((s) => s.pinsList.length);
    const removeAllPins = usePins((s) => s.removeAllPins);
    const enabledCategories = useMarkers((s) => s.enabledCategories);
    const setEnabledCategories = useMarkers((s) => s.setEnabledCategories);

    const [confirmReset, setConfirmReset] = useState(false);
    const [confirmRemovePins, setConfirmRemovePins] = useState(false);
    const [confirmClearMarkers, setConfirmClearMarkers] = useState(false);
    const [confirmClearImportant, setConfirmClearImportant] = useState(false);

    const ensurePinsEnabled = () => {
        if (!enabledCategories.has('user_pins')) {
            setEnabledCategories([...enabledCategories, 'user_pins']);
        }
    };
    const inv = useInventory();

    return (
        <section>
            <section>
                <SectionHeader title={t('settings.menu.general')} />
                <Row id="settings.menu.general.language" type="select" value={language}
                    onChange={(v) => setUiLanguage(v as UiLanguage)}
                    options={LANGUAGES.map((l) => ({ value: l.code, label: l.label }))} />
                <Row id="settings.menu.general.theme" type="select" value={theme}
                    onChange={(v) => setValue('core', 'theme', v as ThemeId)}
                    options={THEMES.map((th) => ({ value: th.id, label: th.label }))} />
                <hr className="my-2 border-border/40" />
                <Row id="settings.menu.general.mapBoundaries" type="toggle"
                    checked={isMapBoundariesEnabled}
                    onChange={(v) => setValue('core', 'isMapBoundariesEnabled', v)} />
                <Row id="settings.menu.general.enableDclickZoom" type="toggle"
                    checked={isDoubleClickZoomEnabled}
                    onChange={(v) => setValue('core', 'isDoubleClickZoomEnabled', v)} />
                <Row id="settings.menu.general.showCoords" type="toggle"
                    checked={isCoordsOnClickEnabled}
                    onChange={(v) => setValue('core', 'isCoordsOnClickEnabled', v)} />
                <Row id="settings.menu.general.enableRightClick" type="toggle"
                    checked={isRightClickEnabled}
                    onChange={(v) => setValue('core', 'isRightClickEnabled', v)} />
                <Row id="settings.menu.general.overrideBrowserSearch" type="toggle"
                    checked={overrideBrowserSearch}
                    onChange={(v) => setValue('core', 'overrideBrowserSearch', v)} />
                <hr className="my-2 border-border/40" />
                <Row id="settings.menu.general.resetEverything" type="action"
                    onClick={() => setConfirmReset(true)}>
                    <RotateCcw className="h-3.5 w-3.5" />
                </Row>
            </section>

            <section>
                <SectionHeader title={t('settings.menu.appearance')} />
                <Row id="settings.menu.appearance.markerSize" type="select" value={String(markerSize)}
                    options={[
                        { value: '0.7', label: '70%' }, { value: '0.8', label: '80%' },
                        { value: '0.9', label: '90%' }, { value: '1', label: '100%' },
                        { value: '1.25', label: '125%' }, { value: '1.5', label: '150%' },
                        { value: '1.75', label: '175%' }, { value: '2', label: '200%' },
                    ]}
                    onChange={(v) => setValue('collectors', 'markerSize', Number(v))} />
                <Row id="settings.menu.appearance.markerOpacity" type="select" value={String(markerOpacity)}
                    options={[
                        { value: '0.2', label: '20%' }, { value: '0.4', label: '40%' },
                        { value: '0.6', label: '60%' }, { value: '0.8', label: '80%' },
                        { value: '1', label: '100%' },
                    ]}
                    onChange={(v) => setValue('collectors', 'markerOpacity', Number(v))} />
                <Row id="settings.menu.appearance.overlayOpacity" type="select" value={String(overlayOpacity)}
                    onChange={(v) => setValue('core', 'overlayOpacity', Number(v))}
                    options={[
                        { value: '0', label: '0%' }, { value: '0.25', label: '25%' },
                        { value: '0.5', label: '50%' }, { value: '0.75', label: '75%' },
                        { value: '1', label: '100%' },
                    ]} />
                <hr className="my-2 border-border/40" />
                <Row id="settings.menu.appearance.sortItemsAlphabetically" type="toggle"
                    checked={sortItemsAlphabetically}
                    onChange={(v) => setValue('collectors', 'sortItemsAlphabetically', v)} />
                {activeTab === 'collections' && (
                    <Row id="settings.menu.appearance.showWeeklySettings" type="toggle"
                        checked={showWeeklySettings}
                        onChange={(v) => setValue('collectors', 'showWeeklySettings', v)} />
                )}
                <Row id="settings.menu.appearance.enableMarkerShadows" type="toggle"
                    checked={isShadowsEnabled}
                    onChange={(v) => setValue('collectors', 'isShadowsEnabled', v)} />
                <Row id="settings.menu.appearance.enableMarkerPopups" type="toggle"
                    checked={isPopupsEnabled}
                    onChange={(v) => setValue('collectors', 'isPopupsEnabled', v)} />
                <Row id="settings.menu.appearance.enableMarkerPopupsHover" type="toggle"
                    checked={isPopupsHoverEnabled}
                    onChange={(v) => setValue('collectors', 'isPopupsHoverEnabled', v)} />
                <Row id="settings.menu.appearance.tooltipMap" type="switch"
                    value={showTooltipsMap}
                    onChange={(v) => setValue('collectors', 'showTooltipsMap', v)} />
                <Row id="settings.menu.appearance.invisibleRemovedMarkers" type="toggle"
                    checked={isInvisibleRemovedMarkers}
                    onChange={(v) => setValue('collectors', 'isInvisibleRemovedMarkers', v)} />
            </section>

            {activeTab === 'collections' && (
                <section>
                    <SectionHeader title={t('settings.menu.toolsFilter')} />
                    <Row id="settings.menu.toolsFilter.type" type="select" value={String(toolType)}
                        onChange={(v) => setValue('collectors', 'toolType', Number(v))}
                        options={[
                            { value: '3', label: t('settings.menu.toolsFilter.type.all') },
                            { value: '2', label: t('settings.menu.toolsFilter.type.metalDetector') },
                            { value: '1', label: t('settings.menu.toolsFilter.type.shovel') },
                            { value: '0', label: t('settings.menu.toolsFilter.type.noTools') },
                            { value: '-1', label: t('settings.menu.toolsFilter.type.shovelOnly') },
                            { value: '-2', label: t('settings.menu.toolsFilter.type.metalDetectorOnly') },
                        ]} />
                    <Row id="settings.menu.toolsFilter.filter" type="select" value={filterType}
                        onChange={(v) => setValue('collectors', 'filterType', v)}
                        options={[
                            { value: 'none' }, { value: 'moonshiner' }, { value: 'naturalist' },
                            { value: 'weekly' }, { value: 'weeklyAndRandom' }, { value: 'important' },
                            { value: 'static' }, { value: 'hideFlowers' }, { value: 'coinsSpots' },
                            { value: 'lowInventoryItems' }, { value: 'lowInventoryItemsAndRandom' },
                        ]} />
                    <InventoryFilterMin />
                    <hr className="my-2 border-border/40" />
                    <Row id="settings.menu.toolsFilter.clearMarkers" type="action"
                        onClick={() => setConfirmClearMarkers(true)}>
                        <RotateCcw className="h-3.5 w-3.5" />
                    </Row>
                    <Row id="settings.menu.toolsFilter.clearImportantItems" type="action"
                        onClick={() => setConfirmClearImportant(true)}>
                        <Trash2 className="h-3.5 w-3.5" />
                    </Row>
                </section>
            )}

            {activeTab === 'collections' && (
                <section>
                    <SectionHeader title={t('settings.menu.inventory')} />
                    <Row id="settings.menu.inventory.enable" type="toggle" checked={inv.isEnabled}
                        onChange={(v) => inv.setSetting('isEnabled', v)} />
                    {inv.isEnabled && (
                        <section>
                            <Row id="settings.menu.inventory.enablePopups" type="toggle"
                                checked={inv.isPopupsEnabled}
                                onChange={(v) => inv.setSetting('isPopupsEnabled', v)} />
                            <Row id="settings.menu.inventory.resetDaily" type="toggle"
                                checked={inv.resetInventoryDaily}
                                onChange={(v) => inv.setSetting('resetInventoryDaily', v)} />
                            <Row id="settings.menu.inventory.enableUpdate" type="toggle"
                                checked={inv.isMenuUpdateEnabled}
                                onChange={(v) => inv.setSetting('isMenuUpdateEnabled', v)} />
                            <Row id="settings.menu.inventory.autoEnableSoldItems" type="toggle"
                                checked={inv.autoEnableSoldItems}
                                onChange={(v) => inv.setSetting('autoEnableSoldItems', v)} />
                            <Row id="settings.menu.inventory.stack" type="number"
                                value={inv.stackSize} min={1} max={10}
                                onChange={(v) => inv.setSetting('stackSize', clampNumber(v, 1, 10, 10))} />
                            <Row id="settings.menu.inventory.softFlowersStack" type="number"
                                value={inv.flowersSoftStackSize} min={1} max={10}
                                onChange={(v) => inv.setSetting('flowersSoftStackSize', clampNumber(v, 1, 10, 10))} />
                            <Row id="settings.menu.inventory.enableAdditionalOptions" type="toggle"
                                checked={inv.enableAdvancedInventoryOptions}
                                onChange={(v) => inv.setSetting('enableAdvancedInventoryOptions', v)} />
                            {inv.enableAdvancedInventoryOptions && (
                                <section>
                                    <Row id="settings.menu.inventory.highlightLowAmountItems" type="toggle"
                                        checked={inv.highlightLowAmountItems}
                                        onChange={(v) => inv.setSetting('highlightLowAmountItems', v)} />
                                    <Row id="settings.menu.inventory.highlightStyle" type="select"
                                        value={inv.highlightStyle}
                                        onChange={(v) => inv.setSetting('highlightStyle', v as 'static' | 'animated')}
                                        options={[{ value: 'static' }, { value: 'animated' }]}
                                        className={inv.highlightLowAmountItems ? undefined : 'opacity-40 pointer-events-none'} />
                                </section>
                            )}
                        </section>
                    )}
                </section>
            )}

            <section>
                <SectionHeader title={t('settings.menu.pins')} />
                <Row
                    id="settings.menu.pins.placeMode"
                    type="toggle"
                    checked={placingEnabled}
                    onChange={(v) => {
                        setValue('pins', 'placingEnabled', v); if (v) {
                            ensurePinsEnabled();
                        }
                    }}
                />
                <Row id="settings.menu.pins.editMode" type="toggle" checked={editingEnabled}
                    onChange={(v) => {
                        setValue('pins', 'editingEnabled', v); if (v) {
                            ensurePinsEnabled();
                        }
                    }} />
                <Row id="settings.menu.pins.placeNew" type="action"
                    onClick={() => {
                        ensurePinsEnabled(); window.dispatchEvent(new Event(ADD_PIN_CENTER_EVENT));
                    }}>
                    <MapPin className="h-3.5 w-3.5" />
                </Row>
                <Row id="settings.menu.pins.removeAll" type="action"
                    onClick={() => setConfirmRemovePins(true)} disabled={pinsCount === 0}>
                    <Trash2 className="h-3.5 w-3.5" />
                </Row>
            </section>

            <section className="py-1">
                <SectionHeader title={t('settings.menu.general.importExport')} />
                <div className="space-y-0.5">
                    <SettingsTransfer t={t} />
                    <PinsTransfer t={t} />
                </div>
            </section>

            <ConfirmDialog id="settings.menu.general.resetEverything" open={confirmReset}
                onOpenChange={setConfirmReset} variant="danger" onConfirm={resetEverything} />
            <ConfirmDialog id="settings.menu.pins.removeAll" open={confirmRemovePins}
                onOpenChange={setConfirmRemovePins} variant="danger" onConfirm={removeAllPins} />
            <ConfirmDialog id="settings.menu.toolsFilter.clearMarkers" open={confirmClearMarkers}
                onOpenChange={setConfirmClearMarkers} variant="danger" onConfirm={() => collected.resetAll()} />
            <ConfirmDialog id="settings.menu.toolsFilter.clearImportantItems" open={confirmClearImportant}
                onOpenChange={setConfirmClearImportant} variant="danger" onConfirm={() => collected.clearImportant()} />
        </section>
    );
}
