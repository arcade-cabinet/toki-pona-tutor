import { type EventDefinition, RpgPlayer } from "@rpgjs/server";
import { QUEST_UI_CONFIG } from "../../content/gameplay";
import { formatGameplayTemplate } from "../../content/gameplay/templates";
import { playDialog } from "./dialog";
import {
    acceptQuest,
    collectQuestReward,
    findQuestOrThrow,
    formatQuestOffer,
    formatQuestProgress,
    formatQuestRewardResult,
    readQuestState,
} from "./quest-runtime";

/**
 * NPC wrapper for real side quests. The NPC still plays its authored ambient
 * dialog, then offers/updates/completes one linear three-step quest.
 */
export function QuestNpc(graphic: string, dialogId: string, questId: string): EventDefinition {
    const quest = findQuestOrThrow(questId);
    return {
        onInit() {
            this.setGraphic(graphic);
        },
        async onAction(player: RpgPlayer) {
            await playDialog(player, dialogId);
            const state = await readQuestState(quest);

            if (state.status === "pending") {
                const choice = await player.showChoices(formatQuestOffer(quest), [
                    { text: QUEST_UI_CONFIG.acceptLabel, value: "accept" },
                    { text: QUEST_UI_CONFIG.backLabel, value: "back" },
                ]);
                if (choice?.value !== "accept") return;
                const next = await acceptQuest(quest);
                await player.showText(
                    formatGameplayTemplate(QUEST_UI_CONFIG.acceptedTemplate, {
                        progress: formatQuestProgress(quest, next),
                    }),
                );
                return;
            }

            if (state.status === "active") {
                const result = await collectQuestReward(player, quest);
                await player.showText(formatQuestRewardResult(result));
                return;
            }

            await player.showText(QUEST_UI_CONFIG.completedText);
        },
    };
}
