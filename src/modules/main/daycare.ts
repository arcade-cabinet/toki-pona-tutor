/**
 * Creature breeding / daycare — T7-05.
 *
 * The starter-village daycare accepts two captured creatures from the
 * player's party. After N real minutes (or N encounter-rolls, whichever
 * the runtime wires first), an egg is produced. Hatching produces a
 * level-1 baby creature whose stats average the two parents with a
 * ±10% jitter, and whose learnset is the union of both parents'
 * level-1 moves plus the baby's own species learnset entries ≤ level 5.
 *
 * Pure-data helpers here; the timer + NPC event wiring lives in a
 * future follow-up. The key insight is that every derivation (type
 * inheritance, stat averaging, learnset union) is a pure function of
 * the two parents, so breeding is testable without any runtime state.
 */

import type { BaseStats } from '../../content/schema/species';
import type { TpType } from './type-matchup';

export interface ParentSnapshot {
    speciesId: string;
    type: TpType;
    base_stats: BaseStats;
    learnset: { level: number; move_id: string }[];
}

export interface Offspring {
    speciesId: string;
    type: TpType;
    base_stats: BaseStats;
    learnset: { level: number; move_id: string }[];
    level: number;
}

/**
 * Resolve the child's type. Rules:
 * - Same-type parents → child inherits that type.
 * - seli × telo → kasi (the type that beats neither — elemental neutral)
 * - seli × kasi → seli (fire-strong trait dominates)
 * - telo × kasi → telo (water dominant)
 * - wawa × anything → wawa (bruiser recessive)
 * - lete × anything non-lete → inherits the non-lete parent's type.
 * - Otherwise → parent-A's type wins (deterministic; test seed independent).
 */
export function childType(a: TpType, b: TpType): TpType {
    if (a === b) return a;
    if (a === 'wawa' || b === 'wawa') return 'wawa';
    if (a === 'lete' && b !== 'lete') return b;
    if (b === 'lete' && a !== 'lete') return a;
    const pair = [a, b].sort().join('_');
    if (pair === 'seli_telo') return 'kasi';
    if (pair === 'kasi_seli') return 'seli';
    if (pair === 'kasi_telo') return 'telo';
    return a;
}

/**
 * Stats are the arithmetic mean of the two parents' base_stats,
 * with optional ±jitterFrac randomness for flavor. Clamped to the
 * schema range [1, 250].
 *
 * @example
 * averagedStats(
 *   { hp: 50, attack: 40, defense: 30, speed: 60 },
 *   { hp: 100, attack: 80, defense: 40, speed: 30 },
 *   0,  // no jitter
 *   () => 0.5,
 * )
 * // → { hp: 75, attack: 60, defense: 35, speed: 45 }
 */
export function averagedStats(
    a: BaseStats,
    b: BaseStats,
    jitterFrac: number = 0.1,
    rng: () => number = Math.random,
): BaseStats {
    const avg = (x: number, y: number): number => {
        const mean = (x + y) / 2;
        if (jitterFrac === 0) return Math.round(mean);
        const delta = mean * jitterFrac * (rng() * 2 - 1);
        return Math.max(1, Math.min(250, Math.round(mean + delta)));
    };
    return {
        hp: avg(a.hp, b.hp),
        attack: avg(a.attack, b.attack),
        defense: avg(a.defense, b.defense),
        speed: avg(a.speed, b.speed),
    };
}

/**
 * Union the parents' level-1 moves with the child-species' own
 * learnset (≤ level 5), deduplicating. Result is sorted by level
 * for deterministic output.
 */
export function inheritedLearnset(
    parentA: ParentSnapshot,
    parentB: ParentSnapshot,
    childSpeciesLearnset: { level: number; move_id: string }[],
): { level: number; move_id: string }[] {
    const seen = new Map<string, number>();
    for (const entry of parentA.learnset) {
        if (entry.level === 1) seen.set(entry.move_id, 1);
    }
    for (const entry of parentB.learnset) {
        if (entry.level === 1 && !seen.has(entry.move_id)) seen.set(entry.move_id, 1);
    }
    for (const entry of childSpeciesLearnset) {
        if (entry.level <= 5 && !seen.has(entry.move_id)) {
            seen.set(entry.move_id, entry.level);
        }
    }
    return [...seen.entries()]
        .map(([move_id, level]) => ({ level, move_id }))
        .sort((x, y) => x.level - y.level || x.move_id.localeCompare(y.move_id));
}

/**
 * Produce the full offspring record. The child's species id is the
 * caller's choice — typically the lower-tier "child" of the dominant
 * parent's family. For the no-child-species-chosen default, the
 * child inherits parentA's species id with a `_lili` suffix.
 *
 * @example
 * hatch({
 *   parentA: { speciesId: 'kon_moli', type: 'seli', base_stats: {...}, learnset: [...] },
 *   parentB: { speciesId: 'telo_jaki', type: 'telo', base_stats: {...}, learnset: [...] },
 *   childSpeciesLearnset: [{ level: 1, move_id: 'kasi_lili' }],
 *   rng: () => 0.5,
 * })
 * // → { speciesId: 'kon_moli_lili', type: 'kasi', level: 1, ... }
 */
export function hatch(params: {
    parentA: ParentSnapshot;
    parentB: ParentSnapshot;
    childSpeciesId?: string;
    childSpeciesLearnset: { level: number; move_id: string }[];
    jitterFrac?: number;
    rng?: () => number;
}): Offspring {
    const {
        parentA,
        parentB,
        childSpeciesId = `${parentA.speciesId}_lili`,
        childSpeciesLearnset,
        jitterFrac = 0.1,
        rng = Math.random,
    } = params;

    return {
        speciesId: childSpeciesId,
        type: childType(parentA.type, parentB.type),
        base_stats: averagedStats(parentA.base_stats, parentB.base_stats, jitterFrac, rng),
        learnset: inheritedLearnset(parentA, parentB, childSpeciesLearnset),
        level: 1,
    };
}
