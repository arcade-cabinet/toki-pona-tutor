/**
 * Mountain-pass palette from the Fan-tasy `seasons` pack.
 *
 * The gray rock-slope entry intentionally carries Tiled collision data so
 * cliff cells block traversal instead of being decorative paint.
 */
import type { Palette } from '../lib/types';

export const mountainPalette: Palette = {
  g: { tsx: 'seasons/Tileset_Ground_Seasons', local_id: 50, description: 'highland grass' },
  v: { tsx: 'seasons/Tileset_Ground_Seasons', local_id: 56, description: 'dark highland grass' },
  d: { tsx: 'seasons/Tileset_Road', local_id: 20, description: 'packed dirt mountain path' },
  p: { tsx: 'seasons/Tileset_Road', local_id: 272, description: 'stone peak path' },
  G: { tsx: 'seasons/Tileset_TallGrass', local_id: 0, description: 'mountain encounter grass' },
  c: { tsx: 'seasons/Tileset_RockSlope_2_Gray', local_id: 194, description: 'blocked gray cliff wall' },

  tree_high: { tsx: 'seasons/Objects_Trees_Seasons', local_id: 113, description: 'birch highland tree' },
  tree_low: { tsx: 'seasons/Objects_Trees_Seasons', local_id: 0, description: 'emerald highland tree' },
  bush_high: { tsx: 'seasons/Objects_Trees_Seasons', local_id: 52, description: 'leafy highland bush' },
  rock_small: { tsx: 'seasons/Objects_Rocks_Seasons', local_id: 20, description: 'small gray rock' },
  rock_tall: { tsx: 'seasons/Objects_Rocks_Seasons', local_id: 42, description: 'tall gray rock' },
  rock_grass: { tsx: 'seasons/Objects_Rocks_Seasons', local_id: 65, description: 'mossy gray rock' },
};
