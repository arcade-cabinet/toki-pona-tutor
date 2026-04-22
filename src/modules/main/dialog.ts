import type { RpgPlayer } from "@rpgjs/server";
import { DIALOG_UI_CONFIG } from "../../content/gameplay";
import { formatGameplayTemplate } from "../../content/gameplay/templates";
import { getDialogById } from "./content";
import { observeTpLine } from "./vocabulary";
import { recordMasteredWord, recordSentenceLine } from "../../platform/persistence/queries";

/**
 * Play a dialog node through to completion:
 * - speaks each beat via showText
 * - tokenizes the TP line and records every dictionary word as a sighting
 * - additionally records the explicit `glyph` (sitelen-pona lesson) if present
 */
export async function playDialog(player: RpgPlayer, dialogId: string): Promise<boolean> {
    const node = getDialogById(dialogId);
    if (!node) {
        // Surface authoring misses to the player instead of silent-no-op.
        // The id shows up verbatim so the author can grep content/spine/
        // and add the missing node. Ships with a kid-friendly framing —
        // never a stack trace or "undefined".
        await player.showText(
            formatGameplayTemplate(DIALOG_UI_CONFIG.missingNodeTemplate, {
                dialog_id: dialogId,
            }),
        );
        return false;
    }
    for (const beat of node.beats) {
        const line = beat.text.tp ?? beat.text.en;
        await player.showText(line);
        if (beat.text.tp) {
            await recordSentenceLine({
                tp: beat.text.tp,
                en: beat.text.en ?? "",
                source: dialogId,
            });
            await observeTpLine(beat.text.tp);
        }
        if (beat.glyph) await recordMasteredWord(beat.glyph);
    }
    return true;
}
