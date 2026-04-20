/**
 * Combatant spritesheet registrations — human trainers (rivals + gym leaders).
 *
 * Only sheets that are actively bound to NPCs via setGraphic() are registered here.
 * Document-only sheets are described in docs/COMBATANT_SPRITES.md but have no ID entry.
 *
 * Naming convention: combatant_<class>_<variant>
 * See docs/COMBATANT_SPRITES.md for the full manifest (frame dims, animation rows, lore notes).
 *
 * Frame layout for all overworld sheets:
 *   All non-combat overworld sheets use RMSpritesheet(4, 8) — 4 cols × 8 rows.
 *   This covers the first 8 rows of each sheet (walk_down / walk_left / walk_right / walk_up,
 *   each with 4 frames), which is the standard overworld walk cycle that RPG.js needs for
 *   stand + walk animations. Rows 8–30 (idle variants, taunt, attack, hurt, defeat) are
 *   present in the full sheet but not exercised by the engine for overworld display.
 *
 * The paladin sheet uses framesWidth: 4 (24 px per frame, 96 px total width).
 */

import { Presets } from '@rpgjs/client';

// ─── MAGES ──────────────────────────────────────────────────────────────────

/** jan Telo — water gym master (region 4). Red-robed elemental caster. */
export const MAGE_FEM_RED = {
    id: 'combatant_mage_fem_red',
    image: 'assets/combatants/mages/mage-fem-red.png',
    ...Presets.RMSpritesheet(4, 8),
};

/** jan Lete — ice gym master (region 5). Hooded brown-robed cold mage. */
export const MAGE_HOODED_BROWN = {
    id: 'combatant_mage_hooded_brown',
    image: 'assets/combatants/mages/mage-hooded-brown.png',
    ...Presets.RMSpritesheet(4, 8),
};

// ─── ROGUES ─────────────────────────────────────────────────────────────────

/** jan Ike — rival (all regions). Dark-hooded rogue with daggers. */
export const ROGUE_HOODED = {
    id: 'combatant_rogue_hooded',
    image: 'assets/combatants/rogues/hooded-rogue-non-combat-daggers-equipped.png',
    ...Presets.RMSpritesheet(4, 8),
};

// ─── WARRIORS ───────────────────────────────────────────────────────────────

/** jan Wawa — strength gym master (region 3). Orange axe-warrior. */
export const WARRIOR_AXE = {
    id: 'combatant_warrior_axe',
    image: 'assets/combatants/warriors/axe-warrior-16x16.png',
    ...Presets.RMSpritesheet(4, 8),
};

/**
 * jan Suli — champion gym master (region 6). White/red paladin with shield.
 *
 * The paladin non-combat sheet is 96 px wide at 24×24 px per frame = 4 cols.
 * Registered with framesWidth: 4, framesHeight: 8 via RMSpritesheet(4, 8).
 * The engine will render the 96 px sheet correctly as 4 × 24-px columns.
 */
export const WARRIOR_PALADIN = {
    id: 'combatant_warrior_paladin',
    image: 'assets/combatants/warriors/paladin/non-combat-animations.png',
    ...Presets.RMSpritesheet(4, 8),
};

// ─── Export list for config.client.ts ───────────────────────────────────────

/** All bound combatant spritesheets, ready to spread into the spritesheets array. */
export const COMBATANT_SPRITESHEETS = [
    MAGE_FEM_RED,
    MAGE_HOODED_BROWN,
    ROGUE_HOODED,
    WARRIOR_AXE,
    WARRIOR_PALADIN,
] as const;
