/**
 * Hall of Masters — post-endgame gym-leader rematches — T7-01.
 *
 * After the player clears the green dragon, every gym leader is
 * available for a rematch in the `lupa_jan_lawa` (chamber-of-masters)
 * post-game map. Rematches scale up in difficulty:
 *
 * - Level bumps: +10 per clear-count above the original cap.
 * - Fresh loot: each victory pays `rematch_reward_<n>` — a cycling
 *   reward table that hands out `heavy_capture_pod` on rematch #1, `spring_tonic`
 *   on #2, a rare species-egg on #3, and a trophy flag on #4+.
 * - Cooldown: a region master can only be rematched once per in-game day
 *   so the player can't farm them.
 *
 * State machine:
 *   available → in-combat → victory → cooldown → (time passes) → available
 *   available → in-combat → defeat   → available (no penalty, retry)
 *
 * Pure helpers + tests. The runtime owns the day-tick clock and
 * actually runs the fight.
 */

import { NEW_GAME_PLUS_CONFIG, REGION_XP_CURVE, REMATCH_CONFIG } from "../../content/gameplay";

export type RematchOutcome = "victory" | "defeat";

export interface RematchRecord {
    badgeFlag: string;
    timesCleared: number;
    /** ISO timestamp of the most recent victory, for cooldown math. */
    lastVictoryAt?: string;
}

export type RematchStatus = "available" | "on_cooldown" | "locked";

/** Hours between rematches against the same leader. */
export const REMATCH_COOLDOWN_HOURS = REMATCH_CONFIG.cooldown_hours;

/**
 * Resolve whether the player can rematch a given leader right now.
 *
 * Rules:
 * 1. If the player hasn't cleared the base game (no configured clear
 *    flag), the rematch is `locked`.
 * 2. If within REMATCH_COOLDOWN_HOURS of the last victory, `on_cooldown`.
 * 3. Otherwise `available`.
 *
 * @example
 * rematchStatus({ badgeFlag: 'badge_sewi', timesCleared: 1 },
 *               { flags: { game_cleared: '1' } },
 *               new Date('2026-04-20T00:00:00Z'))
 * // → 'available'
 */
export function rematchStatus(
    record: RematchRecord,
    player: { flags: Record<string, string> },
    now: Date,
): RematchStatus {
    if (!player.flags[NEW_GAME_PLUS_CONFIG.requiredClearedFlag]) return "locked";
    if (!record.lastVictoryAt) return "available";
    const last = Date.parse(record.lastVictoryAt);
    if (Number.isNaN(last)) return "available";
    const elapsedHours = (now.getTime() - last) / 3_600_000;
    return elapsedHours < REMATCH_COOLDOWN_HOURS ? "on_cooldown" : "available";
}

/**
 * Scaled XP yield for a rematch. Each prior victory adds 50% to the
 * base xpYield from REGION_XP_CURVE — so beating tarrin (120 base)
 * a second time grants 180, third time 240, etc. Caps at 4× (480)
 * so late-NG+ players can't trivially hit level 50.
 */
export function scaledRematchXp(badgeFlag: string, timesCleared: number): number {
    const base = REGION_XP_CURVE[badgeFlag] ?? REMATCH_CONFIG.default_base_xp;
    const multiplier = Math.min(
        REMATCH_CONFIG.xp_multiplier_cap,
        1 + REMATCH_CONFIG.xp_multiplier_per_clear * Math.max(0, timesCleared),
    );
    return Math.floor(base * multiplier);
}

/** Scaled enemy level for a rematch. Each clear adds +10 levels (cap 50). */
export function scaledRematchLevel(baseLevel: number, timesCleared: number): number {
    return Math.min(
        REMATCH_CONFIG.level_cap,
        baseLevel + REMATCH_CONFIG.level_step * Math.max(0, timesCleared),
    );
}

/**
 * Reward item dispensed after a successful rematch. Cycles by
 * timesCleared so the player gets a varied drop sequence.
 *
 * - Rematch #1 (was 0, now 1) → heavy_capture_pod (the upgraded net)
 * - Rematch #2 → spring_tonic (a potent healing potion)
 * - Rematch #3 → species_egg (breed material for daycare)
 * - Rematch #4+ → trophy flag (cosmetic — no item, just `trophy_<badge>`)
 */
export function rematchReward(
    badgeFlag: string,
    newClearCount: number,
): { kind: "item"; itemId: string; count: number } | { kind: "flag"; flagId: string } {
    const configured = REMATCH_CONFIG.rewards.find(
        (reward) => reward.clear_count === newClearCount,
    );
    if (configured?.kind === "item") {
        return { kind: "item", itemId: configured.item_id, count: configured.count };
    }
    if (configured?.kind === "flag") {
        return { kind: "flag", flagId: configured.flag_id };
    }
    return { kind: "flag", flagId: `${REMATCH_CONFIG.default_reward.flag_prefix}${badgeFlag}` };
}

/**
 * Apply the result of a rematch to the record. Victory increments
 * the counter + stamps lastVictoryAt; defeat leaves the record
 * unchanged so the player can immediately retry without penalty.
 *
 * @example
 * applyRematchOutcome(
 *   { badgeFlag: 'badge_sewi', timesCleared: 1 },
 *   'victory',
 *   new Date('2026-04-20T00:00:00Z'),
 * )
 * // → { badgeFlag: 'badge_sewi', timesCleared: 2,
 * //     lastVictoryAt: '2026-04-20T00:00:00.000Z' }
 */
export function applyRematchOutcome(
    record: RematchRecord,
    outcome: RematchOutcome,
    now: Date,
): RematchRecord {
    if (outcome === "defeat") return record;
    return {
        ...record,
        timesCleared: record.timesCleared + 1,
        lastVictoryAt: now.toISOString(),
    };
}
