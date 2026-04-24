/**
 * beat_02_greenwood_road — path-route east of the starter village.
 *
 * 32×12 summer-forest trail with three tall-grass encounter zones (the
 * player's first chance to throw a capture_pod) and jan Ike the rival
 * at the east edge. The warp east to highridge_pass is gated on
 * `rook_defeated`.
 *
 * Encounter rosters come from journey.json beat 2; species listed
 * here are the level-3-7 band from that narrative (bramble_imp,
 * thornling, bog_wisp).
 */
import {
    defineMap,
    edgeTransitionTiles,
    emptyGrid,
    paintEdgeTransitions,
    paintRect,
} from "../lib/spec-helpers";
import { collectionAtlasTileset } from "../config/collection-atlases";
import { forestPalette } from "../palettes/forest";

const WIDTH = 32;
const HEIGHT = 12;
const ENCOUNTER_RECTS: Array<[number, number, number, number]> = [
    [6, 3, 4, 2],
    [14, 6, 5, 2],
    [22, 3, 4, 2],
];

function forestBase(): string[][] {
    const grid = Array.from({ length: HEIGHT }, (_, y) =>
        Array.from({ length: WIDTH }, (_, x) => {
            if (y === 0 || y === HEIGHT - 1 || x === 0 || x === WIDTH - 1) return "f";
            return (x + y) % 7 === 0 ? "v" : "g";
        }),
    );

    paintRect(grid, [0, 5, WIDTH, 2], "d");

    paintEdgeTransitions(grid, {
        base: ["g", "f", "v"],
        neighbors: "d",
        transitions: edgeTransitionTiles("gd"),
    });
    return grid;
}

function encounterDetail(): string[][] {
    const grid = emptyGrid(WIDTH, HEIGHT);
    for (const rect of ENCOUNTER_RECTS) paintRect(grid, rect, "G");
    return grid;
}

export default defineMap({
    id: "greenwood_road",
    biome: "forest",
    music_track: "bgm_forest",
    width: WIDTH,
    height: HEIGHT,
    tileSize: 16,
    tilesets: [
        "seasons/Tileset_Ground_Seasons",
        "seasons/Tileset_Road",
        "seasons/Tileset_TallGrass",
        collectionAtlasTileset("seasons/Objects_Trees_Seasons"),
    ],
    palette: forestPalette,
    layers: {
        "Below Player": forestBase(),
        "Ground Detail": encounterDetail(),
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
                props: { id: "briar", dialog_id: "briar_sign" },
            },
            {
                type: "NPC",
                name: "jan-kasi-nasin",
                at: [11, 5],
                props: { id: "thorn", dialog_id: "thorn_grass" },
            },
            {
                type: "NPC",
                name: "jan-poki-nasin",
                at: [20, 5],
                props: { id: "pack", dialog_id: "pack_runner" },
            },
            {
                type: "NPC",
                name: "jan-lukin-nasin",
                at: [25, 5],
                props: { id: "lark", dialog_id: "lark_watch" },
            },
            {
                type: "NPC",
                name: "jan-ike",
                at: [28, 5],
                props: { id: "rook", dialog_id: "rook_rival" },
            },
            {
                type: "Warp",
                name: "warp_east",
                rect: [31, 5, 1, 1],
                props: {
                    target_map: "highridge_pass",
                    target_spawn: "from_greenwood_road",
                    required_flag: "rook_defeated",
                },
            },
        ],
        Encounters: [
            {
                rect: ENCOUNTER_RECTS[0],
                species: {
                    bramble_imp: 20,
                    thornling: 18,
                    mirthcat: 18,
                    applepup: 14,
                    mudgrub: 10,
                    nightjar: 10,
                    burrowmole: 10,
                },
                levelRange: [3, 5],
            },
            {
                rect: ENCOUNTER_RECTS[1],
                species: {
                    bramble_imp: 18,
                    thornling: 22,
                    bog_wisp: 14,
                    mirthcat: 14,
                    applepup: 14,
                    songbird: 10,
                    mistfox: 8,
                },
                levelRange: [4, 6],
            },
            {
                rect: ENCOUNTER_RECTS[2],
                species: {
                    bramble_imp: 15,
                    bog_wisp: 25,
                    applepup: 20,
                    mudgrub: 20,
                    vine_adder: 10,
                    hillbuck: 10,
                },
                levelRange: [5, 7],
            },
        ],
    },
});
