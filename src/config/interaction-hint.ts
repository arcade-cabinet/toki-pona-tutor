import type { RpgClientEngine } from "@rpgjs/client";
import { Direction } from "@rpgjs/common";
import { INTERACTION_HINT_CONFIG } from "../content/gameplay";
import { readTiledObjectType, type TiledObjectLike } from "./tiled-object";

type TilePoint = {
    x: number;
    y: number;
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
    x(): number;
    y(): number;
};

type ClientEventLike = {
    x(): number;
    y(): number;
};

export type InteractionHintGlyph = "toki" | "utala" | "tawa" | "alasa";

export type InteractionHint = {
    glyph: InteractionHintGlyph;
    targetId: string;
    interaction: { kind: "action" } | { kind: "touch"; direction: Direction | null };
};

const BATTLE_EVENT_IDS = new Set(INTERACTION_HINT_CONFIG.battleEventIds);

export function getCurrentInteractionHint(engine: RpgClientEngine): InteractionHint | null {
    return getInteractionHintForPlayer(engine, getCurrentPlayer(engine));
}

export function getInteractionHintForPlayer(
    engine: RpgClientEngine,
    player: ClientPlayerLike | null,
): InteractionHint | null {
    const map = getTiledMap(engine);
    if (!map || !player) return null;

    const currentTile = clampTile(map, toTilePoint(map, player.x(), player.y()));

    const standingWarp = getEventAtTile(engine, map, currentTile);
    if (standingWarp?.id.startsWith("warp_")) {
        return {
            glyph: INTERACTION_HINT_CONFIG.glyphs.warp,
            targetId: standingWarp.id,
            interaction: { kind: "touch", direction: null },
        };
    }

    for (const event of getInteractableEvents(engine, map, player)) {
        if (event.id.startsWith("warp_")) {
            return {
                glyph: INTERACTION_HINT_CONFIG.glyphs.warp,
                targetId: event.id,
                interaction: {
                    kind: "touch",
                    direction: event.direction,
                },
            };
        }

        return {
            glyph: classifyEventGlyph(event.id),
            targetId: event.id,
            interaction: { kind: "action" },
        };
    }

    const encounterHint = getEncounterHint(map, currentTile);
    if (encounterHint) {
        return encounterHint;
    }
    return null;
}

export function triggerInteractionHint(engine: RpgClientEngine, hint: InteractionHint): boolean {
    if (hint.interaction.kind === "action") {
        engine.processAction({ action: "action" as never });
        return true;
    }

    if (hint.interaction.direction == null) {
        return false;
    }

    void engine.processInput({ input: hint.interaction.direction });
    return true;
}

function classifyEventGlyph(eventId: string): InteractionHintGlyph {
    if (BATTLE_EVENT_IDS.has(eventId)) {
        return INTERACTION_HINT_CONFIG.glyphs.battle;
    }

    return INTERACTION_HINT_CONFIG.glyphs.default;
}

function getEncounterHint(map: TiledMapLike, currentTile: TilePoint): InteractionHint | null {
    const objects = map.getAllObjects?.() ?? [];
    for (const object of objects) {
        if (!isEncounterObject(object)) continue;

        for (const tile of getObjectTiles(map, object)) {
            if (tilesEqual(tile, currentTile)) {
                return {
                    glyph: INTERACTION_HINT_CONFIG.glyphs.encounter,
                    targetId: object.name ?? INTERACTION_HINT_CONFIG.encounterFallbackTargetId,
                    interaction: { kind: "touch", direction: null },
                };
            }

            if (manhattanDistance(tile, currentTile) === 1) {
                return {
                    glyph: INTERACTION_HINT_CONFIG.glyphs.encounter,
                    targetId: object.name ?? INTERACTION_HINT_CONFIG.encounterFallbackTargetId,
                    interaction: {
                        kind: "touch",
                        direction: directionBetween(currentTile, tile),
                    },
                };
            }
        }
    }

    return null;
}

function isEncounterObject(object: TiledObjectLike): boolean {
    const type = readTiledObjectType(object);
    const name = String(object.name ?? "");
    return type === "Encounter" || name.startsWith("encounter_");
}

function getObjectTiles(map: TiledMapLike, object: TiledObjectLike): TilePoint[] {
    const x = Number(object.x ?? 0);
    const y = Number(object.y ?? 0);
    const width = Math.max(1, Number(object.width ?? map.tilewidth));
    const height = Math.max(1, Number(object.height ?? map.tileheight));

    const startTile = clampTile(map, toTilePoint(map, x, y));
    const endTile = clampTile(
        map,
        toTilePoint(map, Math.max(x + width - 1, x), Math.max(y + height - 1, y)),
    );

    const tiles: TilePoint[] = [];
    for (let tileY = startTile.y; tileY <= endTile.y; tileY += 1) {
        for (let tileX = startTile.x; tileX <= endTile.x; tileX += 1) {
            tiles.push({ x: tileX, y: tileY });
        }
    }

    return tiles;
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

function getInteractableEvents(
    engine: RpgClientEngine,
    map: TiledMapLike,
    player: ClientPlayerLike,
): Array<{ id: string; direction: Direction | null }> {
    const events = getSceneEvents(engine);
    const interactable = Object.entries(events)
        .map(([id, event]) => ({
            id,
            direction: directionToEvent(map, player, event),
        }))
        .filter((event) => event.direction != null);

    interactable.sort((left, right) => {
        const leftWarp = left.id.startsWith("warp_") ? 0 : 1;
        const rightWarp = right.id.startsWith("warp_") ? 0 : 1;
        if (leftWarp !== rightWarp) return leftWarp - rightWarp;
        return 0;
    });

    return interactable;
}

function getSceneEvents(engine: RpgClientEngine): Record<string, ClientEventLike> {
    const sceneMapEvents = (
        engine as unknown as { sceneMap?: { events?: () => Record<string, ClientEventLike> } }
    ).sceneMap?.events;
    if (sceneMapEvents) {
        return sceneMapEvents() ?? {};
    }
    const sceneEvents = (
        engine.scene as unknown as { events?: () => Record<string, ClientEventLike> }
    ).events;
    return sceneEvents?.() ?? {};
}

function getTiledMap(engine: RpgClientEngine): TiledMapLike | null {
    const mapData = (engine.scene.data?.() ?? null) as { tiled?: TiledMapLike } | null;
    return mapData?.tiled ?? null;
}

function getCurrentPlayer(engine: RpgClientEngine): ClientPlayerLike | null {
    return (engine.getCurrentPlayer?.() ?? null) as ClientPlayerLike | null;
}

function directionToEvent(
    map: TiledMapLike,
    player: ClientPlayerLike,
    event: ClientEventLike,
): Direction | null {
    const dx = event.x() - player.x();
    const dy = event.y() - player.y();
    const horizontalTolerance = Math.max(map.tilewidth, 16);
    const verticalTolerance = Math.max(map.tileheight, 16);
    const horizontalReach = Math.max(map.tilewidth * 2, 32);
    const verticalReach = Math.max(map.tileheight * 2, 32);

    if (
        Math.abs(dx) <= horizontalTolerance &&
        Math.abs(dy) <= verticalReach &&
        Math.abs(dy) >= map.tileheight
    ) {
        return dy < 0 ? Direction.Up : Direction.Down;
    }

    if (
        Math.abs(dy) <= verticalTolerance &&
        Math.abs(dx) <= horizontalReach &&
        Math.abs(dx) >= map.tilewidth
    ) {
        return dx < 0 ? Direction.Left : Direction.Right;
    }

    return null;
}

function toTilePoint(map: TiledMapLike, x: number, y: number): TilePoint {
    return {
        x: Math.floor(x / map.tilewidth),
        y: Math.floor(y / map.tileheight),
    };
}

function clampTile(map: TiledMapLike, tile: TilePoint): TilePoint {
    return {
        x: Math.max(0, Math.min(map.width - 1, tile.x)),
        y: Math.max(0, Math.min(map.height - 1, tile.y)),
    };
}

function directionBetween(from: TilePoint, to: TilePoint): Direction | null {
    if (to.x === from.x + 1 && to.y === from.y) return Direction.Right;
    if (to.x === from.x - 1 && to.y === from.y) return Direction.Left;
    if (to.x === from.x && to.y === from.y + 1) return Direction.Down;
    if (to.x === from.x && to.y === from.y - 1) return Direction.Up;
    return null;
}

function tilesEqual(a: TilePoint, b: TilePoint): boolean {
    return a.x === b.x && a.y === b.y;
}

function manhattanDistance(a: TilePoint, b: TilePoint): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
