import { type EventDefinition, RpgPlayer } from '@rpgjs/server';
import { preferences, KEYS } from '../../platform/persistence/preferences';
import { getFlag } from '../../platform/persistence/queries';
import { playDialog } from './dialog';
import { markSafeMapIfVillage } from './respawn';

export interface WarpOptions {
    targetMap: string;
    position?: { x: number; y: number };
    requiredFlag?: string;
    gatedDialogId?: string;
    /**
     * T3-07 loading overlay — when set, the engine shows this
     * label briefly before + after the transition. Typically a
     * single TP word identifying the destination biome (e.g.
     * `ma lete` for the cold village). Keeps mobile users oriented
     * when tapping through dialog.
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

            // T3-07: brief loading-label toast before the transition.
            // Uses native showText (brand-styled via brand.css) rather
            // than a custom overlay so mobile users get a clear moment
            // even on slow devices where the changeMap reshuffle is
            // perceptible. Best-effort; a showText failure must not
            // block the teleport.
            if (opts.loadingLabel) {
                try {
                    await player.showText(opts.loadingLabel);
                } catch {
                    /* best-effort */
                }
            }

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
                console.warn(`[warp] Failed to persist currentMapId for ${opts.targetMap}:`, err);
            }
        },
    };
}
