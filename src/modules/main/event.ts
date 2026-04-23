import { type EventDefinition, RpgPlayer } from "@rpgjs/server";
import { STARTER_CEREMONY_CONFIG } from "../../content/gameplay";
import { runStarterCeremony } from "./starter-ceremony";

export function JanSewi(): EventDefinition {
    return {
        onInit() {
            this.setGraphic(STARTER_CEREMONY_CONFIG.mentorGraphic);
        },
        async onAction(player: RpgPlayer) {
            await runStarterCeremony(player);
        },
    };
}
