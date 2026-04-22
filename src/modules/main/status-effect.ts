/**
 * Status effects — Phase 7 T7-04.
 *
 * Per docs/ARCHITECTURE.md §Combat, moves of particular types carry a
 * chance to inflict an ongoing status on the target:
 *
 *   - `burn` — applied by seli moves. Ticks 1/16 max-HP damage at the
 *     end of each enemy turn. Wears off after 3 enemy turns.
 *   - `wet` — applied by telo moves. Amplifies incoming lete damage
 *     (1.5×) and makes the target immune to additional seli damage
 *     for its duration. Wears off after 3 turns.
 *   - `frozen` — applied by lete moves against `wet` or `waso`-tagged
 *     targets. Skips the target's next turn entirely. Wears off after
 *     exactly 1 turn.
 *
 * Combat engine responsibility: call `applyStatusEffect` on attack,
 * `tickStatusEffects` at the end of each turn, and consult the
 * returned `SkipTurn`/`DamageMultiplier` flags when building the
 * next action. All state is owned by the caller — this module is pure.
 */

import { STATUS_EFFECT_CONFIG, type ConfiguredStatusId } from "../../content/gameplay";
import type { TpType } from "./type-matchup";

export type StatusId = ConfiguredStatusId;

export interface Status {
    id: StatusId;
    turnsRemaining: number;
}

/**
 * Resolve whether a move of `moveType` applied to a target with
 * `targetStatuses` produces a new status, and which one. Returns null
 * when no status applies. Does NOT mutate the list; callers merge the
 * returned status into the target's list.
 *
 * @example
 * rollStatusEffect('seli', [])  // → { id: 'burn', turnsRemaining: 3 }
 * rollStatusEffect('lete', [{ id: 'wet', turnsRemaining: 2 }])
 * // → { id: 'frozen', turnsRemaining: 1 }
 * rollStatusEffect('seli', [{ id: 'burn', turnsRemaining: 2 }])
 * // → null (already burning)
 */
export function rollStatusEffect(
    moveType: TpType,
    targetStatuses: Status[],
    rng: () => number = Math.random,
): Status | null {
    const has = (id: StatusId) => targetStatuses.some((s) => s.id === id);

    for (const rule of STATUS_EFFECT_CONFIG.applicationRules) {
        if (rule.moveType !== moveType) continue;
        if (rule.requires.some((statusId) => !has(statusId))) continue;
        if (rule.blockedBy.some(has)) continue;
        return rng() < rule.chance ? { id: rule.statusId, turnsRemaining: rule.turns } : null;
    }
    return null;
}

/**
 * Apply end-of-turn effects for each status the target has. Returns
 * the new status list (with ticked-down durations and expired entries
 * removed) plus total damage to apply to the target this tick, plus a
 * `skipNextTurn` flag the combat engine consults before building
 * the target's next action.
 *
 * @example
 * tickStatusEffects([{ id: 'burn', turnsRemaining: 2 }], 160)
 * // → { statuses: [{ id: 'burn', turnsRemaining: 1 }], damage: 10, skipNextTurn: false }
 * tickStatusEffects([{ id: 'frozen', turnsRemaining: 1 }], 100)
 * // → { statuses: [], damage: 0, skipNextTurn: true }
 */
export function tickStatusEffects(
    statuses: Status[],
    targetMaxHp: number,
): {
    statuses: Status[];
    damage: number;
    skipNextTurn: boolean;
} {
    let damage = 0;
    let skipNextTurn = false;
    const out: Status[] = [];

    for (const s of statuses) {
        const effect = STATUS_EFFECT_CONFIG.tickEffects[s.id];
        if (effect?.damageMaxHpDivisor) {
            damage += Math.max(1, Math.floor(targetMaxHp / effect.damageMaxHpDivisor));
        }
        if (effect?.skipNextTurn) {
            skipNextTurn = true;
        }
        const remaining = s.turnsRemaining - 1;
        if (remaining > 0) out.push({ ...s, turnsRemaining: remaining });
    }
    return { statuses: out, damage, skipNextTurn };
}

/**
 * Damage-calc multiplier a target's current statuses contribute to
 * the incoming attack. Used alongside the type-matchup multiplier.
 */
export function damageMultiplierFromStatuses(
    incomingType: TpType,
    targetStatuses: Status[],
): number {
    const modifier = STATUS_EFFECT_CONFIG.damageMultipliers.find(
        (entry) =>
            entry.incomingType === incomingType &&
            targetStatuses.some((status) => status.id === entry.targetStatus),
    );
    return modifier?.multiplier ?? 1;
}
