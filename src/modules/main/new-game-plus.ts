/**
 * New Game Plus — T7-10.
 *
 * Once the player beats the green dragon (akesi_sewi), a `game_cleared`
 * flag is set. Starting a New Game Plus carries forward:
 *
 * - The full party roster at reduced levels (capped at N-10 or 1, whichever
 *   is higher — so a level-35 creature comes back at level 25, a level-3
 *   one stays at 1).
 * - All mastered-word sightings (the language learning DOES carry over;
 *   that's the whole point of the game).
 * - A `ng_plus_count` counter so dialog can reference how many times
 *   the player has cleared.
 *
 * Cleared NG+:
 * - All flags (badges, quest-done, starter_chosen) cleared.
 * - All journey-beat progress cleared.
 * - Inventory cleared EXCEPT `poki_wawa` is granted as a clear reward.
 * - Encounter rates: legendaries are 2× more common on NG+ (driven by
 *   `ngPlusLegendaryMultiplier` which the encounter.ts hook consults
 *   when computing species weights).
 *
 * This module is pure — it computes the NEW save payload from the OLD
 * save payload without touching storage. The caller swaps the payload
 * atomically into the save slot once the derivation completes.
 */

export interface PartySlot {
    slot: number;
    species_id: string;
    level: number;
    xp: number;
}

export interface SaveState {
    party: PartySlot[];
    flags: Record<string, string>;
    masteredWords: Record<string, number>;
    inventory: Record<string, number>;
    currentMapId?: string;
    journeyBeat?: string;
    ngPlusCount?: number;
}

/** XP threshold formula from xp-curve: xpForLevel(n) = n^3. */
function xpForLevel(n: number): number {
    return Math.max(1, n) ** 3;
}

/**
 * Reduce a party member's level by up to 10, floor at 1. Recomputes
 * xp to the new level's threshold (so the bar starts fresh).
 *
 * @example
 * reducePartyLevel({ slot: 0, species_id: 'kon_moli', level: 35, xp: 42875 })
 * // → { slot: 0, species_id: 'kon_moli', level: 25, xp: 15625 }
 */
export function reducePartyLevel(member: PartySlot): PartySlot {
    const newLevel = Math.max(1, member.level - 10);
    return {
        slot: member.slot,
        species_id: member.species_id,
        level: newLevel,
        xp: xpForLevel(newLevel),
    };
}

/**
 * Derive the next NG+ save from a completed run's save. Throws if the
 * player hasn't actually beaten the game (no `game_cleared` flag set),
 * since NG+ is meant to be earned not cheated.
 *
 * @example
 * deriveNewGamePlus({
 *   party: [{ slot: 0, species_id: 'kon_moli', level: 35, xp: 42875 }],
 *   flags: { game_cleared: '1', badge_sewi: '1', starter_chosen: '1' },
 *   masteredWords: { soweli: 12, poki: 8 },
 *   inventory: { poki_lili: 2, kili: 5 },
 *   currentMapId: 'nasin_pi_telo',
 *   journeyBeat: 'beat_07_nasin_pi_telo',
 * })
 * // → {
 * //     party: [{ slot: 0, species_id: 'kon_moli', level: 25, xp: 15625 }],
 * //     flags: {},  // all flags cleared
 * //     masteredWords: { soweli: 12, poki: 8 },  // preserved
 * //     inventory: { poki_wawa: 1 },  // only the NG+ reward
 * //     currentMapId: 'ma_tomo_lili',
 * //     journeyBeat: 'beat_01_ma_tomo_lili',
 * //     ngPlusCount: 1,
 * //   }
 */
export function deriveNewGamePlus(old: SaveState): SaveState {
    if (!old.flags.game_cleared) {
        throw new Error('deriveNewGamePlus: cannot start NG+ before game_cleared flag is set');
    }

    return {
        party: old.party.map(reducePartyLevel),
        flags: {},
        masteredWords: { ...old.masteredWords },
        inventory: { poki_wawa: 1 },
        currentMapId: 'ma_tomo_lili',
        journeyBeat: 'beat_01_ma_tomo_lili',
        ngPlusCount: (old.ngPlusCount ?? 0) + 1,
    };
}

/** Encounter weight multiplier for legendary-tier species on NG+. */
export function ngPlusLegendaryMultiplier(ngPlusCount: number): number {
    if (ngPlusCount <= 0) return 1;
    // Doubles on first NG+, caps at 4× after three clears so we don't
    // make legendaries trivial to farm.
    return Math.min(4, 1 + ngPlusCount);
}
