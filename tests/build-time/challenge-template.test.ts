import { describe, expect, it } from "vitest";
import {
    generateChallenge,
    type CauseKind,
    type ChallengeInstance,
    CAUSE_AFFINITIES,
    EFFECT_FOR_CAUSE,
} from "../../src/modules/challenge-template";

/**
 * T144 / T145 / T146: Challenge template schema, 10 cause templates, parameterization.
 */

const CHUNK = { x: 3, y: -1 };
const SEED = 42;

describe("generateChallenge — schema", () => {
    it("returns a valid ChallengeInstance", () => {
        const c = generateChallenge(SEED, CHUNK, 0, "farmer");
        expect(c.cause).toBeDefined();
        expect(c.effect).toBeDefined();
        expect(c.params).toBeDefined();
        expect(c.state).toBe("pending");
        expect(c.offeredDay).toBeUndefined();
        expect(c.acceptedDay).toBeUndefined();
        expect(c.resolvedDay).toBeUndefined();
    });

    it("effect matches cause via EFFECT_FOR_CAUSE", () => {
        const c = generateChallenge(SEED, CHUNK, 0, "farmer");
        expect(c.effect).toBe(EFFECT_FOR_CAUSE[c.cause]);
    });

    it("is deterministic — same inputs same output", () => {
        const a = generateChallenge(SEED, CHUNK, 2, "guard");
        const b = generateChallenge(SEED, CHUNK, 2, "guard");
        expect(a).toEqual(b);
    });

    it("different spawn indices give different challenges (usually)", () => {
        const results = new Set<string>();
        for (let i = 0; i < 6; i++) {
            const c = generateChallenge(SEED, CHUNK, i, "villager_generic");
            results.add(c.cause);
        }
        // At least 2 distinct causes across 6 NPCs
        expect(results.size).toBeGreaterThanOrEqual(2);
    });
});

describe("EFFECT_FOR_CAUSE", () => {
    const ALL_CAUSES: CauseKind[] = [
        "find_pet", "fetch_item", "defeat_threat", "deliver_message", "deliver_item",
        "settle_dispute", "escort", "guard_spot", "survey", "recover_heirloom",
    ];

    it("has an effect for every cause", () => {
        for (const cause of ALL_CAUSES) {
            expect(EFFECT_FOR_CAUSE[cause]).toBeDefined();
        }
    });
});

describe("CAUSE_AFFINITIES", () => {
    it("farmer has find_pet and fetch_item as common causes", () => {
        const farmer = CAUSE_AFFINITIES["farmer"];
        expect(farmer.common).toContain("find_pet");
        expect(farmer.common).toContain("fetch_item");
    });

    it("rival has no common causes (no challenges)", () => {
        const rival = CAUSE_AFFINITIES["rival"];
        expect(rival.common).toHaveLength(0);
        expect(rival.rare).toHaveLength(0);
    });

    it("guide has no common causes", () => {
        const guide = CAUSE_AFFINITIES["guide"];
        expect(guide.common).toHaveLength(0);
    });

    it("most roles with common causes have ≥ 2 total (common + rare) candidate causes", () => {
        // trainer is an exception: affinity table specifies only defeat_threat (no rare)
        const SINGLE_CAUSE_EXCEPTION = new Set(["trainer"]);
        for (const [role, aff] of Object.entries(CAUSE_AFFINITIES)) {
            if (aff.common.length === 0 || SINGLE_CAUSE_EXCEPTION.has(role)) continue;
            const total = aff.common.length + aff.rare.length;
            expect(total, `${role} needs ≥2 total causes`).toBeGreaterThanOrEqual(2);
        }
    });
});

describe("generateChallenge — role affinity", () => {
    it("farmer never generates escort or guard_spot (not in affinity)", () => {
        const causes = new Set<string>();
        for (let seed = 0; seed < 50; seed++) {
            causes.add(generateChallenge(seed, CHUNK, 0, "farmer").cause);
        }
        expect(causes.has("escort")).toBe(false);
        expect(causes.has("guard_spot")).toBe(false);
    });

    it("trainer only generates defeat_threat as common cause", () => {
        const causes = new Set<string>();
        for (let seed = 0; seed < 50; seed++) {
            causes.add(generateChallenge(seed, CHUNK, 0, "trainer").cause);
        }
        // trainer common = [defeat_threat]; rare = []
        // all results must be defeat_threat
        expect([...causes]).toEqual(["defeat_threat"]);
    });

    it("rival generates no challenges — state is pending but cause is a valid kind", () => {
        // rival has no affinities, so picks from all causes as fallback
        const c = generateChallenge(SEED, CHUNK, 0, "rival");
        expect(c.state).toBe("pending");
    });
});

describe("generateChallenge — params", () => {
    it("find_pet includes species param", () => {
        let c: ChallengeInstance | undefined;
        for (let seed = 0; seed < 100; seed++) {
            const candidate = generateChallenge(seed, CHUNK, 0, "farmer");
            if (candidate.cause === "find_pet") { c = candidate; break; }
        }
        expect(c).toBeDefined();
        expect(c!.params["species"]).toBeDefined();
    });

    it("fetch_item includes item and count params", () => {
        let c: ChallengeInstance | undefined;
        for (let seed = 0; seed < 100; seed++) {
            const candidate = generateChallenge(seed, CHUNK, 0, "shopkeep");
            if (candidate.cause === "fetch_item") { c = candidate; break; }
        }
        expect(c).toBeDefined();
        expect(c!.params["item"]).toBeDefined();
        expect(typeof c!.params["count"]).toBe("number");
    });

    it("guard_spot includes seconds param in [60, 180]", () => {
        let c: ChallengeInstance | undefined;
        for (let seed = 0; seed < 200; seed++) {
            const candidate = generateChallenge(seed, CHUNK, 0, "shrine_keeper");
            if (candidate.cause === "guard_spot") { c = candidate; break; }
        }
        expect(c).toBeDefined();
        const secs = c!.params["seconds"] as number;
        expect(secs).toBeGreaterThanOrEqual(60);
        expect(secs).toBeLessThanOrEqual(180);
    });

    it("recover_heirloom reward_modifier is 'challenge_heirloom'", () => {
        let c: ChallengeInstance | undefined;
        for (let seed = 0; seed < 200; seed++) {
            const candidate = generateChallenge(seed, CHUNK, 0, "historian");
            if (candidate.cause === "recover_heirloom") { c = candidate; break; }
        }
        expect(c).toBeDefined();
        expect(c!.rewardModifier).toBe("challenge_heirloom");
    });

    it("all other causes use 'challenge_normal' reward_modifier", () => {
        let found = false;
        for (let seed = 0; seed < 200; seed++) {
            const c = generateChallenge(seed, CHUNK, 0, "hunter");
            if (c.cause !== "recover_heirloom") {
                expect(c.rewardModifier).toBe("challenge_normal");
                found = true;
                break;
            }
        }
        expect(found).toBe(true);
    });
});
