import { describe, expect, it } from "vitest";
import { sanitizeTiledMapForCanvasPreset } from "../../src/config/tiled-map-sanitize";

describe("tiled map render sanitization", () => {
    it("removes collection-of-images tilesets from render data without mutating physics data", () => {
        const parsedMap = {
            tilesets: [
                {
                    firstgid: 1,
                    tilecount: 4,
                    image: { source: "atlas.png" },
                    tiles: [],
                },
                {
                    firstgid: 10,
                    tilecount: 3,
                    tiles: [
                        { id: 0, image: { source: "tree.png" } },
                        { id: 2, image: { source: "rock.png" } },
                    ],
                },
            ],
            layers: [
                { type: "tilelayer", data: [1, 10, 12, 0] },
                { type: "objectgroup", objects: [{ name: "tree", gid: 10 }] },
            ],
        };

        const renderMap = sanitizeTiledMapForCanvasPreset(parsedMap);

        expect(renderMap.tilesets).toHaveLength(1);
        expect(renderMap.layers[0].data).toEqual([1, 0, 0, 0]);
        expect(renderMap.layers[1].objects[0]).toMatchObject({ name: "tree", gid: 0 });
        expect(parsedMap.tilesets).toHaveLength(2);
        expect(parsedMap.layers[0].data).toEqual([1, 10, 12, 0]);
    });
});
