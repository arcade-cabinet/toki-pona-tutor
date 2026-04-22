/**
 * beat_01_ma_tomo_lili — starter village.
 *
 * Minimal 16×12 grass plot for the pivot: jan Sewi stands near center
 * (triggers the starter ceremony); a warp object on the east edge
 * points at nasin_wan but is gated on the `starter_chosen` flag by the
 * runtime Warp() event (src/modules/main/warp.ts).
 *
 * The village now carries the T4-15 floor of five authored NPCs:
 * jan Sewi plus four ambient villagers around the home plot.
 */
import { defineMap } from '../lib/spec-helpers';
import { corePalette } from '../palettes/core';

const g = 'g';

export default defineMap({
  id: 'ma_tomo_lili',
  biome: 'town',
  music_track: 'bgm_village',
  width: 16,
  height: 12,
  tileSize: 16,
  tilesets: ['core/Tileset_Ground'],
  palette: corePalette,
  layers: {
    'Below Player': Array.from({ length: 12 }, () => Array(16).fill(g)),
    Objects: [
      { type: 'SpawnPoint', name: 'default', at: [7, 5] },
      {
        type: 'NPC',
        name: 'jan-pona-tomo',
        at: [4, 4],
        props: { id: 'jan_pona_tomo', dialog_id: 'jan_pona_tomo_welcome' },
      },
      {
        type: 'NPC',
        name: 'jan-telo-well',
        at: [3, 8],
        props: { id: 'jan_telo_well', dialog_id: 'jan_telo_well_water' },
      },
      {
        type: 'NPC',
        name: 'jan-sewi',
        at: [10, 6],
        props: { id: 'jan_sewi', dialog_id: 'jan_sewi_starter_intro' },
      },
      {
        type: 'NPC',
        name: 'jan-poki-tomo',
        at: [3, 5],
        props: { id: 'jan_poki_tomo', dialog_id: 'jan_poki_tomo_ready' },
      },
      {
        type: 'NPC',
        name: 'jan-kili-tomo',
        at: [6, 9],
        props: { id: 'jan_kili_tomo', dialog_id: 'jan_kili_tomo_snack' },
      },
      {
        type: 'Warp',
        name: 'warp_east',
        rect: [15, 5, 1, 1],
        props: {
          target_map: 'nasin_wan',
          target_spawn: 'from_tomo',
          required_flag: 'starter_chosen',
        },
      },
    ],
  },
});
