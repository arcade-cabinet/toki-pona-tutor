import { RpgPlayer, RpgShape, type RpgPlayerHooks } from '@rpgjs/server';
import { handleEncounterShapeEntered } from './encounter';
import { showVocabulary } from './vocabulary-screen';
import { markSafeMapIfVillage, respawnAtLastSafeMap } from './respawn';

export const player: RpgPlayerHooks = {
    async onConnected(player: RpgPlayer) {
        await player.changeMap('ma_tomo_lili', { x: 128, y: 128 });
        player.setGraphic('hero');
        await markSafeMapIfVillage('ma_tomo_lili');
    },
    async onDead(player: RpgPlayer) {
        await respawnAtLastSafeMap(player);
    },
    async onInput(player: RpgPlayer, { action }) {
        if (action === 'escape') {
            await showVocabulary(player);
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
