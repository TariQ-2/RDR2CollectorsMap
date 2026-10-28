"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Link as LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMarkers } from "@/features/markers";
import { useSettings } from "@/features/settings";
import { useTranslate } from "@/i18n";
import { useFuseSearch } from "@/features/markers/hooks/useFuseSearch";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import type { IndexedSearchItem } from '@/features/markers/hooks/useFuseSearch';

function getSuggestions(query: string, fuse: ReturnType<typeof useFuseSearch>, limit = 15): Array<IndexedSearchItem> {
    if (!query.trim() || query.endsWith(";")) {
        return [];
    };

    const parts = query.toLowerCase().split(";").map((q) => q.trim());
    const last = parts[parts.length - 1];
    if (!last) {
        return [];
    };

    const seen = new Set<string>();
    const entries: Array<IndexedSearchItem> = [];
    for (const r of fuse.search(last)) {
        if (seen.has(r.item.id)) {
            continue;
        };

        seen.add(r.item.id);
        entries.push(r.item);
        if (entries.length >= limit) {
            break;
        }
    }
    return entries;
}

export default function SearchBox() {
    const t = useTranslate();
    const inputRef = useRef<HTMLInputElement>(null);
    const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const searchQuery = useMarkers((s) => s.searchQuery);
    const setSearchQuery = useMarkers((s) => s.setSearchQuery);
    const visibleMarkers = useMarkers((s) => s.visibleMarkers);
    const recompute = useMarkers((s) => s.recomputeVisible);

    const filterType = useSettings((s) => s.collectors.filterType);
    const setSetting = useSettings((s) => s.setSetting);

    const fuse = useFuseSearch();
    const debouncedQuery = useDebounce(searchQuery, 250);

    const [copied, setCopied] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const suggestions = useMemo(() => getSuggestions(debouncedQuery, fuse), [debouncedQuery, fuse]);

    const updateQuery = useCallback(
        (value: string) => {
            setSearchQuery(value);
            setSelectedIndex(-1);
        },
        [setSearchQuery],
    );

    useEffect(() => {
        return () => {
            if (blurTimerRef.current) {
                clearTimeout(blurTimerRef.current);
            }
        };
    }, []);

    const copyLink = useCallback(async () => {
        try {
            const cleaned = searchQuery.replace(/;\s*$/, "").trim();
            const url = `${window.location.origin}/RDR2CollectorsMap/?search=${encodeURIComponent(cleaned)}`;
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch (err) {
            console.error("[SearchBox] Copy failed", err);
        }
    }, [searchQuery]);

    const clearSearch = useCallback(() => {
        updateQuery("");
        inputRef.current?.focus();
    }, [updateQuery]);

    const applySuggestion = useCallback(
        (entry: IndexedSearchItem) => {
            if (!entry.group) {
                const parts = searchQuery.split(";").map((p) => p.trim()).filter(Boolean);
                if (parts.includes(entry.label)) {
                    return;
                };

                const base = parts.length > 0 ? parts.join("; ") + "; " : "";
                setSearchQuery(`${base}${entry.label}; `);
                setSelectedIndex(-1);
                setShowSuggestions(false);
                inputRef.current?.focus();
                return;
            };

            entry.onSelect();
            setShowSuggestions(false);
        },
        [searchQuery, setSearchQuery],
    );

    const handleBlur = useCallback(() => {
        if (blurTimerRef.current) {
            clearTimeout(blurTimerRef.current);
        }
        blurTimerRef.current = setTimeout(
            () => setShowSuggestions(false),
            150,
        );
    }, []);

    useEffect(() => {
        if (!debouncedQuery.trim() || filterType === "none") {
            return;
        };

        const previous = filterType;
        setSetting("collectors", { filterType: "none" });
        return () => {
            setSetting("collectors", { filterType: previous });
            recompute();
        };
    }, [debouncedQuery, filterType, setSetting, recompute]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.code === "KeyF") {
                if (useSettings.getState().core.overrideBrowserSearch) {
                    e.preventDefault();
                    e.stopPropagation();
                    inputRef.current?.focus();
                    inputRef.current?.select();
                }
            }
        };

        document.addEventListener("keydown", handler, { capture: true });
        return () => document.removeEventListener("keydown", handler, { capture: true });
    }, []);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            const count = suggestions.length;

            if (e.key === "Escape") {
                inputRef.current?.blur();
                setShowSuggestions(false);
                return;
            }

            if (!showSuggestions || count === 0) {
                return;
            }

            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((i) => (i + 1) % count);
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((i) => (i - 1 + count) % count);
            } else if (e.key === "Enter" && selectedIndex >= 0) {
                e.preventDefault();
                applySuggestion(suggestions[selectedIndex]);
            }
        },
        [showSuggestions, selectedIndex, suggestions, applySuggestion],
    );

    return (
        <div className="px-3 py-2 space-y-1.5">
            <div className="relative group">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
                <Input
                    ref={inputRef}
                    type="text"
                    id="search"
                    value={searchQuery}
                    onChange={(e) => updateQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={handleBlur}
                    placeholder={t("general.menu.search.placeholder")}
                    data-help="general.menu.search.desc"
                    autoComplete="off"
                    aria-label={t("general.menu.search.placeholder")}
                    aria-autocomplete="list"
                    aria-expanded={showSuggestions && suggestions.length > 0}
                    aria-controls="searchSuggestions"
                    className={cn(
                        "w-full h-9 ps-8 pe-20 rounded bg-background border border-border",
                        "text-sm placeholder:text-muted-foreground",
                        "focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring/60 transition-all",
                    )}
                />

                {searchQuery ? (
                    <div className="absolute inset-e-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 z-10">
                        <button
                            type="button"
                            onClick={copyLink}
                            className="h-6 w-6 flex items-center justify-center rounded hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            title={copied ? t("general.map.linkCopied") : t("general.map.copyLink")}
                            aria-label={t("general.map.copyLink")}
                            data-help="general.map.copyLink.desc"
                        >
                            <LinkIcon className={cn("h-3.5 w-3.5 transition-colors", copied ? "text-success" : "text-muted-foreground hover:text-foreground")}/>
                        </button>

                        <button
                            type="button"
                            onClick={clearSearch}
                            className="h-6 w-6 flex items-center justify-center rounded hover:bg-destructive/15 hover:text-destructive transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            aria-label={t("general.menu.search.clear")}
                            data-help="general.menu.search.clear.desc"
                        >
                            <X className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                    </div>
                ) : (
                    <span className="absolute inset-e-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 pointer-events-none z-10">
                        <kbd className="px-1.5 py-0.5 text-[10px] rounded bg-muted text-muted-foreground border border-border">
                            Ctrl
                        </kbd>
                        <kbd className="px-1.5 py-0.5 text-[10px] rounded bg-muted text-muted-foreground border border-border">
                            F
                        </kbd>
                    </span>
                )}

                {showSuggestions && suggestions.length > 0 && (
                    <div id="searchSuggestions" role="listbox" className="absolute left-0 right-0 top-full mt-1 z-50 max-h-64 overflow-y-auto rounded-md border border-border bg-popover shadow-lg">
                        {suggestions.map((entry, i) => (
                            <button
                                key={entry.id}
                                type="button"
                                role="option"
                                aria-selected={i === selectedIndex}
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => applySuggestion(entry)}
                                className={cn(
                                    "w-full text-start px-3 py-1.5 text-sm transition-colors",
                                    "hover:bg-accent",
                                    i === selectedIndex && "bg-accent",
                                    "flex items-center justify-between gap-2",
                                )}
                            >
                                <span className="truncate">{entry.label}</span>
                                {entry.group && (
                                    <span className="text-[10px] text-muted-foreground shrink-0">
                                        {entry.group}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex items-center px-1">
                <span className="text-[11px] text-muted-foreground">
                    {searchQuery ? t("general.menu.search.results").replace("{n}", String(visibleMarkers.length)) : t("general.menu.search.hint")}
                </span>
            </div>
        </div>
    );
}
