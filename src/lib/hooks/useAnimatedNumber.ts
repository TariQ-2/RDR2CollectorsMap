// src/lib/hooks/useAnimatedNumber.ts
'use client';
import { useEffect, useRef, useState } from 'react';

export function useAnimatedNumber(target: number, duration = 1000): number {
    const [displayed, setDisplayed] = useState(target);
    const startValueRef = useRef(target);
    const startTimeRef = useRef(0);
    const rafRef = useRef<number | null>(null);

    useEffect(() => {
        // القيمة الحالية المعروضة تصبح نقطة البداية
        startValueRef.current = displayed;
        startTimeRef.current = performance.now();

        const start = startValueRef.current;
        const end = target;
        const delta = end - start;

        // إذا كان الفرق صفراً، لا داعي للتشغيل
        if (delta === 0) {
            return;
        }

        const step = (currTime: number) => {
            const progress = Math.min((currTime - startTimeRef.current) / duration, 1);
            // legacy: value = start + (end - start) * progress
            const value = start + delta * progress;

            setDisplayed(value);
            if (progress < 1) {
                rafRef.current = requestAnimationFrame(step);
            } else {
                rafRef.current = null;
            }
        };

        rafRef.current = requestAnimationFrame(step);

        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target, duration]);

    return displayed;
}
