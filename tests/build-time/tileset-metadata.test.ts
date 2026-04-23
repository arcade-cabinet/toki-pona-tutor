import { describe, expect, it } from "vitest";
import { resolve } from "node:path";
import canvasPkg from "canvas";
import { parseTsx } from "../../scripts/map-authoring/lib/parser";
import {
    classifyPaletteEntry,
    tileHasCollision,
    wangBridgeCandidatesForTileset,
    wangColorNamesForTile,
} from "../../scripts/map-authoring/lib/semantics";
import surfaceConfig from "../../scripts/map-authoring/config/fantasy-surfaces.json";
import { forestPalette } from "../../scripts/map-authoring/palettes/forest";
import { icePalette } from "../../scripts/map-authoring/palettes/ice";
import { mountainPalette } from "../../scripts/map-authoring/palettes/mountain";
import { waterPalette } from "../../scripts/map-authoring/palettes/water";
import { collectionAtlasEntry } from "../../scripts/map-authoring/config/collection-atlases";
import type { PaletteEntry, ParsedTileset } from "../../scripts/map-authoring/lib/types";

const { createCanvas, loadImage } = canvasPkg;
const SEASONS_TSX = resolve(__dirname, "../../public/assets/tilesets/seasons/Tiled/Tilesets");
const SNOW_TSX = resolve(__dirname, "../../public/assets/tilesets/snow/Tiled/Tilesets");
const GENERATED_TSX = resolve(__dirname, "../../public/assets/tilesets/generated/Tiled/Tilesets");
const WANG_EDGE_INDEX = {
    top: 0,
    right: 2,
    bottom: 4,
    left: 6,
} as const;

describe("TSX metadata parser", () => {
    it("parses image-collection collision objectgroups for trees and bushes", async () => {
        const trees = await parseTsx(resolve(SEASONS_TSX, "Objects_Trees_Seasons.tsx"));

        expect(trees.isCollection).toBe(true);
        expect(trees.perTileImages[32]).toMatchObject({ width: 64, height: 63 });
        expect(trees.objectGroups[32]).toHaveLength(1);
        expect(trees.objectGroups[32][0].polygon?.length).toBeGreaterThan(6);
        expect(tileHasCollision(trees, 32)).toBe(true);
    });

    it("builds render-safe generated atlases for collection-image landmarks", async () => {
        const trees = await parseTsx(
            resolve(GENERATED_TSX, "Atlas_Seasons_Objects_Trees_Seasons.tsx"),
        );
        const treeWide = collectionAtlasEntry("seasons/Objects_Trees_Seasons", 32);

        expect(trees.isCollection).toBe(false);
        expect(treeWide).toMatchObject({
            tsx: "generated/Atlas_Seasons_Objects_Trees_Seasons",
            local_id: 5,
        });
        expect(trees.image).toMatchObject({ width: 776, height: 248 });
        expect(trees.properties[treeWide.local_id]).toMatchObject({
            collides: true,
            source_tileset: "seasons/Objects_Trees_Seasons",
            source_local_id: 32,
            source_image_width: 64,
            source_image_height: 63,
            atlas_frame_width: 97,
            atlas_frame_height: 124,
        });
        expect(trees.objectGroups[treeWide.local_id]).toHaveLength(1);
        expect(tileHasCollision(trees, treeWide.local_id)).toBe(true);
    });

    it("uses transparent encounter overlays or biome-native solid fill tiles", async () => {
        const tallGrass = await parseTsx(resolve(SEASONS_TSX, "Tileset_TallGrass.tsx"));
        const snow = await parseTsx(resolve(SNOW_TSX, "Tileset_Snow.tsx"));

        for (const entry of [forestPalette.G, waterPalette.G, mountainPalette.G]) {
            expect(entry).toMatchObject({
                tsx: "seasons/Tileset_TallGrass",
                local_id: surfaceConfig.seasons.tallGrass.summer,
                surface: "rough-grass",
                role: "encounter",
                walkable: true,
            });
            expect(tileHasCollision(tallGrass, entry.local_id)).toBe(false);
            expect(await tileHasTransparentPixels(tallGrass, entry.local_id)).toBe(true);
        }

        expect(icePalette.G).toMatchObject({
            tsx: "snow/Tileset_Snow",
            local_id: surfaceConfig.snow.snow.roughEncounter,
            surface: "rough-grass",
            role: "encounter",
            walkable: true,
        });
        expect(wangColorNamesForTile(snow, icePalette.G.local_id)).toEqual(["Snow"]);
        expect(tileHasCollision(snow, icePalette.G.local_id)).toBe(false);
        expect(await tileHasTransparentPixels(snow, icePalette.G.local_id)).toBe(false);
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

    it("pins grass-dirt transition palette entries to the correct wang-facing edges", async () => {
        const ground = await parseTsx(resolve(SEASONS_TSX, "Tileset_Ground_Seasons.tsx"));

        expectWangEdges(ground, forestPalette.gd_n, {
            top: "Dirt",
            right: "Grass",
            bottom: "Grass",
            left: "Grass",
        });
        expectWangEdges(ground, forestPalette.gd_e, {
            top: "Grass",
            right: "Dirt",
            bottom: "Grass",
            left: "Grass",
        });
        expectWangEdges(ground, forestPalette.gd_s, {
            top: "Grass",
            right: "Grass",
            bottom: "Dirt",
            left: "Grass",
        });
        expectWangEdges(ground, forestPalette.gd_w, {
            top: "Grass",
            right: "Grass",
            bottom: "Grass",
            left: "Dirt",
        });
        expectWangEdges(ground, forestPalette.gd_ne, {
            top: "Dirt",
            right: "Dirt",
            bottom: "Grass",
            left: "Grass",
        });
        expectWangEdges(ground, forestPalette.gd_sw, {
            top: "Grass",
            right: "Grass",
            bottom: "Dirt",
            left: "Dirt",
        });
    });

    it("pins water-shore transition palette entries to the correct wang-facing edges", async () => {
        const water = await parseTsx(resolve(SEASONS_TSX, "Tileset_Water.tsx"));
        const waterConfig = surfaceConfig.seasons.water;

        expectWangEdges(water, sourceEntry(waterConfig.shoreTransitionSourceTiles.n), {
            top: "Empty",
            right: "Water",
            bottom: "Water",
            left: "Water",
        });
        expectWangEdges(water, sourceEntry(waterConfig.shoreTransitionSourceTiles.e), {
            top: "Water",
            right: "Empty",
            bottom: "Water",
            left: "Water",
        });
        expectWangEdges(water, sourceEntry(waterConfig.shoreTransitionSourceTiles.s), {
            top: "Water",
            right: "Water",
            bottom: "Empty",
            left: "Water",
        });
        expectWangEdges(water, sourceEntry(waterConfig.shoreTransitionSourceTiles.w), {
            top: "Water",
            right: "Water",
            bottom: "Water",
            left: "Empty",
        });
        expectWangEdges(water, sourceEntry(waterConfig.shoreTransitionSourceTiles.ne), {
            top: "Empty",
            right: "Empty",
            bottom: "Water",
            left: "Water",
        });
        expectWangEdges(water, sourceEntry(waterConfig.shoreTransitionSourceTiles.sw), {
            top: "Water",
            right: "Water",
            bottom: "Empty",
            left: "Empty",
        });
    });

    it("points water-shore palette entries at blocked generated composite tiles", async () => {
        const generated = await parseTsx(
            resolve(
                __dirname,
                "../../public/assets/tilesets/generated/Tiled/Tilesets/Tileset_Water_Shore_Seasons.tsx",
            ),
        );

        for (const entry of [
            waterPalette.ws_n,
            waterPalette.ws_e,
            waterPalette.ws_s,
            waterPalette.ws_w,
            waterPalette.ws_ne,
            waterPalette.ws_nw,
            waterPalette.ws_se,
            waterPalette.ws_sw,
        ]) {
            expect(entry.tsx).toBe("generated/Tileset_Water_Shore_Seasons");
            expect(tileHasCollision(generated, entry.local_id)).toBe(true);
            expect(entry).toMatchObject({
                surface: "deep-water",
                role: "transition",
                walkable: false,
            });
        }
    });
});

function sourceEntry(localId: number): PaletteEntry {
    return { tsx: "seasons/Tileset_Water", local_id: localId };
}

async function tileHasTransparentPixels(
    tileset: ParsedTileset,
    localId: number,
): Promise<boolean> {
    const image = await loadImage(tileset.image.absolutePath);
    const columns = tileset.columns;
    const x0 = (localId % columns) * tileset.tileWidth;
    const y0 = Math.floor(localId / columns) * tileset.tileHeight;
    const canvas = createCanvas(tileset.tileWidth, tileset.tileHeight);
    const context = canvas.getContext("2d");
    context.imageSmoothingEnabled = false;
    context.drawImage(
        image,
        x0,
        y0,
        tileset.tileWidth,
        tileset.tileHeight,
        0,
        0,
        tileset.tileWidth,
        tileset.tileHeight,
    );
    const imageData = context.getImageData(0, 0, tileset.tileWidth, tileset.tileHeight);

    for (let index = 3; index < imageData.data.length; index += 4) {
        if (imageData.data[index] < 255) return true;
    }
    return false;
}

function expectWangEdges(
    tileset: ParsedTileset,
    entry: PaletteEntry,
    expected: Record<keyof typeof WANG_EDGE_INDEX, string>,
): void {
    const wangset = tileset.wangsets[0];
    const tile = wangset.tiles.find((candidate) => candidate.tileid === entry.local_id);
    if (!tile) throw new Error(`no wang tile for local_id ${entry.local_id}`);
    const colorsByIndex = new Map(wangset.colors.map((color) => [color.index, color.name]));

    for (const [edge, index] of Object.entries(WANG_EDGE_INDEX)) {
        expect(colorsByIndex.get(tile.wangid[index]), `${entry.local_id}:${edge}`).toBe(
            expected[edge as keyof typeof WANG_EDGE_INDEX],
        );
    }
}
