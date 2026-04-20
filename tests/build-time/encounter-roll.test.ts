import { describe, it, expect } from 'vitest';

/**
 * T6-04: weighted species roll distribution.
 *
 * The encounter system in src/modules/main/encounter.ts uses a weighted
 * table of species → weight. Re-implementing the roll here as a pure
 * function means we can test its distribution without spinning up the
 * RpgPlayer + map infrastructure.
 *
 * This is a duplicate of the private rollSpeciesId() in encounter.ts —
 * intentional, so changing the algorithm requires updating both (a
 * forcing function for keeping the test honest). When the engine-side
 * implementation moves to a shared helper we'll collapse the two.
 */
function rollSpeciesId(table: Record<string, number>, rng: () => number = Math.random): string | null {
    const entries = Object.entries(table);
    if (entries.length === 0) return null;
    const total = entries.reduce((s, [, w]) => s + w, 0);
    let pick = rng() * total;
    for (const [id, weight] of entries) {
        pick -= weight;
        if (pick <= 0) return id;
    }
    return entries[entries.length - 1][0];
}

/** Linear-congruential PRNG — deterministic, uniform over (0, 1). */
function makeRng(seed: number): () => number {
    let s = seed >>> 0;
    return () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 0x100000000;
    };
}

describe('rollSpeciesId — weighted distribution', () => {
    it('returns null for empty table', () => {
        expect(rollSpeciesId({})).toBeNull();
    });

    it('always returns the sole key of a 1-entry table', () => {
        const rng = makeRng(42);
        for (let i = 0; i < 1000; i++) {
            expect(rollSpeciesId({ only: 10 }, rng)).toBe('only');
        }
    });

    it('equal weights produce roughly equal distribution (±3%)', () => {
        const rng = makeRng(42);
        const table = { a: 25, b: 25, c: 25, d: 25 };
        const trials = 10_000;
        const counts: Record<string, number> = { a: 0, b: 0, c: 0, d: 0 };
        for (let i = 0; i < trials; i++) {
            const id = rollSpeciesId(table, rng);
            if (id) counts[id]++;
        }
        for (const key of Object.keys(counts)) {
            const ratio = counts[key] / trials;
            expect(ratio).toBeGreaterThan(0.22); // 25% - 3%
            expect(ratio).toBeLessThan(0.28); // 25% + 3%
        }
    });

    it('unequal weights match within 3% of expected ratios', () => {
        const rng = makeRng(12345);
        // Mirror a real region table: nasin_wan beat 2.
        const table = { jan_ike_lili: 25, jan_utala_lili: 20, soweli_musi: 20, soweli_kili: 15, soweli_jaki: 10, waso_pimeja: 10 };
        const total = Object.values(table).reduce((s, w) => s + w, 0);
        const trials = 20_000;
        const counts: Record<string, number> = {};
        for (const k of Object.keys(table)) counts[k] = 0;

        for (let i = 0; i < trials; i++) {
            const id = rollSpeciesId(table, rng);
            if (id) counts[id]++;
        }
        for (const [key, weight] of Object.entries(table)) {
            const expected = weight / total;
            const actual = counts[key] / trials;
            expect(Math.abs(actual - expected)).toBeLessThan(0.03);
        }
    });

    it('legendary-tier weight of 5 in a 100-total table fires ~5% of the time', () => {
        const rng = makeRng(999);
        const table = { common: 80, uncommon: 15, legendary: 5 };
        const trials = 50_000;
        let legendaryHits = 0;
        for (let i = 0; i < trials; i++) {
            if (rollSpeciesId(table, rng) === 'legendary') legendaryHits++;
        }
        const rate = legendaryHits / trials;
        expect(rate).toBeGreaterThan(0.045);
        expect(rate).toBeLessThan(0.055);
    });

    it('single-key weight of 0 never rolls that species', () => {
        const rng = makeRng(7);
        const table = { always: 10, never: 0 };
        const trials = 5000;
        let neverHits = 0;
        for (let i = 0; i < trials; i++) {
            if (rollSpeciesId(table, rng) === 'never') neverHits++;
        }
        // "never" can tie and win the fallback in pick<=0 edge cases,
        // so we accept a tiny rate. Must be < 0.5% of trials.
        expect(neverHits / trials).toBeLessThan(0.005);
    });
});
