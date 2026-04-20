import { RpgPlayer, type RpgPlayerHooks } from '@rpgjs/server';

export const player: RpgPlayerHooks = {
    onConnected(player: RpgPlayer) {
        player.changeMap('ma_tomo_lili', { x: 128, y: 128 });
        player.setGraphic('hero');
    },
    onInput(player: RpgPlayer, { action }) {
        if (action == 'escape') {
            player.callMainMenu();
        }
    },
};
