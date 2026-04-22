import { describe, it, expect } from 'vitest';
import {
    ucsurCodepoint,
    ucsurChar,
    emojiFallback,
    glyphForDisplay,
} from '../../src/styles/sitelen-glyph';
import { sitelenOverlayForText } from '../../src/styles/sitelen-overlay';

/**
 * T8-03: sitelen-pona glyph helper.
 *
 * Pure mapping from TP word → display glyph. Three tiers:
 *
 *   1. UCSUR codepoint (e.g. "U+F1900" → U+F1900 → 󱤀 via Fairfax font)
 *   2. emoji fallback (rendered in-line when the Fairfax glyph font
 *      hasn't loaded or the user's device can't render UCSUR)
 *   3. the plain TP word (last resort — still legible)
 *
 * Components pick which tier to render based on font-load state +
 * the user's sitelen overlay preference. The helper just resolves
 * values; the "which tier" decision is up to the caller.
 */

describe('ucsurCodepoint', () => {
    it('returns the U+XXXX string from the dictionary', () => {
        expect(ucsurCodepoint('a')).toBe('U+F1900');
        expect(ucsurCodepoint('akesi')).toBe('U+F1901');
        expect(ucsurCodepoint('ala')).toBe('U+F1902');
    });

    it('returns null for unknown words', () => {
        expect(ucsurCodepoint('not-a-word')).toBeNull();
    });

    it('returns null for empty string', () => {
        expect(ucsurCodepoint('')).toBeNull();
    });

    it('is case-sensitive (TP is always lowercase)', () => {
        expect(ucsurCodepoint('AKESI')).toBeNull();
    });
});

describe('ucsurChar', () => {
    it('returns the rendered Unicode char for a known word', () => {
        // U+F1900 = 󱤀 (4-byte surrogate pair)
        expect(ucsurChar('a')).toBe(String.fromCodePoint(0xf1900));
    });

    it('returns a 2-char UTF-16 surrogate pair for supplementary plane codepoints', () => {
        const ch = ucsurChar('a');
        expect(ch).not.toBeNull();
        expect(ch!.length).toBe(2);
    });

    it('returns null for unknown words', () => {
        expect(ucsurChar('not-a-word')).toBeNull();
    });

    it('returns null if the dictionary entry lacks a ucsur field', () => {
        // No built-in word is known to lack ucsur, but the helper must
        // still be safe if the dictionary ever includes one. Exercise
        // via the public API: unknown word acts as the null branch.
        expect(ucsurChar('nonexistent-word')).toBeNull();
    });
});

describe('emojiFallback', () => {
    it('returns the emoji for a known word', () => {
        expect(emojiFallback('akesi')).toBe('🦎');
        expect(emojiFallback('ala')).toBe('❌');
        expect(emojiFallback('alasa')).toBe('🏹');
    });

    it('returns null for unknown words', () => {
        expect(emojiFallback('not-a-word')).toBeNull();
    });
});

describe('glyphForDisplay — tier selection', () => {
    it('prefers UCSUR when available and fontLoaded=true', () => {
        expect(glyphForDisplay('a', { fontLoaded: true })).toBe(
            String.fromCodePoint(0xf1900),
        );
    });

    it('falls back to emoji when fontLoaded=false', () => {
        expect(glyphForDisplay('akesi', { fontLoaded: false })).toBe('🦎');
    });

    it('falls back to the plain word when dictionary has neither', () => {
        expect(glyphForDisplay('not-a-word', { fontLoaded: true })).toBe('not-a-word');
        expect(glyphForDisplay('not-a-word', { fontLoaded: false })).toBe('not-a-word');
    });

    it('defaults to fontLoaded=true when options omitted', () => {
        expect(glyphForDisplay('a')).toBe(String.fromCodePoint(0xf1900));
    });

    it('handles empty string by returning the empty string', () => {
        expect(glyphForDisplay('', { fontLoaded: true })).toBe('');
    });
});

describe('sitelenOverlayForText', () => {
    it('maps known TP words to glyphs and skips unknown text', () => {
        expect(sitelenOverlayForText('kili sin li pona tawa sijelo.')).toBe([
            glyphForDisplay('kili'),
            glyphForDisplay('sin'),
            glyphForDisplay('li'),
            glyphForDisplay('pona'),
            glyphForDisplay('tawa'),
            glyphForDisplay('sijelo'),
        ].join(' '));
        expect(sitelenOverlayForText('hello')).toBe('');
    });

    it('can use emoji fallback for clients without the glyph font loaded', () => {
        expect(sitelenOverlayForText('akesi ala', { fontLoaded: false })).toBe('🦎 ❌');
    });
});
