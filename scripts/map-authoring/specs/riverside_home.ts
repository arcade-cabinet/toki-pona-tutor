/**
 * beat_01_riverside_home — starter village.
 *
 * Compact 16×12 starter village green for the pivot: jan Sewi stands near
 * center (triggers the starter ceremony); a warp object on the east edge
 * points at greenwood_road but is gated on the `starter_chosen` flag by the
 * runtime Warp() event (src/modules/main/warp.ts).
 *
 * The village now carries the T4-15 floor of five authored NPCs:
 * jan Sewi plus four ambient villagers around the home plot.
 */
import {
    defineMap,
    edgeTransitionTiles,
    paintEdgeTransitions,
    paintRect,
} from "../lib/spec-helpers";
import { forestPalette } from "../palettes/forest";

const WIDTH = 16;
const HEIGHT = 12;

function starterVillageBase(): string[][] {
    const grid = Array.from({ length: HEIGHT }, (_, y) =>
        Array.from({ length: WIDTH }, (_, x) => {
            if (y === 0 || y === HEIGHT - 1 || x === 0 || x === WIDTH - 1) return "f";
            return (x + y) % 9 === 0 ? "v" : "g";
        }),
    );

    paintRect(grid, [0, 5, WIDTH, 2], "d");
    paintRect(grid, [2, 7, 4, 2], "d");
    paintRect(grid, [9, 4, 4, 3], "d");

    paintEdgeTransitions(grid, {
        base: ["g", "f", "v"],
        neighbors: "d",
        transitions: edgeTransitionTiles("gd"),
    });

    return grid;
}

export default defineMap({
    id: "riverside_home",
    biome: "town",
    music_track: "bgm_village",
    width: WIDTH,
    height: HEIGHT,
    tileSize: 16,
    tilesets: ["seasons/Tileset_Ground_Seasons", "seasons/Tileset_Road"],
    palette: forestPalette,
    layers: {
        "Below Player": starterVillageBase(),
        Objects: [
            { type: "SpawnPoint", name: "default", at: [7, 5] },
            {
                type: "NPC",
                name: "jan-pona-tomo",
                at: [4, 5],
                props: { id: "jan_pona_tomo", dialog_id: "jan_pona_tomo_welcome" },
            },
            {
                type: "NPC",
                name: "jan-telo-well",
                at: [3, 8],
                props: { id: "jan_telo_well", dialog_id: "jan_telo_well_water" },
            },
            {
                type: "NPC",
                name: "jan-sewi",
                at: [10, 6],
                props: { id: "jan_sewi", dialog_id: "jan_sewi_starter_intro" },
            },
            {
                type: "NPC",
                name: "jan-poki-tomo",
                at: [3, 5],
                props: { id: "jan_poki_tomo", dialog_id: "jan_poki_tomo_ready" },
            },
            {
                type: "NPC",
                name: "jan-kili-tomo",
                at: [4, 8],
                props: { id: "jan_kili_tomo", dialog_id: "jan_kili_tomo_snack" },
            },
            {
                type: "Warp",
                name: "warp_east",
                rect: [15, 5, 1, 1],
                props: {
                    target_map: "greenwood_road",
                    target_spawn: "from_tomo",
                    required_flag: "starter_chosen",
                },
            },
        ],
    },
});
