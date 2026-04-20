import type { RpgPlayer } from '@rpgjs/server';
import { listMasteredWords, getWordSightings } from '../../platform/persistence/queries';
import { lookupWord, dictionarySize } from './vocabulary';

const MASTERY_THRESHOLD = 3;
const PAGE_SIZE = 8;

/**
 * Shows the player's vocabulary progress: count of mastered words vs
 * dictionary total, then pages through the mastered list with
 * sightings + short definition for each entry.
 *
 * Uses showText (plain dialog) rather than a custom GUI because v5's
 * GUI layer is Vue-based and our shell stays minimal. A proper GUI
 * lands when we need richer UX (filter by book, search, sitelen
 * glyph rendering).
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
            const entry = lookupWord(word);
            const sightings = await getWordSightings(word);
            const gloss = entry ? firstGloss(entry.definition) : '';
            lines.push(`${word}${gloss ? ` — ${gloss}` : ''}  (${sightings}x)`);
        }
        await player.showText(lines.join('\n'));
    }
}

function firstGloss(definition: string): string {
    const first = definition.split(/;|\.|,/)[0];
    return first.replace(/^\s*\([^)]*\)\s*/, '').trim();
}
