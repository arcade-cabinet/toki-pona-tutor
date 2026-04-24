/**
 * beat_05_frostvale — cold-land village.
 *
 * Stone ground with patches of grass_detail (the local tall-grass
 * key), bordered by snow-laden trees and a fenced herb garden.
 * First gym where a player without a seli creature feels real
 * friction — jan Lete's roster is heavy on lete types.
 *
 * 22×16 — bigger than lakehaven because this is a mixed beat:
 * encounters + story + gym.
 */
import { defineMap, emptyGrid, paintRect } from '../lib/spec-helpers';
import { collectionAtlasTileset } from '../config/collection-atlases';
import { icePalette } from '../palettes/ice';

const WIDTH = 22;
const HEIGHT = 16;
const ENCOUNTER_RECTS: Array<[number, number, number, number]> = [
  [4, 12, 5, 3],
  [12, 12, 6, 3],
];

function coldVillageBase(): string[][] {
  const grid = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill('s'));

  // Main packed snow/ice village shelf.
  for (let y = 2; y <= 12; y++) {
    for (let x = 2; x <= 19; x++) grid[y][x] = (x + y) % 7 === 0 ? 'j' : 'i';
  }

  // West entry from lakehaven and north gated path to dreadpeak_cavern.
  paintRect(grid, [0, 5, 10, 3], 'd');
  paintRect(grid, [9, 4, 10, 4], 'r');
  paintRect(grid, [16, 0, 3, 5], 'r');

  // Garden shelf around jan Kasi.
  paintRect(grid, [13, 9, 6, 3], 'i');
  paintRect(grid, [13, 9, 6, 1], 'r');

  return grid;
}

function encounterDetail(): string[][] {
  const grid = emptyGrid(WIDTH, HEIGHT);
  for (const rect of ENCOUNTER_RECTS) paintRect(grid, rect, 'G');
  return grid;
}

export default defineMap({
  id: 'frostvale',
  biome: 'ice',
  music_track: 'bgm_snow',
  width: WIDTH,
  height: HEIGHT,
  tileSize: 16,
  tilesets: [
    'snow/Tileset_Ground_Snow',
    'snow/Tileset_Road',
    'snow/Tileset_Snow',
    'snow/Tileset_Fence_1_Snow',
    collectionAtlasTileset('snow/Objects_Buildings_Snow'),
    collectionAtlasTileset('snow/Objects_Props_Snow'),
    collectionAtlasTileset('snow/Objects_Rocks_Snow'),
    collectionAtlasTileset('snow/Objects_Trees_Snow'),
  ],
  palette: icePalette,
  layers: {
    'Below Player': coldVillageBase(),
    'Ground Detail': encounterDetail(),
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
      { type: 'SpawnPoint', name: 'from_lakehaven', at: [2, 6] },
      {
        type: 'NPC',
        name: 'jan-anpa',
        at: [6, 4],
        props: { id: 'corvin', dialog_id: 'corvin_watch' },
      },
      {
        type: 'NPC',
        name: 'jan-suno-lete',
        at: [9, 6],
        props: { id: 'luma', dialog_id: 'luma_light' },
      },
      {
        type: 'NPC',
        name: 'jan-poki-lete',
        at: [7, 8],
        props: { id: 'brindle', dialog_id: 'brindle_cold' },
      },
      {
        type: 'NPC',
        name: 'jan-kasi',
        at: [16, 10],
        props: { id: 'hollis', dialog_id: 'hollis_garden' },
      },
      {
        type: 'NPC',
        name: 'jan-lete',
        at: [17, 4],
        props: { id: 'frost', dialog_id: 'frost_intro' },
      },
      {
        type: 'Warp',
        name: 'warp_north',
        rect: [17, 0, 1, 1],
        props: {
          target_map: 'dreadpeak_cavern',
          target_spawn: 'from_frostvale',
          required_flag: 'badge_lete',
        },
      },
    ],
    Encounters: [
      { rect: ENCOUNTER_RECTS[0], species: { frostcoil: 20, quartz_shell: 15, nightspike: 15, snowbird: 20, hillbuck: 15, pebbleback: 15 }, levelRange: [7, 10] },
      { rect: ENCOUNTER_RECTS[1], species: { frostcoil: 15, quartz_shell: 20, nightspike: 15, glacier_talon: 15, snowbird: 15, pebbleback: 20 }, levelRange: [9, 12] },
    ],
  },
});
