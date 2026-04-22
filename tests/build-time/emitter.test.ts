/**
 * Emitter tests — the MapSpec → TMJ compiler.
 *
 * These are the end-to-end unit tests: synthesize a minimal spec, emit TMJ,
 * check schema compliance + determinism.
 *
 * See docs/build-time/MAP_AUTHORING.md § "The TMJ emitter" and § "Tests".
 */
import { describe, expect, it } from "vitest";
import { emitTmj } from "../../scripts/map-authoring/lib/emitter";
import { emitTmx } from "../../scripts/map-authoring/lib/tmx-emitter";
import type {
    MapSpec,
    ParsedTileset,
    TmjLayer,
    TmjObject,
} from "../../scripts/map-authoring/lib/types";

function mkTileset(name: string, opts: Partial<ParsedTileset> = {}): ParsedTileset {
    return {
        source: `${name}.tsx`,
        absolutePath: `/fake/Tilesets/${name}.tsx`,
        name,
        tileWidth: 16,
        tileHeight: 16,
        tileCount: 100,
        columns: 10,
        spacing: 0,
        margin: 0,
        image: {
            source: `../Art/${name}.png`,
            absolutePath: `/fake/Art/${name}.png`,
            width: 160,
            height: 160,
        },
        properties: {},
        animations: {},
        probabilities: {},
        objectGroups: {},
        wangsets: [],
        isCollection: false,
        perTileImages: {},
        ...opts,
    };
}

function mkSpec(overrides: Partial<MapSpec> = {}): MapSpec {
    return {
        id: "test_map",
        biome: "town",
        music_track: "bgm_village",
        width: 3,
        height: 2,
        tileSize: 16,
        tilesets: ["Tileset_Ground"],
        palette: {
            g: { tsx: "Tileset_Ground", local_id: 5 },
            ".": { tsx: "Tileset_Ground", local_id: 0 }, // unused, placeholder
        },
        layers: {
            "Below Player": [
                ["g", "g", "g"],
                ["g", "g", "g"],
            ],
        },
        ...overrides,
    };
}

describe("emitTmj — minimum viable map", () => {
    const ground = mkTileset("Tileset_Ground");
    const spec = mkSpec();

    it("emits a valid TMJ shape", () => {
        const tmj = emitTmj(spec, [ground], "/output/test_map.tmj");
        expect(tmj.type).toBe("map");
        expect(tmj.version).toBe("1.10");
        expect(tmj.orientation).toBe("orthogonal");
        expect(tmj.renderorder).toBe("right-down");
        expect(tmj.infinite).toBe(false);
    });

    it("preserves map dimensions + tile size", () => {
        const tmj = emitTmj(spec, [ground], "/output/test_map.tmj");
        expect(tmj.width).toBe(3);
        expect(tmj.height).toBe(2);
        expect(tmj.tilewidth).toBe(16);
        expect(tmj.tileheight).toBe(16);
    });

    it("emits a tileset ref with firstgid=1 and a relative source path", () => {
        const tmj = emitTmj(spec, [ground], "/output/test_map.tmj");
        expect(tmj.tilesets).toHaveLength(1);
        expect(tmj.tilesets[0].firstgid).toBe(1);
        // Source path is relative from .tmj location to .tsx file
        expect(tmj.tilesets[0].source).toMatch(/Tileset_Ground\.tsx$/);
    });

    it("emits runtime tileset URLs for .tmx output", () => {
        const runtimeTileset = mkTileset("Tileset_Ground", {
            absolutePath: "/repo/public/assets/tilesets/core/Tiled/Tilesets/Tileset_Ground.tsx",
        });
        const tmj = emitTmj(spec, [runtimeTileset], "/repo/src/tiled/test_map.tmx", {
            tilesetSourceMode: "runtime",
        });

        expect(tmj.tilesets[0].source).toBe(
            "../assets/tilesets/core/Tiled/Tilesets/Tileset_Ground.tsx",
        );
    });

    it("emits a tile layer with correct data length", () => {
        const tmj = emitTmj(spec, [ground], "/output/test_map.tmj");
        const belowLayer = tmj.layers.find((l: TmjLayer) => l.name === "Below Player");
        expect(belowLayer).toBeDefined();
        if (belowLayer?.type !== "tilelayer") throw new Error("expected tile layer");
        expect(belowLayer.data).toHaveLength(6); // 3 * 2
        // Every cell resolves to palette 'g' = firstgid(1) + local_id(5) = 6
        expect(belowLayer.data.every((v: number) => v === 6)).toBe(true);
    });

    it("emits biome and music_track as map-level Tiled properties", () => {
        const tmj = emitTmj(spec, [ground], "/output/test_map.tmj");
        expect(tmj.properties).toEqual([
            { name: "biome", type: "string", value: "town" },
            { name: "music_track", type: "string", value: "bgm_village" },
        ]);
    });

    it("serializes map-level properties to TMX before tilesets", () => {
        const tmj = emitTmj(spec, [ground], "/output/test_map.tmx");
        const tmx = emitTmx(tmj);

        expect(tmx).toMatch(
            /<properties>\s+<property name="biome" value="town"\/>\s+<property name="music_track" value="bgm_village"\/>\s+<\/properties>/,
        );
        expect(tmx.indexOf("<properties>")).toBeLessThan(tmx.indexOf("<tileset"));
    });
});

describe("emitTmj — determinism", () => {
    const ground = mkTileset("Tileset_Ground");
    const spec = mkSpec();

    it("produces byte-identical output for the same input", () => {
        const a = emitTmj(spec, [ground], "/output/test_map.tmj");
        const b = emitTmj(spec, [ground], "/output/test_map.tmj");
        expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    });
});

describe("emitTmj — multiple layers", () => {
    const ground = mkTileset("Tileset_Ground");
    const spec = mkSpec({
        layers: {
            "Below Player": [
                ["g", "g"],
                ["g", "g"],
            ],
            World: [{ at: [0, 0], tile: "g" }],
            "Above Player": [{ at: [1, 1], tile: "g" }],
        },
        width: 2,
        height: 2,
    });

    it("emits layers in canonical order: Below Player, World, Above Player", () => {
        const tmj = emitTmj(spec, [ground], "/output/test_map.tmj");
        const tileLayerNames = tmj.layers
            .filter((l: TmjLayer) => l.type === "tilelayer")
            .map((l: TmjLayer) => l.name);
        expect(tileLayerNames).toEqual(["Below Player", "World", "Above Player"]);
    });

    it("renders place entries into the data array", () => {
        const tmj = emitTmj(spec, [ground], "/output/test_map.tmj");
        const world = tmj.layers.find((l: TmjLayer) => l.name === "World");
        if (world?.type !== "tilelayer") throw new Error("expected tile layer");
        // Only (0,0) should be non-zero
        expect(world.data).toEqual([6, 0, 0, 0]);
    });
});

describe("emitTmj — object layer", () => {
    const ground = mkTileset("Tileset_Ground");
    const spec = mkSpec({
        layers: {
            "Below Player": [
                ["g", "g"],
                ["g", "g"],
            ],
            Objects: [
                { type: "SpawnPoint", name: "default", at: [1, 1] },
                {
                    type: "Sign",
                    name: "welcome",
                    at: [0, 0],
                    props: { text: "ma tomo lili" },
                },
                {
                    type: "Warp",
                    name: "to_east",
                    rect: [1, 0, 1, 2],
                    props: { target_map: "nasin_wan", target_spawn: "from_west" },
                },
            ],
        },
        width: 2,
        height: 2,
    });

    it("emits an Objects layer", () => {
        const tmj = emitTmj(spec, [ground], "/output/test_map.tmj");
        const objLayer = tmj.layers.find((l: TmjLayer) => l.name === "Objects");
        expect(objLayer).toBeDefined();
        expect(objLayer?.type).toBe("objectgroup");
    });

    it("converts tile-unit positions to pixels", () => {
        const tmj = emitTmj(spec, [ground], "/output/test_map.tmj");
        const objLayer = tmj.layers.find((l: TmjLayer) => l.name === "Objects");
        if (objLayer?.type !== "objectgroup") throw new Error("expected object layer");
        const spawn = objLayer.objects.find((o: TmjObject) => o.name === "default");
        expect(spawn).toBeDefined();
        expect(spawn?.x).toBe(1 * 16);
        expect(spawn?.y).toBe(1 * 16);
    });

    it("emits warp rects with correct pixel dimensions", () => {
        const tmj = emitTmj(spec, [ground], "/output/test_map.tmj");
        const objLayer = tmj.layers.find((l: TmjLayer) => l.name === "Objects");
        if (objLayer?.type !== "objectgroup") throw new Error("expected object layer");
        const warp = objLayer.objects.find((o: TmjObject) => o.name === "to_east");
        expect(warp).toBeDefined();
        expect(warp?.x).toBe(1 * 16);
        expect(warp?.y).toBe(0 * 16);
        expect(warp?.width).toBe(1 * 16);
        expect(warp?.height).toBe(2 * 16);
    });

    it("serializes properties with correct Tiled type hints", () => {
        const tmj = emitTmj(spec, [ground], "/output/test_map.tmj");
        const objLayer = tmj.layers.find((l: TmjLayer) => l.name === "Objects");
        if (objLayer?.type !== "objectgroup") throw new Error("expected object layer");
        const warp = objLayer.objects.find((o: TmjObject) => o.name === "to_east");
        expect(warp?.properties).toBeDefined();
        const targetMap = warp!.properties!.find((p: { name: string }) => p.name === "target_map");
        expect(targetMap).toEqual({
            name: "target_map",
            type: "string",
            value: "nasin_wan",
        });
    });

    it("tags each object with its MapSpec type as the Tiled `type` field", () => {
        const tmj = emitTmj(spec, [ground], "/output/test_map.tmj");
        const objLayer = tmj.layers.find((l: TmjLayer) => l.name === "Objects");
        if (objLayer?.type !== "objectgroup") throw new Error("expected object layer");
        expect(objLayer.objects.find((o: TmjObject) => o.name === "default")?.type).toBe(
            "SpawnPoint",
        );
        expect(objLayer.objects.find((o: TmjObject) => o.name === "welcome")?.type).toBe("Sign");
        expect(objLayer.objects.find((o: TmjObject) => o.name === "to_east")?.type).toBe("Warp");
    });
});

describe("emitTmj — encounter layer", () => {
    const ground = mkTileset("Tileset_Ground");
    const spec = mkSpec({
        layers: {
            "Below Player": [
                ["g", "g"],
                ["g", "g"],
            ],
            Encounters: [
                {
                    rect: [0, 0, 2, 2],
                    species: { soweli_seli: 3, kasi_pona: 1 },
                    levelRange: [2, 4],
                },
            ],
        },
        width: 2,
        height: 2,
    });

    it("emits an Encounters object layer", () => {
        const tmj = emitTmj(spec, [ground], "/output/test_map.tmj");
        const enc = tmj.layers.find((l: TmjLayer) => l.name === "Encounters");
        expect(enc).toBeDefined();
        expect(enc?.type).toBe("objectgroup");
    });

    it("serializes species map as JSON string property", () => {
        const tmj = emitTmj(spec, [ground], "/output/test_map.tmj");
        const enc = tmj.layers.find((l: TmjLayer) => l.name === "Encounters");
        if (enc?.type !== "objectgroup") throw new Error("expected object layer");
        const obj = enc.objects[0];
        const speciesProp = obj.properties?.find((p: { name: string }) => p.name === "species");
        expect(speciesProp?.type).toBe("string");
        expect(JSON.parse(String(speciesProp?.value))).toEqual({
            soweli_seli: 3,
            kasi_pona: 1,
        });
    });

    it("serializes level range as two int properties", () => {
        const tmj = emitTmj(spec, [ground], "/output/test_map.tmj");
        const enc = tmj.layers.find((l: TmjLayer) => l.name === "Encounters");
        if (enc?.type !== "objectgroup") throw new Error("expected object layer");
        const obj = enc.objects[0];
        expect(obj.properties?.find((p: { name: string }) => p.name === "level_min")?.value).toBe(
            2,
        );
        expect(obj.properties?.find((p: { name: string }) => p.name === "level_max")?.value).toBe(
            4,
        );
    });
});

describe("emitTmj — error cases", () => {
    it("throws when a tileset referenced in spec.tilesets is not provided", () => {
        const spec = mkSpec({ tilesets: ["Tileset_Water"] });
        expect(() => emitTmj(spec, [], "/output/test_map.tmj")).toThrow(
            /tileset.*Tileset_Water.*not loaded/i,
        );
    });

    it("throws when a paint-grid cell uses an unknown palette name", () => {
        const ground = mkTileset("Tileset_Ground");
        const spec: MapSpec = {
            id: "bad_spec",
            biome: "town",
            music_track: "bgm_village",
            width: 2,
            height: 2,
            tileSize: 16,
            tilesets: ["Tileset_Ground"],
            palette: { g: { tsx: "Tileset_Ground", local_id: 5 } },
            layers: {
                "Below Player": [
                    ["g", "unknown"],
                    ["g", "g"],
                ],
            },
        };
        expect(() => emitTmj(spec, [ground], "/output/test_map.tmj")).toThrow(/palette.*unknown/i);
    });

    it("throws when paint grid dimensions do not match map dimensions", () => {
        const ground = mkTileset("Tileset_Ground");
        const spec = mkSpec({
            width: 3,
            height: 2,
            layers: {
                "Below Player": [
                    ["g", "g"], // only 2 wide, but width=3
                    ["g", "g"],
                ],
            },
        });
        expect(() => emitTmj(spec, [ground], "/output/test_map.tmj")).toThrow(
            /row.*width|dimensions/i,
        );
    });
});
