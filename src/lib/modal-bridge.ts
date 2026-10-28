// src/lib/modal-bridge.ts
'use client';
import { useEffect } from 'react';
import { create } from 'zustand';

export type RdoModalId =
  | 'marker-troubleshooting-modal'
  | 'custom-marker-color-modal'
  | 'clear-markers-modal'
  | 'clear-inventory-modal'
  | 'clear-routes-modal'
  | 'delete-all-settings-modal'
  | 'remove-all-pins-modal'
  | 'video-modal'
  | 'loot-table-modal'
  | 'keyboard-shortcuts-modal'
  | 'clear-important-items-modal'
  | 'import-rdo-inventory-modal'
  | 'map-updates-modal'
  | 'mapping-modal';

interface ModalRequest {
    id: RdoModalId;
    action: 'open' | 'close';
}

interface ModalBridgeState {
    request: ModalRequest | null;
    setRequest: (request: ModalRequest | null) => void;
}

const useModalBridge = create<ModalBridgeState>()((set) => ({
    request: null,
    setRequest: (request) => set({ request }),
}));

export function useModalRequests(id: RdoModalId, onOpen: () => void, onClose: () => void) {
    const request = useModalBridge((s) => s.request);
    const setRequest = useModalBridge((s) => s.setRequest);

    useEffect(() => {
        if (request === null || request.id !== id) {
            return;
        }

        if (request.action === 'open') {
            onOpen();
        } else {
            onClose();
        }
        setRequest(null);
    }, [request, id, onOpen, onClose, setRequest]);
}

export function openModal(id: RdoModalId) {
    useModalBridge.getState().setRequest({ id, action: 'open' });
}
