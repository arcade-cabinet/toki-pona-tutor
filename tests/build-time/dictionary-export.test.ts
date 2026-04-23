import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import type { RpgPlayer } from '@rpgjs/server';
import { FINAL_BOSS_CONFIG } from '../../src/content/gameplay';
import {
    DICTIONARY_EXPORT_EVENT,
    buildDictionaryExportSnapshot,
    exportTextCard,
    exportSvgCard,
    isDictionaryExportPayload,
    showDictionaryExport,
    type ExportSnapshot,
    type ClueRecord,
} from '../../src/modules/main/dictionary-export';
import {
    recordClue,
    setFlag,
} from '../../src/platform/persistence/queries';
import { resetPersistedRuntimeState } from '../../src/platform/persistence/runtime-state';

const word = (id: string, sightings: number, at = '2026-04-20T00:00:00Z'): ClueRecord => ({
    id,
    sightings,
    mastered_at: at,
});

const snap = (overrides: Partial<ExportSnapshot> = {}): ExportSnapshot => ({
    playerName: 'Sam',
    words: [word('wild-signs', 12), word('capture-pods', 8), word('fire-type', 5)],
    journeyCleared: true,
    ngPlusCount: 0,
    exportedAt: '2026-04-20T12:00:00Z',
    ...overrides,
});

describe('exportTextCard', () => {
    it('includes the player name', () => {
        expect(exportTextCard(snap())).toContain('Explorer Sam');
    });

    it('shows total word count', () => {
        const out = exportTextCard(snap());
        expect(out).toContain('clues found: 3');
    });

    it('shows the cleared badge when journeyCleared', () => {
        expect(exportTextCard(snap({ journeyCleared: true, ngPlusCount: 0 }))).toContain('Green dragon defeated');
    });

    it('shows NG+ multiplier on repeat clears', () => {
        expect(exportTextCard(snap({ ngPlusCount: 2 }))).toContain('× 3');
    });

    it('shows in-progress marker when not cleared', () => {
        expect(exportTextCard(snap({ journeyCleared: false }))).toContain('journey in progress');
    });

    it('sorts top clues by sightings desc', () => {
        const out = exportTextCard(snap());
        const wildIdx = out.indexOf('Wild signs');
        const fireIdx = out.indexOf('Fire type');
        expect(wildIdx).toBeLessThan(fireIdx);
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

    it('empty clues shows friendly empty state', () => {
        expect(exportTextCard(snap({ words: [] }))).toContain('no clues yet');
    });

    it('caps top list at 20 clues', () => {
        const many: ClueRecord[] = Array.from({ length: 30 }, (_, i) =>
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
        expect(exportSvgCard(snap())).toContain('Explorer Sam');
    });

    it('includes the clue count as a big number', () => {
        const svg = exportSvgCard(snap());
        expect(svg).toMatch(/<text[^>]*>3<\/text>/);
    });

    it('includes the cleared marker when journeyCleared', () => {
        expect(exportSvgCard(snap())).toContain('green dragon defeated');
    });

    it('omits the cleared marker when not cleared', () => {
        expect(exportSvgCard(snap({ journeyCleared: false }))).not.toContain('green dragon defeated');
    });

    it('renders up to 24 clue cells', () => {
        const many: ClueRecord[] = Array.from({ length: 30 }, (_, i) => word(`w${i}`, 30 - i));
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

describe('clue export runtime wiring', () => {
    beforeEach(async () => {
        await resetPersistedRuntimeState({ includeSaves: true });
    });

    afterEach(async () => {
        await resetPersistedRuntimeState({ includeSaves: true });
    });

    it('builds a snapshot from persisted clues and clear flag', async () => {
        await recordClue('wild-signs');
        await recordClue('wild-signs');
        await recordClue('wild-signs');
        await recordClue('capture-pods');
        await recordClue('capture-pods');
        await setFlag(FINAL_BOSS_CONFIG.clearedFlag, '1');

        const snapshot = await buildDictionaryExportSnapshot({
            playerName: 'Sam',
            exportedAt: '2026-04-20T12:00:00Z',
        });

        expect(snapshot.playerName).toBe('Sam');
        expect(snapshot.journeyCleared).toBe(true);
        expect(snapshot.words.map((entry) => entry.id)).toEqual(['wild-signs']);
        expect(snapshot.words[0]?.sightings).toBe(3);
    });

    it('emits an SVG payload and shows the text card in the dialog layer', async () => {
        const emitted: Array<{ event: string; payload: unknown }> = [];
        const shown: string[] = [];
        const player = {
            emit: (event: string, payload: unknown) => {
                emitted.push({ event, payload });
            },
            showText: async (line: string) => {
                shown.push(line);
            },
        } as unknown as RpgPlayer;
        await recordClue('wild-signs');
        await recordClue('wild-signs');
        await recordClue('wild-signs');

        const payload = await showDictionaryExport(player);

        expect(emitted[0]?.event).toBe(DICTIONARY_EXPORT_EVENT);
        expect(isDictionaryExportPayload(emitted[0]?.payload)).toBe(true);
        expect(payload.filename).toBe('rivers-reckoning-clues.svg');
        expect(payload.textCard).toContain('Wild signs');
        expect(payload.svgCard).toContain('<svg');
        expect(shown[0]).toContain('Clue Journal');
    });
});
