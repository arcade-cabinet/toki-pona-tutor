import type { RpgPlayer } from "@rpgjs/server";
import { getFlag, getParty, listInventoryItems } from "../../platform/persistence/queries";
import { preferences, KEYS } from "../../platform/persistence/preferences";
import { listQuestJournalLines } from "./quest-runtime";
import {
    BADGE_DEFINITIONS,
    GAME_RULES_CONFIG,
    INVENTORY_SCREEN_CONFIG,
} from "../../content/gameplay";
import { formatGameplayTemplate } from "../../content/gameplay/templates";

/**
 * Second pause-menu screen — shows the player's progress:
 *   - earned badges (badge_sewi / badge_telo / badge_lete / badge_suli)
 *   - current journey beat pointer
 *   - party roster with level (max 6 slots)
 *
 * Uses plain showText rather than a dedicated GUI because this legacy
 * route still works through the shared dialog layer. Bound to the
 * 'inventory' input action (mapped by the client default controls —
 * falls through if unavailable).
 */
export async function showInventory(player: RpgPlayer): Promise<void> {
    const earned = await Promise.all(
        BADGE_DEFINITIONS.map(async (b) => ({ ...b, held: Boolean(await getFlag(b.flag)) })),
    );
    const held = earned.filter((b) => b.held);
    const party = await getParty();
    const items = await listInventoryItems();
    const questLines = await listQuestJournalLines();
    const beat = await preferences.get(KEYS.journeyBeat);

    const header = formatGameplayTemplate(INVENTORY_SCREEN_CONFIG.badgesHeaderTemplate, {
        held: held.length,
        total: BADGE_DEFINITIONS.length,
    });
    const badgeLines = earned
        .map((b) =>
            formatGameplayTemplate(INVENTORY_SCREEN_CONFIG.badgeLineTemplate, {
                state: b.held
                    ? INVENTORY_SCREEN_CONFIG.badgeHeldState
                    : INVENTORY_SCREEN_CONFIG.badgeMissingState,
                label: b.label,
                region: b.region,
            }),
        )
        .join("\n");
    await player.showText(`${header}\n${badgeLines}`);

    if (beat) {
        await player.showText(
            formatGameplayTemplate(INVENTORY_SCREEN_CONFIG.beatTemplate, { beat }),
        );
    }

    const itemLines = items.length
        ? items.map((item) => formatInventoryItemLine(item.item_id, item.count)).join("\n")
        : INVENTORY_SCREEN_CONFIG.emptyLine;
    await player.showText(`${INVENTORY_SCREEN_CONFIG.itemsTitle}\n${itemLines}`);

    await player.showText(
        `${INVENTORY_SCREEN_CONFIG.questsTitle}\n${
            questLines.length ? questLines.join("\n") : INVENTORY_SCREEN_CONFIG.emptyLine
        }`,
    );

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
