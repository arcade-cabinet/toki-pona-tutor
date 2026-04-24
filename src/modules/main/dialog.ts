import type { RpgPlayer } from "@rpgjs/server";
import { DIALOG_UI_CONFIG } from "../../content/gameplay";
import { formatGameplayTemplate } from "../../content/gameplay/templates";
import { getDialogById, getDialogsForNpc } from "./content";
import { recordClue, getFlag, setFlag } from "../../platform/persistence/queries";
import type { DialogNode } from "../../content/schema/dialog";

/**
 * Play a dialog node through to completion:
 * - speaks each beat via showText
 * - records the explicit `glyph` token as a clue sighting if present
 *
 * When the supplied dialog id belongs to a dossier-authored NPC with
 * sibling states (multi-state reactive content from T60/T63), the best
 * matching state is selected based on current player flags. This makes
 * NPCs react to plot progression without requiring each caller to know
 * which state to play.
 *
 * Fallback: when no sibling matches, the originally-requested node runs.
 * Legacy flat dialogs (system messages, one-shot cues) have no siblings
 * and always play the exact node.
 */
export async function playDialog(player: RpgPlayer, dialogId: string): Promise<boolean> {
    const node = getDialogById(dialogId);
    if (!node) {
        await player.showText(
            formatGameplayTemplate(DIALOG_UI_CONFIG.missingNodeTemplate, {
                dialog_id: dialogId,
            }),
        );
        return false;
    }
    const siblings = node.npc_id ? getDialogsForNpc(node.npc_id) : [];
    const selected = (await selectDialogState(node, siblings, getFlag)) ?? node;
    for (const beat of selected.beats) {
        await player.showText(beat.text.en);
        if (beat.glyph) await recordClue(beat.glyph);
    }
    await fireDialogTriggers(selected);
    return true;
}

/**
 * Fire a dialog state's on_exit side effects after the beats play. Currently
 * supports set_flag — the authored shape in dossier `dialog_states[].on_exit`
 * that build-spine.mjs maps into `triggers.set_flag` on each compiled node.
 *
 * Boolean true maps to flag value "1" (the convention setFlag uses elsewhere);
 * false maps to "". This matches the flag-reading conventions in
 * selectDialogState and queries.getFlag — a set flag reads truthy, an unset
 * or empty/"0" value reads falsy.
 *
 * Exported for tests that verify the compilation pipeline but need to inject
 * a stubbed setter; production callers get the real persistence layer.
 */
async function fireDialogTriggers(node: DialogNode): Promise<void> {
    const setFlagMap = node.triggers?.set_flag;
    if (!setFlagMap) return;
    for (const [flagId, value] of Object.entries(setFlagMap)) {
        await setFlag(flagId, value ? "1" : "");
    }
}

/**
 * Pure, test-friendly selector for the best-matching dialog state. Exported
 * so unit tests can exercise the rule engine without hitting the persistence
 * layer. Call sites pass in the list of sibling states (typically from
 * getDialogsForNpc) and a flag lookup shim.
 *
 * Matching rules:
 * - A state matches when every key in its `when_flags` agrees with the
 *   player's current flag state (flag set = truthy; flag unset, null,
 *   empty, or "0" = falsy).
 * - Among matching states, higher `priority` wins.
 * - Ties are broken by authoring order (first state in the list wins).
 * - Returns null if there are no siblings, or if nothing matches — caller
 *   falls back to the originally requested node.
 */
export async function selectDialogState(
    requested: DialogNode,
    siblings: DialogNode[],
    lookupFlag: (flagId: string) => Promise<string | null>,
): Promise<DialogNode | null> {
    if (!requested.npc_id) return null;
    if (siblings.length <= 1) return null;

    const flagCache = new Map<string, boolean>();
    const isSet = async (flagId: string): Promise<boolean> => {
        if (flagCache.has(flagId)) return flagCache.get(flagId)!;
        const value = await lookupFlag(flagId);
        const set = value != null && value !== "" && value !== "0";
        flagCache.set(flagId, set);
        return set;
    };

    const matches: DialogNode[] = [];
    for (const state of siblings) {
        if (await stateMatches(state, isSet)) matches.push(state);
    }
    if (matches.length === 0) return null;

    // Stable sort by priority desc; siblings' authoring order is preserved
    // as the tiebreaker because Array.prototype.sort is stable on all
    // supported engines.
    matches.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    return matches[0];
}

async function stateMatches(
    state: DialogNode,
    isSet: (flagId: string) => Promise<boolean>,
): Promise<boolean> {
    const whenFlags = state.when_flags;
    if (!whenFlags) return true;
    for (const [flagId, expected] of Object.entries(whenFlags)) {
        const current = await isSet(flagId);
        if (current !== expected) return false;
    }
    return true;
}
