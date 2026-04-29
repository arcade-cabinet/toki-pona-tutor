import { describe, expect, it } from 'vitest';
import { buildTitleMenuEntries, FAMOUS_SEEDS } from '../../src/modules/main/title-menu';

describe('title menu model', () => {
    it('shows new game, settings, and quit with no save present', () => {
        expect(buildTitleMenuEntries([])).toEqual([
            { id: 'new', label: 'New Game' },
            { id: 'settings', label: 'Settings' },
            { id: 'quit', label: 'Quit' },
        ]);
    });

    it('keeps continue first and appends quit after settings when a save exists', () => {
        expect(buildTitleMenuEntries([{ index: 3, timestamp: '2026-04-21T12:00:00.000Z' }])).toEqual([
            { id: 'continue', label: 'Continue — 3' },
            { id: 'new', label: 'New Game' },
            { id: 'settings', label: 'Settings' },
            { id: 'quit', label: 'Quit' },
        ]);
    });
});

describe('T156: famous seeds (seed picker presets)', () => {
    it('exports at least 3 named seeds for the demo picker', () => {
        expect(FAMOUS_SEEDS.length).toBeGreaterThanOrEqual(3);
    });

    it('each famous seed has a label and a valid 32-bit seed value', () => {
        for (const entry of FAMOUS_SEEDS) {
            expect(typeof entry.label).toBe('string');
            expect(entry.label.length).toBeGreaterThan(0);
            expect(Number.isInteger(entry.seed)).toBe(true);
            expect(entry.seed).toBeGreaterThanOrEqual(0);
            expect(entry.seed).toBeLessThan(2 ** 32);
        }
    });
});
