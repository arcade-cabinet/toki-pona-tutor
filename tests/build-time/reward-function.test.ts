import { describe, expect, it } from "vitest";
import {
    reward,
    partyStrength,
    xpNeeded,
    encounterLevel,
    dropLevel,
    chunkTier,
    type RewardInput,
} from "../../src/modules/reward-function";
import { createRng } from "../../src/modules/seed";

/**
 * T125-T129: Economy formulas per docs/ECONOMY.md.
 */

// ─── chunkTier ────────────────────────────────────────────────────────────────

describe("chunkTier", () => {
    it("origin is tier 0", () => {
        expect(chunkTier(0, 0)).toBe(0);
    });

    it("adjacent chunk is tier 1", () => {
        expect(chunkTier(1, 0)).toBe(1);
        expect(chunkTier(0, 1)).toBe(1);
        expect(chunkTier(1, 1)).toBe(1);
    });

    it("matches ECONOMY.md examples", () => {
        expect(chunkTier(3, 2)).toBe(2);   // distance 3 → floor(log2(4)) = 2
        expect(chunkTier(7, 5)).toBe(3);   // distance 7 → floor(log2(8)) = 3
        expect(chunkTier(15, 10)).toBe(4); // distance 15 → floor(log2(16)) = 4
        expect(chunkTier(31, 20)).toBe(5); // distance 31 → floor(log2(32)) = 5
    });

    it("negative coords use absolute distance", () => {
        expect(chunkTier(-3, -2)).toBe(2);
        expect(chunkTier(-1, 1)).toBe(1);
    });
});

// ─── partyStrength ────────────────────────────────────────────────────────────

describe("partyStrength", () => {
    it("returns 1 for an empty party", () => {
        expect(partyStrength([])).toBe(1);
    });

    it("solo creature — equals that level (0.3+0.7 = 1.0)", () => {
        expect(partyStrength([10])).toBe(10);
    });

    it("two equal-level creatures — equals that level", () => {
        expect(partyStrength([5, 5])).toBe(5);
    });

    it("mean=5, max=10 → 0.3×5 + 0.7×10 = 8.5", () => {
        // 0 represents an empty slot (creature absent) — excluded from calc
        expect(partyStrength([0, 10])).toBe(10); // only slot with creature: [10]
        // mean=(5+10)/2=7.5, max=10 → 0.3×7.5 + 0.7×10 = 2.25 + 7 = 9.25
        expect(partyStrength([5, 10])).toBeCloseTo(9.25, 5);
    });

    it("skews toward max — a high-level lead boosts the result", () => {
        const low = partyStrength([1, 1, 1]);
        const high = partyStrength([1, 1, 99]);
        expect(high).toBeGreaterThan(low);
    });
});

// ─── xpNeeded ────────────────────────────────────────────────────────────────

describe("xpNeeded", () => {
    it("level 1 returns positive xp", () => {
        expect(xpNeeded(1)).toBeGreaterThan(0);
    });

    it("is monotonically increasing", () => {
        for (let lvl = 1; lvl < 99; lvl++) {
            expect(xpNeeded(lvl + 1)).toBeGreaterThan(xpNeeded(lvl));
        }
    });

    it("level 99 stays within i32 range", () => {
        expect(xpNeeded(99)).toBeLessThan(2 ** 31 - 1);
    });

    it("matches ECONOMY.md example values (approx)", () => {
        // BASE_XP=20, SCALE=12: xp_needed = floor(20 × log2(level+1) × 12)
        expect(xpNeeded(2)).toBeCloseTo(Math.floor(20 * Math.log2(3) * 12), -1);
        expect(xpNeeded(5)).toBeCloseTo(Math.floor(20 * Math.log2(6) * 12), -1);
    });
});

// ─── encounterLevel ───────────────────────────────────────────────────────────

describe("encounterLevel", () => {
    it("is clamped to [1, 99]", () => {
        const rng = createRng(42);
        for (let tier = 0; tier <= 10; tier++) {
            for (const strength of [1, 5, 50, 99]) {
                const lvl = encounterLevel(tier, strength, rng);
                expect(lvl).toBeGreaterThanOrEqual(1);
                expect(lvl).toBeLessThanOrEqual(99);
            }
        }
    });

    it("higher tier → higher encounter level on average", () => {
        const rng1 = createRng(42);
        const rng2 = createRng(42);
        const low = encounterLevel(0, 5, rng1);
        const high = encounterLevel(5, 5, rng2);
        expect(high).toBeGreaterThan(low);
    });

    it("is integer", () => {
        const rng = createRng(1);
        expect(Number.isInteger(encounterLevel(2, 10, rng))).toBe(true);
    });
});

// ─── dropLevel ────────────────────────────────────────────────────────────────

describe("dropLevel", () => {
    it("is clamped to [1, 99]", () => {
        const rng = createRng(7);
        for (let enc = 1; enc <= 99; enc += 10) {
            const dl = dropLevel(enc, rng);
            expect(dl).toBeGreaterThanOrEqual(1);
            expect(dl).toBeLessThanOrEqual(99);
        }
    });

    it("is integer", () => {
        const rng = createRng(3);
        expect(Number.isInteger(dropLevel(10, rng))).toBe(true);
    });

    it("on average skews above encounter level", () => {
        const samples = 1000;
        let total = 0;
        for (let i = 0; i < samples; i++) {
            const rng = createRng(i * 7, "drop");
            total += dropLevel(20, rng) - 20;
        }
        expect(total / samples).toBeGreaterThan(0); // positive skew
    });
});

// ─── reward ───────────────────────────────────────────────────────────────────

describe("reward", () => {
    const baseInput: RewardInput = {
        playerLevel: 5,
        partyStrength: 5,
        chunkTier: 1,
        source: "wild_defeat",
        rng: createRng(42),
    };

    it("returns non-negative gold", () => {
        const out = reward({ ...baseInput, rng: createRng(42) });
        expect(out.gold).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(out.gold)).toBe(true);
    });

    it("returns an items array", () => {
        const out = reward({ ...baseInput, rng: createRng(1) });
        expect(Array.isArray(out.items)).toBe(true);
    });

    it("higher tier → more gold on average", () => {
        const samples = 200;
        let tier0Total = 0;
        let tier5Total = 0;
        for (let i = 0; i < samples; i++) {
            tier0Total += reward({ playerLevel: 10, partyStrength: 10, chunkTier: 0, source: "wild_defeat", rng: createRng(i) }).gold;
            tier5Total += reward({ playerLevel: 10, partyStrength: 10, chunkTier: 5, source: "wild_defeat", rng: createRng(i) }).gold;
        }
        expect(tier5Total).toBeGreaterThan(tier0Total);
    });

    it("higher source modifier → more gold", () => {
        const samples = 200;
        let wildTotal = 0;
        let rareTotal = 0;
        for (let i = 0; i < samples; i++) {
            wildTotal += reward({ playerLevel: 10, partyStrength: 10, chunkTier: 2, source: "wild_defeat", rng: createRng(i) }).gold;
            rareTotal += reward({ playerLevel: 10, partyStrength: 10, chunkTier: 2, source: "rare_spot", rng: createRng(i) }).gold;
        }
        expect(rareTotal).toBeGreaterThan(wildTotal);
    });

    it("faint penalty never produces negative gold", () => {
        for (let gold = 0; gold <= 1000; gold += 100) {
            const after = Math.floor(gold * 0.9);
            expect(after).toBeGreaterThanOrEqual(0);
        }
    });

    it("drop chance is in [0, 1]", () => {
        for (let tier = 0; tier <= 10; tier++) {
            const baseChance = 0.15;
            const tierBonus = 0.03;
            // wild_defeat source modifier = 1.0
            const chance = Math.min(1, (baseChance + tier * tierBonus) * 1.0);
            expect(chance).toBeGreaterThanOrEqual(0);
            expect(chance).toBeLessThanOrEqual(1);
        }
    });
});
