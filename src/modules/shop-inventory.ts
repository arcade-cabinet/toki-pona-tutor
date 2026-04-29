/**
 * Shop inventory generator — per-archetype stock sampling from the loot pool.
 *
 * Per docs/ECONOMY.md § Shop pricing and docs/WORLD_GENERATION.md § Village archetypes.
 * Each village shop generates 5-8 unique items at chunk tier ± 1.
 * Deterministic per (seed, chunk, archetype).
 */

import type { VillageArchetype } from "./world-generator";
import type { Seed } from "./seed";
import { createRng } from "./seed";

export type ShopItem = {
    itemId: string;
    tier: number;
    weight: number;
    buyPrice: number;
};

// Number of items per archetype
const STOCK_SIZE: Record<VillageArchetype, [number, number]> = {
    small_hamlet:      [5, 6],
    market_town:       [7, 8],
    snow_lodge:        [5, 7],
    road_stop:         [3, 5],
    fishing_pier:      [5, 6],
    shrine_settlement: [5, 6],
};

/**
 * Generate the shop stock for a village at a given chunk and tier.
 * `pool` should contain all candidate items (caller filters by availability).
 * Returns 5-8 unique items within chunkTier ± 1 band, weighted by pool weight.
 */
export function generateShopInventory(
    seed: Seed,
    coord: { x: number; y: number },
    archetype: VillageArchetype,
    chunkTier: number,
    pool: ShopItem[],
): ShopItem[] {
    const rng = createRng(
        ((seed >>> 0) ^ (coord.x * 1000003) ^ (coord.y * 999983) ^ 0x5093) >>> 0,
        `shop:${archetype}:${coord.x}:${coord.y}`,
    );

    // Filter to tier band
    const minTier = Math.max(1, chunkTier - 1);
    const maxTier = chunkTier + 1;
    const candidates = pool.filter((e) => e.tier >= minTier && e.tier <= maxTier);
    if (candidates.length === 0) return [];

    const [minCount, maxCount] = STOCK_SIZE[archetype];
    const targetCount = rng.range(minCount!, maxCount!);
    const count = Math.min(targetCount, candidates.length);

    // Weighted sampling without replacement
    const remaining = [...candidates];
    const stock: ShopItem[] = [];
    for (let i = 0; i < count; i++) {
        if (remaining.length === 0) break;
        const totalWeight = remaining.reduce((s, e) => s + e.weight, 0);
        let roll = rng.next() * totalWeight;
        let chosen = remaining.length - 1;
        for (let j = 0; j < remaining.length; j++) {
            roll -= remaining[j]!.weight;
            if (roll < 0) { chosen = j; break; }
        }
        stock.push(remaining[chosen]!);
        remaining.splice(chosen, 1);
    }
    return stock;
}
