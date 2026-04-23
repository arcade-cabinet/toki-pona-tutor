import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
    normalizePixiFxAssetSource,
    publicAssetUrl,
    shouldSkipPixiAssetAdd,
} from "../../src/config/pixi-assets";

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
        expect(shouldSkipPixiAssetAdd("green_dragon_idle", () => true)).toBe(false);
        expect(shouldSkipPixiAssetAdd({ alias: "fx_settings" }, () => false)).toBe(false);
        expect(
            shouldSkipPixiAssetAdd(
                { alias: ["fx_settings", "fx_spritesheet"] },
                (alias) => alias === "fx_settings",
            ),
        ).toBe(false);
        expect(
            shouldSkipPixiAssetAdd(
                { alias: ["fx_settings", "game_sprite"] },
                (alias) => alias === "fx_settings",
            ),
        ).toBe(false);
    });

    it("resolves CanvasEngine's hardcoded RevoltFX assets through the deployed base path", () => {
        expect(publicAssetUrl("/default-bundle.json", "/poki-soweli/")).toBe(
            "/poki-soweli/default-bundle.json",
        );
        expect(publicAssetUrl("revoltfx-spritesheet.json", "./")).toBe(
            "./revoltfx-spritesheet.json",
        );

        expect(
            normalizePixiFxAssetSource(
                { alias: "fx_settings", src: "/default-bundle.json" },
                "/poki-soweli/",
            ),
        ).toEqual({ alias: "fx_settings", src: "/poki-soweli/default-bundle.json" });
        expect(
            normalizePixiFxAssetSource(
                { alias: "fx_spritesheet", src: "/revoltfx-spritesheet.json" },
                "/poki-soweli/",
            ),
        ).toEqual({
            alias: "fx_spritesheet",
            src: "/poki-soweli/revoltfx-spritesheet.json",
        });
    });

    it("leaves unrelated Pixi assets unchanged", () => {
        const asset = { alias: "green_dragon_idle", src: "/assets/bosses/green-dragon/idle.png" };

        expect(normalizePixiFxAssetSource(asset, "/poki-soweli/")).toBe(asset);
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
