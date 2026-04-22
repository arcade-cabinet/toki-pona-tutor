import { afterEach, describe, expect, it } from 'vitest';
import {
    addToInventory,
    getInventoryCount,
} from '../../src/platform/persistence/queries';
import { resetPersistedRuntimeState } from '../../src/platform/persistence/runtime-state';
import {
    buyShopItem,
    COIN_ITEM_ID,
    formatCoinGrant,
    formatShopPurchaseResult,
    grantCoins,
    JAN_MOKU_STOCK,
    shopChoiceLabel,
} from '../../src/modules/main/shop';

afterEach(async () => {
    await resetPersistedRuntimeState({ includeSaves: true });
});

describe('ma economy and jan Moku shop', () => {
    it('formats the ma_telo shop choices from stock definitions', () => {
        expect(JAN_MOKU_STOCK.map(shopChoiceLabel)).toEqual([
            'poki lili ×1 · ma 2',
            'kili ×1 · ma 1',
            'telo pona ×1 · ma 4',
            'poki wawa ×1 · ma 6',
        ]);
    });

    it('grants ma as a stackable inventory currency', async () => {
        await expect(grantCoins(4)).resolves.toBe(4);
        await expect(grantCoins(6)).resolves.toBe(10);
        expect(await getInventoryCount(COIN_ITEM_ID)).toBe(10);
        expect(formatCoinGrant(6)).toBe('ma ×6');
    });

    it('buys shop stock by spending ma and adding the purchased item', async () => {
        await addToInventory(COIN_ITEM_ID, 4);

        const result = await buyShopItem('poki_lili');

        expect(result).toEqual({
            bought: true,
            itemId: 'poki_lili',
            label: 'poki lili',
            count: 1,
            price: 2,
            balance: 2,
        });
        expect(formatShopPurchaseResult(result)).toBe('poki lili +1\nma 2');
        expect(await getInventoryCount(COIN_ITEM_ID)).toBe(2);
        expect(await getInventoryCount('poki_lili')).toBe(1);
    });

    it('does not add stock when the player cannot afford it', async () => {
        await addToInventory(COIN_ITEM_ID, 1);

        const result = await buyShopItem('poki_lili');

        expect(result).toEqual({
            bought: false,
            itemId: 'poki_lili',
            reason: 'insufficient',
            price: 2,
            balance: 1,
        });
        expect(formatShopPurchaseResult(result)).toBe('ma ala');
        expect(await getInventoryCount(COIN_ITEM_ID)).toBe(1);
        expect(await getInventoryCount('poki_lili')).toBe(0);
    });
});
