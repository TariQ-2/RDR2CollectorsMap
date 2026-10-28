export type ThemeScheme = 'dark' | 'light';

export interface ThemeDef {
    id: string;
    label: string;
    scheme: ThemeScheme;
}

export const THEMES = [
    { id: 'normal',  label: 'Normal',  scheme: 'dark'  },
    { id: 'dark',    label: 'Dark',    scheme: 'dark'  },
] as const satisfies ReadonlyArray<ThemeDef>;

export type ThemeId = (typeof THEMES)[number]['id'];

export const DEFAULT_THEME_ID: ThemeId = 'normal';

export function isThemeId(value: unknown): value is ThemeId {
    return typeof value === 'string'
        && (THEMES as ReadonlyArray<ThemeDef>).some((t) => t.id === value);
}

export function getTheme(id: string): ThemeDef {
    return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

const THEME_SCHEME_MAP: Record<ThemeId, ThemeScheme> = Object.fromEntries(
    THEMES.map((t) => [t.id, t.scheme]),
) as Record<ThemeId, ThemeScheme>;

export const THEME_BOOT_SCRIPT =
    `try{var m=${JSON.stringify(THEME_SCHEME_MAP)};var t=null;`
    + `try{var raw=localStorage.getItem('rdr2collector');if(raw){t=JSON.parse(raw)?.state?.core?.theme;}}catch(e){}`
    + `if(!Object.prototype.hasOwnProperty.call(m,t)){t=${JSON.stringify(DEFAULT_THEME_ID)};}`
    + `document.documentElement.setAttribute('data-theme',t);`
    + `document.documentElement.setAttribute('data-scheme',m[t]);}catch(e){}`;
