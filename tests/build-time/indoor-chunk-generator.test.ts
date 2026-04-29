import { describe, expect, it } from "vitest";
import {
    generateIndoorChunk,
    INDOOR_WIDTH,
    INDOOR_HEIGHT,
} from "../../src/modules/indoor-chunk-generator";
import type { IndoorArchetype } from "../../src/modules/world-generator";

/**
 * T117: Indoor chunk generator — shop, inn, house, cave, shrine interiors.
 */

const SEED = 42;
const CHUNK = { x: 2, y: -3 };
const ARCHETYPES: IndoorArchetype[] = [
    "shop_interior", "inn_interior", "elder_house",
    "resident_house", "cave_interior", "shrine_interior",
];

describe("generateIndoorChunk — schema", () => {
    it("returns correct tile grid dimensions", () => {
        const c = generateIndoorChunk(SEED, CHUNK, "shop_interior");
        expect(c.tiles).toHaveLength(INDOOR_HEIGHT);
        expect(c.tiles[0]).toHaveLength(INDOOR_WIDTH);
    });

    it("collision matches dimensions", () => {
        const c = generateIndoorChunk(SEED, CHUNK, "shop_interior");
        expect(c.collision).toHaveLength(INDOOR_HEIGHT);
        expect(c.collision[0]).toHaveLength(INDOOR_WIDTH);
    });

    it("has an exit warp", () => {
        const c = generateIndoorChunk(SEED, CHUNK, "shop_interior");
        expect(c.exitX).toBeGreaterThanOrEqual(0);
        expect(c.exitX).toBeLessThan(INDOOR_WIDTH);
        expect(c.exitY).toBeDefined();
    });

    it("has NPC spawns for archetypes that have NPCs", () => {
        const shop = generateIndoorChunk(SEED, CHUNK, "shop_interior");
        expect(shop.npcSpawns.length).toBeGreaterThan(0);

        const inn = generateIndoorChunk(SEED, CHUNK, "inn_interior");
        expect(inn.npcSpawns.length).toBeGreaterThan(0);

        const elder = generateIndoorChunk(SEED, CHUNK, "elder_house");
        expect(elder.npcSpawns.length).toBeGreaterThan(0);
    });

    it("cave_interior has a chest spawn", () => {
        const c = generateIndoorChunk(SEED, CHUNK, "cave_interior");
        expect(c.chestSpawns.length).toBeGreaterThan(0);
    });
});

describe("generateIndoorChunk — determinism", () => {
    it("is deterministic for all archetypes", () => {
        for (const arch of ARCHETYPES) {
            const a = generateIndoorChunk(SEED, CHUNK, arch);
            const b = generateIndoorChunk(SEED, CHUNK, arch);
            expect(a.tiles).toEqual(b.tiles);
            expect(a.npcSpawns).toEqual(b.npcSpawns);
        }
    });
});

describe("generateIndoorChunk — collision", () => {
    it("border walls are impassable for all archetypes (exit door excepted)", () => {
        for (const arch of ARCHETYPES) {
            const c = generateIndoorChunk(SEED, CHUNK, arch);
            for (let x = 0; x < INDOOR_WIDTH; x++) {
                expect(c.collision[0]?.[x]).toBe(true);
            }
            // Bottom row: all impassable except exit door tile
            const exitX = c.exitX;
            for (let x = 0; x < INDOOR_WIDTH; x++) {
                if (x === exitX) continue; // door is walkable
                expect(c.collision[INDOOR_HEIGHT - 1]?.[x]).toBe(true);
            }
        }
    });

    it("interior has some walkable tiles", () => {
        const c = generateIndoorChunk(SEED, CHUNK, "shop_interior");
        let walkable = 0;
        for (let y = 1; y < INDOOR_HEIGHT - 1; y++) {
            for (let x = 1; x < INDOOR_WIDTH - 1; x++) {
                if (!c.collision[y]?.[x]) walkable++;
            }
        }
        expect(walkable).toBeGreaterThan(20);
    });
});

describe("generateIndoorChunk — archetype flavor", () => {
    it("shop_interior floor tile is different from shrine_interior floor", () => {
        const shop = generateIndoorChunk(SEED, CHUNK, "shop_interior");
        const shrine = generateIndoorChunk(SEED, CHUNK, "shrine_interior");
        // Center tile should differ between shop and shrine
        const sCtr = shop.tiles[Math.floor(INDOOR_HEIGHT / 2)]?.[Math.floor(INDOOR_WIDTH / 2)];
        const shCtr = shrine.tiles[Math.floor(INDOOR_HEIGHT / 2)]?.[Math.floor(INDOOR_WIDTH / 2)];
        expect(sCtr).not.toBe(shCtr);
    });
});
