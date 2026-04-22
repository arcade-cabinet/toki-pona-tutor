import { type EventDefinition, RpgPlayer } from "@rpgjs/server";
import { COIN_ITEM_ID, SHOP_UI_CONFIG } from "../../content/gameplay";
import { formatGameplayTemplate } from "../../content/gameplay/templates";
import { playDialog } from "./dialog";
import {
    buyShopItem,
    formatShopPurchaseResult,
    getCoinCount,
    JAN_MOKU_SHOP,
    JAN_MOKU_STOCK,
    shopChoiceLabel,
} from "./shop";
import { completeDeliveryQuestsAtNpc } from "./quest-runtime";

export function JanMokuShop(): EventDefinition {
    return {
        onInit() {
            this.setGraphic(JAN_MOKU_SHOP.graphic);
        },
        async onAction(player: RpgPlayer) {
            await playDialog(player, JAN_MOKU_SHOP.dialogId);
            await completeDeliveryQuestsAtNpc(player, JAN_MOKU_SHOP.deliveryNpcId);
            for (;;) {
                const choice = await player.showChoices(
                    formatGameplayTemplate(SHOP_UI_CONFIG.promptTemplate, {
                        coin: COIN_ITEM_ID,
                        balance: await getCoinCount(),
                    }),
                    [
                        ...JAN_MOKU_STOCK.map((item) => ({
                            text: shopChoiceLabel(item),
                            value: `buy:${item.itemId}`,
                        })),
                        { text: SHOP_UI_CONFIG.backLabel, value: "back" },
                    ],
                );

                if (!choice || choice.value === "back") return;
                if (!choice.value.startsWith("buy:")) continue;

                const itemId = choice.value.replace("buy:", "");
                const result = await buyShopItem(itemId);
                await player.showText(formatShopPurchaseResult(result));
            }
        },
    };
}
