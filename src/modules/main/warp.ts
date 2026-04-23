import { type EventDefinition, RpgPlayer } from "@rpgjs/server";
import { preferences, KEYS } from "../../platform/persistence/preferences";
import { getFlag } from "../../platform/persistence/queries";
import { SFX_CUE_CONFIG } from "../../content/gameplay";
import { playDialog } from "./dialog";
import { markSafeMapIfVillage } from "./respawn";
import { cueSfx } from "./audio-cues";
import {
    buildWarpLoadingView,
    WARP_LOADING_ENTER_MS,
    WARP_LOADING_GUI_ID,
    WARP_LOADING_SETTLE_MS,
    type WarpLoadingPhase,
    type WarpLoadingView,
} from "./warp-loading";

export interface WarpOptions {
    targetMap: string;
    position?: { x: number; y: number };
    requiredFlag?: string;
    gatedDialogId?: string;
    /**
     * Optional override for the loading overlay destination label.
     * When omitted, `warp-loading.ts` derives a readable label from
     * the target map id.
     */
    loadingLabel?: string;
}

export function Warp(opts: WarpOptions): EventDefinition {
    return {
        async onPlayerTouch(player: RpgPlayer) {
            if (opts.requiredFlag) {
                const flag = await getFlag(opts.requiredFlag);
                if (!flag) {
                    if (opts.gatedDialogId) await playDialog(player, opts.gatedDialogId);
                    return;
                }
            }
            const position = opts.position ?? { x: 32, y: 96 };
            await cueSfx(player, SFX_CUE_CONFIG.warp);

            const loadingGui = await openWarpLoading(player, opts, "enter");
            try {
                if (loadingGui) await delay(WARP_LOADING_ENTER_MS);

                // Map transition is critical — rethrow so the RPG.js event system
                // surfaces the failure.
                try {
                    await player.changeMap(opts.targetMap, position);
                } catch (err) {
                    console.error(`[warp] changeMap failed for ${opts.targetMap}:`, err);
                    throw err;
                }
                // Persistence writes are best-effort: the player is already on
                // the new map so a failed preference write must not roll back the
                // teleport.
                try {
                    await preferences.set(KEYS.currentMapId, opts.targetMap);
                    await markSafeMapIfVillage(opts.targetMap);
                } catch (err) {
                    console.warn(
                        `[warp] Failed to persist currentMapId for ${opts.targetMap}:`,
                        err,
                    );
                }

                if (loadingGui) {
                    await updateWarpLoading(loadingGui, opts, "settle");
                    await delay(WARP_LOADING_SETTLE_MS);
                }
            } finally {
                if (loadingGui) await closeWarpLoading(loadingGui);
            }
        },
    };
}

type WarpLoadingGui = {
    open: (data: WarpLoadingView, options?: { blockPlayerInput?: boolean }) => Promise<unknown>;
    update?: (data: WarpLoadingView) => unknown;
    close?: () => unknown;
};

async function openWarpLoading(
    player: RpgPlayer,
    opts: WarpOptions,
    phase: WarpLoadingPhase,
): Promise<WarpLoadingGui | null> {
    if (isVitestRuntime()) return null;
    try {
        const gui = player.gui(WARP_LOADING_GUI_ID) as unknown as WarpLoadingGui | null;
        if (!gui || typeof gui.open !== "function") return null;
        await gui.open(
            buildWarpLoadingView({
                targetMap: opts.targetMap,
                label: opts.loadingLabel,
                phase,
            }),
            {
                blockPlayerInput: true,
            },
        );
        return gui;
    } catch {
        return null;
    }
}

async function updateWarpLoading(
    gui: WarpLoadingGui,
    opts: WarpOptions,
    phase: WarpLoadingPhase,
): Promise<void> {
    try {
        await Promise.resolve(
            gui.update?.(
                buildWarpLoadingView({
                    targetMap: opts.targetMap,
                    label: opts.loadingLabel,
                    phase,
                }),
            ),
        );
    } catch {
        /* best-effort */
    }
}

async function closeWarpLoading(gui: WarpLoadingGui): Promise<void> {
    try {
        await Promise.resolve(gui.close?.());
    } catch {
        /* best-effort */
    }
}

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isVitestRuntime(): boolean {
    return typeof process !== "undefined" && process.env.VITEST === "true";
}
