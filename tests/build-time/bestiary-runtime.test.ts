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

        await recordBestiarySeen('jan_ike_lili', seenAt);
        await recordBestiaryCaught('jan_ike_lili', caughtAt);

        expect(await getBestiaryState()).toEqual({
            jan_ike_lili: {
                seenAt: seenAt.toISOString(),
                caughtAt: caughtAt.toISOString(),
            },
        });
    });

    it('round-trips bestiary entries through persisted runtime-state export/import', async () => {
        await recordBestiaryCaught('kon_moli', new Date('2026-04-01T00:00:00Z'));

        const exported = await exportPersistedRuntimeState();
        await resetPersistedRuntimeState({ includeSaves: true });
        await importPersistedRuntimeState(exported);

        expect(await getBestiaryState()).toEqual({
            kon_moli: {
                seenAt: '2026-04-01T00:00:00.000Z',
                caughtAt: '2026-04-01T00:00:00.000Z',
            },
        });
    });
});

describe('buildBestiaryPanel', () => {
    it('builds lipu soweli rows with caught, seen, and unknown tiers', async () => {
        const panel = buildBestiaryPanel({
            kon_moli: {
                seenAt: '2026-04-01T00:00:00.000Z',
                caughtAt: '2026-04-01T00:00:00.000Z',
            },
            jan_ike_lili: {
                seenAt: '2026-04-02T00:00:00.000Z',
            },
        });

        expect(panel.title).toBe('lipu soweli 1 / 43');
        expect(panel.rows.find((row) => row.speciesId === 'kon_moli')).toEqual({
            speciesId: 'kon_moli',
            tier: 'caught',
            label: 'kon moli',
            meta: 'jo · seli',
            testId: 'bestiary-entry-kon_moli',
            description: 'soweli tomo li suwi mute.',
            readText: 'kon moli\nsoweli tomo li suwi mute.',
        });
        expect(panel.rows.find((row) => row.speciesId === 'jan_ike_lili')).toEqual({
            speciesId: 'jan_ike_lili',
            tier: 'seen',
            label: 'jan ike lili',
            meta: 'lukin · kasi',
            testId: 'bestiary-entry-jan_ike_lili',
            description: 'pipi li awen lon.',
            readText: 'jan ike lili\npipi li awen lon.',
        });
        expect(panel.rows.some((row) => row.tier === 'unknown' && row.label.startsWith('???'))).toBe(true);
        expect(panel.rows.find((row) => row.tier === 'unknown')).not.toHaveProperty('readText');
    });
});
