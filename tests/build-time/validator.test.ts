/**
 * Validator tests — spec-level sanity checks before emit.
 *
 * Covers: palette references resolve, grid dims match, objects uniquely
 * named, at least one SpawnPoint, encounter species exist, cell overdraw.
 *
 * See docs/build-time/MAP_AUTHORING.md § "The validator" and § "Tests".
 */
import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import { validateSpec } from "../../scripts/map-authoring/lib/validator";
import { parseTsx } from "../../scripts/map-authoring/lib/parser";
import type { MapSpec, ValidationIssue } from "../../scripts/map-authoring/lib/types";

const CORE_TSX = resolve(__dirname, "../../public/assets/tilesets/core/Tiled/Tilesets");
const SEASONS_TSX = resolve(__dirname, "../../public/assets/tilesets/seasons/Tiled/Tilesets");

describe("validateSpec — well-formed spec", () => {
    it("returns ok when nothing is wrong", async () => {
        const ground = await parseTsx(resolve(CORE_TSX, "Tileset_Ground.tsx"));
        const spec: MapSpec = {
            id: "good",
            biome: "town",
            music_track: "bgm_village",
            width: 2,
            height: 2,
            tileSize: 16,
            tilesets: ["Tileset_Ground"],
            palette: { g: { tsx: "Tileset_Ground", local_id: 0 } },
            layers: {
                "Below Player": [
                    ["g", "g"],
                    ["g", "g"],
                ],
                Objects: [{ type: "SpawnPoint", name: "default", at: [0, 0] }],
            },
        };
        const report = await validateSpec(spec, [ground], () => null);
        expect(report.ok).toBe(true);
        expect(report.issues).toEqual([]);
    });
});

describe("validateSpec — map metadata", () => {
    it("errors when biome is not supported", async () => {
        const ground = await parseTsx(resolve(CORE_TSX, "Tileset_Ground.tsx"));
        const spec: MapSpec = {
            id: "bad_biome",
            biome: "swamp" as MapSpec["biome"],
            music_track: "bgm_village",
            width: 2,
            height: 2,
            tileSize: 16,
            tilesets: ["Tileset_Ground"],
            palette: { g: { tsx: "Tileset_Ground", local_id: 0 } },
            layers: {
                "Below Player": [
                    ["g", "g"],
                    ["g", "g"],
                ],
                Objects: [{ type: "SpawnPoint", name: "default", at: [0, 0] }],
            },
        };

        const report = await validateSpec(spec, [ground], () => null);
        expect(report.ok).toBe(false);
        expect(
            report.issues.find((i: ValidationIssue) => i.code === "invalid_biome"),
        ).toBeDefined();
    });

    it("errors when music_track is not a supported ambient track", async () => {
        const ground = await parseTsx(resolve(CORE_TSX, "Tileset_Ground.tsx"));
        const spec: MapSpec = {
            id: "bad_music",
            biome: "town",
            music_track: "bgm_boss" as MapSpec["music_track"],
            width: 2,
            height: 2,
            tileSize: 16,
            tilesets: ["Tileset_Ground"],
            palette: { g: { tsx: "Tileset_Ground", local_id: 0 } },
            layers: {
                "Below Player": [
                    ["g", "g"],
                    ["g", "g"],
                ],
                Objects: [{ type: "SpawnPoint", name: "default", at: [0, 0] }],
            },
        };

        const report = await validateSpec(spec, [ground], () => null);
        expect(report.ok).toBe(false);
        expect(
            report.issues.find((i: ValidationIssue) => i.code === "invalid_music_track"),
        ).toBeDefined();
    });
});

describe("validateSpec — palette errors", () => {
    it("errors when a paint grid references an unknown palette name", async () => {
        const ground = await parseTsx(resolve(CORE_TSX, "Tileset_Ground.tsx"));
        const spec: MapSpec = {
            id: "unknown_palette",
            biome: "town",
            music_track: "bgm_village",
            width: 2,
            height: 2,
            tileSize: 16,
            tilesets: ["Tileset_Ground"],
            palette: { g: { tsx: "Tileset_Ground", local_id: 0 } },
            layers: {
                "Below Player": [
                    ["g", "huh"],
                    ["g", "g"],
                ],
                Objects: [{ type: "SpawnPoint", name: "default", at: [0, 0] }],
            },
        };
        const report = await validateSpec(spec, [ground], () => null);
        expect(report.ok).toBe(false);
        expect(
            report.issues.find((i: ValidationIssue) => /palette.*huh/i.test(i.message)),
        ).toBeDefined();
    });

    it("errors when a palette entry has out-of-range local_id", async () => {
        const ground = await parseTsx(resolve(CORE_TSX, "Tileset_Ground.tsx"));
        const spec: MapSpec = {
            id: "oor",
            biome: "town",
            music_track: "bgm_village",
            width: 1,
            height: 1,
            tileSize: 16,
            tilesets: ["Tileset_Ground"],
            palette: { bad: { tsx: "Tileset_Ground", local_id: 999_999 } },
            layers: {
                "Below Player": [["bad"]],
                Objects: [{ type: "SpawnPoint", name: "default", at: [0, 0] }],
            },
        };
        const report = await validateSpec(spec, [ground], () => null);
        expect(report.ok).toBe(false);
        expect(
            report.issues.find((i: ValidationIssue) => /local_id.*out of range/i.test(i.message)),
        ).toBeDefined();
    });
});

describe("validateSpec — grid dimensions", () => {
    it("errors when a paint grid row length mismatches width", async () => {
        const ground = await parseTsx(resolve(CORE_TSX, "Tileset_Ground.tsx"));
        const spec: MapSpec = {
            id: "bad_dims",
            biome: "town",
            music_track: "bgm_village",
            width: 3,
            height: 2,
            tileSize: 16,
            tilesets: ["Tileset_Ground"],
            palette: { g: { tsx: "Tileset_Ground", local_id: 0 } },
            layers: {
                "Below Player": [
                    ["g", "g"], // too short
                    ["g", "g", "g"],
                ],
                Objects: [{ type: "SpawnPoint", name: "default", at: [0, 0] }],
            },
        };
        const report = await validateSpec(spec, [ground], () => null);
        expect(report.ok).toBe(false);
        expect(
            report.issues.find((i: ValidationIssue) => /width|row/i.test(i.message)),
        ).toBeDefined();
    });
});

describe("validateSpec — SpawnPoint requirement", () => {
    it("errors when Objects layer has no SpawnPoint", async () => {
        const ground = await parseTsx(resolve(CORE_TSX, "Tileset_Ground.tsx"));
        const spec: MapSpec = {
            id: "no_spawn",
            biome: "town",
            music_track: "bgm_village",
            width: 2,
            height: 2,
            tileSize: 16,
            tilesets: ["Tileset_Ground"],
            palette: { g: { tsx: "Tileset_Ground", local_id: 0 } },
            layers: {
                "Below Player": [
                    ["g", "g"],
                    ["g", "g"],
                ],
                Objects: [{ type: "Sign", name: "welcome", at: [0, 0], props: { text: "hi" } }],
            },
        };
        const report = await validateSpec(spec, [ground], () => null);
        expect(report.ok).toBe(false);
        expect(
            report.issues.find((i: ValidationIssue) => /spawnpoint/i.test(i.message)),
        ).toBeDefined();
    });

    it("errors when Objects layer is missing entirely", async () => {
        const ground = await parseTsx(resolve(CORE_TSX, "Tileset_Ground.tsx"));
        const spec: MapSpec = {
            id: "no_objects",
            biome: "town",
            music_track: "bgm_village",
            width: 2,
            height: 2,
            tileSize: 16,
            tilesets: ["Tileset_Ground"],
            palette: { g: { tsx: "Tileset_Ground", local_id: 0 } },
            layers: {
                "Below Player": [
                    ["g", "g"],
                    ["g", "g"],
                ],
            },
        };
        const report = await validateSpec(spec, [ground], () => null);
        expect(report.ok).toBe(false);
        expect(
            report.issues.find((i: ValidationIssue) => /spawnpoint/i.test(i.message)),
        ).toBeDefined();
    });
});

describe("validateSpec — gameplay surface placement", () => {
    it("errors when an actor marker is placed on encounter grass", async () => {
        const ground = await parseTsx(resolve(CORE_TSX, "Tileset_Ground.tsx"));
        const tallGrass = await parseTsx(resolve(CORE_TSX, "Tileset_TallGrass.tsx"));
        const spec: MapSpec = {
            id: "actor_on_rough_grass",
            biome: "forest",
            music_track: "bgm_forest",
            width: 2,
            height: 2,
            tileSize: 16,
            tilesets: ["core/Tileset_Ground", "core/Tileset_TallGrass"],
            palette: {
                g: { tsx: "core/Tileset_Ground", local_id: 0 },
                G: {
                    tsx: "core/Tileset_TallGrass",
                    local_id: 0,
                    description: "encounter tall grass",
                },
            },
            layers: {
                "Below Player": [
                    ["G", "g"],
                    ["g", "g"],
                ],
                Objects: [{ type: "SpawnPoint", name: "default", at: [0, 0] }],
            },
        };

        const report = await validateSpec(spec, [ground, tallGrass], () => null);
        expect(report.ok).toBe(false);
        expect(report.issues.find((i) => i.code === "actor_on_bad_surface")).toBeDefined();
    });

    it("errors when an actor marker overlaps a collection-image collision footprint", async () => {
        const ground = await parseTsx(resolve(SEASONS_TSX, "Tileset_Ground_Seasons.tsx"));
        const trees = await parseTsx(resolve(SEASONS_TSX, "Objects_Trees_Seasons.tsx"));
        const spec: MapSpec = {
            id: "actor_under_tree",
            biome: "forest",
            music_track: "bgm_forest",
            width: 6,
            height: 4,
            tileSize: 16,
            tilesets: ["seasons/Tileset_Ground_Seasons", "seasons/Objects_Trees_Seasons"],
            palette: {
                g: {
                    tsx: "seasons/Tileset_Ground_Seasons",
                    local_id: 50,
                    description: "summer grass",
                },
                tree: {
                    tsx: "seasons/Objects_Trees_Seasons",
                    local_id: 32,
                    description: "wide emerald tree",
                },
            },
            layers: {
                "Below Player": [
                    ["g", "g", "g", "g", "g", "g"],
                    ["g", "g", "g", "g", "g", "g"],
                    ["g", "g", "g", "g", "g", "g"],
                    ["g", "g", "g", "g", "g", "g"],
                ],
                World: [{ at: [1, 2], tile: "tree" }],
                Objects: [{ type: "SpawnPoint", name: "default", at: [2, 2] }],
            },
        };

        const report = await validateSpec(spec, [ground, trees], () => null);
        expect(report.ok).toBe(false);
        expect(report.issues.find((i) => i.code === "actor_on_blocking_footprint")).toBeDefined();
    });

    it("errors when encounter grass overlaps tree visual footprint", async () => {
        const ground = await parseTsx(resolve(SEASONS_TSX, "Tileset_Ground_Seasons.tsx"));
        const tallGrass = await parseTsx(resolve(SEASONS_TSX, "Tileset_TallGrass.tsx"));
        const trees = await parseTsx(resolve(SEASONS_TSX, "Objects_Trees_Seasons.tsx"));
        const spec: MapSpec = {
            id: "encounter_under_tree",
            biome: "forest",
            music_track: "bgm_forest",
            width: 6,
            height: 4,
            tileSize: 16,
            tilesets: [
                "seasons/Tileset_Ground_Seasons",
                "seasons/Tileset_TallGrass",
                "seasons/Objects_Trees_Seasons",
            ],
            palette: {
                g: {
                    tsx: "seasons/Tileset_Ground_Seasons",
                    local_id: 50,
                    description: "summer grass",
                },
                G: {
                    tsx: "seasons/Tileset_TallGrass",
                    local_id: 0,
                    description: "encounter tall grass",
                },
                tree: {
                    tsx: "seasons/Objects_Trees_Seasons",
                    local_id: 32,
                    description: "wide emerald tree",
                },
            },
            layers: {
                "Below Player": [
                    ["g", "g", "g", "g", "g", "g"],
                    ["g", "g", "g", "g", "g", "g"],
                    ["g", "G", "G", "G", "g", "g"],
                    ["g", "g", "g", "g", "g", "g"],
                ],
                World: [{ at: [1, 2], tile: "tree" }],
                Objects: [{ type: "SpawnPoint", name: "default", at: [0, 0] }],
                Encounters: [
                    { rect: [1, 2, 3, 1], species: { soweli_seli: 1 }, levelRange: [1, 2] },
                ],
            },
        };

        const report = await validateSpec(spec, [ground, tallGrass, trees], (id) => ({ id }));
        expect(report.ok).toBe(false);
        expect(
            report.issues.find((i) => i.code === "encounter_under_visual_obstruction"),
        ).toBeDefined();
    });
});

describe("validateSpec — unique object names", () => {
    it("errors when two objects share a name in the same map", async () => {
        const ground = await parseTsx(resolve(CORE_TSX, "Tileset_Ground.tsx"));
        const spec: MapSpec = {
            id: "dup_names",
            biome: "town",
            music_track: "bgm_village",
            width: 2,
            height: 2,
            tileSize: 16,
            tilesets: ["Tileset_Ground"],
            palette: { g: { tsx: "Tileset_Ground", local_id: 0 } },
            layers: {
                "Below Player": [
                    ["g", "g"],
                    ["g", "g"],
                ],
                Objects: [
                    { type: "SpawnPoint", name: "here", at: [0, 0] },
                    { type: "SpawnPoint", name: "here", at: [1, 1] },
                ],
            },
        };
        const report = await validateSpec(spec, [ground], () => null);
        expect(report.ok).toBe(false);
        expect(
            report.issues.find((i: ValidationIssue) => /duplicate.*name.*here/i.test(i.message)),
        ).toBeDefined();
    });
});

describe("validateSpec — encounter species exist", () => {
    it("errors when an encounter zone references an unknown species", async () => {
        const ground = await parseTsx(resolve(CORE_TSX, "Tileset_Ground.tsx"));
        const spec: MapSpec = {
            id: "bad_encounter",
            biome: "town",
            music_track: "bgm_village",
            width: 2,
            height: 2,
            tileSize: 16,
            tilesets: ["Tileset_Ground"],
            palette: { g: { tsx: "Tileset_Ground", local_id: 0 } },
            layers: {
                "Below Player": [
                    ["g", "g"],
                    ["g", "g"],
                ],
                Objects: [{ type: "SpawnPoint", name: "default", at: [0, 0] }],
                Encounters: [
                    {
                        rect: [0, 0, 2, 2],
                        species: { nonexistent_species_zzz: 1 },
                        levelRange: [2, 4],
                    },
                ],
            },
        };
        const speciesLookup = (id: string) =>
            id === "soweli_seli" ? ({ id } as { id: string }) : null;
        const report = await validateSpec(spec, [ground], speciesLookup);
        expect(report.ok).toBe(false);
        expect(
            report.issues.find((i: ValidationIssue) => /species.*nonexistent/i.test(i.message)),
        ).toBeDefined();
    });

    it("accepts encounters with known species", async () => {
        const ground = await parseTsx(resolve(CORE_TSX, "Tileset_Ground.tsx"));
        const tallGrass = await parseTsx(resolve(CORE_TSX, "Tileset_TallGrass.tsx"));
        const spec: MapSpec = {
            id: "good_encounter",
            biome: "town",
            music_track: "bgm_village",
            width: 2,
            height: 2,
            tileSize: 16,
            tilesets: ["core/Tileset_Ground", "core/Tileset_TallGrass"],
            palette: {
                g: { tsx: "core/Tileset_Ground", local_id: 0 },
                G: {
                    tsx: "core/Tileset_TallGrass",
                    local_id: 0,
                    description: "encounter tall grass",
                },
            },
            layers: {
                "Below Player": [
                    ["g", "g"],
                    ["g", "G"],
                ],
                Objects: [{ type: "SpawnPoint", name: "default", at: [0, 0] }],
                Encounters: [
                    {
                        rect: [1, 1, 1, 1],
                        species: { soweli_seli: 3 },
                        levelRange: [2, 4],
                    },
                ],
            },
        };
        const speciesLookup = (id: string) =>
            id === "soweli_seli" ? ({ id } as { id: string }) : null;
        const report = await validateSpec(spec, [ground, tallGrass], speciesLookup);
        expect(report.ok).toBe(true);
    });
});
