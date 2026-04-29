import { describe, expect, it } from "vitest";
import {
    generateVillageChunk,
    type VillageChunk,
    VILLAGE_WIDTH,
    VILLAGE_HEIGHT,
} from "../../src/modules/village-chunk-generator";
import type { VillageArchetype } from "../../src/modules/world-generator";

/**
 * T116: Village chunk generator — slot-fill grammar, building placement,
 *       door warps, interior chunk linkage.
 */

const SEED = 42;
const CHUNK = { x: 1, y: -2 };

describe("generateVillageChunk — schema", () => {
    it("returns correct tile grid dimensions", () => {
        const c = generateVillageChunk(SEED, CHUNK, "small_hamlet");
        expect(c.tiles).toHaveLength(VILLAGE_HEIGHT);
        expect(c.tiles[0]).toHaveLength(VILLAGE_WIDTH);
    });

    it("collision matches dimensions", () => {
        const c = generateVillageChunk(SEED, CHUNK, "small_hamlet");
        expect(c.collision).toHaveLength(VILLAGE_HEIGHT);
        expect(c.collision[0]).toHaveLength(VILLAGE_WIDTH);
    });

    it("has a center (plaza/well/shrine)", () => {
        const c = generateVillageChunk(SEED, CHUNK, "small_hamlet");
        expect(c.center).toBeDefined();
        expect(c.center.x).toBeGreaterThanOrEqual(0);
        expect(c.center.y).toBeGreaterThanOrEqual(0);
    });

    it("has buildings", () => {
        const c = generateVillageChunk(SEED, CHUNK, "small_hamlet");
        expect(c.buildings.length).toBeGreaterThan(0);
    });

    it("each building has a door warp to an indoor chunk", () => {
        const c = generateVillageChunk(SEED, CHUNK, "small_hamlet");
        for (const b of c.buildings) {
            expect(b.doorX).toBeGreaterThanOrEqual(0);
            expect(b.doorY).toBeGreaterThanOrEqual(0);
            expect(b.indoorArchetype).toBeDefined();
        }
    });

    it("has NPC spawns", () => {
        const c = generateVillageChunk(SEED, CHUNK, "small_hamlet");
        expect(c.npcSpawns.length).toBeGreaterThan(0);
    });
});

describe("generateVillageChunk — archetype slots", () => {
    it("small_hamlet has shop, inn, elder building", () => {
        const c = generateVillageChunk(SEED, CHUNK, "small_hamlet");
        const archetypes = c.buildings.map((b) => b.indoorArchetype);
        expect(archetypes).toContain("shop_interior");
        expect(archetypes).toContain("inn_interior");
        expect(archetypes).toContain("elder_house");
    });

    it("market_town has 2 shops", () => {
        const c = generateVillageChunk(SEED, CHUNK, "market_town");
        const shops = c.buildings.filter((b) => b.indoorArchetype === "shop_interior");
        expect(shops.length).toBeGreaterThanOrEqual(2);
    });

    it("shrine_settlement has no shop", () => {
        const c = generateVillageChunk(SEED, CHUNK, "shrine_settlement");
        const archetypes = c.buildings.map((b) => b.indoorArchetype);
        expect(archetypes).not.toContain("shop_interior");
    });

    it("road_stop has inn but no elder", () => {
        const c = generateVillageChunk(SEED, CHUNK, "road_stop");
        const archetypes = c.buildings.map((b) => b.indoorArchetype);
        expect(archetypes).toContain("inn_interior");
        expect(archetypes).not.toContain("elder_house");
    });
});

describe("generateVillageChunk — determinism", () => {
    const ARCHETYPES: VillageArchetype[] = [
        "small_hamlet", "market_town", "snow_lodge",
        "road_stop", "fishing_pier", "shrine_settlement",
    ];

    it("is deterministic for all archetypes", () => {
        for (const arch of ARCHETYPES) {
            const a = generateVillageChunk(SEED, CHUNK, arch);
            const b = generateVillageChunk(SEED, CHUNK, arch);
            expect(a.tiles).toEqual(b.tiles);
            expect(a.buildings).toEqual(b.buildings);
        }
    });

    it("different seeds produce different village layouts", () => {
        const a = generateVillageChunk(SEED, CHUNK, "small_hamlet");
        const b = generateVillageChunk(SEED + 1, CHUNK, "small_hamlet");
        // Buildings may differ (even if archetype is same)
        const aPos = JSON.stringify(a.buildings.map((b2) => ({ x: b2.x, y: b2.y })));
        const bPos = JSON.stringify(b.buildings.map((b2) => ({ x: b2.x, y: b2.y })));
        expect(aPos).not.toBe(bPos);
    });
});

describe("generateVillageChunk — collision", () => {
    it("border is impassable", () => {
        const c = generateVillageChunk(SEED, CHUNK, "small_hamlet");
        for (let x = 0; x < VILLAGE_WIDTH; x++) {
            expect(c.collision[0]?.[x]).toBe(true);
            expect(c.collision[VILLAGE_HEIGHT - 1]?.[x]).toBe(true);
        }
    });

    it("interior has walkable tiles", () => {
        const c = generateVillageChunk(SEED, CHUNK, "small_hamlet");
        let walkable = 0;
        for (let y = 1; y < VILLAGE_HEIGHT - 1; y++) {
            for (let x = 1; x < VILLAGE_WIDTH - 1; x++) {
                if (!c.collision[y]?.[x]) walkable++;
            }
        }
        expect(walkable).toBeGreaterThan(80);
    });
});
