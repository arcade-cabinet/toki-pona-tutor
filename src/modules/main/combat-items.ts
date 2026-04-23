import type { RpgPlayer } from "@rpgjs/server";
import {
    consumeInventoryItem,
    getInventoryCount,
    setPartyCurrentHp,
} from "../../platform/persistence/queries";
import { applyHeal, listHealingItems } from "./healing-items";
import { leadHpSnapshot, setPlayerHp } from "./player-health";

export type CombatItemChoice = {
    id: string;
    value: string;
    label: string;
    count: number;
    healAmount: number;
    previewHealed: number;
};

export type CombatItemUseResult =
    | { used: true; itemId: string; label: string; healed: number; nextHp: number; maxHp: number }
    | { used: false; itemId: string; reason: "missing" | "empty" | "full" | "invalid_hp" };

export async function listCombatHealingChoices(player: RpgPlayer): Promise<CombatItemChoice[]> {
    const hp = leadHpSnapshot(player);
    if (!hp) return [];

    const choices: CombatItemChoice[] = [];
    for (const item of listHealingItems()) {
        const count = await getInventoryCount(item.id);
        if (count <= 0) continue;
        const preview = applyHeal(hp, item.amount);
        choices.push({
            id: item.id,
            value: `item:${item.id}`,
            label: item.label,
            count,
            healAmount: item.amount,
            previewHealed: preview.healed,
        });
    }
    return choices;
}

export async function useCombatHealingItem(
    player: RpgPlayer,
    itemId: string,
): Promise<CombatItemUseResult> {
    const item = listHealingItems().find((entry) => entry.id === itemId);
    if (!item) return { used: false, itemId, reason: "missing" };

    const hp = leadHpSnapshot(player);
    if (!hp) return { used: false, itemId, reason: "invalid_hp" };

    const heal = applyHeal(hp, item.amount);
    if (heal.healed <= 0) return { used: false, itemId, reason: "full" };

    const consumed = await consumeInventoryItem(item.id, 1);
    if (!consumed) return { used: false, itemId, reason: "empty" };

    await setPartyCurrentHp(0, heal.nextHp);
    setPlayerHp(player, heal.nextHp);

    return {
        used: true,
        itemId: item.id,
        label: item.label,
        healed: heal.healed,
        nextHp: heal.nextHp,
        maxHp: heal.maxHp,
    };
}
