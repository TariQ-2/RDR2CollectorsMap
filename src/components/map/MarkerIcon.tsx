'use client';
import L from 'leaflet';
import { MARKER_COLOR_HEX } from '@/data/marker-colors';
export type MarkerShape = 'teardrop' | 'pushpin' | 'cross';
export type OverlayType = 'cross' | 'time' | 'high' | 'low' | null;

export interface MarkerIconProps {
    shape?: MarkerShape;
    color: string;
    iconName?: string;
    markerSize: number;
    isShadowsEnabled: boolean;
    isDark?: boolean;
    overlay?: OverlayType;
    isCollected?: boolean;
    canCollect?: boolean;
    isInvisibleRemovedMarkers?: boolean;
    isImportant?: boolean;
    highlightOpacity?: number;
    highlightAnimated?: boolean;
}

function resolveColor(color: string): string {
    return MARKER_COLOR_HEX[color] ?? (color.startsWith('#') ? color : '#da4d6d');
}

export function markerDivIcon(props: MarkerIconProps): L.DivIcon {
    const {
        shape = 'teardrop', markerSize, color, iconName,
        isShadowsEnabled, overlay, isCollected, canCollect,
        isInvisibleRemovedMarkers, isImportant,
        highlightOpacity = 0, highlightAnimated = false,
    } = props;

    const isPushpin = shape === 'pushpin';
    const isCross = shape === 'cross';

    const width = (isPushpin ? 45 : isCross ? 24 : 35) * markerSize;
    const height = (isPushpin ? 45 : isCross ? 24 : 45) * markerSize;
    const anchorX = (isPushpin ? 22 : isCross ? 12 : 17) * markerSize;
    const anchorY = (isPushpin ? 22 : isCross ? 12 : 42) * markerSize;
    const effectiveCanCollect = canCollect ?? !isCollected;
    const opacity = effectiveCanCollect ? 1 : (isInvisibleRemovedMarkers ? 0 : 1/3);
    const fillColor = resolveColor(color);

    const shadow = isShadowsEnabled && !isCross
        ? `<div style="position:absolute;left:50%;transform:translateX(-50%);bottom:-2px;width:${width * 0.6}px;height:${height * 0.35}px;background:rgba(0,0,0,0.4);border-radius:50%;filter:blur(3px);z-index:0;pointer-events:none;"></div>`
        : '';

    let baseSvg = '';
    if (isPushpin) {
        baseSvg = `<svg width="${width}" height="${height}" viewBox="2 2 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="transform: rotate(-45deg); position:absolute; inset:0; z-index:10; pointer-events:none;" stroke="${fillColor}">
            <path d="M14.6358 3.90949C15.2888 3.47412 15.6153 3.25643 15.9711 3.29166C16.3269 3.32689 16.6044 3.60439 17.1594 4.15938L19.8406 6.84062C20.3956 7.39561 20.6731 7.67311 20.7083 8.02888C20.7436 8.38465 20.5259 8.71118 20.0905 9.36424L18.4419 11.8372C17.88 12.68 17.5991 13.1013 17.3749 13.5511C17.2086 13.8845 17.0659 14.2292 16.9476 14.5825C16.7882 15.0591 16.6889 15.5557 16.4902 16.5489L16.2992 17.5038C16.2986 17.5072 16.2982 17.5089 16.298 17.5101C16.1556 18.213 15.3414 18.5419 14.7508 18.1351C14.7497 18.1344 14.7483 18.1334 14.7455 18.1315C14.7322 18.1223 14.7255 18.1177 14.7189 18.1131C11.2692 15.7225 8.27754 12.7308 5.88691 9.28108C5.88233 9.27448 5.87772 9.26782 5.86851 9.25451C5.86655 9.25169 5.86558 9.25028 5.86486 9.24924C5.45815 8.65858 5.78704 7.84444 6.4899 7.70202C6.49113 7.70177 6.49282 7.70144 6.49618 7.70076L7.45114 7.50977C8.44433 7.31113 8.94092 7.21182 9.4175 7.05236C9.77083 6.93415 10.1155 6.79139 10.4489 6.62514C10.8987 6.40089 11.32 6.11998 12.1628 5.55815L14.6358 3.90949Z" fill="${fillColor}" stroke="${fillColor}" stroke-width="2.4"></path>
            <path d="M5 19L9.5 14.5" stroke="${fillColor}" stroke-width="2.4" stroke-linecap="round"></path>
        </svg>`;
    } else if (isCross) {
        baseSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="position:absolute; inset:0; width:100%; height:100%; z-index:10; pointer-events:none;">
            <path d="M18 6L6 18M6 6l12 12" stroke="${fillColor}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
    } else {
        baseSvg = `<svg viewBox="0 0 35 45" style="position:absolute; inset:0; width:100%; height:100%; z-index:10; pointer-events:none;">
            <path d="M17.5 2C9.492 2 3 8.492 3 16.5C3 27 17.5 43 17.5 43C17.5 43 32 27 32 16.5C32 8.492 25.508 2 17.5 2Z" fill="${fillColor}" />
        </svg>`;
    }

    const contour = highlightOpacity > 0 && !isPushpin && !isCross
        ? `<svg class="marker-contour${highlightAnimated ? ' highlight-low-amount-items-animated' : ''}"
                viewBox="0 0 35 45"
                style="position:absolute;top:-15%;left:-15%;width:130%;height:130%;opacity:${highlightOpacity};--animation-target-opacity:${highlightOpacity};z-index:2;pointer-events:none;">
                <path d="M17.5 2C9.492 2 3 8.492 3 16.5C3 27 17.5 43 17.5 43C17.5 43 32 27 32 16.5C32 8.492 25.508 2 17.5 2Z" fill="none" stroke="#1e3a8a" stroke-width="3" />
           </svg>`
        : '';

    const icon = iconName
        ? `<img src="/RDR2CollectorsMap/assets/images/icons/${iconName}.png" style="position:absolute;top:-10%;left:0;width:100%;height:100%;z-index:30;pointer-events:none;object-fit:contain" draggable="false"/>`
        : '';

    let overlaySvg = '';
    const overlayStyle = "position:absolute; top:-12%; right:-15%; width:50%; height:50%; z-index:40; pointer-events:none; filter:drop-shadow(0 2px 2px rgba(0,0,0,0.5));";
    if (overlay === 'cross') {
        overlaySvg = `<svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" style="${overlayStyle}"><path d="M18 6 6 18M6 6l12 12"/></svg>`;
    } else if (overlay === 'time') {
        overlaySvg = `<svg viewBox="0 0 24 24" fill="none" stroke="#EBEBEB" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="${overlayStyle}"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
    } else if (overlay === 'high') {
        overlaySvg = `<svg viewBox="0 0 24 24" fill="none" stroke="#EBEBEB" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" style="${overlayStyle}"><path d="m18 15-6-6-6 6"/></svg>`;
    } else if (overlay === 'low') {
        overlaySvg = `<svg viewBox="0 0 24 24" fill="none" stroke="#EBEBEB" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" style="${overlayStyle}"><path d="m6 9 6 6 6-6"/></svg>`;
    }

    const glow = isImportant ? 'filter:drop-shadow(0 0 4px #ef4444) drop-shadow(0 0 10px #ef4444);' : '';

    const html = `
        <div class="rdo-marker-inner" style="position:relative;width:${width}px;height:${height}px;opacity:${opacity};${glow}">
            ${shadow}
            ${baseSvg}
            ${contour}
            ${icon}
            ${overlaySvg}
        </div>
    `;

    return L.divIcon({
        className: '',
        iconSize: [width, height],
        iconAnchor: [anchorX, anchorY],
        popupAnchor: [markerSize, -29 * markerSize],
        html,
    });
}
