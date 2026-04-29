import { describe, expect, it } from "vitest";
import {
    buildWorldMapData,
    type WorldMapTile,
} from "../../src/modules/main/world-map-data";

/**
 * T150: World map data builder — pure function for pause-menu map view.
 */

const SEED = 42;
const PLAYER = { x: 0, y: 0 };

describe("buildWorldMapData", () => {
    it("includes the player's current chunk", () => {
        const map = buildWorldMapData(SEED, new Set(["0:0"]), PLAYER);
        const origin = map.tiles.find((t) => t.x === 0 && t.y === 0);
        expect(origin).toBeDefined();
        expect(origin!.isPlayer).toBe(true);
    });

    it("marks visited chunks", () => {
        const visited = new Set(["0:0", "1:0", "0:1"]);
        const map = buildWorldMapData(SEED, visited, PLAYER);
        const tile10 = map.tiles.find((t) => t.x === 1 && t.y === 0);
        expect(tile10?.visited).toBe(true);
    });

    it("includes chunk names for visited chunks", () => {
        const map = buildWorldMapData(SEED, new Set(["0:0"]), PLAYER);
        const origin = map.tiles.find((t) => t.x === 0 && t.y === 0);
        expect(typeof origin!.name).toBe("string");
        expect(origin!.name.length).toBeGreaterThan(0);
    });

    it("includes chunk type / biome for visited chunks", () => {
        const map = buildWorldMapData(SEED, new Set(["0:0"]), PLAYER);
        const origin = map.tiles.find((t) => t.x === 0 && t.y === 0);
        expect(origin!.type).toBeDefined();
        expect(typeof origin!.type.kind).toBe("string");
    });

    it("exposes the player chunk coordinates", () => {
        const map = buildWorldMapData(SEED, new Set(["2:-1"]), { x: 2, y: -1 });
        expect(map.playerChunk).toEqual({ x: 2, y: -1 });
    });

    it("is deterministic — same inputs same output", () => {
        const a = buildWorldMapData(SEED, new Set(["0:0", "1:0"]), PLAYER);
        const b = buildWorldMapData(SEED, new Set(["0:0", "1:0"]), PLAYER);
        expect(a.tiles).toEqual(b.tiles);
    });

    it("handles empty visited set (only player chunk shown)", () => {
        const map = buildWorldMapData(SEED, new Set(), PLAYER);
        expect(map.tiles.length).toBeGreaterThanOrEqual(1);
        const player = map.tiles.find((t) => t.isPlayer);
        expect(player).toBeDefined();
    });
});
