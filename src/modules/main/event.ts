import { type EventDefinition, RpgPlayer } from "@rpgjs/server";
import { STARTER_CEREMONY_CONFIG } from "../../content/gameplay";
import { runStarterCeremony } from "./starter-ceremony";

// T41 (formerly T11-10): the jan Sewi first-play cue originally rendered
// a floating "!" glyph above Selby via `setComponentsTop(Components.text(...))`.
// That API is broken upstream in RPG.js v5 beta — the client's component
// dispatch iterates `Object.entries(component)` treating every property
// value as a sub-component, which renders the raw component object as
// canvas text (the "splatter" artifact).
//
// We supersede the floating "!" with the HUD goal banner, which already
// shows "Next: Speak with Selby" on the pre-starter state — a clearer
// and more kid-friendly cue than a bare glyph. The banner lives in
// `src/content/gameplay/ui.json` under `hud.goal.objective_row_label_pre_starter`.
// No sprite-overlay cue is needed until upstream ships a fix.

export function JanSewi(): EventDefinition {
    return {
        async onInit() {
            this.setGraphic(STARTER_CEREMONY_CONFIG.mentorGraphic);
        },
        async onAction(player: RpgPlayer) {
            await runStarterCeremony(player);
        },
    };
}
