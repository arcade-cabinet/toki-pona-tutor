/**
 * beat_06_dreadpeak_cavern — the great peak.
 *
 * Hardest gym before endgame. Tall narrow cave-shrine map, stone
 * everywhere, sparse encounter overgrowth around rocky outcrops.
 * Vertical traversal corridor suggested by the 16×20 aspect ratio.
 *
 * Encounters are heavy birds and the bear at higher levels than
 * any earlier route. jan Suli's fight is the "you are ready" moment.
 */
import { defineMap, emptyGrid, paintRect } from '../lib/spec-helpers';
import { cavePalette } from '../palettes/cave';

const WIDTH = 16;
const HEIGHT = 20;
const ENCOUNTER_RECTS: Array<[number, number, number, number]> = [
  [3, 15, 4, 3],
  [10, 12, 4, 3],
];

function caveBase(): string[][] {
  const grid = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill('w'));

  // Lower approach from frostvale.
  paintRect(grid, [1, 11, 7, 7], 'f');
  paintRect(grid, [9, 11, 6, 5], 'f');
  paintRect(grid, [6, 10, 5, 3], 'f');

  // Middle rest chamber and upper shrine.
  paintRect(grid, [4, 6, 8, 5], 'f');
  paintRect(grid, [6, 3, 6, 4], 'p');
  paintRect(grid, [5, 1, 7, 4], 'p');
  paintRect(grid, [7, 0, 3, 3], 'p');

  // Variation on the shrine approach.
  for (let y = 2; y <= 5; y++) {
    for (let x = 7; x <= 10; x++) if ((x + y) % 3 === 0) grid[y][x] = 'v';
  }

  return grid;
}

function encounterDetail(): string[][] {
  const grid = emptyGrid(WIDTH, HEIGHT);
  for (const rect of ENCOUNTER_RECTS) paintRect(grid, rect, 'G');
  return grid;
}

export default defineMap({
  id: 'dreadpeak_cavern',
  biome: 'cave',
  music_track: 'bgm_mountain',
  width: WIDTH,
  height: HEIGHT,
  tileSize: 16,
  tilesets: [
    'fortress/Castle_Floor',
    'fortress/Tileset_RockSlope',
    'fortress/Tileset_Castle_Grass',
    'fortress/Animation_Torch_1',
  ],
  palette: cavePalette,
  layers: {
    'Below Player': caveBase(),
    'Ground Detail': encounterDetail(),
    World: [
      { at: [1, 11], tile: 'torch' },
      { at: [14, 11], tile: 'torch' },
      { at: [4, 7], tile: 'torch_wall' },
      { at: [11, 7], tile: 'torch_wall' },
      { at: [6, 3], tile: 'torch_wall' },
      { at: [11, 3], tile: 'torch_wall' },
    ],
    Objects: [
      { type: 'SpawnPoint', name: 'from_frostvale', at: [2, 12] },
      {
        type: 'NPC',
        name: 'jan-kiwen-suli',
        at: [3, 12],
        props: { id: 'graym', dialog_id: 'graym_cave' },
      },
      {
        type: 'NPC',
        name: 'jan-pi-kon',
        at: [5, 10],
        props: { id: 'meadow', dialog_id: 'meadow_meditate' },
      },
      {
        type: 'NPC',
        name: 'jan-pimeja-suli',
        at: [7, 8],
        props: { id: 'ember', dialog_id: 'ember_torch' },
      },
      {
        type: 'NPC',
        name: 'jan-pi-nasin',
        at: [10, 7],
        props: { id: 'rowan', dialog_id: 'rowan_ask' },
      },
      {
        type: 'NPC',
        name: 'jan-suli',
        at: [8, 2],
        props: { id: 'cliff', dialog_id: 'cliff_intro' },
      },
      {
        type: 'Warp',
        name: 'warp_north',
        rect: [8, 0, 1, 1],
        props: {
          target_map: 'rivergate_approach',
          target_spawn: 'from_dreadpeak_cavern',
          required_flag: 'badge_dreadpeak',
        },
      },
    ],
    Encounters: [
      { rect: ENCOUNTER_RECTS[0], species: { mountain_bear: 22, warback: 18, fangrunner: 12, glacier_talon: 18, coalbeak: 12, raven_shade: 12, snowhare: 6 }, levelRange: [10, 13] },
      { rect: ENCOUNTER_RECTS[1], species: { mountain_bear: 18, warback: 18, stoneclaw: 6, glacier_talon: 22, coalbeak: 14, foxhound: 14, boulderhorn: 8 }, levelRange: [12, 15] },
    ],
  },
});
