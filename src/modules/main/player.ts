import { RpgPlayer, RpgShape, type RpgPlayerHooks } from '@rpgjs/server';
import { handleEncounterShapeEntered } from './encounter';

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
    async onInShape(player: RpgPlayer, shape: RpgShape) {
        const properties = (shape.properties ?? {}) as Record<string, unknown>;
        const shapeType = properties.type ?? shape.name;
        if (shapeType !== 'Encounter' && !String(shape.name).startsWith('encounter_')) return;
        const mapId = String((player as unknown as { currentMap?: string }).currentMap ?? 'unknown');
        await handleEncounterShapeEntered(player, properties, mapId);
    },
};
