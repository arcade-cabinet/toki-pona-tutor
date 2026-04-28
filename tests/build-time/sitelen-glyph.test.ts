import { describe, it, expect } from 'vitest';
import {
    ucsurCodepoint,
    ucsurChar,
    glyphForDisplay,
} from '../../src/styles/sitelen-glyph';

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

describe('glyphForDisplay — null/passthrough behavior', () => {
    it('falls back to the plain word when dictionary has no entry', () => {
        expect(glyphForDisplay('not-a-word', { fontLoaded: true })).toBe('not-a-word');
        expect(glyphForDisplay('not-a-word', { fontLoaded: false })).toBe('not-a-word');
    });

    it('handles empty string by returning the empty string', () => {
        expect(glyphForDisplay('', { fontLoaded: true })).toBe('');
    });
});
