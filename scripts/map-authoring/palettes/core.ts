/**
 * Palette for Fan-tasy `core` pack (default overworld library).
 *
 * Populated bottom-up as specs need tiles — see
 * docs/build-time/MAP_AUTHORING.md § "Palette seed data".
 *
 * To discover local_ids: run `pnpm author:inspect <tileset> <sample-map>`
 * against the Fan-tasy sample maps (Village Bridge, Farm Shore, etc.)
 * and pick the most-used tile for the effect you want.
 */
import type { Palette } from '../lib/types';

export const corePalette: Palette = {
  // Ground — single-char keys for compact paint grids.
  // local_id 0 is the top-left tile of Tileset_Ground. Fan-tasy's author
  // arranges ground tilesets so 0 is usually "basic grass" — Fan-tasy
  // specifically places "Grass" as the first atlas row.
  g: { tsx: 'core/Tileset_Ground', local_id: 0, description: 'grass base' },

  // Tall grass — the encounter tile.
  G: { tsx: 'Tileset_TallGrass', local_id: 0, description: 'tall grass (encounter)' },

  // Sand (for beaches / paths in village settings).
  s: { tsx: 'Tileset_Sand', local_id: 0, description: 'sand' },

  // Water.
  w: { tsx: 'Tileset_Water', local_id: 0, description: 'water' },

  // Dirt road / path.
  d: { tsx: 'Tileset_Road', local_id: 0, description: 'dirt road' },

  // Shadow base (used under trees + building eaves). `h` keeps the
  // 1-2 char paint-grid convention; `shadow` is the long-name alias
  // for use in `place` entries where readability beats compactness.
  h: { tsx: 'Tileset_Shadow', local_id: 0, description: 'shadow' },
  shadow: { tsx: 'Tileset_Shadow', local_id: 0, description: 'shadow' },
};
