/**
 * T8-03: sitelen-pona glyph helper.
 *
 * Pure lookup from TP word → display glyph. Three tiers the UI can
 * choose between based on font-load state and user preference:
 *
 *   1. UCSUR codepoint (rendered via the Fairfax font — preferred)
 *   2. emoji fallback (in-line pictogram, always available)
 *   3. the plain TP word (last resort — always legible)
 *
 * The helper resolves values. Which tier a component actually renders
 * is up to the component (it knows whether Fairfax has loaded, and
 * whether the `sitelenOverlay` pref is on). This split keeps the
 * string-handling pure and testable, and keeps DOM/font-load concerns
 * out of the build-time test path.
 */

import dictionaryRaw from "../content/dictionary.json";

type DictionaryEntry = {
    word: string;
    ucsur?: string;
    sitelen_emosi?: string;
};

const dictionary = dictionaryRaw as DictionaryEntry[];
const byWord = new Map<string, DictionaryEntry>(dictionary.map((e) => [e.word, e]));

/** Raw "U+XXXX" string from the dictionary, or null if unknown. */
export function ucsurCodepoint(word: string): string | null {
    const entry = byWord.get(word);
    return entry?.ucsur ?? null;
}

/** Rendered Unicode char (surrogate pair) for the UCSUR codepoint. */
export function ucsurChar(word: string): string | null {
    const cp = ucsurCodepoint(word);
    if (!cp) return null;
    const hex = cp.startsWith("U+") ? cp.slice(2) : cp;
    const n = parseInt(hex, 16);
    if (!Number.isFinite(n)) return null;
    return String.fromCodePoint(n);
}

/** Emoji pictogram fallback, or null if dictionary has none. */
export function emojiFallback(word: string): string | null {
    const entry = byWord.get(word);
    return entry?.sitelen_emosi ?? null;
}

export type GlyphOptions = {
    /** Whether the Fairfax UCSUR font has finished loading. */
    fontLoaded?: boolean;
};

/**
 * Pick the best glyph tier given the caller's context. The empty
 * string maps to the empty string so upstream string concatenation
 * doesn't produce spurious "null" text.
 */
export function glyphForDisplay(word: string, opts: GlyphOptions = {}): string {
    if (word === "") return "";
    const fontLoaded = opts.fontLoaded ?? true;
    if (fontLoaded) {
        const ucsur = ucsurChar(word);
        if (ucsur) return ucsur;
    }
    const emoji = emojiFallback(word);
    if (emoji) return emoji;
    return word;
}
