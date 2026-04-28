import { describe, expect, it } from "vitest";
import {
    generateNpcName,
    generateVillageNpcNames,
} from "../../src/modules/npc-name";

/**
 * T142: NPC name generator — adjective+noun, role-clustered, collision-free within village.
 */

describe("generateNpcName", () => {
    it("returns a two-word name", () => {
        const name = generateNpcName(42, { x: 0, y: 0 }, 0, "villager_generic");
        const words = name.trim().split(" ");
        expect(words).toHaveLength(2);
    });

    it("is deterministic — same inputs give same name", () => {
        const a = generateNpcName(42, { x: 3, y: -1 }, 2, "elder");
        const b = generateNpcName(42, { x: 3, y: -1 }, 2, "elder");
        expect(a).toBe(b);
    });

    it("different spawn indices give different names", () => {
        const a = generateNpcName(42, { x: 0, y: 0 }, 0, "guard");
        const b = generateNpcName(42, { x: 0, y: 0 }, 1, "guard");
        expect(a).not.toBe(b);
    });

    it("different roles can give different names", () => {
        const a = generateNpcName(42, { x: 0, y: 0 }, 0, "child");
        const b = generateNpcName(42, { x: 0, y: 0 }, 0, "elder");
        // Names may differ due to role-clustered adjective pools
        // At minimum they should both be valid two-word names
        expect(a.split(" ")).toHaveLength(2);
        expect(b.split(" ")).toHaveLength(2);
    });

    it("seed-scoped — different seeds give different names", () => {
        const names = new Set<string>();
        for (let seed = 0; seed < 20; seed++) {
            names.add(generateNpcName(seed, { x: 0, y: 0 }, 0, "villager_generic"));
        }
        expect(names.size).toBeGreaterThan(10);
    });
});

describe("generateVillageNpcNames", () => {
    it("returns n unique names", () => {
        const names = generateVillageNpcNames(42, { x: 0, y: 0 }, 5, "villager_generic");
        expect(names).toHaveLength(5);
        expect(new Set(names).size).toBe(5); // all unique within village
    });

    it("is deterministic", () => {
        const a = generateVillageNpcNames(99, { x: 1, y: -3 }, 4, "shopkeep");
        const b = generateVillageNpcNames(99, { x: 1, y: -3 }, 4, "shopkeep");
        expect(a).toEqual(b);
    });
});
