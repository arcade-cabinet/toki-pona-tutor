import { describe, expect, it } from 'vitest';
import worldRaw from '../../src/content/generated/world.json';
import { formatItemDrop, resolveSpeciesItemDrop, rollSpeciesItemDrop } from '../../src/modules/main/item-drops';

const WORLD = worldRaw as {
    species: Array<{
        id: string;
        type: string;
        sprite?: { tier?: 'common' | 'uncommon' | 'legendary' };
        item_drop?: { item_id: string; chance: number; count?: number };
    }>;
    items: { id: string }[];
};

describe('rollSpeciesItemDrop', () => {
    it('returns null when a species has no drop table', () => {
        expect(rollSpeciesItemDrop({}, () => 0)).toBeNull();
    });

    it('rolls the configured item and count when chance succeeds', () => {
        expect(rollSpeciesItemDrop({
            item_drop: {
                item_id: 'kili',
                chance: 0.5,
                count: 2,
            },
        }, () => 0.49)).toEqual({
            itemId: 'kili',
            count: 2,
        });
    });

    it('does not drop when the roll is outside chance', () => {
        expect(rollSpeciesItemDrop({
            item_drop: {
                item_id: 'kili',
                chance: 0.5,
                count: 1,
            },
        }, () => 0.5)).toBeNull();
    });

    it('formats inventory notifications consistently', () => {
        expect(formatItemDrop({ itemId: 'poki_lili', count: 1 })).toBe('poki lili ×1');
    });

    it('falls back to type/tier loot when a species has no explicit drop', () => {
        expect(resolveSpeciesItemDrop({
            id: 'jan_wawa',
            type: 'wawa',
            sprite: { tier: 'common' },
        })).toEqual({
            item_id: 'ma',
            chance: 0.18,
            count: 1,
        });
        expect(resolveSpeciesItemDrop({
            id: 'akesi_suli',
            type: 'telo',
            sprite: { tier: 'legendary' },
        })).toEqual({
            item_id: 'telo_pona',
            chance: 1,
            count: 2,
        });
    });

    it('resolves a valid loot table for every authored species', () => {
        const itemIds = new Set(WORLD.items.map((item) => item.id));

        for (const species of WORLD.species) {
            const drop = resolveSpeciesItemDrop(species);
            expect(drop, species.id).not.toBeNull();
            expect(itemIds.has(drop!.item_id), species.id).toBe(true);
        }
    });
});
