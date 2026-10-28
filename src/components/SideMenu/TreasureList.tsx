"use client";

import { useCallback, useMemo } from "react";
import { AlertTriangle } from "lucide-react";
import { useTranslate } from "@/i18n";
import { useMarkers } from "@/features/markers";
import { useTreasures } from "@/features/treasures";
import { cn } from "@/lib/utils";
import ListHeader from "@/components/common/ListHeader";
import ListSkeleton from "@/components/common/ListSkeleton";
import { Row } from "../common/Row";

export default function TreasureList() {
    const t = useTranslate();
    const enableTreasures = useCallback(() => {
        useTreasures.getState().showAll(true);
    }, []);

    const disableTreasures = useCallback(() => {
        useTreasures.getState().showAll(false);
    }, []);
    const treasures = useTreasures((s) => s.treasures);
    const shownIds = useTreasures((s) => s.shownIds);
    const setShown = useTreasures((s) => s.setShown);
    const isLoading = useTreasures((s) => s.isLoading);
    const error = useTreasures((s) => s.error);
    const shownSet = useMemo(() => new Set(shownIds), [shownIds]);
    const isAllShown = treasures.length > 0 && shownIds.length === treasures.length;
    const isAllHidden = shownIds.length === 0;

    if (error) {
        return (
            <div className="py-3 px-3 flex items-center gap-2 text-destructive text-xs">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>
                    {t("menu.treasures_load_failed")}
                </span>
            </div>
        );
    }

    if (isLoading) {
        return <ListSkeleton rows={6} />;
    }

    if (!treasures.length) {
        return null;
    }

    return (
        <div className="py-1">
            <ListHeader
                onHideAll={disableTreasures}
                onShowAll={enableTreasures}
                hideDisabled={isAllHidden}
                showDisabled={isAllShown}
            />

            <div className={"space-y-0.5 pt-1"}>
                {treasures.map((treasure) => {
                    const shown = shownSet.has(treasure.id);
                    const locCount = treasure.locations.length;

                    return (
                        <Row
                            key={treasure.id}
                            type="menu"
                            icon="/RDR2CollectorsMap/assets/images/icons/treasure.png"
                            label={t(`treasures.map.${treasure.id}`)}
                            helpKey="collectables.menu.item.category.desc"
                            active={shown}
                            onClick={() => {
                                if (!shown) {
                                    useMarkers.getState().enable.category("treasure");
                                };
                                setShown(treasure.id, !shown);
                            }}
                            trailing={
                                <div className={cn("flex items-center gap-2")}>
                                    <span className="text-xs font-medium tabular-nums text-muted-foreground">
                                        {`${locCount} ${locCount === 1 ? t("general.site") : t("general.sites")}`}
                                    </span>
                                </div>
                            }
                        />
                    );
                })}
            </div>
        </div>
    );
}
