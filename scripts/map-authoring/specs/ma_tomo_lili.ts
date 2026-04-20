/**
 * beat_01_ma_tomo_lili — starter village.
 *
 * Minimal 16×12 grass plot for the pivot: jan Sewi stands near center
 * (triggers the starter ceremony); a warp object on the east edge
 * points at nasin_wan but is gated on the `starter_chosen` flag by the
 * runtime Warp() event (src/modules/main/warp.ts).
 *
 * The journey narrative (docs/JOURNEY.md beat 1) calls for two more
 * NPCs (jan Pona in the upper plaza, jan Telo at the well) — they'll
 * land when their dialog spines are authored.
 */
import { defineMap } from '../lib/spec-helpers';
import { corePalette } from '../palettes/core';

const g = 'g';

export default defineMap({
  id: 'ma_tomo_lili',
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
        name: 'jan-sewi',
        at: [10, 6],
        props: { id: 'jan_sewi', dialog_id: 'jan_sewi_starter_intro' },
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
