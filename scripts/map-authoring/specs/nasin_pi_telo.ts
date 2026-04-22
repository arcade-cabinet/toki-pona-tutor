/**
 * beat_07_nasin_pi_telo — endgame approach.
 *
 * Long riverside route. Wide grassy west bank, deep water channel
 * down the east side, plus a sandbar crossing to the final-boss gate.
 * Heavily aquatic encounters.
 *
 * With all four region badges (the virtual aggregate gate
 * `badges_all_four`, checked from badge_sewi ∧ badge_telo ∧
 * badge_lete ∧ badge_suli), stepping onto `final_boss_trigger` fires
 * the green-dragon fight + unique death cutscene. Until all four
 * badges are in hand, that trigger is gated.
 */
import {
    defineMap,
    edgeTransitionTiles,
    paintEdgeTransitions,
    paintNeighborBuffer,
} from "../lib/spec-helpers";
import { waterPalette } from "../palettes/water";

const WIDTH = 28;
const HEIGHT = 14;

function riversideBase(): string[][] {
    const grid: string[][] = Array.from({ length: HEIGHT }, (_, y) =>
        Array.from({ length: WIDTH }, (_, x) => {
            if (y === 0 || y === HEIGHT - 1) return "f";
            if ((x + y) % 9 === 0) return "v";
            return "g";
        }),
    );

    // Deep river channel. The sandbar below keeps the route playable while
    // leaving real blocked-water tiles above and below the crossing.
    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 20; x <= 25; x++) grid[y][x] = "w";
        grid[y][19] = "s";
        grid[y][26] = "s";
        grid[y][27] = "s";
    }

    // Main west-bank walking line and a pier/sandbar to the final-boss trigger.
    for (let x = 0; x < WIDTH; x++) grid[5][x] = "d";
    for (let x = 0; x < 20; x++) grid[6][x] = "d";
    for (let y = 4; y <= 7; y++) {
        for (let x = 20; x <= 27; x++) grid[y][x] = "d";
    }

    // Encounter grass matches the authored encounter rectangles.
    for (let y = 10; y <= 12; y++) {
        for (let x = 4; x <= 8; x++) grid[y][x] = "G";
        for (let x = 14; x <= 19; x++) grid[y][x] = "G";
    }

    paintNeighborBuffer(grid, {
        base: "w",
        neighbors: "d",
        buffer: "s",
    });
    paintEdgeTransitions(grid, {
        base: ["g", "f", "v"],
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
    id: "nasin_pi_telo",
    biome: "water",
    music_track: "bgm_water",
    width: WIDTH,
    height: HEIGHT,
    tileSize: 16,
    tilesets: [
        "seasons/Tileset_Ground_Seasons",
        "seasons/Tileset_Road",
        "seasons/Tileset_Sand",
        "seasons/Tileset_TallGrass",
        "seasons/Tileset_Water",
        "generated/Tileset_Water_Shore_Seasons",
    ],
    palette: waterPalette,
    layers: {
        "Below Player": riversideBase(),
        Objects: [
            { type: "SpawnPoint", name: "from_nena_suli", at: [2, 6] },
            {
                type: "NPC",
                name: "jan-kala-lili",
                at: [7, 9],
                props: { id: "jan_kala_lili", dialog_id: "jan_kala_lili_flavor" },
            },
            {
                type: "NPC",
                name: "jan-moku-pona",
                at: [12, 5],
                props: { id: "jan_moku_pona", dialog_id: "jan_moku_pona_grill" },
            },
            {
                type: "NPC",
                name: "jan-kala-suli",
                at: [17, 9],
                props: { id: "jan_kala_suli", dialog_id: "jan_kala_suli_tuneup" },
            },
            {
                type: "NPC",
                name: "jan-olin-telo",
                at: [22, 5],
                props: { id: "jan_olin_telo", dialog_id: "jan_olin_telo_quiet" },
            },
            {
                type: "NPC",
                name: "jan-suno-telo",
                at: [24, 6],
                props: { id: "jan_suno_telo", dialog_id: "jan_suno_telo_last" },
            },
            {
                type: "Trigger",
                name: "final_boss_trigger",
                rect: [26, 5, 2, 3],
                props: {
                    target_event: "green_dragon",
                    required_flag: "badges_all_four",
                },
            },
        ],
        Encounters: [
            {
                rect: [4, 10, 5, 3],
                species: {
                    jan_moli: 20,
                    kon_moli: 15,
                    telo_jaki: 15,
                    kala_telo: 15,
                    kala_uta: 15,
                    kala_tomo: 15,
                    jan_moli_wawa: 5,
                },
                levelRange: [7, 10],
            },
            {
                rect: [14, 10, 6, 3],
                species: {
                    jan_moli: 14,
                    kon_moli: 14,
                    telo_jaki: 14,
                    kala_telo: 14,
                    kala_luka: 14,
                    kala_uta: 14,
                    seli_moli: 6,
                    akesi_suli: 4,
                    akesi_sewi: 2,
                },
                levelRange: [9, 13],
            },
        ],
    },
});
