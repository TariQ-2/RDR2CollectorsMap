"use client";

import { isRtl, normalizeLanguage, type UiLanguage } from "./languages";
import { useSettings } from "@/features/settings";

function applyDocument(lang: UiLanguage) {
    if (typeof document === "undefined") {
        return;
    }
    const root = document.documentElement;
    root.dir = isRtl(lang) ? "rtl" : "ltr";
    root.lang = lang;
}

export function getUiLanguage(): UiLanguage {
    return normalizeLanguage(useSettings.getState().core.language);
}

export function setUiLanguage(lang: UiLanguage): void {
    const next = normalizeLanguage(lang);
    applyDocument(next);
    useSettings.getState().setValue("core", "language", next);
}

export function useUiLanguage(): UiLanguage {
    return normalizeLanguage(useSettings((s) => s.core.language));
}

if (typeof window !== "undefined") {
    applyDocument(getUiLanguage());
}
