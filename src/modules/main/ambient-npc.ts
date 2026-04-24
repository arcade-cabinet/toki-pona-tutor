import { type EventDefinition, RpgPlayer } from "@rpgjs/server";
import { playDialog } from "./dialog";
import { getFlag } from "../../platform/persistence/queries";

export interface AmbientNpcOptions {
    /**
     * Optional progression gate. When set, the NPC is invisible and
     * uninteractive until this flag is truthy. Used for cross-region
     * appearances like Rook at Rivergate (needs badge_suli): the
     * dossier `appearances` array declares the gate and the compile-time
     * merge propagates it into the Tiled object's custom properties,
     * which this runtime reads.
     *
     * Both the sprite and the action are gated. Visual hiding happens
     * reactively: onInit clears the graphic until the flag is checked,
     * onChanges re-evaluates and restores/clears per sync. This keeps
     * the gate honest if an authored gate ever diverges from the map's
     * warp gate — the player can stand exactly where an NPC would spawn
     * without seeing a ghost sprite.
     */
    requiredFlag?: string;
}

async function flagTruthy(flagId: string): Promise<boolean> {
    const value = await getFlag(flagId);
    return value != null && value !== "" && value !== "0";
}

/**
 * Shared factory for NPCs that only show flavour dialog — no combat,
 * no flag-setting side effects. The dialog itself IS flag-reactive via
 * the dossier selector in dialog.ts; this factory just routes the
 * player's action at a given map object to the right dialog id.
 */
export function AmbientNpc(
    graphic: string,
    dialogId: string,
    options: AmbientNpcOptions = {},
): EventDefinition {
    return {
        onInit() {
            if (!options.requiredFlag) {
                this.setGraphic(graphic);
                return;
            }
            // Start invisible; onChanges will reveal when the flag is truthy.
            this.setGraphic([]);
        },
        onChanges(_player: RpgPlayer) {
            if (!options.requiredFlag) return;
            // Fire-and-forget flag probe. onChanges fires on every player
            // sync; the setGraphic call is idempotent so repeated resolves
            // are cheap. The graphic toggles the moment a flag-setting
            // side effect (badge earn, quest turn-in) lands.
            void flagTruthy(options.requiredFlag).then((set) => {
                this.setGraphic(set ? graphic : []);
            });
        },
        async onAction(player: RpgPlayer) {
            if (options.requiredFlag && !(await flagTruthy(options.requiredFlag))) {
                return;
            }
            await playDialog(player, dialogId);
        },
    };
}
