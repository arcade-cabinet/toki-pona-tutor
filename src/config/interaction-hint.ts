import type { RpgClientEngine } from "@rpgjs/client";
import { Direction } from "@rpgjs/common";
import { INTERACTION_HINT_CONFIG } from "../content/gameplay";
import {
    getTiledObjectTiles,
    isEncounterObject,
    manhattanDistance,
    tilesEqual,
    type TiledObjectLike,
    type TilePoint,
} from "./tiled-object";

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

        for (const tile of getTiledObjectTiles(map, object)) {
            if (tilesEqual(tile, currentTile)) {
                continue;
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
            distance: Math.abs(event.x() - player.x()) + Math.abs(event.y() - player.y()),
        }))
        .filter((event) => event.direction != null);

    interactable.sort((left, right) => {
        const leftWarp = left.id.startsWith("warp_") ? 0 : 1;
        const rightWarp = right.id.startsWith("warp_") ? 0 : 1;
        if (leftWarp !== rightWarp) return leftWarp - rightWarp;
        return left.distance - right.distance;
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
    const tileDx = Math.round(dx / map.tilewidth);
    const tileDy = Math.round(dy / map.tileheight);
    const horizontalReachTiles = Math.max(
        1,
        Math.round(Math.max(map.tilewidth * 2, 32) / map.tilewidth),
    );
    const verticalReachTiles = Math.max(
        1,
        Math.round(Math.max(map.tileheight * 2, 32) / map.tileheight),
    );

    if (tileDx === 0 && Math.abs(tileDy) >= 1 && Math.abs(tileDy) <= verticalReachTiles) {
        return tileDy < 0 ? Direction.Up : Direction.Down;
    }

    if (tileDy === 0 && Math.abs(tileDx) >= 1 && Math.abs(tileDx) <= horizontalReachTiles) {
        return tileDx < 0 ? Direction.Left : Direction.Right;
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
