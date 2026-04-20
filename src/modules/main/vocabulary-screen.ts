import type { RpgPlayer } from '@rpgjs/server';
import { listMasteredWords, getWordSightings } from '../../platform/persistence/queries';
import { dictionarySize } from './vocabulary';

const MASTERY_THRESHOLD = 3;
const PAGE_SIZE = 8;

/**
 * Shows the player's vocabulary progress: count of mastered words vs
 * dictionary total, then pages through the mastered list showing each
 * word and its sighting count.
 *
 * No English glosses are shown — vocabulary is learned diegetically
 * through play, never via an in-game translation dictionary. A richer
 * sitelen-pona glyph view can land when the Vue GUI layer is wired up.
 *
 * Uses showText (plain dialog) rather than a custom GUI because v5's
 * GUI layer is Vue-based and our shell stays minimal.
 */
export async function showVocabulary(player: RpgPlayer): Promise<void> {
    const mastered = await listMasteredWords(MASTERY_THRESHOLD);
    const total = dictionarySize();
    await player.showText(`${mastered.length} / ${total}`);

    if (mastered.length === 0) return;

    for (let page = 0; page < mastered.length; page += PAGE_SIZE) {
        const chunk = mastered.slice(page, page + PAGE_SIZE);
        const lines: string[] = [];
        for (const word of chunk) {
            const sightings = await getWordSightings(word);
            lines.push(`${word}  (${sightings}x)`);
        }
        await player.showText(lines.join('\n'));
    }
}
