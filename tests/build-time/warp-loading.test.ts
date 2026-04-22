import { describe, expect, it } from 'vitest';
import {
    buildWarpLoadingView,
    resolveWarpLoadingLabel,
    WARP_LOADING_ENTER_MS,
    WARP_LOADING_SETTLE_MS,
} from '../../src/modules/main/warp-loading';

describe('warp loading overlay model', () => {
    it('uses canonical TP-ish destination labels for authored maps', () => {
        expect(resolveWarpLoadingLabel('nasin_pi_telo')).toBe('nasin pi telo');
        expect(resolveWarpLoadingLabel('ma_lete')).toBe('ma lete');
    });

    it('allows explicit labels and falls back from unknown map ids', () => {
        expect(resolveWarpLoadingLabel('ma_telo', 'ma tomo')).toBe('ma tomo');
        expect(resolveWarpLoadingLabel('unknown_map')).toBe('unknown map');
    });

    it('models enter and settle phases for the GUI', () => {
        expect(buildWarpLoadingView({ targetMap: 'nasin_wan' })).toMatchObject({
            label: 'nasin wan',
            phase: 'enter',
            statusLabel: 'tawa ma',
            detailLabel: 'o awen lili',
        });
        expect(buildWarpLoadingView({ targetMap: 'nasin_wan', phase: 'settle' })).toMatchObject({
            label: 'nasin wan',
            phase: 'settle',
            statusLabel: 'kama pona',
            detailLabel: 'ma li kama',
        });
    });

    it('keeps the visible window long enough for browser assertions', () => {
        expect(WARP_LOADING_ENTER_MS + WARP_LOADING_SETTLE_MS).toBeGreaterThanOrEqual(600);
    });
});
