import { type EventDefinition, RpgPlayer } from "@rpgjs/server";

/**
 * Sign-post event. A small diegetic text plaque the player reads by
 * pressing the action key adjacent to it. Body text is the sign's
 * copy from src/content/regions/<region>/signs.json, threaded through
 * build-spine into world.json and laid into the Tiled map via the
 * dossier-merge pipeline at author time.
 *
 * No flag gating, no branching, no combat. Pokémon-style flavor: one
 * short line of world texture per sign. Contrast with NPCs, which have
 * multi-state dossiers and quest/plot reactivity.
 *
 * T83: when a title is supplied, it rides through DialogOptions.speaker
 * so the rr-ui surface renders the sign heading ("RIVERSIDE HOME") as a
 * distinct label above the body. Legacy SignEvent(body) calls still work
 * — no speaker means no heading, just a plain dialog box.
 */
export function SignEvent(body: string, title?: string): EventDefinition {
    return {
        onInit() {
            // Signs are invisible infrastructure — the sprite is the
            // tile painted underneath, not an NPC walker. No setGraphic.
        },
        async onAction(player: RpgPlayer) {
            const options = title ? { speaker: title } : undefined;
            await player.showText(body, options);
        },
    };
}
