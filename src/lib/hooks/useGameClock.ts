"use client";

import { useEffect, useState } from "react";

export interface GameClock {
    /** وقت اللعبة — HH:MM */
    gameTime: string;
    /** العدّاد التنازلي لإعادة الدورة — HH:MM:SS */
    countdown: string;
    /** هل الوقت ليل في اللعبة؟ */
    isNight: boolean;
}

const INITIAL: GameClock = {
    gameTime: "--:--",
    countdown: "--:--:--",
    isNight: false,
};

/**
 * ساعة اللعبة (RDR2 Online):
 * - وقت اللعبة = 30× السرعة الحقيقية
 * - الدورة تُعاد ضبطها عند منتصف الليل UTC
 */
export function useGameClock(): GameClock {
    const [clock, setClock] = useState<GameClock>(INITIAL);

    useEffect(() => {
        const tick = () => {
            const now = new Date();

            /* ── وقت اللعبة ── */
            const gameTime = new Date(now.getTime() * 30);
            const gameHour = gameTime.getUTCHours();
            const isNight = gameHour >= 22 || gameHour < 5;

            /* ── العدّاد التنازلي ── */
            const cycleReset = Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate() + 1,
            );
            const delta = new Date(cycleReset - now.getTime());

            setClock({
                gameTime: gameTime.toLocaleTimeString("en-GB", {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                    timeZone: "UTC",
                }),
                countdown: delta.toLocaleTimeString("en-GB", {
                    hour12: false,
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                    timeZone: "UTC",
                }),
                isNight,
            });
        };

        tick();
        const id = window.setInterval(tick, 1000);
        return () => window.clearInterval(id);
    }, []);

    return clock;
}
