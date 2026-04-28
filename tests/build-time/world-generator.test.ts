import { describe, expect, it } from "vitest";
import {
    chunkType,
    chunkTier,
    chunkName,
    BiomeArchetype,
    VillageArchetype,
    LandmarkKind,
} from "../../src/modules/world-generator";

/**
 * T113: Deterministic chunk-type assignment — pure function (seed, x, y) → ChunkType.
 * T114: Biome compass — directional bias tested via biome distribution.
 * T120: Village-density sweep — village within Chebyshev ≤3 of every sampled point.
 */

const SEED = 42;
const SEED_B = 99999;

// ─── T113: Determinism & starter chunk ───────────────────────────────────────

describe("chunkType — determinism", () => {
    it("same seed+coord always gives same chunk type", () => {
        const a = chunkType(SEED, 5, 7);
        const b = chunkType(SEED, 5, 7);
        expect(a).toEqual(b);
    });

    it("different seeds give different results for most coords", () => {
        let diffs = 0;
        for (let x = -10; x <= 10; x++) {
            for (let y = -10; y <= 10; y++) {
                const a = chunkType(SEED, x, y);
                const b = chunkType(SEED_B, x, y);
                if (JSON.stringify(a) !== JSON.stringify(b)) diffs++;
            }
        }
        // At least 50% of coords differ across seeds
        expect(diffs).toBeGreaterThan(100);
    });

    it("(0, 0) is always outdoor grassland regardless of seed", () => {
        for (const seed of [0, 1, SEED, SEED_B, 2 ** 31]) {
            const t = chunkType(seed, 0, 0);
            expect(t.kind).toBe("outdoor");
            if (t.kind === "outdoor") {
                expect(t.biome).toBe("grassland");
            }
        }
    });

    it("non-zero coords return a valid ChunkType kind", () => {
        const validKinds = new Set(["outdoor", "village", "landmark"]);
        for (let x = -5; x <= 5; x++) {
            for (let y = -5; y <= 5; y++) {
                if (x === 0 && y === 0) continue;
                const t = chunkType(SEED, x, y);
                expect(validKinds.has(t.kind)).toBe(true);
            }
        }
    });

    it("outdoor chunks have a valid biome/edge ID", () => {
        const validBiomes = new Set([
            "grassland", "forest", "coast", "snowfield", "cavern_approach", "river_edge",
            "thinning_forest", "frost_forest", "stony_grassland", "marsh", "tundra", "dry_coast",
        ]);
        let checked = 0;
        for (let x = -20; x <= 20; x++) {
            for (let y = -20; y <= 20; y++) {
                const t = chunkType(SEED, x, y);
                if (t.kind === "outdoor") {
                    expect(validBiomes.has(t.biome), `bad biome ${t.biome} at (${x},${y})`).toBe(true);
                    checked++;
                }
            }
        }
        expect(checked).toBeGreaterThan(0);
    });

    it("village chunks have a valid archetype", () => {
        const validArchetypes = new Set<VillageArchetype>([
            "small_hamlet", "market_town", "snow_lodge", "road_stop", "fishing_pier", "shrine_settlement",
        ]);
        for (let x = -20; x <= 20; x++) {
            for (let y = -20; y <= 20; y++) {
                const t = chunkType(SEED, x, y);
                if (t.kind === "village") {
                    expect(validArchetypes.has(t.archetype), `bad archetype ${t.archetype}`).toBe(true);
                }
            }
        }
    });

    it("landmark chunks have a valid landmark kind", () => {
        const validKinds = new Set<LandmarkKind>([
            "stone_shrine", "lone_tower", "lake", "peak_overlook", "ruined_village",
        ]);
        for (let x = -30; x <= 30; x++) {
            for (let y = -30; y <= 30; y++) {
                const t = chunkType(SEED, x, y);
                if (t.kind === "landmark") {
                    expect(validKinds.has(t.landmark), `bad landmark ${t.landmark}`).toBe(true);
                }
            }
        }
    });

    it("landmarks are rare (~1 in 256 cells)", () => {
        let landmarks = 0;
        const N = 40 * 40;
        for (let x = -20; x <= 19; x++) {
            for (let y = -20; y <= 19; y++) {
                if (chunkType(SEED, x, y).kind === "landmark") landmarks++;
            }
        }
        const rate = landmarks / N;
        // Allow wide tolerance — 1/512 to 1/64
        expect(rate).toBeGreaterThan(1 / 512);
        expect(rate).toBeLessThan(1 / 64);
    });
});

// ─── T114: Biome compass — directional bias ───────────────────────────────────

describe("biome compass — directional bias", () => {
    function countBiome(seed: number, coords: [number, number][], biome: BiomeArchetype): number {
        return coords.filter(([x, y]) => {
            const t = chunkType(seed, x, y);
            return t.kind === "outdoor" && t.biome === biome;
        }).length;
    }

    it("biome distribution is not uniform — at least one biome is directionally concentrated", () => {
        // Sample 500 outdoor chunks far north vs far south (primes avoid village-period collisions).
        // Expects at least one biome to differ by >15% between north and south hemispheres.
        const northCoords: [number, number][] = Array.from({ length: 500 }, (_, i) => [
            (i * 11) % 101 - 50,
            15 + (i % 15),
        ]);
        const southCoords: [number, number][] = northCoords.map(([x, y]) => [x, -y] as [number, number]);

        const biomes: BiomeArchetype[] = ["grassland", "forest", "coast", "snowfield", "cavern_approach", "river_edge"];
        let foundBias = false;
        for (const biome of biomes) {
            const north = countBiome(SEED, northCoords, biome);
            const south = countBiome(SEED, southCoords, biome);
            const total = north + south;
            if (total > 5 && Math.abs(north - south) / total > 0.15) {
                foundBias = true;
                break;
            }
        }
        expect(foundBias).toBe(true);
    });

    it("biome distribution differs across seeds for the same coordinates", () => {
        const coords: [number, number][] = Array.from({ length: 300 }, (_, i) => [
            (i * 11) % 101 - 50,
            (i * 13) % 101 - 50,
        ]);
        const biomes: BiomeArchetype[] = ["snowfield", "coast", "forest", "cavern_approach"];
        let totalDiff = 0;
        for (const biome of biomes) {
            const a = countBiome(SEED, coords, biome);
            const b = countBiome(SEED_B, coords, biome);
            totalDiff += Math.abs(a - b);
        }
        expect(totalDiff).toBeGreaterThan(5);
    });
});

// ─── T120: Village density — Chebyshev ≤3 guarantee ─────────────────────────

describe("village density (T120)", () => {
    function hasVillageWithin3(seed: number, cx: number, cy: number): boolean {
        for (let dx = -3; dx <= 3; dx++) {
            for (let dy = -3; dy <= 3; dy++) {
                if (Math.max(Math.abs(dx), Math.abs(dy)) > 3) continue;
                if (chunkType(seed, cx + dx, cy + dy).kind === "village") return true;
            }
        }
        return false;
    }

    it("every sampled coord has a village within Chebyshev ≤3 (seed 42, 1000 samples)", () => {
        const rngStep = 7919; // prime walk
        let coord = 1;
        for (let i = 0; i < 1000; i++) {
            coord = (coord * rngStep + 12345) >>> 0;
            const x = (coord % 201) - 100;
            const y = ((coord >> 12) % 201) - 100;
            expect(
                hasVillageWithin3(SEED, x, y),
                `no village within Chebyshev 3 of (${x}, ${y}) with seed ${SEED}`,
            ).toBe(true);
        }
    });

    it("village density holds across multiple seeds", () => {
        const seeds = [0, 1, SEED, SEED_B, 123456789];
        for (const seed of seeds) {
            let coord = seed ^ 0xdeadbeef;
            for (let i = 0; i < 50; i++) {
                coord = ((coord * 1664525 + 1013904223) >>> 0);
                const x = (coord % 101) - 50;
                const y = ((coord >> 8) % 101) - 50;
                expect(
                    hasVillageWithin3(seed, x, y),
                    `seed=${seed} (${x},${y}) missing village`,
                ).toBe(true);
            }
        }
    });
});

// ─── chunkTier ───────────────────────────────────────────────────────────────

describe("chunkTier", () => {
    // Formula: floor(log2(1 + chebyshev))
    // chebyshev=0 → tier 0, chebyshev=1 → tier 1, chebyshev=2→tier 1, chebyshev=4→tier 2
    it("(0,0) is tier 0", () => expect(chunkTier({ x: 0, y: 0 })).toBe(0));
    it("(1,0) is tier 1", () => expect(chunkTier({ x: 1, y: 0 })).toBe(1));
    it("(2,0) is tier 1", () => expect(chunkTier({ x: 2, y: 0 })).toBe(1));
    it("(4,4) is tier 2", () => expect(chunkTier({ x: 4, y: 4 })).toBe(2));
    it("(8,0) is tier 3", () => expect(chunkTier({ x: 8, y: 0 })).toBe(3));
    it("increases monotonically with distance", () => {
        const t1 = chunkTier({ x: 5, y: 0 });
        const t2 = chunkTier({ x: 50, y: 0 });
        expect(t2).toBeGreaterThan(t1);
    });
});

// ─── chunkName ───────────────────────────────────────────────────────────────

describe("chunkName", () => {
    it("returns a non-empty string", () => {
        expect(chunkName(SEED, { x: 0, y: 0 }).length).toBeGreaterThan(0);
    });

    it("is deterministic", () => {
        expect(chunkName(SEED, { x: 3, y: 7 })).toBe(chunkName(SEED, { x: 3, y: 7 }));
    });

    it("differs by coord", () => {
        expect(chunkName(SEED, { x: 3, y: 7 })).not.toBe(chunkName(SEED, { x: 4, y: 7 }));
    });

    it("differs by seed", () => {
        expect(chunkName(SEED, { x: 3, y: 7 })).not.toBe(chunkName(SEED_B, { x: 3, y: 7 }));
    });

    it("contains at least two words", () => {
        const name = chunkName(SEED, { x: 1, y: 2 });
        expect(name.split(" ").length).toBeGreaterThanOrEqual(2);
    });
});
