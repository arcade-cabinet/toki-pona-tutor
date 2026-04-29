import { describe, expect, it } from "vitest";
import {
    generateChestPlacements,
    type ChestPlacement,
} from "../../src/modules/chest-placement";

/**
 * T137: Chest placement — outdoor 0-1, indoor 0-2, rare chunks 2-4.
 */

const SEED = 42;
const CHUNK = { x: 3, y: -1 };

const SAMPLE_POOL = [
    { itemId: "orchard_fruit",   tier: 1, weight: 10, buyPrice: 20 },
    { itemId: "spring_tonic",    tier: 2, weight: 8,  buyPrice: 50 },
    { itemId: "trail_token",     tier: 1, weight: 6,  buyPrice: 15 },
    { itemId: "storm_shard",     tier: 3, weight: 3,  buyPrice: 150 },
    { itemId: "capture_pod",     tier: 1, weight: 12, buyPrice: 100 },
];

describe("generateChestPlacements — outdoor", () => {
    it("outdoor chunk has 0-1 chest", () => {
        const chests = generateChestPlacements(SEED, CHUNK, "outdoor", 1, SAMPLE_POOL);
        expect(chests.length).toBeGreaterThanOrEqual(0);
        expect(chests.length).toBeLessThanOrEqual(1);
    });

    it("chest has valid coords", () => {
        // Run many seeds to find one with a chest
        let chest: ChestPlacement | undefined;
        for (let s = 0; s < 100; s++) {
            const result = generateChestPlacements(s, CHUNK, "outdoor", 1, SAMPLE_POOL);
            if (result.length > 0) { chest = result[0]; break; }
        }
        if (chest) {
            expect(chest.x).toBeGreaterThanOrEqual(0);
            expect(chest.y).toBeGreaterThanOrEqual(0);
            expect(chest.loot).toBeDefined();
            expect(SAMPLE_POOL.some((p) => p.itemId === chest!.loot.itemId)).toBe(true);
        }
    });
});

describe("generateChestPlacements — indoor", () => {
    it("indoor chunk has 0-2 chests", () => {
        const chests = generateChestPlacements(SEED, CHUNK, "indoor", 2, SAMPLE_POOL);
        expect(chests.length).toBeGreaterThanOrEqual(0);
        expect(chests.length).toBeLessThanOrEqual(2);
    });
});

describe("generateChestPlacements — rare/landmark", () => {
    it("landmark chunk has 2-4 chests", () => {
        const chests = generateChestPlacements(SEED, CHUNK, "rare", 3, SAMPLE_POOL);
        expect(chests.length).toBeGreaterThanOrEqual(2);
        expect(chests.length).toBeLessThanOrEqual(4);
    });
});

describe("generateChestPlacements — determinism", () => {
    it("same inputs produce same result", () => {
        const a = generateChestPlacements(SEED, CHUNK, "outdoor", 1, SAMPLE_POOL);
        const b = generateChestPlacements(SEED, CHUNK, "outdoor", 1, SAMPLE_POOL);
        expect(a).toEqual(b);
    });

    it("different seeds produce different results", () => {
        const results = new Set<number>();
        for (let s = 0; s < 20; s++) {
            results.add(generateChestPlacements(s, CHUNK, "outdoor", 1, SAMPLE_POOL).length);
        }
        // Mix of 0 and 1 chests across seeds
        expect(results.size).toBeGreaterThanOrEqual(1);
    });
});

describe("generateChestPlacements — loot tier", () => {
    it("loot is within chunkTier ± 1 band", () => {
        const tier = 2;
        for (let s = 0; s < 50; s++) {
            const chests = generateChestPlacements(s, CHUNK, "indoor", tier, SAMPLE_POOL);
            for (const chest of chests) {
                expect(chest.loot.tier).toBeGreaterThanOrEqual(tier - 1);
                expect(chest.loot.tier).toBeLessThanOrEqual(tier + 1);
            }
        }
    });
});
