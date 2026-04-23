import { describe, expect, it } from "vitest";
import { computeMapViewportZoom } from "../../src/config/map-viewport";

const config = {
    desktopZoom: 3,
    mobileZoom: 3,
    minTileScreenPx: 56,
    maxZoom: 5,
};

describe("computeMapViewportZoom", () => {
    it("keeps ordinary maps at the configured readable zoom", () => {
        expect(
            computeMapViewportZoom({
                config,
                tilePx: 16,
                mapPixels: { width: 512, height: 512 },
                viewportPixels: { width: 800, height: 600 },
                mobilePointer: false,
            }),
        ).toBe(3.5);
    });

    it("zooms small maps up to cover the viewport instead of leaving stage matte", () => {
        expect(
            computeMapViewportZoom({
                config,
                tilePx: 16,
                mapPixels: { width: 256, height: 192 },
                viewportPixels: { width: 1280, height: 720 },
                mobilePointer: false,
            }),
        ).toBe(5);
    });

    it("uses the mobile baseline while still respecting readability and cover constraints", () => {
        expect(
            computeMapViewportZoom({
                config,
                tilePx: 16,
                mapPixels: { width: 448, height: 224 },
                viewportPixels: { width: 390, height: 844 },
                mobilePointer: true,
            }),
        ).toBeCloseTo(844 / 224, 4);
    });

    it("caps extreme cover requests at maxZoom", () => {
        expect(
            computeMapViewportZoom({
                config,
                tilePx: 16,
                mapPixels: { width: 160, height: 160 },
                viewportPixels: { width: 1920, height: 1080 },
                mobilePointer: false,
            }),
        ).toBe(5);
    });
});
