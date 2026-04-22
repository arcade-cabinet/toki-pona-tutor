/**
 * NPC sprite sheet registrations.
 *
 * Each entry here corresponds to a PNG under public/assets/npcs/ and is
 * documented in docs/NPC_SPRITES.md.
 *
 * All non-combat sheets share the same layout:
 *   - 64 × 496 px total, 16 × 16 px per frame, 4 cols × 31 rows.
 *   - Row 0 = walk-down strip (3 motion frames + 1 stand).
 *   - Row 1 = stand-down strip (4 frames of stand, col 1 is the default).
 *   - Rows 0–11 = full 4-directional walk cycle (rows 0–2 down, 3–5 left,
 *     6–8 right, 9–11 up).
 *
 * RPG.js textures format uses `frameX` / `frameY` as column / row indices
 * within the declared framesWidth × framesHeight grid.
 *
 * For ambient walk + stand we use framesWidth=4, framesHeight=31 and
 * manually declare stand (row 1, col 1) and walk (row 0, cols 0-2).
 *
 * Guard warrior non-combat sheets are identical in dimensions and layout;
 * they just show armoured characters.
 */

import { Animation, Direction } from "@rpgjs/common";
import {
    NPC_SPRITESHEET_CONFIGS,
    spriteLayout,
    type RuntimeSpritesheetConfig,
} from "../content/gameplay";
import { standFrames, walkFrames } from "./sprite-layout";

/** Shared animation factory for any 64×496 / 16×16 / 4c×31r non-combat sheet. */
function npcTextures(config: RuntimeSpritesheetConfig) {
    const layout = spriteLayout(config.layoutId);
    return {
        textures: {
            idle: {
                animations: ({ direction }: { direction: Direction }) => [
                    standFrames(layout, direction),
                ],
            },
            [Animation.Stand]: {
                animations: ({ direction }: { direction: Direction }) => [
                    standFrames(layout, direction),
                ],
            },
            [Animation.Walk]: {
                animations: ({ direction }: { direction: Direction }) => [
                    walkFrames(layout, direction),
                ],
            },
        },
        framesWidth: layout.framesWidth,
        framesHeight: layout.framesHeight,
    };
}

/** Spritesheet descriptor shape expected by RPG.js provideClientModules. */
interface SpritesheetEntry {
    id: string;
    image: string;
    textures: ReturnType<typeof npcTextures>["textures"];
    framesWidth: number;
    framesHeight: number;
}

function npcSheet(config: RuntimeSpritesheetConfig): SpritesheetEntry {
    return { id: config.id, image: config.image, ...npcTextures(config) };
}

/**
 * All NPC spritesheets to register with the RPG.js client.
 * Import this array and spread it into the `spritesheets` array inside
 * `config.client.ts > provideClientModules`.
 */
export const npcSpritesheets: SpritesheetEntry[] = [...NPC_SPRITESHEET_CONFIGS.map(npcSheet)];
