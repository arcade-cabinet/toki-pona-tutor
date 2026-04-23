/**
 * Opening scene — T11-11 (Phase 11, the v1 onboarding rewrite).
 *
 * The north-star is the 16-bit playbook: Pokémon Blue, Final Fantasy VI,
 * Chrono Trigger. Story is the asset that lasts. The opening 30 seconds
 * of a 16-bit RPG *is* the world in miniature. Before this module, a
 * new player clicked New Game and was dropped onto a map with no
 * player-sprite differentiation, no scripted beat, no HUD, no reason
 * to care. This module answers three questions in sequence, before the
 * player presses a single movement key:
 *
 *   - Why is Rivers here?   (Selby's ceremony)
 *   - Why does Rivers care? (the dragon-mystery seed)
 *   - Why does the player want to go on? (a visible first objective)
 *
 * The module is idempotent. On first play it runs the full scripted
 * arc; on every subsequent entry into riverside_home it no-ops because
 * `opening_scene_complete` is set. The flag lives in persisted storage
 * so it survives saves. NG+ clears it (see new-game-plus.ts) so the
 * opening replays on the reset run.
 *
 * Integration points:
 *   - `title-menu.ts startFreshGame()` — calls runOpeningScene right
 *     after teleporting the player to the starter spawn.
 *   - `new-game-plus.ts` — clears the flag as part of its reset set.
 *
 * Testability:
 *   - Pure state machine exposed as `decideOpeningScene()` so the
 *     branching can be unit-tested without spinning up the engine.
 *   - The RpgPlayer-facing `runOpeningScene()` is wired through the
 *     existing `playDialog` helper plus a small `beat()` wrapper so
 *     integration tests can assert the beat sequence by mocking
 *     `playDialog`.
 */
import type { RpgPlayer } from "@rpgjs/server";
import { OPENING_SCENE_CONFIG } from "../../content/gameplay";
import { getFlag, setFlag } from "../../platform/persistence/queries";
import { playDialog } from "./dialog";
import { runStarterCeremony } from "./starter-ceremony";

export type OpeningSceneDecision =
    | "play_full" // first run, no save
    | "skip_already_played" // flag is set, do nothing
    | "skip_starter_already_chosen"; // defensive: player is mid-game somehow

/**
 * Pure decision over the two flags we care about. Isolated from the
 * RpgPlayer-facing handler so the branching can be unit-tested.
 */
export function decideOpeningScene(flags: {
    openingComplete: boolean;
    starterChosen: boolean;
}): OpeningSceneDecision {
    if (flags.openingComplete) return "skip_already_played";
    if (flags.starterChosen) return "skip_starter_already_chosen";
    return "play_full";
}

/**
 * Runs the full scripted opening when the decision calls for it.
 * No-op in every other case. Sets the completion flag at the end so
 * the scene never replays on save-load.
 *
 * Content — beats, flag id, post-scene dialog id — lives in
 * `src/content/gameplay/ui.json` under `opening_scene`. This keeps
 * narrative content out of the runtime module per the gameplay-JSON
 * boundary (see `tests/build-time/gameplay-config-boundary.test.ts`).
 */
export async function runOpeningScene(player: RpgPlayer): Promise<OpeningSceneDecision> {
    const [openingValue, starterValue] = await Promise.all([
        getFlag(OPENING_SCENE_CONFIG.flagId),
        getFlag("starter_chosen"),
    ]);
    const decision = decideOpeningScene({
        openingComplete: Boolean(openingValue),
        starterChosen: Boolean(starterValue),
    });
    if (decision !== "play_full") return decision;

    // Scene itself. Each beat blocks on the player's advance-dialog
    // input; showText is the standard RPG.js modal dialog surface.
    for (const beat of OPENING_SCENE_CONFIG.beats) {
        await player.showText(beat);
    }

    // Selby-intro narrative beats (from the spine dialog file).
    // playDialog is display-only — no choices, no state mutation.
    await playDialog(player, OPENING_SCENE_CONFIG.postSceneDialogId);

    // The real ceremony: choice prompt + party grant + inventory seed
    // + bestiary sighting + clue records. This is what closes the gap
    // between "opening ends" and "game begins" — the player doesn't
    // have to find Selby; the opening hands them straight into the
    // starter choice.
    await runStarterCeremony(player);

    // Mark complete so save/load, disconnects, and reconnects all
    // treat the opening as done.
    await setFlag(OPENING_SCENE_CONFIG.flagId, "1");

    return "play_full";
}
