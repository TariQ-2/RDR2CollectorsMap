'use client';

import { useEffect, forwardRef } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslate } from '@/i18n';
import type { LucideProps } from 'lucide-react';

export const Github = forwardRef<SVGSVGElement, LucideProps>(function Github({ size = 24, color = 'currentColor', strokeWidth = 2, className, ...rest }, ref) {
    return (
        <svg
            ref={ref}
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            {...rest}
        >
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
            <path d="M9 18c-4.51 2-5-2-7-2" />
        </svg>
    );
});

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void; }) {
    const t = useTranslate();

    useEffect(() => {
        console.error('[App Error]', error);
    }, [error]);

    const handleReportIssue = () => {
        const title = `[Bug] ${error.message.slice(0, 80)}${error.message.length > 80 ? '...' : ''}`;

        const body = `
**Error Message:**
\`\`\`
${error.message}
\`\`\`

**Technical Details:**
- **URL:** ${window.location.href}
- **Browser:** ${navigator.userAgent}
- **Timestamp:** ${new Date().toISOString()}

**Stack Trace:**
\`\`\`
${error.stack || 'N/A'}
\`\`\`
        `.trim();

        const url = `https://github.com/TariQ-2/RDR2CollectorsMap/issues/new?template=bug_report.yml&title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}&labels=bug`;
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    return (
        <div className="flex min-h-screen w-full flex-1 flex-col items-center justify-center bg-background p-4 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="h-10 w-10 text-destructive" />
            </div>

            <h1 className="mb-2 text-2xl font-bold text-foreground">
                {t('general.error.title')}
            </h1>

            <p className="mb-6 max-w-md text-sm text-muted-foreground">
                {t('general.error.description')}
            </p>

            {error.message && (
                <pre className="mb-6 max-w-xl overflow-auto rounded-md border border-border bg-muted/50 p-4 text-left text-xs text-muted-foreground">
                    {error.message}
                </pre>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3">
                <Button onClick={() => reset()} variant="default">
                    <RotateCcw className="me-2 h-4 w-4" />
                    {t('general.error.tryAgain')}
                </Button>

                <Link href="/">
                    <Button variant="outline">
                        <Home className="me-2 h-4 w-4" />
                        {t('general.error.goHome')}
                    </Button>
                </Link>

                <Button onClick={handleReportIssue} variant="secondary">
                    <Github className="me-2 h-4 w-4" />
                    {t('general.error.reportGithub')}
                </Button>
            </div>
        </div>
    );
}
