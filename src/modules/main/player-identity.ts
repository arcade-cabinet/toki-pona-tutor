/**
 * Player identity overlay (T11-02).
 *
 * Attaches a persistent overhead name tag ("Rivers") to the PC so the
 * protagonist reads as a protagonist in a village full of NPCs that
 * use distinct-but-similar Fan-tasy character spritesheets. Without
 * this, the visual-audit capture caught Rivers blending into the
 * crowd — the v1 blocker flagged by T11-02.
 *
 * The tag uses RPG.js's built-in setComponentsTop + Components.text
 * API (same API used for the T11-10 cue on jan Sewi). It's a thin
 * persistent overlay — not a HUD element — so it follows the sprite
 * through warps, combat scenes, and dialog modals automatically.
 *
 * Applied from player hooks (onConnected + onJoinMap) so the tag
 * survives:
 *   - first connect (fresh session)
 *   - every map transition (some overlays are cleared by the engine
 *     between maps; re-applying is cheap and safe)
 *   - save-load (the client rehydrates from server state which calls
 *     onJoinMap again)
 */
import type { RpgPlayer } from "@rpgjs/server";
import { Components } from "@rpgjs/server";
import { PLAYER_CONFIG } from "../../content/gameplay";

type NameTagPlayer = {
    setComponentsTop: (layout: unknown, options?: unknown) => void;
};

export function applyPlayerNameTag(player: RpgPlayer): void {
    const tag = PLAYER_CONFIG.nameTag;
    const target = player as unknown as NameTagPlayer;
    target.setComponentsTop(
        Components.text(tag.text, {
            fill: tag.fill,
            stroke: tag.stroke,
            fontSize: tag.fontSize,
            fontWeight: tag.fontWeight as "bold" | "normal",
            align: "center",
        }),
        { marginBottom: tag.marginBottom },
    );
}
