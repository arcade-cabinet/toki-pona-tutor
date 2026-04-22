/**
 * Summer forest palette from the Fan-tasy `seasons` pack.
 *
 * Local IDs come from the pack's Cherry Hill sample via `pnpm author:inspect`.
 */
import type { Palette } from "../lib/types";
import surfaceConfig from "../config/fantasy-surfaces.json";

const seasons = surfaceConfig.seasons;
const ground = seasons.ground;

export const forestPalette: Palette = {
    // Ground + path.
    g: {
        tsx: "seasons/Tileset_Ground_Seasons",
        local_id: ground.grass.base,
        description: "summer forest grass",
    },
    f: {
        tsx: "seasons/Tileset_Ground_Seasons",
        local_id: ground.grass.darkVariant,
        description: "darker summer forest grass",
    },
    v: {
        tsx: "seasons/Tileset_Ground_Seasons",
        local_id: ground.grass.lightVariant,
        description: "light forest grass variation",
    },
    d: {
        tsx: "seasons/Tileset_Road",
        local_id: seasons.road.dirt,
        description: "soft dirt forest trail",
    },
    gd_n: {
        tsx: "seasons/Tileset_Ground_Seasons",
        local_id: ground.grassDirtTransitions.n,
        description: "grass-to-dirt transition, dirt north",
        surface: "smooth-grass",
        role: "transition",
        walkable: true,
    },
    gd_e: {
        tsx: "seasons/Tileset_Ground_Seasons",
        local_id: ground.grassDirtTransitions.e,
        description: "grass-to-dirt transition, dirt east",
        surface: "smooth-grass",
        role: "transition",
        walkable: true,
    },
    gd_s: {
        tsx: "seasons/Tileset_Ground_Seasons",
        local_id: ground.grassDirtTransitions.s,
        description: "grass-to-dirt transition, dirt south",
        surface: "smooth-grass",
        role: "transition",
        walkable: true,
    },
    gd_w: {
        tsx: "seasons/Tileset_Ground_Seasons",
        local_id: ground.grassDirtTransitions.w,
        description: "grass-to-dirt transition, dirt west",
        surface: "smooth-grass",
        role: "transition",
        walkable: true,
    },
    gd_ne: {
        tsx: "seasons/Tileset_Ground_Seasons",
        local_id: ground.grassDirtTransitions.ne,
        description: "grass-to-dirt transition, dirt north and east",
        surface: "smooth-grass",
        role: "transition",
        walkable: true,
    },
    gd_nw: {
        tsx: "seasons/Tileset_Ground_Seasons",
        local_id: ground.grassDirtTransitions.nw,
        description: "grass-to-dirt transition, dirt north and west",
        surface: "smooth-grass",
        role: "transition",
        walkable: true,
    },
    gd_se: {
        tsx: "seasons/Tileset_Ground_Seasons",
        local_id: ground.grassDirtTransitions.se,
        description: "grass-to-dirt transition, dirt south and east",
        surface: "smooth-grass",
        role: "transition",
        walkable: true,
    },
    gd_sw: {
        tsx: "seasons/Tileset_Ground_Seasons",
        local_id: ground.grassDirtTransitions.sw,
        description: "grass-to-dirt transition, dirt south and west",
        surface: "smooth-grass",
        role: "transition",
        walkable: true,
    },

    // Encounter grass.
    G: {
        tsx: "seasons/Tileset_TallGrass",
        local_id: seasons.tallGrass.summer,
        description: "summer tall grass encounter tile",
    },

    // Tree and underbrush collection images.
    tree_a: { tsx: "seasons/Objects_Trees_Seasons", local_id: 0, description: "emerald tree 2" },
    tree_b: { tsx: "seasons/Objects_Trees_Seasons", local_id: 1, description: "emerald tree 3" },
    tree_c: { tsx: "seasons/Objects_Trees_Seasons", local_id: 2, description: "emerald tree 4" },
    tree_wide: {
        tsx: "seasons/Objects_Trees_Seasons",
        local_id: 32,
        description: "wide emerald tree",
    },
    tree_big: {
        tsx: "seasons/Objects_Trees_Seasons",
        local_id: 82,
        description: "large emerald tree",
    },
    bush_a: { tsx: "seasons/Objects_Trees_Seasons", local_id: 14, description: "emerald bush 1" },
    bush_b: { tsx: "seasons/Objects_Trees_Seasons", local_id: 16, description: "emerald bush 3" },
    bush_leaf: {
        tsx: "seasons/Objects_Trees_Seasons",
        local_id: 52,
        description: "leafy emerald bush",
    },
};
