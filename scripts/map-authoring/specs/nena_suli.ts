/**
 * beat_06_nena_suli — the great peak.
 *
 * Hardest gym before endgame. Tall narrow map, stone everywhere
 * (placeholder grass for now), sparse tall-grass patches around
 * rocky outcrops. Vertical traversal corridor suggested by the
 * 16×20 aspect ratio.
 *
 * Encounters are heavy birds and the bear at higher levels than
 * any earlier route. jan Suli's fight is the "you are ready" moment.
 */
import { defineMap } from '../lib/spec-helpers';
import { corePalette } from '../palettes/core';

const g = 'g';

export default defineMap({
  id: 'nena_suli',
  width: 16,
  height: 20,
  tileSize: 16,
  tilesets: ['core/Tileset_Ground'],
  palette: corePalette,
  layers: {
    'Below Player': Array.from({ length: 20 }, () => Array(16).fill(g)),
    Objects: [
      { type: 'SpawnPoint', name: 'from_ma_lete', at: [2, 12] },
      {
        type: 'NPC',
        name: 'jan-pi-kon',
        at: [5, 10],
        props: { id: 'jan_pi_kon', dialog_id: 'jan_pi_kon_meditate' },
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
      { rect: [3, 15, 4, 3], species: { jan_wawa_suli: 25, jan_wawa_utala: 20, sijelo_utala: 20, waso_moku: 15, waso_moli: 15, soweli_sewi: 5 }, levelRange: [10, 13] },
      { rect: [10, 12, 4, 3], species: { jan_wawa_suli: 20, jan_wawa_utala: 20, sijelo_utala: 25, waso_moku: 15, soweli_alasa: 15, soweli_wawa: 5 }, levelRange: [12, 15] },
    ],
  },
});
