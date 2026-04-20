import type { RpgPlayer } from '@rpgjs/server';
import { MANUAL_SAVE_SLOTS } from '../../platform/persistence/constants';

/**
 * Save-slot pause menu (ROADMAP T3-05 manual save slots).
 *
 * Layout:
 *   Slot 0 — the autosave slot (T3-02). Shown as `auto` with timestamp;
 *            read-only from this menu so the player can't overwrite the
 *            engine's automatic save.
 *   Slots 1-3 — manual save slots. Each shows either `(empty)` or the
 *            saved timestamp + current journey beat. Selecting an empty
 *            slot writes a new save; selecting a filled slot offers
 *            overwrite or load.
 *
 * Uses showChoices pagination rather than a Vue GUI — consistent with
 * vocabulary-screen.ts and inventory-screen.ts. Choice labels are
 * single TP dictionary words (`poki`, `awen`, `kama`, `tawa`, `ala`)
 * or plain English UX placeholders; no authored TP sentences, so the
 * validate-tp Tatoeba gate does not apply here.
 */

type SaveSlotMeta = {
    savedAt?: string;
    beatId?: string;
};

export async function showSaveMenu(player: RpgPlayer): Promise<void> {
    const list = await listSlotsSafe(player);
    const autoLabel = formatSlotLabel('auto', list[0] ?? null);

    const choice = await player.showChoices('poki awen', [
        { text: autoLabel, value: 'auto' },
        ...MANUAL_SAVE_SLOTS.map((i) => ({
            text: formatSlotLabel(`${i}`, list[i] ?? null),
            value: `slot_${i}`,
        })),
        { text: 'tawa', value: 'cancel' },
    ]);

    if (!choice || choice.value === 'cancel') return;
    if (choice.value === 'auto') {
        await player.showText(`auto\n${formatSlotLabel('', list[0] ?? null)}`);
        return;
    }

    const slotIndex = Number(String(choice.value).split('_')[1]);
    if (!Number.isInteger(slotIndex) || !MANUAL_SAVE_SLOTS.includes(slotIndex as (typeof MANUAL_SAVE_SLOTS)[number])) {
        return;
    }
    const existing = list[slotIndex] ?? null;

    if (existing) {
        const action = await player.showChoices(`${slotIndex}?`, [
            { text: 'awen', value: 'save' },
            { text: 'kama', value: 'load' },
            { text: 'tawa', value: 'cancel' },
        ]);
        if (!action || action.value === 'cancel') return;
        if (action.value === 'save') await saveToSlot(player, slotIndex);
        else if (action.value === 'load') await loadFromSlot(player, slotIndex);
    } else {
        await saveToSlot(player, slotIndex);
    }
}

function formatSlotLabel(tag: string, meta: SaveSlotMeta | null): string {
    if (!meta?.savedAt) return tag ? `${tag} — ala` : 'ala';
    const date = meta.savedAt.slice(0, 10);
    const beat = meta.beatId ? ` · ${meta.beatId}` : '';
    return tag ? `${tag} — ${date}${beat}` : `${date}${beat}`;
}

async function listSlotsSafe(player: RpgPlayer): Promise<Array<SaveSlotMeta | null>> {
    const list = (player as unknown as { saveList?: () => Promise<unknown> }).saveList;
    if (typeof list !== 'function') return [];
    try {
        const slots = (await list.call(player)) as Array<SaveSlotMeta | null> | null;
        return Array.isArray(slots) ? slots : [];
    } catch {
        return [];
    }
}

async function saveToSlot(player: RpgPlayer, index: number): Promise<void> {
    const save = (player as unknown as { save?: (slot: number) => Promise<void> }).save;
    if (typeof save !== 'function') {
        await player.showText(`ike · ${index}`);
        return;
    }
    try {
        await save.call(player, index);
        await player.showText(`pona · ${index} awen`);
    } catch {
        await player.showText(`ike · ${index} awen`);
    }
}

async function loadFromSlot(player: RpgPlayer, index: number): Promise<void> {
    const load = (player as unknown as { load?: (slot: number) => Promise<void> }).load;
    if (typeof load !== 'function') {
        await player.showText(`ike · ${index}`);
        return;
    }
    try {
        await load.call(player, index);
        await player.showText(`pona · ${index} kama`);
    } catch {
        await player.showText(`ike · ${index} kama`);
    }
}
