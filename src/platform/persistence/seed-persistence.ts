/**
 * Seed persistence — store the active world seed across sessions.
 *
 * New Game generates (or accepts) a seed and writes it here.
 * Resume reads it back. The seed drives all world-gen via the
 * seeded PRNG in src/modules/seed.ts.
 */

import { parseSeed, type Seed } from "../../modules/seed";
import { preferences, KEYS } from "./preferences";

export async function newGameSeed(input?: string | number): Promise<Seed> {
    const seed = parseSeed(input);
    await preferences.set(KEYS.worldSeed, String(seed));
    return seed;
}

export async function resumeSeed(): Promise<Seed | null> {
    return loadActiveSeed();
}

export async function loadActiveSeed(): Promise<Seed | null> {
    const stored = await preferences.get(KEYS.worldSeed);
    if (stored === null) return null;
    const n = Number(stored);
    return Number.isFinite(n) ? (n >>> 0) : null;
}

export async function clearActiveSeed(): Promise<void> {
    await preferences.remove(KEYS.worldSeed);
}
