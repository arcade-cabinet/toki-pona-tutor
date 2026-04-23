import type { RpgPlayer } from "@rpgjs/server";
import {
    addToInventory,
    consumeInventoryItem,
    getFlag,
    getInventoryCount,
    recordClue,
    setFlag,
} from "../../platform/persistence/queries";
import {
    advanceQuest,
    getQuestById,
    isGoalMet,
    questDisplayTitle,
    questGoalTarget,
    SIDE_QUESTS,
    type QuestDef,
    type QuestEvent,
    type QuestGoal,
    type QuestState,
} from "./quest";
import { QUEST_UI_CONFIG } from "../../content/gameplay";
import { formatGameplayTemplate } from "../../content/gameplay/templates";
import { itemLabel, speciesLabel } from "../../content/runtime-labels";
import { awardLeadVictoryXp } from "./victory-rewards";
import { clueLabel } from "./vocabulary";

const ACTIVE_STATUS = "active";
const COMPLETED_STATUS = "completed";

export type QuestRuntimeUpdate = {
    quest: QuestDef;
    previous: QuestState;
    state: QuestState;
};

export type QuestRewardResult =
    | { collected: true; quest: QuestDef; state: QuestState; rewards: string[] }
    | { collected: false; quest: QuestDef; state: QuestState; reason: "not_active" | "not_ready" };

export function questDoneFlag(questId: string): string {
    return `quest_${questId}_done`;
}

function questStatusFlag(questId: string): string {
    return `quest_${questId}_status`;
}

function questProgressFlag(questId: string): string {
    return `quest_${questId}_progress`;
}

export async function readQuestState(def: QuestDef): Promise<QuestState> {
    const done = await getFlag(questDoneFlag(def.id));
    const progress = await readProgress(def);
    if (done) return { status: "completed", progress };

    const status = await getFlag(questStatusFlag(def.id));
    if (status === ACTIVE_STATUS) return { status: "active", progress };
    return { status: "pending", progress: 0 };
}

export async function acceptQuest(def: QuestDef): Promise<QuestState> {
    const current = await readQuestState(def);
    const result = advanceQuest(def, current, { type: "accept" });
    await persistQuestState(def, result.state);
    return result.state;
}

export async function recordQuestEventForActive(
    player: RpgPlayer | null,
    event: Exclude<QuestEvent, { type: "accept" | "collect_reward" }>,
): Promise<QuestRuntimeUpdate[]> {
    const updates: QuestRuntimeUpdate[] = [];
    for (const quest of SIDE_QUESTS) {
        const previous = await readQuestState(quest);
        if (previous.status !== "active") continue;

        const result = advanceQuest(quest, previous, event);
        if (sameState(previous, result.state)) continue;

        await persistQuestState(quest, result.state);
        updates.push({ quest, previous, state: result.state });

        if (player) {
            await notifyQuestProgress(player, quest, previous, result.state);
        }
    }
    return updates;
}

export async function completeDeliveryQuestsAtNpc(
    player: RpgPlayer,
    npcId: string,
): Promise<QuestRuntimeUpdate[]> {
    const updates: QuestRuntimeUpdate[] = [];
    for (const quest of SIDE_QUESTS) {
        const goal = quest.goal;
        if (goal.kind !== "deliver_item" || goal.toNpcId !== npcId) continue;

        const previous = await readQuestState(quest);
        if (previous.status !== "active" || isGoalMet(quest, previous)) continue;
        if ((await getInventoryCount(goal.itemId)) <= 0) continue;

        const consumed = await consumeInventoryItem(goal.itemId, 1);
        if (!consumed) continue;

        const result = advanceQuest(quest, previous, {
            type: "deliver",
            itemId: goal.itemId,
            toNpcId: npcId,
        });
        await persistQuestState(quest, result.state);
        updates.push({ quest, previous, state: result.state });
        await player.showText(
            formatGameplayTemplate(QUEST_UI_CONFIG.deliveryTemplate, {
                item: itemLabel(goal.itemId),
                npc: npcId.replace(/_/g, " "),
            }),
        );
        await notifyQuestProgress(player, quest, previous, result.state);
    }
    return updates;
}

export async function collectQuestReward(
    player: RpgPlayer,
    def: QuestDef,
): Promise<QuestRewardResult> {
    const current = await readQuestState(def);
    if (current.status !== "active") {
        return { collected: false, quest: def, state: current, reason: "not_active" };
    }
    if (!isGoalMet(def, current)) {
        return { collected: false, quest: def, state: current, reason: "not_ready" };
    }

    const result = advanceQuest(def, current, { type: "collect_reward" });
    await persistQuestState(def, result.state);
    if (!result.grantReward) {
        return { collected: false, quest: def, state: result.state, reason: "not_ready" };
    }

    const rewards = await grantQuestReward(player, def);
    return { collected: true, quest: def, state: result.state, rewards };
}

export async function listQuestJournalLines(): Promise<string[]> {
    const lines: string[] = [];
    for (const quest of SIDE_QUESTS) {
        const state = await readQuestState(quest);
        if (state.status === "pending") continue;
        lines.push(
            formatGameplayTemplate(QUEST_UI_CONFIG.journalLineTemplate, {
                mark:
                    state.status === "completed"
                        ? QUEST_UI_CONFIG.journalCompletedMark
                        : QUEST_UI_CONFIG.journalActiveMark,
                title: questDisplayTitle(quest),
                progress: formatQuestProgress(quest, state),
            }),
        );
    }
    return lines;
}

export function formatQuestOffer(def: QuestDef): string {
    return formatGameplayTemplate(QUEST_UI_CONFIG.offerTemplate, {
        title: questDisplayTitle(def),
        goal: formatGoal(def.goal),
    });
}

export function formatQuestProgress(def: QuestDef, state: QuestState): string {
    return formatGameplayTemplate(QUEST_UI_CONFIG.progressTemplate, {
        current: Math.min(state.progress, questGoalTarget(def.goal)),
        target: questGoalTarget(def.goal),
    });
}

export function formatQuestRewardResult(result: QuestRewardResult): string {
    if (result.collected) {
        return formatGameplayTemplate(QUEST_UI_CONFIG.rewardSuccessTemplate, {
            title: questDisplayTitle(result.quest),
            rewards: result.rewards.join("\n"),
        });
    }
    if (result.reason === "not_ready") {
        return formatGameplayTemplate(QUEST_UI_CONFIG.rewardNotReadyTemplate, {
            progress: formatQuestProgress(result.quest, result.state),
        });
    }
    return QUEST_UI_CONFIG.completedText;
}

export function findQuestOrThrow(questId: string): QuestDef {
    const quest = getQuestById(questId);
    if (!quest) throw new Error(`[quest] unknown quest id: ${questId}`);
    return quest;
}

async function readProgress(def: QuestDef): Promise<number> {
    const raw = await getFlag(questProgressFlag(def.id));
    const parsed = Number(raw ?? 0);
    if (!Number.isFinite(parsed)) return 0;
    return Math.max(0, Math.min(questGoalTarget(def.goal), Math.round(parsed)));
}

async function persistQuestState(def: QuestDef, state: QuestState): Promise<void> {
    if (state.status === "pending") return;
    await setFlag(
        questStatusFlag(def.id),
        state.status === "completed" ? COMPLETED_STATUS : ACTIVE_STATUS,
    );
    await setFlag(questProgressFlag(def.id), String(state.progress));
    if (state.status === "completed") {
        await setFlag(questDoneFlag(def.id), "1");
    }
}

async function grantQuestReward(player: RpgPlayer, def: QuestDef): Promise<string[]> {
    const reward = def.reward;
    const labels: string[] = [];

    if (reward.itemId) {
        const count = reward.itemCount ?? 1;
        await addToInventory(reward.itemId, count);
        labels.push(
            formatGameplayTemplate(QUEST_UI_CONFIG.rewardTemplates.item, {
                item: itemLabel(reward.itemId),
                count,
            }),
        );
    }

    if (reward.xp && reward.xp > 0) {
        await awardLeadVictoryXp(player, reward.xp);
        labels.push(
            formatGameplayTemplate(QUEST_UI_CONFIG.rewardTemplates.xp, {
                xp: reward.xp,
            }),
        );
    }

    if (reward.rewardClue) {
        await recordClue(reward.rewardClue);
        labels.push(
            formatGameplayTemplate(QUEST_UI_CONFIG.rewardTemplates.word, {
                word: clueLabel(reward.rewardClue),
            }),
        );
    }

    try {
        await player.showNotification(
            formatGameplayTemplate(QUEST_UI_CONFIG.notificationRewardTemplate, {
                title: questDisplayTitle(def),
            }),
            { time: QUEST_UI_CONFIG.notificationMs },
        );
    } catch {
        // Quest state and rewards must not depend on an optional GUI surface.
    }

    return labels;
}

async function notifyQuestProgress(
    player: RpgPlayer,
    def: QuestDef,
    previous: QuestState,
    next: QuestState,
): Promise<void> {
    const wasMet = isGoalMet(def, previous);
    const isMet = isGoalMet(def, next);
    const template =
        isMet && !wasMet
            ? QUEST_UI_CONFIG.notificationReadyTemplate
            : QUEST_UI_CONFIG.notificationProgressTemplate;
    try {
        await player.showNotification(
            formatGameplayTemplate(template, {
                title: questDisplayTitle(def),
                progress: formatQuestProgress(def, next),
            }),
            { time: QUEST_UI_CONFIG.notificationMs },
        );
    } catch {
        // Progress is already persisted; notification is best-effort.
    }
}

function sameState(a: QuestState, b: QuestState): boolean {
    return a.status === b.status && a.progress === b.progress;
}

function formatGoal(goal: QuestGoal): string {
    switch (goal.kind) {
        case "catch_count":
            return formatGameplayTemplate(QUEST_UI_CONFIG.goalTemplates.catch_count, {
                species: speciesLabel(goal.speciesId),
                target: goal.target,
            });
        case "catch_any_in_biome":
            return formatGameplayTemplate(QUEST_UI_CONFIG.goalTemplates.catch_any_in_biome, {
                target: goal.target,
            });
        case "defeat_trainer":
            return formatGameplayTemplate(QUEST_UI_CONFIG.goalTemplates.defeat_trainer, {
                npc: goal.npcId.replace(/_/g, " "),
            });
        case "deliver_item":
            return formatGameplayTemplate(QUEST_UI_CONFIG.goalTemplates.deliver_item, {
                item: itemLabel(goal.itemId),
                npc: goal.toNpcId.replace(/_/g, " "),
            });
    }
}
