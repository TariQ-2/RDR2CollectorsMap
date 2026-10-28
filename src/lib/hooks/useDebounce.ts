"use client";

import { useEffect, useState } from "react";

/**
 * يُرجِع قيمة مؤجلة (debounced) — تتحدث فقط بعد توقف التغييرات لمدة delay.
 *
 * @example
 * const debouncedQuery = useDebounce(query, 250);
 * useEffect(() => { search(debouncedQuery); }, [debouncedQuery]);
 */
export function useDebounce<T>(value: T, delay: number = 250): T {
    const [debounced, setDebounced] = useState<T>(value);

    useEffect(() => {
        const id = window.setTimeout(() => setDebounced(value), delay);
        return () => window.clearTimeout(id);
    }, [value, delay]);

    return debounced;
}
