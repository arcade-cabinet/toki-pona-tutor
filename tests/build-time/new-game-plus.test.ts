import { describe, it, expect } from 'vitest';
import {
    reducePartyLevel,
    deriveNewGamePlus,
    ngPlusLegendaryMultiplier,
    type SaveState,
} from '../../src/modules/main/new-game-plus';

const clearedSave = (overrides: Partial<SaveState> = {}): SaveState => ({
    party: [
        { slot: 0, species_id: 'kon_moli', level: 35, xp: 42875 },
        { slot: 1, species_id: 'jan_wawa', level: 22, xp: 10648 },
        { slot: 2, species_id: 'telo_jaki', level: 3, xp: 27 },
    ],
    flags: {
        game_cleared: '1',
        badge_sewi: '1',
        badge_telo: '1',
        badge_lete: '1',
        badge_suli: '1',
        starter_chosen: '1',
    },
    masteredWords: { soweli: 12, poki: 8, seli: 5 },
    inventory: { poki_lili: 2, poki_wawa: 1, kili: 5 },
    currentMapId: 'nasin_pi_telo',
    journeyBeat: 'beat_07_nasin_pi_telo',
    ...overrides,
});

describe('reducePartyLevel — -10 floor at 1', () => {
    it('level 35 → level 25, xp reset to threshold', () => {
        const r = reducePartyLevel({ slot: 0, species_id: 'kon_moli', level: 35, xp: 42875 });
        expect(r.level).toBe(25);
        expect(r.xp).toBe(15625); // 25^3
    });

    it('level 3 → level 1 (floor)', () => {
        const r = reducePartyLevel({ slot: 0, species_id: 'telo_jaki', level: 3, xp: 27 });
        expect(r.level).toBe(1);
        expect(r.xp).toBe(1);
    });

    it('level 11 → level 1 (floor)', () => {
        const r = reducePartyLevel({ slot: 0, species_id: 'x', level: 11, xp: 1331 });
        expect(r.level).toBe(1);
    });

    it('level 12 → level 2', () => {
        const r = reducePartyLevel({ slot: 0, species_id: 'x', level: 12, xp: 1728 });
        expect(r.level).toBe(2);
        expect(r.xp).toBe(8);
    });

    it('preserves slot + species_id', () => {
        const r = reducePartyLevel({ slot: 4, species_id: 'jan_wawa_suli', level: 30, xp: 27000 });
        expect(r.slot).toBe(4);
        expect(r.species_id).toBe('jan_wawa_suli');
    });
});

describe('deriveNewGamePlus — full derivation', () => {
    it('throws if game_cleared flag not set', () => {
        const uncleared = clearedSave({ flags: { badge_sewi: '1' } });
        expect(() => deriveNewGamePlus(uncleared)).toThrow(/game_cleared/);
    });

    it('reduces all party members', () => {
        const ng = deriveNewGamePlus(clearedSave());
        expect(ng.party).toHaveLength(3);
        expect(ng.party[0].level).toBe(25);
        expect(ng.party[1].level).toBe(12);
        expect(ng.party[2].level).toBe(1);
    });

    it('clears all flags including game_cleared', () => {
        const ng = deriveNewGamePlus(clearedSave());
        expect(ng.flags).toEqual({});
    });

    it('preserves masteredWords in full', () => {
        const ng = deriveNewGamePlus(clearedSave());
        expect(ng.masteredWords).toEqual({ soweli: 12, poki: 8, seli: 5 });
    });

    it('inventory reset to { poki_wawa: 1 } — the NG+ clear reward', () => {
        const ng = deriveNewGamePlus(clearedSave());
        expect(ng.inventory).toEqual({ poki_wawa: 1 });
    });

    it('resets map + journey to starter village', () => {
        const ng = deriveNewGamePlus(clearedSave());
        expect(ng.currentMapId).toBe('ma_tomo_lili');
        expect(ng.journeyBeat).toBe('beat_01_ma_tomo_lili');
    });

    it('increments ngPlusCount (undefined → 1)', () => {
        const ng = deriveNewGamePlus(clearedSave());
        expect(ng.ngPlusCount).toBe(1);
    });

    it('increments ngPlusCount (2 → 3)', () => {
        const ng = deriveNewGamePlus(clearedSave({ ngPlusCount: 2 }));
        expect(ng.ngPlusCount).toBe(3);
    });

    it('handles empty party without crash', () => {
        const ng = deriveNewGamePlus(clearedSave({ party: [] }));
        expect(ng.party).toEqual([]);
    });
});

describe('ngPlusLegendaryMultiplier — clear-count scaling', () => {
    it('0 clears → 1× (vanilla rate)', () => {
        expect(ngPlusLegendaryMultiplier(0)).toBe(1);
    });

    it('1 clear → 2×', () => {
        expect(ngPlusLegendaryMultiplier(1)).toBe(2);
    });

    it('3 clears → 4×', () => {
        expect(ngPlusLegendaryMultiplier(3)).toBe(4);
    });

    it('caps at 4× on 4+ clears (no infinite scaling)', () => {
        expect(ngPlusLegendaryMultiplier(4)).toBe(4);
        expect(ngPlusLegendaryMultiplier(10)).toBe(4);
    });

    it('negative sanity → 1', () => {
        expect(ngPlusLegendaryMultiplier(-1)).toBe(1);
    });
});
