import { describe, it, expect } from 'vitest';
import {
    childType,
    averagedStats,
    inheritedLearnset,
    hatch,
    type ParentSnapshot,
} from '../../src/modules/main/daycare';

const parent = (overrides: Partial<ParentSnapshot> = {}): ParentSnapshot => ({
    speciesId: 'kon_moli',
    type: 'seli',
    base_stats: { hp: 50, attack: 40, defense: 30, speed: 60 },
    learnset: [
        { level: 1, move_id: 'seli_lili' },
        { level: 1, move_id: 'utala_lili' },
        { level: 8, move_id: 'seli_wawa' },
    ],
    ...overrides,
});

describe('childType — type inheritance rules', () => {
    it('same type inherited', () => {
        expect(childType('seli', 'seli')).toBe('seli');
        expect(childType('wawa', 'wawa')).toBe('wawa');
    });

    it('wawa dominates any other type', () => {
        expect(childType('wawa', 'seli')).toBe('wawa');
        expect(childType('kasi', 'wawa')).toBe('wawa');
        expect(childType('wawa', 'telo')).toBe('wawa');
    });

    it('lete defers to non-lete parent', () => {
        expect(childType('lete', 'seli')).toBe('seli');
        expect(childType('kasi', 'lete')).toBe('kasi');
    });

    it('lete × lete stays lete', () => {
        expect(childType('lete', 'lete')).toBe('lete');
    });

    it('seli × telo → kasi (neutral)', () => {
        expect(childType('seli', 'telo')).toBe('kasi');
        expect(childType('telo', 'seli')).toBe('kasi');
    });

    it('seli × kasi → seli', () => {
        expect(childType('seli', 'kasi')).toBe('seli');
        expect(childType('kasi', 'seli')).toBe('seli');
    });

    it('telo × kasi → telo', () => {
        expect(childType('telo', 'kasi')).toBe('telo');
        expect(childType('kasi', 'telo')).toBe('telo');
    });
});

describe('averagedStats — mean of parents ± jitter', () => {
    const a = { hp: 50, attack: 40, defense: 30, speed: 60 };
    const b = { hp: 100, attack: 80, defense: 40, speed: 30 };

    it('no jitter — exact arithmetic mean', () => {
        const r = averagedStats(a, b, 0);
        expect(r).toEqual({ hp: 75, attack: 60, defense: 35, speed: 45 });
    });

    it('jitter stays within ±jitterFrac band', () => {
        const rng = () => 0.5; // rng*2-1 = 0 → no delta
        const r = averagedStats(a, b, 0.1, rng);
        expect(r).toEqual({ hp: 75, attack: 60, defense: 35, speed: 45 });
    });

    it('jitter max-negative clamps to min 1', () => {
        const rng = () => 0; // rng*2-1 = -1 → -jitter*mean
        const r = averagedStats({ hp: 3, attack: 3, defense: 3, speed: 3 }, { hp: 3, attack: 3, defense: 3, speed: 3 }, 0.9, rng);
        expect(r.hp).toBeGreaterThanOrEqual(1);
    });

    it('jitter high-end clamps to max 250', () => {
        const rng = () => 1; // rng*2-1 = 1 → +jitter*mean
        const r = averagedStats({ hp: 240, attack: 240, defense: 240, speed: 240 }, { hp: 240, attack: 240, defense: 240, speed: 240 }, 0.5, rng);
        expect(r.hp).toBeLessThanOrEqual(250);
    });
});

describe('inheritedLearnset — union of level-1 moves + child low-level', () => {
    it('dedupes shared level-1 moves', () => {
        const a = parent({ learnset: [{ level: 1, move_id: 'utala_lili' }, { level: 1, move_id: 'seli_lili' }] });
        const b = parent({ learnset: [{ level: 1, move_id: 'utala_lili' }, { level: 1, move_id: 'telo_lili' }] });
        const r = inheritedLearnset(a, b, []);
        const moves = r.map((e) => e.move_id);
        expect(moves).toContain('utala_lili');
        expect(moves).toContain('seli_lili');
        expect(moves).toContain('telo_lili');
        expect(moves.filter((m) => m === 'utala_lili')).toHaveLength(1);
    });

    it('adds child-species moves up to level 5', () => {
        const a = parent({ learnset: [{ level: 1, move_id: 'utala_lili' }] });
        const b = parent({ learnset: [{ level: 1, move_id: 'seli_lili' }] });
        const childSpecies = [
            { level: 1, move_id: 'kasi_lili' },
            { level: 5, move_id: 'kasi_wawa' },
            { level: 10, move_id: 'wawa_waso' }, // excluded (> 5)
        ];
        const r = inheritedLearnset(a, b, childSpecies);
        const moves = r.map((e) => e.move_id);
        expect(moves).toContain('kasi_lili');
        expect(moves).toContain('kasi_wawa');
        expect(moves).not.toContain('wawa_waso');
    });

    it('excludes parent moves above level 1', () => {
        const a = parent({
            learnset: [
                { level: 1, move_id: 'utala_lili' },
                { level: 8, move_id: 'seli_wawa' },
            ],
        });
        const b = parent({ learnset: [{ level: 1, move_id: 'telo_lili' }] });
        const r = inheritedLearnset(a, b, []);
        const moves = r.map((e) => e.move_id);
        expect(moves).not.toContain('seli_wawa');
    });

    it('output is sorted by level then move_id', () => {
        const a = parent({ learnset: [{ level: 1, move_id: 'utala_lili' }] });
        const b = parent({ learnset: [{ level: 1, move_id: 'seli_lili' }] });
        const r = inheritedLearnset(a, b, [{ level: 3, move_id: 'kasi_lili' }]);
        expect(r[0].level).toBeLessThanOrEqual(r[1].level);
        expect(r[r.length - 1].level).toBe(3);
    });
});

describe('hatch — full offspring', () => {
    it('produces a level-1 offspring with derived type + stats + learnset', () => {
        const baby = hatch({
            parentA: parent({ speciesId: 'kon_moli', type: 'seli' }),
            parentB: parent({ speciesId: 'telo_jaki', type: 'telo' }),
            childSpeciesLearnset: [{ level: 1, move_id: 'kasi_lili' }],
            jitterFrac: 0,
        });
        expect(baby.level).toBe(1);
        expect(baby.type).toBe('kasi'); // seli × telo
        expect(baby.speciesId).toBe('kon_moli_lili');
        expect(baby.base_stats.hp).toBeGreaterThan(0);
        expect(baby.learnset.length).toBeGreaterThan(0);
    });

    it('honors explicit childSpeciesId', () => {
        const baby = hatch({
            parentA: parent(),
            parentB: parent({ speciesId: 'jan_moli' }),
            childSpeciesId: 'custom_baby',
            childSpeciesLearnset: [],
            jitterFrac: 0,
        });
        expect(baby.speciesId).toBe('custom_baby');
    });
});
