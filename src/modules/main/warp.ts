import { type EventDefinition, RpgPlayer } from '@rpgjs/server';
import { preferences, KEYS } from '../../platform/persistence/preferences';
import { getFlag } from '../../platform/persistence/queries';
import { playDialog } from './dialog';

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
            await player.changeMap(opts.targetMap, position);
            await preferences.set(KEYS.currentMapId, opts.targetMap);
        },
    };
}
