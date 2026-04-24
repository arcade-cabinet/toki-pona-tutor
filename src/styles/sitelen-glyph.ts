/** Pure lookup from a clue id to a compact display icon. */

// v1 clues.json retired in T109. Lookup returns null until v2 bestiary
// + discovery surface lands.
const byId = new Map<string, { id: string; icon: string }>();

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
