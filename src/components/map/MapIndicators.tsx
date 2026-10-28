'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, X, MapPin, Copy, Check, Filter, RotateCcw } from 'lucide-react';

import { useSetting, useSettings } from "@/features/settings";
import { useMapClickStore } from "@/features/map";
import { useTranslate } from '@/i18n';

export default function MapIndicators() {
    const t = useTranslate();
    const [showCycleAlert, setShowCycleAlert] = useState(false);
    const [copied, setCopied] = useState(false);

    const toolType = useSetting('collectors', 'toolType');
    const filterType = useSetting('collectors', 'filterType');
    const hasToolFilter = toolType !== 3;
    const hasTypeFilter = filterType !== 'none';
    const filterCount = Number(hasToolFilter) + Number(hasTypeFilter);

    const filterSignature = `${toolType}|${filterType}`;
    const [dismissedSignature, setDismissedSignature] = useState<string | null>(null);
    const filterDismissed = dismissedSignature === filterSignature;

    const lat = useMapClickStore((s) => s.lat);
    const lng = useMapClickStore((s) => s.lng);
    const coordsVisible = useMapClickStore((s) => s.visible);
    const hideCoords = useMapClickStore((s) => s.hide);

    useEffect(() => {
        const handleCycleNotFound = () => setShowCycleAlert(true);
        const handleCycleFound = () => setShowCycleAlert(false);
        window.addEventListener('cycleNotFound', handleCycleNotFound);
        window.addEventListener('cycleFound', handleCycleFound);
        return () => {
            window.removeEventListener('cycleNotFound', handleCycleNotFound);
            window.removeEventListener('cycleFound', handleCycleFound);
        };
    }, []);

    const copyCoords = async () => {
        if (lat == null || lng == null) {
            return;
        }
        try {
            await navigator.clipboard.writeText(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
        } catch { /*  */ }
    };

    const clearFilters = () => {
        const s = useSettings.getState();
        s.setValue('collectors', 'toolType', 3);
        s.setValue('collectors', 'filterType', 'none');
    };

    const showFilterAlert = filterCount > 0 && !filterDismissed;

    return (
        <div className="pointer-events-none fixed bottom-4 inset-s-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">

            {showCycleAlert && (
                <div role="alert" aria-live="assertive" className="pointer-events-auto flex items-center gap-2 rounded border border-amber-500/40 bg-amber-950/85 px-3.5 py-1.5 text-xs font-medium text-amber-200 shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <AlertTriangle className="size-3.5 shrink-0" />
                    <span className="whitespace-nowrap">
                        {t("general.map.refreshForUpdatesAlert")}
                    </span>
                </div>
            )}

            {showFilterAlert && (
                <div role="status" aria-live="polite" className="pointer-events-auto flex items-center gap-1 rounded border border-sky-500/40 bg-sky-950/85 py-1 ps-3 pe-1 text-xs font-medium text-sky-200 shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <Filter className="size-3.5 shrink-0" />
                    <span className="whitespace-nowrap">
                        {
                            filterCount === 2 ? `${filterCount} ${t("general.map.filtersActive")}` : hasToolFilter ? (t("general.map.filterTool")) : (t("general.map.filterType"))
                        }
                    </span>
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="ms-1 flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold transition-colors hover:bg-sky-500/25"
                        title={t("general.reset")}
                    >
                        <RotateCcw className="size-3" />
                        <span>{t("general.reset")}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setDismissedSignature(filterSignature)}
                        className="flex size-5 items-center justify-center rounded-full transition-colors hover:bg-sky-500/25"
                        aria-label={t("general.close")}
                    >
                        <X className="size-3" />
                    </button>
                </div>
            )}

            {coordsVisible && (
                <div role="region" aria-label="Coordinates" className="pointer-events-auto flex items-center gap-1.5 rounded border border-border/60 bg-card/95 py-1 ps-3 pe-1 shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <MapPin className="size-3.5 shrink-0 text-primary" />
                    <span className="font-mono text-xs font-semibold tabular-nums text-foreground">
                        {lat != null ? lat.toFixed(4) : "—"}
                        <span className="mx-1 text-muted-foreground/40">·</span>
                        {lng != null ? lng.toFixed(4) : "—"}
                    </span>
                    <button
                        type="button"
                        onClick={copyCoords}
                        disabled={lat == null || lng == null}
                        className="flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
                        aria-label={t("map.copy")}
                        title={t("map.copy")}
                    >
                        {copied
                            ? <Check className="size-3 text-success" />
                            : <Copy className="size-3" />
                        }
                    </button>
                    <button
                        type="button"
                        onClick={hideCoords}
                        className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                        aria-label={t("general.close")}
                    >
                        <X className="size-3" />
                    </button>
                </div>
            )}
        </div>
    );
}
