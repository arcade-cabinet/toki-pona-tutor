/**
 * Riverside palette from the Fan-tasy `seasons` pack.
 *
 * Local IDs come from the pack's Seasons Shore sample via `pnpm author:inspect`.
 * `w` deliberately uses a water tile with a Tiled objectgroup so the runtime
 * treats the river as blocked terrain.
 */
import type { Palette } from "../lib/types";
import surfaceConfig from "../config/fantasy-surfaces.json";

const seasons = surfaceConfig.seasons;
const ground = seasons.ground;
const shore = seasons.sand;
const water = seasons.water;

export const waterPalette: Palette = {
    // Ground + shoreline.
    g: {
        tsx: "seasons/Tileset_Ground_Seasons",
        local_id: ground.grass.base,
        description: "summer riverside grass",
    },
    f: {
        tsx: "seasons/Tileset_Ground_Seasons",
        local_id: ground.grass.darkVariant,
        description: "darker riverside grass",
    },
    v: {
        tsx: "seasons/Tileset_Ground_Seasons",
        local_id: ground.grass.lightVariant,
        description: "light riverside grass variation",
    },
    d: {
        tsx: "seasons/Tileset_Road",
        local_id: seasons.road.dirt,
        description: "packed dirt river path",
    },
    s: {
        tsx: "seasons/Tileset_Sand",
        local_id: shore.shore,
        description: "pale sand shore",
        surface: "sand",
        role: "base",
        walkable: true,
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
    ws_n: {
        tsx: "generated/Tileset_Water_Shore_Seasons",
        local_id: water.shoreTransitionTiles.n,
        description: "water-to-shore transition, sand north",
        surface: "deep-water",
        role: "transition",
        walkable: false,
    },
    ws_e: {
        tsx: "generated/Tileset_Water_Shore_Seasons",
        local_id: water.shoreTransitionTiles.e,
        description: "water-to-shore transition, sand east",
        surface: "deep-water",
        role: "transition",
        walkable: false,
    },
    ws_s: {
        tsx: "generated/Tileset_Water_Shore_Seasons",
        local_id: water.shoreTransitionTiles.s,
        description: "water-to-shore transition, sand south",
        surface: "deep-water",
        role: "transition",
        walkable: false,
    },
    ws_w: {
        tsx: "generated/Tileset_Water_Shore_Seasons",
        local_id: water.shoreTransitionTiles.w,
        description: "water-to-shore transition, sand west",
        surface: "deep-water",
        role: "transition",
        walkable: false,
    },
    ws_ne: {
        tsx: "generated/Tileset_Water_Shore_Seasons",
        local_id: water.shoreTransitionTiles.ne,
        description: "water-to-shore transition, sand north and east",
        surface: "deep-water",
        role: "transition",
        walkable: false,
    },
    ws_nw: {
        tsx: "generated/Tileset_Water_Shore_Seasons",
        local_id: water.shoreTransitionTiles.nw,
        description: "water-to-shore transition, sand north and west",
        surface: "deep-water",
        role: "transition",
        walkable: false,
    },
    ws_se: {
        tsx: "generated/Tileset_Water_Shore_Seasons",
        local_id: water.shoreTransitionTiles.se,
        description: "water-to-shore transition, sand south and east",
        surface: "deep-water",
        role: "transition",
        walkable: false,
    },
    ws_sw: {
        tsx: "generated/Tileset_Water_Shore_Seasons",
        local_id: water.shoreTransitionTiles.sw,
        description: "water-to-shore transition, sand south and west",
        surface: "deep-water",
        role: "transition",
        walkable: false,
    },

    // Encounter grass.
    G: {
        tsx: "seasons/Tileset_TallGrass",
        local_id: seasons.tallGrass.summer,
        description: "summer tall grass encounter tile",
    },

    // Deep water. Local tile 26 has a full-tile Tiled collision object.
    w: {
        tsx: "seasons/Tileset_Water",
        local_id: water.blocked,
        description: "blocked animated river water",
    },
};
