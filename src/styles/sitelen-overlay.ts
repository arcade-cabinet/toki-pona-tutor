import { glyphForDisplay, type GlyphOptions } from "./sitelen-glyph";

const WORD_TOKEN = /[a-z]+/gi;

export function sitelenOverlayForText(text: string, opts: GlyphOptions = {}): string {
    const glyphs: string[] = [];
    for (const match of text.matchAll(WORD_TOKEN)) {
        const word = match[0].toLowerCase();
        const glyph = glyphForDisplay(word, opts);
        if (glyph !== word) {
            glyphs.push(glyph);
        }
    }
    return glyphs.join(" ");
}
