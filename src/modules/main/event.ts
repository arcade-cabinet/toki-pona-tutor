import { type EventDefinition, RpgPlayer } from '@rpgjs/server';
import { runStarterCeremony } from './starter-ceremony';

export function JanSewi(): EventDefinition {
    return {
        onInit() {
            // Distinguished elder: nel's purple robes read as wise authority.
            this.setGraphic('npc_villager_fem_nel');
        },
        async onAction(player: RpgPlayer) {
            await runStarterCeremony(player);
        },
    };
}
