/**
 * T4-14: bestiary (seen/caught) state machine.
 *
 * Pure state mgmt over `{ [speciesId]: { seenAt?, caughtAt? } }`.
 * encounter.ts onAppear calls markSeen; catch-resolve calls markCaught.
 * Callers persist the returned NEW state into SQLite — this module
 * never touches storage and never mutates its input.
 *
 * Tier UX:
 *   'unknown' — never encountered        (silhouette in the list)
 *   'seen'    — witnessed, not captured  (sprite + "?" stats)
 *   'caught'  — captured at least once   (full dex entry)
 *
 * Timestamps track *earliest* discovery so an out-of-order save
 * import (e.g. NG+ bestiary migration) keeps the player's true
 * discovery history rather than overwriting with a later date.
 */

export type BestiaryRecord = {
    seenAt?: string;
    caughtAt?: string;
};

export type BestiaryState = Record<string, BestiaryRecord>;

export type BestiaryTier = 'unknown' | 'seen' | 'caught';

export function emptyBestiary(): BestiaryState {
    return {};
}

export function bestiaryTier(state: BestiaryState, speciesId: string): BestiaryTier {
    const rec = state[speciesId];
    if (!rec) return 'unknown';
    if (rec.caughtAt) return 'caught';
    if (rec.seenAt) return 'seen';
    return 'unknown';
}

function minIso(a: string | undefined, b: string): string {
    if (!a) return b;
    return a < b ? a : b;
}

export function markSeen(
    state: BestiaryState,
    speciesId: string,
    at: Date,
): BestiaryState {
    const iso = at.toISOString();
    const prev = state[speciesId];
    const next: BestiaryRecord = {
        ...prev,
        seenAt: minIso(prev?.seenAt, iso),
    };
    return { ...state, [speciesId]: next };
}

export function markCaught(
    state: BestiaryState,
    speciesId: string,
    at: Date,
): BestiaryState {
    const iso = at.toISOString();
    const prev = state[speciesId];
    const next: BestiaryRecord = {
        ...prev,
        seenAt: minIso(prev?.seenAt, iso),
        caughtAt: minIso(prev?.caughtAt, iso),
    };
    return { ...state, [speciesId]: next };
}

export function isFullyDiscovered(
    state: BestiaryState,
    allSpeciesIds: ReadonlyArray<string>,
): boolean {
    if (allSpeciesIds.length === 0) return true;
    return allSpeciesIds.every((id) => bestiaryTier(state, id) === 'caught');
}

export function progressRatio(
    state: BestiaryState,
    allSpeciesIds: ReadonlyArray<string>,
): number {
    if (allSpeciesIds.length === 0) return 0;
    const caught = allSpeciesIds.filter(
        (id) => bestiaryTier(state, id) === 'caught',
    ).length;
    return caught / allSpeciesIds.length;
}

export function listByTier(
    state: BestiaryState,
    allSpeciesIds: ReadonlyArray<string>,
): { caught: string[]; seen: string[]; unknown: string[] } {
    const out = { caught: [] as string[], seen: [] as string[], unknown: [] as string[] };
    for (const id of allSpeciesIds) {
        out[bestiaryTier(state, id)].push(id);
    }
    return out;
}
