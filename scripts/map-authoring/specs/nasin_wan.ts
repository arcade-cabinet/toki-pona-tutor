/**
 * beat_02_nasin_wan — path-route east of the starter village.
 *
 * 32×12 grass corridor with three tall-grass encounter zones (the
 * player's first chance to throw a poki_lili) and jan Ike the rival
 * at the east edge. The warp east to nena_sewi is gated on
 * `jan_ike_defeated`.
 *
 * Encounter rosters come from journey.json beat 2; species listed
 * here are the level-3-7 band from that narrative (pipi_kon, akesi_ma,
 * kala_lili).
 */
import { defineMap } from '../lib/spec-helpers';
import { corePalette } from '../palettes/core';

const g = 'g';

export default defineMap({
  id: 'nasin_wan',
  width: 32,
  height: 12,
  tileSize: 16,
  tilesets: ['core/Tileset_Ground'],
  palette: corePalette,
  layers: {
    'Below Player': Array.from({ length: 12 }, () => Array(32).fill(g)),
    Objects: [
      { type: 'SpawnPoint', name: 'from_tomo', at: [1, 5] },
      {
        type: 'NPC',
        name: 'jan-ike',
        at: [28, 5],
        props: { id: 'jan_ike', dialog_id: 'jan_ike_rival' },
      },
      {
        type: 'Warp',
        name: 'warp_east',
        rect: [31, 5, 1, 1],
        props: {
          target_map: 'nena_sewi',
          target_spawn: 'from_nasin_wan',
          required_flag: 'jan_ike_defeated',
        },
      },
    ],
    Encounters: [
      { rect: [6, 3, 4, 2], species: { pipi_kon: 40, akesi_ma: 35, kala_lili: 25 }, levelRange: [3, 5] },
      { rect: [14, 6, 5, 2], species: { pipi_kon: 30, akesi_ma: 40, kala_lili: 30 }, levelRange: [4, 6] },
      { rect: [22, 3, 4, 2], species: { pipi_kon: 25, akesi_ma: 30, kala_lili: 45 }, levelRange: [5, 7] },
    ],
  },
});
