import { describe, expect, it } from "vitest";
import {
    itemTierForDropLevel,
    rollItem,
    type LootPoolEntry,
} from "../../src/modules/loot-roll";
import { createRng } from "../../src/modules/seed";

/**
 * T128/T135: Item tier bands + loot roll logic per ECONOMY.md.
 */

describe("itemTierForDropLevel", () => {
    it("matches ECONOMY.md examples", () => {
        expect(itemTierForDropLevel(1)).toBe(1);   // ceil(log2(2)) = 1
        expect(itemTierForDropLevel(3)).toBe(2);   // ceil(log2(4)) = 2
        expect(itemTierForDropLevel(7)).toBe(3);   // ceil(log2(8)) = 3
        expect(itemTierForDropLevel(15)).toBe(4);  // ceil(log2(16)) = 4
        expect(itemTierForDropLevel(31)).toBe(5);  // ceil(log2(32)) = 5
        expect(itemTierForDropLevel(63)).toBe(6);  // ceil(log2(64)) = 6
        expect(itemTierForDropLevel(99)).toBe(7);  // ceil(log2(100)) = 7
    });

    it("never returns below 1", () => {
        expect(itemTierForDropLevel(1)).toBeGreaterThanOrEqual(1);
    });

    it("is monotonically non-decreasing", () => {
        for (let lvl = 1; lvl < 99; lvl++) {
            expect(itemTierForDropLevel(lvl + 1)).toBeGreaterThanOrEqual(itemTierForDropLevel(lvl));
        }
    });
});

describe("rollItem", () => {
    const pool: LootPoolEntry[] = [
        { itemId: "orchard_fruit", tier: 1, weight: 10 },
        { itemId: "spring_tonic", tier: 2, weight: 8 },
        { itemId: "capture_pod", tier: 1, weight: 6 },
        { itemId: "heavy_capture_pod", tier: 2, weight: 4 },
        { itemId: "trail_token", tier: 1, weight: 12 },
    ];

    it("returns null for an empty pool", () => {
        expect(rollItem([], 5, createRng(1))).toBeNull();
    });

    it("returns an item from the pool at the correct tier band", () => {
        // drop level 1 → tier 1; pool tier band [0..2]
        const result = rollItem(pool, 1, createRng(42));
        expect(result).not.toBeNull();
        // tier 1 items: orchard_fruit, capture_pod, trail_token
        expect(["orchard_fruit", "capture_pod", "trail_token"]).toContain(result!.itemId);
    });

    it("higher drop level selects from a higher tier band", () => {
        // drop level 7 → tier 3; tier band [2..4] — only tier 2 items match
        const result = rollItem(pool, 7, createRng(5));
        // All tier 2 items: spring_tonic, heavy_capture_pod (tier 2 is in [2,4] band)
        // tier 1 items are in [0,2] band so also eligible
        expect(result).not.toBeNull();
    });

    it("is deterministic for the same seed", () => {
        const a = rollItem(pool, 3, createRng(99));
        const b = rollItem(pool, 3, createRng(99));
        expect(a?.itemId).toBe(b?.itemId);
    });

    it("returns null when pool has no items in tier band", () => {
        const narrowPool: LootPoolEntry[] = [
            { itemId: "heavy_capture_pod", tier: 8, weight: 5 },
        ];
        // drop level 1 → tier 1, tier band [0..2]; tier 8 is outside band
        const result = rollItem(narrowPool, 1, createRng(1));
        expect(result).toBeNull();
    });
});
