/** Pure lookup from a clue id to a compact display icon. */

import cluesRaw from "../content/clues.json";

type ClueEntry = {
    id: string;
    icon: string;
};

const clues = cluesRaw as ClueEntry[];
const byId = new Map<string, ClueEntry>(clues.map((entry) => [entry.id, entry]));

export function ucsurCodepoint(_word: string): string | null {
    return null;
}

export function ucsurChar(_word: string): string | null {
    return null;
}

export function emojiFallback(word: string): string | null {
    return byId.get(word)?.icon ?? null;
}

export type GlyphOptions = {
    fontLoaded?: boolean;
};

export function glyphForDisplay(word: string, opts: GlyphOptions = {}): string {
    if (word === "") return "";
    const emoji = emojiFallback(word);
    if (emoji) return emoji;
    return word;
}
