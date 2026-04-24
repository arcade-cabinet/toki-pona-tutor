/**
 * World generator — the deterministic, seeded, infinite chunk grid.
 *
 * Per docs/WORLD_GENERATION.md. Unimplemented; Phase 2 populates.
 *
 * Invariants (from spec):
 *   - `(seed, x, y) → ChunkType` is a pure function.
 *   - Every integer coordinate has a chunk type before first visit.
 *   - Starter chunk `(0, 0)` hosts a Guide NPC on fresh saves.
 *   - Village-density guarantee: a village within Chebyshev distance ≤3
 *     of any point.
 *   - No `Math.random`; route all randomness through the seeded factory.
 */

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
    // TODO(Phase 2): tile grid, encounters, npcs, chests, signs, warps, doors.
};

/**
 * Pure: return the chunk type at `(x, y)` for this seed. Does not touch
 * persistence, does not realize the chunk. Safe to call for unvisited
 * coordinates (pre-planting invariant).
 */
export function chunkType(_seed: number, _x: number, _y: number): ChunkType {
    throw new Error("world-generator.chunkType unimplemented (Phase 2)");
}

/**
 * Realize a chunk on first visit: place NPCs, encounter zones, objects,
 * seed-name, and (for fresh save + `(0, 0)`) the Guide NPC.
 */
export function realizeChunk(
    _seed: number,
    _coord: ChunkCoord,
    _isFreshSave: boolean,
): RealizedChunk {
    throw new Error("world-generator.realizeChunk unimplemented (Phase 2)");
}

/**
 * Chunk tier (encounter difficulty scalar). Log2 of Chebyshev distance
 * from `(0, 0)`. See docs/ECONOMY.md § Chunk tier.
 */
export function chunkTier(coord: ChunkCoord): number {
    const chebyshev = Math.max(Math.abs(coord.x), Math.abs(coord.y));
    return Math.floor(Math.log2(1 + chebyshev));
}

/**
 * Deterministic chunk name from the seed-name pool:
 * `{adjective_A} {adjective_B} {noun}`. See docs/WORLD_GENERATION.md §
 * Seed-name generator.
 */
export function chunkName(_seed: number, _coord: ChunkCoord): string {
    throw new Error("world-generator.chunkName unimplemented (Phase 2)");
}
