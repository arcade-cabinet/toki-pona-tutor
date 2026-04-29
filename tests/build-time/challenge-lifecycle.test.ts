import { describe, expect, it } from "vitest";
import {
    offerChallenge,
    acceptChallenge,
    declineChallenge,
    resolveChallenge,
    degradeChallenge,
    isExpired,
    DEGRADE_DAYS,
} from "../../src/modules/challenge-lifecycle";
import type { ChallengeInstance } from "../../src/modules/challenge-template";

/**
 * T147/T148/T149: Challenge lifecycle state transitions.
 */

function makeChallenge(): ChallengeInstance {
    return {
        cause: "find_pet",
        effect: "catch_species",
        params: { species: "applepup", biome_feature: "pond" },
        rewardModifier: "challenge_normal",
        state: "pending",
    };
}

describe("offerChallenge", () => {
    it("pending → offered on first NPC interaction", () => {
        const c = makeChallenge();
        const c2 = offerChallenge(c, 5);
        expect(c2.state).toBe("offered");
        expect(c2.offeredDay).toBe(5);
    });

    it("offered → offered (idempotent re-offer)", () => {
        const c = { ...makeChallenge(), state: "offered" as const, offeredDay: 3 };
        const c2 = offerChallenge(c, 7);
        expect(c2.state).toBe("offered");
        expect(c2.offeredDay).toBe(3); // first offer day preserved
    });

    it("declined → offered on next NPC interaction", () => {
        const c = { ...makeChallenge(), state: "declined" as const };
        const c2 = offerChallenge(c, 10);
        expect(c2.state).toBe("offered");
    });
});

describe("acceptChallenge", () => {
    it("offered → accepted", () => {
        const c = { ...makeChallenge(), state: "offered" as const, offeredDay: 1 };
        const c2 = acceptChallenge(c, 2);
        expect(c2.state).toBe("accepted");
        expect(c2.acceptedDay).toBe(2);
    });

    it("throws if not in offered state", () => {
        const c = makeChallenge(); // pending
        expect(() => acceptChallenge(c, 1)).toThrow();
    });
});

describe("declineChallenge", () => {
    it("offered → declined", () => {
        const c = { ...makeChallenge(), state: "offered" as const };
        const c2 = declineChallenge(c);
        expect(c2.state).toBe("declined");
    });

    it("throws if not in offered state", () => {
        const c = makeChallenge(); // pending
        expect(() => declineChallenge(c)).toThrow();
    });
});

describe("resolveChallenge", () => {
    it("accepted → resolved", () => {
        const c = { ...makeChallenge(), state: "accepted" as const, offeredDay: 1, acceptedDay: 2 };
        const c2 = resolveChallenge(c, 5);
        expect(c2.state).toBe("resolved");
        expect(c2.resolvedDay).toBe(5);
    });

    it("throws if not in accepted state", () => {
        const c = makeChallenge();
        expect(() => resolveChallenge(c, 5)).toThrow();
    });
});

describe("degradeChallenge", () => {
    it("resolved → degraded after DEGRADE_DAYS", () => {
        const c = { ...makeChallenge(), state: "resolved" as const, offeredDay: 1, acceptedDay: 2, resolvedDay: 5 };
        const c2 = degradeChallenge(c, 5 + DEGRADE_DAYS + 1);
        expect(c2.state).toBe("degraded");
    });

    it("stays resolved before DEGRADE_DAYS", () => {
        const c = { ...makeChallenge(), state: "resolved" as const, offeredDay: 1, acceptedDay: 2, resolvedDay: 5 };
        const c2 = degradeChallenge(c, 5 + DEGRADE_DAYS - 1);
        expect(c2.state).toBe("resolved");
    });
});

describe("isExpired", () => {
    it("accepted challenge with no progress expires after 50 days", () => {
        const c = {
            ...makeChallenge(),
            state: "accepted" as const,
            offeredDay: 1,
            acceptedDay: 2,
        };
        expect(isExpired(c, 52)).toBe(true);
        expect(isExpired(c, 51)).toBe(false);
    });

    it("non-accepted challenges don't expire", () => {
        const c = { ...makeChallenge(), state: "offered" as const, offeredDay: 1 };
        expect(isExpired(c, 1000)).toBe(false);
    });
});
