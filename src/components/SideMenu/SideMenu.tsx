"use client";
import * as React from "react";
import { AlertTriangle, ExternalLink } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter } from "@/components/ui/sidebar";
import SiteHeader from "./SiteHeader";
import CollectionList from "@/components/SideMenu/CollectionList";
import TreasureList from "@/components/SideMenu/TreasureList";
import SettingsContent from "@/components/SideMenu/Settings";
import { useSetting, useSettings } from "@/features/settings";
import SearchBox from "@/components/SideMenu/SearchBox";
import { languageDir, useTranslate } from "@/i18n";
import SectionHeader from "@/components/common/SectionHeader";
import { Row } from "@/components/common/Row";
import { useEffect, useState } from "react";
import type { MarkerCategory } from "@/types/marker";
import { useMarkers } from "@/features/markers";
import { useNazar } from "@/features/nazar";

const UTILITIES: ReadonlyArray<{ id: string; category: MarkerCategory; Icon: string; }> = [
    {
        id: "general.menu.madamNazar",
        category: "nazar",
        Icon: "/RDR2CollectorsMap/assets/images/icons/nazar.png",
    },
    {
        id: "general.menu.fastTravel",
        category: "fast_travel",
        Icon: "/RDR2CollectorsMap/assets/images/icons/fast_travel.png",
    },
    {
        id: "general.menu.userPins",
        category: "user_pins",
        Icon: "/RDR2CollectorsMap/assets/images/icons/pin.png",
    },
];

export function SideMenu({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const activeTab = useSettings((s) => s.core.activeSideMenuTab);
    const t = useTranslate();
    const language = useSetting('core', 'language');
    const dir = languageDir(language);
    const [helpKey, setHelpKey] = useState<string | null>(null);

    useEffect(() => {
        const handleOver = (e: MouseEvent) => {
            const target = (e.target as HTMLElement).closest<HTMLElement>("[data-help]");
            if (!target) {
                return;
            };

            const related = e.relatedTarget as HTMLElement | null;
            if (related && target.contains(related)) {
                return;
            };

            const key = target.getAttribute("data-help");
            if (key) {
                setHelpKey(key);
            };
        };

        const handleOut = (e: MouseEvent) => {
            const target = (e.target as HTMLElement).closest<HTMLElement>("[data-help]");
            if (!target) {
                return;
            };

            const related = e.relatedTarget as HTMLElement | null;
            if (related && target.contains(related)) {
                return;
            };

            setHelpKey(null);
        };

        document.addEventListener("mouseover", handleOver);
        document.addEventListener("mouseout", handleOut);
        return () => {
            document.removeEventListener("mouseover", handleOver);
            document.removeEventListener("mouseout", handleOut);
        };
    }, []);

    const enabled = useMarkers((s) => s.enabledCategories);
    const toggle = useMarkers((s) => s.toggleCategory);
    const nazarIsLoading = useNazar((s) => s.isLoading);
    const nazarLocation = useNazar((s) => s.currentLocation);
    const nazarError = useNazar((s) => s.error);
    const nazarHasProblem = !nazarIsLoading && (nazarLocation == null || nazarError != null);
    return (
        <Sidebar side={dir === "ltr" ? "left" : "right"} collapsible="offcanvas" {...props} >
            <SiteHeader />
            <SearchBox />
            <SidebarContent className="px-2">
                {activeTab === "collections" &&
                    <CollectionList />
                }

                {activeTab === "treasures" &&
                    <TreasureList />
                }
                <section>
                    <SectionHeader title={t("general.menu.utils")} />
                    <div className="space-y-0.5">
                        {UTILITIES.map((u) => {
                            const hasProblem = u.category === "nazar" && nazarHasProblem;
                            return (
                                <Row
                                    key={u.category}
                                    type='menu'
                                    id={u.id}
                                    icon={u.Icon}
                                    active={enabled.has(u.category)}
                                    onClick={() => toggle(u.category)}
                                    trailing={
                                        hasProblem ? (
                                            <span title={t("map.madam_nazar.unknown")} aria-label={t("map.madam_nazar.unknown")} className="flex items-center justify-center">
                                                <AlertTriangle className="h-4 w-4 text-warning animate-pulse" />
                                            </span>
                                        ) : undefined
                                    }
                                />
                            );
                        })}
                    </div>
                </section>
                <SettingsContent activeTab={activeTab} />
                <section>
                    <SectionHeader title={t("general.menu.informationLinks")} />
                    <div className="space-y-0.5">
                        <Row id="general.menu.reportIssues" type="action" onClick={() => window.open("https://github.com/TariQ-2/RDR2CollectorsMap/issues", "_blank", "noopener,noreferrer")}>
                            <ExternalLink className="h-3.5 w-3.5" />
                        </Row>
                    </div>
                </section>
            </SidebarContent>
            <SidebarFooter className="p-0 m-0">
                <div className="p-0.5 border-t border-border">
                    <div id="helpContainer" className="h-15 bg-no-repeat bg-size-[100%_100%] px-6.25 py-2 text-xs text-muted-foreground overflow-hidden flex items-center justify-center">
                        <p className="w-full text-center text-sm leading-snug line-clamp-2 wrap-break-word" title={helpKey ? t(`${helpKey}`) : t("general.help.default")}>
                            {helpKey ? t(`${helpKey}`) : t("general.help.default")}
                        </p>
                    </div>
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}
