/**
 * beat_03_nena_sewi — mountain pass.
 *
 * Stone footpaths between rocks; the second-region hiking route.
 * Encounters skew rocky-elite (jan_wawa, jan_wawa_linja, sijelo_kiwen)
 * in the level 6-9 band. jan Kala the hiker sits along the path; at
 * the upper shrine jan Wawa blocks the northern warp with a
 * two-creature gym fight.
 *
 * 32×14 — slightly taller than nasin_wan to suggest vertical travel.
 */
import { defineMap, paintRect } from '../lib/spec-helpers';
import { collectionAtlasTileset } from '../config/collection-atlases';
import { mountainPalette } from '../palettes/mountain';

const WIDTH = 32;
const HEIGHT = 14;

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

  // Encounter grass clumps from the authored encounter rectangles.
  paintRect(grid, [4, 4, 4, 2], 'G');
  paintRect(grid, [14, 10, 6, 3], 'G');

  return grid;
}

export default defineMap({
  id: 'nena_sewi',
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
      { type: 'SpawnPoint', name: 'from_nasin_wan', at: [1, 7] },
      {
        type: 'NPC',
        name: 'jan-kiwen',
        at: [4, 8],
        props: { id: 'jan_kiwen', dialog_id: 'jan_kiwen_mountain' },
      },
      {
        type: 'NPC',
        name: 'jan-kala',
        at: [10, 8],
        props: { id: 'jan_kala', dialog_id: 'jan_kala_rest' },
      },
      {
        type: 'NPC',
        name: 'jan-waso-sewi',
        at: [16, 6],
        props: { id: 'jan_waso_sewi', dialog_id: 'jan_waso_sewi_sky' },
      },
      {
        type: 'NPC',
        name: 'jan-nasin-sewi',
        at: [22, 5],
        props: { id: 'jan_nasin_sewi', dialog_id: 'jan_nasin_sewi_path' },
      },
      {
        type: 'NPC',
        name: 'jan-wawa',
        at: [24, 3],
        props: { id: 'jan_wawa', dialog_id: 'jan_wawa_intro' },
      },
      {
        type: 'Warp',
        name: 'warp_north',
        rect: [24, 0, 1, 1],
        props: {
          target_map: 'ma_telo',
          target_spawn: 'from_nena_sewi',
          required_flag: 'badge_sewi',
        },
      },
    ],
    Encounters: [
      { rect: [4, 4, 4, 2], species: { jan_wawa: 25, jan_wawa_linja: 20, sijelo_kiwen: 15, soweli_palisa: 15, waso_lape: 15, akesi_seli: 10 }, levelRange: [6, 8] },
      { rect: [14, 10, 6, 3], species: { jan_wawa: 18, jan_wawa_linja: 18, jan_wawa_jaki: 14, sijelo_kiwen: 18, soweli_sewi: 12, waso_lape: 12, soweli_palisa: 8 }, levelRange: [7, 9] },
    ],
  },
});
