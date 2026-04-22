/**
 * Mountain-pass palette from the Fan-tasy `seasons` pack.
 *
 * The gray rock-slope entry intentionally carries Tiled collision data so
 * cliff cells block traversal instead of being decorative paint.
 */
import type { Palette } from '../lib/types';
import { collectionAtlasEntry } from '../config/collection-atlases';

const seasonsTrees = 'seasons/Objects_Trees_Seasons';
const seasonsRocks = 'seasons/Objects_Rocks_Seasons';

export const mountainPalette: Palette = {
  g: { tsx: 'seasons/Tileset_Ground_Seasons', local_id: 50, description: 'highland grass' },
  v: { tsx: 'seasons/Tileset_Ground_Seasons', local_id: 56, description: 'dark highland grass' },
  d: { tsx: 'seasons/Tileset_Road', local_id: 20, description: 'packed dirt mountain path' },
  p: { tsx: 'seasons/Tileset_Road', local_id: 272, description: 'stone peak path' },
  G: { tsx: 'seasons/Tileset_TallGrass', local_id: 0, description: 'mountain encounter grass' },
  c: { tsx: 'seasons/Tileset_RockSlope_2_Gray', local_id: 194, description: 'blocked gray cliff wall' },

  tree_high: { ...collectionAtlasEntry(seasonsTrees, 113), description: 'birch highland tree' },
  tree_low: { ...collectionAtlasEntry(seasonsTrees, 0), description: 'emerald highland tree' },
  bush_high: { ...collectionAtlasEntry(seasonsTrees, 52), description: 'leafy highland bush' },
  rock_small: { ...collectionAtlasEntry(seasonsRocks, 20), description: 'small gray rock' },
  rock_tall: { ...collectionAtlasEntry(seasonsRocks, 42), description: 'tall gray rock' },
  rock_grass: { ...collectionAtlasEntry(seasonsRocks, 65), description: 'mossy gray rock' },
};
