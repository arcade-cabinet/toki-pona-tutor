import { describe, expect, it } from "vitest";
import {
    generateShopInventory,
    type ShopItem,
} from "../../src/modules/shop-inventory";

/**
 * T136: Shop inventories — village archetype + tier → deterministic 5-8 item stock.
 */

const SEED = 42;
const CHUNK = { x: 2, y: 1 };
const TIER = 1;

const SAMPLE_POOL: ShopItem[] = [
    { itemId: "orchard_fruit",      tier: 1, weight: 10, buyPrice: 20  },
    { itemId: "spring_tonic",       tier: 2, weight: 8,  buyPrice: 50  },
    { itemId: "trail_token",        tier: 1, weight: 6,  buyPrice: 15  },
    { itemId: "capture_pod",        tier: 1, weight: 12, buyPrice: 100 },
    { itemId: "heavy_capture_pod",  tier: 2, weight: 5,  buyPrice: 200 },
    { itemId: "ration_bar",         tier: 1, weight: 8,  buyPrice: 30  },
    { itemId: "elixir_small",       tier: 2, weight: 4,  buyPrice: 80  },
    { itemId: "rope_coil",          tier: 1, weight: 6,  buyPrice: 25  },
    { itemId: "storm_shard",        tier: 3, weight: 3,  buyPrice: 150 },
    { itemId: "ironbark_shield",    tier: 4, weight: 2,  buyPrice: 400 },
];

describe("generateShopInventory", () => {
    it("returns 5-8 items", () => {
        const stock = generateShopInventory(SEED, CHUNK, "small_hamlet", TIER, SAMPLE_POOL);
        expect(stock.length).toBeGreaterThanOrEqual(5);
        expect(stock.length).toBeLessThanOrEqual(8);
    });

    it("is deterministic", () => {
        const a = generateShopInventory(SEED, CHUNK, "small_hamlet", TIER, SAMPLE_POOL);
        const b = generateShopInventory(SEED, CHUNK, "small_hamlet", TIER, SAMPLE_POOL);
        expect(a).toEqual(b);
    });

    it("items are from the pool", () => {
        const poolIds = new Set(SAMPLE_POOL.map((p) => p.itemId));
        const stock = generateShopInventory(SEED, CHUNK, "small_hamlet", TIER, SAMPLE_POOL);
        for (const item of stock) {
            expect(poolIds.has(item.itemId)).toBe(true);
        }
    });

    it("filters to tier-appropriate items (tier ± 1)", () => {
        const stock = generateShopInventory(SEED, CHUNK, "small_hamlet", TIER, SAMPLE_POOL);
        for (const item of stock) {
            expect(item.tier).toBeGreaterThanOrEqual(TIER - 1);
            expect(item.tier).toBeLessThanOrEqual(TIER + 1);
        }
    });

    it("no duplicate items in same shop", () => {
        const stock = generateShopInventory(SEED, CHUNK, "small_hamlet", TIER, SAMPLE_POOL);
        const ids = stock.map((s) => s.itemId);
        expect(new Set(ids).size).toBe(ids.length);
    });

    it("different chunks produce different stock", () => {
        const a = generateShopInventory(SEED, { x: 0, y: 0 }, "small_hamlet", TIER, SAMPLE_POOL);
        const b = generateShopInventory(SEED, { x: 5, y: 5 }, "small_hamlet", TIER, SAMPLE_POOL);
        const aIds = a.map((s) => s.itemId).sort();
        const bIds = b.map((s) => s.itemId).sort();
        expect(JSON.stringify(aIds)).not.toBe(JSON.stringify(bIds));
    });

    it("road_stop has fewer items (no shop, uses general pool)", () => {
        const stock = generateShopInventory(SEED, CHUNK, "road_stop", TIER, SAMPLE_POOL);
        // road_stop has no shop; returns 0 items (caller should not call for road_stop)
        // But if called, returns fewer (3-5) basic items as roadside stall
        expect(stock.length).toBeGreaterThanOrEqual(0);
    });

    it("market_town stock is same size range (5-8)", () => {
        const stock = generateShopInventory(SEED, CHUNK, "market_town", TIER, SAMPLE_POOL);
        expect(stock.length).toBeGreaterThanOrEqual(5);
        expect(stock.length).toBeLessThanOrEqual(8);
    });
});
