import { describe, it, expect } from "vitest";
import {
    parseChunkMapId,
    chunkMapId,
    buildChunkParsedMap,
    CHUNK_WIDTH,
    CHUNK_HEIGHT,
    TILE_SIZE,
    type TmjParsedMap,
    type TmjLayer,
    type TmjObject,
} from "../../src/modules/chunk-map-provider";
import { parseSeed } from "../../src/modules/seed";

describe("parseChunkMapId", () => {
    it("parses origin chunk", () => {
        expect(parseChunkMapId("chunk_0_0")).toEqual({ x: 0, y: 0 });
    });

    it("parses positive coords", () => {
        expect(parseChunkMapId("chunk_3_7")).toEqual({ x: 3, y: 7 });
    });

    it("parses negative coords", () => {
        expect(parseChunkMapId("chunk_-2_-5")).toEqual({ x: -2, y: -5 });
    });

    it("returns null for non-chunk ids", () => {
        expect(parseChunkMapId("frostvale")).toBeNull();
        expect(parseChunkMapId("map-frostvale")).toBeNull();
        expect(parseChunkMapId("chunk_abc_def")).toBeNull();
        expect(parseChunkMapId("")).toBeNull();
    });
});

describe("chunkMapId", () => {
    it("encodes origin", () => {
        expect(chunkMapId(0, 0)).toBe("chunk_0_0");
    });

    it("encodes negative coords", () => {
        expect(chunkMapId(-3, -7)).toBe("chunk_-3_-7");
    });

    it("round-trips with parseChunkMapId", () => {
        const coord = { x: 5, y: -12 };
        expect(parseChunkMapId(chunkMapId(coord.x, coord.y))).toEqual(coord);
    });
});

describe("buildChunkParsedMap", () => {
    const seed = parseSeed("test");

    it("returns a parsedMap for origin outdoor chunk", () => {
        const map = buildChunkParsedMap(seed, { x: 0, y: 0 });
        expect(map).toBeDefined();
    });

    it("has correct outdoor dimensions", () => {
        const map = buildChunkParsedMap(seed, { x: 0, y: 0 }) as TmjParsedMap;
        expect(map.width).toBe(CHUNK_WIDTH);
        expect(map.height).toBe(CHUNK_HEIGHT);
        expect(map.tilewidth).toBe(TILE_SIZE);
        expect(map.tileheight).toBe(TILE_SIZE);
    });

    it("has at least one tile layer", () => {
        const map = buildChunkParsedMap(seed, { x: 0, y: 0 }) as TmjParsedMap;
        const tileLayers = map.layers.filter((l: TmjLayer) => l.type === "tilelayer");
        expect(tileLayers.length).toBeGreaterThanOrEqual(1);
    });

    it("tile layer data has correct length (width × height)", () => {
        const map = buildChunkParsedMap(seed, { x: 0, y: 0 }) as TmjParsedMap;
        const tileLayer = map.layers.find((l: TmjLayer) => l.type === "tilelayer");
        expect(tileLayer?.data).toHaveLength(CHUNK_WIDTH * CHUNK_HEIGHT);
    });

    it("all tile GIDs are positive integers", () => {
        const map = buildChunkParsedMap(seed, { x: 0, y: 0 }) as TmjParsedMap;
        const tileLayer = map.layers.find((l: TmjLayer) => l.type === "tilelayer");
        const data = tileLayer?.data ?? [];
        expect(data.every((gid: number) => Number.isInteger(gid) && gid > 0)).toBe(true);
    });

    it("has at least one tileset with firstgid=1", () => {
        const map = buildChunkParsedMap(seed, { x: 0, y: 0 }) as TmjParsedMap;
        expect(map.tilesets.length).toBeGreaterThanOrEqual(1);
        expect(map.tilesets[0]?.firstgid).toBe(1);
    });

    it("tileset has required fields for MapClass", () => {
        const map = buildChunkParsedMap(seed, { x: 0, y: 0 }) as TmjParsedMap;
        const ts = map.tilesets[0]!;
        expect(typeof ts.name).toBe("string");
        expect(typeof ts.tilewidth).toBe("number");
        expect(typeof ts.tileheight).toBe("number");
        expect(typeof ts.tilecount).toBe("number");
        expect(typeof ts.columns).toBe("number");
        expect(ts.tilecount).toBeGreaterThan(0);
        expect(ts.columns).toBeGreaterThan(0);
    });

    it("has an object group layer with edge warp objects", () => {
        const map = buildChunkParsedMap(seed, { x: 0, y: 0 }) as TmjParsedMap;
        const objLayer = map.layers.find((l: TmjLayer) => l.type === "objectgroup");
        expect(objLayer).toBeDefined();
        // 4 edge warp zones (N/S/E/W)
        const warps = objLayer!.objects?.filter((o: TmjObject) => o.type === "edge_warp") ?? [];
        expect(warps.length).toBe(4);
    });

    it("north warp targets chunk_0_-1", () => {
        const map = buildChunkParsedMap(seed, { x: 0, y: 0 }) as TmjParsedMap;
        const objLayer = map.layers.find((l: TmjLayer) => l.type === "objectgroup")!;
        const northWarp = objLayer.objects?.find(
            (o: TmjObject) => o.type === "edge_warp" && o.properties?.find((p: {name: string}) => p.name === "direction")?.value === "north",
        );
        expect(northWarp).toBeDefined();
        const targetProp = northWarp!.properties?.find((p: {name: string}) => p.name === "targetMap");
        expect(targetProp?.value).toBe("chunk_0_-1");
    });

    it("warp landing coords (targetX/targetY) are tile-unit integers within the target chunk grid", () => {
        const map = buildChunkParsedMap(seed, { x: 0, y: 0 }) as TmjParsedMap;
        const objLayer = map.layers.find((l: TmjLayer) => l.type === "objectgroup")!;
        const warps = objLayer.objects.filter((o: TmjObject) => o.type === "edge_warp");
        for (const warp of warps) {
            const tx = warp.properties?.find((p: { name: string }) => p.name === "targetX")?.value as number;
            const ty = warp.properties?.find((p: { name: string }) => p.name === "targetY")?.value as number;
            expect(Number.isInteger(tx)).toBe(true);
            expect(Number.isInteger(ty)).toBe(true);
            // Must be strictly within tile grid (not >= width/height)
            expect(tx).toBeGreaterThanOrEqual(0);
            expect(tx).toBeLessThan(CHUNK_WIDTH);
            expect(ty).toBeGreaterThanOrEqual(0);
            expect(ty).toBeLessThan(CHUNK_HEIGHT);
        }

        const prop = (warp: TmjObject, name: string) =>
            warp.properties?.find((p: { name: string }) => p.name === name)?.value;
        const byDir = (dir: string) =>
            warps.find((w: TmjObject) => prop(w, "direction") === dir)!;

        // Per-direction: player lands 2 tiles from the opposite edge, centred on the perpendicular axis.
        const n = byDir("north");
        expect(prop(n, "targetX")).toBe(Math.floor(CHUNK_WIDTH / 2));
        expect(prop(n, "targetY")).toBe(CHUNK_HEIGHT - 2);

        const s = byDir("south");
        expect(prop(s, "targetX")).toBe(Math.floor(CHUNK_WIDTH / 2));
        expect(prop(s, "targetY")).toBe(2);

        const w = byDir("west");
        expect(prop(w, "targetX")).toBe(CHUNK_WIDTH - 2);
        expect(prop(w, "targetY")).toBe(Math.floor(CHUNK_HEIGHT / 2));

        const e = byDir("east");
        expect(prop(e, "targetX")).toBe(2);
        expect(prop(e, "targetY")).toBe(Math.floor(CHUNK_HEIGHT / 2));
    });

    it("produces deterministic output for the same seed+coord", () => {
        const a = buildChunkParsedMap(seed, { x: 3, y: -2 });
        const b = buildChunkParsedMap(seed, { x: 3, y: -2 });
        expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    });

    it("produces different output for different coords", () => {
        const a = buildChunkParsedMap(seed, { x: 0, y: 0 });
        const b = buildChunkParsedMap(seed, { x: 1, y: 0 });
        expect(JSON.stringify(a)).not.toBe(JSON.stringify(b));
    });

    it("edge warp zone centres are within the map pixel bounds", () => {
        const map = buildChunkParsedMap(seed, { x: 0, y: 0 });
        const objLayer = map.layers.find((l: TmjLayer) => l.type === "objectgroup")! as Extract<TmjLayer, { type: "objectgroup" }>;
        const pw = map.width * map.tilewidth;
        const ph = map.height * map.tileheight;
        for (const obj of objLayer.objects.filter((o: TmjObject) => o.type === "edge_warp")) {
            const cx = obj.x + obj.width / 2;
            const cy = obj.y + obj.height / 2;
            expect(cx).toBeGreaterThanOrEqual(0);
            expect(cx).toBeLessThanOrEqual(pw);
            expect(cy).toBeGreaterThanOrEqual(0);
            expect(cy).toBeLessThanOrEqual(ph);
        }
    });

    it("warp zone trigger tile is strictly within the tile grid", () => {
        const map = buildChunkParsedMap(seed, { x: 0, y: 0 });
        const objLayer = map.layers.find((l: TmjLayer) => l.type === "objectgroup")! as Extract<TmjLayer, { type: "objectgroup" }>;
        for (const obj of objLayer.objects.filter((o: TmjObject) => o.type === "edge_warp")) {
            // Mirror the production formula: floor of zone origin (not round of centre)
            const tileX = Math.floor(obj.x / TILE_SIZE);
            const tileY = Math.floor(obj.y / TILE_SIZE);
            expect(tileX).toBeGreaterThanOrEqual(0);
            expect(tileX).toBeLessThan(map.width);
            expect(tileY).toBeGreaterThanOrEqual(0);
            expect(tileY).toBeLessThan(map.height);
        }
    });

    it("does not throw for village chunk types", () => {
        // Find a coord that produces a village chunk (period-7 grid).
        // Village density guarantees one within Chebyshev-3; (3, 0) is a candidate.
        // Just assert no exception is thrown regardless of the chunk kind.
        for (let x = -5; x <= 5; x++) {
            for (let y = -5; y <= 5; y++) {
                expect(() => buildChunkParsedMap(seed, { x, y })).not.toThrow();
            }
        }
    });
});
