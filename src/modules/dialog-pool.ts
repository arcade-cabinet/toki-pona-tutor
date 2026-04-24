/**
 * Dialog pool — role × context × mood × level-band NPC dialog.
 *
 * Per docs/DIALOG_POOL.md. Unimplemented; Phase 6 populates.
 *
 * Each NPC gets a deterministic subset of lines per context, selected
 * at realization time from the shared role pool. ~3000 lines total
 * across 15 roles × 4 level-bands × ~50 lines each.
 */

export type Role =
    | "guide"
    | "shopkeep"
    | "innkeep"
    | "elder"
    | "fisher"
    | "guard"
    | "wanderer"
    | "farmer"
    | "hunter"
    | "trainer"
    | "rival"
    | "child"
    | "villager_generic"
    | "shrine_keeper"
    | "historian";

export type Context =
    | "greeting"
    | "ambient"
    | "rumor"
    | "challenge_offer"
    | "challenge_thanks"
    | "idle_after_resolve";

export type Mood = "calm" | "warm" | "weary" | "curious";

export type LevelBand = 0 | 1 | 2 | 3;

export type DialogLine = {
    id: string;
    role: Role;
    context: Context;
    mood: Mood;
    levelBand: LevelBand;
    text: string;
    tags?: string[];
    seedFrom?: string;
};

export type NpcDialogProfile = {
    npcSeed: number;
    role: Role;
    greetings: DialogLine[];
    ambients: DialogLine[];
    rumors: DialogLine[];
    challengeOffers: DialogLine[];
    challengeThanks: DialogLine[];
    idleAfterResolve: DialogLine[];
};

/**
 * Load the compiled dialog pool from src/content/dialog_pool/*.json.
 */
export function loadDialogPool(): Record<Role, DialogLine[]> {
    throw new Error("dialog-pool.loadDialogPool unimplemented (Phase 6)");
}

/**
 * Assign a deterministic per-NPC subset of lines.
 */
export function assignNpcDialog(
    _seed: number,
    _chunk: { x: number; y: number },
    _spawnIndex: number,
    _role: Role,
): NpcDialogProfile {
    throw new Error("dialog-pool.assignNpcDialog unimplemented (Phase 6)");
}

/**
 * Pick one line for a given interaction, filtered by current player
 * level band. Never falls up-band; if current band is empty, falls back
 * to lower bands.
 */
export function pickLine(
    _profile: NpcDialogProfile,
    _context: Context,
    _playerLevel: number,
): DialogLine {
    throw new Error("dialog-pool.pickLine unimplemented (Phase 6)");
}
