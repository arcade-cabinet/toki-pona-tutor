/**
 * New Game Plus — T7-10.
 *
 * Once the player beats the green dragon (green_dragon), a `game_cleared`
 * flag is set. Starting a New Game Plus carries forward:
 *
 * - The full party roster at configured reduced levels, floored at the
 *   shared XP curve minimum.
 * - All mastered-word sightings (the language learning DOES carry over;
 *   that's the whole point of the game).
 * - A `ng_plus_count` counter so dialog can reference how many times
 *   the player has cleared.
 *
 * Cleared NG+:
 * - All flags (badges, quest-done, starter_chosen) cleared.
 * - All journey-beat progress cleared.
 * - Inventory cleared except the configured NG+ reward inventory.
 * - Encounter rates: legendary weighting is driven by
 *   `NEW_GAME_PLUS_CONFIG` and surfaced through `ngPlusLegendaryMultiplier`.
 *
 * This module is pure — it computes the NEW save payload from the OLD
 * save payload without touching storage. The caller swaps the payload
 * atomically into the save slot once the derivation completes.
 */
import { NEW_GAME_PLUS_CONFIG } from "../../content/gameplay";
import { MIN_LEVEL, xpForLevel } from "./xp-curve";

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

/**
 * Reduce a party member's level by the configured NG+ amount. Recomputes
 * XP to the new level's threshold so the bar starts fresh.
 *
 * @example
 * reducePartyLevel({ slot: 0, species_id: 'ashcat', level: 35, xp: 42875 })
 * // → { slot: 0, species_id: 'ashcat', level: 25, xp: 15625 }
 */
export function reducePartyLevel(member: PartySlot): PartySlot {
    const newLevel = Math.max(MIN_LEVEL, member.level - NEW_GAME_PLUS_CONFIG.levelReduction);
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
 *   party: [{ slot: 0, species_id: 'ashcat', level: 35, xp: 42875 }],
 *   flags: { game_cleared: '1', badge_highridge: '1', starter_chosen: '1' },
 *   masteredWords: { soweli: 12, poki: 8 },
 *   inventory: { capture_pod: 2, orchard_fruit: 5 },
 *   currentMapId: 'rivergate_approach',
 *   journeyBeat: 'beat_07_rivergate_approach',
 * })
 * // → {
 * //     party: [{ slot: 0, species_id: 'ashcat', level: 25, xp: 15625 }],
 * //     flags: {},  // all flags cleared
 * //     masteredWords: { soweli: 12, poki: 8 },  // preserved
 * //     inventory: { heavy_capture_pod: 1 },  // only the NG+ reward
 * //     currentMapId: 'riverside_home',
 * //     journeyBeat: 'beat_01_riverside_home',
 * //     ngPlusCount: 1,
 * //   }
 */
export function deriveNewGamePlus(old: SaveState): SaveState {
    if (!old.flags[NEW_GAME_PLUS_CONFIG.requiredClearedFlag]) {
        throw new Error(
            `deriveNewGamePlus: cannot start NG+ before ${NEW_GAME_PLUS_CONFIG.requiredClearedFlag} flag is set`,
        );
    }

    return {
        party: old.party.map(reducePartyLevel),
        flags: {},
        masteredWords: { ...old.masteredWords },
        inventory: { ...NEW_GAME_PLUS_CONFIG.rewardInventory },
        currentMapId: NEW_GAME_PLUS_CONFIG.startMapId,
        journeyBeat: NEW_GAME_PLUS_CONFIG.startJourneyBeatId,
        ngPlusCount: (old.ngPlusCount ?? 0) + 1,
    };
}

/** Encounter weight multiplier for legendary-tier species on NG+. */
export function ngPlusLegendaryMultiplier(ngPlusCount: number): number {
    if (ngPlusCount <= 0) return NEW_GAME_PLUS_CONFIG.legendaryMultiplierBase;
    return Math.min(
        NEW_GAME_PLUS_CONFIG.legendaryMultiplierCap,
        NEW_GAME_PLUS_CONFIG.legendaryMultiplierBase +
            ngPlusCount * NEW_GAME_PLUS_CONFIG.legendaryMultiplierPerClear,
    );
}
