import { Move, RpgPlayer } from "@rpgjs/server";
import {
    isTapRouteRequest,
    TAP_ROUTE_EVENT,
    TAP_ROUTE_SNAP_EVENT,
    type TapRouteInteraction,
    type TapRouteRequest,
    type TapRouteSnap,
    type TilePoint,
} from "./tap-route-contract";

const tapRouteVersions = new WeakMap<RpgPlayer, number>();

export function registerTapRouteListener(player: RpgPlayer): void {
    player.off(TAP_ROUTE_EVENT);
    player.on(TAP_ROUTE_EVENT, async (payload: unknown) => {
        await handleTapRouteRequest(player, payload);
    });
}

export function cancelTapRoute(player: RpgPlayer): void {
    bumpTapRouteVersion(player);
    player.breakRoutes(true);
}

export function emitPlayerPositionSnap(
    player: RpgPlayer,
    payload: Omit<TapRouteSnap, "version">,
): void {
    emitTapRouteSnap(player, {
        ...payload,
        version: bumpTapRouteVersion(player),
    });
}

export async function handleTapRouteRequest(player: RpgPlayer, payload: unknown): Promise<void> {
    if (!isTapRouteRequest(payload)) {
        return;
    }

    const map = player.getCurrentMap();
    if (!map || map.id !== payload.mapId) {
        return;
    }

    const normalizedRoute = normalizeTapRoutePath(
        payload.path,
        map.tileWidth,
        map.tileHeight,
        player.x(),
        player.y(),
    );
    if (!normalizedRoute) {
        return;
    }

    const routeVersion = bumpTapRouteVersion(player);
    player.breakRoutes(true);
    await player.teleport({
        x: normalizedRoute.startTile.x * map.tileWidth,
        y: normalizedRoute.startTile.y * map.tileHeight,
    });
    emitTapRouteSnap(player, {
        mapId: map.id,
        version: routeVersion,
        x: normalizedRoute.startTile.x * map.tileWidth,
        y: normalizedRoute.startTile.y * map.tileHeight,
    });

    const completed = await runTileRoute(player, normalizedRoute.startTile, normalizedRoute.path);
    if (!completed || getTapRouteVersion(player) !== routeVersion) {
        return;
    }

    const currentMap = player.getCurrentMap();
    if (!currentMap || currentMap.id !== payload.mapId) {
        return;
    }

    const destinationTile =
        normalizedRoute.path[normalizedRoute.path.length - 1] ?? normalizedRoute.startTile;
    if (normalizedRoute.path.length > 0) {
        await player.teleport({
            x: destinationTile.x * currentMap.tileWidth,
            y: destinationTile.y * currentMap.tileHeight,
        });
        emitTapRouteSnap(player, {
            mapId: currentMap.id,
            version: routeVersion,
            x: destinationTile.x * currentMap.tileWidth,
            y: destinationTile.y * currentMap.tileHeight,
        });
    }

    if (getTapRouteVersion(player) !== routeVersion) {
        return;
    }

    await triggerInteraction(player, payload.interaction);
}

function bumpTapRouteVersion(player: RpgPlayer): number {
    const next = (tapRouteVersions.get(player) ?? 0) + 1;
    tapRouteVersions.set(player, next);
    return next;
}

function getTapRouteVersion(player: RpgPlayer): number {
    return tapRouteVersions.get(player) ?? 0;
}

function toNearestTilePoint(
    x: number,
    y: number,
    tileWidth: number,
    tileHeight: number,
): TilePoint {
    return {
        x: Math.max(0, Math.round(x / tileWidth)),
        y: Math.max(0, Math.round(y / tileHeight)),
    };
}

function normalizeTapRoutePath(
    path: TilePoint[],
    tileWidth: number,
    tileHeight: number,
    playerX: number,
    playerY: number,
): { startTile: TilePoint; path: TilePoint[] } | null {
    const floorTile = {
        x: Math.floor(playerX / tileWidth),
        y: Math.floor(playerY / tileHeight),
    };
    const snappedTile = toNearestTilePoint(playerX, playerY, tileWidth, tileHeight);
    const candidates = tilesEqual(floorTile, snappedTile)
        ? [snappedTile]
        : [snappedTile, floorTile];

    for (const candidate of candidates) {
        const remaining = [...path];
        while (remaining.length > 0 && tilesEqual(remaining[0], candidate)) {
            remaining.shift();
        }
        if (isContiguousPath(candidate, remaining)) {
            return {
                startTile: candidate,
                path: remaining,
            };
        }
    }

    return null;
}

function isContiguousPath(startTile: TilePoint, path: TilePoint[]): boolean {
    let current = startTile;
    for (const nextTile of path) {
        const deltaX = Math.abs(nextTile.x - current.x);
        const deltaY = Math.abs(nextTile.y - current.y);
        if (deltaX + deltaY !== 1) {
            return false;
        }
        current = nextTile;
    }
    return true;
}

function tilesEqual(a: TilePoint, b: TilePoint): boolean {
    return a.x === b.x && a.y === b.y;
}

function emitTapRouteSnap(player: RpgPlayer, payload: TapRouteSnap): void {
    player.emit(TAP_ROUTE_SNAP_EVENT, payload);
}

async function runTileRoute(
    player: RpgPlayer,
    startTile: TilePoint,
    path: TilePoint[],
): Promise<boolean> {
    if (path.length === 0) {
        return true;
    }

    const routes = toMoveRoutes(startTile, path);
    if (routes.length === 0) {
        return false;
    }

    return player.moveRoutes(routes, {
        onStuck: () => false,
        stuckTimeout: 300,
        stuckThreshold: 1,
    });
}

function toMoveRoutes(startTile: TilePoint, path: TilePoint[]) {
    const routes: Array<ReturnType<typeof Move.tileRight>> = [];
    let current = startTile;

    for (const nextTile of path) {
        if (nextTile.x === current.x + 1 && nextTile.y === current.y) {
            routes.push(Move.tileRight());
        } else if (nextTile.x === current.x - 1 && nextTile.y === current.y) {
            routes.push(Move.tileLeft());
        } else if (nextTile.x === current.x && nextTile.y === current.y + 1) {
            routes.push(Move.tileDown());
        } else if (nextTile.x === current.x && nextTile.y === current.y - 1) {
            routes.push(Move.tileUp());
        } else {
            return [];
        }
        current = nextTile;
    }

    return routes;
}

async function triggerInteraction(
    player: RpgPlayer,
    interaction: TapRouteInteraction | null,
): Promise<void> {
    if (!interaction) {
        return;
    }

    const event = player.getCurrentMap()?.getEvent?.(interaction.eventId);
    if (!event?.execMethod) {
        return;
    }

    const hookName = interaction.kind === "touch" ? "onPlayerTouch" : "onAction";
    await event.execMethod(hookName, [player]);
}
