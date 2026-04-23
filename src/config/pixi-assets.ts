import { Assets } from "pixi.js";
import { PIXI_GUARDED_FX_ALIASES } from "../content/gameplay";
import { publicAssetPath } from "./asset-paths";

const GUARDED_FX_ALIASES = new Set(PIXI_GUARDED_FX_ALIASES);

type PixiAssetLike = {
    alias?: string | string[];
    src?: unknown;
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

function guardedFxSource(alias: string): string | undefined {
    switch (alias) {
        case "fx_settings":
            return "default-bundle.json";
        case "fx_spritesheet":
            return "revoltfx-spritesheet.json";
        default:
            return undefined;
    }
}

export function normalizePixiFxAssetSource(
    asset: unknown,
    baseUrl = import.meta.env.BASE_URL,
): unknown {
    if (!asset || typeof asset !== "object") {
        return asset;
    }

    const candidate = asset as PixiAssetLike;
    const aliases = Array.isArray(candidate.alias)
        ? candidate.alias
        : typeof candidate.alias === "string"
          ? [candidate.alias]
          : [];
    const guardedSource = aliases.map(guardedFxSource).find((source) => source !== undefined);

    if (!guardedSource) {
        return asset;
    }

    return {
        ...candidate,
        src: publicAssetPath(guardedSource, baseUrl),
    };
}

/**
 * CanvasEngine presets currently re-add the same RevoltFX aliases on every
 * client boot, which makes Pixi warn loudly in dev/test runs. The underlying
 * assets are static, so once those aliases exist we can safely skip the
 * duplicate registration instead of re-overwriting them. The same preset also
 * hardcodes root-relative JSON URLs; normalize those through Vite's base so
 * GitHub Pages and Capacitor load the placeholder bundle from the deployed app
 * root instead of the domain root.
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
        const assets = (Array.isArray(input) ? input : [input]).map((asset) =>
            normalizePixiFxAssetSource(asset),
        );
        const filtered = assets.filter(
            (asset) =>
                !shouldSkipPixiAssetAdd(asset as PixiAssetLike, (alias) =>
                    Assets.resolver.hasKey(alias),
                ),
        );

        if (filtered.length === 0) {
            return;
        }

        const normalizedInput = Array.isArray(input) ? filtered : filtered[0];

        return originalAdd(normalizedInput as Parameters<typeof Assets.add>[0]);
    }) as typeof Assets.add;

    guardedAssets.__pokiFxAliasGuardInstalled = true;
}
