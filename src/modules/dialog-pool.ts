/**
 * Dialog pool — role × context × mood × level-band NPC dialog.
 *
 * Per docs/DIALOG_POOL.md. Phase 6 populates the content files;
 * the selection logic (assignNpcDialog, pickLine) is implemented here.
 *
 * ~3000 lines across 15 roles × 4 level-bands × ~50 lines each.
 */

import { createRng } from "./seed";

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
 * Map player level → level band per DIALOG_POOL.md.
 * 1-10 → 0, 11-25 → 1, 26-45 → 2, 46-99 → 3.
 */
export function levelBandForPlayerLevel(playerLevel: number): LevelBand {
    if (playerLevel <= 10) return 0;
    if (playerLevel <= 25) return 1;
    if (playerLevel <= 45) return 2;
    return 3;
}

/**
 * Compute a stable NPC seed from (seed, chunk, spawnIndex).
 */
function npcSeed(seed: number, chunk: { x: number; y: number }, spawnIndex: number): number {
    let h = seed >>> 0;
    h = Math.imul(h ^ ((chunk.x | 0) + 0x9e3779b9), 0x85ebca6b) >>> 0;
    h = Math.imul(h ^ ((chunk.y | 0) + 0xc2b2ae35), 0x1b873593) >>> 0;
    h = Math.imul(h ^ ((spawnIndex | 0) + 0x27d4eb2f), 0x27d4eb2f) >>> 0;
    return h >>> 0;
}

/**
 * Pick up to `n` lines from `pool` using a seeded RNG keyed by `salt`.
 * Selects up to ceil(n/4) lines per level band first, then fills remaining
 * slots from across bands, so every profile has coverage across bands.
 * Deterministic: same (npcSeed, salt) → same subset.
 */
function pickN(pool: DialogLine[], n: number, seed: number, salt: number): DialogLine[] {
    if (pool.length === 0) return [];
    const perBand = Math.max(1, Math.ceil(n / 4));
    const selected: DialogLine[] = [];
    for (let band = 0; band <= 3; band++) {
        const inBand = pool.filter((l) => l.levelBand === band);
        if (inBand.length === 0) continue;
        const rng = createRng((seed ^ salt) + band);
        const shuffled = rng.shuffle(inBand);
        selected.push(...shuffled.slice(0, Math.min(perBand, shuffled.length)));
    }
    // Sort by band so band-0 lines are always included first when trimming to n
    selected.sort((a, b) => a.levelBand - b.levelBand);
    return selected.slice(0, Math.min(n, selected.length));
}

/**
 * Assign a deterministic per-NPC dialog profile from the pool.
 * `pool` should be filtered to the NPC's role before calling.
 */
export function assignNpcDialog(
    seed: number,
    chunk: { x: number; y: number },
    spawnIndex: number,
    role: Role,
    pool: DialogLine[],
): NpcDialogProfile {
    const ns = npcSeed(seed, chunk, spawnIndex);
    const byContext = (ctx: Context) => pool.filter((l) => l.context === ctx);

    return {
        npcSeed: ns,
        role,
        greetings: pickN(byContext("greeting"), 3, ns, 1),
        ambients: pickN(byContext("ambient"), 5, ns, 2),
        rumors: pickN(byContext("rumor"), 2, ns, 3),
        challengeOffers: pickN(byContext("challenge_offer"), 2, ns, 4),
        challengeThanks: pickN(byContext("challenge_thanks"), 2, ns, 5),
        idleAfterResolve: pickN(byContext("idle_after_resolve"), 3, ns, 6),
    };
}

/**
 * Pick one line from the profile for a given context, filtered by player level band.
 * Falls back to lower bands if current band has no lines. Never goes up-band.
 * Returns null if no lines are available.
 */
export function pickLine(
    profile: NpcDialogProfile,
    context: Context,
    playerLevel: number,
): DialogLine | null {
    const lines = contextLines(profile, context);
    if (lines.length === 0) return null;

    const targetBand = levelBandForPlayerLevel(playerLevel);
    for (let band = targetBand; band >= 0; band--) {
        const inBand = lines.filter((l) => l.levelBand === band);
        if (inBand.length > 0) {
            return inBand[Math.floor(profile.npcSeed % inBand.length)]!;
        }
    }
    return null;
}

function contextLines(profile: NpcDialogProfile, context: Context): DialogLine[] {
    switch (context) {
        case "greeting": return profile.greetings;
        case "ambient": return profile.ambients;
        case "rumor": return profile.rumors;
        case "challenge_offer": return profile.challengeOffers;
        case "challenge_thanks": return profile.challengeThanks;
        case "idle_after_resolve": return profile.idleAfterResolve;
    }
}
