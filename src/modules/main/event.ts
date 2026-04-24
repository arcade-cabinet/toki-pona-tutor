import { type EventDefinition, Components, RpgEvent, RpgPlayer } from "@rpgjs/server";
import { STARTER_CEREMONY_CONFIG } from "../../content/gameplay";
import { getFlag } from "../../platform/persistence/queries";
import { runStarterCeremony } from "./starter-ceremony";

// Diegetic first-play cue (T11-10). A bright "!" floats above jan Sewi
// so a new player — freshly deposited by the opening scene — has a
// visible place to walk toward without a tutorial overlay. Pokémon /
// FFVI / Chrono Trigger all lean on this glyph; it predates words in
// 16-bit vocabulary. Cleared after the starter ceremony completes so
// returning players don't see it forever.
const FIRST_PLAY_CUE_GLYPH = "!";

function firstPlayCueStyle() {
    return {
        fill: "#ffd86b",
        stroke: "#2a1b08",
        fontSize: 22,
        fontWeight: "bold" as const,
    };
}

function attachFirstPlayCue(event: RpgEvent): void {
    event.setComponentsTop(Components.text(FIRST_PLAY_CUE_GLYPH, firstPlayCueStyle()), {
        marginBottom: -6,
    });
}

function clearFirstPlayCue(event: RpgEvent): void {
    event.setComponentsTop([], {});
}

export function JanSewi(): EventDefinition {
    return {
        async onInit() {
            this.setGraphic(STARTER_CEREMONY_CONFIG.mentorGraphic);
            // Cue disabled for splatter probe — the Components.text
            // renderer is producing garbage canvas text that needs
            // triage before any usage site lands.
            // const starterChosen = await getFlag("starter_chosen");
            // if (!starterChosen) {
            //     attachFirstPlayCue(this as unknown as RpgEvent);
            // }
        },
        async onAction(player: RpgPlayer) {
            await runStarterCeremony(player);
            // clearFirstPlayCue(this as unknown as RpgEvent);  // disabled
        },
    };
}
