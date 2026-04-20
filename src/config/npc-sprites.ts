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

import { Animation, Direction } from '@rpgjs/common';

/** Shared animation factory for any 64×496 / 16×16 / 4c×31r non-combat sheet. */
function npcTextures() {
    const stand = (direction: Direction) => {
        const rowByDir: Partial<Record<Direction, number>> = {
            [Direction.Down]: 1,
            [Direction.Left]: 4,
            [Direction.Right]: 7,
            [Direction.Up]: 10,
        };
        return [{ time: 0, frameX: 1, frameY: rowByDir[direction] ?? 1 }];
    };

    const walk = (direction: Direction) => {
        const rowByDir: Partial<Record<Direction, number>> = {
            [Direction.Down]: 0,
            [Direction.Left]: 3,
            [Direction.Right]: 6,
            [Direction.Up]: 9,
        };
        const row = rowByDir[direction] ?? 0;
        return [
            { time: 0,  frameX: 0, frameY: row },
            { time: 10, frameX: 1, frameY: row },
            { time: 20, frameX: 2, frameY: row },
            { time: 30 },
        ];
    };

    return {
        textures: {
            [Animation.Stand]: { animations: ({ direction }: { direction: Direction }) => [stand(direction)] },
            [Animation.Walk]:  { animations: ({ direction }: { direction: Direction }) => [walk(direction)] },
        },
        framesWidth: 4,
        framesHeight: 31,
    };
}

/** Spritesheet descriptor shape expected by RPG.js provideClientModules. */
interface SpritesheetEntry {
    id: string;
    image: string;
    textures: ReturnType<typeof npcTextures>['textures'];
    framesWidth: number;
    framesHeight: number;
}

function npcSheet(id: string, image: string): SpritesheetEntry {
    return { id, image, ...npcTextures() };
}

/**
 * All NPC spritesheets to register with the RPG.js client.
 * Import this array and spread it into the `spritesheets` array inside
 * `config.client.ts > provideClientModules`.
 */
export const npcSpritesheets: SpritesheetEntry[] = [
    // ── Guards ────────────────────────────────────────────────────────────
    npcSheet('npc_guard_spear',        'assets/npcs/guards/guard-spearman.png'),
    npcSheet('npc_guard_archer',       'assets/npcs/guards/guard-archer-non-combat.png'),
    npcSheet('npc_guard_sword',        'assets/npcs/guards/guard-swordsman.png'),

    // ── Villagers — Feminine ───────────────────────────────────────────────
    npcSheet('npc_villager_fem_hana',  'assets/npcs/villagers-fem/hana/hana.png'),
    npcSheet('npc_villager_fem_julz',  'assets/npcs/villagers-fem/julz/julz.png'),
    npcSheet('npc_villager_fem_khali', 'assets/npcs/villagers-fem/khali/khali.png'),
    npcSheet('npc_villager_fem_meza',  'assets/npcs/villagers-fem/meza/meza.png'),
    npcSheet('npc_villager_fem_nel',   'assets/npcs/villagers-fem/nel/nel.png'),
    npcSheet('npc_villager_fem_seza',  'assets/npcs/villagers-fem/seza/seza.png'),
    npcSheet('npc_villager_fem_vash',  'assets/npcs/villagers-fem/vash/vash.png'),

    // ── Villagers — Masculine ──────────────────────────────────────────────
    npcSheet('npc_villager_masc_artun', 'assets/npcs/villagers-masc/artun/artun.png'),
    npcSheet('npc_villager_masc_grym',  'assets/npcs/villagers-masc/grym/grym.png'),
    npcSheet('npc_villager_masc_hark',  'assets/npcs/villagers-masc/hark/hark.png'),
    npcSheet('npc_villager_masc_janik', 'assets/npcs/villagers-masc/janik/janik.png'),
    npcSheet('npc_villager_masc_nyro',  'assets/npcs/villagers-masc/nyro/nyro.png'),
    npcSheet('npc_villager_masc_reza',  'assets/npcs/villagers-masc/reza/reza.png'),
    npcSheet('npc_villager_masc_serek', 'assets/npcs/villagers-masc/serek/serek.png'),

    // ── Warriors ──────────────────────────────────────────────────────────
    npcSheet('npc_warrior_archer',       'assets/npcs/warriors/archer-non-combat.png'),
    npcSheet('npc_warrior_2h_sword',     'assets/npcs/warriors/2-handed-swordsman-non-combat.png'),
    npcSheet('npc_warrior_sword_shield', 'assets/npcs/warriors/sword-and-shield-fighter-non-combat.png'),
];
