/**
 * Universal reward function — one code path for every gold + item drop.
 *
 * Per docs/ECONOMY.md. All formulas reference this file; constants from
 * src/content/economy.json in a future tuning pass.
 *
 * Invariant: wild defeat, wild catch, chest open, challenge resolve, and
 * rare-find pickup all call `reward()` with a different `source`.
 * No second code path. Log-scaled on player level + chunk tier.
 */

import type { Rng } from "./seed";

export type RewardSource =
    | "wild_defeat"
    | "wild_catch"
    | "trainer_defeat"
    | "chest_common"
    | "chest_rare"
    | "challenge_normal"
    | "challenge_heirloom"
    | "rare_spot";

export type RewardInput = {
    partyStrength: number;
    chunkTier: number;
    source: RewardSource;
    rng: Rng;
    rareFlagMultiplier?: number;
};

export type ItemDrop = {
    itemId: string;
    count: number;
};

export type RewardOutput = {
    gold: number;
    items: ItemDrop[];
};

// Tuning constants (will be loaded from economy.json in T135 pass)
const BASE_GOLD = 5;
const GOLD_NOISE_PCT = 0.2;
const BASE_DROP_CHANCE = 0.15;
const TIER_DROP_BONUS = 0.03;

const SOURCE_MODIFIER: Record<RewardSource, number> = {
    wild_defeat: 1.0,
    wild_catch: 0.5,
    trainer_defeat: 2.0,
    chest_common: 3.0,
    chest_rare: 6.0,
    challenge_normal: 2.0,
    challenge_heirloom: 5.0,
    rare_spot: 10.0,
};

/**
 * Chunk distance tier: `floor(log2(1 + chebyshev_distance(x, y, (0,0))))`.
 */
export function chunkTier(x: number, y: number): number {
    const dist = Math.max(Math.abs(x), Math.abs(y));
    return Math.floor(Math.log2(1 + dist));
}

/**
 * Weighted mean of party creature levels: `0.3 × mean + 0.7 × max`.
 * Returns 1 for an empty party (Guide default).
 */
export function partyStrength(partyLevels: readonly number[]): number {
    const filled = partyLevels.filter((lvl) => lvl > 0);
    if (filled.length === 0) return 1;
    const mean = filled.reduce((s, l) => s + l, 0) / filled.length;
    const max = Math.max(...filled);
    return 0.3 * mean + 0.7 * max;
}

/**
 * Cumulative XP required to reach `level`: `floor(BASE_XP × log2(level+1) × SCALE)`.
 */
export function xpNeeded(level: number): number {
    const BASE_XP = 20;
    const SCALE = 12;
    return Math.floor(BASE_XP * Math.log2(level + 1) * SCALE);
}

/**
 * Encounter level for a chunk: `clamp(tier×5 + partyStrength + noise, 1, 99)`.
 */
export function encounterLevel(tier: number, strength: number, rng: Rng): number {
    const TIER_MULT = 5;
    const NOISE = 2;
    const base = tier * TIER_MULT + strength;
    const noise = rng.range(-NOISE, NOISE);
    return Math.min(99, Math.max(1, Math.round(base + noise)));
}

/**
 * Drop level: encounter level + randint(-1, +3). Slightly positive skew.
 */
export function dropLevel(encLevel: number, rng: Rng): number {
    const skew = rng.range(-1, 3);
    return Math.min(99, Math.max(1, encLevel + skew));
}

/**
 * Compute a reward. Supply a seeded RNG for noise; deterministic for same seed.
 * Per docs/ECONOMY.md § Universal reward function.
 */
export function reward(input: RewardInput): RewardOutput {
    const { partyStrength: strength, chunkTier: tier, source, rng, rareFlagMultiplier = 1.0 } = input;
    const modifier = SOURCE_MODIFIER[source];

    // Gold formula: BASE_GOLD × (1 + tier×0.5) × log2(strength+2) × modifier × noise
    const noiseFactor = 1 + (rng.next() * 2 - 1) * GOLD_NOISE_PCT;
    const rawGold =
        BASE_GOLD *
        (1 + tier * 0.5) *
        Math.log2(strength + 2) *
        modifier *
        noiseFactor;
    const gold = Math.max(0, Math.floor(rawGold));

    // Item drop
    const dropChance = Math.min(1, (BASE_DROP_CHANCE + tier * TIER_DROP_BONUS) * modifier * rareFlagMultiplier);
    const items: ItemDrop[] = rng.next() < dropChance ? [{ itemId: "placeholder", count: 1 }] : [];

    return { gold, items };
}
