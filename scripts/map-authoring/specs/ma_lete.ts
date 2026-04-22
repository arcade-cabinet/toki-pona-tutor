/**
 * beat_05_ma_lete — cold-land village.
 *
 * Stone ground with patches of grass_detail (the local tall-grass
 * key), bordered by snow-laden trees and a fenced herb garden.
 * First gym where a player without a seli creature feels real
 * friction — jan Lete's roster is heavy on lete types.
 *
 * 22×16 — bigger than ma_telo because this is a mixed beat:
 * encounters + story + gym.
 */
import { defineMap, paintRect } from '../lib/spec-helpers';
import { icePalette } from '../palettes/ice';

const WIDTH = 22;
const HEIGHT = 16;

function coldVillageBase(): string[][] {
  const grid = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill('s'));

  // Main packed snow/ice village shelf.
  for (let y = 2; y <= 12; y++) {
    for (let x = 2; x <= 19; x++) grid[y][x] = (x + y) % 7 === 0 ? 'j' : 'i';
  }

  // West entry from ma_telo and north gated path to nena_suli.
  paintRect(grid, [0, 5, 10, 3], 'd');
  paintRect(grid, [9, 4, 10, 4], 'r');
  paintRect(grid, [16, 0, 3, 5], 'r');

  // Garden shelf around jan Kasi.
  paintRect(grid, [13, 9, 6, 3], 'i');
  paintRect(grid, [13, 9, 6, 1], 'r');

  // Cold encounter grass fields below the village shelf.
  paintRect(grid, [4, 12, 5, 3], 'G');
  paintRect(grid, [12, 12, 6, 3], 'G');

  return grid;
}

export default defineMap({
  id: 'ma_lete',
  biome: 'ice',
  music_track: 'bgm_snow',
  width: WIDTH,
  height: HEIGHT,
  tileSize: 16,
  tilesets: [
    'snow/Tileset_Ground_Snow',
    'snow/Tileset_Road',
    'snow/Tileset_Snow',
    'snow/Tileset_TallGrass',
    'snow/Tileset_Fence_1_Snow',
    'snow/Objects_Buildings_Snow',
    'snow/Objects_Props_Snow',
    'snow/Objects_Rocks_Snow',
    'snow/Objects_Trees_Snow',
  ],
  palette: icePalette,
  layers: {
    'Below Player': coldVillageBase(),
    World: [
      { at: [0, 0], tile: 'house_blue' },
      { at: [6, 0], tile: 'house_red' },
      { at: [11, 6], tile: 'well_snow' },
      { at: [13, 9], tile: 'fence_h' },
      { at: [14, 9], tile: 'fence_h' },
      { at: [15, 9], tile: 'fence_h' },
      { at: [16, 9], tile: 'fence_h' },
      { at: [17, 9], tile: 'fence_h' },
      { at: [18, 9], tile: 'fence_h' },
      { at: [13, 10], tile: 'fence_v' },
      { at: [18, 10], tile: 'fence_v' },
      { at: [14, 10], tile: 'crate_snow' },
      { at: [20, 15], tile: 'tree_snow' },
      { at: [20, 12], tile: 'tree_winter' },
      { at: [1, 3], tile: 'tree_winter' },
      { at: [20, 3], tile: 'tree_snow' },
      { at: [4, 9], tile: 'bush_snow' },
      { at: [10, 8], tile: 'bush_winter' },
      { at: [19, 8], tile: 'rock_ice' },
      { at: [3, 10], tile: 'rock_snow' },
    ],
    Objects: [
      { type: 'SpawnPoint', name: 'from_ma_telo', at: [2, 6] },
      {
        type: 'NPC',
        name: 'jan-anpa',
        at: [6, 4],
        props: { id: 'jan_anpa', dialog_id: 'jan_anpa_watch' },
      },
      {
        type: 'NPC',
        name: 'jan-suno-lete',
        at: [9, 6],
        props: { id: 'jan_suno_lete', dialog_id: 'jan_suno_lete_light' },
      },
      {
        type: 'NPC',
        name: 'jan-poki-lete',
        at: [7, 8],
        props: { id: 'jan_poki_lete', dialog_id: 'jan_poki_lete_cold' },
      },
      {
        type: 'NPC',
        name: 'jan-kasi',
        at: [16, 10],
        props: { id: 'jan_kasi', dialog_id: 'jan_kasi_garden' },
      },
      {
        type: 'NPC',
        name: 'jan-lete',
        at: [17, 4],
        props: { id: 'jan_lete', dialog_id: 'jan_lete_intro' },
      },
      {
        type: 'Warp',
        name: 'warp_north',
        rect: [17, 0, 1, 1],
        props: {
          target_map: 'nena_suli',
          target_spawn: 'from_ma_lete',
          required_flag: 'badge_lete',
        },
      },
    ],
    Encounters: [
      { rect: [4, 12, 5, 3], species: { sijelo_linja: 20, sijelo_kiwen: 15, jan_pi_sewi_pimeja: 15, waso_lete: 20, soweli_nena: 15, soweli_kiwen: 15 }, levelRange: [7, 10] },
      { rect: [12, 12, 6, 3], species: { sijelo_linja: 15, sijelo_kiwen: 20, jan_pi_sewi_pimeja: 15, sijelo_utala: 15, waso_lete: 15, soweli_kiwen: 20 }, levelRange: [9, 12] },
    ],
  },
});
