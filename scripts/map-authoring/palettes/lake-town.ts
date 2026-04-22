/**
 * Lake-village palette from the Fan-tasy `seasons` pack.
 *
 * Reuses the verified blocked-water tile from the riverside route and adds
 * stone/dirt town surfaces plus large collection-image buildings.
 */
import type { Palette } from "../lib/types";
import surfaceConfig from "../config/fantasy-surfaces.json";
import { collectionAtlasEntry } from "../config/collection-atlases";

const seasons = surfaceConfig.seasons;
const ground = seasons.ground;
const shore = seasons.sand;
const water = seasons.water;
const seasonsBuildings = "seasons/Objects_Buildings_Seasons";
const seasonsTrees = "seasons/Objects_Trees_Seasons";

export const lakeTownPalette: Palette = {
    g: {
        tsx: "seasons/Tileset_Ground_Seasons",
        local_id: ground.grass.base,
        description: "summer island grass",
    },
    v: {
        tsx: "seasons/Tileset_Ground_Seasons",
        local_id: ground.grass.lightVariant,
        description: "light island grass variation",
    },
    s: {
        tsx: "seasons/Tileset_Sand",
        local_id: shore.shore,
        description: "lake shore sand",
        surface: "sand",
        role: "base",
        walkable: true,
    },
    d: {
        tsx: "seasons/Tileset_Road",
        local_id: seasons.road.dirt,
        description: "packed dirt causeway",
    },
    p: {
        tsx: "seasons/Tileset_Road",
        local_id: seasons.road.stone,
        description: "stone village plaza",
    },
    w: {
        tsx: "seasons/Tileset_Water",
        local_id: water.blocked,
        description: "blocked animated lake water",
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

    house_blue: {
        ...collectionAtlasEntry(seasonsBuildings, 271),
        description: "small hay-roof house",
    },
    house_red: {
        ...collectionAtlasEntry(seasonsBuildings, 58),
        description: "narrow hay-roof house",
    },
    market_stand: {
        ...collectionAtlasEntry(seasonsBuildings, 282),
        description: "red market stand",
    },

    tree_a: { ...collectionAtlasEntry(seasonsTrees, 0), description: "emerald tree 2" },
    tree_b: { ...collectionAtlasEntry(seasonsTrees, 1), description: "emerald tree 3" },
    bush_a: { ...collectionAtlasEntry(seasonsTrees, 14), description: "emerald bush 1" },
};
