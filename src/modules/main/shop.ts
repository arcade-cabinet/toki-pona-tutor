import type { RpgPlayer } from "@rpgjs/server";
import {
    addToInventory,
    consumeInventoryItem,
    getInventoryCount,
} from "../../platform/persistence/queries";
import {
    BATTLE_COIN_REWARDS as CONFIGURED_BATTLE_COIN_REWARDS,
    COIN_ITEM_ID as CONFIGURED_COIN_ITEM_ID,
    SHOP_UI_CONFIG,
    SHOPS,
} from "../../content/gameplay";
import { formatGameplayTemplate } from "../../content/gameplay/templates";

export const COIN_ITEM_ID = CONFIGURED_COIN_ITEM_ID;

export type ShopStockItem = {
    itemId: string;
    count: number;
    price: number;
};

export type ShopPurchaseResult =
    | {
          bought: true;
          itemId: string;
          label: string;
          count: number;
          price: number;
          balance: number;
      }
    | {
          bought: false;
          itemId: string;
          reason: "missing" | "insufficient";
          price?: number;
          balance: number;
      };

export const JAN_MOKU_SHOP = requiredShop("jan_moku");
export const JAN_MOKU_STOCK: ShopStockItem[] = JAN_MOKU_SHOP.stock;

export const BATTLE_COIN_REWARDS = CONFIGURED_BATTLE_COIN_REWARDS;

export async function getCoinCount(): Promise<number> {
    return getInventoryCount(COIN_ITEM_ID);
}

export async function grantCoins(amount: number): Promise<number> {
    assertPositiveInteger(amount, "[shop] coin grant must be a positive integer");
    await addToInventory(COIN_ITEM_ID, amount);
    return getCoinCount();
}

export async function grantBattleCoins(player: RpgPlayer, amount: number): Promise<number> {
    const balance = await grantCoins(amount);
    try {
        await player.showNotification(formatCoinGrant(amount), {
            time: SHOP_UI_CONFIG.coinGrantNotificationMs,
        });
    } catch {
        // Rewards must persist even if the optional notification surface is unavailable.
    }
    return balance;
}

export function formatCoinGrant(amount: number): string {
    return formatGameplayTemplate(SHOP_UI_CONFIG.coinGrantTemplate, {
        coin: COIN_ITEM_ID,
        amount,
    });
}

export function shopChoiceLabel(item: ShopStockItem): string {
    return formatGameplayTemplate(SHOP_UI_CONFIG.choiceTemplate, {
        item: itemLabel(item.itemId),
        count: item.count,
        coin: COIN_ITEM_ID,
        price: item.price,
    });
}

export async function buyShopItem(
    itemId: string,
    stock: ReadonlyArray<ShopStockItem> = JAN_MOKU_STOCK,
): Promise<ShopPurchaseResult> {
    const item = stock.find((candidate) => candidate.itemId === itemId);
    const balance = await getCoinCount();
    if (!item) {
        return { bought: false, itemId, reason: "missing", balance };
    }

    assertPositiveInteger(item.count, "[shop] stock count must be a positive integer");
    assertPositiveInteger(item.price, "[shop] stock price must be a positive integer");

    const spent = await consumeInventoryItem(COIN_ITEM_ID, item.price);
    if (!spent) {
        return {
            bought: false,
            itemId,
            reason: "insufficient",
            price: item.price,
            balance,
        };
    }

    await addToInventory(item.itemId, item.count);
    return {
        bought: true,
        itemId,
        label: itemLabel(item.itemId),
        count: item.count,
        price: item.price,
        balance: await getCoinCount(),
    };
}

export function formatShopPurchaseResult(result: ShopPurchaseResult): string {
    if (result.bought) {
        return formatGameplayTemplate(SHOP_UI_CONFIG.purchaseSuccessTemplate, {
            item: result.label,
            count: result.count,
            coin: COIN_ITEM_ID,
            balance: result.balance,
        });
    }
    if (result.reason === "insufficient") {
        return formatGameplayTemplate(SHOP_UI_CONFIG.insufficientTemplate, {
            coin: COIN_ITEM_ID,
        });
    }
    return SHOP_UI_CONFIG.missingTemplate;
}

function itemLabel(itemId: string): string {
    return itemId.replace(/_/g, " ");
}

function assertPositiveInteger(value: number, message: string): void {
    if (!Number.isInteger(value) || value <= 0) {
        throw new Error(message);
    }
}

function requiredShop(id: string): (typeof SHOPS)[string] {
    const shop = SHOPS[id];
    if (!shop) throw new Error(`[shop] missing configured shop: ${id}`);
    return shop;
}
