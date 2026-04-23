/**
 * Riverside palette from the Fan-tasy `seasons` pack.
 *
 * Local IDs come from the pack's Seasons Shore sample via `pnpm author:inspect`.
 * `w` deliberately uses a water tile with a Tiled objectgroup so the runtime
 * treats the river as blocked terrain.
 */
import type { Palette } from "../lib/types";
import { curatedTile } from "../config/art-curation";
import surfaceConfig from "../config/fantasy-surfaces.json";

const seasons = surfaceConfig.seasons;
const water = seasons.water;

export const waterPalette: Palette = {
    // Ground + shoreline.
    g: curatedTile("fan_tasy.seasons.ground.grass_base", { description: "summer riverside grass" }),
    f: curatedTile("fan_tasy.seasons.ground.grass_dark", {
        description: "darker riverside grass",
    }),
    v: curatedTile("fan_tasy.seasons.ground.grass_light", {
        description: "light riverside grass variation",
    }),
    d: curatedTile("fan_tasy.seasons.road.dirt", { description: "packed dirt river path" }),
    s: curatedTile("fan_tasy.seasons.sand.shore", { description: "pale sand shore" }),
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

    // Encounter grass.
    G: curatedTile("fan_tasy.seasons.tall_grass.transparent_summer", {
        description: "transparent riverside encounter brush overlay",
    }),

    // Deep water. Local tile 26 has a full-tile Tiled collision object.
    w: curatedTile("fan_tasy.seasons.water.blocked", {
        description: "blocked animated river water",
    }),
};
