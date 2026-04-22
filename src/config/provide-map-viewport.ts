import type { RpgClient, RpgClientEngine } from "@rpgjs/client";
import { createModule, defineModule } from "@rpgjs/common";
import { MAP_VIEWPORT_CONFIG } from "../content/gameplay";

type ViewportLike = {
    scale?: {
        x: number;
        y: number;
        set?: (x: number, y?: number) => void;
    };
    setZoom?: (scale: number, center?: boolean) => unknown;
    moveCenter?: (x: number, y: number) => unknown;
};

type SceneDataLike = {
    id?: string;
    tilewidth?: number;
    tileheight?: number;
    tiled?: {
        tilewidth?: number;
        tileheight?: number;
    };
};

type ClientPlayerLike = {
    x(): number;
    y(): number;
};

type RuntimeSnapshot = {
    mapId: string;
    tilePx: number;
    targetZoom: number;
    screenSignature: string;
    playerReady: boolean;
};

const ZOOM_EPSILON = 0.001;

let detachMapViewportRuntime: (() => void) | null = null;

const mapViewportClientModule = defineModule<RpgClient>({
    engine: {
        onStart(engine) {
            installMapViewportRuntime(engine);
        },
    },
});

export function provideMapViewport() {
    return createModule("MapViewport", [
        {
            server: null,
            client: mapViewportClientModule,
        },
    ]);
}

function installMapViewportRuntime(engine: RpgClientEngine): void {
    detachMapViewportRuntime?.();

    let disposed = false;
    let lastSignature = "";
    let animationFrame: number | null = null;

    const sync = (): void => {
        if (disposed) return;
        const viewport = getViewport(engine);
        const snapshot = getRuntimeSnapshot(engine);
        if (!viewport || !snapshot) return;

        const actualZoomX = viewport.scale?.x ?? 1;
        const actualZoomY = viewport.scale?.y ?? actualZoomX;
        const signature = [
            snapshot.mapId,
            snapshot.tilePx,
            snapshot.targetZoom,
            snapshot.screenSignature,
            snapshot.playerReady ? "player" : "no-player",
        ].join(":");

        if (
            lastSignature === signature &&
            Math.abs(actualZoomX - snapshot.targetZoom) < ZOOM_EPSILON &&
            Math.abs(actualZoomY - snapshot.targetZoom) < ZOOM_EPSILON
        ) {
            return;
        }

        applyViewportZoom(viewport, snapshot.targetZoom);
        centerOnCurrentPlayer(engine, viewport);
        lastSignature = signature;
    };

    const scheduleSync = (): void => {
        if (animationFrame != null) return;
        animationFrame = window.requestAnimationFrame(() => {
            animationFrame = null;
            sync();
        });
    };

    const interval = window.setInterval(sync, MAP_VIEWPORT_CONFIG.pollMs);
    window.addEventListener("resize", scheduleSync);
    window.visualViewport?.addEventListener("resize", scheduleSync);
    scheduleSync();

    detachMapViewportRuntime = () => {
        disposed = true;
        window.clearInterval(interval);
        window.removeEventListener("resize", scheduleSync);
        window.visualViewport?.removeEventListener("resize", scheduleSync);
        if (animationFrame != null) {
            window.cancelAnimationFrame(animationFrame);
        }
    };
}

function getRuntimeSnapshot(engine: RpgClientEngine): RuntimeSnapshot | null {
    const sceneData = getSceneData(engine);
    const mapId = sceneData?.id;
    if (!mapId) return null;

    const tilePx =
        sceneData.tiled?.tilewidth ?? sceneData.tilewidth ?? MAP_VIEWPORT_CONFIG.defaultTilePx;
    const requestedZoom = isMobilePointer()
        ? MAP_VIEWPORT_CONFIG.mobileZoom
        : MAP_VIEWPORT_CONFIG.desktopZoom;
    const minReadableZoom = MAP_VIEWPORT_CONFIG.minTileScreenPx / tilePx;
    const targetZoom = clampZoom(Math.max(requestedZoom, minReadableZoom));

    return {
        mapId,
        tilePx,
        targetZoom,
        screenSignature: `${window.innerWidth}x${window.innerHeight}`,
        playerReady: getCurrentPlayer(engine) !== null,
    };
}

function applyViewportZoom(viewport: ViewportLike, zoom: number): void {
    if (typeof viewport.setZoom === "function") {
        viewport.setZoom(zoom, true);
        return;
    }
    viewport.scale?.set?.(zoom, zoom);
}

function centerOnCurrentPlayer(engine: RpgClientEngine, viewport: ViewportLike): void {
    const player = getCurrentPlayer(engine);
    if (!player || typeof viewport.moveCenter !== "function") return;
    viewport.moveCenter(player.x(), player.y());
}

function clampZoom(zoom: number): number {
    return Math.min(Math.max(zoom, ZOOM_EPSILON), MAP_VIEWPORT_CONFIG.maxZoom);
}

function isMobilePointer(): boolean {
    return window.matchMedia("(pointer: coarse), (max-width: 700px)").matches;
}

function getSceneData(engine: RpgClientEngine): SceneDataLike | null {
    return (
        (engine.scene as unknown as { data?: () => SceneDataLike | null | undefined }).data?.() ??
        null
    );
}

function getCurrentPlayer(engine: RpgClientEngine): ClientPlayerLike | null {
    return (engine.getCurrentPlayer?.() ?? null) as ClientPlayerLike | null;
}

function getViewport(engine: RpgClientEngine): ViewportLike | null {
    const canvasElement = (
        engine as unknown as {
            canvasElement?: { props?: { context?: { viewport?: ViewportLike } } };
        }
    ).canvasElement;
    return canvasElement?.props?.context?.viewport ?? null;
}
