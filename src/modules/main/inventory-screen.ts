import type { RpgPlayer } from "@rpgjs/server";
import { getParty, listInventoryItems } from "../../platform/persistence/queries";
import {
    GAME_RULES_CONFIG,
    INVENTORY_SCREEN_CONFIG,
} from "../../content/gameplay";
import { formatGameplayTemplate } from "../../content/gameplay/templates";

/**
 * Pause-menu inventory screen. Shows the player's party + items.
 *
 * v1 badges + journey beat + quest journal were retired in T108 (v2 pivot).
 * v2 will replace this screen entirely in Phase 8 with the bestiary / rumor /
 * challenge journals defined in docs/DESIGN.md § UI + UX.
 */
export async function showInventory(player: RpgPlayer): Promise<void> {
    const party = await getParty();
    const items = await listInventoryItems();

    const itemLines = items.length
        ? items.map((item) => formatInventoryItemLine(item.item_id, item.count)).join("\n")
        : INVENTORY_SCREEN_CONFIG.emptyLine;
    await player.showText(`${INVENTORY_SCREEN_CONFIG.itemsTitle}\n${itemLines}`);

    if (party.length === 0) {
        await player.showText(INVENTORY_SCREEN_CONFIG.emptyPartyText);
        return;
    }

    const partyHeader = formatGameplayTemplate(INVENTORY_SCREEN_CONFIG.partyHeaderTemplate, {
        count: party.length,
        max: GAME_RULES_CONFIG.partySizeMax,
    });
    const partyLines = party
        .map((p) =>
            formatGameplayTemplate(INVENTORY_SCREEN_CONFIG.partyLineTemplate, {
                slot: p.slot + 1,
                species: formatInventoryItemName(p.species_id),
                level: p.level,
            }),
        )
        .join("\n");
    await player.showText(`${partyHeader}\n${partyLines}`);
}

export function formatInventoryItemLine(itemId: string, count: number): string {
    return formatGameplayTemplate(INVENTORY_SCREEN_CONFIG.itemLineTemplate, {
        item: formatInventoryItemName(itemId),
        count,
    });
}

function formatInventoryItemName(id: string): string {
    return id.replace(/_/g, " ");
}
