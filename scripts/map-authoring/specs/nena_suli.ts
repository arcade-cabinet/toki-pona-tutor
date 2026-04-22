/**
 * beat_06_nena_suli — the great peak.
 *
 * Hardest gym before endgame. Tall narrow cave-shrine map, stone
 * everywhere, sparse encounter overgrowth around rocky outcrops.
 * Vertical traversal corridor suggested by the 16×20 aspect ratio.
 *
 * Encounters are heavy birds and the bear at higher levels than
 * any earlier route. jan Suli's fight is the "you are ready" moment.
 */
import { defineMap } from '../lib/spec-helpers';
import { cavePalette } from '../palettes/cave';

const WIDTH = 16;
const HEIGHT = 20;

function paintRect(grid: string[][], rect: [number, number, number, number], tile: string): void {
  const [x, y, w, h] = rect;
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) grid[yy][xx] = tile;
  }
}

function caveBase(): string[][] {
  const grid = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill('w'));

  // Lower approach from ma_lete.
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

  // Encounter patches from the authored encounter rectangles.
  paintRect(grid, [3, 15, 4, 3], 'G');
  paintRect(grid, [10, 12, 4, 3], 'G');

  return grid;
}

export default defineMap({
  id: 'nena_suli',
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
    World: [
      { at: [1, 11], tile: 'torch' },
      { at: [14, 11], tile: 'torch' },
      { at: [4, 7], tile: 'torch_wall' },
      { at: [11, 7], tile: 'torch_wall' },
      { at: [6, 3], tile: 'torch_wall' },
      { at: [11, 3], tile: 'torch_wall' },
    ],
    Objects: [
      { type: 'SpawnPoint', name: 'from_ma_lete', at: [2, 12] },
      {
        type: 'NPC',
        name: 'jan-kiwen-suli',
        at: [3, 12],
        props: { id: 'jan_kiwen_suli', dialog_id: 'jan_kiwen_suli_cave' },
      },
      {
        type: 'NPC',
        name: 'jan-pi-kon',
        at: [5, 10],
        props: { id: 'jan_pi_kon', dialog_id: 'jan_pi_kon_meditate' },
      },
      {
        type: 'NPC',
        name: 'jan-pimeja-suli',
        at: [7, 8],
        props: { id: 'jan_pimeja_suli', dialog_id: 'jan_pimeja_suli_torch' },
      },
      {
        type: 'NPC',
        name: 'jan-pi-nasin',
        at: [10, 7],
        props: { id: 'jan_pi_nasin', dialog_id: 'jan_pi_nasin_ask' },
      },
      {
        type: 'NPC',
        name: 'jan-suli',
        at: [8, 2],
        props: { id: 'jan_suli', dialog_id: 'jan_suli_intro' },
      },
      {
        type: 'Warp',
        name: 'warp_north',
        rect: [8, 0, 1, 1],
        props: {
          target_map: 'nasin_pi_telo',
          target_spawn: 'from_nena_suli',
          required_flag: 'badge_suli',
        },
      },
    ],
    Encounters: [
      { rect: [3, 15, 4, 3], species: { jan_wawa_suli: 22, jan_wawa_utala: 18, soweli_utala: 12, sijelo_utala: 18, waso_moku: 12, waso_moli: 12, soweli_sewi: 6 }, levelRange: [10, 13] },
      { rect: [10, 12, 4, 3], species: { jan_wawa_suli: 18, jan_wawa_utala: 18, jan_utala_suli: 6, sijelo_utala: 22, waso_moku: 14, soweli_alasa: 14, soweli_wawa: 8 }, levelRange: [12, 15] },
    ],
  },
});
