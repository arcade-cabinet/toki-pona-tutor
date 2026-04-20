/**
 * Palette for Fan-tasy `core` pack (default overworld library).
 *
 * Populated bottom-up as specs need tiles — see
 * docs/build-time/MAP_AUTHORING.md § "Palette seed data".
 *
 * Local IDs were harvested via `pnpm author:inspect <tileset> <sample-map>`
 * against Fan-tasy's bundled samples (Village Bridge, Farm Shore,
 * Mage Tower) and by sampling the source PNGs directly.
 *
 * MIGRATION (PR #64, L1 foundation):
 *   - `G` was previously the tall-grass encounter tile (PR #62 / Stage 0).
 *     L1 needed visual texture variants for plain grass, and tall grass
 *     wanted a more readable lowercase symbol, so:
 *       `G` → grass variant (was tall grass)
 *       `t` → tall grass interior (new — was previously unmapped)
 *     Only `hello_map.ts` existed at the time of the rename, and it does
 *     not reference `G` or `t`, so the migration is a no-op for current
 *     specs. New specs (ma_tomo_lili.ts) use the new mapping directly.
 */
import type { Palette } from '../lib/types';

export const corePalette: Palette = {
  // ── Ground ──────────────────────────────────────────────────────────
  // Plain grass — Tileset_Ground local_id 50 is the most-used "basic
  // grass" tile in Fan-tasy's Village Bridge sample. It's the safe
  // fill tile for an overworld field.
  g: { tsx: 'core/Tileset_Ground', local_id: 50, description: 'grass base' },
  // Two more grass variants for visual texture in `paint` grids.
  G: { tsx: 'core/Tileset_Ground', local_id: 56, description: 'grass variant a' },
  H: { tsx: 'core/Tileset_Ground', local_id: 62, description: 'grass variant b' },

  // Tall grass — wang-tile interior fill from Tileset_TallGrass.
  // local_id 7 is the center cell of the autotile (full coverage),
  // visually a uniform dark-green grass clump used for encounter zones.
  t: { tsx: 'core/Tileset_TallGrass', local_id: 7, description: 'tall grass interior (encounter)' },

  // Water — Tileset_Water local_id 25 is the deep-water interior cell
  // of its wang autotile.
  w: { tsx: 'core/Tileset_Water', local_id: 25, description: 'water deep' },

  // Sand path — Tileset_Sand local_id 50 is plain sand interior.
  // Used for the village's main thoroughfare.
  s: { tsx: 'core/Tileset_Sand', local_id: 50, description: 'sand path' },

  // Shadow — Tileset_Shadow local_id 0. Used as a soft ground accent.
  // Long-name alias for `place` callers that prefer readability.
  h: { tsx: 'core/Tileset_Shadow', local_id: 0, description: 'shadow' },
  shadow: { tsx: 'core/Tileset_Shadow', local_id: 0, description: 'shadow' },
};
