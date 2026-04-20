import { describe, it, expect } from 'vitest';
import {
    chestStatus,
    rollLoot,
    openChest,
    type ChestDef,
    type PlayerGateState,
} from '../../src/modules/main/treasure-chest';

const basicChest: ChestDef = {
    id: 'chest_ma_telo_0',
    mapId: 'ma_telo',
    at: [5, 3],
    loot: [{ itemId: 'kili', count: 1, weight: 1 }],
    openFlag: 'chest_ma_telo_0',
};

const gatedChest: ChestDef = {
    ...basicChest,
    id: 'chest_ma_lete_1',
    openFlag: 'chest_ma_lete_1',
    requiredFlag: 'badge_lete',
};

const wordGatedChest: ChestDef = {
    ...basicChest,
    id: 'chest_nena_sewi_0',
    openFlag: 'chest_nena_sewi_0',
    requiredMasteredWord: 'sewi',
};

const emptyPlayer: PlayerGateState = { flags: {}, masteredWords: new Set() };

describe('chestStatus', () => {
    it('new chest with no gate is closed', () => {
        expect(chestStatus(basicChest, emptyPlayer)).toBe('closed');
    });

    it('already-opened chest reports opened', () => {
        expect(chestStatus(basicChest, { flags: { chest_ma_telo_0: '1' }, masteredWords: new Set() })).toBe('opened');
    });

    it('flag-gated chest without the flag is locked', () => {
        expect(chestStatus(gatedChest, emptyPlayer)).toBe('locked');
    });

    it('flag-gated chest with the flag is closed (openable)', () => {
        expect(chestStatus(gatedChest, { flags: { badge_lete: '1' }, masteredWords: new Set() })).toBe('closed');
    });

    it('word-gated chest without the word is locked', () => {
        expect(chestStatus(wordGatedChest, emptyPlayer)).toBe('locked');
    });

    it('word-gated chest with the word is closed', () => {
        expect(chestStatus(wordGatedChest, { flags: {}, masteredWords: new Set(['sewi']) })).toBe('closed');
    });

    it('opened takes priority over locked', () => {
        expect(chestStatus(gatedChest, { flags: { chest_ma_lete_1: '1' }, masteredWords: new Set() })).toBe('opened');
    });
});

describe('rollLoot', () => {
    it('returns the sole entry for a 1-item table', () => {
        expect(rollLoot(basicChest)).toEqual({ itemId: 'kili', count: 1, weight: 1 });
    });

    it('returns null for empty loot', () => {
        expect(rollLoot({ ...basicChest, loot: [] })).toBeNull();
    });

    it('weighted 3-entry distribution hits all options across trials', () => {
        const chest: ChestDef = {
            ...basicChest,
            loot: [
                { itemId: 'kili', count: 1, weight: 1 },
                { itemId: 'poki_lili', count: 1, weight: 1 },
                { itemId: 'telo_pona', count: 1, weight: 1 },
            ],
        };
        let seed = 1;
        const rng = () => {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
        const seen = new Set<string>();
        for (let i = 0; i < 200; i++) {
            const loot = rollLoot(chest, rng);
            if (loot) seen.add(loot.itemId);
        }
        expect(seen.size).toBe(3);
    });

    it('weight 0 entries rarely win (< 1%)', () => {
        const chest: ChestDef = {
            ...basicChest,
            loot: [
                { itemId: 'common', count: 1, weight: 100 },
                { itemId: 'rare', count: 1, weight: 0 },
            ],
        };
        let rareHits = 0;
        for (let i = 0; i < 1000; i++) {
            if (rollLoot(chest)?.itemId === 'rare') rareHits++;
        }
        expect(rareHits).toBeLessThan(10);
    });
});

describe('openChest — one-shot transition', () => {
    it('first open on closed chest grants loot + flips openFlag', () => {
        const r = openChest(basicChest, emptyPlayer);
        expect(r.granted).toEqual({ itemId: 'kili', count: 1, weight: 1 });
        expect(r.newFlags).toEqual({ chest_ma_telo_0: '1' });
        expect(r.alreadyOpened).toBe(false);
    });

    it('second open returns alreadyOpened + no loot', () => {
        const opened: PlayerGateState = { flags: { chest_ma_telo_0: '1' }, masteredWords: new Set() };
        const r = openChest(basicChest, opened);
        expect(r.granted).toBeNull();
        expect(r.alreadyOpened).toBe(true);
        expect(r.newFlags).toBe(opened.flags);
    });

    it('flag-locked chest returns lockedReason flag:…', () => {
        const r = openChest(gatedChest, emptyPlayer);
        expect(r.granted).toBeNull();
        expect(r.alreadyOpened).toBe(false);
        expect(r.lockedReason).toBe('flag:badge_lete');
    });

    it('word-locked chest returns lockedReason word:…', () => {
        const r = openChest(wordGatedChest, emptyPlayer);
        expect(r.granted).toBeNull();
        expect(r.lockedReason).toBe('word:sewi');
    });

    it('preserves other flags when adding openFlag', () => {
        const existing: PlayerGateState = {
            flags: { badge_sewi: '1', starter_chosen: '1' },
            masteredWords: new Set(),
        };
        const r = openChest(basicChest, existing);
        expect(r.newFlags).toEqual({
            badge_sewi: '1',
            starter_chosen: '1',
            chest_ma_telo_0: '1',
        });
    });

    it('does not mutate input flags', () => {
        const input: PlayerGateState = { flags: { x: '1' }, masteredWords: new Set() };
        const snapshot = { ...input.flags };
        openChest(basicChest, input);
        expect(input.flags).toEqual(snapshot);
    });

    it('is deterministic with seeded RNG', () => {
        const multi: ChestDef = {
            ...basicChest,
            loot: [
                { itemId: 'a', count: 1, weight: 1 },
                { itemId: 'b', count: 1, weight: 1 },
                { itemId: 'c', count: 1, weight: 1 },
            ],
        };
        let s = 42;
        const rng = () => {
            s = (s * 1664525 + 1013904223) >>> 0;
            return s / 0x100000000;
        };
        let s2 = 42;
        const rng2 = () => {
            s2 = (s2 * 1664525 + 1013904223) >>> 0;
            return s2 / 0x100000000;
        };
        const a = openChest(multi, emptyPlayer, rng);
        const b = openChest(multi, emptyPlayer, rng2);
        expect(a.granted?.itemId).toBe(b.granted?.itemId);
    });
});
