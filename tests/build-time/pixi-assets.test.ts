import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { shouldSkipPixiAssetAdd } from "../../src/config/pixi-assets";

const ROOT = resolve(__dirname, "../..");

describe("pixi fx alias guard", () => {
    it("skips duplicate revolt-fx aliases once both are already registered", () => {
        expect(
            shouldSkipPixiAssetAdd({ alias: "fx_settings" }, (alias) => alias === "fx_settings"),
        ).toBe(true);
        expect(
            shouldSkipPixiAssetAdd(
                { alias: "fx_spritesheet" },
                (alias) => alias === "fx_spritesheet",
            ),
        ).toBe(true);
    });

    it("does not skip unrelated or first-time asset registrations", () => {
        expect(shouldSkipPixiAssetAdd({ alias: "green_dragon_idle" }, () => false)).toBe(false);
        expect(shouldSkipPixiAssetAdd({ alias: "fx_settings" }, () => false)).toBe(false);
        expect(
            shouldSkipPixiAssetAdd(
                { alias: ["fx_settings", "fx_spritesheet"] },
                (alias) => alias === "fx_settings",
            ),
        ).toBe(false);
    });

    it("ships the RevoltFX placeholder assets fetched by CanvasEngine boot", () => {
        const defaultBundle = JSON.parse(
            readFileSync(resolve(ROOT, "public/default-bundle.json"), "utf8"),
        ) as {
            emitters: unknown[];
            sequences: unknown[];
            spritesheetFilter: string;
        };
        const spritesheet = JSON.parse(
            readFileSync(resolve(ROOT, "public/revoltfx-spritesheet.json"), "utf8"),
        ) as {
            frames: Record<string, unknown>;
            meta: { image: string };
        };

        expect(defaultBundle.emitters).toEqual([]);
        expect(defaultBundle.sequences).toEqual([]);
        expect(defaultBundle.spritesheetFilter).toBe("fx_");
        expect(Object.keys(spritesheet.frames)).toEqual(["fx_placeholder"]);
        expect(spritesheet.meta.image).toBe("assets/effects/dirt.png");
        expect(existsSync(resolve(ROOT, "public", spritesheet.meta.image))).toBe(true);
    });
});
