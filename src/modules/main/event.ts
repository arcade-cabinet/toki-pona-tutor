import { type EventDefinition, RpgPlayer } from '@rpgjs/server';

/** jan Sewi — the starting-village guide who offers the three starters. */
export function JanSewi(): EventDefinition {
    return {
        onInit() {
            this.setGraphic('female');
        },
        onAction(player: RpgPlayer) {
            player.showText('o kama! sina wile soweli seme? (starter ceremony — wired in V3)');
        },
    };
}
