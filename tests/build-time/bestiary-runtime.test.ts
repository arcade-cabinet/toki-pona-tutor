import { afterEach, describe, expect, it } from 'vitest';
import {
    getBestiaryState,
    recordBestiaryCaught,
    recordBestiarySeen,
} from '../../src/platform/persistence/queries';
import {
    exportPersistedRuntimeState,
    importPersistedRuntimeState,
    resetPersistedRuntimeState,
} from '../../src/platform/persistence/runtime-state';
import { buildBestiaryPanel } from '../../src/modules/main/bestiary-panel';

afterEach(async () => {
    await resetPersistedRuntimeState({ includeSaves: true });
});

describe('bestiary persistence', () => {
    it('records seen and caught entries through SQLite-backed runtime state', async () => {
        const seenAt = new Date('2026-04-01T00:00:00Z');
        const caughtAt = new Date('2026-04-02T00:00:00Z');

        await recordBestiarySeen('bramble_imp', seenAt);
        await recordBestiaryCaught('bramble_imp', caughtAt);

        expect(await getBestiaryState()).toEqual({
            bramble_imp: {
                seenAt: seenAt.toISOString(),
                caughtAt: caughtAt.toISOString(),
            },
        });
    });

    it('round-trips bestiary entries through persisted runtime-state export/import', async () => {
        await recordBestiaryCaught('ashcat', new Date('2026-04-01T00:00:00Z'));

        const exported = await exportPersistedRuntimeState();
        await resetPersistedRuntimeState({ includeSaves: true });
        await importPersistedRuntimeState(exported);

        expect(await getBestiaryState()).toEqual({
            ashcat: {
                seenAt: '2026-04-01T00:00:00.000Z',
                caughtAt: '2026-04-01T00:00:00.000Z',
            },
        });
    });
});

describe('buildBestiaryPanel', () => {
    it('builds bestiary rows with caught, seen, and unknown tiers', async () => {
        const panel = buildBestiaryPanel({
            ashcat: {
                seenAt: '2026-04-01T00:00:00.000Z',
                caughtAt: '2026-04-01T00:00:00.000Z',
            },
            bramble_imp: {
                seenAt: '2026-04-02T00:00:00.000Z',
            },
        });

        expect(panel.title).toBe('Bestiary — 1 caught');
        expect(panel.rows.find((row) => row.speciesId === 'ashcat')).toEqual({
            speciesId: 'ashcat',
            tier: 'caught',
            label: 'Ashcat',
            meta: 'caught · fire',
            testId: 'bestiary-entry-ashcat',
            description: 'A smoky little cat with ember-bright eyes and a loyal streak.',
            readText: 'Ashcat\nA smoky little cat with ember-bright eyes and a loyal streak.',
        });
        expect(panel.rows.find((row) => row.speciesId === 'bramble_imp')).toEqual({
            speciesId: 'bramble_imp',
            tier: 'seen',
            label: 'Bramble Imp',
            meta: 'seen · wild',
            testId: 'bestiary-entry-bramble_imp',
            description: 'A small thorny trickster that darts through brush and laughs at fences.',
            readText: 'Bramble Imp\nA small thorny trickster that darts through brush and laughs at fences.',
        });
        expect(panel.rows.some((row) => row.tier === 'unknown' && row.label.startsWith('???'))).toBe(true);
        expect(panel.rows.find((row) => row.tier === 'unknown')).not.toHaveProperty('readText');
    });
});
