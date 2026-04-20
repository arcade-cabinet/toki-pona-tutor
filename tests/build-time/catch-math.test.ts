import { describe, it, expect } from 'vitest';
import { catchProbability, rollCatch } from '../../src/modules/main/catch-math';

describe('catchProbability — canonical formula (1 - hp/hpMax) * catchRate * pokiPower', () => {
    it('returns 0 at full HP regardless of poki power', () => {
        expect(catchProbability({ hp: 50, hpMax: 50, catchRate: 0.45, pokiPower: 1.0 })).toBe(0);
        expect(catchProbability({ hp: 50, hpMax: 50, catchRate: 0.45, pokiPower: 1.5 })).toBe(0);
    });

    it('approaches catchRate * pokiPower at 1 HP', () => {
        const p = catchProbability({ hp: 1, hpMax: 50, catchRate: 0.45, pokiPower: 1.0 });
        expect(p).toBeGreaterThan(0.43);
        expect(p).toBeLessThan(0.45);
    });

    it('clamps to [0,1] on high-power poki against high-catch species', () => {
        expect(catchProbability({ hp: 0, hpMax: 50, catchRate: 0.9, pokiPower: 1.5 })).toBe(1);
    });

    it('returns 0 when hpMax is 0 (guard against divide-by-zero)', () => {
        expect(catchProbability({ hp: 0, hpMax: 0, catchRate: 0.5, pokiPower: 1.0 })).toBe(0);
    });

    it('half HP halves the catch chance', () => {
        const p = catchProbability({ hp: 25, hpMax: 50, catchRate: 0.5, pokiPower: 1.0 });
        expect(p).toBeCloseTo(0.25, 5);
    });

    it('poki_wawa (power 1.5) boosts catch chance 1.5× vs poki_lili (power 1.0)', () => {
        const lili = catchProbability({ hp: 10, hpMax: 50, catchRate: 0.4, pokiPower: 1.0 });
        const wawa = catchProbability({ hp: 10, hpMax: 50, catchRate: 0.4, pokiPower: 1.5 });
        expect(wawa / lili).toBeCloseTo(1.5, 5);
    });

    it('clamps HP into [0, hpMax] defensively (overhealed or negative inputs)', () => {
        expect(catchProbability({ hp: 999, hpMax: 50, catchRate: 0.5, pokiPower: 1.0 })).toBe(0);
        expect(catchProbability({ hp: -5, hpMax: 50, catchRate: 0.5, pokiPower: 1.0 })).toBe(0.5);
    });
});

describe('rollCatch — ROADMAP T2-09 acceptance criteria', () => {
    const lowRng = () => 0.05;
    const highRng = () => 0.99;

    it('full HP fails regardless of poki', () => {
        expect(rollCatch({ hp: 50, hpMax: 50, catchRate: 0.9, pokiPower: 1.5 }, lowRng)).toBe(false);
    });

    it('low HP with poki_wawa succeeds ≥90% of the time against mid catch rate', () => {
        let hits = 0;
        const trials = 10_000;
        let seed = 1;
        const rng = () => {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
        for (let i = 0; i < trials; i++) {
            if (rollCatch({ hp: 2, hpMax: 50, catchRate: 0.65, pokiPower: 1.5 }, rng)) hits++;
        }
        // With hp=2/50, catchRate=0.65, pokiPower=1.5 → p ≈ 0.9360, clamped to 0.936
        // Empirically expect ≥ 90% hit rate.
        expect(hits / trials).toBeGreaterThanOrEqual(0.9);
    });

    it('never catches when probability is 0', () => {
        expect(rollCatch({ hp: 50, hpMax: 50, catchRate: 0.9, pokiPower: 1.0 }, lowRng)).toBe(false);
    });

    it('always catches when probability is 1', () => {
        expect(rollCatch({ hp: 0, hpMax: 50, catchRate: 1.0, pokiPower: 1.0 }, highRng)).toBe(true);
    });
});
