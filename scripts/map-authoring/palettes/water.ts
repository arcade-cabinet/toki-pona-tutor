/**
 * Riverside palette from the Fan-tasy `seasons` pack.
 *
 * Local IDs come from the pack's Seasons Shore sample via `pnpm author:inspect`.
 * `w` deliberately uses a water tile with a Tiled objectgroup so the runtime
 * treats the river as blocked terrain.
 */
import type { Palette } from '../lib/types';

export const waterPalette: Palette = {
  // Ground + shoreline.
  g: { tsx: 'seasons/Tileset_Ground_Seasons', local_id: 50, description: 'summer riverside grass' },
  f: { tsx: 'seasons/Tileset_Ground_Seasons', local_id: 56, description: 'darker riverside grass' },
  v: { tsx: 'seasons/Tileset_Ground_Seasons', local_id: 62, description: 'light riverside grass variation' },
  d: { tsx: 'seasons/Tileset_Road', local_id: 20, description: 'packed dirt river path' },
  s: { tsx: 'seasons/Tileset_Sand', local_id: 0, description: 'pale sand shore' },

  // Encounter grass.
  G: { tsx: 'seasons/Tileset_TallGrass', local_id: 0, description: 'summer tall grass encounter tile' },

  // Deep water. Local tile 26 has a full-tile Tiled collision object.
  w: { tsx: 'seasons/Tileset_Water', local_id: 26, description: 'blocked animated river water' },
};
