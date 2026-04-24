import { describe, it, expect } from 'vitest';
import {
    buildVictorySequence,
    type FoeDefeated,
    type PartyCreature,
    type SpeciesEntry,
} from '../../src/modules/main/victory-sequence';

/**
 * T2-07: victory + level-up + XP gain sequence.
 *
 * Pure orchestration — combat layer defeats the foe, hands us
 * (foe, party, species-lookup) and we produce the ordered step
 * list the UI animates one frame at a time:
 *
 *   [XpGained, ...LevelUp, ...MoveLearned]
 *
 * UI-side code renders `+N xp` → `L{old}→L{new}` toasts → "new move: X"
 * announcements in order. Deterministic; no RNG; the same inputs always
 * produce the same sequence.
 */

const orchard_fruit: SpeciesEntry = {
    id: 'applepup',
    learnset: [
        { level: 1, move_id: 'quick_jab' },
        { level: 3, move_id: 'utala_wawa' },
        { level: 6, move_id: 'utala_suli' },
    ],
};

const speciesLookup = (id: string): SpeciesEntry | null =>
    id === orchard_fruit.id ? orchard_fruit : null;

const creature = (overrides: Partial<PartyCreature> = {}): PartyCreature => ({
    species_id: 'applepup',
    xp: 0,
    level: 1,
    moves: ['quick_jab'],
    ...overrides,
});

const foe = (xp_yield: number): FoeDefeated => ({ xp_yield });

describe('buildVictorySequence — XP only, no level crossed', () => {
    it('emits a single XpGained step', () => {
        const party = [creature({ xp: 1, level: 1 })];
        const seq = buildVictorySequence(party, foe(5), speciesLookup);
        expect(seq).toEqual([
            { kind: 'xp_gained', creatureIndex: 0, amount: 5 },
        ]);
    });

    it('foe with 0 xp_yield still emits xp_gained step (zero-amount)', () => {
        const party = [creature()];
        const seq = buildVictorySequence(party, foe(0), speciesLookup);
        expect(seq).toEqual([
            { kind: 'xp_gained', creatureIndex: 0, amount: 0 },
        ]);
    });
});

describe('buildVictorySequence — level-up boundaries', () => {
    it('crossing one level emits xp_gained + level_up', () => {
        // level 1 → needs 8 xp for level 2; party at 1 xp, foe grants 7
        const party = [creature({ xp: 1, level: 1, moves: ['quick_jab'] })];
        const seq = buildVictorySequence(party, foe(7), speciesLookup);
        expect(seq).toEqual([
            { kind: 'xp_gained', creatureIndex: 0, amount: 7 },
            { kind: 'level_up', creatureIndex: 0, from: 1, to: 2 },
        ]);
    });

    it('crossing multiple levels emits one level_up per boundary', () => {
        // 1 xp → 200 xp crosses levels 2,3,4,5 (8, 27, 64, 125)
        const party = [creature({ xp: 1, level: 1, moves: ['quick_jab'] })];
        const seq = buildVictorySequence(party, foe(199), speciesLookup);
        const levelUps = seq.filter((s) => s.kind === 'level_up');
        expect(levelUps).toHaveLength(4);
        expect(levelUps.map((s) => s.to)).toEqual([2, 3, 4, 5]);
    });

    it('level-up steps come after xp_gained in order', () => {
        const party = [creature({ xp: 1, level: 1, moves: ['quick_jab'] })];
        const seq = buildVictorySequence(party, foe(7), speciesLookup);
        expect(seq[0].kind).toBe('xp_gained');
        expect(seq[1].kind).toBe('level_up');
    });
});

describe('buildVictorySequence — move learning', () => {
    it('crossing level 3 while species learns move at L3 emits move_learned', () => {
        // party at level 2, xp 8; crossing to level 3 (27) needs 19 xp
        const party = [creature({ xp: 8, level: 2, moves: ['quick_jab'] })];
        const seq = buildVictorySequence(party, foe(19), speciesLookup);
        const learned = seq.filter((s) => s.kind === 'move_learned');
        expect(learned).toEqual([
            { kind: 'move_learned', creatureIndex: 0, moveId: 'utala_wawa', atLevel: 3 },
        ]);
    });

    it('already-known move is NOT re-learned', () => {
        const party = [creature({ xp: 8, level: 2, moves: ['quick_jab', 'utala_wawa'] })];
        const seq = buildVictorySequence(party, foe(19), speciesLookup);
        expect(seq.filter((s) => s.kind === 'move_learned')).toEqual([]);
    });

    it('crossing multiple level boundaries emits moves in ascending level order', () => {
        // level 1 → level 6 should learn utala_wawa (L3) then utala_suli (L6)
        const party = [creature({ xp: 1, level: 1, moves: ['quick_jab'] })];
        const seq = buildVictorySequence(party, foe(215), speciesLookup); // 216 = 6^3
        const learned = seq.filter((s) => s.kind === 'move_learned');
        expect(learned.map((s) => s.moveId)).toEqual(['utala_wawa', 'utala_suli']);
    });

    it('species with empty learnset never emits move_learned', () => {
        const bare: SpeciesEntry = { id: 'bare', learnset: [] };
        const lookup = (_: string) => bare;
        const party = [creature({ species_id: 'bare', xp: 1, level: 1, moves: [] })];
        const seq = buildVictorySequence(party, foe(999), lookup);
        expect(seq.filter((s) => s.kind === 'move_learned')).toEqual([]);
    });

    it('unknown species (null lookup) yields xp + level_up but no moves', () => {
        const lookup = (_: string) => null;
        const party = [creature({ species_id: 'mystery', xp: 1, level: 1, moves: [] })];
        const seq = buildVictorySequence(party, foe(7), lookup);
        expect(seq.filter((s) => s.kind === 'move_learned')).toEqual([]);
        expect(seq.filter((s) => s.kind === 'level_up')).toHaveLength(1);
    });
});

describe('buildVictorySequence — party handling', () => {
    it('empty party returns empty sequence', () => {
        const seq = buildVictorySequence([], foe(100), speciesLookup);
        expect(seq).toEqual([]);
    });

    it('only lead creature (index 0) gains xp — rest of party is untouched', () => {
        const party = [
            creature({ xp: 1, level: 1 }),
            creature({ xp: 50, level: 3 }),
        ];
        const seq = buildVictorySequence(party, foe(100), speciesLookup);
        expect(seq.every((s) => s.creatureIndex === 0)).toBe(true);
    });

    it('does not mutate input party', () => {
        const party = [creature({ xp: 1, level: 1, moves: ['quick_jab'] })];
        const snapshot = JSON.parse(JSON.stringify(party));
        buildVictorySequence(party, foe(999), speciesLookup);
        expect(party).toEqual(snapshot);
    });

    it('does not mutate input foe', () => {
        const party = [creature()];
        const f = foe(100);
        const snapshot = { ...f };
        buildVictorySequence(party, f, speciesLookup);
        expect(f).toEqual(snapshot);
    });
});

describe('buildVictorySequence — ordering invariants', () => {
    it('within a level crossing: level_up before its move_learned', () => {
        const party = [creature({ xp: 8, level: 2, moves: ['quick_jab'] })];
        const seq = buildVictorySequence(party, foe(19), speciesLookup);
        const levelUpIdx = seq.findIndex((s) => s.kind === 'level_up' && s.to === 3);
        const moveIdx = seq.findIndex((s) => s.kind === 'move_learned' && s.moveId === 'utala_wawa');
        expect(levelUpIdx).toBeGreaterThanOrEqual(0);
        expect(moveIdx).toBeGreaterThan(levelUpIdx);
    });

    it('xp_gained is always the first step when there is any gain', () => {
        const party = [creature({ xp: 1, level: 1, moves: ['quick_jab'] })];
        const seq = buildVictorySequence(party, foe(215), speciesLookup);
        expect(seq[0].kind).toBe('xp_gained');
    });
});
