/**
 * Seeded PRNG infrastructure for deterministic world generation.
 *
 * Per docs/WORLD_GENERATION.md § Invariants:
 *   - `(seed, x, y) → ChunkType` is a pure function.
 *   - No hidden RNG; every random draw goes through this factory.
 *
 * Implementation: `cyrb128` to hash a seed string/number into four
 * 32-bit integers, feeding an `sfc32` state. Both are small, fast,
 * and have well-documented distribution properties. No cryptographic
 * claims — this is world-gen, not security.
 *
 * Public surface:
 *   - {@link parseSeed} — accept any input; produce a canonical seed.
 *   - {@link createRng} — build a PRNG from a seed (or a derived key).
 *   - {@link hashCoord} — stable hash of `(seed, x, y, salt)` → 32-bit.
 *   - {@link deriveSeed} — combine a base seed with domain + salt for
 *     namespacing (e.g. the biome-compass uses a different RNG from
 *     the village-density check; both derive from the same player seed).
 */

export type Rng = {
    /** Next float in [0, 1). */
    next(): number;
    /** Next integer in [0, max) uniformly. */
    int(max: number): number;
    /** Next integer in [min, max] inclusive on both ends. */
    range(min: number, max: number): number;
    /** True with probability `p`. */
    chance(p: number): boolean;
    /** Pick one element uniformly; throws on empty array. */
    pick<T>(items: readonly T[]): T;
    /** Return a new array shuffled in place (Fisher-Yates). */
    shuffle<T>(items: readonly T[]): T[];
};

/** Canonical seed type — a 32-bit unsigned integer. */
export type Seed = number;

/**
 * Accept any seed input and return a canonical numeric seed. Accepts:
 *   - number: clamped to 32-bit unsigned.
 *   - string: hashed via cyrb128.
 *   - `undefined` / empty string: generates a fresh seed from
 *     `Date.now()` + a weak entropy source. (Fresh seeds appear
 *     only on true new-game; saves round-trip the canonical number.)
 */
export function parseSeed(input?: string | number): Seed {
    if (typeof input === "number" && Number.isFinite(input)) {
        return (input >>> 0);
    }
    if (typeof input === "string" && input.length > 0) {
        const [a] = cyrb128(input);
        return a >>> 0;
    }
    // Fresh seed: milliseconds + a quick variance source.
    const rand = Math.floor((typeof globalThis !== "undefined" && globalThis.performance
        ? globalThis.performance.now()
        : 0) * 1_000);
    return ((Date.now() >>> 0) ^ (rand >>> 0)) >>> 0;
}

/**
 * Format a seed back to a human-shareable string. For v2 we display
 * the raw number; a future pass may tokenize to adjective-adjective-noun
 * shareable slugs.
 */
export function seedDisplay(seed: Seed): string {
    return String(seed >>> 0);
}

/**
 * Build an RNG. Optional `key` namespaces the derivation (e.g. "biome",
 * "village", "dialog") so parallel streams don't correlate.
 */
export function createRng(seed: Seed, key?: string): Rng {
    const source = key ? `${seed >>> 0}::${key}` : String(seed >>> 0);
    const [a, b, c, d] = cyrb128(source);
    const gen = sfc32(a, b, c, d);

    const rng: Rng = {
        next: gen,
        int(max: number): number {
            if (max <= 0 || !Number.isFinite(max)) {
                throw new Error(`rng.int: max must be > 0 (got ${max})`);
            }
            return Math.floor(gen() * max);
        },
        range(min: number, max: number): number {
            if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) {
                throw new Error(`rng.range: invalid bounds [${min}, ${max}]`);
            }
            return min + Math.floor(gen() * (max - min + 1));
        },
        chance(p: number): boolean {
            return gen() < p;
        },
        pick<T>(items: readonly T[]): T {
            if (items.length === 0) throw new Error("rng.pick: empty array");
            return items[Math.floor(gen() * items.length)]!;
        },
        shuffle<T>(items: readonly T[]): T[] {
            const arr = items.slice();
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(gen() * (i + 1));
                const tmp = arr[i]!;
                arr[i] = arr[j]!;
                arr[j] = tmp;
            }
            return arr;
        },
    };
    return rng;
}

/**
 * Deterministic hash of `(seed, x, y, salt?)` → 32-bit unsigned integer.
 * Used for coordinate-indexed decisions that should be pure + cheap
 * without building a full RNG (e.g. "is this cell a landmark?").
 */
export function hashCoord(seed: Seed, x: number, y: number, salt = 0): number {
    let h = seed >>> 0;
    h = Math.imul(h ^ ((x | 0) + 0x9e3779b9), 0x85ebca6b) >>> 0;
    h = Math.imul(h ^ ((y | 0) + 0xc2b2ae35), 0xc2b2ae35) >>> 0;
    h = Math.imul(h ^ ((salt | 0) + 0x27d4eb2f), 0x27d4eb2f) >>> 0;
    h ^= h >>> 16;
    return h >>> 0;
}

/**
 * Derive a new seed from a base seed + domain label + optional integer
 * salt. Use when a subsystem needs its own isolated stream.
 */
export function deriveSeed(seed: Seed, domain: string, salt = 0): Seed {
    const [a] = cyrb128(`${seed >>> 0}::${domain}::${salt | 0}`);
    return a >>> 0;
}

// ──────────────────────────────────────────────────────────────────────
// Hash + PRNG kernels (internal). Not exported.
// ──────────────────────────────────────────────────────────────────────

/**
 * cyrb128 — a simple, fast 128-bit hash from a string. Public-domain.
 * Produces four 32-bit unsigned integers suitable for seeding sfc32.
 */
function cyrb128(str: string): [number, number, number, number] {
    let h1 = 1779033703,
        h2 = 3144134277,
        h3 = 1013904242,
        h4 = 2773480762;
    for (let i = 0; i < str.length; i++) {
        const k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    h1 ^= h2 ^ h3 ^ h4;
    h2 ^= h1;
    h3 ^= h1;
    h4 ^= h1;
    return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

/**
 * sfc32 — small fast counter, 32-bit. Good distribution, no
 * correlation between streams, period > 2^32. Public-domain.
 */
function sfc32(a: number, b: number, c: number, d: number): () => number {
    return function (): number {
        a = a >>> 0;
        b = b >>> 0;
        c = c >>> 0;
        d = d >>> 0;
        const t = (a + b + d) | 0;
        d = (d + 1) | 0;
        a = b ^ (b >>> 9);
        b = (c + (c << 3)) | 0;
        c = ((c << 21) | (c >>> 11)) >>> 0;
        c = (c + t) | 0;
        return (t >>> 0) / 4294967296;
    };
}
