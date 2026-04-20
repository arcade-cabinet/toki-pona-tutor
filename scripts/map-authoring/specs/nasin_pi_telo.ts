/**
 * beat_07_nasin_pi_telo — endgame approach.
 *
 * Long riverside route. Wide grassy west bank, deep water channel
 * down the east side (placeholder grass for now — water tile lands
 * with palette v2). Heavily aquatic encounters.
 *
 * With all four region badges (flag `badges_all_four` — set by the
 * journey engine once badge_sewi ∧ badge_telo ∧ badge_lete ∧
 * badge_suli are true, tracked in V15 follow-up), stepping onto
 * `final_boss_trigger` fires the green-dragon fight + unique death
 * cutscene. Until all four badges are in hand, that warp is gated.
 */
import { defineMap } from '../lib/spec-helpers';
import { corePalette } from '../palettes/core';

const g = 'g';

export default defineMap({
  id: 'nasin_pi_telo',
  width: 28,
  height: 14,
  tileSize: 16,
  tilesets: ['core/Tileset_Ground'],
  palette: corePalette,
  layers: {
    'Below Player': Array.from({ length: 14 }, () => Array(28).fill(g)),
    Objects: [
      { type: 'SpawnPoint', name: 'from_nena_suli', at: [2, 6] },
      {
        type: 'NPC',
        name: 'jan-kala-lili',
        at: [7, 9],
        props: { id: 'jan_kala_lili', dialog_id: 'jan_kala_lili_flavor' },
      },
      {
        type: 'NPC',
        name: 'jan-moku-pona',
        at: [12, 5],
        props: { id: 'jan_moku_pona', dialog_id: 'jan_moku_pona_grill' },
      },
      {
        type: 'NPC',
        name: 'jan-kala-suli',
        at: [17, 9],
        props: { id: 'jan_kala_suli', dialog_id: 'jan_kala_suli_tuneup' },
      },
      {
        type: 'NPC',
        name: 'jan-olin-telo',
        at: [22, 5],
        props: { id: 'jan_olin_telo', dialog_id: 'jan_olin_telo_quiet' },
      },
      {
        type: 'Trigger',
        name: 'final_boss_trigger',
        rect: [26, 5, 2, 3],
        props: {
          target_event: 'green_dragon',
          required_flag: 'badges_all_four',
        },
      },
    ],
    Encounters: [
      { rect: [4, 10, 5, 3], species: { jan_moli: 20, kon_moli: 15, telo_jaki: 15, kala_telo: 15, kala_uta: 15, kala_tomo: 15, jan_moli_wawa: 5 }, levelRange: [7, 10] },
      { rect: [14, 10, 6, 3], species: { jan_moli: 15, kon_moli: 15, telo_jaki: 15, kala_telo: 15, kala_luka: 15, kala_uta: 15, seli_moli: 5, akesi_suli: 5 }, levelRange: [9, 13] },
    ],
  },
});
