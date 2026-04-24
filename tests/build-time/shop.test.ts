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

describe('trail_token economy and jan Moku shop', () => {
    it('formats the lakehaven shop choices from stock definitions', () => {
        expect(JAN_MOKU_STOCK.map(shopChoiceLabel)).toEqual([
            'Capture Pod ×1 · Trail Token 2',
            'Orchard Fruit ×1 · Trail Token 1',
            'Spring Tonic ×1 · Trail Token 4',
            'Heavy Capture Pod ×1 · Trail Token 6',
        ]);
    });

    it('grants trail tokens as a stackable inventory currency', async () => {
        await expect(grantCoins(4)).resolves.toBe(4);
        await expect(grantCoins(6)).resolves.toBe(10);
        expect(await getInventoryCount(COIN_ITEM_ID)).toBe(10);
        expect(formatCoinGrant(6)).toBe('Trail Token ×6');
    });

    it('buys shop stock by spending trail_token and adding the purchased item', async () => {
        await addToInventory(COIN_ITEM_ID, 4);

        const result = await buyShopItem('capture_pod');

        expect(result).toEqual({
            bought: true,
            itemId: 'capture_pod',
            label: 'Capture Pod',
            count: 1,
            price: 2,
            balance: 2,
        });
        expect(formatShopPurchaseResult(result)).toBe('Capture Pod +1\nTrail Token 2');
        expect(await getInventoryCount(COIN_ITEM_ID)).toBe(2);
        expect(await getInventoryCount('capture_pod')).toBe(1);
    });

    it('does not add stock when the player cannot afford it', async () => {
        await addToInventory(COIN_ITEM_ID, 1);

        const result = await buyShopItem('capture_pod');

        expect(result).toEqual({
            bought: false,
            itemId: 'capture_pod',
            reason: 'insufficient',
            price: 2,
            balance: 1,
        });
        expect(formatShopPurchaseResult(result)).toBe('Not enough Trail Token');
        expect(await getInventoryCount(COIN_ITEM_ID)).toBe(1);
        expect(await getInventoryCount('capture_pod')).toBe(0);
    });
});
