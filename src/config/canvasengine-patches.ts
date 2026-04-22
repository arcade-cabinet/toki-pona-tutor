import { createComponent } from "canvasengine";
import {
    patchViewportMaskConstructor,
    type ViewportComponentConstructor,
} from "./canvasengine-mask";
import {
    patchSpriteDeferredAssetCleanupConstructor,
    patchSpriteHitboxAnchorConstructor,
    type SpriteAssetTrackerComponentConstructor,
    type SpriteComponentConstructor,
} from "./canvasengine-sprite";

type CanvasElementWithInstance = {
    componentInstance?: {
        constructor?: unknown;
    };
};

/**
 * CanvasEngine's current Viewport implementation still uses Pixi's deprecated
 * beginFill/drawRect/endFill trio in updateMask(). Replace only that method
 * with the Pixi 8 rect().fill() path so dev/test logs stay useful.
 */
export function installCanvasViewportMaskPatch(): void {
    const viewportClass = resolveRegisteredViewportClass();

    patchViewportMaskConstructor(viewportClass);
}

export function installCanvasSpriteHitboxAnchorPatch(): void {
    const spriteClass = resolveRegisteredSpriteClass();

    patchSpriteHitboxAnchorConstructor(spriteClass);
}

export function installCanvasSpriteDeferredAssetCleanupPatch(): void {
    const spriteClass = resolveRegisteredSpriteClass();

    patchSpriteDeferredAssetCleanupConstructor(spriteClass);
}

export function resolveRegisteredViewportClass(): ViewportComponentConstructor {
    const probe = createComponent("Viewport") as CanvasElementWithInstance;
    const viewportClass = probe.componentInstance?.constructor as
        | ViewportComponentConstructor
        | undefined;
    if (!viewportClass?.prototype?.updateMask) {
        throw new Error("CanvasEngine Viewport component class could not be resolved");
    }

    return viewportClass;
}

export function resolveRegisteredSpriteClass(): SpriteAssetTrackerComponentConstructor {
    const probe = createComponent("Sprite") as CanvasElementWithInstance;
    const spriteClass = probe.componentInstance?.constructor as
        | SpriteAssetTrackerComponentConstructor
        | undefined;
    if (!spriteClass?.prototype?.applyHitboxAnchor || !spriteClass.prototype.onDestroy) {
        throw new Error("CanvasEngine Sprite component class could not be resolved");
    }

    return spriteClass;
}

export { patchSpriteDeferredAssetCleanupConstructor, patchSpriteHitboxAnchorConstructor };
