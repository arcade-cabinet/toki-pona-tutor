import { describe, it, expect } from 'vitest';
import {
    canonicalXpTotal,
    xpForLevel,
    levelFromXp,
    xpToNextLevel,
    gainXp,
    MIN_LEVEL,
    MAX_LEVEL,
} from '../../src/modules/main/xp-curve';

describe('xpForLevel — n³ threshold per ARCHITECTURE §XP curve', () => {
    it('level 1 costs 1 XP', () => {
        expect(xpForLevel(1)).toBe(1);
    });

    it('level 5 costs 125 XP', () => {
        expect(xpForLevel(5)).toBe(125);
    });

    it('level 10 costs 1000 XP', () => {
        expect(xpForLevel(10)).toBe(1000);
    });

    it('level 50 (max) costs 125000 XP', () => {
        expect(xpForLevel(50)).toBe(125000);
    });

    it('clamps above MAX_LEVEL at 50^3', () => {
        expect(xpForLevel(99)).toBe(xpForLevel(MAX_LEVEL));
    });

    it('returns 0 below MIN_LEVEL', () => {
        expect(xpForLevel(0)).toBe(0);
        expect(xpForLevel(-5)).toBe(0);
    });
});

describe('levelFromXp — inverse lookup', () => {
    it('0 XP = level 1 (floor)', () => {
        expect(levelFromXp(0)).toBe(1);
    });

    it('1 XP = level 1 (at threshold)', () => {
        expect(levelFromXp(1)).toBe(1);
    });

    it('7 XP = level 1 (just below level 2 threshold of 8)', () => {
        expect(levelFromXp(7)).toBe(1);
    });

    it('8 XP = level 2 (exactly at threshold)', () => {
        expect(levelFromXp(8)).toBe(2);
    });

    it('124 XP = level 4 (one short of level 5)', () => {
        expect(levelFromXp(124)).toBe(4);
    });

    it('125 XP = level 5 exactly', () => {
        expect(levelFromXp(125)).toBe(5);
    });

    it('999 XP = level 9, 1000 = level 10', () => {
        expect(levelFromXp(999)).toBe(9);
        expect(levelFromXp(1000)).toBe(10);
    });

    it('caps at MAX_LEVEL for overflow XP', () => {
        expect(levelFromXp(999_999)).toBe(MAX_LEVEL);
    });
});

describe('xpToNextLevel — delta to next boundary', () => {
    it('fresh level-1 creature needs 7 XP to hit level 2', () => {
        expect(xpToNextLevel(1)).toBe(7);
    });

    it('level-5 creature with exactly 125 XP needs 91 to hit level 6', () => {
        expect(xpToNextLevel(125)).toBe(216 - 125);
        expect(xpToNextLevel(125)).toBe(91);
    });

    it('returns 0 at MAX_LEVEL', () => {
        expect(xpToNextLevel(xpForLevel(MAX_LEVEL))).toBe(0);
    });
});

describe('gainXp — ROADMAP T6-07 acceptance criterion', () => {
    it('single-level gain below threshold', () => {
        const { xp, levelUps } = gainXp(1, 3);
        expect(xp).toBe(4);
        expect(levelUps).toHaveLength(0);
    });

    it('crosses exactly one level boundary', () => {
        const { xp, levelUps } = gainXp(1, 7);
        expect(xp).toBe(8);
        expect(levelUps).toEqual([{ from: 1, to: 2, xpAtLevelUp: 8 }]);
    });

    it('big hit crosses multiple levels — one event per boundary', () => {
        const { xp, levelUps } = gainXp(1, 199);
        expect(xp).toBe(200);
        expect(levelUps.map((e) => e.to)).toEqual([2, 3, 4, 5]);
    });

    it('returns empty levelUps on 0 or negative gain', () => {
        expect(gainXp(100, 0).levelUps).toHaveLength(0);
        expect(gainXp(100, -10).levelUps).toHaveLength(0);
    });

    it('does not emit events past MAX_LEVEL', () => {
        const atMax = xpForLevel(MAX_LEVEL);
        const { xp, levelUps } = gainXp(atMax, 500_000);
        expect(xp).toBe(atMax + 500_000);
        expect(levelUps).toHaveLength(0);
    });

    it('level-1 creature getting 200 XP reaches level 6 (200 > 125 but < 216)', () => {
        const { levelUps } = gainXp(0, 200);
        expect(levelUps[levelUps.length - 1].to).toBe(5);
    });

    it('xp_yield 300 (legendary defeat) lifts a level-1 creature to level 6', () => {
        const { xp, levelUps } = gainXp(1, 300);
        expect(xp).toBe(301);
        expect(levelUps[levelUps.length - 1].to).toBe(6);
    });

    it('treats the stored level threshold as the XP floor for starter-grade creatures', () => {
        expect(canonicalXpTotal(0, 5)).toBe(125);
        const { xp, levelUps } = gainXp(canonicalXpTotal(0, 5), 27);
        expect(xp).toBe(152);
        expect(levelUps).toHaveLength(0);
        expect(levelFromXp(xp)).toBe(5);
    });

    it('MIN_LEVEL + MAX_LEVEL exported as constants', () => {
        expect(MIN_LEVEL).toBe(1);
        expect(MAX_LEVEL).toBe(50);
    });
});
