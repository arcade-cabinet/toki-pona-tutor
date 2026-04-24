import { describe, it, expect } from 'vitest';
import {
    reorderParty,
    promoteToLead,
    type PartySlot,
} from '../../src/modules/main/party-order';

/**
 * T2-12: party reorder math.
 *
 * Pure array-transformation helpers the party-panel UI uses when the
 * player drags a creature to slot 0 (or swaps any two slots). The
 * caller persists the returned slot list to SQLite via queries.ts;
 * this module has no storage coupling.
 *
 * Slot indices are 0-based and dense — there are no gaps. The
 * party table enforces PARTY_SIZE_MAX at the DB layer; this helper
 * preserves whatever size it's given.
 */

const orchard_fruit: PartySlot = { species_id: 'applepup', level: 5 };
const jaki: PartySlot = { species_id: 'mireling', level: 3 };
const kon: PartySlot = { species_id: 'ashcat', level: 4 };
const lili: PartySlot = { species_id: 'bramble_imp', level: 6 };

describe('promoteToLead', () => {
    it('moves the named slot to index 0, preserving rest in order', () => {
        const party = [orchard_fruit, jaki, kon, lili];
        expect(promoteToLead(party, 2)).toEqual([kon, orchard_fruit, jaki, lili]);
    });

    it('promoting slot 0 is a no-op', () => {
        const party = [orchard_fruit, jaki, kon];
        expect(promoteToLead(party, 0)).toEqual(party);
    });

    it('promoting last slot moves it to front, others shift down', () => {
        const party = [orchard_fruit, jaki, kon, lili];
        expect(promoteToLead(party, 3)).toEqual([lili, orchard_fruit, jaki, kon]);
    });

    it('empty party returns empty array', () => {
        expect(promoteToLead([], 0)).toEqual([]);
    });

    it('out-of-range index returns original order (no crash)', () => {
        const party = [orchard_fruit, jaki];
        expect(promoteToLead(party, 99)).toEqual(party);
        expect(promoteToLead(party, -1)).toEqual(party);
    });

    it('does not mutate input party', () => {
        const party = [orchard_fruit, jaki, kon];
        const snapshot = JSON.parse(JSON.stringify(party));
        promoteToLead(party, 2);
        expect(party).toEqual(snapshot);
    });
});

describe('reorderParty — swap / move semantics', () => {
    it('moves a slot forward (from > to)', () => {
        const party = [orchard_fruit, jaki, kon, lili];
        // move slot 3 (lili) to slot 1
        expect(reorderParty(party, 3, 1)).toEqual([orchard_fruit, lili, jaki, kon]);
    });

    it('moves a slot backward (from < to)', () => {
        const party = [orchard_fruit, jaki, kon, lili];
        // move slot 0 (orchard_fruit) to slot 2
        expect(reorderParty(party, 0, 2)).toEqual([jaki, kon, orchard_fruit, lili]);
    });

    it('same from and to is a no-op', () => {
        const party = [orchard_fruit, jaki, kon];
        expect(reorderParty(party, 1, 1)).toEqual(party);
    });

    it('out-of-range from returns original', () => {
        const party = [orchard_fruit, jaki];
        expect(reorderParty(party, 5, 0)).toEqual(party);
    });

    it('out-of-range to clamps to last index', () => {
        const party = [orchard_fruit, jaki, kon];
        expect(reorderParty(party, 0, 99)).toEqual([jaki, kon, orchard_fruit]);
    });

    it('negative indices clamp to 0', () => {
        const party = [orchard_fruit, jaki, kon];
        expect(reorderParty(party, -5, 0)).toEqual(party);
        expect(reorderParty(party, 0, -5)).toEqual(party);
    });

    it('does not mutate input', () => {
        const party = [orchard_fruit, jaki, kon];
        const snapshot = JSON.parse(JSON.stringify(party));
        reorderParty(party, 0, 2);
        expect(party).toEqual(snapshot);
    });

    it('single-slot party has no valid reorder', () => {
        const party = [orchard_fruit];
        expect(reorderParty(party, 0, 0)).toEqual(party);
    });

    it('preserves array length', () => {
        const party = [orchard_fruit, jaki, kon, lili];
        expect(reorderParty(party, 1, 3)).toHaveLength(4);
    });
});

describe('promoteToLead === reorderParty(…, n, 0)', () => {
    it('they agree for all positions', () => {
        const party = [orchard_fruit, jaki, kon, lili];
        for (let i = 0; i < party.length; i++) {
            expect(promoteToLead(party, i)).toEqual(reorderParty(party, i, 0));
        }
    });
});
