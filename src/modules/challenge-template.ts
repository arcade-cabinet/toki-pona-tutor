/**
 * Challenge templates — the 10 cause kinds × effect kinds that
 * generate a per-NPC three-beat challenge at chunk realization.
 *
 * Per docs/QUESTS.md. Unimplemented; Phase 7 populates.
 *
 * A challenge is:
 *   1. Offer — NPC states a problem.
 *   2. Response — player acts (catch / defeat / deliver / etc).
 *   3. Resolve — reward fires, NPC dialog shifts once, then degrades.
 *
 * No chain, no graph, no progression. Self-contained per NPC.
 */

import type { Role } from "./dialog-pool";

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
    state: ChallengeState;
    offeredDay?: number;
    acceptedDay?: number;
    resolvedDay?: number;
};

/**
 * Generate a challenge for an NPC at a given chunk + spawn index,
 * parameterized by the NPC's role. Deterministic per seed.
 */
export function generateChallenge(
    _seed: number,
    _chunk: { x: number; y: number },
    _spawnIndex: number,
    _role: Role,
): ChallengeInstance {
    throw new Error("challenge-template.generateChallenge unimplemented (Phase 7)");
}

/**
 * Check whether the response condition for this challenge is currently
 * satisfied by player state (inventory / party / bestiary / etc).
 */
export function isConditionMet(_challenge: ChallengeInstance): Promise<boolean> {
    throw new Error("challenge-template.isConditionMet unimplemented (Phase 7)");
}
