import type { RpgPlayer } from "@rpgjs/server";
import { MANUAL_SAVE_SLOTS } from "../../platform/persistence/constants";
import { getSaveSlotTimestamp, listSaveSlots, loadSaveSlot, type SaveSlotMeta } from "./save-slots";
import { SAVE_MENU_CONFIG } from "../../content/gameplay";
import { formatGameplayTemplate } from "../../content/gameplay/templates";

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
 * Uses showChoices pagination rather than a dedicated CanvasEngine GUI, consistent with
 * vocabulary-screen.ts and inventory-screen.ts. Choice/status copy is authored in
 * `src/content/gameplay/ui.json`; no authored TP sentences live in this module.
 */

export async function showSaveMenu(player: RpgPlayer): Promise<void> {
    const list = await listSaveSlots(player);
    const autoLabel = formatSlotLabel(SAVE_MENU_CONFIG.autoLabel, list[0] ?? null);

    const choice = await player.showChoices(SAVE_MENU_CONFIG.prompt, [
        { text: autoLabel, value: "auto" },
        ...MANUAL_SAVE_SLOTS.map((i) => ({
            text: formatSlotLabel(`${i}`, list[i] ?? null),
            value: `slot_${i}`,
        })),
        { text: SAVE_MENU_CONFIG.cancelLabel, value: "cancel" },
    ]);

    if (!choice || choice.value === "cancel") return;
    if (choice.value === "auto") {
        await player.showText(
            formatGameplayTemplate(SAVE_MENU_CONFIG.autoDetailTemplate, {
                label: formatSlotLabel("", list[0] ?? null),
            }),
        );
        return;
    }

    const slotIndex = Number(String(choice.value).split("_")[1]);
    if (
        !Number.isInteger(slotIndex) ||
        !MANUAL_SAVE_SLOTS.includes(slotIndex as (typeof MANUAL_SAVE_SLOTS)[number])
    ) {
        return;
    }
    const existing = list[slotIndex] ?? null;

    if (existing) {
        const action = await player.showChoices(
            formatGameplayTemplate(SAVE_MENU_CONFIG.existingSlotPromptTemplate, {
                slot: slotIndex,
            }),
            SAVE_MENU_CONFIG.actions.map((entry) => ({ text: entry.label, value: entry.value })),
        );
        if (!action || action.value === "cancel") return;
        if (action.value === "save") await saveToSlot(player, slotIndex);
        else if (action.value === "load") await loadFromSlot(player, slotIndex);
    } else {
        await saveToSlot(player, slotIndex);
    }
}

export function formatSlotLabel(tag: string, meta: SaveSlotMeta | null): string {
    const timestamp = getSaveSlotTimestamp(meta);
    if (!timestamp) {
        return tag
            ? formatGameplayTemplate(SAVE_MENU_CONFIG.emptySlotTemplate, {
                  tag,
                  empty: SAVE_MENU_CONFIG.emptyLabel,
              })
            : formatGameplayTemplate(SAVE_MENU_CONFIG.emptyDetailTemplate, {
                  empty: SAVE_MENU_CONFIG.emptyLabel,
              });
    }
    const date = timestamp.slice(0, 10);
    const beatId = meta?.beatId ?? null;
    const beat = beatId
        ? formatGameplayTemplate(SAVE_MENU_CONFIG.beatSuffixTemplate, { beat: beatId })
        : "";
    return tag
        ? formatGameplayTemplate(SAVE_MENU_CONFIG.filledSlotTemplate, { tag, date, beat })
        : formatGameplayTemplate(SAVE_MENU_CONFIG.filledDetailTemplate, { date, beat });
}

async function saveToSlot(player: RpgPlayer, index: number): Promise<void> {
    const save = (player as unknown as { save?: (slot: number) => Promise<void> }).save;
    if (typeof save !== "function") {
        await player.showText(
            formatGameplayTemplate(SAVE_MENU_CONFIG.missingSaveApiTemplate, { slot: index }),
        );
        return;
    }
    try {
        await save.call(player, index);
        await player.showText(
            formatGameplayTemplate(SAVE_MENU_CONFIG.saveSuccessTemplate, { slot: index }),
        );
    } catch {
        await player.showText(
            formatGameplayTemplate(SAVE_MENU_CONFIG.saveErrorTemplate, { slot: index }),
        );
    }
}

async function loadFromSlot(player: RpgPlayer, index: number): Promise<void> {
    try {
        const loaded = await loadSaveSlot(player, index);
        await player.showText(
            formatGameplayTemplate(
                loaded ? SAVE_MENU_CONFIG.loadSuccessTemplate : SAVE_MENU_CONFIG.loadErrorTemplate,
                { slot: index },
            ),
        );
    } catch {
        await player.showText(
            formatGameplayTemplate(SAVE_MENU_CONFIG.loadErrorTemplate, { slot: index }),
        );
    }
}
