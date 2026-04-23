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
 *
 * T11-03: adds collection-atlas tree/bush decor along the map borders.
 * Prior version left the edge cells as raw `grass_dark` which rendered
 * as harsh black-edged rectangles against the green interior (visible
 * in the 1.0 onboarding capture). Trees now frame the village the way
 * the greenwood_road map does, giving the starter area visual life.
 */
import {
    defineMap,
    edgeTransitionTiles,
    paintEdgeTransitions,
    paintRect,
} from "../lib/spec-helpers";
import { collectionAtlasTileset } from "../config/collection-atlases";
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

    // Main east-west dirt road — the only structural dirt path.
    paintRect(grid, [0, 5, WIDTH, 2], "d");
    // jan Sewi's approach, extending the road north at (9-12, 4-6).
    // The mentor stands at (10, 6); widening the road here makes the
    // ceremony feel like it happens at the village centre.
    paintRect(grid, [9, 4, 4, 3], "d");
    // T11-04: removed the orphan plot previously at [2, 7, 4, 2].
    // It rendered as an unexplained brown square south of the path
    // with no NPC sitting on it (jan-telo-well and jan-kili-tomo
    // stand on its edges, not its centre) and no narrative purpose.
    // The village reads cleaner with one road and one mentor plaza.

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
    tilesets: [
        "seasons/Tileset_Ground_Seasons",
        "seasons/Tileset_Road",
        collectionAtlasTileset("seasons/Objects_Trees_Seasons"),
    ],
    palette: forestPalette,
    layers: {
        "Below Player": starterVillageBase(),
        // World layer places collection-atlas tree/bush sprites around
        // the village perimeter. Positions avoid the dirt road, the
        // NPCs, the spawn point, and the east warp tile; they cluster
        // near the corners to frame the composition without crowding
        // the playable area.
        World: [
            { at: [1, 1], tile: "tree_a" },
            { at: [4, 1], tile: "tree_b" },
            { at: [7, 1], tile: "tree_c" },
            { at: [11, 1], tile: "tree_wide" },
            { at: [14, 1], tile: "tree_a" },
            { at: [1, 3], tile: "bush_a" },
            { at: [13, 2], tile: "bush_leaf" },
            { at: [1, 10], tile: "tree_a" },
            { at: [6, 10], tile: "tree_b" },
            { at: [8, 10], tile: "bush_b" },
            { at: [12, 10], tile: "tree_c" },
            { at: [14, 10], tile: "tree_a" },
        ],
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
