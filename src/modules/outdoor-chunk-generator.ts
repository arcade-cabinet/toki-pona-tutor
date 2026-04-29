/**
 * Outdoor chunk generator — produces a runtime chunk data structure
 * (tile grid, collision layer, encounter zones, NPC spawn points) given
 * a ChunkType + (x, y) + seed.
 *
 * Per docs/WORLD_GENERATION.md § Grid geometry and § Chunk realization.
 * Dimensions: 32 × 24 tiles at 16×16 px each.
 *
 * Tile IDs are biome-keyed string tokens (e.g. "grass_plain", "snow_packed").
 * They map to tileset entries at render time. This module is pure data;
 * no rendering code lives here.
 */

import type { ChunkType, BiomeArchetype, TransitionalEdge } from "./world-generator";
import type { Seed } from "./seed";
import { createRng } from "./seed";

export const OUTDOOR_WIDTH = 32;
export const OUTDOOR_HEIGHT = 24;

export type EncounterZone = {
    x: number;
    y: number;
    width: number;
    height: number;
    encounterRate: number; // 0-1; 0.6 = 60% chance per step
};

export type NpcSpawnPoint = {
    x: number;
    y: number;
    spawnIndex: number;
};

export type OutdoorChunk = {
    tiles: string[][];        // [y][x] — base tileset token
    collision: boolean[][];  // [y][x] — true = impassable
    encounterZones: EncounterZone[];
    npcSpawns: NpcSpawnPoint[];
};

// ─── Tile palettes by biome ───────────────────────────────────────────────────

const BIOME_TILES: Record<BiomeArchetype | TransitionalEdge, { base: string[]; accent: string[]; block: string }> = {
    grassland:        { base: ["grass_plain", "grass_short", "grass_tufted"], accent: ["flower_yellow", "flower_white"], block: "tree_oak" },
    forest:           { base: ["grass_fern", "path_dirt", "leaf_ground"],     accent: ["fern_patch", "mushroom"],       block: "tree_pine" },
    coast:            { base: ["sand_dry", "sand_wet", "pebble_shore"],       accent: ["driftwood", "seagrass"],        block: "rock_coastal" },
    snowfield:        { base: ["snow_packed", "snow_fresh", "frost_ground"],  accent: ["frost_crystal", "ice_patch"],   block: "pine_snow" },
    cavern_approach:  { base: ["rock_grey", "gravel_coarse", "scree"],        accent: ["boulder_small", "lichen"],      block: "rock_large" },
    river_edge:       { base: ["grass_marsh", "peat_wet", "reed_base"],       accent: ["reed_clump", "mudpatch"],       block: "willow_tree" },
    thinning_forest:  { base: ["grass_tufted", "grass_sparse", "path_dirt"],  accent: ["stump", "fern_patch"],          block: "tree_oak" },
    frost_forest:     { base: ["snow_packed", "leaf_ground", "frost_ground"], accent: ["icicle_hang", "fern_dead"],     block: "tree_pine" },
    stony_grassland:  { base: ["grass_plain", "gravel_coarse", "rock_grey"],  accent: ["boulder_small", "wildflower"],  block: "rock_large" },
    marsh:            { base: ["peat_wet", "grass_marsh", "mud_flat"],        accent: ["reed_clump", "mudpatch"],       block: "willow_tree" },
    tundra:           { base: ["frost_ground", "grass_sparse", "peat_wet"],   accent: ["frost_crystal", "dead_grass"],  block: "rock_large" },
    dry_coast:        { base: ["sand_dry", "pebble_shore", "grass_sparse"],   accent: ["driftwood", "seagrass"],        block: "rock_coastal" },
};

const LANDMARK_BASE: Record<string, { base: string[]; accent: string[]; block: string }> = {
    stone_shrine:  { base: ["grass_plain", "stone_path", "moss_stone"],    accent: ["flower_white", "candle_stub"],  block: "standing_stone" },
    lone_tower:    { base: ["gravel_coarse", "grass_sparse", "rock_grey"], accent: ["rubble", "lichen"],             block: "tower_base" },
    lake:          { base: ["water_deep", "water_shallow", "shore_pebble"],accent: ["water_lily", "reed_clump"],     block: "rock_coastal" },
    peak_overlook: { base: ["rock_grey", "scree", "frost_ground"],         accent: ["boulder_small", "lichen"],      block: "rock_large" },
    ruined_village:{ base: ["rubble", "grass_plain", "stone_path"],        accent: ["ruin_wall", "weed_crack"],      block: "ruin_wall_high" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function emptyGrid<T>(fill: T): T[][] {
    return Array.from({ length: OUTDOOR_HEIGHT }, () => Array(OUTDOOR_WIDTH).fill(fill) as T[]);
}

function palette(type: ChunkType): { base: string[]; accent: string[]; block: string } {
    if (type.kind === "outdoor") return BIOME_TILES[type.biome];
    if (type.kind === "landmark") return LANDMARK_BASE[type.landmark] ?? LANDMARK_BASE["stone_shrine"]!;
    // Fallback: shouldn't reach here for outdoor chunks
    return BIOME_TILES["grassland"];
}

// ─── Tile grid generation ─────────────────────────────────────────────────────

function buildTileGrid(seed: Seed, coord: { x: number; y: number }, type: ChunkType): string[][] {
    const pal = palette(type);
    const tiles = emptyGrid("grass_plain");
    const rng = createRng(
        ((seed >>> 0) ^ (coord.x * 1000003) ^ (coord.y * 999983)) >>> 0,
        `outdoor-tiles:${coord.x}:${coord.y}`,
    );

    for (let y = 0; y < OUTDOOR_HEIGHT; y++) {
        for (let x = 0; x < OUTDOOR_WIDTH; x++) {
            // Border row/col = perimeter tile (same base, used for collision)
            if (y === 0 || y === OUTDOOR_HEIGHT - 1 || x === 0 || x === OUTDOOR_WIDTH - 1) {
                tiles[y]![x] = pal.base[0]!;
                continue;
            }
            // Accent tile: ~8% chance
            if (rng.chance(0.08)) {
                tiles[y]![x] = rng.pick(pal.accent);
            } else {
                tiles[y]![x] = rng.pick(pal.base);
            }
        }
    }

    // Coast biome: bottom 3 rows = water
    if (type.kind === "outdoor" && (type.biome === "coast" || type.biome === "dry_coast")) {
        for (let y = OUTDOOR_HEIGHT - 3; y < OUTDOOR_HEIGHT; y++) {
            for (let x = 0; x < OUTDOOR_WIDTH; x++) {
                tiles[y]![x] = y === OUTDOOR_HEIGHT - 3 ? "water_shallow" : "water_deep";
            }
        }
    }

    // Landmark lake: fill interior with water
    if (type.kind === "landmark" && type.landmark === "lake") {
        for (let y = 2; y < OUTDOOR_HEIGHT - 2; y++) {
            for (let x = 2; x < OUTDOOR_WIDTH - 2; x++) {
                tiles[y]![x] = y < 4 || y >= OUTDOOR_HEIGHT - 4 ? "water_shallow" : "water_deep";
            }
        }
    }

    return tiles;
}

// ─── Collision layer ──────────────────────────────────────────────────────────

function buildCollision(seed: Seed, coord: { x: number; y: number }, type: ChunkType, tiles: string[][]): boolean[][] {
    const coll = emptyGrid(false);
    const rng = createRng(
        ((seed >>> 0) ^ (coord.x * 999983) ^ (coord.y * 1000003) ^ 0xc0115101) >>> 0,
        `outdoor-coll:${coord.x}:${coord.y}`,
    );

    const blockTile = palette(type).block;

    for (let y = 0; y < OUTDOOR_HEIGHT; y++) {
        for (let x = 0; x < OUTDOOR_WIDTH; x++) {
            const tile = tiles[y]![x]!;
            // Border is always impassable
            if (y === 0 || y === OUTDOOR_HEIGHT - 1 || x === 0 || x === OUTDOOR_WIDTH - 1) {
                coll[y]![x] = true;
                continue;
            }
            // Water tiles are impassable
            if (tile.startsWith("water_")) {
                coll[y]![x] = true;
                continue;
            }
            // Block tiles (trees, rocks) placed with ~10% density in interior
            if (rng.chance(0.10)) {
                tiles[y]![x] = blockTile; // overwrite tile with block
                coll[y]![x] = true;
            }
        }
    }
    return coll;
}

// ─── Encounter zones ──────────────────────────────────────────────────────────

function buildEncounterZones(seed: Seed, coord: { x: number; y: number }): EncounterZone[] {
    const rng = createRng(
        ((seed >>> 0) ^ (coord.x * 31337) ^ (coord.y * 49291)) >>> 0,
        `outdoor-enc:${coord.x}:${coord.y}`,
    );
    const count = rng.range(1, 4);
    const zones: EncounterZone[] = [];

    // Divide interior (2..29 × 2..21) into bands; place one zone per band
    const bandH = Math.floor((OUTDOOR_HEIGHT - 4) / count);
    for (let i = 0; i < count; i++) {
        const bandY = 2 + i * bandH;
        const zw = rng.range(4, 8);
        const zh = rng.range(2, 4);
        const zx = rng.range(2, OUTDOOR_WIDTH - 2 - zw);
        const zy = rng.range(bandY, Math.min(bandY + bandH - zh, OUTDOOR_HEIGHT - 3 - zh));
        zones.push({ x: zx, y: zy, width: zw, height: zh, encounterRate: 0.5 + rng.next() * 0.3 });
    }
    return zones;
}

// ─── NPC spawn points ─────────────────────────────────────────────────────────

function buildNpcSpawns(seed: Seed, coord: { x: number; y: number }, type: ChunkType): NpcSpawnPoint[] {
    // Outdoor chunks: 0-2 wandering NPCs; landmarks with NPC: 1-2
    const rng = createRng(
        ((seed >>> 0) ^ (coord.x * 73856093) ^ (coord.y * 19349663)) >>> 0,
        `outdoor-npc:${coord.x}:${coord.y}`,
    );

    let count = 0;
    if (type.kind === "landmark") {
        const noNpcLandmarks: string[] = ["lake"];
        const lm = type.landmark;
        count = noNpcLandmarks.includes(lm) ? 0 : rng.range(1, 2);
    } else {
        // Regular outdoor: sparse wanderers
        count = rng.chance(0.4) ? rng.range(1, 2) : 0;
    }

    const spawns: NpcSpawnPoint[] = [];
    for (let i = 0; i < count; i++) {
        spawns.push({
            x: rng.range(2, OUTDOOR_WIDTH - 2),
            y: rng.range(2, OUTDOOR_HEIGHT - 2),
            spawnIndex: i,
        });
    }
    return spawns;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a runtime outdoor chunk for a given chunk type and coordinates.
 * Accepts outdoor and landmark chunk types; returns OUTDOOR_WIDTH × OUTDOOR_HEIGHT data.
 */
export function generateOutdoorChunk(
    seed: Seed,
    coord: { x: number; y: number },
    type: ChunkType,
): OutdoorChunk {
    const tiles = buildTileGrid(seed, coord, type);
    const collision = buildCollision(seed, coord, type, tiles);
    const encounterZones = buildEncounterZones(seed, coord);
    const npcSpawns = buildNpcSpawns(seed, coord, type);
    return { tiles, collision, encounterZones, npcSpawns };
}
