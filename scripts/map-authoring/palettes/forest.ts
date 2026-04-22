/**
 * Summer forest palette from the Fan-tasy `seasons` pack.
 *
 * Local IDs come from the pack's Cherry Hill sample via `pnpm author:inspect`.
 */
import type { Palette } from '../lib/types';

export const forestPalette: Palette = {
  // Ground + path.
  g: { tsx: 'seasons/Tileset_Ground_Seasons', local_id: 50, description: 'summer forest grass' },
  f: { tsx: 'seasons/Tileset_Ground_Seasons', local_id: 56, description: 'darker summer forest grass' },
  v: { tsx: 'seasons/Tileset_Ground_Seasons', local_id: 62, description: 'light forest grass variation' },
  d: { tsx: 'seasons/Tileset_Road', local_id: 20, description: 'soft dirt forest trail' },

  // Encounter grass.
  G: { tsx: 'seasons/Tileset_TallGrass', local_id: 0, description: 'summer tall grass encounter tile' },

  // Tree and underbrush collection images.
  tree_a: { tsx: 'seasons/Objects_Trees_Seasons', local_id: 0, description: 'emerald tree 2' },
  tree_b: { tsx: 'seasons/Objects_Trees_Seasons', local_id: 1, description: 'emerald tree 3' },
  tree_c: { tsx: 'seasons/Objects_Trees_Seasons', local_id: 2, description: 'emerald tree 4' },
  tree_wide: { tsx: 'seasons/Objects_Trees_Seasons', local_id: 32, description: 'wide emerald tree' },
  tree_big: { tsx: 'seasons/Objects_Trees_Seasons', local_id: 82, description: 'large emerald tree' },
  bush_a: { tsx: 'seasons/Objects_Trees_Seasons', local_id: 14, description: 'emerald bush 1' },
  bush_b: { tsx: 'seasons/Objects_Trees_Seasons', local_id: 16, description: 'emerald bush 3' },
  bush_leaf: { tsx: 'seasons/Objects_Trees_Seasons', local_id: 52, description: 'leafy emerald bush' },
};
