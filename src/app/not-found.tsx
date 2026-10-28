'use client';

import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslate } from '@/i18n';
import { useRouter } from 'next/router';

export default function NotFound() {
    const t = useTranslate();
    const router = useRouter();

    return (
        <div className="flex min-h-screen w-full flex-1 flex-col items-center justify-center bg-background p-4 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                <Compass className="h-10 w-10 text-primary animate-pulse" />
            </div>

            <h1 className="mb-2 text-4xl font-extrabold text-foreground tracking-widest">
                404
            </h1>

            <h2 className="mb-4 text-xl font-semibold text-foreground">
                {t('general.404.title')}
            </h2>

            <p className="mb-8 max-w-md text-sm text-muted-foreground">
                {t('general.404.description')}
            </p>

            <Button
                onClick={() => router.replace('/')}
                variant="default"
                className="h-10 px-6 font-semibold"
            >
                {t('general.404.goHome')}
            </Button>
        </div>
    );
}
