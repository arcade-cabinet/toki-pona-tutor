import type { RpgPlayer } from "@rpgjs/server";
import { NOTIFICATION_CONFIG, SFX_CUE_CONFIG } from "../../content/gameplay";
import { formatGameplayTemplate } from "../../content/gameplay/templates";
import { awardXpToLead, getParty } from "../../platform/persistence/queries";
import { cueSfx } from "./audio-cues";
import { movesLearnedAtLevel } from "./content";
import { canonicalXpTotal, gainXp } from "./xp-curve";

export type VictoryRewardToast =
    | { kind: "xp"; speciesId: string; amount: number }
    | { kind: "level"; speciesId: string; from: number; to: number }
    | { kind: "move"; speciesId: string; moveId: string };

export type VictoryRewardResult = {
    speciesId: string;
    xp: number;
    level: number;
    toasts: VictoryRewardToast[];
};

export function formatVictoryRewardToast(toast: VictoryRewardToast): string {
    const label = toast.speciesId.replace(/_/g, " ");
    switch (toast.kind) {
        case "xp":
            return formatGameplayTemplate(NOTIFICATION_CONFIG.victory.xpTemplate, {
                species: label,
                amount: toast.amount,
            });
        case "level":
            return formatGameplayTemplate(NOTIFICATION_CONFIG.victory.levelTemplate, {
                species: label,
                from: toast.from,
                to: toast.to,
            });
        case "move":
            return formatGameplayTemplate(NOTIFICATION_CONFIG.victory.moveTemplate, {
                species: label,
                move: toast.moveId.replace(/_/g, " "),
            });
    }
}

export async function awardLeadVictoryXp(
    player: RpgPlayer,
    amount: number,
): Promise<VictoryRewardResult | null> {
    if (amount <= 0) return null;

    const party = await getParty();
    const lead = party[0];
    if (!lead) return null;

    const currentXp = canonicalXpTotal(lead.xp, lead.level);
    const { xp, levelUps } = gainXp(currentXp, amount);
    const newLevel = levelUps.length ? levelUps[levelUps.length - 1].to : lead.level;
    await awardXpToLead(xp, newLevel);

    const toasts: VictoryRewardToast[] = [{ kind: "xp", speciesId: lead.species_id, amount }];
    for (const levelUp of levelUps) {
        toasts.push({
            kind: "level",
            speciesId: lead.species_id,
            from: levelUp.from,
            to: levelUp.to,
        });
        for (const moveId of movesLearnedAtLevel(lead.species_id, levelUp.to)) {
            toasts.push({ kind: "move", speciesId: lead.species_id, moveId });
        }
    }

    for (const toast of toasts) {
        if (toast.kind === "level") {
            await cueSfx(player, SFX_CUE_CONFIG.levelUp);
        }
        await player.showNotification(formatVictoryRewardToast(toast), {
            time: NOTIFICATION_CONFIG.victory.timeMs,
        });
    }

    return {
        speciesId: lead.species_id,
        xp,
        level: newLevel,
        toasts,
    };
}
