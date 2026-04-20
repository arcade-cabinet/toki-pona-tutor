import { RpgPlayer, RpgShape, type RpgPlayerHooks } from '@rpgjs/server';
import { handleEncounterShapeEntered } from './encounter';
import { showVocabulary } from './vocabulary-screen';
import { showInventory } from './inventory-screen';
import { showSaveMenu } from './save-menu';
import { markSafeMapIfVillage, respawnAtLastSafeMap } from './respawn';
import { handleFinalBossTrigger } from './green-dragon';
import { AUTOSAVE_SLOT } from '../../platform/persistence/constants';

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

/**
 * Offer a Continue prompt on boot if any saved game is present. T3-01.
 * Returns true if the player chose to load and the load succeeded (in
 * which case the engine has already restored the map + position and
 * onConnected should skip its default starter-map placement).
 */
async function offerContinueOnBoot(player: RpgPlayer): Promise<boolean> {
    const list = (player as unknown as { saveList?: () => Promise<unknown> }).saveList;
    if (typeof list !== 'function') return false;

    let slots: Array<{ savedAt?: string } | null> = [];
    try {
        const raw = await list.call(player);
        slots = Array.isArray(raw) ? (raw as typeof slots) : [];
    } catch {
        return false;
    }

    const filled = slots
        .map((meta, index) => (meta ? { index, savedAt: meta.savedAt ?? '' } : null))
        .filter((s): s is { index: number; savedAt: string } => s !== null)
        .sort((a, b) => b.savedAt.localeCompare(a.savedAt));

    if (filled.length === 0) return false;

    const choice = await player.showChoices('poki awen', [
        { text: `kama — ${filled[0].index}`, value: 'continue' },
        { text: 'open sin', value: 'new' },
    ]);
    if (!choice || choice.value !== 'continue') return false;

    const load = (player as unknown as { load?: (slot: number) => Promise<void> }).load;
    if (typeof load !== 'function') return false;
    try {
        await load.call(player, filled[0].index);
        return true;
    } catch {
        return false;
    }
}

export const player: RpgPlayerHooks = {
    async onConnected(player: RpgPlayer) {
        const resumed = await offerContinueOnBoot(player);
        if (resumed) {
            // The loaded save already set map + position; just make sure the
            // hero graphic is applied (in case the save predates a sprite
            // refresh) and skip the starter placement.
            player.setGraphic('hero');
            return;
        }
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
    async onDisconnected(player: RpgPlayer) {
        // T3-04: flush a final autosave when the player disconnects
        // (browser unload, Capacitor app backgrounded, tab close). The
        // engine drives this via its own disconnect signal so we don't
        // need a client-side beforeunload listener. Best-effort — if the
        // runtime is already tearing down we can't help.
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
            return;
        }
        if (action === 'save') {
            await showSaveMenu(player);
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
