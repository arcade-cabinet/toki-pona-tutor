import { RpgPlayer, RpgShape, type RpgPlayerHooks } from '@rpgjs/server';
import { handleEncounterShapeEntered } from './encounter';
import { showVocabulary } from './vocabulary-screen';
import { showInventory } from './inventory-screen';
import { markSafeMapIfVillage, respawnAtLastSafeMap } from './respawn';
import { handleFinalBossTrigger } from './green-dragon';

const AUTOSAVE_SLOT = 0;

async function autosave(player: RpgPlayer): Promise<void> {
    // T3-02: autosave every map transition. Uses slot 0 as the single
    // implicit autosave; manual saves (T3-05) live in slots 1-3 when
    // that lands. Errors in save are swallowed — a save-write failure
    // should not block the player from entering the new map.
    try {
        const save = (player as unknown as { save?: (slot: number) => Promise<void> }).save;
        if (typeof save === 'function') {
            await save.call(player, AUTOSAVE_SLOT);
        }
    } catch {
        // Silent: autosave is best-effort.
    }
}

export const player: RpgPlayerHooks = {
    async onConnected(player: RpgPlayer) {
        await player.changeMap('ma_tomo_lili', { x: 128, y: 128 });
        player.setGraphic('hero');
        await markSafeMapIfVillage('ma_tomo_lili');
    },
    async onJoinMap(player: RpgPlayer) {
        const mapId = player.getCurrentMap()?.id;
        if (typeof mapId === 'string') {
            await markSafeMapIfVillage(mapId);
        }
        await autosave(player);
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
            const mapId = player.getCurrentMap()?.id ?? 'unknown';
            await handleEncounterShapeEntered(player, properties, mapId);
        }
    },
};
