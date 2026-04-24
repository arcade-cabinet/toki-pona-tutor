import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import type { RpgPlayer } from '@rpgjs/server';
import {
    observe,
    buildIndex,
    mostSighted,
    recentEntries,
    exportDump,
    type SentenceRecord,
} from '../../src/modules/main/sentence-log';
import { playDialog } from '../../src/modules/main/dialog';
import { showSentenceLog } from '../../src/modules/main/vocabulary-screen';
import {
    getSentenceLogCount,
    listSentenceLog,
    recordSentenceLine,
} from '../../src/platform/persistence/queries';
import { resetPersistedRuntimeState } from '../../src/platform/persistence/runtime-state';

const rec = (text: string, overrides: Partial<SentenceRecord> = {}): SentenceRecord => ({
    text,
    en: 'placeholder',
    first_seen: '2026-04-20T00:00:00Z',
    sightings: 1,
    source: 'test',
    ...overrides,
});

describe('observe — first vs repeat sightings', () => {
    it('first-ever sighting creates a record with sightings=1', () => {
        const r = observe(
            { text: 'The orchard path is safe.', source: 'jan_sewi_intro', now: '2026-04-20T00:00:00Z' },
            undefined,
        );
        expect(r.isNewSighting).toBe(true);
        expect(r.record.sightings).toBe(1);
        expect(r.record.first_seen).toBe('2026-04-20T00:00:00Z');
        expect(r.record.source).toBe('jan_sewi_intro');
    });

    it('repeat sighting bumps sightings counter', () => {
        const existing = rec('The orchard path is safe.', { sightings: 3, first_seen: '2026-04-20T00:00:00Z' });
        const r = observe(
            { text: 'The orchard path is safe.', source: 'shopkeep_stall', now: '2026-04-20T01:00:00Z' },
            existing,
        );
        expect(r.isNewSighting).toBe(false);
        expect(r.record.sightings).toBe(4);
    });

    it('repeat sighting does NOT overwrite first_seen', () => {
        const existing = rec('The orchard path is safe.', { first_seen: '2026-04-20T00:00:00Z', sightings: 1 });
        const r = observe(
            { text: 'The orchard path is safe.', source: 'later', now: '2026-04-21T00:00:00Z' },
            existing,
        );
        expect(r.record.first_seen).toBe('2026-04-20T00:00:00Z');
    });

    it('repeat sighting does NOT overwrite source', () => {
        const existing = rec('The orchard path is safe.', { source: 'original', sightings: 1 });
        const r = observe(
            { text: 'The orchard path is safe.', source: 'different', now: '2026-04-20T01:00:00Z' },
            existing,
        );
        expect(r.record.source).toBe('original');
    });
});

describe('buildIndex — text-keyed lookup', () => {
    it('builds a map keyed by text', () => {
        const entries = [rec('a b'), rec('c d'), rec('e f')];
        const idx = buildIndex(entries);
        expect(idx.size).toBe(3);
        expect(idx.get('c d')).toEqual(entries[1]);
    });

    it('later entries with same text overwrite earlier (last-write-wins)', () => {
        const a1 = rec('a b', { sightings: 1 });
        const a2 = rec('a b', { sightings: 7 });
        const idx = buildIndex([a1, a2]);
        expect(idx.get('a b')?.sightings).toBe(7);
    });

    it('empty array yields empty map', () => {
        expect(buildIndex([]).size).toBe(0);
    });
});

describe('mostSighted — top N by sightings', () => {
    it('sorts by sightings desc', () => {
        const entries = [rec('a', { sightings: 1 }), rec('b', { sightings: 5 }), rec('c', { sightings: 3 })];
        const top = mostSighted(entries, 2);
        expect(top.map((e) => e.text)).toEqual(['b', 'c']);
    });

    it('breaks ties by first_seen asc (older first)', () => {
        const entries = [
            rec('a', { sightings: 5, first_seen: '2026-04-20T02:00:00Z' }),
            rec('b', { sightings: 5, first_seen: '2026-04-20T01:00:00Z' }),
        ];
        const top = mostSighted(entries, 2);
        expect(top[0].text).toBe('b');
    });

    it('defaults limit to 10', () => {
        const entries = Array.from({ length: 20 }, (_, i) => rec(`note${i}`, { sightings: i }));
        expect(mostSighted(entries)).toHaveLength(10);
    });
});

describe('recentEntries — first-seen within window', () => {
    const entries = [
        rec('old', { first_seen: '2026-04-19T00:00:00Z' }),
        rec('yesterday', { first_seen: '2026-04-19T12:00:00Z' }),
        rec('now', { first_seen: '2026-04-20T11:00:00Z' }),
    ];

    it('within 24h window excludes older than 24h', () => {
        const recent = recentEntries(entries, '2026-04-20T12:00:00Z', 24);
        expect(recent.map((e) => e.text)).toEqual(['now', 'yesterday']);
    });

    it('sorted first-seen desc (newest first)', () => {
        const recent = recentEntries(entries, '2026-04-20T12:00:00Z', 24);
        expect(recent[0].text).toBe('now');
    });

    it('0h window returns empty', () => {
        expect(recentEntries(entries, '2026-04-20T12:00:00Z', 0)).toEqual([]);
    });
});

describe('exportDump — field-note newline-delimited', () => {
    it('sorts alphabetically by text', () => {
        const entries = [rec('b'), rec('a'), rec('c')];
        const out = exportDump(entries);
        expect(out.split('\n').map((l) => l.split('    //')[0])).toEqual(['a', 'b', 'c']);
    });

    it('includes sightings + first_seen metadata', () => {
        const entries = [rec('The orchard path is safe.', { sightings: 3, first_seen: '2026-04-20T00:00:00Z' })];
        const out = exportDump(entries);
        expect(out).toContain('sightings=3');
        expect(out).toContain('first=2026-04-20T00:00:00Z');
    });

    it('does NOT include the hidden source copy', () => {
        const entries = [rec('The orchard path is safe.', { en: 'secret english' })];
        expect(exportDump(entries)).not.toContain('secret english');
    });

    it('empty input yields empty string', () => {
        expect(exportDump([])).toBe('');
    });
});

describe('sentence log persistence and player surface', () => {
    beforeEach(async () => {
        await resetPersistedRuntimeState({ includeSaves: true });
    });

    afterEach(async () => {
        await resetPersistedRuntimeState({ includeSaves: true });
    });

    it('records first and repeat sightings through the SQLite query layer', async () => {
        await recordSentenceLine({
            text: 'The orchard path is safe.',
            en: 'The orchard path is safe.',
            source: 'test',
            now: '2026-04-20T00:00:00Z',
        });
        await recordSentenceLine({
            text: 'The orchard path is safe.',
            en: 'The orchard path is safe again.',
            source: 'later',
            now: '2026-04-20T01:00:00Z',
        });

        const entries = await listSentenceLog();
        expect(entries).toHaveLength(1);
        expect(entries[0]).toMatchObject({
            text: 'The orchard path is safe.',
            en: 'The orchard path is safe.',
            first_seen: '2026-04-20T00:00:00Z',
            sightings: 2,
            source: 'test',
        });
    });

    it('playDialog speaks English beats without recording generated translation lines', async () => {
        const spoken: string[] = [];
        const player = {
            showText: async (line: string) => {
                spoken.push(line);
            },
        } as unknown as RpgPlayer;

        await playDialog(player, 'selby_starter_intro');

        expect(spoken).toContain('Rivers, today you start your own investigation.');
        expect(spoken).toContain('Three creatures answered the call.');
        expect(spoken).toContain('Choose the partner you trust at your side.');
        expect(await getSentenceLogCount()).toBe(0);
    });

    it('showSentenceLog gives the player a field-log surface', async () => {
        const lines: string[] = [];
        const player = {
            showText: async (line: string) => {
                lines.push(line);
            },
        } as unknown as RpgPlayer;

        await recordSentenceLine({
            text: 'The orchard path is safe.',
            en: 'secret english',
            source: 'test',
            now: '2026-04-20T00:00:00Z',
        });

        await showSentenceLog(player);

        expect(lines).toHaveLength(1);
        expect(lines[0]).toContain('Field log: 1');
        expect(lines[0]).toContain('The orchard path is safe.');
        expect(lines[0]).toContain('sightings=1');
        expect(lines[0]).not.toContain('secret english');
    });
});
