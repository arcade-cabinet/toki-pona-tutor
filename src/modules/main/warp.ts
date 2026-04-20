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
