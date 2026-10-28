"use client";
import { useEffect } from "react";
import { useSetting } from "@/features/settings";
import { getTheme } from "@/features/settings/themes";

export default function ThemeApplier() {
    const themeId = useSetting("core", "theme");

    useEffect(() => {
        const root = document.documentElement;
        const theme = getTheme(themeId);
        root.setAttribute("data-theme", theme.id);
        root.setAttribute("data-scheme", theme.scheme);
    }, [themeId]);

    return null;
}
