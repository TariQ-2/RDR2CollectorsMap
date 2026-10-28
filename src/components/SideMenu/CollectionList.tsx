"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { CATEGORY_VALUES, COLLECTIBLE_GROUPS } from "@/data/collectibles";
import { useTranslate } from "@/i18n";
import { useMarkers } from "@/features/markers";
import { useSetting } from "@/features/settings";
import collectorsService from "@/features/collectors";
import { collected, useCollected } from "@/features/collected";
import { useCollectors } from "@/features/collectors/hooks/useCollectors";
import { useInventory } from "@/features/inventory";
import type { MarkerCategory, MarkerData } from "@/types/marker";
import ListHeader from "@/components/common/ListHeader";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { cn } from "@/lib/utils";
import { ChevronDown, Loader2, Minus, Plus, RotateCcw } from "lucide-react";
import { Button } from "../ui/button";
import { useCollectorsWeekly } from "@/features/collectors/hooks/useCollectorsWeekly";
import SectionHeader from "../common/SectionHeader";
import { Row } from "../common/Row";

const PARENT_CATEGORIES: Record<string, string> = {
    coastal:    "fossils_random",
    oceanic:    "fossils_random",
    megafauna:  "fossils_random",
    bracelet:   "jewelry_random",
    earring:    "jewelry_random",
    necklace:   "jewelry_random",
    ring:       "jewelry_random",
};

function buildSubTree<T extends { id: string }>(subs: ReadonlyArray<T>) {
    const ids = new Set(subs.map((s) => s.id));
    const childrenOf = new Map<string, Array<T>>();
    const roots: Array<T> = [];

    for (const sub of subs) {
        const parentId = PARENT_CATEGORIES[sub.id];
        if (parentId && ids.has(parentId) && parentId !== sub.id) {
            const arr = childrenOf.get(parentId) ?? [];
            arr.push(sub);
            childrenOf.set(parentId, arr);
        } else {
            roots.push(sub);
        };
    };
    return { roots, childrenOf };
};

function buildMarkerIndex(allMarkers: Array<MarkerData>) {
    const byItemId = new Map<string, Array<MarkerData>>();
    const byText = new Map<string, Array<MarkerData>>();

    for (const m of allMarkers) {
        if (!m.isCurrent) {
            continue;
        };

        const a = byItemId.get(m.itemId);
        if (a) {
            a.push(m);
        } else {
            byItemId.set(m.itemId, [m]);
        };

        const b = byText.get(m.text);
        if (b) {
            b.push(m);
        } else {
            byText.set(m.text, [m]);
        };
    };

    return { byItemId, byText };
};

interface CategoryStats {
    total: number;
    collected: number;
}

interface ResolvedItem {
    itemId: string;
    // itemTranslationKey: string;
    displayName?: string;
    iconUrl?: string;
    icon?: string;
    category: MarkerCategory;
    markers: Array<MarkerData>;
    isCollected: boolean;
    isImportant: boolean;
    hasLocationToday: boolean;
}

function resolveProgress(stats?: CategoryStats): "empty" | "partial" | "complete" {
    if (!stats || stats.total === 0 || stats.collected === 0) {
        return "empty";
    };

    if (stats.collected >= stats.total) {
        return "complete";
    };

    return "partial";
}

function useCollectionGroups() {
    const t = useTranslate();
    const collections = useCollectors((s) => s.collections);
    const itemsById = useCollectors((s) => s.itemsById);
    const allMarkers = useMarkers((s) => s.allMarkers);
    const sortAlphabetically = useSetting("collectors", "sortItemsAlphabetically");
    const isInventoryEnabled = useInventory((s) => s.isEnabled);
    const importantItemIds = useCollected((s) => s.importantItemIds);
    const collectedTexts = useCollected((s) => s.collectedTexts);

    return useMemo(() => {
        const { byItemId, byText } = buildMarkerIndex(allMarkers);
        const itemsByCategory = new Map<MarkerCategory, Array<ResolvedItem>>();
        const stats: Record<string, CategoryStats> = {};

        for (const collection of collections) {
            const items: Array<ResolvedItem> = [];
            let collectedCount = 0;
            const isRandom = collection.category === "random";
            for (const item of collection.items) {
                const matchingMarkers = isRandom ? byText.get(item.itemId) ?? [] : byItemId.get(item.itemId) ?? [];
                if (isRandom && matchingMarkers.length === 0) {
                    continue;
                }

                const model = itemsById[item.itemId];
                const amount = model?.amount ?? 0;
                const anyCollected = matchingMarkers.some((m) => collectedTexts.has(m.text));
                const isCollected = isInventoryEnabled ? amount > 0 : matchingMarkers.length > 0 && matchingMarkers.every((m) => collectedTexts.has(m.text));
                const isImportant = importantItemIds.has(item.itemId);
                const firstMarker = matchingMarkers[0];
                const tool = model?.tool ?? firstMarker?.tool;

                items.push({
                    itemId: item.itemId,
                    displayName: model?.displayName,
                    iconUrl: isRandom ? tool === 1 ? "/RDR2CollectorsMap/assets/images/shovel.png" : tool === 2 ? "/RDR2CollectorsMap/assets/images/magnet.png" : "/RDR2CollectorsMap/assets/images/icons/random.png" : undefined,
                    icon: model?.icon,
                    category: collection.category as MarkerCategory,
                    markers: matchingMarkers,
                    isCollected,
                    isImportant,
                    hasLocationToday: matchingMarkers.length > 0,
                });

                if (isCollected || anyCollected) {
                    collectedCount++;
                };
            };

            stats[collection.category] = { total: items.length, collected: collectedCount };
            itemsByCategory.set(collection.category as MarkerCategory, items);
        };

        if (sortAlphabetically) {
            for (const bucket of itemsByCategory.values()) {
                bucket.sort((a, b) =>
                    t(a.itemId).localeCompare(t(b.itemId)),
                );
            };
        };

        return { itemsByCategory, stats };
    }, [collections, itemsById, allMarkers, sortAlphabetically, isInventoryEnabled, importantItemIds, collectedTexts, t]);
}

function useOpenedCategories() {
    const [opened, setOpened] = useState<ReadonlySet<string>>(() => {
        if (typeof window === "undefined") {
            return new Set();
        };
        try {
            const saved = localStorage.getItem("rdr2collector.openedCategories");
            if (saved) {
                return new Set(JSON.parse(saved));
            };
        } catch {}
        return new Set();
    });

    const toggle = useCallback((id: string) => {
        setOpened((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            };

            if (typeof window !== "undefined") {
                localStorage.setItem(
                    "rdr2collector.openedCategories",
                    JSON.stringify(Array.from(next)),
                );
            };
            return next;
        });
    }, []);

    return { opened, toggle };
};

function useItemHandlers() {
    const toggleImportant = useCollected((s) => s.toggleImportant);

    const handleItemClick = useCallback((item: ResolvedItem) => {
        const inventoryEnabled = useInventory.getState().isEnabled;
        const currentCollected = useCollected.getState().collectedTexts;

        if (item.markers.length > 0) {
            const freshAmount = collectorsService.itemsById[item.itemId]?.amount ?? 0;
            const isCollectedNow = inventoryEnabled ? freshAmount > 0 : item.markers.every((m) => currentCollected.has(m.text));
            const shouldBeCollected = !isCollectedNow;

            const texts = item.markers.filter((m) => currentCollected.has(m.text) !== shouldBeCollected).map((m) => m.text);
            if (texts.length === 0) {
                return;
            };

            collected.toggleBatch(texts);
            return;
        };

        if (inventoryEnabled) {
            const freshAmount = collectorsService.itemsById[item.itemId]?.amount ?? 0;
            collectorsService.changeAmount(item.itemId, freshAmount === 0 ? +1 : -1);
        };
    }, []);

    const handleItemContextMenu = useCallback(
        (e: React.MouseEvent, item: ResolvedItem) => {
            e.preventDefault();
            e.stopPropagation();
            if (!item.hasLocationToday || item.category === "random") {
                return;
            };
            toggleImportant(item.itemId);
        },
        [toggleImportant],
    );

    return { handleItemClick, handleItemContextMenu };
};

export default function CollectionList() {
    const { itemsByCategory, stats } = useCollectionGroups();
    const { opened, toggle } = useOpenedCategories();
    const { handleItemClick, handleItemContextMenu } = useItemHandlers();
    const [pendingResetCategory, setPendingResetCategory] = useState<string | null>(null);

    const toggleCategory = useMarkers((s) => s.toggleCategory);
    const enabledCategories = useMarkers((s) => s.enabledCategories);
    const isInventoryEnabled = useInventory((s) => s.isEnabled);
    const stackSize = useInventory((s) => s.stackSize);
    const t = useTranslate();

    const enableCollection = useCallback(() => useMarkers.getState().enableGroup("collectibles"), []);
    const disableCollection = useCallback(() => useMarkers.getState().disableGroup("collectibles"), []);
    const isCollectionEnabled = useMarkers((s) => s.isGroupEnabled("collectibles"));
    const isCollectionDisabled = useMarkers((s) => s.isGroupDisabled("collectibles"));

    const currentId = useCollectorsWeekly((s) => s.currentId);
    const items = useCollectorsWeekly((s) => s.items);
    const value = useCollectorsWeekly((s) => s.value);
    const itemsById = useCollectors((s) => s.itemsById);
    const isLoading = useCollectorsWeekly((s) => s.isLoading);
    const load = useCollectorsWeekly((s) => s.load);

    useEffect(() => {
        load();
    }, [load]);

    return (
        <div className="py-1">
            <ListHeader onHideAll={disableCollection} onShowAll={enableCollection} hideDisabled={isCollectionDisabled} showDisabled={isCollectionEnabled} />
            {COLLECTIBLE_GROUPS.map((group) => {
                const { roots, childrenOf } = buildSubTree(group.subCategories);
                type Sub = (typeof group.subCategories)[number];
                const renderSub = (sub: Sub) => {
                    const subItems = itemsByCategory.get(sub.id) ?? [];
                    const subStats = stats[sub.id] ?? { total: 0, collected: 0 };
                    const isEnabled = enabledCategories.has(sub.id);
                    const hasChildren = subItems.length > 0;
                    const progress = resolveProgress(subStats);

                    const counterClass = cn(
                        "text-xs font-medium tabular-nums",
                        progress === "empty" && "text-muted-foreground",
                        progress === "partial" && "text-foreground",
                        progress === "complete" && "text-success font-semibold",
                    );

                    const valueClass = cn(
                        "text-xs tabular-nums",
                        progress === "empty" && "text-muted-foreground/70",
                        progress === "partial" && "text-foreground/80",
                        progress === "complete" && "text-success font-semibold",
                    );

                    const subChildren = childrenOf.get(sub.id) ?? [];
                    const hasSubChildren = subChildren.length > 0;
                    return (
                        <Fragment key={sub.id}>
                            <Row
                                id={sub.labelKey}
                                type="menu"
                                icon={`/RDR2CollectorsMap/assets/images/icons/${sub.icon}.png`}
                                label={t(sub.labelKey)}
                                active={isEnabled}
                                onClick={() => toggleCategory(sub.id)}
                                helpKey="collectables.menu.item_category.desc"
                                className={cn(!!PARENT_CATEGORIES[sub.id] && "text-primary", hasSubChildren && "font-semibold")}
                                trailing={
                                    <div className="flex items-center gap-2">
                                        {CATEGORY_VALUES[sub.id] !== undefined && subStats.total > 0 && (
                                            <>
                                                <span className={cn(counterClass, "w-5 text-right")}>
                                                    {subStats.collected}/{subStats.total}
                                                </span>
                                                <span className={cn(valueClass, "w-14 text-right")}>
                                                    ${CATEGORY_VALUES[sub.id].toFixed(2)}
                                                </span>
                                            </>
                                        )}

                                        <Button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggle(sub.id);
                                            }}
                                            aria-expanded={opened.has(sub.id)}
                                            aria-label={t("collectables.menu.toggleList")}
                                            variant="ghost"
                                            className="h-6 w-6 p-0 flex items-center justify-center rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", opened.has(sub.id) && "rotate-180")} />
                                        </Button>
                                    </div>
                                }
                            />
                            {opened.has(sub.id) && (
                                <div className="ms-2 mt-1 mb-2 space-y-0.5 border-s border-border ps-2">
                                    {hasChildren ? (
                                        subItems.map((item, idx) => {
                                            const name = item.displayName ?? t(item.itemId);
                                            const model = collectorsService.itemsById[item.itemId];
                                            const amount = model?.amount ?? 0;
                                            const isMissingToday = !item.hasLocationToday;
                                            const inventoryEnabled = isInventoryEnabled;

                                            const handleClick = () => handleItemClick(item);
                                            const handleContextMenu = (e: React.MouseEvent) => handleItemContextMenu(e, item);
                                            const handleKey = (e: React.KeyboardEvent) => {
                                                if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    handleClick();
                                                }
                                            };
                                            const handleIncrement = (e: React.MouseEvent) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                collectorsService.changeAmount(item.itemId, +1);
                                            };
                                            const handleDecrement = (e: React.MouseEvent) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                collectorsService.changeAmount(item.itemId, -1);
                                            };

                                            return (
                                                <div
                                                    key={`${item.itemId}-${idx}`}
                                                    role="button"
                                                    data-help="collectables.menu.item.desc"
                                                    tabIndex={0}
                                                    aria-pressed={item.isCollected}
                                                    aria-label={name}
                                                    onClick={handleClick}
                                                    onKeyDown={handleKey}
                                                    onContextMenu={handleContextMenu}
                                                    title={name}
                                                    className={cn(
                                                        "group flex items-center gap-2",
                                                        "px-2 py-1 rounded cursor-pointer",
                                                        "transition-colors hover:bg-accent/40",
                                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                                                        item.isImportant && "bg-destructive/15",
                                                    )}
                                                >
                                                    <div
                                                        aria-hidden="true"
                                                        className={cn(
                                                            "relative shrink-0 h-6 w-6 flex items-center justify-center",
                                                            "rounded-md border text-[11px] font-semibold tabular-nums leading-none select-none",
                                                            "transition-colors duration-150",
                                                            item.isCollected && "bg-muted/40 border-border/50 text-muted-foreground/60",
                                                            !item.isCollected && isMissingToday && "bg-destructive/10 border-destructive/30 text-destructive",
                                                            !item.isCollected && !isMissingToday && "bg-secondary/80 border-border text-foreground/85",
                                                        )}
                                                    >
                                                        {idx + 1}
                                                    </div>

                                                    <span
                                                        className={cn(
                                                            "text-sm truncate flex-1",
                                                            item.isCollected && "text-muted-foreground line-through",
                                                            isMissingToday &&
                                                                !item.isCollected &&
                                                                "text-muted-foreground line-through decoration-destructive decoration-2",
                                                            !item.isCollected &&
                                                                !isMissingToday &&
                                                                "text-foreground",
                                                        )}
                                                    >
                                                        {name}
                                                    </span>

                                                    {inventoryEnabled && (
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-5 w-5 rounded hover:bg-destructive/20 text-destructive"
                                                                onClick={handleDecrement}
                                                                disabled={amount === 0}
                                                                aria-label={t("collectables.menu.decrease")}
                                                            >
                                                                <Minus className="h-3 w-3" />
                                                            </Button>

                                                            <span
                                                                aria-live="polite"
                                                                className={cn(
                                                                    "min-w-6 text-center text-xs font-semibold tabular-nums",
                                                                    amount >= stackSize && "text-warning",
                                                                    amount > 0 && amount < stackSize && "text-success",
                                                                    amount === 0 && "text-muted-foreground",
                                                                )}
                                                            >
                                                                {amount}
                                                            </span>

                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-5 w-5 rounded hover:bg-success/20 text-success"
                                                                onClick={handleIncrement}
                                                                disabled={amount >= stackSize}
                                                                aria-label={t("collectables.menu.increase")}
                                                            >
                                                                <Plus className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <p className="text-xs text-muted-foreground text-center py-2">
                                            {t("general.noItems")}
                                        </p>
                                    )}

                                    {hasChildren && (
                                        <Button
                                            disabled={subStats.collected === 0}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setPendingResetCategory(sub.id);
                                            }}
                                            data-help="collectables.menu.reset.category.desc"
                                            className={cn(
                                                "w-full mt-2 flex items-center justify-center gap-1.5",
                                                "px-3 py-1.5 rounded-md text-xs font-medium",
                                                "border border-dashed border-destructive/50",
                                                "bg-destructive/15 text-destructive",
                                                "hover:bg-destructive/20 hover:border-destructive/60",
                                                "transition-colors",
                                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40",
                                                subStats.collected === 0 &&
                                                    "opacity-40 cursor-not-allowed hover:bg-transparent hover:border-border hover:text-muted-foreground",
                                            )}
                                        >
                                            <RotateCcw className="h-3 w-3" />
                                            {t("collectables.menu.reset.category")}
                                        </Button>
                                    )}
                                    {hasSubChildren && subChildren.map((child) => renderSub(child))}
                                </div>
                            )}
                        </Fragment>
                    );
                };
                return (
                    <div key={group.id} className="space-y-1 pt-1">
                        {roots.map((sub) => renderSub(sub))}
                    </div>
                );
            })}

            <section className={"-mx-1.5 px-1.5 select-none shrink-0"}>
                <SectionHeader title={t(`weekly.desc.${currentId}`)} />
                {isLoading ? (
                    <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground"/>
                    </div>
                ) : (
                    <div>
                        <p className="mx-3 mb-3.5 text-center text-[14px] transition-[filter] duration-300">
                            <span className="italic text-muted-foreground">
                                {t(`weekly.flavor.${currentId}`)}
                            </span>{" "}
                            <span>
                                {t("collectables.menu.weeklyItemDescription", { value: value.toFixed(2) })}
                            </span>
                        </p>
                        <hr className="my-2 border-border/40" />
                        <div className="p-1.5 space-y-0.5">
                            {items.map((item, idx) => {
                                const amount = itemsById[item.itemId]?.amount ?? 0;
                                return (
                                    <Row
                                        key={`${item.itemId}-${idx}`}
                                        type={"menu"}
                                        icon={item.icon}
                                        label={t(item.name)}
                                        active={amount > 0}
                                        helpKey="general.help.weeklyItem"
                                        trailing={
                                            isInventoryEnabled ? (
                                                <span
                                                    aria-live="polite"
                                                    className={cn(
                                                        "min-w-6 text-center text-xs font-semibold tabular-nums",
                                                        amount >= stackSize && "text-warning",
                                                        amount > 0 && amount < stackSize && "text-success",
                                                        amount === 0 && "text-muted-foreground",
                                                    )}
                                                >
                                                    {amount}
                                                </span>

                                            ) : undefined
                                        }
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </section>
            <ConfirmDialog
                id={'collectables.menu.reset.category'}
                open={pendingResetCategory ? true : false}
                onOpenChange={(open) => {
                    if (!open) {
                        setPendingResetCategory(null);
                    }
                }}
                variant="danger"
                onConfirm={() => {
                    if (pendingResetCategory === null) {
                        return;
                    }
                    const textsToReset = useMarkers.getState().allMarkers.filter((m) => m.category === pendingResetCategory).map((m) => m.text);
                    collected.reset(textsToReset);
                }}
            />
        </div>
    );
}
