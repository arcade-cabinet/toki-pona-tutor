import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import { parseTsx } from "../../scripts/map-authoring/lib/parser";
import {
    classifyPaletteEntry,
    tileHasCollision,
    wangBridgeCandidatesForTileset,
    wangColorNamesForTile,
} from "../../scripts/map-authoring/lib/semantics";

const SEASONS_TSX = resolve(__dirname, "../../public/assets/tilesets/seasons/Tiled/Tilesets");

describe("TSX metadata parser", () => {
    it("parses image-collection collision objectgroups for trees and bushes", async () => {
        const trees = await parseTsx(resolve(SEASONS_TSX, "Objects_Trees_Seasons.tsx"));

        expect(trees.isCollection).toBe(true);
        expect(trees.perTileImages[32]).toMatchObject({ width: 64, height: 63 });
        expect(trees.objectGroups[32]).toHaveLength(1);
        expect(trees.objectGroups[32][0].polygon?.length).toBeGreaterThan(6);
        expect(tileHasCollision(trees, 32)).toBe(true);
    });

    it("parses wangsets and probability hints from ground tilesets", async () => {
        const ground = await parseTsx(resolve(SEASONS_TSX, "Tileset_Ground_Seasons.tsx"));

        expect(ground.probabilities[384]).toBeCloseTo(0.3);
        expect(ground.wangsets[0].name).toBe("Grounds");
        expect(ground.wangsets[0].colors.map((color) => color.name)).toEqual(
            expect.arrayContaining(["Grass", "Light Grass", "Dark Grass", "Dirt"]),
        );
        expect(wangColorNamesForTile(ground, 50)).toEqual(["Grass"]);
        expect(
            wangBridgeCandidatesForTileset(ground).some(
                (candidate) =>
                    candidate.colors.includes("Grass") && candidate.colors.includes("Dirt"),
            ),
        ).toBe(true);
    });

    it("classifies authored palette entries into walkable surfaces and blockers", async () => {
        const ground = await parseTsx(resolve(SEASONS_TSX, "Tileset_Ground_Seasons.tsx"));
        const road = await parseTsx(resolve(SEASONS_TSX, "Tileset_Road.tsx"));
        const water = await parseTsx(resolve(SEASONS_TSX, "Tileset_Water.tsx"));

        expect(
            classifyPaletteEntry(
                "g",
                {
                    tsx: "seasons/Tileset_Ground_Seasons",
                    local_id: 50,
                    description: "summer grass",
                },
                ground,
            ),
        ).toMatchObject({ surface: "smooth-grass", role: "base", walkable: true });

        expect(
            classifyPaletteEntry(
                "d",
                { tsx: "seasons/Tileset_Road", local_id: 20, description: "packed dirt path" },
                road,
            ),
        ).toMatchObject({ surface: "dirt-path", walkable: true });

        expect(
            classifyPaletteEntry(
                "w",
                {
                    tsx: "seasons/Tileset_Water",
                    local_id: 26,
                    description: "blocked animated lake water",
                },
                water,
            ),
        ).toMatchObject({ surface: "deep-water", role: "blocker", walkable: false });
    });
});
