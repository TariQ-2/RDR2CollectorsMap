"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import { ChevronLeft, ChevronRight, Calendar, Coins, MapPin, Pin, TrendingUp, Moon, Sun } from "lucide-react";
import { useMarkers } from "@/features/markers";
import { useCollected } from "@/features/collected";
import { useCycles } from "@/features/cycles";
import { useSetting, useSettings, type SideMenuTab } from "@/features/settings";
import { useTranslate } from "@/i18n";
import { useGameClock } from "@/lib/hooks/useGameClock";
import collectorsService from "@/features/collectors";
import { useCollectors } from "@/features/collectors/hooks/useCollectors";
import { useTreasures } from "@/features/treasures";
import { useInventory } from "@/features/inventory";
import { useAnimatedNumber } from "@/lib/hooks/useAnimatedNumber";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
const TAB_ORDER: Array<SideMenuTab> = ["collections", "treasures"];
type InfoIconName = "calendar" | "coins" | "map-pin" | "pin" | "progress";

const INFO_ICONS: Record<InfoIconName, ComponentType<{ className?: string }>> = {
    calendar: Calendar,
    coins: Coins,
    "map-pin": MapPin,
    pin: Pin,
    progress: TrendingUp,
};

interface InfoItemProps {
    text: string;
    icon?: InfoIconName;
    divider?: boolean;
    highlight?: boolean;
    title?: string;
}

function InfoItem({ text, icon, divider, highlight, title }: InfoItemProps) {
    const Icon = icon ? INFO_ICONS[icon] : null;
    return (
        <span title={title} className={cn("inline-flex items-center gap-1", divider && "pe-3 me-1 border-e border-border/60", highlight && "text-success font-medium")}>
            {Icon && <Icon className="h-3 w-3 opacity-60" />}
            <span className="tabular-nums">{text}</span>
        </span>
    );
}

type TimeWidgetMode = "countdown" | "time";

interface TimeWidgetProps {
    gameTime: string;
    countdown: string;
    isNight: boolean;
    mode: TimeWidgetMode;
    onClick: () => void;
    labels: { countdown: string; time: string };
    className?: string;
}

function TimeWidget({ gameTime, countdown, isNight, mode, onClick, labels, className }: TimeWidgetProps) {
    const value = mode === "countdown" ? countdown : gameTime;
    const label = mode === "countdown" ? labels.countdown : labels.time;

    return (
        <button
            onClick={onClick}
            title={`${label} — ${value}`}
            aria-label={`${label}: ${value}`}
            data-help={"general.menu.inGameTime.desc"}
            className={cn(
                "inline-flex items-center gap-1.5 shrink-0 px-1.5 py-0.5 rounded text-[12px] leading-none tabular-nums",
                "text-muted-foreground hover:bg-accent hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors",
                className,
            )}
        >
            <span aria-hidden className="flex items-center justify-center" >
                {isNight ? (
                    <Moon className="h-3 w-3 text-sky-400" />
                ) : (
                    <Sun className="h-3 w-3 text-warning" />
                )}
            </span>
            <span>{value}</span>
        </button>
    );
}

export default function SiteHeader() {
    const t = useTranslate();
    const activeTab = useSetting("core", "activeSideMenuTab");
    const setValue = useSettings((s) => s.setValue);
    const [timeMode, setTimeMode] = useState<TimeWidgetMode>("countdown");
    const cycleTimeMode = () => setTimeMode((m) => (m === "countdown" ? "time" : "countdown"));

    const clock = useGameClock();
    const goToTab = (tab: SideMenuTab) => setValue("core", "activeSideMenuTab", tab);
    const nextTab = () => {
        const i = TAB_ORDER.indexOf(activeTab);
        goToTab(TAB_ORDER[(i + 1) % TAB_ORDER.length]);
    };
    const prevTab = () => {
        const i = TAB_ORDER.indexOf(activeTab);
        goToTab(TAB_ORDER[(i - 1 + TAB_ORDER.length) % TAB_ORDER.length]);
    };

    const selectedDay = useCycles((s) => s.selectedDay);
    const localeDate = useCycles((s) => s.localeDate);
    const setLocaleDate = useCycles((s) => s.setLocaleDate);
    const language = useSettings((s) => s.core.language);
    const visibleMarkers = useMarkers((s) => s.visibleMarkers ?? []);
    const collectedTexts = useCollected((s) => s.collectedTexts);
    const collected = useMemo(() => visibleMarkers.filter((m) => collectedTexts.has(m.text)).length, [visibleMarkers, collectedTexts]);
    const total = visibleMarkers.length;
    const collections = useCollectors((s) => s.collections ?? []);
    const itemsById = useCollectors((s) => s.itemsById ?? {});
    const isInventoryEnabled = useInventory((s) => s.isEnabled);

    const totalCollectablesValue = useMemo(() => {
        if (!collections.length) {
            return 0;
        };

        const effective = (item: { itemId: string; amount: number }) => {
            if (isInventoryEnabled) {
                return itemsById[item.itemId]?.amount ?? 0;
            };

            return visibleMarkers.filter((m) => m.itemId === item.itemId && m.isCurrent && m.isCollected).length;
        };

        return collectorsService.totalValues(collections, effective);
    }, [collections, itemsById, isInventoryEnabled, visibleMarkers]);

    const animatedTotalValue = useAnimatedNumber(totalCollectablesValue, 1000);

    const treasures = useTreasures((s) => s.treasures ?? []);
    const shownIds = useTreasures((s) => s.shownIds ?? []);
    const treasuresShown = shownIds.length;
    const treasuresTotal = treasures.length;
    const totalLocations = useMemo(() => treasures.reduce((sum, tr) => sum + (tr.locations?.length ?? 0), 0), [treasures]);
    const dateText = localeDate ?? (selectedDay ? selectedDay.toLocaleDateString(undefined, { day: "numeric", month: "long" }) : "—");
    useEffect(() => {
        setLocaleDate();
    }, [language, setLocaleDate]);

    const tabLabel = activeTab === "collections" ? t("general.menu.collectables") : t("general.menu.treasures");
    return (
        <section id="siteHeader" className="top-0 z-20 p-0">
            <div className="p-1.25 pb-0 border-b">
                <h2 id="main-header" className="m-0 flex">
                    <div className="h-18.75 grow relative">
                        <div className="flex flex-col items-center justify-center h-full px-2">
                            <div className="flex w-full items-center justify-between gap-2">
                                <Button variant="ghost" size="icon" onClick={prevTab} aria-label={t("general.menu.prevSection")} className="h-8 w-8 shrink-0">
                                    <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
                                </Button>

                                <span className="flex-1 text-center text-2xl leading-none select-none">
                                    {tabLabel}
                                </span>

                                <Button variant="ghost" size="icon" onClick={nextTab} aria-label={t("general.menu.nextSection")} className="h-8 w-8 shrink-0">
                                    <ChevronRight className="h-5 w-5 rtl:rotate-180" />
                                </Button>
                            </div>

                            <div className="flex w-full items-center justify-center gap-3 pt-1 text-[12px] text-muted-foreground whitespace-nowrap">
                                {activeTab === "collections" && (
                                    <>
                                        <InfoItem text={dateText} divider />
                                        <InfoItem text={`${collected}/${total}`} divider />
                                        <InfoItem text={`$${animatedTotalValue.toFixed(2)}`} highlight />
                                    </>
                                )}

                                {activeTab === "treasures" && (
                                    <>
                                        <InfoItem text={dateText} divider />
                                        <InfoItem text={`${treasuresShown}/${treasuresTotal}`} divider />
                                        <InfoItem text={`${totalLocations}`} highlight />
                                    </>
                                )}

                                <TimeWidget
                                    gameTime={clock.gameTime}
                                    countdown={clock.countdown}
                                    isNight={clock.isNight}
                                    mode={timeMode}
                                    onClick={cycleTimeMode}
                                    labels={{ countdown: t("general.menu.cycleEndsIn"), time: t("general.menu.inGameTime") }}
                                />
                            </div>
                        </div>
                    </div>
                </h2>
            </div>
        </section>
    );
}
