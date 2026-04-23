/**
 * Summer forest palette from the Fan-tasy `seasons` pack.
 *
 * Local IDs come from the pack's Cherry Hill sample via `pnpm author:inspect`.
 */
import type { Palette } from "../lib/types";
import { curatedTile } from "../config/art-curation";
import { collectionAtlasEntry } from "../config/collection-atlases";

const seasonsTrees = "seasons/Objects_Trees_Seasons";

export const forestPalette: Palette = {
    // Ground + path.
    g: curatedTile("fan_tasy.seasons.ground.grass_base", { description: "summer forest grass" }),
    f: curatedTile("fan_tasy.seasons.ground.grass_dark", {
        description: "darker summer forest grass",
    }),
    v: curatedTile("fan_tasy.seasons.ground.grass_light", {
        description: "light forest grass variation",
    }),
    d: curatedTile("fan_tasy.seasons.road.dirt", { description: "soft dirt forest trail" }),
    gd_n: curatedTile("fan_tasy.seasons.ground.grass_dirt_n"),
    gd_e: curatedTile("fan_tasy.seasons.ground.grass_dirt_e"),
    gd_s: curatedTile("fan_tasy.seasons.ground.grass_dirt_s"),
    gd_w: curatedTile("fan_tasy.seasons.ground.grass_dirt_w"),
    gd_ne: curatedTile("fan_tasy.seasons.ground.grass_dirt_ne"),
    gd_nw: curatedTile("fan_tasy.seasons.ground.grass_dirt_nw"),
    gd_se: curatedTile("fan_tasy.seasons.ground.grass_dirt_se"),
    gd_sw: curatedTile("fan_tasy.seasons.ground.grass_dirt_sw"),

    // Encounter grass.
    G: curatedTile("fan_tasy.seasons.tall_grass.transparent_summer", {
        description: "transparent summer encounter brush overlay",
    }),

    // Tree and underbrush collection images.
    tree_a: { ...collectionAtlasEntry(seasonsTrees, 0), description: "emerald tree 2" },
    tree_b: { ...collectionAtlasEntry(seasonsTrees, 1), description: "emerald tree 3" },
    tree_c: { ...collectionAtlasEntry(seasonsTrees, 2), description: "emerald tree 4" },
    tree_wide: {
        ...collectionAtlasEntry(seasonsTrees, 32),
        description: "wide emerald tree",
    },
    tree_big: {
        ...collectionAtlasEntry(seasonsTrees, 82),
        description: "large emerald tree",
    },
    bush_a: { ...collectionAtlasEntry(seasonsTrees, 14), description: "emerald bush 1" },
    bush_b: { ...collectionAtlasEntry(seasonsTrees, 16), description: "emerald bush 3" },
    bush_leaf: {
        ...collectionAtlasEntry(seasonsTrees, 52),
        description: "leafy emerald bush",
    },
};
