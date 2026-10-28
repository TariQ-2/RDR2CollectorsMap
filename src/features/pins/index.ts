'use client';
import { create } from 'zustand';

import { translate } from '@/i18n';
export interface PinData {
  lat: number;
  lng: number;
  id: number;
  title: string;
  description: string;
  shape: string;
  color: string;
}

const PINS_KEY = 'rdr2collector.pinned-items';
const LEGACY_PINS_KEY = 'pinned-items';
export const ADD_PIN_CENTER_EVENT = 'rdr2collector:add-pin-center';

export function generateHash(str: string): number {
    let hash = 0;
    if (str.length === 0) {
        return hash;
    }

    for (let i = 0, l = str.length; i < l; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return hash;
}

export function createPin(preliminary: Partial<PinData> & { lat: number; lng: number }): PinData {
    const lat = preliminary.lat;
    const lng = preliminary.lng;

    return {
        lat,
        lng,
        id: preliminary.id ?? generateHash(`${lat}_${lng}_${Date.now()}`),
        title: preliminary.title ?? translate('map.user_pins.default_title'),
        description: preliminary.description ?? translate('map.user_pins.default_desc'),
        shape: preliminary.shape ?? 'default',
        color: preliminary.color ?? 'orange',
    };
}

export interface PinsState {
    pinsList: Array<PinData>;

    loadPins: () => void;
    addPin: (preliminary: Partial<PinData> & { lat: number; lng: number }) => void;
    savePin: (pin: PinData) => void;
    movePin: (id: number, lat: number, lng: number) => void;
    removePin: (id: number) => void;
    removeAllPins: () => void;
    save: () => void;
    importPins: (text: string) => void;
    exportPins: () => void;
}

function isValidJSON(str: string | null): boolean {
    if (str == null) {
        return false;
    }
    try {
        JSON.parse(str);
    } catch {
        return false;
    }
    return true;
}

export const usePins = create<PinsState>()((set, get) => ({
    pinsList: [],
    save: () => {
        localStorage.removeItem(LEGACY_PINS_KEY);
        localStorage.setItem(PINS_KEY, JSON.stringify(get().pinsList));
    },

    loadPins: () => {
        const pins: Array<PinData> = [];

        const oldPinnedItems = localStorage.getItem(LEGACY_PINS_KEY);
        if (oldPinnedItems != null) {
            oldPinnedItems.split(';').forEach((oldItem) => {
                if (oldItem === '') {
                    return;
                }
                const properties = oldItem.split(':');
                pins.push(
                    createPin(
                        JSON.parse(
                            `{"lat": ${properties[0]}, "lng": ${properties[1]}, "id": ${properties[2]}, "title": "${properties[3]}", "description": "${properties[4]}", "icon": "${properties[5]}", "color": "red"}`,
                        ),
                    ),
                );
            });
        }

        const stored = localStorage.getItem(PINS_KEY);
        if (isValidJSON(stored)) {
            (JSON.parse(stored as string) as Array<PinData>).forEach((pinnedItem) => {
                pins.push(createPin(pinnedItem));
            });
        }

        set({ pinsList: pins });
        get().save();
    },

    addPin: (preliminary) => {
        const marker = createPin(preliminary);
        set({ pinsList: [...get().pinsList, marker] });
        get().save();
    },

    savePin: (pin) => {
        const pinsList = get().pinsList.filter((existing) => existing.id !== pin.id);
        set({ pinsList: [...pinsList, pin] });
        get().save();
    },

    movePin: (id, lat, lng) => {
        set({
            pinsList: get().pinsList.map((pin) => (pin.id === id ? { ...pin, lat, lng } : pin)),
        });
        get().save();
    },

    removePin: (id) => {
        set({ pinsList: get().pinsList.filter((pin) => pin.id !== id) });
        get().save();
    },

    removeAllPins: () => {
        set({ pinsList: [] });
        get().save();
    },

    importPins: (text) => {
        if (isValidJSON(text)) {
            localStorage.setItem(PINS_KEY, text);
            get().loadPins();
        } else {
            alert(translate('alerts.file_not_valid'));
        }
    },

    exportPins: () => {
        const text = localStorage.getItem(PINS_KEY);
        if (!text) {
            alert(translate('alerts.nothing_to_export'));
            return;
        }
        const blob = new Blob([text], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pinned-items.json';
        a.click();
        URL.revokeObjectURL(url);
    },
}));
