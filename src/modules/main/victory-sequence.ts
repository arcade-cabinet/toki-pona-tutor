/**
 * T2-07: victory + level-up + XP gain sequence.
 *
 * Pure orchestration layer composing xp-curve math with a species
 * learnset lookup to produce the ordered step list the combat-end
 * UI animates frame-by-frame:
 *
 *   [XpGained, LevelUp, MoveLearned?, LevelUp, MoveLearned?, ...]
 *
 * The runtime (gym-leader onDefeated, encounter catch flow) calls
 * this after the foe is defeated, then feeds each step into a
 * dialog/toast pipeline one at a time. Deterministic — no RNG,
 * same inputs always yield the same sequence.
 *
 * Only the lead creature (party[0]) earns XP — classic fainted-
 * swap rules are out of scope for Phase-2.
 */

import { gainXp } from "./xp-curve";

export type SpeciesEntry = {
    id: string;
    learnset: Array<{ level: number; move_id: string }>;
};

export type PartyCreature = {
    species_id: string;
    xp: number;
    level: number;
    moves: string[];
};

export type FoeDefeated = {
    xp_yield: number;
};

export type VictoryStep =
    | { kind: "xp_gained"; creatureIndex: number; amount: number }
    | { kind: "level_up"; creatureIndex: number; from: number; to: number }
    | { kind: "move_learned"; creatureIndex: number; moveId: string; atLevel: number };

export function buildVictorySequence(
    party: ReadonlyArray<PartyCreature>,
    foe: FoeDefeated,
    speciesLookup: (id: string) => SpeciesEntry | null,
): VictoryStep[] {
    if (party.length === 0) return [];

    const lead = party[0];
    const steps: VictoryStep[] = [];
    const gained = foe.xp_yield;

    steps.push({ kind: "xp_gained", creatureIndex: 0, amount: gained });

    const { levelUps } = gainXp(lead.xp, gained);
    const species = speciesLookup(lead.species_id);
    const knownMoves = new Set(lead.moves);

    for (const lu of levelUps) {
        steps.push({ kind: "level_up", creatureIndex: 0, from: lu.from, to: lu.to });
        if (!species) continue;
        for (const entry of species.learnset) {
            if (entry.level === lu.to && !knownMoves.has(entry.move_id)) {
                steps.push({
                    kind: "move_learned",
                    creatureIndex: 0,
                    moveId: entry.move_id,
                    atLevel: lu.to,
                });
                knownMoves.add(entry.move_id);
            }
        }
    }

    return steps;
}
