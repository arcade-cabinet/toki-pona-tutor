import { describe, it, expect } from 'vitest';
import { typeMultiplier, COMBAT_TYPES, type CombatType } from '../../src/modules/main/type-matchup';

describe('typeMultiplier — 5×5 matrix per ARCHITECTURE §Types', () => {
    it('seli/telo/kasi forms the classic rock-paper-scissors cycle', () => {
        expect(typeMultiplier('seli', 'kasi')).toBe(2);
        expect(typeMultiplier('telo', 'seli')).toBe(2);
        expect(typeMultiplier('kasi', 'telo')).toBe(2);

        expect(typeMultiplier('kasi', 'seli')).toBe(0.5);
        expect(typeMultiplier('seli', 'telo')).toBe(0.5);
        expect(typeMultiplier('telo', 'kasi')).toBe(0.5);
    });

    it('same-type matchups are neutral', () => {
        for (const t of COMBAT_TYPES) {
            expect(typeMultiplier(t, t)).toBe(t === 'lete' ? 0.5 : 1);
        }
    });

    it('wawa is flat 1.0× against every defender (bruiser — no advantage)', () => {
        for (const d of COMBAT_TYPES) {
            expect(typeMultiplier('wawa', d, false)).toBe(1);
            expect(typeMultiplier('wawa', d, true)).toBe(1);
        }
    });

    it('lete is 2× against waso-tagged defenders regardless of primary type', () => {
        for (const d of COMBAT_TYPES) {
            expect(typeMultiplier('lete', d, true)).toBe(2);
        }
    });

    it('lete is 0.5× against non-waso (weak offensive coverage otherwise)', () => {
        for (const d of COMBAT_TYPES) {
            expect(typeMultiplier('lete', d, false)).toBe(0.5);
        }
    });

    it('covers all 25 primary-type matchups without throwing', () => {
        const seen: Record<string, number> = {};
        for (const a of COMBAT_TYPES) {
            for (const d of COMBAT_TYPES) {
                const key = `${a}>${d}`;
                seen[key] = typeMultiplier(a as CombatType, d as CombatType, false);
            }
        }
        expect(Object.keys(seen)).toHaveLength(25);
        for (const mult of Object.values(seen)) {
            expect([0.5, 1, 2]).toContain(mult);
        }
    });

    it('waso tag only amplifies lete; other attackers ignore it', () => {
        expect(typeMultiplier('seli', 'kasi', true)).toBe(2);
        expect(typeMultiplier('seli', 'kasi', false)).toBe(2);
        expect(typeMultiplier('wawa', 'seli', true)).toBe(1);
        expect(typeMultiplier('kasi', 'telo', true)).toBe(2);
    });
});
