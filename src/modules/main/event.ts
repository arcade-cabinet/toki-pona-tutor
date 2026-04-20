import { type EventDefinition, RpgPlayer } from '@rpgjs/server';
import { runStarterCeremony } from './starter-ceremony';

export function JanSewi(): EventDefinition {
    return {
        onInit() {
            this.setGraphic('female');
        },
        async onAction(player: RpgPlayer) {
            await runStarterCeremony(player);
        },
    };
}
