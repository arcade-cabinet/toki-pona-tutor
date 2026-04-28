/**
 * Village chunk generator — slot-fill grammar for village archetypes.
 *
 * Per docs/WORLD_GENERATION.md § Village archetypes.
 * Dimensions: 28 × 20 tiles. Buildings placed deterministically per seed.
 * Each building has a door warp coord that links to an IndoorArchetype.
 */

import type { VillageArchetype, IndoorArchetype } from "./world-generator";
import type { Seed } from "./seed";
import { createRng } from "./seed";

export const VILLAGE_WIDTH = 28;
export const VILLAGE_HEIGHT = 20;

export type Building = {
    x: number;
    y: number;
    width: number;
    height: number;
    doorX: number;
    doorY: number;
    indoorArchetype: IndoorArchetype;
};

export type VillageCenter = {
    x: number;
    y: number;
    kind: "plaza" | "well" | "shrine";
};

export type VillageNpcSpawn = {
    x: number;
    y: number;
    spawnIndex: number;
};

export type VillageChunk = {
    tiles: string[][];
    collision: boolean[][];
    center: VillageCenter;
    buildings: Building[];
    npcSpawns: VillageNpcSpawn[];
};

// ─── Archetype slot definitions ───────────────────────────────────────────────

type SlotDef = { archetype: IndoorArchetype; required: boolean };

const ARCHETYPE_SLOTS: Record<VillageArchetype, SlotDef[]> = {
    small_hamlet: [
        { archetype: "shop_interior",    required: true },
        { archetype: "inn_interior",     required: true },
        { archetype: "elder_house",      required: true },
        { archetype: "resident_house",   required: false },
        { archetype: "resident_house",   required: false },
        { archetype: "resident_house",   required: false },
    ],
    market_town: [
        { archetype: "shop_interior",    required: true },
        { archetype: "shop_interior",    required: true },
        { archetype: "inn_interior",     required: true },
        { archetype: "elder_house",      required: true },
        { archetype: "resident_house",   required: false },
        { archetype: "resident_house",   required: false },
        { archetype: "resident_house",   required: false },
        { archetype: "resident_house",   required: false },
        { archetype: "resident_house",   required: false },
    ],
    snow_lodge: [
        { archetype: "shop_interior",    required: true },
        { archetype: "inn_interior",     required: true },
        { archetype: "elder_house",      required: true },
        { archetype: "resident_house",   required: false },
        { archetype: "resident_house",   required: false },
        { archetype: "resident_house",   required: false },
        { archetype: "resident_house",   required: false },
    ],
    road_stop: [
        { archetype: "inn_interior",     required: true },
        { archetype: "resident_house",   required: false },
        { archetype: "resident_house",   required: false },
    ],
    fishing_pier: [
        { archetype: "shop_interior",    required: true },
        { archetype: "inn_interior",     required: true },
        { archetype: "elder_house",      required: true },
        { archetype: "resident_house",   required: false },
        { archetype: "resident_house",   required: false },
        { archetype: "resident_house",   required: false },
    ],
    shrine_settlement: [
        { archetype: "shrine_interior",  required: true },
        { archetype: "elder_house",      required: true },
        { archetype: "resident_house",   required: false },
        { archetype: "resident_house",   required: false },
        { archetype: "resident_house",   required: false },
        { archetype: "resident_house",   required: false },
    ],
};

// ─── NPC counts per archetype ─────────────────────────────────────────────────

const ARCHETYPE_NPC_COUNT: Record<VillageArchetype, number> = {
    small_hamlet:       4,
    market_town:        7,
    snow_lodge:         5,
    road_stop:          2,
    fishing_pier:       4,
    shrine_settlement:  5,
};

// ─── Tile palettes ────────────────────────────────────────────────────────────

const ARCHETYPE_GROUND: Record<VillageArchetype, string> = {
    small_hamlet:      "grass_plain",
    market_town:       "stone_path",
    snow_lodge:        "snow_packed",
    road_stop:         "gravel_coarse",
    fishing_pier:      "sand_wet",
    shrine_settlement: "moss_stone",
};

const PATH_TILE = "path_stone";
const FENCE_TILE = "fence_wood";
const BUILDING_WALL = "wall_wood";
const BUILDING_FLOOR = "floor_wood";
const DOOR_TILE = "door_open";

// ─── Grid helpers ─────────────────────────────────────────────────────────────

function emptyGrid<T>(fill: T): T[][] {
    return Array.from({ length: VILLAGE_HEIGHT }, () => Array(VILLAGE_WIDTH).fill(fill) as T[]);
}

function paintRect(tiles: string[][], x: number, y: number, w: number, h: number, tile: string): void {
    for (let dy = 0; dy < h; dy++) {
        for (let dx = 0; dx < w; dx++) {
            const ty = y + dy;
            const tx = x + dx;
            if (ty >= 0 && ty < VILLAGE_HEIGHT && tx >= 0 && tx < VILLAGE_WIDTH) {
                tiles[ty]![tx] = tile;
            }
        }
    }
}

// ─── Building placement ───────────────────────────────────────────────────────

/** Slot buildings around the perimeter, leaving the center plaza open. */
function placeBuildings(
    seed: Seed,
    coord: { x: number; y: number },
    archetype: VillageArchetype,
    tiles: string[][],
    coll: boolean[][],
): Building[] {
    const rng = createRng(
        ((seed >>> 0) ^ (coord.x * 1000003) ^ (coord.y * 999983) ^ 0xb1d1) >>> 0,
        `village-bldg:${archetype}`,
    );
    const slots = ARCHETYPE_SLOTS[archetype];
    const buildings: Building[] = [];

    // Candidate positions: left column, right column, top row, bottom row
    // Buildings are 4×3 tiles. Perimeter margin = 1.
    const positions: Array<{ x: number; y: number }> = [
        { x: 1, y: 1 }, { x: 1, y: 5 }, { x: 1, y: 9 }, { x: 1, y: 13 },
        { x: 22, y: 1 }, { x: 22, y: 5 }, { x: 22, y: 9 }, { x: 22, y: 13 },
        { x: 6, y: 1 }, { x: 12, y: 1 }, { x: 18, y: 1 },
        { x: 6, y: 16 }, { x: 12, y: 16 }, { x: 18, y: 16 },
    ];
    const shuffledPos = rng.shuffle([...positions]);

    for (let i = 0; i < slots.length && i < shuffledPos.length; i++) {
        const slot = slots[i]!;
        const pos = shuffledPos[i]!;
        const bw = 4;
        const bh = 3;

        // Paint building footprint
        paintRect(tiles, pos.x, pos.y, bw, bh, BUILDING_WALL);
        // Floor interior (1 tile inset)
        if (bw > 2 && bh > 2) {
            paintRect(tiles, pos.x + 1, pos.y + 1, bw - 2, bh - 2, BUILDING_FLOOR);
        }

        // Door at bottom-center of building
        const doorX = pos.x + Math.floor(bw / 2);
        const doorY = pos.y + bh; // one tile south of building
        if (doorY < VILLAGE_HEIGHT) {
            tiles[doorY]![doorX] = DOOR_TILE;
        }

        // Collision: building walls are impassable, floor is passable
        for (let dy = 0; dy < bh; dy++) {
            for (let dx = 0; dx < bw; dx++) {
                const ty = pos.y + dy;
                const tx = pos.x + dx;
                if (ty < VILLAGE_HEIGHT && tx < VILLAGE_WIDTH) {
                    const isWall = dx === 0 || dx === bw - 1 || dy === 0;
                    coll[ty]![tx] = isWall;
                }
            }
        }

        buildings.push({
            x: pos.x,
            y: pos.y,
            width: bw,
            height: bh,
            doorX,
            doorY: pos.y + bh - 1,
            indoorArchetype: slot.archetype,
        });
    }
    return buildings;
}

// ─── Village chunk generator ──────────────────────────────────────────────────

export function generateVillageChunk(
    seed: Seed,
    coord: { x: number; y: number },
    archetype: VillageArchetype,
): VillageChunk {
    const ground = ARCHETYPE_GROUND[archetype];
    const tiles = emptyGrid(ground);
    const coll = emptyGrid(false);

    // Border = perimeter fence
    for (let x = 0; x < VILLAGE_WIDTH; x++) {
        tiles[0]![x] = FENCE_TILE; coll[0]![x] = true;
        tiles[VILLAGE_HEIGHT - 1]![x] = FENCE_TILE; coll[VILLAGE_HEIGHT - 1]![x] = true;
    }
    for (let y = 0; y < VILLAGE_HEIGHT; y++) {
        tiles[y]![0] = FENCE_TILE; coll[y]![0] = true;
        tiles[y]![VILLAGE_WIDTH - 1] = FENCE_TILE; coll[y]![VILLAGE_WIDTH - 1] = true;
    }

    // Main path: horizontal through center
    const pathY = Math.floor(VILLAGE_HEIGHT / 2);
    for (let x = 1; x < VILLAGE_WIDTH - 1; x++) {
        tiles[pathY]![x] = PATH_TILE;
    }

    // Center plaza (4×4 at center)
    const cx = Math.floor(VILLAGE_WIDTH / 2) - 2;
    const cy = Math.floor(VILLAGE_HEIGHT / 2) - 2;
    paintRect(tiles, cx, cy, 4, 4, PATH_TILE);

    const centerKindRng = createRng(
        ((seed >>> 0) ^ (coord.x * 73856093) ^ (coord.y * 19349663)) >>> 0,
        `village-center:${archetype}`,
    );
    const centerKinds: VillageCenter["kind"][] = archetype === "shrine_settlement"
        ? ["shrine"]
        : ["plaza", "well"];
    const center: VillageCenter = {
        x: cx + 1,
        y: cy + 1,
        kind: centerKindRng.pick(centerKinds),
    };
    // Center marker tile
    tiles[center.y]![center.x] = center.kind === "shrine" ? "shrine_stone" : center.kind === "well" ? "well_top" : "plaza_stone";

    // Place buildings
    const buildings = placeBuildings(seed, coord, archetype, tiles, coll);

    // NPC spawns: spread around the plaza and path
    const npcRng = createRng(
        ((seed >>> 0) ^ (coord.x * 49291) ^ (coord.y * 31337) ^ 0xf00d) >>> 0,
        `village-npc:${archetype}`,
    );
    const count = ARCHETYPE_NPC_COUNT[archetype];
    const npcSpawns: VillageNpcSpawn[] = [];
    for (let i = 0; i < count; i++) {
        npcSpawns.push({
            x: npcRng.range(3, VILLAGE_WIDTH - 4),
            y: npcRng.range(3, VILLAGE_HEIGHT - 4),
            spawnIndex: i,
        });
    }

    return { tiles, collision: coll, center, buildings, npcSpawns };
}
