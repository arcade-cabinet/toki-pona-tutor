/**
 * Universal reward function — one code path for every gold + item drop.
 *
 * Per docs/ECONOMY.md. Unimplemented; Phase 4 populates.
 *
 * Invariant: wild defeat, wild catch, chest open, challenge resolve, and
 * rare-find pickup all call `reward()` with a different `source` + modifier.
 * No second code path. Log-scaled on player level + chunk tier.
 */

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
    playerLevel: number;
    partyStrength: number;
    chunkTier: number;
    source: RewardSource;
    sourceModifier: number;
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

/**
 * Compute a reward. Pure given a seeded RNG; the caller supplies noise.
 * See docs/ECONOMY.md § Universal reward function.
 */
export function reward(_input: RewardInput): RewardOutput {
    throw new Error("reward-function.reward unimplemented (Phase 4)");
}

/**
 * Weighted mean of party creature levels that skews toward the lead.
 * `0.3 × mean(filled) + 0.7 × max(filled)`.
 */
export function partyStrength(_partyLevels: readonly number[]): number {
    throw new Error("reward-function.partyStrength unimplemented (Phase 4)");
}

/**
 * Cumulative XP required to reach `level`. Log-scaled.
 * `BASE_XP × log2(level + 1) × SCALE`.
 */
export function xpNeeded(_level: number): number {
    throw new Error("reward-function.xpNeeded unimplemented (Phase 4)");
}
