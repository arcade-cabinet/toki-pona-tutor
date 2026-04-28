/**
 * Indoor chunk generator — shop, inn, house, cave, shrine interiors.
 *
 * Per docs/WORLD_GENERATION.md § Indoor archetypes.
 * Dimensions: 16 × 12 tiles. Single-room or two-room interiors.
 */

import type { IndoorArchetype } from "./world-generator";
import type { Seed } from "./seed";
import { createRng } from "./seed";

export const INDOOR_WIDTH = 16;
export const INDOOR_HEIGHT = 12;

export type IndoorNpcSpawn = { x: number; y: number; spawnIndex: number };
export type IndoorChestSpawn = { x: number; y: number };

export type IndoorChunk = {
    tiles: string[][];
    collision: boolean[][];
    exitX: number;
    exitY: number;
    npcSpawns: IndoorNpcSpawn[];
    chestSpawns: IndoorChestSpawn[];
};

// ─── Tile palettes per archetype ──────────────────────────────────────────────

type IndoorPalette = {
    wall: string;
    floor: string;
    accent: string;
    furniture: string[];
};

const PALETTES: Record<IndoorArchetype, IndoorPalette> = {
    shop_interior:   { wall: "wall_plank",   floor: "floor_wood",     accent: "counter_wood", furniture: ["shelf_item", "display_case"] },
    inn_interior:    { wall: "wall_plank",   floor: "floor_wood",     accent: "bed_simple",   furniture: ["table_round", "chair_wood"] },
    elder_house:     { wall: "wall_stone",   floor: "floor_stone",    accent: "hearth_stone", furniture: ["chair_old", "bookshelf"] },
    resident_house:  { wall: "wall_plank",   floor: "floor_wood",     accent: "bed_simple",   furniture: ["table_square", "chest_small"] },
    cave_interior:   { wall: "wall_cave",    floor: "floor_cave",     accent: "torch_wall",   furniture: ["stalactite", "rubble_pile"] },
    shrine_interior: { wall: "wall_shrine",  floor: "floor_shrine",   accent: "altar_stone",  furniture: ["candle_tall", "prayer_mat"] },
};

// NPCs per archetype (0 = no NPC)
const NPC_COUNTS: Record<IndoorArchetype, number> = {
    shop_interior:  1,
    inn_interior:   1,
    elder_house:    1,
    resident_house: 1,
    cave_interior:  0,
    shrine_interior:0,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptyGrid<T>(fill: T): T[][] {
    return Array.from({ length: INDOOR_HEIGHT }, () => Array(INDOOR_WIDTH).fill(fill) as T[]);
}

// ─── Interior generator ───────────────────────────────────────────────────────

export function generateIndoorChunk(
    seed: Seed,
    coord: { x: number; y: number },
    archetype: IndoorArchetype,
): IndoorChunk {
    const pal = PALETTES[archetype];
    const tiles = emptyGrid(pal.floor);
    const coll = emptyGrid(false);

    // Perimeter walls
    for (let x = 0; x < INDOOR_WIDTH; x++) {
        tiles[0]![x] = pal.wall; coll[0]![x] = true;
        tiles[INDOOR_HEIGHT - 1]![x] = pal.wall; coll[INDOOR_HEIGHT - 1]![x] = true;
    }
    for (let y = 0; y < INDOOR_HEIGHT; y++) {
        tiles[y]![0] = pal.wall; coll[y]![0] = true;
        tiles[y]![INDOOR_WIDTH - 1] = pal.wall; coll[y]![INDOOR_WIDTH - 1] = true;
    }

    // Cave interior: extra rock columns inside
    if (archetype === "cave_interior") {
        const rng = createRng(((seed >>> 0) ^ (coord.x * 1000003) ^ (coord.y * 999983)) >>> 0, "cave-detail");
        for (let i = 0; i < 6; i++) {
            const cx = rng.range(2, INDOOR_WIDTH - 3);
            const cy = rng.range(2, INDOOR_HEIGHT - 3);
            tiles[cy]![cx] = "rock_column";
            coll[cy]![cx] = true;
        }
    }

    // Shrine: altar in center
    if (archetype === "shrine_interior") {
        const ax = Math.floor(INDOOR_WIDTH / 2);
        const ay = Math.floor(INDOOR_HEIGHT / 2) - 1;
        tiles[ay]![ax] = pal.accent;
        coll[ay]![ax] = true;
        // Candles flanking altar
        tiles[ay]![ax - 1] = "candle_tall";
        tiles[ay]![ax + 1] = "candle_tall";
    }

    // Shop/inn: counter
    if (archetype === "shop_interior") {
        for (let x = 3; x < INDOOR_WIDTH - 3; x++) {
            tiles[2]![x] = pal.accent;
            coll[2]![x] = true;
        }
    }

    // Inn: beds row
    if (archetype === "inn_interior") {
        for (let x = 3; x < INDOOR_WIDTH - 3; x += 3) {
            tiles[2]![x] = "bed_simple";
            tiles[2]![x + 1] = "bed_simple";
            coll[2]![x] = true;
            coll[2]![x + 1] = true;
        }
    }

    // Place accent furniture (seeded scatter)
    const furRng = createRng(
        ((seed >>> 0) ^ (coord.x * 49291) ^ (coord.y * 73856093) ^ archetype.length) >>> 0,
        `indoor-furn:${archetype}`,
    );
    const furCount = furRng.range(2, 4);
    for (let i = 0; i < furCount; i++) {
        const fx = furRng.range(2, INDOOR_WIDTH - 3);
        const fy = furRng.range(3, INDOOR_HEIGHT - 3);
        if (!coll[fy]?.[fx]) {
            tiles[fy]![fx] = furRng.pick(pal.furniture);
            coll[fy]![fx] = true;
        }
    }

    // Exit warp: bottom-center door tile
    const exitX = Math.floor(INDOOR_WIDTH / 2);
    const exitY = INDOOR_HEIGHT - 1;
    tiles[exitY]![exitX] = "door_exit";
    coll[exitY]![exitX] = false; // walkable to exit

    // NPC spawns
    const npcRng = createRng(
        ((seed >>> 0) ^ (coord.x * 31337) ^ (coord.y * 2654435761)) >>> 0,
        `indoor-npc:${archetype}`,
    );
    const npcCount = NPC_COUNTS[archetype];
    const npcSpawns: IndoorNpcSpawn[] = [];
    for (let i = 0; i < npcCount; i++) {
        npcSpawns.push({
            x: npcRng.range(2, INDOOR_WIDTH - 3),
            y: npcRng.range(3, INDOOR_HEIGHT - 4),
            spawnIndex: i,
        });
    }

    // Chest spawns (cave = 1-2; others = 0)
    const chestSpawns: IndoorChestSpawn[] = [];
    if (archetype === "cave_interior") {
        const chestRng = createRng(
            ((seed >>> 0) ^ (coord.x * 999983) ^ (coord.y * 1000003) ^ 0xca) >>> 0,
            "cave-chest",
        );
        const chestCount = chestRng.range(1, 2);
        for (let i = 0; i < chestCount; i++) {
            let cx: number;
            let cy: number;
            do {
                cx = chestRng.range(2, INDOOR_WIDTH - 3);
                cy = chestRng.range(2, INDOOR_HEIGHT - 3);
            } while (coll[cy]?.[cx]);
            chestSpawns.push({ x: cx, y: cy });
        }
    }

    return { tiles, collision: coll, exitX, exitY, npcSpawns, chestSpawns };
}
