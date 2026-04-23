import { describe, expect, it } from 'vitest';
import {
    buildWarpLoadingView,
    resolveWarpLoadingLabel,
    WARP_LOADING_ENTER_MS,
    WARP_LOADING_SETTLE_MS,
} from '../../src/modules/main/warp-loading';

describe('warp loading overlay model', () => {
    it('uses English destination labels for authored maps', () => {
        expect(resolveWarpLoadingLabel('rivergate_approach')).toBe('Rivergate Approach');
        expect(resolveWarpLoadingLabel('frostvale')).toBe('Frostvale');
    });

    it('allows explicit labels and falls back from unknown map ids', () => {
        expect(resolveWarpLoadingLabel('lakehaven', 'ma tomo')).toBe('ma tomo');
        expect(resolveWarpLoadingLabel('unknown_map')).toBe('unknown map');
    });

    it('models enter and settle phases for the GUI', () => {
        expect(buildWarpLoadingView({ targetMap: 'greenwood_road' })).toMatchObject({
            label: 'Greenwood Road',
            phase: 'enter',
            statusLabel: 'Crossing over',
            detailLabel: 'Hold on',
        });
        expect(buildWarpLoadingView({ targetMap: 'greenwood_road', phase: 'settle' })).toMatchObject({
            label: 'Greenwood Road',
            phase: 'settle',
            statusLabel: 'Arrived',
            detailLabel: 'The path opens',
        });
    });

    it('keeps the visible window long enough for browser assertions', () => {
        expect(WARP_LOADING_ENTER_MS + WARP_LOADING_SETTLE_MS).toBeGreaterThanOrEqual(600);
    });
});
