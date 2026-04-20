import { RpgPlayer, RpgShape, type RpgPlayerHooks } from '@rpgjs/server';
import { handleEncounterShapeEntered } from './encounter';
import { showVocabulary } from './vocabulary-screen';
import { showInventory } from './inventory-screen';
import { markSafeMapIfVillage, respawnAtLastSafeMap } from './respawn';
import { handleFinalBossTrigger } from './green-dragon';

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
        // Pause-menu surfaces. Two-screen split: `escape` opens the
        // vocabulary log (mastered TP words), `inventory` opens the
        // progress summary (badges, journey beat, party roster). The
        // `inventory` action name is client-side mapped separately
        // from Control enum; assumes the client config binds some
        // key ('i' / tab) to it. Both screens are plain showText
        // pagination — no Vue GUI dependency.
        if (action === 'escape') {
            await showVocabulary(player);
            return;
        }
        if (action === 'inventory') {
            await showInventory(player);
        }
    },
    async onInShape(player: RpgPlayer, shape: RpgShape) {
        const properties = (shape.properties ?? {}) as Record<string, unknown>;
        const shapeName = String(shape.name);
        if (shapeName === 'final_boss_trigger') {
            await handleFinalBossTrigger(player);
            return;
        }
        const shapeType = properties.type ?? shape.name;
        if (shapeType === 'Encounter' || shapeName.startsWith('encounter_')) {
            const mapId = String((player as unknown as { currentMap?: string }).currentMap ?? 'unknown');
            await handleEncounterShapeEntered(player, properties, mapId);
        }
    },
};
