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
 * Grass base throughout for now; V9 can paint a proper stone path
 * once the palette gains a stone tile.
 */
import { defineMap } from '../lib/spec-helpers';
import { corePalette } from '../palettes/core';

const g = 'g';

export default defineMap({
  id: 'nena_sewi',
  width: 32,
  height: 14,
  tileSize: 16,
  tilesets: ['core/Tileset_Ground'],
  palette: corePalette,
  layers: {
    'Below Player': Array.from({ length: 14 }, () => Array(32).fill(g)),
    Objects: [
      { type: 'SpawnPoint', name: 'from_nasin_wan', at: [1, 7] },
      {
        type: 'NPC',
        name: 'jan-kala',
        at: [10, 8],
        props: { id: 'jan_kala', dialog_id: 'jan_kala_rest' },
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
      { rect: [4, 4, 4, 2], species: { jan_wawa: 45, jan_wawa_linja: 30, sijelo_kiwen: 25 }, levelRange: [6, 8] },
      { rect: [14, 10, 6, 3], species: { jan_wawa: 35, jan_wawa_linja: 35, sijelo_kiwen: 30 }, levelRange: [7, 9] },
    ],
  },
});
