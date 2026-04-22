import { describe, expect, it } from 'vitest';
import {
    buildDefeatScreenView,
    DEFEAT_SCREEN_ENTER_MS,
    DEFEAT_SCREEN_SETTLE_MS,
    resolveDefeatScreenLabel,
} from '../../src/modules/main/defeat-screen';

describe('defeat screen view model', () => {
    it('uses safe-village labels for respawn destinations', () => {
        expect(resolveDefeatScreenLabel('ma_tomo_lili')).toBe('ma tomo lili');
        expect(resolveDefeatScreenLabel('ma_telo')).toBe('ma telo');
        expect(resolveDefeatScreenLabel('ma_lete')).toBe('ma lete');
    });

    it('allows explicit labels and readable unknown map fallbacks', () => {
        expect(resolveDefeatScreenLabel('ma_tomo_lili', 'tomo awen')).toBe('tomo awen');
        expect(resolveDefeatScreenLabel('ma_ante')).toBe('ma ante');
    });

    it('builds the fallen and returning phases', () => {
        expect(buildDefeatScreenView({ targetMap: 'ma_tomo_lili' })).toMatchObject({
            phase: 'fallen',
            statusLabel: 'pakala!',
            detailLabel: 'o awen lili',
            label: 'ma tomo lili',
        });
        expect(buildDefeatScreenView({ targetMap: 'ma_tomo_lili', phase: 'returning' })).toMatchObject({
            phase: 'returning',
            statusLabel: 'sina tawa ma tomo',
            detailLabel: 'sijelo li kama pona',
            label: 'ma tomo lili',
        });
    });

    it('keeps the screen visible long enough to read during browser respawn', () => {
        expect(DEFEAT_SCREEN_ENTER_MS + DEFEAT_SCREEN_SETTLE_MS).toBeGreaterThanOrEqual(700);
    });
});
