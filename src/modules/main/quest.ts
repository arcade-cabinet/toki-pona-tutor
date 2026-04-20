/**
 * Side-quest framework — T7-08.
 *
 * A quest is a linear 3-step structure:
 *   1. **accept**  — NPC offers quest; player accepts; quest state
 *                    transitions pending → active.
 *   2. **progress**— some world event updates quest state (catch
 *                    species, defeat trainer, deliver item).
 *   3. **complete**— condition met; NPC hands reward; state →
 *                    completed. Repeat quests can reset to pending.
 *
 * Three steps is a deliberate cap. Multi-step fetch chains become
 * tedious for a kid-audience game; one clear ask → one clear reward.
 *
 * Pure-data state machine. The runtime (quest-giver NPC, encounter
 * hook, inventory check) calls `advanceQuest` with an event and the
 * current state; the function returns the new state + any rewards
 * that should be granted. State persistence is the caller's problem;
 * the SQLite flag table already covers one-shot quest completion
 * (flag `quest_<id>_done`). In-progress counts live in preferences
 * under `quest.<id>.count`.
 */

export type QuestStatus = 'pending' | 'active' | 'completed';

export type QuestGoal =
    | { kind: 'catch_count'; speciesId: string; target: number }
    | { kind: 'catch_any_in_biome'; biome: string; target: number }
    | { kind: 'defeat_trainer'; npcId: string }
    | { kind: 'deliver_item'; itemId: string; toNpcId: string };

export interface QuestDef {
    id: string;
    giverNpcId: string;
    goal: QuestGoal;
    reward: {
        xp?: number;
        itemId?: string;
        itemCount?: number;
        rewardWord?: string;
    };
}

export interface QuestState {
    status: QuestStatus;
    progress: number;
}

export type QuestEvent =
    | { type: 'accept' }
    | { type: 'catch'; speciesId: string; biome?: string }
    | { type: 'defeat'; npcId: string }
    | { type: 'deliver'; itemId: string; toNpcId: string }
    | { type: 'collect_reward' };

/**
 * Given a quest definition, the current state, and an incoming event,
 * return the new state and whether the reward should fire now.
 *
 * @example
 * // Catch-count quest: "catch 3 kon_moli"
 * const def = { id: 'kon_three', giverNpcId: 'jan_pona',
 *               goal: { kind: 'catch_count', speciesId: 'kon_moli', target: 3 },
 *               reward: { xp: 50 } };
 * advanceQuest(def, { status: 'pending', progress: 0 }, { type: 'accept' })
 * // → { state: { status: 'active', progress: 0 }, grantReward: false }
 */
export function advanceQuest(
    def: QuestDef,
    state: QuestState,
    event: QuestEvent,
): { state: QuestState; grantReward: boolean } {
    if (event.type === 'accept') {
        if (state.status === 'pending') {
            return { state: { status: 'active', progress: 0 }, grantReward: false };
        }
        return { state, grantReward: false };
    }

    if (event.type === 'collect_reward') {
        if (state.status === 'active' && isGoalMet(def, state)) {
            return { state: { status: 'completed', progress: state.progress }, grantReward: true };
        }
        return { state, grantReward: false };
    }

    if (state.status !== 'active') return { state, grantReward: false };

    const newProgress = progressDelta(def, state, event);
    if (newProgress === state.progress) return { state, grantReward: false };

    return { state: { status: 'active', progress: newProgress }, grantReward: false };
}

export function isGoalMet(def: QuestDef, state: QuestState): boolean {
    const { goal } = def;
    if (goal.kind === 'catch_count' || goal.kind === 'catch_any_in_biome') {
        return state.progress >= goal.target;
    }
    return state.progress >= 1;
}

function progressDelta(def: QuestDef, state: QuestState, event: QuestEvent): number {
    const { goal } = def;

    if (event.type === 'catch') {
        if (goal.kind === 'catch_count' && event.speciesId === goal.speciesId) {
            return Math.min(state.progress + 1, goal.target);
        }
        if (goal.kind === 'catch_any_in_biome' && event.biome === goal.biome) {
            return Math.min(state.progress + 1, goal.target);
        }
    }

    if (event.type === 'defeat' && goal.kind === 'defeat_trainer' && event.npcId === goal.npcId) {
        return 1;
    }

    if (
        event.type === 'deliver' &&
        goal.kind === 'deliver_item' &&
        event.itemId === goal.itemId &&
        event.toNpcId === goal.toNpcId
    ) {
        return 1;
    }

    return state.progress;
}
