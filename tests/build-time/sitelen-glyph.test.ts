import { describe, it, expect } from 'vitest';
import {
    ucsurCodepoint,
    ucsurChar,
    emojiFallback,
    glyphForDisplay,
} from '../../src/styles/sitelen-glyph';
import { sitelenOverlayForText } from '../../src/styles/sitelen-overlay';

describe('ucsurCodepoint', () => {
    it('stays disabled after the native-English clue pivot', () => {
        expect(ucsurCodepoint('wild-signs')).toBeNull();
    });

    it('returns null for unknown words', () => {
        expect(ucsurCodepoint('not-a-word')).toBeNull();
    });

    it('returns null for empty string', () => {
        expect(ucsurCodepoint('')).toBeNull();
    });

    it('is case-sensitive', () => {
        expect(ucsurCodepoint('WILD-SIGNS')).toBeNull();
    });
});

describe('ucsurChar', () => {
    it('does not emit private-use glyphs for clue ids', () => {
        expect(ucsurChar('wild-signs')).toBeNull();
    });

    it('returns null for unknown words', () => {
        expect(ucsurChar('not-a-word')).toBeNull();
    });

});

describe('emojiFallback', () => {
    it('returns the icon for a known clue', () => {
        expect(emojiFallback('wild-signs')).toBe('🐾');
        expect(emojiFallback('capture-pods')).toBe('🟠');
        expect(emojiFallback('green-dragon-proof')).toBe('🐉');
    });

    it('returns null for unknown words', () => {
        expect(emojiFallback('not-a-word')).toBeNull();
    });
});

describe('glyphForDisplay — tier selection', () => {
    it('uses the clue icon when fontLoaded=true', () => {
        expect(glyphForDisplay('wild-signs', { fontLoaded: true })).toBe('🐾');
    });

    it('uses the same clue icon when fontLoaded=false', () => {
        expect(glyphForDisplay('capture-pods', { fontLoaded: false })).toBe('🟠');
    });

    it('falls back to the plain word when dictionary has neither', () => {
        expect(glyphForDisplay('not-a-word', { fontLoaded: true })).toBe('not-a-word');
        expect(glyphForDisplay('not-a-word', { fontLoaded: false })).toBe('not-a-word');
    });

    it('defaults to fontLoaded=true when options omitted', () => {
        expect(glyphForDisplay('green-dragon-proof')).toBe('🐉');
    });

    it('handles empty string by returning the empty string', () => {
        expect(glyphForDisplay('', { fontLoaded: true })).toBe('');
    });
});

describe('sitelenOverlayForText', () => {
    it('maps known clue ids to icons and skips unknown text', () => {
        expect(sitelenOverlayForText('wild-signs capture-pods unknown.')).toBe([
            glyphForDisplay('wild-signs'),
            glyphForDisplay('capture-pods'),
        ].join(' '));
        expect(sitelenOverlayForText('hello')).toBe('');
    });

    it('uses icons for clients without the glyph font loaded', () => {
        expect(sitelenOverlayForText('wild-signs green-dragon-proof', { fontLoaded: false })).toBe(
            '🐾 🐉',
        );
    });
});
