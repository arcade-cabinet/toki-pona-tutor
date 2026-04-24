import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import maTomoLili from "../../scripts/map-authoring/specs/riverside_home";
import nasinWan from "../../scripts/map-authoring/specs/greenwood_road";
import nasinPiTelo from "../../scripts/map-authoring/specs/rivergate_approach";
import maTelo from "../../scripts/map-authoring/specs/lakehaven";
import maLete from "../../scripts/map-authoring/specs/frostvale";
import nenaSewi from "../../scripts/map-authoring/specs/highridge_pass";
import nenaSuli from "../../scripts/map-authoring/specs/dreadpeak_cavern";
import { cavePalette } from "../../scripts/map-authoring/palettes/cave";
import { icePalette } from "../../scripts/map-authoring/palettes/ice";
import { mountainPalette } from "../../scripts/map-authoring/palettes/mountain";
import { waterPalette } from "../../scripts/map-authoring/palettes/water";
import { collectionAtlasTileset } from "../../scripts/map-authoring/config/collection-atlases";
import type { PlacedTile, TileGrid } from "../../scripts/map-authoring/lib/types";

const SHIPPED_SPECS = [
    ["riverside_home", maTomoLili],
    ["greenwood_road", nasinWan],
    ["highridge_pass", nenaSewi],
    ["lakehaven", maTelo],
    ["frostvale", maLete],
    ["dreadpeak_cavern", nenaSuli],
    ["rivergate_approach", nasinPiTelo],
] as const;

const CARDINAL_DIRECTIONS = [
    [1, 0],
    [-1, 0],
    [0, 1],
    [0, -1],
] as const;

function isTileGrid(layer: TileGrid | PlacedTile[] | undefined): layer is TileGrid {
    return Array.isArray(layer) && layer.length > 0 && Array.isArray(layer[0]);
}

function requireTileGrid(
    layer: TileGrid | PlacedTile[] | undefined,
    name: string,
): TileGrid {
    if (!isTileGrid(layer)) throw new Error(`expected ${name} to be a tile grid`);
    return layer;
}

function isBlockedWaterCell(cell: string): boolean {
    return cell === "w" || cell.startsWith("ws_");
}

function isPathCell(cell: string): boolean {
    return cell === "d" || cell === "p" || cell.startsWith("gd_");
}

function hardWaterPathSeams(grid: TileGrid): string[] {
    const seams: string[] = [];
    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
            if (!isBlockedWaterCell(grid[y][x])) continue;
            for (const [dx, dy] of CARDINAL_DIRECTIONS) {
                const neighbor = grid[y + dy]?.[x + dx];
                if (neighbor && isPathCell(neighbor)) {
                    seams.push(`${grid[y][x]}(${x},${y}) -> ${neighbor}(${x + dx},${y + dy})`);
                }
            }
        }
    }
    return seams;
}

function npcNames(spec: { layers: { Objects?: Array<{ type: string; name: string }> } }): string[] {
    return (spec.layers.Objects ?? [])
        .filter((marker) => marker.type === "NPC")
        .map((marker) => marker.name)
        .sort();
}

function dialogNodesById(): Map<string, { id: string; npc_id: string | null; beats: unknown[] }> {
    const dir = resolve(__dirname, "../../src/content/spine/dialog");
    return new Map(
        readdirSync(dir)
            .filter((name) => name.endsWith(".json"))
            .map((name) => {
                const node = JSON.parse(readFileSync(resolve(dir, name), "utf8")) as {
                    id: string;
                    npc_id: string | null;
                    beats: unknown[];
                };
                return [node.id, node] as const;
            }),
    );
}

describe("authored map content contracts", () => {
    it("T4-15: every shipped region has at least five authored NPC markers", () => {
        for (const [mapId, spec] of SHIPPED_SPECS) {
            expect(npcNames(spec).length, `${mapId} NPC floor`).toBeGreaterThanOrEqual(5);
        }
    });

    it("T4-14: every authored species appears in a catchable encounter table", () => {
        const speciesDir = resolve(__dirname, "../../src/content/spine/species");
        const authoredSpecies = readdirSync(speciesDir)
            .filter((name) => name.endsWith(".json"))
            .map((name) => {
                const raw = JSON.parse(readFileSync(resolve(speciesDir, name), "utf8")) as {
                    id: string;
                };
                return raw.id;
            })
            .sort();
        const catchableSpecies = new Set<string>();

        for (const [, spec] of SHIPPED_SPECS) {
            for (const encounter of spec.layers.Encounters ?? []) {
                for (const speciesId of Object.keys(encounter.species)) {
                    catchableSpecies.add(speciesId);
                }
            }
        }

        expect(authoredSpecies.filter((speciesId) => !catchableSpecies.has(speciesId))).toEqual([]);
    });

    it("T4-15: new regional NPC dialog nodes are spine-backed and multi-beat", () => {
        const dialogs = dialogNodesById();
        const newDialogIds = [
            "jan_pona_tomo_welcome",
            "jan_telo_well_water",
            "jan_poki_tomo_ready",
            "jan_kili_tomo_snack",
            "jan_palisa_nasin_sign",
            "jan_kasi_nasin_grass",
            "jan_poki_nasin_pack",
            "jan_lukin_nasin_watch",
            "jan_kiwen_mountain",
            "jan_waso_sewi_sky",
            "jan_nasin_sewi_path",
            "jan_sike_telo_plaza",
            "jan_suno_lete_light",
            "jan_poki_lete_cold",
            "jan_kiwen_suli_cave",
            "jan_pimeja_suli_torch",
            "jan_suno_telo_last",
        ];

        for (const dialogId of newDialogIds) {
            const node = dialogs.get(dialogId);
            expect(node, dialogId).toBeDefined();
            expect(node?.npc_id, dialogId).toMatch(/^jan_/);
            expect(node?.beats.length, dialogId).toBeGreaterThanOrEqual(2);
        }
    });

    it("T4-01: riverside_home uses seasons grass and dirt-path transitions instead of core placeholder paint", () => {
        expect(maTomoLili.tilesets).toEqual(
            expect.arrayContaining(["seasons/Tileset_Ground_Seasons", "seasons/Tileset_Road"]),
        );
        expect(maTomoLili.tilesets).not.toContain("core/Tileset_Ground");

        const below = maTomoLili.layers["Below Player"];
        if (!isTileGrid(below))
            throw new Error("expected riverside_home Below Player to be a tile grid");

        const used = new Set(below.flat());
        // v1 palette intentionally narrow: grass_base ("g") + dirt-path
        // ("d") + grass/dirt edge transitions ("gd_*"). The previously-
        // used "v" (grass_light) tile is a half-transparent bush shape
        // that renders as black-crown artifacts over the WebGL clear
        // colour, and "f" (grass_dark) was the visually-identical
        // border filler. See riverside_home.ts T11-03 comment for
        // the runtime root-cause.
        expect([...used]).toEqual(expect.arrayContaining(["g", "d"]));
        expect([...used].some((cell) => cell.startsWith("gd_"))).toBe(true);
    });

    it("T4-02: greenwood_road uses the seasons forest tileset instead of placeholder core grass", () => {
        expect(nasinWan.biome).toBe("forest");
        expect(nasinWan.tilesets).toEqual(
            expect.arrayContaining([
                "seasons/Tileset_Ground_Seasons",
                "seasons/Tileset_Road",
                "seasons/Tileset_TallGrass",
                collectionAtlasTileset("seasons/Objects_Trees_Seasons"),
            ]),
        );
        expect(nasinWan.tilesets).not.toContain("core/Tileset_Ground");
    });

    it("T4-02: greenwood_road has forest paint, encounter grass, pathing, and tree cover", () => {
        const below = requireTileGrid(nasinWan.layers["Below Player"], "greenwood_road Below Player");
        const detail = requireTileGrid(nasinWan.layers["Ground Detail"], "greenwood_road Ground Detail");

        const used = new Set(below.flat());
        expect([...used]).toEqual(expect.arrayContaining(["g", "f", "v", "d"]));
        expect(used.has("G")).toBe(false);
        expect(new Set(detail.flat())).toContain("G");
        expect(below[5].every((cell) => cell === "d")).toBe(true);

        const world = nasinWan.layers.World;
        if (!Array.isArray(world) || isTileGrid(world)) {
            throw new Error("expected greenwood_road World to be placed forest tiles");
        }
        const placed = world.map((entry) => entry.tile);
        expect(placed.some((tile) => tile.startsWith("tree_"))).toBe(true);
        expect(placed.some((tile) => tile.startsWith("bush_"))).toBe(true);
    });

    it("T4-03: rivergate_approach uses seasons water/shore tiles instead of placeholder core grass", () => {
        expect(nasinPiTelo.biome).toBe("water");
        expect(nasinPiTelo.tilesets).toEqual(
            expect.arrayContaining([
                "seasons/Tileset_Ground_Seasons",
                "seasons/Tileset_Road",
                "seasons/Tileset_Sand",
                "seasons/Tileset_TallGrass",
                "seasons/Tileset_Water",
            ]),
        );
        expect(nasinPiTelo.tilesets).not.toContain("core/Tileset_Ground");
    });

    it("T4-03: rivergate_approach has blocked water, encounter grass, and a playable sandbar route", () => {
        const below = requireTileGrid(
            nasinPiTelo.layers["Below Player"],
            "rivergate_approach Below Player",
        );
        const detail = requireTileGrid(
            nasinPiTelo.layers["Ground Detail"],
            "rivergate_approach Ground Detail",
        );

        const used = new Set(below.flat());
        expect([...used]).toEqual(expect.arrayContaining(["g", "f", "v", "d", "s", "w"]));
        expect(used.has("G")).toBe(false);
        expect(new Set(detail.flat())).toContain("G");
        expect(below.flat().filter(isBlockedWaterCell).length).toBeGreaterThanOrEqual(40);

        const markers = nasinPiTelo.layers.Objects ?? [];
        const finalTrigger = markers.find((marker) => marker.name === "final_boss_trigger");
        expect(finalTrigger).toMatchObject({ type: "Trigger", rect: [26, 5, 2, 3] });
        if (!finalTrigger || !("rect" in finalTrigger))
            throw new Error("expected final_boss_trigger rect");
        const [x0, y0, w, h] = finalTrigger.rect;
        for (let y = y0; y < y0 + h; y++) {
            for (let x = x0; x < x0 + w; x++) {
                expect(isBlockedWaterCell(below[y][x])).toBe(false);
            }
        }

        for (const marker of markers.filter(
            (marker) => marker.type === "NPC" || marker.type === "SpawnPoint",
        )) {
            if (!("at" in marker)) continue;
            const [x, y] = marker.at;
            expect(isBlockedWaterCell(below[y][x])).toBe(false);
        }
    });

    it("T4-03: rivergate_approach water palette points at a Tiled collision tile", () => {
        const waterTile = waterPalette.w;
        expect(waterTile.tsx).toBe("seasons/Tileset_Water");

        const tsx = readFileSync(
            resolve(
                __dirname,
                "../../public/assets/tilesets/seasons/Tiled/Tilesets/Tileset_Water.tsx",
            ),
            "utf8",
        );
        const tileBlock =
            new RegExp(`<tile id="${waterTile.local_id}"[\\s\\S]*?<\\/tile>`).exec(tsx)?.[0] ?? "";
        expect(tileBlock).toContain("<objectgroup");
    });

    it("T4-03/T4-04: water routes buffer path-to-water seams with sand shoulders", () => {
        for (const spec of [nasinPiTelo, maTelo]) {
            const below = spec.layers["Below Player"];
            if (!isTileGrid(below))
                throw new Error(`expected ${spec.id} Below Player to be a tile grid`);

            expect(hardWaterPathSeams(below), spec.id).toEqual([]);
        }
    });

    it("T4-04: lakehaven uses a lake-village tileset set instead of placeholder core grass", () => {
        expect(maTelo.biome).toBe("town");
        expect(maTelo.tilesets).toEqual(
            expect.arrayContaining([
                "seasons/Tileset_Ground_Seasons",
                "seasons/Tileset_Road",
                "seasons/Tileset_Sand",
                "seasons/Tileset_Water",
                collectionAtlasTileset("seasons/Objects_Buildings_Seasons"),
                collectionAtlasTileset("seasons/Objects_Trees_Seasons"),
            ]),
        );
        expect(maTelo.tilesets).not.toContain("core/Tileset_Ground");
    });

    it("T4-04: lakehaven is a no-encounter lake village with reachable story/shop markers", () => {
        const below = maTelo.layers["Below Player"];
        if (!isTileGrid(below)) throw new Error("expected lakehaven Below Player to be a tile grid");

        const used = new Set(below.flat());
        expect([...used]).toEqual(expect.arrayContaining(["g", "v", "s", "d", "p", "w"]));
        expect(used.has("G")).toBe(false);
        expect(maTelo.layers.Encounters ?? []).toHaveLength(0);
        expect(below.flat().filter(isBlockedWaterCell).length).toBeGreaterThanOrEqual(60);

        const markers = maTelo.layers.Objects ?? [];
        const npcMarkers = markers.filter((marker) => marker.type === "NPC");
        expect(npcMarkers.map((marker) => marker.name).sort()).toEqual([
            "jan-kala-lake",
            "jan-moku",
            "jan-olin-telo",
            "jan-sike-telo",
            "jan-telo",
        ]);
        expect(npcMarkers.find((marker) => marker.name === "jan-moku")).toMatchObject({
            props: { id: "jan_moku", dialog_id: "jan_moku_stall" },
        });
        expect(markers.find((marker) => marker.name === "warp_north")).toMatchObject({
            type: "Warp",
            rect: [15, 0, 1, 1],
            props: {
                target_map: "frostvale",
                target_spawn: "from_lakehaven",
                required_flag: "badge_telo",
            },
        });

        for (const marker of markers) {
            if ("at" in marker) {
                const [x, y] = marker.at;
                expect(below[y][x]).not.toBe("w");
            }
            if ("rect" in marker) {
                const [x0, y0, w, h] = marker.rect;
                for (let y = y0; y < y0 + h; y++) {
                    for (let x = x0; x < x0 + w; x++) expect(below[y][x]).not.toBe("w");
                }
            }
        }
    });

    it("T4-04: lakehaven includes visual village landmarks", () => {
        const world = maTelo.layers.World;
        if (!Array.isArray(world) || isTileGrid(world)) {
            throw new Error("expected lakehaven World to be placed town landmarks");
        }

        const placed = world.map((entry) => entry.tile);
        expect(placed).toEqual(expect.arrayContaining(["house_blue", "house_red", "market_stand"]));
        expect(placed.some((tile) => tile.startsWith("tree_"))).toBe(true);
        expect(placed.some((tile) => tile.startsWith("bush_"))).toBe(true);
    });

    it("T4-05: frostvale uses the snow tileset family instead of placeholder core grass", () => {
        expect(maLete.biome).toBe("ice");
        expect(maLete.tilesets).toEqual(
            expect.arrayContaining([
                "snow/Tileset_Ground_Snow",
                "snow/Tileset_Road",
                "snow/Tileset_Snow",
                "snow/Tileset_Fence_1_Snow",
                collectionAtlasTileset("snow/Objects_Buildings_Snow"),
                collectionAtlasTileset("snow/Objects_Props_Snow"),
                collectionAtlasTileset("snow/Objects_Rocks_Snow"),
                collectionAtlasTileset("snow/Objects_Trees_Snow"),
            ]),
        );
        expect(maLete.tilesets).not.toContain("core/Tileset_Ground");
    });

    it("T4-05: frostvale has cold village paint, encounter grass, and reachable story markers", () => {
        const below = requireTileGrid(maLete.layers["Below Player"], "frostvale Below Player");
        const detail = requireTileGrid(maLete.layers["Ground Detail"], "frostvale Ground Detail");

        const used = new Set(below.flat());
        expect([...used]).toEqual(expect.arrayContaining(["s", "i", "j", "r", "d"]));
        expect(used.has("G")).toBe(false);
        expect(detail.flat().filter((cell) => cell === "G").length).toBeGreaterThanOrEqual(30);
        expect(maLete.layers.Encounters ?? []).toHaveLength(2);

        for (const encounter of maLete.layers.Encounters ?? []) {
            const [x0, y0, w, h] = encounter.rect;
            for (let y = y0; y < y0 + h; y++) {
                for (let x = x0; x < x0 + w; x++) expect(detail[y][x]).toBe("G");
            }
        }

        const markers = maLete.layers.Objects ?? [];
        const npcMarkers = markers.filter((marker) => marker.type === "NPC");
        expect(npcMarkers.map((marker) => marker.name).sort()).toEqual([
            "jan-anpa",
            "jan-kasi",
            "jan-lete",
            "jan-poki-lete",
            "jan-suno-lete",
        ]);
        expect(markers.find((marker) => marker.name === "warp_north")).toMatchObject({
            type: "Warp",
            rect: [17, 0, 1, 1],
            props: {
                target_map: "dreadpeak_cavern",
                target_spawn: "from_frostvale",
                required_flag: "badge_lete",
            },
        });

        for (const marker of markers) {
            if ("at" in marker) {
                const [x, y] = marker.at;
                expect(detail[y][x]).not.toBe("G");
            }
            if ("rect" in marker) {
                const [x0, y0, w, h] = marker.rect;
                for (let y = y0; y < y0 + h; y++) {
                    for (let x = x0; x < x0 + w; x++) expect(detail[y][x]).not.toBe("G");
                }
            }
        }
    });

    it("T4-05: frostvale includes snow village landmarks and snow-family encounter fill", () => {
        const world = maLete.layers.World;
        if (!Array.isArray(world) || isTileGrid(world)) {
            throw new Error("expected frostvale World to be placed snow landmarks");
        }

        const placed = world.map((entry) => entry.tile);
        expect(placed).toEqual(
            expect.arrayContaining([
                "house_blue",
                "house_red",
                "well_snow",
                "fence_h",
                "crate_snow",
                "rock_ice",
            ]),
        );
        expect(placed.some((tile) => tile.startsWith("tree_"))).toBe(true);
        expect(placed.some((tile) => tile.startsWith("bush_"))).toBe(true);

        const tallGrassTile = icePalette.G;
        expect(tallGrassTile).toMatchObject({
            tsx: "snow/Tileset_Snow",
            local_id: 50,
            surface: "rough-grass",
            role: "encounter",
            walkable: true,
        });

        const tsx = readFileSync(
            resolve(
                __dirname,
                "../../public/assets/tilesets/snow/Tiled/Tilesets/Tileset_Snow.tsx",
            ),
            "utf8",
        );
        expect(tsx).toContain(`<tile id="${tallGrassTile.local_id}" probability="0"/>`);
        expect(tsx).not.toMatch(
            new RegExp(`<tile id="${tallGrassTile.local_id}"[\\s\\S]*?<objectgroup`),
        );
    });

    it("T4-06: highridge_pass uses the mountain tileset set instead of placeholder core grass", () => {
        expect(nenaSewi.biome).toBe("peak");
        expect(nenaSewi.tilesets).toEqual(
            expect.arrayContaining([
                "seasons/Tileset_Ground_Seasons",
                "seasons/Tileset_Road",
                "seasons/Tileset_TallGrass",
                "seasons/Tileset_RockSlope_2_Gray",
                collectionAtlasTileset("seasons/Objects_Rocks_Seasons"),
                collectionAtlasTileset("seasons/Objects_Trees_Seasons"),
            ]),
        );
        expect(nenaSewi.tilesets).not.toContain("core/Tileset_Ground");
    });

    it("T4-06: highridge_pass has blocked cliffs, encounter grass, and reachable gym markers", () => {
        const below = requireTileGrid(nenaSewi.layers["Below Player"], "highridge_pass Below Player");
        const detail = requireTileGrid(nenaSewi.layers["Ground Detail"], "highridge_pass Ground Detail");

        const used = new Set(below.flat());
        expect([...used]).toEqual(expect.arrayContaining(["g", "v", "d", "p", "c"]));
        expect(used.has("G")).toBe(false);
        expect(new Set(detail.flat())).toContain("G");
        expect(below.flat().filter((cell) => cell === "c").length).toBeGreaterThanOrEqual(100);
        expect(nenaSewi.layers.Encounters ?? []).toHaveLength(2);

        for (const encounter of nenaSewi.layers.Encounters ?? []) {
            const [x0, y0, w, h] = encounter.rect;
            for (let y = y0; y < y0 + h; y++) {
                for (let x = x0; x < x0 + w; x++) expect(detail[y][x]).toBe("G");
            }
        }

        const markers = nenaSewi.layers.Objects ?? [];
        expect(
            markers
                .filter((marker) => marker.type === "NPC")
                .map((marker) => marker.name)
                .sort(),
        ).toEqual(["jan-kala", "jan-kiwen", "jan-nasin-sewi", "jan-waso-sewi", "jan-wawa"]);
        expect(markers.find((marker) => marker.name === "warp_north")).toMatchObject({
            type: "Warp",
            rect: [24, 0, 1, 1],
            props: {
                target_map: "lakehaven",
                target_spawn: "from_highridge_pass",
                required_flag: "badge_sewi",
            },
        });

        for (const marker of markers) {
            if ("at" in marker) {
                const [x, y] = marker.at;
                expect(below[y][x]).not.toBe("c");
                expect(detail[y][x]).not.toBe("G");
            }
            if ("rect" in marker) {
                const [x0, y0, w, h] = marker.rect;
                for (let y = y0; y < y0 + h; y++) {
                    for (let x = x0; x < x0 + w; x++) {
                        expect(below[y][x]).not.toBe("c");
                        expect(detail[y][x]).not.toBe("G");
                    }
                }
            }
        }
    });

    it("T4-06: highridge_pass includes rock landmarks and cliff collision paint", () => {
        const world = nenaSewi.layers.World;
        if (!Array.isArray(world) || isTileGrid(world)) {
            throw new Error("expected highridge_pass World to be placed mountain landmarks");
        }

        const placed = world.map((entry) => entry.tile);
        expect(placed).toEqual(expect.arrayContaining(["rock_small", "rock_tall", "rock_grass"]));
        expect(placed.some((tile) => tile.startsWith("tree_"))).toBe(true);
        expect(placed.some((tile) => tile.startsWith("bush_"))).toBe(true);

        const cliffTile = mountainPalette.c;
        expect(cliffTile.tsx).toBe("seasons/Tileset_RockSlope_2_Gray");

        const tsx = readFileSync(
            resolve(
                __dirname,
                "../../public/assets/tilesets/seasons/Tiled/Tilesets/Tileset_RockSlope_2_Gray.tsx",
            ),
            "utf8",
        );
        const tileBlock =
            new RegExp(`<tile id="${cliffTile.local_id}"[\\s\\S]*?<\\/tile>`).exec(tsx)?.[0] ?? "";
        expect(tileBlock).toContain("<objectgroup");
    });

    it("T4-07: dreadpeak_cavern uses the fortress cave tileset set instead of placeholder core grass", () => {
        expect(nenaSuli.biome).toBe("cave");
        expect(nenaSuli.tilesets).toEqual(
            expect.arrayContaining([
                "fortress/Castle_Floor",
                "fortress/Tileset_RockSlope",
                "fortress/Tileset_Castle_Grass",
                "fortress/Animation_Torch_1",
            ]),
        );
        expect(nenaSuli.tilesets).not.toContain("core/Tileset_Ground");
    });

    it("T4-07: dreadpeak_cavern has blocked cave walls, encounter patches, and reachable peak markers", () => {
        const below = requireTileGrid(nenaSuli.layers["Below Player"], "dreadpeak_cavern Below Player");
        const detail = requireTileGrid(nenaSuli.layers["Ground Detail"], "dreadpeak_cavern Ground Detail");

        const used = new Set(below.flat());
        expect([...used]).toEqual(expect.arrayContaining(["f", "p", "v", "w"]));
        expect(used.has("G")).toBe(false);
        expect(new Set(detail.flat())).toContain("G");
        expect(below.flat().filter((cell) => cell === "w").length).toBeGreaterThanOrEqual(100);
        expect(nenaSuli.layers.Encounters ?? []).toHaveLength(2);

        for (const encounter of nenaSuli.layers.Encounters ?? []) {
            const [x0, y0, w, h] = encounter.rect;
            for (let y = y0; y < y0 + h; y++) {
                for (let x = x0; x < x0 + w; x++) expect(detail[y][x]).toBe("G");
            }
        }

        const markers = nenaSuli.layers.Objects ?? [];
        expect(
            markers
                .filter((marker) => marker.type === "NPC")
                .map((marker) => marker.name)
                .sort(),
        ).toEqual(["jan-kiwen-suli", "jan-pi-kon", "jan-pi-nasin", "jan-pimeja-suli", "jan-suli"]);
        expect(markers.find((marker) => marker.name === "warp_north")).toMatchObject({
            type: "Warp",
            rect: [8, 0, 1, 1],
            props: {
                target_map: "rivergate_approach",
                target_spawn: "from_dreadpeak_cavern",
                required_flag: "badge_suli",
            },
        });

        for (const marker of markers) {
            if ("at" in marker) {
                const [x, y] = marker.at;
                expect(below[y][x]).not.toBe("w");
                expect(detail[y][x]).not.toBe("G");
            }
            if ("rect" in marker) {
                const [x0, y0, w, h] = marker.rect;
                for (let y = y0; y < y0 + h; y++) {
                    for (let x = x0; x < x0 + w; x++) {
                        expect(below[y][x]).not.toBe("w");
                        expect(detail[y][x]).not.toBe("G");
                    }
                }
            }
        }
    });

    it("T4-07: dreadpeak_cavern includes torch landmarks and cave-wall collision paint", () => {
        const world = nenaSuli.layers.World;
        if (!Array.isArray(world) || isTileGrid(world)) {
            throw new Error("expected dreadpeak_cavern World to be placed cave landmarks");
        }

        const placed = world.map((entry) => entry.tile);
        expect(placed).toContain("torch");
        expect(placed).toContain("torch_wall");

        const wallTile = cavePalette.w;
        expect(wallTile.tsx).toBe("fortress/Tileset_RockSlope");

        const wallTsx = readFileSync(
            resolve(
                __dirname,
                "../../public/assets/tilesets/fortress/Tiled/Tilesets/Tileset_RockSlope.tsx",
            ),
            "utf8",
        );
        const wallBlock =
            new RegExp(`<tile id="${wallTile.local_id}"[\\s\\S]*?<\\/tile>`).exec(wallTsx)?.[0] ??
            "";
        expect(wallBlock).toContain("<objectgroup");

        const torchTsx = readFileSync(
            resolve(
                __dirname,
                "../../public/assets/tilesets/fortress/Tiled/Tilesets/Animation_Torch_1.tsx",
            ),
            "utf8",
        );
        const torchBlock =
            new RegExp(`<tile id="${cavePalette.torch.local_id}"[\\s\\S]*?<\\/tile>`).exec(
                torchTsx,
            )?.[0] ?? "";
        expect(torchBlock).toContain("<animation>");
    });
});
