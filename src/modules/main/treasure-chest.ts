/**
 * Treasure chest framework — T7-06.
 *
 * Maps scatter 1-3 chests per region. Each chest has:
 *  - stable id (`chest_<map>_<slot>`)
 *  - loot table (weighted item drops)
 *  - optional gate (TP dialog check — player must know a word to open)
 *  - optional flag write on first-open (for one-shot chests)
 *
 * The state machine is simple: never-opened → opened. Once a chest is
 * flagged open in SQLite it stays open permanently across saves. This
 * module is pure — the runtime owns the flag writes + inventory adds.
 *
 * Loot rolls are seedable: the same (chestId, rng-seed) produces the
 * same drop, so speedrun / daily-challenge modes can fix chest loot.
 */

export interface ChestLoot {
    itemId: string;
    count: number;
    /** Weight for the weighted roll. Higher = more common. */
    weight: number;
}

export interface ChestDef {
    id: string;
    mapId: string;
    /** Map grid coords in tiles. */
    at: [x: number, y: number];
    loot: ChestLoot[];
    /** Optional flag to check before open. If set, chest displays as
     *  locked; player needs the flag via some other quest/event. */
    requiredFlag?: string;
    /** Optional TP word the player must have mastered to open. Powers
     *  the "language gate" design — some chests are reward for vocab. */
    requiredMasteredWord?: string;
    /** Stable SQLite flag id flipped on first open. */
    openFlag: string;
}

export type ChestStatus = "closed" | "locked" | "opened";

export interface PlayerGateState {
    /** SQLite flags that are set (e.g. `badge_sewi: '1'`). */
    flags: Record<string, string>;
    /** TP words the player has seen ≥ N times. */
    masteredWords: Set<string>;
}

/**
 * Resolve current chest status given the chest definition and the
 * player's gate state.
 *
 * @example
 * chestStatus(def, { flags: { chest_ma_telo_0: '1' }, masteredWords: new Set() })
 * // → 'opened' (already opened before)
 */
export function chestStatus(chest: ChestDef, player: PlayerGateState): ChestStatus {
    if (player.flags[chest.openFlag]) return "opened";
    if (chest.requiredFlag && !player.flags[chest.requiredFlag]) return "locked";
    if (chest.requiredMasteredWord && !player.masteredWords.has(chest.requiredMasteredWord)) {
        return "locked";
    }
    return "closed";
}

/**
 * Roll a loot drop from the chest's weighted table. Pure given the RNG.
 * Returns the single item the chest produces this open. Callers then add
 * it to inventory + flip the openFlag.
 */
export function rollLoot(chest: ChestDef, rng: () => number = Math.random): ChestLoot | null {
    if (chest.loot.length === 0) return null;
    const total = chest.loot.reduce((s, l) => s + l.weight, 0);
    let pick = rng() * total;
    for (const entry of chest.loot) {
        pick -= entry.weight;
        if (pick <= 0) return entry;
    }
    return chest.loot[chest.loot.length - 1];
}

/**
 * Full one-shot open. Idempotent: opening an already-opened chest
 * returns { granted: null, alreadyOpened: true } without modifying state.
 *
 * The returned `newFlags` is a merged copy — callers persist it atomically.
 *
 * @example
 * openChest(
 *   { id: 'chest_ma_telo_0', mapId: 'ma_telo', at: [5, 3],
 *     loot: [{ itemId: 'kili', count: 1, weight: 1 }], openFlag: 'chest_ma_telo_0' },
 *   { flags: {}, masteredWords: new Set() },
 * )
 * // → { granted: { itemId: 'kili', count: 1, weight: 1 },
 * //     newFlags: { chest_ma_telo_0: '1' },
 * //     alreadyOpened: false }
 */
export function openChest(
    chest: ChestDef,
    player: PlayerGateState,
    rng: () => number = Math.random,
): {
    granted: ChestLoot | null;
    newFlags: Record<string, string>;
    alreadyOpened: boolean;
    lockedReason?: string;
} {
    const status = chestStatus(chest, player);
    if (status === "opened") {
        return { granted: null, newFlags: player.flags, alreadyOpened: true };
    }
    if (status === "locked") {
        const reason = chest.requiredFlag
            ? `flag:${chest.requiredFlag}`
            : `word:${chest.requiredMasteredWord}`;
        return {
            granted: null,
            newFlags: player.flags,
            alreadyOpened: false,
            lockedReason: reason,
        };
    }

    const granted = rollLoot(chest, rng);
    return {
        granted,
        newFlags: { ...player.flags, [chest.openFlag]: "1" },
        alreadyOpened: false,
    };
}
