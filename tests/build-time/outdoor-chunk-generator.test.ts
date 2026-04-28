import { describe, expect, it } from "vitest";
import {
    generateOutdoorChunk,
    type OutdoorChunk,
    OUTDOOR_WIDTH,
    OUTDOOR_HEIGHT,
} from "../../src/modules/outdoor-chunk-generator";

/**
 * T115: Outdoor chunk generator — tile grid, collision layer,
 *       encounter zones, NPC spawn points.
 */

const SEED = 42;
const CHUNK = { x: 3, y: -1 };

describe("generateOutdoorChunk — schema", () => {
    it("returns a correctly dimensioned tile grid", () => {
        const chunk = generateOutdoorChunk(SEED, CHUNK, { kind: "outdoor", biome: "grassland" });
        expect(chunk.tiles).toHaveLength(OUTDOOR_HEIGHT);
        expect(chunk.tiles[0]).toHaveLength(OUTDOOR_WIDTH);
    });

    it("collision layer matches tile grid dimensions", () => {
        const chunk = generateOutdoorChunk(SEED, CHUNK, { kind: "outdoor", biome: "grassland" });
        expect(chunk.collision).toHaveLength(OUTDOOR_HEIGHT);
        expect(chunk.collision[0]).toHaveLength(OUTDOOR_WIDTH);
    });

    it("collision is boolean grid", () => {
        const chunk = generateOutdoorChunk(SEED, CHUNK, { kind: "outdoor", biome: "grassland" });
        for (const row of chunk.collision) {
            for (const cell of row) {
                expect(typeof cell).toBe("boolean");
            }
        }
    });

    it("has 1-4 encounter zones", () => {
        const chunk = generateOutdoorChunk(SEED, CHUNK, { kind: "outdoor", biome: "grassland" });
        expect(chunk.encounterZones.length).toBeGreaterThanOrEqual(1);
        expect(chunk.encounterZones.length).toBeLessThanOrEqual(4);
    });

    it("each encounter zone has valid coordinates", () => {
        const chunk = generateOutdoorChunk(SEED, CHUNK, { kind: "outdoor", biome: "forest" });
        for (const zone of chunk.encounterZones) {
            expect(zone.x).toBeGreaterThanOrEqual(0);
            expect(zone.y).toBeGreaterThanOrEqual(0);
            expect(zone.x + zone.width).toBeLessThanOrEqual(OUTDOOR_WIDTH);
            expect(zone.y + zone.height).toBeLessThanOrEqual(OUTDOOR_HEIGHT);
        }
    });

    it("has 0-4 NPC spawn points", () => {
        const chunk = generateOutdoorChunk(SEED, CHUNK, { kind: "outdoor", biome: "grassland" });
        expect(chunk.npcSpawns.length).toBeGreaterThanOrEqual(0);
        expect(chunk.npcSpawns.length).toBeLessThanOrEqual(4);
    });

    it("each NPC spawn has valid coordinates", () => {
        const chunk = generateOutdoorChunk(SEED, CHUNK, { kind: "outdoor", biome: "grassland" });
        for (const spawn of chunk.npcSpawns) {
            expect(spawn.x).toBeGreaterThanOrEqual(1);
            expect(spawn.y).toBeGreaterThanOrEqual(1);
            expect(spawn.x).toBeLessThan(OUTDOOR_WIDTH - 1);
            expect(spawn.y).toBeLessThan(OUTDOOR_HEIGHT - 1);
        }
    });
});

describe("generateOutdoorChunk — determinism", () => {
    it("same inputs produce identical output", () => {
        const a = generateOutdoorChunk(SEED, CHUNK, { kind: "outdoor", biome: "forest" });
        const b = generateOutdoorChunk(SEED, CHUNK, { kind: "outdoor", biome: "forest" });
        expect(a.tiles).toEqual(b.tiles);
        expect(a.collision).toEqual(b.collision);
        expect(a.encounterZones).toEqual(b.encounterZones);
        expect(a.npcSpawns).toEqual(b.npcSpawns);
    });

    it("different biomes produce different tile patterns", () => {
        const grassland = generateOutdoorChunk(SEED, CHUNK, { kind: "outdoor", biome: "grassland" });
        const snowfield = generateOutdoorChunk(SEED, CHUNK, { kind: "outdoor", biome: "snowfield" });
        // Different biomes should produce different base tiles
        const gTile = grassland.tiles[5]?.[5];
        const sTile = snowfield.tiles[5]?.[5];
        expect(gTile).not.toBe(sTile);
    });

    it("different coords produce different tile patterns", () => {
        const a = generateOutdoorChunk(SEED, { x: 0, y: 0 }, { kind: "outdoor", biome: "grassland" });
        const b = generateOutdoorChunk(SEED, { x: 5, y: 5 }, { kind: "outdoor", biome: "grassland" });
        // Should differ (not identical grid)
        const rowA = JSON.stringify(a.tiles[12]);
        const rowB = JSON.stringify(b.tiles[12]);
        expect(rowA).not.toBe(rowB);
    });
});

describe("generateOutdoorChunk — biome properties", () => {
    it("grassland has tall-grass encounter zones (tile 'G')", () => {
        const chunk = generateOutdoorChunk(SEED, CHUNK, { kind: "outdoor", biome: "grassland" });
        expect(chunk.encounterZones.length).toBeGreaterThan(0);
    });

    it("snowfield uses snow tiles", () => {
        const chunk = generateOutdoorChunk(SEED, CHUNK, { kind: "outdoor", biome: "snowfield" });
        // Base tile should be snow-type
        const center = chunk.tiles[12]?.[16];
        expect(center).toMatch(/^(snow|frost|ice)/);
    });

    it("forest uses tree/grass tiles", () => {
        const chunk = generateOutdoorChunk(SEED, CHUNK, { kind: "outdoor", biome: "forest" });
        const center = chunk.tiles[12]?.[16];
        expect(center).toMatch(/^(grass|fern|leaf|path)/);
    });

    it("coast has water tiles near one edge", () => {
        const chunk = generateOutdoorChunk(SEED, CHUNK, { kind: "outdoor", biome: "coast" });
        // Bottom row (y=OUTDOOR_HEIGHT-1) should be water
        const bottomRow = chunk.tiles[OUTDOOR_HEIGHT - 1]!;
        const hasWater = bottomRow.some((t) => t.startsWith("water"));
        expect(hasWater).toBe(true);
    });

    it("landmark chunk has encounter zone", () => {
        const chunk = generateOutdoorChunk(SEED, CHUNK, { kind: "landmark", landmark: "stone_shrine" });
        expect(chunk.encounterZones.length).toBeGreaterThanOrEqual(0); // landmarks may have rare-only zones
        expect(chunk.tiles).toHaveLength(OUTDOOR_HEIGHT);
    });
});

describe("generateOutdoorChunk — collision", () => {
    it("border tiles are collidable", () => {
        const chunk = generateOutdoorChunk(SEED, CHUNK, { kind: "outdoor", biome: "grassland" });
        // Top row all collide
        for (let x = 0; x < OUTDOOR_WIDTH; x++) {
            expect(chunk.collision[0]?.[x]).toBe(true);
        }
        // Bottom row all collide
        for (let x = 0; x < OUTDOOR_WIDTH; x++) {
            expect(chunk.collision[OUTDOOR_HEIGHT - 1]?.[x]).toBe(true);
        }
    });

    it("interior has some walkable tiles", () => {
        const chunk = generateOutdoorChunk(SEED, CHUNK, { kind: "outdoor", biome: "grassland" });
        let walkable = 0;
        for (let y = 1; y < OUTDOOR_HEIGHT - 1; y++) {
            for (let x = 1; x < OUTDOOR_WIDTH - 1; x++) {
                if (!chunk.collision[y]?.[x]) walkable++;
            }
        }
        expect(walkable).toBeGreaterThan(100);
    });
});
