import { Assets } from "pixi.js";
import { PIXI_GUARDED_FX_ALIASES } from "../content/gameplay";

const GUARDED_FX_ALIASES = new Set(PIXI_GUARDED_FX_ALIASES);

type PixiAssetLike = {
    alias?: string | string[];
};

export function shouldSkipPixiAssetAdd(
    asset: unknown,
    hasKey: (alias: string) => boolean,
): boolean {
    if (!asset || typeof asset !== "object") return false;
    const alias = (asset as PixiAssetLike).alias;
    const rawAliases = Array.isArray(alias) ? alias : typeof alias === "string" ? [alias] : [];
    const guardedAliases = rawAliases.filter((alias) => GUARDED_FX_ALIASES.has(alias));
    if (guardedAliases.length === 0) {
        return false;
    }
    return rawAliases.every((alias) => hasKey(alias));
}

/**
 * CanvasEngine presets currently re-add the same RevoltFX aliases on every
 * client boot, which makes Pixi warn loudly in dev/test runs. The underlying
 * assets are static, so once those aliases exist we can safely skip the
 * duplicate registration instead of re-overwriting them.
 */
export function installPixiFxAliasGuard(): void {
    const guardedAssets = Assets as typeof Assets & {
        __pokiFxAliasGuardInstalled?: boolean;
    };

    if (guardedAssets.__pokiFxAliasGuardInstalled) {
        return;
    }

    const originalAdd = Assets.add.bind(Assets);

    guardedAssets.add = ((input: unknown) => {
        const assets = Array.isArray(input) ? input : [input];
        const filtered = assets.filter(
            (asset) =>
                !shouldSkipPixiAssetAdd(asset as PixiAssetLike, (alias) =>
                    Assets.resolver.hasKey(alias),
                ),
        );

        if (filtered.length === 0) {
            return;
        }

        return originalAdd(Array.isArray(input) ? filtered : filtered[0]);
    }) as typeof Assets.add;

    guardedAssets.__pokiFxAliasGuardInstalled = true;
}
