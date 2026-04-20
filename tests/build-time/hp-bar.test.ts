import { describe, it, expect } from 'vitest';
import {
    hpRatio,
    hpClassFor,
    hpTpLabel,
    HP_CRITICAL_THRESHOLD,
    HP_WOUNDED_THRESHOLD,
    type HpClass,
} from '../../src/styles/hp-bar';

/**
 * T2-02: HP-bar threshold helper.
 *
 * Pure mapping from (current, max) to one of three CSS classes that
 * BRAND.md §HP already defines in brand.css:
 *
 *   ratio > 0.50  → `hp-healthy`   (kasi green)
 *   0.20 < r ≤ 50 → `hp-wounded`   (wawa amber)
 *   ratio ≤ 0.20  → `hp-critical`  (seli red, pulses)
 *
 * Every component that renders a creature's HP — party panel, combat
 * overlay, trainer pre-fight reveals — imports this helper to keep
 * the threshold math in ONE place. Components must not hard-code
 * the cutoffs themselves or the HP color language drifts.
 */

describe('hpRatio', () => {
    it('returns 1 at full HP', () => {
        expect(hpRatio(20, 20)).toBe(1);
    });

    it('returns 0 at zero HP', () => {
        expect(hpRatio(0, 20)).toBe(0);
    });

    it('returns 0.5 at half HP', () => {
        expect(hpRatio(10, 20)).toBe(0.5);
    });

    it('clamps overshoot (current > max) to 1', () => {
        expect(hpRatio(25, 20)).toBe(1);
    });

    it('clamps negative current to 0', () => {
        expect(hpRatio(-5, 20)).toBe(0);
    });

    it('returns 0 when max is 0 (no divide-by-zero)', () => {
        expect(hpRatio(10, 0)).toBe(0);
    });

    it('returns 0 when max is negative', () => {
        expect(hpRatio(5, -10)).toBe(0);
    });
});

describe('hpClassFor — threshold mapping', () => {
    it('full HP → hp-healthy', () => {
        expect(hpClassFor(20, 20)).toBe<HpClass>('hp-healthy');
    });

    it('just above 50% → hp-healthy', () => {
        expect(hpClassFor(11, 20)).toBe<HpClass>('hp-healthy');
    });

    it('exactly 50% → hp-wounded (not healthy)', () => {
        expect(hpClassFor(10, 20)).toBe<HpClass>('hp-wounded');
    });

    it('just above 20% → hp-wounded', () => {
        expect(hpClassFor(5, 20)).toBe<HpClass>('hp-wounded');
    });

    it('exactly 20% → hp-critical (not wounded)', () => {
        expect(hpClassFor(4, 20)).toBe<HpClass>('hp-critical');
    });

    it('just above 0% → hp-critical', () => {
        expect(hpClassFor(1, 20)).toBe<HpClass>('hp-critical');
    });

    it('zero HP → hp-critical', () => {
        expect(hpClassFor(0, 20)).toBe<HpClass>('hp-critical');
    });

    it('overshoot HP is clamped → hp-healthy', () => {
        expect(hpClassFor(999, 20)).toBe<HpClass>('hp-healthy');
    });

    it('negative HP is clamped → hp-critical', () => {
        expect(hpClassFor(-5, 20)).toBe<HpClass>('hp-critical');
    });

    it('zero-max returns critical (cannot be healthy with no HP pool)', () => {
        expect(hpClassFor(10, 0)).toBe<HpClass>('hp-critical');
    });
});

describe('threshold constants', () => {
    it('HP_WOUNDED_THRESHOLD is 0.50', () => {
        expect(HP_WOUNDED_THRESHOLD).toBe(0.5);
    });

    it('HP_CRITICAL_THRESHOLD is 0.20', () => {
        expect(HP_CRITICAL_THRESHOLD).toBe(0.2);
    });

    it('thresholds are ordered: critical < wounded', () => {
        expect(HP_CRITICAL_THRESHOLD).toBeLessThan(HP_WOUNDED_THRESHOLD);
    });
});

describe('hpTpLabel — single-word TP status label', () => {
    it('healthy → wawa (powerful)', () => {
        expect(hpTpLabel(20, 20)).toBe('wawa');
    });

    it('wounded → pakala (damaged)', () => {
        expect(hpTpLabel(10, 20)).toBe('pakala');
    });

    it('critical → moli (dying)', () => {
        expect(hpTpLabel(2, 20)).toBe('moli');
    });

    it('zero HP → moli', () => {
        expect(hpTpLabel(0, 20)).toBe('moli');
    });
});
