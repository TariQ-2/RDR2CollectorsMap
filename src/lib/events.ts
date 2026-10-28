type Handler<T> = (payload: T) => void;
type Unsubscribe = () => void;

function createEvent<T>() {
    const handlers = new Set<Handler<T>>();
    return {
        subscribe(handler: Handler<T>): Unsubscribe {
            handlers.add(handler);
            return () => {
                handlers.delete(handler); 
            };
        },
        emit(payload: T): void {
            for (const h of handlers) {
                try {
                    h(payload);
                } catch (e) {
                    console.error('[event handler]', e);
                }
            }
        },
    };
}

export const events = {
    collectedToggled: createEvent<{ texts: Array<string>; isCollected: boolean }>(),
    importantToggled: createEvent<{ itemId: string; isImportant: boolean }>(),
    markersCollectedChanged: createEvent<{changes: Array<{ itemId: string; category: string; isCollected: boolean }>}>(),
    cyclesChanged: createEvent<Record<string, number>>(),
};
