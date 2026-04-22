/**
 * beat_04_ma_telo — lake village.
 *
 * Round village on a stone island in the middle of a lake. Deliberately
 * NO tall grass — this is a story + shop beat, not an encounter zone.
 * The player catches their breath between the first gym (jan Wawa) and
 * the type-wrinkle fight against jan Telo.
 */
import {
    defineMap,
    edgeTransitionTiles,
    paintEdgeTransitions,
    paintNeighborBuffer,
} from "../lib/spec-helpers";
import { lakeTownPalette } from "../palettes/lake-town";

const WIDTH = 20;
const HEIGHT = 16;

function lakeVillageBase(): string[][] {
    const grid = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill("w"));
    const cx = 10;
    const cy = 8;

    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
            const island = ((x - cx) / 7.4) ** 2 + ((y - cy) / 5.2) ** 2;
            const shore = ((x - cx) / 9) ** 2 + ((y - cy) / 6.8) ** 2;
            if (island <= 1) {
                grid[y][x] = (x + y) % 8 === 0 ? "v" : "g";
            } else if (shore <= 1) {
                grid[y][x] = "s";
            }
        }
    }

    // West entry causeway from nena_sewi.
    for (let x = 0; x <= 8; x++) {
        grid[5][x] = "d";
        grid[6][x] = "d";
        grid[7][x] = "d";
    }

    // North causeway to ma_lete's gated warp.
    for (let y = 0; y <= 6; y++) {
        grid[y][14] = "d";
        grid[y][15] = "d";
    }

    // Central stone plaza around jan Telo and jan Moku's shop.
    for (let y = 4; y <= 10; y++) {
        for (let x = 7; x <= 15; x++) grid[y][x] = "p";
    }

    // Lower shore path so jan Kala and the quiet lake NPC are reachable.
    for (let x = 4; x <= 12; x++) grid[12][x] = "d";
    for (let x = 4; x <= 7; x++) grid[13][x] = "d";

    paintNeighborBuffer(grid, {
        base: "w",
        neighbors: "d",
        buffer: "s",
    });
    paintEdgeTransitions(grid, {
        base: ["g", "v"],
        neighbors: "d",
        transitions: edgeTransitionTiles("gd"),
    });
    paintEdgeTransitions(grid, {
        base: "w",
        neighbors: "s",
        transitions: edgeTransitionTiles("ws"),
    });

    return grid;
}

export default defineMap({
    id: "ma_telo",
    biome: "town",
    music_track: "bgm_village",
    width: WIDTH,
    height: HEIGHT,
    tileSize: 16,
    tilesets: [
        "seasons/Tileset_Ground_Seasons",
        "seasons/Tileset_Road",
        "seasons/Tileset_Sand",
        "seasons/Tileset_Water",
        "generated/Tileset_Water_Shore_Seasons",
        "seasons/Objects_Buildings_Seasons",
        "seasons/Objects_Trees_Seasons",
    ],
    palette: lakeTownPalette,
    layers: {
        "Below Player": lakeVillageBase(),
        World: [
            { at: [2, 1], tile: "tree_a" },
            { at: [17, 1], tile: "tree_b" },
            { at: [1, 12], tile: "tree_a" },
            { at: [18, 12], tile: "tree_b" },
            { at: [0, 0], tile: "house_blue" },
            { at: [16, 12], tile: "house_red" },
            { at: [7, 3], tile: "market_stand" },
            { at: [4, 11], tile: "bush_a" },
            { at: [12, 11], tile: "bush_a" },
        ],
        Objects: [
            { type: "SpawnPoint", name: "from_nena_sewi", at: [2, 6] },
            {
                type: "NPC",
                name: "jan-kala-lake",
                at: [5, 13],
                props: { id: "jan_kala_lake", dialog_id: "jan_kala_lake_quest" },
            },
            {
                type: "NPC",
                name: "jan-olin-telo",
                at: [8, 10],
                props: { id: "jan_olin_telo", dialog_id: "jan_olin_telo_quiet" },
            },
            {
                type: "NPC",
                name: "jan-moku",
                at: [8, 4],
                props: { id: "jan_moku", dialog_id: "jan_moku_stall" },
            },
            {
                type: "NPC",
                name: "jan-sike-telo",
                at: [12, 8],
                props: { id: "jan_sike_telo", dialog_id: "jan_sike_telo_plaza" },
            },
            {
                type: "NPC",
                name: "jan-telo",
                at: [15, 8],
                props: { id: "jan_telo", dialog_id: "jan_telo_intro" },
            },
            {
                type: "Warp",
                name: "warp_north",
                rect: [15, 0, 1, 1],
                props: {
                    target_map: "ma_lete",
                    target_spawn: "from_ma_telo",
                    required_flag: "badge_telo",
                },
            },
        ],
    },
});
