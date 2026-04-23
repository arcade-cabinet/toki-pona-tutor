/**
 * Lake-village palette from the Fan-tasy `seasons` pack.
 *
 * Reuses the verified blocked-water tile from the riverside route and adds
 * stone/dirt town surfaces plus large collection-image buildings.
 */
import type { Palette } from "../lib/types";
import { curatedTile } from "../config/art-curation";
import surfaceConfig from "../config/fantasy-surfaces.json";
import { collectionAtlasEntry } from "../config/collection-atlases";

const seasons = surfaceConfig.seasons;
const water = seasons.water;
const seasonsBuildings = "seasons/Objects_Buildings_Seasons";
const seasonsTrees = "seasons/Objects_Trees_Seasons";

export const lakeTownPalette: Palette = {
    g: curatedTile("fan_tasy.seasons.ground.grass_base", { description: "summer island grass" }),
    v: curatedTile("fan_tasy.seasons.ground.grass_light", {
        description: "light island grass variation",
    }),
    s: curatedTile("fan_tasy.seasons.sand.shore", { description: "lake shore sand" }),
    d: curatedTile("fan_tasy.seasons.road.dirt", { description: "packed dirt causeway" }),
    p: curatedTile("fan_tasy.seasons.road.stone", { description: "stone village plaza" }),
    w: curatedTile("fan_tasy.seasons.water.blocked", {
        description: "blocked animated lake water",
    }),
    gd_n: curatedTile("fan_tasy.seasons.ground.grass_dirt_n"),
    gd_e: curatedTile("fan_tasy.seasons.ground.grass_dirt_e"),
    gd_s: curatedTile("fan_tasy.seasons.ground.grass_dirt_s"),
    gd_w: curatedTile("fan_tasy.seasons.ground.grass_dirt_w"),
    gd_ne: curatedTile("fan_tasy.seasons.ground.grass_dirt_ne"),
    gd_nw: curatedTile("fan_tasy.seasons.ground.grass_dirt_nw"),
    gd_se: curatedTile("fan_tasy.seasons.ground.grass_dirt_se"),
    gd_sw: curatedTile("fan_tasy.seasons.ground.grass_dirt_sw"),
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
