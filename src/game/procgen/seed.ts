import seedrandom from 'seedrandom';

// Word pools for seed phrases. Curated for meaning + visual distinctness in
// sitelen pona. Every combination is grammatically valid Toki Pona.

export const ADJECTIVE_POOL = [
  'pona', // good
  'ike', // bad
  'suli', // big
  'lili', // small
  'lete', // cold
  'seli', // hot
  'pimeja', // dark
  'walo', // white
  'wawa', // strong
  'nasa', // strange
  'sewi', // sacred/up
] as const;

export const NOUN_POOL = [
  'ma', // land
  'tomo', // house
  'soweli', // animal
  'kasi', // plant
  'telo', // water
  'nena', // hill
  'kala', // fish
  'jan', // person
  'sewi', // sky
  'kon', // spirit/air
] as const;

export type SeedWord = string;
export interface Seed {
  adj1: SeedWord;
  adj2: SeedWord;
  noun: SeedWord;
}

const STORAGE_KEY = 'kama-sona.seed.v1';

/**
 * Compose the seed tokens into a single Toki Pona phrase.
 * Format: `{noun} {adj1} {adj2}` — real TP grammar (noun, then modifiers).
 * Example: `{ noun: 'ma', adj1: 'pona', adj2: 'suli' }` → 'ma pona suli'.
 */
export function seedPhrase(s: Seed): string {
  return `${s.noun} ${s.adj1} ${s.adj2}`;
}

/** Unique stable string form for use as an rng seed / localStorage key. */
export function seedKey(s: Seed): string {
  return `${s.noun}|${s.adj1}|${s.adj2}`;
}

export function parseSeedPhrase(phrase: string): Seed | null {
  const parts = phrase.trim().toLowerCase().split(/\s+/);
  if (parts.length !== 3) return null;
  const [noun, adj1, adj2] = parts;
  if (!(NOUN_POOL as readonly string[]).includes(noun)) return null;
  if (!(ADJECTIVE_POOL as readonly string[]).includes(adj1)) return null;
  if (!(ADJECTIVE_POOL as readonly string[]).includes(adj2)) return null;
  if (adj1 === adj2) return null;
  return { noun, adj1, adj2 };
}

/**
 * Shuffle a random valid seed. Optionally pass an existing rng to keep
 * determinism when generating runs (tests).
 */
export function shuffleSeed(rand: () => number = Math.random): Seed {
  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]!;
  const noun = pick(NOUN_POOL);
  const adj1 = pick(ADJECTIVE_POOL);
  let adj2 = pick(ADJECTIVE_POOL);
  while (adj2 === adj1) adj2 = pick(ADJECTIVE_POOL);
  return { noun, adj1, adj2 };
}

/** Deterministic RNG from a seed. Returns `() => number` in [0, 1). */
export function seedToRng(s: Seed): () => number {
  return seedrandom(seedKey(s));
}

// -------- localStorage persistence --------

export function loadSeed(): Seed | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    return parseSeedPhrase(`${s.noun} ${s.adj1} ${s.adj2}`);
  } catch {
    return null;
  }
}

export function saveSeed(s: Seed): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* quota ignore */
  }
}

export function clearSeed(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
