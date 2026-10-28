export type UiLanguage = | "en" | "ar";

export type LanguageOption = {
  code: UiLanguage;
  label: string;
  nativeLabel: string;
  greeting: string;
  rtl: boolean;
};

export const DEFAULT_LANGUAGE: UiLanguage = "en";

export const LANGUAGES: Array<LanguageOption> = [
    { code: "en", label: "English", nativeLabel: "English", greeting: "Hello", rtl: false },
    { code: "ar", label: "Arabic", nativeLabel: "العربية", greeting: "مرحبا", rtl: true },
];

const BY_CODE = Object.fromEntries(LANGUAGES.map((l) => [l.code, l])) as Record<UiLanguage, LanguageOption>;

export function normalizeLanguage(lang: unknown): UiLanguage {
    if (typeof lang !== "string") {
        return DEFAULT_LANGUAGE;
    };

    const trimmed = lang.trim();
    const exact = LANGUAGES.find((l) => l.code.toLowerCase() === trimmed.toLowerCase());
    if (exact) {
        return exact.code;
    };

    const base = trimmed.toLowerCase().split(/[-_]/)[0];
    return (BY_CODE[base as UiLanguage]?.code ?? DEFAULT_LANGUAGE) as UiLanguage;
}

export function isRtl(lang: UiLanguage): boolean {
    return BY_CODE[lang]?.rtl ?? false;
}

export const LANGUAGE_DIR_MAP: Record<string, "ltr" | "rtl"> =
  Object.fromEntries(LANGUAGES.map((l) => [l.code, l.rtl ? "rtl" : "ltr"]));

export const LANGUAGE_BOOT_SCRIPT =
  `try{var m=${JSON.stringify(LANGUAGE_DIR_MAP)};var t=null;` +
  `try{var raw=localStorage.getItem('rdr2collector');if(raw){t=JSON.parse(raw)?.state?.core?.language;}}catch(e){}` +
  `if(typeof t!=='string'||!m[t]){t='en';}` +
  `document.documentElement.lang=t;` +
  `document.documentElement.dir=m[t];}catch(e){}`;
