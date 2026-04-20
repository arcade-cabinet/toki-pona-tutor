import { describe, it, expect } from 'vitest';
import {
    rollStatusEffect,
    tickStatusEffects,
    damageMultiplierFromStatuses,
    type Status,
} from '../../src/modules/main/status-effect';

const lowRng = () => 0.01;
const highRng = () => 0.99;

describe('rollStatusEffect — status application rules', () => {
    it('seli has 25% burn chance on clean target', () => {
        expect(rollStatusEffect('seli', [], lowRng)).toEqual({ id: 'burn', turnsRemaining: 3 });
        expect(rollStatusEffect('seli', [], highRng)).toBeNull();
    });

    it('seli does not re-burn an already-burning target', () => {
        expect(rollStatusEffect('seli', [{ id: 'burn', turnsRemaining: 2 }], lowRng)).toBeNull();
    });

    it('seli skips wet targets (wet makes seli do 0× damage anyway)', () => {
        expect(rollStatusEffect('seli', [{ id: 'wet', turnsRemaining: 2 }], lowRng)).toBeNull();
    });

    it('telo has 30% wet chance on clean target', () => {
        expect(rollStatusEffect('telo', [], lowRng)).toEqual({ id: 'wet', turnsRemaining: 3 });
        expect(rollStatusEffect('telo', [], highRng)).toBeNull();
    });

    it('telo does not re-wet an already-wet target', () => {
        expect(rollStatusEffect('telo', [{ id: 'wet', turnsRemaining: 1 }], lowRng)).toBeNull();
    });

    it('lete freezes wet targets guaranteed', () => {
        const result = rollStatusEffect('lete', [{ id: 'wet', turnsRemaining: 2 }]);
        expect(result).toEqual({ id: 'frozen', turnsRemaining: 1 });
    });

    it('lete does not freeze dry targets', () => {
        expect(rollStatusEffect('lete', [])).toBeNull();
    });

    it('lete does not re-freeze already-frozen targets', () => {
        expect(rollStatusEffect('lete', [
            { id: 'wet', turnsRemaining: 1 },
            { id: 'frozen', turnsRemaining: 1 },
        ])).toBeNull();
    });

    it('wawa and kasi moves never inflict status', () => {
        expect(rollStatusEffect('wawa', [], lowRng)).toBeNull();
        expect(rollStatusEffect('kasi', [], lowRng)).toBeNull();
    });
});

describe('tickStatusEffects — end-of-turn resolution', () => {
    it('burn ticks 1/16 max-HP damage per turn', () => {
        const result = tickStatusEffects([{ id: 'burn', turnsRemaining: 3 }], 160);
        expect(result.damage).toBe(10);
        expect(result.skipNextTurn).toBe(false);
        expect(result.statuses).toEqual([{ id: 'burn', turnsRemaining: 2 }]);
    });

    it('burn minimum damage is 1 (tiny-hp creature)', () => {
        const result = tickStatusEffects([{ id: 'burn', turnsRemaining: 2 }], 8);
        expect(result.damage).toBe(1);
    });

    it('burn expires after its last turn', () => {
        const result = tickStatusEffects([{ id: 'burn', turnsRemaining: 1 }], 100);
        expect(result.statuses).toEqual([]);
    });

    it('frozen sets skipNextTurn but does no damage', () => {
        const result = tickStatusEffects([{ id: 'frozen', turnsRemaining: 1 }], 100);
        expect(result.skipNextTurn).toBe(true);
        expect(result.damage).toBe(0);
        expect(result.statuses).toEqual([]);
    });

    it('wet alone does no damage and does not skip turn', () => {
        const result = tickStatusEffects([{ id: 'wet', turnsRemaining: 2 }], 100);
        expect(result.damage).toBe(0);
        expect(result.skipNextTurn).toBe(false);
        expect(result.statuses).toEqual([{ id: 'wet', turnsRemaining: 1 }]);
    });

    it('multiple statuses combine correctly', () => {
        const result = tickStatusEffects(
            [
                { id: 'burn', turnsRemaining: 2 },
                { id: 'wet', turnsRemaining: 3 },
                { id: 'frozen', turnsRemaining: 1 },
            ],
            160,
        );
        expect(result.damage).toBe(10);
        expect(result.skipNextTurn).toBe(true);
        expect(result.statuses).toHaveLength(2); // burn, wet; frozen expired
    });

    it('empty status list is a no-op', () => {
        const result = tickStatusEffects([], 100);
        expect(result.damage).toBe(0);
        expect(result.skipNextTurn).toBe(false);
        expect(result.statuses).toEqual([]);
    });
});

describe('damageMultiplierFromStatuses — incoming damage mods', () => {
    const wet: Status[] = [{ id: 'wet', turnsRemaining: 2 }];

    it('lete on wet target → 1.5×', () => {
        expect(damageMultiplierFromStatuses('lete', wet)).toBe(1.5);
    });

    it('seli on wet target → 0× (steamed away)', () => {
        expect(damageMultiplierFromStatuses('seli', wet)).toBe(0);
    });

    it('lete on dry target → 1×', () => {
        expect(damageMultiplierFromStatuses('lete', [])).toBe(1);
    });

    it('wawa attack never modified by status', () => {
        expect(damageMultiplierFromStatuses('wawa', wet)).toBe(1);
    });
});
