import { glyphForDisplay, type GlyphOptions } from "./sitelen-glyph";

const CLUE_TOKEN = /[a-z][a-z0-9-]*/gi;

export function sitelenOverlayForText(text: string, opts: GlyphOptions = {}): string {
    const glyphs: string[] = [];
    for (const match of text.matchAll(CLUE_TOKEN)) {
        const clue = match[0].toLowerCase();
        const glyph = glyphForDisplay(clue, opts);
        if (glyph !== clue) {
            glyphs.push(glyph);
        }
    }
    return glyphs.join(" ");
}
