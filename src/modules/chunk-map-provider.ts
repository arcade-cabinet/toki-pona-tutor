/**
 * Chunk map provider — bridges world-generator realized chunks to the RPG.js
 * tiled-map pipeline.
 *
 * Produces a minimal TMJ-format `parsedMap` object for a given (seed, coord)
 * that the tiledmap plugin's `onBeforeUpdate` hook consumes for physics and
 * collision. The server module (`chunkMapProviderModule`) is wired into
 * `src/server.ts` via `provideServerModules`.
 *
 * Map ID convention: `chunk_X_Y` (e.g. `chunk_0_0`, `chunk_-3_7`).
 *
 * Per docs/WORLD_GENERATION.md § "Fixed map registry in src/standalone.ts — retired."
 */

import { defineModule } from "@rpgjs/common";
import type { RpgServer } from "@rpgjs/server";
import { chunkType, chunkName } from "./world-generator";
import { OUTDOOR_WIDTH, OUTDOOR_HEIGHT } from "./outdoor-chunk-generator";
import { createRng, hashCoord, type Seed } from "./seed";
import type { ChunkCoord } from "./world-generator";

// ─── Public constants ─────────────────────────────────────────────────────────

export const CHUNK_WIDTH = OUTDOOR_WIDTH;   // 32 tiles
export const CHUNK_HEIGHT = OUTDOOR_HEIGHT; // 24 tiles
export const TILE_SIZE = 16;                // pixels

// ─── Public types ─────────────────────────────────────────────────────────────

export type TmjProperty = {
    name: string;
    type: "string" | "int" | "float" | "bool";
    value: string | number | boolean;
};

export type TmjObject = {
    id: number;
    name: string;
    type: string;
    x: number;
    y: number;
    width: number;
    height: number;
    visible: boolean;
    point?: boolean;
    properties?: TmjProperty[];
};

export type TmjLayer =
    | {
          id: number;
          name: string;
          type: "tilelayer";
          visible: boolean;
          opacity: number;
          x: number;
          y: number;
          width: number;
          height: number;
          data: number[];
          properties?: TmjProperty[];
      }
    | {
          id: number;
          name: string;
          type: "objectgroup";
          visible: boolean;
          opacity: number;
          x: number;
          y: number;
          objects: TmjObject[];
          properties?: TmjProperty[];
      };

export type TmjTileset = {
    firstgid: number;
    name: string;
    tilewidth: number;
    tileheight: number;
    tilecount: number;
    columns: number;
    margin: number;
    spacing: number;
    image?: { source: string; width: number; height: number };
    tiles?: Array<{ id: number; properties?: TmjProperty[] }>;
};

export type TmjParsedMap = {
    type: "map";
    version: string;
    orientation: "orthogonal";
    renderorder: "right-down";
    width: number;
    height: number;
    tilewidth: number;
    tileheight: number;
    infinite: boolean;
    tilesets: TmjTileset[];
    layers: TmjLayer[];
    properties?: TmjProperty[];
};

// ─── Chunk map id encoding ────────────────────────────────────────────────────

const CHUNK_ID_RE = /^chunk_(-?\d+)_(-?\d+)$/;

export function chunkMapId(x: number, y: number): string {
    return `chunk_${x}_${y}`;
}

export function parseChunkMapId(mapId: string): ChunkCoord | null {
    const m = CHUNK_ID_RE.exec(mapId);
    if (!m) return null;
    return { x: Number(m[1]), y: Number(m[2]) };
}

// ─── Tileset definitions ──────────────────────────────────────────────────────

// One inline tileset with a single walkable tile. The seasons grassland tileset
// image is served from public/assets/tilesets. Tile 0 (GID 1) = plain grass,
// no collision property → fully walkable.
//
// This is the minimal first-cut: all chunks share one flat tileset so the
// physics pipeline can compute dimensions and collision correctly. Visual
// variety is added in a later pass once the token→GID mapping layer exists.
const GRASSLAND_TILESET: TmjTileset = {
    firstgid: 1,
    name: "Tileset_Ground_Seasons",
    tilewidth: 16,
    tileheight: 16,
    tilecount: 4560,
    columns: 48,
    margin: 0,
    spacing: 0,
    image: {
        source: "/assets/tilesets/seasons/Art/Ground Tilesets/Atlas_Tileset_Ground_Seasons.png",
        width: 768,
        height: 1520,
    },
    tiles: [],
};

const BIOME_TILESET_MAP = {
    grassland:       GRASSLAND_TILESET,
    forest:          GRASSLAND_TILESET,
    coast:           GRASSLAND_TILESET,
    snowfield:       GRASSLAND_TILESET,
    cavern_approach: GRASSLAND_TILESET,
    river_edge:      GRASSLAND_TILESET,
    thinning_forest: GRASSLAND_TILESET,
    frost_forest:    GRASSLAND_TILESET,
    stony_grassland: GRASSLAND_TILESET,
    marsh:           GRASSLAND_TILESET,
    tundra:          GRASSLAND_TILESET,
    dry_coast:       GRASSLAND_TILESET,
} as const;

// Tile GID 1 = first tile in Tileset_Ground_Seasons (row 0, col 0) — plain grass.
// GID 4 shifts one row down for a slight visual variation with the same
// no-collision property. No tile in this tileset has collision=true by default.
const BASE_GID = 1;

// ─── Tile data generation ─────────────────────────────────────────────────────

function buildTileLayer(seed: Seed, coord: ChunkCoord, w: number, h: number): number[] {
    // Use the chunk's seeded RNG to pick among a small palette of grass-family
    // GIDs (all walkable). Keeps the visual simple but not monotone.
    const rng = createRng(hashCoord(seed, coord.x, coord.y));
    const palette = [BASE_GID, BASE_GID, BASE_GID, BASE_GID + 1, BASE_GID + 2]; // weighted toward tile 1
    const data: number[] = [];
    for (let i = 0; i < w * h; i++) {
        const idx = rng.int(palette.length);
        data.push(palette[idx] ?? BASE_GID);
    }
    return data;
}

// ─── Edge warp objects ────────────────────────────────────────────────────────

type Direction = "north" | "south" | "east" | "west";

function edgeWarpObjects(coord: ChunkCoord, w: number, h: number): TmjObject[] {
    const pw = w * TILE_SIZE;
    const ph = h * TILE_SIZE;
    const thickness = TILE_SIZE; // 1 tile thick trigger zone

    const directions: Array<{
        dir: Direction;
        x: number;
        y: number;
        width: number;
        height: number;
        targetX: number;
        targetY: number;
        targetDx: number;
        targetDy: number;
    }> = [
        {
            dir: "north",
            x: 0, y: 0, width: pw, height: thickness,
            targetX: Math.floor(pw / 2), targetY: ph - TILE_SIZE * 2,
            targetDx: 0, targetDy: -1,
        },
        {
            dir: "south",
            x: 0, y: ph - thickness, width: pw, height: thickness,
            targetX: Math.floor(pw / 2), targetY: TILE_SIZE * 2,
            targetDx: 0, targetDy: 1,
        },
        {
            dir: "west",
            x: 0, y: 0, width: thickness, height: ph,
            targetX: pw - TILE_SIZE * 2, targetY: Math.floor(ph / 2),
            targetDx: -1, targetDy: 0,
        },
        {
            dir: "east",
            x: pw - thickness, y: 0, width: thickness, height: ph,
            targetX: TILE_SIZE * 2, targetY: Math.floor(ph / 2),
            targetDx: 1, targetDy: 0,
        },
    ];

    return directions.map((d, i) => {
        const targetX = coord.x + d.targetDx;
        const targetY = coord.y + d.targetDy;
        const targetMap = chunkMapId(targetX, targetY);
        return {
            id: i + 1,
            name: `edge_warp_${d.dir}`,
            type: "edge_warp",
            x: d.x,
            y: d.y,
            width: d.width,
            height: d.height,
            visible: true,
            properties: [
                { name: "direction", type: "string" as const, value: d.dir },
                { name: "targetMap", type: "string" as const, value: targetMap },
                { name: "targetX", type: "int" as const, value: d.targetX },
                { name: "targetY", type: "int" as const, value: d.targetY },
            ],
        };
    });
}

// ─── Public: buildChunkParsedMap ──────────────────────────────────────────────

/**
 * Build a TMJ-format parsedMap for the given chunk coordinate.
 *
 * The returned object is structurally compatible with what the tiledmap
 * plugin's `prepareTiledPhysicsData` (server) and `MapClass` (client)
 * expect: `width`, `height`, `tilewidth`, `tileheight`, `layers`,
 * `tilesets`. Tile data uses inline GIDs; no external tileset source
 * references that would require file fetching.
 *
 * All chunk kinds are supported. Indoor chunks use 16×12 tiles; all others
 * use 32×24. Village and landmark chunks use outdoor dimensions.
 */
export function buildChunkParsedMap(seed: Seed, coord: ChunkCoord): TmjParsedMap {
    const type = chunkType(seed, coord.x, coord.y);
    const name = chunkName(seed, coord);

    // Indoor chunks are 16×12 per spec; all other kinds use outdoor dimensions.
    const w = type.kind === "indoor" ? 16 : CHUNK_WIDTH;
    const h = type.kind === "indoor" ? 12 : CHUNK_HEIGHT;

    const tileset =
        type.kind === "outdoor"
            ? (BIOME_TILESET_MAP[type.biome] ?? GRASSLAND_TILESET)
            : GRASSLAND_TILESET;

    const tileData = buildTileLayer(seed, coord, w, h);
    const warpObjects = edgeWarpObjects(coord, w, h);

    const map: TmjParsedMap = {
        type: "map",
        version: "1.10",
        orientation: "orthogonal",
        renderorder: "right-down",
        width: w,
        height: h,
        tilewidth: TILE_SIZE,
        tileheight: TILE_SIZE,
        infinite: false,
        properties: [
            { name: "chunk_x", type: "int", value: coord.x },
            { name: "chunk_y", type: "int", value: coord.y },
            { name: "chunk_name", type: "string", value: name },
        ],
        tilesets: [{ ...tileset }],
        layers: [
            {
                id: 1,
                name: "Ground",
                type: "tilelayer",
                visible: true,
                opacity: 1,
                x: 0,
                y: 0,
                width: w,
                height: h,
                data: tileData,
            },
            {
                id: 2,
                name: "Objects",
                type: "objectgroup",
                visible: true,
                opacity: 1,
                x: 0,
                y: 0,
                objects: warpObjects,
            },
        ],
    };

    return map;
}

// ─── Server module ────────────────────────────────────────────────────────────

/**
 * RPG.js server module. Wire into src/server.ts via provideServerModules.
 *
 * Intercepts `map.onBeforeUpdate` for chunk map ids, injects a generated
 * `parsedMap` so the tiledmap plugin can build physics without fetching a
 * static .tmx file. Also registers edge-warp events so players can cross
 * chunk boundaries.
 *
 * The seed is read from the `WORLD_SEED` preference at map-load time.
 * While this introduces an async read, `onBeforeUpdate` is already async
 * in the engine's hook contract (the hook return is awaited via RxJS).
 */
export const chunkMapProviderModule = defineModule<RpgServer>({
    map: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async onBeforeUpdate(mapData: any, map: any) {
            if (mapData.parsedMap) return map;
            const id = typeof mapData.id === "string" ? mapData.id : "";
            const coord = parseChunkMapId(id);
            if (!coord) return map;

            // Resolve world seed from persistence (best-effort; default to 0).
            let seed = 0 as Seed;
            try {
                const { preferences, KEYS } = await import(
                    "../platform/persistence/preferences"
                );
                const { parseSeed } = await import("./seed");
                const raw = await preferences.get(KEYS.worldSeed);
                if (raw) seed = parseSeed(raw);
            } catch {
                // persistence unavailable during unit tests — use seed 0
            }

            const parsedMap = buildChunkParsedMap(seed, coord);

            mapData.parsedMap = parsedMap;
            mapData.width = parsedMap.width * parsedMap.tilewidth;
            mapData.height = parsedMap.height * parsedMap.tileheight;

            // Re-use the warp objects already embedded in the Objects layer to
            // avoid computing them twice and to guarantee consistency.
            const objLayer = parsedMap.layers.find(
                (l): l is Extract<TmjLayer, { type: "objectgroup" }> => l.type === "objectgroup",
            );
            const existingEvents = Array.isArray(mapData.events) ? mapData.events : [];
            if (objLayer) {
                const { Warp } = await import("./main/warp");
                const warpEvents = objLayer.objects
                    .filter((obj) => obj.type === "edge_warp")
                    .map((obj) => {
                        const prop = (name: string) =>
                            obj.properties?.find((p: TmjProperty) => p.name === name)?.value;
                        const targetMap = prop("targetMap") as string;
                        const targetX = prop("targetX") as number;
                        const targetY = prop("targetY") as number;
                        // RPG.js event registration uses tile coords, not pixels.
                        // Centre the trigger on the edge zone in tile units.
                        const tileX = Math.round((obj.x + obj.width / 2) / TILE_SIZE);
                        const tileY = Math.round((obj.y + obj.height / 2) / TILE_SIZE);
                        return {
                            name: obj.name,
                            x: tileX,
                            y: tileY,
                            event: Warp({ targetMap, position: { x: targetX, y: targetY } }),
                        };
                    });
                mapData.events = [...existingEvents, ...warpEvents];
            } else {
                mapData.events = existingEvents;
            }

            return map;
        },
    },
});
