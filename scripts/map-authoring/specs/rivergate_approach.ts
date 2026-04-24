/**
 * beat_07_rivergate_approach — endgame approach.
 *
 * Long riverside route. Wide grassy west bank, deep water channel
 * down the east side, plus a sandbar crossing to the final-boss gate.
 * Heavily aquatic encounters.
 *
 * With all four region badges (the virtual aggregate gate
 * `badges_all_four`, checked from badge_highridge ∧ badge_lakehaven ∧
 * badge_frostvale ∧ badge_dreadpeak), stepping onto `final_boss_trigger` fires
 * the green-dragon fight + unique death cutscene. Until all four
 * badges are in hand, that trigger is gated.
 */
import {
    defineMap,
    edgeTransitionTiles,
    emptyGrid,
    paintEdgeTransitions,
    paintNeighborBuffer,
    paintRect,
} from "../lib/spec-helpers";
import { waterPalette } from "../palettes/water";

const WIDTH = 28;
const HEIGHT = 14;
const ENCOUNTER_RECTS: Array<[number, number, number, number]> = [
    [4, 10, 5, 3],
    [14, 10, 6, 3],
];

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

function encounterDetail(): string[][] {
    const grid = emptyGrid(WIDTH, HEIGHT);
    for (const rect of ENCOUNTER_RECTS) paintRect(grid, rect, "G");
    return grid;
}

export default defineMap({
    id: "rivergate_approach",
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
        "Ground Detail": encounterDetail(),
        Objects: [
            { type: "SpawnPoint", name: "from_dreadpeak_cavern", at: [2, 6] },
            {
                type: "NPC",
                name: "jan-kala-lili",
                at: [7, 9],
                props: { id: "lily", dialog_id: "lily_flavor" },
            },
            {
                type: "NPC",
                name: "jan-moku-pona",
                at: [12, 5],
                props: { id: "grill", dialog_id: "grill_pona" },
            },
            {
                type: "NPC",
                name: "jan-kala-suli",
                at: [17, 9],
                props: { id: "cormorant", dialog_id: "cormorant_tuneup" },
            },
            {
                type: "NPC",
                name: "jan-olin-telo",
                at: [22, 5],
                props: { id: "myra", dialog_id: "myra_quiet" },
            },
            {
                type: "NPC",
                name: "jan-suno-telo",
                at: [24, 6],
                props: { id: "sola", dialog_id: "sola_last" },
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
                rect: ENCOUNTER_RECTS[0],
                species: {
                    bog_wisp: 20,
                    ashcat: 15,
                    mireling: 15,
                    bluefin: 15,
                    snapper: 15,
                    reedfrog: 15,
                    iron_wraith: 5,
                },
                levelRange: [7, 10],
            },
            {
                rect: ENCOUNTER_RECTS[1],
                species: {
                    bog_wisp: 14,
                    ashcat: 14,
                    mireling: 14,
                    bluefin: 14,
                    riverfin: 14,
                    snapper: 14,
                    cinderling: 6,
                    marshjaw: 4,
                    green_dragon: 2,
                },
                levelRange: [9, 13],
            },
        ],
    },
});
