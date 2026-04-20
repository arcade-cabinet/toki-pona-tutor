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
import { defineMap } from '../lib/spec-helpers';
import { corePalette } from '../palettes/core';

const g = 'g';

export default defineMap({
  id: 'ma_lete',
  width: 22,
  height: 16,
  tileSize: 16,
  tilesets: ['core/Tileset_Ground'],
  palette: corePalette,
  layers: {
    'Below Player': Array.from({ length: 16 }, () => Array(22).fill(g)),
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
        name: 'jan-kasi',
        at: [15, 10],
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
      { rect: [4, 12, 5, 3], species: { sijelo_linja: 35, sijelo_kiwen: 25, jan_pi_sewi_pimeja: 20, sijelo_utala: 20 }, levelRange: [7, 10] },
      { rect: [12, 12, 6, 3], species: { sijelo_linja: 30, sijelo_kiwen: 35, jan_pi_sewi_pimeja: 15, sijelo_utala: 20 }, levelRange: [9, 12] },
    ],
  },
});
