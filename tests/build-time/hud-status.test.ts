import { describe, expect, it } from 'vitest';
import { buildHudLeadStatus } from '../../src/config/hud-status';

describe('buildHudLeadStatus', () => {
    it('formats the lead creature labels and portrait from content metadata', () => {
        const status = buildHudLeadStatus({
            speciesId: 'ashcat',
            level: 5,
            masteredWordCount: 3,
            currentHp: 24,
            maxHp: 48,
        });

        expect(status.primaryLabel).toBe('Ashcat');
        // Species no longer carry a toki-pona `name.tp` post T2-04B, so
        // the secondary label collapses to null when primary matches the
        // id with underscores replaced — see `resolveSecondaryLabel` in
        // src/config/hud-status.ts.
        expect(status.secondaryLabel).toBeNull();
        expect(status.portraitSrc).toBe('/assets/creatures/wraith/wraith.png');
        expect(status.portraitFrame).toMatchObject({
            src: '/assets/creatures/wraith/wraith.png',
            framesWidth: 4,
            framesHeight: 7,
            frameX: 0,
            frameY: 0,
        });
        expect(status.levelLabel).toBe('L5');
        expect(status.masteredLabel).toBe('clues: 3');
        expect(status.hpPercent).toBe(50);
        expect(status.hpClass).toBe('hp-wounded');
    });

    it('falls back cleanly when species metadata is missing', () => {
        const status = buildHudLeadStatus({
            speciesId: 'mystery_beast',
            level: 9,
            masteredWordCount: 0,
            currentHp: 10,
            maxHp: 10,
        });

        expect(status.primaryLabel).toBe('mystery beast');
        expect(status.secondaryLabel).toBeNull();
        expect(status.portraitSrc).toBeNull();
        expect(status.portraitFrame).toBeNull();
        expect(status.portraitFallback).toBe('MB');
        expect(status.hpClass).toBe('hp-healthy');
    });
});
