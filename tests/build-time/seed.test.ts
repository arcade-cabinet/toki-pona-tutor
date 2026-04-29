import { describe, expect, it } from "vitest";
import {
    createRng,
    deriveSeed,
    hashCoord,
    parseSeed,
    seedDisplay,
} from "../../src/modules/seed";

/**
 * T112: Seed infrastructure determinism + distribution tests.
 *
 * v2 world-gen invariant (docs/WORLD_GENERATION.md): same seed + same
 * call sequence produces identical output forever. These tests are the
 * guardrail against a subtle regression that would silently desync
 * worlds across save/load or across players on the same seed.
 */

describe("parseSeed", () => {
    it("numbers round-trip canonically", () => {
        expect(parseSeed(0)).toBe(0);
        expect(parseSeed(42)).toBe(42);
        expect(parseSeed(2 ** 31)).toBe(2 ** 31);
    });

    it("strings hash to a stable 32-bit unsigned integer", () => {
        const a = parseSeed("hello");
        const b = parseSeed("hello");
        expect(a).toBe(b);
        expect(Number.isInteger(a) && a >= 0 && a < 2 ** 32).toBe(true);
    });

    it("different strings give different seeds", () => {
        expect(parseSeed("hello")).not.toBe(parseSeed("world"));
    });

    it("undefined generates a fresh seed (non-zero, in range)", () => {
        const s = parseSeed();
        expect(Number.isInteger(s)).toBe(true);
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThan(2 ** 32);
    });

    it("empty string is treated as undefined", () => {
        const s = parseSeed("");
        expect(Number.isInteger(s)).toBe(true);
    });
});

describe("seedDisplay", () => {
    it("formats seed as a stable string", () => {
        expect(seedDisplay(0)).toBe("0");
        expect(seedDisplay(42)).toBe("42");
        expect(seedDisplay(parseSeed("world"))).toMatch(/^\d+$/);
    });
});

describe("createRng — determinism", () => {
    it("same seed gives same sequence", () => {
        const a = createRng(42);
        const b = createRng(42);
        for (let i = 0; i < 100; i++) {
            expect(a.next()).toBe(b.next());
        }
    });

    it("different seeds give different sequences", () => {
        const a = createRng(1);
        const b = createRng(2);
        const samplesA = Array.from({ length: 50 }, () => a.next());
        const samplesB = Array.from({ length: 50 }, () => b.next());
        expect(samplesA).not.toEqual(samplesB);
    });

    it("namespaced key gives different but deterministic stream", () => {
        const biome = createRng(42, "biome");
        const village = createRng(42, "village");
        const biome2 = createRng(42, "biome");
        // First calls differ between domains.
        expect(biome.next()).not.toBe(village.next());
        // biome2's second call must equal biome's second call (both advance identically).
        biome2.next(); // consume first to align streams
        expect(biome.next()).toBe(biome2.next());
    });
});

describe("createRng — distribution", () => {
    it("next() is in [0, 1)", () => {
        const rng = createRng(7);
        for (let i = 0; i < 1000; i++) {
            const v = rng.next();
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThan(1);
        }
    });

    it("int(max) stays in [0, max)", () => {
        const rng = createRng(7);
        for (let i = 0; i < 1000; i++) {
            const v = rng.int(10);
            expect(v).toBeGreaterThanOrEqual(0);
            expect(v).toBeLessThan(10);
            expect(Number.isInteger(v)).toBe(true);
        }
    });

    it("range(min, max) is inclusive both ends", () => {
        const rng = createRng(7);
        const seen = new Set<number>();
        for (let i = 0; i < 10_000; i++) {
            const v = rng.range(3, 5);
            expect(v).toBeGreaterThanOrEqual(3);
            expect(v).toBeLessThanOrEqual(5);
            seen.add(v);
        }
        expect(seen.has(3)).toBe(true);
        expect(seen.has(4)).toBe(true);
        expect(seen.has(5)).toBe(true);
    });

    it("chance(p) holds true at approx rate p", () => {
        const rng = createRng(7);
        let hits = 0;
        for (let i = 0; i < 10_000; i++) {
            if (rng.chance(0.3)) hits++;
        }
        expect(hits).toBeGreaterThan(2500);
        expect(hits).toBeLessThan(3500);
    });

    it("pick samples every element over time", () => {
        const rng = createRng(7);
        const items = ["a", "b", "c", "d"] as const;
        const seen = new Set<string>();
        for (let i = 0; i < 500; i++) seen.add(rng.pick(items));
        expect(seen.size).toBe(items.length);
    });

    it("shuffle does not mutate input", () => {
        const rng = createRng(7);
        const orig = [1, 2, 3, 4, 5];
        const shuffled = rng.shuffle(orig);
        expect(orig).toEqual([1, 2, 3, 4, 5]);
        expect(shuffled.sort()).toEqual(orig.sort());
    });

    it("shuffle is deterministic for same seed", () => {
        const a = createRng(99);
        const b = createRng(99);
        expect(a.shuffle([1, 2, 3, 4, 5])).toEqual(b.shuffle([1, 2, 3, 4, 5]));
    });
});

describe("createRng — error handling", () => {
    it("int(0) throws", () => {
        expect(() => createRng(1).int(0)).toThrow();
    });

    it("int(-5) throws", () => {
        expect(() => createRng(1).int(-5)).toThrow();
    });

    it("range(5, 3) throws (max < min)", () => {
        expect(() => createRng(1).range(5, 3)).toThrow();
    });

    it("pick([]) throws", () => {
        expect(() => createRng(1).pick([])).toThrow();
    });
});

describe("hashCoord", () => {
    it("is deterministic", () => {
        expect(hashCoord(42, 3, 4)).toBe(hashCoord(42, 3, 4));
    });

    it("changes when seed changes", () => {
        expect(hashCoord(1, 3, 4)).not.toBe(hashCoord(2, 3, 4));
    });

    it("changes when x changes", () => {
        expect(hashCoord(42, 3, 4)).not.toBe(hashCoord(42, 4, 4));
    });

    it("changes when y changes", () => {
        expect(hashCoord(42, 3, 4)).not.toBe(hashCoord(42, 3, 5));
    });

    it("salt namespace is independent", () => {
        expect(hashCoord(42, 3, 4, 0)).not.toBe(hashCoord(42, 3, 4, 1));
    });

    it("returns 32-bit unsigned integers", () => {
        for (let i = 0; i < 100; i++) {
            const h = hashCoord(i, i * 7, i * 11);
            expect(Number.isInteger(h)).toBe(true);
            expect(h).toBeGreaterThanOrEqual(0);
            expect(h).toBeLessThan(2 ** 32);
        }
    });
});

describe("deriveSeed", () => {
    it("is deterministic", () => {
        expect(deriveSeed(42, "biome")).toBe(deriveSeed(42, "biome"));
    });

    it("namespaces by domain", () => {
        expect(deriveSeed(42, "biome")).not.toBe(deriveSeed(42, "village"));
    });

    it("namespaces by salt", () => {
        expect(deriveSeed(42, "biome", 0)).not.toBe(deriveSeed(42, "biome", 1));
    });

    it("returns 32-bit unsigned", () => {
        const s = deriveSeed(42, "biome");
        expect(Number.isInteger(s)).toBe(true);
        expect(s).toBeGreaterThanOrEqual(0);
        expect(s).toBeLessThan(2 ** 32);
    });
});

describe("Chi-square sanity check", () => {
    /**
     * Coarse distribution sanity: bucket 100k draws into 10 bins; each
     * bin should hold roughly 10% ± 2%. Not a formal chi-square test —
     * we just want to catch a catastrophic regression (all draws in
     * one bin, etc).
     */
    it("uniform distribution across 10 bins", () => {
        const rng = createRng(42);
        const bins = new Array(10).fill(0);
        const N = 100_000;
        for (let i = 0; i < N; i++) {
            bins[Math.floor(rng.next() * 10)]++;
        }
        for (const count of bins) {
            expect(count).toBeGreaterThan(N * 0.08);
            expect(count).toBeLessThan(N * 0.12);
        }
    });
});
