import { describe, expect, it } from "vitest";
import { readTiledObjectProperty, readTiledObjectType } from "../../src/config/tiled-object";

describe("Tiled object helpers", () => {
    it("reads object properties from Tiled's TMJ property array shape", () => {
        const object = {
            properties: [
                { name: "type", type: "string", value: "Encounter" },
                { name: "level_min", type: "int", value: 3 },
            ],
        };

        expect(readTiledObjectProperty(object, "level_min")).toBe(3);
        expect(readTiledObjectType(object)).toBe("Encounter");
    });

    it("keeps the record shape used by tests and runtime shims working", () => {
        const object = {
            properties: {
                type: "Warp",
                target_map: "nasin_wan",
            },
        };

        expect(readTiledObjectProperty(object, "target_map")).toBe("nasin_wan");
        expect(readTiledObjectType(object)).toBe("Warp");
    });
});
