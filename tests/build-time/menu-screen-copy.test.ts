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
        expect(formatInventoryItemLine('poki_lili', 3)).toBe('  poki lili ×3');
    });

    it('formats vocabulary detail rows through gameplay JSON templates', () => {
        expect(formatVocabularySummary(7, 131)).toBe('7 / 131');
        expect(formatVocabularyEntry('soweli', 4)).toBe('soweli  (4x)');
        expect(formatVocabularyRowLabel('soweli')).toBe(`${glyphForDisplay('soweli')} soweli`);
        expect(formatVocabularyGlyphCard('soweli', 4)).toBe(
            `${glyphForDisplay('soweli')}\nsoweli\nlukin: 4x`,
        );
        expect(formatSentenceLogSummary(2)).toBe('lipu nasin: 2');
    });

    it('formats save-slot labels through gameplay JSON templates', () => {
        expect(formatSlotLabel('1', null)).toBe('1 — ala');
        expect(formatSlotLabel('', null)).toBe('ala');
        expect(formatSlotLabel('2', {
            savedAt: '2026-04-21T19:15:00.000Z',
            beatId: 'beat_01_ma_tomo_lili',
        })).toBe('2 — 2026-04-21 · beat_01_ma_tomo_lili');
    });
});
