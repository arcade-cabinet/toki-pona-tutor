/**
 * beat_04_ma_telo — lake village.
 *
 * Round village on a stone island in the middle of a lake. Deliberately
 * NO tall grass — this is a story + shop beat, not an encounter zone.
 * The player catches their breath between the first gym (jan Wawa) and
 * the type-wrinkle fight against jan Telo.
 *
 * 20×16 island-in-water suggested by the grass base for the village
 * proper plus water borders (when the water palette entry lands).
 * For now, plain grass — the stone-and-water aesthetic comes in V12
 * once the palette grows the stone tile.
 */
import { defineMap } from '../lib/spec-helpers';
import { corePalette } from '../palettes/core';

const g = 'g';

export default defineMap({
  id: 'ma_telo',
  width: 20,
  height: 16,
  tileSize: 16,
  tilesets: ['core/Tileset_Ground'],
  palette: corePalette,
  layers: {
    'Below Player': Array.from({ length: 16 }, () => Array(20).fill(g)),
    Objects: [
      { type: 'SpawnPoint', name: 'from_nena_sewi', at: [2, 6] },
      {
        type: 'NPC',
        name: 'jan-kala-lake',
        at: [5, 13],
        props: { id: 'jan_kala_lake', dialog_id: 'jan_kala_lake_quest' },
      },
      {
        type: 'NPC',
        name: 'jan-moku',
        at: [8, 4],
        props: { id: 'jan_moku', dialog_id: 'jan_moku_stall' },
      },
      {
        type: 'NPC',
        name: 'jan-telo',
        at: [15, 8],
        props: { id: 'jan_telo', dialog_id: 'jan_telo_intro' },
      },
      {
        type: 'Warp',
        name: 'warp_north',
        rect: [15, 0, 1, 1],
        props: {
          target_map: 'ma_lete',
          target_spawn: 'from_ma_telo',
          required_flag: 'badge_telo',
        },
      },
    ],
  },
});
