/**
 * Challenge templates — the 10 cause kinds × effect kinds that
 * generate a per-NPC three-beat challenge at chunk realization.
 *
 * Per docs/QUESTS.md. Phase 7 (T144/T145/T146).
 *
 * A challenge is:
 *   1. Offer — NPC states a problem.
 *   2. Response — player acts (catch / defeat / deliver / etc).
 *   3. Resolve — reward fires, NPC dialog shifts once, then degrades.
 *
 * No chain, no graph, no progression. Self-contained per NPC.
 */

import type { Role } from "./dialog-pool";
import { createRng } from "./seed";

export type CauseKind =
    | "find_pet"
    | "fetch_item"
    | "defeat_threat"
    | "deliver_message"
    | "deliver_item"
    | "settle_dispute"
    | "escort"
    | "guard_spot"
    | "survey"
    | "recover_heirloom";

export type EffectKind =
    | "catch_species"
    | "inventory_count"
    | "defeat_flagged_wild"
    | "deliver_item_to_npc"
    | "reach_chunk"
    | "timer_on_tile"
    | "bestiary_delta"
    | "pickup_object";

export type RewardModifier = "challenge_normal" | "challenge_heirloom";

export type ChallengeState =
    | "pending"
    | "offered"
    | "accepted"
    | "declined"
    | "resolved"
    | "degraded";

export type ChallengeParams = Record<string, string | number>;

export type ChallengeInstance = {
    cause: CauseKind;
    effect: EffectKind;
    params: ChallengeParams;
    rewardModifier: RewardModifier;
    state: ChallengeState;
    offeredDay?: number;
    acceptedDay?: number;
    resolvedDay?: number;
};

/** Maps each cause to the effect kind the runtime watches for. */
export const EFFECT_FOR_CAUSE: Record<CauseKind, EffectKind> = {
    find_pet:         "catch_species",
    fetch_item:       "inventory_count",
    defeat_threat:    "defeat_flagged_wild",
    deliver_message:  "deliver_item_to_npc",
    deliver_item:     "deliver_item_to_npc",
    settle_dispute:   "inventory_count",
    escort:           "reach_chunk",
    guard_spot:       "timer_on_tile",
    survey:           "bestiary_delta",
    recover_heirloom: "pickup_object",
};

type CauseAffinity = { common: CauseKind[]; rare: CauseKind[] };

/** Role → cause affinity per docs/QUESTS.md § Role → cause affinity. */
export const CAUSE_AFFINITIES: Record<Role, CauseAffinity> = {
    farmer:           { common: ["find_pet", "fetch_item", "settle_dispute"], rare: ["recover_heirloom"] },
    hunter:           { common: ["defeat_threat", "survey"], rare: ["fetch_item", "find_pet"] },
    fisher:           { common: ["find_pet", "survey"], rare: ["fetch_item"] },
    elder:            { common: ["recover_heirloom", "deliver_message", "settle_dispute"], rare: [] },
    historian:        { common: ["recover_heirloom", "survey"], rare: ["deliver_message"] },
    shrine_keeper:    { common: ["guard_spot", "recover_heirloom"], rare: ["deliver_message"] },
    shopkeep:         { common: ["fetch_item", "deliver_item"], rare: [] },
    innkeep:          { common: ["deliver_message", "escort"], rare: ["fetch_item"] },
    wanderer:         { common: ["escort", "deliver_message", "deliver_item"], rare: [] },
    guard:            { common: ["defeat_threat", "escort"], rare: ["guard_spot"] },
    villager_generic: { common: ["find_pet", "fetch_item", "deliver_message", "settle_dispute", "escort", "survey"], rare: ["recover_heirloom", "defeat_threat", "guard_spot"] },
    child:            { common: ["find_pet", "recover_heirloom"], rare: [] },
    trainer:          { common: ["defeat_threat"], rare: ["survey"] },
    rival:            { common: [], rare: [] },
    guide:            { common: [], rare: [] },
};

// Fetchable items for fetch_item / settle_dispute / deliver_item params
const FETCHABLE_ITEMS = ["orchard_fruit", "spring_tonic", "trail_token"];
// Species pool (Phase 8 wires to full species list)
const SPECIES_POOL = [
    "applepup", "stoneback", "fenlurk", "galebird", "rootnip", "marshlight",
    "cloverkit", "thistlecap", "emberpaw", "driftfin",
];
// Biome features for flavor params
const BIOME_FEATURES = ["pond", "old_mill", "stone_circle", "thicket", "ridge", "ferry_dock"];
// Fallback pool for roles with no affinity (rival, guide)
const ALL_CAUSES: CauseKind[] = [
    "find_pet", "fetch_item", "defeat_threat", "deliver_message",
    "deliver_item", "settle_dispute", "escort", "guard_spot", "survey", "recover_heirloom",
];

function pickCause(seed: number, spawnIndex: number, role: Role): CauseKind {
    const aff = CAUSE_AFFINITIES[role];
    const pool = aff.common.length > 0 ? aff.common : ALL_CAUSES;
    const h = ((seed >>> 0) ^ (spawnIndex * 2654435761)) >>> 0;
    const rng = createRng(h, `challenge-cause:${role}`);
    return rng.pick(pool);
}

function buildParams(cause: CauseKind, seed: number, chunk: { x: number; y: number }, spawnIndex: number): ChallengeParams {
    const h = ((seed >>> 0) ^ (chunk.x * 1000003) ^ (chunk.y * 999983) ^ (spawnIndex * 31337)) >>> 0;
    const rng = createRng(h, `challenge-params:${cause}`);

    switch (cause) {
        case "find_pet":
            return {
                species: rng.pick(SPECIES_POOL),
                biome_feature: rng.pick(BIOME_FEATURES),
            };
        case "fetch_item":
            return {
                item: rng.pick(FETCHABLE_ITEMS),
                count: rng.range(1, 5),
                biome_feature: rng.pick(BIOME_FEATURES),
            };
        case "defeat_threat":
            return {
                biome_feature: rng.pick(BIOME_FEATURES),
            };
        case "deliver_message":
            return {
                target_chunk_dx: rng.range(1, 3),
                target_chunk_dy: rng.range(0, 2),
                item: "sealed_letter",
            };
        case "deliver_item":
            return {
                item: rng.pick(FETCHABLE_ITEMS),
                target_chunk_dx: rng.range(1, 3),
                target_chunk_dy: rng.range(0, 2),
            };
        case "settle_dispute":
            return {
                evidence_item: rng.pick(FETCHABLE_ITEMS),
                biome_feature: rng.pick(BIOME_FEATURES),
            };
        case "escort":
            return {
                dest_chunk_dx: rng.range(1, 2),
                dest_chunk_dy: rng.range(0, 2),
            };
        case "guard_spot":
            return {
                seconds: rng.range(60, 180),
            };
        case "survey":
            return {
                count: rng.range(3, 6),
                biome_feature: rng.pick(BIOME_FEATURES),
            };
        case "recover_heirloom":
            return {
                pickup_chunk_x: chunk.x,
                pickup_chunk_y: chunk.y,
            };
    }
}

/**
 * Generate a challenge for an NPC at a given chunk + spawn index,
 * parameterized by the NPC's role. Deterministic per seed.
 */
export function generateChallenge(
    seed: number,
    chunk: { x: number; y: number },
    spawnIndex: number,
    role: Role,
): ChallengeInstance {
    const cause = pickCause(seed, spawnIndex, role);
    return {
        cause,
        effect: EFFECT_FOR_CAUSE[cause],
        params: buildParams(cause, seed, chunk, spawnIndex),
        rewardModifier: cause === "recover_heirloom" ? "challenge_heirloom" : "challenge_normal",
        state: "pending",
    };
}

/**
 * Check whether the response condition for this challenge is currently
 * satisfied by player state (inventory / party / bestiary / etc).
 * Full wiring in T148.
 */
export function isConditionMet(_challenge: ChallengeInstance): Promise<boolean> {
    throw new Error("challenge-template.isConditionMet unimplemented (T148)");
}
