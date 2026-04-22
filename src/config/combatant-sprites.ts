/**
 * Combatant spritesheet registrations — human trainers (rivals + gym leaders).
 *
 * These non-combat overworld sheets share the same extended-layout convention
 * as the NPC sheets: 4 columns, 31 rows, with explicit row blocks for
 * stand/walk and late-sheet action poses. Action-battle AI calls
 * `setGraphicAnimation('attack', ...)`, so trainer graphics need a registered
 * `attack` texture instead of the walk-only RMSpritesheet preset.
 */

import { Animation, Direction } from "@rpgjs/common";
import {
    COMBATANT_SPRITESHEET_CONFIGS,
    spriteLayout,
    type RuntimeCombatantSpritesheetConfig,
    type RuntimeSpriteLayoutConfig,
} from "../content/gameplay";
import { actionFrames, standFrames, walkFrames, type SpritesheetFrame } from "./sprite-layout";

type CombatantSheetOptions = {
    attackRow: number;
    skillRow?: number;
    defenseRow?: number;
    hurtRow?: number;
};

type CombatantTextureKey = "idle" | "hurt" | Animation;
type CombatantTexture = {
    animations: (args: { direction: Direction }) => Array<SpritesheetFrame[]>;
};
type RequiredCombatantTextureKey = "idle" | Animation.Stand | Animation.Walk | Animation.Attack;
type OptionalCombatantTextureKey = Exclude<CombatantTextureKey, RequiredCombatantTextureKey>;
type CombatantTextures = Record<RequiredCombatantTextureKey, CombatantTexture> &
    Partial<Record<OptionalCombatantTextureKey, CombatantTexture>>;

type CombatantSpritesheetEntry = {
    id: string;
    image: string;
    textures: CombatantTextures;
    framesWidth: number;
    framesHeight: number;
};

function combatantTextures(
    layout: RuntimeSpriteLayoutConfig,
    opts: CombatantSheetOptions,
): CombatantTextures {
    const textures: CombatantTextures = {
        idle: {
            animations: ({ direction }) => [standFrames(layout, direction)],
        },
        [Animation.Stand]: {
            animations: ({ direction }) => [standFrames(layout, direction)],
        },
        [Animation.Walk]: {
            animations: ({ direction }) => [walkFrames(layout, direction)],
        },
        [Animation.Attack]: {
            animations: () => [
                actionFrames(
                    opts.attackRow,
                    layout.attackSpeed ?? layout.walkSpeed,
                    layout.walkFrameCount,
                ),
            ],
        },
    };

    if (opts.skillRow !== undefined) {
        textures[Animation.Skill] = {
            animations: () => [
                actionFrames(
                    opts.skillRow!,
                    layout.skillSpeed ?? layout.attackSpeed ?? layout.walkSpeed,
                    layout.walkFrameCount,
                ),
            ],
        };
    }

    if (opts.defenseRow !== undefined) {
        textures[Animation.Defense] = {
            animations: () => [
                actionFrames(
                    opts.defenseRow!,
                    layout.defenseSpeed ?? layout.walkSpeed,
                    layout.walkFrameCount,
                ),
            ],
        };
    }

    if (opts.hurtRow !== undefined) {
        textures.hurt = {
            animations: () => [
                actionFrames(
                    opts.hurtRow!,
                    layout.hurtSpeed ?? layout.defenseSpeed ?? layout.walkSpeed,
                    layout.walkFrameCount,
                ),
            ],
        };
    }

    return textures;
}

function combatantSheet(config: RuntimeCombatantSpritesheetConfig): CombatantSpritesheetEntry {
    const layout = spriteLayout(config.layoutId);
    const opts: CombatantSheetOptions = {
        attackRow: config.attackRow,
        skillRow: config.skillRow,
        defenseRow: config.defenseRow,
        hurtRow: config.hurtRow,
    };
    return {
        id: config.id,
        image: config.image,
        textures: combatantTextures(layout, opts),
        framesWidth: layout.framesWidth,
        framesHeight: layout.framesHeight,
    };
}

function combatantSheetById(id: string): CombatantSpritesheetEntry {
    const sheet = COMBATANT_SPRITESHEETS.find((candidate) => candidate.id === id);
    if (!sheet) throw new Error(`[combatant-sprites] missing configured sheet: ${id}`);
    return sheet;
}

export const COMBATANT_SPRITESHEETS = COMBATANT_SPRITESHEET_CONFIGS.map(combatantSheet);

// ─── MAGES ──────────────────────────────────────────────────────────────────

/** jan Telo — water gym master (region 4). Red-robed elemental caster. */
export const MAGE_FEM_RED = combatantSheetById("combatant_mage_fem_red");

/** jan Lete — ice gym master (region 5). Hooded brown-robed cold mage. */
export const MAGE_HOODED_BROWN = combatantSheetById("combatant_mage_hooded_brown");

// ─── ROGUES ─────────────────────────────────────────────────────────────────

/** jan Ike — rival (all regions). Dark-hooded rogue with daggers. */
export const ROGUE_HOODED = combatantSheetById("combatant_rogue_hooded");

// ─── WARRIORS ───────────────────────────────────────────────────────────────

/** jan Wawa — strength gym master (region 3). Orange axe-warrior. */
export const WARRIOR_AXE = combatantSheetById("combatant_warrior_axe");

/** jan Suli — champion gym master (region 6). White/red paladin with shield. */
export const WARRIOR_PALADIN = combatantSheetById("combatant_warrior_paladin");
