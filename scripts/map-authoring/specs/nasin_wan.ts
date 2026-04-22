/**
 * beat_02_nasin_wan — path-route east of the starter village.
 *
 * 32×12 summer-forest trail with three tall-grass encounter zones (the
 * player's first chance to throw a poki_lili) and jan Ike the rival
 * at the east edge. The warp east to nena_sewi is gated on
 * `jan_ike_defeated`.
 *
 * Encounter rosters come from journey.json beat 2; species listed
 * here are the level-3-7 band from that narrative (jan_ike_lili,
 * jan_utala_lili, jan_moli).
 */
import {
    defineMap,
    edgeTransitionTiles,
    paintEdgeTransitions,
    paintRect,
} from "../lib/spec-helpers";
import { forestPalette } from "../palettes/forest";

const WIDTH = 32;
const HEIGHT = 12;

function forestBase(): string[][] {
    const grid = Array.from({ length: HEIGHT }, (_, y) =>
        Array.from({ length: WIDTH }, (_, x) => {
            if (y === 0 || y === HEIGHT - 1 || x === 0 || x === WIDTH - 1) return "f";
            return (x + y) % 7 === 0 ? "v" : "g";
        }),
    );

    paintRect(grid, [0, 5, WIDTH, 2], "d");
    paintRect(grid, [6, 3, 4, 2], "G");
    paintRect(grid, [14, 6, 5, 2], "G");
    paintRect(grid, [22, 3, 4, 2], "G");

    paintEdgeTransitions(grid, {
        base: ["g", "f", "v"],
        neighbors: "d",
        transitions: edgeTransitionTiles("gd"),
    });
    return grid;
}

export default defineMap({
    id: "nasin_wan",
    biome: "forest",
    music_track: "bgm_forest",
    width: WIDTH,
    height: HEIGHT,
    tileSize: 16,
    tilesets: [
        "seasons/Tileset_Ground_Seasons",
        "seasons/Tileset_Road",
        "seasons/Tileset_TallGrass",
        "seasons/Objects_Trees_Seasons",
    ],
    palette: forestPalette,
    layers: {
        "Below Player": forestBase(),
        World: [
            { at: [2, 3], tile: "tree_wide" },
            { at: [6, 1], tile: "tree_b" },
            { at: [11, 2], tile: "tree_c" },
            { at: [17, 3], tile: "tree_a" },
            { at: [23, 1], tile: "tree_big" },
            { at: [29, 3], tile: "tree_wide" },
            { at: [4, 11], tile: "tree_a" },
            { at: [10, 11], tile: "tree_a" },
            { at: [20, 11], tile: "tree_a" },
            { at: [27, 11], tile: "tree_a" },
            { at: [5, 7], tile: "bush_a" },
            { at: [12, 4], tile: "bush_leaf" },
            { at: [19, 8], tile: "bush_b" },
            { at: [26, 7], tile: "bush_leaf" },
        ],
        Objects: [
            { type: "SpawnPoint", name: "from_tomo", at: [1, 5] },
            {
                type: "NPC",
                name: "jan-palisa-nasin",
                at: [4, 5],
                props: { id: "jan_palisa_nasin", dialog_id: "jan_palisa_nasin_sign" },
            },
            {
                type: "NPC",
                name: "jan-kasi-nasin",
                at: [11, 5],
                props: { id: "jan_kasi_nasin", dialog_id: "jan_kasi_nasin_grass" },
            },
            {
                type: "NPC",
                name: "jan-poki-nasin",
                at: [20, 5],
                props: { id: "jan_poki_nasin", dialog_id: "jan_poki_nasin_pack" },
            },
            {
                type: "NPC",
                name: "jan-lukin-nasin",
                at: [25, 5],
                props: { id: "jan_lukin_nasin", dialog_id: "jan_lukin_nasin_watch" },
            },
            {
                type: "NPC",
                name: "jan-ike",
                at: [28, 5],
                props: { id: "jan_ike", dialog_id: "jan_ike_rival" },
            },
            {
                type: "Warp",
                name: "warp_east",
                rect: [31, 5, 1, 1],
                props: {
                    target_map: "nena_sewi",
                    target_spawn: "from_nasin_wan",
                    required_flag: "jan_ike_defeated",
                },
            },
        ],
        Encounters: [
            {
                rect: [6, 3, 4, 2],
                species: {
                    jan_ike_lili: 20,
                    jan_utala_lili: 18,
                    soweli_musi: 18,
                    soweli_kili: 14,
                    soweli_jaki: 10,
                    waso_pimeja: 10,
                    soweli_anpa: 10,
                },
                levelRange: [3, 5],
            },
            {
                rect: [14, 6, 5, 2],
                species: {
                    jan_ike_lili: 18,
                    jan_utala_lili: 22,
                    jan_moli: 14,
                    soweli_musi: 14,
                    soweli_kili: 14,
                    waso_toki: 10,
                    soweli_kon: 8,
                },
                levelRange: [4, 6],
            },
            {
                rect: [22, 3, 4, 2],
                species: {
                    jan_ike_lili: 15,
                    jan_moli: 25,
                    soweli_kili: 20,
                    soweli_jaki: 20,
                    akesi_linja: 10,
                    soweli_nena: 10,
                },
                levelRange: [5, 7],
            },
        ],
    },
});
