import { describe, expect, it } from "vitest";
import {
    assignNpcDialog,
    pickLine,
    levelBandForPlayerLevel,
    type DialogLine,
    type Role,
} from "../../src/modules/dialog-pool";

/**
 * T138/T141: Dialog pool schema + NPC subset selection.
 */

const band0Line = (id: string): DialogLine => ({
    id,
    role: "shopkeep",
    context: "greeting",
    mood: "warm",
    levelBand: 0,
    text: "Hello there.",
});

const band1Line = (id: string): DialogLine => ({
    id,
    role: "shopkeep",
    context: "greeting",
    mood: "calm",
    levelBand: 1,
    text: "You look like you know your way around.",
});

const band2Line = (id: string): DialogLine => ({
    id,
    role: "shopkeep",
    context: "greeting",
    mood: "calm",
    levelBand: 2,
    text: "A seasoned traveler. I respect that.",
});

// ─── levelBandForPlayerLevel ──────────────────────────────────────────────────

describe("levelBandForPlayerLevel", () => {
    it("band 0 for levels 1-10", () => {
        expect(levelBandForPlayerLevel(1)).toBe(0);
        expect(levelBandForPlayerLevel(10)).toBe(0);
    });

    it("band 1 for levels 11-25", () => {
        expect(levelBandForPlayerLevel(11)).toBe(1);
        expect(levelBandForPlayerLevel(25)).toBe(1);
    });

    it("band 2 for levels 26-45", () => {
        expect(levelBandForPlayerLevel(26)).toBe(2);
        expect(levelBandForPlayerLevel(45)).toBe(2);
    });

    it("band 3 for levels 46-99", () => {
        expect(levelBandForPlayerLevel(46)).toBe(3);
        expect(levelBandForPlayerLevel(99)).toBe(3);
    });
});

// ─── assignNpcDialog ──────────────────────────────────────────────────────────

const makePool = (role: Role): DialogLine[] => {
    const lines: DialogLine[] = [];
    for (let b = 0; b <= 3; b++) {
        for (let i = 0; i < 10; i++) {
            lines.push({
                id: `${role}_greeting_warm_band${b}_${String(i).padStart(3, "0")}`,
                role,
                context: "greeting",
                mood: "warm",
                levelBand: b as 0 | 1 | 2 | 3,
                text: `Greeting band ${b} line ${i}.`,
            });
            lines.push({
                id: `${role}_ambient_calm_band${b}_${String(i).padStart(3, "0")}`,
                role,
                context: "ambient",
                mood: "calm",
                levelBand: b as 0 | 1 | 2 | 3,
                text: `Ambient band ${b} line ${i}.`,
            });
        }
    }
    return lines;
};

describe("assignNpcDialog", () => {
    const pool = makePool("shopkeep");

    it("returns a NpcDialogProfile with all context arrays", () => {
        const profile = assignNpcDialog(42, { x: 0, y: 0 }, 0, "shopkeep", pool);
        expect(Array.isArray(profile.greetings)).toBe(true);
        expect(Array.isArray(profile.ambients)).toBe(true);
        expect(Array.isArray(profile.rumors)).toBe(true);
        expect(Array.isArray(profile.challengeOffers)).toBe(true);
        expect(Array.isArray(profile.challengeThanks)).toBe(true);
        expect(Array.isArray(profile.idleAfterResolve)).toBe(true);
    });

    it("is deterministic — same inputs give same profile", () => {
        const a = assignNpcDialog(42, { x: 3, y: -1 }, 2, "shopkeep", pool);
        const b = assignNpcDialog(42, { x: 3, y: -1 }, 2, "shopkeep", pool);
        expect(a.greetings.map((l) => l.id)).toEqual(b.greetings.map((l) => l.id));
    });

    it("different spawn indices yield different profiles", () => {
        const a = assignNpcDialog(42, { x: 0, y: 0 }, 0, "shopkeep", pool);
        const b = assignNpcDialog(42, { x: 0, y: 0 }, 1, "shopkeep", pool);
        // Not guaranteed to differ on every line, but greetings should differ
        const aIds = a.greetings.map((l) => l.id).join(",");
        const bIds = b.greetings.map((l) => l.id).join(",");
        expect(aIds).not.toBe(bIds);
    });

    it("greetings picks at most 3 lines", () => {
        const profile = assignNpcDialog(1, { x: 0, y: 0 }, 0, "shopkeep", pool);
        expect(profile.greetings.length).toBeLessThanOrEqual(3);
    });

    it("ambients picks at most 5 lines", () => {
        const profile = assignNpcDialog(1, { x: 0, y: 0 }, 0, "shopkeep", pool);
        expect(profile.ambients.length).toBeLessThanOrEqual(5);
    });
});

// ─── pickLine ─────────────────────────────────────────────────────────────────

describe("pickLine", () => {
    it("returns a line from the correct band", () => {
        const profile = assignNpcDialog(42, { x: 0, y: 0 }, 0, "shopkeep", makePool("shopkeep"));
        const line = pickLine(profile, "greeting", 5); // band 0
        expect(line).not.toBeNull();
        expect(line!.context).toBe("greeting");
    });

    it("falls back to a lower band when the current band has no lines", () => {
        // Profile only has band 0 greetings
        const sparsePool: DialogLine[] = [band0Line("g0"), band0Line("g1")];
        const profile = assignNpcDialog(42, { x: 0, y: 0 }, 0, "shopkeep", sparsePool);
        // Player at level 30 = band 2, but profile only has band 0
        const line = pickLine(profile, "greeting", 30);
        expect(line).not.toBeNull();
        expect(line!.levelBand).toBe(0);
    });

    it("returns null when no lines available for any band", () => {
        const profile = assignNpcDialog(42, { x: 0, y: 0 }, 0, "shopkeep", []);
        const line = pickLine(profile, "greeting", 5);
        expect(line).toBeNull();
    });

    it("higher player level prefers higher band lines when available", () => {
        const pool = [band0Line("g0"), band1Line("g1"), band2Line("g2")];
        const profile = assignNpcDialog(42, { x: 0, y: 0 }, 0, "shopkeep", pool);
        const line = pickLine(profile, "greeting", 30); // band 2
        expect(line).not.toBeNull();
    });
});
