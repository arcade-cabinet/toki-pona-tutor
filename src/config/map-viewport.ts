export type MapViewportConfig = {
    desktopZoom: number;
    mobileZoom: number;
    minTileScreenPx: number;
    maxZoom: number;
};

export type MapViewportZoomInput = {
    config: MapViewportConfig;
    tilePx: number;
    mapPixels: { width: number; height: number } | null;
    viewportPixels: { width: number; height: number };
    mobilePointer: boolean;
};

const ZOOM_EPSILON = 0.001;

export function computeMapViewportZoom(input: MapViewportZoomInput): number {
    const requestedZoom = input.mobilePointer ? input.config.mobileZoom : input.config.desktopZoom;
    const minReadableZoom = input.config.minTileScreenPx / input.tilePx;
    const coverZoom = input.mapPixels
        ? Math.max(
              safeRatio(input.viewportPixels.width, input.mapPixels.width),
              safeRatio(input.viewportPixels.height, input.mapPixels.height),
          )
        : 0;

    return clampZoom(
        Math.max(requestedZoom, minReadableZoom, coverZoom),
        input.config.maxZoom,
    );
}

function safeRatio(numerator: number, denominator: number): number {
    if (numerator <= 0 || denominator <= 0) return 0;
    return numerator / denominator;
}

function clampZoom(zoom: number, maxZoom: number): number {
    return Math.min(Math.max(zoom, ZOOM_EPSILON), maxZoom);
}
