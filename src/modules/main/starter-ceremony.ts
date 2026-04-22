import type { RpgPlayer } from "@rpgjs/server";
import { preferences, KEYS } from "../../platform/persistence/preferences";
import {
    addToInventory,
    addToParty,
    recordBestiaryCaught,
    recordMasteredWord,
    setFlag,
} from "../../platform/persistence/queries";
import {
    STARTER_INITIAL_ITEMS,
    STARTER_LEVEL,
    STARTER_CEREMONY_CONFIG,
    STARTERS,
} from "../../content/gameplay";
import { playDialog } from "./dialog";
import { syncLeadCreatureStats } from "./lead-battle-avatar";

export async function runStarterCeremony(player: RpgPlayer): Promise<void> {
    const already = await preferences.get(KEYS.starterChosen);
    if (already) {
        await playDialog(player, STARTER_CEREMONY_CONFIG.alreadyChosenDialogId);
        return;
    }

    await playDialog(player, STARTER_CEREMONY_CONFIG.introDialogId);

    const choice = await player.showChoices(
        STARTER_CEREMONY_CONFIG.choicePrompt,
        STARTERS.map((s) => ({
            text: s.label,
            value: s.id,
        })),
    );

    if (!choice) return;
    const picked = STARTERS.find((s) => s.id === choice.value);
    if (!picked) return;

    // Write the completion flag to both stores atomically-ish: preferences is
    // the re-entry guard (read on next onAction), SQLite flag drives the warp
    // gate. Both must agree or the player gets stuck (ceremony skipped, warp
    // closed). If either write throws, the unhandled rejection surfaces to
    // the RPG.js event system and neither side commits.
    await preferences.set(KEYS.starterChosen, picked.id);
    await setFlag("starter_chosen", "1");

    await addToParty(picked.id, STARTER_LEVEL);
    await syncLeadCreatureStats(player);
    for (const item of STARTER_INITIAL_ITEMS) {
        await addToInventory(item.itemId, item.count);
    }
    await recordBestiaryCaught(picked.id);

    for (const word of picked.mastered_words) {
        await recordMasteredWord(word);
    }

    await player.showNotification(picked.label, { time: STARTER_CEREMONY_CONFIG.notificationMs });
}
