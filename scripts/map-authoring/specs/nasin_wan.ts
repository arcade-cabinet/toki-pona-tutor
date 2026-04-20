/**
 * beat_02_nasin_wan — path-route east of the starter village.
 *
 * 32×12 grass corridor with three tall-grass encounter zones (the
 * player's first chance to throw a poki_lili) and jan Ike the rival
 * at the east edge. The warp east to nena_sewi is gated on
 * `jan_ike_defeated`.
 *
 * Encounter rosters come from journey.json beat 2; species listed
 * here are the level-3-7 band from that narrative (jan_ike_lili,
 * jan_utala_lili, jan_moli).
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
      { rect: [6, 3, 4, 2], species: { jan_ike_lili: 40, jan_utala_lili: 35, jan_moli: 25 }, levelRange: [3, 5] },
      { rect: [14, 6, 5, 2], species: { jan_ike_lili: 30, jan_utala_lili: 40, jan_moli: 30 }, levelRange: [4, 6] },
      { rect: [22, 3, 4, 2], species: { jan_ike_lili: 25, jan_utala_lili: 30, jan_moli: 45 }, levelRange: [5, 7] },
    ],
  },
});
