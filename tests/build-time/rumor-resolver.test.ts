import { describe, expect, it } from "vitest";
import {
    compassDirection,
    distanceHint,
    expireRumors,
    type Rumor,
} from "../../src/modules/rumor-resolver";

/**
 * T143: Rumor resolver — direction + distance + expiry logic.
 */

describe("compassDirection", () => {
    it("returns 'east' for a chunk directly east", () => {
        expect(compassDirection({ x: 0, y: 0 }, { x: 5, y: 0 })).toBe("east");
    });

    it("returns 'west' for a chunk directly west", () => {
        expect(compassDirection({ x: 0, y: 0 }, { x: -3, y: 0 })).toBe("west");
    });

    it("returns 'north' for a chunk directly north", () => {
        // Positive y = north in chunk grid convention
        expect(compassDirection({ x: 0, y: 0 }, { x: 0, y: 5 })).toBe("north");
    });

    it("returns 'south' for a chunk directly south", () => {
        expect(compassDirection({ x: 0, y: 0 }, { x: 0, y: -5 })).toBe("south");
    });

    it("returns 'northeast' for a chunk northeast", () => {
        expect(compassDirection({ x: 0, y: 0 }, { x: 3, y: 3 })).toBe("northeast");
    });

    it("returns 'southwest' for a chunk southwest", () => {
        expect(compassDirection({ x: 0, y: 0 }, { x: -3, y: -3 })).toBe("southwest");
    });
});

describe("distanceHint", () => {
    it("returns 'close' for chebyshev distance 1-3", () => {
        expect(distanceHint(1)).toBe("close");
        expect(distanceHint(3)).toBe("close");
    });

    it("returns 'far' for chebyshev distance 4-8", () => {
        expect(distanceHint(4)).toBe("far");
        expect(distanceHint(8)).toBe("far");
    });

    it("returns 'days_away' for chebyshev distance >8", () => {
        expect(distanceHint(9)).toBe("days_away");
        expect(distanceHint(20)).toBe("days_away");
    });
});

describe("expireRumors", () => {
    const makeRumor = (expiresDay: number): Rumor => ({
        templateId: "test_001",
        targetChunk: { x: 1, y: 1 },
        direction: "north",
        distanceHint: "close",
        issuedDay: 0,
        expiresDay,
    });

    it("removes rumors past their expiry", () => {
        const rumors = [makeRumor(5), makeRumor(10)];
        const result = expireRumors(rumors, 7);
        expect(result).toHaveLength(1);
        expect(result[0]!.expiresDay).toBe(10);
    });

    it("keeps all rumors when none have expired", () => {
        const rumors = [makeRumor(10), makeRumor(20)];
        expect(expireRumors(rumors, 5)).toHaveLength(2);
    });

    it("removes all rumors when all expired", () => {
        const rumors = [makeRumor(1), makeRumor(2)];
        expect(expireRumors(rumors, 10)).toHaveLength(0);
    });

    it("returns empty for empty input", () => {
        expect(expireRumors([], 0)).toHaveLength(0);
    });
});
