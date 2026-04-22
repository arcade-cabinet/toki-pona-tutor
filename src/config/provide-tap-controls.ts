import type { RpgClient, RpgClientEngine } from "@rpgjs/client";
import { createModule, defineModule } from "@rpgjs/common";
import { getCurrentInteractionHint, triggerInteractionHint } from "./interaction-hint";
import { readTiledObjectType, type TiledObjectLike } from "./tiled-object";
import {
    TAP_ROUTE_EVENT,
    TAP_ROUTE_SNAP_EVENT,
    isTapRouteSnap,
    type TapRouteInteraction,
    type TapRouteRequest,
    type TapRouteSnap,
    type TilePoint,
} from "../modules/main/tap-route-contract";
import {
    TAP_CONTROL_BLOCKING_UI_SELECTORS,
    TAP_CONTROL_TARGET_BLOCKING_UI_SELECTORS,
    TAP_ROUTE_CONFIG,
} from "../content/gameplay";

type ViewportLike = {
    toWorld(x: number, y: number): { x: number; y: number };
    toScreen(x: number, y: number): { x: number; y: number };
};

type TileInfoLike = {
    hasCollision?: boolean;
};

type TiledMapLike = {
    width: number;
    height: number;
    tilewidth: number;
    tileheight: number;
    getTileByPosition(
        x: number,
        y: number,
        z?: [number, number],
        options?: { populateTiles?: boolean },
    ): TileInfoLike;
    getAllObjects?(): TiledObjectLike[];
};

type ClientPlayerLike = {
    id?: string;
    x(): number;
    y(): number;
    hitbox?: { w?: number; h?: number } | (() => { w?: number; h?: number } | null | undefined);
    changeDirection?: (direction: string) => void;
};

type ClientEventLike = {
    x(): number;
    y(): number;
};

type SceneMapLike = {
    updateHitbox: (id: string, x: number, y: number, width: number, height: number) => boolean;
    setBodyPosition: (id: string, x: number, y: number, origin: "top-left") => void;
};

type RouteContext = {
    targetTile: TilePoint;
    interaction: TapRouteInteraction | null;
};

type ObjectTarget = {
    id: string;
    kind: TapRouteInteraction["kind"];
    tile: TilePoint;
};

const PLAYER_TAP_RADIUS_MULTIPLIER = TAP_ROUTE_CONFIG.playerTapRadiusMultiplier;
const MOVEMENT_TILE_SIZE = TAP_ROUTE_CONFIG.movementTileSize;
const PENDING_TAP_ROUTE_SNAP_KEY = TAP_ROUTE_CONFIG.pendingSnapKey;
const BIND_RETRY_MS = TAP_ROUTE_CONFIG.bindRetryMs;
const BIND_RETRY_MAX_ATTEMPTS = TAP_ROUTE_CONFIG.bindRetryMaxAttempts;
const SNAP_RETRY_MS = TAP_ROUTE_CONFIG.snapRetryMs;
const SNAP_STABILIZE_MAX_ATTEMPTS = TAP_ROUTE_CONFIG.snapStabilizeMaxAttempts;
const SNAP_MAX_ATTEMPTS = TAP_ROUTE_CONFIG.snapMaxAttempts;
const BLOCKING_UI_SELECTOR = TAP_CONTROL_BLOCKING_UI_SELECTORS.join(", ");
const TARGET_BLOCKING_UI_SELECTOR = TAP_CONTROL_TARGET_BLOCKING_UI_SELECTORS.join(", ");

let detachCanvasListener: (() => void) | null = null;
let detachTapRouteSnapListener: (() => void) | null = null;
let canvasBindRetryTimer: ReturnType<typeof setTimeout> | null = null;
let latestTapRouteSnapVersion = 0;
let pendingTapRouteSnap: TapRouteSnap | null = null;
let pendingTapRouteSnapTimer: ReturnType<typeof setTimeout> | null = null;
let pendingTapRouteSnapAttempts = 0;
let pendingTapRouteSnapDeferred = false;
let pendingTapRouteSnapStabilizing = false;

const tapControlsClientModule = defineModule<RpgClient>({
    engine: {
        onStart(engine) {
            installCanvasTapListener(engine);
            installTapRouteSnapListener(engine);
        },
    },
});

export function provideTapControls() {
    return createModule("TapControls", [
        {
            server: null,
            client: tapControlsClientModule,
        },
    ]);
}

function installCanvasTapListener(engine: RpgClientEngine): void {
    detachCanvasListener?.();
    detachCanvasListener = () => clearCanvasBindRetryTimer();

    const bind = (attempt = 0): void => {
        if (!getCanvasElement()) {
            if (attempt < BIND_RETRY_MAX_ATTEMPTS) {
                canvasBindRetryTimer = setTimeout(() => {
                    canvasBindRetryTimer = null;
                    bind(attempt + 1);
                }, BIND_RETRY_MS);
            }
            return;
        }

        const handleTap = (clientX: number, clientY: number): void => {
            if (isBlockingUiOpen()) return;
            const viewport = getViewport(engine);
            const map = getTiledMap(engine);
            const player = getCurrentPlayer(engine);
            const canvas = getCanvasElement();
            if (!viewport || !map || !player) return;
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            if (
                clientX < rect.left ||
                clientX > rect.right ||
                clientY < rect.top ||
                clientY > rect.bottom
            ) {
                return;
            }
            const screenX = clientX - rect.left;
            const screenY = clientY - rect.top;
            const currentHint = getCurrentInteractionHint(engine);
            if (
                currentHint &&
                isPlayerSettledOnMovementGrid(player) &&
                isCurrentPlayerTap(map, player, viewport, screenX, screenY)
            ) {
                issueHintInteraction(engine, currentHint);
                return;
            }
            const worldPoint = viewport.toWorld(screenX, screenY);
            const route = buildRoutePlan(engine, map, player, worldPoint.x, worldPoint.y);
            if (!route) return;
            engine.socket.emit(TAP_ROUTE_EVENT, route);
        };
        const handlePointerUp = (event: PointerEvent): void => {
            if (!event.isPrimary || event.button !== 0) return;
            if (isBlockingUiTarget(event.target)) return;
            handleTap(event.clientX, event.clientY);
        };

        document.addEventListener("pointerup", handlePointerUp);
        detachCanvasListener = () => {
            clearCanvasBindRetryTimer();
            document.removeEventListener("pointerup", handlePointerUp);
        };
    };

    bind();
}

function installTapRouteSnapListener(engine: RpgClientEngine): void {
    detachTapRouteSnapListener?.();
    detachTapRouteSnapListener = null;
    latestTapRouteSnapVersion = 0;
    resetPendingTapRouteSnapRuntime();
    const storedSnap = readStoredPendingTapRouteSnap();
    if (storedSnap) {
        deferPendingTapRouteSnap(engine, storedSnap);
    }

    const handleSnap = (payload: unknown): void => {
        if (!isTapRouteSnap(payload)) return;
        receiveTapRouteSnap(engine, payload);
    };

    engine.socket.on(TAP_ROUTE_SNAP_EVENT, handleSnap);
    detachTapRouteSnapListener = () => {
        engine.socket.off(TAP_ROUTE_SNAP_EVENT, handleSnap);
    };
}

function receiveTapRouteSnap(engine: RpgClientEngine, payload: TapRouteSnap): void {
    if (payload.version < latestTapRouteSnapVersion) return;

    if (getCurrentMapId(engine) !== payload.mapId) {
        deferPendingTapRouteSnap(engine, payload);
        return;
    }

    applyTapRouteSnap(engine, payload);
    latestTapRouteSnapVersion = payload.version;
}

function schedulePendingTapRouteSnap(engine: RpgClientEngine): void {
    if (pendingTapRouteSnapTimer) return;

    pendingTapRouteSnapTimer = setTimeout(() => {
        pendingTapRouteSnapTimer = null;
        flushPendingTapRouteSnap(engine);
    }, SNAP_RETRY_MS);
}

function flushPendingTapRouteSnap(engine: RpgClientEngine): void {
    const payload = pendingTapRouteSnap;
    if (!payload) return;

    if (payload.version < latestTapRouteSnapVersion) {
        clearPendingTapRouteSnap();
        return;
    }

    if (getCurrentMapId(engine) === payload.mapId) {
        applyTapRouteSnap(engine, payload);
        latestTapRouteSnapVersion = payload.version;
        if (!pendingTapRouteSnapDeferred) {
            clearPendingTapRouteSnap();
            return;
        }
        if (!pendingTapRouteSnapStabilizing) {
            pendingTapRouteSnapAttempts = 0;
            pendingTapRouteSnapStabilizing = true;
        }
        pendingTapRouteSnapAttempts += 1;
        if (pendingTapRouteSnapAttempts >= SNAP_STABILIZE_MAX_ATTEMPTS) {
            clearPendingTapRouteSnap();
            return;
        }
        schedulePendingTapRouteSnap(engine);
        return;
    }

    pendingTapRouteSnapAttempts += 1;
    if (pendingTapRouteSnapAttempts >= SNAP_MAX_ATTEMPTS) {
        clearPendingTapRouteSnap();
        return;
    }
    schedulePendingTapRouteSnap(engine);
}

function clearCanvasBindRetryTimer(): void {
    if (!canvasBindRetryTimer) return;
    clearTimeout(canvasBindRetryTimer);
    canvasBindRetryTimer = null;
}

function clearPendingTapRouteSnapTimer(): void {
    if (!pendingTapRouteSnapTimer) return;
    clearTimeout(pendingTapRouteSnapTimer);
    pendingTapRouteSnapTimer = null;
}

function resetPendingTapRouteSnapRuntime(): void {
    pendingTapRouteSnap = null;
    pendingTapRouteSnapAttempts = 0;
    pendingTapRouteSnapDeferred = false;
    pendingTapRouteSnapStabilizing = false;
    clearPendingTapRouteSnapTimer();
}

function clearPendingTapRouteSnap(): void {
    resetPendingTapRouteSnapRuntime();
    writeStoredPendingTapRouteSnap(null);
}

function deferPendingTapRouteSnap(engine: RpgClientEngine, payload: TapRouteSnap): void {
    pendingTapRouteSnap = payload;
    writeStoredPendingTapRouteSnap(payload);
    pendingTapRouteSnapAttempts = 0;
    pendingTapRouteSnapDeferred = true;
    pendingTapRouteSnapStabilizing = false;
    schedulePendingTapRouteSnap(engine);
}

function readStoredPendingTapRouteSnap(): TapRouteSnap | null {
    const stored = (globalThis as Record<string, unknown>)[PENDING_TAP_ROUTE_SNAP_KEY];
    return isTapRouteSnap(stored) ? stored : null;
}

function writeStoredPendingTapRouteSnap(payload: TapRouteSnap | null): void {
    const store = globalThis as Record<string, unknown>;
    if (payload) {
        store[PENDING_TAP_ROUTE_SNAP_KEY] = payload;
    } else {
        delete store[PENDING_TAP_ROUTE_SNAP_KEY];
    }
}

function buildRoutePlan(
    engine: RpgClientEngine,
    map: TiledMapLike,
    player: ClientPlayerLike,
    worldX: number,
    worldY: number,
): TapRouteRequest | null {
    const mapId = getCurrentMapId(engine);
    if (!mapId) return null;

    const startTile = clampTile(map, toTilePoint(map, player.x(), player.y()));
    const tappedTile = clampTile(map, toTilePoint(map, worldX, worldY));
    const routeContext = resolveRouteContext(engine, map, worldX, worldY, tappedTile);
    const goalTiles = collectGoalTiles(engine, map, routeContext);
    if (goalTiles.length === 0) {
        return null;
    }

    const path = findTileRoute(map, engine, startTile, goalTiles);
    if (!path) {
        return null;
    }

    return {
        mapId,
        path,
        interaction: routeContext.interaction,
    };
}

function resolveRouteContext(
    engine: RpgClientEngine,
    map: TiledMapLike,
    worldX: number,
    worldY: number,
    tappedTile: TilePoint,
): RouteContext {
    const objectTarget = getObjectAtWorldPoint(map, worldX, worldY);
    if (objectTarget) {
        return {
            targetTile: objectTarget.tile,
            interaction: {
                kind: objectTarget.kind,
                eventId: objectTarget.id,
            },
        };
    }

    const eventTarget = getEventAtTile(engine, map, tappedTile);
    if (!eventTarget) {
        return {
            targetTile: tappedTile,
            interaction: null,
        };
    }

    if (eventTarget.id.startsWith("warp_")) {
        return {
            targetTile: eventTarget.tile,
            interaction: {
                kind: "touch",
                eventId: eventTarget.id,
            },
        };
    }

    return {
        targetTile: eventTarget.tile,
        interaction: {
            kind: "action",
            eventId: eventTarget.id,
        },
    };
}

function getObjectAtWorldPoint(
    map: TiledMapLike,
    worldX: number,
    worldY: number,
): ObjectTarget | null {
    const objects = map.getAllObjects?.() ?? [];
    for (const object of objects) {
        if (typeof object.name !== "string" || object.name.length === 0) continue;
        if (typeof object.x !== "number" || typeof object.y !== "number") continue;

        const width = Math.max(0, object.width ?? 0);
        const height = Math.max(0, object.height ?? 0);
        if (width <= 0 || height <= 0) continue;

        const withinX = worldX >= object.x && worldX <= object.x + width;
        const withinY = worldY >= object.y && worldY <= object.y + height;
        if (!withinX || !withinY) continue;

        const normalizedType = readTiledObjectType(object).toLowerCase();
        return {
            id: object.name,
            kind: normalizedType === "warp" || object.name.startsWith("warp_") ? "touch" : "action",
            tile: clampTile(map, toTilePoint(map, object.x + width / 2, object.y + height / 2)),
        };
    }

    return null;
}

function collectGoalTiles(
    engine: RpgClientEngine,
    map: TiledMapLike,
    context: RouteContext,
): TilePoint[] {
    if (context.interaction) {
        return getAdjacentWalkableTiles(engine, map, context.targetTile);
    }

    if (isWalkableTile(engine, map, context.targetTile)) {
        return [context.targetTile];
    }

    return findNearestWalkableTiles(engine, map, context.targetTile);
}

function findTileRoute(
    map: TiledMapLike,
    engine: RpgClientEngine,
    startTile: TilePoint,
    goalTiles: TilePoint[],
): TilePoint[] | null {
    const goalKeys = new Set(goalTiles.map(tileKey));
    const queue: TilePoint[] = [startTile];
    const visited = new Set([tileKey(startTile)]);
    const parents = new Map<string, TilePoint | null>([[tileKey(startTile), null]]);

    while (queue.length > 0) {
        const current = queue.shift()!;
        const currentKey = tileKey(current);
        if (goalKeys.has(currentKey)) {
            const path: TilePoint[] = [];
            let cursor: TilePoint | null = current;
            while (cursor) {
                path.push(cursor);
                cursor = parents.get(tileKey(cursor)) ?? null;
            }
            path.reverse();
            return path.slice(1);
        }

        for (const neighbor of getAdjacentTiles(current)) {
            const key = tileKey(neighbor);
            if (visited.has(key)) continue;
            if (!tilesEqual(neighbor, startTile) && !isWalkableTile(engine, map, neighbor)) {
                continue;
            }
            visited.add(key);
            parents.set(key, current);
            queue.push(neighbor);
        }
    }

    return null;
}

function getAdjacentWalkableTiles(
    engine: RpgClientEngine,
    map: TiledMapLike,
    targetTile: TilePoint,
): TilePoint[] {
    return getAdjacentTiles(targetTile).filter((tile) => isWalkableTile(engine, map, tile));
}

function findNearestWalkableTiles(
    engine: RpgClientEngine,
    map: TiledMapLike,
    targetTile: TilePoint,
): TilePoint[] {
    const { width, height } = getMovementGridSize(map);
    let nearestDistance = Number.POSITIVE_INFINITY;
    const nearest: TilePoint[] = [];

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const candidate = { x, y };
            if (!isWalkableTile(engine, map, candidate)) continue;
            const distance =
                Math.abs(candidate.x - targetTile.x) + Math.abs(candidate.y - targetTile.y);
            if (distance < nearestDistance) {
                nearestDistance = distance;
                nearest.length = 0;
                nearest.push(candidate);
                continue;
            }
            if (distance === nearestDistance) {
                nearest.push(candidate);
            }
        }
    }

    return nearest;
}

function isWalkableTile(engine: RpgClientEngine, map: TiledMapLike, tile: TilePoint): boolean {
    const { width, height } = getMovementGridSize(map);
    if (tile.x < 0 || tile.y < 0 || tile.x >= width || tile.y >= height) {
        return false;
    }

    const originX = tile.x * MOVEMENT_TILE_SIZE;
    const originY = tile.y * MOVEMENT_TILE_SIZE;
    for (let offsetY = 0; offsetY < MOVEMENT_TILE_SIZE; offsetY += map.tileheight) {
        for (let offsetX = 0; offsetX < MOVEMENT_TILE_SIZE; offsetX += map.tilewidth) {
            const tileInfo = map.getTileByPosition(originX + offsetX, originY + offsetY, [0, 0], {
                populateTiles: false,
            });
            if (tileInfo.hasCollision) {
                return false;
            }
        }
    }

    return !hasBlockingEventAtTile(engine, map, tile);
}

function hasBlockingEventAtTile(
    engine: RpgClientEngine,
    map: TiledMapLike,
    tile: TilePoint,
): boolean {
    const events = getSceneEvents(engine);
    return Object.values(events).some((event) => {
        const eventTile = clampTile(map, toTilePoint(map, event.x(), event.y()));
        return tilesEqual(eventTile, tile);
    });
}

function getEventAtTile(
    engine: RpgClientEngine,
    map: TiledMapLike,
    tile: TilePoint,
): { id: string; tile: TilePoint } | null {
    const events = getSceneEvents(engine);
    for (const [id, event] of Object.entries(events)) {
        const eventTile = clampTile(map, toTilePoint(map, event.x(), event.y()));
        if (tilesEqual(eventTile, tile)) {
            return { id, tile: eventTile };
        }
    }
    return null;
}

function getSceneEvents(engine: RpgClientEngine): Record<string, ClientEventLike> {
    const eventsSignal = (
        engine.scene as unknown as { events?: () => Record<string, ClientEventLike> }
    ).events;
    return eventsSignal?.() ?? {};
}

function getCurrentMapId(engine: RpgClientEngine): string | null {
    const mapData = (engine.scene.data?.() ?? null) as { id?: string } | null;
    return typeof mapData?.id === "string" ? mapData.id : null;
}

function getTiledMap(engine: RpgClientEngine): TiledMapLike | null {
    const mapData = (engine.scene.data?.() ?? null) as { tiled?: TiledMapLike } | null;
    return mapData?.tiled ?? null;
}

function getCurrentPlayer(engine: RpgClientEngine): ClientPlayerLike | null {
    return (engine.getCurrentPlayer?.() ?? null) as ClientPlayerLike | null;
}

function getSceneMap(engine: RpgClientEngine): SceneMapLike | null {
    return (engine as unknown as { sceneMap?: SceneMapLike }).sceneMap ?? null;
}

function getViewport(engine: RpgClientEngine): ViewportLike | null {
    const canvasElement = (
        engine as unknown as {
            canvasElement?: { props?: { context?: { viewport?: ViewportLike } } };
        }
    ).canvasElement;
    return canvasElement?.props?.context?.viewport ?? null;
}

function getCanvasElement(): HTMLCanvasElement | null {
    return document.querySelector<HTMLCanvasElement>("#rpg canvas");
}

function isBlockingUiOpen(): boolean {
    return !!document.querySelector(BLOCKING_UI_SELECTOR);
}

function isBlockingUiTarget(target: EventTarget | null): boolean {
    return target instanceof Element && !!target.closest(TARGET_BLOCKING_UI_SELECTOR);
}

function issueHintInteraction(
    engine: RpgClientEngine,
    hint: ReturnType<typeof getCurrentInteractionHint>,
): void {
    if (!hint) return;
    triggerInteractionHint(engine, hint);
}

function isCurrentPlayerTap(
    map: TiledMapLike,
    player: ClientPlayerLike,
    viewport: ViewportLike,
    screenX: number,
    screenY: number,
): boolean {
    const playerScreen = viewport.toScreen(
        player.x() + map.tilewidth / 2,
        player.y() + map.tileheight,
    );
    const radius = Math.max(map.tilewidth, map.tileheight) * PLAYER_TAP_RADIUS_MULTIPLIER;
    return (
        Math.abs(screenX - playerScreen.x) <= radius && Math.abs(screenY - playerScreen.y) <= radius
    );
}

function isPlayerSettledOnMovementGrid(player: ClientPlayerLike): boolean {
    return isAlignedToMovementGrid(player.x()) && isAlignedToMovementGrid(player.y());
}

function isAlignedToMovementGrid(value: number): boolean {
    return value % MOVEMENT_TILE_SIZE === 0;
}

function toTilePoint(map: TiledMapLike, x: number, y: number): TilePoint {
    return {
        x: Math.floor(x / MOVEMENT_TILE_SIZE),
        y: Math.floor(y / MOVEMENT_TILE_SIZE),
    };
}

function clampTile(map: TiledMapLike, tile: TilePoint): TilePoint {
    const { width, height } = getMovementGridSize(map);
    return {
        x: Math.max(0, Math.min(width - 1, tile.x)),
        y: Math.max(0, Math.min(height - 1, tile.y)),
    };
}

function getMovementGridSize(map: TiledMapLike): { width: number; height: number } {
    return {
        width: Math.max(1, Math.floor((map.width * map.tilewidth) / MOVEMENT_TILE_SIZE)),
        height: Math.max(1, Math.floor((map.height * map.tileheight) / MOVEMENT_TILE_SIZE)),
    };
}

function getAdjacentTiles(tile: TilePoint): TilePoint[] {
    return [
        { x: tile.x, y: tile.y - 1 },
        { x: tile.x + 1, y: tile.y },
        { x: tile.x, y: tile.y + 1 },
        { x: tile.x - 1, y: tile.y },
    ];
}

function tilesEqual(a: TilePoint, b: TilePoint): boolean {
    return a.x === b.x && a.y === b.y;
}

function tileKey(tile: TilePoint): string {
    return `${tile.x},${tile.y}`;
}

function applyTapRouteSnap(engine: RpgClientEngine, payload: TapRouteSnap): void {
    if (getCurrentMapId(engine) !== payload.mapId) {
        return;
    }

    const player = getCurrentPlayer(engine);
    const sceneMap = getSceneMap(engine);
    if (!player?.id || !sceneMap) {
        return;
    }

    const hitbox = typeof player.hitbox === "function" ? player.hitbox() : player.hitbox;
    const width = hitbox?.w ?? 0;
    const height = hitbox?.h ?? 0;
    sceneMap.updateHitbox(player.id, payload.x, payload.y, width, height);
    sceneMap.setBodyPosition(player.id, payload.x, payload.y, "top-left");
    const playerX = player.x as unknown as { set?: (value: number) => void };
    const playerY = player.y as unknown as { set?: (value: number) => void };
    playerX.set?.(Math.round(payload.x));
    playerY.set?.(Math.round(payload.y));
}
