/**
 * Challenge lifecycle — pure state transitions for the three-beat challenge loop.
 *
 * Per docs/QUESTS.md § Lifecycle states.
 * All functions return a new ChallengeInstance (immutable).
 * Runtime wiring (RPG.js showChoices / showText) lives in the server event module.
 */

import type { ChallengeInstance } from "./challenge-template";

/** In-game days after resolve before NPC shifts to idle_after_resolve dialog. */
export const DEGRADE_DAYS = 7;

/** In-game days after accept before auto-revert to offered if no progress. */
export const EXPIRE_DAYS = 50;

/**
 * Transition: pending | declined → offered.
 * Idempotent if already offered (preserves first offeredDay).
 */
export function offerChallenge(c: ChallengeInstance, currentDay: number): ChallengeInstance {
    if (c.state === "offered") return c;
    if (c.state !== "pending" && c.state !== "declined") return c;
    return { ...c, state: "offered", offeredDay: c.offeredDay ?? currentDay };
}

/**
 * Transition: offered → accepted.
 * Throws if called from any other state.
 */
export function acceptChallenge(c: ChallengeInstance, currentDay: number): ChallengeInstance {
    if (c.state !== "offered") throw new Error(`acceptChallenge: invalid state ${c.state}`);
    return { ...c, state: "accepted", acceptedDay: currentDay };
}

/**
 * Transition: offered → declined.
 * Throws if called from any other state.
 */
export function declineChallenge(c: ChallengeInstance): ChallengeInstance {
    if (c.state !== "offered") throw new Error(`declineChallenge: invalid state ${c.state}`);
    return { ...c, state: "declined" };
}

/**
 * Transition: accepted → resolved.
 * Caller must verify the response condition before calling.
 * Throws if called from any other state.
 */
export function resolveChallenge(c: ChallengeInstance, currentDay: number): ChallengeInstance {
    if (c.state !== "accepted") throw new Error(`resolveChallenge: invalid state ${c.state}`);
    return { ...c, state: "resolved", resolvedDay: currentDay };
}

/**
 * Transition: resolved → degraded (after DEGRADE_DAYS since resolvedDay).
 * Call on every NPC interaction to check if NPC dialog should shift.
 */
export function degradeChallenge(c: ChallengeInstance, currentDay: number): ChallengeInstance {
    if (c.state !== "resolved") return c;
    if (c.resolvedDay === undefined) return c;
    if (currentDay > c.resolvedDay + DEGRADE_DAYS) {
        return { ...c, state: "degraded" };
    }
    return c;
}

/**
 * True when an accepted challenge has had no progress for EXPIRE_DAYS.
 * Caller should revert it to offered via offerChallenge.
 */
export function isExpired(c: ChallengeInstance, currentDay: number): boolean {
    if (c.state !== "accepted" || c.acceptedDay === undefined) return false;
    return currentDay >= c.acceptedDay + EXPIRE_DAYS;
}
