
export function patch<T extends object, K extends keyof T>(key: K, value: T[K]): Partial<T> {
    return { [key]: value } as unknown as Partial<T>;
}

export function togglePatch<T extends object, K extends keyof T>(key: K, current: T[K]): Partial<T> {
    if (typeof current === 'boolean') {
        return patch(key, !current as unknown as T[K]);
    }
    if (typeof current === 'number') {
        return patch(key, (current === 0 ? 1 : 0) as unknown as T[K]);
    }
    return {};
}