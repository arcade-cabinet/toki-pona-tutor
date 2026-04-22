export type SpriteComponentConstructor = {
    __pokiHitboxAnchorPatchInstalled?: boolean;
    prototype: {
        applyHitboxAnchor: (width: number, height: number, realSize?: unknown) => void;
    };
};

export type SpriteAssetTrackerComponentConstructor = SpriteComponentConstructor & {
    __pokiAssetTrackerPatchInstalled?: boolean;
    prototype: SpriteComponentConstructor["prototype"] & {
        onDestroy: (parent: unknown, afterDestroy: () => void) => Promise<void>;
    };
};

type SpriteInstanceWithAnchor = {
    destroyed?: boolean;
    anchor?: {
        set?: (...args: number[]) => void;
    } | null;
};

type GlobalAssetLoaderLike = {
    removeAsset?: (assetId: string) => void;
};

type SpriteInstanceWithTrackedAssets = {
    globalLoader?: GlobalAssetLoaderLike | null;
    trackedAssetIds?: Set<string>;
};

export function patchSpriteHitboxAnchorConstructor(spriteClass: SpriteComponentConstructor): void {
    if (spriteClass.__pokiHitboxAnchorPatchInstalled) {
        return;
    }

    const applyHitboxAnchor = spriteClass.prototype.applyHitboxAnchor;

    spriteClass.prototype.applyHitboxAnchor = function patchedApplyHitboxAnchor(
        this: SpriteInstanceWithAnchor,
        width: number,
        height: number,
        realSize?: unknown,
    ): void {
        if (this.destroyed || !this.anchor?.set) {
            return;
        }

        return applyHitboxAnchor.call(this, width, height, realSize);
    };

    spriteClass.__pokiHitboxAnchorPatchInstalled = true;
}

/**
 * CanvasEngine removes sprite asset IDs as soon as a component is destroyed.
 * Pixi can still finish the async load callback after a fast map change, which
 * makes CanvasEngine warn that a valid late asset is "not found in tracker".
 * Defer cleanup long enough for those callbacks to settle, then remove the IDs.
 */
export function patchSpriteDeferredAssetCleanupConstructor(
    spriteClass: SpriteAssetTrackerComponentConstructor,
): void {
    if (spriteClass.__pokiAssetTrackerPatchInstalled) {
        return;
    }

    const onDestroy = spriteClass.prototype.onDestroy;

    spriteClass.prototype.onDestroy = async function patchedSpriteOnDestroy(
        this: SpriteInstanceWithTrackedAssets,
        parent: unknown,
        afterDestroy: () => void,
    ): Promise<void> {
        const loader = this.globalLoader;
        const trackedAssetIds = this.trackedAssetIds;
        const deferredAssetIds = trackedAssetIds ? Array.from(trackedAssetIds) : [];

        trackedAssetIds?.clear();
        const result = await onDestroy.call(this, parent, afterDestroy);

        if (loader?.removeAsset && deferredAssetIds.length > 0) {
            setTimeout(() => {
                for (const assetId of deferredAssetIds) {
                    loader.removeAsset?.(assetId);
                }
            }, 5_000);
        }

        return result;
    };

    spriteClass.__pokiAssetTrackerPatchInstalled = true;
}
