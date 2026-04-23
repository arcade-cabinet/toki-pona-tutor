/**
 * HUD goal state builder (T11-05).
 *
 * Turns the raw game state (party size, starter_chosen flag) into a
 * player-facing "what to do next" widget. Pure function so the gating
 * logic can be unit-tested without spinning up the engine.
 *
 * Design note — the goal HUD is always shown on gameplay surfaces
 * (title, combat, dialog modals exclude it via the blocking-gui
 * gate). This is the piece that closes the loop flagged by the 1.0
 * onboarding capture: before the starter ceremony finishes, the
 * player used to see nothing but the map and a crowd of villagers
 * with no indication of what to do. With this widget, even a
 * freshly-spawned player sees "next step — Speak with jan Sewi".
 */
import { HUD_GOAL_CONFIG } from "../content/gameplay";
import { formatGameplayTemplate } from "../content/gameplay/templates";

export type HudGoalInput = {
    partySize: number;
    partyMax: number;
    starterChosen: boolean;
};

export type HudGoalOutput = {
    heading: string;
    objective: string;
    partyLabel: string;
    partyCurrent: number;
    partyMax: number;
};

export function buildHudGoal(input: HudGoalInput): HudGoalOutput {
    const phase = input.starterChosen ? "post" : "pre";
    return {
        heading:
            phase === "post"
                ? HUD_GOAL_CONFIG.headingPostStarter
                : HUD_GOAL_CONFIG.headingPreStarter,
        objective:
            phase === "post"
                ? HUD_GOAL_CONFIG.objectivePostStarter
                : HUD_GOAL_CONFIG.objectivePreStarter,
        partyLabel: formatGameplayTemplate(HUD_GOAL_CONFIG.partyLabelTemplate, {
            current: input.partySize,
            max: input.partyMax,
        }),
        partyCurrent: input.partySize,
        partyMax: input.partyMax,
    };
}
