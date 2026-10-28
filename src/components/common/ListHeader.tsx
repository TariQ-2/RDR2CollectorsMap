"use client";

import { useSyncExternalStore } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslate } from "@/i18n";
import { Button } from "@/components/ui/button";
const useIsMounted = () => useSyncExternalStore(() => () => {}, () => true, () => false);

export interface ListHeaderProps {
    onHideAll: () => void;
    onShowAll: () => void;
    hideDisabled: boolean;
    showDisabled: boolean;
}

export default function ListHeader({ onHideAll, onShowAll, hideDisabled, showDisabled }: ListHeaderProps) {
    const t = useTranslate();
    const mounted = useIsMounted();
    const hideActive = mounted ? hideDisabled : false;
    const showActive = mounted ? showDisabled : false;

    const base =
        "flex-1 flex items-center justify-center gap-1.5 h-8 px-3 " +
        "text-xs font-medium select-none transition-colors " +
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset";

    const active   = "bg-primary text-primary-foreground shadow-sm font-semibold";
    const inactive = "text-muted-foreground bg-muted/50 hover:bg-accent hover:text-foreground";
    const disabled = "opacity-40 cursor-not-allowed";
    return (
        <div className="px-1 pb-1.5 border-b border-border">
            <div role="group" className="grid grid-cols-2 gap-0.5 p-0.5 rounded bg-muted/70 border border-border/60">
                <Button onClick={hideActive ? undefined : onHideAll}
                    disabled={hideActive}
                    aria-pressed={hideActive}
                    className={cn(base, "rounded", hideActive ? active : inactive, !hideActive && !onHideAll && disabled)}
                >
                    <EyeOff className="h-3.5 w-3.5" />
                    {t("general.menu.hideAll")}
                </Button>

                <Button
                    onClick={showActive ? undefined : onShowAll}
                    disabled={showActive}
                    aria-pressed={showActive}
                    className={cn(base, "rounded", showActive ? active : inactive)}
                >
                    <Eye className="h-3.5 w-3.5" />
                    {t("general.menu.showAll")}
                </Button>
            </div>
        </div>
    );
}
