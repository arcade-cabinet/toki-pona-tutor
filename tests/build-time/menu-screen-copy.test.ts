import { describe, expect, it } from 'vitest';
import { formatInventoryItemLine } from '../../src/modules/main/inventory-screen';
import { formatSlotLabel } from '../../src/modules/main/save-menu';
import {
    formatVocabularyEntry,
    formatVocabularyGlyphCard,
    formatVocabularyRowLabel,
    formatVocabularySummary,
    formatSentenceLogSummary,
} from '../../src/modules/main/vocabulary-screen';
import { glyphForDisplay } from '../../src/styles/sitelen-glyph';

describe('secondary pause screen copy', () => {
    it('formats inventory detail rows through gameplay JSON templates', () => {
        expect(formatInventoryItemLine('capture_pod', 3)).toBe('  capture pod ×3');
    });

    it('formats vocabulary detail rows through gameplay JSON templates', () => {
        expect(formatVocabularySummary(7, 27)).toBe('7 / 27');
        expect(formatVocabularyEntry('wild-signs', 4)).toBe('Wild signs  (4x)');
        expect(formatVocabularyRowLabel('wild-signs')).toBe(
            `${glyphForDisplay('wild-signs')} Wild signs`,
        );
        expect(formatVocabularyGlyphCard('wild-signs', 4)).toBe(
            `${glyphForDisplay('wild-signs')}\nWild signs\nseen: 4x`,
        );
        expect(formatSentenceLogSummary(2)).toBe('Field log: 2');
    });

    it('formats save-slot labels through gameplay JSON templates', () => {
        expect(formatSlotLabel('1', null)).toBe('1 — empty');
        expect(formatSlotLabel('', null)).toBe('empty');
        expect(formatSlotLabel('2', {
            savedAt: '2026-04-21T19:15:00.000Z',
            beatId: 'beat_01_riverside_home',
        })).toBe('2 — 2026-04-21 · beat_01_riverside_home');
    });
});
