import dictionaryRaw from '../../content/dictionary.json';
import { recordMasteredWord } from '../../platform/persistence/queries';

type DictionaryEntry = {
    word: string;
    definition: string;
    book: string;
    usage_category: string;
    source_language: string;
    ucsur?: string;
    sitelen_emosi?: string;
};

const dictionary = dictionaryRaw as DictionaryEntry[];
const wordSet = new Set(dictionary.map((e) => e.word));
const wordMap = new Map<string, DictionaryEntry>(dictionary.map((e) => [e.word, e]));

/**
 * Tokenize a TP line into word tokens. Strips punctuation, lowercases,
 * drops any token not in the dictionary (filters `ni`, `li`, etc. are
 * kept since they ARE dictionary entries; filters quoted names, numerals,
 * and proper nouns that aren't).
 */
export function tokenize(tp: string): string[] {
    const cleaned = tp
        .toLowerCase()
        .replace(/[^\p{L}\p{M}\s']+/gu, ' ')
        .split(/\s+/)
        .filter(Boolean);
    return cleaned.filter((tok) => wordSet.has(tok));
}

export function lookupWord(tp: string): DictionaryEntry | undefined {
    return wordMap.get(tp);
}

/**
 * Record every TP dictionary word in a line as a sighting.
 */
export async function observeTpLine(tp: string): Promise<void> {
    const tokens = tokenize(tp);
    for (const token of new Set(tokens)) {
        await recordMasteredWord(token);
    }
}

export function dictionarySize(): number {
    return dictionary.length;
}
