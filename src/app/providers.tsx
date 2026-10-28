'use client';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { DirectionProvider } from 'radix-ui/direction';
import { Bootstrap } from '@/components/Bootstrap';
import { useSetting } from '@/features/settings';
import { languageDir } from '@/i18n';

export function Providers({ children }: { children: ReactNode }) {
    const language = useSetting('core', 'language');
    const dir = languageDir(language);

    useEffect(() => {
        document.documentElement.lang = language;
        document.documentElement.dir = dir;
    }, [language, dir]);

    return (
        <DirectionProvider dir={dir}>
            <Bootstrap />
            {children}
        </DirectionProvider>
    );
}
