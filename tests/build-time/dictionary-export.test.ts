import { describe, it, expect } from 'vitest';
import {
    exportTextCard,
    exportSvgCard,
    type ExportSnapshot,
    type MasteredWord,
} from '../../src/modules/main/dictionary-export';

const word = (tp: string, sightings: number, at = '2026-04-20T00:00:00Z'): MasteredWord => ({
    tp,
    sightings,
    mastered_at: at,
});

const snap = (overrides: Partial<ExportSnapshot> = {}): ExportSnapshot => ({
    playerName: 'Sam',
    words: [word('soweli', 12), word('poki', 8), word('seli', 5)],
    journeyCleared: true,
    ngPlusCount: 0,
    exportedAt: '2026-04-20T12:00:00Z',
    ...overrides,
});

describe('exportTextCard', () => {
    it('includes the player name', () => {
        expect(exportTextCard(snap())).toContain('jan Sam');
    });

    it('shows total word count', () => {
        const out = exportTextCard(snap());
        expect(out).toContain('nimi sona: 3');
    });

    it('shows the cleared badge when journeyCleared', () => {
        expect(exportTextCard(snap({ journeyCleared: true, ngPlusCount: 0 }))).toContain('akesi sewi defeated');
    });

    it('shows NG+ multiplier on repeat clears', () => {
        expect(exportTextCard(snap({ ngPlusCount: 2 }))).toContain('× 3');
    });

    it('shows in-progress marker when not cleared', () => {
        expect(exportTextCard(snap({ journeyCleared: false }))).toContain('journey in progress');
    });

    it('sorts top words by sightings desc', () => {
        const out = exportTextCard(snap());
        const soweliIdx = out.indexOf('soweli');
        const seliIdx = out.indexOf('seli ');
        expect(soweliIdx).toBeLessThan(seliIdx);
    });

    it('tie-break is mastered_at asc (older first)', () => {
        const out = exportTextCard(snap({
            words: [
                word('a', 5, '2026-04-20T02:00:00Z'),
                word('b', 5, '2026-04-20T01:00:00Z'),
            ],
        }));
        // b (older) appears before a (newer) when sightings tie
        expect(out.indexOf('b   ')).toBeLessThan(out.indexOf('a   '));
    });

    it('empty words shows friendly empty state', () => {
        expect(exportTextCard(snap({ words: [] }))).toContain('nimi ala');
    });

    it('caps top list at 20 words', () => {
        const many: MasteredWord[] = Array.from({ length: 30 }, (_, i) =>
            word(`w${i}`, 30 - i),
        );
        const out = exportTextCard(snap({ words: many }));
        expect(out).toContain('w0');
        expect(out).toContain('w19');
        expect(out).not.toContain('w20 ');
    });

    it('is deterministic: same input → byte-identical output', () => {
        const a = exportTextCard(snap());
        const b = exportTextCard(snap());
        expect(a).toBe(b);
    });
});

describe('exportSvgCard', () => {
    it('produces a valid-looking SVG document', () => {
        const svg = exportSvgCard(snap());
        expect(svg).toMatch(/^<svg[^>]*>/);
        expect(svg.endsWith('</svg>')).toBe(true);
    });

    it('has 400×600 viewBox', () => {
        expect(exportSvgCard(snap())).toContain('viewBox="0 0 400 600"');
    });

    it('includes the player name', () => {
        expect(exportSvgCard(snap())).toContain('jan Sam');
    });

    it('includes the word count as a big number', () => {
        const svg = exportSvgCard(snap());
        expect(svg).toMatch(/<text[^>]*>3<\/text>/);
    });

    it('includes the cleared marker when journeyCleared', () => {
        expect(exportSvgCard(snap())).toContain('akesi sewi — moli');
    });

    it('omits the cleared marker when not cleared', () => {
        expect(exportSvgCard(snap({ journeyCleared: false }))).not.toContain('akesi sewi — moli');
    });

    it('renders up to 24 word cells', () => {
        const many: MasteredWord[] = Array.from({ length: 30 }, (_, i) => word(`w${i}`, 30 - i));
        const svg = exportSvgCard(snap({ words: many }));
        const textNodes = (svg.match(/<text[^>]*>w\d+<\/text>/g) ?? []).length;
        expect(textNodes).toBeLessThanOrEqual(24);
        expect(textNodes).toBeGreaterThan(0);
    });

    it('escapes XML special chars in player name', () => {
        const svg = exportSvgCard(snap({ playerName: '<hack>&"' }));
        expect(svg).toContain('&lt;hack&gt;&amp;&quot;');
        expect(svg).not.toContain('<hack>&"');
    });
});
