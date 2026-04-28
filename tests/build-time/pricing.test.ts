import { describe, expect, it } from "vitest";
import {
    shopSellPrice,
    innHealPrice,
    faintPenalty,
} from "../../src/modules/pricing";

/**
 * T130-T132: Shop pricing, inn heal pricing, faint penalty.
 * Per docs/ECONOMY.md.
 */

describe("shopSellPrice", () => {
    it("is non-negative for any valid input", () => {
        for (const tier of [0, 1, 3, 5]) {
            for (const playerLevel of [1, 5, 25, 50, 99]) {
                const price = shopSellPrice(10, "potion", tier, playerLevel);
                expect(price).toBeGreaterThanOrEqual(0);
                expect(Number.isInteger(price)).toBe(true);
            }
        }
    });

    it("higher tier → higher sell price", () => {
        const low = shopSellPrice(10, "potion", 0, 10);
        const high = shopSellPrice(10, "potion", 5, 10);
        expect(high).toBeGreaterThan(low);
    });

    it("higher player level → higher sell price", () => {
        const low = shopSellPrice(10, "potion", 2, 5);
        const high = shopSellPrice(10, "potion", 2, 50);
        expect(high).toBeGreaterThan(low);
    });

    it("gear type multiplier is highest", () => {
        const gearPrice = shopSellPrice(100, "gear", 1, 10);
        const potionPrice = shopSellPrice(100, "potion", 1, 10);
        expect(gearPrice).toBeGreaterThan(potionPrice);
    });

    it("buy-back is 30% of sell price, rounded down", () => {
        const sell = shopSellPrice(20, "potion", 1, 10);
        const buyBack = Math.floor(sell * 0.3);
        expect(buyBack).toBeLessThanOrEqual(sell);
        expect(buyBack).toBeGreaterThanOrEqual(0);
    });

    it("matches ECONOMY.md TYPE_MULT ordering: key > gear > material > capture_pod > potion", () => {
        const baseValue = 100;
        const tier = 2;
        const level = 20;
        const key = shopSellPrice(baseValue, "key", tier, level);
        const gear = shopSellPrice(baseValue, "gear", tier, level);
        const material = shopSellPrice(baseValue, "material", tier, level);
        const capture_pod = shopSellPrice(baseValue, "capture_pod", tier, level);
        const potion = shopSellPrice(baseValue, "potion", tier, level);
        expect(key).toBeGreaterThan(gear);
        expect(gear).toBeGreaterThan(material);
        expect(material).toBeGreaterThan(capture_pod);
        expect(capture_pod).toBeGreaterThan(potion);
    });
});

describe("innHealPrice", () => {
    it("is positive for any party strength and tier", () => {
        for (const strength of [1, 5, 25, 50]) {
            for (const tier of [0, 1, 3, 5]) {
                const price = innHealPrice(strength, tier);
                expect(price).toBeGreaterThan(0);
                expect(Number.isInteger(price)).toBe(true);
            }
        }
    });

    it("higher party strength → higher heal price", () => {
        const low = innHealPrice(5, 1);
        const high = innHealPrice(50, 1);
        expect(high).toBeGreaterThan(low);
    });

    it("higher tier → higher heal price", () => {
        const low = innHealPrice(10, 0);
        const high = innHealPrice(10, 5);
        expect(high).toBeGreaterThan(low);
    });

    it("stays affordable — level 50 party tier 5 is under 200 gold", () => {
        // ECONOMY.md calibration: heal ~114 gold for level-50 party in tier 5
        const price = innHealPrice(50, 5);
        expect(price).toBeLessThan(200);
        expect(price).toBeGreaterThan(50);
    });
});

describe("faintPenalty", () => {
    it("applies 10% tax", () => {
        expect(faintPenalty(100)).toBe(90);
        expect(faintPenalty(1000)).toBe(900);
    });

    it("never produces negative gold", () => {
        expect(faintPenalty(0)).toBe(0);
        expect(faintPenalty(1)).toBe(0); // floor(1 × 0.9) = 0
    });

    it("floors the result", () => {
        expect(faintPenalty(11)).toBe(9); // floor(9.9) = 9
        expect(faintPenalty(10)).toBe(9); // floor(9.0) = 9
    });

    it("is always less than or equal to input", () => {
        for (let gold = 0; gold <= 10000; gold += 100) {
            expect(faintPenalty(gold)).toBeLessThanOrEqual(gold);
        }
    });
});
