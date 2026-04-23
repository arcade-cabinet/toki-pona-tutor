import type { RpgPlayer } from "@rpgjs/server";
import { DIALOG_UI_CONFIG } from "../../content/gameplay";
import { formatGameplayTemplate } from "../../content/gameplay/templates";
import { getDialogById } from "./content";
import { recordClue } from "../../platform/persistence/queries";

/**
 * Play a dialog node through to completion:
 * - speaks each beat via showText
 * - records the explicit `glyph` token as a clue sighting if present
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
        await player.showText(beat.text.en);
        if (beat.glyph) await recordClue(beat.glyph);
    }
    return true;
}
