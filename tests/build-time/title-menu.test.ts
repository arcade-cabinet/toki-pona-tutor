import { describe, expect, it } from 'vitest';
import { buildTitleMenuEntries } from '../../src/modules/main/title-menu';

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
