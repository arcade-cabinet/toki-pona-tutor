/**
 * World generator — the deterministic, seeded, infinite chunk grid.
 *
 * Per docs/WORLD_GENERATION.md. All exported functions are pure; no hidden
 * state and no Math.random — every draw goes through the seeded PRNG factory
 * from seed.ts.
 *
 * Invariants:
 *   - `(seed, x, y) → ChunkType` is a pure function.
 *   - Starter chunk `(0, 0)` is always Outdoor(grassland) for every seed.
 *   - Village-density guarantee: a village within Chebyshev ≤3 of every point.
 *   - No Math.random; all randomness through createRng / hashCoord / deriveSeed.
 */

import { hashCoord, deriveSeed, createRng, type Seed } from "./seed";

// ─── Public types ─────────────────────────────────────────────────────────────

export type BiomeArchetype =
    | "grassland"
    | "forest"
    | "coast"
    | "snowfield"
    | "cavern_approach"
    | "river_edge";

export type TransitionalEdge =
    | "thinning_forest"
    | "frost_forest"
    | "stony_grassland"
    | "marsh"
    | "tundra"
    | "dry_coast";

export type VillageArchetype =
    | "small_hamlet"
    | "market_town"
    | "snow_lodge"
    | "road_stop"
    | "fishing_pier"
    | "shrine_settlement";

export type IndoorArchetype =
    | "shop_interior"
    | "inn_interior"
    | "elder_house"
    | "resident_house"
    | "cave_interior"
    | "shrine_interior";

export type LandmarkKind =
    | "stone_shrine"
    | "lone_tower"
    | "lake"
    | "peak_overlook"
    | "ruined_village";

export type ChunkType =
    | { kind: "outdoor"; biome: BiomeArchetype | TransitionalEdge }
    | { kind: "village"; archetype: VillageArchetype }
    | { kind: "indoor"; archetype: IndoorArchetype }
    | { kind: "landmark"; landmark: LandmarkKind };

export type ChunkCoord = { x: number; y: number };

export type RealizedChunk = {
    coord: ChunkCoord;
    type: ChunkType;
    name: string;
    guideNpc?: { spawnX: number; spawnY: number; dialogId: string };
};

// ─── Constants ────────────────────────────────────────────────────────────────

const BIOMES: BiomeArchetype[] = [
    "grassland",
    "forest",
    "coast",
    "snowfield",
    "cavern_approach",
    "river_edge",
];

const VILLAGE_ARCHETYPES: VillageArchetype[] = [
    "small_hamlet",
    "market_town",
    "snow_lodge",
    "road_stop",
    "fishing_pier",
    "shrine_settlement",
];

const LANDMARK_KINDS: LandmarkKind[] = [
    "stone_shrine",
    "lone_tower",
    "lake",
    "peak_overlook",
    "ruined_village",
];

// Biome graph adjacency distance. Distance > 1 triggers a transitional edge.
// grassland -- forest -- frost_forest -- snowfield
// grassland -- stony_grassland -- cavern_approach
// grassland -- marsh -- river_edge -- dry_coast -- coast
// grassland -- tundra -- snowfield
const BIOME_DISTANCES: Record<BiomeArchetype, Partial<Record<BiomeArchetype, number>>> = {
    grassland: { forest: 1, cavern_approach: 2, snowfield: 2, coast: 2, river_edge: 1 },
    forest: { grassland: 1, snowfield: 1, coast: 2, cavern_approach: 2, river_edge: 2 },
    coast: { grassland: 2, river_edge: 1, forest: 2, snowfield: 3, cavern_approach: 3 },
    snowfield: { forest: 1, grassland: 2, cavern_approach: 3, coast: 3, river_edge: 3 },
    cavern_approach: { grassland: 2, forest: 2, snowfield: 3, coast: 3, river_edge: 2 },
    river_edge: { grassland: 1, coast: 1, forest: 2, snowfield: 3, cavern_approach: 2 },
};

// Transitional edge chosen when base biomes are distance > 1
const EDGE_FOR: Partial<Record<`${BiomeArchetype}-${BiomeArchetype}`, TransitionalEdge>> = {
    "forest-snowfield": "frost_forest",
    "snowfield-forest": "frost_forest",
    "grassland-snowfield": "tundra",
    "snowfield-grassland": "tundra",
    "grassland-cavern_approach": "stony_grassland",
    "cavern_approach-grassland": "stony_grassland",
    "grassland-coast": "marsh",
    "coast-grassland": "marsh",
    "river_edge-forest": "marsh",
    "forest-river_edge": "marsh",
    "coast-forest": "dry_coast",
    "forest-coast": "dry_coast",
    "river_edge-snowfield": "tundra",
    "snowfield-river_edge": "tundra",
};

// Biome compass: each biome gets an angle bucket derived from seed.
// Per-seed, angles are spread 60° apart. Dot product of normalized coord
// direction with biome direction gives a weight bonus in [0, 1].
const TWO_PI = Math.PI * 2;

// ─── Internal: biome compass ──────────────────────────────────────────────────

function biomeAngles(seed: Seed): Record<BiomeArchetype, number> {
    // Each biome gets an angle derived from seed, spread ~60° apart
    const base = (deriveSeed(seed, "compass-base") / 0x100000000) * TWO_PI;
    const step = TWO_PI / BIOMES.length;
    const order = createRng(deriveSeed(seed, "compass-order")).shuffle(BIOMES.slice());
    const result = {} as Record<BiomeArchetype, number>;
    order.forEach((biome, i) => {
        result[biome] = (base + i * step) % TWO_PI;
    });
    return result;
}

// Cache compass per seed (pure, so safe across the call lifetime).
const compassCache = new Map<Seed, Record<BiomeArchetype, number>>();
function getCompass(seed: Seed): Record<BiomeArchetype, number> {
    const cached = compassCache.get(seed);
    if (cached) return cached;
    const angles = biomeAngles(seed);
    compassCache.set(seed, angles);
    return angles;
}

// ─── Internal: base biome (no neighbor dependency) ────────────────────────────

function baseBiome(seed: Seed, x: number, y: number): BiomeArchetype {
    if (x === 0 && y === 0) return "grassland";

    const compass = getCompass(seed);
    const len = Math.sqrt(x * x + y * y);
    const dirAngle = len === 0 ? 0 : Math.atan2(y, x);

    // Compute weight per biome: base weight + compass dot product contribution
    const weights = BIOMES.map((biome) => {
        const biomeAngle = compass[biome];
        const dot = Math.cos(dirAngle - biomeAngle); // in [-1, 1]
        // Reduce distance bias for very close coords (within 3 chunks)
        const distFactor = Math.min(1, len / 3);
        const weight = 1 + dot * distFactor;
        // Stir in coord hash for local variation
        const localHash = hashCoord(seed, x, y, BIOMES.indexOf(biome)) / 0x100000000;
        return weight * 0.7 + localHash * 0.3;
    });

    // Weighted pick
    const total = weights.reduce((s, w) => s + w, 0);
    const threshold = (hashCoord(seed, x, y, 0xff) / 0x100000000) * total;
    let acc = 0;
    for (let i = 0; i < BIOMES.length; i++) {
        acc += weights[i]!;
        if (acc >= threshold) return BIOMES[i]!;
    }
    return BIOMES[BIOMES.length - 1]!;
}

// ─── Internal: village density ────────────────────────────────────────────────

// Village period 7. Anchor = block center at bx*7 + 3, by*7 + 3.
// Max Chebyshev distance from any point in [bx*7..bx*7+6] to center = 3.
// Guarantees Chebyshev ≤3 density for all integer coords.
const VILLAGE_PERIOD = 7;
const VILLAGE_CENTER_OFFSET = 3;

// Euclidean-mod that always returns [0, m)
function mod(n: number, m: number): number {
    return ((n % m) + m) % m;
}

function needsVillage(_seed: Seed, x: number, y: number): boolean {
    if (x === 0 && y === 0) return false;
    // Anchor is at the center of each period-7 block
    return mod(x, VILLAGE_PERIOD) === VILLAGE_CENTER_OFFSET
        && mod(y, VILLAGE_PERIOD) === VILLAGE_CENTER_OFFSET;
}

// ─── Internal: landmark ───────────────────────────────────────────────────────

function isLandmarkCell(seed: Seed, x: number, y: number): boolean {
    if (x === 0 && y === 0) return false;
    // ~1 per 256 cells
    return (hashCoord(seed, x, y, 0x1a) & 0xff) === 0;
}

// ─── Internal: transitional edge ─────────────────────────────────────────────

function biomeDistance(a: BiomeArchetype, b: BiomeArchetype): number {
    if (a === b) return 0;
    return BIOME_DISTANCES[a]?.[b] ?? 3;
}

function edgeBiomeFor(a: BiomeArchetype, b: BiomeArchetype): TransitionalEdge {
    const key = `${a}-${b}` as `${BiomeArchetype}-${BiomeArchetype}`;
    return EDGE_FOR[key] ?? "stony_grassland";
}

function neighborsIncompatible(
    seed: Seed,
    x: number,
    y: number,
    myBiome: BiomeArchetype,
): false | TransitionalEdge {
    const dirs: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dx, dy] of dirs) {
        const nb = baseBiome(seed, x + dx, y + dy);
        if (biomeDistance(myBiome, nb) > 1) {
            return edgeBiomeFor(myBiome, nb);
        }
    }
    return false;
}

// ─── Internal: archetype helpers ─────────────────────────────────────────────

function sampleVillageArchetype(seed: Seed, x: number, y: number): VillageArchetype {
    const h = hashCoord(seed, x, y, 0x77);
    return VILLAGE_ARCHETYPES[h % VILLAGE_ARCHETYPES.length]!;
}

function sampleLandmarkKind(seed: Seed, x: number, y: number): LandmarkKind {
    const h = hashCoord(seed, x, y, 0x11);
    return LANDMARK_KINDS[h % LANDMARK_KINDS.length]!;
}

// ─── Public: chunkType ────────────────────────────────────────────────────────

/**
 * Pure: return the chunk type at `(x, y)` for this seed. No state, no I/O.
 * Safe to call for unvisited coordinates (pre-planting invariant).
 */
export function chunkType(seed: Seed, x: number, y: number): ChunkType {
    // 1. Starter chunk is always Guide-hostable
    if (x === 0 && y === 0) return { kind: "outdoor", biome: "grassland" };

    // 2. Deterministic base biome
    const biome = baseBiome(seed, x, y);

    // 3. Village-density constraint
    if (needsVillage(seed, x, y)) {
        return { kind: "village", archetype: sampleVillageArchetype(seed, x, y) };
    }

    // 4. Landmark constraint (~1/256)
    if (isLandmarkCell(seed, x, y)) {
        return { kind: "landmark", landmark: sampleLandmarkKind(seed, x, y) };
    }

    // 5. Transitional edge if neighbors clash
    const edge = neighborsIncompatible(seed, x, y, biome);
    if (edge) return { kind: "outdoor", biome: edge };

    // 6. Default: outdoor biome
    return { kind: "outdoor", biome };
}

// ─── Public: chunkTier ────────────────────────────────────────────────────────

/**
 * Chunk tier (encounter difficulty scalar). Log2 of Chebyshev distance
 * from `(0, 0)`. See docs/ECONOMY.md § Chunk tier.
 */
export function chunkTier(coord: ChunkCoord): number {
    const chebyshev = Math.max(Math.abs(coord.x), Math.abs(coord.y));
    return Math.floor(Math.log2(1 + chebyshev));
}

// ─── Public: chunkName ────────────────────────────────────────────────────────

const ADJ_A = [
    "Weathered", "Bright", "Quiet", "Mossy", "Rough", "Smooth", "Faded", "Shining",
    "Deep", "Pale", "Lonely", "Winding", "Narrow", "Wide", "Windy", "Still",
    "Stormy", "Silver", "Golden", "Shadow", "Sunlit", "Moonlit", "Dappled", "Frosted",
    "Carved", "Soft", "Hard", "Warm", "Cool", "Wild", "Hollow", "Sacred",
    "Plain", "Remote", "Hidden", "Forgotten", "Remembered", "Ancient", "Fresh", "Rolling",
] as const;

const ADJ_B = [
    "Soft", "Hidden", "Wandering", "Still", "Sleeping", "Watching", "Calling", "Remembering",
    "Patient", "Listening", "Singing", "Whispering", "Weeping", "Laughing", "Dreaming", "Waiting",
    "Drifting", "Falling", "Rising", "Breathing", "Seeking", "Finding", "Yearning", "Hushed",
    "Gentle", "Fierce", "Tender", "Kind", "Brave", "Honest", "Proud", "Tired",
    "Rested", "Glad", "Humble", "Steady", "Restless", "Easy", "Sudden", "Slow",
] as const;

const NOUNS = [
    "Moss", "Reach", "Hollow", "Ford", "Vale", "Bluff", "Ridge", "Stone",
    "Pine", "Oak", "Birch", "Willow", "Thicket", "Meadow", "Glade", "Dell",
    "Marsh", "Fen", "Copse", "Grove", "Spring", "Brook", "Ferry", "Crossing",
    "Knoll", "Rise", "Fall", "Bend", "Loop", "Edge", "Shore", "Tide",
    "Cove", "Bay", "Hill", "Dale", "Heath", "Moor", "Fell", "Pass",
    "Shelf", "Scarp", "Gully", "Ledge", "Outlook", "Point", "Mouth", "Watch",
    "Keep", "Croft", "Field", "Pasture", "Acre", "Patch", "Yard", "Bight",
] as const;

/**
 * Deterministic chunk name from the seed-name pool:
 * `{adjective_A} {adjective_B} {noun}`. See docs/WORLD_GENERATION.md §
 * Seed-name generator.
 */
export function chunkName(seed: Seed, coord: ChunkCoord): string {
    const ha = hashCoord(seed ^ 0xaa_aa, coord.x, coord.y, 0x01);
    const hb = hashCoord(seed ^ 0xbb_bb, coord.x, coord.y, 0x02);
    const hn = hashCoord(seed ^ 0xcc_cc, coord.x, coord.y, 0x03);
    const a = ADJ_A[ha % ADJ_A.length]!;
    const b = ADJ_B[hb % ADJ_B.length]!;
    const n = NOUNS[hn % NOUNS.length]!;
    return `${a} ${b} ${n}`;
}

// ─── Public: realizeChunk ─────────────────────────────────────────────────────

/**
 * Realize a chunk on first visit. For `(0, 0)` on a fresh save, plants the
 * Guide NPC at the known spawn point.
 *
 * Phase 2 stub: returns coord, type, name, and optional guideNpc.
 * Tile grid, encounters, NPCs, chests, signs, and warps are Phase 5+.
 */
export function realizeChunk(
    seed: Seed,
    coord: ChunkCoord,
    isFreshSave: boolean,
): RealizedChunk {
    const type = chunkType(seed, coord.x, coord.y);
    const name = chunkName(seed, coord);
    const chunk: RealizedChunk = { coord, type, name };
    if (coord.x === 0 && coord.y === 0 && isFreshSave) {
        chunk.guideNpc = { spawnX: 16, spawnY: 12, dialogId: "guide_tutorial" };
    }
    return chunk;
}
