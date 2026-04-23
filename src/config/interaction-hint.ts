import type { RpgClientEngine } from "@rpgjs/client";
import { Direction } from "@rpgjs/common";
import { INTERACTION_HINT_CONFIG } from "../content/gameplay";
import {
    clampTileToBounds,
    getTiledObjectTiles,
    isEncounterObject,
    manhattanDistance,
    tilePointFromWorld,
    tilesEqual,
    type TiledMapLike,
    type TilePoint,
} from "./tiled-object";

type ClientPlayerLike = {
    x(): number;
    y(): number;
};

type ClientEventLike = {
    x(): number;
    y(): number;
};

export type InteractionHintGlyph = "talk" | "battle" | "travel" | "search";

export type InteractionHint = {
    glyph: InteractionHintGlyph;
    targetId: string;
    interaction: { kind: "action" } | { kind: "touch"; direction: Direction | null };
};

const BATTLE_EVENT_IDS = new Set(INTERACTION_HINT_CONFIG.battleEventIds);
const emittedDevWarnings = new Set<string>();

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
    const engineRecord = asRecord(engine);
    const sceneMap = asRecord(engineRecord?.sceneMap);
    const sceneMapEvents = sceneMap?.events;
    if (typeof sceneMapEvents === "function") {
        return toClientEventRecord(sceneMapEvents.call(sceneMap));
    }

    const scene = asRecord(engine.scene);
    const sceneEvents = scene?.events;
    if (typeof sceneEvents === "function") {
        return toClientEventRecord(sceneEvents.call(scene));
    }

    warnDev("RPG.js scene does not expose sceneMap.events() or scene.events()");
    return {};
}

function getTiledMap(engine: RpgClientEngine): TiledMapLike | null {
    const scene = asRecord(engine.scene);
    const data = scene?.data;
    if (typeof data !== "function") {
        warnDev("RPG.js scene does not expose scene.data()");
        return null;
    }

    const mapData = asRecord(data.call(scene));
    const tiled = mapData?.tiled;
    if (!isTiledMapLike(tiled)) {
        warnDev("RPG.js scene.data() did not include a usable tiled map");
        return null;
    }

    return tiled;
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
    return tilePointFromWorld(x, y, map.tilewidth, map.tileheight);
}

function clampTile(map: TiledMapLike, tile: TilePoint): TilePoint {
    return clampTileToBounds(tile, map);
}

function directionBetween(from: TilePoint, to: TilePoint): Direction | null {
    if (to.x === from.x + 1 && to.y === from.y) return Direction.Right;
    if (to.x === from.x - 1 && to.y === from.y) return Direction.Left;
    if (to.x === from.x && to.y === from.y + 1) return Direction.Down;
    if (to.x === from.x && to.y === from.y - 1) return Direction.Up;
    return null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
    return value !== null && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function isClientEventLike(value: unknown): value is ClientEventLike {
    const event = asRecord(value);
    return typeof event?.x === "function" && typeof event.y === "function";
}

function toClientEventRecord(value: unknown): Record<string, ClientEventLike> {
    const record = asRecord(value);
    if (!record) return {};

    const events: Record<string, ClientEventLike> = {};
    for (const [id, event] of Object.entries(record)) {
        if (isClientEventLike(event)) {
            events[id] = event;
        }
    }
    return events;
}

function isTiledMapLike(value: unknown): value is TiledMapLike {
    const map = asRecord(value);
    return (
        typeof map?.width === "number" &&
        typeof map.height === "number" &&
        typeof map.tilewidth === "number" &&
        typeof map.tileheight === "number" &&
        typeof map.getTileByPosition === "function"
    );
}

function warnDev(message: string): void {
    const env = import.meta.env as Record<string, unknown> | undefined;
    if (env?.DEV === true && env.TEST !== true && !emittedDevWarnings.has(message)) {
        emittedDevWarnings.add(message);
        console.debug(`[interaction-hint] ${message}`);
    }
}
