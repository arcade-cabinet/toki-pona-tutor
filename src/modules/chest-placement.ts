/**
 * Chest placement generator — deterministic chest positions + loot rolls
 * per chunk kind and tier.
 *
 * Per docs/WORLD_GENERATION.md § Chunk realization (T137):
 *   - Outdoor chunks: 0-1 chests
 *   - Indoor chunks:  0-2 chests
 *   - Rare/landmark:  2-4 chests
 *
 * Loot is rolled from the caller-supplied pool at tier ± 1 band.
 * Contents are committed to chunk delta on first open (persisted in SQLite).
 */

import type { Seed } from "./seed";
import { createRng } from "./seed";

export type LootEntry = {
    itemId: string;
    tier: number;
    weight: number;
    buyPrice: number;
};

export type ChestPlacement = {
    x: number;
    y: number;
    loot: LootEntry;
};

export type ChunkKind = "outdoor" | "indoor" | "rare";

// [min, max] chests per kind, inclusive
const CHEST_RANGE: Record<ChunkKind, [number, number]> = {
    outdoor: [0, 1],
    indoor:  [0, 2],
    rare:    [2, 4],
};

function rollLoot(pool: LootEntry[], chunkTier: number, rng: ReturnType<typeof createRng>): LootEntry | null {
    const minTier = Math.max(1, chunkTier - 1);
    const maxTier = chunkTier + 1;
    const band = pool.filter((e) => e.tier >= minTier && e.tier <= maxTier);
    if (band.length === 0) return pool.length > 0 ? pool[0]! : null;

    const totalWeight = band.reduce((s, e) => s + e.weight, 0);
    let roll = rng.next() * totalWeight;
    for (const entry of band) {
        roll -= entry.weight;
        if (roll < 0) return entry;
    }
    return band[band.length - 1]!;
}

/**
 * Generate chest placements for a chunk.
 * `chunkTier` drives loot band selection.
 * Coordinates are relative to the chunk grid (not guaranteed to be collision-free;
 * the outdoor/indoor generators are responsible for avoiding overlaps at realization).
 */
export function generateChestPlacements(
    seed: Seed,
    coord: { x: number; y: number },
    kind: ChunkKind,
    chunkTier: number,
    pool: LootEntry[],
): ChestPlacement[] {
    const rng = createRng(
        ((seed >>> 0) ^ (coord.x * 1000003) ^ (coord.y * 999983) ^ 0xc8e5) >>> 0,
        `chest:${kind}:${coord.x}:${coord.y}`,
    );

    const [minCount, maxCount] = CHEST_RANGE[kind];
    const count = rng.range(minCount!, maxCount!);
    if (count === 0 || pool.length === 0) return [];

    // Grid bounds per kind (rough — actual placement clamps to chunk dims)
    const maxX = kind === "indoor" ? 14 : kind === "outdoor" ? 30 : 30;
    const maxY = kind === "indoor" ? 10 : kind === "outdoor" ? 22 : 22;

    const placements: ChestPlacement[] = [];
    const occupied = new Set<string>();

    for (let i = 0; i < count; i++) {
        let x: number;
        let y: number;
        let attempts = 0;
        do {
            x = rng.range(2, maxX);
            y = rng.range(2, maxY);
            attempts++;
        } while (occupied.has(`${x}:${y}`) && attempts < 20);

        const loot = rollLoot(pool, chunkTier, rng);
        if (!loot) continue;

        occupied.add(`${x}:${y}`);
        placements.push({ x, y, loot });
    }
    return placements;
}
