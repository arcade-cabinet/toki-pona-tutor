/**
 * Item tier bands + loot roll logic.
 * Per docs/ECONOMY.md § Item tier bands and Loot roll.
 */

import type { Rng } from "./seed";

export type LootPoolEntry = {
    itemId: string;
    tier: number;
    weight: number;
};

/**
 * `ceil(log2(dropLevel + 1))` — maps a drop level to a tier band.
 * Per ECONOMY.md: level 1→tier 1, 3→2, 7→3, 15→4, 31→5, 63→6, 99→7.
 */
export function itemTierForDropLevel(dropLevel: number): number {
    return Math.ceil(Math.log2(dropLevel + 1));
}

/**
 * Sample one item from `pool` filtered to `targetTier ± 1`.
 * Items within the tier band are weighted; higher-tier items have lower weight
 * within the band (this is captured in the pool weights at authoring time).
 * Returns null if pool is empty or no items match the tier band.
 */
export function rollItem(
    pool: LootPoolEntry[],
    dropLevel: number,
    rng: Rng,
): LootPoolEntry | null {
    if (pool.length === 0) return null;
    const targetTier = itemTierForDropLevel(dropLevel);
    const band = pool.filter(
        (e) => e.tier >= targetTier - 1 && e.tier <= targetTier + 1,
    );
    if (band.length === 0) return null;

    const totalWeight = band.reduce((s, e) => s + e.weight, 0);
    let roll = rng.next() * totalWeight;
    for (const entry of band) {
        roll -= entry.weight;
        if (roll < 0) return entry;
    }
    return band[band.length - 1]!;
}
