import { type EventDefinition, RpgPlayer } from '@rpgjs/server';
import { playDialog } from './dialog';

/**
 * Shared factory for NPCs that only show flavour dialog — no combat,
 * no flag logic, no branching. Authors keep one dialog node per NPC
 * in src/content/spine/dialog/<dialog_id>.json and that's the whole
 * implementation.
 */
export function AmbientNpc(graphic: string, dialogId: string): EventDefinition {
    return {
        onInit() {
            this.setGraphic(graphic);
        },
        async onAction(player: RpgPlayer) {
            await playDialog(player, dialogId);
        },
    };
}
