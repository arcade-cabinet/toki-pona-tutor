/**
 * beat_03_highridge_pass — mountain pass.
 *
 * Stone footpaths between rocks; the second-region hiking route.
 * Encounters skew rocky-elite (tarrin, chainback, quartz_shell)
 * in the level 6-9 band. jan Kala the hiker sits along the path; at
 * the upper shrine jan Wawa blocks the northern warp with a
 * two-creature gym fight.
 *
 * 32×14 — slightly taller than greenwood_road to suggest vertical travel.
 */
import { defineMap, emptyGrid, paintRect } from '../lib/spec-helpers';
import { collectionAtlasTileset } from '../config/collection-atlases';
import { mountainPalette } from '../palettes/mountain';

const WIDTH = 32;
const HEIGHT = 14;
const ENCOUNTER_RECTS: Array<[number, number, number, number]> = [
  [4, 4, 4, 2],
  [14, 10, 6, 3],
];

function fillHighland(grid: string[][], rect: [number, number, number, number]): void {
  const [x0, y0, w, h] = rect;
  for (let y = y0; y < y0 + h; y++) {
    for (let x = x0; x < x0 + w; x++) grid[y][x] = (x + y) % 6 === 0 ? 'v' : 'g';
  }
}

function mountainPassBase(): string[][] {
  const grid = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill('c'));

  // Walkable highland shelves cut through otherwise blocked cliff paint.
  fillHighland(grid, [0, 5, 12, 5]);
  fillHighland(grid, ENCOUNTER_RECTS[0]);
  fillHighland(grid, [8, 3, 8, 5]);
  fillHighland(grid, [13, 8, 9, 5]);
  fillHighland(grid, [19, 4, 8, 5]);
  fillHighland(grid, [22, 1, 6, 5]);

  // West-to-north trail.
  paintRect(grid, [0, 6, 12, 3], 'd');
  paintRect(grid, [8, 5, 9, 2], 'd');
  paintRect(grid, [16, 6, 8, 2], 'p');
  paintRect(grid, [23, 2, 4, 4], 'p');
  paintRect(grid, [23, 0, 3, 3], 'p');

  return grid;
}

function encounterDetail(): string[][] {
  const grid = emptyGrid(WIDTH, HEIGHT);
  for (const rect of ENCOUNTER_RECTS) paintRect(grid, rect, 'G');
  return grid;
}

export default defineMap({
  id: 'highridge_pass',
  biome: 'peak',
  music_track: 'bgm_mountain',
  width: WIDTH,
  height: HEIGHT,
  tileSize: 16,
  tilesets: [
    'seasons/Tileset_Ground_Seasons',
    'seasons/Tileset_Road',
    'seasons/Tileset_TallGrass',
    'seasons/Tileset_RockSlope_2_Gray',
    collectionAtlasTileset('seasons/Objects_Rocks_Seasons'),
    collectionAtlasTileset('seasons/Objects_Trees_Seasons'),
  ],
  palette: mountainPalette,
  layers: {
    'Below Player': mountainPassBase(),
    'Ground Detail': encounterDetail(),
    World: [
      { at: [2, 2], tile: 'tree_high' },
      { at: [29, 8], tile: 'tree_low' },
      { at: [6, 10], tile: 'bush_high' },
      { at: [20, 10], tile: 'bush_high' },
      { at: [13, 2], tile: 'rock_tall' },
      { at: [18, 3], tile: 'rock_small' },
      { at: [27, 6], tile: 'rock_tall' },
      { at: [11, 10], tile: 'rock_grass' },
      { at: [29, 2], tile: 'rock_small' },
    ],
    Objects: [
      { type: 'SpawnPoint', name: 'from_greenwood_road', at: [1, 7] },
      {
        type: 'NPC',
        name: 'jan-kiwen',
        at: [4, 8],
        props: { id: 'boulder', dialog_id: 'boulder_mountain' },
      },
      {
        type: 'NPC',
        name: 'jan-kala',
        at: [10, 8],
        props: { id: 'angler', dialog_id: 'angler_rest' },
      },
      {
        type: 'NPC',
        name: 'jan-waso-sewi',
        at: [16, 6],
        props: { id: 'kestrel', dialog_id: 'kestrel_sky' },
      },
      {
        type: 'NPC',
        name: 'jan-nasin-sewi',
        at: [22, 5],
        props: { id: 'marsha', dialog_id: 'marsha_path' },
      },
      {
        type: 'NPC',
        name: 'jan-wawa',
        at: [24, 3],
        props: { id: 'tarrin', dialog_id: 'tarrin_intro' },
      },
      {
        type: 'Warp',
        name: 'warp_north',
        rect: [24, 0, 1, 1],
        props: {
          target_map: 'lakehaven',
          target_spawn: 'from_highridge_pass',
          required_flag: 'badge_highridge',
        },
      },
    ],
    Encounters: [
      { rect: ENCOUNTER_RECTS[0], species: { tarrin: 25, chainback: 20, quartz_shell: 15, twiglet: 15, drowsy_owl: 15, ember_adder: 10 }, levelRange: [6, 8] },
      { rect: ENCOUNTER_RECTS[1], species: { tarrin: 18, chainback: 18, mire_brute: 14, quartz_shell: 18, snowhare: 12, drowsy_owl: 12, twiglet: 8 }, levelRange: [7, 9] },
    ],
  },
});
