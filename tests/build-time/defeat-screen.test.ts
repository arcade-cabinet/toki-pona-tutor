import { describe, expect, it } from 'vitest';
import {
    buildDefeatScreenView,
    DEFEAT_SCREEN_ENTER_MS,
    DEFEAT_SCREEN_SETTLE_MS,
    resolveDefeatScreenLabel,
} from '../../src/modules/main/defeat-screen';

describe('defeat screen view model', () => {
    it('uses safe-village labels for respawn destinations', () => {
        expect(resolveDefeatScreenLabel('riverside_home')).toBe('Riverside Home');
        expect(resolveDefeatScreenLabel('lakehaven')).toBe('Lakehaven');
        expect(resolveDefeatScreenLabel('frostvale')).toBe('Frostvale');
    });

    it('allows explicit labels and readable unknown map fallbacks', () => {
        expect(resolveDefeatScreenLabel('riverside_home', 'tomo awen')).toBe('tomo awen');
        expect(resolveDefeatScreenLabel('ma_ante')).toBe('ma ante');
    });

    it('builds the fallen and returning phases', () => {
        expect(buildDefeatScreenView({ targetMap: 'riverside_home' })).toMatchObject({
            phase: 'fallen',
            statusLabel: 'Knocked down!',
            detailLabel: 'Hold on',
            label: 'Riverside Home',
        });
        expect(buildDefeatScreenView({ targetMap: 'riverside_home', phase: 'returning' })).toMatchObject({
            phase: 'returning',
            statusLabel: 'Heading back',
            detailLabel: 'Your party is recovering',
            label: 'Riverside Home',
        });
    });

    it('keeps the screen visible long enough to read during browser respawn', () => {
        expect(DEFEAT_SCREEN_ENTER_MS + DEFEAT_SCREEN_SETTLE_MS).toBeGreaterThanOrEqual(700);
    });
});
