import { describe, expect, it } from 'vitest';
import { DEFAULT_TEXT_SPEED_CPS, typewriterIntervalMsForCps } from '../../src/config/typewriter-speed';

describe('typewriter speed mapping — T5-10', () => {
    it('maps 0 cps and negative values to instant text', () => {
        expect(typewriterIntervalMsForCps(0)).toBeNull();
        expect(typewriterIntervalMsForCps(-10)).toBeNull();
    });

    it('maps persisted cps presets to millisecond intervals', () => {
        expect(typewriterIntervalMsForCps(24)).toBe(42);
        expect(typewriterIntervalMsForCps(48)).toBe(21);
        expect(typewriterIntervalMsForCps(96)).toBe(10);
        expect(typewriterIntervalMsForCps(120)).toBe(8);
    });

    it('falls back to the documented default when the stored value is not finite', () => {
        expect(DEFAULT_TEXT_SPEED_CPS).toBe(48);
        expect(typewriterIntervalMsForCps(Number.NaN)).toBe(21);
    });
});
