import { describe, expect, it, vi } from "vitest";
import {
    applyViewportMaskRect,
    patchViewportMaskConstructor,
} from "../../src/config/canvasengine-mask";
import {
    patchSpriteDeferredAssetCleanupConstructor,
    patchSpriteHitboxAnchorConstructor,
} from "../../src/config/canvasengine-sprite";

describe("canvasengine viewport mask patch", () => {
    it("rebuilds the mask rectangle with Pixi 8 rect/fill calls", () => {
        const calls: string[] = [];
        const target = {
            viewport: {
                screenWidth: 320,
                screenHeight: 180,
            },
            mask: {
                clear: vi.fn(() => {
                    calls.push("clear");
                }),
                rect: vi.fn((_x: number, _y: number, _w: number, _h: number) => {
                    calls.push("rect");
                }),
                fill: vi.fn((_style: number | { color: number }) => {
                    calls.push("fill");
                }),
            },
        };

        applyViewportMaskRect(target);

        expect(calls).toEqual(["clear", "rect", "fill"]);
        expect(target.mask.rect).toHaveBeenCalledWith(0, 0, 320, 180);
        expect(target.mask.fill).toHaveBeenCalledWith(0xffffff);
    });

    it("patches a viewport constructor only once", () => {
        class ViewportComponent {
            updateMask(): void {
                throw new Error("deprecated mask path");
            }
        }

        const viewportClass = ViewportComponent as typeof ViewportComponent & {
            __pokiMaskPatchInstalled?: boolean;
            prototype: {
                updateMask: () => void;
            };
        };

        patchViewportMaskConstructor(viewportClass);
        const patched = viewportClass.prototype.updateMask;
        patchViewportMaskConstructor(viewportClass);

        expect(viewportClass.prototype.updateMask).toBe(patched);
        expect(viewportClass.__pokiMaskPatchInstalled).toBe(true);
    });
});

describe("canvasengine sprite hitbox-anchor patch", () => {
    it("ignores late hitbox anchors after Pixi has destroyed the sprite anchor", () => {
        const calls: string[] = [];

        class SpriteComponent {
            applyHitboxAnchor(): void {
                calls.push("original");
            }
        }

        const spriteClass = SpriteComponent as typeof SpriteComponent & {
            __pokiHitboxAnchorPatchInstalled?: boolean;
            prototype: {
                applyHitboxAnchor: (width: number, height: number, realSize?: unknown) => void;
            };
        };

        patchSpriteHitboxAnchorConstructor(spriteClass);

        spriteClass.prototype.applyHitboxAnchor.call({ destroyed: true, anchor: null }, 16, 16);
        spriteClass.prototype.applyHitboxAnchor.call({ anchor: null }, 16, 16);
        spriteClass.prototype.applyHitboxAnchor.call({ anchor: { set: () => undefined } }, 16, 16);

        expect(calls).toEqual(["original"]);
        expect(spriteClass.__pokiHitboxAnchorPatchInstalled).toBe(true);
    });
});

describe("canvasengine sprite asset-tracker patch", () => {
    it("defers asset cleanup so late load callbacks do not hit removed tracker IDs", async () => {
        vi.useFakeTimers();

        const removed: string[] = [];

        class SpriteComponent {
            async onDestroy(_parent: unknown, afterDestroy: () => void): Promise<void> {
                for (const assetId of this.trackedAssetIds) {
                    this.globalLoader.removeAsset(assetId);
                }
                afterDestroy();
            }

            globalLoader = {
                removeAsset: (assetId: string) => {
                    removed.push(assetId);
                },
            };

            trackedAssetIds = new Set(["asset_1_late.png"]);
        }

        const spriteClass = SpriteComponent as typeof SpriteComponent & {
            __pokiAssetTrackerPatchInstalled?: boolean;
            prototype: {
                applyHitboxAnchor: (width: number, height: number, realSize?: unknown) => void;
                onDestroy: (parent: unknown, afterDestroy: () => void) => Promise<void>;
            };
        };
        spriteClass.prototype.applyHitboxAnchor = () => undefined;

        patchSpriteDeferredAssetCleanupConstructor(spriteClass);
        const sprite = new SpriteComponent();
        const afterDestroy = vi.fn();

        await sprite.onDestroy(null, afterDestroy);

        expect(afterDestroy).toHaveBeenCalledOnce();
        expect(removed).toEqual([]);
        expect(sprite.trackedAssetIds.size).toBe(0);

        await vi.advanceTimersByTimeAsync(5_000);

        expect(removed).toEqual(["asset_1_late.png"]);
        expect(spriteClass.__pokiAssetTrackerPatchInstalled).toBe(true);

        vi.useRealTimers();
    });
});
