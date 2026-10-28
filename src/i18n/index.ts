"use client";

import { normalizeLanguage, isRtl } from "./languages";

export { t as translate, useT as useTranslate } from "./translate";
export { getUiLanguage, setUiLanguage, useUiLanguage } from "./store";
export {
    LANGUAGES,
    LANGUAGE_BOOT_SCRIPT,
    LANGUAGE_DIR_MAP,
    normalizeLanguage,
    isRtl,
    type UiLanguage,
} from "./languages";

export function languageDir(code: string): "ltr" | "rtl" {
    return isRtl(normalizeLanguage(code)) ? "rtl" : "ltr";
}
