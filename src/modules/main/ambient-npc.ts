import { type EventDefinition, RpgPlayer } from "@rpgjs/server";
import { playDialog } from "./dialog";
import { getFlag } from "../../platform/persistence/queries";

export interface AmbientNpcOptions {
    /**
     * Optional progression gate. When set, the NPC is silent on action
     * until this flag is truthy. Used for cross-region appearances like
     * Rook at Rivergate (needs badge_suli) or Cormorant post-sighting:
     * the dossier `appearances` array declares the gate and the
     * compile-time merge propagates it into the Tiled object's custom
     * properties, which this runtime reads.
     *
     * The NPC sprite is still drawn regardless; only the interaction
     * is gated. Proper visual hiding (despawn when gate fails) is a
     * future task — until then, a quiet no-op on action is the
     * pragma: better than the NPC happily monologuing before the
     * player reached the beat.
     */
    requiredFlag?: string;
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
            this.setGraphic(graphic);
        },
        async onAction(player: RpgPlayer) {
            if (options.requiredFlag) {
                const value = await getFlag(options.requiredFlag);
                const set = value != null && value !== "" && value !== "0";
                if (!set) return;
            }
            await playDialog(player, dialogId);
        },
    };
}
