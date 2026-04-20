import type { RpgPlayer } from '@rpgjs/server';
import { getDialogById } from './content';
import { observeTpLine } from './vocabulary';
import { recordMasteredWord } from '../../platform/persistence/queries';

/**
 * Play a dialog node through to completion:
 * - speaks each beat via showText
 * - tokenizes the TP line and records every dictionary word as a sighting
 * - additionally records the explicit `glyph` (sitelen-pona lesson) if present
 */
export async function playDialog(player: RpgPlayer, dialogId: string): Promise<boolean> {
    const node = getDialogById(dialogId);
    if (!node) return false;
    for (const beat of node.beats) {
        const line = beat.text.tp ?? beat.text.en;
        await player.showText(line);
        if (beat.text.tp) await observeTpLine(beat.text.tp);
        if (beat.glyph) await recordMasteredWord(beat.glyph);
    }
    return true;
}
